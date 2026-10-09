// Grave bramble: 4-6 thorny canes arching out of the ash and back down into it, near-black red,
// hooked thorns along each cane, a few withered leaves and the odd blood-dark berry. Feet at y 0.
function cane(ctx, pts, r0, r1, sides) {
  const n = pts.length;
  for (let i = 0; i < n - 1; i++) {
    const a = pts[i], b = pts[i + 1], ra = r0 + (r1 - r0) * (i / (n - 1)), rb = r0 + (r1 - r0) * ((i + 1) / (n - 1));
    const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], L = Math.hypot(dx, dy, dz) || 1;
    let ux = -dz, uy = 0, uz = dx; const ul = Math.hypot(ux, uz) || 1; ux /= ul; uz /= ul;
    const vx = (dy * uz - dz * uy) / L, vy = (dz * ux - dx * uz) / L, vz = (dx * uy - dy * ux) / L;
    for (let s = 0; s < sides; s++) {
      const t0 = (s / sides) * Math.PI * 2, t1 = ((s + 1) / sides) * Math.PI * 2;
      const o = (t, r) => [Math.cos(t) * ux * r + Math.sin(t) * vx * r, Math.sin(t) * vy * r, Math.cos(t) * uz * r + Math.sin(t) * vz * r];
      const p0 = o(t0, ra), p1 = o(t1, ra), q0 = o(t0, rb), q1 = o(t1, rb);
      ctx.quad(a[0] + p0[0], a[1] + p0[1], a[2] + p0[2], a[0] + p1[0], a[1] + p1[1], a[2] + p1[2], b[0] + q1[0], b[1] + q1[1], b[2] + q1[2], b[0] + q0[0], b[1] + q0[1], b[2] + q0[2]);
    }
  }
}
export function geometry(ctx) {
  const r = () => ctx.random(), lod = ctx.lod ?? 1;
  const n = lod >= 3 ? 5 : 9 + Math.floor(r() * 4), segs = lod >= 3 ? 4 : 8, sides = lod >= 3 ? 3 : 5;
  ctx.smooth(); ctx.roughness(0.7);
  for (let c = 0; c < n; c++) {
    const yaw = r() * Math.PI * 2, cy = Math.cos(yaw), sy = Math.sin(yaw), reach = 0.25 + r() * 0.45, hgt = 0.12 + r() * 0.3;
    const pts = []; for (let s = 0; s <= segs; s++) { const t = s / segs; pts.push([cy * reach * t + Math.sin(t * 7 + c) * 0.03, Math.sin(t * Math.PI) * hgt - (t > 0.85 ? (t - 0.85) * 0.6 : 0), sy * reach * t + Math.cos(t * 6 + c) * 0.03]); }
    ctx.color("oklch(0.26 0.06 25)");
    cane(ctx, pts, 0.018, 0.008, sides);
    if (lod <= 2) {
      ctx.color("oklch(0.55 0.05 70)");
      for (let s = 1; s < segs; s++) { const [x, y, z] = pts[s]; const a = r() * Math.PI * 2; const tx = Math.cos(a) * 0.035, tz = Math.sin(a) * 0.035; ctx.tri(x - 0.006, y, z, x + 0.006, y, z, x + tx, y + 0.012, z + tz); ctx.tri(x, y - 0.006, z, x, y + 0.006, z, x + tx, y + 0.012, z + tz); }
      ctx.color(r() < 0.5 ? "oklch(0.36 0.07 120)" : "oklch(0.4 0.08 60)");
      for (let k = 0; k < 7; k++) { const [x, y, z] = pts[1 + Math.floor(r() * (segs - 2))]; const a = r() * 6.28, l = 0.07 + r() * 0.04; ctx.quad(x, y, z, x + Math.cos(a + 0.4) * l * 0.5, y + 0.01, z + Math.sin(a + 0.4) * l * 0.5, x + Math.cos(a) * l, y - 0.01, z + Math.sin(a) * l, x + Math.cos(a - 0.4) * l * 0.5, y + 0.01, z + Math.sin(a - 0.4) * l * 0.5); }
      if (r() < 0.6) { ctx.color("oklch(0.3 0.14 20)"); ctx.roughness(0.3); const [x, y, z] = pts[Math.floor(segs / 2)]; const b = 0.016; ctx.quad(x - b, y, z, x, y, z - b, x + b, y, z, x, y, z + b); ctx.tri(x - b, y, z, x, y + b, z, x, y, z - b); ctx.tri(x, y, z - b, x, y + b, z, x + b, y, z); ctx.tri(x + b, y, z, x, y + b, z, x, y, z + b); ctx.tri(x, y, z + b, x, y + b, z, x - b, y, z); ctx.roughness(0.7); }
    }
  }
}
