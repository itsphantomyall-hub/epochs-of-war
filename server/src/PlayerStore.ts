/**
 * PlayerStore -- In-memory player data storage.
 *
 * Can be replaced with a database later.
 */

import type { PlayerRecord, MatchResult } from './types.js';

const DEFAULT_ELO = 1000;
const MAX_HISTORY = 50;

export class PlayerStore {
  private readonly players: Map<string, PlayerRecord> = new Map();

  /** Get or create a player record. */
  getPlayer(id: string, displayName?: string): PlayerRecord {
    let player = this.players.get(id);
    if (!player) {
      player = {
        id,
        displayName: displayName ?? `Player_${id.slice(0, 6)}`,
        elo: DEFAULT_ELO,
        wins: 0,
        losses: 0,
        matchHistory: [],
      };
      this.players.set(id, player);
    }
    if (displayName && player.displayName !== displayName) {
      player.displayName = displayName;
    }
    return player;
  }

  /** Update a player's ELO. */
  updateElo(id: string, newElo: number): void {
    const player = this.players.get(id);
    if (player) {
      player.elo = newElo;
    }
  }

  /** Record the result of a match. */
  recordMatch(id: string, result: MatchResult): void {
    const player = this.players.get(id);
    if (!player) return;

    if (result.won) {
      player.wins++;
    } else {
      player.losses++;
    }

    player.matchHistory.push(result);
    if (player.matchHistory.length > MAX_HISTORY) {
      player.matchHistory.shift();
    }
  }

  /** Get all player IDs. */
  getAllPlayerIds(): string[] {
    return Array.from(this.players.keys());
  }
}
