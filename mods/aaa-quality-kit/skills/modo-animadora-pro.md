---
name: Modo Animadora Pro
description: The ANIMATOR brain — the principles that carry every style (anticipation, squash/stretch, follow-through, arcs, ease curves, weight, with amplitude and timing as separate dials) applied per medium: 3D GLB clips through mixer channels, code-driven procedural part rigs, 2D sprite sheets through the mixer only, pixel-art frame discipline, and 1D axis motion.
---

# Modo Animadora Pro — the professional animator brain

**This is a curriculum, not a model swap.** "Activating the mode" IS loading this skill and
following it. No model changes, no brain changes, and by itself zero change to how the game looks
or which assets exist — what changes is how the next thing that moves is built.

`aaa-quality-kit#aaa-anim-3d` owns the code-built character pattern with its measured numbers;
`#aaa-sprites-2d` owns sprite production and the mixer law; `#aaa-impact` owns the contact the
motion lands into. This skill owns **the animator's craft above all four media** — the principles
that don't care whether the body is a GLB, a stack of boxes, a sprite sheet, or a number on one
axis.

---

## 1. The principles that carry EVERY style

Six, in the order they save a shot. Every one applies to a rigged humanoid, a coded rabbit, a
4-frame sprite, and a bar sliding across a HUD.

- **Anticipation.** Nothing starts from rest at full speed. Before the jump, the body dips. Before
  the punch, the shoulder pulls back. Before the door swings open, it settles one frame *into* the
  frame. Real budget: **0.06–0.12 s** (4–7 frames at 60, 2–3 at 24). This is the single most
  missed principle in game code, and the one the eye notices most.
- **Squash and stretch.** Mass deforms under acceleration. Stretch on the fast part of the arc,
  squash on the contact: **x/z +10–15%, y −15–20% over 0.15–0.2 s**, then release. Volume roughly
  preserved — a squash that only flattens reads as a bug, not as weight.
- **Follow-through and overlap.** The body arrives; the ears, tail, cloth and hair arrive *after*.
  Lag secondary parts behind the main clock by **~0.05–0.15 s (≈1 rad of gait phase)** and let them
  overshoot before settling. `#aaa-anim-3d` says it exactly: the lag is where the life is.
- **Arcs.** Nothing alive travels in a straight line. Hands, feet, heads and projectiles swing on
  curves; a limb that slides linearly between two poses reads mechanical even at the right speed.
  Two-axis motion (sin on one, cos on the other, phase-offset) is an arc for free.
- **Ease curves.** The shape of motion in time, from `builtin/easing`: `easeOutQuad` for anything
  the player triggered (instant, then settle), `easeInOutCubic` for cameras and heavy bodies,
  `easeOutBack` for pop-in and cartoon snap. Linear is for conveyor belts and nothing else.
- **Weight.** Weight is *timing plus overshoot*, not size. Heavy: slow anticipation, fast fall, hard
  contact, almost no overshoot, long settle. Light: quick anticipation, floaty apex, big overshoot,
  short settle. Same rig, same amplitudes — two different creatures.

### Amplitude and timing are SEPARATE dials

The most useful habit in this whole document. Every motion gets two numbers, never one:

```js
const amp  = data.hopAltura;     // HOW FAR   — metres, degrees, pixels
const rate = data.hopRitmo;      // HOW FAST  — cycles per second
phase += dt * rate;
y = Math.abs(Math.sin(phase)) * amp;
```

- "It looks wrong" is almost always **timing**; "it looks weak" is almost always **amplitude**.
- Fixing feel by scaling one knob that does both is why a gait ends up either frantic or dead.
- Both dials live in the **data row**, never in the code: species, weapon, weight class and mood
  are amplitude/timing pairs. The second creature is a row (`#modo-ultra-stronger`, the second of
  anything).
- Tune amplitude on a still; tune timing on a `view_live_scene { burst: { frames: 4-6 } }`. A
  single frame cannot judge rhythm — a burst is the animator's playback.

---

## 2. Medium — 3D GLB clips + mixer channels

Rigged humanoids and creatures that must breathe. `#aaa-anim-3d`'s GLB section owns the contract;
the animator's part:

- List **every** clip in the URL (`model.glb?animations=Idle,Walk,Run,Jump,Attack`) — a clip not
  named there does not exist at runtime.
- Locomotion rides `updateChannel` with a weight driven by **real velocity**, not by which key is
  down: the blend is what kills the marching-in-place read.
- Clips are the base layer, not the whole animation. Layer code on top for what a clip can never
  know: landing squash, lean-into-turn, breathing scale, recoil, head-look at a target. A "fully
  animated" GLB with no coded layer still reads canned.
- Cross-fade, never cut, between locomotion states (**~0.12–0.2 s**); cut only on an impact frame,
  where the cut IS the impact.
- Root motion vs code motion: pick one owner per axis. Both writing y is a jitter bug wearing an
  animation costume.

## 3. Medium — code-driven procedural rigs (no clips at all)

The genre this game is built on: `scripts/animal-body.js` + `scripts/lib/data/animals.json` —
bodies as **data-driven parts**, gaits as math, zero authored clips. `#aaa-anim-3d` carries the
part-table shape, the pivot rule and the measured gait constants; the animator's craft on top:

- **Part hierarchy is the rig.** Parent thigh→shin→foot, shoulder→arm→hand, root→head→ear. A pose
  is one local rotation per part, written per frame; the hierarchy makes an arc out of two sines.
  `pivot: "top"` at the hip/shoulder — rotating a box about its center is the classic broken-limb
  read.
- **One phase clock per body, everything hangs off it.** `phase += dt * (base + speed * mult)`.
  Legs read the clock, ears read it lagged, tail reads it lagged further, the bob reads its double.
  Two independent clocks on one creature desynchronise within seconds and the body stops reading as
  one animal.
- **Per-part pose memory.** Never write a target pose straight onto a part: keep the part's current
  angle and ease toward the target, frame-rate correct —
  `cur += (target - cur) * (1 - Math.exp(-k * dt))`, k 8–14. This is what gives free
  follow-through, free overshoot damping, and a gait that doesn't snap when the state flips
  (walk→hop, ground→air). Pose memory lives in plain script variables, never in replicated state.
- **State transitions are poses, not switches.** Leaving the ground is a *one-time* splay-and-stretch
  pose; airborne is body pitch tracking vertical velocity (clamp ±16°); landing is the squash then
  release. Each of the three has its own amplitude/timing pair in the data row.
- **Idle is write-free between twitches.** An ear flick or tail swish every 3–8 s, and stillness in
  between. The stillness is what makes the twitch read — and it's also what keeps 30 animals off the
  frame budget.
- Every constant that differs between creatures (gait name, hop height, bob amp, ear lag, limb
  rate) is a **column in the data table**. Adding a species must never mean editing the animator.

## 4. Medium — 2D sprite sheets

`#aaa-sprites-2d` owns sheet production, naming and the 2.5D grounding rules. The one law worth
repeating because breaking it is invisible until a slow client shows up:

- **Sprite animation goes through the mixer, and ONLY the mixer.** Frame sequences as channels,
  blended and speed-driven like 3D clips. Hand-flipping texture params per tick fights
  replication, skips interpolation, and stutters on every weak device — including this room's
  CPU-leaning creator client.
- Cadence from real velocity, never a fixed timer: a fixed timer slides the feet the moment speed
  changes.
- Idle gets its own 2–3 frame breath. A frozen character reads dead in one second flat.
- Impacts are transform tweens and flashes on the sprite object (`squash`, `flash`), not new art.

## 5. Pixel-art frame discipline

Pixel animation is not "3D with fewer frames" — it is a different craft with harder limits:

- **Few frames, strong poses.** 4 frames for a walk, 6–8 for a run, 2–3 for an idle breath, 3 for
  an attack (anticipate / strike / recover). More frames do not read better; clearer extremes do.
- **Hold the extremes.** Give the anticipation pose and the contact pose **2× the display time** of
  the in-betweens. Even spacing is what makes a pixel cycle look like a slideshow.
- **Silhouette per frame.** Each frame must be readable as a black shape. If two frames have the
  same silhouette, one of them is wasted.
- **One pixel density everywhere** (same texels-per-metre), and snap positions to the pixel grid at
  render scale 1 — sub-pixel drift shimmers, and shimmer reads as low quality faster than any
  missing frame.
- Sub-pixel *motion* is the exception that always looks wrong: move by whole texels, or accept the
  crawl.

## 6. 1D — motion on one axis, same grammar

Bars, doors, elevators, lane-runner dodges, HUD counters, a camera dolly. One axis, and every
principle above still applies:

- The bar **overshoots** its new value and settles (`easeOutBack`, ~1.1× overshoot). A bar that
  snaps to the number tells the player nothing happened.
- The door **anticipates** (a 0.08 s tick against the hinge), swings on an ease, and **follows
  through** past its stop before settling.
- A counter that must feel earned counts *up* over 0.3–0.5 s with the pitch stepping under it
  (`#aaa-sound`).
- Lane motion is `easeOutQuad` per lane change with a body roll into the direction — the roll is
  the arc, on a rig with no arcs available.

---

## The animator's pass (and the disqualifier)

1. Does the motion **anticipate**? Name the frames.
2. Does anything **follow through** after the body stops — ear, tail, cloth, camera, bar?
3. Are the paths **arcs**, or straight lines between poses?
4. Are **amplitude and timing** separate numbers, both living in a data row?
5. Does it read on a `burst` (4–6 frames), not just on a still?
6. Does the contact have a **squash and an impact** (`#aaa-impact`), or does the motion just stop?
7. Is idle alive (breath / twitch) and write-free between twitches?
8. Does variant #2 cost a row, or a code fork?

**Disqualifier: motion that never anticipates and never follows through is not done.** It can be at
the right speed, the right distance, and on the right axis, and it is still a value changing over
time — not animation.