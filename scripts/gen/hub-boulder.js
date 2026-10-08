// A weathered boulder half sunk in the ground, moss on its upward faces. params: r, sx, sy, sz.
import { xf, rock, box } from "./hub-kit.js";
export function geometry(ctx) {
  const p = ctx.params || {}, r = p.r || 1.2;
  ctx.flat(); ctx.roughness(0.95);
  ctx.albedo("cdn/texture-weathered-wet-dark-granite.png");
  rock(ctx, xf(), r, { sub: (ctx.lod ?? 1) <= 2, sx: p.sx ?? 1.2, sy: p.sy ?? 0.75, sz: p.sz ?? 1, rough: 0.4, sink: 0.3,
    face: (c, n) => c.color(n[1] > 0.6 && c.random() < 0.7 ? "oklch(0.62 0.07 135)" : "oklch(0.78 0.01 250)") });
}
export function collider(ctx) { const p = ctx.params || {}, r = p.r || 1.2; box(ctx, xf(), 2 * r * (p.sx ?? 1.2) * 0.85, r * (p.sy ?? 0.75) * 1.5, 2 * r * (p.sz ?? 1) * 0.85); }
