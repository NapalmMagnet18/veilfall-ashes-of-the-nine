---
name: Modo Shaders
description: The SHADERPACK brain — the Minecraft shader look (SEUS/BSL family) translated lever by lever into this engine's real controls: light shafts, warm sun with cool shade, sky-reflecting water, bloom with emissive discipline, coloured depth fog, the grade curve, voxel block-material craft — with perf discipline as a first-class law (cheap-first ladder, one hero effect, measure before piling on).
---

# Modo Shaders — the shaderpack brain

**This is a curriculum, not a model swap.** "Activating the mode" IS loading this skill and
following it. No model changes, no brain changes, and by itself zero change to how the game looks —
what changes is which levers you reach for when someone asks for "shaders like Minecraft".

There is no shaderpack to install here, and that is good news: everything a SEUS/BSL pack does is
**authorable** in this engine, per lever, with numbers you can measure. `aaa-quality-kit#aaa-look`
already ships the graded result — `look-cinema.js`, tuned in a live voxel world and verified at
noon, golden hour and midnight, with the exact bloom/fog/moon/cycle numbers. Wire that first; this
skill is the map of what each shaderpack feature *is* here, and what each one costs.

---

## 1. Shader anatomy — lever by lever

| what the pack calls it | what it actually is here | cost class |
| --- | --- | --- |
| god rays / light shafts | additive scripted-material cones + drifting dust fx | little |
| soft warm sun, cool shade | `atmosphere.sun` rotation/colour + `hemisphere` fill | free |
| water reflecting the sky | `material: { kind: "water" }` (real wave displacement) | built in |
| bloom on glowing blocks | look-script bloom params + **emissive discipline** | the one real post cost |
| volumetric / coloured distance fog | `atmosphere.fog` used as composition | free |
| the "shader look" itself | the grade in the look script | ~free (ALU only) |
| torch light on nearby blocks | point lights, rationed; `builtin/lighting` in materials | real, per light |

### God rays / light shafts

Two lanes, and the cheap one is the default:

- **Cone lane (default).** A few long, thin cones under the light source with an additive,
  unlit scripted material: fresnel rim × a soft vertical falloff, `depthWrite = false`,
  `blending = AdditiveBlending`, `fog = false` (it's light, not a surface). Drifting dust motes as
  an fx on top sell the volume. It costs a handful of transparent draws and it reads in a
  screenshot immediately. Fade the cones out when the sun's key light is cold, or the shafts glow at
  midnight.
- **Marched lane (escalation only).** A look script marching the view ray gathering
  `sunVisibility(p)` — real geometry-carved beams. Honest price: ~24 samples per half-res pixel, and
  each sample is a filtered shadow lookup, so it multiplies real shadow work. On phones shadow maps
  are off entirely, so `sunVisibility` reads 1 and the beams degrade to a glow. Gate it behind
  `ctx.device.class` and never ship it as the default on a room with CPU-leaning clients.

### Soft warm sun with cool shade

This is what actually makes a pack look "warm", and it is free. Keep the **physical sky**
(`rayleigh`/`realistic`) and let it derive sun and ambient from the hour — authoring them by hand is
a deliberate override, not a starting move. The shade colour is the `hemisphere` fill: a cool
sky-tinted hemisphere against a warm key is the entire warm/cool contrast a shaderpack advertises.
A scene with only key has no depth; a scene with only fill has no shape.

### Water reflecting the sky

`material: { kind: "water" }` carries real wave displacement with matched normals. On terrain
liquids, taller waves are a `liquid.waves` bump — **never** a scripted material written just to get
waves. Reach for `liquid.material` (a scripted surface) only when the look needs something the
knobs can't express, and know the trade: a script there replaces *every* declarative knob (colour,
foam, caustics, clarity, refraction) — you own the whole surface from then on.

### Bloom on emissives — and emissive discipline

Bloom is the pack feature everyone recognises and the one real frame cost in the post chain (it
splits the post topology). Two halves:

- **Bloom is params, not a pass you write.** `bloomStrength` / `bloomRadius` / `bloomThreshold` as
  look params drive engine bloom live, no recompile. The seeded default trio reads as
  "unauthored" and resolves to nothing in a world with no static glow — `#aaa-look` ships authored
  non-default numbers; use those.
- **Emissive discipline is the other half, and it's free.** **Few, bright, meaningful.** With a
  threshold near 1, an emissive has to actually exceed it to glow — so pick the handful of things
  that deserve light (ore veins, lava, a lamp, the one magic prop) and let them be genuinely bright,
  instead of painting a low emissive on everything and getting a grey wash. Bloom on everything is
  bloom on nothing.
- If bloom is parked on the room's clients (it is on this game's creator client), the glow is coming
  from *emissive plus grade*, not from bloom — author the scene so it still reads with bloom absent.

### Coloured depth fog

Fog is composition, not weather: it blues the horizon, ends the world without a visible edge, and
hides chunk borders and the far ring's simplifications. `#aaa-look` carries the measured linear
near/far pair that works in a voxel world. Two laws: fog **softens** the horizon, never swallows it
(a scene you can't read is not atmospheric, it's broken), and distance colour belongs to fog rather
than to a haze term in the grade — depth taps in the grade classify the look out of the fused
composite path.

### The grade curve

The pack's "look" — the S-curve, the saturation, the vignette, the grain — is the look script, one
`grade()` call plus a vignette plus grain. `#aaa-look` owns the shipped day/dusk/night curve and the
traps it already dodges (never key night on sun elevation; dusk needs its own lift; night is never
black). Do not re-derive those numbers: wire the shipped script, then tune **params only** — a param
change is a uniform write, free; editing the script recompiles the graph.

---

## 2. Voxel-specific craft

- **Block materials read `texture`, not `albedo`** (heightmap terrain is the one that reads
  `albedo`). Getting this wrong hands the renderer nothing and the whole world renders black —
  `#aaa-training`'s dataset carries the full pair, including the stale-atlas half: the client builds
  its block-texture atlas once, so textures still cooking at build time leave a black atlas that
  spec edits never rebuild, and only a client reload does. Read that entry before touching block
  materials.
- **`pbr: true` with textured blocks.** Roughness carries voxel surfaces further than colour does:
  wet stone at 0.3 and dry sand at 0.95 in the same world is most of what "shaders" means to the
  eye.
- **Per-face tint / AO feel.** The look people love is corner darkening: let occluded faces sit
  darker and top faces brighter (a small per-face tint step, top→side→bottom). The gradient between
  a top and a side face is what makes a cube read as a solid object instead of a flat sticker.
- **Emissive ore glow** is the voxel world's hero emissive: a few block ids, genuinely bright, with
  one small point light only where the player stands close enough to care. Emissive is cheap; point
  lights are not.
- **One texel scale for the whole world.** Same texels-per-metre on every block, prop and sprite.
  Mixed density reads broken even when every texture is fine alone — this is the single most common
  reason a voxel world looks amateur next to a shader screenshot.
- Want the crunchy retro read instead of the glossy one? That's a render-resolution ceiling
  (`graphics.renderResolution`) — cheaper fill *and* a style, and it composes with the grade.

---

## 3. Perf discipline — first-class law

> **Ultra-realism that drops frames is a failed shader.** A pack that makes the game beautiful and
> unplayable is not a beauty pass, it's a regression with screenshots.

This room's own creator client is the standing proof: CPU-leaning, ~22 ms/frame, **bloom already
parked**. Anything authored against a desktop assumption arrives there as lag — and lag is this
creator's #1 recurring complaint.

### The cheap-first ladder (climb it in this order, stop when it looks right)

1. **Atmosphere** — sun rotation/colour, hemisphere fill, fog, clouds, stars, moon, the cycle.
   Costs nothing. Most of the shaderpack read lives on this rung, and most people skip it.
2. **The grade** — one look script: grade + vignette + grain, a few dozen ALU ops, no render
   targets. Essentially free.
3. **Emissive discipline + bloom params** — free on the emissive side; bloom is the one real post
   cost, and it's a param, not a pass.
4. **A few shaft cones / fx** — a handful of transparent draws. Little, but transparency is where
   phones hurt: overdraw multiplies the whole shader by layer count.
5. **Scripted materials on hero objects** — each one is its own draw call and compiled pipeline.
   Fine for a boss, a portal, one water surface. Never for hundreds of scattered copies: plain
   material fields batch, scripted ones don't.
6. **Per-block / per-pixel effects, multi-pass looks, marched volumetrics** — these cost real
   frames. A noise tap is ~3× a plain material; shell-layer cutout is 60–111×. This rung needs a
   measurement, not an opinion.

### The rules on top of the ladder

- **ONE hero effect per scene, not five.** One thing in the frame is allowed to be expensive and
  spectacular; everything else is atmosphere and grade. Five hero effects is how a scene ends up
  costing 40 ms and looking busy.
- **Read `get_game_perf` BEFORE piling on** — real frames from real devices, heaviest costs by
  name. Then take the *same* read after. A beauty pass with no before/after pair has no claim.
  `api.getPerformanceSnapshot()` is the in-scene companion: measured GPU passes by name, including
  the look's own passes.
- **Test on the weakest device that plays**, not on the best one. Branch cost, not art, on device
  class: `const STEPS = ctx.device.class === "mobile" ? 8 : 24;` — or return the cheap graph
  entirely on phones. Both are legal (looks and materials build per client); two players may see
  different frames, never different worlds.
- **The engine parks what's too expensive** — a heavy look drops to the neutral baseline, a heavy
  material to the PBR fallback, each named in `getLogs()`. A parked effect is not a mystery, it's a
  measurement: you overspent.
- **Free is free, forever.** Changing a param is a uniform write. Changing the set of passes
  recompiles. Drive anything per-frame through params.

---

## The shader pass (before calling a look done)

1. Is the **physical sky** doing the sun and ambient work, with only the hour authored?
2. Is `#aaa-look`'s grade script wired, tuned by **params only**?
3. Is fog composing the distance, and is the horizon still readable?
4. Are emissives **few, bright and meaningful** — and does the scene still read with bloom parked?
5. Is there exactly **one hero effect** in the frame?
6. One texel scale across the whole world?
7. `get_game_perf` before and after, on the room's real clients — and does the weakest device still
   hold its budget?
8. Three frames captured: noon, golden hour, midnight (`#aaa-look`'s screenshot discipline — set
   cycle + timeOfDay in ONE patch, capture, restore; never leave the cycle parked).

**Disqualifier: a beauty pass that raises frame time past budget on the room's real clients is not
done.** Roll it back to the rung below, or make it a device-gated escalation — the player on the
weak machine deserves the same world at a framerate that respects them.