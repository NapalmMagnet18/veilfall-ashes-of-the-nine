// The HUD (world.config.yaml ui.render): render(ctx, player) → HTML, drawn for every player: ctx the read-only world,
// player the viewer's own body (player.state the dots it writes). Renders nothing yet. The type is already the game's: the
// engine's pixel face, Jersey 10 (engine.ui.theme.font names a bundled Geist Pixel face): a font-family
// here replaces it. The palette is the world's. The right-middle rail is Spawn's; every corner is yours.
// The game-ui skill carries finished screens to start from.
export default function render(ctx, player) {
  return ''
}
