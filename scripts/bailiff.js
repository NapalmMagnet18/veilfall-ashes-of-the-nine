import { bossVoice } from "./lib/boss-voice.js";
// Boss 01: the Bailiff of the Dripping Gate (VEILFALL boss bible).
// Phase A 100–70%: Taxman's Arc and Unpaid Debt, one at a time, long pauses.
// Phase B 70–35%: two ledger pillars light; they pour slow walkers and stack Fray (+10% damage taken
//   per stack) on everyone in the arena until both are broken.
// Phase C 35–0%: Arc and Debt alternate, then a 1.0 s recovery window.
// Resets when the arena is empty (or everyone in it is down) for 6 s. Health scales per player present.
import C from "./lib/data/combat.yml";
import { animate } from "builtin/tween";
import { payout } from "./wax-pack.js";
import E from "./lib/data/economy.yml";
import { body } from "./lib/data/models.js";
const B = C.bailiff, HOME = { x: 0, y: 0, z: -110 }, ARENA = { x: 0, z: -105, r: 17 };
const LEDGERS = [{ id: "ledger-west", x: -9, z: -103 }, { id: "ledger-east", x: 9, z: -103 }];
const sfx = (n) => `/cdn/moodboard-gothic-horror/sfx-${n}.mp3`;
const flat = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
const BELL = `fx
pop dust burst=36 on=arc() life=.7..1.3 v=up(1..3)+sdir() size=.4..0.7 acc=drag(1.5) col=<.55,.5,.45> a=0>.45:.4>0 sz=$size*(.6>2) r=sprite(smoke-puff,alpha)
pop wax burst=30 on=disc(.6) life=.5..1 v=sdir()*(4..7)+up(2..4) size=.06..0.12 col=oklch(.88 .1 70) acc=grav() a=1>0 floor=stick r=sprite(chip,alpha,velocity,.02)
pop fl burst=1 life=.25 size=4 col=hdr(3,1.6,.5) a=.8>0 sz=$size*(.4>1.6) r=sprite(soft-disc,add)`;
const SPLASH = `fx
pop wax burst=14 on=disc(.5) life=.4..0.8 v=up(2..3.5)+sdir() size=.06..0.11 col=oklch(.85 .12 65) acc=grav() a=1>0 floor=stick r=sprite(chip,alpha,velocity,.02)
pop st burst=4 life=.8..1.2 v=up(.6) size=.4 col=<.4,.32,.26> a=.35>0 sz=$size*(.6>1.8) r=sprite(smoke-puff,alpha)`;
const MARK = `fx
pop ring n=1 at=point().c(2.6) size=.9 col=hdr(3,1.2,.2)*flick(3,.4) a=.9 r=sprite(soft-disc,add)
pop drip rate=12 on=disc(.25).c(2.6) life=.4..0.6 v=up(-1) size=.04..0.07 col=hdr(2.4,1.2,.3) a=1>0 r=sprite(droplet,add)`;
const LEDGER_FIRE = `fx
pop flame rate=flick(.5,.3)*50 on=disc(.35).c(3.1) life=.4..0.8 v=up(1.4)+cone(20)*(.3..0.7) size=.25..0.45 acc=buoy(2)+drag(1.4) sz=$size*(.5>1:.4>.2) col=hdr(4.6,2,.5)>hdr(1.4,.3,.05) a=0>.15:1>.7:.8>0 r=sprite(flame-wisp,add)
pop pages rate=3 on=disc(.4).c(3) life=1.5..2.5 v=up(.8..1.4)+sdir()*.4 size=.06..0.1 spin=-3..3 col=hdr(2,1.3,.6) acc=curl(.6)+buoy(.2) a=1>0 rot=$age*$spin r=sprite(chip,alpha)
pop l n=1 at=point().c(3.2) glo=fire() r=light(<1,.5,.2>,$glo*6,9)`;

const players = (ctx) => ctx.place.players.filter((p) => !p.state.dead && !p.state.menu && flat(p.feetPosition, ARENA) < ARENA.r);
function hurt(ctx, p, dmg, now, why) {
  const s = ctx.self.state;
  if ((p.state.iframesUntil ?? 0) > now) { ctx.emit("damageNumber", { position: { ...p.feetPosition, y: p.feetPosition.y + 2 }, text: "EVADED", color: "#9fb6ff" }); return; }
  if ((p.state.guardUntil ?? 0) > now) { p.state.guardUntil = 0; p.state.riposte = now; ctx.emit("damageNumber", { position: { ...p.feetPosition, y: p.feetPosition.y + 2 }, text: "GUARDED", color: "#bfe3ff" }); return; }
  const d = Math.round(dmg * (1 + B.fray * (s.fray ?? 0)));
  p.state.hp -= d;
  const at = { x: p.feetPosition.x, y: p.feetPosition.y + 1.2, z: p.feetPosition.z };
  ctx.emit("damageNumber", { position: at, value: d, color: "#ff5a4a" });
  ctx.emit("flash", { target: p.id, color: "#ff3020", duration: 0.1 });
  ctx.emit("screenShake", { intensity: 0.3, duration: 0.2 }, { audience: { player: p.id } });
  ctx.emit("playSound", { clip: sfx("flesh-hit-grunt-muffled"), position: at, volume: 0.7 });
}
function decal(ctx, prim, pos, secs, yaw, color) {
  const m = { color, emissive: color, emissiveIntensity: 1.3, opacity: 0.4, transparent: true, depthWrite: false };
  ctx.spawn({ tags: ["telegraph"], feetPosition: { x: pos.x, y: pos.y + 0.05, z: pos.z }, rotation: yaw ?? 0, primitive: prim, physics: "none", lifetime: secs + 0.1, material: m });
  const fill = ctx.spawn({ tags: ["telegraph"], feetPosition: { x: pos.x, y: pos.y + 0.07, z: pos.z }, rotation: yaw ?? 0, primitive: prim, physics: "none", lifetime: secs + 0.1, scale: { x: 0.05, y: 1, z: 0.05 },
    material: { ...m, opacity: 0.5, emissiveIntensity: 1.8 } });
  animate(ctx, ctx.getObject(fill), { "scale.x": 1, "scale.z": 1 }, { duration: secs });
}
function publish(ctx) {
  const s = ctx.self.state, b = ctx.place.state.boss ?? {};
  const row = { name: "Bailiff of the Dripping Gate", hp: Math.max(0, Math.round(s.hp)), max: s.maxHp, phase: s.phase ?? 1, engaged: !!s.engaged, dead: !!s.dead, fray: s.fray ?? 0, ledgers: s.ledgersUp ?? 0, cast: s.cast?.name ?? null };
  if (Object.keys(row).some((k) => b[k] !== row[k])) ctx.place.state.boss = row;
}
function clearAdds(ctx) {
  for (const r of ctx.query({ tags: ["bailiff-add"], radius: 60, center: ARENA })) ctx.destroy(r.id);
  for (const L of LEDGERS) if (ctx.getObject(L.id)) ctx.destroy(L.id);
  const s = ctx.self.state; s.ledgersUp = 0; s.fray = 0; s.ledgersLit = false;
}


// a lit ledger reads from across the arena: a burning ring at its foot that breathes, an outline that pulses,
// and a flare each time it feeds the Fray
function markLedger(ctx, L, first) {
  if (first) {
    const ring = ctx.spawn(`${L.id}-ring`, { parent: L.id, feetPosition: { x: 0, y: 0.06, z: 0 }, rotation: { pitch: 90 },
      primitive: { kind: "torus", radius: 1.25, tube: 0.07, radialSegments: 6, tubularSegments: 40 },
      material: { color: "oklch(0.7 0.2 45)", emissive: "oklch(0.7 0.2 45)", emissiveIntensity: 3 } });
    animate(ctx, ring, { scale: [1, 1.18, 1] }, { duration: 1.2, loop: true, easing: "easeInOutSine" });
  }
  ctx.emit("highlightSet", { target: L.id, color: "#ff8a3c", style: "pulse", duration: B.frayEvery + 0.5 });
  if (!first) {
    const o = ctx.getObject(L.id);
    if (o) ctx.emit("fx", { position: { x: L.x, y: o.feetPosition.y + 0.2, z: L.z }, script: `fx\npop fl burst=1 life=.5 size=3 col=hdr(3,1.1,.25) a=.8>0 sz=$size*(.3>1.4) r=sprite(soft-disc,add)\npop sp burst=16 on=disc(.6) life=.5..0.9 v=up(2..4)+sdir() size=.03..0.06 col=hdr(4,1.6,.3) acc=grav()*.5 a=1>0 r=sprite(ember,add,velocity,.02)` });
  }
}

export function onSpawn(ctx) {
  const s = ctx.self.state;
  if (s.maxHp === undefined) { s.maxHp = B.hp; s.hp = B.hp; }
  s.kind = "bailiff"; publish(ctx);
}

export function update(ctx, dt) {
  const s = ctx.self.state, now = ctx.now(), f = ctx.self.feetPosition, self = ctx.self;
  const here = players(ctx);
  if (s.dead) { self.velocity = { x: 0, y: (self.grounded ? (self.velocity.y ?? 0) : Math.max(-28, (self.velocity.y ?? 0) - 0.66)), z: 0 }; return; }
  if (s.hp <= 0) {
    s.dead = true; s.deadAt = now; bossVoice(ctx, "bailiff", "die", f); s.engaged = false; s.cast = null; clearAdds(ctx);
    ctx.emit("slowMo", { scale: 0.35, duration: 1.2 }, { audience: { place: self.place } });
    ctx.emit("shockwave", { position: { ...f, y: f.y + 1 }, speed: 18, thickness: 2, intensity: 1 });
    ctx.emit("screenFlash", { color: "#ffd9a0", duration: 0.4, intensity: 0.12 });
    ctx.emit("playSound", { clip: sfx("great-bronze-bell-cracking-final-toll"), position: f, volume: 1, maxDistance: 120 });
    animate(ctx, self, { "scale.y": 0.1, "scale.x": 3, "scale.z": 3 }, { duration: 2.4 });
    // entitlement: each player present is credited once per life of this boss (sim.js grants the quest reward once ever)
    for (const p of here) { p.state.bossKilled = true; p.state.heartwax = (p.state.heartwax ?? 0) + 1; p.state.msg = { text: "Heartwax ×1. The boss's last tallow, still warm. The Wayside cauldron can boil it.", at: now + 2500 }; ctx.emit("milestone", { step: 3, name: "bailiff-defeated" }, { audience: { player: p.id } }); }
    ctx.place.state.lastFall = { boss: "bailiff", by: here.map((p) => p.state?.charName || p.displayName).filter(Boolean).slice(0, 3), at: now }; // Brother Ledd heralds it at the fire
    if (!ctx.world.state.trophies?.["bailiff"]?.by) ctx.world.state.trophies = { ...(ctx.world.state.trophies ?? {}), ["bailiff"]: { at: now, by: ctx.place.state.lastFall?.by ?? [] } }; // its relic hangs on the Trophy Post
    payout(ctx, f, B.xp, E.drops.bailiff, false, "heavy", "bailiff");
    ctx.place.state.bailiffDownAt = now;
    publish(ctx); return;
  }

  // engage, scale, reset on empty arena / wipe
  if (here.length) {
    s.emptySince = null;
    if (!s.engaged) { s.engaged = true; bossVoice(ctx, "bailiff", "wake", f); s.next = now + 2000; s.turn = 0; ctx.emit("playSound", { clip: sfx("bailiff-roar-wax-choir-and-bell"), position: f, volume: 1, maxDistance: 80 }); }
    const want = Math.round(B.hp * (1 + B.perExtra * (here.length - 1)));
    if (want > s.maxHp) { s.hp += want - s.maxHp; s.maxHp = want; }
  } else if (s.engaged) {
    s.emptySince ??= now;
    if (now - s.emptySince > B.resetAfter * 1000) {
      s.engaged = false; s.hp += B.hp - s.hp; s.maxHp = B.hp; s.cast = null; s.phase = 1; clearAdds(ctx);
      self.feetPosition = { x: HOME.x, y: f.y, z: HOME.z };
    }
  }
  const ratio = s.hp / s.maxHp, phase = ratio > 0.7 ? 1 : ratio > 0.35 ? 2 : 3;
  if (phase !== s.phase) {
    if (s.phase && phase > s.phase) { ctx.emit("playSound", { clip: sfx("bailiff-roar-wax-choir-and-bell"), position: f, volume: 1, maxDistance: 80 }); ctx.emit("shockwave", { position: { ...f, y: f.y + 1 }, speed: 12, thickness: 1.5, intensity: 0.5 }); }
    if (s.phase && phase > s.phase) bossVoice(ctx, "bailiff", "phase", f);
    s.phase = phase;
    if (phase === 2 && !s.ledgersLit) {
      s.ledgersLit = true; s.ledgersUp = 2; s.frayAt = now + B.frayEvery * 1000; s.walkerAt = now + 3000;
      for (const L of LEDGERS) ctx.spawn(L.id, { tags: ["enemy", "boss", "ledger"], feetPosition: { x: L.x, z: L.z, y: { terrain: 0 } }, physics: "static",
        primitive: { kind: "cylinder", radiusTop: 0.55, radiusBottom: 0.75, height: 3, radialSegments: 8 }, material: { color: "oklch(0.32 0.03 60)", roughness: 0.9 },
        fx: { script: LEDGER_FIRE }, state: { hp: B.ledgerHp, maxHp: B.ledgerHp, kind: "ledger" } });
      for (const L of LEDGERS) markLedger(ctx, L, true);
      ctx.emit("playSound", { clip: sfx("ledger-pillars-ignite-whoosh-and-pages"), position: f, volume: 1, maxDistance: 80 });
    }
  }
  // ledger pillars: break, pour walkers, stack Fray
  if (s.ledgersLit) {
    let up = 0;
    for (const L of LEDGERS) {
      const o = ctx.getObject(L.id); if (!o) continue;
      if (o.state.hp <= 0) { ctx.emit("fx", { position: { x: L.x, y: o.feetPosition.y + 1.5, z: L.z }, script: BELL }); ctx.emit("playSound", { clip: sfx("stone-pillar-crumble-and-paper-burst"), position: o.feetPosition, volume: 1 }); ctx.destroy(L.id); continue; }
      up++;
      if (s.engaged && now >= (s.walkerAt ?? 0)) {
        ctx.spawn({ tags: ["enemy", "pilgrim", "bailiff-add"], physics: "character", feetPosition: { x: L.x, z: L.z + 1.5, y: { terrain: 0 } },
          ...body("walker"), behavior: ["scripts/humanoid-locomotion.js"],
          state: { kind: "walker", hp: 30, maxHp: 30, hunting: true } });
      }
    }
    if (s.engaged && now >= (s.walkerAt ?? 0)) s.walkerAt = now + B.ledgerSpawnEvery * 1000;
    if (up !== s.ledgersUp) { s.ledgersUp = up; if (!up) { s.fray = 0; ctx.emit("playSound", { clip: sfx("objective-complete-soft-bell"), position: f, volume: 0.8 }); } }
    if (up && s.engaged && now >= s.frayAt) {
      s.frayAt = now + B.frayEvery * 1000; s.fray = Math.min(B.frayMax, (s.fray ?? 0) + 1);
      for (const L of LEDGERS) if (ctx.getObject(L.id)) markLedger(ctx, L, false);
    }
  }
  publish(ctx);
  if (!s.engaged) { const d = flat(f, HOME); self.velocity = d > 1 ? { x: ((HOME.x - f.x) / d) * 3, y: (self.grounded ? (self.velocity.y ?? 0) : Math.max(-28, (self.velocity.y ?? 0) - 0.66)), z: ((HOME.z - f.z) / d) * 3 } : { x: 0, y: (self.grounded ? (self.velocity.y ?? 0) : Math.max(-28, (self.velocity.y ?? 0) - 0.66)), z: 0 }; return; }

  let prey = null, best = 99;
  for (const p of here) { const d = flat(p.feetPosition, f); if (d < best) { best = d; prey = p; } }
  let vx = 0, vz = 0;
  const c = s.cast;
  if (c) {
    if (c.name === "arc" && now >= c.at) {
      // Taxman's Arc lands: everyone in the wedge
      const cos = Math.cos((B.arcAngle / 2) * Math.PI / 180);
      for (const p of here) {
        const ex = p.feetPosition.x - f.x, ez = p.feetPosition.z - f.z, ed = Math.hypot(ex, ez) || 1;
        if (ed <= B.arcRadius && (ex * c.dx + ez * c.dz) / ed >= cos) hurt(ctx, p, B.arcDmg, now);
      }
      ctx.emit("fx", { position: { x: f.x + c.dx * 2.5, y: f.y + 0.2, z: f.z + c.dz * 2.5 }, script: BELL });
      ctx.emit("playSound", { clip: sfx("great-axe-sweep-heavy-whoosh-impact"), position: f, volume: 1, maxDistance: 60 });
      ctx.emit("squash", { target: self.id, axis: "z", intensity: 0.25, duration: 0.3 });
      s.cast = null; s.next = now + (phase === 3 ? (s.turn % 2 ? B.recoverC * 1000 : 500) : (phase === 1 ? B.pauseA : B.pauseB) * 1000);
      s.turn = (s.turn ?? 0) + 1;
    } else if (c.name === "debt") {
      const tgt = ctx.place.players.find((p) => p.id === c.who);
      // while marked: drop a numbered trail every 0.5 s; then the wax creeps along it
      if (!c.go && tgt && now < c.at && now - c.lastDrop > 500) {
        const pt = { x: tgt.feetPosition.x, y: tgt.feetPosition.y, z: tgt.feetPosition.z };
        s.cast = { ...c, trail: [...c.trail, pt], lastDrop: now };
        decal(ctx, { kind: "cylinder", radiusTop: B.debtWidth, radiusBottom: B.debtWidth, height: 0.03 }, pt, (c.at - now) / 1000 + 0.6 + c.trail.length * 0.25, 0, "oklch(0.72 0.17 60)");
      } else if (!c.go && now >= c.at) {
        s.cast = { ...c, go: true, i: 0, stepAt: now };
        ctx.emit("playSound", { clip: sfx("molten-wax-rushing-hiss"), position: f, volume: 1, maxDistance: 60 });
      } else if (c.go && now >= c.stepAt) {
        const pt = c.trail[c.i];
        if (!pt) { s.cast = null; s.next = now + (phase === 3 ? B.recoverC * 1000 : (phase === 1 ? B.pauseA : B.pauseB) * 1000); s.turn = (s.turn ?? 0) + 1; }
        else {
          ctx.emit("fx", { position: { ...pt, y: pt.y + 0.1 }, script: SPLASH });
          const hit = [...(c.hit ?? [])];
          for (const p of here) if (!hit.includes(p.id) && flat(p.feetPosition, pt) < B.debtWidth) { hit.push(p.id); hurt(ctx, p, B.debtDmg, now); }
          s.cast = { ...c, i: c.i + 1, stepAt: now + 250, hit };
        }
      }
      // he keeps walking at a crawl while the debt is called
      if (prey && best > 3) { const dx = prey.feetPosition.x - f.x, dz = prey.feetPosition.z - f.z; vx = (dx / best) * 1.2; vz = (dz / best) * 1.2; }
    }
  } else if (prey) {
    const dx = prey.feetPosition.x - f.x, dz = prey.feetPosition.z - f.z, d = Math.hypot(dx, dz) || 1;
    self.rotation = (Math.atan2(-dx, -dz) * 180) / Math.PI;
    const wantArc = phase === 3 ? (s.turn ?? 0) % 2 === 0 : (s.turn ?? 0) % 3 !== 2;
    if (now >= (s.next ?? 0) && (!wantArc || d < B.arcRadius + 1)) {
      if (wantArc) {
        const ux = dx / d, uz = dz / d, half = B.arcAngle / 2;
        s.cast = { name: "arc", dx: ux, dz: uz, at: now + B.arcWindup * 1000 };
        const theta = Math.atan2(ux, uz) * 180 / Math.PI;
        decal(ctx, { kind: "cylinder", radiusTop: B.arcRadius, radiusBottom: B.arcRadius, height: 0.03, thetaStart: (theta - half) * Math.PI / 180, thetaLength: B.arcAngle * Math.PI / 180 }, f, B.arcWindup, 0, "oklch(0.7 0.19 50)");
        ctx.emit("playSound", { clip: sfx("axe-raised-chain-rattle-windup"), position: f, volume: 0.9, maxDistance: 60 });
      } else {
        const who = here[Math.floor(ctx.random() * here.length)];
        s.cast = { name: "debt", who: who.id, at: now + B.debtDelay * 1000, trail: [], lastDrop: 0 };
        ctx.emit("fx", { position: who.feetPosition, script: MARK, lifetime: B.debtDelay }, { audience: { place: self.place } });
        ctx.emit("damageNumber", { position: { ...who.feetPosition, y: who.feetPosition.y + 2.8 }, text: "② UNPAID DEBT: MOVE AWAY", color: "#f2a33a", size: 1.1 });
        ctx.emit("playSound", { clip: sfx("ledger-stamp-and-coin-toll-warning"), position: f, volume: 1, maxDistance: 60 });
      }
    } else if (d > 2.4) { vx = (dx / d) * 2.4; vz = (dz / d) * 2.4; }
    else if (now >= (s.nextSwing ?? 0) && now >= (s.next ?? 0) - 1000) { s.nextSwing = now + 2200; hurt(ctx, prey, B.swingDmg, now); ctx.emit("squash", { target: self.id, axis: "z", intensity: 0.2, duration: 0.25 }); }
  }
  self.velocity = { x: vx, y: (self.grounded ? (self.velocity.y ?? 0) : Math.max(-28, (self.velocity.y ?? 0) - 0.66)), z: vz };
}
