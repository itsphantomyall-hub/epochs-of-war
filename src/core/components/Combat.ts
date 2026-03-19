/** Combat stats for an entity that can attack. */
export interface Combat {
  /** Base damage per hit. */
  damage: number;
  /** Attack range in pixels (0 = melee). */
  range: number;
  /** Attacks per second. */
  attackSpeed: number;
  /** Timestamp (seconds) of the last attack — used for cooldown. */
  lastAttackTime: number;
  /** Key identifying the projectile type (empty string for melee). */
  projectileType: string;
}
