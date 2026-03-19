/**
 * EventEmitter — lightweight typed pub/sub.
 *
 * Usage:
 *   interface Events {
 *     death: { entityId: number };
 *     spawn: { entityId: number; unitId: string };
 *   }
 *   const bus = new EventEmitter<Events>();
 *   bus.on('death', (e) => console.log(e.entityId));
 *   bus.emit('death', { entityId: 42 });
 */

type Listener<T> = (payload: T) => void;

export class EventEmitter<EventMap extends { [K in keyof EventMap]: unknown }> {
  private listeners = new Map<keyof EventMap, Set<Listener<never>>>();

  /** Subscribe to an event. Returns an unsubscribe function. */
  on<K extends keyof EventMap>(event: K, fn: Listener<EventMap[K]>): () => void {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    set.add(fn as Listener<never>);
    return () => {
      set!.delete(fn as Listener<never>);
    };
  }

  /** Subscribe to an event, but only fire once. */
  once<K extends keyof EventMap>(event: K, fn: Listener<EventMap[K]>): () => void {
    const unsub = this.on(event, (payload) => {
      unsub();
      fn(payload);
    });
    return unsub;
  }

  /** Emit an event to all listeners. */
  emit<K extends keyof EventMap>(event: K, payload: EventMap[K]): void {
    const set = this.listeners.get(event);
    if (!set) return;
    for (const fn of set) {
      (fn as Listener<EventMap[K]>)(payload);
    }
  }

  /** Remove all listeners for an event, or all events if no key given. */
  clear<K extends keyof EventMap>(event?: K): void {
    if (event !== undefined) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }
}
