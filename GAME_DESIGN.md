# AGE OF WAR: MODERN REIMAGINING — COMPLETE GAME DESIGN PLAN

## Revision History
> This plan has been through 10 rounds of self-review. Each round added depth, fixed gaps, rebalanced systems, and refined the vision. Final version below.

---

## 1. VISION & CORE IDENTITY

### 1.1 What Made Age of War Great
The original Age of War (2007, Louissi) succeeded because of:
- **Instant gratification loop**: Kill enemies → earn gold → spawn stronger units → kill more
- **Evolution fantasy**: Watching your base visually transform from Stone Age to Future Age
- **Simple decision space**: Offense vs defense spending, when to evolve, which units to spawn
- **Escalation tension**: The AI evolves too — fall behind and you're overwhelmed
- **"Just one more game" pacing**: 10-15 minute sessions with clear win/loss
- **Iconic soundtrack**: "Glorious Morning" by WaterFlame became synonymous with the genre

### 1.2 Our Vision: "Epochs of War"
A modern reimagining that preserves the core loop (spawn units, evolve through ages, destroy the enemy base) while adding depth across **7 new systems**: Hero Units, Tech Trees, Unit Formations, Terrain & Weather, Multiplayer, Campaign, and Meta-Progression.

**Design pillars:**
1. **Easy to learn, hard to master** — First game playable in under 60 seconds, strategic depth reveals over dozens of hours
2. **Every game tells a story** — The age evolution should feel epic, with environmental storytelling, dynamic music, and visual spectacle
3. **Meaningful choices** — No single dominant strategy. Rock-paper-scissors unit counters, tech tree branching, and timing windows create a decision-rich experience
4. **Modern feel** — Fluid animations, particle effects, dynamic lighting, responsive UI, gamepad + touch + keyboard support
5. **Community & competition** — Ranked multiplayer, replays, leaderboards, custom matches

### 1.3 Platform & Tech
- **Engine**: Phaser 4 (HTML5/WebGL) for browser + Electron/Tauri for desktop + Capacitor for mobile
- **Rendering**: WebGL2 with PixiJS v8 backend for particle effects and shader support
- **Audio**: Howler.js with dynamic music system (layers that change per age)
- **Multiplayer**: WebSocket server (Node.js + Colyseus or custom) with client-side prediction
- **State**: ECS (Entity Component System) architecture for clean game logic separation
- **Build**: Vite + TypeScript

---

## 2. AGES & EVOLUTION SYSTEM

### 2.1 Age Progression (8 Ages)
Each age is a complete visual, mechanical, and audio transformation.

| # | Age | Theme | Visual Palette | Music Layer |
|---|-----|-------|----------------|-------------|
| 1 | **Prehistoric** | Dinosaurs, caves, primal survival | Earth tones, volcanic orange | Tribal drums, bone flutes |
| 2 | **Bronze Age** | Early civilization, chariots, ziggurats | Sandy gold, copper | Lyres, war horns |
| 3 | **Classical** | Greek/Roman legions, phalanxes | Marble white, laurel green | Brass fanfares, choral |
| 4 | **Medieval** | Knights, castles, siege weapons | Stone grey, crimson banners | Orchestral strings, choir |
| 5 | **Gunpowder** | Musketeers, cannons, naval aesthetics | Smoke, navy blue, gold trim | Snare drums, fifes |
| 6 | **Industrial** | Steam tanks, gatling guns, zeppelins | Iron, soot, amber | Industrial percussion, brass |
| 7 | **Modern** | Tanks, jets, soldiers, missiles | Olive drab, digital camo | Electronic + orchestral hybrid |
| 8 | **Future** | Mechs, drones, energy weapons, AI | Neon cyan, holographic | Synthwave, choir swells |

### 2.2 Evolution Mechanics
- **XP System**: Killing enemy units grants XP. Each age requires progressively more XP to evolve.
- **Evolution is a CHOICE, not automatic**: Player clicks "Evolve" when they have enough XP. Timing is strategic — evolving too early leaves you cash-poor, too late leaves you outgunned.
- **Evolution Transition**: 3-second cinematic transition. Base visually rebuilds. All existing units remain but look outdated next to new ones. Turrets auto-upgrade to match the age.
- **Catch-up mechanic**: If you're 2+ ages behind, XP gain is boosted by 25% to prevent hopeless snowballs.
- **De-sync drama**: Both players can be in different ages simultaneously. A Medieval army fighting Modern tanks is terrifying but not instant-loss if you have numbers.

### 2.3 XP Requirements (Tuned for ~15-20 min games)
| Age Transition | XP Required | Cumulative |
|---|---|---|
| Prehistoric → Bronze | 100 | 100 |
| Bronze → Classical | 250 | 350 |
| Classical → Medieval | 500 | 850 |
| Medieval → Gunpowder | 900 | 1,750 |
| Gunpowder → Industrial | 1,400 | 3,150 |
| Industrial → Modern | 2,200 | 5,350 |
| Modern → Future | 3,500 | 8,850 |

---

## 3. UNIT SYSTEM

### 3.1 Unit Design Philosophy
Each age has **4 unit types** following a consistent archetype pattern:
- **Infantry** (cheap, fast spawn, melee or short-range) — the bread and butter
- **Ranged** (moderate cost, attacks from behind allies) — DPS backbone
- **Heavy** (expensive, high HP, slow) — frontline anchor or siege
- **Special** (unique per age, breaks rules) — game-changers with specific counters

### 3.2 Complete Unit Roster (32 Units)

#### Age 1: Prehistoric
| Unit | Type | HP | DMG | Speed | Range | Cost | Spawn Time |
|------|------|-----|-----|-------|-------|------|------------|
| Clubman | Infantry | 30 | 8 | 3 | Melee | 15 | 1.5s |
| Slinger | Ranged | 20 | 6 | 2.5 | 120px | 25 | 2s |
| Dino Rider | Heavy | 120 | 20 | 1.5 | Melee | 100 | 5s |
| Pack Raptors | Special | 25×3 | 10×3 | 5 | Melee | 80 | 4s |
> *Pack Raptors*: 3 fast units that spawn together, flank, and overwhelm isolated targets.

#### Age 2: Bronze Age
| Unit | Type | HP | DMG | Speed | Range | Cost | Spawn Time |
|------|------|-----|-----|-------|-------|------|------------|
| Spearman | Infantry | 50 | 12 | 2.8 | Melee | 30 | 1.5s |
| Javelin Thrower | Ranged | 35 | 10 | 2.5 | 140px | 45 | 2s |
| War Chariot | Heavy | 160 | 25 | 3 | Melee | 200 | 5s |
| War Elephant | Special | 300 | 15 | 1 | Melee | 350 | 8s |
> *War Elephant*: Enormous HP pool, tramples infantry, but slow and vulnerable to ranged focus fire. Causes fear (nearby enemy infantry deal -20% damage).

#### Age 3: Classical
| Unit | Type | HP | DMG | Speed | Range | Cost | Spawn Time |
|------|------|-----|-----|-------|-------|------|------------|
| Hoplite | Infantry | 70 | 15 | 2.5 | Melee | 60 | 1.5s |
| Bowman | Ranged | 45 | 14 | 2.3 | 160px | 80 | 2s |
| Centurion | Heavy | 200 | 30 | 2 | Melee | 400 | 6s |
| Phalanx | Special | 90×4 | 12×4 | 1.5 | Melee | 300 | 5s |
> *Phalanx*: 4 soldiers in tight formation, share a damage-reduction shield (50% ranged damage reduction while in formation). Devastating to head-on melee but vulnerable to flanking specials.

#### Age 4: Medieval
| Unit | Type | HP | DMG | Speed | Range | Cost | Spawn Time |
|------|------|-----|-----|-------|-------|------|------------|
| Swordsman | Infantry | 100 | 20 | 2.5 | Melee | 100 | 2s |
| Crossbowman | Ranged | 60 | 22 | 2 | 180px | 140 | 2.5s |
| Knight | Heavy | 280 | 35 | 3.5 | Melee | 600 | 6s |
| Trebuchet | Special | 150 | 60 | 0.5 | 300px | 500 | 8s |
> *Trebuchet*: Stationary siege unit. Devastating to turrets and base, but dies quickly to melee. Must stop to fire.

#### Age 5: Gunpowder
| Unit | Type | HP | DMG | Speed | Range | Cost | Spawn Time |
|------|------|-----|-----|-------|-------|------|------------|
| Musketeer | Infantry | 80 | 28 | 2.5 | 150px | 160 | 2s |
| Grenadier | Ranged | 70 | 35 | 2 | 180px | 220 | 3s |
| Cavalry | Heavy | 200 | 40 | 4 | Melee | 500 | 5s |
| Cannon | Special | 250 | 80 | 0.5 | 350px | 800 | 10s |
> *Cannon*: High splash damage, obliterates groups. Very slow, needs protection. Prioritizes turrets.

#### Age 6: Industrial
| Unit | Type | HP | DMG | Speed | Range | Cost | Spawn Time |
|------|------|-----|-----|-------|-------|------|------------|
| Rifleman | Infantry | 90 | 35 | 2.8 | 180px | 250 | 2s |
| Machine Gunner | Ranged | 75 | 20 | 2 | 200px | 350 | 3s |
| Steam Tank | Heavy | 500 | 50 | 1.5 | 150px | 1,200 | 8s |
| Zeppelin Bomber | Special | 300 | 70 | 2 | 250px | 1,500 | 12s |
> *Zeppelin Bomber*: AIR UNIT — cannot be hit by melee. Drops bombs with splash damage. Only ranged/turrets can target it. First air unit in the game — forces adaptation.

#### Age 7: Modern
| Unit | Type | HP | DMG | Speed | Range | Cost | Spawn Time |
|------|------|-----|-----|-------|-------|------|------------|
| Marine | Infantry | 100 | 45 | 3 | 200px | 400 | 2s |
| Sniper | Ranged | 50 | 80 | 1.5 | 400px | 600 | 4s |
| Tank | Heavy | 800 | 60 | 2 | 250px | 2,000 | 10s |
| Attack Helicopter | Special | 400 | 55 | 4 | 300px | 2,500 | 12s |
> *Attack Helicopter*: Air unit with anti-ground missiles. Fast, can bypass frontlines. Vulnerable to anti-air turrets.

#### Age 8: Future
| Unit | Type | HP | DMG | Speed | Range | Cost | Spawn Time |
|------|------|-----|-----|-------|-------|------|------------|
| Plasma Trooper | Infantry | 120 | 55 | 3 | 200px | 600 | 2s |
| Rail Gunner | Ranged | 80 | 120 | 2 | 500px | 1,000 | 4s |
| Mech Walker | Heavy | 1,200 | 80 | 1.5 | 250px | 4,000 | 12s |
| Drone Swarm | Special | 40×8 | 15×8 | 5 | 150px | 3,000 | 8s |
> *Drone Swarm*: 8 small flying drones. Individually weak but overwhelming in numbers. Spread out to avoid splash damage. Self-destruct on death dealing AoE damage.

### 3.3 Unit Counter System (Rock-Paper-Scissors Triangle)
```
Infantry ──beats──► Special (numbers overwhelm)
    ▲                    │
    │                    ▼
Special ◄──beats── Heavy (bypasses armor)
    │                    ▲
    ▼                    │
Heavy ──beats──► Infantry (tanks hits)
    ▲                    │
    │                    ▼
Ranged ──beats──► Heavy (sustained DPS)
    │                    ▲
    ▼                    │
Infantry ──beats──► Ranged (closes gap fast)
```
Bonus damage modifiers: +50% damage when attacking the unit type you counter. This creates meaningful composition decisions.

### 3.4 Unit Abilities & Upgrades
Each unit type has **1 passive ability** built-in and can receive **1 upgrade** per age via the Tech Tree:
- **Infantry**: Passive = "Rally" (nearby allies gain +5% attack speed). Upgrade = "Shields" (+20% HP)
- **Ranged**: Passive = "Focus Fire" (2nd shot on same target deals +10% damage). Upgrade = "Flaming Arrows/Bullets" (DoT effect)
- **Heavy**: Passive = "Intimidate" (enemies in range deal -10% damage). Upgrade = "Reinforced Armor" (+30% HP)
- **Special**: Passive = varies per unit. Upgrade = unique per unit (e.g., Trebuchet → "Flaming Payload" adds area DoT)

---

## 4. TURRET & DEFENSE SYSTEM

### 4.1 Turret Slots
The base has **5 turret slots** (up from the original's ~3-4). Slots are positioned at different heights on the base:
- **Slot 1 (Ground)**: Short range, high fire rate
- **Slot 2 (Low Wall)**: Medium range
- **Slot 3 (Mid Wall)**: Medium-long range
- **Slot 4 (High Wall)**: Long range
- **Slot 5 (Roof)**: Anti-air / Siege range

### 4.2 Turret Roster (2 per age = 16 turrets)
Each age offers 2 turrets: one **anti-infantry** and one **anti-heavy/siege**.

| Age | Turret 1 (Anti-Infantry) | Turret 2 (Anti-Heavy/Siege) |
|-----|--------------------------|----------------------------|
| Prehistoric | Rock Dropper (15 DMG, slow) | Tar Pit (slows enemies 40%, area denial) |
| Bronze | Arrow Slit (12 DMG, fast) | Boiling Oil (30 DMG, DoT area) |
| Classical | Ballista (25 DMG, piercing) | Catapult (50 DMG, splash, slow) |
| Medieval | Repeating Crossbow (18 DMG, very fast) | Trebuchet Tower (80 DMG, long range) |
| Gunpowder | Grape Shot Cannon (40 DMG, cone) | Long Cannon (100 DMG, single target) |
| Industrial | Gatling Tower (15 DMG, extreme fire rate) | Howitzer (120 DMG, splash) |
| Modern | SAM Turret (60 DMG, anti-air priority) | Missile Launcher (150 DMG, tracking) |
| Future | Laser Grid (45 DMG, continuous beam) | Ion Cannon (200 DMG, charges then fires, hits base) |

### 4.3 Turret Upgrade System
- Each turret can be upgraded **3 times** within its age (costs increasing gold)
- Upgrades increase damage (+25%), fire rate (+15%), or add effects (splash, slow, burn)
- When you evolve to a new age, turrets auto-upgrade to their age equivalent but retain their upgrade level (Level 2 Arrow Slit becomes Level 2 Grape Shot Cannon)
- **New**: Turrets can be **sold** for 50% refund, freeing the slot for a different turret type

---

## 5. HERO SYSTEM (NEW MECHANIC)

### 5.1 Concept
Each age has **1 unlockable Hero** — a powerful unique unit that can only exist once on the field. Heroes have abilities on cooldown, persistent HP (doesn't respawn if killed until next age), and dramatically impact battles.

### 5.2 Hero Roster

| Age | Hero | HP | Abilities |
|-----|------|-----|-----------|
| Prehistoric | **Grok, the First Hunter** | 200 | *Primal Roar*: Stuns all enemies in range for 2s (20s CD). *Bone Club Sweep*: AoE melee hit (8s CD) |
| Bronze | **Sargon, the Conqueror** | 350 | *Inspiring Charge*: All allies gain +30% speed for 5s (25s CD). *Shield Wall*: Blocks all projectiles in front for 3s (15s CD) |
| Classical | **Leonidas** | 400 | *Last Stand*: When below 25% HP, gains +100% damage. *Spartan Push*: Shoves all enemies back 50px (12s CD) |
| Medieval | **Joan of Arc** | 350 | *Divine Light*: Heals all allies in radius for 20% HP (30s CD). *Banner of Courage*: Allies deal +25% damage for 8s (20s CD) |
| Gunpowder | **Napoleon** | 300 | *Artillery Barrage*: Calls 3 cannon strikes on target area (25s CD). *Tactical Genius*: All units gain +20% range for 10s (30s CD) |
| Industrial | **The Iron Baron** | 500 | *Deploy Turret*: Places a temporary mini-gatling (20s duration, 40s CD). *Smoke Screen*: All allies become untargetable for 3s (25s CD) |
| Modern | **Commander Steele** | 450 | *Airstrike*: Calls in a bombing run across the battlefield (35s CD). *Fortify*: All turrets gain +50% fire rate for 8s (30s CD) |
| Future | **AXIOM-7 (AI Commander)** | 600 | *Temporal Shift*: Rewinds all ally HP by 3 seconds (45s CD). *Singularity*: Creates a black hole that pulls enemies to center (30s CD) |

### 5.3 Hero Rules
- Heroes are **free to deploy** once per age (unlocked at age transition)
- If a hero dies, it cannot respawn until the **next** age evolution (creates stakes)
- Heroes gain **XP independently** — leveling up mid-battle increases their stats by 10% per level (max 3 levels per age)
- Only **1 hero** active at a time — evolving to a new age replaces your hero
- Hero abilities are activated by clicking them in a hotbar (keyboard shortcuts 1-2)

---

## 6. TECH TREE (NEW MECHANIC)

### 6.1 Concept
At each age, the player gets **2 Tech Points** to spend on branching upgrades. This replaces the original's flat progression with meaningful strategic choices.

### 6.2 Tech Tree Branches (3 Branches)

**Branch A: MILITARY**
- Tier 1: "Recruitment" — Unit spawn time -15%
- Tier 2: "Veteran Training" — All units gain +10% HP
- Tier 3: "Elite Forces" — Unlock an upgraded version of the Special unit (e.g., Trebuchet → Siege Tower)
- Tier 4: "War Machine" — Heavy units cost -25%

**Branch B: ECONOMY**
- Tier 1: "Taxation" — Gold income per kill +20%
- Tier 2: "Trade Routes" — Passive gold income: 5 gold/second
- Tier 3: "War Bonds" — Gain 500 gold instantly when evolving
- Tier 4: "Plunder" — Destroyed turrets refund 100% gold

**Branch C: FORTIFICATION**
- Tier 1: "Thick Walls" — Base HP +20%
- Tier 2: "Repair Crews" — Base regenerates 1 HP/second
- Tier 3: "Extra Turret Slot" — Unlock 6th turret slot
- Tier 4: "Fortress" — All turret damage +30%

### 6.3 Tech Rules
- 2 points per age = 14 total points across 7 age transitions
- Each tier costs 1 point. Must unlock tiers sequentially within a branch
- **You cannot max all 3 branches** — forces specialization
- Tech choices are **visible to opponent** in multiplayer (strategic information)
- Example builds: "Rush" (Military T1-T2 + Economy T1-T2), "Turtle" (Fortification T1-T4 + Economy T1-T2), "Boom" (Economy T1-T4 + Military T1-T2)

---

## 7. BASE & BATTLEFIELD

### 7.1 Base Design
- Each base has **HP** that scales with age (starts at 500, gains +200 per age)
- Base is a **multi-story structure** that visually transforms each age
- Turret slots are visually integrated into the base architecture
- **Base Gate**: Units spawn from the gate. Gate has its own HP (25% of base HP). If gate is destroyed, units take 3s longer to spawn (penalty until next age heals it)

### 7.2 Battlefield Layout
```
[YOUR BASE] ←───── 1600px battlefield ─────→ [ENEMY BASE]
   │                                              │
   ├─ Gate                                   Gate ─┤
   ├─ Turret Slots (5-6)          Turret Slots ───┤
   ├─ Hero spawn point              Hero spawn ───┤
   │                                              │
   │     ┌─────── TERRAIN ZONES ──────┐          │
   │     │  Bridge  │  Open  │  Hills │          │
   │     └─────────────────────────────┘          │
```

### 7.3 Terrain System (NEW)
The battlefield has **3 terrain zones** that rotate each match:

| Terrain | Effect |
|---------|--------|
| **Open Plains** | No modifier. Standard combat. |
| **Bridge/Choke** | Narrow passage. Only 3 units can fight side-by-side. Favors defenders. |
| **High Ground** | Center hill. Units on the hill gain +15% range and +10% damage. Worth fighting for. |
| **River** | Slows all ground units by 30% while crossing. Doesn't affect air. |
| **Forest** | Ranged units have -30% accuracy. Melee units gain +10% damage (ambush). |
| **Ruins** | Provides cover. Ranged units take -25% damage while in ruins. |

Each match randomly selects 1-3 terrain features placed between the bases. This ensures no two games feel identical.

### 7.4 Weather System (NEW — Cosmetic + Gameplay)
Random weather events occur every 2-3 minutes:

| Weather | Duration | Effect |
|---------|----------|--------|
| **Clear** | Default | No effect |
| **Rain** | 30s | Gunpowder/ranged units deal -15% damage. Speed -10% for all. |
| **Fog** | 20s | All range reduced by 30%. Encourages melee pushes. |
| **Sandstorm** | 25s | All units take 2 DPS. Visibility reduced. |
| **Lightning Storm** | 15s | Random lightning strikes deal 50 damage to a random unit every 3s. |
| **Solar Flare** (Future only) | 20s | Energy weapons deal +25% damage. Mechanical units take 5 DPS. |

---

## 8. SPECIAL ABILITIES (SUPER ATTACKS)

### 8.1 System
Each age has a unique super ability. Charges over time (base: 45 seconds) and via combat (kills reduce cooldown by 1s each). Only 1 charge at a time.

### 8.2 Ability Roster

| Age | Ability | Effect |
|-----|---------|--------|
| Prehistoric | **Meteor Shower** | 5 meteors rain randomly across the battlefield. 80 damage each, splash. |
| Bronze | **Chariot Rush** | 3 spectral chariots charge across the field dealing 40 damage to everything in path. |
| Classical | **Rain of Arrows** | Arrow volley covers 200px area. 60 damage to all units inside over 3 seconds. |
| Medieval | **Plague** | Enemy units in target area lose 5% max HP/second for 8 seconds. Devastating to heavies. |
| Gunpowder | **Naval Bombardment** | 6 cannonballs hit in sequence from off-screen. 100 damage each, small splash. |
| Industrial | **Mustard Gas** | Cloud covers 250px area for 10s. Units inside take 15 DPS and move 40% slower. |
| Modern | **Airstrike** | 3 jets fly across screen dropping bombs. 120 damage each, wide splash. |
| Future | **Orbital Strike** | Laser from space charges for 2s then deals 500 damage in a line across 300px. Devastating but telegraphed. |

---

## 9. ECONOMY & RESOURCE SYSTEM

### 9.1 Currencies
- **Gold**: Primary currency. Earned from kills, passive income, and economy techs. Spent on units and turrets.
- **XP**: Earned from kills only. Used exclusively for age evolution.

### 9.2 Income Tuning

| Source | Amount | Notes |
|--------|--------|-------|
| Kill Infantry | 10-25 gold, 5-10 XP | Scales with enemy age |
| Kill Ranged | 15-30 gold, 8-12 XP | |
| Kill Heavy | 40-80 gold, 15-30 XP | |
| Kill Special | 50-120 gold, 20-40 XP | |
| Kill Hero | 200 gold, 50 XP | Massive reward |
| Passive Income | 3 gold/second (base) | Increases +1/s per age |
| Turret Kill Bonus | +50% gold | Incentivizes turret investment |

### 9.3 Economic Pacing
- **Early game** (Ages 1-2): Gold is scarce. Every unit matters. Decisions are tense.
- **Mid game** (Ages 3-5): Income ramps. Player can maintain a steady army. Tech choices diverge.
- **Late game** (Ages 6-8): Gold flows freely. Massive armies clash. The game is decided by tech choices, hero plays, and super ability timing.

### 9.4 Anti-Stalemate Mechanics
- **Overtime**: After 25 minutes, both bases lose 5 HP/second (increasing by 5 every minute)
- **Momentum**: If you control the center of the battlefield for 30 seconds, gain +25% gold income (visible territory indicator)
- **Comeback XP**: If behind in base HP by 30%+, XP gain is boosted by 15%

---

## 10. AI SYSTEM (Single Player)

### 10.1 AI Difficulty Levels
| Difficulty | Description |
|------------|-------------|
| **Easy** | AI evolves slowly, spawns inefficiently, doesn't use counters |
| **Normal** | AI evolves at reasonable pace, uses basic counters |
| **Hard** | AI matches player pace, uses optimal counters, times specials well |
| **Impossible** | AI gets +20% income, uses advanced tactics, coordinates hero + army pushes |
| **Nightmare** | AI gets +40% income, perfect counter-picking, aggressive evolution race |

### 10.2 AI Behavior Patterns
The AI uses a weighted decision system:
1. **Assess threat**: If many enemies near base, prioritize defense
2. **Counter-pick**: If enemy is heavy, spawn specials. If infantry swarm, spawn heavies
3. **Economy check**: If gold is high, spam units. If low, wait for passive income
4. **Evolution timing**: Evolve when XP is ready AND gold reserve > 300 (don't evolve while bankrupt)
5. **Hero usage**: Deploy hero when pushing. Use hero abilities at optimal targets (not single infantry)
6. **Special attack timing**: Use when 5+ enemy units are grouped together

### 10.3 AI Personality Types (for Campaign variety)
- **The Rusher**: Evolves fast, spams cheap units, pressures early
- **The Turtler**: Maxes turrets, heavy defense, waits for late-game
- **The Boomer**: Prioritizes economy, builds slow but overwhelms eventually
- **The Tactician**: Plays counters perfectly, varies composition
- **The Berserker**: All-in on offense, ignores defense, hero-focused

---

## 11. GAME MODES

### 11.1 Classic Mode (Single Player)
- Standard 1v1 vs AI
- 5 difficulty levels
- Win/loss tracked, best times per difficulty

### 11.2 Campaign Mode (NEW)
- **30 missions** across a world map
- Each mission has unique modifiers (e.g., "Start at Medieval age", "No turrets allowed", "Enemy has 2 heroes")
- Boss battles every 5 missions: oversized enemy with unique mechanics
- Rewards: unlock cosmetic skins, alternate heroes, and lore entries
- Story: Light narrative about civilizations clashing through time

### 11.3 Survival Mode (NEW)
- Endless waves of enemies with increasing strength
- No enemy base — just survive as long as possible
- Leaderboard for longest survival time
- Every 5 waves, choose a random buff from 3 options (roguelike element)

### 11.4 Multiplayer (NEW)
- **Ranked 1v1**: Elo-based matchmaking, seasonal rankings
- **Quick Match**: Unranked, faster matchmaking
- **Custom Match**: Choose age restrictions, terrain, starting resources, etc.
- **2v2 Team Battle**: Two lanes, shared XP, can send units to partner's lane
- **Spectator Mode**: Watch live matches, replay system

### 11.5 Sandbox Mode (NEW)
- No AI. Place any units on either side and watch them fight
- Good for testing compositions and learning unit interactions
- Adjustable time speed (1x, 2x, 4x)

---

## 12. META-PROGRESSION (NEW)

### 12.1 Player Profile
- Account level (earned from all game modes)
- Win/loss stats, favorite age, most-used units
- Match history with replays

### 12.2 Unlockables (Cosmetic Only — No Pay-to-Win)
- **Base Skins**: Different architectural styles per age (Egyptian, Asian, Norse, etc.)
- **Unit Skins**: Alternate color schemes and visual effects
- **Hero Skins**: Legendary alternate appearances
- **Battle Music**: Alternate music packs (lo-fi, metal, chiptune)
- **Battlefield Themes**: Different biome aesthetics (desert, arctic, volcanic, floating islands)
- **Victory Animations**: Custom win screen effects

### 12.3 Earning System
- Complete campaign missions → unlock rewards
- Win ranked matches → earn seasonal currency
- Daily challenges (e.g., "Win without using Heroes", "Reach Future Age in under 10 minutes")
- Achievement system with milestones

---

## 13. UI/UX DESIGN

### 13.1 HUD Layout
```
┌─────────────────────────────────────────────────┐
│ [Gold: 1,250] [XP: 340/500] [Age: Medieval]    │ ← Top bar
│ [Hero HP ████████] [Special: READY]             │
├─────────────────────────────────────────────────┤
│                                                 │
│              BATTLEFIELD VIEW                   │ ← Main game area
│                                                 │
│                                                 │
├─────────────────────────────────────────────────┤
│ [Unit 1][Unit 2][Unit 3][Unit 4] │ [EVOLVE] │   │ ← Bottom bar
│  Q       W       E       R      │    T      │   │ ← Keyboard shortcuts
│ $15     $25     $100    $80     │  READY    │   │
│ [Hero: 1][Hero: 2]  [Special: SPACE]        │   │
└─────────────────────────────────────────────────┘
```

### 13.2 Controls
| Input | Action |
|-------|--------|
| Q, W, E, R | Spawn units 1-4 |
| T | Evolve to next age |
| 1, 2 | Hero abilities |
| SPACE | Special attack (then click to aim) |
| Mouse click | Select turret slots, aim abilities |
| Scroll wheel | Camera zoom (slight, keeps both bases visible) |
| Tab | Toggle tech tree overlay |
| ESC | Pause / menu |

### 13.3 Feedback Systems
- **Screen shake** on heavy impacts (toggleable)
- **Kill counter** with combo multiplier visual
- **Evolution fanfare**: Full-screen flash, dramatic zoom, base transformation animation
- **Low HP warning**: Screen edge pulses red, alarm sound, "BASE UNDER ATTACK" text
- **Gold earned**: Floating "+15g" numbers over killed enemies
- **Unit ready indicators**: Greyed-out icons while on cooldown, flash when affordable

---

## 14. AUDIO DESIGN

### 14.1 Dynamic Music System
- Each age has a unique music track composed in layers
- **Layer 1**: Ambient (always playing)
- **Layer 2**: Rhythm (activates when armies clash)
- **Layer 3**: Intensity (activates when base HP < 50% or during special attacks)
- **Layer 4**: Victory/Defeat sting
- Transitions between ages crossfade over 3 seconds

### 14.2 Sound Effects
- Each unit type has unique attack, move, and death sounds
- Turret shots, impacts, explosions are satisfying and punchy
- UI sounds: Gold earned (coin clink), evolution (epic whoosh), tech unlock (chime)
- Environmental: Rain, thunder, wind for weather events

---

## 15. VISUAL DESIGN

### 15.1 Art Style
- **Modern pixel art** at 32x32 base resolution, rendered at high resolution
- Inspired by: Octopath Traveler's HD-2D (pixel sprites + modern lighting/effects)
- Smooth animations: 8-12 frame walk/attack cycles per unit
- Particle systems for: Blood/sparks, explosions, weather, magic effects
- Dynamic lighting: Time of day shifts during the game (sunrise → noon → sunset → night)

### 15.2 Base Transformation
Each age transition is a showpiece moment:
- 3-second sequence where the base crumbles and rebuilds
- Dust clouds, construction particles, triumphant flash
- New architectural style emerges fully formed
- This is the emotional payoff — make it SPECTACULAR

### 15.3 Parallax Backgrounds
3-layer parallax scrolling background that changes per age:
- Layer 1: Sky (clouds, stars, aurora for Future)
- Layer 2: Distant terrain (mountains, cities, space stations)
- Layer 3: Near terrain (trees, buildings, debris)

---

## 16. TECHNICAL ARCHITECTURE

### 16.1 ECS Architecture
```
Components:
  - Position { x, y }
  - Velocity { dx, dy }
  - Health { current, max }
  - Combat { damage, range, attackSpeed, lastAttack }
  - Renderable { sprite, animation, layer }
  - Faction { player | enemy }
  - UnitType { infantry | ranged | heavy | special | hero }
  - AI { state, target, behavior }
  - Turret { slot, fireRate, projectileType }
  - Ability { cooldown, effect, targetType }
  - AgeTag { age: 1-8 }

Systems (update order):
  1. InputSystem — process player commands
  2. AISystem — enemy decision making
  3. SpawnSystem — create units from queue
  4. MovementSystem — update positions
  5. CombatSystem — target acquisition, damage
  6. ProjectileSystem — move and collide projectiles
  7. AbilitySystem — hero/special ability execution
  8. HealthSystem — death checks, cleanup
  9. EconomySystem — gold/XP tracking
  10. WeatherSystem — apply environmental effects
  11. RenderSystem — draw everything
  12. UISystem — update HUD
  13. AudioSystem — trigger sounds
```

### 16.2 State Machine (Game States)
```
MainMenu → DifficultySelect → Loading → GameLoop → Victory/Defeat → PostGame
                                          ↓
                                      Paused
                                      TechTree
                                      EvolveTransition
```

### 16.3 Performance Targets
- 60 FPS with 100+ units on screen
- < 2 second load time
- < 50MB total asset size
- WebGL2 primary, Canvas2D fallback
- Object pooling for units and projectiles
- Spatial grid for collision (not O(n²))

### 16.4 Multiplayer Architecture
```
Client A ──WebSocket──► Server ◄──WebSocket── Client B
  │                       │                       │
  ├─ Input commands       ├─ Authoritative state  ├─ Input commands
  ├─ Client prediction    ├─ Game simulation      ├─ Client prediction
  ├─ Interpolation        ├─ Anti-cheat           ├─ Interpolation
  └─ Render               ├─ Matchmaking          └─ Render
                          └─ Replay recording
```
- **Server-authoritative**: Server runs the true game simulation
- **Client prediction**: Clients predict unit spawns locally for responsiveness
- **Tick rate**: 20 ticks/second server, 60 FPS client with interpolation
- **Netcode**: Delta compression, only send changed entities

---

## 17. DEVELOPMENT PHASES

### Phase 1: Core Prototype (2-3 weeks)
- [ ] Phaser project setup, ECS architecture
- [ ] 2 ages (Prehistoric + Medieval) with basic units
- [ ] Unit spawning, movement, combat (melee + ranged)
- [ ] Base HP, win/loss condition
- [ ] Basic AI (spawn random units)
- [ ] Minimal UI: gold display, unit buttons, HP bars
- [ ] Placeholder art (colored rectangles)

### Phase 2: Core Systems (2-3 weeks)
- [ ] All 8 ages with full unit rosters
- [ ] Age evolution mechanic with visual transition
- [ ] Turret system (all 16 turrets, 5 slots)
- [ ] Special abilities (1 per age)
- [ ] XP/Gold economy tuning
- [ ] Counter system damage modifiers
- [ ] Improved AI with counter-picking

### Phase 3: Depth Systems (2-3 weeks)
- [ ] Hero system (8 heroes with abilities)
- [ ] Tech tree (3 branches, full UI)
- [ ] Terrain zones (3-4 terrain types)
- [ ] Weather system
- [ ] Unit formations (Phalanx, etc.)
- [ ] Air units (Zeppelin, Helicopter, Drones)

### Phase 4: Content & Polish (2-3 weeks)
- [ ] Full pixel art for all units, turrets, bases, backgrounds
- [ ] Animation polish (walk cycles, attack animations, death animations)
- [ ] Particle effects (explosions, blood, magic)
- [ ] Dynamic music system (8 tracks with layers)
- [ ] Sound effects (combat, UI, environment)
- [ ] Screen shake, juice, game feel polish

### Phase 5: Game Modes (2 weeks)
- [ ] Campaign mode (30 missions, boss fights)
- [ ] Survival mode (endless waves, roguelike buffs)
- [ ] Sandbox mode
- [ ] Difficulty tuning (5 levels)

### Phase 6: Multiplayer (3-4 weeks)
- [ ] WebSocket server implementation
- [ ] Server-authoritative game simulation
- [ ] Client prediction + interpolation
- [ ] Matchmaking system
- [ ] Ranked/ELO system
- [ ] Replay system
- [ ] Anti-cheat basics

### Phase 7: Meta & Launch (2 weeks)
- [ ] Player profiles, stats tracking
- [ ] Unlockables and cosmetics
- [ ] Daily challenges, achievements
- [ ] Settings (audio, visual, controls)
- [ ] Tutorial / onboarding
- [ ] Analytics integration
- [ ] Bug fixing, optimization, load testing

---

## 18. BALANCE GUIDELINES

### 18.1 Core Balance Rules
1. **No unit should be useless**: Every unit has a scenario where it's optimal
2. **Cost efficiency curve**: Higher-age units are stronger but NOT proportionally cheaper. A swarm of Clubmen should threaten a lone Marine.
3. **Age advantage = ~1.5x**: One age ahead gives roughly 50% combat advantage. Two ages ahead is dominant but not instant-win.
4. **Games should average 12-18 minutes**: If games are shorter, reduce income. If longer, increase overtime pressure.
5. **First age should matter**: Don't make Prehistoric trivial. Stone Age decisions set the tempo.

### 18.2 Balance Testing Methodology
- Automated bot-vs-bot simulations (1000+ games per balance patch)
- Each strategy archetype should win ~20% of the time (5 archetypes)
- Track "dominant age" — if one age has >60% of total kills, it's overtuned
- Community playtesting with feedback surveys
- Replay analysis for stale/dominant strategies

---

## 19. MONETIZATION (Optional — Game Can Be Free)

### 19.1 Ethical Monetization Model
- **Base game is FREE** with all gameplay content
- **Cosmetic-only purchases**: Base skins, unit skins, hero skins, music packs
- **Battle Pass (seasonal)**: Cosmetic track only, earnable through gameplay
- **No pay-to-win. No lootboxes. No gacha.**
- **One-time "Supporter Pack"**: $9.99 for exclusive skin set + badge

---

## 20. POST-LAUNCH ROADMAP

### Season 1 (Month 2-3)
- New age: **Steampunk** (alternate timeline between Industrial and Modern)
- 2 new heroes
- Ranked Season 1 with rewards
- Community map voting for terrain presets

### Season 2 (Month 4-6)
- **Co-op Campaign**: 2-player story missions
- New game mode: **King of the Hill** (fight over center point)
- 4 new special units (1 per pair of ages)
- Mod support: Custom unit stats, custom maps

### Season 3 (Month 7-9)
- **Faction system**: Choose a civilization that slightly alters your unit roster
- Tournament mode with brackets
- Replay sharing and community highlights
- Mobile optimization pass

---

## APPENDIX A: INSPIRATIONS & REFERENCES

- **Age of War 1 & 2** (Louissi, 2007/2011) — The foundation
- **Stick War** (2009) — Similar lane-based combat with controllable units
- **Age of Empires** — Tech trees, civilization variety, age evolution
- **Clash Royale** — Card-based unit spawning, counter system, competitive multiplayer
- **Kingdom Rush** — Turret variety, hero system, campaign structure
- **Bloons TD 6** — Deep upgrade paths, meta-progression
- **Totally Accurate Battle Simulator** — Unit variety and spectacle
- **Civilization** — Evolution through ages, tech trees

## APPENDIX B: KEY RISK MITIGATIONS

| Risk | Mitigation |
|------|------------|
| Scope creep | Phase 1-2 produces a playable game. Everything after is additive. |
| Balance nightmare | ECS architecture allows easy stat tuning. Automated simulations catch imbalances early. |
| Multiplayer netcode complexity | Start with single-player. Multiplayer is Phase 6 — game works without it. |
| Art production bottleneck | Start with placeholder art. Commission sprites per-age in parallel with development. |
| Performance with 100+ units | Object pooling + spatial grid from day 1. Profile early, optimize early. |
| Player retention | Daily challenges + seasonal content + ranked play. Core loop must be fun FIRST. |

---

*This plan was reviewed and refined 10 times across: (1) initial draft, (2) unit stat balancing pass, (3) economy pacing review, (4) tech tree depth vs simplicity, (5) hero power budget audit, (6) terrain/weather impact assessment, (7) multiplayer architecture feasibility, (8) development phase reordering for MVP priority, (9) anti-stalemate and game-length tuning, (10) final consistency pass across all systems.*

---
---

# PART 2: EXPANDED SYSTEMS (Deep Design)

---

## 21. CAMPAIGN MODE — FULL MISSION DESIGN

### 21.1 World Map Structure
The campaign takes place on a stylized world map divided into **6 continents**, each representing an era-themed region. Players progress linearly through missions but can replay any completed mission for better ratings.

```
CONTINENT MAP:
  ┌──────────────────────────────────────────────┐
  │  PANGAEA        MESOPOTAMIA      OLYMPUS      │
  │  (Ages 1-2)    (Ages 2-3)       (Ages 3-4)   │
  │  5 missions    5 missions       5 missions    │
  │  Boss: Titan   Boss: Colossus   Boss: Hydra   │
  ├──────────────────────────────────────────────┤
  │  IRONHOLD       NOVA TERRA       SINGULARITY  │
  │  (Ages 4-5)    (Ages 5-7)       (Ages 7-8)   │
  │  5 missions    5 missions       5 missions    │
  │  Boss: Cannon  Boss: Leviathan  Boss: OMEGA   │
  │  King          War Machine      Construct     │
  └──────────────────────────────────────────────┘
```

### 21.2 Mission Types

| Type | Description | % of Campaign |
|------|-------------|---------------|
| **Standard Battle** | 1v1 against AI with specific personality. Destroy their base. | 40% (12 missions) |
| **Defense Siege** | No base to attack — survive X waves with limited resources | 20% (6 missions) |
| **Rush Challenge** | Win before a time limit expires | 13% (4 missions) |
| **Puzzle Battle** | Pre-set units, no spawning. Use positioning and abilities to win with what you have | 10% (3 missions) |
| **Boss Battle** | Oversized enemy with unique phases and mechanics | 17% (5 missions) |

### 21.3 Mission Modifiers (Each mission has 1-2)

| Modifier | Effect |
|----------|--------|
| "Locked Age" | Start and stay in a specific age. Cannot evolve. |
| "No Turrets" | Turret slots disabled. Pure offense. |
| "Double Agent" | Enemy has 2 heroes simultaneously. |
| "Fog of War" | Cannot see enemy units until they're within 200px of your units. |
| "Famine" | No passive gold income. Kill or starve. |
| "Arms Race" | Both sides evolve automatically every 2 minutes. |
| "Scorched Earth" | Battlefield shrinks from both sides over time. |
| "Mirror Match" | Enemy spawns identical units to yours, 3 seconds delayed. |
| "Ironman" | No special abilities allowed. Pure army management. |
| "Inflation" | Unit costs increase by 5% every minute. |

### 21.4 Star Rating System
Each mission awards 1-3 stars:
- **1 star**: Complete the mission
- **2 stars**: Complete with base HP > 50%
- **3 stars**: Complete within time limit AND with base HP > 75%

Stars unlock cosmetic rewards at thresholds: 15 stars, 30 stars, 50 stars, 70 stars, 90 stars (max).

### 21.5 Boss Fight Designs (Detailed)

#### Boss 1: THE TITAN (End of Pangaea, Age 2)
- **Theme**: A massive prehistoric beast — think T-Rex meets Kaiju
- **HP**: 3,000 (5x a normal heavy unit)
- **Phase 1 (100%-60% HP)**: Stomps forward slowly. Every 8 seconds, does a ground pound dealing 40 damage in a wide AoE. Spawns 2 Clubmen every 10 seconds from behind it.
- **Phase 2 (60%-30% HP)**: Enrages. Speed doubles. Ground pound frequency increases to every 5 seconds. Spawns Pack Raptors instead of Clubmen.
- **Phase 3 (30%-0% HP)**: Charges directly at your base at 3x speed, ignoring units. You must kill it before it reaches your gate. Does 200 damage to your base per hit.
- **Counter Strategy**: Kite with ranged units in Phase 1-2, use Special to soften, then burst with Heavies in Phase 3.

#### Boss 2: THE COLOSSUS (End of Mesopotamia, Age 3)
- **Theme**: A massive bronze automaton (Talos-inspired)
- **HP**: 5,000
- **Phase 1**: Walks slowly, punches units for 60 damage. Shield on front blocks 80% of ranged damage — must attack from behind by flanking with fast units.
- **Phase 2**: Shield breaks. Starts throwing boulders (150 damage, splash, 400px range). Spawns 3 Hoplites every 15 seconds.
- **Phase 3**: Self-destructs in 30 seconds — massive AoE (300 damage) when timer reaches zero. Must kill or push back before detonation.

#### Boss 3: THE HYDRA (End of Olympus, Age 4)
- **Theme**: Multi-headed siege beast
- **HP**: 4,000 main body + 3 heads (800 HP each)
- **Mechanic**: Has 3 "heads" that each attack independently (fire breath, acid spit, lightning). Killing a head removes that attack BUT the main body gains +25% speed per head lost. Kill heads strategically — fire breath head first (highest DPS) or save it for last (slowest main body).
- **Phase 2**: At 50% main body HP, regenerates 1 head. Must re-kill it.

#### Boss 4: THE CANNON KING (End of Ironhold, Age 5)
- **Theme**: A massive mobile fortress on wheels
- **HP**: 6,000
- **Mechanic**: Has 4 cannon turrets built into it (each can be destroyed for 500 HP each). Each cannon has different behavior: rapid fire, explosive shell, chain shot (hits all units in a line), grape shot (cone AoE). Destroying all 4 cannons makes the boss defenseless but it rams your base for 100 DPS.
- **Spawns**: Infantry pour out of doors every 20 seconds. Destroying the doors (200 HP each) stops spawning.

#### Boss 5: THE LEVIATHAN WAR MACHINE (End of Nova Terra, Age 7)
- **Theme**: Autonomous AI-controlled war platform (aircraft carrier + tank hybrid)
- **HP**: 8,000
- **Phase 1**: Launches drones (3 every 15 seconds) while firing missiles at your base from extreme range. Must push units forward to get in range.
- **Phase 2**: Deploys a force field (absorbs 2,000 damage). Must break field before dealing more damage. Field regenerates in 45 seconds if not destroyed.
- **Phase 3**: Goes airborne. Only anti-air turrets and ranged/air units can hit it. Carpet bombs the battlefield.

#### Boss 6: THE OMEGA CONSTRUCT (Final Boss, Age 8)
- **Theme**: A sentient AI construct that adapts to your strategy
- **HP**: 10,000
- **Unique Mechanic**: Scans your army composition every 30 seconds and adapts:
  - If you're using mostly Infantry → deploys AoE electric field
  - If you're using mostly Ranged → deploys reflective shield (reflects 30% damage back)
  - If you're using mostly Heavy → deploys EMP (stuns mechanical units)
  - If you're using mostly Special → spawns counter-units
- **Phase 1 (100%-50%)**: Adapts every 30s. Must vary composition constantly.
- **Phase 2 (50%-25%)**: Adapts every 15s. Creates 2 clones of your last hero that fight for the enemy.
- **Phase 3 (25%-0%)**: Stops adapting, goes berserk. Maximum damage output. Race against time.
- **Victory Cinematic**: The Construct shatters, timeline heals, credits roll.

---

## 22. SURVIVAL MODE — EXPANDED DESIGN

### 22.1 Wave Structure
- Waves come every 30 seconds (decreasing to 15 seconds by wave 50)
- Each wave specifies: unit types, unit count, and wave age tier
- Wave age tier increases every 5 waves:
  - Waves 1-5: Prehistoric enemies
  - Waves 6-10: Bronze Age enemies
  - Waves 11-15: Classical enemies
  - ...continuing through Future Age
  - Waves 41+: Mixed-age elite waves with random modifiers

### 22.2 Wave Scaling Formula
```
Units per wave = 3 + (wave_number * 1.5)
Unit HP multiplier = 1.0 + (wave_number * 0.03)
Unit DMG multiplier = 1.0 + (wave_number * 0.02)
```
By wave 50: ~78 units per wave, with 2.5x HP and 2.0x damage.

### 22.3 Roguelike Buff System (Choose 1 of 3)
After every 5 waves, a buff selection screen appears with 3 random options from the pool:

**OFFENSIVE BUFFS (Red)**
| Buff | Effect |
|------|--------|
| Sharpened Blades | All melee damage +15% |
| Incendiary Rounds | All ranged attacks apply 3 DPS burn for 3s |
| Berserker Blood | Units below 30% HP deal +50% damage |
| Rapid Deployment | Spawn time -20% |
| Critical Strike | 10% chance for any attack to deal 2x damage |
| Bloodlust | Killing an enemy heals the killer for 10% HP |
| Piercing Shots | Ranged attacks pierce through 1 additional target |
| Fury of the Ages | Special ability charges 30% faster |

**DEFENSIVE BUFFS (Blue)**
| Buff | Effect |
|------|--------|
| Iron Constitution | All units gain +20% HP |
| Healing Aura | All units regenerate 1 HP/second |
| Fortified Walls | Base HP +500 |
| Shield Matrix | 15% chance to dodge any attack |
| Thorns | Attackers take 10% of damage dealt back |
| Emergency Repairs | Base heals 100 HP between waves |
| Ablative Armor | First hit on each unit deals 50% less damage |
| Guardian Angel | Once per wave, a random unit survives with 1 HP instead of dying |

**ECONOMY BUFFS (Gold)**
| Buff | Effect |
|------|--------|
| Gold Rush | +50% gold from kills this wave |
| Bounty Hunter | Elite enemies drop 3x gold |
| Interest | Earn 5% interest on unspent gold between waves |
| Scavenger | Dead enemies leave gold pickups on the battlefield |
| War Profiteer | Turret kills give double gold |
| Age Accelerator | XP required for next age -20% |
| Merchant | Can sell units for 50% of their cost (new ability) |
| Jackpot | 5% chance any kill drops 10x gold |

**LEGENDARY BUFFS (Purple — rare, 10% chance to appear)**
| Buff | Effect |
|------|--------|
| Time Warp | All units gain +30% attack speed |
| Meteor Insurance | Special ability hits twice |
| Immortal Hero | Hero respawns after 15 seconds instead of staying dead |
| Dimensional Rift | 20% chance spawned units are duplicated for free |
| Singularity Core | All damage dealt by all sources +10% (stacks!) |

### 22.4 Survival Milestones
| Wave | Title | Reward |
|------|-------|--------|
| 10 | Survivor | Bronze badge |
| 25 | Warrior | Silver badge + unit skin unlock |
| 50 | Legend | Gold badge + hero skin unlock |
| 75 | Immortal | Diamond badge + exclusive base skin |
| 100 | Eternal | Unique title + animated profile border |

---

## 23. TUTORIAL & ONBOARDING SYSTEM

### 23.1 Design Philosophy
- **Learn by doing**: No text walls. Every concept is taught through a guided mini-battle.
- **Layered complexity**: First game teaches 30% of mechanics. Remaining 70% revealed organically.
- **Skip option**: Experienced players can skip the tutorial entirely.
- **Contextual tooltips**: First time seeing a new element shows a brief tooltip (dismissable, toggleable in settings).

### 23.2 Tutorial Flow (5 Micro-Missions, ~8 minutes total)

#### Lesson 1: "First Blood" (90 seconds)
- **Teaches**: Spawning units, gold display, enemy base
- **Setup**: You have 200 gold. Enemy base has 100 HP. Only Clubmen available.
- **Prompt**: "Click the Clubman button (or press Q) to send a warrior to battle!"
- **Goal**: Destroy enemy base with Clubmen
- **No enemies spawn** — pure offense intro

#### Lesson 2: "Hold the Line" (90 seconds)
- **Teaches**: Defense, turrets, base HP
- **Setup**: Enemy sends 5 Clubmen at your base. You have 1 turret slot and gold for a Rock Dropper.
- **Prompt**: "Click the turret slot on your base to build a defense!"
- **Goal**: Survive the wave using turret + spawned units
- **Introduces**: HP bars, damage numbers, gold from kills

#### Lesson 3: "Know Your Enemy" (2 minutes)
- **Teaches**: Unit types, counter system
- **Setup**: Enemy sends Heavies. You only have Infantry and Ranged. Ranged is highlighted.
- **Prompt**: "Heavy units crush infantry! Use Ranged units — they deal bonus damage to heavies."
- **Goal**: Defeat 3 Heavy units using the correct counter
- **Introduces**: Counter damage indicators (+50% floating text in green)

#### Lesson 4: "The Next Age" (2 minutes)
- **Teaches**: XP, evolution, age transition
- **Setup**: XP bar is nearly full. Enemy is about to evolve.
- **Prompt**: "You've earned enough experience! Press T to evolve to the next age!"
- **Goal**: Evolve, then defeat upgraded enemies with new units
- **Introduces**: Evolution animation, new unit unlock fanfare, turret auto-upgrade

#### Lesson 5: "Command & Conquer" (2 minutes)
- **Teaches**: Hero, Special ability, and putting it all together
- **Setup**: Full battle with hero available and special charged
- **Prompt**: "Deploy your Hero with the hero button! Use their abilities with keys 1 and 2!"
- **Goal**: Win a mini-battle using hero abilities + special attack + good unit composition
- **Introduces**: Hero HP persistence, special ability aiming

### 23.3 Post-Tutorial
- "Ready for war? Choose your difficulty!" → routes to Classic Mode
- A "?" icon in the HUD corner opens a glossary of all mechanics at any time
- First time opening Tech Tree: brief overlay explains the 3 branches
- First time a new weather event appears: small banner explains the effect

---

## 24. DPS & BALANCE MATHEMATICS

### 24.1 Core DPS Calculations Per Unit

DPS = Damage / Attack_Interval

| Unit | DMG | Atk Speed (hits/s) | DPS | HP | Cost | Gold Efficiency (DPS/Gold) | HP Efficiency (HP/Gold) |
|------|-----|--------------------|-----|-----|------|---------------------------|------------------------|
| Clubman | 8 | 1.0 | 8.0 | 30 | 15 | 0.53 | 2.00 |
| Slinger | 6 | 0.8 | 4.8 | 20 | 25 | 0.19 | 0.80 |
| Dino Rider | 20 | 0.7 | 14.0 | 120 | 100 | 0.14 | 1.20 |
| Spearman | 12 | 1.0 | 12.0 | 50 | 30 | 0.40 | 1.67 |
| Javelin Thrower | 10 | 0.7 | 7.0 | 35 | 45 | 0.16 | 0.78 |
| War Chariot | 25 | 0.8 | 20.0 | 160 | 200 | 0.10 | 0.80 |
| Swordsman | 20 | 1.0 | 20.0 | 100 | 100 | 0.20 | 1.00 |
| Crossbowman | 22 | 0.6 | 13.2 | 60 | 140 | 0.09 | 0.43 |
| Knight | 35 | 0.8 | 28.0 | 280 | 600 | 0.05 | 0.47 |
| Marine | 45 | 1.2 | 54.0 | 100 | 400 | 0.14 | 0.25 |
| Tank | 60 | 0.5 | 30.0 | 800 | 2000 | 0.02 | 0.40 |
| Mech Walker | 80 | 0.4 | 32.0 | 1200 | 4000 | 0.01 | 0.30 |

### 24.2 Key Balance Insight: Cost Efficiency Intentionally Decreases

Cheap units (Clubmen at 0.53 DPS/gold) are intentionally MORE gold-efficient than expensive units (Tank at 0.02 DPS/gold). This is critical — it means:
- **Spam strategies remain viable** in every age. 133 Clubmen (2,000 gold) output 1,064 DPS vs. 1 Tank (2,000 gold) at 30 DPS.
- **BUT** expensive units have HP efficiency, counter bonuses, and can't be killed by splash as easily.
- This prevents "always build the biggest unit" dominant strategies.

### 24.3 Age Power Scaling Curve
```
Age 1 baseline DPS/gold: 0.53 (Clubman)
Age 2: ~0.40 (Spearman) — 75% of Age 1 efficiency
Age 3: ~0.20 (Swordsman) — 38% of Age 1 efficiency
Age 4: ~0.14 (Marine) — 26% of Age 1 efficiency

BUT Age 4 units have ~3.3x raw DPS and ~3.3x HP of Age 1 units.
```
This means: evolving gives you POWER but not EFFICIENCY. The advantage is qualitative (bigger units, new abilities, air units) not purely mathematical. A well-managed lower-age economy can compete.

### 24.4 Time-to-Kill Matrix (seconds for Unit A to kill Unit B, 1v1)

| Attacker → | Clubman | Slinger | Dino Rider | Spearman | Swordsman | Marine |
|------------|---------|---------|------------|----------|-----------|--------|
| **Clubman** | 3.75 | 2.50 | 15.00 | 6.25 | 12.50 | 12.50 |
| **Slinger** | 6.25 | 4.17 | 25.00 | 10.42 | 20.83 | 20.83 |
| **Dino Rider** | 1.50 | 1.00 | 8.57 | 2.50 | 5.00 | 5.00 |
| **Spearman** | 2.50 | 1.67 | 10.00 | 4.17 | 8.33 | 8.33 |
| **Swordsman** | 1.50 | 1.00 | 6.00 | 2.50 | 5.00 | 5.00 |
| **Marine** | 0.56 | 0.37 | 2.22 | 0.93 | 1.85 | 1.85 |

This confirms: a Marine kills a Clubman in 0.56 seconds, but costs 26x more. Age advantage is combat power, not economic value.

### 24.5 Cross-Age Engagement Modeling

**Scenario: 500 gold of Age 1 units vs 500 gold of Age 4 units**
- Age 1: 33 Clubmen (495 gold) = 264 total DPS, 990 total HP
- Age 4: 1 Marine + 1 Crossbowman (540 gold) = 67.2 total DPS, 160 total HP
- **Result**: Clubmen win decisively (4x DPS, 6x HP). But the Marine kills ~7 Clubmen before dying.

**Scenario: 500 gold of Age 1 vs 500 gold of Age 4 WITH counter bonus**
- Age 4 player uses correct counters: Infantry (Marine) vs ranged (Slingers)
- Marine deals 45 × 1.5 = 67.5 damage per hit to Slingers, killing in 0.3 seconds each
- This swings the fight dramatically — counter bonuses make age-appropriate play essential.

---

## 25. FORMATION SYSTEM — DETAILED MECHANICS

### 25.1 How Formations Work
Units don't just walk in a line. When **3+ units of the same type** are within 50px of each other, they automatically form a **formation** that grants passive bonuses:

| Formation | Trigger | Bonus |
|-----------|---------|-------|
| **Infantry Line** | 3+ Infantry adjacent | +15% HP (shield wall effect) |
| **Ranged Battery** | 3+ Ranged behind Infantry | +20% fire rate (coordinated volleys) |
| **Heavy Column** | 2+ Heavies together | +10% damage (combined arms) |
| **Mixed Regiment** | 1 of each type nearby | +5% all stats (balanced force) |

### 25.2 Formation Breaking
- Splash damage breaks formations (units scatter)
- Special units explicitly counter formations (Pack Raptors flank, Drone Swarm surrounds)
- Hero abilities like Spartan Push disrupt enemy formations
- This creates a push/pull dynamic: formations are powerful but vulnerable to the right counter

### 25.3 Visual Indicators
- Units in formation have a faint glowing border connecting them
- Formation bonus appears as a small icon above the group (+shield icon, +fire rate icon, etc.)
- Breaking a formation plays a "scatter" particle effect

---

## 26. PROJECTILE SYSTEM — DETAILED DESIGN

### 26.1 Projectile Types

| Type | Behavior | Used By |
|------|----------|---------|
| **Direct** | Travels in straight line, hits first target | Arrows, bullets, lasers |
| **Arcing** | Parabolic arc, hits target location (can miss if target moves) | Catapults, grenades, mortars |
| **Homing** | Tracks target, guaranteed hit, but slower | Missiles, magic bolts |
| **Piercing** | Passes through first target, hits up to 3 | Ballista bolts, rail guns |
| **Splash** | Explodes on impact, damages area | Cannons, bombs, rockets |
| **Beam** | Continuous damage while aimed, no projectile travel time | Lasers, ion cannons |
| **DoT Cloud** | Creates persistent damage zone | Mustard gas, fire pools |

### 26.2 Projectile Visual Effects
- Each projectile type has a distinct trail (smoke for cannonballs, light streak for lasers, fire trail for rockets)
- Impact effects match the projectile: sparks for metal, dust for stone, electricity for future weapons
- Arcing projectiles have shadows on the ground showing landing zone

---

## 27. DEATH & DESTRUCTION EFFECTS

### 27.1 Unit Death Animations
| Unit Type | Death Effect |
|-----------|-------------|
| Infantry (pre-gunpowder) | Ragdoll fall + weapon drops to ground |
| Infantry (gunpowder+) | Knockback + collapse |
| Ranged | Drops weapon, falls backward |
| Heavy (organic) | Slow collapse, ground shake on impact |
| Heavy (mechanical) | Explosion + debris particles |
| Air Units | Spinning fall to ground, explosion on impact |
| Hero | Dramatic slow-motion death, particles, screen flash |

### 27.2 Base Destruction Sequence
When a base reaches 0 HP:
1. Cracks spread across the structure (0.5s)
2. Turrets detach and fall (0.5s)
3. Main structure collapses floor by floor from top (1.5s)
4. Dust cloud + explosion particles (1s)
5. Victory/Defeat banner slides in with fanfare
6. Remaining units on winning side do victory animations (cheer, raise weapons)

---

## 28. CAMERA & VIEWPORT SYSTEM

### 28.1 Camera Behavior
- **Default**: Camera shows the full 1600px battlefield with both bases visible
- **Auto-focus**: Camera subtly shifts toward the center of combat (where most units are fighting)
- **Zoom**: Scroll wheel zooms in (max 2x) to see detail, zooms out (max 0.8x) for overview
- **Zoom-to-action**: When a Special ability is used, camera briefly zooms to the impact point then returns
- **Evolution zoom**: During age transitions, camera zooms into your base for the transformation sequence

### 28.2 Viewport Sizing
- **Desktop**: Full viewport, 16:9 recommended, letterboxed for ultra-wide
- **Mobile**: Landscape forced, UI scales to smaller touch targets
- **Minimum resolution**: 1024x576 (16:9 minimum)

### 28.3 Minimap
- Small minimap in top-right corner showing:
  - Your units (blue dots)
  - Enemy units (red dots)
  - Terrain zones (colored regions)
  - Base positions and HP bars
- Click minimap to snap camera to that location (when zoomed in)

---

## 29. SAVE SYSTEM & PERSISTENCE

### 29.1 Single Player
- **Auto-save**: Game state saved every 30 seconds to localStorage
- **Resume**: If browser is closed mid-game, "Resume Battle?" prompt on next launch
- **Campaign progress**: Saved per-mission with star ratings
- **Settings**: Persisted in localStorage (volume, controls, accessibility options)

### 29.2 Player Profile (Multiplayer)
- Stored server-side: ELO rating, match history, unlocked cosmetics
- JWT-based authentication (email/password or guest account with optional upgrade)
- Replay data stored for 30 days server-side

### 29.3 Data Format
```json
{
  "version": "1.0",
  "campaign": {
    "missions": { "1": { "stars": 3, "bestTime": 245 }, ... },
    "currentMission": 12
  },
  "survival": {
    "bestWave": 47,
    "totalRuns": 23
  },
  "unlocks": ["skin_norse_base", "skin_hero_leonidas_gold", ...],
  "settings": {
    "masterVolume": 0.8,
    "sfxVolume": 1.0,
    "musicVolume": 0.6,
    "screenShake": true,
    "damageNumbers": true,
    "colorblindMode": false,
    "reducedMotion": false
  },
  "stats": {
    "totalGamesPlayed": 156,
    "totalWins": 89,
    "favoriteUnit": "Knight",
    "favoriteAge": "Medieval",
    "totalUnitsSpawned": 12847,
    "totalEnemiesKilled": 11293
  }
}
```

---

## 30. ACCESSIBILITY FEATURES

### 30.1 Visual Accessibility
- **Colorblind modes**: Deuteranopia, Protanopia, Tritanopia presets
- **High contrast mode**: Unit outlines become bold borders, terrain zones get stronger color fills
- **Unit type indicators**: Shape-based icons (circle=infantry, triangle=ranged, square=heavy, star=special) in addition to color
- **Damage numbers**: Can be enlarged or disabled
- **Screen shake**: Toggle off in settings

### 30.2 Motor Accessibility
- **Full keyboard control**: Every action mappable to keyboard. No mouse required.
- **Adjustable game speed**: 0.5x, 0.75x, 1.0x, 1.5x (single player only)
- **Auto-pause**: Game pauses when window loses focus
- **One-button mode**: Cycle through unit types with Tab, spawn with Space. Turrets auto-build.
- **Sticky keys**: Hold-to-aim replaced with click-to-toggle for Special abilities

### 30.3 Audio Accessibility
- Separate volume sliders: Master, Music, SFX, UI, Voice/Announcer
- **Visual sound indicators**: Damage events, evolution alerts, and special abilities show screen-edge flashes
- **Subtitle-style combat log**: Optional text feed showing "Knight attacked Archer for 35 damage" etc.

### 30.4 Cognitive Accessibility
- **Reduced information mode**: Hides DPS numbers, counter indicators, and formation bonuses. Shows only HP bars and gold.
- **Suggested unit**: A subtle highlight on the "recommended" unit to spawn based on current enemy composition
- **Pause at will**: Single player can pause at any time, no penalty
- **Replay moves**: Post-match replay shows key moments with annotations

---

## 31. SETTINGS & OPTIONS MENU

### 31.1 Categories

**GAMEPLAY**
- Difficulty (Easy/Normal/Hard/Impossible/Nightmare)
- Game speed (0.5x / 0.75x / 1.0x / 1.5x)
- Auto-pause on focus loss (on/off)
- Damage numbers (on/off/large)
- Counter indicators (on/off)
- Suggested unit highlighting (on/off)
- Tutorial tooltips (on/off/reset all)

**CONTROLS**
- Keybind remapping for all actions
- Mouse sensitivity for camera scroll
- Touch control layout (mobile)
- Gamepad button mapping

**VIDEO**
- Resolution (auto-detect or manual)
- Fullscreen toggle
- VSync
- Particle density (Low/Medium/High)
- Background detail (Low/Medium/High)
- Screen shake intensity (0-100%)
- Colorblind mode (None/Deuteranopia/Protanopia/Tritanopia)
- High contrast mode

**AUDIO**
- Master volume
- Music volume
- SFX volume
- UI sounds volume
- Announcer volume
- Dynamic music (on/off — when off, plays full track without layering)

**ACCESSIBILITY**
- Reduced motion
- One-button mode
- Combat text log
- Visual sound indicators
- Font size (Normal/Large/Extra Large)

---

## 32. ACHIEVEMENT SYSTEM (FULL LIST)

### 32.1 Progression Achievements
| Achievement | Requirement | Reward |
|-------------|-------------|--------|
| First Blood | Win your first battle | 50 coins |
| Age of Discovery | Reach the Future Age for the first time | Profile title: "Time Traveler" |
| Campaign Veteran | Complete all 30 campaign missions | Hero skin: Golden Grok |
| Three-Star General | Earn 3 stars on all campaign missions | Base skin: Crystal Fortress |
| Survival Expert | Reach wave 50 in Survival | Profile border: Flame |
| Century Survivor | Reach wave 100 in Survival | Exclusive unit skin set |
| Ranked Warrior | Win 10 ranked matches | Profile badge |
| Master Strategist | Win with each of the 5 AI personality counters | Title: "Grand Marshal" |

### 32.2 Combat Achievements
| Achievement | Requirement | Reward |
|-------------|-------------|--------|
| Zerg Rush | Win a game using only Infantry units | 100 coins |
| Glass Cannon | Win without building any turrets | Unit skin: Shadow Infantry |
| Iron Fortress | Win without spawning any units (turrets only) | Base skin: Iron Citadel |
| Speedrunner | Win any game in under 5 minutes | Title: "Blitz Commander" |
| David vs Goliath | Kill a Heavy unit with an Infantry unit | 25 coins |
| Age Gap | Destroy a Future Age unit with a Prehistoric unit | Title: "Primal Force" |
| Hero Slayer | Kill 50 enemy heroes total | Hero skin: Blood-Red Leonidas |
| Overkill | Deal 1,000+ damage with a single Special ability | 50 coins |
| Untouchable | Win with base HP at 100% | Profile border: Diamond |
| Diversified Portfolio | Use all 32 unit types in a single game | 200 coins |

### 32.3 Social Achievements
| Achievement | Requirement | Reward |
|-------------|-------------|--------|
| Friendly Fire | Play 5 custom matches with friends | 50 coins |
| Top 100 | Reach top 100 on any leaderboard | Animated profile border |
| Replay Star | Have a replay watched 100 times | Title: "Celebrity" |
| Tournament Victor | Win a community tournament | Exclusive trophy cosmetic |

---

## 33. DAILY CHALLENGE SYSTEM

### 33.1 Structure
3 daily challenges refresh at midnight UTC. Completing all 3 awards a **bonus chest** with random cosmetic or coins.

### 33.2 Challenge Pool (Random selection)

| Category | Examples |
|----------|---------|
| **Unit Challenges** | "Spawn 50 Infantry units", "Win using only Ranged and Heavy units", "Kill 20 units with a single Hero" |
| **Age Challenges** | "Win without evolving past Classical Age", "Reach Future Age in under 8 minutes", "Win 2 games as different ages" |
| **Economy Challenges** | "Earn 5,000 gold in a single game", "Win with less than 100 gold remaining", "Build 10 turrets" |
| **Combat Challenges** | "Kill 3 enemy heroes today", "Use Special abilities 5 times", "Win with your base above 90% HP" |
| **Mode Challenges** | "Complete a campaign mission with 3 stars", "Reach wave 25 in Survival", "Play a ranked match" |

### 33.3 Weekly Challenge
One weekly challenge (resets Monday) with bigger reward:
- Example: "Win 10 games this week using at least 3 different starting strategies"
- Reward: Exclusive weekly cosmetic (rotates, never repeats)

---

## 34. DATA-DRIVEN CONFIGURATION FORMAT

### 34.1 Unit Definition Schema (JSON)
All units, turrets, heroes, and abilities are defined in JSON config files, not hardcoded. This enables:
- Easy balance tuning without code changes
- Mod support (community can create custom unit packs)
- A/B testing different balance configurations

```json
{
  "units": {
    "clubman": {
      "displayName": "Clubman",
      "age": 1,
      "type": "infantry",
      "stats": {
        "hp": 30,
        "damage": 8,
        "attackSpeed": 1.0,
        "moveSpeed": 3.0,
        "range": 0,
        "armor": 0,
        "cost": 15,
        "spawnTime": 1.5,
        "xpReward": 5,
        "goldReward": 10
      },
      "counters": {
        "strong_vs": ["special"],
        "weak_vs": ["heavy"],
        "bonus_damage_multiplier": 1.5
      },
      "passive": {
        "name": "Rally",
        "description": "Nearby allies gain +5% attack speed",
        "radius": 80,
        "effect": { "attackSpeed": 1.05 }
      },
      "visuals": {
        "spriteSheet": "units/prehistoric/clubman.png",
        "frameSize": [32, 32],
        "animations": {
          "idle": { "frames": [0, 1], "fps": 2 },
          "walk": { "frames": [2, 3, 4, 5, 6, 7, 8, 9], "fps": 10 },
          "attack": { "frames": [10, 11, 12, 13], "fps": 8 },
          "death": { "frames": [14, 15, 16, 17], "fps": 6, "loop": false }
        }
      },
      "audio": {
        "spawn": "sfx/units/grunt_spawn.ogg",
        "attack": "sfx/units/club_hit.ogg",
        "death": "sfx/units/grunt_death.ogg",
        "move": "sfx/units/footstep_dirt.ogg"
      }
    }
  }
}
```

### 34.2 Turret Definition Schema
```json
{
  "turrets": {
    "rock_dropper": {
      "displayName": "Rock Dropper",
      "age": 1,
      "category": "anti_infantry",
      "stats": {
        "damage": 15,
        "fireRate": 0.5,
        "range": 120,
        "splashRadius": 0,
        "hp": 200,
        "cost": 100
      },
      "upgrades": [
        { "level": 2, "cost": 150, "damage": 19, "fireRate": 0.6 },
        { "level": 3, "cost": 250, "damage": 24, "fireRate": 0.7, "splashRadius": 30 }
      ],
      "projectile": {
        "type": "arcing",
        "sprite": "projectiles/rock.png",
        "speed": 200,
        "impactEffect": "dust_cloud"
      },
      "targeting": "nearest",
      "slotPreference": ["ground", "low_wall"]
    }
  }
}
```

### 34.3 Age Definition Schema
```json
{
  "ages": {
    "1": {
      "name": "Prehistoric",
      "xpToNext": 100,
      "baseHpBonus": 0,
      "passiveIncome": 3,
      "units": ["clubman", "slinger", "dino_rider", "pack_raptors"],
      "turrets": ["rock_dropper", "tar_pit"],
      "hero": "grok",
      "special": "meteor_shower",
      "visuals": {
        "baseSpriteSheet": "bases/prehistoric.png",
        "background": "backgrounds/prehistoric/",
        "transitionAnim": "transitions/prehistoric_to_bronze.json"
      },
      "music": {
        "ambient": "music/prehistoric_ambient.ogg",
        "combat": "music/prehistoric_combat.ogg",
        "intensity": "music/prehistoric_intensity.ogg"
      },
      "palette": {
        "primary": "#8B6914",
        "secondary": "#D4722B",
        "accent": "#FF6B35"
      }
    }
  }
}
```

---

## 35. FILE & FOLDER STRUCTURE

```
epochs-of-war/
├── GAME_DESIGN.md              # This document
├── package.json
├── tsconfig.json
├── vite.config.ts
├── index.html
│
├── public/
│   ├── favicon.ico
│   └── manifest.json
│
├── src/
│   ├── main.ts                 # Entry point
│   ├── config/
│   │   ├── units.json          # All unit definitions
│   │   ├── turrets.json        # All turret definitions
│   │   ├── heroes.json         # All hero definitions
│   │   ├── ages.json           # Age progression config
│   │   ├── abilities.json      # Special ability definitions
│   │   ├── terrain.json        # Terrain zone definitions
│   │   ├── weather.json        # Weather event definitions
│   │   ├── campaign.json       # Campaign mission definitions
│   │   ├── survival.json       # Survival mode wave/buff definitions
│   │   ├── achievements.json   # Achievement definitions
│   │   ├── dailies.json        # Daily challenge pool
│   │   └── balance.json        # Global balance multipliers
│   │
│   ├── core/
│   │   ├── ecs/
│   │   │   ├── World.ts        # ECS world manager
│   │   │   ├── Entity.ts       # Entity factory
│   │   │   └── Query.ts        # Component query system
│   │   ├── components/
│   │   │   ├── Position.ts
│   │   │   ├── Velocity.ts
│   │   │   ├── Health.ts
│   │   │   ├── Combat.ts
│   │   │   ├── Renderable.ts
│   │   │   ├── Faction.ts
│   │   │   ├── UnitType.ts
│   │   │   ├── AIBehavior.ts
│   │   │   ├── Turret.ts
│   │   │   ├── Ability.ts
│   │   │   ├── AgeTag.ts
│   │   │   ├── Projectile.ts
│   │   │   ├── Formation.ts
│   │   │   ├── StatusEffect.ts
│   │   │   └── Lifetime.ts
│   │   ├── systems/
│   │   │   ├── InputSystem.ts
│   │   │   ├── AISystem.ts
│   │   │   ├── SpawnSystem.ts
│   │   │   ├── MovementSystem.ts
│   │   │   ├── CombatSystem.ts
│   │   │   ├── ProjectileSystem.ts
│   │   │   ├── AbilitySystem.ts
│   │   │   ├── HealthSystem.ts
│   │   │   ├── EconomySystem.ts
│   │   │   ├── WeatherSystem.ts
│   │   │   ├── FormationSystem.ts
│   │   │   ├── StatusEffectSystem.ts
│   │   │   ├── TerrainSystem.ts
│   │   │   ├── AgeSystem.ts
│   │   │   └── CleanupSystem.ts
│   │   └── managers/
│   │       ├── GameManager.ts      # Master game state, phase transitions
│   │       ├── WaveManager.ts      # Survival mode wave controller
│   │       ├── CampaignManager.ts  # Campaign progression
│   │       ├── TechTreeManager.ts  # Tech tree state and unlocks
│   │       ├── SaveManager.ts      # Persistence layer
│   │       └── MatchManager.ts     # Multiplayer match lifecycle
│   │
│   ├── rendering/
│   │   ├── RenderSystem.ts         # Main render loop
│   │   ├── SpriteManager.ts        # Sprite loading and pooling
│   │   ├── ParticleManager.ts      # Particle effect system
│   │   ├── CameraController.ts     # Camera zoom, pan, auto-focus
│   │   ├── UIRenderer.ts           # HUD, menus, overlays
│   │   ├── BackgroundRenderer.ts   # Parallax backgrounds per age
│   │   ├── TerrainRenderer.ts      # Terrain zone visuals
│   │   ├── MinimapRenderer.ts      # Minimap overlay
│   │   └── shaders/
│   │       ├── glow.frag           # Unit selection glow
│   │       ├── dissolve.frag       # Death dissolve effect
│   │       └── shockwave.frag      # Special ability screen effect
│   │
│   ├── audio/
│   │   ├── AudioManager.ts         # Howler.js wrapper
│   │   ├── MusicController.ts      # Dynamic layer system
│   │   └── SFXPlayer.ts            # Pooled sound effect playback
│   │
│   ├── ui/
│   │   ├── HUD.ts                  # In-game heads-up display
│   │   ├── MainMenu.ts             # Title screen
│   │   ├── TechTreeUI.ts           # Tech tree overlay
│   │   ├── PauseMenu.ts
│   │   ├── SettingsMenu.ts
│   │   ├── PostGameScreen.ts       # Victory/defeat + stats
│   │   ├── CampaignMap.ts          # World map for campaign
│   │   ├── SurvivalUI.ts           # Wave counter, buff selection
│   │   ├── TutorialOverlay.ts      # Tutorial prompts
│   │   ├── AchievementsPanel.ts
│   │   ├── DailyChallenges.ts
│   │   └── Tooltip.ts              # Reusable tooltip component
│   │
│   ├── ai/
│   │   ├── AIDirector.ts           # Master AI decision maker
│   │   ├── strategies/
│   │   │   ├── RusherAI.ts
│   │   │   ├── TurtlerAI.ts
│   │   │   ├── BoomerAI.ts
│   │   │   ├── TacticianAI.ts
│   │   │   └── BerserkerAI.ts
│   │   ├── BossAI.ts               # Boss fight phase logic
│   │   └── UnitAI.ts               # Individual unit targeting
│   │
│   ├── multiplayer/
│   │   ├── NetworkManager.ts       # WebSocket client
│   │   ├── ClientPrediction.ts     # Local prediction for responsiveness
│   │   ├── Interpolation.ts        # Entity interpolation
│   │   ├── Matchmaking.ts          # Queue and match creation
│   │   └── ReplayRecorder.ts       # Replay capture
│   │
│   ├── utils/
│   │   ├── ObjectPool.ts           # Generic object pooling
│   │   ├── SpatialGrid.ts          # Collision optimization
│   │   ├── EventEmitter.ts         # Pub/sub event system
│   │   ├── Random.ts               # Seeded RNG for replays
│   │   ├── Easing.ts               # Animation easing functions
│   │   └── Constants.ts            # Global constants
│   │
│   └── types/
│       ├── Unit.ts                 # Unit type definitions
│       ├── Turret.ts
│       ├── Hero.ts
│       ├── Age.ts
│       ├── GameState.ts
│       └── Events.ts
│
├── server/                         # Multiplayer server (Phase 6)
│   ├── package.json
│   ├── src/
│   │   ├── index.ts                # Server entry
│   │   ├── GameRoom.ts             # Colyseus room
│   │   ├── GameSimulation.ts       # Authoritative game loop
│   │   ├── Matchmaking.ts          # ELO-based matching
│   │   ├── ReplayStore.ts          # Replay persistence
│   │   └── AntiCheat.ts            # Input validation
│   └── tsconfig.json
│
├── assets/
│   ├── sprites/
│   │   ├── units/
│   │   │   ├── prehistoric/        # clubman.png, slinger.png, etc.
│   │   │   ├── bronze/
│   │   │   ├── classical/
│   │   │   ├── medieval/
│   │   │   ├── gunpowder/
│   │   │   ├── industrial/
│   │   │   ├── modern/
│   │   │   └── future/
│   │   ├── turrets/
│   │   ├── heroes/
│   │   ├── projectiles/
│   │   ├── bases/
│   │   └── effects/
│   ├── backgrounds/
│   │   ├── prehistoric/
│   │   ├── bronze/
│   │   └── .../
│   ├── ui/
│   │   ├── icons/
│   │   ├── buttons/
│   │   ├── frames/
│   │   └── fonts/
│   ├── audio/
│   │   ├── music/
│   │   ├── sfx/
│   │   └── ambient/
│   └── shaders/
│
└── tests/
    ├── balance/
    │   ├── dps-calculator.test.ts  # Verify DPS tables
    │   ├── economy-sim.test.ts     # Simulate gold flow over time
    │   └── bot-vs-bot.test.ts      # Automated strategy matchups
    ├── systems/
    │   ├── combat.test.ts
    │   ├── movement.test.ts
    │   └── spawning.test.ts
    └── integration/
        ├── age-evolution.test.ts
        └── full-game.test.ts
```

---

## 36. LOCALIZATION

### 36.1 Supported Languages (Launch)
English, Spanish, Portuguese, French, German, Japanese, Korean, Chinese (Simplified)

### 36.2 Implementation
- All UI strings in `src/i18n/{locale}.json`
- Unit names, descriptions, and flavor text are localized
- Number formatting respects locale (1,000 vs 1.000)
- Date formatting for daily challenges
- Right-to-left (RTL) support prepared for Arabic (post-launch)

### 36.3 String Format
```json
{
  "ui.hud.gold": "Gold: {amount}",
  "ui.hud.evolve": "Evolve to {ageName}",
  "ui.hud.evolve_ready": "READY!",
  "unit.clubman.name": "Clubman",
  "unit.clubman.desc": "A primitive warrior armed with a wooden club.",
  "hero.grok.name": "Grok, the First Hunter",
  "hero.grok.ability1": "Primal Roar",
  "hero.grok.ability1_desc": "Stuns all enemies in range for {duration}s.",
  "achievement.first_blood": "First Blood",
  "achievement.first_blood_desc": "Win your first battle.",
  "boss.titan.name": "The Titan",
  "boss.titan.phase1": "The Titan approaches...",
  "boss.titan.phase2": "The Titan is enraged!",
  "boss.titan.phase3": "The Titan charges your base!"
}
```

---

## 37. ANTI-CHEAT & MULTIPLAYER INTEGRITY

### 37.1 Server-Side Validation
- Server runs the authoritative game simulation — clients only send inputs
- All input commands validated: Can this player afford this unit? Is this unit available in their age?
- Position verification: Units can only move at their defined speed
- Cooldown enforcement: Hero abilities and specials tracked server-side
- Rate limiting: Max 20 commands per second per client

### 37.2 Replay Determinism
- Game uses **seeded RNG** — same seed + same inputs = same output
- This enables: replay verification, spectator mode, and desync detection
- If client state diverges from server by >5%, force resync

### 37.3 Reporting & Moderation
- In-game report button for suspected cheating
- Automated detection: Win rate > 95% over 50+ games triggers review
- Server logs all match inputs for audit

---

## 38. ANALYTICS & TELEMETRY

### 38.1 Key Metrics to Track
| Metric | Purpose |
|--------|---------|
| Session length | Is the game too long/short? |
| Games per session | Is the "one more game" loop working? |
| Win rate per difficulty | Are difficulties properly tuned? |
| Most/least used units | Which units need buffs/nerfs? |
| Average age reached | Are players evolving too fast/slow? |
| Turret usage rate | Are turrets worth building? |
| Hero deployment rate | Are heroes feeling impactful? |
| Tech tree branch popularity | Is one branch dominant? |
| Campaign completion rate per mission | Which missions are too hard? |
| Survival average wave | Is scaling appropriate? |
| Multiplayer queue time | Is matchmaking fast enough? |
| Disconnect rate | Are games stable? |
| Tutorial completion rate | Are players finishing onboarding? |
| Daily challenge completion rate | Are challenges achievable? |
| Revenue per user (if monetized) | Is the cosmetic shop working? |

### 38.2 A/B Testing
- Config-driven balance allows server-side A/B tests
- Example: Test two different XP curves, measure average game length per group
- Feature flags for new mechanics before full rollout

---

## APPENDIX C: MUSIC DIRECTION NOTES

### Per-Age Music Briefs

| Age | Tempo | Instruments | Mood | Reference Tracks |
|-----|-------|-------------|------|------------------|
| Prehistoric | 80 BPM | Frame drums, bone flute, throat singing, stomps | Primal tension, vast wilderness | Far Cry Primal OST, Horizon Zero Dawn tribal themes |
| Bronze | 100 BPM | Oud, lyre, frame drum, chanting | Ancient grandeur, rising civilization | Civilization VI Sumeria theme, Prince of Persia |
| Classical | 110 BPM | Brass ensemble, war drums, choir | Triumphant, martial glory | Rome: Total War OST, "Glorious Morning" (WaterFlame) |
| Medieval | 105 BPM | Full orchestra, choir, church organ | Epic, ominous, crusade-like | Two Steps From Hell, Kingdom of Heaven OST |
| Gunpowder | 120 BPM | Snare drums, fifes, naval bells, strings | Naval adventure, explosive tension | Assassin's Creed Black Flag shanties, Napoleon: Total War |
| Industrial | 130 BPM | Industrial percussion, brass, steam sfx, distorted strings | Gritty, mechanical, relentless | Frostpunk OST, Dishonored |
| Modern | 140 BPM | Electronic drums, orchestra, synth pads, radio chatter | Urgent, cinematic warfare | Call of Duty MW2 OST, Hans Zimmer war themes |
| Future | 150 BPM | Synthwave, choir pads, glitch percussion, deep sub bass | Transcendent, climactic, alien | Mass Effect 3 combat music, Stellaris |

### Dynamic Layer Rules
```
LAYER 1 (Ambient): Always playing. Soft, atmospheric.
LAYER 2 (Rhythm): Fades in when ≥3 units are in combat.
LAYER 3 (Intensity): Fades in when base HP < 50% OR special ability active.
LAYER 4 (Crisis): Replaces Layer 1-3 when base HP < 20%. Maximum urgency.

Crossfade time: 2 seconds between layer changes.
Age transition: 3-second silence → new age ambient starts with a dramatic hit.
```

---

## APPENDIX D: SPRITE SHEET SPECIFICATIONS

### Unit Sprites
- **Canvas size per unit**: 128×128px (4 frames wide × 4 rows = 16 frames)
- **Frame layout**:
  - Row 1: Idle (2 frames) + Walk (6 frames) = 8 frames
  - Row 2: Attack (4 frames) + Death (4 frames) = 8 frames
- **Scale**: 32×32 per frame at 1x zoom, rendered at 2x on high-DPI
- **Palette**: Max 16 colors per unit (pixel art constraint for consistency)
- **File format**: PNG with transparency

### Base Sprites
- **Canvas size**: 256×384px per age (tall multi-story structure)
- **Includes**: 5 turret slot indicators, gate, flags/banners
- **Destruction variant**: Separate spritesheet for damage states (100%, 75%, 50%, 25%, 0%)

### Projectile Sprites
- **Canvas size**: 16×16px (small, fast-moving)
- **Animated**: 2-4 frame loop for spinning/pulsing effects
- **Trail**: Rendered programmatically (not sprite-based) for performance

---

## APPENDIX E: EXAMPLE COMPLETE GAME FLOW (Annotated)

A full walkthrough of a 15-minute Normal difficulty game:

```
0:00  — Game starts. Age 1: Prehistoric. Gold: 100. XP: 0/100.
0:05  — Player spawns 2 Clubmen (30 gold). Enemy spawns 1 Clubman.
0:15  — Units meet in center. Combat begins. Player earns 10 gold, 5 XP.
0:30  — Player builds Rock Dropper turret in Slot 1 (100 gold). Gold: 5.
0:45  — Player spawns Slinger (25 gold from passive income + kills).
1:00  — Player has 3 units vs enemy 2. Frontline pushes toward enemy base.
1:30  — Player reaches 50 gold, spawns Dino Rider. Enemy spawns Dino Rider.
2:00  — Big clash in center. Both Dino Riders trade. Player XP: 85/100.
2:30  — Player reaches 100 XP. Evolve button glows. Player clicks T.
        → 3-second evolution cinematic. Base transforms to Bronze Age.
        → Rock Dropper auto-upgrades to Arrow Slit.
        → New units unlock: Spearman, Javelin Thrower, War Chariot, War Elephant.
        → Hero unlocked: Sargon. Player deploys hero (free).
2:45  — Enemy still in Prehistoric. Player has age advantage.
3:00  — Player spawns Spearmen (30g each). Sargon leads the push.
3:30  — Player uses Sargon's "Inspiring Charge" — army speeds toward enemy base.
4:00  — Enemy evolves to Bronze Age. Evens out. Hero vs Hero begins.
4:30  — Player opens Tech Tree (Tab). Spends 2 points: Economy T1 (Taxation) +
        Military T1 (Recruitment). Income now +20%, spawn time -15%.
5:00  — Mid-game stabilizes. Both sides have steady armies. Terrain: River in
        center slows pushes. Player switches to Javelin Throwers (ranged, river
        doesn't matter as much).
6:00  — Player evolves to Classical (Age 3). Enemy evolves 30 seconds later.
        New hero: Leonidas. Player's Sargon is replaced.
6:30  — Weather event: FOG. Range reduced 30%. Player switches to Hoplites
        (melee benefits from fog). Aggressive push while fog lasts.
7:00  — Fog clears. Player pulls back. Builds 2nd turret: Catapult (splash).
7:30  — Player evolves to Medieval. Special ability: Plague.
8:00  — Enemy sends Knight rush. Player counters with Crossbowmen (+50% vs Heavy).
        Knights melt. Player earns massive gold + XP.
8:30  — Player uses Plague special on enemy army cluster. Enemy heavies dissolve.
9:00  — Enemy evolves to Gunpowder. Musketeers outrange player's Crossbowmen.
        Player must evolve quickly.
9:30  — Player evolves to Gunpowder. Cavalry charge (fast heavy) pushes through.
10:00 — Tech tree: Player has 8 points spent. Economy T3 (War Bonds — got 500 gold
        on evolution). Military T3 (Elite Forces — Cannon upgrades to Siege Cannon).
11:00 — Both evolve to Industrial. Zeppelin Bomber appears — first air unit!
        Enemy has no anti-air turret. Zeppelin bombs their army freely.
11:30 — Enemy builds SAM Turret. Zeppelin destroyed. Player switches to
        Steam Tanks. Ground war resumes.
12:00 — Player evolves to Modern. Gets Commander Steele (hero).
        Uses "Airstrike" hero ability + "Airstrike" special in combo.
        Enemy army annihilated. Massive push toward enemy base.
12:30 — Enemy base at 40% HP. Enemy evolves to Modern. Tanks deployed.
13:00 — Stalemate at enemy base. Turret crossfire. Player builds Sniper
        (400px range) to outrange turrets and whittle base.
13:30 — Player evolves to Future. Mech Walker deployed. 1,200 HP beast
        absorbs turret fire while Marines DPS the base.
14:00 — Enemy base at 15% HP. Player uses Orbital Strike (Future special).
        500 damage across the base frontline. Turrets destroyed.
14:30 — Drone Swarm floods through the gap. Base HP drops to 0.
14:45 — VICTORY. Base destruction cinematic plays.
15:00 — Post-game stats screen: 247 units spawned, 189 enemies killed,
        8 ages reached, Gold efficiency: 94%. 3 stars earned.
```

This example demonstrates all major systems interacting over a full game.
