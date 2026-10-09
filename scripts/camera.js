// Isometric follow: eye high and to the south-east of the hero, eased; wheel zooms 16–36 m.
// At the title / realm / character screens (target.state.menu) the eye holds the Veil's painted shot
// (scripts/lib/data/menu-shot.yml) with a slow sway; stepping into the world cranes down from high over the
// Bearer's head, swinging round into the iso view over ~2.6 s.
import SHOT from "./lib/data/menu-shot.yml";
const YAW = Math.PI / 4, PITCH = 0.92; // ~53° down
const lerp = (a, b, t) => a + (b - a) * t;
const ease = (t) => 1 - Math.pow(1 - t, 3);
let px = null, py = 0, pz = 0, t0 = 0;
const cineOn = (t) => { const ps = t?.state; return !!(ps && (ps.possessedNodeId || ps.cinemaPlaying || ps.cinemaPlayback?.playing)); };
export function onInput(ctx, input) {
  if (cineOn(ctx.self.target)) return; // Absolute Cinema has the wheel
  const s = ctx.self.state, z = input.axes.zoomIn ?? 0;
  if (z && !ctx.self.target?.state?.menu) s.dist = Math.max(16, Math.min(36, (s.dist ?? 26) - z * 2.5));
}
export function update(ctx, dt) {
  const t = ctx.self.target; if (!t) return;
  if (cineOn(t)) { ctx.self.state._cine = true; return; } // a shot is playing: yield
  if (ctx.self.state._cine) { ctx.self.state._cine = false; px = null; } // shot over: re-seed onto the Bearer
  t0 += dt;
  if (t.state?.menu) {
    const sw = Math.sin(t0 * 0.07 * Math.PI * 2 / 1.5), dr = SHOT.drift ?? { x: 0, y: 0, z: 0 };
    ctx.self.feetPosition = { x: SHOT.eye.x + dr.x * sw, y: SHOT.eye.y + dr.y * sw, z: SHOT.eye.z + dr.z * sw };
    ctx.self.rotation = { lookAt: SHOT.aim, include: ["yaw", "pitch"] };
    px = null;
    return;
  }
  const f = t.feetPosition, k = 1 - Math.exp(-8 * dt);
  if (px === null || Math.hypot(f.x - px, f.z - pz) > 30) { px = f.x; py = f.y; pz = f.z; }
  px += (f.x - px) * k; py += (f.y - py) * k; pz += (f.z - pz) * k;
  // the arrival crane: from 70 m up and a quarter-turn round, down into the iso view
  const since = (ctx.now() - (t.state?.enteredAt ?? 0)) / 2600, e = since >= 0 && since < 1 ? ease(since) : 1;
  const d = lerp(70, ctx.self.state.dist ?? 26, e), yaw = YAW + (1 - e) * 1.2, pitch = lerp(1.35, PITCH, e), c = Math.cos(pitch);
  const aim = { x: px, y: py + 1, z: pz };
  ctx.self.feetPosition = { x: aim.x + Math.sin(yaw) * c * d, y: aim.y + Math.sin(pitch) * d, z: aim.z + Math.cos(yaw) * c * d };
  ctx.self.rotation = { lookAt: aim, include: ["yaw", "pitch"] };
}
