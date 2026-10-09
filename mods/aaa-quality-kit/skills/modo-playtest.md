---
name: Modo Playtest
description: The PLAYTESTER brain — clean-script doctrine (fiction-named state, one concern per script, data tables over branch chains, no dead code) plus the live playtest loop: walk the real game as a player, evidence on every finding, rank by what the player hits first, classify feio/errado/bugado, fix with receipts and re-look before moving on.
---

# Modo Playtest — the playtester brain

**This is a curriculum, not a model swap.** "Activating the mode" IS loading this skill and
following it. No model changes, no brain changes, and by itself zero change to how the game looks
or which assets exist — what changes is how the next hour of work is spent: reading the game as a
player instead of as a file tree.

Two halves, and they belong together. `aaa-quality-kit#aaa-training` owns the debugging doctrine
and the verified symptom→fix dataset; `#modo-ultra-stronger` owns the math and the systems habits.
This one owns **the pass after the build**: leaving the code, entering the world, and coming back
with a ranked list nobody can argue with.

---

## Part A — clean-script doctrine

Code the playtester can read is code the playtester can fix mid-session. Every rule here exists
because a messy version of it cost a real session.

- **Name things in the game's fiction.** `whatRemains`, not `resourceCount`. `hungerBites`, not
  `counter2`. `theOneWatching`, not `enemyB`. A name from the fiction survives the refactor and
  tells the next reader what the game *means* by the number; a generic name has to be re-derived
  from the code every time. Same law on files: `animal-body.js` says what it is,
  `helper-utils-2.js` says nothing.
- **One concern per script.** A behavior does one job. Helpers go to `scripts/lib/*.js`, data to
  `scripts/lib/data/*.json`, UI to `scripts/ui.js`. A 600-line behavior doing movement, inventory
  and audio is three bugs sharing a file — and during a playtest it's three bugs you can't fix
  independently.
- **Data tables over branch chains.** `if (species === "coelho") … else if (species === "porco")`
  is a table waiting to be written. A table is readable at a glance, diffable, tunable live, and
  it never grows an `else` nobody tested. **The second of anything is a data row** — the second
  animal, the second wave, the second sound is a row, not a fork.
- **No dead code.** Delete what nothing references: the orphan script, the state key nobody reads,
  the commented-out block "in case". Dead code is the most expensive thing in a debugging session
  because it looks alive. `grep` the id before you keep it; if the only hit is its own definition,
  it goes.
- **Exactly one writer per piece of state.** The player owns its body and its input intent; a place
  manager owns waves and timers; each object owns its own. When two writers touch one value you get
  a symptom that changes every time you look at it, which is the single hardest bug class to test.
- **Per-frame scratch stays in script variables.** Phase accumulators, cached distances,
  last-visible flags — `patchState` per object per tick is a replication storm with a feature
  attached, and on a CPU-leaning client it reads as lag, not as a bug in your code.
- **Idle is write-free.** Guard every `setProperty` with "did it actually change". A world that
  writes nothing while nothing happens is a world you can profile.

The doctrine's own test: pick any file at random and ask *what one sentence describes this file's
job?* If the sentence needs an "and", split it.

---

## Part B — the live playtest loop

### 1. Enter the real game and walk it

Not the spec, not a preview booth: the running world, from the spawn point, doing what a player
does. Move, jump, look around, open the menu, press the thing, eat the thing, die. The booth
(`preview_object`) proves an object; only the live game proves a **game**.

- `view_live_scene` with no arguments = what the player's client is actually rendering right now,
  UI composited.
- `view_live_scene { camera: {position, target} }` = your own angle, for the thing the player will
  see in five seconds.
- `view_live_scene { burst: { frames: 4 } }` = motion. A single still cannot judge a gait, a
  stutter, a foot-slide, or a stroke's timing. **Anything that moves gets a burst, never a still.**
- `view_live_scene { colliders: true }` = the invisible walls, floors and gaps, plus a live-vs-spec
  drift read.
- `read_authored_ui` = the HUD's real DOM with delivery receipts (3D captures alone never settle a
  UI question).
- `identify_object { screen: [x, y] }` = "what IS that ugly thing at the middle of the frame".

### 2. Every finding carries evidence

A finding without evidence is a vibe, and vibes get argued with. Each entry gets one of:

| evidence | what it settles |
| --- | --- |
| a frame | it looks wrong / it's missing / it's in the wrong place |
| a burst | it moves wrong: pops, slides, stutters, never anticipates |
| a log line (`getLogs`) | it errored, it was rejected, it parked |
| a readOnly `run_script` read | the number behind the symptom (count, position, state) |
| a `get_game_perf` row | it's slow, and *this* is what costs |

"Looks a bit off" is not a finding. "The hunger bar reads 3 while `whatRemains` is 5 — frame + the
state read" is a finding. Write findings in the player's words first (*what did I see*), then the
mechanism.

### 3. Rank by what a player hits FIRST

Order is the whole value of a playtest. A broken menu on the first screen outranks a wrong texture
on a distant hill, always — even when the texture is uglier and the fix is easier.

1. **Blocks play** — can't start, can't move, can't leave the menu, falls through the floor.
2. **Breaks the loop** — the core verb fails (can't eat, can't collect, can't win).
3. **Hits in the first minute** — spawn view, HUD, first sound, first contact.
4. **Frame-rate on the room's real clients** — lag is a bug with no error message. This room's own
   creator client runs CPU-leaning (~22 ms/frame, bloom parked): if it's slow there, it's slow.
5. **Feel** — no anticipation, no impact, silence where a hit should sound.
6. **Distant / rare / cosmetic** — the far texture, the prop nobody walks to.

### 4. Classify: feio / errado / bugado

Three buckets, because they have three different fixes and three different owners:

- **feio** (*ugly*) — it works and it reads cheap: flat surface, no shadow under a standing sprite,
  a light with no color, evenly-spaced props. Fix in the look/art lane (`#aaa-look`, `#aaa-sprites-2d`,
  `#modo-shaders`). Never blocks a release, always worth a pass.
- **errado** (*wrong*) — it works as built and the build is wrong: hunger drains too fast, the jump
  is floaty, the enemy spawns behind you, the number on screen isn't the number the fiction wants.
  A design/tuning fix — numbers and data rows, usually not new code.
- **bugado** (*broken*) — it does not do what any version of it should: an error in the log, a
  rejected patch, a missing object, a handler with no ears. This is `#aaa-training`'s lane — one
  hypothesis, one change, one receipt, and a fix that misses twice is upstream.

Tag every finding with exactly one bucket. A finding that could be two is two findings.

### 5. Fix with receipts, and re-look after EACH fix

- One hypothesis, one change. Never stack two fixes on one symptom — when the symptom moves you
  won't know which hand did it.
- Take the *before* measurement of the exact symptom (readOnly read, frame, or perf row), make the
  change, then take the *same* measurement after. That pair is the receipt.
- **Re-look before moving to the next finding.** The frame after the fix is the only thing that
  closes a finding; an edit that saved is not an edit that worked. Banned closing lines: "should be
  fine now", "that'll do it".
- A fix that creates a new finding goes on the list at its own rank. Two fixes deep with no look is
  how a session ends worse than it started.

### 6. Taste is licensed

The report is the floor, not the ceiling. When the walk shows something that is merely *bad* —
nobody complained, it wasn't in the brief, it just isn't good enough — fix it, in the same pass,
with the same receipts. A playtester who only repairs what was reported ships a game that is
exactly as good as its complaints.

Two limits on the license: don't open a second front in someone else's active file, and say what
you changed. Unrequested improvements are welcome; unannounced ones are not.

---

## The 5-minute new-player walk (run this before every "done")

1. **Spawn frame.** One `view_live_scene` from the spawn point, untouched. Is the first thing the
   player sees worth a screenshot, and does it say what the game is about?
2. **HUD.** `read_authored_ui` — is every element present, readable, and telling the truth about
   the state behind it?
3. **The core verb, three times.** Do the game's main action (eat, collect, build, hit) three times
   in a row. Does it respond every time, with sound and impact every time?
4. **Motion.** One `burst` of the player and one of an NPC. Does anything pop, slide, or move
   without anticipating?
5. **Menus and edges.** Open every menu, close it, walk to a world edge, jump off something high,
   land. `colliders: true` on anything that felt wrong underfoot.
6. **Ears.** Stand still for ten seconds. Is there a bed? Do footsteps change with the surface
   (`#aaa-sound`)?
7. **Frames.** `get_game_perf` on the room's real clients — the number, not the feeling.
8. **Logs.** `getLogs` last, once: anything warning, rejected or parked that the walk didn't show.

Findings ranked, each with evidence, each tagged feio / errado / bugado. That list — not the diff —
is the deliverable of a playtest.