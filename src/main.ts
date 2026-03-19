import Phaser from 'phaser';
import { MainMenuScene } from './scenes/MainMenuScene';
import { GameScene } from './scenes/GameScene';
import { HUD } from './ui/HUD';

/**
 * Lazy-load scene helper: dynamically imports a scene module and registers it
 * with the Phaser game instance once loaded.
 */
function lazyScene(
  game: Phaser.Game,
  key: string,
  loader: () => Promise<{ default?: new () => Phaser.Scene; [k: string]: unknown }>,
  exportName: string,
): void {
  // We register a tiny placeholder scene that, when started, loads the real one.
  class Placeholder extends Phaser.Scene {
    private sceneData?: Record<string, unknown>;
    constructor() { super({ key }); }
    init(data?: Record<string, unknown>) { this.sceneData = data; }
    create() {
      loader().then((mod) => {
        const SceneClass = (mod as Record<string, unknown>)[exportName] as new () => Phaser.Scene;
        game.scene.remove(key);
        game.scene.add(key, SceneClass, true, this.sceneData);
      });
    }
  }
  game.scene.add(key, Placeholder, false);
}

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
  // Only include scenes needed at startup — the rest are lazy-loaded below.
  scene: [
    MainMenuScene,
    GameScene,
    HUD,
  ],
};

const game = new Phaser.Game(config);

// ── Lazy-loaded scenes (split into separate chunks by Vite) ──
lazyScene(game, 'CampaignMapScene',
  () => import('./scenes/CampaignMapScene'), 'CampaignMapScene');
lazyScene(game, 'SurvivalScene',
  () => import('./scenes/SurvivalScene'), 'SurvivalScene');
lazyScene(game, 'SandboxScene',
  () => import('./scenes/SandboxScene'), 'SandboxScene');
lazyScene(game, 'TutorialScene',
  () => import('./scenes/TutorialScene'), 'TutorialScene');
lazyScene(game, 'SettingsScene',
  () => import('./scenes/SettingsScene'), 'SettingsScene');
lazyScene(game, 'ProfileScene',
  () => import('./scenes/ProfileScene'), 'ProfileScene');
lazyScene(game, 'MultiplayerMenuScene',
  () => import('./scenes/MultiplayerMenuScene'), 'MultiplayerMenuScene');
lazyScene(game, 'MultiplayerGameScene',
  () => import('./scenes/MultiplayerGameScene'), 'MultiplayerGameScene');
