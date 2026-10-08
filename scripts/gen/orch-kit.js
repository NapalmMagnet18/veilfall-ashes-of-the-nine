// Gallows Orchard kit: hemp rope, frayed ends, open nooses, rotten wax apples and a perched crow.
// Pure geometry on top of shapes.js / hub-kit.js; every point is already in the caller's frame.
import { TEX, WAXC, xf, lathe, drip, quad } from "./shapes.js";
import { tube as rtube, I } from "./hub-kit.js";
export const ROPE = "cdn/texture-frayed-old-hemp-rope.png";
export const BARK = "cdn/texture-blackened-dead-apple-tree-bark.png";
export const ASH = "cdn/texture-packed-grey-ash-dirt-path.png";
export const ropeTex = (ctx) => { ctx.albedo(ROPE); ctx.color("oklch(.8 .04 70)"); ctx.roughness(1); ctx.metalness(0); ctx.flat(); };
export function rope(ctx, pts, r = 0.022, n = 5) { ropeTex(ctx); rtube(ctx, I, pts, r, n); }
export function fray(ctx, p, n = 6, len = 0.13) {
  ropeTex(ctx);
  for (let i = 0; i < n; i++) {
    const a = ctx.random() * 6.283, s = 0.25 + ctx.random() * 0.6, l = len * (0.6 + ctx.random() * 0.8);
    rtube(ctx, I, [p, [p[0] + Math.cos(a) * s * l, p[1] - l, p[2] + Math.sin(a) * s * l]], [0.008, 0.002], 3);
  }
}
// rope from top falling `drop`, a wound knot, then an open loop hanging under it
export function noose(ctx, top, drop, R = 0.14, n = 5) {
  const k = [top[0], top[1] - drop, top[2]];
  rope(ctx, [top, [k[0], k[1] + 0.02, k[2]]], 0.022, n);
  for (let i = 0; i < 6; i++) rtube(ctx, I, [[k[0], k[1] - i * 0.028, k[2]], [k[0], k[1] - i * 0.028 - 0.026, k[2]]], 0.036, 7);
  const c = [k[0], k[1] - 0.17 - R, k[2]], yw = ctx.random() * 3, pts = [];
  for (let j = 0; j <= 14; j++) { const t = (j / 14) * 6.283; pts.push([c[0] + Math.sin(t) * Math.cos(yw) * R, c[1] + Math.cos(t) * R * 1.15, c[2] + Math.sin(t) * Math.sin(yw) * R]); }
  rtube(ctx, I, pts, 0.019, n, false, false);
}
// a rotten apple gone to wax, on a short twist of stalk below p
export function waxApple(ctx, p, s, len) {
  const q = [p[0] + (ctx.random() - 0.5) * 0.04, p[1] - len, p[2] + (ctx.random() - 0.5) * 0.04];
  ctx.albedo(BARK); ctx.color("oklch(.85 .01 60)"); ctx.roughness(1); ctx.metalness(0); ctx.flat();
  rtube(ctx, I, [p, q], [0.012, 0.007], 4);
  ctx.albedo(TEX.wax); ctx.roughness(0.55); ctx.smooth(); ctx.color(WAXC[3 + Math.floor(ctx.random() * 2)]);
  const ph = ctx.random() * 9;
  lathe(ctx, xf([q[0], q[1] - s * 0.95, q[2]]), [[0, 0], [s * 0.55, s * 0.08], [s * 0.95, s * 0.42], [s * 0.92, s * 0.8], [s * 0.45, s * 1.0], [s * 0.15, s * 0.92], [0, s * 0.96]], 9,
    { rj: (i, j) => 1 + 0.16 * Math.sin(j * 1.9 + i * 2.3 + ph), localRef: true });
  if (ctx.random() < 0.6) { ctx.color(WAXC[2]); drip(ctx, q[0], q[1] - s * 0.9, q[2], 0.06 + ctx.random() * 0.12, s * 0.35, 5); }
}
// a crow perched at T's origin (its feet), facing local -Z, ~0.45 m long
export function crow(ctx, T, lod = 1) {
  const C = (B) => (p) => T(B(p));
  ctx.albedo(null); ctx.color("oklch(.26 .015 270)"); ctx.roughness(0.38); ctx.metalness(0.15); ctx.smooth();
  lathe(ctx, C(xf([0, 0.08, 0.13], 0, -68)), [[0, 0], [0.045, 0.02], [0.074, 0.09], [0.084, 0.16], [0.07, 0.23], [0.046, 0.28], [0, 0.305]], lod <= 2 ? 10 : 6, {});
  lathe(ctx, C(xf([0, 0.185, -0.16])), [[0, 0], [0.036, 0.012], [0.05, 0.05], [0.038, 0.086], [0, 0.1]], lod <= 2 ? 9 : 5, {});
  ctx.color("oklch(.2 .01 60)");
  lathe(ctx, C(xf([0, 0.232, -0.2], 0, -100)), [[0.022, 0], [0.013, 0.04], [0, 0.078]], 5, {});
  ctx.color("oklch(.24 .015 270)"); ctx.flat();
  const ref = T([0, 0.16, 0.02]);
  quad(ctx, T([-0.03, 0.1, 0.1]), T([0.03, 0.1, 0.1]), T([0.07, 0.03, 0.33]), T([-0.07, 0.03, 0.33]), T([0, 0.3, 0.2]));
  for (const s of [-1, 1]) {
    quad(ctx, T([s * 0.072, 0.2, -0.08]), T([s * 0.088, 0.16, 0.07]), T([s * 0.05, 0.085, 0.29]), T([s * 0.082, 0.085, 0.02]), ref);
    if (lod <= 2) {
      ctx.color("oklch(.3 .02 70)");
      rtube(ctx, T, [[s * 0.025, 0.09, 0.01], [s * 0.03, 0.0, -0.005]], 0.007, 4);
      for (const a of [-0.5, 0, 0.5]) rtube(ctx, T, [[s * 0.03, 0.004, -0.005], [s * 0.03 + Math.sin(a) * 0.04, 0.004, -0.005 - Math.cos(a) * 0.04]], 0.005, 3);
      ctx.color("oklch(.24 .015 270)");
    }
  }
}
