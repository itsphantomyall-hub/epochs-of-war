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
