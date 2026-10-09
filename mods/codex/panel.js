// Codex — the creator's window into Savi's design document. READ ONLY by
// design: only Savi writes the codex (she edits the lib/doc-*.js store files;
// lib/codex-doc.js just stitches them into one DOC).
// The panel exists so the creator can read it, catch mistakes early, and copy
// the text out. Mount path (real DOM) so the window drags, resizes, and scales.
const OPS = require("lib/codex-ops.js");
const STORE = require("lib/codex-doc.js");

// The UI realm's browser globals, reached through globalThis so the module
// itself never depends on a name the worker sandbox doesn't define.
const G = globalThis;

const LS_KEY = "codex.layout.v1";
// What the creator has already laid eyes on: { entryKey: fingerprint }. Lives in
// the UI realm's localStorage, never in the doc — reading must not touch the spec.
const SEEN_KEY = "codex.seen.v1";
const INK = {
  bg: "rgba(12,14,20,0.96)",
  panel: "rgba(20,24,33,0.96)",
  line: "#2b3242",
  text: "#e6e9f0",
  dim: "#8d97ab",
  gold: "#e0b357",
  green: "#5fbf7f",
  red: "#d2694f",
  fresh: "#7fd0ff",
  freshWash: "rgba(127,208,255,0.10)",
};

const STAGE_TINT = {
  "first-draft": "#8d97ab",
  "second-draft": "#6f9fd8",
  "bug-pass": "#d2694f",
  polish: "#e0b357",
  final: "#5fbf7f",
};

let state = null;

export function onMount(container) {
  container.style.pointerEvents = "none";
  container.innerHTML = "";

  const doc = OPS.normalizeDoc(STORE.DOC);
  state = {
    doc: doc,
    view: "tab",
    tab: "overview",
    phaseId: null,
    showBugs: true,
    layout: loadLayout(),
    marks: fingerprints(doc),
    seen: {},
    fresh: {},
    els: { dots: {} },
  };
  primeFreshness();

  const win = el("div", {
    position: "fixed",
    left: state.layout.x + "px",
    top: state.layout.y + "px",
    width: state.layout.w + "px",
    height: state.layout.h + "px",
    background: INK.bg,
    border: "1px solid " + INK.line,
    borderRadius: "2px",
    boxShadow: "0 18px 50px rgba(0,0,0,0.55)",
    color: INK.text,
    font: state.layout.font + "px/1.45 ui-sans-serif, system-ui, sans-serif",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    pointerEvents: "auto",
    zIndex: "40",
  });
  state.els.win = win;
  container.appendChild(win);

  win.appendChild(buildTitleBar());
  win.appendChild(buildTabStrip());

  const body = el("div", { display: "flex", flex: "1", minHeight: "0" });
  state.els.rail = el("div", {
    width: "148px",
    flex: "0 0 148px",
    borderRight: "1px solid " + INK.line,
    background: "rgba(0,0,0,0.25)",
    overflowY: "auto",
    padding: "6px",
  });
  state.els.content = el("div", { flex: "1", minWidth: "0", overflowY: "auto", padding: "10px 12px" });
  body.appendChild(state.els.rail);
  body.appendChild(state.els.content);
  win.appendChild(body);

  win.appendChild(buildResizeGrip());
  installWheelGuard(win);
  render();
}

export function onDestroy(container) {
  // Closing the tab counts as having read what was on screen.
  if (state) markViewRead();
  if (container) container.innerHTML = "";
  state = null;
}

/* ---------------------------------------------------------------- plumbing */

export function el(tag, styles, text) {
  const node = G.document.createElement(tag);
  if (styles) Object.assign(node.style, styles);
  if (text !== undefined) node.textContent = text;
  return node;
}

export function btn(label, onClick, styles) {
  const b = el("button", Object.assign(
    {
      minHeight: "34px",
      padding: "6px 10px",
      background: "rgba(255,255,255,0.06)",
      border: "1px solid " + INK.line,
      borderRadius: "2px",
      color: INK.text,
      font: "inherit",
      cursor: "pointer",
      touchAction: "manipulation",
    },
    styles || {}
  ), label);
  b.addEventListener("click", (e) => {
    e.stopPropagation();
    onClick(e);
  });
  return b;
}

export function viewport() {
  const w = Number(G.innerWidth) || 1024;
  const h = Number(G.innerHeight) || 720;
  return { w, h };
}

// Keep the window inside the screen it's opening on — a saved layout from a
// wider seat must not park the resize grip off the bottom of a tablet.
export function fitToScreen(layout) {
  const view = viewport();
  const out = Object.assign({}, layout);
  out.w = Math.min(out.w, Math.max(300, view.w - 24));
  out.h = Math.min(out.h, Math.max(220, view.h - 24));
  out.x = Math.max(0, Math.min(out.x, view.w - out.w - 8));
  out.y = Math.max(0, Math.min(out.y, view.h - out.h - 8));
  return out;
}

export function loadLayout() {
  const view = viewport();
  const fallback = fitToScreen({
    x: 40,
    y: 76,
    w: Math.min(820, view.w - 60),
    h: Math.min(560, view.h - 110),
    font: 13,
  });
  try {
    const raw = G.localStorage.getItem(LS_KEY);
    if (!raw) return fallback;
    const saved = JSON.parse(raw);
    return fitToScreen({
      x: clampNum(saved.x, 0, 4000, fallback.x),
      y: clampNum(saved.y, 0, 4000, fallback.y),
      w: clampNum(saved.w, 320, 3000, fallback.w),
      h: clampNum(saved.h, 240, 2400, fallback.h),
      font: clampNum(saved.font, 9, 28, fallback.font),
    });
  } catch (err) {
    return fallback;
  }
}

export function clampNum(v, lo, hi, fallback) {
  const n = Number(v);
  if (!isFinite(n)) return fallback;
  return Math.min(hi, Math.max(lo, n));
}

export function saveLayout() {
  try {
    G.localStorage.setItem(LS_KEY, JSON.stringify(state.layout));
  } catch (err) {
    /* private mode — layout just won't persist */
  }
}

/* ------------------------------------------------------------ wheel guard */

// With the pointer over the codex, the wheel belongs to the codex — not to the
// god-mode camera zoom. The engine's realm frame decides that by target: anything
// inside a data-input-capture="ignore" subtree is reported as a UI hit, and the
// host drops the pass instead of feeding the camera channel. Marking the window
// covers wheel, and presses too (dragging the panel no longer pokes the world).
// Native scrolling stays untouched — no preventDefault anywhere.
export function installWheelGuard(win) {
  try {
    win.dataset.inputCapture = "ignore";
  } catch (err) {
    win.setAttribute("data-input-capture", "ignore");
  }
  win.addEventListener("wheel", (e) => {
    e.stopPropagation();
  });
}

/* ------------------------------------------------------- what's new marks */

// A stable fingerprint per entry, so an edited line reads as new the same way a
// written one does. Deterministic — no clock, no randomness.
export function hashText(text) {
  let h = 5381;
  const s = String(text);
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

export function itemKey(kind, ownerId, itemId) {
  return kind + ":" + ownerId + ":" + itemId;
}

export function fingerprints(doc) {
  const map = {};
  for (const tab of OPS.TOP_TABS) {
    const pages = doc.pages[tab.id] || [];
    for (const page of pages) {
      map[itemKey("p", tab.id, page.id)] = hashText((page.title || "") + "\u0000" + (page.body || ""));
    }
  }
  for (const phase of doc.phases) {
    map["h:" + phase.id] = hashText((phase.title || "") + "\u0000" + (phase.stage || ""));
    for (const list of OPS.LISTS) {
      for (const item of phase[list] || []) {
        map[itemKey(list.charAt(0), phase.id, item.id)] = hashText((item.text || "") + "\u0000" + (item.done ? "1" : "0"));
      }
    }
  }
  return map;
}

export function loadSeen() {
  try {
    const raw = G.localStorage.getItem(SEEN_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch (err) {
    return null;
  }
}

export function saveSeen() {
  try {
    G.localStorage.setItem(SEEN_KEY, JSON.stringify(state.seen));
  } catch (err) {
    /* private mode — marks just won't persist */
  }
}

// First time this seat ever opens the codex, everything is baseline: a wall of
// "new" on a document he has never read says nothing. After that, only drift.
export function primeFreshness() {
  const saved = loadSeen();
  if (!saved) {
    state.seen = Object.assign({}, state.marks);
    state.fresh = {};
    saveSeen();
    return;
  }
  const seen = {};
  const fresh = {};
  for (const key in state.marks) {
    if (saved[key] === state.marks[key]) seen[key] = saved[key];
    else fresh[key] = state.marks[key];
  }
  state.seen = seen;
  state.fresh = fresh;
  saveSeen();
}

export function isFresh(key) {
  return state.fresh[key] !== undefined;
}

export function freshCount() {
  return Object.keys(state.fresh).length;
}

export function tabHasFresh(tabId) {
  for (const page of state.doc.pages[tabId] || []) {
    if (isFresh(itemKey("p", tabId, page.id))) return true;
  }
  return false;
}

export function phaseHasFresh(phase) {
  if (isFresh("h:" + phase.id)) return true;
  for (const list of OPS.LISTS) {
    for (const item of phase[list] || []) {
      if (isFresh(itemKey(list.charAt(0), phase.id, item.id))) return true;
    }
  }
  return false;
}

// Keys the creator can actually see right now — hidden bugs/notes don't count.
export function visibleKeys() {
  const keys = [];
  if (state.view === "phase") {
    const phase = state.doc.phases.find((p) => p.id === state.phaseId);
    if (!phase) return keys;
    keys.push("h:" + phase.id);
    const lists = state.showBugs ? OPS.LISTS : ["steps"];
    for (const list of lists) {
      for (const item of phase[list] || []) keys.push(itemKey(list.charAt(0), phase.id, item.id));
    }
    return keys;
  }
  for (const page of state.doc.pages[state.tab] || []) keys.push(itemKey("p", state.tab, page.id));
  return keys;
}

// Called on the way OUT of a view, so the glow survives the whole time he reads.
export function markViewRead() {
  let changed = false;
  for (const key of visibleKeys()) {
    if (!isFresh(key)) continue;
    state.seen[key] = state.marks[key];
    delete state.fresh[key];
    changed = true;
  }
  if (changed) saveSeen();
  return changed;
}

export function markAllRead() {
  state.seen = Object.assign({}, state.marks);
  state.fresh = {};
  saveSeen();
  render();
}

export function freshDot(styles) {
  return el("span", Object.assign({
    display: "inline-block",
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    background: INK.fresh,
    boxShadow: "0 0 6px " + INK.fresh,
    marginLeft: "6px",
    verticalAlign: "middle",
  }, styles || {}));
}

/* ------------------------------------------------------------- title bar */

export function buildTitleBar() {
  const bar = el("div", {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "6px 8px",
    borderBottom: "1px solid " + INK.line,
    background: "rgba(0,0,0,0.35)",
    cursor: "move",
    touchAction: "none",
    flexWrap: "wrap",
  });
  const title = el("div", { fontWeight: "700", letterSpacing: "0.14em", color: INK.gold, padding: "0 4px" }, "CODEX");
  bar.appendChild(title);
  state.els.crumb = el("div", { color: INK.dim, flex: "1", minWidth: "60px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }, "");
  bar.appendChild(state.els.crumb);

  state.els.freshChip = btn("", markAllRead, {
    borderColor: INK.fresh,
    color: INK.fresh,
    background: INK.freshWash,
    display: "none",
  });
  state.els.freshChip.title = "Mark everything read";
  bar.appendChild(state.els.freshChip);

  bar.appendChild(btn("A-", () => setFont(state.layout.font - 1), { minWidth: "38px" }));
  bar.appendChild(btn("A+", () => setFont(state.layout.font + 1), { minWidth: "38px" }));
  bar.appendChild(btn("Copy visible", copyVisible));
  bar.appendChild(btn("All pages", openAllPages, { borderColor: INK.gold, color: INK.gold }));

  let drag = null;
  bar.addEventListener("pointerdown", (e) => {
    if (e.target !== bar && e.target !== title && e.target !== state.els.crumb) return;
    drag = { px: e.clientX, py: e.clientY, x: state.layout.x, y: state.layout.y };
    bar.setPointerCapture(e.pointerId);
  });
  bar.addEventListener("pointermove", (e) => {
    if (!drag) return;
    state.layout.x = Math.max(0, drag.x + (e.clientX - drag.px));
    state.layout.y = Math.max(0, drag.y + (e.clientY - drag.py));
    state.els.win.style.left = state.layout.x + "px";
    state.els.win.style.top = state.layout.y + "px";
  });
  const stop = () => {
    if (drag) {
      drag = null;
      saveLayout();
    }
  };
  bar.addEventListener("pointerup", stop);
  bar.addEventListener("pointercancel", stop);
  return bar;
}

export function setFont(size) {
  state.layout.font = clampNum(size, 9, 28, 13);
  state.els.win.style.font = state.layout.font + "px/1.45 ui-sans-serif, system-ui, sans-serif";
  saveLayout();
}

export function buildResizeGrip() {
  const grip = el("div", {
    position: "absolute",
    right: "0",
    bottom: "0",
    width: "30px",
    height: "30px",
    cursor: "nwse-resize",
    touchAction: "none",
    background: "linear-gradient(135deg, transparent 45%, " + INK.line + " 45%, " + INK.line + " 55%, transparent 55%)",
  });
  let rz = null;
  grip.addEventListener("pointerdown", (e) => {
    rz = { px: e.clientX, py: e.clientY, w: state.layout.w, h: state.layout.h };
    grip.setPointerCapture(e.pointerId);
    e.stopPropagation();
  });
  grip.addEventListener("pointermove", (e) => {
    if (!rz) return;
    state.layout.w = clampNum(rz.w + (e.clientX - rz.px), 320, 3000, state.layout.w);
    state.layout.h = clampNum(rz.h + (e.clientY - rz.py), 240, 2400, state.layout.h);
    state.els.win.style.width = state.layout.w + "px";
    state.els.win.style.height = state.layout.h + "px";
  });
  const stop = () => {
    if (rz) {
      rz = null;
      saveLayout();
    }
  };
  grip.addEventListener("pointerup", stop);
  grip.addEventListener("pointercancel", stop);
  return grip;
}

/* -------------------------------------------------------------- tab strip */

export function buildTabStrip() {
  const strip = el("div", {
    display: "flex",
    gap: "4px",
    padding: "6px",
    borderBottom: "1px solid " + INK.line,
    overflowX: "auto",
    whiteSpace: "nowrap",
    background: "rgba(0,0,0,0.18)",
  });
  state.els.strip = strip;
  for (const tab of OPS.TOP_TABS) {
    const chip = btn(tab.label, () => {
      if (state.view === "tab" && state.tab === tab.id) return;
      markViewRead();
      state.view = "tab";
      state.tab = tab.id;
      render();
    }, { flex: "0 0 auto", padding: "6px 9px" });
    chip.dataset.tab = tab.id;
    const dot = freshDot();
    dot.style.display = "none";
    chip.appendChild(dot);
    state.els.dots[tab.id] = dot;
    strip.appendChild(chip);
  }
  return strip;
}

/* ----------------------------------------------------------------- render */

export function render() {
  const count = freshCount();
  const chipEl = state.els.freshChip;
  if (chipEl) {
    chipEl.style.display = count ? "" : "none";
    chipEl.textContent = count + " new";
  }
  for (const chip of state.els.strip.children) {
    const tabId = chip.dataset.tab;
    const active = state.view === "tab" && tabId === state.tab;
    chip.style.background = active ? "rgba(224,179,87,0.18)" : "rgba(255,255,255,0.06)";
    chip.style.borderColor = active ? INK.gold : INK.line;
    chip.style.color = active ? INK.gold : INK.text;
    const dot = state.els.dots[tabId];
    if (dot) dot.style.display = tabHasFresh(tabId) ? "inline-block" : "none";
  }
  renderRail();
  renderContent();
}

export function renderRail() {
  const rail = state.els.rail;
  rail.innerHTML = "";
  rail.appendChild(el("div", { color: INK.dim, letterSpacing: "0.1em", fontSize: "0.85em", padding: "2px 4px 6px" }, "BUILD ORDER"));

  if (!state.doc.phases.length) {
    rail.appendChild(el("div", { color: INK.dim, fontSize: "0.9em", padding: "4px" }, "No phases yet."));
    return;
  }

  state.doc.phases.forEach((phase, i) => {
    const active = state.view === "phase" && state.phaseId === phase.id;
    const row = el("div", {
      border: "1px solid " + (active ? INK.gold : INK.line),
      background: active ? "rgba(224,179,87,0.14)" : "rgba(255,255,255,0.04)",
      borderRadius: "2px",
      padding: "6px",
      marginBottom: "5px",
      cursor: "pointer",
      minHeight: "44px",
    });
    const done = phase.steps.filter((s) => s.done).length;
    const title = el("div", { fontWeight: "600", color: active ? INK.gold : INK.text }, i + 1 + ". " + phase.title);
    if (phaseHasFresh(phase)) title.appendChild(freshDot());
    row.appendChild(title);
    row.appendChild(el("div", { color: STAGE_TINT[phase.stage] || INK.dim, fontSize: "0.85em" }, OPS.stageLabel(phase.stage)));
    row.appendChild(el("div", { color: INK.dim, fontSize: "0.85em" },
      done + "/" + phase.steps.length + " done" + (phase.bugs.length ? "  •  " + phase.bugs.filter((b) => !b.done).length + " bugs" : "")));
    row.addEventListener("click", () => {
      if (state.view === "phase" && state.phaseId === phase.id) return;
      markViewRead();
      state.view = "phase";
      state.phaseId = phase.id;
      render();
    });
    rail.appendChild(row);
  });
}

export function renderContent() {
  const pane = state.els.content;
  pane.innerHTML = "";
  if (state.view === "phase") renderPhase(pane);
  else renderTab(pane);
}

export function renderTab(pane) {
  const tab = OPS.TOP_TABS.find((t) => t.id === state.tab) || OPS.TOP_TABS[0];
  state.els.crumb.textContent = tab.label;

  const head = el("div", { display: "flex", alignItems: "baseline", gap: "8px", marginBottom: "8px", flexWrap: "wrap" });
  head.appendChild(el("div", { fontWeight: "700", fontSize: "1.15em", color: INK.gold }, tab.label));
  head.appendChild(el("div", { color: INK.dim, flex: "1", minWidth: "120px", fontSize: "0.9em" }, tab.hint));
  pane.appendChild(head);

  const pages = state.doc.pages[tab.id] || [];
  if (!pages.length) {
    pane.appendChild(el("div", { color: INK.dim, padding: "18px 0" }, "Savi hasn't written this tab yet."));
    return;
  }
  for (const page of pages) pane.appendChild(pageCard(page, isFresh(itemKey("p", tab.id, page.id))));
}

export function pageCard(page, fresh) {
  const card = el("div", {
    border: "1px solid " + (fresh ? INK.fresh : INK.line),
    borderLeft: (fresh ? "3px solid " + INK.fresh : "1px solid " + INK.line),
    background: fresh ? INK.freshWash : INK.panel,
    borderRadius: "2px",
    padding: "8px 10px",
    marginBottom: "8px",
  });
  const head = el("div", { fontWeight: "700", marginBottom: "3px" }, page.title);
  if (fresh) {
    head.appendChild(el("span", {
      color: INK.fresh,
      fontSize: "0.75em",
      letterSpacing: "0.12em",
      marginLeft: "8px",
      verticalAlign: "middle",
    }, "NEW"));
  }
  card.appendChild(head);
  card.appendChild(el("div", { whiteSpace: "pre-wrap", color: page.body ? INK.text : INK.dim },
    page.body || "(no text yet)"));
  return card;
}

/* ------------------------------------------------------------ phase pages */

export function renderPhase(pane) {
  const phase = state.doc.phases.find((p) => p.id === state.phaseId);
  if (!phase) {
    state.view = "tab";
    renderTab(pane);
    return;
  }
  const index = state.doc.phases.indexOf(phase);
  state.els.crumb.textContent = "Build Order › " + phase.title;

  const head = el("div", { display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap", marginBottom: "8px" });
  head.appendChild(el("div", { fontWeight: "700", fontSize: "1.15em", color: INK.gold, flex: "1", minWidth: "120px" },
    index + 1 + ". " + phase.title));
  head.appendChild(el("div", {
    border: "1px solid " + (STAGE_TINT[phase.stage] || INK.line),
    color: STAGE_TINT[phase.stage] || INK.text,
    borderRadius: "2px",
    padding: "3px 8px",
    fontSize: "0.9em",
  }, OPS.stageLabel(phase.stage)));
  head.appendChild(btn(state.showBugs ? "Hide bugs & notes" : "Bugs & notes", () => {
    state.showBugs = !state.showBugs;
    render();
  }));
  pane.appendChild(head);

  pane.appendChild(listSection(phase, "steps", "Checklist", INK.green));
  if (state.showBugs) {
    pane.appendChild(listSection(phase, "bugs", "Bugs", INK.red));
    pane.appendChild(listSection(phase, "notes", "Notes & Alterations", INK.gold));
  }
}

export function listSection(phase, list, label, tint) {
  const box = el("div", {
    border: "1px solid " + INK.line,
    background: INK.panel,
    borderRadius: "2px",
    padding: "8px 10px",
    marginBottom: "8px",
  });
  box.appendChild(el("div", { fontWeight: "700", color: tint, marginBottom: "6px" }, label));

  const items = phase[list] || [];
  if (!items.length) box.appendChild(el("div", { color: INK.dim }, "Nothing filed."));
  for (const item of items) {
    const fresh = isFresh(itemKey(list.charAt(0), phase.id, item.id));
    const row = el("div", {
      display: "flex",
      gap: "8px",
      alignItems: "flex-start",
      padding: "2px 0 2px 5px",
      borderLeft: fresh ? "3px solid " + INK.fresh : "3px solid transparent",
      background: fresh ? INK.freshWash : "transparent",
    });
    row.appendChild(el("div", {
      width: "18px",
      flex: "0 0 18px",
      color: item.done ? tint : fresh ? INK.fresh : INK.dim,
      fontWeight: "700",
    }, item.done ? "✓" : "•"));
    row.appendChild(el("div", {
      flex: "1",
      whiteSpace: "pre-wrap",
      color: item.done ? INK.dim : INK.text,
      textDecoration: item.done ? "line-through" : "none",
    }, item.text));
    box.appendChild(row);
  }
  return box;
}

/* ----------------------------------------------------------- copy & sheets */

export function copyVisible() {
  const text = state.els.content.innerText || "";
  selectNode(state.els.content);
  writeClipboard(text);
}

export function selectNode(node) {
  try {
    const range = G.document.createRange();
    range.selectNodeContents(node);
    const sel = G.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  } catch (err) {
    /* selection is a nicety */
  }
}

export function writeClipboard(text) {
  try {
    G.navigator.clipboard.writeText(text);
    flash("Copied");
  } catch (err) {
    flash("Select and copy by hand");
  }
}

export function flash(message) {
  const note = el("div", {
    position: "absolute",
    right: "12px",
    top: "8px",
    background: "rgba(224,179,87,0.9)",
    color: "#141821",
    padding: "4px 8px",
    borderRadius: "2px",
    fontWeight: "700",
    zIndex: "60",
  }, message);
  state.els.win.appendChild(note);
  G.setTimeout(() => note.remove(), 1400);
}

export function openAllPages() {
  const text = OPS.toMarkdown(state.doc);
  openSheet("Every page", (body, footer) => {
    const area = el("textarea", {
      width: "100%",
      flex: "1",
      minHeight: "200px",
      background: "#0b0d13",
      color: INK.text,
      border: "1px solid " + INK.line,
      borderRadius: "2px",
      font: "inherit",
      padding: "8px",
      whiteSpace: "pre",
    });
    area.value = text;
    area.readOnly = true;
    body.appendChild(area);
    footer.appendChild(btn("Select all", () => {
      area.focus();
      area.select();
    }));
    footer.appendChild(btn("Copy all", () => {
      area.focus();
      area.select();
      writeClipboard(text);
    }, { borderColor: INK.gold, color: INK.gold }));
  });
}

export function openSheet(title, fill) {
  const veil = el("div", {
    position: "absolute",
    inset: "0",
    background: "rgba(5,7,11,0.86)",
    display: "flex",
    flexDirection: "column",
    padding: "10px",
    gap: "8px",
    zIndex: "50",
  });
  const head = el("div", { display: "flex", alignItems: "center", gap: "8px" });
  head.appendChild(el("div", { fontWeight: "700", color: INK.gold, flex: "1" }, title));
  const close = () => veil.remove();
  head.appendChild(btn("Close", close));
  veil.appendChild(head);

  const body = el("div", { display: "flex", flexDirection: "column", flex: "1", minHeight: "0" });
  const footer = el("div", { display: "flex", gap: "6px", justifyContent: "flex-end" });
  veil.appendChild(body);
  veil.appendChild(footer);
  fill(body, footer, close);
  state.els.win.appendChild(veil);
}
