// WAX-RENDERING: rank, the brew a rank makes, and its live stats
import B from "./data/brews.yml";
export const BREW = B;
export function renderRank(xp = 0) {
  let i = 0; for (let k = 0; k < B.ranks.length; k++) if (xp >= B.ranks[k].xp) i = k;
  const N = B.ranks[i + 1]; return { i, name: B.ranks[i].name, from: B.ranks[i].xp, next: N ? N.xp : null };
}
export function brewMade(id, xp) {
  const D = B.brews[id]; if (!D) return null;
  const k = 1 + B.per * renderRank(xp).i, stats = {};
  for (const [s, v] of Object.entries(D.stats)) stats[s] = Math.round(v * k);
  return { id, stats, secs: Math.round(D.secs * k) };
}
export function brewLine(id, stats) { return B.brews[id].line.replace(/\{(\w+)\}/g, (_, s) => stats[s] ?? 0); }
export function brewActive(s, now) { return s?.brew && s.brew.until > now ? s.brew : null; }
