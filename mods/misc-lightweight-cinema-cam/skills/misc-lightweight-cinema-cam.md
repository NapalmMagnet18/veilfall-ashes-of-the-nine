---
name: Lightweight Cinema Camera
description: Build seamless data-driven cinematic camera sequences with timeline effects, easing patterns, and trigger wiring.
---

# Lightweight Cinema Camera

Lightweight data-driven cinematic camera sequences. Define camera shots as JSON, play them back with smooth interpolation, and layer juice (letterbox, announce, music, shake, flash) on top. No editor UI, no mod dependency — Savi builds sequences directly from the creator's descriptions.

---

## Trigger Conditions

- The user wants a cutscene, intro sequence, camera flyover, reveal, or scripted camera moment.
- The user mentions cinematic camera, camera path, camera animation, or smooth camera transitions between points.
- The user does NOT need a full timeline editor — they describe camera moments in natural language and Savi builds the data.

---

## Architecture — 4 Pieces

| Piece | Role |
|---|---|
| `scripts/lib/cinema-sampler.js` | Core math — interpolates position/yaw/pitch at any time `t` |
| `scripts/lib/data/sequences.json` | All sequences as pure data — nodes, timing, effects |
| `scripts/cinema-playback.js` | Player behavior — triggers sequences, advances clock, fires effects, freezes input, hold-to-skip |
| `scripts/cinema-camera.js` | Camera behavior — positions camera from timeline sample during playback, yields when inactive |

Plus two guards on existing scripts:
- **Player movement** (`onInput`): `if (s.cinemaActive) return;` — freezes WASD during cutscene
- **Normal camera** (`onInput` + `update`): yield when `cinemaActive` is true, re-seed tracking when it ends

---

## Sequence Data Format

```json
{
  "my-sequence": {
    "nodes": [
      { "id": "wide",  "position": { "x": 0, "y": 15, "z": 30 }, "yaw": 180, "pitch": -15 },
      { "id": "close", "position": { "x": 2, "y": 2,  "z": -3 }, "yaw": 220, "pitch": 0 }
    ],
    "sequence": [
      { "nodeId": "wide",  "hold": 0, "transition": 2, "easing": "easeOutCubic" },
      { "nodeId": "close", "hold": 0.5, "transition": 0 }
    ],
    "effects": [
      { "time": 0,   "type": "letterbox",  "params": { "intensity": 0.15 } },
      { "time": 0,   "type": "musicShift",  "params": { "clip": "cdn/music-instrumental-epic-orchestral.mp3", "volume": 0.4 } },
      { "time": 1,   "type": "announce",    "params": { "text": "THE BEGINNING", "style": "cinematic", "duration": 3 } }
    ]
  }
}
```

### Node Fields
- `id`: unique name within the sequence
- `position`: world-space camera position `{ x, y, z }`
- `yaw`: degrees, 0 = -Z (forward), 90 = -X (left), counter-clockwise
- `pitch`: degrees, negative = looking down, positive = looking up

### Sequence Entry Fields
- `nodeId`: references a node by `id`
- `hold`: seconds to park on this node before moving (use `0` for seamless flow)
- `transition`: seconds to blend to the NEXT node (`0` = hard cut)
- `easing`: any `builtin/easing` function name (default: `"linear"`)

### Effect Fields
- `time`: seconds into the sequence to fire
- `type`: one of `letterbox`, `announce`, `screenShake`, `screenFlash`, `playSound`, `musicShift`, `vignette`, `toast`, `slowMo`
- `params`: type-specific parameters (see fireFx switch in playback script)

---

## CRITICAL: Easing for Seamless Flow

**The #1 learning:** `easeInOutCubic` creates visible micro-pauses between nodes because it decelerates at the END of each segment AND accelerates at the START of the next one. The camera appears to pause at every node even with `hold: 0`.

### The Fix
- **First node:** `easeOutCubic` — gentle start, constant exit speed
- **All middle nodes:** `linear` — constant speed, no decel/accel at boundaries
- **Last node:** `hold: 0.5, transition: 0` — brief settle before handing back control

```json
"sequence": [
  { "nodeId": "start",   "hold": 0, "transition": 1,   "easing": "easeOutCubic" },
  { "nodeId": "mid-1",   "hold": 0, "transition": 1.5, "easing": "linear" },
  { "nodeId": "mid-2",   "hold": 0, "transition": 2,   "easing": "linear" },
  { "nodeId": "mid-3",   "hold": 0, "transition": 1.5, "easing": "linear" },
  { "nodeId": "end",     "hold": 0.5, "transition": 0 }
]
```

This makes the camera flow like one unbroken crane shot.

### When to use easeInOut
Only when you WANT the camera to breathe at a node — a dramatic pause on a vista, a beat on a character's face. Use it intentionally, not as default.

---

## The Timeline Sampler

Core math module. ~75 lines. Lives in `scripts/lib/cinema-sampler.js`.

```js
// scripts/lib/cinema-sampler.js
const { lerp } = require('builtin/math');
const easing = require('builtin/easing');

function resolveNode(entry, nodes) {
  if (!entry || !nodes) return null;
  for (var i = 0; i < nodes.length; i++) {
    if (nodes[i].id === entry.nodeId) return nodes[i];
  }
  return null;
}

function sequenceDuration(seq) {
  var total = 0;
  for (var i = 0; i < seq.length; i++) {
    total += (seq[i].hold ?? 2);
    if (i < seq.length - 1) total += (seq[i].transition ?? 1);
  }
  return total;
}

function lerpYaw(a, b, t) {
  a = ((a % 360) + 360) % 360;
  b = ((b % 360) + 360) % 360;
  var diff = b - a;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  return a + diff * t;
}

function sampleTimeline(t, sequence, nodes) {
  var totalDur = sequenceDuration(sequence);
  if (totalDur <= 0) {
    var first = resolveNode(sequence[0], nodes);
    return first ? { position: first.position, yaw: first.yaw, pitch: first.pitch } : null;
  }
  if (t < 0) t = 0;
  if (t > totalDur) t = totalDur;

  var cursor = 0;
  for (var i = 0; i < sequence.length; i++) {
    var entry = sequence[i];
    var holdDur = entry.hold ?? 2;
    var node = resolveNode(entry, nodes);
    if (!node) { cursor += holdDur + (entry.transition ?? 1); continue; }

    if (t <= cursor + holdDur) {
      return { position: node.position, yaw: node.yaw, pitch: node.pitch };
    }
    cursor += holdDur;

    if (i < sequence.length - 1) {
      var transDur = entry.transition ?? 1;
      if (transDur > 0 && t <= cursor + transDur) {
        var progress = (t - cursor) / transDur;
        var easeFn = easing[entry.easing || 'linear'] || easing.linear;
        var et = easeFn(progress);
        var next = resolveNode(sequence[i + 1], nodes);
        if (!next) return { position: node.position, yaw: node.yaw, pitch: node.pitch };
        return {
          position: {
            x: lerp(node.position.x, next.position.x, et),
            y: lerp(node.position.y, next.position.y, et),
            z: lerp(node.position.z, next.position.z, et),
          },
          yaw: lerpYaw(node.yaw, next.yaw, et),
          pitch: lerp(node.pitch, next.pitch, et),
        };
      }
      cursor += transDur;
    }
  }
  var last = resolveNode(sequence[sequence.length - 1], nodes);
  return last ? { position: last.position, yaw: last.yaw, pitch: last.pitch } : null;
}

module.exports = { sampleTimeline, sequenceDuration, lerpYaw, resolveNode };
```

---

## Playback Behavior (Player Side)

Attach to player. Owns `cinemaActive`, `cinemaTime`, `cinemaSeqId` on player.state.

**Trigger:** `patchState({ cinemaPlay: 'sequence-id' })` or `sendAction('cinemaPlay', { id: '...' })`

Key features:
- Fires `setCamera({ kind: 'custom', pointerLock: false })` on start, `clearCamera({ transition: { duration: 0.4 } })` on end
- Shows cursor during cutscene (for skip UI)
- Hold-to-skip via jump/space (1 second hold)
- `_cinemaFired` map prevents double-firing effects
- `onSpawn` can auto-play an intro with `_introPlayed` guard (persisted via player persistence)
- Post-sequence events (atmosphere shifts, teleports) go in `stopCinema()` keyed by `seqId`

```js
// scripts/cinema-playback.js
const SEQUENCES = require('lib/data/sequences.json');
const { sequenceDuration } = require('lib/cinema-sampler.js');

var SKIP_HOLD_DURATION = 1.0;

export function onSpawn(objectApi) {
  var s = objectApi.getState();
  if (!s._introPlayed) {
    objectApi.patchState({ cinemaPlay: 'cafeteria-intro', _introPlayed: true });
  }
}

export function update(dt, objectApi) {
  var s = objectApi.getState();

  if (s.cinemaPlay && !s.cinemaActive) {
    var seqData = SEQUENCES[s.cinemaPlay];
    if (seqData) {
      objectApi.patchState({
        cinemaActive: true,
        cinemaSeqId: s.cinemaPlay,
        cinemaTime: 0,
        cinemaPlay: null,
        _cinemaFired: {},
        _cinemaSkipHold: 0,
      });
      objectApi.setCamera({ kind: 'custom', pointerLock: false }, { mode: 'replace' });
      objectApi.showCursor();
      objectApi.playSound('cdn/sfx-ui-whoosh-soft.mp3', { volume: 0.3 });
    } else {
      objectApi.patchState({ cinemaPlay: null });
    }
    return;
  }

  if (!s.cinemaActive) return;

  var seqData = SEQUENCES[s.cinemaSeqId];
  if (!seqData) { stopCinema(objectApi); return; }

  var total = sequenceDuration(seqData.sequence);
  var t = (s.cinemaTime ?? 0) + dt;

  tickEffects(t, seqData.effects || [], objectApi);

  if (t >= total) {
    stopCinema(objectApi);
    return;
  }

  objectApi.patchState({ cinemaTime: t });
}

export function onInput(input, objectApi) {
  var s = objectApi.getState();

  if (input.actions.cinemaPlay && input.actionData && input.actionData.cinemaPlay) {
    var reqId = input.actionData.cinemaPlay.id;
    if (reqId) objectApi.patchState({ cinemaPlay: reqId });
  }

  if (s.cinemaActive) {
    var skipHold = s._cinemaSkipHold || 0;
    if (input.actions.jump) {
      skipHold += objectApi.getDeltaTime();
      if (skipHold >= SKIP_HOLD_DURATION) {
        stopCinema(objectApi);
        return;
      }
      objectApi.patchState({ _cinemaSkipHold: skipHold });
    } else {
      if (skipHold > 0) objectApi.patchState({ _cinemaSkipHold: 0 });
    }
  }
}

function stopCinema(objectApi) {
  objectApi.clearCamera({ transition: { duration: 0.4 } });
  objectApi.letterbox(0);
  objectApi.patchState({
    cinemaActive: false,
    cinemaSeqId: null,
    cinemaTime: 0,
    _cinemaFired: {},
    _cinemaSkipHold: 0,
  });
}

function tickEffects(t, effects, objectApi) {
  var fired = objectApi.getState()._cinemaFired || {};
  var changed = false;
  for (var i = 0; i < effects.length; i++) {
    var fx = effects[i];
    if (t >= fx.time && !fired[i]) {
      fireFx(objectApi, fx);
      fired[i] = true;
      changed = true;
    }
  }
  if (changed) objectApi.patchState({ _cinemaFired: fired });
}

function fireFx(objectApi, fx) {
  var p = fx.params || {};
  switch (fx.type) {
    case 'letterbox':   objectApi.letterbox(p.intensity ?? 0.15); break;
    case 'announce':    objectApi.announce(p.text || '', { style: p.style, duration: p.duration ?? 2, subtitle: p.subtitle }); break;
    case 'screenShake': objectApi.screenShake(p.intensity ?? 0.5, p.duration ?? 0.3); break;
    case 'screenFlash': objectApi.screenFlash(p.color ?? 'oklch(0.99 0 0)', p.duration ?? 0.2); break;
    case 'playSound':   objectApi.playSound(p.clip, { volume: p.volume ?? 0.6 }); break;
    case 'musicShift':  objectApi.musicShift(p.clip, { fade: 0.5, volume: p.volume ?? 0.4, audience: { kind: 'place' } }); break;
    case 'vignette':    objectApi.vignette(p.intensity ?? 0.6, p.color); break;
    case 'toast':       objectApi.toast(p.message || '', { duration: p.duration ?? 2 }); break;
    case 'slowMo':      objectApi.slowMo({ scale: p.scale ?? 0.3, duration: p.duration ?? 2, ease: true }); break;
  }
}
```

---

## Camera Behavior (Camera Side)

Attach alongside the normal camera. Does nothing when `cinemaActive` is false.

Key features:
- Blocks mouse look during cinema via `onInput` guard
- Positions camera from `sampleTimeline()` every tick
- Tracks `_cinemaYielding` state so the normal camera can re-seed when cinema ends
- Uses `lookAt()` computed from yaw/pitch direction for smooth orientation

```js
// scripts/cinema-camera.js
const { degToRad } = require('builtin/math');
const { sampleTimeline } = require('lib/cinema-sampler.js');
const SEQUENCES = require('lib/data/sequences.json');

function lookTarget(pos, yaw, pitch) {
  var yr = degToRad(yaw);
  var pr = degToRad(pitch);
  var cp = Math.cos(pr);
  return {
    x: pos.x - Math.sin(yr) * cp * 10,
    y: pos.y + Math.sin(pr) * 10,
    z: pos.z - Math.cos(yr) * cp * 10,
  };
}

export function onInput(input, cameraApi) {
  var target = cameraApi.getControlTarget();
  if (target && target.state && target.state.cinemaActive) return;
}

export function update(dt, cameraApi) {
  var target = cameraApi.getControlTarget();
  if (!target) return;
  var ps = target.state;

  if (!ps.cinemaActive) {
    var s = cameraApi.getState();
    if (s._cinemaYielding) {
      cameraApi.patchState({ _cinemaYielding: false, initialized: false });
    }
    return;
  }

  var s = cameraApi.getState();
  if (!s._cinemaYielding) {
    cameraApi.patchState({ _cinemaYielding: true });
  }

  var seqData = SEQUENCES[ps.cinemaSeqId];
  if (!seqData) return;

  var sample = sampleTimeline(ps.cinemaTime || 0, seqData.sequence, seqData.nodes);
  if (!sample) return;

  cameraApi.setProperty('feetPosition', sample.position);
  cameraApi.lookAt(lookTarget(sample.position, sample.yaw, sample.pitch));
}
```

---

## Normal Camera Yield Guard

Add to your existing camera script:

### In `onInput`:
```js
var target = cameraApi.getControlTarget();
if (target && target.state && target.state.cinemaActive) return;
```

### In `update`:
```js
var target = cameraApi.getControlTarget();
if (!target) return;
if (target.state.cinemaActive) {
  if (!cameraApi.getState()._cinemaYielding) cameraApi.patchState({ _cinemaYielding: true });
  return;
}
if (cameraApi.getState()._cinemaYielding) {
  cameraApi.patchState({ _cinemaYielding: false, initialized: false });
  return; // skip one frame to re-seed
}
```

---

## Player Movement Guard

In your player movement `onInput`:
```js
var s = objectApi.getState();
if (s.cinemaActive) return;
```

Movement `update` keeps running (gravity, grounding) so the player doesn't fall through the world.

---

## Triggering Sequences

### On first spawn (intro):
```js
export function onSpawn(objectApi) {
  var s = objectApi.getState();
  if (!s._introPlayed) {
    objectApi.patchState({ cinemaPlay: 'my-intro', _introPlayed: true });
  }
}
```
Uses player persistence so `_introPlayed` survives across sessions.

### From a trigger zone:
```js
// scripts/exit-trigger.js — attach to a trigger volume
export function onTriggerEnter(other, objectApi) {
  var ps = objectApi.getObjectState(other.id);
  if (ps && !ps.cinemaActive) {
    objectApi.patchObjectState(other.id, { cinemaPlay: 'my-exit-sequence' });
  }
}
```

### From interaction:
```js
export function onInteract(other, objectApi) {
  objectApi.patchObjectState(other.id, { cinemaPlay: 'reveal-sequence' });
}
```

### From UI (dev replay buttons):
```html
<button onclick="sendAction('cinemaPlay', { id: 'my-sequence' })">▶ Replay</button>
```
Requires `cinemaPlay: {}` in inputs.actions.

---

## Inputs Required

```js
api.patchInputs({
  actions: {
    cinemaPlay: {},  // UI-only trigger for replay/dev buttons
  },
});
```

The `jump` action (hold-to-skip) should already exist in movement inputs.

---

## Post-Sequence Events

Handle atmosphere shifts, teleports, music changes, or game state transitions in `stopCinema()` by checking `seqId`:

```js
function stopCinema(objectApi) {
  var seqId = objectApi.getState().cinemaSeqId;
  objectApi.clearCamera({ transition: { duration: 0.4 } });
  objectApi.letterbox(0);
  objectApi.patchState({ cinemaActive: false, cinemaSeqId: null, cinemaTime: 0, _cinemaFired: {}, _cinemaSkipHold: 0 });

  if (seqId === 'my-exit') {
    objectApi.patchAtmosphere({ /* outdoor vibe */ });
  }
}
```

---

## Sequence Design Tips

### Seamless crane shots
- All `hold: 0`, first easing `easeOutCubic`, middle easings `linear`, last node `hold: 0.5, transition: 0`

### Dramatic beats
- Use `hold: 1-2` on the beat node with `easeInOutCubic` — the pause IS the drama

### Survey panoramas
- Wide yaw swings (e.g., 180 → 310) with `linear` easing look like steady pans
- `lerpYaw` handles wrap-around automatically — going from yaw 350 to yaw 10 takes the short 20° path, not the 340° long way

### Yaw direction
- 0° = -Z (forward), 90° = -X (left), 180° = +Z (back), 270° = +X (right)
- Counter-clockwise when viewed from above

### Node spacing
- Closer nodes with shorter transitions = faster, more energetic
- Wider nodes with longer transitions = sweeping, cinematic, epic

### Common effect timing
- `time: 0` — letterbox + music (set the mood immediately)
- `time: 0.5` — screenFlash (dramatic punctuation after brief dark)
- `time: 3-5` — announce text (let the visual breathe before adding words)
- End — screenShake or particleBurst for impact landing

---

## Validation Checklist

- [ ] `scripts/lib/cinema-sampler.js` exists with `sampleTimeline`, `sequenceDuration`, `lerpYaw`, `resolveNode` exported
- [ ] `scripts/lib/data/sequences.json` has at least one sequence with nodes + sequence + effects
- [ ] `scripts/cinema-playback.js` attached to player
- [ ] `scripts/cinema-camera.js` attached to camera
- [ ] Player movement script has `cinemaActive` guard in `onInput`
- [ ] Normal camera script has yield guard in both `onInput` and `update`
- [ ] `cinemaPlay` action registered in inputs
- [ ] Triggers wired (onSpawn / onTriggerEnter / onInteract / UI)

---

## Common Pitfalls

| Symptom | Cause | Fix |
|---|---|---|
| Camera snaps back harshly | `clearCamera` with no transition | Use `clearCamera({ transition: { duration: 0.4 } })` |
| Player walks during cutscene | Missing `cinemaActive` guard in player `onInput` | Add `if (s.cinemaActive) return;` |
| Yaw spins 350° instead of 10° | Using raw `lerp` on yaw | Use `lerpYaw` (wraps shortest path) |
| Micro-pauses between nodes | `easeInOutCubic` on all segments | Use `linear` for mid-segments, `easeOutCubic` for first |
| Effects fire twice | Missing `_cinemaFired` tracking | Check the `tickEffects` pattern |
| Intro replays every join | No `_introPlayed` persistence | Enable player persistence for state, check flag in `onSpawn` |
| Camera jitters after cinema ends | Normal camera lerping from stale position | `_cinemaYielding` → `initialized: false` re-seed pattern |
