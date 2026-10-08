// One lantern of the Nine, hung from the Lantern Rail; origin = its hook. Each has its own maker's hand:
// params.kind "ninth" (gilt bell-bronze, a bell crown), "drowned" (weed-hung iron cage, verdigris),
// "gallows" (rusted iron, a frayed noose knot on the bail). params.glow = [r,g,b] emissive.
import { xf, compose, tube, box, cbox, loft, rect, ringH, IRON } from "./hub-kit.js";
export function geometry(ctx) {
  const k = ctx.params.kind ?? "ninth", g = ctx.params.glow ?? [3, 2, 0.8], I = xf();
  ctx.flat(); ctx.albedo(IRON); ctx.metalness(0.65); ctx.roughness(0.55);
  ctx.color(k === "ninth" ? "oklch(0.72 0.09 80)" : k === "drowned" ? "oklch(0.55 0.05 170)" : "oklch(0.5 0.07 40)");
  // bail ring and cap
  tube(ctx, I, [[0, 0.02, 0], [0.03, -0.02, 0], [0, -0.06, 0], [-0.03, -0.02, 0], [0, 0.02, 0]], 0.008, 4, false, false);
  loft(ctx, I, [ringH(0, -0.17, 0, 0.11, 0.11, 6), ringH(0, -0.13, 0, 0.11, 0.11, 6), ringH(0, -0.07, 0, 0.03, 0.03, 6)]);
  if (k === "ninth") loft(ctx, I, [ringH(0, -0.07, 0, 0.035, 0.035, 8), ringH(0, -0.03, 0, 0.05, 0.05, 8), ringH(0, 0.0, 0, 0.02, 0.02, 8)]); // a little bell crown
  // cage bars and base
  for (let i = 0; i < 6; i++) { const a = (i / 6) * 6.283; box(ctx, xf([Math.cos(a) * 0.1, -0.44, Math.sin(a) * 0.1]), 0.016, 0.27, 0.016); }
  loft(ctx, I, [ringH(0, -0.48, 0, 0.12, 0.12, 6), ringH(0, -0.45, 0, 0.12, 0.12, 6), ringH(0, -0.44, 0, 0.1, 0.1, 6)]);
  loft(ctx, I, [ringH(0, -0.53, 0, 0.04, 0.04, 6), ringH(0, -0.48, 0, 0.09, 0.09, 6)]);
  if (k === "drowned") { // weed strands hanging off it
    ctx.albedo(null); ctx.metalness(0); ctx.roughness(0.8); ctx.color("oklch(0.35 0.06 140)");
    for (const [x, z, l] of [[0.1, 0.02, 0.3], [-0.08, 0.07, 0.22], [0.02, -0.11, 0.36]]) tube(ctx, I, [[x, -0.15, z], [x * 1.2, -0.3, z * 1.1], [x, -0.15 - l, z]], [0.012, 0.008, 0.003], 3, false, false);
  }
  if (k === "gallows") { // a frayed knot of noose rope tied round the bail
    ctx.albedo(null); ctx.metalness(0); ctx.roughness(1); ctx.color("oklch(0.5 0.04 70)");
    loft(ctx, I, [ringH(0, -0.075, 0, 0.04, 0.04, 6), ringH(0, -0.04, 0, 0.045, 0.045, 6), ringH(0, -0.01, 0, 0.03, 0.03, 6)]);
    tube(ctx, I, [[0.03, -0.04, 0], [0.07, -0.12, 0.02], [0.06, -0.22, 0.03]], [0.012, 0.009, 0.004], 4, false, false);
  }
  // the flame glass
  ctx.albedo(null); ctx.metalness(0); ctx.roughness(0.25);
  ctx.color(k === "drowned" ? "oklch(0.88 0.08 185)" : "oklch(0.9 0.1 75)"); ctx.emissive(g[0], g[1], g[2]);
  loft(ctx, I, [ringH(0, -0.45, 0, 0.085, 0.085, 6), ringH(0, -0.3, 0, 0.085, 0.085, 6), ringH(0, -0.18, 0, 0.07, 0.07, 6)]);
  ctx.emissive(null);
}
