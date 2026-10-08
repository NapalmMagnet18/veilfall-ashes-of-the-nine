// One manager moves every wax enemy (tag "enemy", not "boss"): roam, hunt, strike, telegraph, melt.
// Players judge their own hits (enemy.state.hp -= d); this reads hp, pays XP/kills to everyone near.
import { animate } from "builtin/tween";
import C from "./lib/data/combat.yml";
import E from "./lib/data/economy.yml";
import { fmt } from "./lib/coins.js";
import { rollDrops, TIER, BAG, dustValue } from "./lib/loot.js";
const sfx = (n) => `/cdn/moodboard-gothic-horror/sfx-${n}.mp3`;
// every kind has its own throat: the cry when it wakes to you, the sound it makes coming apart
const VOX = {
  pilgrim: { aggro: "hollow-wax-moan-short", death: "wax-figure-collapsing-hiss-and-sigh" },
  chorister: { aggro: "wax-choirboy-sings-one-broken-high-note-then-shrieks", death: "melting-wax-singer-gargled-hymn-fading-into-hiss" },
  flagellant: { aggro: "penitent-cracks-a-chain-scourge-and-screams-in-ecstasy", death: "chains-clatter-onto-stone-as-wax-body-slumps" },
  deacon: { aggro: "huge-wax-priest-bellows-a-low-sermon-word-and-scrapes-censer", death: "giant-wax-body-topples-heavy-thud-and-long-boiling-hiss" },
};
// idle throats: what each kind murmurs while it waits, heard within EAR metres, one fragment drifting up
const MUTTER = {
  pilgrim: { clip: "wax-pilgrim-whispered-prayer-mumble-wet-and-hollow", lines: ["...light the ninth, light the ninth...", "...forgive the wick...", "...the road remembers...", "...burn slow, burn kind...", "...where did the lanterns go..."] },
  chorister: { clip: "wax-choirboy-humming-broken-hymn-under-breath", lines: ["...la... la... lament...", "...sing it melted...", "...the high note hurts...", "...one more verse, one more..."] },
  flagellant: { clip: "penitent-murmured-litany-and-soft-chain-clink", lines: ["...one stroke for the first flame...", "...I was the one who let it go out...", "...again. again.", "...the wax remembers my sin..."] },
  deacon: { clip: "huge-wax-priest-low-droning-sermon-murmur", lines: ["...AND THE NINE WERE GIVEN TO ASH...", "...kneel, little candle...", "...tithe your light...", "...the Veil keeps what it is owed..."] },
};
const EAR = 14, mutterAt = new Map();
function mutter(ctx, w, s, f, now, players) {
  const next = mutterAt.get(w.id);
  if (next === undefined) { mutterAt.set(w.id, now + 3000 + ctx.random() * 9000); return; }
  if (now < next) return;
  mutterAt.set(w.id, now + 9000 + ctx.random() * 9000);
  if (!players.some((p) => flat(p.feetPosition, f) < EAR)) return;
  const M = MUTTER[s.kind] ?? MUTTER.pilgrim, deep = s.kind === "deacon";
  ctx.log("mutter", { id: w.id, kind: s.kind });
  ctx.emit("playSound", { clip: sfx(M.clip), position: f, volume: deep ? 0.55 : 0.38, pitch: 0.85 + ctx.random() * 0.3, maxDistance: EAR });
  ctx.emit("damageNumber", { position: { x: f.x, y: f.y + (deep ? 2.6 : 2.1), z: f.z }, text: M.lines[Math.floor(ctx.random() * M.lines.length)], color: deep ? "#c9a46a" : "#b8ad98", size: deep ? 0.9 : 0.7, lifetime: 2.6 }, { audience: { nearby: f, radius: EAR } });
}
const MELT = `fx
pop wax burst=20..28 on=disc(.35) life=.6..1.1 v=up(1.5..3)+sdir()*(1..2) size=.06..0.12 spin=-6..6 tint=oklch(.93 .04 88)..oklch(.8 .06 75) acc=grav()+drag(.6) col=$tint a=1>.8:1>0 sz=$size rot=$age*$spin floor=stick r=sprite(chip,alpha,velocity,.02)
pop smoke burst=8 on=disc(.3) life=1.2..2 v=up(.6..1.2) size=.3..0.5 acc=buoy(.4)+drag(1) col=<.3,.28,.27> a=0>.3:.4>0 sz=$size*(.6>2.2) r=sprite(smoke-puff,alpha)
pop out burst=1 life=.3 size=.5 col=hdr(3,1.6,.4) a=1>0 sz=$size*(1>.2) r=sprite(soft-disc,add)`;
const SLAM = `fx
pop dust burst=30 on=disc(%r|3) life=.6..1.2 v=up(1..2.5)+sdir()*.8 size=.3..0.6 acc=drag(1.5)+buoy(.3) col=<.55,.5,.45> a=0>.4:.4>0 sz=$size*(.6>1.8) r=sprite(smoke-puff,alpha)
pop wax burst=24 on=disc(.5) life=.5..0.9 v=sdir()*(3..6)+up(2..3) size=.05..0.1 col=oklch(.85 .12 60) acc=grav() a=1>0 floor=stick r=sprite(chip,alpha,velocity,.02)
pop fl burst=1 life=.25 size=%r|3 col=hdr(3,1.2,.3) a=.8>0 sz=$size*(.5>2) r=sprite(soft-disc,add)`;
// coins hop out of the corpse: glinting metal that bounces on the flagstones; count and height scale with the purse
const SPILL = (n, lo, hi) => `fx
pop coin burst=${n} on=disc(.3) life=.8..1.2 v=up(${lo}..${hi})+sdir()*(.6..1.5) size=.07..0.11 spin=-14..14 acc=grav() col=hdr(2.2,1.6,.6) a=1>.8:1>0 sz=$size rot=$age*$spin floor=bounce(.3) r=sprite(chip,add,velocity,.02)
pop glint on=@coin?.5 life=.25..0.4 size=.12..0.2 col=hdr(3,2.2,.9) a=1>0 sz=$size*(1>.2) r=sprite(soft-disc,add)
pop flash burst=1 life=.3 size=.9 col=hdr(2.2,1.6,.6) a=.6>0 sz=$size*(.4>1.6) r=sprite(soft-disc,add)`;
const SPILLS = { small: { fx: SPILL("10..16", 5.4, 7), clip: "/cdn/moodboard-gothic-horror/sfx-coins-spill-small-clink.mp3" },
  heavy: { fx: SPILL("60..80", 6, 9), clip: "/cdn/moodboard-gothic-horror/sfx-gold-coins-pour-heavy.mp3" } };
export const roll = (ctx, [lo, hi]) => lo + Math.floor(ctx.random() * (hi - lo + 1));
const flat = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
const CAMP = { x: 0, z: 0 }, SAFE = 12; // the Wayside Fire: nothing hunts inside its light
const safe = (p) => flat(p, CAMP) < SAFE;

export function telegraph(ctx, x, y, z, r, secs) {
  const ring = { kind: "cylinder", radiusTop: r, radiusBottom: r, height: 0.03 };
  ctx.spawn({ tags: ["telegraph"], feetPosition: { x, y: y + 0.04, z }, primitive: ring, physics: "none", lifetime: secs + 0.15,
    material: { color: "oklch(0.55 0.2 28)", emissive: "oklch(0.6 0.22 30)", emissiveIntensity: 1.2, opacity: 0.28, transparent: true, depthWrite: false } });
  const fill = ctx.spawn({ tags: ["telegraph"], feetPosition: { x, y: y + 0.06, z }, primitive: ring, physics: "none", lifetime: secs + 0.15, scale: { x: 0.05, y: 1, z: 0.05 },
    material: { color: "oklch(0.7 0.2 40)", emissive: "oklch(0.75 0.2 45)", emissiveIntensity: 1.6, opacity: 0.45, transparent: true, depthWrite: false } });
  animate(ctx, ctx.getObject(fill), { "scale.x": 1, "scale.z": 1 }, { duration: secs });
}

export function hurtPlayers(ctx, center, r, dmg, now) {
  for (const p of ctx.place.players) {
    if (p.state.dead || p.state.menu || flat(p.feetPosition, center) > r) continue;
    if ((p.state.iframesUntil ?? 0) > now) { ctx.emit("damageNumber", { position: { ...p.feetPosition, y: p.feetPosition.y + 2 }, text: "EVADED", color: "#9fb6ff" }); ctx.emit("playSound", { clip: sfx("blade-whiffs-past-cloak-close-swish"), position: p.feetPosition, volume: 0.5 }); continue; }
    if ((p.state.guardUntil ?? 0) > now) { p.state.guardUntil = 0; p.state.riposte = now; ctx.emit("damageNumber", { position: { ...p.feetPosition, y: p.feetPosition.y + 2 }, text: "GUARDED", color: "#bfe3ff" }); ctx.emit("playSound", { clip: sfx("heavy-blow-glances-off-spectral-guard-metal-clang-and-glass-ring"), position: p.feetPosition, volume: 0.85 }); continue; }
    p.state.hp -= dmg;
    const at = { x: p.feetPosition.x, y: p.feetPosition.y + 1.2, z: p.feetPosition.z };
    ctx.emit("damageNumber", { position: at, value: dmg, color: "#ff5a4a" });
    ctx.emit("flash", { target: p.id, color: "#ff3020", duration: 0.1 });
    ctx.emit("screenShake", { intensity: 0.25, duration: 0.2 }, { audience: { player: p.id } });
    ctx.emit("playSound", { clip: sfx("flesh-hit-grunt-muffled"), position: at, volume: 0.7 });
    ctx.emit("playSound", { clip: sfx("chainmail-and-leather-armor-struck-dull-thud"), position: at, volume: 0.55, pitch: 0.9 + ctx.random() * 0.2 });
  }
}

// personal loot: each eligible Bearer rolls their own; a find rises as a beam of its tier's colour
const BEAM = `fx
pop beam burst=1 life=2.6 size=.5 col=%c|<1,1,1> a=0>.08:.85>.7:.6>0 sz=$size r=mesh(cylinder,.18,9,.18)
pop motes burst=26 on=disc(.35) life=1.2..2.4 v=up(1.5..3.5) size=.03..0.06 acc=curl(.4)*.3 col=%c|<1,1,1>*2.4 a=1>.6:.8>0 r=sprite(ember,add)
pop glow burst=1 life=2.4 at=point().c(1) r=light(%c|<1,1,1>,12*(1>.7:.8>0),7)`;
const HEX = (h) => { const n = parseInt(h.slice(1), 16); return { x: ((n >> 16) & 255) / 255, y: ((n >> 8) & 255) / 255, z: (n & 255) / 255 }; };
const FIND = { ashen: "loot-drop-cloth-thud-soft", hallowed: "loot-drop-blue-glass-chime", gilded: "loot-drop-gold-bell-chime-bright", relic: "loot-drop-legendary-deep-choir-swell-with-anvil-ring", vowbound: "loot-drop-set-item-emerald-harp-shimmer" };
function dropLoot(ctx, p, at, kind) {
  const found = rollDrops(ctx, kind); if (!found.length) return;
  // each item is its own key in the Bearer's inbox; their own machine moves it into the pack (one writer per array)
  const inbox = p.state.lootIn ?? (p.state.lootIn = {});
  let best = null, n = (p.state.inv?.length ?? 0) + Object.keys(inbox).length;
  for (const it of found) {
    if (n >= BAG) { p.state.dust = (p.state.dust ?? 0) + dustValue(it); ctx.emit("damageNumber", { position: { ...at, y: at.y + 3 }, text: `pack full: +${dustValue(it)} ash dust`, color: "#9a907e", size: 0.7 }, { audience: { player: p.id } }); continue; }
    p.state.lootIn[it.u] = it; n++;
    if (!best || Object.keys(TIER).indexOf(it.t) > Object.keys(TIER).indexOf(best.t)) best = it;
    ctx.emit("damageNumber", { position: { x: at.x + 0.6, y: at.y + 2.8, z: at.z - 0.4 }, text: it.n, color: TIER[it.t].color, size: it.t === "relic" || it.t === "vowbound" ? 1.1 : 0.85, lifetime: 2.6 }, { audience: { player: p.id } });
  }
  if (!best) return;
  const c = HEX(TIER[best.t].color);
  if (best.t !== "ashen") ctx.emit("fx", { position: { x: at.x, y: at.y + 0.05, z: at.z }, script: BEAM, params: { c } }, { audience: { player: p.id } });
  ctx.emit("playSound", { clip: "/cdn/moodboard-gothic-horror/sfx-" + FIND[best.t] + ".mp3", position: at, volume: best.t === "ashen" ? 0.5 : 0.9 }, { audience: { player: p.id } });
  if (best.t === "relic" || best.t === "vowbound") { ctx.emit("screenFlash", { color: TIER[best.t].color, duration: 0.35, intensity: 0.25 }, { audience: { player: p.id } }); ctx.emit("uiEvent", { name: "relic", payload: { n: best.n, t: best.t } }, { audience: { player: p.id } }); }
}

export function payout(ctx, at, xp, copper, countsForQuest, spill = "small", kind = "pilgrim") {
  const S = SPILLS[spill] ?? SPILLS.small;
  let paid = 0; const copperBase = copper;
  for (const p of ctx.place.players) {
    if (p.state.menu || !p.state.charId || flat(p.feetPosition, at) > 28) continue;
    p.state.xp = (p.state.xp ?? 0) + xp;
    copper = Math.round(copperBase * (1 + (p.state.gs?.gold ?? 0) / 100));
    p.state.copper = (p.state.copper ?? 0) + copper;
    dropLoot(ctx, p, at, kind);
    if (countsForQuest) p.state.kills = (p.state.kills ?? 0) + 1;
    if (countsForQuest && ctx.random() < 0.5) p.state.shards = (p.state.shards ?? 0) + 1;
    ctx.emit("damageNumber", { position: { ...at, y: at.y + 2.4 }, text: `+${xp} XP`, color: "#c9b6ff", size: 0.8 }, { audience: { player: p.id } });
    if (copper > 0) {
      ctx.emit("damageNumber", { position: { x: at.x - 0.7, y: at.y + 2.0, z: at.z + 0.7 }, text: `+${fmt(copper)}`, color: "#e6c76a", size: 0.8 }, { audience: { player: p.id } });
      ctx.emit("playSound", { clip: S.clip, position: at, volume: 0.8 }, { audience: { player: p.id } });
    }
    paid++;
  }
  if (paid && copper > 0) ctx.emit("fx", { position: { x: at.x, y: at.y + 0.5, z: at.z }, script: S.fx });
}

export function update(ctx, dt) {
  const now = ctx.now(), players = ctx.place.players.filter((p) => !p.state.dead && !p.state.menu && !safe(p.feetPosition));
  for (const row of ctx.query({ tags: ["enemy"], excludeTags: ["boss"] })) {
    const w = ctx.getObject(row.id); if (!w) continue;
    const s = w.state, K = C[s.kind] ?? C.pilgrim, f = w.feetPosition;
    if (s.dead) { w.velocity = { x: 0, y: w.velocity.y, z: 0 }; mutterAt.delete(w.id); if (now - s.deadAt > 1600) ctx.destroy(w.id); continue; }
    if (s.hp <= 0) {
      s.dead = true; s.deadAt = now; w.physics = "none";
      ctx.emit("fx", { position: { x: f.x, y: f.y + 0.4, z: f.z }, script: MELT });
      ctx.emit("playSound", { clip: sfx((VOX[s.kind] ?? VOX.pilgrim).death), position: f, volume: s.kind === "deacon" ? 1 : 0.8, pitch: 0.9 + ctx.random() * 0.2 });
      animate(ctx, w, { "scale.y": 0.08, "scale.x": 1.5, "scale.z": 1.5 }, { duration: 1.2 });
      payout(ctx, f, K.xp, roll(ctx, E.drops[s.kind] ?? E.drops.pilgrim), true, "small", s.kind);
      continue;
    }
    // who to hunt
    let prey = null, best = s.hunting ? K.aggro * 1.8 : K.aggro;
    for (const p of players) { const d = flat(p.feetPosition, f); if (d < best) { best = d; prey = p; } }
    if (s.lastHit && !prey) { const p = players.find((q) => q.id === s.lastHit); if (p && flat(p.feetPosition, f) < 30) { prey = p; best = flat(p.feetPosition, f); } }
    if (s.home && flat(f, s.home) > 22) { prey = null; s.lastHit = null; }
    if (!!prey !== !!s.hunting) { s.hunting = !!prey; if (prey) ctx.emit("playSound", { clip: sfx((VOX[s.kind] ?? VOX.pilgrim).aggro), position: f, volume: s.kind === "pilgrim" ? 0.5 : 0.7, mode: "restart", pitch: 0.8 + ctx.random() * 0.4 }); }
    if (!s.hunting) mutter(ctx, w, s, f, now, players);
    let vx = 0, vz = 0;
    // a slam in its windup holds the body still, then lands
    if (s.slam) {
      if (now >= s.slam.at) {
        ctx.emit("fx", { position: { x: s.slam.x, y: f.y + 0.1, z: s.slam.z }, script: SLAM, params: { r: K.slamRadius } });
        ctx.emit("playSound", { clip: sfx("heavy-censer-slam-stone-crack"), position: f, volume: 1 });
        hurtPlayers(ctx, s.slam, K.slamRadius, K.dmg, now);
        s.slam = null; s.nextAtk = now + K.every * 1000;
      }
    } else if (prey) {
      const dx = prey.feetPosition.x - f.x, dz = prey.feetPosition.z - f.z, d = Math.hypot(dx, dz) || 1;
      const yaw = (Math.atan2(-dx, -dz) * 180) / Math.PI;
      if (Math.abs(((yaw - (s.yawW ?? 0) + 540) % 360) - 180) > 8) { s.yawW = yaw; w.rotation = yaw; }
      if (s.kind === "deacon" && d < 6 && now >= (s.nextAtk ?? 0)) {
        s.slam = { x: prey.feetPosition.x, y: prey.feetPosition.y, z: prey.feetPosition.z, at: now + K.windup * 1000 };
        telegraph(ctx, s.slam.x, s.slam.y, s.slam.z, K.slamRadius, K.windup);
        ctx.emit("playSound", { clip: sfx("chain-rattle-windup-hiss"), position: f, volume: 0.8 });
      } else if (d > (K.reach ?? 1.6)) { vx = (dx / d) * K.speed; vz = (dz / d) * K.speed; }
      else if (s.kind !== "deacon" && now >= (s.nextAtk ?? 0)) {
        s.nextAtk = now + K.every * 1000;
        ctx.emit("squash", { target: w.id, axis: "z", intensity: 0.2, duration: 0.25 });
        hurtPlayers(ctx, prey.feetPosition, 0.9, K.dmg, now);
      }
    } else if (s.home) {
      if (!s.roam || now > s.roamUntil) { const a = ctx.random() * 6.283; s.roam = { x: s.home.x + Math.cos(a) * 4, z: s.home.z + Math.sin(a) * 4 }; s.roamUntil = now + 4000 + ctx.random() * 4000; }
      const d = flat(s.roam, f);
      if (d > 0.6) { vx = ((s.roam.x - f.x) / d) * 0.7; vz = ((s.roam.z - f.z) / d) * 0.7; const yaw = (Math.atan2(-vx, -vz) * 180) / Math.PI; if (Math.abs(((yaw - (s.yawW ?? 0) + 540) % 360) - 180) > 8) { s.yawW = yaw; w.rotation = yaw; } }
    }
    if (flat(f, CAMP) < SAFE + 1 && (vx || vz)) { const ox = f.x - CAMP.x, oz = f.z - CAMP.z, ol = Math.hypot(ox, oz) || 1; if ((vx * ox + vz * oz) < 0) { vx = (ox / ol) * 1.5; vz = (oz / ol) * 1.5; } }
    w.velocity = { x: vx, y: w.velocity.y, z: vz };
  }
}
