import Phaser from 'phaser';
import { InputState } from '../input/InputController';

export class Player extends Phaser.Physics.Arcade.Sprite {
  private jumpVelocity = 900; // increased for higher jumps
  private maxJumpHoldMs = 150;
  private jumping = false;
  private jumpHoldTimer = 0;
  private facingDirection = 1; // 1 = right, -1 = left

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'dog');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    // Scale up 2.5x from previous small size (0.15 * 2.5 = 0.375)
    this.setScale(0.375);
    
    this.setCollideWorldBounds(true);
    this.setBounce(0); // ensure no perpetual bounce
    if (this.body instanceof Phaser.Physics.Arcade.Body) {
      // SIMPLIFIED: Use default physics body without custom sizing for testing
      console.log('[Player] Using simplified physics body (no custom sizing)');
      // this.body.setSize(bodyWidth, bodyHeight);
      // this.body.setOffset((this.displayWidth - bodyWidth) / 2, (this.displayHeight - bodyHeight) / 2);
    }
  }

  private isGrounded(): boolean {
    const b = this.body as Phaser.Physics.Arcade.Body;
    const grounded = !!b && (b.blocked.down || b.touching.down);
    
    // Simplified debug - only log if actually grounded
    if (grounded) {
      console.log('[Player] GROUNDED - blocked:', b.blocked.down, 'touching:', b.touching.down);
    }
    
    return grounded;
  }

  public updateMovement(time: number, delta: number, input: InputState) {
    if (!(this.body instanceof Phaser.Physics.Arcade.Body)) return;
    const body = this.body as Phaser.Physics.Arcade.Body;
    const speed = 210;
    
    // Debug: Track velocity changes
    const prevVy = body.velocity.y;
    
    // Movement with facing direction tracking
    if (input.left && !input.right) {
      body.setVelocityX(-speed);
      this.facingDirection = -1;
      this.setFlipX(true);
    } else if (input.right && !input.left) {
      body.setVelocityX(speed);
      this.facingDirection = 1;
      this.setFlipX(false);
    } else {
      body.setVelocityX(0);
    }

    if (input.jumpPressed && this.isGrounded()) {
      console.log('[Player] JUMP LOGIC TRIGGERED');
      body.setVelocityY(-this.jumpVelocity);
      this.jumping = true;
      this.jumpHoldTimer = 0;
    }
    if (this.jumping) {
      this.jumpHoldTimer += delta;
      if (!input.jumpHeld || this.jumpHoldTimer > this.maxJumpHoldMs) {
        console.log('[Player] ENDING JUMP - jumpHeld:', input.jumpHeld, 'timer:', this.jumpHoldTimer);
        this.jumping = false;
      }
    }
    if (this.isGrounded()) {
      if (this.jumping) {
        console.log('[Player] GROUNDED - clearing jump flag');
      }
      this.jumping = false;
    }
    
    // Handle attack input
    if (input.attackPressed) {
      this.attack();
    }
    
    // Debug: Report unexpected velocity changes
    const newVy = body.velocity.y;
    if (Math.abs(newVy - prevVy) > 50 && !input.jumpPressed) {
      console.log('[Player] Unexpected velocity change:', {
        prev: prevVy,
        new: newVy,
        diff: newVy - prevVy,
        grounded: this.isGrounded(),
        jumpPressed: input.jumpPressed,
        position: { x: this.x, y: this.y }
      });
    }
  }

  // Legacy methods below retained only if referenced elsewhere; could be removed if unused.

  private setupAnimations() {}
  private createShadow() {}
  private startIdleAnimation() {}

  private startRunAnimation() {}

  private startFallAnimation() {}

  private resetAnimation() {}

  // Movement methods
  moveLeft() {}
  moveRight() {}
  stopX() {}

  jump() {}

  attack() {
    // Create horizontal beam in facing direction
    const beamLength = 200;
    const beamHeight = 8;
    const startX = this.x + (this.facingDirection * this.displayWidth / 2);
    const beamX = startX + (this.facingDirection * beamLength / 2);
    
    const beam = this.scene.add.rectangle(beamX, this.y, beamLength, beamHeight, 0xffff00, 0.8);
    beam.setData('damage', 1);
    beam.setData('fromPlayer', true);
    
    // Brief flicker effect
    this.scene.tweens.add({
      targets: beam,
      alpha: { from: 0.8, to: 0.2 },
      duration: 100,
      yoyo: true,
      repeat: 2,
      onComplete: () => beam.destroy()
    });
    
    // Manual collision check with enemies
    const levelScene = this.scene.scene?.get?.('Level1') || this.scene.scene?.get?.('Level2') || this.scene;
    if ((levelScene as any).enemies) {
      (levelScene as any).enemies.children.each((enemy: any) => {
        if (!enemy || !enemy.active || !enemy.getBounds) return;
        const eb = enemy.getBounds();
        const bb = beam.getBounds();
        if (Phaser.Geom.Intersects.RectangleToRectangle(eb, bb)) {
          if (enemy.takeDamage) enemy.takeDamage(1);
        }
      });
    }
  }

  takeHit(_damage: number = 1) {}

  private die() {}

  isOnGround(): boolean { return this.isGrounded(); }

  getHealth(): number { return 3; }

  getMaxHealth(): number { return 3; }

  getAttackBox(): Phaser.Physics.Arcade.Sprite | undefined { return undefined; }

  bounce() {}

  update() {}

  destroy() { super.destroy(); }
}