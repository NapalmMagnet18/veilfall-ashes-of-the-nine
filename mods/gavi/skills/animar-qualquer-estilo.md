---
name: Animate Any Style
description: The front door of animation — the router that picks one of three pipes in ten seconds and names the tell that picks it, what survives a change of style and what does not, each pipe's smallest quantum of time, the same verb translated across all three with its numbers, things that sway and deserve no bone, and the traps of mixing styles in one scene.
---

# Gavi — animate any style

this file does not teach animation. it picks **the pipe in 10 seconds** and translates
the same verb between pipes.

the law is `gavi#animar-doutrina`. the execution is `gavi#animar-glb`,
`gavi#animar-esqueleto-codigo`, `gavi#animar-2d`. the proof is
`gavi#animar-verificar`. what lives here is only what none of them says: **which door
to come in by, and what survives a change of style.**

## route in 10 seconds

| the tell | the pipe |
| --- | --- |
| humanoid — two legs, two arms, a head — and a `.glb` exists or can be minted | **GLB + mixer** → `gavi#animar-glb` |
| a body with a shape no generator rigs: spider, crane, octopus, rabbit, machine | **pose in code** → `gavi#animar-esqueleto-codigo` |
| the art is 2D — sprite, pixel, top-down or side-on | **sprite + mixer** → `gavi#animar-2d` |
| humanoid GLB exists but the minted clip misses the feel after 2 tries | **clip as a named function of time**, same mixer — engine `3d-animations` |
| smoke, sparks, dust, blood, trails | **fx**, never a bone. engine `fx` skill |
| one number going A → B: door, platform, HUD, bar, camera | **property tween** → `gavi#animar-2d` part 2 |
| it only sways: flag, foliage, rope, cape, tail | **material or jiggle**, never a bone → §5 |
| "do all of it, properly, whole game" | the fusion mode → `gavi#uma-so` |
| the pipe is picked and the NUMBERS are missing | the professional tier index → §8 |
| "make it look professional, studio quality" | §8, top to bottom. frames and beats first, proof last |

the doctrine's cut, no appeal: **rigged and humanoid → GLB; any other shape → code.**
the cut this file adds: **a thing that makes no decisions does not deserve a bone.**
bones cost replication (`gavi#programar-de-verdade` LAW 5); sway costs zero.

## 1 — the tree, on one screen

two questions settle nearly everything: **does it have a rig?** and **is it a body or a
phenomenon?**

```
the request arrives
├─ it's a BODY (makes decisions, has intent)
│  ├─ humanoid, and a .glb exists
│  │    → GLB + mixer by channels ...................... gavi#animar-glb
│  │      minted clip misses the feel twice, and blendIn tweaks did nothing?
│  │      → clip as a FUNCTION of time, same mixer ..... engine: 3d-animations
│  ├─ creature / machine / articulated (spider, crane, octopus, skeleton)
│  │    → rig written in code, joint by joint .......... gavi#animar-esqueleto-codigo
│  └─ 2D art, side-on or top-down (pixel included)
│       → clip slugs through the MIXER ................ gavi#animar-2d
│         and NEVER hand-written sprite.frame / fps / uvRect
└─ it's a PHENOMENON (decides nothing)
   ├─ smoke, sparks, footstep dust, blood, trails
   │    → fx ......................................... engine: fx  (never a bone)
   ├─ a number going from A to B (door, platform, HUD, camera, bar)
   │    → tween / spring ............................. gavi#animar-2d part 2
   └─ it only sways (flag, foliage, rope, cape, tail)
        → material or jiggle, NEVER a bone ........... §5
```

on that middle leaf: a **named exported function of time** goes wherever a clip name
goes. the engine samples it **once** (`fn.duration` default 2 s × `fn.fps` default 30)
into real keyframes and plays it through the native mixer — masks, weights and
`getChannel` compose on it like any GLB clip. the values are **offsets from the bind
pose**, and stock avatars bind in a **T-pose**: arms need about **+60° X** just to hang
at the sides. a `Hips` position track whose net XZ drift exceeds **15% of hips rest
height** is dropped with a named warning — locomotion belongs to movement, not to a
clip. details: the engine's `3d-animations` skill.

## 2 — what does NOT change: one law, the unit swaps

anticipation, contact, asymmetry, exaggeration, arcs — the same five in 3D, in 2D and
in pixel. the doctrine teaches each; what's missing is the **unit conversion**:

| the law | in 3D (GLB or code rig) | in 2D / pixel |
| --- | --- | --- |
| anticipation | 0.1-0.2 s of body going the other way first | exactly **1 frame**, and it is not optional |
| contact rules | overshoot 12-18% on the limb + hitstop on the connect | the contact frame holds **2-3×** its neighbours |
| asymmetry | 0.73 Hz on one ear, 0.61 Hz on the other; 0.05-0.12 s of lag per layer | the two sides **never** drawn the same; an 8-frame cycle with one dragging foot |
| exaggeration by distance | at 6 m: 15-40° reads, under 8° (5 px) vanishes | same law in texels: displacement under **1 texel at screen scale** does not exist; 3× that is 3 px |
| two identical frames | a blend leaking, or a weight stuck | a sheet with two identical mid-cycle frames = you drew 7, not 8 |
| exaggeration is ANGLE | gain multiplies degrees, never metres | exaggeration means **redrawing the pose**; fractional `scale` is mush |

that is not philosophy. it is the reason a pixel pass and a rig pass fail for the SAME
cause in four out of five cases — amplitude, never precision.

## 3 — what does change: each pipe's quantum of time

every pipe has a **smallest piece of time that exists inside it**, and a beat shorter
than the quantum simply does not happen. this game's sim tick is **30 Hz** (measured:
`api.seconds(1)` = 30).

| pipe | who interpolates | minimum quantum | walk cycle | run cycle |
| --- | --- | --- | --- | --- |
| GLB + mixer | the client, per display frame | ~16 ms at 60 fps display | 0.5-0.7 s | 0.5-0.7 s |
| rig in code | the engine, between writes | **1 write**: 100 ms at `every: 3` (10 Hz), 66 ms at `every: 2` (15 Hz) | 0.5-0.7 s = 5-7 writes per cycle | same, wider stride |
| sprite mixer | nobody — a hard cell swap | **1 frame**: 83 ms at the 12 fps default | 4-8 frames in 0.5-0.7 s | 6-8 frames in 0.35-0.45 s |

the arithmetic that sets the art budget: 8 frames in 0.6 s = **75 ms each** (~13 fps).
the same 0.6 s over 12 frames = **50 ms** (20 fps): smoother, 50% more drawing. that is
why **4-8 is the floor that ships** and 8-12 is the deluxe version — deluxe for the hero
and the boss, not the common enemy.

and the thing almost nobody notices: **a sprite run cycle is faster than a 3D one**
(0.35-0.45 s vs 0.5-0.7 s) and that is not an inconsistency. 8 discrete poses played
slowly read as a slideshow; the eye needs fast repetition to fuse them. 3D interpolates
already, so its cycle can be biologically honest.

the ceiling is the same on both sides: **no sine above ~1/4 of the write rate** — 2.5 Hz
at 10 Hz. above that it is stair-stepping, not motion.

## 4 — one verb, three outfits

| verb | GLB + mixer | rig in code (10 Hz) | sprite mixer |
| --- | --- | --- | --- |
| **walk** | channel `Walk`, `speed = sp / 2.5` (baked at ~2.5 m/s), `blendIn` 0.15-0.25, continuous crossfade on the speed axis | clip `stride`, thigh opening **24°** at a creep, phase advanced by DISTANCE (`sp*dt / 1.4 m`), legs **π** apart | 4-8 frames (8-12 deluxe), 0.5-0.7 s, foot contact on frames 1 and 5 |
| **run** | channel `Run`, `speed = sp / 6` (baked at ~6 m/s), weight rising on the SAME axis | the same `stride`, opening **86°** — never a second clip | 6-8 frames, 0.35-0.45 s, body leaning 10-15° in the art |
| **jump** | `Jump` / `Fall`, `blendIn` **0.06 s** (the 0.1 default reads as input lag), no loop | 3 slices pinned by STATE (launch / apex / fall), never by time | 3 frames pinned by state: rising, apex, falling |
| **take a hit** | upper channel, weight 2-3 (weights are additive, locomotion sits at 1), `blendIn` **0.04 s** | 0.04 s **does not fit** a 100 ms quantum: swap the pose on the next write and buy the impact with hitstop + `screenShake` + flash | 1-2 frames, 0.12 s, flashing |
| **die** | `Die`, `blendIn` 0.1, `loop: 'once'`, never cleared — holds the last pose | an envelope that ramps weight to 1 and stays; or ragdoll and stop writing joints | 4-6 frames, the last held forever |

pick the row by the verb, the column by the pipe, and **the number is already yours**.
when the style switches mid-build the verb does not change meaning — only its column.
a verb that isn't in the table (swim, climb, slide) writes its own row the same way:
what's the anticipation, where's the contact, how long is the cycle, what holds at the
end.

## 5 — things that only sway: no bone, no entity

the branch with no sister skill, so the numbers live here.

| the thing | the pipe | the numbers |
| --- | --- | --- |
| grass, shrubs, flowers on terrain | terrain `decorations` — sways on the GPU, zero entities, zero code | global wind is `atmosphere.wind: { direction, speed }` — direction in **degrees**, speed in m/s. the per-decoration fields live in the engine's `heightmap-terrain` skill: read it before writing one |
| flag, palm, wheat on its own mesh | a scripted material driving `positionNode` (`material: { kind: 'scripted', script: 'scripts/mat-flag.js' }`) | engine `custom-materials`. `positionNode` moves vertices in local space and **normals are NOT recomputed** — pair it with `normalNode` if the motion should shade, and know that the displacement **does not reach shadows**. phase by world position or the whole field sways in unison and reads as a curtain |
| tail, ear, cape, hair, lantern on something that **moves** | `properties.jiggle` | `jiggle: true` is already tuned. `amount` **0.5**, `bounce` **0.5**, `gravity` **0.3**, all 0..1; `bones: ['Tail*']` restricts the chains. name-matched soft chains (`tail`, `ear`, `hair`, `cape`) get a spring per bone; anything else gets whole-object wobble + squash |

the sway lane in full, since it belongs to no sister skill — global wind plus a springy
tail on a body that moves, and neither line costs a bone:

```js
// run_script, or a behavior's onSpawn
api.patchAtmosphere({ wind: { direction: 215, speed: 6 } }); // degrees, m/s

api.spawn('fox', {
  properties: {
    feetPosition: { x: 4, z: -2, y: { terrain: 0 } },
    model: '/cdn/moodboard-lowpoly-cozy/model-creature-fox.glb?animations=Idle,Walk,Run',
    jiggle: { amount: 0.9, bounce: 0.8, gravity: 0.3 }, // 0..1, chains matched by name
  },
});
```

the trap that costs a session: **`jiggle` is excited by incoming movement.** a flag on a
motionless pole with `jiggle` is a statue, and the log stays clean because that is not
an error. a still thing that must sway is a material, not a spring. and `jiggle` is
purely visual — it never pushes, collides, or counts as physics.

## 6 — mixing styles in one scene

2.5D sprites inside a 3D world and a pixel HUD over a 3D render are normal and good.
the concrete traps:

| symptom | cause | fix |
| --- | --- | --- |
| two overlapping sprites and the back one draws in front; a tree cutting out wrong | soft alpha blending sorts the WHOLE sprite by camera distance — painterly art and **every** `scripts/tex-*.js` texture land there | `cutout: true` on any sprite that lives beside another. pixel art infers cutout by name; a script texture never does — declare it |
| tuned `sortingLayer` / `ySort` in a 3d place and nothing changed | those are the 2D registry's lane | in a `3d` place solve overlap with `cutout` + position, not sort flags. in 2D, one shared `sortingLayer` (10) + `ySort: true` for everything that should occlude everything |
| a prop's sprite spinning with the camera, or lying flat; a character facing wrong when you orbit | `billboard` defaults to **`"yaw"`** (it spins about the vertical axis) | flat decal: `billboard: 'none'`. prop with volume: 8 `?facing=` poses turning against the pivot. facing comes from `input.axes.aimYawSin` / `aimYawCos`, already sine and cosine — `api.getCamera().yaw` is DEGREES and easy to mix up |
| half the 2D cast animates, half is frozen | a clip name outside lowercase-kebab (`Idle`, `Walk`) — the sprite channel is skipped outright | `gavi#animar-2d` §1. and one driver per entity: a sprite and a GLB rig on the same entity fight each other |
| pixel HUD blurry or shimmering over the render | a UI `<img>` is plain HTML — the bake's filter never reaches CSS, and fractional scale grinds the pixels | `image-rendering: pixelated` and **integer** scale (2×, 3×, 4×). 1.7× is mush |

## 7 — the proof: nearly the same in any style

the protocol is `gavi#animar-verificar`. what changes per style:

1. **6-frame burst**, camera at the REAL play distance: 5-8 m third person; in 2D, the
   game's own camera at the game's screen scale. judging pixel at 1× hides exactly the
   anticipation frame.
2. **the span tracks ONE cycle.** the tool takes 2-6 frames over 0.25-3 s on a
   deterministic tick grid. a 2 s span on a 0.5 s cycle samples 0.67 cycles per frame —
   the phases nearly repeat and the "two identical frames" is the tool aliasing, not a
   statue. 0.5-0.7 s cycle → span 0.6. 1 s idle → span 1.0. 0.25 s attack → span 0.3.
3. **two identical frames in a row = it is not running.** the test, not a metaphor, and
   it holds for all three pipes.
4. the extra piece per pipe:
   - GLB: `getLogs()` for `model-clip-not-found` — the message prints the clips that DO
     exist.
   - rig in code: a per-joint degree audit (under 8° at 6 m = not animated) and a clean
     return to rest with every weight at zero.
   - sprite: `sprite-atlas-missing` means cooking, retried every 30 s — a clip that
     plays a beat then freezes is cooking, not broken.

the professional additions to that protocol — the A/B take, amplitude measured inside the
captured image, foot slide as a number, and the named list of what a still can never
prove — are `gavi#animar-verificar` §2.1, §2.2 and §3.1.

visual finish around the motion (ground, collider, shadow, z-fighting):
`gavi#qualidade-sem-falha`.

## 8 — the professional tier: what it is, and which file owns it

the pipes above get a motion playing. this is the index of what makes it studio-grade, and
every row lives in exactly one file.

| what you need | where it lives |
| --- | --- |
| clip lengths in frames at 24 and 30 fps — 24-frame walk, 16-frame run, 12-18 light attack, 24-32 heavy, 8-12 hit, 30-45 death | `gavi#animar-doutrina` §3.1 |
| the four beats — anticipation / action / overshoot / settle — and the frame split of each | `gavi#animar-doutrina` §3.1 |
| spacing as ease, the arc's apex, the favouring pose, moving holds | `gavi#animar-doutrina` §3.2 |
| weight: contact, the landing compression, the settle, hips leading by 2-4 frames | `gavi#animar-doutrina` §3.3 |
| the 128 px silhouette test and the minimum readable rotation per bone | `gavi#animar-doutrina` §1.1 |
| layered upper body, per-bone masks, weight sums and the rest-pose remainder, blend windows in ms | `gavi#animar-glb` §6.1, §7 |
| a clip's real baked length, and why the mixer has no gain | `gavi#animar-glb` §6.2 |
| drag, overlap, the smoothing ladder, spring constants per material, `jiggle` honestly | `gavi#animar-esqueleto-codigo` §6 |
| sprite frame counts by action, the rate lever, why 8 frames beat 24 | `gavi#animar-2d` §4.1 |
| the impact frame held 2 ticks, and the smear frame | `gavi#animar-2d` §4.2 |
| sub-pixel motion and the three things that cause it | `gavi#animar-2d` §6.1 |
| the A/B protocol, amplitude measured in a capture, foot slide measured | `gavi#animar-verificar` §2.1, §2.2 |
| the eight things a still can never prove | `gavi#animar-verificar` §3.1 |

the order to reach for them: the doctrine's frames and beats before you author anything,
the pipe's own layering while you build, the proof before you say a word.

## what goes wrong

- **a bone on a phenomenon.** TELL: a skeleton built for smoke or a trail; upload budget
  spent on something the player reads as a puff. FIX: `fx`.
- **`jiggle` on something that never moves.** TELL: a flag that is perfectly still, no
  log line at all. FIX: it is excited by movement. a still sway is a material (§5).
- **the wrong pipe, discovered an hour in.** TELL: three hours negotiating with a bad
  conjured rig. FIX: two failed mints is an answer — switch to code
  (`gavi#animar-esqueleto-codigo`).
- **hand-driven sprite frames.** TELL: `sprite.frame`/`fps` scrolling inside `update`
  works for ten minutes, then fights replication, pausing and state changes. FIX: the
  mixer owns sprite animation (`gavi#animar-2d`).
- **free rotation on pixel art.** TELL: the grid grinds and the character shimmers when
  turning. FIX: turn by `?facing=` swap; keep `roll` for projectiles and crates.
- **"animate everything, then look".** TELL: a compound failure with no single readable
  cause. FIX: one verb, one 6-frame burst, then the next verb.