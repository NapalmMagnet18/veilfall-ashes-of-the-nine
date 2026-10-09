---
name: Gameplay And Mechanics
description: Gavi's mechanics skill — how a control actually FEELS. Input latency in milliseconds, acceleration curves with real time constants, responsive versus twitchy, the four parts of a mechanic, why every mechanic needs a consequence, the rule that two mechanics must multiply and not merely add, state readable with no HUD, and the three tests plus the sensors that report while nobody is watching.
---

# Gameplay and mechanics

`gavi#desenhar-o-jogo` decides **what game this is**. `gavi#programar-de-verdade` decides **how the code
behaves**. This is the middle layer: the thing the hand does a thousand times, and which has to still be
interesting on the thousandth.

## pick your path in ten seconds

| the situation | do this |
| --- | --- |
| "it feels laggy" | measure the first pixel. under 100 ms or she blames the game — Law 2 |
| "it feels slippery / floaty" | your stop is slower than your start. stop τ = 0.6× start τ — Law 3 |
| "it feels twitchy / nervous" | zero ramp + no deadzone. τ 0.08-0.12 s and a 0.18 stick deadzone — Law 3 |
| "it feels heavy in a bad way" | τ over 0.35 s on a character with no weight to sell it. drop to 0.15 |
| edge jumps feel like a swindle | coyote 0.08-0.12 s + buffer 0.12-0.18 s — Law 2 |
| the mechanic is fun for 30 s then forgotten | no consequence. it's a toy — Law 1 and Law 6 |
| the mechanic is spammable | charge for it: time, resource, position, noise — Law 6 |
| the game has 4 mechanics and feels thin | they add instead of multiplying. 4 mechanics = 6 pairs — Law 5 |
| depth wanted, no new button | same input, different result by context — Law 4 |
| an invincibility window nobody notices | invisible state = state that doesn't exist — Law 7 |
| you don't know if anyone uses it | plant the three heartbeats — Law 9 |
| cooldown in ticks | `api.seconds(0.45)` converts seconds→ticks at this game's rate. never hardcode 60 |

---

## Law 1 — anatomy: four parts, none optional

| part | question | what it becomes without it |
| --- | --- | --- |
| **input** | what does the hand do? | there is no mechanic, there is a cutscene |
| **rule** | what does the world decide from it? | it becomes a sound-effect button |
| **feedback** | how does she notice it happened? | it looks like a bug, and she presses again |
| **consequence** | what is different afterwards? | it becomes a toy: fun for 30 s, forgotten by minute 2 |

Toy is not an insult — jumping is a toy until the floor has a hole in it. The consequence is what turns
a toy into a mechanic.

```js
// the four parts inside one dash, on the player's behavior
const COST = 1;            // consequence: it spends stamina
const IMPULSE = 14;        // rule: m/s along facing
const RECOVER = 0.45;      // rhythm: 0.45 s before it can happen again

export function onInput(input, api) {
  if (!input.actions.dash) return;                    // declare dash in inputs.actions
  const s = api.getState();
  if ((s.stamina ?? 0) < COST) return;                // consequence
  if (api.getTick() < (s.dashUntil ?? 0)) return;     // recovery
  api.patchState({
    stamina: s.stamina - COST,
    dashUntil: api.getTick() + api.seconds(RECOVER),  // seconds → ticks at THIS game's rate
    dash: IMPULSE,                                    // update() spends it
  });
  api.playSound('cdn/sfx-dash.mp3');                  // feedback: sound, same tick as the press
  api.screenShake(0.25, 0.15);                        // feedback: body
}
```

`api.seconds(RECOVER)` is the only honest converter — the tick rate is a per-game setting, and a
hardcoded `* 60` is a cooldown that is twice as long (or half) as you think on a 30 Hz game.

## Law 2 — the hand's window is measured in milliseconds

The hand does not forgive delay. It does forgive error. These are the numbers that decide whether a
control feels fair or feels broken:

| thing | value | what happens outside it |
| --- | --- | --- |
| input → first pixel of response | **< 100 ms** (≈ 3 ticks at 30 Hz) | she blames the game, never herself |
| coyote time (jump after leaving the ledge) | **0.08-0.12 s** | without it every edge jump feels like a swindle |
| input buffer (pressed slightly early) | **0.12-0.18 s** | without it, chaining reads as a stutter |
| recovery on a heavy action | **0.3-0.6 s** | under it, spam; over it, sluggish |
| invincibility after damage | **0.5-1.0 s** | without it one mistake becomes three |
| hitstop on a solid connect | **0.05-0.12 s** | over 0.15 s and the game feels like it froze |

The first pixel doesn't have to be the whole effect: a pose starting, a glint, a squash. The effect can
arrive later; the **response** arrives inside 100 ms.

```js
// coyote + buffer: the pair that makes a jump feel fair
const COYOTE = 0.10, BUFFER = 0.15;   // seconds
const JUMP_SPEED = 12;                // m/s up

export function onInput(input, api) {
  if (input.actions.jump) api.patchState({ jumpAskedAt: api.seconds() });   // remember the ASK
}

export function update(dt, api) {
  const s = api.getState();
  const now = api.seconds();
  if (api.isGrounded()) api.patchState({ leftGroundAt: now });

  const canJump = api.isGrounded() || now - (s.leftGroundAt ?? -9) < COYOTE;
  const askedJustNow = now - (s.jumpAskedAt ?? -9) < BUFFER;
  if (!canJump || !askedJustNow) return;

  api.patchState({ jumpAskedAt: -9, leftGroundAt: -9, velocity: { ...s.velocity, y: JUMP_SPEED } });
  api.playSound('cdn/sfx-pulo.mp3', { pitch: 0.96 + api.random() * 0.1 });
  api.squash(api.id, { axis: 'y', amount: 0.35, duration: 0.12 });
}
```

Those two windows add up to ~0.25 s of kind lying, and they are the whole distance between "this game is
tight" and "this game hates me".

## Law 3 — the acceleration curve IS the feel

Speed is a number anyone can set. **How the speed arrives** is the feel. Use one time constant per
state — τ, the seconds it takes to close ~63% of the gap to the target velocity — and smooth
frame-rate-independently:

```js
// exponential approach: dt-independent, no spring to tune, no overshoot
const k = 1 - Math.exp(-dt / TAU);
vx += (targetX - vx) * k;
```

At `dt = 0.033` (30 Hz) and `TAU = 0.09`: k ≈ 0.31, ~63% of the target speed by 0.09 s and ~95% by
3τ = 0.27 s. That is the shape a hand reads as "instant but not brittle".

| character | start τ | stop τ | air control | reads as |
| --- | --- | --- | --- | --- |
| arcade / twin-stick | 0.05-0.08 s | 0.04-0.06 s | 1.0× ground | snappy, precise |
| platformer hero | 0.09-0.14 s | 0.06-0.09 s | 0.4-0.6× | responsive with a body |
| grounded human (horror, adventure) | 0.15-0.22 s | 0.10-0.14 s | 0.3× | heavy, believable |
| mech / big creature | 0.35-0.60 s | 0.25-0.40 s | 0.2× | mass — needs animation to sell it |
| vehicle | 1.5-3.0 s | brake, not τ | — | a machine, not a body |

Three rules that come out of that table:

- **Stop faster than you start.** `stop τ ≈ 0.6 × start τ`. Equal reads as ice; slower reads as
  slippery, and a player who cannot stop on a ledge stops trusting the game.
- **Turning is its own number.** A 180° reversal completes in **≤ 0.15 s** for arcade, **0.35-0.5 s**
  for weighty. Free instant reversal at high speed is the classic "twitchy" tell.
- **Air is not ground.** Air control at 0.3-0.6× makes a jump a commitment. At 1.0× the jump has no
  cost and the level design loses its grip.

**Responsive vs twitchy** — same latency, different curve:

| | responsive | twitchy |
| --- | --- | --- |
| first pixel | < 100 ms | < 100 ms (same!) |
| velocity ramp | τ 0.08-0.14 s | τ ≈ 0 — full speed on tick 1 |
| stop | 0.6× the start | instant, and it also snaps the camera |
| stick deadzone | 0.15-0.22 | 0 — the character trembles at rest |
| diagonals | magnitude normalized | 1.41× fast on the diagonal |
| camera | follows with 0.10-0.20 s of lag | welded to the body, every jitter amplified |

```js
// scripts/mover.js — the curve on the player. Movement is scripted: the engine moves nobody for you.
const MAX = 5.2;                      // m/s. walk 4-5, run 7-9, sprint 10-11 (1 unit = 1 m)
const TAU_GO = 0.11, TAU_STOP = 0.07; // stop faster than you start
const DEADZONE = 0.18;                // under this the stick is at rest, or the body trembles
const AIR = 0.5;                      // air control fraction
const GRAVITY = -24;                  // m/s². −9.8 reads floaty; games live at −20..−30

export function onInput(input, api) {
  let mx = input.axes.moveX ?? 0, mz = input.axes.moveZ ?? 0;
  const mag = Math.hypot(mx, mz);
  if (mag < DEADZONE) { mx = 0; mz = 0; }
  else if (mag > 1) { mx /= mag; mz /= mag; }        // normalize: no 1.41× diagonal
  // the camera tells the feet what forward means
  const sin = input.axes.aimYawSin ?? 0, cos = input.axes.aimYawCos ?? 1;
  api.patchState({ wishX: (cos * mx - sin * mz) * MAX, wishZ: -(sin * mx + cos * mz) * MAX });
}

export function update(dt, api) {
  const s = api.getState();
  const v = s.velocity ?? { x: 0, y: 0, z: 0 };
  const wishX = s.wishX ?? 0, wishZ = s.wishZ ?? 0;
  const moving = wishX !== 0 || wishZ !== 0;
  const grounded = api.isGrounded();
  const tau = (moving ? TAU_GO : TAU_STOP) / (grounded ? 1 : AIR);   // air = slower approach
  const k = 1 - Math.exp(-dt / tau);                                  // dt-independent
  const vx = v.x + (wishX - v.x) * k;
  const vz = v.z + (wishZ - v.z) * k;
  const vy = grounded && v.y < 0 ? 0 : v.y + GRAVITY * dt;
  api.patchState({ velocity: { x: vx, y: vy, z: vz } });
  api.move(vx * dt, vy * dt, vz * dt);                                // character controller
}
```

Tune in this order, one number at a time: MAX → TAU_GO → TAU_STOP → GRAVITY → jump speed. Two numbers
at once and you learn nothing (`gavi#uma-so` if you want the fused, measure-first pass on it).

## Law 4 — depth is not one more button

A deep mechanic is the **same input** giving a different result by context. A new button is width;
context is depth.

| shallow | the same one, with depth |
| --- | --- |
| jumping goes up 3 m | up 3 m; held, 4.2 m; while moving it travels 1.4× |
| hitting takes 10 | 10; from behind 18; in the air it knocks down |
| pushing moves the crate | moves it; in water it floats; on a ramp it slides down on its own |
| screaming scares the animal | scares it; in a cave it echoes and scares twice as far |
| running is faster | faster; in a turn you skid; downhill you can't brake |

The context test: take the main mechanic and list **four** situations from your world — high up, wet,
cramped, dark. Identical behaviour in all four means shallow, and the fix is a new **rule**, not a new
button.

## Law 5 — multiply, don't add

Two mechanics that never touch are two small games. The arithmetic that matters is A × B.

- jump × push = pushing a crate in mid-air
- scream × hide = luring them away and slipping in behind
- light × key = reading the lock in the dark

**The rule of the third one.** With *n* mechanics you have *n(n−1)/2* pairs: 3 mechanics = 3 pairs,
4 = 6, 5 = 10. Before adding C, write the pair list and mark which pairs a level actually forces. **If
fewer than half are used, C is not what's missing** — a level that forces A×B is. That is also the
cheapest content you will ever ship: a pair you already own costs a room, not a system.

## Law 6 — a choice demands a cost

Every good action costs something: time, resource, position, exposure, noise.

Diagnosis in one sentence: **if you can play well by mashing one button, the mechanic is broken.** The
fix is almost never to weaken it — it is to charge for it.

| how to charge | example | effect on the rhythm |
| --- | --- | --- |
| time | 0.45 s planted after the swing | opens a gap for the enemy |
| resource | stamina, ammo, one charge | creates planning |
| position | the dash carries you forward whether you like it or not | creates spatial risk |
| exposure | the heavy attack drops your guard for 0.6 s | creates a read |
| noise | the scream calls everything inside 25 m | creates a choice between force and stealth |

Charge in one currency per mechanic. Two costs on one action (stamina **and** a 0.9 s recovery **and** a
resource) is how a verb stops being used at all — and Law 9 is how you find that out.

## Law 7 — state has to be readable with no HUD

She has to know what state she's in by looking at the character: grounded, airborne, charging,
vulnerable, invincible, out of stamina. One place decides the state; pose, sound and colour derive from
it:

```js
// one decision, three channels, and writes only on the flip
const LOOKS = {
  normal:       { color: 'oklch(0.85 0.02 90)',  clip: 'Idle',  pitch: 1.0 },
  charging:     { color: 'oklch(0.80 0.15 60)',  clip: 'Crouch', pitch: 1.2 },
  outOfStamina: { color: 'oklch(0.70 0.08 20)',  clip: 'Idle',  pitch: 0.8 },
  invincible:   { color: 'oklch(0.95 0.18 200)', clip: 'Idle',  pitch: 1.4 },
};

export function update(dt, api) {
  const s = api.getState();
  const state = (s.invincibleUntil ?? 0) > api.getTick() ? 'invincible'
    : s.charging ? 'charging'
    : (s.stamina ?? 3) <= 0 ? 'outOfStamina'
    : 'normal';
  if (state === s.shownState) return;                    // write only when it changes
  const look = LOOKS[state];
  api.patchState({ shownState: state });
  api.setProperty('material.emissive', look.color);       // dot-path write
  api.updateChannel('state', { clip: look.clip, weight: 1, blendIn: 0.12 });  // clip must exist in ?animations=
  api.playSound('cdn/sfx-estado.mp3', { pitch: look.pitch });
}
```

An invisible state is a state nobody uses. A 0.6 s invincibility window with nothing on screen does not
exist for the person holding the controller — and it is also 0.6 s of your design nobody will ever
thank you for.

## Law 8 — the three tests

**The ten-repetition test.** Do the main action ten times in a row. If not one of the ten pulled a smile
or a swear out of you, the problem is the verb, not the level. Go back to feedback: more amplitude, more
sound, more visible consequence.

**The test of someone who read nothing.** Enter and pretend you have never seen it. Do you find the main
mechanic on your own inside 20 s? If not it needs one of three things: an obvious target near the start,
a big payoff on the first use, or an obstacle only it can solve.

**The pest test.** Three questions, always:

| the pest does | what has to happen |
| --- | --- |
| presses it 20× a second | recovery holds; nothing piles up in an infinite queue |
| stands still for 2 minutes | the game doesn't freeze, and something invites her back |
| uses it in the wrong place (in a wall, in water, mid-fall) | a clear "not here", never silence |

Silence is the worst answer a game can give. Always hand something back, even if it is a dry sound and
a 0.1 s jolt. The end-to-end sweep that proves the whole spine — boot, first input, core verb, fail
state, recovery — is `gavi#testar-tudo`.

## Law 9 — plant sensors in the mechanic

You will not be watching when someone plays. Make the mechanic count for itself:

```js
// scripts/sensor-dash.js — on the same entity that owns the dash. The mechanic reports itself.
const WINDOW = 300;                                   // 5 minutes of play, in seconds

export function onSpawn(api) {
  api.patchState({ uses: 0, windowBase: api.seconds() });
}

export function update(dt, api) {
  const s = api.getState();
  if (api.seconds() - (s.windowBase ?? 0) < WINDOW) return;
  const uses = s.uses ?? 0;
  if (uses === 0) api.notifyDmOnce('dash-dead', 'nobody dashed in 5 min of play — teach it or cut it');
  else if (uses / 5 > 30) api.notifyDm(`dash at ${(uses / 5).toFixed(0)}/min — that's spam, charge for it`);
  api.patchState({ uses: 0, windowBase: api.seconds() });
}
// The dash's own onInput does: api.patchState({ uses: (api.getState().uses ?? 0) + 1 }).
```

Three heartbeats are worth planting in any mechanic:

1. **the first time** (`notifyDmOnce`) — how long it took her to find it
2. **frequency** — uses per minute; under 1 it is decoration, over 30 it is spam
3. **the silence** — five minutes with no use is death; either teach it or cut it

A mechanic nobody uses is not neutral: it costs code, a button and attention. Cutting is as good a
design decision as adding. Findings worth keeping outlive the session in
`gavi#memoria-infinita`.

---

## before you say the mechanic is done

- Ten repetitions, done by you, in the running game.
- The four parts exist, and you can say the consequence out loud.
- First pixel under 100 ms; coyote 0.08-0.12 s and buffer 0.12-0.18 s where a jump exists.
- One τ per state, and the stop is 0.6× the start.
- State readable with no HUD: pose, sound and colour all say the same thing.
- The three pest tests pass, and none of them answers with silence.
- A sensor planted, so the next session tells you what happened without you watching.

## when it breaks — the six tells

| tell (what you'd actually see) | cause | fix |
| --- | --- | --- |
| she overshoots every ledge and blames the controls | stop τ ≥ start τ, or air control at 1.0× | stop τ = 0.6× start; air 0.3-0.6× |
| the character trembles while the stick is at rest | no deadzone | deadzone 0.15-0.22, and normalize the magnitude |
| diagonal movement is visibly faster | raw axes summed | `Math.hypot` normalize when mag > 1 |
| the cooldown is twice what you wrote | ticks hardcoded as `* 60` on a 30 Hz game | `api.seconds(0.45)` — the engine's converter |
| feel changes between machines | per-tick lerp with a constant factor | `1 - Math.exp(-dt / TAU)` — dt-independent |
| the mechanic is fun in isolation and dead in the game | no consequence, or no pair that uses it | charge for it (Law 6), or build the room that forces A×B (Law 5) |
| a mechanic quietly stops being used after the tutorial | two costs stacked on one action | one currency per mechanic; the Law 9 sensor names it |