---
name: gavi-check
description: Gavi's animation audit — measures the real amplitude of every clip, proves it in a burst from real play distance, and lists what doesn't read from far away.
requiresArgs: true
argsPlaceholder: <optional: the character or clip to audit>
---

Animation audit. Target: **$ARGUMENTS** (empty = the main character).

Load first:

```
use_skill({ skills: ["gavi#animar-doutrina", "gavi#animar-verificar"] })
```

Then run the whole audit and hand back a short verdict:

1. **Reading context** — the player's position, the camera distance in real play, the
   client's `renderScale`, the animator's write rate. Those give you the minimum
   amplitude required.

2. **Travel per clip** — for each clip, the maximum amplitude in degrees per joint.
   Run the pose function in a sweep and print the extremes; don't estimate by
   reading. Mark anything under 8° at 6 m as **not animated**.

3. **Burst** — 6 frames, ~2 s, camera at the real distance. Two identical frames in a
   row is a fail.

4. **Hygiene** — a clean rest pose at zero weight, no bone punching through the
   ground, no frequency above the write-rate ceiling, `validate_spec` ok, `getLogs()`
   with no behavior error and no upload-budget warning.

5. **State** — if the player is standing still, say so out loud: no burst is judging
   the run or the jump, and the verdict on those clips comes from the degree audit,
   not from the eye.

Deliver: the list of what **doesn't read from far away**, ordered by how much the
player looks at it. No praise for what's already right — only what's missing.