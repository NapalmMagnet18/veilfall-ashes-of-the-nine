// The Pilgrims' Board: two weathered oak posts under a shingled hood, a plank face crowded with pinned
// notices (some torn, one nailed through a wax seal), a lantern on a crook and a strongbox chained at its foot.
// Origin = centre on the ground; the face looks -Z.
import { boxC } from "./shapes.js";
import { xf, cbox, tube, loft, rect, rnd, lantern, compose, IRON, WOOD } from "./hub-kit.js";
export const LAMP = [0.98, 2.05, -0.28]; // the glass centre, for the scene light
export function geometry(ctx) {
  const fine = (ctx.lod ?? 1) <= 2;
  ctx.flat(); ctx.metalness(0); ctx.roughness(0.95);
  // posts, sunk in heaped stones
  ctx.albedo(WOOD); ctx.color("oklch(0.42 0.035 55)");
  for (const x of [-0.85, 0.85]) cbox(ctx, xf([x, 0, 0], [0, 0, x * 1.2]), 0.14, 2.35, 0.14, 0.02);
  // plank face: five boards, uneven
  for (let i = 0; i < 5; i++) {
    ctx.color(`oklch(${0.4 + rnd(ctx, -0.04, 0.05)} 0.035 ${50 + rnd(ctx, -6, 8)})`);
    cbox(ctx, xf([0, 0.85 + i * 0.25, 0.02], [0, 0, rnd(ctx, -0.8, 0.8)]), 1.62 + rnd(ctx, -0.05, 0.04), 0.23, 0.05, 0.01);
  }
  // cross brace behind
  ctx.color("oklch(0.36 0.03 50)"); cbox(ctx, xf([0, 1.4, 0.08], [0, 0, 32]), 1.9, 0.08, 0.04, 0.01);
  // hood: two shingled pitches over a ridge beam
  ctx.color("oklch(0.33 0.025 45)"); cbox(ctx, xf([0, 2.32, 0]), 2.1, 0.08, 0.08, 0.015);
  for (const side of [-1, 1]) for (let r = 0; r < 3; r++) for (let k = 0; k < 7; k++) {
    ctx.color(`oklch(${0.27 + rnd(ctx, -0.03, 0.04)} 0.02 ${40 + rnd(ctx, -8, 10)})`);
    cbox(ctx, xf([-0.9 + k * 0.3 + rnd(ctx, -0.02, 0.02), 2.36 - r * 0.09, side * (0.08 + r * 0.14)], [side * -28 + rnd(ctx, -4, 4), rnd(ctx, -3, 3), 0]), 0.29, 0.03, 0.18, 0.006);
  }
  // notices: parchment sheets at odd angles, ink lines, one torn corner, wax seals
  const notes = [[-0.55, 1.6, 0.42, 0.5], [-0.05, 1.75, 0.36, 0.42], [0.45, 1.55, 0.38, 0.48], [-0.4, 1.05, 0.34, 0.36], [0.15, 1.12, 0.44, 0.38], [0.6, 0.98, 0.26, 0.3]];
  for (const [x, y, w, h] of notes) {
    const rz = rnd(ctx, -9, 9), T = xf([x, y, -0.02], [0, 0, rz]);
    ctx.albedo(null); ctx.roughness(0.9); ctx.color(`oklch(${0.78 + rnd(ctx, -0.06, 0.05)} 0.045 ${78 + rnd(ctx, -6, 6)})`);
    cbox(ctx, T, w, h, 0.006, 0.002);
    if (fine) {
      ctx.color("oklch(0.25 0.02 40)");
      const lines = Math.floor(h / 0.07);
      for (let l = 0; l < lines; l++) cbox(ctx, compose(T, xf([rnd(ctx, -0.02, 0.02), h * 0.38 - l * 0.065, -0.005])), w * rnd(ctx, 0.5, 0.75), 0.012, 0.003, 0);
    }
    ctx.color("oklch(0.42 0.14 28)"); ctx.roughness(0.4); // a red wax seal at the head
    loft(ctx, compose(T, xf([0, h * 0.42, -0.008], [90, 0, 0])), [[[0.03, 0, 0], [0, 0, 0.03], [-0.03, 0, 0], [0, 0, -0.03]], [[0.025, 0.012, 0], [0, 0.012, 0.025], [-0.025, 0.012, 0], [0, 0.012, -0.025]]]);
  }
  // nails
  ctx.albedo(IRON); ctx.color("oklch(0.25 0.01 40)"); ctx.metalness(0.6); ctx.roughness(0.6);
  for (const [x, y, , h] of notes) cbox(ctx, xf([x, y + h * 0.46, -0.03]), 0.018, 0.018, 0.02, 0.003);
  // lantern crook off the right post
  ctx.color("oklch(0.32 0.015 40)");
  tube(ctx, xf(), [[0.9, 2.1, 0.0], [0.95, 2.36, -0.15], [0.98, 2.33, -0.28]], 0.016, 5);
  lantern(ctx, xf([0.98, 2.33, -0.28]));
  // strongbox at the foot, chained to the left post
  ctx.albedo(WOOD); ctx.metalness(0); ctx.roughness(0.9); ctx.color("oklch(0.35 0.04 45)");
  cbox(ctx, xf([-0.55, 0, -0.35], [0, 12, 0]), 0.56, 0.36, 0.38, 0.02);
  ctx.albedo(IRON); ctx.metalness(0.6); ctx.roughness(0.55); ctx.color("oklch(0.3 0.015 45)");
  for (const dx of [-0.2, 0.2]) cbox(ctx, compose(xf([-0.55, 0, -0.35], [0, 12, 0]), xf([dx, 0, 0])), 0.05, 0.37, 0.39, 0.005);
  cbox(ctx, compose(xf([-0.55, 0, -0.35], [0, 12, 0]), xf([0, 0.2, -0.2])), 0.08, 0.1, 0.02, 0.005);
  if (fine) {
    const pts = []; for (let i = 0; i <= 8; i++) { const t = i / 8; pts.push([-0.78 + t * 0.0 - t * 0.02, 0.3 + t * 0.35 - Math.sin(t * Math.PI) * 0.1, -0.2 + t * 0.2]); }
    tube(ctx, xf(), pts, 0.012, 4);
  }
  // copper spill on the box lid
  ctx.color("oklch(0.6 0.12 55)"); ctx.metalness(0.9); ctx.roughness(0.35);
  for (let i = 0; i < 6; i++) loft(ctx, xf([-0.55 + rnd(ctx, -0.2, 0.2), 0.365, -0.35 + rnd(ctx, -0.12, 0.12)]), [rect(0.022, 0.022, 0.008, 0), rect(0.022, 0.022, 0.008, 0.006)]);
}
export function collider(ctx) { boxC(ctx, -0.95, 0.95, 0, 2.4, -0.1, 0.12); boxC(ctx, -0.85, -0.25, 0, 0.4, -0.55, -0.15); }
