import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const DEMO_TENANT_ID = '3dde8f40-5bf4-1bbd-3214-b8f4ca780852';
const DEMO_RUN_ID = '00000000-0000-0000-0000-000000000020';

export interface MatchGroup {
  id: string;
  matchKey: string;
  matchType: string;
  status: string;
  sideATotal: number;
  sideBTotal: number;
  delta: number;
  deltaPct: number;
}

export interface MatchRecord {
  id: string;
  dealId: string;
  sourceSystem: string;
  amount: number;
  strategy: string;
  feeType: string;
  counterparty: string;
  legalEntity: string;
  currency: string;
  docId: string | null;
  lineId: string | null;
}

export interface MatchPair {
  matchGroup: MatchGroup;
  sideA: MatchRecord | null;
  sideBRecords: MatchRecord[];
}

export interface BreakDetail {
  id: string;
  matchGroup: MatchGroup;
  breakType: string;
  severity: string;
  amountAtRisk: number;
  sideA: MatchRecord | null;
  sideB: MatchRecord | null;
  status: string;
}

export interface ReconciliationRunDetail {
  id: string;
  templateName: string;
  status: string;
  metrics: {
    total_side_a?: number;
    total_side_b?: number;
    matched?: number;
    breaks?: number;
    match_rate?: number;
    amount_at_risk?: number;
  };
  periodStart: string | null;
  periodEnd: string | null;
  startedAt: string;
  completedAt: string | null;
}

// Fetch run details
export function useReconciliationRun(runId: string) {
  return useQuery({
    queryKey: ['reconciliation-run', runId],
    queryFn: async (): Promise<ReconciliationRunDetail | null> => {
      // Use the demo run ID for the demo tenant
      const actualRunId = runId === 'run-1' ? DEMO_RUN_ID : runId;
      
      const { data, error } = await supabase
        .from('reconciliation_runs')
        .select(`
          id,
          status,
          metrics,
          period_start,
          period_end,
          started_at,
          completed_at,
          reconciliation_templates!inner(name)
        `)
        .eq('id', actualRunId)
        .single();

      if (error) throw error;
      if (!data) return null;

      const template = data.reconciliation_templates as { name: string };
      const metrics = data.metrics as ReconciliationRunDetail['metrics'] || {};

      return {
        id: data.id,
        templateName: template?.name || 'Unknown Template',
        status: data.status || 'unknown',
        metrics,
        periodStart: data.period_start,
        periodEnd: data.period_end,
        startedAt: data.started_at || '',
        completedAt: data.completed_at,
      };
    },
  });
}

// Fetch matched pairs
export function useMatchedPairs(runId: string) {
  return useQuery({
    queryKey: ['matched-pairs', runId],
    queryFn: async (): Promise<MatchGroup[]> => {
      const actualRunId = runId === 'run-1' ? DEMO_RUN_ID : runId;
      
      const { data, error } = await supabase
        .from('match_groups')
        .select('*')
        .eq('run_id', actualRunId)
        .eq('status', 'matched')
        .order('match_key');

      if (error) throw error;

      return (data || []).map((mg) => ({
        id: mg.id,
        matchKey: mg.match_key || '',
        matchType: mg.match_type,
        status: mg.status || 'matched',
        sideATotal: Number(mg.side_a_total) || 0,
        sideBTotal: Number(mg.side_b_total) || 0,
        delta: Number(mg.delta) || 0,
        deltaPct: Number(mg.delta_pct) || 0,
      }));
    },
  });
}

// Fetch breaks with exception details
export function useBreaks(runId: string) {
  return useQuery({
    queryKey: ['breaks', runId],
    queryFn: async (): Promise<BreakDetail[]> => {
      const actualRunId = runId === 'run-1' ? DEMO_RUN_ID : runId;
      
      // Get match groups with break status
      const { data: matchGroups, error: mgError } = await supabase
        .from('match_groups')
        .select('*')
        .eq('run_id', actualRunId)
        .eq('status', 'break')
        .order('delta', { ascending: false });

      if (mgError) throw mgError;

      // Get exceptions for these match groups
      const matchGroupIds = (matchGroups || []).map(mg => mg.id);
      
      const { data: exceptions, error: exError } = await supabase
        .from('exceptions')
        .select('*')
        .in('match_group_id', matchGroupIds.length > 0 ? matchGroupIds : ['none']);

      if (exError) throw exError;

      const exceptionsMap = new Map(
        (exceptions || []).map(e => [e.match_group_id, e])
      );

      return (matchGroups || []).map((mg) => {
        const exception = exceptionsMap.get(mg.id);
        return {
          id: mg.id,
          matchGroup: {
            id: mg.id,
            matchKey: mg.match_key || '',
            matchType: mg.match_type,
            status: mg.status || 'break',
            sideATotal: Number(mg.side_a_total) || 0,
            sideBTotal: Number(mg.side_b_total) || 0,
            delta: Number(mg.delta) || 0,
            deltaPct: Number(mg.delta_pct) || 0,
          },
          breakType: exception?.break_type || 'UNKNOWN',
          severity: exception?.severity || 'medium',
          amountAtRisk: Number(exception?.amount_at_risk) || Math.abs(Number(mg.delta)),
          sideA: null,
          sideB: null,
          status: exception?.status || 'open',
        };
      });
    },
  });
}

// Fetch unmatched records (orphans)
export function useUnmatchedRecords(runId: string) {
  return useQuery({
    queryKey: ['unmatched', runId],
    queryFn: async () => {
      const actualRunId = runId === 'run-1' ? DEMO_RUN_ID : runId;
      
      // Get match groups with unmatched status
      const { data: matchGroups, error } = await supabase
        .from('match_groups')
        .select('*')
        .eq('run_id', actualRunId)
        .eq('match_type', 'unmatched')
        .order('match_key');

      if (error) throw error;

      // Separate ETRM and NetSuite orphans based on which side has data
      const etrmOrphans = (matchGroups || []).filter(mg => mg.side_a_total && !mg.side_b_total);
      const netsuiteOrphans = (matchGroups || []).filter(mg => mg.side_b_total && !mg.side_a_total);

      return {
        etrm: etrmOrphans.map(mg => ({
          id: mg.id,
          matchKey: mg.match_key || '',
          amount: Number(mg.side_a_total) || 0,
        })),
        netsuite: netsuiteOrphans.map(mg => ({
          id: mg.id,
          matchKey: mg.match_key || '',
          amount: Number(mg.side_b_total) || 0,
        })),
      };
    },
  });
}

// Fetch canonical records for side-by-side view
export function useCanonicalRecords() {
  return useQuery({
    queryKey: ['canonical-records'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('canonical_records')
        .select('*')
        .eq('tenant_id', DEMO_TENANT_ID)
        .order('deal_id');

      if (error) throw error;

      const records = (data || []).map((r) => ({
        id: r.id,
        dealId: r.deal_id || '',
        sourceSystem: r.source_system,
        amount: Number(r.amount) || 0,
        strategy: r.strategy || '',
        feeType: r.fee_type || '',
        counterparty: r.counterparty || '',
        legalEntity: r.legal_entity || '',
        currency: r.currency || 'USD',
        docId: r.doc_id,
        lineId: r.line_id,
      }));

      return {
        etrm: records.filter(r => r.sourceSystem === 'etrm'),
        netsuite: records.filter(r => r.sourceSystem === 'netsuite'),
      };
    },
  });
}
