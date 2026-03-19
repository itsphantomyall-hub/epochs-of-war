/** Turret defense component — stationary unit attached to a base slot. */
export interface TurretComponent {
  /** Config ID from turrets.json (e.g. "rock_dropper"). */
  turretId: string;
  /** Slot index (0-4, or 0-5 with tech upgrade). */
  slot: number;
  /** Age this turret belongs to (1-8). */
  age: number;
  /** Current damage per hit. */
  damage: number;
  /** Attacks per second. */
  fireRate: number;
  /** Attack range in pixels. */
  range: number;
  /** Splash damage radius in pixels (0 = single target). */
  splashRadius: number;
  /** Timestamp (seconds) of the last attack — used for cooldown. */
  lastFireTime: number;
  /** Current upgrade level (1-3). */
  level: number;
  /** Targeting strategy. */
  targeting: 'nearest' | 'strongest' | 'fastest';
  /** Category for AI decision-making. */
  category: 'anti_infantry' | 'anti_heavy';
}
