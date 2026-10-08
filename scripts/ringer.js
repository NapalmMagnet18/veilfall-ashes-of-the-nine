import { bossVoice } from "./lib/boss-voice.js";
// Boss 02: the Ringer of the Ninth Bell, in the Bell Crypt under the Ashen Abbey.
// Phase I 100–60%: Knell (a ring around him) and Peal (a ring under each Bearer), long pauses.
// Phase II 60–25%: the bell wakes: Peal falls three times per Bearer, and wax pilgrims pour from the bell.
// Phase III 25–0%: Knell and Peal alternate fast; a 1.2 s breath after every second cast.
// Resets when the crypt is empty (or everyone in it is down). Health scales per Bearer present.
import C from "./lib/data/combat.yml";
import E from "./lib/data/economy.yml";
import { animate } from "builtin/tween";
import { payout, telegraph, hurtPlayers } from "./wax-pack.js";
import { body } from "./lib/data/models.js";
const R = C.ringer, HOME = { x: 0, y: 0, z: -252 }, CRYPT = { x: 0, z: -251, r: 14 }, BELL = { x: 0, z: -259 };
const sfx = (n) => `/cdn/moodboard-gothic-horror/sfx-${n}.mp3`;
const flat = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
const TOLL = `fx
pop ring burst=1 life=.6 size=%r|4 col=hdr(2.6,1.9,.8) a=.9>0 sz=$size*(.3>2.1) r=sprite(soft-disc,add)
pop dust burst=40 on=disc(%r|4) life=.7..1.3 v=up(1..2.6)+sdir()*.8 size=.3..0.6 acc=drag(1.5)+buoy(.3) col=<.5,.47,.42> a=0>.4:.4>0 sz=$size*(.6>1.9) r=sprite(smoke-puff,alpha)
pop sp burst=24 on=disc(.6) life=.4..0.8 v=sdir()*(3..6)+up(2..4) size=.03..0.06 col=hdr(4,2.6,.9) acc=grav() a=1>0 r=sprite(ember,add,velocity,.02)`;
const players = (ctx) => ctx.place.players.filter((p) => !p.state.dead && !p.state.menu && p.state.charId && flat(p.feetPosition, CRYPT) < CRYPT.r + 1);
function publish(ctx) {
  const s = ctx.self.state, b = ctx.place.state.ringer ?? {};
  const hint = s.phase === 1 ? "PHASE I · ring around him: step out · ring under you: move" : s.phase === 2 ? "PHASE II · the bell pours wax: thin the pilgrims, keep moving" : "PHASE III · he tolls without rest: dodge, then strike in the breath";
  const row = { name: "The Ringer of the Ninth Bell", hp: Math.max(0, Math.round(s.hp)), max: s.maxHp, phase: s.phase ?? 1, engaged: !!s.engaged, dead: !!s.dead, fray: 0, hint };
  if (Object.keys(row).some((k) => b[k] !== row[k])) ctx.place.state.ringer = row;
}
function clearAdds(ctx) { for (const r of ctx.query({ tags: ["ringer-add"], radius: 60, center: CRYPT })) ctx.destroy(r.id); }
export function onSpawn(ctx) {
  const s = ctx.self.state;
  if (s.maxHp === undefined) { s.maxHp = R.hp; s.hp = R.hp; }
  s.kind = "ringer"; s.phase = 1; publish(ctx);
}
export function update(ctx, dt) {
  const s = ctx.self.state, now = ctx.now(), self = ctx.self, f = self.feetPosition;
  const here = players(ctx);
  if (s.dead) { self.velocity = { x: 0, y: self.velocity.y, z: 0 }; return; }
  if (s.hp <= 0) {
    s.dead = true; s.deadAt = now; bossVoice(ctx, "ringer", "die", f); s.engaged = false; s.cast = null; clearAdds(ctx);
    ctx.emit("slowMo", { scale: 0.3, duration: 1.4 }, { audience: { place: self.place } });
    ctx.emit("shockwave", { position: { ...f, y: f.y + 1 }, speed: 20, thickness: 2.4, intensity: 1 });
    ctx.emit("screenFlash", { color: "#ffd59a", duration: 0.5, intensity: 0.14 });
    ctx.emit("playSound", { clip: sfx("great-bronze-bell-final-toll-fading-into-silence"), position: BELL, volume: 1, maxDistance: 140 });
    ctx.emit("fx", { position: { x: f.x, y: f.y + 0.3, z: f.z }, script: TOLL, params: { r: 5 } });
    animate(ctx, self, { "scale.y": 0.1, "scale.x": 2.6, "scale.z": 2.6 }, { duration: 2.6 });
    for (const p of here) { p.state.ringerKilled = true; ctx.emit("milestone", { step: 11, name: "ringer-defeated" }, { audience: { player: p.id } }); }
    ctx.place.state.lastFall = { boss: "ringer", by: here.map((p) => p.state?.charName || p.displayName).filter(Boolean).slice(0, 3), at: now }; // Brother Ledd heralds it at the fire
    ctx.world.state.trophies = { ...(ctx.world.state.trophies ?? {}), ["ringer"]: now }; // its relic hangs on the Trophy Post
    payout(ctx, f, R.xp, E.drops.ringer, false, "heavy", "ringer");
    ctx.place.state.ringerDownAt = now;
    publish(ctx); return;
  }
  if (here.length) {
    s.emptySince = null;
    if (!s.engaged) { s.engaged = true; bossVoice(ctx, "ringer", "wake", f); s.next = now + 2200; s.turn = 0; ctx.emit("playSound", { clip: sfx("ringer-awakens-cracked-bell-boom-and-hollow-choir"), position: f, volume: 1, maxDistance: 90 }); }
    const want = Math.round(R.hp * (1 + R.perExtra * (here.length - 1)));
    if (want > s.maxHp) { s.hp += want - s.maxHp; s.maxHp = want; }
  } else if (s.engaged) {
    s.emptySince ??= now;
    if (now - s.emptySince > R.resetAfter * 1000) {
      s.engaged = false; s.hp += R.hp - s.hp; s.maxHp = R.hp; s.cast = null; s.phase = 1; clearAdds(ctx);
      self.feetPosition = { x: HOME.x, y: f.y, z: HOME.z };
    }
  }
  const ratio = s.hp / s.maxHp, phase = ratio > 0.6 ? 1 : ratio > 0.25 ? 2 : 3;
  if (phase !== s.phase) {
    if (phase > (s.phase ?? 1)) {
      ctx.emit("playSound", { clip: sfx("ringer-awakens-cracked-bell-boom-and-hollow-choir"), position: f, volume: 1, maxDistance: 90 });
      ctx.emit("shockwave", { position: { ...BELL, y: 2 }, speed: 14, thickness: 1.6, intensity: 0.6 });
      if (phase === 2) s.addAt = now + 1500;
    }
    if (s.phase && phase > s.phase) bossVoice(ctx, "ringer", "phase", f);
    s.phase = phase;
  }
  // phase II+: the bell pours wax pilgrims at its feet
  if (phase >= 2 && s.engaged && now >= (s.addAt ?? Infinity)) {
    s.addAt = now + R.addEvery * 1000;
    if (ctx.query({ tags: ["ringer-add"], radius: 40, center: CRYPT }).length < 4) for (const sx of [-1, 1])
      ctx.spawn({ tags: ["enemy", "pilgrim", "ringer-add"], physics: "character", feetPosition: { x: BELL.x + sx * 3.2, z: BELL.z + 3, y: { terrain: 0 } },
        ...body("walker"), behavior: ["scripts/humanoid-locomotion.js"], state: { kind: "walker", hp: 30, maxHp: 30, hunting: true } });
    ctx.emit("playSound", { clip: sfx("molten-wax-rushing-hiss"), position: BELL, volume: 0.9, maxDistance: 50 });
  }
  publish(ctx);
  if (!s.engaged) { const d = flat(f, HOME); self.velocity = d > 1 ? { x: ((HOME.x - f.x) / d) * 3, y: self.velocity.y, z: ((HOME.z - f.z) / d) * 3 } : { x: 0, y: self.velocity.y, z: 0 }; return; }
  let prey = null, best = 99;
  for (const p of here) { const d = flat(p.feetPosition, f); if (d < best) { best = d; prey = p; } }
  let vx = 0, vz = 0;
  const pause = (phase === 1 ? R.pauseA : phase === 2 ? R.pauseB : ((s.turn ?? 0) % 2 ? R.recoverC : 0.6)) * 1000;
  const c = s.cast;
  if (c) {
    // casts resolve at their marks; he stands his ground while the bell answers
    const due = (c.marks ?? []).filter((m) => !m.done && now >= m.at);
    if (due.length) {
      for (const m of due) {
        hurtPlayers(ctx, m, m.r, m.dmg, now);
        ctx.emit("fx", { position: { x: m.x, y: m.y + 0.15, z: m.z }, script: TOLL, params: { r: m.r } });
        ctx.emit("playSound", { clip: sfx(m.r > 3 ? "huge-bronze-bell-toll-impact-deep" : "bronze-bell-strike-sharp-ring"), position: m, volume: m.r > 3 ? 1 : 0.8, maxDistance: 70 });
        if (m.r > 3) ctx.emit("squash", { target: self.id, axis: "y", intensity: 0.25, duration: 0.35 });
      }
      s.cast = { ...c, marks: c.marks.map((m) => (now >= m.at ? { ...m, done: true } : m)) };
    }
    if (s.cast.marks.every((m) => m.done)) { s.cast = null; s.next = now + pause; s.turn = (s.turn ?? 0) + 1; s.nextSwing = Math.max(s.nextSwing ?? 0, now + 1000); } // the hammer waits a beat after the bell: a toll and a swing never land as one hit
  } else if (prey) {
    const dx = prey.feetPosition.x - f.x, dz = prey.feetPosition.z - f.z, d = Math.hypot(dx, dz) || 1;
    self.rotation = (Math.atan2(-dx, -dz) * 180) / Math.PI;
    const knell = (s.turn ?? 0) % 2 === 0;
    if (now >= (s.next ?? 0) && (!knell || d < R.knellR + 1.5)) {
      const marks = [];
      if (knell) {
        marks.push({ x: f.x, y: f.y, z: f.z, r: R.knellR, dmg: R.knellDmg, at: now + R.knellWind * 1000 });
        telegraph(ctx, f.x, f.y, f.z, R.knellR, R.knellWind);
        ctx.emit("playSound", { clip: sfx("iron-hammer-raised-chain-rattle-and-bell-hum"), position: f, volume: 0.9, maxDistance: 60 });
      } else {
        const n = phase >= 2 ? 3 : 1;
        for (const p of here) for (let i = 0; i < n; i++) {
          // the later peals lead the target: each falls where they were heading
          const v = p.velocity ?? { x: 0, z: 0 }, lead = i * 0.7;
          const m = { x: p.feetPosition.x + (v.x ?? 0) * lead, y: p.feetPosition.y, z: p.feetPosition.z + (v.z ?? 0) * lead, r: R.pealR, dmg: R.pealDmg, at: now + (R.pealWind + i * 0.7) * 1000 };
          marks.push(m); telegraph(ctx, m.x, m.y, m.z, m.r, R.pealWind + i * 0.7);
        }
        ctx.emit("playSound", { clip: sfx("ringing-bell-rising-warning-chime"), position: f, volume: 0.9, maxDistance: 60 });
      }
      s.cast = { name: knell ? "knell" : "peal", marks };
    } else if (d > 2.6) { vx = (dx / d) * 2.2; vz = (dz / d) * 2.2; }
    else if (now >= (s.nextSwing ?? 0)) {
      s.nextSwing = now + 2000;
      hurtPlayers(ctx, f, 3, R.swingDmg, now);
      ctx.emit("squash", { target: self.id, axis: "z", intensity: 0.2, duration: 0.25 });
      ctx.emit("playSound", { clip: sfx("great-axe-sweep-heavy-whoosh-impact"), position: f, volume: 0.8, maxDistance: 40 });
    }
  }
  self.velocity = { x: vx, y: self.velocity.y, z: vz };
}
