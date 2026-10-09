// Moss-oak: an old dead oak of the pilgrim road, 2.4-4 m tall. Buttress roots gripping the ash, a furrowed
// corkscrew trunk with real bark ridges and a split crown, boughs forking three deep into crooked twigs,
// grey-teal moss hanging in ragged curtains, a few last ember-red leaves clinging at the tips, and pale
// glowing shelf fungus stepping up the shaded side. Feet at y 0. Seeded per item; lod thins every pass.
function ridgedTube(ctx, pts, r0, r1, sides, ridge, seed) {
  const n = pts.length; if (n < 2) return;
  const rings = [];
  let px = 1, pz = 0;
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
    let dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2]; const L = Math.hypot(dx, dy, dz) || 1; dx /= L; dy /= L; dz /= L;
    const d = px * dx + pz * dz;
    let ux = px - dx * d, uy = -dy * d, uz = pz - dz * d;
    let ul = Math.hypot(ux, uy, uz); if (ul < 1e-3) { ux = -dz; uy = 0; uz = dx; ul = Math.hypot(ux, uz) || 1; }
    ux /= ul; uy /= ul; uz /= ul; px = ux; pz = uz;
    const vx = dy * uz - dz * uy, vy = dz * ux - dx * uz, vz = dx * uy - dy * ux;
    const t = i / (n - 1), rad = r0 + (r1 - r0) * t, ring = [];
    for (let s = 0; s <= sides; s++) {
      const th = (s / sides) * 6.2832;
      const f = ridge ? 1 + ridge * (0.55 * Math.sin(th * 7 + t * 3 + seed) + 0.25 * Math.sin(th * 13 - t * 9 + seed * 2)) : 1;
      const rr = rad * f, c = Math.cos(th) * rr, sn = Math.sin(th) * rr;
      ring.push([pts[i][0] + ux * c + vx * sn, pts[i][1] + uy * c + vy * sn, pts[i][2] + uz * c + vz * sn]);
    }
    rings.push(ring);
  }
  for (let i = 0; i < n - 1; i++) for (let s = 0; s < sides; s++) ctx.quad(...rings[i][s], ...rings[i][s + 1], ...rings[i + 1][s + 1], ...rings[i + 1][s]);
  const e = rings[n - 1], c = pts[n - 1];
  for (let s = 0; s < sides; s++) ctx.tri(...e[s + 1], ...e[s], c[0], c[1] + r1 * 0.3, c[2]);
}
function limb(ctx, r, from, dir, len, rad, depth, lod, out) {
  const segs = lod >= 3 ? 2 : lod >= 2 ? 3 : 5, pts = [from];
  let [x, y, z] = from, [dx, dy, dz] = dir;
  for (let s = 0; s < segs; s++) {
    dx += (r() - 0.5) * 0.7; dy += (r() - 0.62) * 0.35; dz += (r() - 0.5) * 0.7;
    const l = Math.hypot(dx, dy, dz); dx /= l; dy /= l; dz /= l;
    x += dx * len / segs; y += dy * len / segs; z += dz * len / segs; pts.push([x, y, z]);
  }
  ctx.color(`oklch(${0.28 + r() * 0.05} 0.015 ${55 + r() * 15})`);
  ridgedTube(ctx, pts, rad, rad * 0.4, lod >= 3 ? 4 : lod >= 2 ? 6 : rad > 0.05 ? 9 : 6, rad > 0.05 && lod <= 1 ? 0.08 : 0, r() * 9);
  if (depth > 0 && lod <= 3) {
    const k = 2 + Math.floor(r() * 2);
    for (let i = 0; i < k; i++) { const p = pts[1 + Math.floor(r() * segs)]; limb(ctx, r, p, [dx + (r() - 0.5) * 1.5, dy + 0.15 + (r() - 0.5) * 0.7, dz + (r() - 0.5) * 1.5], len * 0.58, rad * 0.5, depth - 1, lod, out); }
  } else out.tips.push([x, y, z]);
  out.moss.push(...pts.slice(1));
}
export function geometry(ctx) {
  const r = () => ctx.random(), lod = ctx.lod ?? 1, far = lod >= 3;
  const H = 2.4 + r() * 1.6, lean = r() * 6.283, lx = Math.cos(lean) * 0.22, lz = Math.sin(lean) * 0.22, bark = r() * 9;
  ctx.smooth(); ctx.roughness(0.95);
  ctx.albedo("cdn/texture-dead-grey-oak-bark-deep-furrows.png");
  // buttress roots: thick flares that dive and grip the ash
  ctx.color("oklch(0.31 0.016 58)");
  const nr = far ? 4 : 6 + Math.floor(r() * 2);
  for (let i = 0; i < nr; i++) {
    const a = (i / nr) * 6.2832 + r() * 0.5, l = 0.6 + r() * 0.5, w = (r() - 0.5) * 0.5;
    const P = (k, h) => [Math.cos(a + w * k) * l * k, h, Math.sin(a + w * k) * l * k];
    ridgedTube(ctx, [[0, 0.55, 0], P(0.3, 0.3), P(0.6, 0.1), P(0.85, 0.02), P(1, -0.08)], 0.17, 0.025, far ? 4 : 8, far ? 0 : 0.1, bark + i);
  }
  // trunk: corkscrew along the lean, furrowed bark
  const segs = far ? 3 : lod >= 2 ? 6 : 12, trunk = [];
  for (let s = 0; s <= segs; s++) { const t = s / segs; trunk.push([lx * t * H + Math.sin(t * 5 + lean) * 0.09, t * H, lz * t * H + Math.cos(t * 4 + lean) * 0.09]); }
  ctx.color("oklch(0.32 0.014 60)");
  ridgedTube(ctx, trunk, 0.3, 0.11, far ? 5 : lod >= 2 ? 9 : 16, far ? 0 : 0.12, bark);
  const out = { moss: [], tips: [] };
  // the split crown: two torn stubs, pale where the heartwood shows
  if (!far) {
    const top = trunk[segs];
    ctx.color("oklch(0.55 0.03 70)");
    for (let k = 0; k < 2; k++) { const a = lean + k * 3.14 + 0.4; ridgedTube(ctx, [top, [top[0] + Math.cos(a) * 0.15, top[1] + 0.35 + r() * 0.2, top[2] + Math.sin(a) * 0.15]], 0.1, 0.03, 6, 0.2, bark + k); }
  }
  const nb = 4 + Math.floor(r() * 3);
  for (let b = 0; b < nb; b++) {
    const t = 0.42 + (b / nb) * 0.55, p = trunk[Math.min(segs, Math.round(t * segs))], a = r() * 6.283;
    limb(ctx, r, p, [Math.cos(a), 0.4 + r() * 0.45, Math.sin(a)], 1 + r() * 0.8, 0.11 - b * 0.008, far ? 0 : lod >= 2 ? 1 : 3, lod, out);
  }
  ctx.albedo(null);
  if (far) return;
  // hanging moss: ragged stringy curtains, longest under the low boughs
  for (const [x, y, z] of out.moss) {
    if (r() > (lod >= 2 ? 0.35 : 0.6)) continue;
    const k = lod >= 2 ? 2 : 3 + Math.floor(r() * 3);
    for (let j = 0; j < k; j++) {
      const ox = (r() - 0.5) * 0.14, oz = (r() - 0.5) * 0.14, len = (0.25 + r() * 0.9) * Math.min(1.3, 2.4 / Math.max(1, y)), w = 0.01 + r() * 0.022, a = r() * 3.14;
      const cx = Math.cos(a) * w, cz = Math.sin(a) * w, kx = (r() - 0.5) * 0.07, kz = (r() - 0.5) * 0.07;
      const X = x + ox, Z = z + oz, m = y - len * 0.5;
      ctx.color(`oklch(${0.38 + r() * 0.14} ${0.025 + r() * 0.025} ${115 + r() * 60})`);
      ctx.quad(X - cx, y, Z - cz, X + cx, y, Z + cz, X + kx + cx * 0.7, m, Z + kz + cz * 0.7, X + kx - cx * 0.7, m, Z + kz - cz * 0.7);
      ctx.tri(X + kx - cx * 0.7, m, Z + kz - cz * 0.7, X + kx + cx * 0.7, m, Z + kz + cz * 0.7, X - kx * 0.5, y - len, Z - kz * 0.5);
    }
  }
  // fine twigs: every bough end splits into a fan of thin forked sprigs, the crown's silhouette against the sky
  if (lod <= 2) { ctx.color("oklch(0.27 0.014 58)");
    const twig = (a, b, w0, w1) => { const dx = b[0] - a[0], dz = b[2] - a[2], L = Math.hypot(dx, dz) || 1, ux = -dz / L, uz = dx / L;
      ctx.quad(a[0] - ux * w0, a[1], a[2] - uz * w0, a[0] + ux * w0, a[1], a[2] + uz * w0, b[0] + ux * w1, b[1], b[2] + uz * w1, b[0] - ux * w1, b[1], b[2] - uz * w1);
      ctx.quad(a[0], a[1] - w0, a[2], a[0], a[1] + w0, a[2], b[0], b[1] + w1, b[2], b[0], b[1] - w1, b[2]); };
    for (const t of out.tips) for (let k = 0, n = lod <= 1 ? 4 : 2; k < n; k++) {
      const a = r() * 6.283, l = 0.18 + r() * 0.3, m = [t[0] + Math.cos(a) * l * 0.55, t[1] + (r() - 0.2) * l * 0.5, t[2] + Math.sin(a) * l * 0.55];
      const e = [m[0] + Math.cos(a + (r() - 0.5)) * l * 0.45, m[1] + (r() - 0.3) * l * 0.4, m[2] + Math.sin(a + (r() - 0.5)) * l * 0.45];
      twig(t, m, 0.012, 0.006); twig(m, e, 0.006, 0.0015);
      if (lod <= 1 && r() < 0.5) { const b2 = a + (r() < 0.5 ? 0.8 : -0.8); twig(m, [m[0] + Math.cos(b2) * l * 0.35, m[1] + l * 0.15, m[2] + Math.sin(b2) * l * 0.35], 0.005, 0.0012); }
    } }
  // the last leaves: ember-red and old-gold clusters clinging at a third of the twig tips
  for (const [x, y, z] of out.tips) {
    if (r() > 0.35) continue;
    const n = lod >= 2 ? 3 : 6 + Math.floor(r() * 5);
    for (let i = 0; i < n; i++) {
      const lx2 = x + (r() - 0.5) * 0.3, ly = y + (r() - 0.6) * 0.2, lz2 = z + (r() - 0.5) * 0.3, s = 0.05 + r() * 0.05, a = r() * 6.283, tilt = (r() - 0.5) * 0.8;
      const ca = Math.cos(a) * s, sa = Math.sin(a) * s;
      ctx.color(r() < 0.6 ? `oklch(${0.4 + r() * 0.1} ${0.13 + r() * 0.05} ${28 + r() * 14})` : `oklch(${0.55 + r() * 0.1} 0.1 ${70 + r() * 10})`);
      ctx.quad(lx2 - ca, ly - tilt * s, lz2 - sa, lx2 - sa * 0.5, ly, lz2 + ca * 0.5, lx2 + ca, ly + tilt * s, lz2 + sa, lx2 + sa * 0.5, ly, lz2 - ca * 0.5);
    }
  }
  // shelf fungus: pale half-discs stepping up the shaded side, undersides breathing teal
  const nf = lod >= 2 ? 2 : 3 + Math.floor(r() * 4), side = lean + 3.14;
  for (let i = 0; i < nf; i++) {
    const t = 0.15 + r() * 0.45, p = trunk[Math.round(t * segs)], R = 0.3 - t * 0.19, a = side + (r() - 0.5) * 1.6, w = 0.08 + r() * 0.07;
    const bx = p[0] + Math.cos(a) * R * 0.85, bz = p[2] + Math.sin(a) * R * 0.85, by = p[1];
    for (let k = 0; k < 6; k++) {
      const a0 = a - 1.3 + (k / 6) * 2.6, a1 = a - 1.3 + ((k + 1) / 6) * 2.6;
      const e0 = [bx + Math.cos(a0) * w, by - 0.01, bz + Math.sin(a0) * w], e1 = [bx + Math.cos(a1) * w, by - 0.01, bz + Math.sin(a1) * w];
      ctx.emissive(null); ctx.color("oklch(0.72 0.03 85)");
      ctx.tri(bx, by + 0.025, bz, ...e1, ...e0);
      ctx.color("oklch(0.6 0.06 195)"); ctx.emissive(0.05, 0.22, 0.24);
      ctx.tri(bx, by - 0.012, bz, ...e0, ...e1);
    }
    ctx.emissive(null);
  }
}
export function collider() { return { kind: "box", width: 0.5, height: 2.2, depth: 0.5, center: [0, 1.1, 0] }; }
