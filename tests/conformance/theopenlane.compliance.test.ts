import { afterAll, beforeAll, describe, test } from "bun:test";
import type { TsfgaClient } from "@tsfga/core";
import type { DB } from "@tsfga/kysely";
import type { Kysely } from "kysely";
import { expectConformance } from "./helpers/conformance.ts";
import {
  setupTheopenlane,
  teardownTheopenlane,
  uuid,
} from "./theopenlane/setup.ts";

describe("TheOpenLane — Compliance", () => {
  let db: Kysely<DB>;
  let storeId: string;
  let authorizationModelId: string;
  let tsfgaClient: TsfgaClient;

  beforeAll(async () => {
    ({ db, storeId, authorizationModelId, tsfgaClient } =
      await setupTheopenlane());
  });

  afterAll(async () => {
    await teardownTheopenlane(db);
  });

  // --- Group 17: Standard — wildcards & parent ---
  test("84: diana can_view std_iso (user:* wildcard)", async () => {
    await expectConformance(
      storeId,
      authorizationModelId,
      tsfgaClient,
      {
        objectType: "standard",
        objectId: uuid("std_iso"),
        relation: "can_view",
        subjectType: "user",
        subjectId: uuid("diana"),
      },
      true,
    );
  });
  test("85: alice can_edit std_iso (editor direct)", async () => {
    await expectConformance(
      storeId,
      authorizationModelId,
      tsfgaClient,
      {
        objectType: "standard",
        objectId: uuid("std_iso"),
        relation: "can_edit",
        subjectType: "user",
        subjectId: uuid("alice"),
      },
      true,
    );
  });
  test("86: charlie cannot can_edit std_iso", async () => {
    await expectConformance(
      storeId,
      authorizationModelId,
      tsfgaClient,
      {
        objectType: "standard",
        objectId: uuid("std_iso"),
        relation: "can_edit",
        subjectType: "user",
        subjectId: uuid("charlie"),
      },
      false,
    );
  });
  test("87: charlie can_view std_iso (member from parent)", async () => {
    await expectConformance(
      storeId,
      authorizationModelId,
      tsfgaClient,
      {
        objectType: "standard",
        objectId: uuid("std_iso"),
        relation: "can_view",
        subjectType: "user",
        subjectId: uuid("charlie"),
      },
      true,
    );
  });
  test("88: bob can_view std_iso (admin → member → parent_viewer)", async () => {
    await expectConformance(
      storeId,
      authorizationModelId,
      tsfgaClient,
      {
        objectType: "standard",
        objectId: uuid("std_iso"),
        relation: "can_view",
        subjectType: "user",
        subjectId: uuid("bob"),
      },
      true,
    );
  });

  // --- Group 18: Trust center & docs ---
  test("89: charlie can_view tc_acme (parent_viewer)", async () => {
    await expectConformance(
      storeId,
      authorizationModelId,
      tsfgaClient,
      {
        objectType: "trust_center",
        objectId: uuid("tc_acme"),
        relation: "can_view",
        subjectType: "user",
        subjectId: uuid("charlie"),
        context: { email_domain: "acme.com" },
      },
      true,
    );
  });
  test("90: alice can_edit tc_acme (parent_editor)", async () => {
    await expectConformance(
      storeId,
      authorizationModelId,
      tsfgaClient,
      {
        objectType: "trust_center",
        objectId: uuid("tc_acme"),
        relation: "can_edit",
        subjectType: "user",
        subjectId: uuid("alice"),
      },
      true,
    );
  });
  test("91: eve can_edit tc_acme (editor = engineering)", async () => {
    await expectConformance(
      storeId,
      authorizationModelId,
      tsfgaClient,
      {
        objectType: "trust_center",
        objectId: uuid("tc_acme"),
        relation: "can_edit",
        subjectType: "user",
        subjectId: uuid("eve"),
      },
      true,
    );
  });
  test("92: diana cannot can_view tc_acme", async () => {
    await expectConformance(
      storeId,
      authorizationModelId,
      tsfgaClient,
      {
        objectType: "trust_center",
        objectId: uuid("tc_acme"),
        relation: "can_view",
        subjectType: "user",
        subjectId: uuid("diana"),
      },
      false,
    );
  });
  test("93: diana can_view tc_doc_public (wildcard)", async () => {
    await expectConformance(
      storeId,
      authorizationModelId,
      tsfgaClient,
      {
        objectType: "trust_center_doc",
        objectId: uuid("tc_doc_public"),
        relation: "can_view",
        subjectType: "user",
        subjectId: uuid("diana"),
      },
      true,
    );
  });
  test("94: diana cannot can_view tc_doc_private", async () => {
    await expectConformance(
      storeId,
      authorizationModelId,
      tsfgaClient,
      {
        objectType: "trust_center_doc",
        objectId: uuid("tc_doc_private"),
        relation: "can_view",
        subjectType: "user",
        subjectId: uuid("diana"),
      },
      false,
    );
  });
  test("95: eve can_edit tc_doc_public (editor via tc_acme)", async () => {
    await expectConformance(
      storeId,
      authorizationModelId,
      tsfgaClient,
      {
        objectType: "trust_center_doc",
        objectId: uuid("tc_doc_public"),
        relation: "can_edit",
        subjectType: "user",
        subjectId: uuid("eve"),
      },
      true,
    );
  });
  test("96: alice can_delete tc_doc_public (parent_deleter chain)", async () => {
    await expectConformance(
      storeId,
      authorizationModelId,
      tsfgaClient,
      {
        objectType: "trust_center_doc",
        objectId: uuid("tc_doc_public"),
        relation: "can_delete",
        subjectType: "user",
        subjectId: uuid("alice"),
      },
      true,
    );
  });

  // --- Group 19: Export — system ---
  test("97: svc_api can_edit export (service direct)", async () => {
    await expectConformance(
      storeId,
      authorizationModelId,
      tsfgaClient,
      {
        objectType: "export",
        objectId: uuid("export_data"),
        relation: "can_edit",
        subjectType: "service",
        subjectId: uuid("svc_api"),
      },
      true,
    );
  });
  test("98: alice can_delete export (system_admin from system)", async () => {
    await expectConformance(
      storeId,
      authorizationModelId,
      tsfgaClient,
      {
        objectType: "export",
        objectId: uuid("export_data"),
        relation: "can_delete",
        subjectType: "user",
        subjectId: uuid("alice"),
      },
      true,
    );
  });
  test("99: bob cannot can_edit export", async () => {
    await expectConformance(
      storeId,
      authorizationModelId,
      tsfgaClient,
      {
        objectType: "export",
        objectId: uuid("export_data"),
        relation: "can_edit",
        subjectType: "user",
        subjectId: uuid("bob"),
      },
      false,
    );
  });

  // --- Group 20: Workflow instance ---
  test("100: svc_api can_view wf_instance (service direct)", async () => {
    await expectConformance(
      storeId,
      authorizationModelId,
      tsfgaClient,
      {
        objectType: "workflow_instance",
        objectId: uuid("wf_instance"),
        relation: "can_view",
        subjectType: "service",
        subjectId: uuid("svc_api"),
      },
      true,
    );
  });
  test("101: bob can_view wf_instance (viewer from parent wf_def)", async () => {
    await expectConformance(
      storeId,
      authorizationModelId,
      tsfgaClient,
      {
        objectType: "workflow_instance",
        objectId: uuid("wf_instance"),
        relation: "can_view",
        subjectType: "user",
        subjectId: uuid("bob"),
      },
      true,
    );
  });
  test("102: diana cannot can_view wf_instance", async () => {
    await expectConformance(
      storeId,
      authorizationModelId,
      tsfgaClient,
      {
        objectType: "workflow_instance",
        objectId: uuid("wf_instance"),
        relation: "can_view",
        subjectType: "user",
        subjectId: uuid("diana"),
      },
      false,
    );
  });
  test("103: frank cannot can_view wf_instance", async () => {
    await expectConformance(
      storeId,
      authorizationModelId,
      tsfgaClient,
      {
        objectType: "workflow_instance",
        objectId: uuid("wf_instance"),
        relation: "can_view",
        subjectType: "user",
        subjectId: uuid("frank"),
      },
      false,
    );
  });

  // --- Group 21: Assessment ---
  test("104: grace can_edit assessment (owner)", async () => {
    await expectConformance(
      storeId,
      authorizationModelId,
      tsfgaClient,
      {
        objectType: "assessment",
        objectId: uuid("assess_q1"),
        relation: "can_edit",
        subjectType: "user",
        subjectId: uuid("grace"),
      },
      true,
    );
  });
  test("105: eve can_edit assessment (delegate)", async () => {
    await expectConformance(
      storeId,
      authorizationModelId,
      tsfgaClient,
      {
        objectType: "assessment",
        objectId: uuid("assess_q1"),
        relation: "can_edit",
        subjectType: "user",
        subjectId: uuid("eve"),
      },
      true,
    );
  });
  test("106: frank cannot can_view assessment (blocked)", async () => {
    await expectConformance(
      storeId,
      authorizationModelId,
      tsfgaClient,
      {
        objectType: "assessment",
        objectId: uuid("assess_q1"),
        relation: "can_view",
        subjectType: "user",
        subjectId: uuid("frank"),
      },
      false,
    );
  });
  test("107: alice can_view assessment (owner from parent)", async () => {
    await expectConformance(
      storeId,
      authorizationModelId,
      tsfgaClient,
      {
        objectType: "assessment",
        objectId: uuid("assess_q1"),
        relation: "can_view",
        subjectType: "user",
        subjectId: uuid("alice"),
      },
      true,
    );
  });
  test("108: diana cannot can_view assessment", async () => {
    await expectConformance(
      storeId,
      authorizationModelId,
      tsfgaClient,
      {
        objectType: "assessment",
        objectId: uuid("assess_q1"),
        relation: "can_view",
        subjectType: "user",
        subjectId: uuid("diana"),
      },
      false,
    );
  });

  // --- Group 22: Campaign ---
  test("109: eve can_edit campaign (editor, not blocked)", async () => {
    await expectConformance(
      storeId,
      authorizationModelId,
      tsfgaClient,
      {
        objectType: "campaign",
        objectId: uuid("camp_onboard"),
        relation: "can_edit",
        subjectType: "user",
        subjectId: uuid("eve"),
      },
      true,
    );
  });
  test("110: frank cannot can_edit campaign (blocked)", async () => {
    await expectConformance(
      storeId,
      authorizationModelId,
      tsfgaClient,
      {
        objectType: "campaign",
        objectId: uuid("camp_onboard"),
        relation: "can_edit",
        subjectType: "user",
        subjectId: uuid("frank"),
      },
      false,
    );
  });
  test("111: alice can_view campaign (org owner chain)", async () => {
    await expectConformance(
      storeId,
      authorizationModelId,
      tsfgaClient,
      {
        objectType: "campaign",
        objectId: uuid("camp_onboard"),
        relation: "can_view",
        subjectType: "user",
        subjectId: uuid("alice"),
      },
      true,
    );
  });
});
