// A wax figure: a hooded pilgrim robed in old candle wax, a candle burning on its crown.
// params.kind: "pilgrim" | "deacon" (taller, censer arm) | "bailiff" (crowned in candles, bell-mace). Faces −Z.
function P(cx, cz, r, a, y) { return [cx + Math.cos(a) * r, y, cz + Math.sin(a) * r]; }
function lathe(ctx, prof, seg, cx = 0, cz = 0, jag = 0) {
  for (let j = 0; j < prof.length - 1; j++) {
    for (let i = 0; i < seg; i++) {
      const a0 = (i / seg) * Math.PI * 2, a1 = ((i + 1) / seg) * Math.PI * 2;
      const w = (k, a) => prof[k][0] * (1 + jag * Math.sin(a * 5 + k * 1.7));
      const v0 = P(cx, cz, w(j, a0), a0, prof[j][1]), v1 = P(cx, cz, w(j + 1, a0), a0, prof[j + 1][1]);
      const v2 = P(cx, cz, w(j + 1, a1), a1, prof[j + 1][1]), v3 = P(cx, cz, w(j, a1), a1, prof[j][1]);
      ctx.quad(...v0, ...v1, ...v2, ...v3);
    }
  }
}
function tube(ctx, a, b, r, seg = 6) { // a cylinder from a to b
  const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], L = Math.hypot(dx, dy, dz);
  const ux = dx / L, uy = dy / L, uz = dz / L;
  let px = -uz, py = 0, pz = ux; if (Math.hypot(px, pz) < 1e-3) { px = 1; pz = 0; }
  const pl = Math.hypot(px, py, pz); px /= pl; py /= pl; pz /= pl;
  const qx = uy * pz - uz * py, qy = uz * px - ux * pz, qz = ux * py - uy * px;
  const pt = (c, ang, rr) => [c[0] + (px * Math.cos(ang) + qx * Math.sin(ang)) * rr, c[1] + (py * Math.cos(ang) + qy * Math.sin(ang)) * rr, c[2] + (pz * Math.cos(ang) + qz * Math.sin(ang)) * rr];
  for (let i = 0; i < seg; i++) {
    const a0 = (i / seg) * 6.283, a1 = ((i + 1) / seg) * 6.283;
    ctx.quad(...pt(a, a0, r[0] ?? r), ...pt(b, a0, r[1] ?? r), ...pt(b, a1, r[1] ?? r), ...pt(a, a1, r[0] ?? r));
    ctx.tri(...a, ...pt(a, a1, r[0] ?? r), ...pt(a, a0, r[0] ?? r));
    ctx.tri(...b, ...pt(b, a0, r[1] ?? r), ...pt(b, a1, r[1] ?? r));
  }
}
function candle(ctx, x, y, z, h, r) {
  ctx.color("oklch(0.9 0.035 88)"); ctx.emissive(null);
  tube(ctx, [x, y, z], [x, y + h, z], [r, r * 0.92], 7);
  ctx.color("oklch(0.25 0.01 60)"); tube(ctx, [x, y + h, z], [x, y + h + 0.03, z], 0.006, 3);
  ctx.emissive("oklch(0.9 0.17 75)"); ctx.color("oklch(0.95 0.12 85)");
  lathe(ctx, [[0, y + h + 0.025], [r * 0.55, y + h + 0.05], [r * 0.35, y + h + 0.1], [0, y + h + 0.16]], 6, x, z);
  ctx.emissive(null);
}
export function geometry(ctx) {
  const kind = ctx.params.kind ?? "pilgrim";
  const rnd = ctx.random;
  ctx.smooth();
  ctx.roughness(0.55);
  // robe: wax, slumped, its hem melted into a foot-puddle
  ctx.color(kind === "bailiff" ? "oklch(0.78 0.05 70)" : "oklch(0.88 0.035 85)");
  lathe(ctx, [[0, 0.01], [0.5, 0.02], [0.42, 0.08], [0.36, 0.35], [0.31, 0.8], [0.26, 1.15], [0.31, 1.32], [0.22, 1.45], [0, 1.48]], ctx.lod > 2 ? 8 : 16, 0, 0, 0.06);
  // hood
  ctx.color(kind === "bailiff" ? "oklch(0.7 0.05 65)" : "oklch(0.84 0.04 80)");
  lathe(ctx, [[0.0, 1.4], [0.2, 1.42], [0.24, 1.58], [0.21, 1.76], [0.12, 1.88], [0, 1.93]], ctx.lod > 2 ? 8 : 14, 0, 0.02, 0.04);
  // the face: a hollow, nothing in it but a dim ember glow
  ctx.color("oklch(0.12 0.01 40)"); ctx.emissive("oklch(0.35 0.12 40)");
  lathe(ctx, [[0, 1.5], [0.12, 1.55], [0.12, 1.72], [0, 1.77]], 10, 0, -0.16);
  ctx.emissive(null);
  // sleeves reaching forward, wax fingers
  ctx.color("oklch(0.86 0.04 82)");
  tube(ctx, [-0.28, 1.3, -0.02], [-0.22, 1.02, -0.38], [0.11, 0.13], 7);
  tube(ctx, [0.28, 1.3, -0.02], [0.24, 1.0, -0.36], [0.11, 0.13], 7);
  ctx.color("oklch(0.93 0.03 88)");
  for (const sx of [-1, 1]) for (let k = 0; k < 3; k++) tube(ctx, [sx * (0.23 + k * 0.02 - 0.02), 1.0, -0.38], [sx * (0.24 + k * 0.03 - 0.03), 0.84 - k * 0.02, -0.44], [0.025, 0.012], 4);
  // drips running down the robe
  ctx.color("oklch(0.95 0.045 90)");
  const drips = ctx.lod > 2 ? 4 : 11;
  for (let i = 0; i < drips; i++) {
    const a = rnd() * 6.283, top = 0.9 + rnd() * 0.5, len = 0.3 + rnd() * 0.6;
    const r0 = 0.3 * (1 - (top - 0.8) * 0.3);
    tube(ctx, [Math.cos(a) * (r0 + 0.01), top, Math.sin(a) * (r0 + 0.01)], [Math.cos(a) * (r0 + 0.06), top - len, Math.sin(a) * (r0 + 0.06)], [0.03, 0.018], 5);
  }
  // candle on the crown
  if (kind !== "bailiff") candle(ctx, 0.04, 1.88, 0.03, 0.22, 0.045);
  if (kind === "deacon") {
    // a censer of hot tallow swung from the right hand on a chain
    ctx.color("oklch(0.3 0.015 250)"); ctx.metalness(0.8);
    tube(ctx, [0.24, 1.0, -0.36], [0.3, 0.55, -0.5], 0.012, 4);
    lathe(ctx, [[0, 0.33], [0.13, 0.38], [0.15, 0.48], [0.1, 0.56], [0, 0.58]], 10, 0.3, -0.5);
    ctx.metalness(0); ctx.emissive("oklch(0.75 0.18 50)"); ctx.color("oklch(0.8 0.15 55)");
    lathe(ctx, [[0, 0.5], [0.08, 0.52], [0, 0.6]], 8, 0.3, -0.5); ctx.emissive(null);
    for (let i = 0; i < 4; i++) candle(ctx, Math.cos(i * 1.6) * 0.18, 1.6 + i * 0.03, Math.sin(i * 1.6) * 0.18 + 0.05, 0.1 + i * 0.03, 0.03);
  }
  if (kind === "bailiff") {
    // a crown of candles grown out of the hood, and a toll-bell on a staff
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * 6.283;
      candle(ctx, Math.cos(a) * 0.17, 1.78 - Math.abs(Math.sin(a)) * 0.04, Math.sin(a) * 0.17 + 0.02, 0.08 + ((i * 37) % 5) * 0.04, 0.03);
    }
    ctx.color("oklch(0.32 0.04 60)");
    tube(ctx, [0.3, 0.05, -0.42], [0.32, 2.05, -0.44], 0.035, 6);
    ctx.color("oklch(0.55 0.09 70)"); ctx.metalness(0.85); ctx.roughness(0.35);
    lathe(ctx, [[0, 2.15], [0.06, 2.12], [0.12, 2.0], [0.16, 1.82], [0.2, 1.74], [0.18, 1.72], [0, 1.72]], 12, 0.32, -0.44);
    ctx.metalness(0); ctx.roughness(0.55);
    // a ledger chained at the hip
    ctx.color("oklch(0.3 0.06 30)");
    const lx = -0.33, ly = 0.75, lz = -0.12;
    ctx.quad(lx, ly, lz - 0.14, lx, ly + 0.26, lz - 0.14, lx, ly + 0.26, lz + 0.14, lx, ly, lz + 0.14);
  }
}
export function collider(ctx) {
  return null; // characters wear the capsule
}
