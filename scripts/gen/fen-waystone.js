// A Lanternmere waystone: a weathered menhir on a stepped stone footing, a lantern niche cut ~1.6 m up its
// front (−Z), rune grooves down its face, moss climbing from the waterline. The niche is where the child
// "flame" sits (NICHE). params: { lean, seed }. Collider: the stone's own size.
import { kit, rng } from "./vf-kit.js";
import { TX, WAX, blob } from "./fen-kit.js";
export const NICHE = [0, 1.58, -0.16];
const ring = (y, a, bf, bb, c, dy) => {
  const P = [[a, y, -bf + c], [a, y, bb - c], [a - c, y, bb], [-a + c, y, bb], [-a, y, bb - c], [-a, y, -bf + c], [-a + c, y, -bf], [a - c, y, -bf]];
  return dy ? P.map((q, i) => [q[0], q[1] + dy(i, q), q[2]]) : P;
};
export function geometry(ctx) {
  const p = ctx.params, L = ctx.lod, K = kit(ctx), r = rng(p.seed ?? 3);
  const stone = (c, ro = 0.6) => { ctx.albedo(TX.stone); ctx.color(c); ctx.roughness(ro); ctx.metalness(0); };
  ctx.flat();
  // footing: two rough courses
  stone("oklch(.72 .012 230)", 0.45);
  K.push().ry((r() - 0.5) * 10); L <= 2 ? K.cbox(0, -0.1, 0, 1.7, 0.32, 1.5, 0.06) : K.box(0, -0.1, 0, 1.7, 0.32, 1.5); K.pop();
  stone("oklch(.78 .01 240)", 0.5);
  K.push().ry((r() - 0.5) * 14); L <= 2 ? K.cbox(0, 0.22, 0, 1.22, 0.16, 1.08, 0.05) : K.box(0, 0.22, 0, 1.22, 0.16, 1.08); K.pop();
  // the menhir, leaning a little
  K.push().t(0, 0.38, 0).rz((p.lean ?? 3) * (r() < 0.5 ? -1 : 1)).rx(-1 - r() * 2).t(0, -0.38, 0);
  const c = L <= 2 ? 0.08 : 0.05;
  stone("oklch(.66 .015 225)");
  K.loft([ring(0.38, 0.44, 0.36, 0.34, c), ring(0.9, 0.43, 0.36, 0.33, c), ring(1.42, 0.41, 0.36, 0.32, c)], false, false);
  stone("oklch(.74 .012 230)");
  K.bb(-0.4, 1.42, -0.08, 0.4, 1.94, 0.31); // niche back
  K.bb(-0.4, 1.42, -0.36, -0.16, 1.94, -0.08); K.bb(0.16, 1.42, -0.36, 0.4, 1.94, -0.08); // cheeks
  K.bb(-0.16, 1.84, -0.36, -0.08, 1.94, -0.08); K.bb(0.08, 1.84, -0.36, 0.16, 1.94, -0.08); // corbels
  stone("oklch(.62 .01 230)", 0.85); K.bb(-0.16, 1.4, -0.36, 0.16, 1.43, -0.08); // niche floor, soot-dark
  const brk = r() * 0.18;
  stone("oklch(.76 .012 232)");
  K.loft([ring(1.94, 0.4, 0.36, 0.31, c), ring(2.3, 0.35, 0.33, 0.28, c), ring(2.6, 0.22, 0.21, 0.18, c * 0.7, (i, q) => q[0] * brk)], true, true);
  // rune grooves: a column of glyphs and a band under the niche
  ctx.albedo(null); ctx.color("oklch(.24 .02 230)"); ctx.roughness(0.9); ctx.emissive("oklch(0.3 0.05 205)");
  const zf = -0.366, st = (x0, y0, x1, y1, w = 0.018) => { const dx = x1 - x0, dy = y1 - y0, l = Math.hypot(dx, dy) || 1, nx = (-dy / l) * w, ny = (dx / l) * w; K.q([x0 - nx, y0 - ny, zf], [x0 + nx, y0 + ny, zf], [x1 + nx, y1 + ny, zf], [x1 - nx, y1 - ny, zf]); };
  K.q([-0.38, 1.33, zf], [-0.38, 1.36, zf], [0.38, 1.36, zf], [0.38, 1.33, zf]);
  for (let gI = 0; gI < (L <= 2 ? 5 : 3); gI++) {
    const y = 1.18 - gI * 0.17, s = 0.06;
    st(0, y - s, 0, y + s);
    for (let k = 0, m = 1 + Math.floor(r() * 3); k < m; k++) { const yy = y - s + r() * s * 2, dir = r() < 0.5 ? -1 : 1; st(0, yy, dir * s * (0.6 + r() * 0.6), yy + (r() - 0.3) * s); }
  }
  if (L <= 2) for (const sx of [-1, 1]) for (let k = 0; k < 3; k++) { const y = 0.6 + k * 0.22; st(sx * 0.25, y, sx * 0.3, y + 0.1, 0.012); }
  ctx.emissive(null);
  // moss sleeve from the waterline, ragged top; a cap of moss and pale lichen
  if (L <= 3) {
    ctx.albedo(TX.moss); ctx.color("oklch(.62 .075 128)"); ctx.roughness(0.95);
    const H = Array.from({ length: 8 }, () => 0.5 + r() * 0.42);
    K.loft([ring(0.37, 0.46, 0.38, 0.36, c), ring(0.5, 0.455, 0.375, 0.355, c, (i) => H[i] - 0.5)], false, false);
    ctx.color("oklch(.6 .08 130)"); blob(K, r, (r() - 0.5) * 0.1, 2.62 + brk * 0.05, 0, 0.17, 0.14, 7);
    ctx.albedo(null); ctx.color("oklch(.82 .04 100)"); ctx.roughness(1);
    for (let k = 0; k < 4; k++) { const x = (r() - 0.5) * 0.6, y = 0.75 + r() * 0.5; K.push().t(x, y, -0.369).rx(-90); blob(K, r, 0, 0, 0, 0.035 + r() * 0.04, 0.03 + r() * 0.03, 6); K.pop(); }
  }
  // a guttered wax stub waiting in the niche
  ctx.albedo(TX.wax); ctx.color(WAX[1]); ctx.roughness(0.5);
  K.cyl(0, 1.43, -0.2, 0.06, 0.05, 0.07, 8); blob(K, r, 0, 1.432, -0.2, 0.11, 0.09, 7);
  K.pop();
}
export function collider(ctx) { const K = kit(ctx); K.bb(-0.85, -0.1, -0.75, 0.85, 0.38, 0.75); K.bb(-0.46, 0.38, -0.4, 0.46, 2.65, 0.37); }
