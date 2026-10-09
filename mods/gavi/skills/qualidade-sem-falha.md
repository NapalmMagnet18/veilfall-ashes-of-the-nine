---
name: Quality Without A Flaw
description: Gavi's quality ruler, the hunt for visual flaws, and the self-review tier above them — the three questions every piece has to pass, the symptom→cause→fix catalogue in this engine's own numbers (ground, z-fighting, winding, an asset still cooking, flat colour, collider, light, shadow, dead texture, billboard, thumb-sized HUD), the instrument that proves each claim, the fresh-eyes critique rounds, the finish that separates a screenshot from a greybox, the hostile-reviewer pass over your own diff, the disqualifying observation you name before you look, the SEEN/BUILT/GUESSED claim ladder, why done is the creator's word, the finishing bar as yes/no tests, and the regression bet you name before shipping a fix. This is the skill a critic loads before judging work — and the one you load before saying done.
---

# Quality without a flaw

this is the ruler. it isn't taste, it's finish: what separates a thing the creator
shows someone from a thing he cleans up later. load this skill when you are going to
**judge** work (yours or a lane's) and when the ask was maximum quality, no visual
flaws.

> **done isn't "it works". done is "i'd screenshot this".**

motion is this one's sister: `gavi#animar-verificar` proves animation. here it is
general visual finish, and the moment the subject turns into body rhythm, you go
there. whether the GAME works end to end — boot, first input, fail state, second run
— is `gavi#testar-tudo`, a different sweep from this one.

## 0 — modo qualidade ultra (sempre ativado)

> **modo qualidade ultra, esforço super avançado, sem defeito algum — ordem da criadora (2026-08-17)**

the ultra mode is not a higher gear this file keeps in reserve — it is the factory state
(`gavi#ser-a-gavi` Law 13), and it binds **every skill in this mod**, not just this one.
under it, every piece of work carries: the four gates on every change (Law 12), §8's
disqualifying check named before looking, §9's ladder — SEEN outranks BUILT outranks
GUESSED — with "done" staying the creator's word (§10), and §12's regression bet before
any fix ships. "sem defeito algum" rendered honestly: **no known defect ships** — one
found mid-work is fixed or said out loud before "done", never shipped silently — and the
unknown ones are hunted with §8 instead of waited for. `/gavi-ultra` switches nothing on;
it says this contract out loud over one named piece of work.

## find your flaw in ten seconds

| what you are looking at | jump to |
|---|---|
| floating, buried, sunk on a slope | §2.1 ground and geometry |
| flickering surface, dark face, grey plastic | §2.2 surface, light and material |
| a conjured model that isn't there | §2.3 CDN asset — and know 404/400 from 429 |
| walking through a wall, a sprite lying flat | §2.4 collider, sprite and UI |
| a thumb-sized button, HUD off the screen | §2.4 — 44 px, 360×640 |
| identical poses in a burst | §2.5 motion → then `gavi#animar-verificar` |
| about to claim something | §3 — one instrument per claim |
| the piece is built and you want it judged | §4 critique rounds — fresh eyes, one flaw |
| "it's all there and it still looks unfinished" | §5 the seven finishing moves |
| you think the creator's choice is wrong | §6 what is NOT a flaw. say the number, build it his way |
| the diff is written and you're about to speak | §7 the self-review pass — eight rows a hostile reviewer flags |
| about to say the word done | §8 the disqualifying check — name what would kill it, then go look |
| about to write a report or a message | §9 the claim ladder — SEEN / BUILT / GUESSED |
| tempted to type "fixed" | §10 done is the creator's word |
| "make it quality like a real game" | §11 the finishing bar, six yes/no tests |
| about to ship a fix | §12 the regression law — name what it could break, check that one thing |
| the ask was ultra — "sem defeito algum" | §0 — the mode is always on; this whole file is its ruler |

---

## 1 — The ruler: three questions

every piece goes through all three, in order, before any "done":

1. **can you read it in motion?** at the real play distance, with the camera moving,
   in a third of a second of looking. silhouette before detail. if it only reads
   standing still, two metres away, in the right light — it doesn't read. measure the
   distance first; a camera 37 m out makes every close-up judgement a lie.
2. **does it look like someone put it there on purpose?** position, rotation and
   scale with intent. nothing on a regular grid without a reason, nothing with its
   back to the player, nothing floating "almost" on the ground.
3. **does what the hand feels match what the eye sees?** looks heavy → falls heavy,
   sounds heavy, shakes the camera. looks solid → has an aligned collider. looks
   climbable → you can climb it.

failed one? it isn't done. it doesn't matter how many lines of code work.

60 fps is finish too — but the answer to an expensive frame is **changing technique**
(one mesh instead of thirty boxes, `api.unionSolid` on a stack of plates, GPU
decorations instead of entities), never shipping less world.

---

## 2 — The catalogue of this engine's visual flaws

most of the quality work is recognising the symptom in 2 seconds.
symptom → likely cause → fix, with a number.

### 2.1 Ground and geometry

| Symptom | Likely cause | Fix |
|---|---|---|
| object floating 0.3–1 m in the air | `feetPosition` was treated as the CENTRE; it is the **base** (the feet) | drop the `+height/2` from your Y; the base already lands on the ground |
| object half buried | absolute Y written by hand, terrain changed afterwards | `feetPosition: { x, z, y: { terrain: 0 } }` — it recalculates and survives terrain edits |
| wide piece with one end in the air on a slope | a single Y for a 10–30 m mesh | in the generator, every foot/post reads `ctx.groundY(x, z)` (local ground Y under that point) |
| the base of a structure showing underneath on a downslope | only the top was conformed | bury the base 0.2–0.5 m: `ctx.groundY(x, z) - 0.35` |
| height guessed as a number | — | `api.getTerrainHeight(x, z)` → metres, or `null` (no terrain in that column; `null` is not 0) |
| two objects passing through each other at the joint | bounds by hunch | `api.getWorldBoundsBox(id)` → `{ min, max, size, center }`. stack B on A at `getWorldBoundsBox(a).max.y`; `size.y` is the standing height. `null` = not known yet (still loading), and a box flagged `geometryPending: true` is the spec placeholder, not the mesh |

```js
// sticks to the ground and survives terrain edits
properties: { feetPosition: { x: 12, z: -40, y: { terrain: 0 } } }
```

### 2.2 Surface, light and material

| Symptom | Likely cause | Fix |
|---|---|---|
| surface flickering/cracking as you walk (z-fighting) | two planes at the SAME Y | separate them by **0.005–0.02 m** (decal on the ground: 0.01; board over a beam: 0.02) |
| dark face on the correct side / inverted lighting | wrong winding — both sides always draw, but the **LIGHT reads the normal** | wind ALL faces counter-clockwise seen from outside, **one single convention** for the whole file |
| a smooth mesh that should have volume | everything painted, nothing geometric | put the form in the silhouette: a radius that undulates, an edge that breaks |
| everything grey-plastic, looks like a maquette | flat colour (vertex colour) outside a flat family | flat families where flat *is* the finish: `lowpoly-cozy`, `voxel-bright`, `pixel-*`. outside them, dress it: `material: { texture: 'cdn/...png', pbr: true, color: 'oklch(...)', roughness: 0.8 }` |
| a repeating texture at the wrong scale | `textureScale` read as a multiplier | `textureScale` is **metres per tile** — 2 means one tile every 2 m, so bigger = larger and sparser. `repeat: [1,1]` = exactly one copy filling the face (signs, posters) |
| flat terrain | terrain material with no albedo | material with `albedo: 'cdn/...png'`, `pbr: true`, `tint` to vary it |
| dead scene, "no mood" | darkness used as mood | **mood comes from COLOUR, never from black** — horror is cold blue, not lights-out. the darkest scene still has to be worth a screenshot |
| horizon blanked out, fog eating everything | exp2 fog with too high a density | fog **softens** the horizon: linear with visible `near`/`far`, or a low exp2. if the distant landmark vanished, you lost your guidance |
| nothing has a shadow, object pasted onto the background | the light doesn't cast | `castShadow`/`receiveShadow` on objects **default to true** — if a shadow is missing, either somebody set them false, or the light has no `shadow: { enabled: true }`. the sun already casts; never enable it twice for daylight |
| shadow on the wrong thing | small props paying for shadows and dirtying the frame | shadow atlas slots are scarce (8/24/48 by tier, none on low-end). turn `castShadow` off on foliage and fine detail, never on the hero |

### 2.3 Conjured asset (CDN)

| Symptom | Likely cause | Fix |
|---|---|---|
| freshly named model invisible | **it's cooking** — the path is generated on the first fetch | wait and look again. the honest sentence is "it's cooking"; "it's there, you can see it" is only said on top of a frame with the thing in it |
| `api.getWorldBoundsBox(id)` → `null` | model still loading in this realm | `null` means "don't know yet", it is **not** "size zero" — re-read later, or use `api.onModelReady(id, cb)` |
| white/pink texture, log `texture-load-failed` | invalid path | HTTP **404** (a name that doesn't exist) and **400** (unpronounceable / content refusal) are DEAD — that URL will never serve. the only way out is a **new filename** |
| an asset that comes back after failing | **429** (queue full), 408, 425 | not dead: it's pressure. wait and re-read, don't rename |
| model changed its look and nobody sees it | a name already served stays frozen forever | new name with a token: `-2`, `-v3`; move the references; the old name keeps serving whoever uses it |
| log `model-load-failed` / `bespoke-geometry-stalled` / `renderer-build-failed` | asset or geometry never reached the client | read the log filtered by that code before restating that it's there |

### 2.4 Collider, sprite and UI

| Symptom | Likely cause | Fix |
|---|---|---|
| player stops in mid-air / walks through a wall | collider off the visual | prove it with `view_live_scene` + `colliders: true` — the wireframe composites over the image, with a live-vs-spec drift read |
| a stair the player cannot climb though colliders exist everywhere | riser above the autostep limit | `api.traverseCheck(from, to)` — it walks the controller's own math and names the blocker: `reason: "riser_exceeds_autostep"`, `detail: { riser: 0.37, maxStep: 0.3 }` |
| complex form with box collision | `collider: 'auto'` on a cut-out mesh | `collider: 'mesh'` (render-exact, **static only**) or a closed prism from the generator's optional `export function collider(ctx)` |
| sprite lying flat on the ground / turning with the body | wrong `billboard` | default is `"yaw"` (rotates on the vertical axis — tree, 2.5D character). `"full"` faces the camera always (spark, light, an overhead bar under a pitched camera). `"none"` respects the rotation (poster on a wall). `upright` is **2D-places only** — in 3D `billboard` owns rotation inheritance |
| overhead label reading tilted from a pitched camera | `billboard: "yaw"` foreshortens under pitch | `"full"` for overhead labels and bars; that is what the engine's own damage floats use |
| a button the thumb misses | target below 44 px | minimum **≥44 px** (`h-11 w-11`); on a phone, 24 px is a coin flip |
| HUD overflowing on a phone | a full-page screen taller than the device | fit-or-scroll: root `overflow-y-auto` + wrapper `min-h-full` (never `h-full`); test target **~360×640** |
| HUD under the notch / under the stick | edge with no breathing room | the engine's own expression: `padding-bottom: max(1rem, var(--spawn-safe-area-bottom, env(safe-area-inset-bottom, 0px)))`. the bottom corners belong to the projected stick |
| HUD colliding with the platform rail | the rail owns the right edge, middle ~300 px | keep HUD and buttons ~150 px clear of the right-edge middle |
| HUD gigantic on one monitor, tiny on another | raw authored px | `api.patchEngine({ ui: { referenceHeight: 1080 } })` — only when that complaint shows up |
| text that doesn't read | size checked at 2 m from the screen | read it at the REAL reading distance; HUD text ≥ `text-sm`, and branch on touch with a CSS media query (`@media (pointer: coarse)`) or responsive classes — `ui.js` returns markup, it has no `window` |

### 2.5 Motion (the summary; the full ruler is `gavi#animar-verificar`)

| Symptom | Likely cause | Fix |
|---|---|---|
| foot sliding on the ground | stride speed ≠ body speed | match cadence to displacement, or lock the foot with IK |
| identical pose frame after frame in the burst | nothing is writing, or the amplitude is minuscule | double the amplitude and look again — that is the cause in 4 out of 5 cases |
| an "animated" joint nobody sees | travel **< 8°** at 6 m | at 6 m one screen pixel is ~6 mm; 8° on a 30 cm forearm is under 7 px, in motion, once. take it to 12–25°, or drop it from the list |
| jitter, body vibrating | sine above ~**1/4 of the write rate** | the tick is **30 Hz**; at `every: 3` the write rate is 10 Hz and the real ceiling is 2.5 Hz |
| bone going through the ground | pose with no floor | no bone below the terrain in ANY frame of the burst |

---

## 3 — How to PROVE instead of assume

every claim has an instrument. a claim with no instrument is a guess in a confident
voice — and that is exactly how a flaw gets shipped.

| what you want to claim | instrument | what it actually proves |
|---|---|---|
| "the player sees this" | `view_live_scene` with no arguments | HIS client's frame, with the UI composited in |
| "it stands up from any angle" | `view_live_scene` with `camera: { position, target }` | a look from any point, without touching his camera. 3D only |
| "the piece itself is good" | `view_live_scene` with `frame: objectId` | a 3/4 portrait framed on its own, in the world |
| "the movement has rhythm" | `view_live_scene` with `burst: { frames: 6, spanSeconds: 2 }` | a filmstrip. **a still photo does NOT prove animation** |
| "there's no invisible wall / the collider matches" | `view_live_scene` + `colliders: true` | the physics wireframe over the image + live-vs-spec drift |
| "the player can actually walk up there" | `api.traverseCheck(from, to)` | the controller's own autostep/slope math, with the blocker named |
| "what is that thing over there?" | `identify_object` by `screen`, `point`, `ray` or `name` | the identity of what is DRAWN right now |
| "the HUD element is on screen" | `identify_object` with `ui: true`, or `read_authored_ui` | the authored UI plane — with HUD delivery receipts. a `camera:` shot never carries UI |
| "the form/the material is right" | `preview_object` | an isolated booth, studio light — **never** valid for confirming a change made in the world |
| "the spec is healthy" | `validate_spec` | schema errors, plus `warnings` naming keys that validate and do **nothing** |
| "there's no hidden error" | `getLogs({ level: 'warn' })` | `texture-load-failed`, `model-load-failed`, `bespoke-geometry-*`, `renderer-*`. takes `{ objectId, behavior, level, since, limit }` |

a finish audit you can run before you ever open the eye — it turns "is anything
floating?" into a number:

```js
// run_script readOnly — the three cheapest finish faults, counted, with the denominator
const objs = api.query({ radius: 400 });
let floating = 0, buried = 0, noSurface = 0;
for (const o of objs) {
  const g = api.getTerrainHeight(o.feetPosition.x, o.feetPosition.z);
  if (g === null) { noSurface++; continue; }
  const gap = o.feetPosition.y - g;
  if (gap > 0.25) floating++;
  else if (gap < -0.25) buried++;
}
return { scanned: objs.length, floating, buried, noSurface };
```

`scanned: 237, floating: 0` is a receipt. `floating: 0` on its own is a sentence.

the law, in two lines:

> **never say done without a receipt.**
> **if the eye failed — no client, no image, booth busy — you say so.**
> describing the frame you expected to see is lying with good intentions.

a frame caption saying an asset is still cooking = the frame is **not final**. do not
certify visuals over pending paint. a "failed to serve" caption is terminal, not
pending: it will never settle — re-conjure under a new filename or read the frame as
final with that paint absent.

---

## 4 — Critique rounds

quality doesn't come out of the first pass. it comes out of the loop:

1. **build** the whole piece, with form, surface and final placement.
2. **call a fresh-eyes `critic`** — it loads this skill and judges against the
   three-question ruler, with a frame in hand. dispatch: `gavi#mandar-enxame`.
3. **fix THE BIGGEST flaw.** one per round, only.
4. **repeat** until the `critic` can't find a flaw worth a round.

rules of the table:

- a `critic` **names one flaw** — the one that ruins the screenshot most. it does not
  write a ten-item shopping list. a list of ten is laziness: nobody knows which one
  to fix.
- **whoever built it doesn't critique their own work.** you already know where to
  look to like what you made. fresh eyes or nothing.
- the `critic` brings the receipt: which frame, which camera, which distance.
- **two rounds with no new flaw = done. five rounds spinning on the same flaw = the
  cause is upstream** — change levels instead of repainting.
- what the rounds taught goes into the record, or round six rediscovers it:
  `gavi#memoria-infinita`.

---

## 5 — The finish that separates a screenshot from a greybox

short and concrete. this is what is missing when "it's all there" and it still looks
unfinished:

1. **a silhouette that reads in backlight.** turn the camera against the sun: the
   form has to be recognisable from the black outline alone.
2. **three levels of detail** — far (mass and silhouette), mid (division of volumes),
   close (mark, joint, wear). miss one and the piece "empties out" at one distance.
3. **evidence that someone was there.** a mark of use, something worn along the
   most-walked path, one object out of place **on purpose**. perfect symmetry is
   emptiness.
4. **ambient sound underneath.** a bed on loop at `gain: 0.3` (one-shots go to 1);
   without it the place feels like a photograph.
5. **an hour of the day chosen on purpose.** `timeOfDay` is 0–24 and the golden hour
   is ONE of twenty-four. pick by the scene, not by habit — and let the physical sky
   derive its own sun and ambient from the hour instead of authoring them.
6. **one accent colour that isn't repeated across the whole world.** if everything is
   a highlight, nothing is. save the most saturated colour for what matters.
7. **one thing moving in the frame** — a flag, smoke, an animal. the eye believes
   what breathes.

---

## 6 — What is NOT a flaw

don't confuse the ruler with taste. these are **right**:

| looks like a flaw | is |
|---|---|
| flat colour inside `lowpoly-cozy`, `voxel-bright`, `pixel-*` | style, and a complete finish inside that family |
| grey volume with no material | greybox — **if it was declared as greybox** and has a time on the clock to become art |
| roughness, noise, grime the creator asked for | his art direction |
| exaggerated silhouette, unrealistic proportions | readability; a game isn't a photograph |
| little on screen, a lot of emptiness | breathing room composed on purpose |

> **correcting the creator's taste isn't quality, it's disobedience.**

if you think his choice costs readability, you say it in one line, with the number,
and you build it his way: "that blue in the HUD drops to 2.1:1 contrast on a phone —
want me to lift the background or keep it?".

---

## The tier above: judging your own work before anyone else has to

§1–§6 judge the thing. §7–§12 judge **the claim you are about to make about the
thing** — which is where most shipped flaws actually come from.

this is the method the strongest coding systems actually run: ground the claim,
predict the failure, try to falsify it, measure, and review your own diff before
anyone else has to. it isn't a personality and it isn't a brand — it's a checklist,
and it is the whole distance between a lane that ships and a lane that says "should
work now".

the split with the sister skill, in one line: **`gavi#testar-tudo` owns the sweep —
what to walk, boot to exit, and the two restart lanes. this file owns the verdict —
whether what you walked earns the word done.**

---

## 7 — The self-review pass

read your own diff in the hostile reviewer's voice, before you type a word to the
creator. eight rows. each is something a good reviewer flags in ten seconds, and each
has a fix you can land before he ever sees it.

| what a hostile reviewer flags | the tell | the fix |
|---|---|---|
| an identifier you never read | you wrote `state.stamina` and never opened the file that writes it | `grep` the name across `scripts/`. can't name the writer? you invented the field |
| a happy path with no null branch | one read, one use, no `if` | every null-answering read gets a branch: `getTerrainHeight` (null = no terrain in that column), `getWorldBoundsBox` (null = not known yet), `getObject` (null = gone), `getCamera` (null on the server), `getChannel`, `getWaterLevelAt`, `getSocket` (`{ resolving: true }`) |
| two writers on one field | a behavior writing `feetPosition` every tick AND a one-off `setObjectProperty` | one owner per field, named in a comment. the other side writes state and the owner reads it — an every-tick writer overwrites a one-off edit on the next tick, forever |
| a magic number with no provenance | `0.031` sitting there alone | the number and where it came from on the same line: `// 1 tick — api.getDeltaTime() reads 0.03 in this room (30 Hz)`. a number measured in the room beats a number from memory |
| a name out of the codebase instead of the fiction | `enemy_02`, `manager3`, `zone_b` | `watcher-at-the-gate`, `bell-tower`, `the-drowned-hall`. players never read ids, but ids decide what you build next: `enemy_02` never grows a behaviour, the watcher does |
| copy-paste that wanted a loop | three near-identical blocks with two numbers different | the differences in an array, one loop over it. the third repetition is a loop, not a decision |
| one edit that renamed AND changed behaviour | it broke and nobody can say which half did it | two edits, in order: rename with behaviour identical, then change behaviour. already merged and broken? `versions` back to the known state and split it |
| dead code left behind | the old function nobody calls, a state key nothing reads | delete it in the same pass. two paths for one job means at 2 a.m. you read the wrong one |

the null-branch row is the one that bites hardest here, because null is the honest
answer far more often than people expect:

```js
// run_script readOnly — the reads that can answer null, answered
const p = api.getPlayers()[0];
const ground = api.getTerrainHeight(p.feetPosition.x, p.feetPosition.z); // null = no terrain in that column
const box = api.getWorldBoundsBox(p.id);                                 // null = not known HERE yet
return { ground, boxKnown: box !== null, pending: box ? box.geometryPending === true : null };
```

in this room that probe answered `ground: 34, boxKnown: false` — the player's own
bounds read null from `run_script`. null is "not known in this realm", never "size
zero". code that divides by `box.size.y` there throws, and a throwing hook kills
everything after it in that script.

> read the diff out loud in the reviewer's voice. the moment you catch yourself saying
> "well, actually" — that's the flaw. he'll say it too, one round later.

---

## 8 — The disqualifying check

the single most useful habit in this file.

before you declare anything done, **name in advance the one observation that would
prove it isn't.** then go make that observation.

"i'll test it" is not that. the check has a tool, an argument, and a number with a
threshold — decided *before* you look. named after, it isn't a check, it's a
rationalisation: whatever the frame shows, you'll accept it.

| the work | the claim | the ONE observation that disqualifies it |
|---|---|---|
| movement | "walk speed is 6 m/s now" | a measured second of holding forward covers < 5.4 m |
| UI | "the stamina bar is on screen" | `read_authored_ui` finds no `#stamina`, or a 0-width rect, or `visible: false` |
| spawn / lifecycle | "waves clean up after themselves" | after two full waves the `mob` count isn't back to 0, or the manager's timer count grew |
| performance | "that's cheaper now" | the creator's own client is still pinned at the ladder floor at the same frame cost |
| visual | "the lantern's on the porch" | the no-argument frame — HIS view — has no lantern in it |

worked, one at a time.

**movement.** two probes, a marked tick apart, holding forward:

```js
// call 1 — mark (copy the three numbers out)
const p = api.getPlayers()[0];
return { tick: api.getTick(), x: p.feetPosition.x, z: p.feetPosition.z };
```

```js
// call 2, ~a second later, still holding forward — call 1's numbers pasted in
const MARK = { tick: 45359, x: 12.4, z: -30.1 };
const q = api.getPlayers()[0];
const secs = (api.getTick() - MARK.tick) * api.getDeltaTime(); // dt = 0.03 in this room
return { secs, mps: Math.hypot(q.feetPosition.x - MARK.x, q.feetPosition.z - MARK.z) / secs };
```

authored 6, threshold 5.4 — the accel ramp eats the first tenths. `mps: 5.9` → done.
`mps: 3.1` → the number never reached the mover, and you go find who else writes
velocity (§7, row three). `api.getObjectVelocity(p.id)` is the cheap second opinion.

**UI.** `read_authored_ui` with `verb: 'rect'`, `selector: '#stamina'`. the answer
carries the HUD delivery receipts in the same payload — compile state, sent count,
applied outcome, lag. healthy receipts with zero matches means the selector missed or
the element never rendered; either way, not done. then the phone number: the rect's
`x + width` has to stay inside 360 with the element whole, and the touch target ≥44 px.

**spawn / lifecycle.** the same probe before wave one and after wave two, with the
denominator in it:

```js
// run_script readOnly
return {
  mobs: api.query({ tags: ['mob'], radius: 100000, select: 'ids' }).length,
  timers: api.getTimers('wave-manager').length,
  tick: api.getTick(),
};
```

`mobs: 0, timers: 0` twice = done. `mobs: 3` = a leak with a face. and the count is
worthless without the sweep size — `{ mobs: 0 }` from a mistyped tag reads exactly
like a clean world (§3's finish audit has the same law).

**performance.** the creator's device answers for itself:

```js
// run_script readOnly — THIS device, in its own words
const h = api.getClientHealth();
return h.clients.map((c) => ({
  who: c.displayName, summary: c.qualitySummary, age: c.ageSeconds,
  rung: c.quality && c.quality.rung,
  frameMs: c.quality && c.quality.frameMs,
  budget: c.quality && c.quality.budgetFrameMs,
}));
```

what it answered in this room, two reads about two minutes apart, same machine:
`rung 5/5, renderScale 0.55, bloom skipped — CPU-leaning at ~23ms/frame vs 12.1ms budget`,
then `rung 2/5, renderScale 1 — ~7ms/frame vs 16.7ms budget`. that spread IS the
lesson: one read is a moment, not a verdict. reports land about every 15 s
(`ageSeconds` says how stale yours is) — read it, wait, read it again, quote the pair.
rung 5 = bottom: the governor has nothing left to give. the receipt for "cheaper" is
`frameMs` falling toward `budgetFrameMs` **and** the rung climbing back — a `probe-up`
or `rung-invariant-restore` row in `recentTransitions`. an entity count either side of
the change (`api.query({ radius: 100000, select: 'ids' }).length` — 422 in this room)
tells you whether you removed work or just moved it.

**visual — and here the law is hard.** the receipt is a frame with the thing in it,
taken from the player's own view: `view_live_scene` with **no arguments**. not a
`camera:` shot you re-aimed until it looked good. not `preview_object` — a different
scene, different light, no behaviors. `identify_object` with `screen: [x, y]` on the
pixel where you claim it is names what is actually drawn there; if it names the porch
and not the lantern, that's your disqualification in one call.

> **"the code says it is there" is not a sighting.** spec present + `validate_spec`
> green + `getLogs()` quiet is BUILT, and BUILT has never once proved a pixel.

when the observation you named cannot be made — no client, booth busy, no image came
back — the claim stays BUILT and you say the eye failed. that's §9.

---

## 9 — The claim ladder

say only what you can back, and label the rest. three tiers, and every sentence in a
report or a message to the creator carries its own:

| tier | what earns it | how it sounds |
|---|---|---|
| **SEEN** | a frame you took, a number you measured, or the creator said so | "took the frame from his view — the lantern's lit on the porch" |
| **BUILT** | the code landed, `validate_spec` green, nobody has looked | "it's in, i haven't looked yet" |
| **GUESSED** | a theory, a read of the code, a diagnosis with no measurement | "my read is the collider sits 0.4 m off — not proved" |

the specific sin this kills: **describing a frame you never took.** it's the most
expensive lie in this workshop, because nobody catches it in the same turn — he plans
the next hour around a lantern nobody has seen.

| what you wanted to type | its real tier | what to type |
|---|---|---|
| "the HUD now shows the timer" | BUILT | "timer's wired in; `read_authored_ui` says sent and applied. haven't shot the frame" |
| "should work now" | GUESSED | "landed. try it — if the bar doesn't move, nothing is writing it and i go up a level" |
| "everything's in order" | GUESSED | the three things you checked, with the instrument beside each |
| "he chases you now" | SEEN, if you actually looked | "burst of 6 over 2 s: he closes 3.1 m across the strip" |
| "the terrain's fine" | GUESSED | "audit probe: `scanned: 237, floating: 0, buried: 0`" |

and the corollary, which is not optional:

> **when your eye fails, say the eye failed.** "no image came back." "the booth was
> busy." "no client is connected." never the frame you expected to see.

a mixed report is the honest shape of most work, and it reads strong, not weak:
*SEEN: frame from his view, porch lit. BUILT: the door interaction, nobody's looked.
GUESSED: the stutter is the shadow atlas — ~15 min to prove.*

---

## 10 — Done is the creator's word

you never say fixed. he says fixed.

what you say is what you changed, what you measured, and **"try it now."**

| don't | do |
|---|---|
| "fixed the double jump" | "coyote window went 0 → 100 ms (3 ticks at 30 Hz). try it — tell me if it still eats the second jump at the ledge" |
| "the lag is gone" | "30 boxes became one mesh; his client came off the floor, rung 5 → 2, ~23 → ~7 ms. try it — does it still hitch when the wave spawns?" |
| "everything works" | "SEEN: the loop closes twice. BUILT: the shop UI. try the shop first — that's the part nobody has looked at" |

why the difference matters, plainly: **"fixed" closes the thread on your authority,
and it reopens tomorrow with less trust than it had.** "try it now" closes it on his —
and if it's still wrong you hear that in one message instead of a week later, while
the diff is still warm in your head. it invites the only verdict that counts.

when he says it's good, that's the done: it goes in the record with what proved it —
`gavi#memoria-infinita`. when he says it's still broken, the fix missed; a fix that
misses twice is upstream, so you change levels instead of repainting the same site
(§4's fifth-round rule, and `gavi#testar-tudo` for the sweep around it).

---

## 11 — "Quality like a real game", in checkable terms

the full finishing list is `gavi#jogos-famosos` §5 — boot and framing, the first 60
seconds, three channels per action, the hand's windows, the world, the systems, the
reach, the last mile. don't retype it, load it.

what this file adds is the subset that decides whether you may **say the word done**,
each as a yes/no with the instrument in hand:

| the bar | yes/no test | instrument |
|---|---|---|
| the loop closes | play → lose or finish → back into play, twice, no page reload — and run two behaves like run one | walk it; `gavi#testar-tudo` owns the order |
| there is a fail state | trigger it on purpose: the screen says it happened, and a way back exists | one deliberate death. a fail state never triggered was never tested |
| every action answers within 150 ms | `burst: { frames: 6, spanSeconds: 0.5 }` ≈ 100 ms a tile: press, and the answer is visible by tile 2. first change at tile 4 is ~300 ms and reads dead | `view_live_scene` with `burst` |
| the screen tells you where you are | cover the world, look at the HUD alone: can you name what you're doing and how it's going? | `identify_object` with `ui: true` — a census with zero elements answering that is a fail |
| the place has an hour and a sound | `timeOfDay` is a number someone chose, and something is looping under it | the probe below |
| it works phone-sized | ~360×640: HUD whole, targets ≥44 px, thumbs not covering the action | `read_authored_ui` rect (CSS px + viewport); the lane is `gavi#fazer-mobile-e-pc` |

```js
// run_script readOnly — an hour and a bed, or neither
const at = api.getAtmosphere();
const heard = api.audio.playing();
return {
  hour: at && at.timeOfDay, sun: !!(at && at.sunState),
  music: heard.music && heard.music.ref,
  loops: heard.loops.length, emitters: heard.emitters.length,
};
```

this room answered `hour: 14.1`, sun present, one music track, one emitter.
`loops: 0, emitters: 0, music: null` means the place is a photograph — §5's fourth
finishing move, with a number attached to it.

---

## 12 — The regression law

a fix is a bet. before you deploy it, **say which way it can lose.**

one sentence, written before the deploy: *this changes X; if i'm wrong it breaks Y;
the check is Z.* then, after the deploy and **before** the message, you make check Z —
one readOnly measurement of the named risk, not a general re-verification tour.

| the fix | what it can break | the one check |
|---|---|---|
| touched a shared state key (`velocity`, `hp`, a flag) | every other reader of that key | `grep` the key across `scripts/` and name every reader out loud |
| `addBehavior` on `player` or `camera` | the whole stack's `onSpawn` re-runs when the list changes | `getLogs()` straight after the attach, for a behavior error that wasn't there before |
| raised an update rate (`every: 3` → `1`) | frame cost on a device already near its floor | `api.getClientHealth()` `frameMs` before, and ~15 s after |
| moved terrain, added a mark | everything pinned to an absolute Y | the floating/buried audit probe in §3 |
| renamed an object id | anything that looked it up by string | `grep` the old id — a dangling ref errors on every compile |
| 30 boxes → one `api.unionSolid` | pieces with behaviors, children, sensors or non-static bodies (it refuses those and names them), and if ANY piece had a body the whole union is solid | read the refusal, then `view_live_scene` + `colliders: true` on the result |
| a camera or cursor change (`showCursor`, `setCamera`) | every other menu and mode — and it's session-only unless you passed `persist` | `api.getSpec('camera')`: is the change in the spec, or only in this session? |

> **a fix with no named risk is a fix you don't understand yet.**

when the risk you named actually happens, don't patch on top of it: `versions` back to
the state you know, then come back structurally different. one revert costs ten
minutes; three stacked speculative patches cost the afternoon and the trust.

---

## Checklist before saying done

- [ ] passed the three questions (reads in motion / on purpose / hand matches eye)
- [ ] nothing floating or buried — `y: { terrain: 0 }` or `ctx.groundY`, and the audit probe returned 0
- [ ] no coplanar planes (0.005–0.02 m of clearance)
- [ ] winding in one single convention, light reading right
- [ ] surface dressed (`texture` + `pbr` + colour), or a flat family declared
- [ ] no asset still cooking in the frame you called final
- [ ] collider checked with `colliders: true`; a climb checked with `traverseCheck`
- [ ] mood in colour, fog not swallowing the horizon, shadows present
- [ ] touch target ≥44 px, HUD fits in ~360×640, clear of the right-edge rail
- [ ] `validate_spec` green **including `warnings`**, and `getLogs()` with no dead-asset code
- [ ] a fresh-eyes `critic` went through and found no flaw worth a round
- [ ] the self-review pass ran on your own diff — no unread identifier, no unbranched null, one writer per field, no rename-plus-behaviour in one move (§7)
- [ ] the disqualifying observation was named **before** you looked, and you made it (§8)
- [ ] every claim carries SEEN / BUILT / GUESSED — and a failed eye is reported as a failed eye, never as a frame (§9)
- [ ] nobody typed "fixed": the message ends in "try it now" (§10)
- [ ] the six checkable bars answered yes, or the ones that didn't are named as open (§11)
- [ ] the regression bet is written down and its one check ran (§12)

---

## How judging goes wrong

1. **judged from the wrong distance.** TELL: you approved it from a `frame:` portrait
   at 3 m and the player sees it at 37. FIX: measure the camera distance first, then
   re-shoot from there. §1, question 1.
2. **certified over pending paint.** TELL: the frame caption says an asset is still
   generating and the report says "looks great". FIX: wait and re-shoot, or say "it's
   cooking". a failed-to-serve caption never settles — re-conjure under a new name.
3. **UI certified from a 3D shot.** TELL: "the HUD is missing" after a `camera:` or
   `burst:` capture. those are 3D-only; the UI was never in them. FIX:
   `read_authored_ui` (it carries the delivery receipts) or the no-argument frame.
4. **the ten-item critique.** TELL: a list of flaws and no round happens, because
   nobody knows which one to fix. FIX: one flaw per round, the one that ruins the
   screenshot most.
5. **the fifth round on the same flaw.** TELL: repainting the same surface and the
   complaint does not move. FIX: the cause is a level up — form, placement, or light,
   not the texture.
6. **taste corrected as if it were a flaw.** TELL: you "fixed" the creator's colour.
   FIX: §6 — say the number in one line, build it his way.
7. **"it looks right" mistaken for "it works".** TELL: a beautiful frame of a game
   nobody has played from boot to death. FIX: `gavi#testar-tudo` — the visual ruler
   and the playable sweep are two different receipts.
8. **the frame that was never taken.** TELL: a report describing what the player sees,
   and no capture in the turn that wrote it. FIX: §9 — take the frame, or write BUILT.
   the eye failing is a sentence you're allowed to say; an invented frame is not.
9. **"fixed" before he tried it.** TELL: your message ends in a verdict instead of an
   invitation. FIX: §10 — what changed, what you measured, "try it now".
10. **a fix with no named bet.** TELL: it landed, nothing else was checked, and the
    regression turns up two days later wearing a different symptom. FIX: §12 — name
    what it could break before deploying, then check that one thing.
11. **the check invented after the look.** TELL: you looked first, then decided what
    would have counted. FIX: §8 — the threshold is only honest before the frame.