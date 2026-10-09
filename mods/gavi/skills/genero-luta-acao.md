---
name: Fighting And Action Genre
description: How to build fighting and action in Tome — the three-phase attack with startup/active/recovery in real seconds, input buffering and cancel windows, hit detection and the damage contract, the complete moment of contact on five channels, knockback and i-frames, an enemy that telegraphs, and an impact camera.
---

# Fighting and action

The promise, in the table in `gavi#desenhar-o-jogo`: **I was fast and I was accurate**. The
cardinal sin: an attack that never connects with a body. An attack with fewer than three
channels of feedback **reads as a bug**, not as a weak hit.

## Pick your path in ten seconds

| the situation | what to do |
| --- | --- |
| starting from zero | copy the timing table below, then `scripts/golpe.js`. light = 0.08 / 0.06 / 0.16 |
| "I press and nothing comes out" | no input buffer. hold the intent 0.12 s. see Input buffer |
| "the combo breaks by itself" | cancel window is shorter than the buffer. `cancelAt` 0.14 for light |
| "I land it and feel nothing" | fewer than three channels, or fx at `feetPosition`. see The moment of contact |
| "three damage numbers from one swing" | the `hits` list is missing or not cleared per attack |
| melee reach | arc `query` + a dot-product test. it reaches through walls — that is the tradeoff |
| bullets, lasers, arrows | hitscan `raycast`. past ~40 m/s everything else is hitscan in disguise |
| a projectile they must dodge | a real entity, enemy 8–14 m/s. skill `projectiles` |
| six enemies swinging at once | `builtin/claims` + a coordinator entity. see An enemy that teaches |
| death and restart | ≤ 2 s to control back, and `api.vignette(0)` on every path |
| this has to be right | `gavi#uma-so` |

**The verb** is strike. **The loop** is read the telegraph → commit → connect or pay for it →
recover. **The camera** punches once along the impact axis and returns. **The three numbers
that decide the feel:** active **0.06 s**, buffer **0.12 s**, hitstop **0.04 s**.

## Law zero — an attack is a window, not a click

| phase | whose it is | what it does | who reads it |
| --- | --- | --- | --- |
| **startup** | the opponent's | the body winds up the other way | whoever is about to react |
| **active** | the hit's | the hitbox exists. only here | nobody: far too short to see |
| **recovery** | the price's | you are locked in place and vulnerable | whoever is about to punish you |

1. **Short active: 0.05–0.12 s.** A 0.3 s active hits things that already left; short is what
   makes a hit feel like skill.
2. **Startup readable across the room:** at 6 m, 15–40° of travel and a change of silhouette
   (`gavi#animar-doutrina`). A 3° startup is an attack with no warning — unfair by construction.
3. **Recovery is the difficulty** — the window where missing hurts. Lengthen recovery before
   you touch HP.

## Timings per attack type (seconds, straight into the code)

| attack | startup | active | recovery | total | cancels from | rel. damage | weight |
| --- | --- | --- | --- | --- | --- | --- | --- |
| light | 0.08 | 0.06 | 0.16 | 0.30 | 0.14 | 1× | 1 |
| heavy | 0.22 | 0.10 | 0.34 | 0.66 | 0.32 | 2.5× | 2 |
| special | 0.35 | 0.12 | 0.45 | 0.92 | never | 5× | 3 |
| dodge | 0.05 | i-frames 0.30 | 0.15 | 0.50 | 0.14 (and cancels attacks) | — | — |
| block | 0.06 | held | 0.12 | — | — | — | — |

Tests for that table: light total ≤ **0.35 s** (any longer and it is a medium, and the player
feels it); special ≥ **0.8 s** of commitment; the heavy's startup ≥ **2×** its active; the
dodge's i-frames cover 0.30 s — the active of every attack in the table.

## Input buffer — the #1 cause of "the game doesn't respond"

The player presses the second attack **before** the first ends. Always. If the state machine
throws the press away because it was busy, they do not conclude "I mistimed it" — they conclude
"the game didn't respond".

- `activeOn: "keydown"` (the default) holds the action true for **one frame only**; if that
  frame lands in recovery, the intent evaporates.
- **Hold the intent 0.12 s** (≈4 ticks at this engine's measured 30 Hz sim tick). Past 0.20 s the
  game starts acting on its own: that is the ceiling.
- A buffer with no cancel window solves nothing: the intent needs somewhere to land.

```js
// scripts/lib/buffer-de-entrada.js — intent held in ticks of the room clock
const BUFFER = 0.12; // s — a press 100 ms early still counts
export function record(api, name) { api.patchState({ intent: name, intentTick: api.getTick() }); }
export function peek(api) { // reads without consuming
  const s = api.getState();
  if (!s.intent) return null;
  return api.getTick() - (s.intentTick ?? 0) > api.seconds(BUFFER) ? null : s.intent;
}
export function consume(api) {
  const name = peek(api);
  if (api.getState().intent != null) api.patchState({ intent: null });
  return name; // null = expired; a stale press never acts on its own
}
```

`api.seconds(n)` converts seconds into ticks at this game's rate; `api.seconds()` with no
argument is the room clock in seconds. Never write "7 frames" — the tick rate is configurable.

## The attack state machine

Store the **start instant** and derive the phase from it. Never a counter that decrements every
tick: that writes state 60×/s and burns network (`gavi#programar-de-verdade`).

```js
// scripts/golpe.js — on the player's body. inputs.actions: light / heavy / special / dodge
const buffer = require("lib/buffer-de-entrada.js");
const { contact } = require("lib/contato.js");
const ATTACKS = {
  light:   { start: 0.08, active: 0.06, rec: 0.16, cancelAt: 0.14, damage: 8,  range: 2.2, arc: 100, weight: 1 },
  heavy:   { start: 0.22, active: 0.10, rec: 0.34, cancelAt: 0.32, damage: 22, range: 2.8, arc: 70,  weight: 2 },
  special: { start: 0.35, active: 0.12, rec: 0.45, cancelAt: null, damage: 45, range: 3.4, arc: 140, weight: 3 },
  dodge:   { start: 0.05, active: 0, rec: 0.15, cancelAt: 0.14, iframes: 0.30 },
};
export function onInput(input, api) {
  for (const n of ["special", "heavy", "light", "dodge"]) if (input.actions[n]) return buffer.record(api, n);
}
export function update(dt, api) {
  const s = api.getState(), g = ATTACKS[s.attack];
  if (!g) { begin(api, buffer.consume(api)); return; }            // idle: any intent gets in
  const t = api.seconds() - (s.attackStart ?? 0);                 // phase derived from the start
  if (g.active > 0 && t >= g.start && t < g.start + g.active) testHit(api, s, g);
  const next = buffer.peek(api);
  const canEnter = next === "dodge" ? t >= g.start + g.active     // a dodge cancels recovery
    : g.cancelAt !== null && t >= g.cancelAt;                     // combos only inside the window
  if (next && canEnter) { buffer.consume(api); begin(api, next); return; }
  if (t >= g.start + g.active + g.rec) api.patchState({ attack: null, hits: [] });
}
function begin(api, name) { // the attack's pose: gavi#animar-glb or gavi#animar-esqueleto-codigo
  const g = ATTACKS[name], now = api.seconds();
  if (!g) return;
  api.patchState({ attack: name, attackStart: now, hits: [], // hits clears on EVERY attack
    invulUntil: g.iframes ? now + g.iframes : (api.getState().invulUntil ?? 0) });
}
function testHit(api, s, g) {
  const pos = api.getProperty("feetPosition"), yaw = ((api.getProperty("yaw") ?? 0) * Math.PI) / 180;
  const fx = -Math.sin(yaw), fz = -Math.cos(yaw);                 // the engine's forward: -Z at yaw 0
  const limit = Math.cos(((g.arc / 2) * Math.PI) / 180), hits = [...(s.hits ?? [])], before = hits.length;
  for (const a of api.query({ radius: g.range, tags: ["enemy"] })) {
    if (hits.includes(a.id)) continue;                            // one hit per target per attack
    if ((a.state?.invulUntil ?? 0) > api.seconds()) continue;      // the target's i-frames
    const dx = a.feetPosition.x - pos.x, dz = a.feetPosition.z - pos.z, d = Math.hypot(dx, dz) || 1;
    if ((dx / d) * fx + (dz / d) * fz < limit) continue;           // outside the arc
    contact(api, { targetId: a.id, damage: g.damage, weight: g.weight, dir: { x: dx / d, y: 0, z: dz / d },
      first: hits.length === before, // screen effects ONCE per attack, even when it catches five
      point: { x: (pos.x + a.feetPosition.x) / 2, y: pos.y + 1.1, z: (pos.z + a.feetPosition.z) / 2 } });
    hits.push(a.id);
  }
  if (hits.length !== before) api.patchState({ hits });
}
```

## Hit detection — three ways, and the damage contract

| method | what it's for | the real call | where it fails |
| --- | --- | --- | --- |
| arc query | melee | `api.query({ radius, tags })` + an arc test | blind to walls: it reaches through cover |
| raycast | fast shot, laser | `api.getInputRay(input)` → `api.raycast(origin, dir, range)` | a thin target in motion |
| trigger | an attack with a body of its own, a slow projectile | `physics: { body: "static", trigger: true }` + `onTriggerEnter` | only the trigger's owner gets the callback |

- **A projectile that moves is not a static trigger**: either probe per tick with
  `api.overlapSegment(a, b, { radius })`, or a dynamic collider with `onCollide`.
- **I-frames are state, on both sides**: `invulUntil` in room-clock seconds — the attacker
  filters and the victim checks. Filtering on the attacker alone loses to latency
  (`gavi#fazer-multiplayer`).
- **One hit per attack, not per tick**: without the `hits` list, a 0.10 s active applies damage
  across 3 ticks at this engine's 30 Hz tick and three numbers pop out of one slash.
- **The damage contract**: whoever swings **decides**;
  `require("builtin/combat").damage(api, id, amount, { kind, silent })` **applies** — it writes
  `health` and `lastHitBy` in the same write, which is why credit is exact even on a hit that
  kills outright, and it returns the post-hit snapshot `{ health, maxHealth, dead }` (or `null`
  when the target does not exist). The **victim** owns its own death: it sees `health <= 0`,
  writes its own `dead: true` and emits `died`. `damage()` never writes `dead`, and an attacker
  that writes it leaves the victim with no respawn timer. Kill rewards only on `died`; the flash
  and the hitstop can fire on the guess.

## The whole moment of contact, in one function

```js
// scripts/lib/contato.js
const combat = require("builtin/combat");
const WEIGHT = {
  1: { hitstop: 0.02, shake: 0.15, flash: 0.10, punch: 0.20, knockback: 2.5, sound: "cdn/sfx-golpe-leve.mp3" },
  2: { hitstop: 0.04, shake: 0.30, flash: 0.14, punch: 0.40, knockback: 5.0, sound: "cdn/sfx-golpe-pesado.mp3" },
  3: { hitstop: 0.05, shake: 0.45, flash: 0.18, punch: 0.60, knockback: 9.0, sound: "cdn/sfx-golpe-especial.mp3" },
};
export function contact(api, { targetId, damage, point, dir, weight = 1, first = true }) {
  const p = WEIGHT[weight] ?? WEIGHT[1];
  const hit = combat.damage(api, targetId, damage, { kind: "melee", silent: true }); // silent: the juice is ours
  if (!hit) return null;
  api.flash(targetId, { color: "oklch(0.96 0.03 95)", duration: p.flash });      // the target's body
  api.squash(targetId, { axis: "y", amount: 0.3, duration: 0.18 });
  api.playSound(p.sound, { position: point, pitch: 0.94 + api.random() * 0.12 }); // sound with variation
  api.damageNumber(point, damage, { crit: weight === 3 });                        // the value
  api.spawnFx(point, "scripts/effects/faisca-golpe.fx.js");                       // author the fx: skill `fx`
  if (weight >= 2) api.slash(point, { size: 2.6, timing: "quick" });              // size in METRES, required
  if (first) {                                // screen: ONCE per attack, never per target
    api.hitstop(hit.dead ? 0.05 : p.hitstop);
    api.screenShake(p.shake, 0.12);
    api.cameraPunch({ x: dir.x, y: 0, z: dir.z }, p.punch);
  }
  // knockback: write the intent into the target's state and let ITS movement apply it
  api.patchObjectState(targetId, { knockback: { x: dir.x * p.knockback, z: dir.z * p.knockback, until: api.seconds() + 0.18 } });
  if (hit.dead) api.ragdoll(targetId, { impulse: [dir.x * 260, 140, dir.z * 260] }); // rigs only; cap ~12 per place
  return hit;
}
```

- The effect goes **at the point of contact**, never at `feetPosition`: that position is the
  foot, and a spark at the foot reads as a bug.
- **Knockback is an assignment, not `+=`.** `addObjectImpulse` silently no-ops on another
  player's avatar in multiplayer (their body is a follower on your machine), and
  `setObjectVelocity` moves nothing on an `npc` agent. Write the intent into state and let the
  target's own movement integrate it — and stop re-asserting `moveTo`, because npc intents decay.
- `hitstop`/`screenShake`/`cameraPunch`/`screenFlash` are **screen** effects and, in
  multiplayer, count only for whoever fired them — fire them from the owner's own hooks.
- `api.vignette()` is set-and-hold: it stays until something turns it off. Every restart path
  calls `api.vignette(0)`, or the red of death welds itself onto the next round.
- **`api.ragdoll` is mantle places only** (`physicsEngine: "mantle"`), caps at ~12 concurrent per
  place, and refuses past it — settled ones still count. Despawn bodies a few seconds after death.

## Range — real projectile or hitscan

- **Hitscan** (`raycast`) for a bullet, a laser, a fast arrow: no entity, no frame cost, and it
  lands where the person aimed even with latency. Past ~40 m/s everything is hitscan in
  disguise; just admit it up front.
- **A real projectile** when the player has to **read it and dodge**. Enemy **8–14 m/s**, player
  25–60 m/s; the test: `distance ÷ speed ≥ 0.5 s` of reaction. Flight and tunnelling: skill
  `projectiles`. Spawn it from the shooter's own `onInput` — a server-side spawner is born ~RTT
  behind a moving muzzle.
- **Danger read off the floor**: an emissive `primitive: { kind: "circle" }` growing through the
  telegraph, or `api.decal(pos, normal, { texture, size: [0.5, 3], lifetime: 1 })` where the size
  ramp **is** the timer. That `[start, end]` ramp needs `engine.escapeHatches.vfxContractV2: true`
  — new games ship with it on; an older game reads the pair as a static [w, l] rectangle and the
  telegraph never grows. Colour is fixed grammar: red = it lands here, yellow = area, blue = safe.
  Never telegraph with sound alone.

## Action camera

- Action third person: arm **4.5–6.5 m**, target at chest height (+1.4 m), fov 60–70. Too close
  hides the enemy's startup, the most important information on the screen (`camera-third-person`).
- **Lock-on**: the nearest within ~18 m and ~60° of screen centre. While locked the camera is
  yours — `api.setCamera({ orientation: { source: "script" } })` plus `lookAt(...)` in the rig's
  `update`; on release go back to `source: "look"` (it reseeds from the displayed pose, no jump).
  Switch targets only during recovery.
- **On impact** the camera does one thing: a short punch along the attack's axis and back
  (`cameraPunch` + `hitstop`). `slowMo`, `zoomTo` and `shockwave` are the session's finishing
  blow, not light attack #40.

## An enemy that teaches

- **One verb per enemy**: one charges, one shoots, one holds space, one explodes. An enemy with
  four verbs teaches none of them.
- **Telegraph before the active**: 0.4–0.8 s (0.25 s on a fast one, 1.0 s on a boss), with a
  pose, a sound and a mark on the floor — before it, never alongside it.
- **Fair punishment**: damage ≤ 25% of health per telegraphed hit (three mistakes to die). An
  off-screen attack only after a sound that gives 0.5 s of warning.
- **Attack queue**: `require("builtin/claims")` turns "who may swing right now" into two lines —
  but it needs an arbiter. `claims.request(api, "attack:" + id, { max: 2 })` writes the request
  into the claimant's own state and returns whether the token is currently granted; **one entity
  per place must run the coordinator** or the first request returns false forever and your
  enemies stand still:

```js
// scripts/claims.js — spec: { id: "claims", tags: ["claims-coordinator"], realm: "server", behavior: "scripts/claims.js" }
const claims = require("builtin/claims");
export function update(dt, api) { claims.runCoordinator(api); }
```

  Then in the enemy brain: `if (claims.request(api, "attack:" + target.id, { max: 2 })) swing()`.
  Re-request every tick you still want it — a grant lapses when you stop asking. Without the
  cap, six enemies swing on the same frame and no window exists at all. Brains and perception:
  skill `npc`.

## Death and a cheap restart

From the killing blow to control back **≤ 2 s**, respawning within 15 m of where it hurt, with
the wave preserved and `api.vignette(0)` on the way. The victim is in charge:
`patchState({ dead: true })` → `emit("died", { victimId, killerId })` → fx and sound →
`api.runInSeconds(2, ...)` hands back health and `feetPosition`. Never `setTimeout` — it does
not exist in the sandbox.

## How it breaks

- **No buffer, or `keydown` read during recovery.** TELL: "I press and nothing comes out",
  strongest in the middle of a combo. FIX: hold the intent 0.12 s and give it a cancel window.
- **Cancel window later than the buffer.** TELL: the combo breaks by itself — the intent expires
  0.02 s before the window opens. FIX: `cancelAt` ≤ buffer + startup; for light, 0.14.
- **`hits` list missing or not cleared per attack.** TELL: three damage numbers from one swing,
  or the second swing never hits the same enemy again. FIX: clear `hits: []` in `begin()`.
- **Juice at `feetPosition`.** TELL: sparks burst around the ankles and the hit reads as a
  glitch. FIX: the midpoint at chest height, `pos.y + 1.1`.
- **One channel only.** TELL: shake with no sound reads as a video stutter, not a hit. FIX:
  three channels minimum — body, sound, value.
- **`claims.request` with no coordinator entity.** TELL: every enemy freezes at attack range,
  forever, with no error in the log. FIX: spawn the `claims-coordinator` running `runCoordinator`.
- **`dead` written by the attacker.** TELL: the corpse never respawns and the kill counts twice.
  FIX: `damage()` decides health; the victim writes its own `dead` and emits `died`.

## What Gavi refuses

- Touching damage when the complaint was about timing, and an active > 0.12 s "so it connects
  more easily".
- An enemy whose startup is not readable at 6 m.
- Naming a call she has not checked. Every verb above is in the engine's api-reference.
- Saying the combat is good without playing the loop by hand ten times
  (`gavi#cacar-bugs-jogando`), or without the full sweep in `gavi#testar-tudo`. Touch — hold to
  aim, release to strike: `gavi#fazer-mobile-e-pc`. When the ask is "do it properly", that is
  `gavi#uma-so`.