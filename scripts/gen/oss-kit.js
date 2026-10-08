// The Ossuary of Saint Ysolde (under the Bell Crypt). params.kind:
//  "wall"   { r, a0, a1, h }   an arc of wall (centre at origin) packed with skull niches: rows of skulls in
//                              arched recesses, femurs stacked between, a wax-drowned base; faces inward
//  "column" { h }              a pier wrapped in femurs with a skull band every 0.8 m, candles on the plinth
//  "pile"   { r, n }           a heap of skulls and long bones swept against a wall
//  "arch"   { w, h }           the Bone Stair's mouth: two bone jambs, a lintel of skulls, wax down its face (front −Z)
//  "dais"   {}                 the Abbess's reliquary: three stepped slabs, an open lead-lined reliquary bed,
//                              a crozier rack, a hundred candles guttering cold
import { TEX, xf, bevelBox, lathe, candleBed, drip, puddle, WAXC, quad as fq } from "./shapes.js";
import { tube, I, rock } from "./hub-kit.js";
const BONE = "cdn/texture-old-yellowed-bone-surface-cracked.png";
const boneMat = (ctx, k = 0) => { ctx.albedo(BONE); ctx.color(["oklch(.86 .03 85)", "oklch(.8 .035 80)", "oklch(.74 .04 75)", "oklch(.9 .02 90)"][k % 4]); ctx.roughness(0.8); ctx.metalness(0); };
// one skull, chin at origin, facing local −Z, about 0.22 m tall at s=1
export function skull(ctx, T, s = 1, lod = 1) {
  const seg = lod > 2 ? 5 : 7;
  boneMat(ctx, Math.floor(ctx.random() * 4)); ctx.smooth();
  lathe(ctx, (p) => T([p[0] * s, p[1] * s, p[2] * s * 1.15 + 0.01 * s]), [[0, 0.05], [0.07, 0.06], [0.095, 0.11], [0.1, 0.16], [0.085, 0.2], [0.05, 0.225], [0, 0.23]], seg, { a0: 0.3 });
  if (lod > 2) return;
  // jaw and cheek block
  bevelBox(ctx, (p) => T([p[0] * s, (p[1] + 0.045) * s, (p[2] - 0.06) * s]), 0.055, 0.035, 0.04, 0.012);
  // sockets and nose: dark sunk discs on the face
  ctx.albedo(null); ctx.color("oklch(.12 .01 40)"); ctx.roughness(1); ctx.flat();
  for (const [x, y, r] of [[-0.038, 0.135, 0.026], [0.038, 0.135, 0.026], [0, 0.098, 0.012]]) {
    const c = [x * s, y * s, -0.112 * s], n = 6, pts = [];
    for (let i = 0; i < n; i++) { const a = (i / n) * 6.283; pts.push([c[0] + Math.cos(a) * r * s, c[1] + Math.sin(a) * r * s * 1.1, c[2]]); }
    for (let i = 0; i < n; i++) ctx.tri(...T(c), ...T(pts[i]), ...T(pts[(i + 1) % n]));
  }
}
function femur(ctx, T, L, r = 0.022) {
  boneMat(ctx, Math.floor(ctx.random() * 4)); ctx.smooth();
  tube(ctx, T, [[0, 0, 0], [0, L * 0.08, 0], [0, L * 0.5, 0], [0, L * 0.92, 0], [0, L, 0]], [r * 1.9, r * 1.2, r, r * 1.2, r * 1.9], 5);
}
function wall(ctx) {
  const P = ctx.params, R = P.r ?? 14.6, a0 = P.a0 ?? 0, a1 = P.a1 ?? 1, H = P.h ?? 4.2, L = ctx.lod ?? 1;
  const span = (a1 - a0) * R, cols = Math.max(2, Math.round(span / 1.1));
  const at = (a, r, y) => [Math.cos(a) * r, y, Math.sin(a) * r];
  // the masonry: a thick curved band, inner face carved later by niches
  ctx.albedo(TEX.stone); ctx.color("oklch(.62 .012 250)"); ctx.roughness(0.92); ctx.flat();
  const N = cols * 2;
  for (let i = 0; i < N; i++) {
    const A = a0 + ((a1 - a0) * i) / N, B = a0 + ((a1 - a0) * (i + 1)) / N;
    const q = (a, r, y) => at(a, r, y);
    // inner face (faces centre): wind so normal points to origin
    fq(ctx, q(A, R, -0.3), q(A, R, H), q(B, R, H), q(B, R, -0.3), q((A + B) / 2, R + 6, H / 2));
    fq(ctx, q(A, R, H), q(A, R + 1.6, H + 0.6), q(B, R + 1.6, H + 0.6), q(B, R, H), q((A + B) / 2, R + 0.8, -4));
  }
  // rows of niches: an arched recess, a dark back, a skull looking out
  const rows = L > 2 ? 2 : 3;
  for (let c = 0; c < cols; c++) {
    const a = a0 + ((a1 - a0) * (c + 0.5)) / cols, yaw = 90 - (a * 180) / Math.PI; // face −Z toward centre
    for (let r = 0; r < rows; r++) {
      const y = 0.75 + r * 1.08, p = at(a, R - 0.02, y);
      const T = xf(p, yaw + 180, 0, 0);
      // recess back
      ctx.albedo(null); ctx.color("oklch(.1 .01 260)"); ctx.roughness(1); ctx.flat();
      const w = 0.42, h = 0.62;
      ctx.quad(...T([-w / 2, 0, -0.02]), ...T([w / 2, 0, -0.02]), ...T([w / 2, h, -0.02]), ...T([-w / 2, h, -0.02]));
      // arched frame of dressed stone
      ctx.albedo(TEX.stone); ctx.color("oklch(.7 .015 250)"); ctx.roughness(0.9);
      if (L <= 2) for (let k = 0; k <= 6; k++) { const t = Math.PI * (k / 6); bevelBox(ctx, (q) => T([q[0] + Math.cos(t) * w * 0.55, q[1] + h * 0.72 + Math.sin(t) * 0.18, q[2] - 0.06]), 0.045, 0.045, 0.06, 0.01); }
      bevelBox(ctx, (q) => T([q[0], q[1] - 0.04, q[2] - 0.1]), w * 0.62, 0.04, 0.12, 0.012);
      if (ctx.random() < 0.88) skull(ctx, (q) => T([q[0] + (ctx.random() - 0.5) * 0.06, q[1] + 0.01, q[2] - 0.12]), 1.2 + ctx.random() * 0.25, L);
      if (L <= 1 && ctx.random() < 0.5) { ctx.albedo(TEX.wax); ctx.color(WAXC[1]); ctx.roughness(0.5); ctx.smooth(); drip(ctx, ...T([0.12, -0.02, -0.14]), 0.12 + ctx.random() * 0.25, 0.02, 5); }
    }
    // femurs stacked between columns of niches
    if (L <= 2) { const ab = a0 + ((a1 - a0) * c) / cols; for (let k = 0; k < 7; k++) femur(ctx, xf(at(ab, R - 0.06, 0.55 + k * 0.48), 90 - (ab * 180) / Math.PI, 0, 90), 0.42, 0.02); }
  }
  // wax-drowned base and a drift of bone along it
  if (L <= 2) {
    ctx.albedo(TEX.wax); ctx.color(WAXC[3]); ctx.roughness(0.5); ctx.smooth();
    for (let c = 0; c < cols; c += 2) { const a = a0 + ((a1 - a0) * (c + ctx.random())) / cols, p = at(a, R - 0.5, 0); puddle(ctx, p[0], 0.01, p[2], 0.6, 0.4, 0.04); }
    for (let i = 0; i < cols * 1.5; i++) { const a = a0 + (a1 - a0) * ctx.random(), p = at(a, R - 0.3 - ctx.random() * 0.6, 0); skull(ctx, xf(p, ctx.random() * 360, (ctx.random() - 0.5) * 60, (ctx.random() - 0.5) * 40), 1 + ctx.random() * 0.2, L + 1); }
  }
}
function column(ctx) {
  const H = ctx.params.h ?? 4.4, L = ctx.lod ?? 1;
  ctx.albedo(TEX.stone); ctx.color("oklch(.6 .012 250)"); ctx.roughness(0.9); ctx.flat();
  bevelBox(ctx, xf([0, 0.2, 0]), 0.65, 0.2, 0.65, 0.05);
  bevelBox(ctx, xf([0, H / 2, 0]), 0.42, H / 2, 0.42, 0.04);
  bevelBox(ctx, xf([0, H - 0.1, 0]), 0.6, 0.12, 0.6, 0.05);
  if (L > 2) return;
  // femurs as fluting
  for (let i = 0; i < 16; i++) { const a = (i / 16) * 6.283, x = Math.cos(a) * 0.47, z = Math.sin(a) * 0.47; femur(ctx, xf([x, 0.42, z]), H - 0.6, 0.024); }
  // skull bands
  for (let y = 1.1; y < H - 0.6; y += 1.1) for (let i = 0; i < 8; i++) { const a = (i / 8) * 6.283 + y; skull(ctx, xf([Math.cos(a) * 0.5, y, Math.sin(a) * 0.5], 90 - (a * 180) / Math.PI + 180), 1.1, L); }
  candleBed(ctx, 0.5, 0.4, 0.5, 0.25, 0.25, 6, { lit: 0.4, hMax: 0.22, puddle: false });
  candleBed(ctx, -0.5, 0.4, -0.45, 0.22, 0.22, 5, { lit: 0.4, hMax: 0.2, puddle: false });
}
function pile(ctx) {
  const R = ctx.params.r ?? 1.2, n = ctx.params.n ?? 40, L = ctx.lod ?? 1;
  for (let i = 0; i < (L > 2 ? n / 4 : n); i++) {
    const a = ctx.random() * 6.283, d = Math.sqrt(ctx.random()) * R, h = (1 - d / R) * R * 0.55 * ctx.random();
    const p = [Math.cos(a) * d, h, Math.sin(a) * d];
    if (ctx.random() < 0.65) skull(ctx, xf(p, ctx.random() * 360, (ctx.random() - 0.5) * 90, (ctx.random() - 0.5) * 70), 1 + ctx.random() * 0.3, L);
    else femur(ctx, xf(p, ctx.random() * 360, 80 + ctx.random() * 20, ctx.random() * 40), 0.4, 0.02);
  }
  ctx.albedo(TEX.stone); ctx.color("oklch(.4 .01 50)"); ctx.roughness(1); ctx.flat();
  rock(ctx, xf([0, -0.1, 0]), R * 0.9, { sy: 0.25 });
}
function arch(ctx) {
  const W = ctx.params.w ?? 5.2, H = ctx.params.h ?? 4.6, L = ctx.lod ?? 1;
  ctx.albedo(TEX.stone); ctx.color("oklch(.58 .012 250)"); ctx.roughness(0.9); ctx.flat();
  for (const sx of [-1, 1]) {
    bevelBox(ctx, xf([sx * (W / 2 + 0.35), H / 2, 0]), 0.4, H / 2, 0.45, 0.05);
    if (L <= 2) for (let k = 0; k < 9; k++) femur(ctx, xf([sx * (W / 2 - 0.02), 0.2 + k * 0.48, -0.42], 0, 0, 90), 0.42, 0.024);
    if (L <= 2) for (let y = 0.6; y < H; y += 0.7) skull(ctx, xf([sx * (W / 2 + 0.35), y, -0.47], 180 + 180), 1.4, L);
  }
  bevelBox(ctx, xf([0, H + 0.3, 0]), W / 2 + 0.8, 0.32, 0.5, 0.05);
  // lintel of skulls looking down the stair
  const n = Math.round(W / 0.3);
  for (let i = 0; i < n; i++) skull(ctx, xf([-W / 2 + (i + 0.5) * (W / n), H + 0.02, -0.52], 0, 0), 1.25, L);
  skull(ctx, xf([0, H + 0.62, -0.52]), 2.6, L); // the keystone: a saint's skull, gilt flaking
  if (L <= 1) { ctx.albedo(TEX.wax); ctx.color(WAXC[2]); ctx.roughness(0.5); ctx.smooth(); for (let i = 0; i < 9; i++) drip(ctx, -W / 2 + ctx.random() * W, H - 0.05, -0.5, 0.2 + ctx.random() * 0.7, 0.025, 5); }
}
function dais(ctx) {
  const L = ctx.lod ?? 1;
  ctx.albedo(TEX.stone); ctx.color("oklch(.56 .012 250)"); ctx.roughness(0.88); ctx.flat();
  bevelBox(ctx, xf([0, 0.15, 0]), 4.2, 0.15, 3.4, 0.06);
  bevelBox(ctx, xf([0, 0.45, 0]), 3.4, 0.15, 2.7, 0.06);
  bevelBox(ctx, xf([0, 0.75, 0]), 2.6, 0.15, 2.0, 0.06);
  // the reliquary bed: a lead-lined open coffin, lid shoved aside and cracked
  ctx.albedo(TEX.iron); ctx.color("oklch(.5 .01 250)"); ctx.metalness(0.6); ctx.roughness(0.55);
  bevelBox(ctx, xf([-0.6, 1.1, 0]), 1.2, 0.22, 0.5, 0.04);
  ctx.albedo(null); ctx.color("oklch(.08 .01 260)"); ctx.metalness(0); ctx.roughness(1);
  bevelBox(ctx, xf([-0.6, 1.3, 0]), 1.1, 0.03, 0.42, 0.01);
  ctx.albedo(TEX.stone); ctx.color("oklch(.66 .012 250)"); ctx.roughness(0.9);
  bevelBox(ctx, xf([-0.3, 1.0, 0.95], 18, 0, -9), 1.15, 0.07, 0.48, 0.03);
  // a cold-burning crown of candles round the bed
  candleBed(ctx, -0.6, 0.9, 0, 2.0, 1.3, L > 2 ? 10 : 70, { lit: 0.25, hMax: 0.34 });
  // crozier rack: two bone posts and a crossbar of femurs
  for (const sx of [-1, 1]) femur(ctx, xf([1.8, 0.9, sx * 0.7]), 1.8, 0.035);
  femur(ctx, xf([1.8, 2.5, -0.75], 0, 90, 0), 1.5, 0.03);
  for (let i = 0; i < 6; i++) skull(ctx, xf([1.8, 2.56, -0.6 + i * 0.24], 90), 1.1, L);
  if (L > 2) return;
  for (let i = 0; i < 26; i++) { const a = ctx.random() * 6.283, d = 3 + ctx.random() * 1.6; skull(ctx, xf([Math.cos(a) * d, 0.3 * (ctx.random() < 0.4), Math.sin(a) * d * 0.8], ctx.random() * 360, (ctx.random() - 0.5) * 50, 0), 1.1, L); }
}
const KINDS = { wall, column, pile, arch, dais };
export function geometry(ctx) { (KINDS[ctx.params.kind] ?? wall)(ctx); }
