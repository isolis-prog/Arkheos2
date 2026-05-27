import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const TENANT_ID = '3dde8f40-5bf4-1bbd-3214-b8f4ca780852';

export interface PeriodLockState {
  isLocked: boolean;
  periodName: string | null;
  periodEnd: string | null;
  signOffStatus: string | null;
  lockedAt: string | null;
  isLoading: boolean;
  reason: string | null;
}

/**
 * Resolves the accounting period covering the given as-of date and
 * exposes whether it is locked (period closed). Used across the
 * Cashflows L2–L6 drill stack to disable resolution / export actions.
 */
export function usePeriodLock(asOfDate: string | null | undefined): PeriodLockState {
  const enabled = Boolean(asOfDate);
  const { data, isLoading } = useQuery({
    queryKey: ['accounting-period-lock', asOfDate],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('accounting_periods')
        .select('period_name, period_start, period_end, is_locked, locked_at, sign_off_status')
        .eq('tenant_id', TENANT_ID)
        .lte('period_start', asOfDate as string)
        .gte('period_end', asOfDate as string)
        .order('period_end', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    staleTime: 60_000,
  });

  const isLocked = Boolean(data?.is_locked);
  return {
    isLocked,
    periodName: data?.period_name ?? null,
    periodEnd: data?.period_end ?? null,
    signOffStatus: data?.sign_off_status ?? null,
    lockedAt: data?.locked_at ?? null,
    isLoading,
    reason: isLocked
      ? `Period ${data?.period_name ?? ''} is locked${data?.locked_at ? ` since ${new Date(data.locked_at).toLocaleDateString()}` : ''}. Resolution and export actions are disabled.`
      : null,
  };
}
