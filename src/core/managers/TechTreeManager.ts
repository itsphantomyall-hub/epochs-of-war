/**
 * TechTreeManager — manages tech points and unlocks for one faction.
 *
 * 2 tech points per age evolution (14 total across 7 transitions).
 * 3 branches (Military, Economy, Fortification), 4 tiers each.
 * Tiers must be unlocked sequentially within a branch.
 */

import type { SpawnRequest } from '../systems/SpawnSystem';

/** Effect definition from techtree.json. */
export interface TechEffect {
  type: string;
  value: number | boolean;
}

/** Single tier within a tech branch. */
export interface TechTier {
  id: string;
  name: string;
  description: string;
  effect: TechEffect;
}

/** A tech branch with 4 tiers. */
export interface TechBranch {
  name: string;
  color: string;
  tiers: TechTier[];
}

/** Full tech tree config. */
export interface TechTreeConfig {
  branches: {
    military: TechBranch;
    economy: TechBranch;
    fortification: TechBranch;
  };
}

export type BranchId = 'military' | 'economy' | 'fortification';

export class TechTreeManager {
  private readonly config: TechTreeConfig;

  /** Unspent tech points. */
  private availablePoints: number = 0;

  /** Highest unlocked tier per branch (0 = none unlocked). */
  private readonly unlockedTiers: Map<BranchId, number> = new Map();

  /** Set of all unlocked tech IDs. */
  private readonly unlockedSet: Set<string> = new Set();

  constructor(config: TechTreeConfig) {
    this.config = config;
    this.unlockedTiers.set('military', 0);
    this.unlockedTiers.set('economy', 0);
    this.unlockedTiers.set('fortification', 0);
  }

  // ── Points ─────────────────────────────────────────────────────

  /** Get unspent tech points. */
  getAvailablePoints(): number {
    return this.availablePoints;
  }

  /** Award tech points (called on age evolution). */
  addPoints(points: number): void {
    this.availablePoints += points;
  }

  // ── Unlock Checks ──────────────────────────────────────────────

  /**
   * Check if a specific tier in a branch can be unlocked.
   * Tier is 1-indexed (1 = first tier).
   */
  canUnlock(branch: BranchId, tier: number): boolean {
    if (this.availablePoints <= 0) return false;

    const currentTier = this.unlockedTiers.get(branch) ?? 0;

    // Must unlock tiers sequentially
    if (tier !== currentTier + 1) return false;

    // Check tier exists
    const branchConfig = this.config.branches[branch];
    if (!branchConfig || tier > branchConfig.tiers.length) return false;

    // Check not already unlocked
    const tierConfig = branchConfig.tiers[tier - 1];
    if (this.unlockedSet.has(tierConfig.id)) return false;

    return true;
  }

  /**
   * Unlock a tech tier. Spends 1 point and applies the effect.
   * Returns the unlocked tier config, or null if unlock failed.
   */
  unlock(branch: BranchId, tier: number): TechTier | null {
    if (!this.canUnlock(branch, tier)) return null;

    const branchConfig = this.config.branches[branch];
    const tierConfig = branchConfig.tiers[tier - 1];

    this.availablePoints--;
    this.unlockedTiers.set(branch, tier);
    this.unlockedSet.add(tierConfig.id);

    return tierConfig;
  }

  // ── Query Unlocked ─────────────────────────────────────────────

  /** Get all unlocked tech IDs. */
  getUnlocked(): string[] {
    return [...this.unlockedSet];
  }

  /** Check if a specific tech is unlocked by ID. */
  isUnlocked(techId: string): boolean {
    return this.unlockedSet.has(techId);
  }

  /** Get the highest unlocked tier for a branch. */
  getUnlockedTier(branch: BranchId): number {
    return this.unlockedTiers.get(branch) ?? 0;
  }

  /** Get the branch config. */
  getBranch(branch: BranchId): TechBranch {
    return this.config.branches[branch];
  }

  // ── Effect Application ─────────────────────────────────────────

  /**
   * Apply tech tree effects to a spawn request.
   * Modifies spawn time, HP, and cost based on unlocked techs.
   */
  applyEffects(request: SpawnRequest): SpawnRequest {
    const modified = { ...request };

    // Military T1: Recruitment — spawn time -15%
    if (this.unlockedSet.has('recruitment')) {
      modified.spawnTime *= 0.85;
    }

    // Military T2: Veteran Training — all units +10% HP
    if (this.unlockedSet.has('veteran_training')) {
      modified.hp = Math.round(modified.hp * 1.10);
    }

    // Military T4: War Machine — heavy units cost -25%
    if (this.unlockedSet.has('war_machine') && modified.type === 'heavy') {
      modified.cost = Math.round(modified.cost * 0.75);
    }

    return modified;
  }

  /**
   * Get the base HP bonus multiplier from Fortification T1 (Thick Walls).
   * Returns 1.0 if not unlocked, 1.20 if unlocked.
   */
  getBaseHpBonus(): number {
    if (this.unlockedSet.has('thick_walls')) {
      return 1.20;
    }
    return 1.0;
  }

  /**
   * Get the base HP regeneration rate from Fortification T2 (Repair Crews).
   * Returns 0 if not unlocked, 1 HP/s if unlocked.
   */
  getBaseRegenRate(): number {
    if (this.unlockedSet.has('repair_crews')) {
      return 1;
    }
    return 0;
  }

  /**
   * Get passive income bonus from Economy T2 (Trade Routes).
   * Returns 0 if not unlocked, 5 gold/s if unlocked.
   */
  getIncomeBonus(): number {
    if (this.unlockedSet.has('trade_routes')) {
      return 5;
    }
    return 0;
  }

  /**
   * Get gold income per kill bonus from Economy T1 (Taxation).
   * Returns 1.0 if not unlocked, 1.20 if unlocked.
   */
  getKillGoldBonus(): number {
    if (this.unlockedSet.has('taxation')) {
      return 1.20;
    }
    return 1.0;
  }

  /**
   * Get evolution gold bonus from Economy T3 (War Bonds).
   * Returns 0 if not unlocked, 500 if unlocked.
   */
  getEvolutionGoldBonus(): number {
    if (this.unlockedSet.has('war_bonds')) {
      return 500;
    }
    return 0;
  }

  /**
   * Check if turret full refund is unlocked (Economy T4: Plunder).
   */
  hasTurretFullRefund(): boolean {
    return this.unlockedSet.has('plunder');
  }

  /**
   * Check if extra turret slot is unlocked (Fortification T3).
   */
  hasExtraTurretSlot(): boolean {
    return this.unlockedSet.has('extra_turret_slot');
  }

  /**
   * Get turret damage bonus from Fortification T4 (Fortress).
   * Returns 1.0 if not unlocked, 1.30 if unlocked.
   */
  getTurretDamageBonus(): number {
    if (this.unlockedSet.has('fortress')) {
      return 1.30;
    }
    return 1.0;
  }

  /**
   * Check if elite special unit is unlocked (Military T3).
   */
  hasEliteSpecial(): boolean {
    return this.unlockedSet.has('elite_forces');
  }

  /**
   * Reset state for a new game.
   */
  reset(): void {
    this.availablePoints = 0;
    this.unlockedTiers.set('military', 0);
    this.unlockedTiers.set('economy', 0);
    this.unlockedTiers.set('fortification', 0);
    this.unlockedSet.clear();
  }
}
