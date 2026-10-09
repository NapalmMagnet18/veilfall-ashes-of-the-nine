---
name: Sandbox Genre
description: Gavi's sandbox and building skill — which surface to build on (voxel blocks vs entity pieces), persistence before tooling, the verb place/rotate/erase/paint with tactile feedback, the preview ghost, reach and grid, shared builds, the piece budget, and the law that you never erase someone else's work.
---

# Gavi — sandbox and building

The promise is short: **this thing is mine**. So is the cardinal sin: **losing what I built**.
Read `gavi#desenhar-o-jogo` first — the verb, the three-ring loop and the law of three feedback
channels hold here with no discount.

## Pick your path in ten seconds

| what they are building | the surface |
| --- | --- |
| minecraft-like, blocks, digging, caves, mining | **voxel terrain** — `terrain.kind: 'voxel'`, `raycastVoxel` → `breakVoxel`/`placeVoxel`. the engine persists chunk edits for you |
| terraria-like, 2d digging | **voxel** in a `2d-side` place, `defaultSlices: { sideZ: 0 }`. tilemaps are painted ground, not diggable ground |
| a wall, a floor, a house, a prefab | `fillVoxels(min, max, mat)` / `placeStructure(...)` — ONE call, never a `placeVoxel` loop |
| furniture, props, decoration, free rotation | **entity pieces** — one spawned entity per piece + your own SQL table |
| off-grid angles, a tilted roof | entity pieces. voxels are a lattice by definition |
| anything at all, before the tooling | LAW ZERO — place 3, leave, come back. if they are gone, stop making tools |
| "I placed it and it vanished on reload" | you are on the entity lane with no schema. see The schema |
| "the frame died after 300 pieces" | a piece at rest is `physics: 'static'`, never `dynamic` |
| two players building the same cell | the manager decides. never a client-side latch |
| erasing someone else's work | THE LAW at the bottom. confirmation with the owner's name |
| proving it survives | `gavi#testar-tudo` · keeping the finding | `gavi#memoria-infinita` |

**The verb** is place. **The loop** is see a gap in your own build → place → step back → see the
next gap. **The camera** stays out of the way: no auto-rotation while a ghost is live, and the
crosshair is the hand. **The three numbers that decide the feel:** reach **12 m**, grid **1 m**,
yaw step **15°**.

## LAW ZERO — persistence before any pretty tool

> **A tool that loses work is worse than no tool at all.**

The test comes before the most beautiful gizmo in the world: place three pieces, rotate one,
paint another, leave the room, wait for it to empty, come back. If the three did not come back in
the same place, with the same rotation and the same colour, **stop making tools** and finish the
schema. A sandbox that resets did not cost time, it cost authorship. Mandatory order: schema →
save → load → pass the test → only then place/rotate/erase/paint → only then grid, brush, economy.

**On the voxel lane you get this for free.** Terrain edits are engine-persisted: each region edit
stores one compact command per touched chunk, replicates, and reloads with the chunk. You own no
table. That alone is why a block world should be voxels and not 40,000 box entities.

## Lane A — voxel blocks (the block-world default)

The single source of truth is `materialAt(ctx)` in the terrain generator: return a material-id
string for filled space, `"air"` for empty. `"air"` is reserved — never define a material named
it. `chunkSize` must be **16**; it is the only supported size.

The whole dig-and-place loop is one hook. The cells live on the **hit object**, not on
`hit.x/y/z` — that is the mistake everyone makes once:

```js
// scripts/mao-blocos.js — inputs.actions: { breakBlock: { mouse: 'left' }, placeBlock: { mouse: 'right' } }
const REACH = 8;                                   // metres — an arm's reach, not a sniper rifle
export function onInput(input, api) {
  if (!input.actions.breakBlock && !input.actions.placeBlock) return;
  const ray = api.getInputRay(input);              // the REAL camera ray, lock or cursor
  if (!ray) return;
  const hit = api.raycastVoxel(ray.origin, ray.direction, { maxDistance: REACH });
  if (!hit) return;
  if (input.actions.breakBlock) {
    api.breakVoxel(hit.voxel.x, hit.voxel.y, hit.voxel.z);          // hit.voxel = the cell you hit
    api.playSound('cdn/sfx-bloco-quebra.mp3', { position: hit.position, pitch: 0.94 + api.random() * 0.12 });
    api.spawnFx(hit.position, 'scripts/effects/lascas-bloco.fx.js'); // at the impact point
  } else if (hit.adjacentVoxel) {                   // null when the block is fully enclosed
    api.placeVoxel(hit.adjacentVoxel.x, hit.adjacentVoxel.y, hit.adjacentVoxel.z, api.getState().kind || 'stone');
    api.playSound('cdn/sfx-bloco-assenta.mp3', { position: hit.position, pitch: 0.98 + api.random() * 0.08 });
  }
}
```

- **Region calls build; loops kill.** A 16 × 8 wall is **one** `fillVoxels` call, not 128
  `placeVoxel` calls — one compact command per touched chunk, landing the same tick. Pass `"air"`
  or `null` to clear. Ceiling ~1M cells per call. Bulk fills deliberately skip per-cell
  `onNeighborChanged`/`onBreak` hooks, so use `placeVoxel` when a neighbour reaction matters.
- **`placeStructure(source, position)`** stamps a template: a structure id from
  `terrain.structures`, a script ref exporting `build()`, an inline builder, or a serialized
  `{ bounds, palette, voxels }`. Builders `require('builtin/voxels')`; helpers live under
  `lib/*` — never `require('scripts/...')` from a builder.
- **`queryVoxels({ tag, radius })`** is for gameplay at small radius and occasional calls — a
  ladder at r 1.5, a bounce pad at r 0.5, a trigger zone at r 2. Never for rendering, never every
  tick over a big radius.
- **`raycastVoxel` skips authored liquids by default** — pass `includeLiquids: true` for buckets,
  probes and fishing.
- Live growth (water flowing, crops, leaf decay) is `blockBehavior`, not `materialAt` —
  `materialAt` stays pure, with no time and no live state. Budgets go under `terrain.blockTicks`.
  The full surface, marks and structures: the engine's `voxel-terrain` skill.

## Lane B — entity pieces (props, furniture, free angles)

A piece is **one row** and **one spawned entity**. `scripts/db.js` exports `migrate(sql)`, runs
once per (mode DB, spec version) before any player is in, 10 s ceiling, idempotent:
`CREATE TABLE IF NOT EXISTS pieces (piece TEXT PRIMARY KEY, place TEXT, kind TEXT, x REAL,
y REAL, z REAL, yaw REAL, color TEXT, owner TEXT, group_id TEXT, rev INTEGER, dead INTEGER)`
plus `CREATE INDEX IF NOT EXISTS pieces_alive ON pieces(place, dead)`. `owner` is the userId of
whoever placed it; `rev` only goes up (the dirty mark); `dead = 1` is erasing — **never `DELETE`
on a player's click**, only in a scheduled sweep.

In multiplayer **an entity behavior never receives `api.sql`**. Only three lanes do:
`engine.behaviors` (`onPlaceStart`, `onPlaceShutdown`, `onPlayerConnected`,
`onPlayerDisconnected` — these may be `async`), `engine.crons`
(`export async function cron(api)`) and `run_script`. A cron is a 5-field cron with minimum
granularity **1 minute**; "save every 5 s" does not exist. The world is the hot copy, the
database is durability: read placed pieces with `api.query({ tags: ['piece'] })`, never a SELECT
on the gameplay path.

### Saving and loading a BATCH

One `api.sql` call is one transaction; one `INSERT` per click is one transaction per click. The
budgets: **≤ 64 statements per call**, **≤ 100 bound parameters per statement**, ~250 ms of wall
clock, ~10k rows / 4 MB. That parameter cap is exactly why the batch is **one JSON parameter +
`json_each`**: 200 pieces as columns would be thousands of parameters, but as one JSON string it
is **1**. Loading goes in slices of **100–200 spawns per tick** — the watchdog parks one-burst
updates, and two thousand spawns inside a single `for` is a frozen frame.

```js
// scripts/obra-banco.js → engine.crons: [{ schedule: '* * * * *', script: 'scripts/obra-banco.js' }]
//                       → engine.behaviors: ['scripts/obra-banco.js']
const PER_TICK = 150;                        // 2000 pieces in 14 ticks (~0.47 s at this engine's 30 Hz tick)

export async function cron(api) {                                    // save in a batch
  const saved = api.getObjectState('build-manager')?.saved || 0;
  const pieces = api.query({ tags: ['piece'] })
    .filter((o) => (o.state?.rev || 1) > saved).slice(0, 200);       // only the dirty ones, hard cap
  if (pieces.length === 0) return;
  const batch = JSON.stringify(pieces.map((o) => ({ i: o.id, t: o.state.kind, x: o.feetPosition.x,
    y: o.feetPosition.y, z: o.feetPosition.z, w: o.state.yaw || 0, c: o.state.color || null,
    d: o.state.owner || null, g: o.state.group || null, r: o.state.rev || 1 })));
  const { changes } = await api.sql`
    INSERT INTO pieces (piece, place, kind, x, y, z, yaw, color, owner, group_id, rev, dead)
    SELECT json_extract(v.value,'$.i'), 'main', json_extract(v.value,'$.t'),
      json_extract(v.value,'$.x'), json_extract(v.value,'$.y'), json_extract(v.value,'$.z'),
      json_extract(v.value,'$.w'), json_extract(v.value,'$.c'), json_extract(v.value,'$.d'),
      json_extract(v.value,'$.g'), json_extract(v.value,'$.r'), 0 FROM json_each(${batch}) v
    ON CONFLICT(piece) DO UPDATE SET x=excluded.x, y=excluded.y, z=excluded.z, yaw=excluded.yaw,
      color=excluded.color, group_id=excluded.group_id, rev=excluded.rev, dead=0;`;
  api.patchObjectState('build-manager', { saved: Math.max(...pieces.map((o) => o.state.rev || 1)) });
  if (changes === 0) api.notifyDm('build autosave wrote 0 rows — schema or epoch fence');
}

export async function onPlaceStart(api, placeId) {                   // load in slices
  const { rows } = await api.sql`
    SELECT piece, kind, x, y, z, yaw, color, owner, group_id, rev FROM pieces
    WHERE place = ${placeId} AND dead = 0 ORDER BY piece LIMIT 2000`;
  const loadSlice = (i) => {
    for (const r of rows.slice(i, i + PER_TICK)) api.spawn(r.piece, {
      tags: ['piece', 'kind-' + r.kind],
      state: { kind: r.kind, yaw: r.yaw, color: r.color, owner: r.owner, group: r.group_id, rev: r.rev },
      properties: { feetPosition: { x: r.x, y: r.y, z: r.z }, rotation: { yaw: r.yaw },
        primitive: SHAPE[r.kind], material: { color: r.color || 'oklch(0.72 0.05 90)' },
        physics: 'static' } });                                      // a piece at rest is NOT dynamic
    if (i + PER_TICK < rows.length) api.runInTicks(1, () => loadSlice(i + PER_TICK));
  };
  loadSlice(0);
}
```

The same hook spawns, once, `build-manager` (tag `manager`, `physics: 'none'`, `visible: false`,
`replicate: 'world'`, state `next` = next free id): sole owner of the cell index. Trust its own
stamp, never an early world query — `if (getState().built) return` before building, and
`patchState({ built: true })` in the same stroke, or staged loading builds a second town over the
first. Before anything frightening, `await api.sql.backup('before-touching')` — free and instant,
and `api.sql.restore(label)` undoes it.

| persistence question | default answer | number / test |
| --- | --- | --- |
| when do I save? | 1-minute cron + `onPlayerDisconnected` | leaving and coming back gives the build back |
| save what? | only pieces with `rev > saved` | batch ≤ 200 per call |
| a row per piece, or a blob? | a row: owner, group and sweeps need a WHERE | `count(*) … WHERE owner = ?` answers it |
| erase for real? | `dead = 1`; `DELETE` only in a sweep | the bin gives it back within ≤ 5 min |
| load how much? | a page of 2000 in `onPlaceStart`, in slices | 100–200 spawns/tick |
| who writes the index? | one manager entity, `replicate: 'world'` | two writers = a flickering build |
| `changes` came back 0? | a visible refusal: `notifyDm` + a mark in state | never a silent success |

## The verb — what each tool shows before it acts

| tool | SHOWS before acting | refuses when | feedback on the act |
| --- | --- | --- | --- |
| place | a ghost in the exact pose the piece will take | out of reach, clipping, budget full | sound (pitch 0.95–1.05), `squash(id,{amount:0.25,duration:0.12})`, a puff of dust |
| rotate | the ghost already rotated, before you let go | the piece is locked or someone else's | a short click, pitch rising per 15° step |
| erase | a red outline on the piece under the crosshair + the owner's name | the owner is someone else and there was no confirmation | a breaking sound + `animate(id,{keyframes:{scale:0.01},duration:0.1})`, and only then `destroy` |
| paint | the new colour already on the piece under the crosshair | the surface is not paintable | flash `material.emissive` for 0.1 s + a dry sound |

Never erase in the same frame as the click: 0.1 s of shrink separates "I broke it" from "it
glitched and vanished". Feedback is **local and immediate** — sound and body on the click, not
when the server confirms.

## The preview ghost

The ghost is `realm: 'client'` + `audience: 'local'`: it does not replicate, does not persist,
has no physics, and only the owner of the hand sees it. That pair is enforced —
`spawn()` **throws** if you pass `audience` on an object that resolves `realm: "server"`, because
the key would do nothing there. **One ghost per player**, created in `onSpawn` with
`material: { color, opacity: 0.45, transparent: true, emissive, emissiveIntensity: 0.25 }` and
moved afterwards — never destroyed and recreated per frame.

```js
// scripts/mao-construtor.js — attach with api.addBehavior('player', …), never patchPlayer({ behavior })
const GRID = 1, YAW_STEP = 15, REACH = 12;          // metres, degrees, metres
const OK = 'oklch(0.86 0.12 200)', NO = 'oklch(0.62 0.20 25)';

export function onInput(input, api) {
  const s = api.getState(), g = s.ghost;
  if (input.actions.rotate) api.patchState({ yaw: (s.yaw + YAW_STEP) % 360 });
  const ray = api.getInputRay(input);
  const hit = ray ? api.raycast(ray.origin, ray.direction, REACH) : null;
  if (!hit) { api.setObjectProperty(g, 'visible', false); return; }
  const pose = snapPose(hit, input.actions.free ? 0 : GRID, s.yaw);  // held = off the grid
  const v = validate(api, pose, s.kind, g);
  api.setObjectProperty(g, 'visible', true);
  api.setObjectProperty(g, 'feetPosition', pose.pos);
  api.setObjectProperty(g, 'rotation', { yaw: pose.yaw });
  api.setObjectProperty(g, 'material.color', v.ok ? OK : NO);
  api.setObjectProperty(g, 'material.emissive', v.ok ? OK : NO);
  if (!input.actions.place) return;
  if (!v.ok) { api.playSound('cdn/sfx-recusa-seca.mp3', { volume: 0.5, pitch: 0.8 }); return; }
  api.playSound('cdn/sfx-encaixe-madeira.mp3', { pitch: 0.95 + api.random() * 0.1 });
  api.emit('build:place', { kind: s.kind, pose, player: api.id, owner: api.getProfile()?.userId });
}
```

A refusal colour is a **colour**, not an absence: a ghost that disappears when it does not fit
makes the person think the tool broke.

## Placement validation — cheapest question first

```js
function validate(api, pose, kind, ignore) {
  const d = SHAPE[kind], ground = api.getTerrainHeight(pose.pos.x, pose.pos.z);
  if (ground === null) return { ok: false, reason: 'unknown-terrain' };    // null means "I don't know"
  if (pose.pos.y < ground - 0.05) return { ok: false, reason: 'buried' };
  const bud = api.getObjectState('build-manager')?.budget;
  if (bud && bud.used >= bud.cap) return { ok: false, reason: 'budget' };
  const o = api.overlapSegment(
    { x: pose.pos.x, y: pose.pos.y + 0.1, z: pose.pos.z },
    { x: pose.pos.x, y: pose.pos.y + d.height - 0.1, z: pose.pos.z },
    { radius: Math.min(d.width, d.depth) * 0.45, ignoreEntities: [ignore], excludeTags: ['ghost'] });
  if (o.objects.length > 0) return { ok: false, reason: 'clipping' };
  if (o.approximate.length > 0) return { ok: false, reason: 'probably-clipping' };
  return { ok: true, reason: null };
}
function snapPose(hit, grid, yaw) {                      // grid 0 = freedom
  const p = hit.position, snap = (v) => (grid > 0 ? Math.round(v / grid) * grid : v);
  return { pos: { x: snap(p.x), y: grid > 0 ? snap(p.y) : p.y, z: snap(p.z) },
           yaw: grid > 0 ? Math.round(yaw / YAW_STEP) * YAW_STEP : yaw };
}
```

`overlapPoint`/`overlapSegment` return `{ objects, approximate, terrain }`: `objects` intersects
by the exact collider, `approximate` by the bounding box (model mesh, sprite) — treat it as
"probably" and refuse; `terrain: null` is **unknown**, never empty. Both work in every context,
including the server and `run_script`, where `api.raycast` cannot see colliders at all.

**Grid and freedom.** A 1 m grid and 15° of yaw are the default — they make an ordinary person's
build look good by itself; 0.25 m for detail. And a held "free" action that switches both off:
without it the sandbox is LEGO and nobody ever tilts a roof. Every action read in `onInput` must
exist in `inputs.actions`; on a phone it also takes `touch: { gesture: 'tap' | 'hold' }`
(`gavi#fazer-mobile-e-pc`).

## Tool in hand vs. edit mode

**In hand**: the body keeps walking, the crosshair is the hand, each tool is an input action —
the default for a game *about* building, and it costs 1 local ghost per player. **Edit mode**:
the camera lifts, the HUD swaps; it earns its keep when the build is big, and leaving puts the
player back where they were.

The **creator's** hands (god mode, handles, `defineBrush`, `editor()`, `api.undo()`) are the
`god-mode` skill's business, and **none of it becomes a player tool** — handing god mode to the
player is the classic mistake of the genre. Replicate the verb in `inputs.actions` plus a ghost,
build the palette in `ui.js` (button → `sendAction`, read in `onInput`), and "planting" is an
action that spawns in a fan, not a spec brush: four actions, one ghost, an undo stack that is yours.

## Economy is optional; a suggested goal is not

An economy gives rhythm and steps aside when the request is "I want to create in peace". A pure
sandbox with nothing suggested empties out in ~6 minutes: the person places ten pieces, looks at
them, and does not know what she wanted. Three suggestions in order of cost: **a commission**
("build a bridge that crosses the river" — simple to verify, reward = a new piece in the
palette); **the world reacts** (a resident, a light, a bird landing — the world changing colour
*is* the scoreboard); **a showcase** (a plaque with the author's name, a visit from another
player). Failure is optional in this genre; **surprise is not**.

## A shared build

- **Authorship.** `owner` written at spawn with the userId of whoever placed it. Engine caveat:
  `getProfile().userId` is real for the player **themselves** anywhere and for everyone in a
  server context, and is absent for **others** in client code. So: whoever places writes their
  own owner; whoever erases compares against their own userId.
- **Who erases what.** Everyone erases their own; a common area asks for confirmation; a zone
  with an owner, only the owner and whoever they authorised. The rule lives in the manager
  (`getObjectState('build-manager').permission`), not scattered across behaviors.
- **Two people in the same spot.** Validation runs on the client of whoever is placing, so two
  people validate the same cell on the same tick. Do not solve it with a client-side latch:
  **the manager decides**. The player emits `api.emit('build:place', …)`; the manager (ears armed
  inside `onSpawn`) keeps the index, mints the id, spawns the piece, and refuses the second with
  a notice. One writer, zero flicker.

The honest price: the real piece appears ~1 network round after the click — at this engine's
30 Hz tick, 2–4 ticks, ~65–135 ms. That is why the ghost **stays put** until the piece exists and the
sound fires on the click; a ghost that vanishes first opens a hole the hand can feel.

## The piece budget and whoever builds too much

Engine numbers, not your optimism: **~250** concurrent dynamic-physics props is comfortable,
**400** is the ceiling, and the physics watchdog warns loudly but **never** trims the pile — your
cap is the only net. A piece at rest is `physics: 'static'` and does not count against that;
leaving a build piece `dynamic` is the fastest way to kill the frame. Past the budget:

1. **Group them** — N pieces share a `group`; move, rotate and erase as one.
2. **Freeze into a mesh** — `api.unionSolid(ids)` merges axis-aligned boxes into ONE solid: the
   render mesh becomes the exact boundary of the union (interior and coplanar duplicate faces
   eliminated — the z-fight cure for stacked plates), the N colliders become one static mesh
   collider, and per-piece colour survives as vertex paint. It refuses, naming every blocker,
   when a piece has behaviors, children, or physics one static collider cannot represent — a
   refusal mutates nothing. Frozen does not edit piece by piece: offer "unfreeze", which
   re-expands from the rows.
3. **Charge honestly** — the HUD shows `412 / 600` **always**, not only when it fills, and the
   "no" says the number and the way out: "600 pieces — freeze a group".

Quietly stopping the spawns is the worst way out: it looks like a bug, and the person rebuilds
the same thing three times.

## THE LAW — never erase someone else's work without confirmation

- A piece with another owner **requires** explicit confirmation, with the name of whoever built
  it on screen. Never a single click.
- Erasing en masse says the number first: "this erases 87 pieces, 34 of them someone else's."
- No `DELETE` on the click: `dead = 1` and a bin that holds for at least 5 minutes.
- A world reset is `api.sql.backup('before-the-reset')` first, always.
- Applies to Gavi too: when the request is "clean that up", ask whether the players' builds go
  with it. Restoring a **live** database rewinds every player and takes consent in chat plus
  `api.sql.restore(label, { confirm: 'RESTORE LIVE' })` — the engine does not allow it by
  accident, and neither do you.

## How it breaks

- **Reading `hit.x/y/z` off `raycastVoxel`.** TELL: breaking does nothing, or breaks a block one
  cell away. FIX: the cells are `hit.voxel` (break) and `hit.adjacentVoxel` (place);
  `hit.position` is only the world impact point for fx.
- **A `placeVoxel` loop for a wall.** TELL: placing a 16 × 8 wall hitches the frame and floods
  the network. FIX: one `fillVoxels(min, max, mat)` — one command per touched chunk.
- **Build pieces left `dynamic`.** TELL: fine at 80 pieces, the frame collapses past ~250, and
  the watchdog warns but prunes nothing. FIX: `physics: 'static'` the moment a piece is at rest.
- **`audience` on a server-realm ghost.** TELL: `spawn()` throws and the hand never gets a ghost.
  FIX: `realm: 'client'` + `audience: 'local'` together, or drop `audience`.
- **An INSERT per click.** TELL: placement stutters under a fast builder and the autosave stalls;
  a 200-piece batch spread across columns blows the 100-parameter cap. FIX: one JSON parameter +
  `json_each`, one statement.
- **Loading in one `for`.** TELL: coming back to a 2000-piece build freezes for ~2 s and the
  watchdog parks the batch. FIX: 100–200 spawns per tick via `api.runInTicks(1, ...)`.
- **`changes` never checked.** TELL: the build looks saved for a week, then a whole session is
  gone with nothing in the log. FIX: `if (changes === 0) api.notifyDm(...)` — a refusal must be loud.

The route: verb and loop in `gavi#desenhar-o-jogo`; state owner, manager and tick in
`gavi#programar-de-verdade`; touch and frame budget in `gavi#fazer-mobile-e-pc`; authority and
replication in `gavi#fazer-multiplayer`; "I placed it and it didn't show up" in
`gavi#cacar-bugs-jogando`; proving the build survives a real session in `gavi#testar-tudo`; and
keeping what you learned in `gavi#memoria-infinita`.