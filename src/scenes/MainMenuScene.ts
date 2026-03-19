import Phaser from 'phaser';

/**
 * MainMenuScene — title screen with Play button and difficulty selector.
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
    this.add.text(cx, 160, 'EPOCHS OF WAR', {
      fontSize: '56px',
      fontFamily: 'monospace',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Subtitle
    this.add.text(cx, 220, 'A battle through the ages', {
      fontSize: '16px',
      fontFamily: 'monospace',
      color: '#666688',
    }).setOrigin(0.5);

    // ── Difficulty selector ──
    this.add.text(cx, 340, 'Difficulty', {
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

      const btn = this.add.text(x, 385, diff.label, {
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
        if (this.selectedDifficulty !== diff.value) {
          btn.setColor('#cccccc');
        }
      });

      btn.on('pointerout', () => {
        if (this.selectedDifficulty !== diff.value) {
          btn.setColor('#888888');
        }
      });

      this.difficultyButtons.push(btn);
    }

    // ── Play button ──
    const playBtn = this.add.text(cx, 490, 'PLAY', {
      fontSize: '28px',
      fontFamily: 'monospace',
      color: '#ffffff',
      backgroundColor: '#2244aa',
      padding: { x: 50, y: 14 },
      fontStyle: 'bold',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    playBtn.on('pointerover', () => {
      playBtn.setBackgroundColor('#3366cc');
    });

    playBtn.on('pointerout', () => {
      playBtn.setBackgroundColor('#2244aa');
    });

    playBtn.on('pointerdown', () => {
      this.scene.start('GameScene', { difficulty: this.selectedDifficulty });
    });

    // ── Footer ──
    this.add.text(cx, height - 30, 'Q/W/E/R = Spawn Units  |  T = Evolve  |  SPACE = Special  |  ESC = Pause', {
      fontSize: '11px',
      fontFamily: 'monospace',
      color: '#444466',
    }).setOrigin(0.5);
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
