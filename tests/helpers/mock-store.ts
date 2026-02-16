import type {
  AddTupleRequest,
  ConditionDefinition,
  RelationConfig,
  RemoveTupleRequest,
  Tuple,
} from "src/core/types.ts";
import type { TupleStore } from "src/store/interface.ts";

/**
 * In-memory TupleStore for unit tests.
 * Stores tuples, relation configs, and condition definitions in arrays.
 */
export class MockTupleStore implements TupleStore {
  tuples: Tuple[] = [];
  relationConfigs: RelationConfig[] = [];
  conditionDefinitions: ConditionDefinition[] = [];

  async findDirectTuple(
    objectType: string,
    objectId: string,
    relation: string,
    subjectType: string,
    subjectId: string,
  ): Promise<Tuple | null> {
    return (
      this.tuples.find(
        (t) =>
          t.objectType === objectType &&
          t.objectId === objectId &&
          t.relation === relation &&
          t.subjectType === subjectType &&
          t.subjectId === subjectId &&
          t.subjectRelation == null,
      ) ?? null
    );
  }

  async findUsersetTuples(
    objectType: string,
    objectId: string,
    relation: string,
  ): Promise<Tuple[]> {
    return this.tuples.filter(
      (t) =>
        t.objectType === objectType &&
        t.objectId === objectId &&
        t.relation === relation &&
        t.subjectRelation != null,
    );
  }

  async findTuplesByRelation(
    objectType: string,
    objectId: string,
    relation: string,
  ): Promise<Tuple[]> {
    return this.tuples.filter(
      (t) =>
        t.objectType === objectType &&
        t.objectId === objectId &&
        t.relation === relation,
    );
  }

  async findRelationConfig(
    objectType: string,
    relation: string,
  ): Promise<RelationConfig | null> {
    return (
      this.relationConfigs.find(
        (c) => c.objectType === objectType && c.relation === relation,
      ) ?? null
    );
  }

  async findConditionDefinition(
    name: string,
  ): Promise<ConditionDefinition | null> {
    return this.conditionDefinitions.find((c) => c.name === name) ?? null;
  }

  async insertTuple(tuple: AddTupleRequest): Promise<void> {
    const idx = this.tuples.findIndex(
      (t) =>
        t.objectType === tuple.objectType &&
        t.objectId === tuple.objectId &&
        t.relation === tuple.relation &&
        t.subjectType === tuple.subjectType &&
        t.subjectId === tuple.subjectId &&
        (t.subjectRelation ?? "") === (tuple.subjectRelation ?? ""),
    );
    const newTuple: Tuple = {
      objectType: tuple.objectType,
      objectId: tuple.objectId,
      relation: tuple.relation,
      subjectType: tuple.subjectType,
      subjectId: tuple.subjectId,
      subjectRelation: tuple.subjectRelation,
      conditionName: tuple.conditionName,
      conditionContext: tuple.conditionContext,
    };
    if (idx >= 0) {
      this.tuples[idx] = newTuple;
    } else {
      this.tuples.push(newTuple);
    }
  }

  async deleteTuple(tuple: RemoveTupleRequest): Promise<boolean> {
    const idx = this.tuples.findIndex(
      (t) =>
        t.objectType === tuple.objectType &&
        t.objectId === tuple.objectId &&
        t.relation === tuple.relation &&
        t.subjectType === tuple.subjectType &&
        t.subjectId === tuple.subjectId &&
        (t.subjectRelation ?? "") === (tuple.subjectRelation ?? ""),
    );
    if (idx >= 0) {
      this.tuples.splice(idx, 1);
      return true;
    }
    return false;
  }

  async listCandidateObjectIds(objectType: string): Promise<string[]> {
    const ids = new Set<string>();
    for (const t of this.tuples) {
      if (t.objectType === objectType) {
        ids.add(t.objectId);
      }
    }
    return [...ids];
  }

  async listDirectSubjects(
    objectType: string,
    objectId: string,
    relation: string,
  ): Promise<
    Array<{
      subjectType: string;
      subjectId: string;
      subjectRelation?: string;
    }>
  > {
    return this.tuples
      .filter(
        (t) =>
          t.objectType === objectType &&
          t.objectId === objectId &&
          t.relation === relation,
      )
      .map((t) => ({
        subjectType: t.subjectType,
        subjectId: t.subjectId,
        subjectRelation: t.subjectRelation,
      }));
  }

  async upsertRelationConfig(config: RelationConfig): Promise<void> {
    const idx = this.relationConfigs.findIndex(
      (c) =>
        c.objectType === config.objectType && c.relation === config.relation,
    );
    if (idx >= 0) {
      this.relationConfigs[idx] = config;
    } else {
      this.relationConfigs.push(config);
    }
  }

  async deleteRelationConfig(
    objectType: string,
    relation: string,
  ): Promise<boolean> {
    const idx = this.relationConfigs.findIndex(
      (c) => c.objectType === objectType && c.relation === relation,
    );
    if (idx >= 0) {
      this.relationConfigs.splice(idx, 1);
      return true;
    }
    return false;
  }

  async upsertConditionDefinition(
    condition: ConditionDefinition,
  ): Promise<void> {
    const idx = this.conditionDefinitions.findIndex(
      (c) => c.name === condition.name,
    );
    if (idx >= 0) {
      this.conditionDefinitions[idx] = condition;
    } else {
      this.conditionDefinitions.push(condition);
    }
  }

  async deleteConditionDefinition(name: string): Promise<boolean> {
    const idx = this.conditionDefinitions.findIndex((c) => c.name === name);
    if (idx >= 0) {
      this.conditionDefinitions.splice(idx, 1);
      return true;
    }
    return false;
  }
}
