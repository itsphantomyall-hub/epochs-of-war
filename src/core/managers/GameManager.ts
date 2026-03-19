/**
 * GameManager — master game state controller.
 *
 * Owns the World, all systems, the SpatialGrid, and the EventEmitter.
 * Drives the update loop in the fixed order from GAME_DESIGN.md Section 16.1:
 *   SpawnSystem → MovementSystem → CombatSystem → HealthSystem → CleanupSystem
 * (Input, AI, Projectile, Ability, Economy, Weather, Render, UI, Audio systems
 *  will be added in later phases.)
 */

import { World } from '../ecs/World';
import { resetEntityIdCounter } from '../ecs/Entity';
import { SpatialGrid } from '../../utils/SpatialGrid';
import { EventEmitter } from '../../utils/EventEmitter';

import { SpawnSystem } from '../systems/SpawnSystem';
import { MovementSystem } from '../systems/MovementSystem';
import { CombatSystem } from '../systems/CombatSystem';
import { HealthSystem } from '../systems/HealthSystem';
import { CleanupSystem } from '../systems/CleanupSystem';

import type { Position } from '../components/Position';

// ── Game event types ────────────────────────────────────────────

export interface GameEvents {
  spawn: { entityId: number; unitId: string; faction: 'player' | 'enemy' };
  death: { entityId: number; faction: 'player' | 'enemy'; unitType: string; unitId: string };
  damage: { attackerId: number; targetId: number; damage: number; remainingHp: number };
  baseHit: { faction: 'player' | 'enemy'; damage: number; remainingHp: number };
  gameOver: { winner: 'player' | 'enemy' };
  ageUp: { faction: 'player' | 'enemy'; newAge: number };
}

// ── Game state ──────────────────────────────────────────────────

export type GameState = 'playing' | 'paused' | 'victory' | 'defeat';

const BATTLEFIELD_WIDTH = 1600;
const BATTLEFIELD_HEIGHT = 600;
const SPATIAL_CELL_SIZE = 100;

const DEFAULT_BASE_HP = 1000;

export class GameManager {
  // Core
  readonly world: World;
  readonly events: EventEmitter<GameEvents>;
  readonly spatialGrid: SpatialGrid;

  // Systems
  readonly spawnSystem: SpawnSystem;
  readonly movementSystem: MovementSystem;
  readonly combatSystem: CombatSystem;
  readonly healthSystem: HealthSystem;
  readonly cleanupSystem: CleanupSystem;

  // State
  private _state: GameState = 'playing';
  private _playerBaseHp: number = DEFAULT_BASE_HP;
  private _enemyBaseHp: number = DEFAULT_BASE_HP;
  private _elapsedTime: number = 0;

  // Time singleton entity
  private timeEntityId: number = -1;

  constructor() {
    this.world = new World();
    this.events = new EventEmitter<GameEvents>();
    this.spatialGrid = new SpatialGrid(BATTLEFIELD_WIDTH, BATTLEFIELD_HEIGHT, SPATIAL_CELL_SIZE);

    // Create systems
    this.spawnSystem = new SpawnSystem(this.spatialGrid, this.events);
    this.movementSystem = new MovementSystem(this.spatialGrid);
    this.combatSystem = new CombatSystem(this.spatialGrid, this.events);
    this.healthSystem = new HealthSystem(this.events);
    this.cleanupSystem = new CleanupSystem(this.spatialGrid);

    // Wire up death events to cleanup system
    this.events.on('death', (e) => {
      this.cleanupSystem.markDead(e.entityId);
    });

    // Create the time singleton
    this.createTimeSingleton();
  }

  // ── Accessors ─────────────────────────────────────────────────

  get state(): GameState {
    return this._state;
  }

  get playerBaseHp(): number {
    return this._playerBaseHp;
  }

  get enemyBaseHp(): number {
    return this._enemyBaseHp;
  }

  get elapsedTime(): number {
    return this._elapsedTime;
  }

  /** Set the player base HP (called by GameScene to sync initial values). */
  setPlayerBaseHp(hp: number): void {
    this._playerBaseHp = hp;
  }

  /** Set the enemy base HP (called by GameScene to sync initial values). */
  setEnemyBaseHp(hp: number): void {
    this._enemyBaseHp = hp;
  }

  // ── State control ─────────────────────────────────────────────

  pause(): void {
    if (this._state === 'playing') this._state = 'paused';
  }

  resume(): void {
    if (this._state === 'paused') this._state = 'playing';
  }

  // ── Update loop ───────────────────────────────────────────────

  /**
   * Called every frame by the Phaser scene or requestAnimationFrame.
   * @param deltaTime Seconds since last frame.
   */
  update(deltaTime: number): void {
    if (this._state !== 'playing') return;

    this._elapsedTime += deltaTime;

    // Update time singleton
    const gt = this.world.getComponent<{ elapsed: number }>(this.timeEntityId, 'GameTime');
    if (gt) gt.elapsed = this._elapsedTime;

    // Update spatial grid positions for all entities with Position
    const posEntities = this.world.query('Position');
    for (let i = 0; i < posEntities.length; i++) {
      const id = posEntities[i];
      const pos = this.world.getComponent<Position>(id, 'Position')!;
      this.spatialGrid.update(id, pos.x, pos.y);
    }

    // Systems execute in the order from Section 16.1
    // 3. SpawnSystem
    this.spawnSystem.update(this.world, deltaTime);

    // 4. MovementSystem
    this.movementSystem.update(this.world, deltaTime);

    // 5. CombatSystem
    this.combatSystem.update(this.world, deltaTime);

    // 8. HealthSystem (death checks)
    this.healthSystem.update(this.world, deltaTime);

    // Check for units reaching the enemy base
    this.checkBaseCollisions();

    // CleanupSystem (always last)
    this.cleanupSystem.update(this.world, deltaTime);

    // Win/loss check
    this.checkGameOver();
  }

  // ── Base collision ────────────────────────────────────────────

  private checkBaseCollisions(): void {
    const units = this.world.query('Position', 'Faction', 'Combat');

    for (let i = 0; i < units.length; i++) {
      const id = units[i];
      const pos = this.world.getComponent<Position>(id, 'Position')!;
      const faction = this.world.getComponent<{ faction: 'player' | 'enemy' }>(id, 'Faction')!;
      const combat = this.world.getComponent<{ damage: number }>(id, 'Combat')!;

      // Player units reaching the right edge hit enemy base
      if (faction.faction === 'player' && pos.x >= 1550) {
        this._enemyBaseHp -= combat.damage;
        this.events.emit('baseHit', {
          faction: 'enemy',
          damage: combat.damage,
          remainingHp: this._enemyBaseHp,
        });
        this.world.destroyEntity(id);
      }

      // Enemy units reaching the left edge hit player base
      if (faction.faction === 'enemy' && pos.x <= 50) {
        this._playerBaseHp -= combat.damage;
        this.events.emit('baseHit', {
          faction: 'player',
          damage: combat.damage,
          remainingHp: this._playerBaseHp,
        });
        this.world.destroyEntity(id);
      }
    }
  }

  // ── Win / loss ────────────────────────────────────────────────

  private checkGameOver(): void {
    if (this._enemyBaseHp <= 0) {
      this._state = 'victory';
      this.events.emit('gameOver', { winner: 'player' });
    } else if (this._playerBaseHp <= 0) {
      this._state = 'defeat';
      this.events.emit('gameOver', { winner: 'enemy' });
    }
  }

  // ── Time singleton ────────────────────────────────────────────

  private createTimeSingleton(): void {
    this.timeEntityId = this.world.createEntity();
    this.world.addComponent(this.timeEntityId, 'GameTime', { elapsed: 0 });
  }

  // ── Reset ─────────────────────────────────────────────────────

  /** Reset all game state for a new match. */
  reset(): void {
    this.world.clear();
    this.spatialGrid.clear();
    this.events.clear();
    resetEntityIdCounter();

    this._state = 'playing';
    this._playerBaseHp = DEFAULT_BASE_HP;
    this._enemyBaseHp = DEFAULT_BASE_HP;
    this._elapsedTime = 0;

    // Re-wire death events
    this.events.on('death', (e) => {
      this.cleanupSystem.markDead(e.entityId);
    });

    this.createTimeSingleton();
  }
}
