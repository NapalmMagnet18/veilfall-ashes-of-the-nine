// A wax-sealed petition at the tollhouse. Walk over it during "The Toll of Remembrance" to take it (each player their own).
export function onTriggerEnter(ctx, other) {
  if (!other?.tags?.includes("player")) return;
  const s = other.state, q = s.quest ?? {};
  if (q.stage !== 2) return;
  const have = s.petitions ?? [];
  if (have.includes(ctx.self.id)) return;
  s.petitions = [...have, ctx.self.id];
  const f = ctx.self.feetPosition;
  ctx.emit("playSound", { clip: "/cdn/moodboard-gothic-horror/sfx-parchment-pickup-wax-seal-crack.mp3", position: f, volume: 0.8, pitch: 0.9 + 0.05 * s.petitions.length });
  ctx.emit("damageNumber", { position: { ...f, y: f.y + 1.4 }, text: `PETITION ${s.petitions.length}/5`, color: "#f2d38a" }, { audience: { player: other.id } });
  ctx.emit("fx", { position: { ...f, y: f.y + 0.3 }, script: `fx\npop sp burst=16 on=disc(.3) life=.4..0.8 v=up(1..2.5)+sdir()*.6 size=.03..0.06 col=hdr(3,2.2,.9) a=1>0 r=sprite(mote,add)` });
}
