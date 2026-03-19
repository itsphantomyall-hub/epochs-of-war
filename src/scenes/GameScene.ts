import Phaser from 'phaser';
import { GameState, createInitialGameState } from '../types/GameState';
import { UnitType } from '../types/Unit';
import { FloatingTextManager } from '../ui/FloatingText';
import { HUD } from '../ui/HUD';

/**
 * Runtime entity for rendering. In the full game these will come from the ECS
 * World; for now we use a simple local array of placeholder objects.
 */
interface RenderEntity {
  id: number;
  x: number;
  y: number;
  faction: 'player' | 'enemy';
  unitType: UnitType;
  rect: Phaser.GameObjects.Rectangle;
  alive: boolean;
}

/** Size (w, h) per unit type used for placeholder rectangles. */
const UNIT_SIZES: Record<UnitType, [number, number]> = {
  infantry: [16, 24],
  ranged: [14, 22],
  heavy: [24, 32],
  special: [20, 28],
};

/** Color per faction. */
const FACTION_COLORS: Record<string, number> = {
  player: 0x4488ff,
  enemy: 0xff4444,
};

/**
 * GameScene — the main battlefield scene.
 *
 * - 1280x720 game area
 * - Simple colored ground
 * - 2 placeholder bases (rectangles)
 * - Launches the HUD overlay scene
 * - Handles keyboard input
 * - Renders entities as colored rectangles
 */
export class GameScene extends Phaser.Scene {
  // ── State ──
  private gameState!: GameState;
  private entities: RenderEntity[] = [];
  private nextEntityId = 0;
  private floatingText!: FloatingTextManager;

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
  private static readonly GOLD_PER_SECOND = 5; // passive income placeholder

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data?: { difficulty?: 'easy' | 'normal' | 'hard' }): void {
    this.difficulty = data?.difficulty ?? 'normal';
  }

  create(): void {
    this.gameState = createInitialGameState();

    // Apply difficulty multiplier to enemy base HP
    const difficultyHpMultiplier: Record<string, number> = { easy: 0.7, normal: 1, hard: 1.4 };
    const mult = difficultyHpMultiplier[this.difficulty] ?? 1;
    this.gameState.enemy.baseMaxHp = Math.round(this.gameState.enemy.baseMaxHp * mult);
    this.gameState.enemy.baseHp = this.gameState.enemy.baseMaxHp;

    // Share game state with HUD via the data manager
    this.data.set('gameState', this.gameState);

    // Draw the world
    this.createGround();
    this.createBases();

    // Floating text manager
    this.floatingText = new FloatingTextManager(this);

    // Setup keyboard
    this.setupInput();

    // Launch HUD overlay scene
    this.scene.launch('HUD');
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

    // Unit spawns
    const unitTypes: UnitType[] = ['infantry', 'ranged', 'heavy', 'special'];
    const unitCosts = [15, 25, 100, 80];
    const spawnKeys = [this.keys.Q, this.keys.W, this.keys.E, this.keys.R];

    for (let i = 0; i < 4; i++) {
      if (Phaser.Input.Keyboard.JustDown(spawnKeys[i])) {
        if (this.gameState.player.gold >= unitCosts[i]) {
          this.gameState.player.gold -= unitCosts[i];
          this.spawnUnit('player', unitTypes[i]);

          // Trigger HUD cooldown
          const hud = this.scene.get('HUD') as HUD | undefined;
          hud?.startUnitCooldown(i, 2);
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

  // ─────────────────────── GAME ACTIONS ───────────────────────

  private spawnUnit(faction: 'player' | 'enemy', unitType: UnitType): void {
    const [w, h] = UNIT_SIZES[unitType];
    const spawnX = faction === 'player'
      ? GameScene.PLAYER_BASE_X + 60
      : GameScene.ENEMY_BASE_X - 60;
    const y = GameScene.GROUND_Y - h / 2;

    const color = FACTION_COLORS[faction];
    const rect = this.add.rectangle(spawnX, y, w, h, color)
      .setStrokeStyle(1, 0xffffff)
      .setDepth(5);

    const entity: RenderEntity = {
      id: this.nextEntityId++,
      x: spawnX,
      y,
      faction,
      unitType,
      rect,
      alive: true,
    };

    this.entities.push(entity);

    // Show gold spent floating text for player
    if (faction === 'player') {
      const costMap: Record<UnitType, number> = { infantry: 15, ranged: 25, heavy: 100, special: 80 };
      this.floatingText.spawn(spawnX, y - 20, `-${costMap[unitType]}g`, '#ff8888');
    }
  }

  private tryEvolve(): void {
    const { player } = this.gameState;
    const xpNeeded = this.getXpToNext(player.currentAge);

    if (player.currentAge < 8 && player.xp >= xpNeeded) {
      player.xp -= xpNeeded;
      player.currentAge++;

      // Bonus HP on evolution
      const hpBonus = 100;
      player.baseMaxHp += hpBonus;
      player.baseHp = Math.min(player.baseHp + hpBonus, player.baseMaxHp);

      // Flash effect
      this.cameras.main.flash(500, 255, 255, 200);
    }
  }

  private trySpecial(): void {
    const hud = this.scene.get('HUD') as HUD | undefined;
    hud?.startSpecialCooldown(30);

    // Placeholder: damage all enemy units
    for (const entity of this.entities) {
      if (entity.faction === 'enemy' && entity.alive) {
        this.floatingText.spawnDamage(entity.x, entity.y - 16, 50);
      }
    }
  }

  private togglePause(): void {
    this.gameState.isPaused = !this.gameState.isPaused;

    if (this.gameState.isPaused) {
      this.scene.pause();
      // Show a simple pause overlay (created inline)
      const pauseText = this.add.text(640, 360, 'PAUSED\n\nPress ESC to resume', {
        fontSize: '32px',
        fontFamily: 'monospace',
        color: '#ffffff',
        align: 'center',
        backgroundColor: '#00000088',
        padding: { x: 40, y: 20 },
      }).setOrigin(0.5).setDepth(9999).setName('pauseOverlay');

      // Listen for unpause even while paused
      this.input.keyboard?.once('keydown-ESC', () => {
        pauseText.destroy();
        this.gameState.isPaused = false;
        this.scene.resume();
      });
    }
  }

  // ─────────────────────── GAME LOOP ───────────────────────

  update(time: number, delta: number): void {
    if (this.gameState.isPaused || this.gameState.isGameOver) return;

    this.handleInput();

    // Update elapsed time
    this.gameState.elapsedTime += delta / 1000;

    // Passive gold income
    this.gameState.player.gold += GameScene.GOLD_PER_SECOND * (delta / 1000);

    // Passive XP income (small trickle)
    this.gameState.player.xp += 2 * (delta / 1000);

    // Update entities (simple movement placeholder)
    this.updateEntities(delta);

    // Enemy AI: periodically spawn a random unit
    this.updateEnemyAI(time);

    // Sync game state for HUD
    this.data.set('gameState', this.gameState);

    // Update floating text
    this.floatingText.update(time, delta);
  }

  private updateEntities(delta: number): void {
    const speed = 0.06; // pixels per ms

    for (let i = this.entities.length - 1; i >= 0; i--) {
      const entity = this.entities[i];
      if (!entity.alive) continue;

      // Move toward opposite base
      const targetX = entity.faction === 'player'
        ? GameScene.ENEMY_BASE_X
        : GameScene.PLAYER_BASE_X;

      const dir = targetX > entity.x ? 1 : -1;
      entity.x += dir * speed * delta;
      entity.rect.setPosition(entity.x, entity.y);

      // Check if entity reached enemy base
      if (entity.faction === 'player' && entity.x >= GameScene.ENEMY_BASE_X - 30) {
        // Damage enemy base
        const dmg = 5;
        this.gameState.enemy.baseHp = Math.max(0, this.gameState.enemy.baseHp - dmg);
        this.floatingText.spawnDamage(entity.x, entity.y - 20, dmg);

        // Give gold and XP
        this.gameState.player.gold += 10;
        this.gameState.player.xp += 5;
        this.floatingText.spawnGold(entity.x, entity.y - 30, 10);

        this.destroyEntity(entity);
      } else if (entity.faction === 'enemy' && entity.x <= GameScene.PLAYER_BASE_X + 30) {
        // Damage player base
        const dmg = 5;
        this.gameState.player.baseHp = Math.max(0, this.gameState.player.baseHp - dmg);
        this.floatingText.spawnDamage(entity.x, entity.y - 20, dmg);

        this.destroyEntity(entity);
      }
    }

    // Check win/lose
    if (this.gameState.enemy.baseHp <= 0) {
      this.gameState.isGameOver = true;
      this.gameState.winner = 'player';
      this.showEndScreen('VICTORY!', '#44ff44');
    } else if (this.gameState.player.baseHp <= 0) {
      this.gameState.isGameOver = true;
      this.gameState.winner = 'enemy';
      this.showEndScreen('DEFEAT', '#ff4444');
    }
  }

  private destroyEntity(entity: RenderEntity): void {
    entity.alive = false;
    entity.rect.destroy();
    const idx = this.entities.indexOf(entity);
    if (idx !== -1) this.entities.splice(idx, 1);
  }

  // ── Enemy AI (placeholder) ──
  private lastEnemySpawnTime = 0;

  private updateEnemyAI(time: number): void {
    const spawnInterval: Record<string, number> = { easy: 4000, normal: 3000, hard: 2000 };
    const interval = spawnInterval[this.difficulty] ?? 3000;

    if (time - this.lastEnemySpawnTime > interval) {
      this.lastEnemySpawnTime = time;

      const types: UnitType[] = ['infantry', 'ranged', 'heavy', 'special'];
      const pick = types[Math.floor(Math.random() * types.length)];
      this.spawnUnit('enemy', pick);
    }
  }

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
      // Clean up
      this.scene.stop('HUD');
      this.entities.forEach(e => { if (e.rect) e.rect.destroy(); });
      this.entities.length = 0;
      this.scene.start('MainMenuScene');
    });
  }

  // ─────────────────────── HELPERS ───────────────────────

  private getXpToNext(currentAge: number): number {
    const thresholds: Record<number, number> = {
      1: 200, 2: 400, 3: 700, 4: 1200, 5: 2000, 6: 3500, 7: 6000, 8: 0,
    };
    return thresholds[currentAge] ?? 500;
  }
}
