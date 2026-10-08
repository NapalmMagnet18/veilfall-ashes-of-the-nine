// An orchard gibbet: a stone footing, an iron-banded post, an arm reaching local -Z with a hook, the
// tie-off rope run back along the arm and wound on a cleat (where a Bearer cuts), a frayed stub
// that stays when the hanged child is cut down, and the wax pool under where it swings.
import { TEX, WAXC, xf, bevelBox, boxC, candleBed, puddle } from "./shapes.js";
import { rock, tube as rtube, I } from "./hub-kit.js";
import { rope, fray } from "./orch-kit.js";
export const H = 4.0, ARM = 1.9, HOOK = [0, H - 0.3, -ARM + 0.2];
export function geometry(ctx) {
  const L = ctx.lod ?? 1, R = () => ctx.random();
  ctx.flat(); ctx.albedo(TEX.stone); ctx.color("oklch(.86 .01 250)"); ctx.roughness(0.9); ctx.metalness(0);
  bevelBox(ctx, xf([0, 0.19, 0], 9), 0.42, 0.2, 0.42, 0.05);
  if (L <= 3) for (let i = 0; i < 6; i++) { const a = i * 1.05 + R() * 0.4; rock(ctx, xf([Math.cos(a) * 0.62, 0, Math.sin(a) * 0.62], R() * 90), 0.14 + R() * 0.12, { sy: 0.5, rough: 0.5 }); }
  ctx.albedo(TEX.wood); ctx.roughness(0.95); ctx.color("oklch(.74 .04 55)");
  bevelBox(ctx, xf([0, H / 2 + 0.1, 0], 3), 0.15, H / 2 - 0.1, 0.15, 0.03);
  bevelBox(ctx, xf([0, H - 0.15, -ARM / 2 + 0.08]), 0.12, 0.12, ARM / 2 + 0.2, 0.025);
  { const a = [0, H - 1.4, -0.12], b = [0, H - 0.25, -1.15], m = [0, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
    bevelBox(ctx, xf(m, 0, Math.atan2(b[1] - a[1], -(b[2] - a[2])) * 57.3), 0.075, 0.075, Math.hypot(b[1] - a[1], b[2] - a[2]) / 2 + 0.05, 0.02); }
  ctx.albedo(TEX.iron); ctx.metalness(0.55); ctx.roughness(0.75); ctx.color("oklch(.7 .04 45)");
  for (const y of [0.55, 1.8, H * 0.62, H - 0.42]) bevelBox(ctx, xf([0, y, 0], 3), 0.172, 0.05, 0.172, 0);
  bevelBox(ctx, xf([0, H - 0.15, -ARM + 0.2]), 0.14, 0.05, 0.14, 0);
  bevelBox(ctx, xf([0, H + 0.05, 0]), 0.18, 0.06, 0.18, 0.015);
  rtube(ctx, I, [[0, H - 0.27, HOOK[2]], [0, HOOK[1] + 0.03, HOOK[2]], [0, HOOK[1] - 0.02, HOOK[2] - 0.04], [0, HOOK[1] + 0.02, HOOK[2] - 0.07]], 0.014, 4, true, true);
  bevelBox(ctx, xf([0, 1.36, -0.19]), 0.03, 0.03, 0.06, 0.008);
  // tie-off: from the hook over the arm, back to the post and down to the cleat, wound round it
  rope(ctx, [[0, HOOK[1] + 0.04, HOOK[2] + 0.03], [0, H - 0.02, HOOK[2] + 0.06], [0, H - 0.02, -0.18], [0, H - 0.3, -0.17], [0, 1.5, -0.175]], 0.02);
  { const pts = []; for (let k = 0; k <= 36; k++) { const t = (k / 12) * 6.283; pts.push([Math.sin(t) * 0.18, 1.5 - k * 0.006, -Math.cos(t) * 0.18]); } rope(ctx, pts, 0.022); }
  rope(ctx, [[0, 1.28, -0.18], [0.06, 0.9, -0.24], [0.04, 0.6, -0.22]], 0.02); fray(ctx, [0.04, 0.6, -0.22], 5, 0.1);
  // the stub that stays when the hanged is cut down
  rope(ctx, [HOOK, [0.02, HOOK[1] - 0.42, HOOK[2]]], 0.024); fray(ctx, [0.02, HOOK[1] - 0.42, HOOK[2]], 7, 0.12);
  // wax pooled beneath, a few stubs left by mourners at the post foot
  ctx.albedo(TEX.wax); ctx.roughness(0.5); ctx.smooth(); ctx.color(WAXC[2]);
  puddle(ctx, 0.05, 0, HOOK[2] - 0.05, 0.6, 0.5, 0.035);
  ctx.color(WAXC[1]); puddle(ctx, 0.25, 0, HOOK[2] + 0.45, 0.22, 0.18, 0.02);
  if (L <= 2) candleBed(ctx, 0.55, 0, 0.5, 0.22, 0.16, 5, { lit: 0.5, hMax: 0.16 });
}
export function collider(ctx) { boxC(ctx, -0.44, 0.44, 0, 0.4, -0.44, 0.44); boxC(ctx, -0.17, 0.17, 0.4, H, -0.17, 0.17); }
