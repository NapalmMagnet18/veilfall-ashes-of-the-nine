// VEILFALL HUD: life orb, edge orb, skill bar, quest tracker, boss bar, dialogue, death beat.
import { coinHTML, fmt } from "./lib/coins.js";
import { shopPanel } from "./lib/shop-ui.js";
import R from "./lib/data/realms.yml";
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
#vf .ph{display:none} @media (pointer:coarse),(max-width:700px){#vf .dk{display:none!important} #vf .ph{display:block} #vf .qp{left:10px!important;top:10px!important;max-width:210px!important;padding:6px 9px!important} #vf .qp div{font-size:13px!important} #vf .qp .lbl{font-size:10px!important}}
#vf .bar{height:10px;background:#120e0c;box-shadow:0 0 0 2px #0d0b0a,0 0 0 3px #5a4a33;position:relative;margin-top:5px}
@keyframes vfin{from{opacity:0;transform:translateY(8px)}} @keyframes vffade{to{opacity:0}} @keyframes vfpulse{50%{opacity:.55}}
</style>`;

// ---- title + the Bearer screen (character selection): drawn over the living camp, never a loading wall ----
const CDN = (h) => `/cdn/value.${h}.png`;
const CLASSES = [
  { id: "bladewraith", name: "Bladewraith", role: "Melee burst · guard-break", res: "Edge", img: CDN("1552ce71451180080c4bb9ccdeee8a943470179d762dbeb541ac018d80d15394"), fantasy: "A duelist who turns remembered regrets into precise swordplay.", skills: [["Ashcut", "basic strike, builds Edge"], ["Crosswound", "140° cleave for 30 Edge"], ["Griefstep", "7 m dash through harm"], ["Afterimage Guard", "catch a blow, riposte all near"]], open: true },
  { id: "soulweaver", name: "Soulweaver", role: "Ranged spell · support", res: "Resonance", img: CDN("06f9e024d84a3ca9283a701cb60689a35e1297dd46192608b059eefc3c205f11"), fantasy: "A memory-singer who weaves protective harmonics from chosen names.", skills: [["Pulse Thread", ""], ["Wound of Light", ""], ["Threadwalk", ""], ["Warding Chorus", ""]] },
  { id: "hellwarden", name: "Hellwarden", role: "Shield frontline · fire", res: "Resolve", img: CDN("8b5fc2d7eab1e92732ba85e82cddc5d09d79466e9608c0c1ae298b4bb240540e"), fantasy: "A covenant knight forged to shelter civilians during breaches.", skills: [["Cinder Strike", ""], ["Furnace Sweep", ""], ["Oath Charge", ""], ["Ember Bastion", ""]] },
  { id: "shadowmancer", name: "Shadowmancer", role: "Debuff · traps · control", res: "Shroud", img: CDN("1d3722f1f2b08fb094d253ae9840c060766126b4ef39d6301a64b30843461399"), fantasy: "A scholar of unchosen lives who bends reflections and occlusion.", skills: [["Gloam Needle", ""], ["Borrowed Shadow", ""], ["Unseen Door", ""], ["Mirror Snare", ""]] },
  { id: "primalist", name: "Primalist", role: "Shapeshift · nature", res: "Pulse", img: CDN("b536c08e6c94cf5b5e0d26ab9080c9ffdd8bea0de2c28e3b4c5a7f26ba8da409"), fantasy: "A guardian whose body borrows endurance from living ecosystems.", skills: [["Rootlash", ""], ["Stormhorn", ""], ["Briar Leap", ""], ["Thornskin", ""]] },
  { id: "gloamstalker", name: "Gloamstalker", role: "Ranged precision · ambush", res: "Focus", img: CDN("bf53d127661ebfc83f336ce66ae7078c9cd4250378648a8c9b5d33fbbc1a8885"), fantasy: "A boundary scout tracking beasts created by lost memories.", skills: [["Bonearrow", ""], ["Glassbolt Volley", ""], ["Silent Traverse", ""], ["Smoke Veil", ""]] },
];
const ANC = [
  { id: "cinderkin", name: "Cinderkin", home: "Ashwake Moor", color: "#aa4e3c", img: CDN("9c69f92c34a4b961e1acfac921f118e1871b170c627327df1c7094082d2216ea"), ethos: "Families inscribe the names of their lost into coal-fired clay.", trait: "Ember Ward: once a minute, the first blow you take is softened by up to 12." },
  { id: "fenborn", name: "Fenborn", home: "Gloamfen Reach", color: "#368783", img: CDN("657d460456caf2572c15e722fe7460d7b3ebc7e26991e41e7159cff6542564e4"), ethos: "Fenspeople keep reed tablets that hold a memory until the rain.", trait: "Mist Stride: move 30% faster for 1.5 s after every Griefstep." },
  { id: "stonebound", name: "Stonebound", home: "Underhollow Steps", color: "#ac9968", img: CDN("d6b87ccf4d5714f8d7067ab43ccee72b850c1c64257d5e290510bde5b8e44d86"), ethos: "Mountain clans carve genealogies into staircases, never statues.", trait: "Carved Stance: heavy blows (15+) land 25% lighter." },
  { id: "skyforged", name: "Skyforged", home: "Gale Spires", color: "#819ec4", img: CDN("8ef7be812171fb7a2dc3ef03c904c365e54475469f2973b75bdffd4170688f96"), ethos: "Cliff dwellers play their histories on funeral wind instruments.", trait: "Gust Return: every Griefstep restores 10 Edge." },
];
const act = (a, v) => `sendAction('menu',{a:'${a}'${v !== undefined ? `,v:'${v}'` : ""},n:Date.now()})`;
const MSTYLE = `<style>
#vm{position:fixed;inset:0;color:#e9dfc8;text-shadow:2px 2px 0 #0d0b0a;pointer-events:none}
#vm .veil{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 55%,transparent 25%,rgba(6,7,12,.55) 70%,rgba(4,4,8,.9))}
#vm .btn{pointer-events:auto;cursor:pointer;display:block;min-width:250px;padding:12px 22px;margin:10px auto 0;text-align:center;font-size:19px;letter-spacing:.2em;text-transform:uppercase;color:#e9dfc8;background:linear-gradient(#2c2825,#171412);box-shadow:0 0 0 2px #0d0b0a,0 0 0 4px #5a4a33,4px 6px 0 4px rgba(0,0,0,.5);border:0;font-family:inherit;transition:transform .12s,color .12s}
#vm .btn:hover{color:#f2d38a;transform:translateY(-2px)} #vm .btn.main{color:#f2d38a;font-size:22px;box-shadow:0 0 0 2px #0d0b0a,0 0 0 4px #ac4c42,0 0 24px rgba(240,140,60,.35),4px 6px 0 4px rgba(0,0,0,.5)}
#vm .btn[disabled]{color:#6e655a;cursor:default;transform:none}
#vm .lbl{font-size:12px;letter-spacing:.16em;color:#b9a77f;text-transform:uppercase}
#vm .panel{pointer-events:auto;background:linear-gradient(rgba(36,32,29,.94),rgba(20,18,16,.96));box-shadow:0 0 0 2px #0d0b0a,0 0 0 4px #5a4a33,6px 8px 0 4px rgba(0,0,0,.45);padding:14px 16px}
#vm .card{position:relative;cursor:pointer;overflow:hidden;background:#120e0c;box-shadow:0 0 0 2px #0d0b0a,0 0 0 3px #4a3d2b;transition:transform .12s}
#vm .card:hover{transform:translateY(-2px)} #vm .card.on{box-shadow:0 0 0 2px #0d0b0a,0 0 0 4px #f2d38a,0 0 18px rgba(242,211,138,.35)}
#vm .card img{width:100%;height:100%;object-fit:cover;display:block} #vm .card.sealed img{filter:grayscale(.85) brightness(.45)}
#vm .card .nm{position:absolute;left:0;right:0;bottom:0;padding:14px 4px 4px;font-size:12px;text-align:center;background:linear-gradient(transparent,rgba(0,0,0,.9))}
#vm .card .seal{position:absolute;top:4px;right:5px;font-size:10px;letter-spacing:.1em;color:#c98a5a}
#vm .anc{display:flex;flex-direction:column;align-items:center;gap:3px;cursor:pointer;opacity:.6;transition:opacity .12s} #vm .anc.on{opacity:1}
#vm .anc img{width:58px;height:58px;border-radius:50%;object-fit:cover;box-shadow:0 0 0 2px #0d0b0a} #vm .anc.on img{box-shadow:0 0 0 2px #0d0b0a,0 0 0 4px var(--c),0 0 16px var(--c)}
#vm .anc span{font-size:11px;letter-spacing:.08em}
#vm .grid{display:grid;grid-template-columns:repeat(3,118px);gap:12px}
#vm .grid .card{height:162px}
#vm .wrap{position:absolute;left:24px;right:calc(var(--spawn-chrome-reservation-right-inset,50px) + 24px);top:24px;bottom:24px;display:flex;justify-content:space-between;align-items:flex-start;gap:20px}
#vm .det{width:380px;display:flex;flex-direction:column;max-height:100%;overflow:auto}
#vm .det .big{height:min(300px,30vh);margin:-14px -16px 10px;overflow:hidden;position:relative} #vm .det .big img{width:100%;height:100%;object-fit:cover;object-position:50% 20%}
@keyframes vmin{from{opacity:0;transform:translateY(10px)}} @keyframes vmglow{50%{text-shadow:2px 2px 0 #0d0b0a,0 0 26px rgba(240,140,60,.55)}}
@media (pointer:coarse),(max-width:760px){
 #vm .wrap{left:8px;right:8px;top:8px;bottom:8px;flex-direction:column;gap:8px;overflow:auto}
 #vm .panel{padding:8px 10px} #vm .grid{grid-template-columns:repeat(3,1fr);gap:7px} #vm .grid .card{height:92px}
 #vm .anc img{width:40px;height:40px} #vm .anc span{font-size:9px}
 #vm .det{width:auto} #vm .det .big{display:none} #vm .det .sk{display:none} #vm .btn{min-width:0;font-size:15px;padding:10px 14px}
 #vm .tb{bottom:auto!important;top:46%} #vm .qt{padding:0 64px 0 24px!important;font-size:12px!important} #vm .wrap{right:62px} #vm .ttl{font-size:46px!important} #vm .sub{font-size:14px!important}
}
</style>`;
const MX = `<style>
#vm .row{pointer-events:auto;cursor:pointer;display:flex;align-items:center;gap:10px;padding:8px 10px;margin-top:8px;background:#171412;box-shadow:0 0 0 2px #0d0b0a,0 0 0 3px #3e3326;transition:transform .1s}
#vm .row:hover{transform:translateX(3px)} #vm .row.on{box-shadow:0 0 0 2px #0d0b0a,0 0 0 4px #f2d38a,0 0 14px rgba(242,211,138,.3)}
#vm .row img{width:46px;height:46px;object-fit:cover;object-position:50% 15%;box-shadow:0 0 0 2px #0d0b0a}
#vm .row .t{font-size:17px;color:#f2d38a} #vm .row .d{font-size:12px;color:#b9a77f}
#vm .msg{position:absolute;left:50%;transform:translateX(-50%);bottom:18px;padding:8px 14px;font-size:14px;max-width:min(520px,calc(100vw - 140px));text-align:center;animation:vmin .3s}
#vm .side{width:340px;max-height:100%;overflow:auto}
#vm .mid{position:absolute;left:50%;transform:translateX(-50%);top:18px;text-align:center}
#vm .namebox{font-size:24px;color:#f2d38a;padding:8px 10px;background:#120e0c;box-shadow:inset 0 0 0 2px #3e3326;display:flex;justify-content:space-between;align-items:center;gap:8px}
#vm .mini{pointer-events:auto;cursor:pointer;font-size:12px;letter-spacing:.12em;padding:6px 10px;background:#2c2825;color:#e9dfc8;border:0;font-family:inherit;box-shadow:0 0 0 2px #0d0b0a,0 0 0 3px #5a4a33}
@media (pointer:coarse),(max-width:760px){
 #vm .side{width:auto;max-height:none} #vm .mid{display:none} #vm .row{padding:6px 8px;margin-top:6px} #vm .row img{width:36px;height:36px} #vm .row .t{font-size:15px}
 #vm .msg{bottom:auto;top:8px;max-width:calc(100vw - 90px)} #vm .namebox{font-size:18px}
}
</style>`;
const head = (s) => `${MSTYLE}${MX}<div id="vm"><div class="veil" style="background:radial-gradient(ellipse at 50% 50%,transparent 30%,rgba(6,7,12,.45) 65%,rgba(4,4,8,.85))"></div>`;
const tail = (s, now) => `${s.busy ? `<div class="panel msg" style="color:#f2d38a">${s.busy}…</div>` : s.msg && now - s.msg.at < 5000 ? `<div class="panel msg">${s.msg.text}</div>` : ""}</div>`;
const realmName = (room) => R.realms.find((r) => r.room === room)?.name ?? room;
const ago = (now, t) => { const m = Math.floor((now - t) / 60000); return m < 2 ? "just now" : m < 60 ? `${m} min ago` : m < 2880 ? `${Math.floor(m / 60)} h ago` : `${Math.floor(m / 1440)} days ago`; };

function menu(ctx, player, s) {
  const now = ctx.now(), here = s.roster?.realm ?? "main";
  if (s.menu === "title") return `${head(s)}
  <div style="position:absolute;left:0;right:0;top:9%;text-align:center;animation:vmin .8s">
    <div class="ttl" style="font-size:84px;letter-spacing:.22em;color:#e7d9b8;animation:vmglow 4s infinite">VEILFALL</div>
    <div class="sub" style="font-size:20px;letter-spacing:.5em;color:#c49c63;margin-top:4px">ASHES OF THE NINE</div>
    <div style="width:220px;height:2px;margin:16px auto;background:linear-gradient(90deg,transparent,#ac4c42,transparent)"></div>
    <div class="qt" style="font-size:14px;color:#b9a77f;font-style:italic;max-width:520px;margin:0 auto;padding:0 70px 0 16px">"Every book in this place is a person who no longer knows what they lost."</div>
  </div>
  <div class="tb" style="position:absolute;left:0;right:0;bottom:11%;text-align:center;padding-right:60px;animation:vmin 1.1s">
    <button class="btn main" onclick="${act("chars")}">Enter the Veil</button>
    <div class="lbl" style="margin-top:6px">Realm · ${realmName(here)}</div>
    <button class="btn" onclick="${act("realms")}">Realms</button>
    <div class="lbl" style="margin-top:22px;opacity:.6">Broken Lantern Road · M1</div>
  </div>${tail(s, now)}`;

  if (s.menu === "realms") {
    const per = s.roster?.per ?? {};
    return `${head(s)}<div class="mid"><div class="lbl">Choose a realm</div><div style="font-size:30px;color:#e7d9b8;letter-spacing:.1em">THE NINE ROADS</div></div>
    <div class="wrap" style="justify-content:center"><div class="panel side" style="width:min(460px,100%);animation:vmin .4s;margin-top:70px">
      <div class="lbl">Realms</div>
      <div style="font-size:13px;color:#b9a77f;margin:4px 0 2px">A Bearer is written into one realm and walks only there.</div>
      ${R.realms.map((r) => `<div class="row ${r.room === here ? "on" : ""}" onclick="${act("realm", r.room)}">
        <div style="flex:1"><div class="t">${r.name}${r.room === here ? ` <span class="lbl" style="color:#6db8c0">· here</span>` : ""}</div><div class="d">${r.kind} · ${r.note}</div></div>
        <div style="text-align:right"><div style="font-size:18px">${per[r.room] ?? 0}<span style="font-size:12px;color:#b9a77f">/${R.maxChars}</span></div><div class="d">yours</div></div></div>`).join("")}
      <button class="btn" style="min-width:0;font-size:14px;padding:8px;margin-top:14px" onclick="${act("title")}">Back</button>
    </div></div>${tail(s, now)}`;
  }

  if (s.menu === "create") {
    const pk = s.pick ?? { anc: "cinderkin", cls: "bladewraith", name: "" };
    const C = CLASSES.find((c) => c.id === pk.cls) ?? CLASSES[0], A = ANC.find((a) => a.id === pk.anc) ?? ANC[0];
    return `${head(s)}
  <div class="wrap">
    <div class="panel" style="animation:vmin .4s">
      <div class="lbl">New Bearer · ${realmName(here)}</div>
      <div style="font-size:22px;color:#f2d38a;margin:2px 0 10px">Ancestry</div>
      <div style="display:flex;gap:14px;justify-content:space-between">${ANC.map((a) => `<div class="anc ${a.id === A.id ? "on" : ""}" style="--c:${a.color};pointer-events:auto" onclick="${act("anc", a.id)}"><img src="${a.img}"><span style="color:${a.id === A.id ? a.color : "#e9dfc8"}">${a.name.toUpperCase()}</span></div>`).join("")}</div>
      <div style="font-size:22px;color:#f2d38a;margin:14px 0 10px">Class</div>
      <div class="grid">${CLASSES.map((c) => `<div class="card ${c.id === C.id ? "on" : ""} ${c.open ? "" : "sealed"}" onclick="${act("cls", c.id)}"><img src="${c.img}"><div class="nm">${c.name}</div>${c.open ? "" : `<div class="seal">SEALED</div>`}</div>`).join("")}</div>
    </div>
    <div class="panel det" style="animation:vmin .55s">
      <div class="big"><img src="${C.img}" style="${C.open ? "" : "filter:grayscale(.8) brightness(.5)"}"><div style="position:absolute;left:0;right:0;bottom:0;height:80px;background:linear-gradient(transparent,#1a1715)"></div></div>
      <div class="lbl">Name</div>
      <div class="namebox"><span>${pk.name}</span><button class="mini" onclick="${act("reroll")}">⟳ ANOTHER</button></div>
      <div style="font-size:24px;color:#f2d38a;letter-spacing:.06em;margin-top:8px">${C.name}</div>
      <div class="lbl">${C.role} · ${C.res}</div>
      <div style="font-size:14px;margin:6px 0 8px;line-height:1.35">${C.fantasy}</div>
      <div class="sk" style="display:grid;grid-template-columns:1fr 1fr;gap:4px 10px;font-size:12px;margin-bottom:8px">${C.skills.map(([n, d]) => `<div><span style="color:${C.open ? "#e9dfc8" : "#8a7f70"}">${n}</span>${d ? `<div style="color:#9a8e78;font-size:11px">${d}</div>` : ""}</div>`).join("")}</div>
      <div style="height:2px;background:linear-gradient(90deg,${A.color},transparent);margin:2px 0 8px"></div>
      <div style="font-size:16px;color:${A.color}">${A.name} <span class="lbl">of ${A.home}</span></div>
      <div style="font-size:12px;color:#b9a77f;margin:2px 0 4px;font-style:italic">${A.ethos}</div>
      <div style="font-size:13px;line-height:1.35">${A.trait}</div>
      ${C.open ? `<button class="btn main" style="margin-top:12px;min-width:0" onclick="${act("create")}">Write the name</button>`
        : `<button class="btn" disabled style="margin-top:12px;min-width:0">Sealed · its trial comes later</button>`}
      <button class="btn" style="min-width:0;font-size:14px;padding:8px" onclick="${act("chars")}">Back</button>
    </div>
  </div>${tail(s, now)}`;
  }

  // character select
  const chars = s.roster?.chars ?? [], sel = chars.find((c) => c.id === s.sel);
  const C = sel && (CLASSES.find((c) => c.id === sel.cls) ?? CLASSES[0]), A = sel && (ANC.find((a) => a.id === sel.ancestry) ?? ANC[0]);
  return `${head(s)}<div class="mid"><div class="lbl">Realm</div><div style="font-size:28px;color:#e7d9b8;letter-spacing:.12em">${realmName(here).toUpperCase()}</div></div>
  <div class="wrap">
    <div class="panel side" style="animation:vmin .4s">
      <div class="lbl">Your Bearers · ${chars.length}/${R.maxChars}</div>
      ${!s.roster ? `<div style="margin-top:10px;color:#b9a77f">Reading the realm's ledger…</div>`
        : chars.length ? chars.map((c) => { const k = CLASSES.find((x) => x.id === c.cls) ?? CLASSES[0], an = ANC.find((x) => x.id === c.ancestry) ?? ANC[0];
          return `<div class="row ${c.id === s.sel ? "on" : ""}" onclick="${act("sel", c.id)}"><img src="${k.img}"><div style="flex:1;min-width:0"><div class="t">${c.name}</div><div class="d"><span style="color:${an.color}">${an.name}</span> ${k.name} · Lv ${c.level}</div><div class="d">${c.zone}</div></div></div>`; }).join("")
        : `<div style="margin-top:10px;font-size:14px;line-height:1.4;color:#b9a77f">No Bearer walks ${realmName(here)} in your name yet.</div>`}
      ${chars.length < R.maxChars ? `<button class="btn" style="min-width:0;font-size:15px;padding:9px;margin-top:14px" onclick="${act("new")}">+ New Bearer</button>` : ""}
      <button class="btn" style="min-width:0;font-size:13px;padding:7px;margin-top:8px" onclick="${act("realms")}">Change realm</button>
      <button class="btn" style="min-width:0;font-size:13px;padding:7px;margin-top:8px" onclick="${act("title")}">Back</button>
    </div>
    ${sel ? `<div class="panel det" style="animation:vmin .5s">
      <div class="big"><img src="${C.img}"><div style="position:absolute;left:0;right:0;bottom:0;height:80px;background:linear-gradient(transparent,#1a1715)"></div></div>
      <div style="font-size:28px;color:#f2d38a;letter-spacing:.04em">${sel.name}</div>
      <div class="lbl"><span style="color:${A.color}">${A.name}</span> ${C.name} · Level ${sel.level}</div>
      <div style="font-size:14px;margin:8px 0 2px">${sel.zone}</div>
      <div class="d" style="font-size:12px;color:#9a8e78">Last walked ${ago(now, sel.played_at)}</div>
      <button class="btn main" style="margin-top:14px;min-width:0" onclick="${act("enter")}">Enter the world</button>
      ${s.confirmDel === sel.id ? `<div style="margin-top:12px;font-size:13px;color:#d8442f;text-align:center">Unwrite ${sel.name} forever?</div>
        <div style="display:flex;gap:8px"><button class="btn" style="min-width:0;flex:1;font-size:13px;padding:7px;color:#d8442f" onclick="${act("delete-yes")}">Unwrite</button><button class="btn" style="min-width:0;flex:1;font-size:13px;padding:7px" onclick="${act("delete-no")}">Keep</button></div>`
        : `<button class="btn" style="min-width:0;font-size:12px;padding:6px;margin-top:10px;color:#9a8e78" onclick="${act("delete")}">Delete Bearer</button>`}
    </div>` : ""}
  </div>${tail(s, now)}`;
}
let firstSeen = null;
export default function (ctx, player) {
  const s = player.state ?? {}, now = ctx.now();
  if (s.hp === undefined) return "";
  if (s.menu) return menu(ctx, player, s);
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
  <div class="absolute plate qp" style="left:24px;top:24px;max-width:300px;animation:vfin .4s">
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
  <div class="absolute dk" style="left:24px;bottom:24px;display:flex;align-items:flex-end;gap:14px">
    <div class="orb"><div class="fill" style="height:${hpPct}%;background:radial-gradient(circle at 50% 30%,#e0473a,#7d1410 70%)${hpPct < 30 ? ";animation:vfpulse 1s infinite" : ""}"></div><div class="shine"></div><div class="val">${hp}</div></div>
    <div class="plate" style="padding:6px 10px"><div class="lbl">${s.ancestry ? s.ancestry[0].toUpperCase() + s.ancestry.slice(1) + " " : ""}Bladewraith · Lv ${lv}</div><div style="width:150px;height:6px;background:#120e0c;margin-top:4px"><div style="height:6px;width:${xpPct}%;background:#9d86e0"></div></div><div style="font-size:13px;margin-top:4px;color:var(--wax)">${coinHTML(s.copper ?? 0, 14)}${s.weapon === "ITEM-001" ? " · Rusted Oathblade" : ""}</div></div>
  </div>
  ${touch ? "" : `<div class="absolute dk" style="left:50%;bottom:24px;transform:translateX(-50%);display:flex;gap:10px">
    <div class="slot"><span class="k">LMB</span>⚔</div>
    <div class="slot ${edge < 30 ? "dim" : ""}"><span class="k">RMB</span>⚔<span class="n">30</span></div>
    <div class="slot"><span class="k">SPC</span>»<div class="cd" style="height:${dashPct}%"></div></div>
    <div class="slot"><span class="k">1</span><span style="color:#9fc4ff;font-size:13px">GUARD</span><div class="cd" style="height:${Math.max(0, Math.min(100, ((s.guardReadyAt ?? 0) - now) / 80))}%"></div></div>
    <div class="slot ${(s.tonics ?? 0) ? "" : "dim"}"><span class="k">Q</span><span style="color:#e0473a">♥</span><span class="n">${s.tonics ?? 0}</span></div>
    <div class="slot" style="pointer-events:auto;cursor:pointer" onclick="sendAction('bag')"><span class="k">I</span><span style="font-size:13px">PACK</span></div>
  </div>`}
  <div class="absolute dk" style="right:24px;bottom:24px"><div class="orb"><div class="fill" style="height:${edge}%;background:radial-gradient(circle at 50% 30%,#f2b04a,#8a4a10 70%)"></div><div class="shine"></div><div class="val">${edge}</div></div><div class="lbl" style="text-align:center;margin-top:8px">Edge</div></div>
  <div class="absolute ph plate" style="left:10px;top:118px;width:170px;padding:6px 9px">
    <div class="lbl" style="font-size:10px">Bladewraith · Lv ${lv} · ${fmt(s.copper ?? 0)}</div>
    <div class="bar"><div style="position:absolute;inset:0;width:${hpPct}%;background:linear-gradient(#e0473a,#7d1410)${hpPct < 30 ? ";animation:vfpulse 1s infinite" : ""}"></div><div style="position:absolute;inset:0;font-size:9px;line-height:10px;text-align:center">${hp}</div></div>
    <div class="bar" style="height:6px"><div style="position:absolute;inset:0;width:${edge}%;background:linear-gradient(#f2b04a,#8a4a10)"></div></div>
    <div style="font-size:11px;margin-top:4px;color:#e0473a">♥ ${s.tonics ?? 0}</div>
  </div>
  <div class="absolute ph" style="right:12px;top:12px;pointer-events:auto" onclick="sendAction('bag')"><div class="slot" style="width:48px;height:40px;font-size:11px">PACK</div></div>
  ${q.stage === 0 || q.stage === 4 ? `<div data-world-anchor="maelin" data-anchor-offset="0 2.3 0" style="font-size:30px;color:var(--wax);text-align:center;animation:vfpulse 1.4s infinite">!<div style="font-size:12px">MAELIN</div></div>` : ""}
  ${s.bagOpen ? `<div class="absolute plate" style="right:${rail};top:50%;transform:translateY(-50%);width:260px;animation:vfin .25s">
    <div class="lbl">Pack (I or PACK to close)</div>
    <div style="display:grid;grid-template-columns:repeat(4,52px);gap:8px;margin-top:8px">
      ${[["⚔", s.weapon === "ITEM-001" ? "Rusted Oathblade" : "Pilgrim's Shortblade", 1], ["♥", "Ash Tonic", s.tonics ?? 0], ["◆", "Wax Shard", s.shards ?? 0], ["✉", "Sealed Petition", s.petitions?.length ?? 0]].filter((i) => i[2]).map(([g, n, c]) => `<div class="slot" title="${n}" style="width:52px;height:52px">${g}<span class="n">${c}</span></div>`).join("")}
    </div>
    <div style="font-size:13px;margin-top:8px;line-height:1.4">${s.weapon === "ITEM-001" ? "Rusted Oathblade · +30% damage" : "Pilgrim's Shortblade"}<br>${s.shards ?? 0} wax shards · ${s.petitions?.length ?? 0} petitions</div><div style="font-size:14px;margin-top:6px;display:flex;align-items:center">${coinHTML(s.copper ?? 0, 14)}</div></div>` : ""}
  ${s.shop ? shopPanel(ctx, player) : ""}
  ${s.dead ? `<div class="absolute inset-0" style="display:flex;align-items:center;justify-content:center;background:radial-gradient(transparent 30%,rgba(40,0,0,.6));animation:vfin .4s"><div style="font-size:54px;color:#d8442f;letter-spacing:.1em">THE ROAD TAKES YOU</div></div>` : ""}
  ${now - firstSeen < 9000 && !touch ? `<div class="absolute inset-x-0 text-center dk" style="bottom:150px;font-size:17px;padding:0 ${rail};animation:vffade 1s 8s forwards">Click to walk · click a foe to strike · Right-click Crosswound · Space Griefstep · Q tonic · I pack</div>` : ""}
</div>`;
}
