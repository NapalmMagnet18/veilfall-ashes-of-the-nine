---
name: cinema
description: Toggle the Absolute Cinema director panel — wires UI imports if needed
requiresArgs: true
argsPlaceholder: <args>
---

---
description: Open the Absolute Cinema director panel
---

The user wants to open or set up the Absolute Cinema director panel.

## Step 1 — Check if routing exists

Read the project's `scripts/ui.js`. Look for whether it already imports and renders both the cinema UI module and the cinema overlays module. The pattern is:

### Cinema panel (director UI)
1. `const renderCinemaPanel = require('mods/absolute-cinema/lib/ui-cinema.js');` — this is a **default export** (the function itself), NOT a named export
2. A conditional block: `${localPlayer.state.cinemaOpen ? renderCinemaPanel(localPlayer, world) : ''}`

### Cinema overlays (fade, color wash, text, skip indicator)
1. `const { renderCinemaOverlays } = require('mods/absolute-cinema/lib/ui-cinema-overlays.js');` — this is a **named export**
2. An unconditional call in the return: `${renderCinemaOverlays(localPlayer)}`

If ALL routing exists, skip to Step 3.

## Step 2 — Add missing routing to ui.js

For each missing piece:

**Cinema panel** (if missing):
1. Add `const renderCinemaPanel = require('mods/absolute-cinema/lib/ui-cinema.js');` near the top imports. This is a **default export** — do NOT destructure it.
2. Add a conditional render: `${localPlayer.state.cinemaOpen ? renderCinemaPanel(localPlayer, world) : ''}`

**Cinema overlays** (if missing):
1. Add `const { renderCinemaOverlays } = require('mods/absolute-cinema/lib/ui-cinema-overlays.js');` near the top imports. This is a **named export**.
2. Add an unconditional render in the return: `${renderCinemaOverlays(localPlayer)}`

The overlays should render unconditionally — the module handles showing/hiding internally based on player state.

Use str_replace_editor to make minimal edits — don't rewrite the whole file.

## Step 3 — Check camera yield guard

Load the `cinema-camera-yield` skill. Check if the project's camera behavior script has the yield + re-seed guard. If not, add it following the skill's pattern.

## Step 4 — Toggle the panel

Use run_script to patch the player's state: toggle `cinemaOpen` to true (or false if already true).

```js
const p = getPlayer();
const s = p.state || {};
api.patchObjectState(p.id, { cinemaOpen: !(s.cinemaOpen ?? false) });
```

Tell the user the panel should now be visible. If you added routing in Step 2, mention what you wired in.

$ARGUMENTS