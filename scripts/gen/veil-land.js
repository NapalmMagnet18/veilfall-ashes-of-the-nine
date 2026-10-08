// The Veil's land: the broken ledge the Lantern Shrine stands on, the ravine's cliffs, and the far ridge
// with the Dripping Gate. params.kind: "ledge" | "cliff" { w, d, h } | "ridge" { len, h, gx }.
// Ledge: origin = the world origin, top of the flags at y = 0, the tip runs out to z ≈ -19.6 over the ravine.
import { TEX, xf, face, quad, bevelBox, rough, puddle } from "./shapes.js";
const FLAG = "cdn/texture-wet-dark-slate-flagstone-worn-smooth.png";
const ASH = "cdn/texture-terrain-ash-dirt-cinders-and-rubble-dark.png";
const ROCK = "cdn/texture-weathered-wet-dark-granite.png";
const C0 = [0, -4];
const BASE = [[-13, 13], [-13, 10], [-12.5, 4], [-11, -1], [-9.5, -5.5], [-8.2, -9], [-7.3, -12], [-6.3, -14.8], [-5, -17], [-3, -18.6], [-0.8, -19.6], [1.6, -19.2], [3.6, -18], [5.3, -16.2], [6.5, -13.6], [7.5, -10.5], [8.7, -6.5], [10.3, -2], [12, 3], [13, 10], [13, 13]];
function outline(ctx) {
  const o = [];
  for (let i = 0; i < BASE.length; i++) {
    const a = BASE[i], b = BASE[(i + 1) % BASE.length], back = a[1] > 12.5 && b[1] > 12.5;
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = back ? 1 : Math.max(1, Math.ceil(L / 0.7));
    const nx = (b[1] - a[1]) / L, nz = -(b[0] - a[0]) / L;
    for (let k = 0; k < n; k++) { const t = k / n, j = k === 0 || back ? 0 : (ctx.random() - 0.5) * 0.55; o.push([a[0] + (b[0] - a[0]) * t + nx * j, a[1] + (b[1] - a[1]) * t + nz * j]); }
  }
  return o;
}
function pip(o, x, z) {
  let c = false;
  for (let i = 0, j = o.length - 1; i < o.length; j = i++) { const [xi, zi] = o[i], [xj, zj] = o[j]; if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) c = !c; }
  return c;
}
// a dead tuft: thin blades, two-sided, straw and ash brown
export function tuft(ctx, x, y, z, n, h) {
  for (let i = 0; i < n; i++) {
    const a = ctx.random() * 6.283, r = ctx.random() * 0.08, bx = x + Math.cos(a) * r, bz = z + Math.sin(a) * r;
    const lean = 0.15 + ctx.random() * 0.4, hh = h * (0.45 + ctx.random() * 0.6), w = 0.012 + ctx.random() * 0.01, b = ctx.random() * 6.283;
    const tx = bx + Math.cos(a) * hh * lean, tz = bz + Math.sin(a) * hh * lean;
    ctx.color(ctx.random() < 0.5 ? "oklch(0.72 0.06 82)" : "oklch(0.6 0.05 68)");
    const px = Math.cos(b) * w, pz = Math.sin(b) * w;
    ctx.tri(bx - px, y, bz - pz, bx + px, y, bz + pz, tx, y + hh, tz);
  }
}
function ledge(ctx) {
  const R = () => ctx.random(), fine = ctx.lod <= 2, O = outline(ctx);
  ctx.flat(); ctx.albedo(ROCK); ctx.roughness(0.9); ctx.metalness(0);
  const Y = [-0.06, -0.55, -2.2, -6, -13, -24, -44], S = [1, 1.025, 0.98, 0.9, 0.74, 0.55, 0.35];
  const J = rough(ctx, 0.8, 0.28);
  const rings = Y.map((y, k) => O.map(([x, z]) => { const p = [C0[0] + (x - C0[0]) * S[k], y, C0[1] + (z - C0[1]) * S[k]]; return k < 2 ? p : J(p); }));
  for (let k = 0; k < rings.length - 1; k++) {
    ctx.color(k < 2 ? "oklch(0.8 0.012 250)" : "oklch(0.66 0.014 250)");
    const ref = [C0[0], (Y[k] + Y[k + 1]) / 2, C0[1]];
    for (let j = 0; j < O.length; j++) { const j1 = (j + 1) % O.length; quad(ctx, rings[k][j], rings[k][j1], rings[k + 1][j1], rings[k + 1][j], ref); }
  }
  // the ash bed the flags are laid in: what shows in every crack and hole
  ctx.albedo(ASH); ctx.color("oklch(0.8 0.01 60)"); ctx.roughness(1);
  const cen = [C0[0], -0.06, C0[1]];
  for (let j = 0; j < O.length; j++) face(ctx, cen, rings[0][j], rings[0][(j + 1) % O.length], [C0[0], -5, C0[1]]);
  // flagstones in running bond, wet, each its own tone and tilt; a few lifted out
  ctx.albedo(FLAG);
  const holes = [];
  let z = -19.9, row = 0;
  while (z < 3) {
    const d = 0.7 + R() * 0.45; let x = -13 - (row % 2 ? R() * 0.6 : 0);
    while (x < 13) {
      const w = 0.75 + R() * 0.8, cx = x + w / 2, cz = z + d / 2;
      const r1 = R(), r2 = R(), r3 = R(), r4 = R(), r5 = R(), i = 0.2;
      const inside = (sx, sz) => pip(O, cx - sx, cz - sz) && pip(O, cx + sx, cz - sz) && pip(O, cx - sx, cz + sz) && pip(O, cx + sx, cz + sz);
      let hx = w / 2, hz = d / 2;
      if (!inside(hx - i + 0.2, hz - i + 0.2)) { hx *= 0.55; hz *= 0.6; if (!(r1 < 0.6 && inside(hx + 0.08, hz + 0.08))) { x += w; continue; } }
      if (r1 < 0.055 && hx === w / 2) holes.push([cx, cz, w, d]);
      else {
        ctx.color(`oklch(${(0.8 + r2 * 0.16).toFixed(3)} ${(0.006 + r3 * 0.014).toFixed(3)} ${(220 + r4 * 60).toFixed(0)})`);
        ctx.roughness(0.3 + r5 * 0.35);
        bevelBox(ctx, xf([cx, -0.11 + (r2 - 0.5) * 0.03, cz], (r4 - 0.5) * 3, (r3 - 0.5) * 1.6, (r5 - 0.5) * 1.6), hx - 0.025, 0.11, hz - 0.025, fine ? 0.022 : 0);
      }
      x += w;
    }
    z += d; row++;
  }
  if (!fine) return;
  // dead moss in the holes and creeping over seams
  ctx.albedo(TEX.moss); ctx.smooth(); ctx.roughness(1);
  for (const [cx, cz, w, d] of holes) { ctx.color("oklch(0.7 0.07 120)"); puddle(ctx, cx, -0.06, cz, w * 0.42, d * 0.42, 0.06, false, 12); }
  for (let k = 0; k < 90; k++) {
    const x = -11 + R() * 22, zz = -19 + R() * 21; if (!pip(O, x, zz)) continue;
    ctx.color(R() < 0.5 ? "oklch(0.62 0.06 115)" : "oklch(0.55 0.05 95)");
    puddle(ctx, x, -0.006, zz, 0.1 + R() * 0.22, 0.07 + R() * 0.14, 0.014, false, 10);
  }
  ctx.flat(); ctx.albedo(null); ctx.roughness(1);
  for (const [cx, cz] of holes) tuft(ctx, cx, -0.06, cz, 11, 0.38);
  for (let j = 0; j < O.length; j += 2) { const [x, zz] = O[j]; if (zz > 4 || R() > 0.5) continue; const px = x + (C0[0] - x) * 0.04, pz = zz + (C0[1] - zz) * 0.04; tuft(ctx, px, -0.02, pz, 8, 0.3); }
}
function cliff(ctx) {
  const { w = 20, d = 16, h = 50 } = ctx.params, R = () => ctx.random(), n = 18, K = 8;
  ctx.flat(); ctx.albedo(ROCK); ctx.roughness(0.95); ctx.metalness(0);
  const col = Array.from({ length: n }, () => 0.72 + R() * 0.5), rings = [];
  for (let k = 0; k <= K; k++) {
    const t = k / K, y = t * h, s = 1 - 0.38 * t * t, ring = [];
    for (let j = 0; j < n; j++) {
      const a = (j / n) * Math.PI * 2, m = col[j] * (1 + (R() - 0.5) * 0.2) * s;
      ring.push([(Math.cos(a) * w * m) / 2, k === K ? y + (R() - 0.3) * h * 0.08 : y + (R() - 0.5) * 1.5, (-Math.sin(a) * d * m) / 2]);
    }
    rings.push(ring);
  }
  for (let k = 0; k < K; k++) {
    ctx.color(`oklch(${(0.6 + 0.12 * (k / K)).toFixed(3)} 0.014 250)`);
    const ref = [0, ((k + 0.5) / K) * h, 0];
    for (let j = 0; j < n; j++) { const j1 = (j + 1) % n; quad(ctx, rings[k][j], rings[k][j1], rings[k + 1][j1], rings[k + 1][j], ref); }
  }
  ctx.albedo(TEX.moss); ctx.color("oklch(0.55 0.05 120)");
  const top = [0, h * 1.04, 0];
  for (let j = 0; j < n; j++) face(ctx, top, rings[K][j], rings[K][(j + 1) % n], [0, h * 0.5, 0]);
}
export function ridgeY(p, x) {
  const { h = 90, gx = -16 } = p, s = (v) => Math.sin(v) * 0.5;
  const y = h * (0.62 + 0.3 * s(x * 0.011 + 1.3) + 0.14 * s(x * 0.047 + 0.4) * Math.sin(x * 0.019) + 0.06 * s(x * 0.13 + 2.2));
  return y * (1 - 0.32 * Math.exp(-(((x - gx) / 34) ** 2)));
}
function ridge(ctx) {
  const p = ctx.params, { len = 900, h = 90, gx = -16 } = p, R = () => ctx.random();
  ctx.flat(); ctx.albedo(null); ctx.roughness(1); ctx.metalness(0); ctx.color("oklch(0.36 0.016 258)");
  const nx = Math.ceil(len / 8), rows = [[30, 0], [0, 0.35], [-26, 1], [-60, 0.72], [-110, 0.25]];
  const P = [];
  for (let r = 0; r < rows.length; r++) {
    const line = [];
    for (let i = 0; i <= nx; i++) { const x = -len / 2 + (i * len) / nx; line.push([x + (r ? (R() - 0.5) * 3 : 0), ridgeY(p, x) * rows[r][1] + (r === 2 ? (R() - 0.5) * 3 : 0), rows[r][0] + (r ? (R() - 0.5) * 6 : 0)]); }
    P.push(line);
  }
  for (let r = 0; r < rows.length - 1; r++) for (let i = 0; i < nx; i++) quad(ctx, P[r][i], P[r][i + 1], P[r + 1][i + 1], P[r + 1][i], [P[r][i][0], -150, -20]);
  // the Dripping Gate in the saddle: two towers and a span, its doorway burning
  const gy = ridgeY(p, gx) * 0.55, gz = -12, g = 0.45;
  ctx.color("oklch(0.28 0.012 260)");
  for (const s of [-1, 1]) {
    bevelBox(ctx, xf([gx + s * 8 * g, gy + 12 * g, gz]), 3.2 * g, 14 * g, 3.2 * g, 0);
    for (const t of [-1, 1]) bevelBox(ctx, xf([gx + (s * 8 + t * 2.2) * g, gy + 27 * g, gz + 2.4 * g]), 0.7 * g, 1.2 * g, 0.7 * g, 0);
  }
  bevelBox(ctx, xf([gx, gy + 19.5 * g, gz]), 5 * g, 3 * g, 2.6 * g, 0);
  ctx.color("oklch(0.45 0.1 45)"); ctx.emissive(2.4, 0.75, 0.14);
  bevelBox(ctx, xf([gx, gy + 6 * g, gz + 1.6 * g]), 3.2 * g, 6 * g, 0.3, 0);
  ctx.emissive(1.6, 0.5, 0.1);
  for (const s of [-1, 1]) bevelBox(ctx, xf([gx + s * 8 * g, gy + 18 * g, gz + 3.25 * g]), 0.35 * g, 1.1 * g, 0.1, 0);
  ctx.emissive(null);
}
export function geometry(ctx) { ({ ledge, cliff, ridge })[ctx.params.kind ?? "ledge"](ctx); }
export function collider(ctx) {
  const k = ctx.params.kind ?? "ledge";
  if (k === "ledge") { bevelBox(ctx, xf([0, -0.5, -3]), 11, 0.5, 13, 0); bevelBox(ctx, xf([0, -0.5, -17.5]), 5, 0.5, 1.6, 0); return; }
  return null;
}
