// A dead leafless tree: grey bark, root flare clawing the ground, a leaning trunk forking into
// crooked bare limbs. params.h = height; the seed shapes it.
import { xf, tube, add, mul, norm, rnd } from "./hub-kit.js";
export function geometry(ctx) {
  const h = (ctx.params && ctx.params.h) || 5, lod = ctx.lod ?? 1, T = xf();
  if (lod <= 2) ctx.smooth(); else ctx.flat(); ctx.roughness(1);
  ctx.albedo("cdn/texture-dead-grey-weathered-tree-bark.png"); ctx.color("oklch(0.78 0.012 60)");
  const sides = lod <= 1 ? 9 : lod <= 2 ? 7 : 5, ends = [];
  for (let i = 0, nr = lod <= 2 ? 7 : lod <= 3 ? 5 : 0; i < nr; i++) {
    const a = (i / nr) * 6.28 + rnd(ctx, -0.3, 0.3), L = rnd(ctx, 0.8, 1.5), k = rnd(ctx, -0.25, 0.25);
    tube(ctx, T, [[Math.cos(a) * 0.12, 0.5, Math.sin(a) * 0.12], [Math.cos(a) * L * 0.35, 0.16, Math.sin(a) * L * 0.35], [Math.cos(a + k) * L * 0.7, 0.0, Math.sin(a + k) * L * 0.7], [Math.cos(a + k * 2) * L, -0.08, Math.sin(a + k * 2) * L]], [0.2, 0.12, 0.06, 0.02], lod <= 2 ? 6 : 5);
  }
  const lean = [rnd(ctx, -0.25, 0.25), 1, rnd(ctx, -0.25, 0.25)], trunk = [[0, 0, 0]], tr = [0.3];
  const segs = 5, th = h * rnd(ctx, 0.45, 0.6);
  for (let i = 1; i <= segs; i++) { const p = trunk[i - 1]; trunk.push(add(p, add(mul(norm(lean), th / segs), [rnd(ctx, -0.12, 0.12), 0, rnd(ctx, -0.12, 0.12)]))); tr.push(0.3 - (0.14 * i) / segs); }
  tube(ctx, T, trunk, tr, sides + 1, false, true);
  const depthMax = lod <= 2 ? 3 : lod === 3 ? 2 : 1;
  const branch = (p, d, len, r, depth) => {
    const pts = [p], rs = [r]; let dir = d;
    for (let i = 1; i <= 3; i++) { dir = norm(add(dir, [rnd(ctx, -0.35, 0.35), rnd(ctx, -0.1, 0.25), rnd(ctx, -0.35, 0.35)])); pts.push(add(pts[i - 1], mul(dir, len / 3))); rs.push(r * (1 - i * 0.28)); }
    tube(ctx, T, pts, rs, Math.max(4, sides - depth), false, true);
    if (depth >= depthMax) { ends.push([pts[3], dir]); return; }
    const end = pts[3], kids = depth === 0 ? 3 : 2;
    for (let k = 0; k < kids; k++) { const a = rnd(ctx, 0, 6.28); branch(end, norm(add(dir, [Math.cos(a) * 0.9, rnd(ctx, 0, 0.5), Math.sin(a) * 0.9])), len * rnd(ctx, 0.55, 0.75), rs[3] * 0.95, depth + 1); }
    if (depth < depthMax - 1) { const a = rnd(ctx, 0, 6.28); branch(pts[1], norm([Math.cos(a), 0.4, Math.sin(a)]), len * 0.5, rs[1] * 0.6, depth + 2); }
  };
  const top = trunk[segs];
  for (let k = 0; k < 3; k++) { const a = (k / 3) * 6.28 + rnd(ctx, -0.4, 0.4); branch(top, norm([Math.cos(a) * 0.8, 1, Math.sin(a) * 0.8]), h * rnd(ctx, 0.28, 0.4), 0.15, 0); }
  // burls on the trunk and a fan of fine twigs off every limb end: the silhouette reads as grain against the sky
  if (lod <= 2) for (let i = 0; i < 3; i++) { const q = trunk[1 + Math.floor(rnd(ctx, 0, 3))], a = rnd(ctx, 0, 6.28), r = rnd(ctx, 0.09, 0.15); tube(ctx, T, [[q[0] + Math.cos(a) * 0.12, q[1] - r, q[2] + Math.sin(a) * 0.12], [q[0] + Math.cos(a) * (0.2 + r * 0.5), q[1], q[2] + Math.sin(a) * (0.2 + r * 0.5)], [q[0] + Math.cos(a) * 0.12, q[1] + r, q[2] + Math.sin(a) * 0.12]], [r * 0.5, r, r * 0.4], 6, true, true); }
  if (lod <= 2) for (const [p, d] of ends) for (let k = 0, n = lod <= 1 ? 4 : 2; k < n; k++) {
    const len = rnd(ctx, 0.3, 0.75), d1 = norm(add(d, [rnd(ctx, -0.8, 0.8), rnd(ctx, -0.1, 0.6), rnd(ctx, -0.8, 0.8)]));
    const m = add(p, mul(d1, len * 0.55)), e = add(m, mul(norm(add(d1, [rnd(ctx, -0.5, 0.5), rnd(ctx, -0.2, 0.3), rnd(ctx, -0.5, 0.5)])), len * 0.45));
    tube(ctx, T, [p, m, e], [0.022, 0.011, 0.003], 4, false, true);
    if (lod <= 1 && ctx.random() < 0.5) tube(ctx, T, [m, add(m, mul(norm(add(d1, [rnd(ctx, -0.9, 0.9), 0.3, rnd(ctx, -0.9, 0.9)])), len * 0.35))], [0.009, 0.002], 3, false, true);
  }
}
export function collider(ctx) { const h = (ctx.params && ctx.params.h) || 5; ctx.quad; return { kind: "box", width: 0.7, height: h * 0.5, depth: 0.7 }; }
