/**
 * GameRoom -- Manages a single match between 2 players.
 *
 * - join(playerId, ws) adds a player
 * - start() begins when 2 players are connected
 * - Receives input commands, validates via AntiCheat
 * - Runs GameSimulation at 20 ticks/second
 * - Broadcasts state deltas to both clients
 * - Detects game over and broadcasts result
 */

import type { WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { GameSimulation } from './GameSimulation.js';
import { AntiCheat } from './AntiCheat.js';
import { calculateNewRatings } from './EloSystem.js';
import { PlayerStore } from './PlayerStore.js';
import type {
  ClientMessage,
  ServerMessage,
  StateDelta,
  MatchFoundMessage,
  MatchStartMessage,
  GameOverMessage,
  InputRejectedMessage,
  GameEvent,
} from './types.js';

const TICK_RATE_MS = 50;
const SPECIAL_COOLDOWN = 45;
const HERO_ABILITY_COOLDOWN = 20;
const MAX_AGE = 8;
const COUNTDOWN_SECONDS = 3;

interface ConnectedPlayer {
  playerId: string;
  displayName: string;
  ws: WebSocket;
  slot: 1 | 2;
  elo: number;
}

export class GameRoom {
  readonly roomId: string;
  readonly roomCode: string;
  private players: ConnectedPlayer[] = [];
  private simulation: GameSimulation | null = null;
  private antiCheat: AntiCheat;
  private playerStore: PlayerStore;
  private tickInterval: ReturnType<typeof setInterval> | null = null;
  private started: boolean = false;
  private finished: boolean = false;
  private onRoomClosed: ((roomId: string) => void) | null = null;

  constructor(playerStore: PlayerStore, roomCode?: string) {
    this.roomId = uuidv4();
    this.roomCode = roomCode ?? this.generateRoomCode();
    this.antiCheat = new AntiCheat();
    this.playerStore = playerStore;
  }

  /** Set callback for when the room closes. */
  setOnClose(callback: (roomId: string) => void): void {
    this.onRoomClosed = callback;
  }

  /** Number of players currently in the room. */
  get playerCount(): number {
    return this.players.length;
  }

  get isStarted(): boolean {
    return this.started;
  }

  get isFinished(): boolean {
    return this.finished;
  }

  /** Join a player to this room. Returns the slot (1 or 2) or null if full. */
  join(playerId: string, displayName: string, ws: WebSocket, elo: number): 1 | 2 | null {
    if (this.players.length >= 2) return null;

    const slot: 1 | 2 = this.players.length === 0 ? 1 : 2;
    this.players.push({ playerId, displayName, ws, slot, elo });
    this.antiCheat.registerPlayer(playerId);

    // Handle disconnect
    ws.on('close', () => this.handleDisconnect(playerId));

    // If 2 players, start the match
    if (this.players.length === 2) {
      this.start();
    }

    return slot;
  }

  /** Begin the match. Called automatically when 2 players join. */
  private start(): void {
    if (this.started || this.players.length < 2) return;

    const seed = Math.floor(Math.random() * 0x7FFFFFFF);
    this.simulation = new GameSimulation(seed);
    this.started = true;

    const p1 = this.players[0];
    const p2 = this.players[1];

    // Notify both players match found
    this.sendTo(p1, {
      type: 'matchFound',
      roomId: this.roomId,
      playerSlot: 1,
      opponentName: p2.displayName,
      seed,
    });

    this.sendTo(p2, {
      type: 'matchFound',
      roomId: this.roomId,
      playerSlot: 2,
      opponentName: p1.displayName,
      seed,
    });

    // Countdown before game begins
    let countdown = COUNTDOWN_SECONDS;
    const countdownInterval = setInterval(() => {
      this.broadcast({ type: 'matchStart', countdown });
      countdown--;
      if (countdown < 0) {
        clearInterval(countdownInterval);
        this.startSimulation();
      }
    }, 1000);
  }

  private startSimulation(): void {
    // Start the tick loop
    this.tickInterval = setInterval(() => {
      this.tick();
    }, TICK_RATE_MS);
  }

  /** Process one simulation tick. */
  private tick(): void {
    if (!this.simulation || this.finished) return;

    // Update anti-cheat cooldowns
    const deltaSec = TICK_RATE_MS / 1000;
    for (const p of this.players) {
      this.antiCheat.updateCooldowns(p.playerId, deltaSec);
    }

    // Check for timeouts
    for (const p of this.players) {
      if (this.antiCheat.hasTimedOut(p.playerId)) {
        const otherSlot: 1 | 2 = p.slot === 1 ? 2 : 1;
        this.endGame(otherSlot);
        return;
      }
    }

    // Run simulation
    const { delta, events } = this.simulation.update();

    // Build and send state delta
    const stateDelta: StateDelta = {
      type: 'stateDelta',
      tick: delta.tick,
      timestamp: delta.timestamp,
      player1: delta.player1,
      player2: delta.player2,
      entities: delta.entities,
      events,
    };

    this.broadcast(stateDelta);

    // Check for game over
    if (this.simulation.isGameOver && this.simulation.matchWinner !== null) {
      this.endGame(this.simulation.matchWinner);
    }
  }

  /** Handle an incoming message from a player. */
  handleMessage(playerId: string, message: ClientMessage): void {
    if (this.finished || !this.simulation) return;

    const player = this.players.find((p) => p.playerId === playerId);
    if (!player) return;

    // Rate limiting
    if (message.type !== 'ping' && this.antiCheat.isRateLimited(playerId)) {
      this.sendTo(player, {
        type: 'inputRejected',
        command: message.type,
        reason: 'Rate limited',
      });
      return;
    }

    this.antiCheat.recordInput(playerId);

    switch (message.type) {
      case 'spawn':
        this.handleSpawn(player, message.unitIndex);
        break;
      case 'evolve':
        this.handleEvolve(player);
        break;
      case 'special':
        this.handleSpecial(player, message.targetX);
        break;
      case 'heroAbility':
        this.handleHeroAbility(player, message.index);
        break;
      case 'ping':
        this.sendTo(player, {
          type: 'pong',
          timestamp: message.timestamp,
          serverTime: Date.now(),
        });
        break;
    }
  }

  private handleSpawn(player: ConnectedPlayer, unitIndex: number): void {
    if (!this.simulation) return;

    const error = this.simulation.processSpawn(player.slot, unitIndex);
    if (error) {
      this.sendTo(player, {
        type: 'inputRejected',
        command: 'spawn',
        reason: error,
      });
    }
  }

  private handleEvolve(player: ConnectedPlayer): void {
    if (!this.simulation) return;

    const error = this.simulation.processEvolve(player.slot);
    if (error) {
      this.sendTo(player, {
        type: 'inputRejected',
        command: 'evolve',
        reason: error,
      });
    }
  }

  private handleSpecial(player: ConnectedPlayer, targetX: number): void {
    if (!this.simulation) return;

    if (this.antiCheat.isSpecialOnCooldown(player.playerId)) {
      this.sendTo(player, {
        type: 'inputRejected',
        command: 'special',
        reason: 'Special on cooldown',
      });
      return;
    }

    const error = this.simulation.processSpecial(player.slot, targetX);
    if (error) {
      this.sendTo(player, {
        type: 'inputRejected',
        command: 'special',
        reason: error,
      });
    } else {
      this.antiCheat.setSpecialCooldown(player.playerId, SPECIAL_COOLDOWN);
    }
  }

  private handleHeroAbility(player: ConnectedPlayer, index: number): void {
    if (!this.simulation) return;

    if (this.antiCheat.isHeroAbilityOnCooldown(player.playerId, index)) {
      this.sendTo(player, {
        type: 'inputRejected',
        command: 'heroAbility',
        reason: `Hero ability ${index} on cooldown`,
      });
      return;
    }

    const error = this.simulation.processHeroAbility(player.slot, index);
    if (error) {
      this.sendTo(player, {
        type: 'inputRejected',
        command: 'heroAbility',
        reason: error,
      });
    } else {
      this.antiCheat.setHeroAbilityCooldown(player.playerId, index, HERO_ABILITY_COOLDOWN);
    }
  }

  /** End the game and compute ELO. */
  private endGame(winnerSlot: 1 | 2): void {
    if (this.finished) return;
    this.finished = true;

    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }

    const winner = this.players.find((p) => p.slot === winnerSlot);
    const loser = this.players.find((p) => p.slot !== winnerSlot);
    if (!winner || !loser) return;

    // Calculate ELO changes
    const eloResult = calculateNewRatings(winner.elo, loser.elo);

    // Update player store
    this.playerStore.updateElo(winner.playerId, eloResult.winnerNewElo);
    this.playerStore.updateElo(loser.playerId, eloResult.loserNewElo);

    const matchId = this.roomId;
    this.playerStore.recordMatch(winner.playerId, {
      matchId,
      opponentId: loser.playerId,
      won: true,
      eloDelta: eloResult.winnerDelta,
      timestamp: Date.now(),
    });
    this.playerStore.recordMatch(loser.playerId, {
      matchId,
      opponentId: winner.playerId,
      won: false,
      eloDelta: eloResult.loserDelta,
      timestamp: Date.now(),
    });

    // Broadcast game over
    const gameOverMsg: GameOverMessage = {
      type: 'gameOver',
      winner: winnerSlot,
      player1Elo: winnerSlot === 1 ? eloResult.winnerNewElo : eloResult.loserNewElo,
      player2Elo: winnerSlot === 2 ? eloResult.winnerNewElo : eloResult.loserNewElo,
      player1EloDelta: winnerSlot === 1 ? eloResult.winnerDelta : eloResult.loserDelta,
      player2EloDelta: winnerSlot === 2 ? eloResult.winnerDelta : eloResult.loserDelta,
    };

    this.broadcast(gameOverMsg);

    // Clean up
    for (const p of this.players) {
      this.antiCheat.unregisterPlayer(p.playerId);
    }

    this.onRoomClosed?.(this.roomId);
  }

  private handleDisconnect(playerId: string): void {
    const player = this.players.find((p) => p.playerId === playerId);
    if (!player) return;

    if (this.started && !this.finished) {
      // Forfeit: the other player wins
      const otherSlot: 1 | 2 = player.slot === 1 ? 2 : 1;
      this.endGame(otherSlot);
    } else if (!this.started) {
      // Remove from room
      this.players = this.players.filter((p) => p.playerId !== playerId);
      this.antiCheat.unregisterPlayer(playerId);

      if (this.players.length === 0) {
        this.onRoomClosed?.(this.roomId);
      }
    }
  }

  /** Send a message to a single player. */
  private sendTo(player: ConnectedPlayer, message: ServerMessage): void {
    if (player.ws.readyState === 1) { // WebSocket.OPEN
      player.ws.send(JSON.stringify(message));
    }
  }

  /** Broadcast a message to all players. */
  private broadcast(message: ServerMessage): void {
    const data = JSON.stringify(message);
    for (const p of this.players) {
      if (p.ws.readyState === 1) {
        p.ws.send(data);
      }
    }
  }

  /** Generate a 6-character alphanumeric room code. */
  private generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I/O/0/1 for clarity
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  }
}
