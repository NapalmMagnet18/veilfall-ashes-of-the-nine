// Shared modelling helpers for the Z01 gate/arena pieces: transforms, outward-wound faces,
// chamfered blocks, lathes, wax drips, candle beds, chains and tubes. Pure geometry, no state.
export const TEX = {
  stone: "cdn/texture-wet-dark-weathered-stone-blocks.png",
  wax: "cdn/texture-old-yellowed-candle-wax.png",
  bronze: "cdn/texture-corroded-bronze-verdigris.png",
  iron: "cdn/texture-rusted-dark-iron.png",
  wood: "cdn/texture-rotten-weathered-wood-planks.png",
  moss: "cdn/texture-dark-wet-moss.png",
};
export const WAXC = ["oklch(.74 .035 85)", "oklch(.68 .045 82)", "oklch(.62 .055 78)", "oklch(.54 .06 70)", "oklch(.66 .04 72)"];
const D = Math.PI / 180;
export function xf(o = [0, 0, 0], yaw = 0, pitch = 0, roll = 0, s = 1) {
  const S = Array.isArray(s) ? s : [s, s, s];
  const cy = Math.cos(yaw * D), sy = Math.sin(yaw * D), cp = Math.cos(pitch * D), sp = Math.sin(pitch * D), cr = Math.cos(roll * D), sr = Math.sin(roll * D);
  return (p) => {
    let x = p[0] * S[0], y = p[1] * S[1], z = p[2] * S[2];
    const x1 = x * cr - y * sr, y1 = x * sr + y * cr; x = x1; y = y1;
    const y2 = y * cp - z * sp, z2 = y * sp + z * cp; y = y2; z = z2;
    return [x * cy + z * sy + o[0], y + o[1], -x * sy + z * cy + o[2]];
  };
}
export const chainXf = (A, B) => (p) => A(B(p));
export function face(ctx, a, b, c, ref, flip = false) {
  const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
  const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
  if (nx * nx + ny * ny + nz * nz < 1e-14) return;
  const gx = (a[0] + b[0] + c[0]) / 3 - ref[0], gy = (a[1] + b[1] + c[1]) / 3 - ref[1], gz = (a[2] + b[2] + c[2]) / 3 - ref[2];
  let out = nx * gx + ny * gy + nz * gz >= 0; if (flip) out = !out;
  if (out) ctx.tri(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
  else ctx.tri(a[0], a[1], a[2], c[0], c[1], c[2], b[0], b[1], b[2]);
}
export function quad(ctx, a, b, c, d, ref, flip) { face(ctx, a, b, c, ref, flip); face(ctx, a, c, d, ref, flip); }
export function rough(ctx, amp, k = 1) {
  const n = (x, y, z) => ctx.noise3d(x, y, z);
  return (p) => [p[0] + n(p[0] * k, p[1] * k, p[2] * k) * amp, p[1] + n(p[0] * k + 17.3, p[1] * k, p[2] * k) * amp * 0.6, p[2] + n(p[0] * k, p[1] * k + 41.1, p[2] * k) * amp];
}
// chamfered box, half extents, bevel b, optional vertex jitter J (watertight: shared corners jitter alike)
export function bevelBox(ctx, T, hx, hy, hz, b = 0, J = null) {
  b = Math.min(b, hx * 0.45, hy * 0.45, hz * 0.45);
  const P = (k, sx, sy, sz) => {
    let p = k === 0 ? [sx * hx, sy * (hy - b), sz * (hz - b)] : k === 1 ? [sx * (hx - b), sy * hy, sz * (hz - b)] : [sx * (hx - b), sy * (hy - b), sz * hz];
    p = T(p); return J ? J(p) : p;
  };
  const c = T([0, 0, 0]), S = [-1, 1];
  for (const s of S) {
    quad(ctx, P(0, s, -1, -1), P(0, s, 1, -1), P(0, s, 1, 1), P(0, s, -1, 1), c);
    quad(ctx, P(1, -1, s, -1), P(1, 1, s, -1), P(1, 1, s, 1), P(1, -1, s, 1), c);
    quad(ctx, P(2, -1, -1, s), P(2, 1, -1, s), P(2, 1, 1, s), P(2, -1, 1, s), c);
  }
  if (b > 0) for (const a of S) for (const e of S) {
    quad(ctx, P(0, a, e, -1), P(0, a, e, 1), P(1, a, e, 1), P(1, a, e, -1), c);
    quad(ctx, P(0, a, -1, e), P(0, a, 1, e), P(2, a, 1, e), P(2, a, -1, e), c);
    quad(ctx, P(1, -1, a, e), P(1, 1, a, e), P(2, 1, a, e), P(2, -1, a, e), c);
    for (const f of S) face(ctx, P(0, a, e, f), P(1, a, e, f), P(2, a, e, f), c);
  }
}
export function boxC(ctx, x0, x1, y0, y1, z0, z1) {
  bevelBox(ctx, xf([(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2]), (x1 - x0) / 2, (y1 - y0) / 2, (z1 - z0) / 2, 0);
}
// surface of revolution about local Y; prof = [[r, y], ...]
export function lathe(ctx, T, prof, seg, o = {}) {
  const a0 = o.a0 ?? 0;
  const pts = prof.map(([r, y], i) => {
    const row = [];
    for (let j = 0; j < seg; j++) {
      const a = a0 + (j / seg) * Math.PI * 2, rr = r * (o.rj ? o.rj(i, j) : 1);
      const p = T([Math.cos(a) * rr, y, Math.sin(a) * rr]); row.push(o.J ? o.J(p) : p);
    }
    return row;
  });
  const my = prof.reduce((s, p) => s + p[1], 0) / prof.length;
  const ref = o.ref ?? T([0, my, 0]);
  for (let i = 0; i < prof.length - 1; i++) for (let j = 0; j < seg; j++) {
    if (o.skip && o.skip(i, j)) continue;
    const r = o.localRef ? T([0, (prof[i][1] + prof[i + 1][1]) / 2, 0]) : ref;
    quad(ctx, pts[i][j], pts[i][(j + 1) % seg], pts[i + 1][(j + 1) % seg], pts[i + 1][j], r, o.flip);
  }
  return pts;
}
export function drip(ctx, x, y, z, L, r, seg = 6) {
  lathe(ctx, xf([x, y, z]), [[r * 0.8, 0.04], [r, 0], [r * 0.92, -L * 0.3], [r * 0.72, -L * 0.62], [r * 0.5, -L * 0.85], [r * 0.64, -L * 0.93], [r * 0.4, -L * 0.985], [0, -L]], seg, { a0: ctx.random() * 6, localRef: true });
}
export function stalactite(ctx, x, y, z, L, r, seg = 7) {
  const ph = ctx.random() * 10;
  lathe(ctx, xf([x, y, z]), [[r * 0.9, 0.04], [r, 0], [r * 0.82, -L * 0.22], [r * 0.6, -L * 0.45], [r * 0.45, -L * 0.65], [r * 0.3, -L * 0.82], [r * 0.24, -L * 0.93], [r * 0.12, -L * 0.985], [0, -L]], seg,
    { a0: ph, localRef: true, rj: (i, j) => 1 + 0.18 * Math.sin(j * 2.1 + i * 1.3 + ph) });
}
export function candle(ctx, x, y, z, r, h, lit, seg = 5) {
  ctx.color(WAXC[Math.floor(ctx.random() * WAXC.length)]);
  lathe(ctx, xf([x, y, z]), [[r * 1.8, -0.01], [r * 1.15, 0.016], [r, 0.04], [r * 1.03, h * 0.7], [r, h], [r * 0.55, h + 0.008], [0, h - 0.004]], seg, { a0: ctx.random() * 6 });
  if (lit) {
    ctx.emissive(5, 2.6, 0.7);
    lathe(ctx, xf([x, y, z]), [[0, h + 0.012], [r * 0.5, h + 0.04], [r * 0.32, h + 0.08], [0, h + 0.13]], 4, {});
    ctx.emissive(null);
  }
}
// a bed of stubs in an ellipse; ground: drape each on the terrain
export function candleBed(ctx, cx, cy, cz, rx, rz, n, o = {}) {
  const lit = o.lit ?? 0.12, hMax = o.hMax ?? 0.26, rMax = o.rMax ?? 0.055;
  ctx.albedo(TEX.wax); ctx.roughness(0.55); ctx.metalness(0); ctx.smooth();
  if (o.puddle !== false) { ctx.color(WAXC[2]); puddle(ctx, cx, o.ground ? ctx.groundY(cx, cz) : cy, cz, rx * 1.15 + 0.1, rz * 1.15 + 0.1, 0.03, !!o.ground); }
  for (let i = 0; i < n; i++) {
    const a = ctx.random() * 6.283, d = Math.sqrt(ctx.random());
    const x = cx + Math.cos(a) * rx * d, z = cz + Math.sin(a) * rz * d;
    const y = o.ground ? ctx.groundY(x, z) : cy;
    const r = 0.022 + ctx.random() * (rMax - 0.022), h = 0.03 + Math.pow(ctx.random(), 1.6) * hMax;
    candle(ctx, x, y, z, r, h, ctx.random() < lit, o.seg ?? 5);
  }
}
// low lumpy disc of wax; on ground it drapes the terrain
export function puddle(ctx, cx, cy, cz, rx, rz, t, ground = false, seg = 16) {
  const rings = [0, 0.45, 0.8, 1], ph = ctx.random() * 9;
  const P = (ri, j) => {
    const a = (j / seg) * 6.283, e = 1 + 0.22 * Math.sin(a * 3 + ph) + 0.12 * Math.sin(a * 5 + ph * 2);
    const x = cx + Math.cos(a) * rx * rings[ri] * e, z = cz + Math.sin(a) * rz * rings[ri] * e;
    const base = ground ? ctx.groundY(x, z) : cy;
    return [x, base + 0.012 + t * (1 - rings[ri] * rings[ri]), z];
  };
  const ref = [cx, cy - 5, cz];
  for (let i = 0; i < rings.length - 1; i++) for (let j = 0; j < seg; j++) quad(ctx, P(i, j), P(i, (j + 1) % seg), P(i + 1, (j + 1) % seg), P(i + 1, j), ref);
}
// a wax curtain hanging from y0 along a face: O start, U along (unit, xz), N outward (unit, xz), width W
export function curtain(ctx, O, U, N, W, y0, o = {}) {
  const min = o.min ?? 0.5, max = o.max ?? 2, n = Math.max(2, Math.ceil(W / 0.2)), lod = o.lod ?? 1;
  const at = (u, y, off) => [O[0] + U[0] * u + N[0] * off, y, O[2] + U[2] * u + N[2] * off];
  const len = (u) => min + (max - min) * Math.max(0, Math.min(1, 0.5 + ctx.noise2d(u * 0.8 + O[0] * 0.37, O[2] * 0.37 + y0 * 0.21) * 0.95));
  const ref = at(W / 2, y0 - min / 2, -1.5);
  ctx.albedo(TEX.wax); ctx.roughness(0.5); ctx.metalness(0); ctx.smooth(); ctx.color(o.color ?? WAXC[1]);
  const rows = (u) => { const l = len(u); return [at(u, y0 + 0.035, -(o.lip ?? 0.12)), at(u, y0 + 0.03, 0.035), at(u, y0 - l * 0.35, 0.085), at(u, y0 - l * 0.75, 0.065), at(u, y0 - l, 0.02)]; };
  let prev = rows(0);
  for (let i = 1; i <= n; i++) {
    const cur = rows((i / n) * W);
    for (let k = 0; k < 4; k++) quad(ctx, prev[k], cur[k], cur[k + 1], prev[k + 1], ref);
    prev = cur;
  }
  if (lod <= 2) {
    const nd = Math.round((W / 0.25) * (o.drips ?? 1) / lod);
    for (let i = 0; i < nd; i++) {
      const u = 0.05 + ctx.random() * (W - 0.1), l = len(u), r = 0.04 + ctx.random() * 0.09;
      ctx.color(ctx.random() < 0.5 ? WAXC[3] : WAXC[2]);
      const p = at(u, y0 - l * (0.5 + ctx.random() * 0.4), 0.05 + r * 0.4);
      drip(ctx, p[0], p[1], p[2], 0.25 + ctx.random() * (o.tail ?? 1.1), r, lod === 1 ? 6 : 4);
    }
  }
}
// a lumpy wax sheet over a rectangular ledge top
export function waxCap(ctx, x0, x1, z0, z1, y, t) {
  const nx = Math.max(2, Math.ceil((x1 - x0) / 0.35)), nz = Math.max(2, Math.ceil((z1 - z0) / 0.35));
  ctx.albedo(TEX.wax); ctx.roughness(0.5); ctx.smooth(); ctx.color(WAXC[1]);
  const H = (i, j) => {
    const x = x0 + ((x1 - x0) * i) / nx, z = z0 + ((z1 - z0) * j) / nz;
    const edge = Math.min(1, Math.min(i, nx - i, j, nz - j) / 1.2);
    return [x, y + 0.005 + t * edge * (0.55 + 0.45 * ctx.noise2d(x * 1.7, z * 1.7)), z];
  };
  const ref = [(x0 + x1) / 2, y - 3, (z0 + z1) / 2];
  for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) quad(ctx, H(i, j), H(i + 1, j), H(i + 1, j + 1), H(i, j + 1), ref);
}
// a skin of moss climbing a face from the foot: O, U, N as curtain
export function mossSkin(ctx, O, U, N, W, y0, h) {
  const n = Math.max(2, Math.ceil(W / 0.3));
  ctx.albedo(TEX.moss); ctx.roughness(0.95); ctx.smooth(); ctx.color("oklch(.78 .09 135)");
  const at = (u, y, off) => [O[0] + U[0] * u + N[0] * off, y, O[2] + U[2] * u + N[2] * off];
  const ref = at(W / 2, y0, -1);
  const top = (u) => y0 + h * Math.max(0.15, 0.55 + 0.6 * ctx.noise2d(u * 1.3 + O[0], O[2] * 0.5));
  for (let i = 0; i < n; i++) {
    const u0 = (i / n) * W, u1 = ((i + 1) / n) * W;
    quad(ctx, at(u0, y0, 0.03), at(u1, y0, 0.03), at(u1, top(u1), 0.012), at(u0, top(u0), 0.012), ref);
  }
}
// square-section tube along a polyline
export function tube(ctx, pts, w) {
  const fr = pts.map((p, i) => {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    let t = norm([b[0] - a[0], b[1] - a[1], b[2] - a[2]]);
    let up = Math.abs(t[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0];
    const s = norm(cross(t, up)), n = cross(s, t);
    return [0, 1, 2, 3].map((k) => { const cs = k === 0 || k === 3 ? 1 : -1, cn = k < 2 ? 1 : -1; return [p[0] + (s[0] * cs + n[0] * cn) * w, p[1] + (s[1] * cs + n[1] * cn) * w, p[2] + (s[2] * cs + n[2] * cn) * w]; });
  });
  for (let i = 0; i < pts.length - 1; i++) {
    const ref = [(pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2, (pts[i][2] + pts[i + 1][2]) / 2];
    for (let k = 0; k < 4; k++) quad(ctx, fr[i][k], fr[i][(k + 1) % 4], fr[i + 1][(k + 1) % 4], fr[i + 1][k], ref);
  }
}
export const norm = (v) => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
export const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
// chain links along a polyline, alternating planes; lod >= 3 draws a plain rod
export function chain(ctx, pts, lod = 1, size = 1) {
  ctx.albedo(TEX.iron); ctx.color("oklch(.82 .03 50)"); ctx.metalness(0.55); ctx.roughness(0.75); ctx.flat();
  if (lod >= 3) { tube(ctx, pts, 0.02 * size); return; }
  const step = 0.085 * size; let idx = 0;
  for (let s = 0; s < pts.length - 1; s++) {
    const a = pts[s], b = pts[s + 1], seg = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], L = Math.hypot(...seg), d = norm(seg);
    const pa = norm(cross(d, Math.abs(d[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0])), pb = cross(d, pa);
    for (let t = 0; t < L; t += step, idx++) {
      const c = [a[0] + d[0] * t, a[1] + d[1] * t, a[2] + d[2] * t], side = idx % 2 ? pa : pb, nn = cross(d, side), K = 6, w = 0.012 * size;
      const ring = [];
      for (let k = 0; k <= K; k++) {
        const th = (k / K) * 6.283, ca = Math.cos(th), sa = Math.sin(th);
        const p = [c[0] + d[0] * ca * 0.05 * size + side[0] * sa * 0.028 * size, c[1] + d[1] * ca * 0.05 * size + side[1] * sa * 0.028 * size, c[2] + d[2] * ca * 0.05 * size + side[2] * sa * 0.028 * size];
        const rad = norm([d[0] * ca + side[0] * sa, d[1] * ca + side[1] * sa, d[2] * ca + side[2] * sa]);
        ring.push({ p, q: [0, 1, 2, 3].map((m) => { const cr = m === 0 || m === 3 ? 1 : -1, cn = m < 2 ? 1 : -1; return [p[0] + (rad[0] * cr + nn[0] * cn) * w, p[1] + (rad[1] * cr + nn[1] * cn) * w, p[2] + (rad[2] * cr + nn[2] * cn) * w]; }) });
      }
      for (let k = 0; k < K; k++) {
        const ref = [(ring[k].p[0] + ring[k + 1].p[0]) / 2, (ring[k].p[1] + ring[k + 1].p[1]) / 2, (ring[k].p[2] + ring[k + 1].p[2]) / 2];
        for (let m = 0; m < 4; m++) quad(ctx, ring[k].q[m], ring[k].q[(m + 1) % 4], ring[k + 1].q[(m + 1) % 4], ring[k + 1].q[m], ref);
      }
    }
  }
}
export function catenary(a, b, sag, n = 12) {
  const out = [];
  for (let i = 0; i <= n; i++) { const t = i / n; out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t - sag * 4 * t * (1 - t), a[2] + (b[2] - a[2]) * t]); }
  return out;
}
