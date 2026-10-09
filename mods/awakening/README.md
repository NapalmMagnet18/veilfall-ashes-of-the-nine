# Awakening

![Afternoon sun through the pines, the lake and eroded peaks beyond](/cdn/value.4a2366b4070655b1f3e89396b7810758a70e2138666ad550b322aa5f1c15da44.jpeg)

Make a 3D Spawn world look like a modern open-world game: soft real sunlight, contact shadows, mist in the low ground, grass that moves, sharp ground textures and mountains shaped by rivers.

## Gallery
Shot live in Fidelity Test Valley, the world Awakening was built in.

![Lake under an eroded massif, mist in the low ground](/cdn/value.d0e3c36fa952f07fafa01921b8db573eb0943f5a787a0f3a98e9d26a1b2a6022.jpeg)
![The valley from above: river-cut ridges, forest planner stand, lake mark](/cdn/value.763beb50f5473737c06ac4b20c2421a599de865bbd9246763a7ab28e5896e563.jpeg)
![Spawn vista: 2K ground, worn trail, sunlit peaks](/cdn/value.9bb439dfa532966ecc95b6be3305732331d95dae827b0da045002e82ac841e5a.jpeg)
![Trail edge: wind-blown grass with sun shining through, gravel and forest litter](/cdn/value.b0cc794af92abc829d543348a2dd7ee023c3c4b478228cca43d24a60584d68c9.jpeg)
![Forest planner: a clumped conifer stand with an autumn birch edge](/cdn/value.c8c671953190ee6387a63932b2c2133a7f17f33ba79921141ee19fcf3cac7989.jpeg)
![Dry grass and forest floor cover at eye level](/cdn/value.e469be09ea20862effa84b07ef110ae160e332c04617f80059358c344bcbbd65.jpeg)

## Getting started
1. Install it: ask your Savi "install the awakening mod", or run `spawn mod install awakening`.
2. Ask your Savi: **"apply Awakening to my world"** (or run the `/awakening` command). She switches the lighting and the frame, swaps your grass, and tunes the mist to your valley.
3. Walk around. Tell her what reads wrong ("the far hills are too hazy", "the grass is too dense") and she tunes the live dials. No script edits needed.

Everything it changes is one version; `spawn undo` puts the world back.

## What's in it
| Piece | What you see |
|---|---|
| **Lighting** (`lighting.js`) | Film-accurate sunlight: rough ground and bark glow at a low sun, crevices darken, wet rock and metal keep their shine. |
| **Frame look** (`look.js`) | Sharpening, ambient occlusion (dark contact where rock meets grass), sun-lit ground mist with god rays, a warm-highlight / cool-shadow grade, gentle vignette and grain, bloom. Scales down by device: phones get sharpen + grade. |
| **Grass** (`grass-blades.js`, `grass-look.js`) | Curved multi-blade clumps with shaded roots, dry tips and sunlight shining through, swaying in the wind. |
| **2K ground textures** (`textures.yml`) | Grass, dry grass, forest floor, gravel, granite and snow at 2048 px (4x Spawn's built-in textures), each with colour, bump and shine maps. |
| **Eroded mountains** (`erosion.js`, `tools/erode.py`) | A bake that runs rivers over your mountains for a few minutes: valleys branch, ridges sharpen, scree settles, snow collects in gullies. |
| **Forest planner** (`forest.js`) | Plants a natural woodland from a footprint: stands that thicken and thin, species in patches, glades, walking trails worn through it, ferns in shade, fallen logs with their stumps. |
| **Forest floor** (`floor-cover.js`) | Moss cushions, fallen twigs, pine cones and shade-grass tufts for under the trees. |
| **Rock material** (`rock-look.js`) | Lays the 2K granite detail over a rock model's own paint, so rocks read from across the valley and up close. |
| **Lake water** (`water.js`, `water-sheet.js`, `water-surface.js`) | Depth colour, reflections, refraction, sun glints and caustics; far water goes glassy instead of grainy. Swimming leaves rings, things that fall in splash. |
| **Rivers & creeks** (`river-sheet.js`, `river.js`, `river-surface.js`) | Moving water on the lake's own surface: current carried downstream, whitewater at drops, boulders that split the flow and trail wakes. |
| **Shoreline** (`shore-band.js`, `wet-sand.js`) | Foam where the water laps and dark damp sand the waves just left. |
| **Creek tool** (`lib/creek.js`) | Hand it a line from spring to mouth (or let `traceCreek` find the valley floor) and it carves a natural valley, finds its own water levels down the land, and bakes the water sheet. |
| **Waterfall tool** (`lib/fall-ground.js`) | One frame carves the hanging-valley stream, the sheer lip, the plunge pool and the river outlet the curtain and pool water sit in. |
| **Waterfall** (`waterfall.js`, `waterfall-boil.js`, `lib/fall-material.js`, `lib/plunge.js`) | A layered 3D curtain, not a flat card: a glassy lip that tears white within a second, an outer veil that billows out, ropes of water peeling off, holes opening as it thins. At the foot a solid boil of froth heaps up and spreads into the pool, and the pool's own water churns white around the impact, so fall, froth and pool read as one water from every angle. |
| **Touching water** (`touch.js`) | One line in the player script and wading or swimming wakes whichever lake, river or creek you're in. |
| **Boats** (`water-mask.js`, `lib/swell.js`) | Hulls ride the same waves you see; no water inside the hull. |
| **Squalls & storms** (`lib/swell.js`, `storm.js`) | Optional: squalls cross the water, and can arrive as thunderstorms with rain, wet ground and lightning. |
| **Texture cook** (`tools/hires.py`) | Turns a painted photo into a seamless 2K colour + bump + shine set for a new surface. |

## Where waters meet

Any two Awakening waters join through one rule, `lib/junction.js`: a **junction** is a line across the tributary (a point on its centreline, the downstream direction, the channel's half-width). Both waters carry the same junction in the same slot, the tributary as side `-1`, the receiving water as `+1`:

- the tributary draws only upstream of the line; over its last `L` metres its own character (tilt, whitewater, wakes, ripple map) fades and its params ease into the receiving water's (`into_<param>`), so on the line it is shaded by exactly the receiving water's rule
- the receiving water draws only past the line, and carries the **plume**: the inflow's ripple map spreading and slowing as a jet, calming the wind chop, trailing faint scum lines
- both draw the plume with the same function, so the hand-over is one colour on both sides and neither sheet's draw order matters

Set it up with `junctionParams(slot, { x, z, dx, dz, w, u, r, a, L }, side)` spread into each material's params, and copy the receiving water's params onto the tributary as `into_chop`, `into_swell`, … Put the tributary's last reach at the receiving water's level. Two slots per water (`JUNCTIONS`).

## What's new in 1.7
- **Waterfalls.** A layered 3D curtain (core, veil, peeling ropes) owns the lip, so no seam shows where the stream goes over. Its foot is a solid froth heap that writes depth, so the pool never paints over it and it sits in the water instead of floating. The pool churns around the impact through `lib/plunge.js`.
- **Creek tool.** `lib/creek.js` carves along the land's fall line from a spring in a hollow, sinks the water into the bed and only ever cuts, so no more ridged embankments climbing a hill. `traceCreek` finds the valley floor for you.
- **Waterfall ground.** `lib/fall-ground.js` carves the stream, lip, plunge pool and outlet from one frame, so the curtain, the pool and the river's junction share the same numbers.
- **Sharper far clouds.** Clouds near the horizon get extra raymarch steps, a taller buffer, a true 2D jitter and a softer upscale, so distant cumulus reads smooth instead of blocky or combed. It costs about 0.8 ms a frame on a desktop GPU at ultra.
- **Water handovers.** Junction, river and water-material tweaks carry the stream-to-fall and pool-to-river transitions.

## The Awakening tab
In god mode there is an **Awakening** tab: every piece in plain words, grouped by Sky & light, Land, Plants, Water and Weather, with a pill showing whether this world uses it and the line to say to your Savi to add or tune it.

## Good to know
- Built for 3D worlds with heightmap terrain. Voxel and 2D worlds only get the lighting and frame look.
- It looks best at a low sun (morning or late afternoon) with a realistic sky. Your Savi sets that up.
- Trees and rock *models* are not included. Awakening gives the tools to place and shade them; bring your own models or ask your Savi to build them.
- Removing the mod: ask your Savi to take Awakening out. She switches the lighting, look and grass back first, then removes it.
