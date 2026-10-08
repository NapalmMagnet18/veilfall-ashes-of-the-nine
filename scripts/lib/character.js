// A Bearer's save: which player.state keys belong to the CHARACTER (saved to the characters table, swapped on
// character select) and the SQL that reads and writes them. Everything not listed here is the body's scratch.
import C from "./data/combat.yml";
import R from "./data/realms.yml";

export const CHAR_KEYS = ["hp", "maxHp", "edge", "tonics", "xp", "level", "copper", "kills", "shards", "bag", "petitions", "quest", "claimed", "weapon", "bossKilled", "ringerKilled", "wardenKilled", "hangmanKilled", "ancestry", "cls", "seen", "inv", "gear", "dust", "gearLife", "freeUsed", "smithXp", "renderXp", "brew", "heartwax", "abbessKilled", "abbesswax"];
export function fresh(ancestry, cls) {
  return { hp: C.hero.hp, maxHp: C.hero.hp, edge: 0, tonics: C.hero.tonics, xp: 0, level: 1, copper: 0, kills: 0, shards: 0, bag: {}, petitions: [], quest: { stage: 0 }, claimed: {}, weapon: null, bossKilled: false, ancestry, cls, seen: [], inv: [], gear: {}, dust: 0, gearLife: 0, freeUsed: 0, smithXp: 0, renderXp: 0, brew: null, heartwax: 0 };
}
// where a new Bearer wakes: by the Wayside Fire, facing the road
export const START = { x: 1.2, y: 0.4, z: 1.5 };

export function realmOf(ctx) {
  const room = ctx.getRoomId?.() ?? "main";
  return R.realms.find((r) => r.room === room) ?? { room, name: room, kind: "Normal", note: "" };
}
export function pack(s, pos) {
  const d = {};
  for (const k of CHAR_KEYS) if (s[k] !== undefined) d[k] = s[k];
  if (pos) d.pos = { x: +pos.x.toFixed(2), y: +pos.y.toFixed(2), z: +pos.z.toFixed(2) };
  return d;
}
const ZONES = ["Wayside Fire", "Broken Lantern Road", "The Tollhouse", "The Dripping Gate", "Wayside Fire", "Broken Lantern Road"];
export const zoneOf = (s) => ZONES[s.quest?.stage ?? 0] ?? "Broken Lantern Road";

// names: the game names its Bearers (an ancestry's given name + a byname); a reroll draws another
const GIVEN = {
  cinderkin: ["Maren", "Corvin", "Isra", "Tamsin", "Brann", "Odile", "Hesk", "Ysolde", "Calder", "Wren", "Asha", "Teodor"],
  fenborn: ["Ilse", "Nerro", "Lune", "Sabel", "Orrin", "Veya", "Tull", "Marrow", "Edda", "Pell", "Siona", "Fenn"],
  stonebound: ["Torvald", "Hrona", "Galt", "Brisa", "Durm", "Ketta", "Orsk", "Vala", "Mund", "Ebbe", "Thrain", "Agna"],
  skyforged: ["Aeris", "Caelan", "Sef", "Ilyra", "Vane", "Oriel", "Tavi", "Zephra", "Halcyon", "Rook", "Sorin", "Linnet"],
};
const BYNAME = {
  cinderkin: ["Ashcoal", "Kilnborn", "of the Ninth Ember", "Claywright", "Soothand", "Embersworn"],
  fenborn: ["Reedwater", "of the Low Mist", "Rainkeeper", "Mirewalk", "Tidemark", "Gloamreed"],
  stonebound: ["Stairhand", "of the Deep Step", "Graniteborn", "Cairnward", "Ninefold", "Delvesworn"],
  skyforged: ["Galewright", "of the High Spire", "Windsong", "Cloudhewn", "Featherfall", "Stormlit"],
};
export function rollName(anc, r) {
  const g = GIVEN[anc] ?? GIVEN.cinderkin, b = BYNAME[anc] ?? BYNAME.cinderkin;
  return `${g[Math.floor(r() * g.length)]} ${b[Math.floor(r() * b.length)]}`;
}

export async function roster(ctx, realm) {
  const { rows } = await ctx.sql`SELECT id, name, ancestry, cls, level, zone, played_at FROM characters WHERE user_id = @caller AND realm = ${realm} AND deleted = 0 ORDER BY played_at DESC, id DESC`;
  const counts = await ctx.sql`SELECT realm, COUNT(*) AS n FROM characters WHERE user_id = @caller AND deleted = 0 GROUP BY realm`;
  const per = {}; for (const r of counts.rows) per[r.realm] = r.n;
  return { chars: rows, per };
}
export async function create(ctx, realm, name, anc, cls, data) {
  const now = ctx.now();
  const n = await ctx.sql`SELECT COUNT(*) AS n FROM characters WHERE user_id = @caller AND realm = ${realm} AND deleted = 0`;
  if ((n.rows[0]?.n ?? 0) >= R.maxChars) return { error: "full" };
  const taken = await ctx.sql`SELECT id FROM characters WHERE realm = ${realm} AND name = ${name} AND deleted = 0`;
  if (taken.rows.length) return { error: "taken" };
  const r = await ctx.sql`INSERT INTO characters (user_id, realm, name, ancestry, cls, level, zone, data, created_at, played_at) VALUES (@caller, ${realm}, ${name}, ${anc}, ${cls}, ${data.level ?? 1}, ${zoneOf(data)}, ${JSON.stringify(data)}, ${now}, ${now})`;
  return { id: r.lastInsertRowid };
}
export async function load(ctx, id, realm) {
  const { rows } = await ctx.sql`SELECT id, name, ancestry, cls, data FROM characters WHERE id = ${id} AND user_id = @caller AND realm = ${realm} AND deleted = 0`;
  if (!rows.length) return null;
  let data = {}; try { data = JSON.parse(rows[0].data || "{}"); } catch {}
  return { ...rows[0], data };
}
export async function save(ctx, id, s, pos) {
  if (!id) return;
  const d = pack(s, pos);
  await ctx.sql`UPDATE characters SET level = ${s.level ?? 1}, zone = ${zoneOf(s)}, data = ${JSON.stringify(d)}, played_at = ${ctx.now()} WHERE id = ${id} AND user_id = @caller AND deleted = 0`;
}
export async function remove(ctx, id) {
  await ctx.sql`UPDATE characters SET deleted = 1 WHERE id = ${id} AND user_id = @caller`;
}
