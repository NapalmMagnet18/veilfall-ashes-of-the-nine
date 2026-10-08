// Character bodies: CDN-cooked rigged humanoids (Idle/Walk/Run inside). One place to swap a look.
export const MODELS = {
  hero: "cdn/model-gaunt-hooded-swordsman-in-tattered-ash-grey-cloak-blackened-iron-pauldrons-red-sash-twin-curved-blades-dark-fantasy.glb",
  pilgrim: "cdn/model-hunched-pilgrim-made-of-melted-candle-wax-hooded-robe-dripping-wax-candle-burning-on-head-dark-fantasy.glb",
  walker: "cdn/model-hunched-pilgrim-made-of-melted-candle-wax-hooded-robe-dripping-wax-candle-burning-on-head-dark-fantasy.glb",
  deacon: "cdn/model-tall-wax-deacon-priest-melting-candle-flesh-iron-censer-chain-tattered-vestments-dark-fantasy.glb",
  chorister: "cdn/model-gaunt-hollow-chorister-choir-robe-of-soot-black-and-blood-red-face-melted-smooth-wax-mouth-sealed-crown-of-thin-candles-long-wax-fingers-dark-fantasy.glb",
  flagellant: "cdn/model-gaunt-hooded-penitent-monk-stitched-leather-mask-bare-shoulders-crusted-with-dripping-candle-wax-knotted-rope-cords-tipped-with-candle-stubs-dark-fantasy.glb",
  ringer: "cdn/model-tall-gaunt-bell-ringer-monk-hooded-verdigris-bronze-robes-cracked-bronze-bell-for-a-head-glowing-gold-inside-long-iron-bell-hammer-dark-fantasy-boss.glb",
  warden: "cdn/model-towering-drowned-lantern-keeper-waterlogged-black-robes-dripping-weeds-rusted-iron-cage-lantern-for-a-head-cold-blue-green-flame-inside-long-hooked-pole-dark-fantasy-boss.glb",
  hangman: "cdn/model-towering-gaunt-executioner-hangman-black-burlap-hood-with-one-eye-hole-coils-of-noose-rope-over-shoulders-rusted-lantern-chained-to-chest-giant-iron-gallows-hook-dark-fantasy-boss.glb",
  abbess: "cdn/model-towering-skeletal-abbess-nun-black-wax-habit-and-bone-white-wimple-crown-of-finger-bones-ribcage-reliquary-with-candle-burning-inside-long-bone-crozier-staff-dark-fantasy-boss.glb",
  bailiff: "cdn/model-giant-wax-bailiff-tax-collector-crown-of-burning-candles-iron-ledger-chained-to-chest-bell-mace-dark-fantasy-boss.glb",
};
// true height in metres before the row's own scale
export const HEIGHT = { hero: 1.85, pilgrim: 1.7, walker: 1.7, deacon: 1.8, chorister: 1.95, flagellant: 1.8, bailiff: 2.0, ringer: 2.2, warden: 2.4, hangman: 2.5, abbess: 2.6 };
export const body = (k) => ({ model: MODELS[k], layout: { maxExtents: { y: HEIGHT[k] } } });
