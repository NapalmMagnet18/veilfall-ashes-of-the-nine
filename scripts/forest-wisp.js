// a wild wisp: drifts a slow lissajous loop around its home a metre or two off the ground,
// and when a Bearer comes close it slips away and bobs higher, then drifts back once they pass.
// state: { home: {x,y,z}, r, seed }
const SHY = 4.5;
export function update(ctx, dt) {
  const me = ctx.self, s = me.state, h = s.home; if (!h) return ctx.sleep(5);
  const t = ctx.now() / 1000 + (s.seed ?? 0) * 7.3, r = s.r ?? 5;
  let x = h.x + Math.sin(t * 0.21) * r + Math.sin(t * 0.53) * r * 0.3;
  let z = h.z + Math.sin(t * 0.17 + 1.3) * r * 0.8 + Math.cos(t * 0.47) * r * 0.25;
  let y = h.y + 0.6 * Math.sin(t * 0.9) + 0.25 * Math.sin(t * 2.3);
  for (const p of ctx.place.players) {
    const dx = x - p.feetPosition.x, dz = z - p.feetPosition.z, d = Math.hypot(dx, dz);
    if (d < SHY) { const k = (SHY - d) / SHY; x += (dx / (d || 1)) * k * 3; z += (dz / (d || 1)) * k * 3; y += k * 1.4; }
  }
  const f = me.feetPosition, a = Math.min(1, dt * 2.5); // eased, so the shy dart reads as a flinch, not a teleport
  me.feetPosition = { x: f.x + (x - f.x) * a, y: f.y + (y - f.y) * a, z: f.z + (z - f.z) * a };
  const near = ctx.place.players.some((p) => Math.hypot(p.feetPosition.x - f.x, p.feetPosition.z - f.z) < SHY);
  if (near !== !!s.startled) { s.startled = near; me.wisp = { ...me.wisp, burnStyle: near ? "crackle" : "calm" }; }
}
