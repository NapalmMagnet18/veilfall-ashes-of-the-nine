// A townsperson who speaks when a Bearer comes near: their line rises over them for a few seconds.
// state: { name, title, lines: [..] }; child "bubble" draws state.line.
const NEAR = 4.5, HOLD = 6000, REST = 20000;
export function update(ctx) {
  const me = ctx.self, s = me.state, now = ctx.now();
  const bubble = ctx.getObject(me.id + "/bubble");
  if (s.until && now > s.until) { s.until = 0; if (bubble) bubble.state.line = ""; }
  if (now < (s.next ?? 0)) return ctx.sleep(1);
  let close = false;
  for (const p of ctx.place.players) if (Math.hypot(p.feetPosition.x - me.feetPosition.x, p.feetPosition.z - me.feetPosition.z) < NEAR) { close = true; break; }
  if (!close) return ctx.sleep(1);
  const lines = s.lines ?? []; if (!lines.length || !bubble) return ctx.sleep(5);
  s.turn = ((s.turn ?? -1) + 1) % lines.length;
  bubble.state.line = lines[s.turn];
  s.until = now + HOLD; s.next = now + REST;
  ctx.sleep(1);
}
