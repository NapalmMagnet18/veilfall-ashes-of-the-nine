import { bossVoice } from "./lib/boss-voice.js";
// Boss 04: the Hangman of Saint Corvin, who climbs down from the gallows once a Bearer has cut down all three hanged.
// Phase I 100–60%: Noose (a mark drops under every Bearer) and Trapdoors (a ring of marks around him: hug him or run wide).
// Phase II 60–25%: the hanged drop from the trees and walk; nooses fall twice, the second where you were going.
// Phase III 25–0%: two trapdoor rings, nooses between, a breath after every second cast.
// Resets when the dais is empty (or everyone on it is down). Health scales per Bearer present.
import C from "./lib/data/combat.yml";
import E from "./lib/data/economy.yml";
import { animate } from "builtin/tween";
import { payout, telegraph, hurtPlayers } from "./wax-pack.js";
import { body } from "./lib/data/models.js";
import { GALLOWS } from "./lib/data/veilfall-map.js";
const H = C.hangman, HOME = { x: GALLOWS.x, y: 0, z: GALLOWS.z }, ARENA = { x: GALLOWS.x, z: GALLOWS.z, r: 13 };
const sfx = (n) => `/cdn/moodboard-gothic-horror/sfx-${n}.mp3`;
const flat = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
const SNAP = `fx
pop ring burst=1 life=.5 size=%r|2 col=hdr(2.2,1.2,.5) a=.9>0 sz=$size*(.3>1.8) r=sprite(soft-disc,add)
pop splinters burst=26 on=disc(%r|2) life=.5..1 v=up(2..4)+sdir()*1.2 size=.04..0.09 acc=grav() spin=-8..8 rot=$age*$spin col=<.32,.25,.18> a=1>0 floor=stick r=sprite(stalk,alpha,velocity,.03)
pop dust burst=10 on=disc(%r|2) life=.8..1.3 v=up(.3..0.8) size=.4..0.7 acc=drag(1.4)+buoy(.2) col=<.36,.33,.3> a=0>.35:.4>0 sz=$size*(.6>1.8) r=sprite(smoke-puff,alpha)`;
const players = (ctx) => ctx.place.players.filter((p) => !p.state.dead && !p.state.menu && p.state.charId && flat(p.feetPosition, ARENA) < ARENA.r + 1);
function publish(ctx) {
  const s = ctx.self.state, b = ctx.place.state.hangman ?? {};
  const hint = s.phase === 1 ? "PHASE I · a noose drops on you: keep moving · trapdoors ring him: hug him or run wide" : s.phase === 2 ? "PHASE II · the hanged walk: cut them down, the second noose leads you" : "PHASE III · two rings of trapdoors: find the gap, strike in the breath";
  const row = { name: "The Hangman of Saint Corvin", hp: Math.max(0, Math.round(s.hp)), max: s.maxHp, phase: s.phase ?? 1, engaged: !!s.engaged, dead: !!s.dead, fray: 0, hint };
  if (Object.keys(row).some((k) => b[k] !== row[k])) ctx.place.state.hangman = row;
}
function clearAdds(ctx) { for (const r of ctx.query({ tags: ["hangman-add"], radius: 60, center: ARENA })) ctx.destroy(r.id); }
export function onSpawn(ctx) {
  const s = ctx.self.state;
  if (s.maxHp === undefined) { s.maxHp = H.hp; s.hp = H.hp; }
  s.kind = "hangman"; s.phase = 1; publish(ctx);
}
export function update(ctx, dt) {
  const s = ctx.self.state, now = ctx.now(), self = ctx.self, f = self.feetPosition;
  const here = players(ctx);
  if (s.dead) { self.velocity = { x: 0, y: self.velocity.y, z: 0 }; return; }
  if (s.hp <= 0) {
    s.dead = true; s.deadAt = now; bossVoice(ctx, "hangman", "die", f); s.engaged = false; s.cast = null; clearAdds(ctx);
    ctx.emit("slowMo", { scale: 0.3, duration: 1.4 }, { audience: { place: self.place } });
    ctx.emit("shockwave", { position: { ...f, y: f.y + 1 }, speed: 20, thickness: 2.4, intensity: 1 });
    ctx.emit("screenFlash", { color: "#ffd9a0", duration: 0.5, intensity: 0.14 });
    ctx.emit("playSound", { clip: sfx("huge-executioner-falls-rope-snaps-and-lantern-rolls-on-wood"), position: f, volume: 1, maxDistance: 140 });
    ctx.emit("fx", { position: { x: f.x, y: f.y + 0.2, z: f.z }, script: SNAP, params: { r: 4 } });
    animate(ctx, self, { "rotation.pitch": -80, "feetPosition.y": f.y - 0.6 }, { duration: 1.6 });
    for (const p of here) { p.state.hangmanKilled = true; ctx.emit("milestone", { step: 20, name: "hangman-defeated" }, { audience: { player: p.id } }); }
    payout(ctx, f, H.xp, E.drops.hangman, false, "heavy", "hangman");
    publish(ctx); return;
  }
  if (here.length) {
    s.emptySince = null;
    if (!s.engaged) { s.engaged = true; bossVoice(ctx, "hangman", "wake", f); s.next = now + 2200; s.turn = 0; ctx.emit("playSound", { clip: sfx("executioner-laughs-low-under-hood-and-drags-iron-hook-on-wood"), position: f, volume: 1, maxDistance: 90 }); }
    const want = Math.round(H.hp * (1 + H.perExtra * (here.length - 1)));
    if (want > s.maxHp) { s.hp += want - s.maxHp; s.maxHp = want; }
  } else if (s.engaged) {
    s.emptySince ??= now;
    if (now - s.emptySince > H.resetAfter * 1000) {
      s.engaged = false; s.hp += H.hp - s.hp; s.maxHp = H.hp; s.cast = null; s.phase = 1; clearAdds(ctx);
      self.feetPosition = { x: HOME.x, y: f.y, z: HOME.z };
    }
  }
  const ratio = s.hp / s.maxHp, phase = ratio > 0.6 ? 1 : ratio > 0.25 ? 2 : 3;
  if (phase !== s.phase) {
    if (phase > (s.phase ?? 1)) {
      ctx.emit("playSound", { clip: sfx("executioner-laughs-low-under-hood-and-drags-iron-hook-on-wood"), position: f, volume: 1, maxDistance: 90 });
      ctx.emit("shockwave", { position: { ...f, y: 1 }, speed: 14, thickness: 1.6, intensity: 0.6 });
      if (phase === 2) s.addAt = now + 1500;
    }
    if (s.phase && phase > s.phase) bossVoice(ctx, "hangman", "phase", f);
    s.phase = phase;
  }
  // phase II+: the hanged drop from the orchard trees and walk on him
  if (phase >= 2 && s.engaged && now >= (s.addAt ?? Infinity)) {
    s.addAt = now + H.addEvery * 1000;
    if (ctx.query({ tags: ["hangman-add"], radius: 40, center: ARENA }).length < 4) for (const a of [1.2, 4.3]) {
      const ang = a + ctx.random() * 0.8;
      ctx.spawn({ tags: ["enemy", "flagellant", "hangman-add"], physics: "character", feetPosition: { x: HOME.x + Math.cos(ang) * 11, z: HOME.z + Math.sin(ang) * 11, y: { terrain: 0 } },
        ...body("flagellant"), behavior: ["scripts/humanoid-locomotion.js"], state: { kind: "flagellant", hp: 44, maxHp: 44, hunting: true } });
    }
    ctx.emit("playSound", { clip: sfx("ropes-snapping-and-bodies-dropping-onto-dead-leaves"), position: f, volume: 0.9, maxDistance: 50 });
  }
  publish(ctx);
  if (!s.engaged) { const d = flat(f, HOME); self.velocity = d > 1 ? { x: ((HOME.x - f.x) / d) * 3, y: self.velocity.y, z: ((HOME.z - f.z) / d) * 3 } : { x: 0, y: self.velocity.y, z: 0 }; return; }
  let prey = null, best = 99;
  for (const p of here) { const d = flat(p.feetPosition, f); if (d < best) { best = d; prey = p; } }
  let vx = 0, vz = 0;
  const pause = (phase === 1 ? H.pauseA : phase === 2 ? H.pauseB : ((s.turn ?? 0) % 2 ? H.recoverC : 0.6)) * 1000;
  const c = s.cast;
  if (c) {
    const due = (c.marks ?? []).filter((m) => !m.done && now >= m.at);
    if (due.length) {
      let loud = false;
      for (const m of due) {
        hurtPlayers(ctx, m, m.r, m.dmg, now);
        ctx.emit("fx", { position: { x: m.x, y: m.y + 0.1, z: m.z }, script: SNAP, params: { r: m.r } });
        if (!loud) { loud = true; ctx.emit("playSound", { clip: sfx(c.name === "noose" ? "noose-rope-snaps-taut-with-creak" : "gallows-trapdoors-bang-open-heavy-wood"), position: m, volume: 0.9, maxDistance: 60 }); }
      }
      if (c.name === "trapdoors") ctx.emit("squash", { target: self.id, axis: "y", intensity: 0.2, duration: 0.3 });
      s.cast = { ...c, marks: c.marks.map((m) => (now >= m.at ? { ...m, done: true } : m)) };
    }
    if (s.cast.marks.every((m) => m.done)) { s.cast = null; s.next = now + pause; s.turn = (s.turn ?? 0) + 1; s.nextSwing = Math.max(s.nextSwing ?? 0, now + 1000); }
  } else if (prey) {
    const dx = prey.feetPosition.x - f.x, dz = prey.feetPosition.z - f.z, d = Math.hypot(dx, dz) || 1;
    self.rotation = (Math.atan2(-dx, -dz) * 180) / Math.PI;
    const trap = (s.turn ?? 0) % 2 === 1;
    if (now >= (s.next ?? 0)) {
      const marks = [];
      if (trap) {
        // a ring of trapdoors around him; phase III adds an outer ring offset into the gaps
        const rings = phase >= 3 ? [[H.trapRing, 0], [H.trapRing + 4.2, Math.PI / H.trapCount]] : [[H.trapRing, 0]];
        for (const [R, off] of rings) for (let i = 0; i < H.trapCount; i++) {
          const a = off + (i / H.trapCount) * Math.PI * 2;
          const m = { x: f.x + Math.cos(a) * R, y: f.y, z: f.z + Math.sin(a) * R, r: H.trapR, dmg: H.trapDmg, at: now + H.trapWind * 1000 };
          marks.push(m); telegraph(ctx, m.x, m.y, m.z, m.r, H.trapWind);
        }
        ctx.emit("playSound", { clip: sfx("rusted-bolts-sliding-under-gallows-floor"), position: f, volume: 0.9, maxDistance: 60 });
      } else {
        // a noose drops under every Bearer on the dais; phase II+ a second one where they were heading
        for (const p of here) {
          const pv = p.velocity ?? { x: 0, z: 0 }, pf = p.feetPosition;
          const m = { x: pf.x, y: pf.y, z: pf.z, r: H.nooseR, dmg: H.nooseDmg, at: now + H.nooseWind * 1000 };
          marks.push(m); telegraph(ctx, m.x, m.y, m.z, m.r, H.nooseWind);
          if (phase >= 2) {
            const sp = Math.hypot(pv.x ?? 0, pv.z ?? 0), lead = sp > 0.5 ? 3 / sp : 0;
            const m2 = { x: pf.x + (pv.x ?? 0) * lead, y: pf.y, z: pf.z + (pv.z ?? 0) * lead, r: H.nooseR, dmg: H.nooseDmg, at: now + (H.nooseWind + 0.6) * 1000 };
            if (lead) { marks.push(m2); telegraph(ctx, m2.x, m2.y, m2.z, m2.r, H.nooseWind + 0.6); }
          }
        }
        ctx.emit("playSound", { clip: sfx("rope-whipping-down-from-above-creak"), position: f, volume: 0.9, maxDistance: 60 });
      }
      s.cast = { name: trap ? "trapdoors" : "noose", marks };
    } else if (d > 2.8) { vx = (dx / d) * 2.2; vz = (dz / d) * 2.2; }
    else if (now >= (s.nextSwing ?? 0)) {
      s.nextSwing = now + 2000;
      hurtPlayers(ctx, f, 3.2, H.swingDmg, now);
      ctx.emit("squash", { target: self.id, axis: "z", intensity: 0.2, duration: 0.25 });
      ctx.emit("playSound", { clip: sfx("giant-iron-hook-swing-heavy-whoosh"), position: f, volume: 0.8, maxDistance: 40 });
    }
  }
  self.velocity = { x: vx, y: self.velocity.y, z: vz };
}
