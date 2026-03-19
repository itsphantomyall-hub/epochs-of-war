/**
 * CleanupSystem — removes dead entities from the World and SpatialGrid.
 *
 * Should run as the last system each frame. It calls world.flushRemovals()
 * which processes all entities that were marked via world.destroyEntity().
 */

import { World } from '../ecs/World';
import { SpatialGrid } from '../../utils/SpatialGrid';

export class CleanupSystem {
  private readonly spatialGrid: SpatialGrid;

  /** Entities collected from death events to remove from spatial grid. */
  private readonly deadIds: number[] = [];

  constructor(spatialGrid: SpatialGrid) {
    this.spatialGrid = spatialGrid;
  }

  /** Call this from a 'death' event listener to track IDs needing spatial cleanup. */
  markDead(entityId: number): void {
    this.deadIds.push(entityId);
  }

  update(world: World, _deltaTime: number): void {
    // Remove dead entities from spatial grid
    for (let i = 0; i < this.deadIds.length; i++) {
      this.spatialGrid.remove(this.deadIds[i]);
    }
    this.deadIds.length = 0;

    // Flush deferred entity removals from the World
    world.flushRemovals();
  }
}
