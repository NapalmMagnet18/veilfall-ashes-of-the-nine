// The UI's frames: the creator's full Kenney CC0 pixel kit (32 shapes × 4 renderings + 12 dividers),
// drawn straight from their uploads and tinted brass/ember/ash in CSS.
// A framed element paints two layers behind its content:
//   ::before = the shape's solid silhouette (panel-NNN) in ash-dark, its backdrop
//   ::after  = the shape's outline (panel-border-NNN) in brass
// hover  -> outline swaps to panel-transparent-center-NNN in ember (a lit, half-filled frame)
// .on    -> backdrop swaps to panel-transparent-border-NNN in deep ember (the chosen one glows from inside)
// disabled/sealed -> outline dims to old bronze
import K from "./data/ui-kit.js";

const u = (p) => `url(/cdn/${p}.webp)`;
const F = {
  gold: "brightness(.72) sepia(1) saturate(2.2) hue-rotate(-21deg) brightness(.76)",
  pale: "brightness(.78) sepia(1) saturate(2.3) hue-rotate(-30deg) brightness(.96)",
  ember: "brightness(.58) sepia(1) saturate(3.8) hue-rotate(-24deg) brightness(.92)",
  dim: "brightness(.56) sepia(1) saturate(1.1) hue-rotate(-6deg) brightness(.48)",
  ash: "brightness(.28) sepia(1) saturate(.8) hue-rotate(-15deg) brightness(.24)",
  coal: "brightness(.5) sepia(1) saturate(3) hue-rotate(-24deg) brightness(.3)",
};
const shape = (n) => {
  const i = String(n).padStart(3, "0");
  return `--s:${u(K.solid[i])};--b:${u(K.border[i])};--c:${u(K.center[i])};--t:${u(K.fill[i])};`;
};

// role -> [shape number, frame px, frame inset px (negative = outside the box), padding or null]
// every one of the 32 shapes stands somewhere: menus, HUD, pack cabinet, the peddler's cart.
const ROLES = [
  ["#vm .panel", 8, 14, -4, null],
  ["#vm .panel.side", 5, 14, -4, null],
  ["#vm .panel.det", 7, 14, -4, null],
  ["#vm .panel.msg", 13, 12, -4, null],
  ["#vm .btn", 3, 14, -2, null],
  ["#vm .btn.main", 24, 16, -4, null],
  ["#vm .btn[disabled]", 9, 14, -2, null],
  ["#vm .mini", 16, 10, -2, null],
  ["#vm .row", 10, 12, -4, null],
  ["#vm .card", 21, 12, 0, null],
  ["#vm .anc", 18, 10, -6, null],
  ["#vm .namebox", 1, 12, -4, null],
  ["#vf .qp", 31, 16, 0, "16px 20px"],
  ["#vf .pp", 12, 12, 0, "9px 13px"],
  ["#vf .dl", 25, 18, 0, "20px 26px"],
  ["#vf .bb", 26, 16, 0, "14px 22px"],
  ["#vf .pk", 4, 16, 0, "18px 20px"],
  ["#vf .kd", 28, 18, 0, "18px 40px"],
  ["#vf .ph .slot", 14, 9, 0, null],
  ["#vfshop", 6, 16, 0, "22px 24px"],
  ["#vfshop .gl", 22, 8, 0, null],
  ["#vfshop .bt", 23, 10, -2, null],
  ["#vfshop .row", 27, 10, 0, "8px 10px"],
  ["#vfshop .x", 29, 8, 0, null],
];
// the skill bar: each key its own shape
[2, 11, 15, 17, 19, 20].forEach((n, i) => ROLES.push([`#vf .sk .slot:nth-child(${i + 1})`, n, 10, 0, null]));
// the pack cabinet: twelve cubbies, twelve shapes, the last two (0, 30) only here
[0, 30, 28, 9, 14, 29, 2, 11, 15, 17, 19, 20].forEach((n, i) => ROLES.push([`#vf .pk .slot:nth-child(${i + 1})`, n, 9, 0, null]));

const sel = (suffix) => ROLES.map(([s]) => s.split(",").map((x) => x + suffix).join(",")).join(",");
const roleCSS = ROLES.map(([s, n, w, inset, pad]) =>
  `${s}{${shape(n)}--fw:${w}px;--fi:${inset}px;${pad ? `padding:${pad}!important;` : ""}}`).join("\n");

// dividers: half-art (knot on the right), mirrored so the knots meet in the middle
const DV = Object.entries(K.divider).map(([k, p]) => `.dv.d${k}{--dv:${u(p)};--dh:${K.dividerH[k]}px}`).join("");

export const FRAME_CSS = `<style>
${sel("")}{isolation:isolate;border:0!important;border-image:none!important;background:none!important;box-shadow:none!important}
#vm .btn,#vm .mini,#vm .row,#vm .card,#vm .anc,#vm .namebox,#vm .panel,#vf .pp,#vf .slot,#vfshop .gl,#vfshop .bt,#vfshop .row,#vfshop .x{position:relative}
${sel("::before")},${sel("::after")}{content:"";position:absolute;inset:var(--fi,0);pointer-events:none;z-index:-1;box-sizing:border-box;border:var(--fw,14px) solid transparent;border-image-slice:32 fill;border-image-width:var(--fw,14px);border-image-repeat:stretch;image-rendering:pixelated;transition:filter .12s,opacity .12s}
${sel("::before")}{border-image-source:var(--s);filter:${F.ash};opacity:.9}
${sel("::after")}{border-image-source:var(--b);filter:${F.gold}}
#vm .btn:not([disabled]):hover::after,#vm .btn:not([disabled]):active::after,#vm .mini:hover::after,#vm .row:hover::after,#vm .card:hover::after,#vm .anc:hover::after,#vm .namebox:hover::after,#vf .slot:hover::after,#vfshop .bt:not(.off):hover::after,#vfshop .x:hover::after{border-image-source:var(--c);filter:${F.ember};opacity:.75}
#vm .btn:not([disabled]):hover,#vfshop .bt:not(.off):hover{color:#ffe2a8!important}
#vm .btn:not([disabled]):active,#vfshop .bt:not(.off):active{transform:translateY(1px)}
#vm .row.on::before,#vm .card.on::before,#vm .anc.on::before,#vm .btn.main::before{border-image-source:var(--t);filter:${F.coal};opacity:1}
#vm .row.on::after,#vm .card.on::after,#vm .anc.on::after{filter:${F.pale}}
#vm .btn.main{box-shadow:0 0 22px rgba(240,140,60,.22)!important}
#vm .btn[disabled]::after,#vfshop .bt.off::after,#vm .card.sealed::after,#vf .slot.dim::after,#vf .pk .slot.e::after{filter:${F.dim}}
#vm .btn[disabled],#vfshop .bt.off{opacity:.85}
#vf .pk .slot.e::before{opacity:.55}
#vm .card img{position:relative;z-index:0}
${roleCSS}
@media (pointer:coarse),(max-width:700px){${ROLES.filter(([, , w]) => w > 10).map(([s]) => s).join(",")}{--fw:9px}
 #vf .qp,#vf .pp,#vf .pk,#vf .bb{padding:10px 12px!important} #vf .dl{padding:12px 14px!important} #vfshop{padding:14px 14px!important}}
.dv{display:flex;height:var(--dh,21px);width:min(100%,288px);margin:4px auto 6px;filter:${F.gold};pointer-events:none;--dv:${u(K.divider.f4)}}
.dv::before,.dv::after{content:"";flex:1;background:var(--dv) right center/100% 100% no-repeat;image-rendering:pixelated}
.dv::after{transform:scaleX(-1)}
${DV}
@media (max-width:1560px){#vf .sk{left:auto!important;right:170px;transform:none!important}}
#vf .slot .k{left:9px!important;top:6px!important;font-size:9px!important;z-index:1} #vf .slot .n{right:9px!important;bottom:6px!important;z-index:1} #vf .slot .cd{left:6px!important;right:6px!important;bottom:6px!important}
</style>`;
