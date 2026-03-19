/**
 * Matchmaking -- ELO-based matchmaking queue.
 *
 * - Players join the queue with their ELO
 * - Matches players within 200 ELO (widens over time)
 * - After 30 seconds, matches with anyone available
 * - Default ELO: 1000
 */

import type { WebSocket } from 'ws';
import { GameRoom } from './GameRoom.js';
import { PlayerStore } from './PlayerStore.js';
import type { QueueUpdateMessage } from './types.js';

const BASE_ELO_RANGE = 200;
const MAX_WAIT_SECONDS = 30;
const MATCH_CHECK_INTERVAL_MS = 1000;

interface QueueEntry {
  playerId: string;
  displayName: string;
  elo: number;
  ws: WebSocket;
  joinedAt: number;
}

export class Matchmaking {
  private readonly queue: QueueEntry[] = [];
  private readonly playerStore: PlayerStore;
  private readonly onMatchCreated: (room: GameRoom) => void;
  private checkInterval: ReturnType<typeof setInterval> | null = null;

  constructor(
    playerStore: PlayerStore,
    onMatchCreated: (room: GameRoom) => void
  ) {
    this.playerStore = playerStore;
    this.onMatchCreated = onMatchCreated;
  }

  /** Start the matchmaking loop. */
  start(): void {
    if (this.checkInterval) return;
    this.checkInterval = setInterval(() => this.tryMatch(), MATCH_CHECK_INTERVAL_MS);
  }

  /** Stop the matchmaking loop. */
  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /** Add a player to the matchmaking queue. */
  addToQueue(playerId: string, displayName: string, elo: number, ws: WebSocket): void {
    // Remove if already in queue
    this.removeFromQueue(playerId);

    this.queue.push({
      playerId,
      displayName,
      elo,
      ws,
      joinedAt: Date.now(),
    });

    // Send queue position
    this.sendQueueUpdate(this.queue[this.queue.length - 1]);
  }

  /** Remove a player from the queue. */
  removeFromQueue(playerId: string): void {
    const idx = this.queue.findIndex((e) => e.playerId === playerId);
    if (idx !== -1) {
      this.queue.splice(idx, 1);
    }
  }

  /** Check if a player is in the queue. */
  isInQueue(playerId: string): boolean {
    return this.queue.some((e) => e.playerId === playerId);
  }

  /** Get number of players in queue. */
  get queueSize(): number {
    return this.queue.length;
  }

  /** Try to match players. */
  private tryMatch(): void {
    if (this.queue.length < 2) return;

    // Remove disconnected players
    for (let i = this.queue.length - 1; i >= 0; i--) {
      if (this.queue[i].ws.readyState !== 1) {
        this.queue.splice(i, 1);
      }
    }

    if (this.queue.length < 2) return;

    const now = Date.now();

    // Try to find a match for each player in the queue
    for (let i = 0; i < this.queue.length; i++) {
      const player = this.queue[i];
      const waitSeconds = (now - player.joinedAt) / 1000;

      // Widen ELO range over time
      const eloRange = waitSeconds >= MAX_WAIT_SECONDS
        ? Infinity
        : BASE_ELO_RANGE + (waitSeconds / MAX_WAIT_SECONDS) * 800;

      // Find best match
      let bestMatch: number = -1;
      let bestEloDiff = Infinity;

      for (let j = 0; j < this.queue.length; j++) {
        if (i === j) continue;
        const candidate = this.queue[j];
        const eloDiff = Math.abs(player.elo - candidate.elo);

        if (eloDiff <= eloRange && eloDiff < bestEloDiff) {
          bestMatch = j;
          bestEloDiff = eloDiff;
        }
      }

      if (bestMatch !== -1) {
        const matched = this.queue[bestMatch];

        // Remove both from queue (higher index first to preserve indices)
        const toRemove = [i, bestMatch].sort((a, b) => b - a);
        for (const idx of toRemove) {
          this.queue.splice(idx, 1);
        }

        // Create a game room
        const room = new GameRoom(this.playerStore);
        room.join(player.playerId, player.displayName, player.ws, player.elo);
        room.join(matched.playerId, matched.displayName, matched.ws, matched.elo);

        this.onMatchCreated(room);
        return; // Only match one pair per cycle
      }
    }

    // Send queue updates to remaining players
    for (let i = 0; i < this.queue.length; i++) {
      this.sendQueueUpdate(this.queue[i]);
    }
  }

  private sendQueueUpdate(entry: QueueEntry): void {
    const waitTime = Math.round((Date.now() - entry.joinedAt) / 1000);
    const position = this.queue.indexOf(entry) + 1;
    const msg: QueueUpdateMessage = {
      type: 'queueUpdate',
      position,
      waitTime,
    };
    if (entry.ws.readyState === 1) {
      entry.ws.send(JSON.stringify(msg));
    }
  }
}
