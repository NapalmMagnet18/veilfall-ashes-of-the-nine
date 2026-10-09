---
name: Create Pixel Art
description: The 2D and pixel-art lane — the CDN path shape /cdn/moodboard-<family>/<category>-<name>.png and the nine style families, the two laws that bite hardest (a served filename keeps its look forever; textureScale is METERS PER TILE), painting a texture in a tex-*.js script, working resolution, palette ramps, the sacred grid, wang tilesets, pixel UI and sprites inside a 3D scene. Frames and timing are gavi#animar-2d.
---

# Gavi — making 2D art and pixel art

this skill is about **the image existing**. frames, timing and the mixer are `gavi#animar-2d`; readability is
`gavi#animar-doutrina`; which lane anything belongs to at all is `gavi#modelo-qualquer-estilo`. here you pick where
the image comes from, at what resolution, with which palette, and how it sits on the grid.

## pick your row in ten seconds

| the image is | lane | one line of it |
| --- | --- | --- |
| hero, NPC, boss, menu portrait — an **identity** | conjure it | `/cdn/moodboard-pixel-bright/sprite-topdown-village-guard.png` |
| sky, backdrop plate, painted texture | conjure it | `/cdn/moodboard-painterly-fantasy/texture-sky-dawn.png` |
| a **rule**: pattern, sign, number, wear, grime | paint it in a script | `texture: "scripts/tex-wall.js?tone=cool&wear=0.3"` |
| tilemap ground, or a seam between two materials | script, **always** — `ctx.wang` | `tileset: "scripts/tileset-cave.js?a=floor&b=rock"` |
| UI icon, frame, bar | script, same ref in `ui.js` | `<img src="scripts/tex-icons.js?slot=heart">` |
| the art on a 3D surface came out cropped or tiny | it is `textureScale` — **meters per tile** | LAW 2 |
| the look changed but the CDN serves the old art | the name froze — mint a new one | LAW 1 |
| a drawing the player makes while playing | upload from the UI realm | `window.spawn.assets.uploadImage({ blob })` |

a 2D game **opens** painted in scripts (it exists at t=0) and gets dressed as it goes: a conjuration arrives cooking
and the swap is one string. deeper lanes: the `drawn-art` skill for the bake surface, `2d-mode` for registering the place.

## LAW 1 — the path is the asset, and the name freezes forever

the shape, exactly: **`/cdn/moodboard-<family>/<category>-<name>.png`**. the nine permanently warm families:
`lowpoly-cozy`, `painterly-fantasy`, `toon-vibrant`, `voxel-bright`, `realistic-gritty`, `scifi-neon`,
`gothic-horror`, `pixel-bright`, `pixel-moody`. one family per world — the family *is* the coherence.

the CDN delivers by **filename**. served once, that name keeps that look forever, and rephrasing the request in other
words collides straight back onto the same file.

- write the **full** name on the first go: category + view + subject.
  `sprite-topdown-…`, `sprite-platformer-…`, `sprite-isometric-…`, `sprite-sceneobj-<view>-<subject>` for scenery,
  `portrait-<who>.png` for a face. leave the view out and you get a silent top-down pose.
- look changed? **a new filename with a distinct token** — `-2`, `-v3` — and move the refs to it. the old name goes on
  serving whoever still uses it. re-asking in new words is not a new asset; it is the same file.
- one character is **one basename**; state is a derivation — `?facing=` (8 tokens: `up`/`down`/`left`/`right` plus the
  four diagonals in kebab) and `?modify=`. `hero-jumping.png` beside `hero.png` is a second character: different
  palette, different proportions.
- a mint is a **purchase** against this game's budget. before re-minting a whole cast, re-mint **1** — the
  most-seen member — show the frame, ask one line, then run the other N−1 in the same token
  (`gavi#modelo-qualquer-estilo` §2). 8 mints on one guess is 8× the queue spent on a hunch.

## LAW 2 — `textureScale` is METERS PER TILE

the number everybody reads backwards. `textureScale` is how many **meters one tile of the art covers** (default 2.5).
bigger = the pattern gets larger and sparser.

- **`textureScale: 1` on a 0.45 m box face shows 45% of the image.** one tile spans 1 m, the face is 0.45 m, so you
  see just under half the art — cropped, not broken. want the whole picture on that face? `repeat: [1, 1]`, which is
  exactly one copy filling the face: signs, posters, portraits, labels.
- flat-faced kinds — `plane`, `box`, `wall`, `extrude`, `circle`, `lathe` — auto-tile square to real-world scale, so
  `textureScale` behaves as described. `textureScale: 2` on a stone wall is one tile every 2 m; `0.5` is dense detail.
- **curved kinds do not run that path.** sphere, cylinder, cone, capsule, hemisphere sample a fixed world projection
  (about one tile per 4 m) and `textureScale`/`repeat` do not reshape it — a non-seamless texture shows its seam where
  the projection wraps. one printed image on a round tabletop = a `circle` laid just above the face with `repeat: [1,1]`.
- terrain materials use the same meaning (default 2.5): `textureScale: 10` on a 512 px texture is chunky painterly
  ground, `1` is dense detail.
- `color` next to `texture` is a **tint multiply**, not a base coat: neutral is a no-op, saturated repaints the hue.
  omit `color` to show a texture's own palette.

## LAW 3 — a texture script is the parametric lane

the question that decides it: *does this vary by parameter?* four shades of the same wall, ten numbered signs, three
levels of grime — that is one script with `?params`, zero mints spent.

the real `ctx`: `ctx.canvas(w, h)` (the **first** canvas is the texture; later ones are scratch to compose with
`drawImage`), `ctx.params` (typed query string), `ctx.random()` (deterministic PRNG seeded by the full ref — every
client bakes identical texels), `ctx.atlas(...)` (frame sheets — `gavi#animar-2d`), `ctx.wang(...)` (LAW 8) and
`require("lib/...")`. Canvas2D is the whole library. budget: **50 ms per variant, 1024 px per side**, baked once and
cached.

```js
// scripts/tex-wall.js — one family: ?tone=cool&wear=0.3&tile=32
const P = require('lib/palette');                          // the SAME palette as the whole game
export function texture(ctx) {
  const { tone = 'cool', wear = 0, tile = 32 } = ctx.params;
  const R = P.stone[tone];                                 // 3-step ramp: [light, base, shadow]
  const c = ctx.canvas(tile, tile);
  c.fillStyle = R[1]; c.fillRect(0, 0, tile, tile);
  for (let y = 0; y < tile; y += 8) {                      // courses of 8: divides 32, so it matches at the edge
    c.fillStyle = R[2]; c.fillRect(0, y, tile, 1);         // horizontal joint
    c.fillStyle = R[0]; c.fillRect(0, y + 1, tile, 1);     // light edge along the top of the brick
    c.fillStyle = R[2];
    for (let x = ((y / 8) % 2) * 8; x < tile; x += 16) c.fillRect(x, y + 1, 1, 7);   // vertical joint
  }
  const n = Math.round(wear * tile * tile * 0.08);         // wear = noise, gone at 0
  for (let i = 0; i < n; i++) c.fillRect((ctx.random() * tile) | 0, (ctx.random() * tile) | 0, 1, 1);
}
```

prefer `tex-door.js?kind=boss&state=locked` over four near-identical files. a single-use texture can be committed
inline with `api.setScript("scripts/tex-crate.js", "...")` in the same `run_script` that uses it. a failed script
**parks** with a placeholder plus a diagnostic in `getLogs()` — `texture-script-compile-failed`,
`texture-script-runtime-error`, `texture-script-budget` — and any edit re-bakes the family live.

## LAW 4 — pick the resolution before the first pixel

| resolution | what actually fits | where |
| --- | --- | --- |
| 8×8 / 16×16 | silhouette + 2 tones per material, **no face, no fingers**, 1 characteristic detail | icon, item, tile, small enemy |
| 24×24 | the same plus a 1 px eye, a belt, 3 tones on the main material | common enemy, village NPC |
| 32×32 | a 2–3 px face, a readable hand, a 3-step ramp per material, 8 facings | hero, important NPC, medium creature |
| 48×48 | expression, a fold of cloth, a weapon with its own 2 tones | featured hero, mini-boss |
| 64×64 | readable anatomy, its own shadow, a small ornament | small boss, vehicle |
| 96–128 | mouth, gaze, dithering that pays off | boss, dialogue portrait, menu card |

read from the **role** side, which is how the ask actually arrives: item, icon, pickup → **16×16** · small character,
common enemy, critter → **32×32** · hero, player character, mini-boss → **48×48** or **64×64** (48 if it stands
1.2–1.6 m carrying nothing, 64 once there is a weapon, a cape or a mount) · ground tile → **16 px** or **32 px**.
the two ladders are one ladder because the hero is measured **in tiles**: a 32 px hero is the hero cell of a **16 px
tile** world (it reads two tiles tall), 48–64 is the hero cell of a **32 px tile** world. so pick the tile first, then
the tile size must **divide** the character's density — otherwise the world grid and the character grid disagree by a
fraction of a pixel forever.

**THE ENGINE FACT, and it outranks every row above.** the cell is not chosen against the art — it is chosen against
**how many device pixels the sprite actually covers on screen**. the quality governor's `renderScale` ladder renders
the scene into a buffer smaller than the viewport and upscales it, and a sprite whose texels outnumber its screen
pixels is sampled from a **mip**: the per-pixel work you drew averages into flat plastic, and `filter: "pixel"` cannot
save it because the blur happened before filtering.

the arithmetic in a 3D place — the vertical world span the camera sees at distance *d* is `2 · d · tan(fov / 2)`, and
`getCamera().fov` is **vertical degrees**:

```
drawn_px = sprite_height_m ÷ (2 · d · tan(fov / 2)) × buffer_height_px
```

a 1.6 m character 12 m out at fov 60°: span `2 × 12 × tan 30° = 13.9 m`, so on a 1080 px buffer
`1.6 / 13.9 × 1080 ≈ 125 px`. a **64 px** cell draws at ~2× (crisp), **128 px** at ~1:1 (exact — the ceiling worth
paying for), **256 px** throws half its texels away and mips to plastic. now the phone: a device at DPR > 1.5 starts
from a **0.75** scene-scale baseline and the governor cuts further under load (say 0.6), so the buffer is
`1080 × 0.75 × 0.6 ≈ 486 px` and the same character draws at **~56 px**. that is the number the cell has to survive,
not the desktop 125.

- **pick the cell for the smallest buffer the game ships on** and let big screens upscale. a 32 px hero drawn at 56 px
  is honest pixel art; a 128 px hero drawn at 56 px is expensive mush.
- in a 2D ortho place the same fact is exact, no guessing:
  `scale = viewport_height_px ÷ (2 × orthoSize × pixelsPerUnit)`, and it must come out **integer** (LAW 7).
- when the detail **must** survive, declare the buffer instead of hoping:
  `api.patchEngine({ graphics: { renderResolution: [480, 270] } })`. an authored ceiling whose **short axis is ≤ 480**
  reads as raw-pixels intent — the frame flips to the MSAA topology, no temporal jitter, and **the governor's
  `renderScale` cuts do not apply under it**: authored pixels render exactly as authored. above that band
  (`[1280, 720]`, `[1920, 1080]`) the ceiling is only a perf cap and the ladder keeps multiplying beneath it.
  authoring can only **lower** resolution, never supersample.
- `graphics: { perfectPixelArt: true }` seeds the engine's own pixelate pass. it is a look, not a substitute for
  choosing the cell.

one resolution per **class**, and classes do not mix on screen. a pixel is **not** a meter: a conjured sprite declares
its world height in its metadata and the engine sizes it from that, holding density uniform at **64 px per world
unit**; `pixelsPerUnit` applies **only when `size` is omitted** (setting either one opts out of the metadata default).
a sprite with a **script** texture declares nothing — write `size: [w, h]` in meters or `pixelsPerUnit`, or the quad
comes out `[1, 1]`. 32 px art standing 1.6 m tall → `pixelsPerUnit: 20`.

## LAW 5 — 8 to 16 colours, a 3-step ramp per material, value before hue

one palette, one hand: every script does `require("lib/palette")`, no loose hex in the drawing. build in **ramps** —
one material = `[light, base, shadow]`. three tones are enough because the fourth only shows in an area bigger than
~20×20 px, and in a 32 px sprite it eats the silhouette.

```js
// scripts/lib/palette.js — ten hex values and one coherent game
module.exports = {
  stone: { cool: ['#7b8496', '#5a6273', '#3b4150'], warm: ['#9a8a72', '#756751', '#4b4133'] },
  skin: ['#f0c090', '#c98d5f', '#8a5637'], metal: ['#dfe7ef', '#93a2b4', '#4f5b6b'],
  ink: '#241a2b',   // the game's "black" — it is not #000
};
```

five materials is already 15 colours: reuse the stone ramp on wood, changing only the base. in grayscale, if the parts
vanish, changing hue will not save it — the order is **value → saturation → hue**, with ~15–20% of lightness between
neighbouring tones (any less does not read at 3 px). the readable **minimum** is that hard three-value step —
base / shade / light, nothing in between: two values read as flat paper, and the fourth tone only earns its place in an
area bigger than ~20×20 px.

**hue-shift, do not just darken.** a shade that is the base with the lightness turned down reads as grime on the
sprite. rotate the hue as the value moves: **shadow 15–40° toward blue/purple** (in oklch, hue toward ~265–290) with
chroma **up** 10–30%, and **light 10–25° toward yellow** (hue toward ~90) with chroma **down**. a wood base
`oklch(0.52 0.07 60)` shades to about `oklch(0.36 0.08 285)` and lights to about `oklch(0.72 0.06 85)` — one material,
three tones, and it reads as *light falling on wood* instead of dirt. two materials touching at the same value become
one blob. light is palette too: **one** direction for the whole game
(convention: top-left) and the two-edge rule — 1 px light on the lit side, 1 px dark on the shadow side. those two
edges **are** the form. never paint a lamp's glow: light belongs to the engine (2D derives normals from the drawn art
and glows through emissive).

## LAW 6 — an outline is not black, and dithering only in a large area

- **outline:** 1 px, coloured as the material darkened and desaturated, or the palette's own black (`#241a2b`).
  `#000000` on everything flattens the scene — amateur pixel art's tell number one.
- three outline registers, and one is right per class — never two on one object:

| register | right when | wrong when |
| --- | --- | --- |
| **full** — sealed 1 px around the whole silhouette | anything that must read against **any** background: player, enemy, pickup on a busy tilemap. and every 16–32 px sprite, where the outline **is** most of the drawing | scenery, which then floats forward off the ground it is standing on |
| **selective** — outline on the shadow side, dropped where the light hits | scenery, props, anything that should sit **inside** the scene; the standard at 48 px+, where the interior has room to model the form | a small sprite on a noisy background — the open side dissolves into the tiles |
| **none** — the silhouette carried by value contrast alone | painterly and soft registers, backdrop plates, and big art (96 px+) where a 1 px border reads as a sticker | pixel art whose edge value sits within ~15% of the background's — it simply disappears |

  **pure `#000000` is a deliberate register, not a default:** it belongs to high-contrast arcade/handheld sets with ≤ 8
  colours and a black-anchored palette. everywhere else it flattens depth and stops the outline carrying light
  direction — the palette's own ink (`#241a2b`) is the safe answer.
- **dithering** (a checker of 2 tones faking a third) turns to **mud** at three specific places: a band narrower than
  ~8 px, where the checker never completes and reads as noise · two tones less than ~12% apart in lightness, where the
  eye blends them into one flat value and you paid for nothing · any surface moving relative to the camera at
  non-integer scale, where 25% and 75% checkers crawl (only the **50%** checker holds still). so: 50% checker, ≥ 12%
  value gap, ≥ 16 px on the short axis — sky, ground, a long gradient. inside a 32 px sprite no such area exists.
- **hand AA at corners only:** one intermediate tone, 1 px, where a diagonal meets a straight run or a curve changes
  direction. never along a straight run, never on the outline itself, never two AA tones stacked. more than a handful of
  AA pixels in one sprite means the shape wanted a different resolution.

## LAW 7 — the grid is sacred

- **no free rotation** — `rotation` destroys the grid. rotate by swapping art (`?facing=`).
- **no fractional scale** — 2×, 3×, 4×. 1.7× is half a pixel on every edge. squash-and-stretch is a redraw, not
  `scale`. one density per screen: fix pixels-per-unit and derive the rest.
- **quantize the camera** and solve the zoom together, in one patch:

```js
// viewport 1080 px tall, art at 32 px/unit, integer scale 3 → orthoSize = 1080 / (2 × 3 × 32) = 5.625
api.patchCamera({ pixelSnap: true, state: { orthoSize: 5.625 } });
```

`scale = viewport_height_px ÷ (2 × orthoSize × pixelsPerUnit)` and it must come out an **integer** — pick the scale,
solve for `orthoSize`. `pixelSnap` makes the renderer round the presented camera to the texel grid **after**
smoothing, so nearest-filtered art never shimmers while it scrolls. it is orthographic-only; on a perspective camera
it is inert.

## LAW 8 — a tileset matches at the edge or it is not a tileset

tilemap ground is a **pair of materials**, not an image. `ctx.wang(...)` bakes the 16-tile corner-mask atlas and the
engine does the stitching (64 px tiles, `tilesetColumns: 4`, id = mask + 1, corners TL=1 TR=2 BL=4 BR=8), running its
verifier inside the bake. textures are char grids **32×32 torus-tileable** (row 0 continues row 31): every period
divides 32, and no structural line touches the 0/31 borders.

```js
// scripts/tileset-cave.js — bind: terrain.tileset: "scripts/tileset-cave.js?a=floor&b=rock", tilesetColumns: 4
const palette = { c: '#6b6152', d: '#574e42', e: '#3f382f', r: '#4a4038', s: '#332c26', t: '#221c18' };
const rows = (f) => Array.from({ length: 32 }, (_, y) => Array.from({ length: 32 }, (_, x) => f(x, y)).join(''));
// avalanche hash — (x*5+y*3)%8 turns into 45° corduroy at field scale
const h = (x, y, s) => { let n = Math.imul((x * 374761393 + y * 668265263 + s * 1013904223) ^ 13, 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
const floor = rows((x, y) => (h(x, y, 1) < 0.10 ? 'e' : h(x, y, 2) < 0.18 ? 'd' : 'c'));
const rock = rows((x, y) => (y % 8 === 3 ? 't' : h(x, y, 3) < 0.14 ? 's' : 'r'));
export function texture(ctx) {
  const { a = 'floor', b = 'rock' } = ctx.params;
  ctx.wang({ palette, a, b, materials: {
    floor: { style: 'scatter', prio: 2, soft: 0.85, texture: floor },
    rock: { style: 'rim', hard: true, prio: 9, soft: 0.1, edge: ['t', 's'], texture: rock },
  } });
}
```

the other half is the generator (`terrain.generator`): `tileAt({ x, y })` returns `(TL|TR|BL|BR) + 1`, reading the same
field at the cell's four corners. collision comes from the **tile id**, never from pixels — in `2d-side` list the rock
ids in `solidTiles`; in `2d-top` gate passability by reading `api.getTile(x, y)` (`null` outside the map, so
`getTile(...) !== null` also blocks at the edges). height bands, a south-facing cliff, animated tiles (`framePhases` +
`tilesetFrames`/`tilesetFps`) and per-pair voices are in `drawn-art`.

## LAW 9 — pixel UI: 16 px, integer multiples, and the font does not stretch

`ui.js` takes the same refs — `<img src="scripts/tex-icons.js?slot=heart">`, `url(scripts/tex-panel.js)` in a style —
so the heart on the health bar is the same bake as the heart on the ground.

- **16×16 icon**, one parametric script per set (`?slot=heart`, `?slot=key`) drawing only that glyph — zero
  `background-position` arithmetic.
- **integer multiple on screen:** `width:32px;height:32px` (2× of 16) plus `image-rendering: pixelated` on the
  element — the bake's `filter` does **not** carry into CSS.
- **9-slice frame:** the way to stretch nothing is to ask for the frame at its final size —
  `tex-panel.js?w=192&h=96` draws corner, border and fill at the requested size (1024 px ceiling).
- **pixel font:** there is no font conjuration (the asset grid is `.glb` / `.png` / `.mp3`). pixel text is a bitmap
  glyph — a 3×5 or 5×7 map drawn with `fillRect`. the crime is stretching it: `font-size: 11px` on a font built for 8,
  or `transform: scale(1.7)` on the box. touch target ≥ 44 px: a 16 px icon lives inside a 48 px button (3×).

## LAW 10 — a sprite in a 3D world: billboard on Y, and a fake shadow

2.5D is not a mode; it is flat art inside a `3d` place. `billboard: "yaw"` keeps the sprite upright and turns it only
about Y — character, creature, tree. `"full"` also tilts it toward the eye and **lays the character down** under a high
camera: only for a floating marker. `"none"` nails the quad to the entity's rotation — decal, sign, fence panel. the
sprite's `anchor` defaults to `[0.5, 0]`, bottom-center, and the auto-derived `collider2d` hull is expressed against
that same point. a fake shadow does more for weight than any amount of detail: a dark circle radius ~0.35 of the
sprite's width, opacity 0.35–0.5, 2 cm above the terrain, staying **on the ground** during a jump and shrinking to
~0.7 at the apex.

```js
api.spawn({ id: 'rabbit-1', properties: {
  feetPosition: { x: 12, z: -4, y: { terrain: 0 } },
  sprite: { texture: '/cdn/moodboard-pixel-bright/sprite-topdown-gray-rabbit.png',
            billboard: 'yaw', cutout: true, filter: 'pixel' } } });
api.spawn({ id: 'rabbit-1-shadow', properties: {      // circle already lies flat in the XZ plane
  feetPosition: { x: 12, z: -4, y: { terrain: 0.02 } },
  primitive: { kind: 'circle', radius: 0.26 },
  material: { color: 'oklch(0.25 0.03 265)', opacity: 0.45, roughness: 1 },
  physics: 'none', castShadow: false } });
```

**facing sets: 4 or 8, and the difference is a real bill.** direction is a texture swap — `?facing=` with its eight
tokens, each its own drawn art, never `flipX` mirroring (which puts the character's sword in the wrong hand).

| set | the names | what it costs to draw | right when |
| --- | --- | --- | --- |
| **4** — `down` (the bare basename), `up`, `left`, `right` | 4 names × every clip | 4 atlas bakes per clip, 4 texture sets resident | a fixed camera: top-down, `2d` places, an iso rig that never orbits. a 45° heading reads acceptably from the nearest cardinal |
| **8** — plus `down-left`, `down-right`, `up-left`, `up-right` | 8 names × every clip | **2× the cook queue and 2× the resident texture** of the 4-set | an orbiting or free 3D camera; or a world-fixed prop that must not swivel — the card pivots to the eye while the art counter-rotates through 8 × 45° sectors, with ~8° of hysteresis past each boundary so a player standing on a sector edge does not flicker |

the one flip the engine owns: an animated billboard sprite whose atlas carries a **single** clip named exactly `walk`,
`run` or `idle` auto-mirrors toward its travel direction on screen and holds the last facing at rest. a second clip in
the atlas turns that off, and while it runs an authored `flipX` is shadowed — do not hand-roll flip logic on top of it.
which direction is "screen-right" under an orbiting camera comes from `input.axes.aimYawSin` / `aimYawCos`, already the
sine and cosine of the camera yaw (`getCamera().yaw` is **degrees** and feeding it to `Math.sin` is the classic bug).

in a 3D place what occludes is depth: `sortingLayer`/`sortingOrder`/`ySort` are levers of a **2D** place — do not
count on them to order sprites in a 3D scene. a tall tree in `2d-top` wants `collider2d` at the base only, or the
trunk becomes a wall as wide as the canopy.

## LAW 11 — cutout beats alpha-blend, and `uvRect` crops a sheet

a game sprite wants **alpha-test**: it discards pixels under the cutoff and **writes depth**, so two overlapping trees
resolve pixel by pixel. alpha-blend sorts the **whole** sprite by camera distance — pretty alone, wrong the moment two
cross. `cutout: true` opts into the **0.5** default cutoff, `alphaCutoff` overrides it. the inference: 2D-place alpha
sprites and pixel-named textures in 3D cut out on their own; **a script texture or a painted asset in a 3D place does
not** — write `cutout: true` yourself. an `add`/`multiply`/`subtract` sprite is light and never cuts out.

`uvRect: { x, y, width, height }` crops a region in normalized UV with **y at the bottom** — the lane for raw sheets
(`?raw`) and hand-assembled atlases. cropping is creating an image; **scrolling** the crop every frame in `update` is
hand-rolled animation that fights replication, pausing and state changes. frames belong to the mixer (`gavi#animar-2d`).

## the procedure — "make the art for X"

1. **camera and distance first** (`gavi#animar-doutrina`); the resolution falls out of LAW 4.
2. **the routing table.** painting? `scripts/tex-<name>.js` is born with the params that will vary. conjuring? the
   name comes out **complete** on the first go — it freezes.
3. **palette before drawing:** open `lib/palette.js`; a new material enters as a 3-step ramp.
4. **paint the minimum that plays:** the ground (wang), X, and X's HUD icon. it runs dressed at t=0.
5. **declare the simulation side:** `size`/`pixelsPerUnit`, `cutout`, `collider2d` at the base of tall art,
   `solidTiles` on the tilemap. the bake tells the engine none of that.
6. **lock the grid:** `pixelSnap: true` and `orthoSize` from the LAW 7 formula.
7. **look through the game's camera** (`view_live_scene`), never in a close-up preview. did not read? it is
   resolution, value or silhouette — it is not more detail.
8. **only then** animate (`gavi#animar-2d`) and check it moving (`gavi#animar-verificar`).

## how it goes wrong

1. **asking the CDN for what it cannot give.** TELL (a): you re-minted with a better description and the old picture
   comes back, so you start blaming the cache — the name froze; mint a new filename with a token (`-2`, `-v3`) and move
   the refs (LAW 1). TELL (b): a conjured "tileset" whose seams do not line up, at any prompt — the edges never will.
   a tileset is `ctx.wang`, 100% of the time (LAW 8).
2. **`textureScale` read as a repeat count.** TELL: the wall shows one enormous cropped fragment, or a hairline
   pattern nobody can identify. FIX: it is **meters per tile** — 2 on stone, ~1 on wood, `repeat: [1,1]` for one
   picture on one face (LAW 2).
3. **a palette with no ramp, black outlines.** TELL: the scene reads like flat paper cutouts and everything has the
   same hard border. FIX: `[light, base, shadow]` per material and an outline that is the material darkened, not
   `#000` (LAW 5, LAW 6).
4. **fractional scale or mixed resolutions.** TELL: pixels of different widths along one edge; a 32 px hero next to a
   12 px icon and a 24 px tile — three games on one screen. FIX: integer scale, `orthoSize` from the formula, one
   resolution per class.
5. **a script-textured sprite that came out 1×1 m.** TELL: the rabbit is the size of a crate and every prop reads at
   the same square. FIX: scripted textures declare no size — write `size: [w, h]` or `pixelsPerUnit`.
6. **a black or blank texture with no error.** TELL: the quad renders, nothing is on it, no compile fault anywhere.
   FIX: read `getLogs()` — `texture-script-blank-bake` says the bake settled but shipped an all-zero bitmap (usually
   drawing into a scratch canvas instead of the first one); `texture-script-recovered` closes the episode after your edit.