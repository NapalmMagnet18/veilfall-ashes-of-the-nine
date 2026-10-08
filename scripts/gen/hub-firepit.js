// THE WAYSIDE FIRE: soot-black fieldstone ring (r 1.1), ash bed, a teepee of charred logs over
// glowing coals, an iron tripod with a hanging pot. Origin = the fire's centre on the ground.
import { xf, loft, ringH, rock, tube, box, rnd, IRON } from "./hub-kit.js";
export function geometry(ctx) {
  const fine = (ctx.lod ?? 1) <= 2, T = xf();
  ctx.flat(); ctx.roughness(1);
  ctx.albedo("cdn/texture-wood-ash-and-charcoal-ground.png");
  ctx.color("oklch(0.55 0.01 60)");
  loft(ctx, T, [ringH(0, 0.004, 0, 1.9, 1.75, 18, 0.25, ctx), ringH(0, 0.018, 0, 1.4, 1.4, 18)], false, true);
  ctx.color("oklch(0.8 0.01 70)");
  loft(ctx, T, [ringH(0, 0.018, 0, 1.0, 1.0, 16), ringH(0, 0.07, 0, 0.78, 0.78, 16, 0.2, ctx), ringH(0, 0.1, 0, 0.42, 0.42, 16)], false, true);
  // the ring of fieldstones
  ctx.albedo("cdn/texture-soot-blackened-fieldstone.png");
  const N = fine ? 13 : 9;
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2 + rnd(ctx, -0.12, 0.12), rr = rnd(ctx, 0.2, 0.3), d = 1.12 + rnd(ctx, -0.05, 0.06);
    rock(ctx, xf([Math.cos(a) * d, 0, Math.sin(a) * d], [rnd(ctx, 0, 360), 0, 0]), rr, {
      sub: fine, sx: rnd(ctx, 1, 1.35), sy: rnd(ctx, 0.55, 0.8), sink: 0.3,
      face: (c, n) => c.color(n[1] > 0.55 ? "oklch(0.66 0.01 250)" : "oklch(0.42 0.005 250)"),
    });
  }
  // charred logs: a teepee and the fallen ones in the bed
  ctx.albedo("cdn/texture-charred-cracked-wood-bark.png");
  ctx.color("oklch(0.6 0.015 45)");
  const sides = fine ? 7 : 5;
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + 0.4, b = [Math.cos(a) * 0.58, 0.05, Math.sin(a) * 0.58], t = [Math.cos(a + 0.5) * 0.07, 0.8, Math.sin(a + 0.5) * 0.07];
    tube(ctx, T, [b, [b[0] * 0.55 + t[0] * 0.45, 0.42, b[2] * 0.55 + t[2] * 0.45], t], [0.085, 0.075, 0.045], sides);
  }
  for (let i = 0; i < 3; i++) {
    const a = i * 2.2 + 0.9;
    tube(ctx, T, [[Math.cos(a) * 0.85, 0.09, Math.sin(a) * 0.85], [Math.cos(a + 2.6) * 0.5, 0.15, Math.sin(a + 2.6) * 0.5]], [0.09, 0.07], sides);
  }
  // coals
  for (let i = 0; i < (fine ? 18 : 8); i++) {
    const a = rnd(ctx, 0, 6.28), d = Math.sqrt(ctx.random()) * 0.5;
    ctx.color("oklch(0.35 0.03 40)");
    const hot = ctx.random();
    ctx.emissive(hot > 0.45 ? 2.8 : 1.3, hot > 0.45 ? 0.75 : 0.28, hot > 0.45 ? 0.14 : 0.05);
    rock(ctx, xf([Math.cos(a) * d, 0.07, Math.sin(a) * d]), rnd(ctx, 0.035, 0.07), { sy: 0.7, rough: 0.5 });
  }
  ctx.emissive(null);
  // the iron tripod and pot
  ctx.albedo(IRON); ctx.color("oklch(0.6 0.01 250)"); ctx.metalness(0.6); ctx.roughness(0.65);
  const apex = [0, 1.75, 0];
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + 1.3, f = [Math.cos(a) * 1.5, 0, Math.sin(a) * 1.5];
    tube(ctx, T, [f, [apex[0] - f[0] * 0.08, apex[1] + 0.12, apex[2] - f[2] * 0.08]], [0.028, 0.022], 5);
  }
  tube(ctx, T, [[0, 1.76, 0], [0, 1.16, 0]], 0.009, 4);
  ctx.color("oklch(0.45 0.01 250)");
  loft(ctx, T, [ringH(0, 0.8, 0, 0.13, 0.13, 12), ringH(0, 0.86, 0, 0.21, 0.21, 12), ringH(0, 0.98, 0, 0.25, 0.25, 12), ringH(0, 1.06, 0, 0.23, 0.23, 12), ringH(0, 1.09, 0, 0.255, 0.255, 12)], true, false);
  tube(ctx, T, [[-0.25, 1.08, 0], [-0.14, 1.15, 0], [0, 1.17, 0], [0.14, 1.15, 0], [0.25, 1.08, 0]], 0.01, 4, false, false);
  ctx.metalness(0); ctx.albedo(null); ctx.color("oklch(0.3 0.04 50)");
  loft(ctx, T, [ringH(0, 1.03, 0, 0.22, 0.22, 12)], false, true);
}
export function collider(ctx) { box(ctx, xf(), 2.7, 0.4, 2.7); }
