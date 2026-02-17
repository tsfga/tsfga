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

describe("TheOpenLane — Programs", () => {
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

  // --- Group 9: Program — intersection & exclusion ---
  test("42: grace can_edit prog (admin: user ∩ member from parent)", async () => {
    await expectConformance(
      storeId,
      authorizationModelId,
      tsfgaClient,
      {
        objectType: "program",
        objectId: uuid("prog_compliance"),
        relation: "can_edit",
        subjectType: "user",
        subjectId: uuid("grace"),
      },
      true,
    );
  });
  test("43: eve can_edit prog (editor, not blocked)", async () => {
    await expectConformance(
      storeId,
      authorizationModelId,
      tsfgaClient,
      {
        objectType: "program",
        objectId: uuid("prog_compliance"),
        relation: "can_edit",
        subjectType: "user",
        subjectId: uuid("eve"),
      },
      true,
    );
  });
  test("44: frank cannot can_edit prog (blocked)", async () => {
    await expectConformance(
      storeId,
      authorizationModelId,
      tsfgaClient,
      {
        objectType: "program",
        objectId: uuid("prog_compliance"),
        relation: "can_edit",
        subjectType: "user",
        subjectId: uuid("frank"),
      },
      false,
    );
  });
  test("45: frank cannot can_view prog (blocked)", async () => {
    await expectConformance(
      storeId,
      authorizationModelId,
      tsfgaClient,
      {
        objectType: "program",
        objectId: uuid("prog_compliance"),
        relation: "can_view",
        subjectType: "user",
        subjectId: uuid("frank"),
      },
      false,
    );
  });
  test("46: alice can_view prog (parent_viewer: owner from parent)", async () => {
    await expectConformance(
      storeId,
      authorizationModelId,
      tsfgaClient,
      {
        objectType: "program",
        objectId: uuid("prog_compliance"),
        relation: "can_view",
        subjectType: "user",
        subjectId: uuid("alice"),
      },
      true,
    );
  });
  test("47: charlie cannot can_view prog (not member/editor)", async () => {
    await expectConformance(
      storeId,
      authorizationModelId,
      tsfgaClient,
      {
        objectType: "program",
        objectId: uuid("prog_compliance"),
        relation: "can_view",
        subjectType: "user",
        subjectId: uuid("charlie"),
      },
      false,
    );
  });
  test("48: svc_api can_edit prog (service direct)", async () => {
    await expectConformance(
      storeId,
      authorizationModelId,
      tsfgaClient,
      {
        objectType: "program",
        objectId: uuid("prog_compliance"),
        relation: "can_edit",
        subjectType: "service",
        subjectId: uuid("svc_api"),
      },
      true,
    );
  });
  test("49: grace audit_log_viewer prog (admin ∩ can_view)", async () => {
    await expectConformance(
      storeId,
      authorizationModelId,
      tsfgaClient,
      {
        objectType: "program",
        objectId: uuid("prog_compliance"),
        relation: "audit_log_viewer",
        subjectType: "user",
        subjectId: uuid("grace"),
      },
      true,
    );
  });

  // --- Group 10: Control — owner/delegate/system ---
  test("50: eve can_edit ctrl (engineering owner)", async () => {
    await expectConformance(
      storeId,
      authorizationModelId,
      tsfgaClient,
      {
        objectType: "control",
        objectId: uuid("ctrl_soc2"),
        relation: "can_edit",
        subjectType: "user",
        subjectId: uuid("eve"),
      },
      true,
    );
  });
  test("51: henry can_edit ctrl (auditors delegate)", async () => {
    await expectConformance(
      storeId,
      authorizationModelId,
      tsfgaClient,
      {
        objectType: "control",
        objectId: uuid("ctrl_soc2"),
        relation: "can_edit",
        subjectType: "user",
        subjectId: uuid("henry"),
      },
      true,
    );
  });
  test("52: eve can_delete ctrl (owner)", async () => {
    await expectConformance(
      storeId,
      authorizationModelId,
      tsfgaClient,
      {
        objectType: "control",
        objectId: uuid("ctrl_soc2"),
        relation: "can_delete",
        subjectType: "user",
        subjectId: uuid("eve"),
      },
      true,
    );
  });
  test("53: henry cannot can_delete ctrl (delegate only)", async () => {
    await expectConformance(
      storeId,
      authorizationModelId,
      tsfgaClient,
      {
        objectType: "control",
        objectId: uuid("ctrl_soc2"),
        relation: "can_delete",
        subjectType: "user",
        subjectId: uuid("henry"),
      },
      false,
    );
  });
  test("54: alice can_edit ctrl (system_admin from system)", async () => {
    await expectConformance(
      storeId,
      authorizationModelId,
      tsfgaClient,
      {
        objectType: "control",
        objectId: uuid("ctrl_soc2"),
        relation: "can_edit",
        subjectType: "user",
        subjectId: uuid("alice"),
      },
      true,
    );
  });
  test("55: diana cannot can_view ctrl", async () => {
    await expectConformance(
      storeId,
      authorizationModelId,
      tsfgaClient,
      {
        objectType: "control",
        objectId: uuid("ctrl_soc2"),
        relation: "can_view",
        subjectType: "user",
        subjectId: uuid("diana"),
      },
      false,
    );
  });
  test("56: alice audit_log_viewer ctrl", async () => {
    await expectConformance(
      storeId,
      authorizationModelId,
      tsfgaClient,
      {
        objectType: "control",
        objectId: uuid("ctrl_soc2"),
        relation: "audit_log_viewer",
        subjectType: "user",
        subjectId: uuid("alice"),
        context: { email_domain: "acme.com" },
      },
      true,
    );
  });
  test("57: alice can_delete ctrl (system_admin)", async () => {
    await expectConformance(
      storeId,
      authorizationModelId,
      tsfgaClient,
      {
        objectType: "control",
        objectId: uuid("ctrl_soc2"),
        relation: "can_delete",
        subjectType: "user",
        subjectId: uuid("alice"),
      },
      true,
    );
  });

  // --- Group 11: Subcontrol — parent chain ---
  test("58: eve can_view sub_access (parent ctrl chain)", async () => {
    await expectConformance(
      storeId,
      authorizationModelId,
      tsfgaClient,
      {
        objectType: "subcontrol",
        objectId: uuid("sub_access"),
        relation: "can_view",
        subjectType: "user",
        subjectId: uuid("eve"),
      },
      true,
    );
  });
  test("59: diana cannot can_view sub_access", async () => {
    await expectConformance(
      storeId,
      authorizationModelId,
      tsfgaClient,
      {
        objectType: "subcontrol",
        objectId: uuid("sub_access"),
        relation: "can_view",
        subjectType: "user",
        subjectId: uuid("diana"),
      },
      false,
    );
  });
  test("60: alice can_edit sub_access (system_admin chain)", async () => {
    await expectConformance(
      storeId,
      authorizationModelId,
      tsfgaClient,
      {
        objectType: "subcontrol",
        objectId: uuid("sub_access"),
        relation: "can_edit",
        subjectType: "user",
        subjectId: uuid("alice"),
      },
      true,
    );
  });

  // --- Group 12: Internal policy ---
  test("61: alice can_edit policy (admin)", async () => {
    await expectConformance(
      storeId,
      authorizationModelId,
      tsfgaClient,
      {
        objectType: "internal_policy",
        objectId: uuid("policy_data"),
        relation: "can_edit",
        subjectType: "user",
        subjectId: uuid("alice"),
      },
      true,
    );
  });
  test("62: eve can_edit policy (editor, not blocked)", async () => {
    await expectConformance(
      storeId,
      authorizationModelId,
      tsfgaClient,
      {
        objectType: "internal_policy",
        objectId: uuid("policy_data"),
        relation: "can_edit",
        subjectType: "user",
        subjectId: uuid("eve"),
      },
      true,
    );
  });
  test("63: henry can_view policy (approver → can_edit)", async () => {
    await expectConformance(
      storeId,
      authorizationModelId,
      tsfgaClient,
      {
        objectType: "internal_policy",
        objectId: uuid("policy_data"),
        relation: "can_view",
        subjectType: "user",
        subjectId: uuid("henry"),
      },
      true,
    );
  });
  test("64: frank cannot can_view policy (blocked)", async () => {
    await expectConformance(
      storeId,
      authorizationModelId,
      tsfgaClient,
      {
        objectType: "internal_policy",
        objectId: uuid("policy_data"),
        relation: "can_view",
        subjectType: "user",
        subjectId: uuid("frank"),
      },
      false,
    );
  });
  test("65: alice can_delete policy (admin)", async () => {
    await expectConformance(
      storeId,
      authorizationModelId,
      tsfgaClient,
      {
        objectType: "internal_policy",
        objectId: uuid("policy_data"),
        relation: "can_delete",
        subjectType: "user",
        subjectId: uuid("alice"),
      },
      true,
    );
  });

  // --- Group 13: Contact — intersection ---
  test("66: alice can_view contact (direct ∩ member from parent)", async () => {
    await expectConformance(
      storeId,
      authorizationModelId,
      tsfgaClient,
      {
        objectType: "contact",
        objectId: uuid("contact_vendor"),
        relation: "can_view",
        subjectType: "user",
        subjectId: uuid("alice"),
        context: { email_domain: "acme.com" },
      },
      true,
    );
  });
  test("67: bob can_view contact (direct ∩ member from parent)", async () => {
    await expectConformance(
      storeId,
      authorizationModelId,
      tsfgaClient,
      {
        objectType: "contact",
        objectId: uuid("contact_vendor"),
        relation: "can_view",
        subjectType: "user",
        subjectId: uuid("bob"),
        context: { email_domain: "acme.com" },
      },
      true,
    );
  });
  test("68: diana cannot can_view contact (not member)", async () => {
    await expectConformance(
      storeId,
      authorizationModelId,
      tsfgaClient,
      {
        objectType: "contact",
        objectId: uuid("contact_vendor"),
        relation: "can_view",
        subjectType: "user",
        subjectId: uuid("diana"),
      },
      false,
    );
  });
  test("69: eve can_view contact (editor, not blocked)", async () => {
    await expectConformance(
      storeId,
      authorizationModelId,
      tsfgaClient,
      {
        objectType: "contact",
        objectId: uuid("contact_vendor"),
        relation: "can_view",
        subjectType: "user",
        subjectId: uuid("eve"),
        context: { email_domain: "acme.com" },
      },
      true,
    );
  });
  test("70: frank cannot can_view contact (blocked)", async () => {
    await expectConformance(
      storeId,
      authorizationModelId,
      tsfgaClient,
      {
        objectType: "contact",
        objectId: uuid("contact_vendor"),
        relation: "can_view",
        subjectType: "user",
        subjectId: uuid("frank"),
        context: { email_domain: "acme.com" },
      },
      false,
    );
  });
  test("71: charlie cannot can_edit contact (no direct tuple)", async () => {
    await expectConformance(
      storeId,
      authorizationModelId,
      tsfgaClient,
      {
        objectType: "contact",
        objectId: uuid("contact_vendor"),
        relation: "can_edit",
        subjectType: "user",
        subjectId: uuid("charlie"),
        context: { email_domain: "acme.com" },
      },
      false,
    );
  });

  // --- Group 14: Task ---
  test("72: eve can_edit task (assignee)", async () => {
    await expectConformance(
      storeId,
      authorizationModelId,
      tsfgaClient,
      {
        objectType: "task",
        objectId: uuid("task_review"),
        relation: "can_edit",
        subjectType: "user",
        subjectId: uuid("eve"),
      },
      true,
    );
  });
  test("73: grace can_delete task (assigner)", async () => {
    await expectConformance(
      storeId,
      authorizationModelId,
      tsfgaClient,
      {
        objectType: "task",
        objectId: uuid("task_review"),
        relation: "can_delete",
        subjectType: "user",
        subjectId: uuid("grace"),
      },
      true,
    );
  });
  test("74: alice can_view task (viewer from parent chain)", async () => {
    await expectConformance(
      storeId,
      authorizationModelId,
      tsfgaClient,
      {
        objectType: "task",
        objectId: uuid("task_review"),
        relation: "can_view",
        subjectType: "user",
        subjectId: uuid("alice"),
      },
      true,
    );
  });
  test("75: diana cannot can_edit task", async () => {
    await expectConformance(
      storeId,
      authorizationModelId,
      tsfgaClient,
      {
        objectType: "task",
        objectId: uuid("task_review"),
        relation: "can_edit",
        subjectType: "user",
        subjectId: uuid("diana"),
      },
      false,
    );
  });

  // --- Group 15: Note ---
  test("76: grace can_edit note (owner)", async () => {
    await expectConformance(
      storeId,
      authorizationModelId,
      tsfgaClient,
      {
        objectType: "note",
        objectId: uuid("note_ctrl"),
        relation: "can_edit",
        subjectType: "user",
        subjectId: uuid("grace"),
      },
      true,
    );
  });
  test("77: alice can_view note (can_view from parent chain)", async () => {
    await expectConformance(
      storeId,
      authorizationModelId,
      tsfgaClient,
      {
        objectType: "note",
        objectId: uuid("note_ctrl"),
        relation: "can_view",
        subjectType: "user",
        subjectId: uuid("alice"),
      },
      true,
    );
  });
  test("78: diana cannot can_edit note", async () => {
    await expectConformance(
      storeId,
      authorizationModelId,
      tsfgaClient,
      {
        objectType: "note",
        objectId: uuid("note_ctrl"),
        relation: "can_edit",
        subjectType: "user",
        subjectId: uuid("diana"),
      },
      false,
    );
  });

  // --- Group 16: Evidence — nested exclusion ---
  test("79: eve can_view evidence (editor, not blocked)", async () => {
    await expectConformance(
      storeId,
      authorizationModelId,
      tsfgaClient,
      {
        objectType: "evidence",
        objectId: uuid("evidence_doc"),
        relation: "can_view",
        subjectType: "user",
        subjectId: uuid("eve"),
      },
      true,
    );
  });
  test("80: frank cannot can_view evidence (blocked)", async () => {
    await expectConformance(
      storeId,
      authorizationModelId,
      tsfgaClient,
      {
        objectType: "evidence",
        objectId: uuid("evidence_doc"),
        relation: "can_view",
        subjectType: "user",
        subjectId: uuid("frank"),
      },
      false,
    );
  });
  test("81: alice can_edit evidence (org owner → editor)", async () => {
    await expectConformance(
      storeId,
      authorizationModelId,
      tsfgaClient,
      {
        objectType: "evidence",
        objectId: uuid("evidence_doc"),
        relation: "can_edit",
        subjectType: "user",
        subjectId: uuid("alice"),
      },
      true,
    );
  });
  test("82: grace can_view evidence (can_view from parent prog)", async () => {
    await expectConformance(
      storeId,
      authorizationModelId,
      tsfgaClient,
      {
        objectType: "evidence",
        objectId: uuid("evidence_doc"),
        relation: "can_view",
        subjectType: "user",
        subjectId: uuid("grace"),
      },
      true,
    );
  });
  test("83: diana cannot can_view evidence", async () => {
    await expectConformance(
      storeId,
      authorizationModelId,
      tsfgaClient,
      {
        objectType: "evidence",
        objectId: uuid("evidence_doc"),
        relation: "can_view",
        subjectType: "user",
        subjectId: uuid("diana"),
      },
      false,
    );
  });
});
