import { z } from 'zod';

/**
 * Canonical drill-scope envelope. Every module-specific scope ultimately
 * maps to this shape so that URL tokens are validated uniformly.
 *
 * NOTE: module-specific scopes (recon / cashflows / confirmations /
 * valuation) carry their own typed payload — see {@link ModuleScopeSchemas}.
 * The canonical schema below is what we use for the generic shape check
 * required by the security pass on `?d=...` tokens.
 */
export const DrillScopeSchema = z.object({
  module: z.enum(['reconciliations', 'cashflows', 'confirmations', 'valuation']),
  runId: z.string().uuid().optional(),
  level: z.number().int().min(0).max(5),
  filters: z.record(
    z.string(),
    z.union([z.string(), z.number(), z.boolean(), z.null()]),
  ),
  timestamp: z.number().optional(),
});

export type DrillScope = z.infer<typeof DrillScopeSchema>;

// ---------------------------------------------------------------------------
// Per-module Zod schemas. These describe the actual payload encoded today by
// the four `_drillScope.ts` helpers. They are intentionally permissive on
// optional fields and strict on the keys we trust (uuids, enums).
// ---------------------------------------------------------------------------

export const ReconDrillScopeZ = z.object({
  runId: z.string().min(1),
  breakCategory: z.string().optional(),
  legalEntityId: z.string().optional(),
  legalEntityName: z.string().optional(),
  counterpartyId: z.string().optional(),
  counterpartyName: z.string().optional(),
  docId: z.string().optional(),
  docType: z.string().optional(),
  timestamp: z.number().optional(),
});

export const CashflowDrillScopeZ = z.object({
  asOfDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid asOfDate'),
  bucket: z.string().optional(),
  legalEntityId: z.string().optional(),
  legalEntityName: z.string().optional(),
  counterpartyId: z.string().optional(),
  counterpartyName: z.string().optional(),
  flowDirection: z.enum(['inflow', 'outflow']).optional(),
  timestamp: z.number().optional(),
});

export const ConfirmationDrillScopeZ = z.object({
  runId: z.string().min(1),
  stage: z.string().optional(),
  productCode: z.string().optional(),
  counterpartyId: z.string().optional(),
  counterpartyName: z.string().optional(),
  blockingSettlement: z.boolean().optional(),
  timestamp: z.number().optional(),
});

export const ValuationDrillScopeZ = z.object({
  runId: z.string().min(1),
  traderDesk: z.string().optional(),
  strategy: z.string().optional(),
  dealId: z.string().optional(),
  materialityFlag: z.enum(['immaterial', 'review', 'material', 'critical']).optional(),
  timestamp: z.number().optional(),
});

export type ReconDrillScopeParsed = z.infer<typeof ReconDrillScopeZ>;
export type CashflowDrillScopeParsed = z.infer<typeof CashflowDrillScopeZ>;
export type ConfirmationDrillScopeParsed = z.infer<typeof ConfirmationDrillScopeZ>;
export type ValuationDrillScopeParsed = z.infer<typeof ValuationDrillScopeZ>;

// ---------------------------------------------------------------------------
// Shared base64url codec — duplicated across the four `_drillScope.ts` files
// historically; centralised here so the new safe-decode path uses one
// implementation.
// ---------------------------------------------------------------------------

export function encodeBase64UrlJson(value: unknown): string {
  const json = JSON.stringify(value);
  const bytes = new TextEncoder().encode(json);
  let binary = '';
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export function decodeBase64UrlJson(token: string): unknown {
  const normalized = token.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4 || 4)) % 4);
  const binary = atob(padded);
  const json = new TextDecoder().decode(
    Uint8Array.from(binary, (c) => c.charCodeAt(0)),
  );
  return JSON.parse(json);
}

/**
 * Generic safe-decode helper. Returns `T` on success, `null` on either a
 * decoding error (corrupt base64 / invalid JSON) or a Zod validation
 * failure. Never throws.
 */
export function safeDecodeScope<T>(
  token: string | null | undefined,
  schema: z.ZodType<T>,
): T | null {
  if (!token) return null;
  try {
    const raw = decodeBase64UrlJson(token);
    const result = schema.safeParse(raw);
    if (!result.success) {
      // eslint-disable-next-line no-console
      console.warn('[drill] scope failed schema validation', result.error.issues);
      return null;
    }
    return result.data;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[drill] scope failed to decode', err);
    return null;
  }
}

/**
 * Generic safe-encode helper. Validates with Zod before encoding and
 * stamps a `timestamp`. Throws if the input is structurally invalid —
 * call sites should never hand in untrusted data.
 */
export function safeEncodeScope<T extends Record<string, unknown>>(
  scope: T,
  schema: z.ZodType<T>,
): string {
  const stamped = { ...scope, timestamp: Date.now() } as T;
  const result = schema.safeParse(stamped);
  if (!result.success) {
    // eslint-disable-next-line no-console
    console.error('[drill] refused to encode invalid scope', result.error.issues);
    // Fall back to encoding the original scope without the bad fields
    // rather than throwing — keeps navigation working.
    return encodeBase64UrlJson({ ...scope, timestamp: Date.now() });
  }
  return encodeBase64UrlJson(result.data);
}
