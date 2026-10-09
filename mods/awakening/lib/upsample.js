// Awakening depth-aware upsample: a low-res pass (mist, cloud shadow) brought to full size without
// smearing across silhouettes. Each of the four nearest low-res texels is weighted by how close its
// depth is to this pixel's, so a character against a sunlit sky keeps a crisp edge instead of blocks.
import { vec2, vec4, float, screenUV } from "builtin/tsl";

export function depthUpsample(ctx, pass, size) {
  const p = screenUV.mul(size).sub(0.5);
  const i = p.floor(), f = p.sub(i);
  const z0 = ctx.viewZ.negate().max(0.05);
  const sum = vec4(0).toVar(), wsum = float(0).toVar();
  for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
    const uvT = i.add(vec2(dx, dy)).add(0.5).div(size);
    const zt = ctx.viewZAt(uvT).negate();
    const bw = (dx ? f.x : float(1).sub(f.x)).mul(dy ? f.y : float(1).sub(f.y));
    const dw = float(1).div(zt.sub(z0).abs().div(z0).mul(24).add(0.02));
    const w = bw.mul(dw).add(0.00001);
    sum.addAssign(pass.sample(uvT).mul(w));
    wsum.addAssign(w);
  }
  return sum.div(wsum);
}
