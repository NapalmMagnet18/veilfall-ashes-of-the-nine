---
name: Hunt Bugs By Playing
description: The /gavi-hunt doctrine — kill a bug by PLAYING it. Reproduce, read getLogs() BEFORE theorising, isolate, measure with a probe that incriminates itself, check your own edit actually landed, fix the smallest thing, prove it with a frame. What each instrument really proves and what it never proves, the bug that only exists for somebody else, a fix that misses twice being one floor up, performance treated as a bug, and playtest sensors that report back later. Plus the professional tier: the written minimal reproduction and its rate, bisecting with versions instead of staring, every instrument's false negative (a server query cannot see a client-realm arm), the five-layer escalation when a fix misses twice, instrumentation that outlives the session, and the ruled-out list.
---

# Gavi — hunting bugs by playing

## pick the path in 10 seconds

| the situation | what to do |
| --- | --- |
| somebody just reported something | §1 step 1: turn the sentence into steps with numbers. no steps = a rumour |
| you have a theory and haven't read the log | **stop**. `getLogs()` first (§1 step 2) — half the hunts end there |
| you know the symptom, not where to look | §2 symptom → first instrument |
| you're about to trust a tool | §3 — what it proves vs what it never proves |
| "works for me" | §4 — you own everything on your own screen. two clients |
| "it lags" | §5 — `api.getClientHealth()` on the complainer's machine, then cut in order |
| your fix changed nothing at all | §6 — prove your edit landed before you blame the engine |
| the same symptom survived two fixes | §8 third-round rule — the cause is one floor up. ship a diagnosis |
| you can't write the steps down | §10 — then you have a complaint, not a bug. intermittent? count it: "4 of 20" |
| "it worked yesterday" | §11 — bisect: `versions find_change`, then `inspect` that one pair. don't re-read the file |
| a tool came back clean | §12 — every instrument's false negative. a clean reading is not an all-clear |
| your second fix missed too | §13 — the LEVEL is wrong, not the theory. five layers, and round three is a diagnosis |
| the same bug keeps coming back | §14 — wire the game to report itself, and delete probes the same session |
| you're about to close it | §15 — write down what you RULED OUT, or the next hand re-walks the dead end |
| it has to keep being true tomorrow | write the autopsy line: `gavi#memoria-infinita` |
| "does the whole game still work?" | that's the sweep, not a hunt: `gavi#testar-tudo` |

You don't find a game bug by reading code. You find it by **walking through the world and
looking**. Reading comes afterwards, only to confirm the cause the eye already pointed at:
a correct file and a broken game look exactly the same in text (`gavi#animar-verificar`).

## LAW ZERO — the symptom is the player's, the cause is yours

> **Fix nothing before you have watched the symptom happen.**

"It's gone", "it lags", "it walks crooked" describe a frame, not a cause. Your first job
is getting hold of that frame. Without it, everything you write is a guess with a
technical accent.

## 1. The hunt loop, in this order

**1. Reproduce — exactly what the person did.** Translate the sentence into steps with
numbers: where they were (x, z), which input they pressed, how many seconds later, how many
players in the room, in which place (`place`). With no steps there is no bug, there's a rumour.

**2. Read the log BEFORE you theorise.** `getLogs()` is the room's in-memory log: behavior
errors, missing clips, engine warnings, plus a small allowlisted slice of client reports. It
costs one call and it ends a good share of hunts on the spot — a thrown hook, a clip name that
doesn't exist, a refused write. Two honesties about it: **a restart wipes it** (empty right
after a restart means nothing at all), and **most client renderer events never reach it**, so
empty logs never clear the client. Theory built before this read is theory you'll have to
throw away.

**3. Isolate — the shortest sequence that still breaks.** Cut one step at a time. Breaks
without the jump? The jump isn't the cause. Breaks with a single player? Not the network. Only
after changing place? That's the transition, not the movement. A step you can drop is a dead
hypothesis — and killing hypotheses is the job.

**4. Measure — a probe that incriminates itself.** Return **chosen fields** (never the whole
state: a big result gets truncated) and always bring back **the size of the scanned set and
the min/max distance** — a wrong filter has to accuse itself, instead of answering "found
nothing" and you believing it.

```js
// run_script readOnly — why isn't the critter chasing?
const { distance } = require('builtin/vec3');
const center = getPlayers()[0].feetPosition;
const RADIUS = 40;
const scanned = api.query({ radius: 200, center: center, select: 'ids' });   // the universe
const found = api.query({ tags: ['critter'], radius: RADIUS, center: center }); // the filter
const ds = found.map((b) => distance(b.feetPosition, center));
return {
  player: center,
  scanned: scanned.length, // 0 HERE = wrong place or wrong center, not "nothing nearby"
  found: found.length,     // 0 with scanned > 0 = wrong tag or wrong radius
  min: ds.length ? +Math.min(...ds).toFixed(1) : null,
  max: ds.length ? +Math.max(...ds).toFixed(1) : null, // max ≈ RADIUS = the radius is cutting you off
  sample: found.slice(0, 3).map((b) => ({ id: b.id, aggro: b.state.aggro, hp: b.state.hp })),
};
```

`query` scopes itself to the caller's place — with several places, pass `place`, or you
measure an empty room and conclude the world disappeared.

**5. Fix — the smallest change that kills that symptom.** If the particle's lifetime is too
long, change the lifetime. Don't rewrite the system.

**6. Check your own edit landed** (§6 below) — before any sentence about the engine.

**7. Prove it with the eye.** One frame of what changed, at the angle the person plays from —
no frame, it didn't happen. **8. Only then speak**: what you saw, not what you expect.

## 2. Symptom → the first thing to look at

| symptom | first thing to look at | what that separates |
| --- | --- | --- |
| invisible object | `identify_object` by name; `bounds: null` = it's in the spec and doesn't draw | asset cooking vs no geometry vs wrong place |
| falls through the floor | `view_live_scene` with `colliders: true` at the point of the fall | collider gap vs missing `physics` vs spawn below the terrain |
| walks crooked / slides | a `burst` of 4-6 frames at 6 m | movement direction vs pose vs the camera dictating the wrong "forward" |
| vanishes for one player only | who **owns** the entity and who **simulates** it | replication vs local effect vs `audience` |
| HUD out of place | `read_authored_ui` (receipts: compiled? sent? applied?) | a selector that doesn't match vs layout vs the reserved rail on the right |
| sound that never arrives | `api.audio.playing()` — a census of what the authority is telling to play | unreferenced clip vs self-only `audience` vs `maxDistance` |
| lag | `api.getClientHealth()` on the machine of whoever is complaining | GPU vs CPU vs environment ceiling (`intervalCapped`) |
| flickers / "works sometimes" | who writes that field (`gavi#programar-de-verdade`, LAW 1) | two lanes fighting over the owner vs tick order |
| doesn't answer the click | does the action exist in `inputs.actions`? does `onInput` run on the owner? | missing binding vs an entity that never receives input |
| animation clip frozen | `api.getChannel(name)` — `clip`, `weight`, `finished` | non-existent clip vs weight 0 vs a `catch` swallowing the error |
| walks through a wall that should block | `colliders: true` + `api.overlapSegment(a, b, { radius })` | collider off the visual vs `visible: false` without `physics: "none"` |
| appears in the void when changing place | `y: { terrain: 0 }` at the entrance and that place's `defaultSpawnPoint` | inherited fixed height vs different terrain in that place |

## 3. Tool → what it proves / what it does NOT prove

| tool | proves | doesn't prove |
| --- | --- | --- |
| `view_live_scene` with no argument | the client's frame, with the authored UI composited in | nothing about anybody else's screen |
| `view_live_scene` + `camera` / `frame` | geometry, material, silhouette, what is where | rhythm, input, UI (those frames are 3D only) |
| `view_live_scene` + `burst` | movement, foot slide, cadence | a pose the current state never triggers |
| `view_live_scene` + `colliders: true` | invisible wall, collider off the drawing, live-vs-spec drift | why the collider is like that |
| `identify_object` | what that thing there is (screen, point, ray, name) — render truth | a spec-only object that doesn't draw (comes back `bounds: null`) |
| `run_script` readOnly | numbers: position, state, count, distance | how it looks on screen |
| `getLogs()` | behavior error, missing clip, engine warning, a few client lanes | nearly every client renderer event; a restart wipes the log |
| `validate_spec` | the spec against the schema; `warnings` = a key that validates and does nothing | behavior, performance, visuals |
| `read_authored_ui` | your UI's DOM inside the realm + delivery receipts | pixels (healthy receipts with zero matches = wrong selector) |
| `preview_object` | shape and material of ONE isolated object | nothing about the world — behaviors don't run in the booth |
| `api.getClientHealth()` | rung, `renderScale`, `frameMs`, GPU vs CPU per device | the cause; and it's up to 15 s old (`ageSeconds`) |
| reading the code | contract, name, owner, arithmetic | absolutely nothing visual |

The frame's caption tells you when the paint is still **cooking** — a frame can be honest with
the asset missing. And "failed to serve" is terminal, it never settles: rename it with a `-2`
and move the refs.

## 4. The bug that only exists for somebody else

"Works for me" is the most expensive symptom there is, because on your screen you are the
**owner** of everything you tested. Each entity has **one** simulator — its owner's client or
the place host: your code runs there and replicates from there.

- `onInput` only fires on the player or on the controlled entity;
  `onTriggerEnter`/`onTriggerExit` only reach whoever **owns the trigger** (which needs
  `{ body: 'static', trigger: true }`);
- in multiplayer, everything that is **screen** (`screenShake`, `screenFlash`, `hitstop`,
  `toast`, positionless sound) is **self-only**: `nearby`/`place`/`all` reach nobody and log the miss;
- `pushLook`/`pushAtmosphere` fed from replicated state without the `player` field paint
  **everybody's** screen; another player's `userId` and `isEditor()` never reach client code;
- `getWorldResidency()` answers for the machine the script runs on: on the server it is always
  resident, so a loading gate on a server object lies to every client.

```js
// WRONG in multiplayer: the other player's body is a follower on this machine —
// this does nothing and doesn't complain.
api.addObjectImpulse(otherId, 8, 0, -3);
// RIGHT: write state (assignment, never +=) and let THEIR script integrate it.
api.patchObjectState(otherId, { pushVx: 8, pushVz: -3 });
// Presentation (viewmodel, rig on the camera, cosmetic spawn) is born on the right machine:
if (!api.isLocalPlayer) return;
```

Reproduce with **two** clients before you say anything about an "only he sees it" bug. One
client tests half the game.

## 5. Performance is a bug, not a preference

The floor is 60 fps, phones included: **16.7 ms per frame**. Thirty fps is a defect, not a
style. And the machine that matters is the player's — go and ask it:

```js
// run_script readOnly — quality telemetry per device (up to 15 s old)
return api.getClientHealth().clients.map((c) => ({
  who: c.displayName, age: c.ageSeconds,
  summary: c.qualitySummary,         // "...GPU-leaning at ~24ms/frame vs 16.7ms budget"
  rung: c.quality?.rung,             // 0 = as pretty as it gets
  bottom: c.quality?.bottomRung,     // the cheapest frame this build has
  scale: c.quality?.renderScale,     // 1 = full pixel; 0.55 = half the detail
  noBloom: c.quality?.skipBloom, halfRate: c.quality?.halfRate,
  gpu: c.quality?.gpuOverBudget,     // true = leaning on the GPU
  capped: c.quality?.intervalCapped, // true = environment ceiling, nothing of yours fixes it
}));
```

| reading | leans on | cut, in this order |
| --- | --- | --- |
| `gpuOverBudget: true`, `renderScale` falling, `skipBloom: true` | GPU | 1) particles/sprites (tens of thousands is cheap; ~100 thousand alive is where it hurts — belt it with `maxParticles`) · 2) lights with shadow on · 3) a repeated CDN mesh turning into a forest |
| high `frameMs` with the GPU inside budget | CPU | 1) the `update()` count per frame (one system for the cohort, not a behavior per object) · 2) `updateSchedule = { every: 3 }` / `{ near: { tag, radius } }` · 3) dynamic props: ~250 comfortable, 400 is the ceiling |
| stutters only at peaks (a wave, an explosion) | burst | spread the spawns out at ~100-200 per tick |
| `intervalCapped: true` | environment | **nothing** — the engine already verified that cutting buys no speed there |

Network writes are the last cut and the most invisible: every transform replicates, and the
symptom that reaches you is "it's lagging", never "it's replicating too much"
(`gavi#programar-de-verdade`, LAW 5). And the etiquette: a performance warning is
**informative** — measure it, name the cost and **ask** before cutting art the person asked for.

## 6. Check your own edit landed before you blame the engine

The most embarrassing hunt is the one where the fix was never in the world. It happens four
ways, and all four look exactly like "the engine ignored me":

1. **the save never happened** — invalid JS sits in an unsaved draft, not in the live spec;
2. **the script isn't attached to the thing you're testing** (or it's attached to the spec
   twin while you're poking a runtime-spawned copy with the same look);
3. **a runtime write got overwritten** — an every-tick behavior rewrites that property each
   tick, so your one-off `setObjectProperty` lived for 33 ms;
4. **you fixed it in the wrong place** — same id, different `place`.

Three reads answer all four. Leave a sentinel string in the edit itself, then look for it:

```js
// run_script readOnly — did my edit actually land?
const path = 'scripts/critter.js';
const src = api.getScript(path) ?? '';
const ent = api.getObject('critter-3');
return {
  sentinel: src.includes('AGGRO_V2'),   // the marker I typed in THIS edit. false = the save never happened
  bytes: src.length,
  attached: api.getSpec('places.main.objects.critter-3.behavior') ?? null,  // is that script on THIS entity?
  place: api.getEntityPlace('critter-3'),   // am I even poking the copy I'm looking at?
  liveSpeed: ent?.state?.speed ?? null,
  specSpeed: api.getSpec('places.main.objects.critter-3.state.speed') ?? null,
};
```

`liveSpeed !== specSpeed` means a runtime-only write: true for this session, gone on the next
load. `sentinel: false` means stop hunting — you're testing the old file. Only after all
three read the way you expect does a sentence about the engine become honest.

## 7. The playtest that carries on with nobody watching

Say the truth to their face: **nothing runs with the page closed.** An authoring session exists
while the creator is in the room. What does exist is the game **recording** and reporting
afterwards — and that's worth nearly the same, because the report waits for the person to come
back. Plant sensors on the heartbeats, not on everything.

```js
// scripts/boss-room.js — needs { body: 'static', trigger: true }
export function onTriggerEnter(other, api) {
  if (!other.tags.includes('player')) return;
  api.notifyDmOnce('boss-first-entry', `somebody walked into the boss room (tick ${api.getTick()})`);
}
```

```js
// scripts/sensors.js — heartbeats with a number, in the behavior of whatever moves
export function update(dt, api) {
  const s = api.getState();
  const p = api.getProperty('feetPosition');
  // a fall over 8 m: where the world has an edge nobody drew
  if (s.peakY && p.y < s.peakY - 8) {
    api.notifyDm(`fell ${(s.peakY - p.y).toFixed(1)} m at x${p.x | 0} z${p.z | 0}`);
    api.patchState({ peakY: null });
  }
  // frozen clip: the symptom the player never knows how to name
  const ch = api.getChannel('base');
  const same = ch && ch.clip === s.lastClip;
  const stuck = same ? (s.stuckTicks ?? 0) + 1 : 0;
  const shout = same && stuck > api.seconds(15);
  if (shout) api.notifyDm(`clip '${ch.clip}' stuck for 15 s with the state changing`);
  api.patchState({ stuckTicks: shout ? 0 : stuck, lastClip: ch?.clip });
  // a catch that TALKS — a swallowed error becomes a silent statue for weeks
  try { animate(dt, api); }
  catch (e) { api.log('animator crashed: ' + e.message); api.notifyDmOnce('animator-crashed', e.message); }
}
```

The six worth having in any game: walked into the boss room · died (and **where**) · a fall
over N metres · frozen clip · the animator's `catch` · objective completed. `notifyDmOnce` for
"the first time that", `notifyDm` for the recurring one with a number inside.

## 8. Autopsy — every fix turns into one line of journal

```
symptom: "I fall through the floor halfway across the bridge"
real cause: deck spawned at a fixed y; the terrain rose and the collider ended up 0.4 m below
proved: frame with colliders: true — visible gap between visual and collider
```

Without that line the next round starts from zero, and the one who pays is you in three weeks
— which is why the line goes into the journal, not into the chat (`gavi#memoria-infinita`).
**The third-round rule:** fixed it twice and the symptom came back? Stop fixing. The cause is
**one floor up**, in the contract: who owns that state, who simulates that entity, in which
order the lanes write. On the third pass deliver a **diagnosis**, not a patch — and say which
contract you suspect and what you still haven't managed to prove.

## 9. Honest vocabulary

- **"cooking"** — a conjured asset still generating: invisible until it settles, and an event firing is not a sighting.
- **"it's there"** — only with a frame in hand. A probe that returns an id is not seeing.
- **"I fixed it"** — only after the person playing says it's fixed. Until then it's a bet, and it's worth saying how the bet can lose.
- **"I don't know yet"** — a complete sentence, worth more than a beautiful theory about the wrong line.

## The professional tier

Everything above kills the bug in front of you. This tier is what stops you being wrong twice in
a row. It's modelled, plainly, on how the strongest coding systems actually work: ground the
claim before you guess, predict the number before you measure it, try to break your own theory
instead of confirming it, measure the same thing before and after, and read your own diff as if
somebody else wrote it. Nothing mystical — it's refusing to skip a step.

Start from the numbers this room actually runs on. Measured here with `run_script`, not inherited
from a constant:

| fact | value | how it was read |
| --- | --- | --- |
| sim tick | **30 Hz** — one tick is 33 ms | `api.seconds(1)` → 30 · `api.seconds(0.5)` → 15 · `api.getDeltaTime()` → 0.03 |
| behavior tick budget | **16.7 ms** = `max(8, 500 / tickRate)` | the watchdog's own warning line in `getLogs()` |
| the creator's frame budget | **12.1 ms** — their monitor is 82.5 Hz | `api.getClientHealth()`; it was 8.33 ms the window their client reported 120 Hz |
| what their frame costs now | **~23-30 ms**, rung **5/5** (the floor), `renderScale` 0.55, bloom skipped, CPU-leaning | same call |
| entities in `main` | ~422 | `api.query({ select: 'ids' }).length` |

`DEFAULT_TICK_RATE = 60` in engine source is a **fallback**, not this room's rate — a lane once
"corrected" five lines to 60 Hz on the strength of that constant and shipped five wrong numbers.
Measure `api.seconds(1)`. And those are **three different budgets** (sim tick, this client's
frame, the 60 fps design floor of §5): say which one you mean, because "over budget" with no
noun in it isn't a finding.

## 10. the minimal reproduction — written down, before any fix

The shortest sequence of actions that makes it happen, on paper. **If you can't write it, you
don't have a bug — you have a complaint.** A complaint is fine to receive and impossible to fix.

```
REPRO (the shape — an invented example; fill every line before you touch a file)
place: main   room: api.getRoomId()   mode: api.getRoomMode() → dev   players: 1
1. spawn, first person, x -200 z 227
2. hold left mouse, dig 3 blocks down
3. walk into the water at x -196 z 231 until the breath bar empties
4. respawn
expected: the arm is drawn bottom-right.   got: no arm, hotbar still works.
rate: 4 of 20 tries (20%)
```

The rate is not decoration. **A fix for a 100% bug and a fix for a 20% bug are different fixes:**

| rate | what it almost always is | where to look first |
| --- | --- | --- |
| 100%, every time | logic, arithmetic, a sign, a unit, a name, a wrong constant | the line itself |
| ~50% | two of something — two writers, two clients, two spawns answering to one id | who owns the field |
| 5-30% | a race or a timing window. at 30 Hz the window is 33 ms wide: you will never SEE it, only count it | the six suspects below |
| once, never again | a settle window (join, reconnect, place change) or an asset that hadn't landed | `api.isSettling()`, `api.getWorldResidency()` |

A race has a very short suspect list. These six, in this order:

1. **two writers on one field** — the owner law (`gavi#programar-de-verdade`, LAW 1). TELL: the
   value flickers between two values that are each plausible.
2. **order inside the tick** — `updateSchedule` phase, `tick: { phase, order }` on the spawn, one
   behavior reading what another hasn't written yet. TELL: adding a log line "fixes" it (you
   changed the timing).
3. **an asset that hadn't resolved** — `api.isModelReady(id)` / `api.onModelReady(id, cb)`; before
   load, bounds are the declared placeholder with `geometryPending: true`. TELL: it works the
   second time.
4. **the network settle window** — `api.isSettling()` is true for ~1 s around a join/reconnect
   while a rebaseline rewrites positions wholesale. Any displacement detector (portal, arrival
   trigger, fall detector) fires on a re-sync step. TELL: only on join, never mid-play.
5. **timers vs handoff** — `runInSeconds` lives on the simulating side and dies with a departed
   player's tab; `api.getTimers()` lists what's actually queued. TELL: the deadline never arrives
   for one player.
6. **the first tick after an edit** — attaching or editing a behavior re-runs the whole stack's
   `onSpawn`, so state you assumed exists is briefly absent. TELL: only ever right after you save.

Don't estimate the rate — count it. A probe in the behavior that owns the beat (and deleted the
same session, §14):

```js
// PROBE — is it a certainty or a rate?  (whoever sets respawnTick owns the beat)
export function update(dt, api) {
  const s = api.getState();
  const due = s.respawnTick && api.getTick() - s.respawnTick >= api.seconds(1); // 1 s = 30 ticks
  if (!due) return;
  const alive = !!api.getObject(s.armId);            // the thing that sometimes isn't there
  const tries = (s.tries ?? 0) + 1;
  const misses = (s.misses ?? 0) + (alive ? 0 : 1);
  api.patchState({ tries, misses, respawnTick: null });          // one count per beat, never per tick
  api.notifyDm(`arm missing ${misses} of ${tries} respawns`);    // a rate, not an anecdote
}
```

## 11. bisect, do not stare

Every save is a version. So "it worked yesterday" is a **searchable** claim, and searching it
beats reading the same function for the tenth time.

| call | what comes back |
| --- | --- |
| `versions find_change` (query: a path, an object id, a script filename, a keyword) | the save pair that last touched it: `v588 → v589   daynight.js (+10/-2, 192 lines)` |
| `versions inspect` (`from_version`/`to_version`, or `from_offset: -5` / `to_offset: 0`) | the summarized diff for that pair — read ONLY this |
| `Read history/changes/<file>` | that one file's whole arc, when find_change's window is too short |
| `versions restore_file` (path + version) | ONE file back to its exact stored body, verbatim; the rest of the game stays at head — the cheapest hypothesis test there is |
| `versions revert` (version, or `offset: -1`) | the whole spec back, saved as a new version. Heavy, live, in front of players — say it out loud first |

The procedure:

1. name the last state where it **worked** — their word, or a frame of yours;
2. name the first where it **didn't**;
3. `inspect` only that pair;
4. window too wide? **halve it** — inspect the midpoint pair, never the whole range. 40 saves is
   ~6 looks, and 6 looks beats the tenth re-read;
5. diff explains the symptom? that's your mechanism. `restore_file` that one file to confirm it,
   then fix **forward** — a restore is a proof, not a fix, unless the old body was actually right.

Two honesties. **find_change searches a window and tells you where it stopped** ("stopped after
examining 200 script-changing saves below v800") — "not found" means *not in that window*, never
"never changed"; for one file's full story read `history/changes/<file>`. And **an empty bisect is
information**: if nothing in the spec changed, the change was outside it — an asset that finished
cooking or started failing, the creator's client dropping a quality rung, a second player joining,
a restart wiping state a behavior assumed. None of that shows in a diff.

## 12. the instrument ladder — every instrument's false negative

§3 says what each tool proves. This is the other half: **the clean reading that isn't an
all-clear.** Reading a clean instrument as proof of health is the classic self-inflicted wound —
it doesn't just fail to find the bug, it actively argues the bug isn't there.

| the claim | what can prove it | its FALSE NEGATIVE — the clean reading that proves nothing |
| --- | --- | --- |
| "it's drawn" | `view_live_scene`, `identify_object` `screen:` | a frame is honest with the paint still cooking; and three identical frames in a row (measured here) meant frame delivery was capped, not that a fix failed |
| "the server said something" | `getLogs()` | **a restart wipes it** — empty after a restart proves nothing at all. It's a ring, so an old line ages out (one window's ring spanned 24,928 ticks). Most client renderer events never arrive |
| "the spec says" | `run_script` readOnly, `api.getSpec` | the spec is not what a client draws — live-vs-spec drift is real, and a runtime-only write reads different from the saved value (§6) |
| "this entity exists" | `api.query`, `api.getObject` | `query` scopes to the caller's place. And a `realm: 'client'` object **never** exists for the server — see the case below |
| "the UI is there" | `read_authored_ui` (receipts) | healthy `sent`/`applied` receipts with zero matches = your selector missed, not a blackout |
| "the collider is there" | `colliders: true`, `api.overlapPoint`, `api.overlapSegment` | every collider can exist and the path still be unwalkable — that's `api.traverseCheck`, which names the riser vs the autostep limit |
| "the player is at X" | `identify_object`, the frame | in THIS game `run_script` transform reads on the avatar came back byte-identical across ~25k ticks while the frame showed them 64 m away (`memory/game/debugging.md`) |
| "it performs" | `api.getClientHealth()` | up to 15 s stale (`ageSeconds`), and its budget is that client's own refresh-derived number (12.1 ms now), not the 16.7 ms floor and not the sim watchdog's budget |
| "there's no error" | *nothing* | absence is never proof: a `catch` swallowed it, the fault is client-only, or the log was wiped |

The worked case, measured in this room in the same second:

```js
// run_script (server side) — "the first-person arm is missing"
api.query({ select: 'ids' }).length    // 422 entities in 'main'
api.query({ tags: ['viewarm'] })       // []   ← and the arm IS drawn on screen right now
```

```
identify_object { screen: [0.71, 0.82] }   // a ray through the LIVE camera, same second
→ id: "viewarm_player…_hand_v14_coelho"  kind: primitive  distance: 0.88 m  authored: null
```

`scripts/viewmodel-arm.js` spawns it `realm: 'client'` + `audience: 'local'`, pinned to the
camera. It exists on exactly **one** machine — the owner's — and the server has never heard of it.
That empty array is the query working perfectly. Audit the arm from the server and you'll
"discover" it missing every single time, delete a working file, and ship a real bug to fix an
imaginary one. What CAN see it: a frame, or `identify_object` with `screen: [x, y]` on the pixels
where it's drawn — render truth, and `authored: null` there just means runtime-spawned, not absent
from the game.

**Never let one clean instrument close a hunt.** Two instruments that disagree is data — that
disagreement is exactly how this game's frozen-replica defect got found. Two that agree is a
conclusion.

## 13. the fix that misses twice is upstream — the five layers

| level | what lives there | what "one layer up" means from here |
| --- | --- | --- |
| **1 · the line** | arithmetic, a sign, a unit, a name, a constant | stop tuning the number; read the whole function |
| **2 · the file** | this behavior's own logic, its hooks fighting each other (`update` overwriting what `onInput` wrote) | stop editing this file; ask who ELSE writes that field |
| **3 · the contract** | who owns that state, who writes it in which order, what a caller is promised | name the owner: one writer, everybody else reads (`gavi#programar-de-verdade`) |
| **4 · the realm** | which machine simulates it, what replicates, `realm` / `audience` / self-only screen juice | ask "on whose machine is this even true?" (§4, `gavi#fazer-multiplayer`) |
| **5 · the platform** | the API doesn't do what you believe, or it faults | verify against api-reference and `engine-reference/` first; then `api.reportEngineBug({ description })` from `run_script` |

The escalation, and it's mechanical:

- **miss 1** — your theory was wrong. New theory, **same level**. Normal, cheap, expected.
- **miss 2** — the **level** is wrong. Stop editing that file. Go up one row and say out loud
  which row you're on now. A third patch at level 1 is how a file ends up carrying four dead
  fixes and nobody able to tell which line matters.
- **miss 3** — fixing is **forbidden**. Ship a diagnosis, or hand it out as a scoped job
  (`gavi#mandar-enxame`).

The diagnosis is a deliverable, not a surrender. Five lines:

```
symptom:    their words + the frame
theory 1:   dead — killed by <the measurement>
theory 2:   dead — killed by <the measurement>
level now:  3 (contract) — <who owns that field, and why I think two hands write it>
settles it: <the exact call, and which value would mean which>
```

Every miss also becomes a ruled-out line (§15). Two dead theories are worth more than one lucky
patch: they're the only thing that stops the next hand re-walking them.

## 14. instrumentation that outlives the session

What dies: a `run_script` probe answers once and is gone. `api.log` lands in `getLogs()`, which is
in memory and **wiped by a restart**. Both are session tools. For a bug that recurs, wire the
**game** to report itself at the beat that matters, so the next occurrence arrives carrying its
own evidence instead of arriving as a sentence.

| tier | call | survives | cost |
| --- | --- | --- | --- |
| the beat, once | `api.notifyDmOnce(key, msg)` | until a world reset | one call, first time only |
| the beat, with a number | `api.notifyDm(msg)` at a threshold or every Nth | the room's life | one call per report — **never** per tick |
| the ledger | one `api.sql` INSERT per occurrence | restarts, sessions, weeks | one write per occurrence — never per tick |

```js
// scripts/<the owner>.js — the recurrence ledger. dev and live are separate databases.
export function onSpawn(api) {
  api.sql`CREATE TABLE IF NOT EXISTS bug_arm (
    id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT, room TEXT, tick INTEGER, note TEXT)`;
}

function logOccurrence(api, note) {
  api.sql`INSERT INTO bug_arm (user_id, room, tick, note)
          VALUES (${api.userId}, ${api.getRoomId()}, ${api.getTick()}, ${note})`;
  api.notifyDm('arm miss logged: ' + note);   // so the next session opens with the evidence
}
```

Gate anything that's only for building on `api.getRoomMode() !== 'dev'` and return — probe HUDs,
test spawners, verbose logs all flip off at publish, for everybody, with no account checks.

**The deletion rule: a temporary probe block gets deleted in the same session it was added, or it
becomes permanent noise.** Write it so you can find it — `// PROBE 2026-08-05 — delete before
landing` is one grep away. If it earned its keep, promote it: a name, a threshold, and a number in
the message, and say in your report that it's now permanent. Leaving it costs twice: frame time on
a client already at rung 5/5, and the next hand reasoning from a line nobody maintains.

And a `notifyDm` report is the game telling you what you asked to know. Read it and act on it —
it's never a routine diff to wave off.

## 15. write the bug down — especially what you RULED OUT

§8 gives the three-line autopsy. The professional version has a fourth field, and it's the one
everybody skips:

```
symptom:    their words, plus the frame
mechanism:  one sentence of WHY — the cause, not the fix
fix:        file · function · value · the version it landed in
RULED OUT:  theory — and the measurement that killed it (one line each)
```

Two ruled-out lists from this game, both worth their weight in windows:

- **"the watchdog is parking the player behaviours."** Dead, three ways: the **rate** (exactly ONE
  over-budget `player/*` line in a ring spanning 24,928 ticks); the **park arithmetic from the
  warning's own payload** (a lone 36 ms tick contributes 19.3 ms toward a 333 ms budget over 90
  ticks — you'd need ~17 of them); and a **detach** of five behaviours for ~6,100 ticks then a
  full re-attach, with the symptom not moving. Written down, that stops the next hand spending a
  window cutting player script cost hoping the frozen replica unfreezes.
- **"voxel writes are refused by some authority rule."** Dead: `fillVoxels` / `breakVoxels` /
  `breakVoxel` all measured true and read back changed, from a server-realm manager AND from a
  player behavior. The real mechanism was `lib/blast.js` flushing behind `runA >= 0` while this
  world's ground sits at negative x — both flush sites unreachable. There is no authority rule.

It goes in `memory/game/`, the journal every member's Savi reads — not the chat, which nobody
re-reads. Format and the NEXT MOVE line: `gavi#memoria-infinita`. A bug written down costs one
window. A bug not written down costs one window every time somebody meets it.

## The failure list — how a hunt goes wrong

| the trap | the TELL | the fix |
| --- | --- | --- |
| theorising before `getLogs()` | you spend 20 minutes on movement and the log had a thrown hook on line 1 the whole time | read the log at step 2, always. one call |
| taking an empty log as proof | "no errors, so it's not the code" — right after a restart, or on a purely client-side symptom | a restart wipes the log; most renderer events never reach it. empty clears nothing |
| the fix that was never in the world | nothing changes at all, and the engine looks broken | §6: sentinel in the source, behavior list, live-vs-spec value |
| testing as the owner of everything | "works for me" and one player still sees it | two clients, and check `getRoomId()` / `getEntityPlace()` before saying "same room" |
| a probe with a wrong filter believed | `found: 0` read as "nothing is there" | always return the scanned count and min/max distance so the filter accuses itself |
| a third patch on the same symptom | fixed twice, back twice — each fix a bit further from the cause | stop patching. the cause is one floor up (owner, simulator, write order). ship the diagnosis |
| "fixed" said before anybody played it | they come back with the same sentence and now they trust you less | a frame at play distance, and their word. until then it's a bet, and you say how the bet loses |
| fixing before the repro is written | you can't say which step is load-bearing, so every fix is a coin flip | §10: steps with numbers — and a rate ("4 of 20") when it's intermittent |
| staring at the file instead of the diff | the tenth read of a function that was never the problem | §11: `versions find_change`, then `inspect` the pair where it broke |
| an empty result read as absence | a server query for a `realm: 'client'` object comes back `[]` and you delete a working file | §12: ask on WHOSE machine the thing is true before you believe a count |
| a probe left in "for now" | weeks later, a log line nobody maintains is the evidence somebody reasons from | §14: delete it the same session, or promote it with a name and a threshold |
| an autopsy with no ruled-out list | the next hand re-walks a dead end you already paid for | §15: every dead theory plus the measurement that killed it |