/**
 * World — the central ECS container.
 *
 * Manages entity creation/destruction and component storage.
 * Components are stored in per-type Maps keyed by EntityId.
 */

import { EntityId, createEntityId } from './Entity';
import { Query } from './Query';

export type ComponentMap<T> = Map<EntityId, T>;

export class World {
  /** All living entity IDs. */
  private readonly entities: Set<EntityId> = new Set();

  /** Component storage: component name → Map<EntityId, component data>. */
  private readonly stores: Map<string, ComponentMap<unknown>> = new Map();

  /** Entities scheduled for removal at the end of the current frame. */
  private readonly removalQueue: Set<EntityId> = new Set();

  /** Per-frame query cache: key → result array. Cleared by clearQueryCache(). */
  private readonly queryCache: Map<string, EntityId[]> = new Map();
  /** Whether the component stores have been mutated since last cache clear. */
  private queryCacheDirty = false;

  // ── Entity lifecycle ──────────────────────────────────────────

  /** Create a new entity and return its ID. */
  createEntity(): EntityId {
    const id = createEntityId();
    this.entities.add(id);
    return id;
  }

  /** Schedule an entity for removal (processed by flushRemovals). */
  destroyEntity(entityId: EntityId): void {
    this.removalQueue.add(entityId);
  }

  /** Immediately remove an entity and all its components. */
  private removeEntity(entityId: EntityId): void {
    this.entities.delete(entityId);
    for (const store of this.stores.values()) {
      store.delete(entityId);
    }
    this.queryCacheDirty = true;
  }

  /** Process all pending entity removals. Call once per frame after all systems. */
  flushRemovals(): void {
    for (const id of this.removalQueue) {
      this.removeEntity(id);
    }
    this.removalQueue.clear();
  }

  /** Check if an entity is alive (not yet removed). */
  isAlive(entityId: EntityId): boolean {
    return this.entities.has(entityId);
  }

  /** Get the count of living entities. */
  get entityCount(): number {
    return this.entities.size;
  }

  /** Iterate all living entity IDs. */
  getAllEntities(): IterableIterator<EntityId> {
    return this.entities.values();
  }

  // ── Component access ──────────────────────────────────────────

  /** Get (or lazily create) the storage map for a component type. */
  getStore<T>(name: string): ComponentMap<T> {
    let store = this.stores.get(name);
    if (!store) {
      store = new Map();
      this.stores.set(name, store);
    }
    return store as ComponentMap<T>;
  }

  /** Add a component to an entity. */
  addComponent<T>(entityId: EntityId, name: string, data: T): void {
    const store = this.getStore<T>(name);
    store.set(entityId, data);
    this.queryCacheDirty = true;
  }

  /** Get a component from an entity (or undefined). */
  getComponent<T>(entityId: EntityId, name: string): T | undefined {
    const store = this.stores.get(name);
    if (!store) return undefined;
    return store.get(entityId) as T | undefined;
  }

  /** Check whether an entity has a specific component. */
  hasComponent(entityId: EntityId, name: string): boolean {
    const store = this.stores.get(name);
    return store !== undefined && store.has(entityId);
  }

  /** Remove a component from an entity. */
  removeComponent(entityId: EntityId, name: string): void {
    const store = this.stores.get(name);
    if (store) {
      store.delete(entityId);
      this.queryCacheDirty = true;
    }
  }

  // ── Queries ───────────────────────────────────────────────────

  /**
   * Clear the per-frame query cache. Call once at the start of each frame
   * (before systems run) so that repeated identical queries within the same
   * frame return cached results instead of re-scanning stores.
   */
  clearQueryCache(): void {
    if (this.queryCacheDirty || this.queryCache.size > 0) {
      this.queryCache.clear();
      this.queryCacheDirty = false;
    }
  }

  /**
   * Return all entity IDs that possess every one of the listed components.
   * This is the primary way systems find entities to operate on.
   *
   * Results are cached within a frame (between clearQueryCache() calls) so
   * multiple systems querying the same component set don't re-scan.
   */
  query(...componentNames: string[]): EntityId[] {
    if (componentNames.length === 0) return [...this.entities];

    // Build a stable cache key (sort to make order-independent)
    const cacheKey = componentNames.length === 1
      ? componentNames[0]
      : [...componentNames].sort().join('\0');

    const cached = this.queryCache.get(cacheKey);
    if (cached !== undefined) return cached;

    // Use the smallest store as the iteration base for efficiency.
    let smallest: ComponentMap<unknown> | undefined;
    let smallestSize = Infinity;

    for (const name of componentNames) {
      const store = this.stores.get(name);
      if (!store || store.size === 0) {
        const empty: EntityId[] = [];
        this.queryCache.set(cacheKey, empty);
        return empty;
      }
      if (store.size < smallestSize) {
        smallest = store;
        smallestSize = store.size;
      }
    }

    if (!smallest) {
      const empty: EntityId[] = [];
      this.queryCache.set(cacheKey, empty);
      return empty;
    }

    const results: EntityId[] = [];
    for (const entityId of smallest.keys()) {
      if (!this.entities.has(entityId)) continue;
      let match = true;
      for (const name of componentNames) {
        if (!this.stores.get(name)!.has(entityId)) {
          match = false;
          break;
        }
      }
      if (match) results.push(entityId);
    }

    this.queryCache.set(cacheKey, results);
    return results;
  }

  /** Create a reusable Query builder. */
  createQuery(...componentNames: string[]): Query {
    return new Query(this, componentNames);
  }

  // ── Cleanup ───────────────────────────────────────────────────

  /** Wipe everything — used when starting a new game. */
  clear(): void {
    this.entities.clear();
    this.stores.clear();
    this.removalQueue.clear();
  }
}
