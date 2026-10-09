// Awakening waterfall curtain: the falling water between a stream's lip and the pool it lands in. One file, both
// halves: geometry() is the water in flight, material() how it reads.
// Built the way shipped open-world falls are (Far Cry 5, Uncharted 4, RDR2): never one card, but nested layers,
// each falling on its own arc at its own speed, with detail that rides the water.
//   core   a front and a back skin pinched into a lens: the fall's body, glassy off the lip, torn white within a
//          second of flight, opening holes as it thins toward the pool (drawn back skin first, then front)
//   veil   an outer torn sheet that billows out in front of the core as it falls: the mist-white skin that gives
//          a fall its depth from the side
//   ropes  crossed ribbons that peel off the lip faster than the body and fly clear of it: the jets you see
//          separate from the sheet in every real fall
//   tongue the curtain OWNS the lip: it starts `back` metres upstream lying on the stream's surface (following
//          its draw-down: riseSlope, riseDraw, riseLen) and fades in there, so the stream ends under it and no
//          other surface is ever seen curling over the edge
// Detail: one baked tileable streak map (rgba = long streaks, foam packets, breakup holes, grain), addressed by
// flight time: a texel is a parcel of water that left the lip at (time − t), so the pattern accelerates with the
// water and stretches toward the pool on its own. Two taps a pixel, no procedural noise: cheap on low-end GPUs.
// Foam relief bumps the shading normal from the same map, lit by the scene's sun and sky.
//
// Placement: feetPosition = the lip's centre at the water level; params (metres, seconds, degrees):
//   dx, dz   downstream direction          width  the sheet's width at the lip
//   drop     metres to the pool             v0     speed the water leaves the lip, m/s
//   spread   metres the sheet widens each side over the fall     back   how far upstream the tongue starts
//   thick, thickFoot  the core's thickness at the lip and the pool   ropes  how strongly the lip's ropes bulge
//   veil (0 off, 1 default), jets (count of peeling ropes, default 9)
// material params: width, v0 (as geometry's), scroll, lipIn0/lipIn1 (v metres the tongue fades in over, negative =
// upstream of the lip), footFade (fall fraction the water melts into the boil), bump
// part: "curtain" (no boil) | "skirt" (the boil alone, solid froth that writes depth) | omitted = both, see-through
// uv: u across 0..1 (+10 per layer: 0 core back, 10 core front, 20 veil, 30 ropes), v metres along from the lip.
// colours: r aeration (ropes: their own fade-in), g speed ÷ 20, b fraction fallen.
import { vec2, vec3, float, positionWorld, cameraPosition, normalize, time, mix, smoothstep, clamp, max, min, abs, uv, vertexColor, normalWorld, dot, floor, sqrt, dFdx, dFdy, cross } from "builtin/tsl";
import { sunDirection, sunRadiance, ambientRadiance, sunVisibility } from "builtin/lighting";
import { MeshBasicNodeMaterial, DoubleSide } from "builtin/three";
import { fallMaterial } from "./lib/fall-material.js";
import { exp } from "builtin/tsl";

// 512² tileable, histogram-equalised: r long streaks, g foam packets, b breakup holes, a bubble grain
const STREAKS = "/cdn/value.3b79a4184329c179f51ce43f88299c169c2ad25bf82154d350bb0ac2ba333eca.png?data";
const G = 9.81;

export function geometry(ctx) {
  const p = ctx.params ?? {};
  const n = Math.hypot(Number(p.dx ?? 0), Number(p.dz ?? 1)) || 1;
  const dx = Number(p.dx ?? 0) / n, dz = Number(p.dz ?? 1) / n, nx = dz, nz = -dx; // across: right of downstream
  const W = Number(p.width ?? 5) / 2, H = Number(p.drop ?? 20), v0 = Number(p.v0 ?? 2.4), spread = Number(p.spread ?? 1.2);
  const back = Number(p.back ?? 0.4);
  const rS = Number(p.riseSlope ?? 0), rD = Number(p.riseDraw ?? 0), rL = Math.max(0.1, Number(p.riseLen ?? 3));
  const ss = (a, b, x) => { const k = Math.min(1, Math.max(0, (x - a) / (b - a))); return k * k * (3 - 2 * k); };
  const rise = (a) => (a >= 0 ? 0 : rS * -a + rD * (1 - ss(-rL, 0, a))) + 0.03; // the stream's own draw-down, a hair above it
  const lod = ctx.lod ?? 1;
  const rowsN = lod <= 1 ? 90 : lod === 2 ? 64 : lod === 3 ? 48 : 36;
  const cols = lod <= 1 ? 28 : lod === 2 ? 22 : lod === 3 ? 18 : 14;
  const T = Math.sqrt((2 * H) / G);
  const sq = (x) => x * x;
  const hash = (a) => { const h = Math.sin(a * 127.1 + 17.3) * 43758.5453; return h - Math.floor(h); };
  const thickAt = Number(p.thick ?? 0.35), thickFoot = Number(p.thickFoot ?? 2.2), ropeK = Number(p.ropes ?? 1);
  const ropeAt = (e) => 0.5 * Math.sin(e * 7.3 + 1.1) + 0.3 * Math.sin(e * 13.1 + 4.2) + 0.2 * Math.sin(e * 23.7 + 0.4);
  const tAt = (f) => T * (f * 0.55 + f * f * 0.45); // rows crowd the lip, where the shape turns fastest
  const halfAt = (t, fall) => 0.5 * (thickAt + (thickFoot - thickAt) * Math.pow(fall, 0.75)) * Math.min(1, t / 0.25 + 0.15);
  const widthAt = (fall, j) => W + spread * Math.pow(fall, 0.8) * (1 + 0.25 * hash(j));
  const P = (a, b, y) => ({ x: dx * a + nx * b, y, z: dz * a + nz * b });
  const uvs = [], colors = [];
  const quad = (a0, a1, b0, b1, L) => {
    if (p.part === "skirt" ? L !== 4 : p.part === "curtain" ? L === 4 : false) return; // part: one placement per draw: the boil apart from the fall
    const put = (q) => { uvs.push(q.u + L * 10, q.v); colors.push(q.c[0], q.c[1], q.c[2]); return [q.x, q.y, q.z]; };
    ctx.tri(...put(a0), ...put(b0), ...put(b1));
    ctx.tri(...put(a0), ...put(b1), ...put(a1));
  };
  const grid = (rows, L) => {
    const mid = Math.floor((rows[0].length - 1) / 2); let acc = rows[0][mid].v0 ?? 0;
    for (let i = 0; i < rows.length; i++) {
      if (i > 0) { const p0 = rows[i - 1][mid], p1 = rows[i][mid]; acc += Math.hypot(p1.x - p0.x, p1.y - p0.y, p1.z - p0.z); }
      for (const q of rows[i]) q.v = acc;
    }
    for (let i = 0; i < rows.length - 1; i++) for (let j = 0; j < rows[i].length - 1; j++) quad(rows[i][j], rows[i][j + 1], rows[i + 1][j], rows[i + 1][j + 1], L);
  };
  const coreAt = (t) => { // the centre line's forward distance and height at flight time t
    return { a: v0 * t, y: -0.5 * G * t * t };
  };
  // core: two skins round one centre surface
  const core = (side, seed) => {
    const rows = [], pre = Math.max(4, Math.ceil(back * 3));
    for (let i = 0; i <= pre + rowsN; i++) {
      const tongue = i < pre, lev = i / pre, f = (i - pre) / rowsN, t = tongue ? 0 : tAt(f);
      const row = [];
      for (let j = 0; j <= cols; j++) {
        const u = j / cols, e = u * 2 - 1, rope = ropeAt(e) * ropeK;
        let a, y;
        if (tongue) { a = -back * (1 - lev); y = rise(a); }
        else { a = v0 * (1 + 0.12 * rope) * t; y = -0.5 * G * t * t + (t < 0.2 ? rise(0) * (1 - t / 0.2) : 0); }
        const fall = Math.min(1, -y / H);
        const fz = Math.max(0, fall), sd = e < 0 ? 1.7 : 4.1; // each side's edge wanders on its own, wider as it falls
        const wob = (0.2 + 0.9 * fz) * (0.6 * Math.sin(fz * 11 + sd) + 0.4 * Math.sin(fz * 23 + sd * 2.3)) * Math.pow(Math.abs(e), 3) * Math.sign(e);
        const b = e * widthAt(fz, seed + j) + wob + 0.18 * Math.sin(e * 3.7 + fall * 5) * fall;
        const belly = (1 - e * e) * 0.35 * Math.min(1, t / 0.4);
        const half = halfAt(t, Math.max(0, fall)), lens = Math.pow(Math.max(0, 1 - e * e), 0.4);
        const bulge = Math.max(0, rope) * (0.12 + 0.55 * Math.max(0, fall)) * Math.min(1, t / 0.5);
        const off = tongue ? side * 0.004 : side * (half * lens + bulge * lens) - half * 0.8;
        const q = P(a + belly + off, b, y);
        const speed = Math.hypot(v0, G * t), aer = Math.min(1, Math.max(0, (t - 0.22) / 0.6)) * (side > 0 ? 1 : 0.94);
        row.push({ ...q, u, c: [aer, speed / 20, Math.max(0, fall)] });
      }
      if (i === 0) row.forEach((q) => (q.v0 = -back));
      rows.push(row);
    }
    return rows;
  };
  grid(core(-1, 7), 0); // back skin first: seen from downstream, the far skin composites under the near one
  grid(core(1, 1), 1);
  // veil: an outer torn sheet billowing out in front of the core from a metre or so down
  if (Number(p.veil ?? 1) > 0 && lod <= 3) {
    const vr = lod <= 1 ? 54 : 36, vc = lod <= 1 ? 18 : 12, rows = [];
    const t0 = 0.28;
    for (let i = 0; i <= vr; i++) {
      const f = i / vr, t = t0 + (T - t0) * (f * 0.6 + f * f * 0.4), c = coreAt(t), fall = Math.min(1, -c.y / H);
      const row = [];
      for (let j = 0; j <= vc; j++) {
        const u = j / vc, e = u * 2 - 1;
        const w = widthAt(fall, 31 + j) * (1.02 + 0.12 * fall) + 0.25 * fall;
        const out = halfAt(t, fall) * Math.pow(Math.max(0, 1 - e * e), 0.4) * 0.2 + (0.25 + 1.6 * Math.pow(fall, 0.9)) * (0.75 + 0.25 * Math.cos(e * 2.4)) * Math.min(1, (t - t0) / 0.3);
        const q = P(c.a + (1 - e * e) * 0.35 + out + 0.3 * Math.sin(e * 5.1 + fall * 3.3) * fall, e * w + 0.3 * Math.sin(e * 2.9 + fall * 4) * fall, c.y);
        row.push({ ...q, u, c: [1, Math.hypot(v0, G * t) / 20, fall] });
      }
      rows.push(row);
    }
    rows[0].forEach((q) => (q.v0 = v0 * t0));
    grid(rows, 2);
  }
  // ropes: crossed ribbons peeling off the lip faster than the body, splaying out at the edges
  const nR = lod <= 1 ? Number(p.jets ?? 9) : lod === 2 ? Math.ceil(Number(p.jets ?? 9) * 0.6) : lod === 3 ? 3 : 0;
  for (let k = 0; k < nR; k++) {
    const h1 = hash(k * 3.1 + 0.7), h2 = hash(k * 5.3 + 2.1), h3 = hash(k * 7.7 + 4.4);
    const e0 = Math.max(-1.05, Math.min(1.05, -1.05 + 2.1 * (k + 0.5) / nR + (h1 - 0.5) * 0.15));
    const t0 = 0.08 + 0.35 * h2, vr = v0 * (1.12 + 0.3 * h3), vb = e0 * Math.abs(e0) * (0.5 + 0.8 * h1), rr = 22; // edge jets splay out hardest
    const tEnd = T; // every rope reaches the pool: the waterline, not the rope, decides where it ends
    const cen = [];
    for (let i = 0; i <= rr; i++) {
      const f = i / rr, t = t0 + (tEnd - t0) * (f * 0.5 + f * f * 0.5), tp = t - t0, c = coreAt(t), fall = Math.min(1, -c.y / H);
      const a0 = v0 * t + (1 - e0 * e0) * 0.35 + halfAt(t, fall) * 0.6 + (vr - v0) * tp;
      const b0 = e0 * widthAt(fall, k) + vb * tp;
      const hw = 0.14 + 0.1 * h1 + 0.55 * Math.pow(fall, 0.9);
      cen.push({ a: a0, b: b0, y: c.y, hw, c: [Math.min(1, tp / 0.35), Math.hypot(vr, G * t) / 20, fall] });
    }
    for (const axis of [0, 1]) { // one ribbon across, one along the flight: it reads as a rope from any side
      const rows = cen.map((q) => [-1, 0, 1].map((s) => {
        const pt = axis ? P(q.a + s * q.hw * 0.8, q.b, q.y) : P(q.a, q.b + s * q.hw, q.y);
        return { ...pt, u: (s + 1) / 2, c: q.c };
      }));
      rows[0].forEach((q) => (q.v0 = v0 * t0 + k * 3.7 + axis * 1.3));
      grid(rows, 3);
    }
  }
  // skirt: the boil where the fall lands. A low churned mound hugging the impact line, running out into a
  // flat foam slick carried downstream over the pool: the curtain melts into it, the pool's own water takes it
  // away. Sits on the pool (param pool: the pool's level, metres relative to the lip).
  if (p.pool != null) {
    const pl = Number(p.pool), tF = Math.sqrt((2 * Math.max(0.1, -pl)) / G);
    const aF = v0 * tF + 0.35 + halfAt(tF, 1) * 0.2, Wf = W + spread * 0.9; // the impact line's centre and half-length
    const na = lod <= 1 ? 30 : lod <= 2 ? 22 : 14, nb = lod <= 1 ? 36 : lod <= 2 ? 26 : 16;
    const aMin = aF - 2.6, aMax = aF + Number(p.slick ?? 10), bMax = Wf + 5.5, rows = [];
    for (let i = 0; i <= na; i++) {
      const fa = i / na, a = aMin + (aMax - aMin) * (fa < 0.35 ? fa / 0.35 * 0.3 : 0.3 + (fa - 0.35) / 0.65 * 0.7); // dense round the impact
      const row = [];
      for (let j = 0; j <= nb; j++) {
        const e = j / nb * 2 - 1, b = e * bMax * (1 + 0.25 * Math.max(0, a - aF) / (aMax - aF));
        const da = a - aF, db = Math.max(0, Math.abs(b) - Wf);
        const d = Math.hypot(db / 2.4, da / (da < 0 ? 1.6 : 2.6)); // 1 = the mound's edge
        const lump = 0.7 + 0.3 * Math.sin(b * 1.7 + 0.6) * Math.sin(a * 2.3 + 1.9) + 0.25 * hash(i * 31 + j * 7); // heaped, never a smooth hill
        const mound = 1.2 * Math.pow(Math.max(0, 1 - d * d), 1.3) * lump + 0.45 * Math.exp(-2 * (sq(da / 3) + sq((Math.abs(b)) / 5.2))); // + the pool's own heave under it
        const along = Math.max(0, da) / (aMax - aF), side = Math.min(1, Math.abs(b) / bMax);
        const cover = Math.max(Math.min(1, Math.max(0, 1.3 - d * 0.85)), 0.62 * Math.pow(1 - along, 1.3) * Math.pow(1 - side * side, 1.6)) * (da < -2 ? Math.max(0, (da + 2.6) / 0.6) : 1); // solid over the impact, thinning to rafts and a trace at the rim: never a ruled edge
        const heap = Math.min(1, Math.max(0, (mound - 0.02) / 0.1)); // the heap's own flanks stay solid froth down to the waterline: only the flat slick frays, so no daylight shows under the mound
        const ride = Number(p.lift ?? 0) + 0.04 + 0.14 * Math.exp(-sq(da / 3.6) - sq(b / 6.5)) - 0.22 * Math.pow(1 - Math.min(1, Math.max(0, Math.max(cover, heap))), 1.5); // wet, not floating: the thin rim sinks under the pool so the water itself draws its edge // clears the pool's own heave (lib/plunge.js dome + rings) everywhere, so the pool never crests over the foam
        const q = P(a, b, pl + ride + mound);
        row.push({ ...q, u: (e + 1) / 2, v: Math.hypot(db, da) * 1.0 + (da > 0 ? da * 0.4 : 0), c: [Math.min(1, Math.max(0, Math.max(cover, heap))), Math.max(0, 1 - d), 1] }); // v: metres out from the impact, so the boil flows outward and away
      }
      rows.push(row);
    }
    for (let i = 0; i < na; i++) for (let j = 0; j < nb; j++) quad(rows[i][j], rows[i][j + 1], rows[i + 1][j], rows[i + 1][j + 1], 4);
  }
  ctx.smooth();
  return { uvs, colors };
}

export function material(ctx) { return fallMaterial(ctx, false); }
