---
name: Designing The Game
description: Gavi's doctrine on the game itself — the game's sentence, the verb before the decoration, the three rings of the loop, the first-five-seconds test, three-channel feedback with real timings, difficulty as rhythm, and how to choose form (solo/multiplayer, phone/PC, 3D/2D) and genre without it turning into a feature list. Read this one before any genre skill.
---

# Designing the game

the other skills teach you how to **build** and how to **tune**. this one decides
**what** is being built. none of them saves a game that does not know what it is.

## pick your move in ten seconds

| where you are | do this |
|---|---|
| a fresh idea, nothing built | close the sentence below. it does not close = there is no game yet |
| a 40-item feature document | find the verb in it, build only that, ugly, today |
| "it's pretty but i don't know what to do" | the verb is missing. §Law zero |
| "i do it and nothing happens" | three channels of feedback, ~100 ms. §Feedback |
| "it's fun for 30 s then boring" | no friction, or no second ring. §The loop |
| "players quit at the start" | the first five seconds. §The first hand |
| picking solo/phone/2D | §Choosing the form — before you open any genre skill |
| genre named, ready to build | the promise table, then the genre skill |
| ready to call it a game | play the hand loop 10× and count. §Proving it |

---

## Law zero — the verb

every game is a verb the person does with their hands, repeated until it becomes
pleasure. jump. cut. stack. run. fit. talk. collect.

before you write a single line, finish this sentence out loud:

> **you are a ____ , you spend your time ____ , in order to ____ , and it's hard because ____ .**

all four blanks, out loud, in one breath. worked:

> you are a **stray dog**, you spend your time **stealing bones off the porches of a
> sleeping village**, in order to **bury enough of them to get through winter**, and
> it's hard because **every bone you carry slows you down and the dogs on chains
> wake up**.

that closes. so the build order is already decided: carrying, then the slowdown per
bone, then the chained dogs. if it does not close, it is not a game yet — it is
scenery. scenery is gorgeous and it holds nobody.

| symptom | what is actually missing |
| --- | --- |
| "it's pretty but i don't know what to do" | the verb |
| "i do it, but it makes no difference" | consequence |
| "i do it and i win, but i don't feel it" | feedback (sound, screen, body) |
| "i do it and i never lose" | friction |
| "i lose and i quit" | a cheap restart |

**the verb comes before the decoration, always.** a grey cube that moves right is
further along than a conjured hero standing still. and the fourth blank —
*it's hard because* — is the one people skip; a sentence with three blanks filled
is a toy.

## The loop

three rings, smallest to largest. a whole game has all three, even tiny ones.

| ring | duration | example (the stray dog) |
| --- | --- | --- |
| hand | 1-3 s | grab, bolt, squeeze under the fence |
| lap | 20-90 s | one porch robbed and the bone buried |
| session | 5-20 min | the winter store filled, or the village wakes for good |

the hand ring has to feel good **on its own**, with no scoring at all. the test:
strip the HUD, the scoreboard and the objective. if it is still fun to move, the
game has a floor. if it goes hollow, you made a spreadsheet with graphics.

a game missing the middle ring is the most common half-game: lovely to move,
nothing to complete. the lap is what makes someone say "one more".

## The first hand — the five seconds

in the first five seconds the person has to: see where they are, know what they
are, discover the verb without reading anything, and get feedback for having tried.

five seconds is **150 ticks** at this engine's 30 Hz. that is a lot of room — and
it all gets wasted if the first thing they see is a loading pause with no gate.

opening rules that almost never fail:

1. the first interactive thing is **inside the starting field of view**, not behind
   them.
2. the first success comes **before** the first danger.
3. no written tutorial for what the body learns by itself. only write down what the
   hands cannot discover (what a secondary button does, what the coin is for).
4. a sound and a movement answer the first keypress, inside **~100 ms** — 3 ticks.
   silence on the first keypress is the fastest way to lose someone.
5. do not open the door before the world is there. the engine answers that honestly
   — gate the start on residency, never on a guessed timer:

```js
// scripts/botao-comecar.js — the start button lights only when this machine
// has actually finished streaming the world. resident is the renderer's verdict.
export function update(dt, api) {
  const { resident } = api.getWorldResidency();
  const lit = api.getState().lit ?? false;
  if (resident === lit) return;                        // cheap poll, write only on the flip
  api.patchState({ lit: resident });
  api.setProperty('material', {
    color: 'oklch(0.85 0.17 145)',
    emissive: 'oklch(0.85 0.17 145)',
    emissiveIntensity: resident ? 1.8 : 0.05,          // 36× difference: reads across the room
  });
}

export function onInteract(other, api) {
  if (!api.getState().lit) return;                     // world still breathing in
  api.enterPlace(other.id, { placeId: 'arena' });
}
```

## Feedback — the law of "something happened"

every player action fires at least **three channels** at once:

| channel | examples | the number |
| --- | --- | --- |
| body | squash-and-stretch, camera punch, hitstop, a short shake | hitstop 0.06 s = **2 ticks**; squash 0.15-0.20 s |
| sound | a short click and a bright tone, pitch varied so it does not wear out | pitch ±10% per hit, so 30 hits do not sound like one sample |
| screen | damage number, flash, particle, a counter that moves | the number readable for ~0.6 s, not 0.15 |

one channel alone = looks like a bug. three channels = looks like a game. never use
a screen shake without sound: the brain reads a silent shake as a video glitch.

the moment of contact, whole, in one place:

```js
// in the hit's own hook — playSound/squash/damageNumber are world-anchored,
// so everyone near the hit gets them from any hook.
api.playSound('cdn/sfx-osso-quebra.mp3', { pitch: 0.9 + api.random() * 0.2, volume: 1 });
api.squash(targetId, { axis: 'y', amount: 0.35, duration: 0.18 });
api.damageNumber(hitPos, 3, { crit: false });
api.hitstop(0.06);                                     // 2 ticks — screen juice, acting player
api.screenShake(0.35, 0.12);                           // 0.12 s: a flick, not a wobble
```

the trap that eats an afternoon: **screen juice defaults to the acting player.**
`hitstop`, `screenShake`, `screenFlash`, `toast`, `vignette` and an unpositioned
`playSound` fired from a **non-player manager entity** are dropped — nobody feels
them, nothing errors. world-anchored juice (`squash`, `damageNumber`, positioned
`playSound`, `decal`, `slash`, `shockwave`) reaches everyone near it from any hook.
so give each player their screen feedback from **their own** trigger, and let the
manager do the world-anchored half.

## Difficulty is rhythm, not a number

difficulty is not multiplying enemy health. it is the distance between peaks and
valleys. tense, breathe, tenser, breathe, peak. a game with no valley neither
frightens nor tires: it turns into constant noise and the person walks out flat.

- a peak with no valley before it = unfair.
- a valley with no peak after it = boredom.
- a usable shape for a 6-minute session: 40 s valley, 25 s peak, 30 s valley, 40 s
  peak, 20 s valley, then the biggest peak last.
- the last peak of the session is the one the person remembers. save the best for
  the end.

## Failure

a game is allowed to have no losing (children's games, sandbox, casual music) — but
then it needs **surprise** in its place, or the loop never closes.

if there is losing: **restart under 2 seconds**, and it drops you near where it
hurt, not at the front door. a loading screen after death kills more games than
difficulty does. 2 s is the number because the second ring is 20-90 s — a 10 s
restart is a tenth to a half of the thing you just lost, paid again.

## Choosing the form before the genre

three questions decide half the architecture. answer them **before** you open any
genre skill.

| question | options | what actually changes |
| --- | --- | --- |
| with whom? | solo · together · together and against | state owner, replication, authority, what counts as secret |
| in which hand? | PC · phone · both | controls, target size, HUD density, frame budget |
| in which space? | 3D · 2d side-on · 2d top-down | physics, camera, how depth and danger are read |

these are `mode` on the place — `"3d"`, `"2d-side"`, `"2d-top"` — each with its own
physics, chosen at `definePlace`. a pixel platformer is `2d-side` because that is
what it *is*, not a 3D world flattened.

a wrong choice here does not get corrected by polish. a precision platformer on a
phone with no big button is unfair by construction (44 px minimum target, and 24 px
is a coin flip); a game of whispers and reading in a multiplayer room is never
quiet enough.

## The genre is a promise

a genre is not a feature list — it is what the person expects to **feel**:

| genre | the promise | the cardinal sin |
| --- | --- | --- |
| RPG / adventure | i became someone | grinding with no visible change |
| fighting / action | i was fast and precise | a hit that does not connect with the body |
| puzzle | i understood it | solving it by blind trial and error |
| horror | i don't want to turn that corner | the same cheap jump scare again |
| children's | nothing bad is going to happen to me | hidden punishment |
| music | i am inside the music | lag between the tap and the sound |
| sandbox | this thing is mine | losing what i built |
| platformer | my body obeys me | an imprecise jump |

deliver on the promise before you add anything else. a horror game with a gorgeous
inventory and zero fear has failed; a platformer with 40 levels and a bad jump
failed in all 40.

## Mixing genres

mix at most two, and one of them rules. the one that rules defines camera, control
and rhythm; the other comes in as seasoning (a shop inside the horror game, a
puzzle inside the platformer). two genres fighting over the camera = both of them
end up bad.

## Build order

always the same one, even when the request arrives backwards:

1. **the verb** — move it and feel it, with three-channel feedback. a grey cube will do.
2. **the friction** — what resists: an enemy, time, gravity, scarcity, mystery.
3. **the scoreboard** — how the person knows they are doing well. a number, or the
   world changing colour.
4. **the place** — terrain with shape, an hour of the day, sound underneath. never
   an empty floor.
5. **the frame** — opening, victory, defeat, restart, a screen that says where i am.
6. **the finish** — the detail that makes you want to screenshot it.

skipping straight to 6 is the most common mistake and the most expensive one.

## Proving it

a game is proved by playing, not by reading. before you call it done: play the hand
loop **ten times in a row** and count how many times you smiled or swore. zero of
both = not a game yet. the whole-game sweep — boot, gate, first input, core verb,
fail state, recovery, second loop — is `gavi#testar-tudo`.

then plant sensors on the heartbeats that answer "are people playing this the way i
imagined?": first objective completed, first death, where they stopped, how long
until the first action.

```js
// scripts/mestre-vale.js — one line, once, and the answer comes to you
export function onSpawn(api) {
  api.on('valley:death', (p) => {
    api.notifyDmOnce('first-death', `first death at ${Math.round(p.seconds)}s, on the bridge`);
  });
}
```

what those answers are worth next week depends on writing them down —
`gavi#memoria-infinita`.

## Routing to the other skills

| the request is about | go to |
| --- | --- |
| together, against, rooms, servers | `gavi#fazer-multiplayer` |
| phone, PC, controller, touch, performance | `gavi#fazer-mobile-e-pc` |
| becoming someone, story, items, saving | `gavi#genero-rpg-aventura` |
| hitting, shooting, dodging, combos | `gavi#genero-luta-acao` |
| understanding, fitting, deducing | `gavi#genero-quebra-cabeca` |
| fear, tension, dark you can still read | `gavi#genero-terror` |
| children, rhythm, music, no losing | `gavi#genero-infantil-musica` |
| jumping, running, falling | `gavi#genero-plataforma` |
| building, breaking, keeping | `gavi#genero-sandbox` |
| the moment-to-moment mechanics themselves | `gavi#jogabilidade-e-mecanica` |
| the opening screen, the menu, the frame | `gavi#menu-principal-3d-2d` |
| where all of it happens | `gavi#fazer-cenario` |
| making the thing exist / move / hunting a bug | `gavi#criar-modelo-3d` · `gavi#animar-doutrina` · `gavi#cacar-bugs-jogando` |
| how it survives ten more requests | `gavi#programar-de-verdade` |

---

## How designing goes wrong

1. **the sentence never closed and building started anyway.** TELL: you cannot say
   what makes it hard without inventing it on the spot. FIX: fill the fourth blank
   first — friction is a design decision, not a difficulty slider you add later.
2. **decoration before verb.** TELL: conjured assets exist, a HUD exists, and
   nothing moves in a way that feels good. FIX: build order step 1. grey cube,
   three channels, ten repetitions.
3. **one-channel feedback.** TELL: the creator says "did that work?" while looking
   straight at the thing working. FIX: three channels inside 100 ms — and check the
   audience trap: manager-fired screen juice is dropped silently.
4. **difficulty tuned as a number.** TELL: the fix for "too easy" was enemy health
   ×2 and now it is "too long", not "harder". FIX: rhythm — add a valley, then a
   sharper peak. same health.
5. **the missing middle ring.** TELL: fun for 30 seconds, boring at 90. FIX: build
   a 20-90 s lap with a completion the player can name.
6. **an expensive restart.** TELL: the tester dies once and puts the phone down.
   FIX: under 2 s, respawn near the pain, no fresh loading screen.