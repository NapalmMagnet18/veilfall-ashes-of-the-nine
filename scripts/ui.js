// VEILFALL HUD: life orb, edge orb, skill bar, quest tracker, boss bar, dialogue, death beat.
const STAGES = [
  ["Pilgrims in White", "Speak with Maelin at the Wayside Fire"],
  ["Pilgrims in White", "Silence the wax pilgrims on the road"],
  ["The Toll of Remembrance", "Recover wax-sealed petitions at the tollhouse"],
  ["The Dripping Gate", "Defeat the Bailiff beyond the Dripping Gate"],
  ["The Dripping Gate", "Return to Maelin at the Wayside Fire"],
  ["Beyond the Mile of Bells", "The Abbey road is open. (more soon)"],
];
const THEME = `<style>
#vf{--ink:#0d0b0a;--bone:#e9dfc8;--wax:#f2d38a;--blood:#b3261e;--edge:#d98c2b;--stone:#2a2724;color:var(--bone);font-size:16px;text-shadow:2px 2px 0 var(--ink)}
#vf .plate{background:linear-gradient(#2c2825,#1b1816);box-shadow:0 0 0 2px #0d0b0a,0 0 0 4px #5a4a33,4px 6px 0 4px rgba(0,0,0,.5);padding:8px 12px}
#vf .lbl{font-size:12px;letter-spacing:.14em;color:#b9a77f;text-transform:uppercase}
#vf .orb{width:112px;height:112px;border-radius:50%;position:relative;overflow:hidden;background:#120e0c;box-shadow:0 0 0 3px #0d0b0a,0 0 0 7px #5a4a33,0 0 0 9px #0d0b0a,inset 0 0 18px #000}
#vf .orb .fill{position:absolute;left:0;right:0;bottom:0;transition:height .25s}
#vf .orb .shine{position:absolute;inset:0;border-radius:50%;background:radial-gradient(circle at 35% 28%,rgba(255,255,255,.35),transparent 30%)}
#vf .orb .val{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:22px}
#vf .slot{width:58px;height:58px;position:relative;background:#171412;box-shadow:0 0 0 2px #0d0b0a,0 0 0 4px #5a4a33;display:flex;align-items:center;justify-content:center;font-size:24px}
#vf .slot .k{position:absolute;left:3px;top:1px;font-size:11px;color:#b9a77f}
#vf .slot .cd{position:absolute;left:0;right:0;bottom:0;background:rgba(0,0,0,.65)}
#vf .slot .n{position:absolute;right:4px;bottom:1px;font-size:13px}
#vf .dim{opacity:.4}
@keyframes vfin{from{opacity:0;transform:translateY(8px)}} @keyframes vffade{to{opacity:0}} @keyframes vfpulse{50%{opacity:.55}}
</style>`;
let firstSeen = null;
export default function (ctx, player) {
  const s = player.state ?? {}, now = ctx.now();
  if (s.hp === undefined) return "";
  firstSeen ??= now;
  const hp = Math.max(0, Math.round(s.hp)), max = s.maxHp ?? 100, hpPct = Math.max(0, Math.min(100, (hp / max) * 100));
  const edge = Math.round(s.edge ?? 0);
  const q = s.quest ?? { stage: 0 }, [qt, qo] = STAGES[q.stage] ?? STAGES[0];
  let prog = "";
  if (q.stage === 1) prog = ` ${Math.min(8, (s.kills ?? 0) - (q.killsAt ?? 0))}/8`;
  if (q.stage === 2) prog = ` ${Math.min(5, s.petitions?.length ?? 0)}/5`;
  const L = [0, 60, 150, 280, 450, 680, 960, 1300], lv = s.level ?? 1;
  const lo = L[lv - 1] ?? 0, hi = L[lv] ?? lo + 500, xpPct = Math.max(0, Math.min(100, (((s.xp ?? 0) - lo) / (hi - lo)) * 100));
  const boss = ctx.place.state.boss;
  const dashLeft = Math.max(0, (s.dashReadyAt ?? 0) - now), dashPct = Math.min(100, (dashLeft / 3000) * 100);
  const dlg = s.dialog && now - s.dialog.at < 9000 ? s.dialog : null;
  const touch = typeof matchMedia !== "undefined" && matchMedia("(pointer: coarse)").matches;
  const rail = "calc(var(--spawn-chrome-reservation-right-inset, 50px) + 24px)";
  return `${THEME}<div id="vf" class="fixed inset-0 pointer-events-none">
  <div class="absolute plate" style="left:24px;top:24px;max-width:300px;animation:vfin .4s">
    <div class="lbl">${q.stage >= 5 ? "Complete" : "Quest"} · Broken Lantern Road</div>
    <div style="font-size:19px;color:var(--wax)">${qt}</div>
    <div style="font-size:15px">› ${qo}<span style="color:var(--wax)">${prog}</span></div>
  </div>
  ${boss && boss.engaged && !boss.dead ? `<div class="absolute" style="top:24px;left:50%;transform:translateX(-50%);width:min(520px,calc(100vw - 2*${rail}));text-align:center;animation:vfin .3s">
    <div style="font-size:20px;color:var(--wax);letter-spacing:.06em">${boss.name.toUpperCase()}</div>
    <div style="height:16px;background:#120e0c;box-shadow:0 0 0 2px #0d0b0a,0 0 0 4px #5a4a33;position:relative">
      <div style="position:absolute;inset:0;width:${(boss.hp / boss.max) * 100}%;background:linear-gradient(#c9402f,#7a1610);transition:width .2s"></div>
      <div style="position:absolute;top:0;bottom:0;left:70%;width:2px;background:#0d0b0a"></div><div style="position:absolute;top:0;bottom:0;left:35%;width:2px;background:#0d0b0a"></div>
    </div><div class="lbl" style="margin-top:4px">${boss.phase === 1 ? "PHASE I · orange wedge: get behind him · marked: move away" : boss.phase === 2 ? `PHASE II · break the ledger pillars (${boss.ledgers} lit)` : "PHASE III · arc, debt, then he falters"}${boss.fray ? ` · FRAY ×${boss.fray} (+${boss.fray * 10}% damage taken)` : ""}</div></div>` : ""}
  ${dlg ? `<div id="dlg${dlg.at}" class="absolute plate" style="left:50%;transform:translateX(-50%);bottom:${touch ? 210 : 150}px;width:min(560px,calc(100vw - 2*${rail}));animation:vfin .35s;font-size:17px;line-height:1.35">${dlg.text}</div>` : ""}
  <div class="absolute" style="left:24px;bottom:24px;display:flex;align-items:flex-end;gap:14px">
    <div class="orb"><div class="fill" style="height:${hpPct}%;background:radial-gradient(circle at 50% 30%,#e0473a,#7d1410 70%)${hpPct < 30 ? ";animation:vfpulse 1s infinite" : ""}"></div><div class="shine"></div><div class="val">${hp}</div></div>
    <div class="plate" style="padding:6px 10px"><div class="lbl">Bladewraith · Lv ${lv}</div><div style="width:150px;height:6px;background:#120e0c;margin-top:4px"><div style="height:6px;width:${xpPct}%;background:#9d86e0"></div></div><div style="font-size:13px;margin-top:4px;color:var(--wax)">${s.gold ?? 0} gold${s.weapon === "ITEM-001" ? " · Rusted Oathblade" : ""}</div></div>
  </div>
  ${touch ? "" : `<div class="absolute" style="left:50%;bottom:24px;transform:translateX(-50%);display:flex;gap:10px">
    <div class="slot"><span class="k">LMB</span>⚔</div>
    <div class="slot ${edge < 30 ? "dim" : ""}"><span class="k">RMB</span>⚔<span class="n">30</span></div>
    <div class="slot"><span class="k">SPC</span>»<div class="cd" style="height:${dashPct}%"></div></div>
    <div class="slot"><span class="k">1</span><span style="color:#9fc4ff">◈</span><div class="cd" style="height:${Math.max(0, Math.min(100, ((s.guardReadyAt ?? 0) - now) / 80))}%"></div></div>
    <div class="slot ${(s.tonics ?? 0) ? "" : "dim"}"><span class="k">Q</span><span style="color:#e0473a">♥</span><span class="n">${s.tonics ?? 0}</span></div>
    <div class="slot"><span class="k">I</span><span style="font-size:13px">PACK</span></div>
  </div>`}
  <div class="absolute" style="right:24px;bottom:24px"><div class="orb"><div class="fill" style="height:${edge}%;background:radial-gradient(circle at 50% 30%,#f2b04a,#8a4a10 70%)"></div><div class="shine"></div><div class="val">${edge}</div></div><div class="lbl" style="text-align:center;margin-top:8px">Edge</div></div>
  ${q.stage === 0 || q.stage === 4 ? `<div data-world-anchor="maelin" data-anchor-offset="0 2.3 0" style="font-size:30px;color:var(--wax);text-align:center;animation:vfpulse 1.4s infinite">!<div style="font-size:12px">MAELIN</div></div>` : ""}
  ${s.bagOpen ? `<div class="absolute plate" style="right:${rail};top:50%;transform:translateY(-50%);width:260px;animation:vfin .25s">
    <div class="lbl">Pack (I to close)</div>
    <div style="display:grid;grid-template-columns:repeat(4,52px);gap:8px;margin-top:8px">
      ${[["⚔", s.weapon === "ITEM-001" ? "Rusted Oathblade" : "Pilgrim's Shortblade", 1], ["♥", "Ash Tonic", s.tonics ?? 0], ["◆", "Wax Shard", s.shards ?? 0], ["✉", "Sealed Petition", s.petitions?.length ?? 0], ["●", "Gold", s.gold ?? 0]].filter((i) => i[2]).map(([g, n, c]) => `<div class="slot" title="${n}" style="width:52px;height:52px">${g}<span class="n">${c}</span></div>`).join("")}
    </div>
    <div style="font-size:13px;margin-top:8px;line-height:1.4">${s.weapon === "ITEM-001" ? "Rusted Oathblade · +30% damage" : "Pilgrim's Shortblade"}<br>${s.shards ?? 0} wax shards · ${s.petitions?.length ?? 0} petitions</div></div>` : ""}
  ${s.dead ? `<div class="absolute inset-0" style="display:flex;align-items:center;justify-content:center;background:radial-gradient(transparent 30%,rgba(40,0,0,.6));animation:vfin .4s"><div style="font-size:54px;color:#d8442f;letter-spacing:.1em">THE ROAD TAKES YOU</div></div>` : ""}
  ${now - firstSeen < 9000 && !touch ? `<div class="absolute inset-x-0 text-center" style="bottom:150px;font-size:17px;padding:0 ${rail};animation:vffade 1s 8s forwards">Click to walk · click a foe to strike · Right-click Crosswound · Space Griefstep · Q tonic · I pack</div>` : ""}
</div>`;
}
