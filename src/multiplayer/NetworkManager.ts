/**
 * NetworkManager -- WebSocket client for multiplayer.
 *
 * - connect(serverUrl) -- establishes WebSocket connection
 * - sendInput(command) -- sends player input to server
 * - onStateUpdate(callback) -- receives authoritative state
 * - onMatchFound(callback) -- notified when matched
 * - disconnect() -- clean disconnect
 * - Auto-reconnect with 3 retries, 2-second backoff
 * - Heartbeat ping every 5 seconds
 */

export interface ClientCommand {
  type: 'spawn' | 'evolve' | 'special' | 'heroAbility' | 'ping' |
        'joinQueue' | 'leaveQueue' | 'customMatchCreate' | 'customMatchJoin' | 'rematch';
  [key: string]: unknown;
}

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

export interface PlayerSnapshot {
  gold: number;
  xp: number;
  currentAge: number;
  baseHp: number;
  baseMaxHp: number;
}

export interface StateDelta {
  type: 'stateDelta';
  tick: number;
  timestamp: number;
  player1: PlayerSnapshot;
  player2: PlayerSnapshot;
  entities: EntitySnapshot[];
  events: Array<{
    kind: string;
    data: Record<string, unknown>;
  }>;
}

export interface MatchFoundData {
  roomId: string;
  playerSlot: 1 | 2;
  opponentName: string;
  seed: number;
}

export interface GameOverData {
  winner: 1 | 2;
  player1Elo: number;
  player2Elo: number;
  player1EloDelta: number;
  player2EloDelta: number;
}

export interface QueueUpdateData {
  position: number;
  waitTime: number;
}

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

const MAX_RETRIES = 3;
const RETRY_BACKOFF_MS = 2000;
const HEARTBEAT_INTERVAL_MS = 5000;

export class NetworkManager {
  private ws: WebSocket | null = null;
  private serverUrl: string = '';
  private _state: ConnectionState = 'disconnected';
  private retryCount: number = 0;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private _latency: number = 0;

  // Callbacks
  private onStateUpdateCallback: ((delta: StateDelta) => void) | null = null;
  private onMatchFoundCallback: ((data: MatchFoundData) => void) | null = null;
  private onMatchStartCallback: ((countdown: number) => void) | null = null;
  private onGameOverCallback: ((data: GameOverData) => void) | null = null;
  private onQueueUpdateCallback: ((data: QueueUpdateData) => void) | null = null;
  private onInputRejectedCallback: ((command: string, reason: string) => void) | null = null;
  private onCustomMatchCreatedCallback: ((roomCode: string) => void) | null = null;
  private onErrorCallback: ((message: string) => void) | null = null;
  private onDisconnectCallback: (() => void) | null = null;
  private onConnectedCallback: (() => void) | null = null;

  get state(): ConnectionState {
    return this._state;
  }

  get latency(): number {
    return this._latency;
  }

  get isConnected(): boolean {
    return this._state === 'connected';
  }

  // ── Connection ──

  connect(serverUrl: string): void {
    this.serverUrl = serverUrl;
    this.retryCount = 0;
    this.doConnect();
  }

  disconnect(): void {
    this.stopHeartbeat();
    this.retryCount = MAX_RETRIES; // Prevent reconnect
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    this._state = 'disconnected';
  }

  private doConnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this._state = this.retryCount > 0 ? 'reconnecting' : 'connecting';

    try {
      this.ws = new WebSocket(this.serverUrl);
    } catch {
      this.handleReconnect();
      return;
    }

    this.ws.onopen = () => {
      this._state = 'connected';
      this.retryCount = 0;
      this.startHeartbeat();
      this.onConnectedCallback?.();
    };

    this.ws.onmessage = (event) => {
      this.handleMessage(event.data as string);
    };

    this.ws.onclose = () => {
      this.stopHeartbeat();
      if (this._state !== 'disconnected') {
        this.handleReconnect();
      }
    };

    this.ws.onerror = () => {
      // onclose will fire after this
    };
  }

  private handleReconnect(): void {
    if (this.retryCount >= MAX_RETRIES) {
      this._state = 'disconnected';
      this.onDisconnectCallback?.();
      return;
    }

    this._state = 'reconnecting';
    this.retryCount++;
    const delay = RETRY_BACKOFF_MS * this.retryCount;
    setTimeout(() => this.doConnect(), delay);
  }

  // ── Heartbeat ──

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      this.sendRaw({ type: 'ping', timestamp: Date.now() });
    }, HEARTBEAT_INTERVAL_MS);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // ── Sending ──

  sendInput(command: ClientCommand): void {
    this.sendRaw(command);
  }

  private sendRaw(data: Record<string, unknown>): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  // ── Message handling ──

  private handleMessage(raw: string): void {
    let msg: Record<string, unknown>;
    try {
      msg = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return;
    }

    switch (msg['type']) {
      case 'stateDelta':
        this.onStateUpdateCallback?.(msg as unknown as StateDelta);
        break;

      case 'matchFound':
        this.onMatchFoundCallback?.({
          roomId: msg['roomId'] as string,
          playerSlot: msg['playerSlot'] as 1 | 2,
          opponentName: msg['opponentName'] as string,
          seed: msg['seed'] as number,
        });
        break;

      case 'matchStart':
        this.onMatchStartCallback?.(msg['countdown'] as number);
        break;

      case 'gameOver':
        this.onGameOverCallback?.(msg as unknown as GameOverData);
        break;

      case 'queueUpdate':
        this.onQueueUpdateCallback?.({
          position: msg['position'] as number,
          waitTime: msg['waitTime'] as number,
        });
        break;

      case 'pong':
        this._latency = Date.now() - (msg['timestamp'] as number);
        break;

      case 'inputRejected':
        this.onInputRejectedCallback?.(
          msg['command'] as string,
          msg['reason'] as string,
        );
        break;

      case 'customMatchCreated':
        this.onCustomMatchCreatedCallback?.(msg['roomCode'] as string);
        break;

      case 'error':
        this.onErrorCallback?.(msg['message'] as string);
        break;

      case 'forceSync':
        this.onStateUpdateCallback?.(
          (msg['fullState'] as unknown as StateDelta),
        );
        break;
    }
  }

  // ── Callback setters ──

  onStateUpdate(callback: (delta: StateDelta) => void): void {
    this.onStateUpdateCallback = callback;
  }

  onMatchFound(callback: (data: MatchFoundData) => void): void {
    this.onMatchFoundCallback = callback;
  }

  onMatchStart(callback: (countdown: number) => void): void {
    this.onMatchStartCallback = callback;
  }

  onGameOver(callback: (data: GameOverData) => void): void {
    this.onGameOverCallback = callback;
  }

  onQueueUpdate(callback: (data: QueueUpdateData) => void): void {
    this.onQueueUpdateCallback = callback;
  }

  onInputRejected(callback: (command: string, reason: string) => void): void {
    this.onInputRejectedCallback = callback;
  }

  onCustomMatchCreated(callback: (roomCode: string) => void): void {
    this.onCustomMatchCreatedCallback = callback;
  }

  onError(callback: (message: string) => void): void {
    this.onErrorCallback = callback;
  }

  onDisconnect(callback: () => void): void {
    this.onDisconnectCallback = callback;
  }

  onConnected(callback: () => void): void {
    this.onConnectedCallback = callback;
  }
}
