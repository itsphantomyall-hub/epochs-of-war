import Phaser from 'phaser';
import { GameManager } from '../core/managers/GameManager';
import { ConfigLoader } from '../utils/ConfigLoader';
import { SpawnRequest } from '../core/systems/SpawnSystem';
import { ParticleManager } from '../rendering/ParticleManager';
import { FloatingTextManager } from '../ui/FloatingText';
import type { UnitConfig } from '../types/Unit';
import type { Position } from '../core/components/Position';
import type { Faction } from '../core/components/Faction';
import type { Renderable } from '../core/components/Renderable';
import type { UnitType as UnitTypeComponent } from '../core/components/UnitType';

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

/**
 * SandboxScene -- Free experimentation mode.
 * Spawn any unit from any age on either side and watch them fight.
 * No gold, no XP, no evolution. Speed controls available.
 */
export class SandboxScene extends Phaser.Scene {
  private gameManager!: GameManager;
  private configLoader!: ConfigLoader;
  private particles!: ParticleManager;
  private floatingText!: FloatingTextManager;

  private entityRects: Map<number, Phaser.GameObjects.Rectangle> = new Map();
  private ground!: Phaser.GameObjects.Graphics;

  // ── State ──
  private isFighting: boolean = false;
  private timeScale: number = 1;
  private selectedAge: number = 0; // 0 = all ages
  private playerUnitCount: number = 0;
  private enemyUnitCount: number = 0;

  // ── UI ──
  private playerCountText!: Phaser.GameObjects.Text;
  private enemyCountText!: Phaser.GameObjects.Text;
  private statusText!: Phaser.GameObjects.Text;
  private speedText!: Phaser.GameObjects.Text;
  private unitButtonsContainer!: Phaser.GameObjects.Container;

  // ── Constants ──
  private static readonly GROUND_Y = 500;
  private static readonly PLAYER_BASE_X = 80;
  private static readonly ENEMY_BASE_X = 1200;
  private static readonly PANEL_Y = 520;

  constructor() {
    super({ key: 'SandboxScene' });
  }

  create(): void {
    this.configLoader = new ConfigLoader();
    this.gameManager = new GameManager();
    // Set bases very high so no game-over
    this.gameManager.setPlayerBaseHp(999999);
    this.gameManager.setEnemyBaseHp(999999);

    this.entityRects = new Map();
    this.isFighting = false;
    this.timeScale = 1;
    this.selectedAge = 0;
    this.playerUnitCount = 0;
    this.enemyUnitCount = 0;

    this.cameras.main.setBackgroundColor('#0a0a1a');

    // Particles & floating text
    this.particles = new ParticleManager(this);
    this.floatingText = new FloatingTextManager(this);

    // Wire events
    this.wireEvents();

    // Draw world
    this.createGround();

    // ── Top bar ──
    this.add.text(640, 15, 'SANDBOX MODE', {
      fontSize: '24px', fontFamily: 'monospace', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.statusText = this.add.text(640, 42, 'Place units, then click FIGHT!', {
      fontSize: '12px', fontFamily: 'monospace', color: '#aaaacc',
    }).setOrigin(0.5);

    // Player side label
    this.add.text(200, 60, 'PLAYER (Blue)', {
      fontSize: '14px', fontFamily: 'monospace', color: '#4488ff', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.playerCountText = this.add.text(200, 80, 'Units: 0', {
      fontSize: '12px', fontFamily: 'monospace', color: '#aaaacc',
    }).setOrigin(0.5);

    // Enemy side label
    this.add.text(1080, 60, 'ENEMY (Red)', {
      fontSize: '14px', fontFamily: 'monospace', color: '#ff4444', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.enemyCountText = this.add.text(1080, 80, 'Units: 0', {
      fontSize: '12px', fontFamily: 'monospace', color: '#aaaacc',
    }).setOrigin(0.5);

    // ── Control buttons ──
    this.createControlButtons();

    // ── Age filter ──
    this.createAgeFilter();

    // ── Unit spawn panels ──
    this.unitButtonsContainer = this.add.container(0, 0);
    this.refreshUnitButtons();

    // Back button
    const backBtn = this.add.text(60, 15, '< Back', {
      fontSize: '14px', fontFamily: 'monospace', color: '#aaaacc',
      backgroundColor: '#1a1a2e', padding: { x: 12, y: 6 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    backBtn.on('pointerover', () => backBtn.setColor('#ffffff'));
    backBtn.on('pointerout', () => backBtn.setColor('#aaaacc'));
    backBtn.on('pointerdown', () => {
      this.particles.destroy();
      this.scene.start('MainMenuScene');
    });
  }

  // ─────────────────────── EVENT WIRING ───────────────────────

  private wireEvents(): void {
    this.gameManager.events.on('death', (e) => {
      const pos = this.gameManager.world.getComponent<Position>(e.entityId, 'Position');
      if (pos) {
        const screenX = this.ecsXToScreen(pos.x);
        const screenY = SandboxScene.GROUND_Y - 30;
        const color = e.faction === 'enemy' ? 0xff4444 : 0x4488ff;
        this.particles.spawnExplosion(screenX, screenY, color, 1);
      }
      if (e.faction === 'player') this.playerUnitCount = Math.max(0, this.playerUnitCount - 1);
      if (e.faction === 'enemy') this.enemyUnitCount = Math.max(0, this.enemyUnitCount - 1);
    });

    this.gameManager.events.on('damage', (e) => {
      const pos = this.gameManager.world.getComponent<Position>(e.targetId, 'Position');
      if (pos) {
        const screenX = this.ecsXToScreen(pos.x);
        this.floatingText.spawnDamage(screenX, SandboxScene.GROUND_Y - 20, e.damage);
      }
    });
  }

  // ─────────────────────── COORDINATE MAPPING ───────────────────────

  private ecsXToScreen(ecsX: number): number {
    const t = (ecsX - 50) / (1550 - 50);
    return SandboxScene.PLAYER_BASE_X + t * (SandboxScene.ENEMY_BASE_X - SandboxScene.PLAYER_BASE_X);
  }

  // ─────────────────────── WORLD ───────────────────────

  private createGround(): void {
    this.ground = this.add.graphics();
    this.ground.fillStyle(0x334455, 1);
    this.ground.fillRect(0, 100, 1280, SandboxScene.GROUND_Y - 100);
    this.ground.fillStyle(0x557733, 1);
    this.ground.fillRect(0, SandboxScene.GROUND_Y, 1280, 8);
    this.ground.fillStyle(0x664422, 1);
    this.ground.fillRect(0, SandboxScene.GROUND_Y + 8, 1280, 20);
    this.ground.fillStyle(0x66aa33, 1);
    this.ground.fillRect(0, SandboxScene.GROUND_Y - 2, 1280, 4);
    this.ground.setDepth(-10);

    // Center divider line
    this.add.rectangle(640, SandboxScene.GROUND_Y / 2 + 50, 2, SandboxScene.GROUND_Y - 100, 0xffffff, 0.15)
      .setDepth(-5);
  }

  // ─────────────────────── CONTROLS ───────────────────────

  private createControlButtons(): void {
    const btnY = SandboxScene.GROUND_Y + 30;

    // Fight button
    const fightBtn = this.createButton(540, btnY, 'FIGHT!', '#44ff44', '#224422', () => {
      this.isFighting = true;
      this.statusText.setText('Fighting!');
      this.gameManager.resume();
    });

    // Reset button
    const resetBtn = this.createButton(640, btnY, 'RESET', '#ff4444', '#442222', () => {
      this.resetBattlefield();
    });

    // Speed controls
    const speeds = [0.5, 1, 2, 4];
    this.speedText = this.add.text(820, btnY, `Speed: ${this.timeScale}x`, {
      fontSize: '13px', fontFamily: 'monospace', color: '#aaaacc',
    }).setOrigin(0.5);

    for (let i = 0; i < speeds.length; i++) {
      const s = speeds[i];
      const sx = 900 + i * 50;
      const speedBtn = this.createButton(sx, btnY, `${s}x`, '#aaaacc', '#1a1a2e', () => {
        this.timeScale = s;
        this.speedText.setText(`Speed: ${s}x`);
      }, '11px');
    }
  }

  private createButton(
    x: number, y: number, label: string, color: string, bgColor: string,
    onClick: () => void, fontSize: string = '14px'
  ): Phaser.GameObjects.Text {
    const btn = this.add.text(x, y, label, {
      fontSize, fontFamily: 'monospace', color,
      backgroundColor: bgColor, padding: { x: 12, y: 6 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(50);

    btn.on('pointerover', () => btn.setAlpha(0.8));
    btn.on('pointerout', () => btn.setAlpha(1));
    btn.on('pointerdown', onClick);
    return btn;
  }

  // ─────────────────────── AGE FILTER ───────────────────────

  private createAgeFilter(): void {
    const filterY = SandboxScene.GROUND_Y + 60;

    this.add.text(200, filterY, 'Filter:', {
      fontSize: '12px', fontFamily: 'monospace', color: '#888888',
    }).setOrigin(0.5);

    // "All" button
    this.createButton(250, filterY, 'All', '#ffffff', '#1a1a2e', () => {
      this.selectedAge = 0;
      this.refreshUnitButtons();
    }, '11px');

    // Age buttons
    for (let age = 1; age <= 8; age++) {
      const x = 300 + (age - 1) * 50;
      this.createButton(x, filterY, String(age), '#aaaacc', '#1a1a2e', () => {
        this.selectedAge = age;
        this.refreshUnitButtons();
      }, '11px');
    }
  }

  // ─────────────────────── UNIT BUTTONS ───────────────────────

  private refreshUnitButtons(): void {
    this.unitButtonsContainer.removeAll(true);

    const allUnits = this.configLoader.getAllUnits();
    const filteredEntries = Object.entries(allUnits).filter(([, config]) => {
      if (this.selectedAge === 0) return true;
      return config.age === this.selectedAge;
    });

    const panelY = SandboxScene.GROUND_Y + 90;
    const btnW = 120;
    const btnH = 40;
    const cols = 8;
    const padX = 8;
    const padY = 4;

    // Player spawn buttons (left side)
    this.add.text(320, panelY - 15, 'Click to spawn PLAYER unit:', {
      fontSize: '11px', fontFamily: 'monospace', color: '#4488ff',
    }).setOrigin(0.5);

    // Enemy spawn buttons (right side)
    this.add.text(960, panelY - 15, 'Click to spawn ENEMY unit:', {
      fontSize: '11px', fontFamily: 'monospace', color: '#ff4444',
    }).setOrigin(0.5);

    for (let i = 0; i < filteredEntries.length; i++) {
      const [unitId, config] = filteredEntries[i];
      const col = i % cols;
      const row = Math.floor(i / cols);

      // Player button (left half)
      const px = 50 + col * (btnW + padX) / 2;
      const py = panelY + row * (btnH + padY);
      this.createUnitSpawnButton(px, py, unitId, config, 'player');

      // Enemy button (right half)
      const ex = 660 + col * (btnW + padX) / 2;
      this.createUnitSpawnButton(ex, py, unitId, config, 'enemy');
    }
  }

  private createUnitSpawnButton(
    x: number, y: number, unitId: string, config: UnitConfig, faction: 'player' | 'enemy'
  ): void {
    const color = faction === 'player' ? '#4488ff' : '#ff4444';
    const bgColor = faction === 'player' ? '#112244' : '#441122';

    const btn = this.add.text(x, y, `${config.displayName}\nA${config.age} ${config.type}`, {
      fontSize: '9px', fontFamily: 'monospace', color,
      backgroundColor: bgColor, padding: { x: 4, y: 2 },
    }).setInteractive({ useHandCursor: true }).setDepth(50);

    this.unitButtonsContainer.add(btn);

    btn.on('pointerover', () => btn.setAlpha(0.8));
    btn.on('pointerout', () => btn.setAlpha(1));
    btn.on('pointerdown', () => {
      this.spawnSandboxUnit(unitId, config, faction);
    });
  }

  private spawnSandboxUnit(unitId: string, config: UnitConfig, faction: 'player' | 'enemy'): void {
    const req: SpawnRequest = {
      faction,
      unitId,
      type: config.type,
      age: config.age,
      hp: config.stats.hp,
      damage: config.stats.damage,
      speed: config.stats.moveSpeed,
      range: config.stats.range,
      attackSpeed: config.stats.attackSpeed,
      projectileType: config.stats.range > 0 ? 'projectile' : '',
      spawnTime: 0, // Instant spawn in sandbox
      spriteKey: unitId,
      cost: 0,
    };

    this.gameManager.spawnSystem.enqueue(req);

    if (faction === 'player') this.playerUnitCount++;
    else this.enemyUnitCount++;

    // Spawn particles
    const baseX = faction === 'player' ? SandboxScene.PLAYER_BASE_X + 40 : SandboxScene.ENEMY_BASE_X - 40;
    this.particles.spawnFlash(baseX, SandboxScene.GROUND_Y - 12);
  }

  // ─────────────────────── RESET ───────────────────────

  private resetBattlefield(): void {
    // Destroy all entity rects
    for (const [, rect] of this.entityRects) rect.destroy();
    this.entityRects.clear();

    // Reset game manager
    this.gameManager.reset();
    this.gameManager.setPlayerBaseHp(999999);
    this.gameManager.setEnemyBaseHp(999999);

    // Re-wire events
    this.wireEvents();

    this.isFighting = false;
    this.playerUnitCount = 0;
    this.enemyUnitCount = 0;
    this.statusText.setText('Place units, then click FIGHT!');
  }

  // ─────────────────────── GAME LOOP ───────────────────────

  update(time: number, delta: number): void {
    const deltaSec = (delta / 1000) * this.timeScale;

    if (this.isFighting) {
      this.gameManager.update(deltaSec);
    }

    // Render entities
    this.renderEntities();

    // Update counts
    this.playerCountText.setText(`Units: ${this.playerUnitCount}`);
    this.enemyCountText.setText(`Units: ${this.enemyUnitCount}`);

    // Particles
    this.particles.update(deltaSec);
    this.floatingText.update(time, delta);
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
      const screenY = SandboxScene.GROUND_Y - h / 2;

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
}
