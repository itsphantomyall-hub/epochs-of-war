/**
 * LifetimeSystem — auto-destroys entities when their Lifetime expires.
 *
 * Decrements Lifetime.remaining by deltaTime each frame.
 * When remaining <= 0, marks the entity for cleanup via world.destroyEntity().
 */

import { World } from '../ecs/World';
import type { Lifetime } from '../components/Lifetime';

export class LifetimeSystem {
  update(world: World, deltaTime: number): void {
    const entities = world.query('Lifetime');

    for (let i = 0; i < entities.length; i++) {
      const id = entities[i];
      const lifetime = world.getComponent<Lifetime>(id, 'Lifetime')!;

      lifetime.remaining -= deltaTime;

      if (lifetime.remaining <= 0) {
        world.destroyEntity(id);
      }
    }
  }
}
