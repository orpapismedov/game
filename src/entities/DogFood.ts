import Phaser from 'phaser';

export class DogFood extends Phaser.Physics.Arcade.Sprite {
  private isCollected: boolean = false;
  private floatTween?: Phaser.Tweens.Tween;
  private rotateTween?: Phaser.Tweens.Tween;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'dogfood');
    
  // Uniform scale down (drastically smaller collectible for better scale contrast)
  this.setScale(0.12); // was 0.25
    
    this.setupPhysics();
    this.setupAnimations();
    
    scene.add.existing(this);
    scene.physics.add.existing(this);
  }

  update(time: number, delta: number): void {
    if (this.isCollected) return;
    
    // Additional floating animation could be added here
    // The main animation is handled by tweens
  }

  private setupPhysics(): void {
    // Make collectible static (no gravity)
    if (this.body) {
      this.body.immovable = true;
      // Recalculate after scaling
      const bw = this.displayWidth * 0.6;
      const bh = this.displayHeight * 0.6;
      this.body.setSize(bw, bh);
      this.body.setOffset((this.displayWidth - bw)/2, (this.displayHeight - bh)/2);
      
      // Explicitly disable gravity
      (this.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    }
  }

  private setupAnimations(): void {
    // Spin only (constant size)
    this.rotateTween = this.scene.tweens.add({
      targets: this,
      angle: 360,
      duration: 4000,
      repeat: -1,
      ease: 'Linear'
    });
  }

  public collect(): void {
    if (this.isCollected) return;
    
    this.isCollected = true;
    
    // Stop existing animations
    if (this.floatTween) {
      this.floatTween.destroy();
    }
    if (this.rotateTween) {
      this.rotateTween.destroy();
    }
    
    // Collection animation - zoom out and fade
    this.scene.tweens.add({
      targets: this,
      scaleX: 0,
      scaleY: 0,
      alpha: 0,
      angle: this.angle + 360,
      duration: 300,
      ease: 'Power2',
      onComplete: () => this.destroy()
    });
    
    // Create sparkle effect
    this.createSparkleEffect();
    
    // Disable physics body
    if (this.body) {
      this.body.enable = false;
    }
  }

  private createSparkleEffect(): void {
    // Create simple particle effect using graphics
    for (let i = 0; i < 6; i++) {
      const sparkle = this.scene.add.graphics();
      sparkle.fillStyle(0xFFD700);
      sparkle.fillCircle(0, 0, 3);
      sparkle.setPosition(this.x, this.y);
      
      // Random direction for sparkles
      const angle = (Math.PI * 2 * i) / 6;
      const distance = 30 + Math.random() * 20;
      const targetX = this.x + Math.cos(angle) * distance;
      const targetY = this.y + Math.sin(angle) * distance;
      
      this.scene.tweens.add({
        targets: sparkle,
        x: targetX,
        y: targetY,
        alpha: 0,
        scale: 0.5,
        duration: 400 + Math.random() * 200,
        ease: 'Power2',
        onComplete: () => {
          sparkle.destroy();
        }
      });
    }
  }

  destroy(): void {
    // Clean up tweens
    if (this.floatTween) {
      this.floatTween.destroy();
    }
    if (this.rotateTween) {
      this.rotateTween.destroy();
    }
    
    // Clean up any other tweens targeting this object
    this.scene.tweens.killTweensOf(this);
    
    super.destroy();
  }
}