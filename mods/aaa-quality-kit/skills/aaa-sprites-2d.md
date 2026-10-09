---
name: Aaa Sprites 2d
description: AAA 2D sprites — detailed conjured sheets under a consistent style family, mixer-driven animation (never texture-param hacks), 2.5D billboards, and pixel-game discipline.
---

# AAA 2D Sprites — flat art with production values

A 2D game reads AAA when every sprite comes from the same hand and everything that lives,
moves. Both are systems, not talent.

## One family, one hand

- Pick a style family and put every sprite under its board: `/cdn/moodboard-pixel-bright/...`
  or `pixel-moody`, `painterly-fantasy` — same board, same world. Mixed boards is the #1
  "asset flip" tell.
- Name sprites with their role and view baked in: `sprite-topdown-old-farmer.png`,
  `sprite-sceneobj-mossy-fountain.png`. Descriptive names mint better art, and a served name
  keeps its first look forever — an art revision needs a NEW name (`-2`, `-v3`), refs moved,
  one canary re-minted and eyeballed before rolling a whole cast.
- Detail asks live in the name: "ornate", "weathered", "four-frame walk cycle, side view".

## Animation rides the mixer

Sprite animation goes through the engine's **mixer** — frame sequences as channels, blended
and speed-driven like 3D clips. Never animate by hand-flipping texture params per tick: it
fights replication, skips interpolation, and stutters on every slow client.

- Walk cycles: 4-8 frames, cadence tied to real velocity (a fixed timer slides the feet).
- Idle gets its own 2-3 frame breath — a statically frozen character reads dead in 2.5D.
- Impacts flash/squash via transform tweens on the sprite object, not new art.

## 2.5D (sprites standing in a 3D world)

- Billboard characters (`sprite` + facing) with cutout alpha; buildings piece-built from a few
  crossed planes read better than one flat card.
- Ground the feet: a soft blob shadow under every standing sprite — floating cutouts are the
  cheapest-looking bug in 2.5D.
- Depth-sort by z; at topdown angles offset the sprite pivot to the FEET so overlap order
  matches the fiction.

## Pixel-game discipline

- One pixel density everywhere (same texels-per-meter); a mixed-density scene reads broken
  even when each sprite is fine alone.
- Snap camera and sprite positions to the pixel grid at render scale 1 — sub-pixel drift
  shimmers.
- 2D games are 2D on purpose: place mode "2d-side"/"2d-top" with its own physics, never a
  flattened 3D world.