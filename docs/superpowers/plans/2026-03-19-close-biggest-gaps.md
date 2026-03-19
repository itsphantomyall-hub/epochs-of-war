# Close Biggest Gaps Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the 7 highest-impact gaps that prevent Epochs of War from being a polished, shippable game — prioritized by what makes the biggest difference to a player opening the game right now.

**Architecture:** Each task is independent and can be executed by a separate agent in parallel. Tasks are ordered by player impact: things that are visibly broken or missing come first, infrastructure improvements come last.

**Tech Stack:** Phaser 4, TypeScript, Vite, Howler.js (to add), GitHub Pages (deploy)

---

## Gap Priority Matrix

| # | Gap | Player Impact | Effort | Status |
|---|-----|---------------|--------|--------|
| 1 | **No audio at all** | CRITICAL — game feels dead/lifeless | Medium | Zero audio code, no files, no Howler |
| 2 | **Settings never applied** | HIGH — settings exist but do nothing | Low | SettingsManager stored but never read |
| 3 | **Campaign mode broken** | HIGH — clicking campaign plays Classic mode | Medium | init() ignores mode/missionId |
| 4 | **Background parallax static** | MEDIUM — backgrounds never scroll | Low | updateParallax() never called |
| 5 | **Dead code cruft** | LOW — confusing but not player-visible | Low | updateEnemyAI, spriteKey |
| 6 | **No deployment** | HIGH — nobody else can play the game | Low | No CI/CD, no hosting |
| 7 | **No tests** | MEDIUM — can't verify fixes don't break things | Medium | Zero test files exist |

---

## Task 1: Audio System — Sound Effects & Music

The game has ZERO audio. No sound effects, no music, no Howler.js, no audio files. This is the single biggest gap — a strategy game with combat and explosions needs sound to feel alive.

**Files:**
- Create: `src/audio/AudioManager.ts`
- Create: `src/audio/SFXLibrary.ts`
- Create: `src/audio/MusicController.ts`
- Modify: `src/scenes/GameScene.ts`
- Modify: `src/ui/HUD.ts`
- Modify: `package.json`

### Approach: Procedural Audio via Web Audio API
Since we have no audio files and don't want to bloat the bundle, generate all sounds procedurally using the Web Audio API (oscillators, noise, envelopes). This is the same approach retro games use — synthesized bleeps, booms, and tones.

- [ ] **Step 1: Install no dependencies — Web Audio API is built into browsers**

No npm install needed. Web Audio API is native.

- [ ] **Step 2: Create AudioManager singleton**

```typescript
// src/audio/AudioManager.ts
// Singleton that owns the AudioContext and routes all sound
// Methods: playSFX(name), playMusic(ageIndex), stopMusic(), setVolume(type, 0-1)
// Reads SettingsManager for volume levels
// Creates AudioContext on first user interaction (browser autoplay policy)
```

Key behaviors:
- Lazy-init AudioContext on first `playSFX()` call (avoids autoplay block)
- Read `SettingsManager.get('masterVolume')`, `sfxVolume`, `musicVolume` every call
- Master gain node → SFX gain node + Music gain node

- [ ] **Step 3: Create SFXLibrary with procedural sound generation**

```typescript
// src/audio/SFXLibrary.ts
// Each sound is a function that creates oscillator+gain envelope combos:
//
// hit_light: 80Hz sine, 50ms decay — melee hit
// hit_heavy: 60Hz sine + white noise, 150ms decay — heavy impact
// explosion_small: white noise + 100Hz sine, 300ms decay — grenade
// explosion_large: white noise + 60Hz sine, 500ms decay, screen-shake-worthy
// coin: 800Hz→1200Hz sine sweep, 100ms — gold earned
// evolve: C-E-G arpeggio (523→659→784 Hz), 500ms — age up fanfare
// spawn: 200Hz blip, 30ms — unit created
// death: 400Hz→100Hz descending, 200ms — unit dies
// button_click: 1000Hz sine, 20ms — UI click
// ability: 300Hz→600Hz→300Hz wobble, 200ms — hero ability
// special_charge: rising white noise 0→1 over 1s — special charging
// special_fire: explosion_large + 200Hz sine, 400ms — special landing
// warning: 440Hz square wave, 200ms on/off pulse — low HP
// victory: C major chord (C4-E4-G4), 1s sustain — win
// defeat: C minor chord descending, 1s — lose
```

- [ ] **Step 4: Create MusicController with procedural ambient loops**

```typescript
// src/audio/MusicController.ts
// Simple procedural music using oscillator drones + arpeggios per age:
// Age 1: Low drone (80Hz) + sporadic percussion hits
// Age 2-3: Drone + simple 4-note arpeggio loop
// Age 4-5: Fuller chord progression (I-IV-V-I)
// Age 6-7: Faster arpeggio + percussion
// Age 8: Synth pad + fast arpeggio
//
// Each "track" is a looping function using setInterval + oscillators
// Crossfade between ages over 2 seconds
```

- [ ] **Step 5: Wire into GameScene**

```typescript
// In GameScene.create():
this.audioManager = AudioManager.getInstance();

// Wire to events:
gameManager.events.on('damage', () => audioManager.playSFX('hit_light'));
gameManager.events.on('death', (e) => {
  audioManager.playSFX(e.unitType === 'heavy' ? 'explosion_large' : 'death');
});
gameManager.events.on('baseHit', () => audioManager.playSFX('hit_heavy'));
gameManager.events.on('gameOver', (e) => {
  audioManager.playSFX(e.winner === 'player' ? 'victory' : 'defeat');
  audioManager.stopMusic();
});

// On evolution:
audioManager.playSFX('evolve');
audioManager.playMusic(newAge);

// On unit spawn:
audioManager.playSFX('spawn');

// On gold earned:
audioManager.playSFX('coin');

// Start music on game start:
audioManager.playMusic(1);
```

- [ ] **Step 6: Wire into HUD**

```typescript
// Button clicks play 'button_click'
// Evolve button press plays 'evolve'
// Special button plays 'special_fire'
```

- [ ] **Step 7: Verify and commit**

Run: `npx tsc --noEmit --skipLibCheck`
Expected: zero errors

```bash
git add src/audio/
git commit -m "feat: procedural audio system — SFX + music via Web Audio API"
```

---

## Task 2: Wire Settings Into Gameplay

SettingsManager stores settings but NO gameplay code reads them. Screen shake, particle density, damage numbers, colorblind mode — all stored, all ignored.

**Files:**
- Modify: `src/scenes/GameScene.ts`
- Modify: `src/rendering/JuiceManager.ts`
- Modify: `src/rendering/ParticleManager.ts`
- Modify: `src/ui/HUD.ts`

- [ ] **Step 1: Import SettingsManager in GameScene**

```typescript
import { SettingsManager } from '../core/managers/SettingsManager';
// In create():
this.settingsManager = SettingsManager.getInstance();
```

- [ ] **Step 2: Wire screenShakeIntensity**

In JuiceManager (or GameScene where camera.shake is called):
```typescript
const intensity = this.settingsManager.get('screenShakeIntensity') / 100;
if (intensity > 0) {
  this.cameras.main.shake(duration, magnitude * intensity);
}
```

- [ ] **Step 3: Wire particleDensity**

In ParticleManager, before spawning particles:
```typescript
const density = SettingsManager.getInstance().get('particleDensity');
const multiplier = density === 'low' ? 0.3 : density === 'medium' ? 0.6 : 1.0;
const count = Math.max(1, Math.floor(baseCount * multiplier));
```

- [ ] **Step 4: Wire damageNumbers**

In GameScene's floating text spawns and HUD:
```typescript
if (this.settingsManager.get('damageNumbers')) {
  this.floatingText.spawnDamage(x, y, damage);
}
```

- [ ] **Step 5: Wire colorblindMode**

Apply Phaser camera color matrix based on mode:
```typescript
const mode = this.settingsManager.get('colorblindMode');
if (mode === 'deuteranopia') {
  // Shift reds toward blue, adjust green channel
  this.cameras.main.setPostPipeline('ColorblindPipeline');
}
// OR simpler: swap faction colors from blue/red to blue/yellow
```

Simpler approach: change `FACTION_COLORS` based on colorblind mode:
```typescript
if (mode !== 'none') {
  FACTION_COLORS.enemy = 0xFFAA00; // Orange-yellow instead of red
}
```

- [ ] **Step 6: Wire audio volumes**

AudioManager already reads settings (from Task 1). Verify integration.

- [ ] **Step 7: Verify and commit**

```bash
npx tsc --noEmit --skipLibCheck
git add -A
git commit -m "feat: wire SettingsManager into gameplay — shake, particles, damage numbers, colorblind"
```

---

## Task 3: Fix Campaign Mode

CampaignMapScene passes `{ mode: 'campaign', missionId, difficulty }` to GameScene, but `init()` only reads `difficulty`. Campaign plays identically to Classic — no mission objectives, no star tracking, no progress saving.

**Files:**
- Modify: `src/scenes/GameScene.ts` (init signature + campaign logic)
- Modify: `src/core/managers/CampaignManager.ts` (if needed)
- Modify: `src/config/campaign.json` (verify mission data)

- [ ] **Step 1: Expand GameScene.init() to accept campaign data**

```typescript
interface GameSceneData {
  difficulty?: 'easy' | 'normal' | 'hard';
  mode?: 'classic' | 'campaign';
  missionId?: number;
}

init(data?: GameSceneData): void {
  this.difficulty = data?.difficulty ?? 'normal';
  this.mode = data?.mode ?? 'classic';
  this.missionId = data?.missionId;
}
```

- [ ] **Step 2: Apply mission config in create()**

```typescript
if (this.mode === 'campaign' && this.missionId) {
  const campaignManager = new CampaignManager();
  const mission = campaignManager.getMission(this.missionId);
  if (mission) {
    // Apply start age
    if (mission.startAge) {
      // Evolve player to startAge
      for (let i = 1; i < mission.startAge; i++) {
        this.playerAgeSystem.evolve();
      }
    }
    // Apply enemy AI personality
    this.difficulty = mission.difficulty as any;
    // Store mission for end-game star calculation
    this.currentMission = mission;
  }
}
```

- [ ] **Step 3: Apply mission modifiers**

```typescript
// Check modifiers array
for (const mod of mission.modifiers || []) {
  switch (mod) {
    case 'no_turrets': this.turretsDisabled = true; break;
    case 'famine': this.passiveIncomeDisabled = true; break;
    case 'locked_age': this.evolutionLocked = true; break;
    // ... etc
  }
}
```

- [ ] **Step 4: Calculate stars on game over**

```typescript
// In showEndScreen or gameOver handler:
if (this.mode === 'campaign' && this.currentMission) {
  const elapsed = this.gameState.elapsedTime;
  const hpPercent = this.gameState.player.baseHp / this.gameState.player.baseMaxHp * 100;
  const stars = this.campaignManager.calculateStars(elapsed, hpPercent, this.currentMission);
  this.campaignManager.completeMission(this.currentMission.id, stars);
  // Display stars in end screen
}
```

- [ ] **Step 5: Show "Return to Campaign" button instead of "Main Menu"**

```typescript
if (this.mode === 'campaign') {
  menuBtn.setText('Back to Campaign');
  menuBtn.on('pointerdown', () => this.scene.start('CampaignMapScene'));
}
```

- [ ] **Step 6: Verify and commit**

```bash
npx tsc --noEmit --skipLibCheck
git add -A
git commit -m "feat: campaign mode — mission objectives, modifiers, star tracking, progress saving"
```

---

## Task 4: Fix Background Parallax

BackgroundRenderer has `updateParallax(cameraX)` but it's never called. Backgrounds are static.

**Files:**
- Modify: `src/scenes/GameScene.ts`

- [ ] **Step 1: Call updateParallax in the game loop**

Find the `update()` method in GameScene. After rendering entities, add:
```typescript
// Parallax background scrolling
if (this.backgroundRenderer) {
  // Calculate "virtual camera" X based on battle center
  const battleCenterX = this.getBattleCenterX(); // average X of all units
  this.backgroundRenderer.updateParallax(battleCenterX);
}
```

- [ ] **Step 2: Add getBattleCenterX helper**

```typescript
private getBattleCenterX(): number {
  const units = this.gameManager.world.query('Position', 'Faction');
  if (units.length === 0) return 640; // center default
  let totalX = 0;
  for (const id of units) {
    const pos = this.gameManager.world.getComponent<Position>(id, 'Position')!;
    totalX += this.ecsXToScreen(pos.x);
  }
  return totalX / units.length;
}
```

- [ ] **Step 3: Verify and commit**

```bash
npx tsc --noEmit --skipLibCheck
git add -A
git commit -m "fix: wire background parallax scrolling into game loop"
```

---

## Task 5: Remove Dead Code

Dead methods and unused data create maintenance confusion.

**Files:**
- Modify: `src/scenes/GameScene.ts`

- [ ] **Step 1: Delete `updateEnemyAI` method**

Search for `private updateEnemyAI` in GameScene.ts and delete the entire method (~80 lines). Also delete the `private lastEnemySpawnTime` field if it exists.

- [ ] **Step 2: Remove `spriteKey` from SpawnRequest usage**

In `src/core/systems/SpawnSystem.ts`, the `spriteKey` in Renderable is set but never read. Leave the interface field (it doesn't hurt) but note it's vestigial.

- [ ] **Step 3: Verify and commit**

```bash
npx tsc --noEmit --skipLibCheck
git add -A
git commit -m "chore: remove dead updateEnemyAI method and vestigial spriteKey references"
```

---

## Task 6: Deploy to GitHub Pages

Nobody else can play the game. It only runs on localhost.

**Files:**
- Create: `.github/workflows/deploy.yml`
- Modify: `vite.config.ts` (set base path)
- Modify: `package.json` (add deploy script)

- [ ] **Step 1: Set Vite base path for GitHub Pages**

```typescript
// vite.config.ts
export default defineConfig({
  base: '/epochs-of-war/',
  // ... rest of config
});
```

- [ ] **Step 2: Create GitHub Actions workflow**

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [master]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
      - run: npm install
      - run: npx vite build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
      - uses: actions/deploy-pages@v4
```

- [ ] **Step 3: Add deploy script to package.json**

```json
"scripts": {
  "dev": "vite --port 3100",
  "build": "tsc --noEmit --skipLibCheck && vite build",
  "deploy": "npm run build && gh-pages -d dist"
}
```

- [ ] **Step 4: Push and verify deployment**

```bash
git add -A
git commit -m "ci: deploy to GitHub Pages on push to master"
git push
# Wait for GitHub Actions to complete
# Game available at: https://itsphantomyall-hub.github.io/epochs-of-war/
```

---

## Task 7: Add Critical Path Tests

Zero tests exist. Add tests for the systems most likely to break during development.

**Files:**
- Create: `vitest.config.ts`
- Create: `tests/core/economy.test.ts`
- Create: `tests/core/combat.test.ts`
- Create: `tests/core/age-system.test.ts`
- Modify: `package.json` (add test script)

- [ ] **Step 1: Install vitest**

```bash
npm install -D vitest
```

- [ ] **Step 2: Create vitest config**

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
  resolve: {
    alias: { '@': './src', '@config': './src/config' },
  },
});
```

- [ ] **Step 3: Write economy tests**

```typescript
// tests/core/economy.test.ts
import { describe, it, expect } from 'vitest';
import { EconomySystem } from '../../src/core/systems/EconomySystem';

describe('EconomySystem', () => {
  it('starts with initial gold', () => {
    const eco = new EconomySystem(100, 1);
    expect(eco.getGold()).toBe(100);
  });

  it('adds passive income per second', () => {
    const eco = new EconomySystem(100, 1);
    eco.update(1.0); // 1 second
    expect(eco.getGold()).toBeGreaterThan(100);
  });

  it('canAfford returns false when gold insufficient', () => {
    const eco = new EconomySystem(10, 1);
    expect(eco.canAfford(50)).toBe(false);
  });

  it('spend deducts gold', () => {
    const eco = new EconomySystem(100, 1);
    eco.spend(30);
    expect(eco.getGold()).toBe(70);
  });
});
```

- [ ] **Step 4: Write combat counter tests**

```typescript
// tests/core/combat.test.ts
import { describe, it, expect } from 'vitest';

// Test the counter logic directly
const COUNTER_MAP: Record<string, Set<string>> = {
  infantry: new Set(['special', 'ranged']),
  ranged: new Set(['heavy']),
  heavy: new Set(['infantry']),
  special: new Set(['heavy']),
};

describe('Counter System', () => {
  it('infantry counters special', () => {
    expect(COUNTER_MAP['infantry'].has('special')).toBe(true);
  });
  it('ranged counters heavy', () => {
    expect(COUNTER_MAP['ranged'].has('heavy')).toBe(true);
  });
  it('heavy counters infantry', () => {
    expect(COUNTER_MAP['heavy'].has('infantry')).toBe(true);
  });
  it('infantry does NOT counter heavy', () => {
    expect(COUNTER_MAP['infantry'].has('heavy')).toBe(false);
  });
});
```

- [ ] **Step 5: Write age system tests**

```typescript
// tests/core/age-system.test.ts
import { describe, it, expect } from 'vitest';

describe('Age System', () => {
  it('base HP scales with age', () => {
    // Formula: 500 + (age-1) * 200
    const getBaseHp = (age: number) => 500 + (age - 1) * 200;
    expect(getBaseHp(1)).toBe(500);
    expect(getBaseHp(4)).toBe(1100);
    expect(getBaseHp(8)).toBe(1900);
  });

  it('XP requirements increase per age', () => {
    const xpThresholds = [100, 250, 500, 900, 1400, 2200, 3500];
    for (let i = 1; i < xpThresholds.length; i++) {
      expect(xpThresholds[i]).toBeGreaterThan(xpThresholds[i - 1]);
    }
  });
});
```

- [ ] **Step 6: Add test script and run**

```json
// package.json scripts
"test": "vitest run",
"test:watch": "vitest"
```

```bash
npx vitest run
# Expected: all tests pass
git add -A
git commit -m "test: add critical path tests for economy, combat counters, age system"
```

---

## Execution Order (Parallel-Safe Groups)

```
Group A (parallel — independent):  Tasks 1, 2, 4, 5
Group B (after Group A):           Task 3 (needs settings wiring from Task 2)
Group C (parallel — independent):  Tasks 6, 7
```

**Estimated total effort:** ~3-4 hours of agent work across 5 parallel agents.

---

## What This Fixes

After all 7 tasks complete:
- Game has **sound effects and music** (procedural, zero file downloads)
- Settings **actually work** (shake, particles, damage numbers, colorblind)
- Campaign mode **tracks progress, applies modifiers, awards stars**
- Backgrounds **scroll with parallax** based on battle position
- Dead code **removed**
- Game **deployed to GitHub Pages** — shareable URL
- **Tests** catch regressions in economy, combat, and age progression
