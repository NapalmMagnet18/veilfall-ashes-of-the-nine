// The vendor panel, drawn by scripts/ui.js while player.state.shop is set. Buttons send the 'shop' action;
// scripts/lib/shop.js judges every trade in the buyer's own body.
import E from "./data/economy.yml";
import { coinHTML } from "./coins.js";
import { owned } from "./shop.js";
const NAMES = { oswin: "OSWIN'S CART" };
const CSS = `<style>
#vfshop{position:absolute;top:90px;left:max(340px,calc(50% - 340px));width:min(340px,calc(100vw - 2*(var(--spawn-chrome-reservation-right-inset,50px) + 24px)));pointer-events:auto;animation:vfin .25s;padding:10px 12px!important}
@media (pointer:coarse),(max-width:900px){#vfshop{left:50%;transform:translateX(-50%)}}
#vfshop .row{display:flex;align-items:center;gap:8px;padding:7px 0;border-top:1px solid #3a3129}
#vfshop .gl{width:34px;height:34px;flex:none;background:#171412;box-shadow:0 0 0 2px #0d0b0a,0 0 0 3px #5a4a33;display:flex;align-items:center;justify-content:center;font-size:18px}
#vfshop .nm{font-size:14px;color:var(--wax);line-height:1.1}
#vfshop .ef{font-size:11px;color:#b9a77f;line-height:1.2}
#vfshop .pr{font-size:12px;margin-top:2px}
#vfshop .bt{flex:none;min-width:52px;padding:6px 8px;text-align:center;font-size:13px;background:linear-gradient(#6b4a22,#3d2a14);color:#f2d38a;box-shadow:0 0 0 2px #0d0b0a,0 0 0 3px #a07a3e,2px 3px 0 2px rgba(0,0,0,.5);cursor:pointer}
#vfshop .bt.off{background:#24201c;color:#6b6152;box-shadow:0 0 0 2px #0d0b0a,0 0 0 3px #3a3129;cursor:default}
#vfshop .x{position:absolute;right:8px;top:6px;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:16px;cursor:pointer;background:#171412;box-shadow:0 0 0 2px #0d0b0a,0 0 0 3px #5a4a33}
</style>`;
// the pixel face lacks ✦ ◆ ✕: these are drawn
const SVG = (d, c) => `<svg viewBox="0 0 16 16" width="18" height="18" style="filter:drop-shadow(1px 1px 0 #0d0b0a)"><path d="${d}" fill="${c}"/></svg>`;
const GLYPH = { tonic: `<span style="color:#e0473a">♥</span>`, charm: SVG("M8 1C10 5 12 7 12 10a4 4 0 0 1-8 0C4 7 6 5 8 1z", "#f2b04a"), shard: SVG("M8 1l5 7-5 7-5-7z", "#9fc4ff"), x: SVG("M3 1l5 5 5-5 2 2-5 5 5 5-2 2-5-5-5 5-2-2 5-5-5-5z", "#e9dfc8") };
const act = (a, item) => `sendAction('shop',{a:'${a}',item:'${item}',n:Date.now()})`;
export function shopPanel(ctx, player) {
  const s = player.state ?? {}, stock = E.shops[s.shop] ?? [], purse = s.copper ?? 0;
  const rows = stock.map((it) => {
    const have = owned(s, it), poor = purse < it.price, off = have || poor;
    const label = have ? (it.once ? "OWNED" : "FULL") : "BUY";
    const count = it.id === "tonic" ? ` <span style="color:#b9a77f;font-size:11px">${s.tonics ?? 0}/${it.cap}</span>` : "";
    return `<div class="row"><div class="gl">${GLYPH[it.id] ?? it.glyph}</div>
      <div style="flex:1;min-width:0"><div class="nm">${it.name}${count}</div><div class="ef">${it.effect}</div><div class="pr">${coinHTML(it.price, 12)}</div></div>
      <div class="bt ${off ? "off" : ""}" ${off ? "" : `onclick="${act("buy", it.id)}"`}>${label}</div></div>`;
  }).join("");
  const n = s.shards ?? 0;
  const sell = `<div class="row"><div class="gl">${GLYPH.shard}</div>
    <div style="flex:1;min-width:0"><div class="nm">Wax Shard × ${n}</div><div class="ef">Oswin pays ${E.sell.shard}c each. Petitions aren't for sale.</div><div class="pr">${n ? coinHTML(n * E.sell.shard, 12) : "&nbsp;"}</div></div>
    <div class="bt ${n ? "" : "off"}" ${n ? `onclick="${act("sell", "shard")}"` : ""}>SELL</div></div>`;
  return `${CSS}<div id="vfshop" class="plate">
    <div class="x" onclick="${act("close", "")}">${GLYPH.x}</div>
    <div class="lbl">Wayside Fire · peddler</div>
    <div style="font-size:20px;color:var(--wax);letter-spacing:.06em">${NAMES[s.shop] ?? "CART"}</div>
    <div style="font-size:14px;margin:4px 0 6px;display:flex;align-items:center;gap:6px"><span class="lbl">Purse</span>${coinHTML(purse, 14)}</div>
    ${rows}<div class="lbl" style="margin-top:6px">Buyback</div>${sell}</div>`;
}
