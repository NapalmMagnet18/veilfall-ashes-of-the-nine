---
name: Building The Scene
description: Building the place itself as gameplay and not wallpaper — which terrain kind for which world, marks that carve and paint, the landmark and sightline laws, guidance without a handrail, scale measured in bodies, density that drops with distance, atmosphere with the hour chosen for the feeling, fog that softens the horizon and never swallows it, mood from colour and never from darkness, and sound as part of the build.
---

# Gavi — building the scene

this is line 4 of the build order in `gavi#desenhar-o-jogo` ("the place"), opened up. it comes **after** the verb, the
friction and the scoreboard. a scene is **information** arriving through the eye: every decision answers a question the
player is already asking — *where am I, where am I going, what happened here, what kills me*. decoration that answers
none of the four is weight on the frame.

## pick your row in ten seconds

| the world is | terrain kind | why |
| --- | --- | --- |
| open landscape, hills, coast, valley | `"heightmap"` | one continuous surface, cheap, streams far. **no underside**: no overhangs, no tunnels |
| players dig, build, carve caves | `"voxel"` | the only kind with a real inside |
| an interior with walls and a ceiling | `"3d-rooms"`, in its **own place** | never floor/wall boxes on heightmap |
| flat 2D grid — platformer or top-down | `"tilemap"` (`tileSize`, `generator`, `tileset`) | collision by tile id, not by pixels |
| architecture defines the floor, no ground at all | `"off"` | floating platforms, an arena you built entirely |

| the ask | do this |
| --- | --- |
| a building anywhere on terrain | `flatten` mark **plus** `clear-scatter`, before you spawn it |
| a road, path, river, pond, coast | a mark, never a mesh laid on the ground |
| grass and flowers everywhere | `decorations: { deck: "meadow" }` — one line, GPU-instanced |
| a mood | choose the **hour** (`timeOfDay`), never a cycle, never black |
| "can the player actually get there" | `api.traverseCheck(from, to)`, not faith |
| a forest | scripted trees + decorations. a CDN mesh tree is 1–3 hero pieces per view |

heightmap underground that players **walk** into: dig a deep open pit and build down inside it — ramps, shafts, rooms.
a zone-teleport disguised as a hole reads as "stuck in the ground" the moment arrival is imperfect.

## THE LAW OF THE LANDMARK

> **from any playable point the player can see something big enough to orient by. with no landmark there is no mental
> map — there is a maze.**

- one landmark per area. **height ≥ 3× the tallest thing near it**, and ≥ 25 m if the area runs past 150 m.
- a unique silhouette against the sky, from any side. a landmark you can only identify by its texture is not one.
- **the 8-screenshot test:** 8 captures at random points; the landmark shows up in all 8. at 7 you have already lost
  the player.
- a landmark is not quick to reach: what you reach in 10 s is an objective, not a compass.
- hierarchy is mandatory (a body = 1.8 m): **landmark** 10–25 bodies, 1 per area · **midsize** 2–6 bodies, 3–7 per area,
  splits the space and gives cover · **detail** < 1 body, only where feet go. landmark-and-detail only leaves the
  middle empty — the most common hole. midsize only is clutter with no north.

## a sightline is a promise

if you can see it you must be able to reach it — in **≤ 60 s of walking** — or the block is **obvious and justified**,
legible at 30 m with no text: a chasm, deep water, a railing, fire, a chained gate. an invisible wall makes the player
disbelieve the whole space, not just that wall.

check it with instruments, not faith. two different questions:

```js
// 1. is the landmark actually visible from here? (eye at 1.6 m)
const hit = api.raycast({ x: 0, y: 1.6, z: 0 }, { x: 0, y: 0, z: -1 }, 250);
// null = clear line. something before the landmark = the promise is broken, found for free.

// 2. can a body actually WALK there? colliders existing everywhere is not walkability.
const v = api.traverseCheck({ x: 0, y: 0, z: 0 }, { x: 42, y: 0, z: -18 });
// { traversable: false, reason: "riser_exceeds_autostep", detail: { riser: 0.368, maxStep: 0.3 }, blockedBy: "bridge-slab-7" }
```

that second one is the trap worth memorizing: a bridge of flat slabs stepping **0.368 m** between tops against the
controller's **0.3 m** autostep is unwalkable while every existence probe says the colliders are there.
`traverseCheck` walks the controller's own math and names the blocker. reasons it returns: `riser_exceeds_autostep`,
`slope_exceeds_max`, `gap`, `ceiling`, `destination_below_floor`, `terrain_unloaded`.

## guiding without a handrail

never write "go north". five levers, strongest first:

1. **light.** the eye goes to the brightest point in frame: a lit window at the end of a corridor beats an arrow on the HUD.
2. **warm against cold.** cold background, objective in warm, hue ≥ 60° apart in oklch. never lean on brightness alone —
   a bad monitor and a dropped `renderScale` eat brightness.
3. **converging lines.** fence, rail, ditch, poles all pointing at one place: a single `spline`
   (`kind: "fence"`, `"railway"`, `"powerline"`) is an 80 m arrow.
4. **a worn path on the ground.** a `path` mark 2–3 m wide with `noise` says "people walked here" with no signpost.
5. **the glowing thing at the end.** `emissive` + `emissiveIntensity: 3–6` on an isolated target. emissive costs no
   dynamic light — a hundred emissive lamps cost what one costs. a real `light:` only where light must **fall** on
   somebody.

the test: hand over the area and say nothing. more than 5 s of hesitation, or pointing the wrong way, is a failure of
the guidance, not of the person.

## the rhythm of space

- **squeeze before you open.** a corridor of **2–3 m**, 3–8 s to cross, spilling into a valley of **60 m+** with the
  landmark centered in the frame. the open space is **4–10×** the area of the squeeze before it.
- **the first view of the world is staged on purpose.** spawn facing the landmark, the valley below the eyeline (player
  2–6 m above it). you get one frame, once: treat it as cover art.
- after the peak, a trough — a medium area, few dangers, one trace to read. open-open-open tires as fast as
  tight-tight-tight.

## scale is measured in bodies

a body = **1.8 m**. `y: { terrain: 0 }` sticks to the ground and survives terrain edits (never guess an absolute Y);
`api.getTerrainHeight(x, z)` returns the authoritative height, or `null` when the place has no terrain at all.

| thing | the measurement that reads as real | thing | the measurement that reads as real |
| --- | --- | --- | --- |
| a door for people | 2.1 m × 1.0 m | house ceiling / hall ceiling | 2.6–3.2 m / 6–10 m |
| corridor for one / for two | 2.0 m / 3.0 m | a step | rise **≤ 0.30 m** (autostep), tread 0.30 m |
| a walkable ramp | < 30° — steeper refuses | a ditch that hides a standing body | 2.5 m deep |

**the giant-door mistake:** a 4 m door, a handrail at chest height, a 2.5 m chair. big scale "looks epic" from above in
the editor — in the game the character becomes a child on a theatre set. a monumental gate has **a 2.1 m door cut into
it** so the eye has a reference.

## density drops with distance

close up you build, far away you suggest. **0–25 m:** detail the foot nearly touches — its own geometry, traces,
collision, spatial sound. **25–80 m:** midsize masses and a legible silhouette, colour in blocks, zero fine detail.
**80 m+:** silhouette, fog and distant light — a mountain, a tower, one point of emissive.

never scatter a big CDN mesh as a forest (millions of triangles, no LOD). the layers, with their real numbers:

- **ground cover** is `terrain.decorations` — GPU-instanced, thousands free. `decorations: { deck: "meadow" }` is a
  complete alive field in one line; decks are `meadow`, `clover`, `alpine`, `autumn`, `lavender`, and the object form
  targets materials and scales density: `deck: { name: "meadow", on: ["grass"], density: 0.5 }` (0–4). authored
  ground-cover reach is **100 m**; on desktop it is full through ~175 m and gone by ~245 m — anything that must read
  past that is geometry, not decoration.
- **population trees** are scripted geometry (~100 tris each), varied by `seed` and by `variation.scale` / `yaw`.
  a **scatter** bed caps at **500** per bed — more carpet means more beds, or decorations instead.
- **hero mesh** — a conjured CDN tree leaning over the water, three at a gate. **1–3 per view**, never the canopy.
- distant repeating ground reading as a stamped pattern: `antiTiling: "stochastic"` on that terrain material. never on
  bricks or stripes — the jitter cross-fades structured art into ghosting.

## atmosphere: the hour and the fog

the physical sky derives sun, ambient and reflection from the hour itself. do **not** author `sun`, `ambient` or
`hemisphere` in an open scene, and never move the sun per frame in `update`.

```js
api.patchAtmosphere({
  sky: { kind: 'realistic', model: 'hosek' },
  timeOfDay: 16.2,                                     // an HOUR, not a cycle
  fog: { kind: 'linear', near: 140, far: 520 },        // no color: the procedural sky tints the fog
  clouds: { density: 0.45, opacity: 0.8, speed: 0.6 }, // density IS coverage: 0.15 wisps, 0.45 fair, 0.85 overcast
  wind: { direction: [0.7, 0.3], speed: 1.2 },         // every blade of decoration bends this way
  stars: { enabled: true, milkyWay: 0.4 },
});
// a real day/night is ONE key: api.patchAtmosphere({ cycle: { lengthSeconds: 600 } })
// getLogs() confirms it with an "[atmosphere] cycle active" line at patch time.
// night for ONE player (a curse, night vision) — a client-local layer with an id to undo:
// const id = api.pushAtmosphere({ timeOfDay: 0, sun: null, moon: { enabled: true } }, { fade: 2, player: playerId });
// api.clearAtmosphere(id) fades it out and hands the authored sky back.
```

changing `fog.kind` **replaces** the fog object (no residue from the old type); same-kind patches keep merging.
`exp2` (`{ kind: "exp2", density: 0.01 }`) never saturates — good for humid air, bad for hiding the end of the world.
floating islands with nothing below: `ground: false` turns the sky full-sphere with real haze under the horizon.
a `pushAtmosphere` driven by **saved** state runs on every client — pass `{ player: playerId }` or you paint everyone's sky.

### time of day is a choice of feeling

do not open on the golden hour every time: golden on everything is the sepia of 3D — it erases the difference between areas.

| feeling | timeOfDay | fog | colour / sky | visual density |
| --- | --- | --- | --- | --- |
| welcoming, safe | 10.5 | linear 300/700 | warm yellowish, clouds 0.2 | medium, detail up close |
| epic, arrival | 17.5 | linear 120/450 | orange against blue shadow | low up close, silhouette far off |
| melancholy, ruin | 6.5 | exp2 0.012 | blue-grey, clouds 0.6 | sparse, traces on the ground |
| oppression, fear | 21.5 | linear 8/45 | cold blue + one warm emissive (`gavi#genero-terror`) | tight, low ceiling |
| childlike, party | 12.0 | linear 400/900 | saturated, clouds 0.3 | high, colourful, no hard shadow |
| storm | 15.0 | exp2 0.03 | clouds 0.85, wind 3.0 | medium, everything moving |

**mood comes from colour, never from darkness.** sky lightness (oklch L) **≥ 0.25**, always; an authored `ambient`
never below **0.5**, and an interior under `3d-rooms` wants ambient **≥ 1.0** because it has no sky at all. fear is
**cold blue** — black does not frighten, it reads as a render failure. fog **softens the horizon, it never swallows
it**: base linear **300/600**, staged views tighter (120/450), and `far` ≥ 6× the playable radius in an open scene.

## terrain is level design

- **a ridge that divides.** 3 m above the eyeline (1.6 m) cuts the view: two areas, one world.
- **a gully that hides.** 2.5 m deep hides a standing body — a flank, a hiding place, a shortcut.
- **high ground worth defending.** 4–8 m above the valley, one or two climbs under 30°. high ground with four ways in
  is not worth defending.
- **a shoreline is drawn by the terrain, not by the water.** land meeting the water plane at full slope is the "cliff
  dropped in a pool" look. flatten the slope to near-zero for several meters either side of the waterline, band the
  materials (sand from just under the waterline to a little above, dry grass after), and let the foam sit on the seam.

the marks tell the story: a worn `path` where life passes, `flatten` where somebody built, `clear-scatter` under every
floor or grass grows up inside the house.

```js
api.addMark('gate-pad', {                              // the flattened footing BEFORE the path
  kind: 'flatten', center: { x: -40, z: 12 },
  height: { terrain: 0 },                              // terrain-relative, never an absolute Y
  shape: { kind: 'circle', radius: 9 }, falloff: 4, falloffCurve: 'smooth',  // 'cliff' for a mesa, 'linear' for a ramp
});
api.addMark('valley-trail', {
  kind: 'path',                                        // 'path' = soft edge; 'road' = hard edge
  points: [[-40, 12], [-22, 26], [-4, 33], [18, 30]],
  width: 2.6,                                          // 2–3 m: the width of people, not of a truck
  material: 'dirt', edgeMaterial: 'grass',             // ids that EXIST in terrain.materials
  noise: 0.35, falloff: 1.5,                           // ragged edge = trodden, not drawn
});
api.addMark('gate-clear', { kind: 'clear-scatter', center: { x: -40, z: 12 }, shape: { kind: 'circle', radius: 10 } });
```

marks are written **by name** — `addMark` / `updateMark` / `removeMark` — and no call can touch a mark it does not name.
`flatten` **overrides the generator** inside its own area: editing `heightAt` changes nothing where a mark sits, so
update the mark too. water splits in two: **ocean** `liquidLevel` is an absolute Y that never moves and drowns what it
covers (inside its bounds only terrain rising ~14 m above the waterline survives as an island), while **river and pond
find their own level** from the banks — raise the ground and the water rises with it, so you never author their Y.
carve order, coast profiles and overlap rules: `heightmap-terrain`.

## a trace is narrative

every cluster answers **who, what, when, why**. answering only "what" makes it decoration. 3–7 pieces, and **one piece
that is wrong** — the toppled chair, the dead fire with the pot still on it, the vegetable patch better tended than the
rest of the village. the player does not read the story, she deduces it, and deducing is playing.

```js
// a camp abandoned in a hurry: the root is positioned, the pieces sit at LOCAL offsets
const root = api.spawn('camp-in-flight', {
  properties: { feetPosition: { x: 24, z: -60, y: { terrain: 0 } }, rotation: { yaw: 35 } },
});
const piece = (id, props) => api.spawn(id, { parent: root, properties: props });

piece('dead-firepit', {       // WHEN: cold, charcoal, no flame
  feetPosition: { x: 0, y: 0, z: 0 }, physics: 'static',
  primitive: { kind: 'cylinder', radius: 0.55, height: 0.18 },
  material: { color: 'oklch(0.28 0.02 40)', roughness: 0.95 },
});
piece('pot-on-the-stone', {   // WHAT: a meal interrupted
  feetPosition: { x: 0.35, y: 0.18, z: 0.15 }, primitive: { kind: 'sphere', radius: 0.16 },
  material: { color: 'oklch(0.42 0.03 60)', metalness: 0.6, roughness: 0.5 },
});
piece('toppled-bench', {      // WHY: they ran — degrees, knocked over, not tidied away
  feetPosition: { x: -1.2, y: 0, z: 0.8 }, rotation: { roll: 96, yaw: -20 }, physics: 'static',
  primitive: { kind: 'box', width: 1.1, height: 0.12, depth: 0.34 },
  material: { texture: 'cdn/texture-wood-plank.png', color: 'oklch(0.5 0.05 60)', textureScale: 1 },
});
piece('forgotten-toy', {      // WHO: there was a child here
  feetPosition: { x: 1.6, y: 0, z: -0.9 }, material: { color: 'oklch(0.68 0.16 25)' },
  primitive: { kind: 'box', width: 0.18, height: 0.18, depth: 0.18 },
});
piece('dying-embers', {       // the cluster's own sound, short range
  feetPosition: { x: 0, y: 0.4, z: 0 },
  audio: { clip: 'cdn/sfx-ember-crackle-low.mp3', loop: true, gain: 0.18, maxDistance: 9 },
});
```

house, tower and roof are **one** generator root (`gavi#criar-modelo-3d` LAW 4). a building with no suggested interior
is a vice: either you really go in (a `3d-rooms` place), or the window is emissive glass with a shape behind it, or it
is far enough away not to matter.

## the sound of the place, underneath everything

- **the bed:** one non-spatial loop per area — `audio: { clip, loop: true, gain: 0.25, spatial: false }`. two of them
  stack and turn into hiss.
- **an anchor:** one spatial loop per feature — `audio: { clip, loop: true, gain: 0.3, maxDistance: 20 }`. one per
  lake, not four around the same lake: ambient gains add up, and four lake loops is one lake at 4×.
- **one-shots** spike above the bed: `api.playSound(clip, { position, volume: 0.4–0.8, maxDistance })`. a looping
  birdsong clip sings every second of the session — use sparse one-shots, or a bed layer at ≤ 0.15.
- the soundtrack is the jukebox, not an object in the world: `api.music.play("cdn/music-...mp3", { fadeMs: 800 })`,
  served to every player including future joiners at the same position. total silence reads as a bug — a quiet area
  still has a faint wind.

## the handoff: how one area delivers the next

1. the next area is **seen before it is reachable** — from the ridge, through the gap, across the broken bridge.
   seeing it first creates wanting; arriving without having seen it is a corridor.
2. the exit frames the **next landmark** in the middle of the opening. check by looking, camera at the mouth of the pass.
3. from the last frame of the old area to the first frame of the new one, **one** strong thing changes — colour, hour,
   or sound. changing everything disorients.
4. stitching a `place` (interior, dungeon, arena) is `api.enterPlace(...)`; a contiguous interior does not become two
   places on a whim.
5. a way back is mandatory. a one-way street with no warning is playtest complaint number one — and it gets found by
   walking the whole spine, not by looking at one frame (`gavi#testar-tudo`, `gavi#cacar-bugs-jogando`).

## how it goes wrong

1. **empty ground.** TELL: 30 m of nothing between two objects, and the walk between them is dead time.
   FIX: the midsize layer — 3–7 pieces per area, plus ground cover until no raw dirt shows (`deck: "meadow"` is one line).
2. **atmosphere on autopilot.** TELL (a): the horizon is erased at 40 m in an open scene and the landmark you built is
   gone — fog `far` ≥ 6× the playable radius, base linear 300/600, sky L ≥ 0.25. darkness is not mood. TELL (b): three
   areas that photograph identically and nobody can say which one they are standing in — one hour per area, ≥ 3 h
   between neighbours, one thing changing at every handoff.
3. **a promise you cannot keep.** TELL: the player walks 40 s toward the tower and stops against nothing, or climbs a
   staircase that refuses halfway. FIX: `api.raycast` for the sightline and `api.traverseCheck` for the walk — a
   0.368 m riser against a 0.3 m autostep is invisible to every existence probe.
4. **a building dropped on raw terrain.** TELL: grass sprouting through the floorboards, one corner of the foundation
   floating, rock poking through a wall. FIX: `flatten` + `clear-scatter` **before** the spawn, foundation down to
   `y: -10`, and remember `flatten` overrules the generator in its own area.
5. **light made of real lamps.** TELL: the frame collapses with the lights on and the scene goes black with them off.
   FIX: emissive does the glow (a hundred bulbs cost what one costs); a real `light:` only where light must fall on
   somebody — the doorway spill, the fire on faces.
6. **a mute or hissing soundscape.** TELL: either dead silence that reads as a bug, or a wash where you cannot tell
   the lake from the forest. FIX: one bed at 0.25 per area, one spatial anchor at 0.3 per feature, one-shots at
   0.4–0.8 above it.

## what this skill refuses

- decorating before a verb, friction and a scoreboard exist (`gavi#desenhar-o-jogo`); an area with no landmark; a
  blocked path with no visible reason.
- saying it came out good without looking from the player's eye, at the game's hour, at the game's distance — the same
  demand as `gavi#animar-doutrina`.