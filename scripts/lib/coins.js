// Money is one integer, player.state.copper. 100 copper = 1 silver, 100 silver = 1 gold.
export const ICON = {
  g: "/cdn/value.98cc004ee5f31070ed1643a101c24f648115274a8477d6f26e95e65039d9ca5e.png",
  s: "/cdn/value.c4729bcb2c16d855ad8d3bfbc5372b2c56972a940433fba646eee62c93bef3a6.png",
  c: "/cdn/value.c59d2aba6496e9d3cff249a6d56b4c30e9f2ecd6082a0fac638f43df3e078a55.png",
};
export function split(copper) {
  const n = Math.max(0, Math.floor(copper ?? 0));
  return { g: Math.floor(n / 10000), s: Math.floor(n / 100) % 100, c: n % 100 };
}
// "1g 20s 5c": short text for damage numbers and chat
export function fmt(copper) {
  const { g, s, c } = split(copper);
  return [g ? `${g}g` : "", s ? `${s}s` : "", c || (!g && !s) ? `${c}c` : ""].filter(Boolean).join(" ");
}
// the purse as HTML: each denomination its number and its coin, gold first; zero denominations above the first drop
export function coinHTML(copper, px = 16) {
  const p = split(copper), out = [];
  for (const k of ["g", "s", "c"]) {
    if (!p[k] && !(k === "c" && !out.length) && !out.length) continue;
    out.push(`<span style="display:inline-flex;align-items:center;gap:2px;margin-right:6px;white-space:nowrap">${p[k]}<img src="${ICON[k]}" style="width:${px}px;height:${px}px;object-fit:contain;filter:drop-shadow(1px 1px 0 #0d0b0a)"></span>`);
  }
  return out.join("");
}
