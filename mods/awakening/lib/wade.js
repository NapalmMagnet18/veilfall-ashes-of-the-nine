// Awakening touch (lib/wade.js; mods/awakening/touch.js re-exports touchWater): one call from a player's own behavior routes the body to whatever Awakening water it stands in,
// so wading and swimming leave wakes on every river, creek and lake with nothing hand-placed per world.
//   // The wade rules themselves live here too: river-surface.js and water-surface.js re-export them as `wade`.
import { BODIES, TRAIL_BODIES } from "./river-slots.js";
import { shed as shedSource, strength, streamSpeed } from "./trail.js";
const clock = (ctx) => (ctx.now() / 1000) % 3600; // the shader's own clock (time)

// ---- lake: a swimmer's wave trail on still water, from the swimmer's own machine; slot = its place among the
// place's players by id; the boat keeps the last (canoe.js). No current: the water past the body is its own motion, reversed.
const memo = new Map();
export function wadeLake(ctx, body, lakeId = "awakening-lake") {
  const lake = ctx.getObject(lakeId); if (!lake?.material?.params) return;
  const L = lake.state?.level ?? 0.6, R = lake.state?.radius ?? 50, c = lake.feetPosition, f = body.feetPosition;
  if ((f.x - c.x) ** 2 + (f.z - c.z) ** 2 > R * R) return;
  const ids = ctx.place.players.map((q) => q.id).sort(), i = ids.indexOf(body.id);
  if (i < 0 || i > 1) return;
  const g = ctx.place.terrain.heightAt(f.x, f.z);
  if (!(g != null && g < L - 0.12 && f.y < L + 0.25 && f.y > g - 0.6)) return;
  const v = body.velocity ?? { x: 0, z: 0 }, rel = Math.hypot(v.x, v.z);
  const m = memo.get(body.id) ?? {}; memo.set(body.id, m);
  if (rel < 0.05 && !m.moving) return; // glass: nothing to shed
  m.moving = rel >= 0.05;
  shedSource(ctx, lake.material.params, i, m, f.x, f.z, 0, 0, strength(rel, 0.3), clock(ctx));
}

// ---- river / creek
const lines = new Map();
function lineOf(river) {
  const pts = String(river.primitive?.params?.pts ?? ""), f = river.feetPosition, key = pts + "|" + f.x + "," + f.y + "," + f.z;
  let c = lines.get(river.id);
  if (!c || c.key !== key) { c = { key, L: pts.split(";").filter(Boolean).map((t) => { const [x, y, z] = t.split(",").map(Number); return { x: x + f.x, y: y + f.y, z: z + f.z }; }) }; lines.set(river.id, c); }
  return c.L;
}
function near(L, x, z) {
  let best = null;
  for (let i = 1; i < L.length; i++) {
    const a = L[i - 1], b = L[i], ex = b.x - a.x, ez = b.z - a.z, e2 = ex * ex + ez * ez || 1e-6;
    const u = Math.max(0, Math.min(1, ((x - a.x) * ex + (z - a.z) * ez) / e2));
    const d = Math.hypot(x - a.x - ex * u, z - a.z - ez * u);
    if (!best || d < best.d) { const el = Math.sqrt(e2); best = { d, y: a.y + (b.y - a.y) * u, tx: ex / el, tz: ez / el, U: streamSpeed((a.y - b.y) / el) }; }
  }
  return best;
}
// returns true while the body is wet in this river (the caller then skips lakes)
export function wadeRiver(ctx, body, riverId = "awakening-river") {
  const river = ctx.getObject(riverId); if (!river?.material?.params) return;
  const f = body.feetPosition, HW = river.state?.halfWidth ?? 4, n = near(lineOf(river), f.x, f.z);
  const ids = ctx.place.players.map((q) => q.id).sort(), i = ids.indexOf(body.id);
  if (i < 0 || i >= BODIES) return;
  const p = river.material.params;
  const g = n && n.d < HW ? ctx.place.terrain.heightAt(f.x, f.z) : null;
  const wet = g != null && g < n.y - 0.1 && f.y < n.y + 0.3 && f.y > g - 0.6;
  if (!wet) { if (p[`b${i}r`]) p[`b${i}r`] = 0; return false; }
  const t = clock(ctx), r2 = (v) => Math.round(v * 1000) / 1000, v = body.velocity ?? { x: 0, z: 0 }, cur = n.U; // the reach's own speed, as the rocks there feel it
  const u = n.tx * cur - v.x, w = n.tz * cur - v.z;
  if (p[`b${i}r`] === 0.3 && (shed(ctx, body, p, i, f, n, cur, Math.hypot(u, w), t), true) && Math.hypot(f.x - (p[`b${i}x`] ?? 0), f.z - (p[`b${i}z`] ?? 0)) < 0.01 && Math.hypot(u - (p[`b${i}u`] ?? 0), w - (p[`b${i}w`] ?? 0)) < 0.04) return true;
  p[`b${i}x`] = r2(f.x); p[`b${i}z`] = r2(f.z); p[`b${i}v`] = r2(v.x); p[`b${i}n`] = r2(v.z);
  p[`b${i}u`] = r2(u); p[`b${i}w`] = r2(w); p[`b${i}r`] = 0.3; p[`b${i}t`] = Math.round(t * 1000) / 1000;
  shed(ctx, body, p, i, f, n, cur, Math.hypot(u, w), t);
  return true;
}
// every DT the wader sheds one wave source (lib/trail.js): where it stands, pushed by the water moving past it,
// carried off by the current it was born in: the same rule the rocks' trails are laid by
const sheds = new Map();
function shed(ctx, body, p, i, f, n, cur, rel, t) {
  if (i >= TRAIL_BODIES) return;
  const m = sheds.get(body.id) ?? {}; sheds.set(body.id, m);
  shedSource(ctx, p, i, m, f.x, f.z, n.tx * cur, n.tz * cur, strength(rel, 0.3), t);
}

// ---- the router
let list = null, listedAt = -1e9;
function waters(ctx) {
  if (list && ctx.now() - listedAt < 5000) return list;
  listedAt = ctx.now(); list = [];
  for (const kind of ["awakening-river", "awakening-water"]) for (const row of ctx.query({ tags: [kind], select: "ids" })) {
    const w = ctx.getObject(typeof row === "string" ? row : row.id); if (!w) continue;
    const f = w.feetPosition, beh = [].concat(w.behavior ?? []).map(String).join(" ");
    if (!beh.includes(kind === "awakening-river" ? "river-surface" : "water-surface")) continue; // a shore band or decor wears the tag too
    if (kind === "awakening-river") {
      const pad = (w.state?.halfWidth ?? 4) + 2; let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
      for (const t of String(w.primitive?.params?.pts ?? "").split(";").filter(Boolean)) { const [x, , z] = t.split(",").map(Number); x0 = Math.min(x0, x + f.x); x1 = Math.max(x1, x + f.x); z0 = Math.min(z0, z + f.z); z1 = Math.max(z1, z + f.z); }
      if (x0 < x1 || z0 < z1) list.push({ id: w.id, river: true, x0: x0 - pad, x1: x1 + pad, z0: z0 - pad, z1: z1 + pad });
    } else {
      const r = w.state?.radius ?? 50; list.push({ id: w.id, river: false, x0: f.x - r, x1: f.x + r, z0: f.z - r, z1: f.z + r });
    }
  }
  return list;
}
export function touchWater(ctx, body) {
  const f = body?.feetPosition; if (!f) return;
  for (const w of waters(ctx)) if (f.x > w.x0 && f.x < w.x1 && f.z > w.z0 && f.z < w.z1) {
    if (!w.river) { wadeLake(ctx, body, w.id); return; }
    if (wadeRiver(ctx, body, w.id)) return;
  }
}
