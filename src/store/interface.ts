import type {
  AddTupleRequest,
  ConditionDefinition,
  RelationConfig,
  RemoveTupleRequest,
  Tuple,
} from "src/core/types.ts";

export interface TupleStore {
  // === Read ===

  /** Check if a direct tuple exists (no subject_relation) */
  findDirectTuple(
    objectType: string,
    objectId: string,
    relation: string,
    subjectType: string,
    subjectId: string,
  ): Promise<Tuple | null>;

  /** Find tuples where subject_relation IS NOT NULL (userset expansion) */
  findUsersetTuples(
    objectType: string,
    objectId: string,
    relation: string,
  ): Promise<Tuple[]>;

  /** Find tuples by object + relation (for tuple-to-userset tupleset lookup) */
  findTuplesByRelation(
    objectType: string,
    objectId: string,
    relation: string,
  ): Promise<Tuple[]>;

  /** Get relation config for an object_type + relation */
  findRelationConfig(
    objectType: string,
    relation: string,
  ): Promise<RelationConfig | null>;

  /** Get a condition definition by name */
  findConditionDefinition(name: string): Promise<ConditionDefinition | null>;

  // === Write ===

  /** Insert or update a tuple (upsert on natural key) */
  insertTuple(tuple: AddTupleRequest): Promise<void>;

  /** Delete a tuple by natural key */
  deleteTuple(tuple: RemoveTupleRequest): Promise<boolean>;

  // === Query ===

  /** List candidate object IDs for list_objects (pre-filter, check still required) */
  listCandidateObjectIds(objectType: string): Promise<string[]>;

  /** List direct subjects for an object + relation */
  listDirectSubjects(
    objectType: string,
    objectId: string,
    relation: string,
  ): Promise<
    Array<{
      subjectType: string;
      subjectId: string;
      subjectRelation?: string;
    }>
  >;

  // === Config management ===

  /** Insert or update a relation config */
  upsertRelationConfig(config: RelationConfig): Promise<void>;

  /** Delete a relation config */
  deleteRelationConfig(objectType: string, relation: string): Promise<boolean>;

  /** Insert or update a condition definition */
  upsertConditionDefinition(condition: ConditionDefinition): Promise<void>;

  /** Delete a condition definition */
  deleteConditionDefinition(name: string): Promise<boolean>;
}
