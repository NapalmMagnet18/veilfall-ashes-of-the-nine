// Isometric follow: eye high and to the south-east of the hero, eased; wheel zooms 16–36 m.
// While the Bearer stands at the title or the character screen, the eye drifts in a slow low circle
// around them by the fire instead, and eases back up to the iso view when they step onto the road.
const YAW = Math.PI / 4, PITCH = 0.92; // ~53° down
let px = null, py = 0, pz = 0, blend = 0, orbit = 2.4;
export function onInput(ctx, input) {
  const s = ctx.self.state, z = input.axes.zoomIn ?? 0;
  if (z && !blend) s.dist = Math.max(16, Math.min(36, (s.dist ?? 26) - z * 2.5));
}
const lerp = (a, b, t) => a + (b - a) * t;
export function update(ctx, dt) {
  const t = ctx.self.target; if (!t) return;
  const f = t.feetPosition, k = 1 - Math.exp(-8 * dt);
  if (px === null || Math.hypot(f.x - px, f.z - pz) > 30) { px = f.x; py = f.y; pz = f.z; }
  px += (f.x - px) * k; py += (f.y - py) * k; pz += (f.z - pz) * k;
  const inMenu = !!t.state?.menu;
  blend += ((inMenu ? 1 : 0) - blend) * (1 - Math.exp(-(inMenu ? 6 : 2.2) * dt));
  if (Math.abs(blend - (inMenu ? 1 : 0)) < 0.002) blend = inMenu ? 1 : 0;
  if (inMenu) orbit += dt * 0.06;
  const d = ctx.self.state.dist ?? 26, c = Math.cos(PITCH);
  const isoAim = { x: px, y: py + 1, z: pz };
  const isoEye = { x: isoAim.x + Math.sin(YAW) * c * d, y: isoAim.y + Math.sin(PITCH) * d, z: isoAim.z + Math.cos(YAW) * c * d };
  // the title shot: 8.5 m out, 3.2 m up, looking just past the Bearer's shoulder toward the fire's glow
  const menuAim = { x: px, y: py + 1.5, z: pz };
  const menuEye = { x: px + Math.sin(orbit) * 8.5, y: py + 3.2, z: pz + Math.cos(orbit) * 8.5 };
  const b = blend * blend * (3 - 2 * blend);
  const aim = { x: lerp(isoAim.x, menuAim.x, b), y: lerp(isoAim.y, menuAim.y, b), z: lerp(isoAim.z, menuAim.z, b) };
  ctx.self.feetPosition = { x: lerp(isoEye.x, menuEye.x, b), y: lerp(isoEye.y, menuEye.y, b), z: lerp(isoEye.z, menuEye.z, b) };
  ctx.self.rotation = { lookAt: aim, include: ["yaw", "pitch"] };
}
