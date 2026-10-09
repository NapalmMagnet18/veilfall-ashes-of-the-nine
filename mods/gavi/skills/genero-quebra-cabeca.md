---
name: Puzzle Genre
description: Gavi's puzzle skill — the solvable-in-your-head test, one new idea per room, state you can read from the entrance, undo and restart as rights, a manager that decides victory in exactly one place, the dead-state detector, and the honest signal that you were close.
---

# Puzzle — "I get it"

The promise in `gavi#desenhar-o-jogo` is three words: **I get it.** Not "I managed it", not "I kept at
it" — the instant the head turns over and the room is easy forever. Anything in the way of that click
is a defect, however pretty.

## pick your path in ten seconds

| the situation | do this |
| --- | --- |
| designing room 1 | show → let them be wrong for free → demand it. under 45 s, one rule, zero text |
| "is this hard or is it obscure?" | the 12-word test: they explain the solution in ≤ 12 words without "I kept trying" |
| adding a second mechanic | not before the first has yielded 6-8 challenges — and the second must COMBINE |
| "sometimes the door doesn't open" | victory is spread across objects. one condition, one server manager |
| the snap counts sometimes | dynamic block on a grid. kinematic + 1.0-1.5 m cell + 0.35 m tolerance |
| they stopped experimenting | no undo. 32-deep stack answering in ≤ 0.15 s |
| they've been stuck 4 min | dead state? detect on every MOVE and offer R. never restart for them |
| you want to hint | 3 steps keyed to lack of progress, none of them gives the answer |
| a piece is hidden behind another | audit sightlines with `overlapSegment` from the entrance eye |
| the solution changed between attempts | `api.random()` got into the rule. random belongs in decoration only |

## LAW ZERO — one rule, explored until it runs dry

One mechanic, and no second one until the first has produced **6 to 8 challenges** and been turned
inside out once. Without mastery there is no click, only relief.

Test: describe the mechanic in **one sentence of 12 words or fewer** — "pushed blocks slide until they
hit something". Needed an "and also"? That's two mechanics and neither is explored. The second one
**combines** with the first: if room 9 forgets the block, you have two short games, not a curve.

## room 1 is the tutorial and doesn't look like one

Zero words. Three beats, same room, this order:

1. **Show it** — the rule happens on its own inside the opening field of view: a block already on the
   plate, the door already open because of it.
2. **Let them be wrong for free** — the second plate is uncovered and its block is far off. Pushing
   the wrong way costs **zero**: no death, no timer, no restart.
3. **Demand it** — the exit opens only with the plate covered. No shortcut.

Solved in **under 45 s** by someone who has never seen the game, **one** rule, **zero** text. Text only
for what the hand cannot discover: which key undoes and which restarts.

## state legibility — nothing behind you

> **She has to see the ENTIRE state of the puzzle from where she is standing.** Information behind her
> is information that does not exist.

- From the entrance, everything that decides the solution fits inside **±60° of head turn**.
- **Two channels of state per element**: position **and** colour/light. Colour alone dies on a phone
  and dies for the 8% who can't split red from green; shape alone dies at distance.
- A movable piece owns a shape family the scenery never uses. Poking things to find out what moves is
  blind trial and error charged as the price of information.
- Nothing hidden behind another piece on the entrance sightline. Audit it, don't eyeball it:

```js
// run_script, readOnly — the sightline audit. overlapSegment is physics-true and answers in any
// context; the report carries the scanned count so a wrong threshold indicts itself.
const eye = { x: 0, y: 1.6, z: 12 };                 // where she stands in the doorway
const pieces = api.query({ anyTags: ['block', 'plate', 'lever'] });
const blocked = [];
for (const p of pieces) {
  const to = { x: p.feetPosition.x, y: p.feetPosition.y + 0.5, z: p.feetPosition.z };
  const hit = api.overlapSegment(eye, to, { ignoreEntities: [p.id], excludeTags: ['player'] });
  if (hit.objects.length || hit.approximate.length) blocked.push({ id: p.id, by: hit.objects[0] ?? hit.approximate[0] });
}
return { scanned: pieces.length, blocked };          // blocked.length must be 0
```

## hard vs obscure — the "obvious IN HINDSIGHT" test

Hard: she has all the information and still has to think. Obscure: information is missing, and what
solves it is trying until something sticks.

The test is binary: **after solving it she explains the solution in 12 words or fewer, without saying
"I just kept trying".** Ask for **2 to 5 plausible wrong hypotheses** — under 2 is a keyhole, over 5 is
soup — and the right one must be **testable in under 10 s**. A test that costs a 40 s walk makes people
guess, and guessing is this genre's cardinal sin. Never reflexes, pixels or luck: snap tolerance
**0.35 m in a 1.0-1.5 m cell**.

## types, and what each one tests

| type | the hand's verb | what it tests in the head |
| --- | --- | --- |
| pushing crates on a grid | push | planning with an irreversible step |
| order / sequence | trigger | working memory |
| routing (pipe, wire, rail) | connect | reading a graph |
| light and mirrors | rotate | spatial projection — tracing the line in your head |
| coupled switches | toggle | parity algebra |
| deduction from clues | eliminate | formal logic |
| fitting / rotating a piece | rotate and seat | mental rotation |
| timing window (a door that closes) | execute | executing a plan ALREADY made |
| emergent rule (the rule bends) | experiment | forming and falsifying a hypothesis |

The timing window is the only one touching reflexes: the plan is made standing still, the pressure
lives only in the execution.

## the curve: introduce, complicate, turn inside out, combine

With "a block slides until it hits": **introduce** (2-3 challenges, bare rule) → **complicate** (2-3,
more pieces, a narrow corridor, same rule) → **turn inside out** (1-2, where you NEED the block stuck
in the way) → **combine** (2-3, the block on the plate holds the door you walk through). "Turn inside
out" goes in the middle — it's the beat that teaches her the game thinks, and it needs rooms after it
to pay off.

## the manager is the state machine, and it decides alone

`gavi#programar-de-verdade`: the **win condition is evaluated in exactly one place**, never on each
plate. Spread across objects is how you win twice or not at all, and the symptom that reaches you is
"sometimes the door doesn't open".

```js
// scripts/puzzle-sala1.js — owner of state.solved / moves / initial.
// Spawn it as: { realm: 'server', behavior: ['scripts/puzzle-sala1.js'],
//   properties: { visible: false, physics: 'none' } }
const TOLERANCE = 0.35;                      // metres, in a 1.0-1.5 m cell
export const updateSchedule = { every: 4 };  // ~7 Hz at 30 Hz sim: plenty for a puzzle

export function update(dt, api) {
  const s = api.getState();
  if (s.solved) return;
  const plates = api.query({ tags: ['plate'] });
  const blocks = api.query({ tags: ['block'] });
  let covered = 0;
  for (const plate of plates) {
    const ok = blocks.some((b) => Math.hypot(b.feetPosition.x - plate.feetPosition.x,
      b.feetPosition.z - plate.feetPosition.z) <= TOLERANCE);
    if (ok) covered++;
    if ((plate.state && plate.state.lit) !== ok) {          // write only on the flip
      api.patchObjectState(plate.id, { lit: ok });
      api.setObjectProperty(plate.id, 'material.emissiveIntensity', ok ? 1.4 : 0);
      api.playSound('cdn/sfx-encaixe.mp3', { position: plate.feetPosition, pitch: 0.95 + covered * 0.05 });
    }
  }
  if (covered < plates.length) return;
  api.patchState({ solved: true });
  api.playSound('cdn/sfx-puzzle-resolvido.mp3', { position: plates[0].feetPosition });  // positioned: everyone near it
  api.highlight(plates[0].id, { style: 'glow', color: 'oklch(0.95 0.12 90)', duration: 1.2 });
  api.emit('puzzle:solved', { room: 'room1', moves: s.moves ?? 0 });   // her own script flashes the screen
}
```

The plate carries an authored `material.emissive` so the dot-path write has something to raise; setting
`emissiveIntensity` on a material with no emissive colour changes nothing on screen.

## undo and restart are rights, not features

- **Undo** answers in **≤ 0.15 s**, one step per press, **32 deep**. Without it an irreversible step
  becomes fear, and fear stops the experimenting the genre lives on.
- **Restart** in **≤ 0.5 s** and never by reloading: not `api.reset()` (behaviors cannot call it) and
  not `enterPlace` into the same place. Restoring is rewriting the pieces' positions and states,
  nothing else.
- A piece is **kinematic on a grid**, never dynamic. Cell 1.0-1.5 m, slide over 0.10-0.14 s
  interpolated in `update`. Dynamic collects 3 cm of drift per push and victory becomes a lottery.

The **initial** snapshot lives in `state` (it survives a reload). The **stack** lives in `scratch()` —
it never replicates, never persists, and decays after ~30 s idle. An empty stack is normal, not an
error: an undo with no stack becomes a restart.

```js
const DEPTH = 32;

function snapshot(api) {
  const ids = api.query({ anyTags: ['block', 'lever'], select: 'ids' }).sort();   // stable order
  const pos = api.readPositions(ids);                       // Float32Array, stride 3
  return { ids, pos: Array.from(pos), states: ids.map((id) => api.getObjectState(id) || {}) };
}

function restore(api, snap) {
  api.setPositions(snap.ids, snap.pos);                     // batched; physics syncs at call end
  for (let i = 0; i < snap.ids.length; i++) api.setObjectState(snap.ids[i], snap.states[i]);
}

export function onSpawn(api) {                              // api.on HAS to be wired here
  api.patchState({ initial: snapshot(api), solved: false, moves: 0, noProgress: 0 });

  api.on('puzzle:before-move', (_p, a) => {
    const S = a.scratch(); if (!S.stack) S.stack = [];       // decayed: lazy rebuild, not an error
    S.stack.push(snapshot(a));
    if (S.stack.length > DEPTH) S.stack.shift();
    a.patchState({ moves: (a.getState().moves || 0) + 1 });
  });

  api.on('puzzle:undo', (p, a) => {
    const S = a.scratch();
    const snap = S.stack && S.stack.pop();
    if (!snap) { a.patchObjectState(p.player, { undoEmptyAt: a.seconds() }); return; }  // her script speaks
    restore(a, snap);
    a.playSound('cdn/sfx-desfazer.mp3');
  });

  api.on('puzzle:restart', (_p, a) => {
    restore(a, a.getState().initial);
    a.scratch().stack = [];
    a.patchState({ solved: false, moves: 0, noProgress: 0 });
  });
}
```

**Why the manager writes `undoEmptyAt` instead of calling `toast`:** screen juice (`toast`, `vignette`,
`screenShake`, `screenFlash`) defaults to the acting player, and from a non-player entity's `update` or
event handler it is dropped — which is also why the solve above plays a positioned sound and emits
instead of flashing the screen itself; in multiplayer, aiming it at another player's id reaches nobody and logs a teaching fault. So
the manager writes state and the player's own behavior — or `ui.js` reading `localPlayer.state` — says
the words. In singleplayer a manager may pass `audience: { kind: 'place' }`.

The player's behavior reads the key and **asks**: `api.emit('puzzle:undo', { player: api.id })` inside
`onInput`. That emit is forwarded upstream and sequenced by the server, so the manager hears it (only a
`realm: 'client'` object's emits are dropped, with one warning in `getLogs`). Declare both actions —
`inputs: { actions: { undo: { keys: ['z'] }, restart: { keys: ['r'] } } }` — and a UI button's action is
an empty `{}` reached by `sendAction`, ≥ 44 px on a phone (`gavi#fazer-mobile-e-pc`).

## no way back — the dead-state detector

She broke the puzzle two minutes ago and doesn't know. Detect it and **offer** a restart; never restart
on your own initiative, she may be experimenting.

```js
// called from the 'puzzle:before-move' handler — the gate is the MOVE, never the tick
function deadState(api) {
  const solids = { includeTags: ['solid'] };
  const plates = api.query({ tags: ['plate'] });
  for (const b of api.query({ tags: ['block'] })) {
    const p = b.feetPosition;
    if (plates.some((pl) => Math.hypot(pl.feetPosition.x - p.x, pl.feetPosition.z - p.z) <= TOLERANCE)) continue;
    const blocked = (dx, dz) => {
      const t = api.overlapPoint({ x: p.x + dx, y: p.y + 0.5, z: p.z + dz }, solids);
      return t.terrain === true || t.objects.length > 0 || t.approximate.length > 0;
    };
    // a corner: blocked on one axis AND the other = that block never leaves there
    if ((blocked(1, 0) || blocked(-1, 0)) && (blocked(0, 1) || blocked(0, -1))) return b.id;
  }
  return null;
}
```

Found one: `api.highlight(id, { style: 'pulse', color: 'oklch(0.7 0.2 25)', duration: 3 })` plus a line
of state the player's own script turns into a toast. `overlapPoint` is the right probe, not `raycast`:
the same collider volumes physics uses, answering in every context, and `terrain: null` means "I don't
know", never "empty". Off the grid the detector is a breadth-first search with a ceiling of **20,000
states**; past that, slice it across ticks (`gavi#programar-de-verdade`).

## the hint that shows up on its own

It arrives unasked and **never hands over the answer**. Keyed to lack of progress, never to total time —
time punishes the people who think.

| step | trigger | what it does | what it NEVER does |
| --- | --- | --- | --- |
| 1 — point | 12 moves with no new plate, or 45 s with no move | a pulsing `highlight` on the piece that matters | say where to take it |
| 2 — restate the rule | +60 s | room 1's demonstration plays again, right there | show this room solved |
| 3 — show the goal | +90 s | a 2 s ghost of the final state, pieces translucent | show the sequence of moves |

There is no step 4. If she still can't solve it, the defect belongs to the level, and
`api.notifyDmOnce('hint3-room1', ...)` is how you find that out. `noProgress` resets on **progress**,
not on a move.

## proving it

Solve room 1 without reading anything, on a stopwatch — over 45 s and it teaches badly. Explain every
solution in 12 words; one that fails means that room is obscure. Jam the level on purpose and see
whether the detector speaks. Undo 32 times then restart: no drift, no plate left lit with its block far
away. Then plant `notifyDm` on a solved room, on hint step 3, and on a dead state
(`gavi#cacar-bugs-jogando`).

## when it breaks — the six tells

| tell (what you'd actually see) | cause | fix |
| --- | --- | --- |
| "sometimes the door doesn't open" | the win condition is evaluated on each plate | one condition, in one `realm: 'server'` manager, `every: 4` |
| the block sits on the plate and nothing happens | dynamic body drifting 3 cm past the 0.35 m tolerance | kinematic on a 1.0-1.5 m grid, slide over 0.10-0.14 s |
| she solves it and says "I don't know why that worked" | information was missing — obscure, not hard | show the missing information; a hint doesn't fix an obscure room |
| the plate lights but the toast never appears | a manager called `toast` for a player: dropped, and a teaching fault in `getLogs` | manager writes state, her own script/`ui.js` says it |
| undo does nothing after a pause | `scratch()` decayed after ~30 s idle | rebuild the stack lazily; empty stack = offer restart |
| she turns around and the room changes meaning | a decisive piece sits outside the ±60° arc | move the piece; audit with the `overlapSegment` scan above |
| identical attempts, different results | `api.random()` reached the rule | random in decoration only; the rule is deterministic |