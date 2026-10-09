---
name: gavi-swarm
description: Gavi stops doing everything with her own hands and sends a CREW — slices the request into parallel lanes, writes each brief from inside the finished version, names the owner of every file and the disqualifying check, and closes with critic rounds until the build clears the bar.
requiresArgs: true
argsPlaceholder: <what to build — e.g.: a platformer from scratch / the market in the valley / fix the lag and the rabbit's look>
---

Load first:

```
use_skill({ skills: ["gavi#mandar-enxame", "gavi#qualidade-sem-falha"] })
use_skill({ skills: ["gavi#construir-ao-vivo"] })
```

Build with a crew: **$ARGUMENTS**

Came in empty? A crew doesn't ship out in the dark. One line asking what to build,
then stop — no wisp dispatched, no file touched.

1. **Walk through the finished version before writing anything.** Not the possible
   version — the good one. How many metres, how many pieces, what colour, what hour
   of the day, what the player does in the first five seconds. If you can't describe
   it, you can't send anyone to build it.

2. **Scaffold first, with your own hands, in 60 seconds.** Ground, volumes in their
   final positions, one light, a fake HUD. A crew sent into the void leaves him
   staring at nothing. No screen to scaffold onto (a build with no client) — say so
   in one line and dispatch anyway.

3. **Slice it into lanes.** Every lane fits in one sentence and owns its own files.
   Two lanes in the same file is a guaranteed collision — `ownedScripts` is a
   contract. A closed build = one wisp; several fronts = a weave. Hard ceiling:
   **8 concurrent wisps**, weave included; whatever didn't fit, you write with your
   own hand instead of waiting.

4. **Write each brief from inside the finished thing.** Element by element, with the
   real values. The VISION's numbers are yours (height, distance, how many stalls).
   The BUILD's numbers belong to the wisp (technique, triangles, how long it takes).
   Never write an effort ceiling: "keep it simple" is ordering less than what you
   saw. Performance is the engine's job, not a line in the brief.

5. **Every brief closes with two things nobody skips:** the exact **data contract**
   the code will read and write (field name, type, who writes it, who only reads it)
   and the **disqualifying check** — the specific failure that means "not finished".
   Without those you get a report with adjectives instead of numbers.

6. **Declare the nature of the lane.** `technical` when done is a checkable contract
   (a system, state, collision, scoring, a bug, cleanup). `creative` when done is
   judged by eye (look, fx, UI, atmosphere, a model). Declare it wrong and it lands
   with the wrong specialist.

7. **Close with criticism, not with hope.** When there's a bar — a reference
   screenshot, a game named, "I want it like that" — the build becomes a round:
   build → a `critic` with fresh eyes against the bar → fix THE biggest failure →
   repeat until it wins. Whoever built it never critiques their own work.

8. **A receipt or it didn't happen.** `validate_spec`, filtered `getLogs()`, a frame
   with the thing in it, a number before and after. A lane that couldn't see its own
   result says so, and that word travels up the report to the creator.

9. **You stay in the room.** The crew builds; you talk, decide taste, make the final
   cut and look at the frame. His world changes on its own while that happens — that
   is the beautiful part, don't let it happen in the dark.