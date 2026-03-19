/**
 * MultiplayerMenuScene -- Multiplayer lobby UI.
 *
 * - "Find Match" button with "Searching..." and cancel
 * - Shows player ELO rating and win/loss record
 * - "Custom Match" with 6-character room code
 * - Match found transitions to MultiplayerGameScene
 */

import Phaser from 'phaser';
import { NetworkManager } from '../multiplayer/NetworkManager';

const SERVER_URL = 'ws://localhost:3200';

export class MultiplayerMenuScene extends Phaser.Scene {
  private network!: NetworkManager;
  private playerId: string = '';
  private displayName: string = 'Player';
  private playerElo: number = 1000;
  private wins: number = 0;
  private losses: number = 0;

  // UI elements
  private statusText!: Phaser.GameObjects.Text;
  private searchButton!: Phaser.GameObjects.Text;
  private cancelButton!: Phaser.GameObjects.Text;
  private customCreateButton!: Phaser.GameObjects.Text;
  private customJoinButton!: Phaser.GameObjects.Text;
  private roomCodeInput!: Phaser.GameObjects.Text;
  private roomCodeDisplay!: Phaser.GameObjects.Text;
  private backButton!: Phaser.GameObjects.Text;

  private searching: boolean = false;
  private customRoomCode: string = '';
  private enteringCode: boolean = false;
  private typedCode: string = '';

  constructor() {
    super({ key: 'MultiplayerMenuScene' });
  }

  init(): void {
    // Generate a player ID if not already set
    this.playerId = this.getOrCreatePlayerId();
    this.displayName = `Player_${this.playerId.slice(0, 6)}`;
  }

  create(): void {
    const { width } = this.scale;
    const cx = width / 2;

    this.cameras.main.setBackgroundColor('#0a0a1a');

    // ── Title ──
    this.add.text(cx, 60, 'MULTIPLAYER', {
      fontSize: '40px',
      fontFamily: 'monospace',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // ── Player Stats ──
    this.add.text(cx, 120, `ELO: ${this.playerElo}  |  W: ${this.wins}  L: ${this.losses}`, {
      fontSize: '16px',
      fontFamily: 'monospace',
      color: '#aaaacc',
    }).setOrigin(0.5);

    // ── Status text ──
    this.statusText = this.add.text(cx, 170, '', {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#ffcc00',
    }).setOrigin(0.5);

    // ── Find Match button ──
    this.searchButton = this.add.text(cx, 250, 'Find Match', {
      fontSize: '24px',
      fontFamily: 'monospace',
      color: '#44ff44',
      backgroundColor: '#114422',
      padding: { x: 40, y: 14 },
      fontStyle: 'bold',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    this.searchButton.on('pointerover', () => {
      if (!this.searching) this.searchButton.setBackgroundColor('#1a6633');
    });
    this.searchButton.on('pointerout', () => {
      if (!this.searching) this.searchButton.setBackgroundColor('#114422');
    });
    this.searchButton.on('pointerdown', () => this.startSearch());

    // ── Cancel button (hidden initially) ──
    this.cancelButton = this.add.text(cx, 310, 'Cancel', {
      fontSize: '16px',
      fontFamily: 'monospace',
      color: '#ff6666',
      backgroundColor: '#441111',
      padding: { x: 20, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setVisible(false);

    this.cancelButton.on('pointerdown', () => this.cancelSearch());

    // ── Custom Match section ──
    this.add.text(cx, 380, '- OR -', {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#666688',
    }).setOrigin(0.5);

    // Create custom match
    this.customCreateButton = this.add.text(cx - 120, 430, 'Create Match', {
      fontSize: '18px',
      fontFamily: 'monospace',
      color: '#4488ff',
      backgroundColor: '#112244',
      padding: { x: 20, y: 10 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    this.customCreateButton.on('pointerover', () =>
      this.customCreateButton.setBackgroundColor('#1a3366'));
    this.customCreateButton.on('pointerout', () =>
      this.customCreateButton.setBackgroundColor('#112244'));
    this.customCreateButton.on('pointerdown', () => this.createCustomMatch());

    // Join custom match
    this.customJoinButton = this.add.text(cx + 120, 430, 'Join Match', {
      fontSize: '18px',
      fontFamily: 'monospace',
      color: '#cc88ff',
      backgroundColor: '#221144',
      padding: { x: 20, y: 10 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    this.customJoinButton.on('pointerover', () =>
      this.customJoinButton.setBackgroundColor('#332266'));
    this.customJoinButton.on('pointerout', () =>
      this.customJoinButton.setBackgroundColor('#221144'));
    this.customJoinButton.on('pointerdown', () => this.showCodeInput());

    // Room code display (for created matches)
    this.roomCodeDisplay = this.add.text(cx, 490, '', {
      fontSize: '28px',
      fontFamily: 'monospace',
      color: '#ffdd00',
      fontStyle: 'bold',
    }).setOrigin(0.5).setVisible(false);

    // Room code input (for joining matches)
    this.roomCodeInput = this.add.text(cx, 490, '', {
      fontSize: '24px',
      fontFamily: 'monospace',
      color: '#ffffff',
      backgroundColor: '#222244',
      padding: { x: 20, y: 8 },
    }).setOrigin(0.5).setVisible(false);

    // ── Back button ──
    this.backButton = this.add.text(cx, 620, 'Back to Menu', {
      fontSize: '16px',
      fontFamily: 'monospace',
      color: '#888888',
      backgroundColor: '#1a1a2e',
      padding: { x: 20, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    this.backButton.on('pointerover', () => this.backButton.setColor('#cccccc'));
    this.backButton.on('pointerout', () => this.backButton.setColor('#888888'));
    this.backButton.on('pointerdown', () => {
      this.cleanupNetwork();
      this.scene.start('MainMenuScene');
    });

    // ── Setup network ──
    this.setupNetwork();

    // ── Keyboard for code input ──
    if (this.input.keyboard) {
      this.input.keyboard.on('keydown', (event: KeyboardEvent) => {
        if (!this.enteringCode) return;

        if (event.key === 'Backspace') {
          this.typedCode = this.typedCode.slice(0, -1);
          this.roomCodeInput.setText(`Code: ${this.typedCode}_`);
        } else if (event.key === 'Enter' && this.typedCode.length === 6) {
          this.joinCustomMatch(this.typedCode);
        } else if (/^[A-Za-z0-9]$/.test(event.key) && this.typedCode.length < 6) {
          this.typedCode += event.key.toUpperCase();
          this.roomCodeInput.setText(`Code: ${this.typedCode}_`);
        }
      });
    }
  }

  private setupNetwork(): void {
    this.network = new NetworkManager();

    this.network.onConnected(() => {
      this.statusText.setText('Connected to server');
      this.statusText.setColor('#44ff44');
    });

    this.network.onMatchFound((data) => {
      this.statusText.setText('Match found!');
      this.searching = false;

      // Transition to multiplayer game scene
      this.scene.start('MultiplayerGameScene', {
        network: this.network,
        playerSlot: data.playerSlot,
        opponentName: data.opponentName,
        seed: data.seed,
        roomId: data.roomId,
        playerId: this.playerId,
      });
    });

    this.network.onQueueUpdate((data) => {
      this.statusText.setText(
        `Searching... Position: ${data.position} | Wait: ${data.waitTime}s`
      );
    });

    this.network.onCustomMatchCreated((roomCode) => {
      this.customRoomCode = roomCode;
      this.roomCodeDisplay.setText(`Room Code: ${roomCode}`);
      this.roomCodeDisplay.setVisible(true);
      this.statusText.setText('Waiting for opponent...');
    });

    this.network.onError((message) => {
      this.statusText.setText(`Error: ${message}`);
      this.statusText.setColor('#ff4444');
    });

    this.network.onDisconnect(() => {
      this.statusText.setText('Disconnected from server');
      this.statusText.setColor('#ff4444');
      this.searching = false;
      this.updateSearchUI();
    });

    // Connect to server
    this.network.connect(SERVER_URL);
  }

  private startSearch(): void {
    if (this.searching || !this.network.isConnected) {
      if (!this.network.isConnected) {
        this.statusText.setText('Not connected to server');
        this.statusText.setColor('#ff4444');
      }
      return;
    }

    this.searching = true;
    this.statusText.setText('Searching for match...');
    this.statusText.setColor('#ffcc00');

    this.network.sendInput({
      type: 'joinQueue',
      playerId: this.playerId,
      displayName: this.displayName,
    });

    this.updateSearchUI();
  }

  private cancelSearch(): void {
    this.searching = false;
    this.statusText.setText('Search cancelled');
    this.statusText.setColor('#aaaacc');

    this.network.sendInput({ type: 'leaveQueue' });
    this.updateSearchUI();
  }

  private updateSearchUI(): void {
    this.searchButton.setVisible(!this.searching);
    this.cancelButton.setVisible(this.searching);
    this.customCreateButton.setVisible(!this.searching);
    this.customJoinButton.setVisible(!this.searching);
  }

  private createCustomMatch(): void {
    if (!this.network.isConnected) {
      this.statusText.setText('Not connected to server');
      this.statusText.setColor('#ff4444');
      return;
    }

    this.network.sendInput({
      type: 'customMatchCreate',
      playerId: this.playerId,
      displayName: this.displayName,
    });
  }

  private showCodeInput(): void {
    this.enteringCode = true;
    this.typedCode = '';
    this.roomCodeInput.setText('Code: _');
    this.roomCodeInput.setVisible(true);
  }

  private joinCustomMatch(code: string): void {
    if (!this.network.isConnected) {
      this.statusText.setText('Not connected to server');
      this.statusText.setColor('#ff4444');
      return;
    }

    this.enteringCode = false;
    this.roomCodeInput.setVisible(false);

    this.network.sendInput({
      type: 'customMatchJoin',
      playerId: this.playerId,
      displayName: this.displayName,
      roomCode: code,
    });

    this.statusText.setText(`Joining room ${code}...`);
    this.statusText.setColor('#ffcc00');
  }

  private getOrCreatePlayerId(): string {
    try {
      let id = localStorage.getItem('eow_player_id');
      if (!id) {
        id = crypto.randomUUID?.() ?? `${Date.now()}_${Math.random().toString(36).slice(2)}`;
        localStorage.setItem('eow_player_id', id);
      }
      return id;
    } catch {
      return `${Date.now()}_${Math.random().toString(36).slice(2)}`;
    }
  }

  private cleanupNetwork(): void {
    if (this.searching) {
      this.network.sendInput({ type: 'leaveQueue' });
    }
    this.network.disconnect();
  }
}
