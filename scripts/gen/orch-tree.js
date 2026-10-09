// A dead apple tree of Saint Corvin's orchard: a short twisted black trunk on clawing roots, burls,
// limbs flung wide and drooping. params: h, lumps (rotten wax apples on branch tips), hang:
// 0 none | 1 a hanging limb for a hanged figure (child at hookOf(h)) | 2 an empty noose | 3 a cut rope.
// The hanging limb always reaches local -Z.
import { xf, tube, add, mul, norm, rnd, rock } from "./hub-kit.js";
import { TEX, WAXC, puddle, candleBed, boxC } from "./shapes.js";
import { BARK, rope, fray, noose, waxApple } from "./orch-kit.js";
const sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const hookOf = (h) => [0, +(h * 0.62 + 0.03).toFixed(3), -2.1];
export function geometry(ctx) {
  const h = ctx.params.h ?? 5, hang = ctx.params.hang ?? 0, lumps = ctx.params.lumps ?? 0, lod = ctx.lod ?? 1, T = xf();
  const bark = () => { ctx.albedo(BARK); ctx.color("oklch(0.88 0.008 60)"); ctx.roughness(1); ctx.metalness(0); if (lod <= 2) ctx.smooth(); else ctx.flat(); };
  bark();
  const sides = lod <= 1 ? 10 : lod <= 2 ? 8 : 5, ends = [];
  if (lod <= 3) for (let i = 0; i < 6; i++) {
    const a = (i / 6) * 6.28 + rnd(ctx, -0.3, 0.3), Lr = rnd(ctx, 0.9, 1.5);
    tube(ctx, T, [[Math.cos(a) * 0.14, 0.5, Math.sin(a) * 0.14], [Math.cos(a) * Lr * 0.42, 0.14, Math.sin(a) * Lr * 0.42], [Math.cos(a) * Lr * 0.8, 0.02, Math.sin(a) * Lr * 0.8], [Math.cos(a + 0.2) * Lr, -0.06, Math.sin(a + 0.2) * Lr]], [0.21, 0.12, 0.06, 0.02], 5);
  }
  const lean = [rnd(ctx, -0.2, 0.2), 1, rnd(ctx, -0.2, 0.2)], trunk = [[0, 0, 0]], tr = [0.36];
  const segs = 6, th = h * rnd(ctx, 0.34, 0.42);
  for (let i = 1; i <= segs; i++) { const p = trunk[i - 1]; trunk.push(add(p, add(mul(norm(lean), th / segs), [rnd(ctx, -0.16, 0.16), 0, rnd(ctx, -0.16, 0.16)]))); tr.push(0.36 - (0.16 * i) / segs); }
  tube(ctx, T, trunk, tr, sides + 1, false, true);
  if (lod <= 2) for (let i = 0; i < 3; i++) { const p = trunk[1 + Math.floor(rnd(ctx, 0, 4))]; const a = rnd(ctx, 0, 6.28); rock(ctx, xf([p[0] + Math.cos(a) * 0.22, p[1] - 0.08, p[2] + Math.sin(a) * 0.22]), rnd(ctx, 0.1, 0.16), { sy: 0.9, rough: 0.6 }); }
  const depthMax = lod <= 2 ? 3 : lod === 3 ? 2 : 1, tips = [];
  const branch = (p, d, len, r, depth) => {
    const pts = [p], rs = [r]; let dir = d;
    for (let i = 1; i <= 3; i++) { dir = norm(add(dir, [rnd(ctx, -0.45, 0.45), rnd(ctx, -0.3, 0.15), rnd(ctx, -0.45, 0.45)])); pts.push(add(pts[i - 1], mul(dir, len / 3))); rs.push(r * (1 - i * 0.27)); }
    tube(ctx, T, pts, rs, Math.max(4, sides - depth * 2), false, true);
    if (depth >= depthMax) { tips.push(pts[3], pts[2]); ends.push([pts[3], dir]); return; }
    const end = pts[3], kids = depth === 0 ? 3 : 2;
    for (let k = 0; k < kids; k++) { const a = rnd(ctx, 0, 6.28); branch(end, norm(add(dir, [Math.cos(a) * 1.0, rnd(ctx, -0.2, 0.4), Math.sin(a) * 1.0])), len * rnd(ctx, 0.55, 0.72), rs[3] * 0.95, depth + 1); }
    if (depth < depthMax - 1) { const a = rnd(ctx, 0, 6.28); branch(pts[1], norm([Math.cos(a), 0.25, Math.sin(a)]), len * 0.5, rs[1] * 0.6, depth + 2); }
  };
  const top = trunk[segs];
  for (let k = 0; k < 4; k++) { const a = (k / 4) * 6.28 + rnd(ctx, -0.4, 0.4); branch(top, norm([Math.cos(a), 0.6, Math.sin(a)]), h * rnd(ctx, 0.36, 0.48), 0.17, 0); }
  if (hang) {
    const hk = hookOf(h), hy = hk[1] - 0.03, base = trunk[4];
    tube(ctx, T, [base, [0.12, hy * 0.86, -0.6], [0.04, hy + 0.12, -1.4], [0, hy + 0.08, -2.1], [-0.06, hy + 0.15, -2.75]], [0.17, 0.12, 0.08, 0.06, 0.025], sides, false, true);
    { const pts = []; for (let j = 0; j <= 10; j++) { const a = (j / 10) * 6.283; pts.push([Math.cos(a) * 0.08, hy + 0.08 + Math.sin(a) * 0.08, -2.1 + Math.sin(a * 2) * 0.01]); } rope(ctx, pts, 0.018); }
    if (hang === 1) {
      ctx.albedo(TEX.wax); ctx.roughness(0.5); ctx.smooth(); ctx.color(WAXC[2]);
      puddle(ctx, 0, 0, -2.1, 0.55, 0.45, 0.035);
      if (lod <= 2) candleBed(ctx, 0.35, 0, -1.2, 0.2, 0.15, 4, { lit: 0.4, hMax: 0.14 });
    } else if (hang === 2) noose(ctx, hk, 0.95);
    else { rope(ctx, [hk, [0.02, hk[1] - 0.55, -2.1]], 0.022); fray(ctx, [0.02, hk[1] - 0.55, -2.1], 6, 0.12); }
    bark();
  }
  // fine twigs off every branch end, a few rust leaves still clinging: the crown reads as grain, not tubes
  if (lod <= 2) {
    const leaves = [], nT = lod <= 1 ? 4 : 2;
    for (const [p, d] of ends) for (let k = 0; k < nT; k++) {
      const len = rnd(ctx, 0.35, 0.8), d1 = norm(add(d, [rnd(ctx, -0.7, 0.7), rnd(ctx, -0.25, 0.45), rnd(ctx, -0.7, 0.7)]));
      const m = add(p, mul(d1, len * 0.5)), d2 = norm(add(d1, [rnd(ctx, -0.5, 0.5), rnd(ctx, -0.35, 0.1), rnd(ctx, -0.5, 0.5)])), e = add(m, mul(d2, len * 0.5));
      tube(ctx, T, [p, m, e], [0.026, 0.013, 0.004], 4, false, true);
      if (ctx.random() < 0.45) leaves.push([e, d2]);
      if (lod <= 1 && ctx.random() < 0.5) { const f = add(m, mul(norm(add(d2, [rnd(ctx, -0.8, 0.8), 0.2, rnd(ctx, -0.8, 0.8)])), len * 0.35)); tube(ctx, T, [m, f], [0.01, 0.003], 3, false, true); if (ctx.random() < 0.4) leaves.push([f, d2]); }
    }
    if (leaves.length) {
      ctx.albedo(null); ctx.flat(); ctx.roughness(0.85);
      for (const [e, d] of leaves) {
        ctx.color(["oklch(0.38 0.09 38)", "oklch(0.3 0.07 28)", "oklch(0.44 0.08 60)"][Math.floor(ctx.random() * 3)]);
        const s = rnd(ctx, 0.05, 0.09), u = norm([rnd(ctx, -1, 1), rnd(ctx, -1, -0.2), rnd(ctx, -1, 1)]), v = norm([u[2], rnd(ctx, -0.3, 0.3), -u[0]]);
        const c = add(e, mul(u, s * 0.9)), a = add(c, mul(u, s)), b = add(c, mul(v, s * 0.45)), q = sub3(c, mul(u, s)), r = sub3(c, mul(v, s * 0.45));
        ctx.quad(...a, ...b, ...q, ...r);
      }
      bark();
    }
  }
  if (lod <= 2 && tips.length) for (let k = 0; k < lumps; k++) { const p = tips[Math.floor(ctx.random() * tips.length)]; waxApple(ctx, p, 0.05 + ctx.random() * 0.035, 0.08 + ctx.random() * 0.3); }
}
export function collider(ctx) { const h = ctx.params.h ?? 5; boxC(ctx, -0.36, 0.36, 0, h * 0.45, -0.36, 0.36); }
