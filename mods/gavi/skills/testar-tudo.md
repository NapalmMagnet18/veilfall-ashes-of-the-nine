---
name: Test the whole game — the full sweep, and when to restart
description: How the fused builder proves a game works end to end instead of proving one line compiled. The playable spine walked from boot to death to second run, which instrument proves which claim, the pre-flight audit probe, and the honest truth about restarting the room versus reloading the page — what each one actually heals, and what neither of them does.
---

# Test the whole game

A change that compiles is not a change that works. A change that works in isolation
is not a change that works *in the run*. The bar is the whole spine: someone opens
the link, plays, fails, comes back, and nothing along that path is broken.

This skill is two halves — **the sweep** (what to walk, and what proves each step)
and **the restart** (what a room reboot and a page reload actually fix, which is far
less than people believe, and far more than people believe, in different places).

---

## The ten-second table

| the claim | the instrument that proves it | what does NOT prove it |
| --- | --- | --- |
| the spec took the shape I authored | `validate_spec` | the write returning success |
| nothing else broke | `getLogs()` | silence in the chat |
| it exists, once, and it's mine | `identify_object` / a counting `query` | having spawned it |
| the player can see it | `view_live_scene` with **no arguments** | a camera shot from your own angle |
| it moves | `view_live_scene` with `burst` | one still frame |
| you can't walk through it | `view_live_scene` with `colliders: true` | the mesh looking solid |
| the HUD is alive | `read_authored_ui` (its delivery receipts) | the HUD being in the last screenshot |
| the object looks right in the abstract | `preview_object` | **nothing about the live game** |

The last row is the trap. The preview booth is a different scene with different
light and no behaviors. It is for judging a shape, never for confirming a change.

---

## Part one — the sweep

### The spine, in order

Walk it in this order, because each step can only fail honestly once the one before
it passed:

1. **Boot.** Fresh eyes on the first frame. Is there a world, a horizon, a light?
2. **The first screen.** Title, mode pick, character pick — whatever gates play. A
   gate that never opens is the most common total-loss bug, and it hides from every
   probe that starts *inside* the game.
3. **Spawn.** Feet on ground, not inside it, not 400 m above it. Read
   `feetPosition.y` against `getTerrainHeight` at the same x/z.
4. **The first input.** One key, traced all the way to the direction the body goes.
   Not "the handler ran" — the body moved the way the hand expected.
5. **The core verb.** The thing the game is *about*, done once, with its feedback:
   sound, visual, state change. All three channels or it feels dead.
6. **The failure state.** Take the damage. Fall. Drown. Lose. A game whose fail
   state has never been triggered has never been tested.
7. **The recovery.** Respawn, retry, restart the round. This is where state that was
   never reset shows itself.
8. **The second loop.** Do it all again without reloading. Leaks, orphans and
   accumulating listeners only appear on run two.
9. **The HUD, against the state it claims to show.** Compare the drawn number with
   the real one, not with itself.
10. **The exit.** Leaving, re-joining, a second player arriving.

### The pre-flight audit

Before walking any of it, one read-only probe that catches the cheap failures in a
single call — and, critically, **reports the size of every set it swept** so a wrong
filter turns itself in instead of reading as "all clear":

```js
// run_script, readOnly: true
const out = { swept: {}, problems: [] };

const mobs = api.query({ tags: ['mob'], radius: 100000 }) || [];
out.swept.mobs = mobs.length;
const bodiless = mobs.filter((m) => !api.getObject(m.id));
if (bodiless.length) out.problems.push(bodiless.length + ' of ' + mobs.length + ' mobs are in the query but have no live body');

const players = api.getPlayers() || [];
out.swept.players = players.length;
for (const p of players) {
  const feet = api.getObject(p.id) && api.getObject(p.id).properties.feetPosition;
  if (!feet) { out.problems.push(p.id + ' has no live body'); continue; }
  const ground = api.getTerrainHeight(feet.x, feet.z);
  const dy = feet.y - ground;
  out.swept[p.id] = { dy: Math.round(dy * 100) / 100 };
  if (dy < -0.6) out.problems.push(p.id + ' is ' + (-dy).toFixed(2) + 'm INSIDE the ground');
  if (dy > 8) out.problems.push(p.id + ' is ' + dy.toFixed(1) + 'm above the ground — falling or stuck aloft');
}

const managers = api.query({ tags: ['manager'], radius: 100000 }) || [];
out.swept.managers = managers.length;

return out;
```

`swept` is not decoration. `{ mobs: 0, problems: [] }` is not a clean game — it is a
broken query, and without the count it reads identical to a clean game.

### Reading the logs like a tester

`getLogs()` is the room's in-memory server log. Four families worth knowing on sight:

- **Behavior errors** — `Behavior error in onTick for scripts/x.js` — a real crash,
  fix it now, and note that a throwing hook can silently stop everything after it in
  that script.
- **Budget parks** — `update() on player/... took 36.0ms against its 16.7ms tick
  budget. Repeat offenses park it for 10s.` This one is a monster in disguise: a
  parked stack looks exactly like ten separate frozen-feature bugs. **Read for this
  line before diagnosing anything that "stopped responding".**
- **Client reports** — adaptive quality steps, texture load failures, collider
  fetch failures, realm boot faults. These describe one player's machine, and some
  of them say outright that no game edit can fix them. Believe that sentence.
- **Write-fence and upload lines** — the network's back pressure, not your bug.

Logs are the room's memory of what just happened, and they are **wiped by a
restart** (see below). Read them before you reboot anything, never after.

### What "done" is allowed to mean

Three honest sentences, and nothing between them:

- *"it's in, and I watched it work"* — you hold the frame or the probe.
- *"it's in, I haven't looked yet"* — say exactly this, never dress it up.
- *"it's in and it's still wrong — here's what I'd try next"* — a fix that missed
  twice is upstream. Stop patching the site; go up a level and come back
  structurally different.

---

## Part two — the restart, honestly

There are two different reboots and they heal two different illnesses. Using the
wrong one is a lot of disruption for no cure.

### What a script edit already does by itself

**Script edits apply live.** The moment the file saves, the running world is using
it. A restart does not "compile" it, does not "reload" it, does not make it take
effect harder. If a change did not appear, restarting the room is the wrong lever —
check your own work first: did the file actually save, is the object actually
carrying that behavior, is an every-tick write overwriting your one-off edit.

### Reboot the room — `manage_engine_version`, action `restart-rooms`

This reboots the game's dev rooms on the engine they are already pinned to. It is
the **unstick lever**, and it is the right call for exactly these:

- a room that is genuinely wedged — half-dead, not answering, systems that will not
  re-arm.
- **spec-declared objects that survived a live delete.** `api.destroy` removes the
  thing from the running world but not always from the authored spec — so it is gone
  now and *back after a reboot*. If you need it gone for real, the spec entry has to
  go, and the reboot is what proves it did.
- anything that only happens **at world boot** — generator changes, a place's
  starting objects, spawn-time wiring. If the bug is in the first two seconds of a
  world's life, you cannot test it in a world that is already three hours old.
- an engine version change, which restarts the dev rooms as part of the switch.

Two things it costs, always said out loud first:

1. **Everyone in the room gets disconnected.** On a stream, that is the creator and
   their viewers. Warn, then do it.
2. **The logs are wiped.** After a restart, `getLogs()` is empty — and empty logs
   after a reboot prove *nothing*. Never restart to "make sure" before you have read
   what the world was trying to tell you.

And the version rule: **the engine version changes only when the creator explicitly
asks for it.** Never from your own inference. Their game, their version.

### Reload the page — the creator's own tab

Different illness entirely. The room is fine; one *client* has rotted. Ask for a
tab reload when:

- **the authored UI realm never booted.** The receipts say it: compile `ok`, HTML
  `sent`, but the realm sits at `awaiting-hello` and `applied` never arrives. The
  HUD is simply absent for that person while the world renders fine. A page reload
  re-arms the realm. (So does forcing a fresh render — change the HUD's output
  signature by a single attribute and the engine re-sends, which re-arms it without
  costing anyone their session. Prefer that one; it is invisible.)
- **the renderer degraded and stayed down** — quality rungs walked down under load
  and did not come back.
- **a delivery fault** — the script or material library arrived empty on that join
  and objects are wearing fallback surfaces.
- **the input session died** — frames arriving, every one dropped, body receiving
  nothing.

A page reload costs one person a few seconds. A room restart costs everyone. Reach
for the small one first, and reach for it *by name*: "reload your tab" is a real
instruction, not an apology.

### The rule that keeps both honest

> Never restart to make a change take effect. Restart to prove a change survives a
> cold start.

Those are opposite intentions. The first is superstition and it hides real bugs by
sweeping the evidence away. The second is the last gate of the sweep, and it is the
one that catches everything that only works because the world has been running a
long time.

---

## Where this goes wrong

| failure | the tell | the fix |
| --- | --- | --- |
| **the compile is mistaken for the test** | "done" one second after the write returns | the write is step one of ten. Walk the spine |
| **testing from inside the game** | the title screen / mode gate is broken for every real player and nobody noticed | start the sweep at boot, not at the thing you just changed |
| **the fail state never tested** | death, drowning, losing the round have only ever been read in code | trigger it. On purpose. Every time you touch the state it writes |
| **run one only** | leaks, orphaned entities and doubled listeners ship | always a second loop without reloading |
| **restarting to "apply" a script edit** | routine reboots after every save; everyone disconnected repeatedly | script edits are already live. Check your own work instead |
| **restarting before reading the logs** | the evidence is gone and the empty log is read as good news | `getLogs()` first, always. A restart wipes it |
| **a room restart for a one-client illness** | everyone disconnected to fix one person's dead HUD | reload that tab, or nudge the HUD's output signature |
| **the preview booth as proof** | "it renders fine" from a scene the player is not in | the player's own frame — `view_live_scene` with no arguments |
| **a silent restart** | the creator's stream drops mid-sentence | say it before you do it, in one line |