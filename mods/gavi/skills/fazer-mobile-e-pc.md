---
name: Make Mobile And PC
description: Making one game work on the thumb and on the keyboard — automatic touch projection, authored layout (inputs.touch.surfaces), touching the world, target size, HUD density, one action with three bindings, the frame budget on a phone, and how to prove it came out playable.
---

# Making mobile and PC

## pick the path in 10 seconds

| the situation | what to do |
| --- | --- |
| one stick, a drag camera, ≤4 verbs | **nothing**. the engine's draft already projects it from `inputs` (§1) |
| "there's no stick on the phone" | the axes must literally be `moveX`/`moveZ` (`moveY` in 2D) **with a physical binding** (§1) |
| a 5th verb, twin stick, pedals, a wheel | authored layout: `inputs.touch.surfaces` — it replaces the draft whole (§2) |
| a hotbar / slot stepped by the scroll wheel | **actions** `mouse: 'wheelUp'` / `'wheelDown'`, one pulse per detent — never the `wheelY` axis (§1) |
| controls per mode (driving vs on foot) | `touch.active` selector script — **never** `patchInputs` to switch mode (§2) |
| the phone should tap the world | `touch: { gesture }` + `api.getInputRay(input)` + `api.raycast` (§3) |
| how big may a button be | 56 px comfortable, 52 px secondary, **44 px floor**. nothing tappable smaller (§4) |
| where must nothing touchable go | the stick's 36%×42% bottom-left pocket, the right-edge rail, the bottom centre (§4) |
| what to show on a narrow screen | 3 permanent HUD elements, `text-sm` floor, SVG icons (§5) |
| a chip that does nothing / a verb with no chip | run the §8 orphan-and-dead-button audit before you claim mobile |
| 60 fps on the phone | cut in §7's order: particles → update count → network writes |
| before you declare `mobile: true` | `resolveControls()` + a phone-aspect frame + the audit (§8) |

`gavi#desenhar-o-jogo` already asked "in which hand?". This is the long answer. **The phone is the
constraint that designs the game; the PC is the same game with extra precision** — design for the
thumb and add keyboard/mouse afterwards. If the loop in the hand demands two precise targets at once
or sub-pixel aim, touch changes the verb (drag-aim, auto-fire) or the phone stays out: say that on
the spot.

## 1. The draft — the engine already projects touch

- **The stick is only born from axes literally named `moveX`/`moveZ`** (`moveY` in 2D) **with a
  physical binding**; rename it to `walkX` and the stick disappears, no error. Drag-to-look is born
  from `lookX`/`lookY`; pinch, from a wheel axis (`zoomIn: { mouse: 'wheelY' }`).
- **The wheel is TWO different contracts and mixing them is the classic hotbar bug.** The **axis**
  `mouse: 'wheelY'` is raw scroll delta — continuous, magnitude-carrying, right for zoom and pinch,
  and useless as a stepper: it never says "one notch", so a hotbar driven off it skips three slots
  or none. Discrete stepping is an **action** pair, `mouse: 'wheelUp'` / `mouse: 'wheelDown'` — one
  pulse per physical detent, quantized in the engine's input layer with device and OS variance
  normalized away (valid mouse inputs: `left`, `right`, `middle`, `wheelUp`, `wheelDown` — engine
  5.2.26; on 5.2.24 and earlier they did not exist, so any file that says the axis is the only wheel
  road is out of date). Both live side by side:

```js
api.patchInputs({
  axes:    { zoomIn: { mouse: 'wheelY' } },                   // continuous: zoom / pinch
  actions: { slotNext: { mouse: 'wheelDown' },                // discrete: one pulse per notch
             slotPrev: { mouse: 'wheelUp' } },                // read as input.actions.slotNext
});
```

  On a phone neither exists: a wheel action gets no chip of its own worth having — page the hotbar
  behind a chip, or put the slot on a `gesture` (§3).
- **Each action with a key/mouse binding becomes a chip, 4 at most**, ordered by authored `slot` →
  common verb name (`jump` first) → declaration order. The fifth one **drops**, and loudly:
  `api.resolveControls()` names the drop, a live phone repeats it in `getLogs()`.
- `touch: { button, label, slot, gesture }` per action tunes **the draft only** — never a surface.

```js
api.patchInputs({
  axes: { moveX: { keys: 'a/d', gamepad: 'leftStickX' }, moveZ: { keys: 's/w', gamepad: 'leftStickY' },
          lookX: { mouse: 'deltaX' }, lookY: { mouse: 'deltaY' }, zoomIn: { mouse: 'wheelY' } },
  actions: {
    jump:   { keys: ['space'], gamepad: 'a',  touch: { slot: 1, label: 'JUMP' } },
    sprint: { keys: ['shift'], gamepad: 'lb', activeOn: 'hold', touch: { button: false } },
  },
});
```

`sprint` leaves the draft on purpose: on a phone it comes off the stick at the end of its travel
(§6). The draft is enough with one stick, drag camera and **up to 4 discrete verbs**.

## 2. Authored layout — `inputs.touch.surfaces`

A surface **replaces the entire draft**, with no partial overlay: to start from the draft, compose in
plain JS on top of `api.resolveControls().surface`. **Channel law:** every `x`/`y`/`axis`/`action`
has to name an input **declared** in `inputs.axes`/`.actions` — declared-without-a-binding is legal
and it's the central trick (`aimX: {}` is a touch-only axis, and the behavior can't tell a stick from
WASD); an invalid channel drops with the miss named. The four designs: **twin stick** (2 max, one per
zone; `quantize: 4|8` turns it into a d-pad); **drag-aim** (`drag`: holding streams -1..1 into the
axes, releasing fires with `actionData { x, y, magnitude }`, a short touch is an ordinary press);
**pedals and wheel** (`{ axis: 'throttle' }` sits at 1 while pressed + `pads` `mode: 'absolute'`);
**gestures**.

```js
api.patchInputs({
  axes: { moveX: { keys: 'a/d' }, moveZ: { keys: 's/w' }, aimX: {}, aimY: {} },
  actions: { attack: { mouse: 'left' }, dodge: { keys: ['space'], gamepad: 'b' } },
  touch: {
    surfaces: { default: {
      sticks: [{ x: 'moveX', y: 'moveZ' }],
      buttons: [{ action: 'attack', drag: { x: 'aimX', y: 'aimY' }, slot: 1, size: 'primary', label: 'ATK' },
                { action: 'dodge', slot: 2, label: 'DGE' }],
    } },
    active: 'scripts/controls.js',   // selector per mode — NEVER patchInputs to switch mode
  },
});
// onInput: const t = input.actionData?.attack;
// if (input.actions.attack) t?.magnitude > 0.1 ? aimAt(t) : autoAimedStrike();
```

`active` points at a script whose `export default` is `(ctx) => name`, with
`ctx = { player, device: { orientation, coarse } }`, re-evaluated per player at the UI's cadence — no
state, so a reconnect or a late arrival lands on the right surface for free. An unknown name parks on
the draft with a miss logged; a selector that oscillates (>4 switches/s) gets suppressed; switching
under the finger gives a clean release.

## 3. Touching the WORLD

On a phone the world is the button: `touch: { gesture }` fires the action with the ray **at the
finger's point**, and `api.getInputRay(input)` + `api.raycast(...)` answer the same on mouse and on
finger (`pointer-raycasting`).

```js
// actions: { goTo: { mouse: 'left', touch: { gesture: 'tap' } },
//            dig:  { mouse: 'right', activeOn: 'hold', touch: { gesture: 'hold' } } }
export function onInput(input, api) {
  if (!input.actions.goTo) return;
  const ray = api.getInputRay(input);
  if (!ray) return;
  const hit = api.raycast(ray.origin, ray.direction, { distance: 200 });
  if (hit) api.moveTo(hit.position, { speed: 4 });
}
```

Fixed constants: **8 px** of travel kills the gesture (a drag is the camera, always — no "precise
dragging" as a verb); double-tap has a **300 ms** window (with it on, the plain tap only delivers
after that) and a **48 px** radius; `hold` engages at **350 ms** held still and lasts until you lift,
the ray following the finger. An action with a gesture does **not** get a chip (`button: true` if you
want one); never leave `mouse: 'right'` as the only path; and **never** use `touch.enabled: false` to
hide a chip — it kills gesture, stick and drag-to-look together.

## 4. Target, reach and forbidden zones

Comfortable target **56 px**, secondary **52 px** (slots 2-4), **floor 44 px** — nothing touchable
ever draws smaller. The stick's pocket is the bottom-left **36% × 42%** of the viewport, scaling with
the glass only up to a **844 px** basis (the iPhone 12-16 class the fractions were tuned on): a
bigger screen does not hand you a bigger thumb, so on a tablet the pocket stops growing. It also
keeps a **20 px minimum inset from the bezel** — a stick grab that starts ON the edge and drags
inward IS iOS's back-swipe, and the game unloads mid-fight; inside those 20 px the touch stays a
world claim.

The chip arc is derived by formula from the corner, the safe area and the platform's reservations —
**never hand-place a button in px**. Declare `slot` (1 = at the thumb) and read the result back with
`api.resolveControls()`. Capacity is **geometry**, not a head count: what doesn't fit drops from the
end, loudly, in `diagnostics`.

| zone | what lives there | what NEVER goes there |
| --- | --- | --- |
| bottom left (36%×42%) | stick / d-pad pocket | touchable HUD, world target |
| bottom right (arc/row) | verbs; slot 1 = the main one | health, score, minimap |
| middle of the right edge (~300 px) | the platform (rail): ~150 px kept clear | any HUD or game button |
| **bottom centre** | HUD **for reading** (centred root, number, bar) | **nothing touchable** — that's where the platform's chat bar sits and where the two thumbs cross |
| top, outside the rail | health, objective, time; TAB on the left | a verb in a hurry, a critical button |

## 5. HUD density on a narrow screen

**3 permanent elements** on a phone, maximum; HUD text never smaller than `text-sm`; icons as SVG or
images, not emoji. Hide: the full minimap (swap it for a compass strip), the damage log, the whole
inventory (that goes to the pause screen), a hotbar with more than 4 slots, decorative framing,
written tutorials. Never hide: health, the objective counter, hit feedback. No device sniffing: the
engine writes the **`touchActive`** axis (1 while touch is the live input, 0 when hardware takes
over, never on PC) — in `onInput` do `api.patchState({ touch: input.axes.touchActive === 1 })` when
the value changes, and `scripts/ui.js` decides what to render by reading `localPlayer.state.touch` (a
live read).

## 6. One action, three bindings

`shoot: { keys: ['f'], mouse: 'left', gamepad: 'rt', touch: { slot: 1, label: 'FIRE' } }` — the
behavior reads only `input.actions.shoot` and never knows where it came from.

- Looking with the right stick is **automatic**; binding `rightStickX/Y` to an axis **takes** the
  stick for the game and switches the camera off — only for twin-stick aiming. An analogue trigger is
  an axis (`Gamepad:LT`/`RT`, 0 to 1).
- `Tab` is reserved; a UI-only action is an empty object (`buy: {}`); `activeOn: 'hold'` is already
  held for you by the engine. On a hybrid, hardware **hides the touch chrome for 1500 ms** and
  `touchActive` goes to 0.
- Forgiveness is yours to give and the finger needs a wider window: coyote **110-170 ms** and jump
  buffer **120-180 ms** on touch, against 80-120 ms on the keyboard. Branch on `touchActive`, never
  on the user agent.

## 7. The frame budget in somebody's hand

The floor is 60fps **on the phone**, at the noisiest moment. Cut in this order:

1. **Particles and sprites.** Cheap in the tens of thousands, expensive at ~100k sustained alive
   (`maxParticles` is the belt). Shadow is the scarce resource, not light: cut what casts a shadow
   before you cut a light, and make "a thousand little dots" with an emissive surface. Scenery in the
   thousands is instanced decoration; a big CDN mesh is a hero piece, never a forest.
2. **Updates per frame.** `export const updateSchedule = { every: 3 }` (10 Hz: the tick is 30) or
   `{ near: { tag, radius } }` — the engine skips `update()` on the declined tick and `dt` arrives at
   the declared step (`api.setUpdateSchedule` adjusts it live). One system script beats N per-object
   scripts. Dynamic physics: ~250 objects comfortable, 400 is the ceiling.
3. **Network writes.** ~50 state deltas per tick is the budget; above that the client starts dropping
   entries. Pose at 10-15 Hz, threshold in degrees, **one single batch** —
   `gavi#animar-esqueleto-codigo` §5.

```js
api.patchEngine({
  graphics: { renderResolution: [960, 540] },              // buffer ceiling, applies live
  playerSettings: {
    defaults: { perf: { quality: 'medium' },               // only for whoever never chose
                accessibility: { reduceFlashing: true } }, // pre-enabling protection: legal
    caps: { perf: { maxQuality: 'medium' } },              // ceiling for the player AND the governor
  },
});
```

`playerSettings` laws (the `player-settings` skill): accessibility moves **in the safe direction
only** — pre-enabling `reduceFlashing`/`reduceMotion` is legal, switching it off or capping it is
always refused; sound and verbosity have no creator surface; the player can always go below what you
asked for; and the absence of a choice IS the adaptive mode, so "go back to adapting" is
`quality: null`, never `'auto'`.

## 8. Proving it came out playable on a phone

1. **Read the controls as a value** — `api.resolveControls()` and every named surface, watching
   `diagnostics`: is movement reachable? is the primary verb on screen? what dropped, and why?
2. **Look at one frame in the phone's aspect** — `view_player_screen` with `device: 'phone'`
   (`landscape: true` for landscape): stick in the thumb's pocket, main verb in slot 1, HUD readable,
   ~150 px clear in the middle of the right edge, nothing touchable in the bottom centre. On PC,
   `?touch=1` in the URL shows the touch layout live.
3. **Orphan and dead-button audit** — every action with a physical binding needs a chip, a gesture,
   or an honest sentence to the creator ("melee is keyboard-only for now"); every button needs an
   action that some `onInput` reads. A chip that does nothing is worse than a chip that isn't there.

```js
// run_script readOnly — orphan verb and dead button in the same pass
const actions = (api.getSpec('inputs') || {}).actions || {};
const { surface, diagnostics } = api.resolveControls();
const withButton = new Set((surface.buttons || []).map((b) => b.action).filter(Boolean));
const withGesture = new Set(Object.values(surface.gestures || {}));
const physical = (d) => d.keys || d.mouse || d.gamepad;                  // a UI-only action doesn't count
const orphans = Object.entries(actions).filter(([n, d]) => physical(d) && !withButton.has(n)
  && !(d.touch?.gesture || withGesture.has(n))).map(([n]) => n);
const dead = [...withButton].filter((n) => !actions[n]);
return { orphans, dead, diagnostics };
```

A live chip whose `onInput` nobody ever wrote is something the engine cannot detect — search the
action's name across the scripts (`grep`) and, in doubt, play it: `gavi#cacar-bugs-jogando`.

## Genre → the scheme that works on a thumb

| genre | scheme | what not to try |
| --- | --- | --- |
| platformer | stick + 1 big chip in slot 1, coyote 110-170 ms | two precise targets at the same time |
| fighting / action | drag-aim: hold to aim, release to strike, tap = auto-aimed hit | twin stick for melee |
| shooter | twin stick (`aimX/aimY` in the right zone) + auto-fire under `touchActive` | a fire chip far from the aiming thumb |
| racing | `sticks: []`, absolute wheel pad + pedals as axes | steering with a stick |
| RPG / adventure / RTS | `gesture: 'tap'` on the world + `moveTo`, double-tap to run, 3 chips | the full inventory on the play screen |
| puzzle | gestures only, `look: false`, no stick | precision dragging (dies at 8 px) |
| horror | stick + 1 chip (the torch), drag camera | both hands busy when the scare lands |
| kids / music | the whole screen is the button (`gestures.tap`) | a target under 56 px |
| sandbox | tap places, hold breaks (ray at the finger) + a mode chip | rectangle drag-select |

## Touch traps

| symptom | real cause | repair |
| --- | --- | --- |
| "there's no stick on the phone" | the axis isn't named `moveX`/`moveZ`, or has no physical binding | rename/bind it; `resolveControls()`'s diagnostics says exactly that |
| a verb doesn't exist on the phone | past 4 chips, or it doesn't fit the geometry | authored surface with `slot`, or paginate behind a "more" chip |
| the chip shows up and nothing happens | undeclared channel, or no `onInput` reads it | declare the channel; run the §8 audit |
| touching the world doesn't fire | the finger travelled ≥8 px (that became the camera), or chips killed with `enabled: false` | a gesture demands a still finger; never switch `touch` off to hide a chip |
| touch feels late | `double-tap` being on delays the plain tap by 300 ms | don't enable double-tap if the tap has to be immediate |
| an action unreachable on the phone | `mouse: 'right'` as the only path | give it a `gesture` or a chip |
| HUD under the thumb, or a frame drop only on the phone | HUD in the arc/rail; particles and shadows, not geometry | move the HUD to the top or the bottom centre; cut in §7's order |

## What Gavi refuses

- Declaring the phone handled without looking at a frame in the phone's aspect; a verb that fell off
  the layout with nobody telling the creator; `patchInputs` to switch mode (that's `active`).
- Branching on the user agent instead of `touchActive`; cutting resolution before particles, updates
  and network.