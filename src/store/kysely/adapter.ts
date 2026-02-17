import { type Kysely, sql } from "kysely";
import { InvalidStoredDataError } from "src/core/errors.ts";
import type {
  AddTupleRequest,
  ConditionDefinition,
  ConditionParameterType,
  IntersectionOperand,
  RelationConfig,
  RemoveTupleRequest,
  Tuple,
} from "src/core/types.ts";
import type { TupleStore } from "src/store/interface.ts";
import type { DB, Json } from "src/store/kysely/schema.ts";

const WILDCARD_SENTINEL = "00000000-0000-0000-0000-000000000000";

export class KyselyTupleStore implements TupleStore {
  constructor(private db: Kysely<DB>) {}

  async findDirectTuple(
    objectType: string,
    objectId: string,
    relation: string,
    subjectType: string,
    subjectId: string,
  ): Promise<Tuple | null> {
    const dbSubjectId = subjectId === "*" ? WILDCARD_SENTINEL : subjectId;
    const row = await this.db
      .selectFrom("tsfga.tuples")
      .selectAll()
      .where("object_type", "=", objectType)
      .where("object_id", "=", objectId)
      .where("relation", "=", relation)
      .where("subject_type", "=", subjectType)
      .where("subject_id", "=", dbSubjectId)
      .where("subject_relation", "is", null)
      .executeTakeFirst();

    if (!row) return null;
    return this.rowToTuple(row);
  }

  async findUsersetTuples(
    objectType: string,
    objectId: string,
    relation: string,
  ): Promise<Tuple[]> {
    const rows = await this.db
      .selectFrom("tsfga.tuples")
      .selectAll()
      .where("object_type", "=", objectType)
      .where("object_id", "=", objectId)
      .where("relation", "=", relation)
      .where("subject_relation", "is not", null)
      .execute();

    return rows.map((r) => this.rowToTuple(r));
  }

  async findTuplesByRelation(
    objectType: string,
    objectId: string,
    relation: string,
  ): Promise<Tuple[]> {
    const rows = await this.db
      .selectFrom("tsfga.tuples")
      .selectAll()
      .where("object_type", "=", objectType)
      .where("object_id", "=", objectId)
      .where("relation", "=", relation)
      .execute();

    return rows.map((r) => this.rowToTuple(r));
  }

  async findRelationConfig(
    objectType: string,
    relation: string,
  ): Promise<RelationConfig | null> {
    const row = await this.db
      .selectFrom("tsfga.relation_configs")
      .selectAll()
      .where("object_type", "=", objectType)
      .where("relation", "=", relation)
      .executeTakeFirst();

    if (!row) return null;

    return {
      objectType: row.object_type,
      relation: row.relation,
      directlyAssignableTypes: row.directly_assignable_types,
      impliedBy: row.implied_by,
      computedUserset: row.computed_userset,
      tupleToUserset: this.parseTupleToUserset(row.tuple_to_userset),
      excludedBy: row.excluded_by,
      intersection: this.parseIntersection(row.intersection),
      allowsUsersetSubjects: row.allows_userset_subjects,
    };
  }

  async findConditionDefinition(
    name: string,
  ): Promise<ConditionDefinition | null> {
    const row = await this.db
      .selectFrom("tsfga.condition_definitions")
      .selectAll()
      .where("name", "=", name)
      .executeTakeFirst();

    if (!row) return null;

    return {
      name: row.name,
      expression: row.expression,
      parameters: this.parseConditionParameters(row.parameters),
    };
  }

  async insertTuple(tuple: AddTupleRequest): Promise<void> {
    const condCtx = tuple.conditionContext
      ? JSON.stringify(tuple.conditionContext)
      : null;
    const now = new Date();
    const dbSubjectId =
      tuple.subjectId === "*" ? WILDCARD_SENTINEL : tuple.subjectId;

    await this.db
      .insertInto("tsfga.tuples")
      .values({
        object_type: tuple.objectType,
        object_id: tuple.objectId,
        relation: tuple.relation,
        subject_type: tuple.subjectType,
        subject_id: dbSubjectId,
        subject_relation: tuple.subjectRelation ?? null,
        condition_name: tuple.conditionName ?? null,
        condition_context: condCtx,
        created_at: now,
        updated_at: now,
      })
      .onConflict((oc) =>
        oc
          .expression(
            sql`object_type, object_id, relation, subject_type, subject_id, COALESCE(subject_relation, '')`,
          )
          .doUpdateSet({
            condition_name: tuple.conditionName ?? null,
            condition_context: condCtx,
            updated_at: now,
          }),
      )
      .execute();
  }

  async deleteTuple(tuple: RemoveTupleRequest): Promise<boolean> {
    const dbSubjectId =
      tuple.subjectId === "*" ? WILDCARD_SENTINEL : tuple.subjectId;
    const result = await this.db
      .deleteFrom("tsfga.tuples")
      .where("object_type", "=", tuple.objectType)
      .where("object_id", "=", tuple.objectId)
      .where("relation", "=", tuple.relation)
      .where("subject_type", "=", tuple.subjectType)
      .where("subject_id", "=", dbSubjectId)
      .$call((qb) => {
        if (tuple.subjectRelation) {
          return qb.where("subject_relation", "=", tuple.subjectRelation);
        }
        return qb.where("subject_relation", "is", null);
      })
      .executeTakeFirst();

    return BigInt(result.numDeletedRows) > 0n;
  }

  async listCandidateObjectIds(objectType: string): Promise<string[]> {
    const rows = await this.db
      .selectFrom("tsfga.tuples")
      .select("object_id")
      .distinct()
      .where("object_type", "=", objectType)
      .execute();

    return rows.map((r) => r.object_id);
  }

  async listDirectSubjects(
    objectType: string,
    objectId: string,
    relation: string,
  ): Promise<
    Array<{
      subjectType: string;
      subjectId: string;
      subjectRelation: string | null;
    }>
  > {
    const rows = await this.db
      .selectFrom("tsfga.tuples")
      .select(["subject_type", "subject_id", "subject_relation"])
      .where("object_type", "=", objectType)
      .where("object_id", "=", objectId)
      .where("relation", "=", relation)
      .execute();

    return rows.map((r) => ({
      subjectType: r.subject_type,
      subjectId: r.subject_id,
      subjectRelation: r.subject_relation,
    }));
  }

  async upsertRelationConfig(config: RelationConfig): Promise<void> {
    const ttuJson = config.tupleToUserset
      ? JSON.stringify(config.tupleToUserset)
      : null;
    const intersectionJson = config.intersection
      ? JSON.stringify(config.intersection)
      : null;

    await this.db
      .insertInto("tsfga.relation_configs")
      .values({
        object_type: config.objectType,
        relation: config.relation,
        directly_assignable_types: config.directlyAssignableTypes ?? null,
        implied_by: config.impliedBy ?? null,
        computed_userset: config.computedUserset ?? null,
        tuple_to_userset: ttuJson,
        excluded_by: config.excludedBy ?? null,
        intersection: intersectionJson,
        allows_userset_subjects: config.allowsUsersetSubjects,
      })
      .onConflict((oc) =>
        oc.columns(["object_type", "relation"]).doUpdateSet({
          directly_assignable_types: config.directlyAssignableTypes ?? null,
          implied_by: config.impliedBy ?? null,
          computed_userset: config.computedUserset ?? null,
          tuple_to_userset: ttuJson,
          excluded_by: config.excludedBy ?? null,
          intersection: intersectionJson,
          allows_userset_subjects: config.allowsUsersetSubjects,
        }),
      )
      .execute();
  }

  async deleteRelationConfig(
    objectType: string,
    relation: string,
  ): Promise<boolean> {
    const result = await this.db
      .deleteFrom("tsfga.relation_configs")
      .where("object_type", "=", objectType)
      .where("relation", "=", relation)
      .executeTakeFirst();

    return BigInt(result.numDeletedRows) > 0n;
  }

  async upsertConditionDefinition(
    condition: ConditionDefinition,
  ): Promise<void> {
    const parameters = condition.parameters
      ? JSON.stringify(condition.parameters)
      : null;

    await this.db
      .insertInto("tsfga.condition_definitions")
      .values({
        name: condition.name,
        expression: condition.expression,
        parameters,
      })
      .onConflict((oc) =>
        oc.column("name").doUpdateSet({
          expression: condition.expression,
          parameters,
        }),
      )
      .execute();
  }

  async deleteConditionDefinition(name: string): Promise<boolean> {
    const result = await this.db
      .deleteFrom("tsfga.condition_definitions")
      .where("name", "=", name)
      .executeTakeFirst();

    return BigInt(result.numDeletedRows) > 0n;
  }

  private rowToTuple(row: {
    object_type: string;
    object_id: string;
    relation: string;
    subject_type: string;
    subject_id: string;
    subject_relation: string | null;
    condition_name: string | null;
    condition_context: Json | null;
  }): Tuple {
    return {
      objectType: row.object_type,
      objectId: row.object_id,
      relation: row.relation,
      subjectType: row.subject_type,
      subjectId: row.subject_id === WILDCARD_SENTINEL ? "*" : row.subject_id,
      subjectRelation: row.subject_relation,
      conditionName: row.condition_name,
      conditionContext: this.parseConditionContext(row.condition_context),
    };
  }

  private parseTupleToUserset(
    value: Json | null,
  ): Array<{ tupleset: string; computedUserset: string }> | null {
    if (value === null) return null;
    if (!Array.isArray(value)) {
      throw new InvalidStoredDataError(
        "relation_configs",
        "tuple_to_userset",
        "expected array",
      );
    }
    for (const item of value) {
      if (
        typeof item !== "object" ||
        item === null ||
        Array.isArray(item) ||
        typeof item["tupleset"] !== "string" ||
        typeof item["computedUserset"] !== "string"
      ) {
        throw new InvalidStoredDataError(
          "relation_configs",
          "tuple_to_userset",
          "each element must have string tupleset and computedUserset",
        );
      }
    }
    return value as Array<{ tupleset: string; computedUserset: string }>;
  }

  private parseIntersection(value: Json | null): IntersectionOperand[] | null {
    if (value === null) return null;
    if (!Array.isArray(value)) {
      throw new InvalidStoredDataError(
        "relation_configs",
        "intersection",
        "expected array",
      );
    }
    for (const item of value) {
      if (typeof item !== "object" || item === null || Array.isArray(item)) {
        throw new InvalidStoredDataError(
          "relation_configs",
          "intersection",
          "each element must be an object with a type field",
        );
      }
      const type = item["type"];
      if (type === "direct") {
        continue;
      }
      if (type === "computedUserset") {
        if (typeof item["relation"] !== "string") {
          throw new InvalidStoredDataError(
            "relation_configs",
            "intersection",
            "computedUserset operand must have string relation",
          );
        }
        continue;
      }
      if (type === "tupleToUserset") {
        if (
          typeof item["tupleset"] !== "string" ||
          typeof item["computedUserset"] !== "string"
        ) {
          throw new InvalidStoredDataError(
            "relation_configs",
            "intersection",
            "tupleToUserset operand must have string tupleset and computedUserset",
          );
        }
        continue;
      }
      throw new InvalidStoredDataError(
        "relation_configs",
        "intersection",
        `unknown operand type: ${String(type)}`,
      );
    }
    return value as IntersectionOperand[];
  }

  private parseConditionParameters(
    value: Json | null,
  ): Record<string, ConditionParameterType> | null {
    if (value === null) return null;
    if (typeof value !== "object" || Array.isArray(value)) {
      throw new InvalidStoredDataError(
        "condition_definitions",
        "parameters",
        "expected object",
      );
    }
    const validTypes = new Set([
      "string",
      "int",
      "uint",
      "bool",
      "double",
      "duration",
      "timestamp",
      "list",
      "map",
      "any",
    ]);
    for (const [key, val] of Object.entries(value)) {
      if (typeof val !== "string" || !validTypes.has(val)) {
        throw new InvalidStoredDataError(
          "condition_definitions",
          "parameters",
          `invalid parameter type for "${key}": ${String(val)}`,
        );
      }
    }
    return value as Record<string, ConditionParameterType>;
  }

  private parseConditionContext(
    value: Json | null,
  ): Record<string, unknown> | null {
    if (value === null) return null;
    if (typeof value !== "object" || Array.isArray(value)) {
      throw new InvalidStoredDataError(
        "tuples",
        "condition_context",
        "expected object",
      );
    }
    return value as Record<string, unknown>;
  }
}
