import Phaser from 'phaser';
import { GameState, createInitialGameState } from '../types/GameState';
import { UnitConfig } from '../types/Unit';
import { FloatingTextManager } from '../ui/FloatingText';
import { HUD } from '../ui/HUD';
import { GameManager } from '../core/managers/GameManager';
import { ConfigLoader } from '../utils/ConfigLoader';
import { EconomySystem } from '../core/systems/EconomySystem';
import { AgeSystem } from '../core/systems/AgeSystem';
import { SpawnRequest } from '../core/systems/SpawnSystem';
import { ParticleManager } from '../rendering/ParticleManager';
import { JuiceManager } from '../rendering/JuiceManager';
import { ProceduralSpriteFactory } from '../rendering/ProceduralSpriteFactory';
import { BaseRenderer } from '../rendering/BaseRenderer';
import { TurretRenderer } from '../rendering/TurretRenderer';
import { BackgroundRenderer } from '../rendering/BackgroundRenderer';
import type { Position } from '../core/components/Position';
import type { Faction } from '../core/components/Faction';
import type { Renderable } from '../core/components/Renderable';
import type { UnitType as UnitTypeComponent } from '../core/components/UnitType';
import type { UnitType } from '../types/Unit';
import type { Health } from '../core/components/Health';
import type { HeroComponent } from '../core/components/Hero';

// Phase 3 imports
import { HeroManager, HeroConfigMap } from '../core/managers/HeroManager';
import { TechTreeManager, TechTreeConfig } from '../core/managers/TechTreeManager';
import { TerrainManager, TerrainConfigMap } from '../core/managers/TerrainManager';
import { TurretManager, TurretConfigMap } from '../core/managers/TurretManager';
import { HeroSystem } from '../core/systems/HeroSystem';
import { TerrainSystem } from '../core/systems/TerrainSystem';
import { WeatherSystem, WeatherFile } from '../core/systems/WeatherSystem';
import { FormationSystem } from '../core/systems/FormationSystem';
import { TurretSystem } from '../core/systems/TurretSystem';
import { AbilitySystem, AbilityConfigMap } from '../core/systems/AbilitySystem';
import { LifetimeSystem } from '../core/systems/LifetimeSystem';
import { AIDirector, Difficulty } from '../ai/AIDirector';
import { SettingsManager } from '../core/managers/SettingsManager';
import { AudioManager } from '../audio/AudioManager';
import { CampaignManager, MissionConfig } from '../core/managers/CampaignManager';

// Config JSON imports
import heroesJson from '../config/heroes.json';
import techtreeJson from '../config/techtree.json';
import terrainJson from '../config/terrain.json';
import weatherJson from '../config/weather.json';
import turretsJson from '../config/turrets.json';
import abilitiesJson from '../config/abilities.json';

/**
 * Size (w, h) per unit archetype — matches ProceduralSpriteFactory sizes.
 */
const UNIT_SIZES: Record<string, [number, number]> = {
  infantry: [16, 24],
  ranged: [14, 24],
  heavy: [24, 32],
  special: [20, 28],
  hero: [32, 40],
};

/** Fallback color per faction (used only when texture not available). */
const FACTION_COLORS: Record<string, number> = {
  player: 0x4488ff,
  enemy: 0xff4444,
};

/** Hero ID by age number. */
const HERO_IDS: Record<number, string> = {
  1: 'grok',
  2: 'sargon',
  3: 'leonidas',
  4: 'joan_of_arc',
  5: 'napoleon',
  6: 'iron_baron',
  7: 'commander_steele',
  8: 'axiom_7',
};

/** Age names for the evolution transition display. */
const AGE_NAMES: Record<number, string> = {
  1: 'Prehistoric',
  2: 'Bronze Age',
  3: 'Classical',
  4: 'Medieval',
  5: 'Gunpowder',
  6: 'Industrial',
  7: 'Modern',
  8: 'Future',
};

/**
 * GameScene — the main battlefield scene.
 *
 * Uses the real ECS engine via GameManager, ConfigLoader,
 * EconomySystem, and AgeSystem for all game logic.
 */
export class GameScene extends Phaser.Scene {
  // ── Audio ──
  private audioManager!: AudioManager;

  // ── ECS & managers ──
  private gameManager!: GameManager;
  private configLoader!: ConfigLoader;
  private playerEconomy!: EconomySystem;
  private enemyEconomy!: EconomySystem;
  private playerAgeSystem!: AgeSystem;
  private enemyAgeSystem!: AgeSystem;

  // ── Phase 3 systems & managers ──
  private heroManager!: HeroManager;
  private heroSystem!: HeroSystem;
  private techTreeManager!: TechTreeManager;
  private terrainManager!: TerrainManager;
  private terrainSystem!: TerrainSystem;
  private weatherSystem!: WeatherSystem;
  private formationSystem!: FormationSystem;
  private playerTurretManager!: TurretManager;
  private enemyTurretManager!: TurretManager;
  private turretSystem!: TurretSystem;
  private abilitySystem!: AbilitySystem;
  private lifetimeSystem!: LifetimeSystem;
  private aiDirector!: AIDirector;

  // ── Terrain zone visuals ──
  private terrainZoneGraphics: Phaser.GameObjects.Graphics[] = [];
  private terrainZoneLabels: Phaser.GameObjects.Text[] = [];

  // ── Weather overlay ──
  private weatherOverlay!: Phaser.GameObjects.Graphics;
  private weatherText!: Phaser.GameObjects.Text;

  // ── Turret visuals ──
  private turretRects: Map<number, Phaser.GameObjects.Rectangle> = new Map();
  private turretImages: Map<number, Phaser.GameObjects.Image> = new Map();

  // ── Hero visual ──
  private heroRect: Phaser.GameObjects.Rectangle | null = null;
  private heroImage: Phaser.GameObjects.Image | null = null;
  private heroGlow: Phaser.GameObjects.Rectangle | null = null;
  private heroEntityId: number | null = null;

  // ── Last known player age (for background/base update) ──
  private lastRenderedPlayerAge: number = 0;
  private lastRenderedEnemyAge: number = 0;

  // ── State ──
  private gameState!: GameState;
  private floatingText!: FloatingTextManager;

  // ── Particles & Juice ──
  private particles!: ParticleManager;
  private juice!: JuiceManager;

  // ── Procedural renderers ──
  private spriteFactory!: ProceduralSpriteFactory;
  private baseRenderer!: BaseRenderer;
  private turretRendererFactory!: TurretRenderer;
  private backgroundRenderer!: BackgroundRenderer;

  // ── Phaser sprite pool: ECS entityId → Phaser image ──
  private entitySprites: Map<number, Phaser.GameObjects.Image> = new Map();

  // ── Phaser rectangle pool (legacy fallback): ECS entityId → Phaser rectangle ──
  private entityRects: Map<number, Phaser.GameObjects.Rectangle> = new Map();

  // ── Reusable set for tracking alive entities each frame (avoids GC pressure) ──
  private readonly aliveIdsSet: Set<number> = new Set();

  // ── Bases ──
  private playerBase!: Phaser.GameObjects.Rectangle;
  private enemyBase!: Phaser.GameObjects.Rectangle;
  private playerBaseImage: Phaser.GameObjects.Image | null = null;
  private enemyBaseImage: Phaser.GameObjects.Image | null = null;
  private playerBaseDetails!: Phaser.GameObjects.Graphics;
  private enemyBaseDetails!: Phaser.GameObjects.Graphics;
  private playerFlag!: Phaser.GameObjects.Rectangle;
  private enemyFlag!: Phaser.GameObjects.Rectangle;
  private playerFlagPole!: Phaser.GameObjects.Rectangle;
  private enemyFlagPole!: Phaser.GameObjects.Rectangle;
  private baseCrackGraphics!: Phaser.GameObjects.Graphics;
  private playerBaseDamageImage: Phaser.GameObjects.Image | null = null;
  private enemyBaseDamageImage: Phaser.GameObjects.Image | null = null;

  // ── Ground ──
  private ground!: Phaser.GameObjects.Graphics;

  // ── Parallax clouds ──
  private clouds: { rect: Phaser.GameObjects.Rectangle; speed: number }[] = [];

  // ── Ground detail spots ──
  private groundDetails: Phaser.GameObjects.Rectangle[] = [];

  // ── Battle line indicator ──
  private battleLine!: Phaser.GameObjects.Rectangle;

  // ── Settings ──
  private settingsManager!: SettingsManager;
  private enemyColor: number = 0xff4444;
  private playerColor: number = 0x4488ff;

  // ── Screen effects (delegated to JuiceManager) ──
  public screenShakeEnabled: boolean = true;

  // ── Previous gold (for HUD flash) ──
  private lastPlayerGold: number = 0;

  // ── Previous base HP (for HUD damage flash) ──
  private lastPlayerBaseHp: number = 0;

  // ── Keys ──
  private keys!: {
    Q: Phaser.Input.Keyboard.Key;
    W: Phaser.Input.Keyboard.Key;
    E: Phaser.Input.Keyboard.Key;
    R: Phaser.Input.Keyboard.Key;
    T: Phaser.Input.Keyboard.Key;
    SPACE: Phaser.Input.Keyboard.Key;
    ONE: Phaser.Input.Keyboard.Key;
    TWO: Phaser.Input.Keyboard.Key;
    ESC: Phaser.Input.Keyboard.Key;
  };

  // ── Difficulty (passed from MainMenu via scene data) ──
  private difficulty: 'easy' | 'normal' | 'hard' = 'normal';

  // ── Campaign mode ──
  private mode: 'classic' | 'campaign' = 'classic';
  private missionId?: number;
  private currentMission?: MissionConfig;
  private campaignManager?: CampaignManager;
  private campaignStars?: number;
  private turretsDisabled = false;
  private passiveIncomeDisabled = false;
  private evolutionLocked = false;

  // ── Constants ──
  private static readonly GROUND_Y = 560;
  private static readonly PLAYER_BASE_X = 80;
  private static readonly ENEMY_BASE_X = 1200;

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data?: { difficulty?: 'easy' | 'normal' | 'hard'; mode?: 'classic' | 'campaign'; missionId?: number }): void {
    this.difficulty = data?.difficulty ?? 'normal';
    this.mode = data?.mode ?? 'classic';
    this.missionId = data?.missionId;

    // Reset campaign state
    this.currentMission = undefined;
    this.campaignManager = undefined;
    this.campaignStars = undefined;
    this.turretsDisabled = false;
    this.passiveIncomeDisabled = false;
    this.evolutionLocked = false;

    // Reset hero visual references (old GOs are destroyed by scene restart)
    this.heroImage = null;
    this.heroGlow = null;
    this.heroRect = null;
    this.heroEntityId = null;

    // Reset rendered age trackers so textures are reapplied
    this.lastRenderedPlayerAge = 0;
    this.lastRenderedEnemyAge = 0;
  }

  create(): void {
    this.gameState = createInitialGameState();

    // ── Settings ──
    this.settingsManager = SettingsManager.getInstance();

    // ── Colorblind mode: adjust enemy color ──
    const cbMode = this.settingsManager.get('colorblindMode');
    switch (cbMode) {
      case 'deuteranopia': // Red-green: change red to orange
        this.enemyColor = 0xFFAA00;
        break;
      case 'protanopia': // Red weakness: change red to magenta/purple
        this.enemyColor = 0xCC66FF;
        break;
      case 'tritanopia': // Blue-yellow: change blue player to green, keep red enemy
        this.playerColor = 0x44FF44;
        this.enemyColor = 0xFF4444;
        break;
      default:
        this.enemyColor = 0xFF4444;
        break;
    }
    FACTION_COLORS.player = this.playerColor;

    // ── Instantiate ECS engine ──
    this.configLoader = new ConfigLoader();
    this.gameManager = new GameManager();

    // ── Economy systems (one per side) ──
    this.playerEconomy = new EconomySystem(this.gameState.player.gold, 1);
    this.enemyEconomy = new EconomySystem(this.gameState.enemy.gold, 1);

    // ── Age systems ──
    this.playerAgeSystem = new AgeSystem(this.configLoader, this.playerEconomy, 1);
    this.enemyAgeSystem = new AgeSystem(this.configLoader, this.enemyEconomy, 1);

    // Set initial base HP from age system
    const initialBaseHp = this.playerAgeSystem.getBaseHp();
    this.gameState.player.baseHp = initialBaseHp;
    this.gameState.player.baseMaxHp = initialBaseHp;
    this.gameState.enemy.baseHp = initialBaseHp;
    this.gameState.enemy.baseMaxHp = initialBaseHp;

    // Apply difficulty multiplier to enemy base HP
    const difficultyHpMultiplier: Record<string, number> = { easy: 0.7, normal: 1, hard: 1.4 };
    const mult = difficultyHpMultiplier[this.difficulty] ?? 1;
    this.gameState.enemy.baseMaxHp = Math.round(this.gameState.enemy.baseMaxHp * mult);
    this.gameState.enemy.baseHp = this.gameState.enemy.baseMaxHp;

    // Sync base HP into GameManager so its game-over checks use the correct values
    this.gameManager.setPlayerBaseHp(this.gameState.player.baseHp);
    this.gameManager.setEnemyBaseHp(this.gameState.enemy.baseHp);

    // ── Phase 3: Hero Manager + Hero System ──
    const heroConfigs = (heroesJson as unknown as { heroes: HeroConfigMap }).heroes;
    this.heroManager = new HeroManager(
      this.gameManager.world,
      this.gameManager.spatialGrid,
      heroConfigs,
    );
    this.heroSystem = new HeroSystem(
      this.gameManager.spatialGrid,
      this.gameManager.events,
      this.heroManager,
    );
    this.heroSystem.setWorldRef(this.gameManager.world);

    // ── Phase 3: Tech Tree Manager ──
    this.techTreeManager = new TechTreeManager(techtreeJson as TechTreeConfig);

    // ── Phase 3: Terrain Manager + Terrain System ──
    const terrainConfigs = (terrainJson as { terrains: TerrainConfigMap }).terrains;
    this.terrainManager = new TerrainManager(
      this.gameManager.world,
      terrainConfigs,
    );
    this.terrainSystem = new TerrainSystem(this.terrainManager);

    // Generate random terrain for this match
    this.terrainManager.generateTerrain();

    // ── Phase 3: Weather System ──
    this.weatherSystem = new WeatherSystem(
      this.gameManager.events,
      weatherJson as WeatherFile,
    );

    // ── Phase 3: Formation System ──
    this.formationSystem = new FormationSystem();

    // ── Phase 3: Turret Manager + Turret System ──
    const turretConfigs = (turretsJson as { turrets: TurretConfigMap }).turrets;
    this.playerTurretManager = new TurretManager(
      this.gameManager.world,
      this.gameManager.spatialGrid,
      this.playerEconomy,
      'player',
      turretConfigs,
    );
    this.enemyTurretManager = new TurretManager(
      this.gameManager.world,
      this.gameManager.spatialGrid,
      this.enemyEconomy,
      'enemy',
      turretConfigs,
    );
    this.turretSystem = new TurretSystem(
      this.gameManager.spatialGrid,
      this.gameManager.events,
    );

    // ── Phase 3: Ability System + Lifetime System ──
    const abilityConfigs = (abilitiesJson as { abilities: AbilityConfigMap }).abilities;
    this.abilitySystem = new AbilitySystem(
      this.gameManager.spatialGrid,
      this.gameManager.events,
      abilityConfigs,
    );
    this.lifetimeSystem = new LifetimeSystem();

    // ── Phase 3: AI Director (replaces simple enemy AI) ──
    this.aiDirector = new AIDirector(
      this.gameManager.world,
      this.gameManager.spatialGrid,
      this.enemyEconomy,
      this.enemyAgeSystem,
      this.abilitySystem,
      this.enemyTurretManager,
      this.gameManager.spawnSystem,
      this.configLoader,
      this.difficulty as Difficulty,
    );

    // ── Deploy initial hero (age 1) for player ──
    this.heroEntityId = this.heroManager.deployHero('player', 1);

    // ── Auto-build one turret in slot 0 at game start (skip if turrets disabled) ──
    if (!this.turretsDisabled) {
      const age1TurretIds = this.playerAgeSystem.getAvailableTurretIds();
      const antiInfantryTurret = age1TurretIds.find((id) => {
        const cfg = this.playerTurretManager.getTurretConfig(id);
        return cfg && cfg.category === 'anti_infantry';
      }) ?? age1TurretIds[0];
      if (antiInfantryTurret) {
        this.playerTurretManager.buildTurret(0, antiInfantryTurret);
      }
    }

    // ── Campaign mode setup ──
    if (this.mode === 'campaign' && this.missionId != null) {
      this.campaignManager = new CampaignManager();
      this.currentMission = this.campaignManager.getMission(this.missionId);
      if (this.currentMission) {
        // Apply start age: evolve both sides to the mission's starting age
        if (this.currentMission.startAge && this.currentMission.startAge > 1) {
          for (let i = 1; i < this.currentMission.startAge; i++) {
            this.playerEconomy.addXP(9999);
            this.playerAgeSystem.evolve();
            this.enemyEconomy.addXP(9999);
            this.enemyAgeSystem.evolve();
          }
          // Sync age into game state
          this.gameState.player.currentAge = this.playerAgeSystem.getCurrentAge();
          this.gameState.enemy.currentAge = this.enemyAgeSystem.getCurrentAge();
          // Update base HP for new age
          const newBaseHp = this.playerAgeSystem.getBaseHp();
          this.gameState.player.baseMaxHp = newBaseHp;
          this.gameState.player.baseHp = newBaseHp;
          this.gameState.enemy.baseMaxHp = Math.round(newBaseHp * (difficultyHpMultiplier[this.difficulty] ?? 1));
          this.gameState.enemy.baseHp = this.gameState.enemy.baseMaxHp;
          this.gameManager.setPlayerBaseHp(this.gameState.player.baseHp);
          this.gameManager.setEnemyBaseHp(this.gameState.enemy.baseHp);
          // Redeploy hero for new age
          this.heroEntityId = this.heroManager.onAgeUp('player', this.playerAgeSystem.getCurrentAge());
        }
        // Apply mission difficulty override
        if (this.currentMission.difficulty) {
          const missionDiff = this.currentMission.difficulty === 'medium' ? 'normal' : this.currentMission.difficulty;
          this.difficulty = missionDiff as 'easy' | 'normal' | 'hard';
        }
        // Apply campaign modifiers
        this.applyCampaignModifiers(this.currentMission.modifiers || []);
      }
    }

    // ── Wire ECS events ──
    this.wireEvents();

    // Share game state with HUD via the data manager
    this.data.set('gameState', this.gameState);

    // Clear any leftover entity rects/sprites from a previous game
    this.entityRects = new Map();
    this.entitySprites = new Map();

    // ── Procedural sprite generation ──
    this.spriteFactory = new ProceduralSpriteFactory(this);
    this.spriteFactory.generateAll();

    this.baseRenderer = new BaseRenderer(this);
    this.baseRenderer.generateAll();

    this.turretRendererFactory = new TurretRenderer(this);
    this.turretRendererFactory.generateAll();

    this.backgroundRenderer = new BackgroundRenderer(this);
    this.backgroundRenderer.generateAll();

    // ── Particle manager ──
    this.particles = new ParticleManager(this);

    // ── Juice manager (hit-stop, screen shake, combos, evolution cinematic, low HP) ──
    this.juice = new JuiceManager(this);
    this.juice.shakeEnabled = this.screenShakeEnabled;
    // Wire particle callbacks so JuiceManager can trigger effects without circular deps
    this.juice.onSpawnGoldParticles = (x, y) => {
      for (let i = 0; i < 5; i++) {
        this.particles.spawnMagicBurst(x + (Math.random() - 0.5) * 20, y, 0xFFD700);
      }
    };
    this.juice.onSpawnCelebrationParticles = (x, y) => {
      this.particles.spawnEvolutionCelebration(x, y);
    };
    this.juice.onSpawnComboParticles = (x, y) => {
      this.particles.spawnMagicBurst(x, y, 0xFFD700);
    };

    // Show initial background
    this.backgroundRenderer.showAge(1);
    this.lastRenderedPlayerAge = 1;
    this.lastRenderedEnemyAge = 1;

    // Draw the world
    this.createGround();
    this.createGroundDetails();
    this.createClouds();
    this.createBases();
    this.createBattleLine();
    this.juice.createLowHpOverlay();

    // Render terrain zones
    this.createTerrainZones();

    // Weather overlay + text
    this.createWeatherOverlay();

    // Render initial turrets
    this.renderTurrets();

    // Floating text manager
    this.floatingText = new FloatingTextManager(this);

    // Setup keyboard
    this.setupInput();

    // Track initial values for change detection
    this.lastPlayerGold = this.gameState.player.gold;
    this.lastPlayerBaseHp = this.gameState.player.baseHp;

    // Reset combo state in juice manager
    this.juice.resetCombo();

    // Launch HUD overlay scene
    this.scene.launch('HUD');

    // Push initial unit defs to HUD after it's created
    this.time.delayedCall(50, () => {
      this.pushUnitDefsToHUD();
    });

    // ── Audio ──
    this.audioManager = AudioManager.getInstance();
    // Unlock AudioContext on first user interaction (browser autoplay policy)
    this.input.once('pointerdown', () => this.audioManager.resumeContext());
    // Start age-1 music
    this.audioManager.playMusic(1);
  }

  // ─────────────────────── EVENT WIRING ───────────────────────

  private wireEvents(): void {
    // Death events: earn gold/xp for kills
    this.gameManager.events.on('death', (e) => {
      if (e.faction === 'enemy') {
        // Player killed an enemy — player earns rewards
        const reward = this.playerEconomy.earnFromKill(
          e.unitType as UnitType,
          this.enemyAgeSystem.getCurrentAge()
        );
        // Show floating gold text at the unit's last known position
        const pos = this.gameManager.world.getComponent<Position>(e.entityId, 'Position');
        if (pos) {
          const screenX = this.ecsXToScreen(pos.x);
          const screenY = GameScene.GROUND_Y - 30;
          if (this.settingsManager.get('damageNumbers')) {
            this.floatingText.spawnGold(screenX, screenY, reward.gold);
          }

          // Death particles — choose effect by unit type
          const archetype = e.unitType ?? 'infantry';
          if (archetype === 'heavy' || archetype === 'hero') {
            // Heavy/hero: large explosion + screen shake + hit-stop
            this.particles.spawnLargeExplosion(screenX, screenY);
            this.juice.shakeForDeath(archetype);
            this.juice.hitStopHeavyDeath();
          } else if (archetype === 'special') {
            // Special: medium explosion + medium shake
            this.particles.spawnSmallExplosion(screenX, screenY);
            this.juice.shakeForDeath(archetype);
          } else {
            // Infantry/ranged: small blood splash, no shake
            this.particles.spawnBloodSplash(screenX, screenY, 1);
            this.particles.spawnDustCloud(screenX, GameScene.GROUND_Y);
          }
        }

        // Kill combo tracking via JuiceManager
        this.juice.recordKill();

        // Audio: death SFX based on unit type
        const deathArchetype = e.unitType ?? 'infantry';
        if (deathArchetype === 'heavy' || deathArchetype === 'hero') {
          this.audioManager.playSFX('explosion_large');
        } else {
          this.audioManager.playSFX('death');
        }

        // Audio: coin SFX for gold earned
        this.audioManager.playSFX('coin');

        // Reduce ability cooldown on kill
        this.abilitySystem.onKill('player');
      } else if (e.faction === 'player') {
        // Enemy killed a player unit — enemy earns rewards
        this.enemyEconomy.earnFromKill(
          e.unitType as UnitType,
          this.playerAgeSystem.getCurrentAge()
        );

        // Player unit death particles (blue-tinted)
        const pos = this.gameManager.world.getComponent<Position>(e.entityId, 'Position');
        if (pos) {
          const screenX = this.ecsXToScreen(pos.x);
          const screenY = GameScene.GROUND_Y - 30;
          const archetype = e.unitType ?? 'infantry';
          if (archetype === 'heavy' || archetype === 'hero') {
            this.particles.spawnLargeExplosion(screenX, screenY);
          } else {
            this.particles.spawnSmallExplosion(screenX, screenY);
          }
          this.particles.spawnDustCloud(screenX, GameScene.GROUND_Y);
        }

        // Audio: death SFX for player unit
        this.audioManager.playSFX('death');

        // Reduce ability cooldown on kill for enemy
        this.abilitySystem.onKill('enemy');
      }

      // Check if dead entity is the player hero
      if (e.unitType === 'hero') {
        if (e.faction === 'player') {
          this.heroManager.onHeroDeath('player');
          this.heroEntityId = null;
          if (this.heroRect) {
            this.heroRect.destroy();
            this.heroRect = null;
          }
        } else {
          this.heroManager.onHeroDeath('enemy');
        }
      }
    });

    // Damage events: show floating damage numbers + context-appropriate hit particles
    this.gameManager.events.on('damage', (e) => {
      const pos = this.gameManager.world.getComponent<Position>(e.targetId, 'Position');
      if (!pos) return;

      const screenX = this.ecsXToScreen(pos.x);
      const screenY = GameScene.GROUND_Y - 20;
      if (this.settingsManager.get('damageNumbers')) {
        this.floatingText.spawnDamage(screenX, screenY, e.damage);
      }

      // Counter indicator: show "+50%" floating text on counter-bonus hits
      if (e.isCounter && this.settingsManager.get('counterIndicators')) {
        this.floatingText.spawn(screenX + 15, screenY - 10, '+50%', '#ff8800');
      }

      // Audio: hit SFX based on damage amount
      if (e.damage > 20) {
        this.audioManager.playSFX('hit_heavy');
      } else {
        this.audioManager.playSFX('hit_light');
      }

      // Determine attacker type/position for directional effects
      const attackerPos = this.gameManager.world.getComponent<Position>(e.attackerId, 'Position');
      const attackerFaction = this.gameManager.world.getComponent<Faction>(e.attackerId, 'Faction');
      const attackerUnitType = this.gameManager.world.getComponent<UnitTypeComponent>(e.attackerId, 'UnitType');
      const attackerArchetype = attackerUnitType?.type ?? 'infantry';
      const direction = attackerFaction?.faction === 'player' ? 1 : -1;

      // Choose particle effect based on attacker type
      if (attackerArchetype === 'ranged') {
        // Ranged hit: sparks flying upward
        this.particles.spawnRangedImpact(screenX, screenY);
        // Gunpowder+ ages: muzzle flash at attacker position
        const attackerAge = attackerFaction?.faction === 'player'
          ? this.playerAgeSystem.getCurrentAge()
          : this.enemyAgeSystem.getCurrentAge();
        if (attackerAge >= 5 && attackerPos) {
          this.particles.spawnMuzzleFlash(
            this.ecsXToScreen(attackerPos.x),
            GameScene.GROUND_Y - 20,
            direction
          );
          // Industrial+ ages: smoke trail
          if (attackerAge >= 6) {
            this.particles.spawnSmokeTrail(screenX, screenY);
          }
        }
      } else if (attackerArchetype === 'special') {
        // Special unit hit: small explosion
        this.particles.spawnSmallExplosion(screenX, screenY);
      } else if (e.damage > 20) {
        // Heavy melee hit: blood splash with direction bias
        this.particles.spawnBloodSplash(screenX, screenY, direction);
      } else {
        // Normal melee hit: white + accent sparks
        const age = attackerFaction?.faction === 'player'
          ? this.playerAgeSystem.getCurrentAge()
          : this.enemyAgeSystem.getCurrentAge();
        const accentColor = this.getAgeAccentColor(age);
        this.particles.spawnMeleeHit(screenX, screenY, accentColor);
      }
    });

    // Base hit events
    this.gameManager.events.on('baseHit', (e) => {
      if (e.faction === 'player') {
        this.gameState.player.baseHp = Math.max(0, e.remainingHp);
        // Notify HUD of damage taken
        const hud = this.scene.get('HUD') as HUD | undefined;
        hud?.flashPlayerHpBar();
      } else {
        this.gameState.enemy.baseHp = Math.max(0, e.remainingHp);
      }

      // Audio: base hit SFX
      this.audioManager.playSFX('hit_heavy');

      // Juice: hit-stop and screen shake for base hits
      this.juice.hitStopBaseHit();
      this.juice.shakeForBaseHit(e.damage);

      // Particles at base position
      const baseX = e.faction === 'player' ? GameScene.PLAYER_BASE_X : GameScene.ENEMY_BASE_X;
      const baseY = GameScene.GROUND_Y - 40;
      if (e.damage > 30) {
        this.particles.spawnSmallExplosion(baseX, baseY);
      } else {
        this.particles.spawnRangedImpact(baseX, baseY);
      }
    });

    // Game over events
    this.gameManager.events.on('gameOver', (e) => {
      if (this.gameState.isGameOver) return; // Prevent double processing
      this.gameState.isGameOver = true;
      this.gameState.winner = e.winner;

      // Audio: victory/defeat SFX + stop music
      if (e.winner === 'player') {
        this.audioManager.playSFX('victory');
      } else {
        this.audioManager.playSFX('defeat');
      }
      this.audioManager.stopMusic();

      // Campaign: calculate stars and save progress on victory
      if (e.winner === 'player' && this.mode === 'campaign' && this.currentMission && this.campaignManager) {
        const elapsed = this.gameState.elapsedTime;
        const hpPct = (this.gameState.player.baseHp / this.gameState.player.baseMaxHp) * 100;
        this.campaignStars = this.campaignManager.calculateStars(this.currentMission.id, elapsed, hpPct);
        this.campaignManager.completeMission(this.currentMission.id, this.campaignStars);
      }

      // Base destruction collapse effect
      if (e.winner === 'player') {
        this.playBaseCollapse('enemy');
      } else {
        this.playBaseCollapse('player');
      }
    });

    // Spawn events: play spawn SFX for player units
    this.gameManager.events.on('spawn', (e) => {
      if (e.faction === 'player') {
        this.audioManager.playSFX('spawn');
      }
    });

    // ── HUD touch/click events (mobile support) ──
    const hudScene = this.scene.get('HUD');
    if (hudScene) {
      hudScene.events.on('spawn-unit', (index: number) => {
        this.spawnUnitByIndex(index);
      });
      hudScene.events.on('evolve-pressed', () => this.tryEvolve());
      hudScene.events.on('special-pressed', () => this.trySpecial());
      hudScene.events.on('hero-ability', (index: number) => this.useHeroAbility(index));
      hudScene.events.on('pause-pressed', () => this.togglePause());
    }
  }

  /** Get age accent color for particle tinting. */
  private getAgeAccentColor(age: number): number {
    const accentColors: Record<number, number> = {
      1: 0xFF6B35,  // Prehistoric: volcanic orange
      2: 0xF1C40F,  // Bronze: golden
      3: 0xC41E3A,  // Classical: roman red
      4: 0xDAA520,  // Medieval: heraldic gold
      5: 0xECF0F1,  // Gunpowder: powder white
      6: 0xD4A017,  // Industrial: amber
      7: 0xFF4500,  // Modern: warning orange
      8: 0x00CED1,  // Future: neon cyan
    };
    return accentColors[age] ?? 0xffffff;
  }

  // ─────────────────────── COORDINATE MAPPING ───────────────────────
  // ECS uses 0-1600 X range. Screen uses 0-1280.
  // Map: ECS 50 → screen PLAYER_BASE_X (80), ECS 1550 → screen ENEMY_BASE_X (1200)

  private ecsXToScreen(ecsX: number): number {
    // Linear map: ecsX [50..1550] → screenX [80..1200]
    const t = (ecsX - 50) / (1550 - 50);
    return GameScene.PLAYER_BASE_X + t * (GameScene.ENEMY_BASE_X - GameScene.PLAYER_BASE_X);
  }

  // ─────────────────────── WORLD SETUP ───────────────────────

  private createGround(): void {
    this.ground = this.add.graphics();

    // Sky gradient (simple two-band)
    this.ground.fillStyle(0x5588cc, 1);
    this.ground.fillRect(0, 0, 1280, GameScene.GROUND_Y);

    // Lighter sky near horizon
    this.ground.fillStyle(0x88bbee, 1);
    this.ground.fillRect(0, GameScene.GROUND_Y - 100, 1280, 100);

    // Ground — brown/green gradient band
    this.ground.fillStyle(0x557733, 1);
    this.ground.fillRect(0, GameScene.GROUND_Y, 1280, 8);

    this.ground.fillStyle(0x664422, 1);
    this.ground.fillRect(0, GameScene.GROUND_Y + 8, 1280, 720 - GameScene.GROUND_Y - 8);

    // Grass detail line
    this.ground.fillStyle(0x66aa33, 1);
    this.ground.fillRect(0, GameScene.GROUND_Y - 2, 1280, 4);

    this.ground.setDepth(-10);
  }

  private createGroundDetails(): void {
    // Small random dark spots on the ground for texture
    const count = 12 + Math.floor(Math.random() * 4);
    for (let i = 0; i < count; i++) {
      const x = 40 + Math.random() * 1200;
      const y = GameScene.GROUND_Y + 2 + Math.random() * 6;
      const w = 2 + Math.random() * 4;
      const h = 1 + Math.random() * 2;
      const shade = Phaser.Display.Color.GetColor(
        60 + Math.floor(Math.random() * 30),
        80 + Math.floor(Math.random() * 20),
        30 + Math.floor(Math.random() * 15)
      );
      const spot = this.add.rectangle(x, y, w, h, shade).setDepth(-9).setAlpha(0.6);
      this.groundDetails.push(spot);
    }
  }

  private createClouds(): void {
    // 3-4 simple light rectangles drifting left-to-right
    const cloudCount = 3 + Math.floor(Math.random() * 2);
    for (let i = 0; i < cloudCount; i++) {
      const x = Math.random() * 1280;
      const y = 60 + Math.random() * 200;
      const w = 60 + Math.random() * 100;
      const h = 12 + Math.random() * 16;
      const speed = 8 + Math.random() * 15; // pixels per second, different speeds for depth
      const alpha = 0.15 + Math.random() * 0.15;
      const rect = this.add.rectangle(x, y, w, h, 0xffffff, alpha)
        .setDepth(-8);
      this.clouds.push({ rect, speed });
    }
  }

  private createBases(): void {
    const baseW = 60;
    const baseH = 100;
    const baseY = GameScene.GROUND_Y - baseH / 2;

    // ── Base detail graphics (legacy fallback) ──
    this.playerBaseDetails = this.add.graphics().setDepth(1);
    this.enemyBaseDetails = this.add.graphics().setDepth(1);

    // Hidden fallback rectangles (keep for collapse logic)
    this.playerBase = this.add.rectangle(
      GameScene.PLAYER_BASE_X, baseY, baseW, baseH, 0x2244aa
    ).setStrokeStyle(3, this.playerColor).setDepth(0).setVisible(false);

    this.enemyBase = this.add.rectangle(
      GameScene.ENEMY_BASE_X, baseY, baseW, baseH, 0xaa2222
    ).setStrokeStyle(3, this.enemyColor).setDepth(0).setVisible(false);

    // Use procedural base textures
    const playerBaseKey = this.baseRenderer.getTextureKey(1, 'player');
    const enemyBaseKey = this.baseRenderer.getTextureKey(1, 'enemy');

    this.playerBaseImage = this.add.image(GameScene.PLAYER_BASE_X, baseY, playerBaseKey)
      .setDepth(0);
    this.enemyBaseImage = this.add.image(GameScene.ENEMY_BASE_X, baseY, enemyBaseKey)
      .setDepth(0);

    // Flag pole on player base
    this.playerFlagPole = this.add.rectangle(
      GameScene.PLAYER_BASE_X, baseY - baseH / 2 - 14, 2, 28, 0xcccccc
    ).setDepth(1);
    this.playerFlag = this.add.rectangle(
      GameScene.PLAYER_BASE_X + 6, baseY - baseH / 2 - 22, 12, 8, this.playerColor
    ).setDepth(2);

    // Flag pole on enemy base
    this.enemyFlagPole = this.add.rectangle(
      GameScene.ENEMY_BASE_X, baseY - baseH / 2 - 14, 2, 28, 0xcccccc
    ).setDepth(1);
    this.enemyFlag = this.add.rectangle(
      GameScene.ENEMY_BASE_X + 6, baseY - baseH / 2 - 22, 12, 8, this.enemyColor
    ).setDepth(2);

    // Crack graphics overlay
    this.baseCrackGraphics = this.add.graphics().setDepth(2);
  }

  private drawBaseDetails(
    gfx: Phaser.GameObjects.Graphics,
    cx: number,
    cy: number,
    w: number,
    h: number,
    darkColor: number,
    lightColor: number
  ): void {
    // Door (bottom center)
    gfx.fillStyle(darkColor, 1);
    gfx.fillRect(cx - 6, cy + h / 2 - 18, 12, 18);

    // Windows (2 small squares near top)
    gfx.fillStyle(lightColor, 0.6);
    gfx.fillRect(cx - w / 2 + 6, cy - h / 2 + 12, 8, 8);
    gfx.fillRect(cx + w / 2 - 14, cy - h / 2 + 12, 8, 8);

    // Middle window
    gfx.fillRect(cx - 4, cy - 8, 8, 8);
  }

  private createBattleLine(): void {
    this.battleLine = this.add.rectangle(640, GameScene.GROUND_Y - 40, 1, 80, 0xffffff, 0.12)
      .setDepth(3);
  }

  // ─────────────────────── BASE DAMAGE VISUALS ───────────────────────

  private updateBaseCracks(): void {
    this.baseCrackGraphics.clear();
    const baseW = 48;
    const baseH = 80;
    const baseY = GameScene.GROUND_Y - baseH / 2;

    // Player base cracks
    const playerPct = this.gameState.player.baseMaxHp > 0
      ? this.gameState.player.baseHp / this.gameState.player.baseMaxHp
      : 1;
    this.drawCracksForBase(GameScene.PLAYER_BASE_X, baseY, baseW, baseH, playerPct);

    // Enemy base cracks
    const enemyPct = this.gameState.enemy.baseMaxHp > 0
      ? this.gameState.enemy.baseHp / this.gameState.enemy.baseMaxHp
      : 1;
    this.drawCracksForBase(GameScene.ENEMY_BASE_X, baseY, baseW, baseH, enemyPct);
  }

  private drawCracksForBase(cx: number, cy: number, w: number, h: number, hpPct: number): void {
    if (hpPct >= 0.75) return;

    this.baseCrackGraphics.lineStyle(1, 0x111111, 0.8);

    const halfW = w / 2;
    const halfH = h / 2;

    // Below 75%: small cracks
    this.baseCrackGraphics.beginPath();
    this.baseCrackGraphics.moveTo(cx - halfW + 5, cy - halfH + 15);
    this.baseCrackGraphics.lineTo(cx - halfW + 15, cy - halfH + 25);
    this.baseCrackGraphics.lineTo(cx - halfW + 10, cy - halfH + 35);
    this.baseCrackGraphics.strokePath();

    if (hpPct < 0.5) {
      // Below 50%: more cracks
      this.baseCrackGraphics.beginPath();
      this.baseCrackGraphics.moveTo(cx + halfW - 8, cy - halfH + 20);
      this.baseCrackGraphics.lineTo(cx + halfW - 18, cy);
      this.baseCrackGraphics.lineTo(cx + halfW - 12, cy + 15);
      this.baseCrackGraphics.strokePath();

      this.baseCrackGraphics.beginPath();
      this.baseCrackGraphics.moveTo(cx - 5, cy - halfH + 5);
      this.baseCrackGraphics.lineTo(cx + 3, cy - halfH + 18);
      this.baseCrackGraphics.strokePath();
    }

    if (hpPct < 0.25) {
      // Below 25%: severe cracks
      this.baseCrackGraphics.lineStyle(2, 0x111111, 0.9);
      this.baseCrackGraphics.beginPath();
      this.baseCrackGraphics.moveTo(cx, cy - halfH);
      this.baseCrackGraphics.lineTo(cx - 8, cy - 5);
      this.baseCrackGraphics.lineTo(cx + 5, cy + 10);
      this.baseCrackGraphics.lineTo(cx - 3, cy + halfH);
      this.baseCrackGraphics.strokePath();

      this.baseCrackGraphics.beginPath();
      this.baseCrackGraphics.moveTo(cx - halfW, cy + 10);
      this.baseCrackGraphics.lineTo(cx - halfW + 20, cy + 5);
      this.baseCrackGraphics.strokePath();
    }
  }

  // ─────────────────────── BASE COLLAPSE ───────────────────────

  private playBaseCollapse(faction: 'player' | 'enemy'): void {
    const baseX = faction === 'player' ? GameScene.PLAYER_BASE_X : GameScene.ENEMY_BASE_X;
    const baseY = GameScene.GROUND_Y - 40;
    const color = faction === 'player' ? 0x2244aa : 0xaa2222;

    // Hide the base images and details
    const base = faction === 'player' ? this.playerBase : this.enemyBase;
    const baseImage = faction === 'player' ? this.playerBaseImage : this.enemyBaseImage;
    const details = faction === 'player' ? this.playerBaseDetails : this.enemyBaseDetails;
    const flag = faction === 'player' ? this.playerFlag : this.enemyFlag;
    const pole = faction === 'player' ? this.playerFlagPole : this.enemyFlagPole;
    const damageImg = faction === 'player' ? this.playerBaseDamageImage : this.enemyBaseDamageImage;

    base.setVisible(false);
    if (baseImage) baseImage.setVisible(false);
    details.setVisible(false);
    flag.setVisible(false);
    pole.setVisible(false);
    if (damageImg) damageImg.setVisible(false);

    // Spawn collapse particles — use upgraded effects
    this.particles.spawnBaseDebris(baseX, baseY, color);
    this.particles.spawnLargeExplosion(baseX, baseY);

    // Sustained heavy shake for 1.5s
    this.juice.shakeBaseDestroyed();

    // Show end screen after collapse animation
    this.time.delayedCall(1500, () => {
      if (this.gameState.winner === 'player') {
        this.showEndScreen('VICTORY!', '#44ff44');
      } else {
        this.showEndScreen('DEFEAT', '#ff4444');
      }
    });
  }

  // ─────────────────────── SCREEN EFFECTS ───────────────────────

  private playEvolutionTransition(ageName: string): void {
    // Delegate to JuiceManager for the full 3-second cinematic sequence
    const baseY = GameScene.GROUND_Y - 40;
    this.juice.playEvolutionCinematic(ageName, GameScene.PLAYER_BASE_X, baseY);

    // Also fire initial magic burst particles immediately
    this.particles.spawnMagicBurst(
      GameScene.PLAYER_BASE_X,
      baseY,
      0x8844ff
    );
    this.particles.spawnMagicBurst(
      GameScene.PLAYER_BASE_X,
      baseY,
      0xffdd00
    );
  }

  // ─────────────────────── INPUT ───────────────────────

  private setupInput(): void {
    if (!this.input.keyboard) return;

    this.keys = {
      Q: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q),
      W: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      E: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E),
      R: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R),
      T: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.T),
      SPACE: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
      ONE: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE),
      TWO: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO),
      ESC: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC),
    };
  }

  private handleInput(): void {
    if (!this.keys) return;

    // Unit spawns (Q/W/E/R → unit slots 0-3 of current age)
    const spawnKeys = [this.keys.Q, this.keys.W, this.keys.E, this.keys.R];

    for (let i = 0; i < 4; i++) {
      if (Phaser.Input.Keyboard.JustDown(spawnKeys[i])) {
        this.spawnUnitByIndex(i);
      }
    }

    // Evolve
    if (Phaser.Input.Keyboard.JustDown(this.keys.T)) {
      this.tryEvolve();
    }

    // Special attack
    if (Phaser.Input.Keyboard.JustDown(this.keys.SPACE)) {
      this.trySpecial();
    }

    // Hero abilities (1/2 keys)
    if (Phaser.Input.Keyboard.JustDown(this.keys.ONE)) {
      this.useHeroAbility(0);
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.TWO)) {
      this.useHeroAbility(1);
    }

    // Pause
    if (Phaser.Input.Keyboard.JustDown(this.keys.ESC)) {
      this.togglePause();
    }
  }

  /** Spawn a unit by slot index (0-3). Used by both keyboard and touch input. */
  private spawnUnitByIndex(index: number): void {
    const currentUnits = this.playerAgeSystem.getAvailableUnits();
    const unitIds = this.playerAgeSystem.getAvailableUnitIds();

    if (index < 0 || index >= Math.min(4, currentUnits.length)) return;

    const unitConfig = currentUnits[index];
    const cost = unitConfig.stats.cost;

    if (this.playerEconomy.canAfford(cost)) {
      this.playerEconomy.spend(cost);
      this.enqueueSpawn('player', unitIds[index], unitConfig);

      // Trigger HUD cooldown
      const hud = this.scene.get('HUD') as HUD | undefined;
      hud?.startUnitCooldown(index, unitConfig.stats.spawnTime);

      // Show gold spent floating text
      this.floatingText.spawn(
        GameScene.PLAYER_BASE_X + 60,
        GameScene.GROUND_Y - 40,
        `-${cost}g`,
        '#ff8888'
      );

      // Unit spawn flash
      this.particles.spawnFlash(
        GameScene.PLAYER_BASE_X + 40,
        GameScene.GROUND_Y - 12
      );

      // Spawn dust
      this.particles.spawnDust(
        GameScene.PLAYER_BASE_X + 40,
        GameScene.GROUND_Y
      );
    }
  }

  /** Use a hero ability by index (0 or 1). Used by both keyboard and touch input. */
  private useHeroAbility(abilityIndex: number): void {
    const used = this.heroSystem.useAbility(this.gameManager.world, 'player', abilityIndex);
    if (used) {
      this.audioManager.playSFX('ability');
      const heroId = this.heroManager.getHero('player');
      if (heroId !== null) {
        const hero = this.gameManager.world.getComponent<HeroComponent>(heroId, 'Hero');
        if (hero) {
          const hud = this.scene.get('HUD') as HUD | undefined;
          const maxCooldown = abilityIndex === 0 ? hero.ability1MaxCooldown : hero.ability2MaxCooldown;
          hud?.startHeroCooldown(abilityIndex, maxCooldown);
        }
        // Hero ability juice: hit-stop + magic burst at hero position
        const pos = this.gameManager.world.getComponent<Position>(heroId, 'Position');
        if (pos) {
          const sx = this.ecsXToScreen(pos.x);
          const sy = GameScene.GROUND_Y - 20;
          this.juice.hitStopHeroAbility();
          this.juice.shakeMedium();
          this.particles.spawnMagicBurst(sx, sy, this.getAgeAccentColor(this.playerAgeSystem.getCurrentAge()));
        }
      }
    }
  }

  // ─────────────────────── SPAWNING ───────────────────────

  private enqueueSpawn(faction: 'player' | 'enemy', unitId: string, unitConfig: UnitConfig): void {
    const age = faction === 'player'
      ? this.playerAgeSystem.getCurrentAge()
      : this.enemyAgeSystem.getCurrentAge();

    let req: SpawnRequest = {
      faction,
      unitId,
      type: unitConfig.type,
      age,
      hp: unitConfig.stats.hp,
      damage: unitConfig.stats.damage,
      speed: unitConfig.stats.moveSpeed,
      range: unitConfig.stats.range,
      attackSpeed: unitConfig.stats.attackSpeed,
      projectileType: unitConfig.stats.range > 0 ? 'projectile' : '',
      spawnTime: unitConfig.stats.spawnTime,
      spriteKey: unitConfig.visuals?.spriteSheet ?? unitId,
      cost: unitConfig.stats.cost,
    };

    // Apply tech tree effects to player spawns
    if (faction === 'player') {
      req = this.techTreeManager.applyEffects(req);
    }

    this.gameManager.spawnSystem.enqueue(req);
  }

  // ─────────────────────── GAME ACTIONS ───────────────────────

  private tryEvolve(): void {
    if (this.evolutionLocked) return;
    if (this.playerAgeSystem.canEvolve()) {
      const newAgeConfig = this.playerAgeSystem.evolve();
      if (newAgeConfig) {
        // Update base HP
        let newBaseHp = this.playerAgeSystem.getBaseHp();

        // Apply tech tree base HP bonus (Fortification T1: Thick Walls)
        newBaseHp = Math.round(newBaseHp * this.techTreeManager.getBaseHpBonus());

        const hpGain = newBaseHp - this.gameState.player.baseMaxHp;
        this.gameState.player.baseMaxHp = newBaseHp;
        this.gameState.player.baseHp = Math.min(
          this.gameState.player.baseHp + hpGain,
          newBaseHp
        );
        // Keep GameManager in sync with the new base HP
        this.gameManager.setPlayerBaseHp(this.gameState.player.baseHp);

        // Sync age in game state
        this.gameState.player.currentAge = this.playerAgeSystem.getCurrentAge();

        // ── Tech Tree: award 2 points and auto-spend ──
        this.techTreeManager.addPoints(2);
        // Auto-spend: 1 in Military, 1 in Economy (default strategy)
        const milTier = this.techTreeManager.getUnlockedTier('military') + 1;
        if (this.techTreeManager.canUnlock('military', milTier)) {
          this.techTreeManager.unlock('military', milTier);
        }
        const ecoTier = this.techTreeManager.getUnlockedTier('economy') + 1;
        if (this.techTreeManager.canUnlock('economy', ecoTier)) {
          this.techTreeManager.unlock('economy', ecoTier);
        }
        // If couldn't spend in those branches, try fortification
        if (this.techTreeManager.getAvailablePoints() > 0) {
          const fortTier = this.techTreeManager.getUnlockedTier('fortification') + 1;
          if (this.techTreeManager.canUnlock('fortification', fortTier)) {
            this.techTreeManager.unlock('fortification', fortTier);
          }
        }

        // Apply evolution gold bonus from tech tree (War Bonds)
        const evolveGoldBonus = this.techTreeManager.getEvolutionGoldBonus();
        if (evolveGoldBonus > 0) {
          this.playerEconomy.addGold(evolveGoldBonus);
        }

        // ── Deploy new hero for the new age ──
        this.heroEntityId = this.heroManager.onAgeUp('player', this.playerAgeSystem.getCurrentAge());

        // Update HUD unit buttons for new age
        this.pushUnitDefsToHUD();

        // Play evolution transition instead of simple flash
        const ageName = AGE_NAMES[this.gameState.player.currentAge] ?? `Age ${this.gameState.player.currentAge}`;
        this.playEvolutionTransition(ageName);

        // Audio: evolve SFX + start new age music
        this.audioManager.playSFX('evolve');
        this.audioManager.playMusic(this.playerAgeSystem.getCurrentAge());

        // Update weather system max age
        this.weatherSystem.setMaxAge(this.playerAgeSystem.getCurrentAge());

        // Emit ageUp event
        this.gameManager.events.emit('ageUp', {
          faction: 'player',
          newAge: this.playerAgeSystem.getCurrentAge(),
        });
      }
    }
  }

  private trySpecial(): void {
    // Use the AbilitySystem instead of the simple damage-all approach
    const targetX = this.input.activePointer?.worldX
      ? this.screenToEcsX(this.input.activePointer.worldX)
      : 800; // battlefield center

    const used = this.abilitySystem.useSpecial(
      this.gameManager.world,
      'player',
      this.playerAgeSystem.getCurrentAge(),
      targetX,
    );

    if (!used) return;

    const abilityConfig = this.abilitySystem.getAbilityForAge(this.playerAgeSystem.getCurrentAge());
    const cooldown = abilityConfig?.cooldown ?? 45;

    const hud = this.scene.get('HUD') as HUD | undefined;
    hud?.startSpecialCooldown(cooldown);

    // Audio: special fire SFX
    this.audioManager.playSFX('special_fire');

    // Screen shake + hit-stop for special attack
    this.juice.shakeMedium();
    this.juice.hitStopSpecialAbility();

    // Explosion particles at target location
    const screenTargetX = this.input.activePointer?.worldX ?? 640;
    this.particles.spawnLargeExplosion(screenTargetX, GameScene.GROUND_Y - 20);
  }

  private applyCampaignModifiers(modifiers: string[]): void {
    for (const mod of modifiers) {
      switch (mod) {
        case 'no_turrets':
          this.turretsDisabled = true;
          // Remove any turrets already built
          for (const slot of this.playerTurretManager.getOccupiedSlots()) {
            this.playerTurretManager.sellTurret(slot);
          }
          break;
        case 'famine':
          this.passiveIncomeDisabled = true;
          break;
        case 'locked_age':
          this.evolutionLocked = true;
          break;
        case 'arms_race':
          // Both sides auto-evolve every 2 minutes
          this.time.addEvent({
            delay: 120000,
            loop: true,
            callback: () => {
              this.playerEconomy.addXP(9999);
              if (this.playerAgeSystem.canEvolve()) this.playerAgeSystem.evolve();
              this.enemyEconomy.addXP(9999);
              if (this.enemyAgeSystem.canEvolve()) this.enemyAgeSystem.evolve();
            },
          });
          break;
        case 'scorched_earth':
          // Both bases lose HP over time after 5 minutes, capped at 5 DPS
          this.time.addEvent({
            delay: 1000,
            loop: true,
            callback: () => {
              const elapsed = this.gameState.elapsedTime;
              if (elapsed > 300) {
                const dmg = Math.min(5, Math.floor((elapsed - 300) / 120) + 1);
                this.gameState.player.baseHp = Math.max(0, this.gameState.player.baseHp - dmg);
                this.gameState.enemy.baseHp = Math.max(0, this.gameState.enemy.baseHp - dmg);
                this.gameManager.setPlayerBaseHp(this.gameState.player.baseHp);
                this.gameManager.setEnemyBaseHp(this.gameState.enemy.baseHp);
              }
            },
          });
          break;
      }
    }
  }

  /** Convert screen X back to ECS X for targeting. */
  private screenToEcsX(screenX: number): number {
    const t = (screenX - GameScene.PLAYER_BASE_X) / (GameScene.ENEMY_BASE_X - GameScene.PLAYER_BASE_X);
    return 50 + t * (1550 - 50);
  }

  private togglePause(): void {
    this.gameState.isPaused = !this.gameState.isPaused;

    if (this.gameState.isPaused) {
      this.gameManager.pause();
      // Show a simple pause overlay — do NOT call this.scene.pause()
      // because Phaser pauses input processing for paused scenes,
      // which would prevent the ESC key from ever unpausing.
      const pauseText = this.add.text(640, 360, 'PAUSED\n\nPress ESC to resume', {
        fontSize: '32px',
        fontFamily: 'monospace',
        color: '#ffffff',
        align: 'center',
        backgroundColor: '#00000088',
        padding: { x: 40, y: 20 },
      }).setOrigin(0.5).setDepth(9999).setName('pauseOverlay');

      // Use game.input.keyboard to listen at the game level (works even when scene is paused)
      const onResume = (event: KeyboardEvent) => {
        if (event.code === 'Escape') {
          pauseText.destroy();
          this.gameState.isPaused = false;
          this.gameManager.resume();
          window.removeEventListener('keydown', onResume);
        }
      };
      window.addEventListener('keydown', onResume);
    }
  }

  // ─────────────────────── HUD HELPERS ───────────────────────

  private pushUnitDefsToHUD(): void {
    const units = this.playerAgeSystem.getAvailableUnits();
    const unitIds = this.playerAgeSystem.getAvailableUnitIds();
    const keyNames = ['Q', 'W', 'E', 'R'];
    const defs = units.slice(0, 4).map((u, i) => ({
      name: u.displayName,
      cost: u.stats.cost,
      key: keyNames[i],
      unitId: unitIds[i],
    }));
    const hud = this.scene.get('HUD') as HUD | undefined;
    hud?.updateUnitDefs(defs);
  }

  // ─────────────────────── GAME LOOP ───────────────────────

  update(time: number, delta: number): void {
    if (this.gameState.isPaused || this.gameState.isGameOver) return;

    const deltaSec = delta / 1000;

    // Update elapsed time
    this.gameState.elapsedTime += deltaSec;

    // ── JuiceManager update — returns true if systems should be skipped
    //    (hit-stop freeze or evolution cinematic playing) ──
    const skipSystems = this.juice.update(deltaSec);

    // Always handle input (even during hit-stop, for responsiveness)
    this.handleInput();

    // ── Game systems — only run when not hit-stopped/evolution-playing ──
    if (!skipSystems) {
      // 2. AI — use AIDirector instead of simple updateEnemyAI
      this.aiDirector.update(deltaSec);

      // 3. Spawn → Movement → Combat (via GameManager core loop)
      this.gameManager.update(deltaSec);

      // 6. Terrain
      this.terrainSystem.update(this.gameManager.world, deltaSec);

      // 7. Weather
      this.weatherSystem.update(this.gameManager.world, deltaSec);

      // 8. Formation
      this.formationSystem.update(this.gameManager.world, deltaSec);

      // 9. Hero
      this.heroSystem.updateWithDelta(this.gameManager.world, deltaSec);

      // 10. Ability
      this.abilitySystem.update(this.gameManager.world, deltaSec);

      // 11. Lifetime
      this.lifetimeSystem.update(this.gameManager.world, deltaSec);

      // 12. Turret
      this.turretSystem.update(this.gameManager.world, deltaSec);

      // 13. Economy (passive income + tech bonuses)
      if (!this.passiveIncomeDisabled) {
        this.playerEconomy.update(deltaSec);
      }
      this.enemyEconomy.update(deltaSec);

      // Apply tech tree income bonus (Trade Routes: +5 gold/s)
      const incomeBonus = this.techTreeManager.getIncomeBonus();
      if (incomeBonus > 0) {
        this.playerEconomy.addGold(incomeBonus * deltaSec);
      }

      // Apply tech tree base regen (Repair Crews: 1 HP/s)
      const regenRate = this.techTreeManager.getBaseRegenRate();
      if (regenRate > 0 && this.gameState.player.baseHp < this.gameState.player.baseMaxHp) {
        this.gameState.player.baseHp = Math.min(
          this.gameState.player.baseMaxHp,
          this.gameState.player.baseHp + regenRate * deltaSec,
        );
        this.gameManager.setPlayerBaseHp(this.gameState.player.baseHp);
      }

      // Update weather max age
      this.weatherSystem.setMaxAge(
        Math.max(this.playerAgeSystem.getCurrentAge(), this.enemyAgeSystem.getCurrentAge()),
      );

      // Sync economy → gameState
      this.gameState.player.gold = this.playerEconomy.getRawGold();
      this.gameState.player.xp = this.playerEconomy.getXP();
      this.gameState.player.currentAge = this.playerAgeSystem.getCurrentAge();

      this.gameState.enemy.gold = this.enemyEconomy.getRawGold();
      this.gameState.enemy.xp = this.enemyEconomy.getXP();
      this.gameState.enemy.currentAge = this.enemyAgeSystem.getCurrentAge();

      // Detect gold increase for HUD flash
      if (this.gameState.player.gold > this.lastPlayerGold + 0.5) {
        const hud = this.scene.get('HUD') as HUD | undefined;
        hud?.flashGoldText();
      }
      this.lastPlayerGold = this.gameState.player.gold;

      // Sync base HP from GameManager (it is the authoritative source for base damage)
      const newPlayerBaseHp = Math.max(0, this.gameManager.playerBaseHp);
      if (newPlayerBaseHp < this.lastPlayerBaseHp) {
        const hud = this.scene.get('HUD') as HUD | undefined;
        hud?.flashPlayerHpBar();
      }
      this.gameState.player.baseHp = newPlayerBaseHp;
      this.lastPlayerBaseHp = newPlayerBaseHp;
      this.gameState.enemy.baseHp = Math.max(0, this.gameManager.enemyBaseHp);
    }

    // ── Update background/bases on age change ──
    const currentPlayerAge = this.playerAgeSystem.getCurrentAge();
    if (currentPlayerAge !== this.lastRenderedPlayerAge) {
      this.backgroundRenderer.showAge(currentPlayerAge);
      this.updateBaseTexture('player', currentPlayerAge);
      this.lastRenderedPlayerAge = currentPlayerAge;
      // Reset hero sprite for new age
      if (this.heroImage) {
        this.heroImage.destroy();
        this.heroImage = null;
      }
      if (this.heroGlow) {
        this.heroGlow.destroy();
        this.heroGlow = null;
      }
    }
    const currentEnemyAge = this.enemyAgeSystem.getCurrentAge();
    if (currentEnemyAge !== this.lastRenderedEnemyAge) {
      this.updateBaseTexture('enemy', currentEnemyAge);
      this.lastRenderedEnemyAge = currentEnemyAge;
    }

    // ── Render (always runs, even during hit-stop, for visual feedback) ──
    this.renderEntities();
    this.renderHero();
    this.renderTurrets();
    this.updateWeatherOverlay();
    this.updateBaseDamageOverlays();

    // Update visual effects
    this.updateClouds(deltaSec);
    this.updateFlags(time);
    this.updateBaseCracks();
    this.updateBattleLine();

    // Low HP warning via JuiceManager
    const hpPct = this.gameState.player.baseMaxHp > 0
      ? this.gameState.player.baseHp / this.gameState.player.baseMaxHp
      : 1;
    this.juice.updateLowHpWarning(hpPct, deltaSec);

    // Update background parallax based on battle center
    if (this.backgroundRenderer) {
      const units = this.gameManager.world.query('Position');
      let avgX = 640; // default center
      if (units.length > 0) {
        let total = 0;
        for (const id of units) {
          const pos = this.gameManager.world.getComponent<Position>(id, 'Position');
          if (pos) total += pos.x;
        }
        avgX = this.ecsXToScreen(total / units.length);
      }
      this.backgroundRenderer.updateParallax(avgX);
    }

    // Update particles
    this.particles.update(deltaSec);

    // Sync game state for HUD — include hero HP and weather info
    this.syncHeroHpToHUD();
    this.syncWeatherToHUD();
    this.data.set('gameState', this.gameState);

    // Update floating text
    this.floatingText.update(time, delta);

    // Game-over is now fully handled by the 'gameOver' event in wireEvents().
    // No redundant check needed here — the event fires synchronously during
    // gameManager.update() above, so isGameOver is already set by this point.
  }

  // ─────────────────────── VISUAL UPDATES ───────────────────────

  private updateClouds(deltaSec: number): void {
    for (const cloud of this.clouds) {
      cloud.rect.x += cloud.speed * deltaSec;
      // Wrap around
      if (cloud.rect.x > 1280 + 80) {
        cloud.rect.x = -80;
      }
    }
  }

  private updateFlags(time: number): void {
    // Subtle wave using sin(time)
    const wave = Math.sin(time * 0.003) * 1.5;
    const wave2 = Math.sin(time * 0.003 + 1) * 1.5;

    if (this.playerFlag) {
      this.playerFlag.x = GameScene.PLAYER_BASE_X + 6 + wave;
    }
    if (this.enemyFlag) {
      this.enemyFlag.x = GameScene.ENEMY_BASE_X + 6 + wave2;
    }
  }

  private updateBattleLine(): void {
    // Calculate average X position of all units
    const world = this.gameManager.world;
    const entities = world.query('Position', 'Faction');
    if (entities.length === 0) {
      this.battleLine.setVisible(false);
      return;
    }

    let totalX = 0;
    let count = 0;
    for (const id of entities) {
      const pos = world.getComponent<Position>(id, 'Position');
      if (pos) {
        totalX += this.ecsXToScreen(pos.x);
        count++;
      }
    }

    if (count > 0) {
      const avgX = totalX / count;
      this.battleLine.setPosition(avgX, GameScene.GROUND_Y - 40);
      this.battleLine.setVisible(true);
    } else {
      this.battleLine.setVisible(false);
    }
  }

  // ─────────────────────── RENDERING ───────────────────────

  private renderEntities(): void {
    const world = this.gameManager.world;
    const renderableEntities = world.query('Position', 'Faction', 'Renderable');

    // Reuse a persistent set instead of allocating a new one every frame
    const aliveIds = this.aliveIdsSet;
    aliveIds.clear();

    for (const entityId of renderableEntities) {
      aliveIds.add(entityId);

      const pos = world.getComponent<Position>(entityId, 'Position');
      const faction = world.getComponent<Faction>(entityId, 'Faction');
      const renderable = world.getComponent<Renderable>(entityId, 'Renderable');
      if (!pos || !faction || !renderable) continue;
      const unitType = world.getComponent<UnitTypeComponent>(entityId, 'UnitType');

      if (!renderable.visible) {
        const existingSprite = this.entitySprites.get(entityId);
        if (existingSprite) existingSprite.setVisible(false);
        const existing = this.entityRects.get(entityId);
        if (existing) existing.setVisible(false);
        continue;
      }

      const archetype = unitType?.type ?? 'infantry';
      const [w, h] = UNIT_SIZES[archetype] ?? UNIT_SIZES['infantry'];
      const screenX = this.ecsXToScreen(pos.x);
      const screenY = GameScene.GROUND_Y - h / 2;
      const unitId = unitType?.unitId ?? '';

      // Try to use procedural sprite texture
      const textureKey = this.spriteFactory.getUnitTextureKey(unitId, faction.faction);
      const hasTexture = this.textures.exists(textureKey);

      if (hasTexture) {
        let sprite = this.entitySprites.get(entityId);
        if (!sprite) {
          sprite = this.add.image(screenX, screenY, textureKey)
            .setDepth(5);
          // Flip enemy sprites to face left
          if (faction.faction === 'enemy') {
            sprite.setFlipX(true);
          }
          this.entitySprites.set(entityId, sprite);
        } else {
          sprite.setPosition(screenX, screenY);
          sprite.setVisible(true);
        }

        // Remove old rect if we switched to sprite
        const oldRect = this.entityRects.get(entityId);
        if (oldRect) {
          oldRect.destroy();
          this.entityRects.delete(entityId);
        }
      } else {
        // Fallback: colored rectangle
        const color = faction.faction === 'enemy' ? this.enemyColor : (FACTION_COLORS[faction.faction] ?? 0xffffff);
        let rect = this.entityRects.get(entityId);
        if (!rect) {
          rect = this.add.rectangle(screenX, screenY, w, h, color)
            .setStrokeStyle(1, 0xffffff)
            .setDepth(5);
          this.entityRects.set(entityId, rect);
        } else {
          rect.setPosition(screenX, screenY);
          rect.setSize(w, h);
          rect.setFillStyle(color);
          rect.setVisible(true);
        }
      }
    }

    // Remove sprites/rectangles for entities that no longer exist
    for (const [entityId, sprite] of this.entitySprites) {
      if (!aliveIds.has(entityId)) {
        sprite.destroy();
        this.entitySprites.delete(entityId);
      }
    }
    for (const [entityId, rect] of this.entityRects) {
      if (!aliveIds.has(entityId)) {
        rect.destroy();
        this.entityRects.delete(entityId);
      }
    }
  }

  // ─────────────────────── PHASE 3: TERRAIN ZONES ───────────────────────

  private static readonly TERRAIN_COLORS: Record<string, { color: number; alpha: number }> = {
    river: { color: 0x4488ff, alpha: 0.15 },
    forest: { color: 0x44aa44, alpha: 0.15 },
    high_ground: { color: 0x886644, alpha: 0.15 },
    ruins: { color: 0x888888, alpha: 0.15 },
    bridge: { color: 0xff8844, alpha: 0.2 },
  };

  private createTerrainZones(): void {
    const zones = this.terrainManager.getActiveZones();
    for (const zone of zones) {
      const screenXStart = this.ecsXToScreen(zone.xStart);
      const screenXEnd = this.ecsXToScreen(zone.xEnd);
      const width = screenXEnd - screenXStart;
      const centerX = (screenXStart + screenXEnd) / 2;
      const height = 80; // zone height on screen
      const y = GameScene.GROUND_Y - height / 2;

      const style = GameScene.TERRAIN_COLORS[zone.terrainId] ?? { color: 0xaaaaaa, alpha: 0.1 };

      const gfx = this.add.graphics().setDepth(-5);
      if (zone.terrainId === 'bridge') {
        // Bridge: outline only
        gfx.lineStyle(2, style.color, style.alpha);
        gfx.strokeRect(screenXStart, GameScene.GROUND_Y - height, width, height);
      } else {
        gfx.fillStyle(style.color, style.alpha);
        gfx.fillRect(screenXStart, GameScene.GROUND_Y - height, width, height);
      }
      this.terrainZoneGraphics.push(gfx);

      // Terrain name label
      const label = this.add.text(centerX, y - 6, zone.config.name, {
        fontSize: '10px',
        fontFamily: 'monospace',
        color: '#ffffff',
      }).setOrigin(0.5).setDepth(-4).setAlpha(0.5);
      this.terrainZoneLabels.push(label);
    }
  }

  // ─────────────────────── PHASE 3: WEATHER OVERLAY ───────────────────────

  private createWeatherOverlay(): void {
    this.weatherOverlay = this.add.graphics().setDepth(8900);
    this.weatherOverlay.setVisible(false);

    this.weatherText = this.add.text(0, 0, '', {
      fontSize: '11px',
      fontFamily: 'monospace',
      color: '#cccccc',
    }).setDepth(10).setAlpha(0.8);
  }

  private updateWeatherOverlay(): void {
    const weather = this.weatherSystem.getCurrentWeather();

    this.weatherOverlay.clear();

    if (weather.currentWeather === 'rain') {
      this.weatherOverlay.setVisible(true);
      this.weatherOverlay.fillStyle(0x4488ff, 0.05);
      this.weatherOverlay.fillRect(0, 0, 1280, 720);
    } else if (weather.currentWeather === 'fog') {
      this.weatherOverlay.setVisible(true);
      this.weatherOverlay.fillStyle(0xffffff, 0.15);
      this.weatherOverlay.fillRect(0, 0, 1280, 720);
    } else if (weather.currentWeather === 'sandstorm') {
      this.weatherOverlay.setVisible(true);
      this.weatherOverlay.fillStyle(0xaa8844, 0.1);
      this.weatherOverlay.fillRect(0, 0, 1280, 720);
    } else {
      this.weatherOverlay.setVisible(false);
    }
  }

  private syncWeatherToHUD(): void {
    const weather = this.weatherSystem.getCurrentWeather();
    const hud = this.scene.get('HUD') as HUD | undefined;
    if (hud) {
      hud.updateWeatherText(weather.weatherName);
    }
  }

  // ─────────────────────── PHASE 3: HERO RENDERING ───────────────────────

  private renderHero(): void {
    const heroId = this.heroManager.getHero('player');
    if (heroId === null || !this.gameManager.world.isAlive(heroId)) {
      if (this.heroImage) this.heroImage.setVisible(false);
      if (this.heroGlow) this.heroGlow.setVisible(false);
      if (this.heroRect) this.heroRect.setVisible(false);
      return;
    }

    const pos = this.gameManager.world.getComponent<Position>(heroId, 'Position');
    if (!pos) return;

    const screenX = this.ecsXToScreen(pos.x);
    const screenY = GameScene.GROUND_Y - 20; // 40/2
    const currentAge = this.playerAgeSystem.getCurrentAge();
    const heroKey = HERO_IDS[currentAge] ?? 'grok';
    const textureKey = this.spriteFactory.getHeroTextureKey(heroKey, 'player');
    const hasTexture = this.textures.exists(textureKey);

    if (hasTexture) {
      // Gold glow outline behind hero
      if (!this.heroGlow) {
        this.heroGlow = this.add.rectangle(screenX, screenY, 36, 44, 0xffd700, 0.25)
          .setDepth(5);
      } else {
        this.heroGlow.setPosition(screenX, screenY);
        this.heroGlow.setVisible(true);
      }

      if (!this.heroImage) {
        this.heroImage = this.add.image(screenX, screenY, textureKey)
          .setDepth(6);
      } else {
        this.heroImage.setPosition(screenX, screenY);
        this.heroImage.setTexture(textureKey);
        this.heroImage.setVisible(true);
      }

      // Hide old rect
      if (this.heroRect) this.heroRect.setVisible(false);
    } else {
      // Fallback
      if (!this.heroRect) {
        this.heroRect = this.add.rectangle(screenX, screenY, 32, 40, 0x4488ff)
          .setStrokeStyle(2, 0xffd700)
          .setDepth(6);
      } else {
        this.heroRect.setPosition(screenX, screenY);
        this.heroRect.setVisible(true);
      }
    }
  }

  private syncHeroHpToHUD(): void {
    const heroId = this.heroManager.getHero('player');
    const hud = this.scene.get('HUD') as HUD | undefined;
    if (!hud) return;

    if (heroId !== null && this.gameManager.world.isAlive(heroId)) {
      const health = this.gameManager.world.getComponent<Health>(heroId, 'Health');
      if (health) {
        hud.updateHeroHp(health.current, health.max);
      }
    } else {
      hud.updateHeroHp(0, 0);
    }
  }

  // ─────────────────────── PHASE 3: TURRET RENDERING ───────────────────────

  private renderTurrets(): void {
    // Clean up old rects/images for turrets that no longer exist
    for (const [entityId, rect] of this.turretRects) {
      if (!this.gameManager.world.isAlive(entityId)) {
        rect.destroy();
        this.turretRects.delete(entityId);
      }
    }
    for (const [entityId, img] of this.turretImages) {
      if (!this.gameManager.world.isAlive(entityId)) {
        img.destroy();
        this.turretImages.delete(entityId);
      }
    }

    // Render player turrets
    const occupiedSlots = this.playerTurretManager.getOccupiedSlots();
    for (const slot of occupiedSlots) {
      const turretInfo = this.playerTurretManager.getTurretInSlot(slot);
      if (!turretInfo) continue;

      const pos = this.playerTurretManager.getSlotPosition(slot);
      const screenX = this.ecsXToScreen(pos.x);
      const screenY = GameScene.GROUND_Y - 20;
      const turretId = turretInfo.turretId;
      const textureKey = this.turretRendererFactory.getTextureKey(turretId, 'player');
      const hasTexture = this.textures.exists(textureKey);

      if (hasTexture) {
        let img = this.turretImages.get(turretInfo.entityId);
        if (!img) {
          img = this.add.image(screenX, screenY, textureKey).setDepth(4);
          this.turretImages.set(turretInfo.entityId, img);
        } else {
          img.setPosition(screenX, screenY);
        }
        // Remove old rect if exists
        const oldRect = this.turretRects.get(turretInfo.entityId);
        if (oldRect) {
          oldRect.destroy();
          this.turretRects.delete(turretInfo.entityId);
        }
      } else {
        let rect = this.turretRects.get(turretInfo.entityId);
        if (!rect) {
          rect = this.add.rectangle(screenX, screenY, 16, 16, 0x44aaff)
            .setStrokeStyle(1, 0xffffff)
            .setDepth(4);
          this.turretRects.set(turretInfo.entityId, rect);
        } else {
          rect.setPosition(screenX, screenY);
        }
      }
    }
  }

  // ─────────────────────── BASE TEXTURE UPDATE ───────────────────────

  private updateBaseTexture(faction: 'player' | 'enemy', age: number): void {
    const baseH = 100;
    const baseY = GameScene.GROUND_Y - baseH / 2;
    const baseX = faction === 'player' ? GameScene.PLAYER_BASE_X : GameScene.ENEMY_BASE_X;
    const textureKey = this.baseRenderer.getTextureKey(age, faction);

    if (faction === 'player') {
      if (this.playerBaseImage) {
        this.playerBaseImage.setTexture(textureKey);
      } else {
        this.playerBaseImage = this.add.image(baseX, baseY, textureKey).setDepth(0);
      }
    } else {
      if (this.enemyBaseImage) {
        this.enemyBaseImage.setTexture(textureKey);
      } else {
        this.enemyBaseImage = this.add.image(baseX, baseY, textureKey).setDepth(0);
      }
    }
  }

  private updateBaseDamageOverlays(): void {
    const baseH = 100;
    const baseY = GameScene.GROUND_Y - baseH / 2;

    // Player damage overlay
    const playerPct = this.gameState.player.baseMaxHp > 0
      ? this.gameState.player.baseHp / this.gameState.player.baseMaxHp : 1;
    this.updateDamageImage('player', GameScene.PLAYER_BASE_X, baseY, playerPct);

    // Enemy damage overlay
    const enemyPct = this.gameState.enemy.baseMaxHp > 0
      ? this.gameState.enemy.baseHp / this.gameState.enemy.baseMaxHp : 1;
    this.updateDamageImage('enemy', GameScene.ENEMY_BASE_X, baseY, enemyPct);
  }

  private updateDamageImage(faction: 'player' | 'enemy', x: number, y: number, hpPct: number): void {
    let level = 0;
    if (hpPct < 0.25) level = 3;
    else if (hpPct < 0.5) level = 2;
    else if (hpPct < 0.75) level = 1;

    const imgRef = faction === 'player' ? 'playerBaseDamageImage' : 'enemyBaseDamageImage';

    if (level === 0) {
      if (this[imgRef]) {
        this[imgRef]!.setVisible(false);
      }
      return;
    }

    const key = this.baseRenderer.getDamageTextureKey(level);
    if (!this[imgRef]) {
      this[imgRef] = this.add.image(x, y, key).setDepth(2);
    } else {
      this[imgRef]!.setTexture(key);
      this[imgRef]!.setPosition(x, y);
      this[imgRef]!.setVisible(true);
    }
  }

  // ─────────────────────── END SCREEN ───────────────────────

  private showEndScreen(text: string, color: string): void {
    const panelH = this.mode === 'campaign' && this.campaignStars ? 240 : 200;
    this.add.rectangle(640, 360, 400, panelH, 0x000000, 0.85).setDepth(9998);
    this.add.text(640, 310, text, {
      fontSize: '48px', fontFamily: 'monospace', color, fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(9999);

    // Campaign: show star rating
    if (this.mode === 'campaign' && this.campaignStars) {
      const starText = '\u2605'.repeat(this.campaignStars) + '\u2606'.repeat(3 - this.campaignStars);
      this.add.text(640, 365, starText, {
        fontSize: '36px', fontFamily: 'monospace', color: '#FFD700',
      }).setOrigin(0.5).setDepth(9999);
    }

    const btnText = this.mode === 'campaign' ? 'Back to Campaign' : 'Main Menu';
    const targetScene = this.mode === 'campaign' ? 'CampaignMapScene' : 'MainMenuScene';

    const menuBtn = this.add.text(640, this.mode === 'campaign' && this.campaignStars ? 420 : 400, btnText, {
      fontSize: '20px', fontFamily: 'monospace', color: '#ffffff',
      backgroundColor: '#333333', padding: { x: 20, y: 8 },
    }).setOrigin(0.5).setDepth(9999).setInteractive({ useHandCursor: true });

    menuBtn.on('pointerdown', () => {
      // shutdown() is called automatically by Phaser when scene.start() triggers
      this.scene.start(targetScene);
    });
  }

  /**
   * Phaser lifecycle method — called automatically when the scene stops or restarts.
   * Cleans up all event listeners, timers, audio, and Phaser objects to prevent memory leaks.
   */
  shutdown(): void {
    // Cancel all campaign modifier timers
    this.time.removeAllEvents();

    // Remove custom event listeners from GameManager
    if (this.gameManager?.events) {
      this.gameManager.events.clear();
    }

    // Remove HUD event listeners
    const hudScene = this.scene.get('HUD');
    if (hudScene) {
      hudScene.events.removeAllListeners();
    }

    // Stop music
    if (this.audioManager) {
      this.audioManager.stopMusic();
    }

    // Destroy tracked Phaser objects
    this.entitySprites?.forEach(sprite => sprite.destroy());
    this.entitySprites?.clear();
    this.entityRects?.forEach(rect => rect.destroy());
    this.entityRects?.clear();
    this.turretImages?.forEach(img => img.destroy());
    this.turretImages?.clear();
    this.turretRects?.forEach(rect => rect.destroy());
    this.turretRects?.clear();

    // Destroy hero visuals
    this.heroImage?.destroy();
    this.heroGlow?.destroy();
    this.heroRect?.destroy();

    // Destroy terrain visuals
    if (this.terrainZoneGraphics) {
      for (const gfx of this.terrainZoneGraphics) gfx.destroy();
    }
    if (this.terrainZoneLabels) {
      for (const label of this.terrainZoneLabels) label.destroy();
    }

    // Destroy weather overlay
    this.weatherOverlay?.destroy();

    // Destroy clouds
    if (this.clouds) {
      for (const cloud of this.clouds) cloud.rect.destroy();
    }

    // Destroy ground details
    if (this.groundDetails) {
      for (const detail of this.groundDetails) detail.destroy();
    }

    // Destroy base objects
    this.playerBase?.destroy();
    this.enemyBase?.destroy();
    this.playerFlag?.destroy();
    this.enemyFlag?.destroy();
    this.baseCrackGraphics?.destroy();
    this.battleLine?.destroy();
    this.ground?.destroy();

    // Clean up juice manager
    this.juice?.destroy();

    // Clean up particles
    this.particles?.destroy?.();

    // Stop HUD scene
    this.scene.stop('HUD');
  }
}
