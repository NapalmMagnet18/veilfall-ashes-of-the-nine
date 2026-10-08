// A wayside lantern post: a two-tier stone footing with moss, an iron post with collars and a
// finial, a braced arm reaching +X and a hanging lantern (glass centre at FLAME_AT).
import { xf, compose, cbox, tube, loft, ringH, rock, lantern, rnd, IRON, STONE } from "./hub-kit.js";
export const FLAME_AT = [0.55, 2.13, 0];
export function geometry(ctx) {
  const fine = (ctx.lod ?? 1) <= 2, T = xf();
  ctx.flat(); ctx.roughness(0.9);
  ctx.albedo(STONE); ctx.color("oklch(0.8 0.01 250)");
  cbox(ctx, T, 0.62, 0.3, 0.62, 0.05);
  cbox(ctx, xf([0, 0.3, 0]), 0.44, 0.16, 0.44, 0.04);
  ctx.albedo("cdn/texture-damp-dark-moss.png"); ctx.color("oklch(0.75 0.06 135)");
  for (let i = 0; i < (fine ? 4 : 2); i++) { const a = i * 1.7 + 0.4; rock(ctx, xf([Math.cos(a) * 0.32, 0, Math.sin(a) * 0.32]), rnd(ctx, 0.1, 0.15), { sy: 0.4, sx: 1.5, rough: 0.5 }); }
  ctx.albedo(IRON); ctx.color("oklch(0.6 0.01 250)"); ctx.metalness(0.6); ctx.roughness(0.6);
  tube(ctx, T, [[0, 0.44, 0], [0, 2.75, 0]], [0.06, 0.045], 8);
  for (const y of [0.5, 1.9, 2.5]) tube(ctx, T, [[0, y, 0], [0, y + 0.06, 0]], 0.075, 8);
  loft(ctx, T, [ringH(0, 2.75, 0, 0.06, 0.06, 6), ringH(0, 2.82, 0, 0.08, 0.08, 6), ringH(0, 2.98, 0, 0.005, 0.005, 6)], true, false);
  tube(ctx, T, [[0, 2.55, 0], [0.25, 2.66, 0], [0.55, 2.6, 0], [0.6, 2.52, 0]], [0.028, 0.025, 0.022, 0.02], 5);
  tube(ctx, T, [[0, 2.2, 0], [0.18, 2.4, 0], [0.32, 2.62, 0]], 0.014, 4);
  tube(ctx, T, [[0.55, 2.6, 0], [0.55, 2.4, 0]], 0.01, 4);
  lantern(ctx, xf([0.55, 2.4, 0], [0, 0, 0], 1.3));
}
export function collider(ctx) { cbox(ctx, xf(), 0.62, 2.8, 0.62, 0.01); }
