---
name: RPG And Adventure Genre
description: How to build RPG and adventure in Tome — progression you can SEE, a character sheet that really saves with api.sql, inventory as data plus a world object, the quest as a state machine on a manager, dialogue where every option changes something, a world that remembers, an economy without inflation, and the explore-find-decide-return loop.
---

# Gavi — RPG and adventure

A deeper cut of one row in the genre table in `gavi#desenhar-o-jogo`:

> promise: **I became someone** · cardinal sin: **grind with nothing visibly changing**

The promise is one thing: by the end of the session they can see that THEY changed — in the
body, in what is open to them, in how the world speaks to them. A number going up is a receipt,
and a receipt is not progression.

## Pick your path in ten seconds

| the situation | what to do |
| --- | --- |
| "it feels like grind" | nothing visible changed in 12 min. see LAW 1 — silhouette, not the HUD |
| saving anything | `scripts/db.js` exports `migrate(sql)`. LAW 3. never save a derived value |
| "the save didn't come back" | check `changes` — `0` is a visible refusal, not a success |
| `api.sql` in a behavior | it does not exist there. three lanes only: lifecycle, cron, run_script |
| an entity hook needs a DB write | it cannot be `async`. emit up to a host lane instead |
| inventory | a data row in `lib/data/itens.json` + a world object on the floor. LAW 4 |
| a quest | a state machine on ONE manager entity, ≤ 5 states, publishing one `milestone`. LAW 5 |
| dialogue | ≤ 3 options, ≤ 180 chars, depth ≤ 4, every option changes something real. LAW 6 |
| "the world forgot what I did" | the `marks` table, read in `onPlaceStart`. LAW 7 |
| "I have 40k coins and nothing to buy" | a faucet with no drain. LAW 8 — sink 20–30% per loop |
| new game / reset | `UPDATE saves SET epoch = epoch + 1`. never `DELETE` |
| this has to be right | `gavi#uma-so` |

**The verb** is become. **The loop** is explore → find → decide → come back changed, 4–8 min.
**The camera** is a third-person orbit at **5–7 m**, fov 60–70, pitch 15–25°, framed so the
silhouette on the horizon that pulls you forward is on screen before you finish the last fight.
**The three numbers that decide the feel:** first visible change **≤ 12 min**, silhouette
changes every **3 levels**, one full loop **4–8 min**.

## LAW 1 — progression is SEEN, or it does not exist

| kind of progression | how the player notices | within |
| --- | --- | --- |
| level / stat | the thing that took 6 hits goes down in 3 | 1 fight |
| gear | a new piece taking up ≥ 15% of the silhouette | 1 screenshot |
| ability (a new verb) | what was a wall is now a route | 1 loop |
| access | a gate opens, a shortcut halves the walk back | immediate |
| reputation | the NPC's first line changes, the price drops | 1 conversation |
| body / appearance | colour, scale, scar, cloak, mount | 1 screenshot |
| base / knowledge | a new object in the spot that belongs to it, a recipe unlocked | on returning |

- **≤ 12 min** to the first visible change; **never two sessions** (~2 × 20 min) without a new
  one. Two sessions of nothing but a number going up IS the definition of grind.
- The silhouette changes every **3 levels**, colour/material **every** level, and the new piece
  has to read at **6 m** with `renderScale` 0.55 (`gavi#animar-doutrina`) — a 4 cm pauldron is
  not progression. Pieces and variants: `gavi#criar-modelo-3d`. **Test:** two screenshots of the
  same character 20 min apart; same photo = promise broken.

## LAW 2 — the sheet is state with an owner

Sheet = fields in the player's `state`, **one owner per field**
(`gavi#programar-de-verdade`): `xp`/`coins` from `scripts/ficha.js`, `bag`/`equipped` from
`scripts/mochila.js`, `milestone` from the manager, `health` from combat; the item on the floor
and the HUD **only read**. A derived value is never saved — level, max health, attack and max
carry come out of `xp` plus the curve in `lib/data/niveis.json` at load. Saving a derived value
means waking up at level 9 hitting like level 2.

| data | layer | who writes it | when |
| --- | --- | --- | --- |
| raw xp, coins, bag, equipped | SQL `sheet` | host lane | join, leave, 2 min cron |
| level, max health, attack, max carry | **recalculated** from the curve | nobody | never saved |
| current health / stamina | `state` only (comes back full) | `combate.js` | — |
| place + x, y, z | SQL `sheet` | host lane | leave, cron |
| the quest milestone | the manager's `state` + SQL `marks` | the manager | on changing step |
| world flags (a door, a dead NPC) | SQL `marks` (`save_id 0` = the world) | host lane | when the flag flips |
| aggro, cooldown, target, pose | `state` only, never SQL | whoever simulates it | — |

## LAW 3 — saving for real: `api.sql`

`api.sql` is a tagged template: an interpolation becomes a bound parameter, **one call is one
atomic transaction**, an error throws. `rows: []` = zero rows; `changes: 0` = **a visible
refusal**, check it. The budgets fail loud: **≤ 64 statements per call**, **≤ 100 bound
parameters per statement**, ~250 ms of wall clock, ~10k rows / 4 MB per call.

Only three lanes have `api.sql` in multiplayer: `engine.behaviors` (lifecycle), `engine.crons`
and `run_script`. **An entity hook cannot be `async`** — one `async onTriggerEnter` rejects the
whole script and every hook in it goes inert.

```js
// scripts/db.js — migrate(sql) runs exactly once per (mode DB, spec version), before any join.
// 10 s timebox, DDL and set-based backfills only, idempotent.
export async function migrate(sql) {
  await sql`
    CREATE TABLE IF NOT EXISTS saves (save_id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT NOT NULL,
      name TEXT NOT NULL DEFAULT 'main', epoch INTEGER NOT NULL DEFAULT 1, active INTEGER DEFAULT 1);
    CREATE UNIQUE INDEX IF NOT EXISTS one_active ON saves(user_id, name) WHERE active = 1;
    CREATE TABLE IF NOT EXISTS sheet (save_id INTEGER PRIMARY KEY REFERENCES saves(save_id),
      epoch INTEGER NOT NULL, session INTEGER NOT NULL DEFAULT 0, place TEXT, x REAL, y REAL, z REAL,
      xp INTEGER NOT NULL DEFAULT 0, coins INTEGER NOT NULL DEFAULT 0,
      equipped TEXT NOT NULL DEFAULT '{}', bag TEXT NOT NULL DEFAULT '[]');
    CREATE TABLE IF NOT EXISTS marks (save_id INTEGER NOT NULL, key TEXT NOT NULL,
      value TEXT NOT NULL, PRIMARY KEY (save_id, key));`;
}

// scripts/persistencia.js — in engine.behaviors (lifecycle hooks CAN be async)
const LEVELS = require('lib/data/niveis.json');
const levelFor = (xp) => LEVELS.curve.filter((l) => xp >= l).length;

export async function onPlayerConnected(api) {                 // runs before the body is born
  const { rows } = await api.sql`
    INSERT INTO saves (user_id) VALUES (${api.userId}) ON CONFLICT DO NOTHING;
    SELECT s.save_id, s.epoch, f.* FROM saves s LEFT JOIN sheet f USING (save_id)
      WHERE s.user_id = ${api.userId} AND s.active = 1;`;      // ONE round trip
  const f = rows[0], level = levelFor(f.xp || 0);
  api.patchState({ saveId: f.save_id, epoch: f.epoch, session: api.sessionSeq ?? 0 });
  if (!f.place) return;                                        // 1st time: the spec template stands
  api.patchState({ xp: f.xp, coins: f.coins, level, bag: JSON.parse(f.bag),
    equipped: JSON.parse(f.equipped), health: LEVELS.baseHealth + level * LEVELS.healthPerLevel });
  api.enterPlace(api.id, { placeId: f.place, spawnPoint: { x: f.x, y: f.y, z: f.z } });
}                                                              // derived: recalculated, never read

export async function onPlayerDisconnected(api) {               // the double fence lives in the WHERE
  const s = api.getState(), p = api.getProperty('feetPosition');
  const { changes } = await api.sql`
    UPDATE sheet SET session = ${s.session ?? 0}, place = ${s.place}, x = ${p.x}, y = ${p.y},
      z = ${p.z}, xp = ${s.xp | 0}, coins = ${s.coins | 0},
      equipped = ${JSON.stringify(s.equipped ?? {})}, bag = ${JSON.stringify(s.bag ?? [])}
    WHERE save_id = ${s.saveId} AND epoch = ${s.epoch} AND session <= ${s.session ?? 0}`;
  if (changes === 0) api.notifyDmOnce('save-refused', 'dead epoch or stale session');
}
```

- **The two fences are both one WHERE clause.** `epoch` kills writes from a save that was reset;
  `session` (from `api.sessionSeq`, a monotonic number the platform stamps at join, before
  `onPlayerConnected` observes the player) kills writes from a lingering tab. A stale writer
  always carries the lower seq, matches nothing, and refuses itself visibly.
- **"New game" is `UPDATE saves SET epoch = epoch + 1`, never `DELETE`**: the old write hits the
  dead epoch and refuses itself. A save slot is a **row** (`active = 0` on the old, `INSERT` for
  the new).
- **Bind structured values as one JSON string**, not as N parameters — `${JSON.stringify(bag)}`
  is 1 of your 100 parameters where a 40-slot bag spread across columns would be 40.
- Autosave is a cron: `engine.crons: [{ schedule: '*/2 * * * *', script: 'scripts/autosave.js' }]`
  exporting `async function cron(api)` and sweeping `api.getPlayers()` — a server crash calls no
  hook at all. Minimum cron granularity is **1 minute**; "save every 5 s" does not exist. A new
  column on an old save: `ALTER TABLE ... ADD COLUMN` inside a `try` whose `catch` forgives only
  `duplicate column`.
- Saves from before the database live in read-only `legacy_kv`: reshape them in `migrate()` with
  `json_extract` + `ON CONFLICT DO NOTHING`, and **delete nothing**. Dev and live are physically
  separate DBs — an empty dev vault is not a lost save; check live after publishing. Before
  surgery, `api.sql.backup('before')`; restoring **live** rewinds every player and needs chat
  consent plus `api.sql.restore(label, { confirm: 'RESTORE LIVE' })`. Test shortcuts only under
  `api.getRoomMode() === 'dev'`.

## LAW 4 — inventory: half data, half world object

An item exists twice and the two never disagree: a **data row** in `lib/data/itens.json`
(`{ id, name, weight, stacks, slot, price }` — price and effect only here, the client never
sends a number) and a **world object** on the floor (`tags: ['interactable']`,
`physics: { body: 'static', trigger: true }`, trigger ~1.5 m tall or the character controller
walks past without entering). 12–20 slots, carry 30–50, `stacks` 99 for a plain consumable / 10
for a potion / 1 for anything equippable; weight only earns its keep if it **forces a choice**.
Picking up is three channels in ≤ 0.25 s, the object dies AFTER the pop, and whoever stores it
owns the bag:

```js
// scripts/item-chao.js — entity hook: never async, never api.sql in here
export function onTriggerEnter(other, api) {
  if (!other.tags.includes('player')) return;
  const item = api.getState().item, pos = api.getProperty('feetPosition');
  api.emit('world:item-picked', { player: other.id, item });   // a host lane does the durable write
  api.playSound('cdn/sfx-item-pego.mp3', { position: pos, pitch: 0.95 + api.random() * 0.1 });
  api.squash(api.id, { axis: 'y', amount: 1.4, duration: 0.09 });
  api.damageNumber(pos, 1, { text: '+ ' + item.name, color: 'oklch(0.88 0.16 95)' });
  api.runInSeconds(0.12, () => api.destroy());                  // the pop covers the disappearance
}
```

**Equipping changes the body, not an icon.** Spawn the piece with `parent: 'player'` and
`properties.attachment: { bone: 'RightHand' }`, confirming the bone with
`api.getObjectBoneNames(playerId)` first — bone names differ between rigs. At runtime,
`api.attachTo(parentId, { attachment: { bone: 'RightHand' } })`.

## LAW 5 — a quest is a state machine on a manager entity

The manager = an invisible entity (`physics: 'none'`, `visible: false`, `replicate: 'world'` when
it must be read from other places), never the player. **≤ 5 states**:
`accept → underway → deliver → done` (+ `failed`, if failure exists). Any behavior **emits**;
only the manager **decides**; and it publishes ONE field — the **milestone**.

```js
// scripts/gerente-missao.js — OWNER of state.milestone and state.world
const QUESTS = require('lib/data/missoes.json');
export const updateSchedule = { every: 3 };      // 10 Hz at this engine's 30 Hz tick: a manager needs no more

export function onSpawn(api) {
  api.on('world:action', (e) => record(api, e));  // wire ears INSIDE onSpawn or it hears nothing
  if (!api.getState().milestone) publish(api, QUESTS[0], 'accept', 0);
}
function publish(api, quest, step, progress) {
  api.patchState({ milestone: {                  // the ONLY field the HUD consumes
    id: quest.id, step, title: quest.title, hint: quest.hint[step],
    progress, target: quest.target, place: quest.place } });
}
function record(api, e) {
  const m = api.getState().milestone;
  if (!m || m.step === 'done') return;
  const quest = QUESTS.find((x) => x.id === m.id);
  if (!quest || e.type !== quest.type) return;
  const progress = Math.min(m.target, (m.progress || 0) + (e.amount || 1)), full = progress >= m.target;
  if (full && m.step !== 'deliver') api.playSound('cdn/sfx-missao-pronta.mp3', { volume: 0.7 });
  publish(api, quest, full ? 'deliver' : 'underway', progress);
}
```

**The quest is a place, not a counter.** "Kill 10 boars" is a counter; "the boars took the mill,
go and look" is a place — the same 10 kills, but the hint names a location, the milestone carries
`place`, and arriving is what starts it. If the objective reads correctly with the map removed,
it was a spreadsheet row.

The HUD is read-only, in `scripts/ui.js`:
`world?.getObjectState('gerente-missao')?.milestone` — one `getObjectState` per render, zero
`query()`, and it never computes progress or decides a step. A UI button calls
`sendAction('name', payload)`, and that action **has** to exist in `inputs.actions` (an empty
object `{}` for a UI-only action) or it is a half-connected button: the click still lands on its
arrival tick, but there is no clean default on the others and no key/touch binding — and the engine
logs a `ui.handler` fault about it. Details in `gavi#menu-principal-3d-2d` Law 2.

## LAW 6 — dialogue: one question at a time

A tree in pure data (`{ start: { text, options: [{ label, next }] } }`) in the NPC's `state`.
**≤ 3 options** per node, **≤ 180 characters** per line, depth **≤ 4**, and **every option
changes something real** — an item, a coin, a flag, a price, who starts hating you. **The
dead-option test:** delete option 2; if the world comes out identical, it never existed.

The plumbing: the NPC's `onInteract` copies `{ inDialogue, currentNode, tree }` into the player's
`state` and releases the pointer
(`api.setCamera({ pointerLock: false }, { audience: { kind: 'player', id } })`); the UI draws
from `localPlayer.state` and sends `sendAction('choice', { i })`; the player's `onInput` applies
the effect and advances the node. Portrait and body from the same image:
`...portrait-<who>.png` in the box, `...portrait-<who>.png.glb` on the model (skill
`interactive-objects`). Text that must be alive is the `llm-for-games` skill, with two locks: the
model writes **text**, the game decides **state**, and the tree's line stays as the fallback.

## LAW 7 — a world that remembers

A door left open, a bridge burned, an NPC who watched you steal: the `marks` table, per save (the
player's `save_id`) or per world (`save_id 0`), read in `onPlaceStart(api, placeId)` of
`engine.behaviors` (one `SELECT key, value` →
`api.patchObjectState('gerente-missao', { world })`) and written by a host lane when the flag
flips. Every flag has **an owner, a name out of the fiction, and a consequence visible in ≥ 1
place**: `crypt-door-open`, not `flag_17`. Practical ceiling **~200 flags**; past that use a
domain table (chests opened, bosses killed). An NPC who saw it: store `saw:<npc>:<action>` and
spend it on his **first line**. An object's `state` survives a reload in that room; the truth
between sessions is the table — if it matters after the browser closes, it lives in SQL.

## LAW 8 — economy and reward without inflation

- A fixed reward against a `1.6^n` price stalls at the 4th upgrade: either the price becomes
  `1.25^n`, or the reward grows on the same exponent. Pick one, never neither. A faucet with no
  drain gives "I have 40 thousand and nothing to buy": repairs, consumables or tax eating
  **20–30% of income** per loop.
- One coin per action, once (a quest reward plus a drop off the same kill inflates within 20
  min); chests with a floor (**no empty hands three chests in a row**); every purchase worth
  wanting costs **3–6 loops**, never more than 8.
- Every reward is **power**, **access** or **vanity** — never all three in the same loop; save
  access for the peak. One row per moment in an `events` table answers "is my game hard?" with a
  single `SELECT`: skill `data-and-saves`.

## LAW 9 — rhythm: explore, find, decide, come back changed

**Explore 60–180 s** with a silhouette on the horizon that pulls. **Find in 5–15 s**: something
that changes the decision. **Decide in 10–30 s**: two options with a cost, neither obvious.
**Come back changed in ≤ 60 s** through a shortcut opened on the way out, with a visible change
waiting at the arrival. The whole loop **4–8 min** — the middle ring of `gavi#desenhar-o-jogo`:
the hand has to be good on its own and the session closes on the biggest peak.

## How it breaks

- **A derived value got saved.** TELL: they load in at level 9 hitting like level 2, or max
  health resets to base. FIX: save raw `xp`; recompute level and health from the curve at load.
- **`api.sql` or `async` in an entity hook.** TELL: the whole script goes inert — every hook in
  that file stops, usually reported as "the item stopped working". FIX: three lanes only; the
  hook emits, a host lane writes.
- **`changes` never checked.** TELL: saving looks fine for weeks, then a reset player's progress
  silently stops persisting. FIX: `if (changes === 0) notifyDmOnce(...)` — a refusal must be loud.
- **The manager's ears wired outside `onSpawn`.** TELL: the quest never advances; emits land and
  nothing listens. FIX: `api.on(...)` inside `onSpawn`, which re-arms on every script edit.
- **The HUD computes progress.** TELL: two players see different quest counts, or the bar jumps
  backwards. FIX: the manager owns `milestone`; the HUD only reads it.
- **A quest that is a counter.** TELL: players ask "where?" and the answer is a number. FIX: the
  hint names a place and the milestone carries it.
- **Reward growth flatter than price growth.** TELL: the 4th upgrade takes as long as the first
  three combined and players stop before it. FIX: price `1.25^n`, or scale the reward the same way.

## What Gavi refuses

- A level that only moves a number in the HUD; equipment that does not change the silhouette.
- Saving a derived value instead of recalculating it from the curve.
- `api.sql` or `async` inside an entity hook; `DELETE` to "reset" (it is `epoch + 1`).
- A HUD that computes progress instead of reading the milestone; a dialogue option that changes
  nothing.
- Saying "done" without playing the whole loop twice — `gavi#cacar-bugs-jogando`, and the full
  spine sweep in `gavi#testar-tudo`. A save bug you diagnosed once and did not write down costs
  the same hour twice: `gavi#memoria-infinita`. When the ask is "do it properly", that is
  `gavi#uma-so`.