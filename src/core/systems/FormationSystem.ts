/**
 * FormationSystem — detects groups of same-type units and applies formation bonuses.
 *
 * Each frame, scans for clusters of 3+ same-type units within 50px.
 * Applies formation bonuses and removes them when formations break.
 *
 * Formation types:
 * - Infantry Line: 3+ Infantry adjacent → +15% HP
 * - Ranged Battery: 3+ Ranged together → +20% fire rate
 * - Heavy Column: 2+ Heavies together → +10% damage
 * - Mixed Regiment: 1 of each type nearby → +5% all stats
 */

import { World } from '../ecs/World';
import { EntityId } from '../ecs/Entity';
import type { Position } from '../components/Position';
import type { Faction } from '../components/Faction';
import type { UnitType } from '../components/UnitType';
import type { Health } from '../components/Health';
import type { Combat } from '../components/Combat';
import type { FormationComponent, FormationBonus } from '../components/Formation';

/** Radius within which units are considered "adjacent" for formation purposes. */
const FORMATION_RADIUS = 50;
const FORMATION_RADIUS_SQ = FORMATION_RADIUS * FORMATION_RADIUS;

/** Minimum unit counts required for each formation type. */
const INFANTRY_LINE_MIN = 3;
const RANGED_BATTERY_MIN = 3;
const HEAVY_COLUMN_MIN = 2;

/** Formation bonus definitions. */
const FORMATION_BONUSES: Record<string, FormationBonus> = {
  infantry_line: { hpMultiplier: 1.15 },
  ranged_battery: { fireRateMultiplier: 1.20 },
  heavy_column: { damageMultiplier: 1.10 },
  mixed_regiment: { allMultiplier: 1.05 },
};

/** Tracks units that have had their stats modified by formations. */
interface FormationStatMod {
  originalMaxHp: number;
  originalDamage: number;
  originalAttackSpeed: number;
}

export class FormationSystem {
  /** Tracks original stats for entities currently in a formation. */
  private readonly originalStats: Map<EntityId, FormationStatMod> = new Map();

  update(world: World, _deltaTime: number): void {
    const units = world.query('Position', 'Faction', 'UnitType');

    // Group units by faction and type
    const factionGroups = new Map<string, Map<string, EntityId[]>>();

    for (let i = 0; i < units.length; i++) {
      const entityId = units[i];
      const faction = world.getComponent<Faction>(entityId, 'Faction')!;
      const unitType = world.getComponent<UnitType>(entityId, 'UnitType')!;

      const factionKey = faction.faction;
      if (!factionGroups.has(factionKey)) {
        factionGroups.set(factionKey, new Map());
      }
      const typeGroups = factionGroups.get(factionKey)!;

      if (!typeGroups.has(unitType.type)) {
        typeGroups.set(unitType.type, []);
      }
      typeGroups.get(unitType.type)!.push(entityId);
    }

    // Track which entities should be in a formation this frame
    const entitiesInFormation = new Set<EntityId>();

    // Check each faction
    for (const [factionKey, typeGroups] of factionGroups) {
      // Check Infantry Line
      const infantry = typeGroups.get('infantry') ?? [];
      this.detectFormation(
        world, infantry, INFANTRY_LINE_MIN, 'infantry_line', entitiesInFormation,
      );

      // Check Ranged Battery
      const ranged = typeGroups.get('ranged') ?? [];
      this.detectFormation(
        world, ranged, RANGED_BATTERY_MIN, 'ranged_battery', entitiesInFormation,
      );

      // Check Heavy Column
      const heavy = typeGroups.get('heavy') ?? [];
      this.detectFormation(
        world, heavy, HEAVY_COLUMN_MIN, 'heavy_column', entitiesInFormation,
      );

      // Check Mixed Regiment: need at least 1 infantry, 1 ranged, 1 heavy nearby
      this.detectMixedRegiment(world, infantry, ranged, heavy, entitiesInFormation);
    }

    // Remove formation from entities that are no longer in one
    const currentFormations = world.query('Formation');
    for (let i = 0; i < currentFormations.length; i++) {
      const entityId = currentFormations[i];
      if (!entitiesInFormation.has(entityId)) {
        this.removeFormationBonus(world, entityId);
        world.removeComponent(entityId, 'Formation');
      }
    }
  }

  /**
   * Detect clusters of same-type units within FORMATION_RADIUS.
   * Uses a simple N^2 check within type groups (typically small).
   */
  private detectFormation(
    world: World,
    unitIds: EntityId[],
    minCount: number,
    formationType: string,
    entitiesInFormation: Set<EntityId>,
  ): void {
    if (unitIds.length < minCount) return;

    // Find clusters using simple proximity check
    const visited = new Set<number>();

    for (let i = 0; i < unitIds.length; i++) {
      if (visited.has(i)) continue;

      const cluster: EntityId[] = [unitIds[i]];
      const posA = world.getComponent<Position>(unitIds[i], 'Position')!;
      visited.add(i);

      for (let j = i + 1; j < unitIds.length; j++) {
        if (visited.has(j)) continue;

        const posB = world.getComponent<Position>(unitIds[j], 'Position')!;
        const dx = posB.x - posA.x;
        const dy = posB.y - posA.y;

        if (dx * dx + dy * dy <= FORMATION_RADIUS_SQ) {
          cluster.push(unitIds[j]);
          visited.add(j);
        }
      }

      if (cluster.length >= minCount) {
        const bonus = FORMATION_BONUSES[formationType];
        for (const entityId of cluster) {
          entitiesInFormation.add(entityId);

          // Only apply if not already in this formation
          const existing = world.getComponent<FormationComponent>(entityId, 'Formation');
          if (!existing || existing.formationType !== formationType) {
            // Remove old formation bonus if switching
            if (existing) {
              this.removeFormationBonus(world, entityId);
            }
            this.applyFormationBonus(world, entityId, formationType, bonus);
            world.addComponent<FormationComponent>(entityId, 'Formation', {
              formationType,
              bonus,
            });
          }
        }
      }
    }
  }

  /**
   * Detect Mixed Regiment: 1 infantry + 1 ranged + 1 heavy within radius.
   */
  private detectMixedRegiment(
    world: World,
    infantry: EntityId[],
    ranged: EntityId[],
    heavy: EntityId[],
    entitiesInFormation: Set<EntityId>,
  ): void {
    if (infantry.length === 0 || ranged.length === 0 || heavy.length === 0) return;

    // Check if any infantry unit is near both a ranged and a heavy unit
    for (const infId of infantry) {
      if (entitiesInFormation.has(infId)) continue;

      const infPos = world.getComponent<Position>(infId, 'Position')!;
      let nearRanged: EntityId | null = null;
      let nearHeavy: EntityId | null = null;

      for (const rngId of ranged) {
        if (entitiesInFormation.has(rngId)) continue;
        const rngPos = world.getComponent<Position>(rngId, 'Position')!;
        const dx = rngPos.x - infPos.x;
        const dy = rngPos.y - infPos.y;
        if (dx * dx + dy * dy <= FORMATION_RADIUS_SQ) {
          nearRanged = rngId;
          break;
        }
      }

      for (const hvyId of heavy) {
        if (entitiesInFormation.has(hvyId)) continue;
        const hvyPos = world.getComponent<Position>(hvyId, 'Position')!;
        const dx = hvyPos.x - infPos.x;
        const dy = hvyPos.y - infPos.y;
        if (dx * dx + dy * dy <= FORMATION_RADIUS_SQ) {
          nearHeavy = hvyId;
          break;
        }
      }

      if (nearRanged !== null && nearHeavy !== null) {
        const bonus = FORMATION_BONUSES['mixed_regiment'];
        const mixedGroup = [infId, nearRanged, nearHeavy];

        for (const entityId of mixedGroup) {
          entitiesInFormation.add(entityId);
          const existing = world.getComponent<FormationComponent>(entityId, 'Formation');
          if (!existing || existing.formationType !== 'mixed_regiment') {
            if (existing) {
              this.removeFormationBonus(world, entityId);
            }
            this.applyFormationBonus(world, entityId, 'mixed_regiment', bonus);
            world.addComponent<FormationComponent>(entityId, 'Formation', {
              formationType: 'mixed_regiment',
              bonus,
            });
          }
        }
      }
    }
  }

  /**
   * Apply formation bonus to an entity's stats.
   */
  private applyFormationBonus(
    world: World,
    entityId: EntityId,
    formationType: string,
    bonus: FormationBonus,
  ): void {
    const health = world.getComponent<Health>(entityId, 'Health');
    const combat = world.getComponent<Combat>(entityId, 'Combat');

    // Store original stats
    if (!this.originalStats.has(entityId)) {
      this.originalStats.set(entityId, {
        originalMaxHp: health?.max ?? 0,
        originalDamage: combat?.damage ?? 0,
        originalAttackSpeed: combat?.attackSpeed ?? 0,
      });
    }

    const original = this.originalStats.get(entityId)!;

    if (bonus.hpMultiplier && health) {
      const newMax = Math.round(original.originalMaxHp * bonus.hpMultiplier);
      const hpDiff = newMax - health.max;
      health.max = newMax;
      health.current += hpDiff; // adjust current HP proportionally
    }

    if (bonus.damageMultiplier && combat) {
      combat.damage = Math.round(original.originalDamage * bonus.damageMultiplier);
    }

    if (bonus.fireRateMultiplier && combat) {
      combat.attackSpeed = original.originalAttackSpeed * bonus.fireRateMultiplier;
    }

    if (bonus.allMultiplier) {
      if (health) {
        const newMax = Math.round(original.originalMaxHp * bonus.allMultiplier);
        const hpDiff = newMax - health.max;
        health.max = newMax;
        health.current += hpDiff;
      }
      if (combat) {
        combat.damage = Math.round(original.originalDamage * bonus.allMultiplier);
        combat.attackSpeed = original.originalAttackSpeed * bonus.allMultiplier;
      }
    }
  }

  /**
   * Remove formation bonus — restore original stats.
   */
  private removeFormationBonus(world: World, entityId: EntityId): void {
    const original = this.originalStats.get(entityId);
    if (!original) return;

    const health = world.getComponent<Health>(entityId, 'Health');
    const combat = world.getComponent<Combat>(entityId, 'Combat');

    if (health) {
      const hpRatio = health.current / health.max;
      health.max = original.originalMaxHp;
      health.current = Math.round(original.originalMaxHp * hpRatio);
    }

    if (combat) {
      combat.damage = original.originalDamage;
      combat.attackSpeed = original.originalAttackSpeed;
    }

    this.originalStats.delete(entityId);
  }

  /**
   * Reset state for a new game.
   */
  reset(): void {
    this.originalStats.clear();
  }
}
