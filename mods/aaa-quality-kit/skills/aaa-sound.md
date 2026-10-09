---
name: Aaa Sound
description: Living sound for any game — layered ambience beds that follow the hour, per-surface footsteps, gain discipline so the mix breathes instead of shouting.
---

# AAA Sound — the world breathes

Every place makes sound before anything happens in it. A world with no bed under it reads as
a screenshot; a world with wind reads as a place. Sound is part of the build, not a request.

## Ambience beds

- One invisible **server-realm manager** object owns ambience (never the player — players come
  and go; the world's breath doesn't).
- Beds are loops at **gain ~0.25-0.35, felt not heard**. If a visitor can name the ambience
  track, it's too loud.
- Layer 2-3 thin beds instead of one thick one: base air (wind/room tone) + biome voice
  (birds / water / hum) + rare punctuation one-shots (a distant bird, a creak) every 8-20s at
  randomized pitch. Punctuation is what makes a loop stop sounding like a loop.
- **Day/night crossfade**: track the hour and fade beds over ~2-3s (birds by day, crickets and
  low wind by night). Snapping beds at the boundary breaks the spell; ramp gain per tick.
- Throttle the manager (`updateSchedule`) — ambience needs decisions a few times a second, not
  every tick.

## Footsteps

- Per-surface clips, keyed by the ground material under the player — grass, stone, wood, sand
  each speak. Read the surface where the feet are, look up the clip in a data table
  (new surface = one row).
- Cadence follows real speed: step interval derived from velocity, not a fixed timer — a fixed
  timer slides audibly the moment speed changes.
- Every step: `pitch: 0.92 + api.random() * 0.16`, slight gain wobble. Two identical steps in a
  row is the tell of amateur audio.
- Skip steps entirely when airborne; land with a separate, heavier clip (see aaa-impact).

## Gain discipline (the mix at a glance)

| layer | gain |
| --- | --- |
| ambience beds | 0.25-0.35 |
| footsteps | 0.4-0.55 |
| interaction one-shots | 0.6-0.9 |
| music | 0.3-0.5, ducked under one-shots |

One-shots ≤ 1.0 always. When everything is loud, nothing is: the beat you want the player to
feel gets its headroom from everything else staying low.

## Conjuring the clips

Ambience/sfx ride CDN paths (`/cdn/moodboard-<family>/sfx-<name>.mp3`). Mint, **listen with
read_url** (duration + what it actually sounds like), re-mint if it lies about its name. A bed
that ships unheard is a bug waiting for the first player's ears.