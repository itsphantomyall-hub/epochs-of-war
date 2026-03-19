import Phaser from 'phaser';
import { ObjectPool } from '../utils/ObjectPool';

/**
 * A single floating text entry tracked by the manager.
 */
interface FloatingTextEntry {
  text: Phaser.GameObjects.Text;
  elapsed: number;
  duration: number;
  startX: number;
  startY: number;
}

/**
 * FloatingTextManager — object-pooled floating text for gold indicators
 * and damage numbers. Text floats upward and fades out over its duration.
 */
export class FloatingTextManager {
  private readonly scene: Phaser.Scene;
  private readonly active: FloatingTextEntry[] = [];
  private readonly pool: ObjectPool<Phaser.GameObjects.Text>;

  private static readonly DEFAULT_DURATION = 1000; // ms
  private static readonly FLOAT_DISTANCE = 40; // pixels upward

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    this.pool = new ObjectPool<Phaser.GameObjects.Text>(
      () => {
        const t = scene.add.text(0, 0, '', {
          fontSize: '14px',
          fontFamily: "'Courier New', monospace",
          color: '#ffffff',
          stroke: '#000000',
          strokeThickness: 2,
        });
        t.setOrigin(0.5);
        t.setDepth(1000);
        t.setVisible(false);
        return t;
      },
      (t) => {
        t.setVisible(false);
        t.setAlpha(1);
        t.setPosition(0, 0);
        t.setText('');
      },
      16
    );
  }

  /**
   * Spawn a floating text at the given world position.
   * @param x        World X
   * @param y        World Y
   * @param message  Text to display (e.g. "+15g", "-42")
   * @param color    Hex color string (default white)
   * @param duration Lifetime in ms (default 1000)
   * @param fontSize Font size string (default '14px')
   */
  spawn(
    x: number,
    y: number,
    message: string,
    color = '#ffdd44',
    duration = FloatingTextManager.DEFAULT_DURATION,
    fontSize = '14px'
  ): void {
    const text = this.pool.acquire();
    text.setText(message);
    text.setStyle({ fontSize, color, fontFamily: "'Courier New', monospace", stroke: '#000000', strokeThickness: 2 });
    text.setPosition(x, y);
    text.setAlpha(1);
    text.setVisible(true);

    this.active.push({
      text,
      elapsed: 0,
      duration,
      startX: x,
      startY: y,
    });
  }

  /** Spawn a gold-earned indicator. */
  spawnGold(x: number, y: number, amount: number): void {
    this.spawn(x, y, `+${amount}g`, '#ffd700', 1000, '14px');
  }

  /** Spawn a damage number. */
  spawnDamage(x: number, y: number, amount: number, isCritical = false): void {
    const color = isCritical ? '#ff4444' : '#ffffff';
    const size = isCritical ? '18px' : '13px';
    this.spawn(x, y, `-${amount}`, color, 800, size);
  }

  /** Call every frame to animate active floating texts. */
  update(_time: number, delta: number): void {
    for (let i = this.active.length - 1; i >= 0; i--) {
      const entry = this.active[i];
      entry.elapsed += delta;

      const progress = Math.min(entry.elapsed / entry.duration, 1);

      // Float upward
      entry.text.y = entry.startY - FloatingTextManager.FLOAT_DISTANCE * progress;

      // Fade out in the second half
      if (progress > 0.5) {
        entry.text.setAlpha(1 - (progress - 0.5) * 2);
      }

      // Remove when done
      if (progress >= 1) {
        this.pool.release(entry.text);
        this.active.splice(i, 1);
      }
    }
  }

  /** Clean up all active texts. */
  destroy(): void {
    for (const entry of this.active) {
      entry.text.destroy();
    }
    this.active.length = 0;
  }
}
