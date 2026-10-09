---
name: Advanced Architecture
description: Gavi's big-world architecture — how a game stays buildable after fifty more requests. The one-hour map for reading a codebase you did not write (places, the player's stack, who owns each shared field, which entities are managers, the data sidecars, and the grep that beats reading files); the extension seam that answers "where does this feature go" with sense / system / instance; the realm map — where code runs, what that forbids, why a client-realm object reads as missing from a server query, and the two-lane emit+state action with one sequence number; contract migration without a flag day; what not to abstract; the six-layer composition stack and when a system earns its own manager entity; one cohort script instead of forty behaviors; updateSchedule cadences; then the eight patterns for a crowded frame — hook shell with a drivable machine in lib/, a single write gate with a reserve held for the hero, birth and death in a drained batch, a watchdog for the listener torn down on re-save, one authority per truth, collider in the same frame of reference as the mesh, a deliberately duplicated table, CPU discipline that doesn't amputate the feel — and the smell table that turns what the creator says into a structural cause. Load on arrival in an unfamiliar game, when the world passes ~100 live entities, when "it's sticking to me" or "it works sometimes" shows up, or when a new system is about to share the frame with the ones already there.
---

# Gavi — advanced architecture

## pick the path in 10 seconds

| the situation | what to do |
| --- | --- |
| under ~100 live entities, one system | you don't need this file. `gavi#programar-de-verdade` is the whole answer |
| somebody else's game, and the ask is "add X" | THE ONE-HOUR MAP — five reads and one grep, **then** you may type |
| a feature arrived and you don't know which file it belongs to | THE EXTENSION SEAM — sense / system / instance, and the tell for each |
| "it's missing" — and you can see it on screen | THE REALM MAP — you audited from the wrong side |
| a shared field has to change shape and three files read it | CONTRACT MIGRATION — five steps, never a flag day |
| two files look alike and you want to merge them | WHAT NOT TO ABSTRACT — two is two; three is a pattern |
| the creator reported a symptom and you want the cause | THE SMELL TABLE, last section |
| "where does this new system live?" | THE STACK below — six layers, one owner each |
| 40 of the same thing, each carrying its own behavior | one cohort script sweeping all 40 (THE STACK §cohort) |
| `update()` costing too much | `updateSchedule` — `{ every: 3 }` = 10 Hz on the 30 Hz tick |
| an interior, a level, a dungeon per party | a **place**, not a room (THE STACK §places) |
| "it's sticking to me" / the hero coming apart | PATTERN 2 — one write gate, 16 rows reserved for the hero |
| a spawn wave freezing the game ~10 s | PATTERN 3 — the watchdog parked the script; drain the queue |
| I saved the file and the event went silent | PATTERN 4 — `api.on` torn down by the rewire, never re-armed |
| two players reading different scores | PATTERN 5 — one authority per truth, `rev` stamped on it |
| invisible wall, or the player floating on a piece I moved | PATTERN 6 — mesh and collider in one frame of reference |
| the same table needed in two files | PATTERN 7 — duplicate it on purpose, warn on BOTH sides |
| the frame is expensive and I'm about to cut world | PATTERN 8 — change technique before you deliver less |

`gavi#programar-de-verdade` is the floor: one owner per state, additive behaviors, the
manager is an entity, one system for many, network ceilings, never swallow an error, probe
before you theorise, a readable file, prove it before you say done. Those laws don't
get repeated here.

This is the floor above: what changes when **340 live entities**, one animated cohort and a
**16-bone** hero share the same **30 Hz** tick. At 40 entities the systems coexist; at 340
they **compete** — for the frame, for the wire, for order. Architecture is what referees,
and every pattern below came out of a bug that cost a session.

Everything here is method, not trivia — the discipline the strongest coding systems actually
run on when they're good: **ground** every claim in a read of the thing itself, **predict**
what a change will do before you run it, **try to break** what you just built instead of
demonstrating it, **measure** instead of estimating, and **review your own diff as if
somebody else wrote it**. The sections below are that discipline pointed at a codebase's
shape instead of at one function.

Before you add a system, three numbers from a `readOnly` probe:
`api.query({ radius: 400, select: 'ids' }).length` (above 150, patterns 2 and 3 stop being
optional) and `spent`/`pending`/`dropped` off the manager's state — `null` = there is no
write gate; `dropped > 0` = somebody is already losing writes today.

## THE ONE-HOUR MAP — reading a codebase you did not write

You will inherit a game far more often than you start one, and the ask always arrives before
the understanding: *"add mounts"*, on 45 scripts nobody described to you. One hour of reading
in the right order buys back a week. **Five reads, then a grep.** In this order, because each
one scopes the next.

| # | the read | what it answers | why it comes here |
| --- | --- | --- | --- |
| 1 | `Object.keys(api.getSpec('places'))` | how many worlds are there | everything else scopes to a place. `query()` auto-scopes to the caller's, so a script that "can't find" an object is often looking in the right code and the wrong place |
| 2 | `api.getSpec('player.behavior')` | the player's stack, **in order** | the array order IS the contract: every script runs each hook on the same entity in that sequence, so a later one can overwrite an earlier one's write inside a single tick |
| 3 | the grep, below | who **owns** each shared field | ownership is the only thing that predicts bugs. one field, two writers = "it works sometimes", forever |
| 4 | the manager sweep, below | which entities are systems | these are the addresses of everything global. no manager = the logic is hiding on the player |
| 5 | `api.listScripts().filter(s => s.includes('/lib/data/'))` | the data sidecars | if the numbers live in JSON, a balance request is a data edit and you never open a .js file |

### the grep that beats reading files

You do not find an owner by reading files. You grep the field name and **the writers announce
themselves**:

```
grep pattern:"pouch"                          path:"scripts/"   → every writer and every reader, one screen
grep pattern:"patchState\(\{ *health|state\.health" path:"scripts/"
grep pattern:"api\.on\(|api\.emit\("          path:"scripts/"   → the whole event wiring of the game
grep pattern:"require\('lib/"                 path:"scripts/"   → who depends on which helper
```

Reading costs one unit of attention per file. Grepping a field costs one, total — and it
cannot lie: `patchState({ pouch` **is** a write no matter what the comment above it claims.
Run the ownership grep before you believe any header, including your own from last week.

Then leave the map behind for the next reader. This game already does it — `scripts/vitals.js`
opens with its own contract:

```js
// VITAIS — hearts and food. The ONE writer of state.health and state.hunger.
//
// Reads, never writes:
//   gameMode          scripts/game-mode.js   (survival only; creative drains nothing)
//   velocity, flying  scripts/player.js
//   bubbles, submerged, swimming  scripts/breath.js
```

A file that declares its own writes turns step 3 from a search into a read. Write that header
on any file you touch; it costs four lines and it is the cheapest architecture in the file.

### the worked map of THIS game — shape, not inventory

Blockcraft, measured on Tome **v5.2.15** — the engine laws the map leans on (the 30 Hz tick,
the `require()` rule) are unchanged on **v5.2.26**, the current engine; the counts are that
room's own. What matters is the **shape**: how many of each thing, and what the boundaries are.

| layer | what's there | the shape it makes |
| --- | --- | --- |
| **places** | `main`, and only `main` | one world, no seams. no `place` argument anywhere, no cross-place state to referee, no portal to keep honest |
| **player stack** | **11** scripts, in this order: `player` · `mining` · `viewmodel-arm` · `game-mode` · `breath` · `steve-body` · `swimming` · `crafting` · `vitals` · `footsteps` · `combat-hands` | **one job each, and the jobs refuse to overlap.** movement exists only in `player.js` — `breath.js` and `swimming.js` both say *"the movement itself lives in player.js (one mover only)"* in their headers. health exists only in `vitals.js`. the arm you see exists only in `viewmodel-arm.js` |
| **managers** | **6** invisible `realm: 'server'` entities, one per concern: `world-clock` (the hour) · `mob-warden` (mobs) · `block-surfaces` (what a block looks like) · `soundscape-manager` (ambience) · `combat-ref` (who hit what) · `mob-voices` (mob sound) | each holds truth no single player owns, and each survives any player leaving. six concerns, six addresses — when a bug is "the hour is wrong", there is exactly one file to open |
| **sidecars** | `lib/data/`: `blocks` · `camera` · `mobs` · `player` · `recipes` · `world` | the numbers are out of the code. "creepers hit too hard" is one line of JSON |
| **shared helpers** | `lib/`: `aim-ray` · `blast` · `mob-aim` · `mob-shapes` · `skins` · `ui-crafting` | they live in `lib/` because that is the only place `require()` looks: `[Tome] require() only supports builtin/*, lib/*, or mods/*/lib/* modules` — there is no relative import, no URL, no `scripts/foo.js` require |

**Audit the spec, never the tags.** Measured in this room, a minute apart:

```js
api.query({ tags: ['manager'], select: 'ids' }).length                        // → 5
(api.getSpec('places.main.objects') || []).filter((o) => o.behavior).length   // → 6
```

`world-clock` runs `scripts/daynight.js` and carries no `manager` tag. A tag is a convention
somebody has to remember; the spec is the world. The manager sweep worth keeping:

```js
// every entity in the place that runs code, with the two facts that decide what it may do
return (api.getSpec('places.main.objects') || [])
  .filter((o) => o.behavior)
  .map((o) => ({ id: o.id, realm: o.realm || 'default', behavior: o.behavior, state: Object.keys(o.state || {}) }));
```

The `state` keys in that answer are the game's global vocabulary. Anything not in there and
not on a player does not exist as shared truth, whatever the chat said.

## THE STACK — six layers, one owner each

Every line of gameplay lives on exactly one of these. Putting it on the wrong layer is the
bug you pay for three weeks later.

| layer | what lives there | how many |
| --- | --- | --- |
| **player behavior** (`scripts/player.js`) | input → intent → `api.move`; per-player state only | 1 script, one copy per player |
| **place manager** | waves, round phase, timers, objectives, the spawn budget of THIS scene | 1 entity per place |
| **world manager** | only what is genuinely global: season, world clock, cross-place totals | 1 entity, `replicate: 'world'`, in the default place (it never unloads) |
| **world objects** | one reusable behavior + per-instance `state` — door, chest, turret, lantern | 1 script, N instances |
| **terrain + atmosphere** | ground, sky, the hour. data, not logic | 1 of each per place |
| **`scripts/ui.js`** | layout and slotting; reads `localPlayer.state` and decides nothing | 1 file |

Two laws that fall straight out of the table. **Nothing global goes on the player** — the
player exists in N copies and dies with the tab, so a score kept there walks out the door.
And **`ui.js` never decides**: a button calls `sendAction(name, payload)`, the behavior
decides in `onInput`, and every action read there has to exist in `inputs.actions`.

### when a system earns its own manager entity

Three tests. **One yes is enough:**

1. it holds truth **no single player owns** (score, phase, round, wave number);
2. it has to **survive** any one player leaving;
3. it drives **more than ~8 entities** as a group, or its `update()` costs more than ~2 ms.

Under all three, it stays a behavior on the object that owns it. Above any of them:

```js
// one manager entity, invisible, no collider, born with its state already shaped
api.spawn({
  id: 'wave-master', tags: ['manager'], behavior: 'scripts/wave-master.js',
  properties: { visible: false, physics: 'none' },   // visible:false alone still collides — kill both
  state: { phase: 'idle', wave: 0, alive: 0 },
});
```

`visible: false` is render-only: the collider stays solid and keeps blocking. `physics: 'none'`
is the other half — leave it out and you've built an invisible wall in the middle of the arena.

### cohort over per-object scripts

60 lanterns with 60 behaviors = 60 `update()` calls, 60 api materializations and 60 watchdog
samples per tick. One cohort script is 1 of each, at 10 Hz:

```js
// scripts/lantern-cohort.js — ONE script on ONE manager entity, driving every lantern.
export const updateSchedule = { every: 3 };   // 33 ms tick × 3 ≈ 10 Hz; dt arrives as ~0.1
export function update(dt, api) {
  const hour = api.getAtmosphere()?.timeOfDay ?? 12;
  const lit = hour < 6.5 || hour > 18.5;        // dusk 18:30, dawn 06:30
  const s = api.scratch('lanterns');            // local, never replicated
  if (s.lit === lit) return;                    // write on the FLIP, never every tick
  s.lit = lit;
  const ids = api.query({ tags: ['lantern'], select: 'ids' });
  api.batchSetObjectProperties(ids.map((id) => ({
    id,
    properties: {
      light: lit
        ? { kind: 'point', color: 'oklch(0.86 0.13 78)', intensity: 3.2, distance: 9 }
        : null,   // null is the eraser: it removes the light so it stops costing
    },
  })));
}
```

`distance: 9` because a prop lamp wants 6–12 m; a 60 m radius on 60 lamps overlaps every
cluster in the scene and that is the one way to make cheap lights expensive.

### `updateSchedule` — the declared cadence

| declaration | rate at a 30 Hz tick | for |
| --- | --- | --- |
| nothing | 30 Hz | input, hero, camera. **never negotiate these** |
| `{ every: 2 }` | 15 Hz | cohort with visible motion |
| `{ every: 3 }` | 10 Hz | manager, dressing, ambience |
| `{ near: { tag: 'player', radius: 40 } }` | 30 Hz inside 40 m, 0 outside | anything the player has to be near to notice |

`dt` arrives as the declared step, so integrating by `dt` just works. `every: 3` on an NPC
that re-asserts `moveTo` is the ceiling — past `every: 3` the intent decays between pulses and
motion stutters. A burst back to full rate is `api.setUpdateSchedule({ every: 1 })` on entry
and `api.setUpdateSchedule(null)` on exit.

### places for interiors and levels

A place is a separate scene with its own terrain, atmosphere and objects. The deciding test is
whether there's a **seam**: separate spawn, a handoff, cross-place state. One contiguous
structure — a tower, a three-storey house, a ship — is **ONE place** with floors stacked in Y,
never three places. Mint a place for space that is genuinely somewhere else.

```js
export function onTriggerEnter(other, api) {   // needs physics { body: 'static', trigger: true }
  if (!other?.tags?.includes('player')) return;
  const dest = api.enterPlace(other.id, { placeId: 'cellar', spawnPoint: 'default' });
  if (!dest) api.toast("the cellar door didn't open — try again", { duration: 3 });
}
```

`enterPlace` creates and moves in one call and returns the destination id, or `null` when the
trip didn't happen (reason in `getLogs()`) — nothing was half-created, so a second press is
always safe. Place ids cannot contain `:` (reserved for object namespacing). `query()`
auto-scopes to the caller's place, so a cross-place sweep needs `place`, and a manager readable
from every place needs `replicate: 'world'`. Instances and rooms: `gavi#fazer-multiplayer`.

## THE EXTENSION SEAM — where a new feature goes

A request arrives. The question is **never** *"where do I put this code"* — that question is
answered by which file you happen to have open, which is how a 300-line mining script ends up
owning hunger. The question is **"what already owns this concern?"**

Three answers, and each has a tell you can check in ten seconds:

| the ask sounds like | it is a… | the tell | it lands as |
| --- | --- | --- | --- |
| "hunger should drain faster when you sprint" · "creepers hit too hard" · "add a copper block" | **INSTANCE** | the concern already has an owner, and you only want a different **value**. there is already a table for this | one row / one number in `lib/data/*.json`. **zero** lines of new code |
| "the player should shiver in the cold" · "footsteps should echo in caves" | **SENSE** | it **reads** the world and publishes **ONE** field to the player's own state. nothing else in the game changes shape | a new sibling script in the player's stack, ~40 lines, one published field, named in its header |
| "villages, with raids on a timer" · "a scoreboard across the session" | **SYSTEM** | it holds state **no player owns** and has to survive whoever triggered it walking out | a new manager entity + one script (THE STACK §manager tests) |

The three tells as questions you answer out loud before typing:

1. **INSTANCE:** is there a file whose whole job is this concern, with a table in it? Then your
   change is a row in the table, and touching the .js is a mistake.
2. **SENSE:** can you name the one field it publishes, in one word? If it wants to publish two
   unrelated fields, it is two senses — write two scripts. A sense **never** writes another
   script's field; it publishes its own and lets the owner read it.
3. **SYSTEM:** does its truth outlive the player who caused it? If yes, it is a manager entity
   and it is invisible with `physics: 'none'`. If no, it belongs on the object that owns it.

**The anti-pattern, named:** growing a file that already works, because it is the file you
have open. `mining.js` is 300 lines, it's on screen, and the new hunger rule goes in at line
290. Now `mining.js` owns digging **and** hunger, and next month *"fixing X broke Y"* arrives
with your name on it. The test takes one second: **if the file's one-line header stops being
true after your edit, it is the wrong file.**

And the seam has a frame-cost side. The creator's own client, right now, is already at the
**adaptive-quality floor** — rung **5 of 5**, `renderScale` **0.55**, bloom skipped, frames
**~23–30 ms** against a **12.1 ms** budget on an 82.5 Hz monitor, at 1910×948. There is no
headroom to borrow. So a new SENSE gets a declared cadence unless the thumb can feel it —
`scripts/breath.js` already argues its own case in its header: *"LUNGS DO NOT NEED THE FRAME…
at 20 Hz you go under 50 ms later than you used to, which is a third of a blink."* That is what
a cadence decision looks like written down: the number, the consequence, and why it is
acceptable.

## THE REALM MAP — where code runs, and what that forbids

**One entity, one simulator.** The full ownership table is `gavi#fazer-multiplayer`'s job; what
belongs here is what the realm **forbids**, because that is what turns into a false bug report.

| where the code sits | who runs it | what that forbids |
| --- | --- | --- |
| the player's behavior stack | that player's own machine | no `api.sql`. anything global written here dies with the tab |
| ordinary place object, or `realm: 'server'` | the elected place host — one machine | still no `api.sql`: `realm: 'server'` changes **ownership**, not where hooks execute |
| `realm: 'client'` (+ `audience: 'local'`) | the machine that created it, nobody else | **it is not on the wire.** no server-side query sees it, and `api.emit` from it is dropped |
| `engine.behaviors` lifecycle hooks (`onPlaceStart`, `onPlayerConnected`, `onPlayerDisconnected`, `onPlaceShutdown`) and `engine.crons` | the host seat | these are the only places `api.sql` exists, plus `run_script` |

### the trap, measured in this room

Two readings of the same two objects, taken a minute apart:

```
run_script (authority side):   api.query({ tags: ['viewarm'], select: 'ids' })   → []
identify_object name:"viewarm" (render truth, on the player's client)            → 2 live primitives, authored: null
```

Two arms are drawn on the player's screen **right now**, and a server-side query returns
nothing. Neither reading is wrong. `scripts/viewmodel-arm.js` spawns them with
`realm: "client", audience: "local"` — engine-side, client-realm spawns are local-plane and
excluded from the upload envelope, so the server's world never holds those entities at all.

**"Missing" from an audit run on the wrong side is the most common false bug in a live game.**
Before you chase an invisible object, answer one question: *which side did I ask?* And the same
mistake in reverse costs a session — a server-realm manager cannot raycast (there is no physics
runtime on the multiplayer server; the engine says so in the refusal), so a "path is clear"
answer from there means *"could not look"*.

### two lanes, one sequence number

Client → server actions have two roads with opposite failure modes:

- **`api.emit`** is fast and sequenced by the server, and it can **evaporate**: from a
  client-realm script it is never delivered (the engine warns once — *"custom events are
  server-sequenced. Emit from a replicated script instead"*), and a client-authority emit that
  ran on a rolled-back basis is dropped with its verdict. It never arrives late; it sometimes
  never arrives.
- **a state write on your own entity** always arrives — a client may always write its own
  player, and the write replicates by the same machinery that carries every other field — but
  the receiver has to **poll** for it, so it costs a tick or two.

Send **both**, stamped with the **same monotonic number**, and let the receiver claim whichever
lands first. This game does exactly that for punches (`scripts/combat-hands.js` →
`scripts/combat-ref.js`):

```js
// THE ACTOR — owner-simulated (the player's own behavior). one number, two roads.
n += 1;
api.patchState({ act: { what: targetId, dmg: dmg, n: n, at: api.getTick() } });  // lane A: always arrives, polled
api.emit('act', { what: targetId, dmg: dmg, from: api.id, n: n });               // lane B: arrives sooner, may evaporate

// THE RECEIVER — one manager, realm: 'server'. both lanes call resolve(); claim() lets one through.
function claim(api, who, n) {
  if (!who || typeof n !== 'number') return true;    // an unnumbered payload is a hand probe: always run it
  const S = api.scratch();                            // side-local, never replicated, never persisted
  if (!S.seen) S.seen = {};
  if (S.seen[who] === n) return false;                // this exact action already landed. ignore the twin
  S.seen[who] = n;
  return true;
}
export function onSpawn(api) { api.on('act', (p, ref) => { if (claim(ref, p.from, p.n)) resolve(ref, p, 'emit'); }); }
export function update(dt, api) {                                    // lane A: the poll
  const tick = api.getTick();
  for (const pl of api.getPlayers()) {
    const a = (api.getObjectState(pl.id) || {}).act;
    if (!a || typeof a.n !== 'number') continue;
    if (!claim(api, pl.id, a.n)) continue;                            // marked seen even when stale — never twice
    if (Math.abs(tick - a.at) > 45) continue;                         // 45 ticks = 1.5 s at 30 Hz: a poll after a
    resolve(api, a, 'state');                                        // rejoin must not re-fire an old action
  }
}
```

Four rules that make it safe, and each one is a bug if you skip it:

- **the number is per-actor and monotonic**, and it resumes from the last published value on
  respawn — otherwise a fresh session reuses a number the receiver has already seen and the
  action is silently swallowed.
- **the stale window is mandatory.** Lane A is a poll, so the *first* poll after a rejoin sees
  a value that is minutes old and looks brand new. Fence it with `at` and a tick window.
- **`scratch` is not a receipt.** It is side-local and dies with a host change, so the fence
  also has to exist on the **target**: this game stamps the mob's own replicated state with
  `lastHit: '<who>:<n>'` in the same patch as its health, and `resolve` returns early when the
  stamp matches. Local dedupe for speed, replicated stamp for truth.
- **publish which lane won.** `combat-ref` writes `state.lane` on every resolve. Read it before
  you theorise about latency; in this room it reads `{}` right now, which honestly means *no
  hit has landed this session*, not *the lanes are broken*.

## PATTERN 1 — hook shell, machine in `lib/`

**Problem:** logic that lives inside `update` only runs when the engine lets it — you can't
call it with `dt` in your hand or measure it on its own, so diagnosis turns into reading
code, where a correct file looks exactly like a broken game.

**Shape:** the behavior is a **shell** (hooks and forwarding); the machine lives in
`scripts/lib/*.js` with `module.exports` (`gavi#animar-esqueleto-codigo` §1) and takes an
explicit `(dt, api)`.

```js
// scripts/valley-folk.js — SHELL. no decision lives here.
const M = require('lib/folk.js');
export const updateSchedule = { every: 2 };
export function onSpawn(api)    { M.open(api); }
export function update(dt, api) { M.step(dt, api); }

// and now the probe DRIVES the machine — an expensive step gives itself away in 5 seconds:
//   const M = require('lib/folk.js'); const t0 = api.seconds();
//   for (let i = 0; i < 30; i++) M.step(1 / 30, api);   // 30 steps = 1 s of game
//   return { cost1s: +(api.seconds() - t0).toFixed(4) };
```

**How it fails:** stashing `api` in a module-level variable inside `open`. The same module
serves several entities and the one you stashed belongs to a different one — `api` comes in
as a parameter to **every** function.

## PATTERN 2 — one gate, and only one, for per-frame property writes

**Problem:** two systems writing transforms on the same tick can't see each other; each
respects its own ceiling and the sum blows through. The symptom that reaches you isn't
"it's replicating too much" — it's **"it's sticking to me"**, because the first thing to
lose writes is the hero's rig, which is the thing writing the most rows. The wire ceilings,
checked against the reference (``):

| ceiling | value | when you pass it |
| --- | --- | --- |
| rows per array in one message | **2048** — `MAX_STATE_DELTA_ROWS_PER_ARRAY`, creates/updates/deletes each | the **whole message** is refused |
| component entries per entity row | **64** | same refusal |
| bytes per message | **1 MiB** | same refusal — dropped whole, never trimmed |
| bytes in one single value | **64 KiB** | same refusal |
| characters in an entity id | **256** | same refusal |

One reading drives the whole design: the gate **fails closed, per whole message**, on both
wire formats (JSON and binary share one budget). It does not trim your batch and keep the good
rows — one row over the line and the 2047 good ones go in the bin with it. A burst that
overflows doesn't degrade gracefully, it **vanishes**, and what you see missing is whatever
happened to ride in the same message as the offender.

```js
// scripts/lib/throughput.js — OWNER of every per-frame property write.
// whoever writes outside here skips the ceiling, and the one who pays is the hero's rig.
const CAP = 48;           // rows per tick — MEASURED in this room, not copied
const HERO_RESERVE = 16;  // 16 bones: never leave less than this for what the player feels

// prio: 0 hero/input · 1 near the camera · 2 cohort · 3 dressing
function request(api, id, props, prio) {
  const s = api.scratch('throughput'); s.queue ??= new Map();  // never replicates; lazy init
  const j = s.queue.get(id);
  if (j) { Object.assign(j.props, props); if (prio < j.prio) j.prio = prio; }
  else s.queue.set(id, { props: { ...props }, prio });  // one id, one request: the last one wins
}
function flush(api) {
  const s = api.scratch('throughput'); if (!s.queue?.size) return;
  const batch = [];
  for (const [id, p] of [...s.queue].sort((a, b) => a[1].prio - b[1].prio)) {
    const limit = p.prio === 0 ? CAP : CAP - HERO_RESERVE;   // THE RESERVE LAW
    if (batch.length >= limit) break;   // sorted: what's left behind is the highest prio number
    batch.push({ id, properties: p.props }); s.queue.delete(id);
  }
  if (batch.length) api.batchSetObjectProperties(batch);   // ONE batch per tick
  s.spent = batch.length; s.pending = s.queue.size;
}
```

**The reserve law:** a write that isn't the hero's never goes past `CAP − 16`, even when the
hero hasn't asked for anything on this tick. A half-written rig — head at the new pose, arm
still at the old one — is worse than a frozen rig: frozen, the eye forgives it; half
written, it watches the body come apart.

A backlog does **not** hand out a stale value: the queue is keyed by id, and the next tick's
request overwrites the pending one before the flush. A backlog that only grows gets cut from
the tail (prio 3 first) and gets **counted** — `flush` publishes `spent`/`pending`/`dropped`
to the manager's state 1×/s; `scratch` is working memory, not a receipt.

**How it fails:** the new system that "only writes two little things" straight through
`setObjectProperty`. It walks past the doorman and the ceiling becomes fiction. Reviewing a
new system is one question: *does it go through `throughput.request`?*

## PATTERN 3 — birth and death in a drained batch

**Problem:** N loose spawns in one frame, and the budget watchdog parks you. The numbers it
actually uses: the budget is **half a tick of wall clock**, clamped to 8–100 ms — at the
default 33 ms tick that's **16.7 ms**. Blow it **3 strictly consecutive ticks** and that
entity's `update()` is parked for **10 s**, then auto-resumes.

Spreading the wave across ticks does not buy you out of it either — there's a second trigger:
inside a **3-second rolling window**, **2 or more** over-budget ticks whose excess adds up to
**20 budgets** (≈334 ms at 30 Hz) park you the same way. A single giant one-off spike is
forgiven (sunk cost, predicts nothing); a **pattern** is not. So the answer isn't a smaller
burst, it's a **drained queue** — a fixed slice per tick, forever. Worse than the park: a wave
cancelled halfway leaves half the world standing.

```js
// scripts/lib/populate.js — drained queue, cancellable by MARK.
// order(api, mark, requests) stacks { spec } | { kill: id } with the mark on each one.
const PER_TICK = 24;   // light spawn. rigged model: 6. measured, never guessed.
function drain(api) {
  const s = api.scratch('populate'); if (!s.queue?.length) return;
  for (let n = 0; n < PER_TICK && s.queue.length; n++) {
    const p = s.queue.shift();
    if (p.kill) api.destroy(p.kill);
    else api.spawn({ ...p.spec, tags: [...(p.spec.tags || []), p.mark] });  // the mark GOES in the tag
  }
}
function cancel(api, mark) {   // BOTH halves: the queue, and what already got born
  const s = api.scratch('populate'); s.queue = (s.queue ?? []).filter((p) => p.mark !== mark);
  for (const id of api.query({ tags: [mark], select: 'ids' })) api.destroy(id);
}
```

**How it fails:** the mark left out of `tags`. Then `cancel` clears only the queue and
everything already born stays in the world forever — the "cancelled" wave keeps walking.

**Second way:** swapping a visual with `destroy` + `spawn`. Between those two frames there's
one frame with no entity in it and the world **blinks**. A living thing's visual gets
swapped **in place**; `destroy` is only for what's leaving the world.

## PATTERN 4 — listener watchdog

**Problem, the most expensive one in this file:** an `api.on` can **vanish with the module
still loaded**. A script edited live makes the rewire sweep tear down that entity's event
subscriptions (the reference marks each torn-down pair with a *tombstone*) and re-run
`onSpawn` to re-arm them. A listener armed **outside** `onSpawn`, or behind a guard that
survived the teardown, was torn down and never re-armed — the reference calls that
*class-(c) deafness*. The game doesn't complain: the request goes out, nothing answers.

And here's the poison: **re-saving does not rewire it** if the "already armed" guard lives
somewhere the teardown can't reach. A guard in **persisted state** does exactly that
(confirmed in the reference); in module scope it depends on which file got saved. The
practical rule is the only safe one: **trust no guard that the teardown doesn't clear.**

```js
const DEAF = 90, PING = 60;   // 3 s with no echo = deaf · 2 s between beats (30 Hz)
export function onSpawn(api)    { arm(api); }
export function update(dt, api) { arm(api); beat(api); M.step(dt, api); }

function arm(api, force) {                    // idempotent and cheap: it fits in every tick
  const s = api.scratch('ears');
  if (s.armed && api.getTick() - (s.echo ?? -DEAF) <= DEAF && !force) return;
  if (s.off) { s.off(); s.off = null; }       // tear the old one down before arming
  s.off = api.on('valley:action', (p) => { s.echo = api.getTick(); M.receive(api, p); });
  s.armed = true; s.echo = api.getTick();
  api.notifyDm('valley listener (re)armed on tick ' + api.getTick());  // a silent re-arm IS the bug
}
function beat(api) {
  const s = api.scratch('ears');
  if (api.getTick() < (s.next ?? 0)) return;
  s.next = api.getTick() + PING;                // deadline in ticks, never `getTick() % 60`: with
  api.emit('valley:action', { type: 'ping' });  // updateSchedule the modulo almost never lands
}
```

At install time, check **once** that the manager's `emit` reaches the manager's own listener
(a `notifyDm` in the handler); if it doesn't, the ping is coming from another entity. And
leave a door for your hand — an action that calls `arm(api, true)`; without it, the repair is
restarting the room.

**How it fails:** re-arming without tearing down. Two listeners on one event count the point
twice, and the symptom is a score climbing 2 at a time — which nobody connects to "I saved
the file three times".

## PATTERN 5 — one authority per truth

Manager-as-entity is already law (`gavi#programar-de-verdade` LAW 3,
`gavi#fazer-multiplayer`). What gets added here is **cache discipline** for score, round
phase and world clock: one owner publishes with a monotonic `rev` and everything else reads;
**a module cache is a cache, never the truth** (in doubt, the published value wins); and **a
merge never steps down in completeness** — two sources on the same field, the winner is
decided by **value**, not by arrival order: a machine only raises the datum, only a person's
explicit edit lowers it.

```js
function truth(api) {
  const s = api.scratch('truth'), v = api.getObjectState('referee');
  if (!v) return s.cache ?? null;       // no owner: a stale cache beats a null in the loop
  if (v.rev !== s.rev) { s.rev = v.rev; s.cache = v; }
  return s.cache;
}
```

**How it fails:** the reader "correcting" what was published. The value **flickers** — it
changes and comes back on the next tick. Whoever reads asks (`emit`); only the owner writes.

## PATTERN 6 — mesh and collider in the same frame of reference

A wide mesh following the ground is already in `gavi#three-js` LAW 6. What's missing is the
collider, and the piece that **moves**. One parts function, two consumers, zero repeated
arithmetic:

```js
function parts(ctx, emit) {                   // THE ONLY place with the arithmetic, in LOCAL frame
  for (let i = 0; i < 7; i++) emit(-3 + i, 0, 0, 1, 0.3, 2);
}
export function geometry(ctx) { parts(ctx, (x,y,z,w,h,d) => block(ctx,x,y,z,w,h,d)); }
export function collider(ctx) { parts(ctx, (x,y,z,w,h,d) => box(ctx,x,y,z,w,h,d)); }
```

**The rule for the piece that moves:** geometry that samples the ground **re-derives itself**
when the terrain changes or the object moves (`gavi#three-js` LAW 6) — on a static piece
that's exactly what you want; on a **pushable** piece the mesh changes shape on the first
shove and starts telling a different story from the collider. **A piece that moves does not
call `ctx.groundY` inside its geometry**; ground height comes in through the behavior, at the
entity's position. (the exact instant of each re-derive I never confirmed — **check first**
before explaining the mechanism.) Prove it with `colliders: true` and
`api.traverseCheck(a, b)`: a 0.37 m step beats a 0.3 m autostep with every collider in place,
and the symptom is an invisible wall.

## PATTERN 7 — a deliberately duplicated table

The generator runs on the client, the barrier runs on the server, and both need the SAME
table of gaps. A shared `require` is the right answer when both sides load the module; when
they don't, the duplication is **legitimate** — what makes it safe is the warning in **both**
files, each one naming its twin:

```js
// ⚠ TABLE DUPLICATED in scripts/lib/wall-barrier.js (the server reads it there).
//   changed here, change it there IN THE SAME COMMIT. divergence = a gate that's drawn and won't open.
const GAPS = [[-8, 3], [4, 3]];
```

**How it fails:** the warning on one side only. The file without the warning is the one
somebody edits six weeks later, and the bug that comes out is geometry and collision
disagreeing, with no log.

## PATTERN 8 — CPU discipline without amputating the feel

**The red line first:** input, hero and camera stay at **full rate**. Everything else
negotiates. A saving the thumb can feel isn't a saving, it's damage.

| technique | number | where |
| --- | --- | --- |
| declared `updateSchedule` | `{ every: 2 }` = 15 Hz · `{ every: 3 }` = 10 Hz · `{ near: { tag: 'player', radius: 40 } }` | cohort, manager, dressing |
| **never** both gates | `updateSchedule` **replaces** `getTick() % N`; with both, the script all but stops running | every migration |
| write threshold | under ~0.2° or under ~0.5 mm doesn't enter the batch | everything that writes a transform |
| hysteresis | on at 40 m, off at 46 m (~15% slack) | detail, aggro, sound |
| half-rate band | near, full · 15-40 m `every: 2` · beyond that `every: 4` + `visibleRange` | big cohort |
| per-tick cache | `getPlayers`, manager state: one read per step, into a local | system machine |
| zero allocation in the hot loop | buffer in `scratch`, classic `for`, no `map`/`filter`/spread per item | loops above ~200 items |
| distance without the square root | `dx*dx + dz*dz` against `r*r` | every sweep |

When the frame is expensive, **change technique** before you deliver less world
(`gavi#qualidade-sem-falha` §1): one mesh instead of thirty boxes, `visibleRange` instead of
a per-tick gate, `api.setPositions`/`readPositions` instead of N calls.

## CONTRACT MIGRATION — changing a field three files read

`state.pouch` is `{ planks: 16 }` and now it needs durability per stack, so it has to become
`{ planks: { n: 16, wear: 0 } }`. Five files write it, two read it (grep said so — step 3).
The move everybody's instinct reaches for is the **flag day**: change the shape, fix all seven
files, save. That is the one move guaranteed to break, because saves land one file at a time in
a **running** game — between the first save and the last, writers are producing the new shape
into readers that only understand the old one, and the player is standing in the middle of it.

**Never a flag day.** Five steps, and each one leaves a world that runs:

| # | do | prove before you take the next step |
| --- | --- | --- |
| 1 | **add** the new field beside the old. nothing reads it yet | the game behaves exactly as before — you added, you changed nothing |
| 2 | every writer writes **both**, from the same source value in the same patch | read both back on a live entity: `api.getObjectState(id)` shows the pair agreeing |
| 3 | move **ONE** reader to the new field | that one feature, exercised in the world. the others are still on the old field and still correct |
| 4 | repeat 3 until no reader touches the old field | `grep pattern:"\.pouch\b" path:"scripts/"` returns writers only |
| 5 | delete the old field: writers first, then the read path | grep returns **nothing**, and one live entity confirms the key is gone |

The deletion in step 5 is `api.deleteState('pouch')` (or `api.deleteObjectState(id, 'inv.sword')`
for a nested key) — a `patchState({ pouch: undefined })` deletes only at the **top level** of the
patch, and a nested `undefined` gets **assigned**, so the key survives `Object.keys` and your
"deleted" field comes back to haunt a reader. `null` never deletes; it stores `null`.

**And the rule that outlives all five steps: a save can outlive the code that wrote it.** Rows
in `api.sql` were written by a version of this game you have already deleted. Nothing rewrites
them when you save a script. So:

```js
// SKETCH — a reader that tolerates both shapes, forever. it never assumes today's code wrote the row.
function readPouch(s) {
  if (s.pouch2) return s.pouch2;                       // { planks: { n: 16, wear: 0 } } — today
  const old = s.pouch || {};                           // { planks: 16 } — written months ago, still in a save
  const out = {};
  for (const id in old) out[id] = { n: old[id], wear: 0 };
  return out;                                          // one shape reaches the rest of the game
}
```

One function, one place, and every caller downstream sees a single shape. The alternative —
`typeof` checks sprinkled through five files — is the same migration done five times, wrong in
four of them.

If you want the old rows genuinely gone, migrate them **forward, once**, and remember where SQL
is reachable from: **not** an entity behavior. `api.sql` is host-only, and in multiplayer entity
behaviors never get it whatever their realm — the lanes are `engine.behaviors` lifecycle hooks,
`engine.crons`, and `run_script`. So the shape is: the behavior bumps a counter on the player's
**own** entity, and a cron or `onPlayerDisconnected` drains it into rows. Data flows back the
other way through replicated state. Saves and rows in full: `gavi#memoria-infinita`.

## WHAT NOT TO ABSTRACT

**Two similar things are two things. Three is a pattern.**

Premature shared code is the second most expensive mistake in a live codebase — first place
belongs to the listener that went deaf without a word (PATTERN 4) — and it is expensive for a
reason that never shows up on the day you write it: **it couples two features that were about
to diverge.** The mob walk and the player walk look identical for a week. Then mobs get
pathfinding, players get sprinting and a fly toggle, and `lib/walk.js` grows a `kind` argument,
then a second one, then a branch per caller. Now every mob change risks the player's feel, the
file nobody may break. Two 40-line files that repeat a `Math.hypot` would have cost nothing.

| the situation | do this |
| --- | --- |
| the second thing that looks like the first | **duplicate it.** write the second file. let them diverge or converge on their own |
| the **third** thing that looks like the first two | now extract — and extract what all three actually share, which is usually less than you assumed |
| two callers need the same **table** and only one of them can `require` it | duplicate the table on purpose, with the warning on **both** sides (PATTERN 7) |
| the shared thing is a **number** | that is a sidecar (`lib/data/*.json`), not an abstraction. the JSON is the shared code |
| the shared thing is a pure function of its arguments (`easeOutCubic`, distance, clamp) | already written: `require('builtin/math')`, `builtin/easing`, `builtin/vec3`. **never** rewrite these |

The test before you extract, in one line: **can you name the concern the helper owns without
using the word "and"?** `lib/aim-ray.js` owns *"what is the crosshair pointing at"* — one
concern, three callers, correct. `lib/entity-helpers.js` owns nothing, and it becomes the file
where unrelated code goes to hide from architecture.

And the honest inverse: **a duplicate that has to stay in sync is a contract**, so write the
contract down. Two copies with the warning in both files are safe for years. Two copies where
one file has never heard of the other are the bug in PATTERN 7 — geometry and collision
disagreeing, with no log.

## the architecture proof — four receipts

1. **the probe drives the machine:** 30 steps with `dt` in hand, cost as a number.
2. **the gate publishes:** `spent`/`pending`/`dropped` readable, `dropped` at **0** with the world at rest.
3. **the ear beats:** the echo arriving — and a re-save of the file with the echo still arriving; it's the only test that proves PATTERN 4.
4. **the eye:** a 6-frame `burst` with the cohort walking (two identical tiles = it isn't running) and `colliders: true` on the piece you moved.

Missing one? Then the line is Law 3 of `gavi#ser-a-gavi`: *"it's in the world, I haven't
looked yet"*. At top effort every one of the four is non-negotiable (`gavi#uma-so`).

## the failure list — the six that cost a session

| the trap | the TELL (what you actually see) | the fix |
| --- | --- | --- |
| a second system writing transforms straight through `setObjectProperty` | **"it's sticking to me"** — the hero's rig half-writes, head at the new pose, arm at the old | route it through `throughput.request`; PATTERN 2 keeps `CAP − 16` for the hero |
| a spawn wave dropped loose into one tick | the game freezes ~10 s and that script is named in `getLogs()` — the 3-strike park | drained queue, fixed slice per tick (PATTERN 3). smaller bursts don't help: the 3 s window catches them |
| the cancel mark left out of `tags` | you "cancelled" the wave and the already-born half keeps walking around forever | put the mark IN `tags` at spawn; `cancel` clears the queue **and** `api.query({ tags: [mark] })` |
| `api.on` armed outside `onSpawn`, or behind a guard the teardown can't clear | right after you saved the file, the request goes out and **nothing answers** — no error at all | arm inside `onSpawn`, re-arm idempotently from `update`, `notifyDm` on every re-arm (PATTERN 4) |
| re-arming without tearing the old listener down | the score climbs **2 at a time** — nobody links that to "I saved the file twice" | `if (s.off) s.off()` before every `api.on` |
| `updateSchedule` kept alongside a hand-rolled `getTick() % N` | the system runs correctly "sometimes" — two gates with independent phases rarely coincide | delete the manual gate. the declared schedule **replaces** it |
| `visible: false` used to hide a manager, `physics` left alone | an invisible wall in the middle of the arena that nothing explains | `physics: 'none'` too — `visible` is render-only, the collider stays solid |

## THE SMELL TABLE — what the creator says, what it structurally means

The creator reports a **symptom**. Almost every symptom in a crowded game has a **structural**
cause, and the sentence they used narrows it before you open a single file. Read the left
column in their words; the right column is what to grep for first.

| what they say | the structural cause | the first grep |
| --- | --- | --- |
| **"it works sometimes"** | **two writers on one field.** both do read-modify-write, so the second one's copy was taken before the first one's write landed and one delta vanishes. no error, ever | `grep pattern:"<field>" path:"scripts/"` — count the `patchState` sites. one owner, or a request → owner (`gavi#programar-de-verdade`) |
| **"it got slow when we added more"** | **per-object behavior where one system belongs.** N entities = N `update()` calls, N api materializations, N watchdog samples per tick | `api.query({ tags:[...], select:'ids' }).length` × the number of scripts on each. one cohort script (THE STACK §cohort) |
| **"fixing X broke Y"** | **one file owns two concerns.** the coupling is usually a shared module-level variable or a shared state key, not a shared function | read the file's top comment. if it needs "and" to describe itself, split it at the seam (THE EXTENSION SEAM) |
| **"nobody can find where that happens"** | **logic on the player instead of a named manager.** the player exists in N copies and has no address, so the behavior has no home to look in | `api.getSpec('player.behavior')` vs the manager sweep. if a global truth is in the stack, it's on the wrong layer |
| **"it works for me, not for them"** | **a client-local value treated as truth** — local memory, or a `realm: 'client'` object. it never crossed the wire, so only one machine ever knew | `grep pattern:"realm: *['\"]client"` and every module-level `let`. THE REALM MAP |
| **"it's missing"** — and you can see it on screen | **audited from the wrong side.** a client-realm entity is invisible to a server query; both readings are honest | one `identify_object` on the client against one server-side `api.query`. THE REALM MAP §the trap |
| **"it broke right after I saved"** | **an `api.on` armed where the rewire can't re-arm it** — outside `onSpawn`, or behind a guard the teardown doesn't clear | `grep pattern:"api\.on\("` — is every call inside `onSpawn`? PATTERN 4 |
| **"it counts twice"** / **"it duplicates"** | **two lanes, no fence** — an emit and a poll both resolved, or a listener armed twice without a teardown | grep for the sequence number. one `claim(who, n)`, plus a replicated stamp on the target (THE REALM MAP §two lanes) |
| **"it worked yesterday and now old saves are weird"** | **a contract changed shape with a flag day**, and rows written by the deleted code still carry the old shape | the reader: does it tolerate both shapes? CONTRACT MIGRATION |
| **"the HUD says one thing, the world says another"** | **`ui.js` deciding instead of reading** — two derivations of one truth, drifting | `grep pattern:"sendAction\(" path:"scripts/ui.js"` — the UI reads `localPlayer.state` and decides nothing (THE STACK) |
| **"adding one feature means editing five files"** | **premature shared code.** a helper grew a `kind` argument per caller and now every caller is coupled to the others | count the branches in the helper. WHAT NOT TO ABSTRACT |
| **"it's sticking to me"** / the body comes apart | **an unmetered second writer of transforms**, so the wire ceiling refused a whole message and the hero's rig was in it | `grep pattern:"setObjectProperty\(|batchSetObjectProperties\("` — everything goes through one gate (PATTERN 2) |

Two things this table is not. It is not a diagnosis: it is where to **look first**, and the
grep either confirms it in thirty seconds or clears it. And it is not an excuse to skip the
probe — `gavi#programar-de-verdade` is explicit that you measure before you theorise, and every
row above ends in a command precisely so the theory dies fast when it's wrong.