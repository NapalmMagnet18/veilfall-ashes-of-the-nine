// Awakening Water: the waterfall tool. A hanging valley ends in a sheer step; its stream pours off the lip into a
// plunge pool the river below is born from. This carves that ground; the water on it is the shared water system
// (river-sheet.js brink, waterfall.js curtain, river.js pool with lib/plunge.js), all read from the same frame.
//
//   const fall = createFall({ x, z, dx, dz, top, lip, pool, outlet: { x, z, dx, dz } });
//   heightAt:  h = fall.ground(ctx, h0, x, z)  then  h = fall.outlet(x, z, h)
//   authoring: fall.frame(x, z) → { a, b } (a = metres downstream of the lip, b = across), fall.streamB(a),
//              fall.streamLevel(a), fall.top(ctx, b)  (the lip line), fall.F (the numbers)
//
// Rules it keeps: the plateau stops at the lip line and drops sheer; the stream runs in a cut channel whose banks
// never dip under its water; its bed rises to a sill at the brink so the water slides over; the pool is an
// ellipse under the face with an outlet notch whose sill sits under the water; the river leaves level with the pool
// between low banks before it drops. Imports nothing.
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const sstep = (a, b, v) => { const t = clamp01((v - a) / (b - a)); return t * t * (3 - 2 * t); };

export function createFall(o) {
  const F = { face: 1.8, poolA: 10, poolRA: 14, poolRB: 9.5, spring: -52, valley: 96, halfWide: 46, streamW: 3.6, seed: 21, ...o };
  const frame = (x, z) => { const rx = x - F.x, rz = z - F.z; return { a: rx * F.dx + rz * F.dz, b: rx * F.dz - rz * F.dx }; };
  const streamB = (a) => a > -8 ? 0 : 2.6 * Math.sin((a + 8) * 0.075) * sstep(-8, -30, a);
  const streamLevel = (a) => (a >= 0 ? F.lip : F.lip + Math.max(0, -a - 7) * 0.055 + Math.min(-a, 7) * 0.06) - 0.12 * sstep(-3, 0, a); // the brink draws down as the water speeds up
  const top = (ctx, b) => 0.035 * b * b + ctx.noise.fbm2({ x: b, z: 3.1, frequency: 1 / 4, octaves: 2, seed: ctx.seedOffset(F.seed) }) * 0.9 * sstep(3.5, 9, Math.abs(b));
  const R = F.valley + 4 + F.halfWide; // a cheap box before the frame
  function ground(ctx, x, z, h) {
    if (Math.abs(x - F.x) > R || Math.abs(z - F.z) > R) return h;
    const { a, b } = frame(x, z);
    if (a < -F.valley - 4 || a > 45 || Math.abs(b) > F.halfWide + 2) return h;
    const n = ctx.noise.fbm2({ x, z, frequency: 1 / 11, octaves: 3, seed: ctx.seedOffset(F.seed + 1) });
    // the plunge pool and its bed, carved into the low ground below the face
    const at = top(ctx, b), belowFace = sstep(at + F.face - 0.3, at + F.face + 0.4, a);
    const pr = Math.hypot((a - F.poolA) / F.poolRA, b / F.poolRB);
    let low = h;
    if (pr < 1.45) {
      const bed = F.pool - 0.35 - 5.6 * (1 - sstep(0.05, 0.9, pr)) + n * 0.35;
      const bank = Math.max(h, F.pool + 0.45 + n * 0.5);
      const T = pr < 1 ? bed + (F.pool - 0.3 - bed) * sstep(0.8, 1, pr) : F.pool - 0.3 + (bank - F.pool + 0.3) * sstep(1, 1.2, pr);
      const out = (1 - sstep(3.5, 6.5, Math.abs(b - 0.4))) * sstep(F.poolA + 7, F.poolA + 11, a); // the outlet notch
      const Tn = pr < 1 ? T : T + (Math.min(T, F.pool - 1.1 + n * 0.2) - T) * out;
      const k = pr < 1.2 ? 1 : 1 - sstep(1.2, 1.45, pr) * (1 - out);
      low = h + (Tn - h) * k * belowFace;
    }
    // the hanging valley: a plateau at the lip's height rising gently upstream, sides climbing off the stream
    const S = (1 - sstep(16, 30, a)) * (1 - sstep(30, F.halfWide, Math.abs(b))) * (1 - sstep(-F.valley + 24, -F.valley, a));
    if (S <= 0) return low;
    const bs = streamB(a), ds = Math.abs(b - bs), sp = F.spring;
    let Hp = F.top + Math.max(0, -a) * 0.06 + Math.min(ds, 25) * 0.05 + n * 1.1;
    if (a < 0.5 && a > sp - 4 && ds < 12) Hp = Math.max(Hp, streamLevel(a) + 0.35 + Math.max(0, ds - 2.4) * 0.18); // banks never dip under the stream
    let t = Math.max(low, Hp);
    // the stream's channel: cut banks, a gravel bed; a spring under a headwall at `spring`; a sill at the brink
    const lv = streamLevel(a), hw = 2.1 + (F.streamW - 2.1) * sstep(-12, 0, a) - 1.7 * sstep(sp + 12, sp, a);
    if (a < 0.5 && a > sp - 4) {
      const head = a < sp + 2, dh = head ? Math.hypot(ds, a - sp - 2) : ds;
      if (dh < hw + 3 + (head ? 3 : 0)) {
        const sill = sstep(-3.5, -0.4, a);
        const bedY = lv - 0.65 + sill * 0.47 - 0.25 * (1 - sstep(0, hw, dh)) + n * 0.12;
        t = Math.min(t, bedY + (t - bedY) * sstep(hw - 0.4, hw + (head ? 5 : 2.6), dh));
      }
    }
    const w = 1 - sstep(at, at + F.face, a); // the face: the plateau stops at the lip line and drops sheer
    return low + (t - low) * S * w;
  }
  // where the river leaves the pool: its water runs level with the pool a few metres, held by low banks, then drops
  const O = F.outlet;
  function outlet(x, z, h) {
    if (!O) return h;
    const rx = x - O.x, rz = z - O.z, a = rx * O.dx + rz * O.dz, b = rx * O.dz - rz * O.dx;
    if (a < -3 || a > 16 || Math.abs(b) > 9) return h;
    const lv = F.pool + 0.4 - 0.9 * sstep(3, 12, a);
    const w = sstep(3.8, 5.2, Math.abs(b)) * (1 - sstep(7, 9, Math.abs(b))) * sstep(-3, -1, a) * (1 - sstep(12, 16, a));
    return h < lv ? h + (lv - h) * w : h;
  }
  return { F, frame, streamB, streamLevel, top, ground, outlet };
}
