# VEILFALL: ASHES OF THE NINE — the build

An original isometric action RPG (Whispers's production package in scripts/lib/data/*.md/json is the source of truth for story, classes, quests). Player-facing content stays original: no Blizzard names, designs or assets.

## Current slice: M1, Broken Lantern Road (Z01)
You wake at **the Wayside Fire**, a pilgrim camp in a fog-filled ravine at dusk. A Bladewraith (the first class) with Ashcut, Crosswound, Griefstep and three tonics.

**Loop:** talk to Maelin Sore at the fire → walk the candle road north and silence 8 wax pilgrims (milepost three) → recover 5 wax-sealed petitions at the tollhouse court → pass the Dripping Gate and break the **Bailiff of the Dripping Gate** → return to Maelin for the reward (once, ever).
**Win:** the Bailiff falls and Maelin's turn-in pays the Rusted Oathblade. **Lose:** life hits 0 → a one-second beat, back on your feet at the Wayside Fire with full life and tonics; quest progress kept.

## Controls
Left click ground: walk there (hold to keep steering). Left click an enemy: walk in and Ashcut. Right click: Crosswound toward the cursor. Space: Griefstep dash toward the cursor (brief invulnerability). 1: Afterimage Guard. Q: drink a tonic. I: pack. Wheel: zoom. Phone: tap/press to move, chips for the rest.

## Numbers that agree (scripts/lib/data/combat.yml)
Hero 100 life, walks 5.5 m/s. Ashcut 14 dmg / 0.55 s, reach 2.3 m, +12 Edge. Crosswound 30 Edge, 30 dmg in a 3.4 m 140° arc. Griefstep 7 m, 0.35 s invulnerable, 3 s cooldown. Tonic +50, 3 carried, refilled at the fire.
Afterimage Guard: a 1.4 s window, 8 s cooldown; a blow caught inside it is cancelled and answered by a 22-dmg riposte on every foe within 3 m.
Wax pilgrim 40 life (3 Ashcuts), 4 dmg per 1.7 s, 2.6 m/s (you outwalk it: kiting works). Tallow Deacon (elite) 170 life, a 1.2 s red-ring slam for 20. Three pilgrims kill a standing hero in ~7 s; one hero kills a pilgrim in 1.7 s.
Bailiff 900 life solo, ×(1 + 0.55 per extra player). Taxman's Arc: 120° 5.5 m wedge, 0.8 s orange telegraph, 26 dmg (step behind). Unpaid Debt: marks a player, 3 s later a wax line chases where they stood, 22 dmg. Phase B lights ledger pillars (120 life) that spawn slow walkers and stack Fray (+10% damage taken per stack, max 5) until broken. Phase C alternates both attacks with a 1.0 s recovery. Resets if the arena empties for 6 s. Loot once per eligible player (state.claimed).

## Where things live
places/main/sim.js referee: spawns packs, quest stages, XP/levels, death and respawn, boss reset. scripts/player.js the hero (click, path, skills; judges its own hits). scripts/wax-pack.js moves every enemy. scripts/bailiff.js the boss. scripts/ui.js the HUD.

## Decisions
- 2026-10-09: M1 is a compressed Z01 (MAIN-01, -02, -05) on one place; full 6-quest chain comes with M2/M4. (Savi, from the roadmap)

- 2026-10-08: look moved to the creator's dungeon reference: night 20.6, moonlit blue air, wet flagstone road, ruined ashlar walls and iron braziers (scripts/gen/vf-ruin.js, ruin-road/*). Grass thinned to dead moss. Was dusk 17.45 with summer grass.
- 2026-10-08: Afterimage Guard (key 1) verified in live play: caught a pilgrim blow at 84 life and the riposte struck all five pilgrims around the hero (40 → 13 each). Numbers section brought in line with combat.yml.
- 2026-10-08: the floor is the map's shape (veilfall-map.js floorDist < 0). The hero can no longer walk up banks or cliffs: steps past the lip lose their outward push, a body found past it is drawn back, and a click on a cliff walks to the nearest floor point toward the hero (scripts/player.js reachable/keepOnFloor). Found when a test hero got stuck on the arena bank behind the gibbet.
- 2026-10-08: terrain.js made cheaper (fewer noise octaves; the deep floor and low banks skip noise they can't use) after the room measured 234 ms a chunk against a 222 ms budget.
- 2026-10-08: first scripted solo Bailiff run at normal life, no tonics, no guard: reached phase III with the boss at 164/900, both ledger pillars still up (Fray 3), then the hero fell. Close, not won. Unverified: a full solo win, pillar breaking in play, reward once.
