// Veilbloom: the flowers that grew back over the pilgrim road after the lanterns failed. Feet at y 0.
// params.kind: "spire" (foxglove-like stalks hung with pale violet bells, faintly lit),
// "star" (a low cushion of five-petal ember-gold stars), "lily" (one tall lantern-lily, a glowing teal bulb).
const PAL = {
  spire: ["oklch(0.72 0.12 300)", "oklch(0.78 0.09 320)", "oklch(0.7 0.11 270)"],
  star: ["oklch(0.82 0.13 80)", "oklch(0.78 0.14 60)", "oklch(0.86 0.08 95)"],
};
const LEAF = "oklch(0.45 0.09 150)", STEM = "oklch(0.5 0.08 140)";

function fineBlade(ctx, x, z, a, len, w, lean) { // a leaf folded on its midrib, rising then curling its tip down
  const c = Math.cos(a), s = Math.sin(a), N = 4, P = [];
  for (let i = 0; i <= N; i++) { const t = i / N; P.push([x + c * len * t, 0.01 + lean * Math.sin(t * 2.6) * 1.1 - (t > 0.7 ? (t - 0.7) * lean * 0.8 : 0), z + s * len * t, w * Math.sin(Math.min(1, t * 1.25) * Math.PI) * (t < 0.95 ? 1 : 0.3)]); }
  for (let i = 0; i < N; i++) { const [x0, y0, z0, w0] = P[i], [x1, y1, z1, w1] = P[i + 1], f0 = w0 * 0.35, f1 = w1 * 0.35;
    ctx.quad(x0, y0 + f0, z0, x1, y1 + f1, z1, x1 - s * w1, y1, z1 + c * w1, x0 - s * w0, y0, z0 + c * w0);
    ctx.quad(x1, y1 + f1, z1, x0, y0 + f0, z0, x0 + s * w0, y0, z0 - c * w0, x1 + s * w1, y1, z1 - c * w1); }
}
function blade(ctx, x, z, a, len, w, lean) { // a leaf lying out from the base
  if (blade.fine) return fineBlade(ctx, x, z, a, len, w, lean);
  const c = Math.cos(a), s = Math.sin(a), tx = x + c * len, tz = z + s * len, mx = x + c * len * 0.5, mz = z + s * len * 0.5;
  ctx.tri(x - s * w * 0.3, 0.01, z + c * w * 0.3, mx - s * w, lean * 0.6, mz + c * w, tx, lean, tz);
  ctx.tri(x + s * w * 0.3, 0.01, z - c * w * 0.3, tx, lean, tz, mx + s * w, lean * 0.6, mz - c * w);
  ctx.tri(x - s * w * 0.3, 0.01, z + c * w * 0.3, tx, lean, tz, x + s * w * 0.3, 0.01, z - c * w * 0.3);
}
function stalk(ctx, x0, z0, x1, h, z1, r, sides) {
  for (let i = 0; i < sides; i++) { const t0 = (i / sides) * 6.283, t1 = ((i + 1) / sides) * 6.283;
    ctx.quad(x0 + Math.cos(t0) * r, 0, z0 + Math.sin(t0) * r, x0 + Math.cos(t1) * r, 0, z0 + Math.sin(t1) * r,
      x1 + Math.cos(t1) * r * 0.5, h, z1 + Math.sin(t1) * r * 0.5, x1 + Math.cos(t0) * r * 0.5, h, z1 + Math.sin(t0) * r * 0.5); }
}
function lobes(ctx, x, y, z, r) { // five petal lips curling out of the bell mouth, a glowing pistil hanging below
  const my = y - r * 1.3;
  for (let p = 0; p < 5; p++) { const a = (p / 5) * 6.283, a0 = a - 0.62, a1 = a + 0.62;
    const tip = [x + Math.cos(a) * r * 1.55, my + r * 0.18, z + Math.sin(a) * r * 1.55];
    ctx.tri(x + Math.cos(a1) * r, my, z + Math.sin(a1) * r, x + Math.cos(a0) * r, my, z + Math.sin(a0) * r, ...tip);
    ctx.tri(x + Math.cos(a0) * r, my, z + Math.sin(a0) * r, x + Math.cos(a1) * r, my, z + Math.sin(a1) * r, ...tip); }
  ctx.color("oklch(0.88 0.12 85)"); ctx.emissive(0.9, 0.7, 0.25);
  const w = r * 0.12; ctx.quad(x - w, my + r * 0.4, z, x + w, my + r * 0.4, z, x + w * 0.5, my - r * 0.55, z, x - w * 0.5, my - r * 0.55, z);
}
function bell(ctx, x, y, z, r, sides) { // a hanging bell: closed top, flared open mouth
  for (let i = 0; i < sides; i++) { const t0 = (i / sides) * 6.283, t1 = ((i + 1) / sides) * 6.283;
    ctx.tri(x, y + r * 0.2, z, x + Math.cos(t1) * r * 0.55, y, z + Math.sin(t1) * r * 0.55, x + Math.cos(t0) * r * 0.55, y, z + Math.sin(t0) * r * 0.55);
    ctx.quad(x + Math.cos(t0) * r * 0.55, y, z + Math.sin(t0) * r * 0.55, x + Math.cos(t1) * r * 0.55, y, z + Math.sin(t1) * r * 0.55,
      x + Math.cos(t1) * r, y - r * 1.3, z + Math.sin(t1) * r, x + Math.cos(t0) * r, y - r * 1.3, z + Math.sin(t0) * r); }
}
function star(ctx, x, y, z, r, rot) { // a flat five-petal star facing up
  for (let p = 0; p < 5; p++) { const a = rot + (p / 5) * 6.283, b = a + 0.45, c = a - 0.45;
    ctx.tri(x, y + 0.004, z, x + Math.cos(c) * r * 0.45, y + r * 0.1, z + Math.sin(c) * r * 0.45, x + Math.cos(a) * r, y + r * 0.25, z + Math.sin(a) * r);
    ctx.tri(x, y + 0.004, z, x + Math.cos(a) * r, y + r * 0.25, z + Math.sin(a) * r, x + Math.cos(b) * r * 0.45, y + r * 0.1, z + Math.sin(b) * r * 0.45); }
}

export function geometry(ctx) {
  const r = () => ctx.random(), lod = ctx.lod ?? 1, kind = ctx.params.kind ?? "spire", far = lod >= 3;
  const sides = far ? 3 : 5;
  blade.fine = lod <= 1;
  if (lod <= 1) ctx.smooth(); else ctx.flat(); ctx.roughness(0.7); ctx.metalness(0);
  // a rosette of leaves at the foot of every clump
  ctx.color(LEAF);
  const leaves = far ? 3 : 6;
  for (let i = 0; i < leaves; i++) blade(ctx, 0, 0, (i / leaves) * 6.283 + r() * 0.5, 0.12 + r() * 0.1, 0.035, 0.03 + r() * 0.04);

  if (kind === "spire") {
    const n = far ? 2 : 3 + Math.floor(r() * 3);
    for (let s = 0; s < n; s++) {
      const a = r() * 6.283, d = s === 0 ? 0 : 0.05 + r() * 0.08, x = Math.cos(a) * d, z = Math.sin(a) * d;
      const h = 0.45 + r() * 0.45, tx = x + (r() - 0.5) * 0.08, tz = z + (r() - 0.5) * 0.08, col = PAL.spire[Math.floor(r() * 3)];
      ctx.color(STEM); ctx.emissive(null); stalk(ctx, x, z, tx, h, tz, 0.012, sides);
      const bells = far ? 3 : 6 + Math.floor(r() * 4);
      ctx.color(col); ctx.emissive(0.35, 0.18, 0.55);
      for (let b = 0; b < bells; b++) { const t = 0.4 + (b / bells) * 0.58, ba = b * 2.4;
        const bx = x + (tx - x) * t + Math.cos(ba) * 0.03, bz = z + (tz - z) * t + Math.sin(ba) * 0.03;
        bell(ctx, bx, h * t, bz, 0.022 * (1.2 - t * 0.5), sides);
        if (lod <= 1) { lobes(ctx, bx, h * t, bz, 0.022 * (1.2 - t * 0.5)); ctx.color(col); ctx.emissive(0.35, 0.18, 0.55); } }
      ctx.emissive(null);
    }
  } else if (kind === "star") {
    const n = far ? 4 : 9 + Math.floor(r() * 7);
    for (let s = 0; s < n; s++) {
      const a = r() * 6.283, d = Math.sqrt(r()) * 0.2, x = Math.cos(a) * d, z = Math.sin(a) * d, h = 0.05 + r() * 0.12;
      if (!far) { ctx.color(STEM); ctx.emissive(null); stalk(ctx, x * 0.6, z * 0.6, x, h, z, 0.004, 3); }
      ctx.color(PAL.star[Math.floor(r() * 3)]); ctx.emissive(0.5, 0.28, 0.05);
      star(ctx, x, h, z, 0.03 + r() * 0.02, r() * 6.283);
      ctx.color("oklch(0.55 0.12 40)"); ctx.emissive(0.8, 0.3, 0.05); star(ctx, x, h + 0.006, z, 0.008, 0);
      ctx.emissive(null);
    }
  } else { // lily: one tall bowed stem carrying a lit teal bulb, two ribbon leaves
    const h = 0.9 + r() * 0.6, bend = 0.12 + r() * 0.1, a = r() * 6.283, bx = Math.cos(a) * bend, bz = Math.sin(a) * bend;
    ctx.color(STEM); stalk(ctx, 0, 0, bx * 0.6, h * 0.75, bz * 0.6, 0.016, sides);
    stalk(ctx, bx * 0.6, bz * 0.6, bx, 0, bz, 0.0, 0); // keeps the seed stream identical across kinds
    for (let i = 0; i < sides; i++) { const t0 = (i / sides) * 6.283, t1 = ((i + 1) / sides) * 6.283, rr = 0.008;
      ctx.quad(bx * 0.6 + Math.cos(t0) * rr, h * 0.75, bz * 0.6 + Math.sin(t0) * rr, bx * 0.6 + Math.cos(t1) * rr, h * 0.75, bz * 0.6 + Math.sin(t1) * rr,
        bx + Math.cos(t1) * rr, h * 0.9, bz + Math.sin(t1) * rr, bx + Math.cos(t0) * rr, h * 0.9, bz + Math.sin(t0) * rr); }
    ctx.color(LEAF);
    blade(ctx, 0, 0, a + 2.2, 0.35, 0.05, 0.4); blade(ctx, 0, 0, a - 2.0, 0.3, 0.05, 0.32);
    // the bulb: a closed teardrop hanging from the bowed tip, lit from within
    ctx.smooth(); ctx.color("oklch(0.85 0.09 195)"); ctx.emissive(0.25, 1.5, 1.7); ctx.roughness(0.25);
    const cy = h * 0.9 - 0.07, R = 0.055, rings = far ? 3 : 5, seg = far ? 5 : 8;
    const pt = (i, j) => { const v = i / rings, th = (j / seg) * 6.283, rad = Math.sin(v * Math.PI) * R * (v < 0.5 ? 1 : 0.8 + 0.2 * (1 - v)) * (far ? 1 : 1 + 0.09 * Math.cos(th * 6));
      return [bx + Math.cos(th) * rad, cy + 0.07 - v * 0.13, bz + Math.sin(th) * rad]; };
    for (let i = 0; i < rings; i++) for (let j = 0; j < seg; j++) { const p = pt(i, j), q = pt(i, j + 1), s2 = pt(i + 1, j + 1), t = pt(i + 1, j);
      ctx.quad(...p, ...q, ...s2, ...t); }
    ctx.emissive(null);
    if (!far) { ctx.color(STEM); ctx.roughness(0.7); // three sepals cupping the top of the bulb
      for (let k = 0; k < 3; k++) { const t = (k / 3) * 6.283 + a, c = Math.cos(t), s = Math.sin(t), y0 = cy + 0.075;
        const tip = [bx + c * R * 0.95, cy + 0.01, bz + s * R * 0.95], l = [bx + Math.cos(t - 0.5) * R * 0.45, y0 - 0.012, bz + Math.sin(t - 0.5) * R * 0.45], rr = [bx + Math.cos(t + 0.5) * R * 0.45, y0 - 0.012, bz + Math.sin(t + 0.5) * R * 0.45];
        ctx.tri(bx, y0 + 0.004, bz, ...l, ...tip); ctx.tri(bx, y0 + 0.004, bz, ...tip, ...rr); } }
  }
}
