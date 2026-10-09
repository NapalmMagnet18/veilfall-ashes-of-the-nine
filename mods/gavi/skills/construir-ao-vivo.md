---
name: Build Live
description: Building LIVE in front of the creator — even with the chat tab closed. The 60-second scaffold law, the world as the message, work that carries on by itself in wisps and weaves, the notifyDm sensors that make the playtest report itself, and the rule about never leaving the world broken at some random second.
---

# Building live

## pick the path in 10 seconds

| the situation | what to do |
| --- | --- |
| a big ask just landed and the world is empty | Law 1 — scaffold on their screen in **60 s**, before any dispatch |
| you're about to send a crew | scaffold first, then dispatch. a crew over a void = 10 min of nothing |
| deciding what you build vs the crew | Law 2 — centrepiece and taste yours, edges and systems theirs |
| a piece isn't finished yet | Law 3 — it lands **whole** or it doesn't land. no white boxes |
| the creator walked away from the chat | Law 4 — plant `notifyDm` sensors, the game reports itself |
| a lane just landed | Law 5 — the world changed; one line in chat only if they can touch it |
| about to say "done" | Law 6 — a frame at play distance, or a 6-frame burst. never from reading code |
| nothing visibly changed | say nothing (Law 7). their chat is not a build log |
| the whole game needs a pass, not a piece | `gavi#testar-tudo` |
| a finding you'll want in three weeks | `gavi#memoria-infinita` |
| they asked for everything, at maximum | `gavi#mandar-enxame`, and `gavi#uma-so` for the fused top-effort mode |

The creator isn't reading. They're **in the game**, spinning the camera, running around
with the character, the chat tab sitting behind another window. If your work only exists
as text, then for them it doesn't exist. This skill is the law of how Gavi works when
nobody is looking at the chat — and how the world tells the story on its own.

The mother rule, before any other:

> **The world is the message. The chat is the footnote.**
> If they have to read to understand what changed, you failed. They have to SEE it.

---

## Law 1 — The scaffold in 60 seconds

Never dispatch a big build over a void. The first thing your own hands do is put
something on their screen they can look at and react to: ground, three boxes in the right
spot, a light, a fake HUD with a zero in it.

| Moment | What they see | Whose hands |
|---|---|---|
| 0–60 s | scaffold: ground, grey volumes at their final positions, one light | your own |
| 1–5 min | the centrepiece takes its real shape | your own |
| in parallel | the edges of the world, the systems, the polish | the crew (wisps) |
| at the end of each lane | the world changes on its own in front of them | the lane that landed |

The scaffold is theirs, not yours. It's not an instrument, not a probe, not a test: it's a
thing on the screen they can swear at. A crew sent out into a void leaves the creator
staring at nothing for ten minutes.

When **there is no screen** — work with no client, a world you can't see — you say that in
one line and dispatch anyway. A wisp nobody is watching still builds.

---

## Law 2 — The work carries on without you

A closed tab pauses nothing. What keeps running while the creator is away from the chat
are **wisps** and **weaves**: they write straight into the live spec, and the live spec is
their game, running, in that very second. They come back to a world different from the one
they left — that's the most beautiful thing this engine does.

Which is why the division of labour is always the same:

| Goes to your hands | Goes to the crew |
|---|---|
| the opening scaffold | whole systems |
| the piece they asked to watch being born | batches of art and scenery |
| the call that's a matter of taste | a bug that already survived two of your attempts |
| the final cut, the eye on the frame | screens, HUD, effects, zones |

The real ceiling: **6 lanes run at once**. A wider fan-out is not refused — it **queues** and
starts as slots free, so queue the whole plan when the work is real. The budget that does bite
is **60 agent calls per grant**: past it the weave **parks** and asks instead of failing, a DM
tells you where it held, landed work is safe, and the creator's go-ahead buys a fresh 60. So
the recovery is never arms-folded waiting — it's writing the piece that didn't fit yourself
while the queue drains.

---

## Law 3 — Never leave the world broken at some random second

They can look at the screen at ANY instant. There is no "it's broken for just a minute". A
live build lands whole or it doesn't land.

1. A new object is born with its shape, material and final position already — never a
   white box "I'll sort out later".
2. A data contract (the `state` the HUD reads) changes **together** with whoever reads it,
   in the same pass.
3. Terrain and atmosphere change in one edit, not in seven.
4. After every landing: `validate_spec`. Green, or roll it back.
5. No "under construction mode" with the game switched off. If you need to switch it off,
   it's because the piece wasn't ready to land.

```js
// lands whole: shape, surface and place in the same spawn
api.spawn('plaza-marker', {
  tags: ['scenery'],
  properties: {
    primitive: { kind: 'scripted', script: 'scripts/gen/marker.js' },   // the key is `script`, not `geometry`
    material: { texture: 'cdn/moodboard-toon-vibrant/texture-pedra-clara.png', color: 'oklch(0.72 0.03 80)', roughness: 0.82 },
    feetPosition: { x: 12, z: -40, y: { terrain: 0 } },
    physics: { body: 'static', collider: 'auto' }
  }
});
```

---

## Law 4 — The game reports itself

With the tab closed, the channel you have left is the game itself talking to you. Plant
sensors on the heartbeats that matter **before** you step away, and the next time you look
at the chat you already know what happened in their playtest.

| Sensor | When | Call |
|---|---|---|
| first time for a clip/state | once in the world's life | `api.notifyDmOnce(key, text)` |
| ugly spike (heavy landing, high damage) | every time, with a number | `api.notifyDm(text)` |
| a stall (a state that should change and doesn't) | with an anti-spam lock | `api.notifyDm(text)` |
| progress milestone (reached the boss, took the key) | once | `api.notifyDmOnce(key, text)` |

```js
// scripts/stall-sensor.js — moving for 3 s with no footfall pulse. runs on the thing that moves.
export const updateSchedule = { every: 3 };            // 10 Hz is plenty for a stall watch
export function update(dt, api) {
  const s = api.scratch('sensor');                     // local memory, never replicated
  const now = api.getTick();
  s.lastStep ??= now; s.warned ??= -9999;
  const v = api.getVelocity();
  const moving = Math.hypot(v.x, v.z) > 2;             // 2 m/s = walking, not drifting
  if (!moving) { s.lastStep = now; return; }
  // 90 ticks = 3 s at 30 Hz · 1800 ticks = 60 s of anti-spam lock
  if (now - s.lastStep > 90 && now - s.warned > 1800) {
    s.warned = now;
    api.notifyDm(`the rabbit ran ${((now - s.lastStep) / 30).toFixed(1)} s with no footfalls — clip may have stalled`);
  }
}
```

Three rules for sensors: text in **plain English and in world language** (not
`gait.seq stalled`, but "the rabbit is running with no footfalls"); a number right there
with it, because a sensor with no measurement is worth nothing; and an anti-spam lock on
anything that can fire per frame — `notifyDm` at 30 Hz is a way of hating yourself.

---

## Law 5 — The crew narrates through the world, not through the chat

Every lane that lands changes something you can see. Write the brief from inside the
finished version, with the world's numbers (heights, distances, counts), and demand the
**disqualifying check** from the lane: the frame it has to capture before it says "done".

```js
// weave: the lanes land one by one, and the world changes on its own between them
phase('plaza');
const base = await agent({
  label: 'plaza',
  task: 'Stone floor 40x40 m, central fountain 3 m across, eight benches turned toward the fountain...',
  ownedScripts: ['scripts/gen/plaza.js'],
  modelClass: 'creative'
});
notify(base.ok ? 'the plaza landed — you can walk around on it now' : 'the plaza stalled, taking it by hand');

phase('life');
await all([
  agent({ label: 'market', task: '...', ownedScripts: ['scripts/gen/stall.js'] }),
  agent({ label: 'sound',  task: '...', ownedScripts: ['scripts/plaza-ambience.js'] })
]);
```

`ownedScripts` is what stops two lanes fighting over the same file. A lane with no declared
owner is a lane that will overwrite its sister.

---

## Law 6 — Prove it with the eye, not with text

"It's done" only after a frame. Never after reading the code.

1. `view_live_scene` with the camera at the **game's real reading distance** (the player
   camera's distance, not 2 m with your nose against it).
2. Movement → a burst of 6 frames over 2–2.5 s.
3. Compare it against the burst from before. With no baseline, "it got better" doesn't
   exist.
4. A conjured asset still cooking in the caption = the frame is NOT final. Wait.

---

## Law 7 — How to talk to somebody who isn't reading

One line, at the moment the thing can be touched. Never a report.

| Situation | What goes out in the chat |
|---|---|
| a lane landed and changed the screen | one sentence and an invitation: "the plaza is standing, go take a walk in it" |
| a lane landed and nothing visible changed | silence |
| a sensor fired something good | silence (that one's for you, not for them) |
| a sensor fired something ugly | one line: what broke and that you're already on it |
| you need their finger | one line, direct, with the single question |

Their chat is not a build log. It's the door opening: "come in and look".

---

## Live-build checklist

- [ ] Scaffold on their screen before any dispatch
- [ ] Centrepiece in my hands, edges to the crew
- [ ] No broken intermediate state — it lands whole
- [ ] `validate_spec` green after every landing
- [ ] `notifyDm` / `notifyDmOnce` sensors planted on the heartbeats
- [ ] Baseline burst BEFORE, proof burst AFTER
- [ ] One line in the chat only when they have something to touch

---

## The failure list — how a live build embarrasses you

| the trap | the TELL | the fix |
| --- | --- | --- |
| a crew dispatched over an empty world | they spin the camera for 10 minutes at nothing and ask if you're still there | scaffold first: ground, grey volumes at final positions, one light, 60 s |
| landing a piece half-built | they look at the exact second the white box exists, and that's the version they remember | Law 3 — shape, material and position in the same spawn |
| the contract changed without its reader | the HUD shows `undefined` or a frozen 0 while the system underneath works fine | change the writer and `ui.js` in the same pass |
| `notifyDm` with no anti-spam lock | your chat is 400 identical lines and the real report is buried in them | a tick deadline in `api.scratch` — 1800 ticks = 60 s between shouts |
| "it's done" from reading the code | they open it and the thing is 4 m to the left, or not drawn at all | a frame at the play camera's distance; a burst for anything that moves |
| a report in their chat instead of an invitation | they stop reading you, and then they stop seeing the good stuff too | one sentence, and only when there's something to touch |
| a conjured asset still cooking, called final | the frame's caption says pending and you certified it anyway | wait for the caption to settle; "failed to serve" is terminal — re-mint under a `-2` name |