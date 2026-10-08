// The vendor panel, drawn by scripts/ui.js while player.state.shop is set. Buttons send the 'shop' action;
// scripts/lib/shop.js judges every trade in the buyer's own body.
import E from "./data/economy.yml";
import { coinHTML } from "./coins.js";
import { owned } from "./shop.js";
const NAMES = { oswin: "OSWIN'S CART" };
const CSS = `<style>
#vfshop{position:absolute;top:90px;left:max(340px,calc(50% - 340px));width:min(340px,calc(100vw - 2*(var(--spawn-chrome-reservation-right-inset,50px) + 24px)));pointer-events:auto;animation:vfin .25s;padding:22px 24px!important}
#vfshop{max-height:calc(100vh - 110px);overflow:auto}
@media (pointer:coarse),(max-width:900px){#vfshop{left:50%;transform:translateX(-50%)}}
@media (max-height:520px){#vfshop{top:8px;max-height:calc(100vh - 16px);padding:12px 14px!important}}
#vfshop .row{display:flex;align-items:center;gap:8px;padding:7px 0;border-top:1px solid #3a3129}
#vfshop .gl{width:40px;height:40px;overflow:hidden;flex:none;background:#171412;box-shadow:0 0 0 2px #0d0b0a,0 0 0 3px #5a4a33;display:flex;align-items:center;justify-content:center;font-size:18px}
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
const ICON = { tonic: "/cdn/value.f4e985f51d72e39ecd4691f462076ba4a14206d864edb85895ea8ef710ceccfc.png", charm: "/cdn/value.f06a12814e99575b5412186fae3095d80fef99e78b74aa9e35050e9417d92853.png", shard: "/cdn/value.b61d6232f818e3ce94f53058d85acb546d01787e2328cce06c5c67b3aab45c2d.png" };
const FACE = { oswin: "/cdn/value.90e281c6498bfb21ffee4d1f51afea300d3d58b948c66aaff56355f765ca2e17.png" };
const pic = (id) => ICON[id] ? `<img src="${ICON[id]}" style="width:100%;height:100%;object-fit:cover">` : (GLYPH[id] ?? "");
const act = (a, item) => `sendAction('shop',{a:'${a}',item:'${item}',n:Date.now()})`;
export function shopPanel(ctx, player) {
  const s = player.state ?? {}, stock = E.shops[s.shop] ?? [], purse = s.copper ?? 0;
  const rows = stock.map((it) => {
    const have = owned(s, it), poor = purse < it.price, off = have || poor;
    const label = have ? (it.once ? "OWNED" : "FULL") : "BUY";
    const count = it.id === "tonic" ? ` <span style="color:#b9a77f;font-size:11px">${s.tonics ?? 0}/${it.cap}</span>` : "";
    return `<div class="row"><div class="gl">${ICON[it.id] ? pic(it.id) : GLYPH[it.id] ?? it.glyph}</div>
      <div style="flex:1;min-width:0"><div class="nm">${it.name}${count}</div><div class="ef">${it.effect}</div><div class="pr">${coinHTML(it.price, 12)}</div></div>
      <div class="bt ${off ? "off" : ""}" ${off ? "" : `onclick="${act("buy", it.id)}"`}>${label}</div></div>`;
  }).join("");
  const n = s.shards ?? 0;
  const sell = `<div class="row"><div class="gl">${pic("shard")}</div>
    <div style="flex:1;min-width:0"><div class="nm">Wax Shard × ${n}</div><div class="ef">Oswin pays ${E.sell.shard}c each. Petitions aren't for sale.</div><div class="pr">${n ? coinHTML(n * E.sell.shard, 12) : "&nbsp;"}</div></div>
    <div class="bt ${n ? "" : "off"}" ${n ? `onclick="${act("sell", "shard")}"` : ""}>SELL</div></div>`;
  const hw = s.heartwax ?? 0;
  const sellHw = hw ? `<div class="row"><div class="gl"><span style="color:#b48cff;font-size:22px">✦</span></div>
    <div style="flex:1;min-width:0"><div class="nm" style="color:#c9a8ff">Heartwax × ${hw}</div><div class="ef">A boss's last tallow. Oswin pays dear, one at a time. Or brew it at the cauldron.</div><div class="pr">${coinHTML(E.sell.heartwax, 12)}</div></div>
    <div class="bt" onclick="${act("sell", "heartwax")}">SELL 1</div></div>` : "";
  return `${CSS}<div id="vfshop" class="plate">
    <div class="x" onclick="${act("close", "")}">${GLYPH.x}</div>
    <div style="display:flex;gap:12px;align-items:center">${FACE[s.shop] ? `<div style="flex:none;width:64px;height:64px;background:url(${FACE[s.shop]}) center/cover;box-shadow:0 0 0 2px #0d0b0a,0 0 0 3px #8a6f45,0 0 0 5px #0d0b0a,0 0 16px rgba(240,154,58,.25)"></div>` : ""}
    <div><div class="lbl">Wayside Fire · peddler</div>
    <div style="font-size:20px;color:var(--wax);letter-spacing:.06em">${NAMES[s.shop] ?? "CART"}</div></div></div><div class="dv d3"></div>
    ${s.dialog && (ctx.now() - s.dialog.at) < 9000 ? `<div style="font-size:13px;font-style:italic;color:#d9c9a6;line-height:1.3;margin:2px 0 6px">${s.dialog.text.replace(/^Oswin:\s*/, "")}</div>` : ""}
    <div style="font-size:14px;margin:4px 0 6px;display:flex;align-items:center;gap:6px"><span class="lbl">Purse</span>${coinHTML(purse, 14)}</div>
    ${rows}<div class="lbl" style="margin-top:6px">Buyback</div><div class="dv d2"></div>${sellHw}${sell}</div>`;
}
