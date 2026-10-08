// The Fen Path: old pilgrim flagstones that sink and scatter as the road drops west, giving way to a rotted
// plank boardwalk over the mud, reeds and dead shrubs crowding both edges. Follows FEN_PATH; origin at
// params { ox, oz } (the placement's feet). Walk-through dressing: no collider.
import { kit, rng } from "./vf-kit.js";
import { FEN_PATH } from "../lib/data/veilfall-map.js";
import { D, TX, STONE, reeds, shrub, plankRun, blob } from "./fen-kit.js";
export function geometry(ctx) {
  const p = ctx.params, L = ctx.lod, K = kit(ctx), r = rng(p.seed ?? 11), ox = p.ox ?? -32, oz = p.oz ?? 6;
  const pts = FEN_PATH.map(([x, z]) => [x - ox, z - oz]);
  const segs = []; let tot = 0;
  for (let i = 0; i < pts.length - 1; i++) { const len = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]); segs.push({ a: pts[i], b: pts[i + 1], len, s0: tot }); tot += len; }
  const at = (s) => {
    const g = segs.find((q) => s <= q.s0 + q.len) ?? segs[segs.length - 1], t = Math.max(0, Math.min(1, (s - g.s0) / g.len));
    const dx = (g.b[0] - g.a[0]) / g.len, dz = (g.b[1] - g.a[1]) / g.len;
    return { x: g.a[0] + (g.b[0] - g.a[0]) * t, z: g.a[1] + (g.b[1] - g.a[1]) * t, dx, dz };
  };
  ctx.flat();
  // flagstones: whole and level at the mouth, sinking, tilting and thinning out westward
  const FS = 25;
  if (L <= 3) for (let s = 0.6; s < FS; s += 0.8) {
    const f = s / FS;
    for (let o = -3.3; o <= 3.31; o += 0.82) {
      const keep = 1 - f * 0.7 - Math.max(0, Math.abs(o) - 2.1) * 0.4;
      if (r() > keep || (L === 3 && r() < 0.5)) continue;
      const q = at(s + (r() - 0.5) * 0.12), jo = o + (r() - 0.5) * 0.14, x = q.x - q.dz * jo, z = q.z + q.dx * jo;
      const top = 0.07 - f * 0.11 + (r() - 0.5) * 0.03, tilt = 2 + f * 11, sx = 0.66 + r() * 0.12, sz = 0.7 + r() * 0.1;
      ctx.albedo(TX.stone); ctx.roughness(0.4); ctx.metalness(0); ctx.color(STONE[Math.floor(r() * STONE.length)]);
      K.push().t(x, 0, z).ry(Math.atan2(-q.dz, q.dx) / D + (r() - 0.5) * 8).rx((r() - 0.5) * tilt).rz((r() - 0.5) * tilt);
      if (L <= 2) K.cbox(0, top - 0.2, 0, sx, 0.2, sz, 0.05); else K.box(0, top - 0.2, 0, sx, 0.2, sz);
      if (L <= 2 && r() < 0.25 + f * 0.4) { ctx.albedo(TX.moss); ctx.color("oklch(.62 .07 130)"); ctx.roughness(0.9); blob(K, r, (r() - 0.5) * 0.3, top + 0.005, (r() - 0.5) * 0.3, 0.18 + r() * 0.12, 0.16 + r() * 0.12, 7); }
      K.pop();
    }
  }
  // black mud seeping through where the road sinks
  if (L <= 3) { ctx.albedo(TX.mud); ctx.roughness(0.12);
    for (let i = 0; i < 16; i++) { const s = 13 + r() * (tot - 13), q = at(s), o = (r() - 0.5) * 7.5; ctx.color(r() < 0.5 ? "oklch(.5 .02 60)" : "oklch(.42 .02 70)"); blob(K, r, q.x - q.dz * o, 0.02 + r() * 0.01, q.z + q.dx * o, 0.8 + r() * 1.3, 0.6 + r() * 1, 9); } }
  // the boardwalk takes over
  const b0 = at(18.5), bw = [[b0.x, b0.z]];
  for (const g of segs) if (g.s0 > 18.5) bw.push(g.a);
  const last = segs[segs.length - 1]; bw.push([last.b[0] + (last.b[0] - last.a[0]) / last.len * 0.6, last.b[1] + (last.b[1] - last.a[1]) / last.len * 0.6]);
  plankRun(ctx, K, r, bw, 2.6, 0.2, L);
  // edges: shrubs near the road, reeds thickening toward the water
  if (L <= 3) for (let s = 1; s < tot; s += 1.05) for (const side of [-1, 1]) {
    const f = s / tot, q = at(s);
    if (r() < 0.3 + f * 0.6) { const o = side * (3.9 + r() * 1.5); reeds(ctx, K, r, q.x - q.dz * o, q.z + q.dx * o, (L <= 2 ? 9 : 5) + Math.floor(r() * 6), 0.9 + r() * 0.8 * (0.5 + f), 0.02); }
    if (r() < 0.28 * (1 - f * 0.5)) { const o = side * (4.1 + r() * 1.4); shrub(ctx, K, r, q.x - q.dz * o, q.z + q.dx * o, 0.9 + r() * 0.7); }
  }
}
export function collider() { return null; }
