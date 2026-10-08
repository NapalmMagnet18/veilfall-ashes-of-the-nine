// The Lanternmere causeway: runs of mossy stepping-slabs and rotted plank boardwalk laid over the black water.
// params.segs: [{ kind: "slab" | "plank", pts: [[x, z], ...] (local), w }]. Wade-through: no collider.
import { kit, rng } from "./vf-kit.js";
import { plankRun, slabRun } from "./fen-kit.js";
export function geometry(ctx) {
  const K = kit(ctx), r = rng(ctx.params.seed ?? 21), L = ctx.lod;
  for (const s of ctx.params.segs ?? []) {
    if (s.kind === "plank") plankRun(ctx, K, r, s.pts, s.w ?? 2.2, 0.24, L);
    else slabRun(ctx, K, r, s.pts, s.w ?? 1.3, 0.17, L);
  }
}
export function collider() { return null; }
