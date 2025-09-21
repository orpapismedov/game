import Phaser from 'phaser';
import { Player } from '../entities/Player';
// @ts-ignore
import { EnemyDog } from '../entities/EnemyDog';
// @ts-ignore
import { DogFood } from '../entities/DogFood';
import { TouchInputState, GameState } from '../types/global';

export class Level2 extends Phaser.Scene {
  private player!: Player;
  private enemies!: Phaser.Physics.Arcade.Group;
  private collectibles!: Phaser.Physics.Arcade.Group;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private attackHitbox!: Phaser.Physics.Arcade.Group;
  private goalFlag!: Phaser.Physics.Arcade.Sprite;
  private touchInput: TouchInputState = { left:false,right:false,jumpPressed:false,jumpHeld:false,attackPressed:false };
  private gameState!: GameState;
  private lastJumpKeyDown: boolean = false;

  constructor() { super({ key: 'Level2' }); }

  create(): void {
    this.gameState = this.registry.get('gameState');
    // Significantly expand world size for much longer and harder level
    const worldWidth = 6000; // Increased from 4000
    this.physics.world.setBounds(0,0,worldWidth,720);

    this.createBackground(worldWidth);

    this.createPlatforms(worldWidth);
    this.createPlayer();
    this.createCollectibles();
    this.createEnemies();
    this.createGoal(worldWidth);
    this.setupCamera(worldWidth);
    this.setupCollisions();
    this.scaleDifficulty();
  }

  private createBackground(worldWidth:number) {
    const layer1 = this.add.tileSprite(0,0,worldWidth,720,'bg-layer1').setOrigin(0,0).setScrollFactor(0.15);
    const layer2 = this.add.tileSprite(0,0,worldWidth,720,'bg-layer2').setOrigin(0,0).setScrollFactor(0.35);
    const deco = this.add.container(0,0).setScrollFactor(0.45);
    const makeHill=(x:number,w:number,h:number,c:number)=>{ const g=this.add.graphics(); g.fillStyle(c,1); g.fillEllipse(x,620,w,h); deco.add(g); };
    const makeCloud=(x:number,y:number,s:number)=>{ const g=this.add.graphics(); g.fillStyle(0xffffff,0.95); g.fillCircle(0,0,22*s); g.fillCircle(25*s,-5*s,18*s); g.fillCircle(-25*s,-5*s,18*s); g.fillCircle(10*s,10*s,20*s); g.fillCircle(-15*s,12*s,16*s); g.setPosition(x,y); deco.add(g); };
    const makeMush=(x:number)=>{ const g=this.add.graphics(); g.fillStyle(0xcb3d3d,1); g.fillEllipse(0,0,48,32); g.fillStyle(0xffffff,1); g.fillCircle(-12,-4,6); g.fillCircle(12,-6,7); g.fillCircle(0,4,8); g.fillStyle(0xead7b4,1); g.fillRect(-8,0,16,26); g.setPosition(x,560); deco.add(g); };
    for (let i=300;i<worldWidth;i+=700) makeHill(i,480,200,0x4caf50);
    for (let i=600;i<worldWidth;i+=900) makeHill(i,360,160,0x66bb6a);
    for (let i=250;i<worldWidth;i+=500) makeCloud(i,140+(i%800)/12,1);
    for (let i=500;i<worldWidth;i+=650) makeCloud(i,100+(i%600)/18,0.85);
    for (let i=400;i<worldWidth;i+=900) makeMush(i);
  }

  update(time: number, delta: number): void {
    // Acquire HUDScene touch controls if available for mobile
    const hud: any = this.scene.get('HUDScene');
    if (hud && hud.touchControls && hud.touchControls.update) hud.touchControls.update();
    if (hud && hud.touchControls) {
      const touchState = hud.touchControls.getInputState();
      // merge & edge detection
      const combinedJumpHeld = touchState.jumpHeld;
      this.touchInput.jumpPressed = combinedJumpHeld && !this.lastJumpKeyDown;
      this.touchInput.jumpHeld = combinedJumpHeld;
      this.touchInput.left = touchState.left;
      this.touchInput.right = touchState.right;
      this.touchInput.attackPressed = touchState.attackPressed;
      this.lastJumpKeyDown = combinedJumpHeld;
    }
    if (this.player) {
      this.player.updateMovement(time, delta, this.touchInput);
      this.player.update();
    }
  (this.enemies.children as any).iterate((obj: any) => { if (obj instanceof EnemyDog) { obj.update(time, delta, this.player); } return false; });
    // Anti-clipping safeguard: ensure player does not sink below ground level
    if (this.player && this.player.body) {
      const body = this.player.body as Phaser.Physics.Arcade.Body;
      if (this.player.y > 650) { // ground baseline safety threshold
        this.player.y = 640 - (this.player.displayHeight * 0.02);
        body.updateFromGameObject();
        body.setVelocityY(0);
      }
    }
  }

  private createPlatforms(worldWidth: number) {
    this.platforms = this.physics.add.staticGroup();
    
    // Ground
    const ground = this.platforms.create(worldWidth/2, 660, 'tiles') as Phaser.Physics.Arcade.Sprite;
    ground.setDisplaySize(worldWidth, 120); 
    ground.refreshBody(); 
    ground.setTint(0x4e342e);
    
    // Enhanced platform layout with more challenging jumps
    const makeP = (x:number,y:number,w:number=200,h:number=34)=>{ 
      const p=this.platforms.create(x+w/2,y+h/2,'tiles') as Phaser.Physics.Arcade.Sprite; 
      p.setDisplaySize(w,h); 
      p.refreshBody(); 
      p.setTint(0x6d4c41); 
    };
    
    // Early section: Learning curve
    for (let i=600;i<1500;i+=400) {
      makeP(i, 500);
      makeP(i+180, 420, 180);
      if (i % 800 === 0) makeP(i+250, 340, 160);
    }
    
    // Middle section: Increased challenge
    for (let i=1500;i<3500;i+=350) {
      const baseY = 480;
      makeP(i, baseY - (i%1000===0?100:0));
      makeP(i+150, baseY - 80 - (i%1500===0?120:0), 160);
      
      // Add more vertical variety
      if (i % 700 === 0) {
        makeP(i+100, baseY - 160, 140);
        makeP(i+250, baseY - 200, 120);
      }
      
      // Occasional challenging gaps
      if (Math.random() > 0.7) {
        makeP(i+300, baseY - (Math.random() * 150), 100);
      }
    }
    
    // Final section: Maximum challenge
    for (let i=3500;i<worldWidth-600;i+=300) {
      const baseY = 450;
      makeP(i, baseY - (i%800===0?150:50));
      makeP(i+120, baseY - 120 - (i%1200===0?100:0), 140);
      
      // Complex multi-level platforming
      if (i % 600 === 0) {
        makeP(i+50, baseY - 220, 100);
        makeP(i+200, baseY - 280, 100);
        makeP(i+350, baseY - 180, 120);
      }
      
      // Narrow platforms for precision jumping
      if (i % 900 === 0) {
        makeP(i+250, baseY - 320, 80);
      }
    }
    
    console.log(`[Level2] Created enhanced platform layout for ${worldWidth} width`);
  }

  private createPlayer() {
  // Raise player spawn so feet are higher relative to ground for safer start
  this.player = new Player(this, 100, 400);
    this.add.existing(this.player); this.physics.add.existing(this.player);
    // Lift by half height to ensure no ground clipping at spawn
    this.player.y -= this.player.displayHeight * 0.5;
    if (this.player.body) { (this.player.body as Phaser.Physics.Arcade.Body).updateFromGameObject(); }
  }

  private createCollectibles() {
    this.collectibles = this.physics.add.group({ allowGravity:false, immovable:true });
    
    // More collectibles spread throughout the longer level
    // Ground level collectibles
    for (let i=300;i<5800;i+=400) {
      const food = new DogFood(this, i, 500 - (i%1000===0?100:0));
      food.setScale(0.12); // Consistent with Level1 scaling
      this.collectibles.add(food);
    }
    
    // Platform collectibles for risk/reward gameplay
    for (let i=800;i<5600;i+=600) {
      const food = new DogFood(this, i, 350 - (i%1500===0?120:0));
      food.setScale(0.12);
      this.collectibles.add(food);
    }
    
    // High-risk, high-reward collectibles on difficult platforms
    for (let i=1200;i<5400;i+=800) {
      const food = new DogFood(this, i, 250 - (Math.random() * 50));
      food.setScale(0.12);
      this.collectibles.add(food);
    }
    
    console.log(`[Level2] Created ${this.collectibles.children.size} collectibles`);
  }

  private createEnemies() {
    this.enemies = this.physics.add.group();
    const enemyTypes: any[] = ['walker','jumper','chaser','tank'];
    
    // Much more enemies for increased difficulty
    // Early section: Moderate difficulty
    for (let i=900;i<2000;i+=300) {
      const type = enemyTypes[Math.floor(Math.random()*enemyTypes.length)];
      const enemy = new EnemyDog(this, i, 520, type);
      if (Math.random()<0.2) { 
        enemy.setStationary(true); 
        const body = enemy.body as Phaser.Physics.Arcade.Body; 
        body.setAllowGravity(false); 
        body.immovable=true; 
        body.moves=false; 
      }
      this.enemies.add(enemy);
    }
    
    // Middle section: High difficulty - more enemies, closer together
    for (let i=2000;i<4000;i+=250) {
      const type = enemyTypes[Math.floor(Math.random()*enemyTypes.length)];
      const enemy = new EnemyDog(this, i, 520, type);
      // More stationary obstacles in middle section
      if (Math.random()<0.3) { 
        enemy.setStationary(true); 
        const body = enemy.body as Phaser.Physics.Arcade.Body; 
        body.setAllowGravity(false); 
        body.immovable=true; 
        body.moves=false; 
      }
      this.enemies.add(enemy);
      
      // Add platform enemies occasionally
      if (i % 500 === 0 && Math.random() < 0.6) {
        const platformEnemy = new EnemyDog(this, i, 400, 'jumper');
        this.enemies.add(platformEnemy);
      }
    }
    
    // Final section: Maximum difficulty - dense enemy placement
    for (let i=4000;i<5800;i+=200) {
      const type = enemyTypes[Math.floor(Math.random()*enemyTypes.length)];
      const enemy = new EnemyDog(this, i, 520, type);
      // Even more obstacles near the end
      if (Math.random()<0.4) { 
        enemy.setStationary(true); 
        const body = enemy.body as Phaser.Physics.Arcade.Body; 
        body.setAllowGravity(false); 
        body.immovable=true; 
        body.moves=false; 
      }
      this.enemies.add(enemy);
      
      // More platform enemies in final section
      if (i % 400 === 0) {
        const platformEnemy = new EnemyDog(this, i + 100, 350, Math.random() < 0.5 ? 'chaser' : 'tank');
        this.enemies.add(platformEnemy);
      }
    }
    
    console.log(`[Level2] Created ${this.enemies.children.size} enemies for enhanced difficulty`);
  }

  private createGoal(worldWidth: number) {
    this.goalFlag = this.physics.add.sprite(worldWidth-100, 520, 'tiles') as Phaser.Physics.Arcade.Sprite;
    this.goalFlag.setTint(0x00bcd4).setDisplaySize(64,96).setImmovable(true);
  const finalFood = new DogFood(this, worldWidth-160, 400); finalFood.setScale(0.24); finalFood.setData('isFinal', true); this.collectibles.add(finalFood);
  }

  private setupCamera(worldWidth: number) {
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setBounds(0,0,worldWidth,720);
  }

  private setupCollisions() {
    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.enemies, this.platforms);
    this.physics.add.overlap(this.player, this.collectibles, (p: any,c: any)=>{
      if (c instanceof DogFood) {
        const isFinal = c.getData('isFinal');
        c.collect();
        this.gameState.score += 1; this.registry.set('gameState', this.gameState);
        if (isFinal) this.winLevel();
      }
    });
    this.physics.add.overlap(this.player, this.enemies, (p:any,e:any)=>{
      if (e.takeDamage && p.takeHit) {
        p.takeHit(1);
      }
    });
  }

  private scaleDifficulty() {
    const level = this.gameState.level || 2;
  (this.enemies.children as any).iterate((obj: any) => { if (obj instanceof EnemyDog) { obj.applyDifficulty(level); } return false; });
  }

  private winLevel() {
    this.gameState.isPaused = true;
    this.physics.pause();
    
    // Add completion bonus
    this.gameState.score += 100; // Bigger bonus for completing Level 2
    this.gameState.level = (this.gameState.level || 2) + 1;
    this.registry.set('gameState', this.gameState);
    
    // Create completion UI
    this.createLevel2CompleteUI();
  }
  
  private createLevel2CompleteUI(): void {
    const { width, height } = this.scale.gameSize;
    
    // Semi-transparent overlay
    const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.8);
    overlay.setOrigin(0, 0).setScrollFactor(0).setDepth(1000);
    
    // Main completion container
    const container = this.add.container(width / 2, height / 2);
    container.setScrollFactor(0).setDepth(1001);
    
    // Background panel
    const panel = this.add.rectangle(0, 0, 600, 400, 0x1a252f, 0.95);
    panel.setStrokeStyle(4, 0x00bcd4);
    
    // Title
    const title = this.add.text(0, -140, 'LEVEL 2 COMPLETE!', {
      fontSize: '48px',
      color: '#00bcd4',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    // Congratulations message
    const congrats = this.add.text(0, -80, 'CONGRATULATIONS!', {
      fontSize: '32px',
      color: '#FFD700',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    // Score display
    const scoreText = this.add.text(0, -40, `Final Score: ${this.gameState.score}`, {
      fontSize: '28px',
      color: '#FFFFFF',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5);
    
    // Achievement message
    const achievement = this.add.text(0, 0, 'You have mastered both levels!', {
      fontSize: '20px',
      color: '#ECEFEF',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5);
    
    // Play Again button
    const playAgainBtn = this.add.rectangle(0, 60, 200, 60, 0x27ae60, 1);
    playAgainBtn.setStrokeStyle(3, 0xFFFFFF);
    playAgainBtn.setInteractive({ useHandCursor: true });
    
    const playAgainText = this.add.text(0, 60, 'PLAY AGAIN', {
      fontSize: '24px',
      color: '#FFFFFF',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    // Back to Level 1 button
    const backBtn = this.add.rectangle(0, 130, 200, 60, 0x3498db, 1);
    backBtn.setStrokeStyle(3, 0xFFFFFF);
    backBtn.setInteractive({ useHandCursor: true });
    
    const backText = this.add.text(0, 130, 'LEVEL 1', {
      fontSize: '24px',
      color: '#FFFFFF',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    // Button hover effects
    playAgainBtn.on('pointerover', () => {
      playAgainBtn.setFillStyle(0x2ecc71);
      playAgainBtn.setScale(1.05);
    });
    
    playAgainBtn.on('pointerout', () => {
      playAgainBtn.setFillStyle(0x27ae60);
      playAgainBtn.setScale(1.0);
    });
    
    backBtn.on('pointerover', () => {
      backBtn.setFillStyle(0x5dade2);
      backBtn.setScale(1.05);
    });
    
    backBtn.on('pointerout', () => {
      backBtn.setFillStyle(0x3498db);
      backBtn.setScale(1.0);
    });
    
    // Button click handlers
    playAgainBtn.on('pointerdown', () => {
      this.restartLevel2();
    });
    
    backBtn.on('pointerdown', () => {
      this.goToLevel1();
    });
    
    // Add all elements to container
    container.add([panel, title, congrats, scoreText, achievement, playAgainBtn, playAgainText, backBtn, backText]);
    
    // Entrance animation
    container.setScale(0);
    this.tweens.add({
      targets: container,
      scale: 1,
      duration: 600,
      ease: 'Back.easeOut'
    });
  }
  
  private restartLevel2(): void {
    this.physics.resume();
    this.scene.restart();
  }
  
  private goToLevel1(): void {
    // Reset to Level 1
    this.gameState.level = 1;
    this.registry.set('gameState', this.gameState);
    this.physics.resume();
    this.scene.start('Level1');
  }
}
