// Ash fern: a crown of 7-11 fronds arching out of a dark fibrous heart. Each frond is a curved rachis carrying
// paired pinnae that shrink to the tip; every pinna is folded along its vein with serrated lobes, and the
// tips curl down. Two or three young fiddleheads coil in the heart. Feet at y 0. params.tone shifts green->ash.
export function geometry(ctx) {
  const r = () => ctx.random(), lod = ctx.lod ?? 1;
  const tone = ctx.params?.tone ?? 0;
  const n = lod >= 3 ? 5 : lod === 2 ? 7 : 8 + Math.floor(r() * 4);
  ctx.smooth(); ctx.roughness(0.82);
  // the heart: a squat knot of old brown frond bases
  ctx.color("oklch(0.24 0.03 60)");
  for (let i = 0; i < 7; i++) { const a = i * 0.9, h = 0.07 + r() * 0.05; ctx.tri(0, 0, 0, Math.cos(a) * 0.07, h, Math.sin(a) * 0.07, Math.cos(a + 0.9) * 0.07, h * 0.8, Math.sin(a + 0.9) * 0.07); }
  const segs = lod >= 3 ? 4 : lod === 2 ? 7 : 12;
  for (let f = 0; f < n; f++) {
    const yaw = (f / n) * Math.PI * 2 + r() * 0.5, cy = Math.cos(yaw), sy = Math.sin(yaw);
    const len = 0.45 + r() * 0.4, lift = 0.9 + r() * 0.5, droop = 1.6 + r() * 0.6;
    const L = 0.5 - tone * 0.12 + r() * 0.05, C = 0.1 - tone * 0.065, dead = r() < 0.12; // the odd frond already browned
    const pts = [];
    for (let s = 0; s <= segs; s++) { const t = s / segs, d = t * len, h = Math.sin(t * Math.PI * 0.5) * len * lift * 0.55 - t * t * t * len * droop * 0.25; pts.push([cy * d, 0.06 + h, sy * d, t]); }
    const px = -sy, pz = cy;
    for (let s = 0; s < segs; s++) {
      const [x0, y0, z0, t0] = pts[s], [x1, y1, z1, t1] = pts[s + 1];
      const tm = (t0 + t1) / 2, w = (1 - tm) * 0.12 + 0.012;
      const hue = dead ? 70 : 128 - tone * 40 + tm * 12;
      for (const side of [-1, 1]) {
        const bx = (x0 + x1) / 2, by = (y0 + y1) / 2, bz = (z0 + z1) / 2;
        const fx = (x1 - x0) * 0.55, fz = (z1 - z0) * 0.55;
        const tx = bx + px * side * w + fx, ty = by + 0.012 - tm * 0.025, tz = bz + pz * side * w + fz; // pinna tip
        const vx = bx + px * side * w * 0.5 + fx * 0.4, vy = by + 0.022, vz = bz + pz * side * w * 0.5 + fz * 0.4; // raised vein
        if (lod >= 2) { ctx.color(`oklch(${L + tm * 0.08} ${dead ? 0.07 : C} ${hue})`); ctx.quad(x0, y0, z0, vx, vy, vz, tx, ty, tz, x1, y1, z1); continue; }
        // folded pinna: an upper and a lower blade off the vein, each with two serrated lobes
        const lob = (k, sgn) => { const t = k / 3, ox = (x1 - x0) * (sgn * 0.35), oz = (z1 - z0) * (sgn * 0.35);
          return [x0 + (tx - x0) * t + ox * (1 - t), y0 + (ty - y0) * t - 0.004, z0 + (tz - z0) * t + oz * (1 - t)]; };
        for (const sgn of [-1, 1]) {
          ctx.color(`oklch(${L + tm * 0.08 + (sgn > 0 ? 0.04 : -0.02)} ${dead ? 0.07 : C} ${hue})`);
          const a1 = lob(1, sgn), a2 = lob(2, sgn);
          const base = sgn > 0 ? [x1, y1, z1] : [x0, y0, z0];
          ctx.tri(...base, vx, vy, vz, ...a1);
          ctx.tri(...a1, vx, vy, vz, ...a2);
          ctx.tri(...a2, vx, vy, vz, tx, ty, tz);
        }
      }
      if (lod <= 2) { ctx.color(`oklch(${L - 0.12} ${C * 0.6} 80)`); const k = 0.004; ctx.quad(x0 - px * k, y0, z0 - pz * k, x0 + px * k, y0, z0 + pz * k, x1 + px * k, y1, z1 + pz * k, x1 - px * k, y1, z1 - pz * k); }
    }
  }
  // fiddleheads: young fronds still coiled tight, rising from the heart
  if (lod <= 1) {
    const nf = 2 + Math.floor(r() * 2);
    for (let i = 0; i < nf; i++) {
      const a = r() * 6.283, ca = Math.cos(a), sa = Math.sin(a), H = 0.14 + r() * 0.1;
      ctx.color(`oklch(${0.52 - tone * 0.1} ${0.11 - tone * 0.06} 125)`);
      let prev = null;
      for (let k = 0; k <= 14; k++) {
        const t = k / 14, rr = t < 0.55 ? 0 : (1 - (t - 0.55) / 0.45) * 0.035 + 0.006, th = t < 0.55 ? 0 : (t - 0.55) * 22;
        const h = t < 0.55 ? (t / 0.55) * H : H + Math.sin(th) * rr, o = t < 0.55 ? t * 0.05 : 0.0275 + (1 - Math.cos(th)) * rr * 0.5 + Math.cos(th) * 0 ;
        const p = [ca * o, h, sa * o], w = 0.007 * (1 - t * 0.5);
        if (prev) ctx.quad(prev[0] - sa * w, prev[1], prev[2] + ca * w, prev[0] + sa * w, prev[1], prev[2] - ca * w, p[0] + sa * w, p[1], p[2] - ca * w, p[0] - sa * w, p[1], p[2] + ca * w);
        prev = p;
      }
    }
  }
}
