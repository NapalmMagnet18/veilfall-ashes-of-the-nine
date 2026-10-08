// The Lantern Rail by Maelin's fire: where the Bearers hang the lanterns of the Nine they bring home.
// A cracked granite plinth, two ash-black timber posts, a crossbeam carved with nine notches and nine
// iron hooks. Front faces local -Z. Hooks at x = -1.44 + i*0.36, hanging point y = HOOK_Y.
import { xf, compose, tube, box, cbox, loft, rect, ringH, rock, candle, rnd, IRON, STONE, WOOD } from "./hub-kit.js";
export const HOOK_Y = 2.2;
export const hookX = (i) => -1.44 + i * 0.36;
function build(ctx, col) {
  const L = ctx.lod ?? 1, I = xf();
  // plinth: three stacked granite slabs, the top one cracked and shifted
  ctx.flat(); ctx.albedo(STONE); ctx.roughness(0.9); ctx.metalness(0); ctx.color("oklch(0.62 0.01 250)");
  cbox(ctx, xf([0, 0, 0]), 3.9, 0.22, 1.1, 0.04);
  cbox(ctx, xf([-0.95, 0.22, 0.02], [1.5, 0, 0]), 1.9, 0.2, 0.92, 0.03);
  cbox(ctx, xf([0.98, 0.22, -0.01], [-1.2, 0, 0.6]), 1.86, 0.19, 0.9, 0.03);
  if (col) return;
  // posts: ash-black timber, iron-strapped, slight lean
  ctx.albedo(WOOD); ctx.roughness(0.95); ctx.color("oklch(0.42 0.02 50)");
  for (const s of [-1, 1]) {
    cbox(ctx, xf([s * 1.72, 0.4, 0], [0, 0, s * -1.2]), 0.2, 2.2, 0.2, 0.03);
    // a brace from post to beam
    tube(ctx, I, [[s * 1.68, 1.85, 0], [s * 1.35, 2.38, 0]], 0.05, 5);
  }
  // crossbeam with nine carved notches along its face
  cbox(ctx, xf([0, 2.36, 0]), 3.9, 0.22, 0.24, 0.03);
  ctx.color("oklch(0.24 0.015 50)");
  for (let i = 0; i < 9; i++) box(ctx, xf([-1.44 + i * 0.36, 2.42, -0.125]), 0.05, 0.1, 0.012);
  // a weathered header board above, nailed on, with a cut lantern sigil
  ctx.color("oklch(0.38 0.02 55)");
  cbox(ctx, xf([0, 2.62, -0.02], [0, 0, -1.5]), 1.5, 0.34, 0.06, 0.015);
  ctx.color("oklch(0.18 0.01 50)");
  loft(ctx, xf([0, 2.66, -0.055]), [rect(0.06, 0.006, 0, -0.1), rect(0.1, 0.006, 0, -0.02), rect(0.03, 0.006, 0, 0.12)]);
  // iron: post straps, hooks
  ctx.albedo(IRON); ctx.metalness(0.6); ctx.roughness(0.6); ctx.color("oklch(0.55 0.02 45)");
  for (const s of [-1, 1]) for (const y of [0.7, 1.6, 2.2]) cbox(ctx, xf([s * 1.72 - s * y * 0.02, y, 0]), 0.23, 0.05, 0.23, 0.005);
  for (let i = 0; i < 9; i++) {
    const x = hookX(i);
    tube(ctx, I, [[x, 2.25, 0], [x, HOOK_Y + 0.02, 0], [x + 0.03, HOOK_Y - 0.01, 0], [x + 0.045, HOOK_Y + 0.03, 0]], 0.009, 4, false, false);
  }
  // wax: a candle bed along the plinth front, soot on the stone, drips down its face
  const n = L <= 2 ? 16 : 8;
  for (let i = 0; i < n; i++) candle(ctx, I, [rnd(ctx, -1.7, 1.7), 0.41, rnd(ctx, -0.42, -0.15), rnd(ctx, 0.05, 0.22)], L <= 2);
  ctx.albedo(null); ctx.metalness(0); ctx.roughness(0.5); ctx.color("oklch(0.8 0.04 85)");
  for (let i = 0; i < (L <= 2 ? 12 : 5); i++) { const x = rnd(ctx, -1.8, 1.8), len = rnd(ctx, 0.08, 0.32); tube(ctx, I, [[x, 0.41, -0.46], [x, 0.41 - len * 0.6, -0.465], [x, 0.41 - len, -0.47]], [0.018, 0.014, 0.02], 4, false, true); }
  // two fallen offerings at its foot: a rock and a dropped lantern ring
  ctx.albedo(STONE); ctx.color("oklch(0.5 0.01 250)"); ctx.roughness(0.95);
  rock(ctx, xf([-2.3, 0, -0.5]), 0.3);
}
export function geometry(ctx) { build(ctx, false); }
export function collider(ctx) { build(ctx, true); ctx.flat(); cbox(ctx, xf([-1.72, 0.4, 0]), 0.22, 2.2, 0.22); cbox(ctx, xf([1.72, 0.4, 0]), 0.22, 2.2, 0.22); }
