// Blood fern sway: the GPU bends every frond of a scripts/gen/bw-floor.js "fern" set. The geometry writes
// each vertex's place along its frond into uv().y (0 at the heart, 1 at the tip), so the heart stays
// planted and only the tips ride the wind; uv().x is the leaflet's shade (the fold's vein side and the midrib
// darker), so each pinna reads as a folded leaf, not a flat red chip. Phase runs across the world, so a gust rolls through a bank.
import { vec3, uv, time, positionLocal, positionWorld, color, mix } from "builtin/tsl";
import { MeshStandardNodeMaterial } from "builtin/three";
export function material(ctx) {
  const m = new MeshStandardNodeMaterial();
  const w = uv().y.pow(1.6);
  const ph = positionWorld.x.mul(0.45).add(positionWorld.z.mul(0.3));
  const t = time.mul(ctx.param("speed", 1.3));
  const gust = t.mul(0.37).add(ph.mul(0.2)).sin().mul(0.5).add(0.5);
  const sx = t.add(ph).sin().mul(0.6).add(t.mul(2.3).add(ph.mul(1.7)).sin().mul(0.25));
  const sz = t.mul(0.8).add(ph.mul(1.3)).sin().mul(0.4);
  const amp = ctx.param("strength", 0.07).mul(gust.mul(0.7).add(0.3)).mul(w);
  m.positionNode = positionLocal.add(vec3(sx.mul(amp), sx.abs().mul(amp).mul(-0.3), sz.mul(amp)));
  const ramp = mix(color("oklch(0.13 0.03 20)"), color("oklch(0.4 0.15 26)"), uv().y.pow(0.8));
  m.colorNode = ramp.mul(uv().x.mul(0.6).add(0.4));
  m.roughness = 0.62;
  return m;
}
