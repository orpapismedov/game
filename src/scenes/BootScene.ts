import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  init() {
    // Detect mobile device
    const isMobile = this.sys.game.device.os.android || 
                     this.sys.game.device.os.iOS || 
                     this.sys.game.device.os.windowsPhone ||
                     /Mobi|Android/i.test(navigator.userAgent);
    
    console.log('BootScene - Mobile detection:', {
      android: this.sys.game.device.os.android,
      iOS: this.sys.game.device.os.iOS,
      windowsPhone: this.sys.game.device.os.windowsPhone,
      userAgent: navigator.userAgent,
      regex: /Mobi|Android/i.test(navigator.userAgent),
      finalResult: isMobile
    });
    
    // Store device info globally
    this.registry.set('isMobile', isMobile);
    this.registry.set('devicePixelRatio', window.devicePixelRatio || 1);
    
    // Initialize global game state if not already present
    if (!this.registry.get('gameState')) {
      const initialState = {
        score: 0,
        health: 3,
        maxHealth: 3,
        level: 1,
        lives: 3,
        time: 0,
        isPaused: false,
        isMuted: false
      };
      this.registry.set('gameState', initialState);
      console.log('[BootScene] Initialized gameState', initialState);
    }
    
    console.log('Device detected:', isMobile ? 'Mobile' : 'Desktop');
  }

  create() {
    // Configure input
    if (this.input && (this.input as any).setMaxPointers) {
      (this.input as any).setMaxPointers(3);
    }
    
    // Add background
    this.add.rectangle(640, 360, 1280, 720, 0x0e1116);
    this.add.text(640, 360, 'Doggo Run', {
      fontSize: '48px',
      color: '#ffffff',
      fontFamily: 'Arial'
    }).setOrigin(0.5);
    
    // Start preload scene after brief delay
    this.time.delayedCall(1000, () => {
      this.scene.start('PreloadScene');
    });
  }
}