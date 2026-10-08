// A broken pillar stump from the drowned shrine ring: a half-sunk plinth, an octagonal shaft snapped at its
// own height with a jagged crown, moss at the waterline. params: { h, tilt, seed }. Collider: its box.
import { kit, rng } from "./vf-kit.js";
import { TX, blob } from "./fen-kit.js";
export function geometry(ctx) {
  const p = ctx.params, L = ctx.lod, K = kit(ctx), r = rng(p.seed ?? 4), h = p.h ?? 1.5, n = L <= 2 ? 8 : 6;
  const stone = (c) => { ctx.albedo(TX.stone); ctx.color(c); ctx.roughness(0.5); ctx.metalness(0); };
  ctx.flat();
  stone("oklch(.72 .012 230)");
  K.push().ry(r() * 30); L <= 2 ? K.cbox(0, -0.25, 0, 1.0, 0.5, 1.0, 0.06) : K.box(0, -0.25, 0, 1.0, 0.5, 1.0);
  K.cbox(0, 0.25, 0, 0.86, 0.08, 0.86, 0.03); K.pop();
  K.push().t(0, 0.33, 0).rz(p.tilt ?? (r() - 0.5) * 8).rx((r() - 0.5) * 6);
  stone("oklch(.78 .01 240)");
  const top = h - 0.33, J = Array.from({ length: n }, (_, i) => r() * (i % 3 === 0 ? 0.45 : 0.18));
  K.loft([K.circ(0, 0, 0, 0.38, 0.38, n, Math.PI / n), K.circ(0, top * 0.6, 0, 0.37, 0.37, n, Math.PI / n), K.circ(0, top, 0, 0.36, 0.36, n, Math.PI / n).map((q, i) => [q[0], q[1] + J[i], q[2]])], false, true);
  if (L <= 2) { ctx.albedo(null); ctx.color("oklch(.35 .01 230)"); for (let i = 0; i < n; i += 2) { const a = Math.PI / n + (i / n) * 6.283; K.tube([Math.cos(a) * 0.372, 0.1, Math.sin(a) * 0.372], [Math.cos(a) * 0.362, top - 0.05, Math.sin(a) * 0.362], 0.012, 0.012, 3); } }
  if (L <= 3) { ctx.albedo(TX.moss); ctx.color("oklch(.62 .075 128)"); ctx.roughness(0.95);
    const H = Array.from({ length: n }, () => 0.15 + r() * 0.35);
    K.loft([K.circ(0, -0.3, 0, 0.395, 0.395, n, Math.PI / n), K.circ(0, 0, 0, 0.385, 0.385, n, Math.PI / n).map((q, i) => [q[0], H[i], q[2]])], false, false);
    blob(K, r, 0, top + 0.05, 0, 0.16, 0.14, 6); }
  K.pop();
}
export function collider(ctx) { const K = kit(ctx), h = ctx.params.h ?? 1.5; K.bb(-0.5, -0.25, -0.5, 0.5, h, 0.5); }
