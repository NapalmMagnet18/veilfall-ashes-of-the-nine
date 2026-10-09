// AAA Quality Kit — cinematic grade. The whole-screen pass between the rendered world and
// the player's eyes. One pass grades the frame three ways: warm daylight, an orange-pink
// dusk lift at sunset/sunrise, and a deep-blue moonlit night that never goes black.
//
// Install: set atmosphere.look = { script: "mods/aaa-quality-kit/look-cinema.js" } and tune
// via atmosphere.look.params (no recompile). Works in any 3D game with a day/night sky.
//
// Everything here is UNIFORM: every blend factor is a scene-global scalar (how bright the key
// light is + what colour it is), identical for every pixel. No depth taps, no luminance keying,
// so no edge fringing and the look stays per-pixel-pure — the engine can fuse it into the
// composite instead of paying its own pass. Cost: one grade + vignette + grain, a few dozen
// ALU ops. No render targets, no extra lights.
const { grade, vignette, grain } = require('builtin/postfx');
const { sunRadiance } = require('builtin/lighting');
const { float, vec3, mix, smoothstep } = require('builtin/tsl');

export function look(ctx) {
  // Engine bloom. These are NOT the seeded 0.15/0.6/1 trio — those read as "unauthored" and
  // resolve bloom to zero. Authored here, so the sun disc and bright faces actually lift.
  ctx.param('bloomStrength', 0.3);
  ctx.param('bloomRadius', 0.7);
  ctx.param('bloomThreshold', 0.92);

  // --- where the day is, as two numbers for the whole frame -------------------------
  // sunRadiance is the sky's active key light (the sun by day, the moon after the handover).
  const keyLum = sunRadiance.r.mul(0.2126).add(sunRadiance.g.mul(0.7152)).add(sunRadiance.b.mul(0.0722));

  // How far the frame is from full daylight: 0 at noon, 1 once the key light is weak.
  const dimKey = float(1).sub(smoothstep(ctx.param('nightKeyLow', 0.5), ctx.param('nightKeyHigh', 1.6), keyLum));
  // What COLOUR that weak key is tells dusk from night, and it never gaps: a setting sun is
  // deeply warm (red >> blue), moonlight is cool (blue >= red). Keying on sun elevation instead
  // leaves the hour between sundown and a high moon ungraded — a black-silhouette frame.
  const warmKey = smoothstep(0.02, 0.18, sunRadiance.r.sub(sunRadiance.b));

  // DUSK: dim AND warm — sunset and sunrise. NIGHT: dim AND cool — moonlight, all night long.
  const dusk = dimKey.mul(warmKey).mul(ctx.param('duskAmount', 1));
  const night = dimKey.mul(float(1).sub(warmKey)).mul(ctx.param('nightAmount', 1));

  // --- one grade, its dials driven by those two scalars -----------------------------
  // Day: a touch of exposure, warm white balance, gentle contrast. Dusk pushes the frame
  // warmer and more saturated with a magenta lean — orange into pink. Night: exposure opens
  // so shadowed faces stay readable, and the balance goes cold. The physical sun's key light
  // collapses toward the horizon, so without duskExposure + duskLift the golden hour renders
  // its ground as black silhouette.
  const exposure = mix(float(ctx.param('dayExposure', 1.02)), ctx.param('nightExposure', 2.6), night).add(dusk.mul(ctx.param('duskExposure', 0.85)));
  const saturation = mix(float(1.08), float(0.92), night).add(dusk.mul(0.12));
  const contrast = mix(float(1.05), float(0.95), night);
  const temperature = mix(float(ctx.param('dayWarmth', 0.06)), float(-0.16), night).add(dusk.mul(0.1));
  const tint = dusk.mul(-0.05); // negative tint = magenta — the pink half of an orange-pink sky
  const lift = dusk.mul(ctx.param('duskLift', 0.03));

  let c = grade(ctx.scene, { exposure, saturation, contrast, temperature, tint, lift });

  // Deep-indigo floor: shadowed faces land here at night instead of black.
  c = c.add(vec3(0.012, 0.022, 0.052).mul(night.mul(ctx.param('nightFloor', 1))));

  // A whisper of edge falloff all day, deeper at night; grain keeps big smooth skies from banding.
  c = vignette(c, night.mul(0.14).add(ctx.param('vignette', 0.07)), { color: [0.012, 0.016, 0.04] });
  return grain(c, ctx.param('grain', 0.022));
}
