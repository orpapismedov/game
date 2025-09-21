import Phaser from 'phaser';

export class PreloadScene extends Phaser.Scene {
  private loadingBar!: Phaser.GameObjects.Graphics;
  private progressBox!: Phaser.GameObjects.Graphics;
  private loadingText!: Phaser.GameObjects.Text;
  private percentText!: Phaser.GameObjects.Text;
  private missingAssets: string[] = [];

  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload() {
    this.createLoadingScreen();
    this.loadAssets();
    this.setupLoadingEvents();
  }

  private createLoadingScreen() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Background
    this.add.rectangle(width / 2, height / 2, width, height, 0x0e1116);

    // Title
    this.add.text(width / 2, height / 2 - 100, 'Doggo Run', {
      fontSize: '48px',
      color: '#ffffff',
      fontFamily: 'Arial'
    }).setOrigin(0.5);

    // Progress box
    this.progressBox = this.add.graphics();
    this.progressBox.fillStyle(0x222222);
    this.progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);

    // Loading bar
    this.loadingBar = this.add.graphics();

    // Loading text
    this.loadingText = this.add.text(width / 2, height / 2 + 50, 'Loading...', {
      fontSize: '20px',
      color: '#ffffff',
      fontFamily: 'Arial'
    }).setOrigin(0.5);

    // Percent text
    this.percentText = this.add.text(width / 2, height / 2, '0%', {
      fontSize: '18px',
      color: '#ffffff',
      fontFamily: 'Arial'
    }).setOrigin(0.5);
  }

  private loadAssets() {
    // Image assets - using your actual filenames
    const imageAssets = [
      { key: 'dog', filename: 'momi.png' },        // Main character
      { key: 'dogfood', filename: 'food.png' },    // Collectible
      { key: 'enemy1', filename: 'dog1.png' },     // Enemy 1
      { key: 'enemy2', filename: 'dog2.png' },     // Enemy 2
      { key: 'enemy3', filename: 'dog3.png' },     // Enemy 3
      { key: 'enemy4', filename: 'dog4.png' },     // Enemy 4
    ];

    // Load your images
    imageAssets.forEach(({ key, filename }) => {
      try {
        this.load.image(key, `assets/${filename}`);
        console.log(`Loading ${key} from assets/${filename}`);
      } catch (error) {
        console.error(`Failed to load image: ${filename}`);
        this.missingAssets.push(filename);
      }
    });

    // Create placeholder textures for missing optional assets
    this.load.image('tiles', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==');
    this.load.image('bg-layer1', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==');
    this.load.image('bg-layer2', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==');

    // Audio placeholders (commented out for now since you don't have audio files yet)
    /*
    const audioAssets = ['jump', 'pickup', 'hit', 'enemyDown', 'bgm'];
    audioAssets.forEach(key => {
      const extension = key === 'bgm' ? '.mp3' : '.wav';
      try {
        this.load.audio(key, `assets/${key}${extension}`);
      } catch (error) {
        console.error(`Failed to load audio: ${key}${extension}`);
        this.missingAssets.push(`${key}${extension}`);
      }
    });
    */

    // Add error handling for missing files
    this.load.on('loaderror', (file: any) => {
      console.error('Failed to load asset:', file.key);
      this.missingAssets.push(file.key);
    });

    // After each image loads, attempt to strip near-white background in a canvas and replace texture
    this.load.on(Phaser.Loader.Events.FILE_COMPLETE, (key: string, type: string) => {
      if (type !== 'image') return;
      if (!this.textures.exists(key)) return;
      try {
        const srcTex = this.textures.get(key);
        const src = srcTex.getSourceImage() as HTMLImageElement | HTMLCanvasElement;
        const canvas = document.createElement('canvas');
        canvas.width = src.width; canvas.height = src.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(src, 0, 0);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i], g = data[i+1], b = data[i+2];
          // If pixel is near-white background (all channels high & low variance) make it transparent
            if (r > 235 && g > 235 && b > 235 && Math.max(r,g,b) - Math.min(r,g,b) < 8) {
              data[i+3] = 0; // alpha
            }
        }
        ctx.putImageData(imgData, 0, 0);
        const newKey = key + '_trimmed';
        this.textures.remove(newKey);
  this.textures.addImage(newKey, canvas as any);
        // Replace original frame with trimmed if significant transparency introduced
        // Heuristic: sample a few corners; if any became transparent adopt new key by renaming
        const sample = ctx.getImageData(0,0,10,10).data;
        let transparentCount = 0;
        for (let i=3;i<sample.length;i+=4) if (sample[i] === 0) { transparentCount++; }
        if (transparentCount > 5) {
          // Swap: remove original and re-add under original key for downstream code transparency
          this.textures.remove(key);
          this.textures.addImage(key, canvas as any);
          console.log('[PreloadScene] Applied background transparency to', key);
        }
      } catch(err) {
        console.warn('[PreloadScene] Could not process image for bg removal', key, err);
      }
    });
  }

  private setupLoadingEvents() {
    this.load.on('progress', (value: number) => {
      this.percentText.setText(Math.floor(value * 100) + '%');
      
      // Update loading bar
      this.loadingBar.clear();
      this.loadingBar.fillStyle(0x4CAF50);
      this.loadingBar.fillRect(
        this.cameras.main.width / 2 - 150, 
        this.cameras.main.height / 2 - 15, 
        300 * value, 
        30
      );
    });

    this.load.on('fileprogress', (file: any) => {
      this.loadingText.setText('Loading: ' + file.key);
    });

    this.load.on('complete', () => {
      this.loadingText.setText('Complete!');
      
      // Check for missing assets
      if (this.missingAssets.length > 0) {
        console.warn('Missing assets:', this.missingAssets);
        this.showMissingAssetWarning();
      }
      
      // Create fallback textures for missing assets
      this.createFallbackTextures();
      
      // Start game after delay
      this.time.delayedCall(1000, () => {
        this.scene.start('Level1');
        this.scene.launch('HUDScene');
        // Secondary gameready dispatch once gameplay actually begins
        window.dispatchEvent(new CustomEvent('gameready'));
      });
    });
  }

  private showMissingAssetWarning() {
    this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2 + 100, 
      'MISSING TEXTURES - Check console', {
      fontSize: '16px',
      color: '#ff4444',
      fontFamily: 'Arial'
    }).setOrigin(0.5);
  }

  private createFallbackTextures() {
    const graphics = this.add.graphics();
    
    // Create fallback textures only for assets that failed to load
    const fallbacks = [
      { key: 'dog', color: 0xff6b6b, size: 64 },        // Red for Momi
      { key: 'dogfood', color: 0xffd93d, size: 32 },    // Yellow for food
      { key: 'enemy1', color: 0x6bcf7f, size: 48 },     // Green for enemy1
      { key: 'enemy2', color: 0x4ecdc4, size: 48 },     // Teal for enemy2
      { key: 'enemy3', color: 0x45b7d1, size: 48 },     // Blue for enemy3
      { key: 'enemy4', color: 0x96ceb4, size: 48 },     // Light green for enemy4
      { key: 'tiles', color: 0x8b4513, size: 32 },      // Brown for tiles
      { key: 'bg-layer1', color: 0x87ceeb, size: 128 }, // Sky blue for bg
      { key: 'bg-layer2', color: 0x98d8e8, size: 128 }  // Light blue for fg
    ];

    fallbacks.forEach(({ key, color, size }) => {
      if (!this.textures.exists(key)) {
        graphics.clear();
        graphics.fillStyle(color);
        graphics.fillRect(0, 0, size, size);
        graphics.generateTexture(key, size, size);
        console.log(`Created fallback texture for: ${key}`);
      } else {
        console.log(`✓ Successfully loaded: ${key}`);
      }
    });

    graphics.destroy();
  }
}