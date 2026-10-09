---
name: Aaa Training
description: The training curriculum — field-verified debugging doctrine plus a dataset of real symptom→fix pairs from a live game, and the fused load order. Reading it IS the training; no model swap involved.
---

# AAA Training — the curriculum

Ported from a creator's three AI-training scripts — a fine-tuning curriculum, a
mentor-driven dataset generator, and a fused local runner — into the one form a
Savi actually learns from: a skill read at load time. Nothing here changes a
model or a brain. The knowledge rides the mod; whoever installs it starts
already knowing what took a real game days to learn.

## Part 1 — the curriculum (the doctrine, in training order)

1. **Look first.** Anything visual — broken, black, missing, wrong color — gets
   one live frame before any code is read. A wrong theory formed from code can
   survive forty minutes; a frame kills it in one.
2. **One hypothesis, one change, one receipt.** Never stack two fixes on one
   symptom. Give long-lived handlers a state receipt (a `heard`/`armedTick`
   counter) so "is it listening?" is one readOnly read, never a guess.
3. **A probe that misses what the render shows indicts the probe.** Return the
   scanned set's count and range next to the matches, so a wrong filter shows
   itself instead of convicting the world.
4. **A fix that misses twice is upstream.** Stop patching the symptom; read
   wider — spec, engine notes, the skill for that territory — and come back
   structurally different.
5. **Claims wait for frames.** Conjured assets are invisible while they cook;
   an event firing is not a sighting. "It's there" is said only off a frame
   with the thing in it.
6. **Write the wrong turns down.** A bug diary keeps the symptom, the fix a
   re-check proved, and the dead ends — so nobody walks them twice.

## Part 2 — the dataset (real symptom → fix pairs, all tool-verified)

Mentor format: symptom, the wrong turn kept on purpose, the fix that held.
Engine-versioned facts were verified on 5.2.19.

- **All voxel terrain renders black; objects and sky lit fine.** Wrong turn:
  moving material URLs `texture` → `albedo`. Voxel terrain materials read
  `texture` (heightmap reads `albedo`) — the rename handed the renderer
  nothing. Second cause stacked under it: the client builds its block-texture
  atlas once, and textures still cooking at build time leave a stale black
  atlas that spec edits never rebuild — a client reload does. Fix: correct
  key + reload; verified by a lit player frame.
- **A deep-merge patch can't delete a key.** `patchTerrain({ materials: copyWithoutKey })`
  changes nothing (the engine says so in the log). Deleting is explicit:
  `patchTerrain({ updateMaterials: { id: { badKey: null } } })`.
- **Deleting a spec-declared object row.** `updatePlace` with `null` is
  rejected ("is not an object def"); `api.destroy()` on a declared-but-not-live
  id returns quietly, row intact. What works: spawn the id live, then destroy
  it, then re-read the spec to confirm.
- **An event with no ears.** A `run_script` spawn runs `onSpawn`
  transactionally — `api.on(...)` registered there never installs. Fix:
  re-save the behavior script so the live rebind re-runs `onSpawn`, and prove
  it with the state receipt from Part 1.
- **A spec child row with `parent: "player"` only stamps players who join
  after it's authored** — resumed sessions get nothing (the "invisible player
  body" bug). Fix that held: the player's own behavior spawns its body on
  entry, records the child id in state, re-spawns when the id is gone. The
  player owns its body; delete the spec row so nobody gets two.
- **Mouse wheel as actions (`wheelUp`/`wheelDown`) rejected.** The wheel is an
  axis: `{ mouse: "wheelY" }`, read in `onInput` — and declare the competing
  default-zoom axis empty if the wheel must belong to the hotbar.

## Part 3 — the fused runtime (everything in one head)

The runner script's idea, honestly ported: load the whole kit together at
session start instead of piecemeal —

```
use_skill({ skills: ["aaa-quality-kit#aaa-look", "aaa-quality-kit#aaa-impact",
  "aaa-quality-kit#aaa-sound", "aaa-quality-kit#aaa-ui",
  "aaa-quality-kit#aaa-anim-3d", "aaa-quality-kit#aaa-models-3d",
  "aaa-quality-kit#aaa-sprites-2d", "aaa-quality-kit#aaa-training",
  "aaa-quality-kit#aaa-wisp-fleet", "aaa-quality-kit#modo-claude-fable",
  "aaa-quality-kit#modo-ultra-stronger", "aaa-quality-kit#modo-playtest",
  "aaa-quality-kit#modo-animadora-pro", "aaa-quality-kit#modo-mods-famosos",
  "aaa-quality-kit#modo-shaders"] })
```

The last seven are the **brain** skills — fleet dispatch, director, engineer,
playtester, animator, famous-mods specialist, shader artist. Same honest
scope as this one: they are curricula, read at load time; loading them IS activating them,
and by themselves they change zero appearance and zero assets.

One fused head: light, contact, sound, UI, motion, models, sprites, and this
curriculum, loaded before the first move. What lives in these files needs no
outside help to apply — helpers stay what they always were, the same mind with
more hands, dispatched for scale, not for knowledge that's already here.