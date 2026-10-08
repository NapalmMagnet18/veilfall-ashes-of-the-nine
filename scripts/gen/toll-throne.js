// The Bailiff's toll-throne: a three-step dais, a high-backed stone seat drowned in wax, an iron toll chest,
// and a wooden lectern holding the open ledger, chained down. Faces local -Z (yaw it toward the arena).
import { TEX, WAXC, xf, bevelBox, boxC, rough, candleBed, curtain, waxCap, mossSkin, chain, quad, face } from "./shapes.js";
export function geometry(ctx) {
  const L = ctx.lod, R = () => ctx.random();
  const J = L <= 2 ? rough(ctx, 0.03, 1.2) : null, bev = L <= 2 ? 0.05 : 0;
  const stone = (dl = 0) => { ctx.flat(); ctx.albedo(TEX.stone); ctx.roughness(0.8); ctx.metalness(0); ctx.color(`oklch(${(0.8 + dl + R() * 0.1).toFixed(3)} .012 250)`); };
  const blk = (cx, cy, cz, hx, hy, hz, yaw = 0, roll = 0, pitch = 0) => bevelBox(ctx, xf([cx, cy, cz], yaw, pitch, roll), hx - 0.012, hy - 0.012, hz - 0.012, bev, J);
  // dais
  stone(); blk(0, -0.1, 0.15, 3.2, 0.45, 2.0);
  stone(); blk(0, 0.525, 0.45, 2.6, 0.175, 1.7);
  stone(); blk(0, 0.875, 0.75, 2.0, 0.175, 1.35);
  // throne
  stone(0.03); blk(0, 1.33, 0.75, 0.82, 0.28, 0.6);
  stone(); blk(0, 3.0, 1.62, 0.95, 1.95, 0.24);
  for (const s of [-1, 1]) { stone(0.02); blk(s * 1.02, 2.6, 1.55, 0.2, 1.55, 0.32); stone(); blk(s * 0.97, 1.8, 0.75, 0.16, 0.2, 0.6); blk(s * 0.97, 1.33, 0.25, 0.16, 0.28, 0.12); }
  // gabled crown on the backrest
  stone(0.04);
  { const y0 = 4.95, y1 = 5.75, z0 = 1.38, z1 = 1.86, w = 1.05; const ref = [0, 5.2, 1.62];
    const A = [-w, y0, z0], B = [w, y0, z0], C = [0, y1, z0], A2 = [-w, y0, z1], B2 = [w, y0, z1], C2 = [0, y1, z1];
    face(ctx, A, B, C, ref); face(ctx, A2, B2, C2, ref); quad(ctx, A, C, C2, A2, ref); quad(ctx, B, C, C2, B2, ref); quad(ctx, A, B, B2, A2, ref); }
  // toll chest
  ctx.albedo(TEX.iron); ctx.metalness(0.5); ctx.roughness(0.7); ctx.color("oklch(.8 .03 50)");
  bevelBox(ctx, xf([-1.45, 1.27, 0.2], 12), 0.35, 0.22, 0.25, 0.03);
  ctx.color("oklch(.6 .02 50)"); bevelBox(ctx, xf([-1.45, 1.5, 0.2], 12), 0.37, 0.03, 0.27, 0);
  // lectern + ledger, on the second step to the right
  const lx = 2.0, lz = -0.55, ly = 0.7;
  ctx.albedo(TEX.wood); ctx.metalness(0); ctx.roughness(0.9); ctx.color("oklch(.82 .05 60)");
  bevelBox(ctx, xf([lx, ly + 0.05, lz], 15), 0.32, 0.05, 0.32, 0.02);
  bevelBox(ctx, xf([lx, ly + 0.55, lz], 15), 0.07, 0.5, 0.07, 0.02);
  const top = xf([lx, ly + 1.12, lz], 15, -28);
  bevelBox(ctx, top, 0.38, 0.03, 0.27, 0.015);
  bevelBox(ctx, xf([lx, ly + 0.98, lz - 0.24], 15, -28), 0.38, 0.03, 0.02, 0);
  // ledger: dark cover, two pale page blocks
  ctx.albedo(null); ctx.color("oklch(.3 .07 25)"); ctx.roughness(0.8);
  bevelBox(ctx, xf([0, 0.04, 0]).call ? (p) => top([p[0], p[1] + 0.04, p[2]]) : top, 0.34, 0.012, 0.23, 0);
  ctx.color("oklch(.86 .035 85)");
  for (const s of [-1, 1]) bevelBox(ctx, (p) => top([p[0] + s * 0.165, p[1] + 0.07 + p[0] * s * 0.0 , p[2]]), 0.15, 0.022, 0.21, 0.008);
  ctx.color("oklch(.5 .15 25)"); bevelBox(ctx, (p) => top([p[0] + 0.05, p[1] + 0.06, p[2] + 0.24 + p[2]]), 0.012, 0.004, 0.08, 0);
  if (L <= 2) chain(ctx, [top([-0.36, 0.06, 0.1]), [lx - 0.3, ly + 0.7, lz + 0.05], [lx - 0.08, ly + 0.4, lz]], L, 0.8);
  // wax
  if (L <= 3) {
    waxCap(ctx, -1.0, 1.0, 1.38, 1.86, 4.95, 0.06);
    curtain(ctx, [-0.95, 0, 1.38], [1, 0, 0], [0, 0, -1], 1.9, 4.95, { min: 0.4, max: 2.6, lod: L });
    for (const s of [-1, 1]) curtain(ctx, [s * 0.81, 0, 0.15], [0, 0, 1], [s, 0, 0], 1.2, 2.0, { min: 0.1, max: 0.6, lod: L, tail: 0.4 });
    curtain(ctx, [-2.0, 0, -0.6], [1, 0, 0], [0, 0, -1], 4.0, 1.05, { min: 0.05, max: 0.32, lod: L, tail: 0.25, lip: 0.2 });
    curtain(ctx, [-2.6, 0, -1.25], [1, 0, 0], [0, 0, -1], 5.2, 0.7, { min: 0.05, max: 0.3, lod: L, tail: 0.2, lip: 0.2 });
  }
  if (L <= 2) {
    mossSkin(ctx, [-3.2, 0, -1.85], [1, 0, 0], [0, 0, -1], 6.4, -0.1, 0.3);
    const k = L === 1 ? 1 : 0.5, nb = (n) => Math.max(2, Math.round(n * k));
    candleBed(ctx, -1.6, 1.05, -0.3, 0.32, 0.28, nb(12), { lit: 0 });
    candleBed(ctx, 1.4, 1.05, -0.3, 0.45, 0.25, nb(10), { lit: 0.3 });
    candleBed(ctx, 0, 0.7, -1.0, 2.3, 0.18, nb(26), { lit: 0.2 });
    candleBed(ctx, 0, 0.35, -1.6, 2.9, 0.16, nb(26), { lit: 0.15 });
    candleBed(ctx, 0, 5.0, 1.62, 0.6, 0.15, nb(8), { lit: 0.4, hMax: 0.15 });
    for (const s of [-1, 1]) candleBed(ctx, s * 0.97, 2.0, 0.75, 0.1, 0.45, nb(5), { lit: 0.4, hMax: 0.15 });
  }
}
export function collider(ctx) { boxC(ctx, -3.2, 3.2, -0.55, 1.05, -1.85, 2.15); boxC(ctx, -1.25, 1.25, 1.05, 5.75, 1.0, 1.9); }
