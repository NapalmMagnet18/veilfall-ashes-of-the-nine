// Awakening river surface: what touches a river shows on it, carried off by the current. Rides a river sheet
// (primitive mods/awakening/river-sheet.js, material mods/awakening/river.js). Anyone wading or swimming leaves
// rings in their wake that drift downstream; falling in splashes; "awakening:water-impact" { x, z, strength, big }
// and "awakening:water-ring" { x, z, strength } ring it as they ring the lake.
// The level is read off the sheet's own centreline (its pts param), so a stepped river is wet at every step.
// A body standing or wading in the current holds a live wake slot (river.js BODIES: b<i>…): where it is, how
// fast it moves, and the water past it (current minus its own motion); the shader throws its Kelvin wake from that.
// state: halfWidth (m of wet water either side of the centreline, default 4), drift (surface m/s, default 1.4)
import { SLOTS } from "./lib/water-material.js";
import { BODIES, TRAIL_BODIES } from "./lib/river-slots.js";
import { shed as shedSource, strength, streamSpeed } from "./lib/trail.js";
const PLUNK = "/cdn/moodboard-realistic-gritty/sfx-pebble-plunk-into-lake.mp3";
const SPLASH_SOUND = "/cdn/moodboard-realistic-gritty/sfx-soft-muffled-body-slipping-into-calm-lake-gentle-water-swirl.mp3";
const SPRAY = `fx
pop drops burst=%n|18 life=.45..1 on=disc(.12) v=up(2.2..4.2)*%s|1+sdir()*(.5..1.3) size=.025..0.06 acc=grav() col=<.82,.9,.93> a=.85>0 floor=die r=sprite(soft-disc,alpha)
pop crown burst=%c|10 life=.3..0.55 on=disc(.08) v=up(1.2..2)*%s|1+sdir()*(.8..1.2) size=.05..0.1 acc=grav()*.8 col=<.9,.95,.97> a=.7>0 sz=$size*(1>.4) r=sprite(soft-disc,alpha)
pop mist burst=4 life=.6..1 on=disc(.25) v=up(.4..0.9)+sdir()*.3 size=.3..0.55 acc=drag(1.6) col=<.9,.94,.96> a=0>.22:.35>0 sz=$size*(.6>1.7) r=sprite(smoke-puff,alpha)`;
const seen = new Map(); // per wader: last position, last ring, wet (this machine's scratch)
let line = null, lineKey = null; // the centreline in world space, rebuilt when the sheet's pts change

export const updateSchedule = { every: 1 }; // the wake rides the wader: every tick while someone is near
const clock = (ctx) => (ctx.now() / 1000) % 3600; // the shader's own clock (time)

function centreline(ctx) {
  const s = ctx.self, pts = String(s.primitive?.params?.pts ?? ""), f = s.feetPosition;
  const key = pts + "|" + f.x + "," + f.y + "," + f.z;
  if (key !== lineKey) {
    lineKey = key;
    line = pts.split(";").filter(Boolean).map((t) => { const [x, y, z] = t.split(",").map(Number); return { x: x + f.x, y: y + f.y, z: z + f.z }; });
  }
  return line;
}

// nearest point on the centreline: { d (m off it), y (water level), tx, tz (downstream) }
function nearest(ctx, x, z) {
  const L = centreline(ctx); let best = null;
  for (let i = 1; i < L.length; i++) {
    const a = L[i - 1], b = L[i], ex = b.x - a.x, ez = b.z - a.z, e2 = ex * ex + ez * ez || 1e-6;
    const u = Math.max(0, Math.min(1, ((x - a.x) * ex + (z - a.z) * ez) / e2));
    const px = a.x + ex * u, pz = a.z + ez * u, d = Math.hypot(x - px, z - pz);
    if (!best || d < best.d) { const el = Math.sqrt(e2); best = { d, y: a.y + (b.y - a.y) * u, tx: ex / el, tz: ez / el }; }
  }
  return best;
}

function ring(ctx, x, z, a) {
  const s = ctx.self, i = (s.state.next ?? 0) % SLOTS, n = nearest(ctx, x, z);
  s.state.next = i + 1;
  const dr = n && n.d < (s.state.halfWidth ?? 4) + 1 ? (s.state.drift ?? 1.4) : 0;
  const p = s.material.params, r2 = (v) => Math.round(v * 100) / 100;
  p[`r${i}x`] = r2(x); p[`r${i}z`] = r2(z); p[`r${i}a`] = r2(a);
  p[`r${i}u`] = r2((n?.tx ?? 0) * dr); p[`r${i}w`] = r2((n?.tz ?? 0) * dr); // the current carries it off
  p[`r${i}t`] = Math.round(clock(ctx) * 1000) / 1000;
}

function impact(ctx, e) {
  const st = Math.max(0.1, Math.min(1.6, e.strength ?? 0.6)), n = nearest(ctx, e.x, e.z);
  if (!n || n.d > (ctx.self.state.halfWidth ?? 4) + 1) return; // not this river's water
  ring(ctx, e.x, e.z, st);
  const pos = { x: e.x, y: n.y, z: e.z };
  ctx.emit("fx", { position: pos, script: SPRAY, params: { n: e.big ? 60 : Math.round(10 + st * 14), c: e.big ? 26 : 8, s: e.big ? 1.3 : 0.6 + st * 0.4 } });
  ctx.emit("playSound", { clip: e.big ? SPLASH_SOUND : PLUNK, position: pos, volume: e.big ? 0.22 + Math.min(1, st / 1.6) * 0.2 : 0.2 + st * 0.2, pitch: e.big ? 0.88 + ctx.random() * 0.12 : 0.9 + ctx.random() * 0.3, maxDistance: e.big ? 35 : 45 });
}

export const ears = {
  "awakening:water-impact": (ctx, e) => { if (e && Number.isFinite(e.x)) impact(ctx, e); },
  "awakening:water-ring": (ctx, e) => {
    if (!e || !Number.isFinite(e.x)) return;
    const n = nearest(ctx, e.x, e.z);
    if (n && n.d < (ctx.self.state.halfWidth ?? 4) + 1) ring(ctx, e.x, e.z, Math.max(0.05, Math.min(1.2, e.strength ?? 0.4)));
  },
};

export function update(ctx) {
  const s = ctx.self, HW = s.state.halfWidth ?? 4, now = ctx.now();
  let near = false; const wakes = [];
  for (const p of ctx.place.players) {
    const f = p.feetPosition; if (!f) continue;
    const n = nearest(ctx, f.x, f.z);
    if (!n || n.d > HW + 60) continue;
    near = true;
    const g = n.d < HW ? ctx.place.terrain.heightAt(f.x, f.z) : null;
    const wet = g != null && g < n.y - 0.1 && f.y < n.y + 0.3 && f.y > g - 0.6;
    const m = seen.get(p.id) ?? { x: f.x, y: f.y, z: f.z, at: now, drop: 0, wet };
    const sec = Math.max(0.001, (now - m.at) / 1000);
    const sp = Math.hypot(f.x - m.x, f.z - m.z) / sec, vy = (f.y - m.y) / sec;
    const vx = (f.x - m.x) / sec, vz = (f.z - m.z) / sec;
    const k = 1 - Math.exp(-sec / 0.22); // steadied over ~a fifth of a second: a stride is not a lurch, a turn still reads
    m.vx = (m.vx ?? vx) + (vx - (m.vx ?? vx)) * k; m.vz = (m.vz ?? vz) + (vz - (m.vz ?? vz)) * k;
    if (wet) {
      if (!m.wet && vy < -3) { impact(ctx, { x: f.x, z: f.z, strength: Math.min(1.6, 0.7 - vy * 0.08), big: true }); m.drop = now; }
      // the wader's own machine sheds its wave trail (wade); the splash of falling in stays here
      const cur = s.state.drift ?? 1.4;
      wakes.push({ x: f.x, z: f.z, v: m.vx, n: m.vz, u: n.tx * cur - m.vx, w: n.tz * cur - m.vz, r: 0.3 });
    }
    m.wet = wet; m.x = f.x; m.y = f.y; m.z = f.z; m.at = now;
    seen.set(p.id, m);
  }
  // the wake slots are the waders' own to write (wade, from their bodies); this keeps the rings and splashes
  if (!near) ctx.sleep(1);
}

// A wader's wake slot, written from the wader's OWN body on its own machine (scripts/player.js calls this from
// update): the water hears where this screen draws the body and how the body moves this tick, no round trip.
// Slot = the body's place among the place's players by id, so every machine agrees who holds which.
export { wadeRiver as wade } from "./lib/wade.js"; // returns true while the body is wet in this river
