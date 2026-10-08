// Veilfall ruin kit: broken ashlar walls and iron braziers on stone plinths.
// params.kind: "wall" { len, h, t } | "brazier" { h }. Origin at the foot, centred; walls run along X.
const C = [[-1,-1,-1],[1,-1,-1],[-1,1,-1],[1,1,-1],[-1,-1,1],[1,-1,1],[-1,1,1],[1,1,1]];
const F = [[1,3,7,5],[0,4,6,2],[2,6,7,3],[0,1,5,4],[4,5,7,6],[0,2,3,1]]; // each CCW from outside
function box(ctx, cx, cy, cz, hx, hy, hz, yaw = 0, skipBottom = true) {
  const c = Math.cos(yaw), s = Math.sin(yaw);
  const P = C.map(([x, y, z]) => { const lx = x * hx, lz = z * hz; return [cx + lx * c + lz * s, cy + y * hy, cz - lx * s + lz * c]; });
  F.forEach((f, i) => { if (skipBottom && i === 3) return; ctx.quad(...P[f[0]], ...P[f[1]], ...P[f[2]], ...P[f[3]]); });
}
function wall(ctx) {
  const { len = 6, h = 2.6, t = 0.8 } = ctx.params, R = () => ctx.random();
  ctx.flat(); ctx.albedo("cdn/texture-weathered-dark-ashlar-stone-blocks-soot-stained.png"); ctx.color("oklch(0.93 0.01 250)"); ctx.roughness(0.92);
  const top = (u) => h * (0.3 + 0.7 * Math.abs(Math.sin(u * 0.9 + (ctx.params.s ?? 0) * 1.7) * 0.6 + Math.sin(u * 2.3) * 0.4));
  // rubble core so courses never show sky between blocks
  let y = 0, row = 0;
  while (y < h) {
    const ch = 0.34 + R() * 0.12;
    let x = -len / 2 + (row % 2 ? 0.3 : 0);
    while (x < len / 2) {
      const bl = Math.min(0.55 + R() * 0.45, len / 2 - x);
      const u = x + bl / 2;
      if (bl > 0.15 && y + ch <= top(u + len / 2) + 0.05 && !(R() < 0.05 && y > 0.6)) {
        const sag = (R() - 0.5) * 0.06;
        box(ctx, u, y + ch / 2 + sag, (R() - 0.5) * 0.06, bl / 2 - 0.015, ch / 2 - 0.012, t / 2 - R() * 0.05, (R() - 0.5) * 0.04, y > 0);
      }
      x += bl;
    }
    y += ch; row++;
  }
  if (ctx.lod <= 2) { // fallen blocks at the foot, both faces
    ctx.color("oklch(0.85 0.01 250)");
    for (let i = 0; i < Math.round(len * 1.4); i++) {
      const s = 0.18 + R() * 0.22, side = R() < 0.5 ? -1 : 1;
      box(ctx, (R() - 0.5) * len * 1.1, s * 0.6, side * (t / 2 + 0.2 + R() * 1.1), s * 1.3, s * 0.7, s, R() * 3);
    }
  }
  // a mossy cap where the wall still stands tall
  ctx.albedo(null); ctx.color("oklch(0.33 0.04 140)"); ctx.roughness(1);
  for (let u = -len / 2 + 0.4; u < len / 2; u += 0.9) { const ht = top(u + len / 2); if (ht > h * 0.7 && R() < 0.5) box(ctx, u, ht - 0.02, 0, 0.35, 0.04, t / 2 + 0.02, R()); }
}
function brazier(ctx) {
  const { h = 1.5 } = ctx.params, R = () => ctx.random();
  ctx.flat();
  ctx.albedo("cdn/texture-weathered-dark-ashlar-stone-blocks-soot-stained.png"); ctx.color("oklch(0.9 0.01 250)"); ctx.roughness(0.9);
  box(ctx, 0, 0.18, 0, 0.5, 0.18, 0.5);            // footing
  box(ctx, 0, 0.42, 0, 0.42, 0.06, 0.42, 0, false); // chamfer step
  box(ctx, 0, 0.5 + (h - 1.05) / 2, 0, 0.22, (h - 1.05) / 2, 0.22); // shaft
  const top = h - 0.55;
  box(ctx, 0, top + 0.05, 0, 0.32, 0.05, 0.32, 0, false);
  ctx.albedo("cdn/texture-blackened-wrought-iron-rust-pitted.png"); ctx.color("oklch(0.95 0 0)"); ctx.metalness(0.7); ctx.roughness(0.55);
  const n = ctx.lod <= 2 ? 12 : 6, r0 = 0.28, r1 = 0.55, bh = 0.42;
  for (let i = 0; i < n; i++) { // splayed iron slats of the basket
    const a = (i / n) * Math.PI * 2, rm = (r0 + r1) / 2;
    const cx = Math.cos(a) * rm, cz = Math.sin(a) * rm;
    const lean = Math.atan2(r1 - r0, bh);
    const c = Math.cos(a), s = Math.sin(a);
    // slat as a thin box leaning outward: build by hand from 8 corners
    const P = C.map(([x, y, z]) => { const yy = y * bh / 2, off = Math.tan(lean) * yy; const lx = x * 0.035 + off, lz = z * 0.07; return [cx + lx * c - lz * s, top + 0.1 + bh / 2 + yy, cz + lx * s + lz * c]; });
    F.forEach((f) => ctx.quad(...P[f[0]], ...P[f[1]], ...P[f[2]], ...P[f[3]]));
  }
  for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; box(ctx, Math.cos(a) * r1, top + 0.1 + bh, Math.sin(a) * r1, 0.04, 0.03, 0.12, -a, false); } // rim
  box(ctx, 0, top + 0.12, 0, r0, 0.03, r0, 0, false); // grate
  ctx.albedo(null); ctx.metalness(0); ctx.roughness(1); ctx.color("oklch(0.25 0.02 40)"); ctx.emissive(2.4, 0.7, 0.15);
  for (let i = 0; i < 14; i++) { const a = R() * 6.28, rr = R() * 0.32; box(ctx, Math.cos(a) * rr, top + 0.2 + R() * 0.12, Math.sin(a) * rr, 0.07 + R() * 0.05, 0.05, 0.06 + R() * 0.05, R() * 3, false); }
  ctx.emissive(null);
}
export function geometry(ctx) { if (ctx.params.kind === "brazier") brazier(ctx); else wall(ctx); }
export function collider(ctx) {
  if (ctx.params.kind === "brazier") return { kind: "box", width: 1.0, height: ctx.params.h ?? 1.5, depth: 1.0 };
  return { kind: "box", width: ctx.params.len ?? 6, height: (ctx.params.h ?? 2.6) * 0.6, depth: ctx.params.t ?? 0.8 };
}
