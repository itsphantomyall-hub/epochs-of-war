/** Unit type interfaces matching GAME_DESIGN.md Section 34.1 schema */

export type UnitType = 'infantry' | 'ranged' | 'heavy' | 'special' | 'hero';

export interface UnitStats {
  hp: number;
  damage: number;
  attackSpeed: number;
  moveSpeed: number;
  range: number;
  armor: number;
  cost: number;
  spawnTime: number;
  xpReward: number;
  goldReward: number;
}

export interface CounterInfo {
  strong_vs: UnitType[];
  weak_vs: UnitType[];
  bonus_damage_multiplier: number;
}

export interface PassiveAbility {
  name: string;
  description: string;
  radius: number;
  effect: Record<string, number>;
}

export interface UnitVisuals {
  spriteSheet: string;
  frameSize: [number, number];
  animations: Record<string, {
    frames: number[];
    fps: number;
    loop?: boolean;
  }>;
}

export interface UnitAudio {
  spawn: string;
  attack: string;
  death: string;
  move: string;
}

export interface UnitConfig {
  displayName: string;
  age: number;
  type: UnitType;
  stats: UnitStats;
  counters: CounterInfo;
  passive: PassiveAbility;
  visuals?: UnitVisuals;
  audio?: UnitAudio;
}

export interface UnitConfigMap {
  [unitId: string]: UnitConfig;
}

export interface UnitsFile {
  units: UnitConfigMap;
}
