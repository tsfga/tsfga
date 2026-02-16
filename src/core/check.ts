import { evaluateTupleCondition } from "src/core/conditions.ts";
import type {
  CheckOptions,
  CheckRequest,
  IntersectionOperand,
  RelationConfig,
} from "src/core/types.ts";
import type { TupleStore } from "src/store/interface.ts";

/**
 * Recursive check algorithm with support for:
 * - Direct tuple check + wildcard
 * - Userset expansion
 * - Relation inheritance (implied_by)
 * - Computed userset
 * - Tuple-to-userset
 * - Exclusion (but not)
 * - Intersection (and)
 */
export async function check(
  store: TupleStore,
  request: CheckRequest,
  options: CheckOptions = {},
  depth: number = 0,
): Promise<boolean> {
  const maxDepth = options.maxDepth ?? 10;

  // Prevent infinite recursion
  if (depth > maxDepth) {
    return false;
  }

  // Fetch relation config once for use across all steps
  const config = await store.findRelationConfig(
    request.objectType,
    request.relation,
  );

  // If the relation has an intersection, ALL operands must be true
  if (config?.intersection) {
    return checkIntersection(
      store,
      request,
      config.intersection,
      options,
      depth,
    );
  }

  // Run the base check (steps 1-5)
  const baseResult = await checkBase(store, request, config, options, depth);

  // If base check passed and there's an exclusion, verify the user
  // is NOT in the excluded relation
  if (baseResult && config?.excludedBy) {
    const isExcluded = await check(
      store,
      {
        ...request,
        relation: config.excludedBy,
      },
      options,
      depth + 1,
    );
    if (isExcluded) {
      return false;
    }
  }

  return baseResult;
}

/**
 * Base check: steps 1-5 without exclusion or intersection handling.
 */
async function checkBase(
  store: TupleStore,
  request: CheckRequest,
  config: RelationConfig | null,
  options: CheckOptions,
  depth: number,
): Promise<boolean> {
  // Step 1: Direct tuple check
  const directTuple = await store.findDirectTuple(
    request.objectType,
    request.objectId,
    request.relation,
    request.subjectType,
    request.subjectId,
  );
  if (directTuple) {
    if (await evaluateTupleCondition(store, directTuple, request.context)) {
      return true;
    }
  }

  // Step 1b: Wildcard check (e.g., user:*)
  const wildcardTuple = await store.findDirectTuple(
    request.objectType,
    request.objectId,
    request.relation,
    request.subjectType,
    "*",
  );
  if (wildcardTuple) {
    if (await evaluateTupleCondition(store, wildcardTuple, request.context)) {
      return true;
    }
  }

  // Step 2: Userset expansion
  const usersetTuples = await store.findUsersetTuples(
    request.objectType,
    request.objectId,
    request.relation,
  );
  for (const userset of usersetTuples) {
    if (!(await evaluateTupleCondition(store, userset, request.context))) {
      continue;
    }
    // subjectRelation is guaranteed non-null by findUsersetTuples
    const relation = userset.subjectRelation as string;
    const hasRelation = await check(
      store,
      {
        objectType: userset.subjectType,
        objectId: userset.subjectId,
        relation,
        subjectType: request.subjectType,
        subjectId: request.subjectId,
        context: request.context,
      },
      options,
      depth + 1,
    );
    if (hasRelation) {
      return true;
    }
  }

  // Step 3: Relation inheritance (implied_by)
  if (config?.impliedBy) {
    for (const impliedRelation of config.impliedBy) {
      const hasRelation = await check(
        store,
        {
          ...request,
          relation: impliedRelation,
        },
        options,
        depth + 1,
      );
      if (hasRelation) {
        return true;
      }
    }
  }

  // Step 4: Computed userset
  if (config?.computedUserset) {
    const hasRelation = await check(
      store,
      {
        ...request,
        relation: config.computedUserset,
      },
      options,
      depth + 1,
    );
    if (hasRelation) {
      return true;
    }
  }

  // Step 5: Tuple-to-userset
  if (config?.tupleToUserset) {
    const { tupleset, computedUserset } = config.tupleToUserset;
    const linkedTuples = await store.findTuplesByRelation(
      request.objectType,
      request.objectId,
      tupleset,
    );
    for (const linked of linkedTuples) {
      const hasRelation = await check(
        store,
        {
          objectType: linked.subjectType,
          objectId: linked.subjectId,
          relation: computedUserset,
          subjectType: request.subjectType,
          subjectId: request.subjectId,
          context: request.context,
        },
        options,
        depth + 1,
      );
      if (hasRelation) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Intersection check: ALL operands must be true.
 */
async function checkIntersection(
  store: TupleStore,
  request: CheckRequest,
  operands: IntersectionOperand[],
  options: CheckOptions,
  depth: number,
): Promise<boolean> {
  for (const operand of operands) {
    if (operand.type === "computedUserset") {
      const hasRelation = await check(
        store,
        {
          ...request,
          relation: operand.relation,
        },
        options,
        depth + 1,
      );
      if (!hasRelation) {
        return false;
      }
    } else {
      // tupleToUserset operand
      const linkedTuples = await store.findTuplesByRelation(
        request.objectType,
        request.objectId,
        operand.tupleset,
      );
      let found = false;
      for (const linked of linkedTuples) {
        const hasRelation = await check(
          store,
          {
            objectType: linked.subjectType,
            objectId: linked.subjectId,
            relation: operand.computedUserset,
            subjectType: request.subjectType,
            subjectId: request.subjectId,
            context: request.context,
          },
          options,
          depth + 1,
        );
        if (hasRelation) {
          found = true;
          break;
        }
      }
      if (!found) {
        return false;
      }
    }
  }
  return true;
}
