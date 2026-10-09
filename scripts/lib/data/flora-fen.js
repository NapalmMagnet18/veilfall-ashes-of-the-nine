// Lanternmere fen hero trees (art/fen/build.py). height = metres at layout 1 / scale 1; origin at the base.
// Place like bw-tree-*: model url, mixer.base { clip: "Sway", loop: "loop" }, y: { terrain: -0.25 }, trunk floorDist >= 1.5.
// rotlog lies along its local X, 6 m long (height is its root-plate height); its Sway is a faint moss drift.
export const FLORA_FEN = {
  drownedcypress: { url: "/cdn/value.2cda20bb2481ef4a33bfd0beb60d2b7fc21612af870cf3a9f991b71e71b7595f.glb", height: 8, tris: 7024, clip: "Sway" },
  fenwillow: { url: "/cdn/value.260fb36e966375b99999731c105823a0534a8ae144e5af09ca0fdbe04e6b5f51.glb", height: 6, tris: 4884, clip: "Sway" },
  rotlog: { url: "/cdn/value.1af93ab3470956b9216c943ab4fb5d0ced0e760840565125bf10a97ea2baa9be.glb", height: 2.5, length: 6, tris: 5028, clip: "Sway" },
};
