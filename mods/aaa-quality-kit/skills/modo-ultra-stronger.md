---
name: Modo Ultra Stronger
description: The ENGINEER brain — advanced-programmer curriculum for game builders: the handful of math that carries 90% of game feel, engineering discipline (one concern, data over branching, state ownership), style fluency across 1D/2D/3D/pixel, and the efficiency habits that hold 60fps.
---

# Modo Ultra Stronger — the engineer brain

**This is a curriculum, not a model swap.** "Activating the mode" IS loading this skill and
following it. No model changes, no brain changes, and by itself zero change to how the game looks
or which assets exist — what changes is how the next system gets built.

Build like someone who studied the math and has shipped in every style: 1D lane games, 2D
platformers, top-down, full 3D, pixel-art. `aaa-quality-kit#aaa-training` owns the debugging
doctrine and the verified symptom→fix dataset — read it for *how to find a bug*; read this for
*how to write the thing so the bug never exists*.

---

## 1. The math that actually pays

Six families carry ~90% of game feel. `builtin/math`, `builtin/vec3` and `builtin/easing` already
implement them — call them, never redefine them.

| tool | the one-line use |
| --- | --- |
| **vector subtract + normalize** | "which way is it from me" — every chase, aim, knockback, and lookAt starts here |
| **dot product** | "is it in front of me / how aligned" — facing checks, cone-of-vision, wall slide, damage falloff by angle |
| **cross product** | "which side is it on" — turning left vs right, banking, surface tangents |
| **atan2** | direction → angle. `Math.atan2(-dx, -dz) * 180 / Math.PI` is this engine's yaw (0° faces −Z, CCW from above) |
| **sin / cos** | anything cyclic: orbit, bob, sway, breathing, gait phase. One clock (`phase += dt * rate`) drives a whole character |
| **lerp** | blend two values by `t`. The workhorse; wrong when used raw per-frame (see integration) |
| **smoothstep** | a gate with soft shoulders — fades, LOD bands, "in range" that doesn't pop |
| **easing curves** | shape of a motion in time: `easeOutQuad` for anything the player triggered (instant then settle), `easeInOutCubic` for cameras, `easeOutBack` for pop-in. Linear reads mechanical on anything the eye follows |
| **noise (2d/3d)** | continuity where random has none: terrain, wander headings, torch flicker, wind. `api.random()` per tick jitters; noise *drifts* |
| **dt-correct integration** | the game plays identically at 30 and 144 fps |

**Integration, precisely.** Semi-implicit Euler is what platformers use and it is enough:

```js
v.y += gravity * dt;          // accelerate first
p.y += v.y * dt;              // then move — never the other order
```

Exponential follow (camera, aim, turret) written the wrong way is frame-rate dependent
(`x += (target - x) * 0.1` is faster on a fast machine). Written the right way it isn't:

```js
const k = 1 - Math.pow(1 - rate, dt * 60); // rate = per-60fps-frame fraction, e.g. 0.15
x = lerp(x, target, k);
```

Clamp `dt` (`Math.min(dt, 0.05)`) at the top of any integrator: one tab-out spike otherwise
teleports a projectile through a wall.

**Angles:** every angle in the spec is DEGREES (only camera config pitch is radians). Wrap
differences into ±180 before easing them — `((a - b + 540) % 360) - 180` — or a turn from 350° to
10° takes the long way round.

## 2. Engineering discipline

- **One concern per script.** A behavior does one job; helpers go to `scripts/lib/*.js`, data to
  `scripts/lib/data/*.json`, UI to `scripts/ui.js`. A 600-line behavior doing movement, inventory
  and audio is three bugs sharing a file.
- **The second of anything is a data row.** The first enemy is a script; the second enemy is a row
  in `enemies.json`. If adding variant #2 means editing logic, the system was built wrong — stop
  and parameterize before adding it. This is the single highest-leverage habit in the list.
- **Data-driven tables beat branching.** `if (type === "pig") ... else if (type === "rabbit")` is
  a table waiting to be written. Tables are readable at a glance, diffable, tunable live, and they
  never grow an `else` nobody tested.
- **Clear state ownership.** Exactly one writer per piece of state. The player owns its body and
  its input intent; a place manager owns waves, timers and objectives; a world manager owns
  world-global state; each object owns its own. Game-global logic never lives on the player — the
  player leaves. Everything else *reads* (`getObjectState`) or *asks*
  (`emit` → manager `on`, `sendAction` from UI, `interact` object→object).
- **State is replicated memory, not scratch space.** Per-frame scratch (last-visible flags, cached
  distances, phase accumulators nobody else reads) lives in plain script variables. A
  `patchState` per object per tick is a replication storm with a gameplay feature attached.
- **Write on flips, not on ticks.** Guard every `setProperty`/`setObjectProperty` with "did it
  actually change" — `if (shown[id] === next) continue;`. Idle should be write-free.
- **Name the contract in the file header.** A scripted mesh declares its frame (−Z forward, +Y up,
  origin at the grip) and exports the numbers other scripts depend on. Undocumented implicit
  frames are why a rig ends up rotated 90° three files away.
- **Fail loud in dev, quiet in prod.** `api.getRoomMode()` gates dev-only conveniences; they flip
  off at publish without a code change.

## 3. Style fluency — pick the form the idea wants

The form is a decision, not a default. A pixel platformer is `2d-side` because that is what it is,
not a 3D world flattened.

| form | place mode + physics | camera grammar | art discipline |
| --- | --- | --- | --- |
| **1D lane** (runner, rhythm, tunnel) | `3d` or `2d-side`; movement on ONE axis, everything else on rails | fixed offset, zero player control; speed sells depth (FOV +2–5° at boost) | one silhouette read per obstacle — the player has ~0.4 s to parse it |
| **2D platformer** | `2d-side`, side-on physics; jump arc is the whole game | follow with deadzone + lookahead in the travel direction; snap Y on ground, ease Y in air | one texel scale; tile grid = collision grid |
| **2D top-down** | `2d-top`; no gravity, 8-way or twin-stick | centred or aim-biased follow; rotate the *character*, never the world | feet-pivot sprites, `ySort` for overlap (a 2D-place tool only) |
| **3D** | `3d`, real terrain + collision | third-person orbit (55–65° FOV) or first person (70–80°); the rig IS a script | silhouette-first models, CDN-dressed surfaces, LOD by ring |
| **2.5D / iso** | `3d` wearing flat art | locked yaw/pitch, orthographic-feeling; a fixed rig is the point | billboards with `?facing=` poses; cutout alpha; buildings stay geometry |
| **pixel-art** | any mode, but committed | snap camera to the pixel grid at render scale 1 | ONE texels-per-metre for the whole world; mixed density reads broken even when each sprite is fine |

Cross-cutting: **2D sorting flags are inert in 3D places** (`sortingLayer`, `ySort`) — in 3D,
occlusion is depth and the fix is `cutout: true`. And input shape follows form: name movement axes
`moveX`/`moveZ` and phones get a stick for free; anything richer is `inputs.touch.surfaces`.

## 4. Efficiency habits (the frame budget is a feature)

Performance outranks the feature that costs it. These are the habits, in order of payoff:

- **`updateSchedule` over hand-rolled tick gates.** `export const updateSchedule = { every: 2 }`
  or `{ every: { seconds: 1/6 } }` — the engine *skips* the declined ticks and `dt` arrives as your
  declared step. A `getTick() % 2` gate still pays the call overhead every tick; keeping both is a
  double-gate bug. Ambience, LOD, reveal logic, AI re-targeting: 4–10 Hz is invisible to players.
- **One cohort system over N per-object scripts.** 300 crates driven by one manager loop over a
  registry beats 300 behaviors with 300 `update`s. Build the registry at stamp time (authored
  constants) so the loop is arithmetic, not queries.
- **Throttle queries, cache their answers.** `api.query` in an every-tick `update` is the classic
  frame killer. Query at the cohort's cadence, keep the result, reuse it.
- **Batch persistence, ration when.** Each `api.withPersistence` scope costs a flat ~quarter-second
  client stall regardless of size — batching into fewer scopes is the optimization; splitting is
  the regression. Never inside a hot loop.
- **Instance on purpose.** Scripted geometry with identical script + params + seed shares one
  mesh and draws instanced; varying seed per object is what mints unique meshes. A forest of one
  seed is nearly free; a forest of 200 seeds is 200 uploads.
- **Fewer, bigger meshes.** One merged structure beats forty boxes — for draw calls *and* for
  z-fighting. `api.unionSolid([ids])` merges an assembly that already exists as spawned boxes.
- **Event throttles.** Coalesce bursts (damage numbers, particle spawns, UI refreshes) to a cap
  per window; a UI that re-renders per damage tick is a stutter with a number on it.
- **Measure, don't guess.** `get_game_perf` names the heaviest costs from real devices. A
  "feels laggy" report is evidence work, not a rewrite prompt.

## 5. The engineer's pass before shipping a system

1. Can variant #2 be added as a data row? If not, parameterize now.
2. Who owns each piece of state, and is there exactly one writer?
3. Is anything writing properties or state on a tick where nothing changed?
4. Does the update loop declare a schedule, or is it running at 60 Hz for no reason?
5. Is the integration dt-correct, and is `dt` clamped?
6. Is the form right — mode, physics, camera grammar — or is this a 3D world pretending to be 2D?
7. One before/after measurement of the thing you claimed to improve (`aaa-training`, Part 1: claims
   wait for receipts).