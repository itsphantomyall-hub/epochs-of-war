import Phaser from 'phaser';
import { MainMenuScene } from './scenes/MainMenuScene';
import { GameScene } from './scenes/GameScene';
import { CampaignMapScene } from './scenes/CampaignMapScene';
import { SurvivalScene } from './scenes/SurvivalScene';
import { SandboxScene } from './scenes/SandboxScene';
import { HUD } from './ui/HUD';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: 1280,
  height: 720,
  backgroundColor: '#0a0a1a',
  pixelArt: true,
  roundPixels: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [MainMenuScene, GameScene, CampaignMapScene, SurvivalScene, SandboxScene, HUD],
};

new Phaser.Game(config);
