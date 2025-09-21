# 📌 Copilot Task — Upgrade "Doggo Run" to Mobile Phaser 3 Platformer

**Rewrite the current project** so it becomes a polished, mobile-first side-scrolling platformer (Super-Mario style) in **TypeScript + Phaser 3**.
Fix these issues explicitly:

1. **Use my real images** (no colored squares).
2. **Touch controls** by default (no WASD prompts on phones).
3. **Right-scrolling world** with camera follow; player can progress to the goal.
4. **Much better visuals** (parallax, tiles, UI).

## Assets (under `/public/assets`)

Use **these exact filenames** and fail visibly if any are missing:

```
dog.png
dogfood.png
enemy1.png
enemy2.png
enemy3.png
enemy4.png
tiles.png
bg-layer1.png
bg-layer2.png
jump.wav
pickup.wav
hit.wav
enemyDown.wav
bgm.mp3
```

👉 Load with `this.load.image('dog', 'assets/dog.png')` style paths (because `public/` is the web root).
If an asset fails to load, log a clear console error and place a "MISSING TEXTURE" text at the top left.

## Project rules

* Engine: Phaser 3, TypeScript, Vite.
* Virtual resolution: **1280×720**, `Phaser.Scale.FIT`, `autoCenter: CENTER_BOTH`.
* Physics: Arcade, gravity \~**1800**.
* Target: **mobile first** (iPhone/Android). Keyboard only as a *fallback* on desktop.

## Scenes & files (generate/replace)

```
/src
  main.ts
  phaser.config.ts
  /scenes
    BootScene.ts
    PreloadScene.ts
    Level1.ts
    HUDScene.ts
  /entities
    Player.ts
    EnemyDog.ts
    DogFood.ts
  /ui
    TouchControls.ts
/public/index.html  (mobile meta + no scrolling)
/README.md          (how to run + where to put assets)
```

### BootScene.ts

* Set scale mode, pointer settings, and device flags (`isMobile` via Phaser device).
* Immediately start `PreloadScene`.

### PreloadScene.ts

* Load **all images/audio** listed above.
* Simple progress bar.
* After load, start `Level1` and launch `HUDScene`.

### Level1.ts (core gameplay)

* Build a **world wider than the screen** (e.g., width 8000 px).
* Tilemap or programmatic platforms using `tiles.png`.
* Add **parallax** (`bg-layer1`, `bg-layer2`) that repeats to cover world width.
* **Player**:

  * Create from texture `dog` (no Graphics rectangles).
  * Display height \~80–96 px; set body size slightly smaller than sprite.
  * Movement: left/right speed \~180–220 px/s; **variable jump** (tap vs hold).
  * **Head-stomp** kills enemies if falling with sufficient `velocity.y`.
  * **Attack** button spawns a short-lived hitbox in facing direction.
  * 3 hearts; i-frames \~700 ms on hit.
* **Enemies**: create 4 types from `enemy1..enemy4` (walker, jumper, chaser, tank).
* **Collectibles**: `dogfood` items hover; on overlap play `pickup.wav` and add score.
* **Camera**:

  * `camera.startFollow(player, true, 0.08, 0.08)`, add **deadzone**.
  * `setBounds(0, 0, worldWidth, 720)` so it **scrolls to the right** as the player moves.
* **Goal**: a flag/doghouse at world end; trigger a win screen.
* Pause physics when tab/page hidden.

### HUDScene.ts

* Hearts (3), score, timer.
* **Mobile touch UI** (right-hand **Jump**, **Attack** buttons; left-hand **virtual d-pad/joystick**).
* Fullscreen & Mute buttons.
* **Show keyboard hints ONLY on desktop**; NEVER show WASD text on mobile.

### TouchControls.ts

* Render a left thumb **d-pad** (left/right only) and two right thumb buttons.
* Export:

```ts
export interface TouchInputState {
  left: boolean; right: boolean;
  jumpPressed: boolean;  // edge
  jumpHeld: boolean;     // hold for variable jump
  attackPressed: boolean;
}
```

* Scale hit areas with DPR and reposition on resize so they stay ergonomic.

### Player.ts

* `extends Phaser.Physics.Arcade.Sprite` using **'dog'** texture.
* If `dog.png` is a single frame, simulate animations:

  * Idle bob (tween y ±2).
  * Run bob (slightly faster).
  * Fall tilt (rotate a few degrees).
* Methods: `moveLeft/Right/stopX`, `jump(held)`, `attack()`, `takeHit()`, `isOnGround()`.
* Small drop shadow (image or pipeline) for polish.

### EnemyDog.ts

* Base class + configurable type (walker/jumper/chaser/tank).
* Simple state machines; death plays `enemyDown.wav` and a flip/pop animation.

### DogFood.ts

* Bobbing tween; on overlap → collect, `pickup.wav`, floating `+1`.

### phaser.config.ts

* `backgroundColor: '#0e1116'`, scale FIT, 1280×720, Arcade physics, scenes order: Boot → Preload → Level1 (+ HUD).

### index.html (mobile polish)

* `<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">`
* Prevent page scrolling/overscroll; `touch-action: none` on the canvas.

## Input model

* Centralize input in Level1: merge **TouchControls** + keyboard fallback.
* Keyboard (desktop only): Left/Right, Space = jump, **X/CTRL** = attack.
* On **mobile**, keyboard hints must be hidden and **touch UI is the only visible control**.

## Audio

* Loop `bgm.mp3` quietly; mute toggle in HUD.
* `jump.wav`, `pickup.wav`, `hit.wav`, `enemyDown.wav` SFX.

## Visual polish

* Parallax layers with slow scroll; subtle camera shake on hit; fade in/out transitions.
* Rounded body sizes for friendlier collisions.
* Platform tinting from `tiles.png` so it no longer looks like plain gray bars.

## Acceptance criteria (must all pass)

* **Dog/enemy images are visible** (no placeholder rectangles).
* **Touch controls** appear on mobile; **no WASD text** there.
* The **camera follows** the player; the level extends **to the right** and can be finished.
* Looks visually pleasant: parallax, tiles, readable HUD, proper fonts.
* Runs on iPhone Safari/Chrome without page scrolling; 30–60 FPS; no console errors.

## After you generate the code

* Print a short "NEXT STEPS" section with:

  1. where to drop the images (`/public/assets`),
  2. how to run (`npm i && npm run dev`),
  3. how to open on phone (same LAN, http URL),
  4. where to tweak movement speeds and button sizes.

---

**Important debugging note for Copilot:**
If images still don't render, log `this.textures.exists('dog')` and `this.textures.get('dog')` after preload; also ensure the load path is `'assets/<file>'` (not `'/public/assets'`) because `public/` is the web root in Vite.

---