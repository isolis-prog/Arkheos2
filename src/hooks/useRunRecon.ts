import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuditEvents } from '@/hooks/useAuditEvents';
import type { ReconciliationFilters } from '@/hooks/useReconciliationFilters';

const TENANT_ID = '3dde8f40-5bf4-1bbd-3214-b8f4ca780852';

export function useRunRecon() {
  const [isRunning, setIsRunning] = useState(false);
  const { toast } = useToast();
  const { recordEvent } = useAuditEvents();

  const runRecon = useCallback(async (appliedFilters: ReconciliationFilters) => {
    setIsRunning(true);

    try {
      // 1. Find a template to use (pick the first active one)
      const { data: templates, error: tplError } = await supabase
        .from('reconciliation_templates')
        .select('id')
        .eq('tenant_id', TENANT_ID)
        .eq('is_active', true)
        .limit(1);

      if (tplError) throw tplError;
      if (!templates || templates.length === 0) {
        throw new Error('No active reconciliation template found');
      }

      const templateId = templates[0].id;

      // 2. Build scope from applied filters
      const scope: Record<string, unknown> = {};
      if (appliedFilters.sourceSystem) scope.sourceSystem = appliedFilters.sourceSystem;
      if (appliedFilters.financialSystem) scope.financialSystem = appliedFilters.financialSystem;
      if (appliedFilters.periodStart) scope.periodStart = appliedFilters.periodStart.toISOString().split('T')[0];
      if (appliedFilters.periodEnd) scope.periodEnd = appliedFilters.periodEnd.toISOString().split('T')[0];
      if (appliedFilters.legalEntities.length > 0) scope.legalEntities = appliedFilters.legalEntities;
      if (appliedFilters.counterparties.length > 0) scope.counterparties = appliedFilters.counterparties;
      if (appliedFilters.portfolios.length > 0) scope.portfolios = appliedFilters.portfolios;
      if (appliedFilters.instrumentTypes.length > 0) scope.instrumentTypes = appliedFilters.instrumentTypes;
      if (appliedFilters.transactionTypes.length > 0) scope.transactionTypes = appliedFilters.transactionTypes;

      // 3. Create a reconciliation_run record
      const now = new Date().toISOString();
      const periodStart = appliedFilters.periodStart
        ? appliedFilters.periodStart.toISOString().split('T')[0]
        : new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
      const periodEnd = appliedFilters.periodEnd
        ? appliedFilters.periodEnd.toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];

      const { data: run, error: runError } = await supabase
        .from('reconciliation_runs')
        .insert([{
          template_id: templateId,
          tenant_id: TENANT_ID,
          status: 'pending',
          period_start: periodStart,
          period_end: periodEnd,
          started_at: now,
          metrics: JSON.parse(JSON.stringify({ scope, triggered_at: now })),
        }])
        .select('id')
        .single();

      if (runError) throw runError;

      toast({
        title: 'Recon job started',
        description: 'Reconciliation is running with your current filters.',
      });

      // Record audit event for the run
      recordEvent({
        moduleKey: 'reconciliations',
        entityType: 'Run',
        entityId: run.id,
        action: 'RUN',
        summary: `Recon run started for template ${templateId}`,
        afterState: { runId: run.id, templateId, scope },
        metadata: { periodStart, periodEnd, triggeredAt: now },
      });

      // 4. Invoke the run-matching edge function
      const { data: result, error: fnError } = await supabase.functions.invoke('run-matching', {
        body: {
          runId: run.id,
          tenantId: TENANT_ID,
        },
      });

      if (fnError) throw fnError;

      toast({
        title: 'Recon completed',
        description: `Match rate: ${result?.metrics?.match_rate ?? '—'}%. Auto-matched: ${result?.metrics?.auto_matched ?? 0}, Exceptions: ${result?.metrics?.exceptions_created ?? 0}.`,
      });

      recordEvent({
        moduleKey: 'reconciliations',
        entityType: 'Run',
        entityId: run.id,
        action: 'UPDATE',
        summary: `Recon run completed — match rate ${result?.metrics?.match_rate ?? '?'}%`,
        afterState: { status: 'completed', metrics: result?.metrics },
      });

      return true;
    } catch (error) {
      console.error('Run recon error:', error);
      toast({
        title: 'Recon failed',
        description: error instanceof Error ? error.message : 'An unexpected error occurred.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsRunning(false);
    }
  }, [toast]);

  return { runRecon, isRunning };
}
