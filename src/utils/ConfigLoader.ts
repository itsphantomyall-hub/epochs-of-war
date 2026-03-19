import type { UnitConfig, UnitConfigMap, UnitsFile } from '../types/Unit';
import type { AgeConfig, AgeConfigMap, AgesFile } from '../types/Age';

import unitsData from '../config/units.json';
import agesData from '../config/ages.json';

/**
 * ConfigLoader — Loads and validates JSON configs, provides typed getters.
 *
 * All unit and age data is imported statically from JSON files.
 * This class validates data at construction time and provides
 * strongly-typed access methods.
 */
export class ConfigLoader {
  private readonly units: UnitConfigMap;
  private readonly ages: AgeConfigMap;

  constructor() {
    const unitsFile = unitsData as UnitsFile;
    const agesFile = agesData as AgesFile;

    this.units = unitsFile.units;
    this.ages = agesFile.ages;

    this.validate();
  }

  /** Validate that all unit references in ages actually exist. */
  private validate(): void {
    const unitIds = new Set(Object.keys(this.units));

    for (const [ageNum, ageConfig] of Object.entries(this.ages)) {
      for (const unitId of ageConfig.units) {
        if (!unitIds.has(unitId)) {
          console.warn(
            `[ConfigLoader] Age ${ageNum} references unknown unit "${unitId}"`
          );
        }
      }

      // Validate xpToNext is 0 only for the last age
      if (ageNum !== '8' && ageConfig.xpToNext <= 0) {
        console.warn(
          `[ConfigLoader] Age ${ageNum} has invalid xpToNext: ${ageConfig.xpToNext}`
        );
      }
    }
  }

  // ── Unit Getters ──────────────────────────────────────────

  /** Get a single unit config by ID. Throws if not found. */
  getUnit(unitId: string): UnitConfig {
    const unit = this.units[unitId];
    if (!unit) {
      throw new Error(`[ConfigLoader] Unknown unit: "${unitId}"`);
    }
    return unit;
  }

  /** Get all unit configs as a map. */
  getAllUnits(): Readonly<UnitConfigMap> {
    return this.units;
  }

  /** Get all unit IDs. */
  getUnitIds(): string[] {
    return Object.keys(this.units);
  }

  /** Get all units for a specific age number. */
  getUnitsByAge(age: number): UnitConfig[] {
    return Object.values(this.units).filter((u) => u.age === age);
  }

  /** Check if a unit ID exists. */
  hasUnit(unitId: string): boolean {
    return unitId in this.units;
  }

  // ── Age Getters ───────────────────────────────────────────

  /** Get a single age config by age number. Throws if not found. */
  getAge(ageNumber: number): AgeConfig {
    const age = this.ages[String(ageNumber)];
    if (!age) {
      throw new Error(`[ConfigLoader] Unknown age: ${ageNumber}`);
    }
    return age;
  }

  /** Get all age configs as a map. */
  getAllAges(): Readonly<AgeConfigMap> {
    return this.ages;
  }

  /** Get the total number of ages. */
  getAgeCount(): number {
    return Object.keys(this.ages).length;
  }

  /** Get XP required to evolve from a specific age. Returns 0 for max age. */
  getXpToNext(ageNumber: number): number {
    const age = this.ages[String(ageNumber)];
    if (!age) {
      return 0;
    }
    return age.xpToNext;
  }

  /** Get passive income rate for a specific age. */
  getPassiveIncome(ageNumber: number): number {
    const age = this.ages[String(ageNumber)];
    if (!age) {
      return 3; // fallback to base
    }
    return age.passiveIncome;
  }
}
