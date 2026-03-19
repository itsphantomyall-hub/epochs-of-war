/**
 * DailyChallengeManager -- selects 3 daily challenges per day using
 * the UTC date as a seed, tracks progress, and resets at midnight UTC.
 * Also manages a weekly challenge that persists Monday-Sunday.
 */

import dailiesData from '../../config/dailies.json';

export interface DailyChallengeRequirement {
  type: string;
  target: number;
  unitType?: string;
  maxAge?: number;
  age?: number;
  maxTime?: number;
  maxGold?: number;
  minHpPercent?: number;
}

export interface DailyChallengeConfig {
  id: string;
  category: string;
  description: string;
  requirement: DailyChallengeRequirement;
  reward: { coins: number };
}

export interface WeeklyChallengeConfig {
  id: string;
  description: string;
  requirement: { type: string; target: number };
  reward: { coins: number; cosmetic: string };
}

export interface DailyChallengeState {
  config: DailyChallengeConfig;
  progress: number;
  completed: boolean;
}

export interface WeeklyChallengeState {
  config: WeeklyChallengeConfig;
  progress: number;
  completed: boolean;
}

interface DailyStorageData {
  dateKey: string;
  challengeIds: string[];
  progress: Record<string, number>;
  completed: Record<string, boolean>;
  bonusClaimed: boolean;
  weekKey: string;
  weeklyId: string;
  weeklyProgress: number;
  weeklyCompleted: boolean;
}

const STORAGE_KEY = 'eow_daily_challenges';

export class DailyChallengeManager {
  private pool: DailyChallengeConfig[];
  private weeklyPool: WeeklyChallengeConfig[];
  private todayChallenges: DailyChallengeState[] = [];
  private weeklyChallenge: WeeklyChallengeState | null = null;
  private bonusClaimed: boolean = false;

  constructor() {
    this.pool = (dailiesData as {
      dailyChallenges: DailyChallengeConfig[];
      weeklyChallenges: WeeklyChallengeConfig[];
    }).dailyChallenges;
    this.weeklyPool = (dailiesData as {
      dailyChallenges: DailyChallengeConfig[];
      weeklyChallenges: WeeklyChallengeConfig[];
    }).weeklyChallenges;

    this.loadOrGenerate();
  }

  // ── Queries ────────────────────────────────────────────

  getChallenges(): DailyChallengeState[] {
    return this.todayChallenges;
  }

  getWeeklyChallenge(): WeeklyChallengeState | null {
    return this.weeklyChallenge;
  }

  getCompletedCount(): number {
    return this.todayChallenges.filter((c) => c.completed).length;
  }

  isCompleted(challengeId: string): boolean {
    const ch = this.todayChallenges.find((c) => c.config.id === challengeId);
    return ch?.completed ?? false;
  }

  getAllCompleted(): boolean {
    return this.todayChallenges.every((c) => c.completed);
  }

  isBonusClaimed(): boolean {
    return this.bonusClaimed;
  }

  claimBonus(): number {
    if (!this.getAllCompleted() || this.bonusClaimed) return 0;
    this.bonusClaimed = true;
    this.save();
    return 100; // bonus chest coins
  }

  // ── Progress updates ──────────────────────────────────

  updateProgress(challengeType: string, value: number = 1): void {
    for (const ch of this.todayChallenges) {
      if (ch.completed) continue;
      if (ch.config.requirement.type === challengeType) {
        ch.progress = Math.min(ch.progress + value, ch.config.requirement.target);
        if (ch.progress >= ch.config.requirement.target) {
          ch.completed = true;
        }
      }
    }

    // Weekly challenge progress
    if (this.weeklyChallenge && !this.weeklyChallenge.completed) {
      if (this.weeklyChallenge.config.requirement.type === challengeType) {
        this.weeklyChallenge.progress = Math.min(
          this.weeklyChallenge.progress + value,
          this.weeklyChallenge.config.requirement.target,
        );
        if (this.weeklyChallenge.progress >= this.weeklyChallenge.config.requirement.target) {
          this.weeklyChallenge.completed = true;
        }
      }
    }

    this.save();
  }

  // ── Date/seed logic ───────────────────────────────────

  private getDateKey(): string {
    const now = new Date();
    return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`;
  }

  private getWeekKey(): string {
    const now = new Date();
    // ISO week: Monday = start
    const jan1 = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
    const days = Math.floor((now.getTime() - jan1.getTime()) / 86400000);
    const weekNum = Math.ceil((days + jan1.getUTCDay() + 1) / 7);
    return `${now.getUTCFullYear()}-W${String(weekNum).padStart(2, '0')}`;
  }

  /** Simple deterministic hash for seeded random selection. */
  private hashSeed(seed: string): number {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      const char = seed.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 32-bit integer
    }
    return Math.abs(hash);
  }

  /** Select n unique items from an array using a seed. */
  private seededSelect<T>(items: T[], count: number, seed: string): T[] {
    const hash = this.hashSeed(seed);
    const available = [...items];
    const selected: T[] = [];

    for (let i = 0; i < Math.min(count, available.length); i++) {
      const idx = (hash + i * 7919 + i * i * 104729) % available.length;
      const realIdx = Math.abs(idx) % available.length;
      selected.push(available[realIdx]);
      available.splice(realIdx, 1);
    }

    return selected;
  }

  // ── Load / generate ───────────────────────────────────

  private loadOrGenerate(): void {
    const dateKey = this.getDateKey();
    const weekKey = this.getWeekKey();

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw) as DailyStorageData;

        if (data.dateKey === dateKey) {
          // Restore today's challenges
          this.todayChallenges = data.challengeIds.map((id) => {
            const config = this.pool.find((c) => c.id === id);
            if (!config) return null;
            return {
              config,
              progress: data.progress[id] ?? 0,
              completed: data.completed[id] ?? false,
            };
          }).filter(Boolean) as DailyChallengeState[];
          this.bonusClaimed = data.bonusClaimed ?? false;

          // Restore weekly if same week
          if (data.weekKey === weekKey && data.weeklyId) {
            const wConfig = this.weeklyPool.find((w) => w.id === data.weeklyId);
            if (wConfig) {
              this.weeklyChallenge = {
                config: wConfig,
                progress: data.weeklyProgress ?? 0,
                completed: data.weeklyCompleted ?? false,
              };
            }
          }

          if (this.todayChallenges.length === 3) return; // valid restore
        }
      }
    } catch {
      // Ignore parse errors
    }

    // Generate new daily challenges
    const selected = this.seededSelect(this.pool, 3, dateKey);
    this.todayChallenges = selected.map((config) => ({
      config,
      progress: 0,
      completed: false,
    }));
    this.bonusClaimed = false;

    // Generate weekly challenge if not already loaded
    if (!this.weeklyChallenge) {
      const weeklySelected = this.seededSelect(this.weeklyPool, 1, weekKey);
      if (weeklySelected.length > 0) {
        this.weeklyChallenge = {
          config: weeklySelected[0],
          progress: 0,
          completed: false,
        };
      }
    }

    this.save();
  }

  // ── Persistence ───────────────────────────────────────

  private save(): void {
    try {
      const data: DailyStorageData = {
        dateKey: this.getDateKey(),
        challengeIds: this.todayChallenges.map((c) => c.config.id),
        progress: {},
        completed: {},
        bonusClaimed: this.bonusClaimed,
        weekKey: this.getWeekKey(),
        weeklyId: this.weeklyChallenge?.config.id ?? '',
        weeklyProgress: this.weeklyChallenge?.progress ?? 0,
        weeklyCompleted: this.weeklyChallenge?.completed ?? false,
      };

      for (const ch of this.todayChallenges) {
        data.progress[ch.config.id] = ch.progress;
        data.completed[ch.config.id] = ch.completed;
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Ignore storage errors
    }
  }
}
