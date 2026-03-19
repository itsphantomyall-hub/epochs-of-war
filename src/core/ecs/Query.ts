/**
 * Query — a reusable, cacheable query over the World.
 *
 * Wraps World.query() with a fixed set of required component names so
 * systems can declare their queries once and re-execute each frame.
 */

import { EntityId } from './Entity';
import type { World } from './World';

export class Query {
  private readonly world: World;
  private readonly required: string[];

  constructor(world: World, required: string[]) {
    this.world = world;
    this.required = required;
  }

  /** Execute the query and return matching entity IDs. */
  execute(): EntityId[] {
    return this.world.query(...this.required);
  }

  /**
   * Execute and iterate with a callback — avoids allocating a
   * second array when you just need to loop.
   */
  forEach(fn: (entityId: EntityId) => void): void {
    const ids = this.execute();
    for (let i = 0; i < ids.length; i++) {
      fn(ids[i]);
    }
  }

  /** Convenience: get the first matching entity (or undefined). */
  first(): EntityId | undefined {
    const ids = this.execute();
    return ids.length > 0 ? ids[0] : undefined;
  }

  /** Convenience: number of matching entities. */
  count(): number {
    return this.execute().length;
  }
}
