// A fallen nave pier: the drums of a 1.1 m clustered pier (octagonal core, four big shafts, four fillets)
// lying in a line along local +X where they toppled, each rolled and knocked askew, the capital fragment at
// the far end, chips spilled around. params: { n: drums, sp: spacing }. Origin at the first drum's foot.
import { TEX, WAXC, xf, chainXf, bevelBox, boxC, lathe, rough, drip } from "./shapes.js";
const D = Math.PI / 180;
const SH = [[0, 0.38, 0.16], [90, 0.38, 0.16], [180, 0.38, 0.16], [270, 0.38, 0.16], [45, 0.43, 0.08], [135, 0.43, 0.08], [225, 0.43, 0.08], [315, 0.43, 0.08]];
export function drum(ctx, T, d, seg, sseg, J, L) {
  lathe(ctx, T, [[0, 0], [0.36, 0], [0.36, d], [0, d]], seg, { J, a0: Math.PI / 8 });
  for (const [a, o, r] of SH) {
    if (L >= 4 && r < 0.1) continue;
    const c = [Math.cos(a * D) * o, 0, Math.sin(a * D) * o];
    lathe(ctx, chainXf(T, xf(c)), [[0, 0.01], [r * 0.9, 0.01], [r, 0.04], [r, d - 0.04], [r * 0.9, d - 0.01], [0, d - 0.01]], sseg, { J });
  }
}
export function geometry(ctx) {
  const L = ctx.lod, R = () => ctx.random(), n = ctx.params.n ?? 5, sp = ctx.params.sp ?? 1.25;
  const J = L <= 2 ? rough(ctx, 0.02, 1.8) : null, seg = L <= 2 ? 8 : 6, sseg = L <= 2 ? 8 : 5;
  ctx.flat(); ctx.albedo(TEX.stone); ctx.roughness(0.85); ctx.metalness(0);
  if (L >= 5) { ctx.color("oklch(.74 .012 250)"); for (let i = 0; i <= n; i++) bevelBox(ctx, xf([i * sp, 0.5, 0], (i * 37) % 20 - 10), 0.45, 0.5, 0.5, 0); return; }
  for (let i = 0; i < n; i++) {
    const d = 0.72 + R() * 0.32, cx = i * sp + (R() - 0.5) * 0.25, cz = (R() - 0.5) * 0.4 + i * 0.03;
    ctx.color(`oklch(${(0.66 + R() * 0.22).toFixed(2)} .012 ${R() < 0.5 ? 250 : 60})`);
    const T = chainXf(xf([cx, 0.5, cz], (R() - 0.5) * 26, 0, 90 + (R() - 0.5) * 4), xf([0, -d / 2, 0], R() * 360));
    drum(ctx, T, d, seg, sseg, J, L);
  }
  // the capital fragment where the top of the pier came down: a flared bell of stone, split open
  const cx = n * sp + 0.2;
  ctx.color("oklch(.62 .012 60)");
  const C = xf([cx, 0.45, 0.1], R() * 40 - 20, 0, 70);
  lathe(ctx, C, [[0.4, -0.3], [0.48, -0.2], [0.68, 0.12], [0.78, 0.2], [0.78, 0.32], [0.3, 0.32]], seg * 2, { skip: (i, j) => j > seg * 1.3, J });
  if (L <= 3) { // chips and wax that rode down with it
    for (let i = 0; i < (L <= 2 ? 16 : 6); i++) {
      ctx.color(`oklch(${(0.62 + R() * 0.2).toFixed(2)} .01 250)`);
      const s = 0.06 + R() * 0.16;
      bevelBox(ctx, xf([R() * (n * sp + 0.6) - 0.3, s * 0.5, (R() < 0.5 ? -1 : 1) * (0.55 + R() * 0.7)], R() * 360, R() * 30, R() * 30), s * 1.3, s * 0.6, s, 0, J);
    }
    ctx.smooth(); ctx.albedo(TEX.wax); ctx.roughness(0.5);
    for (let i = 0; i < 4; i++) { ctx.color(WAXC[1 + (i % 4)]); drip(ctx, R() * n * sp, 1.0, (R() - 0.5) * 0.3, 0.3 + R() * 0.5, 0.03 + R() * 0.03, 5); }
  }
}
export function collider(ctx) {
  const n = ctx.params.n ?? 5, sp = ctx.params.sp ?? 1.25;
  boxC(ctx, -0.6, n * sp + 0.6, 0, 1.0, -0.65, 0.65);
}
