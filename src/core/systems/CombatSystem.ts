/**
 * CombatSystem — target acquisition and damage dealing.
 *
 * Each frame, for every entity with Combat + Position + Faction:
 *   1. Find the nearest enemy in range using SpatialGrid.
 *   2. If attack cooldown has elapsed, deal damage.
 *   3. Apply +50% counter bonus per the rock-paper-scissors triangle
 *      (GAME_DESIGN.md Section 3.3).
 */

import { World } from '../ecs/World';
import { EntityId } from '../ecs/Entity';
import type { Position } from '../components/Position';
import type { Combat } from '../components/Combat';
import type { Faction } from '../components/Faction';
import type { Health } from '../components/Health';
import type { UnitType } from '../components/UnitType';
import { SpatialGrid } from '../../utils/SpatialGrid';
import { EventEmitter } from '../../utils/EventEmitter';
import type { GameEvents } from '../managers/GameManager';

/**
 * Counter table: attacker type → set of types it counters.
 * Bonus: +50% damage when attacking a countered type.
 */
const COUNTER_MAP: Record<string, Set<string>> = {
  infantry: new Set(['special', 'ranged']),
  ranged:   new Set(['heavy']),
  heavy:    new Set(['infantry']),
  special:  new Set(['heavy']),
  hero:     new Set(), // heroes don't get automatic counter bonuses
};

const COUNTER_BONUS = 1.5; // +50%

export class CombatSystem {
  private readonly spatialGrid: SpatialGrid;
  private readonly events: EventEmitter<GameEvents>;

  constructor(spatialGrid: SpatialGrid, events: EventEmitter<GameEvents>) {
    this.spatialGrid = spatialGrid;
    this.events = events;
  }

  update(world: World, deltaTime: number): void {
    const combatants = world.query('Position', 'Combat', 'Faction');

    for (let i = 0; i < combatants.length; i++) {
      const attackerId = combatants[i];
      if (!world.isAlive(attackerId)) continue;

      const attackerPos = world.getComponent<Position>(attackerId, 'Position');
      const combat = world.getComponent<Combat>(attackerId, 'Combat');
      const attackerFaction = world.getComponent<Faction>(attackerId, 'Faction');
      if (!attackerPos || !combat || !attackerFaction) continue;

      // Skip entities already dead (HP <= 0) but not yet flushed
      const attackerHealth = world.getComponent<Health>(attackerId, 'Health');
      if (attackerHealth && attackerHealth.current <= 0) continue;

      // Use effective range: melee uses a small default range
      const effectiveRange = combat.range > 0 ? combat.range : 40;

      // Find nearest enemy in range via spatial grid
      const target = this.findNearestEnemy(
        world,
        attackerId,
        attackerPos,
        attackerFaction.faction,
        effectiveRange,
      );

      if (target === null) continue;

      // Check attack cooldown
      const attackInterval = 1 / combat.attackSpeed;
      if (combat.lastAttackTime + attackInterval > this.getCurrentTime(world)) continue;

      // Calculate damage with counter bonus
      let damage = combat.damage;
      let isCounter = false;
      const attackerType = world.getComponent<UnitType>(attackerId, 'UnitType');
      const targetType = world.getComponent<UnitType>(target, 'UnitType');

      if (attackerType && targetType) {
        const counters = COUNTER_MAP[attackerType.type];
        if (counters && counters.has(targetType.type)) {
          damage = Math.round(damage * COUNTER_BONUS);
          isCounter = true;
        }
      }

      // Apply damage
      const targetHealth = world.getComponent<Health>(target, 'Health');
      if (targetHealth) {
        targetHealth.current -= damage;
        this.events.emit('damage', {
          attackerId,
          targetId: target,
          damage,
          remainingHp: targetHealth.current,
          isCounter,
        });
      }

      // Record attack time
      combat.lastAttackTime = this.getCurrentTime(world);
    }
  }

  /**
   * Find the closest enemy entity within `range` pixels.
   * Returns null if no valid target found.
   */
  private findNearestEnemy(
    world: World,
    selfId: EntityId,
    selfPos: Position,
    selfFaction: 'player' | 'enemy',
    range: number,
  ): EntityId | null {
    const candidates = this.spatialGrid.queryRange(selfPos.x, selfPos.y, range);

    let closest: EntityId | null = null;
    let closestDistSq = Infinity;

    for (let i = 0; i < candidates.length; i++) {
      const candidateId = candidates[i];
      if (candidateId === selfId) continue;
      if (!world.isAlive(candidateId)) continue;

      const candidateFaction = world.getComponent<Faction>(candidateId, 'Faction');
      if (!candidateFaction || candidateFaction.faction === selfFaction) continue;

      // Must be damageable and still alive (HP > 0)
      const candidateHealth = world.getComponent<Health>(candidateId, 'Health');
      if (!candidateHealth || candidateHealth.current <= 0) continue;

      const candidatePos = world.getComponent<Position>(candidateId, 'Position')!
      const dx = candidatePos.x - selfPos.x;
      const dy = candidatePos.y - selfPos.y;
      const distSq = dx * dx + dy * dy;

      if (distSq > range * range) continue; // fine-grained distance check

      if (distSq < closestDistSq) {
        closestDistSq = distSq;
        closest = candidateId;
      }
    }

    return closest;
  }

  /** Get monotonic game time from the world (stored as a component on a singleton). */
  private getCurrentTime(world: World): number {
    const timeEntity = world.query('GameTime');
    if (timeEntity.length > 0) {
      const gt = world.getComponent<{ elapsed: number }>(timeEntity[0], 'GameTime');
      if (gt) return gt.elapsed;
    }
    return performance.now() / 1000;
  }
}
