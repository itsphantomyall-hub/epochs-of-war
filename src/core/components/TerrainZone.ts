/** Terrain zone component — marks an entity as a terrain feature on the battlefield. */
export interface TerrainZoneComponent {
  /** Terrain type ID (e.g. "high_ground", "river"). */
  terrainId: string;
  /** Display name. */
  name: string;
  /** Left edge of the zone in pixels. */
  xStart: number;
  /** Right edge of the zone in pixels. */
  xEnd: number;
  /** Speed reduction multiplier (0-1, e.g. 0.30 = 30% slower). 0 means no reduction. */
  speedReduction: number;
  /** Range bonus multiplier (e.g. 0.15 = +15%). 0 means no bonus. */
  rangeBonus: number;
  /** Damage bonus multiplier (e.g. 0.10 = +10%). 0 means no bonus. */
  damageBonus: number;
  /** Ranged accuracy penalty (0-1, e.g. 0.30 = 30% miss chance). 0 means no penalty. */
  rangedAccuracyPenalty: number;
  /** Melee damage bonus (e.g. 0.10 = +10%). 0 means no bonus. */
  meleeDamageBonus: number;
  /** Ranged damage reduction for units in cover (e.g. 0.25 = -25%). 0 means no reduction. */
  rangedDamageReduction: number;
  /** Max units that can fight side by side. 0 means no limit. */
  combatWidth: number;
}
