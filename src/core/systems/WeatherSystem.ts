/**
 * WeatherSystem — triggers random weather events with gameplay effects.
 *
 * Weather changes every 2-3 minutes with the following effects:
 * - Clear: no effect (default)
 * - Rain: -15% ranged damage, -10% speed
 * - Fog: -30% range
 * - Sandstorm: 2 DPS to all, reduced visibility
 * - Lightning Storm: 50 damage to random unit every 3s
 * - Solar Flare: +25% energy weapons, 5 DPS to mechanical (Future age only)
 */

import { World } from '../ecs/World';
import { EntityId } from '../ecs/Entity';
import type { Position } from '../components/Position';
import type { Velocity } from '../components/Velocity';
import type { Health } from '../components/Health';
import type { Faction } from '../components/Faction';
import type { UnitType } from '../components/UnitType';
import type { Combat } from '../components/Combat';
import { EventEmitter } from '../../utils/EventEmitter';
import type { GameEvents } from '../managers/GameManager';

/** Weather config as loaded from weather.json. */
export interface WeatherEffects {
  rangedDamageReduction?: number;
  speedReduction?: number;
  rangeReduction?: number;
  dpsToAll?: number;
  reducedVisibility?: boolean;
  strikeDamage?: number;
  strikeInterval?: number;
  energyWeaponBonus?: number;
  mechanicalDps?: number;
}

export interface WeatherConfig {
  name: string;
  duration: number;
  effect?: string;
  effects?: WeatherEffects;
  futureOnly?: boolean;
}

export interface WeatherConfigMap {
  [weatherId: string]: WeatherConfig;
}

export interface WeatherFile {
  weatherTypes: WeatherConfigMap;
  minInterval: number;
  maxInterval: number;
}

export type WeatherId = 'clear' | 'rain' | 'fog' | 'sandstorm' | 'lightning' | 'solar_flare';

/** Current weather state. */
export interface WeatherState {
  currentWeather: WeatherId;
  weatherName: string;
  remainingDuration: number;
  timeUntilNextEvent: number;
}

export class WeatherSystem {
  private readonly events: EventEmitter<GameEvents>;
  private readonly weatherConfigs: WeatherConfigMap;
  private readonly minInterval: number;
  private readonly maxInterval: number;

  private currentWeather: WeatherId = 'clear';
  private remainingDuration: number = 0;
  private timeUntilNextEvent: number;
  private lightningTimer: number = 0;
  private sandstormTimer: number = 0;
  private solarFlareTimer: number = 0;

  /** The highest age currently in play (used for Solar Flare eligibility). */
  private maxAgeInPlay: number = 1;

  constructor(events: EventEmitter<GameEvents>, weatherConfig: WeatherFile) {
    this.events = events;
    this.weatherConfigs = weatherConfig.weatherTypes;
    this.minInterval = weatherConfig.minInterval;
    this.maxInterval = weatherConfig.maxInterval;

    // Set initial delay before first weather event
    this.timeUntilNextEvent = this.randomInterval();
  }

  /**
   * Called every frame. Manages weather transitions and applies effects.
   */
  update(world: World, deltaTime: number): void {
    if (this.currentWeather !== 'clear') {
      // Weather is active — tick duration and apply effects
      this.remainingDuration -= deltaTime;

      if (this.remainingDuration <= 0) {
        // Weather ended — return to clear
        this.currentWeather = 'clear';
        this.timeUntilNextEvent = this.randomInterval();
      } else {
        // Apply ongoing weather effects
        this.applyWeatherEffects(world, deltaTime);
      }
    } else {
      // Clear weather — count down to next event
      this.timeUntilNextEvent -= deltaTime;

      if (this.timeUntilNextEvent <= 0) {
        this.triggerRandomWeather();
      }
    }
  }

  /**
   * Get the current weather state for rendering/UI.
   */
  getCurrentWeather(): WeatherState {
    const config = this.weatherConfigs[this.currentWeather];
    return {
      currentWeather: this.currentWeather,
      weatherName: config?.name ?? 'Clear',
      remainingDuration: this.remainingDuration,
      timeUntilNextEvent: this.timeUntilNextEvent,
    };
  }

  /**
   * Get combat modifiers from current weather.
   */
  getWeatherCombatModifiers(): WeatherCombatModifiers {
    const mods: WeatherCombatModifiers = {
      rangedDamageMultiplier: 1.0,
      speedMultiplier: 1.0,
      rangeMultiplier: 1.0,
      energyWeaponMultiplier: 1.0,
    };

    const config = this.weatherConfigs[this.currentWeather];
    if (!config || !config.effects) return mods;

    if (config.effects.rangedDamageReduction) {
      mods.rangedDamageMultiplier = 1 - config.effects.rangedDamageReduction;
    }
    if (config.effects.speedReduction) {
      mods.speedMultiplier = 1 - config.effects.speedReduction;
    }
    if (config.effects.rangeReduction) {
      mods.rangeMultiplier = 1 - config.effects.rangeReduction;
    }
    if (config.effects.energyWeaponBonus) {
      mods.energyWeaponMultiplier = 1 + config.effects.energyWeaponBonus;
    }

    return mods;
  }

  /**
   * Set the highest age currently in play (for Solar Flare eligibility).
   */
  setMaxAge(age: number): void {
    this.maxAgeInPlay = age;
  }

  // ── Weather Triggering ─────────────────────────────────────────

  private triggerRandomWeather(): void {
    // Build list of eligible weather types (exclude clear and conditionally solar_flare)
    const eligible: WeatherId[] = ['rain', 'fog', 'sandstorm', 'lightning'];

    if (this.maxAgeInPlay >= 8) {
      eligible.push('solar_flare');
    }

    const selected = eligible[Math.floor(Math.random() * eligible.length)];
    const config = this.weatherConfigs[selected];

    if (!config) {
      this.timeUntilNextEvent = this.randomInterval();
      return;
    }

    this.currentWeather = selected;
    this.remainingDuration = config.duration;
    this.lightningTimer = 0;
    this.sandstormTimer = 0;
    this.solarFlareTimer = 0;
  }

  // ── Weather Effects ────────────────────────────────────────────

  private applyWeatherEffects(world: World, deltaTime: number): void {
    const config = this.weatherConfigs[this.currentWeather];
    if (!config || !config.effects) return;

    switch (this.currentWeather) {
      case 'sandstorm':
        this.applySandstorm(world, deltaTime, config.effects);
        break;
      case 'lightning':
        this.applyLightning(world, deltaTime, config.effects);
        break;
      case 'solar_flare':
        this.applySolarFlare(world, deltaTime, config.effects);
        break;
      // Rain and Fog are handled via getWeatherCombatModifiers() — no per-frame logic needed
    }
  }

  /** Sandstorm: 2 DPS to all units. */
  private applySandstorm(
    world: World,
    deltaTime: number,
    effects: WeatherEffects,
  ): void {
    const dps = effects.dpsToAll ?? 2;

    this.sandstormTimer += deltaTime;
    const tickInterval = 0.5;
    if (this.sandstormTimer < tickInterval) return;
    this.sandstormTimer -= tickInterval;

    const damage = Math.round(dps * tickInterval);

    const entities = world.query('Health', 'Position', 'Faction');
    for (let i = 0; i < entities.length; i++) {
      const health = world.getComponent<Health>(entities[i], 'Health')!;
      health.current -= damage;
    }
  }

  /** Lightning Storm: 50 damage to random unit every 3s. */
  private applyLightning(
    world: World,
    deltaTime: number,
    effects: WeatherEffects,
  ): void {
    const strikeDamage = effects.strikeDamage ?? 50;
    const strikeInterval = effects.strikeInterval ?? 3;

    this.lightningTimer += deltaTime;
    if (this.lightningTimer < strikeInterval) return;
    this.lightningTimer -= strikeInterval;

    // Pick a random unit
    const entities = world.query('Health', 'Position', 'Faction');
    if (entities.length === 0) return;

    const targetIdx = Math.floor(Math.random() * entities.length);
    const targetId = entities[targetIdx];
    const health = world.getComponent<Health>(targetId, 'Health')!;

    health.current -= strikeDamage;
    this.events.emit('damage', {
      attackerId: -1,
      targetId,
      damage: strikeDamage,
      remainingHp: health.current,
    });
  }

  /** Solar Flare: 5 DPS to mechanical units. */
  private applySolarFlare(
    world: World,
    deltaTime: number,
    effects: WeatherEffects,
  ): void {
    const mechanicalDps = effects.mechanicalDps ?? 5;

    this.solarFlareTimer += deltaTime;
    const tickInterval = 0.5;
    if (this.solarFlareTimer < tickInterval) return;
    this.solarFlareTimer -= tickInterval;

    const damage = Math.round(mechanicalDps * tickInterval);

    // Apply damage to mechanical units (heavy type in later ages)
    const entities = world.query('Health', 'UnitType');
    for (let i = 0; i < entities.length; i++) {
      const unitType = world.getComponent<UnitType>(entities[i], 'UnitType')!;
      // Mechanical units: heavy type in ages 6-8
      if (unitType.type === 'heavy' && unitType.age >= 6) {
        const health = world.getComponent<Health>(entities[i], 'Health')!;
        health.current -= damage;
      }
    }
  }

  // ── Helpers ────────────────────────────────────────────────────

  private randomInterval(): number {
    return this.minInterval + Math.random() * (this.maxInterval - this.minInterval);
  }

  /**
   * Reset state for a new game.
   */
  reset(): void {
    this.currentWeather = 'clear';
    this.remainingDuration = 0;
    this.timeUntilNextEvent = this.randomInterval();
    this.lightningTimer = 0;
    this.sandstormTimer = 0;
    this.solarFlareTimer = 0;
    this.maxAgeInPlay = 1;
  }
}

/** Combat modifiers returned by the weather system. */
export interface WeatherCombatModifiers {
  rangedDamageMultiplier: number;
  speedMultiplier: number;
  rangeMultiplier: number;
  energyWeaponMultiplier: number;
}
