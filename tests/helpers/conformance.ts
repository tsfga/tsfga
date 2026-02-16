import { expect } from "bun:test";
import type { CheckRequest } from "src/core/types.ts";
import type { TsfgaClient } from "src/index.ts";
import { fgaCheck } from "tests/helpers/openfga.ts";

/**
 * Assert that tsfga and OpenFGA return the same result for a permission check.
 * Runs both checks in parallel for speed.
 */
export async function expectConformance(
  storeId: string,
  authorizationModelId: string,
  tsfgaClient: TsfgaClient,
  params: CheckRequest,
  expected: boolean,
): Promise<void> {
  const contextualTuples = params.contextualTuples?.map((t) => ({
    user: t.subjectRelation
      ? `${t.subjectType}:${t.subjectId}#${t.subjectRelation}`
      : `${t.subjectType}:${t.subjectId}`,
    relation: t.relation,
    object: `${t.objectType}:${t.objectId}`,
  }));

  const [tsfgaResult, openFgaResult] = await Promise.all([
    tsfgaClient.check(params),
    fgaCheck(storeId, authorizationModelId, {
      objectType: params.objectType,
      objectId: params.objectId,
      relation: params.relation,
      subjectType: params.subjectType,
      subjectId: params.subjectId,
      context: params.context,
      contextualTuples,
    }),
  ]);

  if (openFgaResult === null) {
    throw new Error("OpenFGA returned an error");
  }

  // Both systems must agree
  expect(tsfgaResult).toBe(openFgaResult);
  // And match expected value
  expect(tsfgaResult).toBe(expected);
}
