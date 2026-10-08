// The world's doorway (world.config.yaml engine.behaviors): onArrive fires for every way a player
// lands here (first join, rejoin, a portal in), and onLeave for every way they go.
// A Bearer in the world is saved to the characters table as they leave (the body also saves on its own every 20 s).
import { save } from "./lib/character.js";
export function onArrive(ctx, player) {}

export async function onLeave(ctx, player) {
  const s = player.state;
  if (s?.charId && !s.menu && player.place === "main") await save(ctx, s.charId, s, player.feetPosition);
}
