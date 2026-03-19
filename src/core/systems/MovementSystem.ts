/**
 * MovementSystem — applies Velocity to Position each frame.
 *
 * Units stop moving when an enemy is within combat range (engagement).
 * Clamps entities to the battlefield bounds (0 – BATTLEFIELD_WIDTH px).
 */

import { World } from '../ecs/World';
import { SpatialGrid } from '../../utils/SpatialGrid';
import type { Position } from '../components/Position';
import type { Velocity } from '../components/Velocity';
import type { Combat } from '../components/Combat';
import type { Faction } from '../components/Faction';

const BATTLEFIELD_MIN_X = 0;
const BATTLEFIELD_MAX_X = 1600;
const BATTLEFIELD_MIN_Y = 0;
const BATTLEFIELD_MAX_Y = 600; // reasonable default height

export class MovementSystem {
  private readonly spatialGrid: SpatialGrid;

  constructor(spatialGrid?: SpatialGrid) {
    // Accept optional spatialGrid for enemy-in-range checks
    this.spatialGrid = spatialGrid ?? null!;
  }

  update(world: World, deltaTime: number): void {
    const entities = world.query('Position', 'Velocity');

    for (let i = 0; i < entities.length; i++) {
      const id = entities[i];
      const pos = world.getComponent<Position>(id, 'Position')!;
      const vel = world.getComponent<Velocity>(id, 'Velocity')!;

      // If this entity has combat capability and there's an enemy in range, stop moving
      if (this.spatialGrid) {
        const combat = world.getComponent<Combat>(id, 'Combat');
        const faction = world.getComponent<Faction>(id, 'Faction');
        if (combat && faction) {
          const effectiveRange = combat.range > 0 ? combat.range : 40;
          if (this.hasEnemyInRange(world, id, pos, faction.faction, effectiveRange)) {
            // Unit is engaged — don't move
            continue;
          }
        }
      }

      pos.x += vel.dx * deltaTime;
      pos.y += vel.dy * deltaTime;

      // Clamp to battlefield bounds
      if (pos.x < BATTLEFIELD_MIN_X) pos.x = BATTLEFIELD_MIN_X;
      if (pos.x > BATTLEFIELD_MAX_X) pos.x = BATTLEFIELD_MAX_X;
      if (pos.y < BATTLEFIELD_MIN_Y) pos.y = BATTLEFIELD_MIN_Y;
      if (pos.y > BATTLEFIELD_MAX_Y) pos.y = BATTLEFIELD_MAX_Y;
    }
  }

  /**
   * Check if there is at least one enemy within range using the spatial grid.
   */
  private hasEnemyInRange(
    world: World,
    selfId: number,
    selfPos: Position,
    selfFaction: 'player' | 'enemy',
    range: number,
  ): boolean {
    const candidates = this.spatialGrid.queryRange(selfPos.x, selfPos.y, range);
    const rangeSq = range * range;

    for (let i = 0; i < candidates.length; i++) {
      const cid = candidates[i];
      if (cid === selfId) continue;
      if (!world.isAlive(cid)) continue;

      const cf = world.getComponent<Faction>(cid, 'Faction');
      if (!cf || cf.faction === selfFaction) continue;

      // Must be damageable
      if (!world.hasComponent(cid, 'Health')) continue;

      const cp = world.getComponent<Position>(cid, 'Position')!;
      const dx = cp.x - selfPos.x;
      const dy = cp.y - selfPos.y;
      if (dx * dx + dy * dy <= rangeSq) {
        return true;
      }
    }
    return false;
  }
}
