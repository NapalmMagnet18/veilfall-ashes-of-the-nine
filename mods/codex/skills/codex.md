---
name: Codex
description: The standing order for building a game from its Codex — how to fill the top tabs, form the Open Questions, set the Invariants, plan the Build Order, and then work the phase rail top-down, filing creator input instead of chasing it.
---

# Building from the Codex

The Codex is the game's design document, living in a god-mode tab. It is the
plan of record: when the creator says "follow the codex," the codex outranks
improvisation, and every phase of work is read out of it before anything is
built.

## Where the codex lives

The document is **many small files**, not one big one. In `mods/codex/lib/`
(dev folder: `scripts/codex/lib/`):

- `doc-<tabId>.js` — one file per top tab, each `export const PAGES = [ … ]`.
  The tab ids are `overview`, `features`, `lore`, `characters`, `npcs`,
  `levels`, `ui`, `sfx`, `vfx`, `questions`, `invariants`, `buildorder`,
  `notes`.
- `doc-phases.js` — the whole build-order rail: `export const PHASES = [ … ]`
  and `export const DIRECTIVE = { … }`. The rail is read and worked as a unit,
  so it stays one file.
- `codex-doc.js` — the assembler. It requires the others and exports the
  stitched `DOC`. **Nothing is ever authored in it.**

**Read the files you need before answering anything about the codex's contents
— never recall them.** One tab's question reads one file; a full review reads
all of them.

**Savi is the only author.** The panel is read-only: the creator opens it to
read the plan, catch mistakes early, and copy the text out — there is no button
in it that changes a word. Every edit is Savi's:

1. Read the file(s) the edit touches.
2. Apply ops from `lib/codex-ops.js` (`applyOp`) to the assembled doc, or edit
   the page list directly.
3. Write back **only the files that changed**, with `serializePages(tabId,
   pages)` for a tab and `serializePhases(phases, directive)` for the rail.

That is the point of the split: writing one tab rewrites one small file, and
two edits in different tabs never touch the same text.

The creator's corrections arrive as speech — take them, write them in, tell
them it's written. A mounted panel does not hot-reload: after writing, they
close and reopen the tab to see it.

## Migration — an old single-file codex

Codexes written before the split hold everything in one literal
`export const DOC = { … }` inside `codex-doc.js`, with no requires. That still
reads fine, but it must be split before it is written to again.

Check with `isLegacyStore(source)` from `lib/codex-ops.js`, then split it in
one call — `splitStore` returns every file the store is made of, already
serialized, keyed by full path:

```js
const OPS = require("codex/lib/codex-ops.js");     // dev folder
// installed: require("mods/codex/lib/codex-ops.js")
const STORE = require("codex/lib/codex-doc.js");
const files = OPS.splitStore(STORE.DOC, "scripts/codex/lib");  // installed: "mods/codex/lib"
for (const path of Object.keys(files)) api.setScript(path, files[path]);
```

Nothing is lost: every page, phase, list item and the directive come through
the same `normalizeDoc` the panel reads with. Verify by reading the assembled
`DOC` back in a fresh call before carrying on.

## The two stages

The codex is filled in one direction, then worked in the other.

### Stage 1 — the top tabs (definition)

Order of work, strictly:

1. **Overview** — theme, genre, premise, tone, pillars, who is playing.
2. **Feature List** — everything the game will do, one page per system.
3. **Lore** — the world's history and canon, as the creator wants it.
4. **Characters / NPCs** — who exists, what they want, how they speak.
5. **Level Design** — the places, their shape, flow, and encounters.
6. **UI / SFX / VFX** — what's on screen, what it sounds like, what it feels like.
7. **Open Questions** — every gap, contradiction, and unstated assumption
   found while writing the tabs above. One question per page. When the creator
   answers one, write the answer into the page *and* into the tab it belongs
   to, then mark the question answered in its title (`[answered]`).
8. **Invariants** — the rules that must never break. Two sources, both
   required: the creator's own statements ("the player never dies", "no
   loading screens"), and research — what this genre demands to work at all.
9. **Build Order** — the phase plan, written for maximum throughput: each
   phase a coherent slice that can be built and judged on its own, ordered so
   later phases never wait on earlier ones being redone, and shaped so several
   wisps can work parallel lanes inside a phase. Each Build Order page becomes
   a phase in the left rail.

**The filing rule for this stage:** while the top tabs are being written,
anything the creator says that does **not** answer a question you posed goes
into **Additional Notes** as its own page — verbatim, with what it was
reacting to. It is not built, not argued with, not lost. It gets evaluated
when its phase comes up.

### Stage 2 — the phase rail (execution)

Once the top tabs are done and the left rail has phases, work the rail
**top-down**, one phase at a time.

- Each phase carries a **checklist** (its build items), a **bugs** list, and a
  **notes / alterations** list.
- Work as many checklist items per phase as can be done in one pass — parallel
  wisp lanes where the items are independent. Finish the phase, then stop.
- **Creator input during a phase is filed, never chased.** A bug report goes
  into that phase's bugs list (or the phase that owns the broken thing). A
  change request or new idea goes into that phase's notes. Say that it's filed
  and where. Then keep working the current phase.
- Only when the phase's checklist is clear do you turn to its filed bugs and
  notes: evaluate each one, do the ones that belong here, and move the rest to
  the phase that owns them.
- Then advance the phase's **stage**: First Draft → Second Draft → Bug Pass →
  Polish → Final. The bug pass reads the bugs list; polish reads the notes.
- A phase is not Final while unresolved items sit in its lists.

This is the whole point of the rule: nothing gets fixed twice, nothing gets
added three times, and the creator never has to remember what they mentioned
forty minutes ago.

## Reporting

At the end of each phase, tell the creator in one short message: the phase is
done, its stage now, and what got filed into it while you worked. Not a recap
of the work — the world shows that.