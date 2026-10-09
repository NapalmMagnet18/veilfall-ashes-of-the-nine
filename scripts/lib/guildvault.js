// The guild vault, run in the member's own body (scripts/player.js routes actionData.gvault here).
// Every stored item is a row; a take is one guarded UPDATE, so two members can never draw the same item.
import C from "./data/combat.yml";
import * as CH from "./character.js";
const sfx = (n) => `/cdn/moodboard-gothic-horror/sfx-${n}.mp3`;
let lastN = null;
const note = (ctx, text) => { ctx.self.state.msg = { text, at: ctx.now() }; };
const cue = (ctx, n, v = 0.6) => ctx.emit("playSound", { clip: sfx(n), position: ctx.self.feetPosition, volume: v }, { audience: { player: ctx.self.id } });
const keep = (ctx) => { const s = ctx.self.state; return CH.save(ctx, s.charId, s, ctx.self.feetPosition).catch((e) => ctx.log("gvault save failed", String(e))); };

export async function readGuildVault(ctx) {
  const s = ctx.self.state, g = ctx.self.guild; if (!g) { s.gvault = { at: ctx.now(), none: true }; return; }
  const realm = CH.realmOf(ctx).room;
  const { rows } = await ctx.sql`SELECT id, item, by_name FROM guild_vault WHERE realm = ${realm} AND guild_id = ${g.id} AND taken_at IS NULL ORDER BY id LIMIT ${C.guildVault.slots}`;
  s.gvault = { at: ctx.now(), name: g.name, rows: rows.map((r) => ({ id: r.id, by: r.by_name, item: JSON.parse(r.item) })) };
}
export async function guildVaultInput(ctx, d) {
  if (!d || d.n === lastN) return; lastN = d.n;
  const s = ctx.self.state, g = ctx.self.guild;
  if (s.menu || !s.charId || !s.atGuildVault || !g || s.gvBusy) return;
  s.gvBusy = true;
  try {
    const realm = CH.realmOf(ctx).room;
    if (d.a === "store") {
      const inv = [...(s.inv ?? [])], i = inv.findIndex((x) => x.u === d.u); if (i < 0) return;
      const n = await ctx.sql`SELECT COUNT(*) AS n FROM guild_vault WHERE realm = ${realm} AND guild_id = ${g.id} AND taken_at IS NULL`;
      if ((n.rows[0]?.n ?? 0) >= C.guildVault.slots) { note(ctx, "The guild chest is full."); cue(ctx, "dull-click-denied", 0.3); return; }
      const it = inv[i]; inv.splice(i, 1); s.inv = inv; s.invSel = null; // out of the pack before it goes in the chest: never in both
      try { await ctx.sql`INSERT INTO guild_vault (realm, guild_id, item, by_name, stored_at) VALUES (${realm}, ${g.id}, ${JSON.stringify(it)}, ${s.charName ?? "Bearer"}, ${ctx.now()})`; }
      catch (e) { s.inv = [...(s.inv ?? []), it]; throw e; }
      await keep(ctx); cue(ctx, "heavy-iron-strongbox-lid-thud-and-latch");
      note(ctx, `${it.n} goes into the ${g.name} chest.`);
    } else if (d.a === "take") {
      if ((s.inv ?? []).length >= 24) { note(ctx, "Your pack is full."); cue(ctx, "dull-click-denied", 0.3); return; }
      const r = await ctx.sql`UPDATE guild_vault SET taken_at = ${ctx.now()}, taken_by = ${s.charName ?? "Bearer"} WHERE id = ${d.id} AND realm = ${realm} AND guild_id = ${g.id} AND taken_at IS NULL`;
      if (r.changes !== 1) { note(ctx, "A guildmate took that first."); cue(ctx, "dull-click-denied", 0.3); }
      else { const got = await ctx.sql`SELECT item FROM guild_vault WHERE id = ${d.id}`; const it = JSON.parse(got.rows[0].item);
        s.inv = [...(s.inv ?? []), it]; s.invSel = it.u; await keep(ctx); cue(ctx, "iron-strongbox-creak-open-coins-shift"); note(ctx, `Took ${it.n} from the guild chest.`); }
    }
    await readGuildVault(ctx);
  } catch (e) { ctx.log("gvault failed", String(e)); note(ctx, "The chest's lock sticks. Try again."); }
  finally { s.gvBusy = false; }
}
