// A mushroom: a plant file (heightmap-terrain skill, decorations). The `mushroom` layer in
// places/main/config.yaml scatters it thinly on the grass, sized by the item's `scale` and turned by
// `randomRotation`; the item's `params` colour it (cap, stem). Feet at y = 0, +Y up: a four-sided
// stem and an eight-sided cap that closes underneath, so it reads from the ground and from above.
// Every number here is yours to move.
export function geometry(ctx) {
  const { cap = '#c0452b', stem = '#f1e7d2' } = ctx.params;
  const stemH = 0.07;
  const stemR = 0.012;
  ctx.color(stem);
  for (let i = 0; i < 4; i++) {
    const t0 = (i / 4) * Math.PI * 2;
    const t1 = ((i + 1) / 4) * Math.PI * 2;
    ctx.quad(Math.cos(t0) * stemR, 0, Math.sin(t0) * stemR, Math.cos(t0) * stemR, stemH, Math.sin(t0) * stemR, Math.cos(t1) * stemR, stemH, Math.sin(t1) * stemR, Math.cos(t1) * stemR, 0, Math.sin(t1) * stemR);
  }
  ctx.color(cap);
  const capR = 0.05;
  const brim = stemH - 0.005;
  const apex = stemH + 0.04;
  for (let i = 0; i < 8; i++) {
    const t0 = (i / 8) * Math.PI * 2;
    const t1 = ((i + 1) / 8) * Math.PI * 2;
    const a = [Math.cos(t0) * capR, brim, Math.sin(t0) * capR];
    const b = [Math.cos(t1) * capR, brim, Math.sin(t1) * capR];
    ctx.tri(a[0], a[1], a[2], 0, apex, 0, b[0], b[1], b[2]);
    ctx.tri(a[0], a[1], a[2], b[0], b[1], b[2], 0, stemH, 0);
  }
}
