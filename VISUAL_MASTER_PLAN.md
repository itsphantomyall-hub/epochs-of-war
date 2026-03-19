# EPOCHS OF WAR — ULTIMATE VISUAL MASTER PLAN

> The definitive guide to making this game look professional, polished, and competitive with the best pixel art strategy games on the market.

---

## TABLE OF CONTENTS

1. Competitor Visual Analysis
2. Free Asset Sources (Curated)
3. Color Palette System
4. Unit Sprite Design Bible
5. Hero Sprite Design Bible
6. Base Architecture Per Age
7. Turret Visual Design
8. Background & Parallax System
9. Animation Bible
10. VFX & Particle System
11. UI/HUD Visual Overhaul
12. Screen Effects & Juice
13. Weather Visual Effects
14. Terrain Zone Rendering
15. Implementation Strategy
16. Quality Checklist

---

## 1. COMPETITOR VISUAL ANALYSIS

### Age of War (Original, 2007)
**What worked:**
- Cartoon style with clear outlines — every unit readable at small size
- Age-appropriate color shifts (earthy prehistoric → neon future)
- Base transformations were the reward — dramatic visual evolution
- Simple but consistent art style — nothing felt out of place
- Units had personality despite being small (Dino Rider was iconic)

**What to improve upon:**
- Animations were very limited (2-3 frames)
- No weather/lighting effects
- Backgrounds were static and simple
- Unit diversity was low (all same body type with different weapons)

### Stick War / Stick War: Legacy
**What worked:**
- Distinct unit silhouettes — Swordwrath vs Archidons vs Giants instantly recognizable
- Exaggerated proportions made action readable at distance
- Good use of scale — giants felt genuinely threatening
- Smooth 2D animations

**What to steal:**
- Unit size differentiation (infantry small, heavy 2x bigger, special unique shape)
- Death ragdoll physics
- Crowd combat feeling — lots of units clashing is the spectacle

### Kingdom Rush (Series)
**What worked:**
- Incredibly detailed pixel art at small resolution
- Rich color palettes per environment
- Towers have distinct personalities
- Enemy variety is outstanding (100+ unique designs)
- UI is clean and informative without cluttering

**What to steal:**
- Tower upgrade visual progression (each tier looks noticeably different)
- Enemy death puffs (satisfying smoke/particle on death)
- Rally point visual indicators
- Miniature character portraits in UI buttons

### Songs of Conquest
**What worked:**
- HD-2D approach: pixel art sprites on modern-lit backgrounds
- Incredibly detailed unit sprites with full animation cycles
- Distinct faction color identities
- Environmental storytelling through map details

**What to steal:**
- Per-faction color language (not just red vs blue — warm earth tones vs cold steel)
- Unit grouping visual (units in formation look organized)
- Battle preview animations

### Wargroove
**What worked:**
- Chunky, readable pixel art with bold outlines
- Each commander has a unique personality in their sprite
- Attack animations are punchy with hit-stop
- 4 color factions that are visually distinct

**What to steal:**
- Hit-stop on impact (50-100ms freeze)
- Attack anticipation frames (wind-up before swing)
- Critical hit screen flash
- Commander (hero) special ability cinematic zoom

---

## 2. FREE ASSET SOURCES (Curated & License-Verified)

### Tier 1: Directly Usable (CC0 / Public Domain / MIT)

| Asset | Source | License | What's Included | URL |
|-------|--------|---------|-----------------|-----|
| **War of the Ages Sprite Sheet** | OpenGameArt | CC0 | Soldiers, tanks, planes, ships across multiple eras | https://opengameart.org/content/war-of-the-ages-pixel-art-sprite-sheet |
| **Tiny Swords (Free Pack)** | itch.io (Pixel Frog) | Free to use | Medieval units (5 colors), buildings, terrain, UI, particles | https://pixelfrog-assets.itch.io/tiny-swords |
| **Free Dino Sprites** | OpenGameArt | CC0 | Dinosaur characters for prehistoric age | https://opengameart.org/content/free-dino-sprites |
| **LPC Medieval Fantasy Characters** | OpenGameArt | CC-BY-SA 3.0 | Modular character sprites with weapons/armor | https://opengameart.org/content/lpc-medieval-fantasy-character-sprites |
| **Toen's Medieval Strategy Pack** | OpenGameArt | CC0 | 308 sprites: terrain, buildings, soldiers, siege (16x16) | https://opengameart.org/content/toens-medieval-strategy-sprite-pack-v10-16x16 |
| **Explosions/Bullets/Fire** | OpenGameArt | CC0 | VFX sprite sheets for combat effects | https://opengameart.org/content/explosions-bullets-fire-etc-pixel-art |
| **CC0 Walk Cycles** | OpenGameArt | CC0 | 4-frame and 8-frame walk cycle bases | https://opengameart.org/content/cc0-walk-cycles |
| **Basic Pixel Health Bar** | itch.io | Free | Health bars and UI elements | https://bdragon1727.itch.io/basic-pixel-health-bar-and-scroll-bar |
| **CraftPix Free Soldier Sheets** | CraftPix | Free for commercial | Soldier sprite sheets with animations | https://craftpix.net/freebies/free-soldier-sprite-sheets-pixel-art/ |

### Tier 2: Reference/Inspiration (Study But Don't Copy Directly)

| Resource | Purpose | URL |
|----------|---------|-----|
| **Lospec Palette List** | Color palette database for pixel art | https://lospec.com/palette-list |
| **Lospec Walk Cycle Tutorials** | Animation reference for character movement | https://lospec.com/pixel-art-tutorials/tags/walkcycle |
| **SLYNYRD Pixel Art Tutorials** | Complete pixel art technique catalogue | https://www.slynyrd.com/pixelblog-catalogue |
| **Derek Yu Pixel Art Tutorial** | Foundational pixel art basics | https://www.derekyu.com/makegames/pixelart.html |
| **Age of War Unity Clone** | Reference for original game's sprite proportions | https://github.com/erupturatis/Age-of-war-unity-clone |
| **Pixelorama** | Open-source pixel art editor for creating custom sprites | https://github.com/Orama-Interactive/Pixelorama |

### Download Strategy
1. Download the **War of the Ages** CC0 sprite sheet — extract soldiers, tanks, planes for Modern/Future ages
2. Download **Tiny Swords Free Pack** — extract medieval units, buildings, terrain, UI elements
3. Download **Free Dino Sprites** — use for Prehistoric age Dino Rider
4. Download **Toen's Medieval Strategy Pack** — extract siege weapons, terrain
5. Download **Explosions/Bullets/Fire** — use for all combat VFX
6. For ages not covered by free assets (Bronze, Classical, Gunpowder, Industrial): generate procedurally using ProceduralSpriteFactory

---

## 3. COLOR PALETTE SYSTEM

### Master Palette (48 Colors — 6 per age)

#### Age 1: Prehistoric
```
#8B6914  Earth brown (ground, leather)
#D4722B  Volcanic orange (fire, accents)
#FF6B35  Flame red-orange (lava, danger)
#4A3020  Dark wood (clubs, bones)
#7A8B3D  Moss green (plants, terrain)
#F5E6C8  Bone/ivory (skulls, teeth)
```

#### Age 2: Bronze Age
```
#CD853F  Copper/bronze (weapons, armor)
#DEB887  Sandy gold (buildings, terrain)
#8B4513  Dark brown (wood, leather)
#F4E4BA  Parchment (cloth, sails)
#996515  Deep bronze (shields, helmets)
#2E5339  Palm green (vegetation)
```

#### Age 3: Classical
```
#E8E0D0  Marble white (buildings, togas)
#C41E3A  Roman red (capes, banners)
#B8860B  Gold (laurels, accents)
#4A6741  Olive green (wreaths, terrain)
#6B5B4A  Stone (walls, foundations)
#1C3A5F  Deep blue (water, sky)
```

#### Age 4: Medieval
```
#808080  Stone grey (castles, armor)
#8B0000  Crimson (banners, blood)
#4682B4  Steel blue (swords, chain mail)
#654321  Oak brown (wood, doors)
#DAA520  Heraldic gold (crowns, trim)
#2F4F2F  Forest green (terrain)
```

#### Age 5: Gunpowder
```
#2C3E50  Navy blue (uniforms)
#F1C40F  Brass gold (buttons, cannons)
#7F8C8D  Gunmetal grey (weapons)
#D4C5A9  Parchment/smoke (clouds)
#8B4513  Mahogany (ship wood)
#ECF0F1  Powder white (wigs, smoke)
```

#### Age 6: Industrial
```
#4A4A4A  Iron grey (machinery)
#D4A017  Amber (lights, sparks)
#8B6914  Brass (gears, pipes)
#2C2C2C  Soot black (smokestacks)
#B87333  Copper (wiring, details)
#C0C0C0  Steel silver (structures)
```

#### Age 7: Modern
```
#556B2F  Olive drab (camo, uniforms)
#2F4F4F  Dark slate (vehicles)
#808000  Khaki (desert camo)
#1C1C1C  Jet black (weapons)
#C0C0C0  Metal silver (tech)
#FF4500  Warning orange (explosions)
```

#### Age 8: Future
```
#00CED1  Neon cyan (energy, shields)
#1A1A2E  Deep space blue (base)
#E040FB  Plasma purple (weapons)
#39FF14  Matrix green (HUD, data)
#F5F5F5  Holographic white (structures)
#FF1744  Alert red (danger, laser)
```

### Skin Tone Palette (6 Tones × 3 Variants = 18 Colors)

| Tone | Base | Shadow | Highlight | Used By (Example Units) |
|------|------|--------|-----------|------------------------|
| Light | #FFE0BD | #E8C4A0 | #FFF0DB | Slinger, War Chariot, Swordsman, Rifleman |
| Peach | #FFDBB4 | #E5BF96 | #FFECCE | Crossbowman, Cavalry, Plasma Trooper |
| Tan | #D4A574 | #B88B5E | #E8BB8A | Spearman, Hoplite, Musketeer, Sniper |
| Olive | #C68642 | #A87035 | #D89C56 | Dino Rider, Centurion, Grenadier |
| Brown | #8D5524 | #744818 | #A66930 | Clubman, Bowman, Marine |
| Dark Brown | #6B3A2A | #562E20 | #7E4B38 | Javelin Thrower, Phalanx, Machine Gunner |

**Rule: Every army of 4 units (Q/W/E/R) must include at least 3 different skin tones.**

---

## 4. UNIT SPRITE DESIGN BIBLE

### Universal Rules (Apply to All 32 Units)

1. **Canvas size**: 32×32 pixels per frame (rendered at 2x on high-DPI displays)
2. **Black outline**: 1px (#1A1A1A) on ALL character edges — this is non-negotiable
3. **Head proportion**: 1/3 of body height (8-10px head on 24-28px body)
4. **Color limit**: Max 8 unique colors per unit (excluding outline)
5. **Readable silhouette**: Unit must be identifiable as a solid black shape at 16px
6. **Weapon held at an angle**: Weapons should not be perfectly horizontal/vertical
7. **Faction tint**: Player units get a subtle blue tint overlay; enemy gets red tint
8. **Shadow**: 2px dark ellipse under feet for grounding

### Per-Unit Design Specifications

#### AGE 1: PREHISTORIC

**Clubman (Infantry)**
- Skin tone: Brown (#8D5524)
- Body: Muscular build, bare-chested with fur loincloth (#8B6914)
- Hair: Wild, unkempt dark hair (#3D2B1F), 3-4 pixel tufts
- Weapon: Wooden club in right hand (#6B4226), knobby top
- Feet: Bare (skin color)
- Detail: Bone necklace (1px white dots around neck)
- Size: 16×24

**Slinger (Ranged)**
- Skin tone: Light (#FFE0BD)
- Body: Leaner build, wears a hide vest (#A0845C)
- Hair: Short, lighter brown (#7A6040)
- Weapon: Sling in right hand (#6B4226), small pouch visible
- Left hand: Carries spare stones (2-3 grey dots)
- Feet: Leather wrappings (#5C4033)
- Size: 14×24

**Dino Rider (Heavy)**
- Skin tone: Olive (#C68642) for rider
- Rider: Small figure on top, leather armor, spear pointing forward
- Dinosaur: Green (#4A7A3D) body, lighter belly (#7AB85C), yellow eye (1px)
- Dino has 4 legs, tail extending back, head forward with open jaw
- Rider sits at shoulder position with legs on either side
- Size: 24×32 (wider due to dino)

**Pack Raptors (Special)**
- No human — 3 small raptors in a triangle formation
- Each raptor: green-brown (#5A7A3D), lighter belly, red eye (1px)
- Smaller than Dino Rider's mount (10×12 each)
- Teeth visible as 1px white dots at jaw
- Tail curves upward behind
- Size: 20×28 (group)

#### AGE 2: BRONZE AGE

**Spearman (Infantry)**
- Skin tone: Tan (#D4A574)
- Body: Cloth wrap skirt (#F4E4BA), bare chest with leather shoulder strap
- Hair: Short black hair (#2D2D2D) with headband (#CD853F bronze)
- Weapon: Long spear (#8B4513 wood, #CD853F bronze tip) held upward at angle
- Shield: Small round bronze shield (#CD853F) in left hand
- Sandals: (#8B4513)
- Size: 16×24

**Javelin Thrower (Ranged)**
- Skin tone: Dark Brown (#6B3A2A)
- Body: Linen wrap (#F4E4BA), one shoulder exposed
- Hair: Very short/shaved (#2D2D2D)
- Weapon: 2 javelins on back (#8B4513), one in throwing position in right hand
- Armband: Bronze (#CD853F) on upper arm
- Size: 14×24

**War Chariot (Heavy)**
- Driver skin tone: Light (#FFE0BD)
- Chariot: Bronze/wood frame (#CD853F/#8B4513), 2 spoked wheels
- Horse: Dark brown (#4A3020), simple 4-legged shape
- Driver holds reins, archer companion with bow behind
- Dust trail from wheels
- Size: 24×32

**War Elephant (Special)**
- Elephant: Large grey body (#808080), tusks (#F5E6C8), small eye
- Howdah: Wooden platform on top (#8B4513) with bronze trim
- Rider (Olive skin #C68642): Small figure in howdah with javelin
- Elephant trunk curves forward, ears visible as side bumps
- Size: 28×36 (largest non-hero unit)

#### AGE 3: CLASSICAL

**Hoplite (Infantry)**
- Skin tone: Peach (#FFDBB4)
- Body: Bronze breastplate (#CD853F) over white tunic (#E8E0D0)
- Helmet: Corinthian helmet with red plume (#C41E3A) — 3px tall crest
- Weapon: Short sword/xiphos (#808080) in right hand
- Shield: Large round aspis (#C41E3A with bronze trim) — covers 50% of body width
- Greaves: Bronze (#CD853F) on shins
- Size: 16×24

**Bowman (Ranged)**
- Skin tone: Brown (#8D5524)
- Body: Simple tunic (#E8E0D0) with leather belt (#8B4513)
- Hair: Short curly dark hair (#2D2D2D)
- Weapon: Bow (#8B4513) held sideways, arrow nocked
- Quiver: On back (#8B4513), 3 arrow tips visible (#808080)
- Sandals: Simple (#8B4513)
- Size: 14×24

**Centurion (Heavy)**
- Skin tone: Tan (#D4A574)
- Body: Full lorica segmentata (#808080 metal strips), red tunic (#C41E3A) visible
- Helmet: Imperial helmet with tall red transverse crest — THE defining feature
- Weapon: Gladius (#C0C0C0) in right hand
- Shield: Large rectangular scutum (#C41E3A with gold eagle emblem)
- Cape: Red (#C41E3A) flowing behind
- Size: 24×32

**Phalanx (Special)**
- 4 Hoplites in tight formation
- All hold overlapping shields forming a wall
- Spears (#8B4513) pointing forward over shield tops at identical angles
- Red plumes all matching
- Moves as one unit — no individual movement
- Size: 28×24 (wide formation)

#### AGE 4: MEDIEVAL

**Swordsman (Infantry)**
- Skin tone: Olive (#C68642)
- Body: Chain mail (#808080) over blue tabard (#4682B4) with white cross
- Helmet: Simple iron helm (#808080) with nose guard
- Weapon: Longsword (#C0C0C0) held in right hand, point upward
- Legs: Chain mail leggings, simple boots (#654321)
- Size: 16×24

**Crossbowman (Ranged)**
- Skin tone: Light (#FFE0BD)
- Body: Padded gambeson (#654321) with leather belt
- Hat: Kettle helm or leather cap (#654321)
- Weapon: Crossbow (#654321 wood, #808080 metal) held at hip level
- Bolt quiver: On belt (#654321)
- Size: 14×24

**Knight (Heavy)**
- Skin tone: Dark Brown (#6B3A2A) — only visible through helmet slit
- Body: Full plate armor (#C0C0C0) with blue surcoat (#4682B4)
- Helmet: Great helm with gold crown (#DAA520) — 2px detail on top
- Weapon: Lance (#808080) or sword, shield with heraldic lion
- Horse: Brown (#8B4513) with blue caparison (#4682B4)
- Size: 24×32 (mounted)

**Trebuchet (Special)**
- No human (siege weapon)
- Frame: Wooden (#8B4513), A-frame structure
- Arm: Long beam with counterweight (#808080) at one end, sling at other
- Base: Wooden platform on wheels (#654321)
- Projectile: Grey boulder (#808080) in sling
- Size: 24×28

#### AGE 5: GUNPOWDER

**Musketeer (Infantry)**
- Skin tone: Tan (#D4A574)
- Body: Navy blue coat (#2C3E50) with gold buttons (#F1C40F), white pants
- Hat: Tricorn hat (#2C3E50) with gold trim
- Weapon: Musket (#654321 wood, #7F8C8D barrel) with bayonet
- Boots: Black (#1C1C1C)
- White crossbelts forming X
- Size: 16×24

**Grenadier (Ranged)**
- Skin tone: Brown (#8D5524)
- Body: Red coat (#8B0000) with white trim, bandolier with grenades
- Hat: Tall mitre cap (#8B0000) — distinguishing feature
- Weapon: Grenade in throwing position, round with fuse
- Belt: White (#ECF0F1) with grenade pouches
- Size: 14×24

**Cavalry (Heavy)**
- Skin tone: Peach (#FFDBB4)
- Body: Blue hussar jacket (#2C3E50) with gold braid
- Hat: Shako (#2C3E50) with plume
- Weapon: Sabre (#C0C0C0) raised above head
- Horse: White (#ECF0F1) with blue saddle cloth
- Size: 24×32 (mounted)

**Cannon (Special)**
- No human (siege weapon)
- Barrel: Long iron tube (#7F8C8D) on wooden carriage (#654321)
- Wheels: Large spoked wheels (#654321)
- Trail: Wooden trail extending behind
- Cannonball: Stack of 3 black spheres next to cannon
- Size: 24×20

#### AGE 6: INDUSTRIAL

**Rifleman (Infantry)**
- Skin tone: Light (#FFE0BD)
- Body: Olive drab tunic (#556B2F) with leather belt, puttees
- Hat: Peaked cap (#556B2F) or tin helmet (#808080)
- Weapon: Bolt-action rifle (#654321/#808080) with bayonet
- Backpack: Small pack (#556B2F) on back
- Size: 16×24

**Machine Gunner (Ranged)**
- Skin tone: Dark Brown (#6B3A2A)
- Body: Dark coat (#2C2C2C) with ammunition belts draped over shoulders
- Hat: Flat cap (#2C2C2C)
- Weapon: Belt-fed machine gun (#808080) on bipod, carried at hip
- Ammo belt: Golden (#D4A017) chain hanging
- Size: 16×24

**Steam Tank (Heavy)**
- No human visible (vehicle)
- Body: Iron hull (#4A4A4A) with rivets (1px dots)
- Smokestack: Chimney on top (#2C2C2C) with animated smoke particles
- Turret: Small turret with stubby cannon (#808080)
- Tracks: Visible track segments (#2C2C2C) underneath
- Steam vents: 2 side pipes with white puffs
- Glow: Amber (#D4A017) from furnace window (1px)
- Size: 24×24

**Zeppelin Bomber (Special — AIR UNIT)**
- Body: Elongated oval gas bag (#C0C0C0) with cross-hatching detail
- Gondola: Small cabin underneath (#654321)
- Engines: 2 side-mounted propellers
- Bombs: 2-3 small black circles visible under gondola
- Fins: Tail fins at rear
- Flag: Small faction-colored flag on tail
- Size: 28×16 (wide, short — horizontal vehicle)
- **Floats above ground line by 40px** (air unit visual indicator)

#### AGE 7: MODERN

**Marine (Infantry)**
- Skin tone: Brown (#8D5524)
- Body: Camo fatigues (#556B2F with #808000 dapple pattern — 2-3px patches)
- Helmet: PASGT helmet (#556B2F) with chin strap
- Weapon: Assault rifle (#1C1C1C) held at ready
- Boots: Black combat boots (#1C1C1C)
- Vest: Tactical vest (#556B2F) with pouches
- Size: 16×24

**Sniper (Ranged)**
- Skin tone: Tan (#D4A574)
- Body: Ghillie suit (#556B2F with #808000 fringe detail — ragged outline)
- Hat: Boonie hat (#556B2F) pulled low
- Weapon: Long sniper rifle (#1C1C1C) with scope (1px glint)
- Prone/crouched pose (lower than other units)
- Size: 18×20 (wider, shorter due to prone)

**Tank (Heavy)**
- Body: Angular hull (#2F4F4F) with reactive armor tiles
- Turret: Large turret (#2F4F4F) with long cannon barrel
- Tracks: Wide visible tracks (#1C1C1C)
- Antenna: Thin communication whip antenna
- Markings: Small faction-colored rectangle on turret side
- Smoke dischargers: 2 small pods on turret sides
- Size: 28×20

**Attack Helicopter (Special — AIR UNIT)**
- Body: Sleek fuselage (#2F4F4F)
- Cockpit: Glass canopy (lighter #556B2F tint)
- Main rotor: Motion blur effect (semi-transparent disc)
- Tail rotor: Small disc at rear
- Weapons: Stub wings with rocket pods
- Skids: Landing skids underneath
- Size: 28×20
- **Floats 50px above ground** (air unit)

#### AGE 8: FUTURE

**Plasma Trooper (Infantry)**
- Skin tone: Peach (#FFDBB4)
- Body: Sleek powered armor (#1A1A2E) with cyan (#00CED1) glowing seams
- Helmet: Smooth visor (#00CED1 glow line across eyes)
- Weapon: Plasma rifle (#1A1A2E with #00CED1 energy core)
- Boots: Armored boots (#1A1A2E) with #00CED1 accents
- Shoulder pads: Small angular plates with glow trim
- Size: 16×24

**Rail Gunner (Ranged)**
- Skin tone: Olive (#C68642)
- Body: Light exosuit (#E0E0E0) with purple (#E040FB) accents
- Helmet: Open-face with targeting monocle (#E040FB glow)
- Weapon: Very long rail gun (#808080 with #E040FB coil rings along barrel)
- Power pack: Backpack (#808080) with pulsing #E040FB glow
- Braced stance: One knee down for stability
- Size: 18×24

**Mech Walker (Heavy)**
- No human visible (giant robot)
- Body: Humanoid torso (#808080) with cockpit canopy (#00CED1)
- Arms: Two weapon arms — one with cannon, one with energy blade
- Legs: Reverse-joint legs (#808080) with #00CED1 joint glows
- Shoulder: Missile pod (#1A1A2E) on one shoulder
- Exhaust: Back-mounted thrusters with faint glow
- Size: 28×36 (tallest unit)

**Drone Swarm (Special — AIR UNIT)**
- 8 small drones in a loose cloud formation
- Each drone: 4×4 pixel diamond shape (#1A1A2E) with #39FF14 center glow
- Propeller: 1px grey lines
- Formation: Random slight oscillation (each drone bobs independently)
- Laser lines: Thin #FF1744 lines connecting some drones
- Size: 24×24 (group)
- **Floats 30px above ground**

---

## 5. HERO SPRITE DESIGN BIBLE (32×40 pixels)

Heroes are 2x the width and ~1.5x the height of regular infantry. They have **gold outline** instead of black (2px #DAA520) and more detailed features.

### Grok, the First Hunter (Age 1)
- Massive muscular build, bare-chested
- Wild beard (#4A3020), face paint (2 red war stripes)
- Fur cloak over one shoulder
- GIANT bone club (oversized, 60% of body height)
- Bone necklace with animal teeth
- Bare feet with leather ankle wraps

### Sargon, the Conqueror (Age 2)
- Tall regal posture
- Golden crown/headband (#DAA520) with center gem (#FF0000 1px)
- Long braided beard (#2D2D2D)
- Bronze scale armor over chest
- Large ornate shield (#CD853F with embossed bull motif)
- Curved sword (khopesh)
- Red cape flowing behind

### Leonidas (Age 3)
- Spartan physique, warrior stance
- Iconic Corinthian helmet with massive red horsehair crest (8px tall!)
- Red cape (#C41E3A) — THE defining element
- Bronze breastplate with six-pack abs detail (#CD853F)
- Round Spartan shield (large, lambda Λ symbol)
- Spear in right hand, pointing forward
- Greaves and red kilt

### Joan of Arc (Age 4)
- Full plate armor (#C0C0C0) — feminine proportions (narrower waist)
- Long golden hair (#DAA520) flowing from under helmet
- Open-face sallet helmet with gold trim
- White tabard with gold fleur-de-lis
- Holds banner/standard in left hand (white with blue lilies)
- Sword in right hand
- Halo of light (subtle 1px white dots around head)

### Napoleon (Age 5)
- Iconic bicorne hat (#2C3E50) worn sideways — MUST be recognizable
- Blue military coat (#2C3E50) with gold epaulettes and buttons
- White pants (#ECF0F1), black boots (#1C1C1C)
- Right hand tucked in coat (iconic pose when idle)
- Sword at hip, telescope in other hand
- Red sash (#C41E3A) across chest
- Short stature (slightly shorter than other heroes but wider stance)

### The Iron Baron (Age 6)
- Top hat (#2C2C2C) with goggles on brim (#D4A017 lenses)
- Mechanical right arm (#808080 with #D4A017 joints) — steam pistons visible
- Long leather coat (#654321) with brass buttons
- Monocle over left eye
- Wrench/gear motif on belt
- Steam vents from mechanical arm (tiny white puffs)
- Heavy boots with brass toe caps

### Commander Steele (Age 7)
- Green beret (#556B2F) worn angled
- Tactical vest with multiple pouches and radio
- Strong jawline, determined expression
- Binoculars/radio in left hand
- Pistol holstered, pointing forward with command gesture
- Rolled-up sleeves showing muscular arms
- Dog tags visible
- Cigar (optional — 1px amber dot)

### AXIOM-7, AI Commander (Age 8)
- NOT human — fully robotic form
- Sleek ovoid head with horizontal cyan visor (#00CED1 full-width glow)
- Slim, angular body (#1A1A2E) with cyan seam lines
- Floating (no feet touching ground — hover 2px above)
- 4 small satellite orbs (#808080 with #39FF14 glow) orbit around body
- Energy tendrils from hands (reaching toward allies)
- Back-mounted energy wings (thin triangular projections, transparent)
- Screen/holographic display floating in front of chest

---

## 6. BASE ARCHITECTURE PER AGE

All bases are 64×100 pixels with 5 clearly marked turret slot positions.

| Age | Structure | Key Visual Elements | Turret Slot Style |
|-----|-----------|--------------------|--------------------|
| 1. Prehistoric | Rock cave/overhang | Stalactites, animal hide door, campfire (animated flicker), bone pile | Natural ledges in rock |
| 2. Bronze | Stepped ziggurat | 3 tiers, mud-brick texture, copper-tipped pole, ramp entrance | Platforms on each tier |
| 3. Classical | White marble temple | 4 columns, triangular pediment, olive branch detail, red door | Between columns |
| 4. Medieval | Stone castle | 4 crenellations, central tower, wooden gate, banner | In crenellation slots |
| 5. Gunpowder | Star fort | Angled bastions, iron-reinforced gate, cannon embrasures | In embrasures |
| 6. Industrial | Brick factory | 2 smokestacks (animated smoke), gear above door, windows with amber glow | On rooftop, beside smokestacks |
| 7. Modern | Concrete bunker | Flat roof, sandbag walls, radar dish (slowly rotating), antenna | Behind sandbags |
| 8. Future | Crystal spire | Pointed tower, energy shield bubble (transparent overlay), floating rings | Projected from spire surface |

### Base Damage States (4 States)
- **100-76% HP**: Perfect condition
- **75-51% HP**: Hairline cracks (2-3 dark lines), one small debris piece on ground
- **50-26% HP**: Large cracks, missing chunks, fire/smoke from one spot
- **25-1% HP**: Heavy damage, multiple fires, large sections crumbling, desperate state
- **0% HP**: Collapse animation (1.5 seconds — see Section 12)

---

## 7. TURRET VISUAL DESIGN (16×16 pixels each)

| Age | Anti-Infantry Turret | Anti-Heavy Turret |
|-----|---------------------|-------------------|
| 1 | **Rock Dropper**: Pile of rocks on ledge, arm mechanism | **Tar Pit**: Bubbling dark pool (animated 2-frame) |
| 2 | **Arrow Slit**: Narrow window in wall, arrows visible | **Boiling Oil**: Cauldron over fire, dark liquid dripping |
| 3 | **Ballista**: Wooden frame, giant crossbow bolt loaded | **Catapult**: Wooden arm with counterweight and basket |
| 4 | **Repeating Crossbow**: Mechanical crossbow with ammo hopper | **Trebuchet Tower**: Tall frame with pivoting arm |
| 5 | **Grape Shot**: Wide-mouth cannon on swivel | **Long Cannon**: Narrow-bore cannon on wheels |
| 6 | **Gatling Tower**: Multi-barrel rotating gun | **Howitzer**: Large upward-angled cannon |
| 7 | **SAM Turret**: Missile tubes pointing skyward | **Missile Launcher**: Tracked launcher with 2 missiles |
| 8 | **Laser Grid**: Crystal emitter with beam effect | **Ion Cannon**: Large dish/barrel with energy charge |

**Upgrade visual changes:**
- Level 1: Base appearance
- Level 2: +reinforcement details (metal bands, extra plates)
- Level 3: +glow effects (fire/energy at barrel), visibly larger

---

## 8. BACKGROUND & PARALLAX SYSTEM

### Layer Architecture (3 layers + ground)

```
Layer 1 (Furthest, slowest):  SKY — moves at 10% of camera speed
Layer 2 (Middle):             FAR TERRAIN — moves at 30% of camera speed
Layer 3 (Near):               NEAR TERRAIN — moves at 60% of camera speed
Ground:                       BATTLEFIELD FLOOR — stationary with scrolling texture
```

### Per-Age Background Designs

| Age | Sky (Layer 1) | Far (Layer 2) | Near (Layer 3) | Ground |
|-----|---------------|---------------|-----------------|--------|
| 1 | Orange sunset with volcanic glow, pterodactyl silhouettes (2-3 flying) | Volcano range, smoke rising, red sky reflection | Ferns, large rocks, cave entrance | Rocky brown earth with scattered bones |
| 2 | Warm golden sky, few white clouds | Ziggurat silhouettes, palm tree outlines | Obelisks, palm trees, sand dunes | Sandy terrain with footpaths |
| 3 | Clear blue Mediterranean sky, white puffy clouds | Acropolis/Parthenon silhouette on hill | Olive trees, broken columns, amphora | Light stone ground with grass patches |
| 4 | Overcast grey sky, birds circling | Castle silhouettes, watchtower, church spire | Dead trees, gravestones, wooden fences | Muddy ground with cobblestone path |
| 5 | Smoky horizon, cannon flashes in distance | Ships at sea (sail silhouettes), port buildings | Cannon emplacements, barrels, crates | Packed earth with wooden planks |
| 6 | Smoggy amber sky, dark clouds, chimney smoke | Factory skyline, water towers, crane silhouettes | Train tracks, pipes, telegraph poles, coal pile | Iron-plated ground, rivets, grating |
| 7 | Blue sky with jet contrails, attack helicopter dot | City skyline (modern buildings), radio tower | Destroyed buildings, sandbags, razor wire | Concrete with tread marks, debris |
| 8 | Aurora borealis / nebula swirl (#00CED1/#E040FB), stars | Space station / orbital ring, moon | Floating platforms, holographic trees, data streams | Metallic floor with glowing cyan grid lines |

---

## 9. ANIMATION BIBLE

### Frame Layout Per Unit (32×32, 4 rows)
```
Row 1 (frames 0-3): IDLE (2 frames breathing loop) + WALK (4 frames)
Row 2 (frames 4-6): ATTACK (3 frames: anticipation → strike → follow-through)
Row 3 (frames 7-9): DEATH (3 frames: hit-react → fall → landed)
Row 4 (frames 10-11): SPECIAL (2 frames — hit flash, ability cast)
```

### Walk Cycle (4 Frames, 150ms per frame = 600ms cycle)
```
Frame 1: Right foot forward, left foot back, body centered
Frame 2: Transition — both feet level, body raised 1px (bounce)
Frame 3: Left foot forward, right foot back, body centered
Frame 4: Transition — both feet level, body raised 1px (bounce)
```
- Arms swing opposite to legs (1-2px arm position change)
- Weapon bobs slightly (1px vertical shift on frames 2, 4)

### Attack Cycle (3 Frames)
```
Frame 1 — ANTICIPATION (100ms):
  Character pulls weapon back 2-3px
  Body leans slightly backward

Frame 2 — STRIKE (50ms):
  Weapon swings forward 4-5px past resting position
  Body lunges forward 1-2px

Frame 3 — FOLLOW-THROUGH (100ms):
  Weapon returns to near-resting position
  Body returns to center
```

### Death Cycle (3 Frames)
```
Frame 1 — HIT REACT (100ms):
  Body tilts backward 15°
  Arms fly outward

Frame 2 — FALLING (150ms):
  Body tilts 45°
  Begins dropping
  Weapon separates from hand

Frame 3 — LANDED (stays):
  Body flat on ground
  Weapon on ground nearby
  Alpha fades to 0 over 500ms
```

### Ranged Attack
```
Frame 1 — AIM (100ms):
  Weapon raised, arrow/bullet/bolt visible

Frame 2 — FIRE (50ms):
  Weapon kicks back (recoil), projectile launches
  Small muzzle flash for gunpowder+ ages
```

---

## 10. VFX & PARTICLE SYSTEM

### Effect Specifications

| Effect | Trigger | Particle Count | Colors | Size | Duration | Notes |
|--------|---------|---------------|--------|------|----------|-------|
| **Melee Hit** | Melee attack connects | 3-5 | White + age accent | 2-3px | 200ms | Radiate from impact point |
| **Blood Splash** | Unit takes critical damage | 4-6 | #AA0000, #880000 | 2px | 300ms | Scatter in hit direction |
| **Ranged Impact** | Projectile hits | 2-4 | Yellow + orange | 2-3px | 150ms | Sparks fly upward |
| **Explosion (Small)** | Grenade/splash weapon | 8-12 | Orange, yellow, grey | 3-5px | 400ms | Ring expansion |
| **Explosion (Large)** | Heavy unit death / cannon | 12-16 | Orange, yellow, white, grey | 4-8px | 600ms | + screen shake |
| **Dust Cloud** | Unit spawns / walks on dirt | 3-4 | Brown tones | 3-4px | 500ms | Expand + fade |
| **Magic Burst** | Hero ability activates | 8-10 | Per-hero color | 3-5px | 400ms | Spiral outward |
| **Evolution Celebration** | Age transition | 20-30 | Gold + age palette | 3-6px | 2000ms | Fireworks pattern |
| **Muzzle Flash** | Gunpowder+ ranged fire | 2-3 | White + yellow | 3px | 100ms | Directional cone |
| **Energy Beam** | Future age weapons | Continuous | Cyan / purple | 2px wide | Duration of fire | Line with glow |
| **Smoke Trail** | Industrial+ projectiles | 1 per 30ms | Grey, fading | 2px | 500ms trail | Follows projectile path |
| **Fire** | Incendiary effects | 3-5 | Orange, yellow, red | 2-4px | Looping | Flickers above target |
| **Shield Hit** | Attack blocked by shield | 4-6 | Cyan + white | 3px | 200ms | Ripple from impact |
| **Stun Stars** | Unit stunned | 3 | Yellow | 2px | Duration | Orbit above head |
| **Heal Glow** | Unit healed | 5-8 | Green + white | 2-3px | 400ms | Rise upward |
| **Base Crack** | Base takes damage | N/A | Dark lines | 1px lines | Permanent | Progressive cracking |
| **Base Debris** | Base destroyed | 15-20 | Structure color + grey | 4-8px | 1500ms | Fall with gravity |

---

## 11. UI/HUD VISUAL OVERHAUL

### Design Principles
- UI frame uses age-appropriate border style (stone → wood → metal → digital)
- All text in monospace pixel font for consistency
- Important numbers (gold, HP) are bold and 2px larger than descriptions
- Button hover: brighten by 15%, add 1px glow in accent color
- Button press: darken by 10%, shift down 1px (click feedback)

### HUD Color Theming Per Age
| Age | Bar Background | Bar Fill | Button Border | Accent |
|-----|---------------|----------|---------------|--------|
| 1 | #3D2B1F (dark wood) | #8B6914 (earth) | #6B4226 | #FF6B35 |
| 2 | #5C4033 (leather) | #CD853F (bronze) | #996515 | #F1C40F |
| 3 | #4A3728 (dark stone) | #C41E3A (roman red) | #B8860B | #E8E0D0 |
| 4 | #2C2C2C (iron) | #4682B4 (steel blue) | #808080 | #DAA520 |
| 5 | #1C2833 (navy) | #2C3E50 (uniform) | #F1C40F | #ECF0F1 |
| 6 | #1A1A1A (soot) | #D4A017 (amber) | #B87333 | #C0C0C0 |
| 7 | #1C1C1C (military) | #556B2F (olive) | #808000 | #FF4500 |
| 8 | #0A0A2E (space) | #00CED1 (cyan) | #E040FB | #39FF14 |

### Unit Button Improvements
- Each button shows a miniature (12×12) version of the unit sprite
- Cost shown with small gold coin icon (3×3 yellow circle)
- Cooldown: dark overlay sweeps upward as timer counts down
- Can't afford: entire button desaturated to greyscale
- Ready to spawn: subtle pulse glow at button border (ease-in-out, 1s period)

### Hero Bar Improvements
- Hero portrait: 20×20 version of hero sprite in dedicated slot
- HP bar underneath portrait
- Ability icons: 2 small (12×12) icons with cooldown sweep
- Dead hero: portrait goes grayscale with red X overlay, "Next Age" text

---

## 12. SCREEN EFFECTS & JUICE

### Hit-Stop (Impact Pause)
```
When: Heavy hit (>30 damage) or critical counter-bonus hit
Duration: 50ms (3 frames at 60 FPS)
Effect: Entire game logic pauses, attacker and target freeze mid-animation
Visual: Slight zoom (1.02x) on impact point
Audio: Punchy impact sound triggers during freeze
```

### Screen Shake Tiers
```
Tier 1 (Light): Infantry death, normal hit
  - Duration: 100ms, Magnitude: 1px, Decay: ease-out

Tier 2 (Medium): Heavy unit death, turret hit, hero ability
  - Duration: 200ms, Magnitude: 3px, Decay: ease-out

Tier 3 (Heavy): Base hit, special ability, boss phase change
  - Duration: 300ms, Magnitude: 5px, Decay: ease-out
```

### Kill Combo System
```
3 kills within 3 seconds → "COMBO x3!" (yellow, scale up 1.5x over 200ms)
5 kills → "COMBO x5!" (orange, scale up 1.8x, screen shake light)
10 kills → "MEGA COMBO x10!" (red, scale up 2.0x, screen shake medium, particles)
```

### Evolution Cinematic (3 seconds)
```
0.0s: Camera starts zooming to player base (1.0x → 1.3x over 1.5s)
0.3s: Gold particles start rising from base
0.5s: White flash (opacity 0→1→0 over 300ms)
0.8s: Base crumble animation begins (old structure breaks apart)
1.2s: New structure builds up from base (appears piece by piece)
1.5s: Camera reaches max zoom
1.8s: Age name text appears in center ("MEDIEVAL AGE", large, gold)
2.0s: Camera zooms back out (1.3x → 1.0x over 1.0s)
2.2s: Celebration particles (fireworks pattern, 20-30 gold/age-color particles)
2.5s: Text fades out
3.0s: Normal gameplay resumes
```

### Low HP Warning
```
Trigger: Player base HP < 25%
Effect: Red vignette border (inner shadow)
  - Alpha oscillates: 0.1 → 0.3 → 0.1 (period: 1.5 seconds)
  - Overlay shape: full-screen rectangle with radial gradient (clear center, red edges)
  - "BASE CRITICAL!" text flashes in top bar (every 3 seconds)
  - Heartbeat audio effect (optional)
```

---

## 13. WEATHER VISUAL EFFECTS

| Weather | Visual Effect | Implementation |
|---------|--------------|----------------|
| **Rain** | Diagonal blue lines falling across screen + blue tint overlay (alpha 0.05) | 30-50 thin (1px) blue rectangles, velocity (2, 8), wrap when off-screen |
| **Fog** | White-grey overlay (alpha 0.15) + reduced visibility (darken edges) | Full-screen rectangle with gradient (clear center, opaque edges) |
| **Sandstorm** | Yellow-brown particles blowing horizontally + amber overlay (alpha 0.08) | 20-30 small particles moving right-to-left, varying speeds |
| **Lightning Storm** | Random bright flashes + bolt sprites | Every 3s: full-screen white flash (50ms) + forked line drawn from top to random point |
| **Solar Flare** | Golden overlay (alpha 0.06) + cyan energy particles floating upward | Warm tint + 10-15 slow-rising particles |

---

## 14. TERRAIN ZONE RENDERING

| Terrain | Ground Color | Border | Detail Elements |
|---------|-------------|--------|-----------------|
| **River** | #4488FF (alpha 0.12) | 1px #2266CC | Animated wave lines (2-frame shimmer), small white foam dots |
| **Bridge/Choke** | #AA8844 (alpha 0.15) | 2px #886633 | Wooden plank texture (horizontal lines), rope railings |
| **High Ground** | #886644 (alpha 0.12) | 1px #664422 | Elevated grass patches, small boulders, "↑" arrow indicator |
| **Forest** | #44AA44 (alpha 0.10) | None | Tree canopy shadows (dark green splotches), leaf particles falling |
| **Ruins** | #888888 (alpha 0.10) | 1px #666666 | Broken column bases, scattered stone blocks, cracked floor |
| **Open Plains** | None | None | Just the normal ground |

---

## 15. IMPLEMENTATION STRATEGY

### Phase A: Download Free Assets (Day 1)
1. Download War of the Ages sprite sheet from OpenGameArt (CC0)
2. Download Tiny Swords Free Pack from itch.io
3. Download Free Dino Sprites from OpenGameArt
4. Download Explosion/Fire VFX sprites from OpenGameArt
5. Download pixel art health bars/UI elements
6. Place all in `assets/downloaded/` directory
7. Create `assets/LICENSES.md` documenting source and license for each asset

### Phase B: ProceduralSpriteFactory (Days 2-4)
1. Implement factory that draws all 32 units + 8 heroes using Phaser Graphics
2. Follow exact specs from Section 4 and 5 above
3. Generate textures once in preload, cache by unitId
4. Test: every unit visually distinct at game zoom level

### Phase C: Extract + Integrate Downloaded Assets (Days 3-5)
1. Extract usable sprites from downloaded packs
2. Resize/recolor to match our palette system
3. Create sprite atlases for efficient loading
4. Integrate into ProceduralSpriteFactory as alternatives to procedural versions
5. Use downloaded assets where they're higher quality than procedural

### Phase D: Base + Background Art (Days 4-6)
1. Implement BaseRenderer with 8 age-specific designs
2. Implement BackgroundRenderer with 3-layer parallax per age
3. Add background transition on age evolution

### Phase E: Animation System (Days 5-7)
1. Implement multi-frame sprite rendering (idle, walk, attack, death)
2. Add hit-flash (white tint for 1 frame on taking damage)
3. Add attack anticipation frames
4. Add death animations with weapon drop

### Phase F: VFX Polish (Days 6-8)
1. Implement all 17 particle effects from Section 10
2. Add hit-stop (50ms freeze on heavy hits)
3. Add screen shake tiers
4. Add evolution cinematic sequence
5. Add kill combo counter

### Phase G: UI Theme (Days 7-9)
1. Implement HUD color theming per age
2. Add unit sprite thumbnails to buttons
3. Add hero portrait to ability bar
4. Add weather display to top bar

### Phase H: Final Polish (Days 9-10)
1. Quality checklist pass (Section 16)
2. Performance optimization (ensure 60 FPS with full effects)
3. Accessibility check (colorblind modes with new palette)
4. Screenshot/promotional material generation

---

## 16. QUALITY CHECKLIST

Before considering visuals "done", verify ALL of these:

### Readability
- [ ] Can you identify unit TYPE (infantry/ranged/heavy/special) at a glance?
- [ ] Can you identify unit AGE at a glance?
- [ ] Can you tell player units from enemy units instantly?
- [ ] Can you tell which age you're in without reading text?
- [ ] Is the hero visually distinct from regular units?
- [ ] Are turrets distinguishable from each other?

### Diversity
- [ ] Are at least 4 different skin tones visible in a full 8-age game?
- [ ] Do units from different ages look noticeably different from each other?
- [ ] Do heroes have unique, memorable silhouettes?

### Feel
- [ ] Does every attack have visual feedback (particles + flash)?
- [ ] Does every death feel satisfying (animation + particles + screen effect)?
- [ ] Does evolution feel like a REWARD (cinematic moment)?
- [ ] Does winning feel triumphant? Does losing feel dramatic?
- [ ] Do heavy hits FEEL heavy (screen shake + hit-stop)?

### Polish
- [ ] Are there no z-ordering glitches (units behind objects that should be in front)?
- [ ] Do animations loop smoothly with no visible seams?
- [ ] Are particle effects performant (no FPS drops with 100+ units)?
- [ ] Does the HUD match the age's visual theme?
- [ ] Are weather effects subtle enough not to distract from gameplay?

### Consistency
- [ ] Is the outline weight consistent across all units (1px black)?
- [ ] Is the color palette consistent within each age?
- [ ] Do all bases use the same proportional system (64×100)?
- [ ] Are all backgrounds the same layering system (3 layers + ground)?

---

## APPENDIX: ASSET DOWNLOAD URLS

```
# War of the Ages (CC0 — soldiers, tanks, planes, ships)
https://opengameart.org/content/war-of-the-ages-pixel-art-sprite-sheet

# Tiny Swords Free Pack (medieval units, buildings, UI)
https://pixelfrog-assets.itch.io/tiny-swords

# Free Dino Sprites (CC0 — dinosaur characters)
https://opengameart.org/content/free-dino-sprites

# LPC Medieval Fantasy Characters (CC-BY-SA 3.0)
https://opengameart.org/content/lpc-medieval-fantasy-character-sprites

# Toen's Medieval Strategy Pack (CC0 — 308 sprites, 16x16)
https://opengameart.org/content/toens-medieval-strategy-sprite-pack-v10-16x16

# Explosions/Bullets/Fire (CC0 — VFX)
https://opengameart.org/content/explosions-bullets-fire-etc-pixel-art

# CC0 Walk Cycles (animation base)
https://opengameart.org/content/cc0-walk-cycles

# Free Soldier Sprite Sheets (CraftPix — free commercial)
https://craftpix.net/freebies/free-soldier-sprite-sheets-pixel-art/

# Lospec Palette Database
https://lospec.com/palette-list

# Pixelorama (open-source pixel art editor)
https://github.com/Orama-Interactive/Pixelorama
```
