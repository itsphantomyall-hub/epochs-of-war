/**
 * MultiplayerGameScene -- Online multiplayer game scene.
 *
 * - Connects to server via NetworkManager
 * - Sends inputs instead of executing locally
 * - Receives state updates and applies via Interpolation
 * - Uses ClientPrediction for responsive feel
 * - Disables pause (no pausing in multiplayer)
 * - Shows opponent's age and base HP
 * - Post-game: shows ELO change, rematch option
 */

import Phaser from 'phaser';
import {
  NetworkManager,
  type StateDelta,
  type GameOverData,
  type PlayerSnapshot,
  type EntitySnapshot,
} from '../multiplayer/NetworkManager';
import { ClientPrediction } from '../multiplayer/ClientPrediction';
import { Interpolation, type InterpolatedEntity } from '../multiplayer/Interpolation';
import { ReplayRecorder } from '../multiplayer/ReplayRecorder';

/** Size (w, h) per unit archetype. */
const UNIT_SIZES: Record<string, [number, number]> = {
  infantry: [16, 24],
  ranged: [14, 22],
  heavy: [24, 32],
  special: [20, 28],
  hero: [28, 36],
};

/** Color per faction relative to local player. */
const SELF_COLOR = 0x4488ff;
const OPPONENT_COLOR = 0xff4444;

/** Age names for display. */
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

const GROUND_Y = 560;
const PLAYER_BASE_X = 80;
const ENEMY_BASE_X = 1200;

interface SceneData {
  network: NetworkManager;
  playerSlot: 1 | 2;
  opponentName: string;
  seed: number;
  roomId: string;
  playerId: string;
}

export class MultiplayerGameScene extends Phaser.Scene {
  // ── Network ──
  private network!: NetworkManager;
  private playerSlot!: 1 | 2;
  private opponentName!: string;
  private seed!: number;
  private roomId!: string;
  private playerId!: string;

  // ── Prediction & Interpolation ──
  private prediction!: ClientPrediction;
  private interpolation!: Interpolation;
  private replayRecorder!: ReplayRecorder;

  // ── State from server ──
  private selfState: PlayerSnapshot = { gold: 50, xp: 0, currentAge: 1, baseHp: 500, baseMaxHp: 500 };
  private opponentState: PlayerSnapshot = { gold: 50, xp: 0, currentAge: 1, baseHp: 500, baseMaxHp: 500 };

  // ── Visual elements ──
  private entityRects: Map<number, Phaser.GameObjects.Rectangle> = new Map();
  private playerBase!: Phaser.GameObjects.Rectangle;
  private enemyBase!: Phaser.GameObjects.Rectangle;
  private ground!: Phaser.GameObjects.Graphics;
  private clouds: { rect: Phaser.GameObjects.Rectangle; speed: number }[] = [];

  // ── HUD elements ──
  private goldText!: Phaser.GameObjects.Text;
  private xpText!: Phaser.GameObjects.Text;
  private ageText!: Phaser.GameObjects.Text;
  private baseHpText!: Phaser.GameObjects.Text;
  private opponentAgeText!: Phaser.GameObjects.Text;
  private opponentBaseHpText!: Phaser.GameObjects.Text;
  private latencyText!: Phaser.GameObjects.Text;
  private countdownText!: Phaser.GameObjects.Text;
  private unitButtons: Phaser.GameObjects.Text[] = [];

  // ── Game over ──
  private gameOverShown: boolean = false;
  private matchResult: GameOverData | null = null;

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
  };

  private matchStarted: boolean = false;

  constructor() {
    super({ key: 'MultiplayerGameScene' });
  }

  init(data: SceneData): void {
    this.network = data.network;
    this.playerSlot = data.playerSlot;
    this.opponentName = data.opponentName;
    this.seed = data.seed;
    this.roomId = data.roomId;
    this.playerId = data.playerId;
  }

  create(): void {
    this.prediction = new ClientPrediction();
    this.interpolation = new Interpolation();
    this.replayRecorder = new ReplayRecorder();
    this.gameOverShown = false;
    this.matchResult = null;
    this.matchStarted = false;
    this.entityRects = new Map();
    this.clouds = [];

    // Start replay recording
    this.replayRecorder.startRecording(
      this.seed,
      this.roomId,
      this.playerSlot === 1 ? this.playerId : 'opponent',
      this.playerSlot === 2 ? this.playerId : 'opponent',
    );

    // ── Draw world ──
    this.createGround();
    this.createClouds();
    this.createBases();
    this.createHUD();
    this.setupInput();
    this.wireNetwork();

    // Countdown text
    this.countdownText = this.add.text(640, 300, '', {
      fontSize: '64px',
      fontFamily: "'Impact', 'Arial Black', sans-serif",
      color: '#ffdd00',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 6,
    }).setOrigin(0.5).setDepth(9000);
  }

  // ─────────────────────── WORLD SETUP ───────────────────────

  private createGround(): void {
    this.ground = this.add.graphics();

    // Sky
    this.ground.fillStyle(0x5588cc, 1);
    this.ground.fillRect(0, 0, 1280, GROUND_Y);
    this.ground.fillStyle(0x88bbee, 1);
    this.ground.fillRect(0, GROUND_Y - 100, 1280, 100);

    // Ground
    this.ground.fillStyle(0x557733, 1);
    this.ground.fillRect(0, GROUND_Y, 1280, 8);
    this.ground.fillStyle(0x664422, 1);
    this.ground.fillRect(0, GROUND_Y + 8, 1280, 720 - GROUND_Y - 8);
    this.ground.fillStyle(0x66aa33, 1);
    this.ground.fillRect(0, GROUND_Y - 2, 1280, 4);

    this.ground.setDepth(-10);
  }

  private createClouds(): void {
    const cloudCount = 3 + Math.floor(Math.random() * 2);
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

  private createBases(): void {
    const baseW = 48;
    const baseH = 80;
    const baseY = GROUND_Y - baseH / 2;

    this.playerBase = this.add.rectangle(
      PLAYER_BASE_X, baseY, baseW, baseH, 0x2244aa
    ).setStrokeStyle(3, 0x4488ff).setDepth(0);

    this.enemyBase = this.add.rectangle(
      ENEMY_BASE_X, baseY, baseW, baseH, 0xaa2222
    ).setStrokeStyle(3, 0xff4444).setDepth(0);
  }

  private createHUD(): void {
    // Top left: self stats
    this.goldText = this.add.text(10, 10, 'Gold: 50', {
      fontSize: '16px', fontFamily: "'Courier New', monospace", color: '#ffdd00',
    }).setDepth(100);

    this.xpText = this.add.text(10, 30, 'XP: 0', {
      fontSize: '14px', fontFamily: "'Courier New', monospace", color: '#88aaff',
    }).setDepth(100);

    this.ageText = this.add.text(10, 50, 'Age 1: Prehistoric', {
      fontSize: '14px', fontFamily: "'Trebuchet MS', 'Segoe UI', sans-serif", color: '#ffffff',
    }).setDepth(100);

    this.baseHpText = this.add.text(10, 70, 'Base HP: 500/500', {
      fontSize: '14px', fontFamily: "'Courier New', monospace", color: '#44ff44',
    }).setDepth(100);

    // Top right: opponent stats
    this.opponentAgeText = this.add.text(1270, 10, `${this.opponentName} - Age 1`, {
      fontSize: '14px', fontFamily: "'Trebuchet MS', 'Segoe UI', sans-serif", color: '#ff8888',
    }).setOrigin(1, 0).setDepth(100);

    this.opponentBaseHpText = this.add.text(1270, 30, 'Base HP: 500/500', {
      fontSize: '14px', fontFamily: "'Courier New', monospace", color: '#ff6666',
    }).setOrigin(1, 0).setDepth(100);

    // Latency
    this.latencyText = this.add.text(1270, 50, 'Ping: 0ms', {
      fontSize: '12px', fontFamily: "'Courier New', monospace", color: '#666688',
    }).setOrigin(1, 0).setDepth(100);

    // Unit buttons at bottom
    const keyLabels = ['Q', 'W', 'E', 'R'];
    const unitNames = ['Infantry', 'Ranged', 'Heavy', 'Special'];
    for (let i = 0; i < 4; i++) {
      const x = 200 + i * 220;
      const btn = this.add.text(x, 680, `[${keyLabels[i]}] ${unitNames[i]}`, {
        fontSize: '14px',
        fontFamily: "'Impact', sans-serif",
        color: '#aaaacc',
        backgroundColor: '#1a1a2e',
        padding: { x: 10, y: 6 },
      }).setOrigin(0.5).setDepth(100).setInteractive({ useHandCursor: true });

      btn.on('pointerdown', () => this.sendSpawn(i));
      this.unitButtons.push(btn);
    }

    // Evolve button
    const evolveBtn = this.add.text(1050, 680, '[T] Evolve', {
      fontSize: '14px',
      fontFamily: "'Impact', sans-serif",
      color: '#cc88ff',
      backgroundColor: '#221144',
      padding: { x: 10, y: 6 },
    }).setOrigin(0.5).setDepth(100).setInteractive({ useHandCursor: true });

    evolveBtn.on('pointerdown', () => this.sendEvolve());
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
    };
  }

  private handleInput(): void {
    if (!this.keys || !this.matchStarted || this.gameOverShown) return;

    const spawnKeys = [this.keys.Q, this.keys.W, this.keys.E, this.keys.R];
    for (let i = 0; i < 4; i++) {
      if (Phaser.Input.Keyboard.JustDown(spawnKeys[i])) {
        this.sendSpawn(i);
      }
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.T)) {
      this.sendEvolve();
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.SPACE)) {
      this.sendSpecial();
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.ONE)) {
      this.sendHeroAbility(0);
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.TWO)) {
      this.sendHeroAbility(1);
    }
  }

  private sendSpawn(unitIndex: number): void {
    if (!this.matchStarted || this.gameOverShown) return;

    // Estimate unit cost for prediction (simple scale)
    const costs = [15, 25, 50, 40];
    const scale = 1 + (this.selfState.currentAge - 1) * 0.3;
    const cost = Math.round(costs[unitIndex] * scale);

    // Client prediction
    this.prediction.predictSpawn(unitIndex, cost, this.selfState);

    // Record for replay
    this.replayRecorder.recordInput(this.playerId, { type: 'spawn', unitIndex });

    // Send to server
    this.network.sendInput({ type: 'spawn', unitIndex });
  }

  private sendEvolve(): void {
    if (!this.matchStarted || this.gameOverShown) return;

    this.replayRecorder.recordInput(this.playerId, { type: 'evolve' });
    this.network.sendInput({ type: 'evolve' });
  }

  private sendSpecial(): void {
    if (!this.matchStarted || this.gameOverShown) return;

    const targetX = this.input.activePointer?.worldX
      ? this.screenToEcsX(this.input.activePointer.worldX)
      : 800;

    this.replayRecorder.recordInput(this.playerId, { type: 'special', targetX });
    this.network.sendInput({ type: 'special', targetX });
  }

  private sendHeroAbility(index: number): void {
    if (!this.matchStarted || this.gameOverShown) return;

    this.replayRecorder.recordInput(this.playerId, { type: 'heroAbility', index });
    this.network.sendInput({ type: 'heroAbility', index });
  }

  // ─────────────────────── NETWORK WIRING ───────────────────────

  private wireNetwork(): void {
    this.network.onStateUpdate((delta: StateDelta) => {
      this.applyStateDelta(delta);
    });

    this.network.onMatchStart((countdown: number) => {
      this.countdownText.setText(countdown > 0 ? `${countdown}` : 'GO!');
      if (countdown <= 0) {
        this.matchStarted = true;
        this.time.delayedCall(500, () => {
          this.countdownText.setVisible(false);
        });
      }
    });

    this.network.onGameOver((data: GameOverData) => {
      this.matchResult = data;
      this.showGameOver(data);
    });

    this.network.onInputRejected((command: string, reason: string) => {
      if (command === 'spawn') {
        this.prediction.rejectSpawn(-1); // reject most recent
      }
    });

    this.network.onDisconnect(() => {
      if (!this.gameOverShown) {
        this.showDisconnected();
      }
    });
  }

  private applyStateDelta(delta: StateDelta): void {
    // Determine which player state is "self" vs "opponent"
    const rawSelfState = this.playerSlot === 1 ? delta.player1 : delta.player2;
    const rawOpponentState = this.playerSlot === 1 ? delta.player2 : delta.player1;

    // Apply client prediction reconciliation
    this.selfState = this.prediction.reconcile(rawSelfState);
    this.opponentState = rawOpponentState;

    // Map entity factions: server always sends player1=player, player2=enemy
    // We need to remap so "self" is always shown on the left
    const mappedEntities: EntitySnapshot[] = delta.entities.map((e) => {
      const isSelf = (this.playerSlot === 1 && e.faction === 'player') ||
                     (this.playerSlot === 2 && e.faction === 'enemy');
      return {
        ...e,
        faction: isSelf ? 'player' as const : 'enemy' as const,
      };
    });

    // Push snapshot for interpolation
    this.interpolation.pushSnapshot(delta.timestamp, mappedEntities);
  }

  // ─────────────────────── COORDINATE MAPPING ───────────────────────

  private ecsXToScreen(ecsX: number): number {
    const t = (ecsX - 50) / (1550 - 50);
    return PLAYER_BASE_X + t * (ENEMY_BASE_X - PLAYER_BASE_X);
  }

  private screenToEcsX(screenX: number): number {
    const t = (screenX - PLAYER_BASE_X) / (ENEMY_BASE_X - PLAYER_BASE_X);
    return 50 + t * (1550 - 50);
  }

  // ─────────────────────── GAME LOOP ───────────────────────

  update(_time: number, delta: number): void {
    const deltaSec = delta / 1000;

    // Input
    this.handleInput();

    // Clouds
    for (const cloud of this.clouds) {
      cloud.rect.x += cloud.speed * deltaSec;
      if (cloud.rect.x > 1280 + 80) cloud.rect.x = -80;
    }

    // Get interpolated entities
    const entities = this.interpolation.getInterpolatedEntities(deltaSec);

    // Render entities
    this.renderEntities(entities);

    // Update HUD
    this.updateHUD();
  }

  // ─────────────────────── RENDERING ───────────────────────

  private renderEntities(entities: InterpolatedEntity[]): void {
    const aliveIds = new Set<number>();

    for (const entity of entities) {
      aliveIds.add(entity.id);

      const archetype = entity.unitType ?? 'infantry';
      const [w, h] = UNIT_SIZES[archetype] ?? UNIT_SIZES['infantry'];
      const color = entity.faction === 'player' ? SELF_COLOR : OPPONENT_COLOR;
      const screenX = this.ecsXToScreen(entity.x);
      const screenY = GROUND_Y - h / 2;

      let rect = this.entityRects.get(entity.id);
      if (!rect) {
        rect = this.add.rectangle(screenX, screenY, w, h, color)
          .setStrokeStyle(1, 0xffffff)
          .setDepth(5);
        this.entityRects.set(entity.id, rect);
      }

      rect.setPosition(screenX, screenY);
      rect.setSize(w, h);
      rect.setFillStyle(color);
      rect.setAlpha(entity.alpha);
      rect.setVisible(true);
    }

    // Remove dead entities
    for (const [id, rect] of this.entityRects) {
      if (!aliveIds.has(id)) {
        rect.destroy();
        this.entityRects.delete(id);
      }
    }
  }

  private updateHUD(): void {
    const state = this.selfState;
    this.goldText.setText(`Gold: ${Math.floor(state.gold)}`);
    this.xpText.setText(`XP: ${Math.floor(state.xp)}`);
    this.ageText.setText(
      `Age ${state.currentAge}: ${AGE_NAMES[state.currentAge] ?? ''}`
    );
    this.baseHpText.setText(
      `Base HP: ${Math.max(0, Math.round(state.baseHp))}/${state.baseMaxHp}`
    );

    const opp = this.opponentState;
    this.opponentAgeText.setText(
      `${this.opponentName} - Age ${opp.currentAge}`
    );
    this.opponentBaseHpText.setText(
      `Base HP: ${Math.max(0, Math.round(opp.baseHp))}/${opp.baseMaxHp}`
    );

    this.latencyText.setText(`Ping: ${this.network.latency}ms`);
  }

  // ─────────────────────── GAME OVER ───────────────────────

  private showGameOver(data: GameOverData): void {
    if (this.gameOverShown) return;
    this.gameOverShown = true;

    // Stop recording
    const replay = this.replayRecorder.stopRecording();
    this.replayRecorder.saveReplay();

    const iWon = data.winner === this.playerSlot;
    const titleText = iWon ? 'VICTORY!' : 'DEFEAT';
    const titleColor = iWon ? '#44ff44' : '#ff4444';

    const myEloDelta = this.playerSlot === 1 ? data.player1EloDelta : data.player2EloDelta;
    const myNewElo = this.playerSlot === 1 ? data.player1Elo : data.player2Elo;
    const eloSign = myEloDelta >= 0 ? '+' : '';
    const eloColor = myEloDelta >= 0 ? '#44ff44' : '#ff4444';

    // Background overlay
    this.add.rectangle(640, 360, 500, 300, 0x000000, 0.85).setDepth(9998);

    // Title
    this.add.text(640, 280, titleText, {
      fontSize: '48px', fontFamily: "'Impact', 'Arial Black', sans-serif", color: titleColor, fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(9999);

    // ELO change
    this.add.text(640, 340, `ELO: ${myNewElo} (${eloSign}${myEloDelta})`, {
      fontSize: '24px', fontFamily: "'Courier New', monospace", color: eloColor,
    }).setOrigin(0.5).setDepth(9999);

    // Rematch button
    const rematchBtn = this.add.text(540, 410, 'Rematch', {
      fontSize: '20px', fontFamily: "'Impact', sans-serif", color: '#ffffff',
      backgroundColor: '#224422', padding: { x: 20, y: 8 },
    }).setOrigin(0.5).setDepth(9999).setInteractive({ useHandCursor: true });

    rematchBtn.on('pointerover', () => rematchBtn.setBackgroundColor('#336633'));
    rematchBtn.on('pointerout', () => rematchBtn.setBackgroundColor('#224422'));
    rematchBtn.on('pointerdown', () => {
      this.network.sendInput({ type: 'rematch' });
      rematchBtn.setText('Waiting...');
      rematchBtn.disableInteractive();
    });

    // Main menu button
    const menuBtn = this.add.text(740, 410, 'Main Menu', {
      fontSize: '20px', fontFamily: "'Impact', sans-serif", color: '#ffffff',
      backgroundColor: '#333333', padding: { x: 20, y: 8 },
    }).setOrigin(0.5).setDepth(9999).setInteractive({ useHandCursor: true });

    menuBtn.on('pointerover', () => menuBtn.setBackgroundColor('#555555'));
    menuBtn.on('pointerout', () => menuBtn.setBackgroundColor('#333333'));
    menuBtn.on('pointerdown', () => {
      this.cleanupAndExit();
    });
  }

  private showDisconnected(): void {
    if (this.gameOverShown) return;
    this.gameOverShown = true;

    this.add.rectangle(640, 360, 400, 200, 0x000000, 0.85).setDepth(9998);

    this.add.text(640, 330, 'DISCONNECTED', {
      fontSize: '36px', fontFamily: "'Impact', 'Arial Black', sans-serif", color: '#ff4444', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(9999);

    const menuBtn2 = this.add.text(640, 400, 'Main Menu', {
      fontSize: '20px', fontFamily: "'Impact', sans-serif", color: '#ffffff',
      backgroundColor: '#333333', padding: { x: 20, y: 8 },
    }).setOrigin(0.5).setDepth(9999).setInteractive({ useHandCursor: true });

    menuBtn2.on('pointerdown', () => this.cleanupAndExit());
  }

  private cleanupAndExit(): void {
    // Clean up entity rects
    for (const [, rect] of this.entityRects) {
      rect.destroy();
    }
    this.entityRects.clear();

    // Reset
    this.prediction.reset();
    this.interpolation.reset();
    this.replayRecorder.reset();
    this.network.disconnect();

    this.scene.start('MainMenuScene');
  }
}
