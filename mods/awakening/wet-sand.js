// Awakening wet sand: worn by a shore band (mods/awakening/shore-band.js). Darkens the bank by how recently
// the water touched it: a damp band a hand's height above the level, and a darker, glossier strip the swash
// keeps re-wetting, in step with the lake's own swash (mods/awakening/water.js). params: level (m, world y),
// damp (m above level the damp reaches), dark (0..1 strength)
import { vec3, float, positionWorld, time, smoothstep, mx_noise_float, max, mix, cameraPosition, normalize } from "builtin/tsl";
import { MeshBasicNodeMaterial } from "builtin/three";
export function material(ctx) {
  const m = new MeshBasicNodeMaterial();
  const P = positionWorld, xz = P.xz;
  const hAbove = P.y.sub(ctx.param("level", 0.6)).sub(0.03); // the band rides 3 cm over the ground
  const lapN = mx_noise_float(vec3(xz.mul(0.16), time.mul(0.04)));
  const swash = time.mul(0.69).add(lapN.mul(2)).sin().mul(0.5).add(0.5);
  const damp = float(1).sub(smoothstep(0.0, ctx.param("damp", 0.14), hAbove));
  // the strip the swash reaches: soaked while the water's up, drying slowly after it slides back
  const fresh = float(1).sub(smoothstep(0.0, swash.mul(0.02).add(0.035), hAbove));
  const wet = max(damp.mul(0.55), fresh).mul(smoothstep(-0.03, 0.0, hAbove)); // under the water: the lake draws it
  const V = normalize(cameraPosition.sub(P));
  const sheen = fresh.mul(float(1).sub(V.y).pow(3)).mul(0.25); // soaked sand mirrors a little sky at a low angle
  m.colorNode = mix(vec3(0.05, 0.035, 0.02), vec3(0.55, 0.6, 0.62), sheen);
  m.opacityNode = wet.mul(ctx.param("dark", 0.45)).add(sheen.mul(0.3));
  m.transparent = true;
  m.depthWrite = false;
  m.polygonOffset = true; m.polygonOffsetFactor = -2; m.polygonOffsetUnits = -4;
  return m;
}
