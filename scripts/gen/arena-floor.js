// The Bailiff's arena floor dressing, all flat: the dark wax stain (r ~3) at the centre with spatter,
// and a ring of pooled old wax at r 14..16 joining the pillars, open at the south gate (params.gap deg).
import { TEX, WAXC, quad, candleBed, puddle } from "./shapes.js";
export function geometry(ctx) {
  const L = ctx.lod, R = () => ctx.random(), gap = ctx.params.gap ?? 26;
  // stain: polar grid draped on the ground
  const seg = L <= 2 ? 40 : 20, rings = [0, 0.3, 0.6, 0.85, 1];
  const ph = R() * 9, rad = (a) => 3 * (1 + 0.1 * Math.sin(a * 3 + ph) + 0.06 * Math.sin(a * 7 + ph * 2) + 0.04 * Math.sin(a * 13));
  const P = (i, j, lift) => { const a = (j / seg) * 6.283, r = rad(a) * rings[i]; const x = Math.cos(a) * r, z = Math.sin(a) * r; return [x, ctx.groundY(x, z) + lift, z]; };
  ctx.smooth(); ctx.albedo(null); ctx.metalness(0); ctx.roughness(0.28); ctx.color("oklch(.2 .035 40)");
  for (let i = 0; i < rings.length - 1; i++) for (let j = 0; j < seg; j++) quad(ctx, P(i, j, 0.03), P(i, (j + 1) % seg, 0.03), P(i + 1, (j + 1) % seg, 0.03), P(i + 1, j, 0.03), [0, -5, 0]);
  ctx.color("oklch(.16 .04 35)");
  for (let i = 0; i < (L <= 2 ? 26 : 8); i++) { const a = R() * 6.283, r = 2.6 + R() * 3.4, s = 0.12 + R() * 0.4 * (1 - (r - 2.6) / 4); puddle(ctx, Math.cos(a) * r, 0, Math.sin(a) * r, s * (1 + R()), s, 0.01, true, 8); }
  // the wax ring
  const st = L <= 2 ? 2 : 5, south = 90; // local angle 90 deg = +Z (the gate side)
  ctx.albedo(TEX.wax); ctx.roughness(0.5);
  for (let d = 0; d < 360; d += st) {
    const a0 = d, a1 = d + st;
    if (Math.abs(((a0 + st / 2 - south + 540) % 360) - 180) < gap) continue;
    const pt = (a, k) => { const ar = a * Math.PI / 180, w = 0.75 + 0.55 * Math.sin(ar * 5 + ph) + 0.3 * Math.sin(ar * 11);
      const r = 15 + (k - 1) * Math.max(0.25, w), x = Math.cos(ar) * r, z = Math.sin(ar) * r; return [x, ctx.groundY(x, z) + (k === 1 ? 0.07 : 0.015), z]; };
    ctx.color(WAXC[(d / st) % 3 === 0 ? 2 : 1]);
    quad(ctx, pt(a0, 0), pt(a1, 0), pt(a1, 1), pt(a0, 1), [0, -5, 0]);
    quad(ctx, pt(a0, 1), pt(a1, 1), pt(a1, 2), pt(a0, 2), [0, -5, 0]);
  }
  // pooled blobs with stubs between the pillars (outside r 13.5)
  if (L <= 3) for (const deg of ctx.params.pools ?? []) {
    const ar = deg * Math.PI / 180, x = Math.cos(ar) * 15.1, z = Math.sin(ar) * 15.1;
    ctx.color(WAXC[3]); puddle(ctx, x, 0, z, 1.3, 1.3, 0.09, true, 18);
    if (L <= 2) candleBed(ctx, x, 0, z, 0.9, 0.9, L === 1 ? 16 : 7, { ground: true, lit: 0.2, puddle: false, hMax: 0.3, rMax: 0.07 });
  }
}
export function collider() { return null; }
