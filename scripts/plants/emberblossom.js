// Emberblossom: the pilgrims' tree of Candlehold, planted round the fountain. Feet at y 0, ~4-5 m tall.
// A dark, gently twisting trunk splits into 4-6 boughs; each bough ends in a heavy cloud of pale blossom
// (ivory to rose, a faint warm glow in the hearts so it reads under the lamps at night).
function tube(ctx, pts, r0, r1, sides) {
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1], ra = r0 + (r1 - r0) * (i / (pts.length - 1)), rb = r0 + (r1 - r0) * ((i + 1) / (pts.length - 1));
    const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], L = Math.hypot(dx, dy, dz) || 1;
    let ux = -dz, uz = dx, ul = Math.hypot(ux, uz); if (ul < 1e-4) { ux = 1; uz = 0; ul = 1; } ux /= ul; uz /= ul;
    const vx = (dy * uz) / L, vy = (dz * ux - dx * uz) / L, vz = (-dy * ux) / L;
    for (let s = 0; s < sides; s++) {
      const t0 = (s / sides) * 6.2832, t1 = ((s + 1) / sides) * 6.2832;
      const o = (t, r) => [Math.cos(t) * ux * r + Math.sin(t) * vx * r, Math.sin(t) * vy * r, Math.cos(t) * uz * r + Math.sin(t) * vz * r];
      const p0 = o(t0, ra), p1 = o(t1, ra), q0 = o(t0, rb), q1 = o(t1, rb);
      ctx.quad(a[0] + p0[0], a[1] + p0[1], a[2] + p0[2], a[0] + p1[0], a[1] + p1[1], a[2] + p1[2], b[0] + q1[0], b[1] + q1[1], b[2] + q1[2], b[0] + q0[0], b[1] + q0[1], b[2] + q0[2]);
    }
  }
}
// a lumpy blossom cloud: a jittered UV-sphere, flattened a little underneath
function cloud(ctx, r, cx, cy, cz, R, rings, seg) {
  const j = [];
  for (let i = 0; i <= rings; i++) { j.push([]); for (let k = 0; k < seg; k++) j[i].push(i === 0 || i === rings ? 1 : 0.8 + r() * 0.35); }
  for (let i = 0; i <= rings; i++) j[i][seg] = j[i][0];
  const P = (i, k) => { const v = i / rings, th = (k / seg) * 6.2832, ph = v * Math.PI, s = j[i][k] * R;
    return [cx + Math.cos(th) * Math.sin(ph) * s, cy + Math.cos(ph) * s * (v > 0.5 ? 0.7 : 0.95), cz + Math.sin(th) * Math.sin(ph) * s]; };
  for (let i = 0; i < rings; i++) for (let k = 0; k < seg; k++) ctx.quad(...P(i, k), ...P(i, k + 1), ...P(i + 1, k + 1), ...P(i + 1, k));
}
export function geometry(ctx) {
  const r = () => ctx.random(), lod = ctx.lod ?? 1, far = lod >= 3;
  const H = 2.4 + r() * 0.6, lean = r() * 6.283;
  ctx.smooth(); ctx.roughness(0.9);
  ctx.albedo("cdn/texture-dead-grey-oak-bark-deep-furrows.png"); ctx.color("oklch(0.3 0.02 30)");
  const trunk = []; const ts = far ? 3 : 6;
  for (let s = 0; s <= ts; s++) { const t = s / ts; trunk.push([Math.cos(lean) * 0.3 * t + Math.sin(t * 4) * 0.06, t * H, Math.sin(lean) * 0.3 * t + Math.cos(t * 3) * 0.06]); }
  tube(ctx, trunk, 0.24, 0.14, far ? 5 : 9);
  // root flare
  for (let i = 0; i < (far ? 3 : 5); i++) { const a = i * 1.26 + r() * 0.4; tube(ctx, [[0, 0.3, 0], [Math.cos(a) * 0.35, 0.08, Math.sin(a) * 0.35], [Math.cos(a) * 0.6, -0.05, Math.sin(a) * 0.6]], 0.12, 0.04, far ? 3 : 5); }
  const top = trunk[trunk.length - 1], tips = [];
  const nb = far ? 4 : 4 + Math.floor(r() * 3);
  for (let b = 0; b < nb; b++) {
    const a = (b / nb) * 6.283 + r() * 0.6, out = 1.0 + r() * 0.8, up = 0.7 + r() * 0.9;
    const mid = [top[0] + Math.cos(a) * out * 0.5, top[1] + up * 0.6, top[2] + Math.sin(a) * out * 0.5];
    const end = [top[0] + Math.cos(a) * out, top[1] + up, top[2] + Math.sin(a) * out];
    tube(ctx, [top, mid, end], 0.11, 0.04, far ? 4 : 6); tips.push(end);
  }
  // blossom: many small puffs strung along each bough and past its tip, so branches show between them
  ctx.albedo(null); ctx.roughness(0.75);
  const cols = ["oklch(0.9 0.05 10)", "oklch(0.84 0.09 355)", "oklch(0.93 0.03 60)"];
  let ci = 0;
  const puff = (x, y, z, R) => { ctx.color(cols[ci++ % 3]); ctx.emissive(0.16, 0.07, 0.07); cloud(ctx, r, x, y, z, R, far ? 3 : 4, far ? 5 : 7); };
  for (const t of tips) {
    const dx = t[0] - top[0], dy = t[1] - top[1], dz = t[2] - top[2];
    const n = far ? 2 : 4 + Math.floor(r() * 2);
    for (let k = 0; k < n; k++) { const f = 0.45 + (k / n) * 0.9 + r() * 0.1, sp = 0.35;
      puff(top[0] + dx * f + (r() - 0.5) * sp, top[1] + dy * f + 0.1 + (r() - 0.3) * 0.4, top[2] + dz * f + (r() - 0.5) * sp, 0.38 + r() * 0.3); }
    if (!far) for (let k = 0; k < 3; k++) { // a few hanging sprays dropping off the bough's end
      ctx.color(cols[ci++ % 3]); cloud(ctx, r, t[0] + dx * 0.3 + (r() - 0.5) * 0.5, t[1] - 0.45 - r() * 0.3, t[2] + dz * 0.3 + (r() - 0.5) * 0.5, 0.22 + r() * 0.1, 3, 6); }
  }
  if (!far) puff(top[0], top[1] + 1.3, top[2], 0.55);
  ctx.emissive(null);
}
