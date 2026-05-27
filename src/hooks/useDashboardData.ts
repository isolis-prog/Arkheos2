import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const DEMO_TENANT_ID = '3dde8f40-5bf4-1bbd-3214-b8f4ca780852';

interface DashboardMetrics {
  matchRate: number;
  openExceptions: number;
  criticalExceptions: number;
  highExceptions: number;
  pendingAmendments: number;
  amountAtRisk: number;
  lastRunTime: string | null;
}

interface RecentRun {
  id: string;
  template: string;
  period: string;
  status: string;
  matchRate: number;
  breaks: number;
}

interface TopException {
  id: string;
  dealId: string;
  type: string;
  amount: number;
  age: number;
  severity: string;
}

interface BreakByType {
  name: string;
  value: number;
  color: string;
}

interface MatchRateTrend {
  name: string;
  rate: number;
}

const breakTypeColors: Record<string, string> = {
  'AMOUNT_MISMATCH': 'hsl(38, 92%, 50%)',
  'MISSING_IN_ERP': 'hsl(0, 72%, 51%)',
  'MISSING_IN_ETRM': 'hsl(199, 89%, 48%)',
  'CURRENCY_MISMATCH': 'hsl(280, 68%, 60%)',
  'DATE_MISMATCH': 'hsl(142, 76%, 36%)',
  'DUPLICATE_IN_ERP': 'hsl(330, 72%, 51%)',
  'DUPLICATE_IN_ETRM': 'hsl(180, 60%, 45%)',
  'KEY_MISMATCH': 'hsl(45, 93%, 47%)',
  'COMPLEX_GROUP': 'hsl(215, 16%, 47%)',
};

const breakTypeLabels: Record<string, string> = {
  'AMOUNT_MISMATCH': 'Amount Mismatch',
  'MISSING_IN_ERP': 'Missing in ERP',
  'MISSING_IN_ETRM': 'Missing in ETRM',
  'CURRENCY_MISMATCH': 'Currency Mismatch',
  'DATE_MISMATCH': 'Date Mismatch',
  'DUPLICATE_IN_ERP': 'Duplicate in ERP',
  'DUPLICATE_IN_ETRM': 'Duplicate in ETRM',
  'KEY_MISMATCH': 'Key Mismatch',
  'COMPLEX_GROUP': 'Complex Group',
};

export function useDashboardMetrics() {
  return useQuery({
    queryKey: ['dashboard-metrics', DEMO_TENANT_ID],
    queryFn: async (): Promise<DashboardMetrics> => {
      // Get latest completed run
      const { data: latestRun } = await supabase
        .from('reconciliation_runs')
        .select('metrics, completed_at')
        .eq('tenant_id', DEMO_TENANT_ID)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Get open exceptions count by severity
      const { data: exceptions } = await supabase
        .from('exceptions')
        .select('severity, amount_at_risk')
        .eq('tenant_id', DEMO_TENANT_ID)
        .in('status', ['open', 'in_progress']);

      const criticalCount = exceptions?.filter(e => e.severity === 'critical').length || 0;
      const highCount = exceptions?.filter(e => e.severity === 'high').length || 0;
      const totalAmount = exceptions?.reduce((sum, e) => sum + (e.amount_at_risk || 0), 0) || 0;

      // Get pending amendments count
      const { count: pendingAmendments } = await supabase
        .from('amendment_plans')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', DEMO_TENANT_ID)
        .in('status', ['proposed', 'pending_approval']);

      const metrics = latestRun?.metrics as Record<string, number> | null;

      return {
        matchRate: metrics?.match_rate || 0,
        openExceptions: exceptions?.length || 0,
        criticalExceptions: criticalCount,
        highExceptions: highCount,
        pendingAmendments: pendingAmendments || 0,
        amountAtRisk: totalAmount,
        lastRunTime: latestRun?.completed_at || null,
      };
    },
  });
}

export function useRecentRuns() {
  return useQuery({
    queryKey: ['recent-runs', DEMO_TENANT_ID],
    queryFn: async (): Promise<RecentRun[]> => {
      const { data: runs, error } = await supabase
        .from('reconciliation_runs')
        .select(`
          id,
          status,
          period_start,
          period_end,
          metrics,
          reconciliation_templates!inner(name)
        `)
        .eq('tenant_id', DEMO_TENANT_ID)
        .order('started_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      return (runs || []).map((run) => {
        const metrics = run.metrics as Record<string, number> | null;
        const periodStart = run.period_start ? new Date(run.period_start) : null;
        const periodEnd = run.period_end ? new Date(run.period_end) : null;
        
        let period = 'N/A';
        if (periodStart && periodEnd) {
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          period = `${monthNames[periodStart.getMonth()]} ${periodStart.getFullYear()}`;
        }

        return {
          id: run.id,
          template: (run.reconciliation_templates as { name: string })?.name || 'Unknown',
          period,
          status: run.status || 'unknown',
          matchRate: metrics?.match_rate || 0,
          breaks: metrics?.breaks || 0,
        };
      });
    },
  });
}

export function useTopExceptions() {
  return useQuery({
    queryKey: ['top-exceptions', DEMO_TENANT_ID],
    queryFn: async (): Promise<TopException[]> => {
      const { data: exceptions, error } = await supabase
        .from('exceptions')
        .select('id, break_type, severity, amount_at_risk, created_at, metadata')
        .eq('tenant_id', DEMO_TENANT_ID)
        .in('status', ['open', 'in_progress'])
        .order('amount_at_risk', { ascending: false })
        .limit(5);

      if (error) throw error;

      return (exceptions || []).map((exc) => {
        const metadata = exc.metadata as Record<string, unknown> | null;
        const matchKey = (metadata?.match_key as string) || '';
        const dealId = matchKey.split('|')[0] || `EXC-${exc.id.slice(0, 8)}`;
        
        const createdAt = new Date(exc.created_at || '');
        const now = new Date();
        const age = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

        return {
          id: exc.id,
          dealId,
          type: exc.break_type,
          amount: exc.amount_at_risk || 0,
          age,
          severity: exc.severity || 'medium',
        };
      });
    },
  });
}

export function useBreaksByType() {
  return useQuery({
    queryKey: ['breaks-by-type', DEMO_TENANT_ID],
    queryFn: async (): Promise<BreakByType[]> => {
      const { data: exceptions, error } = await supabase
        .from('exceptions')
        .select('break_type')
        .eq('tenant_id', DEMO_TENANT_ID);

      if (error) throw error;

      const counts: Record<string, number> = {};
      exceptions?.forEach((exc) => {
        counts[exc.break_type] = (counts[exc.break_type] || 0) + 1;
      });

      const total = Object.values(counts).reduce((sum, c) => sum + c, 0);

      return Object.entries(counts)
        .map(([type, count]) => ({
          name: breakTypeLabels[type] || type.replace(/_/g, ' '),
          value: total > 0 ? Math.round((count / total) * 100) : 0,
          color: breakTypeColors[type] || 'hsl(215, 16%, 47%)',
        }))
        .sort((a, b) => b.value - a.value);
    },
  });
}

export function useMatchRateTrend() {
  return useQuery({
    queryKey: ['match-rate-trend', DEMO_TENANT_ID],
    queryFn: async (): Promise<MatchRateTrend[]> => {
      const { data: runs, error } = await supabase
        .from('reconciliation_runs')
        .select('metrics, period_start')
        .eq('tenant_id', DEMO_TENANT_ID)
        .eq('status', 'completed')
        .order('period_start', { ascending: true })
        .limit(6);

      if (error) throw error;

      if (!runs || runs.length === 0) {
        // Return demo data if no runs exist
        return [
          { name: 'Jan', rate: 92 },
          { name: 'Feb', rate: 94 },
          { name: 'Mar', rate: 91 },
          { name: 'Apr', rate: 95 },
          { name: 'May', rate: 93 },
          { name: 'Jun', rate: 96 },
        ];
      }

      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      return runs.map((run) => {
        const metrics = run.metrics as Record<string, number> | null;
        const periodStart = run.period_start ? new Date(run.period_start) : new Date();
        
        return {
          name: monthNames[periodStart.getMonth()],
          rate: metrics?.match_rate || 0,
        };
      });
    },
  });
}
