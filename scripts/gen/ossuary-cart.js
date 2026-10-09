// The ossuary cart: a two-wheeled oak bone-cart abandoned on the way into the Abbey, its bed heaped with
// skulls glazed in old wax, a pole lantern of guttering candles, iron tyres, a shroud slipping off the back.
import { TEX, WAXC, xf, bevelBox, boxC, lathe, tube, chain, drip, candleBed } from "./shapes.js";
export function geometry(ctx) {
  const L = ctx.lod, R = () => ctx.random(), hi = L <= 2;
  const tip = ctx.params.tip ?? 9;                         // tipped forward onto its shafts
  const B = xf([0, 0.62, 0], 0, -tip, 0);
  ctx.flat(); ctx.albedo(TEX.wood); ctx.metalness(0); ctx.roughness(0.95); ctx.color("oklch(.55 .05 55)");
  bevelBox(ctx, (p) => B([p[0], p[1] + 0.06, p[2]]), 0.62, 0.05, 0.95, 0.015);            // floor
  for (const s of [-1, 1]) {                                                               // slatted sides
    for (let k = 0; k < 3; k++) bevelBox(ctx, (p) => B([p[0] + s * 0.6, p[1] + 0.2 + k * 0.17, p[2] + (R() - 0.5) * 0.04]), 0.025, 0.06, 0.95, 0.01);
    for (const z of [-0.9, 0, 0.9]) bevelBox(ctx, (p) => B([p[0] + s * 0.62, p[1] + 0.3, p[2] + z]), 0.04, 0.32, 0.04, 0.01);
    tube(ctx, [B([s * 0.4, 0.02, -0.9]), B([s * 0.32, -0.1, -2.3])], 0.045);              // shafts to the ground
  }
  bevelBox(ctx, (p) => B([p[0], p[1] + 0.25, p[2] + 0.95]), 0.6, 0.2, 0.025, 0.01);        // tailboard
  // wheels with iron tyres
  for (const s of [-1, 1]) {
    const W = xf([s * 0.75, 0.62, 0.1], 90, 0, 90), seg = hi ? 18 : 10, rim = [];
    for (let k = 0; k <= seg; k++) { const a = (k / seg) * 6.283; rim.push(W([Math.cos(a) * 0.58, 0, Math.sin(a) * 0.58])); }
    ctx.albedo(TEX.wood); ctx.color("oklch(.5 .05 55)"); tube(ctx, rim, 0.055);
    for (let q = 0; q < 8; q++) { const a = (q / 8) * 6.283; tube(ctx, [W([0, 0, 0]), W([Math.cos(a) * 0.55, 0, Math.sin(a) * 0.55])], 0.022); }
    lathe(ctx, W, [[0, -0.1], [0.1, -0.1], [0.12, 0], [0.1, 0.1], [0, 0.1]], 8, {});
    ctx.albedo(TEX.iron); ctx.metalness(0.6); ctx.roughness(0.7); ctx.color("oklch(.6 .04 45)");
    const tyre = rim.map((p, i) => W([Math.cos((i / seg) * 6.283) * 0.615, 0, Math.sin((i / seg) * 6.283) * 0.615]));
    tube(ctx, tyre, 0.025); ctx.metalness(0); ctx.roughness(0.95);
  }
  // the heap: wax-glazed skulls and long bones
  ctx.smooth(); ctx.albedo(TEX.wax); ctx.roughness(0.6);
  const skull = (x, y, z, s, yaw, pitch) => {
    const T = (p) => B(xf([x, y, z], yaw, pitch, 0, s)(p));
    lathe(ctx, T, [[0, -0.02], [0.07, 0], [0.1, 0.06], [0.095, 0.13], [0.06, 0.17], [0, 0.18]], hi ? 9 : 6, {});
    ctx.color("oklch(.18 .01 60)");                                                         // sockets
    for (const sx of [-0.035, 0.035]) lathe(ctx, (p) => T([p[0] + sx, p[1] + 0.07, p[2] - 0.085]), [[0, 0], [0.022, 0.005], [0, 0.03]], 5, {});
  };
  const n = hi ? 22 : 10;
  for (let i = 0; i < n; i++) {
    const x = (R() - 0.5) * 0.95, z = (R() - 0.5) * 1.6, mound = 0.38 * (1 - Math.abs(z) / 1.1) * (1 - Math.abs(x) / 0.8);
    ctx.color(i % 3 ? "oklch(.74 .04 82)" : WAXC[i % 5]);
    skull(x, 0.12 + Math.max(0, mound) * R() + R() * 0.1, z, 0.85 + R() * 0.35, R() * 360, (R() - 0.5) * 50);
  }
  ctx.color("oklch(.7 .035 80)");
  for (let i = 0; i < (hi ? 14 : 6); i++) { const x = (R() - 0.5) * 0.9, z = (R() - 0.5) * 1.5, a = R() * 6.283, l = 0.25 + R() * 0.2;
    tube(ctx, [B([x - Math.cos(a) * l, 0.2 + R() * 0.25, z - Math.sin(a) * l]), B([x + Math.cos(a) * l, 0.2 + R() * 0.25, z + Math.sin(a) * l])], 0.028); }
  // wax sealing the heap, running off the tailboard
  ctx.color(WAXC[1]); ctx.roughness(0.45);
  for (let i = 0; i < (hi ? 8 : 3); i++) { const p = B([(R() - 0.5) * 1.1, 0.07, 0.97]); drip(ctx, p[0], p[1], p[2], 0.2 + R() * 0.45, 0.03, 5); }
  // a shroud hanging off the back
  ctx.flat(); ctx.albedo("/cdn/value.0f80207355b65cb183f0e6d713de9b2f9cd4cf97bd2d79e8de546be38ab58a84.png"); ctx.color("oklch(.38 .05 25)"); ctx.roughness(1);
  const sh = (u, v) => B([-0.45 + u * 0.9, 0.46 - v * 0.75 - Math.sin(u * 3.14) * 0.06, 0.99 + v * 0.12 + Math.sin(u * 9 + v * 4) * 0.025]);
  const T3 = (a, b, c) => ctx.tri(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
  const SU = hi ? 8 : 4, SV = hi ? 5 : 3;
  for (let u = 0; u < SU; u++) for (let v = 0; v < SV; v++) {
    const a = sh(u / SU, v / SV), b = sh((u + 1) / SU, v / SV), c = sh((u + 1) / SU, (v + 1) / SV), d = sh(u / SU, (v + 1) / SV);
    T3(a, b, c); T3(a, c, d); T3(a, c, b); T3(a, d, c);
  }
  // pole lantern at the front corner, candles inside an iron cage
  ctx.albedo(TEX.wood); ctx.color("oklch(.45 .04 55)"); ctx.roughness(0.95);
  const top = B([0.58, 1.75, -0.9]); tube(ctx, [B([0.58, 0.1, -0.9]), top, [top[0] + 0.35, top[1] + 0.05, top[2]]], 0.035);
  ctx.albedo(TEX.iron); ctx.metalness(0.6); ctx.color("oklch(.55 .03 45)");
  const lp = [top[0] + 0.35, top[1] - 0.15, top[2]];
  chain(ctx, [[lp[0], top[1] + 0.05, lp[2]], [lp[0], lp[1] + 0.12, lp[2]]], L, 0.6);
  for (let q = 0; q < 4; q++) { const a = q * 1.571 + 0.78; tube(ctx, [[lp[0] + Math.cos(a) * 0.1, lp[1] + 0.12, lp[2] + Math.sin(a) * 0.1], [lp[0] + Math.cos(a) * 0.12, lp[1] - 0.18, lp[2] + Math.sin(a) * 0.12]], 0.012); }
  ctx.metalness(0);
  candleBed(ctx, lp[0], lp[1] - 0.17, lp[2], 0.05, 0.05, 2, { lit: 1, hMax: 0.12, puddle: false });
  if (hi) candleBed(ctx, ...B([-0.2, 0.55, -0.4]), 0.25, 0.3, 3, { lit: 1, hMax: 0.12, puddle: false });
}
export function collider(ctx) { boxC(ctx, -0.85, 0.85, 0, 1.1, -1.1, 1.1); }
