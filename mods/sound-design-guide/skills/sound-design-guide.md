---
name: Sound Design Guide
description: Complete audio guide — SFX, music, ambience, spatial audio, pitch variation, genre palettes, voice lines, volume mixing, and sound timing for game feel.
---

# Sound Design Guide — Audio for Spawn Games

## When to Use

Load this skill when adding any audio to a game: sound effects, music, ambient loops, voice lines, spatial audio, or when tuning audio mixing and game feel through sound.

---

## Audio APIs

### One-Shot SFX

```js
objectApi.playSound("cdn/sfx-sword-slash-metal-swing.mp3", {
  position: { x: 0, y: 1, z: 0 },  // optional: spatial positioning
  volume: 0.5,     // 0-2, typical range 0.2-0.6
  pitch: 1.0,      // 0.5-2.0, 1.0 = normal
  loop: false,      // true for looping sounds (returns soundId)
  audience: { kind: "nearby", position: pos, radius: 50 } // optional: who hears it
});
```

Returns a `soundId` string — store it if looping, use `objectApi.stopSound(soundId)` to stop.

### Positional SFX

```js
objectApi.playSoundAt("cdn/sfx-explosion-fire-boom.mp3", { x: 10, y: 0, z: -5 }, {
  volume: 0.6,
  pitch: 0.8
});
```

### Music

```js
// Start music with crossfade
objectApi.musicShift("cdn/music-instrumental-epic-battle-orchestral.mp3", {
  fade: 2,       // crossfade duration in seconds
  volume: 0.2    // music sits low in the mix
});

// Stop music
objectApi.musicShift(null, { fade: 3 });
```

### Ambient Soundscapes

```js
// Start ambient loop
objectApi.ambience("cdn/sfx-ambient-forest-birds-chirping.mp3", {
  fade: 2,
  volume: 0.25
});

// Stop ambience
objectApi.ambience(null, { fade: 3 });
```

### Object Audio Property (Static World Sounds)

For sounds attached to objects in the world (campfire, waterfall, machinery):

```js
// On spawn or object definition
properties: {
  audio: {
    clip: "cdn/sfx-ambient-campfire-crackle-burn.mp3",
    gain: 0.3,
    pitch: 1.0,
    loop: true,
    spatial: true,
    maxDistance: 20  // falloff range in meters
  }
}
```

---

## CDN Audio Naming

**ALWAYS include .mp3 extension. ALWAYS include a style keyword matching the game aesthetic.**

### SFX (One-Shot, Instant)

```
/cdn/sfx-sword-slash-metal-swing.mp3
/cdn/sfx-footstep-grass-soft-step.mp3
/cdn/sfx-coin-collect-chime-pickup.mp3
/cdn/sfx-explosion-fire-boom-blast.mp3
/cdn/sfx-button-click-ui-tap.mp3
/cdn/sfx-damage-hit-impact-thud.mp3
/cdn/sfx-heal-magic-chime-restore.mp3
/cdn/sfx-jump-whoosh-leap.mp3
/cdn/sfx-door-creak-wood-open.mp3
/cdn/sfx-gunshot-rifle-fire-shot.mp3
```

### Ambient Loops (Continuous Background)

```
/cdn/sfx-ambient-forest-birds-chirping.mp3
/cdn/sfx-ambient-wind-howling-breeze.mp3
/cdn/sfx-ambient-campfire-crackle-burn.mp3
/cdn/sfx-ambient-cave-water-drips.mp3
/cdn/sfx-ambient-city-traffic-distant.mp3
/cdn/sfx-ambient-ocean-waves-shore.mp3
/cdn/sfx-ambient-rain-heavy-downpour.mp3
/cdn/sfx-ambient-dungeon-eerie-hum.mp3
/cdn/sfx-ambient-crowd-stadium-roar.mp3
/cdn/sfx-ambient-spaceship-engine-hum.mp3
```

### Music (Instrumental — Guaranteed No Vocals)

```
/cdn/music-instrumental-peaceful-forest-ambience.mp3
/cdn/music-instrumental-epic-battle-orchestral.mp3
/cdn/music-instrumental-medieval-tavern-lute.mp3
/cdn/music-instrumental-horror-tension-drone.mp3
/cdn/music-instrumental-cyberpunk-synthwave-drive.mp3
/cdn/music-instrumental-cozy-acoustic-guitar-warm.mp3
/cdn/music-instrumental-boss-fight-intense-drums.mp3
/cdn/music-instrumental-victory-fanfare-triumphant.mp3
```

### Music (With Vocals)

```
/cdn/music-vocals-anime-jpop-upbeat.mp3
/cdn/music-vocals-fantasy-choir-ethereal.mp3
/cdn/music-vocals-indie-folk-gentle.mp3
```

### Voice Lines

```
/cdn/voice-male-narrator-epic-saying-the-quest-begins-now.mp3
/cdn/voice-female-soft-gentle-saying-welcome-traveler.mp3
/cdn/voice-monster-growl-deep-saying-you-dare-enter-my-domain.mp3
/cdn/voice-old-wizard-raspy-saying-choose-wisely-young-one.mp3
```

Same voice description = same consistent voice. The part before `-saying-` defines the voice character.

---

## Volume Guidelines (CRITICAL)

| Category | Range | Notes |
|----------|-------|-------|
| **SFX** | 0.2-0.6 | Main gameplay sounds. Never above 0.8 for repeated sounds. |
| **UI clicks** | 0.2-0.5 | Soft, not jarring. Menu navigation feel. |
| **Music** | 0.1-0.3 | Sits UNDERNEATH everything. Never competes. |
| **Ambience** | 0.1-0.4 | Background texture. Felt more than heard. |
| **Voice lines** | 0.5-0.8 | Slightly above SFX for clarity. |
| **Impacts/Explosions** | 0.4-0.7 | Brief loud moments are okay for drama. |

The volume/gain range is 0-2, but 0-1 is typical. Going above 1.0 is rare and only for dramatic one-shots.

**Golden Rule**: If you're second-guessing volume, go quieter. You can always turn it up. Too loud is immediately annoying.

---

## Pitch Variation for Juice

Repeating the same sound at the same pitch gets annoying FAST. Always vary pitch:

### Random Variation (Most Common)

```js
// ±10% random pitch variation
objectApi.playSound("cdn/sfx-footstep-stone-tap.mp3", {
  position: pos,
  volume: 0.3,
  pitch: 0.9 + objectApi.random() * 0.2  // 0.9-1.1
});
```

### Combo Escalation

```js
// Each consecutive hit gets higher pitched
const combo = objectApi.getState().comboCount ?? 0;
objectApi.playSound("cdn/sfx-hit-impact-punch.mp3", {
  position: pos,
  volume: 0.4 + Math.min(combo * 0.02, 0.3),
  pitch: 1.0 + Math.min(combo * 0.05, 0.5)  // caps at 1.5
});
```

### Weight / Size Indication

```js
// Heavy impact = lower pitch
objectApi.playSound("cdn/sfx-impact-heavy-thud.mp3", { pitch: 0.7, volume: 0.7 });

// Light / small = higher pitch
objectApi.playSound("cdn/sfx-impact-light-tap.mp3", { pitch: 1.3, volume: 0.3 });
```

### Coin Collection Escalation

```js
const coins = objectApi.getState().coins ?? 0;
objectApi.playSound("cdn/sfx-coin-collect-chime-pickup.mp3", {
  position: pos,
  pitch: 1.0 + Math.min(coins * 0.03, 0.5),  // gets higher per coin
  volume: 0.4
});
```

---

## Sound Design by Genre

### Fantasy RPG
```
Music:    /cdn/music-instrumental-medieval-tavern-lute.mp3
          /cdn/music-instrumental-epic-orchestral-adventure.mp3
Ambience: /cdn/sfx-ambient-forest-birds-chirping.mp3
          /cdn/sfx-ambient-tavern-crowd-chatter.mp3
SFX:      /cdn/sfx-sword-slash-metal-swing.mp3
          /cdn/sfx-magic-spell-cast-whoosh.mp3
          /cdn/sfx-potion-drink-gulp-bubble.mp3
          /cdn/sfx-chest-open-creak-treasure.mp3
          /cdn/sfx-footstep-stone-dungeon-echo.mp3
```

### Horror
```
Music:    /cdn/music-instrumental-horror-tension-drone.mp3
          /cdn/music-instrumental-horror-ambient-eerie.mp3
Ambience: /cdn/sfx-ambient-wind-howling-eerie.mp3
          /cdn/sfx-ambient-dungeon-water-drips-echo.mp3
SFX:      /cdn/sfx-door-creak-slow-horror.mp3
          /cdn/sfx-heartbeat-tense-pulse.mp3
          /cdn/sfx-whisper-ghostly-faint.mp3
          /cdn/sfx-glass-shatter-break.mp3
          /cdn/sfx-footstep-wood-creak-slow.mp3
```

### Sci-Fi / Cyberpunk
```
Music:    /cdn/music-instrumental-cyberpunk-synthwave-drive.mp3
          /cdn/music-instrumental-scifi-ambient-space.mp3
Ambience: /cdn/sfx-ambient-spaceship-engine-hum.mp3
          /cdn/sfx-ambient-neon-city-electronic-buzz.mp3
SFX:      /cdn/sfx-laser-shoot-zap-fire.mp3
          /cdn/sfx-computer-beep-interface-blip.mp3
          /cdn/sfx-door-airlock-hiss-open.mp3
          /cdn/sfx-energy-shield-activate-hum.mp3
          /cdn/sfx-reload-weapon-mechanical-click.mp3
```

### Casual / Cozy
```
Music:    /cdn/music-instrumental-cozy-acoustic-guitar-warm.mp3
          /cdn/music-instrumental-peaceful-piano-gentle.mp3
Ambience: /cdn/sfx-ambient-garden-birds-gentle-breeze.mp3
          /cdn/sfx-ambient-rain-light-window.mp3
SFX:      /cdn/sfx-pop-bubble-light-cute.mp3
          /cdn/sfx-chime-bell-happy-ding.mp3
          /cdn/sfx-click-soft-button-tap.mp3
          /cdn/sfx-plant-grow-sparkle-bloom.mp3
```

### Action / Shooter
```
Music:    /cdn/music-instrumental-action-electronic-intense.mp3
          /cdn/music-instrumental-boss-fight-heavy-drums.mp3
Ambience: /cdn/sfx-ambient-battlefield-distant-gunfire.mp3
SFX:      /cdn/sfx-gunshot-rifle-fire-shot.mp3
          /cdn/sfx-explosion-grenade-boom-blast.mp3
          /cdn/sfx-reload-shotgun-pump-click.mp3
          /cdn/sfx-bullet-impact-ricochet-metal.mp3
          /cdn/sfx-footstep-run-gravel-fast.mp3
```

### Neon / Arcade
```
Music:    /cdn/music-instrumental-retro-electronic-arcade-beat.mp3
          /cdn/music-instrumental-synthwave-neon-drive.mp3
Ambience: /cdn/sfx-ambient-crowd-stadium-roar.mp3
SFX:      /cdn/sfx-8bit-blip-retro-pickup.mp3
          /cdn/sfx-bass-drop-electronic-boom.mp3
          /cdn/sfx-countdown-beep-digital-tone.mp3
          /cdn/sfx-victory-chime-arcade-fanfare.mp3
```

---

## Music Transitions

### Context-Based Switching

```js
// Exploration → Combat
function enterCombat(objectApi) {
  objectApi.musicShift("cdn/music-instrumental-epic-battle-orchestral.mp3", {
    fade: 1.5,    // fast transition for combat urgency
    volume: 0.25
  });
}

// Combat → Exploration
function exitCombat(objectApi) {
  objectApi.musicShift("cdn/music-instrumental-peaceful-forest-ambience.mp3", {
    fade: 3,      // slower transition back to calm
    volume: 0.15
  });
}

// Boss Encounter
function bossAppears(objectApi) {
  objectApi.musicShift("cdn/music-instrumental-boss-fight-intense-drums.mp3", {
    fade: 0.5,    // sudden dramatic shift
    volume: 0.3
  });
}

// Victory
function victory(objectApi) {
  objectApi.musicShift("cdn/music-instrumental-victory-fanfare-triumphant.mp3", {
    fade: 0.3,
    volume: 0.35
  });
}

// Stop music (silence for dramatic moments)
objectApi.musicShift(null, { fade: 2 });
```

### Recommended Fade Times
- Action transitions (calm → combat): 0.5-1.5s
- Mood transitions (area change): 2-4s
- Dramatic silence: fade out 1-2s, hold silence, fade in new track
- Menu → gameplay: 1-2s

---

## Ambient Layering

### Global + Local Pattern

```js
// Global layer: base atmosphere
objectApi.ambience("cdn/sfx-ambient-forest-birds-chirping.mp3", { volume: 0.2, fade: 2 });

// Local layer: specific location (object audio property, spatial)
{
  id: "campfire",
  properties: {
    audio: {
      clip: "cdn/sfx-ambient-campfire-crackle-burn.mp3",
      gain: 0.4,
      loop: true,
      spatial: true,
      maxDistance: 15
    }
  }
}
```

### Biome Transitions

```js
// Switch ambience when entering different areas
function enterSwamp(objectApi) {
  objectApi.ambience("cdn/sfx-ambient-swamp-frogs-insects-buzz.mp3", { fade: 3, volume: 0.25 });
}

function enterCave(objectApi) {
  objectApi.ambience("cdn/sfx-ambient-cave-water-drips-echo.mp3", { fade: 3, volume: 0.2 });
}

function enterTown(objectApi) {
  objectApi.ambience("cdn/sfx-ambient-town-market-crowd-chatter.mp3", { fade: 3, volume: 0.2 });
}
```

---

## Spatial Audio

### When to Use Spatial
- Environmental sounds: campfire, waterfall, machinery, torches
- NPC/enemy sounds: footsteps, grunts, dialogue
- Explosions, impacts at world positions

### When NOT to Use Spatial
- UI sounds (clicks, menus)
- Music
- Player feedback (damage flash, level up)
- Global announcements

### Spatial Setup

```js
// World-placed looping sound (on object)
properties: {
  audio: {
    clip: "cdn/sfx-ambient-waterfall-rush.mp3",
    gain: 0.5,
    loop: true,
    spatial: true,
    maxDistance: 30  // hearable within 30 meters
  }
}

// One-shot at position
objectApi.playSoundAt("cdn/sfx-explosion-fire-boom.mp3", hitPosition, {
  volume: 0.6
});

// One-shot with explicit position in opts
objectApi.playSound("cdn/sfx-enemy-growl-deep.mp3", {
  position: enemyPos,
  volume: 0.4
});
```

---

## Sound Timing & Game Feel

### Immediate Feedback
Play sounds ON the action, never after a delay:

```js
// GOOD: Sound fires with the action
if (input.actions.attack) {
  objectApi.playSound("cdn/sfx-sword-slash-metal-swing.mp3", { volume: 0.5 });
  // ... attack logic
}

// BAD: Delayed sound feels disconnected
if (input.actions.attack) {
  objectApi.runInSeconds(0.3, () => objectApi.playSound(...)); // NO!
}
```

### Countdown Pattern

```js
// Ascending beeps, final GO is different
function playCountdown(objectApi, number) {
  if (number > 0) {
    objectApi.playSound("cdn/sfx-countdown-beep-digital-tone.mp3", {
      volume: 0.4 + (3 - number) * 0.1,  // gets louder
      pitch: 0.8 + (3 - number) * 0.15   // gets higher
    });
  } else {
    // GO!
    objectApi.playSound("cdn/sfx-countdown-go-buzzer-start.mp3", {
      volume: 0.7,
      pitch: 1.0
    });
  }
}
```

### Victory Sequence

```js
// Small delay after visual for dramatic weight
objectApi.runInSeconds(0.15, () => {
  objectApi.playSound("cdn/sfx-victory-chime-fanfare-win.mp3", { volume: 0.6 });
});
```

### Death Sequence

```js
// Impact → brief silence → death sting
objectApi.playSound("cdn/sfx-impact-heavy-final-blow.mp3", { volume: 0.7 });
objectApi.runInSeconds(0.3, () => {
  objectApi.playSound("cdn/sfx-death-dramatic-sting.mp3", { volume: 0.5 });
});
```

---

## Looping Sounds

Always store the soundId and clean up on destroy:

```js
// scripts/torch.js
export function onSpawn(objectApi) {
  const pos = objectApi.getProperty("feetPosition");
  const fireId = objectApi.playSound("cdn/sfx-ambient-fire-torch-crackle.mp3", {
    position: pos,
    volume: 0.3,
    loop: true
  });
  objectApi.patchState({ fireId });
}

export function onDestroy(objectApi) {
  const s = objectApi.getState();
  if (s.fireId) objectApi.stopSound(s.fireId);
}
```

**CRITICAL**: If you don't stop looping sounds, they pile up forever. Always clean up in onDestroy.

---

## Voice Lines

```js
// Consistent voice across multiple lines
objectApi.playSound("cdn/voice-old-wizard-raspy-saying-choose-wisely.mp3", { volume: 0.7 });
objectApi.playSound("cdn/voice-old-wizard-raspy-saying-the-path-is-dark.mp3", { volume: 0.7 });
// Same "old-wizard-raspy" = same voice

// Don't overlap voice lines
const s = objectApi.getState();
if (!s.voicePlaying) {
  objectApi.playSound("cdn/voice-merchant-friendly-saying-welcome-to-my-shop.mp3", { volume: 0.7 });
  objectApi.patchState({ voicePlaying: true });
  objectApi.runInSeconds(3, () => objectApi.patchState({ voicePlaying: false }));
}
```

---

## Common Mistakes

1. **Music too loud**: Should be 0.1-0.3. If you can't hear SFX over music, it's too loud.
2. **No pitch variation**: Same sound at same pitch = annoying after 10 repetitions. Always randomize ±10%.
3. **Forgetting to stop loops**: Looping sounds accumulate and destroy audio quality. Always stopSound in onDestroy.
4. **Spatial on non-spatial sounds**: UI clicks and player feedback don't need position.
5. **Playing sounds every frame**: Only play on state CHANGES, not continuously in update().
6. **Missing .mp3 extension**: CDN URLs without extension will fail silently.
7. **Style mismatch**: A medieval game with sci-fi laser sounds breaks immersion. Match the aesthetic.
8. **Volume above 1.0 for repeating sounds**: Eardrums. Don't.
9. **No audio at all**: Every game needs music from the first build. Don't wait to be asked.
