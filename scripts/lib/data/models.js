// Character bodies: CDN-cooked rigged humanoids (Idle/Walk/Run inside). One place to swap a look.
export const MODELS = {
  hero: "cdn/model-gaunt-hooded-swordsman-in-tattered-ash-grey-cloak-blackened-iron-pauldrons-red-sash-twin-curved-blades-dark-fantasy.glb",
  pilgrim: "/cdn/value.c0a2d4eb8ff7a5107fdf362f5d353167795e59e88326e20439351d5e823cbd10.png.glb",
  walker: "/cdn/value.1a7bf3f29aae0fdd0b144c475133debcf06fd5a235173096c7ea0902f354fda0.png.glb",
  deacon: "/cdn/value.b596bf364ccb2be48c3db553727af88e454c09792d40d6a5031ac646c9361831.png.glb",
  chorister: "/cdn/value.6d8aad45a2d507267ea3819375aac11f89513f3b07ac80ab72a9cd88016866f2.png.glb",
  flagellant: "/cdn/value.a361fb6343d97995caa46fa46e036f15b0e5586ba5d8789a16ae3651271c5f50.png.glb",
  ringer: "/cdn/value.455bc0aa9d8352d969cc297f642e87c9e379e078cb18a33c22b58f30a5b33b73.png.glb",
  warden: "/cdn/value.3922e30e734715b9d6f88d276abd70dc5b89aa6a3f953770a8eb6fe30c5e5e53.png.glb",
  hangman: "/cdn/value.360bbb4a7f85870468a183260891a4bc4e0198b1f208703353a0039d9eacc5b8.png.glb",
  abbess: "/cdn/value.d5b390dd32a79026a2b3575537b4bc164d63062114d1e7cee294eaaf9a625c7f.png.glb",
  chandler: "/cdn/value.5b3ec5f76c2589621d55c384cbb60a0be3fd09c64b61ad47fc266244249a98cb.png.glb",
  cantor: "/cdn/value.476a8d830efb551ad2df8777cdfdef35f58be2c8a9454638437d04f1b50f42ea.png.glb",
  bailiff: "/cdn/value.0fff9f3b6085fcd9ee851d61b5e8e32b7c7ea83f47e46f7e7a72d18d3e7e3438.png.glb",
};
// true height in metres before the row's own scale
export const HEIGHT = { hero: 1.85, pilgrim: 1.7, walker: 1.7, deacon: 1.8, chorister: 1.95, flagellant: 1.8, bailiff: 2.0, chandler: 2.9, cantor: 3.0, ringer: 2.2, warden: 2.4, hangman: 2.5, abbess: 2.6 };
export const body = (k) => ({ model: MODELS[k], layout: { maxExtents: { y: HEIGHT[k] } } });
