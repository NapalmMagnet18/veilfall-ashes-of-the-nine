// A cluster of violet cave crystals grown out of a black rock base. params: n (spears), h (tallest, m), r (spread)
import { xf, loft, rock, box } from "./hub-kit.js";
function spear(ctx, T, h, w) { // a six-sided crystal: shaft, then a pointed cap
  const ring = (y, s) => { const r = []; for (let i = 0; i < 6; i++) { const a = (i / 6) * 6.283; r.push([Math.cos(a) * w * s, y, Math.sin(a) * w * s]); } return r; };
  loft(ctx, T, [ring(-0.1, 0.9), ring(h * 0.72, 1), ring(h * 0.82, 0.7), ring(h, 0.02)], true, false);
}
export function geometry(ctx) {
  const p = ctx.params || {}, n = p.n ?? 7, H = p.h ?? 1.6, R = p.r ?? 0.6, lod = ctx.lod ?? 1;
  ctx.flat(); ctx.roughness(0.9); ctx.color("oklch(0.24 0.02 290)");
  rock(ctx, xf(), R * 1.1, { sub: lod <= 2, sx: 1.2, sy: 0.45, sz: 1, rough: 0.35, sink: 0.25 });
  ctx.roughness(0.12); ctx.metalness(0);
  for (let i = 0; i < (lod > 3 ? Math.ceil(n / 2) : n); i++) {
    const a = ctx.random() * 6.283, d = i === 0 ? 0 : R * (0.3 + ctx.random() * 0.7), h = i === 0 ? H : H * (0.35 + ctx.random() * 0.55);
    const tilt = i === 0 ? ctx.random() * 8 : 14 + ctx.random() * 30;
    const hue = 290 + ctx.random() * 30 - (ctx.random() < 0.25 ? 70 : 0); // mostly amethyst, a few cold cyan
    ctx.color(`oklch(${0.55 + ctx.random() * 0.15} 0.16 ${hue})`);
    ctx.emissive(hue < 260 ? 0.25 : 0.7, hue < 260 ? 0.9 : 0.3, 1.4);
    spear(ctx, xf([Math.cos(a) * d, 0.1, Math.sin(a) * d], [a * 57.3, 0, tilt]), h, 0.06 + h * 0.07);
  }
  ctx.emissive(0, 0, 0);
}
export function collider(ctx) { const p = ctx.params || {}, R = p.r ?? 0.6; box(ctx, xf(), R * 1.6, (p.h ?? 1.6) * 0.8, R * 1.6); }
