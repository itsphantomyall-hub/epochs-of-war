import type { UnitType } from '../../types/Unit';

/**
 * EconomySystem — Tracks gold, XP, and passive income for a single side.
 *
 * Gold/XP reward ranges by unit type (scales linearly with enemy age 1-8):
 *   Infantry:  10-25 gold,  5-10 XP
 *   Ranged:    15-30 gold,  8-12 XP
 *   Heavy:     40-80 gold, 15-30 XP
 *   Special:   50-120 gold, 20-40 XP
 *   Hero:      200 gold,    50 XP (flat)
 *
 * Passive income: 3 gold/second base, +1/second per age.
 */

interface RewardRange {
  goldMin: number;
  goldMax: number;
  xpMin: number;
  xpMax: number;
}

const KILL_REWARDS: Record<string, RewardRange> = {
  infantry: { goldMin: 10, goldMax: 25, xpMin: 5, xpMax: 10 },
  ranged:   { goldMin: 15, goldMax: 30, xpMin: 8, xpMax: 12 },
  heavy:    { goldMin: 40, goldMax: 80, xpMin: 15, xpMax: 30 },
  special:  { goldMin: 50, goldMax: 120, xpMin: 20, xpMax: 40 },
  hero:     { goldMin: 200, goldMax: 200, xpMin: 50, xpMax: 50 },
};

const BASE_PASSIVE_INCOME = 3;   // gold per second
const PASSIVE_INCOME_PER_AGE = 1; // additional gold/s per age above 1
const MAX_AGE = 8;

export class EconomySystem {
  private gold: number;
  private xp: number;
  private currentAge: number;
  private accumulatedTime: number;

  constructor(startingGold: number = 50, startingAge: number = 1) {
    this.gold = startingGold;
    this.xp = 0;
    this.currentAge = startingAge;
    this.accumulatedTime = 0;
  }

  /** Called every frame with deltaTime in seconds. Adds passive income. */
  update(deltaTimeSec: number): void {
    this.accumulatedTime += deltaTimeSec;
    const incomeRate = this.getPassiveIncomeRate();
    this.gold += incomeRate * deltaTimeSec;
  }

  /** Current passive income rate in gold/second. */
  getPassiveIncomeRate(): number {
    return BASE_PASSIVE_INCOME + (this.currentAge - 1) * PASSIVE_INCOME_PER_AGE;
  }

  getGold(): number {
    return Math.floor(this.gold);
  }

  getRawGold(): number {
    return this.gold;
  }

  getXP(): number {
    return Math.floor(this.xp);
  }

  canAfford(cost: number): boolean {
    return this.gold >= cost;
  }

  /**
   * Spend gold. Returns true if successful, false if insufficient funds.
   */
  spend(cost: number): boolean {
    if (!this.canAfford(cost)) {
      return false;
    }
    this.gold -= cost;
    return true;
  }

  /**
   * Award gold and XP for killing an enemy unit.
   * Reward scales linearly with the enemy's age (1-8).
   * @param unitType - The type of the killed unit.
   * @param enemyAge - The age of the enemy when the unit was killed.
   * @param turretKill - Whether the kill was by a turret (+50% gold bonus).
   */
  earnFromKill(unitType: UnitType | 'hero', enemyAge: number, turretKill: boolean = false): { gold: number; xp: number } {
    const range = KILL_REWARDS[unitType];
    if (!range) {
      return { gold: 0, xp: 0 };
    }

    // Linear interpolation: age 1 → min reward, age 8 → max reward
    const t = Math.max(0, Math.min(1, (enemyAge - 1) / (MAX_AGE - 1)));
    let goldEarned = range.goldMin + (range.goldMax - range.goldMin) * t;
    const xpEarned = range.xpMin + (range.xpMax - range.xpMin) * t;

    // Turret kill bonus: +50% gold
    if (turretKill) {
      goldEarned *= 1.5;
    }

    const roundedGold = Math.round(goldEarned);
    const roundedXp = Math.round(xpEarned);

    this.gold += roundedGold;
    this.xp += roundedXp;

    return { gold: roundedGold, xp: roundedXp };
  }

  /**
   * Add gold directly (e.g., from momentum bonus or other sources).
   */
  addGold(amount: number): void {
    this.gold += amount;
  }

  /**
   * Add XP directly (e.g., from comeback XP bonus).
   */
  addXP(amount: number): void {
    this.xp += amount;
  }

  /**
   * Check if the player has enough XP to evolve to the next age.
   * @param xpRequired - XP needed for the next age transition.
   */
  canEvolve(xpRequired: number): boolean {
    return this.xp >= xpRequired && this.currentAge < MAX_AGE;
  }

  /**
   * Consume XP and advance the age. Called by AgeSystem after evolution.
   * @param xpRequired - XP spent on evolution.
   * @param newAge - The new age number.
   */
  onEvolve(xpRequired: number, newAge: number): void {
    this.xp -= xpRequired;
    this.currentAge = newAge;
  }

  /** Sync current age (called by AgeSystem). */
  setCurrentAge(age: number): void {
    this.currentAge = age;
  }

  getCurrentAge(): number {
    return this.currentAge;
  }

  /** Reset state (for new game). */
  reset(startingGold: number = 50, startingAge: number = 1): void {
    this.gold = startingGold;
    this.xp = 0;
    this.currentAge = startingAge;
    this.accumulatedTime = 0;
  }
}
