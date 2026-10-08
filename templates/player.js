// spawn6 native template "player"
export const player = {
  behavior: ["scripts/humanoid-locomotion.js", "scripts/player.js"],
  feetPosition: { x: 0, y: 2, z: 0 },
  physics: { body: "character" },
  tags: ["player"],
  model: "cdn/model-gaunt-hooded-swordsman-in-tattered-ash-grey-cloak-blackened-iron-pauldrons-red-sash-twin-curved-blades-dark-fantasy.glb",
  layout: { maxExtents: { y: 1.85 } },
};
