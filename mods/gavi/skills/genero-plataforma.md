---
name: Platformer Genre
description: Gavi's platformer skill — the jump arc derived from height and time to apex, asymmetric gravity, coyote time and jump buffering with the tell for each, ground and air acceleration, the dead-zone camera as a real script, forgiving collision, and level design that never asks for more than the arc gives. 2d side view and 3d.
---

# Gavi — platformer genre

The promise: **my body obeys.** The cardinal sin: **an imprecise jump.** A platformer is won
in the first three seconds — they press, the body goes where they meant, they believe you.
One row of the table in `gavi#desenhar-o-jogo`.

## Pick your path in ten seconds

| the situation | what to do |
| --- | --- |
| starting from zero | set `JUMP_HEIGHT` 4 and `TIME_TO_APEX` 0.45. derive the rest. never type a gravity literal |
| "the jump feels weak / too low" | `JUMP_VEL` was written by hand. delete it, derive it |
| "it floats" | `FALL_MULT` is 1. set 1.9 |
| "I pressed and it didn't jump" | the two mercies: `COYOTE` 0.10, `BUFFER` 0.12 |
| "I fall through platforms when dropping fast" | `FALL_CAP × dt` outgrew the probe. see Collision |
| camera work | it is a **script** — `kind: "custom"` + `scripts/camera.js`. the engine ships no builtin rig |
| 2d side vs 3d | `2d-side` for a real platformer; 3d only when depth is the puzzle |
| placing platforms | reach test: rise < `JUMP_HEIGHT`, gap < `MAX_SPEED × AIR_TIME` |
| art and clips | `gavi#criar-pixel-art` + `gavi#animar-2d` (2d), `gavi#criar-modelo-3d` + `gavi#animar-glb` (3d) |

**The verb** is jump. **The loop** is see the gap → commit → land → the next gap is visible
before the landing settles. **The camera** holds still inside a 1.5 m box and chases hard
downward. **The three numbers that decide the feel:** `JUMP_HEIGHT` 4.0 m,
`TIME_TO_APEX` 0.45 s, `FALL_MULT` 1.9. Everything else is derived from those.

## LAW ZERO — gravity is a consequence, not a choice

Picking `-9.81` and hunting for a jump velocity that "looks about right" is choosing the
shadow before the object. **Two decisions come first:**

1. **HEIGHT** — metres the body rises. This is level design: the ceiling on everything the
   level may ever ask for. Rule: **3.5 to 4× the character's height.**
2. **TIME TO APEX** — seconds to the top. This is feel: 0.40–0.50 s is nimble, past 0.6 s
   it turns lunar.

Everything else falls out by identity. **Reach** closes the triangle: the gap the level asks
for decides top ground speed, never the other way round.

```js
// scripts/heroi.js — owns state.vx, vy, coyote, buffer, stillRising
// their ask: "jumps high, falls fast" -> HEIGHT 4, FALL_MULT 1.9
var JUMP_HEIGHT  = 4.0;   // metres of rise; a 1.1 m body -> 3.6x
var TIME_TO_APEX = 0.45;  // seconds to the top
var FALL_MULT    = 1.9;   // the fall pulls 1.9x harder than the rise
var TARGET_GAP   = 5.0;   // the widest gap the level will ever ask for
// DERIVED — never literals, never hand-tuned
var JUMP_VEL  = (2 * JUMP_HEIGHT) / TIME_TO_APEX;                    // 17.78 m/s
var GRAV_RISE = (-2 * JUMP_HEIGHT) / (TIME_TO_APEX * TIME_TO_APEX);  // -39.51 m/s²
var GRAV_FALL = GRAV_RISE * FALL_MULT;                               // -75.07 m/s²
var AIR_TIME  = TIME_TO_APEX + TIME_TO_APEX / Math.sqrt(FALL_MULT);  // 0.777 s
var MAX_SPEED = TARGET_GAP / AIR_TIME;                               // 6.44 m/s
var FALL_CAP = 20, APEX_THRESHOLD = 2.5;  // fall cap (matched to the probe); apex float
```

**Reach test, mandatory once the platforms are placed:** tallest rise < `JUMP_HEIGHT`,
widest gap < `MAX_SPEED × AIR_TIME`. Hand-editing `GRAV_RISE` means the arc lost its owner
(`gavi#programar-de-verdade`) — move HEIGHT/TIME_TO_APEX instead.

- **Fall faster than you rise** — `FALL_MULT` 1.7–2.2. A slow rise lets them choose the
  landing; a fast fall gives weight. Symmetrical is the #1 cause of "it floats".
- **Apex float** — `|vy| < 2.5` → gravity × 0.5: ~0.1 s of hang at the top, which is where
  aiming happens. Two lines, generosity for free.
- **Variable height** — releasing inside `VARIABLE_WINDOW` multiplies `vy` by 0.45 **once**
  (a tap ≈ 55% of full height). Zeroing `vy` instead cuts the arc dead and reads as a stutter.

## Starting numbers

| constant | 2d side (1.1 m body) | 3d (1.8 m body) | the test that confirms it |
| --- | --- | --- | --- |
| JUMP_HEIGHT | 4.0 m | 3.2 m | 3.5–4× the body's height |
| TIME_TO_APEX | 0.45 s | 0.40 s | > 0.6 s = the moon; < 0.32 s = a twitch |
| JUMP_VEL / GRAV_RISE *(derived)* | 17.8 / −39.5 | 16.0 / −40.0 | never literals |
| FALL_MULT | 1.9 | 1.7 | 1.0 = it floats; > 2.5 = a brick |
| MAX_SPEED on the ground | 6.4 m/s | 7.0 m/s | TARGET_GAP / AIR_TIME |
| ACCEL / FRICTION on the ground | 60 / 90 m/s² | 55 / 80 m/s² | MAX_SPEED/ACCEL = 0.08–0.13 s |
| ACCEL / FRICTION in the air | 35 / 18 m/s² | 32 / 14 m/s² | MAX_SPEED/ACCEL = 0.18–0.25 s |
| FALL_CAP | 20 m/s | 24 m/s | `FALL_CAP × dt` ≤ the probe's reach |
| COYOTE / BUFFER / VARIABLE_WINDOW | 0.10 / 0.12 / 0.20 s | 0.12 / 0.15 / 0.18 s | +0.04 s on touch (`gavi#fazer-mobile-e-pc`) |
| CORNER_FORGIVE | 0.25 m | 0.30 m | > 0.45 m reads as a teleport |

## The three mercies

Without them the jump is arithmetically correct and **feels wrong**. `onInput` only publishes
`moveX: input.axes.moveX` and `holding: !!input.actions.jump`; the rest is the loop. Bind
jump with `activeOn: "hold"` or the key is true for one frame only and the buffer never sees it.

```js
var COYOTE = 0.10, BUFFER = 0.12, VARIABLE_WINDOW = 0.20;
export function update(dt, api) {
  var s = api.getState(), grounded = api.isGrounded();
  var vx = s.vx || 0, vy = s.vy || 0;
  // 1 — COYOTE TIME: the ground still counts for COYOTE s past the edge
  var coyote = grounded ? COYOTE : Math.max(0, (s.coyote || 0) - dt);
  // 2 — INPUT BUFFER: a press that lands BEFORE the feet do is kept
  var edge = s.holding && !s.heldLast;                  // the rising edge, by hand
  var buffer = edge ? BUFFER : Math.max(0, (s.buffer || 0) - dt);
  var jumped = buffer > 0 && coyote > 0;
  if (jumped) { vy = JUMP_VEL; coyote = 0; buffer = 0; }
  var stillRising = jumped ? VARIABLE_WINDOW : Math.max(0, (s.stillRising || 0) - dt);
  if (!s.holding && stillRising > 0 && vy > 0) { vy *= 0.45; stillRising = 0; }  // variable height
  var target = (s.moveX || 0) * MAX_SPEED;              // same MAX_SPEED on ground and in air
  var rate = Math.abs(target) > 0.01 ? (grounded ? 60 : 35) : (grounded ? 90 : 18);
  vx += Math.max(-rate * dt, Math.min(rate * dt, target - vx));
  if (grounded && vy < 0) vy = 0;
  var g = vy > 0 ? GRAV_RISE : GRAV_FALL;
  if (Math.abs(vy) < APEX_THRESHOLD) g *= 0.5;          // apex float
  vy = Math.max(-FALL_CAP, vy + g * dt);
  // 3 — CORNER FORGIVENESS: clipped the lip on the way up? slide off and keep the jump
  var nudge = vy > 0 && api.isTouchingCeiling() ? cornerForgive(api) : 0;
  if (nudge === 0 && vy > 0 && api.isTouchingCeiling()) vy = 0;
  api.move(vx * dt + nudge, vy * dt, 0);                // dz ALWAYS 0
  api.patchState({ vx: vx, vy: vy, coyote: coyote, buffer: buffer,
    stillRising: stillRising, heldLast: s.holding });
}
```

Timers run on `dt`, never on a wall clock: `Date.now()` is blocked in the sandbox, and a real
clock would drift between server and client until coyote time was worth something different
on every machine. And **air control is not cheating** — someone who misses and can't correct
blames the game: `AIR_ACCEL ≈ 0.55 × GROUND_ACCEL` (≈0.2 s to turn around),
`AIR_FRICTION ≈ 0.2 × GROUND_FRICTION`. High air friction reads as "it stopped in mid-air".

## Collision that forgives

Mercy here is never "a smaller hitbox" — shrinking the body ruins the landing on a ledge.

```js
var BODY_WIDTH = 0.5, BODY_HEIGHT = 1.1, CORNER_FORGIVE = 0.25;
function cornerForgive(api) {
  var p = api.getProperty('feetPosition');           // feetPosition is bottom-centre
  var up = { x: 0, y: 1, z: 0 }, top = p.y + BODY_HEIGHT - 0.05;
  var left  = api.raycast({ x: p.x - BODY_WIDTH / 2, y: top, z: p.z }, up, 0.25);
  var right = api.raycast({ x: p.x + BODY_WIDTH / 2, y: top, z: p.z }, up, 0.25);
  if (left && !right) return  CORNER_FORGIVE;        // clear on the right: slide that way
  if (right && !left) return -CORNER_FORGIVE;
  return 0;                                          // a real ceiling: the caller zeroes vy
}
```

- **A platform you pass through from below is a SENSOR, not a solid.** With
  `physics: { body: 'static', trigger: true }` plus a tag it pushes nobody; what makes it
  solid is the player's own probe, and only on the way down (`vy <= 0`):
  `api.raycast({ x, y: feet.y + 0.3, z }, { x: 0, y: -1, z: 0 }, { distance: 1.0,
  includeSensors: true, includeTags: ['soft'] })`, seating the feet at `hit.position.y`.
  **`includeSensors: true` is mandatory** — the default is false and the probe sails straight through.
- **FALL_CAP and the probe are the same decision.** The probe must reach `FALL_CAP × dt` plus
  a margin. This engine's sim tick is **30 Hz** (measured, not assumed — `api.seconds(1)` returns
  30), so 20 m/s is **0.66 m per tick**. Size the probe for the slowest tick you will ship:
  `distance: 1.0` measured from feet + 0.3 covers both. Raise the cap without lengthening the
  probe and the soft platform gets punched through, but only sometimes — the worst kind of bug.
- **Steps, in 3d:** `physics: { body: 'character', autostep: { maxHeight: 0.3, minWidth: 0.2 } }`
  is the default — raise `maxHeight` to the real riser height. `isTouchingWall(-1)`/`(1)` and
  `isTouchingCeiling()` only answer on a `character` controller; on anything else they are no-ops
  that return false forever.
- **The probe, checked against the engine:** `api.raycast` needs live physics. Inside the
  player's behavior it works (the owning client simulates the entity); in `run_script` and on
  the server it returns `null` **every time**, and `null` there means *"I couldn't look"*, never
  *"it's clear"*. For any context, `api.overlapPoint`/`api.overlapSegment` answer from the
  collider definitions — spot checks, not a per-tick loop.

## Platformer camera — it is a script, not a setting

There is **no builtin camera rig**. `CameraDef` is `kind: "custom"` (or a legacy kind-less def)
plus `behavior` — that is the whole vocabulary. The canonical side-scroller rig ships as
`scripts/camera.js` in the `2d-side` starter: **edit its constants**, don't re-author the file.
Install it durably on a game that lacks it:

```js
// dead zone, look-ahead, peek and smoothing are CONSTANTS IN THE SCRIPT, not camera fields
api.setCamera({ kind: 'custom', state: { orthoSize: 9 }, behavior: ['scripts/camera.js'],
  pixelSnap: true, pointerLock: false }, { mode: 'replace', persist: true });
```

The constants that matter, with the number and the reason:

- **`ORTHO_SIZE` 9** — visible **half**-height, so 18 m on screen. In ortho this is the only
  zoom; `DISTANCE` (15) is a Z offset and changes apparent size by exactly nothing.
- **`DEAD_ZONE_X/Y` 1.5 m** — the focus point roams this box before the camera moves. Under
  ~1 m the screen shakes on every jump; over ~2.5 m the camera turns up late in a sprint.
- **`LOOK_AHEAD` 2.5 m**, flips debounced by **`DIR_FLIP_DELAY` 0.25 s** — without the debounce,
  zigzag input swings the whole screen.
- **`SMOOTH_X` 10 / `SMOOTH_Y` 2.5**, in s⁻¹, usable band **5–12**. These are exponential
  **rates**, not lerp alphas: `k = 1 - Math.exp(-rate * dt)`, frame-rate independent.
- **`HEIGHT_OFFSET` 4 m** above the **feet** (foot-origin), **`PEEK_DISTANCE` 5 / `PEEK_DELAY` 0.4 s**
  on held `moveZ`, **`MIN_Y` null** for a camera floor.
- **World-bounds clamping** clamps viewport **edges**, and it reads `state.worldBounds` off an
  entity **tagged `"level"`**. No tag, no clamp — the commonest silent failure in that script.

**On the way down, chase harder.** The canonical rig has one rate per axis, not per direction,
so a hard landing can leave the frame. You own the script — branch the vertical rate:

```js
// scripts/camera-plataforma.js — the one edit worth making to the canonical rig
var RATE_RISE = 3, RATE_FALL = 12;      // falling chases 4x faster
export function update(dt, cameraApi) {
  var target = cameraApi.getControlTarget(); if (!target) return;
  var s = cameraApi.getState(), p = cameraApi.getProperty('feetPosition');
  var vy = (target.state && target.state.vy) || 0;
  var ay = target.feetPosition.y + 4 * (target.scale.y || 1);   // scale-aware focus
  var cy = num(s.cy) === undefined ? ay : s.cy;
  var dy = ay - cy;
  if (Math.abs(dy) > 1.5) cy = ay - Math.sign(dy) * 1.5;        // the dead zone
  var rate = vy < -1 ? RATE_FALL : RATE_RISE;
  cy = p.y + (cy - p.y) * (1 - Math.exp(-rate * dt));
  cameraApi.setProperty('feetPosition', { x: p.x, y: cy, z: p.z });
  cameraApi.lookAt({ x: p.x, y: cy, z: target.feetPosition.z });
  cameraApi.patchState({ cy: cy });
}
function num(v) { return typeof v === 'number' && isFinite(v) ? v : undefined; }
```

In 3d the rig is an orbit (`camera-third-person`) and the dead zone is **yours**: third-person
has no dead zone and no look-ahead, and the same 1.5 m box applies to the arm's target point.

## Level design

- **The jump that teaches** is 50–60% of maximum reach (a 5 m arc → a 2.5–3 m gap) and has
  **floor underneath**: impossible to fail. Then the staircase — teach it safe, repeat it with
  a cost, vary it, combine it. Three repetitions before you vary.
- **The coin pulls the eye onto the route**: it sits **on the arc**, not on the platform — three
  coins at 1.2 m drawing the curve over the gap. Behind a wall it teaches mistrust.
- **Danger is seen before it hurts**: at 6.4 m/s, 1 s of warning is 6.4 m of clear sight. No
  blind drops — a descent taller than `orthoSize` (18 m of view) hides its own landing.
- **Checkpoint near the mistake**: ≤ 8 s of redo, zero loading. Measure it with
  `api.notifyDmOnce('death-1', 'first death at the long gap')` and let the game tell you.

## 2d side view vs a platformer in 3d

`api.updatePlace('main', { mode: '2d-side' })` is a choice about physics and readability, not
about the camera. Mind the **two gravities**: the place's `gravity` rules dynamic bodies; the
character's is the one in your script, and `api.move()` never applies gravity to anything.

| | 2d side (`2d-side`) | platformer in 3d |
| --- | --- | --- |
| depth | **fake**: z changes draw order, never collision | **real**: it is the central problem |
| axis lock | third argument of `move()` is `0`, always | movement relative to the camera |
| floor | tilemap with `solidTiles` (+ `feetPosition: { x, z, y: 'surface' }`) | terrain and structures |
| background | `physics: 'none'` — dressing behind is **never** solid | genuinely solid |
| camera | `orthoSize` is the zoom; `DISTANCE` isn't | `third-person`, pitch 15–25° |

**3d's classic injustice is about reading, not physics** — people can't judge depth and miss a
jump they "saw" land. In order of payoff: (1) a **shadow marker** under the body, probing down
and dropping a dark disc at the impact point, or `api.decal(hit.position, hit.normal, { texture,
size: 0.6, lifetime: 0.2 })`; (2) **positive pitch 15–25°**; (3) a **2 m grid** and
camera-relative axes, or "forward" stops being where they are looking
(`api.getViewAngles()` is radians, `api.getCamera()` is degrees — mixing them is a 57× error).

## How it breaks

- **Gravity typed as a literal.** TELL: you are editing `-39.5` by hand and the jump height
  changes with it. FIX: derive from `JUMP_HEIGHT` / `TIME_TO_APEX`; those two are the only dials.
- **No coyote time.** TELL: they walk off a ledge, press jump, and drop — reported as "the jump
  didn't register", never as "I was late". FIX: `COYOTE = 0.10`.
- **No buffer, or jump bound `keydown`.** TELL: a press ~100 ms before landing is swallowed;
  the player feels the game skipped a beat. FIX: `BUFFER = 0.12` and `activeOn: "hold"`.
- **`FALL_CAP × dt` outgrew the probe.** TELL: falls through soft platforms *sometimes*, more
  often the longer the drop, and never reproducibly. FIX: probe ≥ cap × dt at the slowest tick
  you ship — 0.66 m at 30 Hz, so `distance: 1.0` from feet + 0.3.
- **A lerp alpha used as a smoothing rate.** TELL: camera crawls behind the player; `0.15`
  looked reasonable but τ ≈ 6.7 s. FIX: rates are s⁻¹ in `1 - exp(-rate·dt)`; the equivalent of
  alpha 0.15 at 60 fps is ≈ 9.75.
- **Missing `"level"` tag on the bounds entity.** TELL: the camera never clamps and shows void
  past the edge of the world; `worldBounds` looks correct in state. FIX: tag it `"level"`.
- **`isGrounded()` on a non-character body.** TELL: it returns false forever, so coyote time
  never refills and the player can jump exactly once. FIX: `physics: "character"`.

## What Gavi refuses

- Writing gravity as a literal. It is derived, or the arc has no owner.
- Shrinking a hitbox to "forgive". Forgiveness is corners, coyote time and buffers.
- Calling `api.raycast` in `run_script` or on the server and reading `null` as "it's clear".
- Naming a camera "kind" the engine doesn't have. Cameras are scripts; the constants are in the file.
- Saying the jump is good without running the stretch ten times by hand
  (`gavi#cacar-bugs-jogando`). It is the one thing in this genre the eye cannot check for you.
  End-to-end proof of the whole spine is `gavi#testar-tudo`; when the ask is "do it properly",
  that is `gavi#uma-so`.