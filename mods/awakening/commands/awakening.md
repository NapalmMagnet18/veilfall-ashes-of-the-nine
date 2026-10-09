---
name: awakening
description: Apply Awakening to this world: lighting model, post stack and grass, then tune to the place.
---

Load the `awakening#awakening` skill. Then, in this world:
1. Set world.config.yaml `lighting: mods/awakening/lighting.js`.
2. For each 3D place: `atmosphere.look = { script: "mods/awakening/look.js", params: { mistBase: <the place's low ground y + 1> } }`; if the sky is not procedural, move it to `{ kind: "realistic", model: "hosek" }` at a low sun.
3. On heightmap terrain, swap the grass layers' items to `mods/awakening/grass-blades.js` and their material to `mods/awakening/grass-look.js`; move the ground materials onto the 2K sets in `textures.yml`.
4. If the place has mountains made of noise, offer the eroded-mountains bake (skill section 5) before touching the generator: it rewrites their shape. Offer the forest planner if the world wants woodland.
5. If the place has a lake mark or a river, offer Awakening Water (skill sections 9-12, rivers 11a-11c): the lake sheet and shore band built with lib/lake-build.js, river/creek sheets on the same system, junctions where they meet, and the one `touchWater` line in the player's behavior (section 10). Offer squalls and storms (13-14) as optional. If the ground has a drop worth one, offer a waterfall (11a++ ground, 11a+++ curtain and boil).
Keep every world fact (ids, positions, levels) in the world's files, never in mods/awakening/ (skill: "Using Awakening in any game").
6. Look at the spawn and one far vantage; tune aoStrength / mistDensity until contact shadow reads and the far ridges sit in air.
Report what changed; `spawn undo` returns it.