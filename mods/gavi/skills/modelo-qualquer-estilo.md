---
name: Model In Any Style
description: The front door of form — deciding what anything visible is made of (conjured rig, single primitive, scripted mesh, painted surface, sprite) and in which style, plus the laws that hold across both lanes: a conjured name freezes, a canary before re-minting a cast, scale and pivot checked against getWorldBoundsBox, an authored collider proven with colliders true, and the symptom-cause-fix table for form. Load before making anything visible; the deep ends are gavi#criar-modelo-3d and gavi#criar-pixel-art.
---

# Gavi — what this thing is made of

a router. a request comes in — "a cart", "a boss", "a numbered sign", "a village cast" — and **one sentence** comes
out with pipe, scale, family, collider and proof.

the deep ends are already written: volume in `gavi#criar-modelo-3d`, image in `gavi#criar-pixel-art`, movement in
`gavi#animar-doutrina`, three.js instincts translated in `gavi#three-js`, finishing and asset failure codes in
`gavi#qualidade-sem-falha`. what lives here is only what decides **the material of the thing** — and what it costs to
decide wrong.

## pick the pipe in ten seconds

| the ask | pipe | the sentence that follows |
| --- | --- | --- |
| a person, a creature that walks | conjured GLB | `model: ".../model-humanoid-<who>.glb?animations=Idle,Walk,Run"` + a canary if it is a cast (§2) |
| a platform, wall, beam, post, gate | single primitive | one `kind:`, exact dimensions, `physics: "static"` |
| a cart, tower, ship, weapon, city block — **most props** | scripted primitive | `geometry(ctx)` + a `collider()` shell (§6) |
| a pattern, sign, number, wear, grime | painted surface | `texture: "scripts/tex-x.js?p=v"` — N variants, 0 mints |
| a hero, portrait, boss face (2D) | conjured sprite | full name on the first go; it freezes (§2) |
| a tileset, an icon set, a HUD frame | painted script | `ctx.wang` / one parametric glyph script |
| grass, ferns, flowers by the thousand | `terrain.decorations` | `decorations: { deck: "meadow" }` |
| it runs along a line | spline | `spline: { kind: "fence" \| "wall" \| "handrail" \| ... }` |
| it must be exactly this size | measure, then clamp | `getWorldBoundsBox(id).size.y`, then `layout.maxExtents` (§3) |

---

## 1 — the four ways to bring form in

| pipe | how you write it | pick it when | what picking wrong costs |
| --- | --- | --- | --- |
| **conjured model** | `model: "/cdn/moodboard-<family>/model-<thing>.glb?animations=..."` | it needs a **skeleton that animates** — humanoids above all | queue time, absent while it cooks, vertices not editable, name frozen on first delivery. a conjured chair = 1 mint spent and 0 control |
| **single primitive** | `primitive: { kind: "box" \| "cylinder" \| "wedge" \| "lathe" ... }` | it fits in **≤ 2 pieces** with no oblique edge | by the 3rd box you have 12 entities and 12 draws where 1 fit, and faces closer than ~5 cm flicker against each other from any distance |
| **scripted primitive** | `primitive: { kind: "scripted", script, params }` + `geometry(ctx)` | **the default** for props and structures: ≥ 4 pieces, or 1 oblique edge, or 2+ materials on one thing | not using it means paying both rows above. using it is 1 entity, 1 draw, 0 queue, a form that is exactly yours and editable through `params` |
| **hand vertices** | `primitive: { kind: "custom", geometry: { positions: [...] } }` | ≤ ~24 triangles you can name out loud (a gable roof is 8), or the numbers arrive from a table | no regeneration from `params` — one dimension change is a rewrite; and a **runtime-spawned** custom mesh is `bespoke-geometry-underivable` for anyone who joins later, who sees no prop at all (put it in the spec, or use a generator) |
| **painted surface** | `texture: "scripts/tex-<name>.js?p=v"` (material, sprite, tile, HUD) | what changes is the **skin**, not the volume | conjuring 4 shades of one wall = 4 frozen names where 1 file with `?tone=` gave you N variants free |

the funnel, four questions, in this order — each carries a **number**, so the answer is not taste:

1. **does it need a rig and clips?** → conjured GLB. a humanoid is always this pipe, and a creature that walks and
   breathes is too. a chest that only opens is **not**: that is one scripted mesh with a `pivot` and an `animate` on yaw.
2. **does the volume close in ≤ 2 exact primitives, no oblique edge, every dimension a number you can write down?** →
   single primitive. the moment you type the **third** `p.box` you left this pipe two boxes ago.
3. **is it ≤ ~24 triangles you can name, or do the vertices come from a table or exported data?** → hand vertices,
   `kind: "custom"`. a gable roof is 8 triangles and wants nothing more.
4. **is it the skin that changes and not the form?** → painted surface, `scripts/tex-<name>.js?p=v`.
   left over? → **scripted primitive**: ≥ 4 pieces, or one oblique edge, or 2+ materials on one thing, cap
   **16,384 vertices** per mesh. it is left over most of the time, and it is the pipe that makes a prop read authored.

- vegetation, rock, stock prop: scripted, always — instant, no cook. a living canopy is a scripted hull **plus**
  `material: { kind: "scripted" }`, never ten thousand leaf cards.
- anything running **along a line** (handrail, fence, wall, trim) is a spline, not a mesh — vertex caps and the
  spline list in `gavi#criar-modelo-3d` LAW 1.
- **a flat image runs the same funnel**, trading volume for plane: identity gets conjured, rule gets painted. the
  row-by-row table is `gavi#criar-pixel-art`; I will not repeat it here.
- style does not change the pipe, it changes the **paint** on the same pipe: one scripted cart wears `lowpoly-cozy`
  as flat vertex colour and `realistic-gritty` as texture + tint (§5).

---

## 2 — a conjured name freezes; a cast changes with a canary

the mechanics are written once, in the deep ends — `gavi#criar-modelo-3d` LAW 8 and `gavi#criar-pixel-art` LAW 1. what
a router owes you is the four laws in the order they bite, and the arithmetic of getting them wrong.

1. **the path is the asset.** a name generates on first fetch and is served **forever** after; there is no catalogue to
   check and no cache to clear. similar wordings collide onto the same file.
2. **a look change is a new filename**, with a distinct token (`-2`, `-v3`), and the refs move to it while the old name
   goes on serving whoever still points at it. re-asking in better words is not a new asset.
3. **a cast changes with a canary** — one member, one frame, one question, then the other N−1 (the procedure below).
4. **a conjured asset is INVISIBLE while it cooks**, so a done-claim needs **a frame with the thing in it**. no frame =
   the sentence is "it is cooking", never "it is in" and never "it should be there now". the receipt is
   `api.onModelReady(id, cb)` (fires when the bounds land, releases at the ~800 s cook ceiling) followed by
   `view_live_scene({ frame: id })`. an empty frame with a clean `getLogs()` is a cook in flight; an empty frame with a
   404/400 is a dead path that only renaming escapes (§7).

**a mint is a purchase.** every new path cooks for real against this game's budget, and the queue lags. so: mint when
the game is about to reach the thing, never "the whole cast up front".

**the canary** — when a whole cast is about to change face (8 villagers to `-v2`, the family from `toon-vibrant` to
`gothic-horror`), you re-mint **1**:

1. pick the **most-seen** member — the one on the first screen.
2. re-mint only that one under the new token. the other N−1 keep serving the old name.
3. wait with a receipt, not with faith: `api.isModelReady(id)` polls it, `api.onModelReady(id, cb)` fires when the
   bounds land and releases at the cook ceiling (~800 s), so a swap can never hang forever.
4. show the frame — `view_live_scene({ frame: id })` — and ask **one** line: "is this the tone? do I run the other 7?"
5. only on the yes do the N−1 run, in the same token.

the arithmetic: 8 members re-minted on a guess is **8× the queue** spent on one hunch, and the creator is judging v4
while you have already minted v6. a canary costs 1 and comes back with a receipt.

no canary needed: a one-off piece, or a descriptor already seen served in **this** game.

---

## 3 — scale and pivot: half of all mistakes die here

- `feetPosition` is the **BASE** (feet, horizontally centered), not the center of the volume — the law is
  `gavi#criar-modelo-3d` LAW 3, the symptom is in §7.
- **a model arrives at real-world size.** conjured or uploaded, the paperwork is the truth, above the thumbnail and
  above your guess. place it bare first. `layout: { minExtents, maxExtents }` clamps in **meters before** `scale` (the
  same value in min and max on an axis locks that size); `scale` multiplies afterwards; the collider derives from the
  model and follows `scale`.
- fixing size is `layout.maxExtents`, **not** a guessed `scale` stacked on a `scale`.

| piece | pivot | why |
| --- | --- | --- |
| character, ground prop, building | `"feet"` (default) | its position is where it stands |
| spinning pickup, wheel, gear | `"center"` | it spins on its own axis, not in orbit |
| lantern, hanging sign, bell | `"top"` | it swings from its suspension point |
| door hinged at the edge | `[0, 0.5, 0.5]` (normalized u,v,w — `v = 0` is the foot plane) | `yaw` opens the door instead of dragging the opening across the wall |
| hinge off a corner | `{ x, y, z }` in **meters**, local to the foot, pre-`scale` | `{0,0,0}` is the foot, i.e. no pivot at all |

rotation happens around the pivot; **scale stays anchored at the foot**.

**check with bounds, not with a hunch:**

```js
const b = api.getWorldBoundsBox('boss-1');        // { min, max, size, center }
// b.size.y  = the real drawn height in meters → compare against the ruler (player 1.8 m)
// b.min.y   = the real base in world Y → compare against api.getTerrainHeight(x, z):
//             0.04 m above the ground is floating; 0.3 m below is burial
// b.geometryPending === true → that is the layout placeholder, re-read after it loads
// b === null → "do not know yet", NEVER "size zero" (one warning in getLogs)
```

stacking B on A is `api.getWorldBoundsBox('a').max.y`, never heights added up by hand.

---

## 4 — 2D and pixel on the same ruler

- **the foot anchor is the bottom line of the sheet.** the sprite `anchor` defaults to `[0.5, 0]` — bottom-center —
  and the auto-derived `collider2d` hull is expressed against that same point. 3 px of empty space under the art at
  20 px/m is **0.15 m of float**, and every member of the cast floats by a different amount.
- **resolution by class**, and classes do not mix on screen: the 8→128 px table is `gavi#criar-pixel-art` LAW 4.
  pixels are not meters: a conjured sprite is sized from its metadata at 64 px per world unit, while a sprite with a
  **script** texture declares nothing — without `size: [w, h]` (or `pixelsPerUnit`, which only applies when `size` is
  omitted) the quad comes out 1×1 m.
- **billboard**: `"yaw"` (default) for characters, creatures, trees; `"full"` only for a floating marker (it lays the
  character down under a high camera); `"none"` for decals and signs. fake shadow numbers in
  `gavi#criar-pixel-art` LAW 10.

blurry pixel art has 4 causes, diagnosed in this order:

| symptom | cause | fix |
| --- | --- | --- |
| soft standing still, up close | linear filtering on pixel art | `filter: "pixel"` on the sprite (the bake's own filter does **not** carry into CSS — in the HUD it is `image-rendering: pixelated`) |
| pixels of different widths on one edge | fractional screen scale (1.7×) or a non-integer `scale` | scale 2/3/4 and solve `orthoSize` with the formula in `gavi#criar-pixel-art` LAW 7 |
| crisp still, shimmers while scrolling | camera sitting at a fractional texel position | `api.patchCamera({ pixelSnap: true })` — quantized post-smoothing, orthographic only; inert in perspective |
| grid destroyed on the diagonal | free `rotation` on pixel art | rotate by swapping art (`?facing=`), never the entity |

---

## 5 — surface: what this piece ought to be saying

flat colour is a **legitimate, finished** look inside the flat families — `lowpoly-cozy`, `voxel-bright`,
`pixel-bright`, `pixel-moody`. outside them flat reads unfinished, and the habit is **CDN texture + tint**. the
`metalness`/`roughness` numbers are `gavi#criar-modelo-3d` LAW 7; the ruler below is intent, piece by piece.

| the piece | ought to be saying | so it wears |
| --- | --- | --- |
| floor, wall, prop inside a flat family | "it is like this on purpose" | vertex colour + 1 shade of variation per region. heavy PBR here reads wrong in the other direction |
| wood, stone, cloth outside a flat family | "this has been used before" | texture + tint, `roughness` varying by region, `jitter: 0.10` on `G.surface` |
| painted ironwork | "paint, not metal" | `metalness: 0` — the classic mistake is painting metal at 0.9 |
| lit window, panel, firefly, ember | "this is the light source" | `emissive` + `emissiveIntensity`, never one real light per point |
| canopy, fire, cloud, water | "this is alive" | scripted hull + `material: { kind: "scripted" }` |
| gray volume with no material | "this is not art yet" | only allowed if it was **declared** greybox, with a time on the clock (`gavi#qualidade-sem-falha`) |

---

## 6 — collider: a cheap authored shell, in the same frame of reference

a scripted mesh **without** the `collider()` export collides as the visual — a trimesh far more detailed than any prop
needs. with the export, you choose:

- `return { kind: "box" | "sphere", ... }` — cheap shell, the normal case.
- emit `ctx.tri` / `ctx.quad` — an authored closed hull, for when the form lies (arch, opening).
- **emit nothing** — no collider at all: that is how one piece of a set leaves collision to its sister.
- a model with a cutout needing exact collision: `collider: "mesh"` — **static only**.

`collider()` gets the same `ctx` as the mesh: same `params`, `y = 0` at the foot, `ctx.groundY` available. a shell
written with a different number than the mesh is an invisible wall wearing your prop's name.

```js
// scripts/gen/cart.js — the shell reads the SAME params as the mesh
export function collider(ctx) {
  const d = ctx.params.length ?? 2.8, w = ctx.params.width ?? 1.4;
  return { kind: 'box', width: w, height: 1.2, depth: d };   // the bed; the wheels stay out
}
```

the proof is one thing: `view_live_scene({ colliders: true })` — the wireframe composites **over** the image and the
answer carries a live-vs-spec drift read. without that frame, "it has collision" is a guess. and a structure with no
`physics` field is a ghost: no collider exists at all. whether the player can actually **walk** the thing you built is
a different question with a different instrument — `api.traverseCheck(from, to)` and the end-to-end sweep in
`gavi#testar-tudo`.

---

## 7 — symptom → cause → fix (form only)

the dead-asset and queue-pressure codes have a full catalogue in `gavi#qualidade-sem-falha`. the first three rows are
the shortcut; the rest is form decisions.

| symptom | likely cause | fix |
| --- | --- | --- |
| model invisible, new name, clean log | **it is cooking** — the path generates on first fetch | `api.isModelReady(id)` / `api.onModelReady(id, cb)`, then look. until a frame exists, the sentence is "it is cooking" |
| white/pink with **404** (does not exist) or **400** (refused) | dead path — that URL will never serve | the only way out is **renaming**: a new name is a new attempt |
| failed and recovers on its own — **429**/408/425 | queue full: pressure, not death | wait and re-read. renaming here burns a name for nothing |
| piece buried halfway | absolute Y written by hand, or a vertex at negative Y in `geometry` | `feetPosition: { x, z, y: { terrain: 0 } }`; in the generator the foot is `y = 0` |
| piece floating 3–30 cm | `feetPosition` treated as center, or empty space under the model | drop the `+ height/2`; if it is the model, measure `getWorldBoundsBox(id).min.y` instead of guessing an offset |
| a 3 m barrel, a 0.4 m hero | `scale` guessed onto a model that already arrived at real size | measure `size.y` against the ruler, correct with `layout.maxExtents` |
| bounds `null` or `geometryPending: true` | still loading in this realm | `null` is "do not know yet", never zero; `geometryPending` is the `layout` placeholder — re-read after load |
| model shows up, one piece missing | the piece is not in `?parts=`, or `visible: false` left over from a swap | check the parts list; on a swap, hide the original **inside** `onModelReady` so the silhouette never opens a hole |
| script-texture sprite comes out 1×1 m | scripted declares no size at all | `size: [w, h]` in meters, or `pixelsPerUnit` |
| piece orbits itself | pivot at the base where it wanted center or a hinge | `pivot` from §3 |
| mesh cut off, warning in `getLogs()` | past the 16,384-vertex / 98,304-index cap | split into 2 meshes by material region (`gavi#criar-modelo-3d` LAW 1) |
| one player sees the prop, another sees nothing | runtime-spawned raw `kind: "custom"` geometry — `bespoke-geometry-underivable` | put it in the spec, or move to a scripted generator every client can derive |

---

## 8 — the sentence that closes the routing

before touching a vertex or a filename, write five fields: **pipe · scale and reading distance · family and surface ·
collider · proof**. without them you stack boxes or burn queue:

```
bell tower · 9 m, read at 12 m · ~11 pieces → scripted primitive
family toon-vibrant → texture + tint (not flat)
collider: box 3 × 9 × 3 in collider()
proof: preview at 128 px + in-place frame with colliders: true
```

`cast of 8 villagers · humanoid → conjured model · canary on the villager in the square first` is the same sentence for
the other lane. execution steps live in the procedures of `gavi#criar-modelo-3d` and `gavi#criar-pixel-art`; this file
only makes sure you entered the right pipe, at the right size, with the right receipt.

## how it goes wrong

1. **conjuring what code should have made.** TELL: a chair, a crate or a rock arrives 40 s later, unchangeable, and you
   cannot nudge one dimension. FIX: run the three-question funnel first — if it needs no rig, it is a scripted
   primitive, instant and parametric.
2. **coding what needed a rig.** TELL: a "person" built out of boxes that cannot walk, and every attempt at a stride
   reads broken. FIX: humanoid = conjured GLB with the clips listed in `?animations=`; only non-humanoid motion is
   worth hand-driving (`gavi#animar-esqueleto-codigo`).
3. **re-minting a whole cast on one guess.** TELL: 8 new names cooking at once and the creator judging v4 while you
   are on v6. FIX: the canary — 1 member, one frame, one question, then the rest (§2).
4. **`scale` guessed on top of a real-size model.** TELL: the hero is 0.4 m or the barrel is 3 m, and every further
   fix makes another prop wrong. FIX: measure `getWorldBoundsBox(id).size.y`, clamp with `layout.maxExtents`.
5. **a collider shell written with different numbers than the mesh.** TELL: the player is stopped by nothing, or walks
   through the visible bed of the cart. FIX: read the same `ctx.params` in `collider()` as in `geometry()`, then prove
   it with `colliders: true`.
6. **"it looks right" with no frame.** TELL: your description of the prop and the screenshot disagree, and the creator
   finds it before you do. FIX: `preview_object` at 128 px plus one in-place `view_live_scene` at the game's distance,
   every time — and `getLogs()` after, where truncation and the geometry rails live.