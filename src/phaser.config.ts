import Phaser from 'phaser';

export const gameConfig: Phaser.Types.Core.GameConfig = {
  title: 'Doggo Run',
  version: '1.0.0',
  width: 1280,
  height: 720,
  type: Phaser.AUTO,
  parent: 'game-container',
  // Dark neutral background (overdrawn by scenes but keeps flashes consistent)
  backgroundColor: '#0e1116',
  
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1280,
    height: 720,
    min: {
      width: 320,
      height: 180
    },
    max: {
      width: 2560,
      height: 1440
    }
  },
  
  physics: {
    default: 'arcade',
    arcade: {
  // Stronger gravity for snappier platforming feel
  gravity: { y: 1800, x: 0 },
      debug: false, // Set to true for development
      tileBias: 16
    }
  },
  
  render: {
    antialias: false,
    pixelArt: true,
    roundPixels: true,
    powerPreference: 'high-performance'
  },
  
  input: {
    keyboard: true,
    mouse: true,
    touch: true,
    gamepad: false
  },
  
  audio: {
    disableWebAudio: false
  },
  
  fps: {
    target: 60,
    forceSetTimeOut: true,
    deltaHistory: 10,
    panicMax: 0,
    smoothStep: true
  },
  
  loader: {
    crossOrigin: 'anonymous'
  },
  
  dom: {
    createContainer: true
  }
};