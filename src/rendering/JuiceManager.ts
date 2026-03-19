import Phaser from 'phaser';

/**
 * Screen-shake tier configuration.
 */
interface ShakeConfig {
  duration: number;   // ms
  magnitude: number;  // px
}

/**
 * JuiceManager — handles hit-stop, screen shake, kill combo, evolution
 * cinematic, and low HP warning effects.
 *
 * Designed to be owned by GameScene and integrated into its update loop.
 */
export class JuiceManager {
  private readonly scene: Phaser.Scene;

  // ── Hit-Stop ──
  private hitStopRemaining: number = 0;

  // ── Screen Shake ──
  public shakeEnabled: boolean = true;

  // ── Kill Combo ──
  private comboCount: number = 0;
  private comboTimer: number = 0;
  private comboText: Phaser.GameObjects.Text | null = null;
  private static readonly COMBO_WINDOW = 3; // seconds

  // ── Evolution Cinematic ──
  private _evolutionPlaying: boolean = false;
  private evolutionTimer: number = 0;
  private evolutionAgeName: string = '';
  private evolutionBaseX: number = 0;
  private evolutionBaseY: number = 0;
  private evolutionText: Phaser.GameObjects.Text | null = null;
  private evolutionFlashGraphics: Phaser.GameObjects.Graphics | null = null;
  private evolutionGoldSpawnTimer: number = 0;

  // ── Low HP Warning ──
  private lowHpOverlay: Phaser.GameObjects.Graphics | null = null;
  private lowHpPulseTimer: number = 0;
  private lowHpTextTimer: number = 0;
  private lowHpText: Phaser.GameObjects.Text | null = null;

  // ── Callbacks for spawning particles (avoids circular dep on ParticleManager) ──
  public onSpawnGoldParticles: ((x: number, y: number) => void) | null = null;
  public onSpawnCelebrationParticles: ((x: number, y: number) => void) | null = null;
  public onSpawnComboParticles: ((x: number, y: number) => void) | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  // ═══════════════════════════════════════════════════════════════════
  //  HIT-STOP
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Freeze game updates for `durationMs` milliseconds.
   * While hit-stop is active, `isHitStopped` returns true and the
   * caller should skip system updates but keep rendering.
   */
  hitStop(durationMs: number): void {
    // Keep the longer of current remaining vs new request
    this.hitStopRemaining = Math.max(this.hitStopRemaining, durationMs / 1000);
  }

  /** True while hit-stop is active — skip game logic updates. */
  get isHitStopped(): boolean {
    return this.hitStopRemaining > 0;
  }

  /** True while evolution cinematic is playing. */
  get evolutionPlaying(): boolean {
    return this._evolutionPlaying;
  }

  /**
   * Convenience methods for triggering hit-stop at standard durations.
   */
  hitStopHeavyDeath(): void { this.hitStop(50); }
  hitStopCounterKill(): void { this.hitStop(30); }
  hitStopHeroAbility(): void { this.hitStop(80); }
  hitStopSpecialAbility(): void { this.hitStop(100); }
  hitStopBaseHit(): void { this.hitStop(40); }

  // ═══════════════════════════════════════════════════════════════════
  //  SCREEN SHAKE
  // ═══════════════════════════════════════════════════════════════════

  private static readonly SHAKE_LIGHT: ShakeConfig  = { duration: 100, magnitude: 1 };
  private static readonly SHAKE_MEDIUM: ShakeConfig = { duration: 200, magnitude: 3 };
  private static readonly SHAKE_HEAVY: ShakeConfig  = { duration: 300, magnitude: 5 };

  private applyShake(config: ShakeConfig, durationOverride?: number): void {
    if (!this.shakeEnabled) return;
    const d = durationOverride ?? config.duration;
    // Phaser camera shake: intensity is relative to viewport size
    // 1px / 1280 ~ 0.00078, 3px ~ 0.0023, 5px ~ 0.0039
    const intensity = config.magnitude / 1280;
    this.scene.cameras.main.shake(d, intensity);
  }

  shakeLight(): void { this.applyShake(JuiceManager.SHAKE_LIGHT); }
  shakeMedium(): void { this.applyShake(JuiceManager.SHAKE_MEDIUM); }
  shakeHeavy(): void { this.applyShake(JuiceManager.SHAKE_HEAVY); }

  /** Sustained heavy shake for base destruction (1.5s). */
  shakeBaseDestroyed(): void {
    this.applyShake(JuiceManager.SHAKE_HEAVY, 1500);
  }

  /**
   * Wire to death events by unit type:
   * - heavy → shakeLight
   * - special → shakeMedium
   * - hero → shakeHeavy
   */
  shakeForDeath(unitType: string): void {
    switch (unitType) {
      case 'heavy': this.shakeLight(); break;
      case 'special': this.shakeMedium(); break;
      case 'hero': this.shakeHeavy(); break;
      // infantry, ranged: no shake
    }
  }

  /** Shake for base hit with >50 damage. */
  shakeForBaseHit(damage: number): void {
    if (damage > 50) {
      this.shakeLight();
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  //  KILL COMBO
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Record a kill. Call when a player kill occurs.
   */
  recordKill(): void {
    this.comboCount++;
    this.comboTimer = JuiceManager.COMBO_WINDOW;

    if (this.comboCount >= 3) {
      this.showComboText();
    }
  }

  private showComboText(): void {
    // Destroy old text
    if (this.comboText) {
      this.comboText.destroy();
      this.comboText = null;
    }

    let label: string;
    let color: string;
    let targetScale: number;

    if (this.comboCount >= 10) {
      label = 'MEGA COMBO!';
      color = '#ff3333';
      targetScale = 2.0;
      this.shakeMedium();
      this.onSpawnComboParticles?.(640, 80);
    } else if (this.comboCount >= 5) {
      label = `COMBO x${this.comboCount}!`;
      color = '#ff8800';
      targetScale = 1.8;
      this.shakeLight();
    } else {
      label = `COMBO x${this.comboCount}!`;
      color = '#ffdd00';
      targetScale = 1.5;
    }

    this.comboText = this.scene.add.text(640, 80, label, {
      fontSize: '28px',
      fontFamily: 'monospace',
      color,
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(8000).setAlpha(0).setScale(0.3);

    // Scale up quickly (100ms), hold (500ms), fade out (400ms)
    this.scene.tweens.add({
      targets: this.comboText,
      alpha: { from: 0, to: 1 },
      scaleX: { from: 0.3, to: targetScale },
      scaleY: { from: 0.3, to: targetScale },
      duration: 100,
      ease: 'Back.easeOut',
      onComplete: () => {
        if (!this.comboText) return;
        // Hold for 500ms, then fade
        this.scene.time.delayedCall(500, () => {
          if (!this.comboText) return;
          this.scene.tweens.add({
            targets: this.comboText,
            alpha: 0,
            duration: 400,
            ease: 'Sine.easeIn',
            onComplete: () => {
              if (this.comboText) {
                this.comboText.destroy();
                this.comboText = null;
              }
            },
          });
        });
      },
    });
  }

  // ═══════════════════════════════════════════════════════════════════
  //  EVOLUTION CINEMATIC (3 seconds)
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Start the evolution cinematic sequence.
   * @param ageName e.g. "MEDIEVAL AGE"
   * @param baseX Screen X of player base
   * @param baseY Screen Y of player base center
   */
  playEvolutionCinematic(ageName: string, baseX: number, baseY: number): void {
    if (this._evolutionPlaying) return;

    this._evolutionPlaying = true;
    this.evolutionTimer = 0;
    this.evolutionAgeName = ageName;
    this.evolutionBaseX = baseX;
    this.evolutionBaseY = baseY;
    this.evolutionGoldSpawnTimer = 0;

    // Create flash overlay
    this.evolutionFlashGraphics = this.scene.add.graphics().setDepth(9500);
    this.evolutionFlashGraphics.setAlpha(0);
  }

  /**
   * Must be called every frame while evolution is playing.
   * @param delta seconds
   */
  updateEvolutionCinematic(delta: number): void {
    if (!this._evolutionPlaying) return;

    this.evolutionTimer += delta;
    const t = this.evolutionTimer;

    // 0.0s: evolutionPlaying = true, pause game (handled by caller)

    // 0.3s-0.8s: Spawn gold particles at base (5 per 100ms)
    if (t >= 0.3 && t < 0.8) {
      this.evolutionGoldSpawnTimer += delta;
      if (this.evolutionGoldSpawnTimer >= 0.1) {
        this.evolutionGoldSpawnTimer -= 0.1;
        this.onSpawnGoldParticles?.(this.evolutionBaseX, this.evolutionBaseY);
      }
    }

    // 0.5s: Camera flash white (alpha 0→0.8→0 over 300ms)
    if (this.evolutionFlashGraphics) {
      if (t >= 0.5 && t < 0.8) {
        const flashProgress = (t - 0.5) / 0.3;
        // 0→0.8 in first half, 0.8→0 in second half
        const flashAlpha = flashProgress < 0.5
          ? flashProgress * 2 * 0.8
          : (1 - flashProgress) * 2 * 0.8;
        this.evolutionFlashGraphics.clear();
        this.evolutionFlashGraphics.fillStyle(0xffffff, flashAlpha);
        this.evolutionFlashGraphics.fillRect(0, 0, 1280, 720);
      } else if (t >= 0.8 && this.evolutionFlashGraphics.alpha > 0) {
        this.evolutionFlashGraphics.clear();
        this.evolutionFlashGraphics.setAlpha(0);
      }
    }

    // 0.8s: Celebration particles
    if (t >= 0.8 && t < 0.85) {
      // Only trigger once (within 50ms window)
      if (this.evolutionTimer - delta < 0.8) {
        this.onSpawnCelebrationParticles?.(this.evolutionBaseX, this.evolutionBaseY);
      }
    }

    // 1.0s: Camera zoom toward base (1.0x → 1.2x over 500ms)
    if (t >= 1.0 && t < 1.05) {
      if (this.evolutionTimer - delta < 1.0) {
        this.scene.tweens.add({
          targets: this.scene.cameras.main,
          zoom: 1.2,
          duration: 500,
          ease: 'Sine.easeInOut',
        });
      }
    }

    // 1.5s: Display age name text
    if (t >= 1.5 && !this.evolutionText) {
      this.evolutionText = this.scene.add.text(640, 300, this.evolutionAgeName, {
        fontSize: '48px',
        fontFamily: 'monospace',
        color: '#DAA520',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 6,
      }).setOrigin(0.5).setDepth(9600).setAlpha(0).setScale(0);

      // Scale from 0 to 1.0 with bounce easing (200ms)
      this.scene.tweens.add({
        targets: this.evolutionText,
        alpha: 1,
        scaleX: 1,
        scaleY: 1,
        duration: 200,
        ease: 'Back.easeOut',
      });
    }

    // 2.0s: Camera zoom back (1.2x → 1.0x over 500ms)
    if (t >= 2.0 && t < 2.05) {
      if (this.evolutionTimer - delta < 2.0) {
        this.scene.tweens.add({
          targets: this.scene.cameras.main,
          zoom: 1.0,
          duration: 500,
          ease: 'Sine.easeInOut',
        });
      }
    }

    // 2.5s: Age name text starts fading (alpha 1→0 over 500ms)
    if (t >= 2.5 && t < 2.55) {
      if (this.evolutionTimer - delta < 2.5 && this.evolutionText) {
        this.scene.tweens.add({
          targets: this.evolutionText,
          alpha: 0,
          duration: 500,
          ease: 'Sine.easeIn',
        });
      }
    }

    // 3.0s: Done — clean up and resume
    if (t >= 3.0) {
      this._evolutionPlaying = false;
      this.evolutionTimer = 0;

      if (this.evolutionText) {
        this.evolutionText.destroy();
        this.evolutionText = null;
      }
      if (this.evolutionFlashGraphics) {
        this.evolutionFlashGraphics.destroy();
        this.evolutionFlashGraphics = null;
      }

      // Ensure camera zoom is back to 1.0
      this.scene.cameras.main.zoom = 1.0;
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  //  LOW HP WARNING
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Create the low HP overlay graphics. Call once in create().
   */
  createLowHpOverlay(): void {
    this.lowHpOverlay = this.scene.add.graphics().setDepth(9000);
    this.lowHpOverlay.setVisible(false);
  }

  /**
   * Update the low HP vignette and warning text.
   * @param hpPct Current player base HP as fraction (0-1)
   * @param delta Seconds since last frame
   */
  updateLowHpWarning(hpPct: number, delta: number): void {
    if (!this.lowHpOverlay) return;

    if (hpPct < 0.25 && hpPct > 0) {
      this.lowHpOverlay.setVisible(true);
      this.lowHpPulseTimer += delta;

      // Oscillate alpha: 0.08 → 0.2 → 0.08 with period 1.5s
      const cycle = (this.lowHpPulseTimer % 1.5) / 1.5;
      const alpha = 0.08 + 0.12 * Math.sin(cycle * Math.PI * 2);

      this.lowHpOverlay.clear();

      // Radial vignette effect: draw stepped edge rectangles
      // Outer edges = darker, inner = lighter (simulate radial gradient)
      const steps = 4;
      for (let s = 0; s < steps; s++) {
        const stepAlpha = alpha * (1 - s * 0.2);
        const borderW = 60 - s * 12;
        const borderH = 50 - s * 10;

        this.lowHpOverlay.fillStyle(0xff0000, stepAlpha);
        // Top
        this.lowHpOverlay.fillRect(0, s * borderH, 1280, borderH);
        // Bottom
        this.lowHpOverlay.fillRect(0, 720 - (s + 1) * borderH, 1280, borderH);
        // Left
        this.lowHpOverlay.fillRect(s * borderW, 0, borderW, 720);
        // Right
        this.lowHpOverlay.fillRect(1280 - (s + 1) * borderW, 0, borderW, 720);
      }

      // "BASE CRITICAL!" flashing text every 3 seconds
      this.lowHpTextTimer += delta;
      if (this.lowHpTextTimer >= 3.0) {
        this.lowHpTextTimer -= 3.0;
        this.flashBaseCriticalText();
      }
    } else {
      this.lowHpOverlay.setVisible(false);
      this.lowHpTextTimer = 0;

      if (this.lowHpText) {
        this.lowHpText.destroy();
        this.lowHpText = null;
      }
    }
  }

  private flashBaseCriticalText(): void {
    if (this.lowHpText) {
      this.lowHpText.destroy();
    }

    this.lowHpText = this.scene.add.text(640, 130, 'BASE CRITICAL!', {
      fontSize: '24px',
      fontFamily: 'monospace',
      color: '#ff2222',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(9001).setAlpha(0);

    this.scene.tweens.add({
      targets: this.lowHpText,
      alpha: { from: 0, to: 1 },
      duration: 200,
      ease: 'Sine.easeOut',
      yoyo: true,
      hold: 600,
      onComplete: () => {
        if (this.lowHpText) {
          this.lowHpText.destroy();
          this.lowHpText = null;
        }
      },
    });
  }

  // ═══════════════════════════════════════════════════════════════════
  //  MAIN UPDATE
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Call every frame. Returns true if game systems should be skipped
   * (due to hit-stop or evolution cinematic).
   * @param delta Seconds since last frame
   */
  update(delta: number): boolean {
    let skipSystems = false;

    // ── Hit-stop countdown ──
    if (this.hitStopRemaining > 0) {
      this.hitStopRemaining -= delta;
      if (this.hitStopRemaining < 0) this.hitStopRemaining = 0;
      skipSystems = true;
    }

    // ── Evolution cinematic ──
    if (this._evolutionPlaying) {
      this.updateEvolutionCinematic(delta);
      skipSystems = true;
    }

    // ── Kill combo timer ──
    if (this.comboTimer > 0) {
      this.comboTimer -= delta;
      if (this.comboTimer <= 0) {
        this.comboCount = 0;
        this.comboTimer = 0;
      }
    }

    return skipSystems;
  }

  /**
   * Clean up all game objects.
   */
  destroy(): void {
    if (this.comboText) { this.comboText.destroy(); this.comboText = null; }
    if (this.evolutionText) { this.evolutionText.destroy(); this.evolutionText = null; }
    if (this.evolutionFlashGraphics) { this.evolutionFlashGraphics.destroy(); this.evolutionFlashGraphics = null; }
    if (this.lowHpOverlay) { this.lowHpOverlay.destroy(); this.lowHpOverlay = null; }
    if (this.lowHpText) { this.lowHpText.destroy(); this.lowHpText = null; }
  }

  /** Reset combo state. */
  resetCombo(): void {
    this.comboCount = 0;
    this.comboTimer = 0;
    if (this.comboText) {
      this.comboText.destroy();
      this.comboText = null;
    }
  }
}
