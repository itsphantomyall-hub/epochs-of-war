/**
 * SettingsManager -- singleton that manages all game settings.
 * Persists to localStorage and applies defaults on first load.
 */

export interface GameSettings {
  // Gameplay
  damageNumbers: boolean;
  counterIndicators: boolean;
  suggestedUnit: boolean;

  // Video
  screenShakeIntensity: number; // 0-100
  particleDensity: 'low' | 'medium' | 'high';
  colorblindMode: 'none' | 'deuteranopia' | 'protanopia' | 'tritanopia';

  // Audio
  masterVolume: number; // 0-100
  musicVolume: number;  // 0-100
  sfxVolume: number;    // 0-100
}

const STORAGE_KEY = 'eow_settings';

const DEFAULT_SETTINGS: GameSettings = {
  damageNumbers: true,
  counterIndicators: true,
  suggestedUnit: true,
  screenShakeIntensity: 100,
  particleDensity: 'high',
  colorblindMode: 'none',
  masterVolume: 80,
  musicVolume: 60,
  sfxVolume: 100,
};

let instance: SettingsManager | null = null;

export class SettingsManager {
  private settings: GameSettings;

  constructor() {
    if (instance) return instance;
    this.settings = { ...DEFAULT_SETTINGS };
    this.load();
    instance = this;
  }

  static getInstance(): SettingsManager {
    if (!instance) {
      instance = new SettingsManager();
    }
    return instance;
  }

  // ── Accessors ─────────────────────────────────────────

  get<K extends keyof GameSettings>(key: K): GameSettings[K] {
    return this.settings[key];
  }

  set<K extends keyof GameSettings>(key: K, value: GameSettings[K]): void {
    this.settings[key] = value;
    this.save();
  }

  getAll(): Readonly<GameSettings> {
    return { ...this.settings };
  }

  reset(): void {
    this.settings = { ...DEFAULT_SETTINGS };
    this.save();
  }

  // ── Persistence ───────────────────────────────────────

  save(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
    } catch {
      // Ignore storage errors
    }
  }

  load(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<GameSettings>;

      // Merge with defaults to handle newly added settings
      this.settings = { ...DEFAULT_SETTINGS, ...parsed };
    } catch {
      // Ignore parse errors — use defaults
    }
  }
}
