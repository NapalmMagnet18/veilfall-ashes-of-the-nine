// Isometric follow: eye high and to the south-east of the hero, eased; wheel zooms 16–36 m.
const YAW = Math.PI / 4, PITCH = 0.92; // ~53° down
let px = null, py = 0, pz = 0;
export function onInput(ctx, input) {
  const s = ctx.self.state, z = input.axes.zoomIn ?? 0;
  if (z) s.dist = Math.max(16, Math.min(36, (s.dist ?? 26) - z * 2.5));
}
export function update(ctx, dt) {
  const t = ctx.self.target; if (!t) return;
  const f = t.feetPosition, k = 1 - Math.exp(-8 * dt);
  if (px === null || Math.hypot(f.x - px, f.z - pz) > 30) { px = f.x; py = f.y; pz = f.z; }
  px += (f.x - px) * k; py += (f.y - py) * k; pz += (f.z - pz) * k;
  const d = ctx.self.state.dist ?? 26, c = Math.cos(PITCH);
  const aim = { x: px, y: py + 1, z: pz };
  ctx.self.feetPosition = { x: aim.x + Math.sin(YAW) * c * d, y: aim.y + Math.sin(PITCH) * d, z: aim.z + Math.cos(YAW) * c * d };
  ctx.self.rotation = { lookAt: aim, include: ["yaw", "pitch"] };
}
