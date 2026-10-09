// A hanging thing on a pendulum: it swings from its top (the hook) in a slow wind, and a Bearer
// walking or fighting close by gives it a shove. Smoothing is frame-rate stable via Animação Viva.
import { ajusteEstavel } from "../mods/animacao-viva/lib/mistura.js";
const K = 9, DAMP = 0.6, PUSH = 40, NEAR = 2.6;
export const updateSchedule = { every: 2 };
export function onSpawn(ctx) {
  const s = ctx.self.state;
  s.ph = ctx.random() * 6.28; s.p = 0; s.r = 0; s.vp = 0; s.vr = 0;
}
export function update(ctx, dt) {
  const s = ctx.self.state, me = ctx.self.worldFeetPosition ?? ctx.self.feetPosition, t = ctx.now() / 1000;
  s.ph = s.ph ?? 0;
  // wind: two slow sines, out of phase per object
  let fp = Math.sin(t * 0.7 + s.ph) * 3 + Math.sin(t * 1.9 + s.ph * 2) * 1.2;
  let fr = Math.sin(t * 0.55 + s.ph * 1.3) * 2.5;
  for (const p of ctx.place.players) {
    const dx = p.feetPosition.x - me.x, dz = p.feetPosition.z - me.z, d = Math.hypot(dx, dz);
    if (d < NEAR && d > 0.01) {
      const k = (1 - d / NEAR) * PUSH; fp -= (dz / d) * k; fr += (dx / d) * k;
      // a ringing thing (state.ring = a clip) speaks when brushed, once in a while
      if (s.ring && ctx.now() >= (s.rungAt ?? 0)) { s.rungAt = ctx.now() + 4000; ctx.emit("playSound", { clip: s.ring, position: me, volume: 0.45, pitch: 0.95 + ctx.random() * 0.1 }); }
    }
  }
  // damped spring back to hanging straight
  s.vp = (s.vp ?? 0) + (fp - K * (s.p ?? 0)) * dt; s.vr = (s.vr ?? 0) + (fr - K * (s.r ?? 0)) * dt;
  const keep = 1 - ajusteEstavel(DAMP * 0.05, dt);
  s.vp *= keep; s.vr *= keep;
  s.p = Math.max(-28, Math.min(28, s.p + s.vp * dt * 6)); s.r = Math.max(-28, Math.min(28, s.r + s.vr * dt * 6));
  ctx.self.rotation = { yaw: s.yaw ?? 0, pitch: s.p, roll: s.r };
}
