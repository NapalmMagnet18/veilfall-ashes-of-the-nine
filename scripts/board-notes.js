// The Pilgrims' Board's live notices: one fresh parchment with a red wax seal per open listing in this realm
// (up to 8), pinned over the old weathered ones. The table is asked every 8 s while anyone is within 40 m;
// each update pins what is missing and takes down what sold, so the board always matches the table.
import * as CH from "./lib/character.js";
import { openCount } from "./lib/trade.js";
const SLOTS = [[-0.72, 1.28, 6], [0.7, 1.32, -5], [-0.18, 1.4, 3], [0.32, 1.86, -7], [-0.74, 1.88, 8], [0.02, 0.9, -3], [0.74, 1.76, 4], [-0.3, 0.86, 9]];
const WANT = new Map(), ASKED = new Map(); // board id → open listings in the table; when it was last asked
const note = (x, y, rz) => ({ feetPosition: { x, y, z: -0.075 }, rotation: { yaw: 0, pitch: 0, roll: rz }, castShadow: false, tags: ["board-note"],
  primitive: { kind: "box", width: 0.3, height: 0.38, depth: 0.008 }, material: { color: "oklch(0.88 0.04 85)", roughness: 0.92 },
  children: [{ id: "seal", feetPosition: { x: 0, y: 0.3, z: -0.008 }, primitive: { kind: "cylinder", radiusTop: 0.035, radiusBottom: 0.04, height: 0.012 }, rotation: { yaw: 0, pitch: 90, roll: 0 }, material: { color: "oklch(0.42 0.15 27)", roughness: 0.4 } },
    ...[0.17, 0.12, 0.07, 0.02, -0.04].map((y, k) => ({ id: `line-${k}`, feetPosition: { x: k === 4 ? -0.04 : 0, y: y + 0.1, z: -0.005 }, primitive: { kind: "box", width: k === 4 ? 0.12 : 0.2 - (k % 2) * 0.03, height: 0.012, depth: 0.002 }, material: { color: "oklch(0.25 0.02 40)", roughness: 1 } }))] });
export function update(ctx) {
  const f = ctx.self.feetPosition, id = ctx.self.id, now = ctx.now();
  ctx.sleep(2);
  if (!ctx.place.players.some((p) => Math.hypot(p.feetPosition.x - f.x, p.feetPosition.z - f.z) < 40)) return;
  if (now - (ASKED.get(id) ?? 0) > 8000) { ASKED.set(id, now); refresh(ctx); }
  const n = WANT.get(id); if (n === undefined) return;
  let pinned = 0;
  SLOTS.forEach(([x, y, rz], i) => {
    const has = !!ctx.getObject(`${id}/note-${i}`);
    if (i < n && !has) {
      const nid = ctx.spawn(`note-${i}`, { parent: id, ...note(x, y, rz) }); pinned++;
      ctx.emit("squash", { target: nid, axis: "y", intensity: 0.3, duration: 0.35 });
    } else if (i >= n && has) ctx.destroy(`${id}/note-${i}`);
  });
  if (pinned) ctx.emit("playSound", { clip: "/cdn/moodboard-gothic-horror/sfx-parchment-pinned-to-wood-board-tack.mp3", position: { x: f.x, y: f.y + 1.4, z: f.z }, volume: 0.6 }, { audience: { nearby: f, radius: 14 } });
}
async function refresh(ctx) {
  const id = ctx.self.id;
  try {
    const r = { n: await openCount(ctx, CH.realmOf(ctx).room) };
    WANT.set(id, Math.min(SLOTS.length, r?.n ?? 0));
  } catch (e) { ctx.log("board notes read failed", String(e)); }
}
