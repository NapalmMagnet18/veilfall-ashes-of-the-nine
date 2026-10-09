// Awakening water surface: what touches the water shows on it. Rides a water sheet (material
// mods/awakening/water.js). Anyone wading or swimming leaves rings in their wake; falling in splashes;
// anything else that strikes it emits "awakening:water-impact" { x, z, strength, big } and this ear
// rings the water, throws the spray and plays the sound. state: level (m), radius (m around the feet).
const SLOTS = 24;
import { shed, strength } from "./lib/trail.js";
const PLUNK = "/cdn/moodboard-realistic-gritty/sfx-pebble-plunk-into-lake.mp3";
const SPLASH_SOUND = "/cdn/moodboard-realistic-gritty/sfx-soft-muffled-body-slipping-into-calm-lake-gentle-water-swirl.mp3";
const SPRAY = `fx
pop drops burst=%n|18 life=.45..1 on=disc(.12) v=up(2.2..4.2)*%s|1+sdir()*(.5..1.3) size=.025..0.06 acc=grav() col=<.82,.9,.93> a=.85>0 floor=die r=sprite(soft-disc,alpha)
pop crown burst=%c|10 life=.3..0.55 on=disc(.08) v=up(1.2..2)*%s|1+sdir()*(.8..1.2) size=.05..0.1 acc=grav()*.8 col=<.9,.95,.97> a=.7>0 sz=$size*(1>.4) r=sprite(soft-disc,alpha)
pop mist burst=4 life=.6..1 on=disc(.25) v=up(.4..0.9)+sdir()*.3 size=.3..0.55 acc=drag(1.6) col=<.9,.94,.96> a=0>.22:.35>0 sz=$size*(.6>1.7) r=sprite(smoke-puff,alpha)`;
const seen = new Map(); // per swimmer: last position, last ring, wet — this machine's scratch

const clock = (ctx) => (ctx.now() / 1000) % 3600; // the shader's own clock (time)

function ring(ctx, x, z, a) {
  const s = ctx.self, i = (s.state.next ?? 0) % SLOTS;
  s.state.next = i + 1;
  const p = s.material.params;
  p[`r${i}x`] = Math.round(x * 100) / 100; p[`r${i}z`] = Math.round(z * 100) / 100;
  p[`r${i}a`] = Math.round(a * 100) / 100; p[`r${i}t`] = Math.round(clock(ctx) * 1000) / 1000;
}

function impact(ctx, e) {
  const L = ctx.self.state.level ?? 0.6, st = Math.max(0.1, Math.min(1.6, e.strength ?? 0.6));
  ring(ctx, e.x, e.z, st);
  const pos = { x: e.x, y: L, z: e.z };
  ctx.emit("fx", { position: pos, script: SPRAY, params: { n: e.big ? 60 : Math.round(10 + st * 14), c: e.big ? 26 : 8, s: e.big ? 1.3 : 0.6 + st * 0.4 } });
  ctx.emit("playSound", { clip: e.big ? SPLASH_SOUND : PLUNK, position: pos, volume: e.big ? 0.22 + Math.min(1, st / 1.6) * 0.2 : 0.2 + st * 0.2, pitch: e.big ? 0.88 + ctx.random() * 0.12 : 0.9 + ctx.random() * 0.3, maxDistance: e.big ? 35 : 45 });
}

export const ears = {
  "awakening:water-impact": (ctx, e) => impact(ctx, e ?? {}),
  // a quiet ring, no spray or sound: a boat's wake, a paddle's dip ("awakening:water-ring" { x, z, strength })
  "awakening:water-ring": (ctx, e) => { if (e && Number.isFinite(e.x)) ring(ctx, e.x, e.z, Math.max(0.05, Math.min(1.2, e.strength ?? 0.4))); },
};

export function update(ctx) {
  const s = ctx.self, L = s.state.level ?? 0.6, R = s.state.radius ?? 50, c = s.feetPosition, now = ctx.now();
  let near = false;
  for (const p of ctx.place.players) {
    const f = p.feetPosition; if (!f) continue;
    const dx = f.x - c.x, dz = f.z - c.z, d2 = dx * dx + dz * dz;
    if (d2 > (R + 120) ** 2) continue;
    near = true;
    const g = d2 < R * R ? ctx.place.terrain.heightAt(f.x, f.z) : null;
    const wet = g != null && g < L - 0.12 && f.y < L + 0.25 && f.y > g - 0.6;
    const m = seen.get(p.id) ?? { x: f.x, y: f.y, z: f.z, at: now, drop: 0, wet };
    const sec = Math.max(0.001, (now - m.at) / 1000);
    const sp = Math.hypot(f.x - m.x, f.z - m.z) / sec, vy = (f.y - m.y) / sec;
    if (wet) {
      if (!m.wet && vy < -3) { impact(ctx, { x: f.x, z: f.z, strength: Math.min(1.6, 0.7 - vy * 0.08), big: true }); m.drop = now; }
      // moving through it, the swimmer's own machine sheds the wave trail (wade); still, still water stays glass
    }
    m.wet = wet; m.x = f.x; m.y = f.y; m.z = f.z; m.at = now;
    seen.set(p.id, m);
  }
  if (!near) ctx.sleep(1);
}

// A swimmer's wave trail on still water, written from the swimmer's OWN body on its own machine (scripts/player.js
// calls this from update), slot = its place among the place's players by id; the boat keeps the last (canoe.js).
// No current: the water past the body is the body's own motion, reversed.
export { wadeLake as wade } from "./lib/wade.js";
