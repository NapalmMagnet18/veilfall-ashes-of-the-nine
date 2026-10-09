// The Bearer's pack: paper doll left, 24-slot grid right, item cards on hover, a pinned card with its verbs below.
import { BREW, renderRank, brewMade, brewActive, brewLine } from "./brews.js";
import { SLOTS, TIER, icon, cardHTML, mitigation, sellValue, BAG, forgeCost, forgeCan, freeReforges, smithRank, craftCost } from "./loot.js";
import { coinHTML } from "./coins.js";
import CB from "./data/combat.yml";

const SLOT_POS = { helm: [70, 0], amulet: [134, 14], weapon: [6, 70], chest: [70, 66], gloves: [6, 140], ring: [134, 84], boots: [70, 140] };
const SLOT_ICON = { weapon: "blade", helm: "helm", chest: "chest", gloves: "gloves", boots: "boots", ring: "ring", amulet: "amulet" };
export const PACK_CSS = `
.vfpk{font-family:inherit;color:#e9dfc8}
.vfpk .gs{position:relative;width:56px;height:56px;background:radial-gradient(#1d1916,#0b0908);box-shadow:inset 0 0 0 1px #3b3126,inset 0 0 14px #000;cursor:pointer}
.vfpk .gs img{position:absolute;inset:4px;width:48px;height:48px;object-fit:contain;filter:drop-shadow(0 2px 2px #000)}
.vfpk .vfvault .gs{width:42px;height:42px}.vfpk .vfvault .gs img{inset:3px;width:36px;height:36px}
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
  const worn = sel ? gear[(Object.entries(SLOT_ICON).find(([, b]) => b === sel.b) ?? [])[0] ?? (["great", "axe", "staff", "bow"].includes(sel.b) ? "weapon" : "")] : null;
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
          <span>♥ ${s.tonics ?? 0}</span><span>◆ ${s.shards ?? 0}</span>${s.heartwax ? `<span style="color:#b48cff" title="Heartwax: a boss's last tallow">✦ ${s.heartwax}</span>` : ""}${s.abbesswax ? `<span style="color:#9fe8e0" title="The Abbess's Candle: only the Ossuary gives it">✟ ${s.abbesswax}</span>` : ""}<span>✉ ${s.petitions?.length ?? 0}</span>
          <span style="display:flex;align-items:center">${coinHTML(s.copper ?? 0, 13)}</span>
        </div>
        ${s.atGuildVault ? (() => { const G = s.gvault, VS = CB.guildVault.slots;
          if (!G || G.none) return `<div style="margin-top:10px;padding-top:8px;border-top:1px solid #6db8c055;font-size:11px;color:#9a907e">⚑ GUILD CHEST · ${G ? "you carry no guild's mark. join or found a guild on Spawn and it opens to you." : "unsealing…"}</div>`;
          const rows = G.rows ?? [];
          const vc = Array.from({ length: VS }, (_, i) => { const r = rows[i];
            return r ? `<div class="gs" style="${frame(r.item)}" onclick="sendAction('gvault',{a:'take',id:${r.id},n:Date.now()+Math.random()})"><img src="${icon(r.item.b)}">${touch ? "" : `<div class="tip">${cardHTML(r.item, gear)}<div style="font-size:11px;color:#9a907e;margin-top:3px">left by ${r.by} · click to take</div></div>`}</div>` : `<div class="gs" style="cursor:default;opacity:.55"></div>`; }).join("");
          return `<div style="margin-top:10px;padding-top:8px;border-top:1px solid #6db8c055">
          <div style="display:flex;justify-content:space-between;align-items:center;font-size:10px;letter-spacing:.18em;color:#9fe3ea">⚑ GUILD CHEST · ${String(G.name ?? "").toUpperCase()}<span style="color:#9a907e">${rows.length}/${VS}</span></div>
          ${sel ? `<button class="vb" style="width:100%;margin:6px 0;border-color:#6db8c0aa" onclick="sendAction('gvault',{a:'store',u:'${sel.u}',n:Date.now()+Math.random()})">PUT IN THE GUILD CHEST</button>` : `<div style="font-size:10px;color:#9a907e;margin:4px 0 6px">pick an item in your pack to share it · click one here to take it</div>`}
          <div style="display:grid;grid-template-columns:repeat(9,42px);gap:3px" class="vfvault">${vc}</div></div>`; })() : ""}
        ${s.atVault ? (() => { const vault = s.vault ?? [], V = CB.vault, VS = V.slots + (s.vaultRows ?? 0) * V.row, nextRow = V.rows[s.vaultRows ?? 0];
          const vc = Array.from({ length: VS }, (_, i) => { const it = vault[i];
            return it ? `<div class="gs" style="${frame(it)}" onclick="${act("take", `,u:'${it.u}'`)}"><img src="${icon(it.b)}">${touch ? "" : `<div class="tip">${cardHTML(it, gear)}<div style="font-size:11px;color:#9a907e;margin-top:3px">click to take</div></div>`}</div>` : `<div class="gs" style="cursor:default;opacity:.55"></div>`; }).join("");
          return `<div style="margin-top:10px;padding-top:8px;border-top:1px solid #c49c6355">
          <div style="display:flex;justify-content:space-between;align-items:center;font-size:10px;letter-spacing:.18em;color:#d9b77a">⚿ CANDLEHOLD VAULT · DAME MAUDRY QUILL<span style="color:#9a907e">${vault.length}/${VS}</span></div>
          <div style="font-size:10px;color:#9a907e;margin:4px 0 6px">${sel ? "" : "pick an item in your pack to store it · click a vault item to take it"}</div>
          ${sel ? `<button class="vb" style="width:100%;margin-bottom:6px;border-color:#c49c63aa" onclick="${act("store", `,u:'${sel.u}'`)}">STORE IN THE VAULT</button>` : ""}
          <div style="display:grid;grid-template-columns:repeat(9,42px);gap:3px" class="vfvault">${vc}</div>
          ${nextRow != null ? `<button class="vb" style="width:100%;margin-top:6px;${(s.copper ?? 0) < nextRow ? "opacity:.45;" : "border-color:#c49c63aa;"}display:flex;justify-content:center;align-items:center;gap:6px" onclick="${act("shelf")}">RENT ANOTHER SHELF (+9) · ${coinHTML(nextRow, 12)}</button>` : `<div style="font-size:10px;color:#9a907e;margin-top:5px;text-align:center">every shelf in the vault is yours</div>`}</div>`; })() : ""}
        ${s.atCauldron ? (() => { const rk = renderRank(s.renderXp ?? 0), pct = rk.next ? Math.round(100 * ((s.renderXp ?? 0) - rk.from) / (rk.next - rk.from)) : 100, on = brewActive(s, ctx.now());
          return `<div style="margin-top:10px;padding-top:8px;border-top:1px solid #e0a86633">
          <div style="display:flex;align-items:center;gap:8px;font-size:10px;letter-spacing:.18em;color:#d9b77a">♨ WAX-RENDERING · RANK ${rk.i + 1} · ${rk.name.toUpperCase()}
            <div style="flex:1;height:5px;background:#1a1612;border:1px solid #d9b77a44"><div style="width:${pct}%;height:100%;background:linear-gradient(90deg,#6b4a2a,#e7d9b8)"></div></div>
            <span style="color:#9a907e">${rk.next ? `${s.renderXp ?? 0}/${rk.next}` : "MASTER"}</span></div>
          <div style="font-size:10px;color:#9a907e;margin:4px 0 6px">${on ? `in your blood: <span style="color:${BREW.brews[on.id].color}">${BREW.brews[on.id].name}</span>, ${Math.ceil((on.until - ctx.now()) / 1000)}s left · a new brew replaces it` : "one brew at a time · it fades on its own"}</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">${Object.entries(BREW.brews).map(([id, D]) => { const b = brewMade(id, s.renderXp ?? 0), poor = (s.dust ?? 0) < D.dust || (s.shards ?? 0) < D.shards || (s.heartwax ?? 0) < (D.heartwax ?? 0) || (s.abbesswax ?? 0) < (D.abbesswax ?? 0);
            return `<button class="vb" ${poor ? "disabled" : ""} title="${D.lore}" style="flex:1;text-align:left;padding:5px 7px;${poor ? "opacity:.4;" : `border-color:${D.color}aa;`}" onclick="${act("brew", `,id:'${id}'`)}"><div style="color:${D.color};font-size:12px;display:flex;align-items:center;gap:5px">${D.icon ? `<img src="${D.icon}" style="width:26px;height:26px;border:1px solid ${D.color}66;border-radius:3px">` : D.glyph} ${D.name}</div><div style="font-size:10px;color:#8fb4ff">${brewLine(id, b.stats)}</div><div style="font-size:9px;color:#9a907e;letter-spacing:.06em">${b.secs}s · <img src="${icon("dust")}" style="width:11px;height:11px;vertical-align:-2px">${D.dust} + ◆${D.shards}${D.heartwax ? ` + <span style="color:#b48cff">✦${D.heartwax}</span>` : ""}${D.abbesswax ? ` + <span style="color:#9fe8e0">✟${D.abbesswax}</span>` : ""}</div></button>`; }).join("")}</div>
        </div>`; })() : ""}
        ${s.atForge ? (sel ? `<div style="display:flex;gap:6px;align-items:stretch;margin-top:10px;padding-top:8px;border-top:1px solid #e0a86633">
        <div style="font-size:10px;letter-spacing:.2em;color:#e0a866;width:56px;line-height:1.3;align-self:center">WAYSIDE FORGE</div>
        ${[["temper", "TEMPER", "+1 item level"], ["reforge", "REFORGE", "new affixes"], ["ascend", "ASCEND", "one tier up"]].map(([op, label, hint]) => { const no = forgeCan(sel, op), fr = !no && op === "reforge" ? freeReforges(ctx, s) : 0, c = no ? null : fr ? 0 : forgeCost(sel, op), poor = c != null && (s.dust ?? 0) < c;
          return `<button class="vb" ${no ? "disabled" : ""} style="flex:1;${no ? "opacity:.35;" : poor ? "opacity:.6;" : "border-color:#e0a866aa;"}" title="${no ?? hint}" onclick="${act("forge", `,u:'${sel.u}',op:'${op}'`)}">${label}${no ? "" : fr ? ` · <span style="color:#e0a26a;text-shadow:0 0 6px #ac4c42">✦ FREE ×${fr}</span>` : ` · <img src="${icon("dust")}" style="width:13px;height:13px;vertical-align:-2px">${c}`}<div style="font-size:9px;letter-spacing:.1em;color:#9a907e">${no ?? hint}</div></button>`; }).join("")}
      </div>` : (() => { const rk = smithRank(s.smithXp ?? 0), cc = craftCost(s.smithXp ?? 0), poor = (s.dust ?? 0) < cc.dust || (s.shards ?? 0) < cc.shards, pct = rk.next ? Math.round(100 * ((s.smithXp ?? 0) - rk.from) / (rk.next - rk.from)) : 100;
        return `<div style="margin-top:10px;padding-top:8px;border-top:1px solid #e0a86633">
          <div style="display:flex;align-items:center;gap:8px;font-size:10px;letter-spacing:.18em;color:#e0a866">⚒ SMITHING · RANK ${rk.i + 1} · ${rk.name.toUpperCase()}
            <div style="flex:1;height:5px;background:#1a1612;border:1px solid #e0a86644"><div style="width:${pct}%;height:100%;background:linear-gradient(90deg,#7a3a1c,#e0a866)"></div></div>
            <span style="color:#9a907e">${rk.next ? `${s.smithXp ?? 0}/${rk.next}` : "MASTER"}</span></div>
          <div style="font-size:10px;color:#9a907e;margin:4px 0 6px;letter-spacing:.06em">forge a pattern · <img src="${icon("dust")}" style="width:12px;height:12px;vertical-align:-2px">${cc.dust} + ◆${cc.shards} · item level ${(s.level ?? 1) + rk.R.ilvl} · select an item to temper, reforge or ascend</div>
          <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:4px">${["blade", "great", "axe", "staff", "bow", "helm", "chest", "gloves", "boots", "ring", "amulet"].map((b) => `<button class="vb" ${poor ? "disabled" : ""} title="forge a ${b}" style="padding:3px;${poor ? "opacity:.4" : "border-color:#e0a866aa"}" onclick="${act("craft", `,b:'${b}'`)}"><img src="${icon(b)}" style="width:100%;aspect-ratio:1;display:block;image-rendering:auto"></button>`).join("")}</div>
        </div>`; })()) : ""}
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
    </div>` : `<div style="font-size:11px;color:#7d7466;margin-top:10px">${touch ? "tap an item to inspect" : "hover to read · click to inspect · double-click to equip"}</div>`}
    <button class="vb" style="margin-top:12px;width:100%" onclick="sendAction('menu',{a:'logout',n:Date.now()})">REST · CHARACTER SELECT</button>
  </div>`;
}
