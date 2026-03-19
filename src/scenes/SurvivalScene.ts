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
import { WaveManager } from '../core/managers/WaveManager';
import { BuffManager, BuffConfig } from '../core/managers/BuffManager';
import type { Position } from '../core/components/Position';
import type { Faction } from '../core/components/Faction';
import type { Renderable } from '../core/components/Renderable';
import type { UnitType as UnitTypeComponent } from '../core/components/UnitType';
import type { UnitType } from '../types/Unit';

import survivalData from '../config/survival.json';

const UNIT_SIZES: Record<string, [number, number]> = {
  infantry: [16, 24],
  ranged: [14, 22],
  heavy: [24, 32],
  special: [20, 28],
  hero: [28, 36],
};

const FACTION_COLORS: Record<string, number> = {
  player: 0x4488ff,
  enemy: 0xff4444,
};

const AGE_NAMES: Record<number, string> = {
  1: 'Prehistoric', 2: 'Bronze Age', 3: 'Classical', 4: 'Medieval',
  5: 'Gunpowder', 6: 'Industrial', 7: 'Modern', 8: 'Future',
};

const STORAGE_KEY = 'eow_survival_best';

/**
 * SurvivalScene -- wave-based survival mode.
 * No enemy base. Player defends against increasingly difficult waves.
 * Every 5 waves, player picks a buff. Player auto-evolves with waves.
 */
export class SurvivalScene extends Phaser.Scene {
  // ── ECS & managers ──
  private gameManager!: GameManager;
  private configLoader!: ConfigLoader;
  private playerEconomy!: EconomySystem;
  private playerAgeSystem!: AgeSystem;
  private waveManager!: WaveManager;
  private buffManager!: BuffManager;

  // ── State ──
  private gameState!: GameState;
  private floatingText!: FloatingTextManager;
  private particles!: ParticleManager;

  // ── Rendering ──
  private entityRects: Map<number, Phaser.GameObjects.Rectangle> = new Map();
  private playerBase!: Phaser.GameObjects.Rectangle;
  private ground!: Phaser.GameObjects.Graphics;
  private clouds: { rect: Phaser.GameObjects.Rectangle; speed: number }[] = [];

  // ── Wave UI ──
  private waveText!: Phaser.GameObjects.Text;
  private waveTimerText!: Phaser.GameObjects.Text;
  private enemiesText!: Phaser.GameObjects.Text;

  // ── Buff selection ──
  private isSelectingBuff: boolean = false;
  private buffContainer: Phaser.GameObjects.Container | null = null;

  // ── Keys ──
  private keys!: {
    Q: Phaser.Input.Keyboard.Key;
    W: Phaser.Input.Keyboard.Key;
    E: Phaser.Input.Keyboard.Key;
    R: Phaser.Input.Keyboard.Key;
    SPACE: Phaser.Input.Keyboard.Key;
    ESC: Phaser.Input.Keyboard.Key;
  };

  // ── Constants ──
  private static readonly GROUND_Y = 560;
  private static readonly PLAYER_BASE_X = 80;
  private static readonly ENEMY_BASE_X = 1200;

  // ── Tracking ──
  private lastPlayerGold: number = 0;
  private lastPlayerBaseHp: number = 0;
  private bestWave: number = 0;

  constructor() {
    super({ key: 'SurvivalScene' });
  }

  create(): void {
    this.gameState = createInitialGameState();

    // Load best wave from storage
    this.bestWave = this.loadBestWave();

    // ── Instantiate systems ──
    this.configLoader = new ConfigLoader();
    this.gameManager = new GameManager();
    this.playerEconomy = new EconomySystem(this.gameState.player.gold, 1);
    this.playerAgeSystem = new AgeSystem(this.configLoader, this.playerEconomy, 1);
    this.waveManager = new WaveManager(this.configLoader);
    this.buffManager = new BuffManager();

    // Set initial base HP
    const initialBaseHp = this.playerAgeSystem.getBaseHp();
    this.gameState.player.baseHp = initialBaseHp;
    this.gameState.player.baseMaxHp = initialBaseHp;
    // Enemy base not used in survival but set high to prevent false game-over
    this.gameState.enemy.baseHp = 999999;
    this.gameState.enemy.baseMaxHp = 999999;
    this.gameManager.setPlayerBaseHp(this.gameState.player.baseHp);
    this.gameManager.setEnemyBaseHp(999999);

    // Clear entity rects
    this.entityRects = new Map();

    // ── Wire events ──
    this.wireEvents();

    // ── Draw world ──
    this.particles = new ParticleManager(this);
    this.createGround();
    this.createClouds();
    this.createPlayerBase();

    // Floating text
    this.floatingText = new FloatingTextManager(this);

    // ── Wave UI ──
    this.waveText = this.add.text(640, 20, 'Wave 0', {
      fontSize: '24px', fontFamily: "'Impact', 'Arial Black', sans-serif", color: '#ffcc00', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(100);

    this.waveTimerText = this.add.text(640, 48, '', {
      fontSize: '14px', fontFamily: "'Trebuchet MS', sans-serif", color: '#aaaacc',
    }).setOrigin(0.5).setDepth(100);

    this.enemiesText = this.add.text(640, 68, '', {
      fontSize: '12px', fontFamily: "'Courier New', Courier, monospace", color: '#ff8888',
    }).setOrigin(0.5).setDepth(100);

    // Best wave display
    this.add.text(1200, 20, `Best: Wave ${this.bestWave}`, {
      fontSize: '12px', fontFamily: "'Courier New', Courier, monospace", color: '#666688',
    }).setOrigin(0.5).setDepth(100);

    // Setup input
    this.setupInput();

    // Share game state with HUD
    this.data.set('gameState', this.gameState);

    // Launch HUD
    this.scene.launch('HUD');
    this.time.delayedCall(50, () => this.pushUnitDefsToHUD());

    // ── Wire wave events ──
    this.waveManager.on('waveStart', (data) => {
      this.onWaveStart(data.wave);
    });
    this.waveManager.on('waveComplete', (data) => {
      this.onWaveComplete(data.wave);
    });
    this.waveManager.on('buffSelection', () => {
      this.showBuffSelection();
    });

    // Start wave manager
    this.waveManager.start();

    // Track values
    this.lastPlayerGold = this.gameState.player.gold;
    this.lastPlayerBaseHp = this.gameState.player.baseHp;
  }

  // ─────────────────────── EVENT WIRING ───────────────────────

  private wireEvents(): void {
    this.gameManager.events.on('death', (e) => {
      if (e.faction === 'enemy') {
        const reward = this.playerEconomy.earnFromKill(
          e.unitType as UnitType,
          this.waveManager.getWaveAge(this.waveManager.getCurrentWave())
        );
        const pos = this.gameManager.world.getComponent<Position>(e.entityId, 'Position');
        if (pos) {
          const screenX = this.ecsXToScreen(pos.x);
          const screenY = SurvivalScene.GROUND_Y - 30;
          this.floatingText.spawnGold(screenX, screenY, reward.gold);
          this.particles.spawnExplosion(screenX, screenY, 0xff4444, 1);
        }
        // Notify wave manager
        this.waveManager.onEnemyKilled();
      } else if (e.faction === 'player') {
        const pos = this.gameManager.world.getComponent<Position>(e.entityId, 'Position');
        if (pos) {
          this.particles.spawnExplosion(this.ecsXToScreen(pos.x), SurvivalScene.GROUND_Y - 30, 0x4488ff, 1);
        }
      }
    });

    this.gameManager.events.on('damage', (e) => {
      const pos = this.gameManager.world.getComponent<Position>(e.targetId, 'Position');
      if (pos) {
        const screenX = this.ecsXToScreen(pos.x);
        this.floatingText.spawnDamage(screenX, SurvivalScene.GROUND_Y - 20, e.damage);
        if (e.damage > 20) {
          this.particles.spawnBloodSplash(screenX, SurvivalScene.GROUND_Y - 20);
        } else {
          this.particles.spawnSparks(screenX, SurvivalScene.GROUND_Y - 20);
        }
      }
    });

    this.gameManager.events.on('baseHit', (e) => {
      if (e.faction === 'player') {
        this.gameState.player.baseHp = Math.max(0, e.remainingHp);
      }
    });
  }

  // ─────────────────────── COORDINATE MAPPING ───────────────────────

  private ecsXToScreen(ecsX: number): number {
    const t = (ecsX - 50) / (1550 - 50);
    return SurvivalScene.PLAYER_BASE_X + t * (SurvivalScene.ENEMY_BASE_X - SurvivalScene.PLAYER_BASE_X);
  }

  // ─────────────────────── WORLD SETUP ───────────────────────

  private createGround(): void {
    this.ground = this.add.graphics();
    this.ground.fillStyle(0x5588cc, 1);
    this.ground.fillRect(0, 0, 1280, SurvivalScene.GROUND_Y);
    this.ground.fillStyle(0x88bbee, 1);
    this.ground.fillRect(0, SurvivalScene.GROUND_Y - 100, 1280, 100);
    this.ground.fillStyle(0x557733, 1);
    this.ground.fillRect(0, SurvivalScene.GROUND_Y, 1280, 8);
    this.ground.fillStyle(0x664422, 1);
    this.ground.fillRect(0, SurvivalScene.GROUND_Y + 8, 1280, 720 - SurvivalScene.GROUND_Y - 8);
    this.ground.fillStyle(0x66aa33, 1);
    this.ground.fillRect(0, SurvivalScene.GROUND_Y - 2, 1280, 4);
    this.ground.setDepth(-10);
  }

  private createClouds(): void {
    const cloudCount = 3 + Math.floor(Math.random() * 2);
    this.clouds = [];
    for (let i = 0; i < cloudCount; i++) {
      const x = Math.random() * 1280;
      const y = 60 + Math.random() * 200;
      const w = 60 + Math.random() * 100;
      const h = 12 + Math.random() * 16;
      const speed = 8 + Math.random() * 15;
      const alpha = 0.15 + Math.random() * 0.15;
      const rect = this.add.rectangle(x, y, w, h, 0xffffff, alpha).setDepth(-8);
      this.clouds.push({ rect, speed });
    }
  }

  private createPlayerBase(): void {
    const baseW = 48;
    const baseH = 80;
    const baseY = SurvivalScene.GROUND_Y - baseH / 2;
    this.playerBase = this.add.rectangle(
      SurvivalScene.PLAYER_BASE_X, baseY, baseW, baseH, 0x2244aa
    ).setStrokeStyle(3, 0x4488ff).setDepth(0);
  }

  // ─────────────────────── INPUT ───────────────────────

  private setupInput(): void {
    if (!this.input.keyboard) return;
    this.keys = {
      Q: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q),
      W: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      E: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E),
      R: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R),
      SPACE: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
      ESC: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC),
    };
  }

  private handleInput(): void {
    if (!this.keys || this.isSelectingBuff) return;

    const currentUnits = this.playerAgeSystem.getAvailableUnits();
    const spawnKeys = [this.keys.Q, this.keys.W, this.keys.E, this.keys.R];
    const unitIds = this.playerAgeSystem.getAvailableUnitIds();

    for (let i = 0; i < Math.min(4, currentUnits.length); i++) {
      if (Phaser.Input.Keyboard.JustDown(spawnKeys[i])) {
        const unitConfig = currentUnits[i];
        const cost = unitConfig.stats.cost;
        if (this.playerEconomy.canAfford(cost)) {
          this.playerEconomy.spend(cost);
          this.enqueuePlayerSpawn(unitIds[i], unitConfig);

          const hud = this.scene.get('HUD') as HUD | undefined;
          hud?.startUnitCooldown(i, unitConfig.stats.spawnTime);

          this.floatingText.spawn(
            SurvivalScene.PLAYER_BASE_X + 60, SurvivalScene.GROUND_Y - 40,
            `-${cost}g`, '#ff8888'
          );
          this.particles.spawnFlash(SurvivalScene.PLAYER_BASE_X + 40, SurvivalScene.GROUND_Y - 12);
          this.particles.spawnDust(SurvivalScene.PLAYER_BASE_X + 40, SurvivalScene.GROUND_Y);
        }
      }
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.SPACE)) {
      this.trySpecial();
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.ESC)) {
      this.togglePause();
    }
  }

  // ─────────────────────── SPAWNING ───────────────────────

  private enqueuePlayerSpawn(unitId: string, unitConfig: UnitConfig): void {
    const age = this.playerAgeSystem.getCurrentAge();
    let req: SpawnRequest = {
      faction: 'player',
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
      spriteKey: unitId,
      cost: unitConfig.stats.cost,
    };
    // Apply buff modifications
    req = this.buffManager.applyToSpawnRequest(req);
    this.gameManager.spawnSystem.enqueue(req);
  }

  // ─────────────────────── GAME ACTIONS ───────────────────────

  private trySpecial(): void {
    const hud = this.scene.get('HUD') as HUD | undefined;
    hud?.startSpecialCooldown(30);
    this.cameras.main.shake(300, 0.008);

    const combatants = this.gameManager.world.query('Position', 'Faction', 'Health');
    for (const id of combatants) {
      const faction = this.gameManager.world.getComponent<Faction>(id, 'Faction');
      if (faction && faction.faction === 'enemy') {
        const health = this.gameManager.world.getComponent<{ current: number; max: number }>(id, 'Health');
        if (health) {
          health.current -= 50;
          const pos = this.gameManager.world.getComponent<Position>(id, 'Position');
          if (pos) {
            const screenX = this.ecsXToScreen(pos.x);
            this.floatingText.spawnDamage(screenX, SurvivalScene.GROUND_Y - 20, 50);
            this.particles.spawnSparks(screenX, SurvivalScene.GROUND_Y - 20);
          }
        }
      }
    }
  }

  private togglePause(): void {
    this.gameState.isPaused = !this.gameState.isPaused;
    if (this.gameState.isPaused) {
      this.gameManager.pause();
      // Do NOT call this.scene.pause() — it prevents input from unpausing
      const pauseText = this.add.text(640, 360, 'PAUSED\n\nPress ESC to resume', {
        fontSize: '32px', fontFamily: "'Impact', 'Arial Black', sans-serif", color: '#ffffff',
        align: 'center', backgroundColor: '#00000088', padding: { x: 40, y: 20 },
      }).setOrigin(0.5).setDepth(9999);

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

  // ─────────────────────── WAVE EVENTS ───────────────────────

  private onWaveStart(wave: number): void {
    // Auto-evolve player every 5 waves
    const targetAge = this.waveManager.getPlayerAge(wave);
    while (this.playerAgeSystem.getCurrentAge() < targetAge && this.playerAgeSystem.getCurrentAge() < 8) {
      // Force evolve by granting XP
      const xpNeeded = this.playerAgeSystem.getXpToNext();
      this.playerEconomy.addXP(xpNeeded);
      this.playerAgeSystem.evolve();

      const newBaseHp = this.playerAgeSystem.getBaseHp();
      const hpGain = newBaseHp - this.gameState.player.baseMaxHp;
      this.gameState.player.baseMaxHp = newBaseHp;
      this.gameState.player.baseHp = Math.min(this.gameState.player.baseHp + hpGain, newBaseHp);
      this.gameManager.setPlayerBaseHp(this.gameState.player.baseHp);
      this.gameState.player.currentAge = this.playerAgeSystem.getCurrentAge();
      this.pushUnitDefsToHUD();

      const ageName = AGE_NAMES[this.playerAgeSystem.getCurrentAge()] ?? `Age ${this.playerAgeSystem.getCurrentAge()}`;
      this.playEvolutionFlash(ageName);
    }

    // Show wave announcement
    const announcement = this.add.text(640, 300, `WAVE ${wave}`, {
      fontSize: '40px', fontFamily: "'Impact', 'Arial Black', sans-serif", color: '#ffcc00',
      fontStyle: 'bold', stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(8000).setAlpha(0);

    this.tweens.add({
      targets: announcement,
      alpha: { from: 0, to: 1 },
      scaleX: { from: 0.5, to: 1 },
      scaleY: { from: 0.5, to: 1 },
      duration: 300,
      ease: 'Back.easeOut',
      yoyo: true,
      hold: 600,
      onComplete: () => announcement.destroy(),
    });
  }

  private onWaveComplete(wave: number): void {
    // Apply between-wave buff effects
    const heal = this.buffManager.getBetweenWaveHeal();
    if (heal > 0) {
      this.gameState.player.baseHp = Math.min(
        this.gameState.player.baseHp + heal,
        this.gameState.player.baseMaxHp
      );
      this.gameManager.setPlayerBaseHp(this.gameState.player.baseHp);
    }

    // Interest on gold
    const interestRate = this.buffManager.getInterestRate();
    if (interestRate > 0) {
      const interest = Math.floor(this.playerEconomy.getRawGold() * interestRate);
      this.playerEconomy.addGold(interest);
    }

    // Check milestones
    this.checkMilestone(wave);
  }

  private checkMilestone(wave: number): void {
    const milestones = survivalData.milestones;
    for (const m of milestones) {
      if (wave === m.wave) {
        const milestoneText = this.add.text(640, 200, `MILESTONE: ${m.title.toUpperCase()}!`, {
          fontSize: '28px', fontFamily: "'Impact', 'Arial Black', sans-serif", color: '#ffcc00',
          fontStyle: 'bold', stroke: '#000000', strokeThickness: 4,
          backgroundColor: '#00000088', padding: { x: 20, y: 10 },
        }).setOrigin(0.5).setDepth(8500).setAlpha(0);

        this.tweens.add({
          targets: milestoneText,
          alpha: { from: 0, to: 1 },
          y: { from: 220, to: 180 },
          duration: 500,
          ease: 'Sine.easeOut',
          yoyo: true,
          hold: 2000,
          onComplete: () => milestoneText.destroy(),
        });
      }
    }
  }

  // ─────────────────────── BUFF SELECTION ───────────────────────

  private showBuffSelection(): void {
    this.isSelectingBuff = true;
    this.gameManager.pause();

    const choices = this.buffManager.getRandomBuffChoices(3);
    this.buffContainer = this.add.container(640, 360).setDepth(9000);

    // Overlay
    const overlay = this.add.rectangle(0, 0, 1280, 720, 0x000000, 0.7);
    this.buffContainer.add(overlay);

    // Title
    const title = this.add.text(0, -180, 'CHOOSE A BUFF', {
      fontSize: '28px', fontFamily: "'Impact', 'Arial Black', sans-serif", color: '#ffcc00', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.buffContainer.add(title);

    // Cards
    const cardW = 220;
    const cardH = 240;
    const spacing = 30;
    const totalW = choices.length * cardW + (choices.length - 1) * spacing;
    const startX = -totalW / 2 + cardW / 2;

    for (let i = 0; i < choices.length; i++) {
      const buff = choices[i];
      const x = startX + i * (cardW + spacing);
      this.createBuffCard(buff, x, 20, cardW, cardH);
    }
  }

  private createBuffCard(buff: BuffConfig, x: number, y: number, w: number, h: number): void {
    if (!this.buffContainer) return;

    const categoryColor = BuffManager.getCategoryColor(buff.category);
    const categoryHex = BuffManager.getCategoryColorHex(buff.category);

    const bg = this.add.rectangle(x, y, w, h, 0x111122, 0.95)
      .setStrokeStyle(3, categoryColor)
      .setInteractive({ useHandCursor: true });
    this.buffContainer.add(bg);

    // Category label
    const catLabel = this.add.text(x, y - h / 2 + 20, buff.category.toUpperCase(), {
      fontSize: '11px', fontFamily: "'Trebuchet MS', sans-serif", color: categoryHex, fontStyle: 'bold',
    }).setOrigin(0.5);
    this.buffContainer.add(catLabel);

    // Rarity
    if (buff.rarity === 'legendary') {
      const rarityLabel = this.add.text(x, y - h / 2 + 36, 'LEGENDARY', {
        fontSize: '10px', fontFamily: "'Trebuchet MS', sans-serif", color: '#aa44ff', fontStyle: 'bold',
      }).setOrigin(0.5);
      this.buffContainer.add(rarityLabel);
    }

    // Name
    const nameText = this.add.text(x, y - 20, buff.name, {
      fontSize: '16px', fontFamily: "'Impact', 'Arial Black', sans-serif", color: '#ffffff', fontStyle: 'bold',
      wordWrap: { width: w - 20 }, align: 'center',
    }).setOrigin(0.5);
    this.buffContainer.add(nameText);

    // Description
    const descText = this.add.text(x, y + 30, buff.description, {
      fontSize: '12px', fontFamily: "'Trebuchet MS', sans-serif", color: '#aaaacc',
      wordWrap: { width: w - 20 }, align: 'center',
    }).setOrigin(0.5);
    this.buffContainer.add(descText);

    // Hover effects
    bg.on('pointerover', () => bg.setStrokeStyle(3, 0xffffff));
    bg.on('pointerout', () => bg.setStrokeStyle(3, categoryColor));
    bg.on('pointerdown', () => {
      this.selectBuff(buff);
    });
  }

  private selectBuff(buff: BuffConfig): void {
    this.buffManager.activateBuff(buff.id);
    this.isSelectingBuff = false;
    this.gameManager.resume();

    if (this.buffContainer) {
      this.buffContainer.destroy();
      this.buffContainer = null;
    }

    // Apply immediate effects (like fortified walls)
    const baseHpBonus = this.buffManager.getBaseHpBonus();
    if (baseHpBonus > 0) {
      // Only apply the newly added bonus
      const currentBonusFromBuff = buff.effect.type === 'base_hp' ? (buff.effect.value ?? 0) : 0;
      if (currentBonusFromBuff > 0) {
        this.gameState.player.baseMaxHp += currentBonusFromBuff;
        this.gameState.player.baseHp += currentBonusFromBuff;
        this.gameManager.setPlayerBaseHp(this.gameState.player.baseHp);
      }
    }

    // Confirmation text
    const confirmText = this.add.text(640, 300, `${buff.name} activated!`, {
      fontSize: '20px', fontFamily: "'Trebuchet MS', sans-serif",
      color: BuffManager.getCategoryColorHex(buff.category),
      fontStyle: 'bold', stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(8000).setAlpha(0);

    this.tweens.add({
      targets: confirmText,
      alpha: { from: 0, to: 1 },
      y: { from: 310, to: 280 },
      duration: 300,
      yoyo: true,
      hold: 800,
      onComplete: () => confirmText.destroy(),
    });
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

  private playEvolutionFlash(ageName: string): void {
    this.cameras.main.flash(500, 255, 255, 200);
    this.particles.spawnMagic(SurvivalScene.PLAYER_BASE_X, SurvivalScene.GROUND_Y - 40, 0x8844ff);

    const ageNameText = this.add.text(640, 280, ageName, {
      fontSize: '36px', fontFamily: "'Impact', 'Arial Black', sans-serif", color: '#ffdd00',
      fontStyle: 'bold', stroke: '#000000', strokeThickness: 6,
    }).setOrigin(0.5).setDepth(8500).setAlpha(0);

    this.tweens.add({
      targets: ageNameText,
      alpha: { from: 0, to: 1 },
      y: { from: 290, to: 270 },
      duration: 400,
      yoyo: true,
      hold: 800,
      onComplete: () => ageNameText.destroy(),
    });
  }

  // ─────────────────────── GAME LOOP ───────────────────────

  update(time: number, delta: number): void {
    if (this.gameState.isPaused || this.isSelectingBuff) return;

    this.handleInput();

    const deltaSec = delta / 1000;
    this.gameState.elapsedTime += deltaSec;

    // Run ECS
    this.gameManager.update(deltaSec);
    this.playerEconomy.update(deltaSec);

    // Sync economy
    this.gameState.player.gold = this.playerEconomy.getRawGold();
    this.gameState.player.xp = this.playerEconomy.getXP();
    this.gameState.player.currentAge = this.playerAgeSystem.getCurrentAge();

    // HUD gold flash
    if (this.gameState.player.gold > this.lastPlayerGold + 0.5) {
      const hud = this.scene.get('HUD') as HUD | undefined;
      hud?.flashGoldText();
    }
    this.lastPlayerGold = this.gameState.player.gold;

    // Sync base HP
    const newPlayerBaseHp = Math.max(0, this.gameManager.playerBaseHp);
    if (newPlayerBaseHp < this.lastPlayerBaseHp) {
      const hud = this.scene.get('HUD') as HUD | undefined;
      hud?.flashPlayerHpBar();
    }
    this.gameState.player.baseHp = newPlayerBaseHp;
    this.lastPlayerBaseHp = newPlayerBaseHp;

    // Wave manager
    const spawnRequests = this.waveManager.update(deltaSec);
    for (const req of spawnRequests) {
      this.gameManager.spawnSystem.enqueue(req);
    }

    // Update wave UI
    const waveInfo = this.waveManager.getWaveInfo();
    this.waveText.setText(`Wave ${waveInfo.currentWave}`);
    if (waveInfo.isBetweenWaves) {
      this.waveTimerText.setText(`Next wave in ${Math.ceil(waveInfo.nextWaveTimer)}s`);
      this.enemiesText.setText('');
    } else {
      this.waveTimerText.setText('');
      this.enemiesText.setText(`Enemies: ${waveInfo.enemiesRemaining}`);
    }

    // Render entities
    this.renderEntities();

    // Update clouds
    for (const cloud of this.clouds) {
      cloud.rect.x += cloud.speed * deltaSec;
      if (cloud.rect.x > 1280 + 80) cloud.rect.x = -80;
    }

    // Update particles
    this.particles.update(deltaSec);

    // Sync HUD
    this.data.set('gameState', this.gameState);
    this.floatingText.update(time, delta);

    // Check game over (player base destroyed)
    if (this.gameState.player.baseHp <= 0 && !this.gameState.isGameOver) {
      this.gameState.isGameOver = true;
      this.showGameOver();
    }
  }

  // ─────────────────────── RENDERING ───────────────────────

  private renderEntities(): void {
    const world = this.gameManager.world;
    const renderableEntities = world.query('Position', 'Faction', 'Renderable');
    const aliveIds = new Set<number>();

    for (const entityId of renderableEntities) {
      aliveIds.add(entityId);
      const pos = world.getComponent<Position>(entityId, 'Position')!;
      const faction = world.getComponent<Faction>(entityId, 'Faction')!;
      const renderable = world.getComponent<Renderable>(entityId, 'Renderable')!;
      const unitType = world.getComponent<UnitTypeComponent>(entityId, 'UnitType');

      if (!renderable.visible) {
        const existing = this.entityRects.get(entityId);
        if (existing) existing.setVisible(false);
        continue;
      }

      const archetype = unitType?.type ?? 'infantry';
      const [w, h] = UNIT_SIZES[archetype] ?? UNIT_SIZES['infantry'];
      const color = FACTION_COLORS[faction.faction] ?? 0xffffff;
      const screenX = this.ecsXToScreen(pos.x);
      const screenY = SurvivalScene.GROUND_Y - h / 2;

      let rect = this.entityRects.get(entityId);
      if (!rect) {
        rect = this.add.rectangle(screenX, screenY, w, h, color)
          .setStrokeStyle(1, 0xffffff).setDepth(5);
        this.entityRects.set(entityId, rect);
      } else {
        rect.setPosition(screenX, screenY);
        rect.setSize(w, h);
        rect.setFillStyle(color);
        rect.setVisible(true);
      }
    }

    for (const [entityId, rect] of this.entityRects) {
      if (!aliveIds.has(entityId)) {
        rect.destroy();
        this.entityRects.delete(entityId);
      }
    }
  }

  // ─────────────────────── GAME OVER ───────────────────────

  private showGameOver(): void {
    const wave = this.waveManager.getCurrentWave();

    // Save best wave
    if (wave > this.bestWave) {
      this.bestWave = wave;
      this.saveBestWave(wave);
    }

    // Get milestone
    const milestones = survivalData.milestones;
    let achieved = 'None';
    for (const m of milestones) {
      if (wave >= m.wave) achieved = m.title;
    }

    // Get active buffs
    const activeBuffs = this.buffManager.getActiveBuffs();

    this.add.rectangle(640, 360, 500, 350, 0x000000, 0.9).setDepth(9998);

    this.add.text(640, 230, 'GAME OVER', {
      fontSize: '40px', fontFamily: "'Impact', 'Arial Black', sans-serif", color: '#ff4444', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(9999);

    this.add.text(640, 280, `Wave Reached: ${wave}`, {
      fontSize: '20px', fontFamily: "'Trebuchet MS', sans-serif", color: '#ffffff',
    }).setOrigin(0.5).setDepth(9999);

    this.add.text(640, 310, `Milestone: ${achieved}`, {
      fontSize: '16px', fontFamily: "'Trebuchet MS', sans-serif", color: '#ffcc00',
    }).setOrigin(0.5).setDepth(9999);

    this.add.text(640, 340, `Buffs Collected: ${activeBuffs.length}`, {
      fontSize: '14px', fontFamily: "'Courier New', Courier, monospace", color: '#aaaacc',
    }).setOrigin(0.5).setDepth(9999);

    if (wave > this.bestWave) {
      this.add.text(640, 370, 'NEW BEST!', {
        fontSize: '18px', fontFamily: "'Impact', 'Arial Black', sans-serif", color: '#44ff44', fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(9999);
    }

    const menuBtn = this.add.text(640, 430, 'Main Menu', {
      fontSize: '20px', fontFamily: "'Impact', 'Arial Black', sans-serif", color: '#ffffff',
      backgroundColor: '#333333', padding: { x: 20, y: 8 },
    }).setOrigin(0.5).setDepth(9999).setInteractive({ useHandCursor: true });

    menuBtn.on('pointerdown', () => {
      for (const [, rect] of this.entityRects) rect.destroy();
      this.entityRects.clear();
      this.particles.destroy();
      this.waveManager.reset();
      this.buffManager.reset();
      this.scene.stop('HUD');
      this.scene.start('MainMenuScene');
    });
  }

  // ─────────────────────── PERSISTENCE ───────────────────────

  private loadBestWave(): number {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? parseInt(raw, 10) : 0;
    } catch {
      return 0;
    }
  }

  private saveBestWave(wave: number): void {
    try {
      localStorage.setItem(STORAGE_KEY, String(wave));
    } catch {
      // Ignore storage errors
    }
  }
}
