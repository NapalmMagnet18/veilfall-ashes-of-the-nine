// Grave-grass: a tuft of tall pale blades bleached to bone by ash, bending one way with a few seed heads.
export function geometry(ctx) {
  const r = () => ctx.random(), lod = ctx.lod ?? 1;
  const n = lod >= 3 ? 8 : 16 + Math.floor(r() * 10), segs = lod >= 3 ? 2 : 4;
  const lean = r() * Math.PI * 2, lx = Math.cos(lean), lz = Math.sin(lean);
  ctx.smooth(); ctx.roughness(0.9);
  for (let b = 0; b < n; b++) {
    const a = r() * Math.PI * 2, ox = Math.cos(a) * r() * 0.06, oz = Math.sin(a) * r() * 0.06;
    const h = 0.3 + r() * 0.35, bend = 0.12 + r() * 0.2, w = 0.016 + r() * 0.01;
    const fx = -Math.sin(a), fz = Math.cos(a);
    for (let s = 0; s < segs; s++) {
      const t0 = s / segs, t1 = (s + 1) / segs, w0 = w * (1 - t0), w1 = w * (1 - t1);
      const P = (t) => [ox + lx * bend * t * t, h * t - bend * 0.3 * t * t * t, oz + lz * bend * t * t];
      const p = P(t0), q = P(t1);
      ctx.color(`oklch(${0.68 + t1 * 0.22} ${0.05 - t1 * 0.02} ${92 - t1 * 10})`);
      ctx.quad(p[0] - fx * w0, p[1], p[2] - fz * w0, p[0] + fx * w0, p[1], p[2] + fz * w0, q[0] + fx * w1, q[1], q[2] + fz * w1, q[0] - fx * w1, q[1], q[2] - fz * w1);
    }
    if (lod <= 2 && r() < 0.25) { const t = 1, p = [ox + lx * bend, h - bend * 0.3, oz + lz * bend]; ctx.color("oklch(0.7 0.04 75)"); ctx.quad(p[0] - 0.008, p[1], p[2], p[0], p[1] - 0.004, p[2] - 0.008, p[0] + lx * 0.02 + 0.004, p[1] + 0.05, p[2] + lz * 0.02, p[0], p[1] + 0.004, p[2] + 0.008); }
  }
}
