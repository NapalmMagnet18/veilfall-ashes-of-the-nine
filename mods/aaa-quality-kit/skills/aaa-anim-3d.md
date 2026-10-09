---
name: Aaa Anim 3d
description: Code-built 3D character animation — bodies assembled from data-driven parts, gait systems (hop/trot/walk) written in code, air poses, landing squash; AAA motion with zero GLB clips.
---

# AAA 3D Animation in code — no rig, no clips, full life

A character can be BUILT and ANIMATED entirely in code: box/primitive parts from a data table,
gaits as math. Proven pattern — a rabbit and a guinea pig with distinct, personality-carrying
gaits, ~13 parts and ~150 tris each. When a character can't justify a rigged GLB (or a minted
GLB arrives unrigged), this lane is not a fallback — done well it reads hand-animated.

## Bodies from data

One behavior (the "body" child on the character) builds parts from JSON:

```json
{ "parts": [
  { "id": "torso", "size": [0.42, 0.34, 0.6], "pos": [0, 0.38, 0], "color": "#b9906c" },
  { "id": "earL",  "size": [0.08, 0.34, 0.1], "pos": [-0.09, 0.86, -0.12], "anim": "ear" },
  { "id": "legFL", "size": [0.1, 0.24, 0.1],  "pos": [-0.14, 0.12, -0.2], "anim": "leg", "pivot": "top" }
] }
```

- `anim` tags ("leg", "ear", "tail") tell the animator which parts move; `pivot` puts rotation
  at the hip/shoulder, not the box center.
- The body rebuilds when the character's `state` changes — new character/species = one data
  row, zero new code.
- Spawn the body from the character's own behavior at entry (the character OWNS its body);
  never rely on a spec-stamped `parent:"player"` row — it doesn't stamp onto already-joined
  sessions.

## Gaits are phase math

One clock: `phase += dt * (base + speed * mult)`. Everything hangs off it:

- **Walk/trot**: legs swing `sin(phase)` with diagonal pairs offset by π; body bobs
  `|sin(phase)| * amp` (tiny — 0.03-0.05m); a slight roll gives a waddle.
- **Hop** (rabbit-class): front/back leg PAIRS (split by pos.z sign) instead of diagonals;
  root local y bounces `|sin(phase)| * hopHeight` (~0.2m); root pitch rocks `sin * ~7°`; ears
  lag the phase by ~1 rad — the lag is where the life is.
- Gait choice and its constants live in the data row (`"gait": "hop", "hopAltura": 0.22`), so
  species differ in DATA, not code forks.

## Air and landing (where floaty dies)

- Leaving the ground: a **one-time** pose (legs splay, body stretches) — not a loop.
- Airborne: body pitch follows vertical velocity (clamp ±16°) — rising noses up, falling noses
  down. This single line sells the arc.
- Landing: squash 0.15-0.2s (x/z +10-15%, y −15-20%), then release. Pair with dust + thud
  (aaa-impact).

## Idle discipline

Idle is **write-free** except rare twitch bursts (ear flick, tail swish every 3-8s). A body
writing properties every idle tick is replication noise for nothing; the stillness between
twitches is what makes the twitch read.

## GLB counterpart

When a rigged model IS right (humanoids), list every clip in the URL
(`model.glb?animations=Idle,Walk,Run,Jump`) and drive locomotion via `updateChannel`. Layer
code on top for what clips can't do: the same landing squash, lean-into-turn, breathing scale.