---
name: Main Menu 3d 2d
description: Gavi's menu skill — the whole opening sequence as one thing (boot → intro → menu → play), the live menu that stands INSIDE the game world on a closed camera drift, the seamless handoff into gameplay (camera move, not a cut), and the returning player who skips the intro. Built on the engine's real UI surface: scripts/ui.js exports default (localPlayer, world) returning an HTML string, buttons reach behaviors through sendAction, and EVERY action must also exist in inputs.actions — undeclared, the click still lands on the arrival tick but has no key/touch binding and no clean default on any other tick, and the engine writes a ui.handler fault about it. Includes the flat 2D panel as the honest cheap option, diegetic buttons, pause, api.sql save slots and the intro-seen flag, and the residency gate. The intro stage itself belongs to gavi#intro-cinematica.
---

# The main menu

The first screen is the only one **every** player sees. It is part of the game, not its waiting room.

Law 0 — **the menu is playable before it is beautiful.** If pressing PLAY doesn't get you anywhere
inside 1 second, nothing else on this page matters.

## pick your path in ten seconds

| the situation | do this |
| --- | --- |
| the button works on the press and dies on every other tick | the action isn't in `inputs.actions` — Law 2. this is the #1 cause, and `getLogs()` says so |
| the button does nothing and the action IS declared | `sendAction` lands on the CONTROL TARGET's `onInput` (the player), not on your manager — Law 3 |
| the click doesn't even register | missing `data-interactive` on the element |
| `onclick="window.myHelper()"` | dead button: the helper lives in the worker, the click in the realm. inline `sendAction` only |
| the cursor blinks forever on the menu | your `data-modal` root has no stable `id` — every re-render reads as a new screen |
| the world is grey behind a fancy 3D menu | flat 2D now, come back later. a 3D menu advertises whatever is behind it |
| PLAY works but drops her into a half-loaded world | gate it on `api.getWorldResidency()`, read on HER client — Law 7 |
| the PLAY button is under the platform rail | the right edge at mid-height (50×340) is the platform's. stay ~150 px clear |
| the menu is cut off on a phone | scroll root + `min-h-full` wrapper; must fit 360×640 — Law 5 |
| "Continue" needs to know a save exists | `api.sql` on the manager (host-seat only), answer into player state — Law 8 |
| the menu sits on a flat colour and the game HAS a world | put the world behind it: a closed camera drift, real hour, real sound — Law 9. costs no new art |
| the cut to gameplay is a black screen | in one place you need no cut at all: walk the camera to the gameplay pose — Law 10 |
| the menu lives in another place than the game | then you can't hide the swap with a camera move — fade 0.25 s out / 0.35 s in, fade BEFORE `enterPlace` — Law 10 |
| the background jumps once a loop | you integrated position with `+=`; compute the pose from a wrapped phase — Law 9 |
| the view jerks the first time she moves the mouse after PLAY | the rig is still `orientation.source: 'script'` — flip it to `'look'` when control arrives — Law 10 |
| the intro plays again on every single launch | nothing remembers her: the flag belongs in `api.sql`, not in state — Law 12 |
| pause doesn't stop the world in multiplayer | it can't. pause is a screen on top; design for that — Law 11 |

---

## the opening sequence is ONE thing — four stages, three seams

Nobody experiences a menu. They experience **boot → intro → menu → play**, in one unbroken strip, and
they judge the whole strip by its worst seam. Two skills own the strip and they share one number file.

| stage | what she sees | who owns it | how long |
| --- | --- | --- | --- |
| **boot** | the shell, then the first real frame — never a fake progress bar | the engine; you only gate on `api.getWorldResidency()` — Law 7 | however long streaming takes |
| **intro** | the cinematic: staged in-engine shots, or a conjured clip on the UI plane | **`gavi#intro-cinematica`** | 8-20 s, skip visible from frame 1 |
| **menu** | the world itself drifting behind the title, at an hour you chose, sound already playing | this file — Laws 1-9 | until she presses something |
| **handoff** | the camera walking from the title pose to the gameplay pose, UI fading off it | this file — Law 10 | 0.8-1.4 s |
| **play** | control | the player behavior | — |

One law governs all three seams:

> **two stages meet on a shared pose, never on a cut.** The intro's last frame and the menu's first
> frame are the same camera in the same spot. The menu's last frame and the first playable frame are
> the same camera in the same spot. A cut between them is the cheapest-looking thing a game can do,
> and avoiding it costs nothing but agreeing on numbers.

So the pose is a **file**, not a number typed into two scripts that will drift apart:

```json
// scripts/lib/data/abertura.json — read by BOTH the intro camera and the menu camera
{
  "eye":  { "x": 6, "y": 4.2, "z": 14 },
  "look": { "x": 0, "y": 2.4, "z": -2 },
  "hour": 18.2,
  "loopSeconds": 30,
  "driftSpeed": 0.25,
  "handoffSeconds": 1.1
}
```

`require('lib/data/abertura.json')` in both scripts. The intro's final shot lands on `eye`/`look`; the
menu drift starts there at phase 0. Change the viewpoint once and both stages follow.

`gavi#intro-cinematica` owns everything **inside** the intro stage — shot grammar, the timeline, the
conjured-video path, the skip. This file owns everything from the menu's first frame onward. Read both
before you build either; a great intro handing over to a menu that cuts to black wasted the intro.

---

## Law 1 — choose the family before you draw

| family | what it is | when | cost |
| --- | --- | --- | --- |
| **flat 2D** — *the cheap option* | a full-screen panel in `scripts/ui.js` over a colour, image or video | a 2D game, a phone game, a jam build shipping tonight, or a game whose world isn't built yet | dirt cheap |
| **live 3D** | the game's own scene running behind it, camera drifting, buttons on top | a 3D game with a world worth showing — the default once the world exists (Law 9) | medium |
| **diegetic 3D** | the buttons ARE objects (a sign, a door, a lever) you walk up to | a game with a strong sense of place: horror, adventure, sandbox | expensive, and worth it |
| **hybrid** | live 3D inside a `<spawn-canvas>` cut into drawn chrome | arcade cabinet, old TV, cockpit | medium |

**Flat 2D is the cheap option, not the wrong one.** It is exactly right when there is no world to show
yet or the build ships tonight — a clean panel over a flat colour beats a live 3D menu advertising an
empty grey box, because a 3D menu advertises whatever is actually behind it. The day the world exists,
move to Law 9; the HTML doesn't change, only what's behind it.

`<spawn-canvas>` is a **hole, not an image**: anything painted over its rect covers the game, so the
backdrop comes from the slot's own outer box-shadow (`box-shadow: 0 0 0 200vmax #000`). One per screen.

## Law 2 — THE LAW: every UI action must exist in `inputs.actions`

> A `sendAction('play')` whose `play` is not declared in `inputs.actions` is a **half-connected**
> button. Measured against engine source, not folklore (`:869-872`,
> `:127-133`): actions ride the wire UNFILTERED by design, so the click DOES
> dispatch and `input.actions.play` reads true on the arrival tick. Declaring it buys everything
> else — a clean `false` on every non-arrival tick, key and touch bindings, and mod-name scoping
> inside a prefixed panel. Undeclared, it works on the press and lies on every other tick, which is
> worse than dead: it works often enough to fool you.
>
> And it is NOT silent. The engine writes a `ui.handler` fault naming the missing declaration
> (`:918`) — `getLogs()` has the answer. An earlier draft of this file said "no
> error anywhere"; census 52562152 falsified that. **Axes** are the ones genuinely dropped: the
> server sanitizer allowlists declared axes and discards the rest.

UI-only actions are declared as **empty objects** — no key, no mouse binding:

```js
// run_script, or in the same pass that ships ui.js — patch inputs ALONGSIDE the UI that sends them
api.patchInputs({
  actions: {
    'menu-play': {}, 'menu-continue': {}, 'menu-options': {}, 'menu-howto': {},
    'menu-back': { keys: ['Escape'] },      // Esc is real input AND a UI action: both work
    'menu-slot': {},                        // carries a payload: { slot: 2 }
  },
});
```

`mouse: 'left'` belongs to gameplay clicks in the 3D world, never to a UI action.

## Law 3 — where a click actually lands

`sendAction` is delivered to the **control target's** `onInput` — normally the player's behavior. A
plain invisible manager entity never receives `onInput` (that hook only fires on a player or a
controlled entity), so the chain is four links and every one is required:

```
ui.js button (data-interactive, inline sendAction)
   → inputs.actions has the name           ← Law 2, or it stops here silently
   → the PLAYER's onInput reads input.actions['menu-play']
   → api.emit('menu:play', { player: api.id })   → the manager's api.on decides
```

```js
// scripts/player.js — the four lines that make every menu button reach the manager
const MENU = { 'menu-play': 'menu:play', 'menu-continue': 'menu:continue',
               'menu-options': 'menu:options', 'menu-back': 'menu:back', 'menu-slot': 'menu:slot' };

export function onInput(input, api) {
  for (const action of Object.keys(MENU)) {
    if (!input.actions[action]) continue;
    api.emit(MENU[action], { player: api.id, ...(input.actionData?.[action] ?? {}) });
  }
  // ...the rest of the movement behavior
}
```

That emit is forwarded upstream and sequenced by the server, so a server-realm manager hears it. (Only
a `realm: 'client'` object's emits are dropped — one warning in `getLogs`.)

## Law 4 — the five items, in this order

1. **Continue** — first and highlighted whenever a save exists
2. **New game**
3. **Options** (sound, sensitivity, quality)
4. **Credits** or **How to play**
5. **Quit** — only when it means something; in a browser game it almost never does

A sixth item is a symptom that two of them are the same thing. Merge them.

## Law 5 — the shape of the screen

- The first button is the biggest thing after the title: **≥ 44 px** tall, **12 px** between buttons.
- The whole menu fits **360×640** with no scrolling. Whatever didn't fit doesn't exist — the UI layer
  clips at the viewport, so a stranded PLAY button is unreachable, not just ugly.
- Fit-or-scroll: `overflow-y-auto` + `pointer-events-auto` on the screen root, `min-h-full` (never
  `h-full`) on the centred wrapper. Short content centres, tall content scrolls.
- Pad the bottom with the real inset: `padding-bottom: max(1.5rem, var(--spawn-safe-area-bottom, 0px))`.
- The right edge at mid-height is the platform's rail (**50×340**, every platform, desktop included).
  Keep buttons ~150 px clear of that band.

```js
// scripts/ui.js — one default export, (localPlayer, world) → HTML string. No objectApi here.
export default function (localPlayer, world) {
  const menu = world.getObjectState('mestre-menu') ?? {};       // world is a read-only ObjectAPI
  if (menu.screen === 'playing' || menu.screen === 'intro') return '';   // gameplay HUD and the intro
  //   live elsewhere; 'menu' | 'options' | 'handoff' all render this root — Law 10 fades it on handoff

  const save = localPlayer.state.saveSlot ?? null;              // written by the manager, per player
  const ready = localPlayer.state.worldReady === true;          // residency, read on HER client
  const fade = menu.fade ?? 0;

  return `
    <div id="menu-root" data-modal
         class="fixed inset-0 overflow-y-auto pointer-events-auto bg-[oklch(0.18_0.05_300)] text-white">
      <div class="min-h-full flex flex-col items-center justify-center gap-3 p-6"
           style="padding-bottom: max(1.5rem, var(--spawn-safe-area-bottom, 0px));">
        <h1 class="text-5xl tracking-widest mb-6">BONE RABBIT</h1>
        ${save ? btn('menu-continue', `CONTINUE — ${save.place} lv ${save.level}`, true, ready) : ''}
        ${btn('menu-play', 'NEW GAME', !save, ready)}
        ${btn('menu-options', 'OPTIONS', false, true)}
        ${btn('menu-howto', 'HOW TO PLAY', false, true)}
        ${ready ? '' : `<div class="text-sm opacity-60">loading the world…</div>`}
      </div>
      <div id="menu-fade" class="fixed inset-0 bg-black transition-opacity duration-300 pointer-events-none"
           style="opacity:${fade}"></div>
    </div>`;
}

function btn(action, label, primary, enabled) {
  return `<button data-interactive ${enabled ? '' : 'disabled'}
     onclick="sendAction('${action}', {})"
     class="h-11 w-64 rounded-xl text-lg ${enabled ? '' : 'opacity-40'} ${primary
       ? 'bg-[oklch(0.75_0.18_60)] text-black'
       : 'bg-white/10 hover:bg-white/20'}">${label}</button>`;
}
```

Four things that kill this file:

- **a helper called from `onclick`** — `onclick="window.myHelper()"` is dead: the render ran in a
  worker, the click happens in the sandboxed UI realm. Write `sendAction` inline.
- **`<script>` tags** — never executed (the HTML is inserted via `innerHTML` + DOM diffing).
  `<style>` tags do work.
- **`try/catch` around the render** — the engine already reports a `ui.render` fault and keeps the last
  valid screen. Swallowing it gives you a screen that lies forever.
- **no stable `id` on anything that moves** — the diff matches nodes by `id` only. No id means matched
  by position and repainted in place: transitions silently die.

`data-modal` marks a surface that **owns the screen** (menu, pause, options): appearing frees the
cursor, removal re-locks it. It goes on the visible root, with a stable `id`. Ambient HUD panels carry
nothing — their buttons are already clickable under mouse-look.

## Law 6 — a manager owns the state, the UI only reads

```js
// scripts/mestre-menu.js — spawn it as { id: 'mestre-menu', realm: 'server',
//   tags: ['menu-manager'],            // the camera script reads this by TAG — it has no getObjectState
//   behavior: ['scripts/mestre-menu.js'], properties: { visible: false, physics: 'none' } }
export function onSpawn(api) {
  api.patchState({ screen: 'menu', fade: 0 });
  api.sql`CREATE TABLE IF NOT EXISTS saves (user_id TEXT PRIMARY KEY, place TEXT, level INTEGER, updated_at INTEGER)`;

  api.on('menu:play', (p, a) => start(a, p.player, 'main', 'default'));
  api.on('menu:continue', (p, a) => {
    const slot = a.getObjectState(p.player)?.saveSlot;
    start(a, p.player, slot?.place ?? 'main', slot ? 'last' : 'default');
  });
  api.on('menu:options', (_p, a) => a.patchState({ screen: 'options' }));
  api.on('menu:back', (_p, a) => a.patchState({ screen: 'menu' }));
}

// the flat-2D handoff: a black fade because there is nothing behind the panel to walk into.
// A live-3D menu replaces this whole function with Law 10's version — camera move, no black.
function start(api, playerId, placeId, spawnPoint) {
  if (api.getState().screen !== 'menu') return;        // double-click guard: one handoff only
  api.patchState({ screen: 'loading', fade: 1 });      // the fade panel paints over 0.3 s
  api.runInSeconds(0.3, () => {                        // never setTimeout
    api.enterPlace(playerId, { placeId, spawnPoint });
    api.patchState({ screen: 'playing', fade: 0 });
  });
}
```

| thing | lives in |
| --- | --- |
| which screen is open | the manager's state |
| whether a save exists | the manager reads `api.sql`, writes the answer into the PLAYER's state |
| volume, sensitivity, invert-Y | the player's state (per person, never global) |
| HTML, classes, layout | `scripts/ui.js`, nowhere else |
| what a click does | the manager's `api.on` handlers |

## Law 7 — PLAY only lights up when the world is really there

`api.getWorldResidency()` is the renderer's own verdict — `{ resident, pending }` — not a guessed timer.
It answers **for the machine running the script**, and on the server it is always `resident: true`. So
read it on the player (her own client) and mirror it into her state for `ui.js`:

```js
// scripts/pronto-para-jogar.js — attached to the player. Per-client, cheap, O(1) counters.
export const updateSchedule = { every: 3 };            // ~10 Hz: a button lighting up needs no more

export function update(dt, api) {
  const { resident } = api.getWorldResidency();
  if (resident === api.getState().worldReady) return;   // write only on the flip
  api.patchState({ worldReady: resident });
}
```

A PLAY button that hands off during streaming is the worst first impression in the game: she arrives in
a grey box and calls it broken.

## Law 8 — save slots: the manager asks the database

`api.sql` is **host-seat only** — in multiplayer a player-context script must not call it — and it
answers a **Promise** (`{ rows, changes, lastInsertRowid }`). So the manager queries and writes the
answer into the asking player's state; the UI reads `localPlayer.state`:

```js
// in the manager: called from api.on('menu:slots', …) or when a player connects
function loadSlot(api, playerId) {
  const userId = api.getProfile(playerId)?.userId;      // real for every player in server context
  if (!userId) return;                                  // guests without an account: no durable slot
  api.sql`SELECT place, level, updated_at FROM saves WHERE user_id = ${userId}`
    .then((r) => api.patchObjectState(playerId, { saveSlot: r.rows[0] ?? null }));
}

function saveSlot(api, playerId, place, level) {
  const userId = api.getProfile(playerId)?.userId;
  if (!userId) return;
  const stamp = api.getWallClockTimestamp();             // sandbox: Date.now does not exist here
  api.sql`INSERT INTO saves (user_id, place, level, updated_at) VALUES (${userId}, ${place}, ${level}, ${stamp})
          ON CONFLICT(user_id) DO UPDATE SET place = excluded.place, level = excluded.level`;
}
```

Interpolations bind as parameters, one call is one atomic transaction, and the continuation lands on a
later tick — so never make the render wait on it: paint "CONTINUE" only once `saveSlot` exists in state,
and key rows on `api.userId` (the durable account id), never on the per-session entity id. Deeper
persistence patterns: `gavi#arquitetura-avancada`.

## Law 9 — the menu stands IN the world (the live background)

The strongest menu this engine can make isn't drawn — it is **the game, already running, with a title
over it.** She is inside the world before she has pressed anything, and it costs **no new art**: the
place, the light, the weather and the sound are the ones you already built. A static image would be
more work and less true.

Four ingredients, no more:

| ingredient | the number | why |
| --- | --- | --- |
| a viewpoint chosen by hand | `eye` / `look` from `abertura.json`, never the player's spawn | a spawn point looks like a spawn point |
| a **closed** drift | **0.15-0.4 m/s**, one loop in **20-40 s**, ending exactly where it began | under 0.15 reads as a frozen frame; over 0.4 reads as a camera move and she waits for it to finish before clicking |
| one chosen hour | a `timeOfDay` you picked, not wherever the day cycle happens to be | the first frame is the screenshot people post |
| life already moving | fire, a flag, weather, the ambience loop the place already runs | a still world reads as a paused game |

The radius is **derived**, not taste — that's what makes the loop close:

```
perimeter = driftSpeed × loopSeconds        r = driftSpeed × loopSeconds / 2π
0.25 m/s over 30 s  →  r ≈ 1.19 m           a 2.4 m sway: alive, and the framing you chose stays the framing
```

And it only closes if you compute the pose from a **wrapped phase**. Integrating position
(`pos.x += v * dt`) accumulates float error and never lands home — that's the once-a-loop jump.

```js
// scripts/camera-jogo.js — ONE camera script, three modes. A rig SWAP is a hard cut with no blend
// (gavi#intro-cinematica lands on the same rule), so the menu, the handoff and gameplay are modes
// inside one script and the seam cannot exist. Install once:
//   api.addBehavior('camera', 'scripts/camera-jogo.js');
//   api.patchCamera({ kind: 'custom', pointerLock: false,
//                     orientation: { source: 'script' },        // authored yaw/pitch displays exactly
//                     state: { mode: 'menu', phase: 0, t: 0 } });
const A = require('lib/data/abertura.json');
const { clamp, lerp } = require('builtin/math');
const { easeInOutCubic } = require('builtin/easing');

const R = (A.driftSpeed * A.loopSeconds) / (2 * Math.PI);   // ≈1.19 m — derived, never typed

function poseMenu(phase) {
  const a = phase * Math.PI * 2;                            // phase wraps 0→1: exact seam, forever
  return {
    pos: { x: A.eye.x + Math.cos(a) * R, y: A.eye.y + Math.sin(a) * R * 0.3, z: A.eye.z + Math.sin(a) * R },
    look: A.look,                                           // the y wobble adds ~4% arc — round driftSpeed down if you count
  };
}

// The gameplay pose. ONE function, used by the handoff's last frame AND every playing frame —
// that is the whole seam law, expressed as code that cannot disagree with itself.
function posePlay(api) {
  const t = api.getControlTarget();
  if (!t) return poseMenu(0);                               // no target yet: hold the title pose
  const s = t.scale?.y ?? 1;
  const yaw = api.getViewAngles()?.yaw ?? (t.yaw * Math.PI) / 180;
  const dist = 6 * s, high = 1.7 * s;
  return {
    pos: { x: t.feetPosition.x + Math.sin(yaw) * dist, y: t.feetPosition.y + high, z: t.feetPosition.z + Math.cos(yaw) * dist },
    look: { x: t.feetPosition.x, y: t.feetPosition.y + high * 0.8, z: t.feetPosition.z },
  };
}

export function update(dt, api) {
  // the camera API has no getObjectState — a camera reads shared state by TAG, and can never emit.
  const screen = api.query({ tags: ['menu-manager'] })[0]?.state?.screen ?? 'playing';
  const want = screen === 'menu' || screen === 'options' ? 'menu' : screen === 'handoff' ? 'handoff' : 'play';
  const s = api.getState();

  if (want !== s.mode) {
    const from = s.mode === 'menu' ? poseMenu(s.phase ?? 0) : posePlay(api);
    api.patchState({ mode: want, t: 0, from });              // patchState, NEVER replaceState — it wipes yaw/pitch
  }

  const st = api.getState();
  let pose;
  if (st.mode === 'menu') {
    const phase = ((st.phase ?? 0) + dt / A.loopSeconds) % 1;
    api.patchState({ phase });
    pose = poseMenu(phase);
  } else if (st.mode === 'handoff') {
    const t = clamp((st.t ?? 0) + dt / A.handoffSeconds, 0, 1);
    api.patchState({ t });
    const k = easeInOutCubic(t), a = st.from ?? poseMenu(0), b = posePlay(api);
    pose = {
      pos: { x: lerp(a.pos.x, b.pos.x, k), y: lerp(a.pos.y, b.pos.y, k), z: lerp(a.pos.z, b.pos.z, k) },
      look: { x: lerp(a.look.x, b.look.x, k), y: lerp(a.look.y, b.look.y, k), z: lerp(a.look.z, b.look.z, k) },
    };
  } else {
    pose = posePlay(api);
  }
  api.setProperty('feetPosition', pose.pos);                 // camera setProperty knows feetPosition and rotation only
  api.lookAt(pose.look);
}
```

At **30 Hz** (`api.seconds(1)` → 30, `dt` ≈ 0.033) every duration above is seconds accumulated from
`dt`, never a frame count — a loop written as "900 frames" is 15 s on a 60 Hz machine and wrong here.

A wide slow orbit is the same law with a longer arm: `r = 22`, `0.9 °/s` ≈ 0.35 m/s, seam at 360° —
400 s away, which is fine because it still closes exactly. Use it when the landmark is big (a castle, a
canyon); use the small drift when the interesting thing is close.

**The hour and the weather** — client-side, per player, and it clears itself at the handoff:

```js
// in the PLAYER's behavior (it runs on her own machine, which is where atmosphere layers live)
export function onSpawn(api) {
  const layer = api.pushAtmosphere(
    { timeOfDay: A.hour, clouds: { enabled: true, density: 0.5 }, wind: { speed: 3 } },
    { fade: 0, player: api.id },                 // bind the player: this push is driven by replicated state
  );
  api.patchState({ atmoLayer: layer });          // api.clearAtmosphere(layer) at arrival; a duration-less
}                                                // layer also clears itself on her next place transition
```

Heavier weather (rain, snow, ash) is an fx program — `api.spawnFx(pos, 'scripts/effects/rain.fx.js')`;
the fx skill owns the authoring, don't invent params here.

**The sound is already playing.** The place's own `audio:` loops are running because the place is loaded
— that ambience IS your menu bed, free. On top of it, one track:

```js
api.preloadAsset('cdn/moodboard-lowpoly-cozy/music-instrumental-menu-theme.mp3');
api.music.play('cdn/moodboard-lowpoly-cozy/music-instrumental-menu-theme.mp3', { volume: 0.35, fadeMs: 1500 });
```

`api.music` is **one global jukebox** served to every player, present and joining — in a multiplayer
game a "menu track" plays for people already in the fight. There, let the world's ambience be the bed
and save `music.play` for the handoff. `<audio>` in HTML punches through her volume slider: forbidden.

## Law 10 — pressing PLAY is a move, not a cut

The menu camera walks to the gameplay pose over **0.8-1.4 s** while the UI fades over **200-300 ms**,
and **control arrives when the camera stops** — not on the click, or she fights a camera that is still
travelling. One clock owns it, and it lives on the manager:

```js
// scripts/mestre-menu.js — replaces the old start(): the fade is the UI leaving, not a black screen
const A = require('lib/data/abertura.json');

function start(api, playerId, placeId, spawnPoint) {
  const s = api.getState();
  if (s.screen !== 'menu' && s.screen !== 'options') return;   // one handoff only, double-click safe
  api.patchState({ screen: 'handoff', uiFade: 1 });            // ui.js reads this and fades over 0.25 s
  api.patchObjectState(playerId, { canMove: false });          // input belongs to the UI until arrival
  api.music.play('cdn/moodboard-lowpoly-cozy/music-instrumental-exploration.mp3', { fadeMs: 1200 });

  api.runInSeconds(A.handoffSeconds, () => {                   // never setTimeout
    if (placeId && placeId !== api.getEntityPlace(playerId)) {
      api.enterPlace(playerId, { placeId, spawnPoint });        // only when the menu lives elsewhere
    }
    api.patchState({ screen: 'playing', uiFade: 0 });
    api.patchObjectState(playerId, { canMove: true });          // control, exactly when the camera stops
  });
}
```

```js
// scripts/player.js — two additions. the feet stay still, then the view goes back to the mouse.
export function onInput(input, api) {
  if (api.getState().canMove === false) return;      // menu + handoff: the UI is reading, not the feet
  // ...the rest of the movement behavior
}

export function update(dt, api) {
  const s = api.getState();
  if (s.canMove && !s.lookArmed) {                    // the exact tick control arrives
    api.setCamera({ pointerLock: true, orientation: { source: 'look' } });
    api.clearAtmosphere(s.atmoLayer);                 // the menu hour lets go of the sky
    api.patchState({ lookArmed: true });
  }
}
```

Why the orientation flip matters both ways: `source: 'script'` during menu and handoff means the engine
displays your authored framing **exactly** and never integrates mouse movement over it — so a player
swirling the mouse during the walk-in can't spoil the shot. Flipping to `'look'` at arrival hands the
view over from **the displayed angle**, draining pending deltas, so there is no snap and no double-count.
Leave it on `'script'` and her first mouse move jerks; never declare it and an undeclared rig that reads
look axes gets its authored pose overwritten every tick.

Two cases, and only one of them needs black:

| case | the transition | why |
| --- | --- | --- |
| **menu and gameplay in the same place** (Law 9) | the camera move IS the whole transition. no fade, no `enterPlace`, no loading | nothing has to stream — the world is already resident and drifting |
| **menu in its own place** (a diorama, a lobby) | fade a black panel to `opacity: 1` over **0.25 s**, `enterPlace`, back to 0 over **0.35 s** | a place swap streams; a camera move cannot hide that, so hide it honestly |
| **the door opens** | a diegetic animation, the swap (if any) in the middle of it | horror, adventure |
| **a conjured clip covers the seam** | `<video>` on the UI plane, skip visible from frame 1 | a campaign opening — `gavi#intro-cinematica` owns the grammar and the cook-time trap |

In the cross-place case the fade starts **before** `enterPlace`, never after, or she watches the
teleport. Sound crossfades either way — one short focus sound, one confirm, and no error sound: nobody
makes a mistake in a menu.

On the UI side the fade is the panel leaving, not a curtain arriving. Same stable `id`, and **drop
`data-modal` on the handoff frame** so the cursor re-locks:

```js
// scripts/ui.js — the handoff frame: same id, no data-modal, the panel fading off the live world
const leaving = menu.screen === 'handoff';
if (menu.screen === 'playing') return '';                       // gameplay HUD lives elsewhere
return `
  <div id="menu-root" ${leaving ? '' : 'data-modal'}
       class="fixed inset-0 ${leaving ? 'pointer-events-none' : 'overflow-y-auto pointer-events-auto'}
              transition-opacity duration-300 text-white"
       style="opacity:${leaving ? 0 : 1}">
    <!-- no background colour on a live-3D menu: the world IS the background -->
    …the title and the buttons…
  </div>`;
```

The PLAY button carries the gesture that pointer lock needs — `sendAction('menu-play', {}, { relockPointer: true })`
— so lock is granted by the click, not requested 1.1 s later by a script. If a browser still refuses,
her first click in the world takes it: never a dead state.

**Diegetic menus** need a keyboard way in. Someone will arrive not knowing they can click:

```js
// scripts/placa-menu.js — on a sign tagged 'menu-item', with the interact action bound (keys: ['e'])
export function onSpawn(api) {
  api.setProperty('material.emissive', 'oklch(0.45 0.10 60)');
  api.interactPrompt(api.id, 'Press E to begin');       // the permanent line that saves the stranger
}

export function onInteract(other, api) {
  api.setProperty('material.emissive', 'oklch(0.85 0.22 60)');
  api.playSound('cdn/sfx-menu-confirm.mp3', { position: api.getProperty('feetPosition') });
  api.emit('menu:play', { player: other.id });          // same handler as the 2D button
}
```

## Law 11 — pause is the same menu with fewer lines

Continue, Options, Quit to menu. Two laws of its own:

- Pause does **not** stop the world in multiplayer. It is a screen on top and the game keeps running —
  design knowing that (no "pause to think" puzzles in a shared place).
- `data-modal` on the pause root frees the cursor; removing it re-locks. Don't hand-roll that. Closing
  straight back into mouse-look: `sendAction('menu-back', undefined, { relockPointer: true })` — the
  click itself counts as the browser gesture pointer lock requires.

## Law 12 — the second launch is a different game

A great intro is great **once**. The eleventh time it is a toll booth, and it teaches her to mash the
skip before your title even fades in.

| launch | what happens | who decides |
| --- | --- | --- |
| the first, ever | intro plays, then the menu | the manager, from `api.sql` |
| every one after | straight to the menu, drifting, sound already up | the same row |
| she asks for it | OPTIONS → WATCH INTRO replays it in full | `menu-intro`, one more action |

That memory cannot live in entity state (a fresh entity every join) or in the spec. It lives in
**`api.sql`** on the manager — host-seat only, keyed on `userId`, the durable account id:

```js
// scripts/mestre-menu.js — in onSpawn, alongside the saves table
api.sql`CREATE TABLE IF NOT EXISTS intro_seen (user_id TEXT PRIMARY KEY, first_seen INTEGER)`;

// the player's own behavior announces itself: onSpawn → api.emit('menu:hello', { player: api.id })
api.on('menu:hello', (p, a) => {
  const userId = a.getProfile(p.player)?.userId;                 // real for every player in server context
  if (!userId) return a.patchState({ screen: 'menu' });          // guest, no durable row: skip the intro
  a.sql`SELECT first_seen FROM intro_seen WHERE user_id = ${userId}`.then((r) => {
    a.patchState({ screen: r.rows.length ? 'menu' : 'intro' });  // the answer lands a tick or two later
  });
});

api.on('intro:done', (p, a) => {                                 // gavi#intro-cinematica emits this
  const userId = a.getProfile(p.player)?.userId;
  if (userId) {
    a.sql`INSERT INTO intro_seen (user_id, first_seen) VALUES (${userId}, ${a.getWallClockTimestamp()})
          ON CONFLICT(user_id) DO NOTHING`;                      // sandbox: no Date.now here
  }
  a.patchState({ screen: 'menu' });                              // the intro's last pose IS the menu's first
});

api.on('menu:intro', (_p, a) => a.patchState({ screen: 'intro' }));   // the replay, from OPTIONS
```

Three things this gets right: `screen: 'intro'` starts as the **default** while the query is in flight
only if you want the intro on an unknown player — for a returning-player-friendly game start the manager
on `'menu'` and let the row promote it, so a slow database never inflicts an intro on someone who has
already seen it. `ON CONFLICT DO NOTHING` keeps `first_seen` truthful. And the replay path means you
never have to choose between respecting her time and showing off the intro.

What plays during `screen: 'intro'` — the shots, the timing, the skip, the conjured-clip route — is
`gavi#intro-cinematica`. This file just owns the flag and the frame it hands back on.

## before saying the menu is done

- Open the game, press the first button **without touching the mouse path twice**: it goes into the game.
- Every action the HTML sends exists in `inputs.actions` — read the list out loud against the buttons.
- `read_authored_ui` on the menu root: the receipts show `sent`/`applied`, and your selector matches.
- The whole thing fits 360×640, buttons ≥ 44 px, nothing inside the right-edge rail band.
- `validate_spec` clean and `getLogs()` with no `ui.render` fault.
- One capture of the first screen (the composited player frame — `view_player_screen` — is what carries
  the UI; a 3D-only camera shot never shows it).
- A sensor planted: `api.notifyDmOnce('menu-stall', 'someone sat on the menu 30 s and clicked nothing')`.
  A menu that strands people is the most expensive bug in the game and the quietest. The full
  boot→first-input sweep is `gavi#testar-tudo`.

Three more once the opening sequence is one thing:

- **Both seams, frame by frame.** The intro's last frame and the menu's first: the camera has not moved.
  The menu's last frame and the first playable frame: the camera has not moved. A burst capture across
  each seam settles it in one look.
- **Watch one whole drift loop** (20-40 s) without blinking at the wrap — no jump, no lurch. If there is
  one, you integrated position instead of wrapping a phase.
- **Launch twice.** Second launch: no intro, the menu is already drifting, and OPTIONS still offers
  WATCH INTRO. Then move the mouse the instant control lands — no jerk.

## when it breaks — the tells

| tell (what you'd actually see) | cause | fix |
| --- | --- | --- |
| the button fires once and then behaves at random | the action is missing from `inputs.actions`; `getLogs()` carries a `ui.handler` fault naming it | declare it as `{}` — Law 2 |
| the action is declared, still nothing happens | you put `onInput` on the invisible manager; it never fires there | player's `onInput` → `emit` → manager's `api.on` — Law 3 |
| the click doesn't register at all | no `data-interactive` on the element | add it to every clickable |
| the cursor blinks / flickers on the menu | `data-modal` root recreated each render (no stable `id`) | one stable `id` on the visible root |
| the PLAY button is off-screen on a phone | `h-full` + `justify-center` stranded it above the fold | scroll root + `min-h-full` wrapper, 360×640 test |
| PLAY works and drops her in a grey world | handoff before streaming finished | gate on `getWorldResidency()` read on her own client — Law 7 |
| "Continue" appears for a player with no save | the render awaited nothing and guessed | paint it only when `localPlayer.state.saveSlot` exists — Law 8 |
| the background lurches once every loop | position integrated with `+=`, so it never lands home | compute the pose from a phase that wraps 0→1 — Law 9 |
| the camera snaps at the end of the walk-in | the handoff's target pose isn't what the play branch computes | one `posePlay()` used by both branches — Law 10 |
| her first mouse move after PLAY jerks the view | the rig is still `orientation.source: 'script'` | flip to `'look'` when control arrives; the engine continues from the displayed angle — Law 10 |
| she can walk while the camera is still travelling | control was granted on the click, not on arrival | `canMove: false` until the `runInSeconds(handoffSeconds)` callback — Law 10 |
| the intro plays on every launch | the flag was kept in state, which dies with the entity | `api.sql` keyed on `userId` — Law 12 |
| a returning player still gets the intro for a second | the manager starts on `screen: 'intro'` and the query demotes it late | start on `'menu'`, let the row promote — Law 12 |