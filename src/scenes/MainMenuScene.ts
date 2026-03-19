import Phaser from 'phaser';

/**
 * MainMenuScene -- title screen with mode selection and difficulty selector.
 *
 * Modes:
 *   Classic  -- original gameplay with difficulty select
 *   Campaign -- story missions across 6 continents
 *   Survival -- endless wave defense with buff selection
 *   Sandbox  -- free unit experimentation
 */
export class MainMenuScene extends Phaser.Scene {
  private selectedDifficulty: 'easy' | 'normal' | 'hard' = 'normal';
  private difficultyButtons: Phaser.GameObjects.Text[] = [];

  constructor() {
    super({ key: 'MainMenuScene' });
  }

  create(): void {
    const { width, height } = this.scale;
    const cx = width / 2;

    // Background
    this.cameras.main.setBackgroundColor('#0a0a1a');

    // ── Title ──
    this.add.text(cx, 100, 'EPOCHS OF WAR', {
      fontSize: '56px',
      fontFamily: 'monospace',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Subtitle
    this.add.text(cx, 160, 'A battle through the ages', {
      fontSize: '16px',
      fontFamily: 'monospace',
      color: '#666688',
    }).setOrigin(0.5);

    // ── Mode selection ──
    this.add.text(cx, 220, 'Select Mode', {
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
    ];

    const modeSpacing = 160;
    const modeStartX = cx - ((modes.length - 1) * modeSpacing) / 2;

    for (let i = 0; i < modes.length; i++) {
      const mode = modes[i];
      const x = modeStartX + i * modeSpacing;

      // Mode button
      const btn = this.add.text(x, 280, mode.label, {
        fontSize: '20px',
        fontFamily: 'monospace',
        color: mode.color,
        backgroundColor: mode.bgColor,
        padding: { x: 20, y: 12 },
        fontStyle: 'bold',
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      // Description below
      this.add.text(x, 320, mode.desc, {
        fontSize: '10px',
        fontFamily: 'monospace',
        color: '#666688',
      }).setOrigin(0.5);

      btn.on('pointerover', () => btn.setBackgroundColor(mode.hoverBg));
      btn.on('pointerout', () => btn.setBackgroundColor(mode.bgColor));
      btn.on('pointerdown', mode.action);
    }

    // ── Footer ──
    this.add.text(cx, height - 30, 'Q/W/E/R = Spawn Units  |  T = Evolve  |  SPACE = Special  |  ESC = Pause', {
      fontSize: '11px',
      fontFamily: 'monospace',
      color: '#444466',
    }).setOrigin(0.5);
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
    this.add.text(cx, 400, 'Difficulty', {
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

      const btn = this.add.text(x, 440, diff.label, {
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
    const playBtn = this.add.text(cx, 520, 'PLAY CLASSIC', {
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
