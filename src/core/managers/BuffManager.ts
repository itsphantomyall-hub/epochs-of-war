/**
 * BuffManager -- manages active survival buffs, random selection,
 * and application of buff effects to spawns and economy.
 */

import survivalData from '../../config/survival.json';
import type { SpawnRequest } from '../systems/SpawnSystem';

export interface BuffEffect {
  type: string;
  value?: number;
  dps?: number;
  duration?: number;
  hpThreshold?: number;
  damageBonus?: number;
  chance?: number;
  multiplier?: number;
  extraTargets?: number;
  cooldown?: number;
  charges?: number;
}

export interface BuffConfig {
  id: string;
  name: string;
  description: string;
  rarity: 'common' | 'legendary';
  category: 'offensive' | 'defensive' | 'economy' | 'legendary';
  effect: BuffEffect;
}

const LEGENDARY_CHANCE = 0.1;

export class BuffManager {
  private allBuffs: BuffConfig[];
  private activeBuffs: BuffConfig[] = [];

  constructor() {
    const data = survivalData.buffs;
    this.allBuffs = [
      ...(data.offensive as BuffConfig[]),
      ...(data.defensive as BuffConfig[]),
      ...(data.economy as BuffConfig[]),
      ...(data.legendary as BuffConfig[]),
    ];
  }

  // ── Selection ──────────────────────────────────────────

  /**
   * Get random buff choices for the player to pick from.
   * @param count Number of choices (typically 3).
   */
  getRandomBuffChoices(count: number = 3): BuffConfig[] {
    const pool: BuffConfig[] = [];

    // For each slot, decide if it should be legendary (10% chance)
    for (let i = 0; i < count; i++) {
      const isLegendary = Math.random() < LEGENDARY_CHANCE;
      const category = isLegendary ? 'legendary' : null;

      let candidates: BuffConfig[];
      if (category === 'legendary') {
        candidates = this.allBuffs.filter((b) => b.category === 'legendary');
      } else {
        // Pick from common categories
        const commonCategories: Array<'offensive' | 'defensive' | 'economy'> = ['offensive', 'defensive', 'economy'];
        const cat = commonCategories[Math.floor(Math.random() * commonCategories.length)];
        candidates = this.allBuffs.filter((b) => b.category === cat);
      }

      // Filter out already-chosen buffs in this selection (avoid duplicates)
      const selectedIds = new Set(pool.map((b) => b.id));
      candidates = candidates.filter((b) => !selectedIds.has(b.id));

      if (candidates.length > 0) {
        pool.push(candidates[Math.floor(Math.random() * candidates.length)]);
      }
    }

    return pool;
  }

  // ── Activation ─────────────────────────────────────────

  activateBuff(buffId: string): void {
    const buff = this.allBuffs.find((b) => b.id === buffId);
    if (buff) {
      this.activeBuffs.push(buff);
    }
  }

  getActiveBuffs(): ReadonlyArray<BuffConfig> {
    return this.activeBuffs;
  }

  hasActiveBuff(buffId: string): boolean {
    return this.activeBuffs.some((b) => b.id === buffId);
  }

  // ── Effect application ─────────────────────────────────

  /**
   * Modify a spawn request based on active buffs.
   * Called before enqueueing a player unit.
   */
  applyToSpawnRequest(request: SpawnRequest): SpawnRequest {
    const modified = { ...request };

    for (const buff of this.activeBuffs) {
      const effect = buff.effect;
      switch (effect.type) {
        case 'melee_damage':
          if (modified.range === 0 && effect.value !== undefined) {
            modified.damage = Math.round(modified.damage * effect.value);
          }
          break;
        case 'hp_bonus':
          if (effect.value !== undefined) {
            modified.hp = Math.round(modified.hp * effect.value);
          }
          break;
        case 'spawn_time':
          if (effect.value !== undefined) {
            modified.spawnTime = modified.spawnTime * effect.value;
          }
          break;
        case 'attack_speed':
          if (effect.value !== undefined) {
            modified.attackSpeed = modified.attackSpeed * effect.value;
          }
          break;
        case 'global_damage':
          if (effect.value !== undefined) {
            modified.damage = Math.round(modified.damage * effect.value);
          }
          break;
      }
    }

    return modified;
  }

  /**
   * Get the cumulative gold kill bonus multiplier from active economy buffs.
   */
  getKillGoldMultiplier(): number {
    let mult = 1.0;
    for (const buff of this.activeBuffs) {
      if (buff.effect.type === 'kill_gold_bonus' && buff.effect.value !== undefined) {
        mult *= buff.effect.value;
      }
    }
    return mult;
  }

  /**
   * Get the base HP bonus from active defensive buffs.
   */
  getBaseHpBonus(): number {
    let bonus = 0;
    for (const buff of this.activeBuffs) {
      if (buff.effect.type === 'base_hp' && buff.effect.value !== undefined) {
        bonus += buff.effect.value;
      }
    }
    return bonus;
  }

  /**
   * Get the between-wave base heal amount.
   */
  getBetweenWaveHeal(): number {
    let heal = 0;
    for (const buff of this.activeBuffs) {
      if (buff.effect.type === 'base_heal' && buff.effect.value !== undefined) {
        heal += buff.effect.value;
      }
    }
    return heal;
  }

  /**
   * Get the interest rate for between-wave gold.
   */
  getInterestRate(): number {
    let rate = 0;
    for (const buff of this.activeBuffs) {
      if (buff.effect.type === 'interest' && buff.effect.value !== undefined) {
        rate += buff.effect.value;
      }
    }
    return rate;
  }

  // ── Category color mapping ─────────────────────────────

  static getCategoryColor(category: string): number {
    switch (category) {
      case 'offensive': return 0xff4444;
      case 'defensive': return 0x4488ff;
      case 'economy': return 0xffcc00;
      case 'legendary': return 0xaa44ff;
      default: return 0x888888;
    }
  }

  static getCategoryColorHex(category: string): string {
    switch (category) {
      case 'offensive': return '#ff4444';
      case 'defensive': return '#4488ff';
      case 'economy': return '#ffcc00';
      case 'legendary': return '#aa44ff';
      default: return '#888888';
    }
  }

  // ── Reset ──────────────────────────────────────────────

  reset(): void {
    this.activeBuffs = [];
  }
}
