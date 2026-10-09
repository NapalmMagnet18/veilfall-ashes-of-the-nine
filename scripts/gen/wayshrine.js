// Wayshrine: a pilgrims' travel stone. A stepped octagonal plinth of wet ashlar, a tapered obelisk with
// carved rune bands, and a cold memory-light shard held in an iron crown at its tip. Feet at y 0, ~3.4 m.
function prism(ctx, y0, y1, r0, r1, sides, rot = 0, top = true) {
  for (let i = 0; i < sides; i++) {
    const a0 = rot + (i / sides) * 6.2832, a1 = rot + ((i + 1) / sides) * 6.2832;
    const p = (a, r, y) => [Math.cos(a) * r, y, Math.sin(a) * r];
    ctx.quad(...p(a0, r0, y0), ...p(a1, r0, y0), ...p(a1, r1, y1), ...p(a0, r1, y1));
    if (top) ctx.tri(0, y1, 0, ...p(a1, r1, y1), ...p(a0, r1, y1));
  }
}
export function geometry(ctx) {
  const r = () => ctx.random(), lod = ctx.lod ?? 1, far = lod >= 3;
  ctx.roughness(0.8);
  ctx.albedo("/cdn/value.6b3fb3d3a7a92182bd467ade93e50cb3b85db20740d25d108932ae16b3f1c5bf.png");
  // three chipped steps
  ctx.color("oklch(0.42 0.012 260)");
  prism(ctx, 0, 0.22, 1.5, 1.45, 8, 0.39);
  prism(ctx, 0.22, 0.42, 1.12, 1.08, 8, 0.39);
  prism(ctx, 0.42, 0.6, 0.78, 0.74, 8, 0.39);
  // the obelisk: four sides, a slight twist, rune bands set in as narrower rings
  ctx.color("oklch(0.38 0.012 250)");
  const bands = far ? [] : [1.2, 1.9, 2.5];
  let y = 0.6, rr = 0.42;
  const stops = [0.6, 1.15, 1.25, 1.85, 1.95, 2.45, 2.55, 2.95];
  for (let i = 0; i < stops.length - 1; i++) {
    const y0 = stops[i], y1 = stops[i + 1], inset = i % 2 === 1 && !far ? 0.9 : 1;
    const ra = (0.42 - (y0 - 0.6) * 0.1) * inset, rb = (0.42 - (y1 - 0.6) * 0.1) * inset;
    prism(ctx, y0, y1, ra, rb, 4, 0.785 + y0 * 0.04, false);
  }
  // pyramidion cap
  prism(ctx, 2.95, 3.12, 0.18, 0.04, 4, 0.785 + 0.12);
  // glowing rune slits in the bands
  if (!far) {
    ctx.albedo(null); ctx.color("oklch(0.85 0.1 200)"); ctx.emissive(0.4, 0.95, 1.05);
    for (const by of bands) for (let k = 0; k < 4; k++) {
      const a = 0.785 + by * 0.04 + (k / 4) * 6.2832 + 0.785, rad = 0.42 - (by - 0.6) * 0.1 - 0.035;
      const cx = Math.cos(a) * rad, cz = Math.sin(a) * rad, tx = -Math.sin(a) * 0.06, tz = Math.cos(a) * 0.06;
      ctx.quad(cx - tx, by - 0.03, cz - tz, cx + tx, by - 0.03, cz + tz, cx + tx, by + 0.03, cz + tz, cx - tx, by + 0.03, cz - tz);
    }
    ctx.emissive(null);
  }
  // iron crown of four prongs cupping the shard
  ctx.albedo(null); ctx.color("oklch(0.25 0.01 60)"); ctx.metalness(0.7); ctx.roughness(0.5);
  for (let k = 0; k < 4; k++) {
    const a = (k / 4) * 6.2832;
    const b = [Math.cos(a) * 0.1, 3.05, Math.sin(a) * 0.1], t = [Math.cos(a) * 0.2, 3.45, Math.sin(a) * 0.2];
    const nx = -Math.sin(a) * 0.025, nz = Math.cos(a) * 0.025;
    ctx.quad(b[0] - nx, b[1], b[2] - nz, b[0] + nx, b[1], b[2] + nz, t[0] + nx, t[1], t[2] + nz, t[0] - nx, t[1], t[2] - nz);
    ctx.quad(b[0] + nx, b[1], b[2] + nz, b[0] - nx, b[1], b[2] - nz, t[0] - nx, t[1], t[2] - nz, t[0] + nx, t[1], t[2] + nz);
  }
  // the memory-light shard: an elongated octahedron
  ctx.metalness(0); ctx.roughness(0.2); ctx.color("oklch(0.88 0.09 200)"); ctx.emissive(0.55, 1.3, 1.45);
  const c = [0, 3.35, 0], h = 0.32, w = 0.12;
  const P = [[w, 0], [0, w], [-w, 0], [0, -w]];
  for (let k = 0; k < 4; k++) {
    const p0 = P[k], p1 = P[(k + 1) % 4];
    ctx.tri(c[0], c[1] + h, c[2], c[0] + p1[0], c[1], c[2] + p1[1], c[0] + p0[0], c[1], c[2] + p0[1]);
    ctx.tri(c[0], c[1] - h * 0.7, c[2], c[0] + p0[0], c[1], c[2] + p0[1], c[0] + p1[0], c[1], c[2] + p1[1]);
  }
  ctx.emissive(null);
  // fallen chips round the base
  if (!far) {
    ctx.albedo("/cdn/value.6b3fb3d3a7a92182bd467ade93e50cb3b85db20740d25d108932ae16b3f1c5bf.png"); ctx.color("oklch(0.4 0.01 260)"); ctx.roughness(0.9);
    for (let i = 0; i < 5; i++) { const a = r() * 6.28, d = 1.6 + r() * 0.5, s = 0.08 + r() * 0.1;
      ctx.box?.(Math.cos(a) * d, s / 2, Math.sin(a) * d, s * 1.6, s, s * 1.2); }
  }
}
