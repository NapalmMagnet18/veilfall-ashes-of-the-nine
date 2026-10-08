// The Wayside rendering cauldron: a pot-bellied iron cauldron hung by chain from a lashed timber tripod over a
// ring of fire-blackened stones and a bed of embers. Origin = ground centre; the pot's rim sits at ~0.95 m.
import { xf, compose, tube, loft, ringH, rock, cbox, IRON, STONE, WOOD } from "./hub-kit.js";
import { boxC } from "./shapes.js";
export function geometry(ctx) {
  const I = xf();
  if ((ctx.lod ?? 1) >= 4) { // far: the pot and its glow, a few dozen faces
    ctx.flat(); ctx.color("oklch(0.24 0.012 40)"); loft(ctx, I, [ringH(0, 0.32, 0, 0.2, 0.2, 6), ringH(0, 0.6, 0, 0.47, 0.47, 6), ringH(0, 0.95, 0, 0.42, 0.42, 6)], true, false);
    ctx.color("oklch(0.75 0.15 70)"); ctx.emissive(1.8, 1.0, 0.3); loft(ctx, I, [ringH(0, 0.9, 0, 0.4, 0.4, 6)], false, true); ctx.emissive(null); return;
  }
  // hearth stones, soot-black on their inner faces
  ctx.flat(); ctx.albedo(STONE); ctx.metalness(0); ctx.roughness(0.9);
  for (let i = 0; i < 9; i++) { const a = (i / 9) * 6.283 + ctx.random() * 0.2, r = 0.62 + ctx.random() * 0.06;
    ctx.color(`oklch(${0.3 + ctx.random() * 0.08} 0.01 60)`); rock(ctx, xf([Math.cos(a) * r, 0, Math.sin(a) * r], [0, ctx.random() * 360, 0]), 0.16 + ctx.random() * 0.05, { sy: 0.65, rough: 0.4 }); }
  // ash bed and embers
  ctx.albedo(null); ctx.color("oklch(0.22 0.01 50)"); ctx.roughness(1);
  loft(ctx, I, [ringH(0, 0.0, 0, 0.6, 0.6, 12), ringH(0, 0.04, 0, 0.5, 0.5, 12, 0.2, ctx)]);
  ctx.color("oklch(0.55 0.18 40)"); ctx.emissive(2.4, 0.7, 0.15);
  for (let i = 0; i < 7; i++) { const a = ctx.random() * 6.283, r = ctx.random() * 0.32; rock(ctx, xf([Math.cos(a) * r, 0.03, Math.sin(a) * r]), 0.05 + ctx.random() * 0.03, { sy: 0.5 }); }
  ctx.emissive(null);
  // the tripod: three peeled poles lashed at the crown
  ctx.albedo(WOOD); ctx.color("oklch(0.4 0.03 60)"); ctx.roughness(0.85);
  const crown = [0, 1.95, 0];
  for (let i = 0; i < 3; i++) { const a = (i / 3) * 6.283 + 0.5, foot = [Math.cos(a) * 0.95, 0, Math.sin(a) * 0.95];
    tube(ctx, I, [foot, [foot[0] * 0.5, 1.0, foot[2] * 0.5], [-foot[0] * 0.08, 2.1, -foot[2] * 0.08]], [0.05, 0.045, 0.035], 6); }
  ctx.albedo(null); ctx.color("oklch(0.5 0.04 70)"); ctx.roughness(1); // rope lashing
  for (let k = 0; k < 3; k++) loft(ctx, I, [ringH(0, 1.88 + k * 0.035, 0, 0.09, 0.09, 8), ringH(0, 1.91 + k * 0.035, 0, 0.1, 0.1, 8)], false, false);
  // chain
  ctx.albedo(IRON); ctx.color("oklch(0.33 0.02 50)"); ctx.metalness(0.7); ctx.roughness(0.6);
  for (let y = 1.86; y > 1.15; y -= 0.07) { const turn = Math.round((1.86 - y) / 0.07) % 2 ? 90 : 0;
    tube(ctx, xf([0, y, 0], [0, turn, 0]), [[0, 0, 0], [0.018, -0.02, 0], [0, -0.05, 0], [-0.018, -0.02, 0], [0, 0, 0]], 0.006, 4, false, false); }
  // the pot: pot-bellied, a thick lip, two lugs and a bail
  const pot = [ringH(0, 0.32, 0, 0.12, 0.12, 16), ringH(0, 0.38, 0, 0.34, 0.34, 16), ringH(0, 0.55, 0, 0.47, 0.47, 16), ringH(0, 0.75, 0, 0.47, 0.47, 16),
    ringH(0, 0.9, 0, 0.4, 0.4, 16), ringH(0, 0.95, 0, 0.42, 0.42, 16), ringH(0, 0.99, 0, 0.42, 0.42, 16), ringH(0, 0.99, 0, 0.37, 0.37, 16), ringH(0, 0.88, 0, 0.36, 0.36, 16)];
  ctx.color("oklch(0.24 0.012 40)"); loft(ctx, I, pot, true, true);
  for (const s of [1, -1]) loft(ctx, I, [ringH(s * 0.44, 0.84, 0, 0.04, 0.04, 6), ringH(s * 0.49, 0.86, 0, 0.04, 0.04, 6)]);
  tube(ctx, I, [[0.48, 0.86, 0], [0.4, 1.15, 0], [0, 1.18, 0], [-0.4, 1.15, 0], [-0.48, 0.86, 0]], 0.012, 5, false, false);
  // three stubby legs
  for (let i = 0; i < 3; i++) { const a = (i / 3) * 6.283; tube(ctx, I, [[Math.cos(a) * 0.25, 0.42, Math.sin(a) * 0.25], [Math.cos(a) * 0.3, 0.15, Math.sin(a) * 0.3]], [0.04, 0.03], 5); }
  // drips of rendered wax down the belly, pale tallow
  ctx.albedo(null); ctx.metalness(0); ctx.roughness(0.35); ctx.color("oklch(0.85 0.04 85)");
  for (let i = 0; i < 6; i++) { const a = ctx.random() * 6.283, l = 0.15 + ctx.random() * 0.25;
    tube(ctx, I, [[Math.cos(a) * 0.43, 0.97, Math.sin(a) * 0.43], [Math.cos(a) * 0.475, 0.85, Math.sin(a) * 0.475], [Math.cos(a) * 0.47, 0.85 - l, Math.sin(a) * 0.47]], [0.025, 0.018, 0.012], 5, false, true); }
  // the brew's surface, glowing amber
  ctx.color("oklch(0.75 0.15 70)"); ctx.emissive(1.8, 1.0, 0.3); ctx.roughness(0.2);
  loft(ctx, I, [ringH(0, 0.9, 0, 0.36, 0.36, 16)], false, true);
  ctx.emissive(null);
  // a ladle leaning in, and a crate of rendered candles beside
  ctx.albedo(WOOD); ctx.color("oklch(0.45 0.04 60)"); ctx.roughness(0.8);
  tube(ctx, I, [[0.2, 0.92, 0.1], [0.55, 1.35, 0.3]], 0.018, 5);
  cbox(ctx, xf([0.95, 0, -0.55], [0, 25, 0]), 0.42, 0.26, 0.32, 0.02);
  ctx.albedo(null); ctx.color("oklch(0.88 0.04 85)"); ctx.roughness(0.5);
  for (let i = 0; i < 5; i++) tube(ctx, compose(xf([0.95, 0.26, -0.55], [0, 25, 0]), xf([-0.13 + i * 0.065, 0, (i % 2) * 0.06 - 0.03])), [[0, -0.05, 0], [0, 0.09 + (i % 3) * 0.02, 0]], 0.022, 6);
}
export function collider(ctx) { boxC(ctx, -0.55, 0.55, 0, 1.0, -0.55, 0.55); }
