// A drowned tree of the Lanternmere: a twisted bare trunk on flared roots, crooked forking limbs and
// hanging grey moss. params: { h, girth, lean (local −Z), seed }. Collider: the trunk only.
import { kit, rng, V } from "./vf-kit.js";
import { TX, strand } from "./fen-kit.js";
export function geometry(ctx) {
  const p = ctx.params, L = ctx.lod, K = kit(ctx), r = rng(p.seed ?? 1), h = p.h ?? 5, g = p.girth ?? 1;
  ctx.flat(); ctx.albedo(TX.bark); ctx.roughness(0.9); ctx.metalness(0); ctx.color("oklch(.62 .012 95)");
  const n = L <= 2 ? 6 : 4, sl = h / n, sides = L <= 2 ? 7 : 5;
  let dir = V.norm([(r() - 0.5) * 0.3, 1, -(p.lean ?? 0.25)]), pos = [0, -0.1, 0];
  const spine = [pos];
  for (let i = 0; i < n; i++) { dir = V.norm(V.add(dir, [(r() - 0.5) * 0.7, 0.12, (r() - 0.5) * 0.7])); pos = V.add(pos, V.mul(dir, sl)); spine.push(pos); }
  const rad = (i) => (0.34 - (i / n) * 0.27) * g;
  for (let i = 0; i < n; i++) { const d = V.norm(V.sub(spine[i + 1], spine[i])); K.tube(i ? V.sub(spine[i], V.mul(d, 0.08)) : spine[i], spine[i + 1], rad(i), rad(i + 1), sides, i === n - 1); }
  // flared roots clawing into the mud
  for (let k = 0; k < (L <= 3 ? 6 : 3); k++) { const a = (k / 6) * 6.283 + r() * 0.6, d = 0.9 + r() * 0.7; K.tube([0, 0.6, 0], [Math.cos(a) * d * g, -0.12, Math.sin(a) * d * g], 0.22 * g, 0.04, 5, true); }
  // crooked limbs
  const tips = [];
  const limb = (p0, d, len, rr, dep) => {
    let q = p0, dd = d;
    for (let s = 0; s < 2; s++) { dd = V.norm(V.add(dd, [(r() - 0.5) * 0.7, -0.08 + (r() - 0.5) * 0.3, (r() - 0.5) * 0.7])); const q2 = V.add(q, V.mul(dd, len / 2)); K.tube(q, q2, rr * (1 - s * 0.35), rr * (1 - (s + 1) * 0.35), Math.max(4, sides - 2)); q = q2; tips.push(q); }
    if (dep > 0 && L <= 3) for (let k = 0; k < 2; k++) limb(q, V.norm(V.add(dd, [(r() - 0.5) * 1.3, 0.3, (r() - 0.5) * 1.3])), len * 0.6, rr * 0.5, dep - 1);
  };
  for (let i = 2; i <= n; i++) for (let k = 0, m = i === n ? 3 : 1 + (r() < 0.5 ? 1 : 0); k < m; k++) {
    const a = r() * 6.283; limb(spine[i], V.norm([Math.cos(a), 0.35 + r() * 0.5, Math.sin(a)]), (1.2 + r() * 1.1) * (1 - i / (n * 2.2)) * h / 5, rad(i) * 0.55, L <= 2 ? 2 : 1);
  }
  // hanging moss, grey-green, off the limbs
  if (L <= 3) { ctx.albedo(null); ctx.roughness(1);
    for (const t of tips) if (r() < 0.55) { ctx.color(r() < 0.5 ? "oklch(.66 .03 120)" : "oklch(.58 .035 135)"); for (let k = 0, m = 1 + Math.floor(r() * 3); k < m; k++) strand(K, r, [t[0] + (r() - 0.5) * 0.3, t[1], t[2] + (r() - 0.5) * 0.3], 0.5 + r() * 1.2, 0.08 + r() * 0.08); } }
  // a ring of moss and waterline stain at the foot
  if (L <= 3) { ctx.albedo(TX.moss); ctx.color("oklch(.6 .07 128)"); ctx.roughness(0.95); K.loft([K.circ(0, -0.05, 0, rad(0) * 1.45 + 0.04, rad(0) * 1.45 + 0.04, 8), K.circ(0, 0.35 + r() * 0.2, 0, rad(0) * 1.06 + 0.02, rad(0) * 1.06 + 0.02, 8)], false, false); }
}
export function collider(ctx) { const K = kit(ctx), w = 0.32 * (ctx.params.girth ?? 1); K.bb(-w, 0, -w, w, 2.4, w); }
