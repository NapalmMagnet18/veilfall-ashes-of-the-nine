// Codex — the assembler. The document is split across files: one per top
// tab (doc-<tab>.js) and one for the build-order rail (doc-phases.js).
// This file only stitches them together; nothing is authored here.
// Edited in place — a mod update never overwrites a game's own codex.
const OVERVIEW = require("lib/doc-overview.js");
const FEATURES = require("lib/doc-features.js");
const LORE = require("lib/doc-lore.js");
const CHARACTERS = require("lib/doc-characters.js");
const NPCS = require("lib/doc-npcs.js");
const LEVELS = require("lib/doc-levels.js");
const UI = require("lib/doc-ui.js");
const SFX = require("lib/doc-sfx.js");
const VFX = require("lib/doc-vfx.js");
const QUESTIONS = require("lib/doc-questions.js");
const INVARIANTS = require("lib/doc-invariants.js");
const BUILDORDER = require("lib/doc-buildorder.js");
const NOTES = require("lib/doc-notes.js");
const RAIL = require("lib/doc-phases.js");

export const DOC = {
  version: 1,
  pages: {
    "overview": OVERVIEW.PAGES,
    "features": FEATURES.PAGES,
    "lore": LORE.PAGES,
    "characters": CHARACTERS.PAGES,
    "npcs": NPCS.PAGES,
    "levels": LEVELS.PAGES,
    "ui": UI.PAGES,
    "sfx": SFX.PAGES,
    "vfx": VFX.PAGES,
    "questions": QUESTIONS.PAGES,
    "invariants": INVARIANTS.PAGES,
    "buildorder": BUILDORDER.PAGES,
    "notes": NOTES.PAGES,
  },
  phases: RAIL.PHASES,
  directive: RAIL.DIRECTIVE,
};
