import Phaser from 'phaser';

/**
 * A single particle tracked by the ParticleManager.
 */
interface Particle {
  gameObject: Phaser.GameObjects.Rectangle;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  alpha: number;
  scaleStart: number;
  scaleEnd: number;
  gravity: number;
  rotationSpeed: number;
}

/**
 * ParticleManager — lightweight particle effects using Phaser GameObjects.
 *
 * Uses pooled Rectangles for performance. Each effect spawns a handful of
 * small rectangles/circles that move, fade, and get recycled.
 */
export class ParticleManager {
  private readonly scene: Phaser.Scene;
  private readonly active: Particle[] = [];
  private readonly pool: Phaser.GameObjects.Rectangle[] = [];

  /** Maximum concurrent particles to prevent performance issues. */
  private static readonly MAX_PARTICLES = 200;

  /** Whether particle effects are enabled. */
  public enabled = true;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    // Pre-warm the pool
    for (let i = 0; i < 40; i++) {
      this.pool.push(this.createRect());
    }
  }

  // ─────────────────────── POOL ───────────────────────

  private createRect(): Phaser.GameObjects.Rectangle {
    const r = this.scene.add.rectangle(0, 0, 4, 4, 0xffffff);
    r.setDepth(50);
    r.setVisible(false);
    return r;
  }

  private acquire(): Phaser.GameObjects.Rectangle {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }
    return this.createRect();
  }

  private release(r: Phaser.GameObjects.Rectangle): void {
    r.setVisible(false);
    r.setAlpha(1);
    r.setScale(1);
    r.setRotation(0);
    this.pool.push(r);
  }

  // ─────────────────────── SPAWN HELPERS ───────────────────────

  private spawn(
    x: number,
    y: number,
    vx: number,
    vy: number,
    life: number,
    color: number,
    w: number,
    h: number,
    scaleEnd = 0,
    gravity = 0,
    rotationSpeed = 0
  ): void {
    if (!this.enabled) return;
    if (this.active.length >= ParticleManager.MAX_PARTICLES) return;

    const go = this.acquire();
    go.setPosition(x, y);
    go.setSize(w, h);
    go.setFillStyle(color);
    go.setAlpha(1);
    go.setScale(1);
    go.setVisible(true);

    this.active.push({
      gameObject: go,
      x,
      y,
      vx,
      vy,
      life,
      maxLife: life,
      alpha: 1,
      scaleStart: 1,
      scaleEnd,
      gravity,
      rotationSpeed,
    });
  }

  // ─────────────────────── PUBLIC EFFECTS ───────────────────────

  /**
   * Circle of 8-12 small rectangles that fly outward and fade.
   * Used for unit deaths and special impacts.
   */
  spawnExplosion(x: number, y: number, color: number, size: number = 1): void {
    const count = 8 + Math.floor(Math.random() * 5);
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.3;
      const speed = (60 + Math.random() * 80) * size;
      const w = 3 + Math.random() * 3;
      const h = 3 + Math.random() * 3;
      this.spawn(
        x + (Math.random() - 0.5) * 4,
        y + (Math.random() - 0.5) * 4,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        0.4 + Math.random() * 0.3,
        color,
        w,
        h,
        0,
        100,
        (Math.random() - 0.5) * 6
      );
    }
  }

  /**
   * 4-6 tiny red squares that scatter and fade.
   * Used for melee hits.
   */
  spawnBloodSplash(x: number, y: number): void {
    const count = 4 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
      const vx = (Math.random() - 0.5) * 80;
      const vy = -30 - Math.random() * 50;
      const shade = Phaser.Display.Color.GetColor(
        180 + Math.floor(Math.random() * 75),
        0,
        0
      );
      this.spawn(x, y, vx, vy, 0.3 + Math.random() * 0.2, shade, 3, 3, 0, 200);
    }
  }

  /**
   * 3-5 yellow/orange tiny squares flying upward.
   * Used for ranged hits on armor.
   */
  spawnSparks(x: number, y: number): void {
    const count = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
      const vx = (Math.random() - 0.5) * 60;
      const vy = -60 - Math.random() * 80;
      const color = Math.random() > 0.5 ? 0xffcc00 : 0xff8800;
      this.spawn(x, y, vx, vy, 0.2 + Math.random() * 0.15, color, 2, 2, 0, -20);
    }
  }

  /**
   * 3-4 brown circles that expand and fade.
   * Used for movement and construction.
   */
  spawnDust(x: number, y: number): void {
    const count = 3 + Math.floor(Math.random() * 2);
    for (let i = 0; i < count; i++) {
      const vx = (Math.random() - 0.5) * 30;
      const vy = -10 - Math.random() * 20;
      const shade = Phaser.Display.Color.GetColor(
        120 + Math.floor(Math.random() * 40),
        90 + Math.floor(Math.random() * 30),
        50 + Math.floor(Math.random() * 20)
      );
      this.spawn(x, y, vx, vy, 0.4 + Math.random() * 0.3, shade, 4, 4, 1.5, -5);
    }
  }

  /**
   * Spinning ring of small colored dots that expand outward.
   * Used for hero abilities and evolution.
   */
  spawnMagic(x: number, y: number, color: number): void {
    const count = 10;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const speed = 40 + Math.random() * 30;
      this.spawn(
        x + Math.cos(angle) * 8,
        y + Math.sin(angle) * 8,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        0.6 + Math.random() * 0.3,
        color,
        3,
        3,
        0,
        0,
        (Math.random() > 0.5 ? 1 : -1) * 8
      );
    }
  }

  /**
   * Small fading dot left behind projectiles.
   */
  spawnProjectileTrail(x: number, y: number, color: number): void {
    this.spawn(x, y, 0, 0, 0.15 + Math.random() * 0.1, color, 2, 2, 0.5, 0);
  }

  /**
   * Brief white flash at a spawn point.
   */
  spawnFlash(x: number, y: number): void {
    this.spawn(x, y, 0, 0, 0.2, 0xffffff, 16, 24, 0.3, 0);
  }

  /**
   * Collapse effect — rectangles fall downward with gravity.
   * Used for base destruction.
   */
  spawnCollapse(x: number, y: number, color: number, count: number = 8): void {
    for (let i = 0; i < count; i++) {
      const vx = (Math.random() - 0.5) * 60;
      const vy = -40 - Math.random() * 60;
      const w = 6 + Math.random() * 10;
      const h = 6 + Math.random() * 10;
      this.spawn(x + (Math.random() - 0.5) * 40, y + (Math.random() - 0.5) * 30, vx, vy, 1.5, color, w, h, 0.5, 250, (Math.random() - 0.5) * 4);
    }
  }

  // ─────────────────────── UPDATE ───────────────────────

  /**
   * Tick all active particles, remove dead ones.
   * @param delta Seconds since last frame.
   */
  update(delta: number): void {
    for (let i = this.active.length - 1; i >= 0; i--) {
      const p = this.active[i];
      p.life -= delta;

      if (p.life <= 0) {
        this.release(p.gameObject);
        this.active.splice(i, 1);
        continue;
      }

      // Physics
      p.vy += p.gravity * delta;
      p.x += p.vx * delta;
      p.y += p.vy * delta;

      // Progress 0→1 as life depletes
      const progress = 1 - p.life / p.maxLife;

      // Fade out
      p.alpha = 1 - progress;

      // Scale interpolation
      const scale = p.scaleStart + (p.scaleEnd - p.scaleStart) * progress;

      // Rotation
      const rotation = p.gameObject.rotation + p.rotationSpeed * delta;

      // Apply
      p.gameObject.setPosition(p.x, p.y);
      p.gameObject.setAlpha(p.alpha);
      p.gameObject.setScale(Math.max(0.01, scale));
      p.gameObject.setRotation(rotation);
    }
  }

  /**
   * Destroy all particles and clean up.
   */
  destroy(): void {
    for (const p of this.active) {
      p.gameObject.destroy();
    }
    this.active.length = 0;
    for (const r of this.pool) {
      r.destroy();
    }
    this.pool.length = 0;
  }

  /** Number of active particles. */
  get count(): number {
    return this.active.length;
  }
}
