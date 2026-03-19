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
    // Reset state from previous visits (Phaser reuses the scene instance)
    this.difficultyButtons = [];
    this.resumePrompt = null;
    this.resumeBg = null;

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

    // ── Animated battlefield background ──
    const gfx = this.add.graphics().setDepth(-10);
    gfx.fillStyle(0x1a1a3a, 1); // dark sky
    gfx.fillRect(0, 0, 1280, 500);
    gfx.fillStyle(0x334422, 1); // ground
    gfx.fillRect(0, 500, 1280, 220);
    gfx.fillStyle(0x445533, 1); // grass line
    gfx.fillRect(0, 498, 1280, 4);

    // Spawn decorative "battle" units that walk across in the background
    this.time.addEvent({
      delay: 2000,
      loop: true,
      callback: () => {
        // Blue unit walks right
        const blue = this.add.rectangle(50, 480, 8, 14, 0x4488ff).setDepth(-5);
        this.tweens.add({ targets: blue, x: 1300, duration: 12000, onComplete: () => blue.destroy() });
        // Red unit walks left
        const red = this.add.rectangle(1230, 485, 8, 14, 0xff4444).setDepth(-5);
        this.tweens.add({ targets: red, x: -20, duration: 12000, onComplete: () => red.destroy() });
      },
    });

    // Floating embers/particles in the background
    this.time.addEvent({
      delay: 300,
      loop: true,
      callback: () => {
        const x = Math.random() * 1280;
        const ember = this.add.circle(x, 520, 1, 0xff8844, 0.6).setDepth(-4);
        this.tweens.add({
          targets: ember,
          y: 300 + Math.random() * 100,
          alpha: 0,
          duration: 3000 + Math.random() * 2000,
          onComplete: () => ember.destroy(),
        });
      },
    });

    // ── Title with shadow for depth ──
    this.add.text(cx + 3, 83, 'EPOCHS OF WAR', {
      fontSize: '58px',
      fontFamily: "'Impact', 'Arial Black', sans-serif",
      color: '#000000',
    }).setOrigin(0.5).setAlpha(0.4); // Shadow

    this.add.text(cx, 80, 'EPOCHS OF WAR', {
      fontSize: '58px',
      fontFamily: "'Impact', 'Arial Black', sans-serif",
      color: '#FFD700',
      fontStyle: 'bold',
      stroke: '#8B6914',
      strokeThickness: 3,
    }).setOrigin(0.5);

    // Subtitle with different font
    this.add.text(cx, 140, 'A BATTLE THROUGH THE AGES', {
      fontSize: '14px',
      fontFamily: "'Trebuchet MS', 'Helvetica', sans-serif",
      color: '#8888aa',
      letterSpacing: 8,
    }).setOrigin(0.5);

    // ── Mode selection ──
    this.add.text(cx, 190, 'Select Mode', {
      fontSize: '18px',
      fontFamily: "'Trebuchet MS', 'Segoe UI', sans-serif",
      color: '#aaaacc',
    }).setOrigin(0.5);

    // Mode data
    const modes: Array<{
      label: string;
      desc: string;
      action: () => void;
    }> = [
      {
        label: 'Classic',
        desc: 'Standard 1v1 battle',
        action: () => this.showDifficultySelect(),
      },
      {
        label: 'Campaign',
        desc: '30 story missions',
        action: () => this.scene.start('CampaignMapScene'),
      },
      {
        label: 'Survival',
        desc: 'Endless wave defense',
        action: () => this.scene.start('SurvivalScene'),
      },
      {
        label: 'Sandbox',
        desc: 'Free experimentation',
        action: () => this.scene.start('SandboxScene'),
      },
      {
        label: 'Multiplayer',
        desc: 'Online PvP',
        action: () => this.scene.start('MultiplayerMenuScene'),
      },
    ];

    // ── Row 1 (y=240): Classic — large, gold accent, pulsing ──
    const classicMode = modes[0];
    const classicBtn = this.add.text(cx, 240, '\u2694  CLASSIC  \u2694', {
      fontSize: '28px',
      fontFamily: "'Impact', sans-serif",
      color: '#ffffff',
      backgroundColor: '#2244aa',
      padding: { x: 40, y: 16 },
      fontStyle: 'bold',
      stroke: '#1a3366',
      strokeThickness: 1,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    // Subtle pulse glow on Classic
    this.tweens.add({
      targets: classicBtn,
      alpha: { from: 1, to: 0.85 },
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.add.text(cx, 280, classicMode.desc, {
      fontSize: '13px',
      fontFamily: "'Trebuchet MS', 'Segoe UI', sans-serif",
      color: '#8888aa',
    }).setOrigin(0.5);

    classicBtn.on('pointerover', () => classicBtn.setBackgroundColor('#3366cc'));
    classicBtn.on('pointerout', () => classicBtn.setBackgroundColor('#2244aa'));
    classicBtn.on('pointerdown', classicMode.action);

    // ── Row 2 (y=320): Campaign + Survival — medium, side by side ──
    const row2Modes = [modes[1], modes[2]];
    const row2Colors = [
      { color: '#44ff44', bgColor: '#114422', hoverBg: '#1a6633' },
      { color: '#ffcc00', bgColor: '#443311', hoverBg: '#665522' },
    ];
    const row2Spacing = 200;
    const row2StartX = cx - row2Spacing / 2;

    for (let i = 0; i < row2Modes.length; i++) {
      const mode = row2Modes[i];
      const colors = row2Colors[i];
      const x = row2StartX + i * row2Spacing;

      const btn = this.add.text(x, 320, mode.label, {
        fontSize: '20px',
        fontFamily: "'Impact', sans-serif",
        color: colors.color,
        backgroundColor: colors.bgColor,
        padding: { x: 24, y: 10 },
        fontStyle: 'bold',
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      this.add.text(x, 355, mode.desc, {
        fontSize: '12px',
        fontFamily: "'Trebuchet MS', 'Segoe UI', sans-serif",
        color: '#666688',
      }).setOrigin(0.5);

      btn.on('pointerover', () => btn.setBackgroundColor(colors.hoverBg));
      btn.on('pointerout', () => btn.setBackgroundColor(colors.bgColor));
      btn.on('pointerdown', mode.action);
    }

    // ── Row 3 (y=380): Sandbox + Multiplayer — small, muted colors ──
    const row3Modes = [modes[3], modes[4]];
    const row3Colors = [
      { color: '#9977bb', bgColor: '#1a1133', hoverBg: '#2a2244' },
      { color: '#bb7744', bgColor: '#221a11', hoverBg: '#332a22' },
    ];
    const row3Spacing = 180;
    const row3StartX = cx - row3Spacing / 2;

    for (let i = 0; i < row3Modes.length; i++) {
      const mode = row3Modes[i];
      const colors = row3Colors[i];
      const x = row3StartX + i * row3Spacing;

      const btn = this.add.text(x, 390, mode.label, {
        fontSize: '15px',
        fontFamily: "'Impact', sans-serif",
        color: colors.color,
        backgroundColor: colors.bgColor,
        padding: { x: 16, y: 8 },
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      this.add.text(x, 420, mode.desc, {
        fontSize: '11px',
        fontFamily: "'Trebuchet MS', 'Segoe UI', sans-serif",
        color: '#555566',
      }).setOrigin(0.5);

      btn.on('pointerover', () => btn.setBackgroundColor(colors.hoverBg));
      btn.on('pointerout', () => btn.setBackgroundColor(colors.bgColor));
      btn.on('pointerdown', mode.action);
    }

    // ── Meta buttons row (Settings, Profile, Tutorial) — subtle text links ──
    const metaY = 620;
    const metaButtons: Array<{
      label: string;
      scene: string;
    }> = [
      { label: 'Settings', scene: 'SettingsScene' },
      { label: 'Profile', scene: 'ProfileScene' },
      { label: 'Tutorial', scene: 'TutorialScene' },
    ];

    const metaSpacing = 140;
    const metaStartX = cx - ((metaButtons.length - 1) * metaSpacing) / 2;

    for (let i = 0; i < metaButtons.length; i++) {
      const meta = metaButtons[i];
      const x = metaStartX + i * metaSpacing;

      const btn = this.add.text(x, metaY, meta.label, {
        fontSize: '13px',
        fontFamily: "'Trebuchet MS', sans-serif",
        color: '#666688',
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      btn.on('pointerover', () => btn.setColor('#aaaacc'));
      btn.on('pointerout', () => btn.setColor('#666688'));
      btn.on('pointerdown', () => this.scene.start(meta.scene));
    }

    // ── Daily challenge progress indicator ──
    const completedCount = this.dailyChallengeManager.getCompletedCount();
    this.add.text(cx, 660, `Daily: ${completedCount}/3`, {
      fontSize: '12px',
      fontFamily: "'Trebuchet MS', 'Segoe UI', sans-serif",
      color: completedCount >= 3 ? '#44ff44' : '#ffd700',
    }).setOrigin(0.5);

    // ── Resume prompt (if saved game exists) ──
    if (this.saveManager.hasSave()) {
      this.showResumePrompt(cx);
    }

    // ── Footer ──
    this.add.text(cx, height - 20, 'Q/W/E/R = Spawn Units  |  T = Evolve  |  SPACE = Special  |  ESC = Pause', {
      fontSize: '11px',
      fontFamily: "'Trebuchet MS', 'Segoe UI', sans-serif",
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

    this.resumeBg = this.add.rectangle(cx, 470, 400, 80, 0x111133, 0.9)
      .setStrokeStyle(2, 0x4488ff);

    this.resumePrompt = this.add.text(cx, 460, `Resume ${saveInfo.mode} game? (${minutes}:${String(seconds).padStart(2, '0')})`, {
      fontSize: '14px',
      fontFamily: "'Trebuchet MS', 'Segoe UI', sans-serif",
      color: '#ffffff',
      align: 'center',
    }).setOrigin(0.5);

    const resumeBtn = this.add.text(cx - 60, 490, 'Resume', {
      fontSize: '14px',
      fontFamily: "'Impact', sans-serif",
      color: '#44ff44',
      backgroundColor: '#224422',
      padding: { x: 12, y: 6 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    resumeBtn.on('pointerdown', () => {
      this.scene.start('GameScene', { difficulty: saveInfo.difficulty as 'easy' | 'normal' | 'hard' });
    });

    const discardBtn = this.add.text(cx + 60, 490, 'Discard', {
      fontSize: '14px',
      fontFamily: "'Impact', sans-serif",
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
    this.add.text(cx, 530, 'Difficulty', {
      fontSize: '18px',
      fontFamily: "'Impact', 'Arial Black', sans-serif",
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

      const btn = this.add.text(x, 565, diff.label, {
        fontSize: '16px',
        fontFamily: "'Impact', sans-serif",
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
    const playBtn = this.add.text(cx, 620, 'PLAY CLASSIC', {
      fontSize: '24px',
      fontFamily: "'Impact', sans-serif",
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
