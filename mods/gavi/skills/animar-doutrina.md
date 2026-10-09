---
name: Animation Doctrine
description: The shared law under every animation pipe — the pixel arithmetic that sets the minimum amplitude, silhouette before detail, contact and weight, the five cartoon principles that pay rent in a live engine, and secondary motion last. Load this before animar-glb, animar-esqueleto-codigo or animar-2d; it holds the numbers the three of them share.
---

# Gavi — doctrine

the law under all three pipes. no pipe-specific calls live here — the router is
`gavi#animar-qualquer-estilo`, the proof is `gavi#animar-verificar`.

## route in 10 seconds

| the situation | do this |
| --- | --- |
| about to write the first degree of rotation | measure distance, renderScale, write rate (§1). the three give you the amplitude floor |
| "it looks subtle and nice in the preview" | you judged at 1 m. at 6 m, 8° of limb travel is 5 pixels. §1's table |
| the pass got rejected, no reason given | double the amplitude before any other theory. 4 of 5 times that's it (§5) |
| motion reads but feels like software | you skipped anticipation and overshoot. 0.1-0.2 s before, 12-18% past the target after (§3) |
| everything arrives on the same frame | stagger layers 0.05-0.12 s. that is the whole difference between puppet and creature (§3) |
| the creature is alive but reads as a metronome | two mirrored parts on the same frequency. 0.73 Hz / 0.61 Hz and different phases (§4) |
| exaggerating and limbs sink into the floor | you multiplied metres. gain multiplies ANGLES only (§2) |
| the clip has no length yet — how many frames IS a light attack | §3.1's table, at 24 and 30 fps. light 12-18, heavy 24-32, hit 8-12, death 30-45 |
| it plays, it's correct, and it still feels like software | you have three beats, not four. the overshoot is missing (§3.1) |
| smooth, correct, mechanical, and nobody can say why | ease is SPACING, not a curve name (§3.2) |
| a pose "holds" and the game reads as crashed | nothing in a body is still past 8 frames. moving holds (§3.2) |
| the landing has no impact, the jump reads floaty | contact frame, 0.85-0.92 compression, overshoot, settle (§3.3) |
| judging whether a pose reads at all | shrink the frame to 128 px and name the action from the black shape (§1.1) |
| a wiggle on an ear, antenna or finger nobody has ever seen | a 0.1 m bone needs 33° at 6 m. move the motion up the chain (§1.1) |

## 1 — LAW ZERO: what you can't see from where they play is not animated

three numbers before the first degree:

1. **reading distance** — metres from camera to character in the real game, not the
   preview. third person sits at **5-8 m**. top-down/RTS **12-20 m**.
2. **render scale** — weak clients draw at `renderScale` 0.5-0.7. half the rows, half
   the detail.
3. **write rate** — this game's sim tick is **30 Hz** (measured: `api.seconds(1)`
   returns 30, `api.getDeltaTime()` returns 0.03). `updateSchedule = { every: 3 }`
   is therefore **10 writes/s**.

### the arithmetic, so the table stops being folklore

vertical fov 60°, a 1080-row device, `renderScale` 0.55 → **594 rendered rows**.
visible world height at distance d is `2·d·tan(30°) = 1.155·d`. so:

> **one rendered pixel ≈ d / 514 metres.**
> at 2 m: 0.39 cm. at 6 m: **1.17 cm**. at 15 m: 2.9 cm.

a limb of length L rotating θ degrees peak-to-peak sweeps its tip `L · θ_rad`. for a
0.4 m upper leg or forearm on a 1.8 m body, at 6 m:

> **1 rendered pixel ≈ 1.7 degrees.**

| distance | amplitude that READS | in pixels of tip travel | vanishes |
| --- | --- | --- | --- |
| 2 m (portrait, cutscene) | 3-8° | 5-14 px | < 2° (3 px) |
| 6 m (third person) | **15-40°** | **9-24 px** | < 8° (5 px) |
| 15 m+ (RTS, top-down) | 40-90° + silhouette displacement | 10-22 px | any pure rotation under 40° |

**5 px of total travel is the floor.** below that, on a body that is itself moving
across the screen, the eye reads nothing. 10 px reads. 24 px reads at a glance. a
0.006 m breath and a 1.1° sway are animation that does not exist at 6 metres — that
is the classic failure, and it is arithmetic, not taste.

**frequency ceiling: ~1/4 of the write rate.** at 10 Hz that is **2.5 Hz** — four
samples per cycle, the minimum to land a peak and a trough. above it the peaks fall
wherever the phase happens to sit and the amplitude visibly jitters write to write.
that reads as stair-stepping, never as a tremble.

## 1.1 — the silhouette test, and the minimum readable rotation

two instruments the table above leaves implicit.

**the 128 px test.** shrink the frame you captured to **128 px tall** — a thumbnail, or
just lean back — and name the action from the black shape alone. if you can't, the pose
is not a pose, and no amount of joint detail rescues it: the eye reads outline first and
surface second. professionals check every key pose as a silhouette before they touch a
breakdown. what fails it: a limb inside the torso outline, two limbs overlapping at the
same angle, a head with no neck gap, a weapon parallel to the arm holding it.

**the minimum readable rotation, per bone.** amplitude is not a property of the joint,
it is a property of the joint's LENGTH. from §1's `d / 514` metres per pixel, 5 px of
tip travel on a bone of length L at distance d needs

> **θ_min ≈ 0.56 · d / L degrees**

| the bone (joint → visible tip) | L | θ_min at 6 m | at 15 m |
| --- | --- | --- | --- |
| ear, antenna, tail tip | 0.10 m | **33°** | 84° |
| head (chin from the neck) | 0.15 m | 22° | 56° |
| forearm (hand from the elbow) | 0.28 m | 12° | 30° |
| upper arm (elbow from the shoulder) | 0.30 m | 11° | 28° |
| thigh (knee from the hip) | 0.45 m | 7.4° | 19° |
| whole arm (hand from the shoulder) | 0.58 m | 5.8° | 14° |
| torso lean (head from the hips) | 0.75 m | 4.5° | 11° |

read the top row twice: a 0.1 m ear needs **33°** of its own to read at 6 m. so a 9° ear
wiggle is not the animation — it is texture on top of a head that is already moving.
**a small bone reads as a delta against a moving parent, never on its own.** when the
angle you'd need is absurd, move the motion up the chain: swing the head, let the ear
follow.

and the sentence that ends the argument: **a motion nobody can see at playing distance
is not an animation.** it is a cost with no image.

## 2 — global gain: exaggerate the angle, never the metre

one constant, applied at blend time. this is the cheapest fix in animation and the
one that answers "make it bigger":

```js
// scripts/lib/animar-blend.js
const GAIN = 1.35; // multiplies ANGLES only

function blend(acc, joint, quantum, weight, gain) {
  const target = acc[joint] || (acc[joint] = { pitch: 0, yaw: 0, roll: 0, dy: 0 });
  for (const k in quantum) {
    // dy / y are METRES: exaggerating them drives the body through the floor
    const scale = (k === 'dy' || k === 'y') ? weight : weight * gain;
    target[k] += quantum[k] * scale;
  }
  return acc;
}

module.exports = { GAIN, blend };
```

an exaggerated angle reads as comic. an exaggerated metre reads as a bug: 0.06 m of
hip bob at gain 1.35 is 0.081 m and fine; the same gain on a 0.5 m jump crouch puts
the feet 0.175 m under the terrain.

## 3 — the five principles that pay rent, with their numbers

- **silhouette first.** the eye reads outline before surface. if the pose is
  unreadable as a black shape, no amount of joint detail saves it. test it by looking
  at the burst at 6 m and asking what the shape is doing — `gavi#animar-verificar`.
- **anticipation** — the body goes the opposite way before it goes. **0.1-0.2 s**
  (3-6 ticks at 30 Hz). without it, motion reads as teleporting. in a sprite sheet it
  is exactly **1 frame**, and it is not optional.
- **contact and weight** — the frame where something lands is the frame that carries
  the weight. overshoot the target by **12-18%** and come back; a limb that stops
  exactly on the mark reads as software. spend the impact on hitstop (0.05-0.09 s),
  `api.screenShake`, and a squash — the contact-moment craft is the engine's
  `game-feel` skill.
- **arcs** — nothing travels in a straight line. a straight interpolation gets curved
  by hand: add a perpendicular sine at **8-15%** of the travel length.
- **squash and stretch** — long silhouette on the rise, flat on impact. it is scale,
  so it is nearly free, and it is the first thing the eye reads from 15 m.

**secondary motion last.** ears, tails, capes, hair, antennae, a lantern on a belt
arrive **0.05-0.12 s after** the body that carries them, per layer. build the primary
motion, prove it in a burst, then hang the secondaries on it. built the other way
round, you spend an hour tuning a tail on a walk cycle that was going to change.

on a rigged model the engine already owns that layer: `properties.jiggle` springs
name-matched dangly chains (`tail`, `ear`, `hair`, `cape`) after animation and IK.
`jiggle: true` is tuned; the knobs are 0..1 — `amount` 0.5, `bounce` 0.5,
`gravity` 0.3. it is purely visual (never physics) and it is excited by **incoming
movement**: on a motionless object it does nothing and logs nothing.

## 3.1 — timing in frames: the lengths a professional actually uses

frames are the working unit; seconds are the report. two grids matter — **24 fps** is the
grid the craft is written on, **30 Hz** is this engine's tick and the default `fps` of an
authored function clip. carry the COUNT and convert once.

| clip | frames | at 24 fps | at 30 fps | anticipation |
| --- | --- | --- | --- | --- |
| idle, looping | **40-80** | 1.7-3.3 s | 1.3-2.7 s | — |
| walk cycle | **24** | 1.0 s | 0.80 s | — |
| run cycle | **16** | 0.67 s | 0.53 s | — |
| light attack | **12-18** | 0.50-0.75 s | 0.40-0.60 s | **3-5** frames |
| heavy attack | **24-32** | 1.0-1.33 s | 0.80-1.07 s | **8-10** frames |
| hit reaction | **8-12** | 0.33-0.50 s | 0.27-0.40 s | none — it is imposed on you |
| death | **30-45** | 1.25-1.88 s | 1.0-1.5 s | 2-4 (the stagger before the fall) |

the walk's four keys sit **6 frames apart**: `1` contact · `7` down · `13` pass · `19`
up, and the next contact lands back on 1. need eight keys instead of four? the breakdowns
go on 4 / 10 / 16 / 22. the run's 16 carries the same four plus the beat that makes it a
run and not a fast walk: **both feet off the ground**, on the frame after each up.

an authored function clip is put on that grid explicitly — `fps` and `duration` are
properties of the function and the engine samples `duration × fps` keys, once:

```js
walkCycle.fps = 24;        // author on the 24-frame grid
walkCycle.duration = 1.0;  // 24 frames ÷ 24 fps — the engine bakes exactly 24 keys
```

### the four beats, and the frame split of each

every action is **anticipation → action → overshoot → settle**, and the shares hold
across lengths:

| beat | share | 16-frame light attack | 28-frame heavy | 10-frame hit |
| --- | --- | --- | --- | --- |
| anticipation | ~25% | 4 | 9 | 0-1 |
| action | ~15% | 2-3 | 4 | 2 |
| overshoot | ~12% | 2 | 3 | 2 |
| settle | ~48% | 7 | 12 | 5-6 |

**the action is the shortest beat.** amateurs spend their frames there — on the swing
itself — and starve the two beats that carry it. the swing is two frames and a smear;
the wind-up and the recovery are the animation.

### why the overshoot is the frame amateurs delete

as a still it looks broken: the limb is past the target, the pose reads wrong, so it gets
"cleaned up". delete it and every action ends exactly on its mark — which is the
definition of a dead stop, and the reason correct code reads as software. keep it:
**12-18% past the target** (§3), held **1-2 frames**, then home across the settle. it is
two frames out of sixteen and it is the whole difference between a puppet and a body.

## 3.2 — spacing and arcs: where "robotic" actually comes from

**ease is spacing, not a curve name.** the eye reads the DISTANCE between successive
positions; a curve is only one way of generating those distances. so an even-spaced move
is mechanical no matter what produced it, and the fix is redistribution, never a fancier
easing name.

travel per frame, as a % of the whole, over 8 frames:

| shape | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ease-out — leaves fast, lands soft | 30 | 22 | 16 | 12 | 8 | 6 | 4 | 2 |
| ease-in — builds, then arrives hard | 2 | 4 | 6 | 8 | 12 | 16 | 22 | 30 |
| ease-in-out — a travelling body | 4 | 9 | 16 | 21 | 21 | 16 | 9 | 4 |
| even — **the machine spacing** | 12.5 | 12.5 | 12.5 | 12.5 | 12.5 | 12.5 | 12.5 | 12.5 |

even spacing is not a mistake everywhere: a piston, a lift, a conveyor, a clock hand, a
robot arm SHOULD be evenly spaced — that is the one place it reads as character.

**arcs.** §3 gives the number (a perpendicular offset at 8-15% of the travel); this is
where it goes. the apex of the arc sits at **60-70% of the travel**, not at the middle —
that is what makes a hand feel like it swings instead of bulging. and the arc belongs to
the TIP: curve the hand while the shoulder travels straight and you get a bulge, not an
arc. no joint travels a straight line except the deliberate mechanical one.

**the favouring pose.** inside every pose, one side leads:

- shoulders and hips counter-rotate **5-12°**, in opposite directions
- the head favours whatever it cares about by **8-15°** of yaw
- weight sits on ONE foot — **60/40**, never 50/50

```js
hips:  { yaw:  6 },   // a symmetric pose is a mannequin;
torso: { yaw: -6 },   // 6° of counter-rotation plus 9° of head favour
neck:  { yaw:  9 },   // is a character, in three lines
```

**moving holds.** nothing in a body is perfectly still for more than **8 frames** (0.33 s
at 24, 0.27 s at 30). past that the eye stops reading "held" and starts reading
"crashed" — players report it as lag. a real hold keeps **10-20%** of the motion alive:
the hips drift 1-2 cm, the head continues 2-3°, the breath keeps going. the engine has
one trap built for exactly this: a `loop: 'once'` clip **clamps on its last pose** and
sits there, dead. a held end pose needs a low-weight breathing loop underneath it, or the
character freezes at the moment you wanted it to look poised.

## 3.3 — weight: the one thing amplitude cannot buy

a big motion with no compression reads as a puppet on a stick. weight is three things in
a fixed order: **contact, compression, settle.**

the landing, frame by frame at 30 Hz — scale only, so it costs nothing:

| frame | scale.y | scale.x / scale.z | what it is |
| --- | --- | --- | --- |
| 0 | **0.85-0.92** | 1.05-1.08 | contact. the frame that carries the weight |
| 1-2 | hold it | hold it | **2-3 frames** of compression. skip it and there is no weight |
| 3-4 | **1.04** | 0.98 | the overshoot back up — the legs straightening past neutral |
| 5-9 | → 1.00 | → 1.00 | settle: 4-6 frames of decreasing residual |

eight to twelve frames end to end, 0.27-0.40 s. grade it: a step down off a kerb is 0.95
for two frames with no overshoot; a 6 m fall is 0.85, the whole sequence, plus hitstop
0.05-0.09 s and a shake. for props and one-shot impacts the engine already springs this —
`api.squash(id, { axis: 'y', amount: 0.12, duration: 0.18 })` compresses and returns on
its own; write the scale by hand only when you need the exact frame split.

**the hips lead and the extremities lag.** each layer trails the one above it by **2-4
frames** (67-133 ms at 30 Hz — the frame form of §3's 0.05-0.12 s per layer), cumulative
down the chain:

| layer | lag behind the hips |
| --- | --- |
| hips | 0 — they start the motion, always |
| torso | +2 frames |
| shoulders, head | +4 |
| hands, feet | +6 |
| hair, cape, tail tip | +8-10 |

a body where everything arrives on the same frame is a puppet with one string, and it is
the most common tell in an otherwise correct pass. the settle obeys the same order: the
hips stop first, the tail tip three to six frames later.

## 4 — asymmetry: the principle Gavi added

two ears on the same frequency is a metronome. put **0.73 Hz** on one and **0.61 Hz**
on the other, with a phase offset of ~1.7 rad, and the creature is alive for free:

```js
// inside a pose function — t is seconds of game time, degrees out
earL: { pitch: 9 * Math.sin(t * 0.73) },
earR: { pitch: 9 * Math.sin(t * 0.61 + 1.7) },
```

the two beat against each other with a period of `1 / (0.73 - 0.61)` = **8.3 s**, so
the pattern never visibly repeats inside a look. pick any pair that isn't a
small-integer ratio.

## 5 — when they say "nope, that's not it"

a rejected animation pass almost never wants precision. in order:

1. **amplitude.** double it. look again. cause in 4 of 5 cases.
2. **distance.** did you judge it at 1 m while they play at 6?
3. **timing.** is everything landing on the same frame? stagger 0.05-0.12 s.
4. **only then** the plumbing: does the clip fire, does the weight reach 1, does the
   batch go out.

## 6 — what Gavi refuses

- animation that only reads in the preview.
- saying "done" without a burst — `gavi#animar-verificar`.
- subtle refinement when the answer was "try again". the answer is bigger, not finer.
- a bone on something that makes no decisions. smoke and sparks are `fx`; a flag is a
  material. bones cost replication, sway costs zero — `gavi#animar-qualquer-estilo`.
- when the ask is "do this properly, all of it": that is the fusion mode,
  `gavi#uma-so`. this file is still the law underneath it.

## what goes wrong

- **the statue that passes review.** TELL: the code is correct, `getLogs()` is clean,
  and every burst frame is identical. bad animation never throws. FIX: the amplitude
  audit in §1 — peak travel per joint in degrees, against the table.
- **judged up close.** TELL: "it looked great in `preview_object`" and the player
  calls it frozen. the booth runs no behaviors and frames tight. FIX: burst from the
  real camera distance, 5-8 m.
- **limbs through the floor after an exaggeration pass.** TELL: feet disappear into
  terrain on the down beat. FIX: gain multiplied a metre. §2 — angles only.
- **stair-stepping instead of a tremble.** TELL: a fast wobble that flickers and
  changes size between writes. FIX: some sine went past 2.5 Hz at 10 Hz writes. drop
  the frequency, or raise the cadence to `every: 2` (15 Hz, ceiling 3.5 Hz).
- **the metronome.** TELL: symmetric parts moving in lockstep; the creature reads
  mechanical. FIX: §4, two frequencies that aren't a simple ratio.
- **secondaries built first.** TELL: an hour on tail springs, then the walk changes
  and the tail is wrong again. FIX: primary, burst, then secondaries.
- **the dead stop.** TELL: every action ends exactly on its mark; the code is right and
  the body reads as software. FIX: the fourth beat is missing — 12-18% past, held 1-2
  frames, then home (§3.1).
- **the evenly spaced move.** TELL: smooth, correct, mechanical, and nobody can name
  why. FIX: redistribute the travel (§3.2). the curve's name is not the ease; the
  spacing is.
- **the frozen hold.** TELL: players say the game "hitched" on an emote, a taunt, a
  death pose. FIX: a dead hold past 8 frames, usually a `loop: 'once'` clamp. keep
  10-20% of the motion alive underneath it (§3.2).
- **the weightless landing.** TELL: the character touches down at the same scale it fell
  at; jumps read floaty however big the arc is. FIX: compression 2-3 frames, overshoot to
  1.04, settle (§3.3).
- **the invisible secondary.** TELL: an ear, antenna or finger detail nobody has ever
  seen. FIX: a 0.1 m bone needs 33° at 6 m — move the motion up the chain (§1.1).