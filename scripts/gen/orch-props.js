// Gallows Orchard props. params.kind:
//  "path"  { pts: [[x,z]...] local, half }: packed ash dirt worn into a shallow trough, cart ruts, footprint scuffs
//  "stone" : the Abbey boundary stone, a noose sigil cut into its face (front −Z)
//  "coils" : a heap of rope coils dropped off a cart
//  "crow"  : one perched crow, feet at origin, facing −Z
import { TEX, xf, bevelBox, boxC, quad as fq, puddle, candleBed, lathe } from "./shapes.js";
import { tube as rtube, I, rock } from "./hub-kit.js";
import { ASH, ropeTex, fray, crow } from "./orch-kit.js";
function path(ctx) {
  const pts = ctx.params.pts ?? [[0, 0], [10, 0]], half = ctx.params.half ?? 4.2, L = ctx.lod ?? 1;
  // resample the polyline every 0.8 m
  const S = [];
  for (let i = 0; i < pts.length - 1; i++) { const [ax, az] = pts[i], [bx, bz] = pts[i + 1], n = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / (L <= 2 ? 0.8 : 2.4))); for (let k = 0; k < n; k++) S.push([ax + ((bx - ax) * k) / n, az + ((bz - az) * k) / n]); }
  S.push(pts[pts.length - 1]);
  // profile across: u in half-widths, y height (edge beds into the ground, centre worn low, two ruts)
  const P = [[-1.0, -0.02], [-0.86, 0.03], [-0.55, 0.04], [-0.36, 0.022], [-0.3, 0.008], [-0.24, 0.022], [-0.1, 0.014], [0, 0.01], [0.1, 0.014], [0.24, 0.022], [0.3, 0.008], [0.36, 0.022], [0.55, 0.04], [0.86, 0.03], [1.0, -0.02]];
  const shade = ["oklch(.62 .01 60)", "oklch(.7 .012 60)", "oklch(.74 .012 65)", "oklch(.6 .01 60)", "oklch(.5 .01 50)", "oklch(.6 .01 60)", "oklch(.58 .012 55)", "oklch(.55 .012 55)"];
  ctx.albedo(ASH); ctx.roughness(0.95); ctx.metalness(0); ctx.flat();
  const rows = S.map(([x, z], i) => {
    const a = S[Math.max(0, i - 1)], b = S[Math.min(S.length - 1, i + 1)], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1, nx = -dz / l, nz = dx / l;
    const w = half * (1 + 0.1 * Math.sin(i * 0.9) + 0.06 * Math.sin(i * 2.3 + 1)), wo = 0.25 * Math.sin(i * 0.5);
    return P.map(([u, y]) => { const uu = u * w + (Math.abs(u) > 0.8 ? wo * Math.sign(u) : 0); return [x + nx * uu, y, z + nz * uu]; });
  });
  for (let j = 0; j < P.length - 1; j++) {
    ctx.color(shade[Math.min(j, P.length - 2 - j)]);
    for (let i = 0; i < rows.length - 1; i++) { const a = rows[i][j], b = rows[i + 1][j], c = rows[i + 1][j + 1], d = rows[i][j + 1]; const m = [(a[0] + c[0]) / 2, -5, (a[2] + c[2]) / 2]; fq(ctx, a, b, c, d, m); }
  }
  if (L > 2) return;
  // soot scuffs, puddles of wet ash, a few half-buried stones at the verges
  ctx.albedo(null); ctx.color("oklch(.18 .01 250)"); ctx.roughness(0.15);
  for (let i = 0; i < 7; i++) { const s = S[Math.floor(ctx.random() * S.length)]; puddle(ctx, s[0] + (ctx.random() - 0.5) * 2, 0.012, s[1] + (ctx.random() - 0.5) * 2, 0.4 + ctx.random() * 0.6, 0.3 + ctx.random() * 0.4, 0.002); }
  ctx.albedo(TEX.stone); ctx.color("oklch(.82 .01 250)"); ctx.roughness(0.9);
  for (let i = 0; i < 26; i++) { const k = Math.floor(ctx.random() * rows.length), side = ctx.random() < 0.5 ? 0 : P.length - 1, p = rows[k][side]; rock(ctx, xf([p[0], -0.05, p[2]], ctx.random() * 90), 0.1 + ctx.random() * 0.22, { sy: 0.5, rough: 0.5 }); }
}
function stone(ctx) {
  ctx.flat(); ctx.albedo(TEX.stone); ctx.color("oklch(.86 .012 250)"); ctx.roughness(0.88); ctx.metalness(0);
  bevelBox(ctx, xf([0, 0.12, 0], 4), 0.55, 0.13, 0.4, 0.04);
  bevelBox(ctx, xf([0, 0.85, 0], 0, -3, 2), 0.36, 0.62, 0.17, 0.05);

  bevelBox(ctx, xf([0, 1.53, 0], 0, -3, 2), 0.3, 0.07, 0.15, 0.04);
  ctx.albedo(TEX.moss); ctx.color("oklch(.75 .05 135)");
  for (let i = 0; i < 4; i++) rock(ctx, xf([(ctx.random() - 0.5) * 0.9, 0.18, (ctx.random() - 0.5) * 0.6]), 0.08 + ctx.random() * 0.06, { sy: 0.4 });
  // the sigil: a noose cut into the face (dark grooves with a cold film of old lead)
  const z = -0.19, T = xf([0, 0, 0], 0, -3, 2);
  ctx.albedo(null); ctx.color("oklch(.42 .02 240)"); ctx.metalness(0.4); ctx.roughness(0.5); ctx.emissive(0.03, 0.05, 0.08);
  rtube(ctx, T, [[0, 1.36, z], [0, 1.02, z]], 0.02, 4);
  for (const y of [1.0, 0.96, 0.92]) rtube(ctx, T, [[-0.06, y, z], [0.06, y, z]], 0.017, 4);
  { const pts = []; for (let k = 0; k <= 20; k++) { const a = (k / 20) * 6.283; pts.push([Math.sin(a) * 0.16, 0.72 + Math.cos(a) * 0.19, z]); } rtube(ctx, T, pts, 0.02, 4, false, false); }
  rtube(ctx, T, [[-0.22, 1.36, z], [0.22, 1.36, z]], 0.02, 4);
  rtube(ctx, T, [[-0.24, 0.36, z], [0.24, 0.36, z]], 0.015, 4);
  ctx.emissive(null); ctx.metalness(0);
  candleBed(ctx, 0.1, 0.25, -0.52, 0.32, 0.12, 5, { lit: 0.35, hMax: 0.12 });
}
function coils(ctx) {
  const n = ctx.params.n ?? 4;
  ropeTex(ctx);
  for (let c = 0; c < n; c++) {
    const cx = (ctx.random() - 0.5) * 1.1, cz = (ctx.random() - 0.5) * 0.8, R = 0.22 + ctx.random() * 0.12, tilt = c === n - 1 ? 60 : (ctx.random() - 0.5) * 20, T = xf([cx, c === n - 1 ? 0.3 : 0.03, cz], ctx.random() * 180, tilt), pts = [];
    for (let k = 0; k <= 60; k++) { const a = (k / 12) * 6.283, r = R - k * 0.0012; pts.push([Math.cos(a) * r, (k / 60) * 0.18, Math.sin(a) * r]); }
    rtube(ctx, T, pts, 0.026, 5);
    const e = pts[pts.length - 1], tail = [e, [e[0] + 0.25, 0.04, e[2] + 0.3], [e[0] + 0.55, 0.0, e[2] + 0.35]];
    rtube(ctx, T, tail, 0.026, 5); fray(ctx, T(tail[2]), 5, 0.08);
  }
}
export function geometry(ctx) {
  const k = ctx.params.kind;
  if (k === "path") return path(ctx);
  if (k === "stone") return stone(ctx);
  if (k === "coils") return coils(ctx);
  if (k === "crow") return crow(ctx, I, ctx.lod ?? 1);
}
export function collider(ctx) {
  if (ctx.params.kind === "stone") { boxC(ctx, -0.55, 0.55, 0, 0.25, -0.4, 0.4); boxC(ctx, -0.38, 0.38, 0.25, 1.6, -0.19, 0.19); return; }
  return null;
}
