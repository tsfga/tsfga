import type { TupleStore } from "./store-interface.ts";
import type {
  AddTupleRequest,
  ConditionDefinition,
  RelationConfig,
  RemoveTupleRequest,
  Tuple,
} from "./types.ts";

/**
 * Wraps a TupleStore, overlaying contextual tuples on read operations.
 * Contextual tuples are temporary tuples passed with the check request
 * that exist only for the duration of the check.
 */
export class ContextualTupleStore implements TupleStore {
  private contextualTuples: Tuple[];

  constructor(
    private inner: TupleStore,
    tuples: AddTupleRequest[],
  ) {
    this.contextualTuples = tuples.map((t) => ({
      objectType: t.objectType,
      objectId: t.objectId,
      relation: t.relation,
      subjectType: t.subjectType,
      subjectId: t.subjectId,
      subjectRelation: t.subjectRelation ?? null,
      conditionName: t.conditionName ?? null,
      conditionContext: t.conditionContext ?? null,
    }));
  }

  async findDirectTuple(
    objectType: string,
    objectId: string,
    relation: string,
    subjectType: string,
    subjectId: string,
  ): Promise<Tuple | null> {
    // Check contextual tuples first
    const contextual = this.contextualTuples.find(
      (t) =>
        t.objectType === objectType &&
        t.objectId === objectId &&
        t.relation === relation &&
        t.subjectType === subjectType &&
        t.subjectId === subjectId &&
        t.subjectRelation === null,
    );
    if (contextual) return contextual;

    return this.inner.findDirectTuple(
      objectType,
      objectId,
      relation,
      subjectType,
      subjectId,
    );
  }

  async findUsersetTuples(
    objectType: string,
    objectId: string,
    relation: string,
  ): Promise<Tuple[]> {
    const contextual = this.contextualTuples.filter(
      (t) =>
        t.objectType === objectType &&
        t.objectId === objectId &&
        t.relation === relation &&
        t.subjectRelation !== null,
    );
    const stored = await this.inner.findUsersetTuples(
      objectType,
      objectId,
      relation,
    );
    return [...contextual, ...stored];
  }

  async findTuplesByRelation(
    objectType: string,
    objectId: string,
    relation: string,
  ): Promise<Tuple[]> {
    const contextual = this.contextualTuples.filter(
      (t) =>
        t.objectType === objectType &&
        t.objectId === objectId &&
        t.relation === relation,
    );
    const stored = await this.inner.findTuplesByRelation(
      objectType,
      objectId,
      relation,
    );
    return [...contextual, ...stored];
  }

  findRelationConfig(
    objectType: string,
    relation: string,
  ): Promise<RelationConfig | null> {
    return this.inner.findRelationConfig(objectType, relation);
  }

  findConditionDefinition(name: string): Promise<ConditionDefinition | null> {
    return this.inner.findConditionDefinition(name);
  }

  insertTuple(tuple: AddTupleRequest): Promise<void> {
    return this.inner.insertTuple(tuple);
  }

  deleteTuple(tuple: RemoveTupleRequest): Promise<boolean> {
    return this.inner.deleteTuple(tuple);
  }

  listCandidateObjectIds(objectType: string): Promise<string[]> {
    return this.inner.listCandidateObjectIds(objectType);
  }

  listDirectSubjects(
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
    return this.inner.listDirectSubjects(objectType, objectId, relation);
  }

  upsertRelationConfig(config: RelationConfig): Promise<void> {
    return this.inner.upsertRelationConfig(config);
  }

  deleteRelationConfig(objectType: string, relation: string): Promise<boolean> {
    return this.inner.deleteRelationConfig(objectType, relation);
  }

  upsertConditionDefinition(condition: ConditionDefinition): Promise<void> {
    return this.inner.upsertConditionDefinition(condition);
  }

  deleteConditionDefinition(name: string): Promise<boolean> {
    return this.inner.deleteConditionDefinition(name);
  }
}
