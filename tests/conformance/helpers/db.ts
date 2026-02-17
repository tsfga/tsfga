import type { DB } from "@tsfga/kysely";
import { Kysely, PostgresDialect, sql } from "kysely";
import pg from "pg";

let _db: Kysely<DB> | null = null;
let _pool: pg.Pool | null = null;

export function getDb(): Kysely<DB> {
  if (!_db) {
    _pool = new pg.Pool({
      host: process.env.POSTGRES_HOST,
      port: Number(process.env.POSTGRES_PORT),
      user: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DB,
      max: 1,
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

export async function beginTransaction(db: Kysely<DB>): Promise<void> {
  await sql`BEGIN`.execute(db);
}

export async function rollbackTransaction(db: Kysely<DB>): Promise<void> {
  await sql`ROLLBACK`.execute(db);
}
