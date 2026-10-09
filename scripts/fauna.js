// The wild things of Veilfall (from the bestiary sheet). One shepherd steps every creature tagged "fauna":
// each grazes around its home, wanders to a new spot every few seconds, and the shy ones bolt from a Bearer.
// Rows carry state { home: {x,z}, roam (m), walk (m/s), run (m/s), shy (m, 0 = never flees) }.
const WAKE = 70; // nobody this close to any creature = the shepherd naps
export function update(ctx) {
  const players = ctx.place.players;
  if (!players.length) return ctx.sleep(3);
  const herd = ctx.query({ tags: ["fauna"], place: ctx.self.place });
  const now = ctx.now();
  let awake = false;
  for (const b of herd) {
    const s = b.state, h = s.home; if (!h) continue;
    let near = null, best = Infinity;
    for (const p of players) { const d = Math.hypot(p.feetPosition.x - b.feetPosition.x, p.feetPosition.z - b.feetPosition.z); if (d < best) { best = d; near = p; } }
    if (best > WAKE) { if (s.moving) { b.velocity = { x: 0, y: b.velocity?.y ?? 0, z: 0 }; s.moving = false; } continue; }
    awake = true;
    let gx, gz, speed;
    if (s.shy && best < s.shy) { // bolt: straight away from the Bearer, then a fresh spot on the far side of home
      const dx = b.feetPosition.x - near.feetPosition.x, dz = b.feetPosition.z - near.feetPosition.z, L = Math.hypot(dx, dz) || 1;
      gx = b.feetPosition.x + (dx / L) * 6; gz = b.feetPosition.z + (dz / L) * 6;
      if (Math.hypot(gx - h.x, gz - h.z) > s.roam * 1.6) { gx = h.x - (dx / L) * s.roam * 0.6; gz = h.z - (dz / L) * s.roam * 0.6; }
      speed = s.run; s.until = now + 1500; s.to = { x: gx, z: gz };
    } else {
      if (!s.to || now > (s.until ?? 0)) { // pick the next grazing spot, or stand a while
        const a = ctx.random() * 6.283, r = ctx.random() * s.roam;
        s.to = ctx.random() < 0.4 ? { x: b.feetPosition.x, z: b.feetPosition.z } : { x: h.x + Math.cos(a) * r, z: h.z + Math.sin(a) * r };
        s.until = now + 4000 + ctx.random() * 5000;
      }
      gx = s.to.x; gz = s.to.z; speed = s.walk;
    }
    const dx = gx - b.feetPosition.x, dz = gz - b.feetPosition.z, d = Math.hypot(dx, dz);
    if (d > 0.4 && speed > 0) {
      b.velocity = { x: (dx / d) * speed, y: b.velocity?.y ?? 0, z: (dz / d) * speed };
      const yaw = Math.round(Math.atan2(-dx, -dz) * 57.2958 / 5) * 5; // face the way it goes; written only when it turns
      if (s.yaw !== yaw) { s.yaw = yaw; b.rotation = yaw; }
      s.moving = true;
    } else if (s.moving) { b.velocity = { x: 0, y: b.velocity?.y ?? 0, z: 0 }; s.moving = false; }
  }
  if (!awake) ctx.sleep(2);
}
