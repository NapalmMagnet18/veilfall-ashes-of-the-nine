---
name: jogos-famosos
description: How to study a famous game and steal the thing that actually made it work — the teardown template that turns any game into a buildable loop, teardowns of the great archetypes (Minecraft, MECCHA CHAMELEON, Tetris, Vampire Survivors, Among Us, Stardew, Balatro, Portal, Slay the Spire, Fall Guys, Terraria, Rocket League), the five compulsion engines, the numbers that make a hand believe a game is real, and the finishing checklist that separates a prototype from a product.
---

# Jogos famosos — studying the greats without copying the wrong thing

A creator arrives with a description of a game they love. Sometimes it is a link,
sometimes a wiki page, sometimes a long list they typed out themselves. **The list is
never the game.** This skill is how Gavi reads one anyway and comes out holding
something she can build.

---

## 1. The trap, named first

Here is a real description of Minecraft, the kind that arrives in chat:

> Three dimensions. Over forty mobs. Coal, iron, copper, gold, redstone, lapis,
> diamond, emerald, quartz, ancient debris. Enchanting, brewing, redstone logic,
> villager trading, elytra, the Ender Dragon.

Every word is true and **none of it is why anyone plays Minecraft.**

That list is what a game looks like *fifteen years after it worked*. It is sediment.
The 2009 version that hooked the world had: dirt, stone, wood, a crafting grid, and
night. No dragon. No dimensions. No enchanting. It worked because of one sentence:

> **You see a hill, you walk to it, and you can dig into it.**

Curiosity plus permission. Everything else is a fifteen-year answer to "and then what?"

**The law:** when a creator hands you a feature list, your job is to find the one
sentence underneath it. Build that sentence first. If the sentence is fun with
placeholder art, the game is real. If it is not, forty mobs will not save it.

**Say this out loud to the creator, warmly, once** — then build. Do not lecture twice,
and never refuse to build because the ask arrived as a list. The list is how people
say "I want it to feel like *that*." Answer the feeling.

---

## 2. The teardown template

Run these seven questions against any game — famous, obscure, or the one the creator
is describing. Answer in one line each. If a line takes a paragraph, you have not
found it yet.

1. **The verb.** What is the player physically doing with their hands, most seconds?
   One word. Dig. Aim. Paint. Stack. Time. Route.
2. **The loop.** What makes them do the verb again immediately? Name the ring:
   *second-to-second* (the verb feels good) → *minute* (the verb earns something) →
   *session* (the something changes what you can do) → *return* (something waits).
   A game missing a ring stalls exactly there.
3. **The compulsion engine.** Which of the five (section 4) is pulling? Games with
   two stacked engines are the ones people cannot put down.
4. **The tension.** What can go wrong? A loop with no failure is a screensaver.
5. **The first 60 seconds.** What happens between pressing play and the first time the
   player *chose* something? Write it as a beat sheet.
6. **The one number.** What is the single value the player is trying to move? Depth,
   score, day, level, survivors found, seconds alive. If you cannot name it, the
   player cannot feel it.
7. **The smallest fun slice.** What is the least you could build that already contains
   the verb, one ring of the loop, and the tension? That is the first build. Always.

---

## 3. Teardowns — the archetypes

Twelve games covering most of the loop space. When a creator names a game not on this
list, run the template on it rather than guessing, and **write the result into the
game's journal** so the next session inherits it.

### Minecraft — *the curiosity sandbox*
- **Verb:** dig / place.
- **Loop:** break a block (2-4s of held input, with progress feedback) → the block is
  now yours → the block becomes a tool → the tool reaches a block you could not
  reach → repeat, deeper.
- **Engine:** curiosity, stacked on accumulation.
- **Tension:** night. The day is 10 real minutes and then things come for you. The
  clock is the entire difficulty system — there is no difficulty curve, there is a
  **rhythm**, and the player builds shelter because they learned to fear a sound.
- **First 60s:** you are standing in a world with no instructions, facing a tree. You
  punch it. Wood appears. Nobody told you to. That is the whole design.
- **One number:** depth (y), disguised as everything else.
- **Smallest fun slice:** a world you can walk, blocks you can break and place, a
  hotbar, and a sun that sets. Everything else is optional forever.
- **What people copy wrong:** the ore table. Ten ore types with no tool ladder is ten
  colours of nothing. The ladder is the design; the ores are the rungs.

### MECCHA CHAMELEON — *the expression hide-and-seek*
*(source: the creator's own reference sheet — a 2026 indie hide-and-seek where players
paint their own bodies to blend into the scenery, then hold a pose.)*
- **Verb:** paint (sample a colour from the world, apply it to yourself).
- **Loop:** find a spot → paint to match it → pose → hold still while a seeker sweeps
  past → survive the timer.
- **Engine:** mastery, stacked hard on **social** — the joy is other people's reaction
  to your hiding place, which is why it went viral in clips.
- **Tension:** asymmetric and reciprocal. The hider fears the sweep; the seeker fears
  the clock.
- **First 60s:** you are a small white blob in a colourful room. You are *obviously*
  visible. The problem states itself with zero text.
- **One number:** seconds survived (hider) / hiders found (seeker).
- **Smallest fun slice:** two players, one room, a colour-pick tool, a body you can
  paint, a timer. That is a complete game — the modes came later.
- **The lesson worth stealing:** the mechanic *is* the self-expression. Painting is
  both the survival tool and the way you show off. When a game's optimal play is also
  its most creative play, clips make themselves.
- **In this engine:** the paint is a per-player material tint written into player
  state and replicated; the "sample" is a `raycast` from the camera reading the hit
  object's material colour. Both surfaces exist today. The hard part is not the
  paint — it is a room dressed with enough distinct surfaces to hide against.

### Tetris — *the perfect second-to-second*
- **Verb:** rotate + drop. **Loop:** one ring, executed flawlessly.
- **Engine:** mastery, alone. **Tension:** the stack, rising.
- **Lesson:** a game can be *one ring* if that ring is perfect. Perfection here is
  measured in milliseconds — lock delay, DAS, the input buffer. Feel over content.

### Vampire Survivors — *the inverted action game*
- **Verb:** walk. That is all. **Loop:** survive 60s → pick 1 of 4 upgrades →
  the screen gets louder → repeat for 30 minutes.
- **Engine:** accumulation, pure. **Tension:** density.
- **Lesson:** removing the aim button made it *more* addictive, not less. Look for the
  input you can delete. The escalation curve — from 3 enemies to 800 on screen — is
  the entire product.

### Among Us — *the social engine*
- **Verb:** walk and do small tasks. Deliberately boring.
- **Loop:** task → suspicion → meeting → vote → someone was wrong.
- **Engine:** social, alone. **Tension:** other humans lying.
- **Lesson:** the *mechanics* were unremarkable and it did not matter. If the game's
  content is the players' conversation, build the stage and get out of the way. Never
  try to out-mechanic a social game.

### Stardew Valley — *the return engine*
- **Verb:** tend. **Loop:** day (plant/water/talk) → season (crops mature) →
  year (the town changes).
- **Engine:** accumulation + narrative pull. **Tension:** the clock — energy and
  daylight run out before your list does.
- **Lesson:** the tension is *scarcity of time*, not danger. A cozy game still needs a
  thing that can go wrong, and "I did not get to everything" is enough.

### Balatro — *the number that breaks*
- **Verb:** pick cards. **Loop:** hand → score → shop → build → the score curve
  outruns you.
- **Engine:** mastery + accumulation. **Tension:** an exponential requirement.
- **Lesson:** the entire feel is one animation — the score counting up with rising
  pitch. **Juice on the one number is worth more than any feature.** If your game has
  a score, spend real effort on how it counts.

### Portal — *the teaching game*
- **Verb:** shoot two doors. **Loop:** see the room → understand → execute.
- **Engine:** curiosity. **Tension:** confusion, resolved.
- **Lesson:** it has no tutorial text. Each room teaches one idea, then combines it
  with the last. **Level order IS the tutorial.** Copy the structure, not the portals.

### Slay the Spire — *the readable roguelike*
- **Verb:** play a card. **Loop:** fight → reward → map choice → run → unlock → run.
- **Engine:** mastery + accumulation. **Tension:** information — the enemy's next move
  is always shown, so every loss is your fault.
- **Lesson:** showing the enemy's intent made it harder to blame the game. Any game
  with randomness should show the player what is coming.

### Fall Guys / party games — *the funny failure*
- **Verb:** run and jump, badly, on purpose.
- **Engine:** social. **Tension:** physics you do not fully control.
- **Lesson:** losing must be *funny*. Ragdoll, bright colour, a soft landing, an
  instant retry. If failure is punishing, a party game dies in one session.

### Terraria — *the sandbox with a spine*
- Minecraft's verb with a **progression gate**: each boss unlocks a tier of material.
- **Lesson:** a sandbox that never tells you what to do loses most players in an hour.
  A soft spine — one visible next goal at all times — keeps them for a hundred.

### Rocket League — *the mechanic that multiplies*
- **Verb:** drive + jump. Two mechanics; the skill ceiling is where they meet.
- **Lesson:** **depth comes from mechanics multiplying, never from adding buttons.**
  Before adding a third verb, ask what the two you have could do together.

---

## 4. The five compulsion engines

Every game that holds people runs at least one. The great ones stack two.

| Engine | The feeling | Installed by |
|---|---|---|
| **Curiosity** | "what's over there" | visible distance, a horizon, doors, procedural variety, a thing half-seen |
| **Mastery** | "I can do that better" | a skill ceiling above the floor, instant retry, visible technique, the loss being your fault |
| **Accumulation** | "the number went up" | persistent progress, upgrades that change *what you can do*, not just numbers |
| **Social** | "wait till they see this" | other humans, asymmetry, spectacle, a clip-shaped moment |
| **Narrative pull** | "and then what" | a question the world asks and does not answer yet |

**Diagnostic:** a creator says "it's fun but I stop after five minutes." Ask which
engine is running. Usually the answer is *mastery only, with no ceiling* — the verb
feels fine and there is nothing above it. Add accumulation (something that persists)
or curiosity (somewhere unseen), not more content at the same level.

---

## 5. "Qualidade de jogo de verdade" — what that is actually made of

This is the ask underneath every "make it like a real game." It is not scope. A tiny
game can have it and a huge one can lack it. It is a checklist, and it is finishable.

**Boot and framing**
- A **title screen**, not a black screen. Name, one image, one button.
- The game has a **name** and box art.
- Entering play is a transition, never a hard cut. 300-500ms.

**The first 60 seconds**
- The player's first input works and *responds* before they finish pressing it.
- The world states its own problem — no popup tutorial. If you need one line of text,
  put it in the world (a sign, a voice, a shape).
- Something happens in the first 10 seconds that was not the player's doing.

**Every action answers, on three channels**
Contact needs **visual + audio + motion**, always all three:
- visual: a flash, a particle, a squash, a number
- audio: one sound, pitch-varied ±8% so the tenth is not the first
- motion: hitstop 50-120ms, screen shake under 6px, a camera punch

An action with only one channel reads as broken even when the code is correct.

**The hand's windows** (these numbers are why a game feels tight)
- coyote time after leaving ground: **80-120ms**
- input buffer before landing: **100-150ms**
- attack recovery you can cancel: last **30-40%** of the animation
- a held action (mining, charging) shows progress by **150ms** or it feels dead

**The world**
- No untextured surfaces. Flat vertex colour is a *choice* inside a flat art family;
  outside one it reads as unfinished.
- An hour of day, a sky, a horizon, fog that softens rather than swallows.
- An ambient audio bed, low, looping — wind, hum, room tone. It is felt, not heard,
  and its absence is felt too.
- Evidence of who was here: wear, marks, one thing out of place.

**The systems**
- A visible failure state and a recovery that costs seconds, not minutes.
- One number the player can see going up.
- Progress survives a reload.

**The reach**
- It runs on a phone: thumbs reach every control, HUD fits a narrow screen.
- Frames hold. A beautiful game at 20fps is an ugly game.

**The last mile**
- A pause that pauses.
- An ending, or a clean loop back to the start. Never a dead end with no button.

Run this list before saying a game is done. Each unchecked line is a specific,
small, buildable task — that is the point of writing it as a list.

---

## 6. Build order when copying a great

1. **Find the sentence** (section 1). Show it to the creator: *"so this is a game
   about ___ — right?"* One line. Their correction is worth an hour of building.
2. **Build the smallest fun slice** (template Q7) with placeholder art, in the real
   world, on their screen. Judge the verb with your own hands.
3. **Only then** add the ring above it — the thing the verb earns.
4. **Then** the tension.
5. **Then** the finishing checklist (section 5).
6. Content — mobs, biomes, levels, modes — is **last** and is infinite. It is also
   where most projects die, because it was started first.

---

## 7. Failure table

| Symptom | Real cause | Move |
|---|---|---|
| "It has everything but it's boring" | features built before the verb was fun | strip to the verb, fix the feel, re-add nothing |
| "Players quit after 5 minutes" | one ring of the loop, no engine above it | add persistence or somewhere unseen |
| "It feels cheap" | one feedback channel instead of three | audio + hitstop on every contact |
| "It feels floaty / laggy" | missing hand windows | coyote, buffer, cancel windows — section 5 |
| "It looks like a prototype" | flat surfaces, no hour, no ambient bed | textures + an hour of light + a loop |
| "Nobody understands what to do" | tutorial text instead of world design | one room that teaches one idea |
| "It's fun alone but dead with friends" | no asymmetry, no spectacle | give players different information |
| Creator hands over a 40-item wiki dump | they are describing a *feeling* | find the sentence, name it back, build it |

---

## 8. Laws

1. **The feature list is the sediment, not the game.** Find the sentence.
2. **The smallest fun slice ships first.** Always, with no exceptions for ambition.
3. **Never copy a game's content; copy its loop.** Content is that studio's fifteen
   years. The loop is one afternoon.
4. **Study with the template, not with admiration.** Seven questions, one line each.
5. **The one number must be visible.** If the player cannot see it move, it is not the
   one number.
6. **Depth is mechanics multiplying, never buttons adding.**
7. **Feel outranks feature.** A perfect single verb beats forty mediocre systems, and
   the milliseconds in section 5 are where feel actually lives.
8. **Write every teardown into the game's journal.** A loop analysis done once should
   never be done twice — `memory/game/` is where it goes, with the date and who
   asked.