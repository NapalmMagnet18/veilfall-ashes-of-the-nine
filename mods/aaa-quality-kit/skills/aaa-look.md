---
name: Aaa Look
description: Cinematic light for any world — the shipped grade script, bloom that actually shows, fog/sky/star numbers that read AAA at day, dusk and midnight.
---

# AAA Look — cinematic light

The kit ships `look-cinema.js` — a full day/dusk/night grade, tuned in a live voxel world and
verified at noon, golden hour and midnight. Wire it, then tune with params only:

```js
api.patchAtmosphere({ look: { script: "mods/aaa-quality-kit/look-cinema.js" } });
// live tuning, no recompile:
api.patchAtmosphere({ look: { params: { nightExposure: 2.2, vignette: 0.1 } } });
```

## Why this grade holds up (the traps it already dodges)

- **Never key night on sun elevation.** Between sundown and a high moon the engine reports the
  sun at intensity 0 while the body is still "sun" — an elevation-keyed night stays at 0 and
  that whole hour renders as black silhouette. The script keys on the key light's **colour**
  (warm = dusk, cool = night); the colour test has no gap.
- **Dusk needs its own lift.** Near the horizon the physical key light collapses (~0.36 where
  full day is >1.6); without `duskExposure` (+0.85) and `duskLift` (0.03) golden hour renders
  the ground as silhouette under a pretty sky.
- **Bloom must be authored with NON-default numbers.** The seeded trio 0.15/0.6/1 reads as
  "unauthored" and resolves bloom to zero in a world with no static glow. The script authors
  0.3/0.7/0.92. Bloom is the one real frame cost here (split post topology); everything else is
  a few dozen ALU ops, no render targets.
- **No depth taps on purpose** (no haze in the grade): depth classifies the look out of the
  fused composite path. Let **fog** do the distance blue instead.
- **Night is never black** — a deep-indigo floor (`nightFloor`) keeps shadowed faces readable.
  Mood comes from color, not darkness; the darkest hour should still be worth a screenshot.

## The atmosphere around it (measured companion numbers)

```js
api.patchAtmosphere({
  fog: { kind: "linear", near: 50, far: 200 },       // blues the horizon, hides world edges
  clouds: { density: 0.42, opacity: 0.7 },
  stars: { density: 0.95, milkyWay: 0.8 },
  moon: { size: 3.6, intensity: 3.4 },               // a moon you can feel, light you can see by
  cycle: { lengthSeconds: 1200 },                    // 20-min day — long enough to live in
});
```

Keep the physical sky (`rayleigh`/`realistic`) and let it derive sun + ambient from the hour —
authoring those by hand is a deliberate override, not a starting move.

## Screenshot discipline

A running cycle re-derives timeOfDay within seconds — a forced hour drifts. To capture a
specific hour: set `cycle` (huge lengthSeconds) **and** `timeOfDay` in ONE patch, capture
immediately, then restore the real cycle in one patch. Never leave the cycle parked.