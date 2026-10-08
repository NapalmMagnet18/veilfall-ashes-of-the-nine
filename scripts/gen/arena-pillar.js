// A broken pillar of the Bailiff's ring: stepped plinth, octagonal drums, a shattered crown capped in wax
// and crowned with candles at y = h (the fx cluster rides there). Local +Z faces away from the arena centre.
// params: { h: crown height, fallen: a toppled drum lies outward }
import { TEX, WAXC, xf, bevelBox, boxC, lathe, rough, drip, candleBed, puddle, mossSkin, quad } from "./shapes.js";
export function geometry(ctx) {
  const L = ctx.lod, R = () => ctx.random(), h = ctx.params.h ?? 4;
  const J = L <= 2 ? rough(ctx, 0.03, 1.4) : null, bev = L <= 2 ? 0.05 : 0;
  const stone = () => { ctx.flat(); ctx.albedo(TEX.stone); ctx.roughness(0.82); ctx.metalness(0); ctx.color(`oklch(${(0.8 + R() * 0.12).toFixed(3)} .012 250)`); };
  stone(); bevelBox(ctx, xf([0, 0.05, 0], R() * 4), 1.0, 0.5, 1.0, bev, J);
  stone(); bevelBox(ctx, xf([0, 0.7, 0], R() * 6), 0.82, 0.16, 0.82, bev, J);
  const seg = L <= 2 ? 8 : 6, ph = 0.39;
  stone(); lathe(ctx, xf(), [[0.78, 0.86], [0.78, 0.96], [0.7, 1.04], [0.64, 1.08]], seg, { a0: ph, J, ref: [0, 0.9, 0] });
  // drums up to the break
  let y = 1.08, top = h - 0.35;
  while (y < top - 0.6) {
    const y1 = Math.min(top - 0.4, y + 0.9 + R() * 0.3), off = [(R() - 0.5) * 0.06, 0, (R() - 0.5) * 0.06];
    stone(); lathe(ctx, xf(off, (R() - 0.5) * 8), [[0, y], [0.58, y], [0.62, y + 0.04], [0.62, y1 - 0.04], [0.58, y1], [0, y1]], seg, { a0: ph, J });
    y = y1;
  }
  // the shattered top drum: jagged rim, teeth poking through the wax
  stone();
  const tops = [];
  for (let j = 0; j < seg; j++) tops.push(top - 0.25 + R() * (j % 3 === 0 ? 0.95 : 0.4));
  const P = (j, yy) => { const a = ph + (j / seg) * 6.283; return [Math.cos(a) * 0.62, yy, Math.sin(a) * 0.62]; };
  for (let j = 0; j < seg; j++) {
    const k = (j + 1) % seg;
    quad(ctx, P(j, y), P(k, y), P(k, tops[k]), P(j, tops[j]), [0, (y + top) / 2, 0]);
    ctx.tri(...P(j, tops[j]), ...P(k, tops[k]), 0, top - 0.2, 0);
  }
  if (L <= 3) {
    // wax crown, drips down the shaft, pool on the plinth and the ground
    ctx.smooth(); ctx.albedo(TEX.wax); ctx.roughness(0.5); ctx.color(WAXC[1]);
    lathe(ctx, xf(), [[0, h], [0.4, h - 0.01], [0.58, h - 0.06], [0.66, h - 0.2], [0.67, h - 0.36], [0.63, h - 0.45]], seg * 2,
      { rj: (i, j) => (i >= 4 ? 1 + 0.05 * Math.sin(j * 2.3) : 1), ref: [0, h - 0.4, 0] });
    const nd = L === 1 ? 12 : L === 2 ? 7 : 4;
    for (let i = 0; i < nd; i++) {
      const a = R() * 6.283, len = 0.4 + R() * Math.max(0.3, h - 2.2), r = 0.05 + R() * 0.08;
      ctx.color(WAXC[2 + Math.floor(R() * 3)]);
      drip(ctx, Math.cos(a) * (0.6 + r * 0.3), h - 0.3, Math.sin(a) * (0.6 + r * 0.3), Math.min(len, h - 1.4), r, L === 1 ? 6 : 4);
    }
    ctx.color(WAXC[2]); puddle(ctx, 0.15, 0.86, 0.2, 0.8, 0.75, 0.05);
    ctx.color(WAXC[3]); puddle(ctx, 0.3, 0, 0.6, 1.8, 1.6, 0.06, true, 20);
  }
  if (L <= 2) {
    mossSkin(ctx, [-1.0, 0, 1.0], [1, 0, 0], [0, 0, 1], 2.0, -0.4, 0.55);
    mossSkin(ctx, [1.0, 0, -1.0], [-1, 0, 0], [0, 0, -1], 2.0, -0.4, 0.45);
    mossSkin(ctx, [1.0, 0, 1.0], [0, 0, -1], [1, 0, 0], 2.0, -0.4, 0.5);
    candleBed(ctx, 0, h + 0.03, 0, 0.42, 0.42, L === 1 ? 20 : 10, { lit: 0, hMax: 0.22 });
    candleBed(ctx, 0, 0.88, 0.62, 0.55, 0.12, L === 1 ? 7 : 3, { lit: 0.3 });
    candleBed(ctx, -0.6, 0, 1.45, 0.55, 0.35, L === 1 ? 9 : 4, { ground: true, lit: 0.25 });
  }
  if (ctx.params.fallen) {
    stone();
    const gy = ctx.groundY(0.5, 2.1);
    lathe(ctx, xf([0.5, gy + 0.55, 2.1], 20 + R() * 40, 0, 90), [[0, -0.5], [0.58, -0.5], [0.62, -0.46], [0.62, 0.46], [0.58, 0.5], [0, 0.5]], seg, { a0: 0.2, J });
    if (L <= 2) candleBed(ctx, 0.5, gy + 1.17, 2.1, 0.3, 0.25, L === 1 ? 6 : 3, { lit: 0.3, hMax: 0.15 });
  }
}
export function collider(ctx) { boxC(ctx, -1, 1, -0.45, (ctx.params.h ?? 4), -1, 1); }
