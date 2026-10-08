// The Hangman's gallows. kind "dais": a low round flagstone dais (top 0.24 m, a 0.12 m step ring) with
// an iron noose sigil let into its heart and wax candle clusters ringing the rim; origin at its centre.
// kind "frame": the long gallows standing at the dais's north edge, beam along X at 4.3 m, uprights at
// x ±5, back struts to +Z, four hooks (figure / cut / figure / empty noose), a cold lantern at x 0.
import { TEX, WAXC, xf, bevelBox, boxC, face, quad, candleBed, puddle, chain } from "./shapes.js";
import { tube as rtube, I, rock } from "./hub-kit.js";
import { rope, fray, noose } from "./orch-kit.js";
export const TOP = 0.24, STEP = 0.12, R1 = 7.0, R2 = 7.7, BY = 4.3, NOOSES = [-3.75, -1.25, 1.25, 3.75], LAMP = [0, 3.3, 0];
function sector(ctx, ri, ro, a0, a1, y0, y1, g) {
  const n = Math.max(2, Math.ceil(((a1 - a0) * ro) / 0.5));
  const ring = (ins, y) => {
    const out = [], rI = ri + g / 2 + ins, rO = ro - g / 2 - ins;
    for (let k = 0; k <= n; k++) { const a = a0 + g / (2 * rI) + ins / rI + ((a1 - a0 - (g + 2 * ins) / rI) * k) / n; out.push([Math.cos(a) * rI, y, Math.sin(a) * rI]); }
    for (let k = n; k >= 0; k--) { const a = a0 + g / (2 * rO) + ins / rO + ((a1 - a0 - (g + 2 * ins) / rO) * k) / n; out.push([Math.cos(a) * rO, y, Math.sin(a) * rO]); }
    return out;
  };
  const bot = ring(0, y0), mid = ring(0, y1 - 0.025), top = ring(0.025, y1), m = (a0 + a1) / 2, rc = (ri + ro) / 2;
  const c = [Math.cos(m) * rc, (y0 + y1) / 2, Math.sin(m) * rc], ct = [c[0], y1, c[2]], below = [c[0], y1 - 5, c[2]];
  for (let k = 0; k < top.length; k++) face(ctx, ct, top[k], top[(k + 1) % top.length], below);
  for (let k = 0; k < bot.length; k++) { const k1 = (k + 1) % bot.length; quad(ctx, bot[k], bot[k1], mid[k1], mid[k], c); quad(ctx, mid[k], mid[k1], top[k1], top[k], c); }
}
function disc(ctx, r, y0, y1, n, ins = 0) {
  const P = (rr, y) => Array.from({ length: n }, (_, k) => [Math.cos((k / n) * 6.283) * rr, y, Math.sin((k / n) * 6.283) * rr]);
  const bot = P(r, y0), mid = P(r, y1 - ins), top = P(r - ins, y1), c = [0, (y0 + y1) / 2, 0];
  for (let k = 0; k < n; k++) { const k1 = (k + 1) % n; face(ctx, [0, y1, 0], top[k], top[k1], [0, y1 - 5, 0]); quad(ctx, bot[k], bot[k1], mid[k1], mid[k], c); if (ins) quad(ctx, mid[k], mid[k1], top[k1], top[k], c); }
}
function dais(ctx) {
  const L = ctx.lod ?? 1, R = () => ctx.random();
  ctx.flat(); ctx.albedo(null); ctx.color("oklch(.2 .01 260)"); ctx.roughness(1); ctx.metalness(0);
  disc(ctx, R1 - 0.02, 0, TOP - 0.035, 32); disc(ctx, R2 - 0.02, 0, STEP - 0.03, 36);
  ctx.albedo(TEX.stone); ctx.roughness(0.82);
  if (L >= 4) { ctx.color("oklch(.85 .01 250)"); disc(ctx, R1, 0, TOP, 24, 0.02); disc(ctx, R2, 0, STEP, 24, 0.02); return; }
  const g = 0.05;
  ctx.color("oklch(.88 .012 250)"); disc(ctx, 1.4 - g / 2, TOP - 0.1, TOP + 0.004, 20, 0.025);
  for (const [ri, ro, n, y1] of [[1.4, 3.2, 10, TOP], [3.2, 5.1, 16, TOP], [5.1, R1, 22, TOP], [R1, R2, 26, STEP]]) {
    const off = R() * 6.283;
    for (let k = 0; k < n; k++) {
      const a0 = off + (k / n) * 6.283, a1 = off + ((k + 1) / n) * 6.283, j = (R() - 0.5) * 0.012 - (R() < 0.08 ? 0.02 : 0);
      ctx.color(["oklch(.86 .01 250)", "oklch(.8 .012 240)", "oklch(.9 .01 70)"][Math.floor(R() * 3)]);
      sector(ctx, ri, ro, a0, a1, y1 - 0.1, y1 + j, g);
    }
  }
  // the noose sigil let into the heart in iron, the rope line running north to the gallows
  ctx.albedo(TEX.iron); ctx.metalness(0.6); ctx.roughness(0.6); ctx.color("oklch(.72 .03 230)"); ctx.emissive(0.05, 0.09, 0.14);
  { const pts = []; for (let k = 0; k <= 28; k++) { const a = (k / 28) * 6.283; pts.push([Math.sin(a) * 0.85, TOP + 0.012, -Math.cos(a) * 0.85 + 0.1]); } rtube(ctx, I, pts, 0.035, 4, false, false); }
  rtube(ctx, I, [[0, TOP + 0.012, 0.95], [0, TOP + 0.012, 6.6]], 0.035, 4);
  for (const z of [1.2, 1.32, 1.44]) rtube(ctx, I, [[-0.12, TOP + 0.012, z], [0.12, TOP + 0.012, z]], 0.03, 4);
  ctx.emissive(null); ctx.metalness(0);
  // soot scorches and a wax spill
  ctx.albedo(null); ctx.roughness(1); ctx.color("oklch(.16 .01 40)");
  for (let i = 0; i < 6; i++) { const a = R() * 6.283, r = 2 + R() * 4; puddle(ctx, Math.cos(a) * r, TOP - 0.008, Math.sin(a) * r, 0.5 + R() * 0.6, 0.4 + R() * 0.5, 0.002); }
  ctx.albedo(TEX.wax); ctx.roughness(0.5); ctx.smooth(); ctx.color(WAXC[1]);
  puddle(ctx, 0.9, TOP - 0.006, -1.7, 0.7, 0.45, 0.025);
  // candle clusters ringing the rim (they sit on the top; no colliders)
  const nc = L <= 2 ? 12 : 6;
  for (let i = 0; i < nc; i++) { const a = (i / nc) * 6.283 + (R() - 0.5) * 0.25, r = 6.3 + R() * 0.35; candleBed(ctx, Math.cos(a) * r, TOP, Math.sin(a) * r, 0.34, 0.24, L <= 2 ? 7 : 3, { lit: 0.4, hMax: 0.24 }); }
  if (L <= 2) for (let i = 0; i < 10; i++) { const a = (i / 10) * 6.283 + 0.3, r = 7.35; candleBed(ctx, Math.cos(a) * r, STEP, Math.sin(a) * r, 0.18, 0.14, 3, { lit: 0.3, hMax: 0.12, puddle: false }); }
}
function frame(ctx) {
  const L = ctx.lod ?? 1, R = () => ctx.random();
  ctx.flat(); ctx.albedo(TEX.stone); ctx.color("oklch(.85 .01 250)"); ctx.roughness(0.9); ctx.metalness(0);
  for (const x of [-5, 5]) { bevelBox(ctx, xf([x, 0.25, 0], 7), 0.45, 0.26, 0.45, 0.05); bevelBox(ctx, xf([x, 0.12, 1.9], -5), 0.26, 0.13, 0.26, 0.04); if (L <= 3) for (let i = 0; i < 4; i++) rock(ctx, xf([x + (R() - 0.5) * 1.4, 0, (R() - 0.5) * 1.4]), 0.12 + R() * 0.1, { sy: 0.5 }); }
  ctx.albedo(TEX.wood); ctx.roughness(0.95); ctx.color("oklch(.72 .04 55)");
  for (const x of [-5, 5]) {
    bevelBox(ctx, xf([x, (0.5 + BY + 0.17) / 2, 0]), 0.16, (BY + 0.17 - 0.5) / 2, 0.16, 0.03);
    const s = Math.sign(x), A = [x, BY - 1.15, 0], Bp = [x - s * 1.15, BY - 0.15, 0], m = [(A[0] + Bp[0]) / 2, (A[1] + Bp[1]) / 2, 0];
    bevelBox(ctx, xf(m, 0, 0, Math.atan2(Bp[1] - A[1], Bp[0] - A[0]) * 57.3), Math.hypot(Bp[0] - A[0], Bp[1] - A[1]) / 2 + 0.06, 0.07, 0.07, 0.02);
    const C = [x, BY - 1.45, 0.12], D = [x, 0.24, 1.9], md = [x, (C[1] + D[1]) / 2, (C[2] + D[2]) / 2];
    bevelBox(ctx, xf(md, 0, Math.atan2(-(D[1] - C[1]), D[2] - C[2]) * 57.3), 0.08, 0.08, Math.hypot(D[1] - C[1], D[2] - C[2]) / 2 + 0.05, 0.02);
  }
  bevelBox(ctx, xf([0, BY, 0]), 5.6, 0.17, 0.15, 0.03);
  ctx.albedo(TEX.iron); ctx.metalness(0.55); ctx.roughness(0.75); ctx.color("oklch(.7 .04 45)");
  for (const x of [-5, 5]) { bevelBox(ctx, xf([x, BY, 0]), 0.2, 0.2, 0.18, 0); bevelBox(ctx, xf([x, 0.62, 0]), 0.18, 0.05, 0.18, 0); bevelBox(ctx, xf([x, 2.2, 0]), 0.18, 0.05, 0.18, 0); }
  for (const x of NOOSES) { bevelBox(ctx, xf([x, BY, 0]), 0.05, 0.19, 0.17, 0); rtube(ctx, I, [[x, BY - 0.17, 0], [x, BY - 0.24, 0], [x + 0.04, BY - 0.27, 0]], 0.015, 4); }
  const kinds = ["fig", "cut", "fig", "empty"];
  NOOSES.forEach((x, i) => {
    const top = [x, BY - 0.17, 0];
    if (kinds[i] === "fig") { rope(ctx, [top, [x, top[1] - 0.3, 0]], 0.024); ctx.albedo(TEX.wax); ctx.roughness(0.5); ctx.smooth(); ctx.color(WAXC[2]); puddle(ctx, x, 0, 0.05, 0.6, 0.5, 0.035); ctx.flat(); }
    else if (kinds[i] === "cut") { rope(ctx, [top, [x + 0.02, top[1] - 0.8, 0.01]], 0.023); fray(ctx, [x + 0.02, top[1] - 0.8, 0.01], 7, 0.13); }
    else noose(ctx, top, 1.15, 0.16);
  });
  // the cold lantern: chain from the beam, an iron cage, pale glass
  chain(ctx, [[0, BY - 0.17, 0], [0, LAMP[1] + 0.3, 0]], L);
  ctx.albedo(TEX.iron); ctx.metalness(0.6); ctx.roughness(0.6); ctx.color("oklch(.62 .01 250)"); ctx.flat();
  bevelBox(ctx, xf([0, LAMP[1] + 0.26, 0]), 0.15, 0.04, 0.15, 0.015);
  bevelBox(ctx, xf([0, LAMP[1] + 0.33, 0]), 0.08, 0.04, 0.08, 0.01);
  bevelBox(ctx, xf([0, LAMP[1] - 0.24, 0]), 0.14, 0.025, 0.14, 0.01);
  for (const sx of [-0.12, 0.12]) for (const sz of [-0.12, 0.12]) bevelBox(ctx, xf([sx, LAMP[1], sz]), 0.016, 0.24, 0.016, 0);
  ctx.albedo(null); ctx.metalness(0); ctx.roughness(0.25); ctx.color("oklch(.92 .03 230)"); ctx.emissive(1.3, 1.75, 2.4);
  bevelBox(ctx, xf([0, LAMP[1], 0]), 0.105, 0.21, 0.105, 0.02);
  ctx.emissive(null);
  // mourners' candles at the upright feet
  if (L <= 2) for (const x of [-5, 5]) candleBed(ctx, x - Math.sign(x) * 0.9, 0, -0.5, 0.3, 0.22, 6, { lit: 0.4, hMax: 0.2 });
}
export function geometry(ctx) { (ctx.params.kind === "frame" ? frame : dais)(ctx); }
export function collider(ctx) {
  if (ctx.params.kind === "frame") {
    for (const x of [-5, 5]) { boxC(ctx, x - 0.46, x + 0.46, 0, 0.52, -0.46, 0.46); boxC(ctx, x - 0.17, x + 0.17, 0.52, BY + 0.17, -0.17, 0.17); boxC(ctx, x - 0.27, x + 0.27, 0, 0.26, 1.63, 2.17); boxC(ctx, x - 0.09, x + 0.09, 0.26, 1.6, 1.0, 1.75); }
    return;
  }
  disc(ctx, R1, 0, TOP, 24); disc(ctx, R2, 0, STEP, 24);
}
