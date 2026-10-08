// Brother Ledd, the board's crier: walks a slow loop through the Wayside camp with a lantern, and when a
// Bearer is near he stops, rings a handbell and calls the board's newest notice (item, price, who pinned it).
// He reads the trades table himself; nothing writes to him. One voice per call, never more than every 18 s.
import { fmt } from "./lib/coins.js";
import * as CH from "./lib/character.js";
const LOOP = [{ x: 3.2, z: 7.4 }, { x: -2.5, z: 8.6 }, { x: -6.8, z: 3.2 }, { x: -3.2, z: -1.8 }, { x: 3.5, z: -2.6 }, { x: 6.6, z: 2.2 }];
const WALK = 0.95, EAR = 16, GAP = 18000;
const V = (line) => `/cdn/voice-brother-ledd-hoarse-old-town-crier-saying-${line}.mp3`;
const CALLS = [V("hear-ye-fresh-notice-on-the-pilgrims-board"), V("wares-pinned-by-the-fire-come-and-read"), V("a-bearer-sells-come-look-before-the-road-takes-it"), V("new-on-the-board-coin-for-steel")];
const BARE = [V("the-board-stands-bare-pin-your-spoils-by-the-fire"), V("nothing-on-the-board-tonight-the-road-was-cruel")];
const BELL = "/cdn/moodboard-gothic-horror/sfx-small-iron-handbell-two-rings.mp3";
const me = { leg: 0, pause: 0, callAt: 0, seen: 0, n: 0 };
export function onSpawn(ctx) { ctx.self.state.turnTo = "none"; }
async function call(ctx, listener) {
  const f = ctx.self.feetPosition, at = { x: f.x, y: f.y + 2.3, z: f.z };
  let row = null;
  try {
    const { rows } = await ctx.sql`SELECT id, seller_name, item, price FROM trades WHERE realm = ${CH.realmOf(ctx).room} AND sold_at IS NULL AND removed = 0 ORDER BY id DESC LIMIT 4`;
    row = rows.find((r) => r.id > me.seen) ?? rows[me.n % Math.max(1, rows.length)] ?? null;
    if (row) me.seen = Math.max(me.seen, row.id);
  } catch (e) { ctx.log("crier read failed", String(e)); }
  me.n++;
  const aud = { audience: { nearby: f, radius: EAR + 6 } };
  ctx.emit("playSound", { clip: BELL, position: at, volume: 0.55 }, aud);
  ctx.emit("playSound", { clip: row ? CALLS[me.n % CALLS.length] : BARE[me.n % BARE.length], position: at, volume: 0.9, maxDistance: EAR + 6 }, aud);
  const text = row ? (() => { const it = JSON.parse(row.item); return `${it.n} · ${fmt(row.price)} · from ${row.seller_name}`; })() : "The board stands bare";
  ctx.log("crier call", { text });
  ctx.emit("damageNumber", { position: at, text, color: row ? "#f2d38a" : "#b9ae98", size: 0.9, lifetime: 4 }, aud);
  ctx.self.anim.talk = { clip: "cdn/clip-wave.glb", weight: 4, loop: "once", mask: { from: "Spine" } };
  ctx.after(2.4, "quiet");
}
export function quiet(ctx) { ctx.self.anim.talk = null; }
export function update(ctx, dt) {
  const now = ctx.now(), f = ctx.self.feetPosition, vy = ctx.self.velocity?.y ?? 0;
  let near = null, best = EAR;
  for (const p of ctx.place.players) { if (p.state?.menu) continue; const d = Math.hypot(p.feetPosition.x - f.x, p.feetPosition.z - f.z); if (d < best) { best = d; near = p; } }
  if (!near) { ctx.self.velocity = { x: 0, y: vy, z: 0 }; ctx.sleep(2); return; } // nobody to hear him: he stands
  if (now - me.callAt > GAP && best < 11) {
    me.callAt = now; me.pause = now + 4200; call(ctx, near);
    ctx.self.rotation = { yaw: (Math.atan2(-(near.feetPosition.x - f.x), -(near.feetPosition.z - f.z)) * 180) / Math.PI };
  }
  if (now < me.pause) { ctx.self.velocity = { x: 0, y: vy, z: 0 }; return; }
  const g = LOOP[me.leg], dx = g.x - f.x, dz = g.z - f.z, d = Math.hypot(dx, dz);
  if (d < 0.5) { me.leg = (me.leg + 1) % LOOP.length; me.pause = now + 2500 + ctx.random() * 2500; ctx.self.velocity = { x: 0, y: vy, z: 0 }; return; }
  ctx.self.velocity = { x: (dx / d) * WALK, y: vy, z: (dz / d) * WALK };
  ctx.self.rotation = { yaw: (Math.atan2(-dx, -dz) * 180) / Math.PI };
}
