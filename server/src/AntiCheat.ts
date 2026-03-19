/**
 * AntiCheat -- Server-side validation and cheat detection.
 *
 * - Rate limit: max 20 commands/second per player
 * - Input validation: verify affordability, age requirements
 * - Cooldown tracking for special ability and hero abilities
 * - Desync detection: force resync if client diverges >5%
 * - Timeout: auto-forfeit after 60 seconds of no input
 */

const MAX_COMMANDS_PER_SECOND = 20;
const TIMEOUT_SECONDS = 60;
const RATE_WINDOW_MS = 1000;

export interface CooldownState {
  specialCooldown: number;
  heroAbility1Cooldown: number;
  heroAbility2Cooldown: number;
}

export class AntiCheat {
  /** Per-player command timestamps for rate limiting. */
  private readonly commandTimestamps: Map<string, number[]> = new Map();

  /** Per-player cooldown state. */
  private readonly cooldowns: Map<string, CooldownState> = new Map();

  /** Per-player last input time for timeout detection. */
  private readonly lastInputTime: Map<string, number> = new Map();

  /** Initialize tracking for a player. */
  registerPlayer(playerId: string): void {
    this.commandTimestamps.set(playerId, []);
    this.cooldowns.set(playerId, {
      specialCooldown: 0,
      heroAbility1Cooldown: 0,
      heroAbility2Cooldown: 0,
    });
    this.lastInputTime.set(playerId, Date.now());
  }

  /** Remove tracking for a player. */
  unregisterPlayer(playerId: string): void {
    this.commandTimestamps.delete(playerId);
    this.cooldowns.delete(playerId);
    this.lastInputTime.delete(playerId);
  }

  /**
   * Check if a command is rate-limited.
   * Returns true if the command should be rejected.
   */
  isRateLimited(playerId: string): boolean {
    const timestamps = this.commandTimestamps.get(playerId);
    if (!timestamps) return true;

    const now = Date.now();
    // Remove timestamps older than the rate window
    while (timestamps.length > 0 && now - timestamps[0] > RATE_WINDOW_MS) {
      timestamps.shift();
    }

    if (timestamps.length >= MAX_COMMANDS_PER_SECOND) {
      return true;
    }

    timestamps.push(now);
    return false;
  }

  /** Record that the player sent input. */
  recordInput(playerId: string): void {
    this.lastInputTime.set(playerId, Date.now());
  }

  /**
   * Check if a player has timed out (no input for 60 seconds).
   * Returns true if timed out.
   */
  hasTimedOut(playerId: string): boolean {
    const lastTime = this.lastInputTime.get(playerId);
    if (lastTime === undefined) return true;
    return (Date.now() - lastTime) > TIMEOUT_SECONDS * 1000;
  }

  /** Update cooldowns by decrementing them. */
  updateCooldowns(playerId: string, deltaSec: number): void {
    const cd = this.cooldowns.get(playerId);
    if (!cd) return;

    cd.specialCooldown = Math.max(0, cd.specialCooldown - deltaSec);
    cd.heroAbility1Cooldown = Math.max(0, cd.heroAbility1Cooldown - deltaSec);
    cd.heroAbility2Cooldown = Math.max(0, cd.heroAbility2Cooldown - deltaSec);
  }

  /** Check if the special ability is on cooldown. */
  isSpecialOnCooldown(playerId: string): boolean {
    const cd = this.cooldowns.get(playerId);
    return cd ? cd.specialCooldown > 0 : true;
  }

  /** Set the special ability cooldown. */
  setSpecialCooldown(playerId: string, seconds: number): void {
    const cd = this.cooldowns.get(playerId);
    if (cd) cd.specialCooldown = seconds;
  }

  /** Check if a hero ability is on cooldown. */
  isHeroAbilityOnCooldown(playerId: string, index: number): boolean {
    const cd = this.cooldowns.get(playerId);
    if (!cd) return true;
    return index === 0 ? cd.heroAbility1Cooldown > 0 : cd.heroAbility2Cooldown > 0;
  }

  /** Set a hero ability cooldown. */
  setHeroAbilityCooldown(playerId: string, index: number, seconds: number): void {
    const cd = this.cooldowns.get(playerId);
    if (!cd) return;
    if (index === 0) {
      cd.heroAbility1Cooldown = seconds;
    } else {
      cd.heroAbility2Cooldown = seconds;
    }
  }

  /**
   * Validate an input command against game state.
   * Returns null if valid, or an error string if invalid.
   */
  validateSpawn(
    gold: number,
    unitCost: number,
    unitAge: number,
    currentAge: number
  ): string | null {
    if (gold < unitCost) {
      return 'Insufficient gold';
    }
    if (unitAge > currentAge) {
      return 'Unit not available in current age';
    }
    return null;
  }

  /**
   * Validate evolve command.
   */
  validateEvolve(
    xp: number,
    xpRequired: number,
    currentAge: number,
    maxAge: number
  ): string | null {
    if (currentAge >= maxAge) {
      return 'Already at max age';
    }
    if (xp < xpRequired) {
      return 'Insufficient XP to evolve';
    }
    return null;
  }
}
