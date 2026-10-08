// Floor litter for the Penitent Climb and the Abbey yard. params.kind:
//  "shrine": a pilgrim's candle shrine: a puddle of old wax, a dozen stub candles of every height, a cracked
//            clay bowl of offerings, a scrap of red cloth weighted with a stone.
//  "bones":  a fallen pilgrim: ribs, a skull, long bones and a wax-sealed staff, half sunk in ash.
// Origin at the ground, centred. Sizes in metres; everything sits within ~1.6 m radius.
function cyl(ctx, x, y, z, r0, r1, h, n = 8, cap = true) {
  for (let k = 0; k < n; k++) {
    const a0 = (k / n) * Math.PI * 2, a1 = ((k + 1) / n) * Math.PI * 2;
    const c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
    ctx.quad(x + c0 * r0, y, z + s0 * r0, x + c0 * r1, y + h, z + s0 * r1, x + c1 * r1, y + h, z + s1 * r1, x + c1 * r0, y, z + s1 * r0);
    if (cap) ctx.tri(x, y + h, z, x + c1 * r1, y + h, z + s1 * r1, x + c0 * r1, y + h, z + s0 * r1);
  }
}
function blob(ctx, x, y, z, rx, ry, rz, n = 8, m = 5) {
  const P = (i, k) => { const t = (i / m) * Math.PI, a = (k / n) * Math.PI * 2; return [x + Math.sin(t) * Math.cos(a) * rx, y + Math.cos(t) * ry, z + Math.sin(t) * Math.sin(a) * rz]; };
  for (let i = 0; i < m; i++) for (let k = 0; k < n; k++) ctx.quad(...P(i, k), ...P(i, k + 1), ...P(i + 1, k + 1), ...P(i + 1, k));
}
function rod(ctx, a, b, r, n = 6) {
  const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], L = Math.hypot(...d), u = d.map((v) => v / L);
  const t = Math.abs(u[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  const p = [u[1] * t[2] - u[2] * t[1], u[2] * t[0] - u[0] * t[2], u[0] * t[1] - u[1] * t[0]], pl = Math.hypot(...p); for (let i = 0; i < 3; i++) p[i] /= pl;
  const q = [u[1] * p[2] - u[2] * p[1], u[2] * p[0] - u[0] * p[2], u[0] * p[1] - u[1] * p[0]];
  const R = (o, k, rr) => { const ang = (k / n) * Math.PI * 2, c = Math.cos(ang) * rr, s = Math.sin(ang) * rr; return [o[0] + p[0] * c + q[0] * s, o[1] + p[1] * c + q[1] * s, o[2] + p[2] * c + q[2] * s]; };
  for (let k = 0; k < n; k++) ctx.quad(...R(a, k, r * 1.25), ...R(a, k + 1, r * 1.25), ...R(b, k + 1, r * 1.25), ...R(b, k, r * 1.25)); // knobbed ends read as bone
}
export function geometry(ctx) {
  const R = () => ctx.random(), kind = ctx.params.kind ?? "shrine", lo = ctx.lod >= 4;
  ctx.smooth();
  if (kind === "shrine") {
    // the old wax puddle, layered pours
    ctx.color("oklch(0.74 0.05 78)"); ctx.roughness(0.4);
    for (let i = 0; i < (lo ? 1 : 3); i++) blob(ctx, (R() - 0.5) * 0.5, 0, (R() - 0.5) * 0.5, 0.9 - i * 0.2, 0.04 + i * 0.015, 0.75 - i * 0.15, 12, 3);
    // candles: ivory going amber, wicks glowing
    const n = lo ? 4 : 13;
    for (let i = 0; i < n; i++) {
      const a = R() * 6.283, d = Math.sqrt(R()) * 0.65, x = Math.cos(a) * d, z = Math.sin(a) * d;
      const h = 0.08 + R() ** 1.6 * 0.55, r = 0.035 + R() * 0.04;
      ctx.color(`oklch(${0.86 - R() * 0.12} 0.05 ${70 + R() * 20})`); ctx.emissive(null);
      cyl(ctx, x, 0.02, z, r * 1.25, r, h, lo ? 5 : 8);
      if (!lo) for (let j = 0; j < 2; j++) { const da = R() * 6.283; rod(ctx, [x + Math.cos(da) * r, 0.02 + h, z + Math.sin(da) * r], [x + Math.cos(da) * r * 1.2, 0.02 + h * (0.3 + R() * 0.5), z + Math.sin(da) * r * 1.2], 0.012, 4); } // drips
      ctx.color("oklch(0.2 0.02 60)"); ctx.emissive(R() < 0.75 ? "oklch(0.9 0.17 65)" : null);
      cyl(ctx, x, 0.02 + h, z, 0.006, 0.004, 0.03, 4);
    }
    ctx.emissive(null);
    if (!lo) {
      // a cracked clay bowl of offerings (ash, two coins)
      ctx.flat(); ctx.color("oklch(0.42 0.06 45)"); ctx.roughness(0.9);
      cyl(ctx, 0.75, 0, 0.35, 0.12, 0.2, 0.1, 10, false);
      ctx.color("oklch(0.3 0.01 60)"); cyl(ctx, 0.75, 0.0, 0.35, 0.17, 0.17, 0.07, 10);
      ctx.color("oklch(0.62 0.09 75)"); ctx.metalness(0.9); ctx.roughness(0.4);
      cyl(ctx, 0.72, 0.075, 0.33, 0.03, 0.03, 0.006, 8); cyl(ctx, 0.79, 0.08, 0.38, 0.03, 0.03, 0.006, 8);
      ctx.metalness(0); ctx.roughness(0.95);
      // red cloth weighted with a stone
      ctx.color("oklch(0.4 0.13 25)");
      ctx.quad(-0.95, 0.012, 0.1, -0.5, 0.025, 0.25, -0.45, 0.02, -0.2, -0.85, 0.01, -0.35);
      ctx.quad(-0.95, 0.012, 0.1, -0.85, 0.01, -0.35, -0.45, 0.02, -0.2, -0.5, 0.025, 0.25);
      ctx.color("oklch(0.35 0.01 250)"); blob(ctx, -0.68, 0.04, -0.02, 0.13, 0.08, 0.1, 6, 4);
    }
  } else {
    // ash mound the pilgrim sank into
    ctx.color("oklch(0.3 0.008 60)"); ctx.roughness(1);
    blob(ctx, 0, -0.05, 0, 1.1, 0.12, 0.6, 10, 3);
    ctx.color("oklch(0.8 0.03 85)"); ctx.roughness(0.7);
    // skull
    blob(ctx, -0.75, 0.1, 0.05, 0.11, 0.1, 0.13, 8, 6);
    blob(ctx, -0.78, 0.05, -0.06, 0.07, 0.05, 0.06, 6, 4);
    if (!lo) {
      ctx.color("oklch(0.12 0.01 60)"); blob(ctx, -0.82, 0.12, -0.1, 0.025, 0.025, 0.02, 5, 3); blob(ctx, -0.72, 0.12, -0.11, 0.025, 0.025, 0.02, 5, 3);
      ctx.color("oklch(0.78 0.03 85)");
      for (let i = 0; i < 6; i++) { const z0 = -0.25 + i * 0.07; rod(ctx, [-0.45 + i * 0.07, 0.08, 0], [-0.35 + i * 0.07, 0.04, -0.28 + (i % 2) * 0.02], 0.012, 4); rod(ctx, [-0.45 + i * 0.07, 0.08, 0], [-0.38 + i * 0.07, 0.03, 0.26], 0.012, 4); }
      rod(ctx, [-0.5, 0.06, 0], [0.05, 0.05, 0.02], 0.02, 5); // spine
    }
    rod(ctx, [0.1, 0.04, -0.12], [0.55, 0.03, -0.25], 0.025, 5);
    rod(ctx, [0.1, 0.04, 0.12], [0.6, 0.05, 0.3], 0.025, 5);
    // staff, wax-sealed at the head
    ctx.flat(); ctx.color("oklch(0.32 0.04 55)"); ctx.roughness(0.85);
    rod(ctx, [-1.2, 0.03, 0.5], [0.7, 0.05, 0.55], 0.025, 6);
    ctx.color("oklch(0.42 0.14 25)"); ctx.roughness(0.35); blob(ctx, -1.18, 0.05, 0.5, 0.07, 0.06, 0.07, 7, 4);
  }
}
export function collider() { return null; }
