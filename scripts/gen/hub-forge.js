// The Wayside forge: a squat fieldstone hearth with a coal bed and a leaning hood, an anvil on an oak stump,
// a quench tub, hammer and tongs. Origin = centre on the ground; the hearth sits at -X, the anvil at +X, working face -Z.
import { boxC } from "./shapes.js";
import { xf, cbox, tube, loft, ringH, rock, extrudeXY, rnd, IRON, STONE, WOOD } from "./hub-kit.js";
export const COALS = [-0.75, 0.86, 0]; // where the glow lives (for the scene's fx)
export function geometry(ctx) {
  const fine = (ctx.lod ?? 1) <= 2;
  // hearth: stacked fieldstones around a box core
  ctx.flat(); ctx.albedo(STONE); ctx.roughness(0.92); ctx.metalness(0);
  ctx.color("oklch(0.5 0.012 60)"); cbox(ctx, xf([-0.75, 0, 0]), 1.25, 0.78, 1.0, 0.05);
  ctx.color("oklch(0.44 0.012 60)");
  for (let i = 0; i < (fine ? 22 : 10); i++) {
    const side = i % 4, t = rnd(ctx, -0.5, 0.5), y = rnd(ctx, 0.05, 0.7);
    const p = side === 0 ? [-0.75 + t * 1.2, y, -0.52] : side === 1 ? [-0.75 + t * 1.2, y, 0.52] : side === 2 ? [-1.39, y, t * 0.95] : [-0.11, y, t * 0.95];
    rock(ctx, xf(p, [0, rnd(ctx, 0, 360), 0]), rnd(ctx, 0.1, 0.16), { sy: 0.6, rough: 0.4 });
  }
  // coal bed (dark, the fx lights it)
  ctx.color("oklch(0.18 0.01 40)"); ctx.roughness(1);
  for (let i = 0; i < (fine ? 14 : 6); i++) rock(ctx, xf([-0.75 + rnd(ctx, -0.4, 0.4), 0.76, rnd(ctx, -0.3, 0.3)]), rnd(ctx, 0.05, 0.09), { sy: 0.5 });
  // hood: four iron posts + a tapering sheet chimney
  ctx.albedo(IRON); ctx.metalness(0.55); ctx.roughness(0.65); ctx.color("oklch(0.42 0.02 45)");
  for (const [x, z] of [[-1.3, -0.42], [-0.2, -0.42], [-1.3, 0.42], [-0.2, 0.42]]) tube(ctx, xf(), [[x, 0.78, z], [x, 1.55, z * 0.9]], 0.025, 5);
  loft(ctx, xf([-0.75, 0, 0]), [
    [[0.6, 1.55, 0.45], [0.6, 1.55, -0.45], [-0.6, 1.55, -0.45], [-0.6, 1.55, 0.45]],
    [[0.2, 2.05, 0.18], [0.2, 2.05, -0.18], [-0.2, 2.05, -0.18], [-0.2, 2.05, 0.18]],
    [[0.17, 2.7, 0.15], [0.17, 2.7, -0.15], [-0.17, 2.7, -0.15], [-0.17, 2.7, 0.15]],
  ], false, false);
  // bellows leaning on the hearth's back
  ctx.albedo(null); ctx.metalness(0); ctx.color("oklch(0.32 0.04 40)"); ctx.roughness(0.9);
  extrudeXY(ctx, xf([-1.55, 0.25, 0.1], [0, 90, -55]), [[0, -0.18], [0.55, -0.1], [0.55, 0.1], [0, 0.18]], -0.09, 0.09);
  // anvil stump
  ctx.albedo(WOOD); ctx.color("oklch(0.5 0.04 55)"); ctx.roughness(0.95);
  loft(ctx, xf([0.75, 0, 0]), [ringH(0, 0, 0, 0.32, 0.32, 10, 0.12, ctx), ringH(0, 0.12, 0, 0.27, 0.27, 10, 0.06, ctx), ringH(0, 0.55, 0, 0.26, 0.26, 10, 0.05, ctx)]);
  // anvil: waist, body, horn, heel
  ctx.albedo(IRON); ctx.metalness(0.7); ctx.roughness(0.45); ctx.color("oklch(0.36 0.01 250)");
  cbox(ctx, xf([0.75, 0.55, 0]), 0.3, 0.08, 0.24, 0.02);
  cbox(ctx, xf([0.75, 0.63, 0]), 0.16, 0.14, 0.14, 0.02);
  cbox(ctx, xf([0.75, 0.77, 0]), 0.46, 0.12, 0.17, 0.02);
  tube(ctx, xf(), [[0.98, 0.83, 0], [1.12, 0.84, 0], [1.24, 0.86, 0]], [0.06, 0.04, 0.008], 6);
  ctx.color("oklch(0.6 0.01 250)"); ctx.roughness(0.25); cbox(ctx, xf([0.72, 0.885, 0]), 0.4, 0.01, 0.15, 0.003); // worked face, polished by blows
  // hammer resting on the face, tongs leaning on the stump
  ctx.color("oklch(0.3 0.01 250)"); ctx.roughness(0.5);
  cbox(ctx, xf([0.62, 0.9, -0.03], [0, 30, 0]), 0.07, 0.06, 0.13, 0.01);
  ctx.albedo(WOOD); ctx.color("oklch(0.55 0.05 60)"); tube(ctx, xf(), [[0.62, 0.93, -0.03], [0.48, 0.92, 0.22]], 0.014, 5);
  ctx.albedo(IRON); ctx.color("oklch(0.3 0.015 40)");
  tube(ctx, xf(), [[1.02, 0.02, 0.18], [1.0, 0.55, 0.12], [0.93, 0.66, 0.08]], 0.011, 4);
  tube(ctx, xf(), [[1.06, 0.02, 0.2], [1.03, 0.55, 0.14], [0.96, 0.68, 0.12]], 0.011, 4);
  // quench tub: staved barrel half with black water
  ctx.albedo(WOOD); ctx.color("oklch(0.46 0.04 50)"); ctx.metalness(0); ctx.roughness(0.9);
  loft(ctx, xf([0.85, 0, 0.75]), [ringH(0, 0, 0, 0.26, 0.26, 12), ringH(0, 0.42, 0, 0.3, 0.3, 12)], true, false);
  ctx.albedo(IRON); ctx.color("oklch(0.35 0.02 45)"); ctx.metalness(0.5);
  for (const y of [0.08, 0.34]) tube(ctx, xf([0.85, 0, 0.75]), ringH(0, y, 0, 0.27 + y * 0.09, 0.27 + y * 0.09, 12).concat([[0.27 + y * 0.09, y, 0]]), 0.012, 4, false, false);
  ctx.albedo(null); ctx.color("oklch(0.12 0.015 230)"); ctx.metalness(0); ctx.roughness(0.05);
  loft(ctx, xf([0.85, 0, 0.75]), [ringH(0, 0.36, 0, 0.285, 0.285, 12)], false, true);
}
export function collider(ctx) { boxC(ctx, -1.4, -0.1, 0, 1.2, -0.52, 0.52); boxC(ctx, 0.45, 1.15, 0, 0.9, -0.3, 1.05); }
