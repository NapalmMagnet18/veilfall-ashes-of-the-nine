// The bestiary's wildlife: kind → model, height (m), gait. Placed by the shepherd's spawn rows.
const G = (sha) => `/cdn/value.${sha}.png.glb`;
export const FAUNA = {
  miretoad: { name: "Mire Toad", model: G("12c0d8ff5b2d20098ef277ca72c0987f757797aa51ad8b5268bcf06a566b2335"), h: 0.8, roam: 7, walk: 0.7, run: 2.4, shy: 4 },
  stag: { name: "Bloodwood Stag", model: G("053a3be38285f1d671c0a95cf0bf33b25126ff2d7251536859039b731ea57e28"), h: 2.6, roam: 12, walk: 1.1, run: 6.5, shy: 11 },
  hare: { name: "Frost Hare", model: G("6caae0e412c9359c25c52ccf4250c41b3d0e786c57ae83bdec96a4566bd52c71"), h: 0.6, roam: 9, walk: 1.2, run: 7, shy: 8 },
  fox: { name: "Spirit Fox", model: G("6433ffa718263fc65e46feebfcb5bb213de104342ca14a4efde0ca1f7df8eb43"), h: 0.9, roam: 10, walk: 1.4, run: 5, shy: 6 },
  lizard: { name: "Cave Lizard", model: G("c9324668dde33eede976149f508cab187cf0b7d7af24a8fb3d1c82ed1247b0eb"), h: 0.6, roam: 6, walk: 0.9, run: 4, shy: 5 },
  crow: { name: "Grave Crow", model: G("22108941d95cc31c7b7e6b4b67c3fc840f373a74ecf1b5c05fbff79a7ae649d8"), h: 0.55, roam: 5, walk: 0.6, run: 5, shy: 6 },
  goat: { name: "Ash Goat", model: G("c92ce2dd9cb1617447af575eadd1bf0528be8f1c3ef4356c1598b2eec0d60ba5"), h: 1.4, roam: 8, walk: 0.8, run: 4.5, shy: 7 },
  crane: { name: "Swamp Crane", model: G("37f5f0eb12d895614931be3411a2fab8ac9ee01d2b2723db70560cddd8447de1"), h: 1.7, roam: 6, walk: 0.5, run: 3.5, shy: 9 },
  rat: { name: "Cathedral Rat", model: G("7d94edc78132bffd446b569934ef652f73cff390cd99135cfaf0471323abd815"), h: 0.35, roam: 5, walk: 1.0, run: 4.5, shy: 4 },
  beetle: { name: "Bone Beetle", model: G("4b8f978b2d39a04f18f9524f16bc52e4ff111612f3d3ba98455b53ed54953f99"), h: 0.5, roam: 4, walk: 0.5, run: 0, shy: 0 },
  mule: { name: "Pack Mule", model: G("911d3d3560b859a70aaf0d7fa8b8f9ccef383779fca5d81e3d2c1a0deaff3d3e"), h: 1.7, roam: 1.5, walk: 0.4, run: 0, shy: 0 },
};
