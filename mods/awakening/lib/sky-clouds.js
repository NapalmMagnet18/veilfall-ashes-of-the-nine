// Awakening sky: volumetric cumulus raymarched over the frame, a cirrus veil above it, and the
// clouds' shadows drifting across the land. Called from look.js; every number is a live param.
// Tiers: high/ultra march the 3D cloud slab (sun light-marched through it, silver lining, dark
// bellies); low/medium draw one painted layer at the slab's middle. Pair with
// atmosphere.clouds.enabled: false so the engine's own layer does not double it.
import { vec2, vec3, vec4, float, Loop, If, mx_noise_float, mx_fractal_noise_float, cameraPosition,
  screenUV, clamp, smoothstep, exp, max, min, mix, time, mod, step } from "builtin/tsl";
import { sunDirection, sunRadiance, ambientRadiance, windTravel } from "builtin/lighting";
import { depthUpsample } from "lib/upsample.js";
import { SQUALL } from "lib/swell.js";

// storm strength 0..1 on the squall clock (swell.js squall()), gated by the look param storm (default 0):
// the shader reads it straight off time, so the sky thickens and clears with no per-second writes
export function stormNode(ctx) {
  const ph = mod(mod(time, 3600), SQUALL.period).div(SQUALL.length);
  // leads the squall a little: the cover builds before the gusts, clears after
  const lead = ph.add(0.12).div(1.24);
  return clamp(lead, 0, 1).mul(Math.PI).sin().max(0).pow(1.5).mul(ctx.param("storm", 0)); // clamped first: pow of a negative is NaN
}

const P4 = 12.566;
function hg(cosT, g) { // Henyey-Greenstein, scaled so an isotropic phase is 1
  return float(1 - g * g).div(float(1 + g * g).sub(cosT.mul(2 * g)).pow(1.5)).mul(1 / P4).mul(P4);
}

function params(ctx) {
  const base = ctx.param("cloudBase", 1500), top = ctx.param("cloudTop", 2800);
  const S = stormNode(ctx); // a storm: a closed, heavy slate deck, dark bellies, deep shadow on the land
  return {
    base, top, thick: top.sub(base),
    cover: mix(ctx.param("cloudCover", 0.46), float(0.92), S),
    dens: float(ctx.param("cloudDensity", 0.0065)).mul(S.mul(1.2).add(1)),
    scale: ctx.param("cloudScale", 0.00026),
    bright: float(ctx.param("cloudBrightness", 1.0)).mul(float(1).sub(S.mul(0.75))),
    amb: float(ctx.param("cloudAmbient", 1.8)).mul(float(1).sub(S.mul(0.45))),
    desat: mix(ctx.param("cloudDesaturate", 0.35), float(0.85), S),
    ms: ctx.param("cloudMultiScatter", 0.32),
    cirrus: ctx.param("cirrus", 0.55),
    shadow: mix(ctx.param("cloudShadow", 0.5), float(0.9), S),
    drift: vec3(windTravel.x, 0, windTravel.y).mul(ctx.param("cloudDrift", 8)),
  };
}

// coverage at point p: 0 = clear air, rising into the body of a cloud
function shape(K, p, octaves) {
  const q = p.add(K.drift);
  const h = clamp(p.y.sub(K.base).div(K.thick), 0, 1);
  const n = mx_fractal_noise_float(q.mul(K.scale), octaves, 2.0, 0.5).mul(0.55).add(0.5);
  const big = mx_noise_float(q.mul(K.scale.mul(0.23))).mul(0.18); // weather: clusters and gaps
  const thr = float(1).sub(K.cover).add(h.mul(0.32)).sub(big);     // tops round, bottoms flat
  const prof = smoothstep(0, 0.07, h).mul(float(1).sub(smoothstep(0.6, 1, h)));
  return n.sub(thr).div(K.cover.mul(0.35)).max(0).mul(prof);
}
function density(K, p) {
  const s = shape(K, p, 4);
  const detail = mx_fractal_noise_float(p.add(K.drift.mul(1.6)).mul(K.scale.mul(13)), 2, 2.3, 0.5).mul(0.55).add(0.5);
  return s.sub(detail.mul(0.42).mul(float(1).sub(s).max(0.15))).sub(0.03).max(0);
}

function cirrusLayer(K, dir) {
  const alt = float(7800);
  const t = alt.sub(cameraPosition.y).div(dir.y.max(0.02));
  const pc = cameraPosition.add(dir.mul(t)).add(K.drift.mul(2.5));
  const streak = vec3(pc.x.mul(0.000035), pc.z.mul(0.00012), 3.1);
  const n = mx_fractal_noise_float(streak, 4, 2.2, 0.55).mul(0.5).add(0.5);
  const wisp = mx_noise_float(vec3(pc.x.mul(0.0004), pc.z.mul(0.0011), 9.7)).mul(0.5).add(0.5);
  const a = smoothstep(0.52, 0.85, n).mul(wisp.mul(0.8).add(0.2)).mul(K.cirrus)
    .mul(smoothstep(0.02, 0.14, dir.y)).mul(exp(t.div(-90000)));
  const cosT = dir.dot(sunDirection);
  const lit = sunRadiance.mul(hg(cosT, 0.7).mul(0.5).add(0.6)).add(ambientRadiance.mul(1.4));
  return vec4(lit.mul(K.bright), a);
}

function march(ctx, K, dir, steps, lsteps, open, px, extra = 0) {
  const out = vec4(0, 0, 0, 1).toVar();
  If(dir.y.greaterThan(0.012).and(open), () => {
    const t0 = K.base.sub(cameraPosition.y).div(dir.y);
    const t1 = min(K.top.sub(cameraPosition.y).div(dir.y), t0.add(9000));
    // grazing rays cross kilometres of slab: they get up to `extra` more steps, so a step never skips a cloud's
    // detail and the far edges stop stepping (only the thin horizon band pays; rows overhead march as before)
    const graze = float(1).sub(smoothstep(0.03, 0.22, dir.y));
    const n = float(steps).add(graze.mul(extra)).floor();
    const dt = t1.sub(t0).div(n);
    // per-texel start jitter on the buffer's own pixel grid, a true 2D hash: the old gradient noise barely changed down a
    // column, so neighbouring columns banded into the combed vertical streaks far clouds showed
    const start = px.floor().dot(vec2(12.9898, 78.233)).sin().mul(43758.5453).fract();
    const cosT = dir.dot(sunDirection);
    const phase = mix(hg(cosT, 0.72), hg(cosT, -0.25), 0.35);
    const light = vec3(0).toVar(), T = float(1).toVar();
    const lstep = K.thick.mul(0.1);
    Loop(steps + extra, ({ i }) => {
      If(T.greaterThan(0.02).and(float(i).lessThan(n)), () => {
        const p = cameraPosition.add(dir.mul(t0.add(float(i).add(start).mul(dt))));
        // cheap first octave: clear air far below the coverage threshold skips the full noise stack
        const q0 = p.add(K.drift);
        const hh0 = clamp(p.y.sub(K.base).div(K.thick), 0, 1);
        const n0 = mx_noise_float(q0.mul(K.scale)).mul(0.55).add(0.5);
        const thr0 = float(1).sub(K.cover).add(hh0.mul(0.32)).sub(mx_noise_float(q0.mul(K.scale.mul(0.23))).mul(0.18));
        const maybe = n0.add(0.34).greaterThan(thr0);
        const d = float(0).toVar();
        If(maybe, () => { d.assign(density(K, p).mul(K.dens)); }); // a real branch: the full stack only runs near cloud
        If(d.greaterThan(0.00001), () => {
          const od = float(0).toVar();
          for (let j = 1; j <= lsteps; j++) {
            const lp = p.add(sunDirection.mul(lstep.mul(j * j * 0.7)));
            od.addAssign(shape(K, lp, 2).mul(K.dens).mul(lstep.mul(j * 0.8)));
          }
          const h = clamp(p.y.sub(K.base).div(K.thick), 0, 1);
          const sunT = exp(od.negate()).add(exp(od.mul(-0.25)).mul(0.3));
          const powder = float(1).sub(exp(d.mul(dt).mul(-2))).mul(0.6).add(0.4);
          const lit = sunRadiance.mul(phase).mul(sunT).mul(powder)
            .add(ambientRadiance.mul(vec3(0.82, 0.95, 1.2)).mul(K.amb).mul(h.mul(0.8).add(0.6)))
            .add(sunRadiance.mul(K.ms).mul(h.mul(0.5).add(0.5)).mul(exp(od.mul(-0.08))));
          const through = exp(d.mul(dt).negate());
          light.addAssign(lit.mul(T).mul(float(1).sub(through)));
          T.mulAssign(through);
        });
      });
    });
    const fade = exp(t0.div(-38000)).mul(smoothstep(0.012, 0.06, dir.y)); // distant cover melts into the haze
    const ci = cirrusLayer(K, dir);
    const a = float(1).sub(T).mul(fade);
    // cirrus sits behind the cumulus
    const lum = light.dot(vec3(0.2126, 0.7152, 0.0722));
    light.assign(mix(light, vec3(lum), K.desat));
    out.assign(vec4(light.mul(K.bright).mul(fade).add(ci.rgb.mul(ci.a).mul(T)), float(1).sub(a).mul(float(1).sub(ci.a.mul(T)))));
  });
  return out;
}

function painted(ctx, K, dir, open) { // low/medium: one layer at the slab's middle, lit by the sun's side
  const out = vec4(0, 0, 0, 1).toVar();
  If(dir.y.greaterThan(0.012).and(open), () => {
    const mid = K.base.add(K.thick.mul(0.3));
    const t = mid.sub(cameraPosition.y).div(dir.y);
    const p = cameraPosition.add(dir.mul(t));
    const d = shape(K, vec3(p.x, mid, p.z), 4);
    const a = float(1).sub(exp(d.mul(-3.2))).mul(exp(t.div(-38000))).mul(smoothstep(0.012, 0.06, dir.y));
    const cosT = dir.dot(sunDirection);
    const lit = sunRadiance.mul(hg(cosT, 0.6).mul(0.5).add(0.55)).mul(exp(d.mul(-1.4)).mul(0.7).add(0.3))
      .add(ambientRadiance.mul(K.amb).mul(0.8));
    const ci = cirrusLayer(K, dir);
    out.assign(vec4(lit.mul(K.bright).mul(a).add(ci.rgb.mul(ci.a).mul(float(1).sub(a))), float(1).sub(a).mul(float(1).sub(ci.a))));
  });
  return out;
}

// c: the frame so far. Returns it with cloud shadows on the land and the sky's clouds over it.
export function skyClouds(ctx, c) {
  const q = ctx.quality, high = q === "high" || q === "ultra", ultra = q === "ultra";
  const K = params(ctx);

  // cloud shadows: the land under a cloud loses its sun
  if (q !== "low") {
    const shT = ctx.target("aw-cloudshadow", { scale: high ? 0.25 : 0.125, format: "rgba8unorm" });
    const sh = ctx.pass(shT, (uv) => {
      const P = ctx.worldPosition(uv);
      const far = ctx.viewZAt(uv).negate().greaterThan(3000);
      const mid = K.base.add(K.thick.mul(0.3));
      const ps = P.add(sunDirection.mul(mid.sub(P.y).div(sunDirection.y.max(0.08))));
      const d = shape(K, vec3(ps.x, mid, ps.z), 3);
      const s = exp(d.mul(-4));
      const k = clamp(sunRadiance.y, 0, 1).mul(K.shadow);
      return vec4(vec3(far.select(float(1), mix(float(1), s, k))), 1);
    });
    c = c.mul(depthUpsample(ctx, sh, shT.size).r);
  }

  const W = ultra ? 512 : high ? 400 : 320, H = ultra ? 320 : high ? 256 : 180; // a touch taller than 16:9: far clouds are squashed flat, so rows matter more than columns
  const cT = ctx.target("aw-clouds", { width: W, height: H });
  const cl = ctx.pass(cT, (uv) => {
    const dir = ctx.worldPosition(uv).sub(cameraPosition).normalize();
    // a texel whose whole neighbourhood is near land draws no cloud: its march is skipped
    const t = vec2(1.5).div(vec2(W, H));
    const zf = min(min(ctx.viewZAt(uv.add(t)), ctx.viewZAt(uv.sub(t))), min(ctx.viewZAt(uv.add(vec2(t.x, t.y.negate()))), ctx.viewZAt(uv.add(vec2(t.x.negate(), t.y)))));
    const open = zf.negate().greaterThan(850);
    return high ? march(ctx, K, dir, ultra ? 22 : 16, 2, open, uv.mul(vec2(W, H)), ultra ? 22 : 16) : painted(ctx, K, dir, open);
  });
  // upsample: a rotated 8-tap tent about 1.5 buffer texels wide, so the march's per-texel jitter melts into
  // soft cloud instead of reading as blocks when one buffer texel covers 6+ screen pixels
  const hh = vec2(0.55).div(cT.size), hr = vec2(0.78, 0).div(cT.size), hv = vec2(0, 0.78).div(cT.size);
  const f = cl.sample(screenUV.add(hh)).add(cl.sample(screenUV.sub(hh)))
    .add(cl.sample(screenUV.add(vec2(hh.x, hh.y.negate())))).add(cl.sample(screenUV.add(vec2(hh.x.negate(), hh.y))))
    .add(cl.sample(screenUV.add(hr))).add(cl.sample(screenUV.sub(hr))).add(cl.sample(screenUV.add(hv))).add(cl.sample(screenUV.sub(hv))).mul(0.125);
  // only where the frame is open to the sky: near land keeps its crisp silhouette
  const open = smoothstep(900, 1400, ctx.viewZ.negate());
  return mix(c, c.mul(f.w).add(f.rgb), open);
}
