// VEILFALL hero (Bladewraith). Left click: walk / attack what you click. Right click or E: Crosswound.
// Space: Griefstep dash toward the cursor. Q: tonic. WASD also walks. Hits are judged here, on the
// striker's machine, and written to the enemy's state; the wax-pack manager reads hp and pays XP.
import { raycast, getInputRay } from "builtin/physics";
import { findPath } from "builtin/nav";
import { floorDist } from "./lib/data/veilfall-map.js";
import C from "./lib/data/combat.yml";
import { shopInput } from "./lib/shop.js";
import * as CH from "./lib/character.js";
import R from "./lib/data/realms.yml";

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
// the walkable floor is the map's shape (floorDist < 0); the cliffs past its lip are scenery
const EDGE = 0.4;
function floorGrad(x, z) {
  const e = 0.25, gx = floorDist(x + e, z) - floorDist(x - e, z), gz = floorDist(x, z + e) - floorDist(x, z - e), l = Math.hypot(gx, gz) || 1;
  return { x: gx / l, z: gz / l };
}
// a click on a bank or cliff: the nearest floor point on the line back toward the hero
function reachable(goal, from) {
  if (floorDist(goal.x, goal.z) < -0.6) return goal;
  for (let t = 0.05; t <= 1; t += 0.05) {
    const x = goal.x + (from.x - goal.x) * t, z = goal.z + (from.z - goal.z) * t;
    if (floorDist(x, z) < -0.6) return { x, y: from.y, z };
  }
  return null;
}
// a step that would carry the body past the lip loses its outward part; a body already past it is drawn back in
function keepOnFloor(f, v, dt) {
  if (!v) return v;
  const nx = f.x + v.x * dt, nz = f.z + v.z * dt, d = floorDist(nx, nz);
  if (d < EDGE) return v;
  const g = floorGrad(nx, nz), out = v.x * g.x + v.z * g.z;
  let x = v.x, z = v.z;
  if (out > 0) { x -= g.x * out; z -= g.z * out; }
  if (floorDist(f.x, f.z) > EDGE) { x -= g.x * 3; z -= g.z * 3; }
  return { x, z };
}
function isFoe(o) { return o && o.tags?.includes("enemy") && !(o.state?.dead) && (o.state?.hp ?? 1) > 0; }

export function onSpawn(ctx) {
  const s = ctx.self.state;
  if (s.hp === undefined) {
    Object.assign(s, CH.fresh(null, "bladewraith"));
  }
  s.dead = false; s.target = null; s.goal = null;
}

// THE FRONT DOOR: title → realm list → character select → create → enter world. The UI's buttons send
// sendAction('menu', { a, v, n }); n is a click's stamp so one press acts once. A Bearer lives in the characters
// table (scripts/lib/character.js), one realm each; player.state only carries the one that is in the world now.
// While s.menu is set the body is hidden and parked in the Veil (places/veil, a solo copy: nobody else there).
const CLASSES = ["bladewraith", "soulweaver", "hellwarden", "shadowmancer", "primalist", "gloamstalker"];
const ANCESTRIES = ["cinderkin", "fenborn", "stonebound", "skyforged"];
const PLAYABLE = { bladewraith: true }; // M1: one hero; the other five are sealed until their milestone
const MENU_PLACE = "veil";
function msg(ctx, text) { ctx.self.state.msg = { text, at: ctx.now() }; }
function click(ctx, pitch = 1) { ctx.emit("playSound", { clip: sfx("stone-ledger-page-turn-soft"), position: ctx.self.feetPosition, volume: 0.5, pitch }, { audience: "local" }); }
async function refresh(ctx) {
  const s = ctx.self.state, realm = CH.realmOf(ctx).room;
  try {
    const r = await CH.roster(ctx, realm);
    s.roster = { realm, chars: r.chars, per: r.per, at: ctx.now() };
    if (!r.chars.some((c) => c.id === s.sel)) s.sel = r.chars[0]?.id ?? null;
  } catch (e) { ctx.log("roster failed", String(e)); s.roster = { realm, chars: [], per: {}, at: ctx.now(), error: true }; msg(ctx, "The realm's ledger is unreadable. Try again."); }
}
function hasVeil(ctx) { return me.veil ??= (ctx.world.files ?? []).includes("places/veil/config.yaml"); }
function goVeil(ctx) {
  if (!hasVeil(ctx) || ctx.self.place === MENU_PLACE) return;
  if (me.crossAt && ctx.now() - me.crossAt < 4000) return;
  me.crossAt = ctx.now();
  const out = ctx.cross(ctx.self, MENU_PLACE);
  if (!out?.crossed) ctx.log("veil cross refused", out?.verdict);
}
async function busy(ctx, label, fn) {
  const s = ctx.self.state; if (s.busy) return; s.busy = label;
  try { await fn(); } catch (e) { ctx.log(label + " failed", String(e)); msg(ctx, "Something in the ledger tore. Try again."); }
  finally { s.busy = null; }
}
function menuInput(ctx, d) {
  const s = ctx.self.state;
  if (!d || d.n === me.menuN || s.busy) return; me.menuN = d.n;
  const pick = s.pick ?? { anc: "cinderkin", cls: "bladewraith", name: CH.rollName("cinderkin", () => ctx.random()) };
  const max = R.maxChars, here = CH.realmOf(ctx).room;
  switch (d.a) {
    case "title": s.menu = "title"; s.confirmDel = null; click(ctx, 0.85); break;
    case "realms": s.menu = "realms"; click(ctx); refresh(ctx); break;
    case "chars": s.menu = "chars"; s.confirmDel = null; click(ctx); refresh(ctx); break;
    case "realm": {
      const r = R.realms.find((x) => x.room === d.v); if (!r) break;
      click(ctx, 1.1);
      if (r.room === here) { s.menu = "chars"; refresh(ctx); break; }
      s.menu = "chars"; s.menuNext = "chars"; s.roster = null; s.busy = "Crossing to " + r.name;
      const out = ctx.cross(ctx.self, `world:${ctx.world.id}/room:${r.room}` + (hasVeil(ctx) ? "+" + MENU_PLACE : ""));
      if (!out?.crossed) { s.busy = null; msg(ctx, "That realm would not open. Try again."); ctx.log("realm cross refused", out?.verdict); }
      break;
    }
    case "sel": s.sel = Number(d.v); s.confirmDel = null; click(ctx, 1.05); break;
    case "new":
      if ((s.roster?.chars?.length ?? 0) >= max) { msg(ctx, `${max} Bearers is the most one realm will hold.`); break; }
      s.pick = { anc: pick.anc, cls: "bladewraith", name: CH.rollName(pick.anc, () => ctx.random()) }; s.menu = "create"; click(ctx); break;
    case "anc": if (ANCESTRIES.includes(d.v)) { s.pick = { ...pick, anc: d.v, name: CH.rollName(d.v, () => ctx.random()) }; click(ctx, 1.1); } break;
    case "cls": if (CLASSES.includes(d.v)) { s.pick = { ...pick, cls: d.v }; click(ctx, PLAYABLE[d.v] ? 1.15 : 0.7); } break;
    case "reroll": s.pick = { ...pick, name: CH.rollName(pick.anc, () => ctx.random()) }; click(ctx, 1.2); break;
    case "create":
      if (!PLAYABLE[pick.cls]) { msg(ctx, "That path is sealed for now."); break; }
      busy(ctx, "Writing your name", async () => {
        let data = CH.fresh(pick.anc, pick.cls);
        // the Bearer someone already walked before realms existed: their road becomes their first character
        const total = Object.values(s.roster?.per ?? {}).reduce((a, b) => a + b, 0);
        if (!s.legacyDone && total === 0 && (s.xp ?? 0) > 0) {
          data = { ...CH.fresh(pick.anc, pick.cls), ...CH.pack(s), ancestry: pick.anc, cls: pick.cls, copper: (s.copper ?? 0) + (s.gold ?? 0) * 10 };
          s.legacyDone = true;
        }
        let name = pick.name, out = await CH.create(ctx, here, name, pick.anc, pick.cls, data);
        for (let i = 0; out.error === "taken" && i < 6; i++) { name = CH.rollName(pick.anc, () => ctx.random()); out = await CH.create(ctx, here, name, pick.anc, pick.cls, data); }
        if (out.error === "full") { msg(ctx, `${max} Bearers is the most one realm will hold.`); return; }
        if (out.error) { msg(ctx, "That name is already walking this realm."); return; }
        ctx.emit("playSound", { clip: sfx("quill-scratch-and-wax-seal-press"), position: ctx.self.feetPosition, volume: 0.8 }, { audience: "local" });
        s.sel = out.id; s.menu = "chars"; s.pick = null; msg(ctx, `${name} is written into ${CH.realmOf(ctx).name}.`);
        await refresh(ctx);
      });
      break;
    case "delete": if (s.sel) { s.confirmDel = s.sel; click(ctx, 0.7); } break;
    case "delete-no": s.confirmDel = null; click(ctx, 0.85); break;
    case "delete-yes":
      if (!s.confirmDel) break;
      busy(ctx, "Unwriting", async () => { await CH.remove(ctx, s.confirmDel); s.confirmDel = null; s.sel = null; await refresh(ctx); msg(ctx, "The name is unwritten."); });
      break;
    case "enter":
      if (!s.sel) break;
      busy(ctx, "Entering the world", async () => {
        const c = await CH.load(ctx, s.sel, here);
        if (!c) { msg(ctx, "That Bearer is not on this realm."); await refresh(ctx); return; }
        const base = CH.fresh(c.ancestry, c.cls);
        for (const k of CH.CHAR_KEYS) s[k] = c.data[k] ?? base[k];
        s.ancestry = c.ancestry; s.cls = c.cls; s.charId = c.id; s.charName = c.name;
        s.dead = false; s.goal = null; s.target = null; s.talk = null; s.dialog = null; s.shop = null; s.bagOpen = false;
        if (s.hp <= 0) s.hp = s.maxHp;
        s.pendingPos = c.data.pos ?? CH.START; s.enteredAt = ctx.now(); s.menu = null;
        me.lastHp = s.hp; me.saved = JSON.stringify(CH.pack(s)); me.saveAt = ctx.now();
        ctx.emit("playSound", { clip: sfx("deep-bell-toll-distant-with-embers"), position: ctx.self.feetPosition, volume: 0.8 }, { audience: "local" });
        ctx.emit("milestone", { step: 0, name: "entered-world" }, { audience: { player: ctx.self.id } });
        if (ctx.self.place !== "main") { me.crossAt = ctx.now(); ctx.cross(ctx.self, "main"); }
      });
      break;
    case "logout":
      if (!s.charId) { s.menu = "chars"; break; }
      busy(ctx, "Resting at the fire", async () => {
        await CH.save(ctx, s.charId, s, ctx.self.feetPosition);
        s.charId = null; s.menu = "chars"; s.shop = null; s.bagOpen = false;
        await refresh(ctx);
      });
      break;
  }
}

export function onInput(ctx, input) {
  const s = ctx.self.state;
  if (input.actionData?.menu) menuInput(ctx, input.actionData.menu);
  if (s.menu) return;
  if (input.actionData?.shop) shopInput(ctx, input.actionData.shop);
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
        const at = reachable(g.position, ctx.self.feetPosition);
        if (at && (!s.goal || flat(s.goal, at) > 1.2)) me.route = null;
        if (at) { s.goal = at; g.position = at; }
        if (at && input.pressed.move) ctx.emit("fx", { position: { x: g.position.x, y: g.position.y + 0.05, z: g.position.z }, script: `fx\npop ring burst=1 life=.4 size=.9 col=hdr(1.8,1.3,.6) a=.9>0 sz=$size*(.4>1.2) r=sprite(soft-disc,add)` }, { audience: "local" });
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
  if (input.pressed.guard) guard(ctx);
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
  if (s.ancestry === "fenborn") me.hasteUntil = now + (g.time + C.traits.fenborn.secs) * 1000;
  if (s.ancestry === "skyforged") s.edge = Math.min(100, (s.edge ?? 0) + C.traits.skyforged.edge);
  ctx.emit("fx", { position: { x: f.x, y: f.y + 0.9, z: f.z }, script: DASH });
  ctx.emit("playSound", { clip: sfx("ghostly-dash-whoosh-glass-chime"), position: f, volume: 0.7 });
}

// Afterimage Guard: a held stance; the next blow inside the window is caught, the afterimage takes it,
// and the blade answers every foe in reach (the riposte is judged here, when the stance sees it consumed)
const GUARD = `fx
pop shell n=1 at=point().c(1) size=2.2 col=hdr(.9,1.3,2.2)*flick(6,.2) a=.35 r=sprite(soft-disc,add)
pop mote rate=30 on=sphere(.9).c(1) life=.3..0.5 v=sdir()*.4 size=.03..0.05 col=hdr(1.5,1.8,2.8) a=1>0 r=sprite(mote,add)
pop glow n=1 at=point().c(1.1) r=light(<.45,.72,1.25>,14*flick(5,.15),9)`;
// the catch: the afterimage shatters in cold light where the blow landed
const CATCH = `fx
pop shards burst=26..34 life=.35..0.7 on=sphere(.5).c(1) v=sdir()*(3..6) size=.04..0.09 acc=drag(3) col=hdr(1.6,2.2,3.6)>hdr(.4,.8,1.6) a=1>0 r=sprite(ember,add,velocity,.05)
pop ring burst=1 life=.35 at=point().c(.15) size=.4 sz=$size*(1>9) col=hdr(.8,1.3,2.4) a=.8>0 r=sprite(soft-disc,add)
pop ghost burst=6 life=.45..0.6 on=box(.2,1.6,.2).c(.95) v=up(.4) size=.5..0.7 sz=$size*(1>1.6) col=hdr(.6,.95,1.8) a=.45>0 r=sprite(smoke-puff,add)
pop flare burst=1 life=.4 at=point().c(1.1) b=1>0 r=light(<.5,.75,1.3>,$b*60,12)`;
function guard(ctx) {
  const s = ctx.self.state, now = ctx.now(), g = C.guard;
  if (now < (s.guardReadyAt ?? 0)) { ctx.emit("playSound", { clip: sfx("dull-click-denied"), position: ctx.self.feetPosition, volume: 0.3 }); return; }
  s.guardReadyAt = now + g.cd * 1000; s.guardUntil = now + g.window * 1000; me.guardSeen = s.riposte ?? 0;
  s.goal = null; me.route = null;
  ctx.self.fx = { script: GUARD };
  ctx.emit("playSound", { clip: sfx("ghostly-glass-shimmer-guard-up"), position: ctx.self.feetPosition, volume: 0.7 });
}
function guardTick(ctx, now) {
  const s = ctx.self.state;
  if ((s.riposte ?? 0) > (me.guardSeen ?? 0)) {
    me.guardSeen = s.riposte; ctx.self.fx = null;
    const f = ctx.self.feetPosition;
    ctx.emit("fx", { position: { x: f.x, y: f.y + 1, z: f.z }, script: SLASH });
    ctx.emit("fx", { position: { x: f.x, y: f.y, z: f.z }, script: CATCH });
    ctx.emit("shockwave", { position: { x: f.x, y: f.y + 1, z: f.z }, speed: 14, thickness: 0.4, intensity: 0.5 });
    ctx.emit("screenFlash", { color: "#9cc8ff", duration: 0.12, intensity: 0.12 }, { audience: { player: ctx.self.id } });
    ctx.emit("playSound", { clip: sfx("sword-parry-ring-and-counter-slash"), position: f, volume: 0.9 });
    ctx.emit("hitstop", { duration: 0.06 }, { audience: { player: ctx.self.id } });
    for (const r of ctx.query({ tags: ["enemy"], radius: C.guard.reach, center: f })) { const o = ctx.getObject(r.id); if (isFoe(o)) strike(ctx, o, Math.round(C.guard.riposte * weaponMul(s)), true); }
    s.edge = Math.min(100, (s.edge ?? 0) + 20);
  } else if (ctx.self.fx && now > (s.guardUntil ?? 0)) ctx.self.fx = null;
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

// ancestry traits, read off the life lost since last tick (every damage path writes hp directly)
function traitTick(ctx, now) {
  const s = ctx.self.state, T = C.traits, drop = (me.lastHp ?? s.hp) - s.hp;
  if (drop > 0 && s.hp > 0) {
    const f = ctx.self.feetPosition, at = { x: f.x, y: f.y + 2.2, z: f.z };
    if (s.ancestry === "cinderkin" && now >= (s.wardReadyAt ?? 0)) {
      s.hp += Math.min(T.cinderkin.ward, drop); s.wardReadyAt = now + T.cinderkin.every * 1000;
      ctx.emit("damageNumber", { position: at, text: "EMBER WARD", color: "#ff9a5a", size: 0.8 });
      ctx.emit("fx", { position: { x: f.x, y: f.y + 1, z: f.z }, script: `fx\npop e burst=22 on=sphere(.6) life=.4..0.8 v=sdir()*(1..2)+up(1) size=.03..0.06 col=hdr(4,1.6,.4) a=1>0 r=sprite(ember,add,velocity,.03)` });
    } else if (s.ancestry === "stonebound" && drop >= T.stonebound.heavy) {
      s.hp += Math.round(drop * T.stonebound.cut);
      ctx.emit("damageNumber", { position: at, text: "STONEBOUND", color: "#d8c28a", size: 0.8 });
    }
  }
  me.lastHp = s.hp;
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
  // a fresh visit opens on the title in the Veil; a realm cross lands on that realm's character list
  if (ctx.self.isLocal !== false && !ctx.session.vfDoor) {
    ctx.session.vfDoor = true;
    if (s.charId && !s.menu && s.menuNext !== "chars") CH.save(ctx, s.charId, s, f).catch(() => {}); // a body left in the world: its last stand is kept
    s.menu = s.menuNext ?? "title"; s.menuNext = null; s.charId = null; s.pendingPos = null; s.busy = null; s.confirmDel = null;
    refresh(ctx);
  }
  if (s.menu) {
    if (ctx.self.visible !== false) ctx.self.visible = false; // nobody sees a Bearer who is not in the world, not even its player
    if ((s.iframesUntil ?? 0) < now + 500) s.iframesUntil = now + 1500;
    ctx.self.velocity = { x: 0, y: vy, z: 0 }; me.lastHp = s.hp;
    goVeil(ctx);
    if (s.menuNext === "chars" && ctx.self.place) s.menuNext = null;
    if (s.roster && s.roster.realm !== CH.realmOf(ctx).room && !s.busy) { s.roster = null; refresh(ctx); } // landed on another realm
    if (s.busy?.startsWith("Crossing") && s.roster === null && !me.crossBusyAt) me.crossBusyAt = now;
    if (me.crossBusyAt && now - me.crossBusyAt > 8000) { s.busy = null; me.crossBusyAt = 0; }
    return;
  }
  if (!s.charId) { s.menu = "title"; return; } // never in the world without a Bearer
  if (ctx.self.place && ctx.self.place !== "main") { if (!me.crossAt || now - me.crossAt > 4000) { me.crossAt = now; ctx.cross(ctx.self, "main"); } ctx.self.velocity = { x: 0, y: vy, z: 0 }; return; }
  if (s.pendingPos) { ctx.self.feetPosition = s.pendingPos; ctx.self.velocity = { x: 0, y: 0, z: 0 }; s.pendingPos = null; s.enteredAt = now; return; }
  if (ctx.self.visible === false) ctx.self.visible = true;
  // the save: every 20 s, when the Bearer changed
  if (now - (me.saveAt ?? 0) > 20000) {
    me.saveAt = now;
    const snap = JSON.stringify(CH.pack(s));
    if (snap !== me.saved) { me.saved = snap; CH.save(ctx, s.charId, s, f).catch((e) => ctx.log("save failed", String(e))); }
  }
  traitTick(ctx, now);
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
  guardTick(ctx, now);

  // the fire mends: tonics refill and life knits back in the camp
  if (Math.hypot(f.x, f.z) < 7) {
    if ((s.tonics ?? 0) < C.hero.tonics) s.tonics = C.hero.tonics;
    if (s.hp < s.maxHp && now - (me.mendAt ?? 0) > 500) { me.mendAt = now; s.hp += Math.min(5, s.maxHp - s.hp); }
  }
  if (now - (me.edgeDecay ?? 0) > 1000 && !s.target) { me.edgeDecay = now; if ((s.edge ?? 0) > 0) s.edge = Math.max(0, s.edge - 2); }

  if (me.dash && now < me.dash.until) {
    const sp = C.griefstep.dist / C.griefstep.time;
    const dv = keepOnFloor(f, { x: me.dash.dx * sp, z: me.dash.dz * sp }, dt);
    ctx.self.velocity = { x: dv.x, y: vy, z: dv.z };
    return;
  }
  me.dash = null;

  let v = null;
  if (me.keys) {
    const sp = C.hero.speed * (now < (me.hasteUntil ?? 0) ? C.traits.fenborn.haste : 1);
    v = { x: me.keys.x * sp, z: me.keys.z * sp };
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
    v = walkTo(ctx, s.goal, C.hero.speed * (now < (me.hasteUntil ?? 0) ? C.traits.fenborn.haste : 1), dt);
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
  if (!v && floorDist(f.x, f.z) > EDGE) v = { x: 0, z: 0 };
  v = keepOnFloor(f, v, dt);
  if (v && Math.hypot(v.x, v.z) > 0.3) s.faceYaw = yawTo(v.x, v.z);
  ctx.self.velocity = { x: v?.x ?? 0, y: vy, z: v?.z ?? 0 };
}
