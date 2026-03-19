/**
 * SaveManager -- auto-save game state during single-player.
 * Serializes to localStorage every 30 seconds, with version field
 * for future migration compatibility.
 */

import { GameState } from '../../types/GameState';

export interface SaveData {
  version: string;
  timestamp: number;
  gameState: GameState;
  playerAge: number;
  enemyAge: number;
  difficulty: string;
  mode: string;
  elapsedTime: number;
}

const STORAGE_KEY = 'eow_save_game';
const SAVE_VERSION = '1.0';
const AUTO_SAVE_INTERVAL = 30; // seconds

export class SaveManager {
  private autoSaveTimer: number = 0;

  // ── Save ──────────────────────────────────────────────

  saveGame(
    state: GameState,
    difficulty: string = 'normal',
    mode: string = 'classic',
  ): void {
    try {
      const data: SaveData = {
        version: SAVE_VERSION,
        timestamp: Date.now(),
        gameState: { ...state },
        playerAge: state.player.currentAge,
        enemyAge: state.enemy.currentAge,
        difficulty,
        mode,
        elapsedTime: state.elapsedTime,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Ignore storage errors
    }
  }

  // ── Load ──────────────────────────────────────────────

  loadGame(): SaveData | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw) as SaveData;

      // Version check — for now only accept same version
      if (data.version !== SAVE_VERSION) return null;
      return data;
    } catch {
      return null;
    }
  }

  // ── Query ─────────────────────────────────────────────

  hasSave(): boolean {
    try {
      return localStorage.getItem(STORAGE_KEY) !== null;
    } catch {
      return false;
    }
  }

  getSaveInfo(): { timestamp: number; mode: string; difficulty: string; elapsedTime: number } | null {
    const data = this.loadGame();
    if (!data) return null;
    return {
      timestamp: data.timestamp,
      mode: data.mode,
      difficulty: data.difficulty,
      elapsedTime: data.elapsedTime,
    };
  }

  // ── Delete ────────────────────────────────────────────

  deleteSave(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }
  }

  // ── Auto-save ─────────────────────────────────────────

  /**
   * Call from the game update loop. Triggers a save every 30 seconds.
   * Returns true if a save occurred this frame.
   */
  updateAutoSave(
    deltaSec: number,
    state: GameState,
    difficulty: string = 'normal',
    mode: string = 'classic',
  ): boolean {
    this.autoSaveTimer += deltaSec;
    if (this.autoSaveTimer >= AUTO_SAVE_INTERVAL) {
      this.autoSaveTimer = 0;
      this.saveGame(state, difficulty, mode);
      return true;
    }
    return false;
  }

  /** Reset the auto-save timer (e.g., on game start). */
  resetAutoSaveTimer(): void {
    this.autoSaveTimer = 0;
  }
}
