---
name: Combat Cookbook
description: Complete combat systems guide — melee, projectiles, hitscan, enemy AI state machines, wave spawners, hazard zones, auto-shooters, and damage feedback juice.
---

# Combat Cookbook — Fighting Systems for Spawn Games

## When to Use

Load this skill when building any combat system: melee attacks, ranged weapons, hitscan/raycast shooting, enemy AI, wave spawners, damage zones, auto-shooters, health/death/respawn, or damage feedback juice.

---

## Health & Damage Foundation

### Damageable Player Setup

Player state needs health tracking:

```js
// Player state
{ health: 100, maxHealth: 100, invulnerable: false, lastHitTime: 0 }
```

### Dealing Damage

```js
function dealDamage(objectApi, targetId, amount, sourcePos) {
  const state = objectApi.getObjectState(targetId);
  if (!state || state.invulnerable) return;

  const oldHealth = state.health ?? 100;
  const newHealth = Math.max(0, oldHealth - amount);
  objectApi.patchObjectState(targetId, { health: newHealth, lastHitTime: objectApi.getTick() });

  // Juice
  const targetPos = objectApi.getObjectProperty(targetId, "feetPosition");
  objectApi.damageNumber(targetPos, amount, { color: "oklch(0.6 0.25 25)" });
  objectApi.flash(targetId, { color: "oklch(0.6 0.25 25)", duration: 0.1 });
  objectApi.screenShake(0.1 + amount * 0.005, 0.15);
  objectApi.playSound("cdn/sfx-impact-hit-damage.mp3", { position: targetPos, volume: 0.5 });

  if (newHealth <= 0) {
    handleDeath(objectApi, targetId, targetPos);
  }
}
```

### Death & Respawn

```js
function handleDeath(objectApi, playerId, deathPos) {
  // Death juice
  objectApi.particleBurst(deathPos, "explosion", { scale: 1.5, color: "oklch(0.6 0.25 25)" });
  objectApi.screenFlash("oklch(0.3 0.15 25)", 0.3);
  objectApi.slowMo({ scale: 0.3, duration: 0.3, ease: true });
  objectApi.announce("YOU DIED", { style: "death", duration: 2 });
  objectApi.playSound("cdn/sfx-death-dramatic-impact.mp3", { volume: 0.7 });

  // Respawn after delay
  objectApi.runInSeconds(3, () => {
    objectApi.patchObjectState(playerId, {
      health: 100,
      invulnerable: true,
      lastHitTime: 0
    });
    objectApi.setObjectProperty(playerId, "feetPosition", { x: 0, y: 0, z: 0 }); // spawn point
    objectApi.announce("Respawned!", { style: "info", duration: 1 });

    // Invulnerability wears off after 2 seconds
    objectApi.runInSeconds(2, () => {
      objectApi.patchObjectState(playerId, { invulnerable: false });
    });
  });
}
```

---

## Melee Combat

Spawn a trigger volume in front of the player on attack. Objects inside take damage.

```js
// Player melee behavior
// state: { attackCooldown: 0, comboCount: 0, lastAttackTime: 0 }

const ATTACK_COOLDOWN = 0.4; // seconds between swings
const ATTACK_RANGE = 2.5;    // meters in front
const BASE_DAMAGE = 15;
const COMBO_WINDOW = 1.0;    // seconds to chain combo
const COMBO_BONUS = 5;       // extra damage per combo

export function update(dt, objectApi) {
  const s = objectApi.getState();
  if (s.attackCooldown > 0) {
    objectApi.patchState({ attackCooldown: s.attackCooldown - dt });
  }

  // Reset combo if window expired
  const elapsed = (objectApi.getTick() - s.lastAttackTime) / 30;
  if (elapsed > COMBO_WINDOW && s.comboCount > 0) {
    objectApi.patchState({ comboCount: 0 });
  }
}

export function onInput(input, objectApi) {
  if (!input.actions.attack) return;

  const s = objectApi.getState();
  if (s.attackCooldown > 0) return;

  // Spawn attack trigger
  const pos = objectApi.getProperty("feetPosition");
  const yaw = objectApi.getProperty("yaw") ?? 0;
  const dir = objectApi.directionFromYawPitch(yaw, 0);
  const combo = s.comboCount + 1;
  const damage = BASE_DAMAGE + combo * COMBO_BONUS;

  const attackId = objectApi.uniqueId("melee-hit");
  objectApi.spawn(attackId, {
    tags: ["attack-zone"],
    lifetime: 0.15, // brief hit window
    properties: {
      feetPosition: {
        x: pos.x + dir.x * ATTACK_RANGE,
        y: pos.y + 0.5,
        z: pos.z + dir.z * ATTACK_RANGE
      },
      primitive: { kind: "sphere", radius: 1.5 },
      material: { opacity: 0 },
      physics: { body: "static", trigger: true }
    },
    state: { damage, sourceId: objectApi.id }
  });

  // Juice
  objectApi.playSound("cdn/sfx-sword-slash-whoosh-swing.mp3", {
    position: pos,
    pitch: 0.9 + combo * 0.1,
    volume: 0.5
  });
  objectApi.cameraPunch(dir, 0.15);

  objectApi.patchState({
    attackCooldown: ATTACK_COOLDOWN,
    comboCount: combo,
    lastAttackTime: objectApi.getTick()
  });
}
```

### Attack Zone Behavior (separate script on the trigger)

```js
export function onTriggerEnter(other, objectApi) {
  if (!other.tags.includes("enemy")) return;
  const s = objectApi.getState();
  const state = objectApi.getObjectState(other.id);
  if (!state) return;

  const newHealth = Math.max(0, (state.health ?? 100) - s.damage);
  objectApi.patchObjectState(other.id, { health: newHealth });

  // Hit juice
  objectApi.flash(other.id, { color: "oklch(0.9 0.2 90)" });
  objectApi.damageNumber(other.feetPosition, s.damage, { color: "oklch(0.9 0.2 90)" });
  objectApi.hitstop(0.04);
  objectApi.playSound("cdn/sfx-hit-impact-melee-thud.mp3", { position: other.feetPosition, volume: 0.6 });
}
```

---

## Ranged Combat — Projectiles

```js
// state: { fireCooldown: 0 }
const FIRE_RATE = 0.3;    // seconds between shots
const PROJECTILE_SPEED = 30;
const PROJECTILE_DAMAGE = 20;

export function update(dt, objectApi) {
  const s = objectApi.getState();
  if (s.fireCooldown > 0) {
    objectApi.patchState({ fireCooldown: s.fireCooldown - dt });
  }
}

export function onInput(input, objectApi) {
  if (!input.actions.fire) return;
  const s = objectApi.getState();
  if (s.fireCooldown > 0) return;

  const pos = objectApi.getProperty("feetPosition");
  const yaw = objectApi.getProperty("yaw") ?? 0;
  const dir = objectApi.directionFromYawPitch(yaw, 0);

  const projId = objectApi.uniqueId("bullet");
  objectApi.spawn(projId, {
    tags: ["projectile"],
    lifetime: 5,
    behavior: ["scripts/projectile.js"],
    properties: {
      feetPosition: { x: pos.x + dir.x, y: pos.y + 1.2, z: pos.z + dir.z },
      primitive: { kind: "sphere", radius: 0.1 },
      material: { color: "oklch(0.85 0.2 90)", emissive: "oklch(0.85 0.2 90)", emissiveIntensity: 2 },
      physics: "dynamic"
    },
    state: { damage: PROJECTILE_DAMAGE }
  });

  // Launch it
  objectApi.addVelocity.call({ id: projId }, dir.x * PROJECTILE_SPEED, dir.y * PROJECTILE_SPEED, dir.z * PROJECTILE_SPEED);
  // Note: use setObjectProperty or handle in projectile onSpawn instead

  objectApi.playSound("cdn/sfx-laser-shoot-zap-fire.mp3", { position: pos, volume: 0.4, pitch: 0.9 + objectApi.random() * 0.2 });
  objectApi.patchState({ fireCooldown: FIRE_RATE });
}
```

### Projectile Behavior

```js
// scripts/projectile.js
export function onSpawn(objectApi) {
  // Launch forward based on parent's aim
  const yaw = objectApi.getProperty("yaw") ?? 0;
  const dir = objectApi.directionFromYawPitch(yaw, 0);
  objectApi.addVelocity(dir.x * 30, 0, dir.z * 30);

  // Trail effect
  const pos = objectApi.getProperty("feetPosition");
  const trailId = objectApi.particleBurst(pos, "trail", { color: "oklch(0.85 0.2 90)", loop: true, scale: 0.3 });
  objectApi.patchState({ trailId });
}

export function onCollide(other, objectApi, contact) {
  const s = objectApi.getState();
  const pos = objectApi.getProperty("feetPosition");

  // Deal damage if it's an enemy
  if (other.tags.includes("enemy")) {
    const state = objectApi.getObjectState(other.id);
    if (state) {
      objectApi.patchObjectState(other.id, { health: Math.max(0, (state.health ?? 100) - s.damage) });
      objectApi.flash(other.id, { color: "oklch(0.6 0.25 25)" });
      objectApi.damageNumber(pos, s.damage, { color: "oklch(0.85 0.2 90)" });
    }
  }

  // Impact effects
  objectApi.particleBurst(pos, "spark", { scale: 0.5 });
  objectApi.playSound("cdn/sfx-impact-projectile-hit.mp3", { position: pos, volume: 0.4 });
  if (s.trailId) objectApi.stopParticleBurst(s.trailId);
  objectApi.destroy();
}

export function onDestroy(objectApi) {
  const s = objectApi.getState();
  if (s.trailId) objectApi.stopParticleBurst(s.trailId);
}
```

---

## Ranged Combat — Hitscan / Raycast

Server-authoritative instant hit detection using physics raycast:

```js
export function onInput(input, objectApi) {
  if (!input.actions.fire) return;

  // getAimDirection works on server (uses input axes, not camera)
  const direction = objectApi.getAimDirection(input);
  if (!direction) return;

  const origin = objectApi.getAimOrigin(1.6); // eye height

  const hit = objectApi.raycastPhysics(origin, direction, {
    maxDistance: 100,
    ignoreIds: [objectApi.id] // don't hit yourself!
  });

  if (hit && hit.objectId) {
    const state = objectApi.getObjectState(hit.objectId);
    if (state?.health !== undefined) {
      const newHealth = Math.max(0, state.health - 25);
      objectApi.patchObjectState(hit.objectId, { health: newHealth });

      // Hit feedback
      objectApi.flash(hit.objectId, { color: "oklch(0.6 0.25 25)" });
      objectApi.damageNumber(hit.position, 25, { color: "oklch(0.85 0.2 90)" });
      objectApi.particleBurst(hit.position, "spark", { scale: 0.3 });
      objectApi.hitstop(0.03);
    }
  }

  // Muzzle flash
  objectApi.playSound("cdn/sfx-gunshot-rifle-fire.mp3", { volume: 0.5 });
  objectApi.screenShake(0.05, 0.08);
}
```

**IMPORTANT**: `getAimDirection(input)` requires these axes in your input config: `aimYawSin`, `aimYawCos`, `aimPitchN`. The default camera provides these automatically.

### Penetrating Shot

```js
const hits = objectApi.raycastPhysicsAll(origin, direction, {
  maxDistance: 100,
  excludeTags: ["player"]
});

let damage = 50;
for (const hit of hits) {
  if (hit.objectId) {
    const state = objectApi.getObjectState(hit.objectId);
    if (state?.health !== undefined) {
      objectApi.patchObjectState(hit.objectId, { health: state.health - damage });
      objectApi.flash(hit.objectId, { color: "oklch(0.6 0.25 25)" });
    }
    damage *= 0.5; // Halve damage per penetration
  }
}
```

---

## Enemy AI

State machine pattern for ground enemies:

```js
// scripts/enemy-ai.js
const DETECTION_RANGE = 20;
const ATTACK_RANGE = 2;
const MOVE_SPEED = 4;
const ATTACK_COOLDOWN = 1.5;
const ATTACK_DAMAGE = 10;
const GRAVITY = -24;

// state: { aiState: "idle", originX: 0, originZ: 0, attackTimer: 0, vy: 0 }

export function onSpawn(objectApi) {
  const pos = objectApi.getProperty("feetPosition");
  objectApi.patchState({ originX: pos.x, originZ: pos.z });
}

export function update(dt, objectApi) {
  const s = objectApi.getState();

  // Death check
  if ((s.health ?? 100) <= 0) {
    const pos = objectApi.getProperty("feetPosition");
    objectApi.particleBurst(pos, "explosion", { scale: 0.8 });
    objectApi.playSound("cdn/sfx-enemy-death-defeat.mp3", { position: pos, volume: 0.5 });
    objectApi.destroy();
    return;
  }

  // Gravity
  let vy = s.vy ?? 0;
  if (objectApi.isGrounded() && vy < 0) vy = 0;
  vy += GRAVITY * dt;

  // Find nearest player
  const players = objectApi.query({ tags: ["player"], radius: DETECTION_RANGE });
  const pos = objectApi.getProperty("feetPosition");

  if (players.length > 0) {
    const target = players[0];
    const dx = target.feetPosition.x - pos.x;
    const dz = target.feetPosition.z - pos.z;
    const dist = Math.hypot(dx, dz);

    if (dist < ATTACK_RANGE) {
      // ATTACK
      const timer = (s.attackTimer ?? 0) - dt;
      if (timer <= 0) {
        // Deal damage
        const pState = objectApi.getObjectState(target.id);
        if (pState && !pState.invulnerable) {
          const newHp = Math.max(0, (pState.health ?? 100) - ATTACK_DAMAGE);
          objectApi.patchObjectState(target.id, { health: newHp });
          objectApi.damageNumber(target.feetPosition, ATTACK_DAMAGE, { color: "oklch(0.6 0.25 25)" });
          objectApi.screenShake(0.1, 0.15);
          objectApi.screenFlash("oklch(0.5 0.2 25)", 0.1);
          objectApi.playSound("cdn/sfx-enemy-attack-claw-swipe.mp3", { position: pos, volume: 0.5 });
        }
        objectApi.patchState({ attackTimer: ATTACK_COOLDOWN, vy });
      } else {
        objectApi.patchState({ attackTimer: timer, vy });
      }
      objectApi.move(0, vy * dt, 0);
    } else {
      // CHASE
      const step = MOVE_SPEED * dt;
      objectApi.move((dx / dist) * step, vy * dt, (dz / dist) * step);
      objectApi.patchState({ aiState: "chasing", vy });
    }
  } else {
    // IDLE / RETURN TO ORIGIN
    const dx = s.originX - pos.x;
    const dz = s.originZ - pos.z;
    const dist = Math.hypot(dx, dz);

    if (dist > 1) {
      const step = MOVE_SPEED * 0.5 * dt;
      objectApi.move((dx / dist) * step, vy * dt, (dz / dist) * step);
    } else {
      objectApi.move(0, vy * dt, 0);
    }
    objectApi.patchState({ aiState: "idle", vy });
  }
}
```

---

## Wave Spawner

```js
// scripts/wave-spawner.js
const WAVES = [
  { count: 5,  delay: 1.0, health: 50,  speed: 3 },
  { count: 8,  delay: 0.8, health: 60,  speed: 3.5 },
  { count: 12, delay: 0.6, health: 80,  speed: 4 },
  { count: 6,  delay: 0.5, health: 150, speed: 4.5 },  // mini-boss wave
  { count: 1,  delay: 0,   health: 500, speed: 2 },     // boss
];

const SPAWN_RADIUS = 25;

// state: { wave: 0, spawnedThisWave: 0, spawnTimer: 0, waveActive: false, breakTimer: 5 }

export function update(dt, objectApi) {
  const s = objectApi.getState();

  if (!s.waveActive) {
    // Break between waves
    const timer = (s.breakTimer ?? 5) - dt;
    if (timer <= 0) {
      objectApi.patchState({ waveActive: true, spawnedThisWave: 0, spawnTimer: 0 });
      objectApi.announce(`Wave ${s.wave + 1}`, { duration: 2 });
      objectApi.playSound("cdn/sfx-wave-start-horn-blast.mp3", { volume: 0.6 });
    } else {
      objectApi.patchState({ breakTimer: timer });
    }
    return;
  }

  const waveCfg = WAVES[Math.min(s.wave, WAVES.length - 1)];

  // Spawn enemies
  if (s.spawnedThisWave < waveCfg.count) {
    const timer = (s.spawnTimer ?? 0) - dt;
    if (timer <= 0) {
      spawnEnemy(objectApi, waveCfg);
      objectApi.patchState({
        spawnedThisWave: s.spawnedThisWave + 1,
        spawnTimer: waveCfg.delay
      });
    } else {
      objectApi.patchState({ spawnTimer: timer });
    }
  }

  // Check if wave is complete (all spawned and all dead)
  if (s.spawnedThisWave >= waveCfg.count) {
    const alive = objectApi.query({ tags: ["enemy"], radius: 500 });
    if (alive.length === 0) {
      // Wave complete!
      objectApi.announce(`Wave ${s.wave + 1} Complete!`, { duration: 2 });
      objectApi.playSound("cdn/sfx-wave-complete-victory-chime.mp3", { volume: 0.5 });
      objectApi.patchState({
        wave: s.wave + 1,
        waveActive: false,
        breakTimer: 5
      });
    }
  }
}

function spawnEnemy(objectApi, cfg) {
  const angle = objectApi.random() * Math.PI * 2;
  const dist = SPAWN_RADIUS * (0.7 + objectApi.random() * 0.3);
  const x = Math.cos(angle) * dist;
  const z = Math.sin(angle) * dist;

  objectApi.spawn(objectApi.uniqueId("enemy"), {
    tags: ["enemy"],
    behavior: ["scripts/enemy-ai.js"],
    properties: {
      feetPosition: { x, z, y: { terrain: 0 } },
      animated3DCharacter: { modelId: "cdn/model-humanoid-fantasy-zombie-enemy.glb", faceMovement: true },
      physics: "character"
    },
    state: { health: cfg.health, maxHealth: cfg.health, moveSpeed: cfg.speed, aiState: "idle", vy: 0 }
  });
}
```

---

## Damage Zones / Hazards

```js
// scripts/hazard-zone.js
// Object needs: primitive shape + physics: { body: "static", trigger: true }
const DAMAGE_PER_TICK = 10;
const TICK_INTERVAL = 1.0;
const DANGER_COLOR = "oklch(0.6 0.25 25)";

// state: { overlapping: {}, cooldowns: {} }

export function update(dt, objectApi) {
  const s = objectApi.getState();
  const cooldowns = { ...s.cooldowns };

  for (const id of Object.keys(cooldowns)) {
    cooldowns[id] = Math.max(0, cooldowns[id] - dt);
  }

  for (const id of Object.keys(s.overlapping)) {
    if ((cooldowns[id] ?? 0) > 0) continue;
    const state = objectApi.getObjectState(id);
    if (!state || (state.health ?? 100) <= 0) continue;

    objectApi.patchObjectState(id, { health: Math.max(0, state.health - DAMAGE_PER_TICK) });
    objectApi.damageNumber(s.overlapping[id], DAMAGE_PER_TICK, { color: DANGER_COLOR });
    objectApi.screenFlash(DANGER_COLOR, 0.1);
    objectApi.playSound("cdn/sfx-damage-burn-sizzle.mp3", { position: s.overlapping[id], volume: 0.4 });
    cooldowns[id] = TICK_INTERVAL;
  }

  objectApi.patchState({ cooldowns });
}

export function onTriggerEnter(other, objectApi) {
  if (!other.tags.includes("player")) return;
  const s = objectApi.getState();
  objectApi.patchState({ overlapping: { ...s.overlapping, [other.id]: other.feetPosition } });
  objectApi.vignette(0.3, DANGER_COLOR);
}

export function onTriggerExit(other, objectApi) {
  if (!other.tags.includes("player")) return;
  const s = objectApi.getState();
  const overlapping = { ...s.overlapping };
  delete overlapping[other.id];
  const cooldowns = { ...s.cooldowns };
  delete cooldowns[other.id];
  objectApi.patchState({ overlapping, cooldowns });
  objectApi.vignette(0);
}
```

**CRITICAL**: Triggers need BOTH a shape (primitive or collider) AND `physics: { body: "static", trigger: true }`. Without both, onTriggerEnter won't fire. Only the trigger owner gets the callback — the entering object does NOT.

---

## Damage Feedback Juice Reference

### Taking Damage
```js
objectApi.screenShake(0.1 + damage * 0.005, 0.15);
objectApi.screenFlash("oklch(0.5 0.2 25)", 0.1);
objectApi.damageNumber(pos, damage, { color: "oklch(0.6 0.25 25)" });
objectApi.playSound("cdn/sfx-damage-hit-pain.mp3", { position: pos, volume: 0.5 });
objectApi.vignette(0.2, "oklch(0.5 0.2 25)"); // brief red edge
```

### Dealing Damage
```js
objectApi.flash(targetId, { color: "oklch(0.6 0.25 25)", duration: 0.1 });
objectApi.hitstop(0.03 + damage * 0.001);
objectApi.particleBurst(hitPos, "spark", { scale: 0.3 });
objectApi.cameraPunch(hitDir, 0.1);
```

### Killing an Enemy
```js
objectApi.slowMo({ scale: 0.3, duration: 0.2, ease: true });
objectApi.particleBurst(pos, "explosion", { scale: 1.5 });
objectApi.screenShake(0.2, 0.3);
objectApi.announce("ELIMINATED", { duration: 1 });
objectApi.playSound("cdn/sfx-kill-confirmed-elimination.mp3", { volume: 0.6 });
```

### Low Health Warning
```js
// In UI: pulse animation when health < 25%
// In behavior: persistent subtle vignette
if (health < maxHealth * 0.25) {
  objectApi.vignette(0.15, "oklch(0.5 0.2 25)");
  // Optional: heartbeat sound loop
}
```

Scale everything to damage: bigger hits → more shake, longer hitstop, louder sounds.

---

## Common Pitfalls

1. **Trigger needs shape + trigger physics**: Without both, onTriggerEnter silently never fires.
2. **Only trigger owner gets callbacks**: The entering object does NOT receive onTriggerEnter.
3. **raycastPhysics hits self**: Always use `ignoreIds: [objectApi.id]`.
4. **getAimDirection needs input axes**: Requires aimYawSin, aimYawCos, aimPitchN in input config.
5. **Projectiles accumulate**: Always set `lifetime` or destroy in onCollide.
6. **Enemy spawns inside walls**: Validate spawn positions or use terrain-relative positions.
7. **No invulnerability after respawn**: Players get killed instantly. Add 1-2s invulnerability.
