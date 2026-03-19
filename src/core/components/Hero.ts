/** Hero unit component — identifies a hero entity and tracks level/XP/cooldowns. */
export interface HeroComponent {
  /** Hero config ID (e.g. "grok", "sargon"). */
  heroId: string;
  /** Current hero level (1-3). Gains +10% stats per level. */
  level: number;
  /** Current XP earned from kills. */
  xp: number;
  /** XP required to reach the next level. */
  xpToLevel: number;
  /** Remaining cooldown for ability 1 (seconds). */
  ability1Cooldown: number;
  /** Remaining cooldown for ability 2 (seconds). */
  ability2Cooldown: number;
  /** Max cooldown for ability 1 (seconds). */
  ability1MaxCooldown: number;
  /** Max cooldown for ability 2 (seconds). */
  ability2MaxCooldown: number;
  /** Whether this hero is dead (cannot respawn until next age). */
  isDead: boolean;
}
