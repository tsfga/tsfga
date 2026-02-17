import type { Kysely } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable("tsfga.relation_configs")
    .addColumn("excluded_by", "text")
    .execute();

  await db.schema
    .alterTable("tsfga.relation_configs")
    .addColumn("intersection", "jsonb")
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable("tsfga.relation_configs")
    .dropColumn("intersection")
    .execute();

  await db.schema
    .alterTable("tsfga.relation_configs")
    .dropColumn("excluded_by")
    .execute();
}
