import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { afterAll, beforeAll, describe, it } from "https://deno.land/std@0.224.0/testing/bdd.ts";
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const service = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

type TestUser = {
  id: string;
  email: string;
  password: string;
  tenantId: string;
};

type TestContext = {
  tenantAId: string;
  tenantBId: string;
  templateAId: string;
  templateBId: string;
  runAId: string;
  runBId: string;
  caseAId: string;
  caseBId: string;
  breakAId: string;
  breakBId: string;
  auditEventId: string | null;
  users: {
    adminA: TestUser;
    analystA: TestUser;
    controllerA: TestUser;
    viewerA: TestUser;
    outsiderAdminB: TestUser;
  };
};

const ctx = {} as TestContext;
const authUserIds: string[] = [];
const trackedCaseIds = new Set<string>();
const trackedBreakDetailIds = new Set<string>();

function createBrowserClient() {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function uniqueEmail(label: string) {
  return `rls-${label}-${crypto.randomUUID()}@arkheos.test`;
}

async function createTenant(name: string, slugPrefix: string) {
  const id = crypto.randomUUID();
  const { error } = await service.from("tenants").insert({
    id,
    name,
    slug: `${slugPrefix}-${crypto.randomUUID().slice(0, 8)}`,
    settings: {},
  });

  if (error) throw error;
  return id;
}

async function createUser(label: string, tenantId: string, role?: string): Promise<TestUser> {
  const email = uniqueEmail(label);
  const password = `ArkheOS!${crypto.randomUUID()}Aa1`;

  const { data, error } = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: label },
  });

  if (error || !data.user) throw error ?? new Error("No user returned");

  authUserIds.push(data.user.id);

  const { error: profileError } = await service.from("profiles").upsert({
    id: data.user.id,
    tenant_id: tenantId,
    email,
    full_name: label,
    scopes: {},
    is_active: true,
  });

  if (profileError) throw profileError;

  if (role) {
    const { error: roleError } = await service.from("user_roles").insert({
      user_id: data.user.id,
      role,
    });

    if (roleError) throw roleError;
  }

  return { id: data.user.id, email, password, tenantId };
}

async function signIn(user: TestUser) {
  const client = createBrowserClient();
  const { error } = await client.auth.signInWithPassword({
    email: user.email,
    password: user.password,
  });

  if (error) throw error;
  return client;
}

async function createTemplate(tenantId: string, name: string) {
  const id = crypto.randomUUID();
  const { error } = await service.from("reconciliation_templates").insert({
    id,
    tenant_id: tenantId,
    name,
    template_type: "cashflow_recon",
    side_a_source: "erp",
    side_a_dataset: "ap",
    side_b_source: "etrm",
    side_b_dataset: "settlements",
    filters: {},
    cutoff_rules: {},
    is_active: true,
    template_status: "active",
    tags: ["rls-test"],
  });

  if (error) throw error;
  return id;
}

async function createRun(tenantId: string, templateId: string) {
  const id = crypto.randomUUID();

  const { error: reconRunError } = await service.from("recon_runs").insert({
    id,
    tenant_id: tenantId,
    period_start: "2026-04-01",
    period_end: "2026-04-30",
    source_a_name: "ERP",
    source_b_name: "ETRM",
    status: "pending",
    ruleset_version: "test-1.0.0",
    model_version: "gemini-3-flash",
    metrics: {},
  });

  if (reconRunError) throw reconRunError;

  const { error } = await service.from("reconciliation_runs").insert({
    id,
    tenant_id: tenantId,
    template_id: templateId,
    status: "completed",
    period_start: "2026-04-01",
    period_end: "2026-04-30",
    metrics: {},
    side_a_batch_ids: [],
    side_b_batch_ids: [],
  });

  if (error) throw error;
  return id;
}

async function createExceptionCase(tenantId: string, runId: string) {
  const id = crypto.randomUUID();
  trackedCaseIds.add(id);

  const { error } = await service.from("exception_cases").insert({
    id,
    tenant_id: tenantId,
    run_id: runId,
    exception_type: "amount_mismatch",
    status: "open",
    severity: "medium",
    summary: "RLS regression fixture",
    evidence: {},
    recommended_actions: [],
    related_entities: [],
    module: "reconciliations",
    case_ref: `CASE-${id.slice(0, 8)}`,
  });

  if (error) throw error;
  return id;
}

async function createBreakDetail(params: {
  tenantId: string;
  runId: string;
  exceptionCaseId: string;
  docId: string;
  docType?: string;
}) {
  const breakDetailId = crypto.randomUUID();
  trackedBreakDetailIds.add(breakDetailId);

  const { error } = await service.from("break_details").insert({
    break_detail_id: breakDetailId,
    tenant_id: params.tenantId,
    exception_case_id: params.exceptionCaseId,
    run_id: params.runId,
    doc_id: params.docId,
    doc_type: params.docType ?? "invoice",
    side_a_amount: 1250.25,
    side_b_amount: 1200.25,
    side_a_date: "2026-04-01",
    side_b_date: "2026-04-03",
    currency: "USD",
    break_category: "amount_mismatch",
    suggested_root_cause: "Fixture root cause",
    ai_confidence: 0.912,
  });

  if (error) throw error;
  return breakDetailId;
}

beforeAll(async () => {
  ctx.tenantAId = await createTenant("RLS Tenant A", "rls-a");
  ctx.tenantBId = await createTenant("RLS Tenant B", "rls-b");

  ctx.users = {
    adminA: await createUser("admin-a", ctx.tenantAId, "admin"),
    analystA: await createUser("analyst-a", ctx.tenantAId, "reconciliation_analyst"),
    controllerA: await createUser("controller-a", ctx.tenantAId, "controller"),
    viewerA: await createUser("viewer-a", ctx.tenantAId),
    outsiderAdminB: await createUser("admin-b", ctx.tenantBId, "admin"),
  };

  ctx.templateAId = await createTemplate(ctx.tenantAId, "RLS Template A");
  ctx.templateBId = await createTemplate(ctx.tenantBId, "RLS Template B");
  ctx.runAId = await createRun(ctx.tenantAId, ctx.templateAId);
  ctx.runBId = await createRun(ctx.tenantBId, ctx.templateBId);
  ctx.caseAId = await createExceptionCase(ctx.tenantAId, ctx.runAId);
  ctx.caseBId = await createExceptionCase(ctx.tenantBId, ctx.runBId);
  ctx.breakAId = await createBreakDetail({
    tenantId: ctx.tenantAId,
    runId: ctx.runAId,
    exceptionCaseId: ctx.caseAId,
    docId: "DOC-A-001",
  });
  ctx.breakBId = await createBreakDetail({
    tenantId: ctx.tenantBId,
    runId: ctx.runBId,
    exceptionCaseId: ctx.caseBId,
    docId: "DOC-B-001",
  });

  const { error: linkAError } = await service.from("document_trade_links").insert({
    tenant_id: ctx.tenantAId,
    doc_id: "DOC-A-001",
    doc_type: "invoice",
    deal_id: "DEAL-A-001",
    allocation_amount: 1250.25,
    allocation_pct: 100,
    link_source: "system",
    ai_confidence: 0.95,
    created_by: ctx.users.adminA.id,
  });

  if (linkAError) throw linkAError;

  const { error: linkBError } = await service.from("document_trade_links").insert({
    tenant_id: ctx.tenantBId,
    doc_id: "DOC-B-001",
    doc_type: "invoice",
    deal_id: "DEAL-B-001",
    allocation_amount: 1200.25,
    allocation_pct: 100,
    link_source: "system",
    ai_confidence: 0.95,
    created_by: ctx.users.outsiderAdminB.id,
  });

  if (linkBError) throw linkBError;

  const { error: refreshError } = await service.rpc("refresh_drill_mvs", { p_run_id: ctx.runAId });
  if (refreshError) throw refreshError;
});

afterAll(async () => {
  await service.from("drill_audit_events").delete().in("tenant_id", [ctx.tenantAId, ctx.tenantBId]);
  await service.from("document_trade_links").delete().in("tenant_id", [ctx.tenantAId, ctx.tenantBId]);

  if (trackedBreakDetailIds.size > 0) {
    await service.from("break_details").delete().in("break_detail_id", [...trackedBreakDetailIds]);
  }

  if (trackedCaseIds.size > 0) {
    await service.from("exception_cases").delete().in("id", [...trackedCaseIds]);
  }

  await service.from("reconciliation_runs").delete().in("id", [ctx.runAId, ctx.runBId]);
  await service.from("recon_runs").delete().in("id", [ctx.runAId, ctx.runBId]);
  await service.from("reconciliation_templates").delete().in("id", [ctx.templateAId, ctx.templateBId]);
  await service.from("user_roles").delete().in("user_id", authUserIds);
  await service.from("profiles").delete().in("id", authUserIds);
  await service.from("tenants").delete().in("id", [ctx.tenantAId, ctx.tenantBId]);

  for (const userId of authUserIds) {
    await service.auth.admin.deleteUser(userId);
  }
});

describe("drill-down RLS regression suite", () => {
  it("keeps break_details and document_trade_links tenant-scoped on reads", async () => {
    const viewerClient = await signIn(ctx.users.viewerA);
    const outsiderClient = await signIn(ctx.users.outsiderAdminB);

    const { data: viewerBreaks, error: viewerBreakError } = await viewerClient
      .from("break_details")
      .select("break_detail_id, tenant_id, doc_id")
      .order("doc_id");

    assertEquals(viewerBreakError, null);
    assertEquals(viewerBreaks?.length, 1);
    assertEquals(viewerBreaks?.[0].tenant_id, ctx.tenantAId);
    assertEquals(viewerBreaks?.[0].doc_id, "DOC-A-001");

    const { data: viewerLinks, error: viewerLinkError } = await viewerClient
      .from("document_trade_links")
      .select("tenant_id, doc_id, deal_id")
      .order("deal_id");

    assertEquals(viewerLinkError, null);
    assertEquals(viewerLinks?.length, 1);
    assertEquals(viewerLinks?.[0].tenant_id, ctx.tenantAId);
    assertEquals(viewerLinks?.[0].deal_id, "DEAL-A-001");

    const { data: outsiderBreaks, error: outsiderBreakError } = await outsiderClient
      .from("break_details")
      .select("tenant_id, doc_id")
      .order("doc_id");

    assertEquals(outsiderBreakError, null);
    assertEquals(outsiderBreaks?.length, 1);
    assertEquals(outsiderBreaks?.[0].tenant_id, ctx.tenantBId);
    assertEquals(outsiderBreaks?.[0].doc_id, "DOC-B-001");
  });

  it("allows only admin, reconciliation_analyst and controller to write forensic tables within their tenant", async () => {
    const adminClient = await signIn(ctx.users.adminA);
    const analystClient = await signIn(ctx.users.analystA);
    const controllerClient = await signIn(ctx.users.controllerA);
    const viewerClient = await signIn(ctx.users.viewerA);
    const outsiderClient = await signIn(ctx.users.outsiderAdminB);

    const adminCaseId = await createExceptionCase(ctx.tenantAId, ctx.runAId);
    const analystCaseId = await createExceptionCase(ctx.tenantAId, ctx.runAId);
    const controllerCaseId = await createExceptionCase(ctx.tenantAId, ctx.runAId);
    const viewerCaseId = await createExceptionCase(ctx.tenantAId, ctx.runAId);
    const outsiderCaseId = await createExceptionCase(ctx.tenantAId, ctx.runAId);

    const adminBreakId = crypto.randomUUID();
    trackedBreakDetailIds.add(adminBreakId);
    const { error: adminInsertError } = await adminClient.from("break_details").insert({
      break_detail_id: adminBreakId,
      tenant_id: ctx.tenantAId,
      exception_case_id: adminCaseId,
      run_id: ctx.runAId,
      doc_id: "DOC-A-ADMIN",
      doc_type: "invoice",
      side_a_amount: 100,
      side_b_amount: 90,
      currency: "USD",
      break_category: "amount_mismatch",
    });
    assertEquals(adminInsertError, null);

    const analystBreakId = crypto.randomUUID();
    trackedBreakDetailIds.add(analystBreakId);
    const { error: analystInsertError } = await analystClient.from("break_details").insert({
      break_detail_id: analystBreakId,
      tenant_id: ctx.tenantAId,
      exception_case_id: analystCaseId,
      run_id: ctx.runAId,
      doc_id: "DOC-A-ANALYST",
      doc_type: "invoice",
      side_a_amount: 210,
      side_b_amount: 200,
      currency: "USD",
      break_category: "amount_mismatch",
    });
    assertEquals(analystInsertError, null);

    const { error: controllerLinkError } = await controllerClient.from("document_trade_links").insert({
      tenant_id: ctx.tenantAId,
      doc_id: "DOC-A-CONTROLLER",
      doc_type: "invoice",
      deal_id: `DEAL-${crypto.randomUUID().slice(0, 8)}`,
      allocation_amount: 50,
      allocation_pct: 100,
      link_source: "manual",
      ai_confidence: 0.88,
      created_by: ctx.users.controllerA.id,
    });
    assertEquals(controllerLinkError, null);

    const viewerBreakId = crypto.randomUUID();
    const { error: viewerInsertError } = await viewerClient.from("break_details").insert({
      break_detail_id: viewerBreakId,
      tenant_id: ctx.tenantAId,
      exception_case_id: viewerCaseId,
      run_id: ctx.runAId,
      doc_id: "DOC-A-VIEWER",
      doc_type: "invoice",
      side_a_amount: 10,
      side_b_amount: 9,
      currency: "USD",
      break_category: "amount_mismatch",
    });
    assert(viewerInsertError !== null);

    const outsiderBreakId = crypto.randomUUID();
    const { error: outsiderInsertError } = await outsiderClient.from("break_details").insert({
      break_detail_id: outsiderBreakId,
      tenant_id: ctx.tenantAId,
      exception_case_id: outsiderCaseId,
      run_id: ctx.runAId,
      doc_id: "DOC-A-OUTSIDER",
      doc_type: "invoice",
      side_a_amount: 11,
      side_b_amount: 9,
      currency: "USD",
      break_category: "amount_mismatch",
    });
    assert(outsiderInsertError !== null);
  });

  it("exposes materialized view data only through tenant-filtered functions, not direct table reads", async () => {
    const viewerClient = await signIn(ctx.users.viewerA);

    const { data: breakTypeRows, error: breakTypeError } = await viewerClient.rpc("get_mv_recon_run_by_break_type", {
      _run_id: ctx.runAId,
    });

    assertEquals(breakTypeError, null);
    assert(Array.isArray(breakTypeRows));
    assertEquals(breakTypeRows?.length, 1);
    assertEquals(breakTypeRows?.[0].tenant_id, ctx.tenantAId);
    assertEquals(breakTypeRows?.[0].break_category, "amount_mismatch");

    const { data: crossTenantRows, error: crossTenantError } = await viewerClient.rpc("get_mv_recon_run_by_break_type", {
      _run_id: ctx.runBId,
    });

    assertEquals(crossTenantError, null);
    assertEquals(crossTenantRows, []);

    const { error: directMvReadError } = await viewerClient
      .from("mv_recon_run_by_break_type")
      .select("tenant_id, run_id")
      .limit(1);

    assert(directMvReadError !== null);
  });

  it("keeps drill_audit_events append-only and user-bound for non-admins", async () => {
    const viewerClient = await signIn(ctx.users.viewerA);

    const { data: insertedAuditRows, error: insertAuditError } = await viewerClient
      .from("drill_audit_events")
      .insert({
        tenant_id: ctx.tenantAId,
        user_id: ctx.users.viewerA.id,
        module: "reconciliations",
        action: "navigate",
        drill_path: { levels: ["run", "break_category", "document"] },
        scope_filters: { run_id: ctx.runAId },
        target_level: 3,
        row_count: 1,
      })
      .select("drill_event_id, tenant_id, user_id")
      .single();

    assertEquals(insertAuditError, null);
    assertEquals(insertedAuditRows?.tenant_id, ctx.tenantAId);
    assertEquals(insertedAuditRows?.user_id, ctx.users.viewerA.id);
    ctx.auditEventId = insertedAuditRows?.drill_event_id ?? null;

    const { error: wrongUserInsertError } = await viewerClient.from("drill_audit_events").insert({
      tenant_id: ctx.tenantAId,
      user_id: ctx.users.adminA.id,
      module: "reconciliations",
      action: "navigate",
      drill_path: { invalid: true },
      target_level: 2,
    });

    assert(wrongUserInsertError !== null);

    const { error: updateAuditError } = await viewerClient
      .from("drill_audit_events")
      .update({ row_count: 999 })
      .eq("drill_event_id", ctx.auditEventId!);

    const { data: auditAfterUpdate, error: readAfterUpdateError } = await viewerClient
      .from("drill_audit_events")
      .select("drill_event_id, row_count")
      .eq("drill_event_id", ctx.auditEventId!)
      .single();

    assertEquals(readAfterUpdateError, null);
    assertEquals(auditAfterUpdate?.row_count, 1);
    if (updateAuditError !== null) {
      assert(updateAuditError !== null);
    }

    const { error: deleteAuditError } = await viewerClient
      .from("drill_audit_events")
      .delete()
      .eq("drill_event_id", ctx.auditEventId!);

    const { data: auditAfterDelete, error: readAfterDeleteError } = await viewerClient
      .from("drill_audit_events")
      .select("drill_event_id")
      .eq("drill_event_id", ctx.auditEventId!);

    assertEquals(readAfterDeleteError, null);
    assertEquals(auditAfterDelete?.length, 1);
    if (deleteAuditError !== null) {
      assert(deleteAuditError !== null);
    }
  });
});