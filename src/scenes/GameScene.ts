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

  // ── Particles ──
  private particles!: ParticleManager;

  // ── Phaser rectangle pool: ECS entityId → Phaser rectangle ──
  private entityRects: Map<number, Phaser.GameObjects.Rectangle> = new Map();

  // ── Bases ──
  private playerBase!: Phaser.GameObjects.Rectangle;
  private enemyBase!: Phaser.GameObjects.Rectangle;
  private playerBaseDetails!: Phaser.GameObjects.Graphics;
  private enemyBaseDetails!: Phaser.GameObjects.Graphics;
  private playerFlag!: Phaser.GameObjects.Rectangle;
  private enemyFlag!: Phaser.GameObjects.Rectangle;
  private playerFlagPole!: Phaser.GameObjects.Rectangle;
  private enemyFlagPole!: Phaser.GameObjects.Rectangle;
  private baseCrackGraphics!: Phaser.GameObjects.Graphics;

  // ── Ground ──
  private ground!: Phaser.GameObjects.Graphics;

  // ── Parallax clouds ──
  private clouds: { rect: Phaser.GameObjects.Rectangle; speed: number }[] = [];

  // ── Ground detail spots ──
  private groundDetails: Phaser.GameObjects.Rectangle[] = [];

  // ── Battle line indicator ──
  private battleLine!: Phaser.GameObjects.Rectangle;

  // ── Screen effects ──
  public screenShakeEnabled: boolean = true;
  private lowHpOverlay!: Phaser.GameObjects.Graphics;
  private lowHpPulseTimer: number = 0;

  // ── Kill combo ──
  private comboCount: number = 0;
  private comboTimer: number = 0;
  private comboText: Phaser.GameObjects.Text | null = null;

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

    // Sync base HP into GameManager so its game-over checks use the correct values
    this.gameManager.setPlayerBaseHp(this.gameState.player.baseHp);
    this.gameManager.setEnemyBaseHp(this.gameState.enemy.baseHp);

    // ── Wire ECS events ──
    this.wireEvents();

    // Share game state with HUD via the data manager
    this.data.set('gameState', this.gameState);

    // Clear any leftover entity rects from a previous game
    this.entityRects = new Map();

    // ── Particle manager ──
    this.particles = new ParticleManager(this);

    // Draw the world
    this.createGround();
    this.createGroundDetails();
    this.createClouds();
    this.createBases();
    this.createBattleLine();
    this.createLowHpOverlay();

    // Floating text manager
    this.floatingText = new FloatingTextManager(this);

    // Setup keyboard
    this.setupInput();

    // Track initial values for change detection
    this.lastPlayerGold = this.gameState.player.gold;
    this.lastPlayerBaseHp = this.gameState.player.baseHp;

    // Reset combo state
    this.comboCount = 0;
    this.comboTimer = 0;
    this.comboText = null;

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
          const screenX = this.ecsXToScreen(pos.x);
          const screenY = GameScene.GROUND_Y - 30;
          this.floatingText.spawnGold(screenX, screenY, reward.gold);

          // Death explosion particles
          const archetype = e.unitType ?? 'infantry';
          const isHeavy = archetype === 'heavy' || archetype === 'hero';
          this.particles.spawnExplosion(screenX, screenY, 0xff4444, isHeavy ? 1.5 : 1);

          // Screen shake for heavy units
          if (isHeavy && this.screenShakeEnabled) {
            this.cameras.main.shake(200, 0.005);
          }
        }

        // Kill combo tracking
        this.comboCount++;
        this.comboTimer = 3;
        if (this.comboCount >= 3) {
          this.showComboText(this.comboCount);
        }
      } else if (e.faction === 'player') {
        // Enemy killed a player unit — enemy earns rewards
        this.enemyEconomy.earnFromKill(
          e.unitType as UnitType,
          this.playerAgeSystem.getCurrentAge()
        );

        // Player unit death particles (blue)
        const pos = this.gameManager.world.getComponent<Position>(e.entityId, 'Position');
        if (pos) {
          this.particles.spawnExplosion(
            this.ecsXToScreen(pos.x),
            GameScene.GROUND_Y - 30,
            0x4488ff,
            1
          );
        }
      }
    });

    // Damage events: show floating damage numbers + hit particles
    this.gameManager.events.on('damage', (e) => {
      const pos = this.gameManager.world.getComponent<Position>(e.targetId, 'Position');
      if (pos) {
        const screenX = this.ecsXToScreen(pos.x);
        const screenY = GameScene.GROUND_Y - 20;
        this.floatingText.spawnDamage(screenX, screenY, e.damage);

        // Determine hit type for particles
        if (e.damage > 20) {
          this.particles.spawnBloodSplash(screenX, screenY);
        } else {
          this.particles.spawnSparks(screenX, screenY);
        }
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
    });

    // Game over events
    this.gameManager.events.on('gameOver', (e) => {
      this.gameState.isGameOver = true;
      this.gameState.winner = e.winner;

      // Base destruction collapse effect
      if (e.winner === 'player') {
        this.playBaseCollapse('enemy');
      } else {
        this.playBaseCollapse('player');
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
    const baseW = 48;
    const baseH = 80;
    const baseY = GameScene.GROUND_Y - baseH / 2;

    // ── Base detail graphics (windows/doors) ──
    this.playerBaseDetails = this.add.graphics().setDepth(1);
    this.enemyBaseDetails = this.add.graphics().setDepth(1);

    // Player base (left side, blue tint)
    this.playerBase = this.add.rectangle(
      GameScene.PLAYER_BASE_X, baseY, baseW, baseH, 0x2244aa
    ).setStrokeStyle(3, 0x4488ff).setDepth(0);

    // Player base details — windows and door
    this.drawBaseDetails(this.playerBaseDetails, GameScene.PLAYER_BASE_X, baseY, baseW, baseH, 0x1133aa, 0x88bbff);

    // Flag pole on player base
    this.playerFlagPole = this.add.rectangle(
      GameScene.PLAYER_BASE_X, baseY - baseH / 2 - 14, 2, 28, 0xcccccc
    ).setDepth(1);
    // Flag (will wave)
    this.playerFlag = this.add.rectangle(
      GameScene.PLAYER_BASE_X + 6, baseY - baseH / 2 - 22, 12, 8, 0x4488ff
    ).setDepth(2);

    // Enemy base (right side, red tint)
    this.enemyBase = this.add.rectangle(
      GameScene.ENEMY_BASE_X, baseY, baseW, baseH, 0xaa2222
    ).setStrokeStyle(3, 0xff4444).setDepth(0);

    // Enemy base details
    this.drawBaseDetails(this.enemyBaseDetails, GameScene.ENEMY_BASE_X, baseY, baseW, baseH, 0xaa1111, 0xff8888);

    // Flag pole on enemy base
    this.enemyFlagPole = this.add.rectangle(
      GameScene.ENEMY_BASE_X, baseY - baseH / 2 - 14, 2, 28, 0xcccccc
    ).setDepth(1);
    // Flag (will wave)
    this.enemyFlag = this.add.rectangle(
      GameScene.ENEMY_BASE_X + 6, baseY - baseH / 2 - 22, 12, 8, 0xff4444
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

  private createLowHpOverlay(): void {
    this.lowHpOverlay = this.add.graphics().setDepth(9000);
    this.lowHpOverlay.setVisible(false);
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

    // Hide the base rectangle and details
    const base = faction === 'player' ? this.playerBase : this.enemyBase;
    const details = faction === 'player' ? this.playerBaseDetails : this.enemyBaseDetails;
    const flag = faction === 'player' ? this.playerFlag : this.enemyFlag;
    const pole = faction === 'player' ? this.playerFlagPole : this.enemyFlagPole;

    base.setVisible(false);
    details.setVisible(false);
    flag.setVisible(false);
    pole.setVisible(false);

    // Spawn collapse particles
    this.particles.spawnCollapse(baseX, baseY, color, 12);
    this.particles.spawnExplosion(baseX, baseY, color, 2);

    if (this.screenShakeEnabled) {
      this.cameras.main.shake(400, 0.01);
    }

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

  private showComboText(count: number): void {
    if (this.comboText) {
      this.comboText.destroy();
    }
    this.comboText = this.add.text(640, 300, `COMBO x${count}!`, {
      fontSize: '32px',
      fontFamily: 'monospace',
      color: '#ffdd00',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(8000).setAlpha(0);

    this.tweens.add({
      targets: this.comboText,
      alpha: { from: 0, to: 1 },
      scaleX: { from: 0.5, to: 1.2 },
      scaleY: { from: 0.5, to: 1.2 },
      duration: 300,
      ease: 'Back.easeOut',
      yoyo: true,
      hold: 400,
      onComplete: () => {
        if (this.comboText) {
          this.comboText.destroy();
          this.comboText = null;
        }
      },
    });
  }

  private updateLowHpOverlay(): void {
    const hpPct = this.gameState.player.baseMaxHp > 0
      ? this.gameState.player.baseHp / this.gameState.player.baseMaxHp
      : 1;

    if (hpPct < 0.25 && hpPct > 0) {
      this.lowHpOverlay.setVisible(true);
      this.lowHpPulseTimer += 0.03;
      const alpha = 0.1 + 0.1 * Math.sin(this.lowHpPulseTimer * 4);
      this.lowHpOverlay.clear();
      this.lowHpOverlay.fillStyle(0xff0000, alpha);

      // Vignette border (draw rectangles around edges)
      const borderW = 40;
      const borderH = 30;
      // Top
      this.lowHpOverlay.fillRect(0, 0, 1280, borderH);
      // Bottom
      this.lowHpOverlay.fillRect(0, 720 - borderH, 1280, borderH);
      // Left
      this.lowHpOverlay.fillRect(0, 0, borderW, 720);
      // Right
      this.lowHpOverlay.fillRect(1280 - borderW, 0, borderW, 720);
    } else {
      this.lowHpOverlay.setVisible(false);
    }
  }

  private playEvolutionTransition(ageName: string): void {
    // 1. Camera flash white
    this.cameras.main.flash(500, 255, 255, 200);

    // 2. Magic particles at base
    this.particles.spawnMagic(
      GameScene.PLAYER_BASE_X,
      GameScene.GROUND_Y - 40,
      0x8844ff
    );
    this.particles.spawnMagic(
      GameScene.PLAYER_BASE_X,
      GameScene.GROUND_Y - 40,
      0xffdd00
    );

    // 3. Brief camera zoom
    this.tweens.add({
      targets: this.cameras.main,
      zoom: 1.1,
      duration: 300,
      ease: 'Sine.easeInOut',
      yoyo: true,
    });

    // 4. Age name text fade in/out
    const ageNameText = this.add.text(640, 280, ageName, {
      fontSize: '48px',
      fontFamily: 'monospace',
      color: '#ffdd00',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 6,
    }).setOrigin(0.5).setDepth(8500).setAlpha(0);

    this.tweens.add({
      targets: ageNameText,
      alpha: { from: 0, to: 1 },
      y: { from: 300, to: 270 },
      duration: 500,
      ease: 'Sine.easeOut',
      yoyo: true,
      hold: 1000,
      onComplete: () => {
        ageNameText.destroy();
      },
    });

    // Screen shake
    if (this.screenShakeEnabled) {
      this.cameras.main.shake(200, 0.003);
    }
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
        // Keep GameManager in sync with the new base HP
        this.gameManager.setPlayerBaseHp(this.gameState.player.baseHp);

        // Sync age in game state
        this.gameState.player.currentAge = this.playerAgeSystem.getCurrentAge();

        // Update HUD unit buttons for new age
        this.pushUnitDefsToHUD();

        // Play evolution transition instead of simple flash
        const ageName = AGE_NAMES[this.gameState.player.currentAge] ?? `Age ${this.gameState.player.currentAge}`;
        this.playEvolutionTransition(ageName);

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

    // Screen shake for special attack
    if (this.screenShakeEnabled) {
      this.cameras.main.shake(300, 0.008);
    }

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
            const screenX = this.ecsXToScreen(pos.x);
            this.floatingText.spawnDamage(screenX, GameScene.GROUND_Y - 20, 50);
            // Sparks on each hit unit
            this.particles.spawnSparks(screenX, GameScene.GROUND_Y - 20);
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

          // Enemy spawn dust
          this.particles.spawnDust(
            GameScene.ENEMY_BASE_X - 40,
            GameScene.GROUND_Y
          );
        } else {
          // Fallback: try to spawn the cheapest unit
          const sorted = units
            .map((u, i) => ({ u, i }))
            .sort((a, b) => a.u.stats.cost - b.u.stats.cost);
          for (const entry of sorted) {
            if (this.enemyEconomy.canAfford(entry.u.stats.cost)) {
              this.enemyEconomy.spend(entry.u.stats.cost);
              this.enqueueSpawn('enemy', unitIds[entry.i], entry.u);

              this.particles.spawnDust(
                GameScene.ENEMY_BASE_X - 40,
                GameScene.GROUND_Y
              );
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
          // Keep GameManager in sync with the new enemy base HP
          this.gameManager.setEnemyBaseHp(this.gameState.enemy.baseHp);
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

    // Kill combo timer
    if (this.comboTimer > 0) {
      this.comboTimer -= deltaSec;
      if (this.comboTimer <= 0) {
        this.comboCount = 0;
      }
    }

    // Enemy AI
    this.updateEnemyAI(time);

    // Render ECS entities
    this.renderEntities();

    // Update visual effects
    this.updateClouds(deltaSec);
    this.updateFlags(time);
    this.updateBaseCracks();
    this.updateBattleLine();
    this.updateLowHpOverlay();

    // Update particles
    this.particles.update(deltaSec);

    // Sync game state for HUD
    this.data.set('gameState', this.gameState);

    // Update floating text
    this.floatingText.update(time, delta);

    // Check win/lose from GameManager state
    if (this.gameManager.state === 'victory' && !this.gameState.isGameOver) {
      this.gameState.isGameOver = true;
      this.gameState.winner = 'player';
      this.playBaseCollapse('enemy');
    } else if (this.gameManager.state === 'defeat' && !this.gameState.isGameOver) {
      this.gameState.isGameOver = true;
      this.gameState.winner = 'enemy';
      this.playBaseCollapse('player');
    }
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

      // Clean up particles
      this.particles.destroy();

      this.scene.stop('HUD');
      this.scene.start('MainMenuScene');
    });
  }
}
