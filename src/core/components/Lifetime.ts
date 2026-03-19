/** Marks an entity for auto-destruction after a duration. */
export interface Lifetime {
  /** Seconds remaining before this entity is destroyed. */
  remaining: number;
}
