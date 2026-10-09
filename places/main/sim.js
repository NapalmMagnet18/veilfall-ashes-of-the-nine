// Broken Lantern Road's referee: stands the camp's people and the road's enemies, respawns cleared
// packs out of sight, walks each player's quest forward, levels them, and brings the Bailiff back.
import C from "../../scripts/lib/data/combat.yml";
import E from "../../scripts/lib/data/economy.yml";
import { body } from "../../scripts/lib/data/models.js";
import { FEN, FEN_HEART, WAYSTONES, ORCHARD, GIBBETS, GALLOWS, OSSUARY, RELIQUARY } from "../../scripts/lib/data/veilfall-map.js";
export const cadence = "250ms";
const MUSIC = "/cdn/moodboard-gothic-horror/music-broken-lantern-road-dusk-candles-and-fog-ambient.mp3";
// the jukebox follows the room's mood: the road at rest, drums when the wax wakes, the Bailiff's own theme in his court
const TRACKS = {
  road: MUSIC,
  fight: "/cdn/moodboard-gothic-horror/music-dark-fantasy-combat-pounding-low-drums-cello-ostinato-tense-loop.mp3",
  boss: "/cdn/moodboard-gothic-horror/music-dark-fantasy-boss-battle-choir-pipe-organ-war-drums-bells-loop.mp3",
  bailiff: "/cdn/moodboard-gothic-horror/music-dark-fantasy-boss-tribunal-judge-theme-pounding-timpani-brass-stabs-and-low-male-choir-chanting-loop.mp3",
  ringer: "/cdn/moodboard-gothic-horror/music-dark-fantasy-boss-great-bell-theme-tolling-bronze-bells-pipe-organ-and-frantic-strings-loop.mp3",
  warden: "/cdn/moodboard-gothic-horror/music-dark-fantasy-boss-drowned-giant-theme-deep-brass-swells-taiko-and-underwater-choir-loop.mp3",
  abbess: "/cdn/moodboard-gothic-horror/music-dark-fantasy-boss-undead-abbess-theme-dead-nuns-choir-requiem-pipe-organ-and-bone-percussion-loop.mp3",
  ossuary: "/cdn/moodboard-gothic-horror/music-dark-fantasy-ossuary-catacomb-whispered-plainchant-and-low-bowed-bass-drone-loop.mp3",
  hangman: "/cdn/moodboard-gothic-horror/music-dark-fantasy-boss-executioner-theme-slow-heavy-war-drums-scraping-fiddle-and-chains-loop.mp3",
  camp: "/cdn/moodboard-gothic-horror/music-dark-fantasy-safe-haven-campfire-lone-nylon-guitar-slow-arpeggio-and-low-cello-loop.mp3",
  abbey: "/cdn/moodboard-gothic-horror/music-dark-fantasy-ruined-cathedral-distant-pipe-organ-drone-and-wordless-female-choir-loop.mp3",
  fen: "/cdn/moodboard-gothic-horror/music-dark-fantasy-drowned-marsh-cold-glass-harmonica-and-detuned-harp-over-deep-drone-loop.mp3",
  orchard: "/cdn/moodboard-gothic-horror/music-dark-fantasy-hanging-orchard-out-of-tune-fiddle-and-creaking-music-box-over-low-strings-loop.mp3",
};
// which track rests over each stretch of the road when nothing is fighting
const ZONE_MOOD = { fire: "camp", road: "road", toll: "road", gate: "road", court: "road", climb: "abbey", abbey: "abbey", nave: "abbey", crypt: "abbey", bonestair: "ossuary", ossuary: "ossuary", fenpath: "fen", fen: "fen", orchpath: "orchard", orchard: "orchard" };
// far-off sounds in the dark: one every 22-45 s, somewhere 14-26 m from a Bearer, picked by the stretch they walk
const DISTANT = {
  road: ["crow-caws-twice-and-flaps-away-in-fog", "distant-woman-sobbing-carried-on-wind", "iron-lantern-swinging-on-rusted-chain-creak", "far-off-wolf-howl-in-cold-night"],
  abbey: ["stone-crumbling-and-falling-in-a-vast-empty-hall", "single-cracked-bell-struck-far-below-ground", "wax-dripping-onto-hot-stone-hiss", "whispered-latin-prayer-echoing-in-a-crypt"],
  fen: ["something-large-slipping-into-black-water", "frog-croaks-stop-all-at-once-then-a-splash", "glass-wind-chime-tinkling-far-over-water", "drowned-man-gurgling-moan-under-water"],
  orchard: ["heavy-rope-creaking-under-a-swinging-weight", "crows-squabbling-over-something-in-dead-branches", "dry-leaves-skittering-across-wooden-boards", "a-trapdoor-banging-open-on-a-distant-gallows"],
  camp: ["log-collapsing-in-campfire-sparks-crackle", "kettle-lid-rattling-over-coals", "owl-hooting-low-in-the-dark"],
};
const VOICE = (line) => `/cdn/voice-weary-hoarse-old-woman-pilgrim-keeper-low-and-kind-saying-${line}.mp3`;
const MAELIN_LINES = ["bearer-the-fire-is-still-lit-sit-a-while", "you-came-back-not-all-of-them-do", "the-lanterns-remember-who-carried-them", "mind-the-road-it-has-teeth-tonight"];
// sound beds that live in the place: each a whisper heard only near its source
const BEDS = [
  { id: "bed-wind", x: 0, z: -40, clip: "ambience-cold-night-wind-through-ruins-loop", gain: 0.12, spatial: false },
  { id: "bed-camp", x: 0, z: 2, clip: "ambience-campfire-night-crickets-and-distant-owl-loop", gain: 0.18, max: 22 },
  { id: "bed-road", x: 3, z: -32, clip: "ambience-distant-church-bell-tolling-slow-with-crows-loop", gain: 0.15, max: 30 },
  { id: "bed-toll", x: 9, z: -46, clip: "ambience-creaking-wooden-shutters-and-chains-in-wind-loop", gain: 0.18, max: 16 },
  { id: "bed-gate", x: 0, z: -89, clip: "ambience-dripping-hot-wax-hiss-and-low-murmuring-voices-loop", gain: 0.22, max: 16 },
  { id: "bed-abbey", x: 0, z: -180, clip: "ambience-mouthless-choir-humming-and-cracked-bell-in-ruined-abbey-loop", gain: 0.16, max: 30 },
  { id: "bed-crypt", x: 0, z: -251, clip: "ambience-slow-cracked-bell-tolling-underground-crypt-with-dripping-wax-loop", gain: 0.16, max: 26 },
  { id: "bed-fen", x: -64, z: -10, clip: "ambience-night-marsh-frogs-dripping-water-and-faint-ghostly-chimes-loop", gain: 0.16, max: 30 },
  { id: "bed-orchard", x: 62, z: 6, clip: "ambience-dead-orchard-at-night-creaking-ropes-crows-and-dry-leaves-loop", gain: 0.16, max: 30 },
  { id: "bed-ossuary", x: -42, z: -266, clip: "ambience-vast-bone-ossuary-skulls-settling-dripping-wax-and-distant-whispered-prayer-loop", gain: 0.18, max: 24 },
  { id: "bed-bonestair", x: -20, z: -260, clip: "ambience-narrow-stone-stair-cold-draft-and-bones-clicking-loop", gain: 0.14, max: 12 },
  { id: "bed-court", x: 0, z: -105, clip: "ambience-low-ominous-choir-drone-cathedral-loop", gain: 0.14, max: 26 },
];
const PACKS = [
  { id: "p1", kind: "pilgrim", x: -1, z: -21 }, { id: "p2", kind: "pilgrim", x: 3, z: -23 },
  { id: "p3", kind: "pilgrim", x: 0, z: -29 }, { id: "p4", kind: "pilgrim", x: 3, z: -31 }, { id: "p5", kind: "pilgrim", x: -2, z: -33 },
  { id: "p6", kind: "pilgrim", x: 5, z: -44 }, { id: "p7", kind: "pilgrim", x: 10, z: -49 }, { id: "d1", kind: "deacon", x: 8, z: -46 },
  // past the Wax Veil: the Penitent Climb and the Ashen Abbey's yard
  { id: "a1", kind: "flagellant", x: 17, z: -131 }, { id: "a2", kind: "chorister", x: 15, z: -139 }, { id: "a3", kind: "deacon", x: 9, z: -149 },
  { id: "a4", kind: "flagellant", x: -4, z: -168 }, { id: "a5", kind: "chorister", x: 6, z: -171 }, { id: "a6", kind: "chorister", x: -8, z: -181 },
  { id: "a7", kind: "deacon", x: 4, z: -184 }, { id: "a8", kind: "deacon", x: -6, z: -188 }, { id: "a9", kind: "chorister", x: 9, z: -186 },
  { id: "p8", kind: "pilgrim", x: -3, z: -65 }, { id: "p9", kind: "pilgrim", x: 0, z: -69 }, { id: "p10", kind: "pilgrim", x: -5, z: -71 }, { id: "d2", kind: "deacon", x: -2, z: -68 },
];
PACKS.push({ id: "o1", kind: "chorister", x: -36, z: -257 }, { id: "o2", kind: "chorister", x: -38, z: -275 }, { id: "o3", kind: "deacon", x: -33, z: -266 }, { id: "o4", kind: "flagellant", x: -24, z: -261 }); // the Ossuary's sisters
const PETITIONS = [[4, -40], [13, -42], [11, -52], [3, -50], [17, -53]];
const MAELIN = { x: -5, z: -3 };
const OSWIN = { x: -6.2, z: 5.6 }; // the peddler at his handcart (x -7.6, z 4.4), facing the fire
const LINES = {
  0: "Maelin Sore: Another one who walked out of the fog. Sit, warm your hands. The road north was erased from every map I own, but the pilgrims still walk it, wax and all.",
  1: "Maelin Sore: They were people once. Now they shuffle toward the Abbey and tear at anything warm. Silence eight of them past the third milepost, and I'll trust the road again.",
  2: "Maelin Sore: The tollhouse kept petitions, the names of everyone who paid to pass. Bring me five. Wax-sealed. Someone wanted them forgotten.",
  3: "Maelin Sore: These names were taxed twice, once in coin and once in memory. The Bailiff still collects behind the Dripping Gate. Break him, and the road is ours.",
  4: "Maelin Sore: You rang his bell for the last time. Take this blade, it was my brother's oath. It cut true once. It will again.",
  5: "Maelin Sore: The Abbey road is open now. Climb it. The Ashen Abbey kept the lanterns of the Nine, once. Tell me what's left of it.",
  6: "Maelin Sore: The yard is crawling? Then quiet it. Nothing that sings without a mouth should be left standing.",
  7: "Maelin Sore: Wax saints in the yard... they poured the faithful over the dead so they'd remember. Listen to them. Wax keeps what stone forgets.",
  8: "Maelin Sore: A door that keeps its own counsel. Lay your hand on it before you come back to me.",
  9: "Maelin Sore: You touched the door? Sit, Bearer. Tell me everything.",
  11: "Maelin Sore: The nave is open? Then the crypt is under it. Go down, Bearer. Whatever rings that bell has been ringing it for a hundred years. Let it rest.",
  13: "Maelin Sore: Silent. I'd forgotten what the road sounds like without it. And this... the ninth lantern, in your hands. Eight were carried out of this valley. The first went west, past my fire, down the Fen Path. The Lanternmere took it, and the man who carried it never let go.",
  14: "Maelin Sore: Three waystones stand in the mere. The pilgrims lit them so the drowned could find their way home. Put the ninth flame to each of them.",
  15: "Maelin Sore: The stones burn and something stood up in the water? That is Tobin Vey. He swore to keep the first lantern until a Bearer came for it. Show him one has.",
  16: "Maelin Sore: Tobin's lantern. Still warm. He kept his oath for a hundred years, under black water. Rest it here by the fire a while. Then we decide where the second one went.",
  18: "Maelin Sore: The second lantern went east, with Saint Corvin's debtors. The Abbey hanged anyone who couldn't pay the lantern tithe from the orchard trees, and the Hangman kept that lantern lit so he could read their names while they swung. Take the Gallows Path. Cut them down, Bearer. Let them fall.",
  19: "Maelin Sore: Three of them still turn on their ropes. Cut them down, and he'll come off his gallows to see who's stealing his harvest.",
  20: "Maelin Sore: He climbed down? Then he's angry. Good. Angry men swing wide. Watch the boards under you, his gallows has more doors than floor.",
  21: "Maelin Sore: You have it? Bring it here, to the fire.",
  22: "Maelin Sore: He read the names to the very end, didn't he. Every one. The lantern smells of rope... Three found now. Five more burn somewhere in the dark, and the fire's warmer for each one. Have you noticed?",
  23: "Maelin Sore: The ledger in the Hangman's lantern names one more keeper. Ysolde, the last abbess. When the bell started ringing she took her sisters down under the crypt, into the ossuary, and sealed the stair with their own bones. The third lantern went down with her. The bell is quiet now, Bearer. The stair is open. Go west from the crypt and down.",
  24: "Maelin Sore: She woke? Then she knows what you came for. Don't kneel, whatever she says.",
  25: "Maelin Sore: Bring it up, Bearer. Bring it into the air.",
  26: "Maelin Sore: Cold light. The Abbess kept it lit with her own wax for a hundred years and never once let it warm her. Four lanterns on the rail now. Four still out in the dark, and one I won't name yet. Keep the candle she gave you. The cauldron will know what to do with it.",
  17: "Maelin Sore: Two lanterns found. Six still out there. Warm yourself, Bearer. The road is long, and it isn't done with us.",
  10: "Maelin Sore: The Ninth Bell. My mother sang of it: the Nine lit eight lanterns and hid the ninth inside the bell, so no hand could carry it off. Someone is ringing it from the inside. Take this. The door gave way under your hand, Bearer. Walk through it, down the nave, and stop that bell.",
};
// the Abbey chapter: where it begins, the three saints that speak, the door that won't
const ABBEY_YARD = { x: 0, z: -176, r: 18 };
const SAINTS = [
  { id: "a", x: 15, z: -183.2, line: "The Saint of Ledgers (wax, murmuring): \"I counted every coin the road paid. I counted the names. When the Bailiff asked for the ninth lantern, I gave him my ledger instead. He's still reading it.\"" },
  { id: "b", x: 16.2, z: -180, line: "The Saint of the Open Hand (wax, murmuring): \"We poured ourselves over the dead so the Abbey would remember them. The wax was warm. Then the bell rang, and it never stopped being warm.\"" },
  { id: "c", x: 14.6, z: -176.4, line: "The Saint Without Eyes (wax, murmuring): \"Nine lanterns. Eight were carried out. The ninth is in the bell, and the bell is behind the door, and the door only opens for a Bearer who carries fire.\"" },
];
const ABBEY_DOOR = { x: 0, z: -195.5 };
const AUTO = { 2: "The road falls quiet. The tollhouse lies ahead: find five wax-sealed petitions in its court.", 3: "Five petitions, five erased names. Beyond the Dripping Gate, the Bailiff is still collecting.", 4: "The bell is cracked. Return to Maelin at the Wayside Fire.",
  6: "The Ashen Abbey. Its yard is full of the faithful, still singing with no mouths. Silence six of them.",
  7: "The yard holds its breath. Three wax saints stand among the graves. Go close and listen.",
  8: "The saints are quiet again. The Abbey door stands at the top of the yard. Touch its seal.",
  9: "The seal is warm, and something behind it is ringing a bell very slowly. Bring this back to Maelin.",
  11: "The Burned Nave. The roof came down mid-hymn. Under your feet, a bell is ringing. The crypt lies at the nave's end.",
  14: "The Lanternmere. Black water to the knee, drowned trees, and three dark waystones standing in it. Light each with the ninth flame.",
  15: "The third stone takes the flame. At the heart of the mere the water rises, and something tall rises with it.",
  16: "The Warden sinks, and lets go. An iron lantern rolls onto the dais, its flame cold blue and steady. Carry it to Maelin.",
  19: "Saint Corvin's orchard. Black apple trees, and on three gibbets the hanged still turn. Stand beneath each one and cut the rope.",
  20: "The third body drops into the dead leaves. On the gallows, something in a hood climbs down, a lantern swinging from its chest.",
  21: "The Hangman falls across his own trapdoor. A rusted lantern rolls free, burning gold. Carry it to Maelin.",
  24: "The Ossuary of Saint Ysolde. Skulls to the vault, ten thousand of them, and every one turned toward the dais. On it, something tall in a black wax habit lifts its head.",
  25: "The Abbess folds down into her own bones. A pale lantern rolls off the reliquary, its flame cold as well water. Carry it up to Maelin.",
  12: "The Ninth Bell falls silent. In its crack a small gold flame still burns: the ninth lantern. Carry it back to Maelin." };
const NAVE_IN = (x, z) => z < -206 && z > -238 && Math.abs(x) < 7.5;
// the Wax Deacon's censer: bronze thurible hung at his right hip, coals glowing, incense smoke rising
const CENSER = { id: "censer", feetPosition: { x: 0.34, y: 0.62, z: -0.08 }, pivot: "top", behavior: "scripts/censer-swing.js", castShadow: true, primitive: { kind: "scripted", script: "scripts/gen/censer.js", params: { chain: 0.42 }, seed: 7 },
  fx: { script: `fx\npop smoke rate=?mobile:5|9 on=sphere(.05) life=1.6..2.6 v=up(.35..0.6)+sdir()*.08 size=.07..0.12 acc=buoy(.4)+curl(.4)*.4+drag(.9) sz=$size*(.6>3) col=<.42,.38,.34>><.2,.2,.22> a=0>.2:.35>.7:.2>0 rot=spin(.2) r=sprite(smoke-puff,alpha)\npop glow n=1 glo=fire()*.6 r=light(<1,.5,.2>,$glo*.8,2.5)`, params: {} } };
const enemySpec = (pk) => ({
  id: "en-" + pk.id, tags: ["enemy", pk.kind], physics: "character",
  feetPosition: { x: pk.x, z: pk.z, y: { terrain: 0 } },
  scale: pk.kind === "deacon" ? 1.35 : 1,
  ...body(pk.kind), behavior: ["scripts/humanoid-locomotion.js"],
  children: [{ id: "head-flame", feetPosition: { x: 0, y: pk.kind === "deacon" ? 1.72 : pk.kind === "chorister" ? 1.9 : pk.kind === "flagellant" ? 1.05 : 1.62, z: 0 }, fx: { script: `fx\npop f rate=flick(.5,.3)*18 on=point() life=.25..0.45 v=up(.5..0.9) size=.05..0.09 col=hdr(4,2.4,.7)>hdr(1.5,.4,.08) a=0>.2:1>0 r=sprite(flame-wisp,add)\npop l n=1 glo=fire()*.8 r=light(<1,.6,.3>,$glo*1.5,5)`, params: {} } }, ...(pk.kind === "deacon" ? [CENSER] : [])],
  state: { kind: pk.kind, hp: C[pk.kind].hp, maxHp: C[pk.kind].hp, home: { x: pk.x, y: 0, z: pk.z } },
});
const near = (ctx, x, z, r) => ctx.place.players.some((p) => Math.hypot(p.feetPosition.x - x, p.feetPosition.z - z) < r);

function say(ctx, p, stage) { p.state.dialog = { text: LINES[stage], at: ctx.now() }; }

export function tick(ctx) {
  const st = ctx.place.state, now = ctx.now(), objs = ctx.place.objects;
  musicTick(ctx, st, now, objs);
  if (!("wax-pack" in objs)) ctx.spawn("wax-pack", { tags: ["system"], feetPosition: { x: 0, y: -50, z: 0 }, behavior: "scripts/wax-pack.js" });
  if (!("maelin" in objs)) ctx.spawn("maelin", { tags: ["npc"], physics: "character", feetPosition: { x: MAELIN.x, z: MAELIN.z, y: { terrain: 0 } }, rotation: 120,
    model: "cdn/model-weathered-woman-mapmaker-hooded-cloak-satchel-of-maps.glb", behavior: ["scripts/humanoid-locomotion.js"], state: { name: "Maelin Sore" } });
  if (!("oswin" in objs)) ctx.spawn("oswin", { tags: ["npc", "vendor"], physics: "character", feetPosition: { x: OSWIN.x, z: OSWIN.z, y: { terrain: 0 } }, rotation: { lookAt: { x: 0, y: 0, z: 4.5 } },
    model: "cdn/model-hunched-old-peddler-man-leather-apron-candle-bundles-on-back.glb", behavior: ["scripts/humanoid-locomotion.js"], state: { name: "Oswin Tallowmonger" } });
  if (!("hollin" in objs)) ctx.spawn("hollin", { tags: ["npc", "trainer"], physics: "character", feetPosition: { x: 4.2, z: 76.5, y: { terrain: 0 } }, rotation: { lookAt: { x: 0, y: 0, z: 68 } },
    model: "cdn/model-scarred-grey-haired-swordmaster-long-dark-coat-greatsword-on-back.glb", layout: { maxExtents: { y: 1.85 } }, castShadow: true,
    behavior: ["scripts/humanoid-locomotion.js"], state: { name: "Ser Hollin Vey" },
    children: [{ id: "rack", feetPosition: { x: -1.1, y: 0, z: 0.4 }, rotation: 20, primitive: { kind: "box", width: 1.2, height: 1.1, depth: 0.25 }, material: { texture: "cdn/texture-dark-weathered-oak-planks.png" }, physics: "static" },
      { id: "lamp", feetPosition: { x: -1.1, y: 1.6, z: 0.4 }, light: { kind: "point", color: "oklch(0.8 0.13 65)", intensity: 1.4, distance: 6 } }] });
  if (!("crier" in objs)) ctx.spawn("crier", { tags: ["npc"], physics: "character", feetPosition: { x: 3.2, z: 7.4, y: { terrain: 0 } },
    model: "/cdn/value.fe868b233c1ac6e6cc4bf419d87cbd276ffeffb08bc2f44f23fc3b48057f42f6.glb", layout: { maxExtents: { y: 1.75 } }, castShadow: true,
    behavior: ["scripts/humanoid-locomotion.js", "scripts/crier.js"], state: { name: "Brother Ledd", turnTo: "none" },
    children: [{ id: "lamp", feetPosition: { x: 0.32, y: 1.05, z: -0.15 }, light: { kind: "point", color: "oklch(0.8 0.13 65)", intensity: 1.6, distance: 6 } }] });
  PETITIONS.forEach(([x, z], i) => {
    const id = "petition-" + (i + 1);
    if (!(id in objs)) ctx.spawn(id, { tags: ["petition"], feetPosition: { x, z, y: { terrain: 0.02 } }, rotation: { yaw: i * 70 },
      model: { id: "/cdn/value.3c60cb6d850afbc2c860e26a7eb36a99277bd2ba780f319efaa32e5aaa99622d.glb", forward: "+z" }, layout: { maxExtents: { x: 0.45 } }, castShadow: true, receiveShadow: true,
      physics: { body: "static", trigger: true, collider: "sphere" }, behavior: "scripts/petition.js",
      fx: { script: `fx\npop m rate=4 on=disc(.4) life=1..1.6 v=up(.3..0.6) size=.03..0.05 col=hdr(2.4,1.6,.6) a=0>.8:1>0 r=sprite(mote,add)` } });
  });
  // enemies: a slain pack member returns after 45 s, only where nobody is watching
  st.respawn ??= {};
  if (!st.seeded) { st.seeded = true; for (const pk of PACKS) if (!(("en-" + pk.id) in objs)) ctx.spawn(enemySpec(pk)); return; }
  for (const pk of PACKS) {
    const id = "en-" + pk.id;
    if (id in objs) continue;
    if (!st.respawn[pk.id]) { st.respawn = { ...st.respawn, [pk.id]: now + 45000 }; continue; }
    if (now > st.respawn[pk.id] && !near(ctx, pk.x, pk.z, 22)) { ctx.spawn(enemySpec(pk)); const r = { ...st.respawn }; delete r[pk.id]; st.respawn = r; }
  }
  // the Bailiff: stands in his arena; 90 s after he falls, a new one is poured
  const boss = objs["bailiff"];
  if (!boss || (boss.state.dead && now - boss.state.deadAt > 90000 && !near(ctx, 0, -105, 25))) {
    if (boss) ctx.destroy("bailiff");
    else ctx.spawn("bailiff", { tags: ["enemy", "boss"], physics: "character", feetPosition: { x: 0, z: -110, y: { terrain: 0 } }, scale: 2.1, rotation: 180,
      ...body("bailiff"), behavior: ["scripts/humanoid-locomotion.js", "scripts/bailiff.js"],
      fx: { script: `fx\npop f rate=flick(.6,.3)*40 on=disc(.35).c(3.9) life=.25..0.5 v=up(.6..1.1) size=.06..0.12 col=hdr(4,2.4,.7)>hdr(1.5,.4,.08) a=0>.2:1>0 r=sprite(flame-wisp,add)\npop l n=1 at=point().c(4) glo=fire() r=light(<1,.55,.25>,$glo*4,10)` } });
  }
  // the Ringer: waits in the Bell Crypt; 120 s after he falls, the bell makes another
  const ringer = objs["ringer"];
  if (!ringer || (ringer.state.dead && now - ringer.state.deadAt > 120000 && !near(ctx, 0, -251, 26))) {
    if (ringer) ctx.destroy("ringer");
    else ctx.spawn("ringer", { tags: ["enemy", "boss"], physics: "character", feetPosition: { x: 0, z: -252, y: { terrain: 0 } }, scale: 1.8, rotation: 0,
      ...body("ringer"), behavior: ["scripts/humanoid-locomotion.js", "scripts/ringer.js"],
      fx: { script: `fx\npop m rate=6 on=sphere(.4).c(3.6) life=1..1.8 v=up(.3..0.6) size=.03..0.06 col=hdr(3,2.2,.8) a=0>.9:1>0 r=sprite(mote,add)\npop l n=1 at=point().c(3.7) glo=fire()*.7 r=light(<1,.7,.35>,$glo*4,9)` } });
  }
  // the Lantern Warden: sleeps under the mere until a Bearer has lit all three stones; 120 s after he sinks, the water gives him back
  const warden = objs["warden"], called = ctx.place.players.some((p) => (p.state.quest?.stage ?? 0) === 15);
  if (warden && warden.state.dead && now - warden.state.deadAt > 120000 && !near(ctx, FEN_HEART.x, FEN_HEART.z, 22)) ctx.destroy("warden");
  else if (!warden && called) ctx.spawn("warden", { tags: ["enemy", "boss"], physics: "character", feetPosition: { x: FEN_HEART.x, z: FEN_HEART.z, y: { terrain: 0 } }, scale: 1.7, rotation: 90,
    ...body("warden"), behavior: ["scripts/humanoid-locomotion.js", "scripts/warden.js"],
    fx: { script: `fx\npop w rate=8 on=sphere(.35).c(3.5) life=1..1.8 v=up(.2..0.5)+sdir()*.15 size=.04..0.07 col=hdr(.6,2.2,2) a=0>.9:1>0 r=sprite(mote,add)\npop d rate=10 on=disc(.8) life=.6..1 v=up(.1..0.3) size=.04..0.08 acc=grav()*.3 col=<.5,.62,.64> a=.6>0 r=sprite(soft-disc,alpha)\npop l n=1 at=point().c(3.6) glo=fire()*.7 r=light(<.45,1,.95>,$glo*5,10)` } });
  // the Hangman: waits on his gallows until a Bearer has cut down all three hanged; 120 s after he falls, he climbs back up
  const hangman = objs["hangman"], hcalled = ctx.place.players.some((p) => (p.state.quest?.stage ?? 0) === 20);
  if (hangman && hangman.state.dead && now - hangman.state.deadAt > 120000 && !near(ctx, GALLOWS.x, GALLOWS.z, 22)) ctx.destroy("hangman");
  else if (!hangman && hcalled) ctx.spawn("hangman", { tags: ["enemy", "boss"], physics: "character", feetPosition: { x: GALLOWS.x, z: GALLOWS.z, y: { terrain: 0 } }, scale: 1.7, rotation: 90,
    ...body("hangman"), behavior: ["scripts/humanoid-locomotion.js", "scripts/hangman.js"],
    fx: { script: `fx\npop f rate=flick(.6,.3)*14 on=sphere(.12).c(2.4) life=.3..0.6 v=up(.3..0.7) size=.05..0.1 col=hdr(4,2.6,.9)>hdr(1.4,.5,.1) a=0>.2:1>0 r=sprite(flame-wisp,add)\npop l n=1 at=point().c(2.4) glo=fire() r=light(<1,.62,.3>,$glo*4,10)` } });
  // the Ossuary Abbess: sleeps on her reliquary until a Bearer walks into the ossuary on her chapter; 150 s after she falls, the wax stands her up again
  const abbess = objs["abbess"], acalled = ctx.place.players.some((p) => (p.state.quest?.stage ?? 0) === 24);
  if (abbess && abbess.state.dead && now - abbess.state.deadAt > 150000 && !near(ctx, OSSUARY.x, OSSUARY.z, 22)) ctx.destroy("abbess");
  else if (!abbess && acalled) ctx.spawn("abbess", { tags: ["enemy", "boss"], physics: "character", feetPosition: { x: RELIQUARY.x, z: RELIQUARY.z, y: { terrain: 0 } }, scale: 1.6, rotation: { lookAt: { x: OSSUARY.x + 10, y: 0, z: OSSUARY.z } },
    ...body("abbess"), behavior: ["scripts/humanoid-locomotion.js", "scripts/abbess.js"],
    fx: { script: `fx\npop m rate=7 on=sphere(.3).c(2.6) life=1.2..2 v=up(.2..0.5)+sdir()*.1 size=.03..0.06 col=hdr(.8,2.2,2.1) a=0>.9:1>0 r=sprite(mote,add)\npop c rate=flick(.5,.3)*16 on=point().c(2.75) life=.3..0.5 v=up(.4..0.8) size=.05..0.09 col=hdr(1.2,2.6,2.6)>hdr(.3,.8,.9) a=0>.2:1>0 r=sprite(flame-wisp,add)\npop l n=1 at=point().c(2.7) glo=fire()*.8 r=light(<.6,.95,1>,$glo*4,10)` } });
  // the hanged hang until someone has cut them down
  const cutAny = new Set();
  for (const p of ctx.place.players) { const qq = p.state.quest; if (!qq) continue; if (p.state.menu) continue; if (qq.stage === 20) GIBBETS.forEach((g) => cutAny.add(g.id)); else if (qq.stage === 19) (qq.cut ?? []).forEach((id) => cutAny.add(id)); }
  for (const g of GIBBETS) { const h = objs[`orch-gibbet-${g.id}/hanged`], want = !cutAny.has(g.id); if (h && h.visible !== want) h.visible = want;
    // each one creaks on its rope while it hangs; the sound goes with the body
    const cid = `orch-creak-${g.id}`, c = objs[cid], clip = "/cdn/moodboard-gothic-horror/sfx-thick-hemp-rope-creaking-slowly-under-a-swinging-weight-loop.mp3";
    if (!c) ctx.spawn(cid, { tags: ["ambience", "orchard"], feetPosition: { x: g.x, y: 3, z: g.z }, audio: want ? { clip, loop: true, gain: 0.22, maxDistance: 12, bus: "Ambience" } : null });
    else if (!!c.audio !== want) c.audio = want ? { clip, loop: true, gain: 0.22, maxDistance: 12, bus: "Ambience" } : null;
  }
  if (!("orch-rookery" in objs)) ctx.spawn("orch-rookery", { tags: ["ambience", "orchard"], feetPosition: { x: 70, y: 5, z: 18 },
    audio: { clip: "/cdn/moodboard-gothic-horror/ambience-crow-rookery-in-dead-trees-at-night-occasional-caws-and-wingbeats-loop.mp3", loop: true, gain: 0.18, maxDistance: 26, bus: "Ambience" } });
  // the Lantern Rail by the fire: each lantern of the Nine hangs burning once a Bearer here has brought it home
  let top = 0; for (const p of ctx.place.players) if (p.state.charId && !p.state.menu) top = Math.max(top, p.state.quest?.stage ?? 0);
  for (const [n, at] of [[9, 13], [1, 17], [2, 22]]) {
    const l = objs[`lantern-rail/lantern-${n}`], want = top >= at;
    if (l && !!l.state.lit !== want) {
      l.state.lit = want; l.visible = want;
      l.light = want ? { kind: "point", color: l.state.light, intensity: 3, distance: 7 } : null;
      if (want && st.railSeen?.[n] !== true) {
        st.railSeen = { ...(st.railSeen ?? {}), [n]: true };
        const w = l.worldFeetPosition ?? l.feetPosition;
        ctx.emit("fx", { position: { x: w.x, y: w.y - 0.3, z: w.z }, script: `fx\npop m burst=40 on=sphere(.2) life=.8..1.6 v=up(.4..1)+sdir()*.4 size=.03..0.06 col=hdr(3,2.2,1) a=1>0 r=sprite(mote,add)` });
        ctx.emit("playSound", { clip: "/cdn/moodboard-gothic-horror/sfx-cold-lantern-flame-catches-with-soft-whoosh-and-chime.mp3", position: w, volume: 0.7, maxDistance: 20 });
      }
    }
  }
  // the waystones burn for anyone who has lit them, and go dark while the Warden drowns them
  const litAny = new Set();
  for (const p of ctx.place.players) { const qq = p.state.quest; if (!qq) continue; if (qq.stage >= 15) WAYSTONES.forEach((w) => litAny.add(w.id)); else if (qq.stage === 14) (qq.stones ?? []).forEach((id) => litAny.add(id)); }
  for (const w of WAYSTONES) {
    const want = litAny.has(w.id) && !st.fenDark, fl = objs[`fen-stone-${w.id}/flame`];
    if (fl && !!fl.state.lit !== want) {
      fl.state.lit = want;
      fl.fx = want ? { script: `fx\npop f rate=flick(.5,.3)*30 on=disc(.08) life=.3..0.6 v=up(.5..1) size=.08..0.16 col=hdr(.7,2.6,2.3)>hdr(.2,.9,.9) a=0>.2:1>0 r=sprite(flame-wisp,add)\npop l n=1 at=point() glo=fire() r=light(<.5,1,.95>,$glo*3.5,9)` } : null;
    }
  }
  // each player's road
  for (const p of ctx.place.players) {
    const s = p.state; if (s.hp === undefined || s.menu || !s.charId) continue; // only a Bearer who entered the world
    // Oswin's cart: talking opens it; walking off or falling closes it
    if (s.talk?.id === "oswin" && s.talk.at !== s.shopAt) {
      s.shop = "oswin"; s.shopAt = s.talk.at;
      s.dialog = { text: "Oswin: \"Candles, oil, tonics. Coin up front, Bearer: the road doesn't refund.\"", at: now };
    }
    if (s.shop) { const o = objs["oswin"]; if (s.dead || !o || Math.hypot(o.feetPosition.x - p.feetPosition.x, o.feetPosition.z - p.feetPosition.z) > 5) s.shop = null; }
    const q = s.quest ?? { stage: 0 };
    let next = null;
    const talked = s.talk && s.talk.id === "maelin" && s.talk.at !== q.heardAt;
    if (talked && now - (st.maelinSpoke ?? 0) > 9000) { st.maelinSpoke = now; st.maelinLine = ((st.maelinLine ?? -1) + 1) % MAELIN_LINES.length;
      const m = objs["maelin"]; ctx.emit("playSound", { clip: VOICE(MAELIN_LINES[st.maelinLine]), position: m ? m.feetPosition : p.feetPosition, volume: 1, bus: "Voice", mode: "restart", maxDistance: 22 }); ctx.music?.duck(0.35, { duration: 3.5 }); }
    if (talked) {
      if (q.stage === 0) next = { stage: 1, killsAt: s.kills ?? 0 };
      else if (q.stage === 4) {
        if (!s.claimed?.["Z01-MAIN-05"]) {
          s.claimed = { ...(s.claimed ?? {}), "Z01-MAIN-05": now };
          s.xp = (s.xp ?? 0) + 300; s.copper = (s.copper ?? 0) + E.quests["Z01-MAIN-05"]; s.weapon = "ITEM-001";
          ctx.emit("playSound", { clip: "/cdn/moodboard-gothic-horror/sfx-quest-complete-low-bells-and-choir.mp3", position: p.feetPosition, volume: 1 }, { audience: { player: p.id } });
          ctx.emit("screenFlash", { color: "#ffe2a8", duration: 0.35, intensity: 0.1 }, { audience: { player: p.id } });
          ctx.emit("milestone", { step: 4, name: "z01-complete" }, { audience: { player: p.id } });
        }
        next = { stage: 5 };
      }
      else if (q.stage === 9) {
        if (!s.claimed?.["Z01-MAIN-06"]) {
          s.claimed = { ...(s.claimed ?? {}), "Z01-MAIN-06": now };
          s.xp = (s.xp ?? 0) + 400; s.copper = (s.copper ?? 0) + E.quests["Z01-MAIN-06"]; s.tonics = Math.max(s.tonics ?? 0, 5);
          ctx.emit("playSound", { clip: "/cdn/moodboard-gothic-horror/sfx-quest-complete-low-bells-and-choir.mp3", position: p.feetPosition, volume: 1 }, { audience: { player: p.id } });
          ctx.emit("screenFlash", { color: "#ffe2a8", duration: 0.35, intensity: 0.1 }, { audience: { player: p.id } });
          ctx.emit("milestone", { step: 9, name: "abbey-chapter-complete" }, { audience: { player: p.id } });
        }
        next = { stage: 10 };
      }
      else if (q.stage === 12) {
        if (!s.claimed?.["Z01-MAIN-07"]) {
          s.claimed = { ...(s.claimed ?? {}), "Z01-MAIN-07": now };
          s.xp = (s.xp ?? 0) + 600; s.copper = (s.copper ?? 0) + E.quests["Z01-MAIN-07"]; s.maxHp = (s.maxHp ?? 100) + 10; s.hp = s.maxHp;
          ctx.emit("playSound", { clip: "/cdn/moodboard-gothic-horror/sfx-quest-complete-low-bells-and-choir.mp3", position: p.feetPosition, volume: 1 }, { audience: { player: p.id } });
          ctx.emit("screenFlash", { color: "#ffe2a8", duration: 0.4, intensity: 0.12 }, { audience: { player: p.id } });
          ctx.emit("damageNumber", { position: { ...p.feetPosition, y: p.feetPosition.y + 2.6 }, text: "THE NINTH FLAME · +10 LIFE", color: "#ffd27a", size: 1.2 }, { audience: { player: p.id } });
          ctx.emit("milestone", { step: 13, name: "ninth-bell-chapter-complete" }, { audience: { player: p.id } });
        }
        next = { stage: 13 };
      }
      else if (q.stage === 16) {
        if (!s.claimed?.["Z01-MAIN-08"]) {
          s.claimed = { ...(s.claimed ?? {}), "Z01-MAIN-08": now };
          s.xp = (s.xp ?? 0) + 800; s.copper = (s.copper ?? 0) + E.quests["Z01-MAIN-08"]; s.maxHp = (s.maxHp ?? 100) + 10; s.hp = s.maxHp; s.tonics = Math.max(s.tonics ?? 0, 5);
          ctx.emit("playSound", { clip: "/cdn/moodboard-gothic-horror/sfx-quest-complete-low-bells-and-choir.mp3", position: p.feetPosition, volume: 1 }, { audience: { player: p.id } });
          ctx.emit("screenFlash", { color: "#bff3ee", duration: 0.4, intensity: 0.12 }, { audience: { player: p.id } });
          ctx.emit("damageNumber", { position: { ...p.feetPosition, y: p.feetPosition.y + 2.6 }, text: "THE FIRST LANTERN · +10 LIFE", color: "#9fe8e0", size: 1.2 }, { audience: { player: p.id } });
          ctx.emit("milestone", { step: 17, name: "drowned-lantern-chapter-complete" }, { audience: { player: p.id } });
        }
        next = { stage: 17 };
      }
      else if (q.stage === 17) next = { stage: 18 };
      else if (q.stage === 22) next = { stage: 23 };
      else if (q.stage === 25) {
        if (!s.claimed?.["Z01-MAIN-10"]) {
          s.claimed = { ...(s.claimed ?? {}), "Z01-MAIN-10": now };
          s.xp = (s.xp ?? 0) + 1300; s.copper = (s.copper ?? 0) + E.quests["Z01-MAIN-10"]; s.maxHp = (s.maxHp ?? 100) + 10; s.hp = s.maxHp; s.tonics = Math.max(s.tonics ?? 0, 5);
          ctx.emit("playSound", { clip: "/cdn/moodboard-gothic-horror/sfx-quest-complete-low-bells-and-choir.mp3", position: p.feetPosition, volume: 1 }, { audience: { player: p.id } });
          ctx.emit("screenFlash", { color: "#bff3ee", duration: 0.4, intensity: 0.12 }, { audience: { player: p.id } });
          ctx.emit("damageNumber", { position: { ...p.feetPosition, y: p.feetPosition.y + 2.6 }, text: "THE THIRD LANTERN · +10 LIFE", color: "#bff3ee", size: 1.2 }, { audience: { player: p.id } });
          ctx.emit("milestone", { step: 26, name: "ossuary-chapter-complete" }, { audience: { player: p.id } });
        }
        next = { stage: 26 };
      }
      else if (q.stage === 21) {
        if (!s.claimed?.["Z01-MAIN-09"]) {
          s.claimed = { ...(s.claimed ?? {}), "Z01-MAIN-09": now };
          s.xp = (s.xp ?? 0) + 1000; s.copper = (s.copper ?? 0) + E.quests["Z01-MAIN-09"]; s.maxHp = (s.maxHp ?? 100) + 10; s.hp = s.maxHp; s.tonics = Math.max(s.tonics ?? 0, 5);
          ctx.emit("playSound", { clip: "/cdn/moodboard-gothic-horror/sfx-quest-complete-low-bells-and-choir.mp3", position: p.feetPosition, volume: 1 }, { audience: { player: p.id } });
          ctx.emit("screenFlash", { color: "#ffd9a0", duration: 0.4, intensity: 0.12 }, { audience: { player: p.id } });
          ctx.emit("damageNumber", { position: { ...p.feetPosition, y: p.feetPosition.y + 2.6 }, text: "THE SECOND LANTERN · +10 LIFE", color: "#ffc87a", size: 1.2 }, { audience: { player: p.id } });
          ctx.emit("milestone", { step: 22, name: "gallows-orchard-chapter-complete" }, { audience: { player: p.id } });
        }
        next = { stage: 22 };
      }
      say(ctx, p, next ? next.stage : q.stage);
      if (!next) s.quest = { ...q, heardAt: s.talk.at };
    }
    if (q.stage === 1 && (s.kills ?? 0) - (q.killsAt ?? 0) >= 8) next = { stage: 2 };
    if (q.stage === 2 && (s.petitions?.length ?? 0) >= 5) next = { stage: 3 };
    if (q.stage === 3 && s.bossKilled) next = { stage: 4 };
    if (q.stage < 3 && s.bossKilled) s.bossKilled = false; // only counts once the hunt is yours
    // the Abbey chapter
    const px = p.feetPosition.x, pz = p.feetPosition.z;
    if (!next && q.stage === 5 && Math.hypot(px - ABBEY_YARD.x, pz - ABBEY_YARD.z) < ABBEY_YARD.r) next = { stage: 6, killsAt: s.kills ?? 0 };
    if (!next && q.stage === 6 && (s.kills ?? 0) - (q.killsAt ?? 0) >= 6) next = { stage: 7, saints: [] };
    if (!next && q.stage === 7) {
      const heard = q.saints ?? [];
      for (const st of SAINTS) if (!heard.includes(st.id) && Math.hypot(px - st.x, pz - st.z) < 2.6) {
        const h = [...heard, st.id];
        s.quest = { ...q, saints: h }; s.dialog = { text: st.line, at: now };
        ctx.emit("playSound", { clip: "/cdn/moodboard-gothic-horror/sfx-wax-saint-whisper-murmur-chime.mp3", position: { x: st.x, y: p.feetPosition.y + 1.5, z: st.z }, volume: 0.9 }, { audience: { player: p.id } });
        ctx.emit("fx", { position: { x: st.x, y: p.feetPosition.y + 1.6, z: st.z }, script: `fx\npop m burst=40 on=sphere(.5) life=1..1.8 v=up(.4..0.9)+sdir()*.3 size=.03..0.06 col=hdr(.8,2,2.2) a=1>0 r=sprite(mote,add)` }, { audience: { player: p.id } });
        if (h.length >= SAINTS.length) next = { stage: 8, saints: h, silentAt: now };
        break;
      }
    }
    if (!next && q.stage === 8 && now - (q.silentAt ?? 0) > 6000 && Math.hypot(px - ABBEY_DOOR.x, pz - ABBEY_DOOR.z) < 5.5) {
      next = { stage: 9 };
      ctx.emit("screenShake", { intensity: 0.25, duration: 0.6 }, { audience: { player: p.id } });
      ctx.emit("playSound", { clip: "/cdn/moodboard-gothic-horror/sfx-cracked-bell-tolls-once-behind-a-sealed-door.mp3", position: p.feetPosition, volume: 1 }, { audience: { player: p.id } });
    }
    if (!next && q.stage === 10 && NAVE_IN(px, pz)) next = { stage: 11 };
    if (!next && q.stage === 11 && s.ringerKilled) next = { stage: 12 };
    if (q.stage < 11 && s.ringerKilled) s.ringerKilled = false;
    // the Drowned Lantern
    if (!next && q.stage === 13 && Math.hypot(px - FEN.x, pz - FEN.z) < FEN.r) next = { stage: 14, stones: [] };
    if (!next && q.stage === 14) {
      const lit = q.stones ?? [];
      for (const w of WAYSTONES) if (!lit.includes(w.id) && Math.hypot(px - w.x, pz - w.z) < 2.6) {
        const l = [...lit, w.id];
        s.quest = { ...q, stones: l };
        s.dialog = { text: `The ninth flame leans toward the stone, and the stone takes it. (${l.length}/3)`, at: now };
        ctx.emit("playSound", { clip: "/cdn/moodboard-gothic-horror/sfx-cold-lantern-flame-catches-with-soft-whoosh-and-chime.mp3", position: { x: w.x, y: 1.6, z: w.z }, volume: 0.9 }, { audience: { player: p.id } });
        ctx.emit("fx", { position: { x: w.x, y: 1.6, z: w.z }, script: `fx\npop m burst=50 on=sphere(.4) life=.8..1.6 v=up(.6..1.4)+sdir()*.5 size=.03..0.06 col=hdr(.8,2.4,2.2) a=1>0 r=sprite(mote,add)` });
        if (l.length >= WAYSTONES.length) next = { stage: 15, stones: l };
        break;
      }
    }
    if (!next && q.stage === 15 && s.wardenKilled) next = { stage: 16 };
    if (q.stage < 15 && s.wardenKilled) s.wardenKilled = false;
    // the Gallows Orchard
    if (!next && q.stage === 18 && Math.hypot(px - ORCHARD.x, pz - ORCHARD.z) < ORCHARD.r) next = { stage: 19, cut: [] };
    if (!next && q.stage === 19) {
      const done = q.cut ?? [], g = GIBBETS.find((g) => !done.includes(g.id) && Math.hypot(px - g.x, pz - g.z) < 2.6);
      if (!g) { if (q.sawing) s.quest = { ...q, sawing: null }; }
      else if (q.sawing?.id !== g.id) {
        s.quest = { ...q, sawing: { id: g.id, at: now } };
        s.dialog = { text: "You reach up and saw at the rope. Hold still...", at: now };
        ctx.emit("playSound", { clip: "/cdn/moodboard-gothic-horror/sfx-blade-sawing-through-thick-old-rope.mp3", position: { x: g.x, y: 2, z: g.z }, volume: 0.9 }, { audience: { player: p.id } });
      } else if (now - q.sawing.at > 1500) {
        const c = [...done, g.id];
        s.quest = { ...q, cut: c, sawing: null };
        s.dialog = { text: `The rope parts. The body drops into the leaves and lies still at last. (${c.length}/3)`, at: now };
        ctx.emit("playSound", { clip: "/cdn/moodboard-gothic-horror/sfx-rope-snaps-and-body-drops-onto-dry-leaves.mp3", position: { x: g.x, y: 1, z: g.z }, volume: 1 });
        ctx.emit("fx", { position: { x: g.x, y: 0.3, z: g.z - 1.5 }, script: `fx\npop leaves burst=40 on=disc(.8) life=1..2 v=up(1..2.5)+sdir()*1.2 size=.05..0.1 acc=grav()*.3+drag(1.5)+curl(.6) spin=-6..6 rot=$age*$spin col=<.32,.22,.14> a=1>0 floor=stick r=sprite(stalk,alpha)\npop m burst=24 on=sphere(.4).c(1.8) life=1..1.8 v=up(.5..1.2) size=.03..0.06 col=hdr(3,2.2,.8) a=1>0 r=sprite(mote,add)` });
        if (c.length >= GIBBETS.length) next = { stage: 20, cut: c };
      }
    }
    if (!next && q.stage === 20 && s.hangmanKilled) next = { stage: 21 };
    // the Ossuary
    if (!next && q.stage === 23 && Math.hypot(px - OSSUARY.x, pz - OSSUARY.z) < OSSUARY.r - 3) next = { stage: 24 };
    if (!next && q.stage === 24 && s.abbessKilled) next = { stage: 25 };
    if (q.stage < 24 && s.abbessKilled) s.abbessKilled = false;
    if (q.stage < 20 && s.hangmanKilled) s.hangmanKilled = false;
    if (next) {
      s.quest = { ...q, ...next, heardAt: talked ? s.talk.at : q.heardAt };
      if (!talked && next.stage !== 8) s.dialog = { text: AUTO[next.stage], at: now };
      if (next.stage === 8) s.dialog = { text: s.dialog.text + " (The saints fall quiet. The Abbey door waits at the top of the yard.)", at: now };
      if (next.stage !== 1) ctx.emit("playSound", { clip: "/cdn/moodboard-gothic-horror/sfx-objective-complete-soft-bell.mp3", position: p.feetPosition, volume: 0.8 }, { audience: { player: p.id } });
      ctx.emit("milestone", { step: next.stage, name: "z01-stage-" + next.stage }, { audience: { player: p.id } });
    }
    // levels
    const L = C.levels; let lvl = 1; while (lvl < L.length && (s.xp ?? 0) >= L[lvl]) lvl++;
    if (lvl > (s.level ?? 1)) {
      const gain = (lvl - (s.level ?? 1)) * 12;
      s.level = lvl; s.maxHp = (s.maxHp ?? 100) + gain; s.hp += s.maxHp - s.hp;
      ctx.emit("fx", { position: p.feetPosition, script: `fx\npop up burst=60 on=disc(.8) life=.8..1.4 v=up(2..4) size=.04..0.08 col=hdr(3,2.4,1.2) a=1>0 r=sprite(mote,add)\npop r burst=1 life=.6 size=3 col=hdr(2,1.6,.8) a=.8>0 sz=$size*(.3>1.4) r=sprite(soft-disc,add)` });
      ctx.emit("playSound", { clip: "/cdn/moodboard-gothic-horror/sfx-level-up-rising-chime-and-bell.mp3", position: p.feetPosition, volume: 0.9 });
      ctx.emit("damageNumber", { position: { ...p.feetPosition, y: p.feetPosition.y + 2.4 }, text: `LEVEL ${lvl}`, color: "#ffd27a", size: 1.4 });
    }
  }
}

function musicTick(ctx, st, now, objs) {
  if (!st.bedsV7) { st.bedsV7 = true;
    for (const b of BEDS) if (!(b.id in objs)) ctx.spawn(b.id, { tags: ["ambience"], feetPosition: { x: b.x, y: 1.5, z: b.z },
      audio: { clip: `/cdn/moodboard-gothic-horror/${b.clip}.mp3`, loop: true, gain: b.gain, spatial: b.spatial ?? true, maxDistance: b.max ?? 40, bus: "Ambience" } }); }
  const boss = objs["bailiff"]?.state;
  let fighting = false;
  for (const e of ctx.query({ tags: ["enemy"] })) if (e.state?.hunting && !e.state?.dead) { fighting = true; break; }
  if (fighting) st.fightUntil = now + 6000; // a short tail so the drums don't stutter between pulls
  const rg = objs["ringer"]?.state, wd = objs["warden"]?.state, hg = objs["hangman"]?.state, ab = objs["abbess"]?.state;
  const live = ctx.place.players.filter((p) => p.state?.charId && !p.state?.menu && !p.state?.dead);
  if (!live.length) return; // nobody on the road: the Veil owns the jukebox
  const tally = {}; for (const p of live) { const z = ZONE_MOOD[p.state.area] ?? "road"; tally[z] = (tally[z] ?? 0) + 1; }
  const rest = Object.entries(tally).sort((a, b) => b[1] - a[1])[0][0];
  const up = (b) => b?.engaged && !b?.dead;
  const mood = up(boss) ? "bailiff" : up(rg) ? "ringer" : up(wd) ? "warden" : up(hg) ? "hangman" : up(ab) ? "abbess" : now < (st.fightUntil ?? 0) ? "fight" : rest;
  const calm = !["bailiff", "ringer", "warden", "hangman", "abbess", "fight"].includes(mood);
  if (mood !== st.mood || ctx.music.now()?.ref !== TRACKS[mood]) { st.mood = mood; ctx.music?.play(TRACKS[mood], { fade: calm ? 4 : 1.2, volume: calm ? 0.7 : 0.8 }); }
  if (now > (st.distantAt ?? 0)) {
    st.distantAt = now + 22000 + ctx.random() * 23000;
    const p = live[Math.floor(ctx.random() * live.length)], list = DISTANT[ZONE_MOOD[p.state.area] ?? "road"] ?? DISTANT.road;
    const a = ctx.random() * 6.283, r = 14 + ctx.random() * 12, f = p.feetPosition;
    ctx.emit("playSound", { clip: `/cdn/moodboard-gothic-horror/sfx-${list[Math.floor(ctx.random() * list.length)]}.mp3`, position: { x: f.x + Math.cos(a) * r, y: f.y + 1, z: f.z + Math.sin(a) * r }, volume: 0.55, maxDistance: 40, bus: "Ambience", pitch: 0.92 + ctx.random() * 0.12 });
  }
}
