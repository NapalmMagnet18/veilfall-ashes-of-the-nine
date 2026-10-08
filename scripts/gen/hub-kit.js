// Shared modelling kit for the Wayside Fire camp (Z01 hub): transforms, lofts, tubes, chamfered
// boxes, rocks, lanterns and candles. Every helper emits through ctx.quad/ctx.tri, so the same calls
// build a collider inside collider(ctx). Rings run (cos a, -sin a) about their axis: CCW from outside.
export const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
export const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const norm = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
export const rnd = (ctx, a, b) => a + (b - a) * ctx.random();
const D = Math.PI / 180;

// rot = [yaw, pitch, roll] degrees (roll about Z, then pitch about X, then yaw about Y), then translate.
export function xf(pos = [0, 0, 0], rot = [0, 0, 0], s = 1) {
  const cy = Math.cos(rot[0] * D), sy = Math.sin(rot[0] * D), cp = Math.cos(rot[1] * D), sp = Math.sin(rot[1] * D), cr = Math.cos(rot[2] * D), sr = Math.sin(rot[2] * D);
  const S = Array.isArray(s) ? s : [s, s, s];
  return (p) => {
    const x = p[0] * S[0], y = p[1] * S[1], z = p[2] * S[2];
    const x1 = x * cr - y * sr, y1 = x * sr + y * cr;
    const y2 = y1 * cp - z * sp, z2 = y1 * sp + z * cp;
    return [x1 * cy + z2 * sy + pos[0], y2 + pos[1], -x1 * sy + z2 * cy + pos[2]];
  };
}
export const compose = (A, B) => (p) => A(B(p));
export const I = (p) => p;
export function quad(ctx, T, a, b, c, d) { ctx.quad(...T(a), ...T(b), ...T(c), ...T(d)); }
export function tri(ctx, T, a, b, c) { ctx.tri(...T(a), ...T(b), ...T(c)); }
const centroid = (r) => mul(r.reduce((s, p) => add(s, p), [0, 0, 0]), 1 / r.length);

export function loft(ctx, T, rings, c0 = true, c1 = true) {
  const n = rings[0].length;
  for (let i = 0; i < rings.length - 1; i++) {
    const p = rings[i], q = rings[i + 1];
    for (let j = 0; j < n; j++) { const k = (j + 1) % n; quad(ctx, T, p[j], p[k], q[k], q[j]); }
  }
  if (c0) { const p = rings[0], c = centroid(p); for (let j = 0; j < n; j++) tri(ctx, T, c, p[(j + 1) % n], p[j]); }
  if (c1) { const q = rings[rings.length - 1], c = centroid(q); for (let j = 0; j < n; j++) tri(ctx, T, c, q[j], q[(j + 1) % n]); }
}
export function ringH(cx, y, cz, rx, rz, n, jit = 0, ctx = null) {
  const r = [];
  for (let j = 0; j < n; j++) { const a = (j / n) * Math.PI * 2, k = jit && ctx ? 1 + (ctx.random() - 0.5) * jit : 1; r.push([cx + Math.cos(a) * rx * k, y, cz - Math.sin(a) * rz * k]); }
  return r;
}
export function rect(hw, hd, b, y) {
  if (b <= 0) return [[hw, y, hd], [hw, y, -hd], [-hw, y, -hd], [-hw, y, hd]];
  return [[hw, y, hd - b], [hw, y, -(hd - b)], [hw - b, y, -hd], [-(hw - b), y, -hd], [-hw, y, -(hd - b)], [-hw, y, hd - b], [-(hw - b), y, hd], [hw - b, y, hd]];
}
// box from its bottom centre
export function box(ctx, T, sx, sy, sz) { loft(ctx, T, [rect(sx / 2, sz / 2, 0, 0), rect(sx / 2, sz / 2, 0, sy)]); }
export function cbox(ctx, T, sx, sy, sz, b = 0.02) {
  b = Math.min(b, sx / 4, sy / 4, sz / 4);
  const hw = sx / 2, hd = sz / 2;
  loft(ctx, T, [rect(hw - b, hd - b, b, 0), rect(hw, hd, b, b), rect(hw, hd, b, sy - b), rect(hw - b, hd - b, b, sy)]);
}
export function tube(ctx, T, path, radii, n = 6, c0 = true, c1 = true) {
  const rings = []; let up = null;
  for (let i = 0; i < path.length; i++) {
    const a = path[Math.max(0, i - 1)], b = path[Math.min(path.length - 1, i + 1)], d = norm(sub(b, a));
    let u = up ? sub(up, mul(d, dot(up, d))) : null;
    if (!u || Math.hypot(...u) < 1e-4) u = cross(Math.abs(d[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0], d);
    u = norm(u); up = u;
    const v = cross(d, u), r = typeof radii === "number" ? radii : radii[i], ring = [];
    for (let j = 0; j < n; j++) { const t = (j / n) * Math.PI * 2; ring.push(add(path[i], add(mul(u, Math.cos(t) * r), mul(v, Math.sin(t) * r)))); }
    rings.push(ring);
  }
  loft(ctx, T, rings, c0, c1);
}
// a prism from a convex XY outline (CCW seen from +Z), front face at z0 (−Z), back at z1
export function extrudeXY(ctx, T, poly, z0, z1) {
  const n = poly.length, c = centroid(poly.map((p) => [p[0], p[1], 0]));
  for (let i = 0; i < n; i++) {
    const p = poly[i], q = poly[(i + 1) % n];
    quad(ctx, T, [p[0], p[1], z1], [p[0], p[1], z0], [q[0], q[1], z0], [q[0], q[1], z1]);
    tri(ctx, T, [c[0], c[1], z1], [p[0], p[1], z1], [q[0], q[1], z1]);
    tri(ctx, T, [c[0], c[1], z0], [q[0], q[1], z0], [p[0], p[1], z0]);
  }
}
const ICO = (() => {
  const t = (1 + Math.sqrt(5)) / 2;
  const v = [[-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0], [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t], [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]].map(norm);
  const f = [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8], [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]];
  return { v, f };
})();
// a lumpy stone sitting on y=0; opts: sub, sx, sy, sz, rough, sink, face(ctx, normal, centre)
export function rock(ctx, T, r, o = {}) {
  let v = ICO.v.slice(), f = ICO.f.slice();
  if (o.sub) {
    const cache = {}, mid = (a, b) => { const k = a < b ? a + "_" + b : b + "_" + a; if (cache[k] == null) { cache[k] = v.length; v.push(norm(mul(add(v[a], v[b]), 0.5))); } return cache[k]; };
    const nf = []; for (const [a, b, c] of f) { const ab = mid(a, b), bc = mid(b, c), ca = mid(c, a); nf.push([a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]); } f = nf;
  }
  const sx = o.sx ?? 1, sy = o.sy ?? 0.7, sz = o.sz ?? 1, rough = o.rough ?? 0.35, sink = o.sink ?? 0.25;
  const P = v.map((p) => { const k = 1 + (ctx.random() - 0.5) * rough; return [p[0] * r * k * sx, Math.max(p[1] * r * k * sy, -r * sy * (1 - sink)) + r * sy * (1 - sink) * 0.92, p[2] * r * k * sz]; });
  const C = [0, r * sy * 0.6, 0];
  for (const [a, b, c] of f) {
    let A = P[a], B = P[b], Cc = P[c];
    const n = cross(sub(B, A), sub(Cc, A)), cen = mul(add(add(A, B), Cc), 1 / 3);
    if (dot(n, sub(cen, C)) < 0) [B, Cc] = [Cc, B];
    if (o.face) o.face(ctx, norm(n[1] !== undefined && dot(n, sub(cen, C)) < 0 ? mul(n, -1) : n), cen);
    tri(ctx, T, A, B, Cc);
  }
}
export const IRON = "cdn/texture-rusted-dark-iron.png";
export const STONE = "cdn/texture-weathered-wet-dark-granite.png";
export const WOOD = "cdn/texture-rotten-weathered-wood-planks.png";
// a hanging iron lantern; origin = the hanging point, the glass centre sits 0.265 below it
export function lantern(ctx, T) {
  ctx.albedo(IRON); ctx.color("oklch(0.62 0.01 250)"); ctx.metalness(0.6); ctx.roughness(0.6);
  tube(ctx, T, [[0, 0.03, 0], [0, -0.07, 0]], 0.012, 4);
  loft(ctx, T, [rect(0.1, 0.1, 0, -0.15), rect(0.1, 0.1, 0, -0.13), rect(0.025, 0.025, 0, -0.065)]);
  for (const sx of [-0.085, 0.085]) for (const sz of [-0.085, 0.085]) box(ctx, compose(T, xf([sx, -0.39, sz])), 0.018, 0.25, 0.018);
  cbox(ctx, compose(T, xf([0, -0.42, 0])), 0.2, 0.03, 0.2, 0.008);
  ctx.albedo(null); ctx.metalness(0); ctx.roughness(0.3); ctx.color("oklch(0.88 0.1 75)"); ctx.emissive(3.4, 1.9, 0.6);
  box(ctx, compose(T, xf([0, -0.375, 0])), 0.14, 0.22, 0.14);
  ctx.emissive(null); ctx.roughness(0.85);
}
// a stub of old wax with yellowed drips and a foot of melt; c = [x, y, z, h]
export function candle(ctx, T, c, fine = true) {
  const [x, y, z, h] = c, r = 0.028 + h * 0.06;
  ctx.albedo(null); ctx.roughness(0.55);
  ctx.color("oklch(0.88 0.03 85)");
  loft(ctx, T, [ringH(x, y, z, r * 1.9, r * 1.9, 8), ringH(x, y + 0.012, z, r * 1.5, r * 1.5, 8), ringH(x, y + 0.03, z, r * 1.05, r * 1.05, 8), ringH(x, y + h, z, r, r, 8), ringH(x, y + h + 0.006, z, r * 0.7, r * 0.7, 8)], true, true);
  if (fine) {
    ctx.color("oklch(0.82 0.08 82)");
    for (let i = 0; i < 3; i++) {
      const a = (i * 2.1 + h * 17) % 6.28, px = x + Math.cos(a) * r * 1.02, pz = z - Math.sin(a) * r * 1.02, len = h * (0.3 + 0.2 * i);
      tube(ctx, T, [[px, y + h + 0.004, pz], [px, y + h - len * 0.6, pz], [px, y + h - len, pz]], [0.007, 0.006, 0.009], 4);
    }
  }
  ctx.color("oklch(0.2 0.01 60)");
  tube(ctx, T, [[x, y + h, z], [x, y + h + 0.022, z]], 0.003, 3);
}
