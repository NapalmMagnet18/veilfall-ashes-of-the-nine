// Grave-grass: a tuft of tall pale blades bleached to bone by ash, bending one way with a few seed heads.
export function geometry(ctx) {
  const r = () => ctx.random(), lod = ctx.lod ?? 1;
  const n = lod >= 3 ? 8 : 18 + Math.floor(r() * 10), segs = lod >= 3 ? 2 : lod <= 1 ? 5 : 4;
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
      ctx.color(`oklch(${0.42 + t1 * 0.46} ${0.06 - t1 * 0.03} ${110 - t1 * 28})`);
      if (lod <= 2) { // a folded blade: two strips meeting at a raised midrib, so each side catches the light differently
        const k0 = w0 * 0.45, k1 = w1 * 0.45, nx = -fz * 0, ux0 = p[0] - lx * k0 * 0.6, uz0 = p[2] - lz * k0 * 0.6, ux1 = q[0] - lx * k1 * 0.6, uz1 = q[2] - lz * k1 * 0.6;
        ctx.quad(p[0] - fx * w0, p[1], p[2] - fz * w0, ux0, p[1] + k0, uz0, ux1, q[1] + k1, uz1, q[0] - fx * w1, q[1], q[2] - fz * w1);
        ctx.quad(ux0, p[1] + k0, uz0, p[0] + fx * w0, p[1], p[2] + fz * w0, q[0] + fx * w1, q[1], q[2] + fz * w1, ux1, q[1] + k1, uz1);
      } else ctx.quad(p[0] - fx * w0, p[1], p[2] - fz * w0, p[0] + fx * w0, p[1], p[2] + fz * w0, q[0] + fx * w1, q[1], q[2] + fz * w1, q[0] - fx * w1, q[1], q[2] - fz * w1);
    }
    if (lod <= 1 && r() < 0.3) { // an oat-like seed head: a thin stem nodding over with a few hanging grains
      const sx = ox * 0.5, sz = oz * 0.5, sh = h * 1.25, tx = sx + lx * bend * 1.4, tz = sz + lz * bend * 1.4;
      ctx.color("oklch(0.74 0.05 80)");
      ctx.quad(sx - fx * 0.003, 0, sz - fz * 0.003, sx + fx * 0.003, 0, sz + fz * 0.003, tx + fx * 0.002, sh, tz + fz * 0.002, tx - fx * 0.002, sh, tz - fz * 0.002);
      for (let g = 0; g < 5; g++) { const gy = sh - g * 0.025, gx = tx + lx * (0.01 + g * 0.006) + fx * (g % 2 ? 0.012 : -0.012), gz = tz + lz * (0.01 + g * 0.006) + fz * (g % 2 ? 0.012 : -0.012);
        ctx.color(`oklch(${0.7 + r() * 0.12} 0.06 ${70 + r() * 15})`); ctx.quad(gx, gy, gz, gx + 0.006, gy - 0.014, gz, gx, gy - 0.03, gz, gx - 0.006, gy - 0.014, gz); }
    }
    if (lod <= 2 && r() < 0.25) { const t = 1, p = [ox + lx * bend, h - bend * 0.3, oz + lz * bend]; ctx.color("oklch(0.7 0.04 75)"); ctx.quad(p[0] - 0.008, p[1], p[2], p[0], p[1] - 0.004, p[2] - 0.008, p[0] + lx * 0.02 + 0.004, p[1] + 0.05, p[2] + lz * 0.02, p[0], p[1] + 0.004, p[2] + 0.008); }
  }
}
