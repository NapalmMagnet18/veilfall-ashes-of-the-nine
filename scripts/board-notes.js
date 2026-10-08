// The Pilgrims' Board's live notices: one fresh parchment with a red wax seal per open listing in this realm
// (up to 8), pinned over the old weathered ones. Reads the trades table every 8 s while anyone is near;
// a new notice drops in with a little flutter, a sold one simply comes down.
import * as CH from "./lib/character.js";
const SLOTS = [[-0.72, 1.28, 6], [0.7, 1.32, -5], [-0.18, 1.4, 3], [0.32, 1.86, -7], [-0.74, 1.88, 8], [0.02, 0.9, -3], [0.74, 1.76, 4], [-0.3, 0.86, 9]];
const SHOWN = new Map(); // board id → count shown
function ensure(ctx) {
  const id = ctx.self.id;
  SLOTS.forEach(([x, y, rz], i) => {
    if (ctx.getObject(`${id}/note-${i}`)) return;
    ctx.spawn(`note-${i}`, { parent: id, feetPosition: { x, y, z: -0.075 }, rotation: { yaw: 0, pitch: 0, roll: rz }, visible: false, castShadow: false,
      primitive: { kind: "box", width: 0.3, height: 0.38, depth: 0.008 }, material: { color: "oklch(0.88 0.04 85)", roughness: 0.92 },
      children: [{ id: "seal", feetPosition: { x: 0, y: 0.13, z: -0.008 }, primitive: { kind: "cylinder", radiusTop: 0.035, radiusBottom: 0.04, height: 0.012 }, rotation: { yaw: 0, pitch: 90, roll: 0 }, material: { color: "oklch(0.42 0.15 27)", roughness: 0.4 } },
        { id: "ink", feetPosition: { x: 0, y: 0.02, z: -0.006 }, primitive: { kind: "box", width: 0.2, height: 0.16, depth: 0.002 }, material: { texture: "cdn/texture-faded-handwritten-ink-lines-on-parchment.png", color: "oklch(0.75 0.03 70)", roughness: 0.95 } }] });
  });
}
export function onSpawn(ctx) { ensure(ctx); }
export async function update(ctx) {
  ctx.sleep(8);
  const f = ctx.self.feetPosition;
  if (!ctx.place.players.some((p) => Math.hypot(p.feetPosition.x - f.x, p.feetPosition.z - f.z) < 40)) return;
  ensure(ctx);
  let n = 0;
  try {
    const { rows: [r] } = await ctx.sql`SELECT COUNT(*) AS n FROM trades WHERE realm = ${CH.realmOf(ctx).room} AND sold_at IS NULL AND removed = 0`;
    n = Math.min(SLOTS.length, r?.n ?? 0);
  } catch (e) { ctx.log("board notes read failed", String(e)); return; }
  const was = SHOWN.get(ctx.self.id) ?? -1;
  if (n === was) return;
  SHOWN.set(ctx.self.id, n);
  for (let i = 0; i < SLOTS.length; i++) {
    const o = ctx.getObject(`${ctx.self.id}/note-${i}`); if (!o) continue;
    const on = i < n;
    if (o.visible !== on) {
      o.visible = on;
      if (on && was >= 0) ctx.emit("squash", { target: o.id, axis: "y", intensity: 0.3, duration: 0.35 });
    }
  }
  if (n > was && was >= 0) ctx.emit("playSound", { clip: "/cdn/moodboard-gothic-horror/sfx-parchment-pinned-to-wood-board-tack.mp3", position: { x: f.x, y: f.y + 1.4, z: f.z }, volume: 0.6 }, { audience: { nearby: f, radius: 14 } });
}
