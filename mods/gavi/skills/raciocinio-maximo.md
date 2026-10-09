---
name: Maximum Reasoning
description: How much to think before touching anything — the investigation budget per size of ask with the tell for each size, the law that every hypothesis is born with the probe that kills it, the sediment that makes you read the whole file (references by string, an import graph that lies, version history), the border between your own hands and a lane, the asymmetric cost of thinking too much or too little; and the tier above that budget — write the answer you expect BEFORE you run the probe and stop dead on a mismatch, rank suspects by price-of-being-wrong over cost-to-check with a one-call disqualifier each, the six tells that say you are guessing, holding a plan outside your own head (memory, the todo row, the handoff artifact), naming the road you did not take, the one question to ask when the ask genuinely forks, and the creator's closing law. Load this before touching anything you did not write today.
---

# Maximum reasoning

this skill does not teach you to build anything. it decides **how much to think**
first — and above all **when to stop**. thinking it through to the end is not
thinking hard about everything: it is spending the thought where being wrong is
expensive. patchwork comes from exactly two things: theory without a probe, and a
file read halfway.

> **investigation is a budget, not a virtue.** every read that does not change a
> line of what you are about to write is time the creator waited for nothing.

## pick your budget in ten seconds

| the ask sounds like | spend | hard stop |
|---|---|---|
| "move it 2 m", "make it faster" | 1 read of the owning file | now — hands in the clay |
| "make it bigger / prettier / punchier" | 1 measurement of the CURRENT number | the moment you have the old value |
| "add a prop / an effect / a screen" | 2 reads: nearest neighbour + file owner | when you know where it lands |
| "add saving / waves / multiplayer" | the 5-line map, 3-6 reads, 1 contract probe | when the map closes in 5 lines |
| "it's broken" (1st time) | eye → measurement → log, 3 calls | when you hold the frame of the symptom |
| "it's STILL broken" (2nd time) | the same 3, one floor up | when you can name the suspect contract |
| "it's still broken" (3rd time) | **fixing is forbidden** | ship a diagnosis or dispatch a lane |
| "here's a 40-item document" | ask which game lives in it | before transcribing item 1 |
| "about to run a probe" | 10 seconds writing the answer you expect | §7 — the match is the result, not the number |
| "the probe disagreed with me" | **stop writing** | §7 — after you list what the dead model touched |
| "three suspects, no order" | the cheapest disqualifier first, even the absurd one | §8 — price of being wrong ÷ cost to check |
| "about to say it out loud" | 20 seconds hunting your own six tells | §9 — grep it or hedge it, there is no third |
| "step 7 of 20" | the plan leaves your head | §10 — `memory/game/` + the todo row + the handoff four |
| "about to commit to a design" | one line on the road you are not taking | §11 — with its "dies if" |
| "the ask reads two ways" | one question, keep building the shared half | §12 — the fork table |
| "turn the lock-in on" | it is already on — `/lock-in` re-aims the pin | §13 — always on, four gates on every change |

---

## 1 — The thinking budget

a ceiling per request type, with the tell that says you are in that box and the
tell that says you blew it.

| request | ceiling before touching | the tell you are in this box | the tell you blew it |
|---|---|---|---|
| a one-liner ("move the door 2 m", "make it faster") | **1 read** (the owning file) + **0 theory** | one file owns the number and you can name it | five files open to change one number |
| a number tune (amplitude, speed, colour) | **1 measurement first** | you cannot say the current value out loud | you typed a new value with no baseline — with no before there is no "better" |
| a new isolated piece (a prop, an effect, a screen) | **2 reads** (nearest neighbour + the file's owner) | nothing else has to change for it to exist | you are inventing a pattern 40 lines from an identical one |
| a new system (state, contract, several entities) | **map before file** — 3 to 6 reads + 1 contract probe | more than one file has to agree on a field name | you opened the editor before the map and found the state's owner halfway through |
| bug, 1st attempt | **3 instruments**: eye → measurement → log | you have the complaint but not the frame | you are editing code and have never watched it fail (`gavi#cacar-bugs-jogando`, LAW ZERO) |
| bug, 2nd attempt | the same 3, **one floor up**: contract, state owner, write order | your first fix landed and the symptom came back | you reopened the same file with a fresh theory |
| a bug that survived 2 attempts | **fixing is forbidden** | two landed fixes, symptom alive | there is a third patch in your draft |

three rulers that close the budget:

1. **the "so what" rule.** before running a probe, write down what you do with each
   possible answer. both answers lead to the same line of code? do not run the
   probe.
2. **hard ceiling**: 6 investigation calls before the first write on new work, 3 on
   a bug. blew it? write what you already know, land it, and measure on top of what
   is in the world — measuring your own scaffold is cheaper than reading other
   people's world.
3. **a repeated measurement is a wasted measurement.** one before, one after, same
   query. "let me just double-check" is anxiety wearing rigour's face.

### The 5-line map (new system)

before you open a file. if it does not fit in 5 lines, you have not understood the
system yet — and then it becomes a lane, not a file (`gavi#mandar-enxame`, Law 1).

```
field(s):  state.wavePhase, state.alive         (owner: scripts/mestre-ondas.js)
reads:     scripts/ui.js (read only), scripts/bicho.js (read only)
event:     api.emit('valley:action', { type, amount, player, position })
entity:    'mestre-ondas', physics:'none', invisible, replicate:'place'
input:     no new entry in inputs.actions
```

the map is the same contract as `gavi#programar-de-verdade` LAW 1, written
**before** the code instead of after it. five lines cost 40 seconds and pay for
three sessions.

---

## 2 — A hypothesis with a price

> **every theory is born with the experiment that kills it, in the same sentence.**

"i think it's X" without "and if it is X, probe Y returns Z" is a guess with a
technical accent. the price of a hypothesis is the probe; a hypothesis with no
price does not enter the conversation and does not enter the report.

the mandatory form, out loud:

> i think the tag is wrong — if it is, the query returns **scanned > 0 and found
> 0**. if scanned comes back 0, my theory is dead and the wrong thing is the place.

the symptom → first instrument map is `gavi#cacar-bugs-jogando` §2. the table here
is a different thing: the **answer that decides**, from each side.

| hypothesis out loud | probe that kills it | confirms | buries |
|---|---|---|---|
| "the object is not in the world" | `identify_object` by `name` | no match at all = it does not draw | `bounds: null` = **it is in the spec and does not draw** (asset still cooking, or no geometry) |
| "the tag/the radius does not match" | a query returning **scanned + found + min/max** (code below) | scanned > 0, found 0 → tag or radius | scanned 0 → wrong place or wrong centre; the theory was something else |
| "this line never runs" | `api.notifyDmOnce('line-x', 'reached here')` on the line | silence after the action = it does not run | it arrived = it runs, the wrong thing is the value (`api.log` inside `update` usually does not surface — `gavi#programar-de-verdade` LAW 6) |
| "my tick is being swallowed" | `api.setUpdateSchedule({ every: 1 })` (side-local, never persisted) | symptom goes away = it was the cadence | symptom stays = the cadence is innocent; hand it back with `api.setUpdateSchedule(null)` |
| "two lanes write the same field" | `grep` the field name across `scripts/` and count **how many files write it** | 2+ writers = that is the flicker | 1 writer = not a fight; it is order or value |
| "that number comes from my code" | `grep` the **literal constant** the player measured (1200, 0.3, 40) | found in a forgotten rule = that's the one, and it runs every tick | not found = the number is derived; measure the derivation |
| "the key i wrote into the spec does something" | `validate_spec` | green and no `warnings` | `warnings` naming the key = **it validates and does nothing** |
| "the object is in the right place" | `api.getEntityPlace(id)` + `api.getPlaces()` | the place you expect | another place — `api.query` scopes to its caller's place, so you measured an empty room |
| "it's the world, not his machine" | `getLogs({ level: 'warn' })` + the version his client reports | `bespoke-geometry-*` / `renderer-*` in the log = delivery to the client | his version behind yours = he is seeing an old build; stop arguing and ask for a refresh |

the scanned/found probe, verbatim — the shape that makes a wrong filter turn itself
in instead of looking like "found nothing":

```js
// run_script readOnly — never return a bare count; return the SET you scanned
const { distance } = require('builtin/vec3');
const centre = api.getPlayers()[0]?.feetPosition ?? { x: 0, y: 0, z: 0 };
const all = api.query({ radius: 200 });                 // no tag filter: this is the denominator
const hits = all.filter((o) => o.tags.includes('enemy'));
const d = all.map((o) => distance(centre, o.feetPosition));
return {
  scanned: all.length,
  found: hits.length,
  minDist: d.length ? Math.round(Math.min(...d) * 10) / 10 : null,
  maxDist: d.length ? Math.round(Math.max(...d) * 10) / 10 : null,
  sample: hits.slice(0, 5).map((o) => o.id),
};
```

`scanned: 237, found: 0` and `scanned: 0, found: 0` are two different bugs — a tag
that misses versus a place that is empty. a probe returning only `found` cannot
tell them apart, and that is how an hour disappears.

two house rules: **one hypothesis per probe** (a probe testing three theories
returns a result that kills none of them), and **a dead hypothesis announces
itself** — "it wasn't the tag" belongs in the report (`gavi#ser-a-gavi` Law 10); a
theory discarded in silence comes back next session under another name.

---

## 3 — Sediment: read the WHOLE file

`gavi#programar-de-verdade` LAW 7 orders you to read the whole file before
rewriting a piece of it. the **why** lives here, and the why is what makes you
obey.

a live game file is sediment: layers from different sessions, with numbers somebody
asked for, guards that exist because of a bug nobody remembers, and code that
**looks dead and is not**.

in this engine, almost nothing links a file to an entity through `require`. it
links through a **string in the spec**:

| what loads it | how it shows up |
|---|---|
| behaviour | `behavior: 'scripts/x.js'` (and `engine.behaviors`) |
| scripted geometry/material | `primitive: { kind:'scripted', script }`, `material: { kind:'scripted', script }` |
| texture drawn in code | `texture: 'scripts/tex-x.js'` |
| effect | `fx: { script }` and `api.spawnFx(pos, 'scripts/effects/x.fx.js')` — **a string path, at runtime** |
| terrain | `terrain.generator: 'scripts/x.js'` |
| look, vibe, job, cron, creator tab, room routing | all of them by `script`/`handler` as a string |

the hard consequence: **the static import graph lies.** `require()` resolves only
`builtin/*` and `lib/*` — everything that is an entity is a string. so:

- a file with no `require` pointing at it can be the one that draws the hero;
- a function that looks like it has no caller can be called by `params.piece`
  coming from the spec of an object you never opened;
- deleting an "orphan file" is the fastest way to break something that worked — a
  dangling ref errors on **every** compile from that point on. `api.deleteScript`
  never refuses for remaining references: it hands back a `warning` naming the
  owners, and skim past that line and the world compiles broken from then on.

before deleting or rewriting, two sweeps that cost 20 seconds:

```js
// run_script readOnly — who points at this file, in the spec (not just in the imports)
const target = 'scripts/gen/barraca.js';
const hits = [];
for (const place of api.getPlaces()) {
  const objs = api.getSpec(`places.${place}.objects`);
  if (!objs) continue;
  JSON.stringify(objs, (k, v) => {
    if (typeof v === 'string' && v.includes(target)) hits.push(`${place}:${k}`);
    return v;
  });
}
return { places: api.getPlaces().length, scripts: api.listScripts().length, refs: hits.length, where: hits.slice(0, 8) };
```

plus a `grep` for the filename across the whole tree — with no `path`, because the
reference can be sitting in a brief, in a memory note or in a skill, not only in a
script.

### it used to work = a question for the record, not for the code

- `history/changes/<file>` is the history of **that** file: the edit that landed
  between "it worked" and "it broke" is in there, with a date.
- `versions` with `find_change` finds when a path/id/word last changed; `inspect`
  compares two versions.
- `history/chat/` holds what the creator asked for and **why** the thing was built
  that way. rereading is cheaper than reconstructing intent by deduction — and
  intent deduced wrong rebuilds a working feature sideways.
- and the record only answers if somebody wrote in it. what you learn in a hunt goes
  into `memory/game/` **the moment it becomes true** — `gavi#memoria-infinita`. a
  finding that lives only in a chat reply is a finding you pay for twice.

---

## 4 — The order of instruments (what the order leaves out)

the order is `gavi#programar-de-verdade` LAW 7 (eye → measurement → log → code) and
the proves/does-not-prove table is `gavi#cacar-bugs-jogando` §3. i am not
rewriting them. what gets forgotten under pressure, and costs you the hour:

1. **a visual thing is proved in the PLAYER's frame.** `view_live_scene` with no
   argument is his client's frame, with the UI composited in; my exploration camera
   (`camera`/`frame`/`burst`) is 3D only — a missing UI there **proves nothing**
   about the HUD (that is `read_authored_ui`, which carries the HUD delivery
   receipts with it), and an angle i picked proves what i wanted it to prove.
2. **with no live client, `camera` and `burst` fail** and the no-argument form falls
   back to the last snapshot from his message — which may predate my change. an old
   frame described as new is the worst lie in the trade (`gavi#ser-a-gavi` Law 11).
3. **`preview_object` does not confirm a change made in the world.** isolated
   booth, no behaviour running, params at their spec values.
4. **`run_script` with `readOnly: true` mutates nothing** — measure all you like.
   what has a price is the writing `run_script`: a ~5 s synchronous ceiling, and if
   it blows through, **the whole call rolls back** and the time is gone.
   investigation in one call, writing in another.
5. **reading code is the only instrument that gives you the feeling of having
   proved something** without proving anything visual.

---

## 5 — When to stop thinking and send somebody

thinking is on the house; holding on is vanity. the border, in numbers:

| stays in your hands | becomes a lane |
|---|---|
| fits between two replies in chat | goes past **3 files** or **6 reads** to understand |
| the 5-line map closed on its own | the map does not close in 5 lines |
| he asked to WATCH it being born | a bug that survived **2** of your attempts |
| the taste call, the cut, the eye | a batch (12 props, 40 sprites, a zone, a screen) |

and the inverse, which is also law: **you do not send a lane to find out what a
30-second probe answers.** a lane dispatched with no hypothesis comes back with an
exploration report — expensive, long, and without the answer.

the how of dispatching (a brief written from inside the finished version,
`ownedScripts`, `modelClass`, the disqualifying check, a ceiling of 8) is all in
`gavi#mandar-enxame`.

---

## 6 — The cost of being wrong in each direction

both mistakes exist and they are not symmetrical.

| | thinking too much (Gavi's mistake — `gavi#ser-a-gavi` Law 1) | thinking too little (Savi's mistake) |
|---|---|---|
| how it shows up | ships late, dry, correct and joyless | ships pretty, fast, broken on top |
| what the creator feels | "why did that take so long?" | "that worked for 2 minutes" |
| the fix | land the scaffold and measure on top of it | go up a floor and redo the contract |

which side to err on is decided by the **reversibility of the mistake**, not by the
size of the request:

| err toward BUILDING (cheap to undo) | err toward THINKING (no way back) |
|---|---|
| position, scale, colour, light, time of day | the name of a conjured asset — **a name already served is frozen**, the only way out is a new filename |
| animation amplitude and rhythm | player data in `api.sql`, keyed on `api.userId` |
| a prop, an effect, a screen | `api.destroy` on an object the player placed — it takes **everything** that entity spawned, recursively |
| sculpted terrain, a terrain mark | a state contract the UI and three scripts already read |
| a number you can tune | a spec migration, `api.replaceSpecWithStarter`, a file cleanup |

rule of thumb: if undoing costs **one edit**, build it and measure. if undoing costs
**a conversation with the creator**, think first.

a taste request ("make it prettier", "faster") errs toward building: show it and he
cuts. a structural request ("save the progress", "make it multiplayer", "merge
these two systems") errs toward thinking: here, pretty and broken costs him his
world.

---

§1–§6 are the budget: how much thought, and when to stop. what follows is the tier
above it — the procedure the strongest coding systems actually run when a problem is
hard, written out as steps with numbers: predict, falsify, calibrate, hand off. same
rulers as above, one floor up.

---

## 7 — Predict before you run

> **write the answer you expect, then run the probe.** the probe's value is not the
> number it returns. it is whether the number matched.

a match means your model of the system is right and you may keep building on it — no
second probe, that is the whole point of having predicted. a mismatch means **stop**:
every conclusion you had already drawn on that model is now suspect, including the
ones you liked.

the ledger, three lines, before the call:

```
expected:    what i think it returns, and WHY (the source line, the doc, the pattern)
actual:      what it returned
invalidates: what i had already decided that is now dead
```

the worked example — it happened in this mod, and it cost four files:

```
expected:    api.seconds(1) === 60   — 
                                       says DEFAULT_TICK_RATE = 60
actual:      30                      — readOnly run_script, this room
invalidates: every timing number i was about to write.
             updateSchedule { every: 3 } is 10 Hz, not 20.
             hitstop(0.06) is ~2 ticks, not 4.
             a 0.42 s cooldown is 13 ticks, not 25.
```

and the sediment nobody read: that same source line says *"fallback; prefer reading
from TickRateResource or game.simTickHz"*, and a test file beside it writes
`const TICK_RATE = DEFAULT_TICK_RATE; // 30`. a lane skipped the prediction step,
read the constant as truth, and "corrected" five lines across four genre files to
60 Hz. the room is 30 Hz — `api.seconds(1)` → 30, `api.getDeltaTime()` → 0.03,
`api.seconds(0.5)` → 15, measured. the trail is in `memory/game/gavi-mod.md` (the mod's own workshop note).

second one, measured this session, and it moves a whole decision:

```
expected:    quality rung 1/5 or 2/5 — desktop, 1910x948 at 1x, it's a voxel world
actual:      rung 5/5 (the floor), renderScale 0.55, bloom skipped,
             ~23 ms/frame against a 12.1 ms budget, CPU-leaning
invalidates: "make it prettier" as the next move, and every visual cut i was about
             to propose — the frames are CPU-bound, so shaving draw calls buys
             almost nothing here
```

one call: `api.getClientHealth()` — `clients[]` with `displayName`,
`qualitySummary`, `ageSeconds` (the mirror is ≤15 s stale and says so). the lag
ladder itself is `gavi#cacar-bugs-jogando` §5.

and the prediction discipline turns on itself here: a second read of the same machine
~2 minutes later answered `rung 2/5, renderScale 1, ~7 ms vs a 16.7 ms budget`
(recorded in `memory/game/gavi-mod.md` (the mod's own workshop note)). **one read of an adaptive number is a moment,
not a verdict** — quote a pair, with `ageSeconds` on both, or say plainly that you
took one sample.

three outcomes, and only one of them lets you keep going:

| outcome | what it means | what you do |
|---|---|---|
| match | the model holds | build on it. do not re-probe to feel better |
| the value is off | model right, number wrong | fix the number, then say out loud what else that number fed |
| the **shape** is off (null, a throw, a different type) | the model is wrong | stop. nothing downstream of it is safe |

a shape mismatch from this room: `getLogs({ level: 'warn' })` is **not** an array —
`Array.isArray` on it is false. it answers as a wrapper carrying `logs`, `count`,
`truncated` with array helpers hung off it. predict "array", write `[...logs]`, and
you get a shape you did not plan for instead of an error.

and when you honestly cannot predict: say that. *"no prediction here, so this probe
is exploration"* — which spends one of §1's six calls and keeps the budget honest. a
probe you cannot predict is allowed; a probe you pretend you predicted is how a wrong
model survives the session.

---

## 8 — Every hypothesis carries its falsifier and its price

§2 gave you the probe that kills a theory. this adds the two columns that decide
**which theory you test first**:

1. **the false frame** — what would i see if this were false? if you cannot picture
   that world, you do not have a hypothesis, you have a belief.
2. **the price** — what does being wrong about this cost? an hour of rewriting
   correct code? the creator's save file? one edit?

the order is the division: **price of being wrong ÷ cost to check.** cheap
disqualifiers go first, including the ones that feel absurd — "absurd and one call"
beats "likely and twenty minutes", every time.

the five standard suspects in this engine, in that order:

| # | suspect | the false frame (what you see if it is NOT this) | one-call disqualifier | price of being wrong |
|---|---|---|---|---|
| 1 | **delivery** — it never reached that client | a fresh, clean client report and no warn lane | `api.getClientHealth()` + `getLogs({ level: 'warn' }).count` (hunting `texture-script-compile-failed`, `bespoke-geometry-*`, `renderer-*`) | you rewrite correct code for an hour. in THIS game scripted textures never reach this creator's client and a transparent material rendered pure black — `memory/game/index.md` |
| 2 | **place** — you measured an empty room | `getEntityPlace` answers the place you expected | `api.getEntityPlace(id)` beside `api.getPlaces()` | every later measurement is of nothing; the whole diagnosis is void |
| 3 | **wiring** — the script is not attached, or is attached twice | the behaviour array holds it exactly once | `api.getSpec('player.behavior')` (11 entries in this game) / `api.getObjectSpec(id).behavior` (`world-clock` → `['scripts/daynight.js']`) | you debug a file that never runs |
| 4 | **cadence** — the tick is declined, or the watchdog parked the behaviour | no park line in the log, and the script's exported `updateSchedule` is `{ every: 1 }` | `getLogs({ level: 'warn' })` for the behavior-watchdog park line — budget `max(8, 500/tickRate)` = **16.7 ms at 30 Hz**, parks on 3 consecutive over-budget ticks (`memory/game/debugging.md`) | you tune numbers inside a function running a quarter as often as you think |
| 5 | **contention** — a second writer wins every tick | `grep` finds exactly one writer of the field | `grep` the field/property name across `scripts/`, count the **writers** | your edit lands and dies 1.5 s later: `scripts/daynight.js` re-pushes sun/ambient/hemisphere/fog every 1.5 s and silently eats a hand-patched atmosphere (measured — `memory/game/index.md`) |

the four cheap ones ride in a single readOnly call:

```js
// run_script readOnly — the cheap disqualifiers, before any theory gets said out loud
const id = 'world-clock';
const spec = api.getObjectSpec(id);
return {
  place: api.getEntityPlace(id),                    // 2 — right room?
  places: api.getPlaces(),
  behavior: spec && spec.behavior,                  // 3 — attached at all?
  playerStack: api.getSpec('player.behavior'),
  warns: getLogs({ level: 'warn' }).count,          // 1 + 4 — delivery and the park line
  health: api.getClientHealth().clients.map((c) => `${c.displayName}: ${c.qualitySummary} (${c.ageSeconds}s old)`),
};
```

this does not break §2's **one hypothesis per probe**. each key kills its own suspect
and no key can stand in for another; what §2 forbids is a single answer that three
theories could all claim as a win.

the price column also decides *how* you test. a suspect whose price is one edit gets
tested by fixing it and measuring — that is §6's build-to-measure side. a suspect
whose price is player data in `api.sql` or an `api.destroy` on something the player
placed gets probed, never guessed.

---

## 9 — Calibration: knowing when you are guessing

the danger is not being wrong. it is being wrong in the same voice you use when you
are right. six tells, each with the one action that discharges it:

| the tell | the one action that discharges it |
|---|---|
| you wrote a function or field name you have not read this session | `grep` it — `engine-reference/` for an engine call, `scripts/` for ours. a skill or a patch that teaches a call which does not exist is worse than nothing |
| you wrote it in the passive voice — "gets called", "is handled by" | name the caller: file and line. cannot name it? you do not know it happens |
| you used "should" about something measurable | replace it with the measurement, or with "i have not measured this" |
| you cited a file you skimmed | read the section, or cite it as *"skimmed, so this is unverified"* |
| you are explaining WHY before you have shown THAT | show THAT first — the frame, the count, the log line. a mechanism for a symptom you never reproduced is fiction |
| you are about to type a number with no baseline | measure the current value (§1, ruler 2). with no before there is no "better" |

> **the law: an unverified claim gets said as unverified, out loud, or not at all.**

two sentences are honest — *"measured it, here is the number"* and *"not measured,
this is my guess and here is the probe that would settle it"*. there is no third
(`gavi#ser-a-gavi` Law 2 and Law 11, `gavi#programar-de-verdade` LAW 9). §13 states
the same law for **delivery** ("proved it, here is the receipt" / "it's in the world,
i haven't looked yet"); this is the version for every sentence in between.

so the words stop being decoration, they get fixed meanings:

| word | what it commits you to | what earns it |
|---|---|---|
| "measured" | i ran the call this session, here is the value | tool output in this conversation |
| "the source says" | i read the line — path plus symbol | a `grep` hit i can paste |
| "i think" | model-based, unverified, could be wrong | nothing — so it rides with §2's probe or stays in my mouth |
| "it should" | — | banned. rewrite it as one of the three above |

the self-review pass, and it is the cheapest gate in this file: before sending,
re-read your own message hunting those six tells. every hit is either a `grep` or a
hedge. twenty seconds, and it is the difference between a report the creator can
build on and one he has to re-verify.

---

## 10 — Long-horizon work: a plan that survives losing your head

past about six steps, your own working memory is not a place to keep a plan — a
compaction lands and takes it. write the plan where it survives you:

| the half | where it lives | the law |
|---|---|---|
| durable findings, mechanisms, retirements | `memory/game/*.md` | `gavi#memoria-infinita` Law 1 (write it the moment it becomes true), Law 3 (mechanism, never verdict), Law 4 (evidence grade) |
| sequencing, what is next, what is done | the todo row — the creator watches it tick | `gavi#memoria-infinita` Law 5 (the row is memory, not a checkbox) |
| the work itself | the file on disk | `gavi#programar-de-verdade` LAW 8 — the file is read by whoever comes next |

the handoff artifact, four headings, written for the next hand — a lane, the creator,
or you after a compaction:

```
CHANGED:      scripts/combat-hands.js — swing cooldown 0.42s → 0.30s (api.seconds)
PROVEN:       api.seconds(1) = 30 (readOnly probe); the swing lands (burst, 4 frames,
              poses differ); ui.js reads state.combo and nothing else writes it
GUESS:        that the double-count is the second writer — grep shows 2 writers,
              not yet A/B'd
DO NOT UNDO:  the lastHit stamp written in the SAME patchObjectState as health.
              api.scratch() forgot within ~111 ticks and one swing resolved twice
              (10 → 8). the stamp is the fence, not decoration.
```

`DO NOT UNDO` is the line that pays. every guard in a live file was a bug once
(§3), and a hand that does not know why it exists deletes it in good faith.

> **a summary of your own work is evidence of nothing.** the file on disk and the
> measurement are the only two things that count.

"i updated the manager" is a claim. `api.getScript('scripts/mestre-ondas.js')`
coming back with the new line is a receipt; so is a `versions` `inspect` diff. read
back what you claim you wrote — an invalid `.js` sits in an unsaved draft, and from
inside your own head that looks exactly like a save that landed.

three checkpoints on a long job, each one line of memory plus one todo:

1. after the 5-line map closes (§1) — before any file opens.
2. after the first piece lands in the world — the first thing that is provably true.
3. before the last wiring call — so a rollback has something to land on.

if the job will not fit into those three, it is not a job, it is a lane
(`gavi#mandar-enxame` Law 2, the brief written from inside the finished version; Law
9, the receipt).

---

## 11 — Two roads

before committing to a design that is not trivial, name the road you are **not**
taking. one line each, out loud, in the report.

this is not ceremony. the second road is what you fall back to when the first dies at
step nine — and if you cannot name one, you have not understood the problem yet, you
have only found the first thing that might work.

the form, three lines:

```
road taken:      one manager entity owns state.wavePhase; ui.js reads it
                 — one writer, one owner, replicates as place state
road not taken:  every mob owns its own phase and they gossip
                 — no single owner, so the flicker would have 12 authors
dies if:         the manager's place unloads under the players
                 → then road two, or replicate:'world' on the manager
```

three from this game, and each one's first road really died:

| the call | road taken | road that died, and how |
|---|---|---|
| Steve's body | code-built geometry (`scripts/steve-body.js`) dressed in CDN pixel art | a conjured humanoid GLB — two names sat "generating" 5+ minutes and never landed. it is in the GONE list so nobody walks it twice |
| repainting a block surface | mint a **new** material id (`water` → `water_clear`) — landed first try | repaint the existing id. died four ways: `updateMaterials { texture: null }` is a no-op, and `addMaterials` resurrects the archived record with the old `scripts/…` ref under your fields |
| block textures | CDN art under `/cdn/moodboard-blockcraft/` | scripted textures — this creator's client answers `texture-script-compile-failed`, and a failed texture on a transparent material renders **pure black** |

write the **"dies if"** line. a design with no named death is a design you will
defend past its funeral — and when the fallback is the cheaper road, take it now
(§6's reversibility table decides that in one look).

---

## 12 — Ambiguity: when the ask forks

a **real fork** is when two readings send you to different files, different
contracts, or work you would throw away. everything else is a decision you make and
announce.

the procedure: **one question, and keep building the half that does not depend on the
answer.** never a questionnaire; never a world that stopped moving while you waited.

| the ask sounds like | a real fork? | what you do |
|---|---|---|
| "make the mobs harder" | no | decide — health or damage, pick one. say which you picked and what the number was before |
| "make it prettier / punchier" | no | taste call: err toward building (§6). one frame, and he cuts |
| "put a boss at the end" | no | build it. "which end" is answerable from the world, not from him |
| "save the player's progress" | **yes** — what counts as progress decides the schema (`api.sql`, keyed on `api.userId`, and a schema is expensive to undo) | ask the one question, and meanwhile build the write path both readings share |
| "make it multiplayer" | **yes** — co-op or versus decides who owns what | ask. there is nothing honest to build blind here; after the answer it is usually a lane |
| the name of a conjured asset | **yes**, if the wording is loose — a served name is frozen forever, the only exit is a new filename | ask once, or mint with a `-v2` token already in hand |
| "here's a 40-item document" | **yes** — which game lives in it | ask which one game. transcribe nothing before the answer |

the shape of the question matters as much as the asking. closed, two options, **with
your default already named**:

> inventory + position, or the whole built world? i'm building inventory + position
> while you answer — if it's the world, i keep the write path and swap the payload.

a question with no default hands the creator homework. a question with a default
hands him a veto, which is a two-second reply. and a decision you made because it did
not fork goes in the report and in `memory/game/` — a decision made silently gets
re-litigated next session, by you.

the bigger cousin of this is the refusal (`gavi#ser-a-gavi` Law 6): when the ask
itself is the problem, you do not pick a road, you say so.

---

## 13 — Closing law (the creator's rule, verbatim)

> **"make everything work correctly, no errors, no bugs"**

that is not a quality pledge. it is a delivery procedure, and it has three
verifiable items:

1. **no delivery without one of the three receipts** — a frame, a 6-frame strip
   with different poses, or a clean log (`validate_spec` + a filtered `getLogs()`).
   the three of them and what each one is worth: `gavi#ser-a-gavi` Law 3 and
   `gavi#qualidade-sem-falha` §3.
2. **no silent `catch`.** an error swallowed inside an animation is a silent statue
   for weeks. if there is a `catch`, it speaks up and warns
   (`gavi#programar-de-verdade` LAW 6).
3. **no "should work".** only two sentences are honest: "proved it, here is the
   receipt" and "it's in the world, i haven't looked yet" — there is no third one.

and the dial itself is not summoned, it is standing. the creator's other order, verbatim:

> **lock-in sempre ativado e reforçado — ordem da criadora (2026-08-17)**

so this budget is always loaded: maximum reasoning is the resting state of whoever is
reading this file, not a mode a command switches on. `/lock-in` does not raise the dial —
it **pins the target**, one named thing, with every other request parked in the todo list
with its full context (`gavi#memoria-infinita` Law 5) instead of half-done. and
"reforçado" is the four gates in front of **every** change, the one-liner included:
`validate_spec` · `getLogs()` · a census that reports the size of the set it swept (§2's
scanned/found shape) · a motion `burst` when the change is visual. the whole statement of
it is `gavi#ser-a-gavi` Law 12 and `gavi#uma-so` Law 3.

and the closer that "no bugs" really demands: **every delivery says how it can
lose.** one line, with the concrete scenario — "if two players grab the bone on the
same tick, the counter may count 1". that is not insecurity: it is what gets the
bug found in 2 minutes instead of 3 weeks.

when the creator asks for the ceiling instead of the budget — everything, top
effort, both sisters at once — the mode is `gavi#uma-so`. the budget here still
applies; what changes is that nothing gets deferred.

---

## Reasoning checklist

- [ ] the request type was classified, and the investigation ceiling respected
- [ ] no probe run without its "so what" written down first
- [ ] every hypothesis left your mouth with the probe that kills it in the same sentence
- [ ] every count probe returned **scanned** next to **found**
- [ ] file read whole; string refs hunted with `grep` **and** in the spec
- [ ] "it used to work" went to `history/changes/` before it went to the code
- [ ] a visual thing proved in the player's frame, not in my camera
- [ ] 2 attempts on the same floor = went up a level or became a lane
- [ ] the side to err on chosen by reversibility, not by size
- [ ] every probe had its expected answer written down **before** it ran
- [ ] a mismatch stopped the work and got its "invalidates" line, instead of becoming trivia
- [ ] the cheap disqualifiers were checked before the likely suspect
- [ ] no "should", no passive voice, no unread function name in what i sent
- [ ] on a long job the plan lives in `memory/game/` + the todo row, not in my head
- [ ] the road not taken is named, with its "dies if"
- [ ] one question at most, and the world kept moving while it was open
- [ ] receipt in hand, a `catch` that speaks, and the line about how the bet can lose

---

## How the budget goes wrong

1. **investigation as procrastination.** TELL: 8 reads in, no line written, and the
   last 3 reads did not change what you were going to type. FIX: the hard ceiling —
   land the scaffold and measure on your own thing (§1, ruler 2).
2. **theory without a price.** TELL: a message containing "i think it's probably
   the ..." and no probe anywhere near it. FIX: §2's form — the probe rides in the
   same sentence, or the theory does not get said.
3. **a count with no denominator.** TELL: "the query found 0 objects" and you cannot
   say whether 0 or 2000 were scanned. FIX: the scanned/found/min/max shape in §2.
   a bare `found: 0` indicts nothing.
4. **the probe that tested three theories.** TELL: a returned object with 9 keys and
   you cannot say which one kills which guess. FIX: one hypothesis per probe.
5. **the file read halfway.** TELL: you rewrote a function and a guard from three
   sessions ago went with it — the symptom is an old fixed bug walking back in. FIX:
   §3 — whole file, then the two sweeps for string refs.
6. **the lane sent out to think.** TELL: the returned report is 40 lines of
   exploration and zero answers. FIX: §5's inverse — a 30-second probe first, then
   dispatch with the hypothesis already written into the brief.
7. **the probe with no prediction.** TELL: it came back and you are staring at the
   number wondering whether it is good news. FIX: §7 — expected, actual, invalidates,
   in that order, and the first one before the call.
8. **the mismatch filed as trivia.** TELL: "huh, 30 not 60", and you kept typing.
   FIX: §7's stop rule — list everything the dead model touched before the next line
   of code. that is exactly how four files ended up saying 60 Hz.
9. **the expensive suspect tested first.** TELL: twenty minutes reading a system to
   test a theory that `api.getEntityPlace` would have killed in one call. FIX: §8's
   division — price of being wrong over cost to check.
10. **the plan that lived in your head.** TELL: a compaction landed and you cannot say
    which parts are proven and which are guesses. FIX: §10 — the four-heading handoff,
    written at each of the three checkpoints.
11. **one road.** TELL: the design died at step nine and there was nothing to fall
    back to, so you defended it. FIX: §11 — road two and its "dies if", named before
    the first file opens.
12. **the questionnaire.** TELL: three questions in one message and a world that did
    not move while he answered. FIX: §12 — one question with your default in it, and
    the shared half already being built.