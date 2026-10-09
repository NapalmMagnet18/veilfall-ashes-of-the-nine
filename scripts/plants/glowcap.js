// Glowcap: a little colony of 3-6 slender pale fungi, gill-shaded caps lit from within in cold memory-teal
// (the Veil's light pooled where the dead lie shallow). Feet at y 0. HDR emissive so the bloom catches it.
export function geometry(ctx) {
  const r = () => ctx.random(), lod = ctx.lod ?? 1;
  const n = lod >= 3 ? 2 : 3 + Math.floor(r() * 4), sides = lod >= 3 ? 5 : 8;
  ctx.smooth();
  for (let m = 0; m < n; m++) {
    const a = r() * Math.PI * 2, d = m === 0 ? 0 : 0.03 + r() * 0.07, x = Math.cos(a) * d, z = Math.sin(a) * d;
    const h = (m === 0 ? 0.13 : 0.05 + r() * 0.08), cr = h * (0.35 + r() * 0.15), tilt = (r() - 0.5) * 0.04;
    // stem
    ctx.emissive(null); ctx.color("oklch(0.86 0.02 200)"); ctx.roughness(0.6);
    for (let s = 0; s < sides; s++) { const t0 = (s / sides) * 6.283, t1 = ((s + 1) / sides) * 6.283, sr = cr * 0.16;
      ctx.quad(x + Math.cos(t0) * sr * 1.4, 0, z + Math.sin(t0) * sr * 1.4, x + Math.cos(t1) * sr * 1.4, 0, z + Math.sin(t1) * sr * 1.4, x + tilt + Math.cos(t1) * sr, h, z + Math.sin(t1) * sr, x + tilt + Math.cos(t0) * sr, h, z + Math.sin(t0) * sr); }
    // cap: a domed top, glowing; underside gills darker teal
    const cx = x + tilt, cy = h;
    ctx.color("oklch(0.8 0.08 195)"); ctx.emissive(0.25, 1.6, 1.8); ctx.roughness(0.3);
    for (let s = 0; s < sides; s++) { const t0 = (s / sides) * 6.283, t1 = ((s + 1) / sides) * 6.283;
      ctx.quad(cx + Math.cos(t0) * cr, cy - cr * 0.15, z + Math.sin(t0) * cr, cx + Math.cos(t1) * cr, cy - cr * 0.15, z + Math.sin(t1) * cr, cx + Math.cos(t1) * cr * 0.6, cy + cr * 0.4, z + Math.sin(t1) * cr * 0.6, cx + Math.cos(t0) * cr * 0.6, cy + cr * 0.4, z + Math.sin(t0) * cr * 0.6);
      ctx.tri(cx + Math.cos(t0) * cr * 0.6, cy + cr * 0.4, z + Math.sin(t0) * cr * 0.6, cx + Math.cos(t1) * cr * 0.6, cy + cr * 0.4, z + Math.sin(t1) * cr * 0.6, cx, cy + cr * 0.55, z); }
    ctx.emissive(0.05, 0.5, 0.6); ctx.color("oklch(0.45 0.07 200)");
    for (let s = 0; s < sides; s++) { const t0 = (s / sides) * 6.283, t1 = ((s + 1) / sides) * 6.283; ctx.tri(cx + Math.cos(t1) * cr, cy - cr * 0.15, z + Math.sin(t1) * cr, cx + Math.cos(t0) * cr, cy - cr * 0.15, z + Math.sin(t0) * cr, cx, cy - cr * 0.05, z); }
    ctx.emissive(null);
  }
}
