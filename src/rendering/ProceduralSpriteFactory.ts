import Phaser from 'phaser';
import { HeroSpriteFactory } from './HeroSpriteFactory';
import { SettingsManager } from '../core/managers/SettingsManager';

// ═══════════════════════════════════════════════════════════════
//  SKIN TONE PALETTE — 6 Tones × 3 Variants (Base/Shadow/Highlight)
//  Assignments follow VISUAL_MASTER_PLAN.md Section 3
// ═══════════════════════════════════════════════════════════════

interface SkinTone {
  base: number;
  shadow: number;
  highlight: number;
}

const SKIN: Record<string, SkinTone> = {
  light:      { base: 0xFFE0BD, shadow: 0xE8C4A0, highlight: 0xFFF0DB },
  peach:      { base: 0xFFDBB4, shadow: 0xE5BF96, highlight: 0xFFECCE },
  tan:        { base: 0xD4A574, shadow: 0xB88B5E, highlight: 0xE8BB8A },
  olive:      { base: 0xC68642, shadow: 0xA87035, highlight: 0xD89C56 },
  brown:      { base: 0x8D5524, shadow: 0x744818, highlight: 0xA66930 },
  darkBrown:  { base: 0x6B3A2A, shadow: 0x562E20, highlight: 0x7E4B38 },
};

// ═══════════════════════════════════════════════════════════════
//  OUTLINE & SHADOW
// ═══════════════════════════════════════════════════════════════
const OUTLINE = 0x1A1A1A;
const SHADOW_COLOR = 0x000000;
const SHADOW_ALPHA = 0.25;

// ═══════════════════════════════════════════════════════════════
//  UNIT SPRITE SIZES per archetype
// ═══════════════════════════════════════════════════════════════
const UNIT_SPRITE_SIZES: Record<string, [number, number]> = {
  infantry: [16, 24],
  ranged:   [14, 24],
  heavy:    [24, 32],
  special:  [20, 28],
  hero:     [32, 40],
};

// ═══════════════════════════════════════════════════════════════
//  ProceduralSpriteFactory
//
//  Generates unique pixel-art textures for all 32 units (and
//  delegates hero generation to HeroSpriteFactory).
//  Each unit is drawn as a detailed pixel-art character following
//  the VISUAL_MASTER_PLAN.md Section 4 specifications.
//
//  Every unit gets 2 textures: unitId_player and unitId_enemy,
//  with subtle blue/red tinting on accent pieces.
// ═══════════════════════════════════════════════════════════════
export class ProceduralSpriteFactory {
  private scene: Phaser.Scene;
  private generated = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  // ─────────────────── PUBLIC API ───────────────────

  /**
   * Generate all unit and hero textures. Call once during scene create.
   */
  generateAll(): void {
    if (this.generated) return;
    this.generated = true;
    this.generateAllTextures(this.scene);
  }

  /**
   * Generate all 64 unit textures (32 units × 2 factions) plus hero textures.
   */
  generateAllTextures(_scene: Phaser.Scene): void {
    // Age 1 — Prehistoric
    this.generateClubman();
    this.generateSlinger();
    this.generateDinoRider();
    this.generatePackRaptors();

    // Age 2 — Bronze Age
    this.generateSpearman();
    this.generateJavelinThrower();
    this.generateWarChariot();
    this.generateWarElephant();

    // Age 3 — Classical
    this.generateHoplite();
    this.generateBowman();
    this.generateCenturion();
    this.generatePhalanx();

    // Age 4 — Medieval
    this.generateSwordsman();
    this.generateCrossbowman();
    this.generateKnight();
    this.generateTrebuchet();

    // Age 5 — Gunpowder
    this.generateMusketeer();
    this.generateGrenadier();
    this.generateCavalry();
    this.generateCannon();

    // Age 6 — Industrial
    this.generateRifleman();
    this.generateMachineGunner();
    this.generateSteamTank();
    this.generateZeppelinBomber();

    // Age 7 — Modern
    this.generateMarine();
    this.generateSniper();
    this.generateTank();
    this.generateAttackHelicopter();

    // Age 8 — Future
    this.generatePlasmaTrooper();
    this.generateRailGunner();
    this.generateMechWalker();
    this.generateDroneSwarm();

    // Generate 8 hero textures (delegated to HeroSpriteFactory for detailed sprites)
    const heroFactory = new HeroSpriteFactory(this.scene);
    heroFactory.generateAllHeroes();
  }

  /**
   * Get the texture key for a given unit.
   */
  getUnitTextureKey(unitId: string, faction: 'player' | 'enemy'): string {
    return `unit_${unitId}_${faction}`;
  }

  /** Alias used by some callers. */
  getTextureKey(unitId: string, faction: 'player' | 'enemy'): string {
    return this.getUnitTextureKey(unitId, faction);
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

  // ─────────────────── CORE HELPERS ───────────────────

  /**
   * Create a texture for both player and enemy factions.
   * Applies a subtle faction tint overlay.
   */
  private makeTexture(
    key: string,
    w: number,
    h: number,
    drawFn: (gfx: Phaser.GameObjects.Graphics) => void
  ): void {
    for (const faction of ['player', 'enemy'] as const) {
      const textureKey = `${key}_${faction}`;
      if (this.scene.textures.exists(textureKey)) continue;

      const gfx = this.scene.add.graphics();
      drawFn(gfx);

      // Faction tint overlay — subtle blue (player) or red/orange (enemy)
      const settings = SettingsManager.getInstance();
      const cbMode = settings.get('colorblindMode');
      const enemyAccent = cbMode !== 'none' ? 0xFFAA00 : 0xFF4444;
      const tintColor = faction === 'player' ? 0x4488FF : enemyAccent;
      gfx.fillStyle(tintColor, 0.12);
      gfx.fillRect(0, 0, w, h);

      gfx.generateTexture(textureKey, w, h);
      gfx.destroy();
    }
  }

  /** Draw 1px outline rectangle. */
  private ol(
    gfx: Phaser.GameObjects.Graphics,
    x: number, y: number, w: number, h: number
  ): void {
    gfx.lineStyle(1, OUTLINE, 1);
    gfx.strokeRect(x, y, w, h);
  }

  /** Draw a foot shadow ellipse under a character. */
  private shd(
    gfx: Phaser.GameObjects.Graphics,
    cx: number, y: number, rx: number
  ): void {
    gfx.fillStyle(SHADOW_COLOR, SHADOW_ALPHA);
    gfx.fillEllipse(cx, y, rx * 2, 3);
  }

  /** Fill a rect shorthand. */
  private fr(
    gfx: Phaser.GameObjects.Graphics,
    color: number,
    x: number, y: number, w: number, h: number
  ): void {
    gfx.fillStyle(color);
    gfx.fillRect(x, y, w, h);
  }

  // ═══════════════════════════════════════════════════════════════
  //  AGE 1: PREHISTORIC
  // ═══════════════════════════════════════════════════════════════

  /**
   * Clubman — Infantry, 16×24, Skin: Brown (#8D5524)
   * Muscular bare-chested caveman with fur loincloth, wooden club, bone necklace.
   */
  private generateClubman(): void {
    const w = 16, h = 24;
    const sk = SKIN.brown;
    this.makeTexture('unit_clubman', w, h, (gfx) => {
      // Shadow under feet
      this.shd(gfx, 8, 23, 4);

      // === LEGS (skin) ===
      this.fr(gfx, sk.base, 5, 15, 3, 6);
      this.fr(gfx, sk.base, 8, 15, 3, 6);
      this.fr(gfx, sk.shadow, 7, 16, 2, 4);    // Inner leg shadow

      // === FEET (bare — skin color) ===
      this.fr(gfx, sk.shadow, 4, 21, 4, 2);
      this.fr(gfx, sk.shadow, 8, 21, 4, 2);

      // === BODY ===
      this.fr(gfx, sk.base, 5, 7, 6, 5);        // Bare chest
      this.fr(gfx, sk.highlight, 6, 8, 4, 2);    // Chest highlight
      this.fr(gfx, 0x8B6914, 5, 12, 6, 3);       // Fur loincloth
      this.fr(gfx, 0x7A5C12, 6, 13, 2, 2);       // Loincloth shadow

      // === ARMS (skin) ===
      this.fr(gfx, sk.base, 3, 8, 2, 6);
      this.fr(gfx, sk.shadow, 3, 8, 1, 6);       // Left arm shadow
      this.fr(gfx, sk.base, 11, 8, 2, 6);
      this.fr(gfx, sk.highlight, 12, 9, 1, 3);

      // === WEAPON: Wooden club ===
      this.fr(gfx, 0x6B4226, 13, 5, 2, 8);       // Shaft (3×8 vert stick)
      this.fr(gfx, 0x5A3520, 12, 3, 4, 3);        // Knobby 4×3 top
      this.fr(gfx, 0x7A5236, 13, 4, 2, 1);        // Club highlight

      // === HEAD (4×4 square, skin) ===
      this.fr(gfx, sk.base, 6, 2, 4, 4);
      this.fr(gfx, sk.highlight, 7, 3, 2, 2);
      // Wild brown hair tufts on top
      this.fr(gfx, 0x3D2B1F, 5, 1, 6, 2);
      this.fr(gfx, 0x3D2B1F, 5, 0, 2, 1);        // Left tuft
      this.fr(gfx, 0x3D2B1F, 9, 0, 2, 1);        // Right tuft
      this.fr(gfx, 0x3D2B1F, 7, 0, 1, 1);         // Center tuft
      // Eyes
      this.fr(gfx, 0x000000, 7, 3, 1, 1);
      this.fr(gfx, 0x000000, 9, 3, 1, 1);

      // === BONE NECKLACE (3 white 1px dots at neck) ===
      this.fr(gfx, 0xF5E6C8, 6, 6, 1, 1);
      this.fr(gfx, 0xF5E6C8, 8, 6, 1, 1);
      this.fr(gfx, 0xF5E6C8, 10, 7, 1, 1);

      // === 1px BLACK OUTLINE ===
      this.ol(gfx, 4, 0, 8, 22);
    });
  }

  /**
   * Slinger — Ranged, 14×24, Skin: Light (#FFE0BD)
   * Leaner build with hide vest, sling in right hand, spare stones in left.
   */
  private generateSlinger(): void {
    const w = 14, h = 24;
    const sk = SKIN.light;
    this.makeTexture('unit_slinger', w, h, (gfx) => {
      this.shd(gfx, 7, 23, 3);

      // Legs
      this.fr(gfx, sk.base, 4, 14, 3, 7);
      this.fr(gfx, sk.base, 7, 14, 3, 7);
      this.fr(gfx, sk.shadow, 6, 15, 2, 4);
      // Leather wrapping feet
      this.fr(gfx, 0x5C4033, 3, 21, 4, 2);
      this.fr(gfx, 0x5C4033, 7, 21, 4, 2);

      // Body — hide vest
      this.fr(gfx, 0xA0845C, 4, 6, 6, 7);
      this.fr(gfx, 0x8F7550, 5, 7, 4, 1);         // Vest texture
      this.fr(gfx, 0x8F7550, 5, 10, 4, 1);
      this.fr(gfx, sk.base, 4, 6, 2, 2);           // Exposed shoulder

      // Arms
      this.fr(gfx, sk.base, 2, 7, 2, 5);
      this.fr(gfx, sk.shadow, 2, 7, 1, 5);
      this.fr(gfx, sk.base, 10, 7, 2, 5);

      // Head
      this.fr(gfx, sk.base, 5, 2, 4, 4);
      this.fr(gfx, sk.highlight, 6, 3, 2, 2);
      // Short lighter brown hair
      this.fr(gfx, 0x7A6040, 4, 1, 6, 2);
      this.fr(gfx, 0x7A6040, 4, 2, 1, 1);
      // Eyes
      this.fr(gfx, 0x000000, 6, 3, 1, 1);
      this.fr(gfx, 0x000000, 8, 3, 1, 1);

      // Sling + pouch in right hand
      this.fr(gfx, 0x6B4226, 12, 6, 1, 4);
      this.fr(gfx, 0x6B4226, 12, 6, 2, 1);
      this.fr(gfx, 0x5C4033, 13, 7, 1, 2);         // Pouch visible

      // Spare stones in left hand (2-3 grey dots)
      this.fr(gfx, 0x888888, 1, 11, 1, 1);
      this.fr(gfx, 0x999999, 2, 12, 1, 1);
      this.fr(gfx, 0x777777, 1, 12, 1, 1);

      this.ol(gfx, 3, 1, 8, 21);
    });
  }

  /**
   * Dino Rider — Heavy, 24×32, Skin: Olive (#C68642)
   * Small rider on green dinosaur with spear. Dino has 4 legs, tail, jaw.
   */
  private generateDinoRider(): void {
    const w = 24, h = 32;
    const sk = SKIN.olive;
    this.makeTexture('unit_dino_rider', w, h, (gfx) => {
      this.shd(gfx, 12, 31, 8);

      // ─── DINOSAUR ───
      // Body green
      this.fr(gfx, 0x4A7A3D, 4, 14, 14, 10);
      // Lighter belly
      this.fr(gfx, 0x7AB85C, 6, 20, 10, 4);
      // Dino head forward
      this.fr(gfx, 0x4A7A3D, 16, 10, 6, 7);
      this.fr(gfx, 0x5A8A4D, 18, 11, 4, 4);
      // Open jaw
      this.fr(gfx, 0x3A6A2D, 18, 16, 4, 2);
      // Yellow eye 1px
      this.fr(gfx, 0xFFCC00, 20, 11, 2, 2);
      this.fr(gfx, 0x000000, 21, 12, 1, 1);
      // Teeth
      this.fr(gfx, 0xFFFFFF, 19, 15, 1, 1);
      this.fr(gfx, 0xFFFFFF, 21, 15, 1, 1);
      // 4 Legs
      this.fr(gfx, 0x3A6A2D, 5, 24, 3, 6);
      this.fr(gfx, 0x3A6A2D, 9, 24, 3, 6);
      this.fr(gfx, 0x3A6A2D, 13, 24, 3, 6);
      this.fr(gfx, 0x4A7A3D, 7, 24, 3, 5);        // Inner visible leg
      // Claws
      this.fr(gfx, 0x333333, 5, 30, 3, 1);
      this.fr(gfx, 0x333333, 13, 30, 3, 1);
      // Tail extending back
      this.fr(gfx, 0x4A7A3D, 0, 16, 5, 4);
      this.fr(gfx, 0x3A6A2D, 0, 18, 3, 3);

      // ─── RIDER (Olive skin) ───
      this.fr(gfx, 0x8B6914, 8, 6, 5, 8);           // Leather armor
      this.fr(gfx, 0x7A5C12, 9, 7, 3, 2);
      // Head
      this.fr(gfx, sk.base, 9, 2, 4, 4);
      this.fr(gfx, sk.highlight, 10, 3, 2, 2);
      // Hair
      this.fr(gfx, 0x222222, 8, 1, 6, 2);
      // Eyes
      this.fr(gfx, 0x000000, 10, 3, 1, 1);
      this.fr(gfx, 0x000000, 12, 3, 1, 1);
      // Legs draped over dino
      this.fr(gfx, sk.shadow, 7, 13, 2, 3);
      this.fr(gfx, sk.shadow, 13, 13, 2, 3);
      // Spear pointing forward
      this.fr(gfx, 0x6B4226, 14, 3, 1, 11);
      this.fr(gfx, 0xCCCCCC, 14, 1, 1, 3);

      this.ol(gfx, 0, 1, 22, 30);
    });
  }

  /**
   * Pack Raptors — Special, 20×28
   * 3 small raptors in triangle formation. No human. Red eyes, teeth, upward tail.
   */
  private generatePackRaptors(): void {
    const w = 20, h = 28;
    this.makeTexture('unit_pack_raptors', w, h, (gfx) => {
      this.shd(gfx, 10, 27, 7);

      const drawRaptor = (x: number, y: number, color: number, belly: number) => {
        // Body
        this.fr(gfx, color, x, y + 4, 6, 5);
        // Lighter belly
        this.fr(gfx, belly, x + 1, y + 6, 4, 3);
        // Head
        this.fr(gfx, color, x + 5, y + 2, 4, 4);
        // Red eye 1px
        this.fr(gfx, 0xFF0000, x + 7, y + 3, 1, 1);
        // Jaw
        this.fr(gfx, 0x333333, x + 7, y + 5, 2, 1);
        // Teeth white dots
        this.fr(gfx, 0xFFFFFF, x + 8, y + 4, 1, 1);
        // Tail curves up
        this.fr(gfx, color, x - 2, y + 4, 3, 2);
        this.fr(gfx, color, x - 3, y + 3, 2, 2);
        // Legs
        this.fr(gfx, 0x3D5A2A, x + 1, y + 9, 2, 4);
        this.fr(gfx, 0x3D5A2A, x + 4, y + 9, 2, 4);
        // Claws
        this.fr(gfx, 0x444444, x + 1, y + 13, 2, 1);
        this.fr(gfx, 0x444444, x + 4, y + 13, 2, 1);
      };

      // Triangle formation
      drawRaptor(8, 0, 0x5A7A3D, 0x8AAA6D);
      drawRaptor(2, 7, 0x4D6B32, 0x7D9B62);
      drawRaptor(10, 10, 0x6B8A4D, 0x9BBA7D);
    });
  }

  // ═══════════════════════════════════════════════════════════════
  //  AGE 2: BRONZE AGE
  // ═══════════════════════════════════════════════════════════════

  /**
   * Spearman — Infantry, 16×24, Skin: Tan (#D4A574)
   * Cloth wrap skirt, bare chest w/ leather strap, bronze headband, spear + small shield.
   */
  private generateSpearman(): void {
    const w = 16, h = 24;
    const sk = SKIN.tan;
    this.makeTexture('unit_spearman', w, h, (gfx) => {
      this.shd(gfx, 8, 23, 4);

      // Legs
      this.fr(gfx, sk.base, 5, 15, 3, 5);
      this.fr(gfx, sk.base, 8, 15, 3, 5);
      this.fr(gfx, sk.shadow, 7, 16, 2, 3);
      // Sandals
      this.fr(gfx, 0x8B4513, 4, 20, 4, 2);
      this.fr(gfx, 0x8B4513, 8, 20, 4, 2);

      // Body — bare chest + cloth skirt + shoulder strap
      this.fr(gfx, sk.base, 5, 7, 6, 4);            // Bare chest
      this.fr(gfx, sk.highlight, 6, 8, 4, 2);
      this.fr(gfx, 0xF4E4BA, 5, 11, 6, 4);          // Cloth wrap skirt
      this.fr(gfx, 0xE8D8AE, 6, 12, 2, 2);          // Fold shadow
      this.fr(gfx, 0x8B4513, 5, 7, 1, 5);            // Leather strap

      // Arms
      this.fr(gfx, sk.base, 3, 8, 2, 5);
      this.fr(gfx, sk.shadow, 3, 8, 1, 5);
      this.fr(gfx, sk.base, 11, 8, 2, 5);

      // Head
      this.fr(gfx, sk.base, 6, 3, 4, 4);
      this.fr(gfx, sk.highlight, 7, 4, 2, 2);
      // Short black hair + bronze headband
      this.fr(gfx, 0x2D2D2D, 5, 2, 6, 2);
      this.fr(gfx, 0xCD853F, 5, 3, 6, 1);
      // Eyes
      this.fr(gfx, 0x000000, 7, 4, 1, 1);
      this.fr(gfx, 0x000000, 9, 4, 1, 1);

      // Shield — small round bronze
      this.fr(gfx, 0xCD853F, 1, 8, 3, 5);
      this.fr(gfx, 0x996515, 2, 9, 1, 3);

      // Spear — held upward at angle
      this.fr(gfx, 0x8B4513, 13, 2, 1, 16);
      this.fr(gfx, 0xCD853F, 12, 0, 3, 3);          // Bronze tip

      this.ol(gfx, 4, 0, 8, 22);
    });
  }

  /**
   * Javelin Thrower — Ranged, 14×24, Skin: Dark Brown (#6B3A2A)
   * Linen wrap, one shoulder exposed, shaved head, 2 javelins on back, 1 in throwing pos.
   */
  private generateJavelinThrower(): void {
    const w = 14, h = 24;
    const sk = SKIN.darkBrown;
    this.makeTexture('unit_javelin_thrower', w, h, (gfx) => {
      this.shd(gfx, 7, 23, 3);

      // Legs
      this.fr(gfx, sk.base, 4, 14, 3, 6);
      this.fr(gfx, sk.base, 7, 14, 3, 6);
      this.fr(gfx, sk.shadow, 6, 15, 2, 4);
      // Sandals
      this.fr(gfx, 0x8B4513, 3, 20, 4, 2);
      this.fr(gfx, 0x8B4513, 7, 20, 4, 2);

      // Body — linen wrap, one shoulder exposed
      this.fr(gfx, 0xF4E4BA, 4, 6, 6, 8);
      this.fr(gfx, 0xE8D8AE, 5, 8, 4, 1);
      this.fr(gfx, sk.base, 4, 6, 2, 3);            // Exposed shoulder

      // Arms — throwing pose (right arm raised)
      this.fr(gfx, sk.base, 2, 7, 2, 5);
      this.fr(gfx, sk.shadow, 2, 7, 1, 5);
      this.fr(gfx, sk.base, 10, 5, 2, 5);           // Right arm up
      // Bronze armband
      this.fr(gfx, 0xCD853F, 10, 6, 2, 1);

      // Head
      this.fr(gfx, sk.base, 5, 2, 4, 4);
      this.fr(gfx, sk.highlight, 6, 3, 2, 2);
      // Very short/shaved
      this.fr(gfx, 0x2D2D2D, 5, 1, 4, 2);
      // Eyes
      this.fr(gfx, 0x000000, 6, 3, 1, 1);
      this.fr(gfx, 0x000000, 8, 3, 1, 1);

      // Javelin in throwing position
      this.fr(gfx, 0x8B4513, 11, 1, 1, 8);
      this.fr(gfx, 0xCD853F, 11, 0, 1, 2);

      // 2 javelins on back
      this.fr(gfx, 0x8B4513, 1, 3, 1, 8);
      this.fr(gfx, 0x8B4513, 2, 4, 1, 7);
      this.fr(gfx, 0xCD853F, 1, 2, 1, 2);
      this.fr(gfx, 0xCD853F, 2, 3, 1, 2);

      this.ol(gfx, 3, 0, 8, 22);
    });
  }

  /**
   * War Chariot — Heavy, 24×32, Skin: Light (#FFE0BD)
   * Bronze/wood chariot, 2 spoked wheels, dark brown horse, driver + archer.
   */
  private generateWarChariot(): void {
    const w = 24, h = 32;
    const sk = SKIN.light;
    this.makeTexture('unit_war_chariot', w, h, (gfx) => {
      this.shd(gfx, 12, 31, 9);

      // ─── HORSE ───
      this.fr(gfx, 0x4A3020, 16, 10, 6, 8);
      this.fr(gfx, 0x3A2010, 16, 14, 6, 2);
      this.fr(gfx, 0x4A3020, 20, 6, 3, 6);          // Head/neck
      this.fr(gfx, 0x5A3828, 21, 7, 2, 3);
      this.fr(gfx, 0x000000, 22, 7, 1, 1);           // Eye
      this.fr(gfx, 0x3A2010, 17, 18, 2, 8);          // Front legs
      this.fr(gfx, 0x3A2010, 21, 18, 2, 8);
      this.fr(gfx, 0x222222, 17, 26, 2, 1);
      this.fr(gfx, 0x222222, 21, 26, 2, 1);
      this.fr(gfx, 0x222222, 19, 7, 1, 5);           // Mane

      // ─── CHARIOT ───
      this.fr(gfx, 0x8B4513, 3, 18, 14, 4);
      this.fr(gfx, 0xCD853F, 3, 16, 2, 6);           // Bronze side L
      this.fr(gfx, 0xCD853F, 15, 16, 2, 6);          // Bronze side R
      // Spoked wheels
      this.fr(gfx, 0x6B4226, 4, 22, 5, 5);
      this.fr(gfx, 0xCD853F, 5, 23, 3, 3);
      this.fr(gfx, 0x4A3020, 6, 22, 1, 5);
      this.fr(gfx, 0x4A3020, 4, 24, 5, 1);
      this.fr(gfx, 0x6B4226, 12, 22, 5, 5);
      this.fr(gfx, 0xCD853F, 13, 23, 3, 3);
      this.fr(gfx, 0x4A3020, 14, 22, 1, 5);
      this.fr(gfx, 0x4A3020, 12, 24, 5, 1);

      // ─── DRIVER ───
      this.fr(gfx, 0xF4E4BA, 6, 8, 5, 10);
      this.fr(gfx, sk.base, 7, 4, 4, 4);
      this.fr(gfx, sk.highlight, 8, 5, 2, 2);
      this.fr(gfx, 0xCD853F, 6, 3, 6, 2);            // Bronze helmet
      this.fr(gfx, 0x000000, 8, 5, 1, 1);
      this.fr(gfx, 0x000000, 10, 5, 1, 1);
      this.fr(gfx, sk.base, 5, 9, 2, 4);              // Arms
      this.fr(gfx, sk.base, 11, 9, 2, 4);
      this.fr(gfx, 0x5C4033, 12, 12, 5, 1);           // Reins

      // Archer companion behind
      this.fr(gfx, 0xF4E4BA, 9, 9, 4, 7);
      this.fr(gfx, 0x8B4513, 14, 6, 1, 8);            // Bow

      this.ol(gfx, 2, 3, 21, 24);
    });
  }

  /**
   * War Elephant — Special, 20×28
   * Large grey elephant w/ tusks, howdah on top, rider w/ javelin, decorative cloth.
   */
  private generateWarElephant(): void {
    const w = 20, h = 28;
    const sk = SKIN.olive;
    this.makeTexture('unit_war_elephant', w, h, (gfx) => {
      this.shd(gfx, 10, 27, 7);

      // ─── ELEPHANT ───
      this.fr(gfx, 0x808080, 3, 10, 14, 10);         // Body
      this.fr(gfx, 0x909090, 5, 12, 10, 4);           // Highlight
      // Head
      this.fr(gfx, 0x808080, 14, 6, 6, 8);
      this.fr(gfx, 0x909090, 15, 7, 4, 4);
      // Ears
      this.fr(gfx, 0x707070, 13, 7, 2, 4);
      // Eye
      this.fr(gfx, 0x000000, 17, 8, 1, 1);
      // Trunk curves forward
      this.fr(gfx, 0x808080, 18, 14, 2, 6);
      this.fr(gfx, 0x707070, 17, 18, 2, 3);
      // Tusks — ivory
      this.fr(gfx, 0xF5E6C8, 17, 12, 1, 3);
      this.fr(gfx, 0xF5E6C8, 19, 12, 1, 3);
      // Legs
      this.fr(gfx, 0x707070, 4, 20, 3, 6);
      this.fr(gfx, 0x707070, 8, 20, 3, 6);
      this.fr(gfx, 0x707070, 12, 20, 3, 6);
      // Feet
      this.fr(gfx, 0x606060, 4, 26, 3, 2);
      this.fr(gfx, 0x606060, 12, 26, 3, 2);
      // Tail
      this.fr(gfx, 0x707070, 1, 12, 3, 2);
      this.fr(gfx, 0x606060, 0, 13, 2, 1);

      // ─── HOWDAH ───
      this.fr(gfx, 0x8B4513, 4, 6, 10, 4);
      this.fr(gfx, 0xCD853F, 4, 6, 1, 4);
      this.fr(gfx, 0xCD853F, 13, 6, 1, 4);

      // ─── RIDER ───
      this.fr(gfx, sk.base, 7, 2, 3, 3);
      this.fr(gfx, sk.highlight, 8, 3, 1, 1);
      this.fr(gfx, 0x000000, 8, 3, 1, 1);
      this.fr(gfx, 0xF4E4BA, 7, 5, 3, 3);             // Body
      this.fr(gfx, 0x8B4513, 10, 2, 1, 7);             // Javelin
      this.fr(gfx, 0xCD853F, 10, 1, 1, 2);

      // Decorative cloth
      this.fr(gfx, 0xCC4444, 3, 12, 14, 1);
      this.fr(gfx, 0xFFDD00, 3, 14, 14, 1);

      this.ol(gfx, 0, 1, 20, 27);
    });
  }

  // ═══════════════════════════════════════════════════════════════
  //  AGE 3: CLASSICAL
  // ═══════════════════════════════════════════════════════════════

  /**
   * Hoplite — Infantry, 16×24, Skin: Peach (#FFDBB4)
   * Bronze breastplate over white tunic, Corinthian helmet w/ red plume, large aspis shield.
   */
  private generateHoplite(): void {
    const w = 16, h = 24;
    const sk = SKIN.peach;
    this.makeTexture('unit_hoplite', w, h, (gfx) => {
      this.shd(gfx, 8, 23, 4);

      // Legs
      this.fr(gfx, sk.base, 5, 15, 3, 5);
      this.fr(gfx, sk.base, 8, 15, 3, 5);
      // Bronze greaves
      this.fr(gfx, 0xCD853F, 5, 17, 3, 2);
      this.fr(gfx, 0xCD853F, 8, 17, 3, 2);
      // Sandals
      this.fr(gfx, 0x8B4513, 4, 20, 4, 2);
      this.fr(gfx, 0x8B4513, 8, 20, 4, 2);

      // Body — white tunic under bronze breastplate
      this.fr(gfx, 0xE8E0D0, 5, 7, 6, 8);
      this.fr(gfx, 0xCD853F, 5, 7, 6, 4);             // Breastplate
      this.fr(gfx, 0xB8860B, 6, 8, 4, 2);              // Detail

      // Arms
      this.fr(gfx, sk.base, 3, 8, 2, 5);
      this.fr(gfx, sk.shadow, 3, 8, 1, 5);
      this.fr(gfx, sk.base, 11, 8, 2, 5);

      // Head
      this.fr(gfx, sk.base, 6, 3, 4, 4);
      this.fr(gfx, sk.highlight, 7, 4, 2, 2);
      // Corinthian helmet + red plume (3px tall)
      this.fr(gfx, 0xCD853F, 5, 2, 6, 3);
      this.fr(gfx, 0xCD853F, 6, 5, 1, 2);
      this.fr(gfx, 0xCD853F, 9, 5, 1, 2);
      this.fr(gfx, 0xC41E3A, 7, 0, 2, 3);              // Red plume
      this.fr(gfx, 0xD42E4A, 7, 0, 1, 2);
      // Eyes through helmet
      this.fr(gfx, 0x000000, 7, 4, 1, 1);
      this.fr(gfx, 0x000000, 9, 4, 1, 1);

      // Shield — large round aspis (red + bronze trim)
      this.fr(gfx, 0xC41E3A, 0, 6, 4, 8);
      this.fr(gfx, 0xCD853F, 0, 6, 4, 1);
      this.fr(gfx, 0xCD853F, 0, 13, 4, 1);
      this.fr(gfx, 0xB8860B, 1, 9, 2, 3);

      // Short sword (xiphos)
      this.fr(gfx, 0x808080, 13, 5, 2, 8);
      this.fr(gfx, 0xC0C0C0, 14, 6, 1, 5);
      this.fr(gfx, 0xB8860B, 13, 12, 2, 2);

      this.ol(gfx, 4, 0, 8, 22);
    });
  }

  /**
   * Bowman — Ranged, 14×24, Skin: Brown (#8D5524)
   * Simple white tunic, leather belt, bow held sideways, quiver on back.
   */
  private generateBowman(): void {
    const w = 14, h = 24;
    const sk = SKIN.brown;
    this.makeTexture('unit_bowman', w, h, (gfx) => {
      this.shd(gfx, 7, 23, 3);

      // Legs
      this.fr(gfx, sk.base, 4, 14, 3, 6);
      this.fr(gfx, sk.base, 7, 14, 3, 6);
      this.fr(gfx, sk.shadow, 6, 15, 2, 4);
      // Sandals
      this.fr(gfx, 0x8B4513, 3, 20, 4, 2);
      this.fr(gfx, 0x8B4513, 7, 20, 4, 2);

      // Body — simple tunic + belt
      this.fr(gfx, 0xE8E0D0, 4, 6, 6, 8);
      this.fr(gfx, 0xD8D0C0, 5, 7, 4, 2);
      this.fr(gfx, 0x8B4513, 4, 11, 6, 1);

      // Arms
      this.fr(gfx, sk.base, 2, 7, 2, 5);
      this.fr(gfx, sk.shadow, 2, 7, 1, 5);
      this.fr(gfx, sk.base, 10, 7, 2, 4);

      // Head
      this.fr(gfx, sk.base, 5, 2, 4, 4);
      this.fr(gfx, sk.highlight, 6, 3, 2, 2);
      // Short curly dark hair
      this.fr(gfx, 0x2D2D2D, 4, 1, 6, 2);
      this.fr(gfx, 0x2D2D2D, 4, 2, 1, 1);
      this.fr(gfx, 0x2D2D2D, 9, 2, 1, 1);
      // Eyes
      this.fr(gfx, 0x000000, 6, 3, 1, 1);
      this.fr(gfx, 0x000000, 8, 3, 1, 1);

      // Bow held sideways + arrow nocked
      this.fr(gfx, 0x8B4513, 12, 3, 1, 10);
      this.fr(gfx, 0xCCBB88, 11, 4, 1, 8);           // Bowstring
      this.fr(gfx, 0x8B4513, 10, 7, 3, 1);            // Arrow shaft
      this.fr(gfx, 0x808080, 13, 7, 1, 1);            // Arrow tip

      // Quiver on back (3 arrow tips visible)
      this.fr(gfx, 0x8B4513, 1, 5, 2, 8);
      this.fr(gfx, 0x808080, 1, 4, 1, 2);
      this.fr(gfx, 0x808080, 2, 4, 1, 2);

      this.ol(gfx, 3, 1, 8, 21);
    });
  }

  /**
   * Centurion — Heavy, 24×32, Skin: Tan (#D4A574)
   * Full lorica segmentata, imperial helmet with tall red transverse crest, gladius, scutum.
   */
  private generateCenturion(): void {
    const w = 24, h = 32;
    const sk = SKIN.tan;
    this.makeTexture('unit_centurion', w, h, (gfx) => {
      this.shd(gfx, 12, 31, 6);

      // Legs
      this.fr(gfx, sk.base, 8, 22, 4, 6);
      this.fr(gfx, sk.base, 12, 22, 4, 6);
      this.fr(gfx, 0xCD853F, 8, 24, 4, 2);            // Bronze greaves
      this.fr(gfx, 0xCD853F, 12, 24, 4, 2);
      this.fr(gfx, 0x8B4513, 8, 28, 4, 2);             // Sandals
      this.fr(gfx, 0x8B4513, 12, 28, 4, 2);

      // Red tunic visible below armor
      this.fr(gfx, 0xC41E3A, 8, 18, 8, 5);

      // Body — lorica segmentata
      this.fr(gfx, 0x808080, 7, 9, 10, 10);
      for (let i = 0; i < 4; i++) {
        this.fr(gfx, 0x909090, 7, 10 + i * 2, 10, 1);
      }
      this.fr(gfx, 0x707070, 8, 11, 8, 1);

      // Red cape flowing behind
      this.fr(gfx, 0xC41E3A, 4, 10, 3, 14);
      this.fr(gfx, 0xA01828, 5, 12, 2, 10);

      // Arms
      this.fr(gfx, sk.base, 5, 10, 3, 7);
      this.fr(gfx, sk.shadow, 5, 10, 1, 7);
      this.fr(gfx, sk.base, 17, 10, 3, 7);

      // Head
      this.fr(gfx, sk.base, 9, 4, 6, 5);
      this.fr(gfx, sk.highlight, 10, 5, 4, 3);
      this.fr(gfx, 0x000000, 10, 6, 1, 1);
      this.fr(gfx, 0x000000, 13, 6, 1, 1);

      // Imperial helmet with tall red TRANSVERSE crest — THE defining feature
      this.fr(gfx, 0xCD853F, 8, 2, 8, 4);
      this.fr(gfx, 0xB8860B, 9, 3, 6, 2);
      this.fr(gfx, 0xC41E3A, 7, 0, 10, 2);           // Transverse crest
      this.fr(gfx, 0xD42E4A, 8, 0, 8, 1);
      this.fr(gfx, 0xCD853F, 8, 6, 1, 2);             // Cheek guard L
      this.fr(gfx, 0xCD853F, 15, 6, 1, 2);            // Cheek guard R

      // Gladius
      this.fr(gfx, 0xC0C0C0, 19, 8, 2, 10);
      this.fr(gfx, 0xE0E0E0, 20, 9, 1, 7);
      this.fr(gfx, 0xB8860B, 19, 16, 2, 2);

      // Scutum (rectangular, red + gold eagle)
      this.fr(gfx, 0xC41E3A, 1, 8, 4, 12);
      this.fr(gfx, 0xB8860B, 2, 10, 2, 8);
      this.fr(gfx, 0xCD853F, 2, 13, 2, 2);

      this.ol(gfx, 3, 0, 18, 30);
    });
  }

  /**
   * Phalanx — Special, 20×28
   * 4 Hoplites in tight formation with overlapping shields, spears forward.
   */
  private generatePhalanx(): void {
    const w = 20, h = 28;
    this.makeTexture('unit_phalanx', w, h, (gfx) => {
      this.shd(gfx, 10, 27, 8);

      const drawShieldUnit = (x: number, skin: SkinTone) => {
        // Shield (overlapping)
        this.fr(gfx, 0xC41E3A, x, 6, 5, 14);
        this.fr(gfx, 0xCD853F, x, 6, 5, 1);
        this.fr(gfx, 0xCD853F, x, 19, 5, 1);
        this.fr(gfx, 0xB8860B, x + 1, 10, 3, 6);
        this.fr(gfx, 0xCD853F, x + 2, 12, 1, 2);
        // Head
        this.fr(gfx, skin.base, x + 1, 2, 3, 3);
        this.fr(gfx, skin.highlight, x + 1, 3, 2, 1);
        // Helmet + plume
        this.fr(gfx, 0xCD853F, x, 1, 5, 2);
        this.fr(gfx, 0xC41E3A, x + 1, 0, 3, 1);
        // Eyes
        this.fr(gfx, 0x000000, x + 1, 3, 1, 1);
        this.fr(gfx, 0x000000, x + 3, 3, 1, 1);
        // Spear tip
        this.fr(gfx, 0xCCCCCC, x + 4, 0, 1, 3);
        // Legs
        this.fr(gfx, skin.base, x + 1, 20, 2, 6);
        this.fr(gfx, skin.shadow, x + 3, 20, 2, 6);
        this.fr(gfx, 0x8B4513, x + 1, 26, 2, 2);
        this.fr(gfx, 0x8B4513, x + 3, 26, 2, 2);
      };

      drawShieldUnit(0, SKIN.darkBrown);
      drawShieldUnit(5, SKIN.peach);
      drawShieldUnit(10, SKIN.tan);

      // Spear shafts
      this.fr(gfx, 0x8B4513, 15, 2, 1, 22);
      this.fr(gfx, 0x8B4513, 17, 2, 1, 22);
      this.fr(gfx, 0x8B4513, 19, 3, 1, 21);
    });
  }

  // ═══════════════════════════════════════════════════════════════
  //  AGE 4: MEDIEVAL
  // ═══════════════════════════════════════════════════════════════

  /**
   * Swordsman — Infantry, 16×24, Skin: Olive (#C68642)
   * Chain mail over blue tabard w/ white cross, iron helm w/ nose guard, longsword.
   */
  private generateSwordsman(): void {
    const w = 16, h = 24;
    const sk = SKIN.olive;
    this.makeTexture('unit_swordsman', w, h, (gfx) => {
      this.shd(gfx, 8, 23, 4);

      // Legs — chain mail
      this.fr(gfx, 0x808080, 5, 14, 3, 6);
      this.fr(gfx, 0x707070, 8, 14, 3, 6);
      // Boots
      this.fr(gfx, 0x654321, 4, 20, 4, 2);
      this.fr(gfx, 0x654321, 8, 20, 4, 2);

      // Body — chain mail + blue tabard + white cross
      this.fr(gfx, 0x808080, 5, 7, 6, 7);
      this.fr(gfx, 0x4682B4, 6, 7, 4, 7);
      this.fr(gfx, 0xFFFFFF, 7, 8, 2, 5);             // Cross V
      this.fr(gfx, 0xFFFFFF, 6, 10, 4, 1);             // Cross H

      // Arms
      this.fr(gfx, 0x808080, 3, 8, 2, 5);
      this.fr(gfx, 0x707070, 3, 8, 1, 5);
      this.fr(gfx, 0x808080, 11, 8, 2, 5);

      // Head
      this.fr(gfx, sk.base, 6, 3, 4, 4);
      this.fr(gfx, sk.highlight, 7, 4, 2, 2);
      // Iron helm + nose guard
      this.fr(gfx, 0x808080, 5, 1, 6, 3);
      this.fr(gfx, 0x909090, 6, 2, 4, 1);
      this.fr(gfx, 0x808080, 7, 4, 2, 2);
      // Eyes
      this.fr(gfx, 0x000000, 6, 4, 1, 1);
      this.fr(gfx, 0x000000, 9, 4, 1, 1);

      // Longsword — point upward
      this.fr(gfx, 0xC0C0C0, 13, 3, 2, 10);
      this.fr(gfx, 0xE0E0E0, 14, 4, 1, 7);
      this.fr(gfx, 0xDAA520, 12, 11, 4, 2);           // Gold guard
      this.fr(gfx, 0x654321, 13, 13, 2, 2);           // Grip

      this.ol(gfx, 4, 1, 8, 21);
    });
  }

  /**
   * Crossbowman — Ranged, 14×24, Skin: Light (#FFE0BD)
   * Padded gambeson, kettle helm, crossbow at hip, bolt quiver on belt.
   */
  private generateCrossbowman(): void {
    const w = 14, h = 24;
    const sk = SKIN.light;
    this.makeTexture('unit_crossbowman', w, h, (gfx) => {
      this.shd(gfx, 7, 23, 3);

      // Legs
      this.fr(gfx, 0x654321, 4, 14, 3, 6);
      this.fr(gfx, 0x5A3A1C, 7, 14, 3, 6);
      // Boots
      this.fr(gfx, 0x4A2A10, 3, 20, 4, 2);
      this.fr(gfx, 0x4A2A10, 7, 20, 4, 2);

      // Body — padded gambeson
      this.fr(gfx, 0x654321, 4, 6, 6, 8);
      this.fr(gfx, 0x5A3A1C, 5, 7, 4, 2);             // Quilting
      this.fr(gfx, 0x5A3A1C, 5, 11, 4, 1);
      this.fr(gfx, 0x3D2B1F, 4, 10, 6, 1);             // Belt

      // Arms
      this.fr(gfx, 0x654321, 2, 7, 2, 5);
      this.fr(gfx, 0x654321, 10, 7, 2, 4);

      // Head
      this.fr(gfx, sk.base, 5, 2, 4, 4);
      this.fr(gfx, sk.highlight, 6, 3, 2, 2);
      // Kettle helm (wide brim)
      this.fr(gfx, 0x808080, 4, 1, 6, 2);
      this.fr(gfx, 0x909090, 5, 1, 4, 1);
      this.fr(gfx, 0x707070, 3, 2, 8, 1);
      // Eyes
      this.fr(gfx, 0x000000, 6, 3, 1, 1);
      this.fr(gfx, 0x000000, 8, 3, 1, 1);

      // Crossbow at hip level
      this.fr(gfx, 0x654321, 10, 8, 3, 1);             // Stock
      this.fr(gfx, 0x808080, 12, 6, 1, 5);              // Metal prod
      this.fr(gfx, 0xCCCCCC, 10, 7, 3, 1);             // Bolt

      // Bolt quiver on belt
      this.fr(gfx, 0x4A2A10, 1, 7, 2, 6);
      this.fr(gfx, 0x808080, 1, 6, 2, 2);

      this.ol(gfx, 3, 1, 8, 21);
    });
  }

  /**
   * Knight — Heavy, 24×32, Skin: Dark Brown (#6B3A2A) (only visible through helmet slit)
   * Full plate armor, blue surcoat, great helm w/ gold crown, lance, mounted on brown horse.
   */
  private generateKnight(): void {
    const w = 24, h = 32;
    this.makeTexture('unit_knight', w, h, (gfx) => {
      this.shd(gfx, 12, 31, 8);

      // ─── HORSE ───
      this.fr(gfx, 0x8B4513, 4, 16, 14, 8);
      this.fr(gfx, 0x7A3A10, 6, 18, 10, 4);
      this.fr(gfx, 0x8B4513, 16, 12, 4, 8);
      this.fr(gfx, 0x9B5523, 17, 13, 3, 4);
      this.fr(gfx, 0x8B4513, 18, 10, 3, 4);          // Head
      this.fr(gfx, 0x000000, 19, 11, 1, 1);
      // Legs
      this.fr(gfx, 0x7A3A10, 5, 24, 2, 6);
      this.fr(gfx, 0x7A3A10, 9, 24, 2, 6);
      this.fr(gfx, 0x7A3A10, 14, 24, 2, 6);
      this.fr(gfx, 0x333333, 5, 30, 2, 1);
      this.fr(gfx, 0x333333, 9, 30, 2, 1);
      this.fr(gfx, 0x333333, 14, 30, 2, 1);
      this.fr(gfx, 0x222222, 15, 12, 1, 6);           // Mane
      this.fr(gfx, 0x222222, 2, 17, 3, 2);             // Tail
      this.fr(gfx, 0x222222, 1, 19, 2, 2);
      // Blue caparison
      this.fr(gfx, 0x4682B4, 4, 16, 14, 2);
      this.fr(gfx, 0x3A72A4, 6, 17, 10, 1);

      // ─── KNIGHT (plate armor) ───
      this.fr(gfx, 0xC0C0C0, 7, 6, 8, 10);
      this.fr(gfx, 0xE0E0E0, 8, 7, 6, 3);
      this.fr(gfx, 0xA0A0A0, 7, 10, 8, 1);
      this.fr(gfx, 0xA0A0A0, 7, 13, 8, 1);
      // Blue surcoat
      this.fr(gfx, 0x4682B4, 8, 11, 6, 5);
      this.fr(gfx, 0xDAA520, 10, 12, 2, 3);           // Heraldic lion

      // Arms
      this.fr(gfx, 0xC0C0C0, 4, 8, 3, 6);
      this.fr(gfx, 0xA0A0A0, 4, 8, 1, 6);
      this.fr(gfx, 0xC0C0C0, 15, 8, 3, 6);

      // Head — great helm
      this.fr(gfx, 0xC0C0C0, 8, 1, 6, 5);
      this.fr(gfx, 0xE0E0E0, 9, 2, 4, 2);
      this.fr(gfx, 0x333333, 9, 4, 4, 1);              // Visor slit
      // Gold crown
      this.fr(gfx, 0xDAA520, 8, 0, 6, 2);
      this.fr(gfx, 0xDAA520, 9, 0, 1, 1);
      this.fr(gfx, 0xDAA520, 12, 0, 1, 1);

      // Lance
      this.fr(gfx, 0x808080, 19, 2, 1, 14);
      this.fr(gfx, 0xC0C0C0, 19, 0, 1, 3);

      // Shield w/ heraldic lion
      this.fr(gfx, 0x4682B4, 1, 7, 4, 8);
      this.fr(gfx, 0xDAA520, 2, 9, 2, 4);

      this.ol(gfx, 1, 0, 20, 31);
    });
  }

  /**
   * Trebuchet — Special, 20×28
   * Siege weapon: wooden A-frame, long beam w/ counterweight, sling w/ boulder, wheels.
   */
  private generateTrebuchet(): void {
    const w = 20, h = 28;
    this.makeTexture('unit_trebuchet', w, h, (gfx) => {
      this.shd(gfx, 10, 27, 7);

      // Wooden platform + wheels
      this.fr(gfx, 0x654321, 2, 20, 16, 3);
      this.fr(gfx, 0x5A3A1C, 3, 21, 14, 1);
      this.fr(gfx, 0x654321, 3, 23, 4, 4);
      this.fr(gfx, 0x8B4513, 4, 24, 2, 2);
      this.fr(gfx, 0x654321, 13, 23, 4, 4);
      this.fr(gfx, 0x8B4513, 14, 24, 2, 2);

      // A-frame
      this.fr(gfx, 0x8B4513, 8, 8, 2, 12);
      this.fr(gfx, 0x8B4513, 10, 8, 2, 12);
      this.fr(gfx, 0x654321, 7, 8, 6, 2);

      // Main beam
      this.fr(gfx, 0x8B4513, 3, 6, 16, 2);
      this.fr(gfx, 0x7A3A10, 4, 7, 14, 1);

      // Counterweight
      this.fr(gfx, 0x808080, 2, 4, 4, 4);
      this.fr(gfx, 0x707070, 3, 5, 2, 2);

      // Sling
      this.fr(gfx, 0x5C4033, 16, 4, 1, 4);
      this.fr(gfx, 0x5C4033, 17, 6, 2, 1);

      // Boulder
      this.fr(gfx, 0x808080, 17, 3, 3, 3);
      this.fr(gfx, 0x909090, 18, 4, 1, 1);

      this.ol(gfx, 1, 3, 18, 24);
    });
  }

  // ═══════════════════════════════════════════════════════════════
  //  AGE 5: GUNPOWDER
  // ═══════════════════════════════════════════════════════════════

  /**
   * Musketeer — Infantry, 16×24, Skin: Tan (#D4A574)
   * Navy blue coat w/ gold buttons, white pants, tricorn hat, musket w/ bayonet, white crossbelts.
   */
  private generateMusketeer(): void {
    const w = 16, h = 24;
    const sk = SKIN.tan;
    this.makeTexture('unit_musketeer', w, h, (gfx) => {
      this.shd(gfx, 8, 23, 4);

      // White pants
      this.fr(gfx, 0xECF0F1, 5, 14, 3, 6);
      this.fr(gfx, 0xDCE0E1, 8, 14, 3, 6);
      // Black boots
      this.fr(gfx, 0x1C1C1C, 4, 20, 4, 2);
      this.fr(gfx, 0x1C1C1C, 8, 20, 4, 2);

      // Navy coat + gold buttons
      this.fr(gfx, 0x2C3E50, 5, 7, 6, 7);
      this.fr(gfx, 0x3A4E60, 6, 8, 4, 2);
      this.fr(gfx, 0xF1C40F, 7, 8, 1, 1);
      this.fr(gfx, 0xF1C40F, 7, 10, 1, 1);
      this.fr(gfx, 0xF1C40F, 8, 8, 1, 1);
      this.fr(gfx, 0xF1C40F, 8, 10, 1, 1);
      // White crossbelts X
      this.fr(gfx, 0xECF0F1, 5, 7, 1, 7);
      this.fr(gfx, 0xECF0F1, 10, 7, 1, 7);
      this.fr(gfx, 0xECF0F1, 6, 9, 1, 1);
      this.fr(gfx, 0xECF0F1, 9, 9, 1, 1);
      this.fr(gfx, 0xECF0F1, 7, 10, 2, 1);

      // Arms
      this.fr(gfx, 0x2C3E50, 3, 8, 2, 5);
      this.fr(gfx, 0x2C3E50, 11, 8, 2, 5);

      // Head
      this.fr(gfx, sk.base, 6, 3, 4, 4);
      this.fr(gfx, sk.highlight, 7, 4, 2, 2);
      this.fr(gfx, 0x000000, 7, 4, 1, 1);
      this.fr(gfx, 0x000000, 9, 4, 1, 1);
      // Tricorn hat + gold trim
      this.fr(gfx, 0x2C3E50, 5, 1, 6, 3);
      this.fr(gfx, 0x3A4E60, 6, 2, 4, 1);
      this.fr(gfx, 0xF1C40F, 5, 3, 6, 1);
      this.fr(gfx, 0x2C3E50, 4, 2, 1, 1);
      this.fr(gfx, 0x2C3E50, 11, 2, 1, 1);

      // Musket + bayonet
      this.fr(gfx, 0x654321, 13, 5, 2, 8);
      this.fr(gfx, 0x7F8C8D, 13, 3, 2, 4);
      this.fr(gfx, 0xC0C0C0, 14, 2, 1, 2);

      this.ol(gfx, 4, 1, 8, 21);
    });
  }

  /**
   * Grenadier — Ranged, 14×24, Skin: Brown (#8D5524)
   * Red coat w/ white trim, tall mitre cap, grenade in throwing position, bandolier.
   */
  private generateGrenadier(): void {
    const w = 14, h = 24;
    const sk = SKIN.brown;
    this.makeTexture('unit_grenadier', w, h, (gfx) => {
      this.shd(gfx, 7, 23, 3);

      // White pants
      this.fr(gfx, 0xECF0F1, 4, 14, 3, 6);
      this.fr(gfx, 0xDCE0E1, 7, 14, 3, 6);
      this.fr(gfx, 0x1C1C1C, 3, 20, 4, 2);
      this.fr(gfx, 0x1C1C1C, 7, 20, 4, 2);

      // Red coat + white trim
      this.fr(gfx, 0x8B0000, 4, 6, 6, 8);
      this.fr(gfx, 0x9B1010, 5, 7, 4, 2);
      this.fr(gfx, 0xECF0F1, 4, 6, 1, 8);
      this.fr(gfx, 0xECF0F1, 9, 6, 1, 8);
      // Bandolier with grenades
      this.fr(gfx, 0xECF0F1, 5, 7, 4, 1);
      this.fr(gfx, 0x333333, 5, 8, 1, 1);
      this.fr(gfx, 0x333333, 7, 8, 1, 1);
      this.fr(gfx, 0x333333, 9, 8, 1, 1);

      // Arms
      this.fr(gfx, 0x8B0000, 2, 7, 2, 5);
      this.fr(gfx, sk.base, 10, 5, 2, 4);              // Right arm raised

      // Head
      this.fr(gfx, sk.base, 5, 2, 4, 4);
      this.fr(gfx, sk.highlight, 6, 3, 2, 2);
      this.fr(gfx, 0x000000, 6, 3, 1, 1);
      this.fr(gfx, 0x000000, 8, 3, 1, 1);
      // Tall mitre cap — THE distinguishing feature
      this.fr(gfx, 0x8B0000, 5, 0, 4, 3);
      this.fr(gfx, 0x9B1010, 6, 0, 2, 2);
      this.fr(gfx, 0xF1C40F, 6, 2, 2, 1);

      // Grenade in throwing position
      this.fr(gfx, 0x333333, 11, 4, 2, 2);
      this.fr(gfx, 0xFF6600, 12, 3, 1, 1);              // Lit fuse

      this.ol(gfx, 3, 0, 8, 22);
    });
  }

  /**
   * Cavalry — Heavy, 24×32, Skin: Peach (#FFDBB4)
   * Blue hussar jacket w/ gold braid, shako, sabre raised, mounted on white horse.
   */
  private generateCavalry(): void {
    const w = 24, h = 32;
    const sk = SKIN.peach;
    this.makeTexture('unit_cavalry', w, h, (gfx) => {
      this.shd(gfx, 12, 31, 8);

      // ─── WHITE HORSE ───
      this.fr(gfx, 0xECF0F1, 4, 16, 14, 8);
      this.fr(gfx, 0xDCE0E1, 6, 18, 10, 4);
      this.fr(gfx, 0xECF0F1, 16, 12, 4, 8);
      this.fr(gfx, 0xECF0F1, 18, 10, 3, 4);
      this.fr(gfx, 0x000000, 19, 11, 1, 1);
      this.fr(gfx, 0xDCE0E1, 5, 24, 2, 6);
      this.fr(gfx, 0xDCE0E1, 9, 24, 2, 6);
      this.fr(gfx, 0xDCE0E1, 14, 24, 2, 6);
      this.fr(gfx, 0x999999, 5, 30, 2, 1);
      this.fr(gfx, 0x999999, 9, 30, 2, 1);
      this.fr(gfx, 0x999999, 14, 30, 2, 1);
      this.fr(gfx, 0xCCCCCC, 15, 12, 1, 6);
      this.fr(gfx, 0xCCCCCC, 2, 17, 3, 2);
      this.fr(gfx, 0x2C3E50, 5, 16, 12, 2);           // Blue saddle cloth

      // ─── RIDER ───
      this.fr(gfx, 0x2C3E50, 7, 6, 8, 10);
      this.fr(gfx, 0x3A4E60, 8, 7, 6, 4);
      // Gold braid
      this.fr(gfx, 0xF1C40F, 8, 7, 1, 5);
      this.fr(gfx, 0xF1C40F, 9, 9, 2, 1);
      this.fr(gfx, 0xF1C40F, 11, 7, 1, 5);
      // Arms
      this.fr(gfx, 0x2C3E50, 4, 8, 3, 5);
      this.fr(gfx, 0x2C3E50, 15, 7, 3, 4);
      // Head
      this.fr(gfx, sk.base, 9, 2, 4, 4);
      this.fr(gfx, sk.highlight, 10, 3, 2, 2);
      this.fr(gfx, 0x000000, 10, 3, 1, 1);
      this.fr(gfx, 0x000000, 12, 3, 1, 1);
      // Shako + plume
      this.fr(gfx, 0x2C3E50, 8, 0, 6, 3);
      this.fr(gfx, 0x3A4E60, 9, 1, 4, 1);
      this.fr(gfx, 0xF1C40F, 8, 2, 6, 1);
      this.fr(gfx, 0xECF0F1, 13, 0, 2, 2);           // White plume

      // Sabre raised
      this.fr(gfx, 0xC0C0C0, 17, 1, 1, 8);
      this.fr(gfx, 0xE0E0E0, 17, 2, 1, 5);
      this.fr(gfx, 0xDAA520, 17, 8, 1, 2);

      this.ol(gfx, 1, 0, 20, 31);
    });
  }

  /**
   * Cannon — Special, 20×28
   * Siege weapon: long iron barrel on wooden carriage, large spoked wheels, cannonball stack.
   */
  private generateCannon(): void {
    const w = 20, h = 28;
    this.makeTexture('unit_cannon', w, h, (gfx) => {
      this.shd(gfx, 10, 22, 7);

      // Wooden carriage
      this.fr(gfx, 0x654321, 3, 14, 14, 4);
      this.fr(gfx, 0x5A3A1C, 4, 15, 12, 2);
      // Trail
      this.fr(gfx, 0x654321, 0, 16, 4, 2);
      this.fr(gfx, 0x5A3A1C, 1, 17, 2, 1);
      // Wheels
      this.fr(gfx, 0x654321, 4, 18, 5, 5);
      this.fr(gfx, 0x8B4513, 5, 19, 3, 3);
      this.fr(gfx, 0x4A2A10, 6, 18, 1, 5);
      this.fr(gfx, 0x4A2A10, 4, 20, 5, 1);
      this.fr(gfx, 0x654321, 11, 18, 5, 5);
      this.fr(gfx, 0x8B4513, 12, 19, 3, 3);
      this.fr(gfx, 0x4A2A10, 13, 18, 1, 5);
      this.fr(gfx, 0x4A2A10, 11, 20, 5, 1);

      // Iron barrel
      this.fr(gfx, 0x7F8C8D, 8, 8, 10, 4);
      this.fr(gfx, 0x8F9C9D, 9, 9, 8, 2);
      this.fr(gfx, 0x6F7C7D, 8, 12, 4, 2);
      this.fr(gfx, 0x5F6C6D, 17, 9, 2, 2);

      // Cannonball stack (3)
      this.fr(gfx, 0x1C1C1C, 2, 10, 2, 2);
      this.fr(gfx, 0x1C1C1C, 4, 10, 2, 2);
      this.fr(gfx, 0x1C1C1C, 3, 8, 2, 2);

      this.ol(gfx, 0, 8, 19, 16);
    });
  }

  // ═══════════════════════════════════════════════════════════════
  //  AGE 6: INDUSTRIAL
  // ═══════════════════════════════════════════════════════════════

  /**
   * Rifleman — Infantry, 16×24, Skin: Light (#FFE0BD)
   * Olive drab tunic w/ belt, puttees, tin helmet, bolt-action rifle w/ bayonet, backpack.
   */
  private generateRifleman(): void {
    const w = 16, h = 24;
    const sk = SKIN.light;
    this.makeTexture('unit_rifleman', w, h, (gfx) => {
      this.shd(gfx, 8, 23, 4);

      // Legs — olive puttees
      this.fr(gfx, 0x556B2F, 5, 14, 3, 6);
      this.fr(gfx, 0x4A5F28, 8, 14, 3, 6);
      this.fr(gfx, 0x4A5F28, 5, 16, 3, 1);            // Puttee wrapping
      this.fr(gfx, 0x4A5F28, 5, 18, 3, 1);
      // Boots
      this.fr(gfx, 0x3D2B1F, 4, 20, 4, 2);
      this.fr(gfx, 0x3D2B1F, 8, 20, 4, 2);

      // Olive drab tunic
      this.fr(gfx, 0x556B2F, 5, 6, 6, 8);
      this.fr(gfx, 0x667B3F, 6, 7, 4, 3);
      this.fr(gfx, 0x654321, 5, 12, 6, 1);             // Belt
      // Small backpack
      this.fr(gfx, 0x556B2F, 3, 7, 2, 5);
      this.fr(gfx, 0x4A5F28, 3, 8, 2, 3);

      // Arms
      this.fr(gfx, 0x556B2F, 3, 8, 2, 5);
      this.fr(gfx, 0x556B2F, 11, 8, 2, 5);

      // Head
      this.fr(gfx, sk.base, 6, 3, 4, 4);
      this.fr(gfx, sk.highlight, 7, 4, 2, 2);
      this.fr(gfx, 0x000000, 7, 4, 1, 1);
      this.fr(gfx, 0x000000, 9, 4, 1, 1);
      // Tin helmet (Brodie)
      this.fr(gfx, 0x808080, 5, 1, 6, 3);
      this.fr(gfx, 0x909090, 6, 2, 4, 1);
      this.fr(gfx, 0x707070, 4, 3, 8, 1);

      // Bolt-action rifle + bayonet
      this.fr(gfx, 0x654321, 13, 5, 2, 8);
      this.fr(gfx, 0x808080, 13, 3, 2, 4);
      this.fr(gfx, 0xC0C0C0, 14, 1, 1, 3);

      this.ol(gfx, 4, 1, 8, 21);
    });
  }

  /**
   * Machine Gunner — Ranged, 14×24, Skin: Dark Brown (#6B3A2A)
   * Dark coat, flat cap, ammo belts over shoulders, belt-fed MG on bipod, gold ammo chain.
   */
  private generateMachineGunner(): void {
    const w = 14, h = 24;
    const sk = SKIN.darkBrown;
    this.makeTexture('unit_machine_gunner', w, h, (gfx) => {
      this.shd(gfx, 7, 23, 3);

      // Legs
      this.fr(gfx, 0x2C2C2C, 4, 14, 3, 6);
      this.fr(gfx, 0x222222, 7, 14, 3, 6);
      this.fr(gfx, 0x1C1C1C, 3, 20, 4, 2);
      this.fr(gfx, 0x1C1C1C, 7, 20, 4, 2);

      // Dark coat + ammo belts
      this.fr(gfx, 0x2C2C2C, 4, 6, 6, 8);
      this.fr(gfx, 0x3C3C3C, 5, 7, 4, 2);
      this.fr(gfx, 0xD4A017, 4, 6, 1, 7);              // Gold ammo belt L
      this.fr(gfx, 0xD4A017, 9, 6, 1, 7);              // R
      this.fr(gfx, 0xC49007, 5, 8, 1, 1);
      this.fr(gfx, 0xC49007, 8, 8, 1, 1);

      // Arms
      this.fr(gfx, 0x2C2C2C, 2, 7, 2, 5);
      this.fr(gfx, sk.base, 10, 7, 2, 5);

      // Head
      this.fr(gfx, sk.base, 5, 2, 4, 4);
      this.fr(gfx, sk.highlight, 6, 3, 2, 2);
      this.fr(gfx, 0x000000, 6, 3, 1, 1);
      this.fr(gfx, 0x000000, 8, 3, 1, 1);
      // Flat cap
      this.fr(gfx, 0x2C2C2C, 4, 1, 6, 2);
      this.fr(gfx, 0x3C3C3C, 5, 1, 4, 1);
      this.fr(gfx, 0x222222, 3, 2, 8, 1);

      // Machine gun at hip, belt-fed
      this.fr(gfx, 0x808080, 10, 8, 4, 2);
      this.fr(gfx, 0x707070, 12, 7, 2, 1);
      this.fr(gfx, 0x808080, 11, 10, 1, 3);
      this.fr(gfx, 0x808080, 13, 10, 1, 3);             // Bipod
      this.fr(gfx, 0xD4A017, 10, 10, 1, 3);             // Ammo chain

      this.ol(gfx, 3, 1, 8, 21);
    });
  }

  /**
   * Steam Tank — Heavy, 24×32
   * Iron hull w/ rivets, smokestack, turret w/ stubby cannon, tracks, steam vents, amber glow.
   */
  private generateSteamTank(): void {
    const w = 24, h = 32;
    this.makeTexture('unit_steam_tank', w, h, (gfx) => {
      this.shd(gfx, 12, 27, 8);

      // Tracks
      this.fr(gfx, 0x2C2C2C, 2, 22, 20, 4);
      this.fr(gfx, 0x1C1C1C, 3, 23, 18, 2);
      for (let i = 0; i < 6; i++) {
        this.fr(gfx, 0x3C3C3C, 4 + i * 3, 22, 2, 4);
      }

      // Iron hull
      this.fr(gfx, 0x4A4A4A, 3, 10, 18, 12);
      this.fr(gfx, 0x5A5A5A, 4, 11, 16, 4);
      // Rivets
      const rivetY = [10, 20];
      for (const ry of rivetY) {
        for (let rx = 4; rx <= 20; rx += 4) {
          this.fr(gfx, 0x6A6A6A, rx, ry, 1, 1);
        }
      }
      // Furnace window glow
      this.fr(gfx, 0xD4A017, 6, 16, 2, 2);
      this.fr(gfx, 0xE4B027, 7, 16, 1, 1);

      // Smokestack
      this.fr(gfx, 0x2C2C2C, 8, 3, 3, 7);
      this.fr(gfx, 0x3C3C3C, 9, 4, 1, 5);
      this.fr(gfx, 0xCCCCCC, 7, 1, 3, 2);              // Smoke puffs
      this.fr(gfx, 0xBBBBBB, 8, 0, 2, 1);

      // Turret
      this.fr(gfx, 0x5A5A5A, 12, 6, 8, 6);
      this.fr(gfx, 0x6A6A6A, 13, 7, 6, 4);
      this.fr(gfx, 0x808080, 19, 8, 4, 2);              // Stubby cannon
      this.fr(gfx, 0x909090, 20, 8, 2, 1);

      // Steam vents
      this.fr(gfx, 0x4A4A4A, 1, 14, 2, 2);
      this.fr(gfx, 0xCCCCCC, 0, 13, 2, 1);
      this.fr(gfx, 0x4A4A4A, 21, 14, 2, 2);
      this.fr(gfx, 0xCCCCCC, 22, 13, 2, 1);

      this.ol(gfx, 1, 0, 22, 26);
    });
  }

  /**
   * Zeppelin Bomber — Special (AIR), 20×28
   * Elongated gas bag w/ cross-hatching, gondola, 2 propellers, bombs, tail fins, flag.
   */
  private generateZeppelinBomber(): void {
    const w = 20, h = 28;
    this.makeTexture('unit_zeppelin_bomber', w, h, (gfx) => {
      // AIR UNIT — no ground shadow

      // Gas bag — elongated oval
      this.fr(gfx, 0xC0C0C0, 2, 2, 16, 10);
      this.fr(gfx, 0xD0D0D0, 4, 3, 12, 8);
      // Cross-hatching
      this.fr(gfx, 0xB0B0B0, 6, 4, 1, 6);
      this.fr(gfx, 0xB0B0B0, 10, 4, 1, 6);
      this.fr(gfx, 0xB0B0B0, 14, 4, 1, 6);
      this.fr(gfx, 0xB0B0B0, 4, 5, 12, 1);
      this.fr(gfx, 0xB0B0B0, 4, 8, 12, 1);

      // Tail fins
      this.fr(gfx, 0xA0A0A0, 1, 4, 2, 3);
      this.fr(gfx, 0xA0A0A0, 1, 9, 2, 3);

      // Gondola
      this.fr(gfx, 0x654321, 6, 13, 8, 4);
      this.fr(gfx, 0x7A5331, 7, 14, 6, 2);
      this.fr(gfx, 0x88CCFF, 8, 14, 2, 1);              // Window

      // Engines + propellers
      this.fr(gfx, 0x808080, 4, 13, 2, 3);
      this.fr(gfx, 0x808080, 14, 13, 2, 3);
      this.fr(gfx, 0xCCCCCC, 3, 14, 1, 1);
      this.fr(gfx, 0xCCCCCC, 16, 14, 1, 1);

      // Bombs
      this.fr(gfx, 0x1C1C1C, 8, 17, 2, 2);
      this.fr(gfx, 0x1C1C1C, 11, 17, 2, 2);
      this.fr(gfx, 0x1C1C1C, 9, 19, 2, 1);

      // Faction flag on tail
      this.fr(gfx, 0xCCCCCC, 1, 6, 2, 2);

      this.ol(gfx, 1, 1, 17, 18);
    });
  }

  // ═══════════════════════════════════════════════════════════════
  //  AGE 7: MODERN
  // ═══════════════════════════════════════════════════════════════

  /**
   * Marine — Infantry, 16×24, Skin: Brown (#8D5524)
   * Camo fatigues (olive + khaki dapple), PASGT helmet, tactical vest, assault rifle, black boots.
   */
  private generateMarine(): void {
    const w = 16, h = 24;
    const sk = SKIN.brown;
    this.makeTexture('unit_marine', w, h, (gfx) => {
      this.shd(gfx, 8, 23, 4);

      // Legs — camo
      this.fr(gfx, 0x556B2F, 5, 14, 3, 6);
      this.fr(gfx, 0x556B2F, 8, 14, 3, 6);
      this.fr(gfx, 0x808000, 6, 15, 2, 2);              // Camo patches
      this.fr(gfx, 0x808000, 9, 17, 2, 2);

      // Black combat boots
      this.fr(gfx, 0x1C1C1C, 4, 20, 4, 3);
      this.fr(gfx, 0x1C1C1C, 8, 20, 4, 3);

      // Camo fatigues + tactical vest
      this.fr(gfx, 0x556B2F, 5, 6, 6, 8);
      this.fr(gfx, 0x808000, 6, 7, 2, 2);               // Camo dapple
      this.fr(gfx, 0x808000, 9, 9, 2, 2);
      this.fr(gfx, 0x808000, 6, 11, 2, 1);
      // Tactical vest overlay
      this.fr(gfx, 0x4A5F28, 5, 7, 6, 4);
      this.fr(gfx, 0x3D5020, 6, 8, 4, 2);               // Pouches

      // Arms — camo
      this.fr(gfx, 0x556B2F, 3, 8, 2, 5);
      this.fr(gfx, 0x556B2F, 11, 8, 2, 5);
      this.fr(gfx, 0x808000, 3, 9, 1, 2);

      // Head
      this.fr(gfx, sk.base, 6, 3, 4, 4);
      this.fr(gfx, sk.highlight, 7, 4, 2, 2);
      this.fr(gfx, 0x000000, 7, 4, 1, 1);
      this.fr(gfx, 0x000000, 9, 4, 1, 1);
      // PASGT helmet + chin strap
      this.fr(gfx, 0x556B2F, 5, 1, 6, 3);
      this.fr(gfx, 0x667B3F, 6, 2, 4, 1);
      this.fr(gfx, 0x4A5F28, 5, 3, 1, 2);
      this.fr(gfx, 0x4A5F28, 10, 3, 1, 2);

      // Assault rifle — horizontal at chest
      this.fr(gfx, 0x1C1C1C, 12, 8, 3, 2);
      this.fr(gfx, 0x1C1C1C, 14, 7, 2, 1);              // Barrel
      this.fr(gfx, 0x333333, 12, 10, 2, 2);              // Magazine
      this.fr(gfx, 0x1C1C1C, 11, 9, 2, 1);               // Stock

      this.ol(gfx, 4, 1, 8, 22);
    });
  }

  /**
   * Sniper — Ranged, 14×24, Skin: Tan (#D4A574)
   * Ghillie suit w/ fringe, boonie hat, long sniper rifle w/ scope glint, crouched.
   */
  private generateSniper(): void {
    const w = 14, h = 24;
    const sk = SKIN.tan;
    this.makeTexture('unit_sniper', w, h, (gfx) => {
      this.shd(gfx, 7, 23, 4);

      // Crouched legs
      this.fr(gfx, 0x556B2F, 3, 16, 4, 4);
      this.fr(gfx, 0x556B2F, 7, 16, 4, 4);
      this.fr(gfx, 0x808000, 4, 17, 2, 2);
      this.fr(gfx, 0x1C1C1C, 2, 20, 5, 2);
      this.fr(gfx, 0x1C1C1C, 7, 20, 5, 2);

      // Ghillie suit body
      this.fr(gfx, 0x556B2F, 3, 8, 8, 8);
      // Fringe detail (ragged outline)
      this.fr(gfx, 0x808000, 2, 9, 1, 3);
      this.fr(gfx, 0x808000, 11, 9, 1, 3);
      this.fr(gfx, 0x808000, 4, 8, 2, 1);
      this.fr(gfx, 0x808000, 8, 8, 2, 1);
      this.fr(gfx, 0x667B3F, 3, 12, 2, 2);
      this.fr(gfx, 0x667B3F, 9, 10, 2, 2);

      // Arms
      this.fr(gfx, 0x556B2F, 1, 10, 2, 4);
      this.fr(gfx, 0x556B2F, 11, 10, 2, 4);

      // Head
      this.fr(gfx, sk.base, 5, 4, 4, 4);
      this.fr(gfx, sk.highlight, 6, 5, 2, 2);
      this.fr(gfx, 0x000000, 6, 5, 1, 1);
      this.fr(gfx, 0x000000, 8, 5, 1, 1);
      // Boonie hat pulled low
      this.fr(gfx, 0x556B2F, 4, 3, 6, 2);
      this.fr(gfx, 0x808000, 5, 3, 4, 1);
      this.fr(gfx, 0x4A5F28, 3, 4, 8, 1);

      // Long sniper rifle + scope
      this.fr(gfx, 0x1C1C1C, 10, 10, 4, 1);
      this.fr(gfx, 0x1C1C1C, 10, 11, 3, 1);
      this.fr(gfx, 0x333333, 12, 9, 2, 1);
      this.fr(gfx, 0x44AAFF, 13, 9, 1, 1);              // 1px scope glint

      this.ol(gfx, 2, 3, 10, 19);
    });
  }

  /**
   * Tank — Heavy, 24×32
   * Angular hull, large turret w/ long cannon barrel, wide tracks, antenna, markings.
   */
  private generateTank(): void {
    const w = 24, h = 32;
    this.makeTexture('unit_tank', w, h, (gfx) => {
      this.shd(gfx, 12, 27, 9);

      // Tracks
      this.fr(gfx, 0x1C1C1C, 1, 20, 22, 6);
      this.fr(gfx, 0x2C2C2C, 2, 21, 20, 4);
      for (let i = 0; i < 7; i++) {
        this.fr(gfx, 0x3C3C3C, 3 + i * 3, 21, 2, 4);
      }

      // Angular hull
      this.fr(gfx, 0x2F4F4F, 2, 12, 20, 8);
      this.fr(gfx, 0x3F5F5F, 3, 13, 18, 4);
      // Reactive armor tiles
      this.fr(gfx, 0x3A4A4A, 3, 12, 4, 2);
      this.fr(gfx, 0x3A4A4A, 9, 12, 4, 2);
      this.fr(gfx, 0x3A4A4A, 15, 12, 4, 2);

      // Turret
      this.fr(gfx, 0x2F4F4F, 6, 6, 12, 6);
      this.fr(gfx, 0x3F5F5F, 7, 7, 10, 4);
      // Long cannon
      this.fr(gfx, 0x2F4F4F, 17, 8, 7, 2);
      this.fr(gfx, 0x3F5F5F, 18, 8, 5, 1);
      // Antenna
      this.fr(gfx, 0x555555, 8, 2, 1, 5);
      // Faction marking
      this.fr(gfx, 0xCCCCCC, 14, 8, 3, 2);
      // Smoke dischargers
      this.fr(gfx, 0x3A4A4A, 5, 7, 2, 2);
      this.fr(gfx, 0x3A4A4A, 17, 6, 2, 2);

      this.ol(gfx, 0, 2, 24, 24);
    });
  }

  /**
   * Attack Helicopter — Special (AIR), 20×28
   * Sleek fuselage, glass canopy, main rotor blur, tail rotor, stub wings w/ rockets, skids.
   */
  private generateAttackHelicopter(): void {
    const w = 20, h = 28;
    this.makeTexture('unit_attack_helicopter', w, h, (gfx) => {
      // AIR UNIT — floats 50px above

      // Fuselage
      this.fr(gfx, 0x2F4F4F, 6, 10, 10, 8);
      this.fr(gfx, 0x3F5F5F, 7, 11, 8, 5);
      // Cockpit canopy
      this.fr(gfx, 0x556B2F, 14, 10, 4, 5);
      this.fr(gfx, 0x88AACC, 15, 11, 2, 3);

      // Tail boom
      this.fr(gfx, 0x2F4F4F, 2, 12, 5, 3);
      this.fr(gfx, 0x3F5F5F, 3, 13, 3, 1);
      this.fr(gfx, 0x2F4F4F, 1, 10, 2, 3);
      // Tail rotor
      this.fr(gfx, 0xCCCCCC, 0, 11, 2, 1);

      // Main rotor (motion blur)
      gfx.fillStyle(0x888888, 0.3);
      gfx.fillEllipse(11, 7, 16, 3);

      // Stub wings + rockets
      this.fr(gfx, 0x2F4F4F, 4, 15, 3, 2);
      this.fr(gfx, 0x2F4F4F, 15, 15, 3, 2);
      this.fr(gfx, 0x1C1C1C, 3, 16, 2, 3);
      this.fr(gfx, 0x1C1C1C, 17, 16, 2, 3);

      // Landing skids
      this.fr(gfx, 0x555555, 6, 18, 1, 4);
      this.fr(gfx, 0x555555, 15, 18, 1, 4);
      this.fr(gfx, 0x555555, 5, 22, 3, 1);
      this.fr(gfx, 0x555555, 14, 22, 3, 1);

      this.ol(gfx, 0, 5, 19, 18);
    });
  }

  // ═══════════════════════════════════════════════════════════════
  //  AGE 8: FUTURE
  // ═══════════════════════════════════════════════════════════════

  /**
   * Plasma Trooper — Infantry, 16×24, Skin: Peach (#FFDBB4)
   * Sleek powered armor w/ cyan glowing seams, smooth visor, plasma rifle, shoulder pads.
   */
  private generatePlasmaTrooper(): void {
    const w = 16, h = 24;
    this.makeTexture('unit_plasma_trooper', w, h, (gfx) => {
      this.shd(gfx, 8, 23, 4);

      // Legs — powered armor
      this.fr(gfx, 0x1A1A2E, 5, 15, 3, 5);
      this.fr(gfx, 0x1A1A2E, 8, 15, 3, 5);
      this.fr(gfx, 0x00CED1, 5, 17, 1, 2);
      this.fr(gfx, 0x00CED1, 10, 17, 1, 2);
      // Armored boots w/ cyan accent
      this.fr(gfx, 0x1A1A2E, 4, 20, 4, 2);
      this.fr(gfx, 0x00CED1, 5, 21, 2, 1);
      this.fr(gfx, 0x1A1A2E, 8, 20, 4, 2);
      this.fr(gfx, 0x00CED1, 9, 21, 2, 1);

      // Body — powered armor + cyan seams
      this.fr(gfx, 0x1A1A2E, 5, 6, 6, 9);
      this.fr(gfx, 0x2A2A3E, 6, 7, 4, 4);
      this.fr(gfx, 0x00CED1, 5, 8, 1, 6);
      this.fr(gfx, 0x00CED1, 10, 8, 1, 6);
      this.fr(gfx, 0x00CED1, 6, 11, 4, 1);

      // Angular shoulder pads w/ glow trim
      this.fr(gfx, 0x2A2A3E, 3, 7, 2, 3);
      this.fr(gfx, 0x00CED1, 3, 7, 2, 1);
      this.fr(gfx, 0x2A2A3E, 11, 7, 2, 3);
      this.fr(gfx, 0x00CED1, 11, 7, 2, 1);

      // Arms
      this.fr(gfx, 0x1A1A2E, 3, 10, 2, 4);
      this.fr(gfx, 0x1A1A2E, 11, 10, 2, 4);

      // Head — smooth helmet
      this.fr(gfx, 0x1A1A2E, 6, 2, 4, 4);
      this.fr(gfx, 0x2A2A3E, 7, 3, 2, 2);
      // Cyan visor glow line
      this.fr(gfx, 0x00CED1, 6, 4, 4, 1);
      this.fr(gfx, 0x44FFFF, 7, 4, 2, 1);
      this.fr(gfx, 0x1A1A2E, 6, 1, 4, 2);
      this.fr(gfx, 0x2A2A3E, 7, 1, 2, 1);

      // Plasma rifle
      this.fr(gfx, 0x1A1A2E, 13, 7, 3, 2);
      this.fr(gfx, 0x1A1A2E, 14, 6, 2, 1);
      this.fr(gfx, 0x00CED1, 15, 7, 1, 1);              // Energy core
      this.fr(gfx, 0x44FFFF, 15, 8, 1, 1);

      this.ol(gfx, 4, 1, 8, 21);
    });
  }

  /**
   * Rail Gunner — Ranged, 14×24, Skin: Olive (#C68642)
   * Light exosuit w/ purple accents, targeting monocle, very long rail gun w/ coil rings, braced.
   */
  private generateRailGunner(): void {
    const w = 14, h = 24;
    const sk = SKIN.olive;
    this.makeTexture('unit_rail_gunner', w, h, (gfx) => {
      this.shd(gfx, 7, 23, 4);

      // Braced stance (one knee down)
      this.fr(gfx, 0xE0E0E0, 4, 15, 3, 5);
      this.fr(gfx, 0xE0E0E0, 7, 13, 3, 4);
      this.fr(gfx, 0xD0D0D0, 7, 17, 3, 3);
      this.fr(gfx, 0x808080, 3, 20, 4, 2);
      this.fr(gfx, 0x808080, 7, 20, 4, 2);

      // Light exosuit + purple accents
      this.fr(gfx, 0xE0E0E0, 4, 6, 6, 9);
      this.fr(gfx, 0xF0F0F0, 5, 7, 4, 3);
      this.fr(gfx, 0xE040FB, 4, 8, 1, 5);
      this.fr(gfx, 0xE040FB, 9, 8, 1, 5);

      // Arms
      this.fr(gfx, 0xE0E0E0, 2, 8, 2, 5);
      this.fr(gfx, 0xE0E0E0, 10, 7, 2, 5);

      // Power pack w/ purple glow
      this.fr(gfx, 0x808080, 1, 7, 2, 6);
      this.fr(gfx, 0xE040FB, 1, 9, 2, 2);

      // Head
      this.fr(gfx, sk.base, 5, 2, 4, 4);
      this.fr(gfx, sk.highlight, 6, 3, 2, 2);
      this.fr(gfx, 0x000000, 6, 3, 1, 1);
      this.fr(gfx, 0x000000, 8, 3, 1, 1);
      // Open-face helmet
      this.fr(gfx, 0xE0E0E0, 4, 1, 6, 2);
      this.fr(gfx, 0xD0D0D0, 5, 1, 4, 1);
      // Purple targeting monocle
      this.fr(gfx, 0xE040FB, 9, 3, 1, 1);

      // Very long rail gun + coil rings
      this.fr(gfx, 0x808080, 10, 8, 4, 1);
      this.fr(gfx, 0xE040FB, 11, 8, 1, 1);
      this.fr(gfx, 0xE040FB, 13, 8, 1, 1);

      this.ol(gfx, 2, 1, 10, 21);
    });
  }

  /**
   * Mech Walker — Heavy, 24×32
   * Humanoid robot: cockpit canopy, weapon arms, reverse-joint legs, missile pod, thrusters.
   */
  private generateMechWalker(): void {
    const w = 24, h = 32;
    this.makeTexture('unit_mech_walker', w, h, (gfx) => {
      this.shd(gfx, 12, 31, 8);

      // Reverse-joint legs
      this.fr(gfx, 0x808080, 5, 20, 3, 5);
      this.fr(gfx, 0x808080, 4, 25, 3, 6);
      this.fr(gfx, 0x00CED1, 5, 24, 2, 1);              // Knee glow L
      this.fr(gfx, 0x707070, 3, 30, 4, 1);
      this.fr(gfx, 0x808080, 16, 20, 3, 5);
      this.fr(gfx, 0x808080, 17, 25, 3, 6);
      this.fr(gfx, 0x00CED1, 17, 24, 2, 1);              // Knee glow R
      this.fr(gfx, 0x707070, 17, 30, 4, 1);

      // Torso
      this.fr(gfx, 0x808080, 6, 8, 12, 12);
      this.fr(gfx, 0x909090, 7, 9, 10, 6);
      // Cockpit canopy
      this.fr(gfx, 0x00CED1, 9, 10, 6, 4);
      this.fr(gfx, 0x44FFFF, 10, 11, 4, 2);

      // Left arm — energy blade
      this.fr(gfx, 0x808080, 2, 10, 4, 8);
      this.fr(gfx, 0x00CED1, 1, 18, 3, 6);
      this.fr(gfx, 0x44FFFF, 2, 19, 1, 4);

      // Right arm — cannon
      this.fr(gfx, 0x808080, 18, 10, 4, 8);
      this.fr(gfx, 0x707070, 20, 16, 3, 4);
      this.fr(gfx, 0x808080, 21, 17, 2, 2);

      // Head
      this.fr(gfx, 0x808080, 9, 4, 6, 4);
      this.fr(gfx, 0x00CED1, 10, 5, 4, 2);
      this.fr(gfx, 0x44FFFF, 11, 5, 2, 1);

      // Shoulder missile pod
      this.fr(gfx, 0x1A1A2E, 3, 7, 4, 3);
      this.fr(gfx, 0x333344, 4, 7, 2, 1);
      this.fr(gfx, 0x333344, 4, 9, 2, 1);

      // Back thrusters
      this.fr(gfx, 0x707070, 7, 6, 2, 3);
      this.fr(gfx, 0x00CED1, 7, 8, 2, 1);
      this.fr(gfx, 0x707070, 15, 6, 2, 3);
      this.fr(gfx, 0x00CED1, 15, 8, 2, 1);

      this.ol(gfx, 1, 3, 22, 28);
    });
  }

  /**
   * Drone Swarm — Special (AIR), 20×28
   * 8 small diamond drones w/ green center glow, propellers, red laser connections.
   */
  private generateDroneSwarm(): void {
    const w = 20, h = 28;
    this.makeTexture('unit_drone_swarm', w, h, (gfx) => {
      // AIR UNIT — floats 30px above

      const drawDrone = (x: number, y: number) => {
        // Diamond body
        this.fr(gfx, 0x1A1A2E, x, y + 1, 4, 2);
        this.fr(gfx, 0x1A1A2E, x + 1, y, 2, 4);
        // Green center glow
        this.fr(gfx, 0x39FF14, x + 1, y + 1, 2, 2);
        // Propeller 1px grey
        this.fr(gfx, 0x888888, x - 1, y + 1, 1, 1);
        this.fr(gfx, 0x888888, x + 4, y + 1, 1, 1);
      };

      // 8 drones in loose cloud
      drawDrone(8, 1);
      drawDrone(3, 4);
      drawDrone(13, 3);
      drawDrone(6, 8);
      drawDrone(11, 9);
      drawDrone(2, 12);
      drawDrone(9, 14);
      drawDrone(14, 12);

      // Red laser lines connecting drones
      this.fr(gfx, 0xFF1744, 10, 4, 1, 5);
      this.fr(gfx, 0xFF1744, 5, 7, 6, 1);
      this.fr(gfx, 0xFF1744, 13, 6, 1, 4);
    });
  }
}
