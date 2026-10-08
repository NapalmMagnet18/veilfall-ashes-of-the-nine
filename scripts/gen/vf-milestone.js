// A broken pilgrim milestone: a tapered octagonal stone post on a plinth, some snapped ragged,
// a carved lantern panel and tally notches on the road face (local −Z, turned by params.yaw),
// a crack, moss at the foot, a wax cap and a cluster of candles whose wax runs down the stone.
// params: { h, w, snap, yaw, seed, notch, candles: [[x, z, height, radius, lit], …] } (x, z on the top, pre-yaw)
import { kit, rng } from "./vf-kit.js";
const STONE = "cdn/texture-weathered-grey-granite.png";
const WAX = ["oklch(0.9 0.03 88)", "oklch(0.86 0.05 84)", "oklch(0.82 0.07 80)", "oklch(0.92 0.02 92)", "oklch(0.78 0.08 78)"];
export function topY(p) { return p.snap ? p.h - 0.02 : p.h + 0.12; }
export function geometry(ctx) {
  const p = ctx.params, K = kit(ctx), lod = ctx.lod;
  const h = p.h ?? 1.3, hw = p.w ?? 0.28, snap = !!p.snap, seed = p.seed ?? 1;
  const ht = hw * 0.87, y0 = 0.2, c = 0.05;
  const half = (y) => hw + (ht - hw) * (y - y0) / (h - y0);
  const top = topY({ h, snap });
  K.ry(p.yaw ?? 0);
  // plinth and shaft
  ctx.albedo(STONE); ctx.color("oklch(0.92 0.01 250)"); ctx.roughness(0.82);
  K.cbox(0, -0.3, 0, hw * 2 + 0.36, 0.5, hw * 2 + 0.36, 0.07);
  if (lod <= 3) K.cbox(0, 0.15, 0, hw * 2 + 0.14, 0.09, hw * 2 + 0.14, 0.03);
  const rj = rng(seed * 7 + 1);
  if (snap) {
    const ring = K.oct(0, h - 0.14, 0, ht, ht, c);
    const jag = ring.map(([x, , z], i) => [x * (0.94 + rj() * 0.06), h - 0.1 + rj() * 0.3, z * (0.94 + rj() * 0.06)]);
    K.loft([K.oct(0, y0, 0, hw, hw, c), ring, jag], false, false);
    const cen = [0, h - 0.06, 0];
    for (let i = 0; i < 8; i++) K.tr(cen, jag[(i + 1) % 8], jag[i]);
    if (lod <= 2) { // the snapped-off crown lying at the foot
      ctx.color("oklch(0.88 0.01 250)");
      K.push().t(hw + 0.55, 0.0, -0.25).rz(-78).ry(25);
      K.cbox(0, 0, 0, ht * 1.9, 0.42, ht * 1.9, 0.05); K.pop();
    }
  } else {
    K.loft([K.oct(0, y0, 0, hw, hw, c), K.oct(0, h - 0.04, 0, ht, ht, c), K.oct(0, h, 0, ht - c, ht - c, c * 0.5)], false, false);
    K.cbox(0, h - 0.02, 0, ht * 2 + 0.12, 0.14, ht * 2 + 0.12, 0.035);
  }
  // carved road face: a raised frame, a darker sunken panel, a lantern sigil, tally notches
  if (lod <= 3) {
    const pb = 0.42, pt = Math.min(h - 0.22, 1.12), pw = ht - 0.07;
    if (pt - pb > 0.3) {
      const fz = (y) => -half(y) - 0.012;
      ctx.color("oklch(0.95 0.01 250)");
      K.bb(-pw, pb - 0.05, fz(pb) - 0.01, pw, pb, fz(pb) + 0.03);
      K.bb(-pw, pt, fz(pt) - 0.01, pw, pt + 0.05, fz(pt) + 0.03);
      K.bb(-pw, pb, fz(pb) - 0.01, -pw + 0.045, pt, fz(pt) + 0.03);
      K.bb(pw - 0.045, pb, fz(pb) - 0.01, pw, pt, fz(pt) + 0.03);
      ctx.color("oklch(0.62 0.01 250)");
      const iz = (y) => -half(y) - 0.003, a = pw - 0.045;
      K.q([-a, pb, iz(pb)], [-a, pt, iz(pt)], [a, pt, iz(pt)], [a, pb, iz(pb)]);
      ctx.color("oklch(0.97 0.01 250)");
      const my = pb + (pt - pb) * 0.62, s = Math.min(0.11, (pt - pb) * 0.22), z = iz(my) - 0.012;
      K.bb(-0.012, my + s * 1.15, z - 0.008, 0.012, my + s * 1.5, z + 0.01);
      K.bb(-s * 0.7, my + s, z - 0.008, s * 0.7, my + s * 1.15, z + 0.01);
      K.bb(-s * 0.7, my - s, z - 0.008, s * 0.7, my - s * 0.85, z + 0.01);
      K.bb(-s * 0.7, my - s, z - 0.008, -s * 0.55, my + s, z + 0.01);
      K.bb(s * 0.55, my - s, z - 0.008, s * 0.7, my + s, z + 0.01);
      K.push().t(0, my, z).rz(45); K.bb(-s * 0.22, -s * 0.22, -0.006, s * 0.22, s * 0.22, 0.01); K.pop();
      ctx.color("oklch(0.5 0.01 250)");
      const n = p.notch ?? 3, ny = pb + 0.06;
      for (let i = 0; i < n; i++) { const x = -0.03 * (n - 1) + i * 0.06; K.q([x - 0.009, ny, iz(ny) - 0.004], [x - 0.009, ny + 0.1, iz(ny + 0.1) - 0.004], [x + 0.009, ny + 0.1, iz(ny + 0.1) - 0.004], [x + 0.009, ny, iz(ny) - 0.004]); }
    }
    // a crack down the +X face
    ctx.color("oklch(0.35 0.01 250)");
    const rc = rng(seed * 7 + 2);
    let cy = Math.min(h, top) - 0.05, cz = (rc() - 0.5) * ht;
    for (let i = 0; i < 6 && cy > 0.35; i++) {
      const ny = cy - 0.08 - rc() * 0.1, nz = Math.max(-ht + 0.04, Math.min(ht - 0.04, cz + (rc() - 0.5) * 0.12));
      const x0 = half(cy) + 0.003, x1 = half(ny) + 0.003, w = 0.012 - i * 0.0015;
      K.q([x0, cy, cz - w], [x1, ny, nz - w], [x1, ny, nz + w], [x0, cy, cz + w]);
      cy = ny; cz = nz;
    }
  }
  // moss at the foot and on the plinth lip
  ctx.albedo(null); ctx.roughness(1);
  if (lod <= 3) {
    const rm = rng(seed * 7 + 3);
    for (let i = 0; i < 9; i++) {
      const an = rm() * Math.PI * 2, rr = hw + 0.12 + rm() * 0.22, r = 0.06 + rm() * 0.1;
      ctx.color(rm() < 0.5 ? "oklch(0.44 0.08 135)" : "oklch(0.38 0.07 125)");
      const y = rr < hw + 0.2 ? 0.2 : -0.02;
      K.loft([K.circ(Math.cos(an) * rr, y, Math.sin(an) * rr, r, r * 0.8, 6), K.circ(Math.cos(an) * rr, y + 0.035, Math.sin(an) * rr, r * 0.6, r * 0.5, 6)], false, true);
    }
  }
  // the wax cap that has pooled on the top
  ctx.smooth(); ctx.roughness(0.55);
  ctx.color("oklch(0.84 0.06 84)");
  const rw = rng(seed * 7 + 4);
  const capR = (snap ? ht : ht + 0.05) * 0.95;
  K.loft([K.circ(0, top - 0.01, 0, capR, capR, 12, 0, () => 0.85 + rw() * 0.2), K.circ(0, top + 0.04, 0, capR * 0.8, capR * 0.8, 12, 0, () => 0.8 + rw() * 0.2)], false, true);
  // long drips running down the faces
  if (lod <= 3) {
    const rd = rng(seed * 7 + 5);
    const capZ = snap ? null : ht + 0.06;
    for (let f = 0; f < 4; f++) {
      K.push().ry(f * 90);
      const nd = 2 + Math.floor(rd() * 3);
      for (let i = 0; i < nd; i++) {
        const x = (rd() - 0.5) * ht * 1.5, w = 0.022 + rd() * 0.025, L = 0.18 + rd() * (f === 0 ? 0.35 : 0.75);
        const ya = snap ? h - 0.12 : h, yb = Math.max(0.3, ya - L), zf = (y) => -half(y) - 0.006;
        ctx.color(WAX[Math.floor(rd() * WAX.length)]);
        const rings = [];
        if (capZ) { rings.push(K.rect(x, top + 0.02, -capZ, w / 2, 0.008)); rings.push(K.rect(x, h - 0.03, -capZ, w / 2, 0.008)); }
        rings.push(K.rect(x, ya, zf(ya), w / 2, 0.007));
        rings.push(K.rect(x, yb, zf(yb), w * 0.32, 0.006));
        K.loft(rings.reverse(), false, false);
        K.cyl(x, yb - 0.025, zf(yb) - 0.004, w * 0.25, w * 0.42, 0.04, 6);
      }
      K.pop();
    }
  }
  // the candles
  const rcd = rng(seed * 7 + 6);
  for (const [x, z, ch, r, lit] of p.candles ?? []) {
    const col = WAX[Math.floor(rcd() * WAX.length)];
    ctx.color("oklch(0.8 0.07 82)");
    K.loft([K.circ(x, top + 0.02, z, r * 1.9, r * 1.7, 8, rcd()), K.circ(x, top + 0.045, z, r * 1.2, r * 1.2, 8)], false, true);
    ctx.color(col);
    const tilt = (rcd() - 0.5) * 0.04;
    K.loft([K.circ(x, top + 0.03, z, r, r, 8), K.circ(x + tilt, top + 0.03 + ch * 0.9, z, r * 0.97, r * 0.97, 8), K.circ(x + tilt, top + 0.03 + ch, z, r * 0.8, r * 0.85, 8, 0, () => 0.85 + rcd() * 0.25)], false, true);
    if (lod <= 2) {
      ctx.color("oklch(0.8 0.08 80)");
      for (let d = 0; d < 2; d++) {
        const an = rcd() * Math.PI * 2, ca = Math.cos(an), sa = Math.sin(an), L = ch * (0.3 + rcd() * 0.6);
        const ty = top + 0.03 + ch;
        K.tube([x + tilt + ca * r * 0.98, ty, z + sa * r * 0.98], [x + ca * r * 1.02, ty - L, z + sa * r * 1.02], r * 0.28, r * 0.18, 5, true);
      }
      ctx.color("oklch(0.12 0 0)"); ctx.flat();
      K.bb(x + tilt - 0.003, top + 0.03 + ch - 0.01, z - 0.003, x + tilt + 0.003, top + 0.03 + ch + 0.028, z + 0.003);
      ctx.smooth();
    }
  }
}
export function collider(ctx) {
  const p = ctx.params, K = kit(ctx), hw = p.w ?? 0.28;
  K.bb(-hw - 0.18, -0.3, -hw - 0.18, hw + 0.18, 0.24, hw + 0.18);
  K.bb(-hw, 0.2, -hw, hw, topY({ h: p.h ?? 1.3, snap: !!p.snap }), hw);
}
