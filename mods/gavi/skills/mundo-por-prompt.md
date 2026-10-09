---
name: World By Prompt
description: A world generated from one sentence and changed by command while the player stands in it — the Genie 3 bar, built as a spec instead of pixels. The api.job LLM lane, a strict JSON contract that is validated and clamped before it ever touches the world, a fallback world for when the model returns prose, what the player sees while the job cooks, a whitelisted verb router for live world events (weather, hour, carving, building, grade), api.sql as the world's memory with the replay on rejoin, and the consistency rules that keep a generated world from becoming a bag of unrelated assets.
---

# Gavi — the world from a sentence

Genie 3 (DeepMind, Aug 2025) takes a sentence and gives back a navigable photorealistic world at 720p/24fps, holds
consistency for minutes, remembers objects you looked away from, and accepts **promptable world events** mid-session.
Two of those capabilities are buildable here, today, with the API this engine already ships. This file is those two, in
code. The other half of the bar — walk anywhere with no seam, coherent scale and light everywhere — is
`gavi#jogo-3d-nativo` and `gavi#fazer-cenario`.

## pick your row in ten seconds

| the ask | where the code goes | the call |
| --- | --- | --- |
| "generate a world from this sentence" | a **lifecycle** hook (`engine.behaviors`) | `api.job('llm:generate', …)` → validate → `patchTerrain` + `addMark` + `patchAtmosphere` + `spawn` |
| "make it rain / make it night" | manager entity behavior | `api.patchAtmosphere({ clouds, fog, wind, timeOfDay })` |
| "open a cave in that cliff" | manager entity behavior | heightmap: `api.addMark(key, { kind: 'pond' \| 'flatten' … })` · voxel: `api.fillVoxels(min, max, null)` |
| "put a village on that hill" | manager entity behavior | `flatten` + `clear-scatter` marks, then `api.spawn` from a **closed prop registry** |
| "grade the whole screen for the storm" | manager entity behavior | `api.pushLook('scripts/look-storm.js', { params })` / `api.clearLook(id)`, per-player `api.pushAtmosphere` |
| "the world must remember" | lifecycle hook + cron | `api.sql` rows, replayed in `onPlaceStart` |
| the same sentence twice | anywhere | one seed derived from the sentence — `terrain.seed` + `makeSeededRng` |
| an LLM job inside `run_script` | **nowhere** | `api.job()` **throws** in a transaction. It lives in scripts |

## THE HONEST FRAME

**Genie 3 hallucinates frames; this engine generates a spec.** Those are different things: their output is a video
stream with no mesh, no collider and no file — beautiful, and gone the moment the session ends — while ours is durable
geometry with physics that persists, replicates to every player, and can be edited by hand afterwards. The trade is
paid in fidelity: we will never invent a photoreal cliff face from a sentence, and every shape we place has to already
exist as a generator, a primitive or a conjured asset. What we get for it is a world you can build **on**.

So the bar is not "imitate the model". The bar is the five things it delivers to the player: **(1) the world came from a
sentence · (2) no seam, no invisible wall · (3) coherent light, scale and material · (4) the world remembers what you
did · (5) the world changes on command while you stand in it.** This file owns 1, 4 and 5.

## 1 · TEXT → WORLD

The pipeline, and every stage is load-bearing:

> **player sentence → `api.job('llm:generate')` → strict JSON → VALIDATE + CLAMP + WHITELIST → spec writes → live world**

The stage that is always missing in a first attempt is the fourth. An LLM returns prose instead of JSON, invents a mark
kind, puts a landmark at `x: 40000`, asks for `hour: 31`. **A model's output never reaches the spec unchecked.**

### the contract, field by field

| field | type | what it means | the clamp |
| --- | --- | --- | --- |
| `biome` | enum | which **hand-written** generator shapes the ground | must be a key of `BIOMES` — else fallback |
| `seed` | — | never asked for; **derived** from the sentence | `hashSentence(text)` |
| `hour` | number | `atmosphere.timeOfDay` | `clamp(h, 0, 24)`; sky L stays ≥ 0.25 by construction |
| `palette.groundHue` | number | oklch hue for the ground tint | `clamp(0, 360)` — mod, never wrap-negative |
| `palette.groundChroma` | number | oklch chroma | `clamp(0, 0.18)` — above that ground reads radioactive |
| `palette.accentHue` | number | one accent hue, reused by every emissive | `clamp(0, 360)`, and ≥ 60° from ground hue |
| `fogNear` / `fogFar` | number | linear fog | `far` ≥ `near + 120`, `far` ≥ 6× playable radius |
| `marks[]` | array ≤ 6 | terrain carves | `kind` ∈ the seven that exist; `x`/`z` inside `WORLD_R`; `radius`/`width` clamped |
| `landmarks[]` | array ≤ 8 | what to build | `kind` ∈ `PROPS`; position clamped; `scale` 0.6–2.5 |
| `ambience` | enum | the non-spatial bed | one of five clip refs, `gain: 0.25`, `spatial: false` |

**The mark kinds that exist.** Heightmap: `flatten`, `path`, `road`, `river`, `pond`, `ocean`, `clear-scatter`.
Voxel: `flatten`, `pond`, `river`, `path`, `structure`, `clear`. Nothing else. A model that writes `"kind": "canyon"` is
not wrong about the world — it is wrong about the API, and the whitelist is what turns that into a substitution instead
of a rejected patch (`patchTerrain` and the mark verbs are told-failure ⇒ **not-applied**: one bad entry throws the whole
call, so an unchecked list loses the good marks too).

### the gate

```js
// scripts/lib/world-contract.js — nothing generated reaches the spec except through here.
const { clamp } = require('builtin/math');
const { makeSeededRng } = require('builtin/noise');

const WORLD_R = 240;                                    // the playable radius, in metres

// biome → a generator YOU wrote (gavi#fazer-cenario). The model picks a row; it never writes code.
const BIOMES = {
  plains:      { gen: 'scripts/gen/terrain-plains.js',      ground: 'ground_grass', wall: 'ground_rock' },
  alpine:      { gen: 'scripts/gen/terrain-alpine.js',      ground: 'ground_snow',  wall: 'ground_rock' },
  desert:      { gen: 'scripts/gen/terrain-desert.js',      ground: 'ground_sand',  wall: 'ground_rock' },
  archipelago: { gen: 'scripts/gen/terrain-archipelago.js', ground: 'ground_sand',  wall: 'ground_grass' },
  volcanic:    { gen: 'scripts/gen/terrain-volcanic.js',    ground: 'ground_ash',   wall: 'ground_rock' },
};
const MARK_KINDS = ['flatten', 'path', 'road', 'river', 'pond', 'ocean', 'clear-scatter'];
const PROPS = {                                         // landmark kind → YOUR scripted geometry
  tower:  { script: 'scripts/gen/tower.js',  pad: 9,  clear: 11 },
  ruin:   { script: 'scripts/gen/ruin.js',   pad: 7,  clear: 9 },
  camp:   { script: 'scripts/gen/camp.js',   pad: 5,  clear: 7 },
  bridge: { script: 'scripts/gen/bridge.js', pad: 12, clear: 14 },
  monolith: { script: 'scripts/gen/monolith.js', pad: 4, clear: 6 },
};
const BEDS = {
  wind:   'cdn/sfx-ambience-open-wind-loop.mp3',
  forest: 'cdn/sfx-ambience-forest-loop.mp3',
  waves:  'cdn/sfx-ambience-shore-waves-loop.mp3',
  cave:   'cdn/sfx-ambience-cave-drip-loop.mp3',
  none:   null,
};

// The JSON Schema handed to llm:generate. Enums do half the validation for free — and keep the
// schema SMALL: every required field adds seconds to the job.
const WORLD_SCHEMA = {
  type: 'object',
  required: ['biome', 'hour', 'palette', 'marks', 'landmarks', 'ambience'],
  properties: {
    biome: { type: 'string', enum: Object.keys(BIOMES) },
    hour: { type: 'number' },
    fogNear: { type: 'number' },
    fogFar: { type: 'number' },
    palette: {
      type: 'object',
      required: ['groundHue', 'groundChroma', 'accentHue'],
      properties: { groundHue: { type: 'number' }, groundChroma: { type: 'number' }, accentHue: { type: 'number' } },
    },
    marks: {
      type: 'array', maxItems: 6,
      items: {
        type: 'object', required: ['kind', 'x', 'z'],
        properties: {
          kind: { type: 'string', enum: MARK_KINDS },
          x: { type: 'number' }, z: { type: 'number' },
          radius: { type: 'number' }, width: { type: 'number' },
        },
      },
    },
    landmarks: {
      type: 'array', maxItems: 8,
      items: {
        type: 'object', required: ['kind', 'x', 'z'],
        properties: {
          kind: { type: 'string', enum: Object.keys(PROPS) },
          x: { type: 'number' }, z: { type: 'number' }, scale: { type: 'number' },
        },
      },
    },
    ambience: { type: 'string', enum: Object.keys(BEDS) },
  },
};

// One seed from the sentence: the same words give the same world, forever. FNV-1a, 32-bit.
function hashSentence(text) {
  let h = 0x811c9dc5;
  const s = String(text ?? '').trim().toLowerCase();
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = (h * 0x01000193) >>> 0; }
  return h;
}

// THE FALLBACK WORLD. Not an error screen — a real, playable, deliberately plain world.
function fallbackWorld(text) {
  const seed = hashSentence(text || 'a quiet green valley');
  const rng = makeSeededRng(seed);
  return {
    ok: false, seed, biome: 'plains', hour: 10.5,
    palette: { groundHue: 142, groundChroma: 0.09, accentHue: 62 },
    fogNear: 300, fogFar: 700,
    marks: [{ kind: 'pond', x: Math.round(rng.range(-60, 60)), z: Math.round(rng.range(30, 90)), radius: 12 }],
    landmarks: [{ kind: 'tower', x: 0, z: -70, scale: 1.4 }],
    ambience: 'wind', issues: ['fallback'],
  };
}

// The gate proper. Never throws — it always returns a world you can build.
function validateWorld(raw, text) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return fallbackWorld(text);
  const issues = [];
  const num = (v, lo, hi, dflt) => (typeof v === 'number' && Number.isFinite(v) ? clamp(v, lo, hi) : (issues.push('num'), dflt));
  const inRing = (v) => clamp(typeof v === 'number' && Number.isFinite(v) ? v : 0, -WORLD_R, WORLD_R);

  const biome = Object.prototype.hasOwnProperty.call(BIOMES, raw.biome) ? raw.biome : (issues.push(`biome:${String(raw.biome)}`), 'plains');
  const p = raw.palette && typeof raw.palette === 'object' ? raw.palette : {};
  const groundHue = num(p.groundHue, 0, 360, 142);
  let accentHue = num(p.accentHue, 0, 360, 62);
  if (Math.abs(((accentHue - groundHue + 540) % 360) - 180) > 120) accentHue = (groundHue + 150) % 360;  // ≥ 60° apart

  const near = num(raw.fogNear, 20, 900, 300);
  const far = Math.max(num(raw.fogFar, 60, 3000, 700), near + 120);

  const marks = (Array.isArray(raw.marks) ? raw.marks : []).slice(0, 6)
    .filter((m) => m && MARK_KINDS.includes(m.kind) || (issues.push(`mark:${String(m && m.kind)}`), false))
    .map((m) => ({
      kind: m.kind, x: inRing(m.x), z: inRing(m.z),
      radius: num(m.radius, 4, 60, 12), width: num(m.width, 2, 14, 3),
    }));

  const landmarks = (Array.isArray(raw.landmarks) ? raw.landmarks : []).slice(0, 8)
    .filter((l) => l && Object.prototype.hasOwnProperty.call(PROPS, l.kind) || (issues.push(`prop:${String(l && l.kind)}`), false))
    .map((l) => ({ kind: l.kind, x: inRing(l.x), z: inRing(l.z), scale: num(l.scale, 0.6, 2.5, 1) }));

  return {
    ok: issues.length === 0,
    seed: hashSentence(text), biome,
    hour: num(raw.hour, 0, 24, 10.5),
    palette: { groundHue, groundChroma: num(p.groundChroma, 0, 0.18, 0.09), accentHue },
    fogNear: near, fogFar: far,
    marks, landmarks,
    ambience: Object.prototype.hasOwnProperty.call(BEDS, raw.ambience) ? raw.ambience : 'wind',
    issues,
  };
}

module.exports = { BIOMES, MARK_KINDS, PROPS, BEDS, WORLD_SCHEMA, validateWorld, fallbackWorld, hashSentence, WORLD_R };
```

### the applier

Terrain and atmosphere are **spec writes** — durable, replicated, and idempotent by key. Props are runtime spawns and
are **not** (see §4). Order matters exactly as in `gavi#fazer-cenario`: ground → flatten → carves → atmosphere → props.

```js
// scripts/lib/world-apply.js
const { BIOMES, PROPS, BEDS } = require('lib/world-contract');

const okl = (l, c, h) => `oklch(${l.toFixed(3)} ${c.toFixed(3)} ${Math.round(h)})`;

function applyWorld(api, w) {
  const biome = BIOMES[w.biome];

  // 1. the ground: ONE hand-written generator + the sentence's seed. The model chose the row.
  api.patchTerrain({ generator: biome.gen, seed: w.seed });

  // 2. the palette, once, as a TINT on material ids that already exist and already carry their
  //    texture. Never mint or re-texture ids per generation — see the failure table.
  api.patchTerrain({
    updateMaterials: {
      [biome.ground]: { tint: okl(0.62, w.palette.groundChroma, w.palette.groundHue) },
      [biome.wall]:   { tint: okl(0.48, w.palette.groundChroma * 0.5, w.palette.groundHue) },
    },
  });

  // 3. spawn pad first, always — a player must not arrive on a cliff.
  api.addMark('gen-spawn-pad', {
    kind: 'flatten', center: { x: 0, z: 0 }, height: { terrain: 0 },
    shape: { kind: 'circle', radius: 14 }, falloff: 10, falloffCurve: 'smooth',
  });

  // 4. the carves. addMark is add-or-REPLACE by key, so replaying this list is idempotent.
  w.marks.forEach((m, i) => {
    const key = `gen-mark-${i}`;
    if (m.kind === 'pond') api.addMark(key, { kind: 'pond', center: { x: m.x, z: m.z }, radius: m.radius, depth: 2.2, bankMaterial: biome.ground });
    else if (m.kind === 'path') api.addMark(key, { kind: 'path', points: [[0, 0], [m.x, m.z]], width: m.width, material: biome.wall, edgeMaterial: biome.ground, noise: 0.35, falloff: 1.5 });
    else if (m.kind === 'road') api.addMark(key, { kind: 'road', points: [[0, 0], [m.x, m.z]], width: Math.max(4, m.width), material: biome.wall, clearScatter: true });
    else if (m.kind === 'river') api.addMark(key, { kind: 'river', points: [[m.x, -m.z], [m.x, m.z]], width: Math.max(4, m.width), depth: 2, bankMaterial: biome.ground });
    else if (m.kind === 'flatten') api.addMark(key, { kind: 'flatten', center: { x: m.x, z: m.z }, height: { terrain: 0 }, shape: { kind: 'circle', radius: m.radius }, falloff: m.radius * 0.5, falloffCurve: 'smooth' });
    else if (m.kind === 'clear-scatter') api.addMark(key, { kind: 'clear-scatter', center: { x: m.x, z: m.z }, shape: { kind: 'circle', radius: m.radius } });
    // 'ocean' is deliberately absent from the live lane: liquidLevel is an ABSOLUTE Y that drowns
    // whatever it covers. An ocean is authored with the world, never bolted on by a prompt.
  });

  // 5. atmosphere: an HOUR, not a cycle. The physical sky derives its own sun and ambient.
  api.patchAtmosphere({
    sky: { kind: 'realistic', model: 'hosek' },
    timeOfDay: w.hour,
    fog: { kind: 'linear', near: w.fogNear, far: w.fogFar },
    clouds: { density: 0.35, opacity: 0.8, speed: 0.6 },
    wind: { direction: [0.7, 0.3], speed: 1.1 },
    stars: { enabled: true, milkyWay: 0.35 },
  });

  // 6. the props. Pad + clear-scatter BEFORE each one, or grass grows through the floor.
  const spawned = [];
  w.landmarks.forEach((l, i) => {
    const def = PROPS[l.kind];
    api.addMark(`gen-pad-${i}`, { kind: 'flatten', center: { x: l.x, z: l.z }, height: { terrain: 0 }, shape: { kind: 'circle', radius: def.pad }, falloff: def.pad * 0.6, falloffCurve: 'smooth' });
    api.addMark(`gen-clear-${i}`, { kind: 'clear-scatter', center: { x: l.x, z: l.z }, shape: { kind: 'circle', radius: def.clear } });
    const id = api.spawn(`gen-prop-${i}`, {
      tags: ['generated'],
      properties: {
        feetPosition: { x: l.x, z: l.z, y: { terrain: 0 } },   // pinned: survives every later terrain edit
        rotation: { lookAt: { x: 0, z: 0, y: { terrain: 0 } } },
        scale: l.scale, physics: 'static',
        primitive: { kind: 'scripted', script: def.script, seed: (w.seed + i) >>> 0 },
      },
    });
    spawned.push({ id, kind: l.kind, x: l.x, z: l.z, scale: l.scale });
  });

  // 7. one bed, non-spatial, 0.25. Two of them stack into hiss.
  const clip = BEDS[w.ambience];
  if (clip) {
    api.preloadAsset(clip);
    api.spawn('gen-bed', { tags: ['generated'], properties: { feetPosition: { x: 0, z: 0, y: { terrain: 2 } }, audio: { clip, loop: true, gain: 0.25, spatial: false } } });
  }
  return spawned;
}

module.exports = { applyWorld };
```

### the caller

`api.job()` **throws inside `run_script`** ("jobs live in behavior scripts"). And in a **lifecycle** hook the `llm:*`
jobs run on an immediate lane you can `await` — which is also the only lane that has `api.sql`. So genesis belongs in
`engine.behaviors`, not in a `run_script` and not on the player.

```js
// scripts/world-genesis.js — registered with api.patchEngine({ behaviors: ['scripts/world-genesis.js'] })
const { WORLD_SCHEMA, validateWorld, fallbackWorld, hashSentence } = require('lib/world-contract');
const { applyWorld } = require('lib/world-apply');

const SYSTEM = [
  'You lay out a small game world. Answer ONLY with the JSON object of the given schema.',
  'x and z are metres from the origin, between -240 and 240; the origin is the spawn and must stay clear.',
  'Landmarks: one tall thing that can be seen from anywhere, then 2-5 smaller ones. Never stack two at the same point.',
  'hour is 0-24: 10.5 welcoming, 17.5 epic, 6.5 melancholy, 21.5 oppressive.',
].join(' ');

export async function onPlaceStart(api, placeId) {
  const { rows } = await api.sql`SELECT prompt, json FROM worlds WHERE place = ${placeId} ORDER BY ts DESC LIMIT 1`;
  if (rows.length > 0) return replay(api, placeId, rows[0]);   // §4: the world remembers
  await generate(api, placeId, 'a green valley under a low ridge, one broken tower');
}

export async function generate(api, placeId, sentence) {
  let world;
  try {
    const ref = api.job('llm:generate', {
      conversationId: `worldgen:${placeId}:${hashSentence(sentence)}`,  // a one-shot id: no history to contradict
      system: SYSTEM,
      message: `Lay out this world: "${sentence}"`,
      schema: WORLD_SCHEMA,
      model: 'smart',                                          // 4+ required fields — 'fast' fumbles the nesting
    }, undefined, { dedupeKey: `worldgen:${placeId}`, retries: 1 });
    const result = await api.awaitJob(ref);
    // result.data.object is the parsed JSON; .text is the raw reply. Prose ⇒ object is undefined.
    world = validateWorld(result.ok ? (result.data && result.data.object) : null, sentence);
    if (!result.ok) api.warn('worldgen job failed', result.error);
  } catch (err) {
    world = fallbackWorld(sentence);
    api.warn('worldgen threw', String(err));
  }
  if (world.issues.length > 0) api.log('worldgen clamped', world.issues);

  const props = applyWorld(api, world);
  await api.sql`INSERT INTO worlds (place, prompt, seed, json, ts) VALUES (${placeId}, ${sentence}, ${world.seed}, ${JSON.stringify({ world, props })}, ${api.getWallClockTimestamp()})`;
  api.notifyDm(`world generated from "${sentence}" — biome ${world.biome}, ${props.length} landmarks, ${world.issues.length} clamped fields`);
}
```

## 2 · ASYNC DISCIPLINE — what the player sees while it cooks

`api.job()` is **off-loop**: the frame never blocks and the callback settles at a tick boundary, in the same phase as
behaviour code, so you mutate state there and not inside the job. The danger is not a frozen screen — it is an **empty
one**, and a player staring at flat ground for eight seconds with no explanation decides the game is broken.

| stage | how long, honestly |
| --- | --- |
| `llm:chat`, `model: 'fast'` | ~1–4 s |
| `llm:generate`, 6 required fields, `'smart'` | ~5–15 s. Every required field costs |
| the terrain rebuild after `patchTerrain` | not instant either: chunks re-mesh and stream. `api.getWorldResidency()` reads `{ resident: false, pending: n }` while they do |

The five rules:

1. **Never submit twice.** A flag in state before the call, cleared in the callback on **both** paths, plus
   `{ dedupeKey }` so a rapid double-click cancels the older job instead of building two worlds.
2. **Say what is happening, with a number.** `api.patchState({ genStage: 'reading', genPct: 0.15 })` and let `ui.js`
   render it. Three honest stages beat a spinner: *reading the sentence* → *shaping the ground* → *placing the world*.
3. **Give the wait a floor.** Ship a plain world first (`fallbackWorld`'s shape costs nothing) and let the generated one
   land on top, or hold the player in a lobby place / behind a veil. Empty ground is the one thing you may not show.
4. **Gate the reveal on residency, not a timer.** `const { resident } = api.getWorldResidency()` — the renderer's own
   verdict, per machine. Lift the veil when it flips true.
5. **Report the failure as a beat, not an error.** Fallback world + `api.toast('the words came out crooked — here is a
   valley instead', { duration: 3 })`. The player keeps playing; `api.notifyDm` tells Gavi what broke
   (`gavi#memoria-infinita`).

```js
// scripts/world-prompt.js — on the PLAYER. The sentence only ever becomes state here.
export function onInput(input, api) {
  const text = input.actions.worldPrompt ? String((input.actionData && input.actionData.worldPrompt && input.actionData.worldPrompt.text) || '') : '';
  if (!text || api.getState().genBusy) return;
  api.patchState({ genBusy: true, genStage: 'reading', genPct: 0.1, worldPrompt: { text, at: api.getTick() } });
  api.toast('reading your world…', { duration: 2 });
}
// inputs.actions.worldPrompt = {} — a UI-only action; ui.js fires sendAction('worldPrompt', { text }).
```

## 3 · PROMPTABLE WORLD EVENTS

The player says *make it rain*, *open a cave in that cliff*, *put a village on the hill* — mid-session, standing there,
and it happens. This is the capability that makes people screenshot.

**Why a whitelist and never free-form spec writing.** Handing a model the spec is handing it your world's integrity: it
will write a key that does not exist, an absolute Y that drowns the map, a 400 m radius, a script path that isn't there —
and `patchTerrain` is told-failure ⇒ not-applied, so one bad field throws away the whole patch. The model is good at
exactly one thing here: **mapping a sentence onto an intent**. So it chooses a **verb** from a list of eight and fills
in **arguments** that you clamp. The verb's body is code you wrote and tested. The LLM chooses; it never authors.

```js
// scripts/world-events.js — on ONE manager entity: { realm: 'server', behavior: 'scripts/world-events.js' }.
// realm:'server' means the place HOST simulates it — one machine, so two players' prompts serialize
// instead of racing the spec (gavi#fazer-multiplayer).
const { clamp } = require('builtin/math');
const { BIOMES, PROPS } = require('lib/world-contract');

export const updateSchedule = { every: 15 };                   // half a second at 30 Hz — a prompt is not a frame

const VERBS = ['weather', 'hour', 'carve', 'raise', 'build', 'water', 'grade', 'quiet'];

const EVENT_SCHEMA = {
  type: 'object', required: ['verb'],
  properties: {
    verb: { type: 'string', enum: VERBS },
    hour: { type: 'number' },
    strength: { type: 'number' },                              // 0..1, the only intensity knob
    x: { type: 'number' }, z: { type: 'number' }, radius: { type: 'number' },
    prop: { type: 'string', enum: Object.keys(PROPS) },
    count: { type: 'number' },
  },
};

export function update(dt, api) {
  const s = api.getState();
  if (s.busy) return;
  for (const p of api.query({ tags: ['player'] })) {           // players write their OWN state; we read it
    const req = p.state && p.state.worldPrompt;
    if (!req || !req.text) continue;
    if ((s.consumed || {})[p.id] === req.at) continue;         // remember what we consumed; never write their state
    api.patchState({ busy: true, consumed: { ...(s.consumed || {}), [p.id]: req.at } });
    ask(api, p, req.text);
    return;                                                    // one prompt per pass
  }
}

function ask(api, player, text) {
  api.job('llm:generate', {
    conversationId: `worldevent:${api.getRoomId()}`,           // stable id = it remembers the last change
    system: 'Map the player request onto ONE verb and its arguments. Answer only with the schema JSON. x/z are metres from origin, -240..240. strength is 0..1.',
    message: text,
    schema: EVENT_SCHEMA,
    model: 'fast',                                             // a small schema — fast is enough, ~1-3 s
  }, (result) => {
    api.patchState({ busy: false });
    const e = (result.ok && result.data && result.data.object) || null;
    // SCREEN juice cannot be aimed at another player in multiplayer: audience targeting is
    // self-only, and a manager's toast for player X reaches nobody but a teaching fault in
    // getLogs(). Publish the verdict in the MANAGER's replicated state instead and let the
    // player's own script toast it (gavi#fazer-multiplayer).
    api.patchState({ lastVerdict: { player: player.id, verb: e ? e.verb : null, at: api.getTick() } });
    if (!e || !VERBS.includes(e.verb)) { api.log('worldevent unmapped', result.data && result.data.text); return; }
    run(api, e, player);
  }, { dedupeKey: `worldevent:${api.getRoomId()}`, retries: 1 });
}

function run(api, e, player) {
  const R = 240;
  const x = clamp(Number(e.x) || 0, -R, R), z = clamp(Number(e.z) || 0, -R, R);
  const rad = clamp(Number(e.radius) || 12, 3, 40);
  const k = clamp(Number(e.strength) || 0.6, 0, 1);
  const stamp = api.uniqueId('ev');

  switch (e.verb) {
    case 'weather':                                            // rain / storm / clear
      api.patchAtmosphere({
        clouds: { density: 0.25 + k * 0.6, opacity: 0.7 + k * 0.25, speed: 0.5 + k * 1.5 },
        fog: { kind: 'exp2', density: 0.004 + k * 0.02 },       // changing fog.kind REPLACES the fog object
        wind: { direction: [0.7, 0.3], speed: 0.8 + k * 3 },
      });
      // the drops themselves are a particle program (the `fx` skill), spawned above the player and
      // riding with them; the verb owns the sky, the sound and the grade.
      if (k > 0.25) {
        const fx = api.spawnFx({ x: player.feetPosition.x, y: player.feetPosition.y + 22, z: player.feetPosition.z },
          'scripts/effects/rain.fx.js', { params: { density: k }, attachTo: player.id, tags: ['generated'] });
        api.patchState({ rainFx: fx });
        api.playSound('cdn/sfx-ambience-rain-loop.mp3', { volume: 0.25 + k * 0.2, loop: true, bus: 'Ambience' });
      } else if (api.getState().rainFx) { api.stopFx(api.getState().rainFx); api.patchState({ rainFx: null }); }
      break;

    case 'hour':                                               // "make it night"
      api.patchAtmosphere({ timeOfDay: clamp(Number(e.hour), 0, 24), sky: { kind: 'realistic', model: 'hosek' } });
      break;

    case 'carve':                                              // "open a cave / a hollow in that cliff"
      // HEIGHTMAP HAS NO UNDERSIDE — one Y per column, so a real cave is unrepresentable. The honest
      // shape is a walkable pit: a terrain-relative flatten cut below the ground, with a ramp in.
      api.addMark(`carve-${stamp}`, {
        kind: 'flatten', center: { x, z }, height: { terrain: -(2 + k * 6) },
        shape: { kind: 'circle', radius: rad }, falloff: rad * 0.8, falloffCurve: 'linear',
        material: BIOMES.plains.wall,
      });
      api.addMark(`carve-clear-${stamp}`, { kind: 'clear-scatter', center: { x, z }, shape: { kind: 'circle', radius: rad + 3 } });
      // On VOXEL terrain a cave is literal and one call: api.breakVoxels({x:x-rad,y:h-8,z:z-rad},{x:x+rad,y:h,z:z+rad})
      break;

    case 'raise':                                              // "raise a hill here"
      api.addMark(`raise-${stamp}`, {
        kind: 'flatten', center: { x, z }, height: { terrain: 4 + k * 14 },
        shape: { kind: 'circle', radius: rad }, falloff: rad * 1.6, falloffCurve: 'smooth', maxGrade: 0.5,
      });
      break;

    case 'build': {                                            // "put a village on that hill"
      const def = PROPS[e.prop] || PROPS.camp;
      const n = clamp(Math.round(Number(e.count) || 3), 1, 6);
      api.addMark(`build-pad-${stamp}`, { kind: 'flatten', center: { x, z }, height: { terrain: 0 }, shape: { kind: 'circle', radius: rad }, falloff: rad * 0.6, falloffCurve: 'smooth' });
      api.addMark(`build-clear-${stamp}`, { kind: 'clear-scatter', center: { x, z }, shape: { kind: 'circle', radius: rad + 2 } });
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2, r = rad * 0.55;
        api.spawn(`${stamp}-${i}`, {
          tags: ['generated'],
          properties: {
            feetPosition: { x: x + Math.cos(a) * r, z: z + Math.sin(a) * r, y: { terrain: 0 } },
            rotation: { lookAt: { x, z, y: { terrain: 0 } } }, physics: 'static',
            primitive: { kind: 'scripted', script: def.script, seed: (i * 977 + 13) >>> 0 },
          },
        });
      }
      break;
    }

    case 'water':                                              // "flood this valley" — pond finds its OWN level
      api.addMark(`pond-${stamp}`, { kind: 'pond', center: { x, z }, radius: rad, depth: 1 + k * 4, bankMaterial: BIOMES.plains.ground });
      break;

    case 'grade': {                                            // the screen's own mood, per player
      const id = api.pushLook('scripts/look-storm.js', { params: { mix: k }, duration: 60, player: player.id });
      api.patchState({ lookId: id });
      break;
    }

    case 'quiet':                                              // the undo verb — every event set needs one
      api.patchAtmosphere({ clouds: { density: 0.3, opacity: 0.8, speed: 0.6 }, fog: { kind: 'linear', near: 300, far: 700 }, wind: { speed: 1 } });
      if (api.getState().rainFx) api.stopFx(api.getState().rainFx);
      if (api.getState().lookId) api.clearLook(api.getState().lookId);
      api.patchState({ rainFx: null, lookId: null });
      break;
  }
  // World-ANCHORED juice needs no audience — it reaches every nearby player on its own.
  api.playSoundAt('cdn/sfx-world-shift-low-boom.mp3', { x, y: api.getTerrainHeight(x, z) || 0, z }, { volume: 0.6, maxDistance: 90 });
  api.notifyDmOnce(`worldevent:${e.verb}`, `a player changed the world with "${e.verb}"`);
}
```

Notes the code carries and you must not lose: `addMark` is **add-or-replace by key**, so every event key is unique
(`api.uniqueId`) and every replay is idempotent. `updateMark` **throws** on a key that does not exist — use it only to
adjust a mark you know is there. A `flatten` mark **overrules the generator** inside its own area forever. And there is
no `atmosphere.rain`: weather is clouds + fog + wind + an `fx` program + sound + grade, assembled.

## 4 · PERSISTENCE — the world remembers

| what | survives a reload? | why |
| --- | --- | --- |
| `patchTerrain`, `addMark`, `updateMaterials`, `patchAtmosphere` | **yes** | spec writes: they fold into the game spec, replicate, and persist |
| `api.spawn` from a behavior | **no** | runtime entities. Reload and the village is gone |
| `api.pushLook` / `api.pushAtmosphere` | **no**, by design | client-local layers; they clear on place change |
| `api.spawnFx` | **no** | and it dies with whatever it was attached to |
| player state (`patchState`) | replicated, not durable | the durable copy is a row |

So the memory is not automatic: **the ground remembers itself, the props do not.** One table for the world, one for the
event log, and `onPlaceStart` replays them.

```js
// scripts/world-journal.js — engine.crons: [{ schedule: '*/2 * * * *', script: 'scripts/world-journal.js' }]
// An entity behavior in multiplayer NEVER gets api.sql (hooks run in player context; no player holds
// the database). Three lanes only: lifecycle hooks, crons, run_script. So the manager records events
// in its own replicated state and this cron drains them.
export async function cron(api) {
  await api.sql`CREATE TABLE IF NOT EXISTS worlds (id INTEGER PRIMARY KEY AUTOINCREMENT, place TEXT, prompt TEXT, seed INTEGER, json TEXT, ts INTEGER)`;
  await api.sql`CREATE TABLE IF NOT EXISTS world_events (id INTEGER PRIMARY KEY AUTOINCREMENT, place TEXT, seq INTEGER, verb TEXT, args TEXT, ts INTEGER)`;

  const mgr = api.getObjectState('world-manager');
  const pending = (mgr && mgr.journal) || [];
  if (pending.length === 0) return;
  for (const e of pending.slice(0, 40)) {                       // ≤ 64 statements per call; batch, never per-click
    await api.sql`INSERT INTO world_events (place, seq, verb, args, ts) VALUES (${e.place}, ${e.seq}, ${e.verb}, ${JSON.stringify(e.args)}, ${})`;
  }
  api.patchObjectState('world-manager', { journal: pending.slice(40), drainedSeq: pending[Math.min(39, pending.length - 1)].seq });
}
```

```js
// scripts/world-genesis.js (continued) — the replay. Marks are keyed, so replaying is safe.
const { applyWorld } = require('lib/world-apply');

async function replay(api, placeId, row) {
  const saved = JSON.parse(row.json);
  applyWorld(api, saved.world);                                 // spec writes land identically; props respawn
  const { rows } = await api.sql`SELECT verb, args FROM world_events WHERE place = ${placeId} ORDER BY seq ASC LIMIT 500`;
  for (const e of rows) replayEvent(api, e.verb, JSON.parse(e.args));   // in ORDER — the last "make it night" wins
  api.log(`world replayed: ${saved.props.length} props, ${rows.length} events`);
}
```

Four rules the rows have to obey:

1. **Order, not a bag.** Events replay in `seq` order and the last writer of a field wins. Store the sequence.
2. **Fence stale writers.** Two tabs, one player: `AND session_seq >= ${api.sessionSeq}` on the save row
   (`gavi#genero-sandbox`).
3. **Cap the log and fold it.** 500 events replayed on every place start is a slow start; fold the log into a fresh
   `worlds` row periodically and truncate.
4. **`await api.sql.backup('before-regenerating')` before any destructive regeneration.** Free, instant, and the only
   thing between a bad prompt and a lost world.

## 5 · CONSISTENCY — one world, not a bag of assets

The failure that makes generated worlds feel cheap is not ugliness, it is **incoherence**: eight things from eight
different worlds standing in the same field. Five mechanical rules, none of them a matter of taste:

1. **One palette, derived once, reused everywhere.** `palette.groundHue` tints the ground; `accentHue` is the *only*
   accent hue, and every emissive in the world uses it. Two hues, held for the whole session.
2. **One light.** The hour is a single number and the physical sky derives sun, ambient and reflection from it — never
   author `sun` / `ambient` / `hemisphere` alongside it, and never move the sun per frame. Every shadow in the world
   points the same way for free.
3. **One seed, derived from the sentence.** `hashSentence(text)` → `terrain.seed` and every prop's
   `primitive.seed`. The same sentence gives the same world tomorrow; a changed word gives a new one. This is the whole
   reproducibility story and it costs six lines.
4. **The style family is locked at the top, before the first asset.** One moodboard namespace for the whole
   world — `/cdn/moodboard-lowpoly-cozy/…` — and every conjure in the session goes under it. Mixing families inside one
   generated world is the "bag of assets" look, exactly (`gavi#criar-modelo-3d`, `gavi#modelo-qualquer-estilo`).
5. **The prop registry is closed and pre-built.** Five to ten scripted-geometry props that already share a palette and a
   scale, and the model picks among them. A world assembled from things that were designed together reads designed;
   a world assembled from things conjured on demand, per prompt, never does.

And the landmark law from `gavi#fazer-cenario` still binds a generated world: **one thing tall enough to orient by, from
anywhere.** Force it in the applier — if the model's landmark list has nothing over 10 bodies, plant one yourself.

## how it goes wrong

| symptom | the cause | the fix |
| --- | --- | --- |
| `result.data.object` is `undefined` and the world is blank | the model answered **prose**, not JSON — `llm:chat` never returns an object at all, and even `llm:generate` can fumble a deep schema | `validateWorld` returns the **fallback world** for any non-object; keep the schema shallow, enums everywhere, `model: 'smart'` for 4+ required fields; log `result.data.text` to see what it actually said |
| `patchTerrain() rejected for place "main": …` and **nothing** landed | a mark kind, material entry or key that does not exist. Terrain writes are told-failure ⇒ not-applied: one bad field throws the whole call | whitelist `kind` against the seven heightmap kinds (six voxel ones) **before** the call; validate the whole list, then write |
| the world came out flat — right materials, no shape | `patchTerrain({ generator })` landed but a **`flatten` mark overrides the generator inside its own area**; or the biome fell back to `plains` silently | check `world.issues` for `biome:*`; keep pads small (`radius ≤ 14`) and confirm the generator ref exists in `spec.scripts` — a missing script leaves flat ground |
| the second prompt contradicted the first: a desert with grass still growing | terrain material ids are **sticky** — an id that has ever carried a texture keeps it (`updateMaterials` merges and silently drops `null`; `addMaterials` on a removed id resurrects the archived record). And the old marks are still there | one **fixed** material id per surface role, textured once at install; per-world change is `tint` only. Before regenerating, `api.removeMark([...keys])` every `gen-*` key and `api.destroy` every `tags: ['generated']` prop |
| the job never returned; the UI spins forever | `result.ok: false` with `stale`/`stuck`, a callback that only cleared the busy flag on success, or `api.job` called from `run_script` (it **throws** there) | clear the flag on **both** paths, `retries: 1` + `dedupeKey`, and keep genesis in a lifecycle hook / behavior — never a `run_script` |
| the terrain edit landed but nothing rendered | chunks are still streaming — `api.getWorldResidency()` reads `{ resident: false, pending: n }` — or the props were **runtime spawns lost on reload**, or a `visible: false` veil never lifted | gate the reveal on `resident`, replay props from `api.sql` in `onPlaceStart`, and confirm with `getLogs()` rather than by staring |

## THE LAWS

1. **A model's output never reaches the spec unchecked.** Parse → whitelist → clamp → apply. The validator is the
   feature; the prompt is not.
2. **The LLM chooses a verb, never writes code.** A closed verb set with clamped arguments, each verb backed by a call
   you wrote and tested. Free-form spec writing is a world corrupted on the fifth prompt.
3. **There is always a fallback world**, and it is playable and plain — never an error screen, never empty ground.
4. **`api.job()` does not exist in `run_script`.** Genesis lives in `engine.behaviors` (which is also the only lane with
   both the LLM and `api.sql`); live events live on one host-simulated manager entity.
5. **Off-loop is not free.** 1–4 s fast, 5–15 s for a structured generate, plus a chunk rebuild. Three named stages, one
   busy flag cleared on both paths, one `dedupeKey`.
6. **Spec writes remember; runtime spawns do not.** Terrain, marks, materials and atmosphere persist by themselves.
   Props are rows in `api.sql`, replayed in `onPlaceStart`, in `seq` order.
7. **One seed from the sentence.** Same words, same world — or you have a slot machine, not a world.
8. **One palette and one hour for the whole world.** Two hues held all session, the hour deriving every light. Coherence
   is arithmetic, not taste.
9. **Every event verb has an undo.** `quiet` is not optional: a world you can only make worse is a world players stop
   touching.
10. **The heightmap has no underside.** A prompted "cave" is a walkable pit, or it is voxel terrain
    (`api.breakVoxels`) — never a teleport dressed as a hole.
11. **Look at what the sentence built**, from the player's eye, at the game's hour (`gavi#qualidade-sem-falha`,
    `gavi#testar-tudo`). A generated world nobody looked at is a world nobody has seen.

## what this skill refuses

- letting an LLM write a script, a spec patch, a mark, or a material id.
- a prompt console with no fallback world, no busy flag, or no undo verb.
- claiming the engine imitates Genie 3. It does not, and it does something else instead: it keeps what it made.