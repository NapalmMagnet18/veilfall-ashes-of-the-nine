// The Ashen Abbey's west court: a disc of old flagstones (params.r) laid in rings, many cracked, sunk or
// heaved, some gone to ash and moss; a broad pilgrim path of cleaner, worn-smooth slabs runs from the
// climb (local +Z) to the door (local -Z). All flat dressing; the terrain is the floor.
import { quad } from "./shapes.js";
export function geometry(ctx) {
  const L = ctx.lod, R = () => ctx.random(), r = ctx.params.r ?? 19, door = ctx.params.door ?? 23;
  const g = (x, z) => ctx.groundY(x, z);
  ctx.flat(); ctx.albedo("cdn/texture-dark-wet-worn-flagstone-slab-surface.png"); ctx.roughness(0.55); ctx.metalness(0);
  const step = L <= 2 ? 1.15 : 2.3;
  for (let rr = 0.6; rr < r; rr += step) {
    const n = Math.max(6, Math.round((2 * Math.PI * rr) / (step * 1.25)));
    const off = R() * 6.283;
    for (let k = 0; k < n; k++) {
      const a0 = off + (k / n) * 6.283, a1 = off + ((k + 1) / n) * 6.283, gap = 0.05 + R() * 0.04;
      const cx = Math.cos((a0 + a1) / 2) * (rr + step / 2), cz = Math.sin((a0 + a1) / 2) * (rr + step / 2);
      const onPath = Math.abs(cx) < 2.6 && (cz < 0 || cz > 0);
      const edge = rr / r;
      // missing slabs more often toward the rim and off the path
      if (!onPath && R() < 0.12 + edge * 0.35) continue;
      const sunk = onPath ? 0 : (R() < 0.2 ? -0.04 : 0) + (R() < 0.12 ? 0.06 : 0);
      const tiltA = (R() - 0.5) * (onPath ? 0.02 : 0.1), tiltB = (R() - 0.5) * (onPath ? 0.02 : 0.1);
      const P = (a, rad, t) => { const x = Math.cos(a) * rad, z = Math.sin(a) * rad; return [x, g(x, z) + 0.06 + sunk + t, z]; };
      const ia0 = a0 + gap / Math.max(rr, 0.5), ia1 = a1 - gap / Math.max(rr, 0.5);
      const v = onPath ? 0.95 : 0.8 + R() * 0.16;
      ctx.color(`oklch(${v} ${0.008 + R() * 0.01} ${onPath ? 70 : 230 + R() * 40})`);
      const p00 = P(ia0, rr + gap, tiltA), p01 = P(ia1, rr + gap, tiltB), p11 = P(ia1, rr + step - gap, -tiltA), p10 = P(ia0, rr + step - gap, -tiltB);
      quad(ctx, p00, p01, p11, p10, [0, -5, 0]);
      if (L <= 2) { // the slab's lip: a thin side so it reads as stone, not paint
        const d = (p) => [p[0], p[1] - 0.07, p[2]];
        quad(ctx, d(p10), d(p11), p11, p10, [0, -5, 0]);
      }
    }
  }
  // ash drifts and dead moss in the gaps, heavier toward the rim
  ctx.albedo(null); ctx.smooth();
  for (let i = 0; i < (L <= 2 ? 70 : 20); i++) {
    const a = R() * 6.283, d = r * Math.sqrt(0.2 + 0.8 * R()), x = Math.cos(a) * d, z = Math.sin(a) * d;
    if (Math.abs(x) < 2.4) continue;
    const moss = R() < 0.35, s = 0.4 + R() * 1.2;
    ctx.color(moss ? "oklch(0.3 0.04 130)" : "oklch(0.36 0.006 60)"); ctx.roughness(1);
    const N = 9, y = g(x, z) + 0.075;
    for (let k = 0; k < N; k++) {
      const b0 = (k / N) * 6.283, b1 = ((k + 1) / N) * 6.283, w0 = s * (0.7 + 0.3 * Math.sin(b0 * 3 + i)), w1 = s * (0.7 + 0.3 * Math.sin(b1 * 3 + i));
      ctx.tri(x, y + 0.02, z, x + Math.cos(b1) * w1, y, z + Math.sin(b1) * w1 * 0.7, x + Math.cos(b0) * w0, y, z + Math.sin(b0) * w0 * 0.7);
    }
  }
  // the door threshold: a long single sill slab where the path meets the front
  ctx.flat(); ctx.albedo("cdn/texture-dark-wet-worn-flagstone-slab-surface.png"); ctx.color("oklch(0.9 0.01 70)");
  const sz = -door + 0.4;
  quad(ctx, [-3, g(-3, sz) + 0.16, sz - 0.6], [3, g(3, sz) + 0.16, sz - 0.6], [3, g(3, sz) + 0.16, sz + 0.6], [-3, g(-3, sz) + 0.16, sz + 0.6], [0, -5, 0]);
  quad(ctx, [-3, g(-3, sz) - 0.05, sz + 0.6], [-3, g(-3, sz) + 0.16, sz + 0.6], [3, g(3, sz) + 0.16, sz + 0.6], [3, g(3, sz) - 0.05, sz + 0.6], [0, 0, -5]);
}
export function collider() { return null; }
