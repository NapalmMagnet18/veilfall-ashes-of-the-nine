---
name: Aaa Impact
description: Contact juice — hits, breaks, pickups and landings that FEEL AAA: hitstop, squash, shake, shards, per-material sound, the numbers that read as weight instead of noise.
---

# AAA Impact — everything you touch answers back

AAA feel is mostly this: every meaningful contact answers with 3-4 tiny signals inside ~100ms.
One signal reads cheap; a stack reads real. The ObjectAPI juice verbs (`playSound`, `screenShake`,
`hitstop`, `squash`, `spawnFx`, `cameraPunch`, `damageNumber`) are the palette — the craft is
dosage and per-material variation.

## The impact stack (order matters, all in the same tick)

1. **Sound first** — `playSound` with `pitch: 0.9 + api.random() * 0.2`. Repetition kills more
   feel than absence; NEVER fire the same clip at pitch 1.0 twice in a row.
2. **Motion on the thing** — `squash(target)` on the struck object, or a one-time pose
   (splay/stretch) on the actor.
3. **Motion on the camera** — `screenShake` small (0.1-0.25) for breaks, `cameraPunch` for
   directional hits. Big shake is for explosions only; constant shake reads as broken.
4. **Debris** — `spawnFx` shards/particles **colored from the material that broke**, not a
   generic grey puff. 4-8 pieces, gravity on, dead in <1s.
5. **Hitstop** for the heavy beats only (kills, crits, final break): 40-80ms. Everywhere = mud.

## Per-material identity

One table, keyed by material family, drives sound + debris + timing — data, not branches:

```json
{ "stone": { "sfx": "sfx-mine-stone", "shardColor": "#8a8a8a", "breakTicks": 24 },
  "wood":  { "sfx": "sfx-chop-wood",  "shardColor": "#8a6a3f", "breakTicks": 16 },
  "dirt":  { "sfx": "sfx-dig-dirt",   "shardColor": "#6b4a2f", "breakTicks": 10 } }
```

New material = one data row. The player learns the world through their ears: stone should
*sound* slower than dirt before the timer proves it.

## Progress you can see

A hold-to-break action needs visible progress on the target (crack overlay stages, a shrinking
ring, scale pulse) — feedback each tick, not only at completion. Cancel = instant visual reset.

## Drops that invite pickup

- Spawned drops get a slow spin + gentle bob (visual only — `jiggle`/tween, never physics).
- Vacuum radius ~1.5m with ease-in acceleration toward the player; a pop (`squash` + pitch-up
  chirp) on absorb. The chirp pitch can climb with combo/stack count — free dopamine.
- Cap live drops (merge stacks past ~32) — feel dies when the floor is soup.

## Landings

Falling ends with a landing: squash 0.15-0.2s (x/z +10-15%, y −15-20%), a dust `spawnFx` scaled
by fall speed, and a thud whose gain scales with impact velocity. Silent landings are the single
most common "feels floaty" cause.