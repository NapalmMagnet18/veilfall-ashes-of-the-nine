// The Blood Woods forest floor: one INSTANCE SET per row. params.kind picks the shape (a small clump or piece,
// drawn many times); the records scatter it inside params.bounds (a radius, or a polygon [[x,z],…] local to
// the row) minus params.clear ([[x,z,r],…] local circles), seeded by the row's seed, each copy set on the
// ground with ctx.groundY (the banks are steep). params:
//   kind: litter | fern | thorn | bones | fungus | roots | stump
//   count: copies at lod 1 (lower levels thin them; small kinds drop at lod 4+)
//   origin: [x, z] the row's world feet, so the walkable floor (veilfall-map floorDist) can be read
//   zone: "out" = only off the walkable floor (anything tall), "in" = only on it, "any" (default)
// No collider: ground cover never blocks.
import { floorDist, orchDist } from "../lib/data/veilfall-map.js";
const TAU = Math.PI * 2;
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const addv = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const clamp01 = (v) => Math.min(1, Math.max(0, v));

// the emitter: every face goes through here; with track on, each vertex carries a sway weight into uv().y
function emitter(ctx, track) {
  const uvs = track ? [] : null;
  const E = {
    uvs,
    tri(a, b, c) { ctx.tri(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]); if (uvs) uvs.push(0, a[3] ?? 0, 0, b[3] ?? 0, 0, c[3] ?? 0); },
    quad(a, b, c, d) { E.tri(a, b, c); E.tri(a, c, d); },
  };
  return E;
}
// a swept tube along pts with radius rad(t); returns the frames for spikes and shoots
function tube(E, pts, rad, n, w = null) {
  const m = pts.length, rings = [], F = [];
  let N = null;
  for (let i = 0; i < m; i++) {
    const T = norm(sub(pts[Math.min(i + 1, m - 1)], pts[Math.max(i - 1, 0)]));
    if (!N) { const ref = Math.abs(T[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0]; N = norm(cross(ref, T)); }
    else N = norm(sub(N, mul(T, dot(N, T))));
    const B = cross(T, N), r = rad(i / (m - 1)), ww = w ? w(i / (m - 1)) : 0, ring = [];
    for (let k = 0; k < n; k++) {
      const a = (k / n) * TAU, c = Math.cos(a) * r, s = Math.sin(a) * r;
      const p = [pts[i][0] + N[0] * c + B[0] * s, pts[i][1] + N[1] * c + B[1] * s, pts[i][2] + N[2] * c + B[2] * s, ww];
      ring.push(p);
    }
    rings.push(ring); F.push({ P: pts[i], T, N, B, r });
  }
  for (let i = 0; i < m - 1; i++) for (let k = 0; k < n; k++) E.quad(rings[i][k], rings[i][(k + 1) % n], rings[i + 1][(k + 1) % n], rings[i + 1][k]);
  return F;
}
function spike(E, f, ang, len) {
  const dir = addv(mul(f.N, Math.cos(ang)), mul(f.B, Math.sin(ang))), side = cross(dir, f.T), w = f.r * 0.9;
  const c = addv(f.P, mul(dir, f.r * 0.8)), tip = addv(addv(c, mul(dir, len)), mul(f.T, len * 0.45));
  const b1 = addv(c, mul(f.T, -w)), b2 = addv(addv(c, mul(f.T, w * 0.6)), mul(side, w)), b3 = addv(addv(c, mul(f.T, w * 0.6)), mul(side, -w));
  E.tri(b1, b2, tip); E.tri(b2, b3, tip); E.tri(b3, b1, tip);
}
// an ellipsoid; lat0..lat1 as fractions of the pole-to-pole sweep (0.5..1 = the lower cup)
function blob(E, c, rx, ry, rz, n = 8, m = 5, lat0 = 0, lat1 = 1) {
  const P = (i, k) => { const t = (lat0 + (lat1 - lat0) * (i / m)) * Math.PI, a = (k / n) * TAU; return [c[0] + Math.sin(t) * Math.cos(a) * rx, c[1] + Math.cos(t) * ry, c[2] + Math.sin(t) * Math.sin(a) * rz]; };
  for (let i = 0; i < m; i++) for (let k = 0; k < n; k++) E.quad(P(i, k), P(i, k + 1), P(i + 1, k + 1), P(i + 1, k));
}
// a solid of revolution: prof = [[r, y], …] bottom to top, about (cx, cz)
function lathe(E, cx, by, cz, prof, n) {
  for (let j = 0; j < prof.length - 1; j++) for (let k = 0; k < n; k++) {
    const a0 = (k / n) * TAU, a1 = ((k + 1) / n) * TAU, [r0, y0] = prof[j], [r1, y1] = prof[j + 1];
    E.quad([cx + Math.cos(a0) * r0, by + y0, cz + Math.sin(a0) * r0], [cx + Math.cos(a0) * r1, by + y1, cz + Math.sin(a0) * r1], [cx + Math.cos(a1) * r1, by + y1, cz + Math.sin(a1) * r1], [cx + Math.cos(a1) * r0, by + y0, cz + Math.sin(a0 + (a1 - a0)) * r0]);
  }
}
const pick = (R, arr) => arr[Math.floor(R() * arr.length) % arr.length];

// ---------- the shapes (one clump or piece each, drawn per record) ----------
const LEAF = ["oklch(0.42 0.11 40)", "oklch(0.32 0.11 22)", "oklch(0.36 0.05 55)", "oklch(0.46 0.09 62)", "oklch(0.38 0.13 27)", "oklch(0.27 0.07 24)", "oklch(0.44 0.1 48)"]; // damp: no bright leaf stands alone
function leaf(E, x, y, z, yaw, L, W, curl, tx, tz) {
  const f = [Math.cos(yaw), 0, Math.sin(yaw)], s = [-Math.sin(yaw), 0, Math.cos(yaw)];
  const P = (u, v, h) => { const px = x + f[0] * u + s[0] * v, pz = z + f[2] * u + s[2] * v; return [px, y + h + (px - x) * tx + (pz - z) * tz, pz]; };
  const base = P(-L / 2, 0, curl * 0.7), tip = P(L / 2, 0, curl * 0.9), mid = P(0.02 * L, 0, -curl * 0.15);
  const l = P(-0.05 * L, W / 2, curl), r = P(-0.05 * L, -W / 2, curl * 0.8);
  E.tri(base, l, mid); E.tri(l, tip, mid); E.tri(base, mid, r); E.tri(mid, tip, r);
}
function shapeLitter(E, ctx, lod) {
  const R = () => ctx.random(), n = lod >= 3 ? 10 : lod === 2 ? 18 : 28;
  ctx.flat(); ctx.roughness(0.88);
  ctx.color("oklch(0.17 0.03 35)"); // the mulch bed: a low dark disc the leaves lie on, so they read as a drift, not confetti on stone
  { const m = lod >= 3 ? 7 : 12, c = [0, 0.004, 0]; for (let i = 0; i < m; i++) { const a0 = (i / m) * TAU, a1 = ((i + 1) / m) * TAU, r0 = 0.75 + Math.sin(i * 2.3) * 0.12, r1 = 0.75 + Math.sin((i + 1) * 2.3) * 0.12; E.tri(c, [Math.cos(a1) * r1, -0.01, Math.sin(a1) * r1], [Math.cos(a0) * r0, -0.01, Math.sin(a0) * r0]); } }
  for (let i = 0; i < n; i++) {
    const a = R() * TAU, d = Math.sqrt(R()) * 0.85, x = Math.cos(a) * d, z = Math.sin(a) * d;
    const y = 0.01 + (1 - d / 0.85) * 0.045 * R() + i * 0.0004; // a drift: deeper in the middle
    const L = 0.055 + R() * 0.05;
    ctx.color(pick(R, LEAF));
    leaf(E, x, y, z, R() * TAU, L, L * (0.42 + R() * 0.25), 0.008 + R() * 0.02, (R() - 0.5) * 0.5, (R() - 0.5) * 0.5);
  }
  if (lod >= 3) return;
  ctx.color("oklch(0.2 0.02 45)"); ctx.roughness(0.95);
  for (let i = 0; i < 2; i++) { // twigs, one forked
    const a = R() * TAU, x0 = Math.cos(a) * 0.4, z0 = Math.sin(a) * 0.4, b = R() * TAU, L = 0.3 + R() * 0.25;
    const pts = []; for (let k = 0; k <= 4; k++) pts.push([x0 + Math.cos(b) * L * k / 4 + Math.sin(k * 1.7) * 0.015, 0.012 + Math.sin(k * 0.9) * 0.008, z0 + Math.sin(b) * L * k / 4]);
    const F = tube(E, pts, (t) => 0.009 * (1 - t * 0.6), 4);
    const p = F[2].P, bb = b + 0.7; tube(E, [p, [p[0] + Math.cos(bb) * 0.12, 0.016, p[2] + Math.sin(bb) * 0.12]], (t) => 0.005 * (1 - t * 0.6), 3);
  }
  for (let i = 0; i < 2; i++) { // broken apple husks: a rotten cup, pale flesh inside
    const a = R() * TAU, d = 0.2 + R() * 0.5, c = [Math.cos(a) * d, 0.03, Math.sin(a) * d];
    ctx.color("oklch(0.3 0.08 30)"); blob(E, c, 0.034, 0.03, 0.034, 7, 4, 0.45, 1);
    ctx.color("oklch(0.5 0.06 60)"); blob(E, [c[0], c[1] + 0.004, c[2]], 0.028, 0.022, 0.028, 6, 2, 0.5, 0.8);
  }
}
function shapeFern(E, ctx, lod) {
  const R = () => ctx.random(), n = lod >= 3 ? 5 : lod === 2 ? 7 : 9, segs = lod >= 3 ? 4 : lod === 2 ? 6 : 8;
  ctx.flat(); ctx.roughness(0.65);
  ctx.color("oklch(0.13 0.02 20)"); // the heart
  for (let i = 0; i < 6; i++) { const a = i * 1.05, h = 0.06 + R() * 0.04; E.tri([0, 0, 0, 0], [Math.cos(a) * 0.06, h, Math.sin(a) * 0.06, 0.05], [Math.cos(a + 1.05) * 0.06, h * 0.8, Math.sin(a + 1.05) * 0.06, 0.05]); }
  for (let f = 0; f < n; f++) {
    const yaw = (f / n) * TAU + R() * 0.5, cy = Math.cos(yaw), sy = Math.sin(yaw), px = -sy, pz = cy;
    const len = 0.45 + R() * 0.4, lift = 1.0 + R() * 0.5, droop = 1.5 + R() * 0.7, dark = R() < 0.25;
    const pts = [];
    for (let s = 0; s <= segs; s++) { const t = s / segs, d = t * len * 0.85, h = Math.sin(t * Math.PI * 0.6) * len * lift * 0.6 - t * t * t * len * droop * 0.35; pts.push([cy * d, 0.04 + Math.max(h, -0.02), sy * d, t]); }
    const colAt = (t) => dark ? `oklch(${0.12 + t * 0.08} 0.05 20)` : `oklch(${0.15 + t * 0.26} ${0.04 + t * 0.13} ${20 + t * 7})`;
    for (let s = 0; s < segs; s++) {
      const a = pts[s], b = pts[s + 1], tm = (a[3] + b[3]) / 2, rw = 0.008 * (1 - tm) + 0.002;
      ctx.color(colAt(tm));
      E.quad([a[0] + px * rw, a[1], a[2] + pz * rw, a[3]], [b[0] + px * rw, b[1], b[2] + pz * rw, b[3]], [b[0] - px * rw, b[1] + 0.004, b[2] - pz * rw, b[3]], [a[0] - px * rw, a[1] + 0.004, a[2] - pz * rw, a[3]]);
      if (s === 0) continue;
      const pl = len * 0.24 * Math.pow(1 - tm, 0.6) * Math.min(1, tm * 3.5) + 0.012; // pinnae swell then taper
      for (const side of [-1, 1]) {
        const fx = (b[0] - a[0]), fy = (b[1] - a[1]), fz = (b[2] - a[2]);
        const tip = [a[0] + px * side * pl + fx * 0.9, a[1] + fy * 0.6 - pl * 0.3, a[2] + pz * side * pl + fz * 0.9, Math.min(1, tm + 0.08)];
        const vein = [a[0] + px * side * pl * 0.45 + fx * 0.45, a[1] + fy * 0.4 + 0.012, a[2] + pz * side * pl * 0.45 + fz * 0.45, tm];
        const b1 = [a[0] + fx * 0.85, a[1] + fy * 0.85, a[2] + fz * 0.85, b[3]];
        ctx.color(colAt(tm + 0.05));
        E.tri(a, vein, tip); E.tri(vein, b1, tip); E.tri(a, b1, vein);
      }
    }
  }
  if (lod <= 1) { // two fiddleheads coiled in the heart
    ctx.color("oklch(0.22 0.09 22)");
    for (let i = 0; i < 2; i++) {
      const a0 = R() * TAU, pts = [];
      for (let k = 0; k <= 7; k++) { const t = k / 7, r = 0.05 * (1 - t * 0.7); pts.push([Math.cos(a0) * 0.02 + Math.cos(a0) * (t < 0.5 ? 0 : r * Math.sin((t - 0.5) * 9)), 0.03 + t * 0.14 + (t > 0.5 ? r * Math.cos((t - 0.5) * 9) - r : 0), Math.sin(a0) * 0.02, t * 0.5]); }
      tube(E, pts, (t) => 0.007 * (1 - t * 0.4), 4, (t) => t * 0.4);
    }
  }
}
function shapeThorn(E, ctx, lod) {
  const R = () => ctx.random(), canes = lod >= 3 ? 3 : lod === 2 ? 4 : 6, st = lod >= 3 ? 8 : 14, sides = lod >= 2 ? 4 : 5;
  const berries = [];
  for (let c = 0; c < canes; c++) {
    const a = R() * TAU, d = R() * 0.45, A = [Math.cos(a) * d, -0.03, Math.sin(a) * d];
    const dir = R() * TAU, dx = Math.cos(dir), dz = Math.sin(dir), span = 0.8 + R() * 0.7, H = 0.6 + R() * 0.8;
    const B = [A[0] + dx * span, -0.05, A[2] + dz * span];
    const C1 = [A[0] + dx * 0.15, H * 1.25, A[2] + dz * 0.15], C2 = [B[0] - dx * 0.25, H * 1.1, B[2] - dz * 0.25];
    const loop = R() < 0.5, wob = 0.08 + R() * 0.1, pts = [];
    for (let i = 0; i <= st; i++) {
      const t = i / st, u = 1 - t;
      let p = [0, 1, 2].map((k) => u * u * u * A[k] + 3 * u * u * t * C1[k] + 3 * u * t * t * C2[k] + t * t * t * B[k]);
      const sw = Math.sin(t * Math.PI * 2.2 + c) * wob;
      p = [p[0] - dz * sw, p[1], p[2] + dx * sw];
      if (loop && t > 0.55 && t < 0.9) { const q = (t - 0.55) / 0.35 * TAU; p = [p[0] - dz * Math.sin(q) * 0.14, p[1] + (1 - Math.cos(q)) * 0.12, p[2] + dx * Math.sin(q) * 0.14]; }
      pts.push(p);
    }
    ctx.flat(); ctx.color("oklch(0.14 0.018 20)"); ctx.roughness(0.55);
    const F = tube(E, pts, (t) => 0.02 * (1 - t * 0.6), sides);
    ctx.color("oklch(0.2 0.04 25)");
    for (let i = 1; i < F.length - 1; i++) {
      spike(E, F[i], i * 2.4 + c, 0.035 + R() * 0.02);
      if (lod <= 1) spike(E, F[i], i * 2.4 + c + 3.0, 0.03 + R() * 0.015);
      if (R() < 0.18) berries.push(addv(F[i].P, [0, -0.03, 0]));
    }
    if (lod <= 2) { // a side shoot
      const f = F[Math.floor(st * 0.4)], sd = cross(f.T, [0, 1, 0]), q = [];
      for (let k = 0; k <= 4; k++) q.push(addv(addv(f.P, mul(norm(sd), k * 0.08)), [0, Math.sin(k * 0.8) * 0.06 - k * 0.02, 0]));
      ctx.color("oklch(0.14 0.018 20)");
      const G = tube(E, q, (t) => 0.01 * (1 - t * 0.7), 4);
      ctx.color("oklch(0.2 0.04 25)"); for (let k = 1; k < G.length - 1; k++) spike(E, G[k], k * 2, 0.025);
    }
  }
  ctx.smooth(); ctx.roughness(0.35);
  for (const b of berries.slice(0, lod <= 1 ? 12 : 6)) { ctx.color(R() < 0.6 ? "oklch(0.33 0.14 22)" : "oklch(0.24 0.09 18)"); blob(E, b, 0.018, 0.016, 0.018, 6, 4); blob(E, [b[0] + 0.02, b[1] - 0.015, b[2]], 0.014, 0.013, 0.014, 5, 3); }
}
function shapeBones(E, ctx, lod) {
  const R = () => ctx.random(), bone = "oklch(0.8 0.03 85)", seg = lod >= 3 ? 4 : 6;
  ctx.smooth(); ctx.roughness(1); ctx.color("oklch(0.22 0.012 40)"); // the ash it sank into
  blob(E, [0, -0.06, 0], 0.9, 0.09, 0.55, 10, 3, 0, 0.5);
  ctx.color(bone); ctx.roughness(0.6);
  // ribcage: a bowed spine and six rib pairs, the left side fallen flat
  const spine = []; for (let i = 0; i <= 6; i++) spine.push([-0.45 + i * 0.1, 0.05 + Math.sin(i / 6 * Math.PI) * 0.03, 0]);
  tube(E, spine, () => 0.022, seg);
  for (let i = 1; i <= (lod >= 3 ? 3 : 6); i++) {
    const sx = -0.45 + i * 0.09, sz = 0.16 + Math.sin(i / 6 * Math.PI) * 0.06;
    for (const side of [-1, 1]) {
      const pts = [];
      for (let k = 0; k <= 6; k++) { const th = (k / 6) * Math.PI * 0.85, flat = side < 0 ? 0.25 : 1; pts.push([sx + k * 0.012, 0.05 + Math.sin(th) * 0.17 * flat, side * (1 - Math.cos(th)) * sz * (side < 0 ? 1.3 : 1)]); }
      tube(E, pts, (t) => 0.011 * (1 - t * 0.4), lod >= 2 ? 3 : 4);
    }
  }
  // the skull, half buried, socket-dark, its jaw thrown aside
  blob(E, [0.42, 0.0, 0.12], 0.1, 0.09, 0.12, 9, 6);
  blob(E, [0.42, 0.0, 0.0], 0.065, 0.05, 0.06, 7, 4);
  ctx.color("oklch(0.1 0.01 40)");
  blob(E, [0.39, 0.035, 0.015], 0.024, 0.022, 0.02, 5, 3); blob(E, [0.46, 0.035, 0.015], 0.024, 0.022, 0.02, 5, 3);
  ctx.color(bone); tube(E, [[0.55, 0.012, -0.12], [0.62, 0.015, -0.05], [0.6, 0.012, 0.03]], () => 0.014, 4);
  // long bones with knuckled ends
  for (let i = 0; i < 3; i++) {
    const a = R() * TAU, c = [-0.2 + R() * 0.5, 0.02, -0.35 + R() * 0.2 + (i === 2 ? 0.6 : 0)], L = 0.22 + R() * 0.16;
    const p0 = [c[0] - Math.cos(a) * L, 0.02, c[2] - Math.sin(a) * L], p1 = [c[0] + Math.cos(a) * L, 0.025, c[2] + Math.sin(a) * L];
    tube(E, [p0, c, p1], (t) => 0.018 - Math.sin(t * Math.PI) * 0.005, seg);
    blob(E, p0, 0.032, 0.028, 0.032, 6, 4); blob(E, p1, 0.028, 0.025, 0.028, 6, 4);
  }
  if (lod >= 3) return;
  // a rusted sickle: worn handle, pitted crescent blade lying in the ash
  ctx.flat(); ctx.color("oklch(0.27 0.04 50)"); ctx.roughness(0.9);
  tube(E, [[-0.75, 0.02, 0.35], [-0.55, 0.022, 0.3], [-0.4, 0.025, 0.27]], () => 0.016, 6);
  ctx.color("oklch(0.4 0.09 42)"); ctx.metalness(0.55); ctx.roughness(0.75);
  const cx = -0.4, cz = 0.05, rr = 0.22, N = 12;
  for (let k = 0; k < N; k++) {
    const t0 = k / N, t1 = (k + 1) / N, a0 = Math.PI * 0.5 - t0 * Math.PI * 1.15, a1 = Math.PI * 0.5 - t1 * Math.PI * 1.15;
    const w0 = 0.045 * (1 - t0) + 0.004, w1 = 0.045 * (1 - t1) + 0.004;
    E.quad([cx + Math.cos(a0) * rr, 0.03, cz + Math.sin(a0) * rr], [cx + Math.cos(a1) * rr, 0.03, cz + Math.sin(a1) * rr], [cx + Math.cos(a1) * (rr - w1), 0.036, cz + Math.sin(a1) * (rr - w1)], [cx + Math.cos(a0) * (rr - w0), 0.036, cz + Math.sin(a0) * (rr - w0)]);
  }
  ctx.metalness(0);
}
function shapeFungus(E, ctx, lod) {
  const R = () => ctx.random(), n = lod >= 3 ? 6 : 10, gill = [0.4, 0.035, 0.03];
  ctx.smooth();
  // a rotten log chunk, half sunk, wearing bracket shelves
  ctx.color("oklch(0.2 0.025 35)"); ctx.roughness(0.95);
  tube(E, [[-0.35, 0.02, 0.1], [0, 0.04, 0.12], [0.35, 0.03, 0.08]], () => 0.11, n);
  for (let i = 0; i < (lod >= 3 ? 2 : 5); i++) {
    const x = -0.25 + i * 0.13, y = 0.06 + (i % 2) * 0.05, z = 0.1 - 0.11 - 0.02, r = 0.07 + R() * 0.05;
    const prof = []; for (let k = 0; k <= 6; k++) { const a = Math.PI * (k / 6); prof.push([x + Math.cos(a) * r, z - Math.sin(a) * r * 0.8]); }
    ctx.emissive(null); ctx.color(i % 2 ? "oklch(0.84 0.03 80)" : "oklch(0.5 0.14 24)"); ctx.roughness(0.7);
    for (let k = 0; k < 6; k++) { E.tri([x, y + 0.015, z + 0.02], [prof[k][0], y + 0.005, prof[k][1]], [prof[k + 1][0], y + 0.005, prof[k + 1][1]]); }
    ctx.color("oklch(0.3 0.1 22)"); ctx.emissive(gill[0], gill[1], gill[2]);
    for (let k = 0; k < 6; k++) { E.tri([x, y - 0.01, z + 0.02], [prof[k + 1][0], y - 0.002, prof[k + 1][1]], [prof[k][0], y - 0.002, prof[k][1]]); }
  }
  // caps in a cluster: bone-white and sick red, gills glowing faintly
  const caps = lod >= 3 ? 4 : 8;
  for (let i = 0; i < caps; i++) {
    const a = R() * TAU, d = 0.15 + R() * 0.35, x = Math.cos(a) * d, z = 0.25 + Math.sin(a) * d * 0.8;
    const h = 0.04 + R() * 0.15, r = 0.03 + R() * 0.06, red = R() < 0.4, lean = (R() - 0.5) * 0.04;
    ctx.emissive(null); ctx.color("oklch(0.78 0.03 80)"); ctx.roughness(0.8);
    lathe(E, x, -0.01, z, [[r * 0.35, 0], [r * 0.28, h * 0.6], [r * 0.25, h]], 6);
    ctx.color(red ? "oklch(0.45 0.15 22)" : "oklch(0.87 0.03 82)"); ctx.roughness(red ? 0.4 : 0.7);
    lathe(E, x + lean, h - 0.01, z, [[r, 0], [r * 0.95, r * 0.25], [r * 0.7, r * 0.5], [r * 0.3, r * 0.65], [0.001, r * 0.68]], 8);
    ctx.color("oklch(0.32 0.11 22)"); ctx.emissive(gill[0], gill[1], gill[2]);
    lathe(E, x + lean, h - 0.012, z, [[r * 0.3, 0.004], [r * 0.98, 0.001]], 8);
  }
  ctx.emissive(null);
}
function shapeRoots(E, ctx, lod) {
  const R = () => ctx.random(), sides = lod >= 3 ? 4 : lod === 2 ? 5 : 7, st = lod >= 3 ? 8 : 18;
  ctx.smooth(); ctx.roughness(0.85);
  const ph = R() * 6, pts = [];
  for (let i = 0; i <= st; i++) { const t = i / st, x = -2.3 + t * 4.6, r = 0.13 * (1 - t * 0.75); pts.push([x, -r * 0.35 + Math.sin(t * 9 + ph) * r * 0.25, Math.sin(t * 4.1 + ph) * 0.35 + Math.sin(t * 11 + ph * 2) * 0.08]); }
  ctx.color("oklch(0.19 0.025 35)");
  const F = tube(E, pts, (t) => 0.13 * (1 - t * 0.75), sides);
  blob(E, [-2.3, -0.04, pts[0][2]], 0.24, 0.12, 0.22, sides + 1, 4); // the flare where it leaves its tree
  for (let b = 0; b < (lod >= 3 ? 1 : 3); b++) {
    const f = F[Math.floor(st * (0.2 + b * 0.25))], side = b % 2 ? 1 : -1, L = 0.9 + R() * 0.7, q = [];
    for (let k = 0; k <= 6; k++) { const t = k / 6, r = 0.06 * (1 - t * 0.7); q.push([f.P[0] + t * L * 0.6, -r * 0.4 + Math.sin(t * 7 + b) * 0.02, f.P[2] + side * t * L * 0.8 + Math.sin(t * 5) * 0.06]); }
    ctx.color(b === 1 ? "oklch(0.27 0.08 25)" : "oklch(0.21 0.03 35)");
    tube(E, q, (t) => 0.06 * (1 - t * 0.7), Math.max(4, sides - 2));
  }
  if (lod <= 1) { // scarlet sap weeping from a split
    ctx.color("oklch(0.36 0.16 25)"); ctx.roughness(0.2);
    const f = F[Math.floor(st * 0.35)]; blob(E, addv(f.P, [0, f.r * 0.6, 0]), 0.07, 0.02, 0.05, 6, 3);
  }
}
function shapeStump(E, ctx, lod) {
  const R = () => ctx.random(), n = lod >= 3 ? 8 : lod === 2 ? 12 : 16, rows = lod >= 3 ? 3 : 6, H = 1.0, Hc = 0.58;
  const lobes = 5, lp = R() * TAU;
  const top = []; for (let k = 0; k < n; k++) { const a = (k / n) * TAU, cut = Math.cos(a) > 0.15; top.push(cut ? Hc : Hc + (k % 2 ? 0.1 : 0.25 + R() * 0.17) * H); }
  const rad = (a, y) => { const flare = Math.pow(Math.max(0, Math.cos(lobes * a + lp)), 2) * 0.4 * clamp01(1 - y / 0.35); return 0.36 * (1 + flare + clamp01(1 - y / 0.2) * 0.15) + Math.sin(a * 13) * 0.012; };
  const V = (k, j) => { const a = (k / n) * TAU, y = -0.12 + (top[k % n] + 0.12) * (j / rows); const r = rad(a, y) * (j === rows && top[k % n] > Hc ? 0.75 : 1); return [Math.cos(a) * r, y, Math.sin(a) * r]; };
  ctx.flat(); ctx.color("oklch(0.18 0.02 30)"); ctx.roughness(0.95);
  for (let j = 0; j < rows; j++) for (let k = 0; k < n; k++) E.quad(V(k, j), V(k + 1, j), V(k + 1, j + 1), V(k, j + 1));
  // the cut half: growth rings around a bleeding heart; the broken half: pale splinters to the jag
  const RING = ["oklch(0.4 0.17 25)", "oklch(0.62 0.07 65)", "oklch(0.5 0.07 55)", "oklch(0.6 0.07 62)", "oklch(0.47 0.06 50)"];
  for (let k = 0; k < n; k++) {
    const a0 = (k / n) * TAU, a1 = ((k + 1) / n) * TAU;
    if (top[k] === Hc && top[(k + 1) % n] === Hc) {
      for (let q = 0; q < RING.length; q++) {
        const f0 = q / RING.length, f1 = (q + 1) / RING.length, r0 = 0.34 * f0, r1 = 0.34 * f1 * (q === RING.length - 1 ? 1.02 : 1);
        ctx.color(RING[q]); ctx.roughness(q === 0 ? 0.25 : 0.85);
        E.quad([Math.cos(a0) * r0, Hc + 0.002, Math.sin(a0) * r0], [Math.cos(a1) * r0, Hc + 0.002, Math.sin(a1) * r0], [Math.cos(a1) * r1, Hc + 0.002, Math.sin(a1) * r1], [Math.cos(a0) * r1, Hc + 0.002, Math.sin(a0) * r1]);
      }
    } else {
      ctx.color(k % 2 ? "oklch(0.58 0.07 62)" : "oklch(0.46 0.06 50)"); ctx.roughness(0.9);
      E.tri([0, Hc, 0], V(k, rows), V(k + 1, rows));
    }
  }
  if (lod <= 2) { // scarlet sap runs down from the heart
    ctx.color("oklch(0.37 0.16 25)"); ctx.roughness(0.2); ctx.flat();
    for (let i = 0; i < 4; i++) {
      const a = (R() - 0.5) * 1.6, L = 0.2 + R() * 0.3, w = 0.015 + R() * 0.012, r = rad(a, Hc) + 0.006, r2 = rad(a, Hc - L) + 0.006;
      const c = Math.cos(a), s = Math.sin(a), tx = -s * w, tz = c * w;
      E.quad([c * r + tx, Hc + 0.004, s * r + tz], [c * r - tx, Hc + 0.004, s * r - tz], [c * r2 - tx * 0.4, Hc - L, s * r2 - tz * 0.4], [c * r2 + tx * 0.4, Hc - L, s * r2 + tz * 0.4]);
    }
  }
}
const SHAPES = { litter: shapeLitter, fern: shapeFern, thorn: shapeThorn, bones: shapeBones, fungus: shapeFungus, roots: shapeRoots, stump: shapeStump };
const SMALL = { litter: 1, fern: 1, bones: 1, fungus: 1 };
// per kind: scale range, sink (m, × scale), the flattest ground it wants (normal y), tint spread
const SET = {
  litter: { s: [0.8, 1.4], sink: 0.0, minN: 0.55, tint: 0.25 },
  fern: { s: [0.8, 1.2], sink: 0.02, minN: 0.45, tint: 0.2 },
  thorn: { s: [0.75, 1.15], sink: 0.0, minN: 0.45, tint: 0.1 },
  bones: { s: [0.85, 1.15], sink: 0.02, minN: 0.75, tint: 0.08 },
  fungus: { s: [0.8, 1.3], sink: 0.0, minN: 0.65, tint: 0.12 },
  roots: { s: [0.7, 1.15], sink: 0.03, minN: 0.7, tint: 0.1 },
  stump: { s: [0.4, 1.1], sink: 0.04, minN: 0.6, tint: 0.1 },
};
// enemy pack spots (places/main/sim.js PACKS near the Gallows Path / Orchard): tall cover drops to knee height within KNEE_R
const PACK_SPOTS = [[36, 6], [36, 3], [38, 6], [40, 9], [42, 1], [48, -8], [76, -3], [78, -2], [79, 18], [50, 23], [66, 25], [82, 6]];
const KNEE_R = 7, TALL = { fern: 1, thorn: 1, stump: 1 };
function kneeScale(kind, wx, wz) {
  if (!TALL[kind]) return 1;
  let d = Infinity; for (const [px, pz] of PACK_SPOTS) d = Math.min(d, Math.hypot(wx - px, wz - pz));
  return d >= KNEE_R ? 1 : 0.5 + 0.5 * clamp01((d - 3) / (KNEE_R - 3));
}
// how much a kind wants a spot e metres outside the walkable floor (negative = on it)
function want(kind, e) {
  if (kind === "litter") return e < -2.5 ? 0.35 : e < 0 ? 1 : e < 4 ? 1 : e < 10 ? 0.75 : 0.45; // drifts bank up at the floor's edges
  if (kind === "fern" || kind === "thorn" || kind === "stump") return e < 4 ? 0.6 : e < 10 ? 1 : Math.max(0.35, 1 - (e - 10) / 14);
  return e < 0 ? 0.6 : e < 10 ? 1 : 0.6;
}
export function geometry(ctx) {
  const P = ctx.params ?? {}, kind = SHAPES[P.kind] ? P.kind : "litter", lod = ctx.lod ?? 1;
  const thin = lod <= 1 ? 1 : lod === 2 ? 0.65 : lod === 3 ? 0.35 : SMALL[kind] ? 0.06 : 0.15; // the far view: a thin scatter of the small kinds
  const want_n = Math.max(1, Math.round((P.count ?? 40) * thin));
  const E = emitter(ctx, kind === "fern");
  SHAPES[kind](E, ctx, lod);
  // scatter the records
  const cfg = SET[kind], [ox, oz] = P.origin ?? [0, 0], zone = P.zone ?? "any", margin = P.margin ?? 0.8;
  const poly = Array.isArray(P.bounds) ? P.bounds : null, rad = poly ? 0 : (typeof P.bounds === "number" ? P.bounds : P.radius ?? 6);
  let bx0 = -rad, bx1 = rad, bz0 = -rad, bz1 = rad;
  if (poly) { bx0 = Math.min(...poly.map((p) => p[0])); bx1 = Math.max(...poly.map((p) => p[0])); bz0 = Math.min(...poly.map((p) => p[1])); bz1 = Math.max(...poly.map((p) => p[1])); }
  const inside = (x, z) => {
    if (!poly) return x * x + z * z <= rad * rad;
    let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, zi] = poly[i], [xj, zj] = poly[j]; if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) c = !c; } return c;
  };
  const clear = P.clear ?? [];
  ctx.instances({ layout: { offset: "float32x3", yaw: "float32", scale: "float32", tint: "float32x3" } });
  let placed = 0;
  for (let tries = 0; tries < want_n * 10 && placed < want_n; tries++) {
    const x = bx0 + ctx.random() * (bx1 - bx0), z = bz0 + ctx.random() * (bz1 - bz0), roll = ctx.random();
    if (!inside(x, z)) continue;
    let bare = false; for (const c of clear) if ((x - c[0]) ** 2 + (z - c[1]) ** 2 < c[2] * c[2]) { bare = true; break; }
    if (bare) continue;
    const wx = x + ox, wz = z + oz, fd = floorDist(wx, wz);
    if (zone === "out" && fd < margin) continue;
    if (zone === "in" && fd > -0.4) continue;
    const e = Math.min(fd, orchDist(wx, wz));
    const drift = 0.35 + 0.65 * clamp01(ctx.noise2d(wx * 0.17, wz * 0.17) * 0.8 + 0.5);
    if (roll > want(kind, e) * drift) continue;
    const nrm = ctx.groundNormal(x, z);
    if (nrm.y < cfg.minN) continue;
    const s = (cfg.s[0] + ctx.random() * (cfg.s[1] - cfg.s[0])) * kneeScale(kind, wx, wz), tv = (ctx.random() - 0.5) * cfg.tint, warm = (ctx.random() - 0.5) * cfg.tint * 0.6;
    const y = ctx.groundY(x, z) - cfg.sink * s - (1 - nrm.y) * 0.25 * s; // sink deeper on a slope so the downhill edge never floats
    ctx.instance([x, y, z], ctx.random() * 360, s, [1 + tv + warm, 1 + tv, 1 + tv - warm]);
    placed++;
  }
  if (E.uvs) return { uvs: E.uvs };
}
export function collider() { return null; }
