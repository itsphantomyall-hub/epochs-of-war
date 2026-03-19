/** Age configuration interfaces matching GAME_DESIGN.md Section 34.3 schema */

export interface AgePalette {
  primary: string;
  secondary: string;
  accent: string;
}

export interface AgeVisuals {
  baseSpriteSheet: string;
  background: string;
  transitionAnim: string;
}

export interface AgeMusic {
  ambient: string;
  combat: string;
  intensity: string;
}

export interface AgeConfig {
  name: string;
  xpToNext: number;
  baseHpBonus: number;
  passiveIncome: number;
  units: string[];
  turrets: string[];
  hero?: string;
  special?: string;
  visuals?: AgeVisuals;
  music?: AgeMusic;
  palette?: AgePalette;
}

export interface AgeConfigMap {
  [ageNumber: string]: AgeConfig;
}

export interface AgesFile {
  ages: AgeConfigMap;
}
