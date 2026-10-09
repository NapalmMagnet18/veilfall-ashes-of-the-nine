// A pilgrim's bedroll: hide mat, rumpled wool blanket, rolled pillow, a leather pack at the head and
// a walking staff. Origin = mat centre; the foot points −Z (spawn it looking at the fire).
import { xf, compose, cbox, tube, quad, rnd, WOOD } from "./hub-kit.js";
export function geometry(ctx) {
  const p = ctx.params || {}, fine = (ctx.lod ?? 1) <= 2, T = xf();
  ctx.flat(); ctx.roughness(0.95);
  ctx.albedo("/cdn/value.fc57b26e9d525c1cf1c8cc6ecfe6fff0ac7d9b1efa8635d83904eda34a281237.png"); ctx.color("oklch(0.8 0.03 60)");
  cbox(ctx, xf([0, 0, 0.05]), 0.88, 0.035, 2.0, 0.012);
  // the blanket, a rumpled sheet
  ctx.albedo("cdn/texture-coarse-wool-blanket-weave.png"); ctx.color(p.tint || "oklch(0.86 0.04 40)");
  const nx = fine ? 5 : 3, nz = fine ? 10 : 5, w = 0.78, z0 = -0.88, z1 = 0.55, H = [];
  for (let i = 0; i <= nx; i++) { H[i] = []; for (let j = 0; j <= nz; j++) { const edge = i === 0 || i === nx || j === 0 ? 0 : 1; H[i][j] = 0.045 + edge * (0.03 + 0.045 * ctx.random() + 0.03 * Math.sin(j * 1.3 + i)); } }
  const P = (i, j) => [-w / 2 + (w * i) / nx + (i === 0 ? -0.02 : i === nx ? 0.02 : 0), H[i][j], z0 + ((z1 - z0) * j) / nz];
  for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) quad(ctx, T, P(i, j), P(i, j + 1), P(i + 1, j + 1), P(i + 1, j));
  cbox(ctx, xf([0.02, 0.05, 0.58], [6, 0, 3]), 0.8, 0.07, 0.24, 0.03);
  tube(ctx, T, [[-0.38, 0.13, 0.82], [0, 0.14, 0.83], [0.38, 0.13, 0.82]], [0.1, 0.11, 0.1], fine ? 8 : 5);
  // the pack
  const PK = xf([0.05, 0.02, 1.2], [rnd(ctx, -15, 15), -12, 5]);
  ctx.albedo("/cdn/value.fc57b26e9d525c1cf1c8cc6ecfe6fff0ac7d9b1efa8635d83904eda34a281237.png"); ctx.color(p.pack || "oklch(0.75 0.04 55)");
  cbox(ctx, PK, 0.5, 0.55, 0.32, 0.05);
  cbox(ctx, compose(PK, xf([0, 0.42, -0.03], [0, 8, 0])), 0.52, 0.06, 0.36, 0.02);
  cbox(ctx, compose(PK, xf([0, 0.08, -0.2])), 0.34, 0.2, 0.08, 0.02);
  if (fine) { ctx.color("oklch(0.55 0.03 50)"); for (const sx of [-0.13, 0.13]) cbox(ctx, compose(PK, xf([sx, 0.06, -0.175])), 0.045, 0.44, 0.02, 0.005); }
  ctx.albedo("cdn/texture-coarse-wool-blanket-weave.png"); ctx.color(p.tint || "oklch(0.86 0.04 40)");
  tube(ctx, PK, [[-0.28, 0.66, 0], [0.28, 0.66, 0]], 0.09, fine ? 7 : 5);
  // the staff
  ctx.albedo(WOOD); ctx.color("oklch(0.7 0.03 60)");
  tube(ctx, T, [[0.56, 0.03, -0.85], [0.6, 0.03, 0.1], [0.62, 0.035, 0.9]], [0.022, 0.025, 0.03], 5);
}
export function collider() { return null; }
