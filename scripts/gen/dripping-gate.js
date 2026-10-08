// THE DRIPPING GATE: a ruined stone archway across Broken Lantern Road, sheathed in centuries of wax.
// Origin mid-road at floor level; the road runs along Z, the player arrives from +Z. Opening |x| < 4, 7.1 m tall.
// Piers |x| 4..7.2 (3.2 m), ruined wing walls run on to |x| 20 into the cliff banks. Cracked bronze bell under the lintel.
import { TEX, WAXC, xf, bevelBox, boxC, lathe, rough, stalactite, candleBed, curtain, waxCap, mossSkin, puddle, chain, quad } from "./shapes.js";

export function geometry(ctx) {
  const L = ctx.lod, R = () => ctx.random();
  const J = L <= 2 ? rough(ctx, 0.035, 1.1) : null;
  const bev = L <= 2 ? 0.06 : 0;
  const stone = (dl = 0) => { ctx.flat(); ctx.albedo(TEX.stone); ctx.roughness(0.82); ctx.metalness(0); ctx.color(`oklch(${(0.8 + dl + R() * 0.12).toFixed(3)} .012 250)`); };
  const blk = (cx, cy, cz, hx, hy, hz, yaw = 0, roll = 0, pitch = 0, dl = 0) => { stone(dl); bevelBox(ctx, xf([cx, cy, cz], yaw, pitch, roll), hx - 0.014, hy - 0.014, hz - 0.014, bev, J); };
  const jit = (a) => (R() - 0.5) * a;
  const wingTops = [];

  for (const s of [-1, 1]) {
    // plinth, pier courses, impost
    blk(s * 5.6, 0.15, 0, 1.95, 0.55, 2.4);
    if (L <= 3) {
      const ch = [0.95, 0.85, 1.0, 0.9, 0.85, 0.95, 0.5];
      let y = 0.7;
      ch.forEach((h, i) => {
        if (i % 2 === 0) {
          const xm = 5.3 + R() * 0.8;
          blk(s * (4 + xm) / 2 + jit(0.05), y + h / 2, jit(0.06), (xm - 4) / 2, h / 2, 1.7, jit(1.4));
          blk(s * (xm + 7.2) / 2 + jit(0.05), y + h / 2, jit(0.06), (7.2 - xm) / 2, h / 2, 1.7, jit(1.4));
        } else {
          const zm = jit(1.2);
          blk(s * 5.6 + jit(0.06), y + h / 2, (-1.7 + zm) / 2, 1.6, h / 2, (zm + 1.7) / 2, jit(1.2));
          blk(s * 5.6 + jit(0.06), y + h / 2, (zm + 1.7) / 2, 1.6, h / 2, (1.7 - zm) / 2, jit(1.2));
        }
        y += h;
      });
    } else blk(s * 5.6, 3.7, 0, 1.6, 3.0, 1.7);
    blk(s * 5.6, 6.9, 0, 2.0, 0.2, 2.3, 0, 0, 0, 0.04);

    // wing walls into the cliff
    if (L <= 3) {
      for (let c = 0, y0 = -0.6; y0 < 8.6; c++, y0 += 0.9) {
        let x = 7.2;
        if (c % 2) { const l = 0.7; x += l; }
        let first = true;
        while (x < 20.5) {
          const len = first && c % 2 ? 0.7 : 1.3 + R() * 0.6; first = false;
          const xm = x + len / 2, H = 8.4 - (xm - 7.2) * 0.2 + ctx.noise2d(xm * 0.45, s * 3.1) * 1.1;
          const y1 = y0 + 0.9;
          if (y1 <= H) {
            blk(s * (c % 2 && x === 7.9 ? 7.55 : xm), y0 + 0.45, jit(0.1), (c % 2 && x === 7.9 ? 0.35 : len / 2), 0.45, 1.35, jit(2.5), jit(1.5));
            if (y1 + 0.9 > H) wingTops.push([s * xm, y1, len]);
          }
          x += c % 2 && x === 7.9 ? 0 : len;
          if (c % 2 && x === 7.9) x = 7.9 + 0.0001;
        }
      }
    } else {
      blk(s * 10, 3.5, 0, 2.8, 4.1, 1.35); blk(s * 15.5, 3.0, 0, 2.7, 3.6, 1.35); blk(s * 19.5, 2.5, 0, 1.3, 3.1, 1.35);
    }
  }

  // lintel: voussoirs, cracked keystone side, cornice broken at the right end, parapet stubs
  blk(-5.8, 8.05, 0, 1.4, 0.95, 1.6);
  blk(-2.55, 8.05, 0, 1.85, 0.95, 1.6, 0, 0.4);
  blk(0, 8.3, 0, 0.7, 1.4, 1.9, 0, 0, 0, 0.03);
  blk(1.55, 8.03, 0, 0.85, 0.95, 1.6, 0, -0.6);
  blk(3.4, 7.98, 0.03, 1.0, 0.95, 1.6, 0.8, -1.6);
  blk(5.8, 8.05, 0, 1.4, 0.95, 1.6);
  blk(-5.1, 9.22, 0, 2.5, 0.23, 2.0);
  blk(-0.1, 9.22, 0, 2.5, 0.23, 2.0);
  blk(3.45, 9.12, 0.05, 1.05, 0.23, 2.0, 2, 4);
  blk(6.7, 0.18, 3.6, 1.3, 0.24, 0.9, 28, 7);    // fallen cornice block
  blk(5.4, 0.12, 4.6, 0.45, 0.2, 0.35, 50, 12);  // rubble
  blk(7.8, 0.1, 4.4, 0.35, 0.18, 0.3, 10, -9);
  blk(-6.2, 9.82, 0.1, 0.9, 0.38, 0.9, 4);
  blk(-3.8, 9.68, 0.3, 0.55, 0.24, 0.6, -8);
  blk(1.7, 9.78, -0.2, 0.7, 0.33, 0.75, 10, 5);

  if (L <= 2) {
    // moss at the feet and on the wing tops
    for (const s of [-1, 1]) {
      mossSkin(ctx, [s * 3.65, 0, 2.4], [s, 0, 0], [0, 0, 1], 3.9, -0.1, 0.5);
      mossSkin(ctx, [s * 3.65, 0, -2.4], [s, 0, 0], [0, 0, -1], 3.9, -0.1, 0.45);
      mossSkin(ctx, [s * 7.2, 0, 1.35], [s, 0, 0], [0, 0, 1], 12, -0.2, 1.1);
    }
    for (const [x, y, len] of wingTops) if (R() < 0.4) { ctx.color("oklch(.78 .09 135)"); puddle(ctx, x, y, 0, len * 0.45, 1.0, 0.05); }
  }

  // wax: caps, curtains, stalactites
  if (L <= 3) {
    waxCap(ctx, -7.5, -2.65, -1.95, 1.95, 9.45, 0.09);
    waxCap(ctx, -2.55, 2.35, -1.95, 1.95, 9.45, 0.09);
    waxCap(ctx, -0.65, 0.65, -1.85, 1.85, 9.7, 0.08);
    curtain(ctx, [-7.6, 0, 2.0], [1, 0, 0], [0, 0, 1], 10.0, 9.45, { min: 0.3, max: 1.5, lod: L });
    curtain(ctx, [-0.7, 0, 1.9], [1, 0, 0], [0, 0, 1], 1.4, 9.7, { min: 1.2, max: 2.4, lod: L, drips: 2 });
    curtain(ctx, [2.4, 0, -2.0], [-1, 0, 0], [0, 0, -1], 10.0, 9.45, { min: 0.2, max: 1.0, lod: L });
    for (const s of [-1, 1]) {
      waxCap(ctx, s > 0 ? 3.6 : -7.6, s > 0 ? 7.6 : -3.6, 1.6, 2.3, 7.1, 0.06);
      waxCap(ctx, s > 0 ? 3.65 : -7.55, s > 0 ? 7.55 : -3.65, 1.7, 2.4, 0.7, 0.05);
      curtain(ctx, [s * 3.6, 0, 2.3], [s, 0, 0], [0, 0, 1], 4.0, 7.1, { min: 0.5, max: 2.2, lod: L });
      curtain(ctx, [s * 4.0, 0, 1.7], [s, 0, 0], [0, 0, 1], 3.2, 6.7, { min: 1.4, max: 5.4, lod: L, tail: 1.4 });
      curtain(ctx, [s * 4.0, 0, -1.7], [0, 0, 1], [-s, 0, 0], 3.4, 6.7, { min: 0.8, max: 3.6, lod: L });
      curtain(ctx, [s * 3.6, 0, -2.3], [0, 0, 1], [-s, 0, 0], 4.6, 7.1, { min: 0.3, max: 1.1, lod: L });
      curtain(ctx, [s * 4.0, 0, -1.7], [s, 0, 0], [0, 0, -1], 3.2, 6.7, { min: 0.6, max: 2.8, lod: L });
      curtain(ctx, [s * 3.65, 0, 2.4], [s, 0, 0], [0, 0, 1], 3.9, 0.7, { min: 0.1, max: 0.55, lod: L, tail: 0.2, lip: 0.3 });
      curtain(ctx, [s * 7.2, 0, 1.35], [s, 0, 0], [0, 0, 1], 3.5, 8.1, { min: 0.6, max: 3.2, lod: L });
    }
    // stalactites under the lintel (clear of the bell) and under the cornice overhangs
    const nst = L === 1 ? 46 : L === 2 ? 24 : 10;
    for (let k = 0; k < nst; k++) {
      const x = (R() * 2 - 1) * 3.75, z = (R() * 2 - 1) * 1.5;
      if (Math.abs(x) < 1.75 && Math.abs(z) < 1.75) continue;
      const len = 0.3 + Math.pow(R(), 1.4) * 1.7 + (Math.abs(x) > 3 ? 0.5 : 0) + (Math.abs(z) > 1.1 ? 0.3 : 0);
      ctx.color(WAXC[1 + Math.floor(R() * 4)]);
      stalactite(ctx, x, Math.abs(x) < 0.75 ? 6.92 : 7.1, z, len, 0.09 + len * 0.09, L === 1 ? 7 : 5);
    }
    for (let k = 0; k < (L === 1 ? 34 : 12); k++) {
      const x = -7.4 + R() * 11.8, z = (R() < 0.6 ? 1 : -1) * (1.68 + R() * 0.28);
      ctx.color(WAXC[1 + Math.floor(R() * 4)]);
      stalactite(ctx, x, 8.99, z, 0.2 + R() * 0.9, 0.06 + R() * 0.07, 5);
    }
  }

  // candle stubs on every ledge (fx clusters sit on the unlit beds)
  if (L <= 2) {
    const k = L === 1 ? 1 : 0.45, nb = (n) => Math.max(2, Math.round(n * k));
    candleBed(ctx, -5.1, 9.5, -0.2, 2.2, 1.6, nb(55));
    candleBed(ctx, -1.6, 9.5, 0, 0.75, 1.6, nb(22));
    candleBed(ctx, 1.5, 9.5, 0.1, 0.75, 1.6, nb(22));
    candleBed(ctx, 0, 9.75, 0, 0.5, 1.6, nb(14));
    candleBed(ctx, -5.0, 9.52, 0.9, 0.45, 0.45, nb(14), { lit: 0, hMax: 0.2 });
    candleBed(ctx, -6.2, 10.2, 0.1, 0.65, 0.65, nb(8));
    candleBed(ctx, 1.7, 10.12, -0.2, 0.5, 0.55, nb(7));
    for (const s of [-1, 1]) {
      candleBed(ctx, s * 5.6, 7.14, 1.95, 1.7, 0.26, nb(24), { lit: 0 });
      candleBed(ctx, s * 5.6, 7.14, -1.95, 1.7, 0.26, nb(12));
      candleBed(ctx, s * 5.6, 0.73, 2.05, 1.7, 0.27, nb(22), { lit: 0.2 });
      candleBed(ctx, s * 5.6, 0.73, -2.05, 1.7, 0.27, nb(10));
      candleBed(ctx, s * 3.82, 0.73, 0, 0.13, 2.1, nb(12));
      candleBed(ctx, s * 5.7, 0, 3.5, 1.35, 0.6, nb(32), { ground: true, lit: s > 0 ? 0.3 : 0, hMax: 0.32, rMax: 0.07 });
      puddle(ctx, s * 3.25, 0, 0, 0.5, 2.0, 0.04, true);
    }
    for (const [x, y, len] of wingTops) if (Math.abs(x) < 13 && R() < 0.7) candleBed(ctx, x, y, 0, len * 0.35, 0.9, nb(7));
  }

  bell(ctx, L);
}

function bell(ctx, L) {
  const seg = L === 1 ? 24 : L === 2 ? 16 : 10;
  const outer = [[1.18, 4.7], [1.21, 4.78], [1.12, 4.9], [0.99, 5.05], [0.89, 5.35], [0.81, 5.75], [0.76, 6.1], [0.71, 6.35], [0.61, 6.55], [0.4, 6.64], [0, 6.68]];
  const notch = (i, j) => i < 2 && (j === 4 || j === 5);
  ctx.smooth(); ctx.albedo(TEX.bronze); ctx.metalness(0.7); ctx.roughness(0.42); ctx.color("oklch(.86 .05 65)");
  lathe(ctx, xf(), outer, seg, { skip: notch, ref: [0, 5.6, 0] });
  if (L <= 3) {
    ctx.color("oklch(.6 .04 60)");
    const inner = [[1.06, 4.72], [0.93, 5.0], [0.8, 5.5], [0.69, 6.1], [0.5, 6.45], [0, 6.56]];
    lathe(ctx, xf(), inner, seg, { skip: notch, ref: [0, 5.6, 0], flip: true });
    lathe(ctx, xf(), [[1.18, 4.7], [1.06, 4.72]], seg, { skip: (i, j) => j === 4 || j === 5, ref: [0, 5.6, 0] });
    // verdigris bands
    ctx.color("oklch(.82 .07 170)");
    lathe(ctx, xf(), [[0.9, 5.3], [0.905, 5.36], [0.905, 5.42], [0.885, 5.48]], seg, { ref: [0, 5.4, 0] });
    lathe(ctx, xf(), [[0.765, 6.0], [0.77, 6.05], [0.765, 6.1]], seg, { ref: [0, 6.05, 0] });
    // the crack: a dark zig-zag running up from the notch
    ctx.flat(); ctx.albedo(null); ctx.metalness(0); ctx.roughness(1); ctx.color("oklch(.12 .02 60)");
    const rAt = (y) => { for (let i = 0; i < outer.length - 1; i++) if (y >= outer[i][1] && y <= outer[i + 1][1]) { const t = (y - outer[i][1]) / (outer[i + 1][1] - outer[i][1]); return outer[i][0] + (outer[i + 1][0] - outer[i][0]) * t; } return 0.7; };
    const a0 = (5 / seg) * 6.283;
    let prev = null;
    for (let k = 0; k <= 9; k++) {
      const y = 4.82 + k * 0.14, a = a0 + (k % 2 ? 0.06 : -0.05) + k * 0.012, r = rAt(y) + 0.012, w = 0.022 * (1 - k / 11);
      const p = [Math.cos(a) * r, y, Math.sin(a) * r], tx = [-Math.sin(a) * w, 0, Math.cos(a) * w];
      const pair = [[p[0] - tx[0], p[1], p[2] - tx[2]], [p[0] + tx[0], p[1], p[2] + tx[2]]];
      if (prev) quad(ctx, prev[0], prev[1], pair[1], pair[0], [0, y, 0]);
      prev = pair;
    }
    // wax over the crown
    ctx.smooth(); ctx.albedo(TEX.wax); ctx.roughness(0.5); ctx.color(WAXC[2]);
    lathe(ctx, xf(), [[0.74, 6.22], [0.75, 6.3], [0.67, 6.5], [0.45, 6.66], [0.2, 6.72], [0, 6.73]], seg, { rj: (i, j) => (i === 0 ? 1 + 0.06 * Math.sin(j * 2.7) : 1), ref: [0, 6.3, 0] });
  }
  // clapper, yoke, straps up to the lintel
  ctx.albedo(TEX.iron); ctx.metalness(0.5); ctx.roughness(0.7); ctx.color("oklch(.75 .02 50)"); ctx.flat();
  lathe(ctx, xf(), [[0, 4.42], [0.15, 4.5], [0.18, 4.62], [0.1, 4.78], [0.05, 4.95], [0.05, 6.5]], 8, { localRef: true });
  for (const s of [-1, 1]) bevelBox(ctx, xf([s * 0.28, 6.88, 0]), 0.06, 0.26, 0.14, 0);
  bevelBox(ctx, xf([0, 6.7, 0]), 0.42, 0.07, 0.17, 0);
  if (L <= 2) chain(ctx, [[0.9, 7.08, 0.5], [0.95, 6.6, 0.6], [0.92, 6.1, 0.55]], L);
}

export function collider(ctx) {
  for (const s of [-1, 1]) {
    boxC(ctx, s > 0 ? 3.65 : -7.6, s > 0 ? 7.6 : -3.65, 0, 9.5, -2.4, 2.4);
    boxC(ctx, s > 0 ? 7.6 : -20.6, s > 0 ? 20.6 : -7.6, -1, 7.5, -1.5, 1.5);
  }
  boxC(ctx, -3.65, 3.65, 7.1, 9.7, -2.0, 2.0);
}
