// The Pilgrims' Board, run in the trader's own body (scripts/player.js routes actionData.trade here).
// Every listing is a row in the realm's trades table; a buy is one guarded UPDATE, so two buyers can never
// take one item. Copper owed to a seller waits in the table until they collect it at the board.
import T from "./data/trade.yml";
import { sellValue } from "./loot.js";
import * as CH from "./character.js";
const sfx = (n) => `/cdn/moodboard-gothic-horror/sfx-${n}.mp3`;
let lastN = null;
export const TRADE = T;
export const asks = (it) => T.asks.map((m) => Math.max(T.minPrice, sellValue(it) * m));

export async function readBoard(ctx) {
  const s = ctx.self.state, realm = CH.realmOf(ctx).room;
  const { rows } = await ctx.sql`SELECT id, seller_char, seller_name, item, price FROM trades WHERE realm = ${realm} AND sold_at IS NULL AND removed = 0 ORDER BY id DESC LIMIT ${T.show}`;
  const owed = await ctx.sql`SELECT COALESCE(SUM(price), 0) AS c, COUNT(*) AS n FROM trades WHERE seller_char = ${s.charId} AND seller_user = @caller AND sold_at IS NOT NULL AND paid = 0`;
  s.board = {
    at: ctx.now(),
    rows: rows.map((r) => ({ id: r.id, seller: r.seller_name, mine: r.seller_char === s.charId, price: r.price, item: JSON.parse(r.item) })),
    owed: Math.floor((owed.rows[0]?.c ?? 0) * (1 - T.fee)), sold: owed.rows[0]?.n ?? 0,
  };
}
function note(ctx, text) { ctx.self.state.msg = { text, at: ctx.now() }; }
function cue(ctx, n, v = 0.6) { ctx.emit("playSound", { clip: sfx(n), position: ctx.self.feetPosition, volume: v }, { audience: { player: ctx.self.id } }); }
function keep(ctx) { const s = ctx.self.state; return CH.save(ctx, s.charId, s, ctx.self.feetPosition).catch((e) => ctx.log("trade save failed", String(e))); }

export async function tradeInput(ctx, d) {
  if (!d || d.n === lastN) return; lastN = d.n;
  const s = ctx.self.state;
  if (s.menu || !s.charId || !s.atBoard || s.tradeBusy) return;
  s.tradeBusy = true;
  try {
    const realm = CH.realmOf(ctx).room;
    if (d.a === "list") {
      const hw = !!d.hw, inv = [...(s.inv ?? [])], i = hw ? -2 : inv.findIndex((x) => x.u === d.u); if (i === -1) return;
      if (hw && !((s.heartwax ?? 0) > 0)) return;
      const it = hw ? { hw: 1, u: "hw" + ctx.now(), n: "Heartwax", t: "relic", b: "heartwax", il: 0 } : inv[i], price = hw ? T.hwAsks[d.k ?? 0] : asks(it)[d.k ?? 0];
      if (!price) return;
      const mine = await ctx.sql`SELECT COUNT(*) AS n FROM trades WHERE seller_char = ${s.charId} AND sold_at IS NULL AND removed = 0`;
      if ((mine.rows[0]?.n ?? 0) >= T.maxPins) { note(ctx, `The board holds only ${T.maxPins} of your notices. Take one down first.`); cue(ctx, "dull-click-denied", 0.3); return; }
      if (hw) s.heartwax -= 1; else { inv.splice(i, 1); s.inv = inv; s.invSel = null; } // the item leaves the pack before the notice goes up: it can never be in both
      try { await ctx.sql`INSERT INTO trades (realm, seller_user, seller_char, seller_name, item, price, listed_at) VALUES (${realm}, @caller, ${s.charId}, ${s.charName ?? "Bearer"}, ${JSON.stringify(it)}, ${price}, ${ctx.now()})`; }
      catch (e) { if (hw) s.heartwax = (s.heartwax ?? 0) + 1; else s.inv = [...(s.inv ?? []), it]; throw e; }
      await keep(ctx);
      cue(ctx, "parchment-nailed-to-wooden-board-hammer-tap");
      note(ctx, `${it.n} is pinned to the board for ${price} copper.`);
    } else if (d.a === "buy") {
      const row = s.board?.rows?.find((r) => r.id === d.id); if (!row || row.mine) return;
      if ((s.copper ?? 0) < row.price) { note(ctx, `That notice asks ${row.price} copper. You carry ${s.copper ?? 0}.`); cue(ctx, "dull-click-denied", 0.3); return; }
      if (!row.item?.hw && (s.inv ?? []).length >= 24) { note(ctx, "Your pack is full."); cue(ctx, "dull-click-denied", 0.3); return; }
      const r = await ctx.sql`UPDATE trades SET sold_at = ${ctx.now()}, buyer_user = @caller, buyer_char = ${s.charId} WHERE id = ${row.id} AND sold_at IS NULL AND removed = 0 AND seller_char != ${s.charId} AND seller_user != @caller`;
      if (r.changes !== 1) { note(ctx, "Someone tore that notice down before you."); cue(ctx, "dull-click-denied", 0.3); }
      else {
        const got = await ctx.sql`SELECT item, price FROM trades WHERE id = ${row.id}`;
        const it = JSON.parse(got.rows[0].item);
        s.copper = (s.copper ?? 0) - got.rows[0].price;
        if (it.hw) s.heartwax = (s.heartwax ?? 0) + 1; else { s.inv = [...(s.inv ?? []), it]; s.invSel = it.u; }
        await keep(ctx);
        cue(ctx, "coins-into-leather-purse", 0.7); cue(ctx, "parchment-torn-from-nail", 0.5);
        ctx.emit("fx", { position: { x: ctx.self.feetPosition.x, y: ctx.self.feetPosition.y + 1.2, z: ctx.self.feetPosition.z }, script: `fx\npop coin burst=14 life=.5..0.9 v=up(2..3)+sdir()*1 size=.04..0.06 spin=-8..8 acc=grav()+drag(.4) col=hdr(2.2,1.3,.5) a=1>0 sz=$size rot=$age*$spin r=sprite(chip,alpha,velocity,.02)` }, { audience: { player: ctx.self.id } });
        note(ctx, `Bought ${it.n} from ${row.seller}.`);
        ctx.emit("stat", { name: "board-buys" }, { audience: { player: ctx.self.id } });
      }
    } else if (d.a === "unlist") {
      const got = await ctx.sql`SELECT item FROM trades WHERE id = ${d.id} AND seller_char = ${s.charId} AND seller_user = @caller AND sold_at IS NULL AND removed = 0`;
      if (!got.rows[0]) return;
      const back = JSON.parse(got.rows[0].item);
      if (!back.hw && (s.inv ?? []).length >= 24) { note(ctx, "Your pack is full."); return; }
      const r = await ctx.sql`UPDATE trades SET removed = 1 WHERE id = ${d.id} AND seller_char = ${s.charId} AND seller_user = @caller AND sold_at IS NULL AND removed = 0`;
      if (r.changes === 1) { if (back.hw) s.heartwax = (s.heartwax ?? 0) + 1; else s.inv = [...(s.inv ?? []), back]; await keep(ctx); cue(ctx, "parchment-torn-from-nail", 0.6); }
    } else if (d.a === "collect") {
      const { rows } = await ctx.sql`SELECT id, price FROM trades WHERE seller_char = ${s.charId} AND seller_user = @caller AND sold_at IS NOT NULL AND paid = 0`;
      let take = 0, n = 0;
      for (const r of rows) { const u = await ctx.sql`UPDATE trades SET paid = 1 WHERE id = ${r.id} AND seller_user = @caller AND paid = 0`; if (u.changes === 1) { take += r.price; n++; } }
      const net = Math.floor(take * (1 - T.fee));
      if (net > 0) {
        s.copper = (s.copper ?? 0) + net; await keep(ctx);
        cue(ctx, "coins-into-leather-purse", 0.8); cue(ctx, "small-strongbox-lid-creak-and-coins-spill", 0.6);
        note(ctx, `${n} sold. The keeper takes a tenth; ${net} copper is yours.`);
        ctx.emit("stat", { name: "board-sales", value: n }, { audience: { player: ctx.self.id } });
      }
    }
  } catch (e) { ctx.log("trade failed", String(e)); note(ctx, "The board's ledger smeared. Try again."); }
  finally { s.tradeBusy = false; await readBoard(ctx).catch(() => {}); }
}

// the crier's reads, kept here beside the board so every seat that runs a player's code can make them
export async function owedSales(ctx, cid) {
  const { rows: [o] } = await ctx.sql`SELECT COUNT(*) AS n, COALESCE(SUM(price), 0) AS c FROM trades WHERE seller_char = ${cid} AND sold_at IS NOT NULL AND paid = 0`;
  return o ?? null;
}
export async function latestNotices(ctx, realm) {
  const { rows } = await ctx.sql`SELECT id, seller_name, item, price FROM trades WHERE realm = ${realm} AND sold_at IS NULL AND removed = 0 ORDER BY id DESC LIMIT 4`;
  return rows;
}
export async function openCount(ctx, realm) {
  const { rows: [r] } = await ctx.sql`SELECT COUNT(*) AS n FROM trades WHERE realm = ${realm} AND sold_at IS NULL AND removed = 0`;
  return r?.n ?? 0;
}
