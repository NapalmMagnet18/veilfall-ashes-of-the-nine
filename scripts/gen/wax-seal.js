// The Wax Veil: where the Abbey road leaves the Bailiff's court, two soot-black ashlar posts and a cracked
// lintel hold a curtain of candle-wax strands that never stopped running. A great red seal hangs in the middle.
// Origin at the foot, centred; spans X (params.w), faces -Z. Bodies pass the strands: the gate is the map's.
function box(ctx, cx, cy, cz, hx, hy, hz, yaw = 0) {
  const c = Math.cos(yaw), s = Math.sin(yaw);
  const P = [[-1,-1,-1],[1,-1,-1],[-1,1,-1],[1,1,-1],[-1,-1,1],[1,-1,1],[-1,1,1],[1,1,1]].map(([x, y, z]) => { const lx = x * hx, lz = z * hz; return [cx + lx * c + lz * s, cy + y * hy, cz - lx * s + lz * c]; });
  for (const f of [[1,3,7,5],[0,4,6,2],[2,6,7,3],[4,5,7,6],[0,2,3,1]]) ctx.quad(...P[f[0]], ...P[f[1]], ...P[f[2]], ...P[f[3]]);
}
// a strand: a tapered ring loft hanging from y0 to y1, with beads where the wax pooled
function strand(ctx, x, z, y0, y1, r0, seg) {
  const N = 6, rows = Math.max(3, Math.round((y0 - y1) / 0.35));
  const ring = (i) => {
    const t = i / rows, y = y0 + (y1 - y0) * t;
    const bead = 1 + 0.45 * Math.max(0, Math.sin(t * 9 + x * 3)) ** 4;
    const r = r0 * (1 - t * 0.6) * bead;
    return Array.from({ length: N }, (_, k) => { const a = (k / N) * Math.PI * 2; return [x + Math.cos(a) * r, y, z + Math.sin(a) * r]; });
  };
  let prev = ring(0);
  for (let i = 1; i <= rows; i++) {
    const cur = ring(i);
    for (let k = 0; k < N; k++) { const k2 = (k + 1) % N; ctx.quad(...prev[k], ...prev[k2], ...cur[k2], ...cur[k]); }
    prev = cur;
  }
  if (seg) { const tip = [x, y1 - r0 * 0.8, z]; for (let k = 0; k < N; k++) ctx.tri(...prev[k], ...prev[(k + 1) % N], ...tip); }
}
export function geometry(ctx) {
  const { w = 13, h = 5.2 } = ctx.params, R = () => ctx.random(), hw = w / 2;
  // posts and lintel: wet ashlar
  ctx.flat(); ctx.albedo("/cdn/value.6b3fb3d3a7a92182bd467ade93e50cb3b85db20740d25d108932ae16b3f1c5bf.png"); ctx.color("oklch(0.93 0.01 250)"); ctx.roughness(0.8);
  for (const sx of [-1, 1]) {
    let y = 0, i = 0;
    while (y < h) { const ch = 0.42 + R() * 0.14, j = (R() - 0.5) * 0.08; box(ctx, sx * (hw + 0.55) + j, y + ch / 2, j, 0.62 - (i % 2) * 0.05, ch / 2 - 0.01, 0.62 - (i % 2) * 0.05, (R() - 0.5) * 0.05); y += ch; i++; }
    box(ctx, sx * (hw + 0.55), h + 0.1, 0, 0.8, 0.12, 0.8); // cap
    if (ctx.lod <= 2) box(ctx, sx * (hw + 0.55), 0.18, 0, 0.82, 0.18, 0.82); // plinth
  }
  // lintel: two stones, cracked and sagging at the middle
  box(ctx, -hw / 2 - 0.1, h + 0.48, 0, hw / 2 + 0.75, 0.36, 0.5, 0.0);
  box(ctx, hw / 2 + 0.1, h + 0.44, 0, hw / 2 + 0.75, 0.36, 0.5, -0.03);
  // wax: dirty ivory going amber, a faint glow from the heat still in it
  ctx.albedo(null); ctx.smooth(); ctx.color("oklch(0.82 0.05 80)"); ctx.roughness(0.35); ctx.emissive("oklch(0.32 0.09 60)");
  const n = ctx.lod <= 2 ? Math.round(w * 4.2) : ctx.lod === 3 ? Math.round(w * 1.6) : 0;
  for (let i = 0; i < n; i++) {
    const x = -hw + 0.15 + (i + R() * 0.6) * ((w - 0.3) / n), z = (R() - 0.5) * 0.5;
    const len = (h - 0.1) * (0.35 + 0.65 * R() ** 0.6);
    strand(ctx, x, z, h + 0.15, h + 0.15 - len, 0.05 + R() * 0.07, true);
  }
  // the pooled wax along the lintel's underside and at the foot
  for (let i = 0; i < (ctx.lod <= 3 ? 14 : 0); i++) { const x = -hw + (i + 0.5) * (w / 14); box(ctx, x, h + 0.08, (R() - 0.5) * 0.3, w / 28 + 0.05, 0.08 + R() * 0.05, 0.3); }
  ctx.emissive(null);
  // the seal: a disc of blood-red wax with a raised rim, a brass ring through it on a chain
  ctx.color("oklch(0.42 0.14 25)"); ctx.roughness(0.3);
  const cy = h * 0.55, N = 28, R0 = 1.05;
  for (let k = 0; k < N; k++) {
    const a0 = (k / N) * Math.PI * 2, a1 = ((k + 1) / N) * Math.PI * 2, wob = (a) => R0 * (1 + 0.06 * Math.sin(a * 7));
    const p0 = [Math.cos(a0) * wob(a0), cy + Math.sin(a0) * wob(a0)], p1 = [Math.cos(a1) * wob(a1), cy + Math.sin(a1) * wob(a1)];
    ctx.tri(0, cy, -0.32, p1[0], p1[1], -0.26, p0[0], p0[1], -0.26); // front face (bulged)
    ctx.tri(0, cy, 0.32, p0[0], p0[1], 0.26, p1[0], p1[1], 0.26);   // back
    ctx.quad(p0[0], p0[1], -0.26, p1[0], p1[1], -0.26, p1[0], p1[1], 0.26, p0[0], p0[1], 0.26);
  }
  // the nine-pointed lantern pressed into it: nine raised spokes
  ctx.color("oklch(0.5 0.16 28)");
  for (let k = 0; k < 9; k++) { const a = (k / 9) * Math.PI * 2 + Math.PI / 2; box(ctx, Math.cos(a) * 0.45, cy + Math.sin(a) * 0.45, -0.34, 0.06, 0.32, 0.03, 0); }
  // chain: brass links up to the lintel
  ctx.color("oklch(0.62 0.09 75)"); ctx.metalness(0.85); ctx.roughness(0.45);
  for (let y = cy + R0 + 0.05, i = 0; y < h + 0.12; y += 0.16, i++) box(ctx, 0, y + 0.07, 0, i % 2 ? 0.02 : 0.06, 0.08, i % 2 ? 0.06 : 0.02);
}
export function collider() { return null; }
