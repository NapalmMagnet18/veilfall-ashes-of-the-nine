// Awakening wake: the shader's hand of lib/wake-shape.js, the same numbers in TSL, drawn live round a body
// standing or moving in the current (a wader). Rocks get the same shape baked (their map in river.js).
// collar of foam hugging the upstream half, pillow U^2/2g on the face, two V arms at the Kelvin/Mach angle
// with a short train of wavelets, the slick in the lee and the torn seams at its edges.
import { vec2, float, exp, cos, max, min, smoothstep, dot, length, select, sqrt, asin, tan } from "builtin/tsl";
export const G = 9.81;
const sq = (x) => x.mul(x);
function height(a, b, R, U, head, tp, cp, lam, lt) {
  const pw = R.mul(0.35).add(0.15);
  let h = head.mul(exp(sq(a.add(R.mul(0.95)).div(pw)).add(sq(b.div(R.mul(0.9).add(0.1)))).negate()));
  h = h.sub(head.mul(0.6).mul(exp(sq(a.sub(R.mul(1.25)).div(R.add(0.2))).add(sq(b.div(R.mul(0.7).add(0.1)))).negate())));
  const reach = R.mul(2.5).add(U.mul(1.2)).add(0.6);
  const along = smoothstep(R.mul(-0.6), R.mul(0.4), a).mul(exp(a.max(0).div(reach).negate()));
  for (const s of [1, -1]) {
    const n = b.mul(s).sub(R.mul(0.9).add(a.max(0).mul(tp))).mul(cp);
    const env = exp(sq(n.max(0).div(lam.mul(1.8))).negate()).mul(smoothstep(lam.mul(-0.6), float(0), n));
    h = h.add(head.mul(0.5).mul(along).mul(env).mul(cos(n.mul(6.2832).div(lam))));
  }
  const at = a.sub(R.mul(1.8));
  const wid = R.add(at.max(0).mul(tp).mul(0.8)).add(0.1);
  h = h.add(head.mul(0.22).mul(exp(at.max(0).div(R.mul(2).add(U.mul(0.8)).add(0.5)).negate())).mul(exp(sq(b.div(wid)).negate())).mul(smoothstep(lt.mul(-0.5), float(0), at)).mul(cos(at.mul(6.2832).div(lt))));
  return h;
}
// d: vec2 world offset from the body; flow: vec2 water past it (m/s); R radius (m); depth (m).
// Returns { g: vec2 surface slope in the world, foam, slick, seam } (0..1 each).
export function obstacle({ d, flow, R, depth = float(0.6), slope = true }) {
  const Um = length(flow), U = max(Um, float(0.3));
  const u = flow.div(U), pv = vec2(u.y.negate(), u.x);
  const a = dot(d, u), b = dot(d, pv), r = length(d);
  const head = min(U.mul(U).div(2 * G), float(0.16)).mul(smoothstep(0.15, 0.6, Um));
  // the V: the Mach cone of the short surface waves (same as wake-shape.js armAngle): wide at a trickle, a knife in a rush
  const c0 = depth.mul(0.1).add(0.55);
  const phi = asin(min(c0.div(Um.max(0.05)), float(1))).clamp(0.2, 1.05);
  const tp = tan(phi), cp = cos(phi);
  const lam = U.mul(0.16).add(0.22), lt = U.mul(U).mul(6.2832 / G).clamp(0.5, 2.4);
  let g = vec2(0, 0);
  if (slope) { // the analytic surface; a live body leaves it to its wave trail (river.js), which is the real thing
    const e = 0.04;
    const h0 = height(a, b, R, U, head, tp, cp, lam, lt);
    const ha = height(a.add(e), b, R, U, head, tp, cp, lam, lt), hb = height(a, b.add(e), R, U, head, tp, cp, lam, lt);
    g = u.mul(ha.sub(h0).div(e)).add(pv.mul(hb.sub(h0).div(e)));
  }
  const on = smoothstep(0.25, 1.2, Um);
  const band = R.mul(0.07).add(0.07);
  let foam = exp(sq(r.sub(R.mul(1.04)).div(band)).negate()).mul(smoothstep(R.mul(0.45), R.mul(-0.5), a));
  const wid = R.mul(0.8).add(a.mul(0.1));
  const ap = a.max(0);
  const slick = exp(sq(b.div(wid)).negate()).mul(smoothstep(float(0), R.mul(0.8), a)).mul(exp(ap.div(R.mul(3).add(U).add(1)).negate()));
  const seam = exp(sq(b.abs().sub(wid).abs().div(ap.mul(0.035).add(0.1))).negate()).mul(smoothstep(float(0), R, a)).mul(exp(ap.div(R.mul(3).add(U.mul(2)).add(1)).negate()));
  foam = max(foam, seam.mul(0.45).mul(exp(ap.div(R.mul(2).add(1.5)).negate())));
  return { g, foam: foam.mul(on), slick: slick.mul(on), seam: seam.mul(on) };
}
