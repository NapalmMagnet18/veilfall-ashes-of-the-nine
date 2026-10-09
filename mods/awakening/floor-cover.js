// Awakening floor cover: what lies under a forest. One plant file, ctx.params.kind picks the piece:
//   "moss"  a lumpy cushion of moss, brighter on its crown, darker where it meets the duff
//   "twig"  a fallen twig with a fork or two, lying on the ground
//   "cone"  a pine cone on its side, scales stepping in rings
//   "tuft"  a thin woodland grass tuft, the sparse shade grass that grows between roots
// Feet at y = 0, +Y up. Put it on a terrain decoration layer bound to the forest-floor material.
const ok = (l, c, h) => `oklch(${l.toFixed(3)} ${c.toFixed(3)} ${h.toFixed(1)})`;

function moss(ctx) {
  const R = 0.22 + ctx.random() * 0.28, Hh = 0.05 + ctx.random() * 0.07;
  const sec = ctx.lod >= 3 ? 7 : 12, rings = ctx.lod >= 3 ? 2 : 4;
  const hue = 118 + ctx.random() * 22, dry = ctx.random() < 0.25;
  const lump = [...Array(sec)].map(() => 0.75 + ctx.random() * 0.45);
  ctx.smooth();
  const P = (r, s) => {
    const a = (s / sec) * Math.PI * 2, t = r / rings, k = lump[s % sec] * (1 - t * 0.15);
    const rr = R * t * k, y = Hh * Math.cos(t * Math.PI * 0.5) ** 0.6 * (0.8 + 0.4 * lump[(s + 3) % sec]) - (t >= 1 ? 0.015 : 0);
    return [Math.cos(a) * rr, Math.max(-0.01, y), Math.sin(a) * rr];
  };
  for (let r = 0; r < rings; r++) {
    const t = r / rings;
    ctx.color(ok((dry ? 0.46 : 0.36) + (1 - t) * 0.1, dry ? 0.07 : 0.1, dry ? 95 : hue));
    for (let s = 0; s < sec; s++) {
      const a = P(r, s), b = P(r, s + 1), c = P(r + 1, s + 1), d = P(r + 1, s);
      ctx.quad(a[0], a[1], a[2], d[0], d[1], d[2], c[0], c[1], c[2], b[0], b[1], b[2]);
    }
  }
}

function twig(ctx) {
  const L = 0.25 + ctx.random() * 0.45, r0 = 0.008 + ctx.random() * 0.01;
  ctx.color(ok(0.32 + ctx.random() * 0.12, 0.04, 60 + ctx.random() * 15));
  const stick = (x0, z0, ang, len, r) => {
    const dx = Math.cos(ang), dz = Math.sin(ang), px = -dz, pz = dx, n = 3;
    const mid = [x0 + dx * len * 0.5, z0 + dz * len * 0.5];
    const ring = (x, z, rr, lift) => [...Array(n)].map((_, i) => { const a = (i / n) * Math.PI * 2; return [x + px * Math.cos(a) * rr, rr + Math.sin(a) * rr + lift, z + pz * Math.cos(a) * rr]; });
    const A = ring(x0, z0, r, 0), B = ring(mid[0], mid[1], r * 0.8, r * 0.3), C = ring(x0 + dx * len, z0 + dz * len, r * 0.4, 0);
    for (const [U, V] of [[A, B], [B, C]]) for (let i = 0; i < n; i++) { const j = (i + 1) % n; ctx.quad(U[i][0], U[i][1], U[i][2], U[j][0], U[j][1], U[j][2], V[j][0], V[j][1], V[j][2], V[i][0], V[i][1], V[i][2]); }
    return mid;
  };
  const ang = ctx.random() * Math.PI * 2, x0 = -Math.cos(ang) * L / 2, z0 = -Math.sin(ang) * L / 2;
  const m = stick(x0, z0, ang, L, r0);
  const forks = ctx.random() < 0.7 ? 1 + Math.floor(ctx.random() * 2) : 0;
  for (let f = 0; f < forks; f++) stick(m[0], m[1], ang + (ctx.random() < 0.5 ? 0.6 : -0.6), L * (0.3 + ctx.random() * 0.25), r0 * 0.55);
}

function cone(ctx) {
  const L = 0.05 + ctx.random() * 0.03, W = L * 0.42, sec = ctx.lod >= 3 ? 5 : 8, rings = 5;
  const ang = ctx.random() * Math.PI * 2, dx = Math.cos(ang), dz = Math.sin(ang), px = -dz, pz = dx;
  const P = (r, s) => {
    const t = r / rings, a = (s / sec) * Math.PI * 2 + r * 0.4, rad = W * Math.sin(Math.min(1, t * 1.15 + 0.05) * Math.PI) * (r % 2 ? 1.12 : 0.9);
    const u = (t - 0.5) * L;
    return [dx * u + px * Math.cos(a) * rad, W * 0.9 + Math.sin(a) * rad, dz * u + pz * Math.cos(a) * rad];
  };
  for (let r = 0; r < rings; r++) {
    ctx.color(ok(0.34 + (r % 2) * 0.07, 0.07, 55));
    for (let s = 0; s < sec; s++) { const a = P(r, s), b = P(r, s + 1), c = P(r + 1, s + 1), d = P(r + 1, s); ctx.quad(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2], d[0], d[1], d[2]); }
  }
}

function tuft(ctx) {
  const n = ctx.lod >= 3 ? 3 : 6;
  ctx.smooth();
  for (let b = 0; b < n; b++) {
    const yaw = ctx.random() * Math.PI * 2, dx = Math.cos(yaw), dz = Math.sin(yaw), px = -dz, pz = dx;
    const h = 0.18 + ctx.random() * 0.22, w = 0.005 + ctx.random() * 0.004, lean = 0.08 + ctx.random() * 0.2;
    ctx.color(ok(0.42 + ctx.random() * 0.12, 0.1, 120 + ctx.random() * 20));
    const pt = (t) => [dx * lean * t * t, h * (t - 0.25 * t * t * t), dz * lean * t * t, w * (1 - t * 0.85)];
    for (let s = 0; s < 2; s++) {
      const a = pt(s / 2), c = pt((s + 1) / 2);
      ctx.quad(a[0] - px * a[3], a[1], a[2] - pz * a[3], a[0] + px * a[3], a[1], a[2] + pz * a[3], c[0] + px * c[3], c[1], c[2] + pz * c[3], c[0] - px * c[3], c[1], c[2] - pz * c[3]);
    }
  }
}

export function geometry(ctx) {
  const k = ctx.params?.kind ?? "moss";
  if (k === "twig") return twig(ctx);
  if (k === "cone") return cone(ctx);
  if (k === "tuft") return tuft(ctx);
  return moss(ctx);
}
