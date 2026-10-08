// A dead leafless tree: grey bark, root flare clawing the ground, a leaning trunk forking into
// crooked bare limbs. params.h = height; the seed shapes it.
import { xf, tube, add, mul, norm, rnd } from "./hub-kit.js";
export function geometry(ctx) {
  const h = (ctx.params && ctx.params.h) || 5, lod = ctx.lod ?? 1, T = xf();
  ctx.flat(); ctx.roughness(1);
  ctx.albedo("cdn/texture-dead-grey-weathered-tree-bark.png"); ctx.color("oklch(0.78 0.012 60)");
  const sides = lod <= 2 ? 7 : 5;
  for (let i = 0; i < (lod <= 3 ? 5 : 0); i++) {
    const a = (i / 5) * 6.28 + rnd(ctx, -0.3, 0.3), L = rnd(ctx, 0.8, 1.3);
    tube(ctx, T, [[Math.cos(a) * 0.12, 0.45, Math.sin(a) * 0.12], [Math.cos(a) * L * 0.45, 0.1, Math.sin(a) * L * 0.45], [Math.cos(a) * L, -0.05, Math.sin(a) * L]], [0.18, 0.1, 0.03], 5);
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
    if (depth >= depthMax) return;
    const end = pts[3], kids = depth === 0 ? 3 : 2;
    for (let k = 0; k < kids; k++) { const a = rnd(ctx, 0, 6.28); branch(end, norm(add(dir, [Math.cos(a) * 0.9, rnd(ctx, 0, 0.5), Math.sin(a) * 0.9])), len * rnd(ctx, 0.55, 0.75), rs[3] * 0.95, depth + 1); }
    if (depth < depthMax - 1) { const a = rnd(ctx, 0, 6.28); branch(pts[1], norm([Math.cos(a), 0.4, Math.sin(a)]), len * 0.5, rs[1] * 0.6, depth + 2); }
  };
  const top = trunk[segs];
  for (let k = 0; k < 3; k++) { const a = (k / 3) * 6.28 + rnd(ctx, -0.4, 0.4); branch(top, norm([Math.cos(a) * 0.8, 1, Math.sin(a) * 0.8]), h * rnd(ctx, 0.28, 0.4), 0.15, 0); }
}
export function collider(ctx) { const h = (ctx.params && ctx.params.h) || 5; ctx.quad; return { kind: "box", width: 0.7, height: h * 0.5, depth: 0.7 }; }
