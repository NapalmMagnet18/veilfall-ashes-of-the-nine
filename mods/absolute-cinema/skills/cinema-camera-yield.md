---
name: Cinema Camera Yield
description: How host camera behaviors should yield to and recover from Absolute Cinema possession and playback modes
---

---
description: Camera yield guard for Absolute Cinema — add this to any camera script so it yields during cinema possession and playback, then re-seeds tracking when cinema releases.
---

# Cinema Camera Yield Guard

When the Absolute Cinema mod is installed, the host project's camera script needs to **yield** during cinema possession and playback, then **re-seed** its tracking state when cinema releases so the camera snaps back to the player instead of getting stuck.

## The Pattern

Three player state fields matter:
- `possessedNodeId` — truthy during node possession
- `cinemaPlaying` — truthy during sequence playback
- `cinemaPlayback.playing` — alternative playback flag

### onInput — full yield

At the very top of `onInput`, before any mouse look or input processing:

```js
var target = api.getControlTarget();
if (target) {
  var ps = target.state;
  if (ps && (ps.possessedNodeId || ps.cinemaPlaying || (ps.cinemaPlayback && ps.cinemaPlayback.playing))) return;
}
```

### update — yield + re-seed on release

At the very top of `update`, before any camera positioning or lookAt:

```js
var target = api.getControlTarget();
if (!target) return;
var ps = target.state;
var cinemaActive = !!(ps.possessedNodeId || ps.cinemaPlaying || (ps.cinemaPlayback && ps.cinemaPlayback.playing));
var s = api.getState();

if (cinemaActive) {
  // Mark that we're yielding so we know to re-seed when it ends
  if (!s._cinemaYielding) api.patchState({ _cinemaYielding: true });
  return;
}

// Cinema just released — re-seed tracking to player's current position
if (s._cinemaYielding) {
  var pos = target.feetPosition;
  api.patchState({
    _cinemaYielding: false,
    // Reset whatever tracking fields your camera uses.
    // Common examples below — adapt to your camera script:
    initialized: false,    // force re-initialization
    smoothX: pos.x,        // re-seed follow tracking
    smoothZ: pos.z,
    focusX: pos.x,
    focusZ: pos.z,
    offsetX: 0,
    offsetZ: 0,
  });
  // Don't process this frame — let the camera re-initialize next tick
  return;
}
```

### Adapting the re-seed

The re-seed patch above uses common field names (`smoothX`, `focusX`, `initialized`, etc.) that match typical third-person orbit cameras. If your camera script uses different field names for follow tracking, substitute those instead.

The key principle: **clear or reset any accumulated tracking state** so the camera doesn't try to interpolate from a stale position (where it was before cinema took over) to the player's current position.

For simple cameras with no tracking state, just resetting `initialized: false` may be enough.

## What the fields mean

- `possessedNodeId` — set by cinema-director.js when the user possesses a camera node. Cinema camera flies to that node's position and gaze.
- `cinemaPlaying` — set by cinema-director.js during sequence playback. Cinema camera follows the timeline.
- Both are cleared (nulled) when the user releases possession or stops playback.

## Engine 5.2+ — merge, don't replace; script orientation while cinema drives

Two rules the toolkit now follows internally, worth knowing if you write your own
takeover code against the same camera:

1. **`setCamera` must merge, not replace.** A replace config drops every behavior the
   camera is already wearing, so the host camera script disappears the moment cinema
   takes the wheel. Every takeover call passes `{ mode: 'merge' }` — or, if you really
   want replace, it must list both scripts: `behavior: ['camera.js', 'cinema-camera.js']`.
   The old `transition: { duration }` option went away with the builtin camera kinds and
   is no longer passed anywhere.

2. **A script-driven rig must declare `orientation: { source: 'script' }`.** With the
   default `source: 'look'` the engine keeps integrating the player's mouse over
   whatever the script writes, so the view drifts/orbits during possession. Cinema sets
   `pointerLock: false` + `orientation: { source: 'script' }` while it drives, and
   restores `pointerLock: true` + `orientation: { source: 'look' }` on release/stop.
   If your host camera reads view angles, read them back with `getViewAngles()` after
   cinema hands control back rather than trusting cached yaw/pitch.

## Why not just clearCamera()?

`clearCamera()` tells the engine to stop the cinema camera override, but the host camera script still needs to know it should re-seed. Without the `_cinemaYielding` transition detection, the host camera resumes with stale tracking and appears frozen.