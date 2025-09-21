import Phaser from 'phaser';
import { EnemyType } from '../types/global';

export class EnemyDog extends Phaser.Physics.Arcade.Sprite {
  private enemyType!: EnemyType;
  private aiState: 'idle' | 'patrol' | 'chase' | 'jump' | 'dead' = 'patrol';
  private patrolStartX: number;
  private patrolDirection: number = 1;
  private aggroTarget?: Phaser.Physics.Arcade.Sprite;
  private lastJumpTime: number = 0;
  private jumpCooldown: number = 2000;
  private health!: number;
  private stationary: boolean = false; // when true acts like an obstacle
  
  // AI timers
  private stateTimer: number = 0;
  private directionChangeTimer: number = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, type: EnemyType['type']) {
    const spriteKey = `enemy${['walker', 'jumper', 'chaser', 'tank'].indexOf(type) + 1}`;
    super(scene, x, y, spriteKey);

    this.patrolStartX = x;

    // IMPORTANT: Add to scene & enable physics BEFORE configuring physics-dependent properties.
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setupEnemyType(type);
  // Unified smaller scale for all enemies (drastically reduced)
  const baseScale = 0.09; // was 0.18
    this.setScale(baseScale);
    this.setupPhysics();
    this.setupAnimations();
  }

  update(time: number, delta: number, player?: Phaser.Physics.Arcade.Sprite): void {
    if (this.aiState === 'dead') return;
    
    this.stateTimer += delta;
    this.directionChangeTimer += delta;
    
    // Check for player in aggro range for chaser type
    if (this.enemyType.type === 'chaser' && player) {
      this.checkAggro(player);
    }
    
    // Execute AI behavior based on type
    switch (this.enemyType.type) {
      case 'walker':
        this.walkerAI();
        break;
      case 'jumper':
        this.jumperAI(time);
        break;
      case 'chaser':
        this.chaserAI(player);
        break;
      case 'tank':
        this.tankAI();
        break;
    }
    
    this.updateAnimations();
  }

  private setupEnemyType(type: EnemyType['type']): void {
    switch (type) {
      case 'walker':
        this.enemyType = {
          type: 'walker',
          health: 1,
          speed: 15, // reduced from 60
          damage: 1,
          points: 10,
          patrolRange: 150
        };
        break;
      case 'jumper':
        this.enemyType = {
          type: 'jumper',
          health: 1,
          speed: 12, // reduced from 40
          damage: 1,
          points: 15,
          patrolRange: 100
        };
        break;
      case 'chaser':
        this.enemyType = {
          type: 'chaser',
          health: 1,
          speed: 25, // reduced from 120
          damage: 1,
          points: 20,
          aggroRange: 200,
          patrolRange: 100
        };
        break;
      case 'tank':
        this.enemyType = {
          type: 'tank',
          health: 2,
          speed: 8, // reduced from 30
          damage: 2,
          points: 30,
          patrolRange: 80
        };
  this.setTint(0x888888); // Darker tint for tank (no size difference now)
        break;
    }
    
    this.health = this.enemyType.health;
  }

  private setupPhysics(): void {
    // Guard in case physics body failed to attach
    if (!(this.body instanceof Phaser.Physics.Arcade.Body)) {
      console.warn('[EnemyDog] Physics body missing during setup; retrying attach.');
      this.scene.physics.add.existing(this);
    }

    this.setCollideWorldBounds(true);
    this.setBounce(0.1, 0);
    this.setDragX(200);

    // Adjust hitbox after scale (use display size for clarity)
  const w = this.displayWidth;
  const h = this.displayHeight;
  // Tighten hitbox slightly more due to reduced sprite size
  this.setSize(w * 0.8, h * 0.9);
  this.setOffset(w * 0.1, h * 0.1);
  }

  private setupAnimations(): void {
    // Subtle vertical bob without size change
    this.scene.tweens.add({
      targets: this,
      y: this.y - (this.displayHeight * 0.05),
      duration: 1400 + Math.random() * 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  private walkerAI(): void {
    if (this.stationary) {
      this.setVelocityX(0);
      return;
    }
    // Simple back and forth patrol
    const distanceFromStart = Math.abs(this.x - this.patrolStartX);
    
    // Change direction if reached patrol range or hit obstacle
    if (distanceFromStart > this.enemyType.patrolRange! || 
        (this.body && (this.body.blocked.left || this.body.blocked.right)) ||
        this.directionChangeTimer > 3000) {
      this.patrolDirection *= -1;
      this.directionChangeTimer = 0;
    }
    
    // Check for ledges (stop before falling)
    if (this.checkForLedge()) {
      this.patrolDirection *= -1;
      this.directionChangeTimer = 0;
    }
    
    // Move in patrol direction
    this.setVelocityX(this.enemyType.speed * this.patrolDirection);
    this.setFlipX(this.patrolDirection < 0);
  }

  private jumperAI(time: number): void {
    // Patrol like walker but with periodic jumps
    this.walkerAI();
    
    // Jump periodically
    if (time - this.lastJumpTime > this.jumpCooldown && this.body && this.body.touching.down) {
      this.setVelocityY(-250);
      this.lastJumpTime = time;
      this.jumpCooldown = 1500 + Math.random() * 2000; // Random jump timing
    }
  }

  private chaserAI(player?: Phaser.Physics.Arcade.Sprite): void {
    if (this.stationary) {
      this.setVelocityX(0);
      return;
    }
    if (this.aiState === 'chase' && player) {
      // Chase the player
      const direction = player.x > this.x ? 1 : -1;
      this.setVelocityX(this.enemyType.speed * direction);
      this.setFlipX(direction < 0);
      
      // Jump if player is above
      if (player.y < this.y - 50 && this.body && this.body.touching.down) {
        this.setVelocityY(-300);
      }
    } else {
      // Default patrol behavior
      this.walkerAI();
    }
  }

  private tankAI(): void {
    if (this.stationary) {
      this.setVelocityX(0);
      return;
    }
    // Slower, more deliberate movement
    const distanceFromStart = Math.abs(this.x - this.patrolStartX);
    
    if (distanceFromStart > this.enemyType.patrolRange! || 
        (this.body && (this.body.blocked.left || this.body.blocked.right)) ||
        this.directionChangeTimer > 4000) {
      this.patrolDirection *= -1;
      this.directionChangeTimer = 0;
    }
    
    if (this.checkForLedge()) {
      this.patrolDirection *= -1;
      this.directionChangeTimer = 0;
    }
    
    this.setVelocityX(this.enemyType.speed * this.patrolDirection);
    this.setFlipX(this.patrolDirection < 0);
  }

  private checkAggro(player: Phaser.Physics.Arcade.Sprite): void {
    const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
    
    if (distance < this.enemyType.aggroRange! && this.aiState !== 'chase') {
      this.aiState = 'chase';
      this.aggroTarget = player;
      this.setTint(0xFF6666); // Red tint when aggressive
    } else if (distance > this.enemyType.aggroRange! * 1.5 && this.aiState === 'chase') {
      this.aiState = 'patrol';
      this.aggroTarget = undefined;
      this.clearTint();
    }
  }

  private checkForLedge(): boolean {
    // Simple ledge detection - check if there's ground ahead
    const checkDistance = 40;
    const checkX = this.x + (checkDistance * this.patrolDirection);
    const checkY = this.y + this.height / 2 + 20;
    
    // This is a simplified check - in a real game you'd raycast to the tilemap
    return checkX < 50 || checkX > 2450; // World bounds check
  }

  private updateAnimations(): void {
    const isMoving = this.body ? Math.abs(this.body.velocity.x) > 10 : false;
    
    if (isMoving) {
      // Could add a running animation here
    }
    
    // Special effect for tank when moving
    if (this.enemyType.type === 'tank' && isMoving) {
      // Slight screen shake effect could be added here
    }
  }

  public takeDamage(damage: number): void {
    this.health -= damage;
    
    // Flash white when hit
    this.setTint(0xFFFFFF);
    this.scene.time.delayedCall(100, () => {
      if (this.health > 0) {
        this.clearTint();
        if (this.enemyType.type === 'tank') {
          this.setTint(0x888888);
        } else if (this.aiState === 'chase') {
          this.setTint(0xFF6666);
        }
      }
    });
    
    // Knockback
    const knockback = this.flipX ? 100 : -100;
    this.setVelocityX(knockback);
    
    if (this.health <= 0) {
      this.die();
    }
  }

  public die(): void {
    this.aiState = 'dead';
    this.setTint(0x666666);
    
    // Death animation - flip and fade
    this.scene.tweens.add({
      targets: this,
      angle: 180,
      alpha: 0,
      scaleX: 1.2,
      scaleY: 0.8,
      duration: 500,
      ease: 'Power2',
      onComplete: () => {
        this.destroy();
      }
    });
    
    // Disable physics
    if (this.body) {
      this.body.enable = false;
    }
  }

  public getPoints(): number {
    return this.enemyType.points;
  }

  public getDamage(): number {
    return this.enemyType.damage;
  }

  public getType(): EnemyType['type'] {
    return this.enemyType.type;
  }

  // Apply level-based difficulty scaling (speed multiplier)
  public applyDifficulty(level: number) {
    if (!this.enemyType) return;
    // Increase speed 12% per level after level 1 (level 1 => 1x)
    const multiplier = 1 + Math.max(0, level - 1) * 0.12;
    // Update current horizontal velocity proportional if moving
    if (this.body && (this.body as Phaser.Physics.Arcade.Body).velocity.x !== 0) {
      (this.body as Phaser.Physics.Arcade.Body).setVelocityX(
        Phaser.Math.Clamp((this.body as Phaser.Physics.Arcade.Body).velocity.x * multiplier, -500, 500)
      );
    }
    // Store modified speed for AI logic
    (this.enemyType as any).speed = (this.enemyType as any).speed * multiplier;
  }

  public setStationary(flag: boolean) { this.stationary = flag; }

  public isAlive(): boolean {
    return this.aiState !== 'dead' && this.health > 0;
  }

  destroy(): void {
    // Clean up any tweens
    this.scene.tweens.killTweensOf(this);
    super.destroy();
  }
}