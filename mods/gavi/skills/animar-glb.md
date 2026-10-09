---
name: Animate Glb
description: Rigged GLB characters through the mixer — declaring clips in the model URL, the real updateChannel/getChannel surface with blendIn defaults and additive weights, a runnable locomotion crossfade, per-bone masks for run-and-shoot layering, IK and foot grounding, and exactly what the engine does when a clip name is not in the file.
---

# Gavi — rigged GLB

the pipe when the body is **humanoid** and a rig exists. the engine skins it; you
choose which clip plays, at what weight, and when it switches. the law is
`gavi#animar-doutrina`, the proof is `gavi#animar-verificar`.

## route in 10 seconds

| the situation | do this |
| --- | --- |
| humanoid, needs to walk/run/jump | `?animations=` in the URL + the §4 locomotion behavior. done in one file |
| model stands in a T-pose, no error visible | the clip is not in the file. `getLogs()` for `model-clip-not-found` — it names the clips that ARE there (§2) |
| clip plays but the motion is generic ("attack looks like a jab") | re-mint under a MORE SPECIFIC name (`SwordSlashDiagonal`), not re-timed blends (§1) |
| run and shoot at once | two channels, `mask: { from: 'Spine' }` on the upper one. `Spine` IS the chest (§6) |
| feet slide across the ground | `speed: sp / 2.5` on walk, `sp / 6` on run. arithmetic, not animation (§4) |
| character must hold a weapon | mint the body EMPTY-handed, attach gear at `attachment: { bone: 'RightHand' }` (§9) |
| it's an npc agent with `properties.npc` | do nothing. the engine drives idle/walk/run for free — a second locomotion script fights it (§9) |
| the rig has failed twice | switch pipes. `gavi#animar-esqueleto-codigo` |
| the layer is on and the pose reads half-applied | total weight under 1 on a bone fills the remainder with the BIND pose (§6.1) |
| a second channel on the same clip does nothing | layers are keyed by CLIP + MASK, not by your channel name (§6.1) |
| IK and a masked clip on the same arm | IK wins those bones. mask the clip AWAY from the chain (§6.1) |
| the minted clip is longer or shorter than you designed | `getChannel().duration` is the truth; correct with `speed` (§6.2) |
| the clip reads too small at 6 m | the mixer has no gain. re-mint the NAME, or layer a function clip (§6.2) |

## 1 — declare the clips in the URL, all of them, in one go

```js
model: '/cdn/moodboard-lowpoly-cozy/model-humanoid-thief.glb?animations=Idle,Walk,Run,Sprint,Jump,Fall,Land,Roll,Attack,Block,Hit,Die'
```

`?animations=` is load-bearing: clips not listed are **stripped at bake time**. every
name in that list is GENERATED for this model from the name itself — the name IS the
motion prompt. so short CamelCase for stock verbs, and more specific when the motion
is particular: `SwordSlashDiagonal` beats a second `Attack`.

conjured humanoids arrive already knowing `Idle/Walk/Run/Sprint/Jump`. clips already
baked into the GLB are never overwritten; the mint fills the gaps.

and the CDN law: a filename, once served, keeps its first look forever. adding a clip
means editing the URL, and a rewording of the same name can collide back onto the old
asset. list too many rather than too few — twelve names in one mint is one cook.

## 2 — what actually happens when the clip isn't in the file

not silence, and not a throw. the engine resolves **exact name → variant → the baked
rest-pose row**, and reports on the diagnostic rail (`getLogs()`):

```
model-clip-not-found
clip "Cheer" not found on model "model-humanoid-thief.glb" — holding pose. Available: Idle, Walk, Run, Jump
```

read the three outcomes, they are different bugs:

| outcome in the message | what you see | fix |
| --- | --- | --- |
| `holding pose` | the model stands in the bind pose. on stock avatars the bind is a **T-pose** — arms straight out | the clip is missing from `?animations=`. add it, re-mint |
| `the model's only animation` | one-clip models fall back to that clip for **every** channel — idle and run look identical | mint the missing clips; nothing about the mixer is broken |
| `model-clip-static` (its own code) — `contains no motion` | the clip exists and the body freezes on one pose | the mint produced a still. re-mint with a longer, verb-first name |

the diagnostic dedupes per model+clip, so one line does not mean one occurrence.
`getLogs()` is wiped by a restart — empty logs after a restart prove nothing.

## 3 — the mixer surface, exactly

```js
api.updateChannel(name, {
  clip: 'Walk',      // GLB clip name, or a named exported function of time
  weight: 1,         // ADDITIVE, not normalized. 0 kills the layer
  speed: 1,
  loop: 'loop',      // 'once' | 'loop' | 'pingpong'
  blendIn: 0.15,     // crossfade IN, seconds. DEFAULT 0.1
  blendOut: 0.15,    // crossfade OUT. defaults to blendIn
  duration: null,    // playback expiry in seconds — clears the channel after N
  direction: 'normal',
  mask: null,        // { from: 'Spine' } or { bones: ['LeftArm','RightArm'] }
});
api.updateChannel(name, null); // remove the channel
api.getChannel(name); // -> { clip, weight, elapsed, duration, finished, progress, events }
```

**there is no `fade` field.** a spec that passes `fade: 0.06` gets ignored and the
channel crossfades at the 0.1 s default — which is exactly the "my jump feels mushy"
bug, off by 40 ms.

three laws that bite:

- **weights are additive and not normalized.** higher value dominates on shared bones.
  floor a live layer at **0.001** instead of 0 so it stays available for a crossfade.
- **re-firing `updateChannel` restarts a `loop: 'once'` channel** but not a `loop`
  channel. so per-tick locomotion weight writes are free; a per-tick one-shot write
  restarts the attack every tick and it never finishes.
- **`finished` is only true for `loop: 'once'`** once `elapsed >= duration`. on a loop
  channel it stays false forever.

## 4 — locomotion: one continuous crossfade, no `if` that swaps clips

the baked speeds are the two constants you can't guess: walk clips are authored at
**~2.5 m/s**, run at **~6 m/s**. dividing by them is what kills foot slide.

```js
// scripts/humanoid-locomotion.js — attach with api.addBehavior('player', [...])
export function update(dt, api) {
  const v = api.getState().velocity;
  if (!v) return;
  const sp = Math.hypot(v.x || 0, v.z || 0);

  if (!api.isGrounded()) {
    // 0.06 s in: a jump has to feel instant. the 0.1 s default reads as lag
    api.updateChannel('air', { clip: (v.y || 0) > 0 ? 'Jump' : 'Fall', loop: 'loop', weight: 2, blendIn: 0.06 });
    return;
  }
  api.updateChannel('air', null);

  // one speed axis, three weights, floored so crossfades stay alive
  const walkT = Math.min(1, Math.max(0, (sp - 0.6) / 0.4));   // 0.6-1.0 m/s ramp
  const runT  = Math.min(1, Math.max(0, (sp - 2.8) / 0.4));   // 2.8-3.2 m/s ramp
  api.updateChannel('idle', { clip: 'Idle', loop: 'loop', weight: Math.max(1 - walkT, 0.001), blendIn: 0.15 });
  api.updateChannel('walk', { clip: 'Walk', loop: 'loop', weight: Math.max(walkT * (1 - runT), 0.001), speed: sp > 0.1 ? sp / 2.5 : 1, blendIn: 0.15 });
  api.updateChannel('run',  { clip: 'Run',  loop: 'loop', weight: Math.max(runT, 0.001),               speed: sp > 0.1 ? sp / 6   : 1, blendIn: 0.15 });
}
```

the ramps sit tighter than the movement speeds on purpose: default `walkSpeed` is
about **6**, so a character at full stick is already in `Run` territory and the walk
band has to open early or it never plays.

## 5 — one-shots that end cleanly

```js
export function onInput(input, api) {
  if (!input.actions.attack) return;
  const ch = api.getChannel('action');
  if (ch && !ch.finished) return;         // don't restart mid-swing
  api.updateChannel('action', {
    clip: 'Attack', loop: 'once', weight: 3, blendIn: 0.05, duration: 0.8,
  });
}

export function update(dt, api) {
  const ch = api.getChannel('action');
  if (!ch) return;
  // land damage on the clip's own authored frame event, never on a timer
  if (ch.events.includes('main')) api.patchState({ swingLanded: true });
  if (ch.finished) api.updateChannel('action', null);
}
```

`weight: 3` is deliberate — locomotion sits at 1 and weights are additive, so an
action needs to out-weigh it to own the shared bones. `duration` is the expiry, not
the clip length.

## 6 — layers: running and shooting, with a real mask

per-bone masks exist. `mask: { from: 'Spine' }` restricts a channel to that bone and
its descendants — and on this rig the spine numbering runs **toward the hips**, so
`Spine02` sits on the hips and **`Spine` carries the shoulders and neck**. masking
from `Spine` = the whole upper body.

```js
// legs keep walking, arms aim
api.updateChannel('aim', { clip: 'Aim', loop: 'loop', weight: 2, blendIn: 0.12, mask: { from: 'Spine' } });
```

the 24-joint rig, bare Mixamo names, **no `mixamorig` prefix**: `Hips`,
`LeftUpLeg → LeftLeg → LeftFoot → LeftToeBase`, `Spine02 → Spine01 → Spine`,
`LeftShoulder → LeftArm → LeftForeArm → LeftHand`, `neck` (lowercase) `→ Head`.
`mask: { from: ... }` needs the exact case. enumerate an unknown rig with
`api.getBoneNames()` — it returns `[]` until the model loads, so retry next tick.

**there are no finger bones.** hand shape is baked into the mesh; no clip, pose or IK
changes it. say that instead of chasing it.

priority: damage and death cut everything (weight high, `blendIn: 0.04`); an action
cuts the upper body only; idle cuts nothing.

## 6.1 — the layer stack, exactly as the mixer resolves it

three laws the mixer actually runs on. all three are invisible until they bite, and all
three change how you weight a stack.

**1. a layer's identity is its clip and its mask, not your channel name.** the renderer
keys layers as `clip` + `mask:bone`. so two channels playing the SAME clip with the same
mask collapse into ONE layer and the last write wins — you cannot crossfade a clip with
itself (`Walk` → `Walk` at another speed is one layer changing speed, no blend). a real
crossfade needs two different clips; a speed change needs `speed` on the single layer.

**2. `mask: { bones: [...] }` is one layer PER bone, each covering that bone's whole
subtree.** four bones is four layers of cost. `mask: { from: 'Spine' }` is one layer over
the spine's subtree — on this rig that is the chest, both arms, the neck and the head. a
mask naming a bone the rig does not have **drops that layer entirely**, once, with a
diagnostic (the verbatim code is in `gavi#animar-verificar` §5). the tell: a channel whose
weight you can raise all day with nothing happening.

**3. weights sum per bone and per property, and a total under 1 is filled with the REST
pose.** this is the law that quietly ruins passes. on stock avatars rest is the
**T-pose**, so:

| total weight on a bone | what you actually see |
| --- | --- |
| 0.5 (one channel at half weight) | 50% clip blended with 50% **T-pose** — the "limp / half-applied" look |
| 1.0 (idle 0.4 + walk 0.6) | the pose you authored, nothing else |
| 3 vs 1 (action over locomotion) | the action gets **75%**, locomotion keeps 25% |
| 9 vs 1 | the action gets 90% |

so **locomotion crossfades must sum to 1** — that is exactly why §4 holds idle at
`1 - walkT` instead of ramping walk alone up from 0. and when an action must own the upper
body completely, do not chase it with weight (95% would want weight 20): **mask the
competitor off those bones.** weight buys proportion; a mask buys ownership.

### run and shoot, the two shapes that work

```js
// A — the whole upper body aims, the legs keep walking. one layer, one mask.
api.updateChannel('aim', {
  clip: 'AimRifle', loop: 'loop', weight: 2, blendIn: 0.12, mask: { from: 'Spine' },
});

// B — the right arm is IK'd at a live target, so the clip must NOT own that arm
api.updateIK('rightArm', { target: { object: 'enemy-3' }, weight: 1, blendIn: 0.12 });
api.updateChannel('aim', {
  clip: 'AimRifle', loop: 'loop', weight: 2, blendIn: 0.12,
  mask: { bones: ['Spine', 'neck', 'LeftShoulder'] }, // 3 layers; RightShoulder absent on purpose
});
```

**one owner per chain.** IK layers after every channel and mask and wins on its bones, so
a clip masked onto the same arm is not a conflict the engine reports — it is budget spent
invisibly, and worse: the shoulder keeps following the clip while the hand is pinned by
IK, and the elbow reads snapped. shape B is how a layered pose and IK coexist. and
`properties.ik`, like `properties.mixer`, **replaces the whole value** when you set it —
spread what is already there (§8).

### the ladder, with its blend windows

| layer | weight | mask | blendIn |
| --- | --- | --- | --- |
| locomotion (idle + walk + run) | sums to **1** | none | 0.12-0.25 s |
| aim / carry / upper-body pose | 2 | `from: 'Spine'` | 0.12 s |
| one-shot action | 3-5 | none, or `from: 'Spine'` | 0.05 s |
| hit reaction | 6 | `from: 'Spine'` | **0.04 s** |
| death | 8 | none, `loop: 'once'`, never cleared | 0.10 s |

there is no additive/offset layer MODE in this mixer. the weights are called additive
because they SUM — what they sum into is a normalized blend over rest, never an offset
stack. a "texture" layer at weight 0.2 on top of nothing is 80% T-pose; on top of a base
that already sums to 1 it takes 17% of the pose. plan the base first.

**the blend envelope, precisely.** per rendered frame the client runs
`weight += (target − weight) × min(1, dt / max(blend, 0.01))` — linear, with a hard floor
of **0.01 s**. so `blendIn: 0` is not a cut, it is a 10 ms ramp (~0.6 frames at 60 fps);
a channel removed with `updateChannel(name, null)` still fades over its `blendOut` (which
defaults to `blendIn`, so fast-in / slow-out needs both set); and a layer whose weight
falls below **0.001** is removed outright — which is why a live channel is floored at
0.001 and never at 0.

## 6.2 — the clip's real length, and the amplitude you cannot scale

a minted clip is as long as the bake made it, not as long as you designed it.
`api.getChannel(name).duration` is the truth, in seconds:

```js
const ch = api.getChannel('action');
// designed as 18 frames at 24 fps = 0.75 s; it baked at 1.10 s
if (ch && ch.duration) api.updateChannel('action', { speed: ch.duration / 0.75 }); // 1.47
```

`speed = real / wanted`. and note what is NOT on this surface: **the mixer has no gain.**
a baked clip's angles cannot be scaled — `speed` and `blendIn` shape TIMING only. when a
clip reads too small at 6 m (`gavi#animar-doutrina` §1.1), there are three real moves:

1. **re-mint under a more emphatic, more specific name.** the name IS the motion prompt:
   `SwordSlashWideOverheadTwoHanded` is a different motion from `Attack`, not a louder one.
2. **layer an authored function clip on top** — values are offsets from the bind pose, it
   composes like any clip, and that is where the extra 20° actually comes from (engine
   `3d-animations`).
3. accept it on a distant NPC and spend the budget on the character the camera holds.

## 7 — the blendIn table

| transition | blendIn | in ms | frames at 60 fps |
| --- | --- | --- | --- |
| idle ↔ walk ↔ run | 0.12-0.25 s | **120-250 ms** | 7-15 |
| aim / upper-body layer, in or out | 0.12 s | 120 ms | 7 |
| mask swap (one aim pose to another) | 0.08-0.12 s | 80-120 ms | 5-7 |
| action one-shot | 0.05 s | 50 ms | 3 |
| ground → jump | **0.06 s** — the default 0.1 reads as input lag | 60 ms | 3.6 |
| fall → land | 0.05 s | 50 ms | 3 |
| anything → hit | **0.04 s** | **40-60 ms** | 2.4-3.6 |
| death | 0.1 s, `loop: 'once'`, no clear — hold the last pose | 100 ms | 6 |
| a true cut | 0.01 s — the floor | 10 ms | 0.6 |

think in the ms column, because the envelope is evaluated per RENDERED frame and not per
sim tick: 40 ms is 2.4 frames and reads as a cut, 200 ms is 12 frames and reads as a
decision. anything at or under one sim tick (**33 ms**) is a cut in practice — right for a
hit, wrong for locomotion.

a long blend on a fast action is what "mushy" means. a short blend on locomotion is
what "robotic" means. never one number for both.

## 8 — IK and feet

automatic foot grounding is on for every humanoid. two things to know:

```js
// opt out (hovering, skating, seated) — setting `ik` REPLACES the whole value
api.setProperty('ik', { ...(api.getProperty('ik') ?? {}), feet: false });

// look at something: weight 0.4 keeps the underlying clip alive, 1 is full override
api.updateIK('head', { target: { object: 'npc-merchant' }, weight: 0.45, blendIn: 0.2 });
api.updateIK('head', { target: { yaw: 180 } });   // body-relative gaze, degrees
api.updateIK('rightArm', { target: { x: 10, y: 1.2, z: -3 }, weight: 1 });
api.updateIK('rightArm', null);                    // release
```

chains are the fixed camelCase set: `leftArm`, `rightArm`, `leftLeg`, `rightLeg`,
`head`. IK layers **after** every channel and mask and wins on those bones — don't
also mask a clip onto the same arm. and `getIK(chain).reachable` is a bind-pose
estimate, `true` whenever the channel exists — pair it with your own distance check
before calling something grabbed.

## 9 — the two cases where you write nothing

- **npc agents.** anything with `properties.npc` gets idle/walk/run blending,
  anti-slide playback scaling and rate-limited facing for free on the engine's
  `npc-loco` channel. rename via `npc: { clips: { idle: 'Breathe', walk: 'Prowl' } }`.
  a hand-rolled locomotion script on an agent fights the gait channel. layer one-shots
  on top freely — the engine never touches your channels.
- **held gear.** a character that must HOLD something is minted **empty-handed**;
  weapons named in the model prompt bake into the mesh and render in bind pose beside
  the body forever. attach gear as its own object at
  `attachment: { bone: 'RightHand' }`, or re-mint with `?modify=remove the sword`.

## 10 — durability

`updateChannel` writes runtime state. it survives host churn, and it **dies when a
place unloads** (~10 s after the last player leaves) — the entity re-materializes from
spec with no channels. a pose that must always be there belongs in the spec:

```js
api.setProperty('mixer', { sit: { clip: 'Sit', loop: 'loop', weight: 1 } });
```

`properties.mixer` and `properties.npc` are spec and re-apply on every reload.

## 11 — when the rig lets you down

symptoms: `model-clip-not-found` on a name you did list, limbs stretching into cones
(bad skinning), a body that never leaves the T-pose with clean logs.

in order: (1) confirm the real clip names from the `Available:` list in the
diagnostic. (2) re-mint under a **new filename** (`-2`, `-v3`) — patching the same
name serves the same broken file back. (3) if two mints fail, switch pipes:
`gavi#animar-esqueleto-codigo`. a rig that has failed twice is not a bug, it's an
answer.

## what goes wrong

- **`fade:` instead of `blendIn:`.** TELL: every transition feels the same and jumps
  feel 40 ms late, no error anywhere. the field is ignored and 0.1 s is used. FIX: §3.
- **T-pose with clean-looking logs.** TELL: model visible, perfectly still, arms
  horizontal. FIX: `getLogs()` for `model-clip-not-found`; the `Available:` list is
  the answer. remember a restart empties the log.
- **idle and run look identical.** TELL: motion happens but never changes with speed.
  FIX: the model has exactly one baked animation and every channel falls back to it.
  mint the rest.
- **the one-shot never finishes.** TELL: attack restarts forever, `finished` never
  true. FIX: you're calling `updateChannel` on the `once` channel every tick — a
  re-fire restarts it. gate on `getChannel().finished` first (§5).
- **the action gets swallowed by locomotion.** TELL: the swing barely reads. FIX:
  weights are additive — locomotion at 1 needs an action at 2-3, or a mask.
- **feet slide.** TELL: the body glides while the legs cycle at their own speed. FIX:
  `speed: sp / 2.5` (walk) and `sp / 6` (run), the baked speeds.
- **the seated/posed character drifts back to standing.** TELL: pose holds for a few
  seconds then the body walks off or snaps to the floor. FIX: on an agent set
  `npc: { locomotion: false }` — otherwise the engine's weight-1 `npc-loco` idle is
  rewritten every tick underneath you.
- **the half-applied pose.** TELL: the body looks like it is drifting toward a T-pose —
  arms floating outward, the clip visible but weak. FIX: the total weight on those bones is
  under 1 and the remainder IS the rest pose (§6.1). make the base sum to 1.
- **two channels, one clip, one layer.** TELL: raising a second channel does nothing, or
  the first channel's speed/blend silently changes. FIX: layers are keyed by clip + mask —
  same clip, same mask, one layer (§6.1). use a different clip, or drive `speed`.
- **the snapped elbow.** TELL: the hand sits where IK put it while the upper arm follows
  the clip. FIX: one owner per chain — mask the clip off the IK'd arm (§6.1, shape B).
- **`blendIn: 0` that still eases.** TELL: a hit reaction that refuses to cut in. FIX: the
  envelope floors at 0.01 s; a real cut is 0.01 plus a weight that dominates (§6.1).
- **a mask on a bone the rig lacks.** TELL: a channel with no effect at any weight, one
  diagnostic line, no throw. FIX: the whole masked layer is dropped — check the exact case
  against `api.getBoneNames()` (§6, §6.1).