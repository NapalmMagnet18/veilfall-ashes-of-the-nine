// The Deacon's censer rocks on its chains: one looping tween, set once, no per-tick work.
import { animate } from "builtin/tween";
export function onSpawn(ctx) {
  const s = ctx.self, ph = ctx.random() * 0.6;
  s.rotation = { yaw: 0, pitch: -22, roll: 0 };
  animate(ctx, s, { "rotation.pitch": 22 }, { duration: 1.1, delay: ph, easing: "easeInOutSine", direction: "alternate", loop: true });
}
