/** Full game state interface */

export interface PlayerState {
  gold: number;
  xp: number;
  currentAge: number;
  baseHp: number;
  baseMaxHp: number;
}

export interface GameState {
  player: PlayerState;
  enemy: PlayerState;
  elapsedTime: number;
  isPaused: boolean;
  isGameOver: boolean;
  winner: 'player' | 'enemy' | null;
  overtimeActive: boolean;
  overtimeDamagePerSecond: number;
}

export function createInitialPlayerState(): PlayerState {
  return {
    gold: 50,
    xp: 0,
    currentAge: 1,
    baseHp: 500,
    baseMaxHp: 500,
  };
}

export function createInitialGameState(): GameState {
  return {
    player: createInitialPlayerState(),
    enemy: createInitialPlayerState(),
    elapsedTime: 0,
    isPaused: false,
    isGameOver: false,
    winner: null,
    overtimeActive: false,
    overtimeDamagePerSecond: 0,
  };
}
