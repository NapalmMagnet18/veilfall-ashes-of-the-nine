// The Veil: the title, realm and Bearer screens. Its own theme under the menus, and the ravine's wind.
// The soundtrack jukebox is the room's, so the road's music is stopped while nobody walks the road;
// main's sim puts it back the moment someone enters.
const THEME = "/cdn/moodboard-gothic-horror/music-dark-fantasy-main-menu-theme-solemn-solo-cello-distant-choir-and-music-box-loop.mp3";
const WIND = "/cdn/moodboard-gothic-horror/ambience-high-mountain-ravine-wind-howling-softly-loop.mp3";
export const cadence = "1s";
export function tick(ctx) {
  if (!ctx.place.players.length) return;
  const onRoad = ctx.world.players.some((p) => p.place === "main" && p.state?.charId && !p.state?.menu);
  const now = ctx.music.now();
  if (!onRoad && now && now.ref !== THEME) ctx.music.play(THEME, { fade: 2.5, volume: 0.75 });
  else if (!onRoad && !now) ctx.music.play(THEME, { fade: 2.5, volume: 0.75 });
  if (!("veil-wind" in ctx.place.objects)) ctx.spawn("veil-wind", { tags: ["ambience"], feetPosition: { x: 0, y: 1, z: 0 }, audio: { clip: WIND, loop: true, gain: 0.14, spatial: false, bus: "Ambience" } });
}
