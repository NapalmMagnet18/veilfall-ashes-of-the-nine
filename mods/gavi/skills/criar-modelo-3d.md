---
name: Create 3D Model
description: Building 3D form in this engine — the pipe-choice table (one primitive for exact parametric shapes, kind "scripted" geometry as the DEFAULT for props and structures, hand-written custom vertices, a conjured GLB only when it must be rigged), the silhouette test at 128 px, scale in meters, one generator root with local offsets, winding outward, conforming to terrain with ctx.groundY, and surface that does not read gray.
---

# Gavi — creating 3D models

you do not model in an outside program. you **describe** the form — in parameters, in vertices, or in a conjuration
name — and the engine realizes it. movement is `gavi#animar-doutrina`, flat art is `gavi#criar-pixel-art`, the router
across all lanes is `gavi#modelo-qualquer-estilo`. here the volume gets built, and gets built well.

## pick the pipe in ten seconds

| the thing is | pipe | one line of it |
| --- | --- | --- |
| exact parametric shape, ≤ 2 pieces, no oblique edge | **single primitive** | `primitive: { kind: "cylinder", radius: 0.12, height: 4.5 }` |
| prop, structure, vehicle, tower, weapon — **most things** | **`kind: "scripted"`** ← the default | `primitive: { kind: "scripted", script: "scripts/gen/cart.js", params: { length: 2.8 } }` |
| ≤ 24 triangles you can name off the top of your head, or data from outside | **`kind: "custom"`** | `primitive: { kind: "custom", geometry: { positions: [...] } }` |
| humanoid, or a creature that walks and breathes | **conjured GLB** | `model: "/cdn/moodboard-lowpoly-cozy/model-humanoid-smith.glb?animations=Idle,Walk,Hammer"` |
| it runs along a line — wall, fence, handrail, pipe, trim | **spline**, not a mesh | `spline: { kind: "fence", style: "split-rail", spacing: 2.4 }` |
| thousands of them: grass, ferns, flowers | **`terrain.decorations`**, GPU-instanced | `decorations: { deck: "meadow" }` |
| already 12 box entities, z-fighting | **merge** | `api.unionSolid([ids])` |

decide in one sentence with a number before you touch a vertex — "bell tower, 9 m, read at 12 m, ~11 pieces →
scripted mesh". without that sentence you stack boxes.

## LAW 1 — the pipe, with its real ceilings

| pipe | how you write it | real cost | wins when |
| --- | --- | --- | --- |
| **1. single primitive** | `primitive: { kind: "box" \| "cylinder" \| "arch" \| "lathe" \| ... }` | 1 entity, shared geometry, 12–800 triangles | it fits in **≤ 2 pieces** and no edge is oblique: platform, wall, beam, gate, post |
| **2. scripted primitive** | `primitive: { kind: "scripted", script, params }` + `geometry(ctx)` | 1 entity, **cap 16,384 vertices / 98,304 indices per mesh** | **≥ 4 pieces**, or 1 oblique edge, or 2+ materials on one thing: cart, ship, tower, arch, city block. **this is the default.** |
| **3. raw custom mesh** | `primitive: { kind: "custom", geometry: { positions: [...] } }` | same cap, no regeneration from params | you want the floats by hand: a gable roof is 8 triangles — or the data comes from a table |
| **4. conjured GLB** | `model: "/cdn/moodboard-<family>/model-<thing>.glb?animations=..."` | a paid mint, invisible while it cooks, vertices not editable | it needs **a rig and clips** — humanoids above all |

- a body that walks like a person → **GLB**. any other form → code. 12 stacked boxes are 12 entities and 12 draws;
  the same thing scripted is **1 and 1**. by the third box you were already wrong.
- past 16,384 vertices nothing is silent: the excess is **cut** and `getLogs()` names the emitted count against the
  cap. at the ceiling, split into two meshes by material region.
- a **runtime-spawned** `kind: "custom"` object is the one trap in pipe 3: its buffers live on the machine that
  spawned it, a later-joining client can derive nothing, and the engine reports `bespoke-geometry-underivable` — that
  player sees no prop at all. put custom geometry in the spec, or use a scripted generator every client can re-derive.
- too many **distinct** meshes and the device refuses new geometry families (`primitives-lane-arena-full`): the refused
  family renders invisible and everything else keeps drawing. the cure is fewer unique meshes — share `params` and
  `seed` across a cohort so they instance as one.

does it fit in a primitive? floor `box` 6 × 0.4 × 6 · post `cylinder` `radius: 0.12, height: 4.5` · ramp `wedge` ·
vase and turned column `lathe` (6–10 points `[r, y]`, `segments: 16`) · dome `hemisphere` · pipe `hollowCylinder`
inner 0.3 / outer 0.4 · opening `archway` 1.6 × 2.8 · wall with a door `wall` + `holes` (`bottomY` = the sill; leave
`collider` unset — an explicit `"box"` seals the doorway back up, and the derived collider is your chance to keep the
opening. check it with `view_live_scene({ colliders: true })` before you trust it).

## LAW 2 — silhouette first: what you cannot recognize as a cutout is not ready

detail is the last step. a good form names itself in black, with no colour, at thumbnail size.

```
preview_object({ objectId: "bell-tower", size: 128, background: "oklch(0.92 0.02 250)" })
view_live_scene({ camera: { position: [x, y + 2, z + 9], target: [x, y + 3, z] } }) // sun behind = backlight
```

**the gate, stated pass/fail.** render at `size: 128` and name the thing in **one word, inside three seconds**, without
leaning on what you set out to build. the right word = **PASS**, go add detail. a hesitation, a sentence, or the wrong
word = **FAIL**, and nothing about surface, texture or ornament is allowed until the masses change. there is no partial
credit at 128 px, because the player at 8 m runs the same test with less patience.

- **128 px** is the thumbnail test: if you cannot say what it is, the player cannot at 8 m — go back to the masses,
  do not add a screw. then look from the real distance: 5–8 m on foot, 15 m+ top-down.
- three masses in **1 : 0.6 : 0.3**; three equal ones read as a stack of boxes. the top is never the same as the base,
  and **one detail punctures the outline** — chimney, mast, horn.
- a silhouette block fits in **≤ 200 triangles**. if the block does not read, another 3,000 will not save it.
- it fails in exactly two ways and they want **opposite** fixes: it reads as **a box** → the masses are too close in
  size, go to 1 : 0.6 : 0.3 and break the top. it reads as **noise** → too many parts of one size, merge until three
  masses survive, then puncture the outline once.

## LAW 3 — a meter is a meter, and `feetPosition` is the BASE

- `feetPosition` is the **foot** (base, horizontally centered), not the center of the volume.
  `{ x: 40, z: -18, y: { terrain: 0 } }` sits on the ground and survives terrain edits; `y: { terrain: 3 }` is 3 m
  above it. an absolute `y` only for genuinely fixed altitude.
- `pivot: "feet" | "center" | "top"` changes what the position means. inside `geometry(ctx)`, `y = 0` is the foot and
  a vertex at negative Y buries the piece.
- the ruler, memorized — the props games actually build, in meters:

| thing | meters | the trap in it |
| --- | --- | --- |
| player | **1.8** tall | every other number on this page is read against this one |
| crate | **0.6–1.0** cube (0.8 is the stackable one) | 1.2 stops being a crate and becomes a shipping container |
| barrel | **0.55** wide × **0.9** tall | a barrel as tall as the player is the most common error in 3D and the most visible |
| door leaf | **0.9 × 2.1** single · 1.2 × 2.1 wide or double | under 2.0 m and the player ducks through their own house |
| step | rise **≤ 0.30**, tread 0.28 | autostep is 0.3 m — a 0.37 m riser is an unclimbable wall with colliders everywhere |
| table | **0.75** to the top surface | 0.6 reads as a coffee table; chair **seat 0.45**, back to 0.9 |
| wall thickness | **0.2** interior · **0.25–0.35** exterior stone | under 0.15 reads as cardboard the moment a doorway shows its reveal |
| interior ceiling | **3.0** (exterior wall band 2.4 under the eave) | 2.2 makes every interior feel like a crawlspace |
| street lamp | **4–6** (head at ~4.5) | under 3.5 and the light sits in the player's face |
| tree | **6–15**, canopy starting 2.5–4 | a 4 m "tree" is a shrub standing next to a 2.1 m door |
| cart wheel | **1.1** | |

- a conjured model is born at real size; `layout: { maxExtents: { x, y, z } }` is the rare override, for a footprint
  that must match its neighbour. **read the scale, never guess it** — three comparisons, in this order:
  `api.getWorldBoundsBox(id).size.y` against the table above · `min.y` against `api.getTerrainHeight(x, z)` (+0.04 is
  floating, −0.3 is burial) · `size.x`/`size.z` against the **0.9 m door leaf**, because a prop wider than that never
  enters the room it was built for. the full bounds contract (`geometryPending`, and why `null` is never zero) is
  `gavi#modelo-qualquer-estilo` §3.

## LAW 4 — one generator root per building, local offsets on the children

a complex building is **one** root entity with a generator script and children parented to it — never twenty loose
objects in world coordinates.

- `{ parent: api.id }` on every child: with a parent, `feetPosition` is a **local offset** from `(0,0,0)` — write
  `(0, 0, -d/2)`, not `(cx, cy, cz - d/2)`.
- position and rotate through the root only (`feetPosition` + `yaw`); the hierarchy turns the children correctly at
  any angle. rotating offsets by hand with sin/cos rotates twice: right on the cardinals, scattered at 45°.
- build the facade on local **+Z** and remember the engine's front is **−Z**: facing −Z → `yaw: 180`, +X → `90`,
  −X → `270`, +Z → `0`. `rotation: { lookAt: point }` aims −Z at the point, so a +Z facade wants the point mirrored
  through the object.
- with no `physics` the building is a ghost. `{ body: "static", collider: "box" }`. a foundation running down to
  `y: -10` keeps terrain rock out of the floor; the visible floor stays at `y ≥ 0`.

```js
// scripts/house-root.js — ONE generator per building; facade on local +Z
const p = require('builtin/primitives');
const STONE = { texture: 'cdn/texture-stone-block.png', color: 'oklch(0.66 0.02 90)', roughness: 0.9, metalness: 0, textureScale: 2 };

export function onSpawn(api) {
  p.box(api, 'foundation', -5, -10, -4, 5, 0.4, 4, STONE, { parent: api.id }); // LOCAL offsets
  p.wall(api, 'facade', -5, 0.4, 4, 5, 3.4, 4, STONE, [
    { x: 0, bottomY: 0, w: 1.2, h: 2.1 },                                       // door 1.2 × 2.1
    { x: -3, bottomY: 1.1, w: 1, h: 1 }, { x: 3, bottomY: 1.1, w: 1, h: 1 },    // sill at 1.1
  ], { parent: api.id });
  const hx = 5.5, hz = 4.5, ea = 3.4, ri = 5.6;  // roof: 8 triangles, hx/hz already include the eaves
  const t = (...v) => v.flat();
  const L = [-hx, ri, 0], R = [hx, ri, 0];
  const fL = [-hx, ea, hz], fR = [hx, ea, hz], bL = [-hx, ea, -hz], bR = [hx, ea, -hz];
  api.spawn('roof', { parent: api.id, properties: {
    primitive: { kind: 'custom', geometry: { positions: [
      ...t(fR, fL, R), ...t(R, fL, L), ...t(bL, bR, L), ...t(L, bR, R), // the two slopes
      ...t(bR, fR, R), ...t(fL, bL, L),                                // the two gable ends
    ] } },
    material: { texture: 'cdn/texture-shingles-clay.png', color: 'oklch(0.62 0.13 35)', roughness: 0.85 },
    physics: { body: 'static', collider: 'box' },   // without this the roof is a ghost
  } });
}
```

## LAW 5 — wind everything outward, in one convention

every face counter-clockwise **seen from outside**, one convention for the whole object, and derive the direction from
an outward vector — a reference normal, a canonical ring order — never quad by quad. both sides always draw, so a
reversed face **does not become a hole**: it lights wrong and smears the smooth shading along the seam. that is the
defect that makes coded geometry look amateur.

- `ctx.flat()` (default) = per-face normals, hard edges: box, rock, cut timber.
  `ctx.smooth()` = averaged normals, round: trunk, hull, pipe — from **8 sides** up.
- a sheet seen from both sides (flag, sail, panel) emits **both windings**; anything the player walks around is a
  closed solid. `builtin/geom` owns the winding law, which is why it is the shortest path to a solid.

```js
// scripts/gen/trunk.js — origin at the FOOT, +Y up, −Z the front
const G = require('builtin/geom');
export function geometry(ctx) {
  const bark = G.surface(ctx, { tex: 'cdn/texture-bark-pine.png', r: 0.36, g: 0.26, b: 0.17, rough: 0.92, jitter: 0.14 });
  const h = ctx.params.height ?? 6.2, y0 = ctx.groundY(0, 0), pts = [], radii = []; // ground under the foot
  for (let i = 0; i <= 6; i++) {
    const t = i / 6;
    pts.push([Math.sin(t * 2.1) * 0.35 * t, y0 + t * h, Math.cos(t * 1.4) * 0.22 * t]);
    radii.push(0.42 * (1 - t * 0.72));                  // 0.42 m at the foot → 0.12 m at the top
  }
  ctx.smooth();                                          // 10 sides: averaged normals
  G.polyTube(ctx, pts, radii, 10, [0, 1, 0], bark);      // parallel transport: never twists
}
export function collider(ctx) {                          // without this export it collides as the visual mesh
  return { kind: 'box', width: 0.9, height: ctx.params.height ?? 6.2, depth: 0.9 };
}
```

the kit carries the tedium: `G.oval`/`G.rrect` make a cross-section, `G.loftFrames` threads a section along a path
station by station (ship hull, watering can), `G.boxZ` is a chamfered block, `G.tube`/`G.polyTube` are round pipe
(handrail, cable, branch, gun barrel).

## LAW 6 — a wide mesh conforms with `ctx.groundY`

a mesh with **more than one ground contact** samples the ground **at every contact**, never once at the anchor —
otherwise one side floats and the other buries itself on the slope. `ctx.groundY(x, z)` is the terrain height under the
local (x, z) **relative to the object's foot**: 0 means the ground is exactly at your origin there, and a vertex at
`y = ctx.groundY(x, z)` lands on it. `ctx.groundNormal(x, z)` gives the local normal to tilt into. on flat ground it is
0 everywhere, so writing it from the start costs nothing — and anything that samples the ground **re-derives itself**
on a terrain edit or when the object moves.

```js
export function geometry(ctx) {
  const n = ctx.params.posts ?? 9, span = 2.4, bury = 0.15;
  ctx.color(0.42, 0.31, 0.19, 1);
  for (let i = 0; i < n; i++) {
    const x = (i - (n - 1) / 2) * span, y0 = ctx.groundY(x, 0) - bury; // ground under THIS post
    ctx.quad(x - 0.07, y0, 0, x + 0.07, y0, 0, x + 0.07, y0 + 1.35, 0, x - 0.07, y0 + 1.35, 0);
  }
}
```

a scripted piece's `params` are **copied at spawn**: `api.setProperty("primitive.params.posts", 12)` rebuilds that mesh
immediately, but editing the script's default constant never repaints what already exists.

## LAW 7 — form without surface reads gray

a mesh with no material is gray plastic, and gray is the fastest way to make a good volume look unfinished. the habit
is **CDN texture + tint**, with `metalness`/`roughness` that mean something.

| surface | `metalness` | `roughness` | note |
| --- | --- | --- | --- |
| polished steel, brass | 1.0 | 0.15–0.3 | metal with no albedo turns into a mirror |
| brushed metal, old iron | 0.9 | 0.4–0.55 | |
| **painted** metal | **0** | 0.5 | paint is not metal — the classic mistake |
| wood | 0 | 0.7–0.8 | `textureScale` ~1 (one tile per meter) |
| stone, brick | 0 | 0.85–0.95 | `textureScale` ~2 |
| cloth, sand, dirt | 0 | 1.0 | glass: 0 and 0.05, with `opacity: 0.25` |

`metalness` is practically binary: **0, or 0.85–1.0**. 0.5 does not exist in nature and reads as dirty rubber.
`roughness` lives in **three bands**, and a professional piece uses at least two of them on one object:
**0.2–0.35** polished, glazed, wet, lacquered · **0.4–0.6** semi-gloss, brushed or worn metal, painted wood, leather ·
**0.7–0.95** raw and porous — sawn timber, stone, brick, cloth, dirt. 1.0 is reserved for chalk, felt and dry sand, and
`roughness: 0.5` across a whole piece is an amateur's signature: vary it by region — wood 0.78, ironwork 0.45,
glass 0.05, on the same object.

**albedo is never pure black or pure white.** real materials sit between roughly **L 0.05 and L 0.85** in oklch:
charcoal is `oklch(0.12 0.01 260)`, fresh snow `oklch(0.88 0.01 250)`. `oklch(0 0 0)` absorbs every bounce and reads as
a hole punched in the mesh; `oklch(1 0 0)` clips under any exposure and takes the form's shading with it. the darkest
and lightest thing in a scene should still show its own shading.

**`textureScale` is METERS PER TILE — the most common surface bug in this engine.** the arithmetic, worked:
**tiles across a face = face size ÷ `textureScale`**. a 0.45 m box face with `textureScale: 1` gets **0.45 tiles**, so
you see 45% of one tile — a crop of the art, which looks broken and is not; the 2.5 default on that same face shows
18%. the three ways out, by intent: the whole picture on that face → `repeat: [1, 1]` (exactly one copy — signs,
labels, portraits) · the pattern at its real physical scale → `textureScale` = the size of the pattern itself (brick
course 0.25, plank 0.15, stone block 0.6) · one whole tile on that small face → `textureScale: 0.45`. the art-side
reading of the same number (curved kinds, terrain materials) is `gavi#criar-pixel-art` LAW 2.

**material slot names are semantic mount points.** a model whose materials are named for their material — `wood`,
`brass`, `marble`, never `handle_04` — takes a full generated surface per slot, and only that part changes while the
rest keeps the GLB's own paint:
`model: { id, materials: { brass: { texture: "cdn/texture-brass-brushed.png", pbr: true, metalness: 1 } } }`.
one dressing then serves every model sharing the name. a slot name matching nothing is ignored and `getLogs()` answers
with the model's real material names — that log **is** the discovery step.

inside `geometry(ctx)`, `ctx.albedo("cdn/texture-stone-block.png")`, `ctx.color`, `ctx.metalness`, `ctx.roughness` and
`ctx.emissive` are **stateful** — they hold for every face emitted after them — and
`G.surface(ctx, { tex, r, g, b, metal, rough, jitter: 0.10 })` gives per-face grain. a living surface (canopy, fire,
cloud) is the hull **plus** `material: { kind: "scripted", script }`.

**the real exception:** flat vertex colour is a **finished** look inside the flat families — `lowpoly-cozy`,
`voxel-bright`, `pixel-bright`, `pixel-moody`. outside them it reads unfinished. many points of glow (window, panel,
firefly) are **emissive**, not lights: a hundred emissive bulbs cost what one costs, while a hundred real lights are
the perf wall.

## LAW 8 — the name of a conjured asset is forever

the path as it is: `/cdn/moodboard-<family>/model-<thing>.glb`. families: `lowpoly-cozy`, `painterly-fantasy`,
`toon-vibrant`, `voxel-bright`, `realistic-gritty`, `scifi-neon`, `gothic-horror`, `pixel-bright`, `pixel-moody`.

- a humanoid is born knowing Idle/Walk/Run/Sprint/Jump; extra clips ride the URL — `?animations=Roll,Attack,Block`,
  and **list them all** (`gavi#animar-glb`).
- **a name already served keeps its first look forever.** the CDN delivers by filename and similar wordings collide
  onto it: a new look needs a **new name** (`-2`, `-v3`) with the refs moved over; the old name keeps serving whoever
  still uses it.
- a model is **invisible while it cooks** — with no frame showing the thing, the honest sentence is "it is cooking".
  wait with a receipt, not with faith: `api.onModelReady(id, cb)` fires when the bounds land, and releases at the cook
  ceiling (~800 s) so a swap can never hang forever. a named material slot dresses from the CDN:
  `model: { id: "...", materials: { marble: { texture: "cdn/texture-marble-white-veined.png", pbr: true } } }`.

## the professional tier — what separates a model from a shape

the laws above get a correct object. these four are what make it look **made**. all of them are cheap; none of them is
optional on a prop the player walks up to.

**1. chamfer every edge the player can get close to.** a perfectly sharp 90° edge holds one lighting value across both
faces, so it catches no highlight and vanishes into a flat corner — that is the **#1 tell of an untouched primitive**,
visible before scale, before texture. a **1–3 cm chamfer** puts a bright sliver on the edge and the volume snaps into
being. the ladder by scale: **0.004 m** small props (book, drawer, handle) · **0.008 m** furniture panels ·
**0.015–0.03 m** architectural elements (a beam, a doorframe, a stair nose — this is the 1–3 cm band the player's face
actually gets near). the kit already does it: `G.boxZ(ctx, x0, x1, y0, y1, z0, z1, 0.008, paint)` chamfers the box
*and* its ends, and `G.rrect`/`G.oval` carry the chamfer in the cross-section. the bill is one extra quad per edge plus
the corner fill, so skip it only on faces nobody approaches — a roof's underside, the back of a wall against terrain.

**2. detail density follows the eye, not the surface area.** budget by height band, on a 1.8 m player:

| band | what belongs there | how much |
| --- | --- | --- |
| 0–0.5 m | plinth, skirting, the shadow line where it meets the ground | almost nothing — it is occluded by everything |
| **0.8–1.2 m — grip height** | handles, latches, hinges, bolts, straps, the wear a hand leaves | the hand's band: real geometry, not paint |
| **1.5–1.7 m — eye height** | labels, faces, joints, the join where two materials meet | **the most detail on the whole object** |
| 1.7–3 m | broad forms, one punctuating detail | half the density of eye height |
| above 3 m | silhouette only — a spire's ornament is 3 masses, never 30 screws | pieces **≥ 0.1 m**, or they alias into flicker |

spend roughly **60% of the triangle budget between 0.8 and 1.8 m**. a far-field version of the same prop is two objects
with complementary `visibleRange` bands (`{ max: 700 }` on the detailed shape, `{ min: 700 }` on the cheap one), never a
detailed mesh you hope nobody zooms into.

**3. asymmetry and wear are the difference between a model and a shape.** a shape is symmetric; a model has a history.
the moves, in order of payoff: one post **3–5° off plumb** · one plank, shingle or slat **missing** · **2–4 cm** of
length variation across a repeated run · wear concentrated exactly where hands and feet land (the grip band, the
floor's leading edge, the stair nose) · `G.surface(ctx, { …, jitter: 0.10 })` so no two faces read identically ·
`ctx.randomRange` for the variation, since ctx randomness is **seeded** and every client bakes the same object.
never mirror two halves perfectly — the eye reads a mirrored prop as a catalogue render. the trade to keep honest:
variation means unique meshes, so vary `primitive.seed` on the **≤ 12 pieces** the player walks past and share one
`seed` + `params` across the field of 200, which then instances as a single mesh (LAW 1).

**4. the pivot is animation infrastructure, chosen before the first vertex.** the origin inside `geometry(ctx)` (`y = 0`
is the foot, `−Z` is the front) plus `pivot` is inherited by **everything downstream**: `rotation` and `yaw`,
`api.animate` keyframes, child `feetPosition` offsets, `attachment` sockets and bones, IK targets, jiggle, and the
camera's framing. get it wrong and every one of those is wrong in the same direction: a door pivoted at its center
swings **through** the wall, a wheel pivoted at the foot **orbits** instead of spinning, a lantern pivoted at the foot
**rises** as it swings. and the repair is not local — fixing a pivot after clips and offsets exist means re-deriving all
of them. so declare the frame in the script's header comment (origin, forward axis, the mount points other scripts
read) before emitting a triangle. which pivot for which piece is the table in `gavi#modelo-qualquer-estilo` §3.

## the procedure — "make me an X", from nothing to an object with proof

1. **the pipe in one sentence with a number.** "bell tower, 9 m, read at 12 m, ~11 pieces → scripted mesh."
2. **silhouette block** — ≤ 200 triangles, three masses, zero detail, checked at 128 px. if it does not name itself,
   fix the masses before going on.
3. **write the pipe.** scripted: `geometry(ctx)` with `builtin/geom`, origin at the foot, `−Z` the front, and any
   measurement another script needs exported as a constant.
4. **surface with intent** — texture + tint + the LAW 7 numbers, varying by region.
5. **sit it in the world.** `feetPosition: { x, z, y: { terrain: 0 } }`, explicit `physics`, and for a building two
   marks first —
   `api.addMark("pad-tower", { kind: "flatten", center: { x: 40, z: -18 }, height: { terrain: 0 }, shape: { kind: "circle", radius: 9 }, falloff: 3 })`
   plus a matching `clear-scatter`, or grass grows up through the floor (`gavi#fazer-cenario`).
6. **prove it with two frames, then clean up.** `preview_object` in isolation (the booth does not sample `ctx.albedo`
   and reads flat ground) and `view_live_scene` in place, in the game's light at the game's distance. then `getLogs()`:
   truncation and `bespoke-geometry-*` land there. every test spawn is born with a `temp` tag and dies before you report.

## how it goes wrong

1. **wrong scale.** TELL: a barrel as tall as the player, a 1.6 m door, and the character reads like a child on a
   set. FIX: `api.getWorldBoundsBox(id).size.y` against the ruler in LAW 3; correct a model with
   `layout.maxExtents`, never with a guessed `scale` on top of `scale`.
2. **floating or buried.** TELL: a 3 cm shadow gap under a crate, or a post sunk 20 cm. FIX: `y: { terrain: 0 }` and
   the foot at `y = 0` in the generator; rock and tree bases bury **on purpose** by 0.02–0.15 m, everything else touches.
3. **stack of boxes where one mesh fit.** TELL: 12 entities on one prop, and near-coplanar faces flickering along the
   seams from 20 m out. FIX: one scripted mesh — or `api.unionSolid([ids])` on what already exists, keeping ≥ 5 cm of
   daylight anywhere two separate pieces nearly touch.
4. **no `physics`.** TELL: the beautiful building the player walks straight through. FIX: `physics: "static"` on
   anything touchable, and prove it with `view_live_scene({ colliders: true })` — an explicit `collider: "box"` on a
   wall with holes seals the doorway.
5. **everything at one roughness, metalness 0.5.** TELL: the whole prop reads as one plastic blob under any light.
   FIX: the LAW 7 table, varying `roughness` by region; metalness 0 or 0.9, nothing between.
6. **unbevelled edges and perfect symmetry.** TELL: edges that never catch light, and two identical sides that read
   like a catalogue render. FIX: bevel 0.004 / 0.008 / 0.015 by scale, plus `jitter: 0.10`, one post 4° off, one
   shingle missing.
7. **detail sprayed evenly over the whole form.** TELL: screws on a roof ridge nobody can see, and a bare doorframe at
   1.6 m where every player is standing. FIX: the eye-height budget — most of it between 0.8 and 1.8 m, silhouette only
   above 3 m, pieces ≥ 0.1 m up there or they flicker.
8. **pivot decided after the animation.** TELL: the door swings through the wall, the wheel orbits instead of spinning,
   the hung lantern rises as it swings. FIX: declare origin, forward axis and pivot in the script header before the
   first vertex — every clip, offset, socket and camera frame downstream inherits it.