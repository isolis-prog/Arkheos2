import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface FxRateRow {
  currency_from: string;
  currency_to: string;
  rate_date: string;
  rate_value: number;
}

/**
 * Fetch the latest FX rate per (from, to) pair for the current tenant.
 * Returned as a lookup map keyed by `${from}->${to}`.
 */
export function useLatestFxRates() {
  return useQuery({
    queryKey: ['fx-rates', 'latest'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fx_rates')
        .select('currency_from, currency_to, rate_date, rate_value')
        .order('rate_date', { ascending: false })
        .limit(2000);
      if (error) throw error;

      const map = new Map<string, FxRateRow>();
      (data ?? []).forEach((r) => {
        const key = `${r.currency_from}->${r.currency_to}`;
        if (!map.has(key)) {
          map.set(key, {
            currency_from: r.currency_from,
            currency_to: r.currency_to,
            rate_date: r.rate_date,
            rate_value: Number(r.rate_value),
          });
        }
      });
      return map;
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Convert an amount from one currency to another using the latest available
 * direct rate. Returns null if the conversion cannot be resolved.
 * Identity (same currency) returns the input unchanged.
 */
export function convertAmount(
  amount: number | null | undefined,
  from: string | null | undefined,
  to: string | null | undefined,
  rates: Map<string, FxRateRow> | undefined,
): number | null {
  if (amount === null || amount === undefined || Number.isNaN(amount)) return null;
  if (!from || !to) return null;
  if (from === to) return amount;
  if (!rates) return null;
  const direct = rates.get(`${from}->${to}`);
  if (direct) return amount * direct.rate_value;
  const inverse = rates.get(`${to}->${from}`);
  if (inverse && inverse.rate_value !== 0) return amount / inverse.rate_value;
  return null;
}
