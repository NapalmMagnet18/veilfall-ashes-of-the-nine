// Grave bramble: 9-13 thorny canes arching out of the ash and back down into it, near-black red with a
// waxy sheen, hooked thorns along each cane, three-lobed veined leaves (some withered to bronze), and
// clusters of blood-dark berries, each a knot of glossy drupelets. Feet at y 0.
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
function bead(ctx, x, y, z, b) { // an octahedron drupelet
  ctx.tri(x - b, y, z, x, y + b, z, x, y, z - b); ctx.tri(x, y, z - b, x, y + b, z, x + b, y, z); ctx.tri(x + b, y, z, x, y + b, z, x, y, z + b); ctx.tri(x, y, z + b, x, y + b, z, x - b, y, z);
  ctx.tri(x, y, z - b, x, y - b, z, x - b, y, z); ctx.tri(x + b, y, z, x, y - b, z, x, y, z - b); ctx.tri(x, y, z + b, x, y - b, z, x + b, y, z); ctx.tri(x - b, y, z, x, y - b, z, x, y, z + b);
}
export function geometry(ctx) {
  const r = () => ctx.random(), lod = ctx.lod ?? 1;
  const n = lod >= 3 ? 5 : 9 + Math.floor(r() * 5), segs = lod >= 3 ? 4 : lod === 2 ? 7 : 11, sides = lod >= 3 ? 3 : lod === 2 ? 5 : 6;
  ctx.smooth(); ctx.roughness(0.6);
  for (let c = 0; c < n; c++) {
    const yaw = r() * Math.PI * 2, cy = Math.cos(yaw), sy = Math.sin(yaw), reach = 0.25 + r() * 0.5, hgt = 0.12 + r() * 0.34;
    const pts = []; for (let s = 0; s <= segs; s++) { const t = s / segs; pts.push([cy * reach * t + Math.sin(t * 7 + c) * 0.03, Math.sin(t * Math.PI) * hgt - (t > 0.85 ? (t - 0.85) * 0.6 : 0), sy * reach * t + Math.cos(t * 6 + c) * 0.03]); }
    ctx.color(`oklch(${0.24 + r() * 0.05} 0.07 ${20 + r() * 10})`);
    cane(ctx, pts, 0.02, 0.007, sides);
    if (lod > 2) continue;
    // hooked thorns, pale at the tip
    ctx.color("oklch(0.55 0.05 70)");
    const tpS = lod === 1 ? 2 : 1;
    for (let s = 1; s < segs; s++) for (let q = 0; q < tpS; q++) {
      const [x, y, z] = pts[s]; const a = r() * Math.PI * 2, l = 0.03 + r() * 0.015; const tx = Math.cos(a) * l, tz = Math.sin(a) * l;
      ctx.tri(x - 0.006, y, z, x + 0.006, y, z, x + tx, y + 0.014, z + tz); ctx.tri(x, y - 0.006, z, x, y + 0.006, z, x + tx, y + 0.014, z + tz);
    }
    // three-lobed leaves folded on the midrib
    const nl = lod === 1 ? 4 + Math.floor(r() * 4) : 3;
    for (let k = 0; k < nl; k++) {
      const [x, y, z] = pts[1 + Math.floor(r() * (segs - 2))];
      const wither = r() < 0.3;
      for (let lobe = -1; lobe <= 1; lobe++) {
        const a = r() * 0.3 + yaw + lobe * 0.7 + (k % 2 ? 1.6 : -1.6), l = (lobe ? 0.055 : 0.075) + r() * 0.03, ca = Math.cos(a), sa = Math.sin(a);
        const tip = [x + ca * l, y - 0.012, z + sa * l], mid = [x + ca * l * 0.5, y + 0.012, z + sa * l * 0.5], w = l * 0.32;
        ctx.color(wither ? `oklch(${0.42 + r() * 0.06} 0.08 ${55 + r() * 10})` : `oklch(${0.32 + r() * 0.06} 0.07 ${125 + r() * 15})`);
        ctx.tri(x, y, z, x + ca * l * 0.5 - sa * w, y, z + sa * l * 0.5 + ca * w, ...mid);
        ctx.tri(...mid, x + ca * l * 0.5 - sa * w, y, z + sa * l * 0.5 + ca * w, ...tip);
        ctx.color(wither ? "oklch(0.36 0.07 55)" : "oklch(0.27 0.06 130)");
        ctx.tri(x, y, z, ...mid, x + ca * l * 0.5 + sa * w, y, z + sa * l * 0.5 - ca * w);
        ctx.tri(...mid, ...tip, x + ca * l * 0.5 + sa * w, y, z + sa * l * 0.5 - ca * w);
      }
    }
    // berry clusters: glossy drupelets, a red unripe one among the black
    if (r() < 0.65) {
      const [x, y, z] = pts[Math.floor(segs / 2) + Math.floor(r() * 2)];
      const nb = lod === 1 ? 2 + Math.floor(r() * 2) : 1;
      for (let b = 0; b < nb; b++) {
        const bx = x + (r() - 0.5) * 0.06, by = y - 0.02 - r() * 0.02, bz = z + (r() - 0.5) * 0.06, ripe = r() < 0.75;
        ctx.color(ripe ? "oklch(0.2 0.08 350)" : "oklch(0.42 0.17 25)"); ctx.roughness(0.25);
        const dr = lod === 1 ? 7 : 1;
        for (let d = 0; d < dr; d++) { const u = d / dr * 6.283, v = d % 2 ? 0.006 : -0.006; bead(ctx, bx + Math.cos(u) * 0.009 * (d ? 1 : 0), by + v, bz + Math.sin(u) * 0.009 * (d ? 1 : 0), d ? 0.007 : 0.011); }
        ctx.roughness(0.6);
      }
    }
  }
}
