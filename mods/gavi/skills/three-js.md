---
name: Three Js
description: The honest bridge for anyone who thinks in Three.js — a concept-to-spec translation table with this engine's real call names, what does not cross over (the renderer, your own loop, URL imports, Matrix4), geometry(ctx) by hand, the loft kit, winding proven with your eye, and a wide mesh that follows the terrain. Read this before writing your first vertex if your instincts came from three.
---

# Gavi — Three.js

this engine is **not** three.js. it renders with three underneath, and you never touch that layer. what crosses
over is the **thinking**: vertices, faces, winding, materials, node shaders. what does not cross is every call
you used to make — no `Scene`, no `renderer`, no `requestAnimationFrame`, no `import` from a URL.

the bridge rule: **the concept crosses, the call does not.** if you have not seen the signature in this file or
in api-reference, write the concept and go read. an invented function name costs a session.

## pick your row in ten seconds

| you were about to write | write this instead | where |
| --- | --- | --- |
| `new Mesh(geometry, material)` | an object spec: `api.spawn({ properties: { primitive, material } })` | translation table |
| `new BufferGeometry()` + a loop | `primitive: { kind: "scripted", script }` + `export function geometry(ctx)` | LAW 4 |
| a vertex array you already computed | `primitive: { kind: "custom", geometry: { positions } }` | LAW 2 |
| `requestAnimationFrame` | `export function update(dt, api)` + `export const updateSchedule` | LAW 7 |
| `renderer.render(...)`, composer, passes | nothing. the client renders. post is `atmosphere.look` | LAW 1 |
| `ShaderMaterial` / `onBeforeCompile` | `material: { kind: "scripted", script }` + `material(ctx)`, TSL nodes | surface table |
| `Math.random()` / `Date.now()` | `ctx.random()` in geometry, `api.random()` / `api.seconds()` in behaviors | LAW 1, LAW 7 |
| `side: DoubleSide` to fix a hole | nothing — both sides always draw. it is a **winding** bug | LAW 3 |
| `Matrix4` / `Quaternion` math | `builtin/vec3` + `builtin/math`, and sine/cosine by hand | LAW 7 |
| a forest of 300 `Mesh` clones | one scripted script + `terrain.decorations`, GPU-instanced | LAW 2 |

## translation table

| three.js | what it really is here |
| --- | --- |
| `new Scene()` / `scene.add(mesh)` | a **place** (`places.main`) / `api.spawn({ properties: {...} })`, or the object declared in the spec |
| `Object3D.position` | `properties.feetPosition` — the piece's **BASE** (its feet), not its center |
| `child.position` | the child's `feetPosition` = a **local offset** from the parent |
| `mesh.rotation` (radians) | `properties.rotation: { pitch, yaw, roll }` in **DEGREES**; on a child, a write is **LOCAL** |
| `mesh.scale` / `parent.attach()` | `properties.scale: num \| {x,y,z}` / `parent:` in the spawn, or `api.attachTo(parentId, offset)` |
| `BufferGeometry.setAttribute("position")` | `primitive: { kind: "custom", geometry: { positions: [...] } }` — 3 floats per vertex, 3 vertices per triangle |
| `setIndex()` and extra attributes | `geometry.indices`, `normals`, `uvs`, `colors`, `emissive`, `metalness`, `roughness` |
| `computeVertexNormals()` | automatic — the normal comes out of the face's **winding**, and both sides always draw |
| `BoxGeometry` / `SphereGeometry` / `CylinderGeometry` | `primitive: { kind: "box" \| "sphere" \| "cylinder", ... }` — 30+ kinds in the catalogue |
| `LatheGeometry` / `TubeGeometry` | `{ kind: "lathe", points: [[x,y],...], segments }` / `{ kind: "tube", points: [[x,y,z],...], radius, radialSegments, closed }` |
| `ExtrudeGeometry(shape)` | `{ kind: "extrude", shape: [[x,y],...], depth, bevelEnabled, bevelThickness, bevelSize }` |
| your own parametric geometry, with a loop | `primitive: { kind: "scripted", script, params }` + `export function geometry(ctx)` |
| mesh helpers, a stack of boxes | `require("builtin/geom")` — `loft`, `loftFrames`, `polyTube`, `boxZ`, `surface()` painting per face |
| `MeshStandardMaterial` | `material: { pbr: true, texture, color, metalness, roughness, emissive, emissiveIntensity }` |
| `ShaderMaterial` / node materials | `material: { kind: "scripted", script, params }` + `export function material(ctx)`, built from `require("builtin/tsl")` / `require("builtin/three")` |
| a `CanvasTexture` drawn by hand | a scripted texture: `texture: "scripts/tex-<name>.js"` + `export function texture(ctx)` painting `ctx.canvas(w,h)` |
| `EffectComposer` + passes | `atmosphere.look = { script, params }` + `export function look(ctx)`, `require("builtin/postfx")` |
| `AmbientLight` / `DirectionalLight` / `PointLight` / `SpotLight` | `properties.light: { kind: "ambient" \| "hemisphere" \| "directional" \| "point" \| "spot", ... }` |
| `Vector3` / `MathUtils` | `require("builtin/vec3")` (`add, sub, scale, dot, cross, normalize, distance`) / `require("builtin/math")` (`clamp, lerp, smoothstep, remap, degToRad`) |
| `Matrix4` / `Quaternion` in gameplay code | **not there.** yaw is sine and cosine by hand (LAW 7) |
| `Clock` / `Date.now()` / `Math.random()` | `api.getTick()`, `api.seconds()` (game clock in seconds since world start), `api.random()` / `api.randomRange(min, max)` |
| `renderer.render(scene, camera)` | **nothing.** the engine draws. you do not have that line. |

## LAW 1 — the world is live replicated spec, not a local scene

what you do **not** bring over, and why:

- **`import ... from "https://.../three.module.js"`** — `require()` resolves `builtin/*` and `lib/*.js` only. no URLs, no
  dynamic require. the shader namespaces `builtin/tsl`, `builtin/three` and `builtin/postfx` belong to `material(ctx)`
  and `look(ctx)` scripts — that is where node material classes live, and reading a symbol that is not in that
  vocabulary returns `undefined` plus one teaching line in `getLogs()`.
- **renderer code** (`WebGLRenderer`, `setPixelRatio`, composer wiring) — the client owns the render and its quality
  governor drops `renderScale` on its own when frames get expensive (0.55 is a real rung). you hand over spec; you do
  not configure a pipeline. the one authored dial is `api.patchEngine({ graphics: { renderResolution: [480, 270] } })`.
- **your own render loop** — `update(dt, api)` is the only loop. it runs on that entity's simulator and the result
  **replicates**: a transform written every tick is an upload every tick. the write budget is in
  `gavi#programar-de-verdade`.
- **a WebGL canvas by hand** (`getContext("webgl")`, `drawArrays`) — zero access. the only pixels you paint yourself are
  the scripted texture (`ctx.canvas(w, h)`, **1024 px per side max, 50 ms per bake**) and the DOM of `scripts/ui.js`.

one reason under all of it: "my scene in my browser" does not exist — a spec that N clients derive does. every mesh
must come out **identical on every client**, which is why `ctx.random()` and `ctx.noise2d()` are seeded per object and
why `Date.now`, `fetch` and `eval` are not in the sandbox.

## LAW 2 — three floats per vertex, three vertices per triangle

```js
properties: {                                    // 9 floats = 3 vertices = 1 triangle
  primitive: { kind: 'custom', geometry: { positions: [0,0,0, 2,0,0, 0,2,0], indices: [0,1,2] } },
  physics: 'static',                             // with no physics there is NO collider: the piece is a ghost
}
```

the real caps: **16,384 vertices** and **98,304 indices** per mesh (indices = vertices × 6). going past does not blow
up — the excess is **cut**, and the report in `getLogs()` names the emitted count against the cap ("98307 indices").
a mesh that big gets split by material region into two objects.

axes: right-handed, **Y+ up, Z− forward**, 1 unit = 1 m; `yaw` 0 faces −Z, 90 faces −X. UVs: a textured face gets an
automatic projection unless `geometry(ctx)` **returns** `{ uvs: [...] }` or
`{ uvProjection: "triplanar" | "box" | "cylindrical" | "planar" }`.

**never spawn raw inline geometry at runtime and leave it there.** a runtime `kind: "custom"` object carries its
buffers on the machine that spawned it; a client that joins later has neither the geometry nor a recipe to derive it,
and the engine reports `bespoke-geometry-underivable` — for that player the prop simply is not there. a scripted
generator is derivable by every client from the script + params, which is why it is the default lane.

## LAW 3 — winding defines the LIGHT, not the hole

the opposite of three.js: **both sides always draw**. a face turned the wrong way does not become a hole — it
**lights wrong**, and `ctx.smooth()` smears the seam straight across it. wind every face **counter-clockwise seen from
outside**, one convention for the whole mesh, and derive the direction from an outward vector, never by eye:

```js
// a → b → c → d counter-clockwise seen from outside  ⇔  cross(b−a, d−a) points OUTWARD
function quadOut(ctx, a, b, c, d, out) {
  const u = [b[0]-a[0], b[1]-a[1], b[2]-a[2]], v = [d[0]-a[0], d[1]-a[1], d[2]-a[2]];
  const n = [u[1]*v[2]-u[2]*v[1], u[2]*v[0]-u[0]*v[2], u[0]*v[1]-u[1]*v[0]];
  if (n[0]*out[0] + n[1]*out[1] + n[2]*out[2] >= 0) ctx.quad(a[0],a[1],a[2], b[0],b[1],b[2], c[0],c[1],c[2], d[0],d[1],d[2]);
  else ctx.quad(a[0],a[1],a[2], d[0],d[1],d[2], c[0],c[1],c[2], b[0],b[1],b[2]);   // flipped
}
```

prove it with your eye, three steps: `preview_object` on the object (the booth runs the engine's own derive, so what
it shows is what spawns); find the face reading **flat or dark** beside neighbours of the same colour; flip
`ctx.flat()` to `ctx.smooth()` — a seam on a corner that should be round gives the reversed face away. two booth
caveats, both stated in its own reply: `ctx.albedo` textures are not sampled there, and `ctx.groundY` reads flat
ground. a thin sheet seen from both sides (flag, sail, fence panel) emits **both windings**; anything the player walks
around is a **closed solid**.

## which geometry lane — decide by the numbers

| the form is | lane | real cost |
| --- | --- | --- |
| box, wall, beam, disc, platform | **one primitive** from the catalogue | 1 entity, shared geometry — the cheapest thing there is |
| prop, structure, vehicle, weapon, tower — parametric, yours | **`kind: "scripted"` + `geometry(ctx)`** | 1 entity, 1 mesh, cap 16,384 vertices |
| a vertex list computed elsewhere | **`kind: "custom"` + `positions`** | same cap, no regeneration from params — and see the underivable trap in LAW 2 |
| it runs along a line (wall, handrail, pipe, vine) | **scripted spline** + `profile(ctx)` | the loft and the collider come from the engine |
| humanoid or creature needing a rig and clips | **conjured GLB**; non-humanoid motion in code → `gavi#animar-esqueleto-codigo` | mixer + `?animations=` |
| 40 pieces that make ONE object | **1 scripted script**, not 40 entities | 40 entities = 40 replicated transforms and 40 draws |

already stacked as separate box entities and z-fighting? `api.unionSolid([ids])` merges them into one solid — interior
and coplanar faces die in the union, the N colliders become one. two faces closer than **~5 cm** read as coplanar from
a long sightline; that is the depth buffer's floor, not a tunable.

## LAW 4 — `geometry(ctx)`: one loop, one mesh

the `for` you would have written, with no `BufferGeometry` in the middle — a trunk in rings, face direction proven:

```js
// scripts/gen/trunk.js → primitive: { kind: 'scripted', script: 'scripts/gen/trunk.js', params: { rings: 6 } }
export function geometry(ctx) {
  const p = ctx.params;
  const sides = Math.max(5, Math.floor(p.sides ?? 7));      // 7 sides still reads round at 6 m
  const rings = Math.max(2, Math.floor(p.rings ?? 6));      // 6 rings = 5 bands of quads
  const hgt = p.height ?? 4.2, rBase = p.radius ?? 0.32;
  const ring = (i) => {
    const t = i / (rings - 1), r = rBase * (1 - 0.55 * t);  // tapers 55% toward the top
    const lean = ctx.noise2d(i * 0.7, 0) * 0.18 * t;        // seeded: identical on every client
    const pts = [];
    for (let k = 0; k < sides; k++) { const a = (k / sides) * Math.PI * 2; pts.push([Math.cos(a) * r + lean, t * hgt, Math.sin(a) * r]); }
    return pts;
  };
  ctx.color(0.33, 0.22, 0.13, 1); ctx.roughness(0.85);
  let b = ring(0);
  for (let i = 1; i < rings; i++) {
    const c = ring(i);
    for (let k = 0; k < sides; k++) {
      const j = (k + 1) % sides;    // b[k] → c[k] → c[j] → b[j]: cross(c[k]−b[k], b[j]−b[k]) = radially OUTWARD
      ctx.quad(b[k][0],b[k][1],b[k][2], c[k][0],c[k][1],c[k][2], c[j][0],c[j][1],c[j][2], b[j][0],b[j][1],b[j][2]);
    }
    b = c;
  }
}
```

`params` are **copied at spawn**: `api.setProperty("primitive.params.rings", 9)` regenerates that mesh on the spot,
but editing the file's default never repaints what already copied it — destroy and respawn. bevel everything:
**0.004** on a small object, **0.008** on a furniture panel, **0.015** on an architectural piece. a dead-flat edge is
a generator's signature.

## LAW 5 — the loft kit does the stitching for you

`require("builtin/geom")` is the `Extrude`/`Tube` of this place, and it **owns the winding law** — CCW section, rings
along the travel direction, walls and caps facing out. `surface()` paints **per face** with seeded grain, so nothing
ships flat.

```js
// scripts/gen/barrel.js
const G = require('builtin/geom');

export function geometry(ctx) {
  const oak = G.surface(ctx, { tex: 'cdn/wood-oak.png', r: 0.42, g: 0.28, b: 0.16, rough: 0.72, jitter: 0.14 });
  const iron = G.surface(ctx, { r: 0.30, g: 0.31, b: 0.33, metal: 0.80, rough: 0.50 });
  const h = ctx.params.height ?? 0.9, r0 = ctx.params.radius ?? 0.34;
  const hoop = (y, r) => ({ c: [0, y, 0], f: [0, 1, 0], up: [0, 0, -1], poly: G.oval(r * 2, r * 2, 0, 0, 14) });
  const body = [];
  for (let i = 0; i <= 6; i++) { const t = i / 6; body.push(hoop(t * h, r0 * (0.82 + 0.18 * Math.sin(t * Math.PI)))); }
  G.loftFrames(ctx, body, oak);                             // 7 stations, belly at the middle: wall + caps face out
  for (const t of [0.22, 0.78]) {                           // two 6 cm iron bands
    const r = r0 * (0.86 + 0.18 * Math.sin(t * Math.PI));
    G.loftFrames(ctx, [hoop(t * h - 0.03, r), hoop(t * h + 0.03, r)], iron);
  }
}
```

also in the kit: `boxZ` (chamfered block), `tube` (tapered tube between two points), `polyTube` (tube along a
polyline, parallel-transported — never twists), `rrect`/`oval` (sections), `sectionRings`/`pathRings` (rings). style is
the **paint**, not the vertices: the same mesh goes lowpoly or realistic by swapping the `surface()` defs.

## LAW 6 — a wide mesh follows the terrain with `ctx.groundY`

an object has ONE anchor. a wide mesh (a stand of trees, a fence run, a rock skirt, stairs down a bank) that measures
everything from that anchor **floats on one side and buries itself on the other**. `ctx.groundY(x, z)` is the ground
under the **local** (x, z), relative to the anchor — so every contact grounds itself:

```js
export function geometry(ctx) {                     // fence on a slope: each post measures from ITS OWN ground
  const n = Math.max(2, Math.floor(ctx.params.posts ?? 9));
  const span = ctx.params.span ?? 2.4, t = 0.06;    // 2.4 m between posts, 12 cm post
  ctx.color(0.38, 0.27, 0.17, 1);
  for (let i = 0; i < n; i++) {
    const x = (i - (n - 1) / 2) * span;
    const y0 = ctx.groundY(x, 0) - 0.25;            // 25 cm buried
    quadOut(ctx, [x-t,y0,-t], [x+t,y0,-t], [x+t,y0+1.3,-t], [x-t,y0+1.3,-t], [0,0,-1]);
    quadOut(ctx, [x-t,y0, t], [x+t,y0, t], [x+t,y0+1.3, t], [x-t,y0+1.3, t], [0,0, 1]);
  }
}
```

on flat ground `groundY` returns 0 everywhere, so writing it this way from the start is free. anything that samples
the ground **re-derives itself** when the terrain is edited or the object moves — never bake a slope height into a
param. `ctx.groundNormal(x, z)` gives the local normal to tilt a piece into the ramp, and both work inside
`collider(ctx)` too.

## which surface lane — decide by the numbers

| the surface is | lane | what it costs |
| --- | --- | --- |
| colour, texture, metal, roughness, fixed glow | plain `MaterialSpec` (`pbr: true` + `texture` derives normal/rough/metal) | cheapest, and it **batches** |
| a drawn pattern (brick, sign, wear, tileset) | scripted texture `"scripts/tex-x.js?courses=9"` | one bake per variant, then it is an ordinary texture |
| colour per face out of the generator | `ctx.color` / `emissive` / `metalness` / `roughness` in the mesh | free — it rides in the vertex |
| pulsing, dissolving, fresnel, cut-out foliage, vertex wave | scripted material (`kind: "scripted"`, TSL) | its own draw and its own compiled pipeline |
| whole-screen grade, bloom, vignette, shafts | `atmosphere.look` script, `builtin/postfx` | one pass chain; parks at the neutral baseline if it tanks the frame |

a scripted material does **not** batch: one draw and one pipeline each — right for a hero or a boss, wrong for 300
scattered copies. the same script with the same params shares one pipeline, and changing a **numeric param** through
`ctx.param(name, default)` never recompiles the shader, so drive motion through params, not through script edits.

## LAW 7 — time, randomness and the loop

```js
export const updateSchedule = { every: 3 };   // the engine skips ticks; dt already arrives as the declared step
export function update(dt, api) {
  const t = api.seconds();                    // game clock, seconds since world start
  const roll = api.random();                  // NEVER Math.random(): every client would roll a different number
  api.runInSeconds(0.4, () => { /* no setTimeout in the sandbox */ });
}
function rotateY(p, degrees) {                // no Matrix4, no Quaternion: yaw (0 → −Z, 90 → −X) is this
  const a = degrees * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
  return { x: p.x * c + p.z * s, y: p.y, z: -p.x * s + p.z * c };
}
```

`updateSchedule` also takes `{ every: { seconds: 0.5 } }` and `{ near: { tag: "player", radius: 40 } }` — a distant
cohort spends no frames. and never keep a hand-rolled `tick % 3` gate next to a declared `every: 3`: two gates with
independent phase means the body mostly stops running.

## how it goes wrong

1. **hunting for `import` and `Scene.add`.** TELL: "cannot find module three", or a script that never compiles.
   FIX: `require()` takes `builtin/*` and `lib/*.js` only; an object is spec — `api.spawn(...)` or declared in the place.
2. **bringing the loop.** TELL: it looks right on your machine and stutters for everyone else, and nobody says
   "it is replicating too much". FIX: `update(dt, api)` + `updateSchedule`, and threshold your transform writes
   (`gavi#programar-de-verdade`).
3. **`Math.random()` or `Date.now()` inside geometry.** TELL: two players describe the same prop differently, or a
   mesh changes shape on reload. FIX: `ctx.random()` / `ctx.randomRange()` / `ctx.noise2d` in geometry, `api.random()`
   and `api.seconds()` in behaviors.
4. **treating `position` as the center and angles as radians.** TELL: the prop sits half-buried or floats ~0.9 m, and
   45° rotations scatter while cardinals look fine. FIX: `feetPosition` is the base; a child's write is a **local**
   offset and a **local** rotation; angles are **degrees**. measure with `api.getWorldBoundsBox(id)`, never with a hunch.
5. **fixing a "hole in the mesh" with `side`.** TELL: the face is not missing — it is dark or flat, and smooth shading
   smears at that seam. FIX: it is winding (LAW 3), or a quad you never emitted.
6. **runtime-spawned raw `kind: "custom"` geometry.** TELL: one player sees the prop, another sees nothing, and
   `getLogs()` carries `bespoke-geometry-underivable`. FIX: put it in the spec, or move it to a scripted generator
   every client can derive.