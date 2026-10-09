// Codex — shared data model + operations.
// Used by BOTH the creator panel (UI realm, optimistic local copy) and the
// god-mode behavior (durable writer). Same function, same result, either side.

export const TOP_TABS = [
  { id: "overview", label: "Overview", hint: "Theme, genre, premise, pillars, tone, audience." },
  { id: "features", label: "Feature List", hint: "Every feature the game will have, one page per system." },
  { id: "lore", label: "Lore", hint: "World history, factions, canon the player asked for." },
  { id: "characters", label: "Characters", hint: "Player characters, heroes, bosses — who they are." },
  { id: "npcs", label: "NPCs", hint: "Non-player cast: roles, behavior, dialog voice." },
  { id: "levels", label: "Level Design", hint: "Places, layouts, flow, encounters, landmarks." },
  { id: "ui", label: "UI", hint: "HUD, menus, panels, diegetic screens, input surfaces." },
  { id: "sfx", label: "SFX", hint: "Sound beds, one-shots, music, what each place sounds like." },
  { id: "vfx", label: "VFX", hint: "Particles, shaders, weather, screen effects, juice." },
  { id: "questions", label: "Open Questions", hint: "Gaps found in the brief. One question per page, answered inline." },
  { id: "invariants", label: "Invariants", hint: "Rules that must never break — canon + technical laws." },
  { id: "buildorder", label: "Build Order", hint: "The phase plan the left rail is generated from." },
  { id: "notes", label: "Additional Notes", hint: "Creator input that did not answer a posed question. Filed here." },
];

export const STAGES = [
  { id: "first-draft", label: "First Draft" },
  { id: "second-draft", label: "Second Draft" },
  { id: "bug-pass", label: "Bug Pass" },
  { id: "polish", label: "Polish" },
  { id: "final", label: "Final" },
];

export const LISTS = ["steps", "bugs", "notes"];

export function emptyDoc() {
  const pages = {};
  for (const tab of TOP_TABS) pages[tab.id] = [];
  return { version: 1, pages, phases: [], directive: { active: false, stage: "top-tabs" } };
}

export function normalizePages(list, tabId) {
  if (!Array.isArray(list)) return [];
  return list.map((p, i) => ({
    id: String(p?.id ?? tabId + "-" + (i + 1)),
    title: String(p?.title ?? "Untitled"),
    body: String(p?.body ?? ""),
  }));
}

export function normalizeDoc(input) {
  const base = emptyDoc();
  if (!input || typeof input !== "object") return base;
  const doc = { version: 1, pages: base.pages, phases: [], directive: base.directive };
  if (input.pages && typeof input.pages === "object") {
    for (const tab of TOP_TABS) doc.pages[tab.id] = normalizePages(input.pages[tab.id], tab.id);
  }
  if (Array.isArray(input.phases)) {
    doc.phases = input.phases.map((ph, i) => ({
      id: String(ph?.id ?? "phase-" + (i + 1)),
      title: String(ph?.title ?? "Phase " + (i + 1)),
      stage: STAGES.some((s) => s.id === ph?.stage) ? ph.stage : "first-draft",
      steps: normalizeItems(ph?.steps),
      bugs: normalizeItems(ph?.bugs),
      notes: normalizeItems(ph?.notes),
    }));
  }
  if (input.directive && typeof input.directive === "object") {
    doc.directive = {
      active: input.directive.active === true,
      stage: input.directive.stage === "build" ? "build" : "top-tabs",
    };
  }
  return doc;
}

export function normalizeItems(list) {
  if (!Array.isArray(list)) return [];
  return list.map((it, i) => ({
    id: String(it?.id ?? "i-" + (i + 1)),
    text: String(it?.text ?? ""),
    done: it?.done === true,
  }));
}

export function nextId(list, prefix) {
  let max = 0;
  for (const item of list || []) {
    const m = /(\d+)$/.exec(String(item?.id ?? ""));
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return prefix + "-" + (max + 1);
}

export function clone(doc) {
  return JSON.parse(JSON.stringify(doc));
}

export function findPhase(doc, phaseId) {
  return doc.phases.find((p) => p.id === phaseId) || null;
}

// Apply one operation and return a NEW document. Unknown ops return the doc unchanged.
export function applyOp(docIn, op) {
  const doc = normalizeDoc(docIn);
  if (!op || typeof op !== "object") return doc;
  const kind = String(op.op || "");
  const next = clone(doc);

  switch (kind) {
    case "addPage": {
      const tab = next.pages[op.tab] ? op.tab : "notes";
      next.pages[tab].push({
        id: nextId(next.pages[tab], tab),
        title: String(op.title || "Untitled"),
        body: String(op.body || ""),
      });
      break;
    }
    case "editPage": {
      const page = (next.pages[op.tab] || []).find((p) => p.id === op.pageId);
      if (page) {
        if (typeof op.title === "string") page.title = op.title;
        if (typeof op.body === "string") page.body = op.body;
      }
      break;
    }
    case "appendPage": {
      const page = (next.pages[op.tab] || []).find((p) => p.id === op.pageId);
      if (page && op.text) page.body = page.body ? page.body + "\n" + op.text : String(op.text);
      break;
    }
    case "movePage": {
      const list = next.pages[op.tab] || [];
      const i = list.findIndex((p) => p.id === op.pageId);
      const j = i + (op.dir === "up" ? -1 : 1);
      if (i >= 0 && j >= 0 && j < list.length) {
        const tmp = list[i];
        list[i] = list[j];
        list[j] = tmp;
      }
      break;
    }
    case "deletePage": {
      const list = next.pages[op.tab] || [];
      const i = list.findIndex((p) => p.id === op.pageId);
      if (i >= 0) list.splice(i, 1);
      break;
    }
    // ---- build-order phases (the left rail) ----
    case "addPhase": {
      next.phases.push({
        id: nextId(next.phases, "phase"),
        title: String(op.title || "New Phase"),
        stage: "first-draft",
        steps: [],
        bugs: [],
        notes: [],
      });
      break;
    }
    case "renamePhase": {
      const ph = findPhase(next, op.phaseId);
      if (ph && op.title) ph.title = String(op.title);
      break;
    }
    case "movePhase": {
      const i = next.phases.findIndex((p) => p.id === op.phaseId);
      const j = i + (op.dir === "up" ? -1 : 1);
      if (i >= 0 && j >= 0 && j < next.phases.length) {
        const tmp = next.phases[i];
        next.phases[i] = next.phases[j];
        next.phases[j] = tmp;
      }
      break;
    }
    case "deletePhase": {
      const i = next.phases.findIndex((p) => p.id === op.phaseId);
      if (i >= 0) next.phases.splice(i, 1);
      break;
    }
    case "setStage": {
      const ph = findPhase(next, op.phaseId);
      if (ph && STAGES.some((s) => s.id === op.stage)) ph.stage = op.stage;
      break;
    }
    case "cycleStage": {
      const ph = findPhase(next, op.phaseId);
      if (ph) {
        const i = STAGES.findIndex((s) => s.id === ph.stage);
        ph.stage = STAGES[(i + 1) % STAGES.length].id;
      }
      break;
    }
    // ---- checklist / bugs / notes inside a phase ----
    case "addItem": {
      const ph = findPhase(next, op.phaseId);
      const list = LISTS.includes(op.list) ? op.list : "steps";
      if (ph && op.text) ph[list].push({ id: nextId(ph[list], list), text: String(op.text), done: false });
      break;
    }
    case "editItem": {
      const ph = findPhase(next, op.phaseId);
      const list = LISTS.includes(op.list) ? op.list : "steps";
      const item = ph && ph[list].find((i) => i.id === op.itemId);
      if (item && typeof op.text === "string") item.text = op.text;
      break;
    }
    case "toggleItem": {
      const ph = findPhase(next, op.phaseId);
      const list = LISTS.includes(op.list) ? op.list : "steps";
      const item = ph && ph[list].find((i) => i.id === op.itemId);
      if (item) item.done = !item.done;
      break;
    }
    case "deleteItem": {
      const ph = findPhase(next, op.phaseId);
      const list = LISTS.includes(op.list) ? op.list : "steps";
      if (ph) {
        const i = ph[list].findIndex((it) => it.id === op.itemId);
        if (i >= 0) ph[list].splice(i, 1);
      }
      break;
    }
    // ---- the standing directive ----
    case "setDirective": {
      next.directive = {
        active: op.active === true,
        stage: op.stage === "build" ? "build" : "top-tabs",
      };
      break;
    }
    case "replaceDoc": {
      return normalizeDoc(op.doc);
    }
    default:
      return doc;
  }
  return next;
}

export function tabLabel(tabId) {
  const tab = TOP_TABS.find((t) => t.id === tabId);
  return tab ? tab.label : tabId;
}

export function stageLabel(stageId) {
  const stage = STAGES.find((s) => s.id === stageId);
  return stage ? stage.label : stageId;
}

// Whole codex as plain markdown — the "view all pages" text and the copy payload.
export function toMarkdown(docIn) {
  const doc = normalizeDoc(docIn);
  const out = ["# CODEX", ""];
  for (const tab of TOP_TABS) {
    const pages = doc.pages[tab.id] || [];
    out.push("## " + tab.label);
    if (!pages.length) out.push("_(empty)_");
    for (const page of pages) {
      out.push("### " + page.title);
      if (page.body) out.push(page.body);
    }
    out.push("");
  }
  out.push("## Build Order — Phases");
  if (!doc.phases.length) out.push("_(no phases yet)_");
  for (let i = 0; i < doc.phases.length; i++) {
    const ph = doc.phases[i];
    out.push("### " + (i + 1) + ". " + ph.title + "  [" + stageLabel(ph.stage) + "]");
    out.push(...itemLines("Checklist", ph.steps));
    out.push(...itemLines("Bugs", ph.bugs));
    out.push(...itemLines("Notes / Alterations", ph.notes));
    out.push("");
  }
  return out.join("\n");
}

export function itemLines(title, items) {
  if (!items || !items.length) return [];
  const lines = ["**" + title + "**"];
  for (const it of items) lines.push("- [" + (it.done ? "x" : " ") + "] " + it.text);
  return lines;
}

export function pageMarkdown(docIn, tabId) {
  const doc = normalizeDoc(docIn);
  const pages = doc.pages[tabId] || [];
  const out = ["## " + tabLabel(tabId)];
  for (const page of pages) {
    out.push("### " + page.title);
    if (page.body) out.push(page.body);
  }
  return out.join("\n");
}

export function phaseMarkdown(docIn, phaseId) {
  const doc = normalizeDoc(docIn);
  const ph = doc.phases.find((p) => p.id === phaseId);
  if (!ph) return "";
  const out = ["## " + ph.title + "  [" + stageLabel(ph.stage) + "]"];
  out.push(...itemLines("Checklist", ph.steps));
  out.push(...itemLines("Bugs", ph.bugs));
  out.push(...itemLines("Notes / Alterations", ph.notes));
  return out.join("\n");
}

/* ------------------------------------------------------------ the store ---
The codex is kept as many small files, not one big one: `doc-<tabId>.js` per
top tab, `doc-phases.js` for the whole build-order rail, and `codex-doc.js` as
the assembler that stitches them into one DOC. Writing a single tab rewrites a
single small file, and two edits in different tabs never touch the same text.
Paths below are folder-relative names; the caller supplies the directory
(`scripts/codex/lib` in the mod's dev folder, `mods/codex/lib` after install).
--------------------------------------------------------------------------- */

export const PAGES_FILE_PREFIX = "doc-";
export const PHASES_FILE = "doc-phases.js";
export const ASSEMBLER_FILE = "codex-doc.js";

export function pagesFileName(tabId) {
  return PAGES_FILE_PREFIX + tabId + ".js";
}

// One top tab's pages as a module body.
export function serializePages(tabId, pages) {
  const tab = TOP_TABS.find((t) => t.id === tabId);
  return (
    "// Codex — " + (tab ? tab.label : tabId) + ". " + (tab ? tab.hint : "") + "\n" +
    "// One file per top tab. Written by Savi only; the panel never writes.\n" +
    "export const PAGES = " +
    JSON.stringify(normalizePages(pages, tabId), null, 2) +
    ";\n"
  );
}

// The whole phase rail — every phase with its checklist, bugs and notes — plus
// the standing directive, in one file. The rail is read and worked top-down, so
// it is edited as a unit.
export function serializePhases(phases, directive) {
  const doc = normalizeDoc({ phases: phases, directive: directive });
  return (
    "// Codex — the build-order rail: every phase with its checklist, bug list\n" +
    "// and alteration notes, plus the standing directive. Savi writes this file.\n" +
    "export const PHASES = " +
    JSON.stringify(doc.phases, null, 2) +
    ";\n\nexport const DIRECTIVE = " +
    JSON.stringify(doc.directive, null, 2) +
    ";\n"
  );
}

// codex-doc.js: no contents of its own, just the stitch. Stable text — the
// migration writes it once and later edits never touch it again.
export function serializeAssembler() {
  const lines = [
    "// Codex — the assembler. The document is split across files: one per top",
    "// tab (doc-<tab>.js) and one for the build-order rail (doc-phases.js).",
    "// This file only stitches them together; nothing is authored here.",
    "// Edited in place — a mod update never overwrites a game's own codex.",
  ];
  for (const tab of TOP_TABS) {
    lines.push("const " + constName(tab.id) + ' = require("lib/' + pagesFileName(tab.id) + '");');
  }
  lines.push('const RAIL = require("lib/' + PHASES_FILE + '");');
  lines.push("");
  lines.push("export const DOC = {");
  lines.push("  version: 1,");
  lines.push("  pages: {");
  for (const tab of TOP_TABS) {
    lines.push('    "' + tab.id + '": ' + constName(tab.id) + ".PAGES,");
  }
  lines.push("  },");
  lines.push("  phases: RAIL.PHASES,");
  lines.push("  directive: RAIL.DIRECTIVE,");
  lines.push("};");
  return lines.join("\n") + "\n";
}

export function constName(tabId) {
  return String(tabId).toUpperCase().replace(/[^A-Z0-9]/g, "_");
}

// Every file the store is made of: { "<dir>/<name>.js": source }. Write them
// all and the codex is whole — this is also the migration from the old
// single-file store (read its DOC, hand it here, write what comes back).
export function splitStore(docIn, dir) {
  const doc = normalizeDoc(docIn);
  const base = String(dir || "scripts/codex/lib").replace(/\/+$/, "");
  const files = {};
  for (const tab of TOP_TABS) {
    files[base + "/" + pagesFileName(tab.id)] = serializePages(tab.id, doc.pages[tab.id]);
  }
  files[base + "/" + PHASES_FILE] = serializePhases(doc.phases, doc.directive);
  files[base + "/" + ASSEMBLER_FILE] = serializeAssembler();
  return files;
}

// True when codex-doc.js is still the OLD single-file store (a literal DOC with
// no requires) and wants migrating. Feed it the file's source text.
export function isLegacyStore(source) {
  const text = String(source || "");
  return /export\s+const\s+DOC\s*=\s*\{/.test(text) && text.indexOf(PAGES_FILE_PREFIX) === -1;
}

// Legacy single-file form. Kept only so an old store can be read and migrated.
export function serializeDoc(doc) {
  return (
    "// Codex contents for this game (legacy single-file store).\n" +
    "export const DOC = " +
    JSON.stringify(normalizeDoc(doc), null, 2) +
    ";\n"
  );
}
