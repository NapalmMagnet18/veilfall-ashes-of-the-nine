// Awakening forest: a procedural woodland planner. Pure and deterministic: give it the ground (H(x, z) → height),
// a footprint (mask(x, z) → 0..1) and a species table; it returns placement rows and the trails it wore.
//
//   import { plantForest } from "mods/awakening/forest.js";
//   const f = plantForest((x, z) => ctx.place.terrain.heightAt(x, z), { bounds, mask, species, understory, trails, seed });
//   f.trees / f.under: [{ kind, x, y, z, yaw, s }]   y = feet height, already sunk by the kind's `sink` per unit scale
//   f.trails: [{ points: [[x, z], …], width }]        feed each to a terrain `path` mark so the ground wears in
//   opts.trails = { count, width, paths: [{ via: [[x, z], …] }] }: count auto trails from the stand's margin through a
//   glade, plus any routed through your own waypoints
//
// What makes it read as a forest, not a lawn of trees:
//  - density is a field, not a constant: low-frequency clumping noise × the footprint, so stands thicken and thin,
//    and trunk spacing follows it (tight where dense, open where thin) with a Poisson-disc check
//  - species grow in patches (a second noise picks the stand's leading species) and by site: altitude, slope, edge
//  - glades: a few soft openings where saplings crowd the light
//  - trails: routed like feet walk them, contouring the slope toward their goal, meandering, smoothed; trees keep
//    off them and ferns line their verges
//  - understory by light: ferns bed in the shade of dense stands and along trails, saplings in gaps, shrubs on the
//    sunny edge; a fallen log lies downhill on flat-enough ground with the stump it broke from at its root end
const TAU = Math.PI * 2;
const sst = (a, b, v) => { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;

function rng(seed) { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

// seeded 2D value noise, fbm'd; returns ~0..1
function noise2(seed) {
  const hash = (i, j) => { let h = (i * 374761393 + j * 668265263 + seed * 144269) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const vn = (x, z) => {
    const i = Math.floor(x), j = Math.floor(z), fx = x - i, fz = z - j, u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz);
    return lerp(lerp(hash(i, j), hash(i + 1, j), u), lerp(hash(i, j + 1), hash(i + 1, j + 1), u), v);
  };
  return (x, z, scale, oct = 3) => { let a = 0, w = 0.5, f = 1 / scale, n = 0; for (let o = 0; o < oct; o++) { a += vn(x * f + o * 17.3, z * f - o * 9.1) * w; n += w; w *= 0.5; f *= 2.03; } return a / n; };
}

// the ground, sampled once on a grid: every later height and slope read is a bilinear lookup
function groundGrid(H, b, cell) {
  const nx = Math.ceil((b.maxX - b.minX) / cell) + 3, nz = Math.ceil((b.maxZ - b.minZ) / cell) + 3, x0 = b.minX - cell, z0 = b.minZ - cell;
  const g = new Float32Array(nx * nz);
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) g[j * nx + i] = H(x0 + i * cell, z0 + j * cell) ?? 0;
  const at = (x, z) => {
    const fx = Math.min(nx - 1.001, Math.max(0, (x - x0) / cell)), fz = Math.min(nz - 1.001, Math.max(0, (z - z0) / cell));
    const i = Math.floor(fx), j = Math.floor(fz), u = fx - i, v = fz - j, k = j * nx + i;
    return lerp(lerp(g[k], g[k + 1], u), lerp(g[k + nx], g[k + nx + 1], u), v);
  };
  const grad = (x, z) => [(at(x + 1.5, z) - at(x - 1.5, z)) / 3, (at(x, z + 1.5) - at(x, z - 1.5)) / 3];
  const slope = (x, z) => Math.hypot(...grad(x, z));
  return { at, grad, slope };
}

// spatial hash for spacing checks
function hashGrid(cell) {
  const m = new Map(), key = (i, j) => i * 73856093 ^ j * 19349663;
  return {
    add(p) { const k = key(Math.floor(p.x / cell), Math.floor(p.z / cell)); (m.get(k) || m.set(k, []).get(k)).push(p); },
    near(x, z, r) {
      const out = [], i0 = Math.floor((x - r) / cell), i1 = Math.floor((x + r) / cell), j0 = Math.floor((z - r) / cell), j1 = Math.floor((z + r) / cell);
      for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) for (const p of m.get(key(i, j)) || []) if ((p.x - x) ** 2 + (p.z - z) ** 2 < r * r) out.push(p);
      return out;
    },
  };
}

function segDist(px, pz, ax, az, bx, bz) {
  const dx = bx - ax, dz = bz - az, L = dx * dx + dz * dz, t = L ? Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / L)) : 0;
  return Math.hypot(px - ax - dx * t, pz - az - dz * t);
}

// a trail from a to b the way feet wear one: each step picks the heading that climbs least while still closing on
// the goal, with a slow meander; then Chaikin-smoothed and thinned to ~6 m points
function routeTrail(G, a, b, R, N, o) {
  const step = 3, pts = [[a[0], a[1]]];
  let x = a[0], z = a[1], head = Math.atan2(b[1] - z, b[0] - x);
  for (let k = 0; k < 400; k++) {
    const toGoal = Math.atan2(b[1] - z, b[0] - x), d = Math.hypot(b[0] - x, b[1] - z);
    if (d < step * 1.5) { pts.push([b[0], b[1]]); break; }
    let best = null, bestCost = Infinity;
    for (let s = -4; s <= 4; s++) {
      const hd = head + s * 0.18, nx = x + Math.cos(hd) * step, nz = z + Math.sin(hd) * step;
      const climb = Math.abs(G.at(nx, nz) - G.at(x, z)) / step;
      let off = Math.abs(((hd - toGoal + Math.PI * 3) % TAU) - Math.PI);
      const wander = (N(nx, nz, o.meander, 2) - 0.5) * 2;
      const c = climb * o.climbCost + off * off * (0.5 + 3 * sst(40, 6, d)) + Math.abs(s) * 0.05 + wander * 0.35 * Math.sign(s || 1) + (o.mask(nx, nz) <= 0 ? 0.6 : 0);
      if (c < bestCost) { bestCost = c; best = hd; }
    }
    head = best; x += Math.cos(head) * step; z += Math.sin(head) * step; pts.push([x, z]);
  }
  let p = pts;
  for (let it = 0; it < 2; it++) { const q = [p[0]]; for (let i = 0; i < p.length - 1; i++) { const [ax, az] = p[i], [bx, bz] = p[i + 1]; q.push([ax * 0.75 + bx * 0.25, az * 0.75 + bz * 0.25], [ax * 0.25 + bx * 0.75, az * 0.25 + bz * 0.75]); } q.push(p[p.length - 1]); p = q; }
  const out = [p[0]]; let acc = 0;
  for (let i = 1; i < p.length; i++) { acc += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); if (acc >= 6 || i === p.length - 1) { out.push([+p[i][0].toFixed(2), +p[i][1].toFixed(2)]); acc = 0; } }
  return out;
}

export function plantForest(H, opts) {
  const o = {
    seed: 1, cell: 2, clump: 55, contrast: 1.6, patch: 80, maxTrees: 600, maxSlope: 0.85, minH: -Infinity, maxH: Infinity,
    avoid: () => false, glades: { count: 4, radius: [10, 20] }, trails: { count: 2, width: 2.4, climbCost: 9, meander: 35 },
    ...opts,
  };
  o.trails = { count: 2, width: 2.4, climbCost: 9, meander: 35, ...(opts.trails || {}) };
  o.glades = { count: 4, radius: [10, 20], ...(opts.glades || {}) };
  const R = rng(o.seed), N = noise2(o.seed), P = noise2(o.seed + 101), b = o.bounds, mask = o.mask;
  const G = groundGrid(H, b, o.cell);
  const inB = (x, z) => x >= b.minX && x <= b.maxX && z >= b.minZ && z <= b.maxZ;
  const siteOk = (x, z) => { if (!inB(x, z) || o.avoid(x, z)) return false; const h = G.at(x, z); return h > o.minH && h < o.maxH && G.slope(x, z) < o.maxSlope; };
  const rand = (x, z) => [b.minX + R() * (b.maxX - b.minX), b.minZ + R() * (b.maxZ - b.minZ)];

  // 1. glades: soft openings deep enough in the stand to read as clearings
  const glades = [];
  for (let t = 0; t < 400 && glades.length < o.glades.count; t++) {
    const [x, z] = rand(); if (mask(x, z) < 0.7 || !siteOk(x, z)) continue;
    const r = lerp(o.glades.radius[0], o.glades.radius[1], R());
    if (glades.some((g) => Math.hypot(g.x - x, g.z - z) < g.r + r + 25)) continue;
    glades.push({ x, z, r });
  }
  const gladeHole = (x, z) => glades.reduce((m, g) => Math.min(m, sst(g.r * 0.55, g.r * 1.15, Math.hypot(x - g.x, z - g.z) + (N(x, z, 9, 2) - 0.5) * g.r * 0.5)), 1);

  // 2. trails: explicit ones pass through; else entries on the stand's outer margin, linked through a glade
  const trails = [];
  const given = o.trails.paths || [];
  for (const pth of given) { // [[x, z], …] = a literal polyline; { via: [[x, z], …], width } = routed through each waypoint in turn
    if (Array.isArray(pth)) { trails.push({ points: pth, width: o.trails.width }); continue; }
    const pts = [pth.via[0]];
    for (let i = 0; i < pth.via.length - 1; i++) pts.push(...routeTrail(G, pth.via[i], pth.via[i + 1], R, N, { ...o.trails, mask }).slice(1));
    trails.push({ points: pts, width: pth.width ?? o.trails.width });
  }
  const margin = [];
  for (let t = 0; t < 3000 && margin.length < 60; t++) { const [x, z] = rand(); const m = mask(x, z); if (m > 0.05 && m < 0.35 && siteOk(x, z)) margin.push([x, z]); }
  for (let k = given.length; k < o.trails.count && margin.length > 1; k++) {
    const a = margin[Math.floor(R() * margin.length)];
    const far = margin.filter((p) => Math.hypot(p[0] - a[0], p[1] - a[1]) > 90);
    if (!far.length) continue;
    const e = far[Math.floor(R() * far.length)];
    const g = glades.length ? glades[k % glades.length] : null, pts = routeTrail(G, a, g ? [g.x, g.z] : e, R, N, { ...o.trails, mask });
    if (g) pts.push(...routeTrail(G, [g.x, g.z], e, R, N, { ...o.trails, mask }).slice(1));
    trails.push({ points: pts, width: o.trails.width * lerp(0.8, 1.15, R()) });
  }
  const trailDist = (x, z) => { let d = Infinity; for (const t of trails) for (let i = 0; i < t.points.length - 1; i++) { const [ax, az] = t.points[i], [bx, bz] = t.points[i + 1]; d = Math.min(d, segDist(x, z, ax, az, bx, bz) - t.width / 2); } return d; };

  // 3. the density field
  const density = (x, z) => {
    const m = mask(x, z); if (m <= 0) return 0;
    const c = Math.pow(N(x, z, o.clump, 3), o.contrast) * 1.9;
    return Math.min(1, m * c * gladeHole(x, z));
  };

  // 4. trees: dart throwing, spacing from density, species by patch + site
  const sp = o.species, trees = [], TG = hashGrid(6);
  const pick = (x, z, d, m) => {
    const h = G.at(x, z), sl = G.slope(x, z), lead = P(x, z, o.patch, 2);
    let tot = 0; const w = sp.map((s, i) => {
      let v = s.weight ?? 1;
      if (s.alt) v *= sst(s.alt[0] - 8, s.alt[0] + 4, h) * sst(s.alt[1] + 8, s.alt[1] - 4, h);
      if (s.slopeMax != null) v *= sst(s.slopeMax + 0.1, s.slopeMax - 0.1, sl);
      if (s.edge) v *= s.edge > 0 ? lerp(1, 0.08, sst(0.2, 0.7, m)) * (1 + s.edge * 2) : lerp(0.3, 1, sst(0.3, 0.8, m));
      if (s.patch != null) v *= 0.25 + 1.5 * sst(0.25, 0.75, 1 - Math.abs(lead - s.patch) * 2);
      tot += v; return v;
    });
    let u = R() * tot; for (let i = 0; i < sp.length; i++) { u -= w[i]; if (u <= 0) return sp[i]; } return sp[sp.length - 1];
  };
  for (let t = 0; t < o.maxTrees * 40 && trees.length < o.maxTrees; t++) {
    const [x, z] = rand(), d = density(x, z);
    if (d <= 0.02 || R() > d || !siteOk(x, z)) continue;
    if (trailDist(x, z) < 1.4 + R() * 1.2) continue;
    const s = pick(x, z, d, mask(x, z)); if (!s) continue;
    const gap = lerp(s.spacing[1], s.spacing[0], d);
    if (TG.near(x, z, gap).length) continue;
    const sc = lerp(s.scale[0], s.scale[1], R()) * lerp(0.9, 1.05, d);
    const row = { kind: s.kind, x, z, y: G.at(x, z) - (s.sink ?? 0) * sc, yaw: R() * 360, s: sc, d };
    trees.push(row); TG.add(row);
  }

  // 5. understory
  const U = o.understory || {}, under = [], UG = hashGrid(3);
  const free = (x, z, r) => !TG.near(x, z, r).length && !UG.near(x, z, r).length;
  const put = (spec, x, z, sc, yaw, y) => { const row = { kind: spec.kind, x, z, y: y ?? G.at(x, z) - (spec.sink ?? 0) * sc, yaw: yaw ?? R() * 360, s: sc }; under.push(row); UG.add(row); };
  const rs = (spec) => lerp(spec.scale?.[0] ?? 0.8, spec.scale?.[1] ?? 1.2, R());
  if (U.fern) { // shade beds under dense canopy, and verges along the trails
    for (let t = 0; t < U.fern.count * 30 && under.filter((u) => u.kind === U.fern.kind).length < U.fern.count; t++) {
      const [x, z] = rand(), d = density(x, z), td = trailDist(x, z), verge = td > 0.3 && td < 2.2;
      if (!(R() < d * 0.9 || (verge && mask(x, z) > 0.2)) || !siteOk(x, z) || td < 0.3) continue;
      const n = 2 + Math.floor(R() * 4);
      for (let k = 0; k < n; k++) { const a = R() * TAU, r = R() * 2.2, fx = x + Math.cos(a) * r, fz = z + Math.sin(a) * r; if (siteOk(fx, fz) && trailDist(fx, fz) > 0.3 && !TG.near(fx, fz, 0.7).length && !UG.near(fx, fz, 0.8).length) put(U.fern, fx, fz, rs(U.fern)); }
    }
  }
  const countOf = (k) => under.filter((u) => u.kind === k).length;
  if (U.sapling) for (let t = 0; t < U.sapling.count * 40 && countOf(U.sapling.kind) < U.sapling.count; t++) { // the light gaps: glades and thin stand
    const [x, z] = rand(), m = mask(x, z), d = density(x, z), light = m > 0.25 ? 1 - d : 0;
    if (R() > light * 0.8 || !siteOk(x, z) || trailDist(x, z) < 1 || !free(x, z, 2.2)) continue;
    put(U.sapling, x, z, rs(U.sapling));
  }
  if (U.shrub) for (let t = 0; t < U.shrub.count * 40 && countOf(U.shrub.kind) < U.shrub.count; t++) { // the sunny edge
    const [x, z] = rand(), m = mask(x, z);
    if (m <= 0.02 || m > 0.4 || R() > 0.7 || !siteOk(x, z) || trailDist(x, z) < 1 || !free(x, z, 1.6)) continue;
    put(U.shrub, x, z, rs(U.shrub));
  }
  if (U.log) for (let t = 0; t < U.log.count * 60 && countOf(U.log.kind) < U.log.count; t++) { // fallen downhill, stump at the root
    const [x, z] = rand(); if (mask(x, z) < 0.3 || !siteOk(x, z)) continue;
    const [gx, gz] = G.grad(x, z), gl = Math.hypot(gx, gz);
    const fall = gl > 0.04 ? Math.atan2(-gz, -gx) + (R() - 0.5) * 0.7 : R() * TAU; // world angle in xz
    const cx = Math.cos(fall), cz = Math.sin(fall), half = (U.log.length ?? 5.6) / 2;
    const along = [-1, -0.5, 0, 0.5, 1].map((k) => [x + cx * half * k, z + cz * half * k]), hs = along.map(([px, pz]) => G.at(px, pz));
    if (Math.max(...hs) - Math.min(...hs) > (U.log.maxDrop ?? 0.6)) continue;
    if (!along.every(([px, pz]) => free(px, pz, 1.2) && trailDist(px, pz) > 0.8)) continue;
    const sc = rs(U.log), yaw = (Math.atan2(-cz, cx) * 180) / Math.PI;
    put(U.log, x, z, sc, yaw, Math.min(...hs) - (U.log.sink ?? 0.18));
    if (U.stump && R() < 0.6) { const sx = x - cx * (half + 1.1), sz = z - cz * (half + 1.1); if (siteOk(sx, sz) && free(sx, sz, 1.2)) { const s2 = rs(U.stump); put(U.stump, sx, sz, s2, R() * 360, Math.min(G.at(sx + 0.6, sz), G.at(sx - 0.6, sz), G.at(sx, sz + 0.6), G.at(sx, sz - 0.6)) - (U.stump.sink ?? 0) * s2 + 0.05); } }
  }
  if (U.stump) for (let t = 0; t < (U.stump.count ?? 0) * 40 && countOf(U.stump.kind) < U.stump.count; t++) { // the cut ones stand by the trail
    const [x, z] = rand(), td = trailDist(x, z);
    if (mask(x, z) < 0.2 || td < 1.2 || td > 6 || !siteOk(x, z) || !free(x, z, 1.5)) continue;
    const s2 = rs(U.stump); put(U.stump, x, z, s2, R() * 360, Math.min(G.at(x + 0.6, z), G.at(x - 0.6, z), G.at(x, z + 0.6), G.at(x, z - 0.6)) - (U.stump.sink ?? 0) * s2 + 0.05);
  }
  for (const t of trees) delete t.d;
  return { trees, under, trails, glades };
}
