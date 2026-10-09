---
name: Native 3D Game
description: What makes a native 3D game in this engine read as professional and advanced instead of as a prototype — the Genie 3 bar told honestly (a world model hallucinates frames, not geometry, and cannot be imitated architecturally) plus the five things it DELIVERS as the real target; the scale and camera numbers that are the biggest amateur tell (1 unit = 1 m, fov by perspective, the engine's fixed clip planes, eye height × scale.y); light that reads as rendered and the sky probe an authored ambient silently kills; PBR value ranges with textureScale in metres per tile; form by silhouette; coherence, the thing hand-built worlds lose; walk-anywhere with no invisible wall; the motion numbers that stop a character sliding; a runnable scene at this bar; symptom → cause → fix.
---

# Gavi — a native 3D game that reads professional

## the bar the creator named, told straight

Genie 3 (DeepMind, announced 5 Aug 2025) is a **world model**: from one sentence it generates a navigable
photorealistic world at 720p / 24 fps, holds visual consistency for minutes, remembers an object you looked away from,
and accepts *promptable world events* that change the world while you stand in it. And it **hallucinates frames, not
geometry**. There is no mesh, no collider, no spec — nothing for a raycast to hit, nothing to save, nothing to edit.
**Nobody here can imitate its architecture**, inside this engine or any other, and a skill that pretends otherwise is a
lie shipped to a creator. Say that once, out loud, and never again — because what it *delivers to the player* is a
genuinely great design bar, and every line of it is buildable here.

| what Genie 3 delivers | who owns it here |
| --- | --- |
| **1. the world came from a sentence** | `gavi#mundo-por-prompt` — text → LLM job → validated contract → terrain, marks, atmosphere, spawns |
| **2. you can walk anywhere — no loading seam, no invisible wall** | **§6 of this skill** |
| **3. light, scale and material stay coherent in every corner** | **§1–§5 of this skill** — the whole professional/amateur line |
| **4. the world remembers what you did to it** | `gavi#mundo-por-prompt` (persistence) · `gavi#genero-sandbox` (persistence before tooling) |
| **5. the world changes on command, mid-session** | `gavi#mundo-por-prompt` — the whitelisted verb router |

This skill owns 2 and 3: the craft that makes a world of real geometry read as **rendered** rather than as **assembled**.

## route it in ten seconds

| the ask | skill | why not here |
| --- | --- | --- |
| "a 3D game that looks professional / advanced / like Genie 3" | **this one** | it is the whole-world bar: scale, camera, light, material, coherence, seams, feel |
| "make me a cart / tower / rifle / creature" — one thing's form | `gavi#criar-modelo-3d` | that skill owns the pipe, the vertices and the collider of a single object |
| "which pipe, which style, what is this thing made of" | `gavi#modelo-qualquer-estilo` | the router across conjured / primitive / scripted / painted |
| "build the map, the forest, the village, the atmosphere" | `gavi#fazer-cenario` | terrain kinds, marks, landmark law, density layers, the hour table |
| "judge it / it still looks unfinished / find the flaw" | `gavi#qualidade-sem-falha` | the ruler and the full symptom catalogue; §7 here is only the 3D-native subset |
| "make it feel like Zelda / Minecraft / Portal" | `gavi#jogos-famosos` | teardown of the loop, not the render |
| world from a prompt · the world changes on command · it remembers | `gavi#mundo-por-prompt` | deliverables 1, 4 and 5 above |

Load order for a full native-3D build: `gavi#desenhar-o-jogo` (the verb) → **this** (the bar) → `gavi#fazer-cenario`
(the place) → `gavi#criar-modelo-3d` (the things) → `gavi#qualidade-sem-falha` (the judgement).

---

## 1 — SCALE AND CAMERA: the single biggest amateur tell

Wrong scale reads as *fake* before the player can say why. **1 unit = 1 metre**, everywhere, no exceptions, and
`feetPosition` is the **base** of the volume, not its centre.

| thing | metres | thing | metres |
| --- | --- | --- | --- |
| a body | **1.75–1.8** (the mod's ruler rounds to 1.8) | interior habitable ceiling | **2.7–3.5** |
| a door for people | **2.1** tall × 1.0–1.2 wide | hall / atrium ceiling | 6–10 |
| a stair step | rise **0.16–0.19**, tread 0.28–0.30 | table / seat / counter | 0.75 / 0.45 / 0.9 |
| corridor for one / for two | **1.8–2.4** / 3.0 | barrel / crate | 0.9 / 0.6 |
| a walkable ramp | **< 30°** — steeper refuses | a ditch that hides a standing body | 2.5 deep |

A stair rise **above 0.30 m is a wall**: the character controller's `physics.autostep` defaults to
`{ maxHeight: 0.3, minWidth: 0.2 }`, so a 0.37 m riser is unclimbable while every collider probe says the geometry is
there (§6). Measure, never eyeball: `api.getWorldBoundsBox(id).size.y` against this table, and
`layout: { maxExtents: {...} }` — never a guessed `scale` on top of a `scale` — when a conjured model must match a
footprint.

**The camera is the other half of scale.** Cameras are scripts (`camera-first-person`, `camera-third-person`,
`camera-isometric`); what belongs here is the numbers.

- **`fov` is VERTICAL degrees**, default **60**, authored on the camera def (`api.patchCamera({ fov: 74 })`) or driven
  live from the *player* behavior with `api.setCamera({ fov })` — `cameraApi` has no `setCamera`.
  **first person 70–80** (below ~65 an FPS feels like looking through a tube; above ~85 the hands fisheye) ·
  **third person 55–65** (a wide fov behind a character flattens the world and shrinks the hero) ·
  **isometric / top-down: fov is meaningless** — put `orthoSize` in the camera state
  (`state: { orthoSize: 18 }`) and the projection goes orthographic; `orthoSize` is the **half-height in metres**, so 18
  frames 36 m vertically. Pixel-art ortho adds `pixelSnap: true`.
- **Clip planes are the engine's, not yours.** The camera spec exposes `fov` only; the engine runs
  **near 0.1 / far 1000** (its own doc notes up to 3000 on desktop). That is deliberate: a depth buffer spends its
  precision hyperbolically over the near:far ratio, so a "just make far 100000" camera would trade every distant
  surface for z-fighting. You never author the ratio — which also means **distant shimmer in this engine is never the far
  plane's fault** (§7 names the three real causes).
- **`fog.far` is a streaming lever, not only a look.** Terrain streaming clamps its radius to
  `min(linear fog far, camera clip far)` — so `fog: { kind: "linear", near: 300, far: 600 }` also declares how far the
  ground is allowed to exist. Fog `far` ≥ **6× the playable radius** in an open scene, and a landmark beyond the fog far
  is a landmark that does not stream.
- **Eye height 1.6–1.7 m, scaled by the body:** `eyeY = target.feetPosition.y + 1.6 * target.scale.y`. A fixed 1.6 on a
  shrunk player stares into a wall their body fits under. Too low (1.2) and the player feels like a child on a set; too
  high (2.2) and every doorway reads short and the world reads like a model railway. Crouch **lowers the eye line, never
  the pitch**: `{ stand: { eye: 1.6, cap: 1.8 }, crouch: { eye: 0.9, cap: 1.1 }, prone: { eye: 0.35, cap: 0.5 } }`, with
  `physics: { body: "character", capsule: { height: cap } }` as the hitbox verb.
- **Pitch clamps at ±1.47 rad** (camera state is RADIANS; `api.getCamera()` answers degrees). Beyond it the engine
  gimbal-locks. Look feel is one constant: the rig's `SENSITIVITY`, or the def's `sensitivity` (default 3) on a
  declared `orientation: { source: "look" }` rig.

---

## 2 — LIGHT THAT READS AS RENDERED, NOT AS LIT

A professional 3D frame has **one key direction** and a soft fill that never fights it. An amateur frame has four
lights of similar strength from four directions and reads flat and dirty.

- **Outdoors, do not author light at all.** `sky: { kind: "realistic", model: "hosek" }` + `timeOfDay` derives the sun,
  the ambient, the reflections and the fog tint from the hour. Verified engine behaviour worth memorising:
  **authoring `ambient` or `hemisphere` in the atmosphere block forces the sky's derived ambient (the IBL probe) to
  0** — your "extra fill" *replaces* the physically correct one and the scene goes flatter, not brighter. Confirm the
  live sun any time with `api.getAtmosphere().sunState` (`null` = nothing lights this place).
- **`hemisphere` is for places with no sky**: a `3d-rooms` interior, a `sky: { kind: "color" | "gradient" }` stylised
  place, a cave. That is where sky/ground bounce has to be authored to give plain boxes form without a single cast
  shadow: `hemisphere: { skyColor, groundColor, intensity: 0.6–1.2 }` — sky colour cool, ground colour the actual floor's
  hue, and the two must differ or it is just ambient with extra steps.
- **Ambient stays LOW-ish and never zero.** The renderer's flat default is 1.0; an authored `ambient` **≥ 0.5** outdoors
  (below that faces in shadow go to mud), **≥ 1.0** in a skyless interior. High ambient (≥ 2) erases every form: it is
  the fastest way to make good geometry look like a greybox.
- **Real lights only where light must FALL on something.** `point`/`spot` are clustered and cheap; **shadows are the
  scarce resource** (nearest shadow-casters hold 8/24/48 atlas slots by device tier, none on low-end; a spot shadow costs
  ~1/6 of a point). Honest radii: `distance` **6–12** for props, `intensity` **2–6** for a lamp, `angle` 0.5–0.9 with
  `penumbra` 0.3–0.5 for a spot. Never enable shadows on the atmosphere sun — it already casts.
- **A hundred glow points are `emissive`, not lights.** `emissive` + `emissiveIntensity` **3–6** on windows, bulbs,
  panels, runes: batched, zero dynamic-light cost, and it holds its glow however dark the hour.
- **Mood is colour, never darkness.** Sky lightness (oklch L) **≥ 0.25** always. Horror is **cold blue with one warm
  emissive**, never black — black reads as a render failure, not as fear (`gavi#genero-terror`).
- **The hour is a choice, not a default.** `timeOfDay: 12` (noon, no shadows to read by) and `17.5` (golden on
  everything) are the two defaults that make every area photograph the same. Pick the hour for the feeling and give
  neighbouring areas **≥ 3 h** of separation; the table lives in `gavi#fazer-cenario`. A moving sun is
  `cycle: { lengthSeconds }` — never a per-frame sun write. One player's private night is
  `api.pushAtmosphere({...}, { fade: 2, player: playerId })` / `api.clearAtmosphere(id)`.
- Whole-screen grade (bloom dials, vignette, film) is a **look script** — `atmosphere.look = { script, params }`, the
  `looks` skill. A keyed "darken the sky only" grade fringes every silhouette edge; night is a **relight**
  (`pushAtmosphere`), never a repaint.

---

## 3 — MATERIALS: this is where professional and amateur separate

Geometry gets forgiven. Surface does not. Every value below is a real-world range, not taste.

| surface | `metalness` | `roughness` | note |
| --- | --- | --- | --- |
| polished steel, chrome, brass | **1.0** | 0.2–0.35 | bare metal with no albedo becomes a mirror — give it a texture |
| brushed / worn metal | 0.9–1.0 | 0.4–0.55 | |
| **painted** metal, plastic, ceramic | **0** | 0.4–0.6 | paint is not metal — the single most common material error |
| wood, leather | 0 | 0.7–0.85 | |
| stone, brick, concrete | 0 | 0.85–0.95 | |
| cloth, sand, dirt, chalk | 0 | 0.95–1.0 | glass: metalness 0, roughness 0.05, `opacity` 0.2–0.3 |

1. **`metalness` is binary.** 0, or 0.85–1.0. A value near 0.5 does not exist in nature and reads as dirty rubber.
2. **One roughness across a whole object is an amateur's signature.** Vary it by region on the same mesh — timber 0.8,
   ironwork 0.45, glass 0.05 — with `ctx.metalness()` / `ctx.roughness()` (stateful, they hold for every face after) or
   `G.surface(ctx, { ..., jitter: 0.10 })` for per-face grain.
3. **Albedo lives between ~0.04 and ~0.85.** Fresh snow tops out near 0.85, coal bottoms near 0.04; asphalt is ~0.08,
   grass ~0.2, skin ~0.35, concrete ~0.5. **Pure `#000` and pure `#fff` albedo never occur in nature** — a black
   authored as L 0 has no shading information left to catch light with, and reads as a hole.
4. **`textureScale` is METRES PER TILE** (default 2.5). This is the single most common surface bug in this engine.
   `textureScale: 2` = one tile every 2 m — so on a 0.45 m face, `textureScale: 1` shows you **45 % of the image**: a
   crop, not a bug. A face that must show one whole image (a sign, a poster, a portrait) wants `repeat: [1, 1]`. Terrain
   materials read the same way; the value flipped meaning on 2026-08-01, so a world authored before then converts as
   `new = 2.5 / old`.
5. **`color` next to a `texture` is a TINT, and a tint MULTIPLIES the map.** The engine renames `color` → `tint`
   whenever a map is present, so a saturated tint repaints the art's hue and a dark tint eats it. Neutral/light tints
   stand in before a texture cooks; omit `color` entirely to show a texture's own palette.
6. **`pbr: true`** with a raster albedo derives normal/roughness/metalness maps — the cheapest single upgrade from
   "coloured" to "surfaced".
7. **Never ship a flat-grey surface.** A mesh with no material is grey plastic and undoes good form instantly. Flat
   vertex colour is a **finished** look only inside the flat families (`lowpoly-cozy`, `voxel-bright`, `pixel-bright`,
   `pixel-moody`); outside them it reads unfinished.
8. Distant ground reading as a stamped repeat: `antiTiling: "stochastic"` on that terrain material — never on bricks,
   stripes or glyphs, where the jitter cross-fades structured art into ghosting.
9. A living surface (canopy, fire, water, force field) is the hull **plus** `material: { kind: "scripted", script }` —
   `custom-materials`. Scripted materials do not batch: hero objects, not a forest.

---

## 4 — FORM: silhouette first, at 128 px

`gavi#criar-modelo-3d` owns this lane; the three decisions that show up at *game* scale:

| the thing | pipe | the tell when you pick wrong |
| --- | --- | --- |
| exact parametric shape, ≤ 2 pieces, no oblique edge | single `primitive` | — |
| **prop, structure, vehicle, tower, weapon — most things** | **`primitive: { kind: "scripted" }`** ← the default | 12 entities and 12 draws where 1 fit, plus faces < 5 cm apart flickering from any distance |
| ≤ 24 triangles you can name, or data from a table | `kind: "custom"` | runtime-spawned custom buffers can't be re-derived by a late joiner (`bespoke-geometry-underivable`) — keep them in the spec |
| it must be **rigged and animated** — humanoids above all | conjured GLB | a conjured chair is a paid mint with zero control |

- **The 128 px test:** `preview_object({ objectId, size: 128 })`. If you can't name the object in black at thumbnail
  size, the player can't at 8 m — fix the masses, don't add a screw. Three masses in **1 : 0.6 : 0.3**, and one detail
  puncturing the outline.
- **Wind every face counter-clockwise seen from outside**, one convention per mesh, derived from an outward vector.
  Both sides always draw, so a reversed face is not a hole — it lights wrong and smears the shading along the seam, and
  that is exactly what makes coded geometry look amateur.
- **One generator root per building**, children parented with **local** offsets, positioned and rotated through the root
  only. Bevel every edge (0.004 small / 0.008 furniture / 0.015 architectural) or edges never catch light.
- **A wide mesh conforms with `ctx.groundY(x, z)`** — one ground sample per contact, or one side floats and the other
  buries on the slope.
- Anything touchable carries `physics` (`"static"` at minimum) — without it the beautiful building is a ghost. Prove it
  with `view_live_scene({ colliders: true })`.
- Already 12 boxes deep and z-fighting: `api.unionSolid([ids])` merges them into one solid with the interior faces gone.

---

## 5 — COHERENCE: the thing a world model is best at and hand-built worlds are worst at

Genie 3's every frame comes out of one distribution, so it can't disagree with itself. A hand-built world disagrees with
itself the moment two people (or two lanes, or two sessions) touch it. **Coherence is not a polish pass — it is a set of
constraints you write down before the second object exists.** Keep them in `scripts/lib/data/world.json` and have
terrain, structures and scene setup all read the same file.

1. **One palette.** 5–7 colours: two ground, two structure, one accent (warm, reserved for objectives), one sky family.
   Every new material derives from it or it doesn't ship.
2. **One light direction, world-wide.** One hour per area, and one sun. Two areas lit from opposite sides read as two
   games — this is the strongest "pile of assets" tell there is.
3. **One material vocabulary.** The same three or four surfaces recur: this world's stone, this world's timber, this
   world's metal. A fifth surface needs a reason. Reuse tightens a world faster than any new asset loosens it.
4. **Density that DROPS with distance.** 0–25 m own geometry, traces, collision, spatial sound · 25–80 m masses and
   silhouette, colour in blocks, no fine detail · 80 m+ silhouette, fog and one point of emissive. Uniform density in
   every band is what makes a world read as a diorama.
5. **Landmarks on the sightlines.** One landmark per area, ≥ 3× the tallest thing near it, visible from 8 random points
   out of 8. Prove the line with `api.raycast({x, y: 1.6, z}, dir, 250)`.
6. **Fog that softens the horizon and never swallows it.** Base linear 300/600; a staged view 120/450. `exp2` for humid
   air, never to hide the end of the world.
7. **One hand.** Every corner should answer "same author?" with yes: the same bevel language, the same tint family, the
   same sign typeface, the same wear. Then walk it and take three screenshots 100 m apart — if they could be from three
   different games, the coherence work is not done, however good each frame is.

---

## 6 — NO SEAMS: walk anywhere

The player's belief in a world dies at the first invisible wall. In this engine there are exactly four ways to build
one, and one instrument that finds all four before a player does.

```js
// existence is NOT walkability. traverseCheck walks the character controller's own math.
const v = api.traverseCheck({ x: 0, y: 0, z: 0 }, { x: 42, y: 0, z: -18 });
// { traversable: false, reason: "riser_exceeds_autostep", detail: { riser: 0.368, maxStep: 0.3 }, blockedBy: "bridge-slab-7" }
```

| `reason` | what it really is | fix |
| --- | --- | --- |
| `riser_exceeds_autostep` | a face taller than `autostep.maxHeight` (0.3 m) — **the invisible-wall class**: colliders everywhere, feet can't climb | keep every step ≤ 0.30 m, or ramp it under 30° |
| `slope_exceeds_max` | a continuous surface steeper than the climb limit | reshape the ground in `heightAt`, or add a switchback |
| `gap` | no standable support | bridge it, or make the gap read as a gap |
| `ceiling` | overhead clearance below the capsule height | 2.7 m+ interiors; check under stairs and arches |
| `destination_below_floor` | the walk ends on a floor above the target | you asked about a point inside geometry |
| `terrain_unloaded` | **could not look** — chunks not resident on this realm | re-probe near a player; never read it as "clear" or "blocked" |

- **An explicit `collider: "box"` on a `wall` with `holes` seals the doorway back up.** Leave the collider derived and
  check it with `view_live_scene({ colliders: true })`.
- **A blocked path must be obvious at 30 m with no text** — a chasm, deep water, a railing, fire, a chained gate. If you
  can see it you must reach it in ≤ 60 s, or the block explains itself. `api.overlapSegment(a, b, { radius })` answers
  "can a body this wide pass".
- **Streaming, honestly:** terrain and assets stream per client, bounded by `min(fog far, clip far)` (§1). The renderer's
  own verdict is `api.getWorldResidency()` → `{ resident, pending }` — `resident` flips true only after every asset load,
  chunk build and shader compile has drained and stayed quiet for a **~1.5 s** settle window, and false again when new
  streaming starts. That read — not a timer, not a framerate guess — is what gates a "ready" veil or a lit start button.
  It answers for the machine running the script, so attach that gate to the **player**, not a server-simulated manager.
- **A place is a seam. Use it as a door, never as a level chunk.** One contiguous structure — a tower, a multi-deck ship,
  a house with floors — is **one place** with floors stacked in Y. Mint a place only for somewhere genuinely else
  (dungeon, interior dimension, arena): `api.enterPlace(other.id, { placeId, spawnPoint: "last" })`, and a way back is
  mandatory. `pregenerate: true` on a `definePlace` warms its terrain at load; `api.preloadAsset(ref)` warms the sounds
  and models the far side needs before the door is touched.
- **The transition budget** (a target you hold yourself to, not an engine constant): under ~250 ms the player reads a
  door; past that they read a loading screen, so cover it — a fade, a threshold, a doorway you actually walk through, a
  line of dialogue — and pay for it with `pregenerate` + `preloadAsset` + a residency-gated veil. Never leave the player
  standing in a frozen frame with nothing to look at.
- Arrival is the other half of a seam. A displacement detector (portal reaction, arrival trigger) must skip while
  `api.isSettling()` is true — a reconnect rebaseline moves positions wholesale and is not in-fiction movement.

---

## 7 — MOTION AND FEEL: what stops a 3D character from sliding

| symptom the eye catches | the number |
| --- | --- |
| feet skating over the ground | walk clip ~1.4 m/s and run ~4.5 m/s against real move speed — an `npc:` agent gets speed-matched playback and gait blending for free (`properties.npc { speed, run }`); don't hand-roll a second locomotion script over it |
| feet floating above / sinking into a slope | `ik: { feet: true }` (automatic grounding; `{ feet: { offset } }` for boots or heavy stomps) |
| the body turns away from the crosshair when strafing | drive body yaw from `input.axes.aimYawSin` / `aimYawCos`, and remove every velocity-based yaw writer |
| a teleport smeared into a 40 m slide | `interpolation: { teleportThreshold: 3 }` — beyond that jump the entity snaps instead of interpolating |
| the camera glued rigidly to the body | smooth the **arm length** toward its target (~8–12 per second, `1 - Math.exp(-k * dt)`), never Cartesian XYZ — springing XYZ cuts the chord in turns and visibly compresses the orbit |
| nausea in first person | bob the camera **position** only, never the look direction; 0.03–0.06 m at 1.8–2.2 Hz, scaled by speed |
| a hit that lands with no weight | `api.screenShake(0.3, 0.15)` + `api.hitstop(0.06)` + a positioned `api.playSound` — the contact-moment law is `game-feel` |
| ground that never remembers | `api.decal(position, normal, { texture, size, lifetime })` for scuffs, skids, scorches |

Sensitivity, pitch clamp and fov live in §1. Weapon kick is directional recoil accumulated on pitch — `screenShake` is
random and belongs to explosions, not to a rifle.

---

## 8 — a small scene at this bar, runnable

Terrain with real shape, an hour chosen for a feeling, three material tiers, one landmark on the spawn sightline, an
ambient bed. Paste, then look.

```js
// 1. the ground has shape — four frequencies and a modulator, so some zones stay flat
api.setScript('scripts/terrain-shape.js', `
export function heightAt(ctx) {
  const { x, z, noise } = ctx;
  const mod   = 0.35 + 0.65 * (0.5 + 0.5 * noise.simplex2({ x, z, frequency: 0.0016, seed: 33 })); // flat vs hilly
  const base  = noise.fbm2({ x, z, frequency: 0.004, amplitude: 22, octaves: 4, seed: 7 });
  const ridge = noise.ridged({ x, z, frequency: 0.011, amplitude: 13, octaves: 3, seed: 21 });
  const grain = noise.fbm2({ x, z, frequency: 0.045, amplitude: 1.1, octaves: 2, seed: 9 });
  return base * mod + ridge * mod * 0.7 + grain;
}
export function materialAt(ctx) {
  if (ctx.slope > 0.55) return { rock: 1 };                      // cliffs read as rock, not grass on a wall
  if (ctx.worldHeight > 24) return { rock: 0.6, grass: 0.4 };
  return { grass: 0.85, dirt: 0.15 };
}
`);
api.patchTerrain({
  kind: 'heightmap', seed: 4207, generator: 'scripts/terrain-shape.js',
  materials: [                                                    // textureScale = METRES PER TILE
    { id: 'grass', albedo: 'cdn/texture-grass-meadow.png', pbr: true, textureScale: 2.5, antiTiling: 'stochastic' },
    { id: 'dirt',  albedo: 'cdn/texture-dirt-packed.png',  pbr: true, textureScale: 2.0 },
    { id: 'rock',  albedo: 'cdn/texture-rock-granite.png', pbr: true, textureScale: 3.5, roughnessIntensity: 1.7 },
  ],
  decorations: { deck: 'meadow' },                                // GPU-instanced ground cover, one line
});

// 2. the hour IS the lighting — no authored sun/ambient/hemisphere under a physical sky
api.patchAtmosphere({
  sky: { kind: 'realistic', model: 'hosek' },
  timeOfDay: 8.4,                                                 // early, low key light: long form-revealing shadows
  fog: { kind: 'linear', near: 220, far: 900 },                    // far also caps terrain streaming
  clouds: { density: 0.35, opacity: 0.8, speed: 0.5 },
  wind: { direction: [0.7, 0.3], speed: 1.1 },
  stars: { enabled: true, milkyWay: 0.35 },
});

// 3. flat ground before anything authored lands on it, and no grass through the floor
api.addMark('keep-pad', { kind: 'flatten', center: { x: 0, z: -120 }, height: { terrain: 0 },
  shape: { kind: 'circle', radius: 16 }, falloff: 7, falloffCurve: 'smooth' });
api.addMark('keep-clear', { kind: 'clear-scatter', center: { x: 0, z: -120 }, shape: { kind: 'circle', radius: 18 } });

// 4. three material tiers on one landmark: stone body, timber, warm emissive windows
const STONE  = { texture: 'cdn/texture-stone-block.png', color: 'oklch(0.68 0.02 90)', roughness: 0.9,  metalness: 0, textureScale: 2.5 };
const TIMBER = { texture: 'cdn/texture-wood-plank.png',  color: 'oklch(0.58 0.05 62)', roughness: 0.8,  metalness: 0, textureScale: 1.2 };
const GLOW   = { color: 'oklch(0.78 0.14 78)', emissive: 'oklch(0.78 0.14 78)', emissiveIntensity: 4.5, roughness: 0.4 };
const tower = api.spawn('watch-keep', { properties: {
  feetPosition: { x: 0, z: -120, y: { terrain: 0 } }, rotation: { yaw: 180 },  // facade on +Z faces spawn
  primitive: { kind: 'cylinder', radius: 4.2, height: 26 }, material: STONE,
  physics: { body: 'static', collider: 'box' },
} });
api.spawn('watch-keep-gallery', { parent: tower, properties: {                 // children are LOCAL offsets
  feetPosition: { x: 0, y: 21.5, z: 0 }, primitive: { kind: 'cylinder', radius: 5.1, height: 1.1 },
  material: TIMBER, physics: 'static',
} });
for (let i = 0; i < 4; i++) {                                                  // emissive, not four real lights
  const a = (i / 4) * Math.PI * 2;
  api.spawn('watch-keep-window-' + i, { parent: tower, properties: {
    feetPosition: { x: Math.sin(a) * 4.15, y: 16, z: Math.cos(a) * 4.15 },
    primitive: { kind: 'box', width: 0.9, height: 1.4, depth: 0.2 },
    rotation: { yaw: (a * 180) / Math.PI }, material: GLOW,
  } });
}
api.spawn('watch-keep-lamp', { parent: tower, properties: {                     // ONE real light, where it must fall
  feetPosition: { x: 0, y: 5.4, z: 4.4 },
  light: { kind: 'spot', color: 'oklch(0.86 0.11 78)', intensity: 4, distance: 14, angle: 0.7, penumbra: 0.4,
           aim: 'down', shadow: { enabled: true } },
} });

// 5. the bed — one non-spatial loop for the area, one spatial anchor for the feature
api.spawn('valley-bed', { properties: { feetPosition: { x: 0, z: 0, y: { terrain: 2 } },
  audio: { clip: 'cdn/sfx-wind-open-valley-soft.mp3', loop: true, gain: 0.24, spatial: false } } });
api.spawn('keep-brazier-hum', { properties: { feetPosition: { x: 0, z: -114, y: { terrain: 1 } },
  audio: { clip: 'cdn/sfx-brazier-low-crackle.mp3', loop: true, gain: 0.3, maxDistance: 22 } } });

// 6. spawn facing the landmark, on the ground, and prove the promise
api.patchPlayer({ properties: { feetPosition: { x: 0, z: 30, y: { terrain: 0 } } } });
return {
  sightline: api.raycast({ x: 0, y: 1.6, z: 30 }, { x: 0, y: 0, z: -1 }, 200),   // null = clear line to the keep
  walk: api.traverseCheck({ x: 0, y: 0, z: 30 }, { x: 0, y: 0, z: -100 }),
};
```

Then look, twice: `view_live_scene()` from the player's eye at the game's hour, and
`view_live_scene({ camera: { position: [70, 34, -60], target: [0, 12, -120] } })` for the silhouette. Then `getLogs()`.

---

## 9 — how it goes wrong: symptom → real cause → fix

| symptom | the real cause | the fix |
| --- | --- | --- |
| **everything looks grey and plastic** | no material, or one `roughness` and `metalness: 0.5` everywhere; `#000`/`#fff` albedo | §3: metalness 0 or 0.9+, roughness varied per region, albedo 0.04–0.85, `pbr: true` on the albedo |
| **it looks like separate assets in a pile** | two light directions, two palettes, mixed families, uniform density | §5: one palette in `world.json`, one hour per area, 3–4 recurring surfaces, density by band. Take 3 screenshots 100 m apart |
| **distant geometry shimmers** | NOT the far plane (engine-fixed). Faces < 5 cm apart z-fighting from stacked plates; or a repeating texture aliasing; or decoration reach | `api.unionSolid([ids])` or one scripted mesh, ≥ 5 cm daylight between separate pieces; `antiTiling: "stochastic"` on distant organic ground; anything needed past ~175 m is geometry, not decoration |
| **the player feels giant or tiny** | eye height wrong, or `* target.scale.y` missing, or props built to "looks epic" scale | §1 table; `api.getWorldBoundsBox(id).size.y` on the doors and barrels; cut a 2.1 m door into the monumental gate so the eye has a reference |
| **the scene is dark instead of moody** | darkness used as mood: sky L < 0.25, ambient 0, sun killed | §2: mood from colour — cold blue + one warm emissive; sky L ≥ 0.25, ambient ≥ 0.5 (≥ 1.0 skyless) |
| **the scene is flat instead of lit** | an authored `ambient`/`hemisphere` under a physical sky forced the sky probe to 0 | delete them outdoors and let `timeOfDay` derive the light; author `hemisphere` only where there is no sky |
| **textures stretched, or tiled 40 times** | `textureScale` read as a repeat multiplier instead of **metres per tile** | set it to the face's real size in metres; `repeat: [1, 1]` for one whole image; pre-flip worlds convert `2.5 / old` |
| **the horizon is a hard line** | no fog, or fog `far` shorter than the world | linear 300/600 base, `far` ≥ 6× playable radius — and remember `far` also caps terrain streaming |
| **a beautiful building you walk through** | no `physics` | `physics: "static"`, then `view_live_scene({ colliders: true })` |
| **the player stops against nothing** | a 0.368 m riser against the 0.3 m autostep, or a sealed doorway collider | `api.traverseCheck` before you believe a path; leave `wall` + `holes` colliders derived |
| **a door that reads as a loading screen** | a place minted for contiguous space, cold on entry | one place with floors in Y; `pregenerate`, `preloadAsset`, a residency-gated veil, and cover the ~250 ms |
| **the frame drops** | scripted materials or real lights per glow point; CDN meshes scattered as a forest | emissive for glow, ~1–3 hero CDN meshes per view, scripted trees + `decorations` for the rest; changing technique, never shipping less world |

---

## THE LAWS

1. **Say the Genie 3 truth once.** It hallucinates frames; we build geometry. Then build against what it *delivers* —
   never claim the architecture.
2. **A metre is a metre.** 1 unit = 1 m, `feetPosition` is the base, and the §1 table is not negotiable.
3. **The camera's numbers are part of the art.** fov 70–80 first person, 55–65 third, `orthoSize` for iso; eye height
   1.6–1.7 × `scale.y`; pitch inside ±1.47.
4. **Outdoors, the hour is the lighting.** No authored sun, ambient or hemisphere under a physical sky — authoring them
   kills the sky's own probe.
5. **One key direction for the whole world.** Two opposing keys is the loudest "pile of assets" tell there is.
6. **Mood is colour, never darkness.** Sky L ≥ 0.25, ambient ≥ 0.5, and horror is cold blue with one warm emissive.
7. **Metalness is 0 or 1. Roughness varies by region. Albedo lives between 0.04 and 0.85.**
8. **`textureScale` is metres per tile, and a tint multiplies the map.** Check every surface against the face's real
   size before blaming the art.
9. **Silhouette before detail, at 128 px** — and wind every face outward in one convention.
10. **Coherence is a constraint written before the second object**, not a polish pass: one palette, one light, one
    material vocabulary, density by distance, a landmark on every sightline.
11. **Existence is not walkability.** `api.traverseCheck` before you believe a path; a visible block must be legible at
    30 m; a way back is mandatory.
12. **A place is a door, not a level chunk.** Contiguous space is one place with floors in Y.
13. **60 fps is finish.** The answer to a heavy frame is a change of technique — one mesh, emissive instead of lights,
    decorations instead of entities — never a smaller world.
14. **Nothing is done until you looked**: the player's eye, at the game's hour, at the game's distance, plus `getLogs()`.

## what this skill refuses

- Claiming any of this "imitates Genie 3" internally, or promising a generative world model inside a game engine.
- Shipping a world where the light, the palette or the scale changes between two corners, however good either corner is.
- A grey untextured surface, an invisible wall, a landmark past the fog, or a scene made moody by turning the lights off.
- Saying it looks professional without a frame from the player's eye — same demand as `gavi#qualidade-sem-falha`.