import Phaser from 'phaser';
import { CampaignManager, MissionConfig, ContinentConfig } from '../core/managers/CampaignManager';

/**
 * CampaignMapScene -- World map showing 6 continents in a 3x2 grid.
 * Each continent displays its missions as numbered circles.
 * Click a mission to see details and start it.
 */
export class CampaignMapScene extends Phaser.Scene {
  private campaignManager!: CampaignManager;
  private detailPanel: Phaser.GameObjects.Container | null = null;

  constructor() {
    super({ key: 'CampaignMapScene' });
  }

  create(): void {
    this.campaignManager = new CampaignManager();

    const { width, height } = this.scale;
    const cx = width / 2;

    // Background
    this.cameras.main.setBackgroundColor('#0a0a1a');

    // Title
    this.add.text(cx, 30, 'CAMPAIGN', {
      fontSize: '36px',
      fontFamily: 'monospace',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Total stars
    const progress = this.campaignManager.getProgress();
    this.add.text(cx, 65, `Stars: ${progress.totalStars} / ${progress.totalMissions * 3}  |  Missions: ${progress.missionsCompleted} / ${progress.totalMissions}`, {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#aaaacc',
    }).setOrigin(0.5);

    // Draw continents in 3x2 grid
    const continents = this.campaignManager.getContinents();
    const gridCols = 3;
    const gridRows = 2;
    const padX = 40;
    const padY = 100;
    const cellW = (width - padX * 2) / gridCols;
    const cellH = (height - padY - 120) / gridRows;

    for (let i = 0; i < continents.length; i++) {
      const col = i % gridCols;
      const row = Math.floor(i / gridCols);
      const x = padX + col * cellW + cellW / 2;
      const y = padY + row * cellH + cellH / 2;
      this.drawContinent(continents[i], x, y, cellW - 20, cellH - 20);
    }

    // Back button
    const backBtn = this.add.text(60, height - 40, '< Back', {
      fontSize: '18px',
      fontFamily: 'monospace',
      color: '#aaaacc',
      backgroundColor: '#1a1a2e',
      padding: { x: 16, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    backBtn.on('pointerover', () => backBtn.setColor('#ffffff'));
    backBtn.on('pointerout', () => backBtn.setColor('#aaaacc'));
    backBtn.on('pointerdown', () => {
      this.scene.start('MainMenuScene');
    });
  }

  private drawContinent(continent: ContinentConfig, cx: number, cy: number, w: number, h: number): void {
    // Continent background
    const bg = this.add.rectangle(cx, cy, w, h, 0x1a1a2e)
      .setStrokeStyle(2, 0x334466);

    // Continent name
    this.add.text(cx, cy - h / 2 + 16, continent.name, {
      fontSize: '16px',
      fontFamily: 'monospace',
      color: '#88aaff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Age range label
    this.add.text(cx, cy - h / 2 + 34, `Ages ${continent.ageRange[0]}-${continent.ageRange[1]}`, {
      fontSize: '11px',
      fontFamily: 'monospace',
      color: '#666688',
    }).setOrigin(0.5);

    // Mission circles
    const missions = continent.missions;
    const missionStartY = cy - h / 2 + 58;
    const missionSpacing = Math.min(40, (w - 40) / missions.length);
    const missionStartX = cx - ((missions.length - 1) * missionSpacing) / 2;

    for (let i = 0; i < missions.length; i++) {
      const mission = missions[i];
      const mx = missionStartX + i * missionSpacing;
      const my = missionStartY + 10;

      const stars = this.campaignManager.getStars(mission.id);
      const unlocked = this.campaignManager.isUnlocked(mission.id);

      let circleColor: number;
      if (stars >= 3) {
        circleColor = 0xffcc00; // gold for 3-starred
      } else if (stars > 0) {
        circleColor = 0x44ff44; // green for completed
      } else if (unlocked) {
        circleColor = 0x888888; // grey for unlocked but incomplete
      } else {
        circleColor = 0x333344; // dark for locked
      }

      const circle = this.add.circle(mx, my, 14, circleColor)
        .setStrokeStyle(2, 0xffffff, unlocked ? 0.6 : 0.2);

      // Mission number
      this.add.text(mx, my, String(mission.id), {
        fontSize: '11px',
        fontFamily: 'monospace',
        color: unlocked ? '#ffffff' : '#555555',
        fontStyle: 'bold',
      }).setOrigin(0.5);

      // Star indicators below circle
      if (stars > 0) {
        const starStr = '*'.repeat(stars);
        this.add.text(mx, my + 20, starStr, {
          fontSize: '10px',
          fontFamily: 'monospace',
          color: '#ffcc00',
        }).setOrigin(0.5);
      }

      // Mission type icon below
      const typeChar = this.getMissionTypeChar(mission.type);
      this.add.text(mx, my + 32, typeChar, {
        fontSize: '9px',
        fontFamily: 'monospace',
        color: '#666688',
      }).setOrigin(0.5);

      // Interaction
      if (unlocked) {
        circle.setInteractive({ useHandCursor: true });
        circle.on('pointerdown', () => {
          this.showMissionDetail(mission);
        });
        circle.on('pointerover', () => {
          circle.setStrokeStyle(2, 0xffffff, 1);
        });
        circle.on('pointerout', () => {
          circle.setStrokeStyle(2, 0xffffff, 0.6);
        });
      }
    }
  }

  private getMissionTypeChar(type: string): string {
    switch (type) {
      case 'standard': return 'STD';
      case 'defense': return 'DEF';
      case 'rush': return 'RSH';
      case 'puzzle': return 'PZL';
      case 'boss': return 'BOS';
      default: return '???';
    }
  }

  private showMissionDetail(mission: MissionConfig): void {
    // Remove existing detail panel
    if (this.detailPanel) {
      this.detailPanel.destroy();
      this.detailPanel = null;
    }

    const { width, height } = this.scale;
    const panelW = 400;
    const panelH = 340;
    const px = width / 2;
    const py = height / 2;

    this.detailPanel = this.add.container(px, py);

    // Panel background
    const bg = this.add.rectangle(0, 0, panelW, panelH, 0x111122, 0.95)
      .setStrokeStyle(2, 0x4488ff);
    this.detailPanel.add(bg);

    // Title
    const title = this.add.text(0, -panelH / 2 + 25, mission.title, {
      fontSize: '22px',
      fontFamily: 'monospace',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.detailPanel.add(title);

    // Type + difficulty
    const typeText = this.add.text(0, -panelH / 2 + 52, `${mission.type.toUpperCase()} | ${mission.difficulty.toUpperCase()}`, {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: '#88aacc',
    }).setOrigin(0.5);
    this.detailPanel.add(typeText);

    // Description
    const desc = this.add.text(0, -panelH / 2 + 85, mission.description, {
      fontSize: '13px',
      fontFamily: 'monospace',
      color: '#cccccc',
      wordWrap: { width: panelW - 40 },
      align: 'center',
    }).setOrigin(0.5);
    this.detailPanel.add(desc);

    // Modifiers
    if (mission.modifiers.length > 0) {
      const modText = this.add.text(0, -panelH / 2 + 130, `Modifiers: ${mission.modifiers.join(', ')}`, {
        fontSize: '11px',
        fontFamily: 'monospace',
        color: '#ff8844',
        wordWrap: { width: panelW - 40 },
        align: 'center',
      }).setOrigin(0.5);
      this.detailPanel.add(modText);
    }

    // Star thresholds
    const starInfo = this.add.text(0, -panelH / 2 + 160, `3 Stars: < ${mission.starThresholds.time}s, HP > ${mission.starThresholds.hpPercent}%`, {
      fontSize: '11px',
      fontFamily: 'monospace',
      color: '#ffcc00',
    }).setOrigin(0.5);
    this.detailPanel.add(starInfo);

    // Current stars
    const currentStars = this.campaignManager.getStars(mission.id);
    const starsDisplay = this.add.text(0, -panelH / 2 + 185, `Current: ${'*'.repeat(currentStars)}${'o'.repeat(3 - currentStars)}`, {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#ffcc00',
    }).setOrigin(0.5);
    this.detailPanel.add(starsDisplay);

    // Rewards
    const rewardText = `Rewards: ${mission.rewards.coins} coins${mission.rewards.unlock ? ' + ' + mission.rewards.unlock : ''}`;
    const rewards = this.add.text(0, -panelH / 2 + 210, rewardText, {
      fontSize: '11px',
      fontFamily: 'monospace',
      color: '#44ff44',
    }).setOrigin(0.5);
    this.detailPanel.add(rewards);

    // Start button
    const startBtn = this.add.text(0, panelH / 2 - 70, 'START MISSION', {
      fontSize: '18px',
      fontFamily: 'monospace',
      color: '#ffffff',
      backgroundColor: '#2244aa',
      padding: { x: 30, y: 10 },
      fontStyle: 'bold',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    this.detailPanel.add(startBtn);

    startBtn.on('pointerover', () => startBtn.setBackgroundColor('#3366cc'));
    startBtn.on('pointerout', () => startBtn.setBackgroundColor('#2244aa'));
    startBtn.on('pointerdown', () => {
      this.scene.start('GameScene', {
        mode: 'campaign',
        missionId: mission.id,
        difficulty: mission.difficulty === 'easy' ? 'easy' : mission.difficulty === 'hard' ? 'hard' : 'normal',
      });
    });

    // Close button
    const closeBtn = this.add.text(0, panelH / 2 - 30, 'Close', {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#aaaacc',
      backgroundColor: '#1a1a2e',
      padding: { x: 20, y: 6 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    this.detailPanel.add(closeBtn);

    closeBtn.on('pointerdown', () => {
      if (this.detailPanel) {
        this.detailPanel.destroy();
        this.detailPanel = null;
      }
    });

    this.detailPanel.setDepth(100);
  }
}
