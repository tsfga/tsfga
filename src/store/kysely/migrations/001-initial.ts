import { type Kysely, sql } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
  // Create schema
  await sql`CREATE SCHEMA IF NOT EXISTS tsfga`.execute(db);

  // Table: tsfga.tuples
  await sql`
		CREATE TABLE tsfga.tuples (
			id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
			object_type text NOT NULL,
			object_id uuid NOT NULL,
			relation text NOT NULL,
			subject_type text NOT NULL,
			subject_id uuid NOT NULL,
			subject_relation text,
			condition_name text,
			condition_context jsonb,
			metadata jsonb,
			created_at timestamptz DEFAULT now(),
			updated_at timestamptz DEFAULT now()
		)
	`.execute(db);

  // Unique index (handles NULL subject_relation)
  await sql`
		CREATE UNIQUE INDEX idx_tuples_unique
		ON tsfga.tuples (object_type, object_id, relation, subject_type, subject_id, COALESCE(subject_relation, ''))
	`.execute(db);

  // Table: tsfga.relation_configs
  await sql`
		CREATE TABLE tsfga.relation_configs (
			id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
			object_type text NOT NULL,
			relation text NOT NULL,
			directly_assignable_types text[],
			implied_by text[],
			computed_userset text,
			tuple_to_userset jsonb,
			allows_userset_subjects boolean DEFAULT true,
			metadata jsonb,
			UNIQUE (object_type, relation)
		)
	`.execute(db);

  // Table: tsfga.condition_definitions
  await sql`
		CREATE TABLE tsfga.condition_definitions (
			id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
			name text NOT NULL UNIQUE,
			expression text NOT NULL,
			parameters jsonb NOT NULL DEFAULT '{}'
		)
	`.execute(db);

  // Index 1: Fast lookups by object
  await sql`
		CREATE INDEX idx_tuples_object ON tsfga.tuples (object_type, object_id)
	`.execute(db);

  // Index 2: Fast lookups by subject (reverse queries)
  await sql`
		CREATE INDEX idx_tuples_subject ON tsfga.tuples (subject_type, subject_id)
	`.execute(db);

  // Index 3: Fast relation checks
  await sql`
		CREATE INDEX idx_tuples_check ON tsfga.tuples (object_type, object_id, relation, subject_type, subject_id)
	`.execute(db);

  // Index 4: Fast userset expansion
  await sql`
		CREATE INDEX idx_tuples_userset ON tsfga.tuples (object_type, object_id, relation)
		WHERE subject_relation IS NOT NULL
	`.execute(db);

  // Index 5: JSONB GIN index for metadata queries
  await sql`
		CREATE INDEX idx_tuples_metadata ON tsfga.tuples USING GIN (metadata)
		WHERE metadata IS NOT NULL
	`.execute(db);

  // Index 6: Condition name lookup
  await sql`
		CREATE INDEX idx_tuples_condition ON tsfga.tuples (condition_name)
		WHERE condition_name IS NOT NULL
	`.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`DROP TABLE IF EXISTS tsfga.condition_definitions`.execute(db);
  await sql`DROP TABLE IF EXISTS tsfga.relation_configs`.execute(db);
  await sql`DROP TABLE IF EXISTS tsfga.tuples`.execute(db);
  await sql`DROP SCHEMA IF EXISTS tsfga`.execute(db);
}
