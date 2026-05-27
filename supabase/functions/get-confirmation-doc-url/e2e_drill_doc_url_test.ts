/**
 * E2E test for the drill-down "side-by-side" page integration.
 *
 * The Confirmations drill page (TradeConfirmationDetailPage →
 * ConfirmationDocumentSideBySide) renders an "Source" download button on each
 * document column. That button calls the `get-confirmation-doc-url` edge
 * function, which must either return a signed Storage URL or a structured
 * error response. This test exercises every branch of that contract end-to-end
 * against the deployed function:
 *
 *   1. Missing Authorization header             → 401 MISSING_AUTH
 *   2. Wrong HTTP method (GET)                  → 405 METHOD_NOT_ALLOWED
 *   3. Malformed JSON body                      → 400 INVALID_JSON
 *   4. Missing `confirmationDocId`              → 400 INVALID_INPUT
 *   5. Unknown / wrong-tenant doc id            → 404 DOC_NOT_FOUND
 *   6. Doc with no storage_path (demo data)     → 200 { available:false, reason }
 *   7. Doc with a storage_path (object missing) → 200 signedUrl  OR  502 SIGN_URL_FAILED
 *      (both are valid contract outcomes; the Storage object isn't seeded)
 */

import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { afterAll, beforeAll, describe, it } from "https://deno.land/std@0.224.0/testing/bdd.ts";
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY =
  Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const FN_URL = `${SUPABASE_URL}/functions/v1/get-confirmation-doc-url`;

const service = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

interface SeedCtx {
  tenantId: string;
  userId: string;
  email: string;
  password: string;
  accessToken: string;
  docNoStorageId: string;
  docWithStorageId: string;
  userClient: SupabaseClient;
}

const ctx = {} as SeedCtx;
const trackedDocIds: string[] = [];

function uniq(label: string) {
  return `e2e-docurl-${label}-${crypto.randomUUID().slice(0, 8)}`;
}

async function callFn(opts: {
  method?: string;
  token?: string | null;
  rawBody?: string;
  body?: unknown;
}) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    apikey: SUPABASE_ANON_KEY,
  };
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;

  const res = await fetch(FN_URL, {
    method: opts.method ?? "POST",
    headers,
    body:
      opts.rawBody !== undefined
        ? opts.rawBody
        : opts.body !== undefined
          ? JSON.stringify(opts.body)
          : undefined,
  });
  let json: unknown = null;
  const text = await res.text();
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { _raw: text };
  }
  return { status: res.status, json: json as Record<string, unknown> | null };
}

beforeAll(async () => {
  // 1. Tenant
  const tenantId = crypto.randomUUID();
  const slug = uniq("tenant");
  const { error: tErr } = await service.from("tenants").insert({
    id: tenantId,
    name: `E2E DocUrl ${slug}`,
    slug,
    settings: {},
  });
  if (tErr) throw tErr;
  ctx.tenantId = tenantId;

  // 2. User w/ admin role (passes can_read_confirmations + tenant RLS)
  const email = `${uniq("user")}@arkheos.test`;
  const password = `ArkheOS!${crypto.randomUUID()}Aa1`;
  const { data: userData, error: uErr } = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: "E2E DocUrl Tester" },
  });
  if (uErr || !userData.user) throw uErr ?? new Error("createUser returned no user");
  ctx.userId = userData.user.id;
  ctx.email = email;
  ctx.password = password;

  const { error: profErr } = await service.from("profiles").upsert({
    id: ctx.userId,
    tenant_id: tenantId,
    email,
    full_name: "E2E DocUrl Tester",
    scopes: {},
    is_active: true,
  });
  if (profErr) throw profErr;

  const { error: roleErr } = await service.from("user_roles").insert({
    user_id: ctx.userId,
    role: "admin",
  });
  if (roleErr) throw roleErr;

  // 3. Sign in to get an access token
  const browser = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: session, error: signErr } = await browser.auth.signInWithPassword({
    email,
    password,
  });
  if (signErr || !session.session) throw signErr ?? new Error("no session");
  ctx.accessToken = session.session.access_token;
  ctx.userClient = browser;

  // 4. Two confirmation documents
  const docNoStorageId = crypto.randomUUID();
  const docWithStorageId = crypto.randomUUID();
  trackedDocIds.push(docNoStorageId, docWithStorageId);

  const { error: d1Err } = await service.from("confirmation_documents").insert({
    confirmation_doc_id: docNoStorageId,
    tenant_id: tenantId,
    external_doc_ref: `OUR-${docNoStorageId.slice(0, 6)}`,
    doc_type: "our_capture",
    source: "TRADING_SYSTEM",
    format: "trade_capture",
    parsing_status: "parsed",
    parsing_confidence: 0.99,
    storage_path: null, // demo doc — function should report available:false
    parsed_attributes: { notional: 1_000_000, currency: "USD" },
  });
  if (d1Err) throw d1Err;

  const { error: d2Err } = await service.from("confirmation_documents").insert({
    confirmation_doc_id: docWithStorageId,
    tenant_id: tenantId,
    external_doc_ref: `CPTY-${docWithStorageId.slice(0, 6)}`,
    doc_type: "counterparty_confirm",
    source: "COUNTERPARTY_PORTAL",
    format: "fpml",
    parsing_status: "parsed",
    parsing_confidence: 0.95,
    storage_path: `confirmations/${tenantId}/${docWithStorageId}.pdf`,
    parsed_attributes: { notional: 1_000_000, currency: "USD" },
  });
  if (d2Err) throw d2Err;

  ctx.docNoStorageId = docNoStorageId;
  ctx.docWithStorageId = docWithStorageId;
});

afterAll(async () => {
  if (trackedDocIds.length) {
    await service.from("confirmation_documents").delete().in("confirmation_doc_id", trackedDocIds);
  }
  await service.from("user_roles").delete().eq("user_id", ctx.userId);
  await service.from("profiles").delete().eq("id", ctx.userId);
  await service.from("tenants").delete().eq("id", ctx.tenantId);
  if (ctx.userId) {
    try {
      await service.auth.admin.deleteUser(ctx.userId);
    } catch { /* best-effort */ }
  }
});

describe("drill-down side-by-side → get-confirmation-doc-url", () => {
  it("rejects requests without an Authorization header (401 MISSING_AUTH)", async () => {
    const { status, json } = await callFn({
      token: null,
      body: { confirmationDocId: ctx.docNoStorageId },
    });
    assertEquals(status, 401);
    assertEquals((json?.error as { code?: string })?.code, "MISSING_AUTH");
  });

  it("rejects non-POST methods (405 METHOD_NOT_ALLOWED)", async () => {
    const { status, json } = await callFn({ method: "GET", token: ctx.accessToken });
    assertEquals(status, 405);
    assertEquals((json?.error as { code?: string })?.code, "METHOD_NOT_ALLOWED");
  });

  it("rejects malformed JSON bodies (400 INVALID_JSON)", async () => {
    const { status, json } = await callFn({
      token: ctx.accessToken,
      rawBody: "{not json",
    });
    assertEquals(status, 400);
    assertEquals((json?.error as { code?: string })?.code, "INVALID_JSON");
  });

  it("rejects bodies missing confirmationDocId (400 INVALID_INPUT)", async () => {
    const { status, json } = await callFn({
      token: ctx.accessToken,
      body: { foo: "bar" },
    });
    assertEquals(status, 400);
    assertEquals((json?.error as { code?: string })?.code, "INVALID_INPUT");
  });

  it("returns 404 DOC_NOT_FOUND for unknown / cross-tenant ids", async () => {
    const { status, json } = await callFn({
      token: ctx.accessToken,
      body: { confirmationDocId: crypto.randomUUID() },
    });
    assertEquals(status, 404);
    assertEquals((json?.error as { code?: string })?.code, "DOC_NOT_FOUND");
  });

  it("returns available:false (200) when the doc has no storage_path", async () => {
    const { status, json } = await callFn({
      token: ctx.accessToken,
      body: { confirmationDocId: ctx.docNoStorageId },
    });
    assertEquals(status, 200);
    assertEquals(json?.available, false);
    assert(typeof json?.reason === "string" && (json!.reason as string).length > 0);
    assertEquals((json as Record<string, unknown>).signedUrl, undefined);
  });

  it("returns a signed URL or a SIGN_URL_FAILED error for a doc with storage_path", async () => {
    const { status, json } = await callFn({
      token: ctx.accessToken,
      body: { confirmationDocId: ctx.docWithStorageId },
    });

    // The Storage object isn't seeded in this test, so two outcomes are valid:
    //  - 200 with available:true + signedUrl (bucket auto-created or pre-existing object)
    //  - 502 SIGN_URL_FAILED (bucket/object missing) — still a structured error
    if (status === 200) {
      assertEquals(json?.available, true);
      const signedUrl = json?.signedUrl as string | undefined;
      assert(typeof signedUrl === "string", "signedUrl must be a string");
      assert(signedUrl!.startsWith("http"), "signedUrl must be an absolute URL");
      assert(
        signedUrl!.includes("token=") || signedUrl!.includes("/object/sign/"),
        "signedUrl must look like a Supabase Storage signed URL",
      );
    } else {
      assertEquals(status, 502);
      assertEquals((json?.error as { code?: string })?.code, "SIGN_URL_FAILED");
      assert(
        typeof (json?.error as { message?: string })?.message === "string",
        "error.message must be a string",
      );
    }
  });
});
