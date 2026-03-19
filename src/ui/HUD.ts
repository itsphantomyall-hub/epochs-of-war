import Phaser from 'phaser';
import { GameState, createInitialGameState } from '../types/GameState';
import { ConfigLoader } from '../utils/ConfigLoader';

/** Data shape for unit button definitions pushed from GameScene. */
export interface UnitDef {
  name: string;
  cost: number;
  key: string;
  unitId?: string;
}

/**
 * Unit button data for the bottom bar.
 */
interface UnitButton {
  bg: Phaser.GameObjects.Rectangle;
  nameText: Phaser.GameObjects.Text;
  costText: Phaser.GameObjects.Text;
  keyText: Phaser.GameObjects.Text;
  cooldownOverlay: Phaser.GameObjects.Rectangle;
  index: number;
}

/**
 * HUD Scene — rendered as an overlay on top of the GameScene.
 *
 * Layout (from GAME_DESIGN.md Section 13.1):
 *   TOP BAR:    Gold | XP bar | Age name | Enemy base HP
 *   BOTTOM BAR: 4 unit buttons (Q/W/E/R) | Evolve (T) | Special (SPACE) | Hero (1, 2)
 */
export class HUD extends Phaser.Scene {
  // ── State (mirrors game state, updated each frame) ──
  private gameState: GameState = createInitialGameState();

  // ── Top bar elements ──
  private goldText!: Phaser.GameObjects.Text;
  private xpBarBg!: Phaser.GameObjects.Rectangle;
  private xpBarFill!: Phaser.GameObjects.Rectangle;
  private xpText!: Phaser.GameObjects.Text;
  private ageText!: Phaser.GameObjects.Text;
  private enemyHpBarBg!: Phaser.GameObjects.Rectangle;
  private enemyHpBarFill!: Phaser.GameObjects.Rectangle;
  private enemyHpText!: Phaser.GameObjects.Text;
  private playerHpBarBg!: Phaser.GameObjects.Rectangle;
  private playerHpBarFill!: Phaser.GameObjects.Rectangle;
  private playerHpText!: Phaser.GameObjects.Text;

  // ── XP bar glow ──
  private xpGlowGraphics!: Phaser.GameObjects.Graphics;
  private xpGlowTimer: number = 0;

  // ── Gold flash state ──
  private goldFlashTimer: number = 0;

  // ── Player HP flash state ──
  private playerHpFlashTimer: number = 0;

  // ── Bottom bar elements ──
  private unitButtons: UnitButton[] = [];
  private evolveBtn!: Phaser.GameObjects.Rectangle;
  private evolveBtnText!: Phaser.GameObjects.Text;
  private evolveKeyText!: Phaser.GameObjects.Text;
  private specialBtn!: Phaser.GameObjects.Rectangle;
  private specialBtnText!: Phaser.GameObjects.Text;
  private specialCooldownArc!: Phaser.GameObjects.Graphics;
  private heroBtn1!: Phaser.GameObjects.Rectangle;
  private heroBtn1Text!: Phaser.GameObjects.Text;
  private heroBtn2!: Phaser.GameObjects.Rectangle;
  private heroBtn2Text!: Phaser.GameObjects.Text;

  // ── Bottom bar background ──
  private bottomBarBg!: Phaser.GameObjects.Rectangle;
  private topBarBg!: Phaser.GameObjects.Rectangle;

  // ── Config ──
  private static readonly TOP_BAR_HEIGHT = 36;
  private static readonly BOTTOM_BAR_HEIGHT = 72;
  private static readonly BUTTON_W = 100;
  private static readonly BUTTON_H = 56;
  private static readonly BUTTON_GAP = 8;

  // ── Unit data (updated from config via updateUnitDefs) ──
  private unitDefs: UnitDef[] = [
    { name: 'Infantry', cost: 15, key: 'Q' },
    { name: 'Ranged', cost: 25, key: 'W' },
    { name: 'Heavy', cost: 100, key: 'E' },
    { name: 'Special', cost: 80, key: 'R' },
  ];

  // ── ConfigLoader for XP thresholds ──
  private configLoader: ConfigLoader | null = null;

  // ── Cooldown timers (0 = ready, >0 = seconds remaining) ──
  private unitCooldowns = [0, 0, 0, 0];
  private unitCooldownMaxes = [2, 2, 2, 2]; // actual spawn times, updated by startUnitCooldown
  private specialCooldown = 0;
  private specialMaxCooldown = 30;
  private heroCooldowns = [0, 0];

  // ── Age names ──
  private static readonly AGE_NAMES: Record<number, string> = {
    1: 'Prehistoric',
    2: 'Bronze Age',
    3: 'Classical',
    4: 'Medieval',
    5: 'Gunpowder',
    6: 'Industrial',
    7: 'Modern',
    8: 'Future',
  };

  // ── Evolve pulse state ──
  private evolveReady = false;
  private evolvePulseTimer = 0;

  // ── Hover tracking for unit buttons ──
  private hoveredButtonIndex: number = -1;

  // ── Weather display ──
  private weatherDisplayText!: Phaser.GameObjects.Text;

  // ── Hero HP display ──
  private heroHpText!: Phaser.GameObjects.Text;
  private heroHpCurrent: number = 0;
  private heroHpMax: number = 0;

  constructor() {
    super({ key: 'HUD' });
  }

  create(): void {
    const { width, height } = this.scale;

    this.createTopBar(width);
    this.createBottomBar(width, height);
  }

  // ─────────────────────── TOP BAR ───────────────────────

  private createTopBar(width: number): void {
    const h = HUD.TOP_BAR_HEIGHT;

    // Background
    this.topBarBg = this.add.rectangle(width / 2, h / 2, width, h, 0x000000, 0.65);
    this.topBarBg.setDepth(0);

    // ── Player base HP (top-left) ──
    const hpX = 12;
    const hpY = h / 2;
    this.playerHpBarBg = this.add.rectangle(hpX + 50, hpY, 100, 14, 0x333333).setOrigin(0.5);
    this.playerHpBarFill = this.add.rectangle(hpX + 50, hpY, 100, 14, 0x44cc44).setOrigin(0.5);
    this.playerHpText = this.add.text(hpX + 50, hpY, '500/500', {
      fontSize: '10px', fontFamily: 'monospace', color: '#ffffff',
    }).setOrigin(0.5).setDepth(2);

    // ── Gold display ──
    this.goldText = this.add.text(130, hpY, 'Gold: 50', {
      fontSize: '14px', fontFamily: 'monospace', color: '#ffd700',
    }).setOrigin(0, 0.5).setDepth(2);

    // ── XP bar (center-left) ──
    const xpX = 280;
    this.xpBarBg = this.add.rectangle(xpX + 75, hpY, 150, 14, 0x333333).setOrigin(0.5);
    this.xpBarFill = this.add.rectangle(xpX + 75, hpY, 0, 14, 0x8844ff).setOrigin(0.5);
    this.xpText = this.add.text(xpX + 75, hpY, '0/500', {
      fontSize: '10px', fontFamily: 'monospace', color: '#ffffff',
    }).setOrigin(0.5).setDepth(2);

    // XP bar glow graphics (drawn behind XP bar when full)
    this.xpGlowGraphics = this.add.graphics().setDepth(0);

    // ── Age name (center) ──
    this.ageText = this.add.text(width / 2, hpY, 'Prehistoric', {
      fontSize: '16px', fontFamily: 'monospace', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(2);

    // ── Weather display (center-right) ──
    this.weatherDisplayText = this.add.text(width / 2 + 120, hpY, 'Weather: Clear', {
      fontSize: '11px', fontFamily: 'monospace', color: '#aaccff',
    }).setOrigin(0, 0.5).setDepth(2);

    // ── Hero HP display (to the right of weather) ──
    this.heroHpText = this.add.text(width / 2 + 280, hpY, '', {
      fontSize: '11px', fontFamily: 'monospace', color: '#ffd700',
    }).setOrigin(0, 0.5).setDepth(2);

    // ── Enemy base HP bar (right) ──
    const eHpX = width - 112;
    this.enemyHpBarBg = this.add.rectangle(eHpX, hpY, 100, 14, 0x333333).setOrigin(0.5);
    this.enemyHpBarFill = this.add.rectangle(eHpX, hpY, 100, 14, 0xcc4444).setOrigin(0.5);
    this.enemyHpText = this.add.text(eHpX, hpY, '500/500', {
      fontSize: '10px', fontFamily: 'monospace', color: '#ffffff',
    }).setOrigin(0.5).setDepth(2);
  }

  // ─────────────────────── BOTTOM BAR ───────────────────────

  private createBottomBar(width: number, height: number): void {
    const barH = HUD.BOTTOM_BAR_HEIGHT;
    const barY = height - barH / 2;

    // Background
    this.bottomBarBg = this.add.rectangle(width / 2, barY, width, barH, 0x000000, 0.7);
    this.bottomBarBg.setDepth(0);

    // ── 4 Unit spawn buttons ──
    const btnW = HUD.BUTTON_W;
    const btnH = HUD.BUTTON_H;
    const gap = HUD.BUTTON_GAP;
    const startX = 20;

    for (let i = 0; i < 4; i++) {
      const x = startX + i * (btnW + gap) + btnW / 2;
      const y = barY;
      const def = this.unitDefs[i];

      const bg = this.add.rectangle(x, y, btnW, btnH, 0x224466, 1)
        .setStrokeStyle(2, 0x4488cc)
        .setDepth(1)
        .setInteractive({ useHandCursor: true });

      // Hover effect for unit buttons
      const buttonIndex = i;
      bg.on('pointerover', () => {
        this.hoveredButtonIndex = buttonIndex;
      });
      bg.on('pointerout', () => {
        if (this.hoveredButtonIndex === buttonIndex) {
          this.hoveredButtonIndex = -1;
        }
      });

      const nameText = this.add.text(x, y - 14, def.name, {
        fontSize: '11px', fontFamily: 'monospace', color: '#ffffff',
      }).setOrigin(0.5).setDepth(2);

      const costText = this.add.text(x, y + 2, `$${def.cost}`, {
        fontSize: '11px', fontFamily: 'monospace', color: '#ffd700',
      }).setOrigin(0.5).setDepth(2);

      const keyText = this.add.text(x, y + 18, `[${def.key}]`, {
        fontSize: '10px', fontFamily: 'monospace', color: '#aaaaaa',
      }).setOrigin(0.5).setDepth(2);

      // Cooldown overlay (invisible by default)
      const cooldownOverlay = this.add.rectangle(x, y + btnH / 2, btnW, 0, 0x000000, 0.6)
        .setOrigin(0.5, 1)
        .setDepth(3);

      this.unitButtons.push({ bg, nameText, costText, keyText, cooldownOverlay, index: i });
    }

    // ── EVOLVE button ──
    const evolveX = startX + 4 * (btnW + gap) + 60;
    this.evolveBtn = this.add.rectangle(evolveX, barY, 80, btnH, 0x226622, 1)
      .setStrokeStyle(2, 0x44cc44)
      .setDepth(1);
    this.evolveBtnText = this.add.text(evolveX, barY - 6, 'EVOLVE', {
      fontSize: '12px', fontFamily: 'monospace', color: '#44ff44', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(2);
    this.evolveKeyText = this.add.text(evolveX, barY + 14, '[T]', {
      fontSize: '10px', fontFamily: 'monospace', color: '#aaaaaa',
    }).setOrigin(0.5).setDepth(2);

    // ── SPECIAL button ──
    const specialX = evolveX + 100;
    this.specialBtn = this.add.rectangle(specialX, barY, 80, btnH, 0x662222, 1)
      .setStrokeStyle(2, 0xcc4444)
      .setDepth(1);
    this.specialBtnText = this.add.text(specialX, barY - 6, 'READY', {
      fontSize: '12px', fontFamily: 'monospace', color: '#ff4444', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(2);
    this.add.text(specialX, barY + 14, '[SPACE]', {
      fontSize: '9px', fontFamily: 'monospace', color: '#aaaaaa',
    }).setOrigin(0.5).setDepth(2);

    // Cooldown pie chart graphics
    this.specialCooldownArc = this.add.graphics().setDepth(4);

    // ── HERO ability buttons ──
    const heroX = specialX + 100;
    this.heroBtn1 = this.add.rectangle(heroX, barY, 44, btnH, 0x444422, 1)
      .setStrokeStyle(2, 0x888844)
      .setDepth(1);
    this.heroBtn1Text = this.add.text(heroX, barY, '[1]', {
      fontSize: '12px', fontFamily: 'monospace', color: '#cccc44',
    }).setOrigin(0.5).setDepth(2);

    this.heroBtn2 = this.add.rectangle(heroX + 52, barY, 44, btnH, 0x444422, 1)
      .setStrokeStyle(2, 0x888844)
      .setDepth(1);
    this.heroBtn2Text = this.add.text(heroX + 52, barY, '[2]', {
      fontSize: '12px', fontFamily: 'monospace', color: '#cccc44',
    }).setOrigin(0.5).setDepth(2);
  }

  // ─────────────────────── UPDATE ───────────────────────

  update(_time: number, delta: number): void {
    // Try to read game state from the GameScene's registry
    const gameScene = this.scene.get('GameScene');
    if (gameScene && gameScene.data) {
      const state = gameScene.data.get('gameState') as GameState | undefined;
      if (state) {
        this.gameState = state;
      }
    }

    this.updateTopBar(delta);
    this.updateUnitButtons(delta);
    this.updateEvolveButton(delta);
    this.updateSpecialButton(delta);
    this.updateHeroButtons(delta);
  }

  private updateTopBar(delta: number): void {
    const { player, enemy } = this.gameState;

    // Gold — with flash effect
    this.goldText.setText(`Gold: ${Math.floor(player.gold).toLocaleString()}`);
    if (this.goldFlashTimer > 0) {
      this.goldFlashTimer -= delta / 1000;
      const flashProgress = this.goldFlashTimer / 0.4;
      if (flashProgress > 0.5) {
        // yellow -> white
        this.goldText.setColor('#ffffff');
      } else {
        // white -> back to gold
        this.goldText.setColor('#ffd700');
      }
    } else {
      this.goldText.setColor('#ffd700');
    }

    // Player base HP — with damage flash
    const playerHpRatio = Math.max(0, player.baseHp / player.baseMaxHp);
    this.playerHpBarFill.scaleX = playerHpRatio;
    this.playerHpText.setText(`${Math.ceil(player.baseHp)}/${player.baseMaxHp}`);
    if (this.playerHpFlashTimer > 0) {
      this.playerHpFlashTimer -= delta / 1000;
      this.playerHpBarFill.setFillStyle(0xff2222);
    } else {
      this.playerHpBarFill.setFillStyle(0x44cc44);
    }

    // XP bar
    const xpToNext = this.getXpToNext(player.currentAge);
    const xpRatio = xpToNext > 0 ? Math.min(player.xp / xpToNext, 1) : 1;
    this.xpBarFill.scaleX = xpRatio;
    this.xpText.setText(`${Math.floor(player.xp)}/${xpToNext}`);

    // XP bar glow when full (can evolve)
    this.xpGlowGraphics.clear();
    if (xpRatio >= 1 && player.currentAge < 8) {
      this.xpGlowTimer += delta / 1000;
      const glowAlpha = 0.2 + 0.15 * Math.sin(this.xpGlowTimer * 5);
      const xpBarCenterX = this.xpBarBg.x;
      const xpBarCenterY = this.xpBarBg.y;
      this.xpGlowGraphics.fillStyle(0xffdd00, glowAlpha);
      this.xpGlowGraphics.fillRoundedRect(
        xpBarCenterX - 79, xpBarCenterY - 11, 158, 22, 4
      );
    } else {
      this.xpGlowTimer = 0;
    }

    // Age name
    const ageName = HUD.AGE_NAMES[player.currentAge] ?? `Age ${player.currentAge}`;
    this.ageText.setText(ageName);

    // Evolve readiness
    this.evolveReady = player.xp >= xpToNext && player.currentAge < 8;

    // Enemy base HP
    const enemyHpRatio = Math.max(0, enemy.baseHp / enemy.baseMaxHp);
    this.enemyHpBarFill.scaleX = enemyHpRatio;
    this.enemyHpText.setText(`${Math.ceil(enemy.baseHp)}/${enemy.baseMaxHp}`);
  }

  private updateUnitButtons(delta: number): void {
    const { player } = this.gameState;

    for (const btn of this.unitButtons) {
      const def = this.unitDefs[btn.index];
      const canAfford = player.gold >= def.cost;
      const onCooldown = this.unitCooldowns[btn.index] > 0;
      const isHovered = this.hoveredButtonIndex === btn.index;

      // Base color — brighter when hovered
      let bgColor: number;
      if (!canAfford) {
        bgColor = isHovered ? 0x333333 : 0x222222;
      } else {
        bgColor = isHovered ? 0x336688 : 0x224466;
      }
      btn.bg.setFillStyle(bgColor);
      btn.costText.setColor(canAfford ? '#ffd700' : '#666666');
      btn.nameText.setColor(canAfford ? '#ffffff' : '#666666');

      // Stroke brightens on hover
      if (isHovered && canAfford) {
        btn.bg.setStrokeStyle(2, 0x66aaee);
      } else {
        btn.bg.setStrokeStyle(2, 0x4488cc);
      }

      // Cooldown fill overlay
      if (onCooldown) {
        this.unitCooldowns[btn.index] = Math.max(0, this.unitCooldowns[btn.index] - delta / 1000);
        // Show cooldown as a fill from bottom
        const maxCooldown = this.unitCooldownMaxes[btn.index] || 2;
        const ratio = this.unitCooldowns[btn.index] / maxCooldown;
        btn.cooldownOverlay.setSize(HUD.BUTTON_W, HUD.BUTTON_H * ratio);
        btn.cooldownOverlay.setVisible(true);
      } else {
        btn.cooldownOverlay.setVisible(false);
      }
    }
  }

  private updateEvolveButton(_delta: number): void {
    if (this.evolveReady) {
      // Pulse glow effect
      this.evolvePulseTimer += _delta / 1000;
      const alpha = 0.7 + 0.3 * Math.sin(this.evolvePulseTimer * 4);
      this.evolveBtn.setFillStyle(0x22aa22);
      this.evolveBtn.setAlpha(alpha);
      this.evolveBtnText.setColor('#44ff44');
      this.evolveKeyText.setText('READY [T]');
    } else {
      this.evolveBtn.setFillStyle(0x222222);
      this.evolveBtn.setAlpha(1);
      this.evolveBtnText.setColor('#666666');
      this.evolveKeyText.setText('[T]');
    }
  }

  private updateSpecialButton(delta: number): void {
    if (this.specialCooldown > 0) {
      this.specialCooldown = Math.max(0, this.specialCooldown - delta / 1000);
      this.specialBtnText.setText(Math.ceil(this.specialCooldown) + 's');
      this.specialBtn.setFillStyle(0x331111);

      // Draw cooldown pie chart
      this.drawCooldownPie(
        this.specialBtn.x,
        this.specialBtn.y,
        20,
        this.specialCooldown / this.specialMaxCooldown
      );
    } else {
      this.specialBtnText.setText('READY');
      this.specialBtn.setFillStyle(0x662222);
      this.specialCooldownArc.clear();
    }
  }

  private updateHeroButtons(delta: number): void {
    // Hero ability 1
    if (this.heroCooldowns[0] > 0) {
      this.heroCooldowns[0] = Math.max(0, this.heroCooldowns[0] - delta / 1000);
      this.heroBtn1.setFillStyle(0x222211);
      this.heroBtn1Text.setText(Math.ceil(this.heroCooldowns[0]) + 's');
    } else {
      this.heroBtn1.setFillStyle(0x444422);
      this.heroBtn1Text.setText('[1]');
    }

    // Hero ability 2
    if (this.heroCooldowns[1] > 0) {
      this.heroCooldowns[1] = Math.max(0, this.heroCooldowns[1] - delta / 1000);
      this.heroBtn2.setFillStyle(0x222211);
      this.heroBtn2Text.setText(Math.ceil(this.heroCooldowns[1]) + 's');
    } else {
      this.heroBtn2.setFillStyle(0x444422);
      this.heroBtn2Text.setText('[2]');
    }
  }

  private drawCooldownPie(cx: number, cy: number, radius: number, ratio: number): void {
    this.specialCooldownArc.clear();
    if (ratio <= 0) return;

    this.specialCooldownArc.fillStyle(0x000000, 0.6);
    this.specialCooldownArc.beginPath();
    this.specialCooldownArc.moveTo(cx, cy);

    const startAngle = -Math.PI / 2;
    const endAngle = startAngle + Math.PI * 2 * ratio;
    this.specialCooldownArc.arc(cx, cy, radius, startAngle, endAngle, false);
    this.specialCooldownArc.closePath();
    this.specialCooldownArc.fillPath();
  }

  // ─────────────────────── PUBLIC API ───────────────────────

  /** Called by GameScene when a unit spawn is triggered. Starts cooldown. */
  startUnitCooldown(index: number, duration: number): void {
    if (index >= 0 && index < 4) {
      this.unitCooldowns[index] = duration;
      this.unitCooldownMaxes[index] = duration;
    }
  }

  /** Called by GameScene when special is used. */
  startSpecialCooldown(duration: number): void {
    this.specialCooldown = duration;
    this.specialMaxCooldown = duration;
  }

  /** Called by GameScene when a hero ability is used. */
  startHeroCooldown(abilityIndex: number, duration: number): void {
    if (abilityIndex >= 0 && abilityIndex < 2) {
      this.heroCooldowns[abilityIndex] = duration;
    }
  }

  /**
   * Called by GameScene when gold increases from a kill.
   * Triggers a brief yellow->white->gold flash on the gold text.
   */
  flashGoldText(): void {
    this.goldFlashTimer = 0.4;
  }

  /**
   * Called by GameScene when the player base takes damage.
   * Triggers a brief red flash on the player HP bar.
   */
  flashPlayerHpBar(): void {
    this.playerHpFlashTimer = 0.3;
  }

  /**
   * Update the weather text display in the top bar.
   * Called by GameScene each frame.
   */
  updateWeatherText(weatherName: string): void {
    if (this.weatherDisplayText) {
      this.weatherDisplayText.setText(`Weather: ${weatherName}`);
    }
  }

  /**
   * Update the hero HP display in the top bar.
   * Called by GameScene each frame.
   */
  updateHeroHp(current: number, max: number): void {
    this.heroHpCurrent = current;
    this.heroHpMax = max;
    if (this.heroHpText) {
      if (max > 0) {
        this.heroHpText.setText(`Hero: ${Math.ceil(current)}/${max}`);
      } else {
        this.heroHpText.setText('Hero: DEAD');
      }
    }
  }

  /**
   * Update the unit button labels with actual unit configs from the current age.
   * Called by GameScene on create and whenever the player evolves.
   */
  updateUnitDefs(units: UnitDef[]): void {
    this.unitDefs = units.slice(0, 4);

    // Pad to 4 if fewer units
    while (this.unitDefs.length < 4) {
      this.unitDefs.push({ name: '---', cost: 0, key: ['Q', 'W', 'E', 'R'][this.unitDefs.length] });
    }

    // Update existing button text objects
    for (let i = 0; i < this.unitButtons.length; i++) {
      const btn = this.unitButtons[i];
      const def = this.unitDefs[i];
      btn.nameText.setText(def.name);
      btn.costText.setText(`$${def.cost}`);
      btn.keyText.setText(`[${def.key}]`);
    }

    // Reset cooldowns on age change
    this.unitCooldowns = [0, 0, 0, 0];
  }

  // ─────────────────────── HELPERS ───────────────────────

  private getXpToNext(currentAge: number): number {
    // Use ConfigLoader if available, otherwise fallback
    if (!this.configLoader) {
      try {
        this.configLoader = new ConfigLoader();
      } catch {
        // Fallback to hardcoded thresholds
      }
    }

    if (this.configLoader) {
      return this.configLoader.getXpToNext(currentAge);
    }

    // Fallback thresholds
    const thresholds: Record<number, number> = {
      1: 100, 2: 250, 3: 500, 4: 900, 5: 1400, 6: 2200, 7: 3500, 8: 0,
    };
    return thresholds[currentAge] ?? 500;
  }
}
