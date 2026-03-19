/**
 * GameSimulation -- Server-side authoritative game loop.
 *
 * Runs the same core logic as the client but is the source of truth.
 * Uses a seeded RNG for determinism.
 * 50ms tick rate (20 ticks/second).
 */

import type {
  EntitySnapshot,
  PlayerSnapshot,
  GameEvent,
  ClientMessage,
} from './types.js';

const TICK_RATE_MS = 50;
const MAX_AGE = 8;
const BASE_HP = 500;
const HP_PER_AGE = 200;
const BASE_PASSIVE_INCOME = 3;
const PASSIVE_INCOME_PER_AGE = 1;
const STARTING_GOLD = 50;
const BATTLEFIELD_WIDTH = 1600;
const PLAYER_SPAWN_X = 80;
const ENEMY_SPAWN_X = 1520;
const PLAYER_BASE_X = 50;
const ENEMY_BASE_X = 1550;

// XP thresholds per age (age N → N+1)
const XP_THRESHOLDS: number[] = [0, 50, 100, 200, 350, 500, 700, 1000];

// Simple unit definitions per age (up to 4 units per age)
interface SimUnitDef {
  type: string;
  hp: number;
  damage: number;
  speed: number;
  range: number;
  attackSpeed: number;
  cost: number;
  spawnTime: number;
  xpReward: number;
  goldReward: number;
}

// Simplified unit roster -- 4 units per age, stats scale with age
function getUnitsForAge(age: number): SimUnitDef[] {
  const scale = 1 + (age - 1) * 0.3;
  return [
    {
      type: 'infantry',
      hp: Math.round(40 * scale),
      damage: Math.round(8 * scale),
      speed: 1.2,
      range: 0,
      attackSpeed: 1,
      cost: Math.round(15 * scale),
      spawnTime: 1.5,
      xpReward: Math.round(5 + age * 2),
      goldReward: Math.round(10 + age * 3),
    },
    {
      type: 'ranged',
      hp: Math.round(25 * scale),
      damage: Math.round(12 * scale),
      speed: 0.8,
      range: 200,
      attackSpeed: 1.5,
      cost: Math.round(25 * scale),
      spawnTime: 2,
      xpReward: Math.round(8 + age * 2),
      goldReward: Math.round(15 + age * 3),
    },
    {
      type: 'heavy',
      hp: Math.round(100 * scale),
      damage: Math.round(15 * scale),
      speed: 0.5,
      range: 0,
      attackSpeed: 2,
      cost: Math.round(50 * scale),
      spawnTime: 3,
      xpReward: Math.round(15 + age * 4),
      goldReward: Math.round(40 + age * 8),
    },
    {
      type: 'special',
      hp: Math.round(60 * scale),
      damage: Math.round(20 * scale),
      speed: 1.0,
      range: 150,
      attackSpeed: 1.2,
      cost: Math.round(40 * scale),
      spawnTime: 2.5,
      xpReward: Math.round(20 + age * 5),
      goldReward: Math.round(50 + age * 10),
    },
  ];
}

// Special ability cooldown per age
const SPECIAL_COOLDOWN = 45;
const HERO_ABILITY_COOLDOWN = 20;

// ── Seeded RNG ──

class SeededRNG {
  private state: number;

  constructor(seed: number) {
    this.state = seed;
  }

  /** Returns a number in [0, 1). */
  next(): number {
    this.state = (this.state * 1664525 + 1013904223) & 0xFFFFFFFF;
    return (this.state >>> 0) / 0x100000000;
  }

  /** Returns an integer in [min, max). */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min)) + min;
  }
}

// ── Entity ──

interface SimEntity {
  id: number;
  faction: 1 | 2;
  unitType: string;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  damage: number;
  speed: number;
  range: number;
  attackSpeed: number;
  lastAttackTime: number;
  alive: boolean;
  spawnTimer: number;
  spawned: boolean;
  xpReward: number;
  goldReward: number;
}

// ── Player sim state ──

interface PlayerSimState {
  gold: number;
  xp: number;
  currentAge: number;
  baseHp: number;
  baseMaxHp: number;
}

export class GameSimulation {
  readonly seed: number;
  private rng: SeededRNG;
  private tick: number = 0;
  private nextEntityId: number = 1;
  private entities: SimEntity[] = [];
  private pendingEvents: GameEvent[] = [];

  private player1: PlayerSimState;
  private player2: PlayerSimState;

  private gameOver: boolean = false;
  private winner: 1 | 2 | null = null;

  constructor(seed: number) {
    this.seed = seed;
    this.rng = new SeededRNG(seed);

    const baseHp = BASE_HP;
    this.player1 = {
      gold: STARTING_GOLD,
      xp: 0,
      currentAge: 1,
      baseHp,
      baseMaxHp: baseHp,
    };
    this.player2 = {
      gold: STARTING_GOLD,
      xp: 0,
      currentAge: 1,
      baseHp,
      baseMaxHp: baseHp,
    };
  }

  get tickRate(): number {
    return TICK_RATE_MS;
  }

  get currentTick(): number {
    return this.tick;
  }

  get isGameOver(): boolean {
    return this.gameOver;
  }

  get matchWinner(): 1 | 2 | null {
    return this.winner;
  }

  getPlayerState(slot: 1 | 2): PlayerSimState {
    return slot === 1 ? { ...this.player1 } : { ...this.player2 };
  }

  /** Get available unit defs for a player slot. */
  getUnitsForPlayer(slot: 1 | 2): SimUnitDef[] {
    const state = slot === 1 ? this.player1 : this.player2;
    return getUnitsForAge(state.currentAge);
  }

  /** Get XP required for next age for a player slot. */
  getXpToNext(slot: 1 | 2): number {
    const state = slot === 1 ? this.player1 : this.player2;
    if (state.currentAge >= MAX_AGE) return Infinity;
    return XP_THRESHOLDS[state.currentAge] ?? Infinity;
  }

  // ── Command processing ──

  /** Process a spawn command from a player. Returns error string or null. */
  processSpawn(slot: 1 | 2, unitIndex: number): string | null {
    const state = slot === 1 ? this.player1 : this.player2;
    const units = getUnitsForAge(state.currentAge);

    if (unitIndex < 0 || unitIndex >= units.length) {
      return 'Invalid unit index';
    }

    const unitDef = units[unitIndex];
    if (state.gold < unitDef.cost) {
      return 'Insufficient gold';
    }

    state.gold -= unitDef.cost;

    const isPlayer1 = slot === 1;
    const spawnX = isPlayer1 ? PLAYER_SPAWN_X : ENEMY_SPAWN_X;
    const direction = isPlayer1 ? 1 : -1;

    const entity: SimEntity = {
      id: this.nextEntityId++,
      faction: slot,
      unitType: unitDef.type,
      x: spawnX,
      y: 500,
      hp: unitDef.hp,
      maxHp: unitDef.hp,
      damage: unitDef.damage,
      speed: unitDef.speed * direction * 30,
      range: unitDef.range,
      attackSpeed: unitDef.attackSpeed,
      lastAttackTime: -Infinity,
      alive: true,
      spawnTimer: unitDef.spawnTime,
      spawned: false,
      xpReward: unitDef.xpReward,
      goldReward: unitDef.goldReward,
    };

    this.entities.push(entity);
    this.pendingEvents.push({
      kind: 'spawn',
      data: { entityId: entity.id, unitType: unitDef.type, faction: slot },
    });

    return null;
  }

  /** Process an evolve command. Returns error string or null. */
  processEvolve(slot: 1 | 2): string | null {
    const state = slot === 1 ? this.player1 : this.player2;

    if (state.currentAge >= MAX_AGE) {
      return 'Already at max age';
    }

    const xpRequired = XP_THRESHOLDS[state.currentAge] ?? Infinity;
    if (state.xp < xpRequired) {
      return 'Insufficient XP';
    }

    state.xp -= xpRequired;
    state.currentAge++;

    // Update base HP
    const newBaseHp = BASE_HP + (state.currentAge - 1) * HP_PER_AGE;
    const hpGain = newBaseHp - state.baseMaxHp;
    state.baseMaxHp = newBaseHp;
    state.baseHp = Math.min(state.baseHp + hpGain, newBaseHp);

    this.pendingEvents.push({
      kind: 'ageUp',
      data: { faction: slot, newAge: state.currentAge },
    });

    return null;
  }

  /** Process a special attack. Returns error string or null. */
  processSpecial(slot: 1 | 2, targetX: number): string | null {
    // Damage all enemy units within a radius of targetX
    const enemyFaction: 1 | 2 = slot === 1 ? 2 : 1;
    const radius = 150;
    const state = slot === 1 ? this.player1 : this.player2;
    const baseDamage = 30 + state.currentAge * 10;

    let hitCount = 0;
    for (const entity of this.entities) {
      if (!entity.alive || !entity.spawned) continue;
      if (entity.faction !== enemyFaction) continue;

      if (Math.abs(entity.x - targetX) <= radius) {
        entity.hp -= baseDamage;
        hitCount++;

        this.pendingEvents.push({
          kind: 'damage',
          data: {
            attackerId: -1,
            targetId: entity.id,
            damage: baseDamage,
            remainingHp: entity.hp,
          },
        });

        if (entity.hp <= 0) {
          entity.alive = false;
          this.awardKill(slot, entity);
        }
      }
    }

    this.pendingEvents.push({
      kind: 'special',
      data: { faction: slot, targetX, hits: hitCount },
    });

    return null;
  }

  /** Process a hero ability. Returns error string or null. */
  processHeroAbility(slot: 1 | 2, index: number): string | null {
    // Simplified hero ability: heal all own units by 20% or damage nearby enemies
    if (index === 0) {
      // Heal own units
      for (const entity of this.entities) {
        if (!entity.alive || !entity.spawned) continue;
        if (entity.faction !== slot) continue;
        const healAmount = Math.round(entity.maxHp * 0.2);
        entity.hp = Math.min(entity.maxHp, entity.hp + healAmount);
      }
    } else {
      // Damage enemies near own base
      const ownBaseX = slot === 1 ? PLAYER_BASE_X : ENEMY_BASE_X;
      const state = slot === 1 ? this.player1 : this.player2;
      const damage = 20 + state.currentAge * 5;
      const enemyFaction: 1 | 2 = slot === 1 ? 2 : 1;

      for (const entity of this.entities) {
        if (!entity.alive || !entity.spawned) continue;
        if (entity.faction !== enemyFaction) continue;
        if (Math.abs(entity.x - ownBaseX) <= 300) {
          entity.hp -= damage;
          if (entity.hp <= 0) {
            entity.alive = false;
            this.awardKill(slot, entity);
          }
        }
      }
    }

    this.pendingEvents.push({
      kind: 'heroAbility',
      data: { faction: slot, index },
    });

    return null;
  }

  // ── Simulation tick ──

  /** Advance the simulation by one tick (50ms). */
  update(): { delta: StateDeltaData; events: GameEvent[] } {
    if (this.gameOver) {
      return {
        delta: this.buildDelta(),
        events: [],
      };
    }

    this.tick++;
    const deltaSec = TICK_RATE_MS / 1000;

    // Passive income
    this.updateEconomy(this.player1, deltaSec);
    this.updateEconomy(this.player2, deltaSec);

    // Process spawn timers
    for (const entity of this.entities) {
      if (!entity.spawned && entity.alive) {
        entity.spawnTimer -= deltaSec;
        if (entity.spawnTimer <= 0) {
          entity.spawned = true;
        }
      }
    }

    // Movement
    for (const entity of this.entities) {
      if (!entity.alive || !entity.spawned) continue;

      // Check if enemy in range
      const enemyInRange = this.findEnemyInRange(entity);
      if (enemyInRange) {
        // Attack instead of move
        const elapsed = this.tick * deltaSec;
        if (elapsed - entity.lastAttackTime >= entity.attackSpeed) {
          entity.lastAttackTime = elapsed;
          enemyInRange.hp -= entity.damage;

          this.pendingEvents.push({
            kind: 'damage',
            data: {
              attackerId: entity.id,
              targetId: enemyInRange.id,
              damage: entity.damage,
              remainingHp: enemyInRange.hp,
            },
          });

          if (enemyInRange.hp <= 0) {
            enemyInRange.alive = false;
            this.awardKill(entity.faction, enemyInRange);
          }
        }
      } else {
        // Move
        entity.x += entity.speed * deltaSec;
      }
    }

    // Base collision
    this.checkBaseCollisions();

    // Remove dead entities
    this.entities = this.entities.filter((e) => e.alive);

    // Check game over
    this.checkGameOver();

    const events = this.pendingEvents.splice(0);
    return {
      delta: this.buildDelta(),
      events,
    };
  }

  // ── Helpers ──

  private updateEconomy(state: PlayerSimState, deltaSec: number): void {
    const incomeRate = BASE_PASSIVE_INCOME + (state.currentAge - 1) * PASSIVE_INCOME_PER_AGE;
    state.gold += incomeRate * deltaSec;
  }

  private findEnemyInRange(entity: SimEntity): SimEntity | null {
    const effectiveRange = entity.range > 0 ? entity.range : 30;
    let closest: SimEntity | null = null;
    let closestDist = Infinity;

    for (const other of this.entities) {
      if (!other.alive || !other.spawned) continue;
      if (other.faction === entity.faction) continue;

      const dist = Math.abs(other.x - entity.x);
      if (dist <= effectiveRange && dist < closestDist) {
        closest = other;
        closestDist = dist;
      }
    }

    return closest;
  }

  private awardKill(killerFaction: 1 | 2, victim: SimEntity): void {
    const state = killerFaction === 1 ? this.player1 : this.player2;
    state.gold += victim.goldReward;
    state.xp += victim.xpReward;

    this.pendingEvents.push({
      kind: 'death',
      data: {
        entityId: victim.id,
        faction: victim.faction,
        unitType: victim.unitType,
      },
    });
  }

  private checkBaseCollisions(): void {
    for (const entity of this.entities) {
      if (!entity.alive || !entity.spawned) continue;

      if (entity.faction === 1 && entity.x >= ENEMY_BASE_X) {
        this.player2.baseHp -= entity.damage;
        entity.alive = false;
        this.pendingEvents.push({
          kind: 'baseHit',
          data: {
            faction: 2,
            damage: entity.damage,
            remainingHp: this.player2.baseHp,
          },
        });
      }

      if (entity.faction === 2 && entity.x <= PLAYER_BASE_X) {
        this.player1.baseHp -= entity.damage;
        entity.alive = false;
        this.pendingEvents.push({
          kind: 'baseHit',
          data: {
            faction: 1,
            damage: entity.damage,
            remainingHp: this.player1.baseHp,
          },
        });
      }
    }
  }

  private checkGameOver(): void {
    if (this.player1.baseHp <= 0) {
      this.gameOver = true;
      this.winner = 2;
    } else if (this.player2.baseHp <= 0) {
      this.gameOver = true;
      this.winner = 1;
    }
  }

  private buildDelta(): StateDeltaData {
    return {
      tick: this.tick,
      timestamp: Date.now(),
      player1: { ...this.player1 },
      player2: { ...this.player2 },
      entities: this.entities
        .filter((e) => e.spawned)
        .map((e) => ({
          id: e.id,
          x: e.x,
          y: e.y,
          hp: e.hp,
          maxHp: e.maxHp,
          faction: e.faction === 1 ? 'player' as const : 'enemy' as const,
          unitType: e.unitType,
          alive: e.alive,
        })),
    };
  }
}

export interface StateDeltaData {
  tick: number;
  timestamp: number;
  player1: PlayerSnapshot;
  player2: PlayerSnapshot;
  entities: EntitySnapshot[];
}
