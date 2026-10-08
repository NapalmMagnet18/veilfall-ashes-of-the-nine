// The heart of the Lanternmere: a sunken round dais of cracked wedge-stones just under the water, a faint
// rune circle in its paving, a broken curb at its rim, and the rusted iron cage of the first lantern lying
// on its side at the centre. Origin at the centre (y 0). Fighting ground: no collider at all.
import { kit, rng } from "./vf-kit.js";
import { D, TX, STONE } from "./fen-kit.js";
export function geometry(ctx) {
  const p = ctx.params, L = ctx.lod, K = kit(ctx), r = rng(p.seed ?? 9), R = p.r ?? 9.6, top = p.top ?? 0.05;
  ctx.flat();
  // cracked wedge paving
  const rings = [[0, 2.4, 6], [2.45, 5.8, 11], [5.85, R, 16]];
  for (const [r0, r1, n] of rings) {
    const ph = r() * 6.283;
    for (let i = 0; i < n; i++) {
      if (r0 > 5 && r() < 0.12) continue;
      const g0 = r0 > 0 ? 0.035 / r0 : 0.012, a0 = ph + (i / n) * 6.283 + g0 + 0.02 / r1, a1 = ph + ((i + 1) / n) * 6.283 - 0.02 / r1;
      const yt = top + (r() - 0.5) * 0.05, tx = (r() - 0.5) * 0.04, k = L <= 2 ? 4 : 2;
      const out = [], inn = [];
      for (let j = 0; j <= k; j++) { const a = a0 + (a1 - a0) * (j / k); out.push([Math.cos(a) * r1, a, Math.sin(a) * r1]); inn.push([Math.cos(a) * r0, a, Math.sin(a) * r0]); }
      const Y = (q) => yt + tx * (q[0] / R);
      ctx.albedo(TX.stone); ctx.color(STONE[Math.floor(r() * STONE.length)]); ctx.roughness(0.3); ctx.metalness(0);
      for (let j = 0; j < k; j++) {
        const A = [inn[j][0], Y(inn[j]), inn[j][2]], B = [inn[j + 1][0], Y(inn[j + 1]), inn[j + 1][2]], C = [out[j + 1][0], Y(out[j + 1]), out[j + 1][2]], E = [out[j][0], Y(out[j]), out[j][2]];
        K.qo(A, B, C, E, [0, 1, 0]);
        K.qo([E[0], -0.25, E[2]], [C[0], -0.25, C[2]], C, E, [Math.cos(out[j][1]), 0, Math.sin(out[j][1])]);
      }
    }
  }
  // the rune circle, faint under the water
  if (L <= 3) {
    ctx.albedo(null); ctx.color("oklch(.3 .03 210)"); ctx.roughness(0.4); ctx.emissive("oklch(0.34 0.07 205)");
    for (const [rr, w, seg] of [[4.15, 0.06, 48], [3.7, 0.03, 48]]) for (let i = 0; i < seg; i++) {
      if (r() < 0.12) continue;
      const a0 = (i / seg) * 6.283, a1 = ((i + 0.8) / seg) * 6.283, y = top + 0.035;
      K.q([Math.cos(a0) * (rr - w), y, Math.sin(a0) * (rr - w)], [Math.cos(a0) * (rr + w), y, Math.sin(a0) * (rr + w)], [Math.cos(a1) * (rr + w), y, Math.sin(a1) * (rr + w)], [Math.cos(a1) * (rr - w), y, Math.sin(a1) * (rr - w)]);
    }
    for (let i = 0; i < 9; i++) { // nine glyph ticks between the circles, one for each lantern
      const a = (i / 9) * 6.283, c = Math.cos(a), s = Math.sin(a), y = top + 0.036, w = 0.04;
      K.q([c * 3.78 - s * w, y, s * 3.78 + c * w], [c * 3.78 + s * w, y, s * 3.78 - c * w], [c * 4.08 + s * w, y, s * 4.08 - c * w], [c * 4.08 - s * w, y, s * 4.08 + c * w]);
    }
    ctx.emissive(null);
  }
  // the broken curb at the rim
  ctx.albedo(TX.stone); ctx.roughness(0.45);
  for (let i = 0, n = L <= 3 ? 30 : 14; i < n; i++) {
    if (r() < 0.3) continue;
    const a = (i / n) * 360 + r() * 4;
    ctx.color(STONE[Math.floor(r() * STONE.length)]);
    K.push().ry(-a).t(R + 0.3, 0, 0).rz((r() - 0.5) * 10).rx((r() - 0.5) * 8);
    L <= 2 ? K.cbox(0, -0.25, 0, 0.55, 0.38 + r() * 0.1, 1.85, 0.05) : K.box(0, -0.25, 0, 0.55, 0.4, 1.85);
    K.pop();
  }
  // a fallen column drum lying half-drowned outside the ring
  ctx.color(STONE[0]); K.push().ry(-300).t(R + 1.6, 0.05, 0).ry(30).rz(90).rx(8); K.cyl(0, -0.6, 0, 0.4, 0.4, 1.2, L <= 2 ? 10 : 6); K.pop();
  // the first lantern's cage, rusted, lying on its side at the centre
  ctx.albedo(TX.iron); ctx.color("oklch(.62 .06 45)"); ctx.metalness(0.55); ctx.roughness(0.7);
  K.push().t(0, top + 0.44, 0).ry(p.cageYaw ?? 35).rz(90).t(0, -0.65, 0);
  const hoop = (y, rr, t, n = 12) => { for (let i = 0; i < n; i++) { const a0 = (i / n) * 6.283, a1 = ((i + 1) / n) * 6.283; K.tube([Math.cos(a0) * rr, y, Math.sin(a0) * rr], [Math.cos(a1) * rr, y, Math.sin(a1) * rr], t, t, 4); } };
  K.cyl(0, 0, 0, 0.46, 0.44, 0.07, 8);
  hoop(0.08, 0.42, 0.03); hoop(0.55, 0.43, 0.025); hoop(1.0, 0.4, 0.03);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * 6.283, c = Math.cos(a), s = Math.sin(a);
    if (i === 3) { K.tube([c * 0.42, 0.08, s * 0.42], [c * 0.62, 0.45, s * 0.62], 0.018, 0.018, 4); K.tube([c * 0.62, 0.45, s * 0.62], [c * 0.52, 0.7, s * 0.52], 0.018, 0.016, 4); continue; } // one bar wrenched out
    K.tube([c * 0.42, 0.08, s * 0.42], [c * 0.4, 1.0, s * 0.4], 0.018, 0.018, 4);
    K.tube([c * 0.4, 1.0, s * 0.4], [c * 0.22, 1.24, s * 0.22], 0.016, 0.016, 4); K.tube([c * 0.22, 1.24, s * 0.22], [0, 1.32, 0], 0.016, 0.016, 4);
  }
  for (let i = 0; i < 10; i++) { const a0 = (i / 10) * 6.283, a1 = ((i + 1) / 10) * 6.283; K.tube([0, 1.42 + Math.sin(a0) * 0.11, Math.cos(a0) * 0.11], [0, 1.42 + Math.sin(a1) * 0.11, Math.cos(a1) * 0.11], 0.02, 0.02, 4); } // handle ring
  K.cyl(0, 0.07, 0, 0.09, 0.07, 0.12, 8); // candle socket
  K.pop();
  // the broken chain it hung by, trailing off across the stones
  for (let i = 0; i < (L <= 2 ? 9 : 4); i++) { const x = -0.9 - i * 0.13, z = 0.75 + Math.sin(i * 0.9) * 0.08; K.push().t(x, top + 0.03, z).ry(i * 37).rx(i % 2 ? 90 : 20); hoop(0, 0.055, 0.012, 6); K.pop(); }
  ctx.metalness(0);
}
export function collider() { return null; }
