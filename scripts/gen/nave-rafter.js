// A charred roof rafter: a 26 × 34 cm oak beam burned into alligator blocks (deeper toward the end that
// burned in the roof), a dim ember seam in the cracks, an iron strap, a tenon at the foot and a splintered
// snapped top. Runs along local +Z from the foot, raised by params.lean degrees (0 = lying). params: { len, lean, glow }.
import { xf, chainXf, bevelBox, boxC, rough } from "./shapes.js";
const CHAR = "cdn/texture-charred-burnt-oak-wood-alligator-cracked.png";
export function geometry(ctx) {
  const L = ctx.lod, R = () => ctx.random(), len = ctx.params.len ?? 5, lean = ctx.params.lean ?? 60, glow = ctx.params.glow ?? 0.5;
  const B = xf([0, 0, 0], 0, -lean, 0), J = L <= 2 ? rough(ctx, 0.014, 4) : null;
  const bx = (T, hx, hy, hz, b = 0.012) => bevelBox(ctx, chainXf(B, T), hx, hy, hz, L <= 2 ? b : 0, J);
  ctx.flat(); ctx.metalness(0);
  if (glow > 0 && L <= 3) { ctx.albedo(null); ctx.color("oklch(.25 .02 40)"); ctx.emissive(1.4 * glow, 0.32 * glow, 0.05 * glow); bx(xf([0, 0.17, len / 2]), 0.1, 0.13, len / 2 - 0.05, 0); ctx.emissive(null); }
  ctx.albedo(CHAR); ctx.roughness(0.95);
  if (L <= 3) { let z = 0; while (z < len - 0.04) {
    const sl = Math.min(len - z, 0.2 + R() * 0.26), burn = z / len, sh = 0.012 + R() * 0.018 + burn * burn * 0.05;
    ctx.color(`oklch(${(burn > 0.6 ? 0.58 : 0.74 + R() * 0.15).toFixed(2)} .03 50)`);
    bx(xf([(R() - 0.5) * 0.012, 0.17 + (R() - 0.5) * 0.01, z + sl / 2], (R() - 0.5) * 2), 0.13 - sh, 0.17 - sh, sl / 2 - 0.009);
    z += sl;
  } } else { ctx.color("oklch(.72 .03 50)"); bx(xf([0, 0.17, len / 2]), 0.12, 0.16, len / 2, 0); }
  ctx.color("oklch(.7 .03 50)"); bx(xf([0, 0.17, -0.08]), 0.07, 0.1, 0.09, 0.008); // tenon
  if (L <= 2) for (let i = 0; i < 8; i++) { // the snapped top
    ctx.color(i % 2 ? "oklch(.6 .02 45)" : "oklch(.78 .03 55)"); const l = 0.1 + R() * 0.35;
    bx(xf([(R() - 0.5) * 0.18, 0.04 + R() * 0.26, len + l / 2 - 0.02], (R() - 0.5) * 20, (R() - 0.5) * 16), 0.008 + R() * 0.02, 0.008 + R() * 0.02, l / 2, 0);
  }
  ctx.albedo("/cdn/value.fc2d6f2f81f6d5fa8b807c3778839023b0680cf71709aafbaf66806426b4a17c.png"); ctx.metalness(0.55); ctx.roughness(0.7); ctx.color("oklch(.7 .04 45)");
  const zs = len * (0.3 + R() * 0.1);
  bx(xf([0, 0.17, zs]), 0.145, 0.185, 0.04, 0.005);
  if (L <= 2) for (const s of [-1, 1]) bx(xf([s * 0.15, 0.17, zs]), 0.012, 0.025, 0.025, 0);
}
export function collider(ctx) {
  const len = ctx.params.len ?? 5, a = (ctx.params.lean ?? 60) * Math.PI / 180;
  boxC(ctx, -0.15, 0.15, 0, Math.max(0.36, len * Math.sin(a) + 0.3), -0.2, len * Math.cos(a) + 0.15);
}
