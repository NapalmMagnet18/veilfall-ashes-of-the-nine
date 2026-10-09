---
name: Kids and Music Genres
description: Gavi's kids-and-music skill — no losing and no punishment in disguise, every touch answered, targets sized in percent of screen, a reward loop for someone who cannot read yet, and rhythm with hit windows in multiples of a tick, the metronome as the single source of truth, and the real audio API (music.*, playSound, audio:, vibe).
---

# Genres: kids and music

Two promises, one spine: **immediate pleasure, no punishment.** From the table in
`gavi#desenhar-o-jogo` — a kids' game promises *"nothing bad is going to happen to me"* and sins through
hidden punishment; a music game promises *"I am inside the music"* and sins through lag between touch
and sound.

## pick your path in ten seconds

| the situation | do this |
| --- | --- |
| she put it down after 40 s | it isn't difficulty missing, it's an EVENT: one new thing every 20-40 s |
| an obstacle "kills" | it pushes instead: reposition with `api.animate`, control back within 0.4 s |
| a bar goes down on its own | that's a defeat wearing a costume. list everything that can drop and delete it |
| a button does nothing in this scene | still answer: `playSound` + `squash` on every path out of `onInput` |
| the target gets missed | ≥ 15% of the screen's smaller side (ages 5-7), ≥ 25% (2-4), never under 48 px |
| she can't read | icon + sound + a ghost hand doing the gesture; HUD 0-3 words; 3 stars are 3 drawn stars |
| "the rhythm feels mushy" | measure: > 60 ms and it reads mushy. play the note from HER behavior, not a manager |
| the first note arrives late | first use fetches + decodes — `api.preloadAsset(ref)` in `onSpawn` |
| the judge drifts over a minute | you summed `dt`. the clock is `api.music.now().since`, nothing else |
| she mashes the button and it gets 6× louder | `playSound(..., { mode: 'restart' })` — one voice per object |
| you want a window under 33 ms | you can't: one tick is the floor. see LAW 7 |

What the two genres share: the touch **always** answers · a mistake costs zero · feedback on three
channels, always · the icon and the sound teach, not the text · emptiness is paid for with **surprise**,
never with difficulty.

# Part 1 — KIDS

## LAW 1 — no defeat, and no punishment in disguise

There is no lose screen. There is also no countdown that runs out, no life bar that empties, no progress
that walks backwards, no item that gets lost, no low descending error sound. Those are defeats under
another name and a child reads every one of them.

The test: **list everything on screen that can go down.** If it drops without her asking, it is
punishment. An obstacle doesn't kill, it **pushes**, and control comes back within **0.4 s**:

```js
// scripts/empurrao.js — on the obstacle. Contact pushes her 1.2 m and hands control straight back.
export function onCollide(other, api, contact) {
  if (!other?.tags?.includes('player')) return;
  const p = api.getObject(other.id)?.feetPosition;             // world-space feet
  if (!p) return;
  const nx = contact?.normal?.x ?? 0, nz = contact?.normal?.z ?? 1;
  api.animate(other.id, {                                      // dot-path keyframes are real
    keyframes: { 'feetPosition.x': p.x - nx * 1.2, 'feetPosition.z': p.z - nz * 1.2 },
    duration: 0.35, easing: 'easeOutCubic',                     // 0.35 s: visible, not a teleport
  });
  api.playSound('cdn/sfx-bonk-macio.mp3', { position: p, pitch: 0.94 + api.random() * 0.14 });
  api.squash(other.id, { axis: 'y', amount: 0.3, duration: 0.16 });
}
```

A fall reappears **in the same place**. Time is an hourglass that **fills**, never one that empties.

## LAW 2 — the character reacts to EVERY input

A key that gives nothing back is a broken toy. Every button makes the character do *something* —
including the one that "isn't for" this scene. No path out of `onInput` leaves without a sound:

```js
api.playSound('cdn/sfx-pulo-fofo.mp3', { pitch: 0.92 + api.random() * 0.22, volume: 0.9 });
api.squash(api.id, { axis: 'y', amount: 0.28, duration: 0.16 });
```

Three channels, as in `gavi#desenhar-o-jogo`: body (`squash`, `hitstop`), sound (`playSound`), screen
(`damageNumber`, `spawnFx`, `screenFlash`). In a kids' game swap `screenShake` for `squash` — a shaking
screen frightens them.

## LAW 3 — big target, colour that separates

Touchable area **≥ 15% of the screen's smaller dimension** (ages 5-7), **≥ 25%** (2-4), and on a phone
never under **48 px** a side (`gavi#fazer-mobile-e-pc`). The collider is **bigger than the drawing**: a
trigger with `physics: { body: 'static', trigger: true }` + `onTriggerEnter`, radius ~1.5× the visual —
she hits what she *almost* hit. Interactive things in high chroma (`oklch(0.78 0.19 …)`), the set at
chroma ≤ 0.06, and never by hue alone: add **shape and size**, because green-vs-red fails for 8% of
people.

## LAW 4 — reward the attempt; an icon and a sound instead of reading

The trigger is the **attempt**. Got close, gets a star:

```js
api.damageNumber(pos, 0, { text: '★', color: 'oklch(0.9 0.19 90)', size: 1.6 });
api.playSound('cdn/sfx-estrela.mp3', { pitch: Math.min(1.6, 1 + streak * 0.06) });  // the chain climbs
```

`pitch` is clamped to **0.25-4**, so a 10-long streak at +0.06 stays inside it. A collection never loses
a piece. Every instruction works with the text switched off (an arrow that pulses, a ghost hand making
the gesture). HUD of **0 to 3 words**; voice through the CDN grammar (`voice-<who>-saying-<line>`), one
identity per character; a number only when it is a visible count — 3 stars are 3 drawn stars, a
percentage is for adults.

## LAW 5 — easy isn't empty: surprise in place of difficulty

With no defeat, the loop only closes with **surprise**: one new thing every **20-40 s**, never the same
one twice in a row. Cheapest to most expensive: a new reaction from the same object (the 5th tap lets
birds out of the tree) · a new sound for the same gesture · a creature that turns up and copies her
(`gavi#animar-esqueleto-codigo`) · the world changing colour (`api.patchAtmosphere`) · a new `place`
behind a door.

| audience | target on screen | text | defeat | one lap | scoreboard |
| --- | --- | --- | --- | --- | --- |
| ages 2-4 | ≥ 25% of the smaller side | none | none, not even a setback | 10-20 s | none; the world reacting |
| ages 5-7 | ≥ 15% (min. 48 px) | 1 word + an icon | none; the obstacle pushes | 20-45 s | stars that only add up |
| ages 8-12 | ≥ 10% | a short sentence | back in < 2 s, near where it hurt | 45-120 s | a number + a high score |
| casual adult (rhythm) | ≥ 8% (min. 48 px on touch) | normal | a miss cuts the combo, not the music | 1 song | combo, accuracy |

Age changes two things only: **how long the game can bear to stay quiet**, and **how much a mistake
charges**. The rest is identical.

# Part 2 — MUSIC

## LAW 6 — latency is the game

At **60 ms** it already reads as "this game feels mushy"; at **100 ms** she starts anticipating the beat
to compensate, and then she is fighting the game instead of playing it. Three real causes:

- **Round-trip.** In the default `multiplayer` mode every entity is simulated by its owner — the
  player's body runs on her own machine. So **the note is played by her own behavior**, in `onInput`,
  with `api.playSound`. Routed through a manager it costs +1 RTT. Scoring may be late; sound may not.
- **First decode.** The first use of a clip fetches and decodes it, and the opening note arrives late.
  `api.preloadAsset(ref)` in `onSpawn`, one per clip.
- **Tick.** The sim runs at the game's tick rate (**30 Hz typical — 33 ms a tick**) and the `InputState`
  handed to `onInput` carries **no timestamp** (`axes`, `actions`, `actionData`, `pointer`, nothing
  more). So the judgement's resolution is **one tick**, and a "±15 ms" window is fiction. Convert
  seconds to ticks with `api.seconds(n)` — never a hardcoded 60.

## LAW 7 — hit windows in multiples of a tick

| difficulty | Perfect | Good | Ok | outside (still sounds) | ticks at 30 Hz |
| --- | --- | --- | --- | --- | --- |
| kids / free | ±100 ms | ±200 ms | ±300 ms | always counts | 3 / 6 / 9 |
| casual | ±67 ms | ±133 ms | ±233 ms | sounds weaker | 2 / 4 / 7 |
| normal | ±50 ms | ±100 ms | ±167 ms | sounds weaker | 1.5 / 3 / 5 |
| hard | ±33 ms | ±67 ms | ±117 ms | sounds dull | 1 / 2 / 3.5 |
| don't | < 33 ms | — | — | — | under one tick: the engine cannot know |

**Asymmetry forbidden** — the same window before and after the beat. The ear already runs ~20 ms early;
if the window runs early too she runs earlier still and falls out of the music. **One calibration
constant per game:** `OFFSET_MS` goes into the clock, never into the windows. And outside the window it
**still plays a sound** — a mute note is the one punishment this genre cannot use.

## LAW 8 — the metronome is the source of truth

Never derive the beat from a counter summing `dt` (it drifts, each client in its own direction) and
never from `api.getWallClockTime()` — that is tick-derived and deterministic, a calendar, not a bar.
Legitimate sources, all three real:

1. `api.music.now()` → `{ ref, layer, positionMs, since }`. `since` is **unwrapped** seconds since the
   track took the layer; `positionMs` wraps inside the clip once the engine knows its duration. Both are
   tick-anchored, so **every machine agrees** and a late joiner reads the same position.
2. `api.getVibeAudio(id)` — the live transport of a generative `vibe` (bar/beat/bpm, current voices,
   recent triggers).
3. `api.seconds()` — the room clock, in seconds.

The clock is **a pure function everyone calls**, not state a manager broadcasts at 30 Hz.

```js
// scripts/lib/batida.js — the source of truth. No state, callable from any realm.
const TRACK = 'cdn/moodboard-toon-vibrant/music-carrossel-96bpm.mp3';
const BPM = 96;                // the file's REAL bpm, measured. wrong here and everything drifts
const PER_BEAT = 60 / BPM;     // 0.625 s
const OFFSET_MS = 120;         // the file's pickup — measure it by clapping, never guess
const PER_BAR = 4;

function beatNow(api) {
  const m = api.music.now();
  if (!m || m.ref !== TRACK) return null;          // silence, or another track: no beat
  const t = m.since - OFFSET_MS / 1000;            // since: unwrapped seconds, monotonic
  if (t < 0) return null;
  const exact = t / PER_BEAT;
  return { exact, perBeat: PER_BEAT, index: Math.floor(exact),
           phase: exact - Math.floor(exact), bar: Math.floor(exact / PER_BAR) };
}

// distance in MILLISECONDS to the nearest beat — the only number in the judgement
const errorMs = (b) => Math.abs(b.exact - Math.round(b.exact)) * b.perBeat * 1000;
module.exports = { TRACK, PER_BAR, beatNow, errorMs };
```

```js
// scripts/relogio-de-batida.js — the manager, realm: 'server'. OWNER of the track: music writes are
// server-only, so nobody else calls music.play.
const B = require('lib/batida.js');
export const updateSchedule = { every: 1 };        // a beat pulse wants every tick

export function onSpawn(api) {
  for (const ref of ['cdn/sfx-nota-do.mp3', B.TRACK]) api.preloadAsset(ref);
  api.music.play(B.TRACK, { fadeMs: 600, loop: true, volume: 0.85 });
  api.patchState({ lastBeat: -1 });
}

export function update(dt, api) {
  const b = B.beatNow(api);
  if (!b || b.index === api.getState().lastBeat) return;   // exactly once per beat
  api.patchState({ lastBeat: b.index });
  api.emit('music:beat', { index: b.index, strong: b.index % B.PER_BAR === 0 });
}
```

## LAW 9 — judge without punishing

```js
// scripts/julgar-acerto.js — on the PLAYER'S BODY: her hooks run on her machine, so the note is local
// and costs no round trip. inputs.actions.hit = { keys: ['space'], touch: { gesture: 'tap' } }
const B = require('lib/batida.js');
const WINDOWS = [                                  // ms, multiples of a tick — LAW 7
  { name: 'PERFECT', ms: 50,  volume: 1.0,  color: 'oklch(0.9 0.2 95)' },
  { name: 'GOOD',    ms: 100, volume: 0.85, color: 'oklch(0.85 0.15 200)' },
  { name: 'OK',      ms: 167, volume: 0.7,  color: 'oklch(0.8 0.08 260)' },
];
const OUTSIDE = { name: 'close', volume: 0.45, color: 'oklch(0.75 0.04 260)', pitch: 0.94 };

export function onInput(input, api) {
  if (!input.actions.hit) return;
  const b = B.beatNow(api);
  if (!b) return;
  const error = B.errorMs(b);
  const j = WINDOWS.find((w) => error <= w.ms) ?? OUTSIDE;   // NEVER null: outside plays too
  api.playSound('cdn/sfx-nota-do.mp3', { volume: j.volume, pitch: j.pitch ?? 1, mode: 'restart' });
  api.squash(api.id, { axis: 'y', amount: j === OUTSIDE ? 0.1 : 0.3, duration: 0.14 });
  api.damageNumber(api.getProperty('feetPosition'), 0, { text: j.name, color: j.color, size: 1.4 });
  api.emit('rhythm:hit', { grade: j.name, errorMs: Math.round(error) });   // the score may lag
}
```

`mode: 'restart'` is what separates a rhythm game from a racket: without it, machine-gunning the button
stacks voices and the same note comes out 6× louder.

## LAW 10 — soundtrack × mechanic, and layers that come and go

A **soundtrack** plays underneath: the game doesn't read it, doesn't judge against it, doesn't sync to
it. **Mechanical** is when the beat decides the gameplay — then everything (animation, spawn, light)
reads the clock from LAW 8. Mixing the two by accident gives you this genre's worst defect: the game
half a bar out and nobody knowing whose fault it is. Every lane needs **the same bpm and the same
duration** (or an exact multiple), or they drift apart every loop.

```js
// scripts/camadas-de-musica.js — the manager, realm: 'server'. OWNER of the music layers.
const R = 'cdn/moodboard-toon-vibrant/music-camada-';
const LANES = { base: [R + 'base-96.mp3', 0.8], drums: [R + 'bateria-96.mp3', 0.7], choir: [R + 'coro-96.mp3', 0.65] };
const TIERS = [['base'], ['base', 'drums'], ['base', 'drums', 'choir']];
const MIN_COMBO = [0, 5, 15];                      // the player's combo picks the tier
export const updateSchedule = { every: 6 };        // ~5 Hz is plenty to decide a layer

export function onSpawn(api) {
  for (const [ref] of Object.values(LANES)) api.preloadAsset(ref);
  api.music.play(LANES.base[0], { layer: 'base', volume: LANES.base[1], fadeMs: 800 });
  api.patchState({ tier: 0 });
}

export function update(dt, api) {
  const s = api.getState();
  const tier = MIN_COMBO.filter((m) => (s.combo ?? 0) >= m).length - 1;   // s.combo: from the judge
  if (tier === s.tier) return;
  api.patchState({ tier });
  for (const [name, [ref, vol]] of Object.entries(LANES)) {
    // the same ref never restarts — it ramps the live lane's volume, so this is always safe to call
    if (TIERS[tier].includes(name)) api.music.play(ref, { layer: name, volume: vol, fadeMs: 1200 });
    else api.music.stop({ layer: name, fadeMs: 900 });
  }
}
```

A layer never enters abruptly: **1200 ms** in, **900 ms** out. A hard cut on a music layer reads as an
audio bug.

# the audio API, no invention

**Music** — `api.music.*`, engine state: global, survives a join, a reset and a script edit, and music
writes are **server-only**. `play(ref, { fadeMs, loop, layer, volume })` is the one verb for starting
**and** switching (same ref = no restart, just a volume ramp; a different ref crossfades, 800 ms by
default; `loop` is already `true`). Plus `crossfade(ref, ms)`, `stop({ fadeMs, layer })` — with no
`layer` it stops all of them — `duck(gain, { ms })`, which pulls **all** music down and gives it back
(the floor for voice over music is **0.2-0.3**), and `now()`. `api.audio.duration(ref)` answers seconds,
or `null` until the fact has reached that realm — read it once at preload and cache it, don't poll.

**World sound** — `api.playSound(clip, { position, volume, pitch, loop, mode, bus, priority,
maxDistance, audience })` returns a sound id (`api.stopSound(id)` ends it). A continuous bed is a
**component**, not a call: `audio: { clip, loop: true, spatial: true, gain: 0.25, maxDistance: 18,
bus: 'Ambience' }`. `gain` runs 0-2 (default 1) but **a bed wants 0.2-0.3**, because beds add up — five
at 0.3 bury the music. `maxDistance` is the audible radius and the sound is silent past it. `pitch` is
clamped 0.25-4, and every repeated one-shot carries `pitch: 0.92 + api.random() * 0.16`, or ten repeats
turn into a chainsaw (the same fix asymmetry gives motion in `gavi#animar-doutrina`).

**Generative** — `audio: { kind: 'vibe', script: 'scripts/tema.vibe.js', params: { tension: 0 }, gain,
bus, paused }`. Turn the knob with `api.patchVibeParams(id, { tension: 0.7 })`, read the transport with
`api.getVibeAudio(id)`. `gain: 0` is **not** a pause — the pause is
`api.setObjectProperty(id, 'audio.paused', true)`.

**The HUD is not the metronome.** The UI plane repaints at **30 fps maximum**
(`api.patchEngine({ ui: { targetFps: N } })` clamps into 5..30, default 30): never animate a note
highway by repaint. Write position and duration once, and let CSS keyframes run on the browser's clock
(`gavi#menu-principal-3d-2d`).

## when it breaks — the six tells

| tell (what you'd actually see) | cause | fix |
| --- | --- | --- |
| a 4-year-old freezes and looks away | something on screen went down without her asking | delete the countdown/bar; the obstacle pushes, control back in 0.4 s |
| she taps and nothing happens | a path out of `onInput` with no answer | every path: `playSound` + `squash`, even the "wrong" button |
| the taps land next to the thing | target under 15% of the smaller side, or a collider matching the art | 1.5× trigger radius, ≥ 48 px, ≥ 15%/25% by age |
| "it feels mushy" | the note is played by a manager (+1 RTT), or the clip is decoding on first use | play from her own behavior; `preloadAsset` every clip in `onSpawn` |
| the judge is fine at 0:10 and half a bar out at 2:00 | the clock sums `dt` or reads a wall clock | `api.music.now().since` only — one shared, tick-anchored clock |
| every hit reads GOOD, never PERFECT, and the average error is +40 ms | `OFFSET_MS` is wrong, and it's being blamed on the player | measure the pickup by clapping; fix the clock, never the windows |
| one note comes out 6× louder under a mash | voices stacking | `mode: 'restart'` on every judged note |

Then prove it: headphones, one full song, and a histogram of `errorMs` with
`api.notifyDmOnce('first-perfect', …)`. A systematic +40 ms is your `OFFSET_MS`, not her hands
(`gavi#cacar-bugs-jogando`).