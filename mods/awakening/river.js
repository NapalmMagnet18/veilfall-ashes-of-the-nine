// Awakening river: Awakening Water (mods/awakening/water.js, the lake's own shader) with a moving-water layer.
// Everything the lake is, the river is: the same wind waves, rings, depth colour, refraction, caustics, mirror,
// Fresnel, glint and shore lace, so where the river meets the lake it is one water. What the river adds rides
// water.js's flow hooks and fades to nothing where the current dies:
//   slope:   the sheet's own tilt (a stepped, sloped ribbon, not a flat level) and a tileable ripple normal map
//            carried downstream by the current, stronger the faster it runs
//   rings:   carried off downstream (mods/awakening/river-surface.js writes r<i>u / r<i>w)
//   surface: whitewater revealed from a foam map by how torn the water is (the sheet's flow map), pale jade
//            aerated water under it
// Worn by a river sheet (mods/awakening/river-sheet.js): uv = (0..1 across, metres downstream);
//   flow map (vertex colours): r aeration, g speed (m/s ÷ 15), b sideways lean (0.5 straight downstream)
// params: water.js's own (set swell: 0 on a river), plus width (m, as the sheet's), white (whitewater
// strength), current (ripple strength in the flow), drift (m/s the detail travels)
import { plungeField } from "./lib/plunge.js";
import { vec2, vec3, float, exp, positionWorld, time, smoothstep, clamp, max, min, length, fract, uv, normalWorld, select, dFdx, dFdy, cross, vertexColor, inverseSqrt, dot, mix, normalize, mx_noise_float, mod, cameraPosition, floor, cos, sin, sqrt, Fn, If } from "builtin/tsl";
import { sunDirection, sunRadiance, ambientRadiance, sunVisibility } from "builtin/lighting";
import { material as water } from "./lib/water-material.js";
import { TRAIL_BODIES, BODIES } from "./lib/river-slots.js";
export { TRAIL_BODIES, BODIES } from "./lib/river-slots.js";
import { obstacle } from "./lib/wake.js";
import { bodies as trailBodies, standing } from "./lib/trail.js";
import { junctionBlend, junctionReceive, RIPPLE } from "./lib/junction.js";
export { TRAIL, WAVE_C } from "./lib/trail.js";
// the boulders' own trails, laid by the shader on the same rule as a wader's (lib/trail.js standing): which rocks
// reach each 0.5 m cell of the wake box (r, g = rock id 1..101, nearest first; 0 = none) and the rock table
// (three texels a rock: x cm hi/lo + z cm hi | z cm lo, U*50 m/s, R*100 m | heading hi/lo), both from the bake
const ROCK_IDX = "/cdn/value.659762dc788498fa0a0e855bf96ff8ebe295736ceda889dda6516971358c5191.png?data", IDX_W = 132, IDX_D = 613;
const ROCK_TAB = "/cdn/value.d8b9bf138808b48730307a42e929159450673678adbf33cf20f695aff9bbfb52.png?data", TAB_W = 512;

// the standing wakes of this river's boulders, baked from the sheet's rocks by lib/wake-shape.js (the same shape the
// shader draws round a wader), each at its own reach's speed: rg = surface slope (x, z) ±0.6, b = foam (collar,
// seams, arm crests), a = 0.5 + slick/2 − seam/2 (the calm lee tongue above 0.5, its torn edges below);
// box wakeX0, wakeZ0, wakeW, wakeD
const WAKE = "/cdn/value.c7b53f46b5f00506ab0e07fcb0b08161af5937ec023bf4e99ef9999d92bb31c0.png";
// RIPPLE (lib/junction.js): rgb = tangent normal, 1024² spectral, streaked along the flow; the plume a river
// throws into the water it joins carries the same map on

export function material(ctx) {
  const P = positionWorld, W = float(ctx.param("width", 9));
  const across = uv().x, along = uv().y.sub(positionWorld.y); // a drop's height counted in so a cascade face streams
  const q = vec2(across.sub(0.5).mul(W), along); // the sheet's own frame, metres
  const VC = vertexColor();
  const PL = plungeField(ctx); // a waterfall driving into this water (lib/plunge.js); null when unset
  const plA = PL ? PL.aer(positionWorld.xz) : null; // 0 … 1.6: past 1 the plunge beats the pool's own foam threshold
  const aer = (PL ? clamp(VC.x.add(plA), 0, 1) : clamp(VC.x, 0, 1)), mps = clamp(VC.y, 0, 1).mul(15), lean = clamp(VC.z, 0, 1).mul(2).sub(1);
  const fast = smoothstep(0.4, 3.5, mps);

  // the surface frame: the sheet's (across, along) directions in the world (cotangent frame)
  const dp1 = dFdx(P), dp2 = dFdy(P), dq1 = dFdx(q), dq2 = dFdy(q);
  const Nf0 = normalize(cross(dp1, dp2));
  const Nf = Nf0.mul(select(Nf0.y.lessThan(0), float(-1), float(1)));
  const Nb = normalize(normalWorld.mul(select(normalWorld.y.lessThan(0), float(-1), float(1)))); // the sheet's smooth tilt
  const p2 = cross(dp2, Nf), p1 = cross(Nf, dp1);
  const Tq = p2.mul(dq1.x).add(p1.mul(dq2.x)), Bq = p2.mul(dq1.y).add(p1.mul(dq2.y));
  const inv = inverseSqrt(max(dot(Tq, Tq), dot(Bq, Bq)).max(1e-12));
  const Ta = Tq.mul(inv), Ba = Bq.mul(inv);

  // one steady scroll down the sheet (no phase resets: those popped the foam); the bend round a boulder is a
  // still warp from the flow map's lean, the pattern parting round the rock and closing behind it
  const ripTex = ctx.texture(RIPPLE, { wrap: "repeat" });
  // the footprint of a pixel, smooth across the sheet: from the view distance and the sheet's interpolated
  // tilt, never from screen derivatives (those jump at every triangle edge on a stepped sheet and made
  // the detail and the foam switch on and off in blocks)
  const toEye = cameraPosition.sub(P), dist = length(toEye);
  const fpS = dist.mul(0.0009).div(max(dot(toEye.div(dist), Nb).abs(), 0.2)).max(0.0005);
  // the hand-over (lib/junction.js): over the last L metres before a junction line the river's own character
  // fades (hand = 0 → 1) and its params ease into the receiving water's (into_<name>), so on the line it IS that water
  const hand = junctionBlend(ctx, P.xz), recvOwn = junctionReceive(ctx, P.xz), keepOwn = float(1).sub(hand).mul(recvOwn);
  const fpOf = () => mix(fpS, max(length(dFdx(P.xz).abs().add(dFdy(P.xz).abs())), float(0.0005)), hand);
  const param = (n, d, at) => { const own = float(ctx.param(n, d)); return mix(own, float(ctx.param(`into_${n}`, d)), at ? junctionBlend(ctx, at) : hand); };
  const U = float(ctx.param("drift", 1.8));
  const base = q.sub(vec2(0, fract(U.mul(time).div(25.6)).mul(25.6))); // wrapped on 25.6 m, a whole number of every map's tile
  const at = base.add(vec2(lean.mul(0.8), 0));

  const wakeTex = ctx.texture(WAKE); // an unset box (wakeW 0) samples nothing: wake 0 turns it off
  const tt = mod(time, 3600);
  const wuv = P.xz.sub(vec2(ctx.param("wakeX0", 0), ctx.param("wakeZ0", 0))).div(vec2(ctx.param("wakeW", 1), ctx.param("wakeD", 1))).mul(vec2(1, -1)).add(vec2(0, 1));
  const wk = wakeTex.sample(wuv);
  const wakeS = wk.rgb.pow(0.4545); // rg slope (±0.6), b foam: the rocks' own
  const onRock = smoothstep(0.1, 0.8, mps).mul(ctx.param("wake", 1));
  const rockSlick = clamp(wk.a.sub(0.5).mul(2), 0, 1).mul(onRock), rockSeam = clamp(wk.a.sub(0.5).mul(-2), 0, 1).mul(onRock);
  // bodies in the water now: collar, V arms, slick and seams, live, from where each is this frame
  let bodyG = vec2(0, 0), bodyChurn = float(0), bodySlick = float(0), bodySeam = float(0);
  for (let i = 0; i < BODIES; i++) {
    const R = float(ctx.param(`b${i}r`, 0));
    // written by the wader's own machine every tick it moves (river-surface.js wade): drawn exactly there, no
    // guess ahead (the shader's clock is not the room's, so a carry-on by velocity threw the wake off the body)
    const at0 = vec2(ctx.param(`b${i}x`, 0), ctx.param(`b${i}z`, 0));
    const flow = vec2(ctx.param(`b${i}u`, 0), ctx.param(`b${i}w`, 0));
    const d = P.xz.sub(at0);
    const on = smoothstep(0.02, 0.05, R).mul(float(1).sub(smoothstep(30, 40, length(d))));
    const w = obstacle({ d, flow, R: R.max(0.05), depth: float(ctx.param("depth", 0.6)), slope: false });
    bodyG = bodyG.add(w.g.mul(on)); bodyChurn = max(bodyChurn, w.foam.mul(on));
    bodySlick = max(bodySlick, w.slick.mul(on)); bodySeam = max(bodySeam, w.seam.mul(on));
  }
  // the wave trail: the water's memory of where each wader has been (lib/trail.js); and the rocks' own, the same
  // rule laid by the shader for a body that never moves, so a boulder and a wader standing there are one pattern
  const trail = trailBodies(ctx, P.xz, tt, TRAIL_BODIES);
  const X0 = float(ctx.param("wakeX0", 0)), Z0 = float(ctx.param("wakeZ0", 0));
  const cell = floor(P.xz.sub(vec2(X0, Z0)).div(0.5));
  const ids = ctx.texture(ROCK_IDX).sample(vec2(cell.x.add(0.5).div(IDX_W), float(1).sub(cell.y.add(0.5).div(IDX_D))));
  const B = (v) => floor(v.mul(255).add(0.5));
  const tab = ctx.texture(ROCK_TAB);
  const rockOf = (idc) => { // everything read here, outside any branch; only the ripples sit behind the If
    const n = B(idc).sub(1).max(0).mul(3);
    const t0 = tab.sample(vec2(n.add(0.5).div(TAB_W), 0.5)), t1 = tab.sample(vec2(n.add(1.5).div(TAB_W), 0.5)), t2 = tab.sample(vec2(n.add(2.5).div(TAB_W), 0.5));
    const at0 = vec2(B(t0.x).mul(256).add(B(t0.y)).div(100).add(X0), B(t0.z).mul(256).add(B(t1.x)).div(100).add(Z0));
    const U = B(t1.y).div(50), R = B(t1.z).div(100).max(0.1);
    const hd = B(t2.x).mul(256).add(B(t2.y)).div(65535).mul(6.283185).sub(3.141593);
    const a0 = min(U.mul(0.5), float(1)).mul(smoothstep(0.05, 0.3, U)).mul(clamp(sqrt(R.div(0.3)), 1, 2.2)); // trail.js strength()
    return { at0, flow: vec2(cos(hd), sin(hd)).mul(U), a0, R, on: B(idc).greaterThan(0.5) };
  };
  const rA = rockOf(ids.x), rB = rockOf(ids.y);
  const rocksW = Fn(() => {
    const acc = vec3(0, 0, 0).toVar();
    If(rA.on, () => {
      acc.assign(standing(P.xz, tt, rA.at0, rA.flow, rA.a0, rA.R));
      If(rB.on, () => { const w2 = standing(P.xz, tt, rB.at0, rB.flow, rB.a0, rB.R); acc.assign(vec3(acc.x.add(w2.x), acc.y.add(w2.y), max(acc.z, w2.z))); });
    });
    return acc;
  })().mul(vec3(onRock, onRock, onRock));
  const trailG = vec2(trail.x, trail.y), trailFoam = trail.z;
  const rockTrailG = vec2(rocksW.x, rocksW.y);
  bodyChurn = max(bodyChurn, rocksW.z);
  bodyChurn = max(bodyChurn, trailFoam);
  const slickA = max(rockSlick, bodySlick), seamA = max(rockSeam, bodySeam);
  const slope = ({ fp }) => {
    // three octaves of one 1024² spectral map (3.2, 1.6, 0.8 m tiles: whole fractions of the 25.6 m wrap), each
    // held until its finest texel band nears a pixel, so close up the surface carries capillary detail
    const rs = (k, o) => ripTex.sample(at.div(k).add(o)).rg.pow(0.4545).mul(2).sub(1);
    const n1 = rs(3.2, 0), n2 = rs(1.6, 0.37), n3r = rs(0.8, 0.71);
    const nS = n1.mul(float(0.45).mul(float(1).sub(smoothstep(0.05, 0.2, fp).mul(0.7))))
      .add(n2.mul(0.32).mul(float(1).sub(smoothstep(0.02, 0.07, fp))))
      .add(n3r.mul(0.22).mul(float(1).sub(smoothstep(0.008, 0.03, fp))));
    const amp = float(ctx.param("current", 1)).mul(fast.mul(0.3).add(aer.mul(0.2)).add(smoothstep(0.05, 0.6, mps).mul(0.12))).mul(float(1).sub(smoothstep(0.2, 0.9, fp))).mul(float(1).sub(slickA.mul(0.8))); // the lee tongue runs glassy
    const d = Ta.mul(nS.x.mul(amp)).add(Ba.mul(nS.y.mul(amp))); // the tilt the ripple adds, in the world
    const tilt = vec2(Nb.x, Nb.z).div(max(Nb.y, 0.2)); // the sheet's own slope as water.js counts it (N = -sx, 1, -sz)
    let out = tilt.add(vec2(d.x, d.z)).negate();
    // the rocks' standing waves (still in the world: a steady stream past a still rock makes a still pattern)
    const shim = mx_noise_float(vec3(P.xz.mul(0.7).sub(vec2(0, tt.mul(0.6))), tt.mul(0.7))).mul(0.2).add(0.9); // the stream never quite steady
    // (the baked map keeps the rocks' collar, slick and seams; their waves are the trail above, never a still bake)
    const rockG = rockTrailG.mul(shim.mul(0.5).add(0.5)).mul(float(1).sub(smoothstep(0.03, 0.15, fp))); // under a pixel, gone like the waders'
    // the seams tear the mirror: short choppy boils where the slick shears against the stream
    const tq = P.xz.mul(3.1).sub(vec2(0, tt.mul(1.1)));
    const torn = vec2(mx_noise_float(vec3(tq, tt.mul(1.3))), mx_noise_float(vec3(tq.add(5.7), tt.mul(1.3)))).mul(seamA.mul(0.28)).mul(float(1).sub(smoothstep(0.03, 0.2, fp)));
    out = out.add(torn);
    const farFade = float(1).sub(smoothstep(0.25, 1.2, fp).mul(0.8)); // long waves read far off; they only soften
    out = out.add(rockG.add(bodyG.add(trailG.mul(float(1).sub(smoothstep(0.03, 0.15, fp)))).mul(ctx.param("bodyWake", 1))).mul(farFade));
    if (PL) out = out.add(PL.slope(P.xz));
    return out.mul(keepOwn);
  };

  // whitewater: churned foam, not a map. Three octaves of noise in the sheet's frame, stretched along the flow
  // (streaks), carried downstream at the drift speed and boiling in place over time (the third axis), with a
  // slow warp so no pattern repeats. How much of it passes the threshold is the flow map's aeration: a riffle
  // is a few trailing streaks, a chute churns nearly white. Edges are soft and widen with the pixel, and far
  // off the pattern melts into its own average cover, so nothing shimmers.
  const n3 = (p, z) => mx_noise_float(vec3(p, z));
  const sF = vec2(across.sub(0.5).mul(W), uv().y.sub(U.mul(tt)));
  const wq = sF.mul(vec2(0.22, 0.09));
  const sw = sF.add(vec2(n3(wq, tt.mul(0.08)).mul(0.55), n3(wq.add(7.3), tt.mul(0.08)).mul(0.25)));
  const plIso = PL ? smoothstep(0.35, 1.1, plA) : null; // how deep under a plunge's boil (lib/plunge.js)
  const oct = (k, o, z) => { const a = sw.mul(vec2(k, k * 0.3)).add(o), c = Math.cos(o), s = Math.sin(o);
    return n3(vec2(a.x.mul(c).sub(a.y.mul(s)), a.x.mul(s).add(a.y.mul(c))), tt.mul(z).add(a.x.mul(0.31))); };
  // a brink (river-sheet brink): where the sheet curls over a lip it is full-bodied water; between brinkY0 and
  // brinkY1 (world heights) air folds in (it whitens in streaks like the curtain) and it tears into falling ropes
  // and is gone, the waterfall curtain carrying on through the gaps
  const minThick = float(1).sub(smoothstep(0.35, 0.8, Nb.y)).mul(2.5);
  const bY0 = float(ctx.param("brinkY0", -99999)), bY1 = float(ctx.param("brinkY1", -100000)); // unset: every height sits above the band, fadeK 1, nothing torn or whitened
  const fadeK = clamp(P.y.sub(bY1).div(bY0.sub(bY1)), 0, 1);
  const bx = across.sub(0.5).mul(W);
  const rope = mx_noise_float(vec3(bx.mul(2.2), uv().y.sub(tt.mul(5.5)).mul(0.18), 3.1)).mul(0.55)
    .add(mx_noise_float(vec3(bx.mul(5.5).add(3.1), uv().y.sub(tt.mul(8.5)).mul(0.34), 8.3)).mul(0.3))
    .add(mx_noise_float(vec3(bx.mul(13).add(7.7), uv().y.sub(tt.mul(11)).mul(0.8), 5.2)).mul(0.15));
  const keep0 = smoothstep(0.15, 0.85, fadeK.mul(1.5).sub(0.25).add(rope.mul(0.45))); // a soft tear: ropes thin out over the band, no hard-edged teeth
  // under a waterfall's solid boil (param plTuck, in the plunge's ellipse units; 0 = off) the pool steps aside:
  // transparent layers draw in no promised order, and this water paints the screen behind it, so where the
  // boil stands the pool would erase it. The tuck sits well inside the boil's opaque core, its edge torn
  const tuckQ = float(ctx.param("plTuck", 0));
  const tuck = PL ? float(1).sub(smoothstep(tuckQ.mul(0.8), tuckQ, PL.qOf(P.xz.sub(vec2(float(ctx.param("plDX", 0)), float(ctx.param("plDZ", 1))).normalize().mul(float(ctx.param("plTuckA", 0))))).add(mx_noise_float(vec3(P.xz.mul(1.3), 2.7)).mul(0.12)))).mul(smoothstep(0.0, 0.02, tuckQ)) : float(0);
  const keep = keep0.mul(float(1).sub(tuck));
  const brinkWhite = float(1).sub(fadeK).pow(1.4).mul(smoothstep(-0.6, 0.6, rope.add(float(1).sub(fadeK).mul(0.5)).sub(0.2))).mul(0.75); // whitening arrives late and in streaks, as the curtain's does
  const surface = ({ surf, N, fp, depthV }) => {
    const churn = max(wakeS.b.mul(onRock), bodyChurn); // collars, seams and arm crests round rocks and waders
    const A0 = clamp(aer.mul(ctx.param("white", 1.4)).mul(float(1).sub(slickA.mul(0.55))).add(churn.mul(0.35)).add(n3(sF.mul(vec2(0.35, 0.18)).add(2.2), tt.mul(0.1)).mul(0.22)), 0, 1);
    const f2k = float(1).sub(smoothstep(0.06, 0.18, fp)), f3k = float(1).sub(smoothstep(0.025, 0.07, fp));
    const f3 = oct(5.5, 9.7, 1.4).mul(f3k);
    const rn = oct(0.9, 5.3, 0.5); const ridge = float(1).sub(rn.mul(rn).add(0.02).sqrt()).max(0).pow(3); // long trailing foam lines
    const billow = oct(1.0, 1.1, 0.45).mul(0.5).add(oct(2.4, 3.1, 0.8).mul(0.3).mul(f2k)).add(f3.mul(0.2)).mul(0.5).add(0.5).add(ridge.mul(0.22));
    const c = A0.pow(2.2).mul(0.75); // the share of the surface torn white
    const th = PL ? mix(float(0.85), float(0.5), c).sub(smoothstep(0.6, 1.6, plA).mul(0.4)) : mix(float(0.85), float(0.5), c); // a plunge drives the churn toward solid white
    // three bands, no edge: a thick core, a broken lace fringe round it, and thin scum streaks trailing out
    // into clear water where the aeration is only a trace
    const band = billow.sub(th);
    const lace = smoothstep(0.05, 0.45, oct(4.2, 2.6, 1.1).mul(0.5).add(f3.mul(0.5)));
    const core = smoothstep(0.02, 0.28, band);
    const fringe = smoothstep(-0.28, 0.04, band).mul(lace).mul(0.75);
    const scum = ridge.mul(smoothstep(0.02, 0.25, A0)).mul(float(1).sub(smoothstep(0.3, 0.7, A0).mul(0.5))).mul(0.45);
    let cover = max(max(core, fringe), scum);
    cover = mix(cover, c.mul(0.9).add(A0.mul(0.08)), smoothstep(0.12, 0.4, fp)); // far: the average, never a shimmer
    const dense = PL ? core.mul(0.4).add(0.5).add(smoothstep(0.8, 1.5, plA).mul(0.35)).min(1) : core.mul(0.4).add(0.5); // cores thick, fringes and streaks thin and see-through
    const foam = cover.mul(dense).mul(smoothstep(0.0, 0.12, A0)).mul(smoothstep(0.0, 0.05, depthV)); // the lake's shore lace owns the very edge
    const sunD = max(N.dot(sunDirection), 0).mul(sunVisibility(P));
    const foamLum = ambientRadiance.mul(1.1).add(sunRadiance.mul(sunD.mul(0.6).add(0.15))).dot(vec3(0.3, 0.59, 0.11));
    // foam relief: heaped cores catch the light, the hollows between bubbles sit in their own shade, and a
    // fine bubble grain (a fourth octave, held only close up) keeps it from reading as flat paint
    const f4k = float(1).sub(smoothstep(0.006, 0.02, fp));
    const bub = oct(13.0, 6.1, 2.2).mul(f4k);
    const relief = core.mul(0.22).add(billow.sub(th).clamp(-0.2, 0.3).mul(0.5)).add(f3.mul(0.1)).add(bub.mul(0.08));
    // a plunge's foam is heaped and boiling: big lumps catching light, deep folds between them, all rolling
    const boilR = PL ? oct(1.6, 2.2, 1.9).mul(0.55).add(oct(4.1, 8.3, 2.8).mul(0.3)).add(f3.mul(0.15)).mul(plIso) : float(0);
    const foamLit = vec3(foamLum).mul(relief.add(boilR.mul(0.45)).add(0.86).clamp(0.5, 1.2)).mul(PL ? plIso.mul(0.18).add(1) : float(1)).mul(vec3(0.95, 0.99, 1.03));
    const aerated = vec3(ambientRadiance.add(sunRadiance.mul(0.2)).dot(vec3(0.3, 0.59, 0.11))).mul(vec3(0.3, 0.42, 0.4)); // bubbly water glows pale jade
    const s0 = mix(surf, aerated, smoothstep(0.2, 0.9, A0).mul(0.22).mul(smoothstep(th.sub(0.4), th, billow)));
    // the collar and seam foam itself: a lace drawn straight from the wake, broken by the churn noise
    const wlace = churn.mul(smoothstep(-0.15, 0.35, oct(3.4, 4.4, 1.6).mul(0.6).add(f3.mul(0.4)).add(churn.mul(0.6).sub(0.3))));
    let outC = mix(s0, foamLit, max(foam, wlace.mul(0.9).mul(smoothstep(0.0, 0.05, depthV))));
    // the brink whitening: torn streaks lit like the curtain's foam (waterfall.js), so the tear meets white on white
    const sunL = dot(sunRadiance, vec3(0.2126, 0.7152, 0.0722));
    const bSky = max(ambientRadiance, vec3(0.44, 0.52, 0.62).mul(sunL));
    const bFoam = bSky.mul(1.05).add(mix(vec3(sunL), sunRadiance, 0.35).mul(0.38).mul(sunVisibility(P)));
    outC = mix(outC, bFoam.mul(rope.mul(0.3).add(0.85)), brinkWhite);
    return mix(outC, surf, float(1).sub(keepOwn));
  };

  const above = dot(cameraPosition.sub(P), Nb).greaterThan(0); // the side of the tilted sheet, not the eye's height
  return water(ctx, { slope, surface, ringDrift: true, fp: fpOf, above, param, minThick, keep, heave: PL ? PL.heave : undefined });
}
