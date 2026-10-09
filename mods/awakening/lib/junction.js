// Awakening water junction: one rule for any two waters that meet (a river into a lake, a stream into a river,
// a spring into a pond). A junction is a line across the tributary where it hands over: a point on its centreline
// (x, z), the downstream direction (dx, dz), the half-width of the channel there (w). Both waters carry the SAME
// junction in the same slot, each saying which side it is:
//   o = -1 tributary: draws only upstream of the line; over the last L metres its own character (its chop, swell,
//          tilt, whitewater, wakes, ripple map) fades out and its parameters ease into the receiving water's
//          (into_<param>), so at the line it is shaded by exactly the receiving water's rule
//   o = +1 receiving: draws only downstream of the line inside the channel's band (never under the tributary),
//          and carries the plume: the inflow's current spreading and slowing into it
// Both draw the plume with one function over the same inputs, so on the line the two surfaces are one colour: the
// hand-over is a hard cut no eye can find, and neither sheet's draw order matters (each discards the other's side).
// The plume: the tributary's ripple map carried on (its speed u, amplitude r), spreading as a jet (the half-width
// grows ~0.15 m per metre, the speed falls as sqrt(w / width), then dies over ~70 m), damping the wind chop where
// it runs, and trailing faint scum lines (a) that thin as they spread.
// Params per slot i (0 = empty): j<i>o, j<i>x, j<i>z, j<i>dx, j<i>dz, j<i>w, j<i>u (m/s), j<i>r, j<i>a, j<i>L (m).
// Write them with junctionParams() below.
import { vec2, vec3, float, max, min, smoothstep, abs, sqrt, exp, fract, select, mx_noise_float } from "builtin/tsl";
export const JUNCTIONS = 2;
// the river ripple map: rgb = tangent normal, 1024² spectral, streaked along the flow (river.js reads it too)
export const RIPPLE = "/cdn/value.78bfc3e236c0c00569106acb2f3592757a10d6c1b0f6646c2fa5b266caa5c33a.jpg";

// JS: the params for one junction slot, for one side ({ o: -1 | 1 }); spread them into both materials' params
export function junctionParams(i, { x, z, dx, dz, w, u = 1.2, r = 0.16, a = 0.3, L = 12 }, o) {
  const n = Math.hypot(dx, dz) || 1;
  return { [`j${i}o`]: o, [`j${i}x`]: x, [`j${i}z`]: z, [`j${i}dx`]: dx / n, [`j${i}dz`]: dz / n, [`j${i}w`]: w, [`j${i}u`]: u, [`j${i}r`]: r, [`j${i}a`]: a, [`j${i}L`]: L };
}

const slot = (ctx, i, xz) => {
  const o = float(ctx.param(`j${i}o`, 0));
  const c = vec2(ctx.param(`j${i}x`, 0), ctx.param(`j${i}z`, 0));
  const d = vec2(ctx.param(`j${i}dx`, 0), ctx.param(`j${i}dz`, 1));
  const w = float(ctx.param(`j${i}w`, 1)).max(0.1), L = float(ctx.param(`j${i}L`, 12)).max(0.5);
  const rel = xz.sub(c);
  const a = rel.dot(d), b = rel.x.mul(d.y.negate()).add(rel.y.mul(d.x)); // along (downstream +), across (toward -dz, dx)
  return { o, c, d, w, L, a, b, on: abs(o).greaterThan(0.5), trib: o.lessThan(-0.5), recv: o.greaterThan(0.5), i };
};

// how much of the receiving water this point is (0 = all tributary, 1 = handed over): the tributary's param mix.
// Cheap: the vertex stage calls it for the swell.
export function junctionBlend(ctx, xz) {
  let bl = float(0);
  for (let i = 0; i < JUNCTIONS; i++) {
    const s = slot(ctx, i, xz);
    const inBand = abs(s.b).lessThan(s.w.mul(1.6).add(3));
    const k = smoothstep(s.L.negate(), float(0), s.a).mul(select(inBand, float(1), float(0)));
    bl = max(bl, select(s.trib, k, float(0)));
  }
  return bl;
}

// the receiving side's twin of junctionBlend: how much of its OWN character a receiving water shows here. 0 on the
// line (where the tributary has already faded to plain water), easing to 1 over L metres downstream, so a
// receiver with a character of its own (a river leaving a pool) never starts at full strength on the line
export function junctionReceive(ctx, xz) {
  let own = float(1);
  for (let i = 0; i < JUNCTIONS; i++) {
    const s = slot(ctx, i, xz);
    const inBand = abs(s.b).lessThan(s.w.mul(1.6).add(3));
    const k = smoothstep(float(0), s.L, s.a);
    own = min(own, select(s.recv.and(inBand), k, float(1)));
  }
  return own;
}

// the whole junction field at xz (TSL): keep (1 draw / 0 discard), blend, slope (vec2), foam (0..1), calm (chop x)
export function junctions(ctx, xz, tt, fp, { lite = false } = {}) {
  const tex = ctx.texture(RIPPLE, { wrap: "repeat" });
  let keep = float(1), blend = float(0), slope = vec2(0, 0), foam = float(0), calm = float(1);
  for (let i = 0; i < JUNCTIONS; i++) {
    const s = slot(ctx, i, xz);
    const inBand = abs(s.b).lessThan(s.w.mul(1.6).add(3));
    // ownership: the tributary never draws past the line; the receiving water never under the tributary's band
    const tribHide = s.a.greaterThanEqual(0).and(inBand);
    const recvHide = s.a.lessThan(0).and(s.a.greaterThan(s.L.negate().sub(4))).and(abs(s.b).lessThan(s.w));
    keep = keep.mul(select(s.trib.and(tribHide), float(0), float(1))).mul(select(s.recv.and(recvHide), float(0), float(1)));
    const k = smoothstep(s.L.negate(), float(0), s.a).mul(select(inBand, float(1), float(0)));
    blend = max(blend, select(s.trib, k, float(0)));
    // the plume's strength: fading in over the tributary's last L metres, then a jet that spreads fast and
    // dissolves: the half-width grows 0.45 m per metre, the edge is a wide soft fall-off broken by noise so it
    // never reads as a band, and the whole thing is gone within ~25 m of the line
    const ap = s.a.max(0);
    const hw = s.w.add(ap.mul(0.45));
    const edgeN = mx_noise_float(vec3(xz.x.mul(0.18), xz.y.mul(0.18), tt.mul(0.05))).mul(0.35);
    const lat = float(1).sub(smoothstep(hw.mul(0.1), hw.mul(1.1).add(edgeN.mul(hw)), abs(s.b)));
    const along = select(s.a.lessThan(0), smoothstep(s.L.negate(), float(0), s.a),
      sqrt(s.w.div(hw)).mul(exp(ap.div(-9))).mul(float(1).sub(smoothstep(12, 26, ap))));
    const S = lat.mul(along).mul(select(s.on, float(1), float(0)));
    // carried ripple: a flow map in two phases half a cycle apart, each scrolling at the local jet speed and
    // cross-faded so a phase is invisible at the moment it resets: nothing ever loops back to a point
    const U = float(ctx.param(`j${i}u`, 1.2)).mul(sqrt(s.w.div(hw)));
    const PER = 3.0;
    const ph0 = fract(tt.div(PER)), ph1 = fract(tt.div(PER).add(0.5));
    const w0 = float(1).sub(abs(ph0.mul(2).sub(1))), w1 = float(1).sub(w0);
    const across = vec2(s.d.y.negate(), s.d.x);
    const fine = float(1).sub(smoothstep(0.02, 0.07, fp));
    const layer = (ph, seed) => {
      const q = vec2(s.b, s.a.sub(ph.mul(PER).mul(U))).add(seed);
      const rs = (sc, off) => tex.sample(q.div(sc).add(off)).rg.pow(0.4545).mul(2).sub(1);
      let n = rs(3.2, 0.13).mul(float(0.45).mul(float(1).sub(smoothstep(0.05, 0.2, fp).mul(0.7))));
      if (!lite) n = n.add(rs(1.6, 0.52).mul(0.32).mul(fine));
      const sn = mx_noise_float(vec3(q.x.mul(0.9), q.y.mul(0.22), 0.0));
      const streak = smoothstep(0.35, 0.8, sn.mul(0.5).add(0.5).add(mx_noise_float(vec3(q.x.mul(3.1), q.y.mul(0.6), 1.7)).mul(0.15)));
      return { n, streak };
    };
    const L0 = layer(ph0, vec2(0, 0)), L1 = layer(ph1, vec2(7.3, 3.1));
    const n = L0.n.mul(w0).add(L1.n.mul(w1)).div(w0.mul(w0).add(w1.mul(w1)).sqrt()); // keep the contrast through the blend
    const amp = float(ctx.param(`j${i}r`, 0.16)).mul(S).mul(float(1).sub(smoothstep(0.2, 0.9, fp)));
    slope = slope.sub(across.mul(n.x).add(s.d.mul(n.y)).mul(amp));
    // moving water flattens the wind's chop
    calm = min(calm, float(1).sub(S.mul(min(U.div(1.5), float(1))).mul(0.4)));
    // scum lines carried out of the tributary, thinning fast as the jet spreads
    const streak = L0.streak.mul(w0).add(L1.streak.mul(w1));
    const fa = float(ctx.param(`j${i}a`, 0.3)).mul(S).mul(exp(ap.div(-7))).mul(float(1).sub(smoothstep(0.1, 0.5, fp).mul(0.6)));
    foam = max(foam, streak.mul(fa));
  }
  return { keep, blend, slope, foam, calm };
}
