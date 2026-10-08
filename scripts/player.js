// VEILFALL hero (Bladewraith). Left click: walk / attack what you click. Right click or E: Crosswound.
// Space: Griefstep dash toward the cursor. Q: tonic. WASD also walks. Hits are judged here, on the
// striker's machine, and written to the enemy's state; the wax-pack manager reads hp and pays XP.
import { body as heroBody } from "./lib/data/models.js";
import { gearStats, mitigation, slotOf, sellValue, dustValue, SLOTS, forge, FORGE, freeReforges } from "./lib/loot.js";
import { raycast, getInputRay } from "builtin/physics";
import { findPath } from "builtin/nav";
import { floorDist as mapFloor, areaAt } from "./lib/data/veilfall-map.js";
// the Abbey road is floor only once the Bailiff has fallen in this room (place.state.abbeyOpen, set by the sim)
// which floors this Bearer may walk: derived from their own quest row at the top of every hook that moves them
const GATE = { abbey: false, nave: false, fen: false, orch: false };
const gate = (ctx) => { const st = ctx.self.state.quest?.stage ?? 0, all = !!ctx.place.state?.abbeyOpenAll; GATE.abbey = st >= 4 || all; GATE.nave = st >= 10 || all; GATE.fen = st >= 13 || all; GATE.orch = st >= 18 || all; };
const floorDist = (x, z) => mapFloor(x, z, GATE.abbey, GATE.nave, GATE.fen, GATE.orch);
import C from "./lib/data/combat.yml";
import { shopInput } from "./lib/shop.js";
import { tradeInput, readBoard, TRADE } from "./lib/trade.js";
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
// Diablo-style hero voices on the create screen: one line per class, one sting per ancestry
const CLASS_VOICE = { bladewraith: "/cdn/value.0cf29b47991304e1214bf5f1fabe9184116f7a1d2b47f4a14fda33a61eac7cf9.mp3", soulweaver: "/cdn/value.9ce10f1ad47a45a1d7530b371be14e9e5e824680040e8288aebbdb99719f1189.mp3",
  hellwarden: "/cdn/value.aa483379ca9b6dd18701a4a0f774f42b0e84d2028cf8464a19f9102f7ab87383.mp3", shadowmancer: "/cdn/value.7de7ed8325d60c82c70aa00735483ba943947c58a2a79d98ace8671950926122.mp3",
  primalist: "/cdn/value.6336310ec452e596e6a5d22bfd71e33902b479b4a310e1393921e8e8661cf5c8.mp3", gloamstalker: "/cdn/value.e68e45d40549c8edafc57904dd8c47ed6ddd60795a8ba9cb0c38487751744d12.mp3" };
const ANC_STING = { cinderkin: "ember-flare-whoosh-and-coal-crackle-sting", fenborn: "marsh-water-ripple-and-low-reed-flute-sting",
  stonebound: "deep-stone-grind-and-anvil-ring-sting", skyforged: "high-wind-gust-and-bright-chime-sting" };
function heroCue(ctx, clip, volume) { ctx.emit("playSound", { clip, position: ctx.self.feetPosition, volume }, { audience: { player: ctx.self.id } }); }
function msg(ctx, text) { ctx.self.state.msg = { text, at: ctx.now() }; }
function click(ctx, pitch = 1) { const at = { audience: { player: ctx.self.id } }; ctx.emit("playSound", { clip: sfx("stone-ledger-page-turn-soft"), position: ctx.self.feetPosition, volume: 0.4, pitch }, at); ctx.emit("playSound", { clip: sfx("menu-press-heavy-gilded-metal-clunk"), position: ctx.self.feetPosition, volume: 0.55, pitch }, at); }
async function refresh(ctx) {
  const s = ctx.self.state, realm = CH.realmOf(ctx).room;
  try {
    const r = await CH.roster(ctx, realm);
    s.roster = { realm, chars: r.chars, per: r.per, at: ctx.now() };
    if (!r.chars.some((c) => c.id === s.sel)) s.sel = r.chars[0]?.id ?? null;
  } catch (e) { ctx.log("roster failed", String(e)); s.roster = { realm, chars: [], per: {}, at: ctx.now(), error: true }; msg(ctx, "The realm's ledger is unreadable. Try again."); }
}
function hasVeil(ctx) { if (!me.veil) me.veil = (ctx.world.files ?? []).includes("places/veil/config.yaml"); return me.veil; }
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
  if (d?.a === "hover") { if (s.opt?.hoverSfx !== false && d.n !== me.menuN && ctx.now() - (me.hoverAt ?? 0) > 70) { me.hoverAt = ctx.now(); ctx.emit("playSound", { clip: sfx("menu-hover-soft-stone-whoosh"), position: ctx.self.feetPosition, volume: 0.28, pitch: 0.94 + ctx.random() * 0.12 }, { audience: { player: ctx.self.id } }); } me.menuN = d.n; return; }
  if (!d || d.n === me.menuN || s.busy) return; me.menuN = d.n;
  const pick = s.pick ?? { anc: "cinderkin", cls: "bladewraith", name: CH.rollName("cinderkin", () => ctx.random()) };
  const max = R.maxChars, here = CH.realmOf(ctx).room;
  switch (d.a) {
    case "title": s.menu = "title"; s.confirmDel = null; click(ctx, 0.85); break;
    case "realms": s.menu = "realms"; click(ctx); refresh(ctx); break;
    case "options": s.menu = "options"; click(ctx); break;
    case "opt": { const OPT = { scale: [0.85, 1, 1.15, 1.3], hoverSfx: [true, false], embers: [true, false], tracker: [true, false] }; const o = s.opt ?? {}; const list = OPT[d.v]; if (list) { const cur = o[d.v] ?? list[d.v === "scale" ? 1 : 0]; s.opt = { ...o, [d.v]: list[(list.indexOf(cur) + 1) % list.length] }; click(ctx, 1.1); } break; }
    case "chars": s.menu = "chars"; s.confirmDel = null; click(ctx); refresh(ctx); break;
    case "realm": {
      const r = R.realms.find((x) => x.room === d.v); if (!r) break;
      click(ctx, 1.1);
      if (r.room === here) { s.menu = "chars"; refresh(ctx); break; }
      s.menu = "chars"; s.menuNext = "chars"; s.roster = null; s.busy = "Crossing to " + r.name; me.crossFrom = here; me.crossBusyAt = ctx.now();
      const out = ctx.cross(ctx.self, "world:" + ctx.world.id + "/room:" + r.room);
      if (!out?.crossed) { s.busy = null; msg(ctx, "That realm would not open. Try again."); ctx.log("realm cross refused", out?.verdict); }
      break;
    }
    case "sel": s.sel = Number(d.v); s.confirmDel = null; click(ctx, 1.05); break;
    case "new":
      if ((s.roster?.chars?.length ?? 0) >= max) { msg(ctx, `${max} Bearers is the most one realm will hold.`); break; }
      s.pick = { anc: pick.anc, cls: "bladewraith", name: CH.rollName(pick.anc, () => ctx.random()) }; s.menu = "create"; click(ctx); break;
    case "anc": if (ANCESTRIES.includes(d.v)) { s.pick = { ...pick, anc: d.v, name: CH.rollName(d.v, () => ctx.random()) }; click(ctx, 1.1); heroCue(ctx, sfx(ANC_STING[d.v]), 0.6); } break;
    case "cls": if (CLASSES.includes(d.v)) { const again = pick.cls === d.v; s.pick = { ...pick, cls: d.v }; click(ctx, PLAYABLE[d.v] ? 1.15 : 0.7); if (!again && ctx.now() > (s.voiceAt ?? 0)) { heroCue(ctx, CLASS_VOICE[d.v], 0.95); s.voiceAt = ctx.now() + 1500; } } break;
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
        ctx.emit("playSound", { clip: sfx("quill-scratch-and-wax-seal-press"), position: ctx.self.feetPosition, volume: 0.8 }, { audience: { player: ctx.self.id } });
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
        s.dead = false; s.goal = null; s.target = null; s.talk = null; s.dialog = null; s.shop = null; s.bagOpen = false; s.area = null; s.banner = null;
        if (s.hp <= 0) s.hp = s.maxHp;
        s.pendingPos = c.data.pos ?? CH.START; s.enteredAt = ctx.now(); s.menu = null;
        me.lastHp = s.hp; me.saved = JSON.stringify(CH.pack(s)); me.saveAt = ctx.now();
        ctx.emit("playSound", { clip: sfx("deep-bell-toll-distant-with-embers"), position: ctx.self.feetPosition, volume: 0.8 }, { audience: { player: ctx.self.id } });
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
  gate(ctx);
  const s = ctx.self.state;
  if (input.actionData?.menu) menuInput(ctx, input.actionData.menu);
  if (s.menu) return;
  if (input.actionData?.shop) shopInput(ctx, input.actionData.shop);
  if (input.actionData?.item) itemInput(ctx, input.actionData.item);
  if (input.actionData?.trade) tradeInput(ctx, input.actionData.trade);
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
        if (at && input.pressed.move) ctx.emit("fx", { position: { x: g.position.x, y: g.position.y + 0.05, z: g.position.z }, script: `fx\npop ring burst=1 life=.4 size=.9 col=hdr(1.8,1.3,.6) a=.9>0 sz=$size*(.4>1.2) r=sprite(soft-disc,add)` }, { audience: { player: ctx.self.id } });
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
  const crit = ctx.random() < 0.12 + (s.gs?.crit ?? 0) / 100;
  const dmg = Math.round(C.ashcut.dmg * weaponMul(s) * (crit ? 1.8 : 1) * (0.9 + ctx.random() * 0.2));
  strike(ctx, foe, dmg, crit);
  s.edge = Math.min(100, (s.edge ?? 0) + C.ashcut.edge + (s.gs?.edge ?? 0));
}

function weaponMul(s) { const g = s.gs ?? {}; return (s.weapon === "ITEM-001" ? 1.3 : 1) * (1 + 0.08 * ((s.level ?? 1) - 1)) * (1 + (g.dmgp ?? 0) / 100) + (g.dmg ?? 0) / C.ashcut.dmg; }

// worn gear → s.gs (derived, everyone's HUD reads it); maxHp carries gear life as gearLife so a reload never double-counts
const HERO_SPEED = (s) => C.hero.speed * (1 + Math.min(40, ctx_gs(s).speed ?? 0) / 100);
const ctx_gs = (s) => s?.gs ?? {};
function drainLoot(ctx) {
  const s = ctx.self.state, box = s.lootIn;
  if (s.inv && new Set(s.inv.map((x) => x.u)).size !== s.inv.length) { const seen = new Set(); s.inv = JSON.parse(JSON.stringify(s.inv)).filter((x) => !seen.has(x.u) && seen.add(x.u)); }
  if (!box) return;
  const keys = Object.keys(box); if (!keys.length) return;
  const inv = JSON.parse(JSON.stringify(s.inv ?? [])), have = new Set(inv.map((x) => x.u));
  for (const k of keys) { const it = box[k] && JSON.parse(JSON.stringify(box[k])); if (it && !have.has(it.u)) { if (inv.length < 24) inv.push(it); else s.dust = (s.dust ?? 0) + dustValue(it); } delete s.lootIn[k]; }
  s.inv = inv;
}
function deriveGear(ctx) {
  const s = ctx.self.state, key = JSON.stringify(s.gear ?? {});
  if (key === me.gearKey && s.gs) return;
  me.gearKey = key;
  const g = gearStats(s.gear); delete g.setCount;
  s.gs = g;
  const d = (g.life ?? 0) - (s.gearLife ?? 0);
  if (d) { s.maxHp = (s.maxHp ?? 100) + d; s.hp = Math.max(1, Math.min(s.maxHp, (s.hp ?? s.maxHp) + Math.max(0, d))); s.gearLife = g.life ?? 0; me.lastHp = s.hp; }
}

// the Wayside Forge: within reach of the anvil the pack grows its three verbs
const FORGE_HIT = `fx
pop spark burst=40..60 on=point() life=.3..0.8 v=sdir()*(2..5)+up(1.5) size=.012..0.03 acc=grav()*.8+drag(.6) col=hdr(6,3,.8)>hdr(2,.6,.1) a=1>0 sz=$size floor=bounce(.3) r=sprite(ember,add,velocity,.03)
pop glow burst=1 life=.35 at=point() r=light(<1,.6,.25>,25*(1>0),6)`;
const FORGE_BIG = `fx
pop spark burst=90 on=point() life=.5..1.3 v=sdir()*(3..7)+up(2.5) size=.015..0.04 acc=grav()*.6+drag(.5) col=hdr(7,3.4,1)>hdr(2,.6,.1) a=1>0 sz=$size floor=bounce(.3) r=sprite(ember,add,velocity,.03)
pop pillar burst=30 on=disc(.3) life=.8..1.4 v=up(3..5) size=.1..0.2 acc=drag(1) col=hdr(4,2.4,.8)>hdr(1,.3,.05) a=0>.1:1>0 sz=$size*(1>.3) r=sprite(flame-wisp,add)
pop glow burst=1 life=.9 at=point() r=light(<1,.65,.3>,60*(1>0),9)`;
function forgeNear(ctx) {
  const now = ctx.now(); if (now < (me.forgeAt ?? 0)) return; me.forgeAt = now + 400;
  const s = ctx.self.state, o = ctx.getObject("wayside-forge"), f = ctx.self.feetPosition;
  const near = !!o && !s.menu && !s.dead && Math.hypot(o.feetPosition.x - f.x, o.feetPosition.z - f.z) < FORGE.reach;
  if (!!s.atForge !== near) { s.atForge = near; if (near && !s.forgeSeen) { s.forgeSeen = true; msg(ctx, "The forge's coals still breathe. Open your pack (I) to temper, reforge or ascend with ash dust."); } }
  // Firstblood's due: the anvil burns for this Bearer alone while a free reforge waits (within 8 m)
  const want = !!o && !s.menu && freeReforges(ctx, s) > 0 && Math.hypot(o.feetPosition.x - f.x, o.feetPosition.z - f.z) < 8;
  if (want && !me.anvilGlow) {
    const yaw = (typeof o.rotation === "number" ? o.rotation : o.rotation?.yaw ?? 0) * Math.PI / 180;
    const at = { x: o.feetPosition.x + 0.75 * Math.cos(yaw), y: o.feetPosition.y + 0.9, z: o.feetPosition.z - 0.75 * Math.sin(yaw) };
    me.anvilGlow = ctx.spawn({ audience: "local", scope: "session", feetPosition: at, fx: { script: ANVIL_GLOW } });
    if (!me.anvilRung) { me.anvilRung = true; ctx.emit("playSound", { clip: "/cdn/moodboard-gothic-horror/sfx-hot-iron-hiss-and-low-anvil-hum.mp3", position: at, volume: 0.5, maxDistance: 14 }, { audience: { player: ctx.self.id } }); }
  } else if (!want && me.anvilGlow) { ctx.destroy(me.anvilGlow); me.anvilGlow = null; }
}
const ANVIL_GLOW = `fx
pop heat n=10 on=box(.2,.01,.07) size=.05..0.09 tint=<2.8,.7,.18>..<1.6,.3,.06> sz=$size*flick(.6,.2) col=$tint*flick(1.1,.35) a=.85 r=sprite(soft-disc,add)
pop sparks rate=flick(.5,.3)*7 on=box(.2,.01,.07) life=.5..1 v=up(.8..1.6)+sdir()*.3 size=.015..0.03 acc=grav()*.3+drag(.6) col=hdr(5,2.4,.6)>hdr(1.5,.35,.05) a=(1>.6:.9>0)*flick(9,.4) r=sprite(ember,add,velocity,.02)
pop haze rate=3 on=box(.2,.01,.07) life=1.2..1.8 v=up(.4..0.7) size=.18..0.3 acc=buoy(.4)+curl(.3) col=<.9,.3,.12> a=0>.12:.18>0 sz=$size*(.6>1.8) r=sprite(smoke-puff,add)
pop glow n=1 at=point() g=flick(.7,.35) r=light(<1,.36,.14>,6+$g*5,4)`;
function boardNear(ctx) {
  const now = ctx.now(); if (now < (me.boardAt ?? 0)) return; me.boardAt = now + 400;
  const s = ctx.self.state, o = ctx.getObject("trade-board"), f = ctx.self.feetPosition;
  const near = !!o && !s.menu && !s.dead && Math.hypot(o.feetPosition.x - f.x, o.feetPosition.z - f.z) < TRADE.reach;
  if (!!s.atBoard !== near) {
    s.atBoard = near;
    if (near) { s.board = null; me.boardRead = 0; if (!s.boardSeen) { s.boardSeen = true; msg(ctx, "The Pilgrims' Board. Open your pack (I) to buy what others pinned, or pin your own."); } }
  }
  if (near && s.bagOpen && !s.tradeBusy && now - (me.boardRead ?? 0) > TRADE.refresh * 1000) { me.boardRead = now; readBoard(ctx).catch((e) => ctx.log("board read failed", String(e))); }
}
const ITEM_SFX = { forge: "anvil-hammer-strikes-three-ringing-blows-and-hiss", forgeBig: "anvil-heavy-blow-ember-burst-choir-swell", equip: "armor-equip-leather-and-chainmail-rustle", sell: "coins-into-leather-purse", salvage: "salvage-item-crumble-to-ash-hiss", drop: "loot-drop-cloth-thud-soft" };
function itemInput(ctx, a) {
  const s = ctx.self.state, inv = JSON.parse(JSON.stringify(s.inv ?? [])), gear = JSON.parse(JSON.stringify(s.gear ?? {}));
  if (!a || a.n === me.itemN) return; me.itemN = a.n;
  let snd = null;
  if (a.a === "equip") {
    const i = inv.findIndex((x) => x.u === a.u); if (i < 0) return;
    const it = inv[i], slot = slotOf(it);
    inv.splice(i, 1); if (gear[slot]) inv.push(gear[slot]); gear[slot] = it; snd = "equip";
  } else if (a.a === "unequip") {
    if (!gear[a.slot] || inv.length >= 24) return; inv.push(gear[a.slot]); delete gear[a.slot]; snd = "equip";
  } else if (a.a === "salvage") {
    const i = inv.findIndex((x) => x.u === a.u); if (i < 0) return;
    s.dust = (s.dust ?? 0) + dustValue(inv[i]); inv.splice(i, 1); snd = "salvage";
  } else if (a.a === "sell") {
    if (!s.shop) return; const i = inv.findIndex((x) => x.u === a.u); if (i < 0) return;
    s.copper = (s.copper ?? 0) + sellValue(inv[i]); inv.splice(i, 1); snd = "sell";
  } else if (a.a === "salvageAll") {
    const keep = []; for (const it of inv) { if (it.t === "ashen" || (a.blue && it.t === "hallowed")) s.dust = (s.dust ?? 0) + dustValue(it); else keep.push(it); }
    inv.length = 0; inv.push(...keep); snd = "salvage";
  } else if (a.a === "sort") {
    const rank = { vowbound: 0, relic: 1, gilded: 2, hallowed: 3, ashen: 4 }; inv.sort((x, y) => rank[x.t] - rank[y.t] || y.il - x.il); snd = "drop";
  } else if (a.a === "forge") {
    if (!s.atForge) return; const i = inv.findIndex((x) => x.u === a.u); if (i < 0) return;
    const r = forge(ctx, inv[i], a.op);
    if (r.error) { msg(ctx, r.error); return; }
    const gift = a.op === "reforge" && freeReforges(ctx, s) > 0; if (gift) r.cost = 0;
    if ((s.dust ?? 0) < r.cost) { msg(ctx, `The forge wants ${r.cost} ash dust. You carry ${s.dust ?? 0}.`); ctx.emit("playSound", { clip: sfx("dull-click-denied"), position: ctx.self.feetPosition, volume: 0.3 }, { audience: { player: ctx.self.id } }); return; }
    if (gift) { s.freeUsed = (s.freeUsed ?? 0) + 1; msg(ctx, "Firstblood's due: the smith asks nothing of you this time."); }
    s.dust -= r.cost; inv[i] = r.item; snd = a.op === "ascend" ? "forgeBig" : "forge";
    const o = ctx.getObject("wayside-forge"), at = o ? { x: o.feetPosition.x, y: o.feetPosition.y + 1, z: o.feetPosition.z } : ctx.self.feetPosition;
    ctx.emit("fx", { position: at, script: a.op === "ascend" ? FORGE_BIG : FORGE_HIT });
    if (a.op === "ascend") ctx.emit("screenFlash", { color: "#ffb060", duration: 0.25, intensity: 0.25 }, { audience: { player: ctx.self.id } });
    s.invSel = r.item.u; s.inv = inv; s.gear = gear;
    ctx.emit("playSound", { clip: "/cdn/moodboard-gothic-horror/sfx-" + ITEM_SFX[snd] + ".mp3", position: at, volume: 0.75 });
    return;
  } else if (a.a === "sel") { s.invSel = a.u ?? null; return; }
  s.inv = inv; s.gear = gear; s.invSel = null;
  if (snd) ctx.emit("playSound", { clip: "/cdn/moodboard-gothic-horror/sfx-" + ITEM_SFX[snd] + ".mp3", position: ctx.self.feetPosition, volume: 0.6 }, { audience: { player: ctx.self.id } });
  deriveGear(ctx);
}

function crosswound(ctx) {
  const s = ctx.self.state, now = ctx.now(), cw = C.crosswound;
  if ((s.edge ?? 0) < cw.cost || now < (me.cwAt ?? 0)) {
    ctx.emit("playSound", { clip: sfx("dull-click-denied"), position: ctx.self.feetPosition, volume: 0.3 });
    return;
  }
  me.cwAt = now + cw.cd * 1000; s.cwReadyAt = me.cwAt; s.edge -= cw.cost;
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
  if (s.ancestry === "fenborn") me.hasteUntil = now + (g.time + C.traits.fenborn.secs) * 1000; s.hasteUntil = me.hasteUntil;
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
  const s = ctx.self.state, T = C.traits;
  let drop = (me.lastHp ?? s.hp) - s.hp;
  if (drop > 0 && (s.gs?.armor ?? 0) > 0) { const back = Math.round(drop * mitigation(s.gs.armor)); if (back > 0) { s.hp += back; drop -= back; } }
  if ((s.gs?.regen ?? 0) > 0 && s.hp > 0 && s.hp < s.maxHp && now - (me.regenAt ?? 0) > 5000) { me.regenAt = now; s.hp = Math.min(s.maxHp, s.hp + s.gs.regen); }
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

// the road names itself: a banner when a Bearer walks into a new stretch, "discovered" the first time
// footsteps: one scuff per stride, its surface by where the Bearer walks (ash round the fire, wet stone on the road)
const STEP = { ash: sfx("footstep-boot-on-ash-and-gravel-soft-crunch"), stone: sfx("footstep-boot-on-wet-flagstone-splash"),
  mud: sfx("footstep-boot-squelching-in-shallow-marsh-water-and-mud"), leaves: sfx("footstep-boot-crunching-dry-dead-leaves-and-twigs"),
  hall: sfx("footstep-boot-on-cracked-cathedral-stone-echoing") };
STEP.wood = sfx("footstep-boot-on-old-hollow-gallows-planks-thud");
const STEP_OF = { fire: "ash", fenpath: "mud", fen: "mud", orchpath: "leaves", orchard: "leaves", nave: "hall", crypt: "hall", abbey: "hall" };
const stepAt = {};
function stepTick(ctx, s, f, now) {
  const v = ctx.self.velocity ?? { x: 0, z: 0 }, sp = Math.hypot(v.x, v.z);
  if (sp < 1 || ctx.self.grounded === false || s.dead) return;
  if (now < (stepAt[ctx.self.id] ?? 0)) return;
  stepAt[ctx.self.id] = now + Math.max(260, 1500 / (sp + 0.5));
  ctx.emit("playSound", { clip: STEP[s.area === "orchard" && Math.hypot(f.x - 62, f.z - 5) < 8.5 ? "wood" : STEP_OF[s.area] ?? "stone"], position: f, follow: ctx.self.id, volume: 0.35, pitch: 0.9 + ctx.random() * 0.2, maxDistance: 18, priority: 4 });
}
function zoneTick(ctx, s, f, now) {
  if (now - (me.zoneAt ?? 0) < 400 || s.dead) return;
  me.zoneAt = now;
  const a = areaAt(f.x, f.z);
  if (!a || a.id === s.area) return;
  s.area = a.id;
  const seen = s.seen ?? [], fresh = !seen.includes(a.id);
  if (fresh) { s.seen = [...seen, a.id]; ctx.emit("milestone", { step: s.seen.length, name: "found " + a.name }, { audience: { player: ctx.self.id } }); }
  if (s.banner?.name === a.name && now - s.banner.at < 8000) return; // stepping back and forth over a line stays quiet
  s.banner = { name: a.name, sub: a.sub, fresh, at: now };
  ctx.emit("playSound", { clip: sfx(fresh ? "area-discovered-low-choir-swell-and-bell" : "area-enter-soft-wind-and-distant-bell"), position: f, volume: fresh ? 0.75 : 0.4 }, { audience: { player: ctx.self.id } });
}

// D2-style roster: the selected Bearer stands in the shrine arch (the Veil's solo copy), torch-lit, idling.
// Each ancestry stands in its own light: rim colour, aura, build. One actor per machine, rebuilt only when the pick changes.
const AURA = {
  cinderkin: { rim: "#ff8a3c", key: 8, scale: 1.0, fx: `fx
pop ember n=?mobile:14|30 on=disc(.6) life=1.4..2.6 v=up(.5..1.1)+sdir()*.12 size=.015..0.035 acc=curl(.6)*.3+buoy(.3) col=hdr(3.2,1.3,.3)>hdr(1,.3,.06) a=(0>.15:1>.7:.7>0)*flick(7,.4) sz=$size r=sprite(ember,add)` },
  fenborn: { rim: "#6DB8C0", key: 5, scale: 0.98, fx: `fx
pop mist n=?mobile:6|12 on=disc(.9) life=3..5 v=sdir()*.08 size=.6..1.1 acc=curl(.2)*.1 col=<.42,.62,.66> a=0>.18:.3>.7:.18>0 sz=$size*(.7>1.4) rot=spin(.1) r=sprite(smoke-puff,alpha)
pop mote n=?mobile:6|14 on=disc(.7) life=2..3.5 v=up(.1..0.3) size=.02..0.04 acc=curl(.4)*.2 col=hdr(.6,1.8,2) a=(0>.3:1>.7:.8>0)*flick(3,.5) sz=$size r=sprite(soft-disc,add)` },
  stonebound: { rim: "#C49C63", key: 7, scale: 1.07, fx: `fx
pop grit n=?mobile:8|18 on=disc(.8) life=1.5..3 v=up(.05..0.2)+sdir()*.08 size=.02..0.05 acc=grav()*.05+drag(1) col=<.6,.52,.42> a=0>.5:.5>.7:.4>0 sz=$size r=sprite(soft-disc,alpha)
pop dust n=?mobile:3|6 on=disc(.9) life=3..5 v=sdir()*.05 size=.5..0.9 col=<.45,.4,.34> a=0>.12:.3>.7:.12>0 sz=$size*(.8>1.5) r=sprite(smoke-puff,alpha)` },
  skyforged: { rim: "#cfe3ff", key: 6, scale: 1.0, fx: `fx
pop gust n=?mobile:8|16 on=disc(.8).c(.4) life=1..1.8 v=<1.6,0,.3>*(.6..1.2)+up(.2) size=.01..0.02 acc=curl(.8)*.4 col=hdr(1.6,1.8,2.2) a=0>.6:.6>.6:.5>0 sz=$size r=sprite(ember,add,velocity,.05)
pop spark n=?mobile:4|8 on=disc(.5).c(1.4) life=.4..0.9 size=.02..0.04 col=hdr(2,2.4,3) a=(0>1:1>0)*flick(14,.6) sz=$size r=sprite(soft-disc,add)` },
};
const FLARE = `fx
pop ring burst=1 life=.7 size=2.2 col=%c|<1,.7,.4> a=.9>0 sz=$size*(.2>1.2) r=sprite(soft-disc,add)
pop rise burst=26 on=disc(.5) life=.6..1.2 v=up(1.5..3)+sdir()*.4 size=.02..0.05 acc=drag(1.2) col=%c|<1,.7,.4>*3 a=1>0 sz=$size r=sprite(ember,add)
pop glow burst=1 life=.8 at=point().c(1.2) r=light(%c|<1,.7,.4>,30*(1>0),7)`;
const HEXV = (h) => { const n = parseInt(h.slice(1), 16); return { x: ((n >> 16) & 255) / 255, y: ((n >> 8) & 255) / 255, z: (n & 255) / 255 }; };
function showcase(ctx) {
  const s = ctx.self.state;
  const want = s.menu === "chars" && String(ctx.self.place ?? "").startsWith(MENU_PLACE) && s.sel ? String(s.sel) : null;
  if (want === (me.showFor ?? null) && (!want || (me.showId && ctx.getObject(me.showId)))) return;
  if (me.showId) { try { ctx.destroy(me.showId); } catch {} me.showId = null; }
  const swapped = !!me.showFor && !!want;
  me.showFor = want;
  if (!want) return;
  const row = (s.roster?.chars ?? []).find((c) => String(c.id) === want);
  const A = AURA[row?.ancestry] ?? AURA.cinderkin;
  const hit = raycast(ctx, { x: -0.3, y: 6, z: -10.2 }, { x: 0, y: -1, z: 0 }, { distance: 12, bodies: "static", physicsOnly: true });
  const y = hit ? hit.position.y : 0, at = { x: -0.3, y, z: -10.2 };
  me.showId = ctx.spawn({
    ...heroBody("hero"), scope: "session", scale: A.scale,
    feetPosition: at, rotation: { yaw: 174 },
    mixer: { base: { clip: "Idle", loop: "loop", weight: 1, speed: row?.ancestry === "stonebound" ? 0.85 : 1 } },
    tags: ["menu-showcase"],
    children: [
      { feetPosition: { x: 1.1, y: 2.3, z: 1.4 }, light: { kind: "point", color: "#ffb070", intensity: A.key, distance: 6 } },
      { feetPosition: { x: -0.9, y: 2.6, z: -1.3 }, light: { kind: "point", color: A.rim, intensity: 4, distance: 6 } },
      { feetPosition: { x: 0, y: 0.02, z: 0 }, fx: { script: A.fx } },
    ],
  });
  ctx.emit("fx", { position: at, script: FLARE, params: { c: HEXV(A.rim) } }, { audience: { player: ctx.self.id } });
  if (swapped) ctx.emit("playSound", { clip: sfx("bearer-select-soft-bell-and-cloak-rustle"), position: at, volume: 0.55 }, { audience: { player: ctx.self.id } });
}

export function update(ctx, dt) {
  if (ctx.self.state.hp === undefined) onSpawn(ctx);
  const s = ctx.self.state, now = ctx.now(), f = ctx.self.feetPosition;
  gate(ctx);
  if (ctx.self.isLocal !== false) showcase(ctx);
  if (!ctx.self.state.menu && ctx.self.state.charId) { drainLoot(ctx); deriveGear(ctx); if (ctx.self.isLocal !== false) { forgeNear(ctx); boardNear(ctx); } }
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
    // landed on another realm (or the ledger never answered): read this realm's Bearers
    const realmHere = CH.realmOf(ctx).room;
    if ((!s.roster || s.roster.realm !== realmHere) && now - (me.refAt ?? 0) > 3000) {
      me.refAt = now; if (s.busy?.startsWith("Crossing") && me.crossFrom !== realmHere) s.busy = null;
      ctx.log("realm ledger", { realm: realmHere, room: ctx.getRoomId?.() ?? null });
      if (!s.busy) refresh(ctx);
    }
    if (s.busy?.startsWith("Crossing") && now - (me.crossBusyAt ||= now) > 10000) { s.busy = null; me.crossBusyAt = 0; }
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
  zoneTick(ctx, s, f, now);
  stepTick(ctx, s, f, now);
  // hurt is the hurt player's alone: the screen's edge reddens as life runs out
  if (!s.dead) {
    const fr = (s.hp ?? 1) / (s.maxHp ?? 1), vig = fr < 0.35 ? Math.round((0.18 + (0.35 - fr) * 1.1) * 20) / 20 : 0;
    if (vig !== (me.vig ?? 0)) { me.vig = vig; ctx.self.vignette = vig; }
  }
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
    const sp = HERO_SPEED(s) * (now < (me.hasteUntil ?? 0) ? C.traits.fenborn.haste : 1);
    v = { x: me.keys.x * sp, z: me.keys.z * sp };
    const l = Math.hypot(v.x, v.z); if (l > HERO_SPEED(s)) { v.x *= HERO_SPEED(s) / l; v.z *= HERO_SPEED(s) / l; }
  } else if (s.target) {
    const foe = ctx.getObject(s.target);
    if (!isFoe(foe)) { if (s.foe && s.foe.id === s.target && !s.foe.gone) s.foe = { ...s.foe, hp: 0, gone: true, at: now }; s.target = null; }
    else {
      // the target plate reads this: written when the foe or its life changes, never per tick
      if (!foe.tags?.includes("boss")) {
        const fk = foe.state?.kind ?? "pilgrim", fhp = Math.max(0, Math.round(foe.state?.hp ?? 0));
        if (!s.foe || s.foe.id !== foe.id || s.foe.hp !== fhp) s.foe = { id: foe.id, kind: fk, hp: fhp, max: Math.max(fhp, C[fk]?.hp ?? fhp), at: now };
      }
      const d = flat(foe.feetPosition, f);
      if (d > C.ashcut.reach) {
        if (!me.chase || flat(me.chase, foe.feetPosition) > 1) { me.chase = { ...foe.feetPosition }; me.route = null; }
        v = walkTo(ctx, foe.feetPosition, HERO_SPEED(s), dt);
      } else {
        s.faceYaw = yawTo(foe.feetPosition.x - f.x, foe.feetPosition.z - f.z);
        ashcut(ctx, foe);
      }
    }
  } else if (s.goal) {
    v = walkTo(ctx, s.goal, HERO_SPEED(s) * (now < (me.hasteUntil ?? 0) ? C.traits.fenborn.haste : 1), dt);
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
