// A burned pew of the Ashen Abbey nave: charred oak seat, two back planks leaning back, carved bench ends,
// a stretcher and a centre support. params: { len, state: "row" | "snapped" | "over" }. The sitter faces −Z
// (toward the altar); origin at the floor, centred. "snapped": broken mid-length, both halves sagging to the
// floor with splinters and a smouldering end. "over": tipped back onto its backrest. Low box collider.
import { WAXC, xf, chainXf, bevelBox, boxC, rough, drip } from "./shapes.js";
const CHAR = "cdn/texture-charred-burnt-oak-wood-alligator-cracked.png";
function section(ctx, T, x0, x1, o, R, J, L) {
  const bx = (cx, cy, cz, hx, hy, hz, yaw = 0, pitch = 0, roll = 0, b = 0.012) => bevelBox(ctx, chainXf(T, xf([cx, cy, cz], yaw, pitch, roll)), hx, hy, hz, L <= 2 ? b : 0, J);
  const len = x1 - x0, cx = (x0 + x1) / 2;
  ctx.color(o.c1); bx(cx, 0.44, -0.02, len / 2, 0.026, 0.2);                       // seat
  ctx.color(o.c2);
  if (!o.lost1) bx(cx, 0.63, 0.205, len / 2, 0.06, 0.018, 0, 8);                   // lower back plank
  if (!o.lost2) { const s = o.short ? 0.62 : 1; bx(o.short ? x0 + len * s / 2 : cx, 0.87, 0.24, (len / 2) * s, 0.065, 0.018, 0, 8); } // upper plank, burnt short
  bx(cx, 0.36, 0.2, len / 2, 0.028, 0.03);                                          // seat-back rail
  if (L <= 3) bx(cx, 0.12, 0, len / 2 - 0.05, 0.03, 0.03);                          // stretcher
  if (len > 2.2) bx(cx, 0.21, -0.02, 0.03, 0.21, 0.17);                              // centre support
  ctx.color(o.c3);
  for (const [x, has] of [[x0, o.endL], [x1, o.endR]]) if (has) {
    bx(x, 0.48, 0.02, 0.036, 0.48, 0.26);                                           // bench end
    bx(x, 0.98, 0.04, 0.048, 0.035, 0.22);                                          // its capping
    if (L <= 2) bx(x, 0.98, -0.2, 0.05, 0.06, 0.05, 0, 0, 0, 0.02);                 // the carved knob
  }
  for (const [x, dir, brk] of [[x0, -1, o.brkL], [x1, 1, o.brkR]]) if (brk) {
    for (let i = 0; i < (L <= 2 ? 9 : 3); i++) {                                    // splinters out of the break
      ctx.color(i % 2 ? o.c2 : "oklch(.55 .01 40)");
      const k = i % 3, yy = [0.44, 0.63, 0.87][k], zz = [-0.02, 0.205, 0.24][k], l = 0.08 + R() * 0.24;
      bx(x + dir * l / 2, yy + (R() - 0.5) * 0.03, zz + (R() - 0.5) * 0.14, l / 2, 0.006 + R() * 0.012, 0.01 + R() * 0.03, (R() - 0.5) * 30, (R() - 0.5) * 20, 0, 0);
    }
    if (o.ember) { ctx.color("oklch(.3 .02 40)"); ctx.emissive(1.8, 0.45, 0.07); for (let i = 0; i < 3; i++) bx(x + dir * 0.01, 0.44 + (R() - 0.5) * 0.02, -0.15 + R() * 0.3, 0.012, 0.018, 0.04, 0, 0, 0, 0); ctx.emissive(null); }
  }
}
export function geometry(ctx) {
  const L = ctx.lod, R = () => ctx.random(), len = ctx.params.len ?? 3.6, st = ctx.params.state ?? "row";
  ctx.flat(); ctx.albedo(CHAR); ctx.roughness(0.95); ctx.metalness(0);
  const J = L <= 2 ? rough(ctx, 0.012, 3) : null;
  const tone = () => `oklch(${(0.74 + R() * 0.2).toFixed(2)} .035 55)`;
  const o = () => ({ c1: tone(), c2: tone(), c3: tone(), lost1: R() < 0.12, lost2: R() < 0.3, short: R() < 0.35, endL: true, endR: true, ember: R() < 0.5 });
  const x0 = -len / 2, x1 = len / 2;
  if (st === "snapped") {
    const m = (R() - 0.5) * 0.8;
    const a = o(); a.endR = false; a.brkR = true;
    section(ctx, chainXf(xf([x0, 0, 0], 0, 0, -7 - R() * 4), xf([-x0, 0, 0])), x0, m - 0.04, a, R, J, L);
    const b = o(); b.endL = false; b.brkL = true; b.short = false;
    section(ctx, chainXf(xf([x1, 0, 0], (R() - 0.5) * 12, 0, 12 + R() * 5), xf([-x1, 0, 0])), m + 0.04, x1, b, R, J, L);
  } else if (st === "over") {
    section(ctx, xf([0, 0.3, 0], (R() - 0.5) * 6, 84 + R() * 8, 0), x0, x1, o(), R, J, L);
  } else section(ctx, xf([0, 0, 0], (R() - 0.5) * 3), x0, x1, o(), R, J, L);
  if (L <= 2 && st !== "over") { // wax run off the back plank where pilgrims left candles
    ctx.smooth(); ctx.albedo("/cdn/value.627b7a8789f6aba4b1057abb947848ac429517d5c496ae62d307c93eda8c8f8a.png"); ctx.roughness(0.5);
    for (let i = 0; i < 3; i++) { ctx.color(WAXC[i + 1]); drip(ctx, x0 + 0.3 + R() * (len - 0.6), 0.93, 0.25, 0.1 + R() * 0.25, 0.02 + R() * 0.015, 5); }
  }
}
export function collider(ctx) {
  const len = ctx.params.len ?? 3.6;
  if (ctx.params.state === "over") boxC(ctx, -len / 2, len / 2, 0, 0.55, -0.1, 1.0);
  else boxC(ctx, -len / 2, len / 2, 0, 0.55, -0.26, 0.3);
}
