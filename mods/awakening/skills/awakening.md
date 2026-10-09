---
name: Awakening
description: Awakening mod, the complete manual: take a 3D world to a modern open-world look (PBR lighting, film post stack, volumetric clouds, grass, 2K ground, eroded mountains, forest planner, floor cover, rock) plus Awakening Water (lake surface, ripples and wakes, shore foam, wet sand, boats) and optional squalls and thunderstorms. Every piece's wiring, params, data contracts and pitfalls.
---

# Awakening: the manual for Savi

Everything lives in `mods/awakening/`. Every piece is opt-in; wire only what the world needs, and offer the rest. Tune by params and data, never by editing the mod's files per world (an update would fight your edits; install keeps edited files but then they stop getting fixes).
Imports from a world script: `../mods/awakening/<file>.js` (scripts/) or `../../mods/awakening/…` deeper. Inside the mod, shared code is `lib/`.
The creator has a god-mode tab **Awakening** (panel.js): grouped cards (Sky & light, Land, Plants, Water, Weather), each with what it does, an "In use / Off" pill read from this world, and a "Say to Savi" line. When they say one of those lines or point at a card, the section below with the same name has the wiring. Keep the two in step: a piece added to the mod gets a card in panel.js and a section here in the same edit, with the same name.

## Using Awakening in any game (the portability rules)
- Nothing in `mods/awakening/` names a world's ids, coordinates or places. World facts (positions, levels, ids, which place) live in the world's own files: its scene placements, its config marks, its scripts. If you catch yourself writing a coordinate into the mod, it belongs in the world instead.
- Placements are found by **tag and behavior**, never by a fixed id: rivers and creeks wear `awakening-river` + `river-surface.js`, lakes wear `awakening-water` + `water-surface.js` (the shore band wears `awakening-water` too, but no behavior). Give each water a unique id; the defaults `awakening-lake` / `awakening-river` are only defaults.
- Players touch water through one call, `touchWater` (section 10), never a hand-written box of coordinates per water.
- Numbers quoted as "this world's" (junction L/r/a, levels, radii) are starting points from Fidelity Test Valley; measure the new world's ground before reusing them.
- Every piece degrades by `ctx.quality`; check each at the low tier. Never lower render resolution to hold frame rate.
- A terrain generator that samples a river/creek line must look it up through a grid (or bounds test) first: heightAt runs for every vertex, and a per-vertex scan of the whole line made this world's ground stream late.

## Map
| piece | file(s) | wired where |
|---|---|---|
| lighting model | lighting.js | world.config.yaml `lighting:` |
| frame look, clouds, storms' sky | look.js → lib/sky-clouds.js, lib/upsample.js | place `atmosphere.look` |
| grass | grass-blades.js + grass-look.js | terrain decoration layer |
| 2K ground | textures.yml, tools/hires.py | terrain materials |
| eroded mountains | erosion.js, tools/erode.py | the world's terrain generator |
| forest planner | forest.js | a world replant script |
| forest floor | floor-cover.js | decoration layers |
| rock | rock-look.js | model material |
| lake water | water.js, water-sheet.js, water-surface.js, water-hidden.js, lib/lake-build.js | a placement + the lake mark |
| shore wet sand | shore-band.js + wet-sand.js | a placement |
| river / creek water | river-sheet.js, river.js, river-surface.js (the lake's shader underneath, lib/water-material.js) | a placement + a river mark or the world's own channel |
| players touching water | touch.js `touchWater` | the player's behavior, one line |
| where two waters meet | lib/junction.js | params on both waters |
| hulls | water-mask.js | a lid child on a boat |
| waves / squall / storm clock | lib/swell.js (swell.js re-exports) | read by water, boats, sky, storm |
| rain, lightning, thunder | storm.js `tickStorm` | the world's sim.js |

## 1. Lighting: `lighting.js`
Height-correlated Smith visibility, Burley diffuse, multi-scatter specular, micro-shadowing from baked AO, specular occlusion on the sky term.
Wire: `world.config.yaml` → `lighting: mods/awakening/lighting.js`. Undo: point it back at the previous file.

## 2. Frame look: `look.js`
Tiered by `ctx.quality`: low = sharpen + grade + painted cloud layer; medium adds SSAO; high/ultra add volumetric raymarched cumulus and the sun-lit height mist.
Wire per 3D place: `atmosphere.look = { script: "mods/awakening/look.js", params: { mistBase: <valley floor y + 1> } }` and `atmosphere.clouds.enabled: false` (Awakening draws the clouds; two layers double).
Params (defaults): sharpen 0.35, aoRadius 1.1, aoIntensity 1.6, aoStrength 0.7, mistDensity 0.012, mistBase 1.5 (world y), mistFalloff 9, mistReach 140, mistLight 0.55, vignette 0.2, grain 0.022, bloomStrength 0.32, bloomRadius 0.85, bloomThreshold 1.
Clouds (lib/sky-clouds.js): cloudBase 1500, cloudTop 2800 (m), cloudCover 0.46, cloudDensity 0.0065, cloudScale 0.00026, cloudBrightness 1, cloudAmbient 1.8, cloudDesaturate 0.35, cloudMultiScatter 0.32, cirrus 0.55, cloudShadow 0.5, cloudDrift 8. storm 0 (section 11).
Cloud quality is automatic: the buffer is 400×256 (high) or 512×320 (ultra, taller than 16:9 because far clouds are squashed flat), grazing rays get up to 2× the steps (16/22 → 32/44 at the horizon only), the start jitter is a 2D hash on the buffer grid (a 1D gradient noise combed far clouds into vertical stripes), and the upsample is an 8-tap tent. Distant clouds looking pixelated or streaked means one of these regressed, not a tuning dial.
Tuning: contact shadow invisible → aoStrength up. Far ridges flat/grey → mistDensity down or mistReach up. Mist floating over hills → mistBase is wrong; set it to the low ground's y. Overcast wanted → cloudCover .7-.8 (past .85 it is a flat ceiling).
Pitfall: a NaN in a shader param (pow of a negative, a divide by 0) blacks out the whole frame. Clamp before pow.

## 3. Grass: `grass-blades.js` + `grass-look.js`
Terrain decoration layer item: `{ kind: "scripted", script: "mods/awakening/grass-blades.js", wind: { force: 0.09 } }`, layer material `{ kind: "scripted", script: "mods/awakening/grass-look.js" }`, density 10-16. LODs: 84 / 48 / 6 / 4 / 4 tris; low tiers thin the count. Vary `seed` and `scale` per layer for meadow vs dry grass. Remove the world's old grass layer in the same edit so two grasses never stand at once.

## 4. 2K ground textures: `textures.yml`
Six sets (grass, drygrass, forest-floor, gravel, granite, snow), 2048 px albedo + tangent normal + roughness, seamless.
Terrain material: `{ id, albedo, normal, roughness, pbr: true, textureScale, antiTiling: "stochastic", macro }` with the set's addresses and textureScale. Model material: `texture` / `normalMap` / `roughnessMap` with `wrap: "repeat"`.
Texel density: ground 500-700 px/m (textureScale 2-3), rock faces ~300 px/m (textureScale 7) with macro variation.
New surface: `spawn paint "seamless tileable top-down photo scan, even flat lighting, no shadows: <surface>" --size 2048x2048`, `spawn fetch`, `python3 mods/awakening/tools/hires.py in.png out [normalStrength 6] [roughBase .85] [roughRange .25]`, `spawn upload` the three, add the set to the world's own table (scripts/lib/data/), not the mod's.

## 5. Eroded mountains: `erosion.js` + `tools/erode.py`
Noise draws "procedural" mountains; real ranges are river-cut. Bake offline, sample live. The world's creator decides its mountains: never shrink their data as a generic optimisation.
1. Bake: `python3 mods/awakening/tools/erode.py --out scripts/lib/erosion-data.js --center <valley x z> --radius <rx rz> --peak 240 [--n 320 --cell 7.5 --iter 70 --seed 11]`. The massif rises outside the ellipse, the inside stays valley floor. Look at `/workspace/hillshade.png` before wiring. Keep the data under ~310 KB.
2. Sample in the world's terrain generator:
```js
import { createErosion } from "../mods/awakening/erosion.js";
import { GRID, DATA } from "./lib/erosion-data.js";
const ERO = createErosion(GRID, DATA); // opts: rill 5.5, joint 3.5, flowCut 0.6, rimInner 20, rimOuter 220
export function heightAt(ctx) {
  const d = ERO.detail(ctx, ctx.x, ctx.z); // null off-grid; { h, e, m, fade }
  const valley = 3;
  return d ? valley * (1 - d.fade) + Math.max(valley, d.h) * d.fade : valley;
}
```
`h` carved height, `e` channel signal (negative in gullies), `m` 0..1 mountainousness, `fade` 1 inside → 0 at the rim. materialAt: rock on slope + m, gravel where e < 0, snow on shelves pushed into couloirs by -e. Past the rim, carry the horizon with your own ridged noise. Memoise heightAt/materialAt per column: terrain chunk cost is the arrival cost.
This rewrites the land's shape: offer it to the creator before running it.

## 6. Forest planner: `forest.js`
Pure, deterministic. `plantForest(H, { bounds, mask, species, understory, trails, seed })`:
- `H(x, z)` → ground height, `mask(x, z)` → 0..1 footprint.
- `species`: rows keyed by kind with weight, spacing, altitude/slope/edge preferences and `sink`.
- Returns `trees` and `under` rows `{ kind, x, y, z, yaw, s }` (y already sunk) and `trails` `[{ points: [[x, z]…], width }]`.
Place rows as template placements (one template per kind, LOD'd models), each trail as a terrain `path` mark. Keep the plan's parameters in one world file and a `replant(ctx)` that destroys the previous batch by tag first. Tree and log models are not shipped: bring the world's own.

## 7. Forest floor: `floor-cover.js`
Scripted geometry, `params.kind`: `moss` | `twig` | `cone` | `tuft`. Each on a decoration layer bound to the forest-floor material and the forest mask, small counts, clustered.

## 8. Rock material: `rock-look.js`
`material: { kind: "scripted", script: "mods/awakening/rock-look.js", params: { albedo, normal, uvMetres, tile, detail, rough } }`: the model's baked maps married to 2K granite detail at a steady metres-per-tile.

## 9. Awakening Water: a lake
Three parts: the engine's lake mark keeps swimming, buoyancy and underwater (its stock surface hidden); an Awakening sheet draws the water; the surface behaviour writes ripples.
1. Mark (place config `terrain.marks.lake`): `{ kind: "lake", at: {x, z}, level, radius, bedMaterial, liquid: { kind: "water", material: { kind: "scripted", script: "mods/awakening/water-hidden.js" }, underwater: {…} } }`.
2. Build the sheet params once (run_script):
```js
import { waterSheet, shoreBand } from "mods/awakening/lib/lake-build.js"; // from a world script: ../mods/awakening/lib/lake-build.js
const H = (x, z) => ctx.place.terrain.heightAt(x, z);
const W = waterSheet(H, { x: 10, z: -120, level: 0.6, radius: 60 }); // radius ≥ the mark's
```
3. Place it:
```js
spawn("awakening-lake", { tags: ["awakening-water"], feetPosition: { x: 10, y: 0.6, z: -120 }, castShadow: false, receiveShadow: false,
  primitive: { kind: "scripted", script: "mods/awakening/water-sheet.js", params: W },
  material: { kind: "scripted", script: "mods/awakening/water.js", params: { deep: 3.5, sky: 1.6, scatter: 2.4 } },
  behavior: "mods/awakening/water-surface.js", state: { level: 0.6, radius: 60 } });
```
water.js params (defaults): swell 1, chop 1, micro 0.35, refract 0.03, ssr 1, reflectDistance 70, glint 1, sky 1.3, scatter 1, foam 0.5, lap 1 (shore foam lines), shallow 1 (green over a shallow bed), deep 3.5 (m of tint distance), interact 1 (ripple rings), squall 0, squallPush 0. Ring slots r<i>x/z/t/a are written by water-surface.js: never author them.
Tiers: low draws waves + depth colour; medium adds refraction and reflection; high/ultra add caustics and the full wave set. Far wavelengths fade under a pixel so distant water goes glassy, not grainy.
Reshaping the bank or moving the level: rebuild W (and the shore band), and keep mark level, sheet feet y, `state.level`, `wet-sand` `level` and any boat's tuning level equal.

## 10. Touch: ripples, splashes, wakes
Players: one line in the player's own behavior, on the local machine, wakes every Awakening water the body stands in, lakes, rivers and creeks alike:
```js
import { touchWater } from "../mods/awakening/touch.js";
// in update(ctx, dt), after the velocity write:
if (ctx.self.isLocal) touchWater(ctx, ctx.self);
```
It lists waters by tag + behavior every 5 s (so a new creek is picked up without an edit), boxes each by its footprint, tries rivers first and hands the body to a lake when no river holds it (a river mouth out in a lake wakes the lake). `river-surface.js wade()` returns true while it holds the body; the wade rules live in lib/wade.js (both surfaces re-export them). Never route by hand-written coordinates.
Falling in splashes.
Anything else: `ctx.emit("awakening:water-impact", { x, z, strength: 0..1, big: bool })` → rings, spray, sound. `ctx.emit("awakening:water-ring", { x, z, strength })` → a quiet ring (wakes, paddle strokes). The lake owns every visual; a thrower or boat only emits.

## 11. Shore: foam and wet sand
Foam and lap lines are in water.js (`foam`, `lap`). The wet bank is a placement:
```js
const S = shoreBand(H, { x: 10, z: -120, level: 0.6, radius: 60, feetY: 0 });
spawn("awakening-shore", { tags: ["awakening-water"], feetPosition: { x: 10, y: 0, z: -120 }, castShadow: false, receiveShadow: false,
  primitive: { kind: "scripted", script: "mods/awakening/shore-band.js", params: S },
  material: { kind: "scripted", script: "mods/awakening/wet-sand.js", params: { level: 0.6, damp: 0.28, dark: 0.6 } } });
```
A gap between water and bank = the sheet's footprint is stale (rebuild W) or `pad` too small.

## 11a. Rivers and creeks: placing one
One placement per waterway, on the lake's own water system (never a separate shader):
```js
spawn("awakening-creek", { tags: ["awakening-river", "water"], feetPosition: { x: 0, y: 0, z: 0 }, castShadow: false, receiveShadow: false,
  primitive: { kind: "scripted", script: "mods/awakening/river-sheet.js", params: { pts, width, rocks } },
  material: { kind: "scripted", script: "mods/awakening/river.js", params: { swell: 0, chop: .45, deep: 1.3, white: 1, current: 1, drift: 1.2, width } },
  behavior: "mods/awakening/river-surface.js", state: { halfWidth: 2.2, drift: 1.1 } });
```
- `pts` "x,y,z;…" upstream first, y = the water level at that point; it may step down at drops but never climbs. The sheet resamples and smooths it.
- `width` a bit wider than the wet channel so the banks cut the edge; `state.halfWidth` is the wet half-width used for wading.
- `rocks` "x,z,r,c;…" boulders standing in the flow (radius, crown above water): they shape the flow map, whitewater and wakes. Place the matching rock models at the same spots.
- The channel: a river mark carves it, or the world's terrain generator authors it (a centreline, a level profile, a wet width). Either way, the terrain and `pts` are one design: change both together, then run the check in 11b.
- A spring or source: narrow the channel to nothing at the head, give it a steep little headwall and a pool, and start `pts` in the pool. Dress it (rocks, ferns, a welling fx, a quiet water loop).
- Spray at drops is the world's own template placements (position and flow per placement), not part of the mod.

## 11a+. Creeks: the creek tool (lib/creek.js)
A creek's ground and water are one design, so Awakening Water carves it: never hand-author a creek's water levels in metres, and never lay one diagonally across a hillside (both made a creek ride an embankment up the hill, the "strange ridged terrain" a creator reported).
1. **Trace the line** down the land's own fall line, in a run_script: `traceCreek((x, z) => ctx.place.terrain.heightAt(x, z), spring, mouth)` returns [x, z] waypoints along the valley floor. Pick the spring in a hollow under higher ground; the mouth inside the water it feeds. Hand-tidy the waypoints if you like; keep them on the floor.
2. **Carve it** in the world's terrain generator: split the landform into `bare(ctx, x, z) → { h }` (everything before any water) and run the creek after it:
```js
import { createCreek } from "../mods/awakening/lib/creek.js";
export const creek = createCreek({ line, calm: { length: 130, level: LAKE }, mask: (x, z) => /* 0 inside the lake, 1 outside */ 1 });
// in heightAt: h = creek.bed(ctx, x, z, bare(ctx, x, z).h, bare)
```
   The level follows the bare ground (sunk `depth` 0.9, never climbing, smoothed, eased to `calm.level` over `calm.length`), pools step every `pool` 6 m, the bed only cuts (channel, low cut banks, a valley side at `slope` 0.42 blended in by a smooth minimum, out to `reach` 27 m), and the spring closes in a seep under a `headwall`. Options: depth, pool, slope, headwall, reach, head, maxWet, smooth, seeds.
3. **Bake the sheet** after the terrain rebuilt: `primitive.params.pts = bakeSheet(creek, (x, z) => ctx.place.terrain.heightAt(x, z))`, then run the 11b check. Dressing (rocks, spray, spring) is placed along `creek.point(s)` at `creek.surface(heightAt, s)`; a moved line moves its dressing with it.
Materials can read `creek.near(x, z)` → { d, s } (grid-indexed, cheap) for gravel bars and damp margins.

## 11a++. Waterfalls: the waterfall tool (lib/fall-ground.js)
The ground of a waterfall (hanging-valley stream, sheer lip, amphitheatre plunge pool, the outlet into the river) is carved by Awakening Water from one frame, so the curtain, the pool water and the river's junction read the same numbers:
```js
import { createFall } from "../mods/awakening/lib/fall-ground.js";
export const fall = createFall({ x, z, dx, dz, top, lip, pool, outlet: { x, z, dx, dz } }); // (dx, dz) = the pour's direction; outlet = the river junction leaving the pool
// in heightAt, after the landform: h = fall.outlet(x, z, fall.ground(ctx, x, z, h));
```
`fall.frame(x, z)` → { a, b } (a metres downstream of the lip, b across); `fall.streamB(a)` / `fall.streamLevel(a)` give the plateau stream's line and level for its river-sheet `pts` (brink at a = 0, level `lip`); `fall.top(ctx, b)` is the lip line. Place the curtain (waterfall.js) with its feet on the lip, the pool water at `pool` with plunge params at the fall's foot, and the river's junction at `outlet`. Options: face, poolA, poolRA, poolRB, spring, valley, halfWide, streamW, seed. Change a number here and move the curtain, pool and junction with it.

## 11a+++. Waterfalls: the curtain and its boil (waterfall.js, waterfall-boil.js)
Two placements share one geometry script, both with feet on the lip's centre at the stream's water level and the same params:
```yaml
waterfall-curtain:   # see-through falling water
  primitive: { kind: scripted, script: mods/awakening/waterfall.js, params: { dx, dz, width: 7.2, drop: 21.95, pool: <pool y - feet y>, v0: 2.4, spread: 1.8, thick: 0.5, thickFoot: 3, back: 2.6, ropes: 1.6, jets: 9, veil: 1, slick: 7, riseSlope: 0.06, riseDraw: 0.12, riseLen: 3, part: curtain } }
  material:  { kind: scripted, script: mods/awakening/waterfall.js, renderOrder: 10, params: { width, v0, lipIn0: -2.4, lipIn1: -1.1, footFade: 0.97, footBand: 1.5, bump: 0.09, poolY: <pool y>, boilX, boilZ, boilR: 3.2, boilK: 1.4, plX, plZ, plDX, plDZ, plHW, plHL, plH, plReach } }
waterfall-boil:      # solid froth at the foot
  primitive: { same params, part: skirt, lift: -0.1 }
  material:  { kind: scripted, script: mods/awakening/waterfall-boil.js, renderOrder: 10, params: { same, part: skirt } }
```
- The curtain is nested layers (core back and front skins, a billowing veil, peeling ropes), and its tongue starts `back` m upstream lying on the stream, so the stream ends under it and there is no lip seam. Detail is one baked streak map addressed by flight time: two texture taps a pixel, cheap on low-end GPUs.
- The boil is a separate file because a scripted material is built once per script: its depth-write and alpha-test flags can't flip on a param. It writes depth so the pool water (renderOrder -5, drawn after) can never paint over the froth, the fault a creator saw as "the pool's edge drawn over the foot". `lift` sets how far the heap sinks into the pool: at or below 0 it meets the water with no gap, above it the froth floats.
- The pool's own water material carries the same `pl*` plunge params (lib/plunge.js), so the white churn in the pool around the impact is the pool's water and fades into it with no edge. Unset (`plHW` 0), it costs nothing.
- Spray and roar (lip jets, plunge blast, mist) are the world's own fx placements, not part of the mod.
- Check from three sides and head-on from the pool: the froth must hide the pool's edge behind it and touch the water.

## 11b. Rivers: the sheet must sit IN the ground, never over it
A river sheet (`river-sheet.js`) is a ribbon at its centreline's water level (`pts` y), `width` wide, a bit wider than the channel so the banks cut its edges. The terrain draws the edge, so the terrain has to be higher than the water on both sides of the channel for the full width of the sheet. Where the ground beside the channel dips under the water level, the sheet runs on over dry hollows: it looks like a floating slab of river with air or grass under it. The river mark carves its channel but never raises the banks, and rolling or eroded ground dips a lot near a lake, so check it every time you place or move a river.

**The check** (run_script, readOnly, right after placing, and again after any terrain or `pts` change). Walk every centreline point and sample the ground across the flow:
```js
const R = getObject("awakening-river"), F = R.feetPosition, W = R.primitive.params.width / 2;
const P = R.primitive.params.pts.split(";").filter(Boolean).map((s) => s.split(",").map(Number));
const bad = [];
for (let i = 1; i < P.length; i++) {
  const [x, y, z] = [P[i][0] + F.x, P[i][1] + F.y, P[i][2] + F.z];
  let tx = P[i][0] - P[i - 1][0], tz = P[i][2] - P[i - 1][2]; const L = Math.hypot(tx, tz); tx /= L; tz /= L;
  for (const d of [W, W + 1.5, W + 3, -W, -(W + 1.5), -(W + 3)]) { // the sheet's edge and the bank just past it
    const h = ctx.place.terrain.heightAt(x - tz * d, z + tx * d);
    if (h < y - 0.05) bad.push({ i, x: +(x - tz * d).toFixed(1), z: +(z + tx * d).toFixed(1), under: +(y - h).toFixed(2) });
  }
}
return bad; // empty = every bank stands above the water. Points past a junction line (inside the receiving water) show up too:
// drop those by distance to the lake's centre before judging, then look at every hit that remains, however small.
```
**The fix** is in the terrain generator, never in the sheet: don't narrow or lower the river to dodge a hollow. Around each run of bad points, fill the low ground up to a low bank a hand above the water (level + 0.4 m or so, with a little noise so it isn't a shelf), fading to nothing at the edge of the patch, and let the river mark carve its channel back through it. Fit the patch to the bad points themselves: take the patch's centre and radii from the points the check returned, plus a few metres. Then run the check again: it must come back empty, and the spot the creator reported must be inside the patch. Keep the fill cheap (a distance test first, noise only inside the patch), because heightAt runs for every terrain vertex.
Also keep: the channel bed under the centreline at least 0.5 m below the water (the mark's `depth`), and the sheet's `pts` y equal to the mark's water level at each reach. Where a river meets a lake, its last reach sits exactly at the lake's level.

## 11c. Where two waters meet: `lib/junction.js`
Any water flowing into another (river → lake, stream → river, spring → pond) hands over at a shared **junction** line: `junctionParams(slot, { x, z, dx, dz, w, u, r, a, L }, side)` spread into both materials' params: the tributary as side -1, the receiving water as +1, the same slot and numbers on both. The tributary fades its own character over its last `L` m and eases into the receiving water's params (copy them onto it as `into_chop`, `into_swell`, `into_sky`, …); each sheet discards the other's side, and both draw the same inflow plume, so the line has no seam. Lake/river defaults in this world: L 6, r 0.13, a 0.2. Put the junction line where the tributary's last reach meets the receiving water's footprint, with `w` the channel's half-width there. See the README section "Where waters meet".

## 12. Boats
Float points sample `swellHeight(x, z, swellTime(ctx))` from lib/swell.js so the hull rides the same waves the shader draws (reference: a world's scripts/canoe.js). A hull with an open top gets a lid child worn with `material: { kind: "scripted", script: "mods/awakening/water-mask.js" }` just under the gunwales, or the water draws inside it. Emit `awakening:water-ring` from bow and paddles for wakes.

## 13. Squalls (optional, off by default)
On the lake material: `squall: 1` sends a squall across every 200 s (55 s long, +8 m/s over the breeze): swell and chop build, gusts darken the water in cat's-paws, whitecaps break. `squallPush: 1` also lets it shove and rock boats; leave it off in a game where weather must never move players. A floater reads both with `squallOpts(lakeParams)` and `squall(swellTime(ctx))`. Timing is `SQUALL` in lib/swell.js. It is a smooth function of the shared clock: no script writes the wind (a per-second wind write made the grass and waves snap: never do that).

## 14. Storms (optional, off by default)
`atmosphere.look.params.storm: 1` turns each squall into a thunderstorm on the same clock: the cloud deck closes to slate, the land drops toward grey, mist thickens (shader-side, no writes). For rain and lightning add to the world's `sim.js` (cadence "1s"):
```js
import { tickStorm } from "./mods/awakening/storm.js";
export function tick(ctx) { tickStorm(ctx); }
```
tickStorm (place `main`) writes `atmosphere.rain` / `atmosphere.wet` (the engine darkens and pools the ground), spawns one camera-following rain fx object `storm-rain` (tag `weather`, with its own loop sound) per storm, strikes lightning 250-500 m from a player with a faint screen flash and thunder delayed by distance, and writes `place.state.weather` = `clear | clouding over | rain | thunderstorm | clearing` for a HUD chip. A storm wants `squall: 1` on the lake so the water answers.
Pitfall: an fx meant to die uses `burst=`, never `n=` (a held count respawns forever: stuck bolts).

## The art rules the scripts cannot do
1. Procedural sky (`realistic`, hosek) at a low sun: 7-9 or 15.5-17. Noon kills form.
2. Ground is PBR with stochastic anti-tiling and macro drift, blended on noise.
3. Hero assets are Blender models with baked maps, never primitives. Boulders at the feet of outcrops.
4. Mountains 1-2 km out, linear fog near 250 / far 1600, mist in the low ground.
5. Water is a lake mark plus an Awakening sheet, never a bare plane.
6. A sound bed (wind, birds, lake lap) so the picture breathes.
7. Keep lower-end machines in mind: check each feature at the low tier, and never let resolution drop to hold frame rate.

## Removal
Move every reference out first: the lighting line, each place's look, grass layers, terrain generator imports, rock materials, lake/shore placements and the mark's liquid material, boat lids, sim.js's tickStorm. `remove` refuses while scripts outside the folder name mods/awakening/ and lists them.