// A hanged pilgrim, dipped in wax a century ago and still turning: rope from the hook (origin) to a
// knot under the ear, a slumped hood with a guttering candle stub on its crown, a robe drowned in
// yellowed wax with drips off every hem, bound wrists and bare toes. Hangs ~drop + 1.85 m below origin.
import { WAXC, TEX, xf, lathe, drip, candle, chainXf } from "./shapes.js";
import { tube as rtube } from "./hub-kit.js";
import { rope } from "./orch-kit.js";
export function geometry(ctx) {
  const L = ctx.lod ?? 1, R = () => ctx.random(), d = ctx.params.drop ?? 0.5, tilt = ctx.params.tilt ?? 22;
  const seg = L <= 2 ? 12 : 7, sway = (R() - 0.5) * 7;
  const B = xf([0, -d - 0.3, 0], R() * 50 - 25, sway * 0.4, sway);
  // rope, knot under the ear, collar round the neck
  const knot = B([0.09, 0.15, 0.03]);
  rope(ctx, [[0, 0, 0], [0.03, -d * 0.55, 0.01], knot], 0.024);
  rope(ctx, [B([0.09, 0.21, 0.03]), B([0.09, 0.07, 0.03])], 0.042, 6);
  { const pts = []; for (let j = 0; j <= 10; j++) { const a = (j / 10) * 6.283; pts.push(B([Math.cos(a) * 0.088, 0.03 + Math.cos(a) * 0.02, Math.sin(a) * 0.08])); } rope(ctx, pts, 0.02); }
  // robe
  ctx.albedo(TEX.wax); ctx.roughness(0.5); ctx.metalness(0); ctx.smooth(); ctx.color(WAXC[3]);
  lathe(ctx, chainXf(B, xf([0, 0, 0], 0, 0, 0, [1, 1, 0.82])),
    [[0, 0.02], [0.09, 0.01], [0.2, -0.06], [0.235, -0.16], [0.22, -0.45], [0.19, -0.72], [0.2, -0.95], [0.24, -1.18], [0.275, -1.32], [0.258, -1.37], [0.17, -1.34], [0, -1.32]], seg,
    { rj: (i, j) => (i >= 3 ? 1 + 0.08 * Math.sin(j * 2.7 + i * 1.3) : 1) });
  // shoulder cape of the hood
  ctx.color(WAXC[2]);
  lathe(ctx, chainXf(B, xf([0, 0, 0], 0, 0, 0, [1, 1, 0.86])), [[0.13, 0.08], [0.22, -0.02], [0.27, -0.16], [0.275, -0.27], [0.25, -0.3]], seg, { rj: (i, j) => 1 + 0.06 * Math.sin(j * 3.1 + i) });
  // slumped hood
  const H = chainXf(B, xf([0, 0.03, 0.01], 0, -32, tilt));
  ctx.color(WAXC[1]);
  lathe(ctx, H, [[0.11, 0], [0.15, 0.06], [0.162, 0.15], [0.142, 0.24], [0.09, 0.31], [0.035, 0.345], [0, 0.352]], seg, {});
  ctx.albedo(null); ctx.color("oklch(.13 .01 40)"); ctx.roughness(0.9);
  lathe(ctx, chainXf(H, xf([0, 0.14, -0.148], 0, -90, 0, [1, 1, 1.3])), [[0.078, 0], [0.055, 0.014], [0, 0.022]], 9, {});
  // candle on the crown, its wax running down the hood
  const top = H([0, 0.35, 0]);
  ctx.albedo(TEX.wax); ctx.roughness(0.5);
  candle(ctx, top[0], top[1] - 0.012, top[2], 0.036, 0.1 + R() * 0.05, true, 6);
  ctx.albedo(TEX.wax);
  for (let i = 0; i < (L <= 2 ? 5 : 2); i++) { const a = R() * 6.283, p = H([Math.cos(a) * 0.09, 0.31, Math.sin(a) * 0.09]); ctx.color(WAXC[i % 3]); drip(ctx, p[0], p[1], p[2], 0.08 + R() * 0.16, 0.02 + R() * 0.012, 5); }
  // slack arms, bound wrists
  ctx.color(WAXC[2]); ctx.smooth();
  for (const s of [-1, 1]) {
    rtube(ctx, B, [[s * 0.2, -0.07, 0], [s * 0.25, -0.38, -0.02], [s * 0.14, -0.66, -0.13], [s * 0.05, -0.74, -0.16]], [0.07, 0.066, 0.058, 0.05], L <= 2 ? 7 : 5);
    ctx.color(WAXC[0]);
    const hp = B([s * 0.045, -0.78, -0.165]);
    lathe(ctx, xf([hp[0], hp[1] - 0.04, hp[2]]), [[0, 0], [0.035, 0.012], [0.045, 0.04], [0.032, 0.07], [0, 0.08]], 7, {});
    rtube(ctx, B, [[s * 0.075, -1.27, 0.0], [s * 0.075, -1.46, -0.02], [s * 0.08, -1.52, -0.075]], [0.048, 0.042, 0.03], 6);
    ctx.color(WAXC[2]);
  }
  rope(ctx, [B([-0.095, -0.73, -0.155]), B([0, -0.71, -0.2]), B([0.095, -0.73, -0.155])], 0.02);
  // wax running off the hem and sleeves
  ctx.albedo(TEX.wax); ctx.roughness(0.5); ctx.smooth();
  const nh = L <= 2 ? 11 : 4;
  for (let i = 0; i < nh; i++) { const a = (i / nh) * 6.283 + R() * 0.4, p = B([Math.cos(a) * 0.262, -1.31, Math.sin(a) * 0.22]); ctx.color(WAXC[(i + 1) % 4]); drip(ctx, p[0], p[1], p[2], 0.1 + R() * 0.3, 0.025 + R() * 0.02, L <= 2 ? 6 : 4); }
  if (L <= 2) for (const s of [-1, 1]) { const p = B([s * 0.25, -0.42, 0]); ctx.color(WAXC[1]); drip(ctx, p[0], p[1], p[2], 0.12 + R() * 0.15, 0.025, 5); }
}
export function collider() { return null; }
