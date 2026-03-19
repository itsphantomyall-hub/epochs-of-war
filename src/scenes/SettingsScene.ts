/**
 * SettingsScene -- full settings menu with Gameplay, Video, Audio,
 * and Controls sections. All settings saved to localStorage and
 * applied immediately via SettingsManager.
 */

import Phaser from 'phaser';
import { SettingsManager, GameSettings } from '../core/managers/SettingsManager';

type Category = 'gameplay' | 'video' | 'audio' | 'controls';

export class SettingsScene extends Phaser.Scene {
  private settings!: SettingsManager;
  private activeCategory: Category = 'gameplay';
  private contentGroup!: Phaser.GameObjects.Group;
  private categoryButtons: Phaser.GameObjects.Text[] = [];

  constructor() {
    super({ key: 'SettingsScene' });
  }

  create(): void {
    this.settings = SettingsManager.getInstance();
    this.cameras.main.setBackgroundColor('#0a0a1a');

    const { width } = this.scale;
    const cx = width / 2;

    // Title
    this.add.text(cx, 40, 'SETTINGS', {
      fontSize: '36px', fontFamily: "'Impact', 'Arial Black', sans-serif", color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5);

    // Category tabs
    const categories: { label: string; value: Category }[] = [
      { label: 'Gameplay', value: 'gameplay' },
      { label: 'Video', value: 'video' },
      { label: 'Audio', value: 'audio' },
      { label: 'Controls', value: 'controls' },
    ];

    const tabY = 90;
    const tabSpacing = 160;
    const tabStartX = cx - ((categories.length - 1) * tabSpacing) / 2;

    for (let i = 0; i < categories.length; i++) {
      const cat = categories[i];
      const x = tabStartX + i * tabSpacing;
      const btn = this.add.text(x, tabY, cat.label, {
        fontSize: '16px', fontFamily: "'Trebuchet MS', sans-serif",
        color: this.activeCategory === cat.value ? '#44ff44' : '#888888',
        backgroundColor: this.activeCategory === cat.value ? '#224422' : '#1a1a2e',
        padding: { x: 16, y: 8 },
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      btn.on('pointerdown', () => {
        this.activeCategory = cat.value;
        this.updateCategoryHighlights();
        this.renderContent();
      });

      this.categoryButtons.push(btn);
    }

    // Content group
    this.contentGroup = this.add.group();

    // Back button
    const backBtn = this.add.text(80, 680, 'Back', {
      fontSize: '18px', fontFamily: "'Trebuchet MS', sans-serif", color: '#ffffff',
      backgroundColor: '#333333', padding: { x: 20, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    backBtn.on('pointerdown', () => this.scene.start('MainMenuScene'));
    backBtn.on('pointerover', () => backBtn.setBackgroundColor('#555555'));
    backBtn.on('pointerout', () => backBtn.setBackgroundColor('#333333'));

    this.renderContent();
  }

  private updateCategoryHighlights(): void {
    const categories: Category[] = ['gameplay', 'video', 'audio', 'controls'];
    for (let i = 0; i < this.categoryButtons.length; i++) {
      const isActive = categories[i] === this.activeCategory;
      this.categoryButtons[i].setColor(isActive ? '#44ff44' : '#888888');
      this.categoryButtons[i].setBackgroundColor(isActive ? '#224422' : '#1a1a2e');
    }
  }

  private renderContent(): void {
    // Clear existing content
    this.contentGroup.clear(true, true);

    const startY = 150;
    const cx = this.scale.width / 2;

    switch (this.activeCategory) {
      case 'gameplay': this.renderGameplay(cx, startY); break;
      case 'video': this.renderVideo(cx, startY); break;
      case 'audio': this.renderAudio(cx, startY); break;
      case 'controls': this.renderControls(cx, startY); break;
    }
  }

  // ── Gameplay ──────────────────────────────────────────

  private renderGameplay(cx: number, startY: number): void {
    this.addToggle(cx, startY, 'Damage Numbers', 'damageNumbers');
    this.addToggle(cx, startY + 60, 'Counter Indicators', 'counterIndicators');
    this.addToggle(cx, startY + 120, 'Suggested Unit Highlighting', 'suggestedUnit');
  }

  // ── Video ─────────────────────────────────────────────

  private renderVideo(cx: number, startY: number): void {
    this.addSlider(cx, startY, 'Screen Shake Intensity', 'screenShakeIntensity', 0, 100);
    this.addOptionCycle(cx, startY + 80, 'Particle Density', 'particleDensity', ['low', 'medium', 'high']);
    this.addOptionCycle(cx, startY + 160, 'Colorblind Mode', 'colorblindMode', ['none', 'deuteranopia', 'protanopia', 'tritanopia']);
  }

  // ── Audio ─────────────────────────────────────────────

  private renderAudio(cx: number, startY: number): void {
    this.addSlider(cx, startY, 'Master Volume', 'masterVolume', 0, 100);
    this.addSlider(cx, startY + 80, 'Music Volume', 'musicVolume', 0, 100);
    this.addSlider(cx, startY + 160, 'SFX Volume', 'sfxVolume', 0, 100);
  }

  // ── Controls ──────────────────────────────────────────

  private renderControls(cx: number, startY: number): void {
    const bindings = [
      ['Q', 'Spawn Infantry'],
      ['W', 'Spawn Ranged'],
      ['E', 'Spawn Heavy'],
      ['R', 'Spawn Special'],
      ['T', 'Evolve'],
      ['SPACE', 'Special Attack'],
      ['1', 'Hero Ability 1'],
      ['2', 'Hero Ability 2'],
      ['ESC', 'Pause'],
    ];

    for (let i = 0; i < bindings.length; i++) {
      const [key, action] = bindings[i];
      const y = startY + i * 40;

      const keyText = this.add.text(cx - 100, y, `[${key}]`, {
        fontSize: '14px', fontFamily: "'Courier New', Courier, monospace", color: '#ffd700',
      }).setOrigin(1, 0.5);

      const actionText = this.add.text(cx - 80, y, action, {
        fontSize: '14px', fontFamily: "'Trebuchet MS', sans-serif", color: '#cccccc',
      }).setOrigin(0, 0.5);

      this.contentGroup.add(keyText);
      this.contentGroup.add(actionText);
    }

    const note = this.add.text(cx, startY + bindings.length * 40 + 20, '(Keybinding remapping coming soon)', {
      fontSize: '12px', fontFamily: "'Trebuchet MS', sans-serif", color: '#666666',
    }).setOrigin(0.5);
    this.contentGroup.add(note);
  }

  // ── UI Helpers ────────────────────────────────────────

  private addToggle(cx: number, y: number, label: string, key: keyof GameSettings): void {
    const current = this.settings.get(key) as boolean;

    const labelText = this.add.text(cx - 200, y, label, {
      fontSize: '16px', fontFamily: "'Trebuchet MS', sans-serif", color: '#cccccc',
    }).setOrigin(0, 0.5);

    const toggleBtn = this.add.text(cx + 150, y, current ? 'ON' : 'OFF', {
      fontSize: '16px', fontFamily: "'Trebuchet MS', sans-serif",
      color: current ? '#44ff44' : '#ff4444',
      backgroundColor: current ? '#224422' : '#442222',
      padding: { x: 16, y: 6 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    toggleBtn.on('pointerdown', () => {
      const newVal = !(this.settings.get(key) as boolean);
      this.settings.set(key, newVal as GameSettings[typeof key]);
      toggleBtn.setText(newVal ? 'ON' : 'OFF');
      toggleBtn.setColor(newVal ? '#44ff44' : '#ff4444');
      toggleBtn.setBackgroundColor(newVal ? '#224422' : '#442222');
    });

    this.contentGroup.add(labelText);
    this.contentGroup.add(toggleBtn);
  }

  private addSlider(cx: number, y: number, label: string, key: keyof GameSettings, min: number, max: number): void {
    const current = this.settings.get(key) as number;

    const labelText = this.add.text(cx - 200, y, label, {
      fontSize: '16px', fontFamily: "'Trebuchet MS', sans-serif", color: '#cccccc',
    }).setOrigin(0, 0.5);

    // Slider track
    const trackX = cx + 50;
    const trackW = 200;
    const track = this.add.rectangle(trackX, y, trackW, 6, 0x333333).setOrigin(0, 0.5);

    // Slider fill
    const ratio = (current - min) / (max - min);
    const fill = this.add.rectangle(trackX, y, trackW * ratio, 6, 0x4488ff).setOrigin(0, 0.5);

    // Value text
    const valueText = this.add.text(trackX + trackW + 20, y, `${current}%`, {
      fontSize: '14px', fontFamily: "'Courier New', Courier, monospace", color: '#ffffff',
    }).setOrigin(0, 0.5);

    // Make track interactive
    track.setInteractive(new Phaser.Geom.Rectangle(0, -10, trackW, 26), Phaser.Geom.Rectangle.Contains);
    track.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const localX = pointer.x - trackX;
      const newRatio = Phaser.Math.Clamp(localX / trackW, 0, 1);
      const newVal = Math.round(min + newRatio * (max - min));
      this.settings.set(key, newVal as GameSettings[typeof key]);
      fill.setSize(trackW * newRatio, 6);
      valueText.setText(`${newVal}%`);
    });

    this.contentGroup.add(labelText);
    this.contentGroup.add(track);
    this.contentGroup.add(fill);
    this.contentGroup.add(valueText);
  }

  private addOptionCycle(cx: number, y: number, label: string, key: keyof GameSettings, options: string[]): void {
    const current = this.settings.get(key) as string;

    const labelText = this.add.text(cx - 200, y, label, {
      fontSize: '16px', fontFamily: "'Trebuchet MS', sans-serif", color: '#cccccc',
    }).setOrigin(0, 0.5);

    const displayName = current.charAt(0).toUpperCase() + current.slice(1);
    const cycleBtn = this.add.text(cx + 150, y, displayName, {
      fontSize: '16px', fontFamily: "'Trebuchet MS', sans-serif", color: '#4488ff',
      backgroundColor: '#112244', padding: { x: 16, y: 6 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    cycleBtn.on('pointerdown', () => {
      const currentVal = this.settings.get(key) as string;
      const idx = options.indexOf(currentVal);
      const nextIdx = (idx + 1) % options.length;
      const nextVal = options[nextIdx];
      this.settings.set(key, nextVal as GameSettings[typeof key]);
      const name = nextVal.charAt(0).toUpperCase() + nextVal.slice(1);
      cycleBtn.setText(name);
    });

    this.contentGroup.add(labelText);
    this.contentGroup.add(cycleBtn);
  }
}
