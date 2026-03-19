import Phaser from 'phaser';

/**
 * BaseRenderer — Draws age-specific base buildings procedurally.
 *
 * Each age has a unique base design drawn with Phaser Graphics,
 * approximately 60x100 pixels.
 */
export class BaseRenderer {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Generate base textures for all ages and both factions.
   */
  generateAll(): void {
    for (let age = 1; age <= 8; age++) {
      for (const faction of ['player', 'enemy'] as const) {
        const key = `base_${age}_${faction}`;
        if (this.scene.textures.exists(key)) continue;

        const gfx = this.scene.add.graphics();
        this.drawBase(gfx, age);

        // Faction tint
        const tintColor = faction === 'player' ? 0x4488ff : 0xff4444;
        gfx.fillStyle(tintColor, 0.12);
        gfx.fillRect(0, 0, 60, 100);

        gfx.generateTexture(key, 60, 100);
        gfx.destroy();
      }
    }

    // Generate damage overlay textures
    for (let level = 1; level <= 3; level++) {
      const key = `base_damage_${level}`;
      if (this.scene.textures.exists(key)) continue;
      const gfx = this.scene.add.graphics();
      this.drawDamage(gfx, level);
      gfx.generateTexture(key, 60, 100);
      gfx.destroy();
    }
  }

  getTextureKey(age: number, faction: 'player' | 'enemy'): string {
    return `base_${age}_${faction}`;
  }

  getDamageTextureKey(level: number): string {
    return `base_damage_${level}`;
  }

  private drawBase(gfx: Phaser.GameObjects.Graphics, age: number): void {
    switch (age) {
      case 1: this.drawPrehistoricBase(gfx); break;
      case 2: this.drawBronzeBase(gfx); break;
      case 3: this.drawClassicalBase(gfx); break;
      case 4: this.drawMedievalBase(gfx); break;
      case 5: this.drawGunpowderBase(gfx); break;
      case 6: this.drawIndustrialBase(gfx); break;
      case 7: this.drawModernBase(gfx); break;
      case 8: this.drawFutureBase(gfx); break;
    }
  }

  // ─── AGE 1: PREHISTORIC — Cave/hut ───
  private drawPrehistoricBase(gfx: Phaser.GameObjects.Graphics): void {
    // Cave entrance (large rock formation)
    gfx.fillStyle(0x666655);
    gfx.fillRect(5, 20, 50, 75);
    // Rock top (rounded)
    gfx.fillStyle(0x777766);
    gfx.fillRect(10, 10, 40, 15);
    gfx.fillRect(15, 5, 30, 10);
    gfx.fillRect(20, 2, 20, 5);
    // Cave opening
    gfx.fillStyle(0x222211);
    gfx.fillRect(15, 50, 30, 45);
    gfx.fillRect(20, 45, 20, 10);
    // Thatched overhang
    gfx.fillStyle(0x8B7355);
    gfx.fillRect(8, 40, 44, 5);
    gfx.fillStyle(0x7A6345);
    gfx.fillRect(10, 38, 40, 3);
    // Bones on ground
    gfx.fillStyle(0xEEDDCC);
    gfx.fillRect(8, 88, 6, 2);
    gfx.fillRect(42, 90, 8, 2);
    gfx.fillRect(45, 88, 2, 4);
    // Campfire
    gfx.fillStyle(0xFF6600);
    gfx.fillRect(25, 85, 4, 4);
    gfx.fillStyle(0xFFAA00);
    gfx.fillRect(26, 82, 2, 4);
    gfx.fillStyle(0xFF4400);
    gfx.fillRect(27, 80, 1, 3);
    // Logs
    gfx.fillStyle(0x5A3520);
    gfx.fillRect(22, 88, 10, 2);
    // Skull decoration
    gfx.fillStyle(0xEEDDCC);
    gfx.fillRect(12, 35, 5, 5);
    gfx.fillStyle(0x222211);
    gfx.fillRect(13, 36, 1, 1);
    gfx.fillRect(15, 36, 1, 1);
  }

  // ─── AGE 2: BRONZE — Ziggurat ───
  private drawBronzeBase(gfx: Phaser.GameObjects.Graphics): void {
    // Base tier
    gfx.fillStyle(0xBB9955);
    gfx.fillRect(2, 60, 56, 40);
    // Middle tier
    gfx.fillStyle(0xCC9966);
    gfx.fillRect(8, 40, 44, 25);
    // Top tier
    gfx.fillStyle(0xDDAA77);
    gfx.fillRect(14, 22, 32, 22);
    // Temple top
    gfx.fillStyle(0xEEBB88);
    gfx.fillRect(20, 10, 20, 16);
    // Ramp
    gfx.fillStyle(0xAA8844);
    gfx.fillRect(22, 60, 10, 40);
    // Door
    gfx.fillStyle(0x553322);
    gfx.fillRect(24, 70, 6, 20);
    // Windows
    gfx.fillStyle(0x553322);
    gfx.fillRect(10, 48, 4, 4);
    gfx.fillRect(46, 48, 4, 4);
    gfx.fillRect(20, 28, 4, 4);
    gfx.fillRect(36, 28, 4, 4);
    // Flag on top
    gfx.fillStyle(0x886622);
    gfx.fillRect(29, 2, 2, 10);
    gfx.fillStyle(0xCC2222);
    gfx.fillRect(31, 3, 6, 4);
    // Bronze trim lines
    gfx.fillStyle(0xCD7F32);
    gfx.fillRect(2, 60, 56, 2);
    gfx.fillRect(8, 40, 44, 2);
    gfx.fillRect(14, 22, 32, 2);
    // Brick pattern
    gfx.fillStyle(0xAA8844, 0.3);
    for (let y = 65; y < 95; y += 5) {
      for (let x = 4; x < 56; x += 8) {
        gfx.fillRect(x, y, 7, 4);
      }
    }
  }

  // ─── AGE 3: CLASSICAL — Temple ───
  private drawClassicalBase(gfx: Phaser.GameObjects.Graphics): void {
    // Steps
    gfx.fillStyle(0xDDDDCC);
    gfx.fillRect(2, 88, 56, 12);
    gfx.fillRect(5, 84, 50, 6);
    gfx.fillRect(8, 80, 44, 6);
    // Main structure
    gfx.fillStyle(0xEEEEDD);
    gfx.fillRect(10, 30, 40, 52);
    // Columns (4)
    gfx.fillStyle(0xDDDDCC);
    for (let i = 0; i < 4; i++) {
      const cx = 14 + i * 10;
      gfx.fillRect(cx, 30, 4, 50);
      // Column capital
      gfx.fillStyle(0xCCCCBB);
      gfx.fillRect(cx - 1, 30, 6, 3);
      gfx.fillStyle(0xDDDDCC);
      // Column base
      gfx.fillRect(cx - 1, 77, 6, 3);
    }
    // Pediment (triangular roof)
    gfx.fillStyle(0xCCCCBB);
    gfx.fillRect(8, 26, 44, 6);
    gfx.fillStyle(0xBBBBAA);
    gfx.fillRect(14, 20, 32, 8);
    gfx.fillRect(20, 14, 20, 8);
    gfx.fillRect(24, 10, 12, 6);
    gfx.fillRect(28, 7, 4, 5);
    // Door
    gfx.fillStyle(0x886644);
    gfx.fillRect(22, 55, 16, 25);
    gfx.fillStyle(0x775533);
    gfx.fillRect(29, 55, 2, 25);
    // Roof detail line
    gfx.fillStyle(0xFFDD00);
    gfx.fillRect(8, 26, 44, 1);
  }

  // ─── AGE 4: MEDIEVAL — Castle ───
  private drawMedievalBase(gfx: Phaser.GameObjects.Graphics): void {
    // Main keep
    gfx.fillStyle(0x888888);
    gfx.fillRect(10, 25, 40, 75);
    // Tower left
    gfx.fillStyle(0x777777);
    gfx.fillRect(2, 15, 14, 85);
    // Tower right
    gfx.fillRect(44, 15, 14, 85);
    // Battlements on towers
    gfx.fillStyle(0x888888);
    for (let i = 0; i < 3; i++) {
      gfx.fillRect(2 + i * 5, 12, 3, 5);
      gfx.fillRect(44 + i * 5, 12, 3, 5);
    }
    // Main battlements
    for (let i = 0; i < 4; i++) {
      gfx.fillRect(12 + i * 8, 22, 5, 5);
    }
    // Stone texture
    gfx.fillStyle(0x777777, 0.3);
    for (let y = 30; y < 95; y += 6) {
      for (let x = 12; x < 48; x += 8) {
        gfx.fillRect(x, y, 7, 5);
      }
    }
    // Gate
    gfx.fillStyle(0x553322);
    gfx.fillRect(20, 60, 20, 40);
    // Gate arch
    gfx.fillStyle(0x666666);
    gfx.fillRect(20, 56, 20, 6);
    gfx.fillRect(22, 54, 16, 4);
    // Portcullis
    gfx.fillStyle(0x444444);
    for (let y = 62; y < 95; y += 4) {
      gfx.fillRect(22, y, 16, 1);
    }
    for (let x = 23; x < 38; x += 4) {
      gfx.fillRect(x, 62, 1, 33);
    }
    // Windows
    gfx.fillStyle(0x333333);
    gfx.fillRect(6, 35, 4, 6);
    gfx.fillRect(50, 35, 4, 6);
    gfx.fillRect(6, 55, 4, 6);
    gfx.fillRect(50, 55, 4, 6);
    // Arrow slits
    gfx.fillRect(25, 40, 2, 6);
    gfx.fillRect(33, 40, 2, 6);
    // Banner on keep
    gfx.fillStyle(0x886622);
    gfx.fillRect(29, 5, 2, 18);
    gfx.fillStyle(0x3344AA);
    gfx.fillRect(31, 6, 8, 6);
  }

  // ─── AGE 5: GUNPOWDER — Star fort ───
  private drawGunpowderBase(gfx: Phaser.GameObjects.Graphics): void {
    // Fort walls (angular)
    gfx.fillStyle(0x888877);
    gfx.fillRect(5, 30, 50, 65);
    // Angled bastions
    gfx.fillStyle(0x777766);
    gfx.fillRect(0, 50, 10, 25);
    gfx.fillRect(50, 50, 10, 25);
    gfx.fillRect(0, 48, 8, 4);
    gfx.fillRect(52, 48, 8, 4);
    // Ramparts
    gfx.fillStyle(0x999988);
    gfx.fillRect(5, 28, 50, 4);
    // Wall top detail
    gfx.fillStyle(0x888877);
    for (let i = 0; i < 7; i++) {
      gfx.fillRect(7 + i * 7, 25, 4, 5);
    }
    // Building inside fort
    gfx.fillStyle(0xAA9977);
    gfx.fillRect(15, 35, 30, 35);
    // Roof
    gfx.fillStyle(0x886644);
    gfx.fillRect(12, 30, 36, 8);
    gfx.fillRect(16, 26, 28, 6);
    // Windows
    gfx.fillStyle(0x553322);
    gfx.fillRect(20, 42, 4, 5);
    gfx.fillRect(36, 42, 4, 5);
    gfx.fillRect(28, 38, 4, 5);
    // Door
    gfx.fillStyle(0x553322);
    gfx.fillRect(25, 55, 10, 15);
    gfx.fillStyle(0x443322);
    gfx.fillRect(29, 55, 2, 15);
    // Cannons in embrasures
    gfx.fillStyle(0x333333);
    gfx.fillRect(2, 55, 6, 2);
    gfx.fillRect(52, 55, 6, 2);
    gfx.fillRect(2, 65, 6, 2);
    gfx.fillRect(52, 65, 6, 2);
    // Flag
    gfx.fillStyle(0x886622);
    gfx.fillRect(29, 14, 2, 14);
    gfx.fillStyle(0xCC2222);
    gfx.fillRect(31, 15, 7, 5);
    // Moat hint
    gfx.fillStyle(0x4488AA, 0.3);
    gfx.fillRect(0, 92, 60, 8);
  }

  // ─── AGE 6: INDUSTRIAL — Factory ───
  private drawIndustrialBase(gfx: Phaser.GameObjects.Graphics): void {
    // Main building
    gfx.fillStyle(0x665544);
    gfx.fillRect(5, 30, 50, 70);
    // Smokestacks (2)
    gfx.fillStyle(0x555555);
    gfx.fillRect(8, 5, 6, 28);
    gfx.fillRect(40, 8, 6, 25);
    // Smokestack tops
    gfx.fillStyle(0x666666);
    gfx.fillRect(7, 3, 8, 4);
    gfx.fillRect(39, 6, 8, 4);
    // Smoke puffs
    gfx.fillStyle(0xAAAAAA, 0.4);
    gfx.fillRect(8, 0, 4, 4);
    gfx.fillRect(6, 0, 3, 2);
    gfx.fillRect(41, 2, 4, 4);
    gfx.fillRect(39, 1, 3, 3);
    // Roof (slanted)
    gfx.fillStyle(0x554433);
    gfx.fillRect(3, 28, 54, 5);
    // Large gear
    gfx.fillStyle(0xCD7F32);
    gfx.fillRect(20, 40, 8, 8);
    gfx.fillStyle(0xB8860B);
    gfx.fillRect(22, 42, 4, 4);
    gfx.fillStyle(0xAA7711);
    gfx.fillRect(23, 43, 2, 2);
    // Small gear
    gfx.fillStyle(0xCD7F32);
    gfx.fillRect(30, 44, 5, 5);
    gfx.fillStyle(0xB8860B);
    gfx.fillRect(31, 45, 3, 3);
    // Pipes
    gfx.fillStyle(0x888888);
    gfx.fillRect(36, 40, 2, 20);
    gfx.fillRect(36, 55, 12, 2);
    gfx.fillRect(46, 50, 2, 7);
    // Windows (industrial)
    gfx.fillStyle(0x88BBCC);
    gfx.fillRect(10, 50, 8, 8);
    gfx.fillRect(10, 65, 8, 8);
    // Window frames
    gfx.fillStyle(0x444444);
    gfx.fillRect(13, 50, 2, 8);
    gfx.fillRect(10, 54, 8, 1);
    gfx.fillRect(13, 65, 2, 8);
    gfx.fillRect(10, 69, 8, 1);
    // Door (large industrial)
    gfx.fillStyle(0x444444);
    gfx.fillRect(22, 72, 16, 28);
    gfx.fillStyle(0x555555);
    gfx.fillRect(29, 72, 2, 28);
    // Steam
    gfx.fillStyle(0xDDDDDD, 0.3);
    gfx.fillRect(48, 48, 3, 3);
    gfx.fillRect(50, 46, 2, 2);
  }

  // ─── AGE 7: MODERN — Bunker ───
  private drawModernBase(gfx: Phaser.GameObjects.Graphics): void {
    // Main bunker (reinforced concrete)
    gfx.fillStyle(0x556655);
    gfx.fillRect(5, 40, 50, 60);
    // Bunker roof (flat, reinforced)
    gfx.fillStyle(0x667766);
    gfx.fillRect(3, 36, 54, 6);
    // Sandbags in front
    gfx.fillStyle(0x998866);
    for (let i = 0; i < 5; i++) {
      gfx.fillRect(8 + i * 8, 88, 7, 5);
    }
    gfx.fillRect(12, 83, 28, 5);
    // Radar dish
    gfx.fillStyle(0xCCCCCC);
    gfx.fillRect(35, 15, 14, 8);
    gfx.fillRect(40, 10, 4, 6);
    // Radar arm
    gfx.fillStyle(0x888888);
    gfx.fillRect(41, 23, 2, 14);
    // Antenna array
    gfx.fillStyle(0x888888);
    gfx.fillRect(12, 10, 1, 26);
    gfx.fillRect(15, 15, 1, 21);
    gfx.fillRect(18, 12, 1, 24);
    // Antenna tips
    gfx.fillStyle(0xFF0000);
    gfx.fillRect(12, 9, 1, 1);
    gfx.fillRect(18, 11, 1, 1);
    // Slit windows
    gfx.fillStyle(0x334433);
    gfx.fillRect(10, 50, 12, 3);
    gfx.fillRect(38, 50, 12, 3);
    gfx.fillRect(10, 65, 12, 3);
    gfx.fillRect(38, 65, 12, 3);
    // Heavy door
    gfx.fillStyle(0x445544);
    gfx.fillRect(22, 60, 16, 30);
    // Door handle
    gfx.fillStyle(0x888888);
    gfx.fillRect(25, 72, 3, 3);
    // Blast marks
    gfx.fillStyle(0x444444);
    gfx.fillRect(8, 45, 4, 2);
    gfx.fillRect(48, 55, 3, 3);
    // Camo pattern
    gfx.fillStyle(0x4A5F28, 0.2);
    gfx.fillRect(6, 42, 10, 8);
    gfx.fillRect(25, 45, 12, 6);
    gfx.fillRect(40, 58, 10, 8);
    // Barbed wire on top
    gfx.fillStyle(0x888888);
    gfx.fillRect(3, 35, 54, 1);
    for (let i = 0; i < 10; i++) {
      gfx.fillRect(5 + i * 5, 34, 2, 2);
    }
  }

  // ─── AGE 8: FUTURE — Crystalline structure ───
  private drawFutureBase(gfx: Phaser.GameObjects.Graphics): void {
    // Energy shield base
    gfx.fillStyle(0x00CED1, 0.15);
    gfx.fillRect(0, 10, 60, 90);
    // Shield border
    gfx.fillStyle(0x00CED1, 0.3);
    gfx.fillRect(0, 10, 2, 90);
    gfx.fillRect(58, 10, 2, 90);
    gfx.fillRect(0, 10, 60, 2);
    // Main structure (sleek, angular)
    gfx.fillStyle(0x333344);
    gfx.fillRect(10, 25, 40, 70);
    // Crystal spire top
    gfx.fillStyle(0x444455);
    gfx.fillRect(20, 8, 20, 20);
    gfx.fillRect(24, 3, 12, 8);
    gfx.fillRect(27, 0, 6, 5);
    // Energy core (glowing)
    gfx.fillStyle(0x00CED1);
    gfx.fillRect(22, 40, 16, 16);
    gfx.fillStyle(0x44FFFF);
    gfx.fillRect(24, 42, 12, 12);
    gfx.fillStyle(0x88FFFF);
    gfx.fillRect(26, 44, 8, 8);
    gfx.fillStyle(0xCCFFFF);
    gfx.fillRect(28, 46, 4, 4);
    // Armor panels
    gfx.fillStyle(0x444455);
    gfx.fillRect(10, 25, 40, 3);
    gfx.fillRect(10, 60, 40, 3);
    gfx.fillRect(10, 80, 40, 3);
    // Energy lines
    gfx.fillStyle(0x00CED1);
    gfx.fillRect(10, 28, 1, 65);
    gfx.fillRect(49, 28, 1, 65);
    gfx.fillRect(20, 63, 20, 1);
    gfx.fillRect(15, 83, 30, 1);
    // Door (energy field)
    gfx.fillStyle(0x00CED1, 0.4);
    gfx.fillRect(22, 70, 16, 25);
    gfx.fillStyle(0x44FFFF, 0.3);
    gfx.fillRect(24, 72, 12, 21);
    // Floating elements
    gfx.fillStyle(0x00CED1);
    gfx.fillRect(3, 30, 4, 4);
    gfx.fillRect(53, 35, 4, 4);
    gfx.fillRect(5, 60, 3, 3);
    gfx.fillRect(52, 65, 3, 3);
    // Top light
    gfx.fillStyle(0x44FFFF);
    gfx.fillRect(28, 0, 4, 2);
  }

  private drawDamage(gfx: Phaser.GameObjects.Graphics, level: number): void {
    gfx.lineStyle(1, 0x111111, 0.7);

    if (level >= 1) {
      // Small cracks
      gfx.beginPath();
      gfx.moveTo(10, 20);
      gfx.lineTo(18, 30);
      gfx.lineTo(14, 40);
      gfx.strokePath();
    }

    if (level >= 2) {
      // More cracks
      gfx.beginPath();
      gfx.moveTo(45, 25);
      gfx.lineTo(38, 45);
      gfx.lineTo(42, 55);
      gfx.strokePath();

      gfx.beginPath();
      gfx.moveTo(25, 15);
      gfx.lineTo(30, 28);
      gfx.strokePath();

      // Debris
      gfx.fillStyle(0x555555, 0.5);
      gfx.fillRect(8, 90, 3, 3);
      gfx.fillRect(45, 92, 4, 2);
    }

    if (level >= 3) {
      // Severe cracks
      gfx.lineStyle(2, 0x111111, 0.8);
      gfx.beginPath();
      gfx.moveTo(30, 10);
      gfx.lineTo(25, 35);
      gfx.lineTo(32, 55);
      gfx.lineTo(28, 75);
      gfx.strokePath();

      gfx.beginPath();
      gfx.moveTo(5, 50);
      gfx.lineTo(20, 48);
      gfx.strokePath();

      // More debris
      gfx.fillStyle(0x444444, 0.6);
      gfx.fillRect(5, 88, 5, 4);
      gfx.fillRect(48, 90, 4, 3);
      gfx.fillRect(15, 94, 3, 3);
      gfx.fillRect(38, 92, 5, 2);

      // Fire
      gfx.fillStyle(0xFF6600, 0.5);
      gfx.fillRect(35, 30, 4, 6);
      gfx.fillStyle(0xFFAA00, 0.4);
      gfx.fillRect(36, 28, 2, 3);
    }
  }
}
