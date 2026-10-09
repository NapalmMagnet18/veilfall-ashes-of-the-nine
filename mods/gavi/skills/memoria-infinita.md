---
name: Infinite memory — remember everything, forever
description: How the fused builder never forgets. The four tiers of memory (the live todo list, the durable journals, the read-only record of every past conversation and every file change, and the spec's own version history), the law of writing at the moment a thing becomes true, evidence grades, and the searches that pull a six-week-old finding back into the room in one call.
---

# Infinite memory

The builder's memory is not a bigger context window. A context window always ends —
mid-session, without warning, in the middle of the exact debugging trail that took
forty minutes to earn. **Anything that lives only in the conversation is already
lost.** It just hasn't happened yet.

Infinite memory is a discipline: everything worth keeping gets *written*, at the
moment it becomes true, into the tier that fits it — and every tier is searchable.
Done properly, nothing in the history of this game is ever more than one call away.

---

## The four tiers

| tier | where | what it holds | survives |
| --- | --- | --- | --- |
| **working** | `todos` | the open threads, each with the creator's own words and your full technical trail | a compaction, a new session, a handoff |
| **durable** | `memory/` and `memory/game/` | who this person is, what this game IS, what is retired, why each decision went the way it did | forever, across every session and every collaborator |
| **the record** | `history/chat/` and `history/changes/<file>` | every message ever sent, every version of every file — read-only, complete | forever, automatically, with no effort from you |
| **the code's own** | `versions` | when a line changed, what the diff was, the exact stored body of any file at any point | forever |

Tier three is the one people forget exists, and it is the literally unlimited one.
You never have to remember a conversation from six weeks ago. You have to remember
**that it is findable**.

---

## Law 1 — Write at the moment it becomes true

Not at the end of the session. Not "when there's a quiet moment". The moment the
truth of the game changes — especially when it changes *away* from something already
written down — is the moment the note gets written. The reply to the creator goes
first; the write rides behind it.

The three moments that always earn a write:

1. **A "never do X again".** The creator rejecting an approach is the most expensive
   sentence in the session. It is worthless unless it is in the GONE list.
2. **A real cause found.** Not the fix — the *cause*. See law 3.
3. **A dead end proved.** Five failed attempts that were never written down cost the
   next session five failed attempts.

## Law 2 — The GONE list comes first, at the top of the file

`memory/game/index.md` opens with **what is retired** before it says what the game
is. Read it before rebuilding anything that smells familiar.

The most expensive mistake available to a builder is not a bug. It is spending
forty minutes rebuilding a thing that was already tried, already failed, and already
written down as a dead end. A retired thread and an open one read *identically* in
a carried summary. The GONE list is what tells them apart.

```
## Gone / retired — check here before rebuilding
- **Conjured humanoid models for the hero are a dead end.** Two names sat
  "generating" 5+ minutes and never landed. The hero is code-built geometry now.
  Do not go back.
- **A texture id that ever carried a `texture` keeps it forever** — re-adding
  resurrects the old record. Fix by minting a NEW id, never by repainting.
```

Every line names the thing, the evidence, and the instruction. No line says only
"didn't work".

## Law 3 — Write the mechanism, never the verdict

"Fixed the arm bug" is worth nothing in three days. This is worth everything:

> The skin id rides in the entity NAME, so picking a card builds a brand-new pair —
> but the only cleanup was a `query({ radius: 2.5 })`. The pair is pinned to the
> CAMERA, and the skin is picked in third person where the camera sits 3-4 m back,
> so the previous coat's pair fell outside the radius, survived, and was never
> posed again: a dead arm frozen beside the live one. Fixed by sweeping **by name**
> across every build and every skin — names never miss where a radius does.

A future reader can rebuild the entire thought from that, apply it to a *different*
bug with the same shape, and never repeat it. That is what a memory file is for.

## Law 4 — Every note carries its evidence grade

Frontmatter on every memory file: a one-line `summary:` and `evidence:` — one of
`user-said`, `tool-verified`, `observed-built`, `hypothesis`.

**A note binds exactly as hard as its evidence.** The creator's word is law on
their game's design and outranks any measurement. A claim about how the *engine*
behaves needs this session's own receipts — an old `tool-verified` note about
engine behaviour is a strong prior, not a fact, because the engine ships versions.
A `hypothesis` never gets quoted later as though it were measured.

Label the untested thing untested, in the file, in capitals if it matters:

```
STILL UNVERIFIED: none of the four swim sounds has ever been heard, and the
underwater look has never been judged in a frame with a head actually under water.
```

## Law 5 — The todo row is memory, not a checkbox

One row per complaint. **Never open a second row for the same complaint** — the
re-ask goes into the existing row, so the whole arc lives in one place: what they
said, what was tried, what they sent back, what the current theory is.

- `creatorLabel` — the felt outcome, in *their* words. This is what they see.
- `context` — everything you know. File names, line-level findings, the mechanism,
  the dead ends, the named next move. Only you ever read it. There is no such thing
  as too much here.

Close a row's context with **the named next move**, written so that a builder with
no memory of the session can pick it up cold:

> NEXT MOVE: a first-person frame, then `identify_object` at ~[0.72, 0.8]; confirm
> the id carries the current build number. If it does not, the guard never fired.

When a lane of the crew is going to carry the row, hand the row to it — the wisp
sees the whole trail in its brief instead of rediscovering it.

## Law 6 — Search before you ask

If the creator mentions a project, a mechanic, or an old bug trail *as though you
already discussed it*, you did. Go find it. Making them restate it is the tell that
the memory is not working.

The four searches, in the order they usually pay:

```
grep({ pattern: "viewmodel|arm ghost", path: "memory/" })                  // what was concluded
grep({ pattern: "sem textura", path: "history/chat/", since: "2026-07-01" }) // what they actually said, and when
grep({ pattern: "textureScale", path: "history/changes/scripts/ui.js" })     // how this file got here
versions({ action: "find_change", query: "SWING_DEGREES" })                  // when this number last moved
```

`history/` is bounded by date on the path (`history/chat/2026-08`) and by
`since` / `until`. A file's whole arc is at `history/changes/<file>`.

And when a version was better than the current one, you do not rebuild it from
memory — you restore the exact stored body:

```
versions({ action: "restore_file", path: "scripts/ui.js", offset: -5 })
```

Rebuilding a file "from memory" is how a working thing comes back subtly broken.

## Law 7 — Capacity is real; continue, never truncate

A memory file has a ceiling. When one fills, do not start deleting the old
findings to make room — start `<topic>-2.md` and leave a pointer at the bottom of
the first one. A trail split across three files is fine. A trail with its middle
deleted is a trail that will be re-walked.

Same law for dead code: a script that documents a bug you never want to meet again
stays on disk, with a header saying it is retired and why. Zero references **by
design** is a legitimate state for a file, as long as the file says so out loud.

## Law 8 — The game remembers too

Two different memories, never confuse them:

- **Yours** is `memory/`, `todos`, `history/` — for the builder across sessions.
- **The game's** is `api.sql` — for the *player* across sessions, and it is part of
  the design, not the tooling.

```js
// the game's own memory: what this player did, still here next week.
await objectApi.sql(
  'CREATE TABLE IF NOT EXISTS journeys (playerId TEXT PRIMARY KEY, deepestY REAL, nightsSurvived INTEGER)'
);
await objectApi.sql(
  'INSERT INTO journeys (playerId, deepestY, nightsSurvived) VALUES (?, ?, ?) ' +
  'ON CONFLICT(playerId) DO UPDATE SET deepestY = min(deepestY, excluded.deepestY), ' +
  'nightsSurvived = nightsSurvived + excluded.nightsSurvived',
  [playerId, feet.y, 1]
);
```

And the third memory, the one that writes *itself*: sensors. A game wired with
`notifyDm` reports its own state into your next turn, so you arrive already knowing
what happened instead of asking.

```js
// in the manager that owns the beat — fires once, ever, per key
objectApi.notifyDmOnce('first-night-survived', 'a player made it to dawn on night 1 with 2.5 hearts left');
// fires every time — for beats you want a count of
objectApi.notifyDm('a player drowned in the cave lake at y=31');
```

Wire these at the moments that matter — entered the boss room, took the key, died
at the bridge, finished the puzzle. Cheap, and they turn the next session's opening
line from "how did it go?" into "so you drowned in the cave lake — let me fix the
air".

---

## The five-minute session opener

Before touching anything, in one pass:

1. `memory/game/index.md` — what is GONE, then what the game IS.
2. `todos` — the open rows, and any row left hanging with a question for the
   creator. **Name that one out loud on their return**: *"last time the boss test
   was still waiting on your verdict."* It proves the memory is real.
3. `getLogs()` — what the world did while you were away.
4. Only then, the ask.

---

## Where this goes wrong

| failure | the tell | the fix |
| --- | --- | --- |
| **remembered, not written** | a finding is described confidently in chat and appears in no file; next session it is gone | the write happens in the same turn as the finding. Behind the reply, never instead of it |
| **verdict without mechanism** | the note says "fixed" and the bug comes back with a slightly different face | write the cause, the proof, and the law it implies. See law 3 |
| **the GONE list buried** | forty minutes rebuilding a proven dead end | retired things go at the TOP of the index, with the instruction attached |
| **a hypothesis hardens into a fact** | an unverified theory gets quoted three sessions later as measured truth | evidence grades on every file, and CAPITALS on the unverified line |
| **a second row for the same complaint** | two todos, two half-trails, neither with the whole arc | one row per complaint, forever. The re-ask goes into the existing row |
| **asking them to restate** | "remind me what the water bug was?" | grep `memory/` and `history/chat/` first. It is in there |
| **acting on a stale note** | a crew is dispatched to fix something that was fixed two sessions ago | a complaint carried from notes gets **re-verified before it gets a lane**: does it still reproduce? |
| **memory as a wall of text to them** | the creator receives a summary of what you remember | memory is silent. It shows up as *not asking twice*, and as one line proving you were listening |