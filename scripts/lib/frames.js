// The UI's frames: the creator's Kenney CC0 pixel borders, recoloured brass/wax over ash-dark fill.
// Each is a 96 px sheet at 4 px per art pixel, drawn at half size (2 px per art pixel) via border-image.
const U = (h) => `/cdn/value.${h}.png`;
export const FR = {
  panel: U("07679a20297bf5216eac5504765d11ef42348a34973350cac19dbd4ee0198e40"),
  btn: U("efe39eecfc97d68d46617bd1d458e5911ab198326813fc093bb482ff510fd61e"),
  btnmain: U("193f20b46037db4dcd9364748d5428843007d8e0cecf0e528e934ced25605c5b"),
  slot: U("d502a11179b049d3da0da9e5a9096754b6a72312519548047fe425ffcca9fdbf"),
  row: U("e7160ea1f290518c9f70bb4444978e619c424d4ea45f4ec59d41f26421ea0043"),
  rowon: U("3fd974bdd97c1ea22b5ba235accb1fe25780ad93f7003d0addeb07a1840090a8"),
  card: U("cd396819d656f0cac99b4c6b3eda49cccae72af69dcf6c99ba4a9b69b4afab38"),
  btnhot: U("11da33d216fa2a9ff50216ec30653b9e9aa047f0606e6bad8de4c4ff767a3de4"),
  slothot: U("152e0e3dca8080958e96297d180738dd46f2ecd43c02f2d1e4a43c5e9f09757a"),
  div: U("a2605b2cc3a81b3017dc37e70db702f5d8bc19876c5b91473921a28a733d3467"),
  ornate: U("75a658d631981a665ceca8773fec687cb292ed5ca6833b19d6156b214b7e9bc1"),
  dull: U("419a89626be7e028858090009f767cdc899e865773ca5891ed2e3a53434aa2ac"),
  cardon: U("e395b42f71101818ed0b0b78153d07acd1f2f99b1b29c415db1c6c877b098c7e"),
};
const bi = (img, slice, w) => `border:${w}px solid transparent;border-image:url(${img}) ${slice} fill / ${w}px stretch;image-rendering:pixelated;box-sizing:border-box;background:none`;
export const FRAME_CSS = `<style>
#vm .panel,#vf .plate,#vfshop .plate{${bi(FR.panel, 28, 14)};box-shadow:none!important;padding:4px 8px}
#vm .btn,#vfshop .bt,#vm .mini{${bi(FR.btn, 28, 14)};box-shadow:none!important;padding:2px 10px}
#vm .btn.main{${bi(FR.btnmain, 28, 14)};box-shadow:0 0 22px rgba(240,140,60,.25)!important;padding:4px 14px}
#vm .btn[disabled],#vfshop .bt.off{opacity:.55}
#vf .slot,#vfshop .gl,#vfshop .x{${bi(FR.slot, 24, 12)};box-shadow:none!important}
#vm .row{${bi(FR.row, 32, 16)};box-shadow:none!important;padding:2px 6px;background:rgba(20,18,16,.55)}
#vm .row.on{${bi(FR.rowon, 32, 16)};background:rgba(40,32,24,.6)}
#vm .card{${bi(FR.card, 24, 12)};box-shadow:none!important}
#vm .card.on{${bi(FR.cardon, 24, 12)};box-shadow:0 0 16px rgba(242,211,138,.3)!important}
#vm .namebox{${bi(FR.slot, 24, 12)};box-shadow:none!important;padding:2px 6px}
@media (pointer:coarse),(max-width:700px){#vf .plate,#vfshop .plate{border-width:9px;border-image-width:9px;padding:2px 5px!important}}
#vm .btn:not([disabled]):hover,#vm .btn:not([disabled]):active,#vfshop .bt:not(.off):hover,#vfshop .bt:not(.off):active,#vm .mini:hover{border-image-source:url(${FR.btnhot});color:#ffe2a8!important;box-shadow:0 0 18px rgba(255,150,70,.35)!important}
#vm .btn:not([disabled]):active,#vfshop .bt:not(.off):active{transform:translateY(1px)}
#vf .slot:hover,#vf .slot:active,#vfshop .x:hover,#vm .card:hover,#vm .namebox:hover{border-image-source:url(${FR.slothot})}
#vm .row:hover{border-image-source:url(${FR.rowon})}
#vf .ornate{border:22px solid transparent!important;border-image:url(${FR.ornate}) 32 fill / 22px stretch!important;image-rendering:pixelated;box-shadow:none!important;background:none!important;padding:4px 10px!important}
#vm .btn[disabled],#vfshop .bt.off{border-image-source:url(${FR.dull})!important;opacity:.8}
@media (pointer:coarse),(max-width:700px){#vf .ornate{border-width:14px!important;border-image-width:14px!important}}
.dv{height:14px;margin:5px auto 6px;max-width:100%;width:min(100%,384px);background:url(${FR.div}) center/contain no-repeat;image-rendering:pixelated;opacity:.9;pointer-events:none}
</style>`;
