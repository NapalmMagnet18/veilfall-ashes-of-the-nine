// Awakening lighting: a production PBR model. Over the standard Cook-Torrance it adds
//  - height-correlated Smith visibility (the shape Frostbite / UE ship)
//  - Burley diffuse: rough ground and bark get their retro-reflective lift at grazing sun
//  - multi-scatter specular energy compensation: rough metal and wet rock stop going grey-dark
//  - micro-shadowing: baked occlusion darkens direct light in crevices, not just ambient
//  - specular occlusion on the sky reflection
import { dot, max, mix, normalize, pow, clamp, float, vec3, oneMinus, sqrt, PI } from "builtin/tsl";

export function lighting(surface, lights) {
  const { albedo, normal: N, view: V, metalness, occlusion: ao } = surface;
  const roughness = clamp(surface.roughness, 0.045, 1);
  const f0 = mix(vec3(0.04), albedo, metalness);
  const NdotV = max(dot(N, V), 1e-4);
  const a = roughness.mul(roughness);
  const a2 = a.mul(a);
  const energy = float(1).add(f0.mul(a).mul(0.9)); // multi-scatter compensation, approx

  const direct = lights.each((light) => {
    const L = light.direction;
    const NdotLraw = dot(N, L);
    const NdotL = max(NdotLraw, 0);
    const H = normalize(V.add(L));
    const NdotH = max(dot(N, H), 0);
    const LdotH = max(dot(L, H), 0);
    const d = NdotH.mul(NdotH).mul(a2.sub(1)).add(1);
    const D = a2.div(max(PI.mul(d).mul(d), 1e-7));
    const gv = NdotL.mul(sqrt(NdotV.mul(NdotV).mul(oneMinus(a2)).add(a2)));
    const gl = NdotV.mul(sqrt(NdotL.mul(NdotL).mul(oneMinus(a2)).add(a2)));
    const Vis = float(0.5).div(max(gv.add(gl), 1e-5));
    const F = f0.add(oneMinus(f0).mul(pow(oneMinus(LdotH), 5)));
    const specular = D.mul(Vis).mul(F).mul(energy);
    const fd90 = float(0.5).add(roughness.mul(2).mul(LdotH).mul(LdotH));
    const fl = float(1).add(fd90.sub(1).mul(pow(oneMinus(NdotL), 5)));
    const fv = float(1).add(fd90.sub(1).mul(pow(oneMinus(NdotV), 5)));
    const diffuse = albedo.mul(oneMinus(metalness)).div(PI).mul(fl).mul(fv).mul(oneMinus(F));
    const micro = clamp(NdotLraw.abs().add(ao.mul(ao).mul(2)).sub(1), 0, 1);
    return diffuse.add(specular).mul(light.radiance).mul(NdotL).mul(micro);
  });

  const specOcc = clamp(pow(NdotV.add(ao), roughness.mul(-16).sub(1).exp2()).sub(1).add(ao), 0, 1);
  const ambient = albedo.mul(oneMinus(metalness)).add(f0).mul(lights.ambient).mul(1 / Math.PI);
  return direct.add(ambient.mul(ao)).add(lights.environment.mul(mix(ao, specOcc, 0.5)));
}
