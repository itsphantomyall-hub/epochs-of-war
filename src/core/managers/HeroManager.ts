/**
 * HeroManager — manages hero lifecycle for both factions.
 *
 * Handles deploying heroes on age transition, tracking hero entities,
 * and removing old heroes when a new age is reached.
 */

import { World } from '../ecs/World';
import { EntityId } from '../ecs/Entity';
import type { Position } from '../components/Position';
import type { Velocity } from '../components/Velocity';
import type { Health } from '../components/Health';
import type { Combat } from '../components/Combat';
import type { Faction } from '../components/Faction';
import type { UnitType } from '../components/UnitType';
import type { AgeTag } from '../components/AgeTag';
import type { Renderable } from '../components/Renderable';
import type { HeroComponent } from '../components/Hero';
import { SpatialGrid } from '../../utils/SpatialGrid';

/** Hero config as loaded from heroes.json. */
export interface HeroAbilityEffect {
  type: string;
  duration?: number;
  radius?: number;
  damage?: number;
  multiplier?: number;
  hpThreshold?: number;
  damageMultiplier?: number;
  healPercent?: number;
  strikes?: number;
  turretDamage?: number;
  turretFireRate?: number;
  turretRange?: number;
  fireRateMultiplier?: number;
  rewindSeconds?: number;
  pullStrength?: number;
  distance?: number;
}

export interface HeroAbilityConfig {
  id: string;
  name: string;
  cooldown: number;
  effect: HeroAbilityEffect;
}

export interface HeroConfig {
  displayName: string;
  age: number;
  hp: number;
  damage: number;
  speed: number;
  range: number;
  attackSpeed: number;
  abilities: [HeroAbilityConfig, HeroAbilityConfig];
}

export interface HeroConfigMap {
  [heroId: string]: HeroConfig;
}

export interface HeroesFile {
  heroes: HeroConfigMap;
}

/** Map from age number to hero config ID. */
const AGE_HERO_MAP: Record<number, string> = {
  1: 'grok',
  2: 'sargon',
  3: 'leonidas',
  4: 'joan_of_arc',
  5: 'napoleon',
  6: 'iron_baron',
  7: 'commander_steele',
  8: 'axiom_7',
};

/** Player hero spawns near player base, enemy near enemy base. */
const PLAYER_HERO_SPAWN_X = 120;
const ENEMY_HERO_SPAWN_X = 1480;
const HERO_SPAWN_Y = 500;

/** XP thresholds for hero levels 2 and 3. */
const XP_THRESHOLDS = [30, 60, 100];

export class HeroManager {
  private readonly world: World;
  private readonly spatialGrid: SpatialGrid;
  private readonly heroConfigs: HeroConfigMap;

  /** Currently active hero entity per faction (null if no hero or hero is dead). */
  private readonly activeHeroes: Map<string, EntityId | null> = new Map();

  /** Whether hero is dead and cannot respawn until next age, per faction. */
  private readonly heroDeadUntilNextAge: Map<string, boolean> = new Map();

  constructor(world: World, spatialGrid: SpatialGrid, heroConfigs: HeroConfigMap) {
    this.world = world;
    this.spatialGrid = spatialGrid;
    this.heroConfigs = heroConfigs;

    this.activeHeroes.set('player', null);
    this.activeHeroes.set('enemy', null);
    this.heroDeadUntilNextAge.set('player', false);
    this.heroDeadUntilNextAge.set('enemy', false);
  }

  /**
   * Deploy the hero for a given faction and age.
   * Creates the hero entity with all required ECS components.
   * Returns the entity ID or null if no hero exists for that age.
   */
  deployHero(faction: 'player' | 'enemy', age: number): EntityId | null {
    const heroId = AGE_HERO_MAP[age];
    if (!heroId) return null;

    const config = this.heroConfigs[heroId];
    if (!config) return null;

    // Remove existing hero first
    this.removeHero(faction);

    const entityId = this.world.createEntity();
    const isPlayer = faction === 'player';
    const spawnX = isPlayer ? PLAYER_HERO_SPAWN_X : ENEMY_HERO_SPAWN_X;
    const direction = isPlayer ? 1 : -1;

    // Position
    this.world.addComponent<Position>(entityId, 'Position', {
      x: spawnX,
      y: HERO_SPAWN_Y,
    });

    // Velocity — hero moves toward enemy base
    this.world.addComponent<Velocity>(entityId, 'Velocity', {
      dx: config.speed * direction * 30,
      dy: 0,
    });

    // Health
    this.world.addComponent<Health>(entityId, 'Health', {
      current: config.hp,
      max: config.hp,
    });

    // Combat
    this.world.addComponent<Combat>(entityId, 'Combat', {
      damage: config.damage,
      range: config.range,
      attackSpeed: config.attackSpeed,
      lastAttackTime: -Infinity,
      projectileType: '',
    });

    // Faction
    this.world.addComponent<Faction>(entityId, 'Faction', { faction });

    // UnitType — heroes use 'hero' type
    this.world.addComponent<UnitType>(entityId, 'UnitType', {
      type: 'hero',
      unitId: heroId,
      age,
    });

    // AgeTag
    this.world.addComponent<AgeTag>(entityId, 'AgeTag', { age });

    // Renderable
    this.world.addComponent<Renderable>(entityId, 'Renderable', {
      spriteKey: `hero_${heroId}`,
      animation: 'walk',
      layer: 3, // heroes render above normal units
      visible: true,
      flipX: !isPlayer,
    });

    // Hero component
    this.world.addComponent<HeroComponent>(entityId, 'Hero', {
      heroId,
      level: 1,
      xp: 0,
      xpToLevel: XP_THRESHOLDS[0],
      ability1Cooldown: 0,
      ability2Cooldown: 0,
      ability1MaxCooldown: config.abilities[0].cooldown,
      ability2MaxCooldown: config.abilities[1].cooldown,
      isDead: false,
    });

    // Insert into spatial grid
    this.spatialGrid.insert(entityId, spawnX, HERO_SPAWN_Y);

    // Track as active
    this.activeHeroes.set(faction, entityId);
    this.heroDeadUntilNextAge.set(faction, false);

    return entityId;
  }

  /**
   * Get the hero entity ID for a faction, or null if no hero is active.
   */
  getHero(faction: 'player' | 'enemy'): EntityId | null {
    return this.activeHeroes.get(faction) ?? null;
  }

  /**
   * Check if the hero for a faction is alive.
   */
  isHeroAlive(faction: 'player' | 'enemy'): boolean {
    const heroId = this.activeHeroes.get(faction);
    if (heroId === null || heroId === undefined) return false;
    return this.world.isAlive(heroId);
  }

  /**
   * Mark the hero as dead for a faction. Cannot respawn until next age evolution.
   */
  onHeroDeath(faction: 'player' | 'enemy'): void {
    this.activeHeroes.set(faction, null);
    this.heroDeadUntilNextAge.set(faction, true);
  }

  /**
   * Handle age evolution: remove old hero and deploy the new one.
   */
  onAgeUp(faction: 'player' | 'enemy', newAge: number): EntityId | null {
    this.removeHero(faction);
    this.heroDeadUntilNextAge.set(faction, false);
    return this.deployHero(faction, newAge);
  }

  /**
   * Get the hero config for a specific hero ID.
   */
  getHeroConfig(heroId: string): HeroConfig | undefined {
    return this.heroConfigs[heroId];
  }

  /**
   * Get the hero config for a specific age.
   */
  getHeroConfigForAge(age: number): HeroConfig | undefined {
    const heroId = AGE_HERO_MAP[age];
    if (!heroId) return undefined;
    return this.heroConfigs[heroId];
  }

  /**
   * Get the hero ID string for an age number.
   */
  getHeroIdForAge(age: number): string | undefined {
    return AGE_HERO_MAP[age];
  }

  /**
   * Check whether the hero died and hasn't been replaced by a new age yet.
   */
  isHeroDeadUntilNextAge(faction: 'player' | 'enemy'): boolean {
    return this.heroDeadUntilNextAge.get(faction) ?? false;
  }

  /**
   * Remove the current hero entity for a faction.
   */
  private removeHero(faction: 'player' | 'enemy'): void {
    const heroEntityId = this.activeHeroes.get(faction);
    if (heroEntityId !== null && heroEntityId !== undefined) {
      if (this.world.isAlive(heroEntityId)) {
        this.world.destroyEntity(heroEntityId);
        this.spatialGrid.remove(heroEntityId);
      }
    }
    this.activeHeroes.set(faction, null);
  }

  /**
   * Reset state for a new game.
   */
  reset(): void {
    this.activeHeroes.set('player', null);
    this.activeHeroes.set('enemy', null);
    this.heroDeadUntilNextAge.set('player', false);
    this.heroDeadUntilNextAge.set('enemy', false);
  }
}
