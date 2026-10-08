// The camp vendor's trades, run in the buyer's own body (scripts/player.js onInput routes actionData.shop here).
// sendAction('shop', { a: 'buy'|'sell'|'close', item, n }): n dedupes, so one click acts once.
import E from "./data/economy.yml";
const SND = "/cdn/moodboard-gothic-horror/";
let lastN = null;
export const owned = (s, it) => (it.id === "tonic" ? (s.tonics ?? 0) >= it.cap : it.once ? !!s.bag?.[it.id] : false);
export function shopInput(ctx, data) {
  if (!data || data.n === lastN) return;
  lastN = data.n;
  const me = ctx.self, s = me.state;
  if (s.menu || !s.charId) return;
  if (data.a === "close") { s.shop = null; return; }
  if (!s.shop || s.dead) return;
  const over = { ...me.feetPosition, y: me.feetPosition.y + 2.2 };
  const tell = (text, color) => ctx.emit("damageNumber", { position: over, text, color, size: 0.8 }, { audience: { player: me.id } });
  if (data.a === "buy") {
    const it = (E.shops[s.shop] ?? []).find((i) => i.id === data.item); if (!it) return;
    if (owned(s, it)) return tell(it.once ? "ALREADY OWNED" : "PACK FULL", "#d8442f");
    if ((s.copper ?? 0) < it.price) return tell("NOT ENOUGH COIN", "#d8442f");
    s.copper = (s.copper ?? 0) - it.price;
    if (it.id === "tonic") s.tonics = (s.tonics ?? 0) + 1;
    else { s.bag = { ...(s.bag ?? {}), [it.id]: 1 }; if (it.maxHp) { s.maxHp = (s.maxHp ?? 100) + it.maxHp; s.hp += it.maxHp; } }
    ctx.emit("playSound", { clip: SND + "sfx-coin-purse-drop-on-wood.mp3", position: me.feetPosition, volume: 0.8 }, { audience: { player: me.id } });
    tell(it.name.toUpperCase(), "#f2d38a");
  } else if (data.a === "sell" && data.id === "heartwax") {
    if (!(s.heartwax > 0)) return;
    s.heartwax -= 1; s.copper = (s.copper ?? 0) + E.sell.heartwax;
    ctx.emit("playSound", { clip: SND + "sfx-coin-purse-drop-on-wood.mp3", position: me.feetPosition, volume: 0.9 }, { audience: { player: me.id } });
    tell(`+${E.sell.heartwax}c · HEARTWAX`, "#b48cff");
  } else if (data.a === "sell") {
    const n = s.shards ?? 0; if (!n) return;
    const pay = n * E.sell.shard;
    s.shards = 0; s.copper = (s.copper ?? 0) + pay;
    ctx.emit("playSound", { clip: SND + "sfx-coins-spill-small-clink.mp3", position: me.feetPosition, volume: 0.8 }, { audience: { player: me.id } });
    tell(`+${pay}c`, "#e6c76a");
  }
}
