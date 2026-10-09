// A Candlehold townhouse: soot-dark ashlar ground floor with a plank door and a shuttered shop window,
// a jettied limewash upper floor in dark oak framing with cross braces, warm-lit leaded windows,
// a steep slate gable with a chimney. params { w, d, seed, lit } ; −Z faces the street.
import { ASHLAR, PLASTER, TIMBER, SLATE, box, cbox, gable, gableEnds, beam } from "./cap-kit.js";
export function geometry(ctx) {
  const r = () => ctx.random(), lod = ctx.lod ?? 1, p = ctx.params ?? {};
  const w = p.w ?? 6.5, d = p.d ?? 5.5, g = 3.1, u = 2.7, j = 0.45, rise = 2.6 + r() * 1.2;
  ctx.flat(); ctx.roughness(0.9);
  // plinth + ground floor stone
  ctx.albedo(ASHLAR); ctx.color("oklch(0.92 0.01 250)");
  cbox(ctx, 0, -0.4, 0, w + 0.3, 0.7, d + 0.3, 0.08);
  box(ctx, 0, 0.3, 0, w, g - 0.3, d);
  if (lod <= 2) for (const s of [-1, 1]) cbox(ctx, s * (w / 2 - 0.2), 0, -d / 2 - 0.05, 0.5, g, 0.3, 0.05); // quoins
  // jettied upper floor: plaster box overhanging front and back, timber frame over it
  const uw = w + 0.2, ud = d + j * 2, y1 = g, y2 = g + u;
  ctx.albedo(TIMBER); ctx.color("oklch(0.55 0.02 60)");
  box(ctx, 0, y1 - 0.25, 0, uw + 0.1, 0.3, ud + 0.1); // the jetty sill beam
  if (lod <= 2) for (let i = 0; i <= Math.round(w / 0.8); i++) box(ctx, -w / 2 + i * (w / Math.round(w / 0.8)), y1 - 0.45, -d / 2 - j / 2, 0.14, 0.2, j); // joist ends
  ctx.albedo(PLASTER); ctx.color(`oklch(${0.9 + r() * 0.06} 0.02 ${70 + r() * 20})`);
  box(ctx, 0, y1, 0, uw, u, ud);
  gableEnds(ctx, uw, ud, y2, rise);
  // timber frame on the front and back faces
  ctx.albedo(TIMBER); ctx.color("oklch(0.42 0.02 55)");
  const fz = [-ud / 2 - 0.04, ud / 2 + 0.04], posts = Math.max(3, Math.round(uw / 1.6));
  for (const z of fz) {
    beam(ctx, [-uw / 2, y2 - 0.05, z], [uw / 2, y2 - 0.05, z], 0.2);
    beam(ctx, [-uw / 2, y1 + 1.05, z], [uw / 2, y1 + 1.05, z], 0.12);
    for (let i = 0; i <= posts; i++) { const x = -uw / 2 + (i / posts) * uw; beam(ctx, [x, y1, z], [x, y2, z], 0.18); }
    if (lod <= 2) for (let i = 0; i < posts; i += 2) { const xa = -uw / 2 + (i / posts) * uw, xb = -uw / 2 + ((i + 1) / posts) * uw; beam(ctx, [xa, y1 + 0.05, z], [xb, y1 + 1.0, z], 0.1); beam(ctx, [xb, y1 + 0.05, z], [xa, y1 + 1.0, z], 0.1); }
  }
  for (const x of [-uw / 2 - 0.04, uw / 2 + 0.04]) { beam(ctx, [x, y1, -ud / 2], [x, y2, -ud / 2], 0.2); beam(ctx, [x, y1, ud / 2], [x, y2, ud / 2], 0.2); beam(ctx, [x, y2, -ud / 2], [x, y2 + rise, 0], 0.16); beam(ctx, [x, y2, ud / 2], [x, y2 + rise, 0], 0.16); }
  // door: plank leaf in a stone surround, iron strap hinges, step
  ctx.albedo(ASHLAR); ctx.color("oklch(0.85 0.01 250)");
  const dx = (r() - 0.5) * (w - 2.4);
  cbox(ctx, dx, 0, -d / 2 - 0.12, 1.6, 2.5, 0.22, 0.04);
  cbox(ctx, dx, -0.3, -d / 2 - 0.55, 1.6, 0.35, 0.6, 0.04);
  ctx.albedo(TIMBER); ctx.color("oklch(0.38 0.04 45)");
  box(ctx, dx, 0.05, -d / 2 - 0.24, 1.1, 2.2, 0.06);
  ctx.albedo(null); ctx.color("oklch(0.18 0.01 60)"); ctx.metalness(0.7); ctx.roughness(0.5);
  if (lod <= 2) for (const y of [0.45, 1.75]) box(ctx, dx - 0.15, y, -d / 2 - 0.28, 0.8, 0.06, 0.02);
  ctx.metalness(0); ctx.roughness(0.9);
  // windows: lit leaded panes (emissive warm) or dark, with frames and sills
  const lit = p.lit ?? 0.7, nW = Math.max(2, Math.round(uw / 2.2));
  for (const z of [-ud / 2 - 0.02, ud / 2 + 0.02]) for (let i = 0; i < nW; i++) {
    const x = -uw / 2 + ((i + 0.5) / nW) * uw, on = r() < lit, s = z < 0 ? -1 : 1;
    ctx.albedo(null);
    if (on) { ctx.color("oklch(0.75 0.12 70)"); ctx.emissive(2.4, 1.3, 0.45); } else { ctx.color("oklch(0.14 0.02 250)"); ctx.emissive(null); }
    const x0 = x - 0.42, x1 = x + 0.42, ya = y1 + 1.2, yb = y1 + 2.3;
    if (s < 0) ctx.quad(x0, ya, z, x0, yb, z, x1, yb, z, x1, ya, z); else ctx.quad(x1, ya, z, x1, yb, z, x0, yb, z, x0, ya, z);
    ctx.emissive(null);
    ctx.albedo(TIMBER); ctx.color("oklch(0.36 0.02 55)");
    beam(ctx, [x, ya, z + s * 0.03], [x, yb, z + s * 0.03], 0.06); beam(ctx, [x0, (ya + yb) / 2, z + s * 0.03], [x1, (ya + yb) / 2, z + s * 0.03], 0.06);
    box(ctx, x, ya - 0.08, z + s * 0.08, 1.0, 0.1, 0.18);
  }
  // ground floor shop window with a shutter propped open
  if (lod <= 2) {
    const sx = dx > 0 ? dx - 2.1 : dx + 2.1, on = r() < lit;
    ctx.albedo(null); if (on) { ctx.color("oklch(0.7 0.12 65)"); ctx.emissive(1.8, 0.9, 0.3); } else ctx.color("oklch(0.12 0.02 250)");
    ctx.quad(sx - 0.7, 0.9, -d / 2 - 0.02, sx - 0.7, 2.0, -d / 2 - 0.02, sx + 0.7, 2.0, -d / 2 - 0.02, sx + 0.7, 0.9, -d / 2 - 0.02); ctx.emissive(null);
    ctx.albedo(TIMBER); ctx.color("oklch(0.4 0.03 50)");
    box(ctx, sx, 0.78, -d / 2 - 0.35, 1.7, 0.1, 0.7); // counter flap
    beam(ctx, [sx - 0.8, 2.05, -d / 2 - 0.05], [sx - 0.8, 2.7, -d / 2 - 0.75], 0.08); // shutter strut
    box(ctx, sx, 2.05, -d / 2 - 0.4, 1.6, 0.06, 0.75);
  }
  // roof
  ctx.albedo(SLATE); ctx.color("oklch(0.75 0.015 240)");
  gable(ctx, uw, ud, y2, rise, 0.45, 0.14);
  if (lod <= 2) { ctx.albedo(TIMBER); ctx.color("oklch(0.35 0.02 50)"); beam(ctx, [-uw / 2 - 0.45, y2 + rise + 0.05, 0], [uw / 2 + 0.45, y2 + rise + 0.05, 0], 0.18); }
  // chimney
  ctx.albedo(ASHLAR); ctx.color("oklch(0.8 0.01 250)");
  const cx = (r() < 0.5 ? -1 : 1) * (uw / 2 - 0.7), cz = ud * 0.18;
  box(ctx, cx, y2, cz, 0.8, rise + 1.3, 0.8); cbox(ctx, cx, y2 + rise + 1.3, cz, 1.0, 0.2, 1.0, 0.05);
  ctx.albedo(null); ctx.color("oklch(0.08 0 0)"); box(ctx, cx, y2 + rise + 1.31, cz, 0.5, 0.2, 0.5);
}
export function collider(ctx) { const p = ctx.params ?? {}; const w = p.w ?? 6.5, d = p.d ?? 5.5; return { kind: "box", width: w + 0.3, height: 6, depth: d + 0.3, center: [0, 3, 0] }; }
