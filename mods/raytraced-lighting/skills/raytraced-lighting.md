---
name: Raytraced Lighting
description: Ray-marched reflections, traced contact shadows and bloom for any place — how to switch it on, tune it per room, and pick materials that show it off.
---

# Raytraced Lighting

A whole-frame lighting look. Every pixel gets a reflection ray marched through the depth
the camera can already see, a handful of short occlusion rays for contact shadow, and a
soft bloom over the top. It runs on ordinary shader cores (WebGPU) — no RT-core access
exists in a browser, so nothing here depends on a particular card.

## Switch it on

```js
api.patchAtmosphere({ look: { script: "mods/raytraced-lighting/look-raytrace.js" } });
```

Per place: pass the place as the second argument — `api.patchAtmosphere({ ... }, "cellar")`.
Only one look script runs per place, so this replaces whatever look was there.

## Tune it

Every dial is a look param, overridable without touching the file:

```js
api.patchAtmosphere({
  look: {
    script: "mods/raytraced-lighting/look-raytrace.js",
    params: { reflection: 1.15, denoise: 0.4, aoStrength: 0.4, bloom: 1.2 },
  },
});
```

| param | default | what it does |
| --- | --- | --- |
| `reflection` | 1.15 | how strongly traced reflections are added back |
| `baseReflect` | 0.05 | reflection at head-on angles (grazing angles always reflect more) |
| `stepSize` | 0.12 | first step of the march, in metres — smaller = tighter contact, shorter reach |
| `maxDistance` | 26 | metres a reflection ray is trusted before it fades out |
| `denoise` | 0.4 | how much of each new frame replaces the accumulated one; lower = smoother, more lag |
| `blurRadius` | 0.9 | spatial softening of the reflection buffer, in texels |
| `fireflyClamp` | 2.2 | squashes single rays that land on a light source and blow out |
| `aoStrength` | 0.4 | depth of the traced contact shadows |
| `aoRadius` | 1.5 | metres the occlusion rays reach |
| `bloomThreshold` | 0.48 | brightness where glow starts |
| `bloom` | 1.2 | glow strength |
| `bloomSpread` | 1.15 | glow radius |

## What makes it visible

- **Low roughness, some metalness.** A floor at `roughness: 0.1, metalness: 0.9` is a mirror.
  At `roughness: 0.6` the reflection is there but quiet — which is what most stone wants.
- **Something bright to reflect.** Emissive strips, lamps, a window. A room lit only by flat
  ambient has nothing worth tracing.
- **A dark-ish room.** Reflections read as light added to the frame; at noon under a white
  sky they wash out.

## Known edges (and why)

- It is *screen-space*: a ray can only find what the camera is already drawing. Something
  behind you or off the edge of the frame does not appear in the mirror — the edges of
  reflections fade out instead of cutting, which is the honest version of that limit.
- Fast camera swings can leave a faint trail for a frame or two. The denoiser pins its
  history to the colours actually on screen, which kills the smear; lowering `denoise`
  trades that back for smoothness.
- Cost scales with resolution: the trace runs full-res on desktop, 40% on mobile.