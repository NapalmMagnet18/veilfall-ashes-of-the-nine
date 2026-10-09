// Frostbitten Vale hero trees (art/frost/build.py). height = metres at layout 1, origin at the trunk base.
// Place like bw-tree-*: model: url, mixer: { base: { clip, loop: "loop", speed: 0.8, weight: 1 } }, y: { terrain: -0.25 }.
// icesnag carries its own snow/ice skirt (r ≈ 2.4 m): keep its trunk ≥ 3 m off the floor edge.
export const FLORA_FROST = {
  rimepine: { url: "/cdn/value.9310f071d07d278b7745c40ef24fc6e310900c62df98f2b681ccda5b9ba2f2a2.glb", height: 9, tris: 10005, clip: "Sway", radius: 3.2 },
  frostbirch: { url: "/cdn/value.e333b4df430e8d4822e64b63ec5cdb10deaf0bdadd3620d26f2fb84049f88fc7.glb", height: 7, tris: 6728, clip: "Sway", radius: 2.2 },
  icesnag: { url: "/cdn/value.d48ce7fd08b4f93c388790298a431e57ee0dc353eb689f744f23b250c942a5e9.glb", height: 5, tris: 2187, clip: "Sway", radius: 2.4 },
};
export const FROST_TREE_TAGS = ["frostvale", "flora", "tree"];
