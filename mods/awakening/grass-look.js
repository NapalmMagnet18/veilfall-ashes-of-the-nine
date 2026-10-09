// Awakening grass material: each blade's own hue (vertex colour from grass.js) married to the 2K ground
// under its feet, per-clump hue/value drift, dark roots, bright tips, a dry cast on some clumps, a
// soft sheen, and sun transmission through blades seen against the sun.
import { mix, hash, vec2, vec3, cameraPosition, positionWorld, vertexColor } from "builtin/tsl";
import { sunDirection, sunRadiance } from "builtin/lighting";
import { MeshStandardNodeMaterial } from "builtin/three";

export function material(ctx) {
  const m = new MeshStandardNodeMaterial();
  const ground = ctx.scatter.groundTint;
  const feet = ctx.scatter.position;
  const h = ctx.scatter.heightFraction;
  const own = vertexColor().rgb;
  const cell = vec2(feet.x, feet.z).div(2.2).floor();
  const clumpHue = hash(cell.x.mul(157).add(cell.y.mul(311)));
  const clumpValue = hash(cell.x.mul(97).add(cell.y.mul(53)).add(7));
  const dry = hash(cell.x.mul(13).add(cell.y.mul(71)).add(3)).pow(3);
  const base = mix(ground.mul(1.25), own, 0.6);
  const clump = base.mul(mix(vec3(1.1, 1.0, 0.82), vec3(0.9, 1.02, 1.08), clumpHue)).mul(mix(0.82, 1.18, clumpValue));
  const root = clump.mul(0.28);
  const tip = mix(clump.mul(1.55), vec3(0.6, 0.5, 0.3), dry.mul(h).mul(0.55));
  m.colorNode = mix(root, tip, h.pow(0.9));
  m.roughnessNode = mix(0.9, 0.45, h.pow(1.5));
  const toEye = cameraPosition.sub(positionWorld).normalize();
  const through = toEye.negate().dot(sunDirection).saturate().pow(4);
  m.emissiveNode = tip.mul(sunRadiance).mul(through).mul(h.pow(1.4)).mul(0.45);
  return m;
}
