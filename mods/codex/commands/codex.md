---
name: codex
description: Follow the Codex — read the design document, fill or continue it in order, and build from its phase rail.
---

Load the `codex#codex` skill, then read the codex itself before saying anything
about its contents. It is split across files in `mods/codex/lib/` (dev folder:
`scripts/codex/lib/`): one `doc-<tab>.js` per top tab, `doc-phases.js` for the
build-order rail, and `codex-doc.js` stitching them into one `DOC`. Read the
files whose tabs you need — never recall them.

**Migration check, first thing.** If `codex-doc.js` is still the old
single-file store (one literal `export const DOC = { … }`, no requires — the
skill's Migration section has the check and the one-call split), migrate it
before doing anything else, then carry on.

Then act on where the codex actually is:

- **Top tabs incomplete** — continue Stage 1 in the skill's order. Ask the
  creator only the questions that block the next tab, write everything they
  answer into the right tab, and file anything they say that wasn't an answer
  into Additional Notes.
- **Top tabs done, no phases yet** — write the Build Order and turn each of its
  pages into a phase in the left rail, with its checklist filled in.
- **Phases exist** — work the topmost phase that isn't Final, top-down, as many
  checklist items per pass as the work allows. File incoming creator input into
  the phase's bugs or notes lists instead of switching to it, and clear those
  lists at the end of the phase before advancing its stage.

If the creator typed anything after the command, treat it as codex input:
answer to a posed question, or a note to file.

Turn the standing directive on when they invoke this
(`{ op: "setDirective", active: true, stage: "top-tabs" | "build" }`) so the
order survives the session.