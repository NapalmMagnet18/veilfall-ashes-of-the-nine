---
name: Horror Genre
description: Gavi's horror skill — dread built from colour, sound and information, never from black. Cold-blue numbers for light and fog, the visibility budget, the sound budget, the chase in 20-40 s with a real fov override, and three runnable scripts: the ambience bed with a cut to silence, a lamp that breathes, and a trigger that tightens the scene.
---

# Genre: horror

The promise (`gavi#desenhar-o-jogo`): **I don't want to turn that corner.**

## pick your path in ten seconds

| the situation | do this |
| --- | --- |
| the scene reads black, not dark | ambient 1.0-1.4, cold base `oklch(0.55-0.65 0.04-0.08 240-270)` — LAW ZERO |
| night exterior looks like a bug | `sky: { kind: 'realistic', model: 'hosek' }`, `timeOfDay: 22`, `moon.enabled`, stars |
| "it isn't scary" | you're showing before you sound it — 3 suggestions, then 1 silhouette ≤ 1.5 s |
| the monster is on screen and stopped scaring | past 10 s it's a character. 3-8 s per encounter, and it must be DOING something |
| the chase feels flat | fov 60 → 72, camera 0.6 m closer, `screenShake` 0.14, exit visible at 20-30 m, 20-40 s |
| the fog stayed after the scene | you used `patchAtmosphere` (a spec write). Give it back, or use `pushAtmosphere` per player |
| player stopped advancing | it's information, not fear — check the visibility budget (floor 3 m / door 20 m / her body) |
| scare landed once and never again | habituation: −50% on the second. 1 peak per 8-12 min, cause visible within 3 s |
| two people in the room laughing | horror is solo: `api.patchEngine({ networking: { mode: 'singleplayer' } })` at top level |

Lock the verb before the first line — **search, hide, listen, repair, carry, run**. "Walk" is not a verb,
and horror without a verb is a haunted-house ride: gorgeous, no game. The cardinal sin is the cheap
scare on repeat: a person agrees to feel something bad only while the game plays fair, and cheating
(black screen, a creature born on top of her with no rule behind it) becomes anger in ten seconds,
and anger doesn't get screenshotted. If they must play together, split them up (`gavi#fazer-multiplayer`).

## LAW ZERO — fear is COLOUR, never a black screen

> **What a person can't see PROPERLY frightens her. What she can't see at all is a brightness bug.**

**Cold base:** `oklch(0.55-0.65 0.04-0.08 240-270)`. An interior (no sky) needs
`ambient.light.intensity` **1.0-1.4**; under 1.0 it closes into black. **Night exterior:** the physical
sky derives its own sun and ambient from the hour — `timeOfDay` **21.5-22.5**, `moon: { enabled: true }`,
`stars: { enabled: true }`, and do not hand-write `sun.rotation`; `timeOfDay: 0` with no moon is the
black nobody screenshots.

**Isolated amber is the island:** one warm source per room —
`light: { kind: 'point', color: 'oklch(0.78 0.13 68)', intensity: 2-3, distance: 6-10 }` — one every
15-25 m of route; the fear is what lies outside the circle. **Budget: 3-6 real lights per scene, 2-3
of them with `shadow: { enabled: true }`.** Shadows are the scarce resource, not the lights: point and
spot lights are clustered and cheap, shadow slots are not (a spot shadow is ~1/6 the cost of a point
shadow), and a hundred points of glow are `emissive` + `emissiveIntensity` 1.5-3, not lights. Never
light the threat from the front: light behind it = silhouette = more fear.

**Fog softens the horizon, it never swallows it:** corridor `{ kind: 'linear', near: 3-5, far: 18-28 }`;
exterior 8-14 / 55-80; "I can't see the end of this" is `{ kind: 'exp2', density: 0.02-0.05 }`. Hard
rule: **`far` ≥ 2× the distance to the next route anchor**, and the furthest silhouette that matters
sits at ~⅓ of `far`.

**The screenshot test:** frame the darkest point in the game. Can't tell floor from wall? That's black,
not dark — raise the cold base one step.

**The visibility budget** — three things legible in any second: the **floor** out to 3 m; the **next
door** (or an amber anchor pointing at it) within 20 m; **her own body**. Miss one and she stops
advancing, and a player standing still isn't afraid, she's unsure. Phones carry about half that range
(`gavi#fazer-mobile-e-pc`).

## the sound budget — sound is the engine, the image only confirms

| lane | numbers | law |
| --- | --- | --- |
| bed (`audio:` component) | `gain 0.12-0.20`, `loop: true`, `spatial: false`, `bus: 'Ambience'` | above 0.25 it stops being a bed and becomes a sound |
| spatial anchor (drip, generator) | `gain 0.25-0.35`, `maxDistance 12-20` | **one per feature** — four drips in a room is one drip 4× louder |
| off-screen cue | `playSoundAt(clip, pos, { volume: 0.4-0.6, maxDistance: 12-18 })`, 6-15 m behind her | the best horror sound is the one that turns a head |
| the footstep that isn't hers | her own step clip at `pitch: 0.85`, one every 0.6-0.75 s (hers is ~0.5), 4-7 steps, then it **stops** | in sync with hers the brain files it as her own |
| peak | never more than 3-4× the bed: bed 0.15 → `playSound` 0.6-0.9 with `api.music.duck(0.25, { ms })` under it | 1 peak per 8-12 min, 3 in the whole game |
| silence | a hard cut of **0.8-2.0 s**, always **before** the thing | the return comes in two steps (0.35× then full) — all at once sounds like a light switch |

Beds **add up**: five at 0.3 bury the music. Every repeated one-shot carries
`pitch: 0.92 + api.random() * 0.16`, or ten repeats turn into a chainsaw.

## tool → the fear it produces

| tool | the fear it produces |
| --- | --- |
| short fog (`far` 18-28) | anticipation — fear of what's behind it |
| off-screen sound | vigilance — fear of turning your head |
| a cut to silence | alarm — something changed and I don't know what |
| isolated amber in a sea of blue | claustrophobia — fear of leaving the circle |
| a footstep that isn't yours | a chase with no monster: cheapest, most effective |
| an overturned chair, a door that closed | presence and loss of control — the place doesn't obey |
| hiding and watching through the crack | chosen tension: she holds her own fear |
| black screen, a scare with no rule | a startle. 1 s, then anger |

## rhythm: rise, hold, release, rise higher

Unbroken tension past ~2 min anaesthetises. No scares in the first 60 s.

| beat | time | light | fog | sound | threat |
| --- | --- | --- | --- | --- | --- |
| safe walk | 40-90 s | amber present, wide sightlines | `far` at full | bed 0.15 + drip | none |
| rise | 30-60 s | kill 1 amber; blue takes over | `far` −30% | bed 0.20 + a new anchor | a hint: a trail, a sound far off |
| hold | 15-40 s | one source, far away | short `near` | **cut to silence** | presence, no shape |
| peak | 3-8 s | contrast, 1 warm source hitting | don't touch it | one big sound + `duck` | seen ≤ 1.5 s |
| release | 20-45 s | amber back, warmer | `far` back | bed returning in 2 steps | genuinely absent |
| rise higher | — | less light than last time | `far` shorter than last time | bed 0.20 + a new layer | closer, less seen |

## the threat: seen little, suggested a lot

Three suggestions (a sound, a trail, a shadow) before one appearance. The first is a silhouette for
**≤ 1.5 s at 12-20 m**, and it leaves on its own — it does not attack on its debut. It owns **three
sounds**: far (announces), near (makes you run), contact — and it never appears without the far sound
first. That rule is what buys the right to frighten again.

At 12 m only outline and movement read: amplitude **15-40°** of travel (`gavi#animar-doutrina`), and
the silhouette must be recognisable as a black line (`gavi#criar-modelo-3d`). Never two identical
encounters — repeating one is teaching the script.

| time on screen | what it becomes |
| --- | --- |
| 0-2 s | terror |
| 3-8 s | a threat — the average encounter lives here |
| 10-20 s | a character. past 30 s a puppet, and the game has lost |

Twenty seconds of presence is only allowed if it is **doing** something: blocking, sniffing, dragging
someone off. Existing on screen is not an action.

## the chase — 20-40 s, and she gets away the first time

Running and being chased are the same physics. What changes is camera and sound. `fov` is a camera
field in **vertical degrees, default 60** — 72 is the +12 that makes the corridor lean in.

```js
// scripts/perseguicao.js — on the PLAYER's body. The stalker locks on with
// api.patchObjectState(playerId, { chased: true }) and drops it with { chased: false }.
const FOV_CALM = 60, FOV_CHASE = 72;         // vertical degrees; 60 is the engine default
const MAX_SECONDS = 34;                      // 20-40 s. two minutes teaches her nobody dies
export const updateSchedule = { every: 2 };  // 15 Hz is plenty for a camera ramp

export function update(dt, api) {
  const s = api.getState();
  const now = api.seconds();                 // the room clock, in seconds
  const live = !!s.chased && now - (s.chaseStart ?? now) < MAX_SECONDS;
  if (live === !!s.inChase) {
    if (live) api.screenShake(0.14, 0.25);   // low and continuous; 0.3+ reads as an earthquake
    return;
  }
  api.patchState({ inChase: live, chaseStart: live ? now : 0 });
  api.setCamera({ fov: live ? FOV_CHASE : FOV_CALM });  // session override, this client only
  if (live) {
    api.playSound('cdn/sfx-respiracao-panico.mp3', { mode: 'restart' });
    api.emit('fear:chase', { on: true });    // the manager owns the music (see the note)
  } else {
    api.emit('fear:chase', { on: false });
    api.notifyDmOnce('chase-1-survived', 'she got out of the first chase — check whether she ran the right way');
  }
}
// Singleplayer: this client IS the authority, so api.music.play here is fine. In multiplayer music
// writes are server-only — emit, and let the manager play the chase layer.
```

Give the camera back at the end (`fov: 60`, or `api.clearCamera()`), keep **an exit visible at
20-30 m** — fleeing with nowhere to go is trial and error, and trial and error kills fear — and let
her escape the first time. Catching her on the debut turns the chase into a mechanic.

## powerlessness with agency

Powerlessness is the theme; agency is the condition. **In any second there is a button that changes
the outcome**, even if it is only hiding and watching. Without it you have a cutscene with a
controller in your hand. Verbs that work: hide and watch, kill the flashlight, lock a door, distract,
watch through a camera. **Hiding needs information** — from inside the wardrobe she SEES (a crack)
and HEARS; blind, it's a loading screen with noise. **One scarce resource, exactly one** (battery,
match, charge) at 60-80% of sufficiency. **Cheap death:** back on her feet in ≤ 5 s near where it hurt.

## the place says someone was here

Per room: **3 objects that narrate + 1 anomaly**. The overturned chair (left in a hurry), the full cup
(was here just now), the trail pointing out of the room. **Narrative is a vector** — the objects point
one way; random mess is a dirty set. **Repetition with one difference:** the same corridor twice, and
the second time the chair is upright. An empty floor reads as a demo (`gavi#fazer-cenario`).

## code 1 — the ambience bed and the cut to silence

```js
// scripts/medo-leito.js — owner of the bed. Nothing else writes `audio` on this entity.
// An invisible manager entity, never the player. Fire it with api.emit('fear:silence', { seconds }).
const BED = { clip: 'cdn/sfx-ambiencia-porao-zumbido.mp3', loop: true, gain: 0.16,
  spatial: false, bus: 'Ambience' };        // 0.12-0.20; above 0.25 it's a sound, not a bed

export function onSpawn(api) {
  api.preloadAsset(BED.clip);               // first use fetches + decodes; warm it here
  api.setProperty('audio', BED);
  api.on('fear:silence', (p, a) => cut(a, p?.seconds ?? 1.2));  // api.on ONLY inside onSpawn
}

function cut(api, seconds) {
  if (api.getState().silenced) return;       // two stacked cuts = a bed that never comes back
  api.patchState({ silenced: true });
  api.setProperty('audio', null);            // null is the eraser: hard cut, the silence IS the event
  api.runInSeconds(seconds, () => {          // never setTimeout
    api.setProperty('audio', { ...BED, gain: BED.gain * 0.35 });
    api.runInSeconds(1.4, () => {
      api.setProperty('audio', BED);
      api.patchState({ silenced: false });
    });
  });
}
```

## code 2 — a lamp that breathes

```js
// scripts/luz-respira.js — a lamp that never sits still. One per room.
export const updateSchedule = { every: 3, near: { tag: 'player', radius: 35 } };
// every: 3 writes at ~10 Hz and the sine sits well under a quarter of that; `near` switches the
// lamp off for free on the other side of the map.
const BASE = 2.2;                    // resting intensity
const BREATH = 0.22;                 // under 0.15 nobody notices; over 0.40 it's party lights
const HZ_A = 0.31, HZ_B = 0.53, TAU = Math.PI * 2;  // never close a cycle: never a metronome

export function onSpawn(api) {
  api.setProperty('light', { kind: 'point', color: 'oklch(0.78 0.13 68)', intensity: BASE, distance: 9 });
  api.patchState({ phase: api.random() * 10 });     // two lamps in phase reads as stage lighting
}

export function update(dt, api) {
  const s = api.getState();
  const t = api.seconds() + (s.phase ?? 0);         // no state writes at 10 Hz
  const breath = 1 + BREATH * (Math.sin(t * HZ_A * TAU) * 0.6 + Math.sin(t * HZ_B * TAU) * 0.4);
  const fail = (s.failingUntil ?? 0) > t ? 0.3 + api.random() * 0.15 : 1;  // a failure NEVER goes to 0
  api.setProperty('light.intensity', BASE * breath * fail);   // dot-path write
}
// From outside: api.patchObjectState(lampId, { failingUntil: api.seconds() + 0.5 }).
// Past ~8 lamps, one batched system drives them all (gavi#programar-de-verdade).
```

## code 3 — the trigger that tightens the scene

```js
// scripts/gatilho-medo.js — spawn ONCE with a shape and { body: 'static', trigger: true }
// (onTriggerEnter needs both, and only the trigger's owner gets the callback):
// api.spawn({ id: 'corridor-trigger', behavior: 'scripts/gatilho-medo.js', properties: {
//   visible: false, feetPosition: { x: -12, z: 40, y: { terrain: 0 } },
//   primitive: { kind: 'box', width: 8, height: 4, depth: 8 },
//   physics: { body: 'static', collider: 'box', trigger: true } } });
const BEFORE = { fog: { kind: 'linear', near: 10, far: 60 } };
const INSIDE = {
  fog: { kind: 'linear', near: 4, far: 22 },                              // the corridor closes in
  ambient: { light: { color: 'oklch(0.60 0.06 255)', intensity: 0.95 } }, // cold, never zero
};

export function onTriggerEnter(other, api) {
  if (!other?.tags?.includes('player')) return;
  if (api.getState().spent) return;                 // an atmosphere trigger fires ONCE
  api.patchState({ spent: true });
  api.patchAtmosphere(INSIDE);                      // a SPEC write: it sticks until you give it back
  api.emit('fear:silence', { seconds: 1.4 });       // the silence comes first
  api.vignette(0.35, 'oklch(0.20 0.05 255)', { decaySeconds: 6 });  // defaults to whoever walked in
  api.music.duck(0.25, { ms: 2600 });
  api.notifyDmOnce('corridor', 'walked into the corridor — see whether she backs out from here');
}

export function onTriggerExit(other, api) {
  if (!other?.tags?.includes('player')) return;
  api.patchAtmosphere(BEFORE);                      // giving it back is mandatory
}
// Multiplayer: patchAtmosphere changes the world for EVERYONE and persists. To tighten the scene for
// one player, push a layer on her client — api.pushAtmosphere(partial, { player, fade }) from a script
// that runs on her, api.clearAtmosphere(id) on the way out (gavi#fazer-multiplayer).
```

## when it breaks — the six tells

| tell (what you'd actually see) | cause | fix |
| --- | --- | --- |
| you can't tell floor from wall in the frame | ambient under 1.0, or `timeOfDay: 0` with no moon | ambient 1.0-1.4 on the cold base; hour 21.5-22.5 + `moon.enabled` |
| the fog is still tight three rooms later, and it survived a reload | `patchAtmosphere` is a spec write and nobody gave it back | restore in `onTriggerExit`, or use `pushAtmosphere` with `{ player, duration }` |
| the monster is on screen and nobody flinches | it's past 10 s and doing nothing | 3-8 s per encounter, and it must block / sniff / drag |
| the first scare lands, the rest are noise | more than 1 peak per 8-12 min, or peaks with no visible cause | one peak per 8-12 min, cause on screen within 3 s, `duck` under it |
| she stands still in a corridor for 40 s | broken visibility budget: no floor at 3 m or no anchor at 20 m | one amber every 15-25 m, `far` ≥ 2× the distance to the next anchor |
| four drips in one room sound like a wall of noise | four spatial `audio:` beds summing | one anchor per feature, `gain 0.25-0.35`, `maxDistance 12-20` |
| the chase is scary once, then it's a routine | it lasts 2 min, or she gets caught on her debut | 20-40 s, exit visible at 20-30 m, let her escape the first time |

Then prove it: headphones, one full run, and `notifyDmOnce` on the corridor, the first chase and the
first death. The heartbeat that matters is **where the person stopped advancing** —
`gavi#cacar-bugs-jogando`.