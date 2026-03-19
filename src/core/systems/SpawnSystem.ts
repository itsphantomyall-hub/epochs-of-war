/**
 * SpawnSystem — processes the spawn queue, creating entities with all
 * required components and respecting per-slot spawn cooldowns.
 */

import { World } from '../ecs/World';
import type { Position } from '../components/Position';
import type { Velocity } from '../components/Velocity';
import type { Health } from '../components/Health';
import type { Combat } from '../components/Combat';
import type { Renderable } from '../components/Renderable';
import type { Faction } from '../components/Faction';
import type { UnitType } from '../components/UnitType';
import type { AgeTag } from '../components/AgeTag';
import { SpatialGrid } from '../../utils/SpatialGrid';
import { EventEmitter } from '../../utils/EventEmitter';
import type { GameEvents } from '../managers/GameManager';

/** Blueprint for spawning a unit — callers push these into the queue. */
export interface SpawnRequest {
  faction: 'player' | 'enemy';
  unitId: string;
  type: 'infantry' | 'ranged' | 'heavy' | 'special' | 'hero';
  age: number;
  hp: number;
  damage: number;
  speed: number;
  range: number;
  attackSpeed: number;
  projectileType: string;
  spawnTime: number; // seconds until this unit appears
  spriteKey: string;
  cost: number;
}

interface PendingSpawn {
  request: SpawnRequest;
  remainingTime: number;
}

/** Player base X = 50, enemy base X = 1550. Units walk toward each other. */
const PLAYER_SPAWN_X = 80;
const ENEMY_SPAWN_X = 1520;
const SPAWN_Y = 500; // ground level

export class SpawnSystem {
  private readonly queue: PendingSpawn[] = [];
  private readonly spatialGrid: SpatialGrid;
  private readonly events: EventEmitter<GameEvents>;

  constructor(spatialGrid: SpatialGrid, events: EventEmitter<GameEvents>) {
    this.spatialGrid = spatialGrid;
    this.events = events;
  }

  /** Add a unit to the spawn queue. */
  enqueue(request: SpawnRequest): void {
    this.queue.push({ request, remainingTime: request.spawnTime });
  }

  /** Number of pending spawns. */
  get pendingCount(): number {
    return this.queue.length;
  }

  update(world: World, deltaTime: number): void {
    // Tick down timers and collect ready spawns
    let writeIdx = 0;
    for (let i = 0; i < this.queue.length; i++) {
      const entry = this.queue[i];
      entry.remainingTime -= deltaTime;

      if (entry.remainingTime <= 0) {
        this.spawnUnit(world, entry.request);
      } else {
        this.queue[writeIdx++] = entry;
      }
    }
    this.queue.length = writeIdx;
  }

  private spawnUnit(world: World, req: SpawnRequest): void {
    const id = world.createEntity();

    const isPlayer = req.faction === 'player';
    const spawnX = isPlayer ? PLAYER_SPAWN_X : ENEMY_SPAWN_X;
    // Player units move right (+speed), enemy units move left (-speed)
    const direction = isPlayer ? 1 : -1;

    world.addComponent<Position>(id, 'Position', { x: spawnX, y: SPAWN_Y });
    world.addComponent<Velocity>(id, 'Velocity', { dx: req.speed * direction * 30, dy: 0 });
    world.addComponent<Health>(id, 'Health', { current: req.hp, max: req.hp });
    world.addComponent<Combat>(id, 'Combat', {
      damage: req.damage,
      range: req.range,
      attackSpeed: req.attackSpeed,
      lastAttackTime: -Infinity,
      projectileType: req.projectileType,
    });
    world.addComponent<Renderable>(id, 'Renderable', {
      spriteKey: req.spriteKey,
      animation: 'walk',
      layer: 1,
      visible: true,
      flipX: !isPlayer, // enemies face left
    });
    world.addComponent<Faction>(id, 'Faction', { faction: req.faction });
    world.addComponent<UnitType>(id, 'UnitType', {
      type: req.type,
      unitId: req.unitId,
      age: req.age,
    });
    world.addComponent<AgeTag>(id, 'AgeTag', { age: req.age });

    // Insert into spatial grid
    this.spatialGrid.insert(id, spawnX, SPAWN_Y);

    this.events.emit('spawn', { entityId: id, unitId: req.unitId, faction: req.faction });
  }
}
