import Phaser from 'phaser';
import { gameConfig } from './phaser.config';

// Import scenes
import { BootScene } from './scenes/BootScene';
import { PreloadScene } from './scenes/PreloadScene';
import { Level1 } from './scenes/Level1';
import { Level2 } from './scenes/Level2';
import { HUDScene } from './scenes/HUDScene';

// Add scenes to config
gameConfig.scene = [BootScene, PreloadScene, Level1, Level2, HUDScene];

// Create and start the game
class Game extends Phaser.Game {
  constructor() {
    super(gameConfig);
    
    // Handle visibility change for mobile performance
    this.handleVisibilityChange();
  }
  
  private handleVisibilityChange(): void {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.sound.pauseAll();
  this.scene.pause('Level1');
  this.scene.pause('Level2');
        this.scene.pause('HUDScene');
      } else {
        this.sound.resumeAll();
  this.scene.resume('Level1');
  this.scene.resume('Level2');
        this.scene.resume('HUDScene');
      }
    });
  }
}

// Initialize the game when DOM is ready
window.addEventListener('load', () => {
  new Game();
  // Dispatch event to hide HTML loading overlay once Phaser instance exists
  window.dispatchEvent(new CustomEvent('gameready'));
});