// Broken Lantern Road clutter, one file, one `kind` per prop (params.kind):
// wagon · tree · banner · bones · lantern · bell. Origin at the foot, front −Z.
import { kit, rng, lantern } from "./vf-kit.js";
const WOOD = "/cdn/value.fd7f44461fb4757d95a177f1a9112b573154f57737f844a4558b4b32e21521ae.png";
const BARK = "cdn/texture-dead-grey-tree-bark.png";
const IRON = "/cdn/value.fc2d6f2f81f6d5fa8b807c3778839023b0680cf71709aafbaf66806426b4a17c.png";
const CLOTH = "cdn/texture-faded-tattered-linen.png";
export function geometry(ctx) {
  const p = ctx.params, K = kit(ctx), r = rng(p.seed ?? 1);
  ({ wagon, tree, banner, bones, lantern: fallenLantern, bell })[p.kind ?? "bones"](ctx, K, r, p);
}
function wheel(ctx, K, R, spokes = 8, broken = 0) {
  // in the local XY plane, axle along Z
  const n = 14;
  for (let i = 0; i < n - broken; i++) {
    const a0 = (i / n) * Math.PI * 2, a1 = ((i + 1) / n) * Math.PI * 2;
    K.tube([Math.cos(a0) * R, Math.sin(a0) * R, 0], [Math.cos(a1) * R, Math.sin(a1) * R, 0], 0.05, 0.05, 4, true);
  }
  K.cyl(0, 0, -0.1, 0.1, 0.1, 0.2, 8);
  for (let i = 0; i < spokes - (broken ? 2 : 0); i++) { const a = (i / spokes) * Math.PI * 2; K.tube([0, 0, 0], [Math.cos(a) * R, Math.sin(a) * R, 0], 0.03, 0.025, 4); }
}
function wagon(ctx, K, r, p) {
  ctx.albedo(WOOD); ctx.color("oklch(0.66 0.045 60)"); ctx.roughness(0.9);
  // the bed, tipped onto its broken east corner
  K.push().t(0, 0.62, 0).rz(-9).rx(4);
  K.bb(-0.85, 0, -1.6, 0.85, 0.08, 1.6);
  for (const s of [-1, 1]) {
    K.bb(s * 0.85 - 0.04, 0.08, -1.6, s * 0.85 + 0.04, 0.5, s > 0 ? 0.4 : 1.6); // side boards, east one torn short
    for (let z = -1.4; z < 1.6; z += 0.7) K.bb(s * 0.85 - 0.06, 0, z - 0.04, s * 0.85 + 0.06, 0.55, z + 0.04);
  }
  K.bb(-0.85, 0.08, 1.56, 0.85, 0.42, 1.64);
  K.bb(-0.8, -0.14, -1.5, -0.6, 0, 1.5); K.bb(0.6, -0.14, -1.5, 0.8, 0, 1.5);
  // canvas hoops, two still standing
  for (const z of [-1.2, -0.3, 0.6]) for (let i = 0; i < 8; i++) {
    const a0 = (i / 8) * Math.PI, a1 = ((i + 1) / 8) * Math.PI;
    if (z > 0.5 && i > 4) continue;
    K.tube([Math.cos(a0) * 0.85, 0.5 + Math.sin(a0) * 0.9, z], [Math.cos(a1) * 0.85, 0.5 + Math.sin(a1) * 0.9, z], 0.022, 0.022, 4);
  }
  // torn canvas over the front hoops, its rear edge ragged
  ctx.albedo(CLOTH); ctx.color("oklch(0.82 0.04 80)"); ctx.roughness(1);
  for (let i = 0; i < 8; i++) {
    const a0 = (i / 8) * Math.PI, a1 = ((i + 1) / 8) * Math.PI, e0 = -0.1 - r() * 0.5, e1 = -0.1 - r() * 0.5;
    K.q([Math.cos(a0) * 0.87, 0.5 + Math.sin(a0) * 0.92, -1.3], [Math.cos(a0) * 0.87, 0.5 + Math.sin(a0) * 0.92, e0], [Math.cos(a1) * 0.87, 0.5 + Math.sin(a1) * 0.92, e1], [Math.cos(a1) * 0.87, 0.5 + Math.sin(a1) * 0.92, -1.3]);
  }
  // spilled sacks and a chest in the bed
  ctx.smooth(); ctx.color("oklch(0.7 0.04 75)");
  for (const [x, z] of [[-0.4, 1.0], [0.1, 1.2], [-0.3, 0.3]]) K.loft([K.circ(x, 0.08, z, 0.25, 0.2, 8), K.circ(x, 0.25, z, 0.27, 0.22, 8), K.circ(x, 0.38, z, 0.12, 0.1, 8)], false, true);
  ctx.flat(); K.pop();
  // wheels: the west pair on, one east wheel lying in the road dust
  ctx.albedo(WOOD); ctx.color("oklch(0.6 0.04 60)");
  for (const z of [-1.1, 1.1]) { K.push().t(-1.0, 0.62, z).ry(90); wheel(ctx, K, 0.6); K.pop(); }
  K.push().t(1.25, 0.6, 1.1).rz(-28).ry(90); wheel(ctx, K, 0.6, 8, 3); K.pop();
  K.push().t(1.9, 0.06, -0.9).rx(90); wheel(ctx, K, 0.6, 8, 0); K.pop();
  K.tube([-1.1, 0.62, -1.1], [0.9, 0.35, -1.1], 0.05, 0.05, 6, true);
  // shafts dropped to the ground, one snapped
  K.tube([-0.5, 0.5, -1.6], [-0.6, 0.05, -3.4], 0.05, 0.045, 6, true);
  K.tube([0.5, 0.45, -1.6], [0.55, 0.2, -2.5], 0.05, 0.045, 6, true);
  K.tube([0.7, 0.04, -2.7], [0.9, 0.04, -3.5], 0.045, 0.04, 6, true);
  // a lantern still hung on the front hoop
  K.push().t(-0.75, 1.15, -1.75); lantern(K, ctx, false, 0.07); K.pop();
}
function branch(K, ctx, r, a, d, len, rad, depth) {
  const b = [a[0] + d[0] * len, a[1] + d[1] * len, a[2] + d[2] * len];
  K.tube(a, b, rad, rad * 0.62, depth > 2 ? 7 : 5, false);
  if (depth <= 0 || (ctx.lod > 2 && depth <= 1)) return;
  const n = depth > 2 ? 3 : 2;
  for (let i = 0; i < n; i++) {
    const yaw = r() * Math.PI * 2, spread = 0.5 + r() * 0.5;
    let nd = [d[0] + Math.cos(yaw) * spread, d[1] * (0.6 + r() * 0.3), d[2] + Math.sin(yaw) * spread];
    const l = Math.hypot(...nd); nd = nd.map((v) => v / l);
    branch(K, ctx, r, b, nd, len * (0.55 + r() * 0.2), rad * 0.62, depth - 1);
  }
}
function tree(ctx, K, r, p) {
  const h = p.h ?? 5;
  ctx.albedo(BARK); ctx.color("oklch(0.68 0.015 70)"); ctx.roughness(0.95); ctx.smooth();
  // root flare
  for (let i = 0; i < 5; i++) { const a = (i / 5) * 6.28 + r(); K.tube([0, 0.5, 0], [Math.cos(a) * 0.9, -0.15, Math.sin(a) * 0.9], 0.16, 0.05, 6, true); }
  const lean = [(r() - 0.5) * 0.25, 1, (r() - 0.5) * 0.25], l = Math.hypot(...lean);
  branch(K, ctx, r, [0, -0.2, 0], lean.map((v) => v / l), h * 0.45, 0.26 * (h / 5), p.depth ?? 4);
  if (p.snag) { ctx.color("oklch(0.58 0.02 70)"); K.tube([0.4, 0.05, 0.3], [2.6, 0.2, 1.1], 0.14, 0.08, 6, true); }
  ctx.flat();
}
function banner(ctx, K, r, p) {
  const h = p.h ?? 3.2;
  ctx.albedo(WOOD); ctx.color("oklch(0.6 0.04 60)"); ctx.roughness(0.9);
  K.push().rz(p.lean ?? 0);
  K.cyl(0, -0.3, 0, 0.06, 0.045, h + 0.3, 7);
  K.bb(-0.55, h - 0.25, -0.03, 0.55, h - 0.18, 0.03);
  ctx.albedo(IRON); ctx.color("oklch(0.85 0.01 250)"); ctx.metalness(0.5);
  K.loft([K.circ(0, h, 0, 0.05, 0.05, 6), K.circ(0, h + 0.18, 0, 0.005, 0.005, 6)], false, false);
  ctx.metalness(0);
  // the cloth, rows hanging from the bar, tattered at the hem
  ctx.albedo(CLOTH); ctx.color(p.tint ?? "oklch(0.62 0.09 30)"); ctx.roughness(1);
  const cols = 6, w = 1.0, drop = p.drop ?? 1.6, top = h - 0.22;
  const hem = []; for (let i = 0; i <= cols; i++) hem.push(drop * (0.65 + r() * 0.35) * (i % 2 ? 0.9 : 1));
  for (let i = 0; i < cols; i++) {
    const x0 = -w / 2 + (i / cols) * w, x1 = -w / 2 + ((i + 1) / cols) * w, sw = (x) => Math.sin(x * 5) * 0.03;
    const rows = 4;
    for (let j = 0; j < rows; j++) {
      const t0 = j / rows, t1 = (j + 1) / rows;
      const y00 = top - hem[i] * t0, y01 = top - hem[i] * t1, y10 = top - hem[i + 1] * t0, y11 = top - hem[i + 1] * t1;
      K.q([x0, y00, sw(x0) + t0 * 0.12], [x0, y01, sw(x0) + t1 * 0.12], [x1, y11, sw(x1) + t1 * 0.12], [x1, y10, sw(x1) + t0 * 0.12]);
    }
  }
  // a pale lantern sigil stitched on the face
  ctx.albedo(null); ctx.color("oklch(0.86 0.04 85)");
  const cy = top - drop * 0.35;
  K.bb(-0.14, cy - 0.2, -0.012, 0.14, cy - 0.16, -0.005); K.bb(-0.14, cy + 0.14, -0.012, 0.14, cy + 0.18, -0.005);
  K.bb(-0.14, cy - 0.2, -0.012, -0.1, cy + 0.18, -0.005); K.bb(0.1, cy - 0.2, -0.012, 0.14, cy + 0.18, -0.005);
  K.push().t(0, cy, -0.01).rz(45); K.bb(-0.05, -0.05, -0.003, 0.05, 0.05, 0.004); K.pop();
  K.pop();
}
function boneTube(K, a, b, rr) {
  K.tube(a, b, rr, rr * 0.8, 6, true);
  for (const e of [a, b]) K.loft([K.circ(e[0], e[1] - rr * 1.3, e[2], rr * 1.6, rr * 1.6, 6), K.circ(e[0], e[1] + rr * 1.3, e[2], rr * 1.4, rr * 1.4, 6)]);
}
function skull(ctx, K, r) {
  ctx.smooth(); ctx.color("oklch(0.86 0.03 85)");
  const ring = (y, rx, rz, z = 0) => K.circ(0, y, z, rx, rz, 10);
  K.loft([ring(0, 0.06, 0.07, -0.02), ring(0.05, 0.08, 0.1), ring(0.11, 0.085, 0.105), ring(0.17, 0.065, 0.085), ring(0.2, 0.02, 0.03)], true, true);
  ctx.flat(); ctx.color("oklch(0.15 0.01 60)");
  for (const s of [-1, 1]) K.bb(s * 0.035 - 0.022, 0.07, -0.106, s * 0.035 + 0.022, 0.105, -0.09);
  K.bb(-0.01, 0.04, -0.1, 0.01, 0.065, -0.085);
  ctx.color("oklch(0.82 0.03 85)"); K.bb(-0.045, 0, -0.1, 0.045, 0.03, -0.04); // jaw
}
function bones(ctx, K, r, p) {
  ctx.roughness(0.8); ctx.color("oklch(0.84 0.03 85)");
  const n = p.n ?? 6;
  for (let i = 0; i < n; i++) {
    const x = (r() - 0.5) * 1.6, z = (r() - 0.5) * 1.6, a = r() * 6.28, l = 0.25 + r() * 0.25;
    ctx.color(r() < 0.5 ? "oklch(0.84 0.03 85)" : "oklch(0.76 0.04 80)");
    boneTube(K, [x, 0.03, z], [x + Math.cos(a) * l, 0.03, z + Math.sin(a) * l], 0.018);
  }
  // a ribcage arc half sunk
  for (let i = 0; i < 4; i++) K.tube([0.3, 0.0, 0.2 + i * 0.07], [0.42, 0.13, 0.2 + i * 0.07], 0.012, 0.01, 4, false), K.tube([0.42, 0.13, 0.2 + i * 0.07], [0.55, 0.0, 0.22 + i * 0.07], 0.01, 0.008, 4, false);
  K.tube([0.42, 0.13, 0.15], [0.42, 0.13, 0.5], 0.016, 0.016, 5, true);
  for (let s = 0; s < (p.skulls ?? 1); s++) { K.push().t(-0.3 + s * 0.5, 0, -0.35 + s * 0.2).ry(r() * 360).rz((r() - 0.5) * 40); skull(ctx, K, r); K.pop(); }
}
function fallenLantern(ctx, K, r, p) {
  K.push().t(0, 0.1, 0).rz(88).t(-0.1, -0.1, 0); lantern(K, ctx, true, 0.05); K.pop();
  ctx.albedo(null); ctx.color("oklch(0.82 0.06 82)"); ctx.smooth();
  K.loft([K.circ(0.22, 0, 0.05, 0.12, 0.08, 8), K.circ(0.22, 0.012, 0.05, 0.07, 0.05, 8)], false, true); // spilled wax
}
function bell(ctx, K, r, p) {
  const oy = p.body ? -2.25 : 0, oz = p.body ? 0.8 : 0; // body: the bell alone, its hook at the origin
  if (!p.body) {
  ctx.albedo(WOOD); ctx.color("oklch(0.6 0.04 60)"); ctx.roughness(0.9);
  K.cbox(0, 0, 0, 0.6, 0.25, 0.6, 0.05);
  K.cbox(0, 0.2, 0, 0.22, 2.55, 0.22, 0.03);
  K.bb(-0.09, 2.35, -0.95, 0.09, 2.53, 0.12); // the arm, out over the court (−Z)
  K.tube([0, 1.7, -0.02], [0, 2.38, -0.6], 0.04, 0.04, 5, true); // brace
  }
  if (p.split) return; // the bell hangs as its own swinging child
  ctx.albedo(IRON); ctx.color("oklch(0.85 0.01 250)"); ctx.metalness(0.7); ctx.roughness(0.45); ctx.smooth();
  K.bb(-0.03, 2.25 + oy, -0.85 + oz, 0.03, 2.35 + oy, -0.75 + oz);
  const z = -0.8 + oz, y = 1.72 + oy, rr = [[0.27, 0], [0.25, 0.04], [0.19, 0.12], [0.16, 0.3], [0.15, 0.42], [0.11, 0.5], [0.03, 0.53]];
  K.loft(rr.map(([ra, h]) => K.circ(0, y + h, z, ra, ra, 14)), false, true);
  K.tube([0, y + 0.45, z], [0.02, y - 0.02, z], 0.012, 0.012, 4); K.loft([K.circ(0.02, y - 0.08, z, 0.03, 0.03, 6), K.circ(0.02, y - 0.02, z, 0.035, 0.035, 6)]);
  if (p.body) return;
  ctx.metalness(0); ctx.flat(); ctx.albedo(null);
  ctx.color("oklch(0.62 0.05 75)"); ctx.roughness(1);
  K.tube([0.02, y - 0.08, z], [0.08, 0.9, -0.55], 0.012, 0.012, 4); // the pull rope
  K.tube([0.08, 0.9, -0.55], [0.12, 0.85, -0.3], 0.012, 0.012, 4);
}
export function collider(ctx) {
  const p = ctx.params, K = kit(ctx);
  if (p.kind === "wagon") { K.bb(-1.1, 0, -1.7, 1.1, 1.3, 1.7); return; }
  if (p.kind === "tree") { K.bb(-0.35, 0, -0.35, 0.35, 3, 0.35); return; }
  if (p.kind === "bell") { K.bb(-0.3, 0, -0.3, 0.3, 2.6, 0.3); return; }
  if (p.kind === "banner") { K.bb(-0.08, 0, -0.08, 0.08, 3, 0.08); return; }
  return null;
}
