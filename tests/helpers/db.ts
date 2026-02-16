import { Kysely, PostgresDialect } from "kysely";
import pg from "pg";
import type { DB } from "src/store/kysely/schema.ts";

let _db: Kysely<DB> | null = null;
let _pool: pg.Pool | null = null;

export function getDb(): Kysely<DB> {
  if (!_db) {
    _pool = new pg.Pool({
      host: process.env.POSTGRES_HOST || "localhost",
      port: Number(process.env.POSTGRES_PORT || 5432),
      user: process.env.POSTGRES_USER || "dev",
      password: process.env.POSTGRES_PASSWORD || "password",
      database: process.env.POSTGRES_DB || "dev",
    });
    _db = new Kysely<DB>({
      dialect: new PostgresDialect({ pool: _pool }),
    });
  }
  return _db;
}

export async function destroyDb(): Promise<void> {
  if (_db) {
    await _db.destroy();
    _db = null;
    _pool = null;
  }
}

export async function cleanTsfgaTables(db: Kysely<DB>): Promise<void> {
  await db.deleteFrom("tsfga.tuples").execute();
  await db.deleteFrom("tsfga.relation_configs").execute();
  await db.deleteFrom("tsfga.condition_definitions").execute();
}
