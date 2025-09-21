import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    target: 'es2015'
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
    open: false
  },
  assetsInclude: ['**/*.png', '**/*.jpg', '**/*.wav', '**/*.mp3'],
  optimizeDeps: {
    include: ['phaser']
  }
});