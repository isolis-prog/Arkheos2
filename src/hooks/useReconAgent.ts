import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { DEMO_TENANT_ID } from '@/lib/recon-demo-data';

export interface ReconRun {
  id: string;
  tenant_id: string;
  period_start: string;
  period_end: string;
  source_a_name: string;
  source_b_name: string;
  created_at: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  ruleset_version: string;
  model_version: string;
  metrics: Record<string, any>;
  completed_at: string | null;
}

export interface ReconRecord {
  id: string;
  run_id: string;
  source: 'A' | 'B';
  external_id: string | null;
  record_date: string | null;
  amount: number | null;
  currency: string | null;
  counterparty: string | null;
  description: string | null;
  raw_json: Record<string, any> | null;
}

export interface ExceptionCase {
  id: string;
  run_id: string;
  record_id: string | null;
  exception_type: string;
  status: string;
  severity: string;
  owner_id: string | null;
  summary: string | null;
  evidence: Record<string, any>;
  recommended_actions: any[];
  resolution_code: string | null;
  resolution_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface MatchCandidate {
  id: string;
  run_id: string;
  left_record_id: string;
  right_record_id: string;
  score_total: number;
  score_breakdown: Record<string, number>;
  reason_codes: string[];
  amount_delta: number;
  date_delta: number;
  left_record?: ReconRecord;
  right_record?: ReconRecord;
}

export function useReconRuns() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const runsQuery = useQuery({
    queryKey: ['recon-runs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recon_runs')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as ReconRun[];
    },
  });

  const createRun = useMutation({
    mutationFn: async (params: {
      periodStart: string;
      periodEnd: string;
      sourceAName: string;
      sourceBName: string;
      recordsA: any[];
      recordsB: any[];
    }) => {
      // Create the run
      const { data: run, error: runError } = await supabase
        .from('recon_runs')
        .insert({
          tenant_id: DEMO_TENANT_ID,
          period_start: params.periodStart,
          period_end: params.periodEnd,
          source_a_name: params.sourceAName,
          source_b_name: params.sourceBName,
          status: 'pending',
        })
        .select()
        .single();

      if (runError) throw runError;

      // Insert Source A records
      const recordsA = params.recordsA.map(r => ({
        run_id: run.id,
        source: 'A',
        external_id: r.external_id,
        record_date: r.record_date,
        amount: r.amount,
        currency: r.currency || 'USD',
        counterparty: r.counterparty,
        description: r.description,
        raw_json: r,
      }));

      if (recordsA.length > 0) {
        const { error: aError } = await supabase.from('recon_records').insert(recordsA);
        if (aError) throw aError;
      }

      // Insert Source B records
      const recordsB = params.recordsB.map(r => ({
        run_id: run.id,
        source: 'B',
        external_id: r.external_id,
        record_date: r.record_date,
        amount: r.amount,
        currency: r.currency || 'USD',
        counterparty: r.counterparty,
        description: r.description,
        raw_json: r,
      }));

      if (recordsB.length > 0) {
        const { error: bError } = await supabase.from('recon_records').insert(recordsB);
        if (bError) throw bError;
      }

      return run;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recon-runs'] });
      toast({ title: 'Run created', description: 'Reconciliation run created successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const runMatching = useMutation({
    mutationFn: async (runId: string) => {
      const { data, error } = await supabase.functions.invoke('run-matching', {
        body: { runId, tenantId: DEMO_TENANT_ID },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recon-runs'] });
      toast({ title: 'Matching complete', description: 'Reconciliation matching has finished' });
    },
    onError: (error) => {
      toast({ title: 'Matching failed', description: error.message, variant: 'destructive' });
    },
  });

  return {
    runs: runsQuery.data || [],
    isLoading: runsQuery.isLoading,
    createRun,
    runMatching,
    refetch: runsQuery.refetch,
  };
}

export function useReconRunDetails(runId: string | undefined) {
  const runQuery = useQuery({
    queryKey: ['recon-run', runId],
    queryFn: async () => {
      if (!runId) return null;
      const { data, error } = await supabase
        .from('recon_runs')
        .select('*')
        .eq('id', runId)
        .single();
      
      if (error) throw error;
      return data as ReconRun;
    },
    enabled: !!runId,
  });

  const exceptionsQuery = useQuery({
    queryKey: ['recon-exceptions', runId],
    queryFn: async () => {
      if (!runId) return [];
      const { data, error } = await supabase
        .from('exception_cases')
        .select('*')
        .eq('run_id', runId)
        .order('severity', { ascending: false })
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as ExceptionCase[];
    },
    enabled: !!runId,
  });

  const candidatesQuery = useQuery({
    queryKey: ['recon-candidates', runId],
    queryFn: async () => {
      if (!runId) return [];
      const { data, error } = await supabase
        .from('match_candidates')
        .select('*')
        .eq('run_id', runId)
        .order('score_total', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data as MatchCandidate[];
    },
    enabled: !!runId,
  });

  return {
    run: runQuery.data,
    exceptions: exceptionsQuery.data || [],
    candidates: candidatesQuery.data || [],
    isLoading: runQuery.isLoading || exceptionsQuery.isLoading,
    refetch: () => {
      runQuery.refetch();
      exceptionsQuery.refetch();
      candidatesQuery.refetch();
    },
  };
}

export function useAgentTools() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const callAgent = useMutation({
    mutationFn: async (params: Record<string, any>) => {
      const { data, error } = await supabase.functions.invoke('recon-agent', {
        body: { ...params, tenantId: DEMO_TENANT_ID },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recon-exceptions'] });
    },
    onError: (error) => {
      toast({ title: 'Agent error', description: error.message, variant: 'destructive' });
    },
  });

  const analyzeException = (caseId: string) => 
    callAgent.mutateAsync({ action: 'analyze_exception', caseId });

  const proposeMatch = (caseId: string, candidateId: string, rationale: string, confidence: number) =>
    callAgent.mutateAsync({ action: 'propose_match', caseId, candidateId, rationale, confidence });

  const rejectCandidate = (caseId: string, candidateId: string, rationale: string) =>
    callAgent.mutateAsync({ action: 'reject_candidate', caseId, candidateId, rationale });

  const approveProposal = (decisionId: string) =>
    callAgent.mutateAsync({ action: 'approve_proposal', decisionId });

  const closeException = (caseId: string, resolutionCode: string, notes: string) =>
    callAgent.mutateAsync({ action: 'close_exception', caseId, resolutionCode, notes });

  const autoTriage = (runId: string) =>
    callAgent.mutateAsync({ action: 'auto_triage', runId });

  const generateReport = (runId: string, format: 'pdf' | 'csv' | 'json') =>
    callAgent.mutateAsync({ action: 'generate_audit_report', runId, format });

  return {
    analyzeException,
    proposeMatch,
    rejectCandidate,
    approveProposal,
    closeException,
    autoTriage,
    generateReport,
    isLoading: callAgent.isPending,
  };
}
