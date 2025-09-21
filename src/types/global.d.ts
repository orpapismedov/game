// Global type definitions for Doggo Run game

export interface TouchInputState {
  left: boolean;
  right: boolean;
  jumpPressed: boolean;   // edge trigger
  jumpHeld: boolean;      // hold for variable height
  attackPressed: boolean; // edge trigger
}

export interface GameState {
  score: number;
  health: number;
  maxHealth: number;
  level: number;
  lives: number;
  time: number;
  isPaused: boolean;
  isMuted: boolean;
}

export interface PlayerState {
  health: number;
  invulnerable: boolean;
  invulnTimer: number;
  facing: 'left' | 'right';
  grounded: boolean;
  attacking: boolean;
  attackCooldown: number;
  jumpHeld: boolean;
  jumpTimer: number;
}

export interface EnemyType {
  type: 'walker' | 'jumper' | 'chaser' | 'tank';
  health: number;
  speed: number;
  damage: number;
  points: number;
  aggroRange?: number;
  patrolRange?: number;
}

export interface LevelData {
  playerStart: { x: number; y: number };
  enemies: Array<{
    x: number;
    y: number;
    type: EnemyType['type'];
  }>;
  collectibles: Array<{
    x: number;
    y: number;
    type: 'dogfood';
  }>;
  platforms: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
  goal: { x: number; y: number };
}

export interface AudioAssets {
  jump: string;
  pickup: string;
  hit: string;
  enemyDown: string;
  bgm: string;
}

export interface ImageAssets {
  player: string;
  enemy1: string;
  enemy2: string;
  enemy3: string;
  enemy4: string;
  dogfood: string;
  tiles: string;
  bgLayer1: string;
  bgLayer2: string;
}

// Extend Phaser namespace for custom properties
declare global {
  namespace Phaser {
    namespace Scenes {
      interface Scene {
        gameState?: GameState;
        touchControls?: any;
      }
    }
  }
}