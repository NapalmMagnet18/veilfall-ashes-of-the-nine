// Awakening wave trail: one wake rule for every thing in every water. A body sheds a ripple where it stands every
// DT seconds, pushed as hard as the water moves PAST it (the current minus the body's own motion); each ripple
// spreads at WAVE_C and is carried off by the current it was born in. Summed, they are the wake:
//   still thing, still water:   nothing moves past it, nothing is shed (glass)
//   still thing, moving water:  a rock, a wader standing in the river: a standing V off its upstream face,
//                               narrow in a rush, wide at a trickle (the Mach angle asin(WAVE_C / U))
//   moving thing, moving water: the V bends to the water's speed relative to the body
//   moving thing, still water:  a swimmer, a canoe on the lake: the V behind it, rings when it stops
// A live body writes its sources into material params (shed(), JS); a rock never moves, so the shader lays its
// sources itself on the same clock (standing(), TSL): a rock and a wader standing where it stands are one pattern.
// Params per trail body b: t<b>_<k>x/z (birth point), t (birth, shader clock s), a (push), u/w (current m/s),
// t<b>hx/hz (where the body is now: pixels farther than the trail can reach skip it).
import { vec2, vec3, float, exp, length, smoothstep, mod, max, Fn, If } from "builtin/tsl";
export const TRAIL = 12, DT = 0.1, WAVE_C = 0.6, LIFE = 1.15;
const ss = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// the push a source carries: from the water's speed past the body, and its size (R waterline radius, m)
export function strength(rel, R = 0.3) {
  return Math.min(1, rel * 0.5) * ss(0.05, 0.3, rel) * Math.min(2.2, Math.max(1, Math.sqrt(R / 0.3)));
}
// the river's surface speed from its centreline grade (drop per metre): the rock bake and the wader both read it
export function streamSpeed(grade) { return Math.min(3, 1.3 + 2.2 * Math.max(0, Math.min(1, (grade - 0.02) / 0.16))); }

// one ripple (TSL): P xz, c its centre now, age s, a0 push, R0 radius it is born at
export function ripple(P, c, age, a0, R0) {
  const dv = P.sub(c), dd = length(dv).add(0.001);
  const Rr = age.mul(WAVE_C).add(R0), wd = age.mul(0.14).add(0.1);
  const x = dd.sub(Rr).div(wd);
  const life = float(1).sub(smoothstep(0.8, LIFE, age)).mul(smoothstep(0.0, 0.05, age));
  const env = exp(x.mul(x).negate()).mul(a0).mul(life).mul(Rr.add(0.3).inverseSqrt());
  const kk = float(6.2832).div(age.mul(0.12).add(0.2)); // 0.2 m at birth, stretching as it runs
  const sl = env.mul(kk.mul(dd.sub(Rr)).cos()).mul(0.09);
  return { g: dv.div(dd).mul(sl), foam: env.mul(exp(age.mul(-4))).mul(0.8) };
}

// the trails the live bodies wrote (TSL): vec3(slope x, slope z, foam)
export function bodies(ctx, P, tt, count, { drift = true } = {}) {
  return Fn(() => {
    const acc = vec3(0, 0, 0).toVar();
    for (let b = 0; b < count; b++) {
      const head = vec2(ctx.param(`t${b}hx`, 0), ctx.param(`t${b}hz`, 0));
      If(length(P.sub(head)).lessThan(6.5), () => {
        for (let k = 0; k < TRAIL; k++) {
          const pre = `t${b}_${k}`;
          const age = mod(tt.sub(ctx.param(`${pre}t`, -500)).add(3600), 3600);
          let c = vec2(ctx.param(`${pre}x`, 0), ctx.param(`${pre}z`, 0));
          if (drift) c = c.add(vec2(ctx.param(`${pre}u`, 0), ctx.param(`${pre}w`, 0)).mul(age));
          const r = ripple(P, c, age, float(ctx.param(`${pre}a`, 0)), float(0.12));
          acc.assign(vec3(acc.x.add(r.g.x), acc.y.add(r.g.y), max(acc.z, r.foam)));
        }
      });
    }
    return acc;
  })();
}

// a still thing's trail in a steady current (TSL): the sources it would have shed, laid on the shader clock
// at: vec2 its centre, flow: vec2 current m/s, a0 push, R waterline radius. vec3(slope x, slope z, foam)
export function standing(P, tt, at, flow, a0, R) {
  const ph = mod(tt, DT);
  let g = vec2(0, 0), f = float(0);
  for (let k = 0; k <= TRAIL; k++) {
    const age = ph.add(k * DT);
    const r = ripple(P, at.add(flow.mul(age)), age, a0, R);
    g = g.add(r.g); f = max(f, r.foam);
  }
  return vec3(g.x, g.y, f);
}

// JS: shed one source into body b's ring of TRAIL when DT has passed. m = this machine's memo for the body
export function shed(ctx, p, b, m, x, z, u, w, a, t) {
  const now = ctx.now();
  if (now - (m.at ?? 0) < DT * 1000) return false;
  m.at = now; m.k = ((m.k ?? -1) + 1) % TRAIL;
  const pre = `t${b}_${m.k}`, r3 = (v) => Math.round(v * 1000) / 1000;
  p[`${pre}x`] = r3(x); p[`${pre}z`] = r3(z); p[`${pre}u`] = r3(u); p[`${pre}w`] = r3(w);
  p[`${pre}a`] = r3(a); p[`${pre}t`] = r3(t);
  p[`t${b}hx`] = r3(x); p[`t${b}hz`] = r3(z);
  return true;
}
