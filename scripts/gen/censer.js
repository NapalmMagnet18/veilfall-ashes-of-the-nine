// The Wax Deacon's censer: a pierced bronze thurible with a spired lid, hung on three chains to a ring
// he holds. Origin = the bowl's centre (smoke rises from here); the chains climb +Y to the hand ring.
import { TEX, xf, lathe, tube, chain } from "./shapes.js";
export function geometry(ctx) {
  const L = ctx.lod, I = xf([0, 0, 0]), up = ctx.params.chain ?? 0.55;
  ctx.flat(); ctx.albedo(TEX.bronze); ctx.metalness(0.7); ctx.roughness(0.55); ctx.color("oklch(.72 .07 70)");
  // bowl: a squat cup on a little foot
  lathe(ctx, I, [[0, -0.16], [0.05, -0.16], [0.055, -0.13], [0.04, -0.11], [0.1, -0.08], [0.13, -0.02], [0.125, 0.02], [0, 0.02]], L <= 2 ? 14 : 8, {});
  // lid: pierced dome rising to a spire, drawn as rib cage so the coals show through
  const nb = L <= 2 ? 10 : 6, rAt = (t) => 0.12 * Math.cos(t * 1.35) + 0.008;
  for (let b = 0; b < nb; b++) { const a = (b / nb) * 6.283, pts = []; for (let k = 0; k <= 6; k++) { const t = k / 6; pts.push([Math.cos(a) * rAt(t), 0.03 + t * 0.2, Math.sin(a) * rAt(t)]); } tube(ctx, pts, 0.012); }
  for (const t of [0.0, 0.45]) { const pts = []; for (let k = 0; k <= 14; k++) { const a = (k / 14) * 6.283; pts.push([Math.cos(a) * rAt(t), 0.03 + t * 0.2, Math.sin(a) * rAt(t)]); } tube(ctx, pts, 0.014); }
  lathe(ctx, I, [[0.025, 0.22], [0.02, 0.3], [0.006, 0.36], [0, 0.37]], 6, {});
  // embers inside
  ctx.albedo(null); ctx.metalness(0); ctx.roughness(1); ctx.emissive?.("oklch(.75 .2 45)", 3); ctx.color("oklch(.6 .2 40)");
  lathe(ctx, I, [[0, 0.0], [0.1, 0.0], [0.07, 0.04], [0, 0.05]], 8, {});
  ctx.emissive?.(null);
  // three chains from the lid rim up to the hand ring
  const top = [0, up, 0];
  for (let i = 0; i < 3; i++) { const a = (i / 3) * 6.283; chain(ctx, [[Math.cos(a) * 0.11, 0.04, Math.sin(a) * 0.11], top], L, 0.7); }
  ctx.albedo(TEX.iron); ctx.color("oklch(.7 .04 45)"); ctx.metalness(0.55); ctx.roughness(0.7);
  const ring = []; for (let k = 0; k <= 12; k++) { const a = (k / 12) * 6.283; ring.push([Math.cos(a) * 0.04, up + 0.03, Math.sin(a) * 0.04]); } tube(ctx, ring, 0.01);
}
