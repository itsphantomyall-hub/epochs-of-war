/**
 * TurretSystem — target acquisition and damage dealing for turrets.
 *
 * Each frame, for every entity with TurretComponent + Position + Faction:
 *   1. Find the nearest enemy in range using SpatialGrid.
 *   2. If fire rate cooldown has elapsed, deal damage.
 *   3. Apply splash damage to nearby enemies if splashRadius > 0.
 *   4. Emit damage events.
 */

import { World } from '../ecs/World';
import { EntityId } from '../ecs/Entity';
import type { Position } from '../components/Position';
import type { TurretComponent } from '../components/Turret';
import type { Faction } from '../components/Faction';
import type { Health } from '../components/Health';
import { SpatialGrid } from '../../utils/SpatialGrid';
import { EventEmitter } from '../../utils/EventEmitter';
import type { GameEvents } from '../managers/GameManager';

export class TurretSystem {
  private readonly spatialGrid: SpatialGrid;
  private readonly events: EventEmitter<GameEvents>;

  constructor(spatialGrid: SpatialGrid, events: EventEmitter<GameEvents>) {
    this.spatialGrid = spatialGrid;
    this.events = events;
  }

  update(world: World, _deltaTime: number): void {
    const turrets = world.query('TurretComponent', 'Position', 'Faction');

    for (let i = 0; i < turrets.length; i++) {
      const turretId = turrets[i];
      const turretComp = world.getComponent<TurretComponent>(turretId, 'TurretComponent')!;
      const turretPos = world.getComponent<Position>(turretId, 'Position')!;
      const turretFaction = world.getComponent<Faction>(turretId, 'Faction')!;

      // Find target based on targeting strategy
      const target = this.findTarget(
        world,
        turretId,
        turretPos,
        turretFaction.faction,
        turretComp.range,
        turretComp.targeting,
      );

      if (target === null) continue;

      // Check fire rate cooldown
      const fireInterval = 1 / turretComp.fireRate;
      const currentTime = this.getCurrentTime(world);
      if (turretComp.lastFireTime + fireInterval > currentTime) continue;

      // Deal damage to primary target
      const targetHealth = world.getComponent<Health>(target, 'Health');
      if (targetHealth) {
        targetHealth.current -= turretComp.damage;
        this.events.emit('damage', {
          attackerId: turretId,
          targetId: target,
          damage: turretComp.damage,
          remainingHp: targetHealth.current,
        });
      }

      // Apply splash damage if applicable
      if (turretComp.splashRadius > 0) {
        const targetPos = world.getComponent<Position>(target, 'Position');
        if (targetPos) {
          this.applySplashDamage(
            world,
            turretId,
            targetPos,
            turretFaction.faction,
            turretComp.splashRadius,
            turretComp.damage * 0.5, // splash deals 50% of direct damage
            target, // exclude primary target (already damaged)
          );
        }
      }

      // Record fire time
      turretComp.lastFireTime = currentTime;
    }
  }

  /**
   * Find a target based on the turret's targeting strategy.
   */
  private findTarget(
    world: World,
    selfId: EntityId,
    selfPos: Position,
    selfFaction: 'player' | 'enemy',
    range: number,
    targeting: 'nearest' | 'strongest' | 'fastest',
  ): EntityId | null {
    const candidates = this.spatialGrid.queryRange(selfPos.x, selfPos.y, range);

    let best: EntityId | null = null;
    let bestScore = targeting === 'nearest' ? Infinity : -Infinity;

    for (let i = 0; i < candidates.length; i++) {
      const candidateId = candidates[i];
      if (candidateId === selfId) continue;
      if (!world.isAlive(candidateId)) continue;

      const candidateFaction = world.getComponent<Faction>(candidateId, 'Faction');
      if (!candidateFaction || candidateFaction.faction === selfFaction) continue;

      // Must be damageable
      if (!world.hasComponent(candidateId, 'Health')) continue;

      const candidatePos = world.getComponent<Position>(candidateId, 'Position')!;
      const dx = candidatePos.x - selfPos.x;
      const dy = candidatePos.y - selfPos.y;
      const distSq = dx * dx + dy * dy;

      if (distSq > range * range) continue;

      let score: number;

      switch (targeting) {
        case 'nearest':
          score = distSq;
          if (score < bestScore) {
            bestScore = score;
            best = candidateId;
          }
          break;

        case 'strongest': {
          const health = world.getComponent<Health>(candidateId, 'Health')!;
          score = health.max;
          if (score > bestScore) {
            bestScore = score;
            best = candidateId;
          }
          break;
        }

        case 'fastest': {
          // Use Velocity component if available
          const vel = world.getComponent<{ dx: number; dy: number }>(candidateId, 'Velocity');
          score = vel ? Math.abs(vel.dx) + Math.abs(vel.dy) : 0;
          if (score > bestScore) {
            bestScore = score;
            best = candidateId;
          }
          break;
        }
      }
    }

    return best;
  }

  /**
   * Apply splash damage to all enemies near the impact point.
   */
  private applySplashDamage(
    world: World,
    attackerId: EntityId,
    center: Position,
    attackerFaction: 'player' | 'enemy',
    radius: number,
    damage: number,
    excludeId: EntityId,
  ): void {
    const candidates = this.spatialGrid.queryRange(center.x, center.y, radius);

    for (let i = 0; i < candidates.length; i++) {
      const candidateId = candidates[i];
      if (candidateId === excludeId) continue;
      if (!world.isAlive(candidateId)) continue;

      const candidateFaction = world.getComponent<Faction>(candidateId, 'Faction');
      if (!candidateFaction || candidateFaction.faction === attackerFaction) continue;
      if (!world.hasComponent(candidateId, 'Health')) continue;

      const candidatePos = world.getComponent<Position>(candidateId, 'Position')!;
      const dx = candidatePos.x - center.x;
      const dy = candidatePos.y - center.y;
      const distSq = dx * dx + dy * dy;

      if (distSq > radius * radius) continue;

      const health = world.getComponent<Health>(candidateId, 'Health')!;
      const roundedDamage = Math.round(damage);
      health.current -= roundedDamage;

      this.events.emit('damage', {
        attackerId,
        targetId: candidateId,
        damage: roundedDamage,
        remainingHp: health.current,
      });
    }
  }

  /** Get monotonic game time from the world. */
  private getCurrentTime(world: World): number {
    const timeEntity = world.query('GameTime');
    if (timeEntity.length > 0) {
      const gt = world.getComponent<{ elapsed: number }>(timeEntity[0], 'GameTime');
      if (gt) return gt.elapsed;
    }
    return performance.now() / 1000;
  }
}
