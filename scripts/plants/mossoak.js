// Moss-oak: a dead, twisted oak 2-3.5 m tall. A flared root foot, a trunk that leans and corkscrews,
// 3-5 boughs forking into crooked twigs, and grey-teal moss hanging in ragged curtains off the boughs.
// Feet at y 0. Seeded per item, so every copy of a seed is the same tree.
function tube(ctx, pts, r0, r1, sides) {
  const n = pts.length;
  for (let i = 0; i < n - 1; i++) {
    const a = pts[i], b = pts[i + 1], ra = r0 + (r1 - r0) * (i / (n - 1)), rb = r0 + (r1 - r0) * ((i + 1) / (n - 1));
    const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], L = Math.hypot(dx, dy, dz) || 1;
    let ux = dy * 0 - dz * 1, uy = 0, uz = dx; let ul = Math.hypot(ux, uz); if (ul < 1e-4) { ux = 1; uz = 0; ul = 1; } ux /= ul; uz /= ul;
    const vx = (dy * uz - dz * uy) / L, vy = (dz * ux - dx * uz) / L, vz = (dx * uy - dy * ux) / L;
    for (let s = 0; s < sides; s++) {
      const t0 = (s / sides) * 6.2832, t1 = ((s + 1) / sides) * 6.2832;
      const o = (t, r) => [Math.cos(t) * ux * r + Math.sin(t) * vx * r, Math.sin(t) * vy * r, Math.cos(t) * uz * r + Math.sin(t) * vz * r];
      const p0 = o(t0, ra), p1 = o(t1, ra), q0 = o(t0, rb), q1 = o(t1, rb);
      ctx.quad(a[0] + p0[0], a[1] + p0[1], a[2] + p0[2], a[0] + p1[0], a[1] + p1[1], a[2] + p1[2], b[0] + q1[0], b[1] + q1[1], b[2] + q1[2], b[0] + q0[0], b[1] + q0[1], b[2] + q0[2]);
    }
  }
}
function limb(ctx, r, from, dir, len, rad, depth, lod, moss) {
  const segs = lod >= 3 ? 2 : 4, pts = [from];
  let [x, y, z] = from, [dx, dy, dz] = dir;
  for (let s = 0; s < segs; s++) { dx += (r() - 0.5) * 0.6; dy += (r() - 0.6) * 0.3; dz += (r() - 0.5) * 0.6; const l = Math.hypot(dx, dy, dz); dx /= l; dy /= l; dz /= l; x += dx * len / segs; y += dy * len / segs; z += dz * len / segs; pts.push([x, y, z]); }
  ctx.color("oklch(0.3 0.015 60)");
  tube(ctx, pts, rad, rad * 0.45, lod >= 3 ? 4 : 6);
  if (depth > 0 && lod <= 3) { const k = 2 + Math.floor(r() * 2); for (let i = 0; i < k; i++) { const p = pts[1 + Math.floor(r() * segs)]; limb(ctx, r, p, [dx + (r() - 0.5) * 1.4, dy + 0.2 + (r() - 0.5) * 0.6, dz + (r() - 0.5) * 1.4], len * 0.55, rad * 0.45, depth - 1, lod, moss); } }
  if (moss && lod <= 2) moss.push(...pts.slice(1));
}
export function geometry(ctx) {
  const r = () => ctx.random(), lod = ctx.lod ?? 1;
  const H = 2 + r() * 1.5, lean = r() * 6.283, lx = Math.cos(lean) * 0.25, lz = Math.sin(lean) * 0.25;
  ctx.smooth(); ctx.roughness(0.95);
  ctx.albedo("cdn/texture-dead-grey-oak-bark-deep-furrows.png");
  // root foot: 5 flared roots diving into the ash
  ctx.color("oklch(0.32 0.015 60)");
  for (let i = 0; i < 5; i++) { const a = i * 1.257 + r() * 0.4, l = 0.5 + r() * 0.3; tube(ctx, [[0, 0.35, 0], [Math.cos(a) * l * 0.5, 0.12, Math.sin(a) * l * 0.5], [Math.cos(a) * l, -0.05, Math.sin(a) * l]], 0.13, 0.03, lod >= 3 ? 4 : 6); }
  // trunk: corkscrewing up along the lean
  const segs = lod >= 3 ? 3 : 7, trunk = [];
  for (let s = 0; s <= segs; s++) { const t = s / segs; trunk.push([lx * t * H + Math.sin(t * 5 + lean) * 0.08, t * H, lz * t * H + Math.cos(t * 4 + lean) * 0.08]); }
  tube(ctx, trunk, 0.26, 0.12, lod >= 3 ? 5 : 9);
  const moss = [];
  const nb = 3 + Math.floor(r() * 3);
  for (let b = 0; b < nb; b++) {
    const t = 0.5 + (b / nb) * 0.5, p = trunk[Math.min(segs, Math.round(t * segs))], a = r() * 6.283;
    limb(ctx, r, p, [Math.cos(a), 0.45 + r() * 0.4, Math.sin(a)], 0.9 + r() * 0.7, 0.1, lod >= 3 ? 0 : 2, lod, moss);
  }
  // hanging moss: ragged tapering curtains under the boughs
  ctx.albedo(null);
  for (const [x, y, z] of moss) {
    if (r() > 0.6) continue;
    const k = 2 + Math.floor(r() * 3);
    for (let j = 0; j < k; j++) { // fine stringy strands, each a narrow tapering ribbon that kinks once
      const ox = (r() - 0.5) * 0.12, oz = (r() - 0.5) * 0.12, len = 0.25 + r() * 0.8, w = 0.012 + r() * 0.02, a = r() * 3.14;
      const cx = Math.cos(a) * w, cz = Math.sin(a) * w, kx = (r() - 0.5) * 0.06, kz = (r() - 0.5) * 0.06;
      const X = x + ox, Z = z + oz, m = y - len * 0.5;
      ctx.color(`oklch(${0.4 + r() * 0.12} ${0.025 + r() * 0.02} ${120 + r() * 50})`);
      ctx.quad(X - cx, y, Z - cz, X + cx, y, Z + cz, X + kx + cx * 0.7, m, Z + kz + cz * 0.7, X + kx - cx * 0.7, m, Z + kz - cz * 0.7);
      ctx.tri(X + kx - cx * 0.7, m, Z + kz - cz * 0.7, X + kx + cx * 0.7, m, Z + kz + cz * 0.7, X - kx * 0.5, y - len, Z - kz * 0.5);
    }
  }
}
export function collider() { return { kind: "box", width: 0.4, height: 2, depth: 0.4, center: [0, 1, 0] }; }
