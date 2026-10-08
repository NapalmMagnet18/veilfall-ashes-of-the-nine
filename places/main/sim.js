// Broken Lantern Road's referee: stands the camp's people and the road's enemies, respawns cleared
// packs out of sight, walks each player's quest forward, levels them, and brings the Bailiff back.
import C from "../../scripts/lib/data/combat.yml";
export const cadence = "250ms";
const MUSIC = "/cdn/moodboard-gothic-horror/music-broken-lantern-road-dusk-candles-and-fog-ambient.mp3";
const PACKS = [
  { id: "p1", kind: "pilgrim", x: -1, z: -21 }, { id: "p2", kind: "pilgrim", x: 3, z: -23 },
  { id: "p3", kind: "pilgrim", x: 0, z: -29 }, { id: "p4", kind: "pilgrim", x: 3, z: -31 }, { id: "p5", kind: "pilgrim", x: -2, z: -33 },
  { id: "p6", kind: "pilgrim", x: 5, z: -44 }, { id: "p7", kind: "pilgrim", x: 10, z: -49 }, { id: "d1", kind: "deacon", x: 8, z: -46 },
  { id: "p8", kind: "pilgrim", x: -3, z: -65 }, { id: "p9", kind: "pilgrim", x: 0, z: -69 }, { id: "p10", kind: "pilgrim", x: -5, z: -71 }, { id: "d2", kind: "deacon", x: -2, z: -68 },
];
const PETITIONS = [[4, -40], [13, -42], [11, -52], [3, -50], [17, -53]];
const MAELIN = { x: -5, z: -3 };
const LINES = {
  0: "Maelin Sore: Another one who walked out of the fog. Sit, warm your hands. The road north was erased from every map I own, but the pilgrims still walk it, wax and all.",
  1: "Maelin Sore: They were people once. Now they shuffle toward the Abbey and tear at anything warm. Silence eight of them past the third milepost, and I'll trust the road again.",
  2: "Maelin Sore: The tollhouse kept petitions, the names of everyone who paid to pass. Bring me five. Wax-sealed. Someone wanted them forgotten.",
  3: "Maelin Sore: These names were taxed twice, once in coin and once in memory. The Bailiff still collects behind the Dripping Gate. Break him, and the road is ours.",
  4: "Maelin Sore: You rang his bell for the last time. Take this blade, it was my brother's oath. It cut true once. It will again.",
  5: "Maelin Sore: The Abbey road is open now. I'll redraw the map by firelight. Come back when you've seen what waits under the ash.",
};
const AUTO = { 2: "The road falls quiet. The tollhouse lies ahead: find five wax-sealed petitions in its court.", 3: "Five petitions, five erased names. Beyond the Dripping Gate, the Bailiff is still collecting.", 4: "The bell is cracked. Return to Maelin at the Wayside Fire." };
const enemySpec = (pk) => ({
  id: "en-" + pk.id, tags: ["enemy", pk.kind], physics: "character",
  feetPosition: { x: pk.x, z: pk.z, y: { terrain: 0 } },
  scale: pk.kind === "deacon" ? 1.35 : 1,
  primitive: { kind: "scripted", script: "scripts/gen/wax-figure.js", params: { kind: pk.kind }, seed: pk.id.length * 7 + pk.x },
  fx: { script: `fx\npop f rate=flick(.5,.3)*18 on=point() life=.25..0.45 v=up(.5..0.9) size=.05..0.09 col=hdr(4,2.4,.7)>hdr(1.5,.4,.08) a=0>.2:1>0 r=sprite(flame-wisp,add)\npop l n=1 glo=fire()*.8 r=light(<1,.6,.3>,$glo*1.5,5)`, params: {} },
  state: { kind: pk.kind, hp: C[pk.kind].hp, maxHp: C[pk.kind].hp, home: { x: pk.x, y: 0, z: pk.z } },
});
const near = (ctx, x, z, r) => ctx.place.players.some((p) => Math.hypot(p.feetPosition.x - x, p.feetPosition.z - z) < r);

function say(ctx, p, stage) { p.state.dialog = { text: LINES[stage], at: ctx.now() }; }

export function tick(ctx) {
  const st = ctx.place.state, now = ctx.now(), objs = ctx.place.objects;
  if (!st.music) { st.music = true; ctx.music?.play(MUSIC, { fade: 3 }); }
  if (!("wax-pack" in objs)) ctx.spawn("wax-pack", { tags: ["system"], feetPosition: { x: 0, y: -50, z: 0 }, behavior: "scripts/wax-pack.js" });
  if (!("maelin" in objs)) ctx.spawn("maelin", { tags: ["npc"], physics: "character", feetPosition: { x: MAELIN.x, z: MAELIN.z, y: { terrain: 0 } }, rotation: 120,
    model: "cdn/model-weathered-woman-mapmaker-hooded-cloak-satchel-of-maps.glb", behavior: ["scripts/humanoid-locomotion.js"], state: { name: "Maelin Sore" } });
  PETITIONS.forEach(([x, z], i) => {
    const id = "petition-" + (i + 1);
    if (!(id in objs)) ctx.spawn(id, { tags: ["petition"], feetPosition: { x, z, y: { terrain: 0.25 } }, rotation: { yaw: i * 70, roll: 90 },
      primitive: { kind: "cylinder", radiusTop: 0.07, radiusBottom: 0.07, height: 0.42 }, material: { color: "oklch(0.88 0.04 85)", roughness: 0.8 },
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
      primitive: { kind: "scripted", script: "scripts/gen/wax-figure.js", params: { kind: "bailiff" }, seed: 9 }, behavior: "scripts/bailiff.js",
      fx: { script: `fx\npop f rate=flick(.6,.3)*40 on=disc(.35).c(3.9) life=.25..0.5 v=up(.6..1.1) size=.06..0.12 col=hdr(4,2.4,.7)>hdr(1.5,.4,.08) a=0>.2:1>0 r=sprite(flame-wisp,add)\npop l n=1 at=point().c(4) glo=fire() r=light(<1,.55,.25>,$glo*4,10)` } });
  }
  // each player's road
  for (const p of ctx.place.players) {
    const s = p.state; if (s.hp === undefined) continue;
    const q = s.quest ?? { stage: 0 };
    let next = null;
    const talked = s.talk && s.talk.id === "maelin" && s.talk.at !== q.heardAt;
    if (talked) {
      if (q.stage === 0) next = { stage: 1, killsAt: s.kills ?? 0 };
      else if (q.stage === 4) {
        if (!s.claimed?.["Z01-MAIN-05"]) {
          s.claimed = { ...(s.claimed ?? {}), "Z01-MAIN-05": now };
          s.xp = (s.xp ?? 0) + 300; s.gold = (s.gold ?? 0) + 120; s.weapon = "ITEM-001";
          ctx.emit("playSound", { clip: "/cdn/moodboard-gothic-horror/sfx-quest-complete-low-bells-and-choir.mp3", position: p.feetPosition, volume: 1 }, { audience: { player: p.id } });
          ctx.emit("screenFlash", { color: "#ffe2a8", duration: 0.35, intensity: 0.1 }, { audience: { player: p.id } });
          ctx.emit("milestone", { step: 4, name: "z01-complete" }, { audience: { player: p.id } });
        }
        next = { stage: 5 };
      }
      say(ctx, p, next ? next.stage : q.stage);
      if (!next) s.quest = { ...q, heardAt: s.talk.at };
    }
    if (q.stage === 1 && (s.kills ?? 0) - (q.killsAt ?? 0) >= 8) next = { stage: 2 };
    if (q.stage === 2 && (s.petitions?.length ?? 0) >= 5) next = { stage: 3 };
    if (q.stage === 3 && s.bossKilled) next = { stage: 4 };
    if (q.stage < 3 && s.bossKilled) s.bossKilled = false; // only counts once the hunt is yours
    if (next) {
      s.quest = { ...q, ...next, heardAt: talked ? s.talk.at : q.heardAt };
      if (!talked) s.dialog = { text: AUTO[next.stage], at: now };
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
