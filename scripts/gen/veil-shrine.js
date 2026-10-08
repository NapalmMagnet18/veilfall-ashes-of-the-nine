// THE LANTERN SHRINE OF THE NINE: the Veil's hero piece. A three-step plinth, two ashlar piers and an
// eleven-stone arch with a cracked iron nine-spoke emblem on the keystone; nine iron hooks on the arch's
// face (−Z is away from the eye: the face is +Z), eight lanterns dark or broken, ONE lit (hook 4, the
// crown), one fallen and cracked on the flags; an altar under the arch; candle beds melted onto the stones.
// Origin = the foot of the plinth's centre line, world (0, 0, -12). The scene's fx rows read the tables below.
import { TEX, WAXC, xf, chainXf, quad, face, bevelBox, rough, candle, candleBed, puddle, curtain, mossSkin, tube, chain } from "./shapes.js";
import { tuft } from "./veil-land.js";
export const AZ = -2, Y0 = 0.54, SPRING = 3.65, RI = 1.75, RO = 2.6, PX = 2.25, SH = 0.18, SZ = AZ + 0.2;
export const STEPS = [[7.6, 5.0], [6.8, 4.2], [6.0, 3.4]];
export const STATES = ["dark", "broken", "dark", "broken", "lit", "dark", "fallen", "broken", "dark"];
export const CHAIN = [0.32, 0.5, 0.22, 0.6, 0.25, 0.42, 0.3, 0.55, 0.28];
export function hook(i) {
  const t = ((10 + 20 * i) * Math.PI) / 180, rb = (RI + RO) / 2 + 0.05;
  const x = Math.cos(t) * rb, y = SPRING + Math.sin(t) * rb, z = AZ + 0.5;
  return { base: [x, y, z], hang: [x, y - 0.07, z + 0.5] };
}
// lit candle tips are [dx, dz, r, h] from `at`; the scene's candles.fx tips are [dx, h + 0.04, dz]
export const CLUSTERS = [
  { id: "a", at: [-2.3, Y0, AZ + 1.05], rx: 0.5, rz: 0.3, n: 9, lit: [[0, 0, 0.034, 0.24], [0.2, 0.06, 0.03, 0.16], [-0.17, 0.12, 0.028, 0.12]] },
  { id: "b", at: [2.35, Y0, AZ + 1.1], rx: 0.45, rz: 0.3, n: 8, lit: [[0, 0, 0.036, 0.28], [-0.21, 0.05, 0.03, 0.15], [0.14, 0.16, 0.026, 0.1]] },
  { id: "e", at: [0, 1.09, AZ + 0.02], rx: 0.5, rz: 0.2, n: 9, lit: [[-0.26, 0, 0.03, 0.2], [0.05, 0.08, 0.035, 0.27], [0.3, -0.05, 0.028, 0.14], [-0.04, -0.12, 0.025, 0.1]] },
  { id: "c", at: [1.7, 0, 4.0], rx: 0.6, rz: 0.42, n: 12, lit: [[0, 0, 0.04, 0.3], [0.26, 0.1, 0.03, 0.18], [-0.23, 0.12, 0.032, 0.22], [0.1, -0.22, 0.028, 0.12]] },
  { id: "d", at: [-3.2, SH, 0.5], rx: 0.35, rz: 0.14, n: 6, lit: [] },
];
const stone = (ctx, k = 0.8) => { ctx.flat(); ctx.albedo(TEX.stone); ctx.roughness(0.82); ctx.metalness(0); ctx.emissive(null); ctx.color(`oklch(${(k + ctx.random() * 0.12).toFixed(3)} .012 250)`); };
const iron = (ctx) => { ctx.flat(); ctx.albedo(TEX.iron); ctx.color("oklch(0.78 0.02 50)"); ctx.metalness(0.6); ctx.roughness(0.6); ctx.emissive(null); };
// a hanging iron lantern, origin at the top of its ring, body 0.36 wide, 0.66 tall
function lantern(ctx, T, st, fine) {
  iron(ctx);
  const ring = []; for (let k = 0; k <= 8; k++) { const a = (k / 8) * Math.PI * 2; ring.push(T([Math.cos(a) * 0.045, -0.05 + Math.sin(a) * 0.045, 0])); }
  if (fine) tube(ctx, ring, 0.009);
  const apex = T([0, -0.09, 0]), hb = [[0.2, -0.2, 0.2], [0.2, -0.2, -0.2], [-0.2, -0.2, -0.2], [-0.2, -0.2, 0.2]].map(T), hc = T([0, -0.16, 0]);
  for (let k = 0; k < 4; k++) face(ctx, apex, hb[k], hb[(k + 1) % 4], hc);
  bevelBox(ctx, chainXf(T, xf([0, -0.215, 0])), 0.21, 0.015, 0.21, 0.006);
  bevelBox(ctx, chainXf(T, xf([0, -0.245, 0])), 0.18, 0.012, 0.18, 0.004);
  [[1, 1], [1, -1], [-1, -1], [-1, 1]].forEach(([sx, sz], k) => {
    const bent = st !== "dark" && st !== "lit" && k === 0;
    bevelBox(ctx, chainXf(T, xf([sx * 0.17 + (bent ? 0.04 : 0), -0.43, sz * 0.17], 0, 0, bent ? 9 : 0)), 0.017, 0.2, 0.017, 0.004);
  });
  bevelBox(ctx, chainXf(T, xf([0, -0.635, 0])), 0.2, 0.02, 0.2, 0.006);
  bevelBox(ctx, chainXf(T, xf([0, -0.675, 0])), 0.05, 0.025, 0.05, 0.01);
  // panes
  const g = 0.16, y0 = -0.61, y1 = -0.26, c = T([0, -0.43, 0]);
  const panes = [[[g, y0, -g], [g, y0, g], [g, y1, g], [g, y1, -g]], [[-g, y0, g], [-g, y0, -g], [-g, y1, -g], [-g, y1, g]], [[g, y0, g], [-g, y0, g], [-g, y1, g], [g, y1, g]], [[-g, y0, -g], [g, y0, -g], [g, y1, -g], [-g, y1, -g]]];
  ctx.albedo(null); ctx.metalness(0); ctx.roughness(0.12);
  if (st === "lit") {
    ctx.color("oklch(0.93 0.05 205)", 0.82); ctx.emissive(0.9, 2.4, 2.7);
    for (const p of panes) quad(ctx, ...p.map(T), c);
    ctx.color("oklch(0.97 0.03 200)"); ctx.emissive(4.5, 8.5, 9);
    bevelBox(ctx, chainXf(T, xf([0, -0.5, 0])), 0.022, 0.06, 0.022, 0.01);
    ctx.emissive(null);
  } else {
    const keep = st === "dark" ? [0, 1, 2, 3] : st === "broken" ? [1] : [0, 3];
    ctx.color("oklch(0.42 0.02 230)", 0.5);
    for (const k of keep) quad(ctx, ...panes[k].map(T), c);
    if (st !== "dark") face(ctx, T([g, y0, g]), T([-g, y0, g]), T([-0.02, -0.47, g]), c); // a shard still in the frame
    ctx.color(WAXC[3]); ctx.roughness(0.6);
    bevelBox(ctx, chainXf(T, xf([0, -0.58, 0])), 0.035, 0.035, 0.035, 0.01);
  }
}
function voussoirs(ctx, J) {
  const N = 11;
  for (let i = 0; i < N; i++) {
    const gp = 0.007, a0 = (i / N) * Math.PI + gp, a1 = ((i + 1) / N) * Math.PI - gp, key = i === 5;
    const ro = key ? RO + 0.2 : RO + (ctx.random() - 0.5) * 0.08, zf = AZ + 0.5 + (key ? 0.08 : (ctx.random() - 0.5) * 0.05), zb = AZ - 0.5 - (key ? 0.08 : 0);
    const dy = i === 8 ? -0.1 : 0;
    const P = (a, r, z) => J([Math.cos(a) * r, SPRING + Math.sin(a) * r + dy, z]);
    const p = [P(a0, RI, zf), P(a1, RI, zf), P(a1, ro, zf), P(a0, ro, zf), P(a0, RI, zb), P(a1, RI, zb), P(a1, ro, zb), P(a0, ro, zb)];
    const am = (a0 + a1) / 2, rm = (RI + ro) / 2, ref = [Math.cos(am) * rm, SPRING + Math.sin(am) * rm + dy, AZ];
    stone(ctx, key ? 0.86 : 0.78);
    for (const f of [[0, 1, 2, 3], [5, 4, 7, 6], [0, 4, 5, 1], [3, 2, 6, 7], [1, 5, 6, 2], [4, 0, 3, 7]]) quad(ctx, p[f[0]], p[f[1]], p[f[2]], p[f[3]], ref);
  }
}
export function geometry(ctx) {
  const fine = ctx.lod <= 2, R = () => ctx.random(), J = fine ? rough(ctx, 0.025, 1.6) : (p) => p;
  // plinth: three courses of blocks, the top one laid in three rows
  STEPS.forEach(([w, d], k) => {
    const n = Math.round(w / 1.25), bw = w / n, rows = k === 2 ? 3 : 1, bd = d / rows, y0 = k * SH;
    for (let r = 0; r < rows; r++) for (let i = 0; i < n; i++) {
      const sunk = k === 0 && i === n - 1 ? -0.05 : 0;
      stone(ctx, 0.74);
      bevelBox(ctx, xf([-w / 2 + bw * (i + 0.5), y0 + SH / 2 + (R() - 0.5) * 0.02 + sunk, SZ - d / 2 + bd * (r + 0.5)], (R() - 0.5) * 1.2, 0, sunk ? 3 : 0), bw / 2 - 0.014, SH / 2, bd / 2 - 0.014, fine ? 0.03 : 0, J);
    }
  });
  // piers: a footing, six courses (one knocked open at the right pier's outer front corner), an impost
  for (const s of [-1, 1]) {
    stone(ctx, 0.74); bevelBox(ctx, xf([s * PX, Y0 + 0.13, AZ]), 0.62, 0.13, 0.62, fine ? 0.04 : 0, J);
    const n = 6, ch = (3.35 - Y0 - 0.26) / n;
    for (let c = 0; c < n; c++) {
      const y = Y0 + 0.26 + ch * c; stone(ctx);
      if (s > 0 && c === 4) bevelBox(ctx, xf([PX - 0.1, y + ch / 2, AZ - 0.12], 3), 0.4, ch / 2 - 0.012, 0.38, fine ? 0.04 : 0, J);
      else bevelBox(ctx, xf([s * PX + (R() - 0.5) * 0.03, y + ch / 2, AZ + (R() - 0.5) * 0.03], (R() - 0.5) * 1.5), 0.5, ch / 2 - 0.012, 0.5, fine ? 0.035 : 0, J);
    }
    stone(ctx, 0.84); bevelBox(ctx, xf([s * PX, 3.5, AZ]), 0.66, 0.15, 0.62, fine ? 0.04 : 0, J);
  }
  voussoirs(ctx, J);
  // altar under the arch, capped and curtained in wax
  stone(ctx, 0.8); bevelBox(ctx, xf([0, Y0 + 0.275, AZ]), 0.65, 0.275, 0.35, fine ? 0.04 : 0, J);
  stone(ctx, 0.86); bevelBox(ctx, xf([0, Y0 + 0.54, AZ]), 0.72, 0.03, 0.4, fine ? 0.015 : 0, J);
  // the cracked iron emblem of the Nine on the keystone
  iron(ctx);
  const ky = SPRING + RO + 0.2, ec = [0, ky + 0.55, AZ];
  tube(ctx, [[0, ky - 0.02, AZ], [0, ky + 0.15, AZ]], 0.035);
  const arc = []; for (let k = 0; k <= 16; k++) { const a = 0.6 + (k / 16) * (Math.PI * 2 - 0.9); arc.push([Math.cos(a) * 0.4, ec[1] + Math.sin(a) * 0.4, AZ]); }
  tube(ctx, arc, 0.022);
  for (let k = 0; k < 9; k++) { if (k === 2 || k === 7) continue; const a = Math.PI / 2 + (k / 9) * Math.PI * 2, e = k === 4 ? 0.44 : 0.54; tube(ctx, [[Math.cos(a) * 0.08, ec[1] + Math.sin(a) * 0.08, AZ], [Math.cos(a) * e, ec[1] + Math.sin(a) * e, AZ]], 0.016); }
  bevelBox(ctx, xf(ec), 0.08, 0.08, 0.04, 0.02);
  // nine hooks, their chains and lanterns
  for (let i = 0; i < 9; i++) {
    const { base: b, hang: h } = hook(i); iron(ctx);
    bevelBox(ctx, xf([b[0], b[1], b[2] + 0.015], 0, 0, 10 + 20 * i), 0.08, 0.08, 0.015, 0.005);
    tube(ctx, [[b[0], b[1], b[2]], [b[0], b[1] + 0.03, b[2] + 0.25], [b[0], b[1] + 0.01, b[2] + 0.45], [b[0], b[1] - 0.07, b[2] + 0.52], [b[0], b[1] - 0.12, b[2] + 0.46]], 0.018);
    const st = STATES[i];
    if (st === "fallen") { chain(ctx, [h, [h[0] + 0.02, h[1] - 0.2, h[2]]], ctx.lod, 1.1); continue; }
    const ly = h[1] - CHAIN[i];
    chain(ctx, [h, [h[0], ly + 0.02, h[2]]], fine ? ctx.lod : 3, 1.1);
    lantern(ctx, xf([h[0], ly, h[2]], (R() - 0.5) * 30, 0, st === "lit" ? 0 : (R() - 0.5) * 10), st, fine);
  }
  // the fallen lantern, on its side on the flags, its glass in shards around it
  lantern(ctx, xf([-1.25, 0.2, 1.9], 35, 0, 84), "fallen", fine);
  if (fine) {
    ctx.albedo(null); ctx.color("oklch(0.6 0.02 230)", 0.55); ctx.roughness(0.1);
    for (let k = 0; k < 14; k++) { const x = -1.0 + (R() - 0.5) * 1.4, z = 1.9 + (R() - 0.5) * 1.1, s = 0.03 + R() * 0.05, a = R() * 6.28; ctx.tri(x, 0.012, z, x + Math.cos(a) * s, 0.012, z + Math.sin(a) * s, x + Math.cos(a + 2) * s * 0.7, 0.014, z + Math.sin(a + 2) * s * 0.7); }
    ctx.albedo(TEX.wax); ctx.smooth(); ctx.color(WAXC[2]); ctx.roughness(0.55); puddle(ctx, -0.7, 0, 2.05, 0.2, 0.13, 0.02, false, 12);
    ctx.flat(); bevelBox(ctx, xf([-0.55, 0.035, 2.2], 70, 0, 90), 0.03, 0.09, 0.03, 0.01);
  }
  // candles melted onto the stones
  for (const C of CLUSTERS) {
    const [ax, ay, az] = C.at;
    if (fine) candleBed(ctx, ax, ay, az, C.rx, C.rz, C.n, { lit: 0, hMax: 0.22 });
    else { ctx.albedo(TEX.wax); ctx.color(WAXC[2]); puddle(ctx, ax, ay, az, C.rx, C.rz, 0.03); }
    ctx.albedo(TEX.wax); ctx.roughness(0.55); ctx.smooth();
    for (const [dx, dz, r, h] of C.lit) candle(ctx, ax + dx, ay, az + dz, r, h, true, fine ? 6 : 4);
  }
  if (fine) {
    curtain(ctx, [-2.8, Y0, SZ + 1.7], [1, 0, 0], [0, 0, 1], 0.95, Y0, { min: 0.06, max: 0.16, tail: 0.1, drips: 0.5 });
    curtain(ctx, [1.95, Y0, SZ + 1.7], [1, 0, 0], [0, 0, 1], 0.8, Y0, { min: 0.06, max: 0.16, tail: 0.1, drips: 0.5 });
    curtain(ctx, [-0.62, Y0 + 0.57, AZ + 0.4], [1, 0, 0], [0, 0, 1], 1.24, Y0 + 0.57, { min: 0.1, max: 0.42, tail: 0.3 });
  }
  // rubble: the stone that fell from the crown, and chips along the plinth
  stone(ctx, 0.76); bevelBox(ctx, xf([3.3, 0.24, 1.7], 32, 14, 6), 0.42, 0.24, 0.5, fine ? 0.04 : 0, J);
  for (let k = 0; k < (fine ? 10 : 3); k++) { const s = 0.08 + R() * 0.16, side = R() < 0.5 ? -1 : 1; stone(ctx, 0.7); bevelBox(ctx, xf([side * (2.6 + R() * 1.4), s * 0.7, 0.9 + R() * 1.2], R() * 90, R() * 20, R() * 20), s, s * 0.7, s * 0.9, fine ? 0.02 : 0, J); }
  if (!fine) return;
  // dead moss climbing the pier feet and the risers, tufts at the joints
  for (const s of [-1, 1]) mossSkin(ctx, [s * PX - 0.6, Y0, AZ + 0.63], [1, 0, 0], [0, 0, 1], 1.2, Y0, 0.45);
  mossSkin(ctx, [-3.8, 0, SZ + 2.5], [1, 0, 0], [0, 0, 1], 1.6, 0, 0.14);
  mossSkin(ctx, [2.4, 0, SZ + 2.5], [1, 0, 0], [0, 0, 1], 1.4, 0, 0.12);
  ctx.flat(); ctx.albedo(null); ctx.roughness(1);
  for (const [x, y, z] of [[-3.75, 0, 0.75], [3.7, 0, 0.8], [-3.3, SH, 0.35], [3.35, SH, 0.3], [-2.95, 2 * SH, -0.05], [2.9, 2 * SH, -0.1], [-1.7, Y0, AZ + 0.6], [1.65, Y0, AZ + 0.62], [0.9, 0, 0.8], [-0.4, 0, 0.78]]) tuft(ctx, x, y, z, 9, 0.32);
}
export function collider(ctx) {
  STEPS.forEach(([w, d], k) => bevelBox(ctx, xf([0, k * SH + SH / 2, SZ]), w / 2, SH / 2, d / 2, 0));
  for (const s of [-1, 1]) bevelBox(ctx, xf([s * PX, (Y0 + SPRING) / 2, AZ]), 0.62, (SPRING - Y0) / 2, 0.6, 0);
  bevelBox(ctx, xf([0, Y0 + 0.3, AZ]), 0.72, 0.3, 0.4, 0);
}
