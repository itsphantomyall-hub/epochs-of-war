/**
 * HeroSystem — ticks hero ability cooldowns, processes ability usage,
 * handles hero XP/leveling, and applies hero-specific mechanics.
 *
 * Hero abilities are activated via useAbility(faction, abilityIndex).
 * Each ability has a unique effect type that modifies the battlefield.
 */

import { World } from '../ecs/World';
import { EntityId } from '../ecs/Entity';
import type { Position } from '../components/Position';
import type { Velocity } from '../components/Velocity';
import type { Health } from '../components/Health';
import type { Combat } from '../components/Combat';
import type { Faction } from '../components/Faction';
import type { UnitType } from '../components/UnitType';
import type { HeroComponent } from '../components/Hero';
import type { Lifetime } from '../components/Lifetime';
import type { TurretComponent } from '../components/Turret';
import type { Shielded } from '../components/Shielded';
import type { Stunned } from '../components/Stunned';
import type { Untargetable } from '../components/Untargetable';
import type { Renderable } from '../components/Renderable';
import { SpatialGrid } from '../../utils/SpatialGrid';
import { EventEmitter } from '../../utils/EventEmitter';
import type { GameEvents } from '../managers/GameManager';
import type { HeroManager, HeroAbilityEffect } from '../managers/HeroManager';

/** XP thresholds for hero levels: level 2 at 30, level 3 at 60. Max at 100. */
const XP_THRESHOLDS = [30, 60, 100];
const XP_PER_KILL = 10;
const MAX_HERO_LEVEL = 3;
const STAT_BONUS_PER_LEVEL = 0.10;

/** HP snapshot storage for Temporal Shift ability. */
interface HpSnapshot {
  entityId: EntityId;
  hp: number;
  timestamp: number;
}

export class HeroSystem {
  private readonly spatialGrid: SpatialGrid;
  private readonly events: EventEmitter<GameEvents>;
  private readonly heroManager: HeroManager;

  /** Rolling HP snapshots for temporal shift ability. Stores last 5 seconds of data. */
  private readonly hpSnapshots: HpSnapshot[] = [];
  private snapshotTimer: number = 0;
  private readonly SNAPSHOT_INTERVAL = 0.5; // record every 0.5 seconds
  private readonly SNAPSHOT_WINDOW = 5; // keep 5 seconds of history

  constructor(
    spatialGrid: SpatialGrid,
    events: EventEmitter<GameEvents>,
    heroManager: HeroManager,
  ) {
    this.spatialGrid = spatialGrid;
    this.events = events;
    this.heroManager = heroManager;

    // Listen for kills to award hero XP
    this.events.on('death', (e) => {
      this.onEnemyKill(e.faction === 'player' ? 'enemy' : 'player');
    });
  }

  /**
   * Called every frame. Ticks cooldowns, processes passive effects,
   * records HP snapshots, and manages status effect durations.
   */
  update(world: World, deltaTime: number): void {
    // Tick hero ability cooldowns
    this.tickCooldowns(world);

    // Record HP snapshots for temporal shift
    this.recordHpSnapshots(world, deltaTime);

    // Tick status effect durations (Stunned, Shielded, Untargetable)
    this.tickStatusEffects(world, deltaTime);

    // Apply Leonidas passive (Last Stand)
    this.applyPassives(world);
  }

  /**
   * Activate a hero ability.
   * @param faction Which faction's hero to use
   * @param abilityIndex 0 for ability 1, 1 for ability 2
   * @returns true if ability was successfully used
   */
  useAbility(world: World, faction: 'player' | 'enemy', abilityIndex: number): boolean {
    const heroEntityId = this.heroManager.getHero(faction);
    if (heroEntityId === null) return false;
    if (!world.isAlive(heroEntityId)) return false;

    const hero = world.getComponent<HeroComponent>(heroEntityId, 'Hero');
    if (!hero || hero.isDead) return false;

    // Check cooldown
    const cooldown = abilityIndex === 0 ? hero.ability1Cooldown : hero.ability2Cooldown;
    if (cooldown > 0) return false;

    // Get hero config to find the ability effect
    const heroConfig = this.heroManager.getHeroConfig(hero.heroId);
    if (!heroConfig) return false;

    const ability = heroConfig.abilities[abilityIndex];
    if (!ability) return false;

    // Set cooldown
    if (abilityIndex === 0) {
      hero.ability1Cooldown = hero.ability1MaxCooldown;
    } else {
      hero.ability2Cooldown = hero.ability2MaxCooldown;
    }

    // Get hero position for targeting
    const heroPos = world.getComponent<Position>(heroEntityId, 'Position');
    if (!heroPos) return false;

    // Execute the ability effect
    this.executeAbility(world, faction, heroEntityId, heroPos, ability.effect);

    return true;
  }

  /**
   * Award XP to the hero of the faction that scored a kill.
   */
  private onEnemyKill(killerFaction: 'player' | 'enemy'): void {
    // The death event gives us the faction of the dead unit.
    // The killer is the opposite faction.
    const heroEntityId = this.heroManager.getHero(killerFaction);
    if (heroEntityId === null) return;

    const world = this.getWorldFromHero(heroEntityId);
    if (!world) return;

    const hero = world.getComponent<HeroComponent>(heroEntityId, 'Hero');
    if (!hero || hero.isDead) return;

    hero.xp += XP_PER_KILL;

    // Check for level up
    if (hero.level < MAX_HERO_LEVEL && hero.xp >= hero.xpToLevel) {
      hero.level++;
      if (hero.level < MAX_HERO_LEVEL) {
        hero.xpToLevel = XP_THRESHOLDS[hero.level - 1];
      } else {
        hero.xpToLevel = XP_THRESHOLDS[MAX_HERO_LEVEL - 1];
      }

      // Apply level-up stat bonus (+10% per level)
      this.applyLevelBonus(world, heroEntityId, hero.level);
    }
  }

  /**
   * Since we can't store a World reference in events, we need a workaround.
   * The HeroManager holds the World reference.
   */
  private _worldRef: World | null = null;

  /** Store a world reference for use in event handlers. */
  setWorldRef(world: World): void {
    this._worldRef = world;
  }

  private getWorldFromHero(heroEntityId: EntityId): World | null {
    return this._worldRef;
  }

  /**
   * Apply level-up stat bonuses to the hero entity.
   */
  private applyLevelBonus(world: World, heroEntityId: EntityId, level: number): void {
    const heroConfig = this.heroManager.getHeroConfig(
      world.getComponent<HeroComponent>(heroEntityId, 'Hero')?.heroId ?? '',
    );
    if (!heroConfig) return;

    const multiplier = 1 + (level - 1) * STAT_BONUS_PER_LEVEL;

    const health = world.getComponent<Health>(heroEntityId, 'Health');
    if (health) {
      const newMax = Math.round(heroConfig.hp * multiplier);
      const hpGain = newMax - health.max;
      health.max = newMax;
      health.current += hpGain; // heal by the gained amount
    }

    const combat = world.getComponent<Combat>(heroEntityId, 'Combat');
    if (combat) {
      combat.damage = Math.round(heroConfig.damage * multiplier);
    }
  }

  // ── Cooldown Ticking ───────────────────────────────────────────

  private tickCooldowns(world: World): void {
    const heroes = world.query('Hero');

    for (let i = 0; i < heroes.length; i++) {
      const heroEntityId = heroes[i];
      const hero = world.getComponent<HeroComponent>(heroEntityId, 'Hero')!;

      // Get deltaTime from game time
      const gt = world.query('GameTime');
      let deltaTime = 1 / 60; // fallback
      if (gt.length > 0) {
        // We approximate deltaTime — for precise tracking, systems receive it as a param
        // but cooldowns tick based on the update call
      }

      if (hero.ability1Cooldown > 0) {
        hero.ability1Cooldown = Math.max(0, hero.ability1Cooldown - deltaTime);
      }
      if (hero.ability2Cooldown > 0) {
        hero.ability2Cooldown = Math.max(0, hero.ability2Cooldown - deltaTime);
      }
    }
  }

  /** Store deltaTime from the update call for use in cooldown ticking. */
  private _lastDeltaTime: number = 1 / 60;

  /** Override update to capture deltaTime. */
  updateWithDelta(world: World, deltaTime: number): void {
    this._lastDeltaTime = deltaTime;

    // Tick cooldowns with real delta
    const heroes = world.query('Hero');
    for (let i = 0; i < heroes.length; i++) {
      const hero = world.getComponent<HeroComponent>(heroes[i], 'Hero')!;
      if (hero.ability1Cooldown > 0) {
        hero.ability1Cooldown = Math.max(0, hero.ability1Cooldown - deltaTime);
      }
      if (hero.ability2Cooldown > 0) {
        hero.ability2Cooldown = Math.max(0, hero.ability2Cooldown - deltaTime);
      }
    }

    // Record HP snapshots for temporal shift
    this.recordHpSnapshots(world, deltaTime);

    // Tick status effect durations
    this.tickStatusEffects(world, deltaTime);

    // Apply passives
    this.applyPassives(world);
  }

  // ── Status Effect Ticking ──────────────────────────────────────

  private tickStatusEffects(world: World, deltaTime: number): void {
    // Stunned
    const stunned = world.query('Stunned');
    for (let i = 0; i < stunned.length; i++) {
      const stun = world.getComponent<Stunned>(stunned[i], 'Stunned')!;
      stun.remaining -= deltaTime;
      if (stun.remaining <= 0) {
        world.removeComponent(stunned[i], 'Stunned');
      } else {
        // Keep velocity at 0 while stunned
        const vel = world.getComponent<Velocity>(stunned[i], 'Velocity');
        if (vel) {
          vel.dx = 0;
          vel.dy = 0;
        }
      }
    }

    // Shielded
    const shielded = world.query('Shielded');
    for (let i = 0; i < shielded.length; i++) {
      const shield = world.getComponent<Shielded>(shielded[i], 'Shielded')!;
      shield.remaining -= deltaTime;
      if (shield.remaining <= 0) {
        world.removeComponent(shielded[i], 'Shielded');
      }
    }

    // Untargetable
    const untargetable = world.query('Untargetable');
    for (let i = 0; i < untargetable.length; i++) {
      const effect = world.getComponent<Untargetable>(untargetable[i], 'Untargetable')!;
      effect.remaining -= deltaTime;
      if (effect.remaining <= 0) {
        world.removeComponent(untargetable[i], 'Untargetable');
      }
    }
  }

  // ── Passive Effects ────────────────────────────────────────────

  private applyPassives(world: World): void {
    // Leonidas: Last Stand passive (+100% damage below 25% HP)
    const heroes = world.query('Hero', 'Health', 'Combat');
    for (let i = 0; i < heroes.length; i++) {
      const heroComp = world.getComponent<HeroComponent>(heroes[i], 'Hero')!;
      if (heroComp.heroId !== 'leonidas') continue;

      const health = world.getComponent<Health>(heroes[i], 'Health')!;
      const combat = world.getComponent<Combat>(heroes[i], 'Combat')!;
      const heroConfig = this.heroManager.getHeroConfig('leonidas');
      if (!heroConfig) continue;

      const hpRatio = health.current / health.max;
      const multiplier = 1 + (heroComp.level - 1) * STAT_BONUS_PER_LEVEL;
      const baseDamage = Math.round(heroConfig.damage * multiplier);

      if (hpRatio <= 0.25) {
        combat.damage = baseDamage * 2; // +100% damage
      } else {
        combat.damage = baseDamage;
      }
    }
  }

  // ── HP Snapshot Recording (for Temporal Shift) ─────────────────

  private recordHpSnapshots(world: World, deltaTime: number): void {
    this.snapshotTimer += deltaTime;
    if (this.snapshotTimer < this.SNAPSHOT_INTERVAL) return;
    this.snapshotTimer -= this.SNAPSHOT_INTERVAL;

    const gt = world.query('GameTime');
    let currentTime = 0;
    if (gt.length > 0) {
      const time = world.getComponent<{ elapsed: number }>(gt[0], 'GameTime');
      if (time) currentTime = time.elapsed;
    }

    // Record snapshots for all entities with Health
    const entities = world.query('Health', 'Faction');
    for (let i = 0; i < entities.length; i++) {
      const health = world.getComponent<Health>(entities[i], 'Health')!;
      this.hpSnapshots.push({
        entityId: entities[i],
        hp: health.current,
        timestamp: currentTime,
      });
    }

    // Prune old snapshots (keep only last SNAPSHOT_WINDOW seconds)
    const cutoff = currentTime - this.SNAPSHOT_WINDOW;
    let writeIdx = 0;
    for (let i = 0; i < this.hpSnapshots.length; i++) {
      if (this.hpSnapshots[i].timestamp >= cutoff) {
        this.hpSnapshots[writeIdx++] = this.hpSnapshots[i];
      }
    }
    this.hpSnapshots.length = writeIdx;
  }

  // ── Ability Execution ──────────────────────────────────────────

  private executeAbility(
    world: World,
    faction: 'player' | 'enemy',
    heroEntityId: EntityId,
    heroPos: Position,
    effect: HeroAbilityEffect,
  ): void {
    switch (effect.type) {
      case 'stun':
        this.abilityStun(world, faction, heroPos, effect);
        break;
      case 'aoe_damage':
        this.abilityAoeDamage(world, faction, heroPos, effect);
        break;
      case 'buff_speed':
        this.abilityBuffSpeed(world, faction, heroPos, effect);
        break;
      case 'shield':
        this.abilityShield(world, faction, heroPos, effect);
        break;
      case 'heal':
        this.abilityHeal(world, faction, heroPos, effect);
        break;
      case 'buff_damage':
        this.abilityBuffDamage(world, faction, heroPos, effect);
        break;
      case 'deploy_turret':
        this.abilityDeployTurret(world, faction, heroPos, effect);
        break;
      case 'smoke_screen':
        this.abilitySmokeScreen(world, faction, heroPos, effect);
        break;
      case 'airstrike':
        this.abilityAirstrike(world, faction, heroPos, effect);
        break;
      case 'buff_turrets':
        this.abilityBuffTurrets(world, faction, effect);
        break;
      case 'temporal_shift':
        this.abilityTemporalShift(world, faction, effect);
        break;
      case 'singularity':
        this.abilitySingularity(world, faction, heroPos, effect);
        break;
      case 'knockback':
        this.abilityKnockback(world, faction, heroPos, effect);
        break;
      case 'buff_range':
        this.abilityBuffRange(world, faction, heroPos, effect);
        break;
      case 'passive_last_stand':
        // Passive effect — handled in applyPassives()
        break;
    }
  }

  /** Stun: set all enemies in radius to 0 velocity for duration. */
  private abilityStun(
    world: World,
    faction: 'player' | 'enemy',
    center: Position,
    effect: HeroAbilityEffect,
  ): void {
    const radius = effect.radius ?? 120;
    const duration = effect.duration ?? 2;

    const candidates = this.spatialGrid.queryRange(center.x, center.y, radius);
    for (let i = 0; i < candidates.length; i++) {
      const candidateId = candidates[i];
      if (!world.isAlive(candidateId)) continue;

      const candidateFaction = world.getComponent<Faction>(candidateId, 'Faction');
      if (!candidateFaction || candidateFaction.faction === faction) continue;

      const candidatePos = world.getComponent<Position>(candidateId, 'Position');
      if (!candidatePos) continue;

      const dx = candidatePos.x - center.x;
      const dy = candidatePos.y - center.y;
      if (dx * dx + dy * dy > radius * radius) continue;

      // Apply stun
      world.addComponent<Stunned>(candidateId, 'Stunned', { remaining: duration });

      const vel = world.getComponent<Velocity>(candidateId, 'Velocity');
      if (vel) {
        vel.dx = 0;
        vel.dy = 0;
      }
    }
  }

  /** AoE Damage: damage all enemies in radius. */
  private abilityAoeDamage(
    world: World,
    faction: 'player' | 'enemy',
    center: Position,
    effect: HeroAbilityEffect,
  ): void {
    const radius = effect.radius ?? 80;
    const damage = effect.damage ?? 40;

    const candidates = this.spatialGrid.queryRange(center.x, center.y, radius);
    for (let i = 0; i < candidates.length; i++) {
      const candidateId = candidates[i];
      if (!world.isAlive(candidateId)) continue;

      const candidateFaction = world.getComponent<Faction>(candidateId, 'Faction');
      if (!candidateFaction || candidateFaction.faction === faction) continue;

      const health = world.getComponent<Health>(candidateId, 'Health');
      if (!health) continue;

      const candidatePos = world.getComponent<Position>(candidateId, 'Position');
      if (!candidatePos) continue;

      const dx = candidatePos.x - center.x;
      const dy = candidatePos.y - center.y;
      if (dx * dx + dy * dy > radius * radius) continue;

      health.current -= damage;
      this.events.emit('damage', {
        attackerId: -1,
        targetId: candidateId,
        damage,
        remainingHp: health.current,
      });
    }
  }

  /** Buff Speed: multiply all ally velocities by multiplier for duration. */
  private abilityBuffSpeed(
    world: World,
    faction: 'player' | 'enemy',
    center: Position,
    effect: HeroAbilityEffect,
  ): void {
    const radius = effect.radius ?? 200;
    const multiplier = effect.multiplier ?? 1.3;
    const duration = effect.duration ?? 5;

    const candidates = this.spatialGrid.queryRange(center.x, center.y, radius);
    for (let i = 0; i < candidates.length; i++) {
      const candidateId = candidates[i];
      if (!world.isAlive(candidateId)) continue;

      const candidateFaction = world.getComponent<Faction>(candidateId, 'Faction');
      if (!candidateFaction || candidateFaction.faction !== faction) continue;

      const candidatePos = world.getComponent<Position>(candidateId, 'Position');
      if (!candidatePos) continue;

      const dx = candidatePos.x - center.x;
      const dy = candidatePos.y - center.y;
      if (dx * dx + dy * dy > radius * radius) continue;

      const vel = world.getComponent<Velocity>(candidateId, 'Velocity');
      if (vel) {
        vel.dx *= multiplier;
        vel.dy *= multiplier;
      }

      // Note: speed buff wears off naturally as units get new velocity from movement
      // For proper duration tracking, we would need a BuffEffect component (future enhancement)
    }
  }

  /** Shield: block projectiles for allies in radius for duration. */
  private abilityShield(
    world: World,
    faction: 'player' | 'enemy',
    center: Position,
    effect: HeroAbilityEffect,
  ): void {
    const radius = effect.radius ?? 100;
    const duration = effect.duration ?? 3;

    const candidates = this.spatialGrid.queryRange(center.x, center.y, radius);
    for (let i = 0; i < candidates.length; i++) {
      const candidateId = candidates[i];
      if (!world.isAlive(candidateId)) continue;

      const candidateFaction = world.getComponent<Faction>(candidateId, 'Faction');
      if (!candidateFaction || candidateFaction.faction !== faction) continue;

      const candidatePos = world.getComponent<Position>(candidateId, 'Position');
      if (!candidatePos) continue;

      const dx = candidatePos.x - center.x;
      const dy = candidatePos.y - center.y;
      if (dx * dx + dy * dy > radius * radius) continue;

      world.addComponent<Shielded>(candidateId, 'Shielded', { remaining: duration });
    }
  }

  /** Heal: restore HP to allies in radius. */
  private abilityHeal(
    world: World,
    faction: 'player' | 'enemy',
    center: Position,
    effect: HeroAbilityEffect,
  ): void {
    const radius = effect.radius ?? 200;
    const healPercent = effect.healPercent ?? 0.20;

    const candidates = this.spatialGrid.queryRange(center.x, center.y, radius);
    for (let i = 0; i < candidates.length; i++) {
      const candidateId = candidates[i];
      if (!world.isAlive(candidateId)) continue;

      const candidateFaction = world.getComponent<Faction>(candidateId, 'Faction');
      if (!candidateFaction || candidateFaction.faction !== faction) continue;

      const health = world.getComponent<Health>(candidateId, 'Health');
      if (!health) continue;

      const candidatePos = world.getComponent<Position>(candidateId, 'Position');
      if (!candidatePos) continue;

      const dx = candidatePos.x - center.x;
      const dy = candidatePos.y - center.y;
      if (dx * dx + dy * dy > radius * radius) continue;

      const healAmount = Math.round(health.max * healPercent);
      health.current = Math.min(health.max, health.current + healAmount);
    }
  }

  /** Buff Damage: multiply ally combat damage for duration. */
  private abilityBuffDamage(
    world: World,
    faction: 'player' | 'enemy',
    center: Position,
    effect: HeroAbilityEffect,
  ): void {
    const radius = effect.radius ?? 200;
    const multiplier = effect.multiplier ?? 1.25;

    const candidates = this.spatialGrid.queryRange(center.x, center.y, radius);
    for (let i = 0; i < candidates.length; i++) {
      const candidateId = candidates[i];
      if (!world.isAlive(candidateId)) continue;

      const candidateFaction = world.getComponent<Faction>(candidateId, 'Faction');
      if (!candidateFaction || candidateFaction.faction !== faction) continue;

      const candidatePos = world.getComponent<Position>(candidateId, 'Position');
      if (!candidatePos) continue;

      const dx = candidatePos.x - center.x;
      const dy = candidatePos.y - center.y;
      if (dx * dx + dy * dy > radius * radius) continue;

      const combat = world.getComponent<Combat>(candidateId, 'Combat');
      if (combat) {
        combat.damage = Math.round(combat.damage * multiplier);
      }
    }
  }

  /** Deploy Turret: create temporary turret entity with Lifetime. */
  private abilityDeployTurret(
    world: World,
    faction: 'player' | 'enemy',
    heroPos: Position,
    effect: HeroAbilityEffect,
  ): void {
    const turretDamage = effect.turretDamage ?? 20;
    const turretFireRate = effect.turretFireRate ?? 2.0;
    const turretRange = effect.turretRange ?? 150;
    const duration = effect.duration ?? 20;

    const turretId = world.createEntity();

    world.addComponent<Position>(turretId, 'Position', {
      x: heroPos.x,
      y: heroPos.y,
    });
    world.addComponent<Health>(turretId, 'Health', {
      current: 100,
      max: 100,
    });
    world.addComponent<Faction>(turretId, 'Faction', { faction });
    world.addComponent<Combat>(turretId, 'Combat', {
      damage: turretDamage,
      range: turretRange,
      attackSpeed: turretFireRate,
      lastAttackTime: -Infinity,
      projectileType: 'bullet',
    });
    world.addComponent<Lifetime>(turretId, 'Lifetime', { remaining: duration });
    world.addComponent<Renderable>(turretId, 'Renderable', {
      spriteKey: 'hero_turret',
      animation: 'idle',
      layer: 2,
      visible: true,
      flipX: faction === 'enemy',
    });

    this.spatialGrid.insert(turretId, heroPos.x, heroPos.y);
  }

  /** Smoke Screen: set allies untargetable for duration. */
  private abilitySmokeScreen(
    world: World,
    faction: 'player' | 'enemy',
    center: Position,
    effect: HeroAbilityEffect,
  ): void {
    const radius = effect.radius ?? 200;
    const duration = effect.duration ?? 3;

    const candidates = this.spatialGrid.queryRange(center.x, center.y, radius);
    for (let i = 0; i < candidates.length; i++) {
      const candidateId = candidates[i];
      if (!world.isAlive(candidateId)) continue;

      const candidateFaction = world.getComponent<Faction>(candidateId, 'Faction');
      if (!candidateFaction || candidateFaction.faction !== faction) continue;

      const candidatePos = world.getComponent<Position>(candidateId, 'Position');
      if (!candidatePos) continue;

      const dx = candidatePos.x - center.x;
      const dy = candidatePos.y - center.y;
      if (dx * dx + dy * dy > radius * radius) continue;

      world.addComponent<Untargetable>(candidateId, 'Untargetable', { remaining: duration });
    }
  }

  /** Airstrike: create damage zones across battlefield. */
  private abilityAirstrike(
    world: World,
    faction: 'player' | 'enemy',
    center: Position,
    effect: HeroAbilityEffect,
  ): void {
    const strikes = effect.strikes ?? 3;
    const damage = effect.damage ?? 100;
    const radius = effect.radius ?? 80;

    for (let i = 0; i < strikes; i++) {
      const offsetX = (i - Math.floor(strikes / 2)) * 120;
      const strikeX = center.x + offsetX;

      const zoneId = world.createEntity();
      world.addComponent<Position>(zoneId, 'Position', { x: strikeX, y: center.y });
      world.addComponent<Lifetime>(zoneId, 'Lifetime', { remaining: 1.0 });
      world.addComponent<Faction>(zoneId, 'Faction', { faction });

      // Deal instant damage to enemies in range
      const targets = this.spatialGrid.queryRange(strikeX, center.y, radius);
      for (let j = 0; j < targets.length; j++) {
        const targetId = targets[j];
        if (!world.isAlive(targetId)) continue;

        const targetFaction = world.getComponent<Faction>(targetId, 'Faction');
        if (!targetFaction || targetFaction.faction === faction) continue;

        const health = world.getComponent<Health>(targetId, 'Health');
        if (!health) continue;

        const targetPos = world.getComponent<Position>(targetId, 'Position');
        if (!targetPos) continue;

        const dx = targetPos.x - strikeX;
        const dy = targetPos.y - center.y;
        if (dx * dx + dy * dy > radius * radius) continue;

        health.current -= damage;
        this.events.emit('damage', {
          attackerId: -1,
          targetId,
          damage,
          remainingHp: health.current,
        });
      }

      this.spatialGrid.insert(zoneId, strikeX, center.y);
    }
  }

  /** Buff Turrets: multiply turret fire rates for duration. */
  private abilityBuffTurrets(
    world: World,
    faction: 'player' | 'enemy',
    effect: HeroAbilityEffect,
  ): void {
    const fireRateMultiplier = effect.fireRateMultiplier ?? 1.5;

    const turrets = world.query('TurretComponent', 'Faction');
    for (let i = 0; i < turrets.length; i++) {
      const turretFaction = world.getComponent<Faction>(turrets[i], 'Faction');
      if (!turretFaction || turretFaction.faction !== faction) continue;

      const turret = world.getComponent<TurretComponent>(turrets[i], 'TurretComponent');
      if (turret) {
        turret.fireRate *= fireRateMultiplier;
      }
    }
    // Note: fire rate resets on ability expiry would require a buff tracking system.
    // For now, the buff is permanent until turret replacement.
  }

  /** Temporal Shift: restore all ally HP to values from N seconds ago. */
  private abilityTemporalShift(
    world: World,
    faction: 'player' | 'enemy',
    effect: HeroAbilityEffect,
  ): void {
    const rewindSeconds = effect.rewindSeconds ?? 3;

    // Get current game time
    const gt = world.query('GameTime');
    let currentTime = 0;
    if (gt.length > 0) {
      const time = world.getComponent<{ elapsed: number }>(gt[0], 'GameTime');
      if (time) currentTime = time.elapsed;
    }

    const targetTime = currentTime - rewindSeconds;

    // Find snapshots closest to the target time for each ally entity
    const restoredMap = new Map<EntityId, number>();

    for (let i = 0; i < this.hpSnapshots.length; i++) {
      const snap = this.hpSnapshots[i];
      if (snap.timestamp > targetTime) continue;

      // Check if this entity is an ally
      const entityFaction = world.getComponent<Faction>(snap.entityId, 'Faction');
      if (!entityFaction || entityFaction.faction !== faction) continue;

      // Keep the snapshot closest to target time
      const existing = restoredMap.get(snap.entityId);
      if (existing === undefined || snap.hp > 0) {
        restoredMap.set(snap.entityId, snap.hp);
      }
    }

    // Apply restored HP values
    for (const [entityId, oldHp] of restoredMap) {
      if (!world.isAlive(entityId)) continue;

      const health = world.getComponent<Health>(entityId, 'Health');
      if (!health) continue;

      // Only restore if it would be beneficial (more HP than current)
      if (oldHp > health.current) {
        health.current = Math.min(health.max, oldHp);
      }
    }
  }

  /** Singularity: pull all enemies toward center point. */
  private abilitySingularity(
    world: World,
    faction: 'player' | 'enemy',
    center: Position,
    effect: HeroAbilityEffect,
  ): void {
    const radius = effect.radius ?? 250;
    const pullStrength = effect.pullStrength ?? 200;

    const candidates = this.spatialGrid.queryRange(center.x, center.y, radius);
    for (let i = 0; i < candidates.length; i++) {
      const candidateId = candidates[i];
      if (!world.isAlive(candidateId)) continue;

      const candidateFaction = world.getComponent<Faction>(candidateId, 'Faction');
      if (!candidateFaction || candidateFaction.faction === faction) continue;

      const candidatePos = world.getComponent<Position>(candidateId, 'Position');
      if (!candidatePos) continue;

      const dx = center.x - candidatePos.x;
      const dy = center.y - candidatePos.y;
      const distSq = dx * dx + dy * dy;
      if (distSq > radius * radius) continue;

      const dist = Math.sqrt(distSq);
      if (dist < 1) continue; // already at center

      // Apply pull velocity toward center
      const vel = world.getComponent<Velocity>(candidateId, 'Velocity');
      if (vel) {
        const normalizedX = dx / dist;
        const normalizedY = dy / dist;
        vel.dx = normalizedX * pullStrength;
        vel.dy = normalizedY * pullStrength;
      }
    }
  }

  /** Knockback: push all enemies back by distance. */
  private abilityKnockback(
    world: World,
    faction: 'player' | 'enemy',
    center: Position,
    effect: HeroAbilityEffect,
  ): void {
    const radius = effect.radius ?? 100;
    const distance = effect.distance ?? 50;

    const candidates = this.spatialGrid.queryRange(center.x, center.y, radius);
    for (let i = 0; i < candidates.length; i++) {
      const candidateId = candidates[i];
      if (!world.isAlive(candidateId)) continue;

      const candidateFaction = world.getComponent<Faction>(candidateId, 'Faction');
      if (!candidateFaction || candidateFaction.faction === faction) continue;

      const candidatePos = world.getComponent<Position>(candidateId, 'Position');
      if (!candidatePos) continue;

      const dx = candidatePos.x - center.x;
      const dy = candidatePos.y - center.y;
      const distSq = dx * dx + dy * dy;
      if (distSq > radius * radius) continue;

      const dist = Math.sqrt(distSq);
      if (dist < 1) continue;

      // Push away from center
      const normalizedX = dx / dist;
      candidatePos.x += normalizedX * distance;
    }
  }

  /** Buff Range: multiply all ally ranges for duration. */
  private abilityBuffRange(
    world: World,
    faction: 'player' | 'enemy',
    center: Position,
    effect: HeroAbilityEffect,
  ): void {
    const radius = effect.radius ?? 300;
    const multiplier = effect.multiplier ?? 1.20;

    const candidates = this.spatialGrid.queryRange(center.x, center.y, radius);
    for (let i = 0; i < candidates.length; i++) {
      const candidateId = candidates[i];
      if (!world.isAlive(candidateId)) continue;

      const candidateFaction = world.getComponent<Faction>(candidateId, 'Faction');
      if (!candidateFaction || candidateFaction.faction !== faction) continue;

      const combat = world.getComponent<Combat>(candidateId, 'Combat');
      if (combat) {
        combat.range = Math.round(combat.range * multiplier);
      }
    }
  }

  /**
   * Reset state for a new game.
   */
  reset(): void {
    this.hpSnapshots.length = 0;
    this.snapshotTimer = 0;
    this._worldRef = null;
  }
}
