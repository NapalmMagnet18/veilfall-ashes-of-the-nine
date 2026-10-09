// Awakening Water: the creek tool. A creek is a line from its spring to its mouth; this carves the ground it runs in
// and says where its water stands, so the water sheet (river-sheet.js + river.js, the shared water) lies in it.
//
//   const creek = createCreek({ line: [[x, z], …], calm: { length: 136, level: 0.6 } });
//   heightAt:  h = creek.bed(ctx, x, z, h, bare)      // bare(ctx, x, z) → { h }: your landform before any water
//   authoring: creek.level(s), creek.point(s), creek.near(x, z), creek.length
//              traceCreek(heightAt, from, to)          // a line down the land's own fall line, for `line`
//              bakeSheet(creek, heightAt)              // the sheet's pts param
//
// Rules it keeps, so a creek always reads as water that found its way down:
// - the water level comes from the land: the bare ground down the line, sunk `depth`, never climbing, smoothed, eased
//   onto the calm reach's level (a lake, a river) over its last stretch; nothing is authored in metres
// - the bed only cuts: a channel under the water, low cut banks, then a valley side climbing at `slope` until it
//   meets the land, joined by a smooth minimum. No embankments; the only fill is a hand-high lip holding the water in
// - pools step down the line every `pool` metres, each step as tall as the ground falls over one pool
// - at the spring the channel closes in a round seep under a steeper headwall
// Imports nothing; pure math over the ctx.noise the terrain generator hands it.
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const sstep = (a, b, v) => { const t = clamp01((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const smin = (a, b, k) => { const t = clamp01(0.5 + 0.5 * (b - a) / k); return b + (a - b) * t - k * t * (1 - t); };

export function chaikin(line, passes = 2) {
  let C = line.map((p) => [p[0], p[1]]);
  for (let k = 0; k < passes; k++) { const N = [C[0]]; for (let i = 0; i < C.length - 1; i++) { const a = C[i], b = C[i + 1];
    N.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25], [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]); } N.push(C[C.length - 1]); C = N; }
  return C;
}

export function createCreek(o) {
  const P = chaikin(o.line, o.smooth ?? 2);
  const depth = o.depth ?? 0.9, step = 2, pool = o.pool ?? 6, head = o.head ?? 1.4, reach = o.reach ?? 27;
  const slope = o.slope ?? 0.42, headwall = o.headwall ?? 0.8, maxWet = o.maxWet ?? 2.05;
  const calmLevel = o.calm?.level ?? 0.6, seeds = { rough: 12, wet: 13, wob: 14, ...(o.seeds || {}) };
  const mask = o.mask || null; // (x, z) → 0..1: how much the creek may carve here (0 inside a lake it meets)
  const S = [0]; for (let i = 1; i < P.length; i++) S.push(S[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
  const length = S[S.length - 1], CALM = length - (o.calm?.length ?? 0);
  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
  for (const p of P) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); z0 = Math.min(z0, p[1]); z1 = Math.max(z1, p[1]); }
  x0 -= reach + 2; x1 += reach + 2; z0 -= reach + 2; z1 += reach + 2;

  const point = (s) => { let i = 1; while (i < P.length - 1 && S[i] < s) i++;
    const a = P[i - 1], b = P[i], u = clamp01((s - S[i - 1]) / (S[i] - S[i - 1])); return { x: a[0] + (b[0] - a[0]) * u, z: a[1] + (b[1] - a[1]) * u }; };
  // nearest point: a 16 m grid lists the segments within reach of each cell
  const CG = 16, G = new Map(), gk = (i, j) => i * 4096 + j, pad = reach + 1;
  for (let i = 1; i < P.length; i++) { const a = P[i - 1], b = P[i];
    for (let gx = Math.floor((Math.min(a[0], b[0]) - pad) / CG); gx <= Math.floor((Math.max(a[0], b[0]) + pad) / CG); gx++)
      for (let gz = Math.floor((Math.min(a[1], b[1]) - pad) / CG); gz <= Math.floor((Math.max(a[1], b[1]) + pad) / CG); gz++) {
        const k = gk(gx, gz); let l = G.get(k); if (!l) G.set(k, l = []); l.push(i); } }
  const FAR = { d: 1e9, s: 0 };
  const near = (x, z) => {
    const l = G.get(gk(Math.floor(x / CG), Math.floor(z / CG))); if (!l) return FAR;
    let bd = 1e9, bs = 0;
    for (const i of l) { const a = P[i - 1], b = P[i], ex = b[0] - a[0], ez = b[1] - a[1], e2 = ex * ex + ez * ez;
      const u = clamp01(((x - a[0]) * ex + (z - a[1]) * ez) / e2), dx = x - a[0] - ex * u, dz = z - a[1] - ez * u, d = dx * dx + dz * dz;
      if (d < bd) { bd = d; bs = S[i - 1] + u * Math.sqrt(e2); } }
    return { d: Math.sqrt(bd), s: bs };
  };

  let prof = null;
  function profile(ctx, bare) {
    if (prof) return prof;
    const N = Math.ceil(length / step) + 2, g = new Float64Array(N);
    for (let i = 0; i < N; i++) {
      const s = Math.min(length, i * step), p = point(s), q = point(Math.min(length, s + 1));
      let tx = q.x - p.x, tz = q.z - p.z; const l = Math.hypot(tx, tz) || 1; tx /= l; tz /= l;
      let lo = bare(ctx, p.x, p.z).h;
      for (const k of [-3, 3]) lo = Math.min(lo, bare(ctx, p.x - tz * k, p.z + tx * k).h);
      g[i] = lo - depth;
    }
    for (let i = 1; i < N; i++) g[i] = Math.min(g[i], g[i - 1]); // water never climbs
    for (let pass = 0; pass < 3; pass++) { const t = Float64Array.from(g);
      for (let i = 0; i < N; i++) { let a = 0, c = 0; for (let k = -4; k <= 4; k++) { a += t[Math.min(N - 1, Math.max(0, i + k))]; c++; } g[i] = a / c; } }
    for (let i = 1; i < N; i++) g[i] = Math.min(g[i], g[i - 1]);
    for (let i = 0; i < N; i++) { const w = sstep(CALM - 46, CALM, i * step); g[i] = Math.max(calmLevel, g[i] * (1 - w) + calmLevel * w); }
    return (prof = g);
  }
  const base = (s) => { if (s >= CALM || !prof) return calmLevel; const f = Math.max(0, s) / step, i = Math.min(prof.length - 2, Math.floor(f)); return prof[i] + (prof[i + 1] - prof[i]) * (f - i); };
  const level = (s) => { s = Math.max(0, s); if (s >= CALM) return calmLevel;
    const s0 = Math.floor(s / pool) * pool, f = (s - s0) / pool; return base(s0) + (base(s0 + pool) - base(s0)) * sstep(0.62, 1, f); };
  const wet = (ctx, s) => {
    const L = s < CALM ? pool : 24, f = (Math.max(0, s) % L) / L, face = s < CALM ? 0.62 : 0.45;
    const pl = s >= CALM ? 0.55 + 0.45 * Math.sin(s * 0.09) : Math.sin(Math.PI * clamp01(f / face)) ** 1.5;
    const wob = ctx.noise.fbm2({ x: s * 0.13, z: 7.3, frequency: 1, octaves: 2, seed: ctx.seedOffset(seeds.wet) }) * 0.25;
    return Math.min(maxWet, 1.15 + 0.85 * pl + wob);
  };
  function bed(ctx, x, z, h, bare) {
    if (x < x0 || x > x1 || z < z0 || z > z1) return h;
    const m = mask ? mask(x, z) : 1; if (m <= 0) return h;
    const n = near(x, z); if (n.d > reach) return h;
    profile(ctx, bare);
    const atHead = n.s < head;
    let d = n.d; if (atHead) { const p = point(head); d = Math.hypot(x - p.x, z - p.z); }
    const lv = level(n.s), rough = ctx.noise.fbm2({ x, z, frequency: 1 / 9, octaves: 2, seed: ctx.seedOffset(seeds.rough) }) * 0.18;
    const hw = wet(ctx, n.s) * (0.45 + 0.55 * sstep(head, 9, n.s)), edge = hw + 1.2;
    const T = lv - 0.35 - 0.3 * (1 - sstep(0, hw, d)) + 0.75 * sstep(hw - 0.35, hw + 0.2, d) + 0.3 * sstep(hw + 0.2, edge, d) + rough * sstep(hw + 0.5, 3, d);
    const wob = ctx.noise.fbm2({ x, z, frequency: 1 / 17, octaves: 2, seed: ctx.seedOffset(seeds.wob) }) * 0.9 * sstep(edge, edge + 5, d);
    const sl = atHead ? headwall : slope + 0.12 * wob;
    const V = d <= edge ? T : lv + 0.7 + rough + sl * (d - edge) + wob;
    const hold = d < edge + 1.5 ? Math.max(h, lv + 0.3 * (1 - sstep(edge, edge + 1.5, d))) : h;
    let r = smin(hold, V, d <= edge ? 0.25 : 1.4);
    r = h + (r - h) * (1 - sstep(reach - 5, reach, d));
    return h + (r - h) * m;
  }
  // the water surface at s, read off the carved ground (the bed sits exactly 0.65 under the water on the centreline)
  const surface = (heightAt, s) => { if (s >= CALM) return calmLevel; const p = point(Math.max(head + 0.1, s)); return heightAt(p.x, p.z) + 0.65; };
  return { points: P, S, length, CALM, point, near, level, wet, bed, profile, surface, head };
}

// the sheet's pts param, every `spacing` metres down the carved creek (run after the terrain has rebuilt)
export function bakeSheet(creek, heightAt, spacing = 1.5) {
  const out = [];
  for (let s = 0; s <= creek.length + 0.01; s += spacing) { const t = Math.min(s, creek.length), p = creek.point(t);
    out.push(`${p.x.toFixed(2)},${creek.surface(heightAt, t).toFixed(2)},${p.z.toFixed(2)}`); }
  return out.join(";");
}

// a line from `from` to `to` that keeps to the valley floor: a least-cost walk over a 4 m grid where low ground is
// cheap and climbing is dear. heightAt(x, z) is any height read (ctx.place.terrain.heightAt in a run_script).
export function traceCreek(heightAt, from, to, o = {}) {
  const G = o.grid ?? 4, m = o.margin ?? 40;
  const X0 = Math.min(from[0], to[0]) - m, X1 = Math.max(from[0], to[0]) + m, Z0 = Math.min(from[1], to[1]) - m, Z1 = Math.max(from[1], to[1]) + m;
  const W = Math.round((X1 - X0) / G) + 1, H = Math.round((Z1 - Z0) / G) + 1, ht = new Float64Array(W * H);
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) ht[j * W + i] = heightAt(X0 + i * G, Z0 + j * G);
  const idx = (x, z) => Math.round((z - Z0) / G) * W + Math.round((x - X0) / G);
  const src = idx(from[0], from[1]), dst = idx(to[0], to[1]);
  const dist = new Float64Array(W * H).fill(1e18), prev = new Int32Array(W * H).fill(-1), done = new Uint8Array(W * H), heap = [[0, src]];
  dist[src] = 0;
  const push = (e) => { heap.push(e); let k = heap.length - 1; while (k > 0) { const p = (k - 1) >> 1; if (heap[p][0] <= heap[k][0]) break; [heap[p], heap[k]] = [heap[k], heap[p]]; k = p; } };
  const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let k = 0; for (;;) { const l = 2 * k + 1, r = l + 1; let n = k;
    if (l < heap.length && heap[l][0] < heap[n][0]) n = l; if (r < heap.length && heap[r][0] < heap[n][0]) n = r; if (n === k) break; [heap[n], heap[k]] = [heap[k], heap[n]]; k = n; } } return top; };
  while (heap.length) { const [d, u] = pop(); if (done[u]) continue; done[u] = 1; if (u === dst) break;
    const ui = u % W, uj = (u / W) | 0;
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) { if (!di && !dj) continue; const vi = ui + di, vj = uj + dj; if (vi < 0 || vj < 0 || vi >= W || vj >= H) continue;
      const v = vj * W + vi, c = Math.hypot(di, dj) * G * (1 + (o.lowWeight ?? 0.25) * ht[v]) + Math.max(0, ht[v] - ht[u]) * (o.climb ?? 60);
      if (d + c < dist[v]) { dist[v] = d + c; prev[v] = u; push([d + c, v]); } } }
  const path = []; for (let u = dst; u !== -1; u = prev[u]) path.push([X0 + (u % W) * G, Z0 + ((u / W) | 0) * G]);
  path.reverse();
  const out = []; for (let k = 0; k < path.length; k += 3) out.push(path[k]); if (out[out.length - 1] !== path[path.length - 1]) out.push(path[path.length - 1]);
  return out;
}
