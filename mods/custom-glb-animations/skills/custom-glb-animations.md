---
name: Custom GLB Animations (Puppet Pattern)
description: How to use custom uploaded GLB files for player animations using the puppet pattern. Covers the invisible player fix, animation state machines, combat animations, lock-on strafing, and attack cancel windows.
---

# Custom GLB Animations (Puppet Pattern)

## When to Use
- The user uploads custom GLB model files with baked-in animations.
- The user wants their player character to use uploaded animations (idle, walk, run, attack, dodge, etc.).
- The user's player character appears as a frozen T-pose or is completely invisible when using custom models.
- The user wants to swap between different animation states by changing the entire model.

## The Core Problem
The player entity CANNOT play animations from custom uploaded GLB files:
- Setting `model` on the player entity makes the player **completely invisible**.
- Setting `animated3DCharacter` with a custom model shows the model but animations **do not play** (frozen in static pose).
- The default adventurer model (`cdn/model-adventurer.glb`) works fine — this issue is specific to custom/uploaded models.
- Regular spawned objects (non-player) render these same models with working animations using the `model` property.

## The Solution: Puppet Pattern
Spawn a separate "puppet" object that renders the character visually. The actual player entity is invisible and handles physics/movement. The puppet follows the player every frame.

### Architecture
1. **Player entity**: `visible: false`, handles movement, physics, input, collision
2. **Puppet object**: Regular spawned object with `model` property, renders the character with animations
3. **Sync**: Every frame in `update()`, copy the player's position and yaw to the puppet
4. **Animation swap**: Change the puppet's entire `model` property to switch animations

## Inputs Needed
- One or more GLB files uploaded by the user, each containing a single baked-in animation
- Each GLB typically has its animation clip named "Idle" (since only one animation is baked per file)
- The user should upload separate GLBs for: idle, walk, run, attack, dodge, etc.

## Steps

### Step 1: Store All Model URLs in a Shared Config
Create `scripts/lib/anim-config.js` with all the model URLs:

```js
const MODEL_IDLE = "/cdn/model-uploaded-idle-xxxxx.glb";
const MODEL_WALK = "/cdn/model-uploaded-walk-xxxxx.glb";
const MODEL_RUN  = "/cdn/model-uploaded-run-xxxxx.glb";
// ... add more as the user uploads them

module.exports = {
  MODEL_IDLE, MODEL_WALK, MODEL_RUN,
};
```

### Step 2: Spawn the Puppet in onSpawn
In the player behavior script:

```js
const { MODEL_IDLE } = require('lib/anim-config.js');

export function onSpawn(objectApi) {
  // Hide the real player
  objectApi.setProperty("visible", false);

  // Spawn the visual puppet
  const puppetId = objectApi.uniqueId("puppet");
  objectApi.spawn(puppetId, {
    tags: ["player-puppet"],
    properties: {
      model: {
        id: MODEL_IDLE,
        animation: { clip: "Idle", playing: true, speed: 1, loop: "loop" },
      },
    },
  });

  // Place puppet at player position
  const pos = objectApi.getProperty("feetPosition");
  objectApi.setObjectProperty(puppetId, "feetPosition", pos);

  objectApi.patchState({ puppetId, currentAnim: "idle" });
}
```

### Step 3: Sync Puppet Position Every Frame
In `update()`, AFTER calling `objectApi.move()`:

```js
export function update(dt, objectApi) {
  const s = objectApi.getState();

  // ... movement logic, gravity, etc ...
  objectApi.move(moveX * dt, vy * dt, moveZ * dt);

  // Sync puppet to player (MUST come after move)
  if (!s.puppetId) return;
  const pos = objectApi.getProperty("feetPosition");
  objectApi.setObjectProperty(s.puppetId, "feetPosition", pos);

  // Sync facing direction
  // Use player yaw or calculate from movement direction
  const moveYaw = Math.atan2(-moveX, -moveZ) * (180 / Math.PI);
  objectApi.setObjectProperty(s.puppetId, "yaw", moveYaw);
}
```

### Step 4: Swap Animations by Changing the Model
To change animation, replace the puppet's entire `model` property:

```js
function swapPuppetAnim(objectApi, modelUrl, loop, speed) {
  const s = objectApi.getState();
  if (!s.puppetId) return;
  objectApi.setObjectProperty(s.puppetId, "model", {
    id: modelUrl,
    animation: {
      clip: "Idle",      // Most single-anim GLBs use "Idle" as clip name
      playing: true,
      speed: speed || 1,
      loop: loop ? "loop" : "once",
    },
  });
}

// Usage examples:
swapPuppetAnim(objectApi, MODEL_WALK, true);        // Looping walk
swapPuppetAnim(objectApi, MODEL_ATTACK, false, 0.8); // One-shot attack at 80% speed
```

### Step 5: Animation State Machine
Track `currentAnim` in state to avoid redundant swaps:

```js
// In update(), after movement:
const horizSpeed = Math.hypot(vx, vz);
const currentAnim = s.currentAnim || "idle";

if (horizSpeed > 4 && s.isSprinting && currentAnim !== "run") {
  swapPuppetAnim(objectApi, MODEL_RUN, true, 0.6);
  objectApi.patchState({ currentAnim: "run" });
} else if (horizSpeed > 0.5 && !s.isSprinting && currentAnim !== "walk") {
  swapPuppetAnim(objectApi, MODEL_WALK, true);
  objectApi.patchState({ currentAnim: "walk" });
} else if (horizSpeed <= 0.5 && currentAnim !== "idle") {
  swapPuppetAnim(objectApi, MODEL_IDLE, true);
  objectApi.patchState({ currentAnim: "idle" });
}
```

### Step 6: Combat/Action Animations
For one-shot animations (attacks, dodges, parries), use a combat state with a timer:

```js
// In onInput:
if (input.actions.attack && combatState === "none") {
  swapPuppetAnim(objectApi, MODEL_ATTACK, false, 1);
  objectApi.patchState({
    combatState: "attack",
    stateTimer: 1.0,  // Duration of the attack animation
    currentAnim: "attack",
  });
}

// In update:
if (s.combatState !== "none") {
  let stateTimer = s.stateTimer - dt;
  if (stateTimer <= 0) {
    // Animation finished — return to idle
    swapPuppetAnim(objectApi, MODEL_IDLE, true);
    objectApi.patchState({ combatState: "none", stateTimer: 0, currentAnim: "idle" });
  } else {
    objectApi.patchState({ stateTimer });
  }
}
```

### Step 7: Cleanup on Destroy
Always destroy the puppet when the player disconnects:

```js
export function onDestroy(objectApi) {
  const s = objectApi.getState();
  if (s.puppetId) {
    objectApi.destroy(s.puppetId);
  }
}
```

## Animation Speed Tuning
- `speed: 1` = normal playback
- `speed: 0.6` = 60% speed (good for slowing down fast animations like run/strafe)
- `speed: 0.45` = very slow (good for sprint when character legs move too fast)
- `speed: 0.8` = subtle slowdown (good for attacks to read the swing better)
- Adjust `stateTimer` duration alongside speed to keep them in sync

## Validation Checklist
- [ ] Player entity has `visible: false` set
- [ ] Puppet spawns in `onSpawn` and its ID is stored in state as `puppetId`
- [ ] Puppet position syncs to player position AFTER `objectApi.move()` in update
- [ ] Puppet yaw syncs to player facing direction
- [ ] Animation clips use `"Idle"` as the clip name (standard for single-anim GLBs)
- [ ] `currentAnim` state prevents redundant model swaps every frame
- [ ] One-shot animations (attacks, dodge) use `loop: "once"` with a state timer
- [ ] Looping animations (idle, walk, run) use `loop: "loop"`
- [ ] Puppet is destroyed in `onDestroy`
- [ ] Combat state blocks normal animation switching (check combatState !== "none")

## Common Pitfalls
- **Setting `model` directly on the player entity** — makes the player completely invisible. Always use the puppet.
- **Using `animated3DCharacter` for custom models** — shows the model but animations don't play. Only works for the default adventurer.
- **Forgetting to sync puppet after move()** — puppet lags one frame behind, causing visual jitter.
- **Swapping model every frame** — causes animation to restart constantly. Always check `currentAnim` before swapping.
- **Using wrong clip name** — most single-animation GLBs bake their animation as "Idle" regardless of what the animation actually is.
- **Not blocking animation switches during combat** — walk/idle animations will overwrite attack animations mid-swing.
- **Forgetting `onDestroy` cleanup** — orphaned puppet objects persist after player disconnects.
- **Setting animation speed without adjusting timer duration** — animation finishes visually but timer hasn't expired (or vice versa).

## Advanced: Lock-On Directional Animations
When locked onto a target, you can use different models for strafe left, strafe right, backpedal, and forward advance:

```js
// Store raw input in state from onInput:
objectApi.patchState({ lastMoveX: rawX, lastMoveZ: rawZ });

// In update, when locked on:
if (s.lockOnTarget) {
  const inputX = s.lastMoveX || 0;
  const inputZ = s.lastMoveZ || 0;

  if (inputZ < -0.3) {
    // Backpedal
    swapIfNeeded("backpedal", MODEL_BACKPEDAL);
  } else if (inputX > 0.3) {
    // Strafe right
    swapIfNeeded("strafe_right", MODEL_STRAFE_RIGHT);
  } else if (inputX < -0.3) {
    // Strafe left
    swapIfNeeded("strafe_left", MODEL_STRAFE_LEFT);
  } else if (inputZ > 0.3) {
    // Forward advance
    swapIfNeeded("walk_combat", MODEL_WALK_COMBAT);
  } else {
    // Combat idle
    swapIfNeeded("idle_combat", MODEL_IDLE_COMBAT);
  }
}
```

## Advanced: Attack Cancel Windows
For smooth attack chaining, allow new attacks to interrupt current ones after a percentage of the animation has played:

```js
// stateTimer counts DOWN from attackDuration
// When 50% of animation has played, 50% of time remains
const canCancel = combatState.startsWith("attack")
  && (s.stateTimer || 0) < (s.attackDuration * 0.5);

if (combatState === "none" || canCancel) {
  // Allow the new attack
}
```

Store `attackDuration` in state alongside `stateTimer` so the cancel window calculation works.
