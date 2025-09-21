import Phaser from 'phaser';

export class TouchControls extends Phaser.GameObjects.Container {
  public touchState = { left: false, right: false, jumpHeld: false };
  private _jumpPressedPulse = false;
  private _attackPressedPulse = false;

  private dpad!: Phaser.GameObjects.Container;
  private jumpBtn!: Phaser.GameObjects.Arc; // using Arc for simplicity
  private attackBtn!: Phaser.GameObjects.Arc;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0);
    scene.add.existing(this);
    const isMobile = scene.registry.get('isMobile');
    if (!isMobile) return; // Only create on mobile
    this.createControls();
  }

  private createControls() {
    const cam = this.scene.cameras.main;
    const w = cam.width;
    const h = cam.height;
    this.createDPad(160, h - 160);
    this.createJumpButton(w - 120, h - 160);
    this.createAttackButton(w - 240, h - 160);
  }

  private createDPad(x: number, y: number) {
    this.dpad = this.scene.add.container(x, y);
    const bg = this.scene.add.circle(0, 0, 60, 0x000000, 0.3);
    const left = this.scene.add.triangle(-30, 0, 0, -15, 20, 0, 0, 15, 0xffffff, 0.7)
      .setInteractive(new Phaser.Geom.Circle(0, 0, 25), Phaser.Geom.Circle.Contains);
    const right = this.scene.add.triangle(30, 0, 0, -15, -20, 0, 0, 15, 0xffffff, 0.7)
      .setInteractive(new Phaser.Geom.Circle(0, 0, 25), Phaser.Geom.Circle.Contains);
    this.dpad.add([bg, left, right]);
  left.on('pointerdown', () => { this.touchState.left = true; left.setAlpha(1); });
  left.on('pointerup', () => { this.touchState.left = false; left.setAlpha(0.7); });
  left.on('pointerout', () => { this.touchState.left = false; left.setAlpha(0.7); });
  right.on('pointerdown', () => { this.touchState.right = true; right.setAlpha(1); });
  right.on('pointerup', () => { this.touchState.right = false; right.setAlpha(0.7); });
  right.on('pointerout', () => { this.touchState.right = false; right.setAlpha(0.7); });
    this.dpad.setDepth(1000);
  }

  private createJumpButton(x: number, y: number) {
    this.jumpBtn = this.scene.add.circle(x, y, 50, 0x4caf50, 0.7).setInteractive({ useHandCursor: true });
    const label = this.scene.add.text(x, y, 'JUMP', { fontSize: '14px', color: '#fff', fontFamily: 'Arial' }).setOrigin(0.5);
  this.jumpBtn.on('pointerdown', () => { this.touchState.jumpHeld = true; this._jumpPressedPulse = true; this.jumpBtn.setAlpha(1); });
  this.jumpBtn.on('pointerup', () => { this.touchState.jumpHeld = false; this.jumpBtn.setAlpha(0.7); });
  this.jumpBtn.on('pointerout', () => { this.touchState.jumpHeld = false; this.jumpBtn.setAlpha(0.7); });
    this.jumpBtn.setDepth(1000); label.setDepth(1001);
  }

  private createAttackButton(x: number, y: number) {
    this.attackBtn = this.scene.add.circle(x, y, 40, 0xf44336, 0.7).setInteractive({ useHandCursor: true });
    const label = this.scene.add.text(x, y, 'ATK', { fontSize: '12px', color: '#fff', fontFamily: 'Arial' }).setOrigin(0.5);
    this.attackBtn.on('pointerdown', () => { this._attackPressedPulse = true; this.attackBtn.setAlpha(1); });
    this.attackBtn.on('pointerup', () => { this.attackBtn.setAlpha(0.7); });
    this.attackBtn.on('pointerout', () => { this.attackBtn.setAlpha(0.7); });
    this.attackBtn.setDepth(1000); label.setDepth(1001);
  }

  public consumeJumpPressed(): boolean {
    const p = this._jumpPressedPulse;
    this._jumpPressedPulse = false;
    return p;
  }

  public consumeAttackPressed(): boolean {
    const p = this._attackPressedPulse;
    this._attackPressedPulse = false;
    return p;
  }
}