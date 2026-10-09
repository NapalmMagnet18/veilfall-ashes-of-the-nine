// Floor wear of the burned nave and the bell crypt, walkable, no collider. params.kind:
//  "ash"   { rx, rz }  a low drift of wood ash and cinders with charcoal lumps, a few still glowing
//  "wax"   { rx, rz }  a spill of old wax in honey and soot-grey lobes, runnels toward the low side
//  "slabs" { w, d, glow } cracked floor slabs heaved and split, some gone; glow > 0 lays the crypt's cold
//          teal memory-light under the cracks. Origin at the floor, centred.
import { TEX, WAXC, xf, bevelBox, puddle } from "./shapes.js";
function sheet(ctx, rx, rz, H, rings, seg, ph, y0) {
  const S = (t, a) => { const e = 1 + 0.2 * Math.sin(a * 3 + ph) + 0.1 * Math.sin(a * 7 + ph * 2); return [Math.cos(a) * rx * t * e, y0 + H * (1 - t * t) * (1 + 0.3 * Math.sin(a * 5 + t * 9 + ph)), Math.sin(a) * rz * t * e]; };
  for (let i = 0; i < rings; i++) for (let j = 0; j < seg; j++) {
    const a0 = (j / seg) * 6.283, a1 = ((j + 1) / seg) * 6.283, q = [S(i / rings, a0), S(i / rings, a1), S((i + 1) / rings, a1), S((i + 1) / rings, a0)];
    ctx.tri(...q[0], ...q[2], ...q[1]); ctx.tri(...q[0], ...q[3], ...q[2]);
  }
}
function ash(ctx) {
  const L = ctx.lod, R = () => ctx.random(), { rx = 1.6, rz = 1.1 } = ctx.params;
  ctx.smooth(); ctx.albedo("cdn/texture-grey-wood-ash-and-cinders.png"); ctx.roughness(1); ctx.metalness(0); ctx.color("oklch(.82 .005 260)");
  sheet(ctx, rx, rz, 0.12, L <= 2 ? 4 : 2, L <= 2 ? 18 : 9, R() * 9, -0.04);
  if (L <= 3) { ctx.flat(); ctx.albedo("/cdn/value.414c2c1b0fe4dbe53debfcc837425ae523180a39b96734c16354eeefe4b1a925.png");
    for (let i = 0; i < (L <= 2 ? 14 : 5); i++) {
      const a = R() * 6.283, t = Math.sqrt(R()) * 0.85, s = 0.04 + R() * 0.09; ctx.color("oklch(.62 .02 45)");
      const lit = R() < 0.15; if (lit) ctx.emissive(1.4, 0.35, 0.05);
      bevelBox(ctx, xf([Math.cos(a) * rx * t, 0.06 * (1 - t * t), Math.sin(a) * rz * t], R() * 360, R() * 40, R() * 40), s * 1.6, s * 0.6, s, 0);
      if (lit) ctx.emissive(null);
    } }
}
function wax(ctx) {
  const L = ctx.lod, R = () => ctx.random(), { rx = 1.2, rz = 0.9 } = ctx.params;
  ctx.smooth(); ctx.albedo(TEX.wax); ctx.roughness(0.45); ctx.metalness(0);
  ctx.color("oklch(.48 .015 70)"); puddle(ctx, 0, -0.008, 0, rx * 1.1, rz * 1.1, 0.008, false, L <= 2 ? 18 : 10);
  for (let i = 0; i < (L <= 2 ? 5 : 2); i++) { ctx.color(WAXC[i % 5]); const a = R() * 6.283, d = R() * 0.5; puddle(ctx, Math.cos(a) * rx * d, 0.002 * i, Math.sin(a) * rz * d, rx * (0.3 + R() * 0.35), rz * (0.3 + R() * 0.35), 0.018, false, L <= 2 ? 14 : 8); }
  for (let i = 0; i < (L <= 2 ? 3 : 1); i++) { ctx.color(WAXC[2 + (i % 3)]); const a = R() * 6.283, l = 0.5 + R() * 0.8; puddle(ctx, Math.cos(a) * (rx + l * 0.4), 0.004, Math.sin(a) * (rz + l * 0.4), Math.abs(Math.cos(a)) * l * 0.5 + 0.08, Math.abs(Math.sin(a)) * l * 0.5 + 0.08, 0.01, false, 10); }
}
function slabs(ctx) {
  const L = ctx.lod, R = () => ctx.random(), { w = 3, d = 2.4, glow = 0 } = ctx.params;
  if (glow > 0) { ctx.flat(); ctx.albedo(null); ctx.color("oklch(.3 .04 200)"); ctx.emissive(0.12 * glow, 0.55 * glow, 0.62 * glow); ctx.quad(-w / 2, -0.03, -d / 2, -w / 2, -0.03, d / 2, w / 2, -0.03, d / 2, w / 2, -0.03, -d / 2); ctx.emissive(null); }
  ctx.flat(); ctx.albedo(TEX.stone); ctx.roughness(0.6); ctx.metalness(0.05);
  const nx = Math.max(1, Math.round(w / 1.05)), nz = Math.max(1, Math.round(d / 0.9)), cw = w / nx, cd = d / nz;
  for (let i = 0; i < nx; i++) for (let k = 0; k < nz; k++) {
    if (R() < 0.12) continue;
    const cx = -w / 2 + cw * (i + 0.5) + (k % 2 ? cw * 0.25 : 0), cz = -d / 2 + cd * (k + 0.5);
    if (Math.abs(cx) > w / 2 - cw * 0.3) continue;
    ctx.color(`oklch(${(0.66 + R() * 0.24).toFixed(2)} .012 ${R() < 0.7 ? 250 : 60})`);
    const tilt = R() < 0.35 ? 1 : 0.15, pieces = L <= 2 && R() < 0.4 ? 2 : 1;
    for (let p = 0; p < pieces; p++) {
      const hw = pieces === 2 ? cw / 4 - 0.02 : cw / 2 - 0.03, ox = pieces === 2 ? (p - 0.5) * cw / 2 : 0, sink = R() * 0.05 * tilt;
      bevelBox(ctx, xf([cx + ox, -0.06 - sink, cz], (R() - 0.5) * 6 * tilt, (R() - 0.5) * 7 * tilt, (R() - 0.5) * 7 * tilt), hw, 0.1, cd / 2 - 0.03, L <= 2 ? 0.015 : 0);
    }
  }
}
export function geometry(ctx) { const k = ctx.params.kind ?? "ash"; if (k === "slabs") slabs(ctx); else if (k === "wax") wax(ctx); else ash(ctx); }
export function collider() { return null; }
