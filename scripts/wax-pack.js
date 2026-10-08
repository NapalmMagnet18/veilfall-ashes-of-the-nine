// One manager moves every wax enemy (tag "enemy", not "boss"): roam, hunt, strike, telegraph, melt.
// Players judge their own hits (enemy.state.hp -= d); this reads hp, pays XP/kills to everyone near.
import { animate } from "builtin/tween";
import C from "./lib/data/combat.yml";
const sfx = (n) => `/cdn/moodboard-gothic-horror/sfx-${n}.mp3`;
const MELT = `fx
pop wax burst=20..28 on=disc(.35) life=.6..1.1 v=up(1.5..3)+sdir()*(1..2) size=.06..0.12 spin=-6..6 tint=oklch(.93 .04 88)..oklch(.8 .06 75) acc=grav()+drag(.6) col=$tint a=1>.8:1>0 sz=$size rot=$age*$spin floor=stick r=sprite(chip,alpha,velocity,.02)
pop smoke burst=8 on=disc(.3) life=1.2..2 v=up(.6..1.2) size=.3..0.5 acc=buoy(.4)+drag(1) col=<.3,.28,.27> a=0>.3:.4>0 sz=$size*(.6>2.2) r=sprite(smoke-puff,alpha)
pop out burst=1 life=.3 size=.5 col=hdr(3,1.6,.4) a=1>0 sz=$size*(1>.2) r=sprite(soft-disc,add)`;
const SLAM = `fx
pop dust burst=30 on=disc(%r|3) life=.6..1.2 v=up(1..2.5)+sdir()*.8 size=.3..0.6 acc=drag(1.5)+buoy(.3) col=<.55,.5,.45> a=0>.4:.4>0 sz=$size*(.6>1.8) r=sprite(smoke-puff,alpha)
pop wax burst=24 on=disc(.5) life=.5..0.9 v=sdir()*(3..6)+up(2..3) size=.05..0.1 col=oklch(.85 .12 60) acc=grav() a=1>0 floor=stick r=sprite(chip,alpha,velocity,.02)
pop fl burst=1 life=.25 size=%r|3 col=hdr(3,1.2,.3) a=.8>0 sz=$size*(.5>2) r=sprite(soft-disc,add)`;
const flat = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);

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
    if (p.state.dead || flat(p.feetPosition, center) > r) continue;
    if ((p.state.iframesUntil ?? 0) > now) { ctx.emit("damageNumber", { position: { ...p.feetPosition, y: p.feetPosition.y + 2 }, text: "EVADED", color: "#9fb6ff" }); continue; }
    p.state.hp -= dmg;
    const at = { x: p.feetPosition.x, y: p.feetPosition.y + 1.2, z: p.feetPosition.z };
    ctx.emit("damageNumber", { position: at, value: dmg, color: "#ff5a4a" });
    ctx.emit("flash", { target: p.id, color: "#ff3020", duration: 0.1 });
    ctx.emit("screenShake", { intensity: 0.25, duration: 0.2 }, { audience: { player: p.id } });
    ctx.emit("playSound", { clip: sfx("flesh-hit-grunt-muffled"), position: at, volume: 0.7 });
  }
}

export function payout(ctx, at, xp, gold, countsForQuest) {
  for (const p of ctx.place.players) {
    if (flat(p.feetPosition, at) > 28) continue;
    p.state.xp = (p.state.xp ?? 0) + xp;
    p.state.gold = (p.state.gold ?? 0) + gold;
    if (countsForQuest) p.state.kills = (p.state.kills ?? 0) + 1;
    ctx.emit("damageNumber", { position: { ...at, y: at.y + 2.4 }, text: `+${xp} XP`, color: "#c9b6ff", size: 0.8 }, { audience: { player: p.id } });
  }
}

export function update(ctx, dt) {
  const now = ctx.now(), players = ctx.place.players.filter((p) => !p.state.dead);
  for (const row of ctx.query({ tags: ["enemy"], excludeTags: ["boss"] })) {
    const w = ctx.getObject(row.id); if (!w) continue;
    const s = w.state, K = C[s.kind] ?? C.pilgrim, f = w.feetPosition;
    if (s.dead) { w.velocity = { x: 0, y: w.velocity.y, z: 0 }; if (now - s.deadAt > 1600) ctx.destroy(w.id); continue; }
    if (s.hp <= 0) {
      s.dead = true; s.deadAt = now; w.physics = "none";
      ctx.emit("fx", { position: { x: f.x, y: f.y + 0.4, z: f.z }, script: MELT });
      ctx.emit("playSound", { clip: sfx("wax-figure-collapsing-hiss-and-sigh"), position: f, volume: 0.8, pitch: 0.9 + ctx.random() * 0.2 });
      animate(ctx, w, { "scale.y": 0.08, "scale.x": 1.5, "scale.z": 1.5 }, { duration: 1.2 });
      payout(ctx, f, K.xp, s.kind === "deacon" ? 25 : 3 + Math.floor(ctx.random() * 4), true);
      continue;
    }
    // who to hunt
    let prey = null, best = s.hunting ? K.aggro * 1.8 : K.aggro;
    for (const p of players) { const d = flat(p.feetPosition, f); if (d < best) { best = d; prey = p; } }
    if (s.lastHit && !prey) { const p = players.find((q) => q.id === s.lastHit); if (p && flat(p.feetPosition, f) < 30) { prey = p; best = flat(p.feetPosition, f); } }
    if (s.home && flat(f, s.home) > 26) { prey = null; s.lastHit = null; }
    if (!!prey !== !!s.hunting) { s.hunting = !!prey; if (prey) ctx.emit("playSound", { clip: sfx("hollow-wax-moan-short"), position: f, volume: 0.5, pitch: 0.8 + ctx.random() * 0.4 }); }
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
    w.velocity = { x: vx, y: w.velocity.y, z: vz };
  }
}
