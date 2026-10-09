---
name: Aaa Wisp Fleet
description: Fleet doctrine for dispatching model-builder wisps — the training a lane reads before it models (3D scripted geometry, 2D sprite sheets) plus the dispatch pattern: up to 10 parallel creative lanes, briefs written from inside the finished model, a critic lane closing every fleet.
---

# AAA Wisp Fleet — ten trained hands, one taste

**This is a curriculum, not a model swap.** "Activating the mode" IS loading this skill and
following it. No model changes, no brain changes, and by itself zero change to how the game
looks or which assets exist — what changes is what a dispatched lane already knows before its
first vertex.

Two halves: **the training** every lane reads before it builds, and **the dispatch doctrine**
that keeps ten lanes from shipping ten different games. The training compresses
`aaa-quality-kit#aaa-models-3d` (3D), `#aaa-sprites-2d` (2D) and `#aaa-anim-3d` (motion) into
lane-brief form — a lane preloads those for the full playbook, this for the standard it's held to.

---

## Part A — THE TRAINING (what a lane reads before it builds)

### 3D: meshes authored as code

- **Scripted geometry is the lane, not the fallback.** `primitive: { kind: "scripted", script,
  params }`. It renders the tick it runs (no cook, no queue), the form is exactly yours, and a
  second variant is a param row. Reach for a minted GLB only when the thing must be **rigged and
  breathing** — humanoids, creatures with real walk cycles.
- **Silhouette first.** Block the shape that reads at 20 m before any detail exists: profile,
  proportion, stance. Then loft it. Detail that changes the outline beats detail inside it —
  every time, at every budget.
- **Build with the loft kit, not with box stacks.** `require("builtin/geom")`: `rrect`/`oval` for
  cross-sections, `loftFrames`/`loftSections` for bodies, `polyTube` for anything curved that
  must not twist (limbs, spouts, horns, cables), `boxZ` for chamfered blocks. The kit owns the
  winding law — hand-stitched rings are where mis-wound faces and smeared shading come from.
- **Real proportion, from a real reference.** Before modeling an animal or an object, name its
  actual dimensions out loud in the brief: a pig is ~1.1 m long and ~0.7 m tall at the shoulder;
  a door is 2.05 m; a rabbit's ears are ~40% of its body length. Proportion is what separates a
  model from a toy, and it costs nothing to get right at block-out time.
- **Part hierarchies with pivots where things bend.** Anything that will move later gets its own
  part and its pivot at the joint — hip, shoulder, hinge, turret ring — never at the box centre.
  Legs pivot at the top, jaws at the back, lids at the hinge. A model handed to the animator
  with centre-pivoted limbs is a model the animator has to rebuild.
- **Dress from the CDN outside flat families.** `material: { texture: "cdn/...", tint }` plus
  per-face `G.surface(...)` grit. Flat vertex colour is a *finished* look only inside
  `lowpoly-cozy`, `voxel-bright`, `pixel-*`; anywhere else a flat-shipped model reads unfinished.
- **Solid where touched, closed where seen.** `physics: "static"` on anything standing on or in
  the way; both windings on thin sheets; ONE mesh instead of touching plates (faces closer than
  ~5 cm z-fight from long sightlines).
- **Disqualifying check — a silhouette that is a box with bumps is not done.** Cover the texture,
  look at the outline only. If it could be any other object in the set, the lane is not finished:
  go back to the profile, not to the paint.

### 2D: sheets, sprites and 2.5D cards

- **One style family per sheet, per world.** Every sprite under one board
  (`/cdn/moodboard-pixel-bright/...`). Mixed boards is the asset-flip tell — a lane that mints
  under a different family has broken the fleet even if its art is the best in the batch.
- **Name the view in the basename** — `sprite-topdown-*`, `sprite-platformer-*`,
  `sprite-isometric-*`. The facing table and every `?facing=` pose derive from that declared view.
- **Animation through the mixer only.** Channels + clip names; weights raised while moving.
  Never hand-flip `sprite.frame`/`fps`/`playing` per tick — while a mixer is live those writes
  are overridden every tick and the engine warns. Texture-param animation is not a shortcut,
  it's a bug with a schedule.
- **2.5D means billboards with intent.** `billboard: "yaw"` for characters and creatures;
  `"none"` for genuinely flat art (decals, sign faces, fence panels); a world-fixed prop with
  volume is `"yaw"` **plus** an eight-pose `?facing=` swap against the pivot
  (`3d-sprites` § Multi-View Facing). Cutout alpha on any painterly sprite that shares space
  with another. Ground every standing sprite with a soft blob shadow.
- **Pixel discipline: one texel scale per world.** Omit `size` and let the 64 px-per-metre
  default hold the density; a single sprite authored at another scale reads broken next to
  correct ones. Snap positions at render scale 1.
- **Disqualifying check — a sprite whose walk cycle is the idle frame moving is not done.**

---

## Part B — THE DISPATCH DOCTRINE

### Shape of a fleet

- **Up to 10 parallel creative lanes, dispatched as ONE conducted weave.** One weave, ten cards
  — not ten separate dispatches. The conductor holds the shared decisions (style family, scale,
  palette, naming grammar); the lanes hold the craft.
- **One lane, one deliverable.** A lane owns one model, one sheet, or one tight set of siblings
  (three fence variants). Two unrelated models in one lane is how a lane ships one good thing
  and one rushed thing.
- **No two lanes in the same file.** Assign each lane its own `scripts/gen/<thing>.js` (or its
  own sprite set) and say so in the brief. Overlapping writes is the only way a ten-lane fleet
  loses work.
- **Card livery alternates the fleet colours** — `#7b2fbf` (roxo), `#141414` (preto), `#f5f5f5`
  (branco), cycling down the card list so the fleet reads as one squad at a glance.

### Writing a lane brief

**Write every brief from inside the finished model.** Describe the thing that exists at the end —
real dimensions in metres, real colours, real materials, the stance, where it bends, what it sits
on. Never spend brief words on build budgets, vertex counts, or how long it should take: a lane
told "≈300 tris, keep it cheap" builds to the budget; a lane told "1.1 m long, mud-dulled pink
hide, ears forward, weight on the front trotters" builds the pig.

```
LANE — porco (scripts/gen/porco.js)
Form:     1.10 m nose→tail, 0.70 m at the shoulder, barrel body, short neck, snout
          leading the silhouette; weight forward, hind legs slightly under the hips.
Parts:    head (pivot at neck base) · 4 legs (pivot at hip/shoulder) · ears (pivot at
          skull) · tail (pivot at rump). Named part constants exported.
Surface:  hide "cdn/moodboard-lowpoly-cozy/texture-hide-pink.png" tint oklch(0.72 0.09 20),
          hooves near-black rough 0.9, snout a shade deeper than the hide.
Frame:    -Z forward, +Y up, origin between the front trotters.
Preload:  aaa-quality-kit#aaa-wisp-fleet, custom-geometry
Deliver:  one scripted-geometry script + one preview_object look at the finished silhouette.
```

- **`modelClass: "creative"`** for anything whose deliverable is a LOOK — models, sheets,
  environment dressing, silhouettes. **`modelClass: "technical"`** for rig, physics, pivot
  wiring, perf and fix work, where correctness beats invention.
- **Every lane preloads this skill plus its craft skill** — `custom-geometry` for 3D,
  `3d-sprites` for 2D sprites and 2.5D. Add `aaa-quality-kit#aaa-anim-3d` when the model will
  be animated in code, `aaa-quality-kit#aaa-look` when the lane also lights its subject.
- **Every lane looks at its own work before reporting** — `preview_object` on the finished
  geometry, or a framed `view_live_scene` once placed. A lane that reports without a look has
  reported a hypothesis.

### The critic lane closes every fleet

The last card is not a builder. **One critic lane with fresh eyes** — it built nothing, so it
sees what the builders stopped seeing:

1. One look per deliverable, silhouette only (texture ignored). Name every model that is still
   a box with bumps.
2. Style audit across the batch: one family, one texel/vertex-paint register, one naming grammar,
   one scale. Two lanes drifting apart is the fleet's real failure mode.
3. Proportion pass side by side — a fleet where the rabbit out-masses the pig fails as a set even
   when each model passes alone.
4. Pivot and physics spot-check: bends where things bend, `physics: "static"` on what carries
   weight, colliders not sealing doorways.
5. Verdict per deliverable — **ship / re-lane** — with the specific reason. "Re-lane: crown reads
   as a cube, no profile above the brow" is actionable; "needs polish" is not.

A fleet without a critic ships an average. A fleet with one ships a set.