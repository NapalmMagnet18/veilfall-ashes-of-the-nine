// The Veil: the title, realm and Bearer screens. Its own theme under the menus, and the ravine's wind.
// The soundtrack jukebox is the room's, so the road's music is stopped while nobody walks the road;
// main's sim puts it back the moment someone enters.
// the title's playlist, one score with the road's: cello, choir, bells
const MENU = ["/cdn/moodboard-gothic-horror/music-dark-fantasy-main-menu-theme-solemn-solo-cello-distant-choir-and-music-box-loop.mp3",
  "/cdn/moodboard-gothic-horror/music-dark-fantasy-main-menu-epic-slow-rising-strings-full-choir-and-great-tolling-bell-loop.mp3",
  "/cdn/moodboard-gothic-horror/music-dark-fantasy-main-menu-quiet-lament-solo-violin-harp-and-distant-chanting-monks-loop.mp3",
  "/cdn/moodboard-gothic-horror/music-dark-fantasy-main-menu-ashes-falling-slow-felt-piano-low-cello-and-soft-female-choir-swell-loop.mp3"];
const WIND = "/cdn/moodboard-gothic-horror/ambience-high-mountain-ravine-wind-howling-softly-loop.mp3";
export const cadence = "1s";
export function tick(ctx) {
  if (!ctx.place.players.length) return;
  const onRoad = ctx.world.players.some((p) => p.place === "main" && p.state?.charId && !p.state?.menu);
  const now = ctx.music.now();
  if (!onRoad) {
    const st = ctx.place.state;
    if (!now || !MENU.includes(now.ref)) ctx.music.play(MENU[(st.menuI ?? 0) % MENU.length], { fade: 2.5, volume: 0.75 });
    else { const len = ctx.world.assets?.[now.ref]?.duration ?? 150; if ( now.since >= len - 3) { st.menuI = ((st.menuI ?? 0) + 1) % MENU.length; ctx.music.play(MENU[st.menuI], { fade: 3, volume: 0.75 }); } }
  }
  // the shrine's own breath: candles guttering in wax, and now and then a bell far down the ravine
  if (!("veil-hum" in ctx.place.objects)) ctx.spawn("veil-hum", { tags: ["ambience"], feetPosition: { x: 0, y: 1.2, z: -11 }, audio: { clip: "/cdn/moodboard-gothic-horror/ambience-shrine-candles-guttering-in-wax-faint-whispered-prayer-loop.mp3", loop: true, gain: 0.16, maxDistance: 24, bus: "Ambience" } });
  const s = ctx.place.state;
  if (ctx.now() > (s.bellAt ?? 0)) {
    if (s.bellAt) ctx.emit("playSound", { clip: "/cdn/moodboard-gothic-horror/sfx-huge-cracked-bell-tolling-once-far-across-a-ravine-long-echo.mp3", position: { x: -30 + ctx.random() * 60, y: -20, z: -70 }, volume: 0.45, maxDistance: 400 });
    s.bellAt = ctx.now() + 22000 + ctx.random() * 18000;
  }
  if (!("veil-wind" in ctx.place.objects)) ctx.spawn("veil-wind", { tags: ["ambience"], feetPosition: { x: 0, y: 1, z: 0 }, audio: { clip: WIND, loop: true, gain: 0.14, spatial: false, bus: "Ambience" } });
}
