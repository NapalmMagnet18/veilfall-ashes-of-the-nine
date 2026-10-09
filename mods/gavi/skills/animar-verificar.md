---
name: Animate Verify
description: The audit that turns an animation pass into a receipt — the 6-frame burst with its span matched to one cycle, why two identical frames means nothing is running, judging from the real camera distance instead of up close, the peak-degree amplitude audit, the exact diagnostic codes to grep, and notifyDm sensors that keep reporting while nobody is watching.
---

# Gavi — verify

animation is the one part of a game that **cannot be read in the code**. a correct file
and a statue are the same text. bad animation throws nothing, logs nothing, and passes
review. so nothing is done without an eye on it in motion.

## route in 10 seconds

| the situation | do this |
| --- | --- |
| about to say a pass is finished | 6-frame burst, span = ONE cycle, camera at 5-8 m (§1, §2) |
| two burst frames look identical | either nothing is running, or your span aliased the cycle. check the span first (§2) |
| the burst looks fine but you're unsure | you judged the wrong state. read `state.velocity` — a standing character never shows a run (§1) |
| GLB clip does nothing | `getLogs()` for `model-clip-not-found` — it prints the clips that DO exist (§5) |
| sprite holds one frame | `sprite-atlas-missing` = still cooking, retried every 30 s. not a bug (§5) |
| the world stutters since the creature landed | `per-tick StateDeltas budget exceeded` in the log (§5) |
| the state you need never triggers on demand | notifyDm sensor on the beat, then read it later (§6) |
| they said "nope" with no reason | the ladder in §7. amplitude first, 4 out of 5 |
| you want the whole game swept, not one clip | `gavi#testar-tudo` |
| about to compare two passes | same camera dict, same span, same frames, ONE number changed (§2.1) |
| "does it slide?" answered by eye | measure it — arithmetic for a GLB, world positions for a code rig (§2.2) |
| tempted to ship on one beautiful still | the eight things a still can never prove (§3.1) |

## 1 — the loop, in order

1. **where is it, and what is it doing?** `api.getPlayers()` for the real position, and
   read `state.velocity` before you frame anything. a character standing still cannot
   demonstrate a run, however good the burst looks.
2. **burst.** `view_live_scene` with `burst: { frames: 6, spanSeconds: <one cycle> }`,
   `camera` at the **real play distance** — 5-8 m third person, 12-20 m top-down. never
   glued to the body.
3. **the proof.** two consecutive frames with the same pose = it is not running (§2's
   caveat applies).
4. **the degree audit** for what the burst can't trigger — §4.
5. **rest.** with every clip at weight 0, the body returns EXACTLY to rest. still
   crooked = the blend is leaking against the last value.
6. **ground.** no limb through the terrain in any frame. `colliders: true` on the shot
   composites the collider wireframes and returns a live-vs-spec drift read.
7. **frequency.** no sine above ~1/4 of the write rate — 2.5 Hz at 10 Hz writes.

only then does it get to become a sentence.

## 2 — the span arithmetic, which is where most audits lie to themselves

`burst` takes **2-6 frames** over **0.25-3 s** and composites them into one image on a
deterministic tick grid — two bursts of the same span compare frame for frame.

**match the span to one cycle.** the failure: a 2 s span on a 0.5 s walk cycle samples
every 333 ms, which is **0.67 of a cycle per frame**. the phases land almost on top of
each other and the "two identical frames" you are staring at is the tool aliasing, not
a statue.

| what you're judging | spanSeconds |
| --- | --- |
| walk cycle 0.5-0.7 s | 0.6 |
| run cycle 0.35-0.45 s | 0.4 |
| idle / breathing 1 s | 1.0 |
| attack one-shot 0.25 s | 0.3 |
| a landing, a hit | 0.3, and take a second burst 0.4 s later |

6 frames over a 0.6 s span = 100 ms apart = 6 samples of one cycle. that reads rhythm,
foot contact and follow-through. anything longer reads noise.

## 2.1 — the filmstrip at playing distance, and the A/B protocol

the dict, written out, so it is copy-pasteable. third person, ~6 m back, eye height, one
walk cycle:

```js
view_live_scene({
  camera: { position: [x + 4.2, y + 1.9, z + 4.2], target: [x, y + 1.0, z] }, // 5.9 m out
  burst:  { frames: 6, spanSeconds: 0.6 },
});
```

**the A/B protocol.** two bursts land on a deterministic tick grid, so they compare frame
for frame — but only if span, frame count and camera are IDENTICAL.

1. capture take A.
2. change **exactly one number**.
3. capture take B with the same dict, byte for byte.
4. compare frame 3 against frame 3 (mid-cycle is where spacing shows) and the contact
   frame's foot position.

change two numbers between takes and the comparison is unreadable — two captures spent,
nothing learned. and run the silhouette check (`gavi#animar-doutrina` §1.1) on the strip
you already have, at thumbnail size.

**measuring amplitude in the captured image.** the frame is H pixels tall and the visible
world height at distance d is `1.155 · d` metres (§1's derivation), so

> **1 image pixel = 1.155 · d / H metres** — at d = 6 m in a 512 px frame, 1.35 cm.

the player's device renders ~594 rows, so the 5-pixel floor becomes **4.3 px in a 512 px
capture** at the same distance. a limb whose tip travels less than that across the strip is
not animated — and now it is a number, not an opinion.

## 2.2 — foot slide, measured

"it looks fine" is how skating ships. slide is arithmetic on one side and a probe on the
other.

**GLB rigs — arithmetic, because there is no bone-transform read.** `getBoneNames()` gives
names and `getSocket` gives model sockets; neither gives a foot bone's world position. so
use the baked speeds — walk clips are authored at **2.5 m/s**, run at **6 m/s**:

> **slip fraction = |1 − (baked × speed) / actual|**

moving at 6 m/s on a walk clip at `speed: 1` → `|1 − 2.5/6|` = **0.58**: 58% of every
stride is skate, 81 cm lost on a 1.4 m stride. with `speed: sp / 2.5` the fraction is zero
by construction and what is left is crossfade and turn residue. accept under 5%.

**code rigs — the feet ARE entities, so measure them.** a planted foot must not move in
world space while it is planted:

```js
// temporary probe inside the animator. delete it after the reading.
const f = api.getObject(b.ids.footL);          // top-level feetPosition is world-space
const p = b.probe || (b.probe = { last: null, worst: 0 });
if (p.last && stance) {                        // stance = grounded + this leg's contact half
  const slip = Math.hypot(f.feetPosition.x - p.last.x, f.feetPosition.z - p.last.z);
  if (slip > p.worst) {
    p.worst = slip;
    api.notifyDm(`foot slip ${(slip * 100).toFixed(1)} cm in one write at ${sp.toFixed(1)} m/s`);
  }
}
p.last = { x: f.feetPosition.x, z: f.feetPosition.z };
```

thresholds at 10 Hz writes: under **2 cm per write** (0.2 m/s) reads clean, **5 cm per
write** reads as ice. the honest target is total slip under **5% of the stride** per cycle.
the cause is almost always `STRIDE` not matching the real gait —
`gavi#animar-esqueleto-codigo` §3.

## 3 — instruments, and what each one actually proves

| instrument | proves | does NOT prove |
| --- | --- | --- |
| `view_live_scene` + `burst` | motion in the real game, rhythm, foot slide | poses the current state never triggers |
| `view_live_scene` + `camera` | silhouette, an exploded joint, ground contact | rhythm — one still cannot |
| `view_live_scene` + `colliders: true` | collider vs visual alignment, live-vs-spec drift | anything about timing |
| `preview_object` (+ `frames`) | geometry, materials, scripted params | behaviour — **no behaviors run in the booth**, so nothing animates |
| `identify_object` | what that pixel actually is, world bounds, parent | how it moves |
| `getLogs()` | missing clips, static clips, upload budget, script errors | weak animation. it never throws |
| reading the code | contracts, names, arithmetic | absolutely nothing visual |

**`preview_object` is not an animation instrument.** it renders spec values with no
behaviors — a perfect frame there says nothing about a live pass.

## 3.1 — the eight things a still can never prove

name them, because every one has already shipped as "looks great" from a single frame.

| what a still cannot show | what proves it |
| --- | --- |
| 1. rhythm and cycle length | burst, span = ONE cycle (§2) |
| 2. a blend pop — a weight that jumps, a layer that fades wrong | two bursts at span 0.3 across the transition |
| 3. foot slide | §2.2. never the eye |
| 4. whether the overshoot exists at all | burst over the action's OWN length; the overshoot is 1-2 frames, so a still lands on it or misses it |
| 5. a moving hold vs a dead one | two bursts 0.4 s apart on the same held pose — identical across both = dead |
| 6. the phase between limbs | burst. a still shows one instant of a relationship |
| 7. stair-stepping from a sine over the write rate | burst at span 0.3, 6 frames, plus the frequency arithmetic (§1) |
| 8. the return to rest | a still shows the rest pose; only the strip shows it arriving without drifting past |

and the two things a burst cannot prove either: **a state the world never enters** (drive it,
or wire a `notifyDm` sensor — §6), and **what a phone renders** (`renderScale` halves the
rows, so the floor is `gavi#animar-doutrina` §1's, not the desktop's).

## 4 — the amplitude audit, in degrees

for what the burst can't reach (the run cycle while the player stands still), run the
pose function over a cycle and print peak-to-peak travel per joint. the check is one
number per joint against `gavi#animar-doutrina` §1:

```js
// run_script, readOnly — no world writes
const CLIPS = { /* the same pose fns, or their numbers by hand */ };
const peaks = {};
for (let i = 0; i < 60; i++) {
  const pose = CLIPS.stride.pose({ f: i / 60, m: 1, t: i / 30, sp: 6, airborne: false });
  for (const j in pose) {
    const p = peaks[j] || (peaks[j] = { min: 1e9, max: -1e9 });
    const v = pose[j].pitch || 0;
    if (v < p.min) p.min = v;
    if (v > p.max) p.max = v;
  }
}
return Object.entries(peaks).map(([j, p]) => `${j}: ${(p.max - p.min).toFixed(1)}°`);
```

**at 6 m, under 8° of travel on a 0.4 m limb is 5 rendered pixels — not animated.** aim
15-40°. the derivation is in `gavi#animar-doutrina` §1.

## 5 — the diagnostic codes, verbatim

`getLogs()` is the room's in-memory log. **a restart empties it**, so "the log is clean"
right after a restart proves nothing. what to look for:

| code / line | means | do |
| --- | --- | --- |
| `model-clip-not-found` … `holding pose. Available: …` | the clip is not in the baked file; the body sits in the bind pose (T-pose on stock avatars) | add it to `?animations=`, re-mint. the `Available:` list is the answer |
| `model-clip-not-found` … `the model's only animation` | one-clip model — every channel falls back to that clip | mint the rest; the mixer is fine |
| `model-clip-static` … `contains no motion` | the clip exists and is a still | re-mint under a longer, verb-first name |
| `model-mask-bone-not-found` … `the masked animation channel is ignored` | a `mask` names a bone the rig lacks — the WHOLE masked layer is dropped, reported once | fix the exact case against `api.getBoneNames()` (`gavi#animar-glb` §6.1) |
| `[sprite-animation] … is not a 2D storyboard clip slug` | a capital letter or space in a sprite clip name — the channel is skipped entirely | lowercase kebab (`gavi#animar-2d` §1) |
| `sprite-atlas-missing` … `haven't finished generating` | still cooking; the sprite holds its base frame, retried every 30 s | wait. do not change the URL |
| `sprite-atlas-missing` … `FAILED to generate (HTTP …)` | terminal — this exact name can never succeed | new clip name |
| `per-tick StateDeltas budget exceeded (oldest dropped first, N queued)` | upload volume; the whole world reads frozen | `updateSchedule` + threshold + one batch (`gavi#animar-esqueleto-codigo` §5) |
| `… losing to server-side writes at the server-write fence` | **two writers** racing the same components, not volume | pick one writer |

## 6 — sensors that keep reporting while nobody watches

nobody keeps generating with the page closed. what you can do is make the game report
itself, so the answer is waiting when they come back. `api.notifyDm` /
`api.notifyDmOnce` on the beats that expose animation:

```js
// heavy landings are where bad timing shows first
if (fallHeight > 6) {
  api.notifyDm(`heavy landing from ${fallHeight.toFixed(1)} m at ${sp.toFixed(1)} m/s ` +
               `— channel 'land', tick ${api.getTick()}`);
}

// once per world: the first of a thing is the one that teaches you
api.notifyDmOnce('first full 360 spin — did the ears swing wide?');

// the symptom a player can never name
if (ticksOnSameClip > api.seconds(20)) {
  api.notifyDm('20 s on one clip while state kept changing — an idle may be stuck');
}
```

worth wiring in any game with a body: the first play of each clip; a clip stuck past N
seconds; a landing over a height; death and damage (the easiest to forget to test); any
`catch` inside the animator — a swallowed error in animation becomes a silent statue.

findings worth keeping past the session go in the journal, not in a chat message —
`gavi#memoria-infinita`.

## 7 — when they say "nope, that's not it"

1. **amplitude.** double it, look again. cause in 4 of 5 cases.
2. **distance.** did you judge at 1 m while they play at 6?
3. **timing.** is everything landing on the same frame? stagger 0.05-0.12 s per layer.
4. **only then** plumbing: does the clip fire, does the weight reach 1, does the batch
   go out.

and don't fix it in words. fix it, burst it, show it.

## 8 — honest vocabulary

- **"cooking"** — a conjured asset still generating. it is not there yet, and an event
  firing is not a sighting.
- **"it's there, you can see it"** — only ever after a frame with the thing in it.
- **"no image came back"** — say exactly that. never describe what the frame would have
  shown.
- **"fixed"** — only after the person playing says so.

## what goes wrong

- **span aliasing read as a statue.** TELL: 6 frames, all nearly identical, but the code
  is clearly running. FIX: span 2 s on a 0.5 s cycle samples 0.67 cycles per frame. set
  the span to one cycle (§2).
- **auditing the wrong state.** TELL: you burst a run and the character was standing.
  FIX: read `state.velocity` first; drive the state, or use a notifyDm sensor (§6).
- **judging in the booth.** TELL: `preview_object` looks perfect, the live game is
  frozen. FIX: no behaviors run in the booth. burst the live scene.
- **"clean logs, so it works".** TELL: green log, statue on screen. FIX: bad animation
  never throws — and a restart wipes the log. the audit is visual plus §4's degrees.
- **framing too close.** TELL: subtle, elegant, invisible in play. FIX: camera at the
  real distance. under 5 px of travel does not exist.
- **one burst, many verbs.** TELL: "animated everything, then looked". FIX: one verb,
  one burst, next verb. a compound failure has no single cause to read.
- **two takes that cannot be compared.** TELL: A and B look different and you cannot say
  which change did it. FIX: one number per take, identical dicts (§2.1).
- **slide judged by eye.** TELL: "looks fine" in the strip, and players say it skates. FIX:
  measure it — the arithmetic or the probe (§2.2).
- **the still that proved nothing.** TELL: one beautiful frame shipped, and the live motion
  is a statue, a pop, or a dead hold. FIX: §3.1's list — each item names its instrument.