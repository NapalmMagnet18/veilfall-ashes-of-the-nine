// The talent tree (N): every calling has three branches of four tiers; one point per level past the first.
// A tier opens once 3 points per earlier tier sit in that branch (WoW-style); the capstone is a single heavy rank.
// Every node feeds a stat the game already reads (gearStats keys), so a point spent is felt at once.
const I = (h) => `/cdn/value.${h}.png`;
export const TAL_ICON = {
  dmgp: I("2783b52bb44d60fcca9f520576bc65a9d63c5c09b7798728cfd710657c70f65a"), crit: I("a262dbf4d3d8aec7fe6333d02fb1ead47c230cfe4bc132741f7d51ad23241095"),
  life: I("54850c48a53e6c4c704753bffb73ff4812f491a00f0749110e54bc19b6a86017"), armor: I("111bccea1438473ceae201f12c498692d9a569febc17edd238afedf671cb2eb0"),
  speed: I("92457c8fc1e5f7b229c71cc73b7a62beb31130e38418b659733b06096c1b29cc"), edge: I("110e024617bc2aef6fe186212007a1b2b94ffd7ad60e91c99e709f50e3fa4a35"),
  leech: I("586815a3895be50276469df590f37c2b4fbc27ffc3b730345e14657c66c688b6"), regen: I("35247f244c593b5d2f3e919dfb7977fa2d478ce42e9195df4d3b335efd447d7d"),
};
// per rank: how much one point gives
export const PER = { dmgp: 4, crit: 1.5, life: 8, armor: 10, speed: 2, edge: 1, leech: 0.6, regen: 0.4 };
export const LABEL = { dmgp: "% damage", crit: "% critical chance", life: " maximum life", armor: " armor", speed: "% move speed", edge: " resource per hit", leech: "% life leech", regen: " life per second" };
// [branch name, colour, [[node name, stat], ×4]]
const TREES = {
  bladewraith: [["Ashblade", "#e0703a", [["Honed Regret", "dmgp"], ["Cinder Edge", "crit"], ["Bleeding Memory", "leech"], ["The Ninth Cut", "dmgp"]]],
                ["Griefwalk", "#9fb6ff", [["Light Step", "speed"], ["Ashen Cloak", "armor"], ["Restless", "speed"], ["Unseen Mourner", "crit"]]],
                ["Oathkeeper", "#c49c63", [["Kept Vow", "life"], ["Iron Penance", "armor"], ["Steady Flame", "regen"], ["Unbroken Oath", "life"]]]],
  soulweaver: [["Resonance", "#6db8c0", [["Clear Note", "dmgp"], ["Harmonic", "edge"], ["Shatterchord", "crit"], ["Aria of the Nine", "dmgp"]]],
               ["Warding", "#9fb6ff", [["Name-Ward", "armor"], ["Soft Hymn", "regen"], ["Lullaby", "life"], ["Choir Aegis", "armor"]]],
               ["Memory", "#c49c63", [["Recall", "speed"], ["Borrowed Breath", "leech"], ["Echo", "crit"], ["The Kept Name", "life"]]]],
  hellwarden: [["Cinder", "#e0703a", [["Coal Fist", "dmgp"], ["Brand", "crit"], ["Furnace Heart", "edge"], ["Hellfire Maul", "dmgp"]]],
               ["Bulwark", "#c49c63", [["Iron Skin", "armor"], ["Shield Wall", "armor"], ["Stand Fast", "life"], ["Covenant Plate", "armor"]]],
               ["Covenant", "#ff6a55", [["Oath of Blood", "life"], ["Mending Ember", "regen"], ["Sanctuary", "leech"], ["Last Refuge", "life"]]]],
  shadowmancer: [["Umbra", "#a070ff", [["Dark Lens", "dmgp"], ["Occlusion", "crit"], ["Night Theft", "leech"], ["Unchosen Life", "dmgp"]]],
                 ["Snare", "#6db8c0", [["Mirror Step", "speed"], ["Glass Trap", "crit"], ["Reflected Wound", "edge"], ["Hall of Mirrors", "crit"]]],
                 ["Veil", "#9fb6ff", [["Shroud", "armor"], ["Fading", "regen"], ["Hollow Body", "life"], ["The Other Self", "life"]]]],
  primalist: [["Fang", "#e0703a", [["Claws", "dmgp"], ["Savage", "crit"], ["Gorge", "leech"], ["Apex", "dmgp"]]],
              ["Root", "#7fc46a", [["Bark", "armor"], ["Sap", "regen"], ["Old Growth", "life"], ["Heartwood", "regen"]]],
              ["Pack", "#c49c63", [["Lope", "speed"], ["Pulse", "edge"], ["Thick Hide", "life"], ["Alpha's Roar", "speed"]]]],
  gloamstalker: [["Marksman", "#e6cf8a", [["Steady Aim", "dmgp"], ["Eagle Eye", "crit"], ["Barbed Heads", "dmgp"], ["Heartseeker", "crit"]]],
                 ["Hunter", "#7fc46a", [["Fleet", "speed"], ["Focus", "edge"], ["Field Dress", "leech"], ["Gloam Stride", "speed"]]],
                 ["Survivor", "#c49c63", [["Leather Coat", "armor"], ["Bandages", "regen"], ["Hard Lessons", "life"], ["Last Arrow", "life"]]]],
};
// the whole tree as flat nodes: id "b-t" → { branch, tier, name, stat, max, per }
export function treeOf(cls) {
  const T = TREES[cls] ?? TREES.bladewraith;
  return T.map(([name, color, nodes], b) => ({ name, color, nodes: nodes.map(([n, stat], t) => ({ id: `${b}-${t}`, b, t, name: n, stat, max: t === 3 ? 1 : 3, per: PER[stat] * (t === 3 ? 4 : 1) })) }));
}
export const pointsOf = (level) => Math.max(0, (level ?? 1) - 1);
export const spentIn = (tal, b) => Object.entries(tal ?? {}).reduce((a, [k, v]) => a + (k.startsWith(b + "-") ? v : 0), 0);
export const spent = (tal) => Object.values(tal ?? {}).reduce((a, v) => a + v, 0);
export const canLearn = (cls, tal, level, id) => {
  const n = treeOf(cls).flatMap((br) => br.nodes).find((x) => x.id === id); if (!n) return false;
  return spent(tal) < pointsOf(level) && (tal?.[id] ?? 0) < n.max && spentIn(tal, n.b) >= n.t * 3;
};
// talents → stats, added on top of gear
export function talentStats(cls, tal) {
  const o = {}; for (const br of treeOf(cls)) for (const n of br.nodes) { const r = tal?.[n.id] ?? 0; if (r) o[n.stat] = (o[n.stat] ?? 0) + r * n.per; }
  return o;
}
