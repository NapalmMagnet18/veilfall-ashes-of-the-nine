---
name: create-character
description: Create a new character with custom animations
requiresArgs: true
argsPlaceholder: <describe your character>
---

---
description: Create a character with custom animations
requiresArgs: true
argsPlaceholder: <describe your character — appearance, role, abilities, personality>
---

The user wants to create a new animated character. Load the **custom-animations** skill for the full architecture reference.

**User's character description:** $ARGUMENTS

## Your Job

Create a fully animated character based on their description. This could be a player character, an NPC, an enemy, or a creature — interpret from context.

### Step 1: Design the Character
From their description, determine:
- Visual appearance (for the CDN model URL)
- Art style (match the game's existing style, or ask if unclear)
- Role: player character, NPC (static/patrol), or enemy
- Abilities/spells if they're a player or combat NPC (design 3-6 that fit the character fantasy)
- Emotes/interactions if they're an NPC

### Step 2: Pick Animations
Select animations from the Meshy library that fit the character. Always include the 5 basics (Idle, Walk, Run, Sprint, Jump). Add combat/ability/emote animations based on their role. Share your animation picks with the user and ask if they want to add or change any before generating.

Key reminders from the skill:
- Use exact Meshy animation names (they may contain typos like `mage_soell_cast_1`)
- 60 animations per model is the ceiling
- All animations must be in the URL at generation time — can't add later without rebuilding

### Step 3: Build the Profile
Create the semantic animation profile (PROFILE object) mapping logical names to actual clip names. Include:
- Locomotion clips (idle, walk, run, sprint, jump with prejump tuning)
- Ability/spell definitions with per-skill: castTime, hitTime, damage, range, animSpeed, icon, color
- Chain configs for any two-phase abilities
- Interruptible flags where appropriate
- Conditional idles if the character has combat states

### Step 4: Write the Behavior
- For **player characters**: Write or adapt a full behavior script following the skill's architecture (onSpawn setup, update loop with locomotion hysteresis, onInput for movement + abilities, smooth facing, prejump system)
- For **static NPCs**: Write a simpler behavior with idle + interact emotes
- For **patrol NPCs**: Write waypoint patrol with facing, idle/walk transitions, and interact emotes
- For **enemies**: Write patrol + attack behavior with health tracking

### Step 5: Wire Everything
- Spawn or update the entity with the model URL, behavior script, and correct physics (character controller with capsule collider)
- Set animated3DCharacter to false (or omit it — the behavior handles everything)
- Register any new input actions needed for abilities
- If it's a player character, update the player spec and add a UI for abilities/health if appropriate

### Important
- Do NOT hardcode anything to a specific class or archetype — this system works for ANY character concept
- Match the game's existing style and scale
- Test that the character doesn't T-pose at any point
- If the user's description is vague, make creative choices and tell them what you chose (they can adjust)
