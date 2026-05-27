 import { useQuery } from '@tanstack/react-query';
 import { supabase } from '@/integrations/supabase/client';
 import { subDays, format, parseISO } from 'date-fns';
 
 export interface AuditFilters {
   module?: string;
   metricType?: string;
   dateRange?: { from: Date; to: Date };
   userId?: string;
 }
 
 export interface KPIMetric {
   id: string;
   name: string;
   module: string;
   currentValue: number | string;
   previousValue: number | string;
   change: number;
   unit: string;
   lastUpdated: string;
   sourceCount: number;
   canDrillDown: boolean;
 }
 
 export interface MetricBreakdown {
   id: string;
   dimension: string;
   value: number;
   percentage: number;
   recordCount: number;
   sourceSystem: string;
 }
 
 export interface EconomicEvent {
   id: string;
   eventType: string;
   dealId: string;
   amount: number;
   currency: string;
   date: string;
   legalEntity: string;
   sourceSystem: string;
   recordId: string;
 }
 
 export interface SnapshotEntry {
   id: string;
   timestamp: string;
   metricName: string;
   value: number;
   delta: number;
   triggeredBy: string;
   module: string;
 }
 
 export interface LineageNode {
   id: string;
   name: string;
   type: 'source' | 'transformation' | 'aggregation' | 'output';
   system: string;
   recordCount: number;
   lastUpdated: string;
 }
 
 export interface LineageEdge {
   from: string;
   to: string;
   transformationType: string;
   recordsProcessed: number;
 }
 
 export interface UserActivity {
   id: string;
   timestamp: string;
   userId: string;
   userName: string;
   action: string;
   entityType: string;
   entityId: string;
   module: string;
   details: string;
   ipAddress?: string;
 }
 
 const DEMO_TENANT_ID = '3dde8f40-5bf4-1bbd-3214-b8f4ca780852';
 
 const moduleKPIs: Record<string, KPIMetric[]> = {
   dashboard: [
     { id: 'match-rate', name: 'Match Rate', module: 'Dashboard', currentValue: 73.7, previousValue: 71.2, change: 2.5, unit: '%', lastUpdated: '', sourceCount: 1420, canDrillDown: true },
     { id: 'amount-at-risk', name: 'Amount at Risk', module: 'Dashboard', currentValue: 1745000, previousValue: 1890000, change: -7.7, unit: 'USD', lastUpdated: '', sourceCount: 312, canDrillDown: true },
     { id: 'open-exceptions', name: 'Open Exceptions', module: 'Dashboard', currentValue: 47, previousValue: 52, change: -9.6, unit: 'count', lastUpdated: '', sourceCount: 47, canDrillDown: true },
   ],
   'fx-analytics': [
     { id: 'net-fx-exposure', name: 'Net FX Exposure', module: 'FX Analytics', currentValue: 2340000, previousValue: 2180000, change: 7.3, unit: 'USD', lastUpdated: '', sourceCount: 234, canDrillDown: true },
     { id: 'realized-pnl', name: 'Realized P&L', module: 'FX Analytics', currentValue: 156000, previousValue: 142000, change: 9.9, unit: 'USD', lastUpdated: '', sourceCount: 89, canDrillDown: true },
     { id: 'hedge-ratio', name: 'Hedge Ratio', module: 'FX Analytics', currentValue: 78.5, previousValue: 76.2, change: 2.3, unit: '%', lastUpdated: '', sourceCount: 156, canDrillDown: true },
   ],
   'pnl-attribution': [
     { id: 'total-pnl', name: 'Total P&L', module: 'PnL Attribution', currentValue: 4250000, previousValue: 3980000, change: 6.8, unit: 'USD', lastUpdated: '', sourceCount: 567, canDrillDown: true },
     { id: 'trade-pnl', name: 'Trade P&L', module: 'PnL Attribution', currentValue: 3120000, previousValue: 2890000, change: 8.0, unit: 'USD', lastUpdated: '', sourceCount: 423, canDrillDown: true },
     { id: 'fees-costs', name: 'Fees & Costs', module: 'PnL Attribution', currentValue: -245000, previousValue: -268000, change: 8.6, unit: 'USD', lastUpdated: '', sourceCount: 178, canDrillDown: true },
   ],
   valuation: [
     { id: 'mtm-variance', name: 'MTM Variance', module: 'Valuation', currentValue: 0.42, previousValue: 0.58, change: -27.6, unit: '%', lastUpdated: '', sourceCount: 892, canDrillDown: true },
     { id: 'stale-data-count', name: 'Stale Data Alerts', module: 'Valuation', currentValue: 12, previousValue: 18, change: -33.3, unit: 'count', lastUpdated: '', sourceCount: 12, canDrillDown: true },
     { id: 'curves-in-use', name: 'Active Curves', module: 'Valuation', currentValue: 24, previousValue: 24, change: 0, unit: 'count', lastUpdated: '', sourceCount: 24, canDrillDown: true },
   ],
   'close-readiness': [
     { id: 'close-completion', name: 'Close Completion', module: 'Close Readiness', currentValue: 84.2, previousValue: 78.5, change: 5.7, unit: '%', lastUpdated: '', sourceCount: 1420, canDrillDown: true },
     { id: 'open-events', name: 'Open Economic Events', module: 'Close Readiness', currentValue: 23, previousValue: 31, change: -25.8, unit: 'count', lastUpdated: '', sourceCount: 23, canDrillDown: true },
     { id: 'pending-fx', name: 'Pending FX', module: 'Close Readiness', currentValue: 8, previousValue: 12, change: -33.3, unit: 'count', lastUpdated: '', sourceCount: 8, canDrillDown: true },
   ],
   'data-quality': [
     { id: 'overall-quality', name: 'Overall Quality Score', module: 'Data Quality', currentValue: 94.9, previousValue: 93.2, change: 1.7, unit: '%', lastUpdated: '', sourceCount: 1420, canDrillDown: true },
     { id: 'completeness', name: 'Completeness', module: 'Data Quality', currentValue: 96.8, previousValue: 95.4, change: 1.4, unit: '%', lastUpdated: '', sourceCount: 1420, canDrillDown: true },
     { id: 'open-issues', name: 'Open Quality Issues', module: 'Data Quality', currentValue: 286, previousValue: 312, change: -8.3, unit: 'count', lastUpdated: '', sourceCount: 286, canDrillDown: true },
   ],
 };
 
 export function useAuditExplainability(filters: AuditFilters) {
   return useQuery({
     queryKey: ['audit-explainability', filters],
     queryFn: async () => {
       const now = new Date();
       
       // Fetch audit logs from database
       const { data: auditLogs } = await supabase
         .from('audit_logs')
         .select('*')
         .order('created_at', { ascending: false })
         .limit(100);
 
       // Fetch canonical records for lineage
       const { data: records } = await supabase
         .from('canonical_records')
         .select('*')
         .eq('tenant_id', DEMO_TENANT_ID)
         .limit(500);
 
       // Build KPI metrics with timestamps
       const allKPIs: KPIMetric[] = [];
       Object.entries(moduleKPIs).forEach(([module, kpis]) => {
         if (!filters.module || filters.module === 'all' || filters.module === module) {
           kpis.forEach(kpi => {
             allKPIs.push({
               ...kpi,
               lastUpdated: subDays(now, Math.floor(Math.random() * 2)).toISOString(),
             });
           });
         }
       });
 
       // Generate snapshot history
       const snapshots: SnapshotEntry[] = [];
       for (let i = 0; i < 30; i++) {
         const date = subDays(now, i);
         allKPIs.slice(0, 6).forEach((kpi, idx) => {
           const baseValue = typeof kpi.currentValue === 'number' ? kpi.currentValue : 0;
           const variance = (Math.random() - 0.5) * 0.1;
           const value = baseValue * (1 + variance * (i / 10));
           snapshots.push({
             id: `snap-${i}-${idx}`,
             timestamp: date.toISOString(),
             metricName: kpi.name,
             value: Math.round(value * 100) / 100,
             delta: Math.round(variance * 100 * 10) / 10,
             triggeredBy: i === 0 ? 'Live' : 'Scheduled',
             module: kpi.module,
           });
         });
       }
 
       // Build transformation lineage
       const lineageNodes: LineageNode[] = [
         { id: 'etrm', name: 'ETRM System', type: 'source', system: 'Endur', recordCount: 1250, lastUpdated: subDays(now, 0).toISOString() },
         { id: 'erp', name: 'ERP System', type: 'source', system: 'SAP', recordCount: 1180, lastUpdated: subDays(now, 0).toISOString() },
         { id: 'treasury', name: 'Treasury System', type: 'source', system: 'Kyriba', recordCount: 340, lastUpdated: subDays(now, 1).toISOString() },
         { id: 'raw-ingest', name: 'Raw Ingestion', type: 'transformation', system: 'ArkheOS', recordCount: 2770, lastUpdated: subDays(now, 0).toISOString() },
         { id: 'normalize', name: 'Normalization', type: 'transformation', system: 'ArkheOS', recordCount: 2650, lastUpdated: subDays(now, 0).toISOString() },
         { id: 'canonical', name: 'Canonical Records', type: 'transformation', system: 'ArkheOS', recordCount: records?.length || 1420, lastUpdated: subDays(now, 0).toISOString() },
         { id: 'matching', name: 'Matching Engine', type: 'aggregation', system: 'ArkheOS', recordCount: 1048, lastUpdated: subDays(now, 0).toISOString() },
         { id: 'exceptions', name: 'Exceptions', type: 'aggregation', system: 'ArkheOS', recordCount: 47, lastUpdated: subDays(now, 0).toISOString() },
         { id: 'dashboard-kpis', name: 'Dashboard KPIs', type: 'output', system: 'ArkheOS', recordCount: 12, lastUpdated: subDays(now, 0).toISOString() },
         { id: 'fx-metrics', name: 'FX Metrics', type: 'output', system: 'ArkheOS', recordCount: 8, lastUpdated: subDays(now, 0).toISOString() },
         { id: 'pnl-metrics', name: 'P&L Metrics', type: 'output', system: 'ArkheOS', recordCount: 6, lastUpdated: subDays(now, 0).toISOString() },
       ];
 
       const lineageEdges: LineageEdge[] = [
         { from: 'etrm', to: 'raw-ingest', transformationType: 'CSV Import', recordsProcessed: 1250 },
         { from: 'erp', to: 'raw-ingest', transformationType: 'API Sync', recordsProcessed: 1180 },
         { from: 'treasury', to: 'raw-ingest', transformationType: 'File Import', recordsProcessed: 340 },
         { from: 'raw-ingest', to: 'normalize', transformationType: 'Schema Mapping', recordsProcessed: 2770 },
         { from: 'normalize', to: 'canonical', transformationType: 'Dedup & Enrich', recordsProcessed: 2650 },
         { from: 'canonical', to: 'matching', transformationType: 'Rule Matching', recordsProcessed: 1420 },
         { from: 'matching', to: 'exceptions', transformationType: 'Break Detection', recordsProcessed: 47 },
         { from: 'canonical', to: 'dashboard-kpis', transformationType: 'Aggregation', recordsProcessed: 1420 },
         { from: 'canonical', to: 'fx-metrics', transformationType: 'FX Calculation', recordsProcessed: 234 },
         { from: 'canonical', to: 'pnl-metrics', transformationType: 'P&L Attribution', recordsProcessed: 567 },
       ];
 
       // Map audit logs to user activities
       const userActivities: UserActivity[] = (auditLogs || []).map((log, idx) => ({
         id: log.id,
         timestamp: log.created_at || now.toISOString(),
         userId: log.actor_id || 'system',
         userName: log.actor_id ? 'User' : 'System',
         action: log.action,
         entityType: log.entity_type,
         entityId: log.entity_id || '',
         module: inferModule(log.entity_type),
         details: formatAuditDetails(log),
         ipAddress: log.ip_address || undefined,
       }));
 
       // Add demo activities if none exist
       if (userActivities.length === 0) {
         const demoActivities: UserActivity[] = [
           { id: '1', timestamp: subDays(now, 0).toISOString(), userId: 'u1', userName: 'John Smith', action: 'EXCEPTION_RESOLVED', entityType: 'exception', entityId: 'EXC-2024-001', module: 'Exceptions', details: 'Resolved exception with reason: Amount Correction' },
           { id: '2', timestamp: subDays(now, 0).toISOString(), userId: 'u2', userName: 'Sarah Johnson', action: 'AMENDMENT_APPROVED', entityType: 'amendment', entityId: 'AMD-2024-015', module: 'Amendments', details: 'Approved amendment for $125,000 adjustment' },
           { id: '3', timestamp: subDays(now, 0).toISOString(), userId: 'system', userName: 'System', action: 'RECON_RUN_COMPLETED', entityType: 'recon_run', entityId: 'RUN-2024-089', module: 'Reconciliations', details: 'Completed reconciliation run with 94.2% match rate' },
           { id: '4', timestamp: subDays(now, 1).toISOString(), userId: 'u3', userName: 'Mike Chen', action: 'BULK_ASSIGN', entityType: 'exception', entityId: 'BATCH-001', module: 'Exceptions', details: 'Bulk assigned 12 exceptions to Operations team' },
           { id: '5', timestamp: subDays(now, 1).toISOString(), userId: 'u1', userName: 'John Smith', action: 'DATA_LOAD', entityType: 'ingestion_batch', entityId: 'BATCH-2024-156', module: 'Data Loads', details: 'Loaded 1,250 records from ETRM system' },
           { id: '6', timestamp: subDays(now, 1).toISOString(), userId: 'u2', userName: 'Sarah Johnson', action: 'REPORT_EXPORTED', entityType: 'report', entityId: 'RPT-2024-034', module: 'Reports', details: 'Exported reconciliation summary to PDF' },
           { id: '7', timestamp: subDays(now, 2).toISOString(), userId: 'agent', userName: 'AI Agent', action: 'MATCH_PROPOSED', entityType: 'match_candidate', entityId: 'MC-2024-445', module: 'AI Recon Agent', details: 'Proposed 23 fuzzy matches with 87% avg confidence' },
           { id: '8', timestamp: subDays(now, 2).toISOString(), userId: 'u4', userName: 'Lisa Wang', action: 'PERIOD_LOCKED', entityType: 'accounting_period', entityId: 'JAN-2024', module: 'Close Management', details: 'Locked January 2024 period for reconciliation' },
         ];
         userActivities.push(...demoActivities);
       }
 
       // Get unique modules and users for filters
       const modules = [...new Set(Object.keys(moduleKPIs))];
       const users = [...new Set(userActivities.map(a => a.userName))];
 
       return {
         kpis: allKPIs,
         snapshots: snapshots.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
         lineageNodes,
         lineageEdges,
         userActivities: userActivities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
         modules,
         users,
         totalRecords: records?.length || 1420,
       };
     },
   });
 }
 
 function inferModule(entityType: string): string {
   const moduleMap: Record<string, string> = {
     exception: 'Exceptions',
     amendment: 'Amendments',
     recon_run: 'Reconciliations',
     reconciliation_run: 'Reconciliations',
     match_group: 'Match Review',
     canonical_record: 'Data Explorer',
     ingestion_batch: 'Data Loads',
     profile: 'Settings',
   };
   return moduleMap[entityType] || 'System';
 }
 
 function formatAuditDetails(log: any): string {
   if (log.after_state) {
     const state = log.after_state as Record<string, any>;
     if (state.description) return state.description;
     if (state.reason_code) return `Reason: ${state.reason_code}`;
   }
   return `${log.action} on ${log.entity_type}`;
 }
 
 export function useMetricDrillDown(metricId: string) {
   return useQuery({
     queryKey: ['metric-drilldown', metricId],
     queryFn: async () => {
       // Fetch canonical records for drill-down
       const { data: records } = await supabase
         .from('canonical_records')
         .select('*')
         .eq('tenant_id', DEMO_TENANT_ID)
         .limit(100);
 
       // Generate metric breakdown by dimension
       const breakdown: MetricBreakdown[] = [];
       const dimensions = ['HarmonyUS', 'HarmonyEU', 'HarmonyAsia', 'HarmonyUK'];
       const total = 100;
       
       dimensions.forEach((dim, idx) => {
         const pct = [45, 28, 18, 9][idx];
         breakdown.push({
           id: `bd-${idx}`,
           dimension: dim,
           value: Math.round((pct / 100) * 1745000),
           percentage: pct,
           recordCount: Math.round((pct / 100) * 312),
           sourceSystem: ['ETRM', 'ERP', 'ETRM', 'Treasury'][idx],
         });
       });
 
       // Generate economic events from records
       const events: EconomicEvent[] = (records || []).slice(0, 20).map((r, idx) => ({
         id: r.id,
         eventType: r.record_type || 'Trade',
         dealId: r.deal_id || `TRD-2024-${1000 + idx}`,
         amount: r.amount || Math.round(Math.random() * 100000),
         currency: r.currency || 'USD',
         date: r.date_primary || r.created_at || new Date().toISOString(),
         legalEntity: r.legal_entity || 'HarmonyUS',
         sourceSystem: r.source_system || 'ETRM',
         recordId: r.id,
       }));
 
       // Add demo events if none
       if (events.length === 0) {
         for (let i = 0; i < 15; i++) {
           events.push({
             id: `evt-${i}`,
             eventType: ['Trade', 'Fee', 'Settlement', 'Adjustment'][i % 4],
             dealId: `TRD-2024-${1000 + i}`,
             amount: Math.round(Math.random() * 150000),
             currency: ['USD', 'EUR', 'GBP'][i % 3],
             date: subDays(new Date(), Math.floor(Math.random() * 30)).toISOString(),
             legalEntity: dimensions[i % 4],
             sourceSystem: ['ETRM', 'ERP', 'Treasury'][i % 3],
             recordId: `CR-${i}`,
           });
         }
       }
 
       return { breakdown, events };
     },
     enabled: !!metricId,
   });
 }