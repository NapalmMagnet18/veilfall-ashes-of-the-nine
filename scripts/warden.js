import { bossVoice } from "./lib/boss-voice.js";
// Boss 03: the Lantern Warden, risen from the heart of the Lanternmere once its three waystones burn.
// Phase I 100–60%: Undertow (a ring around him) and Drowned Lights (a line of marks walking out toward a Bearer).
// Phase II 60–25%: he snuffs the waystones; drowned pilgrims climb out of the mere; the lights walk two lines.
// Phase III 25–0%: Undertow and Lights alternate fast; a breath after every second cast.
// Resets when the heart is empty (or everyone in it is down). Health scales per Bearer present.
import C from "./lib/data/combat.yml";
import E from "./lib/data/economy.yml";
import { animate } from "builtin/tween";
import { payout, telegraph, hurtPlayers } from "./wax-pack.js";
import { body } from "./lib/data/models.js";
import { FEN_HEART } from "./lib/data/veilfall-map.js";
const W = C.warden, HOME = { x: FEN_HEART.x, y: 0, z: FEN_HEART.z }, ARENA = { x: FEN_HEART.x, z: FEN_HEART.z, r: 13 };
const sfx = (n) => `/cdn/moodboard-gothic-horror/sfx-${n}.mp3`;
const flat = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
const SPLASH = `fx
pop ring burst=1 life=.6 size=%r|4 col=hdr(.6,1.8,2) a=.9>0 sz=$size*(.3>2.1) r=sprite(soft-disc,add)
pop spray burst=50 on=disc(%r|4) life=.6..1.1 v=up(2..4.5)+sdir()*.9 size=.05..0.1 acc=grav() col=<.55,.7,.72> a=.8>0 r=sprite(soft-disc,alpha)
pop mist burst=14 on=disc(%r|4) life=1..1.6 v=up(.4..0.9) size=.5..0.9 acc=drag(1.4)+buoy(.2) col=<.4,.5,.52> a=0>.35:.4>0 sz=$size*(.6>1.8) r=sprite(smoke-puff,alpha)`;
const players = (ctx) => ctx.place.players.filter((p) => !p.state.dead && !p.state.menu && p.state.charId && flat(p.feetPosition, ARENA) < ARENA.r + 1);
function publish(ctx) {
  const s = ctx.self.state, b = ctx.place.state.warden ?? {};
  const hint = s.phase === 1 ? "PHASE I · ring around him: step out · lights walk toward you: sidestep the line" : s.phase === 2 ? "PHASE II · the stones are dark: thin the drowned, keep moving" : "PHASE III · the mere boils: dodge, then strike in the breath";
  const row = { name: "The Lantern Warden", hp: Math.max(0, Math.round(s.hp)), max: s.maxHp, phase: s.phase ?? 1, engaged: !!s.engaged, dead: !!s.dead, fray: 0, hint };
  if (Object.keys(row).some((k) => b[k] !== row[k])) ctx.place.state.warden = row;
}
function clearAdds(ctx) { for (const r of ctx.query({ tags: ["warden-add"], radius: 60, center: ARENA })) ctx.destroy(r.id); }
export function onSpawn(ctx) {
  const s = ctx.self.state;
  if (s.maxHp === undefined) { s.maxHp = W.hp; s.hp = W.hp; }
  s.kind = "warden"; s.phase = 1; publish(ctx);
}
export function update(ctx, dt) {
  const s = ctx.self.state, now = ctx.now(), self = ctx.self, f = self.feetPosition;
  const here = players(ctx);
  if (s.dead) { self.velocity = { x: 0, y: self.velocity.y, z: 0 }; return; }
  if (s.hp <= 0) {
    s.dead = true; s.deadAt = now; bossVoice(ctx, "warden", "die", f); s.engaged = false; s.cast = null; clearAdds(ctx);
    ctx.place.state.fenDark = false;
    ctx.emit("slowMo", { scale: 0.3, duration: 1.4 }, { audience: { place: self.place } });
    ctx.emit("shockwave", { position: { ...f, y: f.y + 1 }, speed: 20, thickness: 2.4, intensity: 1 });
    ctx.emit("screenFlash", { color: "#bff3ee", duration: 0.5, intensity: 0.14 });
    ctx.emit("playSound", { clip: sfx("drowned-giant-sinks-with-long-watery-groan-and-lantern-chime"), position: f, volume: 1, maxDistance: 140 });
    ctx.emit("fx", { position: { x: f.x, y: f.y + 0.2, z: f.z }, script: SPLASH, params: { r: 5 } });
    animate(ctx, self, { "feetPosition.y": f.y - 3, "scale.x": 0.6, "scale.z": 0.6 }, { duration: 2.8 });
    for (const p of here) { p.state.wardenKilled = true; ctx.emit("milestone", { step: 15, name: "warden-defeated" }, { audience: { player: p.id } }); }
    ctx.place.state.lastFall = { boss: "warden", by: here.map((p) => p.state?.charName || p.displayName).filter(Boolean).slice(0, 3), at: now }; // Brother Ledd heralds it at the fire
    payout(ctx, f, W.xp, E.drops.warden, false, "heavy", "warden");
    publish(ctx); return;
  }
  if (here.length) {
    s.emptySince = null;
    if (!s.engaged) { s.engaged = true; bossVoice(ctx, "warden", "wake", f); s.next = now + 2200; s.turn = 0; ctx.emit("playSound", { clip: sfx("drowned-giant-rises-from-water-roar-and-chains"), position: f, volume: 1, maxDistance: 90 }); }
    const want = Math.round(W.hp * (1 + W.perExtra * (here.length - 1)));
    if (want > s.maxHp) { s.hp += want - s.maxHp; s.maxHp = want; }
  } else if (s.engaged) {
    s.emptySince ??= now;
    if (now - s.emptySince > W.resetAfter * 1000) {
      s.engaged = false; s.hp += W.hp - s.hp; s.maxHp = W.hp; s.cast = null; s.phase = 1; clearAdds(ctx); ctx.place.state.fenDark = false;
      self.feetPosition = { x: HOME.x, y: f.y, z: HOME.z };
    }
  }
  const ratio = s.hp / s.maxHp, phase = ratio > 0.6 ? 1 : ratio > 0.25 ? 2 : 3;
  if (phase !== s.phase) {
    if (phase > (s.phase ?? 1)) {
      ctx.emit("playSound", { clip: sfx("drowned-giant-rises-from-water-roar-and-chains"), position: f, volume: 1, maxDistance: 90 });
      ctx.emit("shockwave", { position: { ...f, y: 1 }, speed: 14, thickness: 1.6, intensity: 0.6 });
      if (phase === 2) { s.addAt = now + 1500; ctx.place.state.fenDark = true; }
    }
    if (s.phase && phase > s.phase) bossVoice(ctx, "warden", "phase", f);
    s.phase = phase;
  }
  // phase II+: drowned pilgrims climb out of the mere at its rim
  if (phase >= 2 && s.engaged && now >= (s.addAt ?? Infinity)) {
    s.addAt = now + W.addEvery * 1000;
    if (ctx.query({ tags: ["warden-add"], radius: 40, center: ARENA }).length < 4) for (const a of [0.6, 3.7]) {
      const ang = a + ctx.random() * 0.8;
      ctx.spawn({ tags: ["enemy", "pilgrim", "warden-add"], physics: "character", feetPosition: { x: HOME.x + Math.cos(ang) * 10, z: HOME.z + Math.sin(ang) * 10, y: { terrain: 0 } },
        ...body("walker"), behavior: ["scripts/humanoid-locomotion.js"], state: { kind: "walker", hp: 34, maxHp: 34, hunting: true } });
    }
    ctx.emit("playSound", { clip: sfx("bodies-climbing-out-of-shallow-water-splashing"), position: f, volume: 0.9, maxDistance: 50 });
  }
  publish(ctx);
  if (!s.engaged) { const d = flat(f, HOME); self.velocity = d > 1 ? { x: ((HOME.x - f.x) / d) * 3, y: self.velocity.y, z: ((HOME.z - f.z) / d) * 3 } : { x: 0, y: self.velocity.y, z: 0 }; return; }
  let prey = null, best = 99;
  for (const p of here) { const d = flat(p.feetPosition, f); if (d < best) { best = d; prey = p; } }
  let vx = 0, vz = 0;
  const pause = (phase === 1 ? W.pauseA : phase === 2 ? W.pauseB : ((s.turn ?? 0) % 2 ? W.recoverC : 0.6)) * 1000;
  const c = s.cast;
  if (c) {
    const due = (c.marks ?? []).filter((m) => !m.done && now >= m.at);
    if (due.length) {
      for (const m of due) {
        hurtPlayers(ctx, m, m.r, m.dmg, now);
        ctx.emit("fx", { position: { x: m.x, y: m.y + 0.15, z: m.z }, script: SPLASH, params: { r: m.r } });
        if (m.r > 3 || m.first) ctx.emit("playSound", { clip: sfx(m.r > 3 ? "heavy-water-slam-deep-splash" : "cold-lantern-flare-hiss-and-splash"), position: m, volume: m.r > 3 ? 1 : 0.8, maxDistance: 70 });
        if (m.r > 3) ctx.emit("squash", { target: self.id, axis: "y", intensity: 0.25, duration: 0.35 });
      }
      s.cast = { ...c, marks: c.marks.map((m) => (now >= m.at ? { ...m, done: true } : m)) };
    }
    if (s.cast.marks.every((m) => m.done)) { s.cast = null; s.next = now + pause; s.turn = (s.turn ?? 0) + 1; s.nextSwing = Math.max(s.nextSwing ?? 0, now + 1000); }
  } else if (prey) {
    const dx = prey.feetPosition.x - f.x, dz = prey.feetPosition.z - f.z, d = Math.hypot(dx, dz) || 1;
    self.rotation = (Math.atan2(-dx, -dz) * 180) / Math.PI;
    const tide = (s.turn ?? 0) % 2 === 0;
    if (now >= (s.next ?? 0) && (!tide || d < W.tideR + 1.5)) {
      const marks = [];
      if (tide) {
        marks.push({ x: f.x, y: f.y, z: f.z, r: W.tideR, dmg: W.tideDmg, at: now + W.tideWind * 1000 });
        telegraph(ctx, f.x, f.y, f.z, W.tideR, W.tideWind);
        ctx.emit("playSound", { clip: sfx("water-drawing-back-before-a-wave-low-rumble"), position: f, volume: 0.9, maxDistance: 60 });
      } else {
        // a line of drowned lights walks out from him toward the Bearer; phase II+ fans a second line
        const ux = dx / d, uz = dz / d, lines = phase >= 2 ? [-0.35, 0.35] : [0];
        for (const off of lines) {
          const cs = Math.cos(off), sn = Math.sin(off), lx = ux * cs - uz * sn, lz = ux * sn + uz * cs;
          for (let i = 0; i < W.lightCount; i++) {
            const dist = 2 + i * 3.8, t = W.lightWind + i * W.lightStep;
            const m = { x: f.x + lx * dist, y: f.y, z: f.z + lz * dist, r: W.lightR, dmg: W.lightDmg, at: now + t * 1000, first: i === 0 };
            marks.push(m); telegraph(ctx, m.x, m.y, m.z, m.r, t);
          }
        }
        ctx.emit("playSound", { clip: sfx("ghostly-lanterns-igniting-one-by-one-cold-chimes"), position: f, volume: 0.9, maxDistance: 60 });
      }
      s.cast = { name: tide ? "undertow" : "lights", marks };
    } else if (d > 2.8) { vx = (dx / d) * 2.0; vz = (dz / d) * 2.0; }
    else if (now >= (s.nextSwing ?? 0)) {
      s.nextSwing = now + 2100;
      hurtPlayers(ctx, f, 3.2, W.swingDmg, now);
      ctx.emit("squash", { target: self.id, axis: "z", intensity: 0.2, duration: 0.25 });
      ctx.emit("playSound", { clip: sfx("long-iron-hook-pole-sweep-heavy-whoosh"), position: f, volume: 0.8, maxDistance: 40 });
    }
  }
  self.velocity = { x: vx, y: self.velocity.y, z: vz };
}
