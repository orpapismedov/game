import Phaser from 'phaser';
// @ts-ignore
import { TouchControls } from '../ui/TouchControls';
import { GameState } from '../types/global';

export class HUDScene extends Phaser.Scene {
  private gameState!: GameState;
  private healthHearts!: Phaser.GameObjects.Image[];
  private scoreText!: Phaser.GameObjects.Text;
  private pauseButton!: Phaser.GameObjects.Image;
  private fullscreenButton!: Phaser.GameObjects.Image;
  public touchControls!: TouchControls;
  
  private pauseOverlay!: Phaser.GameObjects.Container;
  private isPauseVisible: boolean = false;

  constructor() {
    super({ key: 'HUDScene' });
  }

  create(): void {
    this.gameState = this.registry.get('gameState');
    
    this.createUI();
    this.createTouchControls();
    this.createPauseOverlay();
    this.setupEventListeners();
  }

  update(): void {
    this.updateUI();
  }

  private createUI(): void {
    const { width, height } = this.scale.gameSize;
    
    // Health hearts (top-left)
    this.healthHearts = [];
    for (let i = 0; i < this.gameState.maxHealth; i++) {
      const heart = this.createHeartSprite(50 + i * 40, 50);
      this.healthHearts.push(heart);
    }
    
    // Score (top-right)
    this.scoreText = this.add.text(width - 50, 50, `Score: ${this.gameState.score}`, {
      fontSize: '32px',
      color: '#FFD700',
      fontFamily: 'Arial, sans-serif',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(1, 0);
    
    // Control buttons (top-right area)
    this.pauseButton = this.createControlButton(width - 150, 100, '⏸️', () => {
      this.togglePause();
    });
    this.fullscreenButton = this.createControlButton(width - 100, 100, '⛶', () => {
      this.toggleFullscreen();
    });
  }

  private createHeartSprite(x: number, y: number): Phaser.GameObjects.Image {
    // Create heart using graphics since we don't have heart image
    const graphics = this.add.graphics();
    graphics.fillStyle(0xFF0000);
    
    // Simple heart shape using circles
    graphics.fillCircle(-8, -4, 8);
    graphics.fillCircle(8, -4, 8);
    graphics.fillTriangle(-12, 4, 12, 4, 0, 16);
    
    graphics.generateTexture('heart', 24, 20);
    graphics.destroy();
    
    return this.add.image(x, y, 'heart').setScale(1.5);
  }

  private createControlButton(
    x: number, 
    y: number, 
    text: string, 
    callback: () => void
  ): Phaser.GameObjects.Image {
    // Create button background
    const graphics = this.add.graphics();
    graphics.fillStyle(0x333333, 0.8);
    graphics.fillRoundedRect(-20, -20, 40, 40, 8);
    graphics.generateTexture('button-bg', 40, 40);
    graphics.destroy();
    
    const button = this.add.image(x, y, 'button-bg')
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', callback)
      .on('pointerover', () => button.setTint(0xCCCCCC))
      .on('pointerout', () => button.clearTint());
    
    // Add button text
    this.add.text(x, y, text, {
      fontSize: '20px',
      color: '#FFFFFF',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5);
    
    return button;
  }

  private createTouchControls(): void {
    // Only create touch controls on mobile devices
    const isMobile = this.registry.get('isMobile');
    console.log('HUDScene - isMobile detection:', isMobile);
    if (isMobile) {
      console.log('HUDScene - Creating TouchControls');
      this.touchControls = new TouchControls(this);
    } else {
      console.log('HUDScene - Skipping TouchControls creation (desktop)');
    }
  }

  private createPauseOverlay(): void {
    const { width, height } = this.scale.gameSize;
    
    this.pauseOverlay = this.add.container(0, 0);
    
    // Semi-transparent background
    const bg = this.add.rectangle(0, 0, width, height, 0x000000, 0.7);
    bg.setOrigin(0, 0);
    
    // Pause menu
    const menuBg = this.add.rectangle(width / 2, height / 2, 400, 300, 0x333333, 0.9);
    menuBg.setStrokeStyle(4, 0xFFFFFF);
    
    const pauseTitle = this.add.text(width / 2, height / 2 - 80, 'PAUSED', {
      fontSize: '48px',
      color: '#FFFFFF',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5);
    
    // Resume button
    const resumeBtn = this.add.text(width / 2, height / 2 - 20, 'RESUME', {
      fontSize: '32px',
      color: '#00FF00',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.togglePause())
      .on('pointerover', () => resumeBtn.setStyle({ color: '#CCFFCC' }))
      .on('pointerout', () => resumeBtn.setStyle({ color: '#00FF00' }));
    
    // Restart button
    const restartBtn = this.add.text(width / 2, height / 2 + 20, 'RESTART', {
      fontSize: '32px',
      color: '#FFFF00',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.restartGame())
      .on('pointerover', () => restartBtn.setStyle({ color: '#FFFFCC' }))
      .on('pointerout', () => restartBtn.setStyle({ color: '#FFFF00' }));
    
    this.pauseOverlay.add([bg, menuBg, pauseTitle, resumeBtn, restartBtn]);
    this.pauseOverlay.setVisible(false);
  }

  private setupEventListeners(): void {
    // Listen for game state changes
    this.registry.events.on('changedata-gameState', () => {
      this.gameState = this.registry.get('gameState');
    });
    
    // Handle window resize for responsive UI
    this.scale.on('resize', this.handleResize, this);
  }

  private updateUI(): void {
    // Update health hearts
    this.healthHearts.forEach((heart, index) => {
      heart.setVisible(index < this.gameState.health);
      heart.setAlpha(index < this.gameState.health ? 1 : 0.15);
    });
    
    // Update score
    this.scoreText.setText(`Score: ${this.gameState.score}`);
    
  // (Timer removed by request)
    
    // Update pause overlay visibility
    this.pauseOverlay.setVisible(this.gameState.isPaused);
  }

  private updateMuteButton(): void {
    // Mute button removed (noop)
  }

  private togglePause(): void {
    this.gameState.isPaused = !this.gameState.isPaused;
    this.registry.set('gameState', this.gameState);
    
    // Get Level1 scene and toggle physics
    const level1Scene = this.scene.get('Level1');
    if (level1Scene) {
      if (this.gameState.isPaused) {
        level1Scene.physics.pause();
        level1Scene.sound.pauseAll();
      } else {
        level1Scene.physics.resume();
        level1Scene.sound.resumeAll();
      }
    }
  }

  private toggleMute(): void {
    // Removed; no action.
  }

  private toggleFullscreen(): void {
    if (this.scale.isFullscreen) {
      this.scale.stopFullscreen();
    } else {
      this.scale.startFullscreen();
    }
  }

  private restartGame(): void {
    // Full reset including level
    this.gameState = {
      ...this.gameState,
      isPaused: false,
      score: 0,
      health: this.gameState.maxHealth,
      time: 0,
      level: 1
    } as any;
    this.registry.set('gameState', this.gameState);
    // Stop any existing gameplay scenes and restart Level1 fresh
    if (this.scene.isActive('Level2')) this.scene.stop('Level2');
    if (this.scene.isActive('Level1')) this.scene.stop('Level1');
    this.scene.launch('Level1');
    // Hide overlay
    this.gameState.isPaused = false;
    this.pauseOverlay.setVisible(false);
  }

  private handleResize(): void {
    // Update UI positions on resize
    const { width, height } = this.scale.gameSize;
    
    // Reposition UI elements
    this.scoreText.setPosition(width - 50, 50);
  this.pauseButton.setPosition(width - 150, 100);
  this.fullscreenButton.setPosition(width - 100, 100);
    
    // Update touch controls if they exist
    if (this.touchControls) {
      this.touchControls.updateLayout();
    }
  }
}