// spawn6 native template "player"
export const player = {
  behavior: ["scripts/humanoid-locomotion.js", "scripts/player.js"],
  feetPosition: { x: 0, y: 2, z: 0 },
  physics: { body: "character" },
  tags: ["player"],
  model: "cdn/model-gaunt-hooded-swordsman-in-tattered-ash-grey-cloak-blackened-iron-pauldrons-red-sash-twin-curved-blades-dark-fantasy.glb",
  layout: { maxExtents: { y: 1.85 } },
  // the Bearer's light radius: a warm lantern-glow that walks with them and throws the road's shadows
  children: [{ id: "lightradius", feetPosition: { x: 0, y: 2.6, z: 0.4 }, light: { kind: "point", color: "oklch(0.82 0.09 70)", intensity: 3.5, distance: 11, shadow: { enabled: true } } }],
};
