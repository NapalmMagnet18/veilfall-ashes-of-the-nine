// The Lanternmere's rim and shallows: mud banks, reed beds, floating pads, drowned pilgrim lantern-staves
// and half-sunk carts. Origin at the mere's centre (y 0); params: { r, mouth (deg), avoid: [[x,z,rad]],
// segs (the causeway's), carts: [[x,z,yaw]], seed }. Wade-through: no collider.
import { kit, rng, lantern } from "./vf-kit.js";
import { D, TX, WAX, polyDist, reeds, pad } from "./fen-kit.js";
const MUD = ["oklch(.55 .02 60)", "oklch(.48 .025 55)", "oklch(.6 .02 70)"];
export function geometry(ctx) {
  const p = ctx.params, L = ctx.lod, K = kit(ctx), r = rng(p.seed ?? 5), R = p.r ?? 19.5, avoid = p.avoid ?? [], segs = p.segs ?? [];
  const mouth = (p.mouth ?? 23) * D;
  const angOff = (a) => Math.abs(((a - mouth + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
  const ok = (x, z, pd = 0) => {
    for (const [ax, az, ar] of avoid) if (Math.hypot(x - ax, z - az) < ar + pd) return false;
    for (const s of segs) if (polyDist(x, z, s.pts) < (s.w ?? 1.6) / 2 + 0.5 + pd) return false;
    return true;
  };
  ctx.flat();
  // mud banks heaped round the rim
  ctx.albedo(TX.mud); ctx.roughness(0.22); ctx.metalness(0);
  for (let i = 0; i < (L <= 3 ? 30 : 12); i++) {
    const a = r() * 6.283, rr = R - 2.2 + r() * 3.4;
    if (angOff(a) < 0.38) continue;
    const x = Math.cos(a) * rr, z = Math.sin(a) * rr, rx = 1.3 + r() * 2.4, rz = 0.8 + r() * 1.3, h = 0.2 + r() * 0.22;
    const J = Array.from({ length: 10 }, () => 0.8 + r() * 0.35);
    ctx.color(MUD[Math.floor(r() * MUD.length)]);
    K.push().t(x, -0.05, z).ry(-a / D + 90);
    K.loft([K.circ(0, 0, 0, rx, rz, 10, 0, (k) => J[k]), K.circ(0, h * 0.6, 0, rx * 0.72, rz * 0.66, 10, 0.2, (k) => J[k]), K.circ(0, h, 0, rx * 0.32, rz * 0.3, 10, 0.4)], false, true);
    K.pop();
  }
  // reed beds: thick at the rim, scattered clumps in the shallows
  if (L <= 4) for (let i = 0, n = L <= 2 ? 80 : L === 3 ? 45 : 20; i < n * 2 && n > 0; i++) {
    const rim = r() < 0.62, a = r() * 6.283, rr = rim ? 14.5 + r() * 5.2 : 4 + r() * 10.5;
    const x = Math.cos(a) * rr, z = Math.sin(a) * rr;
    if (!ok(x, z, 0.3) || (rr > 15 && angOff(a) < 0.3)) continue;
    reeds(ctx, K, r, x, z, (L <= 2 ? 11 : 6) + Math.floor(r() * 8), 1.1 + r() * 0.9); n--;
  }
  // pads drifting in loose rafts
  if (L <= 3) for (let i = 0; i < 30; i++) {
    const a = r() * 6.283, rr = 5 + r() * 13, cx = Math.cos(a) * rr, cz = Math.sin(a) * rr;
    if (!ok(cx, cz, -0.4)) continue;
    for (let k = 0, m = 3 + Math.floor(r() * 4); k < m; k++) pad(ctx, K, r, cx + (r() - 0.5) * 1.8, 0.112 + k * 0.001, cz + (r() - 0.5) * 1.8, 0.16 + r() * 0.24);
  }
  // drowned pilgrim lantern-staves, leaning out of the water
  for (let i = 0, n = p.staves ?? 7, t = 0; n > 0 && t < 60; t++) {
    const a = r() * 6.283, rr = 6 + r() * 11, x = Math.cos(a) * rr, z = Math.sin(a) * rr;
    if (!ok(x, z, 0.6)) continue; n--;
    const len = 1.7 + r() * 0.9, tilt = 10 + r() * 22;
    K.push().t(x, -0.3, z).ry(r() * 360).rz(tilt);
    ctx.albedo(TX.wood); ctx.color("oklch(.6 .03 60)"); ctx.roughness(0.9); ctx.metalness(0);
    K.tube([0, 0, 0], [0, len, 0], 0.035, 0.028, 6, true);
    K.tube([0, len - 0.12, 0], [0.34, len - 0.02, 0], 0.022, 0.018, 5, true);
    ctx.albedo(TX.iron); ctx.color("oklch(.6 .04 45)"); ctx.metalness(0.5);
    K.tube([0.33, len - 0.03, 0], [0.33, len - 0.32, 0], 0.006, 0.006, 4);
    if (L <= 3) { K.push().t(0.33, len - 0.75, 0).rz(-tilt * 0.6).sc(1.3); lantern(K, ctx, r() < 0.6, 0.04); K.pop(); }
    if (L <= 2) { ctx.albedo(TX.wax); ctx.color(WAX[Math.floor(r() * 3)]); ctx.metalness(0); K.cyl(0, len * 0.55, 0, 0.05, 0.04, 0.05, 6); }
    K.pop();
  }
  // half-sunk carts: a pilgrim procession that waded in and never came out
  for (const [x, z, yaw] of p.carts ?? []) {
    K.push().t(x, -0.18, z).ry(yaw).rx(-13).rz(9);
    ctx.albedo(TX.wood); ctx.roughness(0.9); ctx.metalness(0); ctx.color("oklch(.62 .035 58)");
    K.bb(-0.75, 0, -1.4, 0.75, 0.08, 1.4);
    for (const s of [-1, 1]) { K.bb(s * 0.75 - 0.04, 0.08, -1.4, s * 0.75 + 0.04, 0.45, s > 0 ? 0.3 : 1.4); for (let zz = -1.2; zz < 1.4; zz += 0.65) K.bb(s * 0.75 - 0.05, 0, zz - 0.04, s * 0.75 + 0.05, 0.5, zz + 0.04); }
    K.bb(-0.75, 0.08, -1.44, 0.75, 0.4, -1.36);
    K.tube([-0.3, 0.05, -1.4], [-0.45, 0.4, -2.9], 0.05, 0.04, 5, true); // the shaft, snapped short
    // one wheel standing proud of the water
    K.push().t(-0.85, 0.05, 0.6);
    const n = 14; for (let k = 0; k < n - 2; k++) { const a0 = (k / n) * 6.283, a1 = ((k + 1) / n) * 6.283; K.tube([0, Math.sin(a0) * 0.62, Math.cos(a0) * 0.62], [0, Math.sin(a1) * 0.62, Math.cos(a1) * 0.62], 0.05, 0.05, 4, true); }
    for (let k = 0; k < 6; k++) { const a = (k / 6) * 6.283; K.tube([0, 0, 0], [0, Math.sin(a) * 0.6, Math.cos(a) * 0.6], 0.025, 0.02, 4); }
    K.pop();
    // cargo: bundled staves and a wax-sealed coffer
    ctx.color("oklch(.56 .03 62)"); for (let k = 0; k < 5; k++) K.tube([-0.4 + k * 0.17, 0.1, -1.1], [-0.35 + k * 0.17, 0.25 + r() * 0.1, 1.1], 0.03, 0.03, 5, true);
    ctx.color("oklch(.5 .03 50)"); K.cbox(0.25, 0.08, 0.5, 0.6, 0.38, 0.5, 0.03);
    ctx.albedo(TX.wax); ctx.color("oklch(.55 .13 30)"); K.cyl(0.25, 0.46, 0.25, 0.07, 0.06, 0.02, 8);
    K.pop();
  }
}
export function collider() { return null; }
