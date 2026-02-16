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

// Ref: https://openfga.dev/docs/modeling/roles-and-permissions

const uuidMap = new Map<string, string>([
  ["alice", "00000000-0000-4000-b200-000000000001"],
  ["bob", "00000000-0000-4000-b200-000000000002"],
  ["europe", "00000000-0000-4000-b200-000000000003"],
]);

function uuid(name: string): string {
  const id = uuidMap.get(name);
  if (!id) throw new Error(`No UUID for ${name}`);
  return id;
}

describe("Roles and Permissions Conformance", () => {
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
      objectType: "trip",
      relation: "owner",
      directlyAssignableTypes: ["user"],
      impliedBy: null,
      computedUserset: null,
      tupleToUserset: null,
      excludedBy: null,
      intersection: null,
      allowsUsersetSubjects: false,
    });
    await tsfgaClient.writeRelationConfig({
      objectType: "trip",
      relation: "viewer",
      directlyAssignableTypes: ["user"],
      impliedBy: null,
      computedUserset: null,
      tupleToUserset: null,
      excludedBy: null,
      intersection: null,
      allowsUsersetSubjects: false,
    });
    await tsfgaClient.writeRelationConfig({
      objectType: "trip",
      relation: "booking_adder",
      directlyAssignableTypes: null,
      impliedBy: null,
      computedUserset: "owner",
      tupleToUserset: null,
      excludedBy: null,
      intersection: null,
      allowsUsersetSubjects: false,
    });
    await tsfgaClient.writeRelationConfig({
      objectType: "trip",
      relation: "booking_viewer",
      directlyAssignableTypes: null,
      impliedBy: ["viewer", "owner"],
      computedUserset: null,
      tupleToUserset: null,
      excludedBy: null,
      intersection: null,
      allowsUsersetSubjects: false,
    });

    // Write tuples
    await tsfgaClient.addTuple({
      objectType: "trip",
      objectId: uuid("europe"),
      relation: "viewer",
      subjectType: "user",
      subjectId: uuid("bob"),
    });
    await tsfgaClient.addTuple({
      objectType: "trip",
      objectId: uuid("europe"),
      relation: "owner",
      subjectType: "user",
      subjectId: uuid("alice"),
    });

    // Setup OpenFGA
    storeId = await fgaCreateStore("roles-and-permissions-conformance");
    authorizationModelId = await fgaWriteModel(
      storeId,
      "tests/conformance/roles-and-permissions/model.dsl",
    );
    await fgaWriteTuples(
      storeId,
      "tests/conformance/roles-and-permissions/tuples.yaml",
      authorizationModelId,
      uuidMap,
    );
  });

  afterAll(async () => {
    await rollbackTransaction(db);
    await destroyDb();
  });

  test("1: bob is viewer of trip:europe", async () => {
    await expectConformance(
      storeId,
      authorizationModelId,
      tsfgaClient,
      {
        objectType: "trip",
        objectId: uuid("europe"),
        relation: "viewer",
        subjectType: "user",
        subjectId: uuid("bob"),
      },
      true,
    );
  });

  test("2: alice is owner of trip:europe", async () => {
    await expectConformance(
      storeId,
      authorizationModelId,
      tsfgaClient,
      {
        objectType: "trip",
        objectId: uuid("europe"),
        relation: "owner",
        subjectType: "user",
        subjectId: uuid("alice"),
      },
      true,
    );
  });

  test("3: bob is booking_viewer (viewer implies booking_viewer)", async () => {
    await expectConformance(
      storeId,
      authorizationModelId,
      tsfgaClient,
      {
        objectType: "trip",
        objectId: uuid("europe"),
        relation: "booking_viewer",
        subjectType: "user",
        subjectId: uuid("bob"),
      },
      true,
    );
  });

  test("4: bob is NOT booking_adder (not owner)", async () => {
    await expectConformance(
      storeId,
      authorizationModelId,
      tsfgaClient,
      {
        objectType: "trip",
        objectId: uuid("europe"),
        relation: "booking_adder",
        subjectType: "user",
        subjectId: uuid("bob"),
      },
      false,
    );
  });

  test("5: alice is booking_viewer (owner implies booking_viewer)", async () => {
    await expectConformance(
      storeId,
      authorizationModelId,
      tsfgaClient,
      {
        objectType: "trip",
        objectId: uuid("europe"),
        relation: "booking_viewer",
        subjectType: "user",
        subjectId: uuid("alice"),
      },
      true,
    );
  });

  test("6: alice is booking_adder (computed userset -> owner)", async () => {
    await expectConformance(
      storeId,
      authorizationModelId,
      tsfgaClient,
      {
        objectType: "trip",
        objectId: uuid("europe"),
        relation: "booking_adder",
        subjectType: "user",
        subjectId: uuid("alice"),
      },
      true,
    );
  });
});
