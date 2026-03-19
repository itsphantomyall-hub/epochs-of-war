import Phaser from 'phaser';

/**
 * TurretRenderer — Generates 16x16 turret textures for all 16 turrets,
 * each with age-appropriate visuals.
 */
export class TurretRenderer {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  generateAll(): void {
    const turretDrawers: Record<string, (gfx: Phaser.GameObjects.Graphics) => void> = {
      rock_dropper: this.drawRockDropper,
      tar_pit: this.drawTarPit,
      arrow_slit: this.drawArrowSlit,
      boiling_oil: this.drawBoilingOil,
      ballista: this.drawBallista,
      catapult: this.drawCatapult,
      repeating_crossbow: this.drawRepeatingCrossbow,
      trebuchet_tower: this.drawTrebuchetTower,
      grape_shot_cannon: this.drawGrapeShotCannon,
      long_cannon: this.drawLongCannon,
      gatling_tower: this.drawGatlingTower,
      howitzer: this.drawHowitzer,
      sam_turret: this.drawSamTurret,
      missile_launcher: this.drawMissileLauncher,
      laser_grid: this.drawLaserGrid,
      ion_cannon: this.drawIonCannon,
    };

    for (const [id, drawFn] of Object.entries(turretDrawers)) {
      for (const faction of ['player', 'enemy'] as const) {
        const key = `turret_${id}_${faction}`;
        if (this.scene.textures.exists(key)) continue;

        const gfx = this.scene.add.graphics();
        drawFn.call(this, gfx);

        // Faction tint
        const tintColor = faction === 'player' ? 0x4488ff : 0xff4444;
        gfx.fillStyle(tintColor, 0.15);
        gfx.fillRect(0, 0, 16, 16);

        gfx.generateTexture(key, 16, 16);
        gfx.destroy();
      }
    }
  }

  getTextureKey(turretId: string, faction: 'player' | 'enemy'): string {
    return `turret_${turretId}_${faction}`;
  }

  // ─── AGE 1 ───

  private drawRockDropper(gfx: Phaser.GameObjects.Graphics): void {
    // Base platform
    gfx.fillStyle(0x666655);
    gfx.fillRect(2, 10, 12, 6);
    // Pile of rocks
    gfx.fillStyle(0x888877);
    gfx.fillRect(4, 6, 4, 4);
    gfx.fillRect(6, 4, 4, 4);
    gfx.fillRect(8, 6, 4, 4);
    // Arm mechanism
    gfx.fillStyle(0x6B4226);
    gfx.fillRect(3, 3, 2, 8);
    gfx.fillRect(3, 3, 8, 2);
    // Rock ready
    gfx.fillStyle(0x999988);
    gfx.fillRect(9, 2, 3, 3);
  }

  private drawTarPit(gfx: Phaser.GameObjects.Graphics): void {
    // Pit basin
    gfx.fillStyle(0x553322);
    gfx.fillRect(2, 8, 12, 8);
    // Tar (bubbling)
    gfx.fillStyle(0x222211);
    gfx.fillRect(3, 9, 10, 5);
    // Bubbles
    gfx.fillStyle(0x333322);
    gfx.fillRect(5, 10, 2, 2);
    gfx.fillRect(9, 11, 2, 1);
    // Steam
    gfx.fillStyle(0x888888, 0.4);
    gfx.fillRect(6, 6, 2, 3);
    gfx.fillRect(8, 5, 1, 2);
    // Stone rim
    gfx.fillStyle(0x888877);
    gfx.fillRect(1, 8, 14, 2);
  }

  // ─── AGE 2 ───

  private drawArrowSlit(gfx: Phaser.GameObjects.Graphics): void {
    // Wall section
    gfx.fillStyle(0xBB9955);
    gfx.fillRect(2, 2, 12, 14);
    // Arrow slit (narrow window)
    gfx.fillStyle(0x222211);
    gfx.fillRect(7, 4, 2, 8);
    // Arrow tip visible
    gfx.fillStyle(0xCCCCCC);
    gfx.fillRect(7, 6, 2, 1);
    // Decorative trim
    gfx.fillStyle(0xCD7F32);
    gfx.fillRect(2, 2, 12, 1);
    gfx.fillRect(2, 15, 12, 1);
  }

  private drawBoilingOil(gfx: Phaser.GameObjects.Graphics): void {
    // Cauldron
    gfx.fillStyle(0x444444);
    gfx.fillRect(3, 6, 10, 8);
    // Oil (hot)
    gfx.fillStyle(0xAA6600);
    gfx.fillRect(4, 7, 8, 5);
    // Steam/heat
    gfx.fillStyle(0xFFAA00, 0.4);
    gfx.fillRect(5, 4, 2, 3);
    gfx.fillRect(9, 3, 2, 4);
    // Support frame
    gfx.fillStyle(0x6B4226);
    gfx.fillRect(2, 5, 2, 10);
    gfx.fillRect(12, 5, 2, 10);
    // Fire below
    gfx.fillStyle(0xFF4400);
    gfx.fillRect(5, 13, 2, 2);
    gfx.fillRect(9, 13, 2, 2);
  }

  // ─── AGE 3 ───

  private drawBallista(gfx: Phaser.GameObjects.Graphics): void {
    // Wooden frame
    gfx.fillStyle(0x6B4226);
    gfx.fillRect(3, 8, 10, 4);
    // Cross arms (bow)
    gfx.fillStyle(0x553322);
    gfx.fillRect(1, 6, 14, 2);
    // Bolt
    gfx.fillStyle(0xCCCCCC);
    gfx.fillRect(6, 4, 1, 6);
    // Bolt tip
    gfx.fillStyle(0xCCCCCC);
    gfx.fillRect(5, 3, 3, 2);
    // Bowstring
    gfx.fillStyle(0xDDCCAA);
    gfx.fillRect(1, 7, 1, 1);
    gfx.fillRect(14, 7, 1, 1);
    // Wheels
    gfx.fillStyle(0x553322);
    gfx.fillRect(4, 12, 3, 3);
    gfx.fillRect(10, 12, 3, 3);
  }

  private drawCatapult(gfx: Phaser.GameObjects.Graphics): void {
    // Frame
    gfx.fillStyle(0x6B4226);
    gfx.fillRect(2, 10, 12, 4);
    // Throwing arm
    gfx.fillStyle(0x7B5236);
    gfx.fillRect(4, 4, 2, 8);
    // Bucket
    gfx.fillStyle(0x553322);
    gfx.fillRect(3, 3, 4, 3);
    // Boulder
    gfx.fillStyle(0x999988);
    gfx.fillRect(4, 2, 2, 2);
    // Base supports
    gfx.fillStyle(0x5A3520);
    gfx.fillRect(8, 6, 4, 6);
    // Rope
    gfx.fillStyle(0xBBAA88);
    gfx.fillRect(10, 4, 1, 4);
    // Wheels
    gfx.fillStyle(0x553322);
    gfx.fillRect(2, 14, 3, 2);
    gfx.fillRect(11, 14, 3, 2);
  }

  // ─── AGE 4 ───

  private drawRepeatingCrossbow(gfx: Phaser.GameObjects.Graphics): void {
    // Stone base
    gfx.fillStyle(0x888888);
    gfx.fillRect(2, 10, 12, 6);
    // Crossbow frame
    gfx.fillStyle(0x6B4226);
    gfx.fillRect(4, 5, 8, 5);
    // Bow arms
    gfx.fillStyle(0x553322);
    gfx.fillRect(2, 6, 12, 2);
    // Bolt magazine
    gfx.fillStyle(0x444444);
    gfx.fillRect(5, 2, 6, 4);
    // Bolts visible
    gfx.fillStyle(0xCCCCCC);
    gfx.fillRect(6, 3, 1, 2);
    gfx.fillRect(8, 3, 1, 2);
    gfx.fillRect(10, 3, 1, 2);
    // Mechanism
    gfx.fillStyle(0x888888);
    gfx.fillRect(10, 7, 3, 3);
  }

  private drawTrebuchetTower(gfx: Phaser.GameObjects.Graphics): void {
    // Tower base
    gfx.fillStyle(0x888888);
    gfx.fillRect(2, 8, 12, 8);
    // Tower top
    gfx.fillStyle(0x777777);
    gfx.fillRect(4, 4, 8, 5);
    // Throwing arm
    gfx.fillStyle(0x6B4226);
    gfx.fillRect(3, 2, 10, 2);
    // Counterweight
    gfx.fillStyle(0x555555);
    gfx.fillRect(2, 0, 4, 3);
    // Sling
    gfx.fillStyle(0x886644);
    gfx.fillRect(11, 0, 2, 3);
    // Boulder
    gfx.fillStyle(0x999988);
    gfx.fillRect(11, 0, 3, 2);
    // Battlements
    gfx.fillStyle(0x999999);
    gfx.fillRect(3, 4, 2, 1);
    gfx.fillRect(7, 4, 2, 1);
    gfx.fillRect(11, 4, 2, 1);
  }

  // ─── AGE 5 ───

  private drawGrapeShotCannon(gfx: Phaser.GameObjects.Graphics): void {
    // Emplacement
    gfx.fillStyle(0x888877);
    gfx.fillRect(2, 10, 12, 6);
    // Cannon barrel (short, wide)
    gfx.fillStyle(0x555555);
    gfx.fillRect(5, 5, 8, 4);
    gfx.fillRect(11, 4, 4, 6);
    // Barrel mouth (flared)
    gfx.fillStyle(0x444444);
    gfx.fillRect(13, 4, 3, 6);
    // Carriage
    gfx.fillStyle(0x6B4226);
    gfx.fillRect(3, 8, 10, 3);
    // Wheels
    gfx.fillStyle(0x553322);
    gfx.fillRect(3, 11, 3, 3);
    gfx.fillRect(8, 11, 3, 3);
  }

  private drawLongCannon(gfx: Phaser.GameObjects.Graphics): void {
    // Emplacement
    gfx.fillStyle(0x888877);
    gfx.fillRect(1, 10, 14, 6);
    // Long barrel
    gfx.fillStyle(0x555555);
    gfx.fillRect(3, 6, 12, 3);
    gfx.fillStyle(0x444444);
    gfx.fillRect(13, 5, 3, 5);
    // Barrel bands
    gfx.fillStyle(0x666666);
    gfx.fillRect(6, 6, 1, 3);
    gfx.fillRect(10, 6, 1, 3);
    // Carriage
    gfx.fillStyle(0x6B4226);
    gfx.fillRect(2, 9, 8, 3);
    // Cannonball stack
    gfx.fillStyle(0x333333);
    gfx.fillRect(1, 13, 2, 2);
    gfx.fillRect(3, 13, 2, 2);
    gfx.fillRect(2, 11, 2, 2);
  }

  // ─── AGE 6 ───

  private drawGatlingTower(gfx: Phaser.GameObjects.Graphics): void {
    // Tower base
    gfx.fillStyle(0x555555);
    gfx.fillRect(3, 8, 10, 8);
    // Rotating barrels
    gfx.fillStyle(0x444444);
    gfx.fillRect(8, 3, 6, 2);
    gfx.fillRect(8, 5, 6, 1);
    gfx.fillRect(8, 7, 6, 1);
    // Barrel cluster
    gfx.fillStyle(0x333333);
    gfx.fillRect(12, 2, 4, 6);
    // Handle mechanism
    gfx.fillStyle(0x666666);
    gfx.fillRect(6, 4, 3, 4);
    // Ammo belt
    gfx.fillStyle(0xCD7F32);
    gfx.fillRect(3, 5, 4, 2);
    // Shield plate
    gfx.fillStyle(0x666666);
    gfx.fillRect(7, 2, 2, 7);
    // Gear
    gfx.fillStyle(0xCD7F32);
    gfx.fillRect(4, 10, 3, 3);
    gfx.fillStyle(0xB8860B);
    gfx.fillRect(5, 11, 1, 1);
  }

  private drawHowitzer(gfx: Phaser.GameObjects.Graphics): void {
    // Emplacement
    gfx.fillStyle(0x556655);
    gfx.fillRect(1, 10, 14, 6);
    // Heavy barrel (elevated)
    gfx.fillStyle(0x444444);
    gfx.fillRect(5, 3, 10, 3);
    gfx.fillRect(13, 1, 3, 5);
    // Barrel support
    gfx.fillStyle(0x555555);
    gfx.fillRect(4, 5, 4, 5);
    // Recoil mechanism
    gfx.fillStyle(0x666666);
    gfx.fillRect(3, 6, 3, 2);
    // Trail spade
    gfx.fillStyle(0x444444);
    gfx.fillRect(1, 12, 4, 4);
    // Shell
    gfx.fillStyle(0xCD7F32);
    gfx.fillRect(1, 8, 2, 3);
  }

  // ─── AGE 7 ───

  private drawSamTurret(gfx: Phaser.GameObjects.Graphics): void {
    // Base platform
    gfx.fillStyle(0x556B2F);
    gfx.fillRect(2, 10, 12, 6);
    // Rotating platform
    gfx.fillStyle(0x4A5F28);
    gfx.fillRect(4, 6, 8, 4);
    // Missile tubes (quad)
    gfx.fillStyle(0x444444);
    gfx.fillRect(3, 2, 3, 5);
    gfx.fillRect(7, 2, 3, 5);
    gfx.fillRect(11, 2, 3, 5);
    // Missile tips
    gfx.fillStyle(0xCCCCCC);
    gfx.fillRect(4, 1, 1, 2);
    gfx.fillRect(8, 1, 1, 2);
    gfx.fillRect(12, 1, 1, 2);
    // Radar
    gfx.fillStyle(0x888888);
    gfx.fillRect(7, 0, 2, 2);
    // Camo
    gfx.fillStyle(0x4A5F28, 0.3);
    gfx.fillRect(2, 10, 4, 3);
    gfx.fillRect(10, 12, 4, 3);
  }

  private drawMissileLauncher(gfx: Phaser.GameObjects.Graphics): void {
    // Heavy platform
    gfx.fillStyle(0x556B2F);
    gfx.fillRect(1, 10, 14, 6);
    // Launch rails
    gfx.fillStyle(0x444444);
    gfx.fillRect(2, 3, 12, 3);
    gfx.fillRect(3, 1, 10, 3);
    // Missiles (2 large)
    gfx.fillStyle(0x888888);
    gfx.fillRect(4, 0, 3, 5);
    gfx.fillRect(9, 0, 3, 5);
    // Warheads
    gfx.fillStyle(0xCC2222);
    gfx.fillRect(5, 0, 1, 1);
    gfx.fillRect(10, 0, 1, 1);
    // Hydraulic support
    gfx.fillStyle(0x555555);
    gfx.fillRect(6, 5, 4, 6);
    // Control box
    gfx.fillStyle(0x333333);
    gfx.fillRect(1, 8, 4, 3);
    gfx.fillStyle(0x44FF44);
    gfx.fillRect(2, 9, 1, 1);
  }

  // ─── AGE 8 ───

  private drawLaserGrid(gfx: Phaser.GameObjects.Graphics): void {
    // Sleek base
    gfx.fillStyle(0x333344);
    gfx.fillRect(2, 8, 12, 8);
    // Emitter array
    gfx.fillStyle(0x444455);
    gfx.fillRect(4, 4, 8, 4);
    // Lens array
    gfx.fillStyle(0x00CED1);
    gfx.fillRect(5, 5, 2, 2);
    gfx.fillRect(9, 5, 2, 2);
    // Beam glow
    gfx.fillStyle(0x00CED1, 0.3);
    gfx.fillRect(4, 2, 8, 2);
    // Energy lines
    gfx.fillStyle(0x00CED1);
    gfx.fillRect(2, 10, 1, 5);
    gfx.fillRect(13, 10, 1, 5);
    gfx.fillRect(6, 8, 4, 1);
    // Core
    gfx.fillStyle(0x44FFFF);
    gfx.fillRect(7, 10, 2, 2);
  }

  private drawIonCannon(gfx: Phaser.GameObjects.Graphics): void {
    // Heavy base
    gfx.fillStyle(0x333344);
    gfx.fillRect(1, 8, 14, 8);
    // Cannon body
    gfx.fillStyle(0x444455);
    gfx.fillRect(3, 3, 10, 6);
    // Large barrel
    gfx.fillStyle(0x555566);
    gfx.fillRect(10, 2, 6, 5);
    // Energy coils
    gfx.fillStyle(0x00CED1);
    gfx.fillRect(4, 3, 1, 5);
    gfx.fillRect(7, 3, 1, 5);
    gfx.fillRect(10, 3, 1, 5);
    // Muzzle glow
    gfx.fillStyle(0x44FFFF);
    gfx.fillRect(14, 3, 2, 3);
    // Energy core
    gfx.fillStyle(0x00CED1);
    gfx.fillRect(5, 10, 6, 4);
    gfx.fillStyle(0x44FFFF);
    gfx.fillRect(6, 11, 4, 2);
    // Support struts
    gfx.fillStyle(0x333344);
    gfx.fillRect(1, 6, 2, 4);
    gfx.fillRect(13, 6, 2, 4);
  }
}
