// Awakening water: the surface itself. Worn by a water sheet (mods/awakening/water-sheet.js) standing at a
// lake's level, with mods/awakening/water-surface.js as its behaviour writing the interaction ripples.
//   waves: ten directional wave trains riding the place's wind (longest a gentle swell, shortest a capillary
//          ripple), each fading out as its wavelength shrinks under a pixel, so the far water goes glassy
//          instead of breaking into grain; cat's-paw gusts roll across with the wind; rain pocks it.
//   light: screen-space refraction, Beer-Lambert depth colour, caustics on the bed, a screen-space mirror of
//          the shore and peaks (sky beyond the screen's edge), Fresnel, a sun glint that widens with distance.
//   touch: SLOTS ripple rings (params r<i>x, r<i>z, r<i>t, r<i>a: world x/z, birth on the shader clock, strength)
//          expanding from where something struck or moved through the water.
// params: chop, micro, refract, ssr, reflectDistance, glint, sky, foam, lap (shore foam lines), shallow
// (green lift over a shallow bed), swell, interact, deep (tint distance m), glacial (0..1 toward turquoise)
import { vec2, vec3, vec4, float, color, positionWorld, cameraPosition, normalize, time, mix, smoothstep, clamp, max, exp, fwidth, screenUV, viewportSharedTexture, depthFade, cameraProjectionMatrix, cameraViewMatrix, mx_noise_float, reflect, length, mod, select, hash, fract, floor, step } from "builtin/tsl";
import { sunDirection, sunRadiance, ambientRadiance, windDirection, windSpeed, windTravel, rain, sunVisibility } from "builtin/lighting";
import { waterFresnel, waterFoam, waterCaustics, waterTransmittance, waterMedium, waterRippleSlope } from "builtin/water";
import { MeshBasicNodeMaterial, DoubleSide } from "builtin/three";
import { positionLocal, modelWorldMatrix } from "builtin/tsl";
import { SWELL, SQUALL } from "./swell.js";
import { bodies as trailBodies } from "./trail.js";
import { junctions, junctionBlend } from "./junction.js";
export const LAKE_TRAILS = 3; // still water's wave trails (lib/trail.js): two swimmers and a boat

export const SLOTS = 24;
const G = 9.81, TENSION = 7.3e-5, TAU = Math.PI * 2;
// [wavelength m, heading off the wind in degrees, slope (amplitude x k), phase]
const WAVES = [
  [7.9, -8, 0.035, 0.0], [5.3, 21, 0.04, 1.7], [3.4, -33, 0.05, 4.1], [2.3, 12, 0.055, 2.2], [1.55, -47, 0.06, 5.3],
  [1.05, 38, 0.06, 0.9], [0.71, -18, 0.055, 3.6], [0.47, 57, 0.05, 1.2], [0.31, -62, 0.045, 4.8], [0.2, 29, 0.04, 2.9],
];

// quality tiers, per viewer (a phone is always "low"). Every tier keeps the swell, all SLOTS rings, the depth
// colour, Fresnel, glint and shore foam, so what happens on the water reads the same on every machine;
// the tiers trade away the fine detail a weak GPU pays most for.
//   waves: how many wind trains (of 10, finest dropped first; low keeps every other one, a bit steeper)
//   micro: the finest filtered ripple · rain: rain rings · caustics: light on the bed · ssr: mirrored shore
export const TIERS = {
  ultra:  { waves: 10, micro: true,  rain: true,  caustics: true,  ssr: true },
  high:   { waves: 10, micro: true,  rain: true,  caustics: true,  ssr: true },
  medium: { waves: 8,  micro: true,  rain: false, caustics: false, ssr: true },
  low:    { waves: 5,  micro: false, rain: false, caustics: false, ssr: false },
};
export const tierOf = (ctx) => (ctx.device?.class === "mobile" ? "low" : TIERS[ctx.quality] ? ctx.quality : "high");

// flow (optional, from a moving-water material such as river.js; the lake passes none and is unchanged):
//   slope({ P, fp }) → vec2 added to the surface slope (sx, sz): a sloped sheet's own tilt, advected detail
//   ringDrift: true → rings read r<i>u / r<i>w (m/s) and are carried off by the current
//   above → bool node: the eye is on the sheet's upper side (a river climbing past eye height is still seen from above)
//   surface({ surf, N, V, P, fp, depthV, thick, body, refl, F }) → the lit surface colour with its layer on top
//   param(name, default, xz) → a param that varies over the surface (a tributary easing into the water it joins)
//   heave(xzWorld) → a height node the vertices add (a waterfall plunge's boil, lib/plunge.js)
// junctions (lib/junction.js, every water, the lake too): j<i>* params hand one water over to another at a line;
// unset, they change nothing
export function material(ctx, flow) {
  const m = new MeshBasicNodeMaterial();
  const T = TIERS[tierOf(ctx)], lite = T.waves < 10 && !T.ssr;
  const P = positionWorld, xz = P.xz;
  const par = flow?.param ? (n, d, at = xz) => flow.param(n, d, at) : (n, d) => ctx.param(n, d);
  const fp = flow?.fp ? flow.fp(P) : max(length(fwidth(xz)), float(0.0005)); // metres one pixel spans here (a sloped sheet passes a smooth one)
  const wd = windDirection;
  // the squall (swell.js squall(), same clock): only amplitudes follow it, never directions or travel
  const sqPh = mod(mod(time, 3600), SQUALL.period).div(SQUALL.length);
  const squallS = clamp(sqPh, 0, 1).mul(Math.PI).sin().max(0).pow(2).mul(par("squall", 0)); // optional: squall: 1
  const windV = windSpeed.add(squallS.mul(SQUALL.extra));
  const tq0 = mod(time, 3600);
  const J = junctions(ctx, xz, tq0, fp, { lite }); // where this water meets another: ownership, plume, hand-over
  const wind = clamp(windV.div(6), 0.3, 1.3).mul(par("chop", 1)).mul(J.calm);
  const gust = mx_noise_float(vec3(xz.sub(windTravel.mul(0.35)).mul(0.03), time.mul(0.03))).mul(0.7).add(0.8);

  // the swell: real height. The vertices ride it (positionNode) and its slope joins the normal below.
  const swAt = (at) => float(par("swell", 1, at)).mul(clamp(windV.div(3), 0.6, 3)); // windSwell() in swell.js
  const sw = swAt(xz);
  const tq = mod(time, 3600);
  const swellAt = (q, swq = sw) => {
    let h = float(0), gx = float(0), gz = float(0);
    for (const s of SWELL) {
      const ph = q.x.mul(s.k * s.dx).add(q.y.mul(s.k * s.dz)).sub(tq.mul(s.w)).add(s.ph);
      h = h.add(ph.sin().mul(s.a)); const c = ph.cos().mul(s.a * s.k);
      gx = gx.add(c.mul(s.dx)); gz = gz.add(c.mul(s.dz));
    }
    return { h: h.mul(swq), gx: gx.mul(swq), gz: gz.mul(swq) };
  };
  const wpos = modelWorldMatrix.mul(vec4(positionLocal, 1)).xz;
  const lift = swellAt(wpos, flow?.param ? swAt(wpos) : sw).h;
  m.positionNode = positionLocal.add(vec3(0, flow?.heave ? lift.add(flow.heave(wpos)) : lift, 0)); // flow.heave: a height the flow adds (a plunge's boil)
  const sl = swellAt(xz);
  let sx = sl.gx, sz = sl.gz;
  if (flow?.slope) { const e = flow.slope({ P, fp }); sx = sx.add(e.x); sz = sz.add(e.y); }
  sx = sx.add(J.slope.x); sz = sz.add(J.slope.y);
  const waves = T.waves >= 10 ? WAVES : T.waves <= 5 ? WAVES.filter((_, i) => i % 2 === 0) : WAVES.slice(0, T.waves);
  for (const [L, ang, st, ph] of waves) {
    const k = TAU / L, w = Math.sqrt(G * k + TENSION * k * k * k);
    const c = Math.cos((ang * Math.PI) / 180), s = Math.sin((ang * Math.PI) / 180);
    const d = vec2(wd.x.mul(c).sub(wd.y.mul(s)), wd.x.mul(s).add(wd.y.mul(c)));
    const phase = d.dot(xz).mul(k).sub(time.mul(w)).add(ph);
    const fade = float(1).sub(smoothstep(L * 0.1, L * 0.4, fp)); // under a pixel: gone, never grain
    const a = float(st * (lite ? 1.4 : 1)).mul(wind).mul(L < 2.5 ? gust : 1).mul(fade).mul(phase.cos());
    sx = sx.add(d.x.mul(a)); sz = sz.add(d.y.mul(a));
  }
  // the finest wind ripple, the engine's filtered pattern
  if (T.micro) {
  const micro = waterRippleSlope(xz, time, 1, wd, 0.05, gust).mul(par("micro", 0.35)).mul(J.calm).mul(float(1).sub(smoothstep(0.02, 0.12, fp)));
  sx = sx.add(micro.x); sz = sz.add(micro.y);
  }

  // rings: whatever struck or moved through the water
  const near = float(1).sub(smoothstep(0.08, 0.3, fp));
  const inter = par("interact", 1);
  let foamR = float(0);
  for (let i = 0; i < SLOTS; i++) {
    let rp = vec2(ctx.param(`r${i}x`, 0), ctx.param(`r${i}z`, 0));
    const a = ctx.param(`r${i}a`, 0);
    const age = mod(time.sub(ctx.param(`r${i}t`, -500)).add(3600), 3600);
    if (flow?.ringDrift) rp = rp.add(vec2(ctx.param(`r${i}u`, 0), ctx.param(`r${i}w`, 0)).mul(age));
    const dv = xz.sub(rp), dd = length(dv).add(0.001);
    const R = age.mul(0.9).add(0.08), wdt = age.mul(0.2).add(0.22);
    const x = dd.sub(R).div(wdt);
    const env = exp(x.mul(x).negate()).mul(a).mul(exp(age.mul(-0.32))).mul(R.add(0.5).inverseSqrt());
    const k = float(13).div(age.mul(0.12).add(1));
    const sl = env.mul(k.mul(dd.sub(R)).cos()).mul(k).mul(0.045);
    sx = sx.add(dv.x.div(dd).mul(sl).mul(inter).mul(near)); sz = sz.add(dv.y.div(dd).mul(sl).mul(inter).mul(near));
    foamR = foamR.add(env.mul(exp(age.mul(-1.4))));
  }
  if (!flow) { // still water: the swimmers' and the boat's wave trails, the river's rule with no current to carry them
    const tr = trailBodies(ctx, xz, tq, LAKE_TRAILS, { drift: false });
    const tf = float(1).sub(smoothstep(0.03, 0.15, fp)).mul(inter);
    sx = sx.add(tr.x.mul(tf)); sz = sz.add(tr.y.mul(tf)); foamR = foamR.add(tr.z.mul(0.5));
  }
  if (T.rain) { // rain: rings pocking the surface, as many as it rains
    const rc = xz.mul(1.3), cell = floor(rc), f = fract(rc).sub(0.5);
    const h = hash(cell.x.mul(157.1).add(cell.y.mul(311.7)));
    const tt = time.mul(1.7).add(h.mul(10)), cyc = floor(tt), age = fract(tt);
    const h2 = hash(cell.x.mul(13.7).add(cell.y.mul(71.3)).add(cyc.mul(1.618)));
    const off = vec2(hash(h2.mul(91.1)), hash(h2.mul(37.7))).sub(0.5).mul(0.45);
    const dv = f.sub(off), dd = length(dv).add(0.001), R = age.mul(0.32);
    const y = dd.sub(R).div(0.035);
    const ring = exp(y.mul(y).negate()).mul(float(1).sub(age)).mul(step(h2, rain.mul(0.8))).mul(near);
    sx = sx.add(dv.x.div(dd).mul(ring).mul(0.5)); sz = sz.add(dv.y.div(dd).mul(ring).mul(0.5));
  }

  const above = flow?.above ?? cameraPosition.y.greaterThan(P.y); // a sloped sheet says which side the eye is on
  const N0 = normalize(vec3(sx.negate(), 1, sz.negate()));
  const N = select(above, N0, N0.mul(vec3(1, -1, 1)));
  const toCam = cameraPosition.sub(P), dist = length(toCam), V = toCam.div(dist);
  let thick = depthFade(30).mul(30); // metres of water behind this pixel, along the view
  if (flow?.minThick) thick = max(thick, flow.minThick); // a pouring face is never a shoreline: rock right behind a brink is not a shallow

  // what lies under it: bent, darkened with depth, lit by caustics near the shallows
  const bend = N.xz.mul(par("refract", 0.03)).mul(smoothstep(0.0, 1.5, thick)).div(dist.mul(0.04).add(1));
  const plain = viewportSharedTexture(screenUV).rgb;
  let behind = viewportSharedTexture(screenUV.add(bend)).rgb;
  if (T.caustics) {
    const bed = P.sub(V.mul(thick));
    const caust = waterCaustics(bed.xz, time).mul(exp(thick.div(-3))).mul(sunVisibility(P)).mul(0.9);
    behind = behind.mul(caust.add(1));
  }
  const glacial = par("glacial", 0); // 0 the valley's green water, 1 a cold turquoise plunge pool (optional)
  const tint = mix(color("#3f8c8a"), color("#2f9fc2"), glacial); // linear tint a white stone takes through `deep` metres
  const trans = waterTransmittance(tint, par("deep", 3.5), thick);
  const lightIn = ambientRadiance.add(sunRadiance.mul(max(sunDirection.y, 0).mul(0.3)));
  const scatter = mix(vec3(0.035, 0.105, 0.11), vec3(0.03, 0.11, 0.16), glacial).mul(lightIn).mul(par("scatter", 1));
  let body = waterMedium(behind, trans, scatter);
  // depth colour: the straight-down depth (the view path shortened by the angle), so a shallow shelf reads
  // shallow from any angle; light bouncing off a pale bed lifts the shallows toward green-turquoise
  const depthV = thick.mul(max(V.y, 0.06));
  const shallowK = float(1).sub(smoothstep(0.0, 1.6, depthV));
  body = body.add(lightIn.mul(mix(vec3(0.035, 0.08, 0.062), vec3(0.03, 0.09, 0.1), glacial)).mul(shallowK).mul(par("shallow", 1)));

  // what it mirrors: the screen where it can, the sky where it can't
  const Rv = reflect(V.negate(), N), Ry = max(Rv.y, 0.02);
  const sky = ambientRadiance.mul(mix(vec3(1.2, 1.15, 1.08), vec3(0.75, 0.92, 1.3), Ry.sqrt())).mul(par("sky", 1.3));
  let refl = sky;
  if (T.ssr) {
    const Q = P.add(vec3(Rv.x, Ry, Rv.z).mul(par("reflectDistance", 70)));
    const clip = cameraProjectionMatrix.mul(cameraViewMatrix).mul(vec4(Q, 1));
    const ndc = clip.xy.div(clip.w);
    const suv = vec2(ndc.x.mul(0.5).add(0.5), ndc.y.mul(-0.5).add(0.5));
    const edge = smoothstep(0, 0.05, suv.x).mul(float(1).sub(smoothstep(0.95, 1, suv.x)))
      .mul(smoothstep(0, 0.06, suv.y)).mul(smoothstep(0.0, 0.03, screenUV.y.sub(suv.y))).mul(step(0, clip.w));
    refl = mix(sky, viewportSharedTexture(suv).rgb, edge.mul(par("ssr", 1)));
  }
  // cat's-paws: where a gust is on the water it roughens and mirrors less, so dark patches sweep downwind
  const paw = smoothstep(1.0, 1.4, gust).mul(clamp(windV.sub(4).div(6), 0, 1));
  const F = waterFresnel(N.dot(V).abs(), 0.02).mul(0.9).add(0.06).mul(float(1).sub(paw.mul(0.35)));
  const shin = mix(float(1400), float(160), smoothstep(0.01, 0.5, fp));
  const glint = sunRadiance.mul(max(Rv.dot(sunDirection), 0).pow(shin)).mul(shin.mul(0.0022)).mul(sunVisibility(P)).mul(par("glint", 1));

  // shore: a faint, broken lace where it touches, and soft foam patches that drift in from 35 cm deep and
  // thin out on the sand: wide falloffs and noise breakup, so nothing reads as a drawn line
  const lapN = mx_noise_float(vec3(xz.mul(0.16), time.mul(0.04)));
  const lace = mx_noise_float(vec3(xz.mul(1.7), time.mul(0.12))).mul(0.5).add(0.5);
  const lacey = smoothstep(0.35, 0.85, lace);
  const lap = (off) => {
    const ph = fract(time.mul(0.11).add(off).add(lapN.mul(0.35)));
    const x = depthV.sub(float(1).sub(ph).mul(0.35)).div(0.09);
    return exp(x.mul(x).negate()).mul(ph.mul(Math.PI).sin().mul(float(1).sub(ph)));
  };
  const laps = lap(0).add(lap(0.5)).mul(lacey).mul(par("lap", 1));
  const shoreline = float(1).sub(smoothstep(0.0, 0.18, depthV)).mul(lacey.mul(0.7).add(0.3));
  const foamAmt = shoreline.mul(0.7).add(laps.mul(0.6)).mul(par("foam", 0.5)).add(foamR.mul(0.6));
  // whitecaps: past ~6 m/s the swell's crests break where a gust is pushing them, broken up by noise
  const crest = smoothstep(0.3, 0.8, sl.h.div(sw.mul(0.093).add(0.001)));
  const caps = crest.mul(smoothstep(0.75, 1.2, gust)).mul(smoothstep(5, 10, windV)).mul(smoothstep(0.3, 0.75, lace));
  const foam = waterFoam(xz, time, wd.mul(0.12), foamAmt.add(caps.mul(1.2)), 1.3);
  const foamLit = ambientRadiance.mul(0.75).add(sunRadiance.mul(max(sunDirection.y, 0).mul(0.3)));
  let surf = mix(body, refl, F).add(glint);
  surf = mix(surf, foamLit, foam.mul(0.55));
  if (flow?.surface) surf = flow.surface({ surf, N, V, P, fp, depthV, thick, body, refl, F });
  surf = mix(surf, foamLit.mul(1.25), J.foam.mul(0.6)); // a junction's plume scum, the same on both sides of the line
  // melts into the shore, and the edge swashes: it creeps up the sand and slides back every ~9 s
  const swash = time.mul(0.69).add(lapN.mul(2)).sin().mul(0.5).add(0.5).mul(0.03);
  const onTop = mix(plain, surf, smoothstep(0.0, 0.22, thick).mul(smoothstep(0.0, 0.03, depthV.add(swash).sub(0.012))));
  const under = behind.mul(vec3(0.55, 0.8, 0.82)).add(scatter.mul(0.5));
  m.colorNode = select(above, onTop, under);
  m.opacityNode = flow?.keep ? J.keep.mul(flow.keep) : J.keep; // a junction's other side belongs to the other water; a flow may tear its own end
  m.alphaTest = 0.5;
  m.transparent = true;
  m.depthWrite = true;
  m.side = DoubleSide;
  return m;
}
