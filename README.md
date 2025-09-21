# 🐕 Doggo Run - Mobile Phaser 3 Platformer

A mobile-first side-scrolling platformer game featuring Momi the dog, built with TypeScript and Phaser 3.

## 🚀 Next Steps

### 1. Add Your Images
Place your dog images in the `/public/assets/` folder with these exact names:

**Required Image Files:**
```
/public/assets/
  ├── dog.png          (Momi - main character)
  ├── dogfood.png      (collectible food item)
  ├── enemy1.png       (walker enemy)
  ├── enemy2.png       (jumper enemy)  
  ├── enemy3.png       (chaser enemy)
  ├── enemy4.png       (tank enemy)
  ├── tiles.png        (platform tiles)
  ├── bg-layer1.png    (background layer 1)
  └── bg-layer2.png    (background layer 2)
```

**Required Audio Files:**
```
/public/assets/
  ├── jump.wav         (jump sound effect)
  ├── pickup.wav       (pickup sound effect)
  ├── hit.wav          (hit sound effect)
  ├── enemyDown.wav    (enemy defeat sound)
  └── bgm.mp3          (background music)
```

### 2. Run the Game
```bash
npm install
npm run dev
```

The game will be available at **http://localhost:3000**

### 3. Test on Mobile
To test on your phone:
1. Make sure your phone and computer are on the same WiFi network
2. Find your computer's IP address (usually something like 192.168.1.xxx)
3. Open your phone's browser and go to: `http://YOUR_IP_ADDRESS:3000`

### 4. Game Features

**Mobile Controls:**
- Virtual D-Pad (left side) - Move left/right
- Jump Button (bottom right) - Jump (hold for higher jump)
- Attack Button (middle right) - Attack enemies

**Desktop Controls:**
- Arrow Keys or WASD - Move
- Space or W - Jump
- X or Ctrl - Attack

**Gameplay:**
- Collect dog food for points
- Jump on enemies to defeat them
- Use attack button for close combat
- Reach the goal at the end of the level
- 3 hearts health system

### 5. Customization

**Movement Speeds** (in `src/entities/Player.ts`):
```typescript
// Adjust these values:
const PLAYER_SPEED = 200;     // Left/right movement speed
const JUMP_VELOCITY = -600;   // Jump strength
```

**Touch Button Sizes** (in `src/ui/TouchControls.ts`):
```typescript
// Adjust button sizes:
const DPAD_SIZE = 60;         // D-pad radius
const JUMP_BUTTON_SIZE = 50;  // Jump button radius  
const ATTACK_BUTTON_SIZE = 40; // Attack button radius
```

**World Size** (in `src/scenes/Level1.ts`):
```typescript
const WORLD_WIDTH = 8000;     // How wide the level is
const WORLD_HEIGHT = 720;     // Level height
```

## 🎮 Game Architecture

- **BootScene** - Device detection and initialization
- **PreloadScene** - Asset loading with fallback textures
- **Level1** - Main gameplay with parallax scrolling
- **HUDScene** - UI overlay with mobile touch controls
- **TouchControls** - Mobile touch input system
- **Player** - Main character with animations
- **EnemyDog** - Enemy AI with 4 different types
- **DogFood** - Collectible items

## 🔧 Troubleshooting

**If images don't show:**
1. Check browser console for asset loading errors
2. Verify image files are in `/public/assets/` with correct names
3. Clear browser cache and reload

**If touch controls don't work:**
1. Make sure you're testing on an actual mobile device
2. Check that touch-action CSS is properly set
3. Try in different mobile browsers

**If the game doesn't start:**
1. Check browser console for JavaScript errors
2. Make sure Node.js and dependencies are installed
3. Try `npm install` again

## 📱 Mobile Optimization

The game is designed mobile-first with:
- Touch-action: none to prevent scrolling
- Responsive scaling (1280x720 virtual resolution)
- High DPI support
- No WASD hints on mobile devices
- Ergonomic touch button placement
- Proper viewport configuration

## 🎵 Audio

- Background music loops automatically (with mute toggle)
- Sound effects for jumping, collecting, combat
- Audio context handles mobile browser restrictions

Enjoy playing Doggo Run! 🐕‍🦺