// Ash fern: a crown of 6-9 fronds arching out from a dark fibrous heart, each frond a curved rachis
// with paired leaflets that shrink to the tip; the tips curl down. Feet at y 0. params.tone shifts green->ash.
export function geometry(ctx) {
  const r = () => ctx.random(), lod = ctx.lod ?? 1;
  const tone = ctx.params?.tone ?? 0;
  const n = lod >= 3 ? 5 : 6 + Math.floor(r() * 4);
  ctx.smooth(); ctx.roughness(0.85);
  // the heart: a squat dark knot of old fronds
  ctx.color("oklch(0.24 0.03 60)");
  for (let i = 0; i < 5; i++) { const a = i * 1.26; ctx.tri(0, 0, 0, Math.cos(a) * 0.06, 0.09, Math.sin(a) * 0.06, Math.cos(a + 1.26) * 0.06, 0.09, Math.sin(a + 1.26) * 0.06); }
  const segs = lod >= 3 ? 4 : lod === 2 ? 6 : 9;
  for (let f = 0; f < n; f++) {
    const yaw = (f / n) * Math.PI * 2 + r() * 0.5, cy = Math.cos(yaw), sy = Math.sin(yaw);
    const len = 0.45 + r() * 0.35, lift = 0.9 + r() * 0.5, droop = 1.6 + r() * 0.6;
    const L = 0.5 - tone * 0.12 + r() * 0.05, C = 0.09 - tone * 0.06;
    const pts = [];
    for (let s = 0; s <= segs; s++) { const t = s / segs; const d = t * len, h = Math.sin(t * Math.PI * 0.5) * len * lift * 0.55 - t * t * t * len * droop * 0.25; pts.push([cy * d, 0.06 + h, sy * d, t]); }
    for (let s = 0; s < segs; s++) {
      const [x0, y0, z0, t0] = pts[s], [x1, y1, z1, t1] = pts[s + 1];
      const tm = (t0 + t1) / 2, w = (1 - tm) * 0.11 + 0.012;
      const px = -sy, pz = cy; // the frond's side
      ctx.color(`oklch(${L + tm * 0.08} ${C} ${125 - tone * 40 + tm * 10})`);
      // leaflets: a pair per segment, each a slim diamond angled up and forward
      for (const side of [-1, 1]) {
        const bx = (x0 + x1) / 2, by = (y0 + y1) / 2, bz = (z0 + z1) / 2;
        const tx = bx + px * side * w + (x1 - x0) * 0.6, ty = by + 0.015 - tm * 0.02, tz = bz + pz * side * w + (z1 - z0) * 0.6;
        const mx = bx + px * side * w * 0.5, mz = bz + pz * side * w * 0.5;
        ctx.quad(x0, y0, z0, mx + (x1 - x0) * 0.1, by + 0.012, mz + (z1 - z0) * 0.1, tx, ty, tz, x1, y1, z1);
      }
      if (lod <= 2) { ctx.color(`oklch(${L - 0.12} ${C * 0.6} 80)`); const k = 0.004; ctx.quad(x0 - px * k, y0, z0 - pz * k, x0 + px * k, y0, z0 + pz * k, x1 + px * k, y1, z1 + pz * k, x1 - px * k, y1, z1 - pz * k); }
    }
  }
}
