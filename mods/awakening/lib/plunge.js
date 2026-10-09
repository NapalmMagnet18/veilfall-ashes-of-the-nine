// A plunge in a pool: where a waterfall drives into water that is already there. Not a mesh of its own: a field
// the pool's own water material reads (river.js), so the boil is the same water and the same foam as the pool
// around it and melts into it with no edge. Unset (plHW 0), it is off and costs nothing.
// Params on the pool's material (metres, world):
//   plX, plZ    the impact's centre         plDX, plDZ  the fall's downstream direction
//   plHW        half the impact line, across the fall   plHL  half its depth, along the fall
//   plH         how high the boil heaves over the pool  plReach  how far the white runs out, in impact radii
import { vec2, vec3, float, normalize, length, exp, sin, smoothstep, mod, time, mx_noise_float } from "builtin/tsl";

export function plungeField(ctx) {
  // off unless the placement names an impact (its params object carries plHW)
  const ps = ctx.params;
  if (ps && typeof ps === "object" && Object.keys(ps).length && !("plHW" in ps)) return null;
  const c = vec2(float(ctx.param("plX", 0)), float(ctx.param("plZ", 0)));
  const dir = normalize(vec2(float(ctx.param("plDX", 0)), float(ctx.param("plDZ", 1))));
  const hw = float(ctx.param("plHW", 0)).max(0.01), hl = float(ctx.param("plHL", 2)).max(0.01);
  const H = float(ctx.param("plH", 0.5)), reach = float(ctx.param("plReach", 2));
  const tt = mod(time, 3600);
  const local = (xz) => { const d = xz.sub(c); return { d, a: d.x.mul(dir.x).add(d.y.mul(dir.y)), b: d.x.mul(dir.y).sub(d.y.mul(dir.x)) }; };
  const qOf = (xz) => { const { a, b } = local(xz); return length(vec2(a.div(hl), b.div(hw))); };
  // the heave: a dome over the impact that lumps as slugs of water land, rings running out, a chop on top
  const heave = (xz) => {
    const q = qOf(xz);
    const lump = mx_noise_float(vec3(xz.mul(0.5), tt.mul(1.5))).mul(0.55).add(0.75);
    const core = exp(q.mul(q).mul(-2)).mul(lump);
    const ring = sin(q.mul(6.5).sub(tt.mul(5))).mul(exp(q.mul(-1.3))).mul(0.2).mul(smoothstep(0.3, 0.8, q));
    const chop = mx_noise_float(vec3(xz.mul(1.7), tt.mul(2.4))).mul(0.14).mul(exp(q.mul(-0.8)));
    return core.add(ring).add(chop).mul(H).mul(float(1).sub(smoothstep(reach.mul(0.7), reach.add(0.3), q)));
  };
  // the slope of that heave, as the water's slope term takes it (+ downhill)
  // the slope the light reads: the dome and its rings alone, over half a metre. The noise chop's own slope
  // aliases into contour lines at a pixel's scale, and the foam already carries that detail
  const swell = (xz) => { const q = qOf(xz);
    return exp(q.mul(q).mul(-2)).add(sin(q.mul(6.5).sub(tt.mul(5))).mul(exp(q.mul(-1.3))).mul(0.2).mul(smoothstep(0.3, 0.8, q))).mul(H); };
  const slope = (xz) => {
    const e = 0.5, h0 = swell(xz);
    return vec2(swell(xz.add(vec2(e, 0))).sub(h0).div(e), swell(xz.add(vec2(0, e))).sub(h0).div(e)).negate().mul(0.6);
  };
  // aeration: solid over the impact, torn outward in lumps that pulse with the heave, fading to a trace
  const aer = (xz) => {
    const q = qOf(xz);
    // lumps born over the impact roll outward: the noise's third axis runs with distance minus time, so the
    // pattern travels out in rings with no direction field (a radial one pinches into a starburst at the centre)
    const r = q.mul(1.4).sub(tt.mul(0.9));
    const torn = mx_noise_float(vec3(xz.mul(0.55), r)).mul(0.6).add(mx_noise_float(vec3(xz.mul(1.6).add(4.1), r.mul(1.7).add(tt.mul(0.6)))).mul(0.4));
    const body = float(1).sub(smoothstep(0.2, reach, q));
    return body.mul(1.5).add(torn.mul(body.mul(0.9).add(0.1))).clamp(0, 1.6);
  };
  return { heave, slope, aer, qOf };
}
