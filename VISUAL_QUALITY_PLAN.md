# VISUAL QUALITY PLAN — Making Epochs of War Look Professional

## Research: What Makes Great Pixel Art Strategy Games Look Good

### Lessons from Age of War (Original)
- Cartoon-style sprites with clear silhouettes — each unit instantly recognizable
- Colors matched the age: earthy for prehistoric, metallic for modern, neon for future
- Simple but expressive animations: 3-4 frames max per action
- Base transformations were the visual highlight — dramatic, rewarding evolution moments
- The game looked good because it was **consistent** — everything felt like it belonged together

### Lessons from Kingdom Rush / Stick War
- Bold outlines on every unit (1-2px black border) make sprites pop against backgrounds
- Exaggerated proportions: big heads, small bodies — reads clearly at small sizes
- Limited palette per unit (4-6 colors max) keeps things clean
- Particle effects on every attack: sparks, dust, blood — makes combat feel impactful
- Environmental storytelling: backgrounds tell you what age you're in without reading text

### Lessons from Songs of Conquest / Wargroove (Modern Pixel Art Strategy)
- HD-2D hybrid: pixel art sprites on richer backgrounds with lighting effects
- Each faction has a distinct color identity (not just "red vs blue")
- Unit animations have anticipation frames (wind-up before attack)
- Death animations are satisfying — ragdoll, dissolve, or explosion
- UI is clean and modern — pixel art for game world, crisp vector for UI

### Game Juice Best Practices
- Screen shake: 0.1-0.3 seconds, randomized direction, ease-out
- Hit flash: sprite goes white for 1 frame on taking damage
- Anticipation: 2-frame wind-up before attack connects
- Impact pause: 50ms freeze-frame on critical hits
- Damage numbers: pop up, scale up slightly, then fade (not just float)
- Kill effects scale with unit importance: infantry poof < heavy explosion < hero cinematic

---

## Current State vs Target Quality

| Element | Current | Target |
|---------|---------|--------|
| Units | Colored rectangles | Detailed pixel characters with diverse appearances |
| Bases | Simple rectangles with flag | Multi-element structures per age (cave→castle→bunker) |
| Backgrounds | 2-band sky gradient | 3-layer parallax with age-specific scenery |
| Turrets | Small colored squares | Recognizable weapon shapes per age |
| Combat FX | Basic particle manager | Hit flashes, impact pause, anticipation frames |
| Death FX | Rectangle disappears | Age-appropriate destruction (dissolve/explode/ragdoll) |
| Evolution | Camera flash | Full cinematic: crumble → rebuild → particle celebration |
| Weather | Colored overlay | Actual particle rain/fog/sandstorm with depth |
| HUD | Functional but plain | Age-themed with unit portraits and polish |

---

## Phase A: Sprite Quality (Procedural Generation)

### Design Principles for Procedural Sprites
1. **Bold silhouettes**: Each unit type has a unique shape readable at 16px height
2. **2px black outline** on all characters — the single most impactful visual improvement
3. **Limited palette**: Max 8 colors per unit (body, skin, weapon, accent, shadow, highlight)
4. **Diverse representation**: 6 skin tone groups distributed across 32 units
5. **Age-appropriate equipment**: Each age's gear should be immediately recognizable
6. **Exaggerated proportions**: Head = 1/3 of body height for readability at small sizes

### Skin Tone Palette (6 tones, 2 variants each)
```
Tone 1: #FFE0BD / #F5C5A3 (Light)
Tone 2: #FFDBB4 / #E8C09A (Peach)
Tone 3: #D4A574 / #C49560 (Tan)
Tone 4: #C68642 / #B07532 (Olive)
Tone 5: #8D5524 / #7A4518 (Brown)
Tone 6: #6B3A2A / #5C2E20 (Dark Brown)
```

### Unit Skin Tone Assignments (Ensuring Diversity)
```
Age 1 (Prehistoric):  Clubman=Tone5, Slinger=Tone2, Dino Rider=Tone4, Pack Raptors=Tone1
Age 2 (Bronze):       Spearman=Tone3, Javelin=Tone6, Chariot=Tone1, Elephant=Tone4
Age 3 (Classical):    Hoplite=Tone2, Bowman=Tone5, Centurion=Tone3, Phalanx=Tone6
Age 4 (Medieval):     Swordsman=Tone4, Crossbow=Tone1, Knight=Tone6, Trebuchet=Tone2
Age 5 (Gunpowder):    Musketeer=Tone3, Grenadier=Tone5, Cavalry=Tone2, Cannon=Tone4
Age 6 (Industrial):   Rifleman=Tone1, MachGunner=Tone6, SteamTank=N/A, Zeppelin=N/A
Age 7 (Modern):       Marine=Tone5, Sniper=Tone3, Tank=N/A, Helicopter=N/A
Age 8 (Future):       Plasma=Tone2, RailGun=Tone4, Mech=N/A, Drones=N/A
```

### Character Design Guidelines Per Age

**Prehistoric**: Wild hair, fur clothing, bone accessories, earth tones
**Bronze**: Short hair/headbands, cloth wraps, copper/bronze weapons, warm golds
**Classical**: Helmets with plumes, togas/armor skirts, shields, marble whites + reds
**Medieval**: Full helmets, chainmail texture, tabards with cross/heraldry, steel greys + reds
**Gunpowder**: Tricorn/peaked hats, long coats with buttons, muskets/bayonets, navy + gold
**Industrial**: Goggles, top hats/caps, leather + brass, mechanical elements, soot greys + amber
**Modern**: Tactical helmets, body armor, camo patterns (subtle), olive + digital green
**Future**: Sleek visors, glowing accents (cyan), energy weapons, dark with neon highlights

## Phase B: Base Architecture Per Age

Each base should be a recognizable landmark that makes you feel the era:

| Age | Base Design | Key Visual Elements |
|-----|-------------|-------------------|
| Prehistoric | Cave/rock shelter | Stalactites, campfire glow, animal hide door |
| Bronze | Ziggurat/pyramid | Stepped structure, ramps, copper-tipped flags |
| Classical | Temple | White columns, triangular pediment, olive wreaths |
| Medieval | Castle | Stone walls, crenellations, drawbridge, banner |
| Gunpowder | Star fort | Angled walls, cannon embrasures, wooden gate |
| Industrial | Factory | Smokestacks with animated smoke, gears, brick |
| Modern | Bunker | Concrete, sandbags, radar dish, antenna |
| Future | Crystal spire | Floating elements, energy shield bubble, glow |

## Phase C: Background & Atmosphere

### Per-Age Background Layers
Each age gets 3 parallax layers that set the mood:

| Age | Sky | Far | Near |
|-----|-----|-----|------|
| Prehistoric | Volcanic orange sunset | Volcanoes, pterodactyls | Ferns, rocks |
| Bronze | Warm golden sky | Ziggurats on horizon | Palm trees, obelisks |
| Classical | Clear blue, white clouds | Acropolis silhouette | Olive trees, columns |
| Medieval | Overcast grey | Castle silhouettes | Dead trees, tombstones |
| Gunpowder | Smoky horizon | Ships at sea | Cannon emplacements |
| Industrial | Smoggy amber | Factory skyline | Train tracks, pipes |
| Modern | Blue sky, jet contrails | City skyline | Destroyed buildings |
| Future | Aurora/nebula | Space station | Floating platforms |

## Phase D: Animation Quality

### Frame Counts Per Action (Minimum for Good Feel)
| Action | Frames | Timing |
|--------|--------|--------|
| Idle | 2 | 0.5s per frame |
| Walk | 4 | 0.15s per frame |
| Attack (melee) | 3 | anticipation(0.1s) → swing(0.05s) → follow-through(0.1s) |
| Attack (ranged) | 2 | aim(0.1s) → fire(0.05s) |
| Death | 3 | hit-react(0.1s) → fall(0.15s) → landed(stays) |
| Hit react | 1 | White flash for 50ms |

### Animation Techniques (Procedural)
- **Walk cycle**: Alternate leg positions (2 frames), slight body bob (1px up/down)
- **Attack anticipation**: Weapon arm pulls back 2px, holds 100ms, then swings forward
- **Hit flash**: Set sprite tint to white (0xFFFFFF) for 1 frame, then restore
- **Impact pause**: Freeze both attacker and target for 50ms on hit (game juice)
- **Death**: Sprite tilts 45°, falls downward, fades alpha to 0 over 300ms

## Phase E: Combat Effects Upgrade

| Effect | Current | Target |
|--------|---------|--------|
| Melee hit | Small particle | Hit flash + dust + blood splash + 50ms pause |
| Ranged hit | Small particle | Spark/impact + small screen shake for heavy hits |
| Heavy death | Explosion particles | Large explosion + screen shake + debris flying |
| Hero death | Same as regular | Slow-motion 500ms + large particle burst + flash |
| Special ability | Damage zone appears | Full-screen visual effect per ability type |
| Evolution | Camera flash | 3-second cinematic with particle celebration |
| Base hit | Floating number | Camera shake + crack appear + dust from wall |

## Phase F: UI/HUD Upgrade

### HUD Theming
- HUD bar colors should shift to match the current age's palette
- Unit buttons should show miniature unit sprites (from ProceduralSpriteFactory)
- Hero portrait: larger sprite of current hero in the ability bar
- Gold counter should have a coin icon (drawn procedurally)
- XP bar should glow and pulse when full (ready to evolve)

### Fonts
- Use a pixel-art-compatible font (bitmap font or Phaser's built-in with monospace)
- Important numbers (damage, gold) should be bold and slightly larger
- Age name during evolution should be displayed in a dramatic serif style

---

## Implementation Priority Order

1. **Black outlines on all units** (biggest visual impact for least work)
2. **Unit sprite diversity** (skin tones, age-appropriate gear)
3. **Base redesigns per age** (8 unique bases)
4. **Hit flash + impact pause** (instant game feel improvement)
5. **Background parallax per age** (sets the atmosphere)
6. **Walk/attack animations** (brings units to life)
7. **Death animations** (satisfying feedback loop)
8. **Evolution cinematic** (the "wow" moment)
9. **Weather particle effects** (immersion)
10. **HUD theming** (polish)

---

## Quality Benchmarks

Before shipping, every element should pass these checks:
- [ ] Can you tell what age you're in by looking at the screen (without reading text)?
- [ ] Can you distinguish all 4 unit types at a glance?
- [ ] Do units from different ages look noticeably different?
- [ ] Does every hit feel impactful (visual + audio feedback)?
- [ ] Does evolution feel like a reward (cinematic moment)?
- [ ] Is the HUD readable without squinting?
- [ ] Do the backgrounds enhance the mood without distracting from gameplay?
- [ ] Are at least 4 different skin tones visible in any given army?
