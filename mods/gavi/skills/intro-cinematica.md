---
name: Intro Cinematica
description: Gavi's opening skill — how to start a game the way a film starts, in two lanes. Lane A is the in-engine cinematic: a shot list as data, one camera rig walking it with real engine calls (setCamera with orientation source "script", lookAt, setProperty feetPosition, builtin/easing), a skip that works on the first press, and the seam law that makes the last cinematic frame the first playable frame. Lane B is the conjured .mp4 played on the UI plane with the game-ui video grammar. Length law 8-20 s, shot grammar with speeds in m/s, sound landing ON the picture, and the honest trade table for when a video beats the engine.
---

# The opening

A game's first ten seconds are the only ten seconds everyone plays. And an intro is **not a video** —
the best ones are the game itself, staged: the same terrain, the same hour, the same lights, moved
through by a camera that knows where it is going.

Law 0 — **an intro is a shot list with a deadline.** If the player does not have the controls by
second 20, the rest of this page is an apology.

## which lane, in ten seconds

| the ask sounds like | lane | go to |
| --- | --- | --- |
| "make it open like a movie" / "a cinematic opening" | **A** — in-engine | §3 shot grammar, §5 rig |
| "show the world before you drop me in it" | **A** | §3, §4 seam |
| "the camera should come down and then I'm playing" | **A** — this is the seam, the whole point | §4, §5 |
| "put a cutscene at the start" | **A** unless the shot cannot be staged in-engine | §8 trade table first |
| "an animated prologue / a memory / a hand-drawn opening" | **B** — conjured .mp4 on the UI plane | §8, §8's snippet |
| "a face talking to me in close-up" | **B** | §8 |
| "a trailer-grade opening I can post" | **B** | §8 |
| "logo, then title, then game" | **A** for the title (UI plane) + optional B splash | §7 |
| "it plays every time I reload and I hate it" | either | §2 second viewing |
| "skip doesn't work" | either | §2, §9 rows 2-3 |
| "the camera lands and the world jumps" | **A** | §4 — the seam is broken, measure it |
| "the intro title looks blurry" | either | §7 — it is baked in 3D, move it to UI |
| "the music comes in late" | either | §6 |
| menus, PLAY button, the handoff out of a menu | not here | `gavi#menu-principal-3d-2d` |
| switching rigs, cutscene cameras in the middle of play | not here | the engine's `camera-transitions` skill |

**Lane A is the default, and it is not a preference.** No download and no first-frame wait. No hard cut
into gameplay, because the last frame of the cinematic *is* the first frame of play. The world in the
shot is the world you are about to touch — every tree, the real hour, the real weather. And changing it
costs a number in a JSON file, not a re-mint that cooks for minutes and then keeps its look forever.

This room ticks at **30 Hz** (`api.seconds(1)` = 30 ticks, `dt` ≈ 0.033 s). Write every duration in
**seconds** and accumulate `dt`. Never count ticks, and never size a fade against 60.

---

## 2 — the length law

| thing | number | why |
| --- | --- | --- |
| total, cold open to controls | **8-20 s**, aim 11-13 | past 20 s you are paying retention for a shot nobody asked for |
| shortest usable opening | **8 s** (4 + 2 + 2) | under 8 s it reads as a transition, not an opening — which is fine, just call it that |
| skip prompt visible by | **second 2.0** | earlier looks apologetic, later looks trapped |
| skip *works* from | **second 0.0** | the prompt is late, the key never is |
| skip glide to the end pose | **0.3 s** | see §5 — a skip that teleports is worse than no skip |
| replay of an intro already seen | **0 s** — straight to the menu | §2 second viewing |

An intro that cannot be skipped is **a bug**, not a directorial choice. First press, every press,
keyboard and thumb:

```js
// one declaration, two doors. an action the UI sends AND the keyboard fires — both legal on one name.
api.patchInputs({
  actions: {
    'intro-skip': { keys: ['space', 'Escape', 'enter'], touch: { button: true, label: 'SKIP' } },
  },
});
```

That declaration is load-bearing, and here is the exact reason — the loose version of this claim is
wrong and gets debugged for an hour. A `sendAction('intro-skip')` from a `data-interactive` button
DOES reach `onInput` on the tick it arrives, declared or not: actions ride the wire unfiltered by
design (`:869-872`). What the declaration buys is the rest of it —
a clean `false` on every other tick, and, the part this stage actually depends on, **the keyboard
binding**. The skip here is a KEY, and a key only exists if `inputs.actions` says so. Undeclared, the
button half-works and the key never fires at all — and the engine writes a `ui.handler` fault naming
the missing declaration (`:918`), so `getLogs()` tells you before the HTML does.
See `gavi#menu-principal-3d-2d` Law 2.

### second viewing

Nobody watches an opening twice by choice. Remember that it played and go straight to the menu, with a
way back to it (a **"watch the opening"** row under Options, and `/intro` while you build).

```js
// scripts/mestre-intro.js — a server-side manager. api.sql is HOST-SEAT ONLY: never from the player.
export function onSpawn(api) {
  api.sql`CREATE TABLE IF NOT EXISTS intro_seen (user_id TEXT PRIMARY KEY, seen_at INTEGER)`;
  api.on('intro:ask',    (p, a) => answer(a, p.player));
  api.on('intro:done',   (p, a) => remember(a, p.player));
  api.on('intro:replay', (p, a) => a.patchObjectState(p.player, { introSeen: false }));
}

function answer(api, playerId) {
  const userId = api.getProfile(playerId)?.userId;                       // real for every player, server side
  if (!userId) return api.patchObjectState(playerId, { introSeen: false }); // guest: show it once
  api.sql`SELECT seen_at FROM intro_seen WHERE user_id = ${userId}`
    .then((r) => api.patchObjectState(playerId, { introSeen: r.rows.length > 0 }));
}

function remember(api, playerId) {
  const userId = api.getProfile(playerId)?.userId;
  if (!userId) return;
  api.sql`INSERT INTO intro_seen (user_id, seen_at) VALUES (${userId}, ${api.getWallClockTimestamp()})
          ON CONFLICT(user_id) DO UPDATE SET seen_at = excluded.seen_at`;
}
```

The answer lands on a later tick, so the owner script waits for it — bounded, never forever (§5). And
while you are building, `api.getRoomMode() === 'dev'` skips it by default: you are about to reload this
world forty times today.

---

## 3 — shot grammar

Three shots open almost any game. This is the part that transfers whole from film, and from video
models like ByteDance's Seedance 2.0 — which is genuinely good at shot grammar, multi-shot pacing and
camera language (that is what the model does; it is not what runs here). Steal the grammar, keep the
engine.

| shot | seconds | move | what it is for |
| --- | --- | --- | --- |
| **ESTABLISH** | 3.0-5.0 | crane down, or slow push | the world's **scale** and its **hour**. one landmark, not a panorama of nothing |
| **SUBJECT** | 3.0-4.0 | push in, or orbit | the thing you will **be**, or the thing you will **fight**. closer, readable, alive |
| **HANDOFF** | 2.0-4.0 | arrive and **stop** | the camera lands exactly where gameplay begins (§4) |

### the moves, with speeds

A camera move too fast reads as a mistake. Too slow reads as broken. Both cost the same.

| move | speed | duration | notes |
| --- | --- | --- | --- |
| **push in** | 1.2-2.5 m/s at 8-20 m from the subject | 2.5-4.0 s | the workhorse. under 1.0 m/s it reads as a drift |
| **pull back** | 1.5-3.0 m/s | 2.0-3.0 s | reveals scale; ends wide, so it needs somewhere to end |
| **crane down** | 2.5-4.5 m/s from 25-60 m up | 3.0-5.0 s | the establish move. constant speed reads like a crane |
| **orbit** | 6-12 °/s | 3.0-5.0 s | above 15 °/s it becomes a spin and the eye stops reading the object |
| **whip** | 90-180 °/s | 0.25-0.40 s | a hit, not a shot. one per intro, or none |
| **hold** | 0 | 0.8-1.5 s | only where the frame has something moving in it (fire, a flag, a walk cycle) |

The honest test: **the subject should cross roughly 1/8 to 1/3 of the frame per second.** More than a
third and it reads as an accident; less than a twentieth and the player thinks the game froze. That is
angular, so a 3.9 m/s crane at 55 m and a 1.7 m/s push at 9 m can look like the same speed on screen.

### the cut law

- **Cut on motion.** The outgoing shot is still moving at the cut. Cutting away from a settled frame
  reads as an edit; cutting away from a moving one reads as a story.
- **No shot under 1.2 s** unless it is a deliberate hit (a whip, a title slam). Two 0.8 s shots are not
  pace, they are confusion.
- **A cut must be decisive.** New distance, new angle — at least ~25° of angle change, or half/double
  the subject distance. A 2 m jump on the same axis is not a cut, it is a glitch.
- **One cut in a three-shot opening**, between ESTABLISH and SUBJECT. SUBJECT → HANDOFF runs continuous.
- **Continuous joins must match speed** within ~1.5×, or the eye sees a gear change.
- **The landing is not a cut.** The last 0.5 s decelerates to zero and holds the gameplay pose.

---

## 4 — the seam

This is the entire reason to shoot in-engine.

> **The last cinematic frame and the first playable frame must be the same frame.** Same position, same
> rotation, same fov, same hour, same weather.

You do not cut to the gameplay camera. You **end the timeline at it** — and you do not type its pose
from memory, you measure it:

```js
// at intro start, before installing the rig: the gameplay camera is already running. read it.
const cam = api.getCamera();          // { position, yaw, pitch, forward, fov } — fov is client-side
const end = cam && {
  pos:  cam.position,
  look: { x: cam.position.x + cam.forward.x * 8,
          y: cam.position.y + cam.forward.y * 8,
          z: cam.position.z + cam.forward.z * 8 },
  fov:  cam.fov ?? 60,
};
```

The last shot's `to` and `lookTo` are **that** — a null in the shot list meaning "the measured pose".
When it lands, nothing changes on screen; `clearCamera()` restores the gameplay rig and the player is
already inside the frame she was watching.

| what breaks a seam | what it looks like | do instead |
| --- | --- | --- |
| fov changes on the last frame | the world breathes in or out at the handoff | the last shot's fov **is** the gameplay fov — measured, not authored |
| a fade you did not need | a black hiccup between two identical frames | no fade on a seam. fades are for cuts you could not avoid |
| the hour jumps | dusk cinematic, noon gameplay | the intro plays in the world's own atmosphere. no `patchAtmosphere` you do not undo before the landing |
| the camera lands 2 m off | the world slides sideways as control arrives | measure the pose, never type it |
| HUD appears instantly | a hard pop that says "different screen now" | rise it over **300-400 ms** (§7) |
| the player was teleported during the intro | the body snaps under the camera | freeze the player, do not move her |

---

## 5 — the runnable rig

Three files: the shot list as data, the owner (one clock, on the player), the camera (a pure function
of that clock). Rig switching itself is the `camera-transitions` skill — this is the cinematic.

```json
// scripts/lib/data/intro-shots.json — numbers assume the player spawns near the origin facing -Z
// with a third-person rig ~5.5 m behind her. MEASURE YOURS. `null` = the measured gameplay pose.
[
  { "id": "establish", "seconds": 4.0, "ease": "linear",     "fov": 58, "hideBody": true,
    "from": { "x": 0, "y": 34, "z": 62 }, "to": { "x": 0, "y": 23, "z": 51 },
    "lookFrom": { "x": 0, "y": 6, "z": 0 }, "lookTo": { "x": 0, "y": 3, "z": 0 } },

  { "id": "subject", "seconds": 3.5, "ease": "linear", "fov": 45, "hideBody": false,
    "from": { "x": -8.0, "y": 2.7, "z": 12.4 }, "to": { "x": -3.6, "y": 2.5, "z": 8.2 },
    "lookFrom": { "x": 0, "y": 1.8, "z": 0.4 }, "lookTo": { "x": 0, "y": 1.5, "z": 0 } },

  { "id": "handoff", "seconds": 4.0, "ease": "easeOutQuad", "fov": null, "hideBody": false,
    "from": { "x": -3.6, "y": 2.5, "z": 8.2 }, "to": null,
    "lookFrom": { "x": 0, "y": 1.5, "z": 0 }, "lookTo": null }
]
```

Read the arithmetic out loud before you ship it: establish 15.6 m / 4.0 s = **3.9 m/s** crane down;
subject 6.1 m / 3.5 s = **1.74 m/s** push, still moving into the join; handoff 4.5 m over 4.0 s on
`easeOutQuad` = **2.25 m/s** at the join (1.3× the incoming — inside the 1.5× rule) decaying to **0**.
Total **11.5 s**. Title at 4.0 s. That is the whole opening.

```js
// scripts/intro.js — attached to the player: her client, her camera, one clock.
const SHOTS = require('lib/data/intro-shots.json');
const TOTAL = SHOTS.reduce((s, shot) => s + shot.seconds, 0);   // 11.5 s
const SKIP_GLIDE = 0.3;                                          // s to collapse the rest of the timeline
const WAIT_CAP = 1.5;                                            // s to wait for the db answer, then assume unseen
const BED = '/cdn/moodboard-lowpoly-cozy/music-intro-bed-slow-strings.mp3';
const HIT = '/cdn/moodboard-lowpoly-cozy/sfx-title-hit-low-brass.mp3';

export function onSpawn(api) {
  api.preloadAsset(BED);
  api.preloadAsset(HIT);
  api.patchState({ intro: null, phase: 'arming', waited: 0, controlsLive: false, hudIn: false });
  api.emit('intro:ask', { player: api.id });       // the manager answers into state.introSeen
}

export function update(dt, api) {
  const s = api.getState();
  if (s.phase === 'arming') return arm(dt, api, s);
  if (s.phase !== 'playing') return;

  // one clock. skip collapses what is left over SKIP_GLIDE instead of teleporting.
  const step = s.skipping ? dt * Math.max(1, (TOTAL - s.intro.t) / SKIP_GLIDE) : dt;
  const t = Math.min(TOTAL, s.intro.t + step);
  const shot = shotAt(t);

  if (shot.fov !== null && shot.fov !== s.intro.fov) {
    api.setCamera({ fov: shot.fov });              // fov lives on the camera DEF, not in camera state
    api.patchState({ intro: { ...s.intro, fov: shot.fov } });
  }
  if (!s.titleShown && t >= SHOTS[0].seconds) {    // the title lands ON the cut, and the hit with it
    api.playSound(HIT, { bus: 'SFX', volume: 0.9 });
    api.patchState({ titleShown: true, titleAt: t });
  }
  api.patchState({ intro: { ...s.intro, t } });    // the camera reads this and nothing else
  if (t >= TOTAL) land(api);
}

export function onInput(input, api) {
  if (api.getState().phase !== 'playing') return;
  if (input.actions['intro-skip']) api.patchState({ skipping: true });
}

function arm(dt, api, s) {
  const seen = s.introSeen;                        // undefined = the query is still in flight
  const waited = s.waited + dt;
  const { resident } = api.getWorldResidency();    // never open on a world that is still streaming
  if (!resident) return api.patchState({ waited });
  if (seen === undefined && waited < WAIT_CAP) return api.patchState({ waited });
  if (seen === true || api.getRoomMode() === 'dev') return skipEntirely(api);

  const cam = api.getCamera();                     // the seam: measured, never typed
  if (!cam && waited < WAIT_CAP + 0.5) return api.patchState({ waited });
  const end = cam
    ? { pos: cam.position,
        look: { x: cam.position.x + cam.forward.x * 8, y: cam.position.y + cam.forward.y * 8,
                z: cam.position.z + cam.forward.z * 8 },
        fov: cam.fov ?? 60 }
    : { pos: SHOTS[SHOTS.length - 1].from, look: { x: 0, y: 1.5, z: 0 }, fov: 60 };

  api.music.play(BED, { volume: 0.55, fadeMs: 1200, loop: false });   // sound first — §6
  api.patchState({ phase: 'playing', frozen: true, intro: { t: 0, end, fov: null }, titleShown: false });
  api.setCamera(
    { kind: 'custom', behavior: ['scripts/intro-cam.js'], pointerLock: false, fov: SHOTS[0].fov,
      orientation: { source: 'script' },     // script-authored yaw/pitch display exactly. required.
      state: {} },
    { mode: 'replace' },
  );
}

function land(api) {
  api.clearCamera();                          // back to the gameplay rig, already in this exact frame
  api.music.duck(0.18, { ms: 2500 });         // the first footstep has to be the loudest thing
  api.patchState({ phase: 'done', frozen: false, controlsLive: true, hudIn: true, intro: null });
  api.emit('intro:done', { player: api.id });
  api.notifyDmOnce('intro-landed', 'someone watched the whole opening and got the controls');
}

function skipEntirely(api) {
  api.patchState({ phase: 'done', frozen: false, controlsLive: true, hudIn: true, intro: null });
}

function shotAt(t) {
  let acc = 0;
  for (const shot of SHOTS) { if (t < acc + shot.seconds) return shot; acc += shot.seconds; }
  return SHOTS[SHOTS.length - 1];
}
```

```js
// scripts/intro-cam.js — the rig. no clock, no state of its own: a pure function of state.intro.t.
const E = require('builtin/easing');
const SHOTS = require('lib/data/intro-shots.json');

export function update(dt, api) {
  const target = api.getControlTarget();          // her state, readable from the camera every tick
  const intro = target?.state?.intro;
  if (!intro || typeof intro.t !== 'number') return;   // handed back already — draw nothing

  const { pos, look, shot } = poseAt(intro.t, intro.end);
  api.setProperty('feetPosition', pos);
  api.lookAt(look);

  const hide = shot.hideBody === true;
  if (api.getState()._hideLocalPlayer !== hide) api.patchState({ _hideLocalPlayer: hide });
}

function mix(a, b, e) {
  return { x: a.x + (b.x - a.x) * e, y: a.y + (b.y - a.y) * e, z: a.z + (b.z - a.z) * e };
}

function poseAt(t, end) {
  let acc = 0;
  for (let i = 0; i < SHOTS.length; i++) {
    const shot = SHOTS[i];
    const last = i === SHOTS.length - 1;
    if (t < acc + shot.seconds || last) {
      const u = Math.max(0, Math.min(1, (t - acc) / shot.seconds));
      const e = (E[shot.ease] ?? E.easeInOutSine)(u);
      return {
        pos: mix(shot.from, shot.to ?? end.pos, e),
        look: mix(shot.lookFrom, shot.lookTo ?? end.look, e),
        shot,
      };
    }
    acc += shot.seconds;
  }
}
```

Four things in there are not decoration:

- **`orientation: { source: 'script' }`** — without it a pointer-locked custom rig with numeric yaw/pitch
  in state can be classified as a mouse-driven orbit camera and the renderer parks your authored pose in
  an orbit around the player. Declared, the engine presents the timeline exactly as authored.
- **`fov` is a camera-def field, not camera state** — the engine reads it off the effective camera def, so
  fov changes go through `setCamera({ fov })`. One call per cut, and **never** on the last frame.
- **the player is frozen, not moved** — `state.frozen` is a gate your movement code already reads
  (`if (api.getState().frozen) return;` at the top of `update`/`onInput`). Do not teleport her.
- **`_hideLocalPlayer`** in camera state hides her own body per frame — true for the wide establish where
  a 1.8 m avatar in a 60 m frame is a speck, false the moment the SUBJECT shot is about her.

---

## 6 — sound is half the intro

| beat | gain | when |
| --- | --- | --- |
| bed in | `volume: 0.55`, `fadeMs: 1200` | **0.3-0.5 s before the first frame** — decode and fade need the head start |
| bed under picture | 0.5-0.6 | anything above 0.7 and the title hit has nowhere to go |
| the hit | `volume: 0.85-1.0`, `bus: 'SFX'` | **on** the title frame — the same tick as the state write, never a `runInSeconds` guess |
| ambience (wind, city, sea) | 0.25-0.35 through an `audio:` loop or `music.play(..., { layer })` | from frame one; it is what sells "this is a place" |
| handoff | `music.duck(0.18, { ms: 2500 })`, or `music.stop({ fadeMs: 900 })` | on the landing, so the first footstep is the loudest thing in the room |

One hit, not three. It lands on the title reveal — the same branch that flips `titleShown`, which is why
that branch calls `playSound` itself instead of scheduling it. A hit 120 ms off reads as a mistake even
to people who could not tell you why.

The head start is not superstition: `music.*` called from her own client forwards to the server (the
component has one writer, so everyone including late joiners hears the same position), and that round
trip is real. The bed asks for its 0.3-0.5 s. `playSound` for the hit is local and immediate.

`<audio>` in HTML is forbidden: it bypasses her volume sliders and the game's audio policy. Everything
above is `api.music.*` and `api.playSound` — the verbs, the buses, the ducking envelope and the joiner
rules live in the engine's `audio` skill.

---

## 7 — the title

- It lands **after the establish** — on the first cut, ~4.0 s in. On frame one it is a logo screen, and
  a logo screen is not an opening.
- It holds **1.5-2.5 s**, then out over **400 ms**. Longer and the player reads it twice.
- It lives on the **UI plane**, in `ui.js`. Always.

That last one is not taste. A weak client renders the 3D scene at `renderScale 0.55` with bloom skipped —
the creator's own client sits on that rung right now. A title baked into the 3D scene goes soft there;
the same title as HTML stays razor-sharp at any render scale, on any phone.

```js
// scripts/ui.js — the title, the skip, and the HUD rise. one screen, three fades.
export default function (localPlayer, world) {
  const s = localPlayer.state;
  const t = s.intro?.t ?? null;
  const playing = s.phase === 'playing' && t !== null;
  const titleOn = playing && t >= 4.0 && t < 6.4;              // lands on the cut, holds 2.0 s, out by 6.4
  const skipOn = playing && t >= 2.0;
  const hud = s.hudIn ? 'opacity-100' : 'opacity-0';           // rises over 350 ms, never pops

  return `
    <div class="fixed inset-0 pointer-events-none select-none">
      <div id="intro-title" class="absolute inset-x-0 top-[38%] text-center transition-opacity duration-500 ${titleOn ? 'opacity-100' : 'opacity-0'}">
        <div class="text-6xl font-bold tracking-[0.3em] text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]">VALE FUNDO</div>
        <div class="mt-3 text-sm uppercase tracking-[0.5em] text-white/60">chapter one</div>
      </div>

      <button id="intro-skip" data-interactive
        class="absolute bottom-8 left-1/2 -translate-x-1/2 h-11 px-5 rounded bg-black/60 text-sm uppercase tracking-widest text-white/80 transition-opacity duration-300 ${skipOn ? 'opacity-100 pointer-events-auto' : 'opacity-0'}"
        onclick="sendAction('intro-skip')">skip <span class="text-white/40">(space)</span></button>

      <div id="hud-root" class="absolute inset-0 transition-opacity duration-[350ms] ${hud}"><!-- the HUD --></div>
    </div>`;
}
```

The skip button sits bottom-centre — clear of the platform rail (the right edge at mid-height, 50×340,
every platform) and 44 px tall so a thumb can hit it. Phone layout rules: `gavi#fazer-mobile-e-pc`.

---

## 8 — when a conjured video wins instead

| a video **wins** | a video **loses** |
| --- | --- |
| a shot the engine cannot stage — a memory, a hand-drawn prologue, a childhood, a war it never built | file weight and the wait before the first frame; a cold stream stalls the opening |
| a face in **close-up** with real acting | the cut into gameplay is a **hard seam**, always. two different renderers, no seam law can save it |
| a scale the world does not contain (an orbital shot of a planet the game only has one valley of) | once minted, the look is **frozen forever** — no note-taking, no small change |
| a fixed marketing-grade opening you also want to post | it is not the game. what it promises, the first playable frame has to keep |
| a stylised look the game itself is not (ink, 2D, film grain over live action) | it cannot react to anything: not her character, not her hour, not her save |

Lane B is one `<video>` in `ui.js`. The grammar is the `game-ui` skill's — read it there, do not invent it:
`…<scene>.mp4` conjures a clip from its own words; `…<image>.png.<action>.mp4` animates a still and the
action can carry the spoken line; `.aspect-16x9` just before `.mp4` shapes the frame (nine shapes:
16x9, 9x16, 1x1, 4x3, 3x4, 3x2, 2x3, 21x9, 3x1); an action ending `-loop` comes back seam-cut and
**video-only**, so a loop that needs sound gets an `sfx-ambient-` loop through the engine.

**Video goes on the UI plane. Never onto a 3D surface.** There is no lane for that here.

```js
// scripts/ui.js — lane B. the press that opened it is also the gesture the browser wants for sound.
const CLIP = '/cdn/moodboard-painterly-fantasy/cutscene-a-lone-rider-crests-a-dune-at-dawn-as-the-city-below-wakes.aspect-16x9.mp4';
const POSTER = '/cdn/moodboard-painterly-fantasy/cutscene-a-lone-rider-crests-a-dune-at-dawn.png';

if (localPlayer.state.phase === 'video')
  return `
    <div id="intro-video" data-modal class="fixed inset-0 bg-black pointer-events-auto">
      <video id="intro-clip" class="h-full w-full object-cover" src="${CLIP}" poster="${POSTER}" autoplay playsinline
             onended="sendAction('intro-skip')"></video>
      <button data-interactive class="absolute bottom-8 right-8 h-11 px-5 rounded bg-black/60 text-sm uppercase tracking-widest text-white/80"
              onclick="sendAction('intro-skip')">skip</button>
    </div>`;
// no <source> child needed — the ref goes straight on `src`, as above.
// api.preloadAsset(CLIP) at boot so the first play does not stream cold.
```

Rules that bite on this lane:

- **Start it from a press.** A cold-load autoplay with sound is blocked by the browser; the press that
  started the game is the gesture that unblocks it. Otherwise mute the clip and run the bed and the
  voice through engine audio.
- **The conjuring law.** A served filename keeps its **first** look forever, and rewordings collide onto
  the same file. A changed look is a **new filename with a distinct token** (`-2`, `-v3`); the old name
  keeps serving whatever still points at it.
- **A cooking clip is simply absent.** First conjures weave for minutes. An `onplay` event, a green log,
  a fetch that returned — none of those are a sighting. Only a composited frame that *has the picture in
  it* (`view_player_screen`) is a sighting. Never tell the creator it is on screen without one.
- **Author a `poster`** from the same words as a `.png` so the wait shows art instead of black.
- **Still obey §2.** A video intro needs the same skip, the same 8-20 s, the same "remember it played".

---

## 9 — when it breaks

| what you see | cause | fix |
| --- | --- | --- |
| the intro plays on every single reload | nothing remembers it | §2: `intro_seen` in `api.sql` on the **manager** (host seat), answer into her state, gate `arm()` on it |
| the skip KEY does nothing, the button half-works | `'intro-skip'` missing from `inputs.actions` — a key binding only exists if declared, and the click only reads true on its arrival tick; `getLogs()` carries the `ui.handler` fault | declare it (`patchInputs`), in the same pass as the UI that sends it |
| skip works on the second press only | the handler arms at a shot boundary, or the button is missing `data-interactive` | arm from t = 0; the prompt shows at 2.0 s, the key lives from 0 |
| skip cuts to a different frame | the skip teleports instead of finishing the timeline | collapse `t` to `TOTAL` over **0.3 s** — the end pose *is* the last frame |
| the camera lands ~2 m off and the world jumps | the handoff pose was typed by hand | measure it: `api.getCamera()` at arm time; last shot's `to` is `null` = measured |
| the world breathes at the handoff | fov changes on the final frame | the last shot's fov is the measured `cam.fov`; no `setCamera({ fov })` on the last shot |
| the title is blurry | it is baked into the 3D scene and the client is at `renderScale 0.55` | move it to `ui.js` — §7 |
| the music starts after the picture | the bed was started on the same tick as the first frame | start it **0.3-0.5 s earlier**, `fadeMs: 1200`; `preloadAsset` at boot |
| the title hit is slightly off | it was scheduled with `runInSeconds` against a moving clock | fire `playSound` in the same branch that flips `titleShown` |
| a shot holds 6 s and the player leaves | the shot has no motion and no life in it | 3.0-5.0 s max, or put something moving in the frame — §3 |
| the HUD pops on | it renders the instant control lands | one `hudIn` flag, opacity over **350 ms** |
| the avatar is a speck in the wide shot, or vanishes in the close one | `hideBody` wrong per shot | `_hideLocalPlayer` true on the establish, false from the subject on |
| the video never appears | it is still cooking (minutes), or the filename was reworded onto an old look | wait and check a real composited frame; a new look needs a new filename token |
| the intro plays over a grey world | it opened before streaming finished | gate `arm()` on `api.getWorldResidency().resident` |
| she can walk during the intro | the movement code does not read the freeze | `if (api.getState().frozen) return;` at the top of movement `update` and `onInput` |

Before saying an opening is done: watch it once cold, press skip at second 1 (it must work), reload
(it must not play again), and take one composited frame at the handoff plus one a second later — the two
must be the **same** frame with a HUD rising over it. Full sweep: `gavi#testar-tudo`; landing changes on
a live world: `gavi#construir-ao-vivo`.

---

## the laws

1. **8 to 20 seconds.** 11-13 is the target. Every second past 20 is retention you paid cash for.
2. **Skippable or broken.** First press, every press, keyboard and thumb, from second 0. The prompt shows
   by second 2.
3. **Once.** Remember it played and go to the menu. Keep one way back to it.
4. **The seam is the product.** End the timeline at the gameplay pose — measured with `api.getCamera()`,
   never typed. Same position, same rotation, same fov, same hour.
5. **Three shots: establish, subject, handoff.** One cut, on motion, decisive. No shot under 1.2 s.
6. **Every move has a speed.** 1.2-2.5 m/s push, 2.5-4.5 m/s crane, 6-12 °/s orbit. The subject crosses
   1/8 to 1/3 of the frame per second or it reads as broken or as a mistake.
7. **The landing stops.** Decelerate to zero over the last 0.5 s and hold. No fade on a seam.
8. **Sound leads the picture by 0.3-0.5 s**, one hit lands *on* the title, and the bed drops to ~0.18
   as control arrives so the first footstep is audible.
9. **The title is UI.** Anything that must stay crisp lives on the UI plane, because a weak client
   renders the world at 0.55 and does not care about your typography.
10. **The player is frozen, never moved.** A teleport during an intro is a seam you cannot hide.
11. **Video is for what the engine cannot stage** — and it goes on the UI plane, never on a 3D surface.
    It always cuts. Know that before you mint.
12. **A filename is a permanent decision.** A changed look is a new name with a token. And a clip you
    have not seen in a frame is not on screen, whatever the logs say.