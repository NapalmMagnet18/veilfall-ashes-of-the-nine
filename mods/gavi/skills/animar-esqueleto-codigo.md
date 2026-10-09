---
name: Animate Code Skeleton
description: Pose written in code — animating a body of parented primitives by writing local rotations per tick. The measured axis and pivot convention, a four-storey clip architecture with weight blending, distance-driven walk cycles, phase offsets between limbs, the amplitude floor that survives 6 metres, and the replication law that keeps a 15-joint creature from choking the room.
---

# Gavi — skeleton in code

for bodies no generator rigs properly: spiders, cranes, octopuses, rabbits,
skeletons, machines. the body is a tree of parented primitives and the animation is
you writing **local rotation** per tick. the law is `gavi#animar-doutrina`, the proof
is `gavi#animar-verificar`.

## route in 10 seconds

| the situation | do this |
| --- | --- |
| non-humanoid creature that has to walk | §3's four storeys. distance-driven phase, legs 0.5 cycle apart |
| the two legs move nearly together | contralateral legs are **π rad / half a cycle** apart, not 0.35 rad (§3) |
| it walks but the feet skate | phase advanced by TIME. advance it by DISTANCE: `phase += sp*dt / 1.4` (§3) |
| creature reads as frozen at 6 m | thigh opening under 15°. floor is 15-40° — `gavi#animar-doutrina` §1 |
| the world freezes when the creature spawns | you're writing bones at 30 Hz. `updateSchedule = { every: 3 }` + threshold (§5) |
| the piece rotates about its middle, not its base | pivot defaults to **feet** already. only set `pivot` to change that (§2) |
| creature stays crooked when every clip is off | your write blends against the last value, not the lib's rest pose (§4) |
| it IS a rigged humanoid | wrong pipe. `gavi#animar-glb` |
| the tail, ears or cape move as one stick with the body | per-joint SMOOTH ladder + cumulative phase lag (§6) |
| a spring bone flings to absurd angles or NaNs | `k · dt² < 1` — at `every: 3` that caps k at 100 (§6) |
| the ask was "the cape should lag three frames" | that is the smoothing ladder, not `jiggle` (§6) |

## 1 — two files, always

- `scripts/lib/<beast>-skeleton.js` — the **table**: pieces, parents, dimensions,
  local `feetPosition`, rest rotation, material. exports `build(api, rootId)` →
  `{ jointName: entityId }` and `rest(name)` → the neutral rotation. `module.exports`
  (both dialects compile, CJS is the habit for libs).
- `scripts/<beast>-body.js` — the **animator**. knows joint names, never geometry.

mirroring left/right comes out of a loop over the table, never a hand copy. hand
copies are where crooked legs are born.

## 2 — the axis and pivot convention

measured with `preview_object` + `api.getWorldBoundsBox(id)`, not deduced:

- a child's `feetPosition` is that piece's **base**, in the parent's local frame
  (origin = the parent's own feet). `feetPosition` is bottom-center everywhere.
- capsule total length = `height + 2 * radius`.
- pieces grow along local **+Y**. at pitch θ the piece points toward
  `(0, cos θ, sin θ)`. a bone that **hangs** (thigh, arm): `+pitch` swings forward. a
  bone that **rises** (ear, horn, neck): `+pitch` swings backward.
- parent and child pitch **add**: shoulder 20° + elbow 20° = 40° in the world.
- **rotation already pivots at the feet.** no `pivot` set is bit-identical to
  `pivot: 'feet'`. set `pivot: 'center'` only when a piece must spin about its middle
  (a wheel, a head yaw), `'top'` for something hinged at its upper edge. a **dynamic**
  body ignores `pivot` entirely — physics rotates it about its centre of mass.
- writes on a parented child are **local**: `api.setObjectProperty(id, 'rotation', …)`
  sets local rotation. reading `properties.rotation` back gives you world-space and
  `properties.localRotation` gives a quaternion — neither is pleasant to judge by.
  check the shape with `getWorldBoundsBox`, degrees on paper.

all angles are DEGREES. every one, everywhere in this engine except camera config
pitch.

## 3 — the four storeys

each storey talks only to the one below. this is the shape that survives twenty change
requests, because "the run looks weird" becomes ONE entry in `CLIPS`.

```js
// scripts/rabbit-body.js
const SKEL = require('lib/rabbit-skeleton.js');
const { GAIN, blend } = require('lib/animar-blend.js');

export const updateSchedule = { every: 3 }; // 10 Hz of writes on a 30 Hz tick — §5

const SMOOTH    = 20;   // approach rate; higher = stiffer
const THRESHOLD = 1.0;  // degrees. below this the joint is not shipped
const STRIDE    = 1.4;  // metres of ground per full leg cycle, for a 1.8 m body

// --- storey 1: sense. the ONLY place that talks to the engine ---------
function sense(api, b, dt, t) {
  const v = api.getVelocity();
  const sp = Math.hypot(v.x, v.z);
  // DISTANCE-driven phase: one cycle per STRIDE metres travelled. this is what
  // stops foot skate — a time-driven phase only matches at one speed.
  b.phase = (b.phase + (sp * dt) / STRIDE) % 1;
  b.lean += (-0.9 * ((sp - b.spPrev) / Math.max(dt, 1e-3)) - b.lean) * dt * 6;
  b.spPrev = sp;
  return {
    t, dt, sp,
    m: Math.min(1, sp / 6.2),       // 0 = creeping, 1 = flat sprint
    f: b.phase,                     // 0..1 through the cycle
    airborne: !api.isGrounded(),
    lean: b.lean,
  };
}

// --- storey 2: the clips. weight(c) -> 0..1, pose(c) -> degrees -------
const CLIPS = {
  idle: {
    weight: c => (1 - c.m) * (c.airborne ? 0 : 1),
    pose: c => {
      const r = Math.sin(c.t * 1.15);          // 1.15 Hz — under the 2.5 Hz ceiling
      return {
        hips:  { dy: 0.016 * r, roll: 3.6 * r, yaw: 3.2 * Math.sin(c.t * 0.7) },
        torso: { pitch: -1.6 * r },
        neck:  { yaw: 11 * Math.sin(c.t * 0.52) },
        earL:  { pitch: 9 * Math.sin(c.t * 0.73) },
        earR:  { pitch: 9 * Math.sin(c.t * 0.61 + 1.7) },  // asymmetry, 8.3 s beat
      };
    },
  },
  stride: {
    gain: 1.15,                                 // already a big clip; less exaggeration
    weight: c => c.m * (c.airborne ? 0 : 1),
    pose: c => {
      const a = c.f * Math.PI * 2;
      const open = 24 + 62 * c.m;               // 24° creeping, 86° sprinting
      return {
        // contralateral: HALF A CYCLE apart. π, not a small lag
        thighL: { pitch:  Math.sin(a)          * open },
        thighR: { pitch:  Math.sin(a + Math.PI) * open },
        // knees trail their thigh by 0.09 of a cycle ≈ 0.055 s at a 0.6 s cycle
        shinL:  { pitch: -Math.sin(a - 0.57)          * open * 0.45 },
        shinR:  { pitch: -Math.sin(a + Math.PI - 0.57) * open * 0.45 },
        torso:  { pitch: 4 + 11 * c.m },        // lean into the run
        earL:   { pitch: -Math.sin(a + 1.1) * (10 + 22 * c.m) },
      };
    },
  },
};

// --- storey 3: mix. sweeps CLIPS without knowing one name ------------
function mix(c) {
  const acc = {};
  for (const name in CLIPS) {
    const cl = CLIPS[name];
    const w = Math.min(1, Math.max(0, cl.weight(c)));
    if (w < 0.001) continue;
    const g = cl.gain === undefined ? GAIN : cl.gain;
    const q = cl.pose(c);
    for (const j in q) blend(acc, j, q[j], w, g);
  }
  return acc;
}

// --- storey 4: write. smooth, drop the still joints, ONE batch -------
function write(api, b, acc, dt) {
  const batch = [];
  for (const name in b.ids) {
    const target = acc[name] || SKEL.rest(name);
    const cur  = b.smoothed[name] || (b.smoothed[name] = { ...SKEL.rest(name) });
    const sent = b.sent[name]     || (b.sent[name]     = { ...SKEL.rest(name) });
    let ship = false;
    for (const k of ['pitch', 'yaw', 'roll']) {
      cur[k] += ((target[k] || 0) - cur[k]) * Math.min(1, SMOOTH * dt);
      if (Math.abs(cur[k] - sent[k]) > THRESHOLD) ship = true;
    }
    if (!ship) continue;
    sent.pitch = cur.pitch; sent.yaw = cur.yaw; sent.roll = cur.roll;
    batch.push({ id: b.ids[name], properties: { rotation: { pitch: cur.pitch, yaw: cur.yaw, roll: cur.roll } } });
  }
  if (batch.length) api.batchSetObjectProperties(batch);
}

export function onSpawn(api) {
  const b = api.scratch('rig');
  b.ids = SKEL.build(api, api.id);
  b.phase = 0; b.spPrev = 0; b.lean = 0; b.smoothed = {}; b.sent = {};
}

export function update(dt, api) {
  const b = api.scratch('rig');
  if (!b.ids) return;                       // scratch is re-derivable, never trusted blind
  write(api, b, mix(sense(api, b, dt, api.getTick() / 30)), dt);
}
```

**why `api.scratch()` and not state:** phase and smoothing are re-derivable cosmetics.
`patchState` every tick is replicated and persisted — the exact cost §5 is about.
scratch is never replicated, never persisted, survives script edits. losing it costs
one cycle of phase, which nobody sees. (on a client-predicted entity like the player
it does not survive resim — re-seed it lazily like `onSpawn` does.)

**the phase numbers, said out loud:** `STRIDE = 1.4 m` for a 1.8 m biped. at 3 m/s
that is 2.14 cycles/s — a 0.47 s cycle, right in the 0.35-0.45 s run band. legs at
`π` apart. knee trailing its thigh by `0.57 rad` = 0.09 of a cycle = **55 ms** at a
0.6 s cycle, inside the 0.05-0.12 s follow-through window.

## 4 — the minimum catalogue

`inertia` (always on, bottom layer) · `idle` · `stride` · `jump` · `landing` · `skid`
· `turn` · `attack` · plus three random idles (`sniff`, `look`, `stretch`).

random idles are what make a body look inhabited: fire one every **2-4 s** of standing
still, weight rising and falling on an envelope, and **make the paw actually touch the
ear** — an idle that touches nothing isn't an idle.

```js
// inside sense(), where sp is already in hand. api.random(), never Math.random
if (sp < 0.1 && api.getTick() > (b.nextIdleTick || 0)) {
  b.idlePick = Math.floor(api.random() * 3);
  b.idleUntil = api.getTick() + api.seconds(1.2);
  b.nextIdleTick = api.getTick() + api.seconds(2 + api.random() * 2); // 2-4 s
}
```

## 5 — the replication law: never write a parented body at 30 Hz

every bone written on a tick is a line of upload. 15 joints at the full 30 Hz tick is
**450 property writes per second per creature**, and the room answers with one of two
log lines — they mean different things:

```
per-tick StateDeltas budget exceeded (oldest dropped first, 37 queued)
```
that one is volume: the room's upload flood budget dropped your message, oldest first.
the whole world reads as frozen.

```
Upload writes from client "…" keep losing to server-side writes at the
server-write fence: 12 entries dropped in the last ~30s
```
that one is **two writers racing** on the same components — a server-side script (hook,
cron or `run_script`) is also writing those rotations. volume is not the cause; pick
one writer.

the correction is three parts, all mandatory:

1. `export const updateSchedule = { every: 3 }` — 10 Hz. dt arrives as the declared
   step (0.1 s), so integrate-by-dt code needs no change. the eye does not pay for the
   difference; the network pays a lot. **delete any hand-rolled `tick % 3` gate** — the
   engine's per-entity phase and yours rarely coincide, and two gates stacked means the
   script mostly stops running.
2. `THRESHOLD` of **1.0°** — a joint that moved less does not enter the batch. on a
   standing idle that alone drops 60-80% of the writes.
3. **one `api.batchSetObjectProperties` call per tick.** never a loop of
   `setObjectProperty`.

interpolation does the rest: it is **on by default**, with a teleport threshold of
**2 m** — a piece that jumps more than that in one write snaps instead of smoothing
(fine, that IS a teleport). do not set `interpolation: null` on an animated bone; that
disables the smoothing that makes 10 Hz read as continuous.

for a burst — an attack, a stumble — take the cadence up and put it back:

```js
api.setUpdateSchedule({ every: 1 });  // 30 Hz for the swing
api.setUpdateSchedule(null);          // back to the declared every: 3
```

## 6 — secondary motion: drag, overlap, and springs with real constants

§4 gives the clips. this is the layer that turns a correct walk into a body: the parts
that do NOT arrive on the parent's frame. the law is `gavi#animar-doutrina` §3.3 — hips
lead, extremities lag 2-4 frames — and here is how it is written at 10 Hz.

### the smoothing ladder — drag for free, zero extra writes

`write()` already eases every joint toward its target with one `SMOOTH`. make `SMOOTH`
**per joint** and the whole chain drags correctly with no new code path: the time constant
is `τ ≈ 1 / SMOOTH` seconds, so a lower constant IS a longer lag.

| joint | SMOOTH | τ | reads as |
| --- | --- | --- | --- |
| hips, root | 20 | 50 ms | leads. always first |
| torso | 16 | 63 ms | follows the hips into a turn |
| neck | 13 | 77 ms | the head arrives after the shoulders |
| head | 11 | 91 ms | — |
| ear / tail base | 9 | 111 ms | a visible beat behind the head |
| tail mid | 7 | 143 ms | — |
| tail tip | 5.5 | 182 ms | still moving when the body has stopped |

each rung is ~0.78× the one above — that ratio is what makes a chain break successively
instead of as one stick. two lines inside `write()`:

```js
const S = (SKEL.smooth && SKEL.smooth(name)) || SMOOTH;   // a table entry, else the global
cur[k] += ((target[k] || 0) - cur[k]) * Math.min(1, S * dt);
```

**overlap comes with it for free:** when the body stops, the target snaps to rest and the
tip keeps travelling for `τ` — 2-4 more writes at 10 Hz, 0.2-0.4 s of the tail catching
up. that is overlap, and it cost nothing.

### the cyclic form: a two-bone chain lagging its parent

§3 lags the knee behind its thigh by `0.57 rad` — 0.09 of a cycle. a multi-segment
appendage is the same trick, cumulative, with one addition: the **amplitude grows toward
the tip** while the frequency stays the parent's. that is a whip.

```js
// tail: 4 segments, each 0.08 of a cycle behind the one before, each swinging 1.4× wider
const base = 7 + 14 * c.m;                       // 7° idling, 21° at a sprint
for (let i = 0; i < 4; i++) {
  q['tail' + i] = { yaw: Math.sin(a - i * 0.5) * base * Math.pow(1.4, i) };
}
```

`0.5 rad` per link is 0.08 of a cycle — about 48 ms at a 0.6 s cycle, inside the
follow-through window. keep the lag per link at **0.06-0.10 of a cycle**: below that the
chain is a stick, past 0.15 it reads as a separate creature living on the body.

### the spring form: for motion that is not a cycle

a cape reacting to a stop, an ear flicking after a turn, a lantern on a belt. one angular
spring per bone, integrated in `update` — the 1D positional twin is `gavi#animar-2d` §8;
these are DEGREES, and the constants are per material:

```js
// s = api.scratch('rig').spring[name] — target is the parent's delta, s.x is degrees out
s.v += (target - s.x) * k * dt;
s.v *= Math.exp(-c * dt);
s.x += s.v * dt;
```

| what it is | k | c | reads as |
| --- | --- | --- | --- |
| hair, thin braid | 140 | 9 | quick and whippy, several small oscillations |
| ear, feather, antenna | 110 | 10 | one clear overshoot, then done |
| light cloth cape | 70 | 11 | slow drape, no ring |
| heavy tail, rope, chain | 45 | 8 | one big lazy swing |
| chainmail, thick leather | 200 | 18 | stiff, barely moves, never rings |

**the stability number nobody mentions: an explicit spring needs `k · dt² < 1`.** at
`every: 3` (dt = 0.1 s) that caps **k at 100** — so hair at 140 and mail at 200 diverge
and fling the bone to absurd angles. either drop `k`, or run those bones at `every: 2`
(dt 0.066 → k < 225) or `every: 1` (dt 0.033 → k < 900). a spring that "exploded after a
speed change" is this and nothing else.

### `jiggle` on a code rig — what it honestly is

`properties.jiggle` on a body of parented primitives is **not** the bone-chain path: there
is no skin, so the `bones: ['Tail*']` globs (up to 16, case-insensitive) match nothing and
you get the whole-object wobble + squash instead. it is **purely presentational** — it
never pushes, never collides, never becomes physics, and it does not move the piece's
children. your per-tick rotation writes still own the pose; the wobble rides on top.

what it is good for: leaf pieces you refuse to spend a joint on — a tail tip, an ear tip, a
lantern, a pack. zero writes, zero replication. what it cannot do: be authored in frames or
degrees. the knobs are 0..1 tendencies (`amount`, `bounce`, `gravity`), so when the ask is
"the cape should lag by three frames", that is the ladder above, not `jiggle`.

### the readability floor for a secondary

a secondary reads as a **delta against a moving parent**, so measure both: the tip's travel
wants at least **1/3 of the parent's** screen travel, and it still has to clear 5 px on its
own. a 0.1 m ear tip needs 33° at 6 m to read alone — `gavi#animar-doutrina` §1.1's table.
that is why the ear's own 9° is texture, and why a secondary hung on a parent that barely
moves is invisible twice over.

## what goes wrong

- **legs walking in unison.** TELL: the creature bounces like a pogo stick instead of
  walking. FIX: contralateral pairs are `Math.PI` apart. a 0.35 rad offset is 0.056 of
  a cycle — a follow-through lag, not a gait.
- **feet skate.** TELL: the body glides faster than the legs cycle, or the legs spin at
  low speed. FIX: advance phase by distance, `(sp * dt) / STRIDE`, not by time.
- **the world freezes when the creature spawns.** TELL: `per-tick StateDeltas budget
  exceeded` in `getLogs()`, everything stutters, not just the creature. FIX: §5, all
  three parts.
- **rest pose never returns.** TELL: every weight is 0 and the creature stays crooked.
  FIX: `write()` must fall back to `SKEL.rest(name)` when the joint is absent from the
  accumulator — not to the last value.
- **a limb through the floor after an exaggeration pass.** TELL: feet vanish into
  terrain on the down beat. FIX: gain multiplied a metre. `dy`/`y` are exempt —
  `gavi#animar-doutrina` §2.
- **the animator dies silently after an edit.** TELL: creature stands still, no error,
  `api.scratch()` bag is empty. FIX: scratch does not survive client resim on predicted
  entities — guard with `if (!b.ids) return;` and re-seed, exactly as `onSpawn` does.
- **the spring that exploded.** TELL: a tail or cape flings to absurd angles, or goes NaN,
  right after a speed change. FIX: an explicit spring needs `k · dt² < 1` — at `every: 3`
  (dt 0.1) k must stay under 100. drop k or raise the cadence (§6).
- **the chain that moves as one stick.** TELL: tail, ears and cape rotate rigidly with the
  body; nothing is ever late. FIX: the per-joint `SMOOTH` ladder plus 0.06-0.10 of a cycle
  of lag per link (§6).
- **`jiggle` used as drag.** TELL: `jiggle` added to a code rig's tail and it still reads
  rigid; no log line anywhere. FIX: on unskinned pieces it is whole-object wobble and
  unauthorable in degrees — write the lag (§6).
- **replacing the player's behavior array wipes other lanes.** TELL: shout, interaction
  or camera relays another wisp attached stop firing, no error. FIX:
  `api.addBehavior('player', [...])`, never `patchPlayer({ behavior: [...] })` —
  `behavior` is not settable through `patchPlayer` at all.