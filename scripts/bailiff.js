// The Bailiff of the Dripping Gate. 100–70%: teaches the bell slam. 70–35%: adds burning wax pools.
// 35–0%: triple slams with a recovery window after. Resets to full when the arena empties for 6 s.
// Scales with the players who stand in the arena. Loot is the referee's (sim.js), once per player.
import C from "./lib/data/combat.yml";
import { telegraph, hurtPlayers, payout } from "./wax-pack.js";
import { animate } from "builtin/tween";
const B = C.bailiff, HOME = { x: 0, y: 0, z: -110 }, ARENA = { x: 0, z: -105, r: 18 };
const sfx = (n) => `/cdn/moodboard-gothic-horror/sfx-${n}.mp3`;
const flat = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
const POOL = `fx
pop glow n=14 on=disc(%r|2) size=.25..0.5 col=hdr(2.2,.8,.15)*flick(1.2,.3) a=.6 r=sprite(soft-disc,add)
pop fume rate=10 on=disc(%r|2) life=1..1.8 v=up(.4..1) size=.25..0.45 acc=buoy(.4)+drag(1) col=<.35,.26,.2> a=0>.3:.3>0 sz=$size*(.6>2) r=sprite(smoke-puff,alpha)
pop lt n=1 r=light(<1,.5,.2>,6,6)`;
const BELL = `fx
pop ring burst=1 life=.5 size=%r|4.5 col=hdr(3,2,.8) a=1>0 sz=$size*(.3>2.2) r=sprite(soft-disc,add)
pop dust burst=40 on=disc(%r|4.5) life=.7..1.3 v=up(1..3)+sdir() size=.4..0.7 acc=drag(1.5) col=<.55,.5,.45> a=0>.45:.4>0 sz=$size*(.6>2) r=sprite(smoke-puff,alpha)
pop wax burst=30 on=disc(.6) life=.5..1 v=sdir()*(4..7)+up(2..4) size=.06..0.12 col=oklch(.88 .1 70) acc=grav() a=1>0 floor=stick r=sprite(chip,alpha,velocity,.02)`;

function inArena(ctx) { return ctx.place.players.filter((p) => !p.state.dead && flat(p.feetPosition, ARENA) < ARENA.r); }
function publish(ctx) {
  const s = ctx.self.state, b = ctx.place.state.boss ?? {};
  const row = { name: "Bailiff of the Dripping Gate", hp: Math.max(0, Math.round(s.hp)), max: s.maxHp, phase: s.phase ?? 1, engaged: !!s.engaged, dead: !!s.dead };
  if (b.hp !== row.hp || b.engaged !== row.engaged || b.phase !== row.phase || b.dead !== row.dead || b.max !== row.max) ctx.place.state.boss = row;
}
export function onSpawn(ctx) {
  const s = ctx.self.state;
  if (s.maxHp === undefined) { s.maxHp = B.hp; s.hp = B.hp; }
  s.kind = "bailiff"; publish(ctx);
}
export function update(ctx, dt) {
  const s = ctx.self.state, now = ctx.now(), f = ctx.self.feetPosition;
  const here = inArena(ctx);
  if (s.dead) { ctx.self.velocity = { x: 0, y: ctx.self.velocity.y, z: 0 }; return; }
  if (s.hp <= 0) {
    s.dead = true; s.deadAt = now; s.engaged = false; s.slams = null;
    for (const p of s.pools ?? []) ctx.destroy(p.id);
    s.pools = [];
    ctx.emit("slowMo", { scale: 0.35, duration: 1.2 }, { audience: { place: ctx.self.place } });
    ctx.emit("shockwave", { position: { ...f, y: f.y + 1 }, speed: 18, thickness: 2, intensity: 1 });
    ctx.emit("screenFlash", { color: "#ffd9a0", duration: 0.4, intensity: 0.12 });
    ctx.emit("playSound", { clip: sfx("great-bronze-bell-cracking-final-toll"), position: f, volume: 1, maxDistance: 120 });
    animate(ctx, ctx.self, { "scale.y": 0.1, "scale.x": 2, "scale.z": 2 }, { duration: 2.4 });
    for (const p of here) { p.state.bossKilled = true; ctx.emit("milestone", { step: 3, name: "bailiff-defeated" }, { audience: { player: p.id } }); }
    payout(ctx, f, B.xp, 60, false);
    ctx.place.state.bailiffDownAt = now;
    publish(ctx); return;
  }
  // engage / reset
  if (here.length) {
    s.emptySince = null;
    if (!s.engaged) { s.engaged = true; s.nextSlam = now + 2500; s.nextPools = now + 6000; ctx.emit("playSound", { clip: sfx("bailiff-roar-wax-choir-and-bell"), position: f, volume: 1, maxDistance: 80 }); }
    const want = Math.round(B.hp * (1 + B.perExtra * (here.length - 1)));
    if (want > s.maxHp) { s.hp += want - s.maxHp; s.maxHp = want; }
  } else if (s.engaged) {
    s.emptySince ??= now;
    if (now - s.emptySince > B.resetAfter * 1000) {
      s.engaged = false; s.hp += B.hp - s.hp; s.maxHp = B.hp; s.slams = null; s.phase = 1;
      for (const p of s.pools ?? []) ctx.destroy(p.id);
      s.pools = [];
      ctx.self.feetPosition = HOME;
    }
  }
  const ratio = s.hp / s.maxHp;
  const phase = ratio > 0.7 ? 1 : ratio > 0.35 ? 2 : 3;
  if (phase !== s.phase) {
    if (s.phase && phase > s.phase) { ctx.emit("playSound", { clip: sfx("bailiff-roar-wax-choir-and-bell"), position: f, volume: 1, maxDistance: 80 }); ctx.emit("shockwave", { position: { ...f, y: f.y + 1 }, speed: 12, thickness: 1.5, intensity: 0.5 }); }
    s.phase = phase;
  }
  // pools: burn whoever stands in them
  if (s.pools?.length) {
    const live = s.pools.filter((p) => p.until > now);
    if (live.length !== s.pools.length) { for (const p of s.pools) if (p.until <= now) ctx.destroy(p.id); s.pools = live; }
    if (now - (s.poolTick ?? 0) > 1000) { s.poolTick = now; for (const p of live) hurtPlayers(ctx, p, 2, B.poolDmg, now); }
  }
  publish(ctx);
  if (!s.engaged) { const d = flat(f, HOME); ctx.self.velocity = d > 1 ? { x: ((HOME.x - f.x) / d) * 3, y: ctx.self.velocity.y, z: ((HOME.z - f.z) / d) * 3 } : { x: 0, y: ctx.self.velocity.y, z: 0 }; return; }

  let prey = null, best = 99;
  for (const p of here) { const d = flat(p.feetPosition, f); if (d < best) { best = d; prey = p; } }
  let vx = 0, vz = 0;
  if (s.slams?.length) {
    // a slam in the air: the body holds; each lands at its time
    const next = s.slams[0];
    if (now >= next.at) {
      s.slams = s.slams.slice(1);
      ctx.emit("fx", { position: { x: next.x, y: next.y + 0.1, z: next.z }, script: BELL, params: { r: B.slamRadius } });
      ctx.emit("playSound", { clip: sfx("bronze-bell-mace-slam-ground-toll"), position: next, volume: 1, maxDistance: 70 });
      ctx.emit("screenShake", { intensity: 0.35, duration: 0.3 }, { audience: { place: ctx.self.place } });
      hurtPlayers(ctx, next, B.slamRadius, B.slamDmg, now);
      ctx.emit("squash", { target: ctx.self.id, axis: "y", intensity: 0.25, duration: 0.3 });
      if (!s.slams.length) { s.slams = null; s.nextSlam = now + (phase === 3 ? 2500 : 4500); }
    }
  } else if (prey) {
    const dx = prey.feetPosition.x - f.x, dz = prey.feetPosition.z - f.z, d = Math.hypot(dx, dz) || 1;
    ctx.self.rotation = (Math.atan2(-dx, -dz) * 180) / Math.PI;
    if (now >= (s.nextSlam ?? 0)) {
      const count = phase === 3 ? 3 : 1, slams = [];
      for (let i = 0; i < count; i++) {
        const t = here[i % here.length] ?? prey;
        const at = now + (B.windup + i * 0.9) * 1000;
        slams.push({ x: t.feetPosition.x, y: t.feetPosition.y, z: t.feetPosition.z, at });
        telegraph(ctx, t.feetPosition.x, t.feetPosition.y, t.feetPosition.z, B.slamRadius, B.windup + i * 0.9);
      }
      s.slams = slams;
      ctx.emit("playSound", { clip: sfx("bell-mace-raised-chain-groan"), position: f, volume: 0.9 });
    } else if (phase >= 2 && now >= (s.nextPools ?? 0)) {
      s.nextPools = now + 9000;
      const pools = [...(s.pools ?? [])];
      for (const p of here) {
        const id = ctx.spawn({ tags: ["wax-pool"], feetPosition: { x: p.feetPosition.x, y: p.feetPosition.y + 0.03, z: p.feetPosition.z }, physics: "none",
          primitive: { kind: "cylinder", radiusTop: 2, radiusBottom: 2, height: 0.04 }, material: { color: "oklch(0.55 0.15 50)", emissive: "oklch(0.6 0.2 45)", emissiveIntensity: 0.8, roughness: 0.2 },
          fx: { script: POOL, params: { r: 2 } }, lifetime: 10 });
        pools.push({ id, x: p.feetPosition.x, y: p.feetPosition.y, z: p.feetPosition.z, until: now + 9000 });
      }
      s.pools = pools;
      ctx.emit("playSound", { clip: sfx("molten-wax-splash-sizzle"), position: f, volume: 0.9 });
    } else if (d > 2.2) { vx = (dx / d) * 2.4; vz = (dz / d) * 2.4; }
    else if (now >= (s.nextSwing ?? 0)) { s.nextSwing = now + 1800; hurtPlayers(ctx, prey.feetPosition, 1.2, 12, now); ctx.emit("squash", { target: ctx.self.id, axis: "z", intensity: 0.2, duration: 0.25 }); }
  }
  ctx.self.velocity = { x: vx, y: ctx.self.velocity.y, z: vz };
}
