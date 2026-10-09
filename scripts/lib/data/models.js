// Character bodies: CDN-cooked rigged humanoids (Idle/Walk/Run inside). One place to swap a look.
export const MODELS = {
  hero: "cdn/model-gaunt-hooded-swordsman-in-tattered-ash-grey-cloak-blackened-iron-pauldrons-red-sash-twin-curved-blades-dark-fantasy.glb",
  pilgrim: "/cdn/value.a650a927b0c4a12f832ddfa5453b145940b5e6661c9229da5e0e7787043121af.png.glb",
  walker: "cdn/model-hunched-pilgrim-made-of-melted-candle-wax-hooded-robe-dripping-wax-candle-burning-on-head-dark-fantasy.glb",
  deacon: "/cdn/value.1eb3d5bd79daf7fac693a41e0aeeff9d4f072b0c52a856b09f99c7ebcd56011d.png.glb",
  chorister: "/cdn/value.28b25f03c73983bb7b8d9d0fff4a1bd678d699458ce9bbc9e4dad2520f01c8db.png.glb",
  flagellant: "/cdn/value.d0b5fe74f928832c9a25cf0cd7ee52820f6bc5379ec87e0c27877aee1e5f5158.png.glb",
  ringer: "cdn/model-tall-gaunt-bell-ringer-monk-hooded-verdigris-bronze-robes-cracked-bronze-bell-for-a-head-glowing-gold-inside-long-iron-bell-hammer-dark-fantasy-boss.glb",
  warden: "cdn/model-towering-drowned-lantern-keeper-waterlogged-black-robes-dripping-weeds-rusted-iron-cage-lantern-for-a-head-cold-blue-green-flame-inside-long-hooked-pole-dark-fantasy-boss.glb",
  hangman: "cdn/model-towering-gaunt-executioner-hangman-black-burlap-hood-with-one-eye-hole-coils-of-noose-rope-over-shoulders-rusted-lantern-chained-to-chest-giant-iron-gallows-hook-dark-fantasy-boss.glb",
  abbess: "cdn/model-towering-skeletal-abbess-nun-black-wax-habit-and-bone-white-wimple-crown-of-finger-bones-ribcage-reliquary-with-candle-burning-inside-long-bone-crozier-staff-dark-fantasy-boss.glb",
  bailiff: "cdn/model-giant-wax-bailiff-tax-collector-crown-of-burning-candles-iron-ledger-chained-to-chest-bell-mace-dark-fantasy-boss.glb",
};
// true height in metres before the row's own scale
export const HEIGHT = { hero: 1.85, pilgrim: 1.7, walker: 1.7, deacon: 1.8, chorister: 1.95, flagellant: 1.8, bailiff: 2.0, ringer: 2.2, warden: 2.4, hangman: 2.5, abbess: 2.6 };
export const body = (k) => ({ model: MODELS[k], layout: { maxExtents: { y: HEIGHT[k] } } });
