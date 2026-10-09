// The Tollhouse ruin on Broken Lantern Road. Origin mid-floor at ground level; the door is cut
// through the WEST (−X) wall. Inside 6 (x) × 7 (z) m, walls 0.4 m. The north half keeps its slate
// roof on a gable; the south half has fallen to bare rafters, a snapped ridge and rubble.
// A toll counter stands inside; melted wax-figure stubs huddle on the door step.
import { kit, rng } from "./vf-kit.js";
const STONE = "cdn/texture-weathered-grey-fieldstone-masonry.png";
const WOOD = "/cdn/value.fd7f44461fb4757d95a177f1a9112b573154f57737f844a4558b4b32e21521ae.png";
const SLATE = "cdn/texture-mossy-dark-slate-roof-shingles.png";
const X = 3.4, Z = 3.9, T = 0.4, H = 3.2, RIDGE = 5.0;
const DOOR = { a0: -0.6, a1: 0.6, y0: 0, y1: 2.3 };
const SOUTH = [[-X, H], [-2.2, 3.5], [-1.3, 2.5], [-0.3, 2.9], [0.8, 1.6], [2.0, 1.9], [X, 1.1]];
const EAST = [[-Z, H], [-1.0, H], [0.2, 2.6], [1.5, 2.9], [2.6, 1.7], [Z, 1.1]];
const NORTH = [[-X, H], [0, RIDGE], [X, H]];
export function geometry(ctx) {
  const K = kit(ctx), lod = ctx.lod, r = rng(17);
  // ---- walls
  ctx.albedo(STONE); ctx.color("oklch(0.93 0.01 250)"); ctx.roughness(0.85);
  K.band("z", -Z, Z, -X, -X + T, H, [DOOR]);
  K.prof("x", -Z, -Z + T, NORTH, 0);
  K.prof("x", Z - T, Z, SOUTH, 0);
  K.prof("z", X - T, X, EAST, 0);
  if (lod <= 3) {
    // a thicker footing course all round, the door gap left open
    ctx.color("oklch(0.8 0.01 250)");
    K.bb(-X - 0.08, 0, -Z - 0.08, -X + 0.1, 0.32, -0.6); K.bb(-X - 0.08, 0, 0.6, -X + 0.1, 0.32, Z + 0.08);
    K.bb(-X - 0.08, 0, -Z - 0.08, X + 0.08, 0.32, -Z + 0.1); K.bb(-X - 0.08, 0, Z - 0.1, X + 0.08, 0.32, Z + 0.08);
    K.bb(X - 0.1, 0, -Z - 0.08, X + 0.08, 0.32, Z + 0.08);
    // quoins up the standing corners
    ctx.color("oklch(0.98 0.01 250)");
    for (let y = 0.32, i = 0; y < 3.0; y += 0.42, i++) {
      const l = i % 2 ? 0.55 : 0.35;
      K.cbox(-X + l / 2 - 0.05, y, -Z - 0.04 + 0.2, l, 0.38, 0.48, 0.03);
      K.cbox(X - l / 2 + 0.05, y, -Z - 0.04 + 0.2, l, 0.38, 0.48, 0.03);
      if (y < 2.6) K.cbox(-X + 0.2 - 0.04, y, Z - l / 2 + 0.05, 0.48, 0.38, l, 0.03);
    }
    // door jamb stones and a heavy lintel
    ctx.color("oklch(0.97 0.01 250)");
    for (let y = 0.32; y < 2.2; y += 0.48) { K.cbox(-X - 0.03 + 0.24, y, -0.6 - 0.14, 0.5, 0.44, 0.28, 0.03); K.cbox(-X - 0.03 + 0.24, y, 0.6 + 0.14, 0.5, 0.44, 0.28, 0.03); }
    K.cbox(-X + 0.2, 2.3, 0, 0.5, 0.34, 1.9, 0.04);
    // stringcourse under the eaves on the north gable wall
    K.bb(-X - 0.06, 3.1, -Z - 0.07, X + 0.06, 3.22, -Z + 0.02);
  }
  // rubble where the south and east walls fell
  ctx.color("oklch(0.88 0.01 250)");
  const rub = [[0.2, 4.5, 1.6], [1.6, 4.6, 1.3], [2.8, 4.4, 1.5], [3.9, 2.8, 1.4], [4.1, 1.4, 1.1], [-1.4, 4.4, 0.9], [1.2, 2.5, 1.2], [2.3, 1.2, 1.0]];
  for (const [x, z, s] of rub) {
    const n = lod <= 2 ? 5 : 2;
    for (let i = 0; i < n; i++) {
      const w = (0.25 + r() * 0.3) * s, hh = 0.18 + r() * 0.2;
      K.push().t(x + (r() - 0.5) * s, 0, z + (r() - 0.5) * s * 0.8).ry(r() * 90).rz((r() - 0.5) * 25);
      K.cbox(0, -0.05, 0, w * 1.4, hh, w, 0.04); K.pop();
    }
  }
  // the door step
  ctx.color("oklch(0.85 0.01 250)");
  K.cbox(-X - 0.42, 0, 0, 0.7, 0.16, 2.1, 0.04);
  // moss along the wet foot
  ctx.albedo(null); ctx.roughness(1);
  if (lod <= 3) for (let i = 0; i < 26; i++) {
    const side = i % 4, t = r() * 2 - 1, rr = 0.12 + r() * 0.2;
    const [x, z] = side === 0 ? [-X - 0.12, t * Z] : side === 1 ? [X + 0.12, t * Z] : side === 2 ? [t * X, -Z - 0.12] : [t * X, Z + 0.12];
    if (side === 0 && Math.abs(z) < 1.2) continue;
    ctx.color(r() < 0.5 ? "oklch(0.42 0.08 135)" : "oklch(0.36 0.07 125)");
    K.loft([K.circ(x, 0, z, rr, rr * 0.8, 6), K.circ(x, 0.07, z, rr * 0.6, rr * 0.5, 6)], false, true);
  }
  // ---- timber: floor, roof frame, roof, counter
  ctx.albedo(WOOD); ctx.roughness(0.9);
  ctx.color("oklch(0.72 0.04 60)");
  for (let x = -X + T, i = 0; x < X - T - 0.05; x += 0.32, i++) {
    if (i === 12) continue; // a gap where a board rotted through
    const zEnd = i > 13 ? 1.4 + (i % 3) * 0.6 : Z - T;
    K.bb(x + 0.01, 0, -Z + T, x + 0.3, 0.05, zEnd);
  }
  ctx.color("oklch(0.62 0.04 60)");
  const a = Math.atan2(RIDGE - H, X) * 180 / Math.PI, L = Math.hypot(X + 0.35, (RIDGE - H) * (X + 0.35) / X);
  const midX = (X + 0.35) / 2, midY = RIDGE - (RIDGE - H) * (midX / X);
  // rafters: whole over the north half, the south ones broken or gone
  const rafters = [-3.6, -2.8, -2.0, -1.2, -0.4, 0.4, 1.2, 2.0, 2.8, 3.6];
  rafters.forEach((z, i) => {
    for (const s of [-1, 1]) {
      if (z > 0 && ((i + (s > 0 ? 1 : 0)) % 3 === 0)) continue;
      const len = z > 1.5 && s > 0 ? L * 0.55 : L;
      K.push().t(s * midX, midY, z).rz(s < 0 ? a : -a);
      K.bb(s < 0 ? L / 2 - len : -L / 2, -0.07, -0.06, s < 0 ? L / 2 : -L / 2 + len, 0.09, 0.06); K.pop();
    }
  });
  // tie beams across the walls; the ridge beam snapped at z 1.6, its end sagging
  for (const z of [-3.2, -0.8]) K.bb(-X + 0.1, H - 0.18, z - 0.1, X - 0.1, H, z + 0.1);
  K.bb(-0.09, RIDGE - 0.02, -Z - 0.2, 0.09, RIDGE + 0.16, 1.6);
  if (lod <= 3) { K.push().t(0, RIDGE + 0.05, 1.6).rx(28); K.bb(-0.08, -0.08, 0, 0.08, 0.08, 1.4); K.pop(); }
  // fallen rafters across the room
  K.push().t(1.0, 0.05, 1.5).ry(34).rz(-24); K.bb(-2.1, 0, -0.06, 2.1, 0.15, 0.07); K.pop();
  K.push().t(-0.8, 0.05, 2.6).ry(-12).rz(10); K.bb(-1.7, 0, -0.06, 1.7, 0.14, 0.07); K.pop();
  // the toll counter, facing the door
  ctx.color("oklch(0.66 0.045 60)");
  K.bb(0.55, 0, -2.4, 0.65, 1.0, 0.4); // front boards
  if (lod <= 2) for (let z = -2.35; z < 0.4; z += 0.3) K.bb(0.5, 0.05, z, 0.56, 0.95, z + 0.04);
  K.bb(1.2, 0, -2.35, 1.3, 1.0, -2.25); K.bb(1.2, 0, 0.25, 1.3, 1.0, 0.35);
  ctx.color("oklch(0.74 0.05 60)");
  K.cbox(0.95, 1.0, -1.0, 0.95, 0.07, 2.95, 0.02);
  K.bb(1.45, 0, -1.6, 1.85, 0.5, -1.2); // a stool
  // shelf on the north wall
  K.bb(-1.5, 1.7, -Z + T, 1.0, 1.75, -Z + T + 0.3);
  // north roof: slate slabs from the ridge to past the eave, with a torn southern edge
  ctx.albedo(SLATE); ctx.color("oklch(0.75 0.015 240)"); ctx.roughness(0.7);
  for (const s of [-1, 1]) {
    K.push().t(s * midX, midY + 0.12, 0).rz(s < 0 ? a : -a);
    K.bb(-L / 2 - 0.05, 0, -Z - 0.35, L / 2 + 0.05, 0.08, s < 0 ? 0.1 : -0.4);
    if (lod <= 2) {
      for (let u = -L / 2 + 0.3; u < L / 2; u += 0.36) K.bb(u - 0.02, 0.08, -Z - 0.33, u + 0.02, 0.12, s < 0 ? 0.08 : -0.42);
      // ragged slates along the torn edge
      for (let u = -L / 2; u < L / 2 - 0.2; u += 0.42) { const e = (s < 0 ? 0.1 : -0.4) + r() * 0.5; K.bb(u, 0, e - 0.4, u + 0.36, 0.06, e); }
    }
    K.pop();
  }
  // slates fallen into the room
  for (let i = 0; i < (lod <= 2 ? 14 : 4); i++) { K.push().t((r() - 0.5) * 5, 0.06, 0.5 + r() * 3).ry(r() * 180).rz((r() - 0.5) * 30); K.bb(-0.2, 0, -0.14, 0.2, 0.04, 0.14); K.pop(); }
  // ---- on the counter: an open ledger, an iron coin box, candles
  ctx.albedo(null);
  ctx.color("oklch(0.85 0.03 85)"); ctx.roughness(0.9);
  K.push().t(0.95, 1.07, -0.3).ry(8); K.bb(-0.16, 0, -0.22, 0, 0.03, 0.22); K.bb(0, 0, -0.22, 0.16, 0.035, 0.22); K.pop();
  ctx.color("oklch(0.3 0.06 30)"); K.push().t(0.95, 1.07, -0.3).ry(8); K.bb(-0.17, -0.005, -0.23, 0.17, 0.008, 0.23); K.pop();
  ctx.albedo("/cdn/value.fc2d6f2f81f6d5fa8b807c3778839023b0680cf71709aafbaf66806426b4a17c.png"); ctx.color("oklch(0.85 0.01 250)"); ctx.metalness(0.6);
  K.cbox(0.95, 1.07, -1.4, 0.3, 0.16, 0.22, 0.02); ctx.metalness(0); ctx.albedo(null);
  ctx.smooth(); ctx.roughness(0.55);
  for (const [x, z, h, rr] of [[0.9, -2.0, 0.16, 0.04], [1.02, -1.88, 0.28, 0.035], [0.84, -1.84, 0.09, 0.045]]) {
    ctx.color("oklch(0.8 0.07 82)"); K.loft([K.circ(x, 1.07, z, rr * 1.8, rr * 1.6, 8), K.circ(x, 1.09, z, rr, rr, 8)], false, true);
    ctx.color("oklch(0.88 0.04 86)"); K.cyl(x, 1.07, z, rr, rr * 0.85, h, 8);
    ctx.color("oklch(0.8 0.08 80)"); K.tube([x + rr, 1.07 + h, z], [x + rr * 1.05, 1.07 + h * 0.4, z], rr * 0.3, rr * 0.18, 5, true);
  }
  // ---- melted wax pilgrim stubs on the step, a wax puddle under each
  const stubs = [[-X - 0.45, -0.85, 0.62, 0.17], [-X - 0.35, 0.9, 0.48, 0.15], [-X - 0.95, 1.25, 0.38, 0.19], [-X - 0.9, -1.35, 0.55, 0.16]];
  const WAX = ["oklch(0.88 0.03 86)", "oklch(0.84 0.05 82)", "oklch(0.9 0.025 90)", "oklch(0.8 0.07 78)"];
  stubs.forEach(([x, z, h, rr], i) => {
    const y0 = Math.abs(z) < 1.05 && x > -X - 0.8 ? 0.16 : 0;
    ctx.color("oklch(0.8 0.07 80)");
    K.loft([K.circ(x, y0, z, rr * 2.1, rr * 1.8, 10, i, () => 0.8 + r() * 0.35), K.circ(x, y0 + 0.03, z, rr * 1.3, rr * 1.2, 10)], false, true);
    ctx.color(WAX[i]);
    const j = () => 0.85 + r() * 0.3;
    K.loft([
      K.circ(x, y0, z, rr * 1.3, rr * 1.2, 10, 0, j),
      K.circ(x, y0 + h * 0.35, z, rr * 1.0, rr * 0.9, 10, 0, j),
      K.circ(x + 0.02, y0 + h * 0.7, z, rr * 0.95, rr * 0.75, 10, 0, j), // slumped shoulders
      K.circ(x + 0.03, y0 + h * 0.78, z, rr * 0.5, rr * 0.45, 10),
      K.circ(x + 0.04, y0 + h * 0.92, z, rr * 0.55, rr * 0.5, 10, 0, j), // a sagging head
      K.circ(x + 0.04, y0 + h, z, rr * 0.25, rr * 0.25, 10),
    ], false, true);
    if (lod <= 2) for (let d = 0; d < 3; d++) { const an = r() * 6.28; K.tube([x + Math.cos(an) * rr * 0.9, y0 + h * 0.72, z + Math.sin(an) * rr * 0.8], [x + Math.cos(an) * rr * 1.2, y0 + 0.04, z + Math.sin(an) * rr * 1.1], 0.03, 0.02, 5, true); }
  });
}
export function collider(ctx) {
  const K = kit(ctx);
  K.band("z", -Z, Z, -X, -X + T, H, [DOOR]);
  K.bb(-X, 0, -Z, X, RIDGE - 0.6, -Z + T);
  K.bb(-X, 0, Z - T, X, 2.4, Z);
  K.bb(X - T, 0, -Z, X, 2.8, Z);
  K.bb(-X + T, 0, -Z + T, X - T, 0.05, Z - T);
  K.bb(0.5, 0, -2.4, 1.3, 1.07, 0.4);
  K.bb(-X - 0.77, 0, -1.05, -X, 0.16, 1.05);
}
