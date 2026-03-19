import Phaser from 'phaser';

// Placeholder — agents will build the real scenes
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
  scene: {
    preload() {
      // Agents will implement asset loading
    },
    create() {
      this.add.text(640, 340, 'EPOCHS OF WAR', {
        fontSize: '48px',
        color: '#ffffff',
        fontFamily: 'monospace',
      }).setOrigin(0.5);
      this.add.text(640, 400, 'Project scaffold ready — agents building...', {
        fontSize: '16px',
        color: '#666688',
        fontFamily: 'monospace',
      }).setOrigin(0.5);
    },
  },
};

new Phaser.Game(config);
