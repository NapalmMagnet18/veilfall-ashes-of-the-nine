---
name: Animate 2d
description: Sprites and single values — driving 2D art through the mixer, the lowercase-kebab clip slug law that decides whether a channel plays at all, highest-weight selection and one-shots, atlas cook timings, facing by ?facing= swap, and 1D property tweens with the real easing registry (an unknown easing name silently becomes easeOutQuad).
---

# Gavi — 2D and 1D

two jobs in one file: sprite art driven by the mixer, and the single number going from
A to B that is most of a game's actual animation. the law is `gavi#animar-doutrina`,
the proof is `gavi#animar-verificar`.

## route in 10 seconds

| the situation | do this |
| --- | --- |
| sprite must walk / attack / idle | mixer channels with **lowercase-kebab** clip slugs (§1). nothing else drives a sprite |
| half the cast animates, half is frozen | a capital letter in a clip name. `Idle` is skipped entirely on a sprite (§1) |
| sprite plays one beat then freezes | the atlas is still cooking. `sprite-atlas-missing`, retried every 30 s — wait, don't rewrite (§3) |
| character faces the wrong way | `?facing=` texture swap, 8 closed tokens. never `flipX` for an asymmetric body (§5) |
| two clips both look half-applied | sprites can't blend two atlas cells. highest weight WINS, outright (§2) |
| door, platform, HUD, bar, camera push | `api.animate` + §7's curve table |
| you reached for `easeOutBack` | it is not in the registry. unknown names silently become `easeOutQuad` (§7) |
| thing gets interrupted constantly | spring, not tween (§8) |
| the sheet's frame count is a guess | the professional tier (§4.1) — and 8 good frames beat 24 mediocre ones |
| the attack plays and nothing lands | the impact frame held 2 ticks, plus one smear (§4.2) |
| pixels crawl and shimmer while walking | sub-pixel motion. snap the art to the texel grid (§6.1) |

---

## part 1 — sprites

### 1 — the clip slug law, which decides whether anything plays at all

a sprite mixer channel's clip name must match:

```
/^[a-z0-9]+(?:-[a-z0-9]+)*$/
```

**lowercase kebab-case. no capitals, no spaces, no underscores.** the engine composes
the clip into an `?animated=<clip>` atlas URL, and anything outside that shape is 3D
vocabulary bleed: the channel is **skipped entirely** and selection moves on to the
next channel. one capital letter is the whole bug.

```
[sprite-animation] entity "hero" mixer channel "legs" clip "Idle" is not a 2D
storyboard clip slug — skipping it on the sprite
```

that is the tell for "half my cast is frozen", and it is loudest right after a 3D→2D
flip, where old `Idle`/`Walk` channels outlive the appearance change and leave the
sprite on its base frame forever.

the clip name **is** the animation prompt. verb-first, hyphenated, eight-plus words of
stage direction — the mint reads it:

```js
api.updateChannel('locomotion', {
  clip: 'walk-heavy-armored-trudge-shoulders-rolling-helmet-bobbing-with-each-step',
  loop: 'loop', weight: 1,
});
```

one-shots read as two beats with `-then-` introducing the held end pose. never bake
facing or direction into the slug — the engine derives the atlas from whichever faced
texture is currently active.

### 2 — selection: highest weight wins, no blending

you cannot show two atlas cells at once, so a sprite's mixer collapses to **the
highest-weight channel drives the sprite**. everything else about it follows:

- a `loop: 'once'` channel stops winning the moment its clip plays through; the
  next-highest live channel resumes on its own. if the one-shot is the only channel,
  the sprite holds its final frame.
- so the shape is: a permanent low-weight `idle`, a `locomotion` channel raised only
  while grounded and moving, and one-shots that out-weigh both.

```js
// scripts/hero-sprite.js
const IDLE = 'idle-stands-loose-breathing-slow-cloak-shifting-in-the-draft';
const WALK = 'walk-relaxed-adventurous-stride-arms-swinging-loose-at-the-sides';
const HURT = 'flinch-back-hard-off-the-hit-arm-flying-up-then-holds-braced';

export function onSpawn(api) {
  api.setProperty('mixer', { idle: { clip: IDLE, loop: 'loop', weight: 0.2 } });
}

export function update(dt, api) {
  const v = api.getVelocity();
  const moving = Math.hypot(v.x, v.z) > 0.4 && api.isGrounded();
  // identical calls every tick are free — and module flags do NOT survive a
  // prediction replay, so never cache "already sent"
  api.updateChannel('locomotion', { clip: WALK, loop: 'loop', weight: moving ? 1 : 0.001 });

  const hit = api.getChannel('hurt');
  if (hit && hit.finished) api.updateChannel('hurt', null);
}

export function onCollide(other, api) {
  api.updateChannel('hurt', { clip: HURT, loop: 'once', weight: 3 });
}
```

`api.getChannel(name)` → `{ clip, weight, elapsed, duration, finished, progress,
events }`. land damage on the clip's own `'main'` frame event, never on a timer:

```js
if ((api.getChannel('swing')?.events || []).includes('main')) dealDamage();
```

### 3 — atlas cook timings, so "frozen" gets diagnosed instead of rewritten

- the default atlas playback rate is **12 fps**.
- a clip whose atlas has not landed reports a **nominal 1.33 s** duration (16 frames at
  12 fps) so `finished` on a one-shot still fires — that nominal value IS the
  not-yet-cooked signal, never a permanent `null`.
- `sprite-atlas-missing` on the log rail means variants are still generating: the
  sprite holds its **base frame** and the engine retries every **30 s**. do not change
  the asset URL. wait.
- the same code with `FAILED to generate (HTTP …)` is **terminal** — "retrying this
  exact name cannot succeed". regenerate under a different clip name; the base texture
  is unaffected.

### 4 — frame counts and the timing that carries the punch

| clip | frames | duration | at 12 fps |
| --- | --- | --- | --- |
| idle | 2-4 | 0.6-1.0 s | 8-12 frames of budget |
| walk | 4-8 (8-12 deluxe) | 0.5-0.7 s | 6-8 |
| run | 6-8 | 0.35-0.45 s | 4-5 |
| jump | 1 rising + 1 apex + 1 falling | held by STATE, not by time | — |
| attack | 3-5 | 0.18-0.3 s, exactly **1** anticipation frame | 2-4 |
| hit | 1-2 | 0.12 s, flashing | 1-2 |

8 frames in 0.6 s = **75 ms each** (~13 fps). the same 0.6 s over 12 frames = 50 ms
(20 fps): smoother, 50% more drawing. 4-8 is the floor that ships, 8-12 is for the hero
and the boss.

and the rule that makes it hit: **do not spread frames evenly.** the contact frame
holds **2-3×** its neighbours. that is where the punch comes from, in every register.

a run cycle in sprite is *faster* than in 3D (0.35-0.45 s against 0.5-0.7 s) and that
is not an inconsistency: 8 discrete poses played slowly read as a slideshow, the eye
needs the fast repetition to fuse them. 3D interpolates for you, so its cycle can be
biologically honest.

### 4.1 — the professional tier: counts, rates, and why 8 beats 24

§4's table is the floor that ships. this is the bar a professional sheet hits:

| clip | frames | fps | seconds | the frame that does the work |
| --- | --- | --- | --- | --- |
| idle | **4-8** | 8-12 | 0.5-1.0 | the top of the breath, held longest |
| walk | **6-8** | 10-12 | 0.55-0.7 | the two contacts |
| run | **6-8** | 12-15 | 0.4-0.55 | the airborne frame — both feet off the ground |
| attack | **5-9** | 12-15 | 0.35-0.6 | the impact frame, **held 2 ticks** |
| hit | **2-3** | 10-12 | 0.2-0.25 | the first, at full displacement |
| death | **6-10** | 8-10 | 0.7-1.1 | the last, held forever |

**the rate is not a per-clip field.** the engine plays an atlas at
`sprite.fps ?? the atlas's own declared fps ?? 12`, and under a mixer you never write
`sprite.fps` — it is overridden every tick and warned. the lever is the channel's
**`speed`**: `speed: 1.25` turns the 12 fps default into 15, `speed: 0.75` into 9.

```js
api.updateChannel('locomotion', { clip: RUN, loop: 'loop', weight: 1, speed: 1.25 }); // 15 fps
```

a conjured atlas declares its own frame count in the file, so the counts above are what you
author TOWARD: on a drawn sheet you draw exactly them; on a conjured one you ask for them in
the slug's stage direction and check what came back with `api.getChannel(name).duration`
(when the metadata cannot be read at all the engine assumes 16 frames at 12 fps — that is
§3's 1.33 s nominal).

**8 good frames beat 24 mediocre ones**, and that is not a budget excuse. what the eye reads
is 4-6 KEY poses and the spacing between them; inbetweens are glue. 8 frames is 6 keys plus
2 breakdowns — a complete action. 24 frames at 12 fps is a 2 s clip: four times the drawing,
four times the cook, one silhouette diluted across 24 mediocre poses. add a frame only where
the action needs a distinct POSE, never to make it smoother.

### 4.2 — the impact frame and the smear frame

**the impact frame** is the single frame the attack exists for: the widest silhouette, the
deepest lean, the fx and the damage on it. it holds **2 ticks** — 167 ms at 12 fps, twice
its neighbours.

there is no per-frame duration in an atlas: playback runs at a constant rate on a uniform
grid, so a hold IS a duplicated cell. on a drawn sheet, draw the cell twice. on a conjured
one, put the hold in the slug — `...-impact-frame-holds-then-recovers`. §4's "the contact
frame holds 2-3× its neighbours" is the same law; this is its attack-shaped case, and it is
where the punch comes from in every register.

**the smear frame** is one frame at the fastest point of the action, drawn as the shape
BETWEEN two poses: a stretched arm, a repeated ghost of the blade, a solid arc where the
hand was. it is why 6 frames read as fast instead of as 6 poses. one smear per action — two
reads as mud — and it is the one frame where wrong anatomy is correct.

so a 7-frame attack is: 1 anticipation · 1 smear · **1 impact (held 2)** · 1 · 2 recovery.
the swing itself is the shortest part of it (`gavi#animar-doutrina` §3.1).

### 5 — facing is a texture swap, never a mirror

eight closed tokens, no synonyms: `up`, `down`, `left`, `right`, `up-left`,
`up-right`, `down-left`, `down-right`. a top-down base sprite already faces `down` —
the bare URL IS the down pose. each face is real art, so a sword hand or a satchel
stays on the correct side; `flipX` or `scale: { x: -1 }` moves it to the wrong one.

write them as **literal strings** — the prewarm scans the file for them, so a
loop-built map warms nothing:

```js
const HERO = '/cdn/moodboard-pixel-bright/sprite-topdown-young-hero.png';
const FACES = {
  down: HERO,
  'down-right': HERO + '?facing=down-right',
  right: HERO + '?facing=right',
  'up-right': HERO + '?facing=up-right',
  up: HERO + '?facing=up',
  'up-left': HERO + '?facing=up-left',
  left: HERO + '?facing=left',
  'down-left': HERO + '?facing=down-left',
};
```

pick the octant from whatever actually moved this tick (a dash or a knockback turns the
body with no stick input), with a speed deadzone so idle holds the last facing.

### 6 — pixel and sorting laws

- **in-plane rotation does render** — `rotation: { roll }` tilts a `2d-side` sprite,
  yaw spins a `2d-top` one, pivoting on the sprite's `anchor`. but on pixel art it
  grinds the grid: turn a character by `?facing=` swap and keep `roll` for projectiles,
  tipping crates and banking. `upright: true` opts the ART out of entity rotation
  entirely while the body still turns — that is what a `?facing=` character wants.
- **integer scale only.** 2×, 3×, 4×. 1.7× is mush. generated sprites are calibrated at
  **64 px per world unit**; keep `size` square (`[3, 3]`, never `[1.1, 3]`) or the
  square canvas stretches.
- **squash and stretch is a redraw**, not `scale`.
- **one interleaving layer.** everything that should occlude everything else — player,
  npcs, trees, buildings — goes on the SAME `sortingLayer` (use 10) with `ySort: true`.
  `sortingLayer` always wins before `ySort`, so a player on 20 over trees on 9 draws in
  front of every tree forever. `ySort` sorts on world **Z** in both 2D modes.

### 6.1 — sub-pixel motion, and why it destroys pixel art

a pixel sprite drawn at a **non-integer screen position** resamples: edges shimmer, 1-px
details crawl, and the whole character reads as vibrating. it is worst at low speed —
0.2-1 m/s, which is exactly walking pace — and it is invisible in a still, so it ships.
three causes, three fixes:

1. **fractional world position.** generated sprites are calibrated at §6's 64 px per world
   unit, so one texel is `1/64` m = **1.5625 cm**. quantize the ART to that grid, not the
   body: put the sprite on a child and snap the child's local offset, so the physics body
   keeps its continuous motion and only the drawn pixels land on the grid.

```js
const TEXEL = 1 / 64;                                  // metres per sprite texel
const snap = (v) => Math.round(v / TEXEL) * TEXEL;
// on the sprite CHILD — the parent body keeps its smooth sub-texel movement
api.setObjectProperty(spriteChildId, 'feetPosition', { x: snap(off.x), y: snap(off.y), z: 0 });
```

2. **fractional scale.** §6's rule, and this is the other half of why: 1.7× puts every
   source texel between two screen pixels, permanently.
3. **a render buffer that is not an integer multiple of the art.**
   `api.patchEngine({ graphics: { renderResolution: [480, 270] } })` is the professional
   lever — a hard ceiling that renders at that buffer and upscales, so the art keeps one
   fixed pixel size. pair it with `sprite: { filter: 'pixel' }`. and know the honest state
   of its neighbour: `graphics.perfectPixelArt` is stored as INTENT (it seeds a pixelate
   size for the look; global renderer enforcement is not wired), so never rely on that flag
   alone to make pixels crisp.

the opposite failure — motion too SMALL to cross a texel at all — is
`gavi#animar-qualquer-estilo` §2's row. this section is the other one: motion that lands
between texels.

---

## part 2 — one number from A to B

most of a game's animation is not a character: a door opening, a platform travelling,
the camera pushing in, a bar draining, a damage float rising.

### 7 — api.animate, and the easing registry that will bite you

```js
api.animate('cellar-door', {
  keyframes: { 'rotation.yaw': [0, 96, 90] }, // dot-paths work; 96 then back to 90 = overshoot
  duration: 0.42,
  easing: 'easeOutCubic',
});
```

the registry holds **23 names**: `linear`, plus `easeIn/easeOut/easeInOut` ×
`Quad, Cubic, Quart, Quint, Sine, Expo, Circ`, plus `easeOutBounce`.

> **an unknown easing name does not throw — it silently resolves to `easeOutQuad`.**

so `easeOutBack`, `easeOutElastic`, `spring`, `cubic-bezier(...)` are all just
`easeOutQuad` wearing a costume, and the tween looks fine while being wrong. want a
UI pop that overshoots? do it in the **keyframes**, not the curve:

```js
// scale 0 → 1.12 → 1.0. the 12% overshoot is the life, and it is real
api.animate(id, { keyframes: { scale: [0, 1.12, 1] }, duration: 0.2, easing: 'easeOutCubic' });
```

| thing | curve | why |
| --- | --- | --- |
| door, drawer, lid | `easeOutCubic` | leaves fast, settles soft |
| platform back and forth | `easeInOutSine` | no jolt at either end |
| UI appearing | `easeOutCubic` + a `[0, 1.12, 1]` keyframe overshoot | reads alive without a fake curve name |
| UI dismissing | `easeInQuad` | leaves without asking for attention |
| health bar dropping | two bars: red snaps, white follows `easeOutQuad` 0.4 s behind | the eye reads HOW MUCH was lost |
| camera push-in | `easeOutExpo` | dramatic and it doesn't wear out |
| landing thud on a prop | `easeOutBounce`, 0.25 s | the one bounce that IS in the registry |

### 8 — a spring when the target keeps moving

a fixed-duration tween fights interruption. camera follow, HUD reaction, a dragging
limb: use a spring, integrated with `dt` inside `update`.

```js
export function update(dt, api) {
  const s = api.scratch('spring');
  if (s.v === undefined) { s.v = 0; s.x = 0; }
  const target = api.getState().targetX || 0;
  s.v += (target - s.x) * 90 * dt;   // stiffness 60-120 = firm
  s.v *= Math.exp(-13 * dt);        // damping 10-16 = arrives without ringing
  s.x += s.v * dt;
  api.setProperty('feetPosition', { x: s.x, y: 0, z: 0 });
}
```

stiffness 90 / damping 13 is critically damped enough to arrive and stop. stiffness 20
/ damping 5 is loose and comic. one spring per layer, each a little looser than the one
above — that is why a cape, an ear and a tail read as having weight.

### 9 — duration is the decision, the curve is the flavour

- response to a button press: **< 0.1 s**, or the game feels stuck.
- hit feedback: 0.08-0.15 s.
- state transition (menu, level): 0.25-0.4 s.
- ambient (a cloud, a far door): 1 s+.

in doubt, halve it. interface animation is almost always too slow.

## what goes wrong

- **a capital letter in a sprite clip name.** TELL: that character never animates while
  others do; `[sprite-animation] … is not a 2D storyboard clip slug` in `getLogs()`.
  FIX: lowercase kebab only (§1). worst right after a 3D→2D appearance flip.
- **treating a cooking atlas as a bug.** TELL: sprite holds one frame,
  `sprite-atlas-missing` in the log, duration reads 1.33 s. FIX: wait — it retries every
  30 s. only a `FAILED to generate` line is terminal, and that one needs a new name.
- **the one-shot never returns to idle.** TELL: character stuck on the last attack
  frame. FIX: it was the only channel, so it holds. keep a permanent low-weight `idle`
  (§2) and clear the one-shot on `finished`.
- **caching "already sent" in a module variable.** TELL: after a rollback or resim the
  channel never updates again. FIX: call `updateChannel` every tick with derived values;
  identical calls cost nothing.
- **`easeOutBack` / `easeOutElastic`.** TELL: the tween works but has no overshoot at
  all. FIX: not in the 23-name registry — it silently became `easeOutQuad`. put the
  overshoot in the keyframes (§7).
- **flipX on an asymmetric character.** TELL: the sword or satchel changes hands when
  they turn. FIX: `?facing=` swap, written as literal strings (§5).
- **everything on its own sortingLayer.** TELL: the player draws in front of a tree
  they are clearly standing behind. FIX: one shared layer + `ySort: true` (§6).
- **24 frames of mush.** TELL: an expensive sheet that reads worse than an 8-frame one, and
  no single frame you can point at as the pose. FIX: 6 keys + 2 breakdowns, one held impact
  (§4.1, §4.2).
- **the attack with no punch.** TELL: the frames play, the hit does not land. FIX: the impact
  frame held 2 ticks and one smear at the fastest point (§4.2).
- **the walking shimmer.** TELL: edges crawl and 1-px details flicker at walking pace, clean
  standing still and clean sprinting. FIX: sub-pixel motion — snap the sprite child to the
  texel grid, integer scale, a fixed `renderResolution` (§6.1).