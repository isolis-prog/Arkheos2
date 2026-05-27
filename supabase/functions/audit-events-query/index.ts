import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { corsHeaders } from "../_shared/cors.ts";

const QuerySchema = z.object({
  tenantId: z.string().uuid(),
  runId: z.string().uuid().optional(),
  correlationId: z.string().optional(),
  domain: z.string().optional(),
  level: z.enum(["debug", "info", "warn", "error"]).optional(),
  action: z.string().optional(),
  entityId: z.string().uuid().optional(),
  entityType: z.string().optional(),
  fromTs: z.string().datetime().optional(),
  toTs: z.string().datetime().optional(),
  limit: z.number().int().min(1).max(500).optional(),
  /** Which sources to return: structured_logs, agent_audit_events, or both (default). */
  sources: z.array(z.enum(["structured_logs", "agent_audit_events"])).optional(),
});

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ success: false, error: "Missing Authorization header" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!supabaseUrl || !anonKey) {
      return jsonResponse({ success: false, error: "Server misconfigured" }, 500);
    }

    // Use the caller's JWT so RLS applies (tenant isolation).
    const supabase = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      return jsonResponse({ success: false, error: "Unauthorized" }, 401);
    }

    const parsed = QuerySchema.safeParse(await req.json());
    if (!parsed.success) {
      return jsonResponse({ success: false, error: parsed.error.flatten() }, 400);
    }
    const q = parsed.data;
    const limit = q.limit ?? 200;
    const sources = q.sources ?? ["structured_logs", "agent_audit_events"];

    // Extract uuid portion from a possibly-prefixed correlationId.
    const correlationUuid = q.correlationId?.match(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i,
    )?.[0] ?? null;

    const result: {
      structuredLogs?: unknown[];
      agentAuditEvents?: unknown[];
    } = {};

    if (sources.includes("structured_logs")) {
      let logs = supabase
        .from("structured_logs")
        .select("id, tenant_id, correlation_id, domain, level, message, context, duration_ms, user_id, created_at")
        .eq("tenant_id", q.tenantId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (correlationUuid) logs = logs.eq("correlation_id", correlationUuid);
      if (q.domain) logs = logs.eq("domain", q.domain);
      if (q.level) logs = logs.eq("level", q.level);
      if (q.fromTs) logs = logs.gte("created_at", q.fromTs);
      if (q.toTs) logs = logs.lte("created_at", q.toTs);
      if (q.runId) logs = logs.eq("context->>run_id", q.runId);

      const { data, error } = await logs;
      if (error) throw new Error(`structured_logs query failed: ${error.message}`);
      result.structuredLogs = data ?? [];
    }

    if (sources.includes("agent_audit_events")) {
      let events = supabase
        .from("agent_audit_events")
        .select("id, timestamp, actor_type, actor_id, tenant_id, entity_type, entity_id, action, tool_name, input_json, output_json, hash_input, hash_output, run_id")
        .eq("tenant_id", q.tenantId)
        .order("timestamp", { ascending: false })
        .limit(limit);

      if (q.runId) events = events.eq("run_id", q.runId);
      if (q.action) events = events.eq("action", q.action);
      if (q.entityId) events = events.eq("entity_id", q.entityId);
      if (q.entityType) events = events.eq("entity_type", q.entityType);
      if (q.fromTs) events = events.gte("timestamp", q.fromTs);
      if (q.toTs) events = events.lte("timestamp", q.toTs);

      const { data, error } = await events;
      if (error) throw new Error(`agent_audit_events query failed: ${error.message}`);
      result.agentAuditEvents = data ?? [];
    }

    return jsonResponse({
      success: true,
      filters: q,
      counts: {
        structuredLogs: result.structuredLogs?.length ?? 0,
        agentAuditEvents: result.agentAuditEvents?.length ?? 0,
      },
      ...result,
    });
  } catch (err) {
    return jsonResponse(
      { success: false, error: err instanceof Error ? err.message : String(err) },
      500,
    );
  }
});
