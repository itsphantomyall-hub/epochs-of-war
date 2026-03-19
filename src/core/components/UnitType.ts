/** Identifies the unit's archetype, specific ID, and the age it belongs to. */
export interface UnitType {
  /** Archetype class used for counter-system lookups. */
  type: 'infantry' | 'ranged' | 'heavy' | 'special' | 'hero';
  /** Unique identifier for this specific unit (e.g. "clubman", "sniper"). */
  unitId: string;
  /** The age (1-8) this unit was spawned from. */
  age: number;
}
