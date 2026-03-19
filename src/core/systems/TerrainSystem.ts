/**
 * TerrainSystem — applies terrain modifiers to units based on position.
 *
 * Each frame, checks unit positions against terrain zones and applies:
 * - Speed reduction in rivers
 * - Range/damage bonuses on high ground
 * - Accuracy penalty in forests
 * - Damage reduction in ruins
 * - Combat width limits at bridges/chokes
 */

import { World } from '../ecs/World';
import type { Position } from '../components/Position';
import type { Velocity } from '../components/Velocity';
import type { Combat } from '../components/Combat';
import type { Faction } from '../components/Faction';
import type { UnitType } from '../components/UnitType';
import type { TerrainManager, ActiveTerrainZone } from '../managers/TerrainManager';

/**
 * Tracks original velocities so terrain speed reduction can be properly
 * applied and removed as units enter/leave terrain zones.
 */
interface OriginalSpeed {
  baseDx: number;
}

export class TerrainSystem {
  private readonly terrainManager: TerrainManager;

  /** Tracks which entities are currently in a speed-reducing zone. */
  private readonly inSpeedZone: Map<number, OriginalSpeed> = new Map();

  constructor(terrainManager: TerrainManager) {
    this.terrainManager = terrainManager;
  }

  update(world: World, _deltaTime: number): void {
    const entities = world.query('Position', 'Velocity', 'Faction');

    const activeZones = this.terrainManager.getActiveZones();
    if (activeZones.length === 0) return;

    for (let i = 0; i < entities.length; i++) {
      const entityId = entities[i];
      const pos = world.getComponent<Position>(entityId, 'Position')!;
      const vel = world.getComponent<Velocity>(entityId, 'Velocity')!;

      const zone = this.terrainManager.getTerrainAtX(pos.x);

      if (zone) {
        this.applyTerrainEffects(world, entityId, vel, zone);
      } else {
        this.removeSpeedEffect(entityId, vel);
      }
    }
  }

  /**
   * Apply terrain effects to an entity.
   */
  private applyTerrainEffects(
    world: World,
    entityId: number,
    vel: Velocity,
    zone: ActiveTerrainZone,
  ): void {
    // Speed reduction (river)
    if (zone.config.speedReduction && zone.config.speedReduction > 0) {
      if (!this.inSpeedZone.has(entityId)) {
        // Store original speed and apply reduction
        this.inSpeedZone.set(entityId, { baseDx: vel.dx });
        const factor = 1 - zone.config.speedReduction;
        vel.dx *= factor;
      }
    } else {
      this.removeSpeedEffect(entityId, vel);
    }
  }

  /**
   * Remove speed reduction when unit leaves a speed zone.
   */
  private removeSpeedEffect(entityId: number, vel: Velocity): void {
    const original = this.inSpeedZone.get(entityId);
    if (original) {
      vel.dx = original.baseDx;
      this.inSpeedZone.delete(entityId);
    }
  }

  /**
   * Get combat modifiers for an entity at a given position.
   * Called by CombatSystem to adjust damage/range calculations.
   */
  getCombatModifiers(
    world: World,
    entityId: number,
    pos: Position,
  ): TerrainCombatModifiers {
    const mods: TerrainCombatModifiers = {
      damageMultiplier: 1.0,
      rangeMultiplier: 1.0,
      rangedAccuracyPenalty: 0,
      rangedDamageReduction: 0,
      meleeDamageBonus: 0,
    };

    const zone = this.terrainManager.getTerrainAtX(pos.x);
    if (!zone) return mods;

    // High Ground: +15% range, +10% damage
    if (zone.config.rangeBonus) {
      mods.rangeMultiplier = 1 + zone.config.rangeBonus;
    }
    if (zone.config.damageBonus) {
      mods.damageMultiplier = 1 + zone.config.damageBonus;
    }

    // Forest: -30% ranged accuracy, +10% melee damage
    if (zone.config.rangedAccuracyPenalty) {
      mods.rangedAccuracyPenalty = zone.config.rangedAccuracyPenalty;
    }
    if (zone.config.meleeDamageBonus) {
      mods.meleeDamageBonus = zone.config.meleeDamageBonus;
    }

    // Ruins: -25% ranged damage taken
    if (zone.config.rangedDamageReduction) {
      mods.rangedDamageReduction = zone.config.rangedDamageReduction;
    }

    return mods;
  }

  /**
   * Reset state for a new game.
   */
  reset(): void {
    this.inSpeedZone.clear();
  }
}

/** Combat modifiers returned by the terrain system. */
export interface TerrainCombatModifiers {
  damageMultiplier: number;
  rangeMultiplier: number;
  rangedAccuracyPenalty: number;
  rangedDamageReduction: number;
  meleeDamageBonus: number;
}
