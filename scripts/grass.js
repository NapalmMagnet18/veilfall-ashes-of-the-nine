// The meadow's blade: the plant IS this file (heightmap-terrain skill, decorations). The layer in
// places/main/config.yaml scatters it 50 to the square metre on the grass material, varies each
// blade's size by the item's `scale`, turns each one by `randomRotation`, bends it in the wind by
// the item's `wind`, and hands its look to scripts/grass-look.js. Rewrite the shape here and every
// blade changes live; delete the layer and the meadow is gone.
// One blade, feet at y = 0, +Y up: two planes crossed at the root, so the blade reads from every
// heading (one plane seen edge-on vanishes); each plane is one quad, wide at the foot, narrow at
// the tip, leaning a little forward. Four triangles a blade. The engine bends it about its feet;
// each vertex takes the bend in proportion to its height: ctx.sway(w) sets that fraction by hand
// for wheat heads and reeds. The vertex colour is the fallback when no look script is set.
export function geometry(ctx) {
  const h = 0.55;
  const w = 0.04;
  const tip = 0.15;
  const lean = 0.08;
  const lod = ctx.lod ?? 1;
  const segs = lod <= 1 ? 3 : lod === 2 ? 2 : 1; // near blades curve and taper in steps; far ones stay one quad
  ctx.color('oklch(0.62 0.14 140)');
  // Plane 0 faces +Z; plane 1 is the same quad turned 90 degrees about +Y. Each rises, narrows, and arches
  // forward harder toward the tip, the way a real blade bows under its own weight.
  for (let p = 0; p < 2; p++) {
    const v = (x, y, z) => (p === 0 ? [x, y, z] : [z, y, -x]);
    for (let s = 0; s < segs; s++) {
      const t0 = s / segs, t1 = (s + 1) / segs;
      const W = (t) => w * (1 - (1 - tip) * Math.pow(t, 0.8));
      const Y = (t) => h * (t - 0.12 * t * t * (segs > 1 ? 1 : 0));
      const Z = (t) => lean * (segs > 1 ? 1.7 * t * t : t);
      const a = v(-W(t0), Y(t0), Z(t0));
      const b = v(W(t0), Y(t0), Z(t0));
      const c = v(W(t1), Y(t1), Z(t1));
      const d = v(-W(t1), Y(t1), Z(t1));
      ctx.quad(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2], d[0], d[1], d[2]);
    }
  }
}
