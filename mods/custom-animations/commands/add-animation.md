---
name: add-animation
description: Add new animations to an existing character
requiresArgs: true
argsPlaceholder: <character + new animations>
---

---
description: Add new animations to an existing character
requiresArgs: true
argsPlaceholder: <character name or description + new animations you want>
---

The user wants to add new animations to a character that already exists in the game. Load the **custom-animations** skill for the full architecture reference.

**User's request:** $ARGUMENTS

## Your Job

Add new animation capabilities to an existing character. This requires rebuilding the model URL (animations are baked at generation time) and updating the behavior profile.

### Step 1: Identify the Character
Find the existing character in the world. Read their current model URL to see what animations are already baked in. Read their behavior script to understand the current profile.

### Step 2: Determine New Animations
From the user's request, figure out what new animations they need. Help them pick from the Meshy library (https://docs.meshy.ai/en/api/animation-library). Share your picks and confirm before rebuilding.

### Step 3: Rebuild the Model URL
- Take the existing model URL description and style
- Append the new animation names to the existing animation list
- Keep ALL existing animations — do not remove any unless the user asks
- Remember: the URL rebuilds the entire model, so generation will take a moment

### Step 4: Update the Profile
- Add new entries to the semantic profile (clips, spellClips, or spells as appropriate)
- For new abilities: define castTime, hitTime, damage, range, animSpeed, icon, color
- For new emotes/idles: add clip entries with candidates and loop settings
- Wire any chain or interruptible configs the user wants

### Step 5: Update the Behavior
- If adding new abilities, ensure the onInput handler checks for the new spell keys
- Register any new input actions in the inputs spec
- If adding new locomotion states, update the update loop's animation resolution

### Step 6: Apply
- Update the entity's model property with the new URL
- The behavior script changes take effect immediately on save

### Important
- NEVER remove existing animations from the URL unless explicitly asked
- The model description/style in the URL should stay the same (same character, just with more animations)
- Warn the user that model regeneration takes a minute or two with many animations
- If they want animations that don't exist in Meshy, suggest the closest alternatives
