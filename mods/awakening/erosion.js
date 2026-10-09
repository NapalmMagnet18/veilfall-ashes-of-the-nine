// Awakening erosion sampler: reads a grid baked by mods/awakening/tools/erode.py (stream-power rivers,
// hillslope diffusion, talus) and adds what a 7.5 m grid cannot hold: downhill rills finer than the
// grid and granite jointing on the steep high rock. Import it from your terrain generator:
//   import { createErosion } from "../mods/awakening/erosion.js";
//   import { GRID, DATA } from "./lib/erosion-data.js";
//   const ERO = createErosion(GRID, DATA);
//   const d = ERO.detail(ctx, x, z); // null off the grid, else { h, e, m, fade }
// h: carved height (m). e: channel signal, negative in a gully (scree, snow couloirs). m: 0..1 how
// mountainous. fade: 1 inside the grid, 0 at its rim, so a procedural horizon can take over.
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const sstep = (a, b, v) => { const t = clamp01((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const TAU = Math.PI * 2;
const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

let HA = 0, HB = 0; // hash2's pair, written in place: no array per call on the hot path
function hash2(ix, iz) {
  let h = Math.imul(ix, 374761393) ^ Math.imul(iz, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  HA = ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  h = Math.imul(h ^ 0x9e3779b9, 2246822519);
  HB = ((h ^ (h >>> 15)) >>> 0) / 4294967296;
}
// one octave of gullies: a cosine wave per nearby cell point travelling along dir (across the slope),
// blended by distance. Returns [value -1..1, d/dx, d/dz] in cell units.
export let GV = 0, GX = 0, GZ = 0;
export function gully(px, pz, dx, dz) { gullyInto(px, pz, dx, dz); return [GV, GX, GZ]; }
export function gullyInto(px, pz, dx, dz) {
  const ix = Math.floor(px), iz = Math.floor(pz), fx = px - ix, fz = pz - iz;
  let v = 0, gx = 0, gz = 0, wt = 0;
  for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) {
    hash2(ix + i, iz + j);
    const ox = fx - i - HA * 0.5, oz = fz - j - HB * 0.5;
    const w = Math.exp(-(ox * ox + oz * oz) * 2);
    const mag = (ox * dx + oz * dz) * TAU;
    v += Math.cos(mag) * w;
    const s = -Math.sin(mag) * TAU * w;
    gx += s * dx; gz += s * dz; wt += w;
  }
  GV = v / wt; GX = gx / wt; GZ = gz / wt;
}
const cub = (p0, p1, p2, p3, t) => p1 + 0.5 * t * (p2 - p0 + t * (2 * p0 - 5 * p1 + 4 * p2 - p3 + t * (3 * (p1 - p2) + p3 - p0)));

export function createErosion(GRID, DATA, opts = {}) {
  const o = { rill: 5.5, rillFreq: 1 / 30, rillOctaves: 3, joint: 3.5, jointFreq: 1 / 22, jointSeed: 12, flowCut: 0.6, rimInner: 20, rimOuter: 220, ...opts };
  let HGT = null, FLOW = null;
  const N = GRID.n, F = N >> 1;
  function decode() {
    const lut = new Uint8Array(128); for (let i = 0; i < 64; i++) lut[B64.charCodeAt(i)] = i;
    const len = DATA.length, pad = DATA.endsWith("==") ? 2 : DATA.endsWith("=") ? 1 : 0;
    const out = new Uint8Array((len / 4) * 3 - pad);
    for (let i = 0, p = 0; i < len; i += 4) {
      const n = (lut[DATA.charCodeAt(i)] << 18) | (lut[DATA.charCodeAt(i + 1)] << 12) | (lut[DATA.charCodeAt(i + 2)] << 6) | lut[DATA.charCodeAt(i + 3)];
      if (p < out.length) out[p++] = n >> 16; if (p < out.length) out[p++] = (n >> 8) & 255; if (p < out.length) out[p++] = n & 255;
    }
    const k = (GRID.hi - GRID.lo) / 65535;
    HGT = new Float32Array(N * N);
    for (let i = 0; i < N * N; i++) HGT[i] = GRID.lo + (out[i * 2] | (out[i * 2 + 1] << 8)) * k;
    FLOW = out.subarray(N * N * 2, N * N * 2 + F * F);
  }
  function height(x, z) { // bicubic, null off the grid
    if (!HGT) decode();
    const u = (x - GRID.x0) / GRID.cell, v = (z - GRID.z0) / GRID.cell;
    if (u < 1 || v < 1 || u > N - 3 || v > N - 3) return null;
    const iu = Math.floor(u), iv = Math.floor(v), fu = u - iu, fv = v - iv;
    let b = (iv - 1) * N + iu - 1;
    const r0 = cub(HGT[b], HGT[b + 1], HGT[b + 2], HGT[b + 3], fu); b += N;
    const r1 = cub(HGT[b], HGT[b + 1], HGT[b + 2], HGT[b + 3], fu); b += N;
    const r2 = cub(HGT[b], HGT[b + 1], HGT[b + 2], HGT[b + 3], fu); b += N;
    const r3 = cub(HGT[b], HGT[b + 1], HGT[b + 2], HGT[b + 3], fu);
    return cub(r0, r1, r2, r3, fv);
  }
  function flow(x, z) { // 0..1 log drainage area: rivers near 1
    if (!HGT) decode();
    const u = Math.round((x - GRID.x0) / GRID.cell / 2), v = Math.round((z - GRID.z0) / GRID.cell / 2);
    if (u < 0 || v < 0 || u >= F || v >= F) return 0;
    return FLOW[v * F + u] / 255;
  }
  function edgeFade(x, z) {
    const span = N * GRID.cell, u = x - GRID.x0, v = z - GRID.z0;
    return sstep(o.rimInner, o.rimOuter, Math.min(u, v, span - u, span - v));
  }
  // lite: the channel and mountain signals alone (what a materialAt needs), no jointing noise
  function detail(ctx, x, z, lite = false) {
    const g = height(x, z);
    if (g === null) return null;
    const fade = edgeFade(x, z);
    const s = 4, A = height(x + s, z) ?? g, B = height(x - s, z) ?? g, C = height(x, z + s) ?? g, D = height(x, z - s) ?? g;
    let gx = (A - B) / (2 * s), gz = (C - D) / (2 * s);
    const steep = clamp01(Math.hypot(gx, gz) * 1.4);
    let freq = o.rillFreq, amp = o.rill, sum = 0;
    for (let k = 0; k < o.rillOctaves; k++) {
      const gl = Math.hypot(gx, gz) || 1;
      gullyInto(x * freq, z * freq, gz / gl, -gx / gl);
      const a = amp * (0.2 + steep * 0.8);
      sum += GV * a; gx += GX * freq * a; gz += GZ * freq * a;
      freq *= 2.1; amp *= 0.45;
    }
    const e = sum / 8 - flow(x, z) * o.flowCut, m = sstep(10, 60, g);
    if (lite) return { h: g, e, m, fade };
    let h = Math.max(g, 0) + sum * sstep(8, 40, g);
    const jw = o.joint * steep * sstep(25, 70, h);
    if (jw <= 0) return { h, e, m, fade };
    const j = ctx.noise.ridged({ x: x + z * 0.3, z: z - x * 0.2, frequency: o.jointFreq, octaves: 3, seed: ctx.seedOffset(o.jointSeed) }) / 1.75;
    h += (j - 0.5) * jw;
    return { h, e, m, fade };
  }
  return { height, flow, edgeFade, detail };
}
