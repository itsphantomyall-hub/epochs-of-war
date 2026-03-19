/**
 * HealthSystem — checks for dead entities (HP <= 0), marks them for
 * cleanup, and emits death events.
 */

import { World } from '../ecs/World';
import type { Health } from '../components/Health';
import type { Faction } from '../components/Faction';
import type { UnitType } from '../components/UnitType';
import { EventEmitter } from '../../utils/EventEmitter';
import type { GameEvents } from '../managers/GameManager';

export class HealthSystem {
  private readonly events: EventEmitter<GameEvents>;

  constructor(events: EventEmitter<GameEvents>) {
    this.events = events;
  }

  /** Track IDs already emitted this frame to prevent duplicate death events. */
  private readonly emittedDeaths: Set<number> = new Set();

  update(world: World, _deltaTime: number): void {
    this.emittedDeaths.clear();
    const entities = world.query('Health');

    for (let i = 0; i < entities.length; i++) {
      const id = entities[i];
      if (!world.isAlive(id)) continue;

      const health = world.getComponent<Health>(id, 'Health');
      if (!health) continue;

      if (health.current <= 0 && !this.emittedDeaths.has(id)) {
        this.emittedDeaths.add(id);
        // Gather info for the death event before we mark for removal
        const faction = world.getComponent<Faction>(id, 'Faction');
        const unitType = world.getComponent<UnitType>(id, 'UnitType');

        this.events.emit('death', {
          entityId: id,
          faction: faction?.faction ?? 'player',
          unitType: unitType?.type ?? 'infantry',
          unitId: unitType?.unitId ?? 'unknown',
        });

        // Mark for deferred removal
        world.destroyEntity(id);
      }
    }
  }
}
