/**
 * ReplayRecorder -- Records match inputs for replay.
 *
 * Stores: seed, all input commands with timestamps.
 * Serializes to JSON for localStorage persistence.
 */

interface ReplayInput {
  playerId: string;
  command: Record<string, unknown>;
  timestamp: number;
}

interface ReplayData {
  version: 1;
  matchId: string;
  seed: number;
  startTime: number;
  duration: number;
  player1Id: string;
  player2Id: string;
  inputs: ReplayInput[];
}

const REPLAY_STORAGE_PREFIX = 'eow_replay_';
const MAX_STORED_REPLAYS = 10;

export class ReplayRecorder {
  private seed: number = 0;
  private matchId: string = '';
  private startTime: number = 0;
  private player1Id: string = '';
  private player2Id: string = '';
  private inputs: ReplayInput[] = [];
  private recording: boolean = false;

  /**
   * Start recording a new match.
   */
  startRecording(
    seed: number,
    matchId: string,
    player1Id: string,
    player2Id: string
  ): void {
    this.seed = seed;
    this.matchId = matchId;
    this.startTime = Date.now();
    this.player1Id = player1Id;
    this.player2Id = player2Id;
    this.inputs = [];
    this.recording = true;
  }

  /**
   * Record an input command.
   */
  recordInput(playerId: string, command: Record<string, unknown>, timestamp?: number): void {
    if (!this.recording) return;

    this.inputs.push({
      playerId,
      command,
      timestamp: timestamp ?? Date.now() - this.startTime,
    });
  }

  /**
   * Stop recording and return the replay data.
   */
  stopRecording(): ReplayData {
    this.recording = false;
    return this.getReplay();
  }

  /**
   * Get the current replay data.
   */
  getReplay(): ReplayData {
    return {
      version: 1,
      matchId: this.matchId,
      seed: this.seed,
      startTime: this.startTime,
      duration: Date.now() - this.startTime,
      player1Id: this.player1Id,
      player2Id: this.player2Id,
      inputs: [...this.inputs],
    };
  }

  /**
   * Save the replay to localStorage.
   */
  saveReplay(matchId?: string): boolean {
    const id = matchId ?? this.matchId;
    if (!id) return false;

    try {
      const replay = this.getReplay();
      const key = REPLAY_STORAGE_PREFIX + id;
      localStorage.setItem(key, JSON.stringify(replay));

      // Manage stored replay count
      this.pruneOldReplays();
      return true;
    } catch {
      // localStorage might be full or unavailable
      return false;
    }
  }

  /**
   * Load a replay from localStorage.
   */
  static loadReplay(matchId: string): ReplayData | null {
    try {
      const key = REPLAY_STORAGE_PREFIX + matchId;
      const data = localStorage.getItem(key);
      if (!data) return null;
      return JSON.parse(data) as ReplayData;
    } catch {
      return null;
    }
  }

  /**
   * Get all stored replay IDs.
   */
  static getStoredReplayIds(): string[] {
    const ids: string[] = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(REPLAY_STORAGE_PREFIX)) {
          ids.push(key.slice(REPLAY_STORAGE_PREFIX.length));
        }
      }
    } catch {
      // localStorage unavailable
    }
    return ids;
  }

  /**
   * Remove old replays when over the limit.
   */
  private pruneOldReplays(): void {
    try {
      const replayKeys: { key: string; time: number }[] = [];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(REPLAY_STORAGE_PREFIX)) {
          const data = localStorage.getItem(key);
          if (data) {
            try {
              const replay = JSON.parse(data) as ReplayData;
              replayKeys.push({ key, time: replay.startTime });
            } catch {
              // Corrupted replay, remove it
              localStorage.removeItem(key);
            }
          }
        }
      }

      // Sort by time (oldest first) and remove excess
      replayKeys.sort((a, b) => a.time - b.time);
      while (replayKeys.length > MAX_STORED_REPLAYS) {
        const oldest = replayKeys.shift();
        if (oldest) {
          localStorage.removeItem(oldest.key);
        }
      }
    } catch {
      // localStorage unavailable
    }
  }

  /** Whether currently recording. */
  get isRecording(): boolean {
    return this.recording;
  }

  /** Reset the recorder. */
  reset(): void {
    this.recording = false;
    this.inputs = [];
    this.seed = 0;
    this.matchId = '';
    this.startTime = 0;
  }
}
