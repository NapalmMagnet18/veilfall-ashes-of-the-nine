// Awakening river sheet: the surface of a river, a ribbon down its centreline, shaped by what is under it.
// params:
//   pts   "x,y,z;…"  the centreline, upstream first, local to the feet; y = the water level there
//   width m           a bit past the banks, so the terrain itself cuts the edge
//   rocks "x,z,r,c;…" boulders in the channel, local: plan radius r, crown c metres above the water
// What the photos of mountain rapids show, and this sheet builds:
//   - a boulder heaps a pillow on its upstream face, leaves a hole just behind, trails a wake downstream
//   - the foot of every drop throws a train of standing waves, crests across the flow, decaying
//   - the steep face itself runs fast and tears white
// uv: u across 0 (left bank) … 1 (right bank), v metres downstream.
// colors per vertex (the sheet's flow map, the way shipped rivers carry one):
//   r = aeration (0 glassy … 1 white; wave crests fold in here)
//   g = surface speed, m/s ÷ 15: the reach's slope, faster down the middle, doubled past a boulder's flanks
//   b = the flow's sideways lean, 0.5 straight downstream, 0 / 1 = 45° toward the left / right bank:
//       potential flow around each boulder (a cylinder in a uniform stream), slowed in its wake
export function geometry(ctx) {
  const p = ctx.params ?? {}, W = Number(p.width ?? 9) / 2;
  const P = String(p.pts ?? "").split(";").filter(Boolean).map((s) => s.split(",").map(Number));
  if (P.length < 2) return;
  const R = String(p.rocks ?? "").split(";").filter(Boolean).map((s) => { const [x, z, r, c] = s.split(",").map(Number); return { x, z, r, c }; });
  const lod = ctx.lod ?? 1;
  const step = lod <= 1 ? 0.6 : lod === 2 ? 0.7 : lod === 3 ? 1.2 : 5; // metres between rows
  const across = lod <= 1 ? 22 : lod === 2 ? 20 : lod === 3 ? 12 : 1;
  const shaped = lod <= 3;

  // the centreline by distance, and the level's gradient along it
  const S = [0];
  for (let i = 1; i < P.length; i++) S.push(S[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][2] - P[i - 1][2]));
  const total = S[S.length - 1];
  const lin = (s) => { // the authored polyline, straight between points
    s = Math.max(0, Math.min(total, s));
    let i = 1; while (i < S.length - 1 && S[i] < s) i++;
    const a = P[i - 1], b = P[i], f = (s - S[i - 1]) / Math.max(1e-6, S[i] - S[i - 1]);
    return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
  };
  // water is a fluid: the level never climbs downstream and has no kinks, the bends have no corners.
  // Resample every 0.25 m, clamp the level to fall only, then blur (three box passes ≈ a gaussian):
  // level over ~3 m, the plan over ~2 m, so rows never fold at a bend and the surface is one smooth slope
  const DS = 0.25, NS = Math.ceil(total / DS) + 1;
  const LX = new Float64Array(NS), LY = new Float64Array(NS), LZ = new Float64Array(NS);
  for (let k = 0; k < NS; k++) { const q = lin(k * DS); LX[k] = q[0]; LY[k] = q[1]; LZ[k] = q[2]; }
  for (let k = 1; k < NS; k++) LY[k] = Math.min(LY[k], LY[k - 1]);
  const blur = (A, rad) => { const r = Math.max(1, Math.round(rad / DS)); for (let pass = 0; pass < 3; pass++) {
    const B = Float64Array.from(A);
    for (let k = 0; k < NS; k++) { let sum = 0, n = 0; for (let j = k - r; j <= k + r; j++) { const jj = Math.max(0, Math.min(NS - 1, j)); sum += B[jj]; n++; } A[k] = sum / n; } } };
  blur(LY, 1.5); blur(LX, 1.0); blur(LZ, 1.0);
  const samp = (A, s) => { const f = Math.max(0, Math.min(NS - 1, s / DS)), i = Math.min(NS - 2, Math.floor(f)), t = f - i; return A[i] + (A[i + 1] - A[i]) * t; };
  const at = (s) => { // position, tangent, level at distance s, all smooth
    s = Math.max(0, Math.min(total, s));
    const x = samp(LX, s), z = samp(LZ, s);
    let tx = samp(LX, s + 1.5) - samp(LX, s - 1.5), tz = samp(LZ, s + 1.5) - samp(LZ, s - 1.5);
    const L = Math.hypot(tx, tz) || 1; tx /= L; tz /= L;
    return { x, z, y: samp(LY, s), tx, tz };
  };
  const grad = (s) => (at(s - 1.5).y - at(s + 1.5).y) / 3; // drop per metre, smoothed over 3 m
  // drop feet: where a steep reach (>12 %) eases back to a run; each throws a wave train
  const feet = [];
  let inDrop = false, dropTop = 0;
  for (let s = 0; s <= total; s += 0.5) {
    const g = grad(s);
    if (!inDrop && g > 0.12) { inDrop = true; dropTop = at(s).y; }
    else if (inDrop && g < 0.06) { inDrop = false; feet.push({ s, h: Math.max(0.3, dropTop - at(s).y) }); }
  }

  // rocks in the sheet's (s, t) frame: nearest centreline distance and signed offset
  const RS = R.map((r) => {
    let best = 1e9, bs = 0, bt = 0;
    for (let s = 0; s <= total; s += 0.5) {
      const c = at(s), dx = r.x - c.x, dz = r.z - c.z, d = dx * dx + dz * dz;
      if (d < best) { best = d; bs = s; bt = dx * -c.tz + dz * c.tx; }
    }
    return { s: bs, t: bt, r: r.r, c: r.c };
  });

  const BO = String(p.boils ?? "").split(";").filter(Boolean).map((q) => {
    const [x, z, r, k] = q.split(",").map(Number);
    let best = 1e9, bs = 0, bt = 0;
    for (let s = 0; s <= total; s += 0.5) {
      const c = at(s), dx = x - c.x, dz = z - c.z, d = dx * dx + dz * dz;
      if (d < best) { best = d; bs = s; bt = dx * -c.tz + dz * c.tx; }
    }
    return { s: bs, t: bt, r, k };
  });
  const hash = (a, b) => { const h = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return h - Math.floor(h); };
  const vnoise = (x, y) => { // smooth value noise, 0..1
    const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi;
    const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
    const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
    return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
  };
  const sq = (x) => x * x;

  // one vertex: height offset and the three signals
  const baseSpeed = Number(p.speed ?? 0.9), rapid = Number(p.rapid ?? 3.2);
  const field = (s, t, g) => {
    let dy = 0, aer = 0, crest = 0;
    const cur = Math.min(1, Math.max(0, (g - 0.02) / 0.16));
    const mid = 1 - sq(Math.min(1, Math.abs(t) / W));
    let vs = 1, vt = 0; // the stream, relative to the reach's own speed: +s downstream, +t toward the right bank
    aer += Math.max(0, Math.min(1, (g - 0.09) / 0.14)) * (0.55 + 0.45 * vnoise(t * 0.9, s * 0.35)); // the steep face tears
    for (const b of BO) { // a plunge: the boil heaves up over the impact, rings of torn water push outward
      const ds = s - b.s, dt = t - b.t, d = Math.hypot(ds, dt), rr = d / b.r;
      if (rr > 4) continue;
      const brk = 0.6 + 0.4 * vnoise(s * 0.8 + 11, t * 0.8);
      aer += b.k * (Math.exp(-rr * rr * 0.9) * 1.4 + Math.exp(-sq((rr - 1.6) / 0.7)) * 0.7 * brk + Math.exp(-rr * 0.8) * 0.35) * brk;
      dy += (shaped ? 0.12 : 0) * b.k * Math.exp(-rr * rr * 1.5) - (shaped ? 0.03 : 0) * Math.exp(-sq((rr - 1.8) / 0.5));
      if (d > 1e-3) { const out = Math.exp(-sq((rr - 1.2) / 1.2)) * b.k; vs += out * ds / d * 1.4; vt += out * dt / d * 1.4; }
    }
    if (shaped) {
      for (const f of feet) { // the wave train below a drop
        const d = s - f.s + 1.2;
        if (d < 0 || d > 16) continue;
        const bow = 0.35 * sq(t / W); // crests bow downstream at the edges
        const ph = (d - bow) / 2.3;
        const env = Math.exp(-d / 5) * Math.min(1, d / 0.8) * Math.min(1, f.h / 1.2);
        const edge = 1 - Math.pow(Math.min(1, Math.abs(t) / W), 3);
        const w = Math.cos(ph * Math.PI * 2);
        dy += 0.06 * env * w * edge; // standing waves: a low swell, the crest read comes from the whitewater
        const c = Math.pow(Math.max(0, w), 4) * env * edge;
        crest = Math.max(crest, c);
        aer += c * 1.1 + Math.exp(-sq((d - 0.4) / 1.2)) * 0.9 * edge; // the hydraulic jump at the foot
      }
      for (const r of RS) { // the flow bends round every boulder, near or far
        const ds = s - r.s, dt = t - r.t, d2 = ds * ds + dt * dt, R2 = r.r * r.r * (r.c < 0.05 ? 0.35 : 1);
        if (d2 > 64 * R2 + 36) continue;
        if (d2 < R2) { vs = 0; vt = 0; continue; }
        const k = R2 / (d2 * d2);
        vs -= k * (ds * ds - dt * dt); vt -= k * 2 * ds * dt;
        if (ds > 0) vs *= 1 - 0.75 * Math.exp(-ds / (3 * r.r + 1)) * Math.exp(-sq(dt / (0.9 * r.r))); // the slack in its lee
      }
      for (const r of RS) { // pillow, hole, wake
        const ds = s - r.s, dt = t - r.t;
        if (ds < -3 * r.r || ds > 12 * r.r + 6 || Math.abs(dt) > 3 * r.r + 3) continue;
        const sub = r.c < 0.05; // a pour-over: the rock is just under, the water humps and falls off it
        const up = Math.exp(-(sq((ds + r.r * 0.95) / (0.55 * r.r)) + sq(dt / (1.05 * r.r))));
        dy += (sub ? 0.08 : 0.05) * up * Math.min(1.5, r.r);
        const hole = Math.exp(-(sq((ds - r.r * 1.1) / (0.7 * r.r)) + sq(dt / (0.75 * r.r))));
        dy -= 0.03 * hole * Math.min(1.5, r.r);
        if (sub) dy += 0.06 * Math.exp(-(sq(ds / (0.8 * r.r)) + sq(dt / (0.9 * r.r))));
        aer += up * 1.3 * (0.4 + cur) + hole * 0.8 * (0.3 + cur);
        if (ds > 0) { // the wake: widens and fades downstream, stronger in fast water
          const spread = 0.55 * r.r + 0.16 * ds;
          aer += Math.exp(-ds / (2.5 * r.r + 3 * cur + 1)) * Math.exp(-sq(dt / spread)) * (0.35 + 0.8 * cur);
          // the V: two eddy lines diverging from the rock's flanks
          const v = Math.abs(Math.abs(dt) - (r.r * 0.9 + ds * 0.22));
          aer += Math.exp(-sq(v / 0.35)) * Math.exp(-ds / (5 + 6 * cur)) * 0.35;
        }
      }
    }
    // riffle chop: small, everywhere the current runs
    // (no static riffle chop in the mesh: frozen bumps on moving water read as ridges; the ripple map carries the chop)
    const vm = Math.hypot(vs, vt);
    const mps = (baseSpeed + rapid * cur) * (0.3 + 0.7 * mid) * vm;
    const lean = vm > 1e-4 ? Math.max(-1, Math.min(1, vt / Math.max(vs, 0.25))) : 0;
    aer = Math.min(1, aer + crest * 0.4);
    return { dy, aer, cur: Math.min(1, mps / 15), crest: 0.5 + 0.5 * lean };
  };

  const rows = [];
  const n = Math.max(1, Math.ceil(total / step));
  for (let k = 0; k <= n; k++) {
    const s = (k / n) * total, c = at(s), g = grad(s), nx = -c.tz, nz = c.tx;
    const row = [];
    for (let j = 0; j <= across; j++) {
      const u = j / across, t = (u * 2 - 1) * W;
      const f = field(s, t, g);
      row.push({ x: c.x + nx * t, y: c.y, z: c.z + nz * t, u, v: s, col: [f.aer, f.cur, f.crest] });
    }
    rows.push(row);
  }
  // brink (optional, m/s): the sheet ends at a waterfall lip and curls over it on the free-fall arc the water flies,
  // for brinkDrop metres, tapering to brinkWidth, so the same water shades the brink and a curtain (waterfall.js)
  // takes over on top of it: no edge where one surface stops and the other starts
  const bv = Number(p.brink ?? 0);
  if (bv > 0) {
    const e = at(total), bW = Math.min(W, Number(p.brinkWidth ?? W * 2) / 2), bDrop = Number(p.brinkDrop ?? 1.5);
    const tEnd = Math.sqrt((2 * bDrop) / 9.81), nb = lod <= 1 ? 16 : lod === 2 ? 12 : lod <= 3 ? 8 : 3;
    let vAcc = total, prev = null;
    for (let k = 1; k <= nb; k++) {
      const tt = tEnd * Math.pow(k / nb, 1.4), a = bv * tt, dy = -4.905 * tt * tt;
      const x0 = e.x + e.tx * a, z0 = e.z + e.tz * a, y0 = e.y + dy;
      if (prev) vAcc += Math.hypot(x0 - prev[0], y0 - prev[1], z0 - prev[2]); else vAcc += Math.hypot(a, dy);
      prev = [x0, y0, z0];
      const hw = W + (bW - W) * Math.min(1, tt / (tEnd * 0.35));
      const aer = Math.min(1, Math.max(0, (tt - 0.18) / 0.5)), cur = Math.min(1, Math.hypot(bv, 9.81 * tt) / 15);
      const row = [];
      for (let j = 0; j <= across; j++) { const u = j / across, t = (u * 2 - 1) * hw;
        row.push({ x: x0 - e.tz * t, y: y0, z: z0 + e.tx * t, u, v: vAcc, col: [aer, cur, 0.5] }); }
      rows.push(row);
    }
  }
  // whitewater is carried: what tears white at a rock or a drop trails off downstream and spreads as it
  // thins, so every patch has a tail fading into clear water, never an edge where the source ends
  const tail = Number(p.tail ?? 5); // metres for the carried foam to thin to a third
  for (let j = 0; j <= across; j++) {
    let carry = 0;
    for (let i = 0; i < rows.length; i++) {
      const q = rows[i][j], sp = Math.max(0.3, q.col[1] * 15);
      carry = Math.max(q.col[0], carry * Math.exp(-(total / n) / (tail * Math.min(1.6, 0.5 + sp * 0.25))));
      q.col[0] = Math.max(q.col[0], carry * 0.8);
    }
  }
  for (let pass = 0; pass < 3; pass++) { // soften across and along: no flow-map edge sharper than a couple of metres
    const A = rows.map((r) => r.map((q) => q.col[0]));
    for (let i = 0; i < rows.length; i++) for (let j = 0; j <= across; j++) {
      const g = (ii, jj) => A[Math.max(0, Math.min(rows.length - 1, ii))][Math.max(0, Math.min(across, jj))];
      rows[i][j].col[0] = g(i, j) * 0.4 + (g(i, j - 1) + g(i, j + 1) + g(i - 1, j) + g(i + 1, j)) * 0.15;
    }
  }
  const uvs = [], colors = [];
  const put = (q) => { uvs.push(q.u, q.v); colors.push(q.col[0], q.col[1], q.col[2]); return [q.x, q.y, q.z]; };
  ctx.smooth();
  // wound to face up (+y): a0 → b1 → b0, a0 → a1 → b1
  for (let i = 0; i < rows.length - 1; i++) {
    for (let j = 0; j < across; j++) {
      const a0 = rows[i][j], a1 = rows[i][j + 1], b0 = rows[i + 1][j], b1 = rows[i + 1][j + 1];
      ctx.tri(...put(a0), ...put(b1), ...put(b0));
      ctx.tri(...put(a0), ...put(a1), ...put(b1));
    }
  }
  return { uvs, colors };
}
