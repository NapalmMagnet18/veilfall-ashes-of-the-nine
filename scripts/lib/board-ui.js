// The Pilgrims' Board panel: shown at the board beside the pack. Notices to buy, your own to take down,
// copper to collect, and the selected pack item's price buttons.
import { TIER, icon, cardHTML } from "./loot.js";
import { coinHTML } from "./coins.js";
import { asks, TRADE } from "./trade.js";
export function boardPanel(ctx, player, { rail, touch }) {
  const s = player.state ?? {}, b = s.board, gear = s.gear ?? {};
  const sel = s.invSel ? (s.inv ?? []).find((x) => x.u === s.invSel) : null;
  const act = (a, extra = "") => `sendAction('trade',{a:'${a}'${extra},n:Date.now()+Math.random()})`;
  const rows = (b?.rows ?? []).map((r) => {
    const HW = r.item.hw, T = HW ? { color: "#b48cff" } : TIER[r.item.t] ?? TIER.ashen, poor = !r.mine && (s.copper ?? 0) < r.price;
    return `<div class="bn" style="display:flex;gap:8px;align-items:center;padding:5px 6px;border-bottom:1px solid #2a231c;position:relative">
      <div class="gs" style="width:40px;height:40px;flex:none;box-shadow:inset 0 0 0 1px ${T.color}aa,inset 0 0 12px #000">${HW ? `<span style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#b48cff;font-size:22px;text-shadow:0 0 8px #b48cff">✦</span>` : `<img src="${icon(r.item.b)}" style="inset:3px;width:34px;height:34px">${touch ? "" : `<div class="tip" style="left:46px;right:auto">${cardHTML(r.item, gear)}</div>`}`}</div>
      <div style="flex:1;min-width:0"><div style="color:${T.color};font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${r.item.n}</div><div style="font-size:10px;color:#8a806e">${r.mine ? "your notice" : r.seller} · ${HW ? "a boss's tallow · brews the Ninefold" : `ilvl ${r.item.il}`}</div></div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:3px"><span style="display:flex;white-space:nowrap">${coinHTML(r.price, 11)}</span>
        ${r.mine ? `<button class="vb" style="padding:3px 7px;font-size:9px" onclick="${act("unlist", `,id:${r.id}`)}">TAKE DOWN</button>` : `<button class="vb" style="padding:3px 7px;font-size:9px;${poor ? "opacity:.45" : "box-shadow:0 0 0 1px #0d0b0a,0 0 0 2px #c49c63"}" onclick="${act("buy", `,id:${r.id}`)}">BUY</button>`}</div>
    </div>`;
  }).join("");
  const pin = sel ? `<div style="margin-top:10px;padding-top:8px;border-top:1px solid #c49c6344">
      <div style="font-size:10px;letter-spacing:.18em;color:#c49c63;margin-bottom:5px">PIN <span style="color:${TIER[sel.t]?.color}">${sel.n}</span></div>
      <div style="display:flex;gap:5px">${asks(sel).map((p, k) => `<button class="vb" style="flex:1;padding:5px 4px" onclick="${act("list", `,u:'${sel.u}',k:${k}`)}"><span style="display:flex;justify-content:center;white-space:nowrap">${coinHTML(p, 11)}</span></button>`).join("")}</div>
    </div>` : `<div style="margin-top:10px;padding-top:8px;border-top:1px solid #c49c6344;font-size:11px;color:#8a806e">select an item in your pack to pin it here</div>`;
  const hwPin = (s.heartwax ?? 0) > 0 ? `<div style="margin-top:10px;padding-top:8px;border-top:1px solid #b48cff44">
      <div style="font-size:10px;letter-spacing:.18em;color:#b48cff;margin-bottom:5px">PIN ✦ HEARTWAX <span style="color:#9a907e">· you hold ${s.heartwax}</span></div>
      <div style="display:flex;gap:5px">${TRADE.hwAsks.map((p, k) => `<button class="vb" style="flex:1;padding:5px 4px;border-color:#b48cff88" onclick="${act("list", `,hw:true,k:${k}`)}"><span style="display:flex;justify-content:center;white-space:nowrap">${coinHTML(p, 11)}</span></button>`).join("")}</div>
    </div>` : "";
  return `<div class="absolute plate vfpk" style="left:${rail};top:50%;transform:translateY(-50%);width:330px;max-width:calc(100vw - 2*${rail});max-height:calc(100vh - 16px);overflow:auto;pointer-events:auto;animation:vfin .25s;padding:14px 16px">
    <div class="lbl" style="display:flex;justify-content:space-between;align-items:center">The Pilgrims' Board<span style="font-size:10px;color:#9a907e">${b ? `${b.rows.length} notices` : "reading…"}</span></div><div class="dv d5"></div>
    <div style="font-size:11px;color:#9a907e;font-style:italic;margin:6px 0 8px">Wares left by Bearers of this realm. The keeper takes a tenth of every sale.</div>
    ${b?.owed ? `<button class="vb" style="width:100%;margin-bottom:8px;padding:8px;box-shadow:0 0 0 1px #0d0b0a,0 0 0 2px #f2d38a;color:#f2d38a" onclick="${act("collect")}">COLLECT · ${b.sold} SOLD · ${coinHTML(b.owed, 12)}</button>` : ""}
    <div style="max-height:46vh;overflow:auto">${rows || `<div style="font-size:12px;color:#7d7466;padding:14px 0;text-align:center">The board is bare. Pin something.</div>`}</div>
    ${pin}${hwPin}
    ${s.tradeBusy ? `<div style="font-size:10px;color:#c49c63;margin-top:6px;letter-spacing:.15em">THE KEEPER WRITES…</div>` : ""}
  </div>`;
}
