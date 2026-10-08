# VEILFALL — Full campaign quest bible

**Version:** 1.0. **Campaign:** 5 acts, 10 story zones, 4 origin zones, 6 class questlines. **Levels:** 1–50. Every quest below has a machine-readable counterpart in `09_DATA/quests.json`.

## Quest and progression rules

- Every character completes the 5 ancestry origin quests (levels 1–5) plus the 3 class initiation quests (levels 3–7, available in the starter hub), then meets Maelin at Wayside Fire. The last class trial may overlap level 6; it need not block entry to the shared zone until accepted.
- Ancestry × class bridge quest is optional, unique to each of 24 combinations, unlocks at the third origin step and the first class step. It grants cosmetics, not superior stats.
- Side quests are never prerequisites for a main quest. Bosses must be runnable solo and scale to party size; use owned progress per player.
- The shared story requires boss completion, not merely entering the next Place. A waypoint unlock is per player; rejoining party at a later stage must not silently skip earlier story flags.
- Chapter choice is a personal ending in a separate epilogue instance. The persistent multiplayer world uses the Open Lattice canon.

## Ancestry opening: Cinderkin — Ashwake Moor
**Premise:** Your family hearth speaks a name outlawed by the Archive.

### ORI-CINDERKIN-01: The First Ash (L1)
**Trigger:** Els of the North Lane offers the quest after character creation. **Objective:** Listen to Els of the North Lane and investigate the first anomaly. **Story scene:** Your family hearth speaks a name outlawed by the Archive. **Reward:** {'xp': 150, 'currency': 35, 'items': []}. **Verification:** require server-side completion before granting rewards.

### ORI-CINDERKIN-02: The Son They Erased (L2)
**Trigger:** Els of the North Lane offers the quest after ORI-CINDERKIN-01. **Objective:** Recover 3 ancestral records from local ruins. **Story scene:** A forgotten part of families inscribe the names of their lost into coal-fired clay. returns to living memory. **Reward:** {'xp': 220, 'currency': 60, 'items': []}. **Verification:** require server-side completion before granting rewards.

### ORI-CINDERKIN-03: Smoke Under the Well (L3)
**Trigger:** Els of the North Lane offers the quest after ORI-CINDERKIN-02. **Objective:** Resolve a traversal obstacle and activate the safe checkpoint. **Story scene:** The local route teaches map, dodge and interact. **Reward:** {'xp': 300, 'currency': 85, 'items': []}. **Verification:** require server-side completion before granting rewards.

### ORI-CINDERKIN-04: A Name Against Flame (L4)
**Trigger:** Els of the North Lane offers the quest after ORI-CINDERKIN-03. **Objective:** Defeat Ashborn Strider. **Story scene:** The Ashborn Strider is a symptom of the opening breach. **Reward:** {'xp': 420, 'currency': 110, 'items': ['cinderkin_heirloom']}. **Verification:** require server-side completion before granting rewards.

### ORI-CINDERKIN-05: The Watchtower Call (L5)
**Trigger:** Els of the North Lane offers the quest after ORI-CINDERKIN-04. **Objective:** Travel to the shared Wayside Fire and meet Maelin. **Story scene:** Every lineage now shares the same danger. **Reward:** {'xp': 550, 'currency': 135, 'items': []}. **Verification:** require server-side completion before granting rewards.

## Ancestry opening: Fenborn — Gloamfen Reach
**Premise:** The wetland reflects a settlement that drowned before it existed.

### ORI-FENBORN-01: Rain Written Backward (L1)
**Trigger:** Reeve Ossa offers the quest after character creation. **Objective:** Listen to Reeve Ossa and investigate the first anomaly. **Story scene:** The wetland reflects a settlement that drowned before it existed. **Reward:** {'xp': 150, 'currency': 35, 'items': []}. **Verification:** require server-side completion before granting rewards.

### ORI-FENBORN-02: Reed-Script (L2)
**Trigger:** Reeve Ossa offers the quest after ORI-FENBORN-01. **Objective:** Recover 3 ancestral records from local ruins. **Story scene:** A forgotten part of fenspeople cultivate reed tablets that preserve a memory until rainfall. returns to living memory. **Reward:** {'xp': 220, 'currency': 60, 'items': []}. **Verification:** require server-side completion before granting rewards.

### ORI-FENBORN-03: The Missing Ferry (L3)
**Trigger:** Reeve Ossa offers the quest after ORI-FENBORN-02. **Objective:** Resolve a traversal obstacle and activate the safe checkpoint. **Story scene:** The local route teaches map, dodge and interact. **Reward:** {'xp': 300, 'currency': 85, 'items': []}. **Verification:** require server-side completion before granting rewards.

### ORI-FENBORN-04: The Mirror Heron (L4)
**Trigger:** Reeve Ossa offers the quest after ORI-FENBORN-03. **Objective:** Defeat Mirror Heron. **Story scene:** The Mirror Heron is a symptom of the opening breach. **Reward:** {'xp': 420, 'currency': 110, 'items': ['fenborn_heirloom']}. **Verification:** require server-side completion before granting rewards.

### ORI-FENBORN-05: Northward by Mist (L5)
**Trigger:** Reeve Ossa offers the quest after ORI-FENBORN-04. **Objective:** Travel to the shared Wayside Fire and meet Maelin. **Story scene:** Every lineage now shares the same danger. **Reward:** {'xp': 550, 'currency': 135, 'items': []}. **Verification:** require server-side completion before granting rewards.

## Ancestry opening: Stonebound — Underhollow Steps
**Premise:** The ancestral steps are speaking a family name that has not been carved.

### ORI-STONEBOUND-01: The Forty-Seventh Step (L1)
**Trigger:** Elder Marr offers the quest after character creation. **Objective:** Listen to Elder Marr and investigate the first anomaly. **Story scene:** The ancestral steps are speaking a family name that has not been carved. **Reward:** {'xp': 150, 'currency': 35, 'items': []}. **Verification:** require server-side completion before granting rewards.

### ORI-STONEBOUND-02: The Empty Carving (L2)
**Trigger:** Elder Marr offers the quest after ORI-STONEBOUND-01. **Objective:** Recover 3 ancestral records from local ruins. **Story scene:** A forgotten part of mountain communities carve genealogies into staircases, never individual statues. returns to living memory. **Reward:** {'xp': 220, 'currency': 60, 'items': []}. **Verification:** require server-side completion before granting rewards.

### ORI-STONEBOUND-03: Dust in the Forge (L3)
**Trigger:** Elder Marr offers the quest after ORI-STONEBOUND-02. **Objective:** Resolve a traversal obstacle and activate the safe checkpoint. **Story scene:** The local route teaches map, dodge and interact. **Reward:** {'xp': 300, 'currency': 85, 'items': []}. **Verification:** require server-side completion before granting rewards.

### ORI-STONEBOUND-04: Trial of the Chisel Wight (L4)
**Trigger:** Elder Marr offers the quest after ORI-STONEBOUND-03. **Objective:** Defeat Chisel Wight. **Story scene:** The Chisel Wight is a symptom of the opening breach. **Reward:** {'xp': 420, 'currency': 110, 'items': ['stonebound_heirloom']}. **Verification:** require server-side completion before granting rewards.

### ORI-STONEBOUND-05: The Stair to Daylight (L5)
**Trigger:** Elder Marr offers the quest after ORI-STONEBOUND-04. **Objective:** Travel to the shared Wayside Fire and meet Maelin. **Story scene:** Every lineage now shares the same danger. **Reward:** {'xp': 550, 'currency': 135, 'items': []}. **Verification:** require server-side completion before granting rewards.

## Ancestry opening: Skyforged — Gale Spires
**Premise:** A wind-chime repeats a melody that nobody living has composed.

### ORI-SKYFORGED-01: The Broken Chime (L1)
**Trigger:** Chanter Senn offers the quest after character creation. **Objective:** Listen to Chanter Senn and investigate the first anomaly. **Story scene:** A wind-chime repeats a melody that nobody living has composed. **Reward:** {'xp': 150, 'currency': 35, 'items': []}. **Verification:** require server-side completion before granting rewards.

### ORI-SKYFORGED-02: A Voice Between Gusts (L2)
**Trigger:** Chanter Senn offers the quest after ORI-SKYFORGED-01. **Objective:** Recover 3 ancestral records from local ruins. **Story scene:** A forgotten part of cliff dwellers tell histories in wind instruments played only at funerals. returns to living memory. **Reward:** {'xp': 220, 'currency': 60, 'items': []}. **Verification:** require server-side completion before granting rewards.

### ORI-SKYFORGED-03: The Rope Bridge (L3)
**Trigger:** Chanter Senn offers the quest after ORI-SKYFORGED-02. **Objective:** Resolve a traversal obstacle and activate the safe checkpoint. **Story scene:** The local route teaches map, dodge and interact. **Reward:** {'xp': 300, 'currency': 85, 'items': []}. **Verification:** require server-side completion before granting rewards.

### ORI-SKYFORGED-04: The Hushed Roc (L4)
**Trigger:** Chanter Senn offers the quest after ORI-SKYFORGED-03. **Objective:** Defeat Hushed Roc. **Story scene:** The Hushed Roc is a symptom of the opening breach. **Reward:** {'xp': 420, 'currency': 110, 'items': ['skyforged_heirloom']}. **Verification:** require server-side completion before granting rewards.

### ORI-SKYFORGED-05: The Descent of Bells (L5)
**Trigger:** Chanter Senn offers the quest after ORI-SKYFORGED-04. **Objective:** Travel to the shared Wayside Fire and meet Maelin. **Story scene:** Every lineage now shares the same danger. **Reward:** {'xp': 550, 'currency': 135, 'items': []}. **Verification:** require server-side completion before granting rewards.

## Six class-specific questlines

### Bladewraith — a duelist who turns remembered regrets into precise swordplay
Trainer: Sable Orr. Starting skill: **Ashcut**. Class resource: **Edge**.

- **CLS-BLADEWRAITH-01: A Blade With Two Names** (L3): Practice Ashcut against 5 training shades. The Bladewraith learns the responsibility of a duelist who turns remembered regrets into precise swordplay. Reward: {'xp': 250, 'currency': 0, 'skill_points': 0, 'items': []}.
- **CLS-BLADEWRAITH-02: The Weight of a Promise** (L5): Use Afterimage Guard to survive the vow arena. The Bladewraith learns the responsibility of a duelist who turns remembered regrets into precise swordplay. Reward: {'xp': 350, 'currency': 80, 'skill_points': 0, 'items': []}.
- **CLS-BLADEWRAITH-03: The Shattered Edge** (L7): Win Ancestral Edge by completing the Griefstep trial. The Bladewraith learns the responsibility of a duelist who turns remembered regrets into precise swordplay. Reward: {'xp': 450, 'currency': 160, 'skill_points': 1, 'items': ['ancestral_edge']}.

### Soulweaver — a memory-singer who weaves protective harmonics from chosen names
Trainer: Elen Sare. Starting skill: **Pulse Thread**. Class resource: **Resonance**.

- **CLS-SOULWEAVER-01: First Thread** (L3): Practice Pulse Thread against 5 training shades. The Soulweaver learns the responsibility of a memory-singer who weaves protective harmonics from chosen names. Reward: {'xp': 250, 'currency': 0, 'skill_points': 0, 'items': []}.
- **CLS-SOULWEAVER-02: A Chorus Unbroken** (L5): Use Warding Chorus to survive the vow arena. The Soulweaver learns the responsibility of a memory-singer who weaves protective harmonics from chosen names. Reward: {'xp': 350, 'currency': 80, 'skill_points': 0, 'items': []}.
- **CLS-SOULWEAVER-03: The Binding Vow** (L7): Win Resonant Spindle by completing the Warding Chorus trial. The Soulweaver learns the responsibility of a memory-singer who weaves protective harmonics from chosen names. Reward: {'xp': 450, 'currency': 160, 'skill_points': 1, 'items': ['resonant_spindle']}.

### Hellwarden — a covenant knight forged to shelter civilians during breaches
Trainer: Darrik Voss. Starting skill: **Cinder Strike**. Class resource: **Resolve**.

- **CLS-HELLWARDEN-01: A Shield for the Unnamed** (L3): Practice Cinder Strike against 5 training shades. The Hellwarden learns the responsibility of a covenant knight forged to shelter civilians during breaches. Reward: {'xp': 250, 'currency': 0, 'skill_points': 0, 'items': []}.
- **CLS-HELLWARDEN-02: Trial by Cinders** (L5): Use Ember Bastion to survive the vow arena. The Hellwarden learns the responsibility of a covenant knight forged to shelter civilians during breaches. Reward: {'xp': 350, 'currency': 80, 'skill_points': 0, 'items': []}.
- **CLS-HELLWARDEN-03: The Guarded Door** (L7): Win Oathshield by completing the Ember Bastion trial. The Hellwarden learns the responsibility of a covenant knight forged to shelter civilians during breaches. Reward: {'xp': 450, 'currency': 160, 'skill_points': 1, 'items': ['oathshield']}.

### Shadowmancer — a scholar of unchosen lives who bends reflections and occlusion
Trainer: Vey Anther. Starting skill: **Gloam Needle**. Class resource: **Shroud**.

- **CLS-SHADOWMANCER-01: No Shadow Without Witness** (L3): Practice Gloam Needle against 5 training shades. The Shadowmancer learns the responsibility of a scholar of unchosen lives who bends reflections and occlusion. Reward: {'xp': 250, 'currency': 0, 'skill_points': 0, 'items': []}.
- **CLS-SHADOWMANCER-02: The False Reflection** (L5): Use Mirror Snare to survive the vow arena. The Shadowmancer learns the responsibility of a scholar of unchosen lives who bends reflections and occlusion. Reward: {'xp': 350, 'currency': 80, 'skill_points': 0, 'items': []}.
- **CLS-SHADOWMANCER-03: Unmask the Seer** (L7): Win Blackglass Prism by completing the Mirror Snare trial. The Shadowmancer learns the responsibility of a scholar of unchosen lives who bends reflections and occlusion. Reward: {'xp': 450, 'currency': 160, 'skill_points': 1, 'items': ['blackglass_prism']}.

### Primalist — a guardian whose body borrows endurance from living ecosystems
Trainer: Iro Fen. Starting skill: **Rootlash**. Class resource: **Pulse**.

- **CLS-PRIMALIST-01: A Seed Remembers** (L3): Practice Rootlash against 5 training shades. The Primalist learns the responsibility of a guardian whose body borrows endurance from living ecosystems. Reward: {'xp': 250, 'currency': 0, 'skill_points': 0, 'items': []}.
- **CLS-PRIMALIST-02: Pact of the Grove** (L5): Use Thornskin to survive the vow arena. The Primalist learns the responsibility of a guardian whose body borrows endurance from living ecosystems. Reward: {'xp': 350, 'currency': 80, 'skill_points': 0, 'items': []}.
- **CLS-PRIMALIST-03: Fang of the Old Root** (L7): Win Living Totem by completing the Thornskin trial. The Primalist learns the responsibility of a guardian whose body borrows endurance from living ecosystems. Reward: {'xp': 450, 'currency': 160, 'skill_points': 1, 'items': ['living_totem']}.

### Gloamstalker — a boundary scout tracking beasts created by lost memories
Trainer: Kessa Vale. Starting skill: **Bonearrow**. Class resource: **Focus**.

- **CLS-GLOAMSTALKER-01: The Silent Quarry** (L3): Practice Bonearrow against 5 training shades. The Gloamstalker learns the responsibility of a boundary scout tracking beasts created by lost memories. Reward: {'xp': 250, 'currency': 0, 'skill_points': 0, 'items': []}.
- **CLS-GLOAMSTALKER-02: Tracks in Nothing** (L5): Use Smoke Veil to survive the vow arena. The Gloamstalker learns the responsibility of a boundary scout tracking beasts created by lost memories. Reward: {'xp': 350, 'currency': 80, 'skill_points': 0, 'items': []}.
- **CLS-GLOAMSTALKER-03: One Shot, One Name** (L7): Win Whisperbow by completing the Mark the Absent trial. The Gloamstalker learns the responsibility of a boundary scout tracking beasts created by lost memories. Reward: {'xp': 450, 'currency': 160, 'skill_points': 1, 'items': ['whisperbow']}.

## Twenty-four class × ancestry bridge routes

Each encounter uses a unique tutorial placement and reward; this is a real personal quest, not merely different menu text.

- **BR-CINDERKIN-BLADEWRAITH — Cinderkin / Bladewraith: The Unpaid Witness** (Ashwake Moor): Use Griefstep beside the Ashwake Moor ancestral marker to expose a suppressed memory, then protect Els of the North Lane from a summoned mirror echo. NPC line: "Your ancestral edge hears the story our people could not keep. Be the witness we were denied." Reward: `cinderkin_bladewraith_sigil`.
- **BR-CINDERKIN-SOULWEAVER — Cinderkin / Soulweaver: The Unpaid Witness** (Ashwake Moor): Use Warding Chorus beside the Ashwake Moor ancestral marker to expose a suppressed memory, then protect Els of the North Lane from a summoned mirror echo. NPC line: "Your resonant spindle hears the story our people could not keep. Be the witness we were denied." Reward: `cinderkin_soulweaver_sigil`.
- **BR-CINDERKIN-HELLWARDEN — Cinderkin / Hellwarden: The Unpaid Witness** (Ashwake Moor): Use Ember Bastion beside the Ashwake Moor ancestral marker to expose a suppressed memory, then protect Els of the North Lane from a summoned mirror echo. NPC line: "Your oathshield hears the story our people could not keep. Be the witness we were denied." Reward: `cinderkin_hellwarden_sigil`.
- **BR-CINDERKIN-SHADOWMANCER — Cinderkin / Shadowmancer: The Unpaid Witness** (Ashwake Moor): Use Mirror Snare beside the Ashwake Moor ancestral marker to expose a suppressed memory, then protect Els of the North Lane from a summoned mirror echo. NPC line: "Your blackglass prism hears the story our people could not keep. Be the witness we were denied." Reward: `cinderkin_shadowmancer_sigil`.
- **BR-CINDERKIN-PRIMALIST — Cinderkin / Primalist: The Unpaid Witness** (Ashwake Moor): Use Thornskin beside the Ashwake Moor ancestral marker to expose a suppressed memory, then protect Els of the North Lane from a summoned mirror echo. NPC line: "Your living totem hears the story our people could not keep. Be the witness we were denied." Reward: `cinderkin_primalist_sigil`.
- **BR-CINDERKIN-GLOAMSTALKER — Cinderkin / Gloamstalker: The Unpaid Witness** (Ashwake Moor): Use Mark the Absent beside the Ashwake Moor ancestral marker to expose a suppressed memory, then protect Els of the North Lane from a summoned mirror echo. NPC line: "Your whisperbow hears the story our people could not keep. Be the witness we were denied." Reward: `cinderkin_gloamstalker_sigil`.
- **BR-FENBORN-BLADEWRAITH — Fenborn / Bladewraith: The Unpaid Witness** (Gloamfen Reach): Use Griefstep beside the Gloamfen Reach ancestral marker to expose a suppressed memory, then protect Reeve Ossa from a summoned mirror echo. NPC line: "Your ancestral edge hears the story our people could not keep. Be the witness we were denied." Reward: `fenborn_bladewraith_sigil`.
- **BR-FENBORN-SOULWEAVER — Fenborn / Soulweaver: The Unpaid Witness** (Gloamfen Reach): Use Warding Chorus beside the Gloamfen Reach ancestral marker to expose a suppressed memory, then protect Reeve Ossa from a summoned mirror echo. NPC line: "Your resonant spindle hears the story our people could not keep. Be the witness we were denied." Reward: `fenborn_soulweaver_sigil`.
- **BR-FENBORN-HELLWARDEN — Fenborn / Hellwarden: The Unpaid Witness** (Gloamfen Reach): Use Ember Bastion beside the Gloamfen Reach ancestral marker to expose a suppressed memory, then protect Reeve Ossa from a summoned mirror echo. NPC line: "Your oathshield hears the story our people could not keep. Be the witness we were denied." Reward: `fenborn_hellwarden_sigil`.
- **BR-FENBORN-SHADOWMANCER — Fenborn / Shadowmancer: The Unpaid Witness** (Gloamfen Reach): Use Mirror Snare beside the Gloamfen Reach ancestral marker to expose a suppressed memory, then protect Reeve Ossa from a summoned mirror echo. NPC line: "Your blackglass prism hears the story our people could not keep. Be the witness we were denied." Reward: `fenborn_shadowmancer_sigil`.
- **BR-FENBORN-PRIMALIST — Fenborn / Primalist: The Unpaid Witness** (Gloamfen Reach): Use Thornskin beside the Gloamfen Reach ancestral marker to expose a suppressed memory, then protect Reeve Ossa from a summoned mirror echo. NPC line: "Your living totem hears the story our people could not keep. Be the witness we were denied." Reward: `fenborn_primalist_sigil`.
- **BR-FENBORN-GLOAMSTALKER — Fenborn / Gloamstalker: The Unpaid Witness** (Gloamfen Reach): Use Mark the Absent beside the Gloamfen Reach ancestral marker to expose a suppressed memory, then protect Reeve Ossa from a summoned mirror echo. NPC line: "Your whisperbow hears the story our people could not keep. Be the witness we were denied." Reward: `fenborn_gloamstalker_sigil`.
- **BR-STONEBOUND-BLADEWRAITH — Stonebound / Bladewraith: The Unpaid Witness** (Underhollow Steps): Use Griefstep beside the Underhollow Steps ancestral marker to expose a suppressed memory, then protect Elder Marr from a summoned mirror echo. NPC line: "Your ancestral edge hears the story our people could not keep. Be the witness we were denied." Reward: `stonebound_bladewraith_sigil`.
- **BR-STONEBOUND-SOULWEAVER — Stonebound / Soulweaver: The Unpaid Witness** (Underhollow Steps): Use Warding Chorus beside the Underhollow Steps ancestral marker to expose a suppressed memory, then protect Elder Marr from a summoned mirror echo. NPC line: "Your resonant spindle hears the story our people could not keep. Be the witness we were denied." Reward: `stonebound_soulweaver_sigil`.
- **BR-STONEBOUND-HELLWARDEN — Stonebound / Hellwarden: The Unpaid Witness** (Underhollow Steps): Use Ember Bastion beside the Underhollow Steps ancestral marker to expose a suppressed memory, then protect Elder Marr from a summoned mirror echo. NPC line: "Your oathshield hears the story our people could not keep. Be the witness we were denied." Reward: `stonebound_hellwarden_sigil`.
- **BR-STONEBOUND-SHADOWMANCER — Stonebound / Shadowmancer: The Unpaid Witness** (Underhollow Steps): Use Mirror Snare beside the Underhollow Steps ancestral marker to expose a suppressed memory, then protect Elder Marr from a summoned mirror echo. NPC line: "Your blackglass prism hears the story our people could not keep. Be the witness we were denied." Reward: `stonebound_shadowmancer_sigil`.
- **BR-STONEBOUND-PRIMALIST — Stonebound / Primalist: The Unpaid Witness** (Underhollow Steps): Use Thornskin beside the Underhollow Steps ancestral marker to expose a suppressed memory, then protect Elder Marr from a summoned mirror echo. NPC line: "Your living totem hears the story our people could not keep. Be the witness we were denied." Reward: `stonebound_primalist_sigil`.
- **BR-STONEBOUND-GLOAMSTALKER — Stonebound / Gloamstalker: The Unpaid Witness** (Underhollow Steps): Use Mark the Absent beside the Underhollow Steps ancestral marker to expose a suppressed memory, then protect Elder Marr from a summoned mirror echo. NPC line: "Your whisperbow hears the story our people could not keep. Be the witness we were denied." Reward: `stonebound_gloamstalker_sigil`.
- **BR-SKYFORGED-BLADEWRAITH — Skyforged / Bladewraith: The Unpaid Witness** (Gale Spires): Use Griefstep beside the Gale Spires ancestral marker to expose a suppressed memory, then protect Chanter Senn from a summoned mirror echo. NPC line: "Your ancestral edge hears the story our people could not keep. Be the witness we were denied." Reward: `skyforged_bladewraith_sigil`.
- **BR-SKYFORGED-SOULWEAVER — Skyforged / Soulweaver: The Unpaid Witness** (Gale Spires): Use Warding Chorus beside the Gale Spires ancestral marker to expose a suppressed memory, then protect Chanter Senn from a summoned mirror echo. NPC line: "Your resonant spindle hears the story our people could not keep. Be the witness we were denied." Reward: `skyforged_soulweaver_sigil`.
- **BR-SKYFORGED-HELLWARDEN — Skyforged / Hellwarden: The Unpaid Witness** (Gale Spires): Use Ember Bastion beside the Gale Spires ancestral marker to expose a suppressed memory, then protect Chanter Senn from a summoned mirror echo. NPC line: "Your oathshield hears the story our people could not keep. Be the witness we were denied." Reward: `skyforged_hellwarden_sigil`.
- **BR-SKYFORGED-SHADOWMANCER — Skyforged / Shadowmancer: The Unpaid Witness** (Gale Spires): Use Mirror Snare beside the Gale Spires ancestral marker to expose a suppressed memory, then protect Chanter Senn from a summoned mirror echo. NPC line: "Your blackglass prism hears the story our people could not keep. Be the witness we were denied." Reward: `skyforged_shadowmancer_sigil`.
- **BR-SKYFORGED-PRIMALIST — Skyforged / Primalist: The Unpaid Witness** (Gale Spires): Use Thornskin beside the Gale Spires ancestral marker to expose a suppressed memory, then protect Chanter Senn from a summoned mirror echo. NPC line: "Your living totem hears the story our people could not keep. Be the witness we were denied." Reward: `skyforged_primalist_sigil`.
- **BR-SKYFORGED-GLOAMSTALKER — Skyforged / Gloamstalker: The Unpaid Witness** (Gale Spires): Use Mark the Absent beside the Gale Spires ancestral marker to expose a suppressed memory, then protect Chanter Senn from a summoned mirror echo. NPC line: "Your whisperbow hears the story our people could not keep. Be the witness we were denied." Reward: `skyforged_gloamstalker_sigil`.

# ACT 1 — THE FIRST BELL

## Z01 Broken Lantern Road | levels 6–10
**Entry hub:** The Wayside Fire; **lead:** Maelin Sore; **dungeon:** The Candle Procession; **act boss/guardian:** Bailiff of the Dripping Gate.

### Pilgrims in White [Z01-MAIN-01] — main
- **Level / prerequisites:** 6 / origin_complete, class_trial_complete.
- **Quest objective:** Investigate the moving wax pilgrims at milepost three. (target: 3 pilgrim marks).
- **Narrative beat:** Maelin finds an honest road erased from every map.
- **NPC offer:** "Maelin finds an honest road erased from every map. We need you to investigate the moving wax pilgrims at milepost three."
- **Completion:** server-validated objective and claim at NPC/scene. Co-op rule: individual credit; shared combat, owner-authoritative progress.
- **Reward / flags:** {"xp": 670, "currency": 150, "items": [], "waypoint": null}; [].

### The Toll of Remembrance [Z01-MAIN-02] — main
- **Level / prerequisites:** 7 / Z01-MAIN-01.
- **Quest objective:** Recover five wax-sealed petitions at the abandoned tollhouse. (target: 5 sealed petitions).
- **Narrative beat:** The petitions ask to surrender more memory than the lawful Tithe.
- **NPC offer:** "The petitions ask to surrender more memory than the lawful Tithe. We need you to recover five wax-sealed petitions at the abandoned tollhouse."
- **Completion:** server-validated objective and claim at NPC/scene. Co-op rule: individual credit; shared combat, owner-authoritative progress.
- **Reward / flags:** {"xp": 770, "currency": 172, "items": [], "waypoint": null}; [].

### The Last Family Lamp [Z01-MAIN-03] — main
- **Level / prerequisites:** 8 / Z01-MAIN-02.
- **Quest objective:** Escort the lampkeeper Ada through the collapsed mile bridge. (target: protect Ada).
- **Narrative beat:** A survivor remembers her sister only while her lamp burns.
- **NPC offer:** "A survivor remembers her sister only while her lamp burns. We need you to escort the lampkeeper ada through the collapsed mile bridge."
- **Completion:** server-validated objective and claim at NPC/scene. Co-op rule: individual credit; shared combat, owner-authoritative progress.
- **Reward / flags:** {"xp": 870, "currency": 194, "items": [], "waypoint": null}; [].

### Ash Below the Cobblestones [Z01-MAIN-04] — main
- **Level / prerequisites:** 8 / Z01-MAIN-03.
- **Quest objective:** Reveal the buried waystone with the Bearer’s true-name echo. (target: activate 3 waystone pins).
- **Narrative beat:** The road was deliberately redirected toward the Abbey.
- **NPC offer:** "The road was deliberately redirected toward the Abbey. We need you to reveal the buried waystone with the bearer’s true-name echo."
- **Completion:** server-validated objective and claim at NPC/scene. Co-op rule: individual credit; shared combat, owner-authoritative progress.
- **Reward / flags:** {"xp": 970, "currency": 216, "items": [], "waypoint": null}; [].

### The Dripping Gate [Z01-MAIN-05] — main
- **Level / prerequisites:** 9 / Z01-MAIN-04.
- **Quest objective:** Defeat the Bailiff and extinguish his tax-fire. (target: Bailiff of the Dripping Gate).
- **Narrative beat:** The Bailiff demands a memory for every attack the hero makes.
- **NPC offer:** "The Bailiff demands a memory for every attack the hero makes. We need you to defeat the bailiff and extinguish his tax-fire."
- **Completion:** server-validated objective and claim at NPC/scene. Co-op rule: individual credit; shared combat, owner-authoritative progress.
- **Reward / flags:** {"xp": 1070, "currency": 238, "items": ["z01_boss_relic"], "waypoint": null}; ['z01_boss_down'].

### Beyond the Mile of Bells [Z01-MAIN-06] — main
- **Level / prerequisites:** 10 / Z01-MAIN-05.
- **Quest objective:** Open the Abbey approach and register the first waypoint. (target: Abbey approach).
- **Narrative beat:** A bell pulls the party east, beginning the first act’s main mystery.
- **NPC offer:** "A bell pulls the party east, beginning the first act’s main mystery. We need you to open the abbey approach and register the first waypoint."
- **Completion:** server-validated objective and claim at NPC/scene. Co-op rule: individual credit; shared combat, owner-authoritative progress.
- **Reward / flags:** {"xp": 1170, "currency": 260, "items": [], "waypoint": "Z01"}; [].

### The Lamp Without Oil [Z01-SIDE-01] — side
- **Level / prerequisites:** 7 / Z01-MAIN-01.
- **Quest objective:** Bring lampglass to a missing pilgrim’s daughter. (target: 3).
- **Narrative beat:** Character loss in a single household.
- **NPC offer:** "Character loss in a single household. We need you to bring lampglass to a missing pilgrim’s daughter."
- **Completion:** server-validated objective and claim at NPC/scene. Co-op rule: individual credit; shared combat, owner-authoritative progress.
- **Reward / flags:** {"xp": 320, "currency": 100, "reputation": 5}; [].

### Dead End Milestones [Z01-SIDE-02] — side
- **Level / prerequisites:** 8 / Z01-MAIN-01.
- **Quest objective:** Chart three false roads to correct Maelin’s map. (target: 1).
- **Narrative beat:** The road has concealed safer paths.
- **NPC offer:** "The road has concealed safer paths. We need you to chart three false roads to correct maelin’s map."
- **Completion:** server-validated objective and claim at NPC/scene. Co-op rule: individual credit; shared combat, owner-authoritative progress.
- **Reward / flags:** {"xp": 370, "currency": 130, "reputation": 5}; [].

### A Warm Place for Strangers [Z01-SIDE-03] — side
- **Level / prerequisites:** 9 / Z01-MAIN-01.
- **Quest objective:** Rebuild the roadside shelter and unlock a healer. (target: 1).
- **Narrative beat:** Small generosity resists impersonal catastrophe.
- **NPC offer:** "Small generosity resists impersonal catastrophe. We need you to rebuild the roadside shelter and unlock a healer."
- **Completion:** server-validated objective and claim at NPC/scene. Co-op rule: individual credit; shared combat, owner-authoritative progress.
- **Reward / flags:** {"xp": 420, "currency": 160, "reputation": 5}; [].

## Z02 Abbey of Ash | levels 10–14
**Entry hub:** Old Ash Cloister; **lead:** Veska Rell; **dungeon:** Waxlit Catacombs; **act boss/guardian:** Saint of Wax.

### A Robe Without an Order [Z02-MAIN-01] — main
- **Level / prerequisites:** 10 / Z01-MAIN-06.
- **Quest objective:** Rescue Veska from the waxbound novice cells. (target: Veska Rell).
- **Narrative beat:** The former Curator admits she carried illegal requests to forget.
- **NPC offer:** "The former Curator admits she carried illegal requests to forget. We need you to rescue veska from the waxbound novice cells."
- **Completion:** server-validated objective and claim at NPC/scene. Co-op rule: individual credit; shared combat, owner-authoritative progress.
- **Reward / flags:** {"xp": 670, "currency": 150, "items": [], "waypoint": null}; [].

### Petitions of Mercy [Z02-MAIN-02] — main
- **Level / prerequisites:** 11 / Z02-MAIN-01.
- **Quest objective:** Match four identities to the Abbey ledgers. (target: 4 identity seals).
- **Narrative beat:** The Saint traded relief for permanent loss of self.
- **NPC offer:** "The Saint traded relief for permanent loss of self. We need you to match four identities to the abbey ledgers."
- **Completion:** server-validated objective and claim at NPC/scene. Co-op rule: individual credit; shared combat, owner-authoritative progress.
- **Reward / flags:** {"xp": 770, "currency": 172, "items": [], "waypoint": null}; [].

### Hands of the Devout [Z02-MAIN-03] — main
- **Level / prerequisites:** 12 / Z02-MAIN-02.
- **Quest objective:** Disable the altar braziers while waves of petitioners attack. (target: 3 braziers).
- **Narrative beat:** The altar harvests memories during prayers.
- **NPC offer:** "The altar harvests memories during prayers. We need you to disable the altar braziers while waves of petitioners attack."
- **Completion:** server-validated objective and claim at NPC/scene. Co-op rule: individual credit; shared combat, owner-authoritative progress.
- **Reward / flags:** {"xp": 870, "currency": 194, "items": [], "waypoint": null}; [].

### Words Behind the Wall [Z02-MAIN-04] — main
- **Level / prerequisites:** 12 / Z02-MAIN-03.
- **Quest objective:** Read the Nine Witnesses’ confession behind the nave. (target: hidden wall inscription).
- **Narrative beat:** The Nine were mortal survivors, not divine beings.
- **NPC offer:** "The Nine were mortal survivors, not divine beings. We need you to read the nine witnesses’ confession behind the nave."
- **Completion:** server-validated objective and claim at NPC/scene. Co-op rule: individual credit; shared combat, owner-authoritative progress.
- **Reward / flags:** {"xp": 970, "currency": 216, "items": [], "waypoint": null}; [].

### The First Oath [Z02-MAIN-05] — main
- **Level / prerequisites:** 13 / Z02-MAIN-04.
- **Quest objective:** Defeat Saint of Wax and break the Ash Oath. (target: Saint of Wax).
- **Narrative beat:** The Oath’s release awakens another across the Saltwound.
- **NPC offer:** "The Oath’s release awakens another across the Saltwound. We need you to defeat saint of wax and break the ash oath."
- **Completion:** server-validated objective and claim at NPC/scene. Co-op rule: individual credit; shared combat, owner-authoritative progress.
- **Reward / flags:** {"xp": 1070, "currency": 238, "items": ["ash_oath_first"], "waypoint": null}; ['z02_boss_down', 'act_1_complete'].

### The Road That Turns to Salt [Z02-MAIN-06] — main
- **Level / prerequisites:** 14 / Z02-MAIN-05.
- **Quest objective:** Report to Maelin and depart for the coast. (target: Saltwound gate).
- **Narrative beat:** The old route now points toward a vanished sea.
- **NPC offer:** "The old route now points toward a vanished sea. We need you to report to maelin and depart for the coast."
- **Completion:** server-validated objective and claim at NPC/scene. Co-op rule: individual credit; shared combat, owner-authoritative progress.
- **Reward / flags:** {"xp": 1170, "currency": 260, "items": [], "waypoint": "Z02"}; [].

### A Choir of Small Voices [Z02-SIDE-01] — side
- **Level / prerequisites:** 11 / Z02-MAIN-01.
- **Quest objective:** Recover children’s prayer names from the lower nave. (target: 3).
- **Narrative beat:** The Abbey silenced even harmless songs.
- **NPC offer:** "The Abbey silenced even harmless songs. We need you to recover children’s prayer names from the lower nave."
- **Completion:** server-validated objective and claim at NPC/scene. Co-op rule: individual credit; shared combat, owner-authoritative progress.
- **Reward / flags:** {"xp": 320, "currency": 100, "reputation": 5}; [].

### Wax and Witness [Z02-SIDE-02] — side
- **Level / prerequisites:** 12 / Z02-MAIN-01.
- **Quest objective:** Identify a petitioner who asked to forget a theft. (target: 1).
- **Narrative beat:** Removing guilt does not remove harm.
- **NPC offer:** "Removing guilt does not remove harm. We need you to identify a petitioner who asked to forget a theft."
- **Completion:** server-validated objective and claim at NPC/scene. Co-op rule: individual credit; shared combat, owner-authoritative progress.
- **Reward / flags:** {"xp": 370, "currency": 130, "reputation": 5}; [].

### The Lost Bell Rope [Z02-SIDE-03] — side
- **Level / prerequisites:** 13 / Z02-MAIN-01.
- **Quest objective:** Repair a ceremonial bell to open a hidden crypt. (target: 1).
- **Narrative beat:** Sacred objects become tools again.
- **NPC offer:** "Sacred objects become tools again. We need you to repair a ceremonial bell to open a hidden crypt."
- **Completion:** server-validated objective and claim at NPC/scene. Co-op rule: individual credit; shared combat, owner-authoritative progress.
- **Reward / flags:** {"xp": 420, "currency": 160, "reputation": 5}; [].


# ACT 2 — SALT WITHOUT SEA

## Z03 Saltwound Strand | levels 14–18
**Entry hub:** Cliffhaven; **lead:** Captain Rusk; **dungeon:** Shipwreck Causeway; **act boss/guardian:** Mirror Captain.

### The Sea Has Returned [Z03-MAIN-01] — main
- **Level / prerequisites:** 14 / Z02-MAIN-06.
- **Quest objective:** Examine floodlines in buildings with no water nearby. (target: 5 salt lines).
- **Narrative beat:** Rusk denies that the drowned can cross dry land.
- **NPC offer:** "Rusk denies that the drowned can cross dry land. We need you to examine floodlines in buildings with no water nearby."
- **Completion:** server-validated objective and claim at NPC/scene. Co-op rule: individual credit; shared combat, owner-authoritative progress.
- **Reward / flags:** {"xp": 990, "currency": 235, "items": [], "waypoint": null}; [].

### The Ledger of Sinking [Z03-MAIN-02] — main
- **Level / prerequisites:** 15 / Z03-MAIN-01.
- **Quest objective:** Recover passenger records from stranded hulls. (target: 3 ship logs).
- **Narrative beat:** Names erased after a preventable disaster return.
- **NPC offer:** "Names erased after a preventable disaster return. We need you to recover passenger records from stranded hulls."
- **Completion:** server-validated objective and claim at NPC/scene. Co-op rule: individual credit; shared combat, owner-authoritative progress.
- **Reward / flags:** {"xp": 1090, "currency": 257, "items": [], "waypoint": null}; [].

### A Bucket of Ocean [Z03-MAIN-03] — main
- **Level / prerequisites:** 16 / Z03-MAIN-02.
- **Quest objective:** Defend citizens while collecting safe brine from old wells. (target: 4 brine wells).
- **Narrative beat:** Ordinary saltwater appears from nowhere and remembers the sea.
- **NPC offer:** "Ordinary saltwater appears from nowhere and remembers the sea. We need you to defend citizens while collecting safe brine from old wells."
- **Completion:** server-validated objective and claim at NPC/scene. Co-op rule: individual credit; shared combat, owner-authoritative progress.
- **Reward / flags:** {"xp": 1190, "currency": 279, "items": [], "waypoint": null}; [].

### Captain of No Fleet [Z03-MAIN-04] — main
- **Level / prerequisites:** 16 / Z03-MAIN-03.
- **Quest objective:** Face Rusk and convince him to unlock the lighthouse route. (target: Rusk confession).
- **Narrative beat:** The harbor master chooses to tell the truth about his past.
- **NPC offer:** "The harbor master chooses to tell the truth about his past. We need you to face rusk and convince him to unlock the lighthouse route."
- **Completion:** server-validated objective and claim at NPC/scene. Co-op rule: individual credit; shared combat, owner-authoritative progress.
- **Reward / flags:** {"xp": 1290, "currency": 301, "items": [], "waypoint": null}; [].

### Reflections on Salt [Z03-MAIN-05] — main
- **Level / prerequisites:** 17 / Z03-MAIN-04.
- **Quest objective:** Defeat the Mirror Captain in the dried harbor. (target: Mirror Captain).
- **Narrative beat:** Reflections attack out of sync with living combatants.
- **NPC offer:** "Reflections attack out of sync with living combatants. We need you to defeat the mirror captain in the dried harbor."
- **Completion:** server-validated objective and claim at NPC/scene. Co-op rule: individual credit; shared combat, owner-authoritative progress.
- **Reward / flags:** {"xp": 1390, "currency": 323, "items": ["z03_boss_relic"], "waypoint": null}; ['z03_boss_down'].

### The Below-Harbor Stair [Z03-MAIN-06] — main
- **Level / prerequisites:** 18 / Z03-MAIN-05.
- **Quest objective:** Descend under the lighthouse to the Salt Crypts. (target: salt stair).
- **Narrative beat:** The second Oath is hidden inside a tidal machine.
- **NPC offer:** "The second Oath is hidden inside a tidal machine. We need you to descend under the lighthouse to the salt crypts."
- **Completion:** server-validated objective and claim at NPC/scene. Co-op rule: individual credit; shared combat, owner-authoritative progress.
- **Reward / flags:** {"xp": 1490, "currency": 345, "items": [], "waypoint": "Z03"}; [].

### Every Ship a Grave [Z03-SIDE-01] — side
- **Level / prerequisites:** 15 / Z03-MAIN-01.
- **Quest objective:** Place floating markers for three erased vessels. (target: 3).
- **Narrative beat:** History gives the dead a shoreline.
- **NPC offer:** "History gives the dead a shoreline. We need you to place floating markers for three erased vessels."
- **Completion:** server-validated objective and claim at NPC/scene. Co-op rule: individual credit; shared combat, owner-authoritative progress.
- **Reward / flags:** {"xp": 420, "currency": 100, "reputation": 5}; [].

### The Captain’s Last Log [Z03-SIDE-02] — side
- **Level / prerequisites:** 16 / Z03-MAIN-01.
- **Quest objective:** Compare Rusk’s testimony to a hidden log. (target: 1).
- **Narrative beat:** Accountability becomes public.
- **NPC offer:** "Accountability becomes public. We need you to compare rusk’s testimony to a hidden log."
- **Completion:** server-validated objective and claim at NPC/scene. Co-op rule: individual credit; shared combat, owner-authoritative progress.
- **Reward / flags:** {"xp": 470, "currency": 130, "reputation": 5}; [].

### Salt for Tomorrow [Z03-SIDE-03] — side
- **Level / prerequisites:** 17 / Z03-MAIN-01.
- **Quest objective:** Help miners harvest safe salt without cursed mirrors. (target: 1).
- **Narrative beat:** A local livelihood survives.
- **NPC offer:** "A local livelihood survives. We need you to help miners harvest safe salt without cursed mirrors."
- **Completion:** server-validated objective and claim at NPC/scene. Co-op rule: individual credit; shared combat, owner-authoritative progress.
- **Reward / flags:** {"xp": 520, "currency": 160, "reputation": 5}; [].

## Z04 Dry Harbor & Salt Crypts | levels 18–23
**Entry hub:** Undertide Refuge; **lead:** Nera Vale; **dungeon:** Cistern of Regret; **act boss/guardian:** Lord Kareth.

### The Inward Compass [Z04-MAIN-01] — main
- **Level / prerequisites:** 18 / Z03-MAIN-06.
- **Quest objective:** Receive Nera’s compass and follow its wounded bearing. (target: wound compass).
- **Narrative beat:** Nera questions her father’s attempt to end suffering.
- **NPC offer:** "Nera questions her father’s attempt to end suffering. We need you to receive nera’s compass and follow its wounded bearing."
- **Completion:** server-validated objective and claim at NPC/scene. Co-op rule: individual credit; shared combat, owner-authoritative progress.
- **Reward / flags:** {"xp": 990, "currency": 235, "items": [], "waypoint": null}; [].

### Four Valves, One Tide [Z04-MAIN-02] — main
- **Level / prerequisites:** 19 / Z04-MAIN-01.
- **Quest objective:** Reopen the four cistern sluices in a safe sequence. (target: 4 sluices).
- **Narrative beat:** Water and memories have been stored beneath the town.
- **NPC offer:** "Water and memories have been stored beneath the town. We need you to reopen the four cistern sluices in a safe sequence."
- **Completion:** server-validated objective and claim at NPC/scene. Co-op rule: individual credit; shared combat, owner-authoritative progress.
- **Reward / flags:** {"xp": 1090, "currency": 257, "items": [], "waypoint": null}; [].

### The Names in the Hull [Z04-MAIN-03] — main
- **Level / prerequisites:** 20 / Z04-MAIN-02.
- **Quest objective:** Free trapped drowned memories by identifying their families. (target: 6 name-plates).
- **Narrative beat:** Each name breaks a tether without destroying the memory.
- **NPC offer:** "Each name breaks a tether without destroying the memory. We need you to free trapped drowned memories by identifying their families."
- **Completion:** server-validated objective and claim at NPC/scene. Co-op rule: individual credit; shared combat, owner-authoritative progress.
- **Reward / flags:** {"xp": 1190, "currency": 279, "items": [], "waypoint": null}; [].

### Harpoon of Regret [Z04-MAIN-04] — main
- **Level / prerequisites:** 21 / Z04-MAIN-03.
- **Quest objective:** Disarm Kareth’s binding anchors inside the cistern. (target: 3 harpoon anchors).
- **Narrative beat:** Kareth weaponizes remorse to immobilize his enemies.
- **NPC offer:** "Kareth weaponizes remorse to immobilize his enemies. We need you to disarm kareth’s binding anchors inside the cistern."
- **Completion:** server-validated objective and claim at NPC/scene. Co-op rule: individual credit; shared combat, owner-authoritative progress.
- **Reward / flags:** {"xp": 1290, "currency": 301, "items": [], "waypoint": null}; [].

### A Kingdom of Regret [Z04-MAIN-05] — main
- **Level / prerequisites:** 22 / Z04-MAIN-04.
- **Quest objective:** Defeat Kareth and recover the second Oath. (target: Lord Kareth).
- **Narrative beat:** The tide retreats but accountability remains.
- **NPC offer:** "The tide retreats but accountability remains. We need you to defeat kareth and recover the second oath."
- **Completion:** server-validated objective and claim at NPC/scene. Co-op rule: individual credit; shared combat, owner-authoritative progress.
- **Reward / flags:** {"xp": 1390, "currency": 323, "items": ["ash_oath_second"], "waypoint": null}; ['z04_boss_down', 'act_2_complete'].

### Bitter Shore, Green Road [Z04-MAIN-06] — main
- **Level / prerequisites:** 23 / Z04-MAIN-05.
- **Quest objective:** Use Maelin’s altered map to find the forest route. (target: Thornvein pass).
- **Narrative beat:** A living map reveals a kingdom buried under trees.
- **NPC offer:** "A living map reveals a kingdom buried under trees. We need you to use maelin’s altered map to find the forest route."
- **Completion:** server-validated objective and claim at NPC/scene. Co-op rule: individual credit; shared combat, owner-authoritative progress.
- **Reward / flags:** {"xp": 1490, "currency": 345, "items": [], "waypoint": "Z04"}; [].

### Tidebound Letters [Z04-SIDE-01] — side
- **Level / prerequisites:** 19 / Z04-MAIN-01.
- **Quest objective:** Retrieve four letters in flooded valve rooms. (target: 3).
- **Narrative beat:** Families deserve their words back.
- **NPC offer:** "Families deserve their words back. We need you to retrieve four letters in flooded valve rooms."
- **Completion:** server-validated objective and claim at NPC/scene. Co-op rule: individual credit; shared combat, owner-authoritative progress.
- **Reward / flags:** {"xp": 420, "currency": 100, "reputation": 5}; [].

### A Question for Nera [Z04-SIDE-02] — side
- **Level / prerequisites:** 20 / Z04-MAIN-01.
- **Quest objective:** Deliver a refusal of the Curator’s proposed bargain. (target: 1).
- **Narrative beat:** Dissent can be familial.
- **NPC offer:** "Dissent can be familial. We need you to deliver a refusal of the curator’s proposed bargain."
- **Completion:** server-validated objective and claim at NPC/scene. Co-op rule: individual credit; shared combat, owner-authoritative progress.
- **Reward / flags:** {"xp": 470, "currency": 130, "reputation": 5}; [].

### What the Wells Remember [Z04-SIDE-03] — side
- **Level / prerequisites:** 21 / Z04-MAIN-01.
- **Quest objective:** Drain a side chamber to recover a relic. (target: 1).
- **Narrative beat:** Forgotten trades shaped the harbor.
- **NPC offer:** "Forgotten trades shaped the harbor. We need you to drain a side chamber to recover a relic."
- **Completion:** server-validated objective and claim at NPC/scene. Co-op rule: individual credit; shared combat, owner-authoritative progress.
- **Reward / flags:** {"xp": 520, "currency": 160, "reputation": 5}; [].


# ACT 3 — ROOTS BENEATH SKIN

## Z05 Thornvein Fringe | levels 23–27
**Entry hub:** Reedwatch Camp; **lead:** Iro Fen; **dungeon:** The Letter Grove; **act boss/guardian:** Griefwood Hart.

### A Letter Never Sent [Z05-MAIN-01] — main
- **Level / prerequisites:** 23 / Z04-MAIN-06.
- **Quest objective:** Read a note trapped inside the oldest tree. (target: first letter).
- **Narrative beat:** The forest has fed on unspoken regret for centuries.
- **NPC offer:** "The forest has fed on unspoken regret for centuries. We need you to read a note trapped inside the oldest tree."
- **Completion:** server-validated objective and claim at NPC/scene. Co-op rule: individual credit; shared combat, owner-authoritative progress.
- **Reward / flags:** {"xp": 1310, "currency": 320, "items": [], "waypoint": null}; [].

### Names in Bark [Z05-MAIN-02] — main
- **Level / prerequisites:** 24 / Z05-MAIN-01.
- **Quest objective:** Return four children’s names to their families. (target: 4 bark names).
- **Narrative beat:** Children carve names to resist the nightly swaps.
- **NPC offer:** "Children carve names to resist the nightly swaps. We need you to return four children’s names to their families."
- **Completion:** server-validated objective and claim at NPC/scene. Co-op rule: individual credit; shared combat, owner-authoritative progress.
- **Reward / flags:** {"xp": 1410, "currency": 342, "items": [], "waypoint": null}; [].

### The Crooked Shortcut [Z05-MAIN-03] — main
- **Level / prerequisites:** 25 / Z05-MAIN-02.
- **Quest objective:** Unlock the bridge hidden under root walls. (target: living bridge).
- **Narrative beat:** A shortcut reduces backtracking and shows the forest is listening.
- **NPC offer:** "A shortcut reduces backtracking and shows the forest is listening. We need you to unlock the bridge hidden under root walls."
- **Completion:** server-validated objective and claim at NPC/scene. Co-op rule: individual credit; shared combat, owner-authoritative progress.
- **Reward / flags:** {"xp": 1510, "currency": 364, "items": [], "waypoint": null}; [].

### Borrowed Childhood [Z05-MAIN-04] — main
- **Level / prerequisites:** 25 / Z05-MAIN-03.
- **Quest objective:** Separate a possessed parent from a child’s false memory. (target: possessed parent).
- **Narrative beat:** A false remembrance is emotionally convincing but destructive.
- **NPC offer:** "A false remembrance is emotionally convincing but destructive. We need you to separate a possessed parent from a child’s false memory."
- **Completion:** server-validated objective and claim at NPC/scene. Co-op rule: individual credit; shared combat, owner-authoritative progress.
- **Reward / flags:** {"xp": 1610, "currency": 386, "items": [], "waypoint": null}; [].

### The Antlered Apology [Z05-MAIN-05] — main
- **Level / prerequisites:** 26 / Z05-MAIN-04.
- **Quest objective:** Defeat Griefwood Hart at the oldest stone circle. (target: Griefwood Hart).
- **Narrative beat:** The forest’s guardian strikes at those who deny their past.
- **NPC offer:** "The forest’s guardian strikes at those who deny their past. We need you to defeat griefwood hart at the oldest stone circle."
- **Completion:** server-validated objective and claim at NPC/scene. Co-op rule: individual credit; shared combat, owner-authoritative progress.
- **Reward / flags:** {"xp": 1710, "currency": 408, "items": ["z05_boss_relic"], "waypoint": null}; ['z05_boss_down'].

### Through the Roots [Z05-MAIN-06] — main
- **Level / prerequisites:** 27 / Z05-MAIN-05.
- **Quest objective:** Find the undercanopy route to Root Cathedral. (target: under-root descent).
- **Narrative beat:** The third Oath is tended by a surviving Witness.
- **NPC offer:** "The third Oath is tended by a surviving Witness. We need you to find the undercanopy route to root cathedral."
- **Completion:** server-validated objective and claim at NPC/scene. Co-op rule: individual credit; shared combat, owner-authoritative progress.
- **Reward / flags:** {"xp": 1810, "currency": 430, "items": [], "waypoint": "Z05"}; [].

### The Apology Tree [Z05-SIDE-01] — side
- **Level / prerequisites:** 24 / Z05-MAIN-01.
- **Quest objective:** Reconcile two villagers without erasing either memory. (target: 3).
- **Narrative beat:** Regret can invite repair.
- **NPC offer:** "Regret can invite repair. We need you to reconcile two villagers without erasing either memory."
- **Completion:** server-validated objective and claim at NPC/scene. Co-op rule: individual credit; shared combat, owner-authoritative progress.
- **Reward / flags:** {"xp": 520, "currency": 100, "reputation": 5}; [].

### Three Paths, One Grove [Z05-SIDE-02] — side
- **Level / prerequisites:** 25 / Z05-MAIN-01.
- **Quest objective:** Open a permanent fast-travel shortcut. (target: 1).
- **Narrative beat:** The land learns new honest paths.
- **NPC offer:** "The land learns new honest paths. We need you to open a permanent fast-travel shortcut."
- **Completion:** server-validated objective and claim at NPC/scene. Co-op rule: individual credit; shared combat, owner-authoritative progress.
- **Reward / flags:** {"xp": 570, "currency": 130, "reputation": 5}; [].

### Names Before Nightfall [Z05-SIDE-03] — side
- **Level / prerequisites:** 26 / Z05-MAIN-01.
- **Quest objective:** Protect 5 children until dawn. (target: 1).
- **Narrative beat:** History should remain in human voices.
- **NPC offer:** "History should remain in human voices. We need you to protect 5 children until dawn."
- **Completion:** server-validated objective and claim at NPC/scene. Co-op rule: individual credit; shared combat, owner-authoritative progress.
- **Reward / flags:** {"xp": 620, "currency": 160, "reputation": 5}; [].

## Z06 Root Cathedral | levels 27–32
**Entry hub:** Heartwood Shelter; **lead:** Mother Sile; **dungeon:** The Root Heart; **act boss/guardian:** The Hundred-Faced Bloom.

### The Keeper Who Remained [Z06-MAIN-01] — main
- **Level / prerequisites:** 27 / Z05-MAIN-06.
- **Quest objective:** Speak to Mother Sile about the ancient Veil. (target: Mother Sile).
- **Narrative beat:** The Witness tells a story the Archive suppressed.
- **NPC offer:** "The Witness tells a story the Archive suppressed. We need you to speak to mother sile about the ancient veil."
- **Completion:** server-validated objective and claim at NPC/scene. Co-op rule: individual credit; shared combat, owner-authoritative progress.
- **Reward / flags:** {"xp": 1310, "currency": 320, "items": [], "waypoint": null}; [].

### The First Tithe [Z06-MAIN-02] — main
- **Level / prerequisites:** 28 / Z06-MAIN-01.
- **Quest objective:** Experience three playable visions of the original catastrophe. (target: 3 memory scenes).
- **Narrative beat:** The Nine chose coercive forgetting as an emergency defense.
- **NPC offer:** "The Nine chose coercive forgetting as an emergency defense. We need you to experience three playable visions of the original catastrophe."
- **Completion:** server-validated objective and claim at NPC/scene. Co-op rule: individual credit; shared combat, owner-authoritative progress.
- **Reward / flags:** {"xp": 1410, "currency": 342, "items": [], "waypoint": null}; [].

### The Desires of Friends [Z06-MAIN-03] — main
- **Level / prerequisites:** 29 / Z06-MAIN-02.
- **Quest objective:** Free Tarven, Maelin and Veska from wish-root bindings. (target: 3 companions).
- **Narrative beat:** Each dream embodies an intimate unresolved desire.
- **NPC offer:** "Each dream embodies an intimate unresolved desire. We need you to free tarven, maelin and veska from wish-root bindings."
- **Completion:** server-validated objective and claim at NPC/scene. Co-op rule: individual credit; shared combat, owner-authoritative progress.
- **Reward / flags:** {"xp": 1510, "currency": 364, "items": [], "waypoint": null}; [].

### A Choice Offered [Z06-MAIN-04] — main
- **Level / prerequisites:** 30 / Z06-MAIN-03.
- **Quest objective:** Refuse a false future without losing the present. (target: refuse wish bargain).
- **Narrative beat:** Personal identity is made by imperfect choices.
- **NPC offer:** "Personal identity is made by imperfect choices. We need you to refuse a false future without losing the present."
- **Completion:** server-validated objective and claim at NPC/scene. Co-op rule: individual credit; shared combat, owner-authoritative progress.
- **Reward / flags:** {"xp": 1610, "currency": 386, "items": [], "waypoint": null}; [].

### A Hundred Familiar Faces [Z06-MAIN-05] — main
- **Level / prerequisites:** 31 / Z06-MAIN-04.
- **Quest objective:** Defeat the Bloom and gain the third Oath. (target: The Hundred-Faced Bloom).
- **Narrative beat:** The remnant combines stolen gestures from dead loved ones.
- **NPC offer:** "The remnant combines stolen gestures from dead loved ones. We need you to defeat the bloom and gain the third oath."
- **Completion:** server-validated objective and claim at NPC/scene. Co-op rule: individual credit; shared combat, owner-authoritative progress.
- **Reward / flags:** {"xp": 1710, "currency": 408, "items": ["ash_oath_third"], "waypoint": null}; ['z06_boss_down', 'act_3_complete'].

### Leaves Above Marrowgate [Z06-MAIN-06] — main
- **Level / prerequisites:** 32 / Z06-MAIN-05.
- **Quest objective:** Leave the withering grove for the capital. (target: Marrowgate gate).
- **Narrative beat:** The capital has already begun to lose its streets.
- **NPC offer:** "The capital has already begun to lose its streets. We need you to leave the withering grove for the capital."
- **Completion:** server-validated objective and claim at NPC/scene. Co-op rule: individual credit; shared combat, owner-authoritative progress.
- **Reward / flags:** {"xp": 1810, "currency": 430, "items": [], "waypoint": "Z06"}; [].

### A Witness in Winter [Z06-SIDE-01] — side
- **Level / prerequisites:** 28 / Z06-MAIN-01.
- **Quest objective:** Record Mother Sile’s alternate account of the Tithe. (target: 3).
- **Narrative beat:** Truth comes from those who took part.
- **NPC offer:** "Truth comes from those who took part. We need you to record mother sile’s alternate account of the tithe."
- **Completion:** server-validated objective and claim at NPC/scene. Co-op rule: individual credit; shared combat, owner-authoritative progress.
- **Reward / flags:** {"xp": 520, "currency": 100, "reputation": 5}; [].

### Roots of the Other Life [Z06-SIDE-02] — side
- **Level / prerequisites:** 29 / Z06-MAIN-01.
- **Quest objective:** Break an optional dream-loop to free a traveler. (target: 1).
- **Narrative beat:** Fantasy is not consent.
- **NPC offer:** "Fantasy is not consent. We need you to break an optional dream-loop to free a traveler."
- **Completion:** server-validated objective and claim at NPC/scene. Co-op rule: individual credit; shared combat, owner-authoritative progress.
- **Reward / flags:** {"xp": 570, "currency": 130, "reputation": 5}; [].

### Seeds for the Living [Z06-SIDE-03] — side
- **Level / prerequisites:** 30 / Z06-MAIN-01.
- **Quest objective:** Restore herb beds for the shelter. (target: 1).
- **Narrative beat:** The forest remains a home, not only a boss map.
- **NPC offer:** "The forest remains a home, not only a boss map. We need you to restore herb beds for the shelter."
- **Completion:** server-validated objective and claim at NPC/scene. Co-op rule: individual credit; shared combat, owner-authoritative progress.
- **Reward / flags:** {"xp": 620, "currency": 160, "reputation": 5}; [].


# ACT 4 — CROWN OF SILENCE

## Z07 Marrowgate Lower Wards | levels 32–37
**Entry hub:** Sable Square; **lead:** Veska Rell; **dungeon:** Counting House; **act boss/guardian:** The Remittance Judge.

### One Bowl for a Memory [Z07-MAIN-01] — main
- **Level / prerequisites:** 32 / Z06-MAIN-06.
- **Quest objective:** Observe a Curator relief line trading food for names. (target: 4 stations).
- **Narrative beat:** Charity can be made into an instrument of control.
- **NPC offer:** "Charity can be made into an instrument of control. We need you to observe a curator relief line trading food for names."
- **Completion:** server-validated objective and claim at NPC/scene. Co-op rule: individual credit; shared combat, owner-authoritative progress.
- **Reward / flags:** {"xp": 1630, "currency": 405, "items": [], "waypoint": null}; [].

### Streets That Disappear [Z07-MAIN-02] — main
- **Level / prerequisites:** 33 / Z07-MAIN-01.
- **Quest objective:** Restore the clocks of three districts to reveal routes. (target: 3 clock towers).
- **Narrative beat:** City topology changes whenever its history is erased.
- **NPC offer:** "City topology changes whenever its history is erased. We need you to restore the clocks of three districts to reveal routes."
- **Completion:** server-validated objective and claim at NPC/scene. Co-op rule: individual credit; shared combat, owner-authoritative progress.
- **Reward / flags:** {"xp": 1730, "currency": 427, "items": [], "waypoint": null}; [].

### Ledger of the Missing [Z07-MAIN-03] — main
- **Level / prerequisites:** 34 / Z07-MAIN-02.
- **Quest objective:** Steal receipts from the Counting House. (target: ledger bundle).
- **Narrative beat:** The Curators track erased lives as inventory.
- **NPC offer:** "The Curators track erased lives as inventory. We need you to steal receipts from the counting house."
- **Completion:** server-validated objective and claim at NPC/scene. Co-op rule: individual credit; shared combat, owner-authoritative progress.
- **Reward / flags:** {"xp": 1830, "currency": 449, "items": [], "waypoint": null}; [].

### The Nurse and the Knife [Z07-MAIN-04] — main
- **Level / prerequisites:** 35 / Z07-MAIN-03.
- **Quest objective:** Evacuate a ward while the city guard mobilizes. (target: 12 civilians).
- **Narrative beat:** The party protects ordinary people who believe in the Archive.
- **NPC offer:** "The party protects ordinary people who believe in the Archive. We need you to evacuate a ward while the city guard mobilizes."
- **Completion:** server-validated objective and claim at NPC/scene. Co-op rule: individual credit; shared combat, owner-authoritative progress.
- **Reward / flags:** {"xp": 1930, "currency": 471, "items": [], "waypoint": null}; [].

### The Remittance Judge [Z07-MAIN-05] — main
- **Level / prerequisites:** 36 / Z07-MAIN-04.
- **Quest objective:** Defeat the Judge without harming bound witnesses. (target: The Remittance Judge).
- **Narrative beat:** The hero learns to focus damage and control adds.
- **NPC offer:** "The hero learns to focus damage and control adds. We need you to defeat the judge without harming bound witnesses."
- **Completion:** server-validated objective and claim at NPC/scene. Co-op rule: individual credit; shared combat, owner-authoritative progress.
- **Reward / flags:** {"xp": 2030, "currency": 493, "items": ["z07_boss_relic"], "waypoint": null}; ['z07_boss_down'].

### Key to the Nine Vaults [Z07-MAIN-06] — main
- **Level / prerequisites:** 37 / Z07-MAIN-05.
- **Quest objective:** Meet Nera and take the hidden archive passage. (target: vault entrance).
- **Narrative beat:** Nera reveals the Quiet Crown is nearing completion.
- **NPC offer:** "Nera reveals the Quiet Crown is nearing completion. We need you to meet nera and take the hidden archive passage."
- **Completion:** server-validated objective and claim at NPC/scene. Co-op rule: individual credit; shared combat, owner-authoritative progress.
- **Reward / flags:** {"xp": 2130, "currency": 515, "items": [], "waypoint": "Z07"}; [].

### The Soup Ledger [Z07-SIDE-01] — side
- **Level / prerequisites:** 33 / Z07-MAIN-01.
- **Quest objective:** Find evidence of memory trade in relief lines. (target: 3).
- **Narrative beat:** Aid must not require surrendering agency.
- **NPC offer:** "Aid must not require surrendering agency. We need you to find evidence of memory trade in relief lines."
- **Completion:** server-validated objective and claim at NPC/scene. Co-op rule: individual credit; shared combat, owner-authoritative progress.
- **Reward / flags:** {"xp": 620, "currency": 100, "reputation": 5}; [].

### One Clock for All [Z07-SIDE-02] — side
- **Level / prerequisites:** 34 / Z07-MAIN-01.
- **Quest objective:** Reopen a district’s mechanical timekeeping. (target: 1).
- **Narrative beat:** Public time is a public good.
- **NPC offer:** "Public time is a public good. We need you to reopen a district’s mechanical timekeeping."
- **Completion:** server-validated objective and claim at NPC/scene. Co-op rule: individual credit; shared combat, owner-authoritative progress.
- **Reward / flags:** {"xp": 670, "currency": 130, "reputation": 5}; [].

### The Missing Shop Sign [Z07-SIDE-03] — side
- **Level / prerequisites:** 35 / Z07-MAIN-01.
- **Quest objective:** Help a shopkeeper recover her family name. (target: 1).
- **Narrative beat:** Local identity survives administration.
- **NPC offer:** "Local identity survives administration. We need you to help a shopkeeper recover her family name."
- **Completion:** server-validated objective and claim at NPC/scene. Co-op rule: individual credit; shared combat, owner-authoritative progress.
- **Reward / flags:** {"xp": 720, "currency": 160, "reputation": 5}; [].

## Z08 The Nine Vaults | levels 37–41
**Entry hub:** Veska’s Refuge; **lead:** Serath Vale; **dungeon:** Hall of Remittance; **act boss/guardian:** High Curator Serath.

### The Ninth Chamber [Z08-MAIN-01] — main
- **Level / prerequisites:** 37 / Z07-MAIN-06.
- **Quest objective:** Reach the chamber by matching three Witness seals. (target: 3 Witness seals).
- **Narrative beat:** The archive’s architecture enforces selective memory.
- **NPC offer:** "The archive’s architecture enforces selective memory. We need you to reach the chamber by matching three witness seals."
- **Completion:** server-validated objective and claim at NPC/scene. Co-op rule: individual credit; shared combat, owner-authoritative progress.
- **Reward / flags:** {"xp": 1630, "currency": 405, "items": [], "waypoint": null}; [].

### Daughter of the Curator [Z08-MAIN-02] — main
- **Level / prerequisites:** 38 / Z08-MAIN-01.
- **Quest objective:** Recover the music box and free Nera. (target: Nera Vale).
- **Narrative beat:** A mother’s song persists after her words are gone.
- **NPC offer:** "A mother’s song persists after her words are gone. We need you to recover the music box and free nera."
- **Completion:** server-validated objective and claim at NPC/scene. Co-op rule: individual credit; shared combat, owner-authoritative progress.
- **Reward / flags:** {"xp": 1730, "currency": 427, "items": [], "waypoint": null}; [].

### A Wife in the Ledger [Z08-MAIN-03] — main
- **Level / prerequisites:** 39 / Z08-MAIN-02.
- **Quest objective:** Find Serath’s confession among restricted records. (target: confession).
- **Narrative beat:** His obsession begins with an experiment on his wife.
- **NPC offer:** "His obsession begins with an experiment on his wife. We need you to find serath’s confession among restricted records."
- **Completion:** server-validated objective and claim at NPC/scene. Co-op rule: individual credit; shared combat, owner-authoritative progress.
- **Reward / flags:** {"xp": 1830, "currency": 449, "items": [], "waypoint": null}; [].

### The Cost of Mercy [Z08-MAIN-04] — main
- **Level / prerequisites:** 39 / Z08-MAIN-03.
- **Quest objective:** Speak with Serath and refuse compulsory silence. (target: Serath debate).
- **Narrative beat:** His argument is compelling enough to attract followers.
- **NPC offer:** "His argument is compelling enough to attract followers. We need you to speak with serath and refuse compulsory silence."
- **Completion:** server-validated objective and claim at NPC/scene. Co-op rule: individual credit; shared combat, owner-authoritative progress.
- **Reward / flags:** {"xp": 1930, "currency": 471, "items": [], "waypoint": null}; [].

### The Broken Crown [Z08-MAIN-05] — main
- **Level / prerequisites:** 40 / Z08-MAIN-04.
- **Quest objective:** Survive Serath and the rising Choir without resolving the threat. (target: High Curator Serath).
- **Narrative beat:** The party discovers each broken Oath fed the Crown.
- **NPC offer:** "The party discovers each broken Oath fed the Crown. We need you to survive serath and the rising choir without resolving the threat."
- **Completion:** server-validated objective and claim at NPC/scene. Co-op rule: individual credit; shared combat, owner-authoritative progress.
- **Reward / flags:** {"xp": 2030, "currency": 493, "items": ["z08_boss_relic"], "waypoint": null}; ['z08_boss_down', 'act_4_complete'].

### Through the Breach [Z08-MAIN-06] — main
- **Level / prerequisites:** 41 / Z08-MAIN-05.
- **Quest objective:** Escape to the Ember Observatory with Ilyra’s lantern. (target: observatory breach).
- **Narrative beat:** The Deep Archive is beginning to overwrite Eredh.
- **NPC offer:** "The Deep Archive is beginning to overwrite Eredh. We need you to escape to the ember observatory with ilyra’s lantern."
- **Completion:** server-validated objective and claim at NPC/scene. Co-op rule: individual credit; shared combat, owner-authoritative progress.
- **Reward / flags:** {"xp": 2130, "currency": 515, "items": [], "waypoint": "Z08"}; [].

### The Archivist’s Doubt [Z08-SIDE-01] — side
- **Level / prerequisites:** 38 / Z08-MAIN-01.
- **Quest objective:** Copy records of dissenting Curators. (target: 3).
- **Narrative beat:** Institutions are not morally uniform.
- **NPC offer:** "Institutions are not morally uniform. We need you to copy records of dissenting curators."
- **Completion:** server-validated objective and claim at NPC/scene. Co-op rule: individual credit; shared combat, owner-authoritative progress.
- **Reward / flags:** {"xp": 620, "currency": 100, "reputation": 5}; [].

### A Music Box with No Song [Z08-SIDE-02] — side
- **Level / prerequisites:** 39 / Z08-MAIN-01.
- **Quest objective:** Find the missing gear from Nera’s keepsake. (target: 1).
- **Narrative beat:** Love can survive imperfect recollection.
- **NPC offer:** "Love can survive imperfect recollection. We need you to find the missing gear from nera’s keepsake."
- **Completion:** server-validated objective and claim at NPC/scene. Co-op rule: individual credit; shared combat, owner-authoritative progress.
- **Reward / flags:** {"xp": 670, "currency": 130, "reputation": 5}; [].

### No More Empty Shelves [Z08-SIDE-03] — side
- **Level / prerequisites:** 40 / Z08-MAIN-01.
- **Quest objective:** Preserve lists before the Vault is destroyed. (target: 1).
- **Narrative beat:** A revolution should guard evidence.
- **NPC offer:** "A revolution should guard evidence. We need you to preserve lists before the vault is destroyed."
- **Completion:** server-validated objective and claim at NPC/scene. Co-op rule: individual credit; shared combat, owner-authoritative progress.
- **Reward / flags:** {"xp": 720, "currency": 160, "reputation": 5}; [].


# ACT 5 — LAST LIGHT

## Z09 Ember Observatory | levels 41–45
**Entry hub:** The Last Watch; **lead:** Ilyra Venn; **dungeon:** Lantern Spire; **act boss/guardian:** Astral Custodian.

### The Woman in Glass [Z09-MAIN-01] — main
- **Level / prerequisites:** 41 / Z08-MAIN-06.
- **Quest objective:** Release Ilyra from the lantern without breaking its promise. (target: lantern latch).
- **Narrative beat:** The youngest Witness survives within a closed time-loop.
- **NPC offer:** "The youngest Witness survives within a closed time-loop. We need you to release ilyra from the lantern without breaking its promise."
- **Completion:** server-validated objective and claim at NPC/scene. Co-op rule: individual credit; shared combat, owner-authoritative progress.
- **Reward / flags:** {"xp": 1950, "currency": 490, "items": [], "waypoint": null}; [].

### First Unraveling [Z09-MAIN-02] — main
- **Level / prerequisites:** 42 / Z09-MAIN-01.
- **Quest objective:** Listen to Ilyra’s account and inspect the ancient machine. (target: ancient recordings).
- **Narrative beat:** The Archive stores possibilities, not only dead souls.
- **NPC offer:** "The Archive stores possibilities, not only dead souls. We need you to listen to ilyra’s account and inspect the ancient machine."
- **Completion:** server-validated objective and claim at NPC/scene. Co-op rule: individual credit; shared combat, owner-authoritative progress.
- **Reward / flags:** {"xp": 2050, "currency": 512, "items": [], "waypoint": null}; [].

### Nine Unlit Windows [Z09-MAIN-03] — main
- **Level / prerequisites:** 43 / Z09-MAIN-02.
- **Quest objective:** Align the observatory’s three lens rings. (target: 3 lens rings).
- **Narrative beat:** The stars are hidden by imposed histories.
- **NPC offer:** "The stars are hidden by imposed histories. We need you to align the observatory’s three lens rings."
- **Completion:** server-validated objective and claim at NPC/scene. Co-op rule: individual credit; shared combat, owner-authoritative progress.
- **Reward / flags:** {"xp": 2150, "currency": 534, "items": [], "waypoint": null}; [].

### The Remaining Watch [Z09-MAIN-04] — main
- **Level / prerequisites:** 43 / Z09-MAIN-03.
- **Quest objective:** Protect the party while the last escape vessels launch. (target: 3 extraction waves).
- **Narrative beat:** Civilian evacuation has a visible effect on the finale.
- **NPC offer:** "Civilian evacuation has a visible effect on the finale. We need you to protect the party while the last escape vessels launch."
- **Completion:** server-validated objective and claim at NPC/scene. Co-op rule: individual credit; shared combat, owner-authoritative progress.
- **Reward / flags:** {"xp": 2250, "currency": 556, "items": [], "waypoint": null}; [].

### Custodian of the False Sky [Z09-MAIN-05] — main
- **Level / prerequisites:** 44 / Z09-MAIN-04.
- **Quest objective:** Defeat the Astral Custodian at the summit. (target: Astral Custodian).
- **Narrative beat:** Its attacks reveal changing safe platforms.
- **NPC offer:** "Its attacks reveal changing safe platforms. We need you to defeat the astral custodian at the summit."
- **Completion:** server-validated objective and claim at NPC/scene. Co-op rule: individual credit; shared combat, owner-authoritative progress.
- **Reward / flags:** {"xp": 2350, "currency": 578, "items": ["z09_boss_relic"], "waypoint": null}; ['z09_boss_down'].

### The Door That Is Tomorrow [Z09-MAIN-06] — main
- **Level / prerequisites:** 45 / Z09-MAIN-05.
- **Quest objective:** Cross the Archive gate after an explicit point-of-no-return warning. (target: Deep Archive gate).
- **Narrative beat:** The final region presents possible lives as physical geography.
- **NPC offer:** "The final region presents possible lives as physical geography. We need you to cross the archive gate after an explicit point-of-no-return warning."
- **Completion:** server-validated objective and claim at NPC/scene. Co-op rule: individual credit; shared combat, owner-authoritative progress.
- **Reward / flags:** {"xp": 2450, "currency": 600, "items": [], "waypoint": "Z09"}; [].

### The Ninth Star [Z09-SIDE-01] — side
- **Level / prerequisites:** 42 / Z09-MAIN-01.
- **Quest objective:** Calibrate a hidden telescope to reveal a bridge. (target: 3).
- **Narrative beat:** Physical space is memory-sensitive.
- **NPC offer:** "Physical space is memory-sensitive. We need you to calibrate a hidden telescope to reveal a bridge."
- **Completion:** server-validated objective and claim at NPC/scene. Co-op rule: individual credit; shared combat, owner-authoritative progress.
- **Reward / flags:** {"xp": 720, "currency": 100, "reputation": 5}; [].

### The Watch’s Last Meal [Z09-SIDE-02] — side
- **Level / prerequisites:** 43 / Z09-MAIN-01.
- **Quest objective:** Bring supplies to an evacuated watch crew. (target: 1).
- **Narrative beat:** Heroic sacrifices require unheroic logistics.
- **NPC offer:** "Heroic sacrifices require unheroic logistics. We need you to bring supplies to an evacuated watch crew."
- **Completion:** server-validated objective and claim at NPC/scene. Co-op rule: individual credit; shared combat, owner-authoritative progress.
- **Reward / flags:** {"xp": 770, "currency": 130, "reputation": 5}; [].

### A Letter for Ilyra [Z09-SIDE-03] — side
- **Level / prerequisites:** 44 / Z09-MAIN-01.
- **Quest objective:** Deliver an account of nine centuries of change. (target: 1).
- **Narrative beat:** A Witness deserves to know what followed.
- **NPC offer:** "A Witness deserves to know what followed. We need you to deliver an account of nine centuries of change."
- **Completion:** server-validated objective and claim at NPC/scene. Co-op rule: individual credit; shared combat, owner-authoritative progress.
- **Reward / flags:** {"xp": 820, "currency": 160, "reputation": 5}; [].

## Z10 Deep Archive | levels 45–50
**Entry hub:** The Remaining Bridge; **lead:** The Hollow Choir; **dungeon:** Throne of Unchosen Days; **act boss/guardian:** Mercy, the Hollow Choir.

### Lives Not Lived [Z10-MAIN-01] — main
- **Level / prerequisites:** 45 / Z09-MAIN-06.
- **Quest objective:** Traverse the three galleries of unreal choices. (target: 3 galleries).
- **Narrative beat:** The player sees other possible versions of their own journey.
- **NPC offer:** "The player sees other possible versions of their own journey. We need you to traverse the three galleries of unreal choices."
- **Completion:** server-validated objective and claim at NPC/scene. Co-op rule: individual credit; shared combat, owner-authoritative progress.
- **Reward / flags:** {"xp": 1950, "currency": 490, "items": [], "waypoint": null}; [].

### The Gifts of Mercy [Z10-MAIN-02] — main
- **Level / prerequisites:** 46 / Z10-MAIN-01.
- **Quest objective:** Reject four tempting offers made to companions. (target: 4 companion offers).
- **Narrative beat:** Rescue depends on respecting what each companion chooses.
- **NPC offer:** "Rescue depends on respecting what each companion chooses. We need you to reject four tempting offers made to companions."
- **Completion:** server-validated objective and claim at NPC/scene. Co-op rule: individual credit; shared combat, owner-authoritative progress.
- **Reward / flags:** {"xp": 2050, "currency": 512, "items": [], "waypoint": null}; [].

### Threads of One Future [Z10-MAIN-03] — main
- **Level / prerequisites:** 47 / Z10-MAIN-02.
- **Quest objective:** Break the Choir’s imposed timelines in a multi-stage event. (target: 9 timeline threads).
- **Narrative beat:** Agency is restored in small, consent-based acts.
- **NPC offer:** "Agency is restored in small, consent-based acts. We need you to break the choir’s imposed timelines in a multi-stage event."
- **Completion:** server-validated objective and claim at NPC/scene. Co-op rule: individual credit; shared combat, owner-authoritative progress.
- **Reward / flags:** {"xp": 2150, "currency": 534, "items": [], "waypoint": null}; [].

### The Last Unforgotten Name [Z10-MAIN-04] — main
- **Level / prerequisites:** 48 / Z10-MAIN-03.
- **Quest objective:** Find and speak the Bearer’s true name at the final threshold. (target: true name).
- **Narrative beat:** The protagonist earns identity through choices, not destiny.
- **NPC offer:** "The protagonist earns identity through choices, not destiny. We need you to find and speak the bearer’s true name at the final threshold."
- **Completion:** server-validated objective and claim at NPC/scene. Co-op rule: individual credit; shared combat, owner-authoritative progress.
- **Reward / flags:** {"xp": 2250, "currency": 556, "items": [], "waypoint": null}; [].

### The Mercy That Devours [Z10-MAIN-05] — main
- **Level / prerequisites:** 49 / Z10-MAIN-04.
- **Quest objective:** Defeat Mercy in three phases with memory-anchor mechanics. (target: Mercy, the Hollow Choir).
- **Narrative beat:** The Choir separates into individuals after being opposed.
- **NPC offer:** "The Choir separates into individuals after being opposed. We need you to defeat mercy in three phases with memory-anchor mechanics."
- **Completion:** server-validated objective and claim at NPC/scene. Co-op rule: individual credit; shared combat, owner-authoritative progress.
- **Reward / flags:** {"xp": 2350, "currency": 578, "items": ["z10_boss_relic"], "waypoint": null}; ['z10_boss_down', 'act_5_complete'].

### The Open Lattice [Z10-MAIN-06] — main
- **Level / prerequisites:** 50 / Z10-MAIN-05.
- **Quest objective:** Choose a personal epilogue and complete the shared story state. (target: Open Lattice / Sealed Veil / Crown Unmade).
- **Narrative beat:** Canonical live-world continuity adopts voluntary memory and free choice.
- **NPC offer:** "Canonical live-world continuity adopts voluntary memory and free choice. We need you to choose a personal epilogue and complete the shared story state."
- **Completion:** server-validated objective and claim at NPC/scene. Co-op rule: individual credit; shared combat, owner-authoritative progress.
- **Reward / flags:** {"xp": 2450, "currency": 600, "items": [], "waypoint": "Z10"}; [].

### The Unchosen Apprentice [Z10-SIDE-01] — side
- **Level / prerequisites:** 46 / Z10-MAIN-01.
- **Quest objective:** Free a copied apprentice without merging identities. (target: 3).
- **Narrative beat:** Potential people have moral complexity.
- **NPC offer:** "Potential people have moral complexity. We need you to free a copied apprentice without merging identities."
- **Completion:** server-validated objective and claim at NPC/scene. Co-op rule: individual credit; shared combat, owner-authoritative progress.
- **Reward / flags:** {"xp": 720, "currency": 100, "reputation": 5}; [].

### Pages in the Current [Z10-SIDE-02] — side
- **Level / prerequisites:** 47 / Z10-MAIN-01.
- **Quest objective:** Collect the fragments of Maelin’s true map. (target: 1).
- **Narrative beat:** Some uncertainty must be accepted.
- **NPC offer:** "Some uncertainty must be accepted. We need you to collect the fragments of maelin’s true map."
- **Completion:** server-validated objective and claim at NPC/scene. Co-op rule: individual credit; shared combat, owner-authoritative progress.
- **Reward / flags:** {"xp": 770, "currency": 130, "reputation": 5}; [].

### No More Tithes [Z10-SIDE-03] — side
- **Level / prerequisites:** 48 / Z10-MAIN-01.
- **Quest objective:** Protect a voluntary remembrance ceremony. (target: 1).
- **Narrative beat:** Endgame ethics must exist as mechanics.
- **NPC offer:** "Endgame ethics must exist as mechanics. We need you to protect a voluntary remembrance ceremony."
- **Completion:** server-validated objective and claim at NPC/scene. Co-op rule: individual credit; shared combat, owner-authoritative progress.
- **Reward / flags:** {"xp": 820, "currency": 160, "reputation": 5}; [].

## Dialogue staging and cinematic transitions
- The player should never lose camera control during ordinary quest conversation unless a boss intro explicitly requires a short scene.
- Offer, accept, in-progress, complete, and fail variants are mandatory. NPC dialogue must be sourced from text data so it can be localized.
- The most important noninteractive scenes: Ashwake first bell; Saint’s confession; Rusk’s public admission; Mother Sile history vision; Nera’s music box; Serath reveals the Crown; Mercy’s four offers; Open Lattice epilogue.
- Replay/skippable cutscenes must not grant item drops twice.

## Branch and consequence matrix
| Choice | Immediate scene | Deferred consequence | Gameplay parity |
|---|---|---|---|
| Rusk publicly confesses | Citizens demand ship records | Lighthouse memorial replaces harbor’s propaganda | Same XP/route |
| Spare ex-Curator witness | Witness offers an optional clue | Extra aid at Nine Vaults | Same main boss difficulty |
| Refuse wish-root bargain | Companion trust improves | Companion speaks their true name in finale | No locked class builds |
| Open Lattice | Shared canonical world state | Repeatable Echo Breaches | Standard endgame |
| Sealed Veil | Private memory-loss epilogue | Cosmetic character journal variation | Standard endgame |
| Crown Unmade | Private chaotic future glimpse | Cosmetic journal variation | Standard endgame |
