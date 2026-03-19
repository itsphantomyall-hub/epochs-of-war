/**
 * AchievementPopup -- toast notification when an achievement unlocks.
 * Slides in from the top-right, shows name + reward icon, stays 3s, slides out.
 * Queues multiple popups if several unlock at once.
 */

import Phaser from 'phaser';
import type { AchievementConfig } from '../core/managers/AchievementManager';

interface QueuedPopup {
  config: AchievementConfig;
}

/** Emoji/character icon based on reward type. */
const REWARD_ICONS: Record<string, string> = {
  coins: '$',
  title: 'T',
  hero_skin: 'H',
  base_skin: 'B',
  unit_skin: 'U',
  unit_skin_set: 'U',
  profile_border: 'P',
  profile_badge: 'P',
  animated_border: 'P',
  trophy: 'W',
};

export class AchievementPopup {
  private scene: Phaser.Scene;
  private queue: QueuedPopup[] = [];
  private showing: boolean = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /** Enqueue an achievement for display. */
  show(config: AchievementConfig): void {
    this.queue.push({ config });
    if (!this.showing) {
      this.showNext();
    }
  }

  private showNext(): void {
    if (this.queue.length === 0) {
      this.showing = false;
      return;
    }

    this.showing = true;
    const popup = this.queue.shift()!;
    this.displayPopup(popup.config);
  }

  private displayPopup(config: AchievementConfig): void {
    const width = 300;
    const height = 60;
    const startX = this.scene.scale.width + width / 2;
    const targetX = this.scene.scale.width - width / 2 - 16;
    const y = 60;

    // Background
    const bg = this.scene.add.rectangle(startX, y, width, height, 0x111111, 0.92)
      .setStrokeStyle(2, 0xffd700)
      .setDepth(10000);

    // Icon
    const icon = REWARD_ICONS[config.reward.type] ?? '*';
    const iconText = this.scene.add.text(startX - width / 2 + 20, y, icon, {
      fontSize: '24px',
      fontFamily: 'monospace',
      color: '#ffd700',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(10001);

    // Title
    const titleText = this.scene.add.text(startX - width / 2 + 50, y - 12, 'Achievement Unlocked!', {
      fontSize: '10px',
      fontFamily: 'monospace',
      color: '#ffd700',
    }).setOrigin(0, 0.5).setDepth(10001);

    // Name
    const nameText = this.scene.add.text(startX - width / 2 + 50, y + 8, config.name, {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0, 0.5).setDepth(10001);

    const elements = [bg, iconText, titleText, nameText];

    // Slide in
    for (const el of elements) {
      this.scene.tweens.add({
        targets: el,
        x: el.x - (startX - targetX),
        duration: 400,
        ease: 'Back.easeOut',
      });
    }

    // Hold for 3 seconds, then slide out
    this.scene.time.delayedCall(3400, () => {
      for (const el of elements) {
        this.scene.tweens.add({
          targets: el,
          x: el.x + (startX - targetX),
          duration: 300,
          ease: 'Sine.easeIn',
          onComplete: () => {
            el.destroy();
          },
        });
      }

      // After slide-out animation, show next
      this.scene.time.delayedCall(350, () => {
        this.showNext();
      });
    });
  }
}
