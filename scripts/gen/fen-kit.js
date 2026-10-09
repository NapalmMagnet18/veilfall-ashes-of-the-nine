// Lanternmere modelling kit: reeds, pads, dead shrubs, hanging moss, slabs and boardwalk runs, shared by
// every scripts/gen/fen-*.js piece. Builds on vf-kit's transform stack (K) and seeded rng (r).
import { V } from "./vf-kit.js";
export const D = Math.PI / 180;
export const TX = {
  stone: "cdn/texture-wet-dark-weathered-stone-blocks.png",
  wood: "/cdn/value.fd7f44461fb4757d95a177f1a9112b573154f57737f844a4558b4b32e21521ae.png",
  iron: "/cdn/value.fc2d6f2f81f6d5fa8b807c3778839023b0680cf71709aafbaf66806426b4a17c.png",
  moss: "cdn/texture-dark-wet-moss.png",
  bark: "cdn/texture-dead-grey-tree-bark.png",
  mud: "cdn/texture-black-wet-peat-mud.png",
  wax: "/cdn/value.627b7a8789f6aba4b1057abb947848ac429517d5c496ae62d307c93eda8c8f8a.png",
};
export const STONE = ["oklch(.8 .01 240)", "oklch(.74 .012 230)", "oklch(.84 .01 80)", "oklch(.7 .015 220)"];
export const PLANK = ["oklch(.72 .04 65)", "oklch(.64 .035 60)", "oklch(.78 .03 75)"];
export const REED = ["oklch(.66 .07 85)", "oklch(.6 .065 78)", "oklch(.52 .06 108)", "oklch(.46 .05 122)"];
export const WAX = ["oklch(.82 .04 85)", "oklch(.74 .05 80)", "oklch(.66 .06 72)"];
// distance from (x,z) to a polyline
export function polyDist(x, z, pts) {
  let d = Infinity;
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, az] = pts[i], [bx, bz] = pts[i + 1], vx = bx - ax, vz = bz - az, wx = x - ax, wz = z - az;
    const t = Math.max(0, Math.min(1, (wx * vx + wz * vz) / (vx * vx + vz * vz || 1)));
    d = Math.min(d, Math.hypot(wx - vx * t, wz - vz * t));
  }
  return d;
}
// a flat irregular patch facing up (moss, mud, lichen)
export function blob(K, r, x, y, z, rx, rz, n = 8) {
  const ph = r() * 6.283, R = [];
  for (let i = 0; i < n; i++) { const a = ph + (i / n) * 6.283, j = 0.7 + r() * 0.5; R.push([x + Math.cos(a) * rx * j, y, z + Math.sin(a) * rz * j]); }
  for (let i = 0; i < n; i++) K.tr([x, y, z], R[(i + 1) % n], R[i]);
}
// a clump of curved reed blades, a few with cattail heads
export function reeds(ctx, K, r, x, z, n, h, y0 = 0.05) {
  ctx.albedo(null); ctx.roughness(0.85); ctx.metalness(0);
  for (let i = 0; i < n; i++) {
    const a = r() * 6.283, d = r() * 0.32, bx = x + Math.cos(a) * d, bz = z + Math.sin(a) * d;
    const hh = h * (0.5 + r() * 0.6), lean = 0.12 + r() * 0.4, la = a + (r() - 0.5) * 1.2;
    const tx = bx + Math.cos(la) * lean * hh, tz = bz + Math.sin(la) * lean * hh, ty = y0 + hh * (1 - lean * 0.25);
    const mx = bx + (tx - bx) * 0.28, mz = bz + (tz - bz) * 0.28, my = y0 + hh * 0.55;
    const w = 0.016 + r() * 0.018, pa = la + Math.PI / 2, px = Math.cos(pa) * w, pz = Math.sin(pa) * w;
    ctx.color(REED[Math.floor(r() * REED.length)]);
    K.q([bx - px, y0, bz - pz], [bx + px, y0, bz + pz], [mx + px * 0.7, my, mz + pz * 0.7], [mx - px * 0.7, my, mz - pz * 0.7]);
    K.tr([mx - px * 0.7, my, mz - pz * 0.7], [mx + px * 0.7, my, mz + pz * 0.7], [tx, ty, tz]);
    if (r() < 0.12) { ctx.color("oklch(.42 .05 50)"); K.tube([mx, my + 0.05, mz], [mx + (tx - mx) * 0.15, my + 0.24, mz + (tz - mz) * 0.15], 0.024, 0.02, 5, true); }
  }
}
// a floating pad with its notch, sometimes a pale flower
export function pad(ctx, K, r, x, y, z, rad) {
  ctx.albedo(null); ctx.roughness(0.35);
  ctx.color(r() < 0.5 ? "oklch(.5 .08 138)" : "oklch(.42 .06 122)");
  const n = 9, notch = r() * 6.283;
  for (let i = 0; i < n; i++) {
    const a0 = notch + 0.3 + (i / n) * (6.283 - 0.6), a1 = notch + 0.3 + ((i + 1) / n) * (6.283 - 0.6);
    K.tr([x, y, z], [x + Math.cos(a1) * rad, y, z + Math.sin(a1) * rad], [x + Math.cos(a0) * rad, y, z + Math.sin(a0) * rad]);
  }
  if (r() < 0.2) {
    ctx.color("oklch(.9 .03 90)");
    for (let k = 0; k < 5; k++) { const a = (k / 5) * 6.283; K.tr([x, y + 0.01, z], [x + Math.cos(a - 0.3) * 0.07, y + 0.06, z + Math.sin(a - 0.3) * 0.07], [x + Math.cos(a + 0.3) * 0.07, y + 0.06, z + Math.sin(a + 0.3) * 0.07]); }
  }
}
// a dead thorn shrub: forked grey twigs
export function shrub(ctx, K, r, x, z, h) {
  ctx.albedo(TX.bark); ctx.color("oklch(.58 .015 70)"); ctx.roughness(0.95);
  const br = (p, d, len, rad, dep) => {
    const e = V.add(p, V.mul(d, len)); K.tube(p, e, rad, rad * 0.6, 4);
    if (dep > 0) for (let i = 0; i < 2; i++) br(e, V.norm([d[0] + (r() - 0.5) * 1.4, d[1] + r() * 0.2, d[2] + (r() - 0.5) * 1.4]), len * 0.62, rad * 0.6, dep - 1);
  };
  for (let i = 0; i < 4; i++) { const a = r() * 6.283; br([x, -0.05, z], V.norm([Math.cos(a) * 0.55, 1, Math.sin(a) * 0.55]), h * 0.45, 0.028, 2); }
  ctx.albedo(null);
}
// a strand of hanging grey moss from p, swaying down `len`
export function strand(K, r, p, len, w) {
  const a = r() * 6.283, ux = Math.cos(a), uz = Math.sin(a);
  let [x, y, z] = p, ww = w;
  for (let s = 0; s < 3; s++) {
    const nx = x + (r() - 0.5) * 0.12, nz = z + (r() - 0.5) * 0.12, ny = y - len / 3, nw = s === 2 ? 0 : ww * 0.65;
    if (nw > 0) K.q([x - ux * ww, y, z - uz * ww], [x + ux * ww, y, z + uz * ww], [nx + ux * nw, ny, nz + uz * nw], [nx - ux * nw, ny, nz - uz * nw]);
    else K.tr([x - ux * ww, y, z - uz * ww], [x + ux * ww, y, z + uz * ww], [nx, ny, nz]);
    x = nx; y = ny; z = nz; ww = nw;
  }
}
// rotted boardwalk along a polyline (local x,z), plank tops at `top`
export function plankRun(ctx, K, r, pts, w, top, L = 1) {
  ctx.flat();
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, az] = pts[i], [bx, bz] = pts[i + 1], dx = bx - ax, dz = bz - az, len = Math.hypot(dx, dz);
    K.push().t(ax, 0, az).ry(Math.atan2(-dz, dx) / D);
    ctx.albedo(TX.wood); ctx.roughness(0.9); ctx.metalness(0); ctx.color("oklch(.55 .03 60)");
    for (const s of [-1, 1]) K.bb(-0.1, top - 0.17, s * w * 0.36 - 0.06, len + 0.1, top - 0.06, s * w * 0.36 + 0.06);
    if (L <= 3) for (let x = 0; x <= len + 0.01; x += 1.7) for (const s of [-1, 1]) {
      const ph = r() < 0.4 ? r() * 0.4 : 0;
      K.push().t(x, 0, s * (w * 0.5 + 0.03)).rz((r() - 0.5) * 12).rx((r() - 0.5) * 12); K.cyl(0, -0.3, 0, 0.07, 0.055, top + 0.3 + ph, 6); K.pop();
    }
    for (let x = 0.14; x < len; x += 0.29) {
      if (r() < 0.09) continue;
      ctx.color(PLANK[Math.floor(r() * PLANK.length)]);
      const broken = r() < 0.13, wl = broken ? w * (0.4 + r() * 0.3) : w * (0.94 + r() * 0.1), zo = broken ? (r() < 0.5 ? -1 : 1) * (w - wl) / 2 : (r() - 0.5) * 0.1;
      K.push().t(x, top - 0.05 - (broken ? r() * 0.07 : 0), zo).ry((r() - 0.5) * 6).rx((r() - 0.5) * (broken ? 16 : 3));
      if (L <= 2) K.cbox(0, 0, 0, 0.25, 0.05, wl, 0.015); else K.box(0, 0, 0, 0.25, 0.05, wl);
      K.pop();
    }
    K.pop();
  }
}
// mossy stone stepping-slabs along a polyline, tops near `top`
export function slabRun(ctx, K, r, pts, w, top, L = 1) {
  ctx.flat();
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, az] = pts[i], [bx, bz] = pts[i + 1], dx = bx - ax, dz = bz - az, len = Math.hypot(dx, dz);
    K.push().t(ax, 0, az).ry(Math.atan2(-dz, dx) / D);
    for (let x = 0.35; x < len + 0.2; x += 0.92 + r() * 0.22) {
      const sx = 0.72 + r() * 0.22, sz = w * (0.75 + r() * 0.3), tp = top + (r() - 0.5) * 0.06;
      K.push().t(x, 0, (r() - 0.5) * 0.22).ry((r() - 0.5) * 16).rx((r() - 0.5) * 5).rz((r() - 0.5) * 5);
      ctx.albedo(TX.stone); ctx.roughness(0.45); ctx.metalness(0); ctx.color(STONE[Math.floor(r() * STONE.length)]);
      if (L <= 2) K.cbox(0, -0.3, 0, sx, tp + 0.3, sz, 0.06); else K.box(0, -0.3, 0, sx, tp + 0.3, sz);
      if (L <= 3 && r() < 0.65) { ctx.albedo(TX.moss); ctx.color("oklch(.64 .08 132)"); ctx.roughness(0.9); blob(K, r, (r() - 0.5) * sx * 0.3, tp + 0.006, (r() - 0.5) * sz * 0.3, sx * (0.22 + r() * 0.18), sz * (0.22 + r() * 0.18)); }
      K.pop();
    }
    K.pop();
  }
}
