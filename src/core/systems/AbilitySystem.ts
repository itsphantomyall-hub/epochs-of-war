/**
 * AbilitySystem — manages special ability cooldowns and activation.
 *
 * Each age has a unique special ability (GAME_DESIGN.md Section 8.2).
 * Charges over time (base: 45s) and via combat kills (-1s per kill).
 * Creates temporary damage-zone entities with Lifetime component.
 */

import { World } from '../ecs/World';
import { EntityId } from '../ecs/Entity';
import type { Position } from '../components/Position';
import type { Health } from '../components/Health';
import type { Faction } from '../components/Faction';
import type { Lifetime } from '../components/Lifetime';
import { SpatialGrid } from '../../utils/SpatialGrid';
import { EventEmitter } from '../../utils/EventEmitter';
import type { GameEvents } from '../managers/GameManager';

/** Ability config as loaded from abilities.json. */
export interface AbilityConfig {
  id: string;
  name: string;
  age: number;
  cooldown: number;
  effect: {
    type: string;
    damage?: number;
    dps?: number;
    impacts?: number;
    hits?: number;
    radius?: number;
    width?: number;
    duration?: number;
    chargeTime?: number;
    percentPerSecond?: number;
    slowPercent?: number;
  };
}

export interface AbilityConfigMap {
  [abilityId: string]: AbilityConfig;
}

export interface AbilitiesFile {
  abilities: AbilityConfigMap;
}

/** Damage zone component for ongoing area effects. */
export interface DamageZone {
  /** The faction that owns this zone (enemies of this faction take damage). */
  ownerFaction: 'player' | 'enemy';
  /** Damage per second applied to enemies in the zone. */
  dps: number;
  /** Radius of the damage zone in pixels. */
  radius: number;
  /** Time accumulator for tick-based damage. */
  tickAccumulator: number;
  /** Movement speed reduction (0-1, e.g. 0.4 = 40% slow). */
  slowPercent: number;
  /** Whether this zone deals % max HP damage instead of flat. */
  percentHpDamage: boolean;
  /** The ability type for visual identification. */
  abilityType: string;
}

interface AbilityState {
  cooldownRemaining: number;
  baseCooldown: number;
}

/** Map from age number to ability ID. */
const AGE_ABILITY_MAP: Record<number, string> = {
  1: 'meteor_shower',
  2: 'chariot_rush',
  3: 'rain_of_arrows',
  4: 'plague',
  5: 'naval_bombardment',
  6: 'mustard_gas',
  7: 'airstrike',
  8: 'orbital_strike',
};

export class AbilitySystem {
  private readonly spatialGrid: SpatialGrid;
  private readonly events: EventEmitter<GameEvents>;
  private readonly abilityConfigs: AbilityConfigMap;

  /** Cooldown state per faction. */
  private readonly states: Map<string, AbilityState> = new Map();

  constructor(
    spatialGrid: SpatialGrid,
    events: EventEmitter<GameEvents>,
    abilityConfigs: AbilityConfigMap,
  ) {
    this.spatialGrid = spatialGrid;
    this.events = events;
    this.abilityConfigs = abilityConfigs;

    // Initialize states for both factions
    this.states.set('player', { cooldownRemaining: 0, baseCooldown: 45 });
    this.states.set('enemy', { cooldownRemaining: 0, baseCooldown: 45 });
  }

  /**
   * Called every frame. Ticks down cooldowns and processes active damage zones.
   */
  update(world: World, deltaTime: number): void {
    // Tick cooldowns
    for (const state of this.states.values()) {
      if (state.cooldownRemaining > 0) {
        state.cooldownRemaining = Math.max(0, state.cooldownRemaining - deltaTime);
      }
    }

    // Process active damage zones
    this.processDamageZones(world, deltaTime);
  }

  /**
   * Reduce cooldown by 1 second (called when a kill is scored).
   */
  onKill(faction: 'player' | 'enemy'): void {
    const state = this.states.get(faction);
    if (state && state.cooldownRemaining > 0) {
      state.cooldownRemaining = Math.max(0, state.cooldownRemaining - 1);
    }
  }

  /**
   * Check if the special ability is ready for a faction.
   */
  isReady(faction: 'player' | 'enemy'): boolean {
    const state = this.states.get(faction);
    return state !== undefined && state.cooldownRemaining <= 0;
  }

  /**
   * Get remaining cooldown in seconds.
   */
  getCooldownRemaining(faction: 'player' | 'enemy'): number {
    const state = this.states.get(faction);
    return state ? state.cooldownRemaining : 0;
  }

  /**
   * Get the ability config for a specific age.
   */
  getAbilityForAge(age: number): AbilityConfig | null {
    const abilityId = AGE_ABILITY_MAP[age];
    if (!abilityId) return null;
    return this.abilityConfigs[abilityId] ?? null;
  }

  /**
   * Activate the special ability for a faction at a target position.
   * Returns true if the ability was used, false if on cooldown or unavailable.
   */
  useSpecial(world: World, faction: 'player' | 'enemy', currentAge: number, targetX: number): boolean {
    const state = this.states.get(faction);
    if (!state || state.cooldownRemaining > 0) return false;

    const abilityId = AGE_ABILITY_MAP[currentAge];
    if (!abilityId) return false;

    const config = this.abilityConfigs[abilityId];
    if (!config) return false;

    // Start cooldown
    state.cooldownRemaining = config.cooldown;

    // Activate the ability based on its type
    const effect = config.effect;
    const targetY = 500; // ground level

    switch (effect.type) {
      case 'multi_impact':
        this.activateMultiImpact(world, faction, targetX, targetY, effect);
        break;
      case 'line_damage':
        this.activateLineDamage(world, faction, effect);
        break;
      case 'area_dot':
        this.activateAreaDoT(world, faction, targetX, targetY, effect);
        break;
      case 'percent_hp_dot':
        this.activatePercentHpDoT(world, faction, targetX, targetY, effect);
        break;
      case 'sequential_hits':
        this.activateSequentialHits(world, faction, targetX, targetY, effect);
        break;
      case 'area_dot_slow':
        this.activateAreaDoTSlow(world, faction, targetX, targetY, effect);
        break;
      case 'wide_splash':
        this.activateWideSplash(world, faction, targetX, targetY, effect);
        break;
      case 'charged_line':
        this.activateChargedLine(world, faction, targetX, targetY, effect);
        break;
    }

    return true;
  }

  // ── Ability Implementations ─────────────────────────────────────

  /**
   * Meteor Shower: 5 random impacts, 80 dmg each, splash.
   */
  private activateMultiImpact(
    world: World,
    faction: 'player' | 'enemy',
    centerX: number,
    centerY: number,
    effect: AbilityConfig['effect'],
  ): void {
    const impacts = effect.impacts ?? 5;
    const damage = effect.damage ?? 80;
    const radius = effect.radius ?? 60;
    const duration = effect.duration ?? 2;
    const spreadRange = 200;

    for (let i = 0; i < impacts; i++) {
      const offsetX = (Math.random() - 0.5) * spreadRange * 2;
      const impactX = centerX + offsetX;

      // Create a short-lived damage zone per impact
      const zoneId = world.createEntity();
      world.addComponent<Position>(zoneId, 'Position', { x: impactX, y: centerY });
      world.addComponent<Lifetime>(zoneId, 'Lifetime', { remaining: duration / impacts * (i + 1) });
      world.addComponent<DamageZone>(zoneId, 'DamageZone', {
        ownerFaction: faction,
        dps: damage / (duration / impacts),
        radius,
        tickAccumulator: 0,
        slowPercent: 0,
        percentHpDamage: false,
        abilityType: 'meteor_shower',
      });
      world.addComponent<Faction>(zoneId, 'Faction', { faction });

      this.spatialGrid.insert(zoneId, impactX, centerY);
    }
  }

  /**
   * Chariot Rush: line damage across field, 40 dmg.
   */
  private activateLineDamage(
    world: World,
    faction: 'player' | 'enemy',
    effect: AbilityConfig['effect'],
  ): void {
    const damage = effect.damage ?? 40;
    const width = effect.width ?? 80;
    const duration = effect.duration ?? 1.5;

    // Create a wide damage zone that spans the battlefield
    const zoneId = world.createEntity();
    const centerX = 800; // middle of battlefield
    world.addComponent<Position>(zoneId, 'Position', { x: centerX, y: 500 });
    world.addComponent<Lifetime>(zoneId, 'Lifetime', { remaining: duration });
    world.addComponent<DamageZone>(zoneId, 'DamageZone', {
      ownerFaction: faction,
      dps: damage / duration,
      radius: width,
      tickAccumulator: 0,
      slowPercent: 0,
      percentHpDamage: false,
      abilityType: 'chariot_rush',
    });
    world.addComponent<Faction>(zoneId, 'Faction', { faction });

    this.spatialGrid.insert(zoneId, centerX, 500);
  }

  /**
   * Rain of Arrows: area DoT, 60 dmg over 3s.
   */
  private activateAreaDoT(
    world: World,
    faction: 'player' | 'enemy',
    targetX: number,
    targetY: number,
    effect: AbilityConfig['effect'],
  ): void {
    const damage = effect.damage ?? 60;
    const radius = effect.radius ?? 200;
    const duration = effect.duration ?? 3;

    const zoneId = world.createEntity();
    world.addComponent<Position>(zoneId, 'Position', { x: targetX, y: targetY });
    world.addComponent<Lifetime>(zoneId, 'Lifetime', { remaining: duration });
    world.addComponent<DamageZone>(zoneId, 'DamageZone', {
      ownerFaction: faction,
      dps: damage / duration,
      radius,
      tickAccumulator: 0,
      slowPercent: 0,
      percentHpDamage: false,
      abilityType: 'rain_of_arrows',
    });
    world.addComponent<Faction>(zoneId, 'Faction', { faction });

    this.spatialGrid.insert(zoneId, targetX, targetY);
  }

  /**
   * Plague: 5% max HP/s for 8s in area.
   */
  private activatePercentHpDoT(
    world: World,
    faction: 'player' | 'enemy',
    targetX: number,
    targetY: number,
    effect: AbilityConfig['effect'],
  ): void {
    const percentPerSecond = effect.percentPerSecond ?? 5;
    const radius = effect.radius ?? 150;
    const duration = effect.duration ?? 8;

    const zoneId = world.createEntity();
    world.addComponent<Position>(zoneId, 'Position', { x: targetX, y: targetY });
    world.addComponent<Lifetime>(zoneId, 'Lifetime', { remaining: duration });
    world.addComponent<DamageZone>(zoneId, 'DamageZone', {
      ownerFaction: faction,
      dps: percentPerSecond,
      radius,
      tickAccumulator: 0,
      slowPercent: 0,
      percentHpDamage: true,
      abilityType: 'plague',
    });
    world.addComponent<Faction>(zoneId, 'Faction', { faction });

    this.spatialGrid.insert(zoneId, targetX, targetY);
  }

  /**
   * Naval Bombardment: 6 sequential hits, 100 dmg each.
   */
  private activateSequentialHits(
    world: World,
    faction: 'player' | 'enemy',
    centerX: number,
    centerY: number,
    effect: AbilityConfig['effect'],
  ): void {
    const hits = effect.hits ?? 6;
    const damage = effect.damage ?? 100;
    const radius = effect.radius ?? 40;
    const duration = effect.duration ?? 3;
    const interval = duration / hits;

    for (let i = 0; i < hits; i++) {
      const offsetX = (Math.random() - 0.5) * 300;
      const impactX = centerX + offsetX;

      const zoneId = world.createEntity();
      world.addComponent<Position>(zoneId, 'Position', { x: impactX, y: centerY });
      world.addComponent<Lifetime>(zoneId, 'Lifetime', { remaining: interval * (i + 1) });
      world.addComponent<DamageZone>(zoneId, 'DamageZone', {
        ownerFaction: faction,
        dps: damage / interval,
        radius,
        tickAccumulator: 0,
        slowPercent: 0,
        percentHpDamage: false,
        abilityType: 'naval_bombardment',
      });
      world.addComponent<Faction>(zoneId, 'Faction', { faction });

      this.spatialGrid.insert(zoneId, impactX, centerY);
    }
  }

  /**
   * Mustard Gas: area 15 DPS + slow for 10s.
   */
  private activateAreaDoTSlow(
    world: World,
    faction: 'player' | 'enemy',
    targetX: number,
    targetY: number,
    effect: AbilityConfig['effect'],
  ): void {
    const dps = effect.dps ?? 15;
    const slowPercent = effect.slowPercent ?? 40;
    const radius = effect.radius ?? 250;
    const duration = effect.duration ?? 10;

    const zoneId = world.createEntity();
    world.addComponent<Position>(zoneId, 'Position', { x: targetX, y: targetY });
    world.addComponent<Lifetime>(zoneId, 'Lifetime', { remaining: duration });
    world.addComponent<DamageZone>(zoneId, 'DamageZone', {
      ownerFaction: faction,
      dps,
      radius,
      tickAccumulator: 0,
      slowPercent,
      percentHpDamage: false,
      abilityType: 'mustard_gas',
    });
    world.addComponent<Faction>(zoneId, 'Faction', { faction });

    this.spatialGrid.insert(zoneId, targetX, targetY);
  }

  /**
   * Airstrike: 3 wide splash hits, 120 dmg each.
   */
  private activateWideSplash(
    world: World,
    faction: 'player' | 'enemy',
    centerX: number,
    centerY: number,
    effect: AbilityConfig['effect'],
  ): void {
    const hits = effect.hits ?? 3;
    const damage = effect.damage ?? 120;
    const radius = effect.radius ?? 100;
    const duration = effect.duration ?? 2;
    const interval = duration / hits;

    for (let i = 0; i < hits; i++) {
      const offsetX = (i - 1) * 150;
      const impactX = centerX + offsetX;

      const zoneId = world.createEntity();
      world.addComponent<Position>(zoneId, 'Position', { x: impactX, y: centerY });
      world.addComponent<Lifetime>(zoneId, 'Lifetime', { remaining: interval * (i + 1) });
      world.addComponent<DamageZone>(zoneId, 'DamageZone', {
        ownerFaction: faction,
        dps: damage / interval,
        radius,
        tickAccumulator: 0,
        slowPercent: 0,
        percentHpDamage: false,
        abilityType: 'airstrike',
      });
      world.addComponent<Faction>(zoneId, 'Faction', { faction });

      this.spatialGrid.insert(zoneId, impactX, centerY);
    }
  }

  /**
   * Orbital Strike: 2s charge then 500 dmg line.
   */
  private activateChargedLine(
    world: World,
    faction: 'player' | 'enemy',
    targetX: number,
    targetY: number,
    effect: AbilityConfig['effect'],
  ): void {
    const chargeTime = effect.chargeTime ?? 2;
    const damage = effect.damage ?? 500;
    const width = effect.width ?? 300;
    const duration = effect.duration ?? 3;

    // Create a warning zone during charge (no damage)
    const warningId = world.createEntity();
    world.addComponent<Position>(warningId, 'Position', { x: targetX, y: targetY });
    world.addComponent<Lifetime>(warningId, 'Lifetime', { remaining: chargeTime });
    world.addComponent<DamageZone>(warningId, 'DamageZone', {
      ownerFaction: faction,
      dps: 0,
      radius: width / 2,
      tickAccumulator: 0,
      slowPercent: 0,
      percentHpDamage: false,
      abilityType: 'orbital_strike_warning',
    });
    world.addComponent<Faction>(warningId, 'Faction', { faction });
    this.spatialGrid.insert(warningId, targetX, targetY);

    // Create the actual damage zone (delayed by chargeTime)
    // Since we can't truly delay, we create it with a longer lifetime
    // and high burst damage divided over a short window
    const damageZoneId = world.createEntity();
    world.addComponent<Position>(damageZoneId, 'Position', { x: targetX, y: targetY });
    world.addComponent<Lifetime>(damageZoneId, 'Lifetime', { remaining: duration });
    world.addComponent<DamageZone>(damageZoneId, 'DamageZone', {
      ownerFaction: faction,
      dps: damage / (duration - chargeTime),
      radius: width / 2,
      tickAccumulator: -chargeTime, // negative accumulator delays initial damage
      slowPercent: 0,
      percentHpDamage: false,
      abilityType: 'orbital_strike',
    });
    world.addComponent<Faction>(damageZoneId, 'Faction', { faction });
    this.spatialGrid.insert(damageZoneId, targetX, targetY);
  }

  // ── Damage Zone Processing ──────────────────────────────────────

  /**
   * Process all active damage zones, applying damage to enemies inside them.
   */
  private processDamageZones(world: World, deltaTime: number): void {
    const zones = world.query('DamageZone', 'Position', 'Faction');

    for (let i = 0; i < zones.length; i++) {
      const zoneId = zones[i];
      const zone = world.getComponent<DamageZone>(zoneId, 'DamageZone')!;
      const zonePos = world.getComponent<Position>(zoneId, 'Position')!;

      // Skip if DPS is 0 (warning zone) or accumulator is negative (delayed)
      zone.tickAccumulator += deltaTime;
      if (zone.dps <= 0 || zone.tickAccumulator < 0) continue;

      // Apply damage every 0.5 seconds
      const tickInterval = 0.5;
      if (zone.tickAccumulator < tickInterval) continue;

      // Reset accumulator (keep remainder)
      zone.tickAccumulator -= tickInterval;

      const candidates = this.spatialGrid.queryRange(zonePos.x, zonePos.y, zone.radius);

      for (let j = 0; j < candidates.length; j++) {
        const candidateId = candidates[j];
        if (candidateId === zoneId) continue;
        if (!world.isAlive(candidateId)) continue;

        const candidateFaction = world.getComponent<Faction>(candidateId, 'Faction');
        if (!candidateFaction || candidateFaction.faction === zone.ownerFaction) continue;
        if (!world.hasComponent(candidateId, 'Health')) continue;

        const candidatePos = world.getComponent<Position>(candidateId, 'Position')!;
        const dx = candidatePos.x - zonePos.x;
        const dy = candidatePos.y - zonePos.y;
        const distSq = dx * dx + dy * dy;
        if (distSq > zone.radius * zone.radius) continue;

        const health = world.getComponent<Health>(candidateId, 'Health')!;

        let damage: number;
        if (zone.percentHpDamage) {
          // % max HP damage per tick
          damage = Math.round(health.max * (zone.dps / 100) * tickInterval);
        } else {
          damage = Math.round(zone.dps * tickInterval);
        }

        health.current -= damage;

        this.events.emit('damage', {
          attackerId: zoneId,
          targetId: candidateId,
          damage,
          remainingHp: health.current,
        });

        // Apply slow effect if applicable
        if (zone.slowPercent > 0) {
          const velocity = world.getComponent<{ dx: number; dy: number }>(candidateId, 'Velocity');
          if (velocity) {
            const slowFactor = 1 - zone.slowPercent / 100;
            // We only apply slow for the tick; the original speed would need
            // to be tracked externally for full implementation. For now, we
            // reduce the velocity temporarily.
            velocity.dx *= slowFactor;
            velocity.dy *= slowFactor;
          }
        }
      }
    }
  }

  /**
   * Reset ability state (for new game).
   */
  reset(): void {
    this.states.set('player', { cooldownRemaining: 0, baseCooldown: 45 });
    this.states.set('enemy', { cooldownRemaining: 0, baseCooldown: 45 });
  }
}
