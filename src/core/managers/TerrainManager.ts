/**
 * TerrainManager — generates and stores the active terrain layout for the current match.
 *
 * At match start, randomly selects 1-3 terrain features and assigns them
 * non-overlapping zones between the two bases (x: 200 - 1400).
 */

import { World } from '../ecs/World';
import { EntityId } from '../ecs/Entity';
import type { Position } from '../components/Position';
import type { Renderable } from '../components/Renderable';
import type { TerrainZoneComponent } from '../components/TerrainZone';

/** Terrain config as loaded from terrain.json. */
export interface TerrainConfig {
  name: string;
  effect?: string;
  combatWidth?: number;
  rangeBonus?: number;
  damageBonus?: number;
  xStart?: number;
  xEnd?: number;
  speedReduction?: number;
  rangedAccuracyPenalty?: number;
  meleeDamageBonus?: number;
  rangedDamageReduction?: number;
}

export interface TerrainConfigMap {
  [terrainId: string]: TerrainConfig;
}

export interface TerrainFile {
  terrains: TerrainConfigMap;
}

/** Active terrain zone on the battlefield. */
export interface ActiveTerrainZone {
  terrainId: string;
  entityId: EntityId;
  xStart: number;
  xEnd: number;
  config: TerrainConfig;
}

/** The playable zone for terrain placement (between bases). */
const TERRAIN_MIN_X = 200;
const TERRAIN_MAX_X = 1400;
const ZONE_WIDTH = 200; // default width for a terrain zone
const TERRAIN_Y = 500;  // ground level

export class TerrainManager {
  private readonly world: World;
  private readonly terrainConfigs: TerrainConfigMap;
  private readonly activeZones: ActiveTerrainZone[] = [];

  constructor(world: World, terrainConfigs: TerrainConfigMap) {
    this.world = world;
    this.terrainConfigs = terrainConfigs;
  }

  /**
   * Generate terrain for a new match.
   * Randomly selects 1-3 terrain features (excluding open_plains as it has no effect)
   * and places them in non-overlapping zones.
   */
  generateTerrain(): void {
    this.clearTerrain();

    // Get terrain types that have actual effects
    const terrainIds = Object.keys(this.terrainConfigs).filter(
      (id) => id !== 'open_plains',
    );

    // Randomly select 1-3 terrain features
    const count = 1 + Math.floor(Math.random() * 3); // 1-3
    const shuffled = this.shuffle(terrainIds);
    const selected = shuffled.slice(0, Math.min(count, shuffled.length));

    // Divide the playable zone into slots
    const totalWidth = TERRAIN_MAX_X - TERRAIN_MIN_X;
    const slotWidth = totalWidth / selected.length;

    for (let i = 0; i < selected.length; i++) {
      const terrainId = selected[i];
      const config = this.terrainConfigs[terrainId];

      // Calculate zone position
      const xStart = config.xStart ?? (TERRAIN_MIN_X + i * slotWidth + slotWidth * 0.1);
      const xEnd = config.xEnd ?? (TERRAIN_MIN_X + i * slotWidth + slotWidth * 0.9);

      // Create ECS entity for the terrain zone
      const entityId = this.world.createEntity();
      const centerX = (xStart + xEnd) / 2;

      this.world.addComponent<Position>(entityId, 'Position', {
        x: centerX,
        y: TERRAIN_Y,
      });

      this.world.addComponent<TerrainZoneComponent>(entityId, 'TerrainZone', {
        terrainId,
        name: config.name,
        xStart,
        xEnd,
        speedReduction: config.speedReduction ?? 0,
        rangeBonus: config.rangeBonus ?? 0,
        damageBonus: config.damageBonus ?? 0,
        rangedAccuracyPenalty: config.rangedAccuracyPenalty ?? 0,
        meleeDamageBonus: config.meleeDamageBonus ?? 0,
        rangedDamageReduction: config.rangedDamageReduction ?? 0,
        combatWidth: config.combatWidth ?? 0,
      });

      this.world.addComponent<Renderable>(entityId, 'Renderable', {
        spriteKey: `terrain_${terrainId}`,
        animation: 'idle',
        layer: 0, // terrain renders below units
        visible: true,
        flipX: false,
      });

      this.activeZones.push({
        terrainId,
        entityId,
        xStart,
        xEnd,
        config,
      });
    }
  }

  /**
   * Get all active terrain zones.
   */
  getActiveZones(): ReadonlyArray<ActiveTerrainZone> {
    return this.activeZones;
  }

  /**
   * Get the terrain zone a unit is currently in, based on x position.
   * Returns null if not in any terrain zone.
   */
  getTerrainAtX(x: number): ActiveTerrainZone | null {
    for (let i = 0; i < this.activeZones.length; i++) {
      const zone = this.activeZones[i];
      if (x >= zone.xStart && x <= zone.xEnd) {
        return zone;
      }
    }
    return null;
  }

  /**
   * Get all terrain zones that overlap with a given x range.
   */
  getTerrainInRange(xStart: number, xEnd: number): ActiveTerrainZone[] {
    const result: ActiveTerrainZone[] = [];
    for (let i = 0; i < this.activeZones.length; i++) {
      const zone = this.activeZones[i];
      if (zone.xStart <= xEnd && zone.xEnd >= xStart) {
        result.push(zone);
      }
    }
    return result;
  }

  /**
   * Clear all terrain zones.
   */
  private clearTerrain(): void {
    for (const zone of this.activeZones) {
      if (this.world.isAlive(zone.entityId)) {
        this.world.destroyEntity(zone.entityId);
      }
    }
    this.activeZones.length = 0;
  }

  /**
   * Fisher-Yates shuffle.
   */
  private shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  /**
   * Reset for a new game.
   */
  reset(): void {
    this.clearTerrain();
  }
}
