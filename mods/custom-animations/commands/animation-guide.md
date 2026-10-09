---
name: animation-guide
description: Learn how the custom character animation system works
---

---
description: Learn how custom character animations work in Spawn
requiresArgs: false
---

The user wants to learn about the custom character animation system. Load the **custom-animations** skill and give them a clear, friendly walkthrough covering:

1. **How it works**: Characters use a model-only animation approach — no engine auto-animation. You control every clip (idle, walk, run, attack, death, emotes) through a behavior script. This eliminates T-pose flashes and gives full creative control.

2. **The workflow**:
   - Choose or describe a character (warrior, mage, robot, anything)
   - Browse the Meshy animation library at https://docs.meshy.ai/en/api/animation-library to pick animation names
   - Tell Savi what animations you want (or let Savi pick good defaults)
   - Savi generates the model with baked animations, writes the behavior profile, and wires everything up

3. **What's possible**:
   - Custom idle, walk, run, sprint, jump animations per character
   - Abilities/spells with per-skill animation speed, cast times, and hit windows
   - Animation chaining (two clips for one ability — e.g., windup into release)
   - Interruptible casts (cancel mid-animation with movement or another ability)
   - Conditional idle states (combat idle vs peaceful idle)
   - Prejump anticipation (animation plays on ground before liftoff)
   - NPC patrol routes, interact emotes, and enemy behaviors — all with full custom animations

4. **Quick start**: Suggest they try `/create-character` to make their first animated character, or `/add-animation` to add new animations to an existing one.

Keep the tone conversational and exciting — this is a powerful system. Don't dump code or technical details. Speak in terms of what they can CREATE, not how the internals work.
