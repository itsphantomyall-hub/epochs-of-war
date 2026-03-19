/**
 * WaveManager -- controls survival mode wave spawning, scaling,
 * age progression, and between-wave timing.
 */

import survivalData from '../../config/survival.json';
import { ConfigLoader } from '../../utils/ConfigLoader';
import type { SpawnRequest } from '../systems/SpawnSystem';

export interface WaveScaling {
  baseUnits: number;
  unitsPerWave: number;
  hpMultiplierPerWave: number;
  dmgMultiplierPerWave: number;
  waveInterval: number;
  minInterval: number;
  intervalDecreasePerWave: number;
}

export interface WaveInfo {
  currentWave: number;
  enemiesRemaining: number;
  nextWaveTimer: number;
  isActive: boolean;
  isBetweenWaves: boolean;
}

export type WaveEventType = 'waveStart' | 'waveComplete' | 'allEnemiesDead' | 'buffSelection';

export type WaveEventCallback = (data: { wave: number }) => void;

export class WaveManager {
  private scaling: WaveScaling;
  private ageProgression: number[];
  private configLoader: ConfigLoader;

  private currentWave: number = 0;
  private enemiesRemaining: number = 0;
  private enemiesSpawned: number = 0;
  private betweenWaveTimer: number = 0;
  private isActive: boolean = false;
  private isBetweenWaves: boolean = true;
  private spawnTimer: number = 0;

  private listeners: Map<WaveEventType, WaveEventCallback[]> = new Map();

  constructor(configLoader: ConfigLoader) {
    this.scaling = survivalData.waveScaling as WaveScaling;
    this.ageProgression = survivalData.ageProgression;
    this.configLoader = configLoader;
  }

  // ── Event system ───────────────────────────────────────

  on(event: WaveEventType, callback: WaveEventCallback): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  private emit(event: WaveEventType, data: { wave: number }): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      for (const cb of callbacks) cb(data);
    }
  }

  // ── Wave info ──────────────────────────────────────────

  getWaveInfo(): WaveInfo {
    return {
      currentWave: this.currentWave,
      enemiesRemaining: this.enemiesRemaining,
      nextWaveTimer: this.betweenWaveTimer,
      isActive: this.isActive,
      isBetweenWaves: this.isBetweenWaves,
    };
  }

  getCurrentWave(): number {
    return this.currentWave;
  }

  getUnitCount(waveNumber: number): number {
    return Math.floor(this.scaling.baseUnits + waveNumber * this.scaling.unitsPerWave);
  }

  getHpMultiplier(waveNumber: number): number {
    return 1.0 + waveNumber * this.scaling.hpMultiplierPerWave;
  }

  getDmgMultiplier(waveNumber: number): number {
    return 1.0 + waveNumber * this.scaling.dmgMultiplierPerWave;
  }

  /** Get the enemy age tier for a given wave number. */
  getWaveAge(waveNumber: number): number {
    for (let i = 0; i < this.ageProgression.length; i++) {
      if (waveNumber <= this.ageProgression[i]) {
        return i + 1;
      }
    }
    // Past all progression thresholds: use max age (8)
    return 8;
  }

  /** Get the player auto-evolve age for a given wave number. */
  getPlayerAge(waveNumber: number): number {
    // Player evolves every 5 waves, same schedule as enemy
    return this.getWaveAge(waveNumber);
  }

  getWaveInterval(waveNumber: number): number {
    const interval = this.scaling.waveInterval - waveNumber * this.scaling.intervalDecreasePerWave;
    return Math.max(this.scaling.minInterval, interval);
  }

  // ── Start / update ─────────────────────────────────────

  start(): void {
    this.currentWave = 0;
    this.isActive = true;
    this.isBetweenWaves = true;
    this.betweenWaveTimer = 5; // Short initial countdown
    this.enemiesRemaining = 0;
    this.enemiesSpawned = 0;
  }

  /**
   * Called every frame. Returns spawn requests to be enqueued if any.
   */
  update(deltaSec: number): SpawnRequest[] {
    if (!this.isActive) return [];

    const requests: SpawnRequest[] = [];

    if (this.isBetweenWaves) {
      this.betweenWaveTimer -= deltaSec;
      if (this.betweenWaveTimer <= 0) {
        this.startNextWave();
      }
      return requests;
    }

    // During a wave: spawn enemies over time
    if (this.enemiesSpawned < this.getUnitCount(this.currentWave)) {
      this.spawnTimer -= deltaSec;
      if (this.spawnTimer <= 0) {
        const req = this.createSpawnRequest();
        if (req) {
          requests.push(req);
          this.enemiesSpawned++;
          this.spawnTimer = 0.8; // Stagger spawns by 0.8 seconds
        }
      }
    }

    return requests;
  }

  /** Called when an enemy unit dies. */
  onEnemyKilled(): void {
    this.enemiesRemaining--;
    if (this.enemiesRemaining <= 0 && this.enemiesSpawned >= this.getUnitCount(this.currentWave)) {
      this.onWaveComplete();
    }
  }

  // ── Wave lifecycle ─────────────────────────────────────

  private startNextWave(): void {
    this.currentWave++;
    this.isBetweenWaves = false;
    this.enemiesSpawned = 0;
    this.enemiesRemaining = this.getUnitCount(this.currentWave);
    this.spawnTimer = 0;

    this.emit('waveStart', { wave: this.currentWave });
  }

  private onWaveComplete(): void {
    this.isBetweenWaves = true;
    this.betweenWaveTimer = 15; // 15-second break between waves

    this.emit('waveComplete', { wave: this.currentWave });

    // Trigger buff selection every 5 waves
    if (this.currentWave % 5 === 0) {
      this.emit('buffSelection', { wave: this.currentWave });
    }
  }

  private createSpawnRequest(): SpawnRequest | null {
    const age = this.getWaveAge(this.currentWave);
    const hpMult = this.getHpMultiplier(this.currentWave);
    const dmgMult = this.getDmgMultiplier(this.currentWave);

    // Get units for this wave's age
    const ageConfig = this.configLoader.getAge(age);
    const unitIds = ageConfig.units;
    if (unitIds.length === 0) return null;

    // Pick a random unit
    const unitId = unitIds[Math.floor(Math.random() * unitIds.length)];
    const unitConfig = this.configLoader.getUnit(unitId);

    return {
      faction: 'enemy',
      unitId,
      type: unitConfig.type,
      age,
      hp: Math.round(unitConfig.stats.hp * hpMult),
      damage: Math.round(unitConfig.stats.damage * dmgMult),
      speed: unitConfig.stats.moveSpeed,
      range: unitConfig.stats.range,
      attackSpeed: unitConfig.stats.attackSpeed,
      projectileType: unitConfig.stats.range > 0 ? 'projectile' : '',
      spawnTime: 0, // Instant spawn for wave enemies
      spriteKey: unitId,
      cost: unitConfig.stats.cost,
    };
  }

  // ── Reset ──────────────────────────────────────────────

  reset(): void {
    this.currentWave = 0;
    this.enemiesRemaining = 0;
    this.enemiesSpawned = 0;
    this.betweenWaveTimer = 0;
    this.isActive = false;
    this.isBetweenWaves = true;
    this.spawnTimer = 0;
    this.listeners.clear();
  }
}
