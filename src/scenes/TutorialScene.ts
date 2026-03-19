/**
 * TutorialScene -- 5 micro-lessons teaching core mechanics.
 * Each lesson is a guided mini-battle with overlay prompts,
 * highlighted UI elements, and auto-advance on completion.
 */

import Phaser from 'phaser';
import { TutorialManager, TUTORIAL_LESSONS } from '../core/managers/TutorialManager';

interface LessonState {
  lessonId: number;
  timer: number;
  complete: boolean;
  // Lesson-specific state
  enemyBaseHp: number;
  enemiesAlive: number;
  enemiesSpawned: number;
  playerGold: number;
  playerXp: number;
  playerAge: number;
  unitsSpawned: number;
  turretBuilt: boolean;
  evolved: boolean;
  heroUsed: boolean;
  specialUsed: boolean;
}

export class TutorialScene extends Phaser.Scene {
  private tutorialManager!: TutorialManager;
  private currentLesson: number = 0;
  private lessonState!: LessonState;
  private promptText!: Phaser.GameObjects.Text;
  private lessonTitleText!: Phaser.GameObjects.Text;
  private progressText!: Phaser.GameObjects.Text;
  private skipBtn!: Phaser.GameObjects.Text;
  private nextBtn!: Phaser.GameObjects.Text;
  private groundY: number = 560;

  // Simple visual elements
  private playerBase!: Phaser.GameObjects.Rectangle;
  private enemyBase!: Phaser.GameObjects.Rectangle;
  private unitRects: Phaser.GameObjects.Rectangle[] = [];
  private enemyRects: Phaser.GameObjects.Rectangle[] = [];
  private highlightRect!: Phaser.GameObjects.Rectangle;

  // Buttons (simulated HUD for tutorial)
  private spawnBtn!: Phaser.GameObjects.Text;
  private turretBtn!: Phaser.GameObjects.Text;
  private evolveBtn!: Phaser.GameObjects.Text;
  private heroBtn1!: Phaser.GameObjects.Text;
  private heroBtn2!: Phaser.GameObjects.Text;
  private specialBtnText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'TutorialScene' });
  }

  create(): void {
    this.tutorialManager = new TutorialManager();
    this.currentLesson = this.tutorialManager.getCurrentLesson();
    if (this.currentLesson < 0) this.currentLesson = 0;

    this.cameras.main.setBackgroundColor('#0a0a2a');

    this.createWorld();
    this.createUI();
    this.startLesson(this.currentLesson);
  }

  private createWorld(): void {
    // Ground
    const gfx = this.add.graphics().setDepth(-10);
    gfx.fillStyle(0x5588cc, 1);
    gfx.fillRect(0, 0, 1280, this.groundY);
    gfx.fillStyle(0x557733, 1);
    gfx.fillRect(0, this.groundY, 1280, 160);

    // Bases
    this.playerBase = this.add.rectangle(80, this.groundY - 40, 48, 80, 0x2244aa)
      .setStrokeStyle(3, 0x4488ff).setDepth(0);
    this.enemyBase = this.add.rectangle(1200, this.groundY - 40, 48, 80, 0xaa2222)
      .setStrokeStyle(3, 0xff4444).setDepth(0);

    // Highlight rect (pulsing border for highlighting UI)
    this.highlightRect = this.add.rectangle(0, 0, 0, 0)
      .setStrokeStyle(3, 0xffdd00)
      .setFillStyle(0x000000, 0)
      .setDepth(9998)
      .setVisible(false);
  }

  private createUI(): void {
    // Lesson title
    this.lessonTitleText = this.add.text(640, 40, '', {
      fontSize: '28px', fontFamily: "'Impact', 'Arial Black', sans-serif", color: '#ffffff', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(9999);

    // Prompt text
    this.promptText = this.add.text(640, 100, '', {
      fontSize: '18px', fontFamily: "'Trebuchet MS', sans-serif", color: '#ffdd00',
      stroke: '#000000', strokeThickness: 3,
      align: 'center',
      wordWrap: { width: 600 },
    }).setOrigin(0.5).setDepth(9999);

    // Progress
    this.progressText = this.add.text(640, 700, '', {
      fontSize: '12px', fontFamily: "'Trebuchet MS', sans-serif", color: '#888888',
    }).setOrigin(0.5).setDepth(9999);

    // Skip button
    this.skipBtn = this.add.text(1200, 700, 'Skip Tutorial', {
      fontSize: '14px', fontFamily: "'Impact', 'Arial Black', sans-serif", color: '#888888',
      backgroundColor: '#222222', padding: { x: 12, y: 6 },
    }).setOrigin(0.5).setDepth(9999).setInteractive({ useHandCursor: true });

    this.skipBtn.on('pointerdown', () => {
      this.tutorialManager.skip();
      this.scene.start('MainMenuScene');
    });
    this.skipBtn.on('pointerover', () => this.skipBtn.setColor('#ffffff'));
    this.skipBtn.on('pointerout', () => this.skipBtn.setColor('#888888'));

    // Next button (hidden until lesson complete)
    this.nextBtn = this.add.text(640, 450, 'Next Lesson', {
      fontSize: '24px', fontFamily: "'Impact', 'Arial Black', sans-serif", color: '#44ff44',
      backgroundColor: '#224422', padding: { x: 24, y: 12 },
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(10000).setInteractive({ useHandCursor: true }).setVisible(false);

    this.nextBtn.on('pointerdown', () => {
      this.nextBtn.setVisible(false);
      this.currentLesson++;
      if (this.currentLesson >= TUTORIAL_LESSONS.length) {
        this.scene.start('MainMenuScene');
      } else {
        this.clearLessonVisuals();
        this.startLesson(this.currentLesson);
      }
    });
    this.nextBtn.on('pointerover', () => this.nextBtn.setBackgroundColor('#336633'));
    this.nextBtn.on('pointerout', () => this.nextBtn.setBackgroundColor('#224422'));

    // Tutorial action buttons (bottom bar)
    const btnY = this.groundY + 60;

    this.spawnBtn = this.add.text(200, btnY, '[Q] Spawn Warrior', {
      fontSize: '16px', fontFamily: "'Impact', 'Arial Black', sans-serif", color: '#4488ff',
      backgroundColor: '#112244', padding: { x: 16, y: 10 },
    }).setOrigin(0.5).setDepth(9999).setInteractive({ useHandCursor: true }).setVisible(false);

    this.turretBtn = this.add.text(420, btnY, '[Click] Build Turret', {
      fontSize: '16px', fontFamily: "'Impact', 'Arial Black', sans-serif", color: '#44ff44',
      backgroundColor: '#114422', padding: { x: 16, y: 10 },
    }).setOrigin(0.5).setDepth(9999).setInteractive({ useHandCursor: true }).setVisible(false);

    this.evolveBtn = this.add.text(640, btnY, '[T] Evolve!', {
      fontSize: '16px', fontFamily: "'Impact', 'Arial Black', sans-serif", color: '#ffdd00',
      backgroundColor: '#444411', padding: { x: 16, y: 10 },
    }).setOrigin(0.5).setDepth(9999).setInteractive({ useHandCursor: true }).setVisible(false);

    this.heroBtn1 = this.add.text(820, btnY, '[1] Hero Ability', {
      fontSize: '16px', fontFamily: "'Impact', 'Arial Black', sans-serif", color: '#cccc44',
      backgroundColor: '#444411', padding: { x: 16, y: 10 },
    }).setOrigin(0.5).setDepth(9999).setInteractive({ useHandCursor: true }).setVisible(false);

    this.heroBtn2 = this.add.text(1000, btnY, '[2] Hero Ability', {
      fontSize: '16px', fontFamily: "'Impact', 'Arial Black', sans-serif", color: '#cccc44',
      backgroundColor: '#444411', padding: { x: 16, y: 10 },
    }).setOrigin(0.5).setDepth(9999).setInteractive({ useHandCursor: true }).setVisible(false);

    this.specialBtnText = this.add.text(640, btnY + 50, '[SPACE] Special Attack', {
      fontSize: '16px', fontFamily: "'Impact', 'Arial Black', sans-serif", color: '#ff4444',
      backgroundColor: '#441111', padding: { x: 16, y: 10 },
    }).setOrigin(0.5).setDepth(9999).setInteractive({ useHandCursor: true }).setVisible(false);

    // Wire button clicks
    this.spawnBtn.on('pointerdown', () => this.onSpawn());
    this.turretBtn.on('pointerdown', () => this.onBuildTurret());
    this.evolveBtn.on('pointerdown', () => this.onEvolve());
    this.heroBtn1.on('pointerdown', () => this.onHeroAbility());
    this.heroBtn2.on('pointerdown', () => this.onHeroAbility());
    this.specialBtnText.on('pointerdown', () => this.onSpecial());

    // Keyboard input
    if (this.input.keyboard) {
      this.input.keyboard.on('keydown-Q', () => this.onSpawn());
      this.input.keyboard.on('keydown-T', () => this.onEvolve());
      this.input.keyboard.on('keydown-ONE', () => this.onHeroAbility());
      this.input.keyboard.on('keydown-TWO', () => this.onHeroAbility());
      this.input.keyboard.on('keydown-SPACE', () => this.onSpecial());
    }
  }

  // ── Lesson setup ──────────────────────────────────────

  private startLesson(id: number): void {
    const lesson = TUTORIAL_LESSONS[id];
    if (!lesson) return;

    this.lessonState = {
      lessonId: id,
      timer: 0,
      complete: false,
      enemyBaseHp: id === 0 ? 100 : 500,
      enemiesAlive: 0,
      enemiesSpawned: 0,
      playerGold: id === 0 ? 200 : 300,
      playerXp: id === 3 ? 90 : 0,
      playerAge: 1,
      unitsSpawned: 0,
      turretBuilt: false,
      evolved: false,
      heroUsed: false,
      specialUsed: false,
    };

    this.lessonTitleText.setText(`Lesson ${id + 1}: ${lesson.name}`);
    this.progressText.setText(`Lesson ${id + 1} / ${TUTORIAL_LESSONS.length}`);

    // Reset bases
    this.enemyBase.setVisible(true);
    this.enemyBase.setFillStyle(0xaa2222);

    // Hide all buttons, then show the relevant ones
    this.spawnBtn.setVisible(false);
    this.turretBtn.setVisible(false);
    this.evolveBtn.setVisible(false);
    this.heroBtn1.setVisible(false);
    this.heroBtn2.setVisible(false);
    this.specialBtnText.setVisible(false);
    this.highlightRect.setVisible(false);

    switch (id) {
      case 0: this.setupLesson1(); break;
      case 1: this.setupLesson2(); break;
      case 2: this.setupLesson3(); break;
      case 3: this.setupLesson4(); break;
      case 4: this.setupLesson5(); break;
    }
  }

  private setupLesson1(): void {
    this.promptText.setText('Press Q to send a warrior!\nDestroy the enemy base.');
    this.spawnBtn.setVisible(true);
    this.highlightButton(this.spawnBtn);
  }

  private setupLesson2(): void {
    this.promptText.setText('Enemies incoming! Click the turret button to build a defense!');
    this.spawnBtn.setVisible(true);
    this.turretBtn.setVisible(true);
    this.highlightButton(this.turretBtn);
    // Spawn 5 enemies over time
    for (let i = 0; i < 5; i++) {
      this.time.delayedCall(1000 + i * 2000, () => {
        if (!this.lessonState.complete) {
          this.spawnEnemy();
        }
      });
    }
  }

  private setupLesson3(): void {
    this.promptText.setText('Heavy units crush infantry!\nUse Ranged units - they deal +50% to heavies.');
    this.spawnBtn.setVisible(true);
    this.spawnBtn.setText('[W] Spawn Ranged');
    this.highlightButton(this.spawnBtn);
    // Spawn 3 heavies
    for (let i = 0; i < 3; i++) {
      this.time.delayedCall(500 + i * 3000, () => {
        if (!this.lessonState.complete) {
          this.spawnHeavyEnemy();
        }
      });
    }
  }

  private setupLesson4(): void {
    this.promptText.setText('XP bar is nearly full! Press T to evolve to the next age!');
    this.spawnBtn.setVisible(true);
    this.spawnBtn.setText('[Q] Spawn Warrior');
    this.evolveBtn.setVisible(true);
    this.highlightButton(this.evolveBtn);
    // Spawn enemies after evolution
    this.time.delayedCall(6000, () => {
      if (!this.lessonState.complete) {
        this.promptText.setText('New units unlocked! Defeat the upgraded enemies.');
        for (let i = 0; i < 3; i++) {
          this.time.delayedCall(i * 2000, () => {
            if (!this.lessonState.complete) this.spawnEnemy();
          });
        }
      }
    });
  }

  private setupLesson5(): void {
    this.promptText.setText('Full battle! Use Hero abilities [1/2] and Special [SPACE]!');
    this.spawnBtn.setVisible(true);
    this.spawnBtn.setText('[Q] Spawn Warrior');
    this.heroBtn1.setVisible(true);
    this.heroBtn2.setVisible(true);
    this.specialBtnText.setVisible(true);
    this.highlightButton(this.heroBtn1);
    // Spawn enemies continuously
    for (let i = 0; i < 5; i++) {
      this.time.delayedCall(1000 + i * 2500, () => {
        if (!this.lessonState.complete) this.spawnEnemy();
      });
    }
  }

  // ── Lesson actions ────────────────────────────────────

  private onSpawn(): void {
    if (this.lessonState.complete) return;
    if (this.lessonState.playerGold < 15) return;

    this.lessonState.playerGold -= 15;
    this.lessonState.unitsSpawned++;

    // Create a unit visual moving right
    const unit = this.add.rectangle(120, this.groundY - 12, 16, 24, 0x4488ff)
      .setStrokeStyle(1, 0xffffff).setDepth(5);
    this.unitRects.push(unit);

    this.tweens.add({
      targets: unit,
      x: 1200,
      duration: 4000 + Math.random() * 2000,
      onComplete: () => {
        unit.destroy();
        const idx = this.unitRects.indexOf(unit);
        if (idx >= 0) this.unitRects.splice(idx, 1);

        // Damage enemy base
        this.lessonState.enemyBaseHp -= 25;
        if (this.lessonState.enemyBaseHp <= 0) {
          this.lessonState.enemyBaseHp = 0;
          this.completeLesson();
        }
      },
    });
  }

  private onBuildTurret(): void {
    if (this.lessonState.turretBuilt) return;
    this.lessonState.turretBuilt = true;
    this.turretBtn.setText('Turret Built!');
    this.turretBtn.setColor('#44ff44');
    this.highlightRect.setVisible(false);

    // Show turret visual
    this.add.rectangle(100, this.groundY - 12, 16, 16, 0x44aaff)
      .setStrokeStyle(1, 0xffffff).setDepth(4);

    this.promptText.setText('Turret active! It will help defend. Spawn units too!');
    this.highlightButton(this.spawnBtn);
  }

  private onEvolve(): void {
    if (this.lessonState.evolved) return;
    if (this.lessonState.lessonId !== 3) return;

    this.lessonState.evolved = true;
    this.lessonState.playerAge = 2;
    this.evolveBtn.setText('Evolved!');
    this.evolveBtn.setColor('#44ff44');
    this.highlightRect.setVisible(false);

    this.cameras.main.flash(500, 255, 255, 200);
    this.promptText.setText('You evolved to the Bronze Age! New units unlocked. Defeat enemies!');
    this.highlightButton(this.spawnBtn);
  }

  private onHeroAbility(): void {
    if (this.lessonState.complete) return;
    this.lessonState.heroUsed = true;

    // Kill all current enemies as hero ability effect
    for (const enemy of this.enemyRects) {
      enemy.destroy();
    }
    this.enemyRects = [];
    this.lessonState.enemiesAlive = 0;

    this.promptText.setText('Hero ability used! Now use Special [SPACE].');
    this.highlightButton(this.specialBtnText);
  }

  private onSpecial(): void {
    if (this.lessonState.complete) return;
    this.lessonState.specialUsed = true;

    this.cameras.main.shake(300, 0.008);

    // Damage enemy base
    this.lessonState.enemyBaseHp -= 100;

    if (this.lessonState.lessonId === 4) {
      this.promptText.setText('Special unleashed! Finish the battle!');
    }

    if (this.lessonState.enemyBaseHp <= 0) {
      this.lessonState.enemyBaseHp = 0;
      this.completeLesson();
    }
  }

  // ── Enemy spawning ────────────────────────────────────

  private spawnEnemy(): void {
    this.lessonState.enemiesSpawned++;
    this.lessonState.enemiesAlive++;

    const enemy = this.add.rectangle(1160, this.groundY - 12, 16, 24, 0xff4444)
      .setStrokeStyle(1, 0xffffff).setDepth(5);
    this.enemyRects.push(enemy);

    this.tweens.add({
      targets: enemy,
      x: 80,
      duration: 5000 + Math.random() * 3000,
      onComplete: () => {
        if (this.lessonState.turretBuilt && this.lessonState.lessonId === 1) {
          // Turret kills the enemy
          enemy.destroy();
          const idx = this.enemyRects.indexOf(enemy);
          if (idx >= 0) this.enemyRects.splice(idx, 1);
          this.lessonState.enemiesAlive--;
          this.lessonState.playerGold += 10;

          if (this.lessonState.enemiesAlive <= 0 && this.lessonState.enemiesSpawned >= 5) {
            this.completeLesson();
          }
        } else {
          enemy.destroy();
          const idx = this.enemyRects.indexOf(enemy);
          if (idx >= 0) this.enemyRects.splice(idx, 1);
          this.lessonState.enemiesAlive--;
        }
      },
    });
  }

  private spawnHeavyEnemy(): void {
    this.lessonState.enemiesSpawned++;
    this.lessonState.enemiesAlive++;

    const enemy = this.add.rectangle(1160, this.groundY - 16, 24, 32, 0xff4444)
      .setStrokeStyle(2, 0xff8888).setDepth(5);
    this.enemyRects.push(enemy);

    // +50% floating text
    const counterText = this.add.text(enemy.x, enemy.y - 30, '+50%', {
      fontSize: '14px', fontFamily: "'Courier New', Courier, monospace", color: '#44ff44',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(9000);

    this.tweens.add({
      targets: [enemy, counterText],
      x: 80,
      duration: 7000,
      onComplete: () => {
        enemy.destroy();
        counterText.destroy();
        const idx = this.enemyRects.indexOf(enemy);
        if (idx >= 0) this.enemyRects.splice(idx, 1);
        this.lessonState.enemiesAlive--;

        if (this.lessonState.enemiesAlive <= 0 && this.lessonState.enemiesSpawned >= 3) {
          this.completeLesson();
        }
      },
    });
  }

  // ── Lesson completion ─────────────────────────────────

  private completeLesson(): void {
    if (this.lessonState.complete) return;
    this.lessonState.complete = true;

    this.tutorialManager.markComplete(this.currentLesson);
    this.highlightRect.setVisible(false);

    this.promptText.setText('Lesson Complete!');
    this.promptText.setColor('#44ff44');

    const isLast = this.currentLesson >= TUTORIAL_LESSONS.length - 1;
    this.nextBtn.setText(isLast ? 'Start Playing!' : 'Next Lesson');
    this.nextBtn.setVisible(true);
  }

  private clearLessonVisuals(): void {
    for (const r of this.unitRects) r.destroy();
    this.unitRects = [];
    for (const r of this.enemyRects) r.destroy();
    this.enemyRects = [];
    this.promptText.setColor('#ffdd00');
    this.spawnBtn.setText('[Q] Spawn Warrior');
    this.turretBtn.setText('[Click] Build Turret');
    this.turretBtn.setColor('#44ff44');
    this.evolveBtn.setText('[T] Evolve!');
    this.evolveBtn.setColor('#ffdd00');
  }

  private highlightButton(btn: Phaser.GameObjects.Text): void {
    const bounds = btn.getBounds();
    this.highlightRect.setPosition(bounds.centerX, bounds.centerY);
    this.highlightRect.setSize(bounds.width + 8, bounds.height + 8);
    this.highlightRect.setVisible(true);

    // Pulse animation
    this.tweens.add({
      targets: this.highlightRect,
      alpha: { from: 1, to: 0.3 },
      duration: 600,
      yoyo: true,
      repeat: -1,
    });
  }

  update(_time: number, delta: number): void {
    if (this.lessonState && !this.lessonState.complete) {
      this.lessonState.timer += delta / 1000;
    }
  }
}
