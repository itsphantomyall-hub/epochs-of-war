import Phaser from 'phaser';

/**
 * TurretRenderer — Generates 16x16 pixel turret sprites for all 16 turrets.
 *
 * Each turret has 3 upgrade levels:
 *   Level 1: Base appearance
 *   Level 2: + reinforcement details (metal bands, extra plates)
 *   Level 3: + glow effects (fire/energy at barrel), visibly larger accents
 *
 * Generates textures: turret_{turretId}_{faction}_lvl{1-3}
 */

const TURRET_SIZE = 16;

export class TurretRenderer {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  generateAll(): void {
    const turretIds = [
      'rock_dropper', 'tar_pit',
      'arrow_slit', 'boiling_oil',
      'ballista', 'catapult',
      'repeating_crossbow', 'trebuchet_tower',
      'grape_shot_cannon', 'long_cannon',
      'gatling_tower', 'howitzer',
      'sam_turret', 'missile_launcher',
      'laser_grid', 'ion_cannon',
    ];

    for (const id of turretIds) {
      for (const faction of ['player', 'enemy'] as const) {
        for (let level = 1; level <= 3; level++) {
          const key = `turret_${id}_${faction}_lvl${level}`;
          if (this.scene.textures.exists(key)) continue;

          const gfx = this.scene.add.graphics();
          this.drawTurret(gfx, id, level);

          // Faction tint
          const tintColor = faction === 'player' ? 0x4488ff : 0xff4444;
          gfx.fillStyle(tintColor, 0.15);
          gfx.fillRect(0, 0, TURRET_SIZE, TURRET_SIZE);

          gfx.generateTexture(key, TURRET_SIZE, TURRET_SIZE);
          gfx.destroy();
        }

        // Also generate a default key without level suffix for backward compat
        const defaultKey = `turret_${id}_${faction}`;
        if (!this.scene.textures.exists(defaultKey)) {
          const gfx = this.scene.add.graphics();
          this.drawTurret(gfx, id, 1);
          const tintColor = faction === 'player' ? 0x4488ff : 0xff4444;
          gfx.fillStyle(tintColor, 0.15);
          gfx.fillRect(0, 0, TURRET_SIZE, TURRET_SIZE);
          gfx.generateTexture(defaultKey, TURRET_SIZE, TURRET_SIZE);
          gfx.destroy();
        }
      }
    }
  }

  getTextureKey(turretId: string, faction: 'player' | 'enemy', level: number = 1): string {
    return `turret_${turretId}_${faction}_lvl${level}`;
  }

  private drawTurret(gfx: Phaser.GameObjects.Graphics, id: string, level: number): void {
    switch (id) {
      case 'rock_dropper': this.drawRockDropper(gfx, level); break;
      case 'tar_pit': this.drawTarPit(gfx, level); break;
      case 'arrow_slit': this.drawArrowSlit(gfx, level); break;
      case 'boiling_oil': this.drawBoilingOil(gfx, level); break;
      case 'ballista': this.drawBallista(gfx, level); break;
      case 'catapult': this.drawCatapult(gfx, level); break;
      case 'repeating_crossbow': this.drawRepeatingCrossbow(gfx, level); break;
      case 'trebuchet_tower': this.drawTrebuchetTower(gfx, level); break;
      case 'grape_shot_cannon': this.drawGrapeShotCannon(gfx, level); break;
      case 'long_cannon': this.drawLongCannon(gfx, level); break;
      case 'gatling_tower': this.drawGatlingTower(gfx, level); break;
      case 'howitzer': this.drawHowitzer(gfx, level); break;
      case 'sam_turret': this.drawSamTurret(gfx, level); break;
      case 'missile_launcher': this.drawMissileLauncher(gfx, level); break;
      case 'laser_grid': this.drawLaserGrid(gfx, level); break;
      case 'ion_cannon': this.drawIonCannon(gfx, level); break;
    }
  }

  // ─── AGE 1: PREHISTORIC ────────────────────────────────────────

  // Rock Dropper: Pile of grey rocks on brown ledge, small wooden arm
  private drawRockDropper(gfx: Phaser.GameObjects.Graphics, level: number): void {
    // Brown ledge platform
    gfx.fillStyle(0x6B4226);
    gfx.fillRect(1, 10, 14, 6);
    // Wooden arm mechanism
    gfx.fillStyle(0x5A3520);
    gfx.fillRect(2, 3, 2, 8);
    gfx.fillRect(2, 3, 9, 2);
    // Pile of grey rocks
    gfx.fillStyle(0x888877);
    gfx.fillRect(5, 6, 4, 4);
    gfx.fillRect(7, 5, 4, 3);
    gfx.fillRect(3, 7, 4, 3);
    // Rock ready to drop
    gfx.fillStyle(0x999988);
    gfx.fillRect(9, 2, 3, 3);
    // Rock detail
    gfx.fillStyle(0x777766);
    gfx.fillRect(6, 7, 2, 2);

    if (level >= 2) {
      // Reinforced platform
      gfx.fillStyle(0x555555);
      gfx.fillRect(1, 10, 14, 1);
      gfx.fillRect(1, 15, 14, 1);
      // Extra rocks
      gfx.fillStyle(0x999988);
      gfx.fillRect(10, 5, 3, 3);
    }
    if (level >= 3) {
      // Glow on launching arm
      gfx.fillStyle(0xFF6600, 0.4);
      gfx.fillRect(1, 2, 3, 2);
      // Bigger rock pile
      gfx.fillStyle(0xAAAA99);
      gfx.fillRect(4, 4, 6, 2);
    }
  }

  // Tar Pit: Dark (#2C2C2C) pool with 2 brown bubbles
  private drawTarPit(gfx: Phaser.GameObjects.Graphics, level: number): void {
    // Stone rim
    gfx.fillStyle(0x888877);
    gfx.fillRect(1, 7, 14, 2);
    gfx.fillRect(1, 14, 14, 2);
    // Pit basin
    gfx.fillStyle(0x553322);
    gfx.fillRect(1, 9, 14, 7);
    // Dark tar pool (#2C2C2C)
    gfx.fillStyle(0x2C2C2C);
    gfx.fillRect(2, 9, 12, 5);
    // 2 brown bubbles
    gfx.fillStyle(0x4A3020);
    gfx.fillRect(4, 10, 3, 2);
    gfx.fillRect(9, 11, 2, 2);
    // Bubble highlight
    gfx.fillStyle(0x5A4030, 0.6);
    gfx.fillRect(5, 10, 1, 1);
    gfx.fillRect(10, 11, 1, 1);
    // Steam wisps
    gfx.fillStyle(0x888888, 0.4);
    gfx.fillRect(5, 6, 2, 3);
    gfx.fillRect(9, 5, 1, 3);

    if (level >= 2) {
      // Reinforced rim
      gfx.fillStyle(0x666655);
      gfx.fillRect(0, 7, 1, 9);
      gfx.fillRect(15, 7, 1, 9);
      // Extra bubble
      gfx.fillRect(7, 10, 2, 1);
    }
    if (level >= 3) {
      // Toxic glow
      gfx.fillStyle(0x44AA00, 0.3);
      gfx.fillRect(3, 9, 10, 1);
      // More steam
      gfx.fillStyle(0xAAAAAA, 0.3);
      gfx.fillRect(3, 4, 3, 3);
      gfx.fillRect(10, 3, 2, 3);
    }
  }

  // ─── AGE 2: BRONZE ────────────────────────────────────────────

  // Arrow Slit: Narrow vertical window in grey wall, arrow tip visible
  private drawArrowSlit(gfx: Phaser.GameObjects.Graphics, level: number): void {
    // Wall section (bronze age style)
    gfx.fillStyle(0xBB9955);
    gfx.fillRect(2, 2, 12, 14);
    // Wall texture
    gfx.fillStyle(0xAA8844, 0.3);
    gfx.fillRect(2, 6, 12, 1);
    gfx.fillRect(2, 10, 12, 1);
    // Narrow vertical window (arrow slit)
    gfx.fillStyle(0x222211);
    gfx.fillRect(7, 3, 2, 10);
    // Arrow tip visible in slit
    gfx.fillStyle(0xCCCCCC);
    gfx.fillRect(7, 6, 2, 1);
    gfx.fillRect(7, 5, 1, 1);
    gfx.fillRect(8, 5, 1, 1);
    // Bronze decorative trim
    gfx.fillStyle(0xCD853F);
    gfx.fillRect(2, 2, 12, 1);
    gfx.fillRect(2, 15, 12, 1);

    if (level >= 2) {
      // Metal reinforcement plates
      gfx.fillStyle(0xCD853F);
      gfx.fillRect(2, 2, 1, 14);
      gfx.fillRect(13, 2, 1, 14);
    }
    if (level >= 3) {
      // Glowing arrow
      gfx.fillStyle(0xFF6600, 0.5);
      gfx.fillRect(6, 4, 4, 1);
      gfx.fillStyle(0xFFAA00, 0.3);
      gfx.fillRect(6, 5, 1, 2);
      gfx.fillRect(9, 5, 1, 2);
    }
  }

  // Boiling Oil: Iron cauldron on legs over orange fire, dark liquid
  private drawBoilingOil(gfx: Phaser.GameObjects.Graphics, level: number): void {
    // Support legs/frame
    gfx.fillStyle(0x6B4226);
    gfx.fillRect(2, 5, 2, 10);
    gfx.fillRect(12, 5, 2, 10);
    // Iron cauldron
    gfx.fillStyle(0x444444);
    gfx.fillRect(3, 5, 10, 8);
    gfx.fillStyle(0x3A3A3A);
    gfx.fillRect(4, 6, 8, 6);
    // Dark liquid (oil)
    gfx.fillStyle(0x2C2C2C);
    gfx.fillRect(4, 7, 8, 4);
    // Heat steam/bubbles
    gfx.fillStyle(0xFFAA00, 0.4);
    gfx.fillRect(5, 4, 2, 2);
    gfx.fillRect(9, 3, 2, 3);
    // Fire below (orange)
    gfx.fillStyle(0xFF6600);
    gfx.fillRect(4, 13, 3, 2);
    gfx.fillRect(9, 13, 3, 2);
    gfx.fillStyle(0xFFAA00);
    gfx.fillRect(5, 12, 2, 2);
    gfx.fillRect(10, 12, 1, 2);

    if (level >= 2) {
      // Metal bands on cauldron
      gfx.fillStyle(0x666666);
      gfx.fillRect(3, 5, 10, 1);
      gfx.fillRect(3, 12, 10, 1);
    }
    if (level >= 3) {
      // Fiery glow
      gfx.fillStyle(0xFF4400, 0.4);
      gfx.fillRect(3, 11, 10, 2);
      // Boiling bubbles
      gfx.fillStyle(0xFFDD44, 0.3);
      gfx.fillRect(6, 3, 1, 2);
      gfx.fillRect(8, 2, 1, 2);
    }
  }

  // ─── AGE 3: CLASSICAL ─────────────────────────────────────────

  // Ballista: Wooden X-frame with horizontal bolt loaded
  private drawBallista(gfx: Phaser.GameObjects.Graphics, level: number): void {
    // Base frame
    gfx.fillStyle(0x6B4226);
    gfx.fillRect(2, 9, 12, 4);
    // Cross bow arms
    gfx.fillStyle(0x553322);
    gfx.fillRect(1, 6, 14, 2);
    // Bowstring
    gfx.fillStyle(0xDDCCAA);
    gfx.fillRect(1, 7, 1, 1);
    gfx.fillRect(14, 7, 1, 1);
    gfx.fillRect(3, 7, 1, 1);
    gfx.fillRect(12, 7, 1, 1);
    // Bolt (horizontal)
    gfx.fillStyle(0x8B4513);
    gfx.fillRect(5, 7, 8, 1);
    // Bolt tip (metal)
    gfx.fillStyle(0xCCCCCC);
    gfx.fillRect(12, 6, 3, 3);
    gfx.fillRect(14, 7, 2, 1);
    // Wheels
    gfx.fillStyle(0x553322);
    gfx.fillRect(3, 13, 3, 3);
    gfx.fillRect(10, 13, 3, 3);

    if (level >= 2) {
      // Metal reinforcement on frame
      gfx.fillStyle(0x808080);
      gfx.fillRect(2, 9, 12, 1);
      gfx.fillRect(7, 9, 2, 4);
    }
    if (level >= 3) {
      // Glowing bolt tip
      gfx.fillStyle(0xFFDD44, 0.5);
      gfx.fillRect(13, 5, 3, 5);
      // Enhanced frame
      gfx.fillStyle(0xCD853F);
      gfx.fillRect(1, 5, 14, 1);
    }
  }

  // Catapult: Wooden frame, raised arm with basket
  private drawCatapult(gfx: Phaser.GameObjects.Graphics, level: number): void {
    // Frame base
    gfx.fillStyle(0x6B4226);
    gfx.fillRect(2, 10, 12, 4);
    // A-frame supports
    gfx.fillStyle(0x5A3520);
    gfx.fillRect(8, 5, 4, 7);
    // Throwing arm (raised)
    gfx.fillStyle(0x7B5236);
    gfx.fillRect(3, 3, 2, 9);
    // Basket at arm end
    gfx.fillStyle(0x553322);
    gfx.fillRect(2, 2, 4, 3);
    // Boulder in basket
    gfx.fillStyle(0x999988);
    gfx.fillRect(3, 1, 2, 2);
    // Counterweight
    gfx.fillStyle(0x808080);
    gfx.fillRect(9, 4, 3, 3);
    // Rope/tension
    gfx.fillStyle(0xBBAA88);
    gfx.fillRect(10, 2, 1, 3);
    // Wheels
    gfx.fillStyle(0x553322);
    gfx.fillRect(2, 14, 3, 2);
    gfx.fillRect(11, 14, 3, 2);

    if (level >= 2) {
      // Metal bands
      gfx.fillStyle(0x808080);
      gfx.fillRect(2, 10, 12, 1);
      gfx.fillRect(8, 5, 1, 7);
    }
    if (level >= 3) {
      // Fire projectile glow
      gfx.fillStyle(0xFF6600, 0.5);
      gfx.fillRect(2, 0, 4, 2);
      gfx.fillStyle(0xFFAA00, 0.3);
      gfx.fillRect(1, 1, 2, 2);
    }
  }

  // ─── AGE 4: MEDIEVAL ──────────────────────────────────────────

  // Repeating Crossbow: Mechanical crossbow with visible gear, ammo box
  private drawRepeatingCrossbow(gfx: Phaser.GameObjects.Graphics, level: number): void {
    // Stone base
    gfx.fillStyle(0x888888);
    gfx.fillRect(2, 10, 12, 6);
    // Crossbow main body
    gfx.fillStyle(0x6B4226);
    gfx.fillRect(3, 5, 10, 5);
    // Bow arms
    gfx.fillStyle(0x553322);
    gfx.fillRect(1, 6, 14, 2);
    // Ammo box/magazine
    gfx.fillStyle(0x444444);
    gfx.fillRect(4, 2, 6, 4);
    // Visible bolts in magazine
    gfx.fillStyle(0xCCCCCC);
    gfx.fillRect(5, 3, 1, 2);
    gfx.fillRect(7, 3, 1, 2);
    gfx.fillRect(9, 3, 1, 2);
    // Gear mechanism (visible)
    gfx.fillStyle(0x808080);
    gfx.fillRect(10, 7, 3, 3);
    gfx.fillStyle(0x666666);
    gfx.fillRect(11, 8, 1, 1);

    if (level >= 2) {
      // Metal reinforcement plates
      gfx.fillStyle(0x808080);
      gfx.fillRect(1, 5, 1, 4);
      gfx.fillRect(14, 5, 1, 4);
      // Extra gear detail
      gfx.fillStyle(0x999999);
      gfx.fillRect(10, 6, 3, 1);
    }
    if (level >= 3) {
      // Glow on bolt tips
      gfx.fillStyle(0x4682B4, 0.4);
      gfx.fillRect(3, 2, 8, 1);
      // Enhanced mechanism
      gfx.fillStyle(0xDAA520);
      gfx.fillRect(11, 8, 1, 1);
    }
  }

  // Trebuchet Tower: Tall A-frame, long pivoting arm, counterweight
  private drawTrebuchetTower(gfx: Phaser.GameObjects.Graphics, level: number): void {
    // Tower base
    gfx.fillStyle(0x888888);
    gfx.fillRect(2, 8, 12, 8);
    // Tower top
    gfx.fillStyle(0x777777);
    gfx.fillRect(4, 4, 8, 5);
    // A-frame detail
    gfx.fillStyle(0x6B4226);
    gfx.fillRect(5, 3, 2, 6);
    gfx.fillRect(9, 3, 2, 6);
    // Long pivoting arm
    gfx.fillStyle(0x7B5236);
    gfx.fillRect(2, 2, 12, 2);
    // Counterweight (heavy)
    gfx.fillStyle(0x555555);
    gfx.fillRect(1, 0, 4, 3);
    // Sling basket at other end
    gfx.fillStyle(0x886644);
    gfx.fillRect(12, 0, 3, 2);
    // Boulder
    gfx.fillStyle(0x999988);
    gfx.fillRect(12, 0, 2, 2);
    // Battlements on tower
    gfx.fillStyle(0x999999);
    gfx.fillRect(3, 4, 2, 1);
    gfx.fillRect(7, 4, 2, 1);
    gfx.fillRect(11, 4, 2, 1);

    if (level >= 2) {
      // Metal banding
      gfx.fillStyle(0x808080);
      gfx.fillRect(2, 8, 12, 1);
      gfx.fillRect(4, 4, 8, 1);
      // Heavier counterweight
      gfx.fillStyle(0x444444);
      gfx.fillRect(0, 0, 5, 2);
    }
    if (level >= 3) {
      // Fire projectile
      gfx.fillStyle(0xFF6600, 0.5);
      gfx.fillRect(11, 0, 4, 2);
      gfx.fillStyle(0xFFAA00, 0.3);
      gfx.fillRect(14, 0, 2, 3);
    }
  }

  // ─── AGE 5: GUNPOWDER ─────────────────────────────────────────

  // Grape Shot: Wide stubby cannon mouth, iron on wood carriage
  private drawGrapeShotCannon(gfx: Phaser.GameObjects.Graphics, level: number): void {
    // Earthwork emplacement
    gfx.fillStyle(0x888877);
    gfx.fillRect(1, 10, 14, 6);
    // Wood carriage
    gfx.fillStyle(0x6B4226);
    gfx.fillRect(2, 8, 10, 3);
    // Stubby wide barrel (iron)
    gfx.fillStyle(0x555555);
    gfx.fillRect(4, 5, 8, 4);
    // Wide flared mouth
    gfx.fillStyle(0x444444);
    gfx.fillRect(10, 4, 4, 6);
    gfx.fillStyle(0x333333);
    gfx.fillRect(13, 4, 3, 6);
    // Wheels
    gfx.fillStyle(0x553322);
    gfx.fillRect(3, 11, 3, 3);
    gfx.fillRect(8, 11, 3, 3);
    // Wheel spokes
    gfx.fillStyle(0x443322);
    gfx.fillRect(4, 12, 1, 1);
    gfx.fillRect(9, 12, 1, 1);

    if (level >= 2) {
      // Iron reinforcement bands
      gfx.fillStyle(0x666666);
      gfx.fillRect(6, 5, 1, 4);
      gfx.fillRect(9, 5, 1, 4);
      // Thicker carriage
      gfx.fillRect(2, 7, 10, 1);
    }
    if (level >= 3) {
      // Muzzle flash glow
      gfx.fillStyle(0xFFAA00, 0.4);
      gfx.fillRect(14, 3, 2, 8);
      gfx.fillStyle(0xFF6600, 0.3);
      gfx.fillRect(13, 5, 1, 4);
    }
  }

  // Long Cannon: Narrow long barrel on wheeled carriage
  private drawLongCannon(gfx: Phaser.GameObjects.Graphics, level: number): void {
    // Emplacement
    gfx.fillStyle(0x888877);
    gfx.fillRect(0, 10, 16, 6);
    // Wheeled carriage
    gfx.fillStyle(0x6B4226);
    gfx.fillRect(1, 9, 8, 3);
    // Long narrow barrel
    gfx.fillStyle(0x555555);
    gfx.fillRect(2, 6, 13, 3);
    // Muzzle
    gfx.fillStyle(0x444444);
    gfx.fillRect(14, 5, 2, 5);
    // Barrel bands
    gfx.fillStyle(0x666666);
    gfx.fillRect(5, 6, 1, 3);
    gfx.fillRect(9, 6, 1, 3);
    // Cannonball stack
    gfx.fillStyle(0x333333);
    gfx.fillRect(0, 13, 2, 2);
    gfx.fillRect(2, 13, 2, 2);
    gfx.fillRect(1, 11, 2, 2);
    // Wheels
    gfx.fillStyle(0x553322);
    gfx.fillRect(2, 12, 3, 3);
    gfx.fillRect(7, 12, 3, 3);

    if (level >= 2) {
      // Extra barrel bands
      gfx.fillStyle(0x777777);
      gfx.fillRect(3, 6, 1, 3);
      gfx.fillRect(7, 6, 1, 3);
      gfx.fillRect(11, 6, 1, 3);
      // Reinforced carriage
      gfx.fillStyle(0x808080);
      gfx.fillRect(1, 9, 8, 1);
    }
    if (level >= 3) {
      // Muzzle fire glow
      gfx.fillStyle(0xFFAA00, 0.5);
      gfx.fillRect(14, 4, 2, 7);
      gfx.fillStyle(0xFF6600, 0.3);
      gfx.fillRect(13, 6, 1, 3);
    }
  }

  // ─── AGE 6: INDUSTRIAL ────────────────────────────────────────

  // Gatling Tower: 4 rotated barrels (#808080) on pedestal
  private drawGatlingTower(gfx: Phaser.GameObjects.Graphics, level: number): void {
    // Pedestal base
    gfx.fillStyle(0x555555);
    gfx.fillRect(3, 9, 10, 7);
    // Shield plate
    gfx.fillStyle(0x666666);
    gfx.fillRect(6, 2, 3, 8);
    // 4 rotated barrels (#808080)
    gfx.fillStyle(0x808080);
    gfx.fillRect(8, 3, 6, 1);  // Barrel 1
    gfx.fillRect(8, 5, 6, 1);  // Barrel 2
    gfx.fillRect(8, 7, 6, 1);  // Barrel 3
    gfx.fillRect(8, 9, 6, 1);  // Barrel 4
    // Barrel cluster end
    gfx.fillStyle(0x707070);
    gfx.fillRect(13, 2, 3, 9);
    // Handle/crank mechanism
    gfx.fillStyle(0x444444);
    gfx.fillRect(3, 4, 4, 5);
    // Ammo belt (brass)
    gfx.fillStyle(0xCD7F32);
    gfx.fillRect(3, 5, 4, 2);
    // Gear
    gfx.fillStyle(0xB8860B);
    gfx.fillRect(4, 10, 3, 3);
    gfx.fillStyle(0x8B6914);
    gfx.fillRect(5, 11, 1, 1);

    if (level >= 2) {
      // Extra armor plate
      gfx.fillStyle(0x777777);
      gfx.fillRect(5, 1, 4, 2);
      // Metal bands on pedestal
      gfx.fillStyle(0x666666);
      gfx.fillRect(3, 9, 10, 1);
      gfx.fillRect(3, 15, 10, 1);
    }
    if (level >= 3) {
      // Muzzle flash glow
      gfx.fillStyle(0xFFAA00, 0.4);
      gfx.fillRect(14, 1, 2, 11);
      // Hot barrel glow
      gfx.fillStyle(0xFF4400, 0.2);
      gfx.fillRect(12, 2, 2, 9);
    }
  }

  // Howitzer: Large upward-angled cannon barrel
  private drawHowitzer(gfx: Phaser.GameObjects.Graphics, level: number): void {
    // Heavy emplacement
    gfx.fillStyle(0x556655);
    gfx.fillRect(1, 10, 14, 6);
    // Barrel support/mount
    gfx.fillStyle(0x555555);
    gfx.fillRect(3, 5, 5, 6);
    // Large barrel (upward-angled)
    gfx.fillStyle(0x444444);
    gfx.fillRect(4, 3, 10, 3);
    // Barrel end (elevated muzzle)
    gfx.fillStyle(0x3A3A3A);
    gfx.fillRect(12, 1, 4, 5);
    // Recoil mechanism
    gfx.fillStyle(0x666666);
    gfx.fillRect(2, 6, 4, 2);
    // Trail spade
    gfx.fillStyle(0x444444);
    gfx.fillRect(0, 12, 4, 4);
    // Shell (brass)
    gfx.fillStyle(0xCD7F32);
    gfx.fillRect(0, 8, 2, 3);

    if (level >= 2) {
      // Reinforced mount
      gfx.fillStyle(0x777777);
      gfx.fillRect(3, 5, 5, 1);
      gfx.fillRect(3, 10, 5, 1);
      // Extra armor
      gfx.fillStyle(0x666666);
      gfx.fillRect(7, 4, 1, 5);
    }
    if (level >= 3) {
      // Muzzle blast glow
      gfx.fillStyle(0xFFAA00, 0.5);
      gfx.fillRect(14, 0, 2, 6);
      gfx.fillStyle(0xFF6600, 0.3);
      gfx.fillRect(12, 0, 2, 2);
    }
  }

  // ─── AGE 7: MODERN ────────────────────────────────────────────

  // SAM Turret: 2 slim missile tubes pointing upward at angle
  private drawSamTurret(gfx: Phaser.GameObjects.Graphics, level: number): void {
    // Base platform (olive drab)
    gfx.fillStyle(0x556B2F);
    gfx.fillRect(2, 10, 12, 6);
    // Rotating platform
    gfx.fillStyle(0x4A5F28);
    gfx.fillRect(4, 7, 8, 4);
    // 2 slim missile tubes (pointing upward at angle)
    gfx.fillStyle(0x444444);
    gfx.fillRect(4, 2, 3, 6);
    gfx.fillRect(9, 2, 3, 6);
    // Missile tips (white nosecones)
    gfx.fillStyle(0xCCCCCC);
    gfx.fillRect(5, 1, 1, 2);
    gfx.fillRect(10, 1, 1, 2);
    // Radar on top
    gfx.fillStyle(0x888888);
    gfx.fillRect(7, 0, 2, 2);
    // Camo patches
    gfx.fillStyle(0x4A5F28, 0.3);
    gfx.fillRect(2, 11, 4, 3);
    gfx.fillRect(10, 12, 4, 3);

    if (level >= 2) {
      // Extra missile tube
      gfx.fillStyle(0x444444);
      gfx.fillRect(7, 3, 2, 5);
      gfx.fillStyle(0xCCCCCC);
      gfx.fillRect(7, 2, 1, 1);
      // Armored base
      gfx.fillStyle(0x666666);
      gfx.fillRect(2, 10, 12, 1);
    }
    if (level >= 3) {
      // Targeting glow
      gfx.fillStyle(0xFF0000, 0.3);
      gfx.fillRect(7, 0, 2, 1);
      // Exhaust glow
      gfx.fillStyle(0xFF6600, 0.3);
      gfx.fillRect(4, 7, 3, 2);
      gfx.fillRect(9, 7, 3, 2);
    }
  }

  // Missile Launcher: Box launcher with 2 missile shapes
  private drawMissileLauncher(gfx: Phaser.GameObjects.Graphics, level: number): void {
    // Heavy platform
    gfx.fillStyle(0x556B2F);
    gfx.fillRect(1, 10, 14, 6);
    // Launch rails / box
    gfx.fillStyle(0x444444);
    gfx.fillRect(2, 3, 12, 4);
    gfx.fillRect(3, 1, 10, 3);
    // 2 missiles (large)
    gfx.fillStyle(0x888888);
    gfx.fillRect(4, 0, 3, 5);
    gfx.fillRect(9, 0, 3, 5);
    // Warhead tips (red)
    gfx.fillStyle(0xCC2222);
    gfx.fillRect(5, 0, 1, 1);
    gfx.fillRect(10, 0, 1, 1);
    // Hydraulic support
    gfx.fillStyle(0x555555);
    gfx.fillRect(6, 6, 4, 5);
    // Control box
    gfx.fillStyle(0x333333);
    gfx.fillRect(1, 7, 4, 4);
    // Status light
    gfx.fillStyle(0x44FF44);
    gfx.fillRect(2, 9, 1, 1);

    if (level >= 2) {
      // Extra armor plating
      gfx.fillStyle(0x666666);
      gfx.fillRect(1, 10, 14, 1);
      // Enhanced rail
      gfx.fillStyle(0x555555);
      gfx.fillRect(2, 3, 12, 1);
    }
    if (level >= 3) {
      // Exhaust glow
      gfx.fillStyle(0xFF6600, 0.4);
      gfx.fillRect(4, 4, 3, 2);
      gfx.fillRect(9, 4, 3, 2);
      // Targeting laser
      gfx.fillStyle(0xFF0000, 0.3);
      gfx.fillRect(7, 0, 2, 1);
    }
  }

  // ─── AGE 8: FUTURE ────────────────────────────────────────────

  // Laser Grid: Crystal on pedestal with thin cyan line projecting
  private drawLaserGrid(gfx: Phaser.GameObjects.Graphics, level: number): void {
    // Sleek base
    gfx.fillStyle(0x333344);
    gfx.fillRect(2, 8, 12, 8);
    // Pedestal
    gfx.fillStyle(0x444455);
    gfx.fillRect(4, 5, 8, 4);
    // Crystal emitter (central)
    gfx.fillStyle(0x00CED1);
    gfx.fillRect(6, 3, 4, 4);
    gfx.fillStyle(0x44FFFF);
    gfx.fillRect(7, 4, 2, 2);
    // Thin cyan line projecting upward (beam)
    gfx.fillStyle(0x00CED1, 0.5);
    gfx.fillRect(7, 0, 2, 4);
    gfx.fillStyle(0x00CED1, 0.3);
    gfx.fillRect(7, 0, 2, 1);
    // Energy lines along sides
    gfx.fillStyle(0x00CED1, 0.6);
    gfx.fillRect(2, 10, 1, 5);
    gfx.fillRect(13, 10, 1, 5);
    gfx.fillRect(5, 8, 6, 1);
    // Core glow
    gfx.fillStyle(0x44FFFF);
    gfx.fillRect(6, 10, 4, 3);
    gfx.fillStyle(0x88FFFF);
    gfx.fillRect(7, 11, 2, 1);

    if (level >= 2) {
      // Extra energy conduits
      gfx.fillStyle(0x00CED1, 0.4);
      gfx.fillRect(3, 6, 1, 6);
      gfx.fillRect(12, 6, 1, 6);
      // Wider beam
      gfx.fillStyle(0x00CED1, 0.2);
      gfx.fillRect(6, 0, 4, 4);
    }
    if (level >= 3) {
      // Full beam glow
      gfx.fillStyle(0x00CED1, 0.4);
      gfx.fillRect(5, 0, 6, 2);
      // Overcharged crystal
      gfx.fillStyle(0xFFFFFF, 0.3);
      gfx.fillRect(7, 4, 2, 2);
      // Side beam projections
      gfx.fillStyle(0x00CED1, 0.3);
      gfx.fillRect(0, 6, 4, 1);
      gfx.fillRect(12, 6, 4, 1);
    }
  }

  // Ion Cannon: Large dish shape with energy glow center
  private drawIonCannon(gfx: Phaser.GameObjects.Graphics, level: number): void {
    // Heavy base
    gfx.fillStyle(0x333344);
    gfx.fillRect(1, 8, 14, 8);
    // Cannon body
    gfx.fillStyle(0x444455);
    gfx.fillRect(3, 3, 10, 6);
    // Large dish/barrel
    gfx.fillStyle(0x555566);
    gfx.fillRect(10, 2, 6, 6);
    // Dish concavity
    gfx.fillStyle(0x444455);
    gfx.fillRect(12, 3, 3, 4);
    // Energy coils along barrel
    gfx.fillStyle(0x00CED1);
    gfx.fillRect(4, 3, 1, 5);
    gfx.fillRect(7, 3, 1, 5);
    gfx.fillRect(10, 3, 1, 5);
    // Energy glow center (muzzle)
    gfx.fillStyle(0x44FFFF);
    gfx.fillRect(14, 3, 2, 4);
    gfx.fillStyle(0x88FFFF);
    gfx.fillRect(14, 4, 2, 2);
    // Energy core in base
    gfx.fillStyle(0x00CED1);
    gfx.fillRect(5, 10, 6, 4);
    gfx.fillStyle(0x44FFFF);
    gfx.fillRect(6, 11, 4, 2);
    // Support struts
    gfx.fillStyle(0x333344);
    gfx.fillRect(1, 6, 2, 4);
    gfx.fillRect(13, 6, 2, 4);

    if (level >= 2) {
      // Extra energy coils
      gfx.fillStyle(0x00CED1, 0.6);
      gfx.fillRect(5, 2, 1, 6);
      gfx.fillRect(9, 2, 1, 6);
      // Reinforced base
      gfx.fillStyle(0x555566);
      gfx.fillRect(1, 8, 14, 1);
    }
    if (level >= 3) {
      // Charging beam glow
      gfx.fillStyle(0x00CED1, 0.5);
      gfx.fillRect(14, 1, 2, 8);
      gfx.fillStyle(0xFFFFFF, 0.3);
      gfx.fillRect(14, 4, 2, 2);
      // Overcharged core
      gfx.fillStyle(0x44FFFF, 0.5);
      gfx.fillRect(4, 9, 8, 1);
      // Energy arc
      gfx.fillStyle(0xE040FB, 0.3);
      gfx.fillRect(3, 2, 8, 1);
    }
  }
}
