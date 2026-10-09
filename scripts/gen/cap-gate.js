// Candlehold's gatehouse: two round drum towers with slate cones, an arched passage between them
// under a crenellated gate block, a half-raised iron portcullis, the city's lantern crest over the arch.
// −Z faces OUT along the Pilgrims' Way; the passage runs along Z, 5 m wide.
import { ASHLAR, SLATE, IRON, TIMBER, box, cbox, ring, cone, beam } from "./cap-kit.js";
export function geometry(ctx) {
  const lod = ctx.lod ?? 1, n = lod >= 3 ? 10 : 20;
  ctx.flat(); ctx.roughness(0.92);
  for (const s of [-1, 1]) {
    const x = s * 5.6;
    ctx.albedo(ASHLAR); ctx.color("oklch(0.9 0.01 250)");
    ring(ctx, x, 0, -0.5, 1.2, 3.4, 3.1, n); ring(ctx, x, 0, 1.2, 11, 3.1, 3.0, n);
    if (lod <= 2) ring(ctx, x, 0, 6, 6.25, 3.15, 3.15, n);
    ring(ctx, x, 0, 11, 11.6, 3.0, 3.35, n); ring(ctx, x, 0, 11.6, 12.4, 3.35, 3.35, n);
    ctx.albedo(SLATE); ctx.color("oklch(0.72 0.015 240)"); cone(ctx, x, 0, 12.4, 3.6, 5.5, n);
    ctx.albedo(IRON); ctx.color("oklch(0.6 0.01 60)"); ctx.metalness(0.6); beam(ctx, [x, 17.9, 0], [x, 19.3, 0], 0.08); ctx.metalness(0);
    // tower windows, lit
    if (lod <= 2) { ctx.albedo(null); ctx.color("oklch(0.75 0.12 70)"); ctx.emissive(2.2, 1.2, 0.4); for (const y of [7.2, 9.4]) { const a = s < 0 ? -0.6 : 0.6, z = -Math.cos(a) * 3.02, xx = x + Math.sin(a) * 3.02 * -s; ctx.quad(xx - 0.25, y, z - 0.02, xx - 0.25, y + 1, z - 0.02, xx + 0.25, y + 1, z - 0.02, xx + 0.25, y, z - 0.02); } ctx.emissive(null); }
  }
  // gate block over the passage
  ctx.albedo(ASHLAR); ctx.color("oklch(0.88 0.01 250)");
  const W = 5, Hp = 4.6, D = 6;
  box(ctx, -W / 2 - 0.9, 0, 0, 1.8, Hp, D); box(ctx, W / 2 + 0.9, 0, 0, 1.8, Hp, D); // jambs
  box(ctx, 0, Hp + 1.2, 0, W + 3.6, 4.2, D); // over the arch
  // the arch: voussoir segments springing from the jambs
  const segs = lod >= 3 ? 4 : 9;
  for (const z of [-D / 2, D / 2]) for (let i = 0; i < segs; i++) {
    const a0 = Math.PI * (i / segs), a1 = Math.PI * ((i + 1) / segs), R = W / 2, cy = Hp - 0.6;
    const p0 = [-Math.cos(a0) * R, cy + Math.sin(a0) * 1.8], p1 = [-Math.cos(a1) * R, cy + Math.sin(a1) * 1.8];
    const q0 = [-Math.cos(a0) * (R + 0.5), cy + Math.sin(a0) * 2.3], q1 = [-Math.cos(a1) * (R + 0.5), cy + Math.sin(a1) * 2.3];
    const dz = z < 0 ? -0.15 : 0.15;
    ctx.color(i % 2 ? "oklch(0.8 0.01 250)" : "oklch(0.9 0.01 250)");
    box(ctx, (p0[0] + q1[0]) / 2, Math.min(p0[1], p1[1]) - 0.05, z + dz, Math.abs(q1[0] - p0[0]) + 0.1, Math.max(q0[1], q1[1]) - Math.min(p0[1], p1[1]) + 0.1, 0.5);
    // fill above the curve to the block
    ctx.color("oklch(0.88 0.01 250)"); box(ctx, (p0[0] + p1[0]) / 2, Math.max(p0[1], p1[1]), z * 0.999, Math.abs(p1[0] - p0[0]) + 0.02, Hp + 1.2 - Math.max(p0[1], p1[1]) + 0.01, 0.3);
  }
  // crenellation on the block
  if (lod <= 3) for (let i = 0; i < 7; i += 2) for (const z of [-D / 2 + 0.25, D / 2 - 0.25]) cbox(ctx, -4.3 + i * 1.23 + 0.6, Hp + 5.4, z, 1.1, 1.0, 0.5, 0.06);
  // portcullis, half raised
  ctx.albedo(IRON); ctx.color("oklch(0.55 0.01 60)"); ctx.metalness(0.6); ctx.roughness(0.55);
  for (let i = 0; i <= 7; i++) beam(ctx, [-W / 2 + 0.2 + i * (W - 0.4) / 7, 2.6, -1.4], [-W / 2 + 0.2 + i * (W - 0.4) / 7, Hp + 1.1, -1.4], 0.12);
  for (let k = 0; k < 4; k++) beam(ctx, [-W / 2 + 0.1, 2.8 + k * 0.8, -1.4], [W / 2 - 0.1, 2.8 + k * 0.8, -1.4], 0.1);
  if (lod <= 2) for (let i = 0; i <= 7; i++) { const x = -W / 2 + 0.2 + i * (W - 0.4) / 7; ctx.tri(x - 0.08, 2.6, -1.4, x + 0.08, 2.6, -1.4, x, 2.25, -1.4); }
  ctx.metalness(0); ctx.roughness(0.9);
  // crest over the arch: a lantern within a ring, gilded
  if (lod <= 2) { ctx.albedo(null); ctx.color("oklch(0.72 0.11 80)"); ctx.metalness(0.8); ctx.roughness(0.35); ring(ctx, 0, -D / 2 - 0.35, 0, 0, 0, 0, 1); for (let i = 0; i < 16; i++) { const a0 = i / 16 * 6.283, a1 = (i + 1) / 16 * 6.283; beam(ctx, [Math.cos(a0) * 0.9, 8.1 + Math.sin(a0) * 0.9, -D / 2 - 0.35], [Math.cos(a1) * 0.9, 8.1 + Math.sin(a1) * 0.9, -D / 2 - 0.35], 0.12); } ctx.metalness(0); ctx.emissive(2.6, 1.5, 0.5); ctx.color("oklch(0.8 0.12 75)"); box(ctx, 0, 7.75, -D / 2 - 0.4, 0.4, 0.7, 0.2); ctx.emissive(null); }
}
export function collider(ctx) { /* the towers and jambs; the passage open */
  const B = (cx, cy, cz, w, h, d) => { const x0 = cx - w / 2, x1 = cx + w / 2, y0 = cy, y1 = cy + h, z0 = cz - d / 2, z1 = cz + d / 2; ctx.quad(x0, y0, z0, x0, y1, z0, x1, y1, z0, x1, y0, z0); ctx.quad(x1, y0, z1, x1, y1, z1, x0, y1, z1, x0, y0, z1); ctx.quad(x0, y0, z1, x0, y1, z1, x0, y1, z0, x0, y0, z0); ctx.quad(x1, y0, z0, x1, y1, z0, x1, y1, z1, x1, y0, z1); ctx.quad(x0, y1, z0, x0, y1, z1, x1, y1, z1, x1, y1, z0); };
  B(-5.6, 0, 0, 6.4, 12, 6.4); B(5.6, 0, 0, 6.4, 12, 6.4); B(-3.4, 0, 0, 1.8, 6, 6); B(3.4, 0, 0, 1.8, 6, 6);
}
