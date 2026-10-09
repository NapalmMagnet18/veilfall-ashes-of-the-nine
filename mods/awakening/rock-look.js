// Awakening rock material: the baked macro (lichen, moss, AO-dark joints, mid-scale dents) married to the
// Awakening 2K granite set tiled over it, so a rock reads from the valley AND at arm's length.
// The rock's UVs keep one texel density (art/rocks/granite2.py), so uv() * (metres per UV / tile) tiles
// the detail at a steady size in metres; the detail normal is whiteout-blended over the baked normal in
// the same tangent frame. params: albedo, normal (the bakes), uvMetres, tile, detail, rough.
import { uv, vec2, float, vec3, mix, normalMap, positionWorld, mx_noise_float } from "builtin/tsl";
import { MeshStandardNodeMaterial } from "builtin/three";

const GRANITE = {
  albedo: "/cdn/value.e3c1edd69b5764ddb1ff46d4cdbbe815712cd4813adfcb650f1ad13ab836d678.jpg",
  normal: "/cdn/value.9788d865cf32bb96a00e58045cc3cd2d35ea4bbc8f6ed517b62e28aec9db6385.jpg",
  rough: "/cdn/value.5231244c238d6c3fec105331523ff42ca694f93c2a6de0b4707f23044e9e819f.jpg",
};
const GRANITE_MEAN = 0.458; // the detail albedo's mean: dividing by it keeps the bake's value

export function material(ctx) {
  const m = new MeshStandardNodeMaterial();
  const p = ctx.params;
  const t = uv();
  // the bakes ride as plain textures (flipY) while the mesh UVs are glTF's: flip V back onto them
  const u = vec2(t.x, float(1).sub(t.y));
  const reps = ctx.param("uvMetres", 5).div(ctx.param("tile", 1.8));
  const d = t.mul(reps);
  const d2 = t.mul(reps.mul(0.37)).add(0.31); // a second, larger tap breaks the repeat
  const macro = ctx.texture(p.albedo).sample(u).rgb;
  const gA = ctx.texture(GRANITE.albedo);
  const det = mix(gA.sample(d).rgb, gA.sample(d2).rgb, 0.35).div(GRANITE_MEAN);
  const k = ctx.param("detail", 1);
  const warm = vec3(1.0, 1.0, 0.97); // warm grey granite, never blue-cold
  const drift = mx_noise_float(positionWorld.mul(0.35)).mul(0.08).add(1);
  m.colorNode = macro.mul(mix(vec3(1, 1, 1), det, k)).mul(warm).mul(drift).mul(ctx.param("value", 0.62));
  // whiteout blend: baked (mid dents) + granite grain, both tangent-space
  const a = ctx.texture(p.normal).sample(u).rgb.mul(2).sub(1);
  const b = ctx.texture(GRANITE.normal).sample(d).rgb.mul(2).sub(1).mul(vec3(k, k, 1));
  const n = vec3(a.x.add(b.x), a.y.add(b.y), a.z.mul(b.z)).normalize();
  m.normalNode = normalMap(n.mul(0.5).add(0.5), ctx.param("normalStrength", 1.2));
  m.roughnessNode = ctx.texture(GRANITE.rough).sample(d).r.mul(0.35).add(ctx.param("rough", 0.62));
  m.metalnessNode = vec3(0).x;
  return m;
}
