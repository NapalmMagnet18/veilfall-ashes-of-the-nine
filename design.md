# VEILFALL: ASHES OF THE NINE — the build

An original isometric action RPG (Whispers's production package in scripts/lib/data/*.md/json is the source of truth for story, classes, quests). Player-facing content stays original: no Blizzard names, designs or assets.

## Current slice: M1, Broken Lantern Road (Z01)
You wake at **the Wayside Fire**, a pilgrim camp in a fog-filled ravine at dusk. A Bladewraith (the first class) with Ashcut, Crosswound, Griefstep and three tonics.

**Loop:** talk to Maelin Sore at the fire → walk the candle road north and silence 8 wax pilgrims (milepost three) → recover 5 wax-sealed petitions at the tollhouse court → pass the Dripping Gate and break the **Bailiff of the Dripping Gate** → return to Maelin for the reward (once, ever).
**Win:** the Bailiff falls and Maelin's turn-in pays the Rusted Oathblade. **Lose:** life hits 0 → a one-second beat, back on your feet at the Wayside Fire with full life and tonics; quest progress kept.

## Controls
Left click ground: walk there (hold to keep steering). Left click an enemy: walk in and Ashcut. Right click: Crosswound toward the cursor. Space: Griefstep dash toward the cursor (brief invulnerability). Q: drink a tonic. Wheel: zoom. Phone: tap/press to move, chips for the rest.

## Numbers that agree (scripts/lib/data/combat.yml)
Hero 100 life, walks 5.5 m/s. Ashcut 14 dmg / 0.55 s, reach 2.3 m, +12 Edge. Crosswound 30 Edge, 30 dmg in a 3.4 m 140° arc. Griefstep 7 m, 0.35 s invulnerable, 3 s cooldown. Tonic +50, 3 carried, refilled at the fire.
Wax pilgrim 40 life (3 Ashcuts), 7 dmg per 1.5 s, 2.6 m/s (you outwalk it: kiting works). Tallow Deacon (elite) 170 life, a 1.2 s red-ring slam for 24. Three pilgrims kill a standing hero in ~7 s; one hero kills a pilgrim in 1.7 s.
Bailiff 900 life solo, ×(1 + 0.65 per extra player). Phases: 100–70% teaches the bell slam (ring telegraph 1.3 s); 70–35% adds burning wax pools; 35–0% combines with a 2.5 s recovery after each triple. Resets to full if the arena empties for 6 s. Loot granted once per eligible player (state.claimed).

## Where things live
places/main/sim.js referee: spawns packs, quest stages, XP/levels, death and respawn, boss reset. scripts/player.js the hero (click, path, skills; judges its own hits). scripts/wax-pack.js moves every enemy. scripts/bailiff.js the boss. scripts/ui.js the HUD.

## Decisions
- 2026-10-09: M1 is a compressed Z01 (MAIN-01, -02, -05) on one place; full 6-quest chain comes with M2/M4. (Savi, from the roadmap)
