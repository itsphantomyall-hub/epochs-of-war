import type { AgeConfig } from '../../types/Age';
import type { UnitConfig } from '../../types/Unit';
import { ConfigLoader } from '../../utils/ConfigLoader';
import { EconomySystem } from './EconomySystem';

const BASE_HP = 500;
const HP_PER_AGE = 200;
const MAX_AGE = 8;

/**
 * AgeSystem — Manages age progression for a single side (player or enemy).
 *
 * - Tracks current age (1-8).
 * - evolve(): checks XP threshold, advances age, resets XP via EconomySystem.
 * - getAvailableUnits(): returns unit configs for the current age.
 * - getBaseHp(): 500 + (age-1) * 200.
 */
export class AgeSystem {
  private currentAge: number;
  private readonly configLoader: ConfigLoader;
  private readonly economy: EconomySystem;

  constructor(configLoader: ConfigLoader, economy: EconomySystem, startingAge: number = 1) {
    this.configLoader = configLoader;
    this.economy = economy;
    this.currentAge = startingAge;
  }

  getCurrentAge(): number {
    return this.currentAge;
  }

  /** Get the AgeConfig for the current age. */
  getCurrentAgeConfig(): AgeConfig {
    return this.configLoader.getAge(this.currentAge);
  }

  /** Get AgeConfig for any age number. */
  getAgeConfig(ageNumber: number): AgeConfig {
    return this.configLoader.getAge(ageNumber);
  }

  /**
   * Calculate base HP for a given age.
   * Formula: 500 + (age - 1) * 200
   */
  getBaseHp(age?: number): number {
    const a = age ?? this.currentAge;
    return BASE_HP + (a - 1) * HP_PER_AGE;
  }

  /**
   * Get XP required to evolve from the current age to the next.
   * Returns 0 if already at max age.
   */
  getXpToNext(): number {
    if (this.currentAge >= MAX_AGE) {
      return 0;
    }
    return this.getCurrentAgeConfig().xpToNext;
  }

  /**
   * Check whether evolution is possible (enough XP, not at max age).
   */
  canEvolve(): boolean {
    if (this.currentAge >= MAX_AGE) {
      return false;
    }
    const xpRequired = this.getXpToNext();
    return this.economy.canEvolve(xpRequired);
  }

  /**
   * Attempt to evolve to the next age.
   * Returns the new AgeConfig on success, or null if evolution is not possible.
   */
  evolve(): AgeConfig | null {
    if (!this.canEvolve()) {
      return null;
    }

    const xpRequired = this.getXpToNext();
    const newAge = this.currentAge + 1;

    // Consume XP and update economy's age reference
    this.economy.onEvolve(xpRequired, newAge);
    this.currentAge = newAge;

    return this.getCurrentAgeConfig();
  }

  /**
   * Get all unit configs available in the current age.
   */
  getAvailableUnits(): UnitConfig[] {
    const ageConfig = this.getCurrentAgeConfig();
    return ageConfig.units.map((unitId) => this.configLoader.getUnit(unitId));
  }

  /**
   * Get unit IDs available in the current age.
   */
  getAvailableUnitIds(): string[] {
    return this.getCurrentAgeConfig().units;
  }

  /**
   * Get turret IDs available in the current age.
   */
  getAvailableTurretIds(): string[] {
    return this.getCurrentAgeConfig().turrets;
  }

  /** Whether the player is at max age. */
  isMaxAge(): boolean {
    return this.currentAge >= MAX_AGE;
  }

  /** Reset to starting age. */
  reset(startingAge: number = 1): void {
    this.currentAge = startingAge;
  }
}
