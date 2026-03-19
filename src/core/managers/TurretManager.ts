/**
 * TurretManager — manages turret slots for a single side.
 *
 * 5 slots per side (expandable to 6 via tech tree).
 * Handles building, upgrading, and selling turrets.
 */

import { World } from '../ecs/World';
import { EntityId } from '../ecs/Entity';
import type { Position } from '../components/Position';
import type { Health } from '../components/Health';
import type { Faction } from '../components/Faction';
import type { TurretComponent } from '../components/Turret';
import type { Renderable } from '../components/Renderable';
import { SpatialGrid } from '../../utils/SpatialGrid';
import { EconomySystem } from '../systems/EconomySystem';

/** Turret config as loaded from turrets.json. */
export interface TurretConfig {
  id: string;
  displayName: string;
  age: number;
  category: 'anti_infantry' | 'anti_heavy';
  stats: {
    damage: number;
    fireRate: number;
    range: number;
    splashRadius: number;
    hp: number;
    cost: number;
  };
  upgrades: Array<{
    level: number;
    cost: number;
    damage: number;
    fireRate: number;
  }>;
  projectile: {
    type: string;
    speed: number;
  };
  targeting: string;
}

export interface TurretConfigMap {
  [turretId: string]: TurretConfig;
}

export interface TurretsFile {
  turrets: TurretConfigMap;
}

interface SlotInfo {
  entityId: EntityId;
  turretId: string;
  level: number;
}

/** Base positions for player turret slots. Enemy slots are mirrored. */
const PLAYER_BASE_X = 80;
const ENEMY_BASE_X = 1520;

/** Slot Y positions from ground to roof. */
const SLOT_Y_POSITIONS = [480, 440, 400, 360, 320];

/** Slot X offsets relative to base position (closer slots are further from base). */
const SLOT_X_OFFSETS = [20, 10, 0, -10, -20];

const SELL_REFUND_RATIO = 0.5;
const MAX_SLOTS = 5;

export class TurretManager {
  private readonly world: World;
  private readonly spatialGrid: SpatialGrid;
  private readonly economy: EconomySystem;
  private readonly faction: 'player' | 'enemy';
  private readonly turretConfigs: TurretConfigMap;
  private readonly slots: Map<number, SlotInfo> = new Map();
  private maxSlots: number = MAX_SLOTS;

  constructor(
    world: World,
    spatialGrid: SpatialGrid,
    economy: EconomySystem,
    faction: 'player' | 'enemy',
    turretConfigs: TurretConfigMap,
  ) {
    this.world = world;
    this.spatialGrid = spatialGrid;
    this.economy = economy;
    this.faction = faction;
    this.turretConfigs = turretConfigs;
  }

  /**
   * Get the world position for a turret slot.
   */
  getSlotPosition(slot: number): Position {
    const baseX = this.faction === 'player' ? PLAYER_BASE_X : ENEMY_BASE_X;
    const direction = this.faction === 'player' ? 1 : -1;
    const xOffset = SLOT_X_OFFSETS[slot] ?? 0;

    return {
      x: baseX + xOffset * direction,
      y: SLOT_Y_POSITIONS[slot] ?? 480,
    };
  }

  /**
   * Build a turret in a specific slot.
   * Returns the entity ID on success, null on failure.
   */
  buildTurret(slot: number, turretId: string): EntityId | null {
    // Validate slot
    if (slot < 0 || slot >= this.maxSlots) {
      return null;
    }

    // Check slot is empty
    if (this.slots.has(slot)) {
      return null;
    }

    // Get turret config
    const config = this.turretConfigs[turretId];
    if (!config) {
      return null;
    }

    // Check affordability
    if (!this.economy.canAfford(config.stats.cost)) {
      return null;
    }

    // Spend gold
    if (!this.economy.spend(config.stats.cost)) {
      return null;
    }

    // Create entity
    const entityId = this.world.createEntity();
    const pos = this.getSlotPosition(slot);

    this.world.addComponent<Position>(entityId, 'Position', { x: pos.x, y: pos.y });
    this.world.addComponent<Health>(entityId, 'Health', {
      current: config.stats.hp,
      max: config.stats.hp,
    });
    this.world.addComponent<Faction>(entityId, 'Faction', { faction: this.faction });
    this.world.addComponent<TurretComponent>(entityId, 'TurretComponent', {
      turretId,
      slot,
      age: config.age,
      damage: config.stats.damage,
      fireRate: config.stats.fireRate,
      range: config.stats.range,
      splashRadius: config.stats.splashRadius,
      lastFireTime: -Infinity,
      level: 1,
      targeting: (config.targeting as TurretComponent['targeting']) || 'nearest',
      category: config.category,
    });
    this.world.addComponent<Renderable>(entityId, 'Renderable', {
      spriteKey: `turret_${turretId}`,
      animation: 'idle',
      layer: 2,
      visible: true,
      flipX: this.faction === 'enemy',
    });

    // Insert into spatial grid
    this.spatialGrid.insert(entityId, pos.x, pos.y);

    // Track slot
    this.slots.set(slot, { entityId, turretId, level: 1 });

    return entityId;
  }

  /**
   * Upgrade a turret in a specific slot.
   * Returns true on success, false on failure.
   */
  upgradeTurret(slot: number): boolean {
    const slotInfo = this.slots.get(slot);
    if (!slotInfo) return false;

    const config = this.turretConfigs[slotInfo.turretId];
    if (!config) return false;

    // Check if can upgrade (max level 3)
    if (slotInfo.level >= 3) return false;

    const nextLevel = slotInfo.level + 1;
    const upgradeData = config.upgrades.find((u) => u.level === nextLevel);
    if (!upgradeData) return false;

    // Check affordability
    if (!this.economy.canAfford(upgradeData.cost)) return false;

    // Spend gold
    if (!this.economy.spend(upgradeData.cost)) return false;

    // Apply upgrade to component
    const turretComp = this.world.getComponent<TurretComponent>(slotInfo.entityId, 'TurretComponent');
    if (!turretComp) return false;

    turretComp.level = nextLevel;
    turretComp.damage = upgradeData.damage;
    turretComp.fireRate = upgradeData.fireRate;
    slotInfo.level = nextLevel;

    return true;
  }

  /**
   * Sell a turret, returning 50% of total invested gold.
   * Returns the gold refunded, or 0 if the slot is empty.
   */
  sellTurret(slot: number): number {
    const slotInfo = this.slots.get(slot);
    if (!slotInfo) return 0;

    const config = this.turretConfigs[slotInfo.turretId];
    if (!config) return 0;

    // Calculate total invested cost (base + upgrades)
    let totalCost = config.stats.cost;
    for (const upgrade of config.upgrades) {
      if (upgrade.level > 1 && upgrade.level <= slotInfo.level) {
        totalCost += upgrade.cost;
      }
    }

    const refund = Math.floor(totalCost * SELL_REFUND_RATIO);

    // Refund gold
    this.economy.addGold(refund);

    // Destroy entity
    this.world.destroyEntity(slotInfo.entityId);
    this.spatialGrid.remove(slotInfo.entityId);

    // Free slot
    this.slots.delete(slot);

    return refund;
  }

  /**
   * Get info about a turret in a specific slot.
   */
  getTurretInSlot(slot: number): SlotInfo | null {
    return this.slots.get(slot) ?? null;
  }

  /**
   * Check if a slot is empty.
   */
  isSlotEmpty(slot: number): boolean {
    return !this.slots.has(slot);
  }

  /**
   * Get all occupied slot indices.
   */
  getOccupiedSlots(): number[] {
    return [...this.slots.keys()];
  }

  /**
   * Get the number of turrets currently built.
   */
  getTurretCount(): number {
    return this.slots.size;
  }

  /**
   * Unlock an extra slot (e.g., from tech tree).
   */
  unlockExtraSlot(): void {
    this.maxSlots = Math.min(this.maxSlots + 1, 6);
  }

  /**
   * Get the current max slots.
   */
  getMaxSlots(): number {
    return this.maxSlots;
  }

  /**
   * Get a turret config by ID.
   */
  getTurretConfig(turretId: string): TurretConfig | undefined {
    return this.turretConfigs[turretId];
  }

  /**
   * Reset all turret slots (for new game).
   */
  reset(): void {
    for (const [slot] of this.slots) {
      this.sellTurret(slot);
    }
    this.slots.clear();
    this.maxSlots = MAX_SLOTS;
  }
}
