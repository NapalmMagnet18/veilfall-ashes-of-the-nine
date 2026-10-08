// The phone's thumbs: no stick or skill chips while the Bearer screens stand (no hero yet),
// and none while the pack or the peddler's cart is open; the full fight layout once you walk the road.
export default (ctx) => {
  const s = ctx.player?.state ?? {};
  return s.menu || s.shop || s.bagOpen ? "menu" : "default";
};
