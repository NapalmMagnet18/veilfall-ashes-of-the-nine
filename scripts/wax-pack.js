// One manager moves every wax enemy (tag "enemy", not "boss"): roam, hunt, strike, telegraph, melt.
// Players judge their own hits (enemy.state.hp -= d); this reads hp, pays XP/kills to everyone near.
import { animate } from "builtin/tween";
import C from "./lib/data/combat.yml";
import E from "./lib/data/economy.yml";
import { fmt } from "./lib/coins.js";
import { rollDrops, TIER, BAG, dustValue } from "./lib/loot.js";
import { body } from "./lib/data/models.js";
const sfx = (n) => `/cdn/moodboard-gothic-horror/sfx-${n}.mp3`;
// every kind has its own throat: the cry when it wakes to you, the sound it makes coming apart
const VOX = {
  pilgrim: { aggro: "hollow-wax-moan-short", death: "wax-figure-collapsing-hiss-and-sigh" },
  chorister: { aggro: "wax-choirboy-sings-one-broken-high-note-then-shrieks", death: "melting-wax-singer-gargled-hymn-fading-into-hiss" },
  flagellant: { aggro: "penitent-cracks-a-chain-scourge-and-screams-in-ecstasy", death: "chains-clatter-onto-stone-as-wax-body-slumps" },
  chandler: { aggro: "towering-wax-executioner-drags-cleaver-on-stone-and-roars-through-burning-candles", death: "huge-wax-and-bone-body-crashes-down-chains-and-candles-scatter-long-hiss" },
  drowned: { aggro: "drowned-sailor-gurgling-roar-water-spilling-from-lungs", death: "waterlogged-body-collapses-into-shallow-water-splash-and-gurgle" },
  harpooner: { aggro: "ghoul-hiss-and-rope-whip-crack-wet", death: "ghoul-shriek-fading-and-harpoon-clatters-on-wet-stone" },
  barnacle: { aggro: "drowned-knight-groan-inside-corroded-helm-armor-grinding-water-pouring", death: "heavy-corroded-armor-collapses-into-water-big-splash-and-chains" },
  ferryman: { aggro: "towering-ferryman-deep-hollow-voice-and-ship-bell-tolls-underwater", death: "ferryman-collapses-soul-lantern-shatters-many-whispers-escape-into-water" },
  reaper: { aggro: "antlered-creature-bellowing-stag-roar-and-bone-sickle-scrape", death: "wooden-bone-creature-cracks-apart-antlers-clatter-wet-sap" },
  marrowwolf: { aggro: "skinless-wolf-snarl-into-howl-wet-and-raw", death: "wolf-yelp-and-bones-collapse-wet-thud" },
  briarwitch: { aggro: "witch-hissing-incantation-and-thorns-creaking-tight", death: "witch-shriek-thorns-snap-petals-fall-whisper" },
  rootmother: { aggro: "huge-treant-groan-roots-tearing-out-of-earth-heartbeat-thumps", death: "giant-tree-creature-collapses-wood-splinters-heartbeat-stops" },
  gargoyle: { aggro: "stone-gargoyle-grinding-awake-roar-and-chains-rattling", death: "stone-statue-cracks-and-crumbles-chains-fall" },
  harpy: { aggro: "harpy-piercing-shriek-and-wings-beating", death: "harpy-dying-screech-feathers-and-body-thud" },
  inquisitor: { aggro: "armored-zealot-booming-latin-verdict-and-flail-chain-swing", death: "heavy-plate-armor-collapses-flail-clangs-on-stone" },
  butcher: { aggro: "huge-brute-bellow-and-cleaver-scraping-stone-floor", death: "giant-brute-collapses-cleaver-clangs-chains-rattle" },
  ashrevenant: { aggro: "burning-armored-skeleton-hollow-roar-and-sword-drawn-crackling", death: "charred-armor-collapses-into-ash-and-embers-hiss" },
  cinderthrall: { aggro: "burned-ghoul-furnace-roar-and-censers-clanking", death: "burning-corpse-crumbles-to-cinders-with-a-hiss" },
  pyrepriest: { aggro: "cultist-chanting-fire-invocation-flames-whoosh", death: "cultist-scream-fire-snuffed-out-bones-clatter" },
  deepghoul: { aggro: "eyeless-cave-ghoul-wet-shriek-and-claws-scraping-rock", death: "ghoul-gurgles-and-collapses-on-wet-stone" },
  lurker: { aggro: "tall-thin-cave-creature-clicking-hiss-crystals-chiming", death: "brittle-creature-shatters-crystals-tinkle-to-the-floor" },
  crystalbrute: { aggro: "cave-troll-bellow-crystals-grinding-chain-rattle", death: "huge-stone-troll-falls-crystals-crack-and-ring" },
  broodmother: { aggro: "giant-spider-shriek-and-many-legs-skittering-on-stone", death: "giant-spider-death-screech-legs-curl-wet-crunch" },
  frostdead: { aggro: "frozen-corpse-groans-ice-cracking-off-its-robes", death: "frozen-body-shatters-into-ice-shards-on-snow" },
  rimewolf: { aggro: "wolf-snarl-and-howl-in-cold-wind-ice-crunching", death: "wolf-yelp-and-collapse-into-snow" },
  icewraith: { aggro: "ghostly-icy-wail-and-wind-shriek-crystals-chiming", death: "spectre-wail-fades-as-ice-mask-shatters" },
  frostjarl: { aggro: "giant-undead-king-bellows-armor-grinding-ice-cracking", death: "huge-armored-king-falls-ice-breaks-a-war-horn-dies-out" },
  kilnwarden: { aggro: "giant-furnace-golem-roar-bricks-grinding-fire-roaring", death: "huge-brick-and-bone-golem-collapses-furnace-dies-down" },
  cantor: { aggro: "three-voiced-undead-choir-mistress-screams-a-dissonant-chord-bells-clang", death: "choir-mistress-shatters-bells-fall-and-three-voices-fade-into-hiss" },
  deacon: { aggro: "huge-wax-priest-bellows-a-low-sermon-word-and-scrapes-censer", death: "giant-wax-body-topples-heavy-thud-and-long-boiling-hiss" },
};
// idle throats: what each kind murmurs while it waits, heard within EAR metres, one fragment drifting up
const MUTTER = {
  pilgrim: { clip: "wax-pilgrim-whispered-prayer-mumble-wet-and-hollow", lines: ["...light the ninth, light the ninth...", "...forgive the wick...", "...the road remembers...", "...burn slow, burn kind...", "...where did the lanterns go..."] },
  chorister: { clip: "wax-choirboy-humming-broken-hymn-under-breath", lines: ["...la... la... lament...", "...sing it melted...", "...the high note hurts...", "...one more verse, one more..."] },
  flagellant: { clip: "penitent-murmured-litany-and-soft-chain-clink", lines: ["...one stroke for the first flame...", "...I was the one who let it go out...", "...again. again.", "...the wax remembers my sin..."] },
  chandler: { clip: "wax-executioner-slow-breathing-and-dripping-candles-chain-clink", lines: ["...every wick must be trimmed...", "...I make the candles. from you...", "...hold still, little light...", "...the tallow is never wasted..."] },
  drowned: { clip: "drowned-sailor-wet-breathing-water-dripping-creak", lines: ["...the bell rang and no one came...", "...cold... so cold under...", "...all hands, all hands...", "...the lanterns drowned too..."] },
  harpooner: { clip: "ghoul-clicking-teeth-and-wet-rope-creak", lines: ["...something warm on the shore...", "...reel it in... reel it in...", "...fresh catch..."] },
  barnacle: { clip: "corroded-armor-creak-and-water-sloshing-in-helm", lines: ["...I held the causeway...", "...the oath sank with me...", "...none pass the water..."] },
  ferryman: { clip: "deep-slow-oar-strokes-and-distant-drowned-whispers", lines: ["...every crossing has its fare...", "...your coin, or your breath...", "...the mere keeps all it takes...", "...row, and do not look down..."] },
  reaper: { clip: "creaking-wood-and-dripping-sap-slow-breath", lines: ["...the harvest is red this year...", "...cut... gather... cut...", "...the orchard feeds on the hanged..."] },
  marrowwolf: { clip: "wolf-low-growl-and-wet-panting", lines: [] },
  briarwitch: { clip: "witch-whispering-to-thorns-soft-creak", lines: ["...grow, little thorns, grow...", "...your blood would feed my roses...", "...the woods remember every name..."] },
  rootmother: { clip: "slow-heartbeat-inside-wood-and-roots-creaking", lines: ["...my children hang from every bough...", "...stay. take root. sleep...", "...the soil is warm with the fallen..."] },
  gargoyle: { clip: "stone-grinding-and-chain-links-clinking-low", lines: [] },
  harpy: { clip: "feathers-rustling-and-soft-hungry-clicking", lines: ["...pretty pilgrim... come up to the spire...", "...we sang once... now we only scream..."] },
  inquisitor: { clip: "armor-creak-and-chained-censer-swinging", lines: ["...confess, and burn clean...", "...the Nine demand a reckoning...", "...heresy smells of ash..."] },
  butcher: { clip: "heavy-breathing-and-meat-hooks-swinging-on-chains", lines: ["...the abbey must eat...", "...hold still, little lamb...", "...more for the stew..."] },
  ashrevenant: { clip: "smouldering-embers-crackle-and-armor-creak", lines: ["...the pyre was not enough...", "...still burning... still sworn..."] },
  cinderthrall: { clip: "fire-crackle-and-wheezing-burnt-breath", lines: [] },
  pyrepriest: { clip: "low-cult-chant-and-reliquary-fire-crackling", lines: ["...ash to ash, Bearer...", "...the Nine burn, and so shall you...", "...feed the kiln..."] },
  deepghoul: { clip: "wet-breathing-and-dripping-cave-water", lines: [] },
  lurker: { clip: "slow-clicking-and-faint-crystal-chime", lines: [] },
  crystalbrute: { clip: "heavy-breathing-and-crystals-creaking", lines: [] },
  broodmother: { clip: "chittering-and-eggs-pulsing-wetly", lines: ["...the deep is mine... the bones are mine...", "...hush, little ones... food walks in..."] },
  frostdead: { clip: "teeth-chattering-and-ice-creaking", lines: ["...so cold... the prayer froze in me...", "...light a fire... please..."] },
  rimewolf: { clip: "low-growl-and-steaming-breath-in-the-cold", lines: [] },
  icewraith: { clip: "faint-icy-whisper-and-wind-chimes", lines: [] },
  frostjarl: { clip: "heavy-frozen-breathing-and-armor-creaking", lines: ["...the north kneels to no lantern...", "...my hall is ice, and you are its guest forever..."] },
  kilnwarden: { clip: "deep-furnace-roar-and-bricks-shifting", lines: ["...the bones must be fired...", "...nothing leaves the ossuary whole..."] },
  cantor: { clip: "three-whispering-voices-humming-a-funeral-hymn-soft-bells", lines: ["...sing with us, little light...", "...three voices, one grave...", "...the hymn has no last verse...", "...your breath will make a fine note..."] },
  deacon: { clip: "huge-wax-priest-low-droning-sermon-murmur", lines: ["...AND THE NINE WERE GIVEN TO ASH...", "...kneel, little candle...", "...tithe your light...", "...the Veil keeps what it is owed..."] },
};
const EAR = 24, mutterAt = new Map();
function mutter(ctx, w, s, f, now, players) {
  const next = mutterAt.get(w.id);
  if (next === undefined) { mutterAt.set(w.id, now + 3000 + ctx.random() * 9000); return; }
  if (now < next) return;
  mutterAt.set(w.id, now + 9000 + ctx.random() * 9000);
  if (!players.some((p) => flat(p.feetPosition, f) < EAR)) return;
  const M = MUTTER[s.kind] ?? MUTTER.pilgrim, deep = s.kind === "deacon" || s.kind === "chandler" || s.kind === "cantor" || s.kind === "barnacle" || s.kind === "ferryman" || s.kind === "briarwitch" || s.kind === "rootmother" || s.kind === "inquisitor" || s.kind === "butcher" || s.kind === "pyrepriest" || s.kind === "kilnwarden" || s.kind === "crystalbrute" || s.kind === "broodmother" || s.kind === "icewraith" || s.kind === "frostjarl";
  ctx.emit("playSound", { clip: sfx(M.clip), position: f, volume: deep ? 0.55 : 0.38, pitch: 0.85 + ctx.random() * 0.3, maxDistance: EAR });
  ctx.emit("damageNumber", { position: { x: f.x, y: f.y + (deep ? 2.6 : 2.1), z: f.z }, text: M.lines[Math.floor(ctx.random() * M.lines.length)], color: deep ? "#c9a46a" : "#b8ad98", size: deep ? 0.9 : 0.7, lifetime: 2.6 }, { audience: { nearby: f, radius: EAR } });
}
const MELT = `fx
pop wax burst=20..28 on=disc(.35) life=.6..1.1 v=up(1.5..3)+sdir()*(1..2) size=.06..0.12 spin=-6..6 tint=oklch(.93 .04 88)..oklch(.8 .06 75) acc=grav()+drag(.6) col=$tint a=1>.8:1>0 sz=$size rot=$age*$spin floor=stick r=sprite(chip,alpha,velocity,.02)
pop smoke burst=8 on=disc(.3) life=1.2..2 v=up(.6..1.2) size=.3..0.5 acc=buoy(.4)+drag(1) col=<.3,.28,.27> a=0>.3:.4>0 sz=$size*(.6>2.2) r=sprite(smoke-puff,alpha)
pop out burst=1 life=.3 size=.5 col=hdr(3,1.6,.4) a=1>0 sz=$size*(1>.2) r=sprite(soft-disc,add)`;
const SLAM = `fx
pop dust burst=30 on=disc(%r|3) life=.6..1.2 v=up(1..2.5)+sdir()*.8 size=.3..0.6 acc=drag(1.5)+buoy(.3) col=<.55,.5,.45> a=0>.4:.4>0 sz=$size*(.6>1.8) r=sprite(smoke-puff,alpha)
pop wax burst=24 on=disc(.5) life=.5..0.9 v=sdir()*(3..6)+up(2..3) size=.05..0.1 col=oklch(.85 .12 60) acc=grav() a=1>0 floor=stick r=sprite(chip,alpha,velocity,.02)
pop fl burst=1 life=.25 size=%r|3 col=hdr(3,1.2,.3) a=.8>0 sz=$size*(.5>2) r=sprite(soft-disc,add)`;
// coins hop out of the corpse: glinting metal that bounces on the flagstones; count and height scale with the purse
const SPILL = (n, lo, hi) => `fx
pop coin burst=${n} on=disc(.3) life=.8..1.2 v=up(${lo}..${hi})+sdir()*(.6..1.5) size=.07..0.11 spin=-14..14 acc=grav() col=hdr(2.2,1.6,.6) a=1>.8:1>0 sz=$size rot=$age*$spin floor=bounce(.3) r=sprite(chip,add,velocity,.02)
pop glint on=@coin?.5 life=.25..0.4 size=.12..0.2 col=hdr(3,2.2,.9) a=1>0 sz=$size*(1>.2) r=sprite(soft-disc,add)
pop flash burst=1 life=.3 size=.9 col=hdr(2.2,1.6,.6) a=.6>0 sz=$size*(.4>1.6) r=sprite(soft-disc,add)`;
const SPILLS = { small: { fx: SPILL("10..16", 5.4, 7), clip: "/cdn/moodboard-gothic-horror/sfx-coins-spill-small-clink.mp3" },
  heavy: { fx: SPILL("60..80", 6, 9), clip: "/cdn/moodboard-gothic-horror/sfx-gold-coins-pour-heavy.mp3" } };
export const roll = (ctx, [lo, hi]) => lo + Math.floor(ctx.random() * (hi - lo + 1));
const flat = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
const CAMP = { x: 0, z: 0 }, SAFE = 12; // the Wayside Fire: nothing hunts inside its light
const safe = (p) => flat(p, CAMP) < SAFE;

export function telegraph(ctx, x, y, z, r, secs) {
  const ring = { kind: "cylinder", radiusTop: r, radiusBottom: r, height: 0.03 };
  ctx.spawn({ tags: ["telegraph"], feetPosition: { x, y: y + 0.04, z }, primitive: ring, physics: "none", lifetime: secs + 0.15,
    material: { color: "oklch(0.55 0.2 28)", emissive: "oklch(0.6 0.22 30)", emissiveIntensity: 1.2, opacity: 0.28, transparent: true, depthWrite: false } });
  const fill = ctx.spawn({ tags: ["telegraph"], feetPosition: { x, y: y + 0.06, z }, primitive: ring, physics: "none", lifetime: secs + 0.15, scale: { x: 0.05, y: 1, z: 0.05 },
    material: { color: "oklch(0.7 0.2 40)", emissive: "oklch(0.75 0.2 45)", emissiveIntensity: 1.6, opacity: 0.45, transparent: true, depthWrite: false } });
  animate(ctx, ctx.getObject(fill), { "scale.x": 1, "scale.z": 1 }, { duration: secs });
}

export function hurtPlayers(ctx, center, r, dmg, now) {
  for (const p of ctx.place.players) {
    if (p.state.dead || p.state.menu || flat(p.feetPosition, center) > r) continue;
    if ((p.state.iframesUntil ?? 0) > now) { ctx.emit("damageNumber", { position: { ...p.feetPosition, y: p.feetPosition.y + 2 }, text: "EVADED", color: "#9fb6ff" }); ctx.emit("playSound", { clip: sfx("blade-whiffs-past-cloak-close-swish"), position: p.feetPosition, volume: 0.5 }); continue; }
    if ((p.state.guardUntil ?? 0) > now) { p.state.guardUntil = 0; p.state.riposte = now; ctx.emit("damageNumber", { position: { ...p.feetPosition, y: p.feetPosition.y + 2 }, text: "GUARDED", color: "#bfe3ff" }); ctx.emit("playSound", { clip: sfx("heavy-blow-glances-off-spectral-guard-metal-clang-and-glass-ring"), position: p.feetPosition, volume: 0.85 }); continue; }
    p.state.hp -= dmg;
    const at = { x: p.feetPosition.x, y: p.feetPosition.y + 1.2, z: p.feetPosition.z };
    ctx.emit("damageNumber", { position: at, value: dmg, color: "#ff5a4a" });
    ctx.emit("flash", { target: p.id, color: "#ff3020", duration: 0.1 });
    ctx.emit("screenShake", { intensity: 0.25, duration: 0.2 }, { audience: { player: p.id } });
    ctx.emit("playSound", { clip: sfx("flesh-hit-grunt-muffled"), position: at, volume: 0.7 });
    ctx.emit("playSound", { clip: sfx("chainmail-and-leather-armor-struck-dull-thud"), position: at, volume: 0.55, pitch: 0.9 + ctx.random() * 0.2 });
  }
}

// personal loot: each eligible Bearer rolls their own; a find rises as a beam of its tier's colour
const BEAM = `fx
pop beam burst=1 life=2.6 size=.5 col=%c|<1,1,1> a=0>.08:.85>.7:.6>0 sz=$size r=mesh(cylinder,.18,9,.18)
pop motes burst=26 on=disc(.35) life=1.2..2.4 v=up(1.5..3.5) size=.03..0.06 acc=curl(.4)*.3 col=%c|<1,1,1>*2.4 a=1>.6:.8>0 r=sprite(ember,add)
pop glow burst=1 life=2.4 at=point().c(1) r=light(%c|<1,1,1>,12*(1>.7:.8>0),7)`;
const HEX = (h) => { const n = parseInt(h.slice(1), 16); return { x: ((n >> 16) & 255) / 255, y: ((n >> 8) & 255) / 255, z: (n & 255) / 255 }; };
const FIND = { ashen: "loot-drop-cloth-thud-soft", hallowed: "loot-drop-blue-glass-chime", gilded: "loot-drop-gold-bell-chime-bright", relic: "loot-drop-legendary-deep-choir-swell-with-anvil-ring", vowbound: "loot-drop-set-item-emerald-harp-shimmer" };
function dropLoot(ctx, p, at, kind) {
  const found = rollDrops(ctx, kind); if (!found.length) return;
  // each item is its own key in the Bearer's inbox; their own machine moves it into the pack (one writer per array)
  const inbox = p.state.lootIn ?? (p.state.lootIn = {});
  let best = null, n = (p.state.inv?.length ?? 0) + Object.keys(inbox).length;
  for (const it of found) {
    if (n >= BAG) { p.state.dust = (p.state.dust ?? 0) + dustValue(it); ctx.emit("damageNumber", { position: { ...at, y: at.y + 3 }, text: `pack full: +${dustValue(it)} ash dust`, color: "#9a907e", size: 0.7 }, { audience: { player: p.id } }); continue; }
    p.state.lootIn[it.u] = it; n++;
    if (!best || Object.keys(TIER).indexOf(it.t) > Object.keys(TIER).indexOf(best.t)) best = it;
    ctx.emit("damageNumber", { position: { x: at.x + 0.6, y: at.y + 2.8, z: at.z - 0.4 }, text: it.n, color: TIER[it.t].color, size: it.t === "relic" || it.t === "vowbound" ? 1.1 : 0.85, lifetime: 2.6 }, { audience: { player: p.id } });
  }
  if (!best) return;
  const c = HEX(TIER[best.t].color);
  if (best.t !== "ashen") ctx.emit("fx", { position: { x: at.x, y: at.y + 0.05, z: at.z }, script: BEAM, params: { c } }, { audience: { player: p.id } });
  ctx.emit("playSound", { clip: "/cdn/moodboard-gothic-horror/sfx-" + FIND[best.t] + ".mp3", position: at, volume: best.t === "ashen" ? 0.5 : 0.9 }, { audience: { player: p.id } });
  if (best.t === "relic" || best.t === "vowbound") { ctx.emit("screenFlash", { color: TIER[best.t].color, duration: 0.35, intensity: 0.25 }, { audience: { player: p.id } }); ctx.emit("uiEvent", { name: "relic", payload: { n: best.n, t: best.t } }, { audience: { player: p.id } }); }
}

export function payout(ctx, at, xp, copper, countsForQuest, spill = "small", kind = "pilgrim") {
  const S = SPILLS[spill] ?? SPILLS.small;
  let paid = 0; const copperBase = copper;
  for (const p of ctx.place.players) {
    if (p.state.menu || !p.state.charId || flat(p.feetPosition, at) > 28) continue;
    p.state.xp = (p.state.xp ?? 0) + xp;
    copper = Math.round(copperBase * (1 + (p.state.gs?.gold ?? 0) / 100));
    p.state.copper = (p.state.copper ?? 0) + copper;
    dropLoot(ctx, p, at, kind);
    if (countsForQuest) p.state.kills = (p.state.kills ?? 0) + 1;
    if (countsForQuest && ctx.random() < 0.5) p.state.shards = (p.state.shards ?? 0) + 1;
    ctx.emit("damageNumber", { position: { ...at, y: at.y + 2.4 }, text: `+${xp} XP`, color: "#c9b6ff", size: 0.8 }, { audience: { player: p.id } });
    if (copper > 0) {
      ctx.emit("damageNumber", { position: { x: at.x - 0.7, y: at.y + 2.0, z: at.z + 0.7 }, text: `+${fmt(copper)}`, color: "#e6c76a", size: 0.8 }, { audience: { player: p.id } });
      ctx.emit("playSound", { clip: S.clip, position: at, volume: 0.8 }, { audience: { player: p.id } });
    }
    paid++;
  }
  if (paid && copper > 0) ctx.emit("fx", { position: { x: at.x, y: at.y + 0.5, z: at.z }, script: S.fx });
}

// how each kind dies: wax melts (the old way), frost shatters, ash crumbles, everything else falls and lies before the earth takes it
const WAXEN = new Set(["pilgrim", "walker", "deacon", "chorister", "flagellant", "chandler", "cantor", "kilnwarden"]);
const FROSTY = new Set(["frostdead", "rimewolf", "icewraith", "frostjarl"]);
const ASHEN = new Set(["ashrevenant", "cinderthrall", "pyrepriest"]);
const SHATTER = `fx
pop shard burst=26..34 on=sphere(.35) life=.8..1.4 v=sdir()*(2..4.5)+up(2) size=.06..0.16 spin=-9..9 acc=grav() floor=bounce(.25) col=<.75,.9,1>*1.6><.4,.55,.7> a=1>.7:1>0 sz=$size rot=$age*$spin r=sprite(soft-disc,add)
pop frost burst=10..14 on=sphere(.4) life=1.2..2 v=sdir()*.6+up(.4) size=.4..0.8 acc=drag(1.5)+buoy(.2) col=<.8,.92,1> a=0>.1:.35>0 sz=$size*(.6>1.8) rot=spin(.2) r=sprite(smoke-puff,alpha)
pop chill burst=1 life=.6 at=point() r=light(<.55,.8,1>,14*(1>0),6)`;
const CRUMBLE = `fx
pop cinder burst=40..55 on=box(.35,.8,.35) life=1..1.8 v=up(.4..1.2)+sdir()*.5 size=.03..0.07 acc=curl(.6)+buoy(.4)+drag(.8) col=hdr(3,1.2,.3)>hdr(.8,.2,.05)><.1,.08,.07> a=1>.6:1>0 sz=$size r=sprite(ember,add,velocity,.03)
pop ash burst=12..16 on=box(.3,.7,.3) life=1.4..2.4 v=sdir()*.4 size=.3..0.6 acc=grav()*.15+drag(1.2) col=<.22,.2,.19> a=0>.1:.5>0 sz=$size*(.6>1.6) rot=spin(.2) r=sprite(smoke-puff,alpha)
pop glow burst=1 life=.8 at=point() r=light(<1,.45,.15>,10*(1>0),5)`;
const GORE = `fx
pop spray burst=18..26 on=sphere(.2) life=.4..0.8 v=sdir()*(1.5..3.2)+up(1.2) size=.04..0.08 acc=grav() floor=stick col=<.25,.03,.03> a=1 sz=$size r=sprite(soft-disc,alpha)
pop dust burst=6..9 on=disc(.5) life=.8..1.3 v=up(.3..0.7)+sdir()*.4 size=.4..0.7 acc=drag(1.4)+buoy(.2) col=<.32,.28,.24> a=0>.1:.35>0 sz=$size*(.6>1.7) rot=spin(.2) r=sprite(smoke-puff,alpha)`;
const UNRIG = new Set(["rimewolf", "harpy", "rootmother", "broodmother"]); // models.js bodies cooked without a rig
export function update(ctx, dt) {
  const now = ctx.now(), ears = ctx.place.players.filter((p) => !p.state.menu), players = ears.filter((p) => !p.state.dead && !safe(p.feetPosition));
  for (const row of ctx.query({ tags: ["enemy"], excludeTags: ["boss"] })) {
    const w = ctx.getObject(row.id); if (!w) continue;
    const s = w.state, K = C[s.kind] ?? C.pilgrim, f = w.feetPosition;
    // bodies with no skeleton have no clips to play: they breathe as one mass and coil before a blow
    if (UNRIG.has(s.kind) && !s.dead && !s.breathing) { s.breathing = true; const sc = w.scale, b = typeof sc === "number" ? sc : (sc?.y ?? 1), bx = typeof sc === "number" ? sc : (sc?.x ?? 1), bz = typeof sc === "number" ? sc : (sc?.z ?? 1);
      animate(ctx, w, { "scale.y": [b, b * 1.04, b], "scale.x": [bx, bx * 0.985, bx], "scale.z": [bz, bz * 0.985, bz] }, { duration: 1.6 + ctx.random() * 0.6, loop: true, easing: "easeInOutSine" }); }
    if (s.dead) { w.velocity = { x: 0, y: w.velocity.y, z: 0 }; mutterAt.delete(w.id); if (now - s.deadAt > (s.corpse ? 7000 : 2300)) ctx.destroy(w.id); continue; }
    if (s.animOff && now > s.animOff) { w.anim.attack = null; s.animOff = 0; }
    if (s.hitUntil && now > s.hitUntil) { w.anim.hit = null; s.hitUntil = 0; }
    if (s.hp <= 0) {
      s.dead = true; s.deadAt = now; w.physics = "none";
      ctx.emit("fx", { position: { x: f.x, y: f.y + 0.4, z: f.z }, script: MELT });
      ctx.emit("playSound", { clip: sfx((VOX[s.kind] ?? VOX.pilgrim).death), position: f, volume: (s.kind === "deacon" || s.kind === "chandler" || s.kind === "cantor" || s.kind === "barnacle" || s.kind === "ferryman" || s.kind === "briarwitch" || s.kind === "rootmother") ? 1 : 0.8, pitch: 0.9 + ctx.random() * 0.2 });
      w.anim.attack = null; w.anim.death = { clip: "cdn/clip-die.glb", weight: 20, loop: "once" }; // it falls first, then the wax gives way
      const sc = w.scale, b = typeof sc === "number" ? sc : (sc?.y ?? 1);
      if (WAXEN.has(s.kind)) animate(ctx, w, { "scale.y": 0.08, "scale.x": 1.5, "scale.z": 1.5 }, { duration: 1.1, delay: 0.9 });
      else if (FROSTY.has(s.kind)) { ctx.emit("fx", { position: { x: f.x, y: f.y + 0.9, z: f.z }, script: SHATTER, params: {} }); ctx.emit("playSound", { clip: sfx("ice-body-shatters-into-shards"), position: f, volume: 0.7 }); animate(ctx, w, { scale: b * 0.02 }, { duration: 0.35, delay: 0.45, easing: "easeInQuad" }); }
      else if (ASHEN.has(s.kind)) { ctx.emit("fx", { position: { x: f.x, y: f.y + 0.2, z: f.z }, script: CRUMBLE }); animate(ctx, w, { "scale.y": b * 0.05 }, { duration: 1.4, delay: 0.7, easing: "easeInCubic" }); }
      else { s.corpse = true; ctx.emit("fx", { position: { x: f.x, y: f.y + 0.9, z: f.z }, script: GORE });
        if (UNRIG.has(s.kind)) animate(ctx, w, { "scale.y": b * 0.4 }, { duration: 0.5, easing: "easeOutBounce" }); // no skeleton: it slumps
        animate(ctx, w, { "feetPosition.y": f.y - 1.6 }, { duration: 1.8, delay: 5, easing: "easeInQuad" }); } // lies a while, then the earth takes it
      payout(ctx, f, K.xp, roll(ctx, E.drops[s.kind] ?? E.drops.pilgrim), true, "small", s.kind);
      continue;
    }
    // the Chandler's second breath: at half hp he tears three wax pilgrims up out of the flagstones, once a life
    if (K.summon && !s.summoned && s.hp < s.maxHp * 0.5) {
      s.summoned = true;
      ctx.emit("playSound", { clip: sfx(K.summonSfx ?? "towering-wax-executioner-roars-and-the-ground-cracks-as-wax-bodies-rise"), position: f, volume: 1 });
      ctx.emit("shockwave", { position: { x: f.x, y: f.y + 0.2, z: f.z }, speed: 9, thickness: 0.6, intensity: 0.6 });
      ctx.emit("damageNumber", { position: { x: f.x, y: f.y + 3.4, z: f.z }, text: K.summonText ?? "RISE, LITTLE CANDLES", color: "#f2b04a", size: 1.2, lifetime: 2.6 });
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * 6.283 + ctx.random(), at = { x: f.x + Math.cos(a) * 2.6, y: f.y, z: f.z + Math.sin(a) * 2.6 };
        ctx.emit("fx", { position: { x: at.x, y: at.y + 0.3, z: at.z }, script: MELT });
        ctx.spawn({ id: w.id + "-add" + i, tags: ["enemy", K.summon], physics: "character", feetPosition: { x: at.x, z: at.z, y: { terrain: 0 } }, ...body(K.summon), behavior: ["scripts/humanoid-locomotion.js"],
          state: { kind: K.summon, hp: C[K.summon].hp, maxHp: C[K.summon].hp, home: s.home ?? { x: f.x, y: f.y, z: f.z }, hunting: false } });
      }
    }
    // who to hunt
    let prey = null, best = s.hunting ? K.aggro * 1.8 : K.aggro;
    for (const p of players) { const d = flat(p.feetPosition, f); if (d < best) { best = d; prey = p; } }
    if (s.lastHit && !prey) { const p = players.find((q) => q.id === s.lastHit); if (p && flat(p.feetPosition, f) < 30) { prey = p; best = flat(p.feetPosition, f); } }
    if (s.home && flat(f, s.home) > 22) { prey = null; s.lastHit = null; }
    if (!!prey !== !!s.hunting) { s.hunting = !!prey; if (prey) ctx.emit("playSound", { clip: sfx((VOX[s.kind] ?? VOX.pilgrim).aggro), position: f, volume: s.kind === "pilgrim" ? 0.5 : 0.7, mode: "restart", pitch: 0.8 + ctx.random() * 0.4 }); }
    if (!s.hunting) mutter(ctx, w, s, f, now, ears);
    let vx = 0, vz = 0;
    // a slam in its windup holds the body still, then lands
    if (s.swing) {
      // the blow lands at the end of the swing; a Bearer who stepped out of reach is missed
      if (now >= s.swing.at) {
        const tgt = players.find((q) => q.id === s.swing.who);
        if (tgt && flat(tgt.feetPosition, f) < (K.reach ?? 1.6) + 0.7) hurtPlayers(ctx, tgt.feetPosition, 0.9, K.swingDmg ?? K.dmg, now);
        else ctx.emit("playSound", { clip: sfx("blade-whiffs-past-cloak-close-swish"), position: f, volume: 0.4, pitch: 0.8 });
        s.swing = null;
      }
    } else if (s.slam) {
      if (now >= s.slam.at) {
        ctx.emit("fx", { position: { x: s.slam.x, y: f.y + 0.1, z: s.slam.z }, script: SLAM, params: { r: K.slamRadius } });
        ctx.emit("playSound", { clip: sfx("heavy-censer-slam-stone-crack"), position: f, volume: 1 });
        hurtPlayers(ctx, s.slam, K.slamRadius, K.dmg, now);
        s.slam = null; s.nextAtk = now + K.every * 1000;
      }
    } else if (prey) {
      const dx = prey.feetPosition.x - f.x, dz = prey.feetPosition.z - f.z, d = Math.hypot(dx, dz) || 1;
      const yaw = (Math.atan2(-dx, -dz) * 180) / Math.PI;
      if (Math.abs(((yaw - (s.yawW ?? 0) + 540) % 360) - 180) > 8) { s.yawW = yaw; w.rotation = yaw; }
      if (K.slamRadius && d < 6 && d > (K.swings ? (K.reach ?? 1.6) + 0.4 : -1) && now >= (s.nextAtk ?? 0)) {
        s.slam = { x: prey.feetPosition.x, y: prey.feetPosition.y, z: prey.feetPosition.z, at: now + K.windup * 1000 };
        telegraph(ctx, s.slam.x, s.slam.y, s.slam.z, K.slamRadius, K.windup);
        w.anim.attack = { clip: "cdn/clip-cast.glb", weight: 10, loop: "once", speed: 1.4 / Math.max(0.6, K.windup) }; s.animOff = now + K.windup * 1000 + 500;
        if (UNRIG.has(s.kind)) { ctx.emit("squash", { target: w.id, axis: "y", intensity: 0.3, duration: K.windup }); ctx.emit("shake", { target: w.id, intensity: 0.08, duration: K.windup }); }
        ctx.emit("playSound", { clip: sfx("chain-rattle-windup-hiss"), position: f, volume: 0.8 });
      } else if (d > (K.reach ?? 1.6)) { vx = (dx / d) * K.speed; vz = (dz / d) * K.speed; }
      else if (K.swings ? now >= (s.nextSwing ?? 0) : (!K.slamRadius && now >= (s.nextAtk ?? 0))) {
        if (K.swings) s.nextSwing = now + K.swingEvery * 1000; else s.nextAtk = now + K.every * 1000;
        // a readable wind-up: the arm draws back, then the blow falls
        s.swing = { at: now + 420, who: prey.id };
        w.anim.attack = { clip: "cdn/clip-attack.glb", weight: 10, loop: "once", speed: 1.1 }; s.animOff = now + 1000;
        if (UNRIG.has(s.kind)) { ctx.emit("squash", { target: w.id, axis: "y", intensity: 0.22, duration: 0.42 }); ctx.emit("shake", { target: w.id, intensity: 0.05, duration: 0.35 }); }
        ctx.emit("playSound", { clip: sfx("wax-limb-drawn-back-creak-and-hiss"), position: f, volume: 0.45, pitch: 0.85 + ctx.random() * 0.3 });
      }
    } else if (s.home) {
      if (!s.roam || now > s.roamUntil) { const a = ctx.random() * 6.283; s.roam = { x: s.home.x + Math.cos(a) * 4, z: s.home.z + Math.sin(a) * 4 }; s.roamUntil = now + 4000 + ctx.random() * 4000; }
      const d = flat(s.roam, f);
      if (d > 0.6) { vx = ((s.roam.x - f.x) / d) * 0.7; vz = ((s.roam.z - f.z) / d) * 0.7; const yaw = (Math.atan2(-vx, -vz) * 180) / Math.PI; if (Math.abs(((yaw - (s.yawW ?? 0) + 540) % 360) - 180) > 8) { s.yawW = yaw; w.rotation = yaw; } }
    }
    if (flat(f, CAMP) < SAFE + 1 && (vx || vz)) { const ox = f.x - CAMP.x, oz = f.z - CAMP.z, ol = Math.hypot(ox, oz) || 1; if ((vx * ox + vz * oz) < 0) { vx = (ox / ol) * 1.5; vz = (oz / ol) * 1.5; } }
    w.velocity = { x: vx, y: w.velocity.y, z: vz };
  }
}
