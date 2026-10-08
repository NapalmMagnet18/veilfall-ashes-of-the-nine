// A pilgrim handcart slumped on a snapped wheel: plank bed, side boards and stakes, two shafts,
// one sound wheel, the broken one lying flat beside it, cargo, two lantern poles with hanging
// lanterns. Origin = cart centre on the ground; shafts point −Z. The lantern glass centres (for the
// flames) are LANTERN_AT run through the same roll: see cartPoint().
import { xf, compose, cbox, box, tube, rock, lantern, rnd, WOOD, IRON } from "./hub-kit.js";
export const ROLL = 9, DROP = -0.12;
export const LANTERN_AT = [[-0.6, 1.455, 1.22], [0.6, 1.455, 1.22]];
function wheel(ctx, T, R, broken, fine) {
  ctx.albedo(WOOD); ctx.color("oklch(0.62 0.03 55)");
  const n = fine ? 18 : 10, span = broken ? 0.68 : 1, path = [];
  for (let i = 0; i <= n; i++) { const a = (i / n) * Math.PI * 2 * span + (broken ? 0.6 : 0); path.push([Math.cos(a) * R, 0, -Math.sin(a) * R]); }
  tube(ctx, T, path, 0.045, fine ? 6 : 4, broken, broken);
  tube(ctx, T, [[0, -0.09, 0], [0, 0.09, 0]], 0.085, 8);
  const sp = 8;
  for (let i = 0; i < sp; i++) {
    const a = (i / sp) * Math.PI * 2 + 0.2;
    const inArc = !broken || (a >= 0.6 && a <= 0.6 + Math.PI * 2 * span);
    const len = inArc ? R - 0.03 : (i % 2 ? R * 0.45 : 0);
    if (len > 0) tube(ctx, T, [[Math.cos(a) * 0.08, 0, -Math.sin(a) * 0.08], [Math.cos(a) * len, 0, -Math.sin(a) * len]], 0.018, 4);
  }
  ctx.albedo(IRON); ctx.color("oklch(0.5 0.01 250)"); ctx.metalness(0.5);
  tube(ctx, T, path.map((p) => [p[0] * 1.06, p[1], p[2] * 1.06]), 0.02, 4, broken, broken);
  ctx.metalness(0);
}
export function geometry(ctx) {
  const fine = (ctx.lod ?? 1) <= 2, C = xf([0, DROP, 0], [0, 0, ROLL]);
  ctx.flat(); ctx.roughness(0.95);
  ctx.albedo(WOOD); ctx.color("oklch(0.78 0.03 60)");
  for (let i = 0; i < 5; i++) cbox(ctx, compose(C, xf([-0.52 + i * 0.26, 0.6, rnd(ctx, -0.03, 0.03)])), 0.24, 0.05, i === 4 ? 1.6 : 2.0, 0.012);
  ctx.color("oklch(0.6 0.03 55)");
  for (const x of [-0.55, 0.55]) cbox(ctx, compose(C, xf([x, 0.5, 0])), 0.09, 0.1, 2.15, 0.02);
  ctx.color("oklch(0.74 0.03 60)");
  for (const x of [-0.64, 0.64]) {
    cbox(ctx, compose(C, xf([x, 0.7, 0])), 0.04, 0.16, 2.0, 0.01);
    cbox(ctx, compose(C, xf([x, 0.9, x < 0 ? -0.2 : 0], [0, 0, x < 0 ? -4 : 0])), 0.04, 0.15, x < 0 ? 1.5 : 2.0, 0.01);
    for (const z of [-0.92, -0.3, 0.3, 0.92]) cbox(ctx, compose(C, xf([x * 1.04, 0.58, z])), 0.055, 0.5, 0.055, 0.01);
  }
  cbox(ctx, compose(C, xf([0, 0.65, -1.0])), 1.3, 0.35, 0.04, 0.01);
  cbox(ctx, compose(C, xf([0.25, 0.65, 1.0], [0, 0, -6])), 0.75, 0.2, 0.04, 0.01);
  for (const x of [-0.45, 0.45]) tube(ctx, C, [[x, 0.55, -0.6], [x * 1.08, 0.35, -1.6], [x * 1.12, 0.14, -2.35]], [0.05, 0.045, 0.04], 5);
  cbox(ctx, compose(C, xf([0, 0.3, -1.85])), 1.05, 0.05, 0.06, 0.01);
  // axle, the sound wheel, the prop stone under the bare stub
  ctx.albedo(IRON); ctx.color("oklch(0.55 0.01 250)");
  tube(ctx, C, [[-0.82, 0.48, 0.2], [0.82, 0.48, 0.2]], 0.035, 6);
  wheel(ctx, compose(C, xf([0.78, 0.48, 0.2], [0, 0, 90])), 0.48, false, fine);
  ctx.albedo("cdn/texture-weathered-wet-dark-granite.png"); ctx.color("oklch(0.72 0.01 250)");
  rock(ctx, xf([-0.88, 0, 0.2], [30, 0, 0]), 0.24, { sy: 0.85, sub: fine });
  wheel(ctx, xf([-1.75, 0.13, 0.95], [25, 4, 3]), 0.48, true, fine);
  // cargo
  ctx.albedo("cdn/texture-coarse-burlap-sack.png"); ctx.color("oklch(0.88 0.03 80)");
  rock(ctx, compose(C, xf([0.25, 0.63, 0.45], [0, 0, 70])), 0.3, { sub: fine, sx: 1.4, sy: 0.75, sz: 0.85, rough: 0.15, sink: 0.05 });
  rock(ctx, compose(C, xf([0.05, 0.63, 0.75], [40, 0, 0])), 0.25, { sub: fine, sx: 0.9, sy: 1.1, sz: 0.85, rough: 0.15, sink: 0.05 });
  ctx.albedo(WOOD); ctx.color("oklch(0.66 0.04 50)");
  const CH = compose(C, xf([-0.25, 0.63, -0.4], [12, 0, 0]));
  cbox(ctx, CH, 0.55, 0.32, 0.42, 0.03);
  ctx.albedo(IRON); ctx.color("oklch(0.5 0.01 250)");
  for (const x of [-0.18, 0.18]) cbox(ctx, compose(CH, xf([x, -0.005, 0])), 0.04, 0.335, 0.43, 0.005);
  // lantern poles and lanterns
  ctx.albedo(WOOD); ctx.color("oklch(0.62 0.03 55)");
  for (const [x] of LANTERN_AT) tube(ctx, C, [[x, 0.6, 0.98], [x, 1.78, 0.98], [x, 1.8, 1.26]], [0.035, 0.03, 0.025], 5);
  for (const [x, y, z] of LANTERN_AT) lantern(ctx, compose(C, xf([x, y + 0.265, z])));
}
export function collider(ctx) { box(ctx, xf([0, 0, -0.2]), 1.6, 1.1, 2.6); }
