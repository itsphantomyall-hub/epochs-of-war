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
  /** Optional tag for grouped removal (e.g. stun stars). */
  tag: string;
}

/**
 * ParticleManager — lightweight particle effects using Phaser GameObjects.
 *
 * Uses pooled Rectangles for performance. Each effect spawns a handful of
 * small rectangles/circles that move, fade, and get recycled.
 *
 * Supports all 17 VFX effects from VISUAL_MASTER_PLAN.md Section 10.
 */
export class ParticleManager {
  private readonly scene: Phaser.Scene;
  private readonly active: Particle[] = [];
  private readonly pool: Phaser.GameObjects.Rectangle[] = [];

  /** Maximum concurrent particles to prevent performance issues. */
  private static readonly MAX_PARTICLES = 300;

  /** Whether particle effects are enabled. */
  public enabled = true;

  /** Auto-incrementing tag counter for tagged particle groups. */
  private nextTagId = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    // Pre-warm the pool
    for (let i = 0; i < 60; i++) {
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
    rotationSpeed = 0,
    tag = ''
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
      tag,
    });
  }

  // ─────────────────────── UTILITY ───────────────────────

  /** Pick a random item from an array. */
  private pick<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  /** Random float in [min, max). */
  private randRange(min: number, max: number): number {
    return min + Math.random() * (max - min);
  }

  // ─────────────────────── 17 VFX EFFECTS ───────────────────────

  /**
   * 1. Melee Hit — 3-5 white + accent color particles, radiate from impact, 200ms.
   */
  spawnMeleeHit(x: number, y: number, ageAccentColor: number = 0xffffff): void {
    const count = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 80;
      const color = Math.random() > 0.5 ? 0xffffff : ageAccentColor;
      const size = 2 + Math.random();
      this.spawn(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed,
        0.2, color, size, size, 0, 0, 0);
    }
  }

  /**
   * 2. Blood Splash — 4-6 red squares, scatter in hit direction, 300ms.
   */
  spawnBloodSplash(x: number, y: number, attackerDirection: number = -1): void {
    const count = 4 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
      // Bias velocity toward attacker facing direction
      const dirBias = attackerDirection * (30 + Math.random() * 50);
      const vx = dirBias + (Math.random() - 0.5) * 40;
      const vy = -30 - Math.random() * 50;
      const shade = this.pick([0xAA0000, 0x880000, 0x990000, 0xBB0000]);
      this.spawn(x, y, vx, vy, 0.3 + Math.random() * 0.1, shade, 2, 2, 0, 200);
    }
  }

  /**
   * 3. Ranged Impact — 2-4 yellow/orange sparks flying upward, 150ms.
   */
  spawnRangedImpact(x: number, y: number): void {
    const count = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
      const vx = (Math.random() - 0.5) * 60;
      const vy = -60 - Math.random() * 80;
      const color = this.pick([0xffcc00, 0xff8800, 0xffdd44]);
      this.spawn(x, y, vx, vy, 0.15 + Math.random() * 0.05, color, 2, 2, 0, -20);
    }
  }

  /**
   * 4. Small Explosion — 8-12 particles in orange/yellow/grey ring, 400ms.
   */
  spawnSmallExplosion(x: number, y: number): void {
    const count = 8 + Math.floor(Math.random() * 5);
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
      const speed = 50 + Math.random() * 60;
      const color = this.pick([0xff8800, 0xffcc00, 0xff6600, 0x888888, 0x666666]);
      const size = 3 + Math.random() * 2;
      this.spawn(
        x + (Math.random() - 0.5) * 4,
        y + (Math.random() - 0.5) * 4,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        0.4 + Math.random() * 0.15,
        color, size, size, 0, 80, (Math.random() - 0.5) * 4
      );
    }
  }

  /**
   * 5. Large Explosion — 12-16 particles, bigger, orange/yellow/white core + grey smoke, 600ms.
   * Caller should also trigger screen shake.
   */
  spawnLargeExplosion(x: number, y: number): void {
    const count = 12 + Math.floor(Math.random() * 5);
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.3;
      const speed = (60 + Math.random() * 100);
      const isSmoke = i >= count - 4; // last 4 are grey smoke
      const color = isSmoke
        ? this.pick([0x888888, 0x666666, 0x999999])
        : this.pick([0xff8800, 0xffcc00, 0xffdd00, 0xffffff, 0xff6600]);
      const size = isSmoke ? (5 + Math.random() * 3) : (4 + Math.random() * 4);
      this.spawn(
        x + (Math.random() - 0.5) * 6,
        y + (Math.random() - 0.5) * 6,
        Math.cos(angle) * speed * (isSmoke ? 0.6 : 1),
        Math.sin(angle) * speed * (isSmoke ? 0.6 : 1),
        0.6 + Math.random() * 0.2,
        color, size, size,
        isSmoke ? 1.5 : 0,
        isSmoke ? 30 : 100,
        (Math.random() - 0.5) * 6
      );
    }
  }

  /**
   * 6. Dust Cloud — 3-4 brownish circles that expand and fade, 500ms.
   */
  spawnDustCloud(x: number, y: number, color?: number): void {
    const count = 3 + Math.floor(Math.random() * 2);
    for (let i = 0; i < count; i++) {
      const vx = (Math.random() - 0.5) * 30;
      const vy = -10 - Math.random() * 20;
      const shade = color ?? Phaser.Display.Color.GetColor(
        120 + Math.floor(Math.random() * 40),
        90 + Math.floor(Math.random() * 30),
        50 + Math.floor(Math.random() * 20)
      );
      this.spawn(x, y, vx, vy, 0.5 + Math.random() * 0.2, shade, 4, 4, 1.8, -5);
    }
  }

  /**
   * 7. Magic Burst — 8-10 colored particles in spiral/ring expanding outward, 400ms.
   */
  spawnMagicBurst(x: number, y: number, color: number): void {
    const count = 8 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const speed = 40 + Math.random() * 30;
      this.spawn(
        x + Math.cos(angle) * 8,
        y + Math.sin(angle) * 8,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        0.4 + Math.random() * 0.2,
        color,
        3, 3,
        0.2,
        0,
        (Math.random() > 0.5 ? 1 : -1) * 8
      );
    }
  }

  /**
   * 8. Evolution Celebration — 20-30 gold + age-palette particles in fireworks, 2000ms.
   */
  spawnEvolutionCelebration(x: number, y: number, agePaletteColors?: number[]): void {
    const count = 20 + Math.floor(Math.random() * 11);
    const colors = [0xDAA520, 0xFFD700, 0xFFCC00, ...(agePaletteColors ?? [0xffffff])];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      // Burst upward with arc
      const speed = 80 + Math.random() * 120;
      const vx = Math.cos(angle) * speed * 0.6;
      const vy = -speed - Math.random() * 40; // strong upward
      const color = this.pick(colors);
      const size = 3 + Math.random() * 3;
      this.spawn(
        x + (Math.random() - 0.5) * 20,
        y,
        vx, vy,
        2.0 + Math.random() * 0.5,
        color, size, size,
        0,
        180, // gravity pulls them down in arc
        (Math.random() - 0.5) * 6
      );
    }
  }

  /**
   * 9. Muzzle Flash — 2-3 white/yellow particles in directional cone, 100ms.
   */
  spawnMuzzleFlash(x: number, y: number, direction: number = 1): void {
    const count = 2 + Math.floor(Math.random() * 2);
    for (let i = 0; i < count; i++) {
      const spreadAngle = (Math.random() - 0.5) * 0.6; // narrow cone
      const speed = 80 + Math.random() * 60;
      const color = this.pick([0xffffff, 0xffff88, 0xffcc00]);
      this.spawn(
        x, y,
        Math.cos(spreadAngle) * speed * direction,
        Math.sin(spreadAngle) * speed,
        0.1 + Math.random() * 0.05,
        color, 3, 3, 0.3, 0
      );
    }
  }

  /**
   * 10. Energy Beam — Continuous line with glow effect.
   * Draws a 2px line with a 4px lower-alpha line behind it.
   * Returns a tag ID that can be used to remove it when done.
   */
  spawnEnergyBeam(x1: number, y1: number, x2: number, y2: number, color: number, duration: number = 0.5): string {
    const tag = `beam_${this.nextTagId++}`;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const segments = Math.max(2, Math.floor(dist / 8));

    for (let i = 0; i < segments; i++) {
      const t = i / segments;
      const px = x1 + dx * t;
      const py = y1 + dy * t;

      // Outer glow (wider, lower alpha)
      this.spawn(px, py, 0, 0, duration, color, 4, 4, 1, 0, 0, tag);
      // Inner core (narrower, full brightness)
      this.spawn(px, py, 0, 0, duration, 0xffffff, 2, 2, 1, 0, 0, tag);
    }

    return tag;
  }

  /**
   * 11. Smoke Trail — Single grey 2px circle that fades over 500ms.
   * Call repeatedly along projectile path to create a trail.
   */
  spawnSmokeTrail(x: number, y: number): void {
    const shade = this.pick([0x888888, 0x999999, 0x777777]);
    this.spawn(x, y, (Math.random() - 0.5) * 5, -5 - Math.random() * 5,
      0.5 + Math.random() * 0.15, shade, 2, 2, 1.3, -3);
  }

  /**
   * 12. Fire — 3-5 orange/yellow/red particles that flicker above target, looping for duration.
   * Returns a tag ID so the fire can be removed.
   */
  spawnFire(x: number, y: number, duration: number = 1.0): string {
    const tag = `fire_${this.nextTagId++}`;
    const count = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
      const color = this.pick([0xff6600, 0xffaa00, 0xffcc00, 0xff3300]);
      const vx = (Math.random() - 0.5) * 15;
      const vy = -20 - Math.random() * 25;
      const size = 2 + Math.random() * 2;
      this.spawn(x + (Math.random() - 0.5) * 6, y, vx, vy,
        duration, color, size, size, 0, -10, 0, tag);
    }
    return tag;
  }

  /**
   * 13. Shield Hit — 4-6 cyan/white particles in ripple from impact, 200ms.
   */
  spawnShieldHit(x: number, y: number): void {
    const count = 4 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const speed = 50 + Math.random() * 40;
      const color = this.pick([0x00CED1, 0xffffff, 0x88DDFF, 0x00FFFF]);
      this.spawn(
        x, y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        0.2 + Math.random() * 0.05,
        color, 3, 3, 0, 0, 0
      );
    }
  }

  /**
   * 14. Stun Stars — 3 yellow 2px particles orbiting above unit head.
   * Returns a tag ID so they can be removed when stun ends.
   * Note: these will be updated in the main update loop to orbit.
   */
  spawnStunStars(x: number, y: number): string {
    const tag = `stun_${this.nextTagId++}`;
    const starCount = 3;
    for (let i = 0; i < starCount; i++) {
      const angle = (Math.PI * 2 * i) / starCount;
      const orbitRadius = 8;
      this.spawn(
        x + Math.cos(angle) * orbitRadius,
        y - 16 + Math.sin(angle) * orbitRadius * 0.4,
        0, 0,
        9999, // essentially infinite — removed by tag
        0xFFDD00, 2, 2, 1, 0, 0, tag
      );
    }
    return tag;
  }

  /**
   * 15. Heal Glow — 5-8 green/white particles rising upward gently, 400ms.
   */
  spawnHealGlow(x: number, y: number): void {
    const count = 5 + Math.floor(Math.random() * 4);
    for (let i = 0; i < count; i++) {
      const vx = (Math.random() - 0.5) * 20;
      const vy = -25 - Math.random() * 30;
      const color = this.pick([0x44FF44, 0x88FF88, 0xffffff, 0x00CC00]);
      const size = 2 + Math.random();
      this.spawn(
        x + (Math.random() - 0.5) * 10, y,
        vx, vy,
        0.4 + Math.random() * 0.15,
        color, size, size, 0.5, -10
      );
    }
  }

  /**
   * 16. Base Debris — 15-20 particles in base color, falling with gravity, 1500ms.
   */
  spawnBaseDebris(x: number, y: number, baseColor: number = 0x808080): void {
    const count = 15 + Math.floor(Math.random() * 6);
    for (let i = 0; i < count; i++) {
      const vx = (Math.random() - 0.5) * 80;
      const vy = -50 - Math.random() * 80;
      const w = 4 + Math.random() * 4;
      const h = 4 + Math.random() * 4;
      const color = this.pick([baseColor, 0x808080, 0x666666, 0x555555]);
      this.spawn(
        x + (Math.random() - 0.5) * 40,
        y + (Math.random() - 0.5) * 30,
        vx, vy,
        1.5 + Math.random() * 0.3,
        color, w, h, 0.5, 250, (Math.random() - 0.5) * 4
      );
    }
  }

  // ─────────────────────── LEGACY COMPATIBILITY ───────────────────────

  /** @deprecated Use spawnSmallExplosion or spawnLargeExplosion. Kept for backward compat. */
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
        color, w, h, 0, 100, (Math.random() - 0.5) * 6
      );
    }
  }

  /** @deprecated Use spawnRangedImpact. */
  spawnSparks(x: number, y: number): void {
    this.spawnRangedImpact(x, y);
  }

  /** @deprecated Use spawnDustCloud. */
  spawnDust(x: number, y: number): void {
    this.spawnDustCloud(x, y);
  }

  /** @deprecated Use spawnMagicBurst. */
  spawnMagic(x: number, y: number, color: number): void {
    this.spawnMagicBurst(x, y, color);
  }

  /** Small fading dot left behind projectiles. */
  spawnProjectileTrail(x: number, y: number, color: number): void {
    this.spawn(x, y, 0, 0, 0.15 + Math.random() * 0.1, color, 2, 2, 0.5, 0);
  }

  /** Brief white flash at a spawn point. */
  spawnFlash(x: number, y: number): void {
    this.spawn(x, y, 0, 0, 0.2, 0xffffff, 16, 24, 0.3, 0);
  }

  /** @deprecated Use spawnBaseDebris. */
  spawnCollapse(x: number, y: number, color: number, count: number = 8): void {
    this.spawnBaseDebris(x, y, color);
  }

  // ─────────────────────── TAG MANAGEMENT ───────────────────────

  /**
   * Remove all particles with the given tag.
   */
  removeByTag(tag: string): void {
    for (let i = this.active.length - 1; i >= 0; i--) {
      if (this.active[i].tag === tag) {
        this.release(this.active[i].gameObject);
        this.active.splice(i, 1);
      }
    }
  }

  /**
   * Update stun stars position to follow a unit.
   */
  updateTagPosition(tag: string, x: number, y: number): void {
    const tagged = this.active.filter(p => p.tag === tag);
    const count = tagged.length;
    if (count === 0) return;

    // Simple orbit
    const time = performance.now() / 1000;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + time * 3;
      const radius = 8;
      tagged[i].x = x + Math.cos(angle) * radius;
      tagged[i].y = y - 16 + Math.sin(angle) * radius * 0.4;
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
