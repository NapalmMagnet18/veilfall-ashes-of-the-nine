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
  const base = pick(ctx, Object.keys(L.bases)), B = L.bases[base], slot = B.slot;
  const s = implicit(base, il);
  const T = TIER[t], count = Math.round(between(ctx, T.affixes[0], T.affixes[1]));
  const allowed = L.affixes.filter((a) => a.slots.includes("any") || a.slots.includes(slot));
  const got = [];
  while (got.length < count && got.length < allowed.length) {
    const a = pick(ctx, allowed); if (got.includes(a)) continue; got.push(a);
    const v = Math.max(1, Math.round(between(ctx, a.base[0], a.base[1]) + a.per * (il - 1)));
    s[a.id] = (s[a.id] ?? 0) + v;
  }
  let n = pick(ctx, B.names);
  if (t === "hallowed" && got[0]) n = got.length > 1 ? `${got[0].pre} ${n} ${got[1].suf}` : `${got[0].pre} ${n}`;
  if (t === "gilded") n = `${pick(ctx, RARE_A)} ${pick(ctx, RARE_B)}`;
  return { u, b: base, t, n, il, s };
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
    ${relic ? `<div style="margin-top:6px;color:#c08850;font-style:italic;font-size:12px">"${relic.lore}"</div>` : ""}
    <div style="margin-top:6px;color:#7d7466;font-size:11px">sells for ${sellValue(it)}c · salvages to ${dustValue(it)} ash dust</div>
  </div>`;
}
