// Cashflow drill MV reader.
//
// One function, four levels — fetches the appropriate `mv_cashflow_by_*`
// materialized view via the existing SECURITY DEFINER RPCs (which already
// enforce tenant isolation via `get_user_tenant_id(auth.uid())`).
//
// Body:
//   {
//     level: "bucket" | "entity" | "counterparty" | "document",
//     asOfDate?: "YYYY-MM-DD",          // defaults to today
//     scope?: {                          // optional drill filters
//       bucket?: string,
//       legalEntityId?: string (uuid),
//       counterpartyId?: string (uuid),
//       docId?: string,
//       docType?: string,
//       flowDirection?: "INFLOW" | "OUTFLOW",
//       currency?: string
//     }
//   }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { z } from "https://esm.sh/zod@3.23.8";
import { corsHeaders } from "../_shared/cors.ts";

const LEVEL_TO_RPC = {
  bucket: "get_mv_cashflow_by_bucket",
  entity: "get_mv_cashflow_by_entity",
  counterparty: "get_mv_cashflow_by_counterparty",
  document: "get_mv_cashflow_by_document",
} as const;

const ScopeSchema = z
  .object({
    bucket: z.string().min(1).max(64).optional(),
    legalEntityId: z.string().uuid().optional(),
    counterpartyId: z.string().uuid().optional(),
    docId: z.string().min(1).max(128).optional(),
    docType: z.string().min(1).max(64).optional(),
    flowDirection: z.enum(["INFLOW", "OUTFLOW"]).optional(),
    currency: z.string().min(3).max(3).optional(),
  })
  .strict()
  .optional();

const BodySchema = z.object({
  level: z.enum(["bucket", "entity", "counterparty", "document"]),
  asOfDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "asOfDate must be YYYY-MM-DD")
    .optional(),
  scope: ScopeSchema,
});

type Scope = z.infer<typeof ScopeSchema>;

function applyScope(rows: Array<Record<string, unknown>>, scope: Scope) {
  if (!scope) return rows;
  return rows.filter((r) => {
    if (scope.bucket && r.bucket !== scope.bucket) return false;
    if (scope.legalEntityId && r.legal_entity_id !== scope.legalEntityId) return false;
    if (scope.counterpartyId && r.external_counterparty_id !== scope.counterpartyId)
      return false;
    if (scope.docId && r.doc_id !== scope.docId) return false;
    if (scope.docType && r.doc_type !== scope.docType) return false;
    if (scope.flowDirection && r.flow_direction !== scope.flowDirection) return false;
    if (scope.currency && r.currency !== scope.currency) return false;
    return true;
  });
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  // ── Auth ──
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );

  const token = authHeader.replace("Bearer ", "");
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
  if (claimsError || !claimsData?.claims) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  // ── Validate body ──
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) {
    return jsonResponse(
      { error: "Invalid request", details: parsed.error.flatten().fieldErrors },
      400,
    );
  }

  const { level, asOfDate, scope } = parsed.data;
  const rpcName = LEVEL_TO_RPC[level];
  // Default to today (UTC) if no asOfDate provided — the RPC default is CURRENT_DATE
  // but we pass it explicitly so the response echoes back the value used.
  const effectiveAsOf = asOfDate ?? new Date().toISOString().slice(0, 10);

  // ── Call RPC (RLS enforced inside the SECURITY DEFINER function via
  // get_user_tenant_id(auth.uid())). The user JWT is forwarded above. ──
  const { data, error } = await supabase.rpc(rpcName, { _as_of_date: effectiveAsOf });

  if (error) {
    return jsonResponse(
      { error: "Failed to load cashflow MV", details: error.message },
      500,
    );
  }

  const rows = Array.isArray(data) ? (data as Array<Record<string, unknown>>) : [];
  const filtered = applyScope(rows, scope);

  return jsonResponse({
    level,
    asOfDate: effectiveAsOf,
    scope: scope ?? {},
    totalCount: filtered.length,
    rows: filtered,
  });
});
