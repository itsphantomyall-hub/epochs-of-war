/**
 * SpatialGrid — fixed-cell spatial hash for O(1) neighbour lookups.
 *
 * The battlefield is divided into cells of `cellSize` pixels.
 * Entities are inserted by position; queries return all entity IDs
 * in the same cell (and optionally neighbouring cells).
 */

import { EntityId } from '../core/ecs/Entity';

export class SpatialGrid {
  private readonly cellSize: number;
  private readonly cols: number;
  private readonly rows: number;
  private readonly cells: Map<number, Set<EntityId>> = new Map();
  /** Reverse lookup: entity → cell key */
  private readonly entityCell: Map<EntityId, number> = new Map();

  /**
   * @param width     Battlefield width in pixels.
   * @param height    Battlefield height in pixels.
   * @param cellSize  Size of each square cell in pixels (default 100).
   */
  constructor(width: number, height: number, cellSize = 100) {
    this.cellSize = cellSize;
    this.cols = Math.ceil(width / cellSize);
    this.rows = Math.ceil(height / cellSize);
  }

  private key(col: number, row: number): number {
    return row * this.cols + col;
  }

  private cellCoords(x: number, y: number): [number, number] {
    const col = Math.max(0, Math.min(this.cols - 1, Math.floor(x / this.cellSize)));
    const row = Math.max(0, Math.min(this.rows - 1, Math.floor(y / this.cellSize)));
    return [col, row];
  }

  /** Insert an entity at a world position. */
  insert(entityId: EntityId, x: number, y: number): void {
    // Remove from old cell first if already tracked
    this.remove(entityId);

    const [col, row] = this.cellCoords(x, y);
    const k = this.key(col, row);

    let set = this.cells.get(k);
    if (!set) {
      set = new Set();
      this.cells.set(k, set);
    }
    set.add(entityId);
    this.entityCell.set(entityId, k);
  }

  /** Remove an entity from the grid entirely. */
  remove(entityId: EntityId): void {
    const k = this.entityCell.get(entityId);
    if (k === undefined) return;
    const set = this.cells.get(k);
    if (set) {
      set.delete(entityId);
      if (set.size === 0) this.cells.delete(k);
    }
    this.entityCell.delete(entityId);
  }

  /** Update an entity's position (re-bucket if the cell changed). */
  update(entityId: EntityId, x: number, y: number): void {
    const [col, row] = this.cellCoords(x, y);
    const newKey = this.key(col, row);
    const oldKey = this.entityCell.get(entityId);

    if (oldKey === newKey) return; // still in same cell, no-op

    // Remove from old cell
    if (oldKey !== undefined) {
      const oldSet = this.cells.get(oldKey);
      if (oldSet) {
        oldSet.delete(entityId);
        if (oldSet.size === 0) this.cells.delete(oldKey);
      }
    }

    // Insert into new cell
    let set = this.cells.get(newKey);
    if (!set) {
      set = new Set();
      this.cells.set(newKey, set);
    }
    set.add(entityId);
    this.entityCell.set(entityId, newKey);
  }

  /**
   * Query all entities within `range` pixels of (x, y).
   * Returns entity IDs from the relevant cells (caller should do fine distance check).
   */
  queryRange(x: number, y: number, range: number): EntityId[] {
    const [cx, cy] = this.cellCoords(x, y);
    const cellSpan = Math.ceil(range / this.cellSize);
    const results: EntityId[] = [];

    const minCol = Math.max(0, cx - cellSpan);
    const maxCol = Math.min(this.cols - 1, cx + cellSpan);
    const minRow = Math.max(0, cy - cellSpan);
    const maxRow = Math.min(this.rows - 1, cy + cellSpan);

    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        const set = this.cells.get(this.key(c, r));
        if (set) {
          for (const id of set) {
            results.push(id);
          }
        }
      }
    }

    return results;
  }

  /** Query all entities in the same cell as (x, y). */
  queryCell(x: number, y: number): EntityId[] {
    const [col, row] = this.cellCoords(x, y);
    const set = this.cells.get(this.key(col, row));
    return set ? [...set] : [];
  }

  /** Remove all entities from the grid. */
  clear(): void {
    this.cells.clear();
    this.entityCell.clear();
  }
}
