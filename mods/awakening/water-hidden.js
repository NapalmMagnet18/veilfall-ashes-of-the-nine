// Awakening: hides a liquid mark's stock surface where an Awakening water sheet draws the water instead.
// Swimming, buoyancy and the liquid's sound stay the mark's. Worn as the mark's liquid.material.
import { float, vec3 } from "builtin/tsl";
import { MeshBasicNodeMaterial } from "builtin/three";
export function material(ctx) {
  const m = new MeshBasicNodeMaterial();
  m.colorNode = vec3(0, 0, 0);
  m.opacityNode = float(0);
  m.transparent = true;
  m.depthWrite = false;
  return m;
}
