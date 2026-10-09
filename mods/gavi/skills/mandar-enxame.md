---
name: Send The Swarm
description: The /gavi-swarm doctrine — dispatching a crew flat out. What stays in your hands and what becomes a lane, the brief written from INSIDE the finished version with real values and no effort ceiling, the closed anatomy of a brief (context, walkthrough, data contract, ownedScripts, disqualifying check, report with a measured number), one artifact per lane, modelClass technical × creative, the review/verify/judge/critic/polish roles, a weave of 1 versus a conducted weave, the 6-lane concurrency and the 60-call grant, the translation table from request → lanes with the mod's real skills, gauntlet rounds against the creator's ruler, the law of the receipt, the power floor that forbids chore lanes, the house palette of purple-and-blue card colours with burnStyle matched to the work, and the reward line as the creator's real payout — what their world gains, written in its own fiction, and always true.
---

# Sending the swarm

## pick the path in 10 seconds

| the situation | what to do |
| --- | --- |
| it fits between two replies | your own hands. don't dispatch (Law 1) |
| they asked to WATCH it being born | your own hands (Law 1) |
| one self-contained job, one file | a **weave of 1** — `run_weave` with a single lane, no script to conduct (Law 6) |
| several fronts, or a barrier between phases | a **conducted weave**: `phase()`, lanes in parallel, `all()` as the only barrier (Law 6) |
| two lanes want the same file | they're one lane. `ownedScripts` locks the file while it runs (Law 3) |
| "keep it simple / basic version" about to be typed | delete it. an effort ceiling guarantees greybox (Law 2) |
| done is a checkable contract | `modelClass: 'technical'` (Law 4) |
| done is judged by eye | `modelClass: 'creative'` (Law 4) |
| a reference exists (screenshot, named game) | the gauntlet: build → `critic` → fix the one named gap, until ours wins (Law 8) |
| a lane says "done" | demand its receipt; a blind lane's "done" is the worst crew defect (Law 9) |
| the lane would finish in under ten minutes | it was a chore. your own hands — you just spent a card on nothing (Law 10a) |
| about to type a `color` | violet → cyan, never grey, never random; `burnStyle` matches the work (Law 10b) |
| about to dispatch without a `reward` | stop. write what the WORLD gains, in the game's fiction, and make it true (Law 10c) |
| top effort, session-wide, one operator | `gavi#uma-so` |

You build well with your own hands — and that is exactly why you deliver so little. One hand
does one thing at a time; they asked for **everything**, at maximum quality, no limits. The
honest translation of that is **sending a crew**: one whole lane per front, you holding taste,
the cut and the eye.

> **Your own hands are for what fits between two replies. Everything else is a lane.**
> Holding a whole system in your hands is the small version of yourself.

---

## Law 1 — What stays in your hands, what goes to a lane

| Stays in your hands | Goes to a lane |
|---|---|
| the scaffold (ground, grey volumes, one light) in 60 s | the whole system, from state to contract |
| the call on taste (colour, rhythm, name, tone) | the batch of art: 12 props, 40 sprites, 8 textures |
| the final cut and the eye on the frame (`view_live_scene`, burst) | the screen (HUD, menu, scoreboard) and the effects (particles, impact, screen shake) |
| the piece they asked to watch being born | the map zone: village, cave, arena, edge |
| the reply in their chat | the bug that already survived two of your attempts |

In doubt: **does it fit between two replies?** If not, it's a lane. **Did they ask to WATCH it
being born?** If yes, it's your hands.

---

## Law 2 — The brief is written from INSIDE the finished version

You don't ask for a thing: you have already walked through the finished thing and you come back
describing it. Element by element, with the real values — where it stands, what size it is,
what it does up close.

| The VISION's numbers are yours | The BUILD's numbers belong to the wisp |
|---|---|
| height in metres (the tower is 14 m) | triangle count, mesh, LOD |
| distance and scale (a 60 m street, 9 stalls) | technique: scripted, sprite, instancing |
| quantity (12 chickens, 4 torches, 28 objectives) | how long it takes, how many passes |
| rhythm (the animation reads at 12 frames per second), colour, mood, time of day, tone of the text | function names, file structure, which primitive, which hook |

**Writing an effort ceiling is forbidden.** "Keep it simple", "don't spend much", "about 3
polygons", "a basic version I'll improve later" — every one of those tells the lane to build
LESS than what you saw, and back comes greybox with an excuse. You saw chipped roof tiles, you
write chipped roof tiles.

Performance is not a line in the brief: it's the engine's work — culling, instancing,
`updateSchedule`. From the lane you demand that it comes out beautiful **and** runs; how, is
its craft.

---

## Law 3 — Anatomy of a brief that doesn't fail

A closed list. One item missing, the lane comes back wrong and it's your fault.

1. **Context**: what already exists today — files, ids, standing contracts, who owns what.
2. **The creator's request, literal**, in quotes — their raw sentence is worth more than a paraphrase.
3. **The walkthrough**: element by element, with the vision's numbers (Law 2).
4. **The data contract**: field name, type, who writes it, who only reads it.
5. **`ownedScripts`**: the owner of each file. Two lanes on the same file is a guaranteed
   collision — the last one to land erases its sister.
6. **The disqualifying check**: the specific failure that means "not finished", named and never
   generic — `validate_spec` failed · `getLogs()` with an error from this lane · zero particles
   in the burst · the object outside the frame at play distance · two identical poses · a missing node.
7. **A report with a measured number**, never an adjective: "12 stalls by `api.query`,
   `validate_spec` green, 3 distinct poses in the burst" — not "it came out pretty".

---

## Law 4 — The lane's nature (`modelClass`)

Declaring it wrong hands the work to the wrong specialist: it comes back correct and ugly, or
beautiful and broken.

| `technical` — "done" is a checkable contract | `creative` — "done" is judged by the eye |
|---|---|
| system, manager, state machine | appearance, silhouette, material |
| collision, physics, movement, scoring | fx: particles, impact, screen shake |
| bug hunt, regression, migration | UI style, typography, the screen's tone |
| data, persistence, `sql`, saves, network | atmosphere, light, time of day |
| architecture cleanup, data contracts | 3D model, texture, sprite, pixel art |

Work that is both (a boss: states + choreography) splits into two lanes with a contract in
between.

---

## Law 5 — Roles (`role`)

| `role` | What the lane does | When to dispatch it |
|---|---|---|
| `review` | says what breaks the spell, without fixing it | before you show it to them |
| `verify` | proves ONE claim with a measurement | when you don't trust the "done" |
| `judge` | compares two or three versions and picks one | when taste came out tied |
| `critic` | measures against the ruler and names the BIGGEST failure | every gauntlet round |
| `polish` | takes the greybox through the last 10% | when the shape is already right |

One role per lane. A `critic` that also fixes stops being a fresh eye.

---

## Law 6 — One lane × many lanes (weave)

Self-contained work, describable in one sentence, with a file of its own → **one wisp**. Work
across several fronts → **weave**: lanes in parallel, a barrier between phases. Slicing rule:
**each lane fits in one sentence and has its own file** — if it didn't fit in one sentence, you
don't understand the work yet.

```js
phase('skeleton');                                   // the contract standing first
await agent({ label: 'rules', modelClass: 'technical', ownedScripts: ['scripts/master.js'], task: '...' });
phase('flesh');                                      // parallel, distinct owners
await all([
  agent({ label: 'scenery',  modelClass: 'creative', ownedScripts: ['scripts/gen/village.js'],   task: '...' }),
  agent({ label: 'body',     modelClass: 'creative', ownedScripts: ['scripts/body.js'],          task: '...' }),
  agent({ label: 'hud',      modelClass: 'creative', ownedScripts: ['scripts/ui.js'],            task: '...' }),
  agent({ label: 'sound-fx', modelClass: 'creative', ownedScripts: ['scripts/fx/village.fx.js'], task: '...' })
]);
phase('ruler');                                      // fresh eye, never whoever built it
await agent({ label: 'critique', role: 'critic', modelClass: 'creative', task: '...' });
```

A **weave of 1** is the honest shape for one self-contained job: one lane, no conducting script,
no barrier. A **conducted weave** is when the plan itself needs stages — `phase('skeleton')`
before `phase('flesh')`, because the contract has to stand before four lanes build against it.
`all([...])` is the only barrier there is; plain async functions are lanes and compose freely
until it.

The real numbers: **6 lanes run at once**. A wider fan-out is **never refused** — it queues and
starts as slots free, so queue the whole plan when the work is real. What bites is **60 agent
calls per grant**: past it the weave **parks and asks**, a DM says where it held, landed work is
safe, and their go-ahead buys a fresh 60. Recovery is writing the piece that didn't fit
yourself, **never waiting with your arms folded**.

Three fields worth setting on purpose: `maxSteps` sizes the lane's budget to the job (default
60, clamps 1–150 — a mega-build gets more, a quick check fewer); `expects: 'json'` forces a
closing fenced JSON block and resolves it already parsed as `r.data`, which is the only clean
way to hand a survey's output to the next stage; `todoIds` (≤12) parks those todos with the
lane so they tick off in front of the creator as the work lands. And check `r.ok` — a lane that
stalled resolves `ok: false` with `partial`/`blocked`/`failed` in `r.status`, never a throw.

---

## Law 7 — Translation: request → lanes

The heart of this skill. A mod skill loads as `gavi#<id>`, 1–2 per lane at most.

| What they asked for | Lanes in parallel | The skill each lane preloads |
|---|---|---|
| **a complete game from scratch** | 1 loop/rules · 2 scenery · 3 character+animation · 4 UI/menu · 5 sound+fx · 6 critique in the final phase | `gavi#jogabilidade-e-mecanica`+`gavi#programar-de-verdade` · `gavi#fazer-cenario` · `gavi#animar-doutrina`+`gavi#animar-esqueleto-codigo` · `gavi#menu-principal-3d-2d` · `game-feel`+`audio` · `gavi#desenhar-o-jogo` |
| a raw idea ("make a cool game") | 1 design lane BEFORE any code | `gavi#desenhar-o-jogo` |
| 3D model (prop, weapon, vehicle) | 1 shape+material · 1 surface `polish` | `gavi#criar-modelo-3d` · `custom-geometry` |
| 2D art / pixel art / sprites | 1 lane per sprite family | `gavi#criar-pixel-art` |
| character animation (.glb) | 1 clips+blending · 1 amplitude `verify` | `gavi#animar-glb` · `gavi#animar-verificar` |
| animation in code (skeleton) | 1 animator · 1 burst `verify` | `gavi#animar-esqueleto-codigo` · `gavi#animar-verificar` |
| 2D animation, springs, curves | 1 lane | `gavi#animar-2d`+`gavi#animar-doutrina` |
| **a bug that survived 2 attempts** | 1 diagnosis by playing (no fixing) → 1 fix with the measurement in hand | `gavi#cacar-bugs-jogando` · `debugging` |
| phone / two control schemes | 1 touch surface · 1 `verify` on a small screen | `gavi#fazer-mobile-e-pc` · `mobile-controls` |
| multiplayer / playing together | 1 entity ownership+replication · 1 cheating `review` | `gavi#fazer-multiplayer` |
| map zone / village / cave | 1 lane per zone, each with its own generator | `gavi#fazer-cenario`+`structures` |
| screen, HUD, menu, scoreboard | 1 lane owning `scripts/ui.js` | `gavi#menu-principal-3d-2d`+`game-ui` |
| geometry or shader in code | 1 lane | `gavi#three-js` |
| a big build with them watching | your hands on the scaffold; lanes on the edges | `gavi#construir-ao-vivo` |
| genre — platformer · fighting/action · horror · puzzle | the genre's loop · level/enemy · final critique | `gavi#genero-plataforma` · `gavi#genero-luta-acao` · `gavi#genero-terror` · `gavi#genero-quebra-cabeca` |
| genre — RPG/adventure · sandbox · kids/music | progress+world · tools+persistence · rhythm+colour | `gavi#genero-rpg-aventura` · `gavi#genero-sandbox` · `gavi#genero-infantil-musica` |

Every lane inherits the house tone (`gavi#ser-a-gavi`): visible text in plain English, world
language.

---

## Law 8 — The ruler and the rounds (gauntlet)

When they lay down a ruler — a reference screenshot, "I want it like that game", "I want it to
look like a cartoon" — the work stops being a delivery and becomes a **round**:

1. build it (the build lane);
2. a fresh-eyed `critic` measures against the ruler and names the BIGGEST failure — one, not seven;
3. the fix lane attacks that failure only;
4. repeat until the ruler is **beaten**, not tied.

The critique lane is never the one that built it. And the ruler becomes a number before the
first round: "silhouette readable at 6 m", "3 distinct poses in the burst", "paint against bone
with contrast". The complete visual ruler lives in `gavi#qualidade-sem-falha` (this skill's
sister) — load it in the `critic` lanes.

---

## Law 9 — The law of the receipt

A lane that couldn't see its own result **says so**, and that word travels up into your report
to the creator — a blind lane swearing "done" is the worst crew defect there is.

| The lane's claim | Receipt accepted |
|---|---|
| "the system is standing" | `validate_spec` green + filtered `getLogs()` with no error |
| "the object is in the world" | a frame with the thing inside it, at play distance |
| "the animation reads" | a burst of 6 frames with different poses |
| "the HUD showed up" | `read_authored_ui` with the node + a fresh `sent.sig` |
| "it got lighter / faster" | a number before and a number after, same measurement |
| "I couldn't see it" | the whole sentence, no dressing, travelling up in the report |

---

## Law 10 — Only powerful wisps, and every card is purple and blue

A dispatch is not free and it is not quiet: the creator **watches the card burn** at the top of
their screen while they play. So two things are true at once — a lane must be worth the card, and
the card must be worth looking at.

### 10a — The power floor: never send a chore

| Not a lane. Your own hands. | A lane worth the card |
|---|---|
| one file edit, one value tuned, one object moved | a whole feature: system + world + screen + sound, standing and playable |
| something you could have done in a single tool call | a front that would otherwise be a string of big sequential calls |
| a probe, a read, a look | a bug that already survived two of your attempts |
| "go rename these three things" | "build the boss fight: three phases, arena, telegraphs, defeat cinematic" |

The test, said out loud before every dispatch: **would this lane still be working in ten minutes?**
If the honest answer is no, it was your hands (Law 1) and you just spent a card on nothing.

And the inverse is the real waste: shrinking a lane. One wisp comfortably lands a whole camp —
hall, palisade, yard, soundscape. Handing it a fence and keeping the camp is the small version of
yourself. **Grant the lane the entire surface** and write the brief from inside the finished thing
(Law 2).

### 10b — The house palette: purple and blue, always

Every `run_weave` carries `color`, and every `agent()` may carry its own. They are never random and
never grey — this crew burns violet through cyan, and a weave reads as one gradient across its lanes.

| The lane's work | `color` | `burnStyle` |
|---|---|---|
| the conducting weave, the spine, the contract | `#7c5cff` violet | `pulse` |
| systems, rules, state, the technical lanes | `#5b6cff` indigo | `calm` |
| scenery, world, terrain, atmosphere | `#4aa8ff` blue | `wave` |
| art, models, sprites, materials | `#a855f7` purple | `crackle` |
| fx, particles, impact, anything that flashes | `#8b5cf6` amethyst | `crackle` |
| screen, HUD, menu, text | `#22d3ee` cyan | `calm` |
| `critic` · `review` · `verify` · `judge` — the fresh eyes | `#c084fc` light violet | `pulse` |

`burnStyle` is meaning, not decoration: `calm` is steady work, `crackle` is many small pieces
landing, `pulse` is one big thing being decided, `wave` is a front sweeping across a map. Pick the
one that describes the work and the creator can read the top of their screen like a status line
without being told anything.

Five or six `emojis` on every lane, themed to the work — never a generic set. They are the card's
face at a glance.

### 10c — The reward line is the creator's payout

`reward` is not optional and it is not a build report. It is **what the world gains, written in the
game's own fiction**, and it is the line the creator reads when the card lands.

| Wrong — a build report | Right — the world's gain |
|---|---|
| "refactored the mob manager" | "the herd learns to scatter when you swing" |
| "added ui.js inventory panel" | "your pockets open, and everything you dug is in them" |
| "implemented day/night cycle" | "the sun starts to set, and the monsters notice" |
| "created 12 sprite assets" | "twelve new faces move into the village" |

The law under it: **the reward must be true.** It names something that will actually be in their
world when the card burns out — a thing they can walk up to and touch. A reward line that promises
anything outside the game (points, coins, credits, anything the platform hands out) is a lie the
card cannot keep, and the whole crew's word dies with it. What you can hand the creator for free is
the thing every card already hands them: **a piece of their world they did not have to build.**
That is the payout. Write it so it reads like one.

---

## Law 11 — A whole brief, written out in full

Their raw request: *"make a market in the valley"*. It becomes this:

```
LABEL: valley-market   modelClass: creative   skills: gavi#fazer-cenario, structures
ownedScripts: ['scripts/gen/stall.js', 'scripts/market-life.js']

CONTEXT: terrain 'scripts/bone-valley.js' standing; player is a bone rabbit, camera at ~6 m.
Manager 'objective-master' already publishes state. Nobody owns gen/stall.js today.
THEIR LITERAL REQUEST: "make a market in the valley".

WALKTHROUGH (the finished version, walking through it):
- 9 stalls along a 60 m street, from (x -30, z -12) to (x 30, z -12), 6.5 m gaps,
  alternating sides; the one at the far end has a 4 m frontage — that one is the owner's.
- each one: 2.4 m wide, 2.8 m at the ridge, a worn striped awning hanging 0.4 m out over
  the front, a plank counter 0.95 m off the ground.
- on the counter, 3 to 6 pieces (a stack of bones, carrots in a bundle, pots), never the
  same combination on neighbouring stalls.
- 4 post torches at 3.2 m, amber light, one every 15 m; packed earth with a pale trail
  trodden down the middle of the street.

DATA CONTRACT:
- read only: api.getObjectState('objective-master').objective.type
- writes: tag 'market' on each stall; when a carrot is pulled off the counter,
  api.emit('valley:action', { type: 'carrot-pulled', amount: 1, player, position })
- state per stall: { stock: number 0-6, lit: boolean } — the lane writes it, the HUD does
  not start reading anything new.

DISQUALIFIES: validate_spec failed · getLogs() with an error from this lane · fewer than 9
stalls in the frame or two at the same x · street unreadable at play distance · awning/counter
with no texture.

REPORT: count by api.query({ tags: ['market'] }), validate_spec output, one frame of the whole
street and one of the owner's stall. Couldn't see it? Say the sentence.
```

---

## Dispatch checklist

- [ ] Scaffold on their screen before the first dispatch
- [ ] Each lane fits in one sentence, has its own `ownedScripts` and a declared `modelClass`
- [ ] No effort ceiling written in any brief
- [ ] Data contract with name, type, who writes, who reads
- [ ] Disqualifying check named and measurable + report with a number
- [ ] Ruler in numbers and a fresh-eyed `critic` whenever a reference exists
- [ ] 6 lanes at a time; queue the rest; whatever didn't fit, your own hands write

---

## The failure list — how a dispatch comes back wrong

| the trap | the TELL | the fix |
| --- | --- | --- |
| an effort ceiling in the brief ("keep it simple", "basic version") | greybox with an excuse attached, and it's your fault, not the lane's | describe the finished thing with its real values; performance is the lane's craft, not your budget line |
| two lanes sharing one file | the second landing erases the first, and the report from lane 1 describes code that no longer exists | one artifact per lane in `ownedScripts`. two lanes wanting one file = one lane |
| a brief with no data contract | the HUD reads a field nobody writes; two lanes invent two names for the same value | field name, type, who writes, who only reads — in the brief |
| a disqualifying check written as an adjective | "it came out pretty" comes back and the thing is broken | name the specific failure: `validate_spec` failed · 0 particles in the burst · fewer than 9 stalls in the frame |
| a builder's report handed to the `critic` | the critic grades the effort instead of the pixels and calls a miss a win | the critic's context carries the bar and nothing else. fresh eyes, own captures |
| `modelClass` declared wrong | correct and ugly, or beautiful and broken | contract → `technical`; judged by eye → `creative`; both → two lanes with a contract between |
| a lane's "done" taken on trust | you tell the creator it landed, they open it, it isn't there | Law 9 — every claim has a named receipt, and "I couldn't see it" travels up verbatim |