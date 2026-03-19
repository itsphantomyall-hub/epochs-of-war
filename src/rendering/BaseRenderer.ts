import Phaser from 'phaser';

/**
 * BaseRenderer — Draws 8 unique, age-specific base buildings procedurally.
 *
 * Each base is 64×100 pixels drawn with Phaser Graphics.
 * Generates textures: base_{age}_{faction} and damage overlays.
 *
 * Ages:
 *  1. Prehistoric Cave
 *  2. Bronze Ziggurat
 *  3. Classical Temple
 *  4. Medieval Castle
 *  5. Gunpowder Star Fort
 *  6. Industrial Factory
 *  7. Modern Bunker
 *  8. Future Crystal Spire
 */

const BASE_W = 64;
const BASE_H = 100;

export class BaseRenderer {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Generate base textures for all ages and both factions,
   * plus 3 damage overlay textures.
   */
  generateAll(): void {
    for (let age = 1; age <= 8; age++) {
      for (const faction of ['player', 'enemy'] as const) {
        const key = `base_${age}_${faction}`;
        if (this.scene.textures.exists(key)) continue;

        const gfx = this.scene.add.graphics();
        this.drawBase(gfx, age);

        // Faction tint overlay
        const tintColor = faction === 'player' ? 0x4488ff : 0xff4444;
        gfx.fillStyle(tintColor, 0.12);
        gfx.fillRect(0, 0, BASE_W, BASE_H);

        gfx.generateTexture(key, BASE_W, BASE_H);
        gfx.destroy();
      }
    }

    // Damage overlay textures (3 levels)
    for (let level = 1; level <= 3; level++) {
      const key = `base_damage_${level}`;
      if (this.scene.textures.exists(key)) continue;
      const gfx = this.scene.add.graphics();
      this.drawDamage(gfx, level);
      gfx.generateTexture(key, BASE_W, BASE_H);
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
      case 1: this.drawPrehistoricCave(gfx); break;
      case 2: this.drawBronzeZiggurat(gfx); break;
      case 3: this.drawClassicalTemple(gfx); break;
      case 4: this.drawMedievalCastle(gfx); break;
      case 5: this.drawGunpowderStarFort(gfx); break;
      case 6: this.drawIndustrialFactory(gfx); break;
      case 7: this.drawModernBunker(gfx); break;
      case 8: this.drawFutureCrystalSpire(gfx); break;
    }
  }

  // ─── AGE 1: PREHISTORIC CAVE ───────────────────────────────────
  // Rock overhang (irregular), stalactites, animal hide door,
  // campfire, bone pile, 5 natural rock ledges for turret slots.
  private drawPrehistoricCave(gfx: Phaser.GameObjects.Graphics): void {
    // Irregular rock body (wider at top, narrowing slightly)
    gfx.fillStyle(0x6B6050);
    gfx.fillRect(4, 30, 56, 70);
    // Rock overhang — wider than body, uneven
    gfx.fillStyle(0x7A7060);
    gfx.fillRect(0, 18, 64, 16);
    gfx.fillRect(2, 14, 60, 6);
    gfx.fillRect(6, 10, 52, 6);
    gfx.fillRect(12, 6, 40, 6);
    gfx.fillRect(18, 3, 28, 5);
    // Irregular rock edges (not rectangular)
    gfx.fillStyle(0x5E5545);
    gfx.fillRect(0, 20, 4, 8);
    gfx.fillRect(60, 22, 4, 6);
    gfx.fillRect(2, 28, 3, 10);
    gfx.fillRect(59, 30, 5, 8);

    // Stalactites hanging from overhang (3-4 triangles)
    gfx.fillStyle(0x888070);
    // Stalactite 1
    gfx.fillRect(12, 34, 4, 6);
    gfx.fillRect(13, 40, 2, 4);
    gfx.fillRect(14, 44, 1, 3);
    // Stalactite 2
    gfx.fillRect(28, 34, 5, 5);
    gfx.fillRect(29, 39, 3, 4);
    gfx.fillRect(30, 43, 2, 3);
    gfx.fillRect(31, 46, 1, 2);
    // Stalactite 3
    gfx.fillRect(44, 34, 4, 4);
    gfx.fillRect(45, 38, 2, 3);
    gfx.fillRect(46, 41, 1, 2);
    // Stalactite 4 (small)
    gfx.fillRect(52, 34, 3, 3);
    gfx.fillRect(53, 37, 1, 2);

    // Rock texture: darker speckles
    gfx.fillStyle(0x5A5040, 0.4);
    gfx.fillRect(8, 38, 3, 2);
    gfx.fillRect(20, 50, 4, 2);
    gfx.fillRect(48, 42, 3, 3);
    gfx.fillRect(36, 56, 2, 3);
    gfx.fillRect(14, 70, 3, 2);
    gfx.fillRect(50, 68, 2, 3);

    // Animal hide door (brown rectangle with stitching)
    gfx.fillStyle(0x8B6914);
    gfx.fillRect(22, 54, 20, 32);
    // Hide texture — lighter patches
    gfx.fillStyle(0xA07B20, 0.5);
    gfx.fillRect(24, 58, 6, 4);
    gfx.fillRect(34, 66, 5, 3);
    // Stitching (dark dots along edges)
    gfx.fillStyle(0x4A3020);
    for (let y = 56; y < 84; y += 4) {
      gfx.fillRect(22, y, 1, 2);
      gfx.fillRect(41, y, 1, 2);
    }
    for (let x = 24; x < 40; x += 4) {
      gfx.fillRect(x, 54, 2, 1);
    }

    // Campfire at base (orange+yellow flickering pixels)
    gfx.fillStyle(0xFF6B35);
    gfx.fillRect(10, 88, 6, 4);
    gfx.fillStyle(0xFFAA00);
    gfx.fillRect(11, 85, 4, 4);
    gfx.fillStyle(0xFFDD44);
    gfx.fillRect(12, 83, 2, 3);
    gfx.fillStyle(0xFF4400);
    gfx.fillRect(13, 81, 1, 3);
    // Fire logs
    gfx.fillStyle(0x4A3020);
    gfx.fillRect(8, 91, 10, 2);
    gfx.fillRect(9, 90, 8, 2);
    // Embers
    gfx.fillStyle(0xFF6600, 0.6);
    gfx.fillRect(9, 92, 2, 1);
    gfx.fillRect(14, 93, 1, 1);

    // Bone pile to one side
    gfx.fillStyle(0xF5E6C8);
    gfx.fillRect(48, 88, 8, 3);
    gfx.fillRect(50, 86, 6, 3);
    gfx.fillRect(52, 84, 4, 3);
    // Individual bones
    gfx.fillRect(47, 91, 4, 1);
    gfx.fillRect(54, 92, 5, 1);
    gfx.fillRect(49, 93, 3, 1);
    // Skull
    gfx.fillRect(50, 82, 4, 4);
    gfx.fillStyle(0x3D2B1F);
    gfx.fillRect(51, 83, 1, 1);
    gfx.fillRect(53, 83, 1, 1);

    // 5 natural rock ledges for turret slots
    gfx.fillStyle(0x7A7060);
    gfx.fillRect(0, 36, 10, 4);   // Ledge 1 (left top)
    gfx.fillRect(54, 38, 10, 4);  // Ledge 2 (right top)
    gfx.fillRect(0, 52, 8, 4);    // Ledge 3 (left mid)
    gfx.fillRect(56, 54, 8, 4);   // Ledge 4 (right mid)
    gfx.fillRect(0, 70, 9, 4);    // Ledge 5 (left low)
  }

  // ─── AGE 2: BRONZE ZIGGURAT ──────────────────────────────────
  // 3-tiered stepped pyramid, mud-brick texture, copper-tipped flag pole,
  // ramp entrance. Primary color: sandy gold #DEB887.
  private drawBronzeZiggurat(gfx: Phaser.GameObjects.Graphics): void {
    // Tier 1 (base, largest)
    gfx.fillStyle(0xDEB887);
    gfx.fillRect(2, 65, 60, 35);
    // Tier 2 (middle)
    gfx.fillStyle(0xD4A86A);
    gfx.fillRect(10, 40, 44, 28);
    // Tier 3 (top)
    gfx.fillStyle(0xC89850);
    gfx.fillRect(18, 18, 28, 25);

    // Mud-brick texture: subtle horizontal mortar lines
    gfx.fillStyle(0xBFA070, 0.3);
    for (let y = 68; y < 98; y += 5) {
      gfx.fillRect(3, y, 58, 1);
    }
    // Offset brick pattern
    gfx.fillStyle(0xC0A060, 0.2);
    for (let y = 70; y < 98; y += 5) {
      for (let x = 4; x < 60; x += 10) {
        gfx.fillRect(x + ((y % 10 === 0) ? 5 : 0), y, 1, 4);
      }
    }
    // Tier 2 brick lines
    for (let y = 43; y < 66; y += 5) {
      gfx.fillStyle(0xB89050, 0.3);
      gfx.fillRect(11, y, 42, 1);
    }
    // Tier 3 brick lines
    for (let y = 21; y < 42; y += 5) {
      gfx.fillStyle(0xA88040, 0.3);
      gfx.fillRect(19, y, 26, 1);
    }

    // Tier edge trims (bronze)
    gfx.fillStyle(0xCD853F);
    gfx.fillRect(2, 65, 60, 2);
    gfx.fillRect(10, 40, 44, 2);
    gfx.fillRect(18, 18, 28, 2);

    // Ramp entrance on front face
    gfx.fillStyle(0xC4985A);
    gfx.fillRect(26, 65, 12, 35);
    // Ramp side shadows
    gfx.fillStyle(0xA88040, 0.4);
    gfx.fillRect(26, 65, 2, 35);
    gfx.fillRect(36, 65, 2, 35);

    // Door at top of ramp
    gfx.fillStyle(0x553322);
    gfx.fillRect(28, 70, 8, 14);
    // Door frame bronze
    gfx.fillStyle(0xCD853F);
    gfx.fillRect(27, 69, 10, 1);
    gfx.fillRect(27, 70, 1, 14);
    gfx.fillRect(36, 70, 1, 14);

    // Copper-tipped flag pole on top
    gfx.fillStyle(0x8B4513);
    gfx.fillRect(31, 4, 2, 16);
    // Copper tip
    gfx.fillStyle(0xCD853F);
    gfx.fillRect(30, 2, 4, 3);
    gfx.fillRect(31, 1, 2, 2);
    // Flag
    gfx.fillStyle(0xCC2222);
    gfx.fillRect(33, 5, 7, 5);
    gfx.fillStyle(0xAA1111);
    gfx.fillRect(33, 8, 7, 2);

    // Windows on tier 2
    gfx.fillStyle(0x553322);
    gfx.fillRect(14, 48, 4, 5);
    gfx.fillRect(46, 48, 4, 5);

    // Turret platforms on each tier (5 slots)
    gfx.fillStyle(0xC89850);
    gfx.fillRect(0, 72, 8, 4);    // Base left
    gfx.fillRect(56, 72, 8, 4);   // Base right
    gfx.fillRect(6, 46, 8, 3);    // Mid left
    gfx.fillRect(50, 46, 8, 3);   // Mid right
    gfx.fillRect(16, 22, 6, 3);   // Top
  }

  // ─── AGE 3: CLASSICAL TEMPLE ──────────────────────────────────
  // 4 white marble columns, triangular pediment, steps at base,
  // red door, olive wreath detail, laurel green accents.
  private drawClassicalTemple(gfx: Phaser.GameObjects.Graphics): void {
    // Steps at base (3 steps)
    gfx.fillStyle(0xD8D0C0);
    gfx.fillRect(2, 90, 60, 10);
    gfx.fillStyle(0xDDD5C5);
    gfx.fillRect(5, 85, 54, 7);
    gfx.fillStyle(0xE2DAC8);
    gfx.fillRect(8, 80, 48, 7);

    // Main structure body
    gfx.fillStyle(0xE8E0D0);
    gfx.fillRect(10, 30, 44, 52);

    // 4 white marble columns
    for (let i = 0; i < 4; i++) {
      const cx = 14 + i * 11;
      // Column shaft
      gfx.fillStyle(0xE8E0D0);
      gfx.fillRect(cx, 34, 4, 44);
      // Column highlight (marble veining)
      gfx.fillStyle(0xF0E8D8, 0.6);
      gfx.fillRect(cx + 1, 34, 1, 44);
      // Column shadow
      gfx.fillStyle(0xD0C8B8, 0.5);
      gfx.fillRect(cx + 3, 34, 1, 44);
      // Capital (Ionic style — wider top)
      gfx.fillStyle(0xD8D0C0);
      gfx.fillRect(cx - 1, 32, 6, 3);
      gfx.fillStyle(0xCCC4B4);
      gfx.fillRect(cx - 2, 30, 8, 3);
      // Base
      gfx.fillStyle(0xD8D0C0);
      gfx.fillRect(cx - 1, 76, 6, 4);
    }

    // Triangular pediment on top
    gfx.fillStyle(0xDDD5C5);
    gfx.fillRect(8, 28, 48, 4);
    gfx.fillStyle(0xD8D0C0);
    gfx.fillRect(12, 24, 40, 5);
    gfx.fillRect(16, 20, 32, 5);
    gfx.fillRect(20, 16, 24, 5);
    gfx.fillRect(24, 12, 16, 5);
    gfx.fillRect(28, 9, 8, 4);
    gfx.fillRect(30, 7, 4, 3);
    // Pediment gold trim line
    gfx.fillStyle(0xB8860B);
    gfx.fillRect(8, 28, 48, 1);

    // Red door between center columns
    gfx.fillStyle(0xC41E3A);
    gfx.fillRect(24, 55, 16, 25);
    // Door frame
    gfx.fillStyle(0x6B5B4A);
    gfx.fillRect(23, 53, 18, 2);
    gfx.fillRect(23, 55, 1, 25);
    gfx.fillRect(40, 55, 1, 25);
    // Door panels
    gfx.fillStyle(0xA01830, 0.4);
    gfx.fillRect(31, 55, 2, 25);

    // Olive wreath detail above door
    gfx.fillStyle(0x4A6741);
    gfx.fillRect(27, 48, 10, 2);
    gfx.fillRect(26, 49, 2, 3);
    gfx.fillRect(36, 49, 2, 3);
    gfx.fillRect(27, 52, 10, 1);
    // Wreath center (gold ribbon)
    gfx.fillStyle(0xB8860B);
    gfx.fillRect(31, 48, 2, 5);

    // Laurel green accents on pediment
    gfx.fillStyle(0x4A6741);
    gfx.fillRect(22, 22, 3, 2);
    gfx.fillRect(39, 22, 3, 2);

    // Turret slots between columns (5 slots)
    gfx.fillStyle(0xD0C8B8);
    gfx.fillRect(10, 36, 8, 3);   // Left outer
    gfx.fillRect(46, 36, 8, 3);   // Right outer
    gfx.fillRect(10, 58, 8, 3);   // Left lower
    gfx.fillRect(46, 58, 8, 3);   // Right lower
    gfx.fillRect(28, 14, 8, 3);   // Pediment top
  }

  // ─── AGE 4: MEDIEVAL CASTLE ───────────────────────────────────
  // Stone block texture (grey #808080 with darker mortar lines),
  // 4 crenellations, central tower, wooden gate, red banner, arrow slits.
  private drawMedievalCastle(gfx: Phaser.GameObjects.Graphics): void {
    // Main keep wall
    gfx.fillStyle(0x808080);
    gfx.fillRect(8, 30, 48, 70);
    // Left tower
    gfx.fillStyle(0x757575);
    gfx.fillRect(2, 20, 14, 80);
    // Right tower
    gfx.fillRect(48, 20, 14, 80);

    // Central tower rising above
    gfx.fillStyle(0x888888);
    gfx.fillRect(22, 10, 20, 25);
    // Tower roof (pointed)
    gfx.fillStyle(0x555555);
    gfx.fillRect(24, 6, 16, 5);
    gfx.fillRect(26, 3, 12, 4);
    gfx.fillRect(28, 1, 8, 3);
    gfx.fillRect(30, 0, 4, 2);

    // 4 crenellations (square notches) on main wall top
    gfx.fillStyle(0x909090);
    gfx.fillRect(10, 27, 5, 5);
    gfx.fillRect(20, 27, 5, 5);
    gfx.fillRect(39, 27, 5, 5);
    gfx.fillRect(49, 27, 5, 5);
    // Tower top crenellations
    gfx.fillRect(2, 17, 4, 5);
    gfx.fillRect(8, 17, 4, 5);
    gfx.fillRect(50, 17, 4, 5);
    gfx.fillRect(56, 17, 4, 5);

    // Stone block texture (mortar lines)
    gfx.fillStyle(0x666666, 0.35);
    for (let y = 33; y < 98; y += 6) {
      gfx.fillRect(9, y, 46, 1);
      const offset = (y % 12 === 0) ? 0 : 5;
      for (let x = 10 + offset; x < 54; x += 10) {
        gfx.fillRect(x, y - 5, 1, 5);
      }
    }
    // Tower mortar
    for (let y = 22; y < 100; y += 6) {
      gfx.fillRect(3, y, 12, 1);
      gfx.fillRect(49, y, 12, 1);
    }

    // Wooden gate (#654321) at base
    gfx.fillStyle(0x654321);
    gfx.fillRect(22, 62, 20, 38);
    // Gate arch
    gfx.fillStyle(0x707070);
    gfx.fillRect(22, 58, 20, 5);
    gfx.fillRect(24, 55, 16, 4);
    gfx.fillRect(26, 53, 12, 3);
    // Portcullis bars
    gfx.fillStyle(0x444444);
    for (let y = 64; y < 98; y += 5) {
      gfx.fillRect(24, y, 16, 1);
    }
    for (let x = 26; x < 40; x += 4) {
      gfx.fillRect(x, 64, 1, 34);
    }
    // Gate iron bands
    gfx.fillStyle(0x555555);
    gfx.fillRect(22, 68, 20, 2);
    gfx.fillRect(22, 80, 20, 2);

    // Red banner hanging from central tower
    gfx.fillStyle(0x8B0000);
    gfx.fillRect(34, 12, 2, 16);
    gfx.fillStyle(0xCC2222);
    gfx.fillRect(36, 13, 8, 10);
    gfx.fillStyle(0xAA1818);
    gfx.fillRect(36, 21, 6, 3);
    gfx.fillRect(36, 23, 4, 2);
    // Banner emblem (simple cross)
    gfx.fillStyle(0xDAA520);
    gfx.fillRect(39, 14, 2, 8);
    gfx.fillRect(37, 17, 6, 2);

    // Arrow slits in walls
    gfx.fillStyle(0x333333);
    gfx.fillRect(13, 40, 2, 6);
    gfx.fillRect(49, 40, 2, 6);
    gfx.fillRect(13, 60, 2, 6);
    gfx.fillRect(49, 60, 2, 6);
    gfx.fillRect(30, 36, 2, 5);
    gfx.fillRect(30, 16, 2, 5);

    // Turret slots in crenellation positions
    gfx.fillStyle(0x858585);
    gfx.fillRect(0, 24, 8, 3);   // Left tower top
    gfx.fillRect(56, 24, 8, 3);  // Right tower top
    gfx.fillRect(0, 50, 6, 3);   // Left mid
    gfx.fillRect(58, 50, 6, 3);  // Right mid
    gfx.fillRect(26, 8, 12, 3);  // Central tower top
  }

  // ─── AGE 5: GUNPOWDER STAR FORT ──────────────────────────────
  // Angled bastion walls (V-shaped protrusions), iron-reinforced gate,
  // cannon embrasures, navy blue flag, earthwork ramparts.
  private drawGunpowderStarFort(gfx: Phaser.GameObjects.Graphics): void {
    // Main fort body
    gfx.fillStyle(0x888877);
    gfx.fillRect(8, 30, 48, 65);

    // Angled bastion walls (V-shaped protrusions on sides)
    // Left bastion
    gfx.fillStyle(0x7A7A6A);
    gfx.fillRect(0, 42, 12, 30);
    gfx.fillRect(0, 38, 8, 6);
    gfx.fillRect(0, 70, 8, 6);
    // Right bastion
    gfx.fillRect(52, 42, 12, 30);
    gfx.fillRect(56, 38, 8, 6);
    gfx.fillRect(56, 70, 8, 6);
    // V-shaped protrusion tips
    gfx.fillStyle(0x6E6E5E);
    gfx.fillRect(0, 50, 4, 14);
    gfx.fillRect(60, 50, 4, 14);

    // Earthwork ramparts (sloped ground)
    gfx.fillStyle(0x8B8060);
    gfx.fillRect(4, 90, 56, 10);
    gfx.fillRect(2, 92, 60, 8);
    // Rampart top
    gfx.fillStyle(0x9A9070);
    gfx.fillRect(8, 28, 48, 4);

    // Wall texture (stone)
    gfx.fillStyle(0x777766, 0.3);
    for (let y = 34; y < 92; y += 6) {
      gfx.fillRect(9, y, 46, 1);
    }

    // Building inside fort
    gfx.fillStyle(0xAA9977);
    gfx.fillRect(16, 36, 32, 30);
    // Roof
    gfx.fillStyle(0x886644);
    gfx.fillRect(14, 32, 36, 6);
    gfx.fillRect(18, 28, 28, 5);

    // Iron-reinforced gate
    gfx.fillStyle(0x555555);
    gfx.fillRect(24, 66, 16, 24);
    // Iron bands
    gfx.fillStyle(0x444444);
    gfx.fillRect(24, 70, 16, 2);
    gfx.fillRect(24, 78, 16, 2);
    gfx.fillRect(24, 86, 16, 2);
    // Iron studs
    gfx.fillStyle(0x666666);
    gfx.fillRect(26, 68, 2, 2);
    gfx.fillRect(36, 68, 2, 2);
    gfx.fillRect(26, 82, 2, 2);
    gfx.fillRect(36, 82, 2, 2);

    // Cannon embrasures (dark rectangles in walls)
    gfx.fillStyle(0x222222);
    gfx.fillRect(1, 48, 6, 3);
    gfx.fillRect(1, 60, 6, 3);
    gfx.fillRect(57, 48, 6, 3);
    gfx.fillRect(57, 60, 6, 3);
    // Cannon barrels poking out
    gfx.fillStyle(0x333333);
    gfx.fillRect(0, 49, 3, 1);
    gfx.fillRect(0, 61, 3, 1);
    gfx.fillRect(61, 49, 3, 1);
    gfx.fillRect(61, 61, 3, 1);

    // Navy blue (#2C3E50) flag
    gfx.fillStyle(0x654321);
    gfx.fillRect(31, 14, 2, 16);
    gfx.fillStyle(0x2C3E50);
    gfx.fillRect(33, 15, 8, 6);
    gfx.fillStyle(0x1A2C3E);
    gfx.fillRect(33, 19, 6, 2);

    // Windows
    gfx.fillStyle(0x553322);
    gfx.fillRect(20, 42, 4, 5);
    gfx.fillRect(40, 42, 4, 5);
    gfx.fillRect(30, 38, 4, 5);

    // Turret embrasure slots (5)
    gfx.fillStyle(0x8A8A7A);
    gfx.fillRect(0, 44, 6, 3);   // Left bastion upper
    gfx.fillRect(58, 44, 6, 3);  // Right bastion upper
    gfx.fillRect(0, 64, 6, 3);   // Left bastion lower
    gfx.fillRect(58, 64, 6, 3);  // Right bastion lower
    gfx.fillRect(22, 28, 20, 3); // Top rampart center
  }

  // ─── AGE 6: INDUSTRIAL FACTORY ────────────────────────────────
  // Red brick (#8B4513) walls with mortar lines, 2 smokestacks,
  // large gear above door, windows with amber glow, metal door.
  private drawIndustrialFactory(gfx: Phaser.GameObjects.Graphics): void {
    // Main building — red brick walls
    gfx.fillStyle(0x8B4513);
    gfx.fillRect(6, 32, 52, 68);

    // Brick mortar lines
    gfx.fillStyle(0x7A3810, 0.4);
    for (let y = 35; y < 98; y += 4) {
      gfx.fillRect(7, y, 50, 1);
      const offset = (y % 8 === 0) ? 0 : 4;
      for (let x = 8 + offset; x < 56; x += 8) {
        gfx.fillRect(x, y - 3, 1, 3);
      }
    }

    // 2 smokestacks on roof (tall #2C2C2C cylinders)
    // Smokestack 1 (left)
    gfx.fillStyle(0x2C2C2C);
    gfx.fillRect(10, 4, 8, 30);
    gfx.fillStyle(0x3A3A3A);
    gfx.fillRect(9, 2, 10, 4);
    // Stack bands
    gfx.fillStyle(0x444444);
    gfx.fillRect(10, 10, 8, 2);
    gfx.fillRect(10, 20, 8, 2);
    // Smoke puffs
    gfx.fillStyle(0x888888, 0.5);
    gfx.fillRect(11, 0, 6, 3);
    gfx.fillStyle(0xAAAAAA, 0.3);
    gfx.fillRect(9, 0, 4, 2);

    // Smokestack 2 (right)
    gfx.fillStyle(0x2C2C2C);
    gfx.fillRect(46, 8, 8, 26);
    gfx.fillStyle(0x3A3A3A);
    gfx.fillRect(45, 6, 10, 4);
    gfx.fillStyle(0x444444);
    gfx.fillRect(46, 14, 8, 2);
    gfx.fillRect(46, 22, 8, 2);
    gfx.fillStyle(0x888888, 0.4);
    gfx.fillRect(47, 3, 5, 4);
    gfx.fillStyle(0xAAAAAA, 0.3);
    gfx.fillRect(49, 1, 3, 3);

    // Roof
    gfx.fillStyle(0x555555);
    gfx.fillRect(4, 30, 56, 4);

    // Large gear (#808080) above door
    gfx.fillStyle(0x808080);
    gfx.fillRect(22, 42, 10, 10);
    // Gear teeth
    gfx.fillRect(21, 44, 1, 6);
    gfx.fillRect(32, 44, 1, 6);
    gfx.fillRect(24, 41, 6, 1);
    gfx.fillRect(24, 52, 6, 1);
    // Gear inner ring
    gfx.fillStyle(0x666666);
    gfx.fillRect(24, 44, 6, 6);
    // Gear center axle
    gfx.fillStyle(0x888888);
    gfx.fillRect(26, 46, 2, 2);
    // Small secondary gear
    gfx.fillStyle(0x808080);
    gfx.fillRect(34, 46, 6, 6);
    gfx.fillStyle(0x666666);
    gfx.fillRect(35, 47, 4, 4);
    gfx.fillStyle(0x888888);
    gfx.fillRect(36, 48, 2, 2);

    // Windows with amber (#D4A017) glow
    gfx.fillStyle(0xD4A017, 0.6);
    gfx.fillRect(10, 56, 8, 8);
    gfx.fillRect(10, 72, 8, 8);
    // Window frames (dark)
    gfx.fillStyle(0x333333);
    gfx.fillRect(13, 56, 2, 8);
    gfx.fillRect(10, 60, 8, 1);
    gfx.fillRect(13, 72, 2, 8);
    gfx.fillRect(10, 76, 8, 1);
    // Window sills
    gfx.fillRect(9, 64, 10, 1);
    gfx.fillRect(9, 80, 10, 1);

    // Metal door
    gfx.fillStyle(0x444444);
    gfx.fillRect(24, 72, 16, 28);
    // Door center seam
    gfx.fillStyle(0x333333);
    gfx.fillRect(31, 72, 2, 28);
    // Door rivets
    gfx.fillStyle(0x666666);
    gfx.fillRect(26, 76, 2, 2);
    gfx.fillRect(36, 76, 2, 2);
    gfx.fillRect(26, 88, 2, 2);
    gfx.fillRect(36, 88, 2, 2);
    // Door handle
    gfx.fillStyle(0x888888);
    gfx.fillRect(28, 84, 3, 3);

    // Pipes running along side
    gfx.fillStyle(0x808080);
    gfx.fillRect(42, 42, 2, 30);
    gfx.fillRect(42, 68, 14, 2);
    gfx.fillRect(54, 60, 2, 10);
    // Pipe joints
    gfx.fillStyle(0x999999);
    gfx.fillRect(41, 42, 4, 2);
    gfx.fillRect(41, 68, 4, 2);

    // Steam vent
    gfx.fillStyle(0xDDDDDD, 0.3);
    gfx.fillRect(56, 58, 3, 3);
    gfx.fillRect(58, 56, 2, 2);

    // Turret slots on rooftop, beside smokestacks (5)
    gfx.fillStyle(0x666666);
    gfx.fillRect(4, 28, 8, 3);   // Left roof
    gfx.fillRect(52, 28, 8, 3);  // Right roof
    gfx.fillRect(20, 28, 8, 3);  // Center roof
    gfx.fillRect(4, 52, 6, 3);   // Left wall
    gfx.fillRect(54, 52, 6, 3);  // Right wall
  }

  // ─── AGE 7: MODERN BUNKER ────────────────────────────────────
  // Thick concrete (#808080) walls, flat roof, sandbag wall,
  // radar dish, communication antenna, camouflage netting.
  private drawModernBunker(gfx: Phaser.GameObjects.Graphics): void {
    // Main bunker — thick concrete walls
    gfx.fillStyle(0x808080);
    gfx.fillRect(6, 38, 52, 62);
    // Flat reinforced roof
    gfx.fillStyle(0x8A8A8A);
    gfx.fillRect(4, 34, 56, 6);
    // Roof edge detail
    gfx.fillStyle(0x6E6E6E);
    gfx.fillRect(4, 34, 56, 2);

    // Concrete texture — subtle panel lines
    gfx.fillStyle(0x6E6E6E, 0.25);
    gfx.fillRect(6, 50, 52, 1);
    gfx.fillRect(6, 65, 52, 1);
    gfx.fillRect(6, 80, 52, 1);
    gfx.fillRect(32, 38, 1, 62);

    // Sandbag wall (#C0B080) in front
    gfx.fillStyle(0xC0B080);
    // Bottom row
    gfx.fillRect(8, 88, 8, 5);
    gfx.fillRect(17, 88, 8, 5);
    gfx.fillRect(26, 88, 8, 5);
    gfx.fillRect(35, 88, 8, 5);
    gfx.fillRect(44, 88, 8, 5);
    // Top row (staggered)
    gfx.fillStyle(0xB5A575);
    gfx.fillRect(12, 84, 8, 5);
    gfx.fillRect(22, 84, 8, 5);
    gfx.fillRect(32, 84, 8, 5);
    gfx.fillRect(42, 84, 8, 5);
    // Sandbag shadows
    gfx.fillStyle(0xA09060, 0.3);
    gfx.fillRect(8, 92, 44, 1);

    // Radar dish on roof
    gfx.fillStyle(0xCCCCCC);
    gfx.fillRect(38, 16, 16, 8);
    gfx.fillRect(42, 12, 8, 5);
    // Radar arm
    gfx.fillStyle(0x888888);
    gfx.fillRect(44, 24, 2, 12);
    // Radar dish detail
    gfx.fillStyle(0xAAAAAA);
    gfx.fillRect(40, 18, 12, 1);

    // Communication antenna (thin vertical line)
    gfx.fillStyle(0x888888);
    gfx.fillRect(14, 8, 1, 28);
    gfx.fillRect(18, 12, 1, 24);
    // Antenna crossbars
    gfx.fillRect(12, 14, 5, 1);
    gfx.fillRect(13, 20, 3, 1);
    // Red tip lights
    gfx.fillStyle(0xFF0000);
    gfx.fillRect(14, 7, 1, 2);
    gfx.fillRect(18, 11, 1, 2);

    // Slit windows (observation)
    gfx.fillStyle(0x334433);
    gfx.fillRect(10, 48, 14, 3);
    gfx.fillRect(40, 48, 14, 3);
    gfx.fillRect(10, 66, 14, 3);
    gfx.fillRect(40, 66, 14, 3);

    // Heavy blast door
    gfx.fillStyle(0x5A5A5A);
    gfx.fillRect(22, 60, 20, 28);
    // Door reinforcement bars
    gfx.fillStyle(0x4A4A4A);
    gfx.fillRect(22, 68, 20, 2);
    gfx.fillRect(22, 78, 20, 2);
    // Door handle/wheel
    gfx.fillStyle(0xAAAAAA);
    gfx.fillRect(26, 72, 4, 4);
    gfx.fillStyle(0x999999);
    gfx.fillRect(27, 73, 2, 2);

    // Camouflage netting suggestion (semi-transparent patches)
    gfx.fillStyle(0x556B2F, 0.2);
    gfx.fillRect(8, 42, 12, 8);
    gfx.fillRect(28, 44, 10, 6);
    gfx.fillRect(44, 56, 12, 8);
    gfx.fillStyle(0x808000, 0.15);
    gfx.fillRect(14, 54, 8, 6);
    gfx.fillRect(38, 40, 8, 6);

    // Blast marks on walls
    gfx.fillStyle(0x555555, 0.3);
    gfx.fillRect(8, 44, 4, 3);
    gfx.fillRect(52, 58, 4, 3);

    // Barbed wire on roof edge
    gfx.fillStyle(0x888888);
    gfx.fillRect(4, 33, 56, 1);
    for (let i = 0; i < 11; i++) {
      gfx.fillRect(6 + i * 5, 32, 2, 2);
    }

    // Turret slots behind sandbags (5)
    gfx.fillStyle(0x8A8A8A);
    gfx.fillRect(4, 36, 6, 3);   // Left roof
    gfx.fillRect(54, 36, 6, 3);  // Right roof
    gfx.fillRect(26, 36, 12, 3); // Center roof
    gfx.fillRect(6, 82, 6, 3);   // Left behind sandbag
    gfx.fillRect(52, 82, 6, 3);  // Right behind sandbag
  }

  // ─── AGE 8: FUTURE CRYSTAL SPIRE ─────────────────────────────
  // Pointed tower shape, #1A1A2E dark body with #00CED1 cyan edge glows,
  // energy shield bubble (transparent overlay), floating ring elements,
  // holographic entrance.
  private drawFutureCrystalSpire(gfx: Phaser.GameObjects.Graphics): void {
    // Energy shield bubble (transparent circle overlay, alpha 0.15)
    gfx.fillStyle(0x00CED1, 0.15);
    gfx.fillRect(2, 8, 60, 88);
    // Shield border glow
    gfx.fillStyle(0x00CED1, 0.3);
    gfx.fillRect(2, 8, 2, 88);
    gfx.fillRect(60, 8, 2, 88);
    gfx.fillRect(2, 8, 60, 2);
    gfx.fillRect(2, 94, 60, 2);
    // Shield corner intensification
    gfx.fillStyle(0x00CED1, 0.4);
    gfx.fillRect(2, 8, 4, 4);
    gfx.fillRect(58, 8, 4, 4);
    gfx.fillRect(2, 92, 4, 4);
    gfx.fillRect(58, 92, 4, 4);

    // Main spire body — pointed tower shape (#1A1A2E)
    gfx.fillStyle(0x1A1A2E);
    gfx.fillRect(14, 28, 36, 68);
    // Tower narrows toward top
    gfx.fillRect(18, 18, 28, 12);
    gfx.fillRect(22, 10, 20, 10);
    gfx.fillRect(26, 4, 12, 8);
    gfx.fillRect(28, 1, 8, 5);
    gfx.fillRect(30, 0, 4, 3);

    // Cyan edge glows (#00CED1) along body edges
    gfx.fillStyle(0x00CED1);
    gfx.fillRect(14, 28, 1, 68);
    gfx.fillRect(49, 28, 1, 68);
    gfx.fillRect(18, 18, 1, 12);
    gfx.fillRect(45, 18, 1, 12);
    gfx.fillRect(22, 10, 1, 10);
    gfx.fillRect(41, 10, 1, 10);
    gfx.fillRect(26, 4, 1, 8);
    gfx.fillRect(37, 4, 1, 8);
    // Top glow
    gfx.fillStyle(0x44FFFF);
    gfx.fillRect(30, 0, 4, 2);

    // Floating ring elements around mid-height
    gfx.fillStyle(0x00CED1, 0.7);
    // Ring 1 (left)
    gfx.fillRect(6, 44, 6, 2);
    gfx.fillRect(5, 42, 2, 6);
    gfx.fillRect(11, 42, 2, 6);
    // Ring 2 (right)
    gfx.fillRect(52, 48, 6, 2);
    gfx.fillRect(51, 46, 2, 6);
    gfx.fillRect(57, 46, 2, 6);
    // Ring 3 (smaller, left lower)
    gfx.fillStyle(0x00CED1, 0.5);
    gfx.fillRect(8, 64, 4, 2);
    gfx.fillRect(7, 62, 2, 6);
    // Ring 4 (smaller, right lower)
    gfx.fillRect(52, 68, 4, 2);
    gfx.fillRect(55, 66, 2, 6);

    // Holographic entrance (glowing doorway)
    gfx.fillStyle(0x00CED1, 0.4);
    gfx.fillRect(24, 68, 16, 28);
    gfx.fillStyle(0x44FFFF, 0.3);
    gfx.fillRect(26, 70, 12, 24);
    gfx.fillStyle(0x88FFFF, 0.15);
    gfx.fillRect(28, 72, 8, 20);
    // Holographic scan lines
    gfx.fillStyle(0x00CED1, 0.2);
    for (let y = 70; y < 94; y += 4) {
      gfx.fillRect(25, y, 14, 1);
    }

    // Energy core (glowing center crystal)
    gfx.fillStyle(0x00CED1);
    gfx.fillRect(24, 38, 16, 16);
    gfx.fillStyle(0x44FFFF);
    gfx.fillRect(26, 40, 12, 12);
    gfx.fillStyle(0x88FFFF);
    gfx.fillRect(28, 42, 8, 8);
    gfx.fillStyle(0xCCFFFF);
    gfx.fillRect(30, 44, 4, 4);

    // Horizontal energy band lines across body
    gfx.fillStyle(0x00CED1, 0.5);
    gfx.fillRect(14, 30, 36, 1);
    gfx.fillRect(14, 58, 36, 1);
    gfx.fillRect(18, 20, 28, 1);
    gfx.fillRect(14, 78, 36, 1);

    // Turret slots projected from spire surface (5)
    gfx.fillStyle(0x00CED1, 0.6);
    gfx.fillRect(6, 34, 8, 3);   // Left upper
    gfx.fillRect(50, 34, 8, 3);  // Right upper
    gfx.fillRect(6, 56, 8, 3);   // Left mid
    gfx.fillRect(50, 56, 8, 3);  // Right mid
    gfx.fillRect(24, 10, 16, 3); // Top
  }

  // ─── DAMAGE OVERLAYS ──────────────────────────────────────────
  // Level 1 (75-51%): 2-3 crack lines (dark #333 strokes)
  // Level 2 (50-26%): Larger cracks + missing chunk + fire spot
  // Level 3 (25-1%): Heavy damage, multiple fires, crumbling
  private drawDamage(gfx: Phaser.GameObjects.Graphics, level: number): void {
    if (level >= 1) {
      // 2-3 crack lines
      gfx.lineStyle(1, 0x333333, 0.8);
      gfx.beginPath();
      gfx.moveTo(12, 22);
      gfx.lineTo(18, 34);
      gfx.lineTo(15, 44);
      gfx.strokePath();

      gfx.beginPath();
      gfx.moveTo(48, 28);
      gfx.lineTo(42, 38);
      gfx.lineTo(44, 48);
      gfx.strokePath();

      gfx.beginPath();
      gfx.moveTo(30, 18);
      gfx.lineTo(34, 30);
      gfx.strokePath();

      // Small debris on ground
      gfx.fillStyle(0x666666, 0.4);
      gfx.fillRect(10, 94, 3, 2);
      gfx.fillRect(50, 96, 4, 2);
    }

    if (level >= 2) {
      // Larger cracks
      gfx.lineStyle(2, 0x333333, 0.9);
      gfx.beginPath();
      gfx.moveTo(8, 40);
      gfx.lineTo(20, 50);
      gfx.lineTo(16, 65);
      gfx.lineTo(22, 78);
      gfx.strokePath();

      gfx.beginPath();
      gfx.moveTo(50, 35);
      gfx.lineTo(44, 55);
      gfx.lineTo(48, 70);
      gfx.strokePath();

      // Missing chunk (cut corner — top right)
      gfx.fillStyle(0x000000, 0.5);
      gfx.fillRect(52, 22, 10, 8);
      gfx.fillRect(54, 18, 8, 6);
      gfx.fillRect(56, 16, 6, 4);

      // Fire spot (orange pixels)
      gfx.fillStyle(0xFF6600, 0.6);
      gfx.fillRect(42, 34, 5, 6);
      gfx.fillStyle(0xFFAA00, 0.5);
      gfx.fillRect(43, 30, 3, 5);
      gfx.fillStyle(0xFFDD44, 0.4);
      gfx.fillRect(44, 28, 1, 3);

      // More debris
      gfx.fillStyle(0x555555, 0.5);
      gfx.fillRect(6, 92, 4, 3);
      gfx.fillRect(48, 94, 5, 2);
      gfx.fillRect(16, 96, 3, 2);
    }

    if (level >= 3) {
      // Heavy damage — large crack system
      gfx.lineStyle(2, 0x222222, 1.0);
      gfx.beginPath();
      gfx.moveTo(32, 12);
      gfx.lineTo(26, 30);
      gfx.lineTo(34, 50);
      gfx.lineTo(28, 70);
      gfx.lineTo(32, 88);
      gfx.strokePath();

      gfx.beginPath();
      gfx.moveTo(6, 50);
      gfx.lineTo(22, 52);
      gfx.lineTo(28, 60);
      gfx.strokePath();

      gfx.beginPath();
      gfx.moveTo(56, 45);
      gfx.lineTo(40, 48);
      gfx.lineTo(36, 56);
      gfx.strokePath();

      // Additional missing chunks
      gfx.fillStyle(0x000000, 0.5);
      gfx.fillRect(4, 24, 8, 6);
      gfx.fillRect(2, 28, 6, 4);

      // Multiple fires
      // Fire 1 (left upper)
      gfx.fillStyle(0xFF6600, 0.6);
      gfx.fillRect(14, 36, 4, 8);
      gfx.fillStyle(0xFFAA00, 0.5);
      gfx.fillRect(15, 32, 2, 5);
      gfx.fillStyle(0xFF4400, 0.4);
      gfx.fillRect(16, 30, 1, 3);

      // Fire 2 (right mid)
      gfx.fillStyle(0xFF6600, 0.6);
      gfx.fillRect(46, 54, 5, 7);
      gfx.fillStyle(0xFFAA00, 0.5);
      gfx.fillRect(47, 50, 3, 5);
      gfx.fillStyle(0xFFDD44, 0.4);
      gfx.fillRect(48, 48, 2, 3);

      // Fire 3 (center)
      gfx.fillStyle(0xFF6600, 0.5);
      gfx.fillRect(28, 68, 4, 6);
      gfx.fillStyle(0xFFAA00, 0.4);
      gfx.fillRect(29, 65, 2, 4);

      // Crumbling sections — debris pile at base
      gfx.fillStyle(0x555555, 0.6);
      gfx.fillRect(4, 90, 6, 5);
      gfx.fillRect(52, 92, 6, 4);
      gfx.fillRect(14, 94, 4, 3);
      gfx.fillRect(40, 96, 5, 2);
      gfx.fillRect(24, 95, 3, 3);
      // Loose rubble blocks
      gfx.fillStyle(0x666666, 0.5);
      gfx.fillRect(2, 94, 3, 3);
      gfx.fillRect(58, 94, 4, 3);
      gfx.fillRect(20, 97, 2, 2);
      gfx.fillRect(44, 97, 3, 2);
    }
  }
}
