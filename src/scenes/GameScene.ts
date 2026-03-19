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
import type { Position } from '../core/components/Position';
import type { Faction } from '../core/components/Faction';
import type { Renderable } from '../core/components/Renderable';
import type { UnitType as UnitTypeComponent } from '../core/components/UnitType';
import type { UnitType } from '../types/Unit';

/**
 * Size (w, h) per unit archetype used for placeholder rectangles.
 * Same visual style as the original scene.
 */
const UNIT_SIZES: Record<string, [number, number]> = {
  infantry: [16, 24],
  ranged: [14, 22],
  heavy: [24, 32],
  special: [20, 28],
  hero: [28, 36],
};

/** Color per faction. */
const FACTION_COLORS: Record<string, number> = {
  player: 0x4488ff,
  enemy: 0xff4444,
};

/**
 * GameScene — the main battlefield scene.
 *
 * Uses the real ECS engine via GameManager, ConfigLoader,
 * EconomySystem, and AgeSystem for all game logic.
 */
export class GameScene extends Phaser.Scene {
  // ── ECS & managers ──
  private gameManager!: GameManager;
  private configLoader!: ConfigLoader;
  private playerEconomy!: EconomySystem;
  private enemyEconomy!: EconomySystem;
  private playerAgeSystem!: AgeSystem;
  private enemyAgeSystem!: AgeSystem;

  // ── State ──
  private gameState!: GameState;
  private floatingText!: FloatingTextManager;

  // ── Phaser rectangle pool: ECS entityId → Phaser rectangle ──
  private entityRects: Map<number, Phaser.GameObjects.Rectangle> = new Map();

  // ── Bases ──
  private playerBase!: Phaser.GameObjects.Rectangle;
  private enemyBase!: Phaser.GameObjects.Rectangle;

  // ── Ground ──
  private ground!: Phaser.GameObjects.Graphics;

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

  // ── Constants ──
  private static readonly GROUND_Y = 560;
  private static readonly PLAYER_BASE_X = 80;
  private static readonly ENEMY_BASE_X = 1200;

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data?: { difficulty?: 'easy' | 'normal' | 'hard' }): void {
    this.difficulty = data?.difficulty ?? 'normal';
  }

  create(): void {
    this.gameState = createInitialGameState();

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

    // ── Wire ECS events ──
    this.wireEvents();

    // Share game state with HUD via the data manager
    this.data.set('gameState', this.gameState);

    // Clear any leftover entity rects from a previous game
    this.entityRects = new Map();

    // Draw the world
    this.createGround();
    this.createBases();

    // Floating text manager
    this.floatingText = new FloatingTextManager(this);

    // Setup keyboard
    this.setupInput();

    // Launch HUD overlay scene
    this.scene.launch('HUD');

    // Push initial unit defs to HUD after it's created
    this.time.delayedCall(50, () => {
      this.pushUnitDefsToHUD();
    });
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
          this.floatingText.spawnGold(
            this.ecsXToScreen(pos.x),
            GameScene.GROUND_Y - 30,
            reward.gold
          );
        }
      } else if (e.faction === 'player') {
        // Enemy killed a player unit — enemy earns rewards
        this.enemyEconomy.earnFromKill(
          e.unitType as UnitType,
          this.playerAgeSystem.getCurrentAge()
        );
      }
    });

    // Damage events: show floating damage numbers
    this.gameManager.events.on('damage', (e) => {
      const pos = this.gameManager.world.getComponent<Position>(e.targetId, 'Position');
      if (pos) {
        this.floatingText.spawnDamage(
          this.ecsXToScreen(pos.x),
          GameScene.GROUND_Y - 20,
          e.damage
        );
      }
    });

    // Base hit events
    this.gameManager.events.on('baseHit', (e) => {
      if (e.faction === 'player') {
        this.gameState.player.baseHp = Math.max(0, e.remainingHp);
      } else {
        this.gameState.enemy.baseHp = Math.max(0, e.remainingHp);
      }
    });

    // Game over events
    this.gameManager.events.on('gameOver', (e) => {
      this.gameState.isGameOver = true;
      this.gameState.winner = e.winner;
      if (e.winner === 'player') {
        this.showEndScreen('VICTORY!', '#44ff44');
      } else {
        this.showEndScreen('DEFEAT', '#ff4444');
      }
    });
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

  private createBases(): void {
    const baseW = 48;
    const baseH = 80;
    const baseY = GameScene.GROUND_Y - baseH / 2;

    // Player base (left side, blue tint)
    this.playerBase = this.add.rectangle(
      GameScene.PLAYER_BASE_X, baseY, baseW, baseH, 0x2244aa
    ).setStrokeStyle(3, 0x4488ff).setDepth(0);

    // Flag/banner placeholder on player base
    this.add.rectangle(GameScene.PLAYER_BASE_X, baseY - baseH / 2 - 8, 6, 20, 0x4488ff).setDepth(1);

    // Enemy base (right side, red tint)
    this.enemyBase = this.add.rectangle(
      GameScene.ENEMY_BASE_X, baseY, baseW, baseH, 0xaa2222
    ).setStrokeStyle(3, 0xff4444).setDepth(0);

    // Flag on enemy base
    this.add.rectangle(GameScene.ENEMY_BASE_X, baseY - baseH / 2 - 8, 6, 20, 0xff4444).setDepth(1);
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
    const currentUnits = this.playerAgeSystem.getAvailableUnits();
    const spawnKeys = [this.keys.Q, this.keys.W, this.keys.E, this.keys.R];
    const unitIds = this.playerAgeSystem.getAvailableUnitIds();

    for (let i = 0; i < Math.min(4, currentUnits.length); i++) {
      if (Phaser.Input.Keyboard.JustDown(spawnKeys[i])) {
        const unitConfig = currentUnits[i];
        const cost = unitConfig.stats.cost;

        if (this.playerEconomy.canAfford(cost)) {
          this.playerEconomy.spend(cost);
          this.enqueueSpawn('player', unitIds[i], unitConfig);

          // Trigger HUD cooldown
          const hud = this.scene.get('HUD') as HUD | undefined;
          hud?.startUnitCooldown(i, unitConfig.stats.spawnTime);

          // Show gold spent floating text
          this.floatingText.spawn(
            GameScene.PLAYER_BASE_X + 60,
            GameScene.GROUND_Y - 40,
            `-${cost}g`,
            '#ff8888'
          );
        }
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

    // Hero abilities
    if (Phaser.Input.Keyboard.JustDown(this.keys.ONE)) {
      const hud = this.scene.get('HUD') as HUD | undefined;
      hud?.startHeroCooldown(0, 10);
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.TWO)) {
      const hud = this.scene.get('HUD') as HUD | undefined;
      hud?.startHeroCooldown(1, 15);
    }

    // Pause
    if (Phaser.Input.Keyboard.JustDown(this.keys.ESC)) {
      this.togglePause();
    }
  }

  // ─────────────────────── SPAWNING ───────────────────────

  private enqueueSpawn(faction: 'player' | 'enemy', unitId: string, unitConfig: UnitConfig): void {
    const age = faction === 'player'
      ? this.playerAgeSystem.getCurrentAge()
      : this.enemyAgeSystem.getCurrentAge();

    const req: SpawnRequest = {
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

    this.gameManager.spawnSystem.enqueue(req);
  }

  // ─────────────────────── GAME ACTIONS ───────────────────────

  private tryEvolve(): void {
    if (this.playerAgeSystem.canEvolve()) {
      const newAgeConfig = this.playerAgeSystem.evolve();
      if (newAgeConfig) {
        // Update base HP
        const newBaseHp = this.playerAgeSystem.getBaseHp();
        const hpGain = newBaseHp - this.gameState.player.baseMaxHp;
        this.gameState.player.baseMaxHp = newBaseHp;
        this.gameState.player.baseHp = Math.min(
          this.gameState.player.baseHp + hpGain,
          newBaseHp
        );

        // Sync age in game state
        this.gameState.player.currentAge = this.playerAgeSystem.getCurrentAge();

        // Update HUD unit buttons for new age
        this.pushUnitDefsToHUD();

        // Flash effect
        this.cameras.main.flash(500, 255, 255, 200);

        // Emit ageUp event
        this.gameManager.events.emit('ageUp', {
          faction: 'player',
          newAge: this.playerAgeSystem.getCurrentAge(),
        });
      }
    }
  }

  private trySpecial(): void {
    const hud = this.scene.get('HUD') as HUD | undefined;
    hud?.startSpecialCooldown(30);

    // Damage all enemy units in the ECS world
    const combatants = this.gameManager.world.query('Position', 'Faction', 'Health');
    for (const id of combatants) {
      const faction = this.gameManager.world.getComponent<Faction>(id, 'Faction');
      if (faction && faction.faction === 'enemy') {
        const health = this.gameManager.world.getComponent<{ current: number; max: number }>(id, 'Health');
        if (health) {
          health.current -= 50;
          const pos = this.gameManager.world.getComponent<Position>(id, 'Position');
          if (pos) {
            this.floatingText.spawnDamage(
              this.ecsXToScreen(pos.x),
              GameScene.GROUND_Y - 20,
              50
            );
          }
        }
      }
    }
  }

  private togglePause(): void {
    this.gameState.isPaused = !this.gameState.isPaused;

    if (this.gameState.isPaused) {
      this.gameManager.pause();
      this.scene.pause();
      // Show a simple pause overlay
      const pauseText = this.add.text(640, 360, 'PAUSED\n\nPress ESC to resume', {
        fontSize: '32px',
        fontFamily: 'monospace',
        color: '#ffffff',
        align: 'center',
        backgroundColor: '#00000088',
        padding: { x: 40, y: 20 },
      }).setOrigin(0.5).setDepth(9999).setName('pauseOverlay');

      this.input.keyboard?.once('keydown-ESC', () => {
        pauseText.destroy();
        this.gameState.isPaused = false;
        this.gameManager.resume();
        this.scene.resume();
      });
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

  // ─────────────────────── ENEMY AI ───────────────────────

  private lastEnemySpawnTime = 0;

  private updateEnemyAI(time: number): void {
    const spawnInterval: Record<string, number> = { easy: 4000, normal: 3000, hard: 2000 };
    const interval = spawnInterval[this.difficulty] ?? 3000;

    if (time - this.lastEnemySpawnTime > interval) {
      this.lastEnemySpawnTime = time;

      // Pick from enemy's current age roster
      const units = this.enemyAgeSystem.getAvailableUnits();
      const unitIds = this.enemyAgeSystem.getAvailableUnitIds();

      if (units.length > 0) {
        const idx = Math.floor(Math.random() * units.length);
        const unitConfig = units[idx];
        const cost = unitConfig.stats.cost;

        // Enemy AI checks affordability
        if (this.enemyEconomy.canAfford(cost)) {
          this.enemyEconomy.spend(cost);
          this.enqueueSpawn('enemy', unitIds[idx], unitConfig);
        } else {
          // Fallback: try to spawn the cheapest unit
          const sorted = units
            .map((u, i) => ({ u, i }))
            .sort((a, b) => a.u.stats.cost - b.u.stats.cost);
          for (const entry of sorted) {
            if (this.enemyEconomy.canAfford(entry.u.stats.cost)) {
              this.enemyEconomy.spend(entry.u.stats.cost);
              this.enqueueSpawn('enemy', unitIds[entry.i], entry.u);
              break;
            }
          }
        }
      }

      // Enemy AI evolves when it can
      if (this.enemyAgeSystem.canEvolve()) {
        const newAgeConfig = this.enemyAgeSystem.evolve();
        if (newAgeConfig) {
          const newBaseHp = this.enemyAgeSystem.getBaseHp();
          // Apply difficulty multiplier
          const diffMult = ({ easy: 0.7, normal: 1, hard: 1.4 } as Record<string, number>)[this.difficulty] ?? 1;
          const adjustedMax = Math.round(newBaseHp * diffMult);
          const hpGain = adjustedMax - this.gameState.enemy.baseMaxHp;
          this.gameState.enemy.baseMaxHp = adjustedMax;
          this.gameState.enemy.baseHp = Math.min(
            this.gameState.enemy.baseHp + hpGain,
            adjustedMax
          );
          this.gameState.enemy.currentAge = this.enemyAgeSystem.getCurrentAge();
        }
      }
    }
  }

  // ─────────────────────── GAME LOOP ───────────────────────

  update(time: number, delta: number): void {
    if (this.gameState.isPaused || this.gameState.isGameOver) return;

    this.handleInput();

    const deltaSec = delta / 1000;

    // Update elapsed time
    this.gameState.elapsedTime += deltaSec;

    // Run the ECS update loop (Spawn → Movement → Combat → Health → Cleanup)
    this.gameManager.update(deltaSec);

    // Update economy systems (passive income)
    this.playerEconomy.update(deltaSec);
    this.enemyEconomy.update(deltaSec);

    // Sync economy → gameState
    this.gameState.player.gold = this.playerEconomy.getRawGold();
    this.gameState.player.xp = this.playerEconomy.getXP();
    this.gameState.player.currentAge = this.playerAgeSystem.getCurrentAge();

    // Sync base HP from GameManager
    if (this.gameManager.playerBaseHp < this.gameState.player.baseHp) {
      this.gameState.player.baseHp = Math.max(0, this.gameManager.playerBaseHp);
    }
    if (this.gameManager.enemyBaseHp < this.gameState.enemy.baseHp) {
      this.gameState.enemy.baseHp = Math.max(0, this.gameManager.enemyBaseHp);
    }

    // Check evolve readiness for HUD
    // (HUD reads gameState directly, so just sync the xp threshold)

    // Enemy AI
    this.updateEnemyAI(time);

    // Render ECS entities
    this.renderEntities();

    // Sync game state for HUD
    this.data.set('gameState', this.gameState);

    // Update floating text
    this.floatingText.update(time, delta);

    // Check win/lose from GameManager state
    if (this.gameManager.state === 'victory' && !this.gameState.isGameOver) {
      this.gameState.isGameOver = true;
      this.gameState.winner = 'player';
      this.showEndScreen('VICTORY!', '#44ff44');
    } else if (this.gameManager.state === 'defeat' && !this.gameState.isGameOver) {
      this.gameState.isGameOver = true;
      this.gameState.winner = 'enemy';
      this.showEndScreen('DEFEAT', '#ff4444');
    }
  }

  // ─────────────────────── RENDERING ───────────────────────

  private renderEntities(): void {
    const world = this.gameManager.world;
    const renderableEntities = world.query('Position', 'Faction', 'Renderable');

    // Track which entity IDs are still alive this frame
    const aliveIds = new Set<number>();

    for (const entityId of renderableEntities) {
      aliveIds.add(entityId);

      const pos = world.getComponent<Position>(entityId, 'Position')!;
      const faction = world.getComponent<Faction>(entityId, 'Faction')!;
      const renderable = world.getComponent<Renderable>(entityId, 'Renderable')!;
      const unitType = world.getComponent<UnitTypeComponent>(entityId, 'UnitType');

      if (!renderable.visible) {
        // Hide existing rect if invisible
        const existing = this.entityRects.get(entityId);
        if (existing) existing.setVisible(false);
        continue;
      }

      const archetype = unitType?.type ?? 'infantry';
      const [w, h] = UNIT_SIZES[archetype] ?? UNIT_SIZES['infantry'];
      const color = FACTION_COLORS[faction.faction] ?? 0xffffff;
      const screenX = this.ecsXToScreen(pos.x);
      const screenY = GameScene.GROUND_Y - h / 2;

      let rect = this.entityRects.get(entityId);
      if (!rect) {
        // Create new rectangle for this entity
        rect = this.add.rectangle(screenX, screenY, w, h, color)
          .setStrokeStyle(1, 0xffffff)
          .setDepth(5);
        this.entityRects.set(entityId, rect);
      } else {
        // Update existing rectangle position
        rect.setPosition(screenX, screenY);
        rect.setSize(w, h);
        rect.setFillStyle(color);
        rect.setVisible(true);
      }
    }

    // Remove rectangles for entities that no longer exist
    for (const [entityId, rect] of this.entityRects) {
      if (!aliveIds.has(entityId)) {
        rect.destroy();
        this.entityRects.delete(entityId);
      }
    }
  }

  // ─────────────────────── END SCREEN ───────────────────────

  private showEndScreen(text: string, color: string): void {
    this.add.rectangle(640, 360, 400, 200, 0x000000, 0.85).setDepth(9998);
    this.add.text(640, 330, text, {
      fontSize: '48px', fontFamily: 'monospace', color, fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(9999);

    const menuBtn = this.add.text(640, 400, 'Main Menu', {
      fontSize: '20px', fontFamily: 'monospace', color: '#ffffff',
      backgroundColor: '#333333', padding: { x: 20, y: 8 },
    }).setOrigin(0.5).setDepth(9999).setInteractive({ useHandCursor: true });

    menuBtn.on('pointerdown', () => {
      // Clean up all entity rectangles
      for (const [, rect] of this.entityRects) {
        rect.destroy();
      }
      this.entityRects.clear();

      this.scene.stop('HUD');
      this.scene.start('MainMenuScene');
    });
  }
}
