// The Bearer's pack: paper doll left, 24-slot grid right, item cards on hover, a pinned card with its verbs below.
import { SLOTS, TIER, icon, cardHTML, mitigation, sellValue, BAG, forgeCost, forgeCan } from "./loot.js";
import { coinHTML } from "./coins.js";

const SLOT_POS = { helm: [70, 0], amulet: [134, 14], weapon: [6, 70], chest: [70, 66], gloves: [6, 140], ring: [134, 84], boots: [70, 140] };
const SLOT_ICON = { weapon: "blade", helm: "helm", chest: "chest", gloves: "gloves", boots: "boots", ring: "ring", amulet: "amulet" };
export const PACK_CSS = `
.vfpk{font-family:inherit;color:#e9dfc8}
.vfpk .gs{position:relative;width:56px;height:56px;background:radial-gradient(#1d1916,#0b0908);box-shadow:inset 0 0 0 1px #3b3126,inset 0 0 14px #000;cursor:pointer}
.vfpk .gs img{position:absolute;inset:4px;width:48px;height:48px;object-fit:contain;filter:drop-shadow(0 2px 2px #000)}
.vfpk .gs.ghost img{opacity:.13;filter:grayscale(1)}
.vfpk .gs:hover{box-shadow:inset 0 0 0 1px #c49c63,inset 0 0 18px #000,0 0 8px #c49c6355}
.vfpk .gs.sel{box-shadow:inset 0 0 0 2px #f2d38a,0 0 12px #f2d38a66}
.vfpk .gs .tip{display:none;position:absolute;right:62px;top:-8px;z-index:30;pointer-events:none}
.vfpk .gs:hover .tip{display:block}
.vfcard{width:250px;padding:10px 12px;background:linear-gradient(#15110ef5,#0b0908f8);border:1px solid;box-shadow:0 0 0 1px #000,0 8px 24px #000;font-size:13px;line-height:1.45;text-align:left}
.vfpk .vb{pointer-events:auto;cursor:pointer;padding:6px 10px;font-family:inherit;font-size:11px;letter-spacing:.14em;color:#e9dfc8;background:linear-gradient(#2c2825,#171412);border:0;box-shadow:0 0 0 1px #0d0b0a,0 0 0 2px #5a4a33}
.vfpk .vb:hover{box-shadow:0 0 0 1px #0d0b0a,0 0 0 2px #c49c63;color:#fff3d6}
.vfpk .st{display:flex;justify-content:space-between;font-size:12px;color:#b9ae98;border-bottom:1px solid #2a231c;padding:2px 0}
.vfpk .st b{color:#f2d38a;font-weight:normal}
`;
const frame = (it) => it ? `box-shadow:inset 0 0 0 1px ${TIER[it.t].color}aa,inset 0 0 16px ${TIER[it.t].color}33,inset 0 0 14px #000` : "";

export function packPanel(ctx, player, { rail, touch }) {
  const s = player.state ?? {}, gear = s.gear ?? {}, inv = s.inv ?? [], g = s.gs ?? {};
  const sel = s.invSel ? inv.find((x) => x.u === s.invSel) : null;
  const act = (a, extra = "") => `sendAction('item',{a:'${a}'${extra},n:Date.now()+Math.random()})`;
  const doll = SLOTS.map((sl) => {
    const it = gear[sl], [x, y] = SLOT_POS[sl];
    return `<div class="gs ${it ? "" : "ghost"}" style="position:absolute;left:${x}px;top:${y}px;${frame(it)}" ${it ? `onclick="${act("unequip", `,slot:'${sl}'`)}"` : ""} title="">
      <img src="${it ? icon(it.b) : icon(SLOT_ICON[sl])}">${it ? `<div class="tip">${cardHTML(it, gear)}<div style="font-size:11px;color:#9a907e;margin-top:3px">click to take off</div></div>` : ""}</div>`;
  }).join("");
  const cells = Array.from({ length: BAG }, (_, i) => {
    const it = inv[i];
    if (!it) return `<div class="gs" style="cursor:default"></div>`;
    return `<div class="gs ${sel?.u === it.u ? "sel" : ""}" style="${frame(it)}" onclick="${act("sel", `,u:'${it.u}'`)}" ondblclick="${act("equip", `,u:'${it.u}'`)}"><img src="${icon(it.b)}">${touch ? "" : `<div class="tip">${cardHTML(it, gear)}</div>`}</div>`;
  }).join("");
  const worn = sel ? gear[(Object.entries(SLOT_ICON).find(([, b]) => b === sel.b) ?? [])[0] ?? (sel.b === "great" ? "weapon" : "")] : null;
  return `<div class="absolute plate pk vfpk" style="right:${rail};top:50%;transform:translateY(-50%);width:600px;max-width:calc(100vw - 2*${rail});max-height:calc(100vh - 16px);overflow:auto;pointer-events:auto;animation:vfin .25s;padding:14px 16px">
    <div class="lbl" style="display:flex;justify-content:space-between;align-items:center">${s.charName ?? "Bearer"} · Pack <span style="font-size:11px;color:#9a907e">${inv.length}/${BAG}</span><span style="cursor:pointer;color:#f2d38a;font-size:12px" onclick="sendAction('bag')">${touch ? "CLOSE" : "I · CLOSE"}</span></div><div class="dv d5"></div>
    <div style="display:flex;gap:16px;margin-top:10px">
      <div style="width:196px;flex:none">
        <div style="position:relative;width:196px;height:200px;background:radial-gradient(ellipse at 50% 45%,#2a1d1455,transparent 70%)">${doll}</div>
        <div style="margin-top:8px">
          <div class="st">Damage<b>${Math.round((14 + (g.dmg ?? 0)) * (1 + (g.dmgp ?? 0) / 100))}</b></div>
          <div class="st">Critical strike<b>${12 + (g.crit ?? 0)}%</b></div>
          <div class="st">Life<b>${s.maxHp ?? 100}</b></div>
          <div class="st">Armor<b>${g.armor ?? 0} · ${Math.round(mitigation(g.armor ?? 0) * 100)}%</b></div>
          <div class="st">Move speed<b>+${Math.min(40, g.speed ?? 0)}%</b></div>
          ${g.leech ? `<div class="st">Life leech<b>${g.leech}%</b></div>` : ""}${g.gold ? `<div class="st">Copper find<b>+${g.gold}%</b></div>` : ""}${g.regen ? `<div class="st">Regen<b>${g.regen} / 5s</b></div>` : ""}
        </div>
      </div>
      <div style="flex:1">
        <div style="display:grid;grid-template-columns:repeat(6,56px);gap:4px">${cells}</div>
        <div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap">
          <button class="vb" onclick="${act("sort")}">SORT</button>
          <button class="vb" onclick="${act("salvageAll")}">SALVAGE ASHEN</button>
          <button class="vb" onclick="${act("salvageAll", ",blue:true")}">+ HALLOWED</button>
        </div>
        <div style="display:flex;gap:14px;align-items:center;margin-top:10px;font-size:13px">
          <span style="display:flex;align-items:center;gap:4px"><img src="${icon("dust")}" style="width:22px;height:22px">${s.dust ?? 0} ash dust</span>
          <span>♥ ${s.tonics ?? 0}</span><span>◆ ${s.shards ?? 0}</span><span>✉ ${s.petitions?.length ?? 0}</span>
          <span style="display:flex;align-items:center">${coinHTML(s.copper ?? 0, 13)}</span>
        </div>
      </div>
    </div>
    ${sel ? `<div style="display:flex;gap:12px;margin-top:12px;align-items:flex-start">
      ${cardHTML(sel, gear)}
      <div style="display:flex;flex-direction:column;gap:6px">
        <button class="vb" onclick="${act("equip", `,u:'${sel.u}'`)}">EQUIP</button>
        <button class="vb" onclick="${act("salvage", `,u:'${sel.u}'`)}">SALVAGE</button>
        ${s.shop ? `<button class="vb" onclick="${act("sell", `,u:'${sel.u}'`)}">SELL · ${sellValue(sel)}c</button>` : ""}
        <button class="vb" onclick="${act("sel")}">CANCEL</button>
      </div>

      ${worn ? `<div style="opacity:.8"><div style="font-size:10px;letter-spacing:.2em;color:#9a907e;margin-bottom:3px">WORN</div>${cardHTML(worn, gear)}</div>` : ""}
    </div>${s.atForge ? `<div style="display:flex;gap:6px;align-items:center;margin-top:8px;padding-top:8px;border-top:1px solid #e0a86633">
        <div style="font-size:10px;letter-spacing:.2em;color:#e0a866;width:74px;line-height:1.3">WAYSIDE FORGE</div>
        ${[["temper", "TEMPER", "+1 item level"], ["reforge", "REFORGE", "new affixes"], ["ascend", "ASCEND", "one tier up"]].map(([op, label, hint]) => { const no = forgeCan(sel, op), c = no ? null : forgeCost(sel, op), poor = c != null && (s.dust ?? 0) < c;
          return `<button class="vb" ${no ? "disabled" : ""} style="flex:1;${no ? "opacity:.35;" : poor ? "opacity:.6;" : "border-color:#e0a866aa;"}" title="${no ?? hint}" onclick="${act("forge", `,u:'${sel.u}',op:'${op}'`)}">${label}${no ? "" : ` · <img src="${icon("dust")}" style="width:13px;height:13px;vertical-align:-2px">${c}`}<div style="font-size:9px;letter-spacing:.1em;color:#9a907e">${no ?? hint}</div></button>`; }).join("")}
      </div>` : ""}` : `<div style="font-size:11px;color:#7d7466;margin-top:10px">${touch ? "tap an item to inspect" : "hover to read · click to inspect · double-click to equip"}</div>`}
    <button class="vb" style="margin-top:12px;width:100%" onclick="sendAction('menu',{a:'logout',n:Date.now()})">REST · CHARACTER SELECT</button>
  </div>`;
}
