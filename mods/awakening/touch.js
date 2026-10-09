// Awakening touch: one call from a player's own behavior wakes whatever Awakening water the body stands in.
//   import { touchWater } from "../mods/awakening/touch.js";
//   update(ctx, dt) { … if (ctx.self.isLocal) touchWater(ctx, ctx.self); }
// The rules live in lib/wade.js.
export { touchWater } from "./lib/wade.js";
