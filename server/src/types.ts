/**
 * Shared types for server-client communication.
 */

// ── Client → Server messages ──

export interface SpawnCommand {
  type: 'spawn';
  unitIndex: number;
}

export interface EvolveCommand {
  type: 'evolve';
}

export interface SpecialCommand {
  type: 'special';
  targetX: number;
}

export interface HeroAbilityCommand {
  type: 'heroAbility';
  index: number;
}

export interface PingCommand {
  type: 'ping';
  timestamp: number;
}

export interface JoinQueueCommand {
  type: 'joinQueue';
  playerId: string;
  displayName: string;
}

export interface LeaveQueueCommand {
  type: 'leaveQueue';
}

export interface CustomMatchCreateCommand {
  type: 'customMatchCreate';
  playerId: string;
  displayName: string;
}

export interface CustomMatchJoinCommand {
  type: 'customMatchJoin';
  playerId: string;
  displayName: string;
  roomCode: string;
}

export interface RematchCommand {
  type: 'rematch';
}

export type ClientMessage =
  | SpawnCommand
  | EvolveCommand
  | SpecialCommand
  | HeroAbilityCommand
  | PingCommand
  | JoinQueueCommand
  | LeaveQueueCommand
  | CustomMatchCreateCommand
  | CustomMatchJoinCommand
  | RematchCommand;

// ── Server → Client messages ──

export interface EntitySnapshot {
  id: number;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  faction: 'player' | 'enemy';
  unitType: string;
  alive: boolean;
}

export interface StateDelta {
  type: 'stateDelta';
  tick: number;
  timestamp: number;
  player1: PlayerSnapshot;
  player2: PlayerSnapshot;
  entities: EntitySnapshot[];
  events: GameEvent[];
}

export interface PlayerSnapshot {
  gold: number;
  xp: number;
  currentAge: number;
  baseHp: number;
  baseMaxHp: number;
}

export interface GameEvent {
  kind: 'spawn' | 'death' | 'damage' | 'baseHit' | 'ageUp' | 'special' | 'heroAbility';
  data: Record<string, unknown>;
}

export interface MatchFoundMessage {
  type: 'matchFound';
  roomId: string;
  playerSlot: 1 | 2;
  opponentName: string;
  seed: number;
}

export interface MatchStartMessage {
  type: 'matchStart';
  countdown: number;
}

export interface GameOverMessage {
  type: 'gameOver';
  winner: 1 | 2;
  player1Elo: number;
  player2Elo: number;
  player1EloDelta: number;
  player2EloDelta: number;
}

export interface QueueUpdateMessage {
  type: 'queueUpdate';
  position: number;
  waitTime: number;
}

export interface PongMessage {
  type: 'pong';
  timestamp: number;
  serverTime: number;
}

export interface ErrorMessage {
  type: 'error';
  message: string;
}

export interface InputRejectedMessage {
  type: 'inputRejected';
  command: string;
  reason: string;
}

export interface CustomMatchCreatedMessage {
  type: 'customMatchCreated';
  roomCode: string;
}

export interface ForceSyncMessage {
  type: 'forceSync';
  fullState: StateDelta;
}

export type ServerMessage =
  | StateDelta
  | MatchFoundMessage
  | MatchStartMessage
  | GameOverMessage
  | QueueUpdateMessage
  | PongMessage
  | ErrorMessage
  | InputRejectedMessage
  | CustomMatchCreatedMessage
  | ForceSyncMessage;

// ── Player data ──

export interface PlayerRecord {
  id: string;
  displayName: string;
  elo: number;
  wins: number;
  losses: number;
  matchHistory: MatchResult[];
}

export interface MatchResult {
  matchId: string;
  opponentId: string;
  won: boolean;
  eloDelta: number;
  timestamp: number;
}
