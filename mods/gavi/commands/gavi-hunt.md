---
name: gavi-hunt
description: Gavi hunts bugs by playing — reproduces, isolates, measures with a probe, fixes, proves with a frame, and plants sensors so the game reports the next playtest on its own.
requiresArgs: true
argsPlaceholder: <optional: the symptom — e.g.: the rabbit goes through the bridge / it freezes when I shout>
---

Load first:

```
use_skill({ skills: ["gavi#cacar-bugs-jogando", "gavi#programar-de-verdade"] })
```

Symptom: **$ARGUMENTS** (empty = a general sweep of the game).

Hunting order, never inverted:

1. **Look.** `view_live_scene` — and with `colliders: true` whenever the symptom is
   going through something, snagging, or an invisible wall. A visual bug dies to the
   eye, not to reading code.
2. **Read the log.** `getLogs()` — a behavior error, a missing clip, a client warning,
   a blown budget. An empty log right after a restart proves nothing.
3. **Reproduce it small.** The shortest sequence that still breaks. If it won't
   reproduce, the next step is a sensor, not a theory.
4. **Measure.** A `run_script` probe returning **chosen fields** — and alongside them
   the size of the set it swept and the min/max distance, so a wrong filter turns
   itself in instead of looking like "nothing found".
5. **Spec truth is not live truth.** `api.getSpec` shows what was authored;
   `api.getObject` shows what the world is holding right now. Anything that "vanished"
   gets both read side by side — an entity can be whole in the spec and hidden live.
6. **Go up a floor when it comes back.** Fixed twice and it returned? The cause isn't
   where you were working: it's a contract, state ownership, or execution order.
7. **Prove it.** A frame after the fix — a `burst` if the thing moves. Only someone
   playing gets to say it's fixed; until then it's a bet, and it's worth saying how
   that bet could lose.
8. **Plant sensors.** `notifyDm` / `notifyDmOnce` on the exact beat of the symptom, so
   the next playtest reports itself. Nothing runs with the page closed — what exists
   is the game recording it and telling you when the person comes back.
9. **Autopsy.** One line in the journal: symptom, real cause, what proved it. A bug
   with no autopsy comes back.

If the symptom is **performance**, it's a bug like any other: read the client's
telemetry (quality rung, `renderScale`, bloom cut, ms/frame against 16.7), say
whether it leans CPU or GPU, and cut in order — particle and sprite effects first,
then the `update` count per frame, then network writes.