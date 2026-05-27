import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { buildModuleSourceUrl } from '@/lib/drill/module-registry';
import { useCurrentTenantId } from '@/hooks/useCurrentTenantId';

export type UnifiedBreakModule =
  | 'reconciliations'
  | 'cashflows'
  | 'valuation_recon'
  | 'confirmations_recon';

export type UnifiedBreakSeverity = 'critical' | 'material' | 'review';

export interface UnifiedBreakRow {
  break_id: string;
  tenant_id: string;
  module: UnifiedBreakModule;
  deal_id: string | null;
  legal_entity_id: string | null;
  counterparty_id: string | null;
  amount_delta_usd: number;
  age_days: number;
  severity: UnifiedBreakSeverity;
  status: string;
  assigned_to: string | null;
  created_at: string;
  run_id: string | null;
  source_ref: string | null;
}

export interface UnifiedBreaksFilters {
  module?: UnifiedBreakModule[] | UnifiedBreakModule;
  severity?: UnifiedBreakSeverity;
  assignedToMe?: boolean;
  counterpartyId?: string;
  dealId?: string;
  limit?: number;
}

const SLA_DAYS = 5;

export interface UnifiedBreakKpis {
  totalOpen: number;
  totalUsdExposure: number;
  oldestAgeDays: number;
  slaBreaches: number;
}

export function computeKpis(rows: UnifiedBreakRow[]): UnifiedBreakKpis {
  let totalUsdExposure = 0;
  let oldestAgeDays = 0;
  let slaBreaches = 0;
  for (const row of rows) {
    totalUsdExposure += Number(row.amount_delta_usd ?? 0);
    if (row.age_days > oldestAgeDays) oldestAgeDays = row.age_days;
    if (row.age_days > SLA_DAYS) slaBreaches += 1;
  }
  return {
    totalOpen: rows.length,
    totalUsdExposure,
    oldestAgeDays,
    slaBreaches,
  };
}

export function useUnifiedBreaks(filters: UnifiedBreaksFilters = {}) {
  const tenantId = useCurrentTenantId();

  return useQuery({
    // Cache is partitioned by tenant so switching accounts never replays
    // rows from a previous tenant.
    queryKey: ['unified-breaks', tenantId, filters],
    enabled: !!tenantId,
    queryFn: async () => {
      // Defense-in-depth: RLS already restricts the view to the caller's
      // tenant (security_invoker on underlying tables), but we filter
      // explicitly so the intent is visible and an empty/missing tenant
      // never silently widens the query.
      if (!tenantId) return [];

      let query = supabase
        .from('v_unified_breaks' as never)
        .select('*')
        .eq('tenant_id', tenantId)
        .order('age_days', { ascending: false })
        .limit(filters.limit ?? 1000);

      if (filters.module) {
        const modules = Array.isArray(filters.module) ? filters.module : [filters.module];
        query = query.in('module', modules as string[]);
      }
      if (filters.severity) {
        query = query.eq('severity', filters.severity);
      }
      if (filters.counterpartyId) {
        query = query.eq('counterparty_id', filters.counterpartyId);
      }
      if (filters.dealId) {
        query = query.eq('deal_id', filters.dealId);
      }
      if (filters.assignedToMe) {
        const { data: userRes } = await supabase.auth.getUser();
        if (userRes?.user?.id) {
          query = query.eq('assigned_to', userRes.user.id);
        }
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as unknown as UnifiedBreakRow[];
    },
  });
}

const SEVERITY_RANK: Record<UnifiedBreakSeverity, number> = {
  critical: 0,
  material: 1,
  review: 2,
};

export function sortByUrgency(rows: UnifiedBreakRow[]): UnifiedBreakRow[] {
  return [...rows].sort((a, b) => {
    const sev = SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity];
    if (sev !== 0) return sev;
    return b.age_days - a.age_days;
  });
}

/**
 * Resolves the drill landing URL for a unified break.
 *
 * Backed by the shared `MODULE_REGISTRY` (see `src/lib/drill/module-registry.ts`)
 * so adding a new module never requires editing this hook.
 */
export function buildSourceUrl(row: UnifiedBreakRow): string {
  return buildModuleSourceUrl(row);
}
