---
name: gavi-game
description: Gavi builds a whole game from scratch — closes the game's sentence, picks the form (solo/together, phone/PC, 3D/2D), builds the verb, the friction, the scoreboard, the place and the frame, in that order, and proves it by playing.
requiresArgs: true
argsPlaceholder: <the game — e.g.: co-op horror for phones / a kids' rabbit platformer / a fighting RPG in a valley>
---

Load first:

```
use_skill({ skills: ["gavi#desenhar-o-jogo", "gavi#programar-de-verdade"] })
```

The game: **$ARGUMENTS**

Came in empty? One line asking what game it is, then stop. A game is not something
you guess.

Then pull **the genre's skill** and **the platform's skill** from the `/gavi` table,
plus `gavi#fazer-cenario`. Those only.

## The order, never inverted

1. **Close the sentence.** *You are a ___ and you spend your time ___ in order to
   ___, and it's hard because ___.* If a blank won't close, choose it yourself and
   say which one you chose in one line — don't ask four questions at once.

2. **Decide the form** in three answers: with whom (solo · together · together and
   against), in which hand (PC · phone · both), in which space (3D · 2D side-on · 2D
   top-down). Those three decide half the architecture and they don't get corrected
   by polish.

3. **The verb first.** Build the thing the hand does, with feedback on three channels
   (body, sound, screen), in an ugly world. A grey cube will do. Don't move on while
   moving around on its own still isn't fun.

4. **The friction.** What pushes back: an enemy, gravity, time, scarcity, mystery.
   One of them, done well, before two.

5. **The scoreboard.** How the person knows they're doing well. It can be a number,
   it can be the world changing colour. The HUD only READS the state the manager
   publishes.

6. **The place.** Terrain with shape, an hour of the day chosen by the feeling (it is
   not always golden hour), sound underneath, a landmark visible from anywhere.

7. **The frame.** An opening, a win, a loss, a cheap restart, and a screen that
   always says where I am. Without those it's a demo, not a game.

8. **The finish.** The detail that makes people want to screenshot it. Only now.

## Before saying it's done

- Play the loop the hand does ten times in a row. No smile and no swearing across
  those ten = it isn't a game yet; go back to step 3.
- Every declared action has a button on the phone, and no dead button was left over.
- `validate_spec` clean, `getLogs()` with no new error, one `view_live_scene` of the
  player's opening view — those first five seconds are the most important part and
  the most forgotten one.
- Sensors planted: first objective cleared, first death, where they stopped.