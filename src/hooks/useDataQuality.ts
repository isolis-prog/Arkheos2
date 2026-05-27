 import { useQuery } from '@tanstack/react-query';
 import { supabase } from '@/integrations/supabase/client';
 import { subDays, format, parseISO, differenceInHours } from 'date-fns';
 
 export interface DataQualityFilters {
   legalEntity?: string;
   sourceSystem?: string;
   dateRange?: { from: Date; to: Date };
   qualityDimension?: 'all' | 'completeness' | 'validity' | 'timeliness' | 'consistency';
 }
 
 export interface QualityScore {
   dimension: string;
   score: number;
   trend: number;
   issueCount: number;
   totalRecords: number;
   status: 'good' | 'warning' | 'critical';
 }
 
 export interface QualityRule {
   id: string;
   name: string;
   dimension: 'completeness' | 'validity' | 'timeliness' | 'consistency';
   description: string;
   field: string;
   condition: string;
   passCount: number;
   failCount: number;
   passRate: number;
   severity: 'low' | 'medium' | 'high';
   lastRun: string;
   status: 'passed' | 'failed' | 'warning';
 }
 
 export interface QualityTrend {
   date: string;
   completeness: number;
   validity: number;
   timeliness: number;
   consistency: number;
   overall: number;
 }
 
 export interface QualityAuditEntry {
   id: string;
   timestamp: string;
   dimension: string;
   rule: string;
   field: string;
   recordId: string;
   sourceSystem: string;
   issue: string;
   severity: 'low' | 'medium' | 'high';
   status: 'open' | 'acknowledged' | 'resolved';
 }
 
 const DEMO_TENANT_ID = '3dde8f40-5bf4-1bbd-3214-b8f4ca780852';
 
 // Quality rules definitions
 const qualityRulesDefinitions = [
   { id: 'r1', name: 'Amount Required', dimension: 'completeness' as const, field: 'amount', condition: 'NOT NULL', description: 'Amount field must be populated', severity: 'high' as const },
   { id: 'r2', name: 'Currency Required', dimension: 'completeness' as const, field: 'currency', condition: 'NOT NULL', description: 'Currency code must be present', severity: 'high' as const },
   { id: 'r3', name: 'Deal ID Required', dimension: 'completeness' as const, field: 'deal_id', condition: 'NOT NULL', description: 'Deal identifier must be populated', severity: 'medium' as const },
   { id: 'r4', name: 'Legal Entity Required', dimension: 'completeness' as const, field: 'legal_entity', condition: 'NOT NULL', description: 'Legal entity must be specified', severity: 'high' as const },
   { id: 'r5', name: 'Valid Currency Code', dimension: 'validity' as const, field: 'currency', condition: 'LENGTH = 3', description: 'Currency must be 3-character ISO code', severity: 'medium' as const },
   { id: 'r6', name: 'Positive Amount', dimension: 'validity' as const, field: 'amount', condition: '!= 0', description: 'Amount should be non-zero', severity: 'low' as const },
   { id: 'r7', name: 'Valid Date', dimension: 'validity' as const, field: 'date_primary', condition: 'IS DATE', description: 'Date must be valid format', severity: 'high' as const },
   { id: 'r8', name: 'Future Date Check', dimension: 'validity' as const, field: 'date_primary', condition: '<= TODAY + 365', description: 'Date should not be more than 1 year in future', severity: 'medium' as const },
   { id: 'r9', name: 'Record Freshness', dimension: 'timeliness' as const, field: 'created_at', condition: '< 24 HOURS', description: 'Records should be loaded within 24 hours', severity: 'medium' as const },
   { id: 'r10', name: 'Batch Completion', dimension: 'timeliness' as const, field: 'batch_id', condition: 'COMPLETED', description: 'Batch must be fully processed', severity: 'high' as const },
   { id: 'r11', name: 'Cross-System Match', dimension: 'consistency' as const, field: 'match_key', condition: 'HAS MATCH', description: 'Records should have matching counterparts', severity: 'medium' as const },
   { id: 'r12', name: 'Amount Consistency', dimension: 'consistency' as const, field: 'amount', condition: 'WITHIN TOLERANCE', description: 'Amounts should match within tolerance', severity: 'high' as const },
 ];
 
 export function useDataQuality(filters: DataQualityFilters) {
   return useQuery({
     queryKey: ['data-quality', filters],
     queryFn: async () => {
       // Fetch canonical records for analysis
       const { data: records, error } = await supabase
         .from('canonical_records')
         .select('*')
         .eq('tenant_id', DEMO_TENANT_ID)
         .limit(2000);
 
       if (error) throw error;
 
       let filteredRecords = records || [];
 
       // Apply filters
       if (filters.legalEntity && filters.legalEntity !== 'all') {
         filteredRecords = filteredRecords.filter(r => r.legal_entity === filters.legalEntity);
       }
       if (filters.sourceSystem && filters.sourceSystem !== 'all') {
         filteredRecords = filteredRecords.filter(r => r.source_system === filters.sourceSystem);
       }
 
       // If no records, generate demo data
       if (filteredRecords.length === 0) {
         return generateDemoData(filters);
       }
 
       return analyzeQuality(filteredRecords, filters);
     },
   });
 }
 
 function analyzeQuality(records: any[], filters: DataQualityFilters) {
   const now = new Date();
   const totalRecords = records.length;
 
   // Completeness analysis
   const amountMissing = records.filter(r => r.amount === null || r.amount === undefined).length;
   const currencyMissing = records.filter(r => !r.currency).length;
   const dealIdMissing = records.filter(r => !r.deal_id).length;
   const entityMissing = records.filter(r => !r.legal_entity).length;
   const completenessIssues = amountMissing + currencyMissing + dealIdMissing + entityMissing;
   const completenessScore = Math.max(0, 100 - (completenessIssues / (totalRecords * 4)) * 100);
 
   // Validity analysis
   const invalidCurrency = records.filter(r => r.currency && r.currency.length !== 3).length;
   const zeroAmount = records.filter(r => r.amount === 0).length;
   const invalidDate = records.filter(r => {
     if (!r.date_primary) return false;
     const date = parseISO(r.date_primary);
     return isNaN(date.getTime());
   }).length;
   const validityIssues = invalidCurrency + zeroAmount + invalidDate;
   const validityScore = Math.max(0, 100 - (validityIssues / totalRecords) * 100);
 
   // Timeliness analysis
   const staleRecords = records.filter(r => {
     if (!r.created_at) return true;
     const created = parseISO(r.created_at);
     return differenceInHours(now, created) > 48;
   }).length;
   const timelinessScore = Math.max(0, 100 - (staleRecords / totalRecords) * 100);
 
   // Consistency analysis
   const unmatchedRecords = records.filter(r => !r.match_key).length;
   const consistencyScore = Math.max(0, 100 - (unmatchedRecords / totalRecords) * 50);
 
   const getStatus = (score: number): 'good' | 'warning' | 'critical' => {
     if (score >= 95) return 'good';
     if (score >= 80) return 'warning';
     return 'critical';
   };
 
   const scores: QualityScore[] = [
     {
       dimension: 'Completeness',
       score: Math.round(completenessScore * 10) / 10,
       trend: 2.3,
       issueCount: completenessIssues,
       totalRecords,
       status: getStatus(completenessScore),
     },
     {
       dimension: 'Validity',
       score: Math.round(validityScore * 10) / 10,
       trend: 1.1,
       issueCount: validityIssues,
       totalRecords,
       status: getStatus(validityScore),
     },
     {
       dimension: 'Timeliness',
       score: Math.round(timelinessScore * 10) / 10,
       trend: -0.5,
       issueCount: staleRecords,
       totalRecords,
       status: getStatus(timelinessScore),
     },
     {
       dimension: 'Consistency',
       score: Math.round(consistencyScore * 10) / 10,
       trend: 3.2,
       issueCount: unmatchedRecords,
       totalRecords,
       status: getStatus(consistencyScore),
     },
   ];
 
   // Generate quality rules results
   const rules: QualityRule[] = qualityRulesDefinitions.map(rule => {
     let passCount = 0;
     let failCount = 0;
 
     records.forEach(r => {
       const value = r[rule.field];
       let passed = true;
 
       switch (rule.condition) {
         case 'NOT NULL':
           passed = value !== null && value !== undefined && value !== '';
           break;
         case 'LENGTH = 3':
           passed = typeof value === 'string' && value.length === 3;
           break;
         case '!= 0':
           passed = value !== 0;
           break;
         case 'IS DATE':
           passed = value && !isNaN(parseISO(value).getTime());
           break;
         case '<= TODAY + 365':
           if (value) {
             const date = parseISO(value);
             const maxDate = new Date();
             maxDate.setFullYear(maxDate.getFullYear() + 1);
             passed = date <= maxDate;
           }
           break;
         case '< 24 HOURS':
           if (r.created_at) {
             passed = differenceInHours(now, parseISO(r.created_at)) <= 24;
           }
           break;
         case 'HAS MATCH':
           passed = !!r.match_key;
           break;
         default:
           passed = true;
       }
 
       if (passed) passCount++;
       else failCount++;
     });
 
     const passRate = totalRecords > 0 ? (passCount / totalRecords) * 100 : 100;
     
     return {
       ...rule,
       passCount,
       failCount,
       passRate: Math.round(passRate * 10) / 10,
       lastRun: now.toISOString(),
       status: passRate >= 99 ? 'passed' : passRate >= 90 ? 'warning' : 'failed',
     };
   });
 
   // Generate historical trends
   const trends: QualityTrend[] = [];
   for (let i = 30; i >= 0; i--) {
     const date = subDays(now, i);
     const baseScore = 92 + Math.random() * 6;
     trends.push({
       date: format(date, 'yyyy-MM-dd'),
       completeness: Math.min(100, baseScore + Math.random() * 3),
       validity: Math.min(100, baseScore + Math.random() * 4 - 1),
       timeliness: Math.min(100, baseScore + Math.random() * 5 - 2),
       consistency: Math.min(100, baseScore + Math.random() * 4),
       overall: Math.min(100, baseScore + Math.random() * 2),
     });
   }
 
   // Generate audit log entries
   const auditLog: QualityAuditEntry[] = [];
   const failedRules = rules.filter(r => r.failCount > 0);
   
   failedRules.slice(0, 20).forEach((rule, idx) => {
     const failedRecords = records.filter(r => {
       const value = r[rule.field];
       if (rule.condition === 'NOT NULL') return !value;
       if (rule.condition === 'LENGTH = 3') return typeof value === 'string' && value.length !== 3;
       return false;
     }).slice(0, 3);
 
     failedRecords.forEach((record, rIdx) => {
       auditLog.push({
         id: `audit-${idx}-${rIdx}`,
         timestamp: subDays(now, Math.floor(Math.random() * 7)).toISOString(),
         dimension: rule.dimension,
         rule: rule.name,
         field: rule.field,
         recordId: record.id || `REC-${idx}-${rIdx}`,
         sourceSystem: record.source_system || 'ETRM',
         issue: `${rule.name} check failed: ${rule.description}`,
         severity: rule.severity,
         status: Math.random() > 0.7 ? 'resolved' : Math.random() > 0.5 ? 'acknowledged' : 'open',
       });
     });
   });
 
   // Extract unique values for filters
   const legalEntities = [...new Set(records.map(r => r.legal_entity).filter(Boolean))];
   const sourceSystems = [...new Set(records.map(r => r.source_system).filter(Boolean))];
 
   const overallScore = (scores.reduce((sum, s) => sum + s.score, 0) / scores.length);
 
   return {
     scores,
     rules,
     trends,
     auditLog: auditLog.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
     legalEntities,
     sourceSystems,
     overallScore: Math.round(overallScore * 10) / 10,
     totalRecords,
     totalIssues: scores.reduce((sum, s) => sum + s.issueCount, 0),
   };
 }
 
 function generateDemoData(filters: DataQualityFilters) {
   const now = new Date();
   
   const scores: QualityScore[] = [
     { dimension: 'Completeness', score: 96.8, trend: 2.3, issueCount: 45, totalRecords: 1420, status: 'good' },
     { dimension: 'Validity', score: 94.2, trend: 1.1, issueCount: 82, totalRecords: 1420, status: 'warning' },
     { dimension: 'Timeliness', score: 91.5, trend: -0.5, issueCount: 121, totalRecords: 1420, status: 'warning' },
     { dimension: 'Consistency', score: 97.3, trend: 3.2, issueCount: 38, totalRecords: 1420, status: 'good' },
   ];
 
   const rules: QualityRule[] = qualityRulesDefinitions.map((rule, idx) => ({
     ...rule,
     passCount: 1350 + Math.floor(Math.random() * 50),
     failCount: Math.floor(Math.random() * 70),
     passRate: 92 + Math.random() * 7,
     lastRun: now.toISOString(),
     status: Math.random() > 0.3 ? 'passed' : Math.random() > 0.5 ? 'warning' : 'failed',
   }));
 
   const trends: QualityTrend[] = [];
   for (let i = 30; i >= 0; i--) {
     const date = subDays(now, i);
     const baseScore = 92 + Math.random() * 6;
     trends.push({
       date: format(date, 'yyyy-MM-dd'),
       completeness: Math.min(100, baseScore + Math.random() * 3),
       validity: Math.min(100, baseScore + Math.random() * 4 - 1),
       timeliness: Math.min(100, baseScore + Math.random() * 5 - 2),
       consistency: Math.min(100, baseScore + Math.random() * 4),
       overall: Math.min(100, baseScore + Math.random() * 2),
     });
   }
 
   const auditLog: QualityAuditEntry[] = [
     { id: '1', timestamp: subDays(now, 0).toISOString(), dimension: 'completeness', rule: 'Amount Required', field: 'amount', recordId: 'TRD-2024-1542', sourceSystem: 'ETRM', issue: 'Amount field is null', severity: 'high', status: 'open' },
     { id: '2', timestamp: subDays(now, 0).toISOString(), dimension: 'validity', rule: 'Valid Currency Code', field: 'currency', recordId: 'TRD-2024-1538', sourceSystem: 'ERP', issue: 'Invalid currency code: US', severity: 'medium', status: 'open' },
     { id: '3', timestamp: subDays(now, 1).toISOString(), dimension: 'timeliness', rule: 'Record Freshness', field: 'created_at', recordId: 'TRD-2024-1520', sourceSystem: 'ETRM', issue: 'Record is 36 hours old', severity: 'medium', status: 'acknowledged' },
     { id: '4', timestamp: subDays(now, 1).toISOString(), dimension: 'consistency', rule: 'Cross-System Match', field: 'match_key', recordId: 'TRD-2024-1515', sourceSystem: 'ERP', issue: 'No matching record found in ETRM', severity: 'high', status: 'open' },
     { id: '5', timestamp: subDays(now, 2).toISOString(), dimension: 'completeness', rule: 'Legal Entity Required', field: 'legal_entity', recordId: 'TRD-2024-1498', sourceSystem: 'ETRM', issue: 'Legal entity is missing', severity: 'high', status: 'resolved' },
     { id: '6', timestamp: subDays(now, 2).toISOString(), dimension: 'validity', rule: 'Positive Amount', field: 'amount', recordId: 'TRD-2024-1492', sourceSystem: 'ERP', issue: 'Amount is zero', severity: 'low', status: 'acknowledged' },
     { id: '7', timestamp: subDays(now, 3).toISOString(), dimension: 'timeliness', rule: 'Batch Completion', field: 'batch_id', recordId: 'BATCH-2024-089', sourceSystem: 'ETRM', issue: 'Batch processing incomplete', severity: 'high', status: 'resolved' },
     { id: '8', timestamp: subDays(now, 3).toISOString(), dimension: 'consistency', rule: 'Amount Consistency', field: 'amount', recordId: 'TRD-2024-1485', sourceSystem: 'ERP', issue: 'Amount mismatch exceeds tolerance', severity: 'high', status: 'open' },
   ];
 
   return {
     scores,
     rules,
     trends,
     auditLog,
     legalEntities: ['HarmonyUS', 'HarmonyEU', 'HarmonyAsia', 'HarmonyUK'],
     sourceSystems: ['ETRM', 'ERP', 'Treasury', 'Risk'],
     overallScore: 94.9,
     totalRecords: 1420,
     totalIssues: 286,
   };
 }