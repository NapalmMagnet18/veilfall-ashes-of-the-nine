// A weathered boulder half sunk in the ground: cleaved faces, a moss cap that thins down the flanks, rust lichen
// spots, damp dark undersides, and loose stones broken off at its foot. params: r, sx, sy, sz.
import { xf, rock, box } from "./hub-kit.js";
export function geometry(ctx) {
  const p = ctx.params || {}, r = p.r || 1.2, lod = ctx.lod ?? 1, sx = p.sx ?? 1.2, sy = p.sy ?? 0.75, sz = p.sz ?? 1;
  ctx.flat(); ctx.roughness(0.95);
  ctx.albedo("/cdn/value.243c4d064e00fadee4358d31215a4c6a8aae8847e4fe90bfca0a813388da8c76.png");
  const face = (c, n) => {
    const up = n[1], q = c.random();
    if (up > 0.72 && q < 0.85) c.color(q < 0.3 ? "oklch(0.55 0.08 132)" : "oklch(0.62 0.07 135)");        // the moss cap
    else if (up > 0.4 && q < 0.35) c.color("oklch(0.58 0.06 128)");                                          // moss creeping down
    else if (up > -0.1 && q < 0.06) c.color("oklch(0.6 0.09 55)");                                           // rust lichen
    else if (up < -0.15) c.color("oklch(0.5 0.012 240)");                                                    // damp underside
    else c.color(q < 0.5 ? "oklch(0.78 0.01 250)" : q < 0.8 ? "oklch(0.72 0.012 245)" : "oklch(0.82 0.008 80)");
  };
  rock(ctx, xf(), r, { sub: lod <= 2, sx, sy, sz, rough: 0.42, sink: 0.3, face });
  if (lod > 2) return;
  const n = lod <= 1 ? 6 : 3;
  for (let i = 0; i < n; i++) { // the stones that broke off it, lying in its lee
    const a = ctx.random() * 6.283, d = r * (1.05 + ctx.random() * 0.45), s = r * (0.07 + ctx.random() * 0.12);
    rock(ctx, xf([Math.cos(a) * d * sx, 0, Math.sin(a) * d * sz], [0, ctx.random() * 360, 0]), s, { sx: 1.2, sy: 0.6, sz: 1, rough: 0.5, sink: 0.4, face });
  }
}
export function collider(ctx) { const p = ctx.params || {}, r = p.r || 1.2; box(ctx, xf(), 2 * r * (p.sx ?? 1.2) * 0.85, r * (p.sy ?? 0.75) * 1.5, 2 * r * (p.sz ?? 1) * 0.85); }
