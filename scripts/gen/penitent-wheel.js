// A penitent's wheel: an iron-banded oak post, a spoked cart wheel laid flat on top, a wax-drowned
// skeleton strapped across it, candle stubs on the rim, wax drooping off the spokes. Origin = post foot.
import { TEX, WAXC, xf, bevelBox, boxC, lathe, tube, chain, drip, candleBed } from "./shapes.js";
export function geometry(ctx) {
  const L = ctx.lod, R = () => ctx.random(), H = ctx.params.h ?? 3.4, tilt = ctx.params.tilt ?? 8, Wr = 0.85;
  ctx.flat(); ctx.albedo(TEX.wood); ctx.metalness(0); ctx.roughness(0.95); ctx.color("oklch(.62 .05 55)");
  bevelBox(ctx, xf([0, H / 2, 0], R() * 20, (R() - 0.5) * 4, (R() - 0.5) * 4), 0.11, H / 2, 0.11, 0.025);
  // the wheel, tipped on the post
  const T = xf([0, H + 0.02, 0], R() * 360, tilt, 0), seg = L <= 2 ? 20 : 10;
  const rim = (r, y) => { const p = []; for (let k = 0; k <= seg; k++) { const a = (k / seg) * 6.283; p.push(T([Math.cos(a) * r, y, Math.sin(a) * r])); } return p; };
  tube(ctx, rim(Wr, 0), 0.06);
  lathe(ctx, T, [[0, -0.08], [0.15, -0.08], [0.15, 0.08], [0, 0.08]], 10, {});
  for (let s = 0; s < 10; s++) { const a = (s / 10) * 6.283; tube(ctx, [T([Math.cos(a) * 0.13, 0, Math.sin(a) * 0.13]), T([Math.cos(a) * (Wr - 0.04), 0, Math.sin(a) * (Wr - 0.04)])], 0.025); }
  ctx.albedo(TEX.iron); ctx.metalness(0.55); ctx.roughness(0.75); ctx.color("oklch(.68 .04 45)");
  tube(ctx, rim(Wr + 0.035, 0), 0.03);
  for (const y of [0.35, H - 0.3]) bevelBox(ctx, xf([0, y, 0]), 0.13, 0.04, 0.13, 0);
  // the penitent: bones under a wax skin, splayed across the spokes
  ctx.smooth(); ctx.albedo(TEX.wax); ctx.roughness(0.55); ctx.color("oklch(.78 .035 85)");
  const B = (a, b, w) => tube(ctx, [T(a), T(b)], w);
  B([0, 0.08, -0.5], [0, 0.08, 0.15], 0.07);                       // spine
  lathe(ctx, (p) => T([p[0], p[1] + 0.05, p[2] - 0.62]), [[0, 0], [0.09, 0.02], [0.11, 0.09], [0.08, 0.16], [0, 0.18]], 8, {}); // skull
  for (let i = 0; i < 4; i++) { const z = -0.38 + i * 0.09; B([0, 0.1, z], [0.17, 0.08, z + 0.03], 0.02); B([0, 0.1, z], [-0.17, 0.08, z + 0.03], 0.02); } // ribs
  B([0, 0.1, -0.4], [0.45, 0.06, -0.62], 0.035); B([0, 0.1, -0.4], [-0.47, 0.06, -0.55], 0.035); // arms to the rim
  B([0, 0.08, 0.15], [0.3, 0.06, 0.7], 0.04); B([0, 0.08, 0.15], [-0.25, 0.06, 0.72], 0.04);   // legs
  ctx.albedo(TEX.iron); ctx.color("oklch(.6 .04 45)");
  for (const p of [[0.45, -0.62], [-0.47, -0.55], [0.3, 0.7], [-0.25, 0.72]]) { const c = T([p[0], 0.08, p[1]]); lathe(ctx, xf(c), [[0.05, -0.03], [0.05, 0.03]], 6, {}); }
  // wax drooping off the rim, a few candle stubs
  ctx.albedo(TEX.wax); ctx.roughness(0.5);
  for (let i = 0; i < (L <= 2 ? 9 : 4); i++) { const a = R() * 6.283, p = T([Math.cos(a) * Wr, -0.04, Math.sin(a) * Wr]); ctx.color(WAXC[i % 5]); drip(ctx, p[0], p[1], p[2], 0.15 + R() * 0.5, 0.025 + R() * 0.02, 5); }
  if (L <= 3) for (let i = 0; i < 3; i++) { const a = 1 + i * 2.1, p = T([Math.cos(a) * Wr, 0.05, Math.sin(a) * Wr]); candleBed(ctx, p[0], p[1], p[2], 0.04, 0.04, 1, { lit: 1, hMax: 0.14, puddle: false }); }
  // a hanging chain off one side
  const e = T([Wr, 0, 0]); chain(ctx, [e, [e[0] + 0.05, e[1] - 0.9, e[2]]], L, 0.8);
}
export function collider(ctx) { boxC(ctx, -0.14, 0.14, 0, (ctx.params.h ?? 3.4), -0.14, 0.14); }
