// Awakening: the frame's film stock. Sharpen, ambient occlusion, sun-lit ground mist, a filmic grade.
// Every number is a live param: place atmosphere.look.params.<name> retunes it with no recompile.
// Cost scales by the viewer's tier: low = sharpen + grade; medium adds AO; high/ultra add the mist march.
import { vec2, vec3, vec4, float, Loop, mx_noise_float, cameraPosition, screenUV, texture, max, min, clamp } from "builtin/tsl";
import { sunDirection, sunRadiance, ambientRadiance, sunVisibility, windTravel } from "builtin/lighting";
import { grade, vignette, grain } from "builtin/postfx";
import { skyClouds, stormNode } from "./lib/sky-clouds.js";
import { depthUpsample } from "./lib/upsample.js";

export function look(ctx) {
  ctx.param("bloomStrength", 0.32);
  ctx.param("bloomRadius", 0.85);
  ctx.param("bloomThreshold", 1);
  const q = ctx.quality;
  const medium = q === "medium" || q === "high" || q === "ultra";
  const high = q === "high" || q === "ultra";

  // 1. contrast-adaptive sharpen: detail back after TAA, clamped to the neighbourhood so no halos
  let c;
  if (q === "low") c = texture(ctx.scene, screenUV).rgb; // low: no extra full-screen pass
  else {
  const sharpT = ctx.target("fid-sharp", { scale: 1 });
  const sharp = ctx.pass(sharpT, (uv) => {
    const t = vec2(1).div(sharpT.size);
    const c = texture(ctx.scene, uv).rgb;
    const n = texture(ctx.scene, uv.add(vec2(0, t.y))).rgb;
    const s = texture(ctx.scene, uv.sub(vec2(0, t.y))).rgb;
    const e = texture(ctx.scene, uv.add(vec2(t.x, 0))).rgb;
    const w = texture(ctx.scene, uv.sub(vec2(t.x, 0))).rgb;
    const mn = min(c, min(min(n, s), min(e, w)));
    const mx = max(c, max(max(n, s), max(e, w)));
    const k = ctx.param("sharpen", 0.35);
    const out = c.add(c.mul(4).sub(n).sub(s).sub(e).sub(w).mul(k.mul(0.25)));
    return vec4(clamp(out, mn, mx), 1);
  });
  c = sharp.sample(screenUV).rgb;
  }

  // 2. screen-space ambient occlusion: contact shadow where rock meets grass, trunk meets root
  if (medium) {
    const aoT = ctx.target("fid-ao", { scale: 0.5, format: "rgba8unorm" });
    const ao = ctx.pass(aoT, (uv) => {
      const P = ctx.worldPosition(uv);
      const N = ctx.normal(uv);
      const z = ctx.viewZAt(uv).negate();
      const R = ctx.param("aoRadius", 1.1);
      const aspect = aoT.size.x.div(aoT.size.y);
      const rUv = R.mul(0.72).div(z.max(0.6));
      const pix = uv.mul(aoT.size);
      const rot = pix.dot(vec2(0.0671, 0.0058)).fract().mul(52.98).fract().mul(6.2832);
      const occ = float(0).toVar();
      const SAMPLES = high ? 8 : 5;
      for (let i = 0; i < SAMPLES; i++) {
        const a = rot.add(i * 2.39996);
        const r = Math.sqrt((i + 0.5) / SAMPLES);
        const off = vec2(a.cos().div(aspect), a.sin()).mul(rUv.mul(r));
        const v = ctx.worldPosition(uv.add(off)).sub(P);
        const d = v.length();
        const fall = clamp(float(1).sub(d.div(R.mul(2.2))), 0, 1);
        occ.addAssign(max(N.dot(v).div(d.add(0.001)).sub(0.08), 0).mul(fall));
      }
      const sky = z.greaterThan(600).select(float(0), float(1));
      const a0 = clamp(float(1).sub(occ.div(SAMPLES).mul(ctx.param("aoIntensity", 1.6)).mul(sky)), 0, 1);
      return vec4(vec3(a0), 1);
    });
    const h = vec2(0.75).div(aoT.size);
    const aoV = ao.sample(screenUV.add(h)).r.add(ao.sample(screenUV.sub(h)).r)
      .add(ao.sample(screenUV.add(vec2(h.x, h.y.negate()))).r).add(ao.sample(screenUV.add(vec2(h.x.negate(), h.y))).r).mul(0.25);
    c = c.mul(float(1).sub(float(1).sub(aoV).mul(ctx.param("aoStrength", 0.7))));
  }

  // 2b. the sky: volumetric cumulus, cirrus veil, cloud shadows on the land (sky-clouds.js)
  // a storm under the deck: the land loses its sun colour and drops toward slate (look param storm)
  const S = stormNode(ctx);
  const lum = c.dot(vec3(0.2126, 0.7152, 0.0722));
  c = c.mul(float(1).sub(S.mul(0.5))).mul(float(1).sub(S.mul(0.35))).add(vec3(lum).mul(vec3(0.72, 0.8, 0.9)).mul(S.mul(0.35)).mul(float(1).sub(S.mul(0.5))));
  c = skyClouds(ctx, c);

  // 3. ground mist lit by the sun: valleys fill, god rays through canopies (high/ultra)
  if (high) {
    const air = ctx.target("fid-air", q === "ultra" ? { width: 640, height: 360 } : { width: 480, height: 270 });
    const fog = ctx.pass(air, (uv) => {
      const ray = ctx.worldPosition(uv).sub(cameraPosition), dir = ray.normalize();
      const STEPS = q === "ultra" ? 16 : 12;
      const dt = ray.length().min(ctx.param("mistReach", 140)).div(STEPS);
      const start = uv.mul(air.size).dot(vec2(0.0671, 0.0058)).fract().mul(52.98).fract();
      const cosT = dir.dot(sunDirection);
      // Henyey-Greenstein forward scatter, g = 0.6, plus a flat term
      const g = 0.6;
      const hg = float(1 - g * g).div(float(1 + g * g).sub(cosT.mul(2 * g)).pow(1.5).mul(12.566));
      const phase = hg.mul(4).add(0.08);
      const wind = vec3(windTravel.x, 0, windTravel.y);
      const light = vec3(0).toVar(), clear = float(1).toVar();
      Loop(STEPS, ({ i }) => {
        const p = cameraPosition.add(dir.mul(float(i).add(start).mul(dt)));
        const hgt = p.y.sub(ctx.param("mistBase", 1.5)).max(0);
        const mist = ctx.param("mistDensity", 0.012).mul(S.mul(2.5).add(1)).mul(hgt.div(ctx.param("mistFalloff", 9)).negate().exp())
          .mul(mx_noise_float(p.sub(wind).mul(0.045)).mul(0.6).add(1));
        const through = mist.mul(dt).negate().exp();
        // under a storm deck no direct sun gets through: the shafts (and a player's shadow tube) fade with it,
        // so nobody drags a dark slab through the dense storm mist behind them
        const sunIn = float(1).sub(S.mul(0.95)), vis = sunVisibility(p);
        const lit = sunRadiance.mul(vis.mul(sunIn)).mul(phase).add(ambientRadiance.mul(S.mul(0.4).add(0.35)));
        light.addAssign(lit.mul(clear).mul(float(1).sub(through)));
        clear.mulAssign(through);
      });
      return vec4(light, clear);
    });
    const f = depthUpsample(ctx, fog, air.size); // crisp silhouettes against the sunlit mist
    c = c.mul(f.w).add(f.rgb.mul(ctx.param("mistLight", 0.55)));
  }

  // 4. the grade: cool shadows, warm highlights, filmic contrast, aerial haze
  c = grade(c, {
    exposure: 1.02, contrast: 1.07, saturation: 1.06, temperature: 0.06,
    lift: [-0.006, -0.002, 0.012], gamma: 1.02, gain: [1.02, 1.0, 0.975], haze: 0.05,
  });
  c = vignette(c, ctx.param("vignette", 0.2), { color: "oklch(0.12 0.02 260)", feather: 0.55 });
  return grain(c, ctx.param("grain", 0.022));
}
