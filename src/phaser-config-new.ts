import Phaser from 'phaser';

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  parent: 'game',
  backgroundColor: '#0e1116',
  
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1280,
    height: 720
  },
  
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 1800 },
      debug: false
    }
  },
  
  input: {
    activePointers: 3
  },
  
  audio: {
    disableWebAudio: false
  },
  
  render: {
    antialias: false,
    pixelArt: true
  }
};