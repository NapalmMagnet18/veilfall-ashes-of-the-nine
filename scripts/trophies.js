// The Trophy Post: a relic hangs from its hook once that boss has fallen in this room
// (world.state.trophies[boss], written by each boss script on its death). New ones ring in.
const KINDS = ["bailiff", "ringer", "warden", "hangman"];
const shown = {}; // this machine's draw cache; which relics have rung lives in self.state.rung, shared
export function update(ctx) {
  const t = ctx.world.state.trophies ?? {}, id = ctx.self.id, f = ctx.self.feetPosition;
  for (const k of KINDS) {
    const on = !!t[k]; if (shown[k] === on) continue; shown[k] = on;
    const r = ctx.place.objects[`${id}/${k}`]; if (r) r.visible = on;
    const rung = ctx.self.state.rung ?? {};
    if (on && r && !rung[k]) {
      ctx.self.state.rung = { ...rung, [k]: true };
      if (ctx.now() - (t[k].at ?? 0) > 120000) continue; // an old fall: hang it quietly
      ctx.emit("playSound", { clip: "/cdn/moodboard-gothic-horror/sfx-iron-chain-rattle-and-heavy-hook-clank.mp3", position: f, volume: 0.9, maxDistance: 30 });
      ctx.emit("flash", { target: r.id, color: "#ffcf8a", duration: 0.8 });
      ctx.emit("shake", { target: r.id, intensity: 0.4, duration: 1.2 });
    }
  }
  const NAMES = { bailiff: "The Bailiff", ringer: "The Ringer", warden: "The Lantern Warden", hangman: "The Hangman" };
  const pl = ctx.place.objects[`${id}/plaque`];
  if (pl) for (const k of KINDS) { const r = t[k], line = r ? `${NAMES[k]} · ${(r.by?.length ? r.by.join(" & ") : "unknown hands")}` : `${NAMES[k]} · still walks`; if (pl.state[k] !== line) pl.state[k] = line; }
  if (ctx.self.state.rung) for (const k of KINDS) if (!t[k] && ctx.self.state.rung[k]) { const { [k]: _, ...rest } = ctx.self.state.rung; ctx.self.state.rung = rest; }
  ctx.sleep(3);
}
