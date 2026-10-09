---
name: Programming For Real
description: Gavi's discipline as a programmer, in two halves. Laws 1-10 keep the game standing — contracts and file owners, state that exactly one lane writes, behaviour added instead of clobbered, managers instead of logic on the player, declared update cadence instead of hand-counted ticks, errors that are never swallowed, probing before theorising, and the 30 Hz network ceiling that decides whether the game stutters. Laws 11-16 are the tier above, the craft that separates a strong coding system from one that merely compiles — the grounding protocol (never write an identifier you have not read, and its three failure shapes), the stale-derivation bug class with a real worked case from this game, async and job discipline across a wait, refactoring a live system on a seam, performance as a measurement with the cpu-vs-gpu decision table and the 30 Hz cadence arithmetic, and code the next hand can adopt. Read it alongside cacar-bugs-jogando.
---

# Gavi — programming for real

a beautiful animation inside a file nobody can touch afterwards is not finished
work. this is the part that lets the game survive ten more requests without falling
apart.

every call in this file was checked against this engine's own reference before it
was written down. a skill that teaches a call which does not exist is worse than no
skill.

it comes in two halves. **laws 1-10** are what keeps a game standing: owners,
contracts, cadence, the ceiling. **laws 11-16** are the tier above — the craft that
separates a strong coding system from one that merely compiles. the first half stops
the game breaking. the second half stops *you* breaking it.

## pick your law in ten seconds

| the symptom / the moment | the law |
|---|---|
| "it works sometimes", a value flickering | LAW 1 — two writers on one field |
| you are about to set a `behavior` array | LAW 2 — add, never replace (and `patchPlayer({behavior})` **throws**) |
| score, waves, timers, spawning | LAW 3 — a manager entity, never the player |
| 100 objects with a behaviour each | LAW 4 — one system, and declare the cadence |
| you wrote `if (tick % 3 === 0)` | LAW 4 — delete the gate, `updateSchedule` owns it |
| "it's lagging" and nothing looks heavy | LAW 5 — the 30 Hz write ceiling |
| a character silently stopped moving | LAW 6 — somebody swallowed an error |
| you have a theory and no measurement | LAW 7 — eye → measure → log → code |
| naming a field, a file, a tag | LAW 8 — the fiction's names, the engine's tags |
| about to say "done" | LAW 9 — and `gavi#testar-tudo` for the whole sweep |
| multiplayer, knockback, saves | LAW 10 — one simulator per entity |
| about to write a call you have not grepped | LAW 11 — read the signature and its three failure shapes |
| "it worked yesterday" / one warning every frame nobody reacts to | LAW 12 — a stale derivation behind a dead gate |
| `api.job`, a timer, anything with a wait inside it | LAW 13 — the world moved; re-read before you write |
| changing a system players are standing inside | LAW 14 — one seam, one caller, delete the old one last |
| "it's slow" and you already know why | LAW 15 — read the lean first: cpu and gpu have disjoint fixes |
| handing the file to the next session | LAW 16 — provenance, one concern, the caseback |

---

## LAW 1 — every piece of state has one owner, and only the owner writes

two lanes writing the same field is the most expensive bug there is, because it
never throws: it **flickers**. one writes, the other overwrites on the next tick,
and the symptom that reaches you is "it works sometimes".

before writing any new field, answer in one line:

```
state.velocity          → owner: scripts/player.js        (everyone reads, nobody else writes)
state.gait              → owner: scripts/player.js        (the animator only reads)
state.screamUntil       → owner: scripts/vale-grito.js
the animals' transforms → owner: scripts/vale-bichos.js   (in batch)
```

wrote that line? it becomes a comment at the top of the file. that is what saves the
next session.

reads across the fence are free and cheap: `api.getObjectState(id)` for another
entity's state, `api.patchObjectState(id, patch)` only from the field's owner.

and know exactly what a patch does, because half the "it didn't save" reports are
this:

```js
api.patchState({ hp: 4 });              // deep merge — every other key survives
api.patchState({ target: undefined });  // deletes target — TOP LEVEL of the patch only
api.patchState({ inv: { sword: undefined } });  // does NOT delete: it assigns undefined
api.deleteState('inv.sword');           // the only way to remove a NESTED key
api.replaceState({ hp: 4 });            // wholesale reset — everything else is gone
```

`null` never deletes. it stores `null`, and a reader doing `?? default` and a reader
doing `if (x)` will disagree about it forever.

## LAW 2 — behaviour is additive, never a replacement

```js
api.addBehavior('player', 'scripts/novo.js');   // right — additive, parallel-safe
api.patchPlayer({ behavior: ['scripts/novo.js'] });  // THROWS, applies nothing
```

that second line is not a silent clobber in this engine — it throws a teaching
error naming `addBehaviorScripts`, and the player template is left untouched. good.
what *does* clobber quietly:

- writing the `behavior` array yourself in a spec object or a place definition,
  overwriting whatever another lane had added;
- `api.setCamera(cfg, { mode: 'replace', persist: true })` — that sets
  `spec.camera` to **exactly** what you passed, so every key you left out is
  deleted, the camera's `behavior` scripts included. a merge-persist keeps the old
  rig running alongside the new one, which is its own bug. pick on purpose.
- top-level `materials` / `structures` on terrain replace the **whole** collection.
  use the patch keys: `addMaterials`, `updateMaterials`, `removeMaterials`,
  `addStructures`, `updateStructures`, `removeStructures`.
- terrain marks are per-name only: `api.addMark(key, mark)`,
  `api.updateMark(key, patch)`, `api.removeMark(key)`. a bulk `marks` map on
  existing terrain of the same kind throws and names the marks it would have
  deleted — that throw is a feature.

one more thing worth knowing: `addBehavior` re-runs the target's **whole** behaviour
stack's `onSpawn` — but only when the list actually changes. re-adding a script
already attached is a silent no-op, so an idempotent wiring pass is safe to run
twice.

## LAW 3 — the manager is an entity, not the player

global logic (score, objectives, waves, timers, spawning) lives on a dedicated
invisible entity with `physics: 'none'`, carrying the manager behaviour. never on
the player: the player belongs to its owner, exists in N copies, and disappears when
they leave.

a clean contract: any behaviour **emits**, only the manager **decides**.

```js
// scripts/mestre-vale.js — the manager. ears armed in onSpawn, which is the only
// place they install: editing this file re-runs onSpawn and re-arms them.
export function onSpawn(api) {
  api.on('valley:action', (p) => {
    const s = api.getState();
    if (p.type === 'bone-collected') api.patchState({ bones: (s.bones ?? 0) + p.amount });
  });
}
```

```js
// anywhere else — one event, fixed name, fixed fields
api.emit('valley:action', { type: 'bone-collected', amount: 1, player: api.id, position });
```

one event with a fixed name and fixed fields is worth more than ten cross-reads of
state. three traps around it:

1. **`api.on` must be armed inside `onSpawn`.** armed anywhere else it listens to
   nothing and never complains.
2. **a `run_script` spawn's `onSpawn` runs transactionally** — handlers registered
   there never install. spawn the entity **with** a behavior script instead; its
   own `onSpawn` re-arms live.
3. **`emit` from a client-realm script never delivers** (it warns once). emit from
   replicated scripts.

a manager that has to be readable from more than one place: spawn it with
`replicate: 'world'`, in the default place (which never unloads). reads from other
places are about one hop stale — fine for a score, not for a hit.

## LAW 4 — one system for many, not one behaviour each

a hundred objects with a behaviour each is a hundred `update()` calls per frame. one
system sweeping the list and writing in batch is one. for cohorts (animals,
projectiles, gameplay particles, towers), write the system.

and declare the step instead of counting ticks by hand:

```js
// scripts/vale-bichos.js — one system, 40 animals, declared cadence
export const updateSchedule = { every: 3, near: { tag: 'player', radius: 50 } };

const ids = [];            // built in onSpawn
const xyz = new Float32Array(40 * 3);

export function update(dt, api) {
  // dt already arrives as the 3-tick step (0.1 s at 30 Hz) — integrate normally.
  // NO `if (api.getTick() % 3)` here. see below.
  api.readPositions(ids, xyz);
  for (let i = 0; i < ids.length; i++) xyz[i * 3 + 1] += Math.sin(i + dt) * 0.02;
  api.setPositions(ids, xyz);            // one batched write, not 40 property sets
}
```

**declaring `every` REPLACES a hand-rolled `tick % N` gate — never keep both.** the
engine gives each entity its own deterministic phase so a cohort spreads itself
across ticks; your gate has its own phase, and the two rarely coincide. a script
that keeps both mostly stops running, and the symptom is "it works for some of them".

`every: 3` at this engine's measured **30 Hz** is 10 updates per second. `near`
wakes the system only while a tagged entity is inside the radius. and when one
entity needs full rate for a moment — aggro, a sprint, a burst — that is the
override, side-local and never persisted:

```js
api.setUpdateSchedule({ every: 1 });   // on entry: merges per key over the export
api.setUpdateSchedule(null);           // on exit: back to the declared cadence
```

keep `every` at 3 or lower for anything re-asserting an intent every tick (`moveTo`,
`face`): at 4+ the intent decays between pulses and the motion stutters back to idle.

## LAW 5 — the network has a ceiling

every transform write replicates. a thirty-bone skeleton written every tick is 900
messages per second per player, and the budget blows before you notice — the symptom
that reaches you is "it's lagging", never "it's replicating too much".

measured on this engine: `api.seconds(1)` returns **30**, `api.getDeltaTime()`
returns **0.03**. so:

| cadence | writes/second | what it is for |
|---|---|---|
| `every: 1` | 30 | the player's own body, a hit, a projectile |
| `every: 2` | 15 | a nearby NPC's skeleton |
| `every: 3` | 10 | a full-body skeleton at distance, ambient cohorts |
| `every: 6` | 5 | idle breathing, foliage sway, a flag |

there is no integer divisor that gives 20. choose by what the eye asks for — a
full-body skeleton holds up at 10-15 Hz with the engine's interpolation smoothing
underneath.

- **threshold**: do not write a bone that moved less than ~0.2° or ~0.5 mm. at 6 m
  with a normal vertical fov one screen pixel is about 6 mm of world, so 0.5 mm is a
  twelfth of a pixel — you are paying full network price for nothing.
- **write in batch**: `api.batchSetObjectProperties(updates)` for mixed properties,
  `api.setPositions(ids, xyz)` for pure position, `api.readPositions(ids, out)` with
  a reused buffer on the read side.
- **no sine above ~1/4 of the write rate.** at a 10 Hz write rate the ceiling is
  2.5 Hz; above that the movement turns into a tremor wearing another frequency's
  name.
- **persistence is not free.** each `api.withPersistence(...)` scope costs a flat
  ~0.25 s stall on the client no matter how much is inside it. so batch into the
  **fewest** scopes that fit and ration when they run — slicing one batch into 8
  scopes is 2 seconds of freeze.

## LAW 6 — never swallow an error

```js
try { animate(dt); } catch (e) {}      // this is a silent statue waiting to happen
```

an empty `catch` in animation turns a one-line error into a character that simply
stops moving — no log, no clue, for weeks. if you need a `catch`, it **speaks**:

```js
try {
  animate(dt);
} catch (e) {
  api.warn('animator crashed: ' + e.message);
  api.notifyDmOnce('rabbit-animator-crash', 'the rabbit animator crashed: ' + e.message);
}
```

and `api.log` inside `update()` usually does not reach the server log — for a loop
heartbeat use `api.notifyDm` / `api.notifyDmOnce`, or publish into a state field you
can read afterwards with a probe.

## LAW 7 — probe before you theorise

the order that saves you an hour:

1. **look.** `view_live_scene` — a visual bug is solved with the eye, not by reading.
2. **measure.** a `readOnly` `run_script` probe that returns **chosen fields** (never
   the whole state: a big result gets truncated) and carries **the size of the set it
   scanned** plus min/max distance — that way a wrong filter turns itself in instead
   of looking like "found nothing".
3. **read the log.** `getLogs({ level: 'warn' })` — behaviour errors, a missing clip,
   a budget warning. it takes a query: `{ objectId, behavior, level, since, limit }`.
4. **only then** read the code, and read the WHOLE file before rewriting a piece of
   it — the sediment argument is `gavi#raciocinio-maximo` §3.

fixed it twice and the symptom came back? the problem is not where you have been
touching. go up a floor: contract, state owner, execution order. the full hunt is
`gavi#cacar-bugs-jogando`.

## LAW 8 — the file is read by whoever comes next

- one subject per file. helpers in `lib/`, data in `lib/data/*.json`, UI in `ui.js`.
  `require()` resolves **only** `builtin/*` and `lib/*` — no URLs, no dynamic
  `require`.
- name things after the fiction, not the machine: `whatsLeft`, not `resourceCount`;
  `strangerAtTheDoor`, not `npcEntity`. the ENGINE's own names are never translated:
  the tag it stamps on the player's body is `'player'`, in English — a query for
  `'jogador'` finds nobody and never complains.
- a number that came from the creator's request carries its provenance in a comment:
  `// his request: jump 12`. that is what decides, months later, whether that number
  defends itself or gets tuned.
- any config you feel the urge to tune leaves the code and becomes JSON in
  `lib/data/`.
- sandbox laws, absolute: `api.random()` not `Math.random`; `api.runInSeconds()` /
  `api.runInTicks()` not `setTimeout`; `update(dt, api)` as the loop; behaviours
  export functions, nothing runs at module top level that needs the world.
- dev-only conveniences (test spawners, debug HUDs, level skips) gate on
  `api.getRoomMode() === 'dev'` — it reads `"live"` in the published game, for
  everyone, with no account checks.

## LAW 9 — prove it before you say it's done

`validate_spec` clean (and read its `warnings` — those name keys that validate and
do **nothing**), `getLogs()` with no new error, and **an eye on what changed**.
"should work" is not a delivery state.

the one who plays is the one who says it is fixed — until then, what exists is a
bet, and it is worth saying in one line how that bet can lose. the whole-game sweep
is `gavi#testar-tudo`; the visual ruler is `gavi#qualidade-sem-falha`; what you
learned goes into the record so next session does not rediscover it —
`gavi#memoria-infinita`.

## LAW 10 — one simulator per entity, and knockback proves it

every entity has exactly one simulator: its owner's client, or the place host. your
code runs there and replicates everywhere else. that single fact explains a whole
class of "it works for me and not for him":

- `api.addObjectImpulse(id, ...)` pokes the **local** physics body. on your own
  spawns and hosted NPCs it works; on another player's avatar it silently no-ops,
  because that body is a follower here. knock a **player** back by writing state —
  `api.patchObjectState(id, { knockVx: 9 })`, an assignment, never `+=` — and let
  their own movement script integrate it.
- durable saves key on `api.userId` (the stable account id), never on `api.id` (the
  per-session entity id, which changes every join). fence a stale reconnecting tab
  with `AND session_seq >= ${api.sessionSeq}` in the `WHERE` clause.
- `api.isLocalPlayer` is true only where that player's own eyes are. gate
  presentation-only work on it — viewmodels, camera-attached rigs, local cosmetic
  spawns — so it mints once, for the right eyes. state and physics writes belong
  wherever the script runs.
- `api.destroy(id)` takes everything that entity spawned, recursively. a child that
  must outlive its parent (a death drop, a split shell) is spawned by a long-lived
  manager reacting to an event, not by the dying thing.

---

# part two — the tier above

laws 1-10 keep the game from falling apart. the six below are the difference between
code that compiles and code that is actually good, and it is the same six habits
every time: ground the call before you write it, distrust anything you derived once,
respect the clock while you wait, change a live system on a seam, measure before you
tune, leave the file adoptable. this tier is modelled on how the strongest coding
systems actually work — which is not talent, it is order of operations, and order of
operations is something you can just decide to do.

## LAW 11 — never write an identifier you have not read

the line at the top of this file — every call checked against the engine's own
reference before it was written down — is not a boast. it is this law applied to
this file.

the habit, and it is the whole law: **the grep goes in the same breath as the
write.** not after it compiles. not after the creator reports it broken. you are
about to type `api.getWorldBoundsBox(id)` — grep it first, read what it hands back,
then type the line. four seconds. the alternative is a plausible-looking call that
does not exist, or exists with its arguments the other way round, and the creator
finds it for you.

```
grep pattern: "getWorldBoundsBox"  path: ""
→ getWorldBoundsBox(objectId?: string): WorldBoundsBox | null
→ "while a model's geometry is still loading the box is the spec-declared
   layout placeholder flagged geometryPending: true"
→ null means UNKNOWN YET, never zero size
```

that read just bought you three things you would otherwise have guessed: the
argument is optional, the answer can be null, and null does not mean empty.

**argument order is half of grounding.** these are the ones that get typed backwards
from memory:

```js
api.readPositions(ids, out);          // fills out, RETURNS out — ids first
api.setPositions(ids, xyz);           // xyz is stride-3, same order as ids
api.writeField(name, center, radius, fn);   // the function is LAST
api.spawn(spec);  api.spawn(id, spec);      // two forms, id first when given
api.patchObjectState(id, patch);      // id first — the reverse reads fine and does nothing
api.decal(position, normal, opts);    // texture is required, inside opts
```

**and every call has three failure shapes. check which ones it has, every time:**

| the call answers | when that happens | the branch you owe it |
|---|---|---|
| **`null`** | `getObject` on a despawned id · `getTerrainHeight` where the place has no terrain · `getCamera` / `getViewAngles` before the first frame · `worldToScreen` behind the camera plane · `getFxState` on an object with no fx · `getWaterLevelAt` on dry land | `if (!x) return;` before the first field read |
| **an empty array** | `query` with a tag nothing carries · `getObjectChildren` on a leaf · `getBoneNames` before the skinned asset loads · `getTouching` with no physics body | check `.length`, never index `[0]` blind |
| **it throws** | `patchPlayer({ behavior })` · a bulk `marks` map on live terrain · wrong-shape juice args | let it throw, or catch and **speak** (LAW 6) |

code that handles only the happy path is a bug with a delay fuse. it ships green,
and it goes off on the frame something is loading, or dead, or off screen.

and read what null actually **means**, because two of them are traps:

- `getWorldBoundsBox` null = "unknown yet, still loading" — not zero size. treating
  it as zero centres your build at the origin.
- `isVoxelSolid` / `getVoxelMaterial` null = "that chunk is not resident here" — not
  air. null is falsy, so a movement gate keeps working; a `=== false` check is the
  only honest "confirmed empty".
- `getObject(id)` null = gone, or never here (wrong place). the difference matters
  and only a place check tells you which.

one last grounding fact, and LAW 12 is built on it: **`api.spawn()` hands back the
real id, and for a parented spawn that is not the id you asked for.** it is
`<parentEntityId>/<requestedId>`, all the way up the chain. keep what it returned.

## LAW 12 — the stale derivation, the most expensive class there is

a value derived once and cached behind a gate that can never fire again. it never
throws. it just quietly keeps addressing something that no longer exists.

**the fingerprint**, so you can recognise it before it costs you a week:

- nothing throws, nothing crashes, the log is not empty — it has *one* warning
  repeating every single frame that nothing reacts to
- the feature "worked yesterday"
- the code addresses a thing by an id or a reference nobody re-checked
- there is a boolean called `built`, `ready`, `initialised` or `didSetup` in scope

### the worked case, real, from this game

`scripts/steve-body.js` — the player's body is geometry, a rig of boxes the animator
poses. it held the rig behind this gate:

```js
let rig = null;
let builtSkin = null;

export function update(dt, objectApi) {
  const sk = skinOf(objectApi);
  if (!rig || builtSkin !== sk.id) {   // <- the gate that can never fire again
    rig = build(objectApi);
    builtSkin = sk.id;
    return;
  }
  poseHead(rig.head); poseTorso(rig.torso); /* ...six writes, every frame */
}
```

then the body got rebuilt underneath it — a skin change whose new body never landed
on that client. `rig` was not null. `builtSkin` still equalled `sk.id`. so the gate
stayed false **forever**, and six property writes a frame went to

```
player/<pid>/steve_<pid>_v10_coelho_root      ← what the rig still pointed at
steve_<pid>_v10_root                          ← the body actually standing there
```

the engine said exactly what was wrong, every frame, for the rest of the session:

```
Tome batchSetObjectProperties: ignored 6 missing targets
```

and nothing else broke. the character stood there posing a ghost. nobody looked,
because nothing was on fire.

**the fix shape — four moves, and this is the general shape, not a Steve detail:**

1. **keep the ids the spawn RETURNED.** never the id you asked for, never a string
   you respelled. `let parts = {}` filled from the return value of `spawn`.
2. **re-derive by walking the live tree, not by trusting a flag.** `getObjectChildren`
   down from the player, key each box by its short name. no id is ever spelled out:
   ```js
   function childNamed(objectApi, parentId, want) {
     const kids = objectApi.getObjectChildren(parentId);   // [] on a leaf — LAW 11
     if (!kids) return null;
     for (const k of kids) if (String(k).split('/').pop() === want) return String(k);
     return null;
   }
   ```
3. **guard the batch: drop ids not in the live set.** the engine's warning becomes
   your own branch, and the branch does something about it:
   ```js
   function put(id, key, value) {
     if (!id || !liveIds[id]) { sawMiss = true; return; }  // doomed target, skipped here
     /* ...queue it for the one batched write */
   }
   // and at the end of the frame: if (sawMiss) rigStale = true;  → re-derive next tick
   ```
4. **throttle the rebuild**, or the cure becomes the cost. `const REBUILD_GRACE = 1.5;`
   — a rebuild that cannot land, retried every frame, churns spawns instead of posing.

the gate afterwards, with the liveness check that is the whole difference:

```js
if (rigStale || !rig || builtSkin !== sk.id || !rigAlive(objectApi)) {
  const hard = rigStale || (!!rig && builtSkin === sk.id);   // we HAD a body: throttle
  rigStale = false;
  reseat(objectApi, sk, hard);   // adopt the standing body by real id, or build one
  return;
}

// rigAlive is one lookup a frame. that lookup is the difference between a rig and a ghost.
function rigAlive(objectApi) {
  if (!rig || !rig.root) return false;
  return !!objectApi.getObject(rig.root);
}
```

### the general law

**any "built once" flag owes an answer to: what if the thing it built is gone.**
write the answer in the same edit as the flag. if you cannot answer it, you do not
have a cache — you have a countdown.

where this class hides, all the same shape: a cached id · a cached bounds box · a
cached `getPlayers()` array in a module variable · a cached terrain height across a
sculpt · a cached socket position across a model swap · a cached child list across a
rebuild. everything derived from the world is a **photograph of one frame**, and the
world does not know you kept it.

and know what a module-level `let` in a behaviour actually survives: a script edit,
yes (the module reloads, the world does not) — which is exactly why re-deriving
beats rebuilding. a world restart, no. the entity being simulated somewhere else,
no. so the re-derive path is not a fallback you might need. it is the normal path.

## LAW 13 — the world moves while you wait

the grounded signatures, because the two forms are not interchangeable:

```
job<T>(jobId, args, callback?, options?): string   // returns a requestId
awaitJob<T>(jobId): Promise<JobResult<T>>          // async lifecycle hooks and cron ONLY
cancelJob(requestId): void

JobResult = { ok, data?, error?, durationMs }
JobError  = { message, code?, retriable?, attempts, deadlineExceeded?, details? }
JobOptions = { priority?: 'low'|'normal'|'high', deadlineMs?, dedupeKey?, retries? }
```

in a behaviour you use the **callback**. `awaitJob` is only usable in async lifecycle
hooks and cron, and that is the engine, not style: an awaited queue-lane job inside a
hook settles on future ticks, those run in a different request context on that tier,
and the promise gets cancelled out from under you. so `await` in a behaviour hook is
not slow — it is dead.

**the law: everything you captured before the wait may be a lie after it.** thirty
ticks a second keep going while your job is out.

| safe to hold across a wait | never hold across a wait |
|---|---|
| an entity id (a plain string) | an `ObjectView` from `getObject` |
| a `userId`, a `placeId`, a tag | a `query()` result array |
| a number you own (a score, a count) | a `feetPosition` you measured |
| the fact that you asked | a `getWorldBoundsBox` box, a `getCamera()` |

ids and numbers survive. anything **derived from a frame** does not — re-read it on
the other side. and never write back a position you measured before the wait: that is
a teleport backwards in time, and it will look exactly like a netcode bug.

```js
export function onInteract(other, api) {
  const targetId = other.id;                    // an id survives the wait
  api.job('llm:chat',
    { conversationId: 'npc:maro:' + targetId, system: 'You are Maro.', message: 'Say hi.', model: 'fast' },
    (r) => {
      if (!r.ok) {                              // the failure branch is not optional
        api.warn('maro line failed: ' + (r.error?.message ?? '?'));
        say(api, targetId, FALLBACK_LINE);      // a complete state, not a paused one
        return;
      }
      const now = api.getObject(targetId);      // RE-READ: they may have walked off, or died
      if (!now) return;
      say(api, targetId, r.data.text);
    },
    { deadlineMs: 8000, dedupeKey: 'maro:' + targetId, retries: 1 });
}
```

five things in there earn their line: the `!r.ok` branch, a fallback that is not
silence, the re-read of the target, `deadlineMs` so a job that never returns cannot
strand the game, and `dedupeKey` — which cancels the previous job with the same key,
and is your only defence against a player mashing the button and queuing eight of
the same request.

**the fallback rule.** a job that fails must leave the game in a **complete** state,
never a half-open one. no door stuck ajar, no letterbox bar with no cutscene behind
it, no player frozen waiting for a line that is not coming. decide the fallback
*before* you submit — if you cannot name it, the feature is not ready to be async.

the same law covers the async you actually write ten times more often:

```js
api.runInSeconds(1.5, () => { /* the world has moved 45 ticks. re-read. */ });
api.onModelReady(id, () => { /* the model landed. the wearer may be gone. */ });
```

timers live on the simulating side and are held through a simulator handoff — but a
departed player's timers die with their tab. a deadline that **must** survive belongs
in the spawn's `lifetime`, or as a target tick in state that `update()` checks.

## LAW 14 — change a live system on a seam

nobody can pause this game. players are inside it while you edit. so a live change
is five steps in this order, and the order is the whole technique:

1. **add** the new path beside the old one — both alive, nothing switched
2. **move one caller** to it
3. **prove it** — eye, probe, log (LAW 7), scoped to that one caller
4. **move the rest**
5. **delete the old path LAST**

between step 1 and step 5 the world always runs. that is what "on a seam" means:
every intermediate state is a state a player could be standing in without noticing.

and the rule with teeth: **never a rename and a behaviour change in the same edit.**
if it breaks you cannot tell which half did it, and now you are debugging two things
through one symptom. rename, confirm nothing changed, then change behaviour. two
boring edits beat one clever one every time.

when it does break, the version history is the bisect tool — not your memory of what
you touched:

```
versions find_change   query: "rigAlive"        → when that line last moved
versions inspect       from_offset: -5          → the last five changes, summarized
history/changes/<file>                          → that one file's whole arc, readable
versions restore_file  path + version           → ONE file back to its exact stored body
versions revert        offset: -1               → the WHOLE spec back a version
```

`restore_file` is the surgical one: one file back verbatim, the rest of the game
stays at head. `revert` is the blunt one: a whole version reloaded and saved as new.
know which you want before you type it — reverting the world to undo one file throws
away everything else that landed since.

and for scripts already attached and running: do not save a broken intermediate. the
attached-script source update lands in the **same** pass as the `patchInputs` /
`patchPlayer` / `patchCamera` wiring that depends on it. `gavi#construir-ao-vivo`
owns that deploy order.

## LAW 15 — performance is a measurement, never a feeling

**read the lean first.** cpu-leaning and gpu-leaning have disjoint fixes, and
guessing wrong costs a whole session — you spend it merging draw calls while the real
cost was four hundred `query()` calls a tick.

this room, measured. these are the numbers to reason with; do not invent others:

| what | measured, here |
|---|---|
| sim tick | **30 Hz** — `api.seconds(1)` → 30, `api.getDeltaTime()` → 0.03, `api.seconds(0.5)` → 15 |
| the creator's client | desktop 1910×948 @1x |
| adaptive quality | rung **5 of 5** — the floor |
| renderScale | **0.55** |
| bloom | skipped |
| frame | **~23-30 ms** against a **12.1 ms** budget (82.5 Hz monitor) |

two things follow from that table before you write a line. first: the quality
governor is already at the bottom of its ladder — renderScale down to 0.55, bloom
off. it has spent everything it had, so anything you add from here is paid at full
price by the frame. second: `DEFAULT_TICK_RATE = 60` in the engine source is a
**fallback**, not this room's rate. a previous lane "corrected" five lines to 60 Hz
and was wrong. the measurement beats the constant, always — and if you need the rate,
ask the room: `api.seconds(1)`.

**the decision table:**

| the tell | lean | the cost is | what to cut |
|---|---|---|---|
| `getClientHealth()` says `gpuOverBudget: true` | **gpu** | the engine already told you | go straight to the gpu row below — no window-drag needed |
| shrinking the window helps | **gpu** | fill — it is literally pixels | overdraw, particle quads, transparent layers stacked |
| shrinking the window changes nothing | **cpu** | ticks | cadence, query count, per-object behaviours |
| frame time tracks the entity count | **cpu** | work per tick | one system instead of N behaviours (LAW 4), batch the writes |
| frame time tracks what is on screen | **gpu** | what is drawn | draw calls — `api.unionSolid` static box piles into one mesh; shadow-casting lights; texture size |
| rung at the floor, renderScale down, still over budget | **gpu** | fill and draw calls both | cut geometry and overdraw; the governor has nothing left to give |
| a ~0.25 s hitch during a build pass | neither | `withPersistence` scopes | batch into the fewest scopes (LAW 5) |
| it stutters only while things move | **replication** | the write rate | threshold and cadence (LAW 5) |

the window-drag is the cheapest lean read you can do with your own hands, and it
costs nothing — but ask the engine first, because it already knows.

**there is a call that just answers the lean.** `api.getClientHealth()` is the
perf-truth probe — not in the api-reference index, real in the engine source
(``, ledger #439) and run live in this
room. per connected client it hands back:

```
quality: { rung, bottomRung, rungId, renderScale, skipBloom, forced,
           refreshTargetHz, budgetFrameMs, frameMs, inGrace,
           gpuOverBudget, intervalCapped, deviceClass, recentTransitions[] }
```

`frameMs` against `budgetFrameMs` is the frame time, and **`gpuOverBudget` is the
lean, stated by the engine** — no guessing at all. one caveat that matters: reports
land about every 15 s (`ageSeconds` says how stale), so **one read is a moment, not a
verdict.** two reads on this same machine, two minutes apart, gave
`rung 5/5, renderScale 0.55, bloom skipped, ~23 ms vs 12.1 ms (82.5 Hz)` and then
`rung 2/5, renderScale 1, ~7 ms vs 12.1 ms (82.5 Hz)`. quote a pair, never a single
sample — and note that `budgetFrameMs` is the DISPLAY's refresh, which is this
machine's 82.5 Hz and has nothing to do with the 30 Hz sim tick 36 lines up.

then the rest of the instruments, all grounded:

- `getLogs()` — the room's log: behaviour errors, budget warnings, `ignored N missing
  targets`. a restart wipes it, so empty after a restart proves nothing. it is not an
  array: it is a wrapper with `logs`, `count`, `truncated` — read `.count`.
- `view_live_scene` — the frame, and its caption says what the frame actually carries.
- `preview_object` — one object alone, with a perf readout. this is how you find the
  single prop that costs what forty should.
- `api.query({ tags: ['bicho'], select: 'ids' }).length` — the census. `select: 'ids'`
  skips materializing tags/position/state, so counting is cheap.
- `api.getFxState(id)` — the expected alive particle count for an emitter, derived
  from its program. an uncounted particle system is the usual gpu answer.
- `api.getWorldResidency()` — `{ resident, pending }`. `pending` counts asset loads
  and terrain chunks still in flight; a world that is still streaming is not slow.

**the cadence arithmetic at 30 Hz, out loud**, because this is the cheapest cpu fix
there is and it gets guessed instead of divided:

```
every: 1   → 30 updates/s    the player's own body, a hit, a projectile
every: 2   → 15 updates/s    a nearby NPC's skeleton
every: 3   → 10 updates/s    ambient cohorts, a skeleton at distance
every: 6   →  5 updates/s    breathing, foliage sway, a flag
every: 15  →  2 updates/s    a weather check, a day-cycle nudge
```

**a manager almost never needs more than 10 Hz.** a wave timer, a score, an objective
check, a spawn budget — `every: 3`, and no player will ever perceive the difference,
and you just cut that manager to a third of its cost. if you go faster than 10 Hz,
write down *why* in the same line; that comment is what stops the next hand from
raising it "just to be safe".

`near: { tag: 'player', radius: 50 }` is free performance: a cohort nobody is looking
at should not be thinking. and keep `every` at 3 or lower for anything re-asserting
an intent each tick — LAW 4 has the reason.

## LAW 16 — the next hand adopts this file, or it dies

- **one concern per file.** an animator animates. a spawner spawns. a file named for
  two things becomes a file nobody dares to edit, and then it grows a third.
- **provenance on every tuned number.** not what it does — whose decision it was and
  when. that is the only thing that tells a later hand whether to defend the value or
  tune it:
  ```js
  const WALK_ON = 0.5;        // m/s to start walking
  const WALK_OFF = 0.35;      // ...and to stop, so the boundary can't flicker
  const REBUILD_GRACE = 1.5;  // 2026-08-04, the ghost-rig hunt: any less and a body
                              // that cannot land respawns every frame
  const JUMP = 12;            // his request, 2026-08-02: "higher jump" — defend this one
  ```
  a bare `1.5` is a landmine. nobody knows whether it is load-bearing, so everybody
  leaves it alone, and it is still wrong a year later.
- **names from the fiction** (LAW 8) — and the engine's own names never translated.
- **the caseback law.** the back of a watch is finished even though it faces the
  wrist. the parts nobody looks at are finished too: the error branch, the
  empty-array case, the comment on the number, the owner line at the top of the file.
  a strong system is recognisable by the quality of the parts that never had to be
  good.

and one review pass, which is the single habit that separates this tier from the one
below it: **after you write, read it once as the person who did not write it.** every
call grounded? every derived value re-derivable? every wait re-reading on the other
side? every tuned number carrying its provenance? that read costs two minutes and is
the cheapest bug fix in existence — the one you make before the bug.

---

## How the code goes wrong

1. **two writers on one field.** TELL: the value is right on one frame and wrong on
   the next, and nothing ever throws. FIX: `grep` the field name across `scripts/`,
   count the **writers**, delete all but one (LAW 1).
2. **the kept `tick % N` gate.** TELL: you added `updateSchedule = { every: 3 }`,
   the old gate is still in the body, and now the cohort barely moves — some
   entities never at all. FIX: delete the gate line. the engine's per-entity phase
   and your modulo almost never line up (LAW 4).
3. **ears armed outside `onSpawn`.** TELL: `api.emit` fires, the manager's handler
   never runs, the log is clean. FIX: arm in `onSpawn`; if the entity was spawned
   from `run_script`, give it a behavior script instead of registering handlers in a
   transactional hook (LAW 3).
4. **the silent `catch`.** TELL: a character froze in a T-pose or mid-stride and
   there is nothing in `getLogs()`. FIX: every `catch` gets `api.warn` +
   `api.notifyDmOnce` (LAW 6).
5. **the replace that ate another lane.** TELL: a feature that worked last week is
   gone and no file mentions it. FIX: `history/changes/<file>` on the spec write;
   then LAW 2 — `addBehavior`, the `add/update/remove` patch keys, marks by name.
6. **persistence sliced thin.** TELL: the client hitches ~2 s during a build pass.
   FIX: count your `withPersistence` scopes. 8 × 0.25 s is the hitch; batch into one
   (LAW 5).
7. **knockback that works for you and nobody else.** TELL: your own hits launch, the
   other player's avatar shrugs it off, no error anywhere. FIX: LAW 10 — write state,
   let their simulator integrate it.
8. **the call that does not exist, or takes its arguments the other way.** TELL: a
   plausible line, a clean-looking file, and a runtime error the creator finds before
   you do — or worse, silence, because the wrong order was still valid. FIX: LAW 11 —
   grep it in the same breath as writing it, and give it the branch for whichever of
   the three failure shapes it has.
9. **the stale derivation.** TELL: the same warning every frame — classically
   `batchSetObjectProperties: ignored N missing targets` — and nothing else broken. a
   feature that "worked yesterday". FIX: LAW 12 — keep the ids `spawn` returned,
   re-derive by walking the live tree, gate the batch on the live set, throttle the
   rebuild.
10. **the stale capture across a wait.** TELL: after a job or a timer, something
    lands in the wrong place, or on an entity that is gone, or a position snaps
    backwards. FIX: LAW 13 — hold ids, re-read everything derived from a frame, and
    give the job a `deadlineMs` and a named fallback.
11. **the perf session spent on the wrong lean.** TELL: an hour of cutting draw calls
    and the frame time did not move. FIX: LAW 15 — read the lean first (drag the
    window: if it helps, it is gpu), then cut on that side. cpu is cadence and query
    count; gpu is fill and draw calls.