// Character bodies: CDN-cooked rigged humanoids (Idle/Walk/Run inside). One place to swap a look.
export const MODELS = {
  hero: "cdn/model-gaunt-hooded-swordsman-in-tattered-ash-grey-cloak-blackened-iron-pauldrons-red-sash-twin-curved-blades-dark-fantasy.glb",
  pilgrim: "cdn/model-hunched-pilgrim-made-of-melted-candle-wax-hooded-robe-dripping-wax-candle-burning-on-head-dark-fantasy.glb",
  walker: "cdn/model-hunched-pilgrim-made-of-melted-candle-wax-hooded-robe-dripping-wax-candle-burning-on-head-dark-fantasy.glb",
  deacon: "cdn/model-tall-wax-deacon-priest-melting-candle-flesh-iron-censer-chain-tattered-vestments-dark-fantasy.glb",
  bailiff: "cdn/model-giant-wax-bailiff-tax-collector-crown-of-burning-candles-iron-ledger-chained-to-chest-bell-mace-dark-fantasy-boss.glb",
};
// true height in metres before the row's own scale
export const HEIGHT = { hero: 1.85, pilgrim: 1.7, walker: 1.7, deacon: 1.8, bailiff: 2.0 };
export const body = (k) => ({ model: MODELS[k], layout: { maxExtents: { y: HEIGHT[k] } } });
