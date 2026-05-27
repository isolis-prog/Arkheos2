import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type SearchResultType = 'deal' | 'counterparty' | 'invoice';

export interface ModuleBadge {
  module: 'reconciliations' | 'cashflows' | 'valuation_recon' | 'confirmations_recon';
  count: number;
}

export interface CrossModuleSearchResult {
  type: SearchResultType;
  id: string;
  label: string;
  sublabel?: string;
  modules: ModuleBadge[];
  /** suggested route on selection */
  href: string;
}

export interface CrossModuleSearchData {
  deals: CrossModuleSearchResult[];
  counterparties: CrossModuleSearchResult[];
  invoices: CrossModuleSearchResult[];
}

const EMPTY: CrossModuleSearchData = { deals: [], counterparties: [], invoices: [] };

export function useCrossModuleSearch(query: string, enabled = true) {
  const trimmed = query.trim();
  return useQuery({
    queryKey: ['cross-module-search', trimmed],
    enabled: enabled && trimmed.length >= 2,
    queryFn: async (): Promise<CrossModuleSearchData> => {
      const like = `%${trimmed}%`;

      const [trades, counterparties, invoices, breaks] = await Promise.all([
        supabase
          .from('canonical_trades')
          .select('id, trade_ref, counterparty_id, product_id')
          .ilike('trade_ref', like)
          .limit(8),
        supabase
          .from('canonical_counterparties')
          .select('id, name, short_name')
          .ilike('name', like)
          .limit(8),
        supabase
          .from('canonical_invoices')
          .select('id, invoice_ref, amount, currency')
          .ilike('invoice_ref', like)
          .limit(8),
        supabase
          .from('v_unified_breaks' as never)
          .select('module, deal_id, counterparty_id')
          .or(`deal_id.ilike.${like}`)
          .limit(200),
      ]);

      if (trades.error) throw trades.error;
      if (counterparties.error) throw counterparties.error;
      if (invoices.error) throw invoices.error;

      const breakRows = (breaks.data ?? []) as Array<{
        module: ModuleBadge['module'];
        deal_id: string | null;
        counterparty_id: string | null;
      }>;

      const dealBadgeMap = new Map<string, Map<ModuleBadge['module'], number>>();
      const cpBadgeMap = new Map<string, Map<ModuleBadge['module'], number>>();
      for (const row of breakRows) {
        if (row.deal_id) {
          const m = dealBadgeMap.get(row.deal_id) ?? new Map();
          m.set(row.module, (m.get(row.module) ?? 0) + 1);
          dealBadgeMap.set(row.deal_id, m);
        }
        if (row.counterparty_id) {
          const m = cpBadgeMap.get(row.counterparty_id) ?? new Map();
          m.set(row.module, (m.get(row.module) ?? 0) + 1);
          cpBadgeMap.set(row.counterparty_id, m);
        }
      }

      const toBadges = (m: Map<ModuleBadge['module'], number> | undefined): ModuleBadge[] =>
        m ? Array.from(m, ([module, count]) => ({ module, count })) : [];

      const deals: CrossModuleSearchResult[] = (trades.data ?? []).map((t: any) => ({
        type: 'deal',
        id: t.trade_ref,
        label: t.trade_ref,
        sublabel: 'Deal',
        modules: toBadges(dealBadgeMap.get(t.trade_ref)),
        href: `/deal/${encodeURIComponent(t.trade_ref)}`,
      }));

      const cps: CrossModuleSearchResult[] = (counterparties.data ?? []).map((c: any) => ({
        type: 'counterparty',
        id: c.id,
        label: c.short_name || c.name,
        sublabel: 'Counterparty',
        modules: toBadges(cpBadgeMap.get(c.id)),
        href: `/inbox?counterpartyId=${encodeURIComponent(c.id)}`,
      }));

      const invs: CrossModuleSearchResult[] = (invoices.data ?? []).map((inv: any) => ({
        type: 'invoice',
        id: inv.id,
        label: inv.invoice_ref,
        sublabel: inv.amount ? `${inv.amount} ${inv.currency ?? ''}` : 'Invoice',
        modules: [],
        href: `/cashflows/documents`,
      }));

      return { deals, counterparties: cps, invoices: invs };
    },
    staleTime: 30_000,
  });
}

export function isEmpty(data: CrossModuleSearchData | undefined): boolean {
  if (!data) return true;
  return data.deals.length === 0 && data.counterparties.length === 0 && data.invoices.length === 0;
}

export const EMPTY_RESULTS = EMPTY;
