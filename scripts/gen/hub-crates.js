// Camp stores: battened crates stacked three, a hooped barrel, slumped burlap sacks.
// Origin = centre of the pile on the ground.
import { xf, compose, cbox, box, tube, loft, ringH, rock, WOOD, IRON } from "./hub-kit.js";
function crate(ctx, T, s, fine) {
  ctx.albedo(WOOD); ctx.color("oklch(0.62 0.03 55)");
  cbox(ctx, compose(T, xf([0, 0.01, 0])), s * 0.94, s * 0.96, s * 0.94, 0.01);
  ctx.color("oklch(0.76 0.03 62)");
  const h = s / 2 - 0.035, b = 0.07;
  for (const x of [-h, h]) for (const z of [-h, h]) box(ctx, compose(T, xf([x, 0, z])), b, s, b);
  for (const y of [0, s - b]) {
    for (const z of [-h, h]) box(ctx, compose(T, xf([0, y, z])), s - 0.02, b, b);
    for (const x of [-h, h]) box(ctx, compose(T, xf([x, y, 0])), b, b, s - 0.02);
  }
  if (fine) {
    for (const z of [-s / 2, s / 2]) box(ctx, compose(T, xf([0, s / 2 - 0.02, z], [0, 0, 45], [s * 1.25, 0.06, 0.03].map((v, i) => [1 / s, 1, 1][i] * v))), s, 0.06 / 0.06 * 0.06, 0.03);
    for (const x of [-s / 2, s / 2]) box(ctx, compose(T, xf([x, s / 2 - 0.02, 0], [90, 0, 45])), s * 1.25, 0.06, 0.03);
  }
}
export function geometry(ctx) {
  const fine = (ctx.lod ?? 1) <= 2, T = xf();
  ctx.flat(); ctx.roughness(0.95);
  crate(ctx, xf([-0.45, 0, 0], [4, 0, 0]), 0.82, fine);
  crate(ctx, xf([0.45, 0, 0.08], [-9, 0, 0]), 0.76, fine);
  crate(ctx, xf([-0.12, 0.81, 0.04], [22, 0, 0]), 0.68, fine);
  // barrel
  ctx.albedo("cdn/texture-old-oak-barrel-staves.png"); ctx.color("oklch(0.75 0.03 60)");
  const bx = 1.35, bz = -0.45, n = fine ? 14 : 8;
  loft(ctx, T, [ringH(bx, 0, bz, 0.31, 0.31, n), ringH(bx, 0.22, bz, 0.36, 0.36, n), ringH(bx, 0.46, bz, 0.38, 0.38, n), ringH(bx, 0.7, bz, 0.36, 0.36, n), ringH(bx, 0.92, bz, 0.31, 0.31, n)]);
  ctx.albedo(IRON); ctx.color("oklch(0.5 0.01 250)"); ctx.metalness(0.5);
  for (const [y, r] of [[0.1, 0.345], [0.8, 0.345], [0.46, 0.39]]) loft(ctx, T, [ringH(bx, y - 0.025, bz, r, r, n), ringH(bx, y + 0.025, bz, r, r, n)], false, false);
  ctx.metalness(0);
  // sacks
  ctx.albedo("cdn/texture-coarse-burlap-sack.png"); ctx.color("oklch(0.88 0.03 80)");
  for (const [x, z, yaw, roll] of [[1.25, 0.5, 20, 0], [-1.25, 0.45, -30, 0], [0.35, 0.85, 80, 75], [-0.95, -0.7, 10, 0]]) {
    const S = xf([x, 0, z], [yaw, 0, roll]);
    rock(ctx, S, 0.32, { sub: fine, sx: 0.95, sy: roll ? 0.8 : 1.35, sz: 0.8, rough: 0.14, sink: 0.08 });
    if (!roll) { ctx.color("oklch(0.7 0.04 70)"); tube(ctx, S, [[0, 0.78, 0], [0, 0.88, 0], [0.04, 0.95, 0]], [0.07, 0.05, 0.08], 6); ctx.color("oklch(0.88 0.03 80)"); }
  }
}
export function collider(ctx) { box(ctx, xf([0.1, 0, 0]), 3.0, 1.5, 1.8); }
