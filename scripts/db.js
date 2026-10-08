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
}
