import Phaser from 'phaser';

/**
 * BackgroundRenderer — Generates age-specific multi-layer backgrounds.
 *
 * Each age has 3 layers:
 *   - Sky (gradient + clouds/stars)
 *   - Far (mountains/buildings on horizon)
 *   - Ground (textured surface)
 *
 * Uses generateTexture for performance — drawn once per age change.
 */

/** Sky + far + ground colors per age */
const AGE_PALETTES: Record<number, {
  skyTop: number;
  skyBottom: number;
  farColor: number;
  groundColor: number;
  groundAccent: number;
  grassColor: number;
}> = {
  1: { skyTop: 0x4477AA, skyBottom: 0x88BBDD, farColor: 0x667744, groundColor: 0x665533, groundAccent: 0x554422, grassColor: 0x66AA33 },
  2: { skyTop: 0x5588BB, skyBottom: 0xBBDDEE, farColor: 0xAA8855, groundColor: 0xBB9955, groundAccent: 0xAA8844, grassColor: 0x88AA44 },
  3: { skyTop: 0x4488CC, skyBottom: 0x99CCEE, farColor: 0xCCBB99, groundColor: 0xAA9977, groundAccent: 0x998866, grassColor: 0x77AA55 },
  4: { skyTop: 0x445566, skyBottom: 0x889999, farColor: 0x556644, groundColor: 0x555533, groundAccent: 0x444422, grassColor: 0x558833 },
  5: { skyTop: 0x556677, skyBottom: 0xAABBCC, farColor: 0x887766, groundColor: 0x776655, groundAccent: 0x665544, grassColor: 0x669944 },
  6: { skyTop: 0x445555, skyBottom: 0x778888, farColor: 0x555544, groundColor: 0x554433, groundAccent: 0x443322, grassColor: 0x556633 },
  7: { skyTop: 0x334455, skyBottom: 0x667788, farColor: 0x556655, groundColor: 0x556644, groundAccent: 0x445533, grassColor: 0x557733 },
  8: { skyTop: 0x111133, skyBottom: 0x223355, farColor: 0x222244, groundColor: 0x222233, groundAccent: 0x111122, grassColor: 0x224466 },
};

export class BackgroundRenderer {
  private scene: Phaser.Scene;
  private currentAge = 0;

  // Layer game objects
  private skyLayer: Phaser.GameObjects.Image | null = null;
  private farLayer: Phaser.GameObjects.Image | null = null;
  private groundLayer: Phaser.GameObjects.Image | null = null;

  private static readonly SCREEN_W = 1280;
  private static readonly SCREEN_H = 720;
  private static readonly GROUND_Y = 560;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Generate background textures for all ages.
   */
  generateAll(): void {
    for (let age = 1; age <= 8; age++) {
      this.generateSkyTexture(age);
      this.generateFarTexture(age);
      this.generateGroundTexture(age);
    }
  }

  /**
   * Show the background for a specific age. Handles transitions.
   */
  showAge(age: number): void {
    if (age === this.currentAge) return;
    this.currentAge = age;

    // Remove old layers
    this.skyLayer?.destroy();
    this.farLayer?.destroy();
    this.groundLayer?.destroy();

    const W = BackgroundRenderer.SCREEN_W;
    const H = BackgroundRenderer.SCREEN_H;

    // Create new layers
    this.skyLayer = this.scene.add.image(W / 2, H / 2, `bg_sky_${age}`)
      .setDepth(-20).setAlpha(0);
    this.farLayer = this.scene.add.image(W / 2, H / 2, `bg_far_${age}`)
      .setDepth(-15).setAlpha(0);
    this.groundLayer = this.scene.add.image(W / 2, H / 2, `bg_ground_${age}`)
      .setDepth(-10).setAlpha(0);

    // Fade in
    this.scene.tweens.add({ targets: this.skyLayer, alpha: 1, duration: 500 });
    this.scene.tweens.add({ targets: this.farLayer, alpha: 1, duration: 600, delay: 100 });
    this.scene.tweens.add({ targets: this.groundLayer, alpha: 1, duration: 700, delay: 200 });
  }

  /**
   * Apply simple parallax offset based on camera or battle position.
   */
  updateParallax(offsetX: number): void {
    if (this.farLayer) {
      this.farLayer.x = BackgroundRenderer.SCREEN_W / 2 + offsetX * 0.1;
    }
  }

  // ─── TEXTURE GENERATION ───

  private generateSkyTexture(age: number): void {
    const key = `bg_sky_${age}`;
    if (this.scene.textures.exists(key)) return;

    const W = BackgroundRenderer.SCREEN_W;
    const H = BackgroundRenderer.SCREEN_H;
    const palette = AGE_PALETTES[age];
    const gfx = this.scene.add.graphics();

    // Sky gradient (simple bands)
    const topColor = Phaser.Display.Color.IntegerToColor(palette.skyTop);
    const botColor = Phaser.Display.Color.IntegerToColor(palette.skyBottom);
    const bands = 8;
    for (let i = 0; i < bands; i++) {
      const t = i / (bands - 1);
      const r = Math.round(topColor.red + (botColor.red - topColor.red) * t);
      const g = Math.round(topColor.green + (botColor.green - topColor.green) * t);
      const b = Math.round(topColor.blue + (botColor.blue - topColor.blue) * t);
      const bandH = Math.ceil(BackgroundRenderer.GROUND_Y / bands);
      gfx.fillStyle(Phaser.Display.Color.GetColor(r, g, b));
      gfx.fillRect(0, i * bandH, W, bandH);
    }

    // Fill below ground with dark
    gfx.fillStyle(0x000000);
    gfx.fillRect(0, BackgroundRenderer.GROUND_Y, W, H - BackgroundRenderer.GROUND_Y);

    // Age-specific sky elements
    if (age >= 8) {
      // Stars for future
      for (let i = 0; i < 40; i++) {
        const sx = Math.floor(Math.random() * W);
        const sy = Math.floor(Math.random() * BackgroundRenderer.GROUND_Y * 0.6);
        const brightness = 150 + Math.floor(Math.random() * 105);
        gfx.fillStyle(Phaser.Display.Color.GetColor(brightness, brightness, brightness), 0.6 + Math.random() * 0.4);
        gfx.fillRect(sx, sy, 1, 1);
      }
      // Aurora
      gfx.fillStyle(0x00CED1, 0.08);
      gfx.fillRect(200, 40, 400, 60);
      gfx.fillStyle(0x8844FF, 0.06);
      gfx.fillRect(500, 30, 300, 50);
    }

    // Clouds (simple rectangles for all ages)
    if (age < 8) {
      gfx.fillStyle(0xFFFFFF, 0.1);
      gfx.fillRect(100, 60, 120, 20);
      gfx.fillRect(400, 100, 80, 14);
      gfx.fillRect(800, 50, 140, 18);
      gfx.fillRect(600, 130, 100, 12);
    }

    // Sun/moon
    if (age <= 4) {
      // Sun
      gfx.fillStyle(0xFFDD88, 0.3);
      gfx.fillRect(1050, 30, 30, 30);
      gfx.fillStyle(0xFFEEAA, 0.2);
      gfx.fillRect(1045, 25, 40, 40);
    } else if (age >= 6) {
      // Dimmer sun for industrial
      gfx.fillStyle(0xDDCC88, 0.15);
      gfx.fillRect(1050, 30, 30, 30);
    }

    gfx.generateTexture(key, W, H);
    gfx.destroy();
  }

  private generateFarTexture(age: number): void {
    const key = `bg_far_${age}`;
    if (this.scene.textures.exists(key)) return;

    const W = BackgroundRenderer.SCREEN_W;
    const H = BackgroundRenderer.SCREEN_H;
    const palette = AGE_PALETTES[age];
    const gfx = this.scene.add.graphics();

    // Clear (transparent background — this layer overlays the sky)
    const groundY = BackgroundRenderer.GROUND_Y;
    const horizonY = groundY - 100;

    switch (age) {
      case 1: // Mountains + volcanoes
        this.drawMountainRange(gfx, horizonY, palette.farColor, 0.6);
        // Volcano
        gfx.fillStyle(0x664433, 0.5);
        gfx.fillRect(900, horizonY - 60, 80, 60);
        gfx.fillRect(920, horizonY - 80, 40, 20);
        // Lava glow
        gfx.fillStyle(0xFF4400, 0.2);
        gfx.fillRect(930, horizonY - 85, 20, 10);
        // Trees (primitive)
        this.drawTreeLine(gfx, horizonY + 10, 0x557733, 0.4);
        break;

      case 2: // Desert + pyramids
        this.drawDunes(gfx, horizonY, 0xCCAA77, 0.4);
        // Small pyramid
        gfx.fillStyle(0xBB9955, 0.5);
        gfx.fillRect(300, horizonY - 30, 50, 30);
        gfx.fillRect(310, horizonY - 45, 30, 15);
        gfx.fillRect(318, horizonY - 55, 14, 10);
        break;

      case 3: // Columns + temples on hills
        this.drawHills(gfx, horizonY, 0xBBBB99, 0.3);
        // Distant temple
        gfx.fillStyle(0xDDDDCC, 0.3);
        gfx.fillRect(500, horizonY - 40, 60, 40);
        gfx.fillRect(510, horizonY - 50, 40, 12);
        // Columns
        for (let i = 0; i < 4; i++) {
          gfx.fillRect(505 + i * 12, horizonY - 40, 3, 35);
        }
        break;

      case 4: // Dark forests + distant castle
        this.drawTreeLine(gfx, horizonY + 5, 0x334422, 0.5);
        this.drawTreeLine(gfx, horizonY + 15, 0x445533, 0.3);
        // Distant castle
        gfx.fillStyle(0x777777, 0.3);
        gfx.fillRect(700, horizonY - 30, 40, 30);
        gfx.fillRect(695, horizonY - 40, 10, 40);
        gfx.fillRect(735, horizonY - 40, 10, 40);
        break;

      case 5: // Smoke and towns
        this.drawHills(gfx, horizonY, 0x887766, 0.3);
        // Town buildings
        for (let i = 0; i < 6; i++) {
          const bx = 200 + i * 80 + Math.floor(Math.random() * 40);
          const bh = 15 + Math.floor(Math.random() * 25);
          gfx.fillStyle(0x776655, 0.3);
          gfx.fillRect(bx, horizonY - bh, 20, bh);
        }
        // Smoke plumes
        gfx.fillStyle(0x888888, 0.1);
        gfx.fillRect(280, horizonY - 50, 15, 30);
        gfx.fillRect(520, horizonY - 40, 10, 25);
        break;

      case 6: // Factory skyline
        // Factory buildings
        for (let i = 0; i < 8; i++) {
          const bx = 100 + i * 120 + Math.floor(Math.random() * 40);
          const bh = 20 + Math.floor(Math.random() * 40);
          gfx.fillStyle(0x444433, 0.4);
          gfx.fillRect(bx, horizonY - bh, 30, bh);
          // Smokestack
          gfx.fillStyle(0x555544, 0.4);
          gfx.fillRect(bx + 10, horizonY - bh - 15, 5, 15);
          // Smoke
          gfx.fillStyle(0x888888, 0.1);
          gfx.fillRect(bx + 8, horizonY - bh - 25, 8, 12);
        }
        break;

      case 7: // City skyline
        // Skyscrapers
        for (let i = 0; i < 10; i++) {
          const bx = 50 + i * 110 + Math.floor(Math.random() * 30);
          const bh = 30 + Math.floor(Math.random() * 60);
          gfx.fillStyle(0x445544, 0.3);
          gfx.fillRect(bx, horizonY - bh, 25, bh);
          // Windows
          gfx.fillStyle(0xFFDD88, 0.1);
          for (let wy = horizonY - bh + 5; wy < horizonY; wy += 8) {
            gfx.fillRect(bx + 3, wy, 3, 2);
            gfx.fillRect(bx + 10, wy, 3, 2);
            gfx.fillRect(bx + 17, wy, 3, 2);
          }
        }
        break;

      case 8: // Futuristic cityscape
        // Holographic towers
        for (let i = 0; i < 8; i++) {
          const bx = 80 + i * 130 + Math.floor(Math.random() * 40);
          const bh = 40 + Math.floor(Math.random() * 70);
          gfx.fillStyle(0x222244, 0.4);
          gfx.fillRect(bx, horizonY - bh, 30, bh);
          // Energy lines
          gfx.fillStyle(0x00CED1, 0.15);
          gfx.fillRect(bx, horizonY - bh, 1, bh);
          gfx.fillRect(bx + 29, horizonY - bh, 1, bh);
          // Glowing windows
          gfx.fillStyle(0x00CED1, 0.1);
          for (let wy = horizonY - bh + 5; wy < horizonY; wy += 10) {
            gfx.fillRect(bx + 5, wy, 20, 2);
          }
        }
        // Floating platforms
        gfx.fillStyle(0x00CED1, 0.08);
        gfx.fillRect(300, horizonY - 90, 40, 5);
        gfx.fillRect(700, horizonY - 70, 30, 5);
        break;
    }

    gfx.generateTexture(key, W, H);
    gfx.destroy();
  }

  private generateGroundTexture(age: number): void {
    const key = `bg_ground_${age}`;
    if (this.scene.textures.exists(key)) return;

    const W = BackgroundRenderer.SCREEN_W;
    const H = BackgroundRenderer.SCREEN_H;
    const palette = AGE_PALETTES[age];
    const gfx = this.scene.add.graphics();
    const groundY = BackgroundRenderer.GROUND_Y;

    // Grass line
    gfx.fillStyle(palette.grassColor);
    gfx.fillRect(0, groundY - 2, W, 4);

    // Ground surface
    gfx.fillStyle(palette.groundColor);
    gfx.fillRect(0, groundY + 2, W, 8);

    // Underground
    gfx.fillStyle(palette.groundAccent);
    gfx.fillRect(0, groundY + 10, W, H - groundY - 10);

    // Ground details (age-specific)
    const rng = new Phaser.Math.RandomDataGenerator([`ground_${age}`]);

    if (age <= 3) {
      // Dirt spots
      for (let i = 0; i < 15; i++) {
        const x = rng.integerInRange(20, W - 20);
        const y = groundY + 2 + rng.integerInRange(0, 6);
        gfx.fillStyle(palette.groundAccent, 0.5);
        gfx.fillRect(x, y, rng.integerInRange(2, 5), rng.integerInRange(1, 3));
      }
      // Small rocks
      for (let i = 0; i < 6; i++) {
        const x = rng.integerInRange(40, W - 40);
        gfx.fillStyle(0x888877, 0.3);
        gfx.fillRect(x, groundY, rng.integerInRange(3, 6), 2);
      }
    } else if (age <= 5) {
      // Cobblestone hints
      gfx.fillStyle(0x888877, 0.1);
      for (let x = 0; x < W; x += 12) {
        gfx.fillRect(x, groundY + 2, 10, 6);
      }
    } else if (age <= 7) {
      // Concrete/asphalt
      gfx.fillStyle(0x666666, 0.1);
      gfx.fillRect(0, groundY + 2, W, 8);
      // Road markings
      gfx.fillStyle(0xFFDD00, 0.1);
      for (let x = 0; x < W; x += 40) {
        gfx.fillRect(x, groundY + 5, 20, 1);
      }
    } else {
      // Metal/energy floor
      gfx.fillStyle(0x00CED1, 0.05);
      for (let x = 0; x < W; x += 30) {
        gfx.fillRect(x, groundY + 2, 28, 1);
        gfx.fillRect(x, groundY + 8, 28, 1);
      }
    }

    gfx.generateTexture(key, W, H);
    gfx.destroy();
  }

  // ─── HELPER DRAWING METHODS ───

  private drawMountainRange(gfx: Phaser.GameObjects.Graphics, baseY: number, color: number, alpha: number): void {
    gfx.fillStyle(color, alpha);
    const peaks = [
      { x: 0, w: 200, h: 50 },
      { x: 150, w: 250, h: 70 },
      { x: 350, w: 200, h: 40 },
      { x: 500, w: 300, h: 60 },
      { x: 750, w: 200, h: 45 },
      { x: 900, w: 250, h: 55 },
      { x: 1100, w: 200, h: 50 },
    ];
    for (const peak of peaks) {
      gfx.fillRect(peak.x, baseY - peak.h, peak.w, peak.h);
      // Simple triangle top
      gfx.fillRect(peak.x + peak.w * 0.2, baseY - peak.h - 10, peak.w * 0.6, 10);
      gfx.fillRect(peak.x + peak.w * 0.35, baseY - peak.h - 18, peak.w * 0.3, 8);
    }
  }

  private drawHills(gfx: Phaser.GameObjects.Graphics, baseY: number, color: number, alpha: number): void {
    gfx.fillStyle(color, alpha);
    for (let i = 0; i < 6; i++) {
      const x = i * 220;
      const w = 200 + (i % 2) * 50;
      const h = 20 + (i % 3) * 10;
      gfx.fillRect(x, baseY - h, w, h);
      gfx.fillRect(x + 20, baseY - h - 5, w - 40, 5);
    }
  }

  private drawDunes(gfx: Phaser.GameObjects.Graphics, baseY: number, color: number, alpha: number): void {
    gfx.fillStyle(color, alpha);
    for (let i = 0; i < 5; i++) {
      const x = i * 280;
      const w = 260;
      const h = 15 + i * 3;
      gfx.fillRect(x, baseY - h, w, h);
      gfx.fillRect(x + 30, baseY - h - 5, w - 60, 5);
    }
  }

  private drawTreeLine(gfx: Phaser.GameObjects.Graphics, baseY: number, color: number, alpha: number): void {
    gfx.fillStyle(color, alpha);
    for (let x = 0; x < BackgroundRenderer.SCREEN_W; x += 15) {
      const h = 8 + Math.floor(Math.random() * 12);
      gfx.fillRect(x, baseY - h, 12, h);
      gfx.fillRect(x + 2, baseY - h - 4, 8, 4);
      gfx.fillRect(x + 4, baseY - h - 6, 4, 2);
    }
  }
}
