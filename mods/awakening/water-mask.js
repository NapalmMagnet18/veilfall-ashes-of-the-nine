// Awakening: a water mask. Worn by a lid over a hull's opening (a canoe's gunwales, a boat's deck line):
// draws nothing, but fills the depth buffer in the opaque pass, so the water surface (transparent,
// depth-tested) never draws inside the hull. What sits inside was already drawn and stays.
import { vec3 } from "builtin/tsl";
import { MeshBasicNodeMaterial, DoubleSide } from "builtin/three";
export function material(ctx) {
  const m = new MeshBasicNodeMaterial();
  m.colorNode = vec3(0, 0, 0);
  m.colorWrite = false;
  m.depthWrite = true;
  m.transparent = false;
  m.side = DoubleSide;
  return m;
}
