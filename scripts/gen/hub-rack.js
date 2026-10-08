// A drying rack: two lashed A-frames, a pole and three dyed cloths draped over it, ragged hems
// rippling, a bundle of herbs. Origin = centre on the ground, pole along X.
import { xf, tube, quad, cbox, rnd, WOOD } from "./hub-kit.js";
const CLOTHS = [
  { x: -0.78, w: 0.62, a: 0.62, b: 0.95, col: "oklch(0.52 0.09 32)" },
  { x: 0.02, w: 0.72, a: 0.5, b: 0.7, col: "oklch(0.8 0.03 85)" },
  { x: 0.8, w: 0.56, a: 0.85, b: 0.6, col: "oklch(0.46 0.05 240)" },
];
export function geometry(ctx) {
  const fine = (ctx.lod ?? 1) <= 2, T = xf();
  ctx.flat(); ctx.roughness(0.95);
  ctx.albedo(WOOD); ctx.color("oklch(0.66 0.03 55)");
  for (const x of [-1.25, 1.25]) {
    tube(ctx, T, [[x, 0, -0.55], [x, 1.98, 0.08]], [0.045, 0.035], 5);
    tube(ctx, T, [[x, 0, 0.55], [x, 1.98, -0.08]], [0.045, 0.035], 5);
    ctx.color("oklch(0.55 0.04 70)"); tube(ctx, T, [[x, 1.78, 0], [x, 1.9, 0]], 0.06, 5); ctx.color("oklch(0.66 0.03 55)");
  }
  tube(ctx, T, [[-1.45, 1.84, 0], [0, 1.85, 0], [1.45, 1.83, 0]], 0.04, 6);
  // cloths
  ctx.albedo(null); ctx.roughness(1);
  const nu = fine ? 6 : 3, nv = fine ? 12 : 6;
  for (const c of CLOTHS) {
    ctx.color(c.col);
    const ph = rnd(ctx, 0, 6), hem = [];
    for (let i = 0; i <= nu; i++) hem.push(rnd(ctx, 0, 0.12));
    const prof = (t, i) => { // t 0..1 front hem → over the pole → back hem
      const s = t * 2 - 1, side = s < 0 ? -1 : 1, k = Math.abs(s), drop = (s < 0 ? c.a : c.b) * (1 + hem[i]);
      return [side * (0.04 + 0.1 * k), 1.89 - drop * k * k * 0.9 - 0.04 * k, k];
    };
    const P = (i, j) => {
      const u = i / nu, [z, y, k] = prof(j / nv, i);
      return [c.x - c.w / 2 + c.w * u + 0.03 * k * Math.sin(ph + u * 7), y, z + 0.05 * k * Math.sin(ph + u * 9 + j)];
    };
    for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) quad(ctx, T, P(i, j), P(i + 1, j), P(i + 1, j + 1), P(i, j + 1));
  }
  // herbs
  ctx.color("oklch(0.5 0.06 120)");
  for (let i = 0; i < (fine ? 7 : 3); i++) { const x = 1.12 + rnd(ctx, -0.05, 0.05), z = rnd(ctx, -0.05, 0.05); tube(ctx, T, [[1.15, 1.83, 0], [x, 1.55, z], [x + rnd(ctx, -0.04, 0.04), 1.3 + rnd(ctx, -0.05, 0.05), z]], [0.012, 0.03, 0.015], 4); }
  ctx.color("oklch(0.6 0.03 70)"); cbox(ctx, xf([1.15, 1.72, 0]), 0.06, 0.06, 0.06, 0.01);
}
export function collider(ctx) { cbox(ctx, xf(), 2.7, 1.9, 1.0, 0.01); }
