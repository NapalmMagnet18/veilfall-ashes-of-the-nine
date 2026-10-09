---
name: Aaa Ui
description: AAA UI chrome — one token stylesheet, module-per-screen layout, transform/opacity-only animation, portraits drawn from game data, panels that respect the platform rail.
---

# AAA UI — interface with a spine

The difference between a hobby HUD and an AAA one is a design system, even a tiny one: one
stylesheet of tokens, screens as modules, motion on compositor-only properties.

## Architecture

- `scripts/ui.js` **only positions and routes** (which screen, where on the page). Drawing
  lives in modules: `lib/ui-theme.js` (ONE `<style id="...">` block — tokens + keyframes),
  `lib/ui-menu.js`, `lib/ui-hud.js`, `lib/ui-inventory.js`. Each module renders content, never
  page placement.
- The modules read a **narrow state contract** (e.g. `started`, `inv`, `hotbar`, `slot`,
  `invOpen`) — list it in a comment at the top of ui.js. UI that reads everything breaks on
  every refactor.
- Tokens first: 2 fonts max, a 4-6 color palette as CSS variables, one border-radius, one
  shadow. Every panel drinks from the same cup — that sameness IS the AAA read.

## Motion

- Animate **transform and opacity only** — they composite; width/left/margin re-layout and
  stutter on weak machines.
- Everything that appears, arrives: panels scale 0.96→1 + fade over 120-180ms; selection
  changes get a 80ms pulse. Nothing pops into existence.
- Hover/active states on everything clickable — `data-interactive` + a visible response.

## Portraits from data, not art

A character card can DRAW its portrait from the same data that builds the body (side
projection: u = −pos.z, v = pos.y, z-order by pos.x, one shared px/meter scale so relative
sizes stay honest). New character = one data row, zero art files, and the card can never drift
from the in-game body.

## Panels that behave

- Reserve the right edge (~74-84px) for the platform rail — nothing interactive under it.
- Every window scrolls **inside itself** (`max-height` in vh) and the root scrolls too; test at
  a real resolution before shipping.
- Opening a mouse-driven panel releases pointer lock (`showCursor()`); closing relocks
  (`sendAction(..., { relockPointer: true })`). While a panel is open, gameplay hold-actions
  (dig, fire) must early-return — one guard line in the behavior, else the held button keeps
  acting through the UI.

## State-merge trap (engine law worth tattooing)

`patchState` **deep-merges**: `delete inv[id]` does NOT remove the key — the old value returns
in the merge. Write `inv[id] = 0` and treat 0 as "gone" in the UI. Verified live: a deleted
stack came back at its old count; a zeroed one stayed gone.