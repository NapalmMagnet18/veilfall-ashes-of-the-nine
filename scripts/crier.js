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
const SOLD = [V("bearer-your-notice-sold-your-coin-waits-at-the-board"), V("hear-ye-a-buyer-took-your-wares-collect-your-due")];
const FALL = { // boss → [name he calls, voice line]
  bailiff: ["The Bailiff of the Dripping Gate", V("hear-ye-the-bailiff-of-the-dripping-gate-is-fallen-the-toll-road-is-free")],
  ringer: ["The Ringer of the Ninth Bell", V("hear-ye-the-ninth-bell-is-silenced-the-abbey-sleeps")],
  warden: ["The Lantern Warden", V("hear-ye-the-lantern-warden-is-snuffed-the-fen-sees-again")],
  hangman: ["The Hangman of Saint Corvin", V("hear-ye-the-hangman-swings-no-more-cut-the-ropes")],
};
const MARKED = { // boss mark worn → [what he sees, voice line]
  bailiff: ["the Bailiff's Toll on your steel. may it never be paid in blood again", V("thats-the-bailiffs-toll-on-you-may-it-never-be-paid-in-blood-again")],
  ringer: ["the Ninth Bell's peal rides your blade. I hear it ringing still", V("the-ninth-bells-peal-rides-your-blade-i-hear-it-ringing-still")],
  warden: ["you carry the Warden's Lantern. cold light, but it is yours now", V("you-carry-the-wardens-lantern-cold-light-but-it-is-yours-now")],
  hangman: ["the Hangman's Knot on you. mind it does not tighten", V("the-hangmans-knot-on-you-mind-it-does-not-tighten")],
};
const TOLL = "/cdn/moodboard-gothic-horror/sfx-iron-handbell-rung-hard-many-times-urgent.mp3";
function herald(ctx, fall) {
  const f = ctx.self.feetPosition, at = { x: f.x, y: f.y + 2.4, z: f.z }, [name, line] = FALL[fall.boss] ?? ["A great evil", V("hear-ye-a-great-evil-has-fallen")];
  const who = fall.by?.length ? fall.by.join(" & ") : "a nameless Bearer";
  const aud = { audience: { nearby: f, radius: 40 } };
  ctx.emit("playSound", { clip: TOLL, position: at, volume: 0.9, maxDistance: 40 }, aud);
  ctx.emit("playSound", { clip: line, position: at, volume: 1, maxDistance: 40 }, aud);
  ctx.emit("damageNumber", { position: at, text: (ctx.self.state.lastCall = `${name} has fallen · slain by ${who}`), color: "#ff9a6a", size: 2.2, lifetime: 7 }, aud);
  ctx.self.anim.talk = { clip: "cdn/clip-wave.glb", weight: 4, loop: "once", mask: { from: "Spine" } }; ctx.after(5, "quiet");
}
const me = { leg: 0, pause: 0, callAt: 0, seen: 0, n: 0, told: {}, marked: {} }; // told: charId → sold count he already announced
export function onSpawn(ctx) { ctx.self.state.turnTo = "none"; }
async function call(ctx, listener) {
  const f = ctx.self.feetPosition, at = { x: f.x, y: f.y + 2.3, z: f.z };
  let row = null;
  const aud0 = { audience: { nearby: f, radius: EAR + 6 } }, cid = listener.state?.charId;
  if (cid) try { // a sale of theirs not yet collected and not yet announced: that comes first, by name
    const { rows: [o] } = await ctx.sql`SELECT COUNT(*) AS n, COALESCE(SUM(price), 0) AS c FROM trades WHERE seller_char = ${cid} AND sold_at IS NOT NULL AND paid = 0`;
    if (o && o.n > (me.told[cid] ?? 0)) {
      me.told[cid] = o.n; me.n++;
      const who = listener.state?.charName ?? listener.displayName ?? "Bearer";
      ctx.emit("playSound", { clip: BELL, position: at, volume: 0.6 }, aud0);
      ctx.emit("playSound", { clip: SOLD[me.n % SOLD.length], position: at, volume: 0.95, maxDistance: EAR + 6 }, aud0);
      ctx.emit("damageNumber", { position: at, text: (ctx.self.state.lastCall = `${who}, your notice sold · ${fmt(Math.floor(o.c * 0.9))} waits at the board`), color: "#ffd77a", size: 2, lifetime: 6 }, aud0);
      ctx.emit("playSound", { clip: "/cdn/moodboard-gothic-horror/sfx-coin-purse-clink-soft.mp3", volume: 0.7 }, { audience: { player: listener.id } });
      ctx.self.anim.talk = { clip: "cdn/clip-wave.glb", weight: 4, loop: "once", mask: { from: "Spine" } };
      ctx.after(2.4, "quiet");
      return;
    }
    if (o && o.n < (me.told[cid] ?? 0)) me.told[cid] = o.n; // collected: the count fell, so the next sale rings again
  } catch (e) { ctx.log("crier owed read failed", String(e)); }
  // a boss mark he has not yet remarked on for this Bearer: he names it
  const mk = cid && Object.values(listener.state?.gear ?? {}).map((it) => it?.mk).find((k) => MARKED[k] && !(me.marked[cid] ?? []).includes(k));
  if (mk) {
    (me.marked[cid] ??= []).push(mk); me.n++;
    const who = listener.state?.charName ?? listener.displayName ?? "Bearer";
    ctx.emit("playSound", { clip: BELL, position: at, volume: 0.4 }, aud0);
    ctx.emit("playSound", { clip: MARKED[mk][1], position: at, volume: 0.95, maxDistance: EAR + 6 }, aud0);
    ctx.emit("damageNumber", { position: at, text: (ctx.self.state.lastCall = `${who}, ${MARKED[mk][0]}`), color: "#e0a26a", size: 1.9, lifetime: 6 }, aud0);
    ctx.self.anim.talk = { clip: "cdn/clip-wave.glb", weight: 4, loop: "once", mask: { from: "Spine" } }; ctx.after(3, "quiet");
    return;
  }
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
  ctx.self.state.lastCall = text;
  ctx.emit("damageNumber", { position: at, text, color: row ? "#f2d38a" : "#b9ae98", size: 1.8, lifetime: 5 }, aud);
  ctx.self.anim.talk = { clip: "cdn/clip-wave.glb", weight: 4, loop: "once", mask: { from: "Spine" } };
  ctx.after(2.4, "quiet");
}
export function quiet(ctx) { ctx.self.anim.talk = null; }
export function update(ctx, dt) {
  const now = ctx.now(), f = ctx.self.feetPosition, vy = ctx.self.velocity?.y ?? 0;
  let near = null, best = EAR;
  for (const p of ctx.place.players) { if (p.state?.menu) continue; const d = Math.hypot(p.feetPosition.x - f.x, p.feetPosition.z - f.z); if (d < best) { best = d; near = p; } }
  if (!near) { ctx.self.velocity = { x: 0, y: vy, z: 0 }; ctx.sleep(2); return; } // nobody to hear him: he stands
  const fall = ctx.place.state.lastFall; // a boss fell: it outranks every notice, heard while fresh (10 min)
  if (fall && fall.at > (ctx.self.state.fallSeen ?? 0)) {
    ctx.self.state.fallSeen = fall.at;
    if (now - fall.at < 600000) { herald(ctx, fall); me.callAt = now; me.pause = now + 6000; ctx.self.velocity = { x: 0, y: vy, z: 0 }; return; }
  }
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
