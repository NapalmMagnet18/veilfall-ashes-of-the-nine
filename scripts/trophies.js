// The Trophy Post: a relic hangs from its hook once that boss has fallen in this room
// (world.state.trophies[boss], written by each boss script on its death). New ones ring in.
const KINDS = ["bailiff", "ringer", "warden", "hangman"];
const shown = {}; let synced = false;
export function update(ctx) {
  const t = ctx.world.state.trophies ?? {}, id = ctx.self.id, f = ctx.self.feetPosition;
  for (const k of KINDS) {
    const on = !!t[k]; if (shown[k] === on) continue; shown[k] = on;
    const r = ctx.place.objects[`${id}/${k}`]; if (r) r.visible = on;
    if (on && synced && r) {
      ctx.emit("playSound", { clip: "/cdn/moodboard-gothic-horror/sfx-iron-chain-rattle-and-heavy-hook-clank.mp3", position: f, volume: 0.9, maxDistance: 30 });
      ctx.emit("flash", { target: r.id, color: "#ffcf8a", duration: 0.8 });
      ctx.emit("shake", { target: r.id, intensity: 0.4, duration: 1.2 });
    }
  }
  synced = true; ctx.sleep(3);
}
