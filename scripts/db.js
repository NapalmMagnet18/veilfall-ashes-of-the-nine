// The world's tables. characters: every Bearer ever made, one row each, bound to the realm (room) it was made on.
// data is the character's save as JSON (scripts/lib/character.js pack/unpack); name is unique per realm among the living.
export async function migrate(sql) {
  await sql`CREATE TABLE IF NOT EXISTS characters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    realm TEXT NOT NULL,
    name TEXT NOT NULL,
    ancestry TEXT NOT NULL,
    cls TEXT NOT NULL,
    level INTEGER NOT NULL DEFAULT 1,
    zone TEXT NOT NULL DEFAULT 'Wayside Fire',
    data TEXT NOT NULL DEFAULT '{}',
    created_at INTEGER NOT NULL,
    played_at INTEGER NOT NULL,
    deleted INTEGER NOT NULL DEFAULT 0
  )`;
  await sql`CREATE INDEX IF NOT EXISTS characters_owner ON characters (user_id, realm, deleted)`;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS characters_name ON characters (realm, name) WHERE deleted = 0`;
  // the Pilgrims' Board: one row per notice; sold_at marks a sale, paid marks the seller's copper collected
  await sql`CREATE TABLE IF NOT EXISTS trades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    realm TEXT NOT NULL,
    seller_user TEXT NOT NULL,
    seller_char INTEGER NOT NULL,
    seller_name TEXT NOT NULL,
    item TEXT NOT NULL,
    price INTEGER NOT NULL,
    listed_at INTEGER NOT NULL,
    sold_at INTEGER,
    buyer_user TEXT,
    buyer_char INTEGER,
    paid INTEGER NOT NULL DEFAULT 0,
    removed INTEGER NOT NULL DEFAULT 0
  )`;
  await sql`CREATE INDEX IF NOT EXISTS trades_open ON trades (realm, sold_at, removed)`;
  await sql`CREATE INDEX IF NOT EXISTS trades_seller ON trades (seller_char, sold_at, paid)`;
}
