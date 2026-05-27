import { useAuth } from '@/contexts/AuthContext';

/**
 * Returns the active tenant_id for the signed-in user, or `null` while the
 * profile is still loading / when the user is unauthenticated.
 *
 * Defense-in-depth helper: RLS already restricts cross-module break feeds
 * (`v_unified_breaks` is `security_invoker = true`, so each underlying table's
 * tenant policies apply). Callers still pass the tenant id explicitly so that:
 *   1. Queries fail fast / return empty when no tenant is resolved.
 *   2. React Query caches are keyed per tenant — switching accounts never
 *      surfaces stale rows from a previous tenant.
 *   3. The intent (tenant-scoped read) is visible at the call site.
 */
export function useCurrentTenantId(): string | null {
  const { profile } = useAuth();
  return profile?.tenant_id ?? null;
}
