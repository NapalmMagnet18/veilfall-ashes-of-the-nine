// A standing broken nave pier: a stepped plinth, an octagonal core ringed by four big shafts and four
// fillets, each snapped at its own height, soot banded low (the pews burned round it) and high (the roof
// burned on it). params: { h, cap }: cap seats a split, soot-black capital fragment on the stump. Origin at the foot.
import { TEX, WAXC, xf, chainXf, bevelBox, boxC, lathe, rough, drip, quad } from "./shapes.js";
const D = Math.PI / 180;
const SH = [[0, 0.4, 0.17], [90, 0.4, 0.17], [180, 0.4, 0.17], [270, 0.4, 0.17], [45, 0.45, 0.085], [135, 0.45, 0.085], [225, 0.45, 0.085], [315, 0.45, 0.085]];
const BAND = ["oklch(.72 .012 55)", "oklch(.88 .012 250)", "oklch(.6 .01 50)"];
export function geometry(ctx) {
  const L = ctx.lod, R = () => ctx.random(), h = ctx.params.h ?? 4;
  const J = L <= 2 ? rough(ctx, 0.025, 1.6) : null, bev = L <= 2 ? 0.04 : 0, seg = L <= 2 ? 8 : 6, sseg = L <= 2 ? 8 : 5;
  const stone = (c) => { ctx.flat(); ctx.albedo(TEX.stone); ctx.roughness(0.85); ctx.metalness(0); ctx.color(c); };
  if (L >= 5) { stone("oklch(.78 .012 250)"); bevelBox(ctx, xf([0, 0, 0]), 0.8, 0.45, 0.8, 0); bevelBox(ctx, xf([0, 0.45 + (h - 0.8) / 2, 0], 22), 0.55, (h - 0.8) / 2, 0.55, 0); return; }
  stone("oklch(.8 .012 250)"); bevelBox(ctx, xf([0, 0, 0], R() * 4 - 2), 0.8, 0.32, 0.8, bev, J);
  stone("oklch(.84 .012 250)"); bevelBox(ctx, xf([0, 0.4, 0], R() * 4 - 2), 0.68, 0.08, 0.68, bev, J);
  // banded shaft: soot low, pale mid, soot high
  const shaft = (T, r, y0, y1, s) => {
    const b1 = y0 + 0.5 + R() * 0.5, b2 = Math.max(b1 + 0.3, y1 - 0.8 - R() * 0.8);
    const cuts = [y0, Math.min(b1, y1), Math.min(b2, y1), y1];
    for (let k = 0; k < 3; k++) if (cuts[k + 1] - cuts[k] > 0.02) { stone(BAND[k]); lathe(ctx, T, [[0, cuts[k]], [r, cuts[k]], [r, cuts[k + 1]], [0, cuts[k + 1]]], s, { J, a0: Math.PI / 8 }); }
  };
  const coreTop = h - 0.35 - R() * 0.5;
  shaft(xf(), 0.36, 0.48, coreTop, seg);
  // the core's shattered crown
  stone(BAND[2]);
  const P = (j, yy) => { const a = Math.PI / 8 + (j / seg) * 6.283; return [Math.cos(a) * 0.36, yy, Math.sin(a) * 0.36]; };
  const tops = []; for (let j = 0; j < seg; j++) tops.push(coreTop + R() * (j % 3 === 0 ? 0.7 : 0.3));
  for (let j = 0; j < seg; j++) { const k = (j + 1) % seg; quad(ctx, P(j, coreTop), P(k, coreTop), P(k, tops[k]), P(j, tops[j]), [0, coreTop, 0]); ctx.tri(...P(j, tops[j]), ...P(k, tops[k]), 0, coreTop + 0.1, 0); }
  for (const [a, o, r] of SH) {
    if (L >= 4 && r < 0.1) continue;
    const T = xf([Math.cos(a * D) * o, 0, Math.sin(a * D) * o]), top = coreTop - (r < 0.1 ? 0.3 : 0) - R() * 1.4;
    stone(BAND[1]); lathe(ctx, T, [[0, 0.48], [r + 0.06, 0.48], [r + 0.06, 0.55], [r, 0.62]], sseg, {}); // base moulding
    shaft(T, r, 0.6, Math.max(0.9, top), sseg);
    stone(BAND[2]); lathe(ctx, T, [[r, Math.max(0.9, top)], [r * 0.4, Math.max(0.9, top) + 0.06 + R() * 0.12], [0, Math.max(0.9, top) + 0.02]], sseg, {}); // snapped tip
  }
  if (ctx.params.cap) { // a split capital fragment seated askew on the stump, soot-black
    stone("oklch(.56 .01 50)");
    const C = xf([0.12, coreTop + 0.05, -0.05], R() * 360, 10 + R() * 8, 4);
    lathe(ctx, C, [[0.38, 0], [0.46, 0.08], [0.66, 0.32], [0.76, 0.4], [0.76, 0.52], [0.32, 0.52], [0.32, 0.02]], seg * 2, { skip: (i, j) => j > seg * 1.1, J });
    if (L <= 2) bevelBox(ctx, chainXf(C, xf([0.55, 0.6, 0])), 0.25, 0.08, 0.2, 0.02, J); // abacus shard
  }
  if (L <= 3) { // wax run down from candles once set on the capital ledge
    ctx.smooth(); ctx.albedo(TEX.wax); ctx.roughness(0.5);
    for (let i = 0; i < (L <= 2 ? 6 : 3); i++) { const a = R() * 6.283; ctx.color(WAXC[1 + Math.floor(R() * 4)]); drip(ctx, Math.cos(a) * 0.42, coreTop - 0.2, Math.sin(a) * 0.42, Math.min(coreTop - 0.8, 0.5 + R() * 1.6), 0.03 + R() * 0.04, 5); }
  }
}
export function collider(ctx) { boxC(ctx, -0.8, 0.8, 0, ctx.params.h ?? 4, -0.8, 0.8); }
