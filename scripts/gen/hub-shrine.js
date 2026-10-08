// THE WAYSTONE: a small safe altar. Two stone steps, an arched carved slab with a recessed niche and
// a faintly warm lantern sigil, cracks, moss at the foot, candles on the steps and on the ground in
// pools of old wax. Origin = centre of the base; the face is −Z. params.candles = [[x, y, z, h]].
import { xf, compose, cbox, box, extrudeXY, loft, ringH, rock, candle, rnd, STONE } from "./hub-kit.js";
export const CANDLES = [[-0.62, 0.22, -0.38, 0.26], [-0.5, 0.22, -0.46, 0.17], [0.55, 0.22, -0.4, 0.32], [0.67, 0.22, -0.32, 0.15], [-0.4, 0.42, -0.2, 0.22], [0.42, 0.42, -0.22, 0.36], [-0.28, 0, -0.78, 0.12], [0.24, 0, -0.82, 0.2]];
export function geometry(ctx) {
  const fine = (ctx.lod ?? 1) <= 2, T = xf(), C = (ctx.params && ctx.params.candles) || CANDLES;
  ctx.flat(); ctx.roughness(0.9);
  ctx.albedo(STONE); ctx.color("oklch(0.8 0.01 250)");
  cbox(ctx, T, 1.6, 0.22, 1.1, 0.04);
  cbox(ctx, xf([0, 0.22, 0.08]), 1.25, 0.2, 0.76, 0.035);
  const arch = [[-0.4, 0], [0.4, 0], [0.4, 1.08], [0.32, 1.32], [0.17, 1.48], [0, 1.55], [-0.17, 1.48], [-0.32, 1.32], [-0.4, 1.08]];
  const S = xf([0, 0.42, 0.1]);
  ctx.color("oklch(0.86 0.01 250)");
  extrudeXY(ctx, S, arch, -0.11, 0.11);
  // recessed niche panel and the sigil
  ctx.color("oklch(0.55 0.01 250)");
  extrudeXY(ctx, S, arch.map(([x, y]) => [x * 0.68, 0.18 + y * 0.72]), -0.116, -0.1);
  ctx.color("oklch(0.75 0.06 75)"); ctx.emissive(0.9, 0.55, 0.2);
  const G = xf([0, 0.42 + 0.95, 0.1 - 0.122]);
  for (let i = 0; i < (fine ? 10 : 6); i++) { const a = (i / (fine ? 10 : 6)) * Math.PI * 2; box(ctx, compose(G, xf([Math.cos(a) * 0.17, Math.sin(a) * 0.17 - 0.02, 0], [0, 0, (a * 180) / Math.PI])), 0.07, 0.03, 0.01); }
  box(ctx, compose(G, xf([0, -0.45, 0])), 0.035, 0.42, 0.01);
  box(ctx, compose(G, xf([0, -0.06, 0])), 0.08, 0.1, 0.01);
  ctx.emissive(null);
  // cracks
  ctx.color("oklch(0.3 0.01 250)");
  if (fine) {
    box(ctx, xf([0.3, 0.9, -0.012], [0, 0, 18]), 0.012, 0.32, 0.01);
    box(ctx, xf([0.25, 1.18, -0.012], [0, 0, -25]), 0.01, 0.22, 0.01);
    box(ctx, xf([-0.55, 0.05, -0.552], [0, 0, 40]), 0.01, 0.2, 0.01);
  }
  // moss at the foot and on the shoulders
  ctx.albedo("cdn/texture-damp-dark-moss.png"); ctx.color("oklch(0.75 0.06 135)");
  for (let i = 0; i < (fine ? 7 : 3); i++) { const a = rnd(ctx, 0, 6.28); rock(ctx, xf([Math.cos(a) * 0.82, 0, Math.sin(a) * 0.56 + 0.1]), rnd(ctx, 0.12, 0.2), { sy: 0.35, sx: 1.6, rough: 0.5 }); }
  rock(ctx, xf([-0.3, 1.86, 0.1]), 0.1, { sy: 0.3, sx: 1.5 });
  // wax: pools on the steps and the ground, drips over the step edges, then the candles
  ctx.albedo(null); ctx.roughness(0.5);
  ctx.color("oklch(0.86 0.04 85)");
  for (const [x, y, z, h] of C) loft(ctx, T, [ringH(x, y + 0.002, z, 0.1 + h * 0.4, 0.09 + h * 0.3, 9, 0.5, ctx), ringH(x, y + 0.012, z, 0.07 + h * 0.3, 0.06 + h * 0.2, 9, 0.4, ctx)], false, true);
  loft(ctx, T, [ringH(0, 0.003, -0.8, 0.55, 0.22, 12, 0.35, ctx), ringH(0, 0.012, -0.8, 0.45, 0.16, 12, 0.3, ctx)], false, true);
  ctx.color("oklch(0.82 0.08 82)");
  for (const x of [-0.58, -0.5, 0.56, 0.62]) { const l = rnd(ctx, 0.08, 0.2); box(ctx, xf([x, 0.22 - l, -0.555]), 0.025, l + 0.004, 0.012); }
  for (const x of [-0.42, 0.45]) { const l = rnd(ctx, 0.06, 0.16); box(ctx, xf([x, 0.42 - l, -0.305]), 0.022, l + 0.004, 0.012); }
  for (const c of C) candle(ctx, T, c, fine);
}
export function collider(ctx) { box(ctx, xf([0, 0, 0]), 1.6, 1.95, 1.1); }
