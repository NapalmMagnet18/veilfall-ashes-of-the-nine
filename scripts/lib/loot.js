// VEILFALL loot: rolls an item, sums a Bearer's worn gear, and writes the item card text.
// An item is a small row in player.state.inv / player.state.gear:
// { u: uid, b: base, t: tier, n: name, il: item level, s: { stat: value }, r?: relic id, set?: set id }
import L from "./data/loot.yml";
import ICONS from "./data/loot-icons.yml";

export const SLOTS = ["weapon", "helm", "chest", "gloves", "boots", "ring", "amulet"];
export const TIER = Object.fromEntries(L.tiers.map((t) => [t.id, t]));
const ORDER = L.tiers.map((t) => t.id);
const affOf = Object.fromEntries(L.affixes.map((a) => [a.id, a]));
export const icon = (b) => ICONS[b] ?? ICONS.blade;
export const BAG = L.bag;

const pick = (ctx, arr) => arr[Math.floor(ctx.random() * arr.length)];
const between = (ctx, lo, hi) => lo + ctx.random() * (hi - lo);

function rollTier(ctx, d) {
  const floor = d.minTier ? ORDER.indexOf(d.minTier) : 0;
  if (d.relic && ctx.random() < d.relic) return ctx.random() < 0.2 ? "vowbound" : "relic";
  const pool = L.tiers.filter((t, i) => i >= floor && (d.minTier ? i <= ORDER.indexOf("gilded") : true));
  let w = pool.reduce((a, t) => a + t.weight, 0) * ctx.random();
  for (const t of pool) { w -= t.weight; if (w <= 0) return t.id; }
  return pool[0].id;
}

function implicit(base, il) {
  const B = L.bases[base], s = {};
  for (const [k, [v0, per]] of Object.entries(B.implicit)) s[k] = Math.round(v0 + per * (il - 1));
  return s;
}

export function rollItem(ctx, kind) {
  const d = L.drops[kind] ?? L.drops.pilgrim;
  const t = rollTier(ctx, d), il = Math.max(1, Math.round(d.ilvl + between(ctx, -1, 2)));
  const u = Math.floor(ctx.now() % 1e9).toString(36) + Math.floor(ctx.random() * 1e6).toString(36);
  if (t === "relic") {
    const R = pick(ctx, L.relics);
    return { u, b: R.base, t, n: R.name, il, r: R.id, s: { ...implicit(R.base, il), ...R.stats } };
  }
  if (t === "vowbound") {
    const P = pick(ctx, L.sets.penitent.pieces);
    return { u, b: P.base, t, n: P.name, il, set: "penitent", s: { ...implicit(P.base, il), ...P.stats } };
  }
  const base = pick(ctx, Object.keys(L.bases));
  return { u, b: base, t, il, ...dress(ctx, base, t, il) };
}
// a base's affixes and name for a tier at an item level: the roll and the forge share it
function dress(ctx, base, t, il, keepName) {
  const B = L.bases[base], slot = B.slot, s = implicit(base, il);
  const T = TIER[t], count = Math.round(between(ctx, T.affixes[0], T.affixes[1]));
  const allowed = L.affixes.filter((a) => a.slots.includes("any") || a.slots.includes(slot));
  const got = [];
  while (got.length < count && got.length < allowed.length) {
    const a = pick(ctx, allowed); if (got.includes(a)) continue; got.push(a);
    const v = Math.max(1, Math.round(between(ctx, a.base[0], a.base[1]) + a.per * (il - 1)));
    s[a.id] = (s[a.id] ?? 0) + v;
  }
  let n = keepName ?? pick(ctx, B.names);
  if (!keepName && t === "hallowed" && got[0]) n = got.length > 1 ? `${got[0].pre} ${n} ${got[1].suf}` : `${got[0].pre} ${n}`;
  if (!keepName && t === "gilded") n = `${pick(ctx, RARE_A)} ${pick(ctx, RARE_B)}`;
  return { n, s };
}

// THE WAYSIDE FORGE: three verbs, paid in ash dust. Returns { item, cost } or { error }.
export const FORGE = L.forge;
export function forgeCost(it, op) {
  const F = L.forge[op]; if (!F) return null;
  if (op === "ascend") return F.cost[it.t] ?? null;
  return Math.round(F.base + F.perIlvl * it.il + (op === "reforge" ? F.perTier * (TIER[it.t]?.sell ?? 1) : 0));
}
export function forgeCan(it, op) {
  const special = it.t === "relic" || it.t === "vowbound";
  if (op === "temper") return (it.tp ?? 0) < L.forge.temper.max ? null : "tempered as far as it goes";
  if (op === "reforge") return special ? "a named piece will not take new words" : it.t === "ashen" ? "plain iron has nothing to reforge" : null;
  if (op === "ascend") return special ? "already beyond the forge" : it.t === "gilded" ? "only a relic burns brighter" : null;
  return "unknown";
}
export function forge(ctx, it, op) {
  const why = forgeCan(it, op); if (why) return { error: why };
  const cost = forgeCost(it, op), out = JSON.parse(JSON.stringify(it));
  if (op === "temper") {
    const before = implicit(it.b, it.il); out.il = it.il + 1; out.tp = (it.tp ?? 0) + 1;
    const after = implicit(it.b, out.il);
    for (const k of Object.keys(after)) out.s[k] = (out.s[k] ?? 0) - (before[k] ?? 0) + after[k];
  } else if (op === "reforge") {
    out.s = dress(ctx, it.b, it.t, it.il, it.n).s; out.rf = (it.rf ?? 0) + 1; delete out.mk;
  } else if (op === "ascend") {
    out.t = ORDER[ORDER.indexOf(it.t) + 1];
    const d = dress(ctx, it.b, out.t, it.il); out.n = d.n; out.s = d.s;
  }
  return { item: out, cost };
}
const RARE_A = ["Grief", "Tallow", "Ember", "Gallows", "Wick", "Toll", "Hollow", "Bell", "Vigil", "Soot", "Fen", "Candle"];
const RARE_B = ["Vow", "Thorn", "Mourn", "Brand", "Psalm", "Shroud", "Knell", "Oath", "Tithe", "Ward", "Lament", "Fang"];

export function rollDrops(ctx, kind) {
  const d = L.drops[kind] ?? L.drops.pilgrim, out = [];
  for (let i = 0; i < (d.count ?? 1); i++) if (ctx.random() < d.chance) out.push(rollItem(ctx, kind));
  return out;
}

// every worn stat summed, set bonuses added by worn count
export function gearStats(gear) {
  const t = { dmg: 0, dmgp: 0, crit: 0, life: 0, armor: 0, speed: 0, edge: 0, leech: 0, gold: 0, regen: 0, setCount: {} };
  for (const slot of SLOTS) {
    const it = gear?.[slot]; if (!it) continue;
    for (const [k, v] of Object.entries(it.s ?? {})) t[k] = (t[k] ?? 0) + v;
    if (it.set) t.setCount[it.set] = (t.setCount[it.set] ?? 0) + 1;
  }
  for (const [id, n] of Object.entries(t.setCount)) {
    for (const [need, bon] of Object.entries(L.sets[id]?.bonus ?? {})) if (n >= +need) for (const [k, v] of Object.entries(bon)) if (k !== "line") t[k] = (t[k] ?? 0) + v;
  }
  return t;
}
export const mitigation = (armor) => armor / (armor + 120);
export const slotOf = (it) => L.bases[it.b]?.slot ?? "weapon";
export const sellValue = (it) => Math.round((TIER[it.t]?.sell ?? 1) * (8 + it.il * 3));
export const dustValue = (it) => Math.max(1, Math.round((TIER[it.t]?.sell ?? 1) * (1 + it.il / 6)));

// the item card: tier-coloured name, base, implicit, affix lines, set and lore
const IMPL_LINE = { dmg: "{v} weapon damage", armor: "{v} armor", life: "+{v} maximum life", edge: "+{v} edge per strike" };
export function cardHTML(it, gear) {
  const T = TIER[it.t] ?? TIER.ashen, B = L.bases[it.b], impl = Object.keys(B?.implicit ?? {})[0];
  const relic = it.r ? L.relics.find((r) => r.id === it.r) : null;
  const lines = Object.entries(it.s ?? {}).map(([k, v]) => {
    const tpl = k === impl ? IMPL_LINE[k] : affOf[k]?.line ?? `+{v} ${k}`;
    return `<div style="color:${k === impl ? "#d9d2c3" : "#8fb4ff"}">${tpl.replace("{v}", v)}</div>`;
  }).join("");
  let setHTML = "";
  if (it.set) {
    const S = L.sets[it.set], worn = SLOTS.filter((sl) => gear?.[sl]?.set === it.set).length;
    setHTML = `<div style="margin-top:6px;color:#5fd28b">${S.name} (${worn}/${S.pieces.length})</div>` +
      S.pieces.map((p) => `<div style="color:${SLOTS.some((sl) => gear?.[sl]?.n === p.name) ? "#5fd28b" : "#5c6b60"};font-size:11px">${p.name}</div>`).join("") +
      Object.entries(S.bonus).map(([n, b]) => `<div style="color:${worn >= +n ? "#5fd28b" : "#5c6b60"};font-size:11px">${b.line}</div>`).join("");
  }
  return `<div class="vfcard" style="border-color:${T.color}55">
    <div style="color:${T.color};font-size:15px;letter-spacing:.04em">${it.n}</div>
    <div style="color:#9a907e;font-size:11px;letter-spacing:.14em;text-transform:uppercase">${T.name} ${slotOf(it)} · item level ${it.il}</div>
    <div style="height:1px;background:linear-gradient(90deg,transparent,${T.color}88,transparent);margin:5px 0"></div>
    ${lines}${setHTML}
    ${it.cr ? `<div style="margin-top:4px;color:#b9a27a;font-size:10px;letter-spacing:.16em">⚒ WAYSIDE-FORGED</div>` : ""}
    ${it.mk && MARKS[it.mk] ? `<div style="margin-top:4px;color:${MARKS[it.mk].color};font-size:11px;letter-spacing:.14em;text-shadow:0 0 6px ${MARKS[it.mk].color}66">✦ ${MARKS[it.mk].name.toUpperCase()} ✦</div>` : ""}
    ${it.tp ? `<div style="margin-top:4px;color:#e0a866;font-size:11px;letter-spacing:.12em">${Array.from({ length: L.forge.temper.max }, (_, i) => `<span style="display:inline-block;width:6px;height:6px;margin-right:4px;transform:rotate(45deg);border:1px solid #e0a866;background:${i < it.tp ? "#e0a866" : "transparent"}"></span>`).join("")} TEMPERED</div>` : ""}
    ${relic ? `<div style="margin-top:6px;color:#c08850;font-style:italic;font-size:12px">"${relic.lore}"</div>` : ""}
    <div style="margin-top:6px;color:#7d7466;font-size:11px">sells for ${sellValue(it)}c · salvages to ${dustValue(it)} ash dust</div>
  </div>`;
}

// Firstblood's gift: one free reforge for each boss this Bearer is named on THE FALLEN plaque for (world.state.trophies[boss].by)
export function freeReforges(ctx, s) {
  const n = s?.charName; if (!n) return 0;
  const won = Object.values(ctx.world?.state?.trophies ?? {}).filter((r) => r?.by?.includes?.(n)).length;
  return Math.max(0, won - (s.freeUsed ?? 0));
}

// the boss's mark a free reforge carries: the next unspent Firstblood boss lends one of its affixes, 1.5× a full roll
export const MARKS = {
  bailiff: { name: "Bailiff's Toll", color: "#d9a85a", prefer: ["gold", "armor", "life"] },
  ringer: { name: "Ringer's Peal", color: "#c9b7ff", prefer: ["crit", "dmgp", "dmg", "life"] },
  warden: { name: "Warden's Lantern", color: "#6db8c0", prefer: ["regen", "edge", "life"] },
  hangman: { name: "Hangman's Knot", color: "#c0574a", prefer: ["leech", "speed", "crit", "life"] },
};
export function markBoss(ctx, s) {
  const n = s?.charName; if (!n) return null;
  const won = Object.entries(ctx.world?.state?.trophies ?? {}).filter(([, r]) => r?.by?.includes?.(n)).sort((a, b) => (a[1].at ?? 0) - (b[1].at ?? 0));
  return won[s.freeUsed ?? 0]?.[0] ?? null;
}
export function applyMark(item, boss) {
  const M = MARKS[boss]; if (!M) return item;
  const slot = L.bases[item.b]?.slot;
  const a = M.prefer.map((id) => L.affixes.find((x) => x.id === id)).find((x) => x && (x.slots.includes("any") || x.slots.includes(slot)));
  if (!a) return item;
  const v = Math.max(1, Math.round((a.base[1] + a.per * ((item.il ?? 1) - 1)) * 1.5));
  item.s[a.id] = (item.s[a.id] ?? 0) + v; item.mk = boss; return item;
}

// SMITHING: rank from smithXp, a crafted base at the rank's ilvl and tier odds
export const SMITH = L.smith;
export function smithRank(xp = 0) {
  let i = 0; for (let k = 0; k < L.smith.ranks.length; k++) if (xp >= L.smith.ranks[k].xp) i = k;
  const R = L.smith.ranks[i], N = L.smith.ranks[i + 1];
  return { i, name: R.name, next: N ? N.xp : null, from: R.xp, R };
}
export function craftCost(xp) { const r = smithRank(xp).i; return { dust: L.smith.craft.dust + L.smith.craft.perRank * r, shards: L.smith.craft.shards }; }
export function craft(ctx, base, level, xp) {
  if (!L.bases[base]) return { error: "the smith knows no such pattern" };
  const { R } = smithRank(xp), il = Math.max(1, (level ?? 1) + R.ilvl);
  const tot = Object.values(R.tiers).reduce((a, b) => a + b, 0); let r = ctx.random() * tot, t = "ashen";
  for (const [k, w] of Object.entries(R.tiers)) { if ((r -= w) <= 0) { t = k; break; } }
  const u = Math.floor(ctx.now() % 1e9).toString(36) + Math.floor(ctx.random() * 1e6).toString(36);
  if (t === "relic") { const pool = L.relics.filter((x) => x.base === base); if (pool.length) { const X = pick(ctx, pool); return { item: { u, b: base, t, n: X.name, il, r: X.id, s: { ...implicit(base, il), ...X.stats }, cr: 1 } }; } t = "gilded"; }
  return { item: { u, b: base, t, il, ...dress(ctx, base, t, il), cr: 1 } };
}
