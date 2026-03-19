/** Formation component — marks a unit as part of a formation group. */
export interface FormationComponent {
  /** The type of formation this unit is currently in. */
  formationType: string;
  /** The stat bonuses granted by this formation. */
  bonus: FormationBonus;
}

/** Stat bonuses applied by a formation. */
export interface FormationBonus {
  /** HP multiplier bonus (e.g. 1.15 = +15%). */
  hpMultiplier?: number;
  /** Fire rate multiplier bonus (e.g. 1.20 = +20%). */
  fireRateMultiplier?: number;
  /** Damage multiplier bonus (e.g. 1.10 = +10%). */
  damageMultiplier?: number;
  /** All-stats multiplier bonus (e.g. 1.05 = +5%). */
  allMultiplier?: number;
}
