// A clover: a plant file (heightmap-terrain skill, decorations). The `clover` layer in
// places/main/config.yaml scatters it low on the grass between the blades, sized by the item's
// `scale` and turned by `randomRotation`; with `useTerrainColor` on the item it wears the ground's
// own colour, so a blue-grey meadow grows blue-grey clover. Feet at y = 0, +Y up: one short stem
// quad and three leaflets, each a diamond quad facing the sky. Every number here is yours to move.
export function geometry(ctx) {
  const { leaf = 'oklch(0.55 0.13 145)' } = ctx.params;
  ctx.color(leaf);
  const h = 0.07;
  const w = 0.006;
  ctx.quad(-w, 0, 0, w, 0, 0, w * 0.6, h, 0, -w * 0.6, h, 0);
  for (let i = 0; i < 3; i++) {
    const t = (i / 3) * Math.PI * 2 + 0.3;
    const rx = Math.cos(t);
    const rz = Math.sin(t);
    const P = (radius, side, y) => [rx * radius - rz * side, y, rz * radius + rx * side];
    const near = P(0.008, 0, h);
    const left = P(0.019, 0.014, h + 0.006);
    const far = P(0.03, 0, h + 0.01);
    const right = P(0.019, -0.014, h + 0.006);
    ctx.quad(near[0], near[1], near[2], left[0], left[1], left[2], far[0], far[1], far[2], right[0], right[1], right[2]);
  }
}
