/**
 * CampaignManager -- tracks campaign progress, mission configs,
 * star ratings, and applies mission modifiers to game state.
 */

import campaignData from '../../config/campaign.json';

export interface MissionRewards {
  coins: number;
  unlock?: string;
}

export interface StarThresholds {
  time: number;
  hpPercent: number;
}

export interface MissionConfig {
  id: number;
  title: string;
  description: string;
  type: 'standard' | 'defense' | 'rush' | 'puzzle' | 'boss';
  difficulty: 'easy' | 'medium' | 'hard';
  startAge: number;
  enemyAI: string;
  modifiers: string[];
  starThresholds: StarThresholds;
  rewards: MissionRewards;
  boss?: string;
  timeLimit?: number;
  waveCount?: number;
  lockedAge?: number;
}

export interface ContinentConfig {
  name: string;
  ageRange: [number, number];
  missions: MissionConfig[];
}

export interface CampaignProgress {
  completedMissions: Record<number, number>; // missionId -> stars (1-3)
}

const STORAGE_KEY = 'eow_campaign_progress';

export class CampaignManager {
  private continents: ContinentConfig[];
  private progress: CampaignProgress;

  constructor() {
    this.continents = campaignData.continents as ContinentConfig[];
    this.progress = this.loadProgress();
  }

  // ── Mission access ─────────────────────────────────────

  getContinents(): ContinentConfig[] {
    return this.continents;
  }

  getMission(id: number): MissionConfig | undefined {
    for (const continent of this.continents) {
      for (const mission of continent.missions) {
        if (mission.id === id) return mission;
      }
    }
    return undefined;
  }

  getAllMissions(): MissionConfig[] {
    const missions: MissionConfig[] = [];
    for (const continent of this.continents) {
      missions.push(...continent.missions);
    }
    return missions;
  }

  // ── Progress ───────────────────────────────────────────

  completeMission(id: number, stars: number): void {
    const current = this.progress.completedMissions[id] ?? 0;
    // Only update if new star rating is higher
    if (stars > current) {
      this.progress.completedMissions[id] = stars;
    }
    this.saveProgress();
  }

  getStars(missionId: number): number {
    return this.progress.completedMissions[missionId] ?? 0;
  }

  isCompleted(missionId: number): boolean {
    return (this.progress.completedMissions[missionId] ?? 0) > 0;
  }

  isUnlocked(missionId: number): boolean {
    if (missionId <= 1) return true;
    return this.isCompleted(missionId - 1);
  }

  getProgress(): { totalStars: number; missionsCompleted: number; totalMissions: number } {
    const allMissions = this.getAllMissions();
    let totalStars = 0;
    let missionsCompleted = 0;
    for (const m of allMissions) {
      const stars = this.getStars(m.id);
      totalStars += stars;
      if (stars > 0) missionsCompleted++;
    }
    return { totalStars, missionsCompleted, totalMissions: allMissions.length };
  }

  // ── Star calculation ───────────────────────────────────

  calculateStars(missionId: number, elapsedTime: number, baseHpPercent: number): number {
    const mission = this.getMission(missionId);
    if (!mission) return 1;

    const { time, hpPercent } = mission.starThresholds;

    if (elapsedTime <= time && baseHpPercent >= hpPercent) {
      return 3;
    }
    if (baseHpPercent >= 50) {
      return 2;
    }
    return 1;
  }

  // ── Modifiers ──────────────────────────────────────────

  /** Returns modifier flags for a mission, to be checked by the game scene. */
  getMissionModifiers(missionId: number): {
    lockedAge: number | null;
    noTurrets: boolean;
    doubleAgent: boolean;
    fogOfWar: boolean;
    famine: boolean;
    armsRace: boolean;
    scorchedEarth: boolean;
    mirrorMatch: boolean;
    ironman: boolean;
    inflation: boolean;
  } {
    const mission = this.getMission(missionId);
    const modifiers = mission?.modifiers ?? [];
    return {
      lockedAge: modifiers.includes('locked_age') ? (mission?.lockedAge ?? mission?.startAge ?? null) : null,
      noTurrets: modifiers.includes('no_turrets'),
      doubleAgent: modifiers.includes('double_agent'),
      fogOfWar: modifiers.includes('fog_of_war'),
      famine: modifiers.includes('famine'),
      armsRace: modifiers.includes('arms_race'),
      scorchedEarth: modifiers.includes('scorched_earth'),
      mirrorMatch: modifiers.includes('mirror_match'),
      ironman: modifiers.includes('ironman'),
      inflation: modifiers.includes('inflation'),
    };
  }

  // ── Persistence ────────────────────────────────────────

  private loadProgress(): CampaignProgress {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw) as CampaignProgress;
      }
    } catch {
      // Ignore parse errors
    }
    return { completedMissions: {} };
  }

  private saveProgress(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.progress));
    } catch {
      // Ignore storage errors
    }
  }

  resetProgress(): void {
    this.progress = { completedMissions: {} };
    this.saveProgress();
  }
}
