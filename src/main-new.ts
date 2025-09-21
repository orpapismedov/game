import Phaser from 'phaser';
import { gameConfig } from './phaser-config-new';

// Import scenes
import { BootScene } from './scenes/BootScene';
import { PreloadScene } from './scenes/PreloadScene';
import { Level1 } from './scenes/Level1';
import { HUDScene } from './scenes/HUDScene';

// Add scenes to config
gameConfig.scene = [BootScene, PreloadScene, Level1, HUDScene];

// Fix gravity config
if (gameConfig.physics && gameConfig.physics.arcade) {
  gameConfig.physics.arcade.gravity = { x: 0, y: 1800 };
}

// Create and start the game
class Game extends Phaser.Game {
  constructor() {
    super(gameConfig);
    
    // Dispatch game ready event
    this.events.once('ready', () => {
      window.dispatchEvent(new CustomEvent('gameready'));
    });
  }
}

// Initialize the game
new Game();