import Phaser from 'phaser';
import { TouchControls } from '../ui/TouchControls';

export interface InputState {
  left: boolean;
  right: boolean;
  jumpPressed: boolean; // one-frame edge trigger
  jumpHeld: boolean;    // held for variable height (optional)
  attackPressed: boolean;
}

export class InputController {
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private space: Phaser.Input.Keyboard.Key;
  private w: Phaser.Input.Keyboard.Key;
  private x: Phaser.Input.Keyboard.Key;
  private touch?: TouchControls;

  public state: InputState = {
    left: false,
    right: false,
    jumpPressed: false,
    jumpHeld: false,
    attackPressed: false
  };

  constructor(scene: Phaser.Scene, touch?: TouchControls) {
    if (!scene.input.keyboard) {
      throw new Error('Keyboard input not available');
    }
    this.cursors = scene.input.keyboard.createCursorKeys();
    this.space = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.w = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.x = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);
    this.touch = touch;
  }

  update() {
    const kbLeft = this.cursors.left?.isDown ?? false;
    const kbRight = this.cursors.right?.isDown ?? false;

    const kbJumpPressed = Phaser.Input.Keyboard.JustDown(this.space) ||
      Phaser.Input.Keyboard.JustDown(this.cursors.up!) ||
      Phaser.Input.Keyboard.JustDown(this.w);

    // Debug keyboard input detection
    if (kbJumpPressed) {
      console.log('[InputController] Keyboard jump detected:', {
        space: Phaser.Input.Keyboard.JustDown(this.space),
        up: Phaser.Input.Keyboard.JustDown(this.cursors.up!),
        w: Phaser.Input.Keyboard.JustDown(this.w)
      });
    }

    const kbJumpHeld = this.space.isDown || (this.cursors.up?.isDown ?? false) || this.w.isDown;

    const kbAttackPressed = Phaser.Input.Keyboard.JustDown(this.x);

    const tc = null; // TEMPORARILY DISABLE TOUCH CONTROLS for debugging
    // const tc = this.touch;
  const touchLeft = false; // tc?.touchState.left ?? false;
  const touchRight = false; // tc?.touchState.right ?? false;
    const touchJumpPressed = false; // tc?.consumeJumpPressed?.() ?? false;
  const touchJumpHeld = false; // tc?.touchState.jumpHeld ?? false;
    const touchAttackPressed = false; // tc?.consumeAttackPressed?.() ?? false;

    this.state.left = kbLeft || touchLeft;
    this.state.right = kbRight || touchRight;
    this.state.jumpPressed = kbJumpPressed || touchJumpPressed;
    this.state.jumpHeld = kbJumpHeld || touchJumpHeld;
    this.state.attackPressed = kbAttackPressed || touchAttackPressed;
    
    // Debug logging for jump issue
    if (this.state.jumpPressed) {
      console.log('[InputController] jumpPressed=true, kbJumpPressed=', kbJumpPressed, 'touchJumpPressed=', touchJumpPressed);
    }
  }
}
