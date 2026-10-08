// The Trophy Post at the Wayside Fire: params.kind = "post" (the weathered rack itself) or one relic
// that hangs from a hook: "bailiff" (chained toll ledger, wax seals), "ringer" (cracked bronze bell),
// "warden" (snuffed lantern, cold glass), "hangman" (the noose). A relic's origin is its hook point.
import { xf, compose, cbox, box, tube, loft, ringH, rock, candle, rnd, IRON, STONE, WOOD } from "./hub-kit.js";
export const HOOKS = [-0.95, -0.32, 0.32, 0.95], HOOK_Y = 2.36;
function chain(ctx, T, len) {
  ctx.albedo(IRON); ctx.color("oklch(0.5 0.015 60)"); ctx.metalness(0.7); ctx.roughness(0.55);
  for (let y = 0; y > -len; y -= 0.07) { const a = Math.round(-y / 0.07) % 2 ? 90 : 0; loft(ctx, compose(T, xf([0, y - 0.035, 0], [a, 0, 90])), [ringH(0, -0.008, 0, 0.032, 0.018, 6), ringH(0, 0.008, 0, 0.032, 0.018, 6)], false, false); }
}
function post(ctx) {
  const fine = (ctx.lod ?? 1) <= 2, T = xf();
  ctx.flat(); ctx.roughness(0.9);
  ctx.albedo(STONE); ctx.color("oklch(0.72 0.01 250)");
  for (const x of [-1.35, 1.35]) { cbox(ctx, xf([x, 0, 0]), 0.5, 0.22, 0.5, 0.05); for (let i = 0; i < (fine ? 3 : 1); i++) { const a = i * 2.1 + x; rock(ctx, xf([x + Math.cos(a) * 0.32, 0, Math.sin(a) * 0.32]), rnd(ctx, 0.08, 0.14), { sy: 0.5, sx: 1.4, rough: 0.5 }); } }
  ctx.albedo(WOOD); ctx.color("oklch(0.55 0.03 60)");
  for (const x of [-1.35, 1.35]) cbox(ctx, xf([x, 0.2, 0], [0, 0, x > 0 ? -1.5 : 1.2]), 0.17, 2.45, 0.17, 0.025);
  cbox(ctx, xf([0, 2.48, 0], [0, 0, 0.8]), 3.15, 0.18, 0.19, 0.03);
  for (const s of [-1, 1]) tube(ctx, T, [[s * 1.33, 1.85, 0], [s * 0.85, 2.44, 0]], 0.055, 5);
  ctx.albedo(IRON); ctx.color("oklch(0.55 0.01 250)"); ctx.metalness(0.6); ctx.roughness(0.6);
  for (const x of [-1.35, 1.35]) for (const y of [1.0, 2.35]) cbox(ctx, xf([x, y, 0]), 0.2, 0.05, 0.2, 0.01);
  for (const x of HOOKS) tube(ctx, T, [[x, 2.42, 0], [x, 2.37, 0], [x + 0.04, 2.33, 0.03], [x + 0.02, 2.3, 0.05]], 0.016, 4, false, true);
  // a toll of nails at ram height, and spikes on the beam ends
  for (const x of [-1.6, 1.6]) loft(ctx, xf([x, 2.48, 0], [0, 0, x > 0 ? -90 : 90]), [ringH(0, 0, 0, 0.04, 0.04, 5), ringH(0, 0.22, 0, 0.004, 0.004, 5)], true, false);
  // the offerings: candle stubs at the left foot, where pilgrims leave thanks
  if (fine) for (const c of [[-1.05, 0, 0.32, 0.12], [-0.85, 0, 0.42, 0.07], [-1.15, 0, 0.5, 0.17], [1.1, 0, 0.38, 0.09]]) candle(ctx, T, c, fine);
}
function bailiff(ctx, T) {
  chain(ctx, T, 0.3);
  const B = compose(T, xf([0, -0.52, 0], [0, 0, 6]));
  ctx.albedo("cdn/texture-cracked-black-leather.png"); ctx.color("oklch(0.4 0.03 40)"); ctx.metalness(0); ctx.roughness(0.8);
  cbox(ctx, compose(B, xf([0, 0, -0.045])), 0.34, 0.44, 0.03, 0.01); cbox(ctx, compose(B, xf([0, 0, 0.045])), 0.34, 0.44, 0.03, 0.01);
  ctx.albedo(null); ctx.color("oklch(0.82 0.04 85)"); ctx.roughness(0.9);
  cbox(ctx, compose(B, xf([0.01, 0.015, -0.03])), 0.31, 0.41, 0.06, 0.004);
  ctx.albedo(IRON); ctx.color("oklch(0.5 0.01 250)"); ctx.metalness(0.7); ctx.roughness(0.5);
  for (const y of [0.05, 0.36]) cbox(ctx, compose(B, xf([0, y, 0])), 0.36, 0.03, 0.13, 0.006);
  ctx.metalness(0); ctx.color("oklch(0.42 0.17 25)"); ctx.roughness(0.35);
  for (const [x, y] of [[-0.08, 0.22], [0.09, 0.14], [0.02, 0.3]]) {
    loft(ctx, compose(B, xf([x, y, -0.08], [0, 90, 0])), [ringH(0, 0, 0, 0.04, 0.04, 8, 0.15, ctx), ringH(0, 0.016, 0, 0.034, 0.034, 8)]);
    tube(ctx, B, [[x + 0.01, y - 0.03, -0.075], [x + 0.012, y - 0.12, -0.07]], [0.012, 0.006], 4);
  }
}
function ringer(ctx, T) {
  chain(ctx, T, 0.18);
  const B = compose(T, xf([0, -0.2, 0], [12, 0, -8]));
  ctx.albedo("cdn/texture-tarnished-bronze-verdigris.png"); ctx.color("oklch(0.62 0.07 75)"); ctx.metalness(0.8); ctx.roughness(0.45);
  tube(ctx, B, [[-0.05, 0, 0], [-0.05, 0.05, 0], [0, 0.08, 0], [0.05, 0.05, 0], [0.05, 0, 0]], 0.018, 5);
  const prof = [[0, 0.05], [-0.02, 0.12], [-0.08, 0.14], [-0.2, 0.16], [-0.32, 0.2], [-0.4, 0.26], [-0.44, 0.29], [-0.46, 0.28], [-0.45, 0.24]];
  loft(ctx, B, prof.map(([y, r]) => ringH(0, y, 0, r, r, 16)), true, false);
  loft(ctx, B, prof.slice().reverse().map(([y, r]) => ringH(0, y + 0.005, 0, r * 0.88, r * 0.88, 16)), false, false);
  ctx.albedo(null); ctx.metalness(0); ctx.color("oklch(0.08 0.01 60)"); ctx.roughness(1);
  tube(ctx, B, [[0.16, -0.12, -0.075], [0.21, -0.24, -0.1], [0.19, -0.33, -0.15], [0.25, -0.44, -0.16]], [0.012, 0.016, 0.012, 0.02], 4);
  ctx.albedo(IRON); ctx.color("oklch(0.4 0.01 250)"); ctx.metalness(0.6); ctx.roughness(0.6);
  tube(ctx, B, [[0, -0.02, 0], [0.02, -0.36, 0.03]], 0.012, 5);
  loft(ctx, compose(B, xf([0.02, -0.4, 0.03])), [ringH(0, -0.04, 0, 0.01, 0.01, 8), ringH(0, 0, 0, 0.045, 0.045, 8), ringH(0, 0.05, 0, 0.012, 0.012, 8)]);
}
function warden(ctx, T) {
  chain(ctx, T, 0.12);
  const B = compose(T, xf([0, -0.14, 0], [20, 0, 10], 1.6));
  ctx.albedo(IRON); ctx.color("oklch(0.45 0.015 230)"); ctx.metalness(0.6); ctx.roughness(0.6);
  loft(ctx, B, [ringH(0, -0.13, 0, 0.1, 0.1, 6), ringH(0, -0.1, 0, 0.1, 0.1, 6), ringH(0, -0.03, 0, 0.025, 0.025, 6)]);
  for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2, s = i === 2 ? 0.6 : 1; box(ctx, compose(B, xf([Math.cos(a) * 0.088, -0.37 * s - 0.0 + (1 - s) * -0.1, -Math.sin(a) * 0.088], [0, 0, i === 2 ? 25 : 0])), 0.016, 0.24 * s, 0.016); }
  cbox(ctx, compose(B, xf([0, -0.4, 0])), 0.21, 0.03, 0.21, 0.008);
  ctx.albedo(null); ctx.metalness(0.1); ctx.roughness(0.15); ctx.color("oklch(0.32 0.04 210 / 0.75)");
  box(ctx, compose(B, xf([0, -0.37, 0])), 0.13, 0.21, 0.13);
  ctx.roughness(0.9); ctx.color("oklch(0.2 0.01 60)");
  loft(ctx, compose(B, xf([0, -0.37, 0])), [ringH(0, 0, 0, 0.022, 0.022, 6), ringH(0, 0.05, 0, 0.018, 0.018, 6)]);
}
function hangman(ctx, T) {
  ctx.albedo("cdn/texture-frayed-hemp-rope.png"); ctx.color("oklch(0.55 0.05 75)"); ctx.metalness(0); ctx.roughness(0.95);
  tube(ctx, T, [[0, 0.02, 0], [0.01, -0.2, 0], [0, -0.42, 0.01]], 0.022, 6);
  for (let i = 0; i < 6; i++) tube(ctx, T, Array.from({ length: 11 }, (_, k) => { const a = (k / 10) * Math.PI * 2; return [Math.cos(a) * 0.034, -0.42 - i * 0.034, Math.sin(a) * 0.034]; }), 0.016, 5, false, false);
  const loop = Array.from({ length: 17 }, (_, k) => { const a = (k / 16) * Math.PI * 2; return [Math.sin(a) * 0.14, -0.62 - (1 - Math.cos(a)) * 0.17, Math.sin(a * 2) * 0.02]; });
  tube(ctx, T, loop, 0.02, 6, false, false);
  tube(ctx, T, [[0.02, -0.62, 0], [0.05, -0.74, 0.02], [0.03, -0.82, 0.04]], [0.016, 0.01], 4);
}
const RELIC = { bailiff, ringer, warden, hangman };
export function geometry(ctx) {
  const k = ctx.params?.kind ?? "post";
  if (k === "post") return post(ctx);
  ctx.flat(); RELIC[k]?.(ctx, xf());
}
export function collider(ctx) { if ((ctx.params?.kind ?? "post") === "post") for (const x of [-1.35, 1.35]) cbox(ctx, xf([x, 0, 0]), 0.4, 2.6, 0.4, 0.01); }
