import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const DEMO_TENANT_ID = '3dde8f40-5bf4-1bbd-3214-b8f4ca780852';

// ── Executive Summary ──────────────────────────────────────────────
export interface ExecutiveMetrics {
  matchRate: number;
  unmatchedAmount: number;
  openExceptions: number;
  avgAgingDays: number;
  slaBreaches: number;
  closeReadinessPct: number;
  postingSuccessRate: number;
  dataQualityScore: number;
}

export function useExecutiveMetrics() {
  return useQuery({
    queryKey: ['analytics-executive', DEMO_TENANT_ID],
    queryFn: async (): Promise<ExecutiveMetrics> => {
      const [exceptionsRes, runsRes, docsRes] = await Promise.all([
        supabase
          .from('exceptions')
          .select('severity, amount_at_risk, created_at, sla_due_date, status')
          .eq('tenant_id', DEMO_TENANT_ID),
        supabase
          .from('reconciliation_runs')
          .select('metrics, status')
          .eq('tenant_id', DEMO_TENANT_ID)
          .eq('status', 'completed')
          .order('completed_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('t2c_documents')
          .select('status')
          .eq('tenant_id', DEMO_TENANT_ID),
      ]);

      const exceptions = exceptionsRes.data || [];
      const openExceptions = exceptions.filter(e => e.status === 'open' || e.status === 'in_progress');
      const now = new Date();

      const totalAging = openExceptions.reduce((sum, e) => {
        const created = new Date(e.created_at || '');
        return sum + Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
      }, 0);

      const slaBreaches = openExceptions.filter(e => {
        if (!e.sla_due_date) return false;
        return new Date(e.sla_due_date) < now;
      }).length;

      const unmatchedAmount = openExceptions.reduce((s, e) => s + (e.amount_at_risk || 0), 0);

      const metrics = runsRes.data?.metrics as Record<string, number> | null;

      const docs = docsRes.data || [];
      const postedDocs = docs.filter(d => d.status === 'posted').length;

      return {
        matchRate: metrics?.match_rate || 0,
        unmatchedAmount,
        openExceptions: openExceptions.length,
        avgAgingDays: openExceptions.length > 0 ? Math.round(totalAging / openExceptions.length) : 0,
        slaBreaches,
        closeReadinessPct: exceptions.length > 0
          ? Math.round(((exceptions.length - openExceptions.length) / exceptions.length) * 100)
          : 100,
        postingSuccessRate: docs.length > 0 ? Math.round((postedDocs / docs.length) * 100) : 100,
        dataQualityScore: 94, // placeholder — computed from data quality module
      };
    },
  });
}

// ── Exception Insights ─────────────────────────────────────────────
export interface ExceptionInsight {
  breakType: string;
  count: number;
  totalAmount: number;
  avgAge: number;
  pctOfTotal: number;
}

export interface ExceptionTrend {
  month: string;
  opened: number;
  resolved: number;
}

export function useExceptionInsights() {
  return useQuery({
    queryKey: ['analytics-exception-insights', DEMO_TENANT_ID],
    queryFn: async () => {
      const { data: exceptions } = await supabase
        .from('exceptions')
        .select('break_type, severity, amount_at_risk, created_at, status, resolved_at')
        .eq('tenant_id', DEMO_TENANT_ID);

      const all = exceptions || [];
      const now = new Date();
      const total = all.length || 1;

      // By break type
      const byType: Record<string, { count: number; amount: number; aging: number }> = {};
      all.forEach(e => {
        if (!byType[e.break_type]) byType[e.break_type] = { count: 0, amount: 0, aging: 0 };
        byType[e.break_type].count++;
        byType[e.break_type].amount += e.amount_at_risk || 0;
        const age = Math.floor((now.getTime() - new Date(e.created_at || '').getTime()) / 86400000);
        byType[e.break_type].aging += age;
      });

      const insights: ExceptionInsight[] = Object.entries(byType)
        .map(([type, d]) => ({
          breakType: type.replace(/_/g, ' '),
          count: d.count,
          totalAmount: d.amount,
          avgAge: Math.round(d.aging / d.count),
          pctOfTotal: Math.round((d.count / total) * 100),
        }))
        .sort((a, b) => b.count - a.count);

      // By severity
      const bySeverity: Record<string, number> = {};
      all.forEach(e => {
        const sev = e.severity || 'medium';
        bySeverity[sev] = (bySeverity[sev] || 0) + 1;
      });

      // Monthly trends (last 6 months)
      const trends: ExceptionTrend[] = [];
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const m = d.getMonth();
        const y = d.getFullYear();
        const opened = all.filter(e => {
          const c = new Date(e.created_at || '');
          return c.getMonth() === m && c.getFullYear() === y;
        }).length;
        const resolved = all.filter(e => {
          if (!e.resolved_at) return false;
          const r = new Date(e.resolved_at);
          return r.getMonth() === m && r.getFullYear() === y;
        }).length;
        trends.push({ month: monthNames[m], opened, resolved });
      }

      // Top entities (from metadata)
      const topEntities: { entity: string; count: number }[] = [];

      return { insights, bySeverity, trends, topEntities };
    },
  });
}

// ── Posting Health ─────────────────────────────────────────────────
export interface PostingHealthMetrics {
  totalPostings: number;
  successRate: number;
  failedCount: number;
  reversedCount: number;
  byDocType: { type: string; total: number; failed: number }[];
  recentFailures: { id: string; docType: string; error: string; createdAt: string }[];
}

export function usePostingHealth() {
  return useQuery({
    queryKey: ['analytics-posting-health', DEMO_TENANT_ID],
    queryFn: async (): Promise<PostingHealthMetrics> => {
      const { data: docs } = await supabase
        .from('t2c_documents')
        .select('id, doc_type, status, validation_errors, created_at')
        .eq('tenant_id', DEMO_TENANT_ID);

      const all = docs || [];
      const failed = all.filter(d => d.status === 'failed');
      const reversed = all.filter(d => d.status === 'reversed');

      const byDocType: Record<string, { total: number; failed: number }> = {};
      all.forEach(d => {
        if (!byDocType[d.doc_type]) byDocType[d.doc_type] = { total: 0, failed: 0 };
        byDocType[d.doc_type].total++;
        if (d.status === 'failed') byDocType[d.doc_type].failed++;
      });

      return {
        totalPostings: all.length,
        successRate: all.length > 0 ? Math.round(((all.length - failed.length) / all.length) * 100) : 100,
        failedCount: failed.length,
        reversedCount: reversed.length,
        byDocType: Object.entries(byDocType).map(([type, d]) => ({ type, ...d })),
        recentFailures: failed.slice(0, 10).map(d => ({
          id: d.id,
          docType: d.doc_type,
          error: (d.validation_errors as string) || 'Unknown error',
          createdAt: d.created_at || '',
        })),
      };
    },
  });
}

// ── Anomaly Detection (Z-Score / IQR heuristics) ──────────────────
export interface Anomaly {
  id: string;
  metricKey: string;
  entityType: string;
  entityId: string;
  observedValue: number;
  expectedValue: number;
  zScore: number;
  severity: string;
  explanation: string;
  detectedAt: string;
  isAcknowledged: boolean;
}

export function useAnomalyDetection() {
  return useQuery({
    queryKey: ['analytics-anomalies', DEMO_TENANT_ID],
    queryFn: async (): Promise<Anomaly[]> => {
      // Run heuristic anomaly detection on exception amounts
      const { data: exceptions } = await supabase
        .from('exceptions')
        .select('id, break_type, amount_at_risk, created_at')
        .eq('tenant_id', DEMO_TENANT_ID)
        .not('amount_at_risk', 'is', null);

      const all = exceptions || [];
      if (all.length < 5) return generateDemoAnomalies();

      const amounts = all.map(e => e.amount_at_risk || 0);
      const mean = amounts.reduce((s, v) => s + v, 0) / amounts.length;
      const stdDev = Math.sqrt(amounts.reduce((s, v) => s + (v - mean) ** 2, 0) / amounts.length) || 1;

      const anomalies: Anomaly[] = [];
      all.forEach(e => {
        const val = e.amount_at_risk || 0;
        const z = Math.abs((val - mean) / stdDev);
        if (z > 2) {
          anomalies.push({
            id: e.id,
            metricKey: 'exception_amount',
            entityType: 'exception',
            entityId: e.id.slice(0, 8),
            observedValue: val,
            expectedValue: Math.round(mean),
            zScore: Math.round(z * 100) / 100,
            severity: z > 3 ? 'critical' : 'high',
            explanation: `Amount $${val.toLocaleString()} is ${z.toFixed(1)}σ from the mean ($${Math.round(mean).toLocaleString()}). This ${e.break_type.replace(/_/g, ' ').toLowerCase()} exception is statistically unusual and warrants investigation.`,
            detectedAt: e.created_at || new Date().toISOString(),
            isAcknowledged: false,
          });
        }
      });

      return anomalies.sort((a, b) => b.zScore - a.zScore).slice(0, 20);
    },
  });
}

function generateDemoAnomalies(): Anomaly[] {
  return [
    {
      id: 'demo-1', metricKey: 'exception_amount', entityType: 'exception', entityId: 'EXC-001',
      observedValue: 2450000, expectedValue: 340000, zScore: 4.2, severity: 'critical',
      explanation: 'Amount $2,450,000 is 4.2σ from the mean ($340,000). Unusually large amount mismatch likely caused by FX conversion error.',
      detectedAt: new Date().toISOString(), isAcknowledged: false,
    },
    {
      id: 'demo-2', metricKey: 'posting_volume', entityType: 'posting', entityId: 'RUN-042',
      observedValue: 12, expectedValue: 145, zScore: 3.1, severity: 'high',
      explanation: 'Only 12 postings in this run vs expected ~145. Possible upstream data feed outage or filter misconfiguration.',
      detectedAt: new Date(Date.now() - 86400000).toISOString(), isAcknowledged: false,
    },
    {
      id: 'demo-3', metricKey: 'fx_rate_variance', entityType: 'fx_rate', entityId: 'EUR/USD',
      observedValue: 1.42, expectedValue: 1.08, zScore: 2.8, severity: 'high',
      explanation: 'EUR/USD rate of 1.42 deviates significantly from recent average of 1.08. Check rate source configuration.',
      detectedAt: new Date(Date.now() - 172800000).toISOString(), isAcknowledged: true,
    },
  ];
}

// ── Alert Thresholds ───────────────────────────────────────────────
export interface AlertThreshold {
  id: string;
  metricKey: string;
  displayName: string;
  category: string;
  operator: string;
  warningValue: number | null;
  criticalValue: number | null;
  isEnabled: boolean;
  notifyEmail: boolean;
  notifyWebhook: boolean;
}

export function useAlertThresholds() {
  return useQuery({
    queryKey: ['alert-thresholds', DEMO_TENANT_ID],
    queryFn: async (): Promise<AlertThreshold[]> => {
      const { data } = await supabase
        .from('alert_thresholds')
        .select('*')
        .eq('tenant_id', DEMO_TENANT_ID);

      if (data && data.length > 0) {
        return data.map(t => ({
          id: t.id,
          metricKey: t.metric_key,
          displayName: t.display_name,
          category: t.category,
          operator: t.operator,
          warningValue: t.warning_value ? Number(t.warning_value) : null,
          criticalValue: t.critical_value ? Number(t.critical_value) : null,
          isEnabled: t.is_enabled,
          notifyEmail: t.notify_email,
          notifyWebhook: t.notify_webhook,
        }));
      }

      // Default thresholds
      return [
        { id: '1', metricKey: 'match_rate', displayName: 'Match Rate', category: 'reconciliation', operator: 'lt', warningValue: 90, criticalValue: 80, isEnabled: true, notifyEmail: true, notifyWebhook: false },
        { id: '2', metricKey: 'open_exceptions', displayName: 'Open Exceptions', category: 'exceptions', operator: 'gt', warningValue: 50, criticalValue: 100, isEnabled: true, notifyEmail: true, notifyWebhook: false },
        { id: '3', metricKey: 'amount_at_risk', displayName: 'Amount at Risk ($)', category: 'exceptions', operator: 'gt', warningValue: 500000, criticalValue: 2000000, isEnabled: true, notifyEmail: false, notifyWebhook: true },
        { id: '4', metricKey: 'sla_breaches', displayName: 'SLA Breaches', category: 'exceptions', operator: 'gt', warningValue: 5, criticalValue: 15, isEnabled: true, notifyEmail: true, notifyWebhook: false },
        { id: '5', metricKey: 'posting_failure_rate', displayName: 'Posting Failure Rate %', category: 'posting', operator: 'gt', warningValue: 5, criticalValue: 15, isEnabled: true, notifyEmail: true, notifyWebhook: true },
        { id: '6', metricKey: 'data_quality_score', displayName: 'Data Quality Score', category: 'data_quality', operator: 'lt', warningValue: 90, criticalValue: 75, isEnabled: false, notifyEmail: false, notifyWebhook: false },
      ];
    },
  });
}
