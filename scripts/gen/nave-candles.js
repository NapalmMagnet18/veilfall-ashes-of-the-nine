// A candle drift: a low heap of wax the faithful built stub on stub, hundreds of melted candles leaning
// every way in ivory, honey and soot-grey, a wax skirt run out over the flags, and a few tall candles still
// burning at params.tips ("x,y,z;…" metres, the same string the drift's candles.fx.js flames ride).
// params: { rx, rz, H, n, tips }. Origin at the floor, centred. Low box collider.
import { TEX, WAXC, xf, boxC, lathe, puddle } from "./shapes.js";
const TONES = [...WAXC, "oklch(.5 .012 70)", "oklch(.86 .03 85)", "oklch(.42 .01 60)"];
export function geometry(ctx) {
  const L = ctx.lod, R = () => ctx.random(), { rx = 0.9, rz = 0.7, H = 0.32, n = 240 } = ctx.params, ph = R() * 9;
  const surf = (t, a) => { const e = 1 + 0.16 * Math.sin(a * 3 + ph) + 0.09 * Math.sin(a * 5 + ph * 2); return [Math.cos(a) * rx * t * e, H * Math.pow(Math.max(0, 1 - t * t), 1.2) * (1 + 0.14 * Math.sin(a * 4 + t * 7 + ph)) + 0.006, Math.sin(a) * rz * t * e]; };
  ctx.smooth(); ctx.albedo(TEX.wax); ctx.roughness(0.5); ctx.metalness(0);
  ctx.color("oklch(.5 .02 70)"); puddle(ctx, 0, 0, 0, rx * 1.45, rz * 1.45, 0.02, false, L <= 2 ? 18 : 10);
  ctx.color(WAXC[3]);
  const rings = L <= 2 ? 6 : 3, seg = L <= 2 ? 22 : 10, ref = [0, -2, 0];
  for (let i = 0; i < rings; i++) for (let j = 0; j < seg; j++) {
    const a0 = (j / seg) * 6.283, a1 = ((j + 1) / seg) * 6.283, t0 = i / rings, t1 = (i + 1) / rings;
    const q = [surf(t0, a0), surf(t0, a1), surf(t1, a1), surf(t1, a0)];
    ctx.tri(...q[0], ...q[2], ...q[1]); ctx.tri(...q[0], ...q[3], ...q[2]);
  }
  const m = L === 1 ? n : L === 2 ? Math.round(n * 0.45) : L === 3 ? Math.round(n * 0.15) : 0, s5 = L <= 1 ? 5 : 4;
  for (let i = 0; i < m; i++) {
    const t = Math.sqrt(R()) * 0.97, a = R() * 6.283, p = surf(t, a), r = 0.016 + R() * 0.03, hh = (0.02 + R() * R() * 0.17) * (1.25 - t * 0.6);
    ctx.color(TONES[Math.floor(R() * TONES.length)]);
    lathe(ctx, xf([p[0], p[1] - 0.012, p[2]], R() * 360, (R() - 0.5) * 34, (R() - 0.5) * 34), [[r * 1.7, 0], [r * 1.1, 0.014], [r, hh * 0.6], [r * 0.94, hh], [r * 0.45, hh + 0.006]], s5, { a0: R() * 6 });
  }
  const tips = String(ctx.params.tips ?? "").split(";").map((s) => s.split(",").map(Number)).filter((v) => v.length === 3 && v.every(Number.isFinite));
  for (const [x, y, z] of tips) {
    const t = Math.min(0.99, Math.hypot(x / rx, z / rz)), base = H * Math.pow(1 - t * t, 1.2) - 0.02, top = y - 0.035;
    ctx.color(TONES[6]);
    lathe(ctx, xf([x, base, z]), [[0.06, 0], [0.04, 0.02], [0.035, top - base - 0.02], [0.038, top - base - 0.005], [0.02, top - base], [0, top - base - 0.008]], 6, {});
    ctx.color("oklch(.3 .01 50)"); ctx.emissive(4.5, 2.2, 0.6);
    lathe(ctx, xf([x, top, z]), [[0, 0.004], [0.012, 0.02], [0.008, 0.04], [0, 0.06]], 4, {}); ctx.emissive(null);
  }
}
export function collider(ctx) { const { rx = 0.9, rz = 0.7, H = 0.32 } = ctx.params; boxC(ctx, -rx, rx, 0, H * 0.7, -rz, rz); }
