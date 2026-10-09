---
name: Custom Character Animations
description: Full playbook for creating characters with custom Meshy animations — model-only architecture, semantic profiles, ability systems, animation chaining, interruptible casts, NPC patterns, and all known pitfalls.
---

# Custom Character Animations — Skill Playbook

## What This Skill Teaches

How to create characters (player or NPC) with fully custom animation sets using Meshy-generated animations on CDN humanoid models. This covers the complete workflow: model URL construction, the semantic animation profile, the behavior script architecture, ability/spell systems with per-skill tuning, animation chaining, interruptible casts, NPC patterns, and all known pitfalls.

This skill is the distilled result of extensive R&D in the Animation Combat Lab project. Every pattern described here has been validated in-engine.

---

## Architecture Overview

### The Core Idea
Disable the engine's built-in `animated3DCharacter` system entirely. Use the `model` property with explicit `animation: { clip, loop, speed, playing }` for ALL animation control — idle, walk, run, jump, abilities, death, everything. One system, zero T-pose flashes, zero system-fighting.

### Why Not animated3DCharacter?
The engine has two mutually exclusive animation systems:
- **animated3DCharacter**: Auto-plays Idle/Walk/Run/Sprint/Jump based on velocity. Cannot play custom clips (attacks, casts, death, emotes). Switching between this and model causes 1-frame T-pose flashes.
- **model.animation**: Plays any named clip with full control. Must manually handle locomotion, but gives complete freedom.

**We use model-only.** This eliminates T-pose transitions entirely. The tradeoff is we must manually select locomotion clips based on movement speed and handle facing ourselves. The behavior script handles all of this.

### The Semantic Profile
Every character has a PROFILE object that maps logical animation names to actual clip names:

```js
var PROFILE = {
  clips: {
    idle_peaceful: { candidates: ['Idle_9', 'Idle'], loop: true },
    idle_combat:   { candidates: ['Idle_10', 'Idle'], loop: true },
    walk:          { candidates: ['Walk'], loop: true },
    run:           { candidates: ['Run'], loop: true },
    sprint:        { candidates: ['Sprint'], loop: true, rootMotionSafe: false, fallback: 'run' },
    jump:          { candidates: ['Regular_Jump', 'Jump'], loop: true, takeoffDelay: 0.36, pressSpeed: 2.5, airSpeed: 1.0 },
    dead:          { candidates: ['Dead'], loop: true },
  },
  // Abilities go here — see Ability System section
  spells: { ... },
  spellClips: { ... },
};
```

**Key fields per clip entry:**
- `candidates`: Array of clip names to try, in order. First match wins. Allows fallback if a model doesn't have the preferred clip.
- `loop`: Always `true`. Never use `'once'` — it causes the character to freeze on the last frame with no way to recover.
- `rootMotionSafe`: Set to `false` if the clip has baked root motion (character visually drifts/teleports). The behavior will fall back to the `fallback` clip at higher speed.
- `takeoffDelay`: (jump only) Seconds to play the jump animation on the ground before applying the physics impulse. Syncs the visual anticipation with the actual liftoff.
- `pressSpeed`: (jump only) Animation speed during the prejump anticipation phase.
- `airSpeed`: (jump only) Animation speed while airborne.

### The Clip Resolver
A simple function that looks up the actual clip name from the profile:

```js
function resolveClip(semanticKey) {
  var entry = PROFILE.clips[semanticKey]
           || PROFILE.spellClips[semanticKey];
  if (!entry) return 'Idle';
  return entry.candidates[0];
}
```

### The Presenter (applyClip)
One function that writes the animation to the model property. Has deduplication to avoid redundant writes:

```js
var lastAppliedClip = null;
var lastAppliedSpeed = null;

function applyClip(api, semanticKey, speed) {
  var clip = resolveClip(semanticKey);
  speed = speed || 1;
  if (clip === lastAppliedClip && speed === lastAppliedSpeed) return;
  lastAppliedClip = clip;
  lastAppliedSpeed = speed;

  var currentModel = api.getProperty('model');
  var modelId = (currentModel && currentModel.id) ? currentModel.id
              : (typeof currentModel === 'string' ? currentModel : null);
  if (!modelId) return;

  api.setProperty('model', {
    id: modelId,
    animation: { clip: clip, loop: 'loop', speed: speed, playing: true },
  });
}
```

**Critical:** The model ID is read from the current property at runtime, never hardcoded. This means model swaps work without behavior changes.

---

## Model URL Construction

### CDN Pattern
```
/cdn/model-humanoid-{style}-{description}.glb?animations=Idle,Walk,Run,Sprint,Jump,Custom1,Custom2,...
```

### Hard Rules
1. **Always include the 5 basic animation types: Idle, Walk, Run, Sprint, Jump** — the model needs these locomotion categories covered or the humanoid rig may fail to generate. You can use variants like `Idle_9` instead of `Idle`, or `Regular_Jump` instead of `Jump` — what matters is the types are covered, not the exact names. Do NOT include both `Idle` AND `Idle_9` — that's a duplicate that wastes a slot. If you're using custom-named versions of the basics, those count.
2. **All animations must be defined at generation time** — you cannot add animations to an existing model URL later. To add animations, rebuild the URL with the new ones included.
3. **Animation names come from the Meshy animation library** — users browse https://docs.meshy.ai/en/api/animation-library to find animation names.
4. **Meshy animation names may contain typos** — for example `mage_soell_cast_1` instead of `mage_spell_cast_1`. Always use the exact name from Meshy, not what you think it should be.
5. **Generation takes minutes with many animations** — 10+ custom animations can take 3-5 minutes. Don't rapidly regenerate URLs.
6. **60 animations per model is the ceiling** — confirmed via testing with all 60 working.
7. **Don't duplicate the basics** — include Idle, Walk, Run, Sprint, Jump once each.
8. **Generation can fail — this is normal.** Meshy model generation is not 100% reliable. If a model shows the placeholder bubble then disappears, the generation failed. The fix is to retry — either regenerate the same URL, or slightly tweak the model description (e.g., reword the character description). Do NOT assume the skill architecture is broken or start rewriting behavior scripts. It's a generation luck-of-the-draw issue. A couple of retries usually lands it.

### Example URLs
```
// Sorcerer with 7 cast animations + extras
/cdn/model-humanoid-anime-dark-sorcerer-robes-staff-magical.glb?animations=Idle_9,Idle_10,Walk,Run,Sprint,Regular_Jump,Dead,mage_soell_cast_1,mage_soell_cast_2,mage_soell_cast_3,mage_soell_cast_4,mage_soell_cast_5,mage_soell_cast_6,mage_soell_cast_7,Charged_Spell_Cast,Charged_Ground_Slam,Casual_Walk

// Samurai warrior with combat animations
/cdn/model-humanoid-anime-samurai-warrior-katana.glb?animations=Idle,Walk,Run,Sprint,Jump,Sword_Slash_1,Sword_Slash_2,Block,Dodge_Roll,Death

// Knight with shield
/cdn/model-humanoid-medieval-knight-plate-armor.glb?animations=Idle,Walk,Run,Sprint,Jump,Shield_Block,Sword_Attack,Heavy_Swing,Death,Taunt
```

---

## onSpawn Setup

Every character using this system needs this onSpawn pattern:

```js
export function onSpawn(api) {
  // Use character physics for terrain following + gravity
  api.setProperty('physics', { body: 'character', collider: 'capsule' });

  // Disable animated3DCharacter — we control ALL animation via model property
  api.setProperty('animated3DCharacter', false);

  // Clear any primitive/material that might interfere
  api.setProperty('primitive', null);
  api.setProperty('material', null);

  // Initialize state with safe defaults (patchState preserves persisted values)
  var s = api.getState();
  api.patchState({
    velocity:        s.velocity || { x: 0, y: 0, z: 0 },
    health:          s.health ?? 100,
    maxHealth:       s.maxHealth ?? 100,
    airPhase:        s.airPhase ?? 'grounded',
    airTimer:        s.airTimer ?? 0,
    groundedTimer:   s.groundedTimer ?? 0,
    action:          s.action ?? null,
    locoState:       s.locoState ?? 'idle',
    currentSemantic: s.currentSemantic ?? 'idle_peaceful',
    targetYaw:       s.targetYaw ?? (api.getProperty('yaw') || 0),
    dead:            s.dead ?? false,
    jumpRequest:     false,
    jumpState:       s.jumpState ?? null,
  });

  // Reset presenter cache and apply initial clip
  lastAppliedClip = null;
  lastAppliedSpeed = null;
  applyClip(api, 'idle_peaceful', 1);
}
```

**Critical rules:**
- Use `patchState` with `??` defaults, never `replaceState`. onSpawn re-runs on script edits and would wipe runtime values.
- Set `animated3DCharacter` to `false` explicitly — this disables the engine's character animation system.
- `physics: 'character'` with `collider: 'capsule'` gives proper terrain following and gravity support.
- Reset presenter cache (`lastAppliedClip = null`) so the first applyClip after spawn actually writes.

---

## The Update Loop

The update function is the sole authority on what animation plays. It handles, in order:

1. **Dead state** — play death clip, apply gravity, return early
2. **Gravity** — always apply, reset if grounded
3. **Combat timer** — decay combat state over time (if using conditional idles)
4. **Prejump phase** — play anticipation frames before physics launch
5. **Action/ability state** — advance elapsed time, handle chain transitions, fire damage at hit windows
6. **Movement** — apply velocity from onInput
7. **Air state machine** — track grounded/rising/falling/landing phases
8. **Locomotion hysteresis** — determine walk/run/sprint from speed with enter/exit thresholds
9. **Animation resolution** — pick the right semantic clip based on all above state
10. **Smooth facing** — lerp yaw toward movement direction

### Locomotion Hysteresis
Prevents flickering between animation states by using different thresholds for entering vs exiting:

```js
var WALK_ENTER = 1.0;  var WALK_EXIT = 0.5;
var RUN_ENTER  = 4.5;  var RUN_EXIT  = 3.5;
var SPRINT_ENTER = 8.5; var SPRINT_EXIT = 7.0;
```

The locomotion state machine uses these to ensure you don't rapidly flip between walk/run at boundary speeds.

### Smooth Facing
Never snap yaw instantly. Lerp it:

```js
if (hSpeed > WALK_EXIT) {
  var targetYaw = Math.atan2(-vel.x, -vel.z) * (180 / Math.PI);
  var currentYaw = api.getProperty('yaw') || 0;
  var diff = targetYaw - currentYaw;
  while (diff > 180) diff -= 360;
  while (diff < -180) diff += 360;
  var step = FACE_LERP_SPEED * dt;
  var newYaw = Math.abs(diff) < step * 2
    ? targetYaw
    : currentYaw + clampFn(diff, -step * 30, step * 30);
  api.setProperty('yaw', newYaw);
}
```

### Prejump System
CDN-generated jump clips commonly have long wind-up anticipation phases. The prejump system plays the clip immediately on press but delays the physics impulse:

1. `onInput` sets `jumpRequest: true`
2. `update` enters `prejump` phase — plays jump clip at `pressSpeed`, holds character on ground
3. After `takeoffDelay` seconds, applies vertical impulse and transitions to `rising` phase
4. `airSpeed` controls animation speed while airborne

This is per-model tunable via the profile's `jump` entry.

---

## Ability / Spell System

### Spell Definition Structure
Each ability lives in `PROFILE.spells` with full per-skill tuning:

```js
spells: {
  spell1: {
    clipKey: 'cast1',           // maps to PROFILE.spellClips entry
    name: 'Arcane Bolt',        // display name
    castTime: 1.0,              // total cast duration in seconds
    damage: 12,                 // damage dealt at hitTime
    range: 15,                  // range for damage query
    icon: '✦',                  // UI icon
    color: '#a78bfa',           // UI color
    hitTime: 0.5,               // when during the cast damage fires
    animSpeed: 1.0,             // animation playback speed (per-spell tunable)
    interruptible: false,       // can movement/other spells cancel this cast?
    chain: null,                // animation chain config (see below)
  },
}
```

### Spell Clip Mapping
Separate from the spell definition, spell clips live in `PROFILE.spellClips`:

```js
spellClips: {
  cast1: { candidates: ['mage_soell_cast_1'], loop: true },
  cast2: { candidates: ['mage_soell_cast_2'], loop: true },
  // ...
}
```

### Animation Chaining
Chain two clips together for one ability — e.g., a windup followed by a release:

```js
spell5: {
  clipKey: 'cast5',
  name: 'Lightning Arc',
  castTime: 2.1,
  hitTime: 2.0,
  animSpeed: 1.0,
  chain: {
    clipKey: 'cast4',         // clip to transition TO
    transitionTime: 0.5,     // seconds into cast when the transition happens
    animSpeed: 1.0,           // speed for the second clip
  },
}
```

The update loop handles chains automatically:
```js
if (action.chain && !action.chainFired && elapsed >= action.chain.transitionTime) {
  newAction.clipKey = action.chain.clipKey;
  newAction.semantic = action.chain.clipKey;
  newAction.speed = action.chain.animSpeed || action.speed;
  newAction.chainFired = true;
}
```

### Interruptible Casts
Mark a spell as `interruptible: true` and the input handler will cancel it on movement or another spell press:

```js
// In onInput:
var canInterrupt = action && action.interruptible;
var hasMovement = Math.abs(input.axes.moveX || 0) > 0.1 || Math.abs(input.axes.moveZ || 0) > 0.1;
var hasSpellPress = false;
for (var si = 0; si < spellKeys.length; si++) {
  if (input.actions[spellKeys[si]]) { hasSpellPress = true; break; }
}
if (canInterrupt && (hasMovement || hasSpellPress)) {
  api.patchState({ action: null, currentSpell: null });
  action = null; // allows the new spell or movement to proceed immediately
}
```

### Action State Object
When a spell is cast, onInput writes this action object to state:

```js
action: {
  semantic: sp.clipKey,
  clipKey: sp.clipKey,
  spellKey: skey,
  phase: 'casting',
  elapsed: 0,
  duration: sp.castTime,
  hitTime: sp.hitTime,
  hitFired: false,
  range: sp.range,
  damage: sp.damage,
  lockMove: true,
  lockInput: true,
  speed: sp.animSpeed || 1,
  chain: sp.chain || null,
  chainFired: false,
  interruptible: sp.interruptible || false,
}
```

**Only update() advances elapsed and resolves the action.** onInput only queues intent.

---

## Conditional Idle States

For games with combat, characters can have different idle animations based on whether they're in combat:

```js
// In the profile:
idle_peaceful: { candidates: ['Idle_9', 'Idle'], loop: true },
idle_combat:   { candidates: ['Idle_10', 'Idle'], loop: true },

// In update, when resolving idle:
semantic = inCombat ? 'idle_combat' : 'idle_peaceful';
```

Combat state is tracked via a timer that decays:
- Casting a spell sets `inCombat: true, combatTimer: 0`
- Taking damage sets `inCombat: true, combatTimer: 0`
- Each update tick advances `combatTimer += dt`
- When `combatTimer >= COMBAT_DECAY` (e.g., 10 seconds), `inCombat` resets to false

---

## NPC Patterns

NPCs use the same model-only animation approach. The key difference is they don't use the full player controller — they have simpler behavior scripts.

### Static NPC (Guard, Shopkeeper)
- Stands idle, plays emote on interact, returns to idle after timer
- Uses `physics: 'character'` for terrain following
- Has its own `setClip()` function with deduplication
- Handles gravity in update

```js
// Simplified NPC clip setter:
function setClip(api, clip) {
  var s = api.getState();
  if (s.currentClip === clip) return;
  api.patchState({ currentClip: clip });
  var model = api.getProperty('model');
  api.setProperty('model', {
    id: model.id || model,
    animation: { clip: clip, loop: 'loop', speed: 1, playing: true },
  });
}
```

### Patrolling NPC
- Walks between waypoints stored in state
- Manually computes facing yaw from movement direction (same lerp pattern as player)
- Switches between Idle/Walk clips based on movement speed
- Pauses at each waypoint for a configurable duration
- Can play emotes on interact (freezes patrol during emote)

### Enemy NPC
- Uses `physics: 'character'` with gravity
- Patrols with simple back-and-forth movement
- Attacks players within range on a timer
- Takes damage from player spells (health tracked in state)
- Uses `tags: ['enemy']` so player spells can query for targets

### NPC onSpawn Pattern
```js
export function onSpawn(api) {
  // Character physics for terrain following
  // NOTE: Do NOT set animated3DCharacter: false on NPCs unless the spec
  // already has animated3DCharacter set. If the NPC was spawned with just
  // a model URL (no animated3DCharacter in spec), the model-only approach
  // works automatically.
  var s = api.getState();
  api.patchState({
    vy: s.vy ?? 0,
    busy: s.busy ?? false,
    currentClip: s.currentClip ?? 'Idle',
  });
}
```

---

## onInput Pattern (Player Only)

onInput is for queuing intent only. It never writes animation clips directly.

```js
export function onInput(input, api) {
  var s = api.getState();
  if (s.dead) return;

  var action = s.action;

  // 1. Check for interruptible action cancellation
  // 2. Check for spell/ability presses (only if no action or action was just interrupted)
  // 3. Compute movement velocity from camera-relative input
  // 4. Queue jump request (never apply impulse here)
  // 5. Write velocity to state (update will use it for movement + animation)
}
```

**Jump handling:** onInput sets `jumpRequest: true`. update() processes it into the prejump state machine. This prevents mixed ownership of the jump clip between onInput and update.

---

## Known Limitations

1. **Animation speed (`model.animation.speed`) is currently not respected by the engine renderer.** The `animSpeed` field is wired correctly in the profile and action system, and will work when the engine fixes this. For now, animation playback rate cannot be changed at runtime.

2. **No animation blending.** Transitions between clips are hard cuts, not crossfades. Mitigated by locomotion hysteresis (smooth speed-based transitions) and the prejump system (smooth jump entry).

3. **No animation seeking or time control.** Cannot jump to a specific frame in a clip. Abilities use elapsed timers to track where in the animation we are, but the visual playback always starts from the beginning.

4. **CDN-generated animations may have unexpected properties.** Root motion baked into clips causes visual drift — flag these with `rootMotionSafe: false` and provide a fallback clip. Jump clips often have long wind-ups — use the prejump delay system.

5. **Animation names from Meshy may contain typos.** Always use the exact name from the Meshy library, not what you think it should be spelled as.

6. **Loop mode must always be `'loop'`** (or the string `'loop'`). Using `'once'` causes the character to freeze on the last frame permanently. The action system's `elapsed >= duration` check handles action completion.

---

## Inputs Required

The behavior expects these inputs to be registered:

```js
inputs: {
  axes: {
    moveX: { keys: 'a/d', gamepad: 'leftStickX' },
    moveZ: { keys: 's/w', gamepad: 'leftStickY' },
    lookX: { mouse: 'deltaX', gamepad: 'rightStickX' },
    lookY: { mouse: 'deltaY', gamepad: 'rightStickY' },
  },
  actions: {
    jump: { keys: ['space'], gamepad: 'Gamepad:Button0' },
    sprint: { keys: ['shift'], activeOn: 'hold' },
    interact: { keys: ['e'], gamepad: 'Gamepad:Button2' },
    // Spell/ability slots:
    spell1: { keys: ['Digit1'] },
    spell2: { keys: ['Digit2'] },
    spell3: { keys: ['Digit3'] },
    // ... as many as needed
    // Optional:
    slowWalk: { keys: ['Backquote'] },
  },
}
```

---

## Validation Checklist

After implementing, verify:
- [ ] Character does NOT T-pose at any point (idle, transitions, ability start/end)
- [ ] Walking/running/sprinting transitions are smooth (no flickering)
- [ ] Jumping plays anticipation frames before liftoff
- [ ] Abilities lock movement and play their clip for the full cast duration
- [ ] Chained abilities transition to the second clip at the configured time
- [ ] Interruptible abilities cancel cleanly on movement or spell press
- [ ] Damage fires at the configured hitTime, not on key press
- [ ] Combat idle switches to peaceful idle after the decay timer
- [ ] Character faces movement direction smoothly (no snapping)
- [ ] Death state plays death clip and stops movement
- [ ] NPCs follow terrain (no floating or sinking)
- [ ] NPC emotes/interactions play and return to idle cleanly

---

## Common Pitfalls

1. **Using animated3DCharacter and model together** — They fight. Pick one. This system uses model-only.
2. **Using `loop: 'once'`** — Character freezes on last frame. Always use `loop: 'loop'` and let the action timer control duration.
3. **Writing animation clips in onInput** — Creates same-tick dedup ambiguity with update. Only update() should call applyClip.
4. **Hardcoding the model URL in applyClip** — Read it from the current model property so model swaps work.
5. **Using replaceState in onSpawn** — Wipes persisted values on script edit. Use patchState with `??` defaults.
6. **Forgetting gravity on NPCs** — NPCs need `physics: 'character'` and manual gravity in update or they float.
7. **Not resetting presenter cache in onSpawn** — Set `lastAppliedClip = null` so the first clip write actually fires.
8. **Sprint clips with root motion** — Flag `rootMotionSafe: false` and provide a fallback, or the character will visually teleport.
9. **Jump impulse in onInput** — Queue `jumpRequest: true` in onInput, process it in update. Mixed ownership breaks the prejump delay system.
10. **Forgetting to register spell/ability actions in inputs** — Every `input.actions.spellN` check needs a matching entry in the inputs spec.
