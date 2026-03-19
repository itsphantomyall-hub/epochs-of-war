# EPOCHS OF WAR — CLAW-EMPIRE AGENT DELEGATION PLAN

Maps the 14 Claw-Empire agents across 6 departments to the game's development phases.

---

## AGENT ROSTER (from Claw-Empire)

| Agent | Department | Role | Assigned Domain |
|-------|-----------|------|-----------------|
| **Clio** | Planning | Team Leader | Architecture, task decomposition, sprint planning |
| **Sage** | Planning | Senior | System design docs, dependency mapping, review specs |
| **Bolt** | Development | Senior | Core ECS engine, game loop, systems |
| **Aria** | Development | Senior | UI/HUD, menus, overlays, tech tree interface |
| **Nova** | Development | Junior | Unit spawning, economy system, save/load |
| **Luna** | Design | Junior | Sprite concepts, animation specs, visual effects |
| **Pixel** | Design | Junior | Background art, parallax, base transformation designs |
| **DORO** | QA | Senior | Balance testing, DPS verification, bot-vs-bot sims |
| **Lint** | QA | Junior | Bug testing, edge cases, accessibility audit |
| **Hawk** | QA | Junior | Performance profiling, memory leaks, FPS monitoring |
| **Pipe** | DevSecOps | Senior | Build pipeline, CI/CD, deployment, asset optimization |
| **Vault** | DevSecOps | Junior | Anti-cheat validation, input sanitization, multiplayer security |
| **Turbo** | Operations | Senior | Multiplayer server, WebSocket infra, matchmaking |
| **Atlas** | Operations | Junior | Analytics, telemetry, A/B testing, monitoring |

---

## PHASE 1: CORE PROTOTYPE (Sprint 1-2)

### Meeting 1: Kickoff — All departments
**Agenda**: Review GAME_DESIGN.md, confirm tech stack, assign Phase 1 tasks.

### Planning Department
| Agent | Task | Output |
|-------|------|--------|
| Clio | Create Phase 1 task breakdown with dependencies | `tasks/phase1-breakdown.md` |
| Sage | Write ECS architecture spec matching Section 16 | `docs/ecs-architecture.md` |

### Development Department
| Agent | Task | Output |
|-------|------|--------|
| Bolt | Scaffold Phaser project + Vite + TypeScript. Implement ECS core (World, Entity, Query, Components). Implement 6 core systems: Input, Movement, Combat, Health, Spawn, Cleanup. | `src/core/**` |
| Aria | Build HUD (gold display, XP bar, unit spawn buttons with keyboard shortcuts Q/W/E/R, evolve button T, base HP bars). Match Section 13.1 layout. | `src/ui/HUD.ts` |
| Nova | Implement EconomySystem (gold tracking, kill rewards, passive income per Section 9.2), SpawnSystem (unit queue with spawn times), and 2 ages of unit data from `units.json`. | `src/core/systems/EconomySystem.ts`, `src/core/systems/SpawnSystem.ts`, `src/config/units.json` (Ages 1+4 only) |

### Design Department
| Agent | Task | Output |
|-------|------|--------|
| Luna | Create placeholder sprite sheets for Age 1 (Clubman, Slinger, Dino Rider, Pack Raptors) and Age 4 (Swordsman, Crossbowman, Knight, Trebuchet). 32x32 frames, 16-frame sheets per unit. | `assets/sprites/units/prehistoric/`, `assets/sprites/units/medieval/` |
| Pixel | Create placeholder base sprites (Age 1 + Age 4, 256x384) and 2 parallax backgrounds. Create ground tileset. | `assets/sprites/bases/`, `assets/backgrounds/` |

### QA Department
| Agent | Task | Output |
|-------|------|--------|
| DORO | Write DPS calculator tests verifying Section 24 math. Create economy simulation test (gold flow over 15 minutes). | `tests/balance/dps-calculator.test.ts`, `tests/balance/economy-sim.test.ts` |
| Lint | Write unit tests for ECS systems (spawn, combat, health). Test edge cases: 0 gold spawn attempt, negative HP, simultaneous kills. | `tests/systems/` |

### DevSecOps
| Agent | Task | Output |
|-------|------|--------|
| Pipe | Set up Vite build, TypeScript config, ESLint, Prettier. Create CI pipeline (lint + test on push). Asset optimization pipeline (sprite sheet packing, audio compression). | `vite.config.ts`, `tsconfig.json`, `.github/workflows/ci.yml` |

---

## PHASE 2: CORE SYSTEMS (Sprint 3-4)

### Development Department
| Agent | Task | Output |
|-------|------|--------|
| Bolt | Implement remaining 6 ages of units (all 32 units). Implement counter damage system (+50% bonus). Implement AgeSystem (evolution mechanic, XP tracking, base HP scaling). Implement turret system (5 slots, targeting, projectiles). | `src/core/systems/AgeSystem.ts`, `src/core/systems/TurretSystem.ts`, full `units.json`, `turrets.json` |
| Aria | Build age evolution transition animation (3-second cinematic, base rebuild effect). Build turret slot UI (click to build, upgrade, sell). Build Special ability button (SPACE) with targeting reticle. | `src/rendering/EvolutionTransition.ts`, turret UI in HUD |
| Nova | Implement all 8 special abilities (Section 8). Implement ProjectileSystem (7 projectile types from Section 26). Implement AISystem (basic counter-picking AI per Section 10.2). | `src/core/systems/ProjectileSystem.ts`, `src/ai/AIDirector.ts`, `src/config/abilities.json` |

### Design Department
| Agent | Task | Output |
|-------|------|--------|
| Luna | Create sprite sheets for remaining 6 ages (24 units). Create turret sprites (16 turrets). Create projectile sprites. | `assets/sprites/units/`, `assets/sprites/turrets/`, `assets/sprites/projectiles/` |
| Pixel | Create base sprites for all 8 ages + destruction states. Create all 8 parallax backgrounds. Create evolution transition particle effects. | `assets/sprites/bases/`, `assets/backgrounds/`, `assets/sprites/effects/` |

### QA Department
| Agent | Task | Output |
|-------|------|--------|
| DORO | Run cross-age engagement simulations (Section 24.5). Verify counter system produces expected TTK. Test 500-gold-vs-500-gold matchups across all age combinations. | `tests/balance/cross-age.test.ts` |
| Lint | Full integration test: play a complete game from Age 1 to Age 8 victory. Test all evolution transitions. Test turret build/upgrade/sell cycle. | `tests/integration/full-game.test.ts` |
| Hawk | Profile rendering with 100+ units on screen. Identify bottlenecks. Verify 60 FPS target. Test object pool efficiency. | `tests/performance/` |

---

## PHASE 3: DEPTH SYSTEMS (Sprint 5-6)

### Development Department
| Agent | Task | Output |
|-------|------|--------|
| Bolt | Implement HeroSystem (8 heroes, ability cooldowns, deployment, death/respawn rules per Section 5). Implement FormationSystem (auto-detection, bonuses per Section 25). Implement TerrainSystem (6 terrain types with combat modifiers). | `src/core/systems/HeroSystem.ts`, `src/core/systems/FormationSystem.ts`, `src/core/systems/TerrainSystem.ts` |
| Aria | Build TechTreeUI (3-branch overlay, point spending, visual feedback per Section 6). Build hero ability hotbar (keys 1-2). Build terrain zone indicators on battlefield. | `src/ui/TechTreeUI.ts`, hero hotbar in HUD |
| Nova | Implement TechTreeManager (14 points, sequential unlock, branch limits). Implement WeatherSystem (6 weather types, timed events per Section 7.4). Implement StatusEffectSystem (burn, slow, fear, stun). | `src/core/managers/TechTreeManager.ts`, `src/core/systems/WeatherSystem.ts`, `src/core/systems/StatusEffectSystem.ts` |

### Design Department
| Agent | Task | Output |
|-------|------|--------|
| Luna | Create hero sprites (8 heroes, larger 48x48 frames, detailed animations). Create weather visual effects (rain particles, fog overlay, lightning, sandstorm). | `assets/sprites/heroes/`, `assets/sprites/effects/weather/` |
| Pixel | Create terrain zone visuals (river, bridge, forest, ruins, hills). Create formation visual indicators (glow connections between units). | `assets/sprites/terrain/` |

### QA Department
| Agent | Task | Output |
|-------|------|--------|
| DORO | Balance test hero abilities — verify no hero is dominant across all matchups. Test tech tree branch combinations (Rush, Turtle, Boom) — each should win ~33%. | `tests/balance/heroes.test.ts`, `tests/balance/tech-tree.test.ts` |
| Lint | Test terrain effects apply correctly. Test weather modifiers stack/interact properly. Test formation auto-detection edge cases. | `tests/systems/terrain.test.ts`, `tests/systems/weather.test.ts` |

---

## PHASE 4: CONTENT & POLISH (Sprint 7-8)

### Development Department
| Agent | Task | Output |
|-------|------|--------|
| Bolt | Implement ParticleManager (explosions, blood, magic, construction). Implement CameraController (auto-focus, zoom, evolution zoom). Polish all death animations per Section 27. | `src/rendering/ParticleManager.ts`, `src/rendering/CameraController.ts` |
| Aria | Build MinimapRenderer. Build PostGameScreen (stats, star rating). Polish all UI transitions and animations. Implement Tooltip system. | `src/rendering/MinimapRenderer.ts`, `src/ui/PostGameScreen.ts`, `src/ui/Tooltip.ts` |
| Nova | Implement AudioManager + MusicController (dynamic layer system per Section 14, Appendix C). Implement SFX pooling. Integrate all audio hooks into combat/UI/weather systems. | `src/audio/` |

### Design Department
| Agent | Task | Output |
|-------|------|--------|
| Luna | Final pixel art polish pass on all 32 units + 8 heroes. Create attack VFX sprites (slash marks, bullet trails, energy blasts). Create UI icons for all units, turrets, abilities. | Final art pass across all `assets/sprites/` |
| Pixel | Create shader effects (glow, dissolve, shockwave per Section 35). Create victory/defeat screen art. Create loading screen art per age. | `src/rendering/shaders/`, `assets/ui/` |

### QA Department
| Agent | Task | Output |
|-------|------|--------|
| DORO | Full balance audit: run 1,000 bot-vs-bot games across all 5 AI personalities. Generate win-rate report. Propose balance adjustments. | `tests/balance/bot-vs-bot.test.ts`, `docs/balance-report.md` |
| Hawk | Performance audit with all effects enabled. Profile particle systems. Verify < 50MB asset size. Test on low-end devices (Canvas2D fallback). | `docs/performance-report.md` |
| Lint | Accessibility audit (Section 30). Test colorblind modes. Test keyboard-only play. Test one-button mode. Test screen reader compatibility. | `docs/accessibility-report.md` |

---

## PHASE 5: GAME MODES (Sprint 9-10)

### Development Department
| Agent | Task | Output |
|-------|------|--------|
| Bolt | Implement CampaignManager (30 missions, modifiers, star ratings per Section 21). Implement all 6 BossAI scripts (phase transitions, unique mechanics per Section 21.5). | `src/core/managers/CampaignManager.ts`, `src/ai/BossAI.ts`, `src/config/campaign.json` |
| Aria | Build CampaignMap UI (world map, continent navigation, mission selection, star display). Build SurvivalUI (wave counter, buff selection modal per Section 22.3). Build Sandbox UI. | `src/ui/CampaignMap.ts`, `src/ui/SurvivalUI.ts` |
| Nova | Implement WaveManager for Survival (wave scaling formula, buff system, milestone tracking per Section 22). Implement SaveManager (localStorage persistence per Section 29). Implement 5 AI personality strategies (Section 10.3). | `src/core/managers/WaveManager.ts`, `src/core/managers/SaveManager.ts`, `src/ai/strategies/` |

### Design Department
| Agent | Task | Output |
|-------|------|--------|
| Luna | Create boss sprites (6 bosses, large format 64x64 or 128x128, multi-phase animations). Create campaign map illustrations. | `assets/sprites/bosses/`, `assets/ui/campaign/` |
| Pixel | Create survival mode visual theme (arena background, wave announcement banners). Create buff card icons (30+ roguelike buffs). | `assets/ui/survival/`, `assets/ui/buffs/` |

### QA Department
| Agent | Task | Output |
|-------|------|--------|
| DORO | Playtest all 30 campaign missions. Verify 3-star requirements are achievable. Balance boss HP/damage for each difficulty. | `docs/campaign-balance.md` |
| Lint | Test save/load across all modes. Test resume-after-crash. Test Survival buff stacking edge cases. Test campaign modifier interactions. | `tests/integration/save-load.test.ts`, `tests/integration/survival.test.ts` |

---

## PHASE 6: MULTIPLAYER (Sprint 11-13)

### Development Department
| Agent | Task | Output |
|-------|------|--------|
| Bolt | Port GameManager to run server-side (Node.js). Implement deterministic game simulation with seeded RNG. Implement input command protocol. | `server/src/GameSimulation.ts` |
| Nova | Implement NetworkManager (WebSocket client, reconnection, heartbeat). Implement ClientPrediction + Interpolation. Implement ReplayRecorder (input log format). | `src/multiplayer/` |

### Operations Department
| Agent | Task | Output |
|-------|------|--------|
| Turbo | Set up Colyseus or custom WebSocket server. Implement GameRoom (match lifecycle, player join/leave). Implement Matchmaking (ELO-based queue, rank tiers). Deploy to cloud (Docker + nginx). | `server/`, deployment configs |
| Atlas | Implement analytics telemetry (Section 38). Track all key metrics. Build admin dashboard for live monitoring. Set up A/B testing framework. | `server/src/Analytics.ts`, monitoring dashboard |

### DevSecOps Department
| Agent | Task | Output |
|-------|------|--------|
| Vault | Implement AntiCheat (server-side input validation, rate limiting, desync detection per Section 37). Implement reporting system. Security audit of WebSocket connections. | `server/src/AntiCheat.ts` |
| Pipe | Set up multiplayer CI/CD (server deployment pipeline). Implement rolling updates with zero downtime. Set up staging environment for multiplayer testing. | Deployment pipeline |

### QA Department
| Agent | Task | Output |
|-------|------|--------|
| DORO | Test multiplayer balance (is going first an advantage?). Test 100+ concurrent matches for server stability. Test desync recovery. | `tests/multiplayer/` |
| Hawk | Load test multiplayer server (simulate 1000 concurrent connections). Profile server CPU/memory per match. Measure average latency. | `docs/load-test-report.md` |

---

## PHASE 7: META & LAUNCH (Sprint 14-15)

### Development Department
| Agent | Task | Output |
|-------|------|--------|
| Aria | Build MainMenu, SettingsMenu (Section 31), AchievementsPanel, DailyChallenges UI, Player Profile screen. Build TutorialOverlay (5-lesson flow per Section 23). | `src/ui/MainMenu.ts`, `src/ui/SettingsMenu.ts`, `src/ui/TutorialOverlay.ts` |
| Nova | Implement achievement system (Section 32, event-driven unlock checking). Implement daily challenge system (Section 33, midnight UTC rotation). Implement localization system (Section 36, i18n string loading). | `src/config/achievements.json`, `src/config/dailies.json`, `src/i18n/` |

### Design Department
| Agent | Task | Output |
|-------|------|--------|
| Luna | Create cosmetic skin variants (3 alternate base skins, 5 unit skins, 3 hero skins). Create achievement badge icons. Create daily challenge icons. | `assets/sprites/skins/`, `assets/ui/achievements/` |
| Pixel | Create main menu art, loading screens, title logo. Create animated profile borders. Final UI polish pass (buttons, frames, fonts). | `assets/ui/menu/` |

### Operations Department
| Agent | Task | Output |
|-------|------|--------|
| Turbo | Production deployment. CDN setup for assets. Database for player profiles. Backup and recovery procedures. | Production infrastructure |
| Atlas | Launch analytics dashboard. Set up real-time alerts for server health. Prepare A/B test for first balance experiment. | Monitoring + alerting |

### DevSecOps Department
| Agent | Task | Output |
|-------|------|--------|
| Pipe | Final build optimization (tree-shaking, code splitting, asset minification). Lighthouse audit for web performance. PWA setup (offline support). | Optimized production build |
| Vault | Final security audit. Penetration testing on multiplayer server. GDPR compliance check for player data. Rate limiting on all public endpoints. | `docs/security-audit.md` |

### QA Department
| Agent | Task | Output |
|-------|------|--------|
| DORO | Final balance pass with all systems active. Sign off on balance.json. | Final `src/config/balance.json` |
| Lint | Full regression test suite. Cross-browser testing (Chrome, Firefox, Safari, Edge). Mobile testing (iOS Safari, Android Chrome). | `docs/release-qa-report.md` |
| Hawk | Final performance certification. Verify 60 FPS, < 2s load, < 50MB across all target platforms. | `docs/performance-certification.md` |

---

## MEETING CADENCE

| Meeting | Frequency | Attendees | Purpose |
|---------|-----------|-----------|---------|
| **Sprint Planning** | Every 2 weeks | All agents | Assign tasks, set sprint goals |
| **Daily Standup** | Daily | Per department | Blockers, progress, dependencies |
| **Design Review** | Weekly | Dev + Design | Verify art integrates with code |
| **Balance Review** | Weekly | Dev + QA | Review DORO's simulation data |
| **Architecture Review** | Per phase | Planning + Dev | Ensure systems align with ECS |
| **Release Readiness** | Phase 4, 6, 7 | All | Go/no-go for major milestones |

---

## CRITICAL PATH (Dependencies)

```
Phase 1: Bolt (ECS) → Nova (Economy) → Aria (HUD) → DORO (Tests)
         Pipe (Build) runs parallel from day 1
         Luna + Pixel (Art) run parallel, deliver assets mid-sprint

Phase 2: Bolt (All units + turrets) → Nova (AI + specials) → Aria (Evolution UI)
         DORO blocks on Bolt for balance testing

Phase 3: Bolt (Heroes + Formations) → Nova (Tech tree + Weather)
         Aria depends on Bolt for hero hotbar data

Phase 4: All Phase 3 complete → Luna + Pixel (Final art) → Bolt (Particles + Camera)
         DORO runs 1000-game bot simulation after art is integrated

Phase 5: Phase 4 complete → Bolt (Campaign + Bosses) + Nova (Survival + Save)
         Aria (Campaign/Survival UI) depends on manager APIs

Phase 6: Phase 2+ complete → Turbo (Server) + Bolt (Server simulation)
         Vault depends on Turbo for security audit
         Nova (Client netcode) depends on Turbo's protocol spec

Phase 7: Phase 5+ → Aria (Menus + Tutorial) + Nova (Achievements + i18n)
         Atlas depends on Turbo for analytics pipeline
         DORO final balance requires all Phase 6 data
```
