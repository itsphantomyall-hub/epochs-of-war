/**
 * AchievementManager -- event-driven achievement tracking.
 * Loads achievement definitions from config, checks unlock conditions
 * against game events, persists unlocked achievements to localStorage.
 */

import achievementsData from '../../config/achievements.json';

export interface AchievementRequirement {
  type: string;
  threshold: number;
}

export interface AchievementReward {
  type: string;
  value: string | number;
}

export interface AchievementConfig {
  id: string;
  name: string;
  description: string;
  category: string;
  requirement: AchievementRequirement;
  reward: AchievementReward;
}

export interface AchievementState {
  config: AchievementConfig;
  unlocked: boolean;
  unlockedAt: number | null;
}

const STORAGE_KEY = 'eow_achievements';

export class AchievementManager {
  private achievements: Map<string, AchievementState> = new Map();
  private onUnlockCallback: ((achievement: AchievementConfig) => void) | null = null;

  /** Cumulative counters persisted alongside unlocks. */
  private counters: Record<string, number> = {};

  constructor() {
    const configs = (achievementsData as { achievements: AchievementConfig[] }).achievements;
    for (const config of configs) {
      this.achievements.set(config.id, {
        config,
        unlocked: false,
        unlockedAt: null,
      });
    }
    this.load();
  }

  // ── Event-driven checking ──────────────────────────────

  /**
   * Called when a game event occurs. Evaluates all achievements against the
   * event and unlocks any that are newly satisfied.
   */
  check(eventType: string, data: Record<string, number | string> = {}): void {
    for (const [, state] of this.achievements) {
      if (state.unlocked) continue;

      const req = state.config.requirement;
      let satisfied = false;

      switch (req.type) {
        // ── Progression ──
        case 'wins':
          if (eventType === 'win') {
            this.increment('wins');
            satisfied = this.getCounter('wins') >= req.threshold;
          }
          break;
        case 'reach_age':
          if (eventType === 'evolve' && typeof data['age'] === 'number') {
            satisfied = (data['age'] as number) >= req.threshold;
          }
          break;
        case 'campaign_missions_completed':
          if (eventType === 'campaign_complete') {
            this.increment('campaign_missions_completed');
            satisfied = this.getCounter('campaign_missions_completed') >= req.threshold;
          }
          break;
        case 'campaign_stars':
          if (eventType === 'campaign_stars_update' && typeof data['totalStars'] === 'number') {
            satisfied = (data['totalStars'] as number) >= req.threshold;
          }
          break;
        case 'survival_wave':
          if (eventType === 'survival_wave' && typeof data['wave'] === 'number') {
            satisfied = (data['wave'] as number) >= req.threshold;
          }
          break;
        case 'ranked_wins':
          if (eventType === 'ranked_win') {
            this.increment('ranked_wins');
            satisfied = this.getCounter('ranked_wins') >= req.threshold;
          }
          break;
        case 'ai_personality_wins':
          if (eventType === 'ai_personality_win') {
            this.increment('ai_personality_wins');
            satisfied = this.getCounter('ai_personality_wins') >= req.threshold;
          }
          break;

        // ── Combat ──
        case 'win_infantry_only':
          if (eventType === 'win' && data['infantryOnly'] === 1) satisfied = true;
          break;
        case 'win_no_turrets':
          if (eventType === 'win' && data['noTurrets'] === 1) satisfied = true;
          break;
        case 'win_turrets_only':
          if (eventType === 'win' && data['turretsOnly'] === 1) satisfied = true;
          break;
        case 'win_under_time':
          if (eventType === 'win' && typeof data['elapsedTime'] === 'number') {
            satisfied = (data['elapsedTime'] as number) <= req.threshold;
          }
          break;
        case 'infantry_kills_heavy':
          if (eventType === 'kill' && data['killerType'] === 'infantry' && data['victimType'] === 'heavy') {
            this.increment('infantry_kills_heavy');
            satisfied = this.getCounter('infantry_kills_heavy') >= req.threshold;
          }
          break;
        case 'prehistoric_kills_future':
          if (eventType === 'kill' && typeof data['killerAge'] === 'number' && typeof data['victimAge'] === 'number') {
            if ((data['killerAge'] as number) === 1 && (data['victimAge'] as number) === 8) {
              satisfied = true;
            }
          }
          break;
        case 'hero_kills':
          if (eventType === 'hero_kill') {
            this.increment('hero_kills');
            satisfied = this.getCounter('hero_kills') >= req.threshold;
          }
          break;
        case 'special_damage_single':
          if (eventType === 'special_damage' && typeof data['damage'] === 'number') {
            satisfied = (data['damage'] as number) >= req.threshold;
          }
          break;
        case 'win_full_hp':
          if (eventType === 'win' && data['baseHpPercent'] === 100) satisfied = true;
          break;
        case 'unique_units_in_game':
          if (eventType === 'game_end' && typeof data['uniqueUnits'] === 'number') {
            satisfied = (data['uniqueUnits'] as number) >= req.threshold;
          }
          break;

        // ── Social ──
        case 'custom_matches':
          if (eventType === 'custom_match') {
            this.increment('custom_matches');
            satisfied = this.getCounter('custom_matches') >= req.threshold;
          }
          break;
        case 'leaderboard_rank':
          if (eventType === 'leaderboard_update' && typeof data['rank'] === 'number') {
            satisfied = (data['rank'] as number) <= req.threshold;
          }
          break;
        case 'replay_views':
          if (eventType === 'replay_views' && typeof data['views'] === 'number') {
            satisfied = (data['views'] as number) >= req.threshold;
          }
          break;
        case 'tournament_wins':
          if (eventType === 'tournament_win') {
            this.increment('tournament_wins');
            satisfied = this.getCounter('tournament_wins') >= req.threshold;
          }
          break;
      }

      if (satisfied) {
        this.unlock(state.config.id);
      }
    }
  }

  // ── Queries ────────────────────────────────────────────

  getUnlocked(): AchievementConfig[] {
    const result: AchievementConfig[] = [];
    for (const [, state] of this.achievements) {
      if (state.unlocked) result.push(state.config);
    }
    return result;
  }

  getAll(): AchievementState[] {
    return Array.from(this.achievements.values());
  }

  isUnlocked(id: string): boolean {
    return this.achievements.get(id)?.unlocked ?? false;
  }

  // ── Unlock callback ───────────────────────────────────

  setOnUnlock(callback: (achievement: AchievementConfig) => void): void {
    this.onUnlockCallback = callback;
  }

  // ── Internal ──────────────────────────────────────────

  private unlock(id: string): void {
    const state = this.achievements.get(id);
    if (!state || state.unlocked) return;

    state.unlocked = true;
    state.unlockedAt = Date.now();
    this.save();

    if (this.onUnlockCallback) {
      this.onUnlockCallback(state.config);
    }
  }

  private increment(key: string, amount: number = 1): void {
    this.counters[key] = (this.counters[key] ?? 0) + amount;
  }

  private getCounter(key: string): number {
    return this.counters[key] ?? 0;
  }

  // ── Persistence ───────────────────────────────────────

  private save(): void {
    try {
      const unlocked: Record<string, number> = {};
      for (const [id, state] of this.achievements) {
        if (state.unlocked && state.unlockedAt !== null) {
          unlocked[id] = state.unlockedAt;
        }
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        unlocked,
        counters: this.counters,
      }));
    } catch {
      // Ignore storage errors
    }
  }

  private load(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw) as {
        unlocked?: Record<string, number>;
        counters?: Record<string, number>;
      };

      if (data.unlocked) {
        for (const [id, timestamp] of Object.entries(data.unlocked)) {
          const state = this.achievements.get(id);
          if (state) {
            state.unlocked = true;
            state.unlockedAt = timestamp;
          }
        }
      }

      if (data.counters) {
        this.counters = data.counters;
      }
    } catch {
      // Ignore parse errors
    }
  }
}
