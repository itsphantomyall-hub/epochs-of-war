import Phaser from 'phaser';

/**
 * HeroSpriteFactory
 *
 * Generates detailed 32×40 hero sprites for all 8 ages.
 * Each hero has a 2px gold (#DAA520) outline, unique signature elements,
 * and more detail than regular units.
 *
 * Texture keys: hero_{heroId}_player / hero_{heroId}_enemy
 */

const GOLD_OUTLINE = 0xDAA520;
const HERO_W = 32;
const HERO_H = 40;

// ─── Hero IDs (must match GameScene HERO_IDS values) ───
const HERO_KEYS = [
  'grok',
  'sargon',
  'leonidas',
  'joan_of_arc',
  'napoleon',
  'iron_baron',
  'commander_steele',
  'axiom_7',
] as const;

type HeroKey = typeof HERO_KEYS[number];

export class HeroSpriteFactory {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  // ─── Public API ───

  /** Generate all 8 hero textures (player + enemy variants). */
  generateAllHeroes(): void {
    this.generateGrok();
    this.generateSargon();
    this.generateLeonidas();
    this.generateJoan();
    this.generateNapoleon();
    this.generateIronBaron();
    this.generateSteele();
    this.generateAxiom();
  }

  /** Get the texture key for a hero. */
  getHeroTextureKey(heroId: string, faction: string): string {
    return `hero_${heroId}_${faction}`;
  }

  // ─── Helpers ───

  /**
   * Create a texture for both factions.
   * Draws the hero, adds a gold outline, then applies a faction tint.
   */
  private makeHeroTexture(
    heroId: string,
    drawFn: (gfx: Phaser.GameObjects.Graphics) => void,
  ): void {
    for (const faction of ['player', 'enemy'] as const) {
      const textureKey = `hero_${heroId}_${faction}`;
      if (this.scene.textures.exists(textureKey)) continue;

      const gfx = this.scene.add.graphics();

      // 1. Draw hero content
      drawFn(gfx);

      // 2. Gold outline (2px border around the entire figure)
      this.drawGoldOutline(gfx);

      // 3. Faction tint overlay
      const tintColor = faction === 'player' ? 0x4488ff : 0xff4444;
      gfx.fillStyle(tintColor, 0.15);
      gfx.fillRect(0, 0, HERO_W, HERO_H);

      gfx.generateTexture(textureKey, HERO_W, HERO_H);
      gfx.destroy();
    }
  }

  /**
   * Draw a 2px gold border around the perimeter of the sprite.
   * This is a simple rectangular border that frames the hero.
   */
  private drawGoldOutline(gfx: Phaser.GameObjects.Graphics): void {
    gfx.fillStyle(GOLD_OUTLINE);
    // Top edge
    gfx.fillRect(0, 0, HERO_W, 2);
    // Bottom edge
    gfx.fillRect(0, HERO_H - 2, HERO_W, 2);
    // Left edge
    gfx.fillRect(0, 0, 2, HERO_H);
    // Right edge
    gfx.fillRect(HERO_W - 2, 0, 2, HERO_H);
  }

  // ═══════════════════════════════════════════════════════════
  // AGE 1 — GROK, THE FIRST HUNTER
  // ═══════════════════════════════════════════════════════════

  private generateGrok(): void {
    this.makeHeroTexture('grok', (gfx) => {
      const skin = 0x8D5524;
      const boneColor = 0xF5E6C8;
      const beardColor = 0x4A3020;
      const furColor = 0x8B6914;
      const leatherWrap = 0x5C4033;

      // ── Fur cloak over left shoulder (drawn first, behind body) ──
      gfx.fillStyle(furColor);
      gfx.fillRect(4, 12, 6, 8);   // hanging down left side
      gfx.fillStyle(0x7A5812);      // darker fur detail
      gfx.fillRect(5, 14, 2, 4);
      gfx.fillRect(7, 13, 2, 3);

      // ── Head — large, bare-chested warrior ──
      gfx.fillStyle(skin);
      gfx.fillRect(11, 4, 10, 8);   // big head

      // Wild hair
      gfx.fillStyle(beardColor);
      gfx.fillRect(10, 2, 12, 3);
      gfx.fillRect(9, 3, 2, 3);
      gfx.fillRect(21, 3, 2, 3);

      // Eyes (intense, 2px wide)
      gfx.fillStyle(0xFFFFFF);
      gfx.fillRect(13, 6, 2, 2);
      gfx.fillRect(18, 6, 2, 2);
      gfx.fillStyle(0x000000);
      gfx.fillRect(14, 6, 1, 2);
      gfx.fillRect(19, 6, 1, 2);

      // Face paint — 2 red war stripes across cheeks (1px lines)
      gfx.fillStyle(0xC41E3A);
      gfx.fillRect(12, 8, 3, 1);   // left cheek stripe 1
      gfx.fillRect(12, 10, 3, 1);  // left cheek stripe 2
      gfx.fillRect(18, 8, 3, 1);   // right cheek stripe 1
      gfx.fillRect(18, 10, 3, 1);  // right cheek stripe 2

      // Wild beard (4x3 block below face)
      gfx.fillStyle(beardColor);
      gfx.fillRect(13, 12, 6, 3);
      gfx.fillRect(14, 15, 4, 1);  // tapered bottom

      // ── Bone necklace with visible teeth ──
      gfx.fillStyle(boneColor);
      gfx.fillRect(11, 11, 2, 1);  // left cord
      gfx.fillRect(20, 11, 2, 1);  // right cord
      gfx.fillRect(12, 12, 8, 1);  // main cord
      // Tooth triangles (small triangles pointing down)
      gfx.fillRect(13, 13, 1, 2);
      gfx.fillRect(15, 13, 1, 2);
      gfx.fillRect(17, 13, 1, 2);
      gfx.fillRect(19, 13, 1, 2);

      // ── Body — massive muscular bare chest ──
      gfx.fillStyle(skin);
      gfx.fillRect(8, 14, 16, 12);  // torso

      // Muscle definition (darker lines)
      gfx.fillStyle(0x7A4820);
      gfx.fillRect(15, 15, 2, 1);   // center line
      gfx.fillRect(15, 18, 2, 1);
      gfx.fillRect(15, 21, 2, 1);
      gfx.fillRect(12, 16, 2, 2);   // pec left
      gfx.fillRect(18, 16, 2, 2);   // pec right

      // ── Arms — massive ──
      gfx.fillStyle(skin);
      gfx.fillRect(4, 14, 4, 12);   // left arm
      gfx.fillRect(24, 14, 4, 12);  // right arm

      // ── GIANT bone club (6x24, nearly as tall as him) ──
      gfx.fillStyle(boneColor);
      gfx.fillRect(26, 3, 4, 22);   // shaft
      gfx.fillStyle(0xE8D5B5);      // slightly darker for knob
      gfx.fillRect(25, 2, 6, 5);    // club head
      // Bone texture on club
      gfx.fillStyle(0xD4C4A8);
      gfx.fillRect(27, 8, 2, 2);
      gfx.fillRect(26, 14, 2, 2);
      gfx.fillRect(27, 20, 2, 2);

      // ── Lower body ──
      // Fur loincloth
      gfx.fillStyle(furColor);
      gfx.fillRect(8, 24, 16, 4);
      gfx.fillStyle(0x7A5812);
      gfx.fillRect(10, 25, 3, 2);
      gfx.fillRect(19, 25, 3, 2);

      // Legs — bare, muscular
      gfx.fillStyle(skin);
      gfx.fillRect(9, 28, 5, 8);
      gfx.fillRect(18, 28, 5, 8);

      // Bare feet with leather ankle wraps
      gfx.fillStyle(leatherWrap);
      gfx.fillRect(9, 34, 5, 2);    // left ankle wrap
      gfx.fillRect(18, 34, 5, 2);   // right ankle wrap
      gfx.fillStyle(skin);
      gfx.fillRect(9, 36, 5, 2);    // left foot
      gfx.fillRect(18, 36, 5, 2);   // right foot
    });
  }

  // ═══════════════════════════════════════════════════════════
  // AGE 2 — SARGON, THE CONQUEROR
  // ═══════════════════════════════════════════════════════════

  private generateSargon(): void {
    this.makeHeroTexture('sargon', (gfx) => {
      const skin = 0xC68642;

      // ── Red cape flowing behind (drawn first, behind body) ──
      gfx.fillStyle(0xC41E3A);
      gfx.fillRect(3, 12, 6, 22);  // 6px wide, flowing
      gfx.fillRect(2, 16, 4, 16);  // tapered trailing edge
      gfx.fillStyle(0xA01830);      // darker fold
      gfx.fillRect(4, 14, 2, 18);

      // ── Head ──
      gfx.fillStyle(skin);
      gfx.fillRect(12, 5, 8, 7);

      // Golden crown/headband with red gem
      gfx.fillStyle(0xDAA520);
      gfx.fillRect(11, 3, 10, 3);
      gfx.fillStyle(0xFF0000);      // red gem center
      gfx.fillRect(15, 4, 2, 1);

      // Eyes
      gfx.fillStyle(0x000000);
      gfx.fillRect(14, 7, 1, 1);
      gfx.fillRect(18, 7, 1, 1);

      // Long braided beard (extending 6px below chin)
      gfx.fillStyle(0x2D2D2D);
      gfx.fillRect(13, 10, 6, 4);   // beard mass
      gfx.fillRect(14, 14, 4, 2);   // extending down
      gfx.fillRect(15, 16, 2, 2);   // tapered tip
      // Braid detail
      gfx.fillStyle(0x3D3D3D);
      gfx.fillRect(14, 11, 1, 4);
      gfx.fillRect(17, 11, 1, 4);

      // ── Bronze scale armor on chest ──
      gfx.fillStyle(0xCD853F);
      gfx.fillRect(8, 14, 16, 10);

      // Scale pattern (2x2 offset grid)
      gfx.fillStyle(0xB87333);
      for (let row = 0; row < 4; row++) {
        const offset = row % 2 === 0 ? 0 : 1;
        for (let col = 0; col < 7; col++) {
          const sx = 9 + col * 2 + offset;
          const sy = 15 + row * 2;
          if (sx < 23 && sy < 23) {
            gfx.fillRect(sx, sy, 1, 1);
          }
        }
      }

      // ── Arms ──
      gfx.fillStyle(0xCD853F);       // armored arms
      gfx.fillRect(4, 14, 4, 10);
      gfx.fillRect(24, 14, 4, 10);

      // ── Large ornate shield (left side) ──
      gfx.fillStyle(0xCD853F);
      gfx.fillRect(2, 12, 6, 12);   // shield body
      gfx.fillStyle(0xB87333);       // darker border
      gfx.fillRect(2, 12, 1, 12);
      gfx.fillRect(7, 12, 1, 12);
      gfx.fillRect(2, 12, 6, 1);
      gfx.fillRect(2, 23, 6, 1);
      // Embossed bull shape (simplified)
      gfx.fillStyle(0xA06020);
      gfx.fillRect(3, 15, 4, 3);    // bull body
      gfx.fillRect(3, 14, 1, 1);    // left horn
      gfx.fillRect(6, 14, 1, 1);    // right horn
      gfx.fillRect(4, 18, 1, 2);    // left leg
      gfx.fillRect(6, 18, 1, 2);    // right leg

      // ── Curved khopesh sword (right hand) ──
      gfx.fillStyle(0xC0C0C0);
      gfx.fillRect(27, 6, 2, 14);   // blade shaft
      gfx.fillRect(28, 4, 2, 3);    // curved tip
      gfx.fillRect(29, 3, 1, 2);    // tip end
      // Handle
      gfx.fillStyle(0x8B4513);
      gfx.fillRect(27, 20, 2, 3);
      gfx.fillStyle(0xDAA520);
      gfx.fillRect(26, 19, 4, 1);   // crossguard

      // ── Belt ──
      gfx.fillStyle(0xDAA520);
      gfx.fillRect(8, 23, 16, 2);

      // ── Legs ──
      gfx.fillStyle(0xCD853F);
      gfx.fillRect(10, 26, 5, 10);
      gfx.fillRect(17, 26, 5, 10);

      // Sandals
      gfx.fillStyle(0x8B6914);
      gfx.fillRect(10, 36, 5, 2);
      gfx.fillRect(17, 36, 5, 2);
    });
  }

  // ═══════════════════════════════════════════════════════════
  // AGE 3 — LEONIDAS
  // ═══════════════════════════════════════════════════════════

  private generateLeonidas(): void {
    this.makeHeroTexture('leonidas', (gfx) => {
      const skin = 0xD4A574;

      // ── Red cape — THE defining element, flowing 10px behind ──
      gfx.fillStyle(0xC41E3A);
      gfx.fillRect(2, 10, 8, 24);   // main cape body
      gfx.fillRect(0, 14, 4, 18);   // flowing edge
      gfx.fillRect(0, 30, 3, 8);    // bottom trail
      gfx.fillStyle(0xA01830);       // darker fold lines
      gfx.fillRect(4, 12, 2, 20);
      gfx.fillRect(2, 18, 1, 14);

      // ── Head / Corinthian helmet ──
      gfx.fillStyle(0xCD853F);       // bronze helmet
      gfx.fillRect(11, 4, 10, 8);   // main helmet
      gfx.fillRect(12, 12, 2, 2);   // left cheek guard
      gfx.fillRect(18, 12, 2, 2);   // right cheek guard
      // Nose guard
      gfx.fillRect(15, 6, 2, 6);

      // 2px skin gap for eyes
      gfx.fillStyle(skin);
      gfx.fillRect(13, 7, 2, 2);    // left eye slot
      gfx.fillRect(17, 7, 2, 2);    // right eye slot

      // Eyes (visible through helmet)
      gfx.fillStyle(0x000000);
      gfx.fillRect(13, 8, 2, 1);
      gfx.fillRect(17, 8, 2, 1);

      // TALL red horsehair crest — 8px tall!
      gfx.fillStyle(0xC41E3A);
      gfx.fillRect(14, 0, 4, 4);    // crest top
      gfx.fillRect(13, 2, 6, 3);    // crest middle
      gfx.fillStyle(0x9A1530);       // darker crest detail
      gfx.fillRect(15, 0, 2, 2);

      // ── Bronze breastplate ──
      gfx.fillStyle(0xCD853F);
      gfx.fillRect(10, 13, 12, 8);

      // Six-pack detail (3 pairs of darker pixels)
      gfx.fillStyle(0xB87333);
      gfx.fillRect(13, 14, 2, 2);   // top left
      gfx.fillRect(17, 14, 2, 2);   // top right
      gfx.fillRect(13, 16, 2, 2);   // mid left
      gfx.fillRect(17, 16, 2, 2);   // mid right
      gfx.fillRect(13, 18, 2, 2);   // bot left
      gfx.fillRect(17, 18, 2, 2);   // bot right

      // ── Arms ──
      gfx.fillStyle(skin);
      gfx.fillRect(6, 14, 4, 10);   // left arm
      gfx.fillRect(22, 14, 4, 10);  // right arm

      // ── Round Spartan shield (12px diameter-ish circle) ──
      gfx.fillStyle(0xCD853F);       // bronze rim
      gfx.fillRect(2, 11, 8, 12);   // outer
      gfx.fillStyle(0xC41E3A);       // red center
      gfx.fillRect(3, 12, 6, 10);
      // Lambda (Λ) symbol in center
      gfx.fillStyle(0xDAA520);
      gfx.fillRect(5, 13, 2, 1);    // top of Λ
      gfx.fillRect(4, 14, 1, 3);    // left leg
      gfx.fillRect(7, 14, 1, 3);    // right leg
      gfx.fillRect(3, 17, 2, 1);    // left foot
      gfx.fillRect(7, 17, 2, 1);    // right foot

      // ── Spear (right hand, angled forward) ──
      gfx.fillStyle(0x8B4513);       // wooden shaft
      gfx.fillRect(26, 4, 2, 28);
      gfx.fillStyle(0x808080);       // metal tip
      gfx.fillRect(25, 2, 4, 3);
      gfx.fillRect(26, 2, 2, 1);

      // ── Red pteruges (leather skirt) below armor ──
      gfx.fillStyle(0xC41E3A);
      gfx.fillRect(10, 21, 12, 4);
      gfx.fillStyle(0x9A1530);       // strip detail
      gfx.fillRect(10, 21, 2, 4);
      gfx.fillRect(14, 21, 2, 4);
      gfx.fillRect(18, 21, 2, 4);

      // ── Legs ──
      gfx.fillStyle(skin);
      gfx.fillRect(10, 25, 5, 10);
      gfx.fillRect(17, 25, 5, 10);

      // Bronze greaves on shins
      gfx.fillStyle(0xCD853F);
      gfx.fillRect(10, 29, 5, 4);
      gfx.fillRect(17, 29, 5, 4);

      // Sandals
      gfx.fillStyle(0x8B4513);
      gfx.fillRect(10, 35, 5, 3);
      gfx.fillRect(17, 35, 5, 3);
    });
  }

  // ═══════════════════════════════════════════════════════════
  // AGE 4 — JOAN OF ARC
  // ═══════════════════════════════════════════════════════════

  private generateJoan(): void {
    this.makeHeroTexture('joan_of_arc', (gfx) => {
      const skin = 0xFFDBB4;

      // ── Subtle halo: 5 white 1px dots in arc above head ──
      gfx.fillStyle(0xFFFFFF);
      gfx.fillRect(12, 2, 1, 1);
      gfx.fillRect(14, 1, 1, 1);  // 1px is not actually alpha, so use fillRect
      gfx.fillRect(16, 0, 1, 1);  // center top
      gfx.fillRect(18, 1, 1, 1);
      gfx.fillRect(20, 2, 1, 1);

      // ── Head ──
      gfx.fillStyle(skin);
      gfx.fillRect(12, 5, 8, 6);

      // Open-face sallet helmet with gold trim
      gfx.fillStyle(0xC0C0C0);
      gfx.fillRect(11, 3, 10, 4);  // helmet top
      gfx.fillRect(11, 5, 2, 4);   // left cheek guard
      gfx.fillRect(19, 5, 2, 4);   // right cheek guard
      gfx.fillStyle(0xDAA520);      // gold trim
      gfx.fillRect(11, 3, 10, 1);  // top edge
      gfx.fillRect(11, 7, 1, 2);   // left trim
      gfx.fillRect(20, 7, 1, 2);   // right trim

      // Eyes (blue)
      gfx.fillStyle(0x4488CC);
      gfx.fillRect(14, 7, 1, 1);
      gfx.fillRect(18, 7, 1, 1);

      // Long golden hair flowing from under helmet — reaches mid-back
      gfx.fillStyle(0xDAA520);
      gfx.fillRect(10, 7, 2, 6);   // left side hair
      gfx.fillRect(20, 7, 2, 6);   // right side hair
      gfx.fillRect(10, 13, 2, 8);  // left flowing down
      gfx.fillRect(20, 13, 2, 8);  // right flowing down
      gfx.fillStyle(0xC8961E);      // darker strand detail
      gfx.fillRect(10, 9, 1, 10);
      gfx.fillRect(21, 9, 1, 10);

      // ── Full plate armor — feminine proportions ──
      gfx.fillStyle(0xC0C0C0);
      gfx.fillRect(10, 11, 12, 4);  // shoulders/chest (wider)
      gfx.fillRect(11, 15, 10, 4);  // narrower waist (6px body)
      gfx.fillRect(10, 19, 12, 3);  // hip armor

      // Armor detail lines
      gfx.fillStyle(0xA0A0A0);
      gfx.fillRect(10, 13, 12, 1);
      gfx.fillRect(11, 17, 10, 1);

      // White tabard with gold fleur-de-lis
      gfx.fillStyle(0xE8E0D0);
      gfx.fillRect(13, 12, 6, 10);  // tabard
      // Fleur-de-lis (simple 3px cross shape)
      gfx.fillStyle(0xDAA520);
      gfx.fillRect(15, 14, 2, 1);   // horizontal
      gfx.fillRect(15, 13, 1, 3);   // vertical left
      gfx.fillRect(16, 13, 1, 3);   // vertical right
      gfx.fillRect(14, 14, 1, 1);   // left arm
      gfx.fillRect(17, 14, 1, 1);   // right arm

      // ── Arms (armored) ──
      gfx.fillStyle(0xC0C0C0);
      gfx.fillRect(6, 12, 4, 10);   // left arm
      gfx.fillRect(22, 12, 4, 10);  // right arm

      // Gauntlets
      gfx.fillStyle(0xA0A0A0);
      gfx.fillRect(6, 20, 4, 2);
      gfx.fillRect(22, 20, 4, 2);

      // ── Banner/standard in left hand ──
      gfx.fillStyle(0xE8E0D0);      // white pole
      gfx.fillRect(4, 2, 2, 22);
      // Blue + gold flag
      gfx.fillStyle(0x4682B4);
      gfx.fillRect(0, 2, 5, 6);
      gfx.fillStyle(0xDAA520);
      gfx.fillRect(1, 4, 3, 2);     // gold center on flag

      // ── Sword in right hand (held upright) ──
      gfx.fillStyle(0xC0C0C0);
      gfx.fillRect(26, 4, 2, 14);   // blade
      gfx.fillStyle(0xDAA520);
      gfx.fillRect(25, 18, 4, 1);   // crossguard
      gfx.fillStyle(0x8B4513);
      gfx.fillRect(26, 19, 2, 3);   // grip

      // ── Armored skirt ──
      gfx.fillStyle(0xC0C0C0);
      gfx.fillRect(10, 22, 12, 4);
      gfx.fillStyle(0xA0A0A0);
      gfx.fillRect(10, 22, 12, 1);

      // ── Legs (plate armor) ──
      gfx.fillStyle(0xC0C0C0);
      gfx.fillRect(10, 26, 5, 10);
      gfx.fillRect(17, 26, 5, 10);

      // Sabatons (armored boots)
      gfx.fillStyle(0xA0A0A0);
      gfx.fillRect(10, 36, 5, 2);
      gfx.fillRect(17, 36, 5, 2);
    });
  }

  // ═══════════════════════════════════════════════════════════
  // AGE 5 — NAPOLEON
  // ═══════════════════════════════════════════════════════════

  private generateNapoleon(): void {
    this.makeHeroTexture('napoleon', (gfx) => {
      const skin = 0xFFDBB4;

      // ── Head ──
      gfx.fillStyle(skin);
      gfx.fillRect(12, 7, 8, 6);

      // Sideburns
      gfx.fillStyle(0x443322);
      gfx.fillRect(12, 9, 1, 3);
      gfx.fillRect(19, 9, 1, 3);

      // Eyes
      gfx.fillStyle(0x000000);
      gfx.fillRect(14, 9, 1, 1);
      gfx.fillRect(18, 9, 1, 1);

      // Bicorne hat — WIDER than head (10px wide, 5px tall)
      gfx.fillStyle(0x2C3E50);
      gfx.fillRect(11, 3, 10, 5);   // main hat body
      gfx.fillRect(7, 5, 6, 2);     // left wing extends
      gfx.fillRect(19, 5, 6, 2);    // right wing extends
      // Cockade
      gfx.fillStyle(0xC41E3A);
      gfx.fillRect(15, 3, 2, 2);
      gfx.fillStyle(0xEEEEEE);
      gfx.fillRect(15, 4, 1, 1);
      gfx.fillStyle(0x2222CC);
      gfx.fillRect(16, 4, 1, 1);

      // ── Blue military coat ──
      gfx.fillStyle(0x2C3E50);
      gfx.fillRect(8, 13, 16, 12);

      // White waistcoat / front panel
      gfx.fillStyle(0xECF0F1);
      gfx.fillRect(12, 13, 8, 8);

      // 4 gold buttons down front
      gfx.fillStyle(0xF1C40F);
      gfx.fillRect(14, 14, 1, 1);
      gfx.fillRect(14, 16, 1, 1);
      gfx.fillRect(14, 18, 1, 1);
      gfx.fillRect(14, 20, 1, 1);
      // Mirrored right side buttons
      gfx.fillRect(17, 14, 1, 1);
      gfx.fillRect(17, 16, 1, 1);
      gfx.fillRect(17, 18, 1, 1);
      gfx.fillRect(17, 20, 1, 1);

      // Red sash diagonal across chest (1px line)
      gfx.fillStyle(0xC41E3A);
      gfx.fillRect(10, 14, 1, 1);
      gfx.fillRect(11, 15, 1, 1);
      gfx.fillRect(12, 16, 1, 1);
      gfx.fillRect(13, 17, 1, 1);
      gfx.fillRect(14, 18, 1, 1);
      gfx.fillRect(15, 19, 1, 1);
      gfx.fillRect(16, 20, 1, 1);
      gfx.fillRect(17, 21, 1, 1);

      // Gold epaulettes on shoulders (3x2 blocks)
      gfx.fillStyle(0xF1C40F);
      gfx.fillRect(5, 13, 3, 2);
      gfx.fillRect(24, 13, 3, 2);
      // Epaulette fringe
      gfx.fillStyle(0xD4A90F);
      gfx.fillRect(5, 15, 3, 1);
      gfx.fillRect(24, 15, 3, 1);

      // ── Arms ──
      gfx.fillStyle(0x2C3E50);
      gfx.fillRect(4, 14, 4, 10);   // left arm
      gfx.fillRect(24, 14, 4, 10);  // right arm

      // Right hand tucked in coat (iconic pose)
      gfx.fillStyle(skin);
      gfx.fillRect(13, 19, 3, 2);   // hand between buttons (hidden in coat)

      // Left hand visible
      gfx.fillStyle(skin);
      gfx.fillRect(4, 23, 3, 2);

      // Gold cuffs
      gfx.fillStyle(0xF1C40F);
      gfx.fillRect(4, 22, 4, 1);
      gfx.fillRect(24, 22, 4, 1);

      // Sword at hip (small hilt visible)
      gfx.fillStyle(0xC0C0C0);
      gfx.fillRect(22, 22, 2, 4);
      gfx.fillStyle(0xF1C40F);
      gfx.fillRect(21, 22, 1, 1);   // guard

      // ── White pants ──
      gfx.fillStyle(0xECF0F1);
      gfx.fillRect(10, 25, 5, 9);
      gfx.fillRect(17, 25, 5, 9);

      // ── Black boots ──
      gfx.fillStyle(0x1C1C1C);
      gfx.fillRect(10, 34, 5, 4);
      gfx.fillRect(17, 34, 5, 4);
      // Boot top trim
      gfx.fillStyle(0xF1C40F);
      gfx.fillRect(10, 34, 5, 1);
      gfx.fillRect(17, 34, 5, 1);
    });
  }

  // ═══════════════════════════════════════════════════════════
  // AGE 6 — THE IRON BARON
  // ═══════════════════════════════════════════════════════════

  private generateIronBaron(): void {
    this.makeHeroTexture('iron_baron', (gfx) => {
      const skin = 0xFFE0BD;
      const brassColor = 0xB87333;

      // ── Head ──
      gfx.fillStyle(skin);
      gfx.fillRect(12, 7, 8, 6);

      // Mustache
      gfx.fillStyle(0x333333);
      gfx.fillRect(13, 11, 6, 1);
      gfx.fillRect(12, 11, 1, 2);   // left curl
      gfx.fillRect(19, 11, 1, 2);   // right curl

      // Eyes
      gfx.fillStyle(0x000000);
      gfx.fillRect(14, 9, 1, 1);
      gfx.fillRect(18, 9, 1, 1);

      // Monocle over left eye
      gfx.fillStyle(0xD4A017);
      gfx.fillRect(17, 8, 3, 3);    // monocle frame
      gfx.fillStyle(0x88BBCC);       // lens
      gfx.fillRect(18, 9, 1, 1);
      // Monocle chain
      gfx.fillStyle(0xD4A017);
      gfx.fillRect(19, 11, 1, 2);

      // Top hat (6px wide, 6px tall)
      gfx.fillStyle(0x2C2C2C);
      gfx.fillRect(11, 2, 10, 6);   // hat crown
      gfx.fillRect(9, 7, 14, 1);    // hat brim
      // Goggles on brim
      gfx.fillStyle(0xD4A017);
      gfx.fillRect(10, 6, 3, 2);    // left goggle frame
      gfx.fillRect(19, 6, 3, 2);    // right goggle frame
      gfx.fillStyle(0x88CCDD);       // lens circles
      gfx.fillRect(11, 6, 1, 1);    // left lens
      gfx.fillRect(20, 6, 1, 1);    // right lens

      // ── Long leather coat ──
      gfx.fillStyle(0x654321);
      gfx.fillRect(8, 13, 16, 14);
      // Coat lapels
      gfx.fillStyle(0x553311);
      gfx.fillRect(8, 13, 3, 6);
      gfx.fillRect(21, 13, 3, 6);

      // Brass buttons
      gfx.fillStyle(brassColor);
      gfx.fillRect(15, 14, 2, 1);
      gfx.fillRect(15, 17, 2, 1);
      gfx.fillRect(15, 20, 2, 1);
      gfx.fillRect(15, 23, 2, 1);

      // Vest underneath
      gfx.fillStyle(0x8B0000);
      gfx.fillRect(12, 13, 8, 8);

      // Belt with brass buckle
      gfx.fillStyle(0x3C2A14);
      gfx.fillRect(8, 24, 16, 2);
      gfx.fillStyle(brassColor);
      gfx.fillRect(14, 24, 4, 2);

      // ── Normal left arm in coat sleeve ──
      gfx.fillStyle(0x654321);
      gfx.fillRect(4, 14, 4, 10);
      gfx.fillStyle(skin);
      gfx.fillRect(4, 23, 3, 2);    // left hand

      // ── Mechanical right arm ──
      gfx.fillStyle(0x808080);       // metal arm
      gfx.fillRect(24, 14, 5, 12);
      // Joint circles (brass)
      gfx.fillStyle(0xD4A017);
      gfx.fillRect(25, 16, 2, 2);   // shoulder joint
      gfx.fillRect(25, 21, 2, 2);   // elbow joint
      // Visible pistons (2px rectangles)
      gfx.fillStyle(0x606060);
      gfx.fillRect(27, 17, 2, 3);   // piston 1
      gfx.fillRect(27, 22, 2, 3);   // piston 2
      // Mechanical hand
      gfx.fillStyle(0x808080);
      gfx.fillRect(24, 26, 2, 3);   // finger 1
      gfx.fillRect(27, 26, 2, 3);   // finger 2

      // Steam puff (2-3 white dots near mechanical arm)
      gfx.fillStyle(0xFFFFFF);
      gfx.fillRect(29, 15, 1, 1);
      gfx.fillRect(28, 13, 1, 1);
      gfx.fillRect(30, 14, 1, 1);

      // ── Legs ──
      gfx.fillStyle(0x3C3C3C);
      gfx.fillRect(10, 27, 5, 9);
      gfx.fillRect(17, 27, 5, 9);

      // Heavy boots with brass toe caps
      gfx.fillStyle(0x222222);
      gfx.fillRect(10, 36, 5, 2);
      gfx.fillRect(17, 36, 5, 2);
      gfx.fillStyle(brassColor);     // brass toe caps
      gfx.fillRect(10, 37, 2, 1);
      gfx.fillRect(17, 37, 2, 1);
    });
  }

  // ═══════════════════════════════════════════════════════════
  // AGE 7 — COMMANDER STEELE
  // ═══════════════════════════════════════════════════════════

  private generateSteele(): void {
    this.makeHeroTexture('commander_steele', (gfx) => {
      const skin = 0x8D5524;

      // ── Head ──
      gfx.fillStyle(skin);
      gfx.fillRect(12, 6, 8, 7);

      // Strong jawline (2px wide chin)
      gfx.fillRect(14, 13, 4, 1);

      // Determined expression — eyes
      gfx.fillStyle(0xFFFFFF);
      gfx.fillRect(14, 8, 2, 2);
      gfx.fillRect(18, 8, 2, 2);
      gfx.fillStyle(0x000000);
      gfx.fillRect(15, 8, 1, 2);
      gfx.fillRect(19, 8, 1, 2);
      // Eyebrows (determined)
      gfx.fillStyle(0x1C1C1C);
      gfx.fillRect(14, 7, 2, 1);
      gfx.fillRect(18, 7, 2, 1);

      // Green beret at angle (6px wide, 3px tall)
      gfx.fillStyle(0x556B2F);
      gfx.fillRect(10, 4, 10, 3);
      gfx.fillRect(8, 5, 3, 2);     // angled left
      // Beret flash/badge
      gfx.fillStyle(0xDAA520);
      gfx.fillRect(14, 4, 3, 2);

      // ── Tactical vest ──
      gfx.fillStyle(0x556B2F);
      gfx.fillRect(8, 14, 16, 12);

      // Plate carrier overlay
      gfx.fillStyle(0x4A5F28);
      gfx.fillRect(10, 14, 12, 8);

      // Multiple small pouches (2px darker squares)
      gfx.fillStyle(0x3A4F18);
      gfx.fillRect(8, 16, 2, 2);    // left pouch 1
      gfx.fillRect(8, 19, 2, 2);    // left pouch 2
      gfx.fillRect(22, 16, 2, 2);   // right pouch 1
      gfx.fillRect(22, 19, 2, 2);   // right pouch 2
      gfx.fillRect(11, 20, 2, 2);   // center pouch
      gfx.fillRect(19, 20, 2, 2);   // center pouch 2

      // Dog tags: 2 tiny silver dots at chest
      gfx.fillStyle(0xC0C0C0);
      gfx.fillRect(15, 15, 1, 1);
      gfx.fillRect(16, 16, 1, 1);

      // ── Arms — rolled-up sleeves showing muscular arms ──
      gfx.fillStyle(0x556B2F);       // sleeve top
      gfx.fillRect(4, 14, 4, 4);    // left sleeve
      gfx.fillRect(24, 14, 4, 4);   // right sleeve
      gfx.fillStyle(skin);           // bare forearms
      gfx.fillRect(4, 18, 4, 6);    // left forearm
      gfx.fillRect(24, 18, 4, 6);   // right forearm

      // Left hand holds binoculars/radio
      gfx.fillStyle(0x1C1C1C);
      gfx.fillRect(3, 22, 4, 3);    // radio/binoculars

      // Right arm extended forward in command gesture
      gfx.fillStyle(skin);
      gfx.fillRect(28, 18, 2, 2);   // pointing hand

      // ── Belt ──
      gfx.fillStyle(0x333333);
      gfx.fillRect(8, 24, 16, 2);
      // Holster
      gfx.fillRect(22, 24, 3, 4);
      gfx.fillStyle(0x1C1C1C);
      gfx.fillRect(23, 25, 1, 2);   // pistol in holster

      // ── Camo pants (olive drab with camo patches) ──
      gfx.fillStyle(0x556B2F);
      gfx.fillRect(10, 26, 5, 10);
      gfx.fillRect(17, 26, 5, 10);
      // Camo patches
      gfx.fillStyle(0x808000);
      gfx.fillRect(11, 28, 2, 2);
      gfx.fillRect(13, 31, 2, 2);
      gfx.fillRect(18, 27, 2, 2);
      gfx.fillRect(20, 30, 2, 2);

      // Knee pads
      gfx.fillStyle(0x333333);
      gfx.fillRect(10, 32, 5, 2);
      gfx.fillRect(17, 32, 5, 2);

      // ── Black combat boots ──
      gfx.fillStyle(0x1C1C1C);
      gfx.fillRect(10, 36, 5, 2);
      gfx.fillRect(17, 36, 5, 2);
    });
  }

  // ═══════════════════════════════════════════════════════════
  // AGE 8 — AXIOM-7, AI COMMANDER
  // ═══════════════════════════════════════════════════════════

  private generateAxiom(): void {
    this.makeHeroTexture('axiom_7', (gfx) => {
      const bodyColor = 0x1A1A2E;
      const cyanGlow = 0x00CED1;
      const greenGlow = 0x39FF14;

      // ── 4 small satellite orbs at corners ──
      gfx.fillStyle(0x808080);
      gfx.fillRect(3, 4, 2, 2);     // top-left orb
      gfx.fillRect(27, 4, 2, 2);    // top-right orb
      gfx.fillRect(3, 30, 2, 2);    // bottom-left orb
      gfx.fillRect(27, 30, 2, 2);   // bottom-right orb
      // Green glow dots on orbs
      gfx.fillStyle(greenGlow);
      gfx.fillRect(4, 5, 1, 1);
      gfx.fillRect(28, 5, 1, 1);
      gfx.fillRect(4, 31, 1, 1);
      gfx.fillRect(28, 31, 1, 1);

      // ── Energy tendrils from hands toward allies ──
      gfx.fillStyle(cyanGlow);
      gfx.fillRect(3, 24, 1, 1);
      gfx.fillRect(2, 25, 1, 1);
      gfx.fillRect(29, 24, 1, 1);
      gfx.fillRect(30, 25, 1, 1);

      // ── Back-mounted energy wings (semi-transparent concept) ──
      gfx.fillStyle(cyanGlow, 0.5);
      // Left wing triangle
      gfx.fillRect(5, 12, 1, 6);
      gfx.fillRect(4, 13, 1, 4);
      gfx.fillRect(3, 14, 1, 2);
      // Right wing triangle
      gfx.fillRect(26, 12, 1, 6);
      gfx.fillRect(27, 13, 1, 4);
      gfx.fillRect(28, 14, 1, 2);

      // ── Ovoid head ──
      gfx.fillStyle(bodyColor);
      gfx.fillRect(10, 4, 12, 9);   // main head
      gfx.fillRect(11, 3, 10, 1);   // top curve
      gfx.fillRect(11, 13, 10, 1);  // chin curve

      // Full-width horizontal cyan visor — key feature
      gfx.fillStyle(cyanGlow);
      gfx.fillRect(10, 7, 12, 3);   // full visor
      gfx.fillStyle(0x44FFFF);       // brighter center
      gfx.fillRect(12, 8, 8, 1);

      // ── Slim angular body ──
      gfx.fillStyle(bodyColor);
      gfx.fillRect(10, 14, 12, 12);

      // Glowing seam lines (1px cyan lines along edges)
      gfx.fillStyle(cyanGlow);
      gfx.fillRect(10, 14, 1, 12);  // left edge seam
      gfx.fillRect(21, 14, 1, 12);  // right edge seam
      gfx.fillRect(10, 14, 12, 1);  // top seam
      gfx.fillRect(10, 25, 12, 1);  // bottom seam
      gfx.fillRect(15, 15, 2, 10);  // center vertical seam

      // Small holographic display (4x4 green semi-transparent rectangle)
      gfx.fillStyle(greenGlow, 0.6);
      gfx.fillRect(14, 17, 4, 4);
      // Display content (tiny data lines)
      gfx.fillStyle(greenGlow);
      gfx.fillRect(15, 18, 2, 1);
      gfx.fillRect(15, 20, 2, 1);

      // ── Arms (angular, robotic) ──
      gfx.fillStyle(bodyColor);
      gfx.fillRect(6, 15, 4, 10);   // left arm
      gfx.fillRect(22, 15, 4, 10);  // right arm
      // Arm seam lines
      gfx.fillStyle(cyanGlow);
      gfx.fillRect(6, 15, 1, 10);
      gfx.fillRect(9, 15, 1, 10);
      gfx.fillRect(22, 15, 1, 10);
      gfx.fillRect(25, 15, 1, 10);
      // Hands
      gfx.fillStyle(bodyColor);
      gfx.fillRect(5, 24, 4, 3);    // left hand
      gfx.fillRect(23, 24, 4, 3);   // right hand
      gfx.fillStyle(cyanGlow);
      gfx.fillRect(6, 25, 2, 1);    // hand glow
      gfx.fillRect(24, 25, 2, 1);

      // ── Legs (angular) — body floats but legs are hover-limbs ──
      gfx.fillStyle(bodyColor);
      gfx.fillRect(11, 26, 4, 8);   // left leg
      gfx.fillRect(17, 26, 4, 8);   // right leg
      // Leg seam lines
      gfx.fillStyle(cyanGlow);
      gfx.fillRect(11, 28, 4, 1);
      gfx.fillRect(17, 28, 4, 1);
      gfx.fillRect(11, 32, 4, 1);
      gfx.fillRect(17, 32, 4, 1);

      // ── NO feet — floats 3px above ground (visible gap) ──
      // The legs end at y=34, leaving 3px gap to sprite bottom (y=37-39)
      // Hover glow where feet would be
      gfx.fillStyle(cyanGlow, 0.7);
      gfx.fillRect(11, 35, 4, 1);
      gfx.fillRect(17, 35, 4, 1);
      gfx.fillStyle(cyanGlow, 0.4);
      gfx.fillRect(10, 36, 6, 1);
      gfx.fillRect(16, 36, 6, 1);
    });
  }
}

// ─── Standalone API (matches spec requirements) ───

/**
 * Generate all hero textures. Call once during scene create.
 */
export function generateHeroTextures(scene: Phaser.Scene): void {
  const factory = new HeroSpriteFactory(scene);
  factory.generateAllHeroes();
}

/**
 * Get the texture key for a hero.
 */
export function getHeroTextureKey(heroId: string, faction: string): string {
  return `hero_${heroId}_${faction}`;
}
