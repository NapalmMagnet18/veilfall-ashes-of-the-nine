// Zone ground cover for the Ossuary/Abbey ash, the Lanternmere fen, the Frostbitten Vale and the Hollow Deep:
// one INSTANCE SET per row, the same contract as bw-floor.js. params.kind picks one small clump (drawn many
// times); the records scatter it inside params.bounds (a radius, or a polygon [[x,z],…] local to the row)
// minus params.clear ([[x,z,r],…] local circles), seeded by the row's seed, each copy set on the ground with
// ctx.groundY. No collider: ground cover never blocks. params:
//   biome: ash | fen | frost | deep   (omitted: read from the kind)
//   kind (per biome; tris per copy at lod 1 / 2 / 3 in brackets, measured):
//     ash   cinders    charred twigs with dim ember tips, grey ash drifts on a dark cinder bed      [~420/300/150]
//           rubble     broken masonry blocks, a carved cornice fragment, grit and chips              [~330/250/120]
//           candles    melted cream wax stubs (a few dimly lit) in a puddle of old wax, one toppled  [~560/380/180]
//           deadgrass  dry tan tufts, some blades broken over, seed heads                           [~150/90/40]
//           bones      a sunk ribcage, skull and long bones in ash                                  [~700/520/260]
//     fen   reeds      cattail clump to 1.35 m (always zone out; knee-high near packs)              [~420/280/130]
//           lily       lily pads and a pale flower on a glossy wet-mud puddle (lies flat)           [~260/190/90]
//           mossmound  low green-black moss hummocks with sprigs                                   [~380/300/150]
//           driftwood  a bleached grey log, end grain, broken branch stubs                         [~250/190/90]
//     frost snowdrift  soft wind-scoured snow mounds, dark stones peeking: the main bed            [~300/230/110]
//           frozengrass stiff pale blue-white tufts on a snow pad                                 [~170/110/50]
//           iceshard   small cyan ice spikes from a snow base (always zone out; knee-high near packs) [~150/120/80]
//           frostbones bones under snow, frost-capped                                              [~720/540/270]
//     deep  glowcap    pale cave mushrooms, dim cyan gills and cap spots, on dark stone             [~600/420/200]
//           crystal    violet/cyan crystal cluster, faint glow, on a rock (knee-high near packs)    [~250/200/110]
//           cavegravel broken rock and pebbles on a dark grit bed                                  [~420/300/140]
//           cavebones  yellowed bones on gravel with two faint crystal shards                      [~760/560/280]
//   count: copies at lod 1 (lod 2 ×0.65, lod 3 ×0.35, lod 4+ small kinds ×0.06 else ×0.15)
//     a zone's sum of count × tris stays ≤ 150k: e.g. 120 beds + 60 grass + 40 props + 20 bones ≈ 110k
//   origin: [x, z] the row's world feet (veilfall-map floorDist is read in world space)
//   zone: "out" = only off the walkable floor (margin m outside it, default 0.8), "in" = only on it, "any"
// Emissive is kept dim (≤ 0.35 linear): it reads in the dark, it never blooms.
import { floorDist } from "../lib/data/veilfall-map.js";
const TAU = Math.PI * 2;
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const addv = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const pick = (R, arr) => arr[Math.floor(R() * arr.length) % arr.length];

// ---------- helpers (copied from bw-floor.js's craft, plus rocks, blocks, blades, mounds) ----------
function emitter(ctx) {
  const E = { n: 0, tri(a, b, c) { ctx.tri(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]); E.n++; }, quad(a, b, c, d) { E.tri(a, b, c); E.tri(a, c, d); } };
  return E;
}
function tube(E, pts, rad, n) {
  const m = pts.length, rings = [], F = [];
  let N = null;
  for (let i = 0; i < m; i++) {
    const T = norm(sub(pts[Math.min(i + 1, m - 1)], pts[Math.max(i - 1, 0)]));
    if (!N) { const ref = Math.abs(T[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0]; N = norm(cross(ref, T)); }
    else N = norm(sub(N, mul(T, dot(N, T))));
    const B = cross(T, N), r = rad(i / (m - 1)), ring = [];
    for (let k = 0; k < n; k++) { const a = (k / n) * TAU, c = Math.cos(a) * r, s = Math.sin(a) * r; ring.push([pts[i][0] + N[0] * c + B[0] * s, pts[i][1] + N[1] * c + B[1] * s, pts[i][2] + N[2] * c + B[2] * s]); }
    rings.push(ring); F.push({ P: pts[i], T, N, B, r });
  }
  for (let i = 0; i < m - 1; i++) for (let k = 0; k < n; k++) E.quad(rings[i][k], rings[i][(k + 1) % n], rings[i + 1][(k + 1) % n], rings[i + 1][k]);
  return F;
}
function blob(E, c, rx, ry, rz, n = 8, m = 5, lat0 = 0, lat1 = 1) {
  const P = (i, k) => { const t = (lat0 + (lat1 - lat0) * (i / m)) * Math.PI, a = (k / n) * TAU; return [c[0] + Math.sin(t) * Math.cos(a) * rx, c[1] + Math.cos(t) * ry, c[2] + Math.sin(t) * Math.sin(a) * rz]; };
  for (let i = 0; i < m; i++) for (let k = 0; k < n; k++) E.quad(P(i, k), P(i, k + 1), P(i + 1, k + 1), P(i + 1, k));
}
function lathe(E, cx, by, cz, prof, n) {
  for (let j = 0; j < prof.length - 1; j++) for (let k = 0; k < n; k++) {
    const a0 = (k / n) * TAU, a1 = ((k + 1) / n) * TAU, [r0, y0] = prof[j], [r1, y1] = prof[j + 1];
    E.quad([cx + Math.cos(a0) * r0, by + y0, cz + Math.sin(a0) * r0], [cx + Math.cos(a0) * r1, by + y1, cz + Math.sin(a0) * r1], [cx + Math.cos(a1) * r1, by + y1, cz + Math.sin(a1) * r1], [cx + Math.cos(a1) * r0, by + y0, cz + Math.sin(a1) * r0]);
  }
}
// a faceted stone: a jittered ellipsoid (flat shade it); lat1 < 1 leaves the buried underside off
function rock(E, R, c, rx, ry, rz, n = 6, m = 3, jit = 0.28, lat1 = 0.62) {
  const tab = []; for (let i = 0; i <= m; i++) { const row = []; for (let k = 0; k < n; k++) row.push(1 + (R() - 0.5) * 2 * jit); tab.push(row); }
  const P = (i, k) => { const t = lat1 * (i / m) * Math.PI, a = (k / n) * TAU, j = i === 0 ? tab[0][0] : tab[i][k % n]; return [c[0] + Math.sin(t) * Math.cos(a) * rx * j, c[1] + Math.cos(t) * ry * j, c[2] + Math.sin(t) * Math.sin(a) * rz * j]; };
  for (let i = 0; i < m; i++) for (let k = 0; k < n; k++) { if (i === 0) E.tri(P(0, 0), P(1, k + 1), P(1, k)); else E.quad(P(i, k), P(i, k + 1), P(i + 1, k + 1), P(i + 1, k)); }
}
// a dressed block with knocked corners: 8 jittered corners, yaw then a tip about its long axis
function block(E, R, c, sx, sy, sz, yaw, tip = 0, jit = 0.25) {
  const cy = Math.cos(yaw), sn = Math.sin(yaw), ct = Math.cos(tip), st = Math.sin(tip), V = [];
  for (let i = 0; i < 8; i++) {
    const lx = (i & 1 ? 1 : -1) * sx * (1 + (R() - 0.5) * jit), ly0 = (i & 2 ? 1 : -1) * sy * (1 + (R() - 0.5) * jit), lz0 = (i & 4 ? 1 : -1) * sz * (1 + (R() - 0.5) * jit);
    const ly = ly0 * ct - lz0 * st, lz = ly0 * st + lz0 * ct;
    V.push([c[0] + lx * cy - lz * sn, c[1] + ly, c[2] + lx * sn + lz * cy]);
  }
  for (const f of [[0, 4, 6, 2], [1, 3, 7, 5], [0, 1, 5, 4], [2, 6, 7, 3], [0, 2, 3, 1], [4, 5, 7, 6]]) E.quad(V[f[0]], V[f[1]], V[f[2]], V[f[3]]);
}
// a low dome laid on the ground: centre h, rim dug just under the surface, radius ragged per angle
function mound(E, R, cx, cz, r, h, n = 10, rings = 2, rimY = -0.015, stretch = 1, lean = 0) {
  const rr = []; for (let k = 0; k < n; k++) rr.push(r * (0.8 + 0.34 * R()));
  const P = (j, k) => { const t = j / rings, a = ((k % n) / n) * TAU, d = rr[k % n] * t, ca = Math.cos(a); const y = j === rings ? rimY : h * (1 - t * t) * (1 + lean * ca * t) + rimY * t * t; return [cx + ca * d * stretch, y, cz + Math.sin(a) * d]; };
  const top = [cx, h, cz];
  for (let k = 0; k < n; k++) E.tri(top, P(1, k + 1), P(1, k));
  for (let j = 1; j < rings; j++) for (let k = 0; k < n; k++) E.quad(P(j, k), P(j, k + 1), P(j + 1, k + 1), P(j + 1, k));
}
// a tapered blade: up from (x, y0, z), drooping along ang by lean; segs quads and a tip
function blade(E, x, y0, z, ang, h, w, lean, segs, twist = 0.6) {
  const dx = Math.cos(ang), dz = Math.sin(ang), sa = ang + twist, sx = -Math.sin(sa), sz = Math.cos(sa);
  const pt = (t) => { const o = lean * h * t * t * 0.8; return [x + dx * o, y0 + Math.max(0.01, h * t - lean * h * 0.45 * t * t * t), z + dz * o]; };
  let p0 = pt(0), w0 = w;
  for (let i = 1; i <= segs; i++) {
    const t = i / segs, p = pt(t), ww = w * Math.pow(1 - t, 0.8);
    if (i === segs) E.tri([p0[0] + sx * w0, p0[1], p0[2] + sz * w0], p, [p0[0] - sx * w0, p0[1], p0[2] - sz * w0]);
    else E.quad([p0[0] + sx * w0, p0[1], p0[2] + sz * w0], [p[0] + sx * ww, p[1], p[2] + sz * ww], [p[0] - sx * ww, p[1], p[2] - sz * ww], [p0[0] - sx * w0, p0[1], p0[2] - sz * w0]);
    p0 = p; w0 = ww;
  }
}
// a hexagonal crystal / ice spike: prism then a pyramid tip, from base along dir
function spike(E, base, dir, len, r, sides = 6) {
  const T = norm(dir), ref = Math.abs(T[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0], N = norm(cross(ref, T)), B = cross(T, N);
  const ringAt = (p, rr) => { const o = []; for (let k = 0; k < sides; k++) { const a = (k / sides) * TAU; o.push(addv(p, addv(mul(N, Math.cos(a) * rr), mul(B, Math.sin(a) * rr)))); } return o; };
  const r0 = ringAt(base, r), r1 = ringAt(addv(base, mul(T, len * 0.72)), r * 0.92), tip = addv(base, mul(T, len));
  for (let k = 0; k < sides; k++) { const k1 = (k + 1) % sides; E.quad(r0[k], r0[k1], r1[k1], r1[k]); E.tri(r1[k], r1[k1], tip); }
}
// a flat ragged disc just above the ground (a bed, a puddle)
function disc(E, r, y, n, wob = 0.12, ph = 0) {
  const c = [0, y, 0];
  for (let i = 0; i < n; i++) { const a0 = (i / n) * TAU, a1 = ((i + 1) / n) * TAU, r0 = r * (1 + Math.sin(i * 2.3 + ph) * wob), r1 = r * (1 + Math.sin((i + 1) * 2.3 + ph) * wob); E.tri(c, [Math.cos(a1) * r1, y - 0.014, Math.sin(a1) * r1], [Math.cos(a0) * r0, y - 0.014, Math.sin(a0) * r0]); }
}

// ---------- ASH ----------
function shapeCinders(E, ctx, lod) {
  const R = () => ctx.random();
  ctx.flat(); ctx.roughness(0.95); ctx.color("oklch(0.14 0.008 40)"); disc(E, 0.72, 0.004, lod >= 3 ? 8 : 14, 0.14);
  ctx.smooth(); ctx.roughness(1);
  const drifts = lod >= 3 ? 2 : 4;
  for (let i = 0; i < drifts; i++) { const a = R() * TAU, d = R() * 0.38; ctx.color(pick(R, ["oklch(0.42 0.006 70)", "oklch(0.5 0.006 75)", "oklch(0.35 0.008 60)", "oklch(0.56 0.005 80)"])); mound(E, R, Math.cos(a) * d, Math.sin(a) * d, 0.18 + R() * 0.16, 0.03 + R() * 0.035, lod >= 3 ? 7 : 10, 2, -0.01, 1.2 + R() * 0.5); }
  ctx.flat(); ctx.roughness(0.9);
  const twigs = lod >= 3 ? 2 : 4;
  for (let i = 0; i < twigs; i++) {
    const a = R() * TAU, x0 = Math.cos(a) * 0.25, z0 = Math.sin(a) * 0.25, b = R() * TAU, L = 0.22 + R() * 0.25, pts = [];
    for (let k = 0; k <= 3; k++) pts.push([x0 + Math.cos(b) * L * k / 3 + Math.sin(k * 1.9) * 0.02, 0.018 + Math.sin(k * 1.1) * 0.012, z0 + Math.sin(b) * L * k / 3]);
    ctx.color("oklch(0.11 0.006 30)"); ctx.emissive(null);
    const F = tube(E, pts, (t) => 0.014 * (1 - t * 0.5), lod >= 2 ? 4 : 5);
    if (lod <= 2) { const p = F[1].P, bb = b + 0.8; tube(E, [p, [p[0] + Math.cos(bb) * 0.11, 0.02, p[2] + Math.sin(bb) * 0.11]], (t) => 0.008 * (1 - t * 0.5), 3); }
    if (i % 2 === 0) { ctx.color("oklch(0.32 0.1 40)"); ctx.emissive(0.32, 0.07, 0.015); blob(E, pts[3], 0.012, 0.01, 0.012, 5, 3); }
  }
  if (lod <= 2) { // ember chips and pale ash flakes on the bed
    for (let i = 0; i < (lod <= 1 ? 12 : 6); i++) {
      const a = R() * TAU, d = R() * 0.6, x = Math.cos(a) * d, z = Math.sin(a) * d, s = 0.012 + R() * 0.02, ember = i < 4;
      ctx.color(ember ? "oklch(0.3 0.1 38)" : "oklch(0.62 0.004 80)"); ember ? ctx.emissive(0.26, 0.055, 0.012) : ctx.emissive(null);
      E.tri([x, 0.008, z], [x + s, 0.008, z + s * 0.4], [x + s * 0.2, 0.008, z + s]);
    }
  }
  ctx.emissive(null);
}
function shapeRubble(E, ctx, lod) {
  const R = () => ctx.random();
  ctx.flat(); ctx.roughness(0.95); ctx.color("oklch(0.19 0.008 60)"); disc(E, 0.75, 0.004, lod >= 3 ? 8 : 12, 0.16);
  ctx.roughness(0.6);
  const n = lod >= 3 ? 3 : 6, STONE = ["oklch(0.38 0.012 70)", "oklch(0.44 0.014 75)", "oklch(0.33 0.01 60)", "oklch(0.48 0.016 78)"];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + R() * 0.6, d = i === 0 ? 0.05 : 0.2 + R() * 0.38, s = i === 0 ? 1 : 0.5 + R() * 0.5;
    const sx = 0.16 * s + R() * 0.06, sy = 0.07 * s + R() * 0.04, sz = 0.11 * s + R() * 0.04;
    ctx.color(pick(R, STONE)); block(E, R, [Math.cos(a) * d, sy * 0.7, Math.sin(a) * d], sx, sy, sz, R() * TAU, (R() - 0.5) * 0.5, 0.35);
  }
  // the carved fragment: a broken run of cornice moulding lying on its back
  const prof = [[0, 0], [0.17, 0], [0.17, 0.04], [0.14, 0.06], [0.15, 0.09], [0.11, 0.12], [0.11, 0.16], [0, 0.16]];
  const yaw = R() * TAU, cy = Math.cos(yaw), sn = Math.sin(yaw), L = 0.24 + R() * 0.12, ox = (R() - 0.5) * 0.4, oz = (R() - 0.5) * 0.4;
  const W = (x, u, v) => { const lz = u - 0.08, ly = v; return [ox + x * cy - lz * sn, ly - 0.01, oz + x * sn + lz * cy]; };
  const xe = prof.map(() => [-L - R() * 0.06, L + R() * 0.06]);
  ctx.color("oklch(0.52 0.018 78)"); ctx.roughness(0.7);
  for (let i = 0; i < prof.length; i++) { const j = (i + 1) % prof.length, [u0, v0] = prof[i], [u1, v1] = prof[j]; E.quad(W(xe[i][0], u0, v0), W(xe[i][1], u0, v0), W(xe[j][1], u1, v1), W(xe[j][0], u1, v1)); }
  ctx.color("oklch(0.6 0.02 80)"); // the fresh broken ends
  for (let i = 1; i < prof.length - 1; i++) { E.tri(W(xe[0][0], ...prof[0]), W(xe[i][0], ...prof[i]), W(xe[i + 1][0], ...prof[i + 1])); E.tri(W(xe[0][1], ...prof[0]), W(xe[i + 1][1], ...prof[i + 1]), W(xe[i][1], ...prof[i])); }
  if (lod <= 2) { ctx.color("oklch(0.4 0.012 70)"); for (let i = 0; i < (lod <= 1 ? 10 : 5); i++) { const a = R() * TAU, d = 0.3 + R() * 0.4, s = 0.025 + R() * 0.03; rock(E, R, [Math.cos(a) * d, 0, Math.sin(a) * d], s, s * 0.7, s, 4, 2, 0.3, 0.55); } }
}
function shapeCandles(E, ctx, lod) {
  const R = () => ctx.random(), sides = lod >= 3 ? 5 : 7;
  ctx.smooth(); ctx.roughness(0.35); ctx.color("oklch(0.74 0.045 82)"); // the old wax puddle, lobed, with a soot rim under it
  ctx.flat(); ctx.roughness(1); ctx.color("oklch(0.13 0.006 40)"); disc(E, 0.46, 0.003, lod >= 3 ? 8 : 12, 0.2, 1);
  ctx.smooth(); ctx.roughness(0.3); ctx.color("oklch(0.76 0.045 82)"); mound(E, R, 0, 0, 0.32, 0.016, lod >= 3 ? 8 : 14, 2, 0.002, 1.25);
  const n = lod >= 3 ? 3 : lod === 2 ? 5 : 7, WAX = ["oklch(0.9 0.035 85)", "oklch(0.84 0.05 82)", "oklch(0.78 0.06 78)", "oklch(0.92 0.025 88)"];
  for (let i = 0; i < n; i++) {
    const a = R() * TAU, d = i === 0 ? 0 : 0.08 + R() * 0.2, x = Math.cos(a) * d * 1.2, z = Math.sin(a) * d;
    const r = 0.02 + R() * 0.02, h = 0.04 + R() * (i === 0 ? 0.2 : 0.13), lit = R() < 0.4;
    ctx.color(pick(R, WAX)); ctx.roughness(0.4);
    lathe(E, x, 0, z, [[r * 1.6, 0], [r * 1.15, 0.012], [r, 0.03], [r * 0.98, h * 0.85], [r * 0.82, h], [r * 0.25, h * 0.94]], sides);
    if (lod <= 1) { // one drip run down the side
      const b = R() * TAU, cb = Math.cos(b), sb = Math.sin(b), w = r * 0.35;
      E.quad([x + cb * r * 1.02 - sb * w, h * 0.95, z + sb * r * 1.02 + cb * w], [x + cb * r * 1.02 + sb * w, h * 0.95, z + sb * r * 1.02 - cb * w], [x + cb * r * 1.3 + sb * w * 0.6, 0.01, z + sb * r * 1.3 - cb * w * 0.6], [x + cb * r * 1.3 - sb * w * 0.6, 0.01, z + sb * r * 1.3 + cb * w * 0.6]);
    }
    ctx.color("oklch(0.12 0.01 40)"); E.tri([x - 0.003, h * 0.94, z], [x + 0.003, h * 0.94, z], [x, h + 0.018, z]);
    if (lit && lod <= 2) { ctx.color("oklch(0.85 0.12 72)"); ctx.emissive(0.34, 0.16, 0.04); lathe(E, x, h + 0.012, z, [[0.001, 0], [0.008, 0.012], [0.005, 0.026], [0.0005, 0.04]], 5); ctx.emissive(null); }
  }
  if (lod <= 2) { ctx.color(WAX[1]); ctx.roughness(0.45); const a = R() * TAU; tube(E, [[Math.cos(a) * 0.3, 0.022, Math.sin(a) * 0.3], [Math.cos(a) * 0.3 + Math.cos(a + 1.4) * 0.12, 0.022, Math.sin(a) * 0.3 + Math.sin(a + 1.4) * 0.12]], () => 0.02, sides); }
}
function shapeDeadgrass(E, ctx, lod) {
  const R = () => ctx.random(), n = lod >= 3 ? 9 : lod === 2 ? 15 : 24, segs = lod >= 3 ? 2 : 3;
  const TAN = ["oklch(0.6 0.07 76)", "oklch(0.52 0.06 70)", "oklch(0.45 0.05 62)", "oklch(0.66 0.06 82)", "oklch(0.38 0.04 58)"];
  ctx.flat(); ctx.roughness(1); ctx.color("oklch(0.24 0.02 60)"); mound(E, R, 0, 0, 0.13, 0.03, 6, 1, -0.01);
  ctx.roughness(0.9);
  for (let i = 0; i < n; i++) {
    const a = R() * TAU, d = Math.sqrt(R()) * 0.1, h = 0.18 + R() * 0.27, broken = R() < 0.18;
    ctx.color(pick(R, TAN));
    blade(E, Math.cos(a) * d, 0.0, Math.sin(a) * d, a + (R() - 0.5) * 0.6, broken ? h * 0.7 : h, 0.014 + R() * 0.008, broken ? 2.2 : 0.3 + R() * 0.6, segs);
  }
  if (lod <= 1) for (let i = 0; i < 3; i++) { // seed heads on bare stems
    const a = R() * TAU, h = 0.36 + R() * 0.12, x = Math.cos(a) * 0.05, z = Math.sin(a) * 0.05, lx = Math.cos(a) * 0.06, lz = Math.sin(a) * 0.06;
    ctx.color("oklch(0.55 0.05 72)"); tube(E, [[x, 0, z], [x + lx * 0.5, h * 0.6, z + lz * 0.5], [x + lx, h, z + lz]], () => 0.004, 3);
    ctx.color("oklch(0.7 0.06 80)"); blob(E, [x + lx * 1.1, h + 0.025, z + lz * 1.1], 0.01, 0.03, 0.01, 4, 3);
  }
}
// bones in a bed: shared by ash bones, frostbones, cavebones
function bonesCore(E, ctx, lod, o) {
  const R = () => ctx.random(), seg = lod >= 3 ? 4 : 6;
  ctx.smooth(); ctx.roughness(1); ctx.color(o.bed);
  blob(E, [0, -0.06, 0], 0.85, 0.09, 0.55, lod >= 3 ? 7 : 10, 3, 0, 0.5);
  ctx.color(o.bone); ctx.roughness(0.6);
  const spine = []; for (let i = 0; i <= 5; i++) spine.push([-0.42 + i * 0.1, 0.045 + Math.sin(i / 5 * Math.PI) * 0.03, 0]);
  tube(E, spine, () => 0.02, seg);
  for (let i = 1; i <= (lod >= 3 ? 3 : 5); i++) {
    const sx = -0.42 + i * 0.09, sz = 0.15 + Math.sin(i / 5 * Math.PI) * 0.06;
    for (const side of [-1, 1]) {
      const pts = [];
      for (let k = 0; k <= 4; k++) { const th = (k / 4) * Math.PI * 0.85, flat = side < 0 ? 0.25 : 1; pts.push([sx + k * 0.012, 0.045 + Math.sin(th) * 0.16 * flat, side * (1 - Math.cos(th)) * sz * (side < 0 ? 1.3 : 1)]); }
      tube(E, pts, (t) => 0.011 * (1 - t * 0.4), lod >= 2 ? 3 : 4);
    }
  }
  blob(E, [0.42, 0.0, 0.12], 0.1, 0.09, 0.12, lod >= 3 ? 6 : 9, lod >= 3 ? 4 : 6);
  blob(E, [0.42, 0.0, 0.0], 0.065, 0.05, 0.06, 6, 4);
  ctx.color("oklch(0.1 0.01 40)");
  blob(E, [0.39, 0.035, 0.015], 0.024, 0.022, 0.02, 5, 3); blob(E, [0.46, 0.035, 0.015], 0.024, 0.022, 0.02, 5, 3);
  ctx.color(o.bone); tube(E, [[0.55, 0.012, -0.12], [0.62, 0.015, -0.05], [0.6, 0.012, 0.03]], () => 0.013, 4);
  for (let i = 0; i < (lod >= 3 ? 2 : 3); i++) {
    const a = R() * TAU, c = [-0.2 + R() * 0.5, 0.02, -0.33 + R() * 0.2 + (i === 2 ? 0.58 : 0)], L = 0.2 + R() * 0.15;
    const p0 = [c[0] - Math.cos(a) * L, 0.02, c[2] - Math.sin(a) * L], p1 = [c[0] + Math.cos(a) * L, 0.025, c[2] + Math.sin(a) * L];
    tube(E, [p0, c, p1], (t) => 0.017 - Math.sin(t * Math.PI) * 0.005, seg);
    blob(E, p0, 0.03, 0.026, 0.03, 6, 3); blob(E, p1, 0.027, 0.024, 0.027, 6, 3);
  }
  if (o.extra) o.extra(R);
}
const shapeBones = (E, ctx, lod) => bonesCore(E, ctx, lod, { bed: "oklch(0.22 0.008 50)", bone: "oklch(0.8 0.03 85)" });

// ---------- FEN ----------
function shapeReeds(E, ctx, lod) {
  const R = () => ctx.random(), n = lod >= 3 ? 7 : lod === 2 ? 11 : 16, segs = lod >= 3 ? 2 : 4;
  const LEAFC = ["oklch(0.36 0.07 118)", "oklch(0.3 0.06 128)", "oklch(0.42 0.07 100)", "oklch(0.5 0.06 85)", "oklch(0.26 0.05 135)"];
  ctx.smooth(); ctx.roughness(0.4); ctx.color("oklch(0.16 0.02 90)"); mound(E, R, 0, 0, 0.32, 0.05, 8, 2, -0.015);
  ctx.flat(); ctx.roughness(0.7);
  for (let i = 0; i < n; i++) {
    const a = R() * TAU, d = Math.sqrt(R()) * 0.2, h = 0.55 + R() * 0.6;
    ctx.color(pick(R, LEAFC)); blade(E, Math.cos(a) * d, 0, Math.sin(a) * d, a, h, 0.03 + R() * 0.012, 0.25 + R() * 0.7, segs, 0.4);
  }
  for (let i = 0; i < (lod >= 3 ? 2 : 5); i++) {
    const a = R() * TAU, d = R() * 0.13, x = Math.cos(a) * d, z = Math.sin(a) * d, h = 0.95 + R() * 0.28, lx = Math.cos(a) * 0.08, lz = Math.sin(a) * 0.08;
    ctx.color("oklch(0.38 0.06 110)"); tube(E, [[x, 0, z], [x + lx * 0.4, h * 0.6, z + lz * 0.4], [x + lx, h, z + lz]], (t) => 0.007 * (1 - t * 0.3), 3);
    ctx.color("oklch(0.27 0.05 48)"); ctx.roughness(0.95);
    const top = [x + lx, h, z + lz]; lathe(E, top[0], top[1] - 0.15, top[2], [[0.012, 0], [0.026, 0.02], [0.027, 0.12], [0.014, 0.15]], lod >= 2 ? 4 : 6);
    ctx.color("oklch(0.45 0.04 80)"); tube(E, [top, [top[0] + lx * 0.1, top[1] + 0.08, top[2] + lz * 0.1]], () => 0.003, 3); ctx.roughness(0.7);
  }
}
function shapeLily(E, ctx, lod) {
  const R = () => ctx.random(), pads = lod >= 3 ? 3 : lod === 2 ? 5 : 7, seg = lod >= 3 ? 6 : 10;
  ctx.flat(); ctx.roughness(0.08); ctx.color("oklch(0.12 0.02 220)"); disc(E, 0.55, 0.003, lod >= 3 ? 8 : 14, 0.15, 2); // dark water / wet mud
  ctx.roughness(0.45);
  const PAD = ["oklch(0.34 0.07 145)", "oklch(0.28 0.06 152)", "oklch(0.4 0.08 132)", "oklch(0.3 0.05 120)"];
  const placed = [];
  for (let i = 0; i < pads; i++) {
    const a = R() * TAU, d = i === 0 ? 0.05 : 0.15 + R() * 0.3, x = Math.cos(a) * d, z = Math.sin(a) * d, r = 0.07 + R() * 0.09, notch = R() * TAU, y = 0.008 + i * 0.0015;
    placed.push([x, z, r]);
    ctx.color(pick(R, PAD));
    for (let k = 0; k < seg; k++) {
      const a0 = notch + 0.35 + (k / seg) * (TAU - 0.5), a1 = notch + 0.35 + ((k + 1) / seg) * (TAU - 0.5);
      E.tri([x, y, z], [x + Math.cos(a1) * r, y + 0.008, z + Math.sin(a1) * r], [x + Math.cos(a0) * r, y + 0.008, z + Math.sin(a0) * r]);
    }
    if (lod <= 1) { ctx.color("oklch(0.5 0.08 128)"); const b = notch + Math.PI; E.tri([x + Math.cos(b + 0.06) * r * 0.1, y + 0.002, z + Math.sin(b + 0.06) * r * 0.1], [x + Math.cos(b) * r * 0.9, y + 0.009, z + Math.sin(b) * r * 0.9], [x + Math.cos(b - 0.06) * r * 0.1, y + 0.002, z + Math.sin(b - 0.06) * r * 0.1]); }
  }
  for (let f = 0; f < (lod >= 3 ? 1 : 2); f++) { // a pale flower on a pad: two whorls of cupped petals and a gold heart
    const [x, z, r] = placed[f * 2 % placed.length], y = 0.02, pet = lod >= 3 ? 5 : 8;
    for (const [whorl, len, lift, col] of [[0, 0.06, 0.03, "oklch(0.9 0.03 20)"], [0.4, 0.045, 0.05, "oklch(0.94 0.02 60)"]]) {
      ctx.color(col);
      for (let k = 0; k < pet; k++) { const a = (k / pet) * TAU + whorl, w = 0.4, ca = Math.cos(a), sa = Math.sin(a); E.quad([x, y, z], [x + Math.cos(a - w) * len * 0.5, y + lift * 0.4, z + Math.sin(a - w) * len * 0.5], [x + ca * len, y + lift, z + sa * len], [x + Math.cos(a + w) * len * 0.5, y + lift * 0.4, z + Math.sin(a + w) * len * 0.5]); }
    }
    ctx.color("oklch(0.72 0.12 85)"); blob(E, [x, y + 0.012, z], 0.014, 0.01, 0.014, 5, 3);
  }
}
function shapeMossmound(E, ctx, lod) {
  const R = () => ctx.random(), humps = lod >= 3 ? 2 : 4, n = lod >= 3 ? 7 : 11, m = lod >= 3 ? 2 : 4;
  ctx.flat(); ctx.roughness(1); ctx.color("oklch(0.13 0.02 120)"); disc(E, 0.62, 0.003, lod >= 3 ? 8 : 12, 0.15, 3);
  ctx.smooth(); ctx.roughness(0.95);
  const MOSS = ["oklch(0.24 0.05 140)", "oklch(0.2 0.04 150)", "oklch(0.28 0.06 128)", "oklch(0.18 0.03 135)"], tops = [];
  for (let i = 0; i < humps; i++) {
    const a = R() * TAU, d = i === 0 ? 0 : 0.18 + R() * 0.22, x = Math.cos(a) * d, z = Math.sin(a) * d, rx = 0.18 + R() * 0.2, ry = 0.07 + R() * 0.1;
    ctx.color(pick(R, MOSS)); blob(E, [x, -0.02, z], rx, ry, rx * (0.75 + R() * 0.4), n, m, 0, 0.5);
    tops.push([x, ry - 0.02, z, rx]);
  }
  if (lod <= 2) { ctx.flat(); ctx.color("oklch(0.42 0.09 128)"); ctx.roughness(0.8); // sprigs of fresh moss on the crowns
    for (let i = 0; i < (lod <= 1 ? 18 : 8); i++) { const t = tops[i % tops.length], a = R() * TAU, d = R() * t[3] * 0.6, x = t[0] + Math.cos(a) * d, z = t[2] + Math.sin(a) * d, y = t[1] * (1 - (d / t[3]) ** 2) - 0.004, h = 0.03 + R() * 0.03;
      E.tri([x - 0.012, y, z], [x + 0.012, y, z + 0.006], [x + (R() - 0.5) * 0.02, y + h, z]); }
  }
}
function shapeDriftwood(E, ctx, lod) {
  const R = () => ctx.random(), sides = lod >= 3 ? 5 : 7, st = lod >= 3 ? 3 : 6;
  ctx.flat(); ctx.roughness(0.9); ctx.color("oklch(0.15 0.02 90)"); disc(E, 0.6, 0.003, 10, 0.25, 4);
  const L = 0.6 + R() * 0.25, ph = R() * 6, pts = [];
  for (let i = 0; i <= st; i++) { const t = i / st; pts.push([-L + t * 2 * L, 0.05 + Math.sin(t * 5 + ph) * 0.015, Math.sin(t * 3 + ph) * 0.07]); }
  ctx.color("oklch(0.52 0.014 70)");
  const F = tube(E, pts, (t) => 0.075 * (1 - t * 0.45) * (1 + Math.sin(t * 17) * 0.06), sides);
  ctx.color("oklch(0.38 0.03 60)"); // end grain
  for (const [f, s] of [[F[0], -1], [F[F.length - 1], 1]]) { const c = f.P; for (let k = 0; k < sides; k++) { const a0 = (k / sides) * TAU, a1 = ((k + 1) / sides) * TAU; E.tri(c, addv(c, addv(mul(f.N, Math.cos(a0) * f.r), mul(f.B, Math.sin(a0) * f.r))), addv(c, addv(mul(f.N, Math.cos(a1) * f.r), mul(f.B, Math.sin(a1) * f.r)))); } }
  ctx.color("oklch(0.48 0.016 70)");
  for (let b = 0; b < (lod >= 3 ? 1 : 3); b++) { const f = F[1 + b * 2 >= F.length - 1 ? 1 : 1 + b], side = b % 2 ? 1 : -1, len = 0.18 + R() * 0.2, q = [f.P, [f.P[0] + len * 0.5, 0.06 + R() * 0.06, f.P[2] + side * len]]; tube(E, q, (t) => 0.03 * (1 - t * 0.6), 4); }
  if (lod <= 1) { ctx.color("oklch(0.44 0.015 68)"); const a = R() * TAU; tube(E, [[Math.cos(a) * 0.4, 0.015, 0.25], [Math.cos(a) * 0.4 + 0.25, 0.02, 0.32]], () => 0.012, 4); }
}

// ---------- FROST ----------
const SNOW = ["oklch(0.9 0.018 240)", "oklch(0.86 0.022 235)", "oklch(0.93 0.012 245)"];
function shapeSnowdrift(E, ctx, lod) {
  const R = () => ctx.random(), n = lod >= 3 ? 8 : 14, rings = lod >= 3 ? 2 : 4;
  ctx.smooth(); ctx.roughness(0.85);
  ctx.color(SNOW[0]); mound(E, R, 0, 0, 0.85, 0.16 + R() * 0.06, n, rings, -0.02, 1.35, 0.45);
  ctx.color(pick(R, SNOW)); mound(E, R, 0.35 + R() * 0.2, (R() - 0.5) * 0.4, 0.42, 0.11, lod >= 3 ? 7 : 11, rings, -0.02, 1.3, 0.4);
  if (lod <= 2) { ctx.color(SNOW[1]); mound(E, R, -0.5, (R() - 0.5) * 0.5, 0.3, 0.07, 9, 2, -0.02, 1.2, 0.3); }
  ctx.flat(); ctx.roughness(0.7);
  for (let i = 0; i < (lod >= 3 ? 1 : 3); i++) { const a = R() * TAU, d = 0.55 + R() * 0.35; ctx.color(pick(R, ["oklch(0.24 0.01 250)", "oklch(0.3 0.012 245)"])); rock(E, R, [Math.cos(a) * d * 1.3, 0, Math.sin(a) * d], 0.07 + R() * 0.07, 0.06 + R() * 0.05, 0.07 + R() * 0.06, 5, 2, 0.3, 0.55); }
  if (lod <= 1) { ctx.color("oklch(0.18 0.012 40)"); const a = R() * TAU; tube(E, [[Math.cos(a) * 0.3, 0.12, Math.sin(a) * 0.2], [Math.cos(a) * 0.3 + 0.05, 0.3, Math.sin(a) * 0.2 + 0.03], [Math.cos(a) * 0.3 + 0.12, 0.38, Math.sin(a) * 0.2]], (t) => 0.008 * (1 - t * 0.6), 3); }
}
function shapeFrozengrass(E, ctx, lod) {
  const R = () => ctx.random(), n = lod >= 3 ? 9 : lod === 2 ? 15 : 22, segs = lod >= 3 ? 1 : 2;
  const ICEG = ["oklch(0.82 0.03 225)", "oklch(0.72 0.04 218)", "oklch(0.9 0.018 235)", "oklch(0.62 0.04 210)"];
  ctx.smooth(); ctx.roughness(0.85); ctx.color(SNOW[1]); mound(E, R, 0, 0, 0.2, 0.04, 7, 1, -0.012, 1.2);
  ctx.flat(); ctx.roughness(0.35);
  for (let i = 0; i < n; i++) { const a = R() * TAU, d = Math.sqrt(R()) * 0.13, h = 0.16 + R() * 0.24; ctx.color(pick(R, ICEG)); blade(E, Math.cos(a) * d, 0.01, Math.sin(a) * d, a, h, 0.012 + R() * 0.006, 0.1 + R() * 0.25, segs, 0.8); }
  if (lod <= 1) { ctx.color("oklch(0.95 0.01 240)"); for (let i = 0; i < 5; i++) { const a = R() * TAU, d = 0.05 + R() * 0.12; blob(E, [Math.cos(a) * d, 0.03 + R() * 0.05, Math.sin(a) * d], 0.02, 0.012, 0.02, 4, 2); } }
}
function shapeIceshard(E, ctx, lod) {
  const R = () => ctx.random(), n = lod >= 3 ? 3 : lod === 2 ? 5 : 7;
  ctx.smooth(); ctx.roughness(0.85); ctx.color(SNOW[0]); mound(E, R, 0, 0, 0.35, 0.07, 9, 2, -0.015, 1.15);
  ctx.flat(); ctx.roughness(0.12); ctx.metalness(0.1);
  for (let i = 0; i < n; i++) {
    const a = R() * TAU, d = i === 0 ? 0 : 0.06 + R() * 0.16, lean = i === 0 ? 0.12 : 0.3 + R() * 0.45, len = i === 0 ? 0.62 + R() * 0.2 : 0.2 + R() * 0.38;
    ctx.color(pick(R, ["oklch(0.78 0.08 205)", "oklch(0.68 0.09 210)", "oklch(0.86 0.05 215)"])); ctx.emissive(0.018, 0.055, 0.065);
    spike(E, [Math.cos(a) * d, -0.03, Math.sin(a) * d], [Math.cos(a) * lean, 1, Math.sin(a) * lean], len, 0.035 + len * 0.07, lod >= 3 ? 4 : 6);
  }
  ctx.emissive(null); ctx.metalness(0);
}
const shapeFrostbones = (E, ctx, lod) => bonesCore(E, ctx, lod, { bed: SNOW[1], bone: "oklch(0.8 0.02 225)", extra: (R) => {
  if (lod >= 3) return; ctx.smooth(); ctx.color(SNOW[2]); ctx.roughness(0.85);
  blob(E, [0.42, 0.075, 0.12], 0.075, 0.03, 0.09, 6, 2, 0, 0.5); mound(E, R, -0.15, 0.1, 0.3, 0.07, 9, 2, -0.01, 1.4); mound(E, R, 0.2, -0.3, 0.22, 0.05, 8, 2, -0.01, 1.3);
} });

// ---------- DEEP ----------
function shapeGlowcap(E, ctx, lod) {
  const R = () => ctx.random(), caps = lod >= 3 ? 4 : lod === 2 ? 6 : 9, cs = lod >= 3 ? 6 : 9;
  ctx.flat(); ctx.roughness(0.9); ctx.color("oklch(0.15 0.01 250)"); disc(E, 0.5, 0.003, 10, 0.18, 5);
  ctx.color("oklch(0.24 0.012 255)"); rock(E, R, [-0.15, 0, 0.1], 0.16, 0.1, 0.13, 6, 3, 0.25, 0.55);
  if (lod <= 2) rock(E, R, [0.22, 0, -0.15], 0.1, 0.07, 0.09, 5, 2, 0.25, 0.55);
  ctx.smooth();
  for (let i = 0; i < caps; i++) {
    const a = R() * TAU, d = 0.05 + R() * 0.3, x = Math.cos(a) * d, z = Math.sin(a) * d, h = 0.05 + R() * (i < 2 ? 0.26 : 0.14), r = 0.025 + h * 0.3 + R() * 0.02, lean = (R() - 0.5) * 0.04;
    ctx.emissive(null); ctx.color("oklch(0.72 0.02 230)"); ctx.roughness(0.8);
    lathe(E, x, -0.01, z, [[r * 0.35, 0], [r * 0.25, h * 0.5], [r * 0.22, h]], lod >= 2 ? 5 : 6);
    ctx.color(pick(R, ["oklch(0.36 0.04 250)", "oklch(0.42 0.05 235)", "oklch(0.3 0.03 260)"])); ctx.roughness(0.5);
    lathe(E, x + lean, h - 0.008, z, [[r, 0], [r * 0.95, r * 0.25], [r * 0.7, r * 0.5], [r * 0.3, r * 0.62], [0.001, r * 0.64]], cs);
    ctx.color("oklch(0.55 0.08 200)"); ctx.emissive(0.03, 0.17, 0.2); // gills
    lathe(E, x + lean, h - 0.01, z, [[r * 0.25, 0.006], [r * 0.98, 0.001]], cs);
    if (lod <= 2) { ctx.emissive(0.02, 0.11, 0.13); for (let s = 0; s < 3; s++) { const b = R() * TAU, q = r * (0.3 + R() * 0.4), sx = x + lean + Math.cos(b) * q, sz = z + Math.sin(b) * q, sy = h - 0.008 + r * 0.64 * (1 - (q / r) ** 2) + 0.004, w = r * 0.12; E.tri([sx - w, sy, sz], [sx + w, sy, sz + w * 0.4], [sx, sy, sz - w]); } }
  }
  ctx.emissive(null);
}
function shapeCrystal(E, ctx, lod) {
  const R = () => ctx.random(), n = lod >= 3 ? 3 : lod === 2 ? 5 : 7, violet = R() < 0.55;
  ctx.flat(); ctx.roughness(0.85); ctx.color("oklch(0.15 0.01 260)"); disc(E, 0.42, 0.003, 9, 0.2, 6);
  ctx.color("oklch(0.25 0.015 265)"); rock(E, R, [0, 0, 0], 0.22, 0.12, 0.18, 6, 3, 0.25, 0.55);
  ctx.roughness(0.15); ctx.metalness(0.05);
  for (let i = 0; i < n; i++) {
    const a = R() * TAU, d = i === 0 ? 0 : 0.05 + R() * 0.14, lean = i === 0 ? 0.1 : 0.35 + R() * 0.5, len = i === 0 ? 0.42 + R() * 0.12 : 0.14 + R() * 0.26;
    const v = R() < 0.8 ? violet : !violet;
    if (v) { ctx.color(pick(R, ["oklch(0.45 0.14 300)", "oklch(0.55 0.13 305)", "oklch(0.38 0.12 295)"])); ctx.emissive(0.03, 0.008, 0.055); }
    else { ctx.color(pick(R, ["oklch(0.68 0.09 200)", "oklch(0.6 0.1 205)"])); ctx.emissive(0.01, 0.04, 0.05); }
    spike(E, [Math.cos(a) * d, 0.05, Math.sin(a) * d], [Math.cos(a) * lean, 1, Math.sin(a) * lean], len, 0.025 + len * 0.09, lod >= 3 ? 4 : 6);
  }
  ctx.emissive(null); ctx.metalness(0);
}
function shapeCavegravel(E, ctx, lod) {
  const R = () => ctx.random();
  ctx.flat(); ctx.roughness(0.95); ctx.color("oklch(0.16 0.008 250)"); disc(E, 0.75, 0.004, lod >= 3 ? 8 : 14, 0.15, 7);
  ctx.color("oklch(0.21 0.01 250)"); mound(E, R, 0.1, -0.05, 0.45, 0.04, 9, 1, -0.01, 1.3);
  ctx.roughness(0.75);
  const STONE = ["oklch(0.32 0.01 250)", "oklch(0.38 0.012 245)", "oklch(0.27 0.01 255)", "oklch(0.42 0.01 240)"];
  for (let i = 0; i < (lod >= 3 ? 3 : 5); i++) { const a = R() * TAU, d = R() * 0.45, s = 0.07 + R() * 0.1; ctx.color(pick(R, STONE)); rock(E, R, [Math.cos(a) * d, 0, Math.sin(a) * d], s, s * (0.6 + R() * 0.4), s * (0.7 + R() * 0.5), 6, 3, 0.3, 0.6); }
  if (lod <= 2) for (let i = 0; i < (lod <= 1 ? 20 : 10); i++) { const a = R() * TAU, d = 0.15 + R() * 0.58, s = 0.018 + R() * 0.025; ctx.color(pick(R, STONE)); rock(E, R, [Math.cos(a) * d, 0, Math.sin(a) * d], s, s * 0.7, s, 4, 2, 0.3, 0.55); }
}
const shapeCavebones = (E, ctx, lod) => bonesCore(E, ctx, lod, { bed: "oklch(0.17 0.008 250)", bone: "oklch(0.72 0.04 80)", extra: (R) => {
  ctx.flat(); ctx.color("oklch(0.34 0.01 250)"); ctx.roughness(0.8);
  for (let i = 0; i < (lod >= 3 ? 3 : 8); i++) { const a = R() * TAU, d = 0.3 + R() * 0.4, s = 0.02 + R() * 0.03; rock(E, R, [Math.cos(a) * d * 1.2, 0, Math.sin(a) * d * 0.7], s, s * 0.7, s, 4, 2, 0.3, 0.55); }
  if (lod >= 3) return; ctx.roughness(0.15); ctx.color("oklch(0.66 0.09 200)"); ctx.emissive(0.02, 0.08, 0.1);
  spike(E, [-0.55, -0.02, 0.2], [0.3, 1, 0.1], 0.18, 0.025, 5); spike(E, [-0.6, -0.02, 0.12], [-0.4, 1, -0.2], 0.12, 0.02, 5); ctx.emissive(null);
} });

// ---------- the registry: biome → kinds, and per-kind placement ----------
const BIOMES = { ash: ["cinders", "rubble", "candles", "deadgrass", "bones"], fen: ["reeds", "lily", "mossmound", "driftwood"], frost: ["snowdrift", "frozengrass", "iceshard", "frostbones"], deep: ["glowcap", "crystal", "cavegravel", "cavebones"] };
const SHAPES = { cinders: shapeCinders, rubble: shapeRubble, candles: shapeCandles, deadgrass: shapeDeadgrass, bones: shapeBones, reeds: shapeReeds, lily: shapeLily, mossmound: shapeMossmound, driftwood: shapeDriftwood, snowdrift: shapeSnowdrift, frozengrass: shapeFrozengrass, iceshard: shapeIceshard, frostbones: shapeFrostbones, glowcap: shapeGlowcap, crystal: shapeCrystal, cavegravel: shapeCavegravel, cavebones: shapeCavebones };
const SMALL = { candles: 1, deadgrass: 1, lily: 1, frozengrass: 1, glowcap: 1, bones: 1, frostbones: 1, cavebones: 1 };
const BED = { cinders: 1, cavegravel: 1, snowdrift: 1, mossmound: 1 }; // bed kinds may lie in pack spots and arenas
const FLAT = { cinders: 1, bones: 1, lily: 1, snowdrift: 1, frostbones: 1, cavebones: 1, cavegravel: 1, rubble: 1 }; // split the slope instead of sitting on its low side
const OUT_ONLY = { reeds: 1, iceshard: 1 };
// foot = footprint radius at scale 1 (m); tol = rim spread allowed before it shrinks or skips
const SET = {
  cinders: { s: [0.8, 1.3], sink: 0, minN: 0.6, tint: 0.16, foot: 0.72, tol: 0.06 },
  rubble: { s: [0.7, 1.25], sink: 0.02, minN: 0.6, tint: 0.14, foot: 0.7, tol: 0.12 },
  candles: { s: [0.8, 1.2], sink: 0, minN: 0.8, tint: 0.08, foot: 0.45, tol: 0.04 },
  deadgrass: { s: [0.8, 1.25], sink: 0.01, minN: 0.5, tint: 0.2, foot: 0.25, tol: 0.12 },
  bones: { s: [0.85, 1.15], sink: 0.02, minN: 0.75, tint: 0.08, foot: 0.55, tol: 0.05 },
  reeds: { s: [0.8, 1.0], sink: 0.02, minN: 0.5, tint: 0.16, foot: 0.35, tol: 0.25 },
  lily: { s: [0.8, 1.3], sink: 0, minN: 0.85, tint: 0.14, foot: 0.55, tol: 0.04 },
  mossmound: { s: [0.75, 1.3], sink: 0.02, minN: 0.55, tint: 0.16, foot: 0.6, tol: 0.15 },
  driftwood: { s: [0.75, 1.2], sink: 0.02, minN: 0.65, tint: 0.12, foot: 0.7, tol: 0.1 },
  snowdrift: { s: [0.8, 1.4], sink: 0.02, minN: 0.55, tint: 0.06, foot: 0.95, tol: 0.15 },
  frozengrass: { s: [0.8, 1.25], sink: 0.01, minN: 0.5, tint: 0.12, foot: 0.25, tol: 0.12 },
  iceshard: { s: [0.7, 1.1], sink: 0.03, minN: 0.5, tint: 0.1, foot: 0.35, tol: 0.2 },
  frostbones: { s: [0.85, 1.15], sink: 0.02, minN: 0.75, tint: 0.06, foot: 0.55, tol: 0.05 },
  glowcap: { s: [0.8, 1.3], sink: 0, minN: 0.6, tint: 0.12, foot: 0.45, tol: 0.08 },
  crystal: { s: [0.75, 1.2], sink: 0.03, minN: 0.55, tint: 0.1, foot: 0.4, tol: 0.15 },
  cavegravel: { s: [0.8, 1.3], sink: 0, minN: 0.6, tint: 0.14, foot: 0.75, tol: 0.08 },
  cavebones: { s: [0.85, 1.15], sink: 0.02, minN: 0.75, tint: 0.08, foot: 0.55, tol: 0.05 },
};
function rim(ctx, x, z, r) {
  let lo = Infinity, hi = -Infinity;
  for (let k = 0; k < 6; k++) { const a = k * 1.0472, g = ctx.groundY(x + Math.cos(a) * r, z + Math.sin(a) * r); lo = Math.min(lo, g); hi = Math.max(hi, g); }
  const c = ctx.groundY(x, z); return { lo: Math.min(lo, c), hi: Math.max(hi, c), c };
}
// every enemy pack spot in places/main/sim.js PACKS: tall cover drops to knee height within KNEE_R
const PACK_SPOTS = [[-1, -21], [3, -23], [0, -29], [3, -31], [-2, -33], [5, -44], [10, -49], [8, -46], [17, -131], [15, -139], [9, -149], [-4, -168], [6, -171], [-8, -181], [4, -184], [-6, -188], [9, -186], [-3, -65], [0, -69], [-5, -71], [-2, -68], [1, -79], [0, -177],
  [-48, -2], [-52, -8], [-55, 2], [-70, 2], [-74, -6], [-54, -20], [-76, -20], [-58, -26], [-78, -12], [36, 6], [40, 9], [42, 1], [48, -8], [76, -3], [79, 18], [50, 23], [66, 25], [82, 6],
  [-5, -210], [5, -213], [0, -218], [-4, -224], [4, -227], [0, -233], [-36, -257], [-38, -275], [-33, -266], [-24, -261], [-17, -258], [-30, -270],
  [86, 4], [96, -1], [98, 2], [112, 6], [116, -12], [126, 8], [132, -6], [134, -4], [-41, -284], [-44, -293], [-40, -304], [-56, -302], [-52, -316], [-38, -314], [-48, -317]];
const KNEE_R = 7, KNEE_H = 0.5, TALL = { reeds: 1.4, iceshard: 0.95, crystal: 0.6 };
function kneeScale(kind, wx, wz) {
  const H = TALL[kind]; if (!H) return 1;
  let d = Infinity; for (const [px, pz] of PACK_SPOTS) d = Math.min(d, Math.hypot(wx - px, wz - pz));
  if (d >= KNEE_R) return 1;
  return Math.min(1, (KNEE_H + (H - KNEE_H) * clamp01((d - 3) / (KNEE_R - 3))) / (H * 1.3)); // ×1.3: the largest scale roll stays under the cap
}
const ARENAS = [[62, 5, 9], [-66, -12, 9], [-46, -267, 6], [-48, -317, 5], [134, -4, 6]]; // boss floors stay bare but for bed kinds
function keepClear(wx, wz) {
  for (const [ax, az, ar] of ARENAS) if (Math.hypot(wx - ax, wz - az) < ar) return true;
  for (const [px, pz] of PACK_SPOTS) if (Math.hypot(wx - px, wz - pz) < 3) return true;
  return false;
}
function want(kind, e) {
  if (BED[kind]) return e < -2.5 ? 0.5 : e < 6 ? 1 : e < 12 ? 0.8 : 0.5;
  if (kind === "lily") return e < -3 ? 0.3 : e < 3 ? 1 : 0.4;
  if (TALL[kind]) return e < 1.5 ? 0.5 : e < 10 ? 1 : Math.max(0.35, 1 - (e - 10) / 14);
  return e < 0 ? 0.6 : e < 10 ? 1 : 0.6;
}
export function geometry(ctx) {
  const P = ctx.params ?? {}, biome = BIOMES[P.biome] ? P.biome : Object.keys(BIOMES).find((b) => BIOMES[b].includes(P.kind)) ?? "ash";
  const kind = BIOMES[biome].includes(P.kind) ? P.kind : BIOMES[biome][0], lod = ctx.lod ?? 1;
  const thin = lod <= 1 ? 1 : lod === 2 ? 0.65 : lod === 3 ? 0.35 : SMALL[kind] ? 0.06 : 0.15;
  const want_n = Math.max(1, Math.round((P.count ?? 40) * thin));
  const E = emitter(ctx);
  SHAPES[kind](E, ctx, Math.min(lod, 3));
  const cfg = SET[kind], [ox, oz] = P.origin ?? [0, 0], zone = OUT_ONLY[kind] ? "out" : P.zone ?? "any", margin = Math.max(P.margin ?? 0.8, OUT_ONLY[kind] ? 0.8 : -Infinity);
  const poly = Array.isArray(P.bounds) ? P.bounds : null, rad = poly ? 0 : (typeof P.bounds === "number" ? P.bounds : P.radius ?? 6);
  let bx0 = -rad, bx1 = rad, bz0 = -rad, bz1 = rad;
  if (poly) { bx0 = Math.min(...poly.map((p) => p[0])); bx1 = Math.max(...poly.map((p) => p[0])); bz0 = Math.min(...poly.map((p) => p[1])); bz1 = Math.max(...poly.map((p) => p[1])); }
  const inside = (x, z) => {
    if (!poly) return x * x + z * z <= rad * rad;
    let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, zi] = poly[i], [xj, zj] = poly[j]; if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) c = !c; } return c;
  };
  const clear = P.clear ?? [];
  ctx.instances({ layout: { offset: "float32x3", yaw: "float32", scale: "float32", tint: "float32x3" } });
  let placed = 0;
  for (let tries = 0; tries < want_n * 10 && placed < want_n; tries++) {
    const x = bx0 + ctx.random() * (bx1 - bx0), z = bz0 + ctx.random() * (bz1 - bz0), roll = ctx.random();
    if (!inside(x, z)) continue;
    let bare = false; for (const c of clear) if ((x - c[0]) ** 2 + (z - c[1]) ** 2 < c[2] * c[2]) { bare = true; break; }
    if (bare) continue;
    const wx = x + ox, wz = z + oz, fd = floorDist(wx, wz);
    if (zone === "out" && fd < margin) continue;
    if (zone === "in" && fd > -0.4) continue;
    if (TALL[kind] && fd < 0.4) continue; // the walkable floor keeps only low cover
    if (!BED[kind] && keepClear(wx, wz)) continue;
    const drift = 0.35 + 0.65 * clamp01(ctx.noise2d(wx * 0.17, wz * 0.17) * 0.8 + 0.5);
    if (roll > want(kind, fd) * drift) continue;
    const nrm = ctx.groundNormal(x, z);
    if (nrm.y < cfg.minN) continue;
    let s = (cfg.s[0] + ctx.random() * (cfg.s[1] - cfg.s[0])) * kneeScale(kind, wx, wz);
    const tv = (ctx.random() - 0.5) * cfg.tint, warm = (ctx.random() - 0.5) * cfg.tint * 0.6, yaw = ctx.random() * 360;
    let g = rim(ctx, x, z, cfg.foot * s);
    if (g.hi - g.lo > cfg.tol) { s *= 0.6; g = rim(ctx, x, z, cfg.foot * s); }
    if (g.hi - g.lo > cfg.tol || s < 0.3) continue;
    const y = (FLAT[kind] ? (g.lo + g.c) / 2 : g.lo) - cfg.sink * s;
    ctx.instance([x, y, z], yaw, s, [1 + tv + warm, 1 + tv, 1 + tv - warm]);
    placed++;
  }
}
export function collider() { return null; }
