/**
 * ProfileScene -- displays player profile with persistent stats,
 * achievement list, campaign progress, and survival record.
 */

import Phaser from 'phaser';
import { StatsManager } from '../core/managers/StatsManager';
import { AchievementManager, AchievementState } from '../core/managers/AchievementManager';
import { CampaignManager } from '../core/managers/CampaignManager';

export class ProfileScene extends Phaser.Scene {
  private statsManager!: StatsManager;
  private achievementManager!: AchievementManager;
  private campaignManager!: CampaignManager;

  constructor() {
    super({ key: 'ProfileScene' });
  }

  create(): void {
    this.statsManager = new StatsManager();
    this.achievementManager = new AchievementManager();
    this.campaignManager = new CampaignManager();

    this.cameras.main.setBackgroundColor('#0a0a1a');

    const { width } = this.scale;
    const cx = width / 2;

    // Title
    this.add.text(cx, 40, 'PLAYER PROFILE', {
      fontSize: '36px', fontFamily: 'monospace', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5);

    // Stats section (left half)
    this.renderStats(200, 100);

    // Achievements section (right half)
    this.renderAchievements(780, 100);

    // Back button
    const backBtn = this.add.text(80, 680, 'Back', {
      fontSize: '18px', fontFamily: 'monospace', color: '#ffffff',
      backgroundColor: '#333333', padding: { x: 20, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    backBtn.on('pointerdown', () => this.scene.start('MainMenuScene'));
    backBtn.on('pointerover', () => backBtn.setBackgroundColor('#555555'));
    backBtn.on('pointerout', () => backBtn.setBackgroundColor('#333333'));
  }

  private renderStats(cx: number, startY: number): void {
    const stats = this.statsManager.getAll();
    const campaign = this.campaignManager.getProgress();

    this.add.text(cx, startY, 'Statistics', {
      fontSize: '22px', fontFamily: 'monospace', color: '#ffd700', fontStyle: 'bold',
    }).setOrigin(0.5);

    const lines: [string, string][] = [
      ['Games Played', String(stats.totalGamesPlayed)],
      ['Wins', String(stats.totalWins)],
      ['Losses', String(stats.totalLosses)],
      ['Win Rate', `${this.statsManager.getWinRate()}%`],
      ['', ''],
      ['Units Spawned', stats.totalUnitsSpawned.toLocaleString()],
      ['Enemies Killed', stats.totalEnemiesKilled.toLocaleString()],
      ['Favorite Unit', this.statsManager.getFavoriteUnit()],
      ['Favorite Age', this.statsManager.getFavoriteAge()],
      ['', ''],
      ['Best Survival Wave', String(stats.bestSurvivalWave)],
      ['Campaign Stars', `${campaign.totalStars} / 90`],
      ['Campaign Missions', `${campaign.missionsCompleted} / ${campaign.totalMissions}`],
      ['', ''],
      ['Total Play Time', this.statsManager.getFormattedPlayTime()],
    ];

    let y = startY + 40;
    for (const [label, value] of lines) {
      if (label === '') {
        y += 10;
        continue;
      }

      this.add.text(cx - 140, y, label, {
        fontSize: '13px', fontFamily: 'monospace', color: '#aaaaaa',
      }).setOrigin(0, 0.5);

      this.add.text(cx + 140, y, value, {
        fontSize: '13px', fontFamily: 'monospace', color: '#ffffff',
      }).setOrigin(1, 0.5);

      y += 28;
    }
  }

  private renderAchievements(cx: number, startY: number): void {
    const achievements = this.achievementManager.getAll();

    this.add.text(cx, startY, 'Achievements', {
      fontSize: '22px', fontFamily: 'monospace', color: '#ffd700', fontStyle: 'bold',
    }).setOrigin(0.5);

    const unlockedCount = achievements.filter((a: AchievementState) => a.unlocked).length;
    this.add.text(cx, startY + 28, `${unlockedCount} / ${achievements.length} unlocked`, {
      fontSize: '12px', fontFamily: 'monospace', color: '#888888',
    }).setOrigin(0.5);

    // List achievements (scrollable via clipping)
    let y = startY + 56;
    const maxVisible = 16;

    for (let i = 0; i < Math.min(achievements.length, maxVisible); i++) {
      const ach = achievements[i];
      const icon = ach.unlocked ? '*' : '?';
      const color = ach.unlocked ? '#44ff44' : '#555555';

      this.add.text(cx - 200, y, icon, {
        fontSize: '16px', fontFamily: 'monospace', color: ach.unlocked ? '#ffd700' : '#444444',
        fontStyle: 'bold',
      }).setOrigin(0, 0.5);

      this.add.text(cx - 180, y, ach.config.name, {
        fontSize: '12px', fontFamily: 'monospace', color,
      }).setOrigin(0, 0.5);

      if (ach.unlocked) {
        this.add.text(cx + 200, y, ach.config.description, {
          fontSize: '10px', fontFamily: 'monospace', color: '#888888',
        }).setOrigin(1, 0.5);
      } else {
        this.add.text(cx + 200, y, 'Locked', {
          fontSize: '10px', fontFamily: 'monospace', color: '#444444',
        }).setOrigin(1, 0.5);
      }

      y += 30;
    }

    if (achievements.length > maxVisible) {
      this.add.text(cx, y, `... and ${achievements.length - maxVisible} more`, {
        fontSize: '11px', fontFamily: 'monospace', color: '#666666',
      }).setOrigin(0.5);
    }
  }
}
