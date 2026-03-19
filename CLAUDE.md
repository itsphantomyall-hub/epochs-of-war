# Epochs of War — Agent Instructions

## Project Overview
A modern reimagining of "Age of War" — a side-scrolling base-vs-base strategy game where players spawn units, evolve through 8 ages (Prehistoric → Future), build turrets, deploy heroes, and destroy the enemy base.

## Tech Stack
- **Engine**: Phaser 4 (HTML5/WebGL)
- **Language**: TypeScript (strict mode)
- **Build**: Vite
- **Architecture**: Entity-Component-System (ECS)
- **Audio**: Howler.js (to be added)

## Key Files
- `GAME_DESIGN.md` — Complete game design document (1,800+ lines). READ THIS FIRST.
- `AGENT_DELEGATION.md` — Task assignments per department and phase.
- `src/config/*.json` — Data-driven unit/turret/hero/age definitions.
- `src/core/ecs/` — ECS framework (World, Entity, Query).
- `src/core/components/` — Data components (Position, Health, Combat, etc.).
- `src/core/systems/` — Game logic systems (Movement, Combat, Spawn, etc.).
- `src/core/managers/` — High-level managers (GameManager, TechTree, etc.).

## Architecture Rules
1. All game data (units, turrets, heroes, ages) lives in JSON config files, NOT hardcoded.
2. Use ECS pattern: Components are pure data, Systems are pure logic, Entities are IDs.
3. Systems update in fixed order (see GAME_DESIGN.md Section 16.1).
4. Use object pooling for units and projectiles — performance target is 60 FPS with 100+ units.
5. Use SpatialGrid for collision detection, not O(n²) loops.

## Code Style
- TypeScript strict mode. No `any` unless absolutely necessary.
- Prefer composition over inheritance.
- Small files, single responsibility. One system per file.
- Use the file/folder structure defined in GAME_DESIGN.md Section 35.

## Project Documents
- `GAME_DESIGN.md` — Complete game design (1,800+ lines). The source of truth for all mechanics.
- `AGENT_DELEGATION.md` — Claw-Empire agent task assignments by phase.
- `VISUAL_QUALITY_PLAN.md` — Art direction, sprite specs, animation guidelines, quality benchmarks.

## Current Implementation Status (Phase 5 complete)
- ECS engine with 12 components, 13 systems, 5 managers
- 32 units across 8 ages with counter system
- 16 turrets (5 slots, 3 upgrade tiers)
- 8 heroes with 12+ ability types
- Tech tree (3 branches × 4 tiers)
- Terrain (6 types), Weather (6 events), Formations (4 types)
- AI Director with 5 difficulty levels
- Particle effects, screen shake, evolution cinematics
- 4 game modes: Classic, Campaign (30 missions), Survival (roguelike buffs), Sandbox
- Phase 6 (Multiplayer) and Phase 7 (Meta) in progress

## Commands
- `npx vite` — Start dev server on port 3100
- `npx tsc --noEmit --skipLibCheck` — Type check (skipLibCheck avoids Phaser's ActiveXObject issue)
- `npx vite build` — Production build

## Visual Standards
- All sprites are procedurally generated via Phaser Graphics (no external image files)
- 6 skin tone palettes for character diversity (see VISUAL_QUALITY_PLAN.md)
- 2px black outlines on all character sprites
- Max 8 colors per unit sprite
- Age-appropriate gear/clothing that is immediately recognizable
- Every unit visually distinct at 16px height

## DO NOT
- Do not modify `GAME_DESIGN.md` or `AGENT_DELEGATION.md`.
- Do not install additional frameworks (no React, no Vue). UI is built with Phaser scenes.
- Do not use `var`. Use `const` by default, `let` when mutation is needed.
- Do not use external sprite/image assets. All art is procedural via Phaser Graphics.
