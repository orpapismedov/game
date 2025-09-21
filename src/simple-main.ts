import Phaser from 'phaser';

// Simple test scene
class TestScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TestScene' });
  }

  preload() {
    // Create simple colored rectangles for testing
    this.add.graphics()
      .fillStyle(0x8B4513)
      .fillRect(0, 0, 32, 32);
    this.textures.generate('player', { data: ['1'], pixelWidth: 32, pixelHeight: 32 });
    
    this.add.graphics()
      .fillStyle(0x00FF00)
      .fillRect(0, 0, 400, 32);
    this.textures.generate('ground', { data: ['1'], pixelWidth: 400, pixelHeight: 32 });
  }

  create() {
    this.add.text(10, 10, 'Doggo Run - Simple Test', { fontSize: '24px', fill: '#000' });
    this.add.text(10, 50, 'Game is working! Use arrow keys to move.', { fontSize: '16px', fill: '#000' });
    
    // Create platforms
    const platforms = this.physics.add.staticGroup();
    platforms.create(400, 568, 'ground').setScale(2, 1).refreshBody();
    platforms.create(400, 400, 'ground');
    
    // Create player
    const player = this.physics.add.sprite(100, 450, 'player');
    player.setBounce(0.2);
    player.setCollideWorldBounds(true);
    player.setTint(0xFF6B6B);
    
    this.physics.add.collider(player, platforms);
    const cursors = this.input.keyboard.createCursorKeys();
    
    // Store for update
    this.player = player;
    this.cursors = cursors;
  }

  update() {
    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-160);
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(160);
    } else {
      this.player.setVelocityX(0);
    }
    
    if (this.cursors.up.isDown && this.player.body.touching.down) {
      this.player.setVelocityY(-500);
    }
  }
}

// Simple game config
const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: '#87CEEB',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 800 },
      debug: false
    }
  },
  scene: TestScene
};

// Start the game
new Phaser.Game(config);