// The phone's thumbs: no stick or skill chips while the Bearer screens stand (no hero yet),
// and none while the pack or the peddler's cart is open; the full fight layout once you walk the road.
// Keyed on charId (set once when a Bearer enters, cleared on rest) so a passing state read can't flip it.
export default (ctx) => {
  const s = ctx.player?.state;
  if (!s || !s.charId || s.menu) return "menu";
  return s.shop || s.bagOpen ? "menu" : "default";
};
