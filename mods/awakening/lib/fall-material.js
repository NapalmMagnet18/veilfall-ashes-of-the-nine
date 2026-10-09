// Awakening waterfall material, shared by the curtain (waterfall.js, see-through) and its boil
// (waterfall-boil.js, solid froth that writes depth so the pool can never paint over it). Two files, not one
// param: a scripted material is built once per script, so a param can't switch its depth or blend flags.
import { vec2, vec3, float, positionWorld, cameraPosition, normalize, time, mix, smoothstep, clamp, max, min, abs, uv, vertexColor, normalWorld, dot, floor, sqrt, dFdx, dFdy, cross, exp } from "builtin/tsl";
import { sunDirection, sunRadiance, ambientRadiance, sunVisibility } from "builtin/lighting";
import { MeshBasicNodeMaterial, DoubleSide } from "builtin/three";
import { plungeField } from "./plunge.js";

const STREAKS = "/cdn/value.3b79a4184329c179f51ce43f88299c169c2ad25bf82154d350bb0ac2ba333eca.png?data";
const G = 9.81;

export function fallMaterial(ctx, solid = false) {
  const m = new MeshBasicNodeMaterial();
  const P = positionWorld, VC = vertexColor();
  const aer = clamp(VC.x, 0, 1), fall = clamp(VC.z, 0, 1);
  const L = floor(uv().x.div(10).add(0.001));
  const ge = (k) => smoothstep(k - 0.6, k - 0.4, L); // L is a whole number per layer: a clean 0/1 mask each
  const isBack = float(1).sub(ge(1)), isCore = float(1).sub(ge(2)), isVeil = ge(2).sub(ge(3)), isRope = ge(3).sub(ge(4)), isSkirt = ge(4);
  const W = float(ctx.param("width", 5)), v0 = float(ctx.param("v0", 2.4)), u = uv().x.sub(L.mul(10)), v = uv().y, e = u.mul(2).sub(1);
  const tt = time.mod(3600), S = float(ctx.param("scroll", 1));
  // flight time: from the speed the vertex carries; upstream of the lip, the tongue's own metres at v0
  const speed = clamp(VC.y, 0, 1).mul(20);
  const tf = sqrt(max(speed.mul(speed).sub(v0.mul(v0)), 0)).div(G).add(min(v, 0).div(v0));
  const seed = L.mul(0.371);
  const across = mix(u.mul(W).div(4), u.mul(0.22), isRope).add(seed).add(isRope.mul(v.mul(0.013)));
  const along = tf.sub(tt.mul(S)).mul(0.95).add(seed.mul(2.3));
  const tex = ctx.texture(STREAKS, { wrap: "repeat" });
  const A = tex.sample(vec2(across, along)), B = tex.sample(vec2(across.mul(2.3).add(0.37), along.mul(1.9).add(0.51)));
  const lane = tex.sample(vec2(across.mul(0.28).add(0.13), along.mul(0.22).add(0.61))).y; // big slow lanes: where the lip pours more
  const streak = A.x.mul(0.45).add(A.y.mul(0.2)).add(B.x.mul(0.15)).add(lane.mul(0.35)).sub(0.575).mul(1.7).add(0.5); // re-spread: a sum of taps crowds the middle
  // white: arrives in streaks (the long r lines first), then packets, then all of it
  const th = float(1.1).sub(aer.mul(0.62)).sub(fall.mul(fall).mul(0.25));
  const white = smoothstep(th.sub(0.14), th.add(0.14), streak).max(aer.pow(4).mul(fall).mul(0.55)).mul(mix(float(1), float(0.9), isVeil));
  // breakup: holes open as the sheet thins toward the pool, the edges fray into jets
  const hole = A.z.mul(0.65).add(B.z.mul(0.35));
  const edge = abs(e);
  const fray = smoothstep(0.5, 1.0, edge.add(hole.sub(0.5).mul(0.6)).add(lane.sub(0.5).mul(0.35)).add(fall.mul(0.12))).mul(isCore);
  const gaps = smoothstep(-0.08, 0.1, hole.sub(fall.mul(fall).mul(0.62)).sub(isBack.mul(-0.1)));
  const lipIn = smoothstep(float(ctx.param("lipIn0", -0.35)), float(ctx.param("lipIn1", 0.25)), v);
  // the foot: every layer melts into the boil over the same band just above the pool (world y), so nothing hangs
  // over the water at its own height. Torn a little by the streaks, never ruled, never ragged by a metre
  const poolY = float(ctx.param("poolY", -1e4)), footBand = float(ctx.param("footBand", 1.6));
  // the pool's live surface where this pixel stands: its level, the plunge dome it heaves (the same lib/plunge.js
  // field the pool's own material reads) and the sheet's boil bump (river-sheet.js). Everything here fades by
  // its height over THAT, so where the boil or a ribbon meets the water it dissolves into the pool's foam
  // instead of being cut by a ruled line where the heaving surface crosses it
  const PLf = plungeField(ctx);
  const bxz = vec2(float(ctx.param("boilX", 0)), float(ctx.param("boilZ", 0))), bR = float(ctx.param("boilR", 1)).max(0.1);
  const bRr = P.xz.sub(bxz).length().div(bR);
  const surf = poolY.add(PLf ? PLf.heave(P.xz) : float(0)).add(float(ctx.param("boilK", 0)).mul(0.12).mul(exp(bRr.mul(bRr).mul(-1.5)))).add(0.04);
  const hOver = P.y.sub(surf).add(hole.sub(0.5).mul(0.35)).add(lane.sub(0.5).mul(0.2));
  const foot = poolY.lessThan(-9e3).select(
    float(1).sub(smoothstep(float(ctx.param("footFade", 0.9)), 1.0, fall.add(hole.sub(0.5).mul(0.12)).add(lane.sub(0.5).mul(0.08)))),
    smoothstep(float(0.15), footBand, hOver));
  const glassA = mix(float(0.97), float(0.62), smoothstep(0.4, 1.6, tf)); // full-bodied over the lip, thinning as air folds in
  const coreA = mix(glassA, float(0.97), white).mul(mix(float(1), gaps, aer)).mul(float(1).sub(fray)).mul(lipIn).mul(mix(float(1), float(0.75), isBack));
  const veilA = smoothstep(0.42, 0.78, streak.mul(0.7).add(B.w.mul(0.3))).mul(0.34).mul(smoothstep(0.04, 0.22, fall)).mul(float(1).sub(smoothstep(0.72, 1.0, edge.add(hole.sub(0.5).mul(0.4)))));
  const rim = float(1).sub(e.mul(e));
  const ropeA = smoothstep(0.3, 0.62, rim.mul(0.65).add(streak.mul(0.55))).mul(0.92).mul(aer).mul(float(1).sub(smoothstep(0.86, 1.0, fall)));
  // the boil: two taps flowing outward at different speeds, sheared across so it never reads as a scroll
  const sk1 = tex.sample(vec2(u.mul(3.1).add(v.mul(0.05)), v.mul(0.16).sub(tt.mul(0.42)))), sk2 = tex.sample(vec2(u.mul(5.3).sub(tt.mul(0.03)).add(0.41), v.mul(0.31).sub(tt.mul(0.8)).add(0.27)));
  const boil = sk1.y.mul(0.5).add(sk2.x.mul(0.3)).add(sk2.w.mul(0.2));
  const cov = aer, core2 = clamp(VC.y, 0, 1);
  // froth: solid over the impact, breaking into rafts and then long drifting streaks of foam out over the pool
  const rafts = tex.sample(vec2(u.mul(1.3).add(0.7), v.mul(0.07).sub(tt.mul(0.12)))).y;
  const th2 = float(0.9).sub(cov.mul(0.8)).add(rafts.sub(0.5).mul(0.35));
  const skW = smoothstep(th2.sub(0.12), th2.add(0.12), boil.add(core2.mul(0.35)));
  const skirtA = skW.mul(mix(float(0.7), float(0.97), core2)).add(cov.mul(0.18)).mul(smoothstep(0.0, 0.4, cov.add(rafts.sub(0.5).mul(0.25)))); // the rim frays by the raft map, so its line is torn, not drawn
  const touch = solid ? float(1) : poolY.lessThan(-9e3).select(float(1), smoothstep(float(0.0), float(0.32), P.y.sub(surf).add(boil.sub(0.5).mul(0.18)))); // the boil's contact with the water: torn by its own froth. The solid skirt skips it: its depth meets the pool, and a height fade here erased the whole slick lying a hand above the water
  let alpha = coreA.mul(isCore).add(veilA.mul(isVeil)).add(ropeA.mul(isRope)).mul(foot).add(skirtA.mul(isSkirt).mul(touch));
  // light: foam scatters every way; glassy water shows its dark body and the sky
  const V = normalize(cameraPosition.sub(P));
  const N0 = normalize(normalWorld), N1 = N0.mul(dot(N0, V).sign().max(-1).add(float(0.0001)).sign());
  // foam relief: bump the shading normal by the streak map (surface-gradient bump from screen derivatives)
  const h = streak.mul(0.7).add(B.w.mul(0.3)).mul(white.mul(0.8).add(0.2)).mul(float(ctx.param("bump", 0.09)));
  const dpx = dFdx(P), dpy = dFdy(P), r1 = cross(dpy, N1), r2 = cross(N1, dpx), det = dot(dpx, r1);
  const grad = r1.mul(dFdx(h)).add(r2.mul(dFdy(h))).mul(det.sign());
  const Nf = normalize(N1.mul(abs(det).max(1e-9)).sub(grad));
  alpha = alpha.add(float(1).sub(abs(dot(N1, V))).pow(3).mul(0.3).mul(isCore).mul(float(1).sub(fray)).mul(lipIn).mul(foot));
  const vis = sunVisibility(P);
  const back = max(dot(V, sunDirection.negate()), 0).pow(6).mul(0.9); // the sun behind it: the sheet glows
  const sunL = dot(sunRadiance, vec3(0.2126, 0.7152, 0.0722));
  const sky = max(ambientRadiance, vec3(0.44, 0.52, 0.62).mul(sunL)); // the gorge's open sky still lights shaded foam
  const sunFace = dot(Nf, sunDirection).mul(0.5).add(0.5).pow(1.5);
  const skyFace = Nf.y.mul(0.25).add(0.8);
  const graze = float(1).sub(abs(dot(Nf, V))).pow(2);
  const foamLit = sky.mul(1.05).mul(skyFace).mul(mix(float(0.78), float(1.08), float(1).sub(graze))).add(mix(vec3(sunL), sunRadiance, 0.35).mul(float(0.18).add(sunFace.mul(0.6)).add(back)).mul(vis));
  const body = vec3(0.06, 0.13, 0.12).mul(sky.add(sunRadiance.mul(vis).mul(0.25)));
  const fres = float(1).sub(abs(dot(Nf, V))).pow(4).mul(0.6).add(0.04);
  const glassHi = sky.mul(fres.add(smoothstep(0.55, 0.9, A.x).mul(0.18))); // sky in the glassy ribbing
  const shade = mix(float(0.6), float(1.08), smoothstep(0.2, 0.85, streak)).mul(B.w.mul(0.16).add(0.92)).mul(mix(float(0.8), float(1.1), lane)); // packets heaped, lanes between in their own shade, the big pours brighter // packets heaped, lanes between in their own shade
  // seen from below, the glassy tongue is lit from behind by the open sky: it glows, never a dark notch in the white
  const under = smoothstep(0.05, -0.45, V.y);
  const glass = mix(body.add(glassHi), sky.mul(0.95).add(sunRadiance.mul(vis).mul(0.12)), under.mul(0.8));
  let col = mix(glass, foamLit.mul(shade), white);
  const skShade = mix(float(0.66), float(1.06), smoothstep(0.3, 0.9, boil)).mul(mix(float(0.85), float(1.05), core2));
  col = mix(col, foamLit.mul(skShade), isSkirt);
  col = col.mul(mix(float(1), float(0.84), isBack)).mul(mix(float(1), float(0.96), isVeil));
  const dbg = float(ctx.param("debug", 0));
  m.colorNode = mix(col, vec3(aer, fall, white), clamp(dbg, 0, 1));
  // part "skirt": the boil stands as solid froth that writes its depth, so a water drawn after it (the pool
  // paints the screen behind it and may draw in any order) can never cover it. Its fade becomes a torn edge:
  // each pixel keeps or drops against the bubble grain, and the pool fills the dropped ones
  m.opacityNode = solid ? smoothstep(float(0.0), float(0.08), alpha.mul(1.5).sub(B.w.mul(0.35).add(streak.mul(0.2))).sub(0.4)).mul(float(1).sub(isSkirt).max(isSkirt)) : clamp(alpha, 0, 1); // kept wherever the boil is froth, torn only where it thins to rafts
  m.transparent = !solid;
  if (solid) m.alphaTest = 0.5;
  m.depthWrite = solid;
  m.side = DoubleSide;
  return m;
}
