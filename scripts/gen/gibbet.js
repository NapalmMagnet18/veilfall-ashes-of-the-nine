// A gibbet bolted to the cliff bank: an iron-banded post, an arm reaching local -Z over the arena edge,
// and either a hanging iron cage (kind "cage") or a fringe of hooked chains (kind "chains").
import { TEX, WAXC, xf, bevelBox, boxC, lathe, chain, catenary, tube, candleBed, drip } from "./shapes.js";
export function geometry(ctx) {
  const L = ctx.lod, R = () => ctx.random(), H = ctx.params.h ?? 5.6, arm = ctx.params.arm ?? 2.4, kind = ctx.params.kind ?? "cage";
  if (kind === "cagebody") return cageBody(ctx, [0, 0, 0], L, R); // the swinging part alone, hook at its origin
  ctx.flat(); ctx.albedo(TEX.wood); ctx.roughness(0.95); ctx.metalness(0); ctx.color("oklch(.78 .05 60)");
  bevelBox(ctx, xf([0, H / 2 - 0.4, 0], 3, 0, 2), 0.17, H / 2 + 0.4, 0.17, 0.03);
  bevelBox(ctx, xf([0, H - 0.15, -arm / 2 + 0.1], 0, 0, 0), 0.13, 0.13, arm / 2 + 0.15, 0.025);
  { const a = [0, H - 1.5, -0.12], b = [0, H - 0.25, -1.2]; const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
    bevelBox(ctx, xf(mid, 0, Math.atan2(b[1] - a[1], -(b[2] - a[2])) * 57.3 - 90 + 90, 0), 0.08, 0.08, Math.hypot(b[1] - a[1], b[2] - a[2]) / 2, 0.02); }
  ctx.albedo(TEX.iron); ctx.metalness(0.55); ctx.roughness(0.75); ctx.color("oklch(.7 .04 45)");
  for (const y of [0.4, H * 0.45, H - 0.45]) bevelBox(ctx, xf([0, y, 0], 3), 0.19, 0.05, 0.19, 0);
  bevelBox(ctx, xf([0, H - 0.15, -arm + 0.2]), 0.15, 0.05, 0.15, 0);
  const hook = [0, H - 0.3, -arm + 0.2];
  if (kind === "cage" && ctx.params.split) { /* the cage hangs as its own swinging child */ }
  else if (kind === "cage") cageBody(ctx, hook, L, R);
  else {
    const n = 4;
    for (let i = 0; i < n; i++) {
      const z = -0.4 - (i / (n - 1)) * (arm - 0.5), len = 1.5 + R() * 2.4, x = (R() - 0.5) * 0.1;
      const pts = [[x, H - 0.3, z], [x + (R() - 0.5) * 0.15, H - 0.3 - len, z + (R() - 0.5) * 0.15]];
      chain(ctx, pts, L);
      ctx.albedo(TEX.iron); ctx.color("oklch(.72 .05 45)");
      const e = pts[1];
      tube(ctx, [[e[0], e[1] + 0.02, e[2]], [e[0], e[1] - 0.22, e[2]], [e[0], e[1] - 0.3, e[2] - 0.08], [e[0], e[1] - 0.24, e[2] - 0.16], [e[0], e[1] - 0.16, e[2] - 0.15]], 0.016);
    }
    chain(ctx, catenary([0, H - 0.3, -arm + 0.25], [0.05, H - 1.6, -0.15], 0.9, 12), L);
  }
}
export function collider(ctx) { boxC(ctx, -0.2, 0.2, -0.8, (ctx.params.h ?? 5.6), -0.2, 0.2); }

function cageBody(ctx, hook, L, R) {
  const drop= ctx.params.drop ?? 1.1, top = hook[1] - drop, ch = 1.8;
    chain(ctx, [hook, [hook[0], top + 0.05, hook[2]]], L);
    const T = xf([hook[0], top - ch, hook[2]], R() * 40, 4, 7);
    ctx.albedo(TEX.iron); ctx.color("oklch(.72 .05 45)"); ctx.metalness(0.55); ctx.roughness(0.75); ctx.flat();
    const nb = L <= 2 ? 10 : 6, rAt = (t) => (t < 0.82 ? 0.44 + 0.12 * Math.sin(Math.PI * t / 0.82) : 0.44 * Math.cos(((t - 0.82) / 0.18) * 1.45) + 0.02);
    for (let b = 0; b < nb; b++) {
      const a = (b / nb) * 6.283, pts = [];
      for (let k = 0; k <= 8; k++) { const t = k / 8; pts.push(T([Math.cos(a) * rAt(t), t * ch, Math.sin(a) * rAt(t)])); }
      tube(ctx, pts, 0.018);
    }
    for (const t of [0.02, 0.45, 0.82]) { const pts = []; for (let k = 0; k <= 14; k++) { const a = (k / 14) * 6.283; pts.push(T([Math.cos(a) * rAt(t), t * ch, Math.sin(a) * rAt(t)])); } tube(ctx, pts, 0.025); }
    lathe(ctx, T, [[0, 0.0], [0.46, 0.0], [0.46, 0.04], [0, 0.04]], 12, {});
    // a skull and wax on the cage
    if (L <= 2) {
      ctx.smooth(); ctx.albedo(null); ctx.metalness(0); ctx.roughness(0.8); ctx.color("oklch(.82 .03 85)");
      lathe(ctx, (p) => T([p[0] + 0.1, p[1], p[2] - 0.05]), [[0, 0.04], [0.09, 0.06], [0.12, 0.13], [0.11, 0.2], [0.07, 0.25], [0, 0.26]], 8, {});
      ctx.albedo(TEX.wax); ctx.roughness(0.5);
      for (let i = 0; i < 5; i++) { const a = R() * 6.283, p = T([Math.cos(a) * 0.3, ch * 0.85, Math.sin(a) * 0.3]); ctx.color(WAXC[2 + (i % 3)]); drip(ctx, p[0], p[1], p[2], 0.2 + R() * 0.5, 0.03 + R() * 0.03, 5); }
      const tp = T([0, ch * 0.97, 0]);
      candleBed(ctx, tp[0], tp[1], tp[2], 0.08, 0.08, 2, { lit: 1, hMax: 0.12, puddle: false });
    }
}
