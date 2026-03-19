/** BuffEffect component — tracks temporary stat modifications on an entity. */
export interface BuffEffect {
  /** Active buffs on this entity. */
  buffs: ActiveBuff[];
}

/** A single active buff. */
export interface ActiveBuff {
  /** Unique identifier for the buff type. */
  buffId: string;
  /** Seconds remaining for this buff. */
  remaining: number;
  /** Damage multiplier (e.g. 1.25 = +25% damage). 1 means no change. */
  damageMultiplier: number;
  /** Speed multiplier (e.g. 1.30 = +30% speed). 1 means no change. */
  speedMultiplier: number;
  /** Range multiplier (e.g. 1.20 = +20% range). 1 means no change. */
  rangeMultiplier: number;
  /** Fire rate multiplier (e.g. 1.50 = +50%). 1 means no change. */
  fireRateMultiplier: number;
}
