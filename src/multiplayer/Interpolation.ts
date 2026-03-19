/**
 * Interpolation -- Entity interpolation between server snapshots.
 *
 * Buffers 2-3 server snapshots and renders entities at interpolated
 * positions between them. Uses a 100ms interpolation delay for
 * smooth rendering.
 *
 * Handles entity creation (fade in) and destruction (death effect then remove).
 */

import type { EntitySnapshot } from './NetworkManager';

const INTERPOLATION_DELAY_MS = 100;
const MAX_BUFFER_SIZE = 5;

interface Snapshot {
  timestamp: number;
  entities: Map<number, EntitySnapshot>;
}

export interface InterpolatedEntity {
  id: number;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  faction: 'player' | 'enemy';
  unitType: string;
  alive: boolean;
  isNew: boolean;     // true on first frame this entity appears
  isDying: boolean;   // true when entity was alive last frame but dead now
  alpha: number;      // for fade-in/fade-out effects
}

export class Interpolation {
  private readonly buffer: Snapshot[] = [];
  private knownEntities: Set<number> = new Set();
  private dyingEntities: Map<number, { entity: EntitySnapshot; fadeTimer: number }> = new Map();

  /** Add a new server snapshot to the buffer. */
  pushSnapshot(timestamp: number, entities: EntitySnapshot[]): void {
    const entityMap = new Map<number, EntitySnapshot>();
    for (const e of entities) {
      entityMap.set(e.id, e);
    }

    this.buffer.push({ timestamp, entities: entityMap });

    // Keep buffer bounded
    while (this.buffer.length > MAX_BUFFER_SIZE) {
      this.buffer.shift();
    }
  }

  /**
   * Get interpolated entities for the current render time.
   * @param deltaSec Frame delta in seconds (for fade timers).
   * @returns Array of interpolated entities to render.
   */
  getInterpolatedEntities(deltaSec: number): InterpolatedEntity[] {
    const renderTime = Date.now() - INTERPOLATION_DELAY_MS;
    const result: InterpolatedEntity[] = [];

    // Update dying entity fade timers
    for (const [id, dying] of this.dyingEntities) {
      dying.fadeTimer -= deltaSec;
      if (dying.fadeTimer <= 0) {
        this.dyingEntities.delete(id);
        this.knownEntities.delete(id);
      } else {
        result.push({
          id,
          x: dying.entity.x,
          y: dying.entity.y,
          hp: 0,
          maxHp: dying.entity.maxHp,
          faction: dying.entity.faction,
          unitType: dying.entity.unitType,
          alive: false,
          isNew: false,
          isDying: true,
          alpha: dying.fadeTimer / 0.5, // 0.5s fade
        });
      }
    }

    if (this.buffer.length < 2) {
      // Not enough snapshots to interpolate -- use latest
      if (this.buffer.length === 1) {
        const snap = this.buffer[0];
        for (const [id, entity] of snap.entities) {
          if (this.dyingEntities.has(id)) continue;
          const isNew = !this.knownEntities.has(id);
          this.knownEntities.add(id);
          result.push({
            ...entity,
            isNew,
            isDying: false,
            alpha: 1,
          });
        }
        this.detectDeaths(snap.entities);
      }
      return result;
    }

    // Find the two snapshots to interpolate between
    let fromSnap: Snapshot | null = null;
    let toSnap: Snapshot | null = null;

    for (let i = 0; i < this.buffer.length - 1; i++) {
      if (
        this.buffer[i].timestamp <= renderTime &&
        this.buffer[i + 1].timestamp >= renderTime
      ) {
        fromSnap = this.buffer[i];
        toSnap = this.buffer[i + 1];
        break;
      }
    }

    // If render time is past all snapshots, use the latest
    if (!fromSnap || !toSnap) {
      fromSnap = this.buffer[this.buffer.length - 2];
      toSnap = this.buffer[this.buffer.length - 1];
    }

    const duration = toSnap.timestamp - fromSnap.timestamp;
    const t = duration > 0
      ? Math.max(0, Math.min(1, (renderTime - fromSnap.timestamp) / duration))
      : 1;

    // Collect all entity IDs from both snapshots
    const allIds = new Set<number>();
    for (const id of fromSnap.entities.keys()) allIds.add(id);
    for (const id of toSnap.entities.keys()) allIds.add(id);

    for (const id of allIds) {
      if (this.dyingEntities.has(id)) continue;

      const fromEntity = fromSnap.entities.get(id);
      const toEntity = toSnap.entities.get(id);

      if (toEntity) {
        const isNew = !this.knownEntities.has(id);
        this.knownEntities.add(id);

        if (fromEntity) {
          // Interpolate between the two
          result.push({
            id,
            x: fromEntity.x + (toEntity.x - fromEntity.x) * t,
            y: fromEntity.y + (toEntity.y - fromEntity.y) * t,
            hp: Math.round(fromEntity.hp + (toEntity.hp - fromEntity.hp) * t),
            maxHp: toEntity.maxHp,
            faction: toEntity.faction,
            unitType: toEntity.unitType,
            alive: toEntity.alive,
            isNew: false,
            isDying: false,
            alpha: 1,
          });
        } else {
          // Entity only in toSnap -- new entity, fade in
          result.push({
            ...toEntity,
            isNew,
            isDying: false,
            alpha: isNew ? Math.min(1, t * 3) : 1, // quick fade in
          });
        }
      } else if (fromEntity) {
        // Entity only in fromSnap -- dying, start fade out
        if (!this.dyingEntities.has(id)) {
          this.dyingEntities.set(id, {
            entity: fromEntity,
            fadeTimer: 0.5,
          });
        }
      }
    }

    // Also detect deaths from the latest snapshot
    this.detectDeaths(toSnap.entities);

    return result;
  }

  private detectDeaths(currentEntities: Map<number, EntitySnapshot>): void {
    for (const id of this.knownEntities) {
      if (!currentEntities.has(id) && !this.dyingEntities.has(id)) {
        // Entity disappeared -- start death fade
        // We don't have position data, so it will just be removed
        this.knownEntities.delete(id);
      }
    }
  }

  /** Reset all state. */
  reset(): void {
    this.buffer.length = 0;
    this.knownEntities.clear();
    this.dyingEntities.clear();
  }
}
