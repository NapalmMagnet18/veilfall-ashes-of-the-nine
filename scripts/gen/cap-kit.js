// Candlehold's shared kit: boxes with a chamfered top edge, rings, gables. Local frame, −Z is the front.
export const ASHLAR = "cdn/texture-weathered-dark-ashlar-stone-blocks-soot-stained.png";
export const PLASTER = "cdn/texture-old-cracked-limewash-plaster-soot-streaked.png";
export const TIMBER = "cdn/texture-dark-weathered-oak-timber-beam.png";
export const SLATE = "cdn/texture-dark-wet-slate-roof-tiles-mossy.png";
export const IRON = "cdn/texture-blackened-wrought-iron-rust-pitted.png";
// axis-aligned box, faces CCW from outside
export function box(ctx, cx, cy, cz, w, h, d) {
  const x0 = cx - w / 2, x1 = cx + w / 2, y0 = cy, y1 = cy + h, z0 = cz - d / 2, z1 = cz + d / 2;
  ctx.quad(x0, y0, z0, x0, y1, z0, x1, y1, z0, x1, y0, z0); // front −Z
  ctx.quad(x1, y0, z1, x1, y1, z1, x0, y1, z1, x0, y0, z1); // back
  ctx.quad(x0, y0, z1, x0, y1, z1, x0, y1, z0, x0, y0, z0); // left
  ctx.quad(x1, y0, z0, x1, y1, z0, x1, y1, z1, x1, y0, z1); // right
  ctx.quad(x0, y1, z0, x0, y1, z1, x1, y1, z1, x1, y1, z0); // top
  ctx.quad(x0, y0, z1, x0, y0, z0, x1, y0, z0, x1, y0, z1); // bottom
}
// a box whose top edges are chamfered by c (stone courses, sills, merlon caps)
export function cbox(ctx, cx, cy, cz, w, h, d, c = 0.06) {
  box(ctx, cx, cy, cz, w, h - c, d);
  const y = cy + h - c, x0 = cx - w / 2, x1 = cx + w / 2, z0 = cz - d / 2, z1 = cz + d / 2, Y = cy + h;
  ctx.quad(x0, y, z0, x0 + c, Y, z0 + c, x1 - c, Y, z0 + c, x1, y, z0);
  ctx.quad(x1, y, z1, x1 - c, Y, z1 - c, x0 + c, Y, z1 - c, x0, y, z1);
  ctx.quad(x0, y, z1, x0 + c, Y, z1 - c, x0 + c, Y, z0 + c, x0, y, z0);
  ctx.quad(x1, y, z0, x1 - c, Y, z0 + c, x1 - c, Y, z1 - c, x1, y, z1);
  ctx.quad(x0 + c, Y, z0 + c, x0 + c, Y, z1 - c, x1 - c, Y, z1 - c, x1 - c, Y, z0 + c);
}
// open cylinder wall (outward) from y0 to y1, radii r0 → r1
export function ring(ctx, cx, cz, y0, y1, r0, r1, n, cap = false) {
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * 6.2832, a1 = ((i + 1) / n) * 6.2832;
    const s0 = Math.sin(a0), c0 = Math.cos(a0), s1 = Math.sin(a1), c1 = Math.cos(a1);
    ctx.quad(cx + s0 * r0, y0, cz + c0 * r0, cx + s1 * r0, y0, cz + c1 * r0, cx + s1 * r1, y1, cz + c1 * r1, cx + s0 * r1, y1, cz + c0 * r1);
    if (cap) ctx.tri(cx + s0 * r1, y1, cz + c0 * r1, cx + s1 * r1, y1, cz + c1 * r1, cx, y1, cz);
  }
}
// a cone roof
export function cone(ctx, cx, cz, y0, r, h, n) {
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * 6.2832, a1 = ((i + 1) / n) * 6.2832;
    ctx.tri(cx + Math.sin(a0) * r, y0, cz + Math.cos(a0) * r, cx + Math.sin(a1) * r, y0, cz + Math.cos(a1) * r, cx, y0 + h, cz);
    ctx.tri(cx + Math.sin(a1) * r, y0, cz + Math.cos(a1) * r, cx + Math.sin(a0) * r, y0, cz + Math.cos(a0) * r, cx, y0, cz);
  }
}
// gable roof along X over w×d, eave height y, ridge rise h, overhang o, slab thickness t
export function gable(ctx, w, d, y, h, o = 0.4, t = 0.12) {
  const x0 = -w / 2 - o, x1 = w / 2 + o, ze = d / 2 + o, ye = y - o * (h / (d / 2)), yr = y + h;
  // two slopes, top and underside
  ctx.quad(x0, ye, -ze, x0, yr, 0, x1, yr, 0, x1, ye, -ze);
  ctx.quad(x1, ye, ze, x1, yr, 0, x0, yr, 0, x0, ye, ze);
  ctx.quad(x1, ye - t, -ze, x1, yr - t, 0, x0, yr - t, 0, x0, ye - t, -ze);
  ctx.quad(x0, ye - t, ze, x0, yr - t, 0, x1, yr - t, 0, x1, ye - t, ze);
  // fascia edges
  ctx.quad(x0, ye - t, -ze, x0, ye, -ze, x1, ye, -ze, x1, ye - t, -ze);
  ctx.quad(x1, ye - t, ze, x1, ye, ze, x0, ye, ze, x0, ye - t, ze);
  ctx.quad(x0, ye - t, ze, x0, yr - t, 0, x0, yr, 0, x0, ye, ze); ctx.quad(x0, ye, -ze, x0, yr, 0, x0, yr - t, 0, x0, ye - t, -ze);
  ctx.quad(x1, ye, ze, x1, yr, 0, x1, yr - t, 0, x1, ye - t, ze); ctx.quad(x1, ye - t, -ze, x1, yr - t, 0, x1, yr, 0, x1, ye, -ze);
}
// gable-end triangles filling the wall under the roof at x = ±w/2
export function gableEnds(ctx, w, d, y, h) {
  for (const s of [-1, 1]) { const x = s * w / 2; if (s < 0) ctx.tri(x, y, d / 2, x, y + h, 0, x, y, -d / 2); else ctx.tri(x, y, -d / 2, x, y + h, 0, x, y, d / 2); }
}
// a beam between two points, square section s
export function beam(ctx, a, b, s) {
  const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], L = Math.hypot(dx, dy, dz) || 1;
  let ux = -dz, uz = dx, ul = Math.hypot(ux, uz); if (ul < 1e-4) { ux = 1; uz = 0; ul = 1; } ux = ux / ul * s / 2; uz = uz / ul * s / 2;
  const vx = (dy * uz) / L, vy = (dz * ux - dx * uz) / L, vz = (-dy * ux) / L;
  const c = [[ux + vx, vy, uz + vz], [-ux + vx, vy, -uz + vz], [-ux - vx, -vy, -uz - vz], [ux - vx, -vy, uz - vz]];
  for (let i = 0; i < 4; i++) { const p = c[i], q = c[(i + 1) % 4]; ctx.quad(a[0] + p[0], a[1] + p[1], a[2] + p[2], a[0] + q[0], a[1] + q[1], a[2] + q[2], b[0] + q[0], b[1] + q[1], b[2] + q[2], b[0] + p[0], b[1] + p[1], b[2] + p[2]); }
}
