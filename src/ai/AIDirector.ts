/**
 * AIDirector — intelligent enemy AI that replaces placeholder behavior.
 *
 * Maintains its own economy, makes strategic decisions on a timer,
 * and adapts to the player's strategy with counter-picking.
 *
 * Difficulty levels control decision speed, counter accuracy, and income.
 */

import { World } from '../core/ecs/World';
import { EntityId } from '../core/ecs/Entity';
import type { Position } from '../core/components/Position';
import type { Faction } from '../core/components/Faction';
import type { Health } from '../core/components/Health';
import type { UnitType as UnitTypeComponent } from '../core/components/UnitType';
import type { TurretComponent } from '../core/components/Turret';
import { EconomySystem } from '../core/systems/EconomySystem';
import { AgeSystem } from '../core/systems/AgeSystem';
import { AbilitySystem } from '../core/systems/AbilitySystem';
import { TurretManager } from '../core/managers/TurretManager';
import { SpawnSystem, SpawnRequest } from '../core/systems/SpawnSystem';
import { ConfigLoader } from '../utils/ConfigLoader';
import { SpatialGrid } from '../utils/SpatialGrid';
import type { UnitConfig } from '../types/Unit';

// ── Difficulty Settings ──────────────────────────────────────────

export type Difficulty = 'easy' | 'normal' | 'hard' | 'impossible' | 'nightmare';

interface DifficultyModifiers {
  /** Seconds between AI decisions. */
  decisionInterval: number;
  /** Whether the AI uses counter-picking. */
  counterPick: boolean;
  /** Whether counter-picking is perfect (vs basic). */
  perfectCounters: boolean;
  /** Income multiplier applied to passive gold gain. */
  incomeMultiplier: number;
  /** Starting age override (null = default age 1). */
  startingAge: number;
}

const DIFFICULTY_SETTINGS: Record<Difficulty, DifficultyModifiers> = {
  easy: {
    decisionInterval: 4.0,
    counterPick: false,
    perfectCounters: false,
    incomeMultiplier: 0.8,
    startingAge: 1,
  },
  normal: {
    decisionInterval: 2.5,
    counterPick: true,
    perfectCounters: false,
    incomeMultiplier: 1.0,
    startingAge: 1,
  },
  hard: {
    decisionInterval: 1.5,
    counterPick: true,
    perfectCounters: true,
    incomeMultiplier: 1.2,
    startingAge: 1,
  },
  impossible: {
    decisionInterval: 1.0,
    counterPick: true,
    perfectCounters: true,
    incomeMultiplier: 1.5,
    startingAge: 1,
  },
  nightmare: {
    decisionInterval: 0.8,
    counterPick: true,
    perfectCounters: true,
    incomeMultiplier: 2.0,
    startingAge: 2,
  },
};

// ── Counter-pick table ───────────────────────────────────────────

/** Maps player unit type → best AI counter type. */
const COUNTER_PICKS: Record<string, string> = {
  infantry: 'heavy',    // Heavy beats infantry
  ranged: 'infantry',   // Infantry closes gap on ranged
  heavy: 'special',     // Specials bypass heavy armor
  special: 'infantry',  // Numbers overwhelm specials
};

/** Basic (imperfect) counter: sometimes picks the right counter, sometimes random. */
const BASIC_COUNTER_CHANCE = 0.6;

// ── Thresholds ───────────────────────────────────────────────────

const GOLD_BUFFER_RATIO = 0.3;         // Don't spend below 30% of cheapest unit cost
const EVOLVE_GOLD_THRESHOLD = 200;     // Must have > 200 gold to consider evolving
const SPECIAL_MIN_GROUP_SIZE = 5;      // Use special when 5+ enemies grouped
const SPECIAL_GROUP_RANGE = 200;       // Within 200px of each other
const THREAT_ASSESSMENT_RANGE = 400;   // How far from enemy base to scan for threats

const XP_REQUIREMENTS = [100, 250, 500, 900, 1400, 2200, 3500];

export class AIDirector {
  private readonly world: World;
  private readonly spatialGrid: SpatialGrid;
  private readonly economy: EconomySystem;
  private readonly ageSystem: AgeSystem;
  private readonly abilitySystem: AbilitySystem;
  private readonly turretManager: TurretManager;
  private readonly spawnSystem: SpawnSystem;
  private readonly configLoader: ConfigLoader;
  private readonly difficulty: DifficultyModifiers;

  private decisionTimer: number = 0;
  private readonly difficultyLevel: Difficulty;

  constructor(
    world: World,
    spatialGrid: SpatialGrid,
    economy: EconomySystem,
    ageSystem: AgeSystem,
    abilitySystem: AbilitySystem,
    turretManager: TurretManager,
    spawnSystem: SpawnSystem,
    configLoader: ConfigLoader,
    difficulty: Difficulty = 'normal',
  ) {
    this.world = world;
    this.spatialGrid = spatialGrid;
    this.economy = economy;
    this.ageSystem = ageSystem;
    this.abilitySystem = abilitySystem;
    this.turretManager = turretManager;
    this.spawnSystem = spawnSystem;
    this.configLoader = configLoader;
    this.difficultyLevel = difficulty;
    this.difficulty = DIFFICULTY_SETTINGS[difficulty];

    // Apply income multiplier
    // The economy update will be called externally; we adjust income via addGold
  }

  /**
   * Called every frame. Ticks the decision timer and makes decisions.
   */
  update(deltaTime: number): void {
    // Apply income multiplier bonus (extra income beyond base)
    if (this.difficulty.incomeMultiplier !== 1.0) {
      const bonusMultiplier = this.difficulty.incomeMultiplier - 1.0;
      const baseIncome = this.economy.getPassiveIncomeRate();
      this.economy.addGold(baseIncome * bonusMultiplier * deltaTime);
    }

    // Economy ticks on its own; AI just makes decisions periodically
    this.decisionTimer += deltaTime;
    if (this.decisionTimer < this.difficulty.decisionInterval) return;
    this.decisionTimer = 0;

    this.makeDecision();
  }

  /**
   * Main decision loop — runs at the interval specified by difficulty.
   */
  private makeDecision(): void {
    const currentAge = this.ageSystem.getCurrentAge();

    // 1. Check if we should evolve
    if (this.shouldEvolve(currentAge)) {
      this.ageSystem.evolve();
      return; // Evolution takes a turn
    }

    // 2. Check if we should use special ability
    if (this.shouldUseSpecial(currentAge)) {
      return; // Used special this turn
    }

    // 3. Assess threats and decide what to spawn
    const threatProfile = this.assessThreats();

    // 4. Consider building turrets
    if (this.shouldBuildTurret(threatProfile, currentAge)) {
      return; // Built a turret this turn
    }

    // 5. Spawn units (main action)
    this.spawnUnits(threatProfile, currentAge);
  }

  // ── Threat Assessment ──────────────────────────────────────────

  private assessThreats(): ThreatProfile {
    const profile: ThreatProfile = {
      infantry: 0,
      ranged: 0,
      heavy: 0,
      special: 0,
      total: 0,
      avgX: 0,
      clusterSize: 0,
      clusterX: 0,
    };

    const enemyBaseX = 1520;
    const entities = this.world.query('Position', 'Faction', 'UnitType');
    let totalX = 0;
    let playerCount = 0;

    // Track positions for cluster detection
    const playerPositions: number[] = [];

    for (let i = 0; i < entities.length; i++) {
      const id = entities[i];
      const faction = this.world.getComponent<Faction>(id, 'Faction')!;
      if (faction.faction !== 'player') continue;

      const pos = this.world.getComponent<Position>(id, 'Position')!;
      const unitType = this.world.getComponent<UnitTypeComponent>(id, 'UnitType')!;

      // Only count threats near enemy base
      const distToBase = Math.abs(pos.x - enemyBaseX);
      if (distToBase < THREAT_ASSESSMENT_RANGE) {
        profile[unitType.type as keyof Omit<ThreatProfile, 'total' | 'avgX' | 'clusterSize' | 'clusterX'>]++;
      }

      totalX += pos.x;
      playerCount++;
      playerPositions.push(pos.x);
    }

    profile.total = profile.infantry + profile.ranged + profile.heavy + profile.special;
    profile.avgX = playerCount > 0 ? totalX / playerCount : 800;

    // Find largest cluster of player units
    const cluster = this.findLargestCluster(playerPositions);
    profile.clusterSize = cluster.size;
    profile.clusterX = cluster.centerX;

    return profile;
  }

  /**
   * Find the largest cluster of positions within SPECIAL_GROUP_RANGE.
   */
  private findLargestCluster(positions: number[]): { size: number; centerX: number } {
    if (positions.length === 0) return { size: 0, centerX: 800 };

    let bestSize = 0;
    let bestCenter = positions[0];

    for (let i = 0; i < positions.length; i++) {
      let count = 0;
      let sumX = 0;
      for (let j = 0; j < positions.length; j++) {
        if (Math.abs(positions[i] - positions[j]) <= SPECIAL_GROUP_RANGE) {
          count++;
          sumX += positions[j];
        }
      }
      if (count > bestSize) {
        bestSize = count;
        bestCenter = sumX / count;
      }
    }

    return { size: bestSize, centerX: bestCenter };
  }

  // ── Evolution Decision ─────────────────────────────────────────

  private shouldEvolve(currentAge: number): boolean {
    if (currentAge >= 8) return false;

    // Check XP requirement
    const xpRequired = XP_REQUIREMENTS[currentAge - 1];
    if (!xpRequired) return false;
    if (this.economy.getXP() < xpRequired) return false;

    // Check gold buffer — don't evolve if too poor
    if (this.economy.getGold() < EVOLVE_GOLD_THRESHOLD) return false;

    return true;
  }

  // ── Special Ability Decision ───────────────────────────────────

  private shouldUseSpecial(currentAge: number): boolean {
    if (!this.abilitySystem.isReady('enemy')) return false;

    const threatProfile = this.assessThreats();

    // Use special when enough enemies are grouped
    if (threatProfile.clusterSize >= SPECIAL_MIN_GROUP_SIZE) {
      this.abilitySystem.useSpecial(
        this.world,
        'enemy',
        currentAge,
        threatProfile.clusterX,
      );
      return true;
    }

    return false;
  }

  // ── Turret Decision ────────────────────────────────────────────

  private shouldBuildTurret(threatProfile: ThreatProfile, currentAge: number): boolean {
    // Only consider turrets if we have open slots
    const occupiedSlots = this.turretManager.getOccupiedSlots();
    const maxSlots = this.turretManager.getMaxSlots();
    if (occupiedSlots.length >= maxSlots) return false;

    // Get available turrets for current age
    const turretIds = this.ageSystem.getAvailableTurretIds();
    if (turretIds.length === 0) return false;

    // Decide which turret type to build based on threats
    let preferredCategory: 'anti_infantry' | 'anti_heavy' = 'anti_infantry';
    if (threatProfile.heavy > threatProfile.infantry) {
      preferredCategory = 'anti_heavy';
    }

    // Find the matching turret
    const turretId = turretIds.find((id) => {
      const config = this.turretManager.getTurretConfig(id);
      return config && config.category === preferredCategory;
    }) ?? turretIds[0];

    if (!turretId) return false;

    const config = this.turretManager.getTurretConfig(turretId);
    if (!config) return false;

    // Check if we can afford it and still have buffer for units
    const cheapestUnit = this.getCheapestUnitCost(currentAge);
    const buffer = cheapestUnit * GOLD_BUFFER_RATIO;
    if (this.economy.getGold() < config.stats.cost + buffer) return false;

    // Find an empty slot
    for (let slot = 0; slot < maxSlots; slot++) {
      if (this.turretManager.isSlotEmpty(slot)) {
        this.turretManager.buildTurret(slot, turretId);
        return true;
      }
    }

    return false;
  }

  // ── Unit Spawning ──────────────────────────────────────────────

  private spawnUnits(threatProfile: ThreatProfile, currentAge: number): void {
    const availableUnits = this.ageSystem.getAvailableUnits();
    if (availableUnits.length === 0) return;

    // Determine which unit type to spawn
    const unitToSpawn = this.pickUnit(availableUnits, threatProfile);
    if (!unitToSpawn) return;

    // Check gold buffer
    const cheapestCost = this.getCheapestUnitCost(currentAge);
    const buffer = cheapestCost * GOLD_BUFFER_RATIO;
    if (this.economy.getGold() < unitToSpawn.stats.cost + buffer) return;

    // Spend gold and enqueue spawn
    if (!this.economy.spend(unitToSpawn.stats.cost)) return;

    const spawnRequest: SpawnRequest = {
      faction: 'enemy',
      unitId: this.getUnitId(unitToSpawn, currentAge),
      type: unitToSpawn.type,
      age: currentAge,
      hp: unitToSpawn.stats.hp,
      damage: unitToSpawn.stats.damage,
      speed: unitToSpawn.stats.moveSpeed,
      range: unitToSpawn.stats.range,
      attackSpeed: unitToSpawn.stats.attackSpeed,
      projectileType: '',
      spawnTime: unitToSpawn.stats.spawnTime,
      spriteKey: `unit_${unitToSpawn.type}_${currentAge}`,
      cost: unitToSpawn.stats.cost,
    };

    this.spawnSystem.enqueue(spawnRequest);
  }

  /**
   * Pick a unit based on counter-picking strategy.
   */
  private pickUnit(available: UnitConfig[], threatProfile: ThreatProfile): UnitConfig | null {
    if (available.length === 0) return null;

    if (!this.difficulty.counterPick) {
      // Easy mode: just pick randomly
      return available[Math.floor(Math.random() * available.length)];
    }

    // Determine the dominant player unit type
    const dominantType = this.getDominantType(threatProfile);

    if (!dominantType) {
      // No clear threat — pick a balanced option (infantry or ranged)
      const balanced = available.filter(
        (u) => u.type === 'infantry' || u.type === 'ranged',
      );
      if (balanced.length > 0) {
        return balanced[Math.floor(Math.random() * balanced.length)];
      }
      return available[0];
    }

    // Get the counter type
    const counterType = COUNTER_PICKS[dominantType];
    if (!counterType) {
      return available[Math.floor(Math.random() * available.length)];
    }

    // Perfect counters always pick the right type
    if (this.difficulty.perfectCounters) {
      const counters = available.filter((u) => u.type === counterType);
      if (counters.length > 0) {
        return counters[Math.floor(Math.random() * counters.length)];
      }
    } else {
      // Basic counters: 60% chance to counter, 40% random
      if (Math.random() < BASIC_COUNTER_CHANCE) {
        const counters = available.filter((u) => u.type === counterType);
        if (counters.length > 0) {
          return counters[Math.floor(Math.random() * counters.length)];
        }
      }
    }

    // Fallback: random
    return available[Math.floor(Math.random() * available.length)];
  }

  /**
   * Get the dominant player unit type from the threat profile.
   */
  private getDominantType(profile: ThreatProfile): string | null {
    if (profile.total === 0) return null;

    const types: Array<[string, number]> = [
      ['infantry', profile.infantry],
      ['ranged', profile.ranged],
      ['heavy', profile.heavy],
      ['special', profile.special],
    ];

    types.sort((a, b) => b[1] - a[1]);

    // Only return dominant if it's clearly dominant (> 40% of total)
    if (types[0][1] / profile.total > 0.4) {
      return types[0][0];
    }

    return null;
  }

  /**
   * Get the cheapest unit cost for the current age.
   */
  private getCheapestUnitCost(currentAge: number): number {
    const units = this.configLoader.getUnitsByAge(currentAge);
    if (units.length === 0) return 50;
    return Math.min(...units.map((u) => u.stats.cost));
  }

  /**
   * Get the unit ID string from a UnitConfig.
   */
  private getUnitId(config: UnitConfig, age: number): string {
    const allUnits = this.configLoader.getAllUnits();
    for (const [id, unitConfig] of Object.entries(allUnits)) {
      if (unitConfig.displayName === config.displayName && unitConfig.age === age) {
        return id;
      }
    }
    return config.displayName.toLowerCase().replace(/\s+/g, '_');
  }

  /**
   * Get the difficulty level.
   */
  getDifficulty(): Difficulty {
    return this.difficultyLevel;
  }

  /**
   * Get the starting age for the current difficulty.
   */
  getStartingAge(): number {
    return this.difficulty.startingAge;
  }

  /**
   * Reset the AI state (for new game).
   */
  reset(): void {
    this.decisionTimer = 0;
  }
}

// ── Types ────────────────────────────────────────────────────────

interface ThreatProfile {
  infantry: number;
  ranged: number;
  heavy: number;
  special: number;
  total: number;
  avgX: number;
  clusterSize: number;
  clusterX: number;
}
