// Glowcap: a little colony of 3-6 slender pale fungi, lit from within in cold memory-teal (the Veil's light
// pooled where the dead lie shallow). Each one: a bent stem swelling to a bulb at the foot, a torn skirt ring
// high on the stem, a lathed bell cap with a curled-under rim that glows brightest at its edge, and fine radial
// gills underneath. Feet at y 0. HDR emissive so the bloom catches it. lod thins rings, sides and gills.
export function geometry(ctx) {
  const r = () => ctx.random(), lod = ctx.lod ?? 1, far = lod >= 3;
  const n = far ? 2 : 3 + Math.floor(r() * 4), sides = far ? 5 : lod === 2 ? 8 : 12;
  ctx.smooth();
  const ring = (cx, cy, cz, rad, wob, seed) => { const o = []; for (let s = 0; s <= sides; s++) { const t = (s / sides) * 6.2832, rr = rad * (1 + wob * Math.sin(t * 3 + seed) + wob * 0.5 * Math.sin(t * 7 + seed * 2)); o.push([cx + Math.cos(t) * rr, cy, cz + Math.sin(t) * rr]); } return o; };
  const band = (A, B) => { for (let s = 0; s < sides; s++) ctx.quad(...A[s], ...A[s + 1], ...B[s + 1], ...B[s]); };
  for (let m = 0; m < n; m++) {
    const a = r() * 6.2832, d = m === 0 ? 0 : 0.03 + r() * 0.07, x = Math.cos(a) * d, z = Math.sin(a) * d;
    const h = m === 0 ? 0.13 + r() * 0.03 : 0.05 + r() * 0.08, cr = h * (0.35 + r() * 0.15), sr = cr * 0.15;
    const bend = (r() - 0.5) * 0.05 + (d ? 0.02 : 0), bx = d ? Math.cos(a) : Math.cos(r() * 6.28), bz = d ? Math.sin(a) : Math.sin(r() * 6.28), seed = r() * 9;
    const P = (t) => [x + bx * bend * t * t, h * t, z + bz * bend * t * t];
    // stem: pale, translucent, swelling to a bulb in the ash
    ctx.emissive(null); ctx.color("oklch(0.86 0.02 200)"); ctx.roughness(0.55);
    const S = far ? 2 : lod === 2 ? 4 : 7; let prev = null;
    for (let k = 0; k <= S; k++) { const t = k / S, p = P(t), rr = sr * (1 + 1.1 * Math.pow(1 - t, 4)), R = ring(p[0], p[1], p[2], rr, far ? 0 : 0.04, seed + k); if (prev) band(prev, R); prev = R; }
    // the skirt: a torn ring hanging off the stem high up
    if (lod <= 2) { const t = 0.72, p = P(t); ctx.color("oklch(0.78 0.025 190)"); ctx.roughness(0.7);
      band(ring(p[0], p[1], p[2], sr * 1.05, 0, seed), ring(p[0], p[1] - h * 0.07, p[2], sr * 2.3, 0.12, seed * 3)); }
    // cap: lathed bell, rim curled under, brightest at the edge
    const top = P(1), [cx, cy, cz] = top;
    const prof = far ? [[1, -0.15], [0.6, 0.4], [0.02, 0.55]] : [[0.9, -0.24], [1, -0.12], [0.98, 0.02], [0.87, 0.2], [0.64, 0.38], [0.34, 0.5], [0.02, 0.55]];
    const wob = far ? 0 : 0.05;
    const rings = prof.map(([f, y]) => ring(cx, cy + y * cr, cz, f * cr, wob, seed));
    ctx.roughness(0.28);
    for (let i = 0; i < rings.length - 1; i++) {
      const g = 1 - i / (rings.length - 1); // 1 at the rim, 0 at the crown
      ctx.color(`oklch(${0.56 + g * 0.12} ${0.09 + g * 0.03} ${205 - g * 8})`); ctx.emissive(0.07 + g * 0.12, 0.6 + g * 0.8, 0.8 + g * 0.9);
      band(rings[i], rings[i + 1]);
    }
    // underside: darker teal, from the curled rim in to the stem
    ctx.color("oklch(0.42 0.07 200)"); ctx.emissive(0.04, 0.42, 0.52);
    band(ring(cx, cy - 0.06 * cr, cz, sr * 1.1, 0, seed), rings[0]);
    // gills: fine radial blades fanning from stem to rim, each lit faintly
    if (lod <= 2) { const ng = lod <= 1 ? 26 : 12; ctx.color("oklch(0.6 0.08 195)"); ctx.emissive(0.06, 0.75, 0.9);
      for (let gI = 0; gI < ng; gI++) { const t = (gI / ng) * 6.2832 + r() * 0.08, c = Math.cos(t), s = Math.sin(t), ro = cr * (0.86 + (gI % 2 ? -0.12 : 0));
        const i0 = [cx + c * sr * 1.15, cy - 0.07 * cr, cz + s * sr * 1.15], i1 = [cx + c * sr * 1.15, cy - 0.17 * cr, cz + s * sr * 1.15], o = [cx + c * ro, cy - 0.2 * cr, cz + s * ro];
        ctx.tri(...i0, ...o, ...i1); ctx.tri(...i0, ...i1, ...o); } }
    ctx.emissive(null);
  }
  // pinheads: two or three newborn caps just breaking the ash beside the colony
  if (lod <= 1) for (let k = 0, np = 2 + Math.floor(r() * 2); k < np; k++) {
    const a = r() * 6.2832, d = 0.08 + r() * 0.06, x = Math.cos(a) * d, z = Math.sin(a) * d, q = 0.008 + r() * 0.006;
    ctx.color("oklch(0.66 0.09 200)"); ctx.emissive(0.08, 0.8, 1); ctx.roughness(0.3);
    band(ring(x, 0, z, q * 0.7, 0, k), ring(x, q * 1.2, z, q, 0, k)); band(ring(x, q * 1.2, z, q, 0, k), ring(x, q * 2, z, q * 0.05, 0, k));
    ctx.emissive(null);
  }
}
