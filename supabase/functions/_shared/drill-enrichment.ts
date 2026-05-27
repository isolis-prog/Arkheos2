import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { corsHeaders } from "./cors.ts";

// Re-export so existing callers that do `import { corsHeaders } from
// "../_shared/drill-enrichment.ts"` keep working unchanged.
export { corsHeaders };

export const enrichBreakDetailsSchema = z.object({
  runId: z.string().uuid(),
  tenantId: z.string().uuid(),
  userId: z.string().uuid().optional(),
});

export const resolveDocumentTradeLinksSchema = z.object({
  runId: z.string().uuid(),
  tenantId: z.string().uuid(),
});

export const refreshDrillMvSchema = z.object({
  runId: z.string().uuid().optional(),
  tenantId: z.string().uuid(),
});

export type EnrichBreakDetailsInput = z.infer<typeof enrichBreakDetailsSchema>;
export type ResolveDocumentTradeLinksInput = z.infer<typeof resolveDocumentTradeLinksSchema>;
export type RefreshDrillMvInput = z.infer<typeof refreshDrillMvSchema>;

export interface DrillFunctionResponse {
  success: boolean;
  metrics?: Record<string, unknown>;
  error?: string;
}

export interface RootCauseSuggestion {
  exception_case_id: string;
  suggested_root_cause: string | null;
  ai_confidence: number | null;
}

export interface DocumentTradeSuggestion {
  deal_id: string;
  allocation_pct: number;
  confidence: number;
}

export function getServiceRoleClient() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase service role environment");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function createCorrelationId(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`;
}

/** Extract a UUID portion from a prefixed correlation id, for DB persistence. */
export function correlationIdToUuid(correlationId: string): string | null {
  const match = correlationId.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
  return match ? match[0] : null;
}

export function structuredLog(message: string, context: Record<string, unknown> = {}) {
  console.log(JSON.stringify({ message, ...context }));
}

export async function sha256(input: unknown) {
  const bytes = new TextEncoder().encode(JSON.stringify(input));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((value) => value.toString(16).padStart(2, "0")).join("");
}

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface BoundLoggerContext {
  correlationId: string;
  tenantId: string;
  runId?: string | null;
  domain: string;
  userId?: string | null;
}

export interface BoundLogger {
  context: BoundLoggerContext;
  log: (level: LogLevel, message: string, extra?: Record<string, unknown>) => Promise<void>;
  info: (message: string, extra?: Record<string, unknown>) => Promise<void>;
  warn: (message: string, extra?: Record<string, unknown>) => Promise<void>;
  error: (message: string, extra?: Record<string, unknown>) => Promise<void>;
  /** Log a payload-bearing event with sha256 hashes of input/output. */
  logHashed: (
    message: string,
    payloads: { input?: unknown; output?: unknown },
    extra?: Record<string, unknown>,
    level?: LogLevel,
  ) => Promise<void>;
  /** Wrap an async op: timed + logs success/error including payload hashes. */
  timed: <T>(
    message: string,
    fn: () => Promise<T>,
    payloads?: { input?: unknown; getOutput?: (result: T) => unknown },
    extra?: Record<string, unknown>,
  ) => Promise<T>;
}

const PERSIST_MIN_LEVEL: LogLevel = "info";
const LEVEL_PRIORITY: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };

export function createBoundLogger(
  supabase: SupabaseClient,
  context: BoundLoggerContext,
): BoundLogger {
  const correlationUuid = correlationIdToUuid(context.correlationId);

  async function persist(level: LogLevel, message: string, extra: Record<string, unknown>, durationMs?: number) {
    if (LEVEL_PRIORITY[level] < LEVEL_PRIORITY[PERSIST_MIN_LEVEL]) return;
    try {
      await supabase.from("structured_logs").insert({
        tenant_id: context.tenantId,
        correlation_id: correlationUuid,
        domain: context.domain,
        level,
        message,
        context: {
          ...extra,
          correlation_id_full: context.correlationId,
          run_id: context.runId ?? null,
          user_id: context.userId ?? null,
        },
        duration_ms: durationMs ?? null,
        user_id: context.userId ?? null,
      });
    } catch (err) {
      console.error(JSON.stringify({
        message: "structured_logs persist failed",
        error: err instanceof Error ? err.message : String(err),
        correlationId: context.correlationId,
      }));
    }
  }

  function emitConsole(level: LogLevel, message: string, extra: Record<string, unknown>, durationMs?: number) {
    const payload = {
      message,
      level,
      domain: context.domain,
      correlationId: context.correlationId,
      tenantId: context.tenantId,
      runId: context.runId ?? null,
      durationMs: durationMs ?? null,
      ...extra,
    };
    const fn = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
    fn(JSON.stringify(payload));
  }

  async function log(level: LogLevel, message: string, extra: Record<string, unknown> = {}) {
    emitConsole(level, message, extra);
    await persist(level, message, extra);
  }

  async function logHashed(
    message: string,
    payloads: { input?: unknown; output?: unknown },
    extra: Record<string, unknown> = {},
    level: LogLevel = "info",
  ) {
    const hashInput = payloads.input !== undefined ? await sha256(payloads.input) : null;
    const hashOutput = payloads.output !== undefined ? await sha256(payloads.output) : null;
    const enriched = {
      ...extra,
      hash_input: hashInput,
      hash_output: hashOutput,
      input_size: payloads.input !== undefined ? JSON.stringify(payloads.input).length : null,
      output_size: payloads.output !== undefined ? JSON.stringify(payloads.output).length : null,
    };
    emitConsole(level, message, enriched);
    await persist(level, message, enriched);
  }

  async function timed<T>(
    message: string,
    fn: () => Promise<T>,
    payloads: { input?: unknown; getOutput?: (result: T) => unknown } = {},
    extra: Record<string, unknown> = {},
  ): Promise<T> {
    const start = performance.now();
    const hashInput = payloads.input !== undefined ? await sha256(payloads.input) : null;
    try {
      const result = await fn();
      const durationMs = Math.round(performance.now() - start);
      const out = payloads.getOutput ? payloads.getOutput(result) : undefined;
      const hashOutput = out !== undefined ? await sha256(out) : null;
      const enriched = {
        ...extra,
        hash_input: hashInput,
        hash_output: hashOutput,
        outcome: "success",
      };
      emitConsole("info", `${message} [ok]`, enriched, durationMs);
      await persist("info", `${message} [ok]`, enriched, durationMs);
      return result;
    } catch (err) {
      const durationMs = Math.round(performance.now() - start);
      const enriched = {
        ...extra,
        hash_input: hashInput,
        outcome: "error",
        error: err instanceof Error ? err.message : String(err),
      };
      emitConsole("error", `${message} [failed]`, enriched, durationMs);
      await persist("error", `${message} [failed]`, enriched, durationMs);
      throw err;
    }
  }

  return {
    context,
    log,
    info: (m, x) => log("info", m, x),
    warn: (m, x) => log("warn", m, x),
    error: (m, x) => log("error", m, x),
    logHashed,
    timed,
  };
}

export async function logAgentAuditEvent(
  supabase: SupabaseClient,
  params: {
    action: string;
    tenantId: string;
    entityType: string;
    entityId?: string | null;
    runId?: string | null;
    actorId?: string | null;
    actorType?: "user" | "agent" | "system";
    toolName?: string | null;
    inputJson?: unknown;
    outputJson?: unknown;
  },
) {
  const hashInput = params.inputJson ? await sha256(params.inputJson) : null;
  const hashOutput = params.outputJson ? await sha256(params.outputJson) : null;

  const { error } = await supabase.from("agent_audit_events").insert({
    actor_type: params.actorType ?? "system",
    actor_id: params.actorId ?? null,
    tenant_id: params.tenantId,
    entity_type: params.entityType,
    entity_id: params.entityId ?? null,
    action: params.action,
    tool_name: params.toolName ?? null,
    input_json: params.inputJson ?? null,
    output_json: params.outputJson ?? null,
    run_id: params.runId ?? null,
    hash_input: hashInput,
    hash_output: hashOutput,
  });

  if (error) {
    structuredLog("agent_audit_events insert failed", { action: params.action, error: error.message });
  }
}

export function chunk<T>(items: T[], size: number) {
  const result: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size));
  }
  return result;
}

export function normalizeName(value: string | null | undefined) {
  return (value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ");
}

export function pickDate(...values: Array<string | null | undefined>) {
  return values.find((value) => Boolean(value)) ?? null;
}

export function numberOrNull(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "" && !Number.isNaN(Number(value))) return Number(value);
  return null;
}

export function computeAmountDeltaPct(sideAAmount: number | null, sideBAmount: number | null) {
  const left = sideAAmount ?? 0;
  const right = sideBAmount ?? 0;
  const base = Math.max(Math.abs(left), Math.abs(right), 1);
  return Number((((right - left) / base) * 100).toFixed(4));
}

export function computeDateDeltaDays(sideADate: string | null, sideBDate: string | null) {
  if (!sideADate || !sideBDate) return null;
  const left = new Date(sideADate);
  const right = new Date(sideBDate);
  if (Number.isNaN(left.getTime()) || Number.isNaN(right.getTime())) return null;
  return Math.round((right.getTime() - left.getTime()) / 86400000);
}

export async function createAilRequest(
  supabase: SupabaseClient,
  params: {
    tenantId: string;
    userId?: string;
    workflowType: string;
    contextPayload: Record<string, unknown>;
  },
) {
  const { data, error } = await supabase
    .from("ail_inference_requests")
    .insert({
      tenant_id: params.tenantId,
      requested_by: params.userId ?? null,
      workflow_type: params.workflowType,
      requesting_module: "drill_enrichment",
      context_payload: params.contextPayload,
      status: "QUEUED",
    })
    .select("request_id")
    .single();

  if (error) {
    throw new Error(`Failed to create AIL request: ${error.message}`);
  }

  return data.request_id as string;
}

export async function invokeAilWorkflow<T>(
  supabase: SupabaseClient,
  params: {
    requestId: string;
    tenantId: string;
    workflowType: string;
    contextPayload: Record<string, unknown>;
    entityId: string;
    entityType: string;
    correlationId: string;
  },
): Promise<T | null> {
  // Idempotent because the AIL dispatcher de-duplicates by request_id.
  const { data, error } = await withRetry(
    async () =>
      await supabase.functions.invoke("ail-cde-dispatcher", {
        body: {
          request_id: params.requestId,
          tenant_id: params.tenantId,
          workflow_type: params.workflowType,
          context_payload: {
            ...params.contextPayload,
            correlation_id: params.correlationId,
          },
          entity_id: params.entityId,
          entity_type: params.entityType,
        },
      }),
    {
      opName: `ail_invoke:${params.workflowType}`,
      shouldRetry: (err) => {
        // Functions client wraps errors in {error}; check both.
        const message = err instanceof Error
          ? err.message
          : typeof err === "object" && err && "message" in err
            ? String((err as { message: unknown }).message)
            : String(err);
        return isTransientError(new Error(message));
      },
    },
  );

  if (error) {
    throw new Error(`AIL invoke failed: ${error.message}`);
  }

  if (!data?.result_payload) {
    return null;
  }

  return data.result_payload as T;
}

export function jsonResponse(body: DrillFunctionResponse, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ---------------------------------------------------------------------------
// Retry helper with exponential backoff + jitter.
//
// Idempotency contract: callers MUST ensure the wrapped operation is safe to
// re-run. In this codebase that means:
//   - Writes use upsert with onConflict / ignoreDuplicates on natural keys.
//   - Materialized view refreshes (REFRESH MATERIALIZED VIEW) are idempotent
//     by definition.
//   - AIL invocations re-use the same `request_id`; the dispatcher de-dupes
//     downstream side effects.
// ---------------------------------------------------------------------------

export interface RetryOptions {
  maxAttempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  jitterRatio?: number;
  /** Decide whether an error is retryable. Defaults to isTransientError. */
  shouldRetry?: (error: unknown, attempt: number) => boolean;
  /** Optional structured logger. Receives attempt metadata. */
  onRetry?: (info: { attempt: number; delayMs: number; error: unknown; opName: string }) => void;
  /** Identifier used in logs. */
  opName?: string;
}

const DEFAULT_RETRY_OPTIONS: Required<Omit<RetryOptions, "shouldRetry" | "onRetry" | "opName">> = {
  maxAttempts: 4,
  baseDelayMs: 250,
  maxDelayMs: 4000,
  jitterRatio: 0.3,
};

const TRANSIENT_PATTERNS = [
  /timeout/i,
  /timed out/i,
  /ECONN/i,
  /ENETUNREACH/i,
  /EAI_AGAIN/i,
  /fetch failed/i,
  /network/i,
  /temporar/i,
  /rate limit/i,
  /429/,
  /500/,
  /502/,
  /503/,
  /504/,
  /could not obtain lock/i,
  /deadlock detected/i,
  /canceling statement due to/i,
  /materialized view/i,
];

export function isTransientError(error: unknown): boolean {
  if (!error) return false;
  const message = error instanceof Error ? error.message : String(error);
  return TRANSIENT_PATTERNS.some((pattern) => pattern.test(message));
}

export function computeBackoffDelayMs(
  attempt: number,
  opts: { baseDelayMs: number; maxDelayMs: number; jitterRatio: number },
) {
  const exp = Math.min(opts.maxDelayMs, opts.baseDelayMs * 2 ** (attempt - 1));
  const jitter = exp * opts.jitterRatio * (Math.random() * 2 - 1);
  return Math.max(0, Math.round(exp + jitter));
}

export async function withRetry<T>(operation: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const merged = { ...DEFAULT_RETRY_OPTIONS, ...options };
  const shouldRetry = options.shouldRetry ?? ((error) => isTransientError(error));
  const opName = options.opName ?? "operation";

  let lastError: unknown;
  for (let attempt = 1; attempt <= merged.maxAttempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const isLast = attempt === merged.maxAttempts;
      if (isLast || !shouldRetry(error, attempt)) {
        structuredLog("retry exhausted", {
          opName,
          attempt,
          maxAttempts: merged.maxAttempts,
          retryable: !isLast,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
      const delayMs = computeBackoffDelayMs(attempt, merged);
      structuredLog("retry scheduled", {
        opName,
        attempt,
        nextAttempt: attempt + 1,
        delayMs,
        error: error instanceof Error ? error.message : String(error),
      });
      options.onRetry?.({ attempt, delayMs, error, opName });
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw lastError;
}

