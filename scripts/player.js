// VEILFALL hero (Bladewraith). Left click: walk / attack what you click. Right click or E: Crosswound.
// Space: Griefstep dash toward the cursor. Q: tonic. WASD also walks. Hits are judged here, on the
// striker's machine, and written to the enemy's state; the wax-pack manager reads hp and pays XP.
import { body as heroBody, BEARER } from "./lib/data/models.js";
import { BREW, renderRank, brewMade, brewActive } from "./lib/brews.js";
import { gearStats, mitigation, slotOf, sellValue, dustValue, SLOTS, forge, FORGE, freeReforges, markBoss, applyMark, MARKS, craft, craftCost, smithRank, SMITH } from "./lib/loot.js";
import { raycast, getInputRay } from "builtin/physics";
import { animate } from "builtin/tween";
import { findPath } from "builtin/nav";
import { floorDist as mapFloor, areaAt } from "./lib/data/veilfall-map.js";
// the Abbey road is floor only once the Bailiff has fallen in this room (place.state.abbeyOpen, set by the sim)
// which floors this Bearer may walk: derived from their own quest row at the top of every hook that moves them
const GATE = { abbey: false, nave: false, fen: false, orch: false, oss: false };
const gate = (ctx) => { const st = ctx.self.state.quest?.stage ?? 0, all = !!ctx.place.state?.abbeyOpenAll; GATE.abbey = st >= 4 || all; GATE.nave = st >= 10 || all; GATE.fen = st >= 13 || all; GATE.orch = st >= 18 || all; GATE.oss = st >= 23 || all; };
const floorDist = (x, z) => mapFloor(x, z, GATE.abbey, GATE.nave, GATE.fen, GATE.orch, GATE.oss);
import C from "./lib/data/combat.yml";
import { talentStats, canLearn, keystoneOf, hasKey } from "./lib/data/talents.js";
import { shopInput } from "./lib/shop.js";
import { tradeInput, readBoard, TRADE } from "./lib/trade.js";
import { guildVaultInput, readGuildVault } from "./lib/guildvault.js";
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
pop arc burst=1 life=.22 size=3.2 col=hdr(2.2,2.4,3) a=.7>0 sz=$size*(.8>1.1) r=sprite(soft-disc,add)
pop edge burst=36..44 on=arc() life=.12..0.22 v=sdir()*.6 size=.05..0.09 col=hdr(3.4,3.2,3)>hdr(1.2,1,.9) a=1>0 sz=$size*(1>.3) r=sprite(ember,add,velocity,.05)
pop spark burst=10..14 on=arc() life=.2..0.4 v=sdir()*(3..5)+up(.6) size=.015..0.03 acc=grav()*.6+drag(1.5) col=hdr(4,2.6,1) a=1>0 r=sprite(ember,add,velocity,.04)
pop motes burst=18 on=arc() life=.3..0.6 v=sdir()*(1..2.5)+up(.8) size=.03..0.06 col=hdr(1.6,1.8,2.6) a=1>0 r=sprite(mote,add)
pop wind burst=5..7 on=arc() life=.35..0.55 v=sdir()*.8 size=.25..0.4 acc=drag(2.5) col=<.7,.72,.78> a=0>.1:.22>0 sz=$size*(.6>1.8) rot=spin(.4) r=sprite(smoke-puff,alpha)
pop dust burst=4..6 on=disc(.6).c(-.95) life=.6..1 v=radial(.6..1.2)+up(.1..0.3) size=.25..0.4 acc=drag(2)+buoy(.1) col=<.32,.3,.28> a=0>.1:.3>0 sz=$size*(.6>2) r=sprite(smoke-puff,alpha)
pop lit burst=1 life=.18 at=point() r=light(<.8,.85,1>,10*(1>0),3.5)`;
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
    case "notes": s.menu = "notes"; click(ctx); break;
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
  if (input.actionData?.gvault) guildVaultInput(ctx, input.actionData.gvault);
  if (input.actionData?.train) trainInput(ctx, input.actionData.train);
  if (input.actionData?.travel) travelInput(ctx, input.actionData.travel);
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
  // every panel answers on this machine alone: leather and buckles for the bag, parchment for the sheet, a rune for the tree
  const panel = (open, on, off) => ctx.emit("playSound", { clip: sfx(open ? on : off), volume: 0.55, bus: "UI", mode: "restart" });
  if (input.pressed.bag) { s.bagOpen = !s.bagOpen; panel(s.bagOpen, "leather-satchel-flap-opened-buckle-jingle-and-items-shifting", "leather-satchel-flap-closed-soft-thump-and-buckle-click"); }
  if (input.pressed.sheet) { s.sheetOpen = !s.sheetOpen; if (s.sheetOpen) s.treeOpen = false; panel(s.sheetOpen, "heavy-leather-bound-tome-opened-parchment-pages-rustle", "heavy-leather-bound-tome-closed-soft-dusty-thud"); }
  if (input.pressed.tree) { s.treeOpen = !s.treeOpen; if (s.treeOpen) s.sheetOpen = false; panel(s.treeOpen, "ancient-stone-rune-tablet-glows-awake-low-hum-and-glass-shimmer", "stone-rune-glow-fading-soft-low-whoosh"); }
  if (input.pressed.learn) {
    const id = input.actionData?.learn?.id;
    if (id === "reset") { s.talents = {}; ctx.emit("playSound", { clip: sfx("pages-turn-and-ash-blown-away"), position: ctx.self.feetPosition, volume: 0.5 }, { audience: { player: ctx.self.id } }); }
    else if (id && canLearn(s.cls, s.talents, s.level, id)) {
      s.talents = { ...(s.talents ?? {}), [id]: (s.talents?.[id] ?? 0) + 1 };
      ctx.emit("playSound", { clip: sfx("talent-learned-deep-rune-ignite-and-chime"), position: ctx.self.feetPosition, volume: 0.6 }, { audience: { player: ctx.self.id } });
    }
  }
  if (input.pressed.guard) guard(ctx);
}

function swingAnim(ctx, clip) {
  ctx.self.anim.attack = { clip, weight: 4, loop: "once", speed: 1.7, mask: { from: "Spine" } };
  me.animOff = ctx.now() + 380;
}

function strike(ctx, foe, dmg, crit, nk) {
  foe.state.hp -= dmg;
  if (!nk) keystone(ctx, foe, dmg, crit);
  if (foe.state.hp <= 0 && hasKey(ctx.self.state.cls, ctx.self.state.talents, "bloodrush")) { me.hasteUntil = ctx.now() + 3000; me.rushUntil = me.hasteUntil;
    ctx.emit("fx", { position: ctx.self.feetPosition, script: DASH }); ctx.emit("playSound", { clip: sfx("heartbeat-surge-and-sharp-inhale"), position: ctx.self.feetPosition, volume: 0.5 }, { audience: { player: ctx.self.id } }); }
  { const me_ = ctx.self.state, lc = me_.gs?.leech ?? 0; if (lc > 0 && me_.hp > 0 && me_.hp < me_.maxHp) me_.hp = Math.min(me_.maxHp, me_.hp + Math.max(1, Math.round(dmg * lc / 100))); }
  foe.state.lastHit = ctx.self.id;
  const p = { x: foe.feetPosition.x, y: foe.feetPosition.y + 1.1, z: foe.feetPosition.z };
  const f = ctx.self.feetPosition, dx = p.x - f.x, dz = p.z - f.z, d = Math.hypot(dx, dz) || 1;
  ctx.emit("damageNumber", { position: p, value: dmg, crit, color: crit ? "#ffd27a" : "#f2ead8" });
  ctx.emit("fx", { position: p, script: CHIPS, params: { normal: { x: dx / d, y: 0.3, z: dz / d } } });
  ctx.emit("squash", { target: foe.id, axis: "y", intensity: 0.18, duration: 0.15 });
  if (atkOf(ctx.self.state).melee) ctx.emit("slash", { position: p, size: crit ? 2.2 : 1.6, shape: "crescent", noise: 0.35 });
  // a stagger on the heavier blows: the struck body flinches (bosses shrug off all but crits)
  if (!foe.state.dead && foe.state.hp > 0 && !foe.state.swing && !foe.state.slam && !foe.tags?.includes?.("boss")) { foe.anim.hit = { clip: "cdn/clip-hit-react.glb", weight: 6, loop: "once", speed: 1.3 }; foe.state.hitUntil = ctx.now() + 450; }
  ctx.emit("flash", { target: foe.id, color: "#ffffff", duration: 0.08 });
  ctx.emit("playSound", { clip: sfx("blade-cutting-into-soft-wax-thud"), position: p, pitch: 0.9 + ctx.random() * 0.2, volume: 0.8 });
  ctx.emit("hitstop", { duration: crit ? 0.06 : 0.03 }, { audience: { player: ctx.self.id } });
  if (crit) {
    ctx.emit("playSound", { clip: sfx("critical-hit-bright-steel-snap"), position: p, pitch: 0.95 + ctx.random() * 0.1, volume: 0.55 });
    ctx.emit("cameraPunch", { direction: { x: dx / d, y: 0, z: dz / d }, intensity: 0.18 }, { audience: { player: ctx.self.id } });
  }
}

function markTrail(cols) {
  const v = (h, k) => { const n = parseInt(h.slice(1), 16); return `hdr(${(((n >> 16) & 255) / 255 * k).toFixed(2)},${(((n >> 8) & 255) / 255 * k).toFixed(2)},${((n & 255) / 255 * k).toFixed(2)})`; };
  const a = cols[0], b = cols[1] ?? cols[0];
  return `fx
pop streak burst=34..44 on=disc(.75).c(.15) life=.25..0.5 v=sdir()*(1.5..3)+up(.4) size=.03..0.06 acc=drag(3) col=${v(a, 4)}>${v(b, 2.5)}>${v(b, .6)} a=1>.5:.8>0 sz=$size r=sprite(ember,add,velocity,.06)
pop mote burst=10..14 on=disc(.7) life=.5..0.9 v=up(.3..0.8)+sdir()*.4 size=.06..0.12 acc=buoy(.3)+drag(1) col=${v(b, 2)}>${v(a, .8)} a=0>.1:.7>0 sz=$size*(1>.3) r=sprite(soft-disc,add)
pop glow burst=1 life=.25 at=point() r=light(${v(a, 1).replace("hdr", "<").replace(")", ">")},14*(1>0),4)`;
}
// each calling's basic attack: the blade-bearers cut in reach, the casters and the archer fire from afar
const BOLT = (core, glow, lit) => `fx
pop core burst=1 life=%t|.3 v=<%dir|0,0,-1>*%sp|20 size=.34 col=${core} a=1 sz=$size*(1>.75)*flick(20,.15) r=sprite(soft-disc,add)
pop halo burst=1 life=%t|.3 v=<%dir|0,0,-1>*%sp|20 size=.85 col=${glow} a=.55 sz=$size*flick(14,.25) r=sprite(soft-disc,add)
pop trail on=@core.lives(120) life=.25..0.5 v=sdir()*.4 size=.06..0.14 acc=drag(2)+curl(1.2)*.8 col=${core}>${glow} a=1>0 sz=$size*(1>.2) r=sprite(ember,add,velocity,.03)
pop rune on=@core.lives(18) life=.35..0.6 v=sdir()*.6 size=.14..0.22 spin=-5..5 acc=drag(2.5) col=${core} a=0>.15:.9>0 sz=$size*(1>.4) rot=$age*$spin r=sprite(soft-disc,add)
pop wisp on=@core.lives(40) life=.5..0.9 v=sdir()*.2 size=.25..0.45 acc=buoy(.35)+curl(.6)*.4+drag(1.2) col=${glow} a=0>.1:.35>0 sz=$size*(.6>1.8) rot=spin(.3) r=sprite(smoke-puff,add)
pop glow burst=1 life=%t|.3 v=<%dir|0,0,-1>*%sp|20 r=light(${lit},18,7)`;
// the gather at the caster's hand: motes pulled in, one bright breath of light
const CAST = (core, lit) => `fx
pop gather burst=18..24 on=sphere(.55) life=.22..0.3 v=attract(9) size=.04..0.08 col=${core} a=0>.3:1>0 sz=$size r=sprite(ember,add,velocity,.04)
pop flare burst=1 life=.25 size=.6 col=${core} a=.9>0 sz=$size*(.3>1.2) r=sprite(soft-disc,add)
pop lamp burst=1 life=.3 at=point() r=light(${lit},16*(1>0),5)`;
const ARROW = `fx
pop shaft burst=1 life=%t|.3 v=<%dir|0,0,-1>*%sp|30 size=.05 col=<.9,.82,.62> a=1 sz=$size r=sprite(ember,alpha,velocity,.9)
pop streak on=@shaft.lives(80) life=.12..0.22 size=.03..0.05 col=hdr(1.6,1.5,1.2)>hdr(.5,.5,.45) a=.6>0 sz=$size r=sprite(soft-disc,add)
pop air on=@shaft.lives(25) life=.3..0.5 v=sdir()*.15 size=.1..0.16 acc=drag(2) col=<.75,.75,.8> a=0>.1:.12>0 sz=$size*(.6>1.6) r=sprite(smoke-puff,alpha)`;
const ATK = {
  soulweaver:   { reach: 11, cd: 0.8, mul: 1.25, sp: 18, fx: BOLT("hdr(2.2,3.4,4.2)", "hdr(.4,.9,1.6)", "<.5,.8,1>"), castFx: CAST("hdr(2.2,3.4,4.2)", "<.5,.8,1>"), cast: "cdn/clip-cast.glb", snd: "arcane-bolt-cast-shimmering-whoosh", hit: "arcane-bolt-impact-glass-chime-burst", hitFx: "<.5,.85,1>" },
  shadowmancer: { reach: 10, cd: 0.75, mul: 1.15, sp: 16, fx: BOLT("hdr(2.4,1.2,3.6)", "hdr(.6,.15,.9)", "<.7,.3,1>"), castFx: CAST("hdr(2.4,1.2,3.6)", "<.7,.3,1>"), cast: "cdn/clip-cast.glb", snd: "shadow-bolt-cast-hissing-whisper", hit: "shadow-bolt-impact-dark-thump-and-whispers", hitFx: "<.7,.3,1>" },
  gloamstalker: { reach: 14, cd: 0.65, mul: 1.05, sp: 32, fx: ARROW, arrow: true, cast: "cdn/clip-throw.glb", snd: "longbow-draw-creak-and-arrow-release-twang", hit: "arrow-thunk-into-flesh", hitFx: "<1,.8,.5>" },
  hellwarden:   { reach: 2.5, cd: 0.7, mul: 1.15, melee: true, snd: "heavy-mace-swing-whoosh-low" },
  primalist:    { reach: 2.4, cd: 0.6, mul: 1.05, melee: true, snd: "beast-claw-swipe-whoosh" },
};
const atkOf = (s) => ATK[s?.cls] ?? { reach: C.ashcut.reach, cd: C.ashcut.cd, mul: 1, melee: true };
const IMPACT = `fx
pop burst burst=30..40 on=sphere(.15) life=.25..0.6 v=sdir()*(2..5) size=.035..0.08 acc=drag(3)+grav()*.4 col=<%c|1,1,1>*4>.5:<%c|1,1,1>*.6 a=1>0 sz=$size*(1>.2) r=sprite(ember,add,velocity,.05)
pop shard burst=8..12 on=sphere(.1) life=.5..0.9 v=sdir()*(1.5..3)+up(1.5) size=.05..0.09 spin=-8..8 acc=grav() floor=bounce(.3) col=<%c|1,1,1>*2.5><%c|1,1,1>*.4 a=1>.6:1>0 sz=$size rot=$age*$spin r=sprite(soft-disc,add)
pop ring burst=1 life=.32 size=1.3 col=<%c|1,1,1>*2.2 a=.8>0 sz=$size*(.2>1.2) r=sprite(soft-disc,add)
pop smoke burst=4..6 on=sphere(.2) life=.8..1.4 v=up(.3..0.7)+sdir()*.4 size=.3..0.5 acc=buoy(.4)+curl(.4)*.4+drag(1.2) col=<.22,.22,.26> a=0>.1:.35>0 sz=$size*(.6>2.2) rot=spin(.2) r=sprite(smoke-puff,alpha)
pop mote burst=8..12 on=sphere(.3) life=.7..1.2 v=up(.4..1)+sdir()*.3 size=.03..0.06 acc=curl(.8)+drag(.8) col=<%c|1,1,1>*2>.6:<%c|1,1,1>*.5 a=(0>.1:1>0)*flick(9,.3) r=sprite(ember,add)
pop flare burst=1 life=.4 at=point() r=light(<%c|1,1,1>,28*(1>0),6)`;
// the ground answers a spell: sparks skid out along the floor, dust rolls off it, a pool of the spell's colour fades where it struck
const GROUNDHIT = `fx
pop skid burst=14..20 on=disc(.25) life=.35..0.7 v=radial(2.5..5)+up(.2..0.6) size=.025..0.05 acc=drag(2.6)+grav() floor=stick col=<%c|1,1,1>*3.2><%c|1,1,1>*.3 a=1>.6:1>0 r=sprite(ember,add,velocity,.05)
pop pool burst=1 at=point() life=1.1 size=1.5 col=<%c|1,1,1>*1.1 a=.45>.3:.3>0 sz=$size*(.35>1) r=sprite(soft-disc,add)
pop dust burst=5..8 on=disc(.35) life=.8..1.4 v=radial(.5..1.1)+up(.15..0.35) size=.3..0.5 acc=drag(2)+buoy(.15) col=<.3,.28,.27> a=0>.1:.32>0 sz=$size*(.6>2.2) rot=spin(.2) r=sprite(smoke-puff,alpha)
pop rune burst=10..14 on=disc(.5) life=.9..1.6 v=up(.3..0.8) size=.02..0.04 acc=curl(1)+drag(.6) col=<%c|1,1,1>*2.4><%c|1,1,1>*.4 a=(0>.15:1>0)*flick(8,.4) r=sprite(mote,add)
pop lit burst=1 life=1.1 at=point() r=light(<%c|1,1,1>,9*(1>0),4.5)`;
function fireAt(ctx, foe, A, dmg, crit) {
  const f = ctx.self.feetPosition, src = { x: f.x, y: f.y + 1.35, z: f.z }, t = foe.feetPosition;
  const dx = t.x - f.x, dz = t.z - f.z, dy = (t.y + 1.1) - src.y, d = Math.hypot(dx, dy, dz) || 1;
  const fwd = 0.7, st = { x: src.x + dx / d * fwd, y: src.y + dy / d * fwd, z: src.z + dz / d * fwd };
  const time = Math.max(0.08, (d - fwd) / A.sp);
  ctx.emit("fx", { position: st, script: A.fx, params: { dir: { x: dx / d, y: dy / d, z: dz / d }, sp: A.sp, t: time } });
  if (A.castFx) ctx.emit("fx", { position: st, script: A.castFx });
  if (A.arrow) flyArrow(ctx, st, { x: t.x - dx / d * 0.25, y: t.y + 1.1, z: t.z - dz / d * 0.25 }, time);
  ctx.after(time, "boltLand", { id: foe.id, dmg, crit, hit: A.hit, c: A.hitFx });
}
// the arrow itself: dark ash shaft, leaf iron head, three black fletches; it flies the line and is gone on the hit
function flyArrow(ctx, from, to, time) {
  const id = ctx.spawn({ feetPosition: from, rotation: { lookAt: to, include: ["yaw", "pitch"] }, lifetime: time + 0.03, castShadow: false, interpolation: null,
    children: [{ primitive: { kind: "scripted", script: "scripts/gen/arrow.js" } }] });
  animate(ctx, id, { "feetPosition.x": to.x, "feetPosition.y": to.y, "feetPosition.z": to.z }, { duration: time, easing: "linear" });
}
// each ancestry's mark on its Bearer: the lantern's colour and a low aura that rides at the feet
const ANCESTRY = {
  cinderkin: { lamp: "oklch(0.78 0.13 45)", aura: `fx
pop ember rate=?mobile:3|6 on=disc(.35) life=.9..1.6 v=up(.5..1.1)+sdir()*.15 size=.02..0.04 acc=curl(.7)+buoy(.3) col=hdr(3,1.1,.3)>hdr(.9,.2,.05) a=(0>.1:1>.7:.8>0)*flick(9,.3) sz=$size r=sprite(ember,add)` },
  fenborn: { lamp: "oklch(0.80 0.07 190)", aura: `fx
pop mist rate=?mobile:1.5|3 on=disc(.45) life=1.6..2.6 v=sdir()*.12+up(.05) size=.35..0.6 acc=drag(1)+curl(.3)*.3 col=<.55,.8,.78> a=0>.2:.16>0 sz=$size*(.7>1.5) rot=spin(.15) r=sprite(smoke-puff,add)` },
  stonebound: { lamp: "oklch(0.82 0.08 80)", aura: `fx
pop grit rate=?mobile:2|4 on=disc(.3) life=.7..1.2 v=up(.15..0.35)+sdir()*.2 size=.015..0.03 acc=grav()*.3+drag(1) col=<.75,.65,.45> a=.7>0 sz=$size r=sprite(soft-disc,alpha)` },
  skyforged: { lamp: "oklch(0.86 0.06 240)", aura: `fx
pop gust rate=?mobile:2|4 on=disc(.5) life=.8..1.3 v=vortex(1.4)+up(.3..0.6) size=.02..0.035 acc=drag(.6) col=hdr(1.4,1.7,2.2)>hdr(.4,.5,.8) a=0>.15:.8>0 sz=$size r=sprite(ember,add,velocity,.05)` },
};
// the ranged callings' signature (RMB, the Crosswound slot, same Edge cost): each its own shape of harm
const LANCE = `fx
pop beam burst=1 life=.55 size=1 col=hdr(2.6,3.6,4.4) a=1>.6:.9>0 sz=$size*(1>.3) r=mesh(cylinder,.18,9,.18)
pop sheath burst=1 life=.7 size=1 col=hdr(.5,1.1,1.9) a=.55>.3:.4>0 sz=$size*(.6>1.4) r=mesh(cylinder,.55,9,.55)
pop rune burst=1 life=.7 size=3.4 col=hdr(1.2,2.2,3.2) a=.9>0 sz=$size*(.4>1) r=sprite(soft-disc,add)
pop fall burst=26..34 on=disc(.4).c(8) life=.25..0.4 v=up(-22..-16) size=.03..0.06 col=hdr(3,3.8,4.6) a=1>0 sz=$size r=sprite(ember,add,velocity,.08)
pop shard burst=30..40 on=disc(1.4) life=.5..1 v=up(3..7)+sdir()*1.2 size=.04..0.08 acc=grav()*.4+drag(1.2) col=hdr(2.4,3.4,4.2)>hdr(.4,.8,1.4) a=1>0 sz=$size r=sprite(ember,add,velocity,.05)
pop mote burst=16..22 on=disc(1.8) life=1.2..2 v=up(.3..0.8) size=.02..0.04 acc=curl(.9)+drag(.6) col=hdr(1.8,2.8,3.6)>hdr(.3,.6,1) a=(0>.15:1>0)*flick(7,.4) r=sprite(mote,add)
pop dust burst=8..12 on=disc(.8) life=.9..1.5 v=radial(1.2..2.4)+up(.2..0.5) size=.4..0.7 acc=drag(2)+buoy(.15) col=<.42,.46,.52> a=0>.1:.3>0 sz=$size*(.6>2.4) rot=spin(.2) r=sprite(smoke-puff,alpha)
pop glow burst=1 life=.9 at=point().c(1) r=light(<.55,.8,1>,40*(1>.25:.3>0),10)`;
const DARKPOOL = `fx
pop pool burst=1 life=3 size=4.4 col=<.18,.04,.28> a=0>.1:.85>.85:.85>0 sz=$size r=sprite(soft-disc,alpha)
pop rim burst=1 life=3 size=4.6 col=hdr(.9,.25,1.5) a=0>.1:.5>.8:.5>0 sz=$size*(1+flick(3,.04)) r=sprite(soft-disc,add)
pop tendril win=0;2.3 rate=?mobile:14|28 on=disc(2) life=.7..1.2 v=up(.8..1.8)+sdir()*.2 size=.08..0.16 acc=curl(1)+drag(1) col=hdr(1.4,.4,2.2)>hdr(.2,.05,.35) a=0>.15:.9>0 sz=$size*(1>.3) r=sprite(smoke-puff,add)
pop hand win=0;2.3 rate=?mobile:3|6 on=disc(1.7) life=.8..1.3 v=up(1.2..2.2) size=.05..0.09 acc=curl(2.2)*1.4+drag(1.5) col=hdr(2,.6,3)>hdr(.3,.05,.5) a=0>.1:1>0 sz=$size r=sprite(ember,add,velocity,.12)
pop pull win=0;2.3 rate=?mobile:10|20 on=disc(2.4).c(.2) life=.5..0.8 v=attract(4) size=.02..0.04 col=hdr(2.4,1,3.2) a=0>.2:1>0 sz=$size r=sprite(ember,add,velocity,.04)
pop murk win=0;2.3 rate=?mobile:3|6 on=disc(1.8) life=1.4..2.2 v=up(.15..0.35) size=.6..1 acc=buoy(.2)+curl(.3)*.3+drag(1) col=<.08,.02,.12> a=0>.2:.45>0 sz=$size*(.6>1.8) rot=spin(.15) r=sprite(smoke-puff,alpha)
pop eye win=0;2.3 rate=3 on=disc(1.6) life=.6..1 size=.05 col=hdr(3,1,4) a=0>.3:1>0 sz=$size r=sprite(soft-disc,add)
pop glow burst=1 life=3 at=point().c(.6) r=light(<.6,.25,1>,12*flick(4,.25),7)`;
function sigLance(ctx, s, f, aim) {
  const at = { x: aim.x, y: ctx.place.terrain?.heightAt?.(aim.x, aim.z) ?? f.y, z: aim.z };
  swingAnim(ctx, "cdn/clip-cast.glb");
  ctx.emit("fx", { position: { x: f.x, y: f.y + 1.4, z: f.z }, script: ATK.soulweaver.castFx });
  ctx.emit("playSound", { clip: sfx("holy-light-lance-crashes-down-choir-burst"), position: at, volume: 0.85 });
  ctx.after(0.3, "sigLand", { kind: "lance", at });
}
function sigPool(ctx, s, f, aim) {
  const at = { x: aim.x, y: ctx.place.terrain?.heightAt?.(aim.x, aim.z) ?? f.y, z: aim.z };
  swingAnim(ctx, "cdn/clip-cast.glb");
  ctx.emit("fx", { position: { x: at.x, y: at.y + 0.05, z: at.z }, script: DARKPOOL });
  ctx.emit("playSound", { clip: sfx("shadow-pool-opens-whispering-hands-grasp"), position: at, volume: 0.8 });
  for (let i = 0; i < 3; i++) ctx.after(0.4 + i * 0.9, "sigLand", { kind: "pool", at, tick: i });
}
function sigVolley(ctx, s, f, aim) {
  const A = ATK.gloamstalker, base = Math.atan2(aim.x - f.x, aim.z - f.z);
  swingAnim(ctx, A.cast);
  ctx.emit("playSound", { clip: sfx("several-arrows-loosed-at-once-volley-twang"), position: f, volume: 0.8 });
  const hit = new Set();
  for (let i = -2; i <= 2; i++) {
    const a = base + i * 0.17, dir = { x: Math.sin(a), z: Math.cos(a) }, src = { x: f.x + dir.x * 0.7, y: f.y + 1.35, z: f.z + dir.z * 0.7 };
    let foe = null, bd = A.reach + 2;
    for (const r of ctx.query({ tags: ["enemy"], center: f, radius: A.reach + 2 })) {
      if (hit.has(r.id)) continue; const ex = r.feetPosition.x - f.x, ez = r.feetPosition.z - f.z, ed = Math.hypot(ex, ez) || 1;
      if ((ex * dir.x + ez * dir.z) / ed > 0.97 && ed < bd) { bd = ed; foe = r; } }
    const end = foe ? { x: foe.feetPosition.x, y: foe.feetPosition.y + 1.1, z: foe.feetPosition.z } : { x: f.x + dir.x * A.reach, y: f.y + 1.1, z: f.z + dir.z * A.reach };
    const d = Math.hypot(end.x - src.x, end.z - src.z) || 1, t = Math.max(0.08, d / A.sp);
    ctx.emit("fx", { position: src, script: A.fx, params: { dir: { x: (end.x - src.x) / d, y: 0, z: (end.z - src.z) / d }, sp: A.sp, t } });
    flyArrow(ctx, src, end, t);
    if (foe) { hit.add(foe.id); ctx.after(t, "boltLand", { id: foe.id, dmg: Math.round(C.crosswound.dmg * 0.7 * weaponMul(s) * (0.9 + ctx.random() * 0.2)), crit: false, hit: A.hit, c: A.hitFx, nk: true }); }
  }
}
const SIG = { soulweaver: sigLance, shadowmancer: sigPool, gloamstalker: sigVolley };
export function sigLand(ctx, p) {
  const s = ctx.self.state, at = p.at;
  if (p.kind === "lance") {
    ctx.emit("fx", { position: at, script: LANCE });
    ctx.emit("shockwave", { position: { x: at.x, y: at.y + 0.3, z: at.z }, speed: 10, thickness: 0.5, intensity: 0.5 });
    ctx.emit("screenShake", { intensity: 0.15, duration: 0.2 }, { audience: { player: ctx.self.id } });
  }
  const R = p.kind === "lance" ? 2.6 : 2.2, mul = p.kind === "lance" ? 1.5 : 0.55;
  for (const r of ctx.query({ tags: ["enemy"], center: at, radius: R })) {
    const o = ctx.getObject(r.id); if (!isFoe(o)) continue;
    strike(ctx, o, Math.round(C.crosswound.dmg * mul * weaponMul(s) * (0.9 + ctx.random() * 0.2)), false, true);
    if (p.kind === "pool") { o.state.slowUntil = ctx.now() + 1200; ctx.emit("flash", { target: r.id, color: "#8a3cff", duration: 0.15 }); }
  }
}
// a keystone's second hit: chain and pierce fly a fresh bolt on from the struck foe; cleave lands at once on the pack around it
function keystone(ctx, foe, dmg, crit) {
  const s = ctx.self.state, k = keystoneOf(s.cls, s.talents); if (!k) return;
  const at = foe.feetPosition, f = ctx.self.feetPosition;
  if (k === "cleave") {
    for (const r of ctx.query({ tags: ["enemy"], center: at, radius: 2.5 })) { if (r.id === foe.id) continue; const o = ctx.getObject(r.id); if (isFoe(o)) strike(ctx, o, Math.max(1, Math.round(dmg * 0.45)), false, true); }
    return;
  }
  const A = atkOf(s); if (!A.fx) return;
  const dir = { x: at.x - f.x, z: at.z - f.z }, dl = Math.hypot(dir.x, dir.z) || 1;
  let best = null, bd = k === "chain" ? 7 : 4;
  for (const r of ctx.query({ tags: ["enemy"], center: at, radius: bd })) {
    if (r.id === foe.id) continue; const o = ctx.getObject(r.id); if (!isFoe(o)) continue;
    const ox = r.feetPosition.x - at.x, oz = r.feetPosition.z - at.z, od = Math.hypot(ox, oz) || 1;
    if (k === "pierce" && (ox * dir.x + oz * dir.z) / (od * dl) < 0.6) continue; // pierce only carries on forward
    if (od < bd) { bd = od; best = o; }
  }
  if (!best) return;
  const src = { x: at.x, y: at.y + 1.1, z: at.z }, t = best.feetPosition, dx = t.x - at.x, dz = t.z - at.z, dy = 0, d = Math.hypot(dx, dz) || 1, time = Math.max(0.06, d / A.sp);
  ctx.emit("fx", { position: src, script: A.fx, params: { dir: { x: dx / d, y: dy, z: dz / d }, sp: A.sp, t: time } });
  ctx.after(time, "boltLand", { id: best.id, dmg: Math.max(1, Math.round(dmg * (k === "chain" ? 0.6 : 0.7))), crit: false, hit: A.hit, c: A.hitFx, nk: true });
}
export function meleeLand(ctx, p) {
  const foe = ctx.getObject(p.id); if (!isFoe(foe) || (ctx.self.state.hp ?? 1) <= 0) return;
  const f = ctx.self.feetPosition, t = foe.feetPosition, d = Math.hypot(t.x - f.x, t.z - f.z);
  if (d > p.reach + 1.2) { ctx.emit("damageNumber", { position: { x: t.x, y: t.y + 1.6, z: t.z }, text: "miss", color: "#9b968a", size: 0.6 }, { audience: { player: ctx.self.id } }); return; }
  strike(ctx, foe, p.dmg, p.crit);
  if (p.fin) {
    const dx = (t.x - f.x) / (d || 1), dz = (t.z - f.z) / (d || 1);
    ctx.emit("slash", { position: { x: t.x, y: t.y + 1.1, z: t.z }, size: 2.8, shape: "crescent", noise: 0.5 });
    ctx.emit("cameraPunch", { direction: { x: dx, y: 0, z: dz }, intensity: 0.22 }, { audience: { player: ctx.self.id } });
    ctx.emit("playSound", { clip: sfx("heavy-blade-finisher-crunch-and-ring"), position: t, volume: 0.6, pitch: 0.95 + ctx.random() * 0.1 });
    ctx.emit("impulse", { target: foe.id, impulse: { x: dx * 120, y: 40, z: dz * 120 } });
  }
}
export function boltLand(ctx, p) {
  const foe = ctx.getObject(p.id); if (!isFoe(foe)) return;
  const at = { x: foe.feetPosition.x, y: foe.feetPosition.y + 1.1, z: foe.feetPosition.z };
  const c = /<([\d.]+),([\d.]+),([\d.]+)>/.exec(p.c ?? "") ?? [0, 1, 1, 1];
  ctx.emit("fx", { position: at, script: IMPACT, params: { c: { x: +c[1], y: +c[2], z: +c[3] } } });
  ctx.emit("fx", { position: { x: foe.feetPosition.x, y: foe.feetPosition.y + 0.05, z: foe.feetPosition.z }, script: GROUNDHIT, params: { c: { x: +c[1], y: +c[2], z: +c[3] } } });
  if (p.hit) ctx.emit("playSound", { clip: sfx(p.hit), position: at, volume: 0.7, pitch: 0.92 + ctx.random() * 0.16 });
  strike(ctx, foe, p.dmg, p.crit, p.nk);
}
function ashcut(ctx, foe) {
  const s = ctx.self.state, now = ctx.now();
  if (now < (me.swingAt ?? 0)) return;
  const A = atkOf(s);
  me.swingAt = now + A.cd * 1000;
  swingAnim(ctx, A.cast ?? "cdn/clip-attack.glb");
  ctx.emit("playSound", { clip: sfx(A.snd ?? "sword-swing-whoosh-short"), position: ctx.self.feetPosition, volume: 0.5, pitch: 0.95 + ctx.random() * 0.15 });
  if (me.markFx) { const f = ctx.self.feetPosition, t = foe?.feetPosition, dx = t ? t.x - f.x : 0, dz = t ? t.z - f.z : 0, d = Math.hypot(dx, dz) || 1; ctx.emit("fx", { position: { x: f.x + (t ? dx / d * 0.8 : 0), y: f.y + 1.1, z: f.z + (t ? dz / d * 0.8 : 0) }, script: me.markFx }); }
  const crit = ctx.random() < 0.12 + (s.gs?.crit ?? 0) / 100;
  const dmg = Math.round(C.ashcut.dmg * A.mul * weaponMul(s) * (crit ? 1.8 : 1) * (0.9 + ctx.random() * 0.2));
  if (A.melee) {
    // a 3-blow chain: the third swing inside 1.6 s is the finisher (x1.6, a heavier crack); the blade meets the foe on the downswing, 0.22 s in
    me.combo = now - (me.comboAt ?? 0) < 1600 ? ((me.combo ?? 0) + 1) % 3 : 0; me.comboAt = now;
    const fin = me.combo === 2;
    ctx.after(0.22, "meleeLand", { id: foe.id, dmg: fin ? Math.round(dmg * 1.6) : dmg, crit, fin, reach: A.reach ?? C.ashcut.reach });
  } else fireAt(ctx, foe, A, dmg, crit);
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
  const s = ctx.self.state, bw = brewActive(s, ctx.now());
  if (s.brew && !bw) { s.brew = null; msg(ctx, "The brew's warmth fades from your blood."); }
  const key = JSON.stringify(s.gear ?? {}) + JSON.stringify(s.talents ?? {}) + (bw ? bw.id + bw.until : "");
  if (key === me.gearKey && s.gs) return;
  me.gearKey = key;
  const g = gearStats(s.gear); delete g.setCount;
  if (bw) for (const [k, v] of Object.entries(bw.stats ?? {})) g[k] = (g[k] ?? 0) + v;
  for (const [k, v] of Object.entries(talentStats(s.cls, s.talents))) g[k] = Math.round(((g[k] ?? 0) + v) * 10) / 10;
  s.gs = g;
  // boss marks worn: two or more marked pieces and the blade carries their colours
  const worn = Object.values(s.gear ?? {}).filter((it) => it?.mk && MARKS[it.mk]);
  me.markFx = worn.length >= 2 ? markTrail([...new Set(worn.map((it) => MARKS[it.mk].color))]) : null;
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
const hexV = (h) => { const n = parseInt(h.slice(1), 16); return { x: ((n >> 16) & 255) / 255, y: ((n >> 8) & 255) / 255, z: (n & 255) / 255 }; };
const BREW_FX = `fx
pop gout burst=26..34 on=disc(.3) life=.5..1 v=up(2..3.4)+sdir()*.8 size=.04..0.08 acc=grav()*.9+drag(.6) col=<%c|1,.6,.3>*3>.6:<%c|1,.6,.3>*.6 a=1>0 sz=$size floor=die r=sprite(soft-disc,add)
pop steam burst=8 on=disc(.3) life=1.2..2 v=up(1..1.6) size=.3..0.5 acc=buoy(.4)+drag(.8)+curl(.3)*.4 sz=$size*(.6>2.2) col=<.85,.78,.62> a=0>.1:.35>0 r=sprite(smoke-puff,alpha)
pop flare burst=1 life=.5 at=point().c(.2) r=light(<%c|1,.6,.3>,10*(1>0),6)`;
// the Wayside cauldron: within reach the pack grows the brew row
// the Abbess's Candle carried: every warm fire within reach of its bearer gutters cold blue, and takes its own flame back once they pass
const COLD_FIRE = `fx
pop flame rate=flick(.45,.2)*36 on=disc(.22) life=.4..0.75 v=up(1.3)+cone(20)*(.3..0.7) size=.16..0.32 acc=curl(.5)*1.2+buoy(2)+drag(1.5)
  sz=$size*(.5>.25:1>.7:.7>.14) col=hdr(1.4,3.6,3.8)>.4:hdr(.5,1.8,2.2)>hdr(.1,.4,.6) a=0>.12:1>.75:.85>0 rot=spin(.2) r=sprite(flame-wisp,add)
pop motes rate=4 on=disc(.25) life=1..1.8 v=up(.8)+sdir()*.3 size=.02..0.04 acc=curl(.6)+drag(.6) col=hdr(1.2,3,3.4) a=(0>.1:1>.7:.8>0)*flick(7,.4) r=sprite(ember,add)
pop smoke on=@flame?.15 inh=p;v:$v*.4 life=1.6..2.6 size=.14..0.22 acc=buoy(.9)+drag(.8) sz=$size*(.7>3) col=<.2,.22,.24> a=0>.22:.3>.7:.15>0 r=sprite(smoke-puff,alpha)`;
const CHILL_R = 9, CHILL_OFF = 12;
function candleChill(ctx) {
  const now = ctx.now(); if (now < (me.chillAt ?? 0)) return; me.chillAt = now + 400;
  const carry = (ctx.self.state.abbesswax ?? 0) > 0, f = ctx.self.feetPosition;
  me.chilled ??= {};
  if (carry) for (const r of ctx.query({ radius: CHILL_R, center: f })) {
    if (!/brazier/.test(r.id) || r.id.startsWith("oss-") || me.chilled[r.id]) continue;
    const fl = ctx.place.objects[`${r.id}/flame`]; if (!fl || !fl.fx) continue;
    if (!fl.state) fl.state = {};
    if (!fl.state.warm) fl.state.warm = { fx: fl.fx, light: fl.light ?? null };
    if (fl.state.cold) { me.chilled[r.id] = true; continue; }
    fl.state.cold = true; fl.fx = { script: COLD_FIRE };
    if (fl.light) fl.light = { ...fl.light, color: "#7fd8e6" };
    me.chilled[r.id] = true;
    ctx.emit("playSound", { clip: "/cdn/moodboard-gothic-horror/sfx-fire-guttering-out-into-cold-whispering-breath.mp3", position: r.feetPosition, volume: 0.45, maxDistance: 18 });
  }
  for (const id of Object.keys(me.chilled)) {
    const b = ctx.place.objects[id], fl = ctx.place.objects[`${id}/flame`];
    const far = !b || Math.hypot(b.feetPosition.x - f.x, b.feetPosition.z - f.z) > CHILL_OFF;
    if (!carry || far) { if (fl?.state?.warm) { fl.fx = fl.state.warm.fx; if (fl.state.warm.light) fl.light = fl.state.warm.light; fl.state.cold = false; } delete me.chilled[id]; }
  }
}
function cauldronNear(ctx) {
  const now = ctx.now(); if (now < (me.cauldAt ?? 0)) return; me.cauldAt = now + 400;
  const s = ctx.self.state, o = ctx.getObject("wayside-cauldron"), f = ctx.self.feetPosition;
  const near = !!o && !s.menu && !s.dead && Math.hypot(o.feetPosition.x - f.x, o.feetPosition.z - f.z) < BREW.reach;
  if (!!s.atCauldron !== near) { s.atCauldron = near; if (near && !s.cauldSeen) { s.cauldSeen = true; msg(ctx, "The rendering cauldron. Open your pack (I) to boil shards and dust into a brew."); } }
}
function smithGain(ctx, n) {
  const s = ctx.self.state, before = smithRank(s.smithXp ?? 0).i;
  s.smithXp = (s.smithXp ?? 0) + n;
  const after = smithRank(s.smithXp);
  if (after.i > before) {
    msg(ctx, `Smithing rank ${after.i + 1}: ${after.name}. Your patterns come hotter now.`);
    ctx.emit("playSound", { clip: sfx("anvil-rank-up-triple-ring-and-low-choir"), volume: 0.8 }, { audience: { player: ctx.self.id } });
    ctx.emit("damageNumber", { position: { ...ctx.self.feetPosition, y: ctx.self.feetPosition.y + 2.4 }, text: `⚒ ${after.name.toUpperCase()}`, color: "#e0a866", size: 2, lifetime: 3 }, { audience: { player: ctx.self.id } });
    ctx.emit("milestone", { step: 20 + after.i, name: `smith rank ${after.i + 1}` }, { audience: { player: ctx.self.id } });
  }
}
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
// Ser Hollin Vey, the Bladewraith trainer: copper buys a deeper rank of an art once the Bearer is seasoned enough
const art = (s, k) => s.arts?.[k] ?? 0;
function guildVaultNear(ctx) {
  const now = ctx.now(); if (now < (me.gvAt ?? 0)) return; me.gvAt = now + 400;
  const s = ctx.self.state, f = ctx.self.feetPosition, V = C.guildVault;
  const near = !s.menu && !s.dead && Math.hypot(V.x - f.x, V.z - f.z) < V.reach;
  if (!!s.atGuildVault === near) return;
  s.atGuildVault = near;
  if (near) { s.bagOpen = true; s.shop = null; readGuildVault(ctx).catch((e) => ctx.log("gvault read failed", String(e)));
    if (!ctx.self.guild) msg(ctx, "A guild chest, sealed with a guild's mark. Join or found a guild on Spawn and it opens to you."); }
}
function vaultNear(ctx) {
  const now = ctx.now(); if (now < (me.vaultAt ?? 0)) return; me.vaultAt = now + 400;
  const s = ctx.self.state, f = ctx.self.feetPosition, V = C.vault;
  const near = !s.menu && !s.dead && Math.hypot(V.x - f.x, V.z - f.z) < V.reach;
  if (!!s.atVault === near) return;
  s.atVault = near;
  if (near) { s.bagOpen = true; s.shop = null;
    ctx.emit("playSound", { clip: sfx("iron-strongbox-creak-open-coins-shift"), position: f, volume: 0.5 }, { audience: { player: ctx.self.id } });
    if (!s.vaultSeen) { s.vaultSeen = true; msg(ctx, "Dame Maudry Quill: \"Wax-sealed, ledgered, and kept from the Veil. Whatever you leave here waits for you.\""); } }
}
function trainerNear(ctx) {
  const now = ctx.now(); if (now < (me.trainAt ?? 0)) return; me.trainAt = now + 400;
  const s = ctx.self.state, o = ctx.getObject("hollin"), f = ctx.self.feetPosition;
  const near = !!o && !s.menu && !s.dead && Math.hypot(o.feetPosition.x - f.x, o.feetPosition.z - f.z) < C.trainer.reach;
  if (!!s.atTrainer !== near) { s.atTrainer = near; if (near && !s.trainerSeen) { s.trainerSeen = true; msg(ctx, "Ser Hollin Vey: \"You swing like a pilgrim. Copper, and I'll fix that.\""); } }
}
function trainInput(ctx, a) {
  const s = ctx.self.state, T = C.trainer;
  if (!a || a.n === me.trainN || !s.atTrainer) return; me.trainN = a.n;
  const A = T.arts[a.k]; if (!A) return;
  const r = art(s, a.k), next = A.ranks[r];
  const deny = (t) => { msg(ctx, t); ctx.emit("playSound", { clip: sfx("dull-click-denied"), position: ctx.self.feetPosition, volume: 0.3 }, { audience: { player: ctx.self.id } }); };
  if (!next) return deny(`${A.name} is mastered. Hollin has nothing left to show you there.`);
  if ((s.level ?? 1) < next.lvl) return deny(`"Come back at level ${next.lvl}. Your arm isn't ready for it."`);
  if ((s.copper ?? 0) < next.cost) return deny(`"${next.cost} copper. I don't teach on credit."`);
  s.copper -= next.cost; s.arts = { ...(s.arts ?? {}), [a.k]: r + 1 };
  const f = ctx.self.feetPosition;
  ctx.emit("fx", { position: { x: f.x, y: f.y + 1, z: f.z }, script: SLASH });
  ctx.emit("shockwave", { position: { x: f.x, y: f.y + 0.2, z: f.z }, speed: 10, thickness: 0.3, intensity: 0.35 });
  ctx.emit("playSound", { clip: sfx("anvil-rank-up-triple-ring-and-low-choir"), position: f, volume: 0.8, pitch: 0.9 });
  ctx.emit("damageNumber", { position: { ...f, y: f.y + 2.4 }, text: `${A.name.toUpperCase()} ${["I", "II", "III"][r + 1]}`, color: "#9cc8ff", size: 2, lifetime: 3 }, { audience: { player: ctx.self.id } });
  ctx.emit("milestone", { step: 40 + r, name: `trained ${a.k} ${r + 1}` }, { audience: { player: ctx.self.id } });
  ctx.emit("stat", { name: "copper spent training", value: next.cost }, { audience: { player: ctx.self.id } });
  msg(ctx, `${A.name} rank ${r + 2}. ${A.per.split(" per")[0]}.`);
  me.saveSoon = true;
}
// Wayshrines: the first touch attunes this Bearer; standing at any lit shrine opens the road to the others
const SHRINE_FX = `fx
pop rise rate=?mobile:8|16 on=disc(.9).c(.65) life=1.4..2.4 v=up(.5..0.9) size=.03..0.06 acc=curl(.4)*.4+drag(.3) col=hdr(.8,1.9,2.2)>hdr(.2,.6,.8) a=0>.15:1>.7:.8>0 r=sprite(mote,add)
pop crown rate=6 on=sphere(.15).c(3.35) life=.8..1.4 v=sdir()*.25 size=.04..0.08 col=hdr(1.2,2.6,3) a=1>0 r=sprite(soft-disc,add)`;
const BLINK = `fx
pop col burst=40 on=disc(.6) life=.6..1 v=up(3..6) size=.05..0.1 acc=drag(1.5) col=hdr(1,2.4,2.8)>hdr(.2,.6,.9) a=1>0 r=sprite(ember,add,velocity,.05)
pop ring burst=1 life=.5 at=point().c(.1) size=.5 sz=$size*(1>7) col=hdr(.6,1.4,1.8) a=.8>0 r=sprite(soft-disc,add)
pop flare burst=1 life=.5 at=point().c(1) b=1>0 r=light(<.45,.9,1.1>,$b*50,10)`;
function shrineNear(ctx) {
  const now = ctx.now(); if (now < (me.shrineAt ?? 0)) return; me.shrineAt = now + 400;
  const s = ctx.self.state, f = ctx.self.feetPosition, W = C.wayshrines;
  let at = null;
  for (const w of W.list) if (Math.hypot(w.x - f.x, w.z - f.z) < W.reach) { at = w; break; }
  const id = at && !s.menu && !s.dead ? at.id : null;
  if ((s.atShrine ?? null) !== id) s.atShrine = id;
  if (id && !(s.shrines ?? []).includes(id)) {
    s.shrines = [...(s.shrines ?? []), id];
    ctx.emit("fx", { position: { x: at.x, y: f.y, z: at.z }, script: BLINK });
    ctx.emit("playSound", { clip: sfx("ancient-stone-shrine-awakens-glass-chime-and-low-hum"), position: f, volume: 0.8 });
    ctx.emit("damageNumber", { position: { ...f, y: f.y + 2.4 }, text: `WAYSHRINE · ${at.name.toUpperCase()}`, color: "#9fe3ea", size: 1.6, lifetime: 3 }, { audience: { player: ctx.self.id } });
    ctx.emit("milestone", { step: 50 + W.list.indexOf(at), name: `attuned ${at.id}` }, { audience: { player: ctx.self.id } });
    msg(ctx, (s.shrines.length > 1) ? `The ${at.name} wayshrine wakes. Its light knows the others now.` : `The ${at.name} wayshrine wakes to your hand. Touch others on the road and they'll carry you between them.`);
  }
  // each lit shrine wears its glow on this Bearer's screen alone
  me.shrineGlow ??= {};
  for (const w of W.list) { const lit = (s.shrines ?? []).includes(w.id);
    if (lit && !me.shrineGlow[w.id]) me.shrineGlow[w.id] = ctx.spawn({ audience: "local", scope: "session", feetPosition: { x: w.x, y: { terrain: 0 }, z: w.z }, fx: { script: SHRINE_FX },
      children: [{ id: "light", feetPosition: { x: 0, y: 3.4, z: 0 }, light: { kind: "point", color: "#7fd8e6", intensity: 3, distance: 10 } }] }); }
}
function travelInput(ctx, a) {
  const s = ctx.self.state, W = C.wayshrines;
  if (!a || a.n === me.travelN || !s.atShrine) return; me.travelN = a.n;
  const to = W.list.find((w) => w.id === a.to); if (!to || to.id === s.atShrine || !(s.shrines ?? []).includes(to.id)) return;
  if (to.gate === "abbey" && !GATE.abbey) { msg(ctx, "The Abbey road is sealed. The shrine's light gutters and refuses."); return; }
  if ((s.copper ?? 0) < W.cost) { msg(ctx, `The shrine asks ${W.cost} copper for the road. You carry ${s.copper ?? 0}.`); ctx.emit("playSound", { clip: sfx("dull-click-denied"), position: ctx.self.feetPosition, volume: 0.3 }, { audience: { player: ctx.self.id } }); return; }
  if (ctx.query({ tags: ["enemy"], radius: 10, center: ctx.self.feetPosition }).some((r) => isFoe(ctx.getObject(r.id)))) { msg(ctx, "Not with blood still up. Breathe first."); return; }
  s.copper -= W.cost;
  const f = ctx.self.feetPosition;
  ctx.emit("fx", { position: f, script: BLINK });
  ctx.emit("playSound", { clip: sfx("ghostly-dash-whoosh-glass-chime"), position: f, volume: 0.8, pitch: 0.7 });
  const dest = { x: to.x + 1.6, y: (ctx.place.terrain?.heightAt?.(to.x + 1.6, to.z + 1.6) ?? 0) + 0.3, z: to.z + 1.6 };
  s.goal = null; s.target = null; me.route = null;
  ctx.self.feetPosition = dest; ctx.self.velocity = { x: 0, y: 0, z: 0 };
  ctx.emit("fx", { position: dest, script: BLINK });
  ctx.emit("playSound", { clip: sfx("ancient-stone-shrine-awakens-glass-chime-and-low-hum"), position: dest, volume: 0.7 });
  ctx.emit("screenFlash", { color: "#9fe3ea", duration: 0.35, intensity: 0.35 }, { audience: { player: ctx.self.id } });
  ctx.emit("stat", { name: "shrine travel" }, { audience: { player: ctx.self.id } });
}
function boardNear(ctx) {
  const now = ctx.now(); if (now < (me.boardAt ?? 0)) return; me.boardAt = now + 400;
  const s = ctx.self.state, f = ctx.self.feetPosition;
  const dOf = (b) => (b ? Math.hypot(b.feetPosition.x - f.x, b.feetPosition.z - f.z) : Infinity);
  const a = ctx.getObject("trade-board"), b = ctx.getObject("exchange-board"), o = dOf(a) <= dOf(b) ? a : b; // the camp board or the Exchange in Candlehold
  const near = !!o && !s.menu && !s.dead && dOf(o) < TRADE.reach;
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
  } else if (a.a === "brew") {
    if (!s.atCauldron) return; const D = BREW.brews[a.id]; if (!D) return;
    if ((s.dust ?? 0) < D.dust || (s.shards ?? 0) < D.shards || (s.heartwax ?? 0) < (D.heartwax ?? 0) || (s.abbesswax ?? 0) < (D.abbesswax ?? 0)) { msg(ctx, `${D.name} wants ${D.dust} ash dust and ${D.shards} wax shard${D.shards > 1 ? "s" : ""}${D.heartwax ? ` and ${D.heartwax} heartwax, torn from a boss` : ""}${D.abbesswax ? ` and the Abbess's Candle, from the Ossuary` : ""}.`); ctx.emit("playSound", { clip: sfx("dull-click-denied"), position: ctx.self.feetPosition, volume: 0.3 }, { audience: { player: ctx.self.id } }); return; }
    const before = renderRank(s.renderXp ?? 0).i, b = brewMade(a.id, s.renderXp ?? 0);
    s.dust -= D.dust; s.shards -= D.shards; if (D.heartwax) s.heartwax -= D.heartwax; if (D.abbesswax) s.abbesswax -= D.abbesswax;
    s.brew = { id: a.id, stats: b.stats, until: ctx.now() + b.secs * 1000, secs: b.secs };
    s.renderXp = (s.renderXp ?? 0) + BREW.xp;
    const o = ctx.getObject("wayside-cauldron"), at = o ? { x: o.feetPosition.x, y: o.feetPosition.y + 1, z: o.feetPosition.z } : ctx.self.feetPosition;
    ctx.emit("fx", { position: at, script: BREW_FX, params: { c: hexV(D.color) } });
    ctx.emit("playSound", { clip: sfx("ladle-dips-into-hot-wax-pour-into-clay-flask-and-gulp"), position: at, volume: 0.8 });
    ctx.emit("screenFlash", { color: D.color, duration: 0.3, intensity: 0.18 }, { audience: { player: ctx.self.id } });
    msg(ctx, `${D.name}. ${b.secs}s of it in your blood.`);
    const after = renderRank(s.renderXp);
    if (after.i > before) { msg(ctx, `Rendering rank ${after.i + 1}: ${after.name}. Your brews run stronger and longer.`); ctx.emit("playSound", { clip: sfx("anvil-rank-up-triple-ring-and-low-choir"), volume: 0.7, pitch: 1.2 }, { audience: { player: ctx.self.id } }); ctx.emit("milestone", { step: 30 + after.i, name: `render rank ${after.i + 1}` }, { audience: { player: ctx.self.id } }); }
    deriveGear(ctx);
    return;
  } else if (a.a === "craft") {
    if (!s.atForge) return;
    if (inv.length >= 24) { msg(ctx, "Your pack is full. The smith won't hand you steel to drop."); return; }
    const c = craftCost(s.smithXp ?? 0);
    if ((s.dust ?? 0) < c.dust || (s.shards ?? 0) < c.shards) { msg(ctx, `A pattern wants ${c.dust} ash dust and ${c.shards} wax shards. You carry ${s.dust ?? 0} and ${s.shards ?? 0}.`); ctx.emit("playSound", { clip: sfx("dull-click-denied"), position: ctx.self.feetPosition, volume: 0.3 }, { audience: { player: ctx.self.id } }); return; }
    const r = craft(ctx, a.b, s.level ?? 1, s.smithXp ?? 0); if (r.error) { msg(ctx, r.error); return; }
    s.dust -= c.dust; s.shards -= c.shards; inv.push(r.item);
    const big = r.item.t === "gilded" || r.item.t === "relic";
    const o = ctx.getObject("wayside-forge"), at = o ? { x: o.feetPosition.x, y: o.feetPosition.y + 1, z: o.feetPosition.z } : ctx.self.feetPosition;
    ctx.emit("fx", { position: at, script: big ? FORGE_BIG : FORGE_HIT });
    if (big) ctx.emit("screenFlash", { color: r.item.t === "relic" ? "#ff9040" : "#f0cf55", duration: 0.25, intensity: 0.22 }, { audience: { player: ctx.self.id } });
    ctx.emit("playSound", { clip: "/cdn/moodboard-gothic-horror/sfx-" + ITEM_SFX[big ? "forgeBig" : "forge"] + ".mp3", position: at, volume: 0.8 });
    s.invSel = r.item.u; s.inv = inv; s.gear = gear;
    smithGain(ctx, SMITH.xp.craft);
    return;
  } else if (a.a === "forge") {
    if (!s.atForge) return; const i = inv.findIndex((x) => x.u === a.u); if (i < 0) return;
    const r = forge(ctx, inv[i], a.op);
    if (r.error) { msg(ctx, r.error); return; }
    const gift = a.op === "reforge" && freeReforges(ctx, s) > 0; if (gift) r.cost = 0;
    if ((s.dust ?? 0) < r.cost) { msg(ctx, `The forge wants ${r.cost} ash dust. You carry ${s.dust ?? 0}.`); ctx.emit("playSound", { clip: sfx("dull-click-denied"), position: ctx.self.feetPosition, volume: 0.3 }, { audience: { player: ctx.self.id } }); return; }
    if (gift) { const mb = markBoss(ctx, s); if (mb) applyMark(r.item, mb); s.freeUsed = (s.freeUsed ?? 0) + 1; msg(ctx, mb ? `Firstblood's due: the smith works ${MARKS[mb].name} into the steel, and asks nothing.` : "Firstblood's due: the smith asks nothing of you this time."); }
    s.dust -= r.cost; inv[i] = r.item; snd = a.op === "ascend" ? "forgeBig" : "forge";
    smithGain(ctx, SMITH.xp[a.op] ?? 0);
    const o = ctx.getObject("wayside-forge"), at = o ? { x: o.feetPosition.x, y: o.feetPosition.y + 1, z: o.feetPosition.z } : ctx.self.feetPosition;
    ctx.emit("fx", { position: at, script: a.op === "ascend" ? FORGE_BIG : FORGE_HIT });
    if (a.op === "ascend") ctx.emit("screenFlash", { color: "#ffb060", duration: 0.25, intensity: 0.25 }, { audience: { player: ctx.self.id } });
    s.invSel = r.item.u; s.inv = inv; s.gear = gear;
    ctx.emit("playSound", { clip: "/cdn/moodboard-gothic-horror/sfx-" + ITEM_SFX[snd] + ".mp3", position: at, volume: 0.75 });
    return;
  } else if (a.a === "sel") { s.invSel = a.u ?? null; return; }
  else if (a.a === "shelf") {
    if (!s.atVault) return; const r = s.vaultRows ?? 0, cost = C.vault.rows[r];
    if (cost == null) return;
    if ((s.copper ?? 0) < cost) { msg(ctx, "Dame Maudry: \"A shelf costs what a shelf costs. Come back heavier.\""); ctx.emit("playSound", { clip: sfx("dull-click-denied"), position: ctx.self.feetPosition, volume: 0.3 }, { audience: { player: ctx.self.id } }); return; }
    s.copper -= cost; s.vaultRows = r + 1;
    msg(ctx, `Dame Maudry: "Shelf ${r + 1} is yours. Wax-sealed and ledgered."`);
    ctx.emit("playSound", { clip: sfx("coins-poured-onto-oak-counter-ledger-quill-scratch"), position: ctx.self.feetPosition, volume: 0.7 }, { audience: { player: ctx.self.id } });
    ctx.emit("stat", { name: "vault shelf", value: cost }, { audience: { player: ctx.self.id } });
    return;
  }
  else if (a.a === "store" || a.a === "take") {
    if (!s.atVault) return;
    const vault = JSON.parse(JSON.stringify(s.vault ?? []));
    if (a.a === "store") { const i = inv.findIndex((x) => x.u === a.u); if (i < 0) return;
      if (vault.length >= C.vault.slots + (s.vaultRows ?? 0) * C.vault.row) { msg(ctx, "Dame Maudry: \"The shelves are full, child. Take something home first.\""); return; }
      vault.push(inv[i]); inv.splice(i, 1); }
    else { const i = vault.findIndex((x) => x.u === a.u); if (i < 0) return;
      if (inv.length >= 24) { msg(ctx, "Your pack is full."); return; }
      inv.push(vault[i]); vault.splice(i, 1); }
    s.vault = vault; s.inv = inv; s.invSel = null;
    ctx.emit("playSound", { clip: sfx(a.a === "store" ? "heavy-iron-strongbox-lid-thud-and-latch" : "iron-strongbox-creak-open-coins-shift"), position: ctx.self.feetPosition, volume: 0.55 }, { audience: { player: ctx.self.id } });
    return;
  }
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
  if (SIG[s.cls]) return SIG[s.cls](ctx, s, f, aim);
  let dx = aim.x - f.x, dz = aim.z - f.z; const d = Math.hypot(dx, dz) || 1; dx /= d; dz /= d;
  s.faceYaw = yawTo(dx, dz); s.goal = null; me.route = null;
  // the wind-up: the blade drinks ember light for a breath before it falls
  me.cwHoldUntil = now + 240;
  ctx.emit("fx", { position: { x: f.x - dx * 0.4, y: f.y + 1.7, z: f.z - dz * 0.4 }, script: GATHER });
  ctx.emit("playSound", { clip: sfx("blade-draw-back-ember-hiss-rising"), position: f, volume: 0.6 });
  ctx.after(0.24, "crosswoundFall", { dx, dz });
}
const GATHER = `fx
pop mote burst=22 on=sphere(1.1) life=.24 v=attract(6) size=.03..0.06 col=hdr(3.2,1.3,.35) a=0>.3:1>0 r=sprite(ember,add,velocity,.02)
pop glow burst=1 at=point() life=.26 r=light(<1,.5,.2>,(0>1)*18,6)`;
export function crosswoundFall(ctx, p) {
  const s = ctx.self.state, cw = C.crosswound, f = ctx.self.feetPosition, dx = p.dx, dz = p.dz;
  if ((s.hp ?? 1) <= 0) return;
  swingAnim(ctx, "cdn/clip-kick.glb");
  ctx.self.anim.attack.clip = "cdn/clip-attack.glb";
  ctx.emit("screenShake", { intensity: 0.18, duration: 0.18 }, { audience: { player: ctx.self.id } });
  ctx.emit("fx", { position: { x: f.x + dx * 1.6, y: f.y + 1, z: f.z + dz * 1.6 }, script: SLASH });
  ctx.emit("playSound", { clip: sfx("heavy-sword-cleave-whoosh-ringing"), position: f, volume: 0.8 });
  ctx.emit("cameraPunch", { direction: { x: dx, y: 0, z: dz }, intensity: 0.25 }, { audience: { player: ctx.self.id } });
  const cos = Math.cos((cw.arc / 2) * Math.PI / 180);
  for (const r of ctx.query({ tags: ["enemy"], radius: cw.reach + 0.6, center: f })) {
    const o = ctx.getObject(r.id); if (!isFoe(o)) continue;
    const ex = o.feetPosition.x - f.x, ez = o.feetPosition.z - f.z, ed = Math.hypot(ex, ez) || 1;
    if ((ex * dx + ez * dz) / ed < cos && ed > 1) continue;
    strike(ctx, o, Math.round(cw.dmg * (1 + 0.2 * art(s, "crosswound")) * weaponMul(s) * (0.9 + ctx.random() * 0.2)), false, true);
    if (s.cls === "primalist") { const t = o.feetPosition; ctx.emit("fx", { position: { x: t.x, y: t.y, z: t.z }, script: BOLTDOWN }); }
    if (s.cls === "hellwarden") { o.state.burnUntil = ctx.now() + 3000; for (let i = 1; i <= 3; i++) ctx.after(i, "burnTick", { id: o.id }); }
  }
  if (s.cls === "hellwarden") { ctx.emit("fx", { position: { x: f.x + dx * 1.8, y: f.y + 0.05, z: f.z + dz * 1.8 }, script: FURNACE }); ctx.emit("playSound", { clip: sfx("furnace-door-roar-fire-sweep"), position: f, volume: 0.7 }); }
  if (s.cls === "primalist") ctx.emit("playSound", { clip: sfx("war-horn-blast-and-thunder-crack"), position: f, volume: 0.8 });
}
// Furnace Sweep's arc of burning ground and Stormhorn's bolt from the sky
const FURNACE = `fx
pop flame win=0;1.6 rate=?mobile:45|90 on=arc(1.8,140) life=.5..0.9 v=up(1.6..2.8)+sdir()*.3 size=.55..0.95 acc=curl(.5)+buoy(1.6)+drag(1.4) sz=$size*(.5>1:.3>.2) col=hdr(4.4,2.6,.9)>hdr(2,.6,.1)>hdr(.5,.1,.02) a=0>.1:1>.7:.8>0 rot=spin(.3) win=0;1.8 r=sprite(flame-wisp,add)
pop smoke on=@flame?.15 life=1.2..2 size=.3..0.5 acc=buoy(.8)+drag(.8) sz=$size*(.7>2.4) col=<.2,.17,.15> a=0>.2:.3>0 r=sprite(smoke-puff,alpha)
pop glow burst=1 life=2.2 at=point().c(.5) r=light(<1,.5,.15>,22*(1>.6:.8>0),8)`;
const BOLTDOWN = `fx
pop bolt burst=1 life=.18 size=1 col=hdr(3,3.6,5) a=1>0 r=mesh(cylinder,.06,8,.06)
pop spark burst=20..28 on=sphere(.3).c(1) life=.2..0.5 v=sdir()*(2..5) size=.02..0.04 acc=grav()*.3+drag(2) col=hdr(3,3.4,4.6)>hdr(.6,.8,1.4) a=1>0 r=sprite(ember,add,velocity,.05)
pop flash burst=1 life=.2 at=point().c(2) r=light(<.7,.8,1>,50*(1>0),10)`;
export function burnTick(ctx, p) {
  const o = ctx.getObject(p.id); if (!isFoe(o) || ctx.now() > (o.state.burnUntil ?? 0) + 50) return;
  strike(ctx, o, Math.max(1, Math.round(C.crosswound.dmg * 0.15 * weaponMul(ctx.self.state))), false, true);
}

function griefstep(ctx) {
  const s = ctx.self.state, now = ctx.now(), g = C.griefstep;
  if (now < (me.dashReady ?? 0)) return;
  const f = ctx.self.feetPosition, aim = me.aim ?? { x: f.x, z: f.z - 1 };
  let dx = aim.x - f.x, dz = aim.z - f.z; const d = Math.hypot(dx, dz);
  if (d < 0.2) { dx = -Math.sin(((s.faceYaw ?? 0) * Math.PI) / 180); dz = -Math.cos(((s.faceYaw ?? 0) * Math.PI) / 180); } else { dx /= d; dz /= d; }
  me.dashReady = now + (g.cd - 0.6 * art(s, "griefstep")) * 1000; s.dashReadyAt = me.dashReady;
  me.dash = { dx, dz, until: now + g.time * 1000 };
  s.iframesUntil = now + (g.iframes + 0.1 * art(s, "griefstep")) * 1000;
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
  s.guardReadyAt = now + g.cd * 1000; s.guardUntil = now + (g.window + 0.3 * art(s, "guard")) * 1000; me.guardSeen = s.riposte ?? 0;
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
    for (const r of ctx.query({ tags: ["enemy"], radius: C.guard.reach, center: f })) { const o = ctx.getObject(r.id); if (isFoe(o)) strike(ctx, o, Math.round(C.guard.riposte * (1 + 0.35 * art(s, "guard")) * weaponMul(s)), true, true); }
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
  { const sw = s.hp < s.maxHp * 0.35 && hasKey(s.cls, s.talents, "secondwind");
    if ((s.gs?.regen ?? 0) > 0 && s.hp > 0 && s.hp < s.maxHp && now - (me.regenAt ?? 0) > (sw ? 1500 : 5000)) { me.regenAt = now; s.hp = Math.min(s.maxHp, s.hp + Math.max(1, Math.round(s.gs.regen * (sw ? 2 : 1))));
      if (sw) ctx.emit("damageNumber", { position: { ...ctx.self.feetPosition, y: ctx.self.feetPosition.y + 2 }, text: "SECOND WIND", color: "#8fd18a", size: 0.7 }, { audience: { player: ctx.self.id } }); } }
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
STEP.snow = sfx("footstep-boot-crunching-in-deep-fresh-snow"); STEP.cave = sfx("footstep-boot-on-gritty-cave-rock-with-small-echo");
const STEP_OF = { rimepass: "snow", rime: "snow", deep: "cave", bonestair: "hall", ossuary: "hall", fire: "ash", fenpath: "mud", fen: "mud", orchpath: "leaves", orchard: "leaves", nave: "hall", crypt: "hall", abbey: "hall" };
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
  if (me.prevHp != null && s.hp < me.prevHp - 0.5) s.hurtAt = now; me.prevHp = s.hp; // the portrait's red flash
  gate(ctx);
  if (ctx.self.isLocal !== false) showcase(ctx);
  if (!ctx.self.state.menu && ctx.self.state.charId) { drainLoot(ctx); deriveGear(ctx); if (ctx.self.isLocal !== false) { forgeNear(ctx); boardNear(ctx); trainerNear(ctx); shrineNear(ctx); vaultNear(ctx); guildVaultNear(ctx); cauldronNear(ctx); candleChill(ctx); } }
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
  if (BEARER[s.cls] && me.bodyOf !== s.cls) { me.bodyOf = s.cls; ctx.self.model = BEARER[s.cls]; } // the calling's own body
  if (s.ancestry && me.ancOf !== s.ancestry && ANCESTRY[s.ancestry]) { me.ancOf = s.ancestry; const A_ = ANCESTRY[s.ancestry]; // the blood shows: lantern colour and a faint aura
    const lamp = ctx.getObject(ctx.self.id + "/lightradius"); if (lamp) lamp.light = { ...lamp.light, color: A_.lamp };
    const au = ctx.getObject(ctx.self.id + "/aura"); if (au) au.fx = { script: A_.aura }; else ctx.spawn("aura", { parent: ctx.self.id, feetPosition: { x: 0, y: 0, z: 0 }, fx: { script: A_.aura }, scope: "session" }); }
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
    // under a quarter of life the heart is heard, quicker the closer the end
    if (fr < 0.25 && fr > 0 && now >= (me.beatAt ?? 0)) {
      me.beatAt = now + 520 + fr * 2400;
      ctx.emit("playSound", { clip: sfx("low-health-heartbeat-thump-muffled"), position: f, volume: 0.35 + (0.25 - fr) * 1.2 }, { audience: { player: ctx.self.id } });
    }
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
      ctx.self.vignette = 0; me.vig = 0;
    }
    return;
  }
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
    const sp = HERO_SPEED(s) * (now < (me.rushUntil ?? 0) ? 1.35 : now < (me.hasteUntil ?? 0) ? C.traits.fenborn.haste : 1);
    v = { x: me.keys.x * sp, z: me.keys.z * sp };
    const l = Math.hypot(v.x, v.z); if (l > sp) { v.x *= sp / l; v.z *= sp / l; }
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
      if (d > atkOf(s).reach) {
        if (!me.chase || flat(me.chase, foe.feetPosition) > 1) { me.chase = { ...foe.feetPosition }; me.route = null; }
        v = walkTo(ctx, foe.feetPosition, HERO_SPEED(s), dt);
      } else {
        s.faceYaw = yawTo(foe.feetPosition.x - f.x, foe.feetPosition.z - f.z);
        ashcut(ctx, foe);
      }
    }
  } else if (s.goal) {
    v = walkTo(ctx, s.goal, HERO_SPEED(s) * (now < (me.rushUntil ?? 0) ? 1.35 : now < (me.hasteUntil ?? 0) ? C.traits.fenborn.haste : 1), dt);
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
