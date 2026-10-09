// Awakening grass: one clump of real blades. Each blade is a folded strip (edge, raised midrib, edge),
// smooth-shaded so the light wraps across it the way a V-shaped leaf catches sun, curving from an
// upright root to a drooping tip. Some clumps carry seed stalks with oat-like heads; some carry a
// broad plantain leaf at the root. Feet at y = 0. ctx.params.kind: "meadow" | "dry".
export function geometry(ctx) {
  const dry = ctx.params?.kind === "dry";
  const lod = ctx.lod;
  const blades = lod >= 4 ? 2 : lod === 3 ? 3 : lod === 2 ? 5 : 7;
  const segs = lod >= 3 ? 1 : lod === 2 ? 2 : 3;
  const folded = lod <= 2;
  ctx.smooth();
  for (let b = 0; b < blades; b++) {
    const yaw = ctx.random() * Math.PI * 2;
    const rad = Math.sqrt(ctx.random()) * 0.1;
    const ox = Math.cos(yaw * 2.3) * rad, oz = Math.sin(yaw * 2.3) * rad;
    const h = (dry ? 0.4 : 0.3) + ctx.random() * (dry ? 0.5 : 0.4);
    const w = 0.01 + ctx.random() * 0.011;
    const droop = 0.1 + ctx.random() * 0.35; // how far the tip travels outward
    const sag = ctx.random() * 0.25; // how much the tip drops back down
    const dx = Math.cos(yaw), dz = Math.sin(yaw);
    const px = -dz, pz = dx;
    const L = 0.6 + ctx.random() * 0.4;
    ctx.color(`oklch(${(0.55 + ctx.random() * 0.12).toFixed(3)} ${dry ? 0.07 : 0.13} ${dry ? 90 : 128 + ctx.random() * 14})`);
    const pt = (t) => {
      const out = droop * t * t;
      const y = h * (t - sag * t * t * t);
      const ww = w * Math.sin(Math.min(1, t * 0.9 + 0.12) * Math.PI) * (1 - t * 0.6) + 0.0008;
      return [ox + dx * out, y, oz + dz * out, ww, t];
    };
    for (let s = 0; s < segs; s++) {
      const a = pt(s / segs), c = pt((s + 1) / segs);
      if (!folded) {
        ctx.quad(a[0] - px * a[3], a[1], a[2] - pz * a[3], a[0] + px * a[3], a[1], a[2] + pz * a[3],
                 c[0] + px * c[3], c[1], c[2] + pz * c[3], c[0] - px * c[3], c[1], c[2] + -pz * c[3]);
        continue;
      }
      // midrib lifted along the blade's outward lean: a shallow V the sun reads as round
      const fa = a[3] * 0.55, fc = c[3] * 0.55;
      const am = [a[0] - dx * fa, a[1] + fa * 0.3, a[2] - dz * fa];
      const cm = [c[0] - dx * fc, c[1] + fc * 0.3, c[2] - dz * fc];
      ctx.quad(a[0] - px * a[3], a[1], a[2] - pz * a[3], am[0], am[1], am[2], cm[0], cm[1], cm[2], c[0] - px * c[3], c[1], c[2] - pz * c[3]);
      ctx.quad(am[0], am[1], am[2], a[0] + px * a[3], a[1], a[2] + pz * a[3], c[0] + px * c[3], c[1], c[2] + pz * c[3], cm[0], cm[1], cm[2]);
    }
  }
  if (lod > 2) return;
  // seed stalks: a thin stem and a head of alternating spikelets
  const stalks = ctx.random() < (dry ? 0.75 : 0.35) ? 1 + Math.floor(ctx.random() * 2) : 0;
  for (let k = 0; k < stalks; k++) {
    const yaw = ctx.random() * Math.PI * 2;
    const H = (dry ? 0.75 : 0.6) + ctx.random() * 0.35;
    const lean = 0.05 + ctx.random() * 0.12;
    const dx = Math.cos(yaw) * lean, dz = Math.sin(yaw) * lean;
    const px = -Math.sin(yaw) * 0.0035, pz = Math.cos(yaw) * 0.0035;
    ctx.color(dry ? "oklch(0.72 0.07 85)" : "oklch(0.66 0.09 115)");
    ctx.flat();
    const top = [dx, H, dz];
    ctx.quad(-px, 0, -pz, px, 0, pz, top[0] + px, top[1], top[2] + pz, top[0] - px, top[1], top[2] - pz);
    ctx.color(dry ? "oklch(0.78 0.08 80)" : "oklch(0.7 0.08 100)");
    for (let i = 0; i < 5; i++) {
      const t = 0.74 + i * 0.05;
      const c = [dx * t, H * t, dz * t];
      const side = i % 2 ? 1 : -1;
      const ax = Math.cos(yaw + side * 1.2) * 0.035, az = Math.sin(yaw + side * 1.2) * 0.035;
      const wx = -Math.sin(yaw) * 0.006, wz = Math.cos(yaw) * 0.006;
      ctx.quad(c[0] - wx, c[1], c[2] - wz, c[0] + wx, c[1], c[2] + wz, c[0] + ax + wx * 0.3, c[1] - 0.025, c[2] + az + wz * 0.3, c[0] + ax - wx * 0.3, c[1] - 0.025, c[2] + az - wz * 0.3);
    }
    ctx.smooth();
  }
  // a broad leaf at the root (plantain / dock), meadow only
  if (!dry && ctx.random() < 0.3) {
    ctx.color("oklch(0.5 0.12 135)");
    ctx.sway(0.15);
    const yaw = ctx.random() * Math.PI * 2;
    const dx = Math.cos(yaw), dz = Math.sin(yaw), px = -dz, pz = dx;
    const len = 0.14 + ctx.random() * 0.08;
    const pts = [0, 0.45, 1].map((t) => [dx * len * t, 0.03 + Math.sin(t * Math.PI) * 0.04 - t * 0.02, dz * len * t, Math.sin(t * Math.PI) * 0.035 + 0.001]);
    for (let i = 0; i < 2; i++) {
      const a = pts[i], c = pts[i + 1];
      ctx.quad(a[0] - px * a[3], a[1] - 0.008, a[2] - pz * a[3], a[0], a[1], a[2], c[0], c[1], c[2], c[0] - px * c[3], c[1] - 0.008, c[2] - pz * c[3]);
      ctx.quad(a[0], a[1], a[2], a[0] + px * a[3], a[1] - 0.008, a[2] + pz * a[3], c[0] + px * c[3], c[1] - 0.008, c[2] + pz * c[3], c[0], c[1], c[2]);
    }
    ctx.sway(null);
  }
}
