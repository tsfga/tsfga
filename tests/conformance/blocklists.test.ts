import { afterAll, beforeAll, describe, test } from "bun:test";
import type { Kysely } from "kysely";
import { createTsfga, type TsfgaClient } from "src/index.ts";
import { KyselyTupleStore } from "src/store/kysely/adapter.ts";
import type { DB } from "src/store/kysely/schema.ts";
import { expectConformance } from "tests/helpers/conformance.ts";
import {
  beginTransaction,
  destroyDb,
  getDb,
  rollbackTransaction,
} from "tests/helpers/db.ts";
import {
  fgaCreateStore,
  fgaWriteModel,
  fgaWriteTuples,
} from "tests/helpers/openfga.ts";

// Ref: https://openfga.dev/docs/modeling/blocklists

const uuidMap = new Map<string, string>([
  ["becky", "00000000-0000-4000-b600-000000000001"],
  ["carl", "00000000-0000-4000-b600-000000000002"],
  ["dave", "00000000-0000-4000-b600-000000000003"],
  ["engineering", "00000000-0000-4000-b600-000000000004"],
  ["planning", "00000000-0000-4000-b600-000000000005"],
]);

function uuid(name: string): string {
  const id = uuidMap.get(name);
  if (!id) throw new Error(`No UUID for ${name}`);
  return id;
}

describe("Blocklists Conformance", () => {
  let db: Kysely<DB>;
  let storeId: string;
  let authorizationModelId: string;
  let tsfgaClient: TsfgaClient;

  beforeAll(async () => {
    db = getDb();
    await beginTransaction(db);

    const store = new KyselyTupleStore(db);
    tsfgaClient = createTsfga(store);

    // Write relation configs
    await tsfgaClient.writeRelationConfig({
      objectType: "team",
      relation: "member",
      directlyAssignableTypes: ["user"],
      impliedBy: null,
      computedUserset: null,
      tupleToUserset: null,
      excludedBy: null,
      intersection: null,
      allowsUsersetSubjects: false,
    });
    await tsfgaClient.writeRelationConfig({
      objectType: "document",
      relation: "blocked",
      directlyAssignableTypes: ["user"],
      impliedBy: null,
      computedUserset: null,
      tupleToUserset: null,
      excludedBy: null,
      intersection: null,
      allowsUsersetSubjects: false,
    });
    await tsfgaClient.writeRelationConfig({
      objectType: "document",
      relation: "editor",
      directlyAssignableTypes: ["user", "team"],
      impliedBy: null,
      computedUserset: null,
      tupleToUserset: null,
      excludedBy: "blocked",
      intersection: null,
      allowsUsersetSubjects: true,
    });

    // Write tuples
    await tsfgaClient.addTuple({
      objectType: "team",
      objectId: uuid("engineering"),
      relation: "member",
      subjectType: "user",
      subjectId: uuid("becky"),
    });
    await tsfgaClient.addTuple({
      objectType: "team",
      objectId: uuid("engineering"),
      relation: "member",
      subjectType: "user",
      subjectId: uuid("carl"),
    });
    await tsfgaClient.addTuple({
      objectType: "document",
      objectId: uuid("planning"),
      relation: "editor",
      subjectType: "team",
      subjectId: uuid("engineering"),
      subjectRelation: "member",
    });
    await tsfgaClient.addTuple({
      objectType: "document",
      objectId: uuid("planning"),
      relation: "blocked",
      subjectType: "user",
      subjectId: uuid("carl"),
    });

    // Setup OpenFGA
    storeId = await fgaCreateStore("blocklists-conformance");
    authorizationModelId = await fgaWriteModel(
      storeId,
      "tests/conformance/blocklists/model.dsl",
    );
    await fgaWriteTuples(
      storeId,
      "tests/conformance/blocklists/tuples.yaml",
      authorizationModelId,
      uuidMap,
    );
  });

  afterAll(async () => {
    await rollbackTransaction(db);
    await destroyDb();
  });

  test("1: becky is editor of document:planning (in team, not blocked)", async () => {
    await expectConformance(
      storeId,
      authorizationModelId,
      tsfgaClient,
      {
        objectType: "document",
        objectId: uuid("planning"),
        relation: "editor",
        subjectType: "user",
        subjectId: uuid("becky"),
      },
      true,
    );
  });

  test("2: carl is NOT editor of document:planning (in team but blocked)", async () => {
    await expectConformance(
      storeId,
      authorizationModelId,
      tsfgaClient,
      {
        objectType: "document",
        objectId: uuid("planning"),
        relation: "editor",
        subjectType: "user",
        subjectId: uuid("carl"),
      },
      false,
    );
  });

  test("3: carl IS blocked on document:planning", async () => {
    await expectConformance(
      storeId,
      authorizationModelId,
      tsfgaClient,
      {
        objectType: "document",
        objectId: uuid("planning"),
        relation: "blocked",
        subjectType: "user",
        subjectId: uuid("carl"),
      },
      true,
    );
  });

  test("4: becky is NOT blocked on document:planning", async () => {
    await expectConformance(
      storeId,
      authorizationModelId,
      tsfgaClient,
      {
        objectType: "document",
        objectId: uuid("planning"),
        relation: "blocked",
        subjectType: "user",
        subjectId: uuid("becky"),
      },
      false,
    );
  });

  test("5: dave is NOT editor of document:planning (not in team)", async () => {
    await expectConformance(
      storeId,
      authorizationModelId,
      tsfgaClient,
      {
        objectType: "document",
        objectId: uuid("planning"),
        relation: "editor",
        subjectType: "user",
        subjectId: uuid("dave"),
      },
      false,
    );
  });
});
