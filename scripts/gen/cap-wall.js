// A length of Candlehold's curtain wall: battered plinth, ashlar body with a string course, buttresses
// on the outer (+Z) face, a parapet with merlons and arrow loops on the inner and outer edges.
// params { len, h } ; runs along X, centred; −Z faces into the city.
import { ASHLAR, box, cbox } from "./cap-kit.js";
export function geometry(ctx) {
  const p = ctx.params ?? {}, L = p.len ?? 8, H = p.h ?? 7, T = 2, lod = ctx.lod ?? 1;
  ctx.flat(); ctx.roughness(0.92); ctx.albedo(ASHLAR); ctx.color("oklch(0.9 0.01 250)");
  cbox(ctx, 0, -0.5, 0.2, L + 0.02, 1.6, T + 0.8, 0.25);
  box(ctx, 0, 1.1, 0, L, H - 1.1, T);
  if (lod <= 2) { cbox(ctx, 0, 3.6, 0, L + 0.02, 0.22, T + 0.18, 0.05); }
  // buttresses outside
  const nb = Math.max(1, Math.round(L / 4));
  for (let i = 0; i < nb; i++) { const x = -L / 2 + ((i + 0.5) / nb) * L; cbox(ctx, x, 0, T / 2 + 0.45, 1.1, H - 1.2, 0.9, 0.3); }
  // parapet: merlons on both edges
  if (lod <= 3) {
    const nm = Math.max(2, Math.round(L / 1.3));
    for (const z of [-T / 2 + 0.2, T / 2 - 0.2]) for (let i = 0; i < nm; i++) { if (i % 2) continue; const x = -L / 2 + ((i + 0.5) / nm) * L; cbox(ctx, x, H, z, L / nm * 1.05, 1.05, 0.4, 0.06); }
    box(ctx, 0, H, -T / 2 + 0.2, L, 0.45, 0.4); box(ctx, 0, H, T / 2 - 0.2, L, 0.45, 0.4);
  }
  // arrow loops: dark slits on the outer face
  if (lod <= 2) { ctx.albedo(null); ctx.color("oklch(0.06 0 0)"); for (let i = 0; i < nb; i++) { const x = -L / 2 + ((i + 1) / nb) * L - L / nb / 2 + 1.4; if (Math.abs(x) > L / 2 - 0.3) continue; ctx.quad(x + 0.07, 4.6, T / 2 + 0.01, x + 0.07, 5.8, T / 2 + 0.01, x - 0.07, 5.8, T / 2 + 0.01, x - 0.07, 4.6, T / 2 + 0.01); } }
}
export function collider(ctx) { const p = ctx.params ?? {}; return { kind: "box", width: p.len ?? 8, height: p.h ?? 7, depth: 2.4, center: [0, (p.h ?? 7) / 2, 0.2] }; }
