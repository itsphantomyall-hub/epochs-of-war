/**
 * MovementSystem — applies Velocity to Position each frame.
 *
 * Clamps entities to the battlefield bounds (0 – BATTLEFIELD_WIDTH px).
 */

import { World } from '../ecs/World';
import type { Position } from '../components/Position';
import type { Velocity } from '../components/Velocity';

const BATTLEFIELD_MIN_X = 0;
const BATTLEFIELD_MAX_X = 1600;
const BATTLEFIELD_MIN_Y = 0;
const BATTLEFIELD_MAX_Y = 600; // reasonable default height

export class MovementSystem {
  update(world: World, deltaTime: number): void {
    const entities = world.query('Position', 'Velocity');

    for (let i = 0; i < entities.length; i++) {
      const id = entities[i];
      const pos = world.getComponent<Position>(id, 'Position')!;
      const vel = world.getComponent<Velocity>(id, 'Velocity')!;

      pos.x += vel.dx * deltaTime;
      pos.y += vel.dy * deltaTime;

      // Clamp to battlefield bounds
      if (pos.x < BATTLEFIELD_MIN_X) pos.x = BATTLEFIELD_MIN_X;
      if (pos.x > BATTLEFIELD_MAX_X) pos.x = BATTLEFIELD_MAX_X;
      if (pos.y < BATTLEFIELD_MIN_Y) pos.y = BATTLEFIELD_MIN_Y;
      if (pos.y > BATTLEFIELD_MAX_Y) pos.y = BATTLEFIELD_MAX_Y;
    }
  }
}
