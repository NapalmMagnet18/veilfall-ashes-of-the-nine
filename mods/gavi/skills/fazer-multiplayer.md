---
name: Make Multiplayer
description: How to decide and build the social shape of a game — alone, together, against, or alone in a shared room — networking.mode and the engine default, one simulator per entity and what replicates, state ownership and the manager entity, instanced places and rooms, the hard wire ceilings and why a per-tick publish from the player floods a domestic uplink, the two-lane pattern (emit for speed plus state for truth, one sequence number on both), and what changes in the design once there's another person standing there.
---

# Making multiplayer

A deep dive on one row of the shape table in `gavi#desenhar-o-jogo` ("with whom?").

## LAW ZERO — the social shape is the blueprint, not a feature

> **Changing the social shape later changes state ownership, authority, secrecy and pacing.
> That's a renovation, not a polish pass.** A solo score going competitive needs a referee;
> quiet tension in a shared room loses the quiet forever.

## I want X → the shape is Y

| I want | the shape is | what it costs |
| --- | --- | --- |
| campaign, story, a puzzle at your own pace | **solo** — `networking.mode: 'singleplayer'` | nothing replicates; nobody shows up |
| same world, each on their own, seeing the others walk past | **shared room with no common rule** | just the engine default; zero managers |
| two people on the same task | **co-op with an objective manager** | 1 manager entity + shared state |
| a scoreboard, who won, rounds | **competitive with a referee** | the manager decides EVERYTHING that scores |
| a closed 4-player match, a dungeon per party | **instanced place** (`instanceMode: 'instanced'`) | a manager per instance + a door back |
| separate servers, a room list, invites | **routing** (`spec.routing` + `pickRoom`) | a door ceiling and a choice rule |
| queue, rating, a party assembled before entry | queue in the database → room named by link | the room name is the ticket |

## The engine default, and who simulates what

Write nothing and `networking.mode` resolves to `'multiplayer'`: **every player owns their
own state** and their client simulates their body, with no server correction — never try to
"correct" somebody else's position. `'singleplayer'` is the only other value and it means **no
replication** (the only mode where an ordinary behavior gets `api.sql`); everything else is
multiplayer. Switching is a renovation, and it's one line:
`api.patchEngine({ networking: { mode: 'singleplayer' } })`.

Each entity has **one** simulator, and its hooks run only there:

| entity | where its hooks run |
| --- | --- |
| player | that player's own client |
| ordinary place object | the elected place host (one machine, no more) |
| `realm: 'client'` | the machine that created it, and nobody else |
| `onPlaceStart` · `onPlayerConnected` · `onPlaceShutdown` · `onPlayerDisconnected` (`engine.behaviors`) | the host seat |
| cron (`engine.crons`) | the host seat |

- `realm: 'server'` changes the **owner**, not where the hook executes: in multiplayer, an
  entity behavior never receives `api.sql`.
- An entity hook **cannot be `async`** — it rejects the ENTIRE file, every hook goes inert,
  and the only symptom is the one object that stopped reacting. Lifecycle and cron can be.
- `api.runInSeconds` lives on the side that simulates: a player's timer dies with their tab; a
  deadline that has to survive goes into the spawn's `lifetime` or into a target tick in state.

## LAW 1 — global logic lives in a manager entity

`gavi#programar-de-verdade` LAW 3, mandatory here: the player exists in N copies and
**disappears the moment they close the tab** — a score kept on the player walks out the door
with them. Manager in the default place: it never unloads, and without `replicate: 'world'` a
read from another place comes back `null`.

```js
api.spawn({
  id: 'referee', tags: ['manager'], behavior: 'scripts/referee.js',
  replicate: 'world',                        // readable from every place; ~1 hop behind
  properties: { visible: false, physics: 'none' },
  state: { phase: 'waiting', score: {}, round: 0 },
});
```

## How the manager and the player talk

The player **asks**; only the manager **decides**.

```js
// scripts/referee.js
export function onSpawn(api) {
  // api.on HAS to be armed inside onSpawn. Outside it, it doesn't listen and doesn't complain.
  api.on('match:request', ({ type, player, amount }) => {
    if (api.getState().phase !== 'playing') return;               // a request is not an order
    if (type !== 'bone' || !(amount > 0 && amount <= 3)) return;   // validate the RANGE
    const score = { ...api.getState().score };
    score[player] = (score[player] ?? 0) + amount;
    api.patchState({ score });                                    // everyone reads this
    api.patchObjectState(player, { myScore: score[player] });      // talking to one only
  });
}
// scripts/player.js — asks, never decides
// the hook signature is (other, objectApi, contact) — and `other` already carries id/tags/state.
export function onCollide(other, api, contact) {
  if (other?.tags?.includes('bone'))
    api.emit('match:request', { type: 'bone', player: api.id, amount: 1 });
}
```

A shared read is `api.getObjectState('referee')`. A UI button lands in the control target's
`onInput` through `sendAction`, and **every action read there has to exist in
`inputs.actions`**.

## What the client may do, and what it never does

| may, by design | never |
| --- | --- |
| move, jump, aim its own body (zero correction) | decide that it won, that it hit, that the point counts |
| write its own player state | write the state of an entity another owner holds — that write is fenced |
| ask through `api.emit` | write to the database in MP (`api.sql` only in lifecycle, cron, run_script) |
| read any replicated state in the place | keep a secret in replicated state |

**Secrets do not exist in replicated state.** `replicate: 'place'` = every client in the place
*receives* the field (a hand of cards, the killer's position), and the only delivery filter is
`visibleTo: 'editors'`, which serves the creator alone. A real secret lives in a database row
read on the host seat, or in a `realm: 'client'` + `audience: 'local'` object
(`data-and-saves`).

## Instanced places — one match per party

Born on entry, dies empty. `enterPlace` creates and moves in the same call and hands back the
instance id, or `null` when it didn't take (reason in `getLogs()`).

```js
export function onInput(input, api) {          // action declared in inputs.actions
  if (!input.actions['create-match']) return;
  const placeId = api.enterPlace(api.id, { placeId: 'arena', createIfMissing: {
    instanceMode: 'instanced',   // 'shared' | 'instanced'
    persistence: 'ephemeral',    // 'ephemeral' | 'session' | 'persistent'
    objects: [{ id: 'arena-manager', behavior: 'scripts/arena-manager.js',
      properties: { visible: false, physics: 'none' },
      state: { phase: 'waiting', hostId: api.id, maxPlayers: 4, roster: {} } }],
  } });
  if (!placeId) api.toast("Couldn't open the arena — try again", { duration: 3 });
}
```

There is no entry lock on a place: access control is the manager sending the intruder back
with `api.enterPlace(id, { placeId: 'main' })`.
`api.query({ tags: ['player'], radius: 9999 })` is "everybody in here"; empty list =
`api.destroy()` on the manager (`places`).

## Rooms and matchmaking — which one, when

A room is **another server**; a place is another scene on the same server.

| I want | tool | how |
| --- | --- | --- |
| to cap how many people fit together | `api.patchRouting({ maxPlayers: 8 })` | ceiling on the door; undeclared, the default is **20**, range 1–200 |
| a good default door | `firstOpenRoom(ctx)` from `builtin/room-routing` | a 3-line `pickRoom` |
| server list / fixed region | `roomFor('us-east')` | same key, same room, always |
| invite by link | hand `ctx.requestedRoomId` back untouched | the room only exists once the first person arrives |
| a closed party match | **instanced place**, not a room | cheaper: no reconnection at all |
| queue, rating, pre-made party | queue in the database + a `?room=` link | `pickRoom` **cannot see the database** |

`pickRoom(ctx)` runs **in the browser, before connecting**: no objectApi, no database, no
world, only `require('builtin/*')`. Budget 2 s; `null`, an error, or a name outside the shape
(1–64 of letters, digits, `.`, `_`, `-`) falls to the default, with the reason in `getLogs()`.
A full room rejects and the engine re-runs with it in `rejectedRooms`; on the third, it opens
a new room — don't write a retry.

**The gotcha that splits a party in silence:** every instanced place in a game lives on the
SAME server — past the door's ceiling, the next player lands in another room, where your match
doesn't exist. Size `maxPlayers` as `matches × party size + lobby slack`.

## Network: `replicate`, `audience` and the write ceiling

- `replicate`: `'place'` (default, only people inside the place read it) or `'world'` (global
  manager readable from every place, ~1 hop behind; read-after-write only on the simulating
  machine).
- `audience` (`'local' | 'aoi' | 'all'`) is **exclusive to `realm: 'client'`** — `spawn()`
  refuses the pair with `realm: 'server'`.
- Screen juice (`screenShake`, `hitstop`, `toast`, `screenFlash`, positionless sound) in MP is
  **for yourself only**: `place`/`all`/another player reaches nobody and logs the miss.
  World-anchored juice reaches whoever is close and fires once — **each person gets the kick
  from THEIR OWN trigger.**

Default simulation tick **30 Hz** (a 33 ms interval) — nothing replicates faster, and the delta
is batched at the end of the tick: the cost is **per field per tick**, not per call.

### the hard ceilings, and the uplink

One message carries at most **2048 rows per array** (creates, updates, deletes each),
**64 component entries per row**, **64 KiB in any single value**, **1 MiB in total**. The gate
**fails closed on the whole message**: one row past the line and the other 2047 die with it. It
never trims and keeps the good half.

That is why **a per-tick publish from the player is the most expensive line in the game**. The
player's own client is the only machine that can send that body upward, over a **domestic
uplink** — the thin half of a home connection — and it shares that pipe with every other field
that player owns. Publish 12 fields every tick out of `update()` and one player alone is
**360 rows/s** going up; four players, 1440; put a 16-bone rig on top and the message that
finally crosses a ceiling takes the hero's pose down with it. What you get told is
**"it's lagging"**, never "it's replicating too much".

Run the arithmetic before you write the line: `changing fields × writes/s × players`. Thirty
bones every tick with 4 players = 3600 rows/s; the same rig at `every: 3` = 1200.

```js
export const updateSchedule = { every: 3 };   // 30 Hz / 3 = 10 writes per second
// or, instead: { near: { tag: 'player', radius: 40 } } — 30 Hz inside 40 m, silent outside
```

- One system sweeping the cohort in a batch, never a behavior per object (`gavi#programar-de-verdade` LAW 4).
- Don't write a value equal to the one already there; threshold ~0.2° or ~0.5 mm.
- State that belongs to the local machine only goes in `api.scratch()` — it never replicates.
- `api.sql`: ≤64 statements, ~250 ms, ~10k rows per call. Write at moments (join, leave, end of match, cron), never in the frame.

## The two-lane pattern — `emit` for speed, state for truth

An event is fast and forgettable. State is slow and unforgettable. Anything the player is
meant to **feel now** and **still be right about later** rides both lanes, stamped with the
same sequence number so the receiver can apply it exactly once.

| lane | what it's good at | how it loses |
| --- | --- | --- |
| `api.emit(name, payload)` — server-sequenced, same-place `on()` listeners | this tick. no field cost, no history | a listener not armed in `onSpawn` never hears it; somebody who joins 2 s later never hears it; a client-realm emit never delivers at all (one warning, then silence) |
| `patchState` / `patchObjectState` — replicated fields | survives, and a late joiner reads it on arrival | batched at end of tick, and it costs **per field per tick** — the ceiling above is its ceiling |

```js
// scripts/referee.js — the manager publishes on both lanes, one seq.
export function onSpawn(api) { api.patchState({ hitSeq: 0 }); }

function publishHit(api, victimId, damage) {
  const seq = (api.getState().hitSeq ?? 0) + 1;
  // SLOW LANE — survives, and the victim reads it on their own client even if the event was missed
  api.patchObjectState(victimId, { lastHit: { seq, damage } });
  api.patchState({ hitSeq: seq });
  // FAST LANE — this tick, for whatever has to react at the speed of the punch
  api.emit('match:hit', { seq, victimId, damage });
}
```

```js
// scripts/player-hitfeed.js — on the PLAYER, so it runs on that player's own client:
// screen juice from update() defaults to the acting player, which is exactly who should feel it.
export const updateSchedule = { every: 2 };        // 15 Hz reconciliation is plenty for a hit feed
export function update(dt, api) {
  const hit = api.getState().lastHit;
  if (!hit) return;
  const s = api.scratch('hitfeed');                 // local memory, never replicated
  if ((s.seen ?? 0) >= hit.seq) return;             // idempotent: the same seq never lands twice
  s.seen = hit.seq;
  api.screenShake(0.35, 0.18);
  api.hitstop(0.06);                                // 60 ms — long enough to feel, short enough to not fight input
}
```

Two rules make it safe. **The seq is monotonic and the receiver compares it** — that's what
turns "both lanes delivered" from a double hit into one hit. And **the slow lane is the one
that decides**: if the two ever disagree, the state value wins, because it's the one a
reconnecting player will read.

## What changes in the DESIGN once there's another person

| the law | why |
| --- | --- |
| die and be back in **≤5 s** — ghost, cannon aim, spectator with a button | waiting 90 s watching is a social punishment |
| getting in the way is a choice, never an accident (friendly collision, a door in the face) | if you can ruin it by accident ⇒ the room turns into a fight |
| helping pays better than ignoring (revive, boost, ping) | otherwise it's solo with a witness |
| targets with an owner, or credit for taking part | first-grab loot has people sprinting across somebody else's game |
| nothing that demands silence | whispering and concentration want `singleplayer` or an instance of one |
| name at the measured height (`getWorldBoundsBox(id).size.y`), silhouette readable at 15 m, feedback on THEIR hit | a partner's invisible success is a success that never happened |

## Testing a two-player game on your own

Open a **second client** (another tab in the same room) — without it you're testing one
player, not multiplayer. Put a `notifyDm` on **both sides** of the contract: a request going
out with no decision coming back is an `api.on` armed outside `onSpawn`.

```js
const p = api.getPlayers().map(pl => ({ id: pl.id, name: pl.displayName, x: Math.round(pl.feetPosition.x) }));
return { total: p.length, players: p, phase: api.getObjectState('referee')?.phase ?? null };
// on the player:  api.notifyDmOnce('request-' + api.id, `${api.getUsername()} asked for a point`);
// on the manager: api.notifyDm(`referee gave ${amount} to ${player}`);
```

`api.getPlayers(place?)` always includes you and, with no place given, sweeps every place —
that's how you find out the second client landed in ANOTHER room. Confirm `api.getRoomId()`
and `api.getEntityPlace(id)` before blaming the code; a dev test takes itself out at publish
with `api.getRoomMode() === 'dev'`.

## The failure list — the nine that cost a match

| the trap | the TELL (what the person playing sees) | the fix |
| --- | --- | --- |
| score/objective kept on the player instead of the manager | points zero out the moment somebody leaves; every screen shows a different score | manager entity in the default place, `replicate: 'world'` |
| `api.on` armed outside `onSpawn` | the action vanishes with **no error** — the request goes out, nothing answers | arm every ear inside `onSpawn`; a script edit re-runs it and re-arms |
| an entity hook marked `async` | that one object stops reacting entirely, nothing in the log | drop `async` — only lifecycle hooks and cron may be async |
| a client writing state an entity's other owner holds | the value **flickers**: it changes and comes back next tick | ask with `api.emit`; only the owner writes |
| `api.sql` inside a multiplayer behavior | nothing saves; progress is gone on the way out | write in lifecycle hooks, cron, or `run_script` — never in a frame |
| screen juice sent with a `place`/`all` audience | the kick happens for **nobody**, just a miss in `getLogs()` | fire it from each player's own trigger; world-anchored juice for the room |
| a transform written every tick for a big cohort | **"it's lagging"** — never "it's replicating too much" | `updateSchedule`, a 0.2° / 0.5 mm threshold, one batch (see the ceilings) |
| `maxPlayers` under the real concurrency | friends join and cannot see each other — the party split in silence | size it as `matches × party + lobby slack`; the default is 20 |
| a secret parked in replicated state | anybody who inspects reads the other player's hand | a database row on the host seat, or `realm: 'client'` + `audience: 'local'` |

Where to go from here: verb and genre in `gavi#desenhar-o-jogo`; contract and probe in
`gavi#programar-de-verdade`; the six-layer stack and the write gate in
`gavi#arquitetura-avancada`; the bug that only shows up while playing in
`gavi#cacar-bugs-jogando`; the end-to-end sweep with two clients in `gavi#testar-tudo`;
database and queue in `data-and-saves`; lobby, instance and door in `places` ·
`rooms-and-matchmaking`.