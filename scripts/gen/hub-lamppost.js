// A wayside lantern post, gothic ironwork: a stepped carved plinth with corner spurs, moss in its joint and old
// wax run down its step; a fluted iron post with riveted collars and a spiked crown; a curled scroll arm, a chain,
// and the hanging lantern (glass centre at FLAME_AT, unchanged so every light row still lines up).
import { xf, compose, cbox, tube, loft, ringH, rock, lantern, candle, rnd, IRON, STONE } from "./hub-kit.js";
export const FLAME_AT = [0.55, 2.13, 0];
export function geometry(ctx) {
  const lod = ctx.lod ?? 1, fine = lod <= 2, hi = lod <= 1, T = xf(), seg = hi ? 12 : fine ? 8 : 6;
  ctx.flat(); ctx.roughness(0.9);
  // the plinth: a wide foot, a chamfered drum, a cap with a drip moulding
  ctx.albedo(STONE); ctx.color("oklch(0.74 0.012 250)");
  cbox(ctx, T, 0.7, 0.18, 0.7, 0.04);
  ctx.color("oklch(0.8 0.01 250)");
  cbox(ctx, xf([0, 0.18, 0]), 0.54, 0.22, 0.54, 0.05);
  cbox(ctx, xf([0, 0.4, 0]), 0.6, 0.06, 0.6, 0.02);
  if (fine) for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) { // corner spurs: little stone claws at the foot
    loft(ctx, xf([sx * 0.3, 0.18, sz * 0.3], [Math.atan2(sx, sz) * 57.3, 0, 0]), [ringH(0, 0, 0, 0.07, 0.07, 4), ringH(0, 0.12, -0.03, 0.035, 0.035, 4), ringH(0, 0.2, -0.06, 0.004, 0.004, 4)], false, true);
  }
  // moss in the joint and on the north face
  ctx.albedo("cdn/texture-damp-dark-moss.png"); ctx.color("oklch(0.75 0.06 135)");
  for (let i = 0; i < (hi ? 6 : fine ? 4 : 2); i++) { const a = i * 1.1 + 0.4; rock(ctx, xf([Math.cos(a) * 0.33, 0.17, Math.sin(a) * 0.33]), rnd(ctx, 0.06, 0.11), { sy: 0.35, sx: 1.6, rough: 0.5 }); }
  for (let i = 0; i < (fine ? 3 : 1); i++) { const a = i * 2.1; rock(ctx, xf([Math.cos(a) * 0.42, 0, Math.sin(a) * 0.42]), rnd(ctx, 0.1, 0.15), { sy: 0.4, sx: 1.5, rough: 0.5 }); }
  // old pilgrim wax on the step
  if (fine) { ctx.albedo(null); for (let i = 0; i < (hi ? 3 : 2); i++) { const a = 0.6 + i * 0.5; candle(ctx, T, [Math.cos(a) * 0.24, 0.4, Math.sin(a) * 0.24 + 0.05, 0.04 + i * 0.03], hi); } }
  // the post: fluted (a ring with ribs), tapering, set in a socket
  ctx.albedo(IRON); ctx.color("oklch(0.5 0.012 250)"); ctx.metalness(0.65); ctx.roughness(0.55);
  loft(ctx, T, [ringH(0, 0.46, 0, 0.1, 0.1, seg), ringH(0, 0.58, 0, 0.085, 0.085, seg), ringH(0, 0.62, 0, 0.065, 0.065, seg)], true, false);
  const flute = (y, r) => { const ring = []; const n = hi ? 16 : 8; for (let j = 0; j < n; j++) { const a = (j / n) * Math.PI * 2, k = j % 2 ? 0.86 : 1; ring.push([Math.cos(a) * r * k, y, -Math.sin(a) * r * k]); } return ring; };
  loft(ctx, T, [flute(0.62, 0.06), flute(1.6, 0.052), flute(2.75, 0.044)], false, false);
  ctx.color("oklch(0.58 0.012 250)");
  for (const [y, r] of [[0.66, 0.078], [1.85, 0.072], [2.48, 0.07]]) {
    tube(ctx, T, [[0, y, 0], [0, y + 0.07, 0]], r, seg);
    if (fine) for (let j = 0; j < 4; j++) { const a = j * Math.PI / 2 + 0.4; cbox(ctx, xf([Math.cos(a) * r, y + 0.02, -Math.sin(a) * r]), 0.022, 0.022, 0.022, 0.006); } // rivets
  }
  // the crown: a cupped collar and four spikes round a central finial
  loft(ctx, T, [ringH(0, 2.75, 0, 0.05, 0.05, seg), ringH(0, 2.8, 0, 0.1, 0.1, seg), ringH(0, 2.84, 0, 0.08, 0.08, seg)], false, true);
  tube(ctx, T, [[0, 2.82, 0], [0, 3.12, 0]], [0.026, 0.004], 6);
  if (fine) for (let j = 0; j < 4; j++) { const a = j * Math.PI / 2 + Math.PI / 4, c = Math.cos(a) * 0.08, s = -Math.sin(a) * 0.08; tube(ctx, T, [[c, 2.82, s], [c * 1.3, 2.92, s * 1.3], [c * 1.15, 3.0, s * 1.15]], [0.014, 0.008, 0.002], 4); }
  // the arm: a main bar out to +X, a scroll curling under it, a brace back to the post
  tube(ctx, T, [[0, 2.55, 0], [0.25, 2.66, 0], [0.55, 2.62, 0], [0.62, 2.55, 0], [0.6, 2.5, 0]], [0.03, 0.027, 0.023, 0.02, 0.018], hi ? 8 : 5);
  const scroll = []; for (let k = 0; k <= (hi ? 18 : 9); k++) { const t = k / (hi ? 18 : 9), a = t * Math.PI * 2.4, rr = 0.13 * (1 - t * 0.75); scroll.push([0.2 + Math.cos(a) * rr * 0.9 + t * 0.12, 2.42 + Math.sin(a) * rr, 0]); }
  if (fine) tube(ctx, T, scroll, scroll.map((_, k) => 0.014 * (1 - (k / (scroll.length - 1)) * 0.5)), 4, false, true);
  tube(ctx, T, [[0, 2.15, 0], [0.18, 2.38, 0], [0.34, 2.62, 0]], 0.015, 4);
  // the chain: alternating links from the arm tip down to the lantern ring
  const links = hi ? 5 : fine ? 3 : 0;
  for (let k = 0; k < links; k++) { const y = 2.5 - k * (0.1 / Math.max(1, links / 2)) * (links > 3 ? 1 : 2) , rot = k % 2 ? 90 : 0; loft(ctx, xf([0.55, y, 0], [rot, 0, 90]), [ringH(0, -0.008, 0, 0.022, 0.012, 6), ringH(0, 0.008, 0, 0.022, 0.012, 6)], false, false); }
  if (!links) tube(ctx, T, [[0.55, 2.5, 0], [0.55, 2.4, 0]], 0.01, 4);
  lantern(ctx, xf([0.55, 2.4, 0], [0, 0, 0], 1.3));
}
export function collider(ctx) { cbox(ctx, xf(), 0.62, 2.8, 0.62, 0.01); }
