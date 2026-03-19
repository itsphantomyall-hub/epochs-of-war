import Phaser from 'phaser';

/**
 * BackgroundRenderer — Generates age-specific 3-layer parallax backgrounds.
 *
 * Layer Architecture:
 *   Layer 1 (Sky)          — moves at 10% of camera speed (slowest)
 *   Layer 2 (Far terrain)  — moves at 30% of camera speed
 *   Layer 3 (Near terrain) — moves at 60% of camera speed (fastest)
 *   Ground                 — stationary with scrolling texture
 *
 * Each layer is 2560x720 (2x screen width for parallax headroom).
 * Uses generateTexture for performance — drawn once per age change.
 */

const SCREEN_W = 1280;
const SCREEN_H = 720;
const TEX_W = 2560;
const GROUND_Y = 560;

/** Parallax multipliers for each layer */
const PARALLAX_SKY = 0.10;
const PARALLAX_FAR = 0.30;
const PARALLAX_NEAR = 0.60;

export class BackgroundRenderer {
  private scene: Phaser.Scene;
  private currentAge = 0;

  // Layer game objects
  private skyLayer: Phaser.GameObjects.Image | null = null;
  private farLayer: Phaser.GameObjects.Image | null = null;
  private nearLayer: Phaser.GameObjects.Image | null = null;
  private groundLayer: Phaser.GameObjects.Image | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Pre-generate background textures for all 8 ages.
   */
  generateAll(): void {
    for (let age = 1; age <= 8; age++) {
      this.generateSkyTexture(age);
      this.generateFarTexture(age);
      this.generateNearTexture(age);
      this.generateGroundTexture(age);
    }
  }

  /**
   * Show the background for a specific age with fade-in transitions.
   */
  showAge(age: number): void {
    if (age === this.currentAge) return;
    this.currentAge = age;

    // Remove old layers
    this.skyLayer?.destroy();
    this.farLayer?.destroy();
    this.nearLayer?.destroy();
    this.groundLayer?.destroy();

    const cx = SCREEN_W / 2;
    const cy = SCREEN_H / 2;

    this.skyLayer = this.scene.add.image(cx, cy, `bg_sky_${age}`)
      .setDepth(-30).setAlpha(0);
    this.farLayer = this.scene.add.image(cx, cy, `bg_far_${age}`)
      .setDepth(-25).setAlpha(0);
    this.nearLayer = this.scene.add.image(cx, cy, `bg_near_${age}`)
      .setDepth(-20).setAlpha(0);
    this.groundLayer = this.scene.add.image(cx, cy, `bg_ground_${age}`)
      .setDepth(-15).setAlpha(0);

    // Staggered fade in
    this.scene.tweens.add({ targets: this.skyLayer, alpha: 1, duration: 500 });
    this.scene.tweens.add({ targets: this.farLayer, alpha: 1, duration: 600, delay: 100 });
    this.scene.tweens.add({ targets: this.nearLayer, alpha: 1, duration: 700, delay: 150 });
    this.scene.tweens.add({ targets: this.groundLayer, alpha: 1, duration: 700, delay: 200 });
  }

  /**
   * Apply 3-layer parallax offset based on camera position.
   */
  updateParallax(cameraX: number): void {
    const cx = SCREEN_W / 2;
    if (this.skyLayer) {
      this.skyLayer.x = cx - cameraX * PARALLAX_SKY;
    }
    if (this.farLayer) {
      this.farLayer.x = cx - cameraX * PARALLAX_FAR;
    }
    if (this.nearLayer) {
      this.nearLayer.x = cx - cameraX * PARALLAX_NEAR;
    }
    // Ground does not parallax
  }

  /**
   * Convenience method matching the spec: drawBackground(scene, age, cameraX).
   * Ensures the correct age is showing and applies parallax.
   */
  drawBackground(_scene: Phaser.Scene, age: number, cameraX: number): void {
    this.showAge(age);
    this.updateParallax(cameraX);
  }

  // ─── SKY LAYER (Layer 1) ──────────────────────────────────────

  private generateSkyTexture(age: number): void {
    const key = `bg_sky_${age}`;
    if (this.scene.textures.exists(key)) return;

    const gfx = this.scene.add.graphics();

    switch (age) {
      case 1: this.drawSkyPrehistoric(gfx); break;
      case 2: this.drawSkyBronze(gfx); break;
      case 3: this.drawSkyClassical(gfx); break;
      case 4: this.drawSkyMedieval(gfx); break;
      case 5: this.drawSkyGunpowder(gfx); break;
      case 6: this.drawSkyIndustrial(gfx); break;
      case 7: this.drawSkyModern(gfx); break;
      case 8: this.drawSkyFuture(gfx); break;
    }

    // Fill below ground with dark
    gfx.fillStyle(0x000000);
    gfx.fillRect(0, GROUND_Y, TEX_W, SCREEN_H - GROUND_Y);

    gfx.generateTexture(key, TEX_W, SCREEN_H);
    gfx.destroy();
  }

  // Prehistoric: Orange-red gradient sky, 2 volcano silhouettes, 2 pterodactyl silhouettes
  private drawSkyPrehistoric(gfx: Phaser.GameObjects.Graphics): void {
    this.drawGradient(gfx, 0xCC4400, 0xFF8844, GROUND_Y);

    // 2 volcano silhouettes (dark triangles)
    gfx.fillStyle(0x2A1A10, 0.7);
    this.drawTriangleShape(gfx, 400, GROUND_Y, 180, 120);
    this.drawTriangleShape(gfx, 1800, GROUND_Y, 220, 140);
    // Lava glow at peaks
    gfx.fillStyle(0xFF4400, 0.5);
    gfx.fillRect(480, GROUND_Y - 120, 20, 8);
    gfx.fillRect(1890, GROUND_Y - 138, 24, 10);
    gfx.fillStyle(0xFFAA00, 0.3);
    gfx.fillRect(484, GROUND_Y - 128, 12, 10);
    gfx.fillRect(1896, GROUND_Y - 148, 14, 12);

    // 2 pterodactyl silhouettes (small V shapes)
    gfx.fillStyle(0x331A08, 0.6);
    this.drawPterodactyl(gfx, 600, 80);
    this.drawPterodactyl(gfx, 1500, 120);
  }

  // Bronze: Warm golden gradient, few wispy clouds
  private drawSkyBronze(gfx: Phaser.GameObjects.Graphics): void {
    this.drawGradient(gfx, 0xBB8833, 0xEECC88, GROUND_Y);

    // Wispy clouds
    gfx.fillStyle(0xFFFFFF, 0.12);
    gfx.fillRect(200, 60, 140, 12);
    gfx.fillRect(210, 55, 100, 8);
    gfx.fillRect(800, 90, 100, 10);
    gfx.fillRect(810, 85, 60, 8);
    gfx.fillRect(1600, 70, 120, 10);
    gfx.fillRect(1610, 65, 80, 8);
    gfx.fillRect(2200, 100, 90, 8);
  }

  // Classical: Clear blue gradient, white puffy clouds (rounded rectangles)
  private drawSkyClassical(gfx: Phaser.GameObjects.Graphics): void {
    this.drawGradient(gfx, 0x5588CC, 0x88BBEE, GROUND_Y);

    // White puffy clouds
    this.drawPuffyCloud(gfx, 150, 50, 160, 30);
    this.drawPuffyCloud(gfx, 600, 90, 120, 24);
    this.drawPuffyCloud(gfx, 1000, 40, 180, 32);
    this.drawPuffyCloud(gfx, 1500, 100, 140, 26);
    this.drawPuffyCloud(gfx, 2000, 60, 100, 22);
    this.drawPuffyCloud(gfx, 2300, 80, 130, 28);
  }

  // Medieval: Overcast grey gradient, dark cloud masses
  private drawSkyMedieval(gfx: Phaser.GameObjects.Graphics): void {
    this.drawGradient(gfx, 0x666677, 0x888899, GROUND_Y);

    // Dark cloud masses
    gfx.fillStyle(0x555566, 0.5);
    gfx.fillRect(50, 20, 300, 50);
    gfx.fillRect(70, 10, 250, 30);
    gfx.fillRect(500, 30, 250, 40);
    gfx.fillRect(520, 20, 200, 25);
    gfx.fillRect(900, 15, 350, 55);
    gfx.fillRect(940, 5, 260, 30);
    gfx.fillRect(1400, 25, 280, 45);
    gfx.fillRect(1800, 10, 320, 50);
    gfx.fillRect(2200, 30, 250, 40);

    // Darker cloud bottoms
    gfx.fillStyle(0x444455, 0.3);
    gfx.fillRect(80, 60, 240, 15);
    gfx.fillRect(520, 60, 200, 15);
    gfx.fillRect(930, 60, 280, 15);
    gfx.fillRect(1420, 60, 240, 15);
    gfx.fillRect(1830, 50, 260, 15);
  }

  // Gunpowder: Smoky horizon, distant flashes (subtle lighter patches)
  private drawSkyGunpowder(gfx: Phaser.GameObjects.Graphics): void {
    this.drawGradient(gfx, 0x556677, 0xAABBCC, GROUND_Y);

    // Smoke banks along horizon
    gfx.fillStyle(0x999999, 0.15);
    gfx.fillRect(0, GROUND_Y - 120, TEX_W, 60);
    gfx.fillStyle(0x888888, 0.1);
    gfx.fillRect(0, GROUND_Y - 100, TEX_W, 40);

    // Distant cannon flashes (subtle lighter patches)
    gfx.fillStyle(0xFFFFDD, 0.08);
    gfx.fillRect(400, GROUND_Y - 90, 30, 20);
    gfx.fillRect(1100, GROUND_Y - 80, 25, 18);
    gfx.fillRect(1900, GROUND_Y - 100, 28, 22);
    gfx.fillRect(2300, GROUND_Y - 85, 20, 15);
  }

  // Industrial: Amber smog overlay, dark cloud banks
  private drawSkyIndustrial(gfx: Phaser.GameObjects.Graphics): void {
    this.drawGradient(gfx, 0x445555, 0x778888, GROUND_Y);

    // Amber smog overlay
    gfx.fillStyle(0xD4A017, 0.12);
    gfx.fillRect(0, GROUND_Y - 200, TEX_W, 200);
    gfx.fillStyle(0xD4A017, 0.08);
    gfx.fillRect(0, 0, TEX_W, GROUND_Y);

    // Dark cloud banks
    gfx.fillStyle(0x3A3A3A, 0.4);
    gfx.fillRect(100, 20, 400, 50);
    gfx.fillRect(130, 10, 300, 25);
    gfx.fillRect(700, 30, 350, 45);
    gfx.fillRect(1200, 15, 400, 55);
    gfx.fillRect(1800, 25, 350, 50);
    gfx.fillRect(2300, 20, 200, 40);
  }

  // Modern: Blue sky, 2-3 white contrails (thin diagonal lines)
  private drawSkyModern(gfx: Phaser.GameObjects.Graphics): void {
    this.drawGradient(gfx, 0x3366AA, 0x6699DD, GROUND_Y);

    // Contrails (thin diagonal lines)
    gfx.lineStyle(2, 0xFFFFFF, 0.3);
    gfx.beginPath();
    gfx.moveTo(200, 20);
    gfx.lineTo(600, 100);
    gfx.strokePath();

    gfx.lineStyle(1, 0xFFFFFF, 0.25);
    gfx.beginPath();
    gfx.moveTo(1000, 30);
    gfx.lineTo(1400, 90);
    gfx.strokePath();

    gfx.lineStyle(2, 0xFFFFFF, 0.2);
    gfx.beginPath();
    gfx.moveTo(1800, 40);
    gfx.lineTo(2200, 110);
    gfx.strokePath();

    // Small light clouds
    gfx.fillStyle(0xFFFFFF, 0.1);
    gfx.fillRect(500, 140, 100, 16);
    gfx.fillRect(1300, 130, 80, 14);
    gfx.fillRect(2000, 150, 90, 12);
  }

  // Future: Dark space with stars, aurora bands
  private drawSkyFuture(gfx: Phaser.GameObjects.Graphics): void {
    // Deep space background
    this.drawGradient(gfx, 0x0A0A2E, 0x141438, GROUND_Y);

    // Stars (random white 1px dots)
    const rng = new Phaser.Math.RandomDataGenerator(['future_sky']);
    for (let i = 0; i < 120; i++) {
      const sx = rng.integerInRange(0, TEX_W);
      const sy = rng.integerInRange(0, Math.floor(GROUND_Y * 0.7));
      const brightness = 150 + rng.integerInRange(0, 105);
      const alpha = 0.4 + rng.frac() * 0.6;
      gfx.fillStyle(Phaser.Display.Color.GetColor(brightness, brightness, brightness), alpha);
      gfx.fillRect(sx, sy, 1, 1);
      // Some brighter stars are 2px
      if (rng.frac() < 0.1) {
        gfx.fillRect(sx, sy, 2, 2);
      }
    }

    // Aurora bands (cyan and magenta gradients)
    // Band 1 — cyan
    gfx.fillStyle(0x00CED1, 0.08);
    gfx.fillRect(200, 40, 600, 80);
    gfx.fillStyle(0x00CED1, 0.12);
    gfx.fillRect(300, 60, 400, 40);
    gfx.fillStyle(0x00CED1, 0.06);
    gfx.fillRect(150, 50, 700, 30);

    // Band 2 — purple/magenta
    gfx.fillStyle(0xE040FB, 0.06);
    gfx.fillRect(900, 30, 500, 70);
    gfx.fillStyle(0xE040FB, 0.10);
    gfx.fillRect(1000, 50, 300, 35);
    gfx.fillStyle(0xE040FB, 0.04);
    gfx.fillRect(850, 40, 600, 25);

    // Band 3 — mixed far right
    gfx.fillStyle(0x00CED1, 0.07);
    gfx.fillRect(1700, 50, 500, 60);
    gfx.fillStyle(0xE040FB, 0.05);
    gfx.fillRect(1800, 35, 400, 40);

    // Band 4 — extended right
    gfx.fillStyle(0x00CED1, 0.06);
    gfx.fillRect(2200, 60, 300, 50);
  }

  // ─── FAR TERRAIN LAYER (Layer 2) ──────────────────────────────

  private generateFarTexture(age: number): void {
    const key = `bg_far_${age}`;
    if (this.scene.textures.exists(key)) return;

    const gfx = this.scene.add.graphics();
    const horizonY = GROUND_Y - 100;

    switch (age) {
      case 1: this.drawFarPrehistoric(gfx, horizonY); break;
      case 2: this.drawFarBronze(gfx, horizonY); break;
      case 3: this.drawFarClassical(gfx, horizonY); break;
      case 4: this.drawFarMedieval(gfx, horizonY); break;
      case 5: this.drawFarGunpowder(gfx, horizonY); break;
      case 6: this.drawFarIndustrial(gfx, horizonY); break;
      case 7: this.drawFarModern(gfx, horizonY); break;
      case 8: this.drawFarFuture(gfx, horizonY); break;
    }

    gfx.generateTexture(key, TEX_W, SCREEN_H);
    gfx.destroy();
  }

  // Prehistoric: Volcano outlines with lava glow at peaks
  private drawFarPrehistoric(gfx: Phaser.GameObjects.Graphics, horizonY: number): void {
    this.drawMountainRange(gfx, horizonY, 0x553825, 0.6);

    // Volcano 1 with lava glow
    gfx.fillStyle(0x3D2815, 0.7);
    this.drawTriangleShape(gfx, 600, horizonY, 160, 100);
    gfx.fillStyle(0xFF4400, 0.3);
    gfx.fillRect(668, horizonY - 100, 18, 8);
    gfx.fillStyle(0xFFAA00, 0.2);
    gfx.fillRect(672, horizonY - 108, 10, 10);
    // Smoke rising from volcano
    gfx.fillStyle(0x666666, 0.15);
    gfx.fillRect(670, horizonY - 130, 14, 24);
    gfx.fillRect(674, horizonY - 145, 8, 18);

    // Volcano 2
    gfx.fillStyle(0x3D2815, 0.7);
    this.drawTriangleShape(gfx, 1800, horizonY, 200, 110);
    gfx.fillStyle(0xFF4400, 0.3);
    gfx.fillRect(1888, horizonY - 108, 20, 8);
    gfx.fillStyle(0xFFAA00, 0.2);
    gfx.fillRect(1892, horizonY - 116, 12, 10);
    gfx.fillStyle(0x666666, 0.12);
    gfx.fillRect(1890, horizonY - 135, 12, 20);
  }

  // Bronze: Ziggurat silhouettes, palm tree outlines
  private drawFarBronze(gfx: Phaser.GameObjects.Graphics, horizonY: number): void {
    this.drawDunes(gfx, horizonY, 0xCCAA77, 0.3);

    // Ziggurat silhouettes
    gfx.fillStyle(0xAA8855, 0.4);
    gfx.fillRect(300, horizonY - 30, 60, 30);
    gfx.fillRect(310, horizonY - 48, 40, 18);
    gfx.fillRect(320, horizonY - 60, 20, 12);

    gfx.fillRect(1200, horizonY - 25, 50, 25);
    gfx.fillRect(1208, horizonY - 40, 34, 15);
    gfx.fillRect(1216, horizonY - 50, 18, 10);

    gfx.fillStyle(0xAA8855, 0.3);
    gfx.fillRect(2000, horizonY - 20, 40, 20);
    gfx.fillRect(2008, horizonY - 30, 24, 10);

    // Palm tree outlines
    gfx.fillStyle(0x2E5339, 0.4);
    this.drawPalmTree(gfx, 500, horizonY, 35);
    this.drawPalmTree(gfx, 850, horizonY, 30);
    this.drawPalmTree(gfx, 1500, horizonY, 38);
    this.drawPalmTree(gfx, 1900, horizonY, 28);
    this.drawPalmTree(gfx, 2300, horizonY, 32);
  }

  // Classical: Acropolis/Parthenon silhouette on hill
  private drawFarClassical(gfx: Phaser.GameObjects.Graphics, horizonY: number): void {
    this.drawHills(gfx, horizonY, 0xBBBB99, 0.3);

    // Acropolis hill
    gfx.fillStyle(0xCCBB99, 0.35);
    gfx.fillRect(700, horizonY - 50, 200, 50);
    gfx.fillRect(730, horizonY - 60, 140, 12);

    // Parthenon on the hill
    gfx.fillStyle(0xDDDDCC, 0.35);
    gfx.fillRect(760, horizonY - 80, 80, 20);
    for (let i = 0; i < 6; i++) {
      gfx.fillRect(764 + i * 12, horizonY - 80, 3, 18);
    }
    gfx.fillRect(758, horizonY - 84, 84, 5);
    gfx.fillRect(770, horizonY - 90, 60, 7);
    gfx.fillRect(785, horizonY - 94, 30, 5);

    // Additional distant temple
    gfx.fillStyle(0xDDDDCC, 0.25);
    gfx.fillRect(1800, horizonY - 35, 50, 35);
    gfx.fillRect(1810, horizonY - 40, 30, 6);
    for (let i = 0; i < 3; i++) {
      gfx.fillRect(1804 + i * 14, horizonY - 35, 2, 30);
    }
  }

  // Medieval: Castle silhouettes, church spires
  private drawFarMedieval(gfx: Phaser.GameObjects.Graphics, horizonY: number): void {
    this.drawTreeLine(gfx, horizonY + 5, 0x334422, 0.4);

    // Castle silhouette 1
    gfx.fillStyle(0x555555, 0.35);
    gfx.fillRect(400, horizonY - 40, 60, 40);
    gfx.fillRect(395, horizonY - 55, 15, 55);
    gfx.fillRect(450, horizonY - 55, 15, 55);
    gfx.fillRect(396, horizonY - 60, 5, 6);
    gfx.fillRect(404, horizonY - 60, 5, 6);
    gfx.fillRect(451, horizonY - 60, 5, 6);
    gfx.fillRect(459, horizonY - 60, 5, 6);

    // Church spire
    gfx.fillStyle(0x555555, 0.3);
    gfx.fillRect(1100, horizonY - 30, 20, 30);
    gfx.fillRect(1104, horizonY - 50, 12, 20);
    gfx.fillRect(1107, horizonY - 65, 6, 15);
    gfx.fillRect(1109, horizonY - 70, 2, 6);

    // Castle silhouette 2
    gfx.fillStyle(0x555555, 0.25);
    gfx.fillRect(1800, horizonY - 30, 40, 30);
    gfx.fillRect(1795, horizonY - 42, 10, 42);
    gfx.fillRect(1835, horizonY - 42, 10, 42);

    // Watchtower
    gfx.fillStyle(0x555555, 0.3);
    gfx.fillRect(2200, horizonY - 35, 12, 35);
    gfx.fillRect(2198, horizonY - 40, 16, 6);
  }

  // Gunpowder: Ship sails on horizon, port buildings
  private drawFarGunpowder(gfx: Phaser.GameObjects.Graphics, horizonY: number): void {
    this.drawHills(gfx, horizonY, 0x887766, 0.25);

    // Port buildings
    for (let i = 0; i < 8; i++) {
      const bx = 200 + i * 280;
      const bh = 15 + (i % 3) * 10;
      gfx.fillStyle(0x776655, 0.3);
      gfx.fillRect(bx, horizonY - bh, 24, bh);
      gfx.fillStyle(0x665544, 0.3);
      gfx.fillRect(bx - 2, horizonY - bh - 4, 28, 5);
    }

    // Ship sails on horizon
    gfx.fillStyle(0xDDCCBB, 0.3);
    gfx.fillRect(600, horizonY - 50, 4, 30);
    gfx.fillRect(604, horizonY - 45, 12, 18);
    gfx.fillRect(1400, horizonY - 40, 3, 25);
    gfx.fillRect(1403, horizonY - 36, 10, 14);
    gfx.fillRect(2100, horizonY - 45, 3, 28);
    gfx.fillRect(2103, horizonY - 42, 11, 16);
  }

  // Industrial: Factory skyline, water towers, crane outlines
  private drawFarIndustrial(gfx: Phaser.GameObjects.Graphics, horizonY: number): void {
    const rng = new Phaser.Math.RandomDataGenerator(['ind_far']);

    for (let i = 0; i < 12; i++) {
      const bx = 80 + i * 200 + rng.integerInRange(0, 40);
      const bh = 20 + rng.integerInRange(0, 40);
      gfx.fillStyle(0x444433, 0.4);
      gfx.fillRect(bx, horizonY - bh, 35, bh);
      gfx.fillStyle(0x555544, 0.4);
      gfx.fillRect(bx + 12, horizonY - bh - 18, 6, 18);
      gfx.fillStyle(0x888888, 0.1);
      gfx.fillRect(bx + 10, horizonY - bh - 30, 10, 14);
    }

    // Water towers
    gfx.fillStyle(0x555544, 0.35);
    gfx.fillRect(1000, horizonY - 55, 20, 12);
    gfx.fillRect(1006, horizonY - 43, 2, 43);
    gfx.fillRect(1012, horizonY - 43, 2, 43);
    gfx.fillRect(2000, horizonY - 48, 18, 10);
    gfx.fillRect(2005, horizonY - 38, 2, 38);
    gfx.fillRect(2011, horizonY - 38, 2, 38);

    // Crane
    gfx.fillStyle(0x555544, 0.3);
    gfx.fillRect(1500, horizonY - 60, 2, 60);
    gfx.fillRect(1500, horizonY - 60, 30, 2);
    gfx.fillRect(1528, horizonY - 58, 2, 10);
  }

  // Modern: City skyline
  private drawFarModern(gfx: Phaser.GameObjects.Graphics, horizonY: number): void {
    const rng = new Phaser.Math.RandomDataGenerator(['mod_far']);

    for (let i = 0; i < 18; i++) {
      const bx = 30 + i * 140 + rng.integerInRange(0, 30);
      const bh = 30 + rng.integerInRange(0, 70);
      const bw = 20 + rng.integerInRange(0, 15);
      gfx.fillStyle(0x445566, 0.3);
      gfx.fillRect(bx, horizonY - bh, bw, bh);

      // Lit windows
      gfx.fillStyle(0xFFDD88, 0.1);
      for (let wy = horizonY - bh + 5; wy < horizonY - 3; wy += 8) {
        for (let wx = bx + 3; wx < bx + bw - 4; wx += 7) {
          gfx.fillRect(wx, wy, 3, 2);
        }
      }
    }

    // Radio tower
    gfx.fillStyle(0x445566, 0.4);
    gfx.fillRect(1200, horizonY - 90, 2, 90);
    gfx.fillRect(1194, horizonY - 60, 14, 2);
    gfx.fillRect(1196, horizonY - 75, 10, 2);
    gfx.fillStyle(0xFF0000, 0.4);
    gfx.fillRect(1200, horizonY - 92, 2, 2);
  }

  // Future: Space station outline, orbital ring arc
  private drawFarFuture(gfx: Phaser.GameObjects.Graphics, horizonY: number): void {
    // Space station outline
    gfx.fillStyle(0x334466, 0.3);
    gfx.fillRect(600, horizonY - 80, 80, 15);
    gfx.fillRect(580, horizonY - 75, 120, 5);
    gfx.fillRect(560, horizonY - 78, 20, 8);
    gfx.fillRect(700, horizonY - 78, 20, 8);
    gfx.fillStyle(0x00CED1, 0.1);
    gfx.fillRect(562, horizonY - 76, 16, 4);
    gfx.fillRect(702, horizonY - 76, 16, 4);

    // Orbital ring arc
    gfx.lineStyle(2, 0x00CED1, 0.12);
    gfx.beginPath();
    gfx.moveTo(200, horizonY - 30);
    for (let i = 0; i <= 20; i++) {
      const t = i / 20;
      const x = 200 + t * 2200;
      const y = horizonY - 30 - Math.sin(t * Math.PI) * 120;
      gfx.lineTo(x, y);
    }
    gfx.strokePath();

    // Floating structures
    gfx.fillStyle(0x222244, 0.4);
    gfx.fillRect(1500, horizonY - 50, 40, 12);
    gfx.fillRect(1510, horizonY - 58, 20, 10);
    gfx.fillStyle(0x00CED1, 0.15);
    gfx.fillRect(1502, horizonY - 48, 36, 1);
    gfx.fillRect(1512, horizonY - 56, 16, 1);

    // Moon
    gfx.fillStyle(0xCCCCDD, 0.15);
    gfx.fillRect(2100, 80, 30, 30);
    gfx.fillStyle(0xDDDDEE, 0.1);
    gfx.fillRect(2104, 84, 22, 22);
  }

  // ─── NEAR TERRAIN LAYER (Layer 3) ─────────────────────────────

  private generateNearTexture(age: number): void {
    const key = `bg_near_${age}`;
    if (this.scene.textures.exists(key)) return;

    const gfx = this.scene.add.graphics();
    const baseY = GROUND_Y - 20;

    switch (age) {
      case 1: this.drawNearPrehistoric(gfx, baseY); break;
      case 2: this.drawNearBronze(gfx, baseY); break;
      case 3: this.drawNearClassical(gfx, baseY); break;
      case 4: this.drawNearMedieval(gfx, baseY); break;
      case 5: this.drawNearGunpowder(gfx, baseY); break;
      case 6: this.drawNearIndustrial(gfx, baseY); break;
      case 7: this.drawNearModern(gfx, baseY); break;
      case 8: this.drawNearFuture(gfx, baseY); break;
    }

    gfx.generateTexture(key, TEX_W, SCREEN_H);
    gfx.destroy();
  }

  // Prehistoric: Large ferns, boulders, cave entrance
  private drawNearPrehistoric(gfx: Phaser.GameObjects.Graphics, baseY: number): void {
    const rng = new Phaser.Math.RandomDataGenerator(['pre_near']);

    // Large ferns
    for (let i = 0; i < 14; i++) {
      const x = rng.integerInRange(20, TEX_W - 40);
      this.drawFern(gfx, x, baseY, 20 + rng.integerInRange(0, 15));
    }

    // Boulders
    for (let i = 0; i < 8; i++) {
      const bx = rng.integerInRange(50, TEX_W - 60);
      const size = 10 + rng.integerInRange(0, 12);
      gfx.fillStyle(0x7A7060, 0.5);
      gfx.fillRect(bx, baseY - size + 4, size, size - 2);
      gfx.fillStyle(0x8A8070, 0.3);
      gfx.fillRect(bx + 2, baseY - size + 6, size - 4, size - 6);
    }

    // Cave entrance
    gfx.fillStyle(0x5E5545, 0.5);
    gfx.fillRect(1000, baseY - 30, 40, 30);
    gfx.fillRect(1005, baseY - 35, 30, 6);
    gfx.fillStyle(0x222211, 0.6);
    gfx.fillRect(1008, baseY - 20, 24, 20);
  }

  // Bronze: Palm trees, obelisks, sand dunes
  private drawNearBronze(gfx: Phaser.GameObjects.Graphics, baseY: number): void {
    this.drawPalmTree(gfx, 150, baseY, 50);
    this.drawPalmTree(gfx, 600, baseY, 55);
    this.drawPalmTree(gfx, 1100, baseY, 45);
    this.drawPalmTree(gfx, 1700, baseY, 52);
    this.drawPalmTree(gfx, 2200, baseY, 48);

    // Obelisks
    gfx.fillStyle(0xBB9955, 0.5);
    gfx.fillRect(400, baseY - 40, 8, 40);
    gfx.fillRect(402, baseY - 46, 4, 8);
    gfx.fillStyle(0xCD853F, 0.4);
    gfx.fillRect(403, baseY - 48, 2, 3);

    gfx.fillStyle(0xBB9955, 0.4);
    gfx.fillRect(1400, baseY - 35, 6, 35);
    gfx.fillRect(1401, baseY - 40, 4, 6);

    this.drawDunes(gfx, baseY + 5, 0xDEB887, 0.2);
  }

  // Classical: Olive trees, broken columns, amphora
  private drawNearClassical(gfx: Phaser.GameObjects.Graphics, baseY: number): void {
    // Olive trees
    for (let i = 0; i < 6; i++) {
      const tx = 120 + i * 400;
      gfx.fillStyle(0x6B5B4A, 0.5);
      gfx.fillRect(tx, baseY - 20, 4, 20);
      gfx.fillStyle(0x4A6741, 0.4);
      gfx.fillRect(tx - 10, baseY - 35, 24, 12);
      gfx.fillRect(tx - 6, baseY - 40, 16, 8);
      gfx.fillRect(tx - 3, baseY - 43, 10, 5);
    }

    // Broken columns
    gfx.fillStyle(0xDDDDCC, 0.4);
    gfx.fillRect(500, baseY - 15, 6, 15);
    gfx.fillRect(498, baseY - 18, 10, 4);
    gfx.fillRect(510, baseY - 4, 14, 5);
    gfx.fillRect(1800, baseY - 12, 5, 12);
    gfx.fillRect(1810, baseY - 3, 10, 4);

    // Amphora
    gfx.fillStyle(0xB87333, 0.4);
    gfx.fillRect(900, baseY - 10, 6, 10);
    gfx.fillRect(898, baseY - 12, 10, 3);
    gfx.fillRect(900, baseY - 13, 6, 2);
    gfx.fillRect(1300, baseY - 5, 10, 5);
    gfx.fillRect(1302, baseY - 7, 6, 3);
  }

  // Medieval: Dead trees, gravestones, wooden fences
  private drawNearMedieval(gfx: Phaser.GameObjects.Graphics, baseY: number): void {
    // Dead trees
    for (let i = 0; i < 5; i++) {
      const tx = 200 + i * 480;
      gfx.fillStyle(0x3D2B1F, 0.5);
      gfx.fillRect(tx, baseY - 30, 4, 30);
      gfx.fillRect(tx - 6, baseY - 28, 8, 2);
      gfx.fillRect(tx + 2, baseY - 25, 8, 2);
      gfx.fillRect(tx - 4, baseY - 20, 6, 2);
      gfx.fillRect(tx + 4, baseY - 18, 5, 2);
    }

    // Gravestones
    for (let i = 0; i < 8; i++) {
      const gx = 100 + i * 300;
      gfx.fillStyle(0x666666, 0.4);
      gfx.fillRect(gx, baseY - 12, 6, 12);
      gfx.fillRect(gx + 1, baseY - 14, 4, 3);
      gfx.fillStyle(0x555555, 0.3);
      gfx.fillRect(gx + 2, baseY - 10, 2, 6);
      gfx.fillRect(gx + 1, baseY - 8, 4, 2);
    }

    // Wooden fences
    for (let i = 0; i < 3; i++) {
      const fx = 350 + i * 700;
      gfx.fillStyle(0x654321, 0.35);
      gfx.fillRect(fx, baseY - 14, 2, 14);
      gfx.fillRect(fx + 12, baseY - 14, 2, 14);
      gfx.fillRect(fx + 24, baseY - 14, 2, 14);
      gfx.fillRect(fx, baseY - 12, 26, 2);
      gfx.fillRect(fx, baseY - 6, 26, 2);
    }
  }

  // Gunpowder: Cannon emplacements, barrels, crates
  private drawNearGunpowder(gfx: Phaser.GameObjects.Graphics, baseY: number): void {
    for (let i = 0; i < 4; i++) {
      const cx = 250 + i * 600;
      gfx.fillStyle(0x887766, 0.4);
      gfx.fillRect(cx, baseY - 8, 30, 8);
      gfx.fillRect(cx + 4, baseY - 12, 22, 5);
      gfx.fillStyle(0x444444, 0.5);
      gfx.fillRect(cx + 8, baseY - 14, 14, 3);
      gfx.fillStyle(0x553322, 0.4);
      gfx.fillRect(cx + 10, baseY - 6, 4, 4);
      gfx.fillRect(cx + 18, baseY - 6, 4, 4);
    }

    for (let i = 0; i < 6; i++) {
      const bx = 150 + i * 400;
      gfx.fillStyle(0x654321, 0.4);
      gfx.fillRect(bx, baseY - 10, 8, 10);
      gfx.fillStyle(0x555555, 0.3);
      gfx.fillRect(bx, baseY - 8, 8, 1);
      gfx.fillRect(bx, baseY - 4, 8, 1);
    }

    for (let i = 0; i < 5; i++) {
      const cx2 = 80 + i * 500;
      gfx.fillStyle(0x8B7355, 0.4);
      gfx.fillRect(cx2, baseY - 8, 10, 8);
      gfx.fillStyle(0x7A6345, 0.3);
      gfx.fillRect(cx2 + 4, baseY - 7, 2, 6);
      gfx.fillRect(cx2 + 2, baseY - 5, 6, 2);
    }
  }

  // Industrial: Telegraph poles, train tracks, coal piles
  private drawNearIndustrial(gfx: Phaser.GameObjects.Graphics, baseY: number): void {
    for (let i = 0; i < 8; i++) {
      const px = 100 + i * 300;
      gfx.fillStyle(0x654321, 0.5);
      gfx.fillRect(px, baseY - 40, 3, 40);
      gfx.fillRect(px - 6, baseY - 38, 15, 2);
      if (i < 7) {
        gfx.fillStyle(0x333333, 0.2);
        gfx.fillRect(px + 3, baseY - 37, 297, 1);
      }
    }

    // Train tracks
    gfx.fillStyle(0x555555, 0.3);
    gfx.fillRect(0, baseY + 5, TEX_W, 2);
    gfx.fillRect(0, baseY + 11, TEX_W, 2);
    gfx.fillStyle(0x654321, 0.25);
    for (let x = 0; x < TEX_W; x += 16) {
      gfx.fillRect(x, baseY + 3, 10, 12);
    }

    // Coal piles
    for (let i = 0; i < 5; i++) {
      const cx = 200 + i * 500;
      gfx.fillStyle(0x2C2C2C, 0.5);
      gfx.fillRect(cx, baseY - 6, 16, 6);
      gfx.fillRect(cx + 2, baseY - 10, 12, 5);
      gfx.fillRect(cx + 4, baseY - 12, 8, 3);
    }
  }

  // Modern: Destroyed buildings, sandbags, razor wire
  private drawNearModern(gfx: Phaser.GameObjects.Graphics, baseY: number): void {
    for (let i = 0; i < 4; i++) {
      const bx = 150 + i * 600;
      const bh = 20 + (i % 2) * 15;
      gfx.fillStyle(0x666666, 0.4);
      gfx.fillRect(bx, baseY - bh, 25, bh);
      gfx.fillStyle(0x555555, 0.4);
      gfx.fillRect(bx, baseY - bh - 4, 10, 5);
      gfx.fillRect(bx + 15, baseY - bh - 2, 8, 3);
      gfx.fillStyle(0x333333, 0.3);
      gfx.fillRect(bx + 4, baseY - bh + 5, 4, 4);
      gfx.fillRect(bx + 14, baseY - bh + 5, 4, 4);
    }

    for (let i = 0; i < 6; i++) {
      const sx = 80 + i * 400;
      gfx.fillStyle(0xC0B080, 0.4);
      gfx.fillRect(sx, baseY - 6, 8, 4);
      gfx.fillRect(sx + 9, baseY - 6, 8, 4);
      gfx.fillRect(sx + 4, baseY - 10, 8, 4);
    }

    // Razor wire
    gfx.fillStyle(0x888888, 0.3);
    for (let i = 0; i < 10; i++) {
      const wx = 300 + i * 200;
      gfx.fillRect(wx, baseY - 14, 1, 14);
      for (let j = 0; j < 3; j++) {
        gfx.fillRect(wx - 3, baseY - 12 + j * 4, 7, 1);
        gfx.fillRect(wx - 2, baseY - 13 + j * 4, 1, 3);
        gfx.fillRect(wx + 3, baseY - 13 + j * 4, 1, 3);
      }
    }
  }

  // Future: Floating platforms, holographic trees, data streams
  private drawNearFuture(gfx: Phaser.GameObjects.Graphics, baseY: number): void {
    // Floating platforms
    for (let i = 0; i < 6; i++) {
      const px = 150 + i * 400;
      const py = baseY - 10 - (i % 2) * 15;
      gfx.fillStyle(0x222244, 0.4);
      gfx.fillRect(px, py, 30, 5);
      gfx.fillStyle(0x00CED1, 0.2);
      gfx.fillRect(px + 2, py + 5, 26, 2);
      gfx.fillStyle(0x00CED1, 0.3);
      gfx.fillRect(px, py, 30, 1);
    }

    // Holographic trees
    for (let i = 0; i < 5; i++) {
      const tx = 80 + i * 500;
      gfx.fillStyle(0x00CED1, 0.15);
      gfx.fillRect(tx, baseY - 30, 3, 30);
      gfx.fillStyle(0x39FF14, 0.08);
      gfx.fillRect(tx - 8, baseY - 42, 20, 10);
      gfx.fillRect(tx - 5, baseY - 48, 14, 8);
      gfx.fillRect(tx - 2, baseY - 52, 8, 5);
      gfx.fillStyle(0x00CED1, 0.12);
      gfx.fillRect(tx - 6, baseY - 40, 16, 1);
      gfx.fillRect(tx - 3, baseY - 46, 10, 1);
    }

    // Data streams (vertical cyan lines)
    for (let i = 0; i < 12; i++) {
      const dx = 50 + i * 200;
      gfx.fillStyle(0x00CED1, 0.1);
      gfx.fillRect(dx, baseY - 60, 1, 60);
      gfx.fillStyle(0x00CED1, 0.2);
      for (let j = 0; j < 6; j++) {
        gfx.fillRect(dx, baseY - 55 + j * 10, 1, 3);
      }
    }
  }

  // ─── GROUND TEXTURE ───────────────────────────────────────────

  private generateGroundTexture(age: number): void {
    const key = `bg_ground_${age}`;
    if (this.scene.textures.exists(key)) return;

    const gfx = this.scene.add.graphics();

    switch (age) {
      case 1: this.drawGroundPrehistoric(gfx); break;
      case 2: this.drawGroundBronze(gfx); break;
      case 3: this.drawGroundClassical(gfx); break;
      case 4: this.drawGroundMedieval(gfx); break;
      case 5: this.drawGroundGunpowder(gfx); break;
      case 6: this.drawGroundIndustrial(gfx); break;
      case 7: this.drawGroundModern(gfx); break;
      case 8: this.drawGroundFuture(gfx); break;
    }

    gfx.generateTexture(key, SCREEN_W, SCREEN_H);
    gfx.destroy();
  }

  // Rocky brown earth with scattered bones
  private drawGroundPrehistoric(gfx: Phaser.GameObjects.Graphics): void {
    gfx.fillStyle(0x665533);
    gfx.fillRect(0, GROUND_Y, SCREEN_W, 10);
    gfx.fillStyle(0x554422);
    gfx.fillRect(0, GROUND_Y + 10, SCREEN_W, SCREEN_H - GROUND_Y - 10);
    gfx.fillStyle(0x7A8B3D);
    gfx.fillRect(0, GROUND_Y - 2, SCREEN_W, 3);

    const rng = new Phaser.Math.RandomDataGenerator(['pre_gnd']);
    for (let i = 0; i < 20; i++) {
      const x = rng.integerInRange(10, SCREEN_W - 10);
      gfx.fillStyle(0x777766, 0.3);
      gfx.fillRect(x, GROUND_Y + rng.integerInRange(1, 6), rng.integerInRange(3, 6), 2);
    }
    gfx.fillStyle(0xF5E6C8, 0.2);
    gfx.fillRect(200, GROUND_Y + 3, 6, 1);
    gfx.fillRect(500, GROUND_Y + 5, 4, 1);
    gfx.fillRect(900, GROUND_Y + 2, 5, 1);
    gfx.fillRect(1100, GROUND_Y + 4, 3, 1);
  }

  // Sandy terrain with footpaths
  private drawGroundBronze(gfx: Phaser.GameObjects.Graphics): void {
    gfx.fillStyle(0xDEB887);
    gfx.fillRect(0, GROUND_Y, SCREEN_W, 10);
    gfx.fillStyle(0xC4985A);
    gfx.fillRect(0, GROUND_Y + 10, SCREEN_W, SCREEN_H - GROUND_Y - 10);
    const rng = new Phaser.Math.RandomDataGenerator(['br_gnd']);
    for (let i = 0; i < 20; i++) {
      const x = rng.integerInRange(10, SCREEN_W - 10);
      gfx.fillStyle(0xCCAA77, 0.3);
      gfx.fillRect(x, GROUND_Y + rng.integerInRange(0, 8), rng.integerInRange(4, 8), 1);
    }
    gfx.fillStyle(0xB89050, 0.15);
    gfx.fillRect(0, GROUND_Y + 3, SCREEN_W, 5);
  }

  // Light stone ground with grass patches
  private drawGroundClassical(gfx: Phaser.GameObjects.Graphics): void {
    gfx.fillStyle(0xAA9977);
    gfx.fillRect(0, GROUND_Y, SCREEN_W, 10);
    gfx.fillStyle(0x998866);
    gfx.fillRect(0, GROUND_Y + 10, SCREEN_W, SCREEN_H - GROUND_Y - 10);
    gfx.fillStyle(0x77AA55);
    gfx.fillRect(0, GROUND_Y - 2, SCREEN_W, 3);
    const rng = new Phaser.Math.RandomDataGenerator(['cl_gnd']);
    for (let i = 0; i < 15; i++) {
      const x = rng.integerInRange(20, SCREEN_W - 20);
      gfx.fillStyle(0x77AA55, 0.15);
      gfx.fillRect(x, GROUND_Y + rng.integerInRange(0, 4), rng.integerInRange(10, 20), 3);
    }
  }

  // Muddy ground with cobblestone path
  private drawGroundMedieval(gfx: Phaser.GameObjects.Graphics): void {
    gfx.fillStyle(0x555533);
    gfx.fillRect(0, GROUND_Y, SCREEN_W, 10);
    gfx.fillStyle(0x444422);
    gfx.fillRect(0, GROUND_Y + 10, SCREEN_W, SCREEN_H - GROUND_Y - 10);
    gfx.fillStyle(0x558833);
    gfx.fillRect(0, GROUND_Y - 2, SCREEN_W, 3);
    gfx.fillStyle(0x888877, 0.15);
    for (let x = 0; x < SCREEN_W; x += 12) {
      gfx.fillRect(x, GROUND_Y + 2, 10, 6);
    }
    gfx.fillStyle(0x443322, 0.15);
    gfx.fillRect(300, GROUND_Y + 3, 20, 4);
    gfx.fillRect(800, GROUND_Y + 4, 15, 3);
  }

  // Packed earth with wooden planks
  private drawGroundGunpowder(gfx: Phaser.GameObjects.Graphics): void {
    gfx.fillStyle(0x776655);
    gfx.fillRect(0, GROUND_Y, SCREEN_W, 10);
    gfx.fillStyle(0x665544);
    gfx.fillRect(0, GROUND_Y + 10, SCREEN_W, SCREEN_H - GROUND_Y - 10);
    gfx.fillStyle(0x669944);
    gfx.fillRect(0, GROUND_Y - 2, SCREEN_W, 3);
    for (let x = 0; x < SCREEN_W; x += 20) {
      gfx.fillStyle(0x8B7355, 0.15);
      gfx.fillRect(x, GROUND_Y + 2, 18, 6);
      gfx.fillStyle(0x7A6345, 0.1);
      gfx.fillRect(x + 9, GROUND_Y + 2, 1, 6);
    }
  }

  // Iron-plated ground, rivets, grating
  private drawGroundIndustrial(gfx: Phaser.GameObjects.Graphics): void {
    gfx.fillStyle(0x554433);
    gfx.fillRect(0, GROUND_Y, SCREEN_W, 10);
    gfx.fillStyle(0x443322);
    gfx.fillRect(0, GROUND_Y + 10, SCREEN_W, SCREEN_H - GROUND_Y - 10);
    gfx.fillStyle(0x666666, 0.15);
    for (let x = 0; x < SCREEN_W; x += 40) {
      gfx.fillRect(x, GROUND_Y + 2, 38, 6);
    }
    gfx.fillStyle(0x888888, 0.1);
    for (let x = 5; x < SCREEN_W; x += 40) {
      gfx.fillRect(x, GROUND_Y + 3, 2, 2);
      gfx.fillRect(x + 32, GROUND_Y + 3, 2, 2);
    }
    gfx.fillStyle(0x333333, 0.1);
    gfx.fillRect(400, GROUND_Y + 2, 30, 6);
    gfx.fillRect(900, GROUND_Y + 2, 30, 6);
  }

  // Concrete with tread marks, debris
  private drawGroundModern(gfx: Phaser.GameObjects.Graphics): void {
    gfx.fillStyle(0x666666);
    gfx.fillRect(0, GROUND_Y, SCREEN_W, 10);
    gfx.fillStyle(0x555555);
    gfx.fillRect(0, GROUND_Y + 10, SCREEN_W, SCREEN_H - GROUND_Y - 10);
    gfx.fillStyle(0x555555, 0.3);
    for (let x = 0; x < SCREEN_W; x += 60) {
      gfx.fillRect(x, GROUND_Y, 1, 10);
    }
    gfx.fillStyle(0x444444, 0.15);
    gfx.fillRect(200, GROUND_Y + 3, 80, 2);
    gfx.fillRect(600, GROUND_Y + 5, 100, 2);
    gfx.fillRect(1000, GROUND_Y + 2, 60, 2);
    gfx.fillStyle(0x888888, 0.1);
    gfx.fillRect(350, GROUND_Y + 1, 4, 3);
    gfx.fillRect(750, GROUND_Y + 2, 3, 2);
    gfx.fillRect(1100, GROUND_Y + 1, 5, 2);
  }

  // Metallic floor with glowing cyan grid lines
  private drawGroundFuture(gfx: Phaser.GameObjects.Graphics): void {
    gfx.fillStyle(0x222233);
    gfx.fillRect(0, GROUND_Y, SCREEN_W, 10);
    gfx.fillStyle(0x1A1A2E);
    gfx.fillRect(0, GROUND_Y + 10, SCREEN_W, SCREEN_H - GROUND_Y - 10);
    gfx.fillStyle(0x00CED1, 0.08);
    for (let x = 0; x < SCREEN_W; x += 30) {
      gfx.fillRect(x, GROUND_Y, 1, 20);
    }
    gfx.fillStyle(0x00CED1, 0.06);
    gfx.fillRect(0, GROUND_Y + 2, SCREEN_W, 1);
    gfx.fillRect(0, GROUND_Y + 8, SCREEN_W, 1);
    gfx.fillRect(0, GROUND_Y + 14, SCREEN_W, 1);
    gfx.fillStyle(0x00CED1, 0.15);
    for (let x = 0; x < SCREEN_W; x += 30) {
      gfx.fillRect(x - 1, GROUND_Y + 1, 3, 3);
    }
  }

  // ─── HELPER DRAWING METHODS ───────────────────────────────────

  /** Draw a vertical gradient from topColor to bottomColor */
  private drawGradient(gfx: Phaser.GameObjects.Graphics, topHex: number, botHex: number, height: number): void {
    const topColor = Phaser.Display.Color.IntegerToColor(topHex);
    const botColor = Phaser.Display.Color.IntegerToColor(botHex);
    const bands = 16;
    for (let i = 0; i < bands; i++) {
      const t = i / (bands - 1);
      const r = Math.round(topColor.red + (botColor.red - topColor.red) * t);
      const g = Math.round(topColor.green + (botColor.green - topColor.green) * t);
      const b = Math.round(topColor.blue + (botColor.blue - topColor.blue) * t);
      const bandH = Math.ceil(height / bands);
      gfx.fillStyle(Phaser.Display.Color.GetColor(r, g, b));
      gfx.fillRect(0, i * bandH, TEX_W, bandH);
    }
  }

  /** Draw a simple triangle silhouette */
  private drawTriangleShape(gfx: Phaser.GameObjects.Graphics, x: number, baseY: number, width: number, height: number): void {
    const steps = 8;
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      const w = width * (1 - t);
      const stepH = Math.ceil(height / steps);
      gfx.fillRect(x + (width - w) / 2, baseY - (i + 1) * stepH, w, stepH);
    }
  }

  /** Draw a pterodactyl silhouette (V shape) */
  private drawPterodactyl(gfx: Phaser.GameObjects.Graphics, x: number, y: number): void {
    gfx.fillRect(x, y, 4, 3);
    gfx.fillRect(x - 8, y - 3, 8, 2);
    gfx.fillRect(x - 12, y - 5, 5, 2);
    gfx.fillRect(x + 4, y - 3, 8, 2);
    gfx.fillRect(x + 11, y - 5, 5, 2);
    gfx.fillRect(x + 3, y - 1, 3, 2);
  }

  /** Draw white puffy cloud */
  private drawPuffyCloud(gfx: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number): void {
    gfx.fillStyle(0xFFFFFF, 0.15);
    gfx.fillRect(x, y + h * 0.3, w, h * 0.5);
    gfx.fillStyle(0xFFFFFF, 0.12);
    gfx.fillRect(x + w * 0.1, y + h * 0.1, w * 0.35, h * 0.6);
    gfx.fillRect(x + w * 0.35, y, w * 0.35, h * 0.7);
    gfx.fillRect(x + w * 0.6, y + h * 0.15, w * 0.3, h * 0.55);
  }

  /** Draw a palm tree */
  private drawPalmTree(gfx: Phaser.GameObjects.Graphics, x: number, baseY: number, height: number): void {
    gfx.fillStyle(0x8B4513, 0.4);
    gfx.fillRect(x, baseY - height, 4, height);
    gfx.fillStyle(0xA0652E, 0.2);
    for (let y = baseY - height + 4; y < baseY; y += 6) {
      gfx.fillRect(x, y, 4, 2);
    }
    gfx.fillStyle(0x2E5339, 0.4);
    gfx.fillRect(x - 12, baseY - height - 4, 14, 3);
    gfx.fillRect(x - 16, baseY - height - 2, 6, 2);
    gfx.fillRect(x + 2, baseY - height - 4, 14, 3);
    gfx.fillRect(x + 14, baseY - height - 2, 6, 2);
    gfx.fillRect(x - 4, baseY - height - 8, 12, 4);
    gfx.fillRect(x - 2, baseY - height - 10, 8, 3);
    gfx.fillRect(x - 10, baseY - height + 2, 10, 2);
    gfx.fillRect(x + 4, baseY - height + 2, 10, 2);
  }

  /** Draw a fern */
  private drawFern(gfx: Phaser.GameObjects.Graphics, x: number, baseY: number, height: number): void {
    gfx.fillStyle(0x4A6741, 0.4);
    gfx.fillRect(x, baseY - height, 2, height);
    gfx.fillStyle(0x7A8B3D, 0.3);
    for (let i = 0; i < 4; i++) {
      const fy = baseY - height + 4 + i * Math.floor(height / 5);
      if (i % 2 === 0) {
        gfx.fillRect(x - 8, fy, 8, 2);
        gfx.fillRect(x - 10, fy + 1, 4, 2);
      } else {
        gfx.fillRect(x + 2, fy, 8, 2);
        gfx.fillRect(x + 8, fy + 1, 4, 2);
      }
    }
  }

  private drawMountainRange(gfx: Phaser.GameObjects.Graphics, baseY: number, color: number, alpha: number): void {
    gfx.fillStyle(color, alpha);
    const peaks = [
      { x: 0, w: 300, h: 50 },
      { x: 250, w: 350, h: 70 },
      { x: 550, w: 300, h: 40 },
      { x: 800, w: 400, h: 60 },
      { x: 1150, w: 300, h: 45 },
      { x: 1400, w: 350, h: 55 },
      { x: 1700, w: 300, h: 50 },
      { x: 1950, w: 350, h: 65 },
      { x: 2250, w: 300, h: 45 },
    ];
    for (const peak of peaks) {
      this.drawTriangleShape(gfx, peak.x, baseY, peak.w, peak.h);
      gfx.fillRect(peak.x, baseY - peak.h * 0.3, peak.w, peak.h * 0.3);
    }
  }

  private drawHills(gfx: Phaser.GameObjects.Graphics, baseY: number, color: number, alpha: number): void {
    gfx.fillStyle(color, alpha);
    for (let i = 0; i < 10; i++) {
      const x = i * 280;
      const w = 260 + (i % 2) * 40;
      const h = 20 + (i % 3) * 10;
      gfx.fillRect(x, baseY - h, w, h);
      gfx.fillRect(x + 20, baseY - h - 5, w - 40, 5);
    }
  }

  private drawDunes(gfx: Phaser.GameObjects.Graphics, baseY: number, color: number, alpha: number): void {
    gfx.fillStyle(color, alpha);
    for (let i = 0; i < 8; i++) {
      const x = i * 340;
      const w = 320;
      const h = 12 + (i % 3) * 4;
      gfx.fillRect(x, baseY - h, w, h);
      gfx.fillRect(x + 30, baseY - h - 4, w - 60, 4);
    }
  }

  private drawTreeLine(gfx: Phaser.GameObjects.Graphics, baseY: number, color: number, alpha: number): void {
    gfx.fillStyle(color, alpha);
    const rng = new Phaser.Math.RandomDataGenerator(['treeline']);
    for (let x = 0; x < TEX_W; x += 18) {
      const h = 8 + rng.integerInRange(0, 14);
      gfx.fillRect(x, baseY - h, 14, h);
      gfx.fillRect(x + 2, baseY - h - 4, 10, 4);
      gfx.fillRect(x + 4, baseY - h - 6, 6, 3);
    }
  }
}
