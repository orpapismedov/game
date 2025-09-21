import Phaser from 'phaser';
// @ts-ignore
import { Player } from '../entities/Player';
// @ts-ignore
import { EnemyDog } from '../entities/EnemyDog';
// @ts-ignore
import { DogFood } from '../entities/DogFood';
import { TouchInputState, GameState, LevelData } from '../types/global';
import { InputController } from '../input/InputController';

export class Level1 extends Phaser.Scene {
  private player!: Player;
  private enemies!: Phaser.Physics.Arcade.Group;
  private collectibles!: Phaser.Physics.Arcade.Group;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private attackHitbox!: Phaser.Physics.Arcade.Group;
  
  private background1!: Phaser.GameObjects.TileSprite;
  private background2!: Phaser.GameObjects.TileSprite;
  
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: any;
  private touchInput: TouchInputState = {
    left: false,
    right: false,
    jumpPressed: false,
    jumpHeld: false,
    attackPressed: false
  };
  // Track previous jump key state to implement our own edge detection (avoids OS key repeat causing auto-jumps)
  private lastJumpKeyDown: boolean = false;
  
  private gameState!: GameState;
  private levelData!: LevelData;
  private goalFlag!: Phaser.Physics.Arcade.Sprite;
  private inputCtl!: InputController;
  private debugText?: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'Level1' });
  }

  create(): void {
    this.gameState = this.registry.get('gameState');
    this.setupLevel();
    this.createBackground();
    this.createPlatforms();
    this.createPlayer();
    this.createEnemies();
    this.createCollectibles();
    this.createGoal();
    this.setupCamera();
  this.setupInput();
  // Initialize InputController (pass touch controls from HUD if available later)
  const hud: any = this.scene.get('HUDScene');
  this.inputCtl = new InputController(this, hud?.touchControls);
  this.debugText = this.add.text(20,20,'', { font: '14px monospace', color: '#0f0' }).setScrollFactor(0).setDepth(9999);
    this.setupCollisions();
    this.setupAudio();
  }

  update(time: number, delta: number): void {
  // (Timer removed: no time accumulation)
    
    // Update merged input controller
    if (this.inputCtl) this.inputCtl.update();
    if (this.player && !this.gameState.isPaused && this.inputCtl) {
      this.player.updateMovement(time, delta, this.inputCtl.state as any);
    }
    
    // Update enemies
    this.enemies.children.entries.forEach((enemy) => {
      if (enemy instanceof EnemyDog) {
        enemy.update(time, delta, this.player);
      }
    });
    
    // Update collectibles
    this.collectibles.children.entries.forEach((item) => {
      if (item instanceof DogFood) {
        item.update(time, delta);
      }
    });
    
    // Update parallax background
    this.updateBackground();

    // Debug overlay
    if (this.debugText && this.player.body) {
      const b = this.player.body as Phaser.Physics.Arcade.Body;
      this.debugText.setText([
        `vy=${b.velocity.y.toFixed(1)}`,
        `grounded=${b.blocked.down || b.touching.down}`,
        `jumpPressed=${this.inputCtl?.state.jumpPressed}`,
        `jumpHeld=${this.inputCtl?.state.jumpHeld}`
      ]);
    }

    // Anti-clipping: if player somehow drifts slightly below ground, nudge up
    // TEMPORARILY DISABLED for debugging velocity oscillation
    if (false && this.player && this.player.body) {
      const body = this.player.body as Phaser.Physics.Arcade.Body;
      if (this.player.y > 640) { // ground safety threshold (ground at ~620 + half platform height)
        console.log('[Level1] Anti-clipping triggered: player.y=', this.player.y, 'Vy=', body.velocity.y);
        this.player.y = 620 - (this.player.displayHeight * 0.02); // reposition just above ground
        body.updateFromGameObject();
        body.setVelocityY(0);
      }
    }
    
    // Check win condition
    this.checkWinCondition();
  }

  private setupLevel(): void {
    // Define level layout - 10x longer than before!
    const worldWidth = 25000; // Increased from 2500 to 25000 (10x longer)
    
    this.levelData = {
      // Raise player start so bottom is about half a sprite height above previous ground baseline
      playerStart: { x: 100, y: 380 }, // slightly higher baseline (will lift further after instantiation)
      enemies: [
        // Progressive enemy placement - more enemies as player advances
        // Section 1 (0-5000): Easy start
        { x: 1000, y: 500, type: 'walker' },
        { x: 1500, y: 500, type: 'walker' },
        { x: 2000, y: 450, type: 'jumper' },
        { x: 2500, y: 500, type: 'walker' },
        { x: 3000, y: 450, type: 'jumper' },
        { x: 3500, y: 500, type: 'chaser' },
        { x: 4000, y: 450, type: 'walker' },
        { x: 4500, y: 500, type: 'jumper' },
        
        // Section 2 (5000-10000): Medium difficulty - closer spacing
        { x: 5500, y: 500, type: 'chaser' },
        { x: 6000, y: 450, type: 'tank' },
        { x: 6300, y: 500, type: 'walker' },
        { x: 6800, y: 450, type: 'jumper' },
        { x: 7200, y: 500, type: 'chaser' },
        { x: 7600, y: 450, type: 'walker' },
        { x: 8000, y: 500, type: 'tank' },
        { x: 8400, y: 450, type: 'jumper' },
        { x: 8800, y: 500, type: 'chaser' },
        { x: 9200, y: 450, type: 'walker' },
        { x: 9600, y: 500, type: 'tank' },
        
        // Section 3 (10000-15000): High difficulty - even closer
        { x: 10500, y: 500, type: 'chaser' },
        { x: 10800, y: 450, type: 'tank' },
        { x: 11100, y: 500, type: 'jumper' },
        { x: 11400, y: 450, type: 'chaser' },
        { x: 11700, y: 500, type: 'tank' },
        { x: 12000, y: 450, type: 'walker' },
        { x: 12300, y: 500, type: 'chaser' },
        { x: 12600, y: 450, type: 'tank' },
        { x: 12900, y: 500, type: 'jumper' },
        { x: 13200, y: 450, type: 'chaser' },
        { x: 13500, y: 500, type: 'tank' },
        { x: 13800, y: 450, type: 'walker' },
        { x: 14100, y: 500, type: 'chaser' },
        { x: 14400, y: 450, type: 'tank' },
        { x: 14700, y: 500, type: 'jumper' },
        
        // Section 4 (15000-20000): Very high difficulty - dense placement
        { x: 15200, y: 500, type: 'tank' },
        { x: 15400, y: 450, type: 'chaser' },
        { x: 15600, y: 500, type: 'tank' },
        { x: 15800, y: 450, type: 'jumper' },
        { x: 16000, y: 500, type: 'chaser' },
        { x: 16200, y: 450, type: 'tank' },
        { x: 16400, y: 500, type: 'walker' },
        { x: 16600, y: 450, type: 'chaser' },
        { x: 16800, y: 500, type: 'tank' },
        { x: 17000, y: 450, type: 'jumper' },
        { x: 17200, y: 500, type: 'chaser' },
        { x: 17400, y: 450, type: 'tank' },
        { x: 17600, y: 500, type: 'walker' },
        { x: 17800, y: 450, type: 'chaser' },
        { x: 18000, y: 500, type: 'tank' },
        { x: 18200, y: 450, type: 'jumper' },
        { x: 18400, y: 500, type: 'chaser' },
        { x: 18600, y: 450, type: 'tank' },
        { x: 18800, y: 500, type: 'walker' },
        { x: 19000, y: 450, type: 'chaser' },
        { x: 19200, y: 500, type: 'tank' },
        { x: 19400, y: 450, type: 'jumper' },
        { x: 19600, y: 500, type: 'chaser' },
        { x: 19800, y: 450, type: 'tank' },
        
        // Section 5 (20000-25000): Maximum difficulty - very dense
        { x: 20100, y: 500, type: 'tank' },
        { x: 20250, y: 450, type: 'chaser' },
        { x: 20400, y: 500, type: 'tank' },
        { x: 20550, y: 450, type: 'jumper' },
        { x: 20700, y: 500, type: 'chaser' },
        { x: 20850, y: 450, type: 'tank' },
        { x: 21000, y: 500, type: 'walker' },
        { x: 21150, y: 450, type: 'chaser' },
        { x: 21300, y: 500, type: 'tank' },
        { x: 21450, y: 450, type: 'jumper' },
        { x: 21600, y: 500, type: 'chaser' },
        { x: 21750, y: 450, type: 'tank' },
        { x: 21900, y: 500, type: 'walker' },
        { x: 22050, y: 450, type: 'chaser' },
        { x: 22200, y: 500, type: 'tank' },
        { x: 22350, y: 450, type: 'jumper' },
        { x: 22500, y: 500, type: 'chaser' },
        { x: 22650, y: 450, type: 'tank' },
        { x: 22800, y: 500, type: 'walker' },
        { x: 22950, y: 450, type: 'chaser' },
        { x: 23100, y: 500, type: 'tank' },
        { x: 23250, y: 450, type: 'jumper' },
        { x: 23400, y: 500, type: 'chaser' },
        { x: 23550, y: 450, type: 'tank' },
        { x: 23700, y: 500, type: 'walker' },
        { x: 23850, y: 450, type: 'chaser' },
        { x: 24000, y: 500, type: 'tank' },
        { x: 24150, y: 450, type: 'jumper' },
        { x: 24300, y: 500, type: 'chaser' },
        { x: 24450, y: 450, type: 'tank' }
      ],
      collectibles: [
        // Spread collectibles throughout the much longer level
        { x: 800, y: 450, type: 'dogfood' },
        { x: 1200, y: 400, type: 'dogfood' },
        { x: 1800, y: 350, type: 'dogfood' },
        { x: 2200, y: 400, type: 'dogfood' },
        { x: 2800, y: 350, type: 'dogfood' },
        { x: 3200, y: 400, type: 'dogfood' },
        { x: 3800, y: 350, type: 'dogfood' },
        { x: 4200, y: 400, type: 'dogfood' },
        { x: 4800, y: 350, type: 'dogfood' },
        { x: 5200, y: 400, type: 'dogfood' },
        { x: 5800, y: 350, type: 'dogfood' },
        { x: 6200, y: 400, type: 'dogfood' },
        { x: 6800, y: 350, type: 'dogfood' },
        { x: 7200, y: 400, type: 'dogfood' },
        { x: 7800, y: 350, type: 'dogfood' },
        { x: 8200, y: 400, type: 'dogfood' },
        { x: 8800, y: 350, type: 'dogfood' },
        { x: 9200, y: 400, type: 'dogfood' },
        { x: 9800, y: 350, type: 'dogfood' },
        { x: 10200, y: 400, type: 'dogfood' },
        { x: 10800, y: 350, type: 'dogfood' },
        { x: 11200, y: 400, type: 'dogfood' },
        { x: 11800, y: 350, type: 'dogfood' },
        { x: 12200, y: 400, type: 'dogfood' },
        { x: 12800, y: 350, type: 'dogfood' },
        { x: 13200, y: 400, type: 'dogfood' },
        { x: 13800, y: 350, type: 'dogfood' },
        { x: 14200, y: 400, type: 'dogfood' },
        { x: 14800, y: 350, type: 'dogfood' },
        { x: 15200, y: 400, type: 'dogfood' },
        { x: 15800, y: 350, type: 'dogfood' },
        { x: 16200, y: 400, type: 'dogfood' },
        { x: 16800, y: 350, type: 'dogfood' },
        { x: 17200, y: 400, type: 'dogfood' },
        { x: 17800, y: 350, type: 'dogfood' },
        { x: 18200, y: 400, type: 'dogfood' },
        { x: 18800, y: 350, type: 'dogfood' },
        { x: 19200, y: 400, type: 'dogfood' },
        { x: 19800, y: 350, type: 'dogfood' },
        { x: 20200, y: 400, type: 'dogfood' },
        { x: 20800, y: 350, type: 'dogfood' },
        { x: 21200, y: 400, type: 'dogfood' },
        { x: 21800, y: 350, type: 'dogfood' },
        { x: 22200, y: 400, type: 'dogfood' },
        { x: 22800, y: 350, type: 'dogfood' },
        { x: 23200, y: 400, type: 'dogfood' },
        { x: 23800, y: 350, type: 'dogfood' },
        { x: 24200, y: 400, type: 'dogfood' },
        { x: 24600, y: 450, type: 'dogfood' }
      ],
      platforms: [
        { x: 0, y: 620, width: worldWidth, height: 90 }, // Extended ground platform
        // Many more platforms throughout the extended level - every 300px
        { x: 300, y: 520, width: 220, height: 34 },
        { x: 600, y: 430, width: 200, height: 34 },
        { x: 900, y: 380, width: 220, height: 34 },
        { x: 1200, y: 330, width: 220, height: 34 },
        { x: 1500, y: 430, width: 220, height: 34 },
        { x: 1800, y: 480, width: 220, height: 34 },
        { x: 2100, y: 380, width: 220, height: 34 },
        { x: 2400, y: 330, width: 220, height: 34 },
        { x: 2700, y: 480, width: 220, height: 34 },
        { x: 3000, y: 380, width: 220, height: 34 },
        { x: 3300, y: 430, width: 220, height: 34 },
        { x: 3600, y: 330, width: 220, height: 34 },
        { x: 3900, y: 480, width: 220, height: 34 },
        { x: 4200, y: 380, width: 220, height: 34 },
        { x: 4500, y: 430, width: 220, height: 34 },
        { x: 4800, y: 330, width: 220, height: 34 },
        { x: 5100, y: 480, width: 220, height: 34 },
        { x: 5400, y: 380, width: 220, height: 34 },
        { x: 5700, y: 430, width: 220, height: 34 },
        { x: 6000, y: 330, width: 220, height: 34 },
        { x: 6300, y: 480, width: 220, height: 34 },
        { x: 6600, y: 380, width: 220, height: 34 },
        { x: 6900, y: 430, width: 220, height: 34 },
        { x: 7200, y: 330, width: 220, height: 34 },
        { x: 7500, y: 480, width: 220, height: 34 },
        { x: 7800, y: 380, width: 220, height: 34 },
        { x: 8100, y: 430, width: 220, height: 34 },
        { x: 8400, y: 330, width: 220, height: 34 },
        { x: 8700, y: 480, width: 220, height: 34 },
        { x: 9000, y: 380, width: 220, height: 34 },
        { x: 9300, y: 430, width: 220, height: 34 },
        { x: 9600, y: 330, width: 220, height: 34 },
        { x: 9900, y: 480, width: 220, height: 34 },
        { x: 10200, y: 380, width: 220, height: 34 },
        { x: 10500, y: 430, width: 220, height: 34 },
        { x: 10800, y: 330, width: 220, height: 34 },
        { x: 11100, y: 480, width: 220, height: 34 },
        { x: 11400, y: 380, width: 220, height: 34 },
        { x: 11700, y: 430, width: 220, height: 34 },
        { x: 12000, y: 330, width: 220, height: 34 },
        { x: 12300, y: 480, width: 220, height: 34 },
        { x: 12600, y: 380, width: 220, height: 34 },
        { x: 12900, y: 430, width: 220, height: 34 },
        { x: 13200, y: 330, width: 220, height: 34 },
        { x: 13500, y: 480, width: 220, height: 34 },
        { x: 13800, y: 380, width: 220, height: 34 },
        { x: 14100, y: 430, width: 220, height: 34 },
        { x: 14400, y: 330, width: 220, height: 34 },
        { x: 14700, y: 480, width: 220, height: 34 },
        { x: 15000, y: 380, width: 220, height: 34 },
        { x: 15300, y: 430, width: 220, height: 34 },
        { x: 15600, y: 330, width: 220, height: 34 },
        { x: 15900, y: 480, width: 220, height: 34 },
        { x: 16200, y: 380, width: 220, height: 34 },
        { x: 16500, y: 430, width: 220, height: 34 },
        { x: 16800, y: 330, width: 220, height: 34 },
        { x: 17100, y: 480, width: 220, height: 34 },
        { x: 17400, y: 380, width: 220, height: 34 },
        { x: 17700, y: 430, width: 220, height: 34 },
        { x: 18000, y: 330, width: 220, height: 34 },
        { x: 18300, y: 480, width: 220, height: 34 },
        { x: 18600, y: 380, width: 220, height: 34 },
        { x: 18900, y: 430, width: 220, height: 34 },
        { x: 19200, y: 330, width: 220, height: 34 },
        { x: 19500, y: 480, width: 220, height: 34 },
        { x: 19800, y: 380, width: 220, height: 34 },
        { x: 20100, y: 430, width: 220, height: 34 },
        { x: 20400, y: 330, width: 220, height: 34 },
        { x: 20700, y: 480, width: 220, height: 34 },
        { x: 21000, y: 380, width: 220, height: 34 },
        { x: 21300, y: 430, width: 220, height: 34 },
        { x: 21600, y: 330, width: 220, height: 34 },
        { x: 21900, y: 480, width: 220, height: 34 },
        { x: 22200, y: 380, width: 220, height: 34 },
        { x: 22500, y: 430, width: 220, height: 34 },
        { x: 22800, y: 330, width: 220, height: 34 },
        { x: 23100, y: 480, width: 220, height: 34 },
        { x: 23400, y: 380, width: 220, height: 34 },
        { x: 23700, y: 430, width: 220, height: 34 },
        { x: 24000, y: 330, width: 220, height: 34 },
        { x: 24300, y: 480, width: 220, height: 34 }
      ],
      goal: { x: 24700, y: 500 } // Goal moved to near the end of the extended level
    };
    
    // Set world bounds to match the extended level
    this.physics.world.setBounds(0, 0, worldWidth, 720);
  }

  private createBackground(): void {
    // Create parallax background layers for the extended level
    this.background1 = this.add.tileSprite(0, 0, 25000, 720, 'bg-layer1')
      .setOrigin(0, 0)
      .setScrollFactor(0.1);
      
    this.background2 = this.add.tileSprite(0, 0, 25000, 720, 'bg-layer2')
      .setOrigin(0, 0)
      .setScrollFactor(0.3);

    // Procedurally add decorative elements (simple shapes) to mimic classic style
    const decoContainer = this.add.container(0,0).setScrollFactor(0.4);
    const makeHill = (x:number, w:number, h:number, color:number) => {
      const g = this.add.graphics();
      g.fillStyle(color,1);
      g.fillEllipse(x, 620, w, h);
      decoContainer.add(g);
    };
    const makeCloud = (x:number,y:number,scale:number) => {
      const g = this.add.graphics();
      g.fillStyle(0xffffff,0.95);
      g.fillCircle(0,0,22*scale); g.fillCircle(25*scale,-5*scale,18*scale); g.fillCircle(-25*scale,-5*scale,18*scale); g.fillCircle(10*scale,10*scale,20*scale); g.fillCircle(-15*scale,12*scale,16*scale);
      g.setPosition(x,y);
      decoContainer.add(g);
    };
    const makeMush = (x:number) => {
      const g = this.add.graphics();
      g.fillStyle(0xcb3d3d,1); g.fillEllipse(0,0,48,32); // cap
      g.fillStyle(0xffffff,1); g.fillCircle(-12,-4,6); g.fillCircle(12,-6,7); g.fillCircle(0,4,8);
      g.fillStyle(0xead7b4,1); g.fillRect(-8,0,16,26); // stem
      g.setPosition(x, 560);
      decoContainer.add(g);
    };
    for (let i=200;i<2500;i+=600){ makeHill(i, 420, 180, 0x4caf50); }
    for (let i=500;i<2500;i+=700){ makeHill(i, 300, 140, 0x66bb6a); }
    for (let i=150;i<2500;i+=450){ makeCloud(i, 160+ (i%900)/10, 1); }
    for (let i=350;i<2500;i+=650){ makeCloud(i, 110+ (i%600)/15, 0.8); }
    for (let i=250;i<2500;i+=800){ makeMush(i); }
  }

  private createPlatforms(): void {
    this.platforms = this.physics.add.staticGroup();
    
    this.levelData.platforms.forEach(platform => {
      const tile = this.platforms.create(
        platform.x + platform.width / 2,
        platform.y + platform.height / 2,
        'tiles'
      ) as Phaser.Physics.Arcade.Sprite;
      
      tile.setDisplaySize(platform.width, platform.height);
      tile.refreshBody();
      // Apply visibility-enhancing tint (darker ground vs brighter background)
      if (platform.y > 600) {
        tile.setTint(0x4e342e); // dark brown ground
      } else {
        tile.setTint(0x6d4c41); // lighter platform brown
      }
    });
  }

  private createPlayer(): void {
    console.log('[Level1] Creating player at start position:', this.levelData.playerStart);
    this.player = new Player(
      this,
      this.levelData.playerStart.x,
      this.levelData.playerStart.y
    );
    
    console.log('[Level1] Player before adjustment:', {
      y: this.player.y,
      displayHeight: this.player.displayHeight,
      scale: this.player.scale
    });
    
    // Lift spawn by half its display height so feet are clearly above ground/platform to avoid clipping
    this.player.y -= this.player.displayHeight * 0.5;
    
    console.log('[Level1] Player after lift adjustment:', {
      y: this.player.y,
      adjustment: this.player.displayHeight * 0.5
    });
    
    // Safety: ensure physics body realigns after manual y change
    if (this.player.body) {
      (this.player.body as Phaser.Physics.Arcade.Body).updateFromGameObject();
    }
    
    this.add.existing(this.player);
    this.physics.add.existing(this.player);
  }

  private createEnemies(): void {
    this.enemies = this.physics.add.group();
    
    this.levelData.enemies.forEach(enemyData => {
      try {
        const enemy = new EnemyDog(
          this,
          enemyData.x,
          enemyData.y,
          enemyData.type
        );
        // Make every second enemy stationary to serve as an obstacle preview
        if (Math.random() < 0.4) {
          (enemy as any).setStationary(true);
          // Make stationary enemies true obstacles (no gravity, immovable)
          if (enemy.body) {
            const body = enemy.body as Phaser.Physics.Arcade.Body;
            body.setAllowGravity(false);
            body.immovable = true;
            body.moves = false;
          }
        }
        this.enemies.add(enemy);
      } catch (e) {
        console.error('[Level1] Failed to create EnemyDog', enemyData, e);
      }
    });

    // Apply difficulty scaling based on current level (default 1)
  const level = (this.gameState && (this.gameState as any).level) || 1;
  (this.enemies.children as any).iterate((obj: any) => { if (obj instanceof EnemyDog && obj.applyDifficulty) { obj.applyDifficulty(level); } return false; });
  }

  private createCollectibles(): void {
    this.collectibles = this.physics.add.group({ allowGravity: false, immovable: true });
    
    this.levelData.collectibles.forEach(item => {
      const dogFood = new DogFood(this, item.x, item.y);
      this.collectibles.add(dogFood);
    });
  }

  private createGoal(): void {
    // Create goal flag (simple rectangle for now)
    this.goalFlag = this.physics.add.sprite(
      this.levelData.goal.x,
      this.levelData.goal.y,
      'tiles'
    ) as Phaser.Physics.Arcade.Sprite;
    
    this.goalFlag.setTint(0xFFD700); // Gold color
    this.goalFlag.setDisplaySize(64, 96);
    this.goalFlag.setImmovable(true);
    
    // Add flagpole animation
    this.tweens.add({
      targets: this.goalFlag,
      scaleX: 1.1,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Bonus big food collectible at end if not already added
  const finalFood = new DogFood(this, this.levelData.goal.x - 80, this.levelData.goal.y - 120);
  finalFood.setScale(0.22); // Larger than new normal (0.12) but smaller than before
    finalFood.setData('isFinal', true);
    this.collectibles.add(finalFood);
  }

  private setupCamera(): void {
    // Camera follows player with deadzone
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.cameras.main.setDeadzone(120, 80);
    this.cameras.main.setBounds(0, 0, 25000, 720);
  }

  private setupInput(): void {
    // Desktop keyboard input
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.wasd = this.input.keyboard.addKeys('W,S,A,D,SPACE,X,ESC,P') as any;
      console.log('[Level1] Keyboard input initialized');
    } else {
      console.warn('[Level1] this.input.keyboard not available');
    }
    
    // Touch controls will be set up by HUD scene
  }

  private setupCollisions(): void {
    // Player collisions
    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.enemies, this.platforms);
    
    // Player vs enemies
    this.physics.add.overlap(
      this.player,
      this.enemies,
      this.handlePlayerEnemyCollision,
      undefined,
      this
    );
    
    // Player vs collectibles
    this.physics.add.overlap(
      this.player,
      this.collectibles,
      this.handlePlayerCollectibleCollision,
      undefined,
      this
    );
    
    // Player vs goal
    this.physics.add.overlap(
      this.player,
      this.goalFlag,
      this.handlePlayerGoalCollision,
      undefined,
      this
    );
    
    // Create attack hitbox group
    this.attackHitbox = this.physics.add.group();
    
    // Attack hitbox vs enemies
    this.physics.add.overlap(
      this.attackHitbox,
      this.enemies,
      this.handleAttackEnemyCollision,
      undefined,
      this
    );
  }

  private setupAudio(): void {
    // Start background music
    if (!this.gameState.isMuted && this.sound.get('bgm')) {
      const bgm = this.sound.add('bgm', { loop: true, volume: 0.3 });
      bgm.play();
    }
  }

  private updateInput(): void {
    // Reset input state
    this.touchInput = {
      left: false,
      right: false,
      jumpPressed: false,
      jumpHeld: false,
      attackPressed: false
    };
    
    // Desktop input
    if (this.cursors && this.wasd) {
      const leftDown = this.cursors.left.isDown || this.wasd.A.isDown;
      const rightDown = this.cursors.right.isDown || this.wasd.D.isDown;
      const jumpKeyDown = this.cursors.up.isDown || this.wasd.SPACE.isDown; // raw held state
      const attackDown = this.wasd.X.isDown; // treat attack as on-press; convert to edge below

      this.touchInput.left = leftDown;
      this.touchInput.right = rightDown;
      // We'll compute jump edge after merging touch state below
      this.touchInput.jumpHeld = jumpKeyDown;
      // Attack edge detection
      this.touchInput.attackPressed = attackDown && Phaser.Input.Keyboard.JustDown(this.wasd.X);

      // Pause handling (edge)
      if (Phaser.Input.Keyboard.JustDown(this.wasd.ESC) || Phaser.Input.Keyboard.JustDown(this.wasd.P)) {
        this.togglePause();
      }
    }
    
    // Mobile touch input will be handled by HUD scene
    const hudScene = this.scene.get('HUDScene') as any;
    if (hudScene && hudScene.touchControls) {
      // Ensure touch controls internal edge detection updates
      if (hudScene.touchControls.update) hudScene.touchControls.update();
      const touchState = hudScene.touchControls.getInputState();
      this.touchInput.left = this.touchInput.left || touchState.left;
      this.touchInput.right = this.touchInput.right || touchState.right;
      // Merge held state
      const combinedJumpHeld = this.touchInput.jumpHeld || touchState.jumpHeld;
      // Edge detection (pressed this frame) using our own previous-state memory
      this.touchInput.jumpPressed = combinedJumpHeld && !this.lastJumpKeyDown;
      this.touchInput.jumpHeld = combinedJumpHeld;
      // Merge attack (preserve any prior edge) – treat touchState.attackPressed as edge already
      this.touchInput.attackPressed = this.touchInput.attackPressed || touchState.attackPressed;
      // Update last state
      this.lastJumpKeyDown = combinedJumpHeld;
    } else {
      // No touch controls: still compute edge for keyboard-only case
      this.touchInput.jumpPressed = this.touchInput.jumpHeld && !this.lastJumpKeyDown;
      this.lastJumpKeyDown = this.touchInput.jumpHeld;
    }
  }

  private updateBackground(): void {
    // Parallax scrolling based on camera position
    const camera = this.cameras.main;
    this.background1.tilePositionX = camera.scrollX * 0.1;
    this.background2.tilePositionX = camera.scrollX * 0.3;
  }

  private handlePlayerEnemyCollision(
    player: any,
    enemy: any
  ): void {
    if (enemy instanceof EnemyDog && player instanceof Player) {
      // Check if player is stomping enemy (Mario-style)
      if (player.body && player.body.velocity.y > 0 && 
          player.y < enemy.y - 10) {
        // Player stomps enemy
        enemy.takeDamage(1);
        player.bounce();
        this.addScore(enemy.getPoints());
        this.playSound('enemyDown');
      } else {
        // Enemy hurts player
        player.takeHit(1);
        this.playSound('hit');
        this.cameras.main.shake(200, 0.01);
      }
    }
  }

  private handlePlayerCollectibleCollision(
    player: any,
    collectible: any
  ): void {
    if (collectible instanceof DogFood && player instanceof Player) {
      const isFinal = collectible.getData('isFinal');
      collectible.collect();
      this.addScore(1);
      this.playSound('pickup');
      
      // Show floating score text
      this.showFloatingText(collectible.x, collectible.y, '+1', '#FFD700');

      if (isFinal) {
        this.winLevel();
      }
    }
  }

  private handlePlayerGoalCollision(): void {
    // Win condition
    this.winLevel();
  }

  private handleAttackEnemyCollision(
    hitbox: any,
    enemy: any
  ): void {
    if (enemy instanceof EnemyDog) {
      enemy.takeDamage(1);
      this.addScore(enemy.getPoints());
      this.playSound('enemyDown');
      hitbox.destroy();
    }
  }

  private checkWinCondition(): void {
    // Check if player reached the goal or collected all items
    const remainingCollectibles = this.collectibles.children.entries.length;
    if (remainingCollectibles === 0) {
      this.winLevel();
    }
  }

  private winLevel(): void {
    // Don't pause physics - keep the game running
    this.gameState.isPaused = false;
    
    // Increment level and persist
    const current = (this.gameState as any).level || 1;
    (this.gameState as any).level = current + 1;
    this.registry.set('gameState', this.gameState);

    // Create level complete overlay without pausing
    this.createLevelCompleteUI();
  }
  
  private createLevelCompleteUI(): void {
    const { width, height } = this.scale.gameSize;
    
    // Semi-transparent overlay
    const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.8);
    overlay.setOrigin(0, 0).setScrollFactor(0).setDepth(1000);
    
    // Main completion container
    const container = this.add.container(width / 2, height / 2);
    container.setScrollFactor(0).setDepth(1001);
    
    // Background panel
    const panel = this.add.rectangle(0, 0, 500, 350, 0x2c3e50, 0.95);
    panel.setStrokeStyle(4, 0xFFD700);
    
    // Title
    const title = this.add.text(0, -120, 'LEVEL COMPLETE!', {
      fontSize: '48px',
      color: '#FFD700',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    // Score display
    const scoreText = this.add.text(0, -60, `Score: ${this.gameState.score}`, {
      fontSize: '32px',
      color: '#FFFFFF',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5);
    
    // Next level info
    const nextLevelText = this.add.text(0, -20, 'Ready for Level 2?', {
      fontSize: '24px',
      color: '#ECEFEF',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5);
    
    // Continue button
    const continueBtn = this.add.rectangle(0, 50, 200, 60, 0x27ae60, 1);
    continueBtn.setStrokeStyle(3, 0xFFFFFF);
    continueBtn.setInteractive({ useHandCursor: true });
    
    const continueText = this.add.text(0, 50, 'CONTINUE', {
      fontSize: '24px',
      color: '#FFFFFF',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    // Button hover effects
    continueBtn.on('pointerover', () => {
      continueBtn.setFillStyle(0x2ecc71);
      continueBtn.setScale(1.05);
    });
    
    continueBtn.on('pointerout', () => {
      continueBtn.setFillStyle(0x27ae60);
      continueBtn.setScale(1.0);
    });
    
    // Button click handler
    continueBtn.on('pointerdown', () => {
      this.proceedToLevel2();
    });
    
    // Add all elements to container
    container.add([panel, title, scoreText, nextLevelText, continueBtn, continueText]);
    
    // Entrance animation
    container.setScale(0);
    this.tweens.add({
      targets: container,
      scale: 1,
      duration: 500,
      ease: 'Back.easeOut'
    });
  }
  
  private proceedToLevel2(): void {
    // No need to resume physics since we never paused it
    this.scene.start('Level2');
  }

  private togglePause(): void {
    this.gameState.isPaused = !this.gameState.isPaused;
    
    if (this.gameState.isPaused) {
      this.physics.pause();
      this.sound.pauseAll();
    } else {
      this.physics.resume();
      this.sound.resumeAll();
    }
  }

  private addScore(points: number): void {
    this.gameState.score += points;
    this.registry.set('gameState', this.gameState);
  }

  private playSound(key: string): void {
    if (!this.gameState.isMuted && this.sound.get(key)) {
      this.sound.play(key, { volume: 0.5 });
    }
  }

  private showFloatingText(x: number, y: number, text: string, color: string): void {
    const floatingText = this.add.text(x, y, text, {
      fontSize: '24px',
      color: color,
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5);
    
    this.tweens.add({
      targets: floatingText,
      y: y - 50,
      alpha: 0,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => floatingText.destroy()
    });
  }

  // Public method to create attack hitbox
  public createAttackHitbox(x: number, y: number, direction: string): void {
    const hitbox = this.physics.add.sprite(x, y, 'tiles') as Phaser.Physics.Arcade.Sprite;
    hitbox.setSize(40, 40);
    hitbox.setVisible(false);
    
    this.attackHitbox.add(hitbox);
    
    // Move hitbox in attack direction
    const velocity = direction === 'right' ? 300 : -300;
    hitbox.setVelocityX(velocity);
    
    // Destroy hitbox after short time
    this.time.delayedCall(200, () => {
      if (hitbox && hitbox.active) {
        hitbox.destroy();
      }
    });
  }
}