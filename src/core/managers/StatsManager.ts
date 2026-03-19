/**
 * StatsManager -- persistent player statistics.
 * Tracks lifetime totals, favorites, and records.
 */

export interface PlayerStats {
  totalGamesPlayed: number;
  totalWins: number;
  totalLosses: number;
  totalUnitsSpawned: number;
  totalEnemiesKilled: number;
  totalPlayTimeSeconds: number;
  bestSurvivalWave: number;
  campaignStarsEarned: number;

  /** Tracks spawn count per unit type for "favorite unit" */
  unitSpawnCounts: Record<string, number>;

  /** Tracks time spent per age in seconds for "favorite age" */
  ageTimeCounts: Record<string, number>;
}

const STORAGE_KEY = 'eow_player_stats';

const DEFAULT_STATS: PlayerStats = {
  totalGamesPlayed: 0,
  totalWins: 0,
  totalLosses: 0,
  totalUnitsSpawned: 0,
  totalEnemiesKilled: 0,
  totalPlayTimeSeconds: 0,
  bestSurvivalWave: 0,
  campaignStarsEarned: 0,
  unitSpawnCounts: {},
  ageTimeCounts: {},
};

export class StatsManager {
  private stats: PlayerStats;

  constructor() {
    this.stats = { ...DEFAULT_STATS, unitSpawnCounts: {}, ageTimeCounts: {} };
    this.load();
  }

  // ── Recording ─────────────────────────────────────────

  recordGamePlayed(): void {
    this.stats.totalGamesPlayed++;
    this.save();
  }

  recordWin(): void {
    this.stats.totalWins++;
    this.save();
  }

  recordLoss(): void {
    this.stats.totalLosses++;
    this.save();
  }

  recordUnitSpawned(unitType: string): void {
    this.stats.totalUnitsSpawned++;
    this.stats.unitSpawnCounts[unitType] = (this.stats.unitSpawnCounts[unitType] ?? 0) + 1;
    this.save();
  }

  recordEnemyKilled(): void {
    this.stats.totalEnemiesKilled++;
    this.save();
  }

  recordPlayTime(seconds: number): void {
    this.stats.totalPlayTimeSeconds += seconds;
    this.save();
  }

  recordAgeTime(age: number, seconds: number): void {
    const key = String(age);
    this.stats.ageTimeCounts[key] = (this.stats.ageTimeCounts[key] ?? 0) + seconds;
    this.save();
  }

  recordSurvivalWave(wave: number): void {
    if (wave > this.stats.bestSurvivalWave) {
      this.stats.bestSurvivalWave = wave;
      this.save();
    }
  }

  recordCampaignStars(totalStars: number): void {
    this.stats.campaignStarsEarned = totalStars;
    this.save();
  }

  // ── Queries ────────────────────────────────────────────

  getAll(): Readonly<PlayerStats> {
    return { ...this.stats };
  }

  getWinRate(): number {
    if (this.stats.totalGamesPlayed === 0) return 0;
    return Math.round((this.stats.totalWins / this.stats.totalGamesPlayed) * 100);
  }

  getFavoriteUnit(): string {
    let best = '';
    let bestCount = 0;
    for (const [unit, count] of Object.entries(this.stats.unitSpawnCounts)) {
      if (count > bestCount) {
        bestCount = count;
        best = unit;
      }
    }
    return best || 'None';
  }

  getFavoriteAge(): string {
    const AGE_NAMES: Record<string, string> = {
      '1': 'Prehistoric', '2': 'Bronze Age', '3': 'Classical', '4': 'Medieval',
      '5': 'Gunpowder', '6': 'Industrial', '7': 'Modern', '8': 'Future',
    };

    let best = '';
    let bestTime = 0;
    for (const [age, time] of Object.entries(this.stats.ageTimeCounts)) {
      if (time > bestTime) {
        bestTime = time;
        best = age;
      }
    }
    return AGE_NAMES[best] ?? 'None';
  }

  getFormattedPlayTime(): string {
    const total = Math.floor(this.stats.totalPlayTimeSeconds);
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }

  // ── Persistence ───────────────────────────────────────

  private save(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.stats));
    } catch {
      // Ignore storage errors
    }
  }

  private load(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<PlayerStats>;
      this.stats = {
        ...DEFAULT_STATS,
        ...parsed,
        unitSpawnCounts: { ...parsed.unitSpawnCounts },
        ageTimeCounts: { ...parsed.ageTimeCounts },
      };
    } catch {
      // Ignore parse errors
    }
  }
}
