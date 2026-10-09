---
name: Aaa Models 3d
description: AAA-detailed 3D models written as code — scripted geometry (kind "scripted") for props and structures with real silhouettes, CDN-dressed surfaces, and parametric variants.
---

# AAA 3D Models in code — detail you author, not order

`kind: "scripted"` geometry is the default lane for props and structures that need to look
expensive: you write the verts, the form comes out exactly yours, it renders the moment it
runs (no cook, no queue), and a second variant is a parameter, not a second asset.

## What makes scripted geometry read AAA

- **Silhouette first.** Detail that changes the outline (a chamfered edge, a sagging beam, a
  flared base) beats detail inside it. Build the profile, then loft/extrude it —
  `builtin/geom` carries the loft kit (lofts, tubes, per-face `surface()` paint).
- **Asymmetry and wear.** Perfect repetition is the cheap tell. Seeded jitter per instance —
  a few degrees of lean, ±10% scale, one plank shorter — from `api.random()` off a stable
  seed, so every fence post differs but each stays put across sessions.
- **Chamfer what hands touch.** A 0.02-0.05m bevel on hard edges catches light; razor-sharp
  box edges scream primitive.
- **One generator root per building** — a house is one scripted piece with parameters
  (width, floors, roof pitch), not forty loose boxes to keep aligned.

## Surfaces

- Structures dress from the CDN by default: `material: { texture: "cdn/...", tint }` —
  grain, weave, wear. Flat vertex color is a finished look only inside flat style families
  (lowpoly, voxel, pixel); elsewhere a flat structure reads unfinished.
- Procedural surfaces: `texture: "scripts/tex-<name>.js"` exporting `texture(ctx)` painting
  `ctx.canvas(w,h)` — signage, patterns, wear masks, no fetch at all. `?params` varies one
  script across many props.
- Per-face material arrays let one mesh wear roof/wall/trim without splitting.

## Terrain-aware feet

Wide scripted meshes on ground use `ctx.groundY(x,z)` — ground height under each local point —
so every trunk/post/pillar conforms on slopes and re-derives when terrain edits. A building
floating on one corner undoes all the detail above it.

## When to conjure instead

Rigged, breathing things — humanoids, creatures with walk cycles — go to minted GLB models.
Shapes that just need to BE shapes stay scripted: instant, exact, revisable in place. Naming
the trade in one line when someone asks to convert lanes ("conjured won't share axes; my
scripted set stays aligned") keeps the choice theirs.