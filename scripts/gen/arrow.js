// A Gloamstalker arrow, pointing along -Z, centred on the shaft axis at y 0: round ash shaft with a dark
// binding at each end, a barbed leaf broadhead of blued iron on a socket, three swept fletches (two black,
// one blood-red cock feather) and a pale bone nock. ~0.9 m long. lod thins sides.
export function geometry(ctx) {
  const lod = ctx.lod ?? 1, n = lod <= 1 ? 8 : 5, two = (a, b, c) => { ctx.tri(...a, ...b, ...c); ctx.tri(...a, ...c, ...b); };
  const tube = (z0, z1, r0, r1) => { for (let i = 0; i < n; i++) { const a0 = (i / n) * 6.2832, a1 = ((i + 1) / n) * 6.2832;
    ctx.quad(Math.cos(a0) * r0, Math.sin(a0) * r0, z0, Math.cos(a1) * r0, Math.sin(a1) * r0, z0, Math.cos(a1) * r1, Math.sin(a1) * r1, z1, Math.cos(a0) * r1, Math.sin(a0) * r1, z1); } };
  ctx.smooth(); ctx.metalness(0); ctx.roughness(0.75);
  ctx.color("oklch(0.42 0.05 60)"); tube(0.78, 0, 0.0085, 0.0085);                       // shaft
  ctx.color("oklch(0.2 0.02 40)"); tube(0.02, -0.005, 0.0105, 0.0105); tube(0.62, 0.58, 0.0105, 0.0105); // sinew bindings
  ctx.color("oklch(0.86 0.03 85)"); ctx.roughness(0.5); tube(0.83, 0.78, 0.0095, 0.0095);  // bone nock
  ctx.color("oklch(0.16 0.01 40)"); two([0.004, 0, 0.835], [-0.004, 0, 0.835], [0, 0, 0.81]);
  // broadhead: a socket cone, then two crossed leaf blades with back-swept barbs
  ctx.color("oklch(0.5 0.02 250)"); ctx.metalness(0.9); ctx.roughness(0.3);
  tube(0.0, -0.05, 0.011, 0.006);
  for (const rot of [0, Math.PI / 2]) { const c = Math.cos(rot), s = Math.sin(rot), P = (x, z) => [x * c, x * s, z];
    two(P(0, -0.17), P(0.028, -0.07), P(0, -0.04)); two(P(0, -0.17), P(-0.028, -0.07), P(0, -0.04));
    two(P(0.028, -0.07), P(0.022, -0.015), P(0, -0.04)); two(P(-0.028, -0.07), P(-0.022, -0.015), P(0, -0.04)); // barbs
    ctx.color("oklch(0.8 0.01 250)"); two(P(0, -0.17), P(0.004, -0.09), P(-0.004, -0.09)); ctx.color("oklch(0.5 0.02 250)"); } // honed edge glint
  // fletches: three vanes swept back and curved, the cock feather red
  ctx.metalness(0); ctx.roughness(0.9);
  for (let k = 0; k < 3; k++) { const a = (k / 3) * 6.2832 + Math.PI / 2, c = Math.cos(a), s = Math.sin(a), tw = 0.04;
    ctx.color(k === 0 ? "oklch(0.38 0.14 25)" : "oklch(0.18 0.01 40)");
    const seg = lod <= 1 ? 4 : 2; let prev = null;
    for (let i = 0; i <= seg; i++) { const t = i / seg, z = 0.56 + t * 0.19, h = 0.008 + Math.sin(Math.min(1, t * 1.15) * Math.PI * 0.5) * 0.034 * (t < 0.92 ? 1 : 0.6), tws = (t - 0.5) * tw;
      const root = [c * 0.008 - s * tws * 0.2, s * 0.008 + c * tws * 0.2, z], edge = [c * h - s * tws, s * h + c * tws, z - (1 - t) * 0.02];
      if (prev) { two(prev[0], root, edge); two(prev[0], edge, prev[1]); } prev = [root, edge]; } }
}
