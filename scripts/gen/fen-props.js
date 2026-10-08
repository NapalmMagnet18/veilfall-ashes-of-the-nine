// Lanternmere clutter, one file, one `kind` per prop (params.kind): waymarker · charmrope · lamppost · brazier.
// Origin at the foot, front −Z.
import { kit, rng, lantern } from "./vf-kit.js";
import { TX, WAX, blob } from "./fen-kit.js";
export function geometry(ctx) {
  const p = ctx.params, K = kit(ctx), r = rng(p.seed ?? 1);
  ctx.flat();
  ({ waymarker, charmrope, lamppost, brazier })[p.kind ?? "lamppost"](ctx, K, r, p, ctx.lod);
}
const stone = (ctx, c) => { ctx.albedo(TX.stone); ctx.color(c); ctx.roughness(0.55); ctx.metalness(0); };
// a pilgrim waymarker snapped at its foot and fallen west along the road
function waymarker(ctx, K, r, p, L) {
  stone(ctx, "oklch(.74 .012 230)");
  K.cbox(0, -0.05, 0, 0.6, 0.23, 0.6, 0.04);
  const J = [0.18, 0.42, 0.3, 0.5].map((v) => v + r() * 0.12);
  K.loft([K.rect(0, 0.18, 0, 0.18, 0.18), K.rect(0, 0.3, 0, 0.17, 0.17).map((q, i) => [q[0], J[i], q[2]])], false, true);
  K.push().t(0.5, 0.18, 0.05).ry(-6).rz(-90).rx(4);
  stone(ctx, "oklch(.78 .012 235)");
  K.loft([K.rect(0, 0, 0, 0.17, 0.17).map((q, i) => [q[0], [0.1, 0.0, 0.14, 0.05][i], q[2]]), K.rect(0, 1.75, 0, 0.16, 0.16)], true, false);
  K.cbox(0, 1.4, 0, 0.4, 0.12, 0.4, 0.02);
  K.loft([K.rect(0, 1.75, 0, 0.16, 0.16), K.rect(0, 2.05, 0, 0.01, 0.01)], false, true);
  ctx.albedo(null); ctx.color("oklch(.25 .02 230)"); ctx.roughness(0.9);
  for (let k = 0; k < 4; k++) { const y = 0.35 + k * 0.24; K.q([0.172, y, -0.02], [0.172, y + 0.16, -0.02], [0.172, y + 0.16, 0.02], [0.172, y, 0.02]); K.q([0.172, y + 0.08, -0.07], [0.172, y + 0.11, -0.07], [0.172, y + 0.11, 0.07], [0.172, y + 0.08, 0.07]); }
  ctx.albedo(TX.iron); ctx.color("oklch(.6 .05 45)"); ctx.metalness(0.5); K.tube([0.17, 1.2, 0], [0.4, 1.2, 0], 0.02, 0.02, 4); K.tube([0.4, 1.2, 0], [0.42, 1.0, 0], 0.015, 0.015, 4);
  K.pop();
  // remembrance candles guttered on the stump
  ctx.albedo(TX.wax); ctx.metalness(0); ctx.roughness(0.5);
  for (let k = 0; k < 4; k++) { const x = (r() - 0.5) * 0.4, z = (r() - 0.5) * 0.4; ctx.color(WAX[k % 3]); K.cyl(x, 0.17, z, 0.03, 0.028, 0.05 + r() * 0.12, 6); }
  ctx.color(WAX[0]); blob(K, r, 0, 0.181, 0, 0.26, 0.24, 8);
}
// two leaning posts and a sagging rope of wax charms strung high between them
function charmrope(ctx, K, r, p, L) {
  const S = p.span ?? 10, H = p.h ?? 3.4, lean = 7, tops = [];
  ctx.albedo(TX.wood); ctx.roughness(0.9); ctx.metalness(0);
  for (const s of [-1, 1]) {
    ctx.color("oklch(.62 .035 60)");
    const th = s * lean * Math.PI / 180;
    K.push().t(0, 0, s * S / 2).rx(s * lean);
    K.cyl(0, -0.2, 0, 0.11, 0.08, H + 0.2, 7);
    K.tube([-0.25, H - 0.35, 0], [0.25, H - 0.25, 0], 0.045, 0.04, 5, true);
    ctx.albedo(TX.iron); ctx.color("oklch(.55 .04 45)"); ctx.metalness(0.5); K.cyl(0, H - 0.6, 0, 0.12, 0.12, 0.06, 8); ctx.albedo(TX.wood); ctx.metalness(0);
    ctx.albedo(TX.wax); for (let k = 0; k < 5; k++) { ctx.color(WAX[k % 3]); K.cyl((r() - 0.5) * 0.18, 1.0 + k * 0.05, -0.12 - r() * 0.05, 0.025, 0.022, 0.18 + r() * 0.1, 5); } ctx.albedo(TX.wood);
    tops.push([0, (H - 0.3) * Math.cos(th), s * S / 2 + (H - 0.3) * Math.sin(th)]);
    K.pop();
  }
  const [A, B] = tops, sag = p.sag ?? 0.75, N = 22, pt = (t) => [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t - sag * (1 - (2 * t - 1) ** 2), A[2] + (B[2] - A[2]) * t];
  ctx.albedo(null); ctx.color("oklch(.58 .03 70)"); ctx.roughness(1);
  for (let i = 0; i < N; i++) K.tube(pt(i / N), pt((i + 1) / N), 0.018, 0.018, 4);
  for (let t = 0.05; t < 0.96; t += 0.04 + r() * 0.025) {
    const q = pt(t), drop = 0.1 + r() * 0.35, b = [q[0], q[1] - drop, q[2]];
    ctx.albedo(null); ctx.color("oklch(.5 .03 60)"); K.tube(q, b, 0.005, 0.005, 3);
    const kind = r();
    if (kind < 0.45) { ctx.albedo(TX.wax); ctx.color(WAX[Math.floor(r() * 3)]); ctx.roughness(0.45); K.loft([K.circ(b[0], b[1], b[2], 0.012, 0.012, 6), K.circ(b[0], b[1] - 0.05, b[2], 0.045, 0.045, 6), K.circ(b[0], b[1] - 0.12, b[2], 0.03, 0.03, 6), K.circ(b[0], b[1] - 0.17, b[2], 0.005, 0.005, 6)], false, false); }
    else if (kind < 0.8) { ctx.albedo(TX.wax); ctx.color(WAX[Math.floor(r() * 3)]); ctx.roughness(0.45); K.push().t(b[0], b[1] - 0.06, b[2]).ry(r() * 180).rx(90); K.cyl(0, -0.01, 0, 0.055, 0.055, 0.02, 8); ctx.color("oklch(.5 .14 28)"); K.cyl(0, 0.01, 0, 0.022, 0.022, 0.012, 6); K.pop(); }
    else { ctx.albedo(null); ctx.color(r() < 0.5 ? "oklch(.48 .12 28)" : "oklch(.78 .03 85)"); ctx.roughness(1); const w = 0.025, l = 0.3 + r() * 0.25; K.q([b[0], b[1], b[2] - w], [b[0], b[1], b[2] + w], [b[0] + 0.03, b[1] - l, b[2] + w * 0.6], [b[0] + 0.03, b[1] - l, b[2] - w * 0.6]); }
  }
}
// an iron lantern post: dead and leaning, or (glow) a sickly green-white lamp still burning
function lamppost(ctx, K, r, p, L) {
  const h = p.h ?? 3, lean = p.lean ?? 0;
  stone(ctx, "oklch(.72 .012 230)"); K.cbox(0, -0.1, 0, 0.55, 0.42, 0.55, 0.04);
  K.push().rx(-lean).rz((r() - 0.5) * 3);
  ctx.albedo(TX.iron); ctx.color("oklch(.58 .03 45)"); ctx.metalness(0.55); ctx.roughness(0.65);
  const top = p.snap ? h * (0.55 + r() * 0.2) : h;
  K.cyl(0, 0.3, 0, 0.075, 0.055, top - 0.3, 8);
  K.cyl(0, 0.3, 0, 0.11, 0.1, 0.12, 8); K.cyl(0, 1.2, 0, 0.08, 0.08, 0.05, 8);
  if (p.snap) { K.tube([0, top, 0], [0.05, top + 0.12, 0.03], 0.05, 0.01, 5, true); }
  else {
    K.cyl(0, top - 0.05, 0, 0.09, 0.05, 0.12, 8);
    K.tube([0, top - 0.25, 0], [0, top - 0.02, -0.35], 0.025, 0.025, 5); K.tube([0, top - 0.02, -0.35], [0, top - 0.12, -0.62], 0.025, 0.022, 5);
    K.tube([0, top - 0.12, -0.62], [0, top - 0.3, -0.62], 0.008, 0.008, 4);
  }
  if (!p.snap && !p.dropped) { K.push().t(0, top - 0.88, -0.62).sc(1.45); lantern(K, ctx, !p.glow, p.glow ? 0.1 : 0.04); K.pop(); }
  if (p.glow && !p.snap) { ctx.albedo(null); ctx.color("oklch(.92 .08 150)"); ctx.emissive(2.0, 3.2, 2.3); K.cyl(0, top - 0.7, -0.62, 0.05, 0.035, 0.12, 6); ctx.emissive(null); }
  K.pop();
  if (p.snap || p.dropped) { K.push().t(0.35, 0.12, -0.45).ry(r() * 90).rz(84); lantern(K, ctx, true, 0.04); K.pop(); }
}
// a three-legged iron brazier, coals banked in the bowl (its fire is the placement's fx)
function brazier(ctx, K, r, p, L) {
  stone(ctx, "oklch(.72 .012 230)"); K.cbox(0, -0.1, 0, 1.1, 0.2, 1.1, 0.04);
  ctx.albedo(TX.iron); ctx.color("oklch(.55 .03 45)"); ctx.metalness(0.55); ctx.roughness(0.6);
  for (let k = 0; k < 3; k++) { const a = (k / 3) * 6.283 + 0.4; K.tube([Math.cos(a) * 0.45, 0.08, Math.sin(a) * 0.45], [Math.cos(a) * 0.18, 0.8, Math.sin(a) * 0.18], 0.035, 0.03, 5, true); K.tube([Math.cos(a) * 0.45, 0.08, Math.sin(a) * 0.45], [Math.cos(a) * 0.52, 0.1, Math.sin(a) * 0.52], 0.04, 0.04, 5, true); }
  K.loft([K.circ(0, 0.75, 0, 0.15, 0.15, 12), K.circ(0, 0.88, 0, 0.42, 0.42, 12), K.circ(0, 0.98, 0, 0.5, 0.5, 12)], true, false);
  for (let i = 0; i < 12; i++) { const a0 = (i / 12) * 6.283, a1 = ((i + 1) / 12) * 6.283; K.tube([Math.cos(a0) * 0.5, 0.98, Math.sin(a0) * 0.5], [Math.cos(a1) * 0.5, 0.98, Math.sin(a1) * 0.5], 0.025, 0.025, 4); }
  for (let k = 0; k < 6; k++) { const a = (k / 6) * 6.283; K.tube([Math.cos(a) * 0.5, 0.98, Math.sin(a) * 0.5], [Math.cos(a) * 0.55, 1.14, Math.sin(a) * 0.55], 0.018, 0.008, 4); }
  ctx.metalness(0); ctx.albedo(null); ctx.roughness(0.9);
  for (let k = 0; k < 14; k++) { const a = r() * 6.283, d = r() * 0.32; ctx.color("oklch(.3 .02 40)"); if (r() < 0.6) ctx.emissive(2.6 + r() * 1.5, 0.7 + r() * 0.4, 0.15); K.cbox(Math.cos(a) * d, 0.86 + r() * 0.04, Math.sin(a) * d, 0.12 + r() * 0.08, 0.07 + r() * 0.05, 0.1 + r() * 0.08, 0.02); ctx.emissive(null); }
}
export function collider(ctx) {
  const p = ctx.params, K = kit(ctx), k = p.kind ?? "lamppost";
  if (k === "waymarker") K.bb(-0.35, -0.05, -0.35, 2.6, 0.42, 0.4);
  else if (k === "charmrope") { const S = p.span ?? 10; for (const s of [-1, 1]) K.bb(-0.16, 0, s * S / 2 - 0.16, 0.16, 2.8, s * S / 2 + 0.16); }
  else if (k === "brazier") K.bb(-0.55, -0.1, -0.55, 0.55, 1.0, 0.55);
  else K.bb(-0.28, -0.1, -0.28, 0.28, (p.h ?? 3) * (p.snap ? 0.6 : 1), 0.28);
}
