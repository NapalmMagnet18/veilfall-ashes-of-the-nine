// Veilfall modelling kit: a transform stack over ctx.quad/ctx.tri, lofts, boxes, tubes,
// and a seeded hash RNG. Shared by every scripts/gen/vf-*.js prop on Broken Lantern Road.
export function rng(seed) {
  let a = (Math.floor(seed * 9973) ^ 0x9e3779b9) >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const D = Math.PI / 180;
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const norm = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
export const V = { sub, cross, dot, norm, add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], mul: (a, s) => [a[0] * s, a[1] * s, a[2] * s] };
export function kit(ctx) {
  let M = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0];
  const S = [];
  const mul = (A, B) => { const r = []; for (let i = 0; i < 3; i++) for (let j = 0; j < 4; j++) r[i * 4 + j] = A[i * 4] * B[j] + A[i * 4 + 1] * B[4 + j] + A[i * 4 + 2] * B[8 + j] + (j === 3 ? A[i * 4 + 3] : 0); return r; };
  const P = (p) => [M[0] * p[0] + M[1] * p[1] + M[2] * p[2] + M[3], M[4] * p[0] + M[5] * p[1] + M[6] * p[2] + M[7], M[8] * p[0] + M[9] * p[1] + M[10] * p[2] + M[11]];
  const k = {
    P,
    push() { S.push(M.slice()); return k; },
    pop() { M = S.pop(); return k; },
    t(x, y, z) { M = mul(M, [1, 0, 0, x, 0, 1, 0, y, 0, 0, 1, z]); return k; },
    ry(d) { const c = Math.cos(d * D), s = Math.sin(d * D); M = mul(M, [c, 0, s, 0, 0, 1, 0, 0, -s, 0, c, 0]); return k; },
    rx(d) { const c = Math.cos(d * D), s = Math.sin(d * D); M = mul(M, [1, 0, 0, 0, 0, c, -s, 0, 0, s, c, 0]); return k; },
    rz(d) { const c = Math.cos(d * D), s = Math.sin(d * D); M = mul(M, [c, -s, 0, 0, s, c, 0, 0, 0, 0, 1, 0]); return k; },
    sc(x, y = x, z = x) { M = mul(M, [x, 0, 0, 0, 0, y, 0, 0, 0, 0, z, 0]); return k; },
    q(a, b, c, d) { ctx.quad(...P(a), ...P(b), ...P(c), ...P(d)); },
    tr(a, b, c) { ctx.tri(...P(a), ...P(b), ...P(c)); },
    // a quad / tri wound so its face looks along `out` (local frame)
    qo(a, b, c, d, out) { if (dot(cross(sub(b, a), sub(c, a)), out) < 0) k.q(a, d, c, b); else k.q(a, b, c, d); },
    to(a, b, c, out) { if (dot(cross(sub(b, a), sub(c, a)), out) < 0) k.tr(a, c, b); else k.tr(a, b, c); },
    // rings ordered by angle from +x toward +z, each ring above the last
    loft(rings, capB = true, capT = true) {
      for (let r = 0; r < rings.length - 1; r++) { const A = rings[r], B = rings[r + 1], n = A.length; for (let i = 0; i < n; i++) { const j = (i + 1) % n; k.q(A[i], B[i], B[j], A[j]); } }
      const cen = (R) => R.reduce((s, p) => [s[0] + p[0] / R.length, s[1] + p[1] / R.length, s[2] + p[2] / R.length], [0, 0, 0]);
      if (capB) { const R = rings[0], c = cen(R); for (let i = 0; i < R.length; i++) k.tr(c, R[i], R[(i + 1) % R.length]); }
      if (capT) { const R = rings[rings.length - 1], c = cen(R); for (let i = 0; i < R.length; i++) k.tr(c, R[(i + 1) % R.length], R[i]); }
    },
    rect(x, y, z, a, b) { return [[x + a, y, z - b], [x + a, y, z + b], [x - a, y, z + b], [x - a, y, z - b]]; },
    oct(x, y, z, a, b, c) { return [[x + a, y, z - b + c], [x + a, y, z + b - c], [x + a - c, y, z + b], [x - a + c, y, z + b], [x - a, y, z + b - c], [x - a, y, z - b + c], [x - a + c, y, z - b], [x + a - c, y, z - b]]; },
    circ(x, y, z, rx, rz, n, ph = 0, jit) { const o = []; for (let i = 0; i < n; i++) { const an = ph + (i / n) * Math.PI * 2, j = jit ? jit(i) : 1; o.push([x + Math.cos(an) * rx * j, y, z + Math.sin(an) * rz * j]); } return o; },
    box(x, y, z, sx, sy, sz) { k.loft([k.rect(x, y, z, sx / 2, sz / 2), k.rect(x, y + sy, z, sx / 2, sz / 2)]); },
    bb(x0, y0, z0, x1, y1, z1) { k.box((x0 + x1) / 2, y0, (z0 + z1) / 2, x1 - x0, y1 - y0, z1 - z0); },
    cbox(x, y, z, sx, sy, sz, c = 0.04) { const a = sx / 2, b = sz / 2; c = Math.min(c, a * 0.45, b * 0.45, sy * 0.45); k.loft([k.oct(x, y, z, a, b, c), k.oct(x, y + sy - c, z, a, b, c), k.oct(x, y + sy, z, a - c, b - c, c * 0.5)]); },
    cyl(x, y, z, r0, r1, h, n = 8) { k.loft([k.circ(x, y, z, r0, r0, n), k.circ(x, y + h, z, r1, r1, n)]); },
    // a tapered tube from p0 to p1 (local points)
    tube(p0, p1, r0, r1, n = 6, caps = false) {
      const d = norm(sub(p1, p0)), up = Math.abs(d[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
      const u = norm(cross(up, d)), v = cross(u, d);
      const ring = (p, r) => { const o = []; for (let i = 0; i < n; i++) { const an = (i / n) * Math.PI * 2, c = Math.cos(an) * r, s = Math.sin(an) * r; o.push([p[0] + u[0] * c + v[0] * s, p[1] + u[1] * c + v[1] * s, p[2] + u[2] * c + v[2] * s]); } return o; };
      k.loft([ring(p0, r0), ring(p1, r1)], caps, caps);
    },
    // a wall slab along `axis` ("x" or "z") from a0..a1, thickness t0..t1, y 0..yTop, holes { a0, a1, y0, y1 }
    band(axis, a0, a1, t0, t1, yTop, holes = []) {
      const B = (s0, s1, y0, y1) => { if (s1 - s0 < 0.01 || y1 - y0 < 0.01) return; axis === "z" ? k.bb(t0, y0, s0, t1, y1, s1) : k.bb(s0, y0, t0, s1, y1, t1); };
      let cur = a0;
      for (const h of [...holes].sort((p, q) => p.a0 - q.a0)) { B(cur, h.a0, 0, yTop); B(h.a0, h.a1, 0, h.y0); B(h.a0, h.a1, h.y1, yTop); cur = h.a1; }
      B(cur, a1, 0, yTop);
    },
    // a wall whose top follows pts [[a, yTop], ...] above yb
    prof(axis, t0, t1, pts, yb) {
      const W = (a, y, t) => (axis === "z" ? [t, y, a] : [a, y, t]);
      const tO = axis === "z" ? [-1, 0, 0] : [0, 0, -1], aO = axis === "z" ? [0, 0, 1] : [1, 0, 0];
      for (let i = 0; i < pts.length - 1; i++) {
        const [a, ya] = pts[i], [b, yb2] = pts[i + 1];
        k.qo(W(a, yb, t0), W(b, yb, t0), W(b, yb2, t0), W(a, ya, t0), tO);
        k.qo(W(a, yb, t1), W(b, yb, t1), W(b, yb2, t1), W(a, ya, t1), V.mul(tO, -1));
        k.qo(W(a, ya, t0), W(b, yb2, t0), W(b, yb2, t1), W(a, ya, t1), [0, 1, 0]);
      }
      const f = pts[0], l = pts[pts.length - 1];
      k.qo(W(f[0], yb, t0), W(f[0], f[1], t0), W(f[0], f[1], t1), W(f[0], yb, t1), V.mul(aO, -1));
      k.qo(W(l[0], yb, t0), W(l[0], l[1], t0), W(l[0], l[1], t1), W(l[0], yb, t1), aO);
    },
  };
  return k;
}
// an iron candle lantern standing on its base at the local origin; `broken` drops a pane
export function lantern(K, ctx, broken, candleH = 0.08) {
  ctx.albedo("cdn/texture-rusted-dark-iron.png"); ctx.color("oklch(0.9 0.01 250)"); ctx.metalness(0.6); ctx.roughness(0.6);
  K.bb(-0.1, 0, -0.1, 0.1, 0.03, 0.1); K.bb(-0.1, 0.27, -0.1, 0.1, 0.3, 0.1);
  for (const [x, z] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) K.bb(x * 0.09 - 0.008, 0.03, z * 0.09 - 0.008, x * 0.09 + 0.008, 0.27, z * 0.09 + 0.008);
  K.loft([K.rect(0, 0.3, 0, 0.1, 0.1), K.rect(0, 0.4, 0, 0.02, 0.02)], false, true);
  for (let i = 0; i < 6; i++) { const a0 = (i / 6) * Math.PI, a1 = ((i + 1) / 6) * Math.PI; K.tube([Math.cos(a0) * 0.06, 0.4 + Math.sin(a0) * 0.06, 0], [Math.cos(a1) * 0.06, 0.4 + Math.sin(a1) * 0.06, 0], 0.007, 0.007, 4); }
  ctx.metalness(0); ctx.albedo(null);
  ctx.color("oklch(0.78 0.09 75)", 0.32); ctx.roughness(0.1);
  const g = 0.085;
  K.q([g, 0.03, -g], [g, 0.27, -g], [g, 0.27, g], [g, 0.03, g]);
  K.q([-g, 0.03, g], [-g, 0.27, g], [-g, 0.27, -g], [-g, 0.03, -g]);
  K.q([g, 0.03, g], [g, 0.27, g], [-g, 0.27, g], [-g, 0.03, g]);
  if (!broken) K.q([-g, 0.03, -g], [-g, 0.27, -g], [g, 0.27, -g], [g, 0.03, -g]);
  else K.tr([-g, 0.03, -g], [-g, 0.16, -g], [0.02, 0.03, -g]);
  ctx.color("oklch(0.88 0.04 85)"); ctx.roughness(0.7);
  K.cyl(0, 0.03, 0, 0.032, 0.03, candleH, 8);
  ctx.color("oklch(0.15 0 0)"); K.bb(-0.003, 0.03 + candleH, -0.003, 0.003, 0.05 + candleH, 0.003);
}
