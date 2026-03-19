/** Visual representation data consumed by the render system. */
export interface Renderable {
  /** Key into the sprite atlas / texture cache. */
  spriteKey: string;
  /** Current animation name (e.g. "walk", "attack", "idle"). */
  animation: string;
  /** Draw-order layer (higher = drawn on top). */
  layer: number;
  /** Whether the sprite is currently visible. */
  visible: boolean;
  /** Mirror the sprite horizontally (enemy units face left). */
  flipX: boolean;
}
