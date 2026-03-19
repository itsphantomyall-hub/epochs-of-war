import Phaser from 'phaser';

/**
 * Skin tone palette — 6 diverse tones rotated across units.
 */
const SKIN_TONES = [
  0xFFDBB4, // light peach
  0xC68642, // olive
  0x8D5524, // brown
  0x6B3A2A, // dark brown
  0xFFE0BD, // pale
  0xD4A574, // tan
];

/**
 * Age accent colors — each age has a distinct primary color.
 */
const AGE_ACCENTS: Record<number, number> = {
  1: 0x8B7355, // earthy brown (prehistoric)
  2: 0xCD7F32, // bronze
  3: 0xF0E68C, // gold/classical
  4: 0x708090, // steel grey (medieval)
  5: 0x8B0000, // dark red (gunpowder)
  6: 0x4A4A4A, // industrial grey
  7: 0x556B2F, // olive drab (modern)
  8: 0x00CED1, // cyan (future)
};

/**
 * Unit size definitions.
 */
const UNIT_SPRITE_SIZES: Record<string, [number, number]> = {
  infantry: [16, 24],
  ranged:   [14, 24],
  heavy:    [24, 32],
  special:  [20, 28],
  hero:     [32, 40],
};

/**
 * ProceduralSpriteFactory
 *
 * Generates unique pixel-art textures for all 32 units and 8 heroes
 * using Phaser Graphics API. Textures are generated once and cached.
 */
export class ProceduralSpriteFactory {
  private scene: Phaser.Scene;
  private generated = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Generate all unit and hero textures. Call once during scene create.
   */
  generateAll(): void {
    if (this.generated) return;
    this.generated = true;

    // Generate all 32 unit textures (both idle and walk frames)
    // Age 1 - Prehistoric
    this.generateClubman();
    this.generateSlinger();
    this.generateDinoRider();
    this.generatePackRaptors();

    // Age 2 - Bronze Age
    this.generateSpearman();
    this.generateJavelinThrower();
    this.generateWarChariot();
    this.generateWarElephant();

    // Age 3 - Classical
    this.generateHoplite();
    this.generateBowman();
    this.generateCenturion();
    this.generatePhalanx();

    // Age 4 - Medieval
    this.generateSwordsman();
    this.generateCrossbowman();
    this.generateKnight();
    this.generateTrebuchet();

    // Age 5 - Gunpowder
    this.generateMusketeer();
    this.generateGrenadier();
    this.generateCavalry();
    this.generateCannon();

    // Age 6 - Industrial
    this.generateRifleman();
    this.generateMachineGunner();
    this.generateSteamTank();
    this.generateZeppelinBomber();

    // Age 7 - Modern
    this.generateMarine();
    this.generateSniper();
    this.generateTank();
    this.generateAttackHelicopter();

    // Age 8 - Future
    this.generatePlasmaTrooper();
    this.generateRailGunner();
    this.generateMechWalker();
    this.generateDroneSwarm();

    // Generate 8 hero textures
    this.generateHeroGrok();
    this.generateHeroSargon();
    this.generateHeroLeonidas();
    this.generateHeroJoan();
    this.generateHeroNapoleon();
    this.generateHeroIronBaron();
    this.generateHeroSteele();
    this.generateHeroAxiom();
  }

  /**
   * Get the texture key for a given unit.
   */
  getUnitTextureKey(unitId: string, faction: 'player' | 'enemy'): string {
    return `unit_${unitId}_${faction}`;
  }

  /**
   * Get the texture key for a hero.
   */
  getHeroTextureKey(heroId: string, faction: 'player' | 'enemy'): string {
    return `hero_${heroId}_${faction}`;
  }

  /**
   * Get sprite size for a unit type.
   */
  getSpriteSize(type: string): [number, number] {
    return UNIT_SPRITE_SIZES[type] ?? UNIT_SPRITE_SIZES['infantry'];
  }

  // ─────────────────── HELPER METHODS ───────────────────

  private makeTexture(key: string, w: number, h: number, drawFn: (gfx: Phaser.GameObjects.Graphics) => void): void {
    // Generate for both factions
    for (const faction of ['player', 'enemy'] as const) {
      const textureKey = `${key}_${faction}`;
      if (this.scene.textures.exists(textureKey)) continue;

      const gfx = this.scene.add.graphics();
      drawFn(gfx);

      // Apply faction tint overlay
      const tintColor = faction === 'player' ? 0x4488ff : 0xff4444;
      gfx.fillStyle(tintColor, 0.15);
      gfx.fillRect(0, 0, w, h);

      gfx.generateTexture(textureKey, w, h);
      gfx.destroy();
    }
  }

  private getSkinTone(index: number): number {
    return SKIN_TONES[index % SKIN_TONES.length];
  }

  // Helper to draw a simple humanoid base shape
  private drawHumanoid(
    gfx: Phaser.GameObjects.Graphics,
    w: number,
    h: number,
    skinTone: number,
    hairColor: number,
    bodyColor: number,
    legColor: number,
    footColor: number
  ): void {
    const cx = Math.floor(w / 2);
    const headW = Math.max(4, Math.floor(w * 0.3));
    const headH = Math.max(3, Math.floor(h * 0.15));
    const bodyW = Math.max(6, Math.floor(w * 0.4));
    const bodyH = Math.max(6, Math.floor(h * 0.35));
    const armW = 2;
    const armH = Math.max(4, Math.floor(h * 0.25));
    const legW = Math.max(2, Math.floor(w * 0.15));
    const legH = Math.max(4, Math.floor(h * 0.25));
    const footH = 2;

    const headX = cx - Math.floor(headW / 2);
    const headY = Math.floor(h * 0.05);
    const hairY = headY;
    const bodyX = cx - Math.floor(bodyW / 2);
    const bodyY = headY + headH;
    const armY = bodyY + 1;
    const legY = bodyY + bodyH;
    const footY = legY + legH;

    // Hair
    gfx.fillStyle(hairColor);
    gfx.fillRect(headX - 1, hairY, headW + 2, 2);

    // Head
    gfx.fillStyle(skinTone);
    gfx.fillRect(headX, headY + 1, headW, headH);

    // Eyes (1px dots)
    gfx.fillStyle(0x000000);
    gfx.fillRect(headX + 1, headY + 2, 1, 1);
    gfx.fillRect(headX + headW - 2, headY + 2, 1, 1);

    // Body
    gfx.fillStyle(bodyColor);
    gfx.fillRect(bodyX, bodyY, bodyW, bodyH);

    // Arms
    gfx.fillStyle(skinTone);
    gfx.fillRect(bodyX - armW, armY, armW, armH);
    gfx.fillRect(bodyX + bodyW, armY, armW, armH);

    // Legs
    gfx.fillStyle(legColor);
    gfx.fillRect(cx - legW - 1, legY, legW, legH);
    gfx.fillRect(cx + 1, legY, legW, legH);

    // Feet
    gfx.fillStyle(footColor);
    gfx.fillRect(cx - legW - 1, footY, legW + 1, footH);
    gfx.fillRect(cx + 1, footY, legW + 1, footH);
  }

  // ─────────────────── AGE 1: PREHISTORIC ───────────────────

  private generateClubman(): void {
    const w = 16, h = 24;
    this.makeTexture('unit_clubman', w, h, (gfx) => {
      const skin = this.getSkinTone(0);
      // Head
      gfx.fillStyle(skin);
      gfx.fillRect(6, 2, 4, 4);
      // Hair (messy brown)
      gfx.fillStyle(0x4A3020);
      gfx.fillRect(5, 1, 6, 2);
      gfx.fillRect(5, 2, 1, 2);
      gfx.fillRect(10, 2, 1, 2);
      // Eyes
      gfx.fillStyle(0x000000);
      gfx.fillRect(7, 3, 1, 1);
      gfx.fillRect(9, 3, 1, 1);
      // Body (fur vest)
      gfx.fillStyle(0x8B7355);
      gfx.fillRect(5, 6, 6, 8);
      // Fur pattern
      gfx.fillStyle(0x7A6345);
      gfx.fillRect(5, 8, 2, 2);
      gfx.fillRect(9, 7, 2, 2);
      // Arms
      gfx.fillStyle(skin);
      gfx.fillRect(3, 7, 2, 6);
      gfx.fillRect(11, 7, 2, 6);
      // Club (weapon)
      gfx.fillStyle(0x6B4226);
      gfx.fillRect(13, 4, 2, 9);
      gfx.fillStyle(0x5A3520);
      gfx.fillRect(12, 3, 3, 2);
      // Legs
      gfx.fillStyle(skin);
      gfx.fillRect(5, 14, 3, 6);
      gfx.fillRect(8, 14, 3, 6);
      // Feet (leather wraps)
      gfx.fillStyle(0x5C4033);
      gfx.fillRect(5, 20, 3, 2);
      gfx.fillRect(8, 20, 3, 2);
      // Bone necklace
      gfx.fillStyle(0xEEDDCC);
      gfx.fillRect(6, 6, 1, 1);
      gfx.fillRect(8, 6, 1, 1);
      gfx.fillRect(7, 5, 2, 1);
    });
  }

  private generateSlinger(): void {
    const w = 14, h = 24;
    this.makeTexture('unit_slinger', w, h, (gfx) => {
      const skin = this.getSkinTone(1);
      // Head
      gfx.fillStyle(skin);
      gfx.fillRect(5, 2, 4, 4);
      // Hair band
      gfx.fillStyle(0x553322);
      gfx.fillRect(4, 2, 6, 1);
      gfx.fillRect(4, 1, 1, 2);
      gfx.fillRect(9, 1, 1, 2);
      // Eyes
      gfx.fillStyle(0x000000);
      gfx.fillRect(6, 3, 1, 1);
      gfx.fillRect(8, 3, 1, 1);
      // Body (leather wrap)
      gfx.fillStyle(0x996633);
      gfx.fillRect(4, 6, 6, 7);
      // Belt
      gfx.fillStyle(0x553322);
      gfx.fillRect(4, 10, 6, 1);
      // Arms
      gfx.fillStyle(skin);
      gfx.fillRect(2, 7, 2, 5);
      gfx.fillRect(10, 7, 2, 5);
      // Sling (extended arm)
      gfx.fillStyle(0x664422);
      gfx.fillRect(12, 6, 1, 3);
      gfx.fillRect(12, 6, 2, 1);
      // Stone in sling
      gfx.fillStyle(0x888888);
      gfx.fillRect(13, 6, 1, 1);
      // Legs
      gfx.fillStyle(skin);
      gfx.fillRect(4, 13, 3, 7);
      gfx.fillRect(7, 13, 3, 7);
      // Feet
      gfx.fillStyle(0x5C4033);
      gfx.fillRect(4, 20, 3, 2);
      gfx.fillRect(7, 20, 3, 2);
    });
  }

  private generateDinoRider(): void {
    const w = 24, h = 32;
    this.makeTexture('unit_dino_rider', w, h, (gfx) => {
      const skin = this.getSkinTone(2);
      // Dinosaur body (large green)
      gfx.fillStyle(0x558833);
      gfx.fillRect(4, 14, 16, 10);
      // Dino head
      gfx.fillStyle(0x669944);
      gfx.fillRect(18, 10, 6, 8);
      // Dino eye
      gfx.fillStyle(0xFF4400);
      gfx.fillRect(21, 12, 2, 2);
      gfx.fillStyle(0x000000);
      gfx.fillRect(22, 12, 1, 1);
      // Dino mouth
      gfx.fillStyle(0x334422);
      gfx.fillRect(20, 16, 4, 1);
      // Dino teeth
      gfx.fillStyle(0xFFFFFF);
      gfx.fillRect(21, 15, 1, 1);
      gfx.fillRect(23, 15, 1, 1);
      // Dino legs
      gfx.fillStyle(0x446622);
      gfx.fillRect(6, 24, 3, 6);
      gfx.fillRect(15, 24, 3, 6);
      // Dino tail
      gfx.fillStyle(0x558833);
      gfx.fillRect(0, 16, 5, 4);
      gfx.fillRect(0, 18, 2, 2);
      // Dino belly
      gfx.fillStyle(0x88AA66);
      gfx.fillRect(6, 20, 12, 4);
      // Dino claws
      gfx.fillStyle(0x333333);
      gfx.fillRect(6, 30, 3, 2);
      gfx.fillRect(15, 30, 3, 2);
      // Rider body
      gfx.fillStyle(0x8B7355);
      gfx.fillRect(8, 6, 6, 8);
      // Rider head
      gfx.fillStyle(skin);
      gfx.fillRect(9, 1, 4, 4);
      // Rider hair
      gfx.fillStyle(0x222222);
      gfx.fillRect(8, 0, 6, 2);
      // Rider eyes
      gfx.fillStyle(0x000000);
      gfx.fillRect(10, 2, 1, 1);
      gfx.fillRect(12, 2, 1, 1);
      // Rider spear
      gfx.fillStyle(0x6B4226);
      gfx.fillRect(15, 2, 1, 12);
      gfx.fillStyle(0xCCCCCC);
      gfx.fillRect(15, 0, 1, 3);
    });
  }

  private generatePackRaptors(): void {
    const w = 20, h = 28;
    this.makeTexture('unit_pack_raptors', w, h, (gfx) => {
      // Draw 3 small raptors
      const drawRaptor = (x: number, y: number, color: number) => {
        // Body
        gfx.fillStyle(color);
        gfx.fillRect(x, y + 4, 6, 5);
        // Head
        gfx.fillRect(x + 5, y + 2, 4, 4);
        // Eye
        gfx.fillStyle(0xFF6600);
        gfx.fillRect(x + 7, y + 3, 1, 1);
        // Jaws
        gfx.fillStyle(0x333333);
        gfx.fillRect(x + 8, y + 5, 2, 1);
        // Teeth
        gfx.fillStyle(0xFFFFFF);
        gfx.fillRect(x + 8, y + 4, 1, 1);
        // Tail
        gfx.fillStyle(color);
        gfx.fillRect(x - 2, y + 5, 3, 2);
        // Legs
        gfx.fillStyle(Phaser.Display.Color.IntegerToColor(color).darken(20).color);
        gfx.fillRect(x + 1, y + 9, 2, 4);
        gfx.fillRect(x + 4, y + 9, 2, 4);
        // Claws
        gfx.fillStyle(0x444444);
        gfx.fillRect(x + 1, y + 13, 2, 1);
        gfx.fillRect(x + 4, y + 13, 2, 1);
      };

      drawRaptor(1, 0, 0x669944);
      drawRaptor(6, 8, 0x557733);
      drawRaptor(3, 14, 0x778844);
    });
  }

  // ─────────────────── AGE 2: BRONZE AGE ───────────────────

  private generateSpearman(): void {
    const w = 16, h = 24;
    this.makeTexture('unit_spearman', w, h, (gfx) => {
      const skin = this.getSkinTone(3);
      // Head
      gfx.fillStyle(skin);
      gfx.fillRect(6, 3, 4, 4);
      // Bronze helmet
      gfx.fillStyle(0xCD7F32);
      gfx.fillRect(5, 2, 6, 2);
      gfx.fillRect(6, 1, 4, 1);
      // Eyes
      gfx.fillStyle(0x000000);
      gfx.fillRect(7, 4, 1, 1);
      gfx.fillRect(9, 4, 1, 1);
      // Body (cloth tunic)
      gfx.fillStyle(0xBB9955);
      gfx.fillRect(5, 7, 6, 7);
      // Belt
      gfx.fillStyle(0x8B6914);
      gfx.fillRect(5, 11, 6, 1);
      // Arms
      gfx.fillStyle(skin);
      gfx.fillRect(3, 8, 2, 5);
      gfx.fillRect(11, 8, 2, 5);
      // Spear
      gfx.fillStyle(0x6B4226);
      gfx.fillRect(13, 1, 1, 18);
      gfx.fillStyle(0xCD7F32);
      gfx.fillRect(12, 0, 3, 3);
      // Legs
      gfx.fillStyle(skin);
      gfx.fillRect(5, 14, 3, 6);
      gfx.fillRect(8, 14, 3, 6);
      // Sandals
      gfx.fillStyle(0x8B6914);
      gfx.fillRect(5, 20, 3, 2);
      gfx.fillRect(8, 20, 3, 2);
      // Shield (small round)
      gfx.fillStyle(0xCD7F32);
      gfx.fillRect(1, 8, 3, 5);
      gfx.fillStyle(0xB8860B);
      gfx.fillRect(2, 9, 1, 3);
    });
  }

  private generateJavelinThrower(): void {
    const w = 14, h = 24;
    this.makeTexture('unit_javelin_thrower', w, h, (gfx) => {
      const skin = this.getSkinTone(4);
      // Head
      gfx.fillStyle(skin);
      gfx.fillRect(5, 2, 4, 4);
      // Headband
      gfx.fillStyle(0xCD7F32);
      gfx.fillRect(4, 3, 6, 1);
      // Eyes
      gfx.fillStyle(0x000000);
      gfx.fillRect(6, 3, 1, 1);
      gfx.fillRect(8, 3, 1, 1);
      // Body (light tunic)
      gfx.fillStyle(0xDDCC88);
      gfx.fillRect(4, 6, 6, 7);
      // Belt
      gfx.fillStyle(0x886622);
      gfx.fillRect(4, 10, 6, 1);
      // Arms (throwing pose)
      gfx.fillStyle(skin);
      gfx.fillRect(2, 7, 2, 5);
      gfx.fillRect(10, 6, 2, 4);
      // Javelin
      gfx.fillStyle(0x6B4226);
      gfx.fillRect(11, 1, 1, 10);
      gfx.fillStyle(0xCD7F32);
      gfx.fillRect(11, 0, 1, 2);
      // Legs
      gfx.fillStyle(skin);
      gfx.fillRect(4, 13, 3, 7);
      gfx.fillRect(7, 13, 3, 7);
      // Sandals
      gfx.fillStyle(0x8B6914);
      gfx.fillRect(4, 20, 3, 2);
      gfx.fillRect(7, 20, 3, 2);
    });
  }

  private generateWarChariot(): void {
    const w = 24, h = 32;
    this.makeTexture('unit_war_chariot', w, h, (gfx) => {
      const skin = this.getSkinTone(5);
      // Chariot platform
      gfx.fillStyle(0x8B6914);
      gfx.fillRect(4, 18, 16, 4);
      // Chariot sides
      gfx.fillStyle(0xCD7F32);
      gfx.fillRect(4, 16, 2, 6);
      gfx.fillRect(18, 16, 2, 6);
      // Wheels
      gfx.fillStyle(0x6B4226);
      gfx.fillRect(5, 22, 4, 4);
      gfx.fillRect(15, 22, 4, 4);
      // Wheel center
      gfx.fillStyle(0xCD7F32);
      gfx.fillRect(6, 23, 2, 2);
      gfx.fillRect(16, 23, 2, 2);
      // Spokes
      gfx.fillStyle(0x4A3520);
      gfx.fillRect(7, 22, 1, 4);
      gfx.fillRect(5, 24, 4, 1);
      gfx.fillRect(17, 22, 1, 4);
      gfx.fillRect(15, 24, 4, 1);
      // Horse
      gfx.fillStyle(0x8B6914);
      gfx.fillRect(18, 10, 6, 8);
      gfx.fillRect(20, 18, 2, 6);
      gfx.fillRect(22, 18, 2, 6);
      // Horse head
      gfx.fillStyle(0x9B7924);
      gfx.fillRect(22, 6, 2, 6);
      gfx.fillStyle(0x000000);
      gfx.fillRect(23, 7, 1, 1);
      // Rider body
      gfx.fillStyle(0xBB9955);
      gfx.fillRect(8, 8, 6, 10);
      // Rider head
      gfx.fillStyle(skin);
      gfx.fillRect(9, 3, 4, 4);
      // Bronze helmet
      gfx.fillStyle(0xCD7F32);
      gfx.fillRect(8, 2, 6, 2);
      // Rider eyes
      gfx.fillStyle(0x000000);
      gfx.fillRect(10, 4, 1, 1);
      gfx.fillRect(12, 4, 1, 1);
      // Spear
      gfx.fillStyle(0x6B4226);
      gfx.fillRect(14, 0, 1, 18);
      gfx.fillStyle(0xCCCCCC);
      gfx.fillRect(13, 0, 3, 2);
    });
  }

  private generateWarElephant(): void {
    const w = 20, h = 28;
    this.makeTexture('unit_war_elephant', w, h, (gfx) => {
      const skin = this.getSkinTone(0);
      // Elephant body (large grey)
      gfx.fillStyle(0x888888);
      gfx.fillRect(3, 10, 14, 10);
      // Elephant head
      gfx.fillStyle(0x999999);
      gfx.fillRect(14, 6, 6, 8);
      // Trunk
      gfx.fillStyle(0x888888);
      gfx.fillRect(18, 14, 2, 6);
      gfx.fillRect(17, 18, 2, 2);
      // Ears
      gfx.fillStyle(0xAA9999);
      gfx.fillRect(13, 6, 2, 4);
      // Eye
      gfx.fillStyle(0x000000);
      gfx.fillRect(16, 8, 1, 1);
      // Tusks
      gfx.fillStyle(0xFFFFEE);
      gfx.fillRect(17, 12, 1, 3);
      gfx.fillRect(19, 12, 1, 3);
      // Legs
      gfx.fillStyle(0x777777);
      gfx.fillRect(5, 20, 3, 6);
      gfx.fillRect(12, 20, 3, 6);
      // Feet
      gfx.fillStyle(0x666666);
      gfx.fillRect(5, 26, 3, 2);
      gfx.fillRect(12, 26, 3, 2);
      // Howdah (riding platform)
      gfx.fillStyle(0xCD7F32);
      gfx.fillRect(5, 6, 8, 4);
      gfx.fillStyle(0xBB6622);
      gfx.fillRect(5, 6, 1, 4);
      gfx.fillRect(12, 6, 1, 4);
      // Rider
      gfx.fillStyle(skin);
      gfx.fillRect(7, 2, 3, 3);
      gfx.fillStyle(0xBB9955);
      gfx.fillRect(7, 5, 3, 3);
      // Cloth decoration
      gfx.fillStyle(0xCC4444);
      gfx.fillRect(3, 12, 14, 1);
      gfx.fillStyle(0xFFDD00);
      gfx.fillRect(3, 14, 14, 1);
    });
  }

  // ─────────────────── AGE 3: CLASSICAL ───────────────────

  private generateHoplite(): void {
    const w = 16, h = 24;
    this.makeTexture('unit_hoplite', w, h, (gfx) => {
      const skin = this.getSkinTone(1);
      // Head
      gfx.fillStyle(skin);
      gfx.fillRect(6, 3, 4, 4);
      // Corinthian helmet
      gfx.fillStyle(0xCD7F32);
      gfx.fillRect(5, 1, 6, 3);
      gfx.fillRect(6, 4, 1, 2);
      gfx.fillRect(9, 4, 1, 2);
      // Plume
      gfx.fillStyle(0xCC2222);
      gfx.fillRect(7, 0, 2, 2);
      gfx.fillRect(6, 0, 4, 1);
      // Eyes through helmet
      gfx.fillStyle(0x000000);
      gfx.fillRect(7, 4, 1, 1);
      gfx.fillRect(9, 4, 1, 1);
      // Body (white tunic)
      gfx.fillStyle(0xEEEEDD);
      gfx.fillRect(5, 7, 6, 7);
      // Armor front
      gfx.fillStyle(0xCD7F32);
      gfx.fillRect(5, 7, 6, 3);
      // Belt
      gfx.fillStyle(0x886622);
      gfx.fillRect(5, 11, 6, 1);
      // Arms
      gfx.fillStyle(skin);
      gfx.fillRect(3, 8, 2, 5);
      gfx.fillRect(11, 8, 2, 5);
      // Shield (large round)
      gfx.fillStyle(0xCC2222);
      gfx.fillRect(0, 6, 4, 8);
      gfx.fillStyle(0xFFDD00);
      gfx.fillRect(1, 8, 2, 4);
      // Spear
      gfx.fillStyle(0x6B4226);
      gfx.fillRect(13, 1, 1, 16);
      gfx.fillStyle(0xCCCCCC);
      gfx.fillRect(13, 0, 1, 2);
      // Legs
      gfx.fillStyle(skin);
      gfx.fillRect(5, 14, 3, 6);
      gfx.fillRect(8, 14, 3, 6);
      // Greaves
      gfx.fillStyle(0xCD7F32);
      gfx.fillRect(5, 16, 3, 2);
      gfx.fillRect(8, 16, 3, 2);
      // Sandals
      gfx.fillStyle(0x886622);
      gfx.fillRect(5, 20, 3, 2);
      gfx.fillRect(8, 20, 3, 2);
    });
  }

  private generateBowman(): void {
    const w = 14, h = 24;
    this.makeTexture('unit_bowman', w, h, (gfx) => {
      const skin = this.getSkinTone(2);
      // Head
      gfx.fillStyle(skin);
      gfx.fillRect(5, 2, 4, 4);
      // Laurel wreath
      gfx.fillStyle(0x44AA44);
      gfx.fillRect(4, 1, 6, 1);
      gfx.fillRect(4, 2, 1, 2);
      gfx.fillRect(9, 2, 1, 2);
      // Eyes
      gfx.fillStyle(0x000000);
      gfx.fillRect(6, 3, 1, 1);
      gfx.fillRect(8, 3, 1, 1);
      // Body (tunic)
      gfx.fillStyle(0xDDDDCC);
      gfx.fillRect(4, 6, 6, 7);
      // Belt
      gfx.fillStyle(0x886622);
      gfx.fillRect(4, 10, 6, 1);
      // Arms
      gfx.fillStyle(skin);
      gfx.fillRect(2, 7, 2, 5);
      gfx.fillRect(10, 7, 2, 4);
      // Bow
      gfx.fillStyle(0x6B4226);
      gfx.fillRect(12, 3, 1, 10);
      gfx.fillStyle(0xCCBB88);
      gfx.fillRect(11, 3, 1, 1);
      gfx.fillRect(11, 12, 1, 1);
      // Bow string
      gfx.fillStyle(0xDDCCAA);
      gfx.fillRect(11, 4, 1, 8);
      // Quiver
      gfx.fillStyle(0x886622);
      gfx.fillRect(1, 6, 2, 8);
      gfx.fillStyle(0xCCCCCC);
      gfx.fillRect(1, 5, 2, 2);
      // Legs
      gfx.fillStyle(skin);
      gfx.fillRect(4, 13, 3, 7);
      gfx.fillRect(7, 13, 3, 7);
      // Sandals
      gfx.fillStyle(0x886622);
      gfx.fillRect(4, 20, 3, 2);
      gfx.fillRect(7, 20, 3, 2);
    });
  }

  private generateCenturion(): void {
    const w = 24, h = 32;
    this.makeTexture('unit_centurion', w, h, (gfx) => {
      const skin = this.getSkinTone(3);
      // Head
      gfx.fillStyle(skin);
      gfx.fillRect(9, 4, 6, 5);
      // Centurion helmet with transverse crest
      gfx.fillStyle(0xCD7F32);
      gfx.fillRect(8, 2, 8, 4);
      gfx.fillStyle(0xCC2222);
      gfx.fillRect(7, 1, 10, 2);
      gfx.fillRect(8, 0, 8, 1);
      // Eyes
      gfx.fillStyle(0x000000);
      gfx.fillRect(10, 5, 1, 1);
      gfx.fillRect(13, 5, 1, 1);
      // Body (segmented armor)
      gfx.fillStyle(0xBBAAAA);
      gfx.fillRect(7, 9, 10, 10);
      // Armor segments
      gfx.fillStyle(0xAA9999);
      for (let i = 0; i < 4; i++) {
        gfx.fillRect(7, 10 + i * 2, 10, 1);
      }
      // Red tunic underneath
      gfx.fillStyle(0xCC2222);
      gfx.fillRect(8, 17, 8, 4);
      // Belt
      gfx.fillStyle(0x886622);
      gfx.fillRect(7, 16, 10, 1);
      // Arms
      gfx.fillStyle(skin);
      gfx.fillRect(4, 10, 3, 7);
      gfx.fillRect(17, 10, 3, 7);
      // Sword (gladius)
      gfx.fillStyle(0xCCCCCC);
      gfx.fillRect(20, 8, 2, 10);
      gfx.fillStyle(0x886622);
      gfx.fillRect(20, 16, 2, 2);
      // Large shield (scutum)
      gfx.fillStyle(0xCC2222);
      gfx.fillRect(1, 8, 4, 12);
      gfx.fillStyle(0xFFDD00);
      gfx.fillRect(2, 10, 2, 8);
      gfx.fillStyle(0xCD7F32);
      gfx.fillRect(2, 13, 2, 2);
      // Legs
      gfx.fillStyle(skin);
      gfx.fillRect(8, 21, 4, 7);
      gfx.fillRect(12, 21, 4, 7);
      // Greaves
      gfx.fillStyle(0xCD7F32);
      gfx.fillRect(8, 24, 4, 2);
      gfx.fillRect(12, 24, 4, 2);
      // Sandals
      gfx.fillStyle(0x886622);
      gfx.fillRect(8, 28, 4, 2);
      gfx.fillRect(12, 28, 4, 2);
    });
  }

  private generatePhalanx(): void {
    const w = 20, h = 28;
    this.makeTexture('unit_phalanx', w, h, (gfx) => {
      // Draw overlapping shield wall (2 soldiers visible)
      const drawShieldUnit = (x: number, skin: number) => {
        // Shield (prominent)
        gfx.fillStyle(0xCD7F32);
        gfx.fillRect(x, 6, 5, 14);
        gfx.fillStyle(0xFFDD00);
        gfx.fillRect(x + 1, 8, 3, 10);
        gfx.fillStyle(0xCD7F32);
        gfx.fillRect(x + 2, 11, 1, 4);
        // Head above shield
        gfx.fillStyle(skin);
        gfx.fillRect(x + 1, 2, 3, 3);
        // Helmet
        gfx.fillStyle(0xCD7F32);
        gfx.fillRect(x, 1, 5, 2);
        // Plume
        gfx.fillStyle(0xCC2222);
        gfx.fillRect(x + 1, 0, 3, 1);
        // Eyes
        gfx.fillStyle(0x000000);
        gfx.fillRect(x + 1, 3, 1, 1);
        gfx.fillRect(x + 3, 3, 1, 1);
        // Spear tip above
        gfx.fillStyle(0xCCCCCC);
        gfx.fillRect(x + 4, 0, 1, 3);
        // Legs
        gfx.fillStyle(skin);
        gfx.fillRect(x + 1, 20, 2, 6);
        gfx.fillRect(x + 3, 20, 2, 6);
        // Sandals
        gfx.fillStyle(0x886622);
        gfx.fillRect(x + 1, 26, 2, 2);
        gfx.fillRect(x + 3, 26, 2, 2);
      };

      drawShieldUnit(1, this.getSkinTone(4));
      drawShieldUnit(8, this.getSkinTone(1));
      // Spear shaft behind
      gfx.fillStyle(0x6B4226);
      gfx.fillRect(14, 2, 1, 22);
      gfx.fillRect(17, 2, 1, 22);
    });
  }

  // ─────────────────── AGE 4: MEDIEVAL ───────────────────

  private generateSwordsman(): void {
    const w = 16, h = 24;
    this.makeTexture('unit_swordsman', w, h, (gfx) => {
      const skin = this.getSkinTone(5);
      // Head
      gfx.fillStyle(skin);
      gfx.fillRect(6, 3, 4, 4);
      // Helmet with visor
      gfx.fillStyle(0x888888);
      gfx.fillRect(5, 1, 6, 3);
      gfx.fillRect(5, 4, 6, 1);
      gfx.fillStyle(0x333333);
      gfx.fillRect(6, 4, 4, 1);
      // Eyes through visor
      gfx.fillStyle(0x000000);
      gfx.fillRect(7, 4, 1, 1);
      gfx.fillRect(9, 4, 1, 1);
      // Chainmail body
      gfx.fillStyle(0x888888);
      gfx.fillRect(5, 7, 6, 5);
      // Tabard (blue/red)
      gfx.fillStyle(0x3344AA);
      gfx.fillRect(6, 7, 4, 7);
      // Cross on tabard
      gfx.fillStyle(0xFFDD00);
      gfx.fillRect(7, 8, 2, 5);
      gfx.fillRect(6, 10, 4, 1);
      // Belt
      gfx.fillStyle(0x664422);
      gfx.fillRect(5, 12, 6, 1);
      // Arms (armored)
      gfx.fillStyle(0x888888);
      gfx.fillRect(3, 8, 2, 5);
      gfx.fillRect(11, 8, 2, 5);
      // Sword
      gfx.fillStyle(0xCCCCCC);
      gfx.fillRect(13, 4, 1, 10);
      gfx.fillStyle(0x886622);
      gfx.fillRect(12, 12, 3, 2);
      // Shield
      gfx.fillStyle(0x3344AA);
      gfx.fillRect(1, 7, 3, 7);
      gfx.fillStyle(0xFFDD00);
      gfx.fillRect(2, 9, 1, 3);
      // Legs (chainmail)
      gfx.fillStyle(0x777777);
      gfx.fillRect(5, 14, 3, 6);
      gfx.fillRect(8, 14, 3, 6);
      // Boots
      gfx.fillStyle(0x553322);
      gfx.fillRect(5, 20, 3, 2);
      gfx.fillRect(8, 20, 3, 2);
    });
  }

  private generateCrossbowman(): void {
    const w = 14, h = 24;
    this.makeTexture('unit_crossbowman', w, h, (gfx) => {
      const skin = this.getSkinTone(0);
      // Head
      gfx.fillStyle(skin);
      gfx.fillRect(5, 2, 4, 4);
      // Kettle helmet
      gfx.fillStyle(0x888888);
      gfx.fillRect(4, 1, 6, 2);
      gfx.fillRect(3, 2, 8, 1);
      // Eyes
      gfx.fillStyle(0x000000);
      gfx.fillRect(6, 3, 1, 1);
      gfx.fillRect(8, 3, 1, 1);
      // Body (padded gambeson)
      gfx.fillStyle(0x6B4226);
      gfx.fillRect(4, 6, 6, 7);
      // Belt
      gfx.fillStyle(0x553322);
      gfx.fillRect(4, 10, 6, 1);
      // Arms
      gfx.fillStyle(0x6B4226);
      gfx.fillRect(2, 7, 2, 5);
      gfx.fillRect(10, 7, 2, 4);
      // Crossbow
      gfx.fillStyle(0x6B4226);
      gfx.fillRect(10, 8, 4, 1);
      gfx.fillStyle(0x888888);
      gfx.fillRect(12, 6, 1, 5);
      // Bolt
      gfx.fillStyle(0xCCCCCC);
      gfx.fillRect(10, 7, 3, 1);
      // Quiver on back
      gfx.fillStyle(0x553322);
      gfx.fillRect(1, 6, 2, 7);
      // Legs
      gfx.fillStyle(0x6B4226);
      gfx.fillRect(4, 13, 3, 7);
      gfx.fillRect(7, 13, 3, 7);
      // Boots
      gfx.fillStyle(0x553322);
      gfx.fillRect(4, 20, 3, 2);
      gfx.fillRect(7, 20, 3, 2);
    });
  }

  private generateKnight(): void {
    const w = 24, h = 32;
    this.makeTexture('unit_knight', w, h, (gfx) => {
      const skin = this.getSkinTone(2);
      // Horse body
      gfx.fillStyle(0x553322);
      gfx.fillRect(4, 16, 14, 8);
      // Horse head
      gfx.fillStyle(0x664433);
      gfx.fillRect(16, 12, 4, 8);
      gfx.fillRect(18, 10, 3, 4);
      // Horse eye
      gfx.fillStyle(0x000000);
      gfx.fillRect(19, 11, 1, 1);
      // Horse legs
      gfx.fillStyle(0x443322);
      gfx.fillRect(6, 24, 2, 6);
      gfx.fillRect(14, 24, 2, 6);
      // Hooves
      gfx.fillStyle(0x333333);
      gfx.fillRect(6, 30, 2, 2);
      gfx.fillRect(14, 30, 2, 2);
      // Horse mane
      gfx.fillStyle(0x222222);
      gfx.fillRect(16, 11, 1, 6);
      // Horse tail
      gfx.fillStyle(0x222222);
      gfx.fillRect(2, 17, 3, 2);
      gfx.fillRect(1, 19, 2, 2);
      // Barding (horse armor)
      gfx.fillStyle(0x888888);
      gfx.fillRect(4, 16, 14, 2);
      // Knight body (plate armor)
      gfx.fillStyle(0xAAAAAA);
      gfx.fillRect(7, 6, 8, 10);
      // Armor detail
      gfx.fillStyle(0x888888);
      gfx.fillRect(7, 8, 8, 1);
      gfx.fillRect(7, 12, 8, 1);
      // Knight head
      gfx.fillStyle(skin);
      gfx.fillRect(9, 2, 4, 3);
      // Great helm
      gfx.fillStyle(0xAAAAAA);
      gfx.fillRect(8, 1, 6, 3);
      gfx.fillStyle(0x333333);
      gfx.fillRect(9, 3, 4, 1);
      // Plume
      gfx.fillStyle(0x3344AA);
      gfx.fillRect(10, 0, 2, 1);
      // Lance
      gfx.fillStyle(0x6B4226);
      gfx.fillRect(19, 2, 1, 14);
      gfx.fillStyle(0xCCCCCC);
      gfx.fillRect(19, 0, 1, 3);
      // Shield
      gfx.fillStyle(0x3344AA);
      gfx.fillRect(4, 7, 3, 8);
      gfx.fillStyle(0xFFDD00);
      gfx.fillRect(5, 9, 1, 4);
    });
  }

  private generateTrebuchet(): void {
    const w = 20, h = 28;
    this.makeTexture('unit_trebuchet', w, h, (gfx) => {
      // Wooden frame
      gfx.fillStyle(0x6B4226);
      // Base frame
      gfx.fillRect(2, 22, 16, 2);
      gfx.fillRect(2, 24, 2, 4);
      gfx.fillRect(16, 24, 2, 4);
      // Wheels
      gfx.fillStyle(0x553322);
      gfx.fillRect(1, 26, 3, 2);
      gfx.fillRect(16, 26, 3, 2);
      // Support beams
      gfx.fillStyle(0x6B4226);
      gfx.fillRect(8, 12, 2, 10);
      gfx.fillRect(10, 12, 2, 10);
      // Arm (the throwing beam)
      gfx.fillStyle(0x7B5236);
      gfx.fillRect(3, 8, 14, 2);
      // Counterweight
      gfx.fillStyle(0x888888);
      gfx.fillRect(2, 5, 4, 4);
      gfx.fillStyle(0x666666);
      gfx.fillRect(3, 6, 2, 2);
      // Sling at other end
      gfx.fillStyle(0x886644);
      gfx.fillRect(14, 6, 2, 3);
      // Boulder in sling
      gfx.fillStyle(0x999999);
      gfx.fillRect(14, 4, 3, 3);
      // Crossbeam detail
      gfx.fillStyle(0x5A3520);
      gfx.fillRect(6, 16, 8, 1);
      gfx.fillRect(5, 19, 10, 1);
      // Operator (small figure)
      gfx.fillStyle(this.getSkinTone(4));
      gfx.fillRect(11, 16, 2, 2);
      gfx.fillStyle(0x886622);
      gfx.fillRect(11, 18, 2, 4);
    });
  }

  // ─────────────────── AGE 5: GUNPOWDER ───────────────────

  private generateMusketeer(): void {
    const w = 16, h = 24;
    this.makeTexture('unit_musketeer', w, h, (gfx) => {
      const skin = this.getSkinTone(3);
      // Head
      gfx.fillStyle(skin);
      gfx.fillRect(6, 3, 4, 4);
      // Tricorn hat
      gfx.fillStyle(0x222244);
      gfx.fillRect(4, 1, 8, 3);
      gfx.fillRect(5, 0, 6, 1);
      // Hat trim
      gfx.fillStyle(0xFFDD00);
      gfx.fillRect(4, 3, 8, 1);
      // Eyes
      gfx.fillStyle(0x000000);
      gfx.fillRect(7, 4, 1, 1);
      gfx.fillRect(9, 4, 1, 1);
      // Mustache
      gfx.fillStyle(0x444444);
      gfx.fillRect(7, 5, 2, 1);
      // Body (long coat)
      gfx.fillStyle(0x222288);
      gfx.fillRect(5, 7, 6, 9);
      // Coat buttons
      gfx.fillStyle(0xFFDD00);
      gfx.fillRect(8, 8, 1, 1);
      gfx.fillRect(8, 10, 1, 1);
      gfx.fillRect(8, 12, 1, 1);
      // White undershirt
      gfx.fillStyle(0xEEEEEE);
      gfx.fillRect(7, 7, 2, 2);
      // Belt
      gfx.fillStyle(0x886622);
      gfx.fillRect(5, 13, 6, 1);
      // Arms
      gfx.fillStyle(0x222288);
      gfx.fillRect(3, 8, 2, 5);
      gfx.fillRect(11, 8, 2, 4);
      // Musket
      gfx.fillStyle(0x6B4226);
      gfx.fillRect(12, 4, 1, 12);
      gfx.fillStyle(0x888888);
      gfx.fillRect(12, 2, 1, 3);
      // Bayonet
      gfx.fillStyle(0xCCCCCC);
      gfx.fillRect(12, 0, 1, 3);
      // Legs
      gfx.fillStyle(0xEEEEDD);
      gfx.fillRect(5, 16, 3, 4);
      gfx.fillRect(8, 16, 3, 4);
      // Boots
      gfx.fillStyle(0x333333);
      gfx.fillRect(5, 20, 3, 2);
      gfx.fillRect(8, 20, 3, 2);
      // Boot cuffs
      gfx.fillStyle(0x553322);
      gfx.fillRect(5, 20, 3, 1);
      gfx.fillRect(8, 20, 3, 1);
    });
  }

  private generateGrenadier(): void {
    const w = 14, h = 24;
    this.makeTexture('unit_grenadier', w, h, (gfx) => {
      const skin = this.getSkinTone(4);
      // Head
      gfx.fillStyle(skin);
      gfx.fillRect(5, 3, 4, 4);
      // Tall bearskin hat
      gfx.fillStyle(0x222222);
      gfx.fillRect(4, 0, 6, 4);
      // Hat plate
      gfx.fillStyle(0xCD7F32);
      gfx.fillRect(5, 3, 4, 1);
      // Eyes
      gfx.fillStyle(0x000000);
      gfx.fillRect(6, 4, 1, 1);
      gfx.fillRect(8, 4, 1, 1);
      // Body (red coat)
      gfx.fillStyle(0xAA2222);
      gfx.fillRect(4, 7, 6, 7);
      // White cross-belts
      gfx.fillStyle(0xEEEEEE);
      gfx.fillRect(4, 7, 1, 7);
      gfx.fillRect(9, 7, 1, 7);
      gfx.fillRect(5, 9, 4, 1);
      // Arms
      gfx.fillStyle(0xAA2222);
      gfx.fillRect(2, 8, 2, 5);
      gfx.fillRect(10, 8, 2, 4);
      // Grenade in hand
      gfx.fillStyle(0x333333);
      gfx.fillRect(11, 6, 2, 2);
      gfx.fillStyle(0xFF8800);
      gfx.fillRect(12, 5, 1, 1);
      // Legs
      gfx.fillStyle(0xEEEEDD);
      gfx.fillRect(4, 14, 3, 6);
      gfx.fillRect(7, 14, 3, 6);
      // Boots
      gfx.fillStyle(0x333333);
      gfx.fillRect(4, 20, 3, 2);
      gfx.fillRect(7, 20, 3, 2);
    });
  }

  private generateCavalry(): void {
    const w = 24, h = 32;
    this.makeTexture('unit_cavalry', w, h, (gfx) => {
      const skin = this.getSkinTone(5);
      // Horse body
      gfx.fillStyle(0x664433);
      gfx.fillRect(4, 16, 14, 8);
      // Horse head
      gfx.fillStyle(0x775544);
      gfx.fillRect(16, 12, 4, 8);
      gfx.fillRect(18, 10, 3, 4);
      // Horse eye
      gfx.fillStyle(0x000000);
      gfx.fillRect(19, 11, 1, 1);
      // Horse legs
      gfx.fillStyle(0x553322);
      gfx.fillRect(6, 24, 2, 6);
      gfx.fillRect(14, 24, 2, 6);
      // Hooves
      gfx.fillStyle(0x333333);
      gfx.fillRect(6, 30, 2, 2);
      gfx.fillRect(14, 30, 2, 2);
      // Saddle
      gfx.fillStyle(0x886622);
      gfx.fillRect(8, 14, 6, 3);
      // Rider body (military coat)
      gfx.fillStyle(0x222288);
      gfx.fillRect(8, 6, 6, 10);
      // Gold trim
      gfx.fillStyle(0xFFDD00);
      gfx.fillRect(8, 6, 1, 8);
      gfx.fillRect(13, 6, 1, 8);
      // Rider head
      gfx.fillStyle(skin);
      gfx.fillRect(9, 2, 4, 3);
      // Helmet
      gfx.fillStyle(0x333333);
      gfx.fillRect(8, 1, 6, 2);
      // Plume
      gfx.fillStyle(0xCC2222);
      gfx.fillRect(10, 0, 2, 1);
      // Saber
      gfx.fillStyle(0xCCCCCC);
      gfx.fillRect(16, 6, 1, 10);
      gfx.fillStyle(0x886622);
      gfx.fillRect(15, 14, 3, 2);
    });
  }

  private generateCannon(): void {
    const w = 20, h = 28;
    this.makeTexture('unit_cannon', w, h, (gfx) => {
      // Cannon barrel
      gfx.fillStyle(0x555555);
      gfx.fillRect(6, 12, 12, 4);
      gfx.fillStyle(0x444444);
      gfx.fillRect(16, 11, 4, 6);
      // Barrel mouth
      gfx.fillStyle(0x333333);
      gfx.fillRect(18, 12, 2, 4);
      // Barrel bands
      gfx.fillStyle(0x666666);
      gfx.fillRect(8, 12, 1, 4);
      gfx.fillRect(12, 12, 1, 4);
      // Carriage (wooden)
      gfx.fillStyle(0x6B4226);
      gfx.fillRect(2, 16, 14, 4);
      // Wheels
      gfx.fillStyle(0x553322);
      gfx.fillRect(2, 20, 4, 4);
      gfx.fillRect(10, 20, 4, 4);
      // Wheel centers
      gfx.fillStyle(0x888888);
      gfx.fillRect(3, 21, 2, 2);
      gfx.fillRect(11, 21, 2, 2);
      // Wheel spokes
      gfx.fillStyle(0x443322);
      gfx.fillRect(4, 20, 1, 4);
      gfx.fillRect(2, 22, 4, 1);
      gfx.fillRect(12, 20, 1, 4);
      gfx.fillRect(10, 22, 4, 1);
      // Cannonballs stack
      gfx.fillStyle(0x333333);
      gfx.fillRect(1, 24, 2, 2);
      gfx.fillRect(3, 24, 2, 2);
      gfx.fillRect(2, 22, 2, 2);
      // Operator
      gfx.fillStyle(this.getSkinTone(1));
      gfx.fillRect(3, 8, 3, 3);
      gfx.fillStyle(0x222288);
      gfx.fillRect(3, 11, 3, 5);
      // Operator hat
      gfx.fillStyle(0x222244);
      gfx.fillRect(2, 7, 5, 2);
    });
  }

  // ─────────────────── AGE 6: INDUSTRIAL ───────────────────

  private generateRifleman(): void {
    const w = 16, h = 24;
    this.makeTexture('unit_rifleman', w, h, (gfx) => {
      const skin = this.getSkinTone(0);
      // Head
      gfx.fillStyle(skin);
      gfx.fillRect(6, 3, 4, 4);
      // Peaked cap
      gfx.fillStyle(0x4A4A4A);
      gfx.fillRect(5, 1, 6, 3);
      gfx.fillRect(4, 3, 8, 1);
      // Cap badge
      gfx.fillStyle(0xCD7F32);
      gfx.fillRect(7, 2, 2, 1);
      // Eyes
      gfx.fillStyle(0x000000);
      gfx.fillRect(7, 4, 1, 1);
      gfx.fillRect(9, 4, 1, 1);
      // Mustache
      gfx.fillStyle(0x444444);
      gfx.fillRect(7, 5, 2, 1);
      // Body (dark tunic)
      gfx.fillStyle(0x3A3A3A);
      gfx.fillRect(5, 7, 6, 7);
      // Buttons
      gfx.fillStyle(0xCD7F32);
      gfx.fillRect(8, 8, 1, 1);
      gfx.fillRect(8, 10, 1, 1);
      // Belt with buckle
      gfx.fillStyle(0x553322);
      gfx.fillRect(5, 12, 6, 1);
      gfx.fillStyle(0xCD7F32);
      gfx.fillRect(7, 12, 2, 1);
      // Arms
      gfx.fillStyle(0x3A3A3A);
      gfx.fillRect(3, 8, 2, 5);
      gfx.fillRect(11, 8, 2, 4);
      // Rifle
      gfx.fillStyle(0x6B4226);
      gfx.fillRect(12, 3, 1, 14);
      gfx.fillStyle(0x888888);
      gfx.fillRect(12, 1, 1, 3);
      // Bayonet
      gfx.fillStyle(0xCCCCCC);
      gfx.fillRect(12, 0, 1, 2);
      // Legs
      gfx.fillStyle(0x3A3A3A);
      gfx.fillRect(5, 14, 3, 6);
      gfx.fillRect(8, 14, 3, 6);
      // Boots
      gfx.fillStyle(0x222222);
      gfx.fillRect(5, 20, 3, 2);
      gfx.fillRect(8, 20, 3, 2);
      // Puttees (leg wraps)
      gfx.fillStyle(0x4A4A4A);
      gfx.fillRect(5, 17, 3, 3);
      gfx.fillRect(8, 17, 3, 3);
    });
  }

  private generateMachineGunner(): void {
    const w = 14, h = 24;
    this.makeTexture('unit_machine_gunner', w, h, (gfx) => {
      const skin = this.getSkinTone(1);
      // Head
      gfx.fillStyle(skin);
      gfx.fillRect(5, 2, 4, 4);
      // Goggles on forehead
      gfx.fillStyle(0x4A4A4A);
      gfx.fillRect(4, 1, 6, 2);
      gfx.fillStyle(0x88BBCC);
      gfx.fillRect(5, 1, 1, 1);
      gfx.fillRect(8, 1, 1, 1);
      // Eyes
      gfx.fillStyle(0x000000);
      gfx.fillRect(6, 3, 1, 1);
      gfx.fillRect(8, 3, 1, 1);
      // Body (heavy coat)
      gfx.fillStyle(0x4A4A3A);
      gfx.fillRect(4, 6, 6, 7);
      // Ammo belt across chest
      gfx.fillStyle(0x886622);
      gfx.fillRect(4, 7, 6, 1);
      gfx.fillRect(9, 7, 1, 5);
      // Arms
      gfx.fillStyle(0x4A4A3A);
      gfx.fillRect(2, 7, 2, 5);
      gfx.fillRect(10, 7, 2, 4);
      // Machine gun
      gfx.fillStyle(0x333333);
      gfx.fillRect(11, 6, 3, 2);
      gfx.fillStyle(0x444444);
      gfx.fillRect(10, 7, 4, 1);
      // Gun barrel
      gfx.fillStyle(0x555555);
      gfx.fillRect(13, 6, 1, 1);
      // Ammo box
      gfx.fillStyle(0x555555);
      gfx.fillRect(1, 8, 2, 3);
      // Legs
      gfx.fillStyle(0x4A4A3A);
      gfx.fillRect(4, 13, 3, 7);
      gfx.fillRect(7, 13, 3, 7);
      // Boots
      gfx.fillStyle(0x222222);
      gfx.fillRect(4, 20, 3, 2);
      gfx.fillRect(7, 20, 3, 2);
    });
  }

  private generateSteamTank(): void {
    const w = 24, h = 32;
    this.makeTexture('unit_steam_tank', w, h, (gfx) => {
      // Tank body (riveted steel)
      gfx.fillStyle(0x555555);
      gfx.fillRect(2, 12, 18, 12);
      // Armor plates
      gfx.fillStyle(0x666666);
      gfx.fillRect(2, 12, 18, 2);
      gfx.fillRect(2, 22, 18, 2);
      // Rivets
      gfx.fillStyle(0x444444);
      for (let i = 0; i < 5; i++) {
        gfx.fillRect(3 + i * 4, 13, 1, 1);
        gfx.fillRect(3 + i * 4, 23, 1, 1);
      }
      // Turret
      gfx.fillStyle(0x666666);
      gfx.fillRect(6, 6, 10, 6);
      // Viewport
      gfx.fillStyle(0x333333);
      gfx.fillRect(8, 8, 6, 2);
      gfx.fillStyle(0x88BBCC);
      gfx.fillRect(9, 8, 4, 2);
      // Cannon barrel
      gfx.fillStyle(0x444444);
      gfx.fillRect(16, 8, 6, 3);
      gfx.fillRect(20, 7, 4, 5);
      // Smokestack
      gfx.fillStyle(0x444444);
      gfx.fillRect(4, 2, 3, 10);
      gfx.fillRect(3, 2, 5, 2);
      // Steam puff
      gfx.fillStyle(0xCCCCCC, 0.5);
      gfx.fillRect(3, 0, 3, 2);
      gfx.fillRect(2, 0, 2, 1);
      // Tracks
      gfx.fillStyle(0x333333);
      gfx.fillRect(1, 24, 20, 4);
      // Track segments
      gfx.fillStyle(0x444444);
      for (let i = 0; i < 7; i++) {
        gfx.fillRect(2 + i * 3, 24, 2, 4);
      }
      // Track wheels
      gfx.fillStyle(0x555555);
      gfx.fillRect(2, 25, 2, 2);
      gfx.fillRect(18, 25, 2, 2);
      // Gears visible
      gfx.fillStyle(0xCD7F32);
      gfx.fillRect(14, 18, 3, 3);
      gfx.fillStyle(0xB8860B);
      gfx.fillRect(15, 19, 1, 1);
    });
  }

  private generateZeppelinBomber(): void {
    const w = 20, h = 28;
    this.makeTexture('unit_zeppelin_bomber', w, h, (gfx) => {
      // Balloon (large oval shape)
      gfx.fillStyle(0x888877);
      gfx.fillRect(2, 2, 16, 10);
      gfx.fillRect(4, 1, 12, 1);
      gfx.fillRect(4, 12, 12, 1);
      gfx.fillRect(1, 4, 1, 6);
      gfx.fillRect(18, 4, 1, 6);
      // Balloon panels
      gfx.fillStyle(0x777766);
      gfx.fillRect(6, 2, 1, 11);
      gfx.fillRect(10, 2, 1, 11);
      gfx.fillRect(14, 2, 1, 11);
      // Tail fins
      gfx.fillStyle(0xAA6633);
      gfx.fillRect(0, 4, 2, 3);
      gfx.fillRect(0, 3, 1, 1);
      gfx.fillRect(0, 7, 1, 1);
      // Gondola (hanging underneath)
      gfx.fillStyle(0x6B4226);
      gfx.fillRect(6, 14, 8, 4);
      // Support lines
      gfx.fillStyle(0x444444);
      gfx.fillRect(6, 13, 1, 1);
      gfx.fillRect(13, 13, 1, 1);
      // Propeller
      gfx.fillStyle(0x888888);
      gfx.fillRect(14, 15, 4, 1);
      gfx.fillRect(14, 17, 4, 1);
      gfx.fillStyle(0x666666);
      gfx.fillRect(14, 16, 2, 1);
      // Bombs (underneath)
      gfx.fillStyle(0x333333);
      gfx.fillRect(7, 18, 2, 3);
      gfx.fillRect(11, 18, 2, 3);
      // Bomb fins
      gfx.fillStyle(0x444444);
      gfx.fillRect(6, 18, 1, 1);
      gfx.fillRect(9, 18, 1, 1);
      gfx.fillRect(10, 18, 1, 1);
      gfx.fillRect(13, 18, 1, 1);
      // Windows on gondola
      gfx.fillStyle(0x88BBCC);
      gfx.fillRect(8, 15, 1, 1);
      gfx.fillRect(11, 15, 1, 1);
      // Flag
      gfx.fillStyle(0xCC2222);
      gfx.fillRect(1, 5, 2, 1);
    });
  }

  // ─────────────────── AGE 7: MODERN ───────────────────

  private generateMarine(): void {
    const w = 16, h = 24;
    this.makeTexture('unit_marine', w, h, (gfx) => {
      const skin = this.getSkinTone(2);
      // Head
      gfx.fillStyle(skin);
      gfx.fillRect(6, 3, 4, 4);
      // Combat helmet
      gfx.fillStyle(0x556B2F);
      gfx.fillRect(5, 1, 6, 3);
      gfx.fillRect(5, 3, 1, 1);
      gfx.fillRect(10, 3, 1, 1);
      // Helmet strap
      gfx.fillStyle(0x333333);
      gfx.fillRect(6, 5, 4, 1);
      // Eyes
      gfx.fillStyle(0x000000);
      gfx.fillRect(7, 4, 1, 1);
      gfx.fillRect(9, 4, 1, 1);
      // Body (camo body armor)
      gfx.fillStyle(0x556B2F);
      gfx.fillRect(5, 7, 6, 5);
      // Camo pattern
      gfx.fillStyle(0x4A5F28);
      gfx.fillRect(5, 7, 2, 2);
      gfx.fillRect(9, 9, 2, 2);
      gfx.fillStyle(0x6B7F3F);
      gfx.fillRect(7, 8, 2, 2);
      // Body armor vest
      gfx.fillStyle(0x444444);
      gfx.fillRect(5, 7, 6, 2);
      // Pouches
      gfx.fillStyle(0x556B2F);
      gfx.fillRect(5, 11, 6, 1);
      gfx.fillStyle(0x333333);
      gfx.fillRect(5, 11, 2, 1);
      gfx.fillRect(9, 11, 2, 1);
      // Arms
      gfx.fillStyle(0x556B2F);
      gfx.fillRect(3, 8, 2, 5);
      gfx.fillRect(11, 8, 2, 4);
      // Assault rifle
      gfx.fillStyle(0x333333);
      gfx.fillRect(12, 5, 1, 8);
      gfx.fillRect(12, 4, 3, 1);
      // Magazine
      gfx.fillStyle(0x444444);
      gfx.fillRect(12, 8, 2, 3);
      // Legs (camo pants)
      gfx.fillStyle(0x556B2F);
      gfx.fillRect(5, 12, 3, 8);
      gfx.fillRect(8, 12, 3, 8);
      // Camo on legs
      gfx.fillStyle(0x4A5F28);
      gfx.fillRect(5, 14, 2, 2);
      gfx.fillRect(9, 16, 2, 2);
      // Combat boots
      gfx.fillStyle(0x222222);
      gfx.fillRect(5, 20, 3, 2);
      gfx.fillRect(8, 20, 3, 2);
    });
  }

  private generateSniper(): void {
    const w = 14, h = 24;
    this.makeTexture('unit_sniper', w, h, (gfx) => {
      const skin = this.getSkinTone(3);
      // Head
      gfx.fillStyle(skin);
      gfx.fillRect(5, 2, 4, 4);
      // Boonie hat
      gfx.fillStyle(0x556B2F);
      gfx.fillRect(3, 0, 8, 2);
      gfx.fillRect(4, 2, 6, 1);
      // Ghillie scraps on hat
      gfx.fillStyle(0x6B7F3F);
      gfx.fillRect(3, 0, 2, 1);
      gfx.fillRect(8, 0, 2, 1);
      // Face paint
      gfx.fillStyle(0x556B2F, 0.4);
      gfx.fillRect(5, 4, 4, 1);
      // Eyes
      gfx.fillStyle(0x000000);
      gfx.fillRect(6, 3, 1, 1);
      gfx.fillRect(8, 3, 1, 1);
      // Body (ghillie suit)
      gfx.fillStyle(0x556B2F);
      gfx.fillRect(4, 6, 6, 7);
      // Ghillie strips
      gfx.fillStyle(0x6B7F3F);
      gfx.fillRect(4, 7, 1, 3);
      gfx.fillRect(6, 8, 1, 2);
      gfx.fillRect(8, 6, 1, 3);
      gfx.fillStyle(0x4A5F28);
      gfx.fillRect(5, 10, 1, 3);
      gfx.fillRect(9, 9, 1, 2);
      // Arms
      gfx.fillStyle(0x556B2F);
      gfx.fillRect(2, 7, 2, 5);
      gfx.fillRect(10, 7, 2, 4);
      // Sniper rifle (long)
      gfx.fillStyle(0x333333);
      gfx.fillRect(11, 2, 1, 12);
      // Scope
      gfx.fillStyle(0x444444);
      gfx.fillRect(10, 3, 2, 1);
      gfx.fillStyle(0x88BBCC);
      gfx.fillRect(10, 3, 1, 1);
      // Stock
      gfx.fillStyle(0x6B4226);
      gfx.fillRect(11, 10, 1, 4);
      // Legs
      gfx.fillStyle(0x556B2F);
      gfx.fillRect(4, 13, 3, 7);
      gfx.fillRect(7, 13, 3, 7);
      // Boots
      gfx.fillStyle(0x222222);
      gfx.fillRect(4, 20, 3, 2);
      gfx.fillRect(7, 20, 3, 2);
    });
  }

  private generateTank(): void {
    const w = 24, h = 32;
    this.makeTexture('unit_tank', w, h, (gfx) => {
      // Hull (olive drab)
      gfx.fillStyle(0x556B2F);
      gfx.fillRect(2, 14, 18, 10);
      // Hull front slope
      gfx.fillStyle(0x4A5F28);
      gfx.fillRect(18, 16, 4, 6);
      // Turret
      gfx.fillStyle(0x4A5F28);
      gfx.fillRect(6, 8, 10, 6);
      // Turret hatch
      gfx.fillStyle(0x333333);
      gfx.fillRect(8, 8, 3, 1);
      // Commander's cupola
      gfx.fillStyle(0x556B2F);
      gfx.fillRect(8, 6, 3, 2);
      // Main gun barrel
      gfx.fillStyle(0x444444);
      gfx.fillRect(16, 10, 8, 2);
      // Muzzle brake
      gfx.fillStyle(0x555555);
      gfx.fillRect(22, 9, 2, 4);
      // Track assembly
      gfx.fillStyle(0x333333);
      gfx.fillRect(1, 24, 20, 6);
      // Track segments
      gfx.fillStyle(0x444444);
      for (let i = 0; i < 8; i++) {
        gfx.fillRect(2 + i * 3, 24, 1, 6);
      }
      // Road wheels
      gfx.fillStyle(0x556B2F);
      gfx.fillRect(3, 25, 3, 3);
      gfx.fillRect(8, 25, 3, 3);
      gfx.fillRect(13, 25, 3, 3);
      gfx.fillRect(18, 25, 2, 3);
      // Wheel centers
      gfx.fillStyle(0x333333);
      gfx.fillRect(4, 26, 1, 1);
      gfx.fillRect(9, 26, 1, 1);
      gfx.fillRect(14, 26, 1, 1);
      // ERA/reactive armor blocks
      gfx.fillStyle(0x6B7F3F);
      gfx.fillRect(2, 14, 2, 3);
      gfx.fillRect(2, 18, 2, 3);
      // Antenna
      gfx.fillStyle(0x333333);
      gfx.fillRect(7, 2, 1, 6);
      // Star marking
      gfx.fillStyle(0xEEEEEE);
      gfx.fillRect(10, 18, 3, 1);
      gfx.fillRect(11, 17, 1, 3);
    });
  }

  private generateAttackHelicopter(): void {
    const w = 20, h = 28;
    this.makeTexture('unit_attack_helicopter', w, h, (gfx) => {
      // Main rotor (blurred line)
      gfx.fillStyle(0x888888, 0.5);
      gfx.fillRect(0, 2, 20, 1);
      gfx.fillRect(0, 3, 20, 1);
      // Rotor hub
      gfx.fillStyle(0x333333);
      gfx.fillRect(9, 3, 2, 2);
      // Fuselage
      gfx.fillStyle(0x556B2F);
      gfx.fillRect(6, 5, 8, 10);
      // Cockpit (glass)
      gfx.fillStyle(0x88BBCC);
      gfx.fillRect(12, 6, 4, 4);
      gfx.fillStyle(0x333333);
      gfx.fillRect(12, 6, 4, 1);
      // Cockpit frame
      gfx.fillStyle(0x444444);
      gfx.fillRect(12, 8, 1, 2);
      gfx.fillRect(15, 8, 1, 2);
      // Tail boom
      gfx.fillStyle(0x4A5F28);
      gfx.fillRect(2, 8, 4, 3);
      gfx.fillRect(0, 7, 3, 2);
      // Tail rotor
      gfx.fillStyle(0x888888);
      gfx.fillRect(0, 5, 1, 5);
      // Engine housing
      gfx.fillStyle(0x444444);
      gfx.fillRect(7, 4, 6, 2);
      // Stub wings
      gfx.fillStyle(0x556B2F);
      gfx.fillRect(4, 10, 3, 2);
      gfx.fillRect(13, 10, 3, 2);
      // Missiles on pylons
      gfx.fillStyle(0x888888);
      gfx.fillRect(3, 12, 2, 4);
      gfx.fillRect(15, 12, 2, 4);
      // Missile tips
      gfx.fillStyle(0xCC2222);
      gfx.fillRect(3, 16, 2, 1);
      gfx.fillRect(15, 16, 2, 1);
      // Chain gun
      gfx.fillStyle(0x333333);
      gfx.fillRect(12, 14, 4, 1);
      gfx.fillRect(14, 14, 1, 3);
      // Landing skids
      gfx.fillStyle(0x333333);
      gfx.fillRect(5, 15, 1, 4);
      gfx.fillRect(14, 15, 1, 4);
      gfx.fillRect(4, 19, 3, 1);
      gfx.fillRect(13, 19, 3, 1);
    });
  }

  // ─────────────────── AGE 8: FUTURE ───────────────────

  private generatePlasmaTrooper(): void {
    const w = 16, h = 24;
    this.makeTexture('unit_plasma_trooper', w, h, (gfx) => {
      const skin = this.getSkinTone(4);
      // Head
      gfx.fillStyle(skin);
      gfx.fillRect(6, 3, 4, 3);
      // Visor helmet
      gfx.fillStyle(0x333344);
      gfx.fillRect(5, 1, 6, 3);
      gfx.fillStyle(0x00CED1);
      gfx.fillRect(6, 2, 4, 1);
      // Glow on visor
      gfx.fillStyle(0x44FFFF, 0.5);
      gfx.fillRect(6, 2, 4, 1);
      // Body (sleek armor)
      gfx.fillStyle(0x333344);
      gfx.fillRect(5, 6, 6, 6);
      // Energy lines on armor
      gfx.fillStyle(0x00CED1);
      gfx.fillRect(5, 7, 1, 4);
      gfx.fillRect(10, 7, 1, 4);
      gfx.fillRect(6, 10, 4, 1);
      // Chest plate
      gfx.fillStyle(0x444455);
      gfx.fillRect(6, 6, 4, 3);
      // Arms (armored)
      gfx.fillStyle(0x333344);
      gfx.fillRect(3, 7, 2, 5);
      gfx.fillRect(11, 7, 2, 4);
      // Shoulder pads
      gfx.fillStyle(0x444455);
      gfx.fillRect(3, 6, 2, 2);
      gfx.fillRect(11, 6, 2, 2);
      // Plasma rifle
      gfx.fillStyle(0x444444);
      gfx.fillRect(12, 4, 1, 8);
      gfx.fillStyle(0x00CED1);
      gfx.fillRect(13, 5, 2, 1);
      gfx.fillRect(13, 8, 1, 2);
      // Legs
      gfx.fillStyle(0x333344);
      gfx.fillRect(5, 12, 3, 8);
      gfx.fillRect(8, 12, 3, 8);
      // Energy lines on legs
      gfx.fillStyle(0x00CED1);
      gfx.fillRect(6, 14, 1, 4);
      gfx.fillRect(9, 14, 1, 4);
      // Boots (mag-lock)
      gfx.fillStyle(0x222233);
      gfx.fillRect(5, 20, 3, 2);
      gfx.fillRect(8, 20, 3, 2);
      // Boot glow
      gfx.fillStyle(0x00CED1);
      gfx.fillRect(5, 21, 3, 1);
      gfx.fillRect(8, 21, 3, 1);
    });
  }

  private generateRailGunner(): void {
    const w = 14, h = 24;
    this.makeTexture('unit_rail_gunner', w, h, (gfx) => {
      const skin = this.getSkinTone(5);
      // Head
      gfx.fillStyle(skin);
      gfx.fillRect(5, 2, 4, 4);
      // Tech visor
      gfx.fillStyle(0x333344);
      gfx.fillRect(4, 1, 6, 2);
      gfx.fillStyle(0xFF4400);
      gfx.fillRect(5, 1, 4, 1);
      // Targeting lens
      gfx.fillStyle(0xFF0000);
      gfx.fillRect(8, 2, 1, 1);
      // Eyes
      gfx.fillStyle(0x000000);
      gfx.fillRect(6, 3, 1, 1);
      // Body (lightweight tech suit)
      gfx.fillStyle(0x222233);
      gfx.fillRect(4, 6, 6, 7);
      // Power pack on chest
      gfx.fillStyle(0x00CED1);
      gfx.fillRect(5, 7, 4, 2);
      gfx.fillStyle(0x333344);
      gfx.fillRect(6, 7, 2, 2);
      // Arms
      gfx.fillStyle(0x222233);
      gfx.fillRect(2, 7, 2, 5);
      gfx.fillRect(10, 7, 2, 4);
      // Rail gun (very long)
      gfx.fillStyle(0x444444);
      gfx.fillRect(11, 1, 1, 12);
      // Rail gun coils
      gfx.fillStyle(0x00CED1);
      gfx.fillRect(10, 2, 3, 1);
      gfx.fillRect(10, 5, 3, 1);
      gfx.fillRect(10, 8, 3, 1);
      // Rail gun barrel
      gfx.fillStyle(0x555555);
      gfx.fillRect(12, 0, 2, 3);
      // Legs
      gfx.fillStyle(0x222233);
      gfx.fillRect(4, 13, 3, 7);
      gfx.fillRect(7, 13, 3, 7);
      // Boot
      gfx.fillStyle(0x333344);
      gfx.fillRect(4, 20, 3, 2);
      gfx.fillRect(7, 20, 3, 2);
    });
  }

  private generateMechWalker(): void {
    const w = 24, h = 32;
    this.makeTexture('unit_mech_walker', w, h, (gfx) => {
      // Cockpit / torso
      gfx.fillStyle(0x444455);
      gfx.fillRect(6, 4, 12, 10);
      // Cockpit window
      gfx.fillStyle(0x00CED1);
      gfx.fillRect(8, 6, 8, 4);
      gfx.fillStyle(0x333344);
      gfx.fillRect(11, 6, 1, 4);
      // Head / sensor dome
      gfx.fillStyle(0x555566);
      gfx.fillRect(8, 1, 8, 3);
      // Sensor eye
      gfx.fillStyle(0xFF4400);
      gfx.fillRect(10, 2, 4, 1);
      // Shoulder weapon mounts
      gfx.fillStyle(0x555566);
      gfx.fillRect(2, 4, 4, 6);
      gfx.fillRect(18, 4, 4, 6);
      // Arm cannons
      gfx.fillStyle(0x444444);
      gfx.fillRect(0, 6, 3, 3);
      gfx.fillRect(21, 6, 3, 3);
      // Muzzle glow
      gfx.fillStyle(0x00CED1);
      gfx.fillRect(0, 7, 1, 1);
      gfx.fillRect(23, 7, 1, 1);
      // Waist
      gfx.fillStyle(0x333344);
      gfx.fillRect(8, 14, 8, 2);
      // Legs (digitigrade mech legs)
      gfx.fillStyle(0x555566);
      gfx.fillRect(7, 16, 4, 6);
      gfx.fillRect(13, 16, 4, 6);
      // Knee joints
      gfx.fillStyle(0x333344);
      gfx.fillRect(7, 20, 4, 2);
      gfx.fillRect(13, 20, 4, 2);
      // Lower legs
      gfx.fillStyle(0x444455);
      gfx.fillRect(6, 22, 4, 6);
      gfx.fillRect(14, 22, 4, 6);
      // Feet (wide for stability)
      gfx.fillStyle(0x333344);
      gfx.fillRect(4, 28, 6, 4);
      gfx.fillRect(14, 28, 6, 4);
      // Energy core glow
      gfx.fillStyle(0x00CED1);
      gfx.fillRect(10, 10, 4, 3);
      gfx.fillStyle(0x44FFFF);
      gfx.fillRect(11, 11, 2, 1);
      // Missile pods
      gfx.fillStyle(0x444444);
      gfx.fillRect(2, 2, 4, 2);
      gfx.fillRect(18, 2, 4, 2);
      gfx.fillStyle(0x888888);
      gfx.fillRect(3, 2, 1, 1);
      gfx.fillRect(5, 2, 1, 1);
      gfx.fillRect(19, 2, 1, 1);
      gfx.fillRect(21, 2, 1, 1);
    });
  }

  private generateDroneSwarm(): void {
    const w = 20, h = 28;
    this.makeTexture('unit_drone_swarm', w, h, (gfx) => {
      // Draw multiple small drones
      const drawDrone = (x: number, y: number) => {
        // Body
        gfx.fillStyle(0x333344);
        gfx.fillRect(x, y, 4, 3);
        // Propellers
        gfx.fillStyle(0x888888, 0.6);
        gfx.fillRect(x - 1, y - 1, 2, 1);
        gfx.fillRect(x + 3, y - 1, 2, 1);
        // Eye
        gfx.fillStyle(0xFF4400);
        gfx.fillRect(x + 1, y + 1, 2, 1);
        // Energy glow
        gfx.fillStyle(0x00CED1);
        gfx.fillRect(x, y + 3, 4, 1);
      };

      drawDrone(2, 2);
      drawDrone(10, 4);
      drawDrone(6, 10);
      drawDrone(14, 8);
      drawDrone(4, 16);
      drawDrone(12, 14);
      drawDrone(8, 20);
      drawDrone(14, 20);
    });
  }

  // ─────────────────── HERO SPRITES ───────────────────

  private generateHeroGrok(): void {
    const w = 32, h = 40;
    this.makeTexture('hero_grok', w, h, (gfx) => {
      const skin = this.getSkinTone(2);
      // Head (large, bearded)
      gfx.fillStyle(skin);
      gfx.fillRect(12, 4, 8, 7);
      // Wild hair
      gfx.fillStyle(0x444444);
      gfx.fillRect(10, 2, 12, 4);
      gfx.fillRect(10, 4, 2, 3);
      gfx.fillRect(20, 4, 2, 3);
      // Beard
      gfx.fillStyle(0x555555);
      gfx.fillRect(13, 9, 6, 4);
      gfx.fillRect(14, 13, 4, 2);
      // Eyes
      gfx.fillStyle(0x000000);
      gfx.fillRect(14, 6, 2, 1);
      gfx.fillRect(18, 6, 2, 1);
      // Eyebrows (angry)
      gfx.fillStyle(0x333333);
      gfx.fillRect(13, 5, 3, 1);
      gfx.fillRect(18, 5, 3, 1);
      // Body (massive, muscular)
      gfx.fillStyle(skin);
      gfx.fillRect(8, 14, 16, 12);
      // Fur vest
      gfx.fillStyle(0x8B7355);
      gfx.fillRect(10, 14, 12, 10);
      // Fur pattern
      gfx.fillStyle(0x7A6345);
      gfx.fillRect(10, 16, 4, 3);
      gfx.fillRect(18, 17, 4, 3);
      // Bone necklace
      gfx.fillStyle(0xEEDDCC);
      gfx.fillRect(12, 13, 2, 2);
      gfx.fillRect(14, 12, 4, 1);
      gfx.fillRect(18, 13, 2, 2);
      gfx.fillRect(16, 14, 2, 1);
      // Belt
      gfx.fillStyle(0x553322);
      gfx.fillRect(8, 22, 16, 2);
      // Arms (massive)
      gfx.fillStyle(skin);
      gfx.fillRect(4, 15, 4, 10);
      gfx.fillRect(24, 15, 4, 10);
      // Arm bands
      gfx.fillStyle(0x8B7355);
      gfx.fillRect(4, 16, 4, 2);
      gfx.fillRect(24, 16, 4, 2);
      // Massive club
      gfx.fillStyle(0x5A3520);
      gfx.fillRect(27, 6, 4, 18);
      gfx.fillStyle(0x6B4226);
      gfx.fillRect(26, 4, 6, 4);
      // Club spikes (bone)
      gfx.fillStyle(0xEEDDCC);
      gfx.fillRect(25, 5, 1, 2);
      gfx.fillRect(31, 5, 1, 2);
      gfx.fillRect(28, 3, 1, 2);
      // Legs
      gfx.fillStyle(skin);
      gfx.fillRect(9, 26, 5, 10);
      gfx.fillRect(18, 26, 5, 10);
      // Fur loincloth
      gfx.fillStyle(0x8B7355);
      gfx.fillRect(8, 24, 16, 4);
      // Feet
      gfx.fillStyle(0x5C4033);
      gfx.fillRect(9, 36, 5, 4);
      gfx.fillRect(18, 36, 5, 4);
    });
  }

  private generateHeroSargon(): void {
    const w = 32, h = 40;
    this.makeTexture('hero_sargon', w, h, (gfx) => {
      const skin = this.getSkinTone(3);
      // Head
      gfx.fillStyle(skin);
      gfx.fillRect(12, 6, 8, 7);
      // Golden crown
      gfx.fillStyle(0xFFDD00);
      gfx.fillRect(10, 3, 12, 4);
      gfx.fillStyle(0xFFAA00);
      gfx.fillRect(12, 2, 2, 2);
      gfx.fillRect(18, 2, 2, 2);
      gfx.fillRect(15, 1, 2, 2);
      // Long beard
      gfx.fillStyle(0x222222);
      gfx.fillRect(13, 11, 6, 6);
      gfx.fillRect(14, 17, 4, 2);
      gfx.fillRect(15, 19, 2, 1);
      // Beard curls
      gfx.fillStyle(0x333333);
      gfx.fillRect(13, 12, 1, 3);
      gfx.fillRect(18, 12, 1, 3);
      // Eyes
      gfx.fillStyle(0x000000);
      gfx.fillRect(14, 8, 1, 1);
      gfx.fillRect(18, 8, 1, 1);
      // Body (ornate robes)
      gfx.fillStyle(0xBB9955);
      gfx.fillRect(8, 18, 16, 8);
      // Gold trim
      gfx.fillStyle(0xFFDD00);
      gfx.fillRect(8, 18, 2, 8);
      gfx.fillRect(22, 18, 2, 8);
      gfx.fillRect(8, 18, 16, 1);
      // Belt
      gfx.fillStyle(0xFFDD00);
      gfx.fillRect(8, 24, 16, 2);
      // Arms
      gfx.fillStyle(0xBB9955);
      gfx.fillRect(4, 18, 4, 8);
      gfx.fillRect(24, 18, 4, 8);
      // Gold arm bands
      gfx.fillStyle(0xFFDD00);
      gfx.fillRect(4, 19, 4, 1);
      gfx.fillRect(24, 19, 4, 1);
      // Ornate shield
      gfx.fillStyle(0xFFDD00);
      gfx.fillRect(0, 16, 5, 10);
      gfx.fillStyle(0xFFAA00);
      gfx.fillRect(1, 18, 3, 6);
      gfx.fillStyle(0xCC2222);
      gfx.fillRect(2, 19, 1, 4);
      // Sword
      gfx.fillStyle(0xCCCCCC);
      gfx.fillRect(28, 12, 2, 14);
      gfx.fillStyle(0xFFDD00);
      gfx.fillRect(27, 24, 4, 3);
      // Legs
      gfx.fillStyle(0xBB9955);
      gfx.fillRect(9, 26, 6, 10);
      gfx.fillRect(17, 26, 6, 10);
      // Sandals
      gfx.fillStyle(0x8B6914);
      gfx.fillRect(9, 36, 6, 4);
      gfx.fillRect(17, 36, 6, 4);
    });
  }

  private generateHeroLeonidas(): void {
    const w = 32, h = 40;
    this.makeTexture('hero_leonidas', w, h, (gfx) => {
      const skin = this.getSkinTone(1);
      // Red cape (flowing behind)
      gfx.fillStyle(0xCC2222);
      gfx.fillRect(2, 14, 6, 20);
      gfx.fillRect(0, 16, 4, 16);
      gfx.fillRect(0, 30, 2, 6);
      // Head
      gfx.fillStyle(skin);
      gfx.fillRect(12, 6, 8, 6);
      // Spartan helmet
      gfx.fillStyle(0xCD7F32);
      gfx.fillRect(11, 3, 10, 5);
      gfx.fillRect(12, 8, 2, 3);
      gfx.fillRect(18, 8, 2, 3);
      // Nose guard
      gfx.fillStyle(0xCD7F32);
      gfx.fillRect(15, 6, 2, 5);
      // Plume (large, red)
      gfx.fillStyle(0xCC2222);
      gfx.fillRect(14, 0, 4, 4);
      gfx.fillRect(13, 1, 6, 2);
      gfx.fillRect(12, 2, 8, 1);
      // Eyes
      gfx.fillStyle(0x000000);
      gfx.fillRect(13, 7, 2, 1);
      gfx.fillRect(17, 7, 2, 1);
      // Body (muscular, bronze armor)
      gfx.fillStyle(skin);
      gfx.fillRect(9, 12, 14, 10);
      // Bronze cuirass
      gfx.fillStyle(0xCD7F32);
      gfx.fillRect(10, 12, 12, 6);
      // Muscle detail
      gfx.fillStyle(0xB8860B);
      gfx.fillRect(14, 13, 4, 4);
      gfx.fillRect(12, 14, 2, 2);
      gfx.fillRect(18, 14, 2, 2);
      // Skirt (pteryges)
      gfx.fillStyle(0xEEEEDD);
      gfx.fillRect(9, 18, 14, 6);
      gfx.fillStyle(0xDDDDCC);
      gfx.fillRect(9, 18, 2, 6);
      gfx.fillRect(13, 18, 2, 6);
      gfx.fillRect(17, 18, 2, 6);
      gfx.fillRect(21, 18, 2, 6);
      // Arms
      gfx.fillStyle(skin);
      gfx.fillRect(5, 14, 4, 10);
      gfx.fillRect(23, 14, 4, 10);
      // Large round shield (aspis)
      gfx.fillStyle(0xCC2222);
      gfx.fillRect(0, 10, 6, 14);
      gfx.fillStyle(0xFFDD00);
      gfx.fillRect(1, 12, 4, 10);
      gfx.fillStyle(0xCC2222);
      gfx.fillRect(2, 14, 2, 6);
      // Lambda symbol on shield
      gfx.fillStyle(0xCC2222);
      gfx.fillRect(2, 14, 1, 4);
      gfx.fillRect(3, 14, 1, 4);
      gfx.fillRect(2, 18, 2, 1);
      // Spear
      gfx.fillStyle(0x6B4226);
      gfx.fillRect(27, 2, 2, 30);
      gfx.fillStyle(0xCCCCCC);
      gfx.fillRect(27, 0, 2, 4);
      // Legs
      gfx.fillStyle(skin);
      gfx.fillRect(10, 24, 5, 12);
      gfx.fillRect(17, 24, 5, 12);
      // Greaves
      gfx.fillStyle(0xCD7F32);
      gfx.fillRect(10, 28, 5, 4);
      gfx.fillRect(17, 28, 5, 4);
      // Sandals
      gfx.fillStyle(0x886622);
      gfx.fillRect(10, 36, 5, 4);
      gfx.fillRect(17, 36, 5, 4);
    });
  }

  private generateHeroJoan(): void {
    const w = 32, h = 40;
    this.makeTexture('hero_joan_of_arc', w, h, (gfx) => {
      const skin = this.getSkinTone(4);
      // Head
      gfx.fillStyle(skin);
      gfx.fillRect(12, 5, 8, 6);
      // Flowing blonde hair
      gfx.fillStyle(0xFFDD88);
      gfx.fillRect(10, 3, 12, 4);
      gfx.fillRect(10, 7, 3, 8);
      gfx.fillRect(19, 7, 3, 8);
      gfx.fillRect(11, 15, 2, 4);
      gfx.fillRect(19, 15, 2, 4);
      // Eyes
      gfx.fillStyle(0x4488CC);
      gfx.fillRect(14, 7, 1, 1);
      gfx.fillRect(18, 7, 1, 1);
      // Silver armor
      gfx.fillStyle(0xBBBBCC);
      gfx.fillRect(9, 12, 14, 10);
      // Armor detail
      gfx.fillStyle(0xAAAABB);
      gfx.fillRect(9, 14, 14, 1);
      gfx.fillRect(9, 18, 14, 1);
      // Cross on armor
      gfx.fillStyle(0xFFDD00);
      gfx.fillRect(14, 12, 4, 1);
      gfx.fillRect(15, 11, 2, 3);
      // Breastplate
      gfx.fillStyle(0xCCCCDD);
      gfx.fillRect(11, 12, 10, 4);
      // Arms (armored)
      gfx.fillStyle(0xBBBBCC);
      gfx.fillRect(5, 13, 4, 8);
      gfx.fillRect(23, 13, 4, 8);
      // Gauntlets
      gfx.fillStyle(0xAAAABB);
      gfx.fillRect(5, 19, 4, 2);
      gfx.fillRect(23, 19, 4, 2);
      // Banner/flag in left hand
      gfx.fillStyle(0x6B4226);
      gfx.fillRect(3, 0, 2, 22);
      gfx.fillStyle(0xEEEEFF);
      gfx.fillRect(0, 1, 4, 8);
      // Fleur-de-lis on banner (simplified)
      gfx.fillStyle(0xFFDD00);
      gfx.fillRect(1, 3, 2, 4);
      gfx.fillRect(0, 4, 1, 2);
      gfx.fillRect(3, 4, 1, 2);
      // Sword in right hand
      gfx.fillStyle(0xCCCCCC);
      gfx.fillRect(27, 8, 2, 14);
      gfx.fillStyle(0xFFDD00);
      gfx.fillRect(26, 20, 4, 2);
      gfx.fillStyle(0x886622);
      gfx.fillRect(27, 22, 2, 3);
      // Armored skirt
      gfx.fillStyle(0x3344AA);
      gfx.fillRect(9, 22, 14, 4);
      gfx.fillStyle(0xFFDD00);
      gfx.fillRect(9, 22, 14, 1);
      // Legs (armor)
      gfx.fillStyle(0xBBBBCC);
      gfx.fillRect(10, 26, 5, 10);
      gfx.fillRect(17, 26, 5, 10);
      // Sabatons
      gfx.fillStyle(0xAAAABB);
      gfx.fillRect(10, 36, 5, 4);
      gfx.fillRect(17, 36, 5, 4);
    });
  }

  private generateHeroNapoleon(): void {
    const w = 32, h = 40;
    this.makeTexture('hero_napoleon', w, h, (gfx) => {
      const skin = this.getSkinTone(0);
      // Head
      gfx.fillStyle(skin);
      gfx.fillRect(12, 6, 8, 6);
      // Bicorne hat (side-on)
      gfx.fillStyle(0x222244);
      gfx.fillRect(8, 2, 16, 5);
      gfx.fillRect(6, 4, 4, 2);
      gfx.fillRect(22, 4, 4, 2);
      // Cockade
      gfx.fillStyle(0xCC2222);
      gfx.fillRect(14, 3, 2, 2);
      gfx.fillStyle(0xEEEEEE);
      gfx.fillRect(16, 3, 1, 2);
      gfx.fillStyle(0x2222CC);
      gfx.fillRect(17, 3, 1, 2);
      // Eyes
      gfx.fillStyle(0x000000);
      gfx.fillRect(14, 8, 1, 1);
      gfx.fillRect(18, 8, 1, 1);
      // Sideburns
      gfx.fillStyle(0x443322);
      gfx.fillRect(12, 8, 1, 3);
      gfx.fillRect(19, 8, 1, 3);
      // Blue military coat
      gfx.fillStyle(0x222288);
      gfx.fillRect(8, 12, 16, 14);
      // White waistcoat
      gfx.fillStyle(0xEEEEEE);
      gfx.fillRect(12, 12, 8, 6);
      // Gold buttons
      gfx.fillStyle(0xFFDD00);
      gfx.fillRect(12, 13, 1, 1);
      gfx.fillRect(12, 15, 1, 1);
      gfx.fillRect(12, 17, 1, 1);
      gfx.fillRect(19, 13, 1, 1);
      gfx.fillRect(19, 15, 1, 1);
      gfx.fillRect(19, 17, 1, 1);
      // Gold epaulettes
      gfx.fillStyle(0xFFDD00);
      gfx.fillRect(5, 12, 4, 2);
      gfx.fillRect(23, 12, 4, 2);
      gfx.fillStyle(0xFFAA00);
      gfx.fillRect(5, 14, 3, 1);
      gfx.fillRect(24, 14, 3, 1);
      // Sash
      gfx.fillStyle(0xCC2222);
      gfx.fillRect(8, 22, 16, 2);
      // Arms
      gfx.fillStyle(0x222288);
      gfx.fillRect(4, 14, 4, 10);
      gfx.fillRect(24, 14, 4, 10);
      // Gold cuffs
      gfx.fillStyle(0xFFDD00);
      gfx.fillRect(4, 22, 4, 1);
      gfx.fillRect(24, 22, 4, 1);
      // Hands
      gfx.fillStyle(skin);
      gfx.fillRect(4, 23, 3, 2);
      gfx.fillRect(25, 23, 3, 2);
      // Sword
      gfx.fillStyle(0xCCCCCC);
      gfx.fillRect(28, 16, 2, 12);
      gfx.fillStyle(0xFFDD00);
      gfx.fillRect(27, 26, 4, 2);
      // White breeches
      gfx.fillStyle(0xEEEEEE);
      gfx.fillRect(10, 26, 5, 8);
      gfx.fillRect(17, 26, 5, 8);
      // Riding boots
      gfx.fillStyle(0x222222);
      gfx.fillRect(10, 34, 5, 6);
      gfx.fillRect(17, 34, 5, 6);
      // Boot tops
      gfx.fillStyle(0xFFDD00);
      gfx.fillRect(10, 34, 5, 1);
      gfx.fillRect(17, 34, 5, 1);
    });
  }

  private generateHeroIronBaron(): void {
    const w = 32, h = 40;
    this.makeTexture('hero_iron_baron', w, h, (gfx) => {
      const skin = this.getSkinTone(0);
      // Head
      gfx.fillStyle(skin);
      gfx.fillRect(12, 6, 8, 6);
      // Top hat
      gfx.fillStyle(0x222222);
      gfx.fillRect(10, 0, 12, 7);
      gfx.fillRect(8, 6, 16, 1);
      // Hat band
      gfx.fillStyle(0xCD7F32);
      gfx.fillRect(10, 5, 12, 1);
      // Goggles (pushed up)
      gfx.fillStyle(0xCD7F32);
      gfx.fillRect(11, 6, 3, 2);
      gfx.fillRect(18, 6, 3, 2);
      gfx.fillStyle(0x88BBCC);
      gfx.fillRect(12, 6, 1, 2);
      gfx.fillRect(19, 6, 1, 2);
      // Monocle
      gfx.fillStyle(0xFFDD00);
      gfx.fillRect(17, 8, 3, 3);
      gfx.fillStyle(0x88BBCC);
      gfx.fillRect(18, 9, 1, 1);
      // Eyes
      gfx.fillStyle(0x000000);
      gfx.fillRect(14, 8, 1, 1);
      gfx.fillRect(18, 8, 1, 1);
      // Mustache
      gfx.fillStyle(0x333333);
      gfx.fillRect(13, 10, 6, 1);
      gfx.fillRect(12, 10, 1, 2);
      gfx.fillRect(19, 10, 1, 2);
      // Body (vest + coat)
      gfx.fillStyle(0x3A3A3A);
      gfx.fillRect(8, 12, 16, 14);
      // Vest
      gfx.fillStyle(0x553322);
      gfx.fillRect(10, 12, 12, 8);
      // Buttons
      gfx.fillStyle(0xCD7F32);
      gfx.fillRect(15, 13, 2, 1);
      gfx.fillRect(15, 16, 2, 1);
      gfx.fillRect(15, 19, 2, 1);
      // Mechanical right arm
      gfx.fillStyle(0x888888);
      gfx.fillRect(24, 14, 6, 10);
      gfx.fillStyle(0x666666);
      gfx.fillRect(24, 16, 6, 1);
      gfx.fillRect(24, 20, 6, 1);
      // Mechanical hand (claw)
      gfx.fillStyle(0x888888);
      gfx.fillRect(25, 24, 2, 3);
      gfx.fillRect(28, 24, 2, 3);
      // Gears on arm
      gfx.fillStyle(0xCD7F32);
      gfx.fillRect(26, 17, 3, 3);
      gfx.fillStyle(0xB8860B);
      gfx.fillRect(27, 18, 1, 1);
      // Normal left arm
      gfx.fillStyle(0x3A3A3A);
      gfx.fillRect(4, 14, 4, 8);
      gfx.fillStyle(skin);
      gfx.fillRect(4, 22, 3, 2);
      // Cane / walking stick
      gfx.fillStyle(0x222222);
      gfx.fillRect(2, 18, 2, 18);
      gfx.fillStyle(0xFFDD00);
      gfx.fillRect(1, 18, 4, 2);
      // Belt with gears
      gfx.fillStyle(0x553322);
      gfx.fillRect(8, 24, 16, 2);
      gfx.fillStyle(0xCD7F32);
      gfx.fillRect(14, 24, 4, 2);
      // Legs
      gfx.fillStyle(0x3A3A3A);
      gfx.fillRect(10, 26, 5, 10);
      gfx.fillRect(17, 26, 5, 10);
      // Boots
      gfx.fillStyle(0x222222);
      gfx.fillRect(10, 36, 5, 4);
      gfx.fillRect(17, 36, 5, 4);
    });
  }

  private generateHeroSteele(): void {
    const w = 32, h = 40;
    this.makeTexture('hero_commander_steele', w, h, (gfx) => {
      const skin = this.getSkinTone(5);
      // Head
      gfx.fillStyle(skin);
      gfx.fillRect(12, 6, 8, 6);
      // Beret
      gfx.fillStyle(0x556B2F);
      gfx.fillRect(10, 3, 12, 4);
      gfx.fillRect(9, 5, 2, 1);
      // Beret badge
      gfx.fillStyle(0xFFDD00);
      gfx.fillRect(14, 4, 4, 2);
      // Radio headset
      gfx.fillStyle(0x333333);
      gfx.fillRect(10, 7, 2, 4);
      gfx.fillRect(11, 10, 3, 2);
      // Sunglasses
      gfx.fillStyle(0x222222);
      gfx.fillRect(13, 8, 3, 2);
      gfx.fillRect(17, 8, 3, 2);
      gfx.fillStyle(0x333333);
      gfx.fillRect(16, 8, 1, 2);
      // Chin / jaw
      gfx.fillStyle(skin);
      gfx.fillRect(13, 10, 6, 2);
      // Body (tactical vest)
      gfx.fillStyle(0x556B2F);
      gfx.fillRect(8, 12, 16, 12);
      // Tactical vest overlay
      gfx.fillStyle(0x444444);
      gfx.fillRect(8, 12, 16, 3);
      // Magazine pouches
      gfx.fillStyle(0x333333);
      gfx.fillRect(8, 15, 3, 3);
      gfx.fillRect(21, 15, 3, 3);
      // Body armor plate carrier
      gfx.fillStyle(0x4A5F28);
      gfx.fillRect(10, 12, 12, 8);
      // Radio on chest
      gfx.fillStyle(0x222222);
      gfx.fillRect(11, 13, 2, 3);
      gfx.fillStyle(0x44FF44);
      gfx.fillRect(11, 13, 1, 1);
      // Arms
      gfx.fillStyle(0x556B2F);
      gfx.fillRect(4, 14, 4, 10);
      gfx.fillRect(24, 14, 4, 10);
      // Tactical watch
      gfx.fillStyle(0x333333);
      gfx.fillRect(4, 22, 3, 2);
      gfx.fillStyle(0x44FF44);
      gfx.fillRect(5, 22, 1, 1);
      // Rifle
      gfx.fillStyle(0x333333);
      gfx.fillRect(27, 8, 2, 16);
      gfx.fillStyle(0x444444);
      gfx.fillRect(27, 8, 3, 2);
      // Scope
      gfx.fillStyle(0x222222);
      gfx.fillRect(26, 10, 2, 1);
      // Belt + holster
      gfx.fillStyle(0x333333);
      gfx.fillRect(8, 22, 16, 2);
      gfx.fillRect(22, 22, 3, 4);
      // Legs
      gfx.fillStyle(0x556B2F);
      gfx.fillRect(10, 24, 5, 12);
      gfx.fillRect(17, 24, 5, 12);
      // Knee pads
      gfx.fillStyle(0x333333);
      gfx.fillRect(10, 30, 5, 2);
      gfx.fillRect(17, 30, 5, 2);
      // Combat boots
      gfx.fillStyle(0x222222);
      gfx.fillRect(10, 36, 5, 4);
      gfx.fillRect(17, 36, 5, 4);
    });
  }

  private generateHeroAxiom(): void {
    const w = 32, h = 40;
    this.makeTexture('hero_axiom_7', w, h, (gfx) => {
      // Sleek robotic form
      // Head (angular)
      gfx.fillStyle(0x333344);
      gfx.fillRect(10, 4, 12, 8);
      // Face plate
      gfx.fillStyle(0x444455);
      gfx.fillRect(12, 6, 8, 4);
      // Glowing blue visor
      gfx.fillStyle(0x00CED1);
      gfx.fillRect(12, 6, 8, 2);
      gfx.fillStyle(0x44FFFF);
      gfx.fillRect(13, 6, 6, 1);
      // Antenna
      gfx.fillStyle(0x555566);
      gfx.fillRect(14, 1, 1, 3);
      gfx.fillRect(18, 1, 1, 3);
      gfx.fillStyle(0x00CED1);
      gfx.fillRect(14, 0, 1, 1);
      gfx.fillRect(18, 0, 1, 1);
      // Body (sleek armor)
      gfx.fillStyle(0x333344);
      gfx.fillRect(8, 12, 16, 12);
      // Chest core (glowing)
      gfx.fillStyle(0x00CED1);
      gfx.fillRect(13, 14, 6, 4);
      gfx.fillStyle(0x44FFFF);
      gfx.fillRect(14, 15, 4, 2);
      gfx.fillStyle(0x88FFFF);
      gfx.fillRect(15, 15, 2, 1);
      // Armor seams
      gfx.fillStyle(0x00CED1);
      gfx.fillRect(8, 16, 1, 8);
      gfx.fillRect(23, 16, 1, 8);
      gfx.fillRect(8, 22, 16, 1);
      // Shoulder pads
      gfx.fillStyle(0x444455);
      gfx.fillRect(4, 12, 4, 4);
      gfx.fillRect(24, 12, 4, 4);
      gfx.fillStyle(0x00CED1);
      gfx.fillRect(5, 13, 2, 2);
      gfx.fillRect(25, 13, 2, 2);
      // Arms
      gfx.fillStyle(0x333344);
      gfx.fillRect(4, 16, 4, 10);
      gfx.fillRect(24, 16, 4, 10);
      // Energy weapon arm
      gfx.fillStyle(0x444455);
      gfx.fillRect(26, 22, 4, 4);
      gfx.fillStyle(0x00CED1);
      gfx.fillRect(28, 20, 2, 3);
      gfx.fillStyle(0x44FFFF);
      gfx.fillRect(29, 20, 1, 2);
      // Floating bits (holographic projections)
      gfx.fillStyle(0x00CED1, 0.6);
      gfx.fillRect(0, 14, 3, 3);
      gfx.fillRect(29, 8, 3, 3);
      gfx.fillRect(1, 22, 2, 2);
      // Waist
      gfx.fillStyle(0x222233);
      gfx.fillRect(10, 24, 12, 2);
      // Legs
      gfx.fillStyle(0x333344);
      gfx.fillRect(10, 26, 5, 10);
      gfx.fillRect(17, 26, 5, 10);
      // Knee energy lines
      gfx.fillStyle(0x00CED1);
      gfx.fillRect(11, 30, 3, 1);
      gfx.fillRect(18, 30, 3, 1);
      // Feet (hover pads)
      gfx.fillStyle(0x222233);
      gfx.fillRect(9, 36, 6, 4);
      gfx.fillRect(17, 36, 6, 4);
      // Hover glow
      gfx.fillStyle(0x00CED1);
      gfx.fillRect(10, 39, 4, 1);
      gfx.fillRect(18, 39, 4, 1);
    });
  }
}
