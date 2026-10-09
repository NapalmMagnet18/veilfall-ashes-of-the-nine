// Awakening waterfall boil material: the froth where the fall lands, solid and depth-writing so the pool
// water drawn after it never covers it. Geometry: waterfall.js with part: "skirt". Material: lib/fall-material.js.
import { fallMaterial } from "./lib/fall-material.js";
export function material(ctx) { return fallMaterial(ctx, true); }
