/**
 * Entity — a unique numeric ID. Entities have no data or behavior of their own;
 * all state lives in Components stored in the World.
 */

export type EntityId = number;

let nextId = 0;

/** Create a fresh, globally-unique entity ID. */
export function createEntityId(): EntityId {
  return nextId++;
}

/** Reset the ID counter (useful for tests or new game sessions). */
export function resetEntityIdCounter(): void {
  nextId = 0;
}
