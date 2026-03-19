/**
 * ObjectPool — generic acquire/release pool to avoid GC pressure.
 *
 * Usage:
 *   const pool = new ObjectPool(() => ({ x: 0, y: 0 }), (obj) => { obj.x = 0; obj.y = 0; }, 64);
 *   const pos = pool.acquire();
 *   // … use pos …
 *   pool.release(pos);
 */

export class ObjectPool<T> {
  private readonly pool: T[] = [];
  private readonly factory: () => T;
  private readonly reset: (obj: T) => void;

  /**
   * @param factory  Creates a new instance.
   * @param reset    Resets an instance to a clean state before re-use.
   * @param initialSize  Number of objects to pre-allocate.
   */
  constructor(factory: () => T, reset: (obj: T) => void, initialSize = 0) {
    this.factory = factory;
    this.reset = reset;

    for (let i = 0; i < initialSize; i++) {
      this.pool.push(factory());
    }
  }

  /** Get an object from the pool (or create one if pool is empty). */
  acquire(): T {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }
    return this.factory();
  }

  /** Return an object to the pool after resetting it. */
  release(obj: T): void {
    this.reset(obj);
    this.pool.push(obj);
  }

  /** Number of objects currently sitting idle in the pool. */
  get available(): number {
    return this.pool.length;
  }

  /** Pre-warm the pool up to `count` idle objects. */
  prewarm(count: number): void {
    while (this.pool.length < count) {
      this.pool.push(this.factory());
    }
  }
}
