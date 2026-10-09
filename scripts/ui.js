// VEILFALL HUD: life orb, edge orb, skill bar, quest tracker, boss bar, dialogue, death beat.
import { coinHTML, fmt } from "./lib/coins.js";
import { shopPanel } from "./lib/shop-ui.js";
import { packPanel, PACK_CSS } from "./lib/pack-ui.js";
import { BREW } from "./lib/brews.js";
import { icon as itemIcon, TIER } from "./lib/loot.js";
import { treeOf, TAL_ICON, LABEL, pointsOf, spent, spentIn, canLearn, KEYSTONE } from "./lib/data/talents.js";
import { boardPanel } from "./lib/board-ui.js";
import R from "./lib/data/realms.yml";
import { FRAME_CSS } from "./lib/frames.js";
import CB from "./lib/data/combat.yml";
import cinemaPanel from "../mods/absolute-cinema/lib/ui-cinema.js";
import { renderCinemaOverlays } from "../mods/absolute-cinema/lib/ui-cinema-overlays.js";
const STAGES = [
  ["Pilgrims in White", "Speak with Maelin at the Wayside Fire"],
  ["Pilgrims in White", "Silence the wax pilgrims on the road"],
  ["The Toll of Remembrance", "Recover wax-sealed petitions at the tollhouse"],
  ["The Dripping Gate", "Defeat the Bailiff beyond the Dripping Gate"],
  ["The Dripping Gate", "Return to Maelin at the Wayside Fire"],
  ["Beyond the Mile of Bells", "Climb the Penitent Climb to the Ashen Abbey"],
  ["The Mouthless Choir", "Silence the Abbey's wax faithful"],
  ["Saints Who Remember", "Listen at the wax saints in the graveyard"],
  ["The Sealed Door", "Lay your hand on the Abbey door"],
  ["The Sealed Door", "Return to Maelin at the Wayside Fire"],
  ["The Ninth Bell", "Pass through the Abbey door into the Burned Nave"],
  ["The Ninth Bell", "Descend to the Bell Crypt and silence its Ringer"],
  ["The Ninth Bell", "Return to Maelin at the Wayside Fire"],
  ["The Drowned Lantern", "Take the Fen Path west of the fire to the Lanternmere"],
  ["The Drowned Lantern", "Relight the three waystones in the mere"],
  ["The Drowned Lantern", "Put the Lantern Warden to rest at the mere's heart"],
  ["The Drowned Lantern", "Return to Maelin at the Wayside Fire"],
  ["Two Flames", "Speak with Maelin about the second lantern"],
  ["The Gallows Orchard", "Take the Gallows Path east of the fire to Saint Corvin's orchard"],
  ["The Gallows Orchard", "Cut down the three hanged pilgrims"],
  ["The Gallows Orchard", "Bring the Hangman down off his gallows"],
  ["The Gallows Orchard", "Return to Maelin at the Wayside Fire"],
  ["Three Flames", "Three lanterns found, five still out there. The road goes on."],
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
#vf .slot img.ic{position:absolute;inset:5px;width:calc(100% - 10px);height:calc(100% - 10px);object-fit:cover;image-rendering:pixelated;filter:drop-shadow(0 1px 0 #000)}
#vf .slot .cdn{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:20px;color:#f2d38a;text-shadow:0 2px 0 #000,0 0 6px #000}
#vf .slot .k,#vf .slot .n{z-index:2;text-shadow:0 1px 0 #000,0 0 4px #000}
#vf .slot.ready{animation:vfready .5s}
@keyframes vfready{0%{filter:brightness(2.2)}100%{filter:none}}
#vf .tf .bar2{height:12px;background:#120e0c;box-shadow:0 0 0 2px #0d0b0a,0 0 0 3px #5a4a33;position:relative;margin-top:4px}
#vf .chip{position:relative;white-space:nowrap;display:flex;align-items:center;gap:6px;padding:4px 10px;font-size:12px;letter-spacing:.08em}
#vf .ph{display:none} @media (pointer:coarse),(max-width:700px),(max-height:520px){#vf .dk{display:none!important} #vf .ph{display:block} #vf .qp{left:10px!important;top:10px!important;max-width:210px!important;padding:6px 9px!important} #vf .qp div{font-size:13px!important} #vf .qp .lbl{font-size:10px!important} #vf .qp.bossup{display:none!important}}
#vf .bar{height:10px;background:#120e0c;box-shadow:0 0 0 2px #0d0b0a,0 0 0 3px #5a4a33;position:relative;margin-top:5px}
@keyframes vfin{from{opacity:0;transform:translateY(8px)}} @keyframes vftype{from{opacity:0;filter:blur(3px);letter-spacing:.04em}} @keyframes vffade{to{opacity:0}} @keyframes vfpulse{50%{opacity:.55}}
#vf .vfban{animation:vfban 4.2s ease forwards;padding:14px 10px 18px;background:radial-gradient(ellipse at center,rgba(10,9,14,.72) 0%,rgba(10,9,14,.45) 45%,transparent 72%)} @keyframes vfban{0%{opacity:0;filter:blur(3px)}12%{opacity:1;filter:none}78%{opacity:1}100%{opacity:0}}
#vf .vfdock{left:50%;bottom:0;transform:translateX(-50%);width:min(1240px,calc(100vw - 140px));aspect-ratio:1240/250;container-type:inline-size;pointer-events:none}
#vf .vfplate{position:absolute;left:18.2cqw;width:63.6cqw;top:3.4cqw;filter:drop-shadow(0 .4cqw .6cqw #000)}
#vf .vfsk{position:absolute;left:50%;top:11.4cqw;transform:translateX(-50%);display:flex;gap:.8cqw}
#vf .vfsk .slot{width:4.9cqw;height:4.9cqw;background:radial-gradient(#221d19,#0c0a09);box-shadow:0 0 0 .16cqw #0d0b0a,0 0 0 .32cqw #6b5638,0 0 0 .45cqw #0d0b0a,inset 0 0 .8cqw #000}
#vf .vfsk .slot .k{font-size:max(9px,.85cqw)} #vf .vfsk .slot .n{font-size:max(10px,1cqw)}
#vf .vforb{position:absolute;bottom:0;width:19.4cqw;aspect-ratio:1}
#vf .vfL{left:0} #vf .vfR{right:0}
#vf .vffr{position:absolute;inset:0;width:100%;height:100%;filter:drop-shadow(0 .3cqw .5cqw #000)}
#vf .vfR .vffr{transform:scaleX(-1)}
#vf .vfglobe{position:absolute;width:58%;aspect-ratio:1;left:57.5%;top:47.3%;transform:translate(-50%,-50%);border-radius:50%;overflow:hidden;background:radial-gradient(circle at 50% 60%,#140f0d,#050404 75%);box-shadow:inset 0 0 2cqw #000}
#vf .vfR .vfglobe{left:42.5%}
#vf .vfliq{position:absolute;left:-10%;right:-10%;bottom:0;transition:height .35s ease-out;background:radial-gradient(circle at 45% 25%,var(--a),var(--b) 55%,var(--c) 100%);box-shadow:inset 0 .3cqw .4cqw rgba(255,255,255,.18)}
#vf .vfliq::before,#vf .vfliq::after{content:"";position:absolute;left:0;width:200%;height:1.6cqw;top:-.8cqw;background:radial-gradient(ellipse 25% 50% at 25% 50%,var(--a) 60%,transparent 62%) 0 0/50% 100% repeat-x;opacity:.75;animation:vfwave 3.4s linear infinite}
#vf .vfliq::after{opacity:.45;animation-duration:5.1s;animation-direction:reverse;top:-.55cqw}
@keyframes vfwave{to{transform:translateX(-50%)}}
#vf .vfgl{position:absolute;inset:0;border-radius:50%;background:radial-gradient(circle at 34% 26%,rgba(255,255,255,.42),rgba(255,255,255,.06) 22%,transparent 34%),radial-gradient(circle at 60% 85%,rgba(255,255,255,.08),transparent 40%);box-shadow:inset 0 -1.2cqw 2cqw rgba(0,0,0,.6),inset 0 0 .4cqw rgba(0,0,0,.9)}
#vf .vfv{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:max(14px,1.9cqw);line-height:1;text-shadow:0 .15cqw 0 #000,0 0 .6cqw #000}
#vf .vfv small{font-size:max(8px,.75cqw);letter-spacing:.2em;color:#d8c69c;margin-top:.3cqw}
#vf .vfxp{position:absolute;left:27cqw;right:27cqw;top:6.4cqw;height:.75cqw;background:#0b0908;box-shadow:0 0 0 .14cqw #0d0b0a,0 0 0 .28cqw #6b5638}
#vf .vfxpf{position:absolute;left:0;top:0;bottom:0;background:linear-gradient(#e6cf8a,#a07a2c 60%,#5c4214);box-shadow:0 0 .6cqw rgba(242,211,138,.5);transition:width .4s}
#vf .vfxpt{position:absolute;inset:0;background:repeating-linear-gradient(90deg,transparent 0 calc(10% - 2px),#0d0b0a calc(10% - 2px) 10%)}
#vf .vfxpl{position:absolute;left:0;right:0;bottom:1.1cqw;font-size:max(10px,.9cqw);letter-spacing:.12em;color:#c9b88f;text-transform:uppercase}
</style>`;

// ---- title + the Bearer screen (character selection): drawn over the living camp, never a loading wall ----
const CDN = (h) => `/cdn/value.${h}.png`;
const CLASSES = [
  { id: "bladewraith", name: "Bladewraith", role: "Melee burst · guard-break", res: "Edge", img: CDN("1552ce71451180080c4bb9ccdeee8a943470179d762dbeb541ac018d80d15394"), fantasy: "A duelist who turns remembered regrets into precise swordplay.", skills: [["Ashcut", "basic strike, builds Edge"], ["Crosswound", "140° cleave for 30 Edge"], ["Griefstep", "7 m dash through harm"], ["Afterimage Guard", "catch a blow, riposte all near"]], open: true },
  { id: "soulweaver", name: "Soulweaver", role: "Ranged spell · support", res: "Resonance", img: CDN("06f9e024d84a3ca9283a701cb60689a35e1297dd46192608b059eefc3c205f11"), fantasy: "A memory-singer who weaves protective harmonics from chosen names.", skills: [["Pulse Thread", "bolt of memory-light, builds Edge"], ["Wound of Light", "RMB: a lance of light falls where you aim, 2.6 m burst"], ["Threadwalk", ""], ["Warding Chorus", ""]] },
  { id: "hellwarden", name: "Hellwarden", role: "Shield frontline · fire", res: "Resolve", img: CDN("8b5fc2d7eab1e92732ba85e82cddc5d09d79466e9608c0c1ae298b4bb240540e"), fantasy: "A covenant knight forged to shelter civilians during breaches.", skills: [["Cinder Strike", "heavy mace blow, builds Edge"], ["Furnace Sweep", "RMB: 140° fire cleave, foes burn 3 s"], ["Oath Charge", ""], ["Ember Bastion", ""]] },
  { id: "shadowmancer", name: "Shadowmancer", role: "Debuff · traps · control", res: "Shroud", img: CDN("1d3722f1f2b08fb094d253ae9840c060766126b4ef39d6301a64b30843461399"), fantasy: "A scholar of unchosen lives who bends reflections and occlusion.", skills: [["Gloam Needle", "shadow bolt, builds Edge"], ["Borrowed Shadow", "RMB: a pool of dark grips foes 3 s, slowing them"], ["Unseen Door", ""], ["Mirror Snare", ""]] },
  { id: "primalist", name: "Primalist", role: "Shapeshift · nature", res: "Pulse", img: CDN("b536c08e6c94cf5b5e0d26ab9080c9ffdd8bea0de2c28e3b4c5a7f26ba8da409"), fantasy: "A guardian whose body borrows endurance from living ecosystems.", skills: [["Rootlash", "claw swipe, builds Edge"], ["Stormhorn", "RMB: cleave that calls lightning on each foe"], ["Briar Leap", ""], ["Thornskin", ""]] },
  { id: "gloamstalker", name: "Gloamstalker", role: "Ranged precision · ambush", res: "Focus", img: CDN("bf53d127661ebfc83f336ce66ae7078c9cd4250378648a8c9b5d33fbbc1a8885"), fantasy: "A boundary scout tracking beasts created by lost memories.", skills: [["Bonearrow", "longbow shot, 14 m, builds Edge"], ["Glassbolt Volley", "RMB: five arrows loosed in a fan"], ["Silent Traverse", ""], ["Smoke Veil", ""]] },
];
// each calling standing full-body (cut-out of its model sheet), shown on the create screen
const FIG = {bladewraith: CDN("7c2b494c6665889a4f5b8c3336fab44612721a3c3bbd87820a0963165ad4d41f"), soulweaver: CDN("d8d5fac14ebdede7be5d55127282e9ba110fdee44f5cb563bf00cdcd0ccf5078"), hellwarden: CDN("b1bd2270be0fb1bbce2e4e3c74c45f66aa86f86da86bd25411c162028690e9f7"), shadowmancer: CDN("805eb1cf05de44786bec782cf205cb63d9a4e02b8bfdc5127aeed97dc09008ce"), primalist: CDN("0edd79eac9ede04d84fe96950b0a47b2c7ceddee3eaddec92c2c9738720c0c7d"), gloamstalker: CDN("7cc9007341f26fd5137a398e78b0aa6affcf335505ed251b25ce31089e162b8b")};
// the RMB signature per calling: its name and painted icon (Bladewraith keeps Crosswound)
const SIG_UI = {
  soulweaver: ["Wound of Light", "/cdn/value.9e967583ee96c778c369d2ef504b8fd4aeffa9867790e6eb67c9274217cb1399.png"],
  shadowmancer: ["Borrowed Shadow", "/cdn/value.314cbdeade8461844a36e0eb9b36df8d43090b8e7333bb38941e850769ebeb42.png"],
  gloamstalker: ["Glassbolt Volley", "/cdn/value.f978eecf96a06973bedf6297c1c4cdcd855751c475936c03b7290bada9d08f2e.png"],
  hellwarden: ["Furnace Sweep", "/cdn/value.e58d935877461b8db8f3a20fe809b2ec7485f6f4856732af0e5bb3f756348b38.png"],
  primalist: ["Stormhorn", "/cdn/value.bd31ee8c8c0cc282fb1dfb12eafaa93d2a1ca2bb0038b95c6178e4596100361b.png"],
};
const ANC = [
  { id: "cinderkin", name: "Cinderkin", home: "Ashwake Moor", color: "#aa4e3c", img: CDN("9c69f92c34a4b961e1acfac921f118e1871b170c627327df1c7094082d2216ea"), ethos: "Families inscribe the names of their lost into coal-fired clay.", trait: "Ember Ward: once a minute, the first blow you take is softened by up to 12." },
  { id: "fenborn", name: "Fenborn", home: "Gloamfen Reach", color: "#368783", img: CDN("657d460456caf2572c15e722fe7460d7b3ebc7e26991e41e7159cff6542564e4"), ethos: "Fenspeople keep reed tablets that hold a memory until the rain.", trait: "Mist Stride: move 30% faster for 1.5 s after every Griefstep." },
  { id: "stonebound", name: "Stonebound", home: "Underhollow Steps", color: "#ac9968", img: CDN("d6b87ccf4d5714f8d7067ab43ccee72b850c1c64257d5e290510bde5b8e44d86"), ethos: "Mountain clans carve genealogies into staircases, never statues.", trait: "Carved Stance: heavy blows (15+) land 25% lighter." },
  { id: "skyforged", name: "Skyforged", home: "Gale Spires", color: "#819ec4", img: CDN("8ef7be812171fb7a2dc3ef03c904c365e54475469f2973b75bdffd4170688f96"), ethos: "Cliff dwellers play their histories on funeral wind instruments.", trait: "Gust Return: every Griefstep restores 10 Edge." },
];
const HOV = `sendAction('menu',{a:'hover',n:Date.now()})`;
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
#vm .det .big{height:min(300px,30vh);margin:-14px -16px 10px;overflow:hidden;position:relative} #vm .det .big img{width:100%;height:100%;object-fit:cover;object-position:50% 20%} #vm .det .big img.fig{position:absolute;left:0;top:4%;height:100%;object-fit:contain;object-position:50% 100%;filter:drop-shadow(0 0 14px rgba(0,0,0,.9)) drop-shadow(0 0 3px rgba(231,217,184,.25));animation:vfig 4.5s ease-in-out infinite;transform-origin:50% 100%} @keyframes vfig{0%,100%{transform:scale(1)}50%{transform:scale(1.012,1.018)}}
@keyframes vmin{from{opacity:0;transform:translateY(10px)}} @keyframes vmglow{50%{text-shadow:2px 2px 0 #0d0b0a,0 0 26px rgba(240,140,60,.55)}}
@media (pointer:coarse),(max-width:760px),(max-height:520px){
 #vm .wrap{left:8px;right:8px;top:8px;bottom:8px;flex-direction:column;gap:8px;overflow:auto}
 #vm .panel{padding:8px 10px} #vm .grid{grid-template-columns:repeat(3,1fr);gap:7px} #vm .grid .card{height:92px}
 #vm .anc img{width:40px;height:40px} #vm .anc span{font-size:9px}
 #vm .det{width:auto} #vm .det .big{display:none} #vm .det .sk{display:none} #vm .btn{min-width:0;font-size:15px;padding:10px 14px}
 #vm .tb{bottom:auto!important;top:33%}
}
@media (max-height:520px){
 #vm .tb{top:auto!important;bottom:8px!important} #vm .tb .foot,#vm .tline{display:none} #vm .tb .lbl{margin:2px 0!important} #vm .tb .btn{padding-top:7px!important;padding-bottom:7px!important}
}
@media (pointer:coarse),(max-width:760px),(max-height:520px){ #vm .qt{padding:0 64px 0 24px!important;font-size:12px!important} #vm .wrap{right:62px} #vm .ttl{font-size:46px!important} #vm .sub{font-size:14px!important}
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
@media (pointer:coarse),(max-width:760px),(max-height:520px){
 #vm .side{width:auto;max-height:none} #vm .mid{display:none} #vm .row{padding:6px 8px;margin-top:6px} #vm .row img{width:36px;height:36px} #vm .row .t{font-size:15px}
 #vm .msg{bottom:auto;top:8px;max-width:calc(100vw - 90px)} #vm .namebox{font-size:18px}
}
</style>`;
const FONT = (n, h, w = "400 900") => `@font-face{font-family:'${n}';src:url(/cdn/value.${h}.ttf);font-weight:${w};font-display:swap}`;
const CREST = "/cdn/value.e5c8c1c327ab59446dbe79af31ecdeed39c39e210ab8e7cd8d525f94c4827c9d.png";
const VT = `<style>
${FONT("VCinzel", "f4d83d34d1f6c741193e4acf4b3dff9531e5a67b6aa65228d00a7db72a4e0f34")}${FONT("VDeco", "e854e68a388aa50d742a4415c1ae5c17a617ef7956c95a70021d0a4a44f20518", "700")}${FONT("VGara", "b20b7d9626dd956b2c5e558692ad328b1f19e3275e2782db4fa07670d83f35e0", "300 700")}
#vm{font-family:'VGara',Georgia,serif;font-size:17px}
#vm .lbl,#vm .btn,#vm .mini,#vm .t,#vm .nm,#vm .anc span,#vm .namebox{font-family:'VCinzel',Georgia,serif}
#vm .lbl{font-weight:600}
#vm .btn{font-weight:700;letter-spacing:.16em}
#vm .gold{background:linear-gradient(180deg,#fff3cf 0%,#f2d38a 28%,#b8863e 52%,#6e4a1f 56%,#c99a52 74%,#f7e2a6 100%);-webkit-background-clip:text;background-clip:text;color:transparent;text-shadow:none;filter:drop-shadow(0 2px 0 #1a0f08) drop-shadow(0 0 18px rgba(240,140,60,.35))}
#vm .h1{font-family:'VCinzel',serif;font-weight:700;letter-spacing:.14em}
/* title */
#vt{position:absolute;inset:0;pointer-events:none}
#vt .shade{position:absolute;inset:0;background:linear-gradient(90deg,rgba(5,5,8,.88) 0%,rgba(5,5,8,.55) 26%,transparent 46%),linear-gradient(0deg,rgba(5,5,8,.8) 0%,transparent 28%),linear-gradient(180deg,rgba(5,5,8,.6) 0%,transparent 22%)}
#vt .logo{position:absolute;left:50%;top:2.5vh;transform:translateX(-50%);width:min(600px,40vw);text-align:center;animation:vtin 1.6s ease both}
#vt .crest{width:100%;display:block;filter:drop-shadow(0 6px 14px rgba(0,0,0,.8)) drop-shadow(0 0 30px rgba(255,150,60,.18));animation:vtbreathe 6s ease-in-out infinite}
#vt .word{margin-top:-9%;font-family:'VDeco','VCinzel',serif;font-weight:700;font-size:clamp(52px,6vw,112px);letter-spacing:.08em;line-height:1}
#vt .subt{white-space:nowrap;display:flex;align-items:center;justify-content:center;gap:14px;margin-top:6px;font-family:'VCinzel',serif;font-weight:600;font-size:clamp(13px,1.15vw,19px);letter-spacing:.55em;color:#c49c63;text-indent:.55em}
#vt .subt i{flex:0 0 clamp(40px,7vw,120px);height:1px;background:linear-gradient(90deg,transparent,#c49c63)} #vt .subt i:last-child{transform:scaleX(-1)}
#vt .subt b{width:7px;height:7px;transform:rotate(45deg);background:#ac4c42;box-shadow:0 0 8px #ff7a3a;flex:none}
#vt .menu{position:absolute;left:clamp(24px,6vw,120px);top:50%;transform:translateY(-38%);width:min(380px,34vw);pointer-events:auto;animation:vtside 1.2s .3s ease both}
#vt .menu .cap{font-family:'VCinzel',serif;font-size:12px;letter-spacing:.4em;color:#8f7d5c;margin-bottom:10px}
#vt .it{position:relative;display:block;width:100%;text-align:left;background:none;border:0;cursor:pointer;padding:12px 0 12px 34px;font-family:'VCinzel',serif;font-weight:700;font-size:clamp(18px,1.55vw,26px);letter-spacing:.14em;text-transform:uppercase;color:#cdbf9f;text-shadow:0 2px 0 #0b0806,0 0 12px rgba(0,0,0,.9);transition:color .18s,letter-spacing .25s,padding .2s}
#vt .it::before{content:"";position:absolute;left:6px;top:50%;width:9px;height:9px;margin-top:-5px;transform:rotate(45deg) scale(.4);border:1px solid #c49c63;opacity:0;transition:all .2s}
#vt .it::after{content:"";position:absolute;left:34px;right:20%;bottom:6px;height:1px;background:linear-gradient(90deg,#f2d38a,rgba(172,76,66,.6),transparent);transform:scaleX(0);transform-origin:left;transition:transform .3s}
#vt .it:hover{color:#ffe7b0;padding-left:40px;text-shadow:0 2px 0 #0b0806,0 0 18px rgba(255,160,70,.55)}
#vt .it:hover::before{opacity:1;transform:rotate(45deg) scale(1);background:#ac4c42;box-shadow:0 0 10px #ff7a3a}
#vt .it:hover::after{transform:scaleX(1)}
#vt .it.main{color:#f2d38a;font-size:clamp(21px,1.9vw,32px)}
#vt .it.main::before{opacity:.9;transform:rotate(45deg) scale(.8);background:#ac4c42;box-shadow:0 0 10px #ff7a3a}
#vt .it .sub{display:block;font-family:'VGara',serif;font-weight:500;font-size:14px;letter-spacing:.04em;text-transform:none;color:#9c8b6b;margin-top:2px}
#vt .rule{height:1px;margin:6px 0 6px 34px;background:linear-gradient(90deg,rgba(196,156,99,.55),transparent)}
#vt .chron{position:absolute;right:calc(var(--spawn-chrome-reservation-right-inset,50px) + 34px);bottom:11vh;width:min(330px,22vw);pointer-events:auto;padding:18px 20px 16px;background:linear-gradient(180deg,rgba(22,18,16,.88),rgba(10,9,8,.92));box-shadow:inset 0 0 0 1px rgba(196,156,99,.35),inset 0 0 0 4px rgba(10,8,6,.9),inset 0 0 0 5px rgba(196,156,99,.18),0 10px 30px rgba(0,0,0,.6);animation:vtin 1.4s .6s ease both}
#vt .chron::before,#vt .chron::after{content:"";position:absolute;width:14px;height:14px;border:2px solid #c49c63;opacity:.8}
#vt .chron::before{left:-3px;top:-3px;border-right:0;border-bottom:0} #vt .chron::after{right:-3px;bottom:-3px;border-left:0;border-top:0}
#vt .chron h4{margin:0 0 4px;font-family:'VCinzel',serif;font-size:13px;letter-spacing:.35em;color:#c49c63;font-weight:700}
#vt .ch{display:flex;gap:12px;align-items:baseline;padding:7px 0;border-top:1px solid rgba(196,156,99,.14)}
#vt .ch .n{font-family:'VDeco',serif;font-size:15px;color:#ac4c42;width:22px;flex:none;text-align:center}
#vt .ch .tt{font-family:'VCinzel',serif;font-size:13px;font-weight:700;letter-spacing:.06em;color:#e7d9b8} #vt .ch .dd{font-size:13px;color:#9c8b6b;line-height:1.25}
#vt .ch.new .tt::after{content:"NEW";margin-left:8px;font-size:9px;letter-spacing:.2em;color:#ffcf7a;padding:1px 5px;box-shadow:inset 0 0 0 1px rgba(255,180,90,.6)}
#vt .foot{position:absolute;left:clamp(24px,6vw,120px);bottom:3.2vh;font-family:'VCinzel',serif;font-size:11px;letter-spacing:.28em;color:#6f6250}
#vt .foot b{color:#6db8c0;font-weight:600} #vt .foot .dot{display:inline-block;width:6px;height:6px;border-radius:50%;background:#6db8c0;box-shadow:0 0 8px #6db8c0;margin:0 6px 1px 0;animation:vtpulse 2.4s infinite}
#vt .quote{position:absolute;left:50%;bottom:6.8vh;transform:translateX(-50%);width:min(560px,40vw);text-align:center;font-style:italic;font-size:16px;color:#a8977a;text-shadow:0 2px 6px #000}
#vt .em{position:absolute;bottom:-10px;width:3px;height:3px;border-radius:50%;background:#ffb862;box-shadow:0 0 6px 2px rgba(255,130,40,.7);opacity:0;animation:vtember linear infinite}
@keyframes vtember{0%{opacity:0;transform:translate(0,0)}10%{opacity:.9}70%{opacity:.6}100%{opacity:0;transform:translate(var(--dx),-85vh)}}
@keyframes vtin{from{opacity:0;filter:blur(4px)}to{opacity:1;filter:none}}
@keyframes vtside{from{opacity:0;transform:translate(-24px,-38%)}to{opacity:1;transform:translateY(-38%)}}
@keyframes vtbreathe{50%{filter:drop-shadow(0 6px 14px rgba(0,0,0,.8)) drop-shadow(0 0 44px rgba(255,150,60,.32))}}
@keyframes vtpulse{50%{opacity:.35}}
@media (pointer:coarse),(max-width:760px),(max-height:520px){
 #vt .logo{width:min(380px,70vw);top:1vh} #vt .menu{left:16px;width:calc(100vw - 110px);top:auto;bottom:12px;transform:none;animation:none}
 #vt .chron,#vt .quote,#vt .em{display:none} #vt .it{padding:7px 0 7px 28px} #vt .it .sub{font-size:12px} #vt .foot{display:none}
 #vt .shade{background:linear-gradient(0deg,rgba(5,5,8,.9) 0%,rgba(5,5,8,.4) 45%,transparent 70%)}
}
@media (max-height:520px){#vt .logo{width:min(260px,40vw)} #vt .word{font-size:40px} #vt .subt{display:none}}
</style>`;
// the menu screens past the title: gilded frames over the pixel kit (the kit still dresses the in-game HUD)
const VM2 = `<style>
#vm#vm .panel,#vm#vm .btn,#vm#vm .row,#vm#vm .card,#vm#vm .anc,#vm#vm .namebox,#vm#vm .mini{isolation:auto}
#vm#vm .panel::before,#vm#vm .panel::after,#vm#vm .btn::before,#vm#vm .btn::after,#vm#vm .row::before,#vm#vm .row::after,#vm#vm .card::before,#vm#vm .card::after,#vm#vm .anc::before,#vm#vm .anc::after,#vm#vm .namebox::before,#vm#vm .namebox::after,#vm#vm .mini::before,#vm#vm .mini::after{border-image:none!important;filter:none!important;border:0!important;inset:auto;content:none}
#vm#vm .panel{padding:20px 22px!important;background:linear-gradient(180deg,rgba(24,20,17,.93),rgba(10,9,8,.95))!important;box-shadow:inset 0 0 0 1px rgba(196,156,99,.42),inset 0 0 0 4px rgba(10,8,6,.92),inset 0 0 0 5px rgba(196,156,99,.2),0 14px 40px rgba(0,0,0,.65)!important}
#vm#vm .panel::before,#vm#vm .panel::after{content:"";position:absolute;width:18px;height:18px;opacity:.9;z-index:1;border:2px solid #c49c63!important}
#vm#vm .panel::before{left:-4px;top:-4px;border-right:0!important;border-bottom:0!important} #vm#vm .panel::after{right:-4px;bottom:-4px;border-left:0!important;border-top:0!important}
#vm#vm .panel.msg{padding:10px 18px!important}
#vm#vm .btn{position:relative;padding:11px 26px!important;font-size:15px;letter-spacing:.2em;color:#e7d9b8;background:linear-gradient(180deg,#2a221c,#120e0b)!important;box-shadow:inset 0 0 0 1px rgba(196,156,99,.55),inset 0 1px 0 2px rgba(255,230,180,.06),0 4px 12px rgba(0,0,0,.6)!important}
#vm#vm .btn:not([disabled]):hover{color:#ffe7b0!important;box-shadow:inset 0 0 0 1px #f2d38a,inset 0 0 18px rgba(255,170,80,.18),0 0 16px rgba(255,150,60,.25)!important;transform:none}
#vm#vm .btn::before,#vm#vm .btn::after{content:"";position:absolute;top:50%;width:7px;height:7px;margin-top:-4px;transform:rotate(45deg);background:#c49c63;box-shadow:0 0 0 2px #0d0b0a}
#vm#vm .btn::before{left:-4px} #vm#vm .btn::after{right:-4px}
#vm#vm .btn.main{font-size:19px;padding:15px 30px!important;color:#ffe9bd;text-shadow:0 2px 0 #3a0d06,0 0 14px rgba(255,140,60,.6);background:linear-gradient(180deg,#8e2a1c 0%,#5a160d 48%,#3a0d07 52%,#5c1a10 100%)!important;box-shadow:inset 0 0 0 1px #f2c27a,inset 0 0 0 3px rgba(40,8,4,.8),inset 0 0 0 4px rgba(242,194,122,.35),0 0 26px rgba(220,80,40,.35),0 6px 16px rgba(0,0,0,.7)!important}
#vm#vm .btn.main:hover{background:linear-gradient(180deg,#a8331f 0%,#6c1b0f 48%,#45100a 52%,#6e2014 100%)!important}
#vm#vm .btn.main::before,#vm#vm .btn.main::after{background:#f2c27a;box-shadow:0 0 0 2px #2a0905,0 0 10px #ff8a40}
#vm#vm .btn[disabled]{color:#6e655a;background:linear-gradient(180deg,#1c1815,#100d0b)!important}
#vm#vm .btn[disabled]::before,#vm#vm .btn[disabled]::after{background:#4e4434}
#vm#vm .mini{padding:6px 12px!important;background:#1a1512!important;box-shadow:inset 0 0 0 1px rgba(196,156,99,.5)!important;font-size:11px}
#vm#vm .mini:hover{color:#ffe7b0;box-shadow:inset 0 0 0 1px #f2d38a!important}
#vm#vm .row{padding:10px 12px 10px 10px!important;margin-top:8px;background:linear-gradient(90deg,rgba(30,24,20,.95),rgba(16,13,11,.85))!important;box-shadow:inset 0 0 0 1px rgba(196,156,99,.22)!important;transition:all .18s}
#vm#vm .row:hover{transform:translateX(4px);box-shadow:inset 0 0 0 1px rgba(242,211,138,.55)!important}
#vm#vm .row.on{background:linear-gradient(90deg,rgba(110,34,20,.55),rgba(30,20,16,.9) 60%)!important;box-shadow:inset 0 0 0 1px #f2d38a,inset 3px 0 0 0 #ff9a4a,0 0 18px rgba(255,140,60,.2)!important}
#vm#vm .row img{width:54px;height:54px;border-radius:50%;object-position:50% 18%;box-shadow:0 0 0 2px #0d0b0a,0 0 0 3px #c49c63,0 0 0 5px #0d0b0a}
#vm#vm .row.on img{box-shadow:0 0 0 2px #0d0b0a,0 0 0 3px #f2d38a,0 0 14px 4px rgba(255,140,60,.45)}
#vm#vm .row .t{font-size:17px;font-weight:700;letter-spacing:.06em;color:#f2d38a}
#vm#vm .card{background:#0d0a08!important;box-shadow:inset 0 0 0 1px rgba(196,156,99,.4),0 6px 14px rgba(0,0,0,.6)!important;transition:all .18s}
#vm#vm .card::after{content:"";position:absolute;inset:0;box-shadow:inset 0 0 0 1px rgba(196,156,99,.4),inset 0 -60px 40px -20px rgba(0,0,0,.85);z-index:2}
#vm#vm .card:hover{transform:translateY(-3px)} #vm#vm .card.on{box-shadow:0 0 0 1px #f2d38a,0 0 0 3px #0d0b0a,0 0 0 4px rgba(242,211,138,.5),0 0 24px rgba(255,140,60,.35)!important}
#vm#vm .card .nm{font-weight:700;letter-spacing:.08em;font-size:12px;color:#e7d9b8} #vm#vm .card.on .nm{color:#ffe7b0}
#vm#vm .anc{opacity:.55} #vm#vm .anc.on{opacity:1} #vm#vm .anc:hover{opacity:.9}
#vm#vm .anc img{box-shadow:0 0 0 2px #0d0b0a,0 0 0 3px #8f7d5c,0 0 0 5px #0d0b0a} #vm#vm .anc.on img{box-shadow:0 0 0 2px #0d0b0a,0 0 0 3px var(--c),0 0 0 5px #0d0b0a,0 0 20px var(--c)}
#vm#vm .namebox{padding:10px 12px!important;background:linear-gradient(180deg,#0c0a08,#17120f)!important;box-shadow:inset 0 0 0 1px rgba(196,156,99,.45),inset 0 2px 8px rgba(0,0,0,.8)!important;font-family:'VCinzel',serif;font-weight:700;letter-spacing:.05em}
#vm .det .big{height:min(340px,34vh)!important;margin:-20px -22px 12px!important;box-shadow:inset 0 -1px 0 rgba(196,156,99,.35)}
#vm .det .big img{transition:transform 6s ease} #vm .det:hover .big img{transform:scale(1.04)}
#vm .bname{font-family:'VCinzel',serif;font-weight:700;font-size:32px;letter-spacing:.06em;line-height:1.05}
#vm .stats{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;margin:12px 0 4px;background:rgba(196,156,99,.25);box-shadow:0 0 0 1px rgba(196,156,99,.25)}
#vm .stats>div{background:#100d0b;padding:7px 6px;text-align:center} #vm .stats b{display:block;font-family:'VCinzel',serif;font-size:18px;color:#f2d38a} #vm .stats span{font-family:'VCinzel',serif;font-size:9px;letter-spacing:.2em;color:#8f7d5c}
#vm .sec{display:flex;align-items:center;gap:10px;font-family:'VCinzel',serif;font-weight:700;font-size:13px;letter-spacing:.3em;color:#c49c63;margin:14px 0 10px}
#vm .sec::after{content:"";flex:1;height:1px;background:linear-gradient(90deg,rgba(196,156,99,.55),transparent)}
#vm .sec::before{content:"";width:6px;height:6px;transform:rotate(45deg);background:#ac4c42;box-shadow:0 0 6px #ff7a3a}
@media (pointer:coarse),(max-width:760px),(max-height:520px){#vm#vm .panel{padding:12px 14px!important} #vm .bname{font-size:22px} #vm#vm .row img{width:38px;height:38px} #vm#vm .btn.main{font-size:16px;padding:11px 18px!important}}
</style>`;
const EMBERS = Array.from({ length: 22 }, (_, i) => { const r = (k) => ((Math.sin(i * 12.9898 + k * 78.233) * 43758.5453) % 1 + 1) % 1;
  return `<i class="em" style="left:${(r(1) * 100).toFixed(1)}%;--dx:${((r(2) - .5) * 160).toFixed(0)}px;animation-duration:${(7 + r(3) * 9).toFixed(1)}s;animation-delay:-${(r(4) * 14).toFixed(1)}s;width:${(2 + r(5) * 3).toFixed(1)}px;height:${(2 + r(5) * 3).toFixed(1)}px"></i>`; }).join("");
const CHRONICLE = [
  ["I", "The Broken Lantern Road", "The Wayside Fire, the Wax Veil and the Bailiff's toll.", false, "/cdn/value.35895355142d7398daefa28f370f525c2e818836dbced03d4bc40a23eefc154e.png"],
  ["II", "Ashen Abbey · the Bell Crypt", "Down the nave to the great cracked bell."],
  ["III", "Lanternmere", "The drowned fen and its Warden."],
  ["IV", "Saint Corvin's Orchard", "Cut down the hanged. Face the Hangman."],
  ["V", "The Ossuary of Saint Ysolde", "Down the Bone Stair. Take her candle.", false, "/cdn/value.1a38646aae6877aa6c9b7845ba9905c1045dca51f41779fe0f0eede0f5b491d1.png"],
  ["VI", "Candlehold", "The last walled city. The Exchange keeps its ledgers.", true, "/cdn/value.492e4cea5c972b7a5b7b2eb399dbe1b59c4e31165dcabb65024f6575eb5bcf33.png"],
];
const VERSION = "0.14.0 · WISPS & WINTER";
// what changed, newest first: [version, title, date, [lines]]
const NOTES = [
  ["0.13.1", "Sharper Stone", "Oct 9", [
    ["HD Road & Walls", "The pilgrim road's flagstones, the soot-stained ashlar of every ruin and wall, the ash-dirt ground, rusted iron, rotten planks, candle wax, leather, bone, burial cloth, slate roofs, charred oak, granite, oak planks, moss and wrought iron are repainted at twice the resolution."],
    ["Dead Oaks", "The road's oaks grow buttress roots, furrowed bark, split crowns, last ember leaves and glowing shelf fungus."],
    ["Ferns & Brambles", "Ferns unfurl serrated fronds and fiddleheads; brambles carry hooked thorns, bronze leaves and black berries."]]],
  ["0.13", "Faces of the Veil", "Oct 9", [
    ["Unit Frames", "Your Bearer's portrait now sits top left, breathing in ember light with your level, life, resource and experience, and it flares red when you're struck."],
    ["Target Frame", "Strike a foe and its painted face and life bar appear beside yours. Elites wear a gold ring, and the melted fade to grey."],
    ["Talent Trees", "Press N. Every calling has three branches and six tiers, with one point per level and a capstone at the end of each path."],
    ["Character Sheet", "Press C for your Bearer at a glance: gear, damage, armor, crit and the talents that feed them."],
    ["HD Menu Art", "The road, the Abbey and the fen have been repainted at full resolution behind the menu."]]],
  ["0.12", "The Pilgrim Roads", "Oct 9", [
    ["Wayshrines", "Three travel stones wake at your touch: the Wayside Fire, Candlehold's gate and the Abbey yard. Blink between any you've lit for 10 copper."],
    ["The Candlehold Vault", "Dame Maudry Quill keeps a stash for every Bearer. 18 slots, with more shelves to rent for 50s, 2g and 5g."],
    ["Guild Chest", "One shared chest per guild per realm, under a teal banner beside the vault."],
    ["Blossom Avenue", "Pilgrims' Way is lined with emberblossoms, lantern lilies and bell spires, and petals fall on the road to the capital."]]],
  ["0.11", "Blossom & Blade", "Oct 9", [
    ["Ser Hollin Vey", "The Bladewraith trainer stands in Candlehold square. Copper buys ranks of Crosswound, Griefstep and Afterimage Guard as you level."],
    ["Emberblossoms", "Four blossom trees ring the fountain, and bellspires, starblooms and lantern lilies spread through the grass."],
    ["The Abbess's Candle", "Carry her wax and the braziers you pass gutter cold blue."]]],
  ["0.10", "Candlehold", "Oct 8", [
    ["The Capital", "Candlehold rises south of the Wayside Fire along Pilgrims' Way, with a walled square, a fountain and the Exchange."],
    ["The Exchange", "The realm's trade board, shared with the camp's Pilgrims' Board."]]],
];
// the painting behind the menu: where the chosen Bearer will wake
const zoneArt = (z = "") => /ossuar|bone|crypt|nave|abbey/i.test(z) ? "/cdn/value.b6a6c4bee6be2736fec3fd5860ead524d72b84ff480b162a209ffc92c7f0c464.png" : /candle|pilgrim|fire|wayside/i.test(z) || !z ? "/cdn/value.38ae26e1659a5e6f4ff2b2d4270a529681fc2e1b5af4fb3a7693086f78166e47.png" : "/cdn/value.8b2fa0e0b93048049083a83e5dde8dd39352ef8c91625b3ef4b6f1989382dac6.png";
const head = (s) => `${MSTYLE}${MX}${FRAME_CSS}${VT}${VM2}<div id="vm"><div class="veil" style="background:radial-gradient(ellipse at 50% 50%,transparent 30%,rgba(6,7,12,.45) 65%,rgba(4,4,8,.85))"></div>`;
const tail = (s, now) => `${s.busy ? `<div class="panel msg" style="color:#f2d38a">${s.busy}…</div>` : s.msg && now - s.msg.at < 5000 ? `<div class="panel msg">${s.msg.text}</div>` : ""}</div>`;
const realmName = (room) => R.realms.find((r) => r.room === room)?.name ?? room;
const ago = (now, t) => { const m = Math.floor((now - t) / 60000); return m < 2 ? "just now" : m < 60 ? `${m} min ago` : m < 2880 ? `${Math.floor(m / 60)} h ago` : `${Math.floor(m / 1440)} days ago`; };

function menu(ctx, player, s) {
  const now = ctx.now(), here = s.roster?.realm ?? "main";
  if (s.menu === "title") {
    const last = (s.roster?.chars ?? []).find((c) => c.id === s.sel);
    const lk = last && (CLASSES.find((c) => c.id === last.cls) ?? CLASSES[0]);
    return `${head(s)}<style>#vt .zart{position:absolute;inset:0;background-size:cover;background-position:center;opacity:.5;filter:saturate(.9) contrast(1.08);image-rendering:high-quality;mask-image:radial-gradient(ellipse at 62% 45%,#000 25%,transparent 75%);-webkit-mask-image:radial-gradient(ellipse at 62% 45%,#000 25%,transparent 75%);animation:zdrift 40s ease-in-out infinite alternate;pointer-events:none}@keyframes zdrift{from{transform:scale(1.04) translate(0,0)}to{transform:scale(1.1) translate(-1.5%,-1%)}}#vt .ch .art{width:64px;height:36px;border:1px solid #6b4a2a;background-size:cover;background-position:center;margin-left:auto;flex:none;box-shadow:0 0 8px #000}</style><div id="vt"><div class="zart" style="background-image:url(${zoneArt(last?.zone)})"></div><div class="shade"></div>${s.opt?.embers === false ? "" : EMBERS}
    <div class="logo"><img class="crest" src="${CREST}"><div class="word gold">VEILFALL</div><div class="subt"><i></i><b></b>ASHES OF THE NINE<b></b><i></i></div></div>
    <div class="menu"><div class="cap">THE LANTERN SHRINE</div>
      ${last ? `<button class="it main" onmouseenter="${HOV}" onclick="${act("enter")}">Continue<span class="sub">${last.name} · Level ${last.level} ${lk.name} · ${last.zone}</span></button><div class="rule"></div>` : ""}
      <button class="it ${last ? "" : "main"}" onmouseenter="${HOV}" onclick="${act("chars")}">${last ? "Bearers" : "Enter the Veil"}<span class="sub">${last ? "choose another, or write a new name" : "write your first Bearer"}</span></button>
      <button class="it" onmouseenter="${HOV}" onclick="${act("realms")}">Realms<span class="sub">${realmName(here)} · ${R.realms.length} roads</span></button>
      <button class="it" onmouseenter="${HOV}" onclick="${act("options")}">Options<span class="sub">interface, sound, the shrine</span></button>
      <button class="it" onmouseenter="${HOV}" onclick="${act("notes")}">Patch Notes<span class="sub">${VERSION.toLowerCase()} · what's new on the road</span></button>
    </div>
    <div class="chron"><h4>THE CHRONICLE</h4>${CHRONICLE.map(([n, t, d, nw, art]) => `<div class="ch ${nw ? "new" : ""}" style="display:flex;gap:8px;align-items:center"><div class="n">${n}</div><div><div class="tt">${t}</div><div class="dd">${d}</div></div>${art ? `<div class="art" style="background-image:url(${art})"></div>` : ""}</div>`).join("")}</div>
    <div class="quote">"Every book in this place is a person who no longer knows what they lost."</div>
    <div class="foot"><span class="dot"></span><b>${realmName(here).toUpperCase()}</b> · ONLINE · VEILFALL ${VERSION}</div>
  </div>${tail(s, now)}`;
  }

  if (s.menu === "notes") {
    return `${head(s)}<style>
#vm .pn{position:absolute;left:50%;top:50%;transform:translate(-50%,-48%);width:min(640px,calc(100vw - 140px));max-height:calc(100vh - 60px);display:flex;flex-direction:column;animation:vmin .45s}
#vm .pn .h1{font-size:40px;text-align:center}
#vm .pnb{pointer-events:auto;overflow:auto;margin-top:14px;padding:6px 24px 18px;background:linear-gradient(180deg,rgba(24,19,16,.95),rgba(11,9,8,.93));box-shadow:inset 0 0 0 1px rgba(196,156,99,.3),inset 0 0 0 5px rgba(0,0,0,.5),inset 0 0 0 6px rgba(196,156,99,.16),0 10px 30px rgba(0,0,0,.6)}
#vm .pv{display:flex;align-items:baseline;gap:12px;margin:18px 0 6px;padding-bottom:6px;border-bottom:1px solid rgba(196,156,99,.25)}
#vm .pv b{font-family:'VCinzel',serif;font-size:13px;letter-spacing:.2em;color:#8f7d5c} #vm .pv span{font-family:'VCinzel',serif;font-weight:700;font-size:20px;color:#e7d9b8;letter-spacing:.05em;flex:1} #vm .pv i{font-size:12px;color:#6b5c44}
#vm .pv.cur span{color:#f2d38a;text-shadow:0 0 12px rgba(255,150,60,.35)} #vm .pv.cur b{color:#d9a25a}
#vm .pl{display:flex;gap:10px;padding:6px 0} #vm .pl:before{content:"✦";color:#ac4c42;font-size:10px;margin-top:4px}
#vm .pl .t{font-family:'VCinzel',serif;font-size:14px;color:#e0c590;letter-spacing:.04em} #vm .pl .d{font-size:14px;color:#a8977a;line-height:1.4}
@media (pointer:coarse),(max-width:760px),(max-height:520px){#vm .pn{top:8px;transform:translateX(-50%);width:calc(100vw - 90px);max-height:calc(100vh - 16px)} #vm .pn .h1,#vm .pn .lbl.t{display:none}}
</style>
    <div class="pn"><div class="lbl t" style="text-align:center">The Lantern Shrine</div><div class="h1 gold">PATCH NOTES</div><div class="dv df5"></div>
      <div class="pnb">${NOTES.map(([v, t, d, lines], i) => `<div class="pv ${i ? "" : "cur"}"><b>${v}</b><span>${t}</span><i>${d}</i></div>${lines.map(([lt, ld]) => `<div class="pl"><div><div class="t">${lt}</div><div class="d">${ld}</div></div></div>`).join("")}`).join("")}</div>
      <div style="text-align:center;margin-top:14px"><button class="btn" style="margin:0;min-width:0;display:inline-block;pointer-events:auto" onmouseenter="${HOV}" onclick="${act("title")}">Back</button></div>
    </div>${tail(s, now)}`;
  }

  if (s.menu === "options") {
    const o = s.opt ?? {}, sc = o.scale ?? 1;
    const row = (k, name, desc, val, on) => `<div class="orow" onmouseenter="${HOV}" onclick="${act("opt", k)}"><div><div class="on">${name}</div><div class="od">${desc}</div></div><div class="ov ${on ? "lit" : ""}"><i>‹</i><b>${val}</b><i>›</i></div></div>`;
    return `${head(s)}<style>
#vm .opw{position:absolute;left:50%;top:50%;transform:translate(-50%,-46%);width:min(560px,calc(100vw - 140px));animation:vmin .45s}
#vm .opw .h1{font-size:40px;text-align:center}
#vm .opp{margin-top:16px;padding:10px 22px 18px;background:linear-gradient(180deg,rgba(24,19,16,.95),rgba(11,9,8,.93));box-shadow:inset 0 0 0 1px rgba(196,156,99,.3),inset 0 0 0 5px rgba(0,0,0,.5),inset 0 0 0 6px rgba(196,156,99,.16),0 10px 30px rgba(0,0,0,.6)}
#vm .osec{font-family:'VCinzel',serif;font-size:10px;letter-spacing:.3em;color:#8f7d5c;margin:16px 0 4px}
#vm .orow{pointer-events:auto;cursor:pointer;display:flex;justify-content:space-between;align-items:center;gap:16px;padding:10px 4px;border-bottom:1px solid rgba(196,156,99,.12);transition:background .2s}
#vm .orow:hover{background:linear-gradient(90deg,transparent,rgba(196,120,60,.12),transparent)}
#vm .orow .on{font-family:'VCinzel',serif;font-weight:700;font-size:17px;letter-spacing:.06em;color:#e7d9b8}
#vm .orow .od{font-size:14px;font-style:italic;color:#8f7d5c}
#vm .ov{display:flex;align-items:center;gap:10px;font-family:'VCinzel',serif;color:#a8977a;min-width:120px;justify-content:center;padding:5px 8px;box-shadow:inset 0 0 0 1px rgba(196,156,99,.25);background:rgba(0,0,0,.35)}
#vm .ov b{font-size:14px;letter-spacing:.12em;min-width:56px;text-align:center} #vm .ov i{font-style:normal;color:#6b5c44}
#vm .ov.lit{color:#f2d38a;box-shadow:inset 0 0 0 1px rgba(242,211,138,.55),0 0 12px rgba(255,150,60,.15)}
@media (pointer:coarse),(max-width:760px),(max-height:520px){#vm .opw{top:8px;transform:translateX(-50%);width:calc(100vw - 90px)} #vm .opw .h1,#vm .opw .lbl.t{display:none} #vm .orow .od{display:none}}
</style>
    <div class="opw"><div class="lbl t" style="text-align:center">The Lantern Shrine</div><div class="h1 gold">OPTIONS</div><div class="dv df5"></div>
      <div class="opp">
        <div class="osec">INTERFACE</div>
        ${row("scale", "Interface Scale", "the size of every plate on the road", Math.round(sc * 100) + "%", sc !== 1)}
        ${row("tracker", "Quest Tracker", "the chapter plate in the corner", o.tracker === false ? "HIDDEN" : "SHOWN", o.tracker !== false)}
        <div class="osec">SOUND</div>
        ${row("hoverSfx", "Menu Whispers", "stone whoosh when you hover an option", o.hoverSfx === false ? "OFF" : "ON", o.hoverSfx !== false)}
        <div class="osec">THE SHRINE</div>
        ${row("embers", "Drifting Embers", "ash rising past the title", o.embers === false ? "OFF" : "ON", o.embers !== false)}
      </div>
      <div style="text-align:center;margin-top:16px"><button class="btn" style="margin:0;min-width:0;display:inline-block" onmouseenter="${HOV}" onclick="${act("title")}">Back</button></div>
    </div>${tail(s, now)}`;
  }

  if (s.menu === "realms") {
    const per = s.roster?.per ?? {};
    const SIG = { main: "bae54bd7d6e007bbd3ad81038a1fc5c905b44db5f280a40a7f91cfd31fc06d73", "realm-ninth-bell": "62aee8104496614b99e22598ec1729f06c650ea4b05d627eccd3f99675b36f37", "realm-ashwake": "939f5a8a122e31d505a27904cc9c8f486e0eeb5b9519d60d06f38f4ef59bcb39", "realm-gloamfen": "d1828b1d7d2623e35a75aed4d3a3b697f87b055228c5584bb0db62755052870c" };
    return `${head(s)}<style>
#vm .rl{position:absolute;left:50%;top:50%;transform:translate(-50%,-46%);width:min(720px,calc(100vw - 140px));animation:vmin .45s}
#vm .rh{text-align:center;margin-bottom:18px} #vm .rh .h1{font-size:44px}
#vm .rr{pointer-events:auto;cursor:pointer;display:grid;grid-template-columns:76px 1fr 90px 90px;align-items:center;gap:16px;padding:12px 18px 12px 12px;margin-top:10px;background:linear-gradient(90deg,rgba(28,22,18,.94),rgba(12,10,9,.9));box-shadow:inset 0 0 0 1px rgba(196,156,99,.25),0 6px 18px rgba(0,0,0,.5);transition:all .2s}
#vm .rr:hover{transform:translateX(5px);box-shadow:inset 0 0 0 1px rgba(242,211,138,.6),0 6px 18px rgba(0,0,0,.5)}
#vm .rr.on{background:linear-gradient(90deg,rgba(110,34,20,.5),rgba(22,16,13,.92) 55%);box-shadow:inset 0 0 0 1px #f2d38a,inset 3px 0 0 #ff9a4a,0 0 24px rgba(255,140,60,.2)}
#vm .rr .sg{width:76px;height:76px;border-radius:50%;overflow:hidden;box-shadow:0 0 0 2px #0d0b0a,0 4px 10px rgba(0,0,0,.8);filter:saturate(.85) brightness(.85);transition:filter .2s}
#vm .rr .sg img{width:112%;height:112%;margin:-6%;object-fit:cover}
#vm .rr:hover .sg,#vm .rr.on .sg{filter:none;box-shadow:0 0 0 2px #0d0b0a,0 0 18px rgba(255,160,70,.45)}
#vm .rr .nm{font-family:'VCinzel',serif;font-weight:700;font-size:22px;letter-spacing:.08em;color:#f2d38a}
#vm .rr .ds{font-size:15px;font-style:italic;color:#a8977a;margin-top:2px}
#vm .rr .col{text-align:center;font-family:'VCinzel',serif} #vm .rr .col b{display:block;font-size:20px;color:#e7d9b8} #vm .rr .col span{font-size:9px;letter-spacing:.22em;color:#8f7d5c}
#vm .rr .st{font-size:10px;letter-spacing:.2em;color:#6db8c0} #vm .rr .st::before{content:"";display:inline-block;width:6px;height:6px;border-radius:50%;background:#6db8c0;box-shadow:0 0 8px #6db8c0;margin-right:6px;vertical-align:1px}
#vm .rr .here{font-size:9px;letter-spacing:.25em;color:#ffcf7a;padding:2px 6px;margin-left:10px;box-shadow:inset 0 0 0 1px rgba(255,180,90,.6);vertical-align:4px}
#vm .rfoot{display:flex;justify-content:space-between;align-items:center;margin-top:18px;font-size:14px;color:#8f7d5c;font-style:italic}
@media (pointer:coarse),(max-width:760px),(max-height:520px){#vm .rl{top:8px;transform:translateX(-50%);width:calc(100vw - 90px)} #vm .rh{display:none} #vm .rr{grid-template-columns:48px 1fr 54px;gap:10px;padding:8px} #vm .rr .sg{width:48px;height:48px} #vm .rr .nm{font-size:16px} #vm .rr .ds,#vm .rr .c2{display:none}}
</style>
    <div class="rl"><div class="rh"><div class="lbl">Choose a realm</div><div class="h1 gold">THE NINE ROADS</div><div class="dv df5"></div></div>
      ${R.realms.map((r) => `<div class="rr ${r.room === here ? "on" : ""}" onmouseenter="${HOV}" onclick="${act("realm", r.room)}">
        <div class="sg">${SIG[r.room] ? `<img src="/cdn/value.${SIG[r.room]}.png">` : ""}</div>
        <div><div class="nm">${r.name}${r.room === here ? `<span class="here">CURRENT</span>` : ""}</div><div class="ds">${r.note}</div></div>
        <div class="col c2"><div class="st">OPEN</div><span>${r.kind.toUpperCase()}</span></div>
        <div class="col"><b>${per[r.room] ?? 0}<span style="font-size:12px;letter-spacing:0">/${R.maxChars}</span></b><span>BEARERS</span></div></div>`).join("")}
      <div class="rfoot"><span>A Bearer is written into one realm and walks only there.</span><button class="btn" style="margin:0;min-width:0;display:inline-block" onmouseenter="${HOV}" onclick="${act("title")}">Back</button></div>
    </div>${tail(s, now)}`;
  }

  if (s.menu === "create") {
    const pk = s.pick ?? { anc: "cinderkin", cls: "bladewraith", name: "" };
    const C = CLASSES.find((c) => c.id === pk.cls) ?? CLASSES[0], A = ANC.find((a) => a.id === pk.anc) ?? ANC[0];
    return `${head(s)}
  <div class="wrap">
    <div class="panel" style="animation:vmin .4s">
      <div class="lbl">New Bearer · ${realmName(here)}</div><div class="dv df3"></div>
      <div class="sec">ANCESTRY</div>
      <div style="display:flex;gap:14px;justify-content:space-between">${ANC.map((a) => `<div class="anc ${a.id === A.id ? "on" : ""}" style="--c:${a.color};pointer-events:auto" onmouseenter="${HOV}" onclick="${act("anc", a.id)}"><img src="${a.img}"><span style="color:${a.id === A.id ? a.color : "#e9dfc8"}">${a.name.toUpperCase()}</span></div>`).join("")}</div>
      <div class="sec">CLASS</div>
      <div class="grid">${CLASSES.map((c) => `<div class="card ${c.id === C.id ? "on" : ""} ${c.open ? "" : "sealed"}" onmouseenter="${HOV}" onclick="${act("cls", c.id)}"><img src="${c.img}"><div class="nm">${c.name}</div>${c.open ? "" : `<div class="seal">SEALED</div>`}</div>`).join("")}</div>
    </div>
    <div class="panel det" style="animation:vmin .55s">
      <div class="big"><img src="${C.img}" style="${C.open ? "filter:brightness(.42) blur(1.5px)" : "filter:grayscale(.8) brightness(.3)"}"><div style="position:absolute;left:0;right:0;bottom:0;height:80px;background:linear-gradient(transparent,#1a1715)"></div>${FIG[C.id] ? `<img class="fig" src="${FIG[C.id]}" style="${C.open ? "" : "filter:grayscale(1) brightness(.45)"}">` : ""}</div>
      <div class="lbl">Name</div>
      <div class="namebox"><span>${pk.name}</span><button class="mini" onmouseenter="${HOV}" onclick="${act("reroll")}">ANOTHER NAME</button></div>
      <div class="bname gold" style="margin-top:10px">${C.name}</div>
      <div class="lbl">${C.role} · ${C.res}</div>
      <div style="font-size:14px;margin:6px 0 8px;line-height:1.35">${C.fantasy}</div>
      <div class="sk" style="display:grid;grid-template-columns:1fr 1fr;gap:4px 10px;font-size:12px;margin-bottom:8px">${C.skills.map(([n, d]) => `<div><span style="color:${C.open ? "#e9dfc8" : "#8a7f70"}">${n}</span>${d ? `<div style="color:#9a8e78;font-size:11px">${d}</div>` : ""}</div>`).join("")}</div>
      <div style="height:2px;background:linear-gradient(90deg,${A.color},transparent);margin:2px 0 8px"></div>
      <div style="font-size:16px;color:${A.color}">${A.name} <span class="lbl">of ${A.home}</span></div>
      <div style="font-size:12px;color:#b9a77f;margin:2px 0 4px;font-style:italic">${A.ethos}</div>
      <div style="font-size:13px;line-height:1.35">${A.trait}</div>
      ${C.open ? `<button class="btn main" style="margin-top:12px;min-width:0" onmouseenter="${HOV}" onclick="${act("create")}">Write the name</button>`
        : `<button class="btn" disabled style="margin-top:12px;min-width:0">Sealed · its trial comes later</button>`}
      <button class="btn" style="min-width:0;font-size:14px;padding:8px" onmouseenter="${HOV}" onclick="${act("chars")}">Back</button>
    </div>
  </div>${tail(s, now)}`;
  }

  // character select
  const chars = s.roster?.chars ?? [], sel = chars.find((c) => c.id === s.sel);
  const C = sel && (CLASSES.find((c) => c.id === sel.cls) ?? CLASSES[0]), A = sel && (ANC.find((a) => a.id === sel.ancestry) ?? ANC[0]);
  return `${head(s)}<div class="mid"><div class="lbl">Realm</div><div class="h1 gold" style="font-size:40px">${realmName(here).toUpperCase()}</div><div class="dv df0"></div></div>
  <div class="wrap">
    <div class="panel side" style="animation:vmin .4s">
      <div class="sec" style="margin-top:0">YOUR BEARERS <span style="color:#8f7d5c;letter-spacing:.1em">${chars.length}/${R.maxChars}</span></div>
      ${!s.roster ? `<div style="margin-top:10px;color:#b9a77f">Reading the realm's ledger…</div>`
        : chars.length ? chars.map((c) => { const k = CLASSES.find((x) => x.id === c.cls) ?? CLASSES[0], an = ANC.find((x) => x.id === c.ancestry) ?? ANC[0];
          return `<div class="row ${c.id === s.sel ? "on" : ""}" onmouseenter="${HOV}" onclick="${act("sel", c.id)}"><img src="${k.img}"><div style="flex:1;min-width:0"><div class="t">${c.name}</div><div class="d"><span style="color:${an.color}">${an.name}</span> ${k.name} · Lv ${c.level}</div><div class="d">${c.zone}</div></div></div>`; }).join("")
        : `<div style="margin-top:10px;font-size:14px;line-height:1.4;color:#b9a77f">No Bearer walks ${realmName(here)} in your name yet.</div>`}
      ${chars.length < R.maxChars ? `<button class="btn" style="min-width:0;font-size:15px;padding:9px;margin-top:14px" onmouseenter="${HOV}" onclick="${act("new")}">+ New Bearer</button>` : ""}
      <button class="btn" style="min-width:0;font-size:13px;padding:7px;margin-top:8px" onmouseenter="${HOV}" onclick="${act("realms")}">Change realm</button>
      <button class="btn" style="min-width:0;font-size:13px;padding:7px;margin-top:8px" onmouseenter="${HOV}" onclick="${act("title")}">Back</button>
    </div>
    ${sel ? `<div class="panel det" style="animation:vmin .5s">
      <div class="big"><img src="${C.img}"><div style="position:absolute;left:0;right:0;bottom:0;height:80px;background:linear-gradient(transparent,#1a1715)"></div></div>
      <div class="bname gold">${sel.name}</div>
      <div class="lbl" style="margin-top:4px"><span style="color:${A.color}">${A.name}</span> · ${C.name} · ${C.role}</div>
      <div class="stats"><div><b>${sel.level}</b><span>LEVEL</span></div><div><b style="font-size:13px;line-height:22px">${sel.zone}</b><span>WHERE</span></div><div><b style="font-size:13px;line-height:22px">${ago(now, sel.played_at)}</b><span>LAST WALKED</span></div></div>
      <div style="font-size:15px;font-style:italic;color:#a8977a;margin:8px 0 0;line-height:1.35">${C.fantasy}</div>
      <button class="btn main" style="margin-top:14px;min-width:0" onmouseenter="${HOV}" onclick="${act("enter")}">Enter the world</button>
      ${s.confirmDel === sel.id ? `<div style="margin-top:12px;font-size:13px;color:#d8442f;text-align:center">Unwrite ${sel.name} forever?</div>
        <div style="display:flex;gap:8px"><button class="btn" style="min-width:0;flex:1;font-size:13px;padding:7px;color:#d8442f" onmouseenter="${HOV}" onclick="${act("delete-yes")}">Unwrite</button><button class="btn" style="min-width:0;flex:1;font-size:13px;padding:7px" onmouseenter="${HOV}" onclick="${act("delete-no")}">Keep</button></div>`
        : `<button class="btn" style="min-width:0;font-size:12px;padding:6px;margin-top:10px;color:#9a8e78" onmouseenter="${HOV}" onclick="${act("delete")}">Delete Bearer</button>`}
    </div>` : ""}
  </div>${tail(s, now)}`;
}
let firstSeen = null;
const PORTRAITS = { Maelin: "/cdn/value.9b2ca380585d594996aa46048b8512b39fa6833033ee030624573e83f72ea96b.png", Oswin: "/cdn/value.90e281c6498bfb21ffee4d1f51afea300d3d58b948c66aaff56355f765ca2e17.png" };
function vfHud(ctx, player) {
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
  if (q.stage === 6) prog = ` ${Math.min(6, (s.kills ?? 0) - (q.killsAt ?? 0))}/6`;
  if (q.stage === 7) prog = ` ${(q.saints ?? []).length}/3`;
  if (q.stage === 14) prog = ` ${(q.stones ?? []).length}/3`;
  if (q.stage === 19) prog = ` ${(q.cut ?? []).length}/3`;
  const L = [0, 60, 150, 280, 450, 680, 960, 1300, 1750, 2300], lv = s.level ?? 1;
  const lo = L[lv - 1] ?? 0, hi = L[lv] ?? lo + 500, xpPct = Math.max(0, Math.min(100, (((s.xp ?? 0) - lo) / (hi - lo)) * 100));
  const rg = ctx.place.state.ringer, wd = ctx.place.state.warden, hg = ctx.place.state.hangman, ab = ctx.place.state.abbess, boss = rg && rg.engaged && !rg.dead ? rg : wd && wd.engaged && !wd.dead ? wd : hg && hg.engaged && !hg.dead ? hg : ab && ab.engaged && !ab.dead ? ab : ctx.place.state.boss;
  const dashLeft = Math.max(0, (s.dashReadyAt ?? 0) - now), dashPct = Math.min(100, (dashLeft / 3000) * 100);
  const touch = typeof matchMedia !== "undefined" && matchMedia("(pointer: coarse)").matches;
  const IC = {"ash": "/cdn/value.11ea8210258744da6aa7d65226e3fda61337efea5eb71fe047d65096b3dc053b.png", "cross": "/cdn/value.13d726eaf2133c0f3838076422f781f3068d081b31dbcd6d880212c2ddda7de3.png", "step": "/cdn/value.eecac6103d8be9ec4c6e6909f2dbd61c3fc4bda234bc585e389c850c1c74e3f3.png", "guard": "/cdn/value.02dc0fd2d6f126cd0a5fd2f2dbfc43058486b706d34ed8ffd30222d57c3d3490.png", "tonic": "/cdn/value.f4e985f51d72e39ecd4691f462076ba4a14206d864edb85895ea8ef710ceccfc.png", "pack": "/cdn/value.961ecd8b3ded845823729ea6364b6a1eb5e20e03cd1090dbdb1b4cda98a6872d.png"};
  const cdOver = (left, pct) => left > 0 ? `<div class="cd" style="height:${pct}%"></div><div class="cdn">${Math.ceil(left / 1000)}</div>` : "";
  const cwLeft = Math.max(0, (s.cwReadyAt ?? 0) - now), cwPct = Math.min(100, (cwLeft / (CB.crosswound.cd * 1000)) * 100);
  const guardLeft = Math.max(0, (s.guardReadyAt ?? 0) - now), guardPct = Math.min(100, guardLeft / 80), guardOn = (s.guardUntil ?? 0) > now;
  const foe = s.foe, foeOn = foe && !s.dead && (foe.gone ? now - foe.at < 1500 : s.target === foe.id || now - foe.at < 4000);
  const FOES = { walker: "Wax Walker", pilgrim: "Wax Pilgrim", deacon: "Wax Deacon", chandler: "The Tallow Chandler", cantor: "The Hollow Cantor", chorister: "Hollow Chorister", flagellant: "Tallow Flagellant", drowned: "Drowned Sailor", harpooner: "Harpoon Ghoul", barnacle: "Barnacle Knight", ferryman: "The Abyssal Ferryman", reaper: "Antler Reaper", marrowwolf: "Marrow Wolf", briarwitch: "Briar Witch", rootmother: "The Rootmother", gargoyle: "Chain Gargoyle", harpy: "Spire Harpy", inquisitor: "Masked Inquisitor", butcher: "The Crypt Butcher", ashrevenant: "Ash Revenant", cinderthrall: "Cinder Thrall", pyrepriest: "Pyre Priest", kilnwarden: "The Kiln Warden", deepghoul: "Deep Ghoul", lurker: "Hollow Lurker", crystalbrute: "Crystal Brute", broodmother: "The Broodmother", frostdead: "Frostbitten Pilgrim", rimewolf: "Rime Wolf", icewraith: "Ice Wraith", frostjarl: "The Frost Jarl" };
  const chips = [];
  if (guardOn) chips.push(`<div class="plate chip" style="color:#6DB8C0">◇ GUARDING</div>`);
  if ((s.hasteUntil ?? 0) > now) chips.push(`<div class="plate chip" style="color:#9fe0c8">» MIST STRIDE ${Math.ceil(((s.hasteUntil ?? 0) - now) / 1000)}s</div>`);
  if (s.brew && s.brew.until > now) { const D = BREW.brews[s.brew.id]; if (D) chips.push(`<div class="plate chip" style="color:${D.color}">${D.glyph} ${D.name.toUpperCase()} ${Math.ceil((s.brew.until - now) / 1000)}s</div>`); }
  if (boss && boss.engaged && !boss.dead && boss.fray) chips.push(`<div class="plate chip" style="color:#e0473a">✕ FRAY ×${boss.fray}</div>`);
  if (hpPct < 30 && (s.tonics ?? 0) > 0) chips.push(`<div class="plate chip" style="color:#e0473a;animation:vfpulse 1s infinite">♥ DRINK · ${touch ? "TONIC" : "Q"}</div>`);
  const ban = s.banner && now - s.banner.at < 4200 && !s.shop ? s.banner : null;
  const dlg = s.dialog && now - s.dialog.at < 9000 && !s.shop ? s.dialog : null;
  const rail = "calc(var(--spawn-chrome-reservation-right-inset, 50px) + 24px)";
  const OPT = s.opt ?? {};
  return `${THEME}${FRAME_CSS}<style>${PACK_CSS}#vf{zoom:${OPT.scale ?? 1}}${OPT.tracker === false ? "#vf .qp{display:none}" : ""}</style><div id="vf" class="fixed inset-0 pointer-events-none">
  <div class="absolute plate qp${boss && boss.engaged && !boss.dead ? " bossup" : ""}" style="left:24px;top:${touch ? 24 : 132}px;max-width:300px;animation:vfin .4s">
    <div class="lbl">${[9, 12, 16, 21, 22].includes(q.stage) ? "Chapter complete" : "Quest"} · ${q.stage >= 18 ? "The Second Lantern" : q.stage >= 13 ? "The Drowned Lantern" : q.stage >= 10 ? "The Ninth Bell" : q.stage >= 5 ? "The Ashen Abbey" : "Broken Lantern Road"}</div>
    <div style="font-size:19px;color:var(--wax)">${qt}</div><div class="dv df1"></div>
    <div style="font-size:15px">› ${qo}<span style="color:var(--wax)">${prog}</span></div>
  </div>
  ${boss && boss.engaged && !boss.dead ? `<div class="absolute bb" style="top:24px;left:50%;transform:translateX(-50%);width:min(520px,calc(100vw - 2*${rail}));text-align:center;animation:vfin .3s">
    <div style="font-size:20px;color:var(--wax);letter-spacing:.06em">${boss.name.toUpperCase()}</div><div class="dv d4"></div>
    <div style="display:flex;justify-content:center;gap:22px;margin:-2px 0 4px">${[1,2,3].map((n) => `<div style="width:6px;height:14px;border-radius:2px 2px 1px 1px;background:linear-gradient(#efe3c4,#b9a37a);position:relative;opacity:${boss.phase > n ? .35 : 1}">${boss.phase > n ? "" : `<div style="position:absolute;left:-2px;top:-9px;width:10px;height:10px;border-radius:50% 50% 45% 45%;background:radial-gradient(circle at 50% 70%,#fff3c2,#f09a3a 45%,rgba(224,71,58,0) 75%);animation:vfpulse ${0.8 + n * 0.13}s infinite"></div>`}</div>`).join("")}</div>
    <div style="height:18px;padding:3px;background:linear-gradient(#3a2f22,#1a1410);box-shadow:0 0 0 2px #0d0b0a,0 0 0 3px #8a6f45,0 0 0 5px #0d0b0a,0 6px 18px rgba(0,0,0,.7),0 0 24px rgba(201,64,47,.18);position:relative">
      <div style="position:relative;height:100%;background:#0e0a09;overflow:hidden;box-shadow:inset 0 2px 4px rgba(0,0,0,.9)">
        <div style="position:absolute;inset:0;width:${Math.max(0, boss.hp / boss.max) * 100}%;background:linear-gradient(#e7d9b8,#b49a6a);opacity:.75;transition:width .9s ease-in .45s"></div>
        <div style="position:absolute;inset:0;width:${Math.max(0, boss.hp / boss.max) * 100}%;background:linear-gradient(#e0533f 0%,#a8251a 45%,#5e0f0a 100%);transition:width .15s"><div style="position:absolute;inset:0 0 55% 0;background:linear-gradient(rgba(255,220,180,.28),rgba(255,220,180,0))"></div><div style="position:absolute;right:0;top:0;bottom:0;width:3px;background:#ffcf8a;box-shadow:0 0 8px 2px #f09a3a"></div></div>
        <div style="position:absolute;top:0;bottom:0;left:70%;width:2px;background:#0d0b0a;box-shadow:1px 0 0 #8a6f45"></div><div style="position:absolute;top:0;bottom:0;left:35%;width:2px;background:#0d0b0a;box-shadow:1px 0 0 #8a6f45"></div>
      </div>
      <div style="position:absolute;left:-12px;top:50%;width:14px;height:14px;transform:translateY(-50%) rotate(45deg);background:#1a1410;box-shadow:0 0 0 2px #8a6f45,0 0 0 4px #0d0b0a"></div><div style="position:absolute;right:-12px;top:50%;width:14px;height:14px;transform:translateY(-50%) rotate(45deg);background:#1a1410;box-shadow:0 0 0 2px #8a6f45,0 0 0 4px #0d0b0a"></div>
    </div><div class="lbl" style="margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:clamp(9px,1.6vw,12px)">${boss.hint ? boss.hint : boss.phase === 1 ? "PHASE I · wedge: get behind him · marked: step away" : boss.phase === 2 ? `PHASE II · break the ledger pillars (${boss.ledgers} lit)` : "PHASE III · arc, debt, then he falters"}${boss.fray ? ` · FRAY ×${boss.fray} (+${boss.fray * 10}% damage taken)` : ""}</div></div>` : ""}
  ${ban ? `<div id="ban${ban.at}" class="absolute vfban" style="left:50%;top:${touch ? "36vh" : "120px"};transform:translateX(-50%);width:min(520px,calc(100vw - 2*${rail}));text-align:center;pointer-events:none">
    ${ban.fresh ? `<div class="lbl" style="letter-spacing:.32em;color:#6DB8C0">AREA DISCOVERED</div>` : ""}
    <div style="font-size:clamp(22px,4vw,34px);letter-spacing:.14em;color:var(--wax);text-shadow:0 2px 0 #0d0b0a,0 0 18px rgba(196,156,99,.45)">${ban.name.toUpperCase()}</div>
    <div class="dv d${ban.fresh ? "f1" : "f0"}" style="width:min(100%,360px)"></div>
    <div style="font-size:14px;font-style:italic;color:#d9c9a6;text-shadow:0 1px 0 #0d0b0a">${ban.sub}</div></div>` : ""}
  ${dlg ? (() => { const m = /^([A-Z][\w' ]{1,22}):\s*(.*)$/s.exec(dlg.text); const who = m ? m[1] : null, line = m ? m[2] : dlg.text, face = who && PORTRAITS[who.split(" ")[0]];
    return `<div id="dlg${dlg.at}" class="absolute plate dl" style="left:50%;transform:translateX(-50%);bottom:${touch ? "210px" : "calc(min(1240px,100vw - 140px) * .25 + 16px)"};width:min(620px,calc(100vw - 2*${rail}));animation:vfin .35s;display:flex;gap:14px;align-items:flex-start">
    ${face ? `<div style="flex:none;width:${touch ? 56 : 84}px;height:${touch ? 56 : 84}px;background:url(${face}) center/cover;box-shadow:0 0 0 2px #0d0b0a,0 0 0 3px #8a6f45,0 0 0 5px #0d0b0a,0 0 18px rgba(240,154,58,.25)"></div>` : ""}
    <div style="flex:1;min-width:0">${who ? `<div class="lbl" style="color:#C49C63;letter-spacing:.22em;margin-bottom:3px">${who.toUpperCase()}</div>` : ""}<div style="font-size:${touch ? 15 : 17}px;line-height:1.4;${who ? "" : "font-style:italic;"}animation:vftype 1.4s ease-out">${line}</div><div class="dv d0" style="margin:8px 0 0"></div></div></div>`; })() : ""}
  ${touch ? "" : `<div class="absolute dk vfdock">
    <div class="vfxp"><div class="vfxpf" style="width:${xpPct}%"></div><div class="vfxpt"></div><div class="vfxpl">${s.charName ? s.charName + " · " : ""}Lv ${lv} ${s.ancestry ? s.ancestry[0].toUpperCase() + s.ancestry.slice(1) + " " : ""}${(CLASSES.find((c) => c.id === s.cls) ?? CLASSES[0]).name}<span style="float:right">${coinHTML(s.copper ?? 0, 13)}</span></div></div>
    <img class="vfplate" src="/cdn/value.e8bc2f79613acb57c0f363d4e17ea83780597a92f90841f1b5e99719f973d9bc.png">
    <div class="vforb vfL"><div class="vfglobe"><div class="vfliq" style="height:${hpPct}%;--a:#ff5a44;--b:#8f1710;--c:#3a0605${hpPct < 30 ? ";animation:vfpulse 1s infinite" : ""}"></div><div class="vfgl"></div><div class="vfv">${hp}<small>LIFE</small></div></div><img class="vffr" src="/cdn/value.af729622950e1658a4df89c76bd30887a4735628e38c2319318a050aa463a595.png"></div>
    <div class="vforb vfR"><div class="vfglobe"><div class="vfliq" style="height:${edge}%;--a:#ffc35a;--b:#a3520e;--c:#3b1a04"></div><div class="vfgl"></div><div class="vfv">${edge}<small>${((CLASSES.find((c) => c.id === s.cls) ?? CLASSES[0]).res ?? "Edge").toUpperCase()}</small></div></div><img class="vffr" src="/cdn/value.af729622950e1658a4df89c76bd30887a4735628e38c2319318a050aa463a595.png"></div>
    <div class="sk vfsk">
    <div class="slot" title="Ashcut"><img class="ic" src="${IC.ash}"><span class="k">LMB</span></div>
    <div class="slot ${edge < 30 || cwLeft ? "dim" : ""}" title="${(SIG_UI[s.cls] ?? ["Crosswound"])[0]} · 30 Edge"><img class="ic" src="${(SIG_UI[s.cls] ?? [0, IC.cross])[1]}"><span class="k">RMB</span><span class="n">30</span>${cdOver(cwLeft, cwPct)}</div>
    <div class="slot" title="Griefstep"><img class="ic" src="${IC.step}"><span class="k">SPC</span>${cdOver(dashLeft, dashPct)}</div>
    <div class="slot ${guardOn ? "ready" : ""}" title="Guard" style="${guardOn ? "box-shadow:0 0 0 2px #0d0b0a,0 0 14px 3px #6DB8C0" : ""}"><img class="ic" src="${IC.guard}"><span class="k">1</span>${cdOver(guardLeft, guardPct)}</div>
    <div class="slot ${(s.tonics ?? 0) ? "" : "dim"}" title="Ash Tonic"><img class="ic" src="${IC.tonic}"><span class="k">Q</span><span class="n">${s.tonics ?? 0}</span></div>
    <div class="slot" title="Pack" style="pointer-events:auto;cursor:pointer" onclick="sendAction('bag')"><img class="ic" src="${IC.pack}"><span class="k">I</span></div>
  </div></div>
  ${chips.length ? `<div class="absolute dk chips" style="left:50%;bottom:calc(min(1240px,100vw - 140px) * .25);transform:translateX(-50%);display:flex;gap:12px">${chips.join("")}</div>` : ""}`}
  ${touch && chips.length ? `<div class="absolute" style="left:10px;top:236px;display:flex;flex-direction:column;gap:6px">${chips.join("")}</div>` : ""}
  ${!touch ? unitFrames(s, { hp, max, hpPct, edge, lv, xpPct, foe, foeOn, now, FOES }) : ""}
  ${foeOn && touch ? `<div class="absolute plate tf" style="left:50%;top:${boss && boss.engaged && !boss.dead ? 168 : 24}px;transform:translateX(-50%);width:min(300px,calc(100vw - 2*${rail}));text-align:center;padding:10px 16px;animation:vfin .2s;${foe.gone ? "opacity:.6" : ""}">
    <div style="display:flex;align-items:baseline;justify-content:center;gap:8px"><span style="font-size:16px;color:${(foe.kind === "deacon" || foe.kind === "chandler" || foe.kind === "cantor" || foe.kind === "barnacle" || foe.kind === "ferryman" || foe.kind === "briarwitch" || foe.kind === "rootmother" || foe.kind === "inquisitor" || foe.kind === "butcher" || foe.kind === "pyrepriest" || foe.kind === "kilnwarden" || foe.kind === "crystalbrute" || foe.kind === "broodmother" || foe.kind === "icewraith" || foe.kind === "frostjarl") ? "#f2b04a" : "var(--wax)"};letter-spacing:.06em">${FOES[foe.kind] ?? "Wax Thing"}</span>${foe.kind === "deacon" ? `<span class="lbl" style="color:#f2b04a">ELITE</span>` : ""}</div>
    <div class="bar2"><div style="position:absolute;inset:0;width:${(foe.hp / foe.max) * 100}%;background:linear-gradient(#c9402f,#7a1610);transition:width .15s"></div><div style="position:absolute;inset:0;font-size:10px;line-height:12px;color:#e9dfc8;text-shadow:0 1px 0 #000">${foe.gone ? "MELTED" : `${foe.hp} / ${foe.max}`}</div></div></div>` : ""}
  <div class="absolute ph plate" style="left:10px;top:150px;width:170px;padding:2px 6px">
    <div class="lbl" style="font-size:10px">Bladewraith · Lv ${lv} · ${fmt(s.copper ?? 0)}</div>
    <div class="bar"><div style="position:absolute;inset:0;width:${hpPct}%;background:linear-gradient(#e0473a,#7d1410)${hpPct < 30 ? ";animation:vfpulse 1s infinite" : ""}"></div><div style="position:absolute;inset:0;font-size:9px;line-height:10px;text-align:center">${hp}</div></div>
    <div class="bar" style="height:6px"><div style="position:absolute;inset:0;width:${edge}%;background:linear-gradient(#f2b04a,#8a4a10)"></div></div>
    <div style="font-size:11px;margin-top:4px;color:#e0473a">♥ ${s.tonics ?? 0}</div>
  </div>
  <div class="absolute ph" style="left:190px;top:150px;pointer-events:auto" onclick="sendAction('bag')"><div class="slot" style="width:48px;height:40px;font-size:11px">PACK</div></div>
  ${q.stage === 0 || q.stage === 4 || q.stage === 9 || q.stage === 12 || q.stage === 16 || q.stage === 17 || q.stage === 21 ? `<div data-world-anchor="maelin" data-anchor-offset="0 2.3 0" style="font-size:30px;color:var(--wax);text-align:center;animation:vfpulse 1.4s infinite">!<div style="font-size:12px">MAELIN</div></div>` : ""}
  ${s.bagOpen ? packPanel(ctx, player, { rail, touch }) : ""}
  ${s.sheetOpen && !touch ? sheetPanel(s, lv, xpPct, L) : ""}
  ${s.treeOpen && !touch ? treePanel(s, lv) : ""}
  ${s.bagOpen && s.atBoard ? boardPanel(ctx, player, { rail: touch ? rail : "24px", touch }) : ""}
  ${s.atTrainer && !s.bagOpen && !s.shop ? trainPanel(s, touch, rail) : ""}
  ${s.atShrine && !s.bagOpen && !s.shop ? shrinePanel(s, touch, rail) : ""}
  ${s.shop ? shopPanel(ctx, player) : ""}
  ${s.dead ? `<div class="absolute inset-0" style="display:flex;align-items:center;justify-content:center;background:radial-gradient(transparent 30%,rgba(40,0,0,.6));animation:vfin .4s"><div class="kd" style="font-size:54px;color:#d8442f;letter-spacing:.1em">THE ROAD TAKES YOU</div></div>` : ""}
  ${now - firstSeen < 9000 && !touch ? `<div class="absolute inset-x-0 text-center dk" style="bottom:calc(min(1240px,100vw - 140px) * .25 + 24px);font-size:17px;padding:0 ${rail};animation:vffade 1s 8s forwards">Click to walk · click a foe to strike · Right-click Crosswound · Space Griefstep · Q tonic · I pack</div>` : ""}
</div>`;
}

// Ser Hollin Vey's ledger of arts: one row per skill, two ranks each, level-gated, paid in copper
function trainPanel(s, touch, rail) {
  const T = CB.trainer, lv = s.level ?? 1, cu = s.copper ?? 0;
  const rows = Object.entries(T.arts).map(([k, A]) => {
    const r = s.arts?.[k] ?? 0, next = A.ranks[r];
    const pips = A.ranks.map((_, i) => `<span style="display:inline-block;width:9px;height:9px;margin-right:3px;transform:rotate(45deg);border:1px solid #c49c63;background:${i < r ? "#c49c63" : "transparent"}"></span>`).join("");
    const ok = next && lv >= next.lvl && cu >= next.cost;
    const btn = !next ? `<span style="color:#6db8c0;font-size:11px">MASTERED</span>`
      : `<button style="pointer-events:auto;cursor:${ok ? "pointer" : "default"};padding:4px 10px;font-size:11px;letter-spacing:.08em;border:1px solid ${ok ? "#c49c63" : "#555"};color:${ok ? "#e7d9b8" : "#777"};background:${ok ? "linear-gradient(#3a2618,#1a120c)" : "#151519"}" ${ok ? `onclick="sendAction('train',{k:'${k}',n:Date.now()+Math.random()})"` : ""}>TRAIN</button>`;
    const need = next ? `<div style="font-size:10px;color:${lv >= next.lvl ? "#a99" : "#c96a5a"}">Lv ${next.lvl} · ${fmt(next.cost)}</div>` : "";
    return `<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-top:1px solid rgba(196,156,99,.2)">
      <div style="flex:1"><div style="font-size:14px;color:#e7d9b8">${A.name} <span style="margin-left:6px">${pips}</span></div><div style="font-size:10px;color:#9a917f">${A.per}</div>${need}</div>${btn}</div>`;
  }).join("");
  return `<div class="absolute plate tf" style="${touch ? `left:${rail};right:${rail};top:60px` : "right:24px;top:50%;transform:translateY(-50%);width:320px"};padding:12px 16px;animation:vfin .2s;pointer-events:auto">
    <div style="font-size:11px;letter-spacing:.2em;color:#c49c63">THE BLADEWRAITH'S ARTS</div>
    <div style="font-size:18px;color:#e7d9b8;margin:2px 0 6px">Ser Hollin Vey</div>${rows}
    <div style="font-size:10px;color:#9a917f;margin-top:6px">Purse: ${fmt(cu)} · Lv ${lv}</div></div>`;
}

// the wayshrine's road: every attuned shrine but this one, a copper toll each
function shrinePanel(s, touch, rail) {
  const W = CB.wayshrines, lit = s.shrines ?? [], here = W.list.find((w) => w.id === s.atShrine);
  const rows = W.list.filter((w) => w.id !== s.atShrine).map((w) => {
    const ok = lit.includes(w.id), afford = (s.copper ?? 0) >= W.cost;
    return `<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-top:1px solid rgba(109,184,192,.25)">
      <div style="flex:1"><div style="font-size:14px;color:${ok ? "#e7d9b8" : "#6a6670"}">${ok ? w.name : "Unlit shrine"}</div><div style="font-size:10px;color:#8a919a">${ok ? fmt(W.cost) : "touch it on the road to attune"}</div></div>
      ${ok ? `<button style="pointer-events:auto;cursor:pointer;padding:4px 10px;font-size:11px;letter-spacing:.08em;border:1px solid ${afford ? "#6db8c0" : "#555"};color:${afford ? "#dff4f6" : "#777"};background:linear-gradient(#1b3438,#0e1a1d)" onclick="sendAction('travel',{to:'${w.id}',n:Date.now()+Math.random()})">TRAVEL</button>` : ""}</div>`;
  }).join("");
  return `<div class="absolute plate tf" style="${touch ? `left:${rail};right:${rail};top:60px` : "left:24px;top:50%;transform:translateY(-50%);width:300px"};padding:12px 16px;animation:vfin .2s;pointer-events:auto">
    <div style="font-size:11px;letter-spacing:.2em;color:#6db8c0">WAYSHRINE</div>
    <div style="font-size:18px;color:#e7d9b8;margin:2px 0 6px">${here?.name ?? ""}</div>${rows}</div>`;
}

// Absolute Cinema rides over everything: its fades/letterbox always, the director panel when open (9)
// the character sheet (C): a WoW-style paper doll beside the live body, every number derived from state
const SLOT_NAMES = { weapon: "Weapon", helm: "Helm", chest: "Chest", gloves: "Gloves", boots: "Boots", ring: "Ring", amulet: "Amulet" };
const TIER_COL = { worn: "#9d9d9d", common: "#e9dfc8", magic: "#6f9cff", rare: "#ffd75a", relic: "#ff8a2a", vowbound: "#3fd9b8", set: "#4fe06a" };
const ATK_INFO = { soulweaver: ["Arcane Bolt", 11, 1.25, 0.8], shadowmancer: ["Umbral Bolt", 10, 1.15, 0.75], gloamstalker: ["Longbow Shot", 14, 1.05, 0.65], hellwarden: ["Cinder Maul", 2.5, 1.15, 0.7], primalist: ["Rending Claw", 2.4, 1.05, 0.6] };
function sheetPanel(s, lv, xpPct, L) {
  const cls = CLASSES.find((c) => c.id === s.cls) ?? CLASSES[0], anc = ANC.find((a) => a.id === s.ancestry);
  const g = s.gs ?? {}, A = ATK_INFO[cls.id] ?? ["Ashcut", CB.ashcut.reach, 1, CB.ashcut.cd];
  const wm = ((s.weapon === "ITEM-001" ? 1.3 : 1) * (1 + 0.08 * (lv - 1)) * (1 + (g.dmgp ?? 0) / 100) + (g.dmg ?? 0) / CB.ashcut.dmg) * A[2];
  const hit = Math.round(CB.ashcut.dmg * wm), crit = Math.round((12 + (g.crit ?? 0)) * 10) / 10, mit = Math.round(((g.armor ?? 0) / ((g.armor ?? 0) + 120)) * 100);
  const dps = Math.round((hit * (1 + crit / 100 * 0.8)) / A[3]);
  const row = (k, v, c) => `<div class="vfsr"><span>${k}</span><b style="${c ? "color:" + c : ""}">${v}</b></div>`;
  const slot = (k) => { const it = s.gear?.[k]; return `<div class="vfgs" style="${it ? "box-shadow:0 0 0 2px #0d0b0a,0 0 0 3px " + (TIER[it.t]?.color ?? "#6b5638") : ""}" title="${it ? (it.n ?? k) : SLOT_NAMES[k]}">${it ? `<img src="${itemIcon(it.b)}">` : `<span>${SLOT_NAMES[k]}</span>`}</div>`; };
  return `<div class="absolute vfsheet" style="left:24px;top:110px;animation:vfin .2s">
  <div class="vfsh-h"><div><div style="font-size:20px;color:var(--wax);letter-spacing:.06em">${s.charName ?? "Bearer"}</div><div class="lbl">Level ${lv} ${anc ? anc.name + " " : ""}${cls.name}</div></div><div class="vfx" style="pointer-events:auto;cursor:pointer" onclick="sendAction('sheet')">✕</div></div>
  <div class="dv d0" style="margin:6px 0 10px"></div>
  <div style="display:flex;gap:12px">
    <div style="display:flex;flex-direction:column;gap:8px">${["helm", "amulet", "chest", "gloves"].map(slot).join("")}</div>
    <div class="vfdoll" style="background-image:url(${cls.img})"><div class="vfdoll-v"></div><div class="lbl" style="position:absolute;left:0;right:0;bottom:8px;text-align:center;color:#d8c69c">${cls.role}</div></div>
    <div style="display:flex;flex-direction:column;gap:8px">${["weapon", "ring", "boots"].map(slot).join("")}</div>
  </div>
  <div class="vfxpb"><div style="width:${xpPct}%"></div><span>${s.xp ?? 0} / ${L[lv] ?? "MAX"} XP</span></div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 18px;margin-top:10px">
    <div><div class="lbl vfsec">Vitals</div>${row("Life", `${Math.round(s.hp ?? 0)} / ${s.maxHp ?? 100}`, "#ff6a55")}${row(cls.res ?? "Edge", `${Math.round(s.edge ?? 0)} / 100`, "#ffc35a")}${row("Life regen", `${g.regen ?? 0}/s`)}${row("Life leech", `${g.leech ?? 0}%`)}${row("Move speed", `+${Math.min(40, g.speed ?? 0)}%`)}</div>
    <div><div class="lbl vfsec">Offense</div>${row(A[0], `${hit}`, "#f2d38a")}${row("Damage / sec", `${dps}`)}${row("Critical chance", `${crit}%`)}${row("Critical damage", "180%")}${row("Range", `${A[1]} m`)}</div>
    <div><div class="lbl vfsec">Defense</div>${row("Armor", `${g.armor ?? 0}`)}${row("Damage reduced", `${mit}%`)}${row("Tonics", `${s.tonics ?? 0}`)}</div>
    <div><div class="lbl vfsec">Record</div>${row("Copper", fmt(s.copper ?? 0))}${row("Wax slain", `${s.kills ?? 0}`)}${row("Find bonus", `+${g.gold ?? 0}%`)}</div>
  </div>
  ${anc ? `<div class="vftrait"><span class="lbl" style="color:${anc.color}">${anc.name} · ${anc.home}</span><div>${anc.trait ?? ""}</div></div>` : ""}
</div>`;
}
const FOE_FACE = { frostdead: CDN("0b1c2031e16606644b035f6e19a316a72639c3a5833cb95bfb3da39d4092a64b"), rimewolf: CDN("4c8cb55130c899c8b985c4ca3b2c485d2b92c4ed65496d830d8204ec58bff1ba"), icewraith: CDN("ab23bc1ffdda5c07b719168aaa8859e62366cb722e6cbfd3971e9707ee8c94a8"), frostjarl: CDN("f7fd65b54ed30d54f33de61092d76af740a321a30d6c8fee2832bbf638442a50"), deepghoul: CDN("5a6af7ec81bbfffefb92694553d9cb190bc040fd7487c63bdc5272cf08fa823a"), lurker: CDN("8e05a0707ecebedd614a3639c19ac13bdae4e1f69fc4e27bb6d6c582665e8536"), crystalbrute: CDN("002438702703e3564675cec0b42df16cfb68966c0e9a263b28990637077caf4a"), broodmother: CDN("bcd1ac43c7744d909728acd699e621a3e32ffda8c66ab0351a48f8c9023991b6"), ashrevenant: CDN("7a8673390533ee9517389a8ca9b01c7887b6141e745ff11a6e1badc4968cb8e0"), cinderthrall: CDN("2c28b11bfffe7864685cde3c05ee57919e98e7bc512599ef0a925fc97320e9d4"), pyrepriest: CDN("6b5fd1165b3b2b1b432be8a568f2fa83209f5b0302d6a9151f1729c312d3ca69"), kilnwarden: CDN("adb820423cc9bbe217c96fcfe0539c0f157be4b2b9b25e6688177e0ea2e4f686"), gargoyle: CDN("979bd69baff5f34e2a861cc63d6fb08478ea5266ad1e96ffe0b1ad392e27fb4f"), harpy: CDN("dded3b35ce961aca89513c2000b6e6f4cf65099b4e7b7d8884d1679301e79604"), inquisitor: CDN("2e3f78a5dfcfdafbed43304ddc9c3650a7da74abd0c4a52f68ea61b6d12c57f6"), butcher: CDN("5f4267338017bd16ada66baf16170bb8a841f7646316cf7f54f2b764d409ae3c"), reaper: CDN("dbdab22edc7a3793ad8a1306cc4702b7ed33270350e526da57b94b5062c32f51"), marrowwolf: CDN("d526472d2e0d07af74658144d012bc87e05c9667df2ec48941b74075fa74d9ec"), briarwitch: CDN("d98eb8dfb6439f10ded654440e5d59cd4f415ba4bb72aa4f99101b6246e07fa8"), rootmother: CDN("84542d76fc2e34a7060155f7aa2d6efc0e801f0a1e893a40ca62b68114bc764e"), drowned: CDN("ba80dfd83c3ff45de6b04d74878d28dcc1226f2390d01f25e81fef49def7b61e"), harpooner: CDN("8d9647f8e6c3359b4b774c2f8cc36b431098f21a6cae833df06a34accb76ddf3"), barnacle: CDN("405b9db77223addaf604c05d5b14ededf3a1e3303253f9e0c8ae23dc40428e4a"), ferryman: CDN("a8394000e32776d9d84c8d451154a7e191a785bfc27bcee3d919e798cd8b41a7"), pilgrim: CDN("54d0e5c971ad2511ba09bcd13f971704cc7a94516744528041483beb588e6d2f"), walker: CDN("a53d19bf172b6b1ae6cba062d9699cd85070e2169a694495718e4524d8b90ed0"), deacon: CDN("00cc1d1cf61d2e3ebdb64a3501ea50b4ff0a01d10b0326ac4a1316245571da04"), chandler: CDN("3e780bf14bf48b2f8a792979cec143936455a73fd0fd198d2f914bf4cbfd2029"), cantor: CDN("15de9f9f81879032a5382e233d9ee45113d11894bb8437168da045b6c0d5e7a1"), chorister: CDN("9c17473ab3f014b009dab681e58544953739b98485bb0b618bacdf06c33c3823"), flagellant: CDN("778c42a874cb3428629ff1fe29cbcde5b130b0c20a022c1329120ac05533c77d") };
// WoW-style unit frames: the Bearer's living portrait and the foe they are fighting, side by side, top left
function unitFrames(s, { hp, max, hpPct, edge, lv, xpPct, foe, foeOn, now, FOES }) {
  const cls = CLASSES.find((c) => c.id === s.cls) ?? CLASSES[0];
  const low = hpPct < 30, hurt = now - (s.hurtAt ?? 0) < 450;
  const me = `<div class="vfuf" style="left:24px">
    <div class="vfpt ${low ? "low" : ""}"><div class="vfpt-i" style="background-image:url(${cls.img})"></div><div class="vfpt-e"></div>${hurt ? `<div class="vfpt-h"></div>` : ""}<div class="vflv">${lv}</div></div>
    <div class="vfuf-b"><div class="vfuf-n">${s.charName ?? "Bearer"}<span>${cls.name}</span></div>
      <div class="vfbar hp"><div style="width:${hpPct}%"></div><b>${hp} / ${max}</b></div>
      <div class="vfbar rs"><div style="width:${Math.min(100, edge)}%"></div><b>${edge} ${cls.res ?? "Edge"}</b></div>
      <div class="vfbar xp"><div style="width:${xpPct}%"></div></div></div></div>`;
  if (!foeOn) return me;
  const fp = Math.max(0, Math.min(100, (foe.hp / foe.max) * 100)), elite = foe.kind === "deacon" || foe.kind === "chandler" || foe.kind === "cantor" || foe.kind === "barnacle" || foe.kind === "ferryman" || foe.kind === "briarwitch" || foe.kind === "rootmother";
  const tg = `<div class="vfuf tg ${foe.gone ? "gone" : ""}" style="left:330px;animation:vfin .18s">
    <div class="vfuf-b"><div class="vfuf-n" style="color:${elite ? "#f2b04a" : "#e7d9b8"}">${FOES[foe.kind] ?? "Wax Thing"}<span>${(foe.kind === "chandler" || foe.kind === "cantor" || foe.kind === "ferryman" || foe.kind === "rootmother" || foe.kind === "butcher" || foe.kind === "kilnwarden" || foe.kind === "broodmother" || foe.kind === "frostjarl") ? "MINI BOSS" : elite ? "ELITE" : ["drowned","harpooner"].includes(foe.kind) ? "mere-drowned" : ["reaper","marrowwolf"].includes(foe.kind) ? "blood-rooted" : ["gargoyle","harpy"].includes(foe.kind) ? "spire-born" : ["ashrevenant","cinderthrall"].includes(foe.kind) ? "ash-risen" : "wax-touched"}</span></div>
      <div class="vfbar hp"><div style="width:${fp}%"></div><b>${foe.gone ? "MELTED" : `${foe.hp} / ${foe.max}`}</b></div>
      <div class="vfbar rs tg2"><div style="width:${foe.gone ? 0 : 100}%"></div></div></div>
    <div class="vfpt ${elite ? "elite" : ""}"><div class="vfpt-i" style="background-image:url(${FOE_FACE[foe.kind] ?? FOE_FACE.pilgrim});animation-delay:-1.7s"></div><div class="vfpt-e" style="animation-delay:-.9s"></div></div></div>`;
  return me + tg;
}
const UF_CSS = `
#vf .vfuf{position:absolute;top:22px;display:flex;align-items:center;gap:0;pointer-events:none;filter:drop-shadow(0 4px 8px rgba(0,0,0,.7))}
#vf .vfpt{position:relative;width:86px;height:86px;border-radius:50%;overflow:hidden;z-index:2;background:#0b0908;box-shadow:0 0 0 2px #0d0b0a,0 0 0 4px #8a6d42,0 0 0 6px #0d0b0a,inset 0 0 18px #000}
#vf .vfpt.elite{box-shadow:0 0 0 2px #0d0b0a,0 0 0 4px #f2b04a,0 0 0 6px #0d0b0a,0 0 16px #f2b04a88}
#vf .vfpt.low{box-shadow:0 0 0 2px #0d0b0a,0 0 0 4px #c9402f,0 0 0 6px #0d0b0a;animation:vfpulse 1s infinite}
#vf .vfpt-i{position:absolute;inset:-8%;background-size:cover;background-position:50% 22%;animation:vfbreath 4.2s ease-in-out infinite}
#vf .vfpt-e{position:absolute;inset:0;border-radius:50%;background:radial-gradient(circle at 30% 85%,rgba(255,150,60,.42),transparent 55%),radial-gradient(circle at 50% 50%,transparent 55%,rgba(0,0,0,.65));mix-blend-mode:screen;animation:vfember 2.3s steps(9) infinite}
#vf .vfpt-h{position:absolute;inset:0;background:radial-gradient(circle,rgba(255,40,20,.0),rgba(255,40,20,.55));animation:vffade .5s forwards}
#vf .vflv{position:absolute;left:50%;bottom:2px;transform:translateX(-50%);min-width:24px;padding:0 5px;font-size:12px;line-height:17px;text-align:center;color:#f2d38a;background:#120e0b;border-radius:9px;box-shadow:0 0 0 1px #8a6d42}
#vf .vfuf-b{width:200px;margin-left:-14px;padding:7px 10px 7px 22px;background:linear-gradient(#1c1612,#0f0c0a);box-shadow:0 0 0 1px #0d0b0a,0 0 0 2px #5a4730,0 0 0 3px #0d0b0a}
#vf .vfuf.tg .vfuf-b{margin-left:0;margin-right:-14px;padding:7px 22px 7px 10px}
#vf .vfuf.gone{opacity:.55} #vf .vfuf.gone .vfpt-i{filter:grayscale(1) brightness(.6)}
#vf .vfuf-n{display:flex;justify-content:space-between;align-items:baseline;font-size:14px;color:#e7d9b8;letter-spacing:.05em;margin-bottom:4px;white-space:nowrap;overflow:hidden}
#vf .vfuf-n span{font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:#a8946c;margin-left:8px}
#vf .vfbar{position:relative;height:13px;margin-top:3px;background:#070606;box-shadow:inset 0 0 0 1px #2a231b;overflow:hidden}
#vf .vfbar>div{position:absolute;left:0;top:0;bottom:0;transition:width .2s}
#vf .vfbar.hp>div{background:linear-gradient(#e0533e,#8f1710 60%,#5a0c08)}
#vf .vfbar.rs>div{background:linear-gradient(#ffc35a,#a3520e)} #vf .vfbar.tg2{height:5px} #vf .vfbar.tg2>div{background:linear-gradient(#6db8c0,#2b5a60)}
#vf .vfbar.xp{height:4px} #vf .vfbar.xp>div{background:linear-gradient(90deg,#8a6d42,#f2d38a)}
#vf .vfbar b{position:absolute;inset:0;font-weight:400;font-size:10px;line-height:13px;text-align:center;color:#f1e6cc;text-shadow:0 1px 0 #000,0 0 3px #000}
@keyframes vfbreath{0%,100%{transform:scale(1) translateY(0)}50%{transform:scale(1.045) translateY(-1.5%)}}
@keyframes vfember{0%{opacity:.75}22%{opacity:1}41%{opacity:.82}63%{opacity:.95}80%{opacity:.7}100%{opacity:.88}}`;
function treePanel(s, lv) {
  const cls = CLASSES.find((c) => c.id === s.cls) ?? CLASSES[0], tal = s.talents ?? {}, left = pointsOf(lv) - spent(tal);
  const col = (br, b) => `<div class="vftb"><div class="vftb-h" style="color:${br.color}">${br.name}<span>${spentIn(tal, b)}</span></div>
    ${br.nodes.map((n, i) => { const r = tal[n.id] ?? 0, open = spentIn(tal, b) >= n.t * 3, can = canLearn(s.cls, tal, lv, n.id);
      return `${i ? `<div class="vftl" style="background:${open ? br.color : "#2a241c"}"></div>` : ""}<div class="vftn ${r ? "on" : ""} ${open ? "" : "lk"} ${n.max === 1 ? "cap" : ""}" style="--c:${br.color};${can ? "cursor:pointer;" : ""}" ${can ? `onclick="sendAction('learn',{id:'${n.id}'})"` : ""}>
        <img src="${TAL_ICON[n.stat]}"><span class="vftr">${r}/${n.max}</span>
        <div class="vftt"><b style="color:${br.color}">${n.name}</b><div>+${Math.round(n.per * 10) / 10}${LABEL[n.stat]} per rank</div>${n.key ? `<div style="color:#f2d38a;margin-top:3px">KEYSTONE · ${KEYSTONE[n.key]}</div>` : ""}${open ? "" : `<div style="color:#a0563f">Needs ${n.t * 3} points in ${br.name}</div>`}${r ? `<div style="color:#8fd18a">Now: +${Math.round(n.per * r * 10) / 10}${LABEL[n.stat]}</div>` : ""}</div></div>`; }).join("")}</div>`;
  return `<div class="absolute vftree" style="left:50%;top:70px;transform:translateX(-50%);animation:vfin .2s">
    <div class="vfsh-h"><div><div style="font-size:20px;color:var(--wax);letter-spacing:.08em">${cls.name} Talents</div><div class="lbl">${left > 0 ? `<span style="color:#f2d38a">${left} point${left > 1 ? "s" : ""} to spend</span>` : "a point each level"} · ${spent(tal)} spent</div></div>
    <div style="display:flex;gap:8px"><div class="vfx" style="pointer-events:auto;cursor:pointer;width:auto;padding:0 8px;font-size:11px;letter-spacing:.12em" onclick="sendAction('learn',{id:'reset'})">RESET</div><div class="vfx" style="pointer-events:auto;cursor:pointer" onclick="sendAction('tree')">✕</div></div></div>
    <div class="dv d0" style="margin:6px 0 12px"></div>
    <div style="display:flex;gap:18px;justify-content:center">${treeOf(cls.id).map(col).join("")}</div>
  </div>`;
}
const SHEET_CSS = `<style>${UF_CSS}
#vf .vftree{width:560px;padding:14px 18px 18px;background:radial-gradient(ellipse at 50% 0%,#2a221b,#110e0c 70%);box-shadow:0 0 0 2px #0d0b0a,0 0 0 4px #6b5638,0 0 0 6px #0d0b0a,0 18px 40px rgba(0,0,0,.7);pointer-events:auto}
#vf .vftb{flex:1;display:flex;flex-direction:column;align-items:center;padding:8px 0 4px;background:linear-gradient(rgba(0,0,0,.25),rgba(0,0,0,.05));box-shadow:inset 0 0 0 1px #2e271e}
#vf .vftb-h{font-size:14px;letter-spacing:.14em;text-transform:uppercase;margin-bottom:10px;display:flex;gap:8px;align-items:baseline} #vf .vftb-h span{font-size:11px;color:#b9a77f}
#vf .vftl{width:3px;height:12px;opacity:.8}
#vf .vftn{position:relative;width:56px;height:56px;box-shadow:0 0 0 2px #0d0b0a,0 0 0 3px #4a3d2a;background:#0b0908}
#vf .vftn.cap{width:64px;height:64px;border-radius:50%;overflow:visible} #vf .vftn.cap img{border-radius:50%}
#vf .vftn img{width:100%;height:100%;object-fit:cover;filter:grayscale(.85) brightness(.55)}
#vf .vftn.on{box-shadow:0 0 0 2px #0d0b0a,0 0 0 3px var(--c),0 0 14px var(--c)} #vf .vftn.on img{filter:none}
#vf .vftn.lk img{filter:grayscale(1) brightness(.25)}
#vf .vftr{position:absolute;right:-6px;bottom:-6px;font-size:11px;padding:0 4px;background:#0d0b0a;color:#f2d38a;box-shadow:0 0 0 1px #6b5638}
#vf .vftt{display:none;position:absolute;left:66px;top:0;width:180px;z-index:5;padding:8px 10px;font-size:12px;line-height:1.4;color:#cfc2a3;background:#120f0d;box-shadow:0 0 0 1px #0d0b0a,0 0 0 2px #6b5638}
#vf .vftn:hover .vftt{display:block}
#vf .vfsheet{width:430px;padding:14px 16px 16px;background:linear-gradient(#211d1a,#120f0d);box-shadow:0 0 0 2px #0d0b0a,0 0 0 4px #6b5638,0 0 0 6px #0d0b0a,0 18px 40px rgba(0,0,0,.7);pointer-events:auto}
#vf .vfsh-h{display:flex;justify-content:space-between;align-items:flex-start}
#vf .vfx{width:26px;height:26px;display:flex;align-items:center;justify-content:center;color:#b9a77f;box-shadow:0 0 0 1px #6b5638}
#vf .vfgs{width:62px;height:62px;background:radial-gradient(#221d19,#0c0a09);box-shadow:0 0 0 2px #0d0b0a,0 0 0 3px #4a3d2a;display:flex;align-items:center;justify-content:center}
#vf .vfgs img{width:52px;height:52px;object-fit:contain} #vf .vfgs span{font-size:9px;letter-spacing:.1em;color:#5f5442;text-transform:uppercase}
#vf .vfdoll{flex:1;height:278px;position:relative;background:#0a0807 center 18%/cover no-repeat;box-shadow:0 0 0 2px #0d0b0a,0 0 0 3px #6b5638,inset 0 0 40px #000}
#vf .vfdoll-v{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 35%,transparent 40%,rgba(10,8,7,.85) 100%),linear-gradient(transparent 70%,#0a0807)}
#vf .vfxpb{position:relative;height:14px;margin-top:12px;background:#0b0908;box-shadow:0 0 0 1px #0d0b0a,0 0 0 2px #6b5638}
#vf .vfxpb div{height:100%;background:linear-gradient(#e6cf8a,#8a6420)} #vf .vfxpb span{position:absolute;inset:0;text-align:center;font-size:10px;line-height:14px;color:#efe3c2}
#vf .vfsec{color:#c49c63;margin:6px 0 3px;border-bottom:1px solid #3a3024;padding-bottom:2px}
#vf .vfsr{display:flex;justify-content:space-between;font-size:13px;line-height:19px;color:#cfc2a3} #vf .vfsr b{font-weight:normal;color:#efe3c2}
#vf .vftrait{margin-top:10px;padding:8px 10px;font-size:12px;color:#cfc2a3;background:rgba(0,0,0,.3);box-shadow:inset 0 0 0 1px #3a3024}
</style>`;
export default function (ctx, player) {
  const base = vfHud(ctx, player) + SHEET_CSS;
  let cine = "";
  try { cine = renderCinemaOverlays(player) + (player?.state?.cinemaOpen ? cinemaPanel(player, ctx.world) : ""); } catch (e) { cine = ""; }
  return base + cine;
}
