// Diablo-style boss voices: a taunt on waking, a roar each time a phase turns, last words on the fall.
const C = (h) => `/cdn/value.${h}.mp3`;
export const BOSS_VOICE = {
  bailiff: { wake: C("d898fc1d494782c5b1332a0ed5df0d3a622a9be37e2fa3716e07729af250e805"), phase: C("bad8a77f15e5296d6353d9959d14ec89ae943207760d8adcdb01f1a692091a9d"), die: C("b11da1d73e76a9e46365773f76e30f21c9afe003c960c9ab3d222183b04327e0") },
  ringer: { wake: C("fdd243513dd6b02b921e0c84429de891878c23624c5e44a13a72230b39f82f13"), phase: C("0211367ad8a0510ec5600ab7a2ae2bbab79fa0ee1afbe1aa0bf914566d5109e4"), die: C("748de183fdd4d99b2297f953ba644c1194d884d1023cde42800560fc1c2b6a6a") },
  warden: { wake: C("c421175221e1cf91842b62be120454488f405195a7ce65290828305d825190c7"), phase: C("765140798373f8b74351a82114137b0299f8feff71c7194eb10f7fd5743d951c"), die: C("d4f4b4a452412b2ab437aebdf336eb799aa98765ad14663552a7d354b886b8ba") },
  hangman: { wake: C("cc6c8343e4f57ae716d114812f246da61f696add2d9b2f35defee5ce65239aa9"), phase: C("f7ef59be295af043dc5d3ef62960a24aa5a9fbaf841d6a9fc33ad0b21f5dbefa"), die: C("aca9aba57bbbf53f2d432efa03ee580d75e33668b65ba3f470da28ef3faa61f5") },
};
export function bossVoice(ctx, kind, beat, at) {
  const clip = BOSS_VOICE[kind]?.[beat]; if (!clip) return;
  ctx.emit("playSound", { clip, position: { x: at.x, y: at.y + 3, z: at.z }, volume: 1, maxDistance: 120 });
}
