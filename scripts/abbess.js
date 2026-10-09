import { bossVoice } from "./lib/boss-voice.js";
// Boss 05: the Ossuary Abbess, Saint Ysolde's last abbess, who sleeps on her reliquary dais among ten thousand skulls.
// Phase I 100–60%: Requiem (rings of bone burst outward from her, one after another: step through a gap or outrun it)
//                  and Bone Lines (a line of spikes reaches for every Bearer: step sideways).
// Phase II 60–25%: her sisters climb out of the niches and walk; the requiem leaves a gap that turns each wave.
// Phase III 25–0%: a cross of eight lines, rotating, with a requiem behind it; a breath after every second cast.
// Resets when the ossuary is empty (or everyone in it is down). Health scales per Bearer present.
import C from "./lib/data/combat.yml";
import E from "./lib/data/economy.yml";
import { animate } from "builtin/tween";
import { payout, telegraph, hurtPlayers } from "./wax-pack.js";
import { body } from "./lib/data/models.js";
import { RELIQUARY, OSSUARY } from "./lib/data/veilfall-map.js";
const A = C.abbess, HOME = { x: RELIQUARY.x, y: 0, z: RELIQUARY.z }, ARENA = { x: OSSUARY.x, z: OSSUARY.z, r: OSSUARY.r };
const sfx = (n) => `/cdn/moodboard-gothic-horror/sfx-${n}.mp3`;
const flat = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
const BONES = `fx
pop spikes burst=7 on=disc(%r|2) life=.5..0.8 v=up(4..6.5) size=.05..0.09 acc=grav()*1.4 col=<.86,.82,.72> a=1>.8:1>0 floor=stick r=sprite(stalk,alpha,velocity,.05)
pop chips burst=16 on=disc(%r|2) life=.4..0.9 v=up(1.5..3)+sdir()*1.4 size=.03..0.06 spin=-9..9 rot=$age*$spin acc=grav() col=<.78,.74,.64> a=1>0 floor=stick r=sprite(chip,alpha)
pop dust burst=6 on=disc(%r|2) life=.8..1.3 v=up(.3..0.7) size=.4..0.7 acc=drag(1.4)+buoy(.2) col=<.4,.38,.36> a=0>.3:.4>0 sz=$size*(.6>1.8) r=sprite(smoke-puff,alpha)
pop cold burst=1 life=.45 size=%r|2 col=hdr(.7,1.9,1.8) a=.7>0 sz=$size*(.4>1.5) r=sprite(soft-disc,add)`;
const players = (ctx) => ctx.place.players.filter((p) => !p.state.dead && !p.state.menu && p.state.charId && flat(p.feetPosition, ARENA) < ARENA.r + 1);
function publish(ctx) {
  const s = ctx.self.state, b = ctx.place.state.abbess ?? {};
  const hint = s.phase === 1 ? "PHASE I · rings of bone spread from her: find the gap · a line of spikes reaches for you: sidestep" : s.phase === 2 ? "PHASE II · her sisters rise: cut them down · the gap in each ring turns" : "PHASE III · eight lines turn around her: stand between them, strike in the breath";
  const row = { name: "The Ossuary Abbess", hp: Math.max(0, Math.round(s.hp)), max: s.maxHp, phase: s.phase ?? 1, engaged: !!s.engaged, dead: !!s.dead, fray: 0, hint };
  if (Object.keys(row).some((k) => b[k] !== row[k])) ctx.place.state.abbess = row;
}
function clearAdds(ctx) { for (const r of ctx.query({ tags: ["abbess-add"], radius: 60, center: ARENA })) ctx.destroy(r.id); }
// a ring of bone around her at radius R, with a gap of `gap` radians centred on `gapAt` (null = whole)
function ring(f, R, at, gapAt, gap) {
  const n = Math.max(6, Math.round((Math.PI * 2 * R) / (A.waveR * 1.7))), out = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    if (gapAt !== null) { let d = Math.abs(((a - gapAt + Math.PI * 3) % (Math.PI * 2)) - Math.PI); if (d < gap / 2) continue; }
    out.push({ x: f.x + Math.cos(a) * R, y: f.y, z: f.z + Math.sin(a) * R, r: A.waveR, dmg: A.waveDmg, at });
  }
  return out;
}
function line(f, ang, at, from = 2.2) {
  const out = [];
  for (let d = from; d <= from + A.lineLen * 1.9; d += A.lineR * 1.5) out.push({ x: f.x + Math.cos(ang) * d, y: f.y, z: f.z + Math.sin(ang) * d, r: A.lineR, dmg: A.lineDmg, at: at + d * 40 });
  return out;
}
export function onSpawn(ctx) {
  const s = ctx.self.state;
  if (s.maxHp === undefined) { s.maxHp = A.hp; s.hp = A.hp; }
  s.kind = "abbess"; s.phase = 1; publish(ctx);
}
export function update(ctx, dt) {
  const s = ctx.self.state, now = ctx.now(), self = ctx.self, f = self.feetPosition;
  const here = players(ctx);
  if (s.dead) { self.velocity = { x: 0, y: (self.grounded ? (self.velocity.y ?? 0) : Math.max(-28, (self.velocity.y ?? 0) - 0.66)), z: 0 }; return; }
  if (s.hp <= 0) {
    s.dead = true; s.deadAt = now; bossVoice(ctx, "abbess", "die", f); s.engaged = false; s.cast = null; clearAdds(ctx);
    ctx.emit("slowMo", { scale: 0.3, duration: 1.4 }, { audience: { place: self.place } });
    ctx.emit("shockwave", { position: { ...f, y: f.y + 1 }, speed: 20, thickness: 2.4, intensity: 1 });
    ctx.emit("screenFlash", { color: "#bff3ee", duration: 0.5, intensity: 0.16 });
    ctx.emit("playSound", { clip: sfx("skeletal-nun-collapses-into-pile-of-bones-and-a-candle-gutters-out-choir-stops"), position: f, volume: 1, maxDistance: 140 });
    ctx.emit("fx", { position: { x: f.x, y: f.y + 0.2, z: f.z }, script: BONES, params: { r: 3.5 } });
    animate(ctx, self, { "rotation.pitch": -80, "feetPosition.y": f.y - 0.7 }, { duration: 1.8 });
    for (const p of here) {
      p.state.abbessKilled = true; p.state.heartwax = (p.state.heartwax ?? 0) + 2; p.state.abbesswax = (p.state.abbesswax ?? 0) + 1;
      p.state.msg = { text: "Heartwax ×2 and the Abbess's Candle, still burning cold. Only the Wayside cauldron can render it: Requiem Tallow.", at: now + 2500 };
      ctx.emit("milestone", { step: 24, name: "abbess-defeated" }, { audience: { player: p.id } });
    }
    if (here.length) { // nobody in the hall (a reset, a wipe): no herald, no relic
      ctx.place.state.lastFall = { boss: "abbess", by: here.map((p) => p.state?.charName || p.displayName).filter(Boolean).slice(0, 3), at: now }; // Brother Ledd heralds it at the fire
      if (!ctx.world.state.trophies?.abbess?.by) ctx.world.state.trophies = { ...(ctx.world.state.trophies ?? {}), abbess: { at: now, by: ctx.place.state.lastFall.by } }; // her Candle-cage hangs on the Trophy Post
    }
    payout(ctx, f, A.xp, E.drops.abbess, false, "heavy", "abbess");
    publish(ctx); return;
  }
  if (here.length) {
    s.emptySince = null;
    if (!s.engaged) { s.engaged = true; bossVoice(ctx, "abbess", "wake", f); s.next = now + 2600; s.turn = 0; ctx.emit("playSound", { clip: sfx("choir-of-dead-nuns-inhales-and-begins-a-low-requiem-in-a-stone-ossuary"), position: f, volume: 1, maxDistance: 90 }); }
    const want = Math.round(A.hp * (1 + A.perExtra * (here.length - 1)));
    if (want > s.maxHp) { s.hp += want - s.maxHp; s.maxHp = want; }
  } else if (s.engaged) {
    s.emptySince ??= now;
    if (now - s.emptySince > A.resetAfter * 1000) {
      s.engaged = false; s.hp += A.hp - s.hp; s.maxHp = A.hp; s.cast = null; s.phase = 1; clearAdds(ctx);
      self.feetPosition = { x: HOME.x, y: f.y, z: HOME.z };
    }
  }
  const ratio = s.hp / s.maxHp, phase = ratio > 0.6 ? 1 : ratio > 0.25 ? 2 : 3;
  if (phase !== s.phase) {
    if (phase > (s.phase ?? 1)) {
      ctx.emit("playSound", { clip: sfx("ten-thousand-skulls-rattle-in-their-niches-at-once"), position: f, volume: 1, maxDistance: 90 });
      ctx.emit("shockwave", { position: { ...f, y: 1 }, speed: 14, thickness: 1.6, intensity: 0.6 });
      if (phase === 2) s.addAt = now + 1500;
      bossVoice(ctx, "abbess", "phase", f);
    }
    s.phase = phase;
  }
  // phase II+: her sisters climb out of the niches
  if (phase >= 2 && s.engaged && now >= (s.addAt ?? Infinity)) {
    s.addAt = now + A.addEvery * 1000;
    if (ctx.query({ tags: ["abbess-add"], radius: 40, center: ARENA }).length < 4) for (const a of [0.9, -0.9]) {
      const ang = a + (ctx.random() - 0.5) * 0.6; // the north and south walls
      ctx.spawn({ tags: ["enemy", "chorister", "abbess-add"], physics: "character", feetPosition: { x: ARENA.x + Math.sin(ang) * 2, z: ARENA.z + Math.cos(ang) * 11 * Math.sign(a), y: { terrain: 0 } },
        ...body("chorister"), behavior: ["scripts/humanoid-locomotion.js"], state: { kind: "chorister", hp: 52, maxHp: 52, hunting: true } });
    }
    ctx.emit("playSound", { clip: sfx("bones-sliding-out-of-stone-niches-and-wax-cracking"), position: f, volume: 0.9, maxDistance: 50 });
  }
  publish(ctx);
  if (!s.engaged) { const d = flat(f, HOME); self.velocity = d > 1 ? { x: ((HOME.x - f.x) / d) * 2.4, y: (self.grounded ? (self.velocity.y ?? 0) : Math.max(-28, (self.velocity.y ?? 0) - 0.66)), z: ((HOME.z - f.z) / d) * 2.4 } : { x: 0, y: (self.grounded ? (self.velocity.y ?? 0) : Math.max(-28, (self.velocity.y ?? 0) - 0.66)), z: 0 }; return; }
  let prey = null, best = 99;
  for (const p of here) { const d = flat(p.feetPosition, f); if (d < best) { best = d; prey = p; } }
  let vx = 0, vz = 0;
  const pause = (phase === 1 ? A.pauseA : phase === 2 ? A.pauseB : ((s.turn ?? 0) % 2 ? A.recoverC : 0.6)) * 1000;
  const c = s.cast;
  if (c) {
    const due = (c.marks ?? []).filter((m) => !m.done && now >= m.at);
    if (due.length) {
      let loud = false;
      for (const [i, m] of due.entries()) {
        hurtPlayers(ctx, m, m.r, m.dmg, now);
        if (i % 2 === 0) ctx.emit("fx", { position: { x: m.x, y: m.y + 0.1, z: m.z }, script: BONES, params: { r: m.r } });
        if (!loud) { loud = true; ctx.emit("playSound", { clip: sfx("bone-spikes-erupt-through-stone-floor-crack"), position: m, volume: 0.85, maxDistance: 60 }); }
      }
      s.cast = { ...c, marks: c.marks.map((m) => (now >= m.at ? { ...m, done: true } : m)) };
    }
    if (s.cast.marks.every((m) => m.done)) { s.cast = null; s.next = now + pause; s.turn = (s.turn ?? 0) + 1; s.nextSwing = Math.max(s.nextSwing ?? 0, now + 1000); }
  } else if (prey) {
    const dx = prey.feetPosition.x - f.x, dz = prey.feetPosition.z - f.z, d = Math.hypot(dx, dz) || 1;
    self.rotation = (Math.atan2(-dx, -dz) * 180) / Math.PI;
    if (now >= (s.next ?? 0)) {
      const marks = [], turn = s.turn ?? 0, wind = now + A.waveWind * 1000;
      let name;
      if (phase === 3 && turn % 2 === 0) {
        // the cross: eight lines turning a little each cast, a ring behind them
        name = "cross"; const off = turn * 0.21;
        for (let i = 0; i < 8; i++) marks.push(...line(f, off + (i / 8) * Math.PI * 2, wind));
        marks.push(...ring(f, 11.5, wind + 900, null, 0));
      } else if (turn % 2 === 0) {
        // Requiem: rings bursting outward, one after another; phase II+ each leaves a gap that turns
        name = "requiem";
        for (let w = 0; w < A.waves; w++) {
          const gapAt = phase >= 2 ? (turn * 0.7 + w * 0.9) % (Math.PI * 2) : null;
          marks.push(...ring(f, 3 + w * 3, wind + w * A.waveStep * 1000, gapAt, 1.3));
        }
      } else {
        // Bone Lines: a line of spikes reaching for every Bearer, one more in phase II+ where they'll step
        name = "lines";
        for (const p of here) {
          const a = Math.atan2(p.feetPosition.z - f.z, p.feetPosition.x - f.x);
          marks.push(...line(f, a, now + A.lineWind * 1000));
          if (phase >= 2) marks.push(...line(f, a + 0.45, now + (A.lineWind + 0.5) * 1000), ...line(f, a - 0.45, now + (A.lineWind + 0.5) * 1000));
        }
      }
      for (const m of marks) telegraph(ctx, m.x, m.y, m.z, m.r, (m.at - now) / 1000);
      ctx.emit("playSound", { clip: sfx(name === "lines" ? "bone-crozier-scrapes-stone-and-strikes-floor" : "low-requiem-chant-swells-and-bones-grind-underfoot"), position: f, volume: 0.9, maxDistance: 60 });
      ctx.emit("squash", { target: self.id, axis: "y", intensity: 0.18, duration: 0.35 });
      s.cast = { name, marks };
    } else if (d > 2.8) { vx = (dx / d) * 2; vz = (dz / d) * 2; }
    else if (now >= (s.nextSwing ?? 0)) {
      s.nextSwing = now + 2000;
      hurtPlayers(ctx, f, 3.2, A.swingDmg, now);
      ctx.emit("squash", { target: self.id, axis: "z", intensity: 0.2, duration: 0.25 });
      ctx.emit("playSound", { clip: sfx("heavy-bone-staff-swing-whoosh-and-rattle"), position: f, volume: 0.8, maxDistance: 40 });
    }
  }
  self.velocity = { x: vx, y: (self.grounded ? (self.velocity.y ?? 0) : Math.max(-28, (self.velocity.y ?? 0) - 0.66)), z: vz };
}
