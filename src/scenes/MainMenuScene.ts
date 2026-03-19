import Phaser from 'phaser';
import { TutorialManager } from '../core/managers/TutorialManager';
import { SaveManager } from '../core/managers/SaveManager';
import { DailyChallengeManager } from '../core/managers/DailyChallengeManager';

/**
 * MainMenuScene -- title screen with mode selection, difficulty selector,
 * and Phase 7 meta buttons (Settings, Profile, Tutorial, Daily progress).
 */
export class MainMenuScene extends Phaser.Scene {
  private selectedDifficulty: 'easy' | 'normal' | 'hard' = 'normal';
  private difficultyButtons: Phaser.GameObjects.Text[] = [];
  private tutorialManager!: TutorialManager;
  private saveManager!: SaveManager;
  private dailyChallengeManager!: DailyChallengeManager;
  private resumePrompt: Phaser.GameObjects.Text | null = null;
  private resumeBg: Phaser.GameObjects.Rectangle | null = null;

  constructor() {
    super({ key: 'MainMenuScene' });
  }

  create(): void {
    this.tutorialManager = new TutorialManager();
    this.saveManager = new SaveManager();
    this.dailyChallengeManager = new DailyChallengeManager();

    // First-time launch: auto-redirect to Tutorial
    if (this.tutorialManager.isFirstLaunch()) {
      this.scene.start('TutorialScene');
      return;
    }

    const { width, height } = this.scale;
    const cx = width / 2;

    // Background
    this.cameras.main.setBackgroundColor('#0a0a1a');

    // ── Title ──
    this.add.text(cx, 80, 'EPOCHS OF WAR', {
      fontSize: '56px',
      fontFamily: 'monospace',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Subtitle
    this.add.text(cx, 140, 'A battle through the ages', {
      fontSize: '16px',
      fontFamily: 'monospace',
      color: '#666688',
    }).setOrigin(0.5);

    // ── Mode selection ──
    this.add.text(cx, 190, 'Select Mode', {
      fontSize: '18px',
      fontFamily: 'monospace',
      color: '#aaaacc',
    }).setOrigin(0.5);

    const modes: Array<{
      label: string;
      desc: string;
      color: string;
      bgColor: string;
      hoverBg: string;
      action: () => void;
    }> = [
      {
        label: 'Classic',
        desc: 'Standard 1v1 battle',
        color: '#4488ff',
        bgColor: '#112244',
        hoverBg: '#1a3366',
        action: () => this.showDifficultySelect(),
      },
      {
        label: 'Campaign',
        desc: '30 story missions',
        color: '#44ff44',
        bgColor: '#114422',
        hoverBg: '#1a6633',
        action: () => this.scene.start('CampaignMapScene'),
      },
      {
        label: 'Survival',
        desc: 'Endless wave defense',
        color: '#ffcc00',
        bgColor: '#443311',
        hoverBg: '#665522',
        action: () => this.scene.start('SurvivalScene'),
      },
      {
        label: 'Sandbox',
        desc: 'Free experimentation',
        color: '#cc88ff',
        bgColor: '#221144',
        hoverBg: '#332266',
        action: () => this.scene.start('SandboxScene'),
      },
      {
        label: 'Multiplayer',
        desc: 'Online PvP',
        color: '#ff8844',
        bgColor: '#442211',
        hoverBg: '#663322',
        action: () => this.scene.start('MultiplayerMenuScene'),
      },
    ];

    const modeSpacing = 160;
    const modeStartX = cx - ((modes.length - 1) * modeSpacing) / 2;

    for (let i = 0; i < modes.length; i++) {
      const mode = modes[i];
      const x = modeStartX + i * modeSpacing;

      // Mode button
      const btn = this.add.text(x, 240, mode.label, {
        fontSize: '20px',
        fontFamily: 'monospace',
        color: mode.color,
        backgroundColor: mode.bgColor,
        padding: { x: 20, y: 12 },
        fontStyle: 'bold',
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      // Description below
      this.add.text(x, 280, mode.desc, {
        fontSize: '10px',
        fontFamily: 'monospace',
        color: '#666688',
      }).setOrigin(0.5);

      btn.on('pointerover', () => btn.setBackgroundColor(mode.hoverBg));
      btn.on('pointerout', () => btn.setBackgroundColor(mode.bgColor));
      btn.on('pointerdown', mode.action);
    }

    // ── Meta buttons row (Settings, Profile, Tutorial) ──
    const metaY = 620;
    const metaButtons: Array<{
      label: string;
      color: string;
      bgColor: string;
      hoverBg: string;
      scene: string;
    }> = [
      { label: 'Settings', color: '#aaaacc', bgColor: '#1a1a2e', hoverBg: '#2a2a3e', scene: 'SettingsScene' },
      { label: 'Profile', color: '#aaaacc', bgColor: '#1a1a2e', hoverBg: '#2a2a3e', scene: 'ProfileScene' },
      { label: 'Tutorial', color: '#aaaacc', bgColor: '#1a1a2e', hoverBg: '#2a2a3e', scene: 'TutorialScene' },
    ];

    const metaSpacing = 140;
    const metaStartX = cx - ((metaButtons.length - 1) * metaSpacing) / 2;

    for (let i = 0; i < metaButtons.length; i++) {
      const meta = metaButtons[i];
      const x = metaStartX + i * metaSpacing;

      const btn = this.add.text(x, metaY, meta.label, {
        fontSize: '14px',
        fontFamily: 'monospace',
        color: meta.color,
        backgroundColor: meta.bgColor,
        padding: { x: 14, y: 8 },
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      btn.on('pointerover', () => btn.setBackgroundColor(meta.hoverBg));
      btn.on('pointerout', () => btn.setBackgroundColor(meta.bgColor));
      btn.on('pointerdown', () => this.scene.start(meta.scene));
    }

    // ── Daily challenge progress indicator ──
    const completedCount = this.dailyChallengeManager.getCompletedCount();
    this.add.text(cx, 660, `Daily: ${completedCount}/3`, {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: completedCount >= 3 ? '#44ff44' : '#ffd700',
    }).setOrigin(0.5);

    // ── Resume prompt (if saved game exists) ──
    if (this.saveManager.hasSave()) {
      this.showResumePrompt(cx);
    }

    // ── Footer ──
    this.add.text(cx, height - 20, 'Q/W/E/R = Spawn Units  |  T = Evolve  |  SPACE = Special  |  ESC = Pause', {
      fontSize: '11px',
      fontFamily: 'monospace',
      color: '#444466',
    }).setOrigin(0.5);
  }

  /** Shows the "Resume Game?" prompt if a saved game exists. */
  private showResumePrompt(cx: number): void {
    const saveInfo = this.saveManager.getSaveInfo();
    if (!saveInfo) return;

    const elapsed = Math.floor(saveInfo.elapsedTime);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;

    this.resumeBg = this.add.rectangle(cx, 320, 400, 80, 0x111133, 0.9)
      .setStrokeStyle(2, 0x4488ff);

    this.resumePrompt = this.add.text(cx, 310, `Resume ${saveInfo.mode} game? (${minutes}:${String(seconds).padStart(2, '0')})`, {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#ffffff',
      align: 'center',
    }).setOrigin(0.5);

    const resumeBtn = this.add.text(cx - 60, 340, 'Resume', {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#44ff44',
      backgroundColor: '#224422',
      padding: { x: 12, y: 6 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    resumeBtn.on('pointerdown', () => {
      this.scene.start('GameScene', { difficulty: saveInfo.difficulty as 'easy' | 'normal' | 'hard' });
    });

    const discardBtn = this.add.text(cx + 60, 340, 'Discard', {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#ff4444',
      backgroundColor: '#442222',
      padding: { x: 12, y: 6 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    discardBtn.on('pointerdown', () => {
      this.saveManager.deleteSave();
      this.resumePrompt?.destroy();
      this.resumeBg?.destroy();
      resumeBtn.destroy();
      discardBtn.destroy();
    });
  }

  /** Shows the difficulty selector and classic play button below the modes. */
  private showDifficultySelect(): void {
    const cx = this.scale.width / 2;

    // Check if difficulty panel already exists
    if (this.difficultyButtons.length > 0) {
      this.scene.start('GameScene', { difficulty: this.selectedDifficulty });
      return;
    }

    // ── Difficulty selector ──
    this.add.text(cx, 380, 'Difficulty', {
      fontSize: '18px',
      fontFamily: 'monospace',
      color: '#aaaacc',
    }).setOrigin(0.5);

    const difficulties: Array<{ label: string; value: 'easy' | 'normal' | 'hard' }> = [
      { label: 'Easy', value: 'easy' },
      { label: 'Normal', value: 'normal' },
      { label: 'Hard', value: 'hard' },
    ];

    const btnSpacing = 120;
    const btnStartX = cx - btnSpacing;

    for (let i = 0; i < difficulties.length; i++) {
      const diff = difficulties[i];
      const x = btnStartX + i * btnSpacing;

      const btn = this.add.text(x, 420, diff.label, {
        fontSize: '16px',
        fontFamily: 'monospace',
        color: diff.value === this.selectedDifficulty ? '#44ff44' : '#888888',
        backgroundColor: diff.value === this.selectedDifficulty ? '#224422' : '#1a1a2e',
        padding: { x: 14, y: 8 },
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      btn.on('pointerdown', () => {
        this.selectedDifficulty = diff.value;
        this.updateDifficultyButtons();
      });

      btn.on('pointerover', () => {
        if (this.selectedDifficulty !== diff.value) btn.setColor('#cccccc');
      });

      btn.on('pointerout', () => {
        if (this.selectedDifficulty !== diff.value) btn.setColor('#888888');
      });

      this.difficultyButtons.push(btn);
    }

    // ── Play button ──
    const playBtn = this.add.text(cx, 490, 'PLAY CLASSIC', {
      fontSize: '24px',
      fontFamily: 'monospace',
      color: '#ffffff',
      backgroundColor: '#2244aa',
      padding: { x: 40, y: 12 },
      fontStyle: 'bold',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    playBtn.on('pointerover', () => playBtn.setBackgroundColor('#3366cc'));
    playBtn.on('pointerout', () => playBtn.setBackgroundColor('#2244aa'));
    playBtn.on('pointerdown', () => {
      this.scene.start('GameScene', { difficulty: this.selectedDifficulty });
    });
  }

  private updateDifficultyButtons(): void {
    const values: Array<'easy' | 'normal' | 'hard'> = ['easy', 'normal', 'hard'];

    for (let i = 0; i < this.difficultyButtons.length; i++) {
      const btn = this.difficultyButtons[i];
      const isSelected = values[i] === this.selectedDifficulty;
      btn.setColor(isSelected ? '#44ff44' : '#888888');
      btn.setBackgroundColor(isSelected ? '#224422' : '#1a1a2e');
    }
  }
}
