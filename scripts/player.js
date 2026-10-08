// VEILFALL hero (Bladewraith). Left click: walk / attack what you click. Right click or E: Crosswound.
// Space: Griefstep dash toward the cursor. Q: tonic. WASD also walks. Hits are judged here, on the
// striker's machine, and written to the enemy's state; the wax-pack manager reads hp and pays XP.
import { raycast, getInputRay } from "builtin/physics";
import { findPath } from "builtin/nav";
import C from "./lib/data/combat.yml";

const FIRE = { x: 0, y: 0, z: 4.5 };
const A = Math.SQRT1_2; // iso basis: screen-up is (-A,-A) on xz
const me = {}; // this machine's scratch: route, cooldowns, aim

const CHIPS = `fx
pop chips burst=10..16 life=.5..0.9 v=<%normal|0,1,0>*(2..4)+sdir()*(.8..1.6)+<0,1.5,0> size=.05..0.1 spin=-8..8 tint=oklch(.92 .04 85)..oklch(.78 .07 75) acc=grav()+drag(.8) col=$tint a=1>.8:1>0 sz=$size rot=$age*$spin floor=stick r=sprite(chip,alpha,velocity,.02)
pop spark burst=6 life=.12..0.25 v=<%normal|0,1,0>*(4..7)+sdir()*2 size=.02..0.035 col=hdr(4,2.4,.8) a=1>0 r=sprite(ember,add,velocity,.03)
pop flash burst=1 life=.12 size=.7 col=hdr(2.5,1.6,.8) a=.8>0 sz=$size*(.6>1.3) r=sprite(soft-disc,add)`;
const SLASH = `fx
pop arc burst=1 life=.22 size=3.2 col=hdr(2.2,2.4,3) a=.9>0 sz=$size*(.8>1.1) r=sprite(soft-disc,add)
pop motes burst=18 on=arc() life=.3..0.6 v=sdir()*(1..2.5)+up(.8) size=.03..0.06 col=hdr(1.6,1.8,2.6) a=1>0 r=sprite(mote,add)`;
const DASH = `fx
pop ghost burst=14 on=disc(.4) life=.35..0.6 v=up(.6..1.4)+sdir()*.4 size=.25..0.5 col=<.55,.6,.8> a=.5>0 sz=$size*(1>.4) acc=drag(2) r=sprite(smoke-puff,alpha)
pop shards burst=10 life=.25..0.45 v=sdir()*(2..4) size=.03..0.05 col=hdr(1.5,1.7,2.5) a=1>0 r=sprite(shard,add,velocity,.03)`;

const sfx = (n) => `/cdn/moodboard-gothic-horror/sfx-${n}.mp3`;
const yawTo = (dx, dz) => (Math.atan2(-dx, -dz) * 180) / Math.PI;
const flat = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);

function groundHit(ctx, ray) {
  return raycast(ctx, ray.origin, ray.direction, { distance: 220, bodies: "static" });
}
function isFoe(o) { return o && o.tags?.includes("enemy") && !(o.state?.dead) && (o.state?.hp ?? 1) > 0; }

export function onSpawn(ctx) {
  const s = ctx.self.state;
  if (s.hp === undefined) {
    Object.assign(s, { hp: C.hero.hp, maxHp: C.hero.hp, edge: 0, tonics: C.hero.tonics, xp: 0, level: 1, gold: 0, kills: 0, petitions: [], quest: { stage: 0 }, claimed: {}, cls: "bladewraith" });
  }
  s.dead = false; s.target = null; s.goal = null;
}

export function onInput(ctx, input) {
  const s = ctx.self.state;
  if (s.dead || ctx.self.inputHeld) return;
  const ray = getInputRay(ctx, input);
  const now = ctx.now();
  if (ray) {
    const g = groundHit(ctx, ray);
    if (g) me.aim = g.position;
    if (input.pressed.move || (input.held.move && now - (me.lastSteer ?? 0) > 120)) {
      me.lastSteer = now;
      const hit = raycast(ctx, ray.origin, ray.direction, { distance: 220 });
      const o = hit?.id ? ctx.getObject(hit.id) : null;
      if (input.pressed.move && isFoe(o)) { s.target = o.id; s.goal = null; me.talk = null; }
      else if (input.pressed.move && o?.tags?.includes("npc")) { me.talk = o.id; s.target = null; s.goal = { ...o.feetPosition }; me.route = null; }
      else if (g && (input.pressed.move || !s.target)) {
        if (input.pressed.move) { s.target = null; me.talk = null; }
        if (!s.goal || flat(s.goal, g.position) > 1.2) me.route = null;
        s.goal = g.position;
        if (input.pressed.move) ctx.emit("fx", { position: { x: g.position.x, y: g.position.y + 0.05, z: g.position.z }, script: `fx\npop ring burst=1 life=.4 size=.9 col=hdr(1.8,1.3,.6) a=.9>0 sz=$size*(.4>1.2) r=sprite(soft-disc,add)` }, { audience: "local" });
      }
    }
  }
  const mx = input.axes.moveX ?? 0, mz = input.axes.moveZ ?? 0;
  me.keys = mx || mz ? { x: A * mx - A * mz, z: -A * mx - A * mz } : null;
  if (me.keys) { s.goal = null; s.target = null; }
  if (input.pressed.crosswound) crosswound(ctx);
  if (input.pressed.griefstep) griefstep(ctx);
  if (input.pressed.tonic) tonic(ctx);
  if (input.pressed.bag) s.bagOpen = !s.bagOpen;
}

function swingAnim(ctx, clip) {
  ctx.self.anim.attack = { clip, weight: 4, loop: "once", speed: 1.7, mask: { from: "Spine" } };
  me.animOff = ctx.now() + 380;
}

function strike(ctx, foe, dmg, crit) {
  foe.state.hp -= dmg;
  foe.state.lastHit = ctx.self.id;
  const p = { x: foe.feetPosition.x, y: foe.feetPosition.y + 1.1, z: foe.feetPosition.z };
  const f = ctx.self.feetPosition, dx = p.x - f.x, dz = p.z - f.z, d = Math.hypot(dx, dz) || 1;
  ctx.emit("damageNumber", { position: p, value: dmg, crit, color: crit ? "#ffd27a" : "#f2ead8" });
  ctx.emit("fx", { position: p, script: CHIPS, params: { normal: { x: dx / d, y: 0.3, z: dz / d } } });
  ctx.emit("squash", { target: foe.id, axis: "y", intensity: 0.18, duration: 0.15 });
  ctx.emit("flash", { target: foe.id, color: "#ffffff", duration: 0.08 });
  ctx.emit("playSound", { clip: sfx("blade-cutting-into-soft-wax-thud"), position: p, pitch: 0.9 + ctx.random() * 0.2, volume: 0.8 });
  ctx.emit("hitstop", { duration: 0.03 }, { audience: { player: ctx.self.id } });
}

function ashcut(ctx, foe) {
  const s = ctx.self.state, now = ctx.now();
  if (now < (me.swingAt ?? 0)) return;
  me.swingAt = now + C.ashcut.cd * 1000;
  swingAnim(ctx, "cdn/clip-attack.glb");
  ctx.emit("playSound", { clip: sfx("sword-swing-whoosh-short"), position: ctx.self.feetPosition, volume: 0.5, pitch: 0.95 + ctx.random() * 0.15 });
  const crit = ctx.random() < 0.12;
  const dmg = Math.round(C.ashcut.dmg * weaponMul(s) * (crit ? 1.8 : 1) * (0.9 + ctx.random() * 0.2));
  strike(ctx, foe, dmg, crit);
  s.edge = Math.min(100, (s.edge ?? 0) + C.ashcut.edge);
}

function weaponMul(s) { return (s.weapon === "ITEM-001" ? 1.3 : 1) * (1 + 0.08 * ((s.level ?? 1) - 1)); }

function crosswound(ctx) {
  const s = ctx.self.state, now = ctx.now(), cw = C.crosswound;
  if ((s.edge ?? 0) < cw.cost || now < (me.cwAt ?? 0)) {
    ctx.emit("playSound", { clip: sfx("dull-click-denied"), position: ctx.self.feetPosition, volume: 0.3 });
    return;
  }
  me.cwAt = now + cw.cd * 1000; s.edge -= cw.cost;
  const f = ctx.self.feetPosition, aim = me.aim ?? f;
  let dx = aim.x - f.x, dz = aim.z - f.z; const d = Math.hypot(dx, dz) || 1; dx /= d; dz /= d;
  s.faceYaw = yawTo(dx, dz); s.goal = null;
  swingAnim(ctx, "cdn/clip-kick.glb");
  ctx.self.anim.attack.clip = "cdn/clip-attack.glb";
  ctx.emit("fx", { position: { x: f.x + dx * 1.6, y: f.y + 1, z: f.z + dz * 1.6 }, script: SLASH });
  ctx.emit("playSound", { clip: sfx("heavy-sword-cleave-whoosh-ringing"), position: f, volume: 0.8 });
  ctx.emit("cameraPunch", { direction: { x: dx, y: 0, z: dz }, intensity: 0.25 }, { audience: { player: ctx.self.id } });
  const cos = Math.cos((cw.arc / 2) * Math.PI / 180);
  for (const r of ctx.query({ tags: ["enemy"], radius: cw.reach + 0.6, center: f })) {
    const o = ctx.getObject(r.id); if (!isFoe(o)) continue;
    const ex = o.feetPosition.x - f.x, ez = o.feetPosition.z - f.z, ed = Math.hypot(ex, ez) || 1;
    if ((ex * dx + ez * dz) / ed < cos && ed > 1) continue;
    strike(ctx, o, Math.round(cw.dmg * weaponMul(s) * (0.9 + ctx.random() * 0.2)), false);
  }
}

function griefstep(ctx) {
  const s = ctx.self.state, now = ctx.now(), g = C.griefstep;
  if (now < (me.dashReady ?? 0)) return;
  const f = ctx.self.feetPosition, aim = me.aim ?? { x: f.x, z: f.z - 1 };
  let dx = aim.x - f.x, dz = aim.z - f.z; const d = Math.hypot(dx, dz);
  if (d < 0.2) { dx = -Math.sin(((s.faceYaw ?? 0) * Math.PI) / 180); dz = -Math.cos(((s.faceYaw ?? 0) * Math.PI) / 180); } else { dx /= d; dz /= d; }
  me.dashReady = now + g.cd * 1000; s.dashReadyAt = me.dashReady;
  me.dash = { dx, dz, until: now + g.time * 1000 };
  s.iframesUntil = now + g.iframes * 1000;
  s.faceYaw = yawTo(dx, dz); s.goal = null; s.target = null; me.route = null;
  ctx.emit("fx", { position: { x: f.x, y: f.y + 0.9, z: f.z }, script: DASH });
  ctx.emit("playSound", { clip: sfx("ghostly-dash-whoosh-glass-chime"), position: f, volume: 0.7 });
}

function tonic(ctx) {
  const s = ctx.self.state;
  if ((s.tonics ?? 0) <= 0 || s.hp >= s.maxHp) return;
  s.tonics -= 1;
  s.hp += Math.min(C.hero.tonicHeal, s.maxHp - s.hp);
  const f = ctx.self.feetPosition;
  ctx.emit("fx", { position: { x: f.x, y: f.y + 1, z: f.z }, script: `fx\npop heal burst=24 on=disc(.5) life=.6..1 v=up(1.2..2.4) size=.05..0.1 col=hdr(2.6,.6,.5) a=1>0 r=sprite(mote,add)` });
  ctx.emit("playSound", { clip: sfx("drinking-tonic-gulp-and-glass-clink"), position: f, volume: 0.7 });
}

function walkTo(ctx, goal, speed, dt) {
  const f = ctx.self.feetPosition, now = ctx.now();
  let r = me.route;
  if (!r || now - r.at > 900 || r.stalled > 8) {
    const res = findPath(ctx, f, goal);
    r = me.route = { points: res.points?.length ? res.points : [goal], i: 0, at: now, stalled: 0, last: { ...f } };
  }
  let p = r.points[r.i];
  while (p && flat(p, f) < 0.35 && r.i < r.points.length - 1) p = r.points[++r.i];
  if (!p || flat(p, f) < 0.3) return null;
  const dx = p.x - f.x, dz = p.z - f.z, d = Math.hypot(dx, dz);
  r.stalled = flat(f, r.last) < speed * dt * 0.2 ? r.stalled + 1 : 0; r.last = { ...f };
  return { x: (dx / d) * speed, z: (dz / d) * speed };
}

export function update(ctx, dt) {
  if (ctx.self.state.hp === undefined) onSpawn(ctx);
  const s = ctx.self.state, now = ctx.now(), f = ctx.self.feetPosition;
  const vy = (ctx.self.velocity?.y ?? 0) + (ctx.self.grounded ? 0 : ctx.place.gravity.y * dt);
  if (me.animOff && now > me.animOff) { ctx.self.anim.attack = null; me.animOff = 0; }

  // death: a beat, then back on your feet at the Wayside Fire
  if (s.hp <= 0 && !s.dead) {
    s.dead = true; s.deadAt = now; s.goal = null; s.target = null; me.route = null; me.dash = null;
    ctx.self.anim.death = { clip: "cdn/clip-die.glb", weight: 20, loop: "once" };
    ctx.emit("playSound", { clip: sfx("deep-toll-bell-death-sting"), position: f, volume: 0.9 });
    ctx.emit("stat", { name: "deaths" }, { audience: { player: ctx.self.id } });
  }
  if (s.dead) {
    ctx.self.velocity = { x: 0, y: vy, z: 0 };
    ctx.self.vignette = 0.55;
    if (now - s.deadAt > 1800) {
      ctx.self.anim.death = null;
      ctx.self.feetPosition = { x: FIRE.x + (ctx.random() - 0.5) * 2, y: 0.5, z: FIRE.z };
      s.hp += s.maxHp - s.hp; s.tonics = C.hero.tonics; s.dead = false; s.edge = 0;
      ctx.self.vignette = 0;
    }
    return;
  }
  ctx.self.vignette = s.hp < s.maxHp * 0.3 ? 0.22 : 0;

  // the fire mends: tonics refill and life knits back in the camp
  if (Math.hypot(f.x, f.z) < 7) {
    if ((s.tonics ?? 0) < C.hero.tonics) s.tonics = C.hero.tonics;
    if (s.hp < s.maxHp && now - (me.mendAt ?? 0) > 500) { me.mendAt = now; s.hp += Math.min(5, s.maxHp - s.hp); }
  }
  if (now - (me.edgeDecay ?? 0) > 1000 && !s.target) { me.edgeDecay = now; if ((s.edge ?? 0) > 0) s.edge = Math.max(0, s.edge - 2); }

  if (me.dash && now < me.dash.until) {
    const sp = C.griefstep.dist / C.griefstep.time;
    ctx.self.velocity = { x: me.dash.dx * sp, y: vy, z: me.dash.dz * sp };
    return;
  }
  me.dash = null;

  let v = null;
  if (me.keys) {
    v = { x: me.keys.x * C.hero.speed, z: me.keys.z * C.hero.speed };
    const l = Math.hypot(v.x, v.z); if (l > C.hero.speed) { v.x *= C.hero.speed / l; v.z *= C.hero.speed / l; }
  } else if (s.target) {
    const foe = ctx.getObject(s.target);
    if (!isFoe(foe)) s.target = null;
    else {
      const d = flat(foe.feetPosition, f);
      if (d > C.ashcut.reach) {
        if (!me.chase || flat(me.chase, foe.feetPosition) > 1) { me.chase = { ...foe.feetPosition }; me.route = null; }
        v = walkTo(ctx, foe.feetPosition, C.hero.speed, dt);
      } else {
        s.faceYaw = yawTo(foe.feetPosition.x - f.x, foe.feetPosition.z - f.z);
        ashcut(ctx, foe);
      }
    }
  } else if (s.goal) {
    v = walkTo(ctx, s.goal, C.hero.speed, dt);
    if (!v) { s.goal = null; me.route = null; }
  }
  if (me.talk) {
    const npc = ctx.getObject(me.talk);
    if (!npc) me.talk = null;
    else if (flat(npc.feetPosition, f) < 2.8) {
      s.talk = { id: me.talk, at: now }; me.talk = null; s.goal = null; v = null;
      s.faceYaw = yawTo(npc.feetPosition.x - f.x, npc.feetPosition.z - f.z);
    }
  }
  if (v) s.faceYaw = yawTo(v.x, v.z);
  ctx.self.velocity = { x: v?.x ?? 0, y: vy, z: v?.z ?? 0 };
}
