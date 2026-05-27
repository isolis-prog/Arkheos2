 import { useQuery } from '@tanstack/react-query';
 import { supabase } from '@/integrations/supabase/client';
 import { useMemo, useState } from 'react';
 
 export interface EntityReadiness {
   entityId: string;
   entityName: string;
   completionPct: number;
   openEvents: number;
   missingValuations: number;
   pendingFX: number;
   reconCompleted: boolean;
   valuationCompleted: boolean;
   fxCompleted: boolean;
   status: 'ready' | 'in_progress' | 'blocked' | 'not_started';
 }
 
 export interface CloseChecklistItem {
   id: string;
   category: 'recon' | 'valuation' | 'fx' | 'approval';
   label: string;
   status: 'completed' | 'in_progress' | 'pending' | 'blocked';
   completedAt?: string;
   assignee?: string;
   blockerReason?: string;
 }
 
 export interface CloseReadinessSummary {
   overallCompletionPct: number;
   totalOpenEvents: number;
   totalMissingValuations: number;
   totalPendingFX: number;
   entitiesReady: number;
   entitiesTotal: number;
   estimatedCloseDate: string;
   daysToClose: number;
   isOnTrack: boolean;
 }
 
 export interface CloseFiltersState {
   legalEntity: string;
   category: string;
   status: string;
 }
 
 const LEGAL_ENTITIES = [
   { id: 'le-us', name: 'HarmonyUS' },
   { id: 'le-eu', name: 'HarmonyEU' },
   { id: 'le-uk', name: 'HarmonyUK' },
   { id: 'le-asia', name: 'HarmonyAsia' },
   { id: 'le-latam', name: 'HarmonyLATAM' },
 ];
 
 export const useCloseReadiness = () => {
   const [filters, setFilters] = useState<CloseFiltersState>({
     legalEntity: '',
     category: '',
     status: '',
   });
 
   const { data: canonicalRecords, isLoading: loadingRecords } = useQuery({
     queryKey: ['close-readiness-records'],
     queryFn: async () => {
       const { data, error } = await supabase
         .from('canonical_records')
         .select('*')
         .order('created_at', { ascending: false })
         .limit(500);
 
       if (error) throw error;
       return data || [];
     },
   });
 
   const { data: exceptions, isLoading: loadingExceptions } = useQuery({
     queryKey: ['close-readiness-exceptions'],
     queryFn: async () => {
       const { data, error } = await supabase
         .from('exceptions')
         .select('*')
         .in('status', ['open', 'in_progress']);
 
       if (error) throw error;
       return data || [];
     },
   });
 
   const entityReadiness = useMemo<EntityReadiness[]>(() => {
     if (!canonicalRecords?.length) {
       return generateDemoEntityReadiness();
     }
 
     const entityMap = new Map<string, {
       openEvents: number;
       missingValuations: number;
       pendingFX: number;
       totalRecords: number;
       completedRecords: number;
     }>();
 
     LEGAL_ENTITIES.forEach((entity) => {
       entityMap.set(entity.id, {
         openEvents: 0,
         missingValuations: 0,
         pendingFX: 0,
         totalRecords: 0,
         completedRecords: 0,
       });
     });
 
     canonicalRecords.forEach((record) => {
       const entityName = record.legal_entity || 'Unknown';
       const entity = LEGAL_ENTITIES.find(e => e.name === entityName) || LEGAL_ENTITIES[0];
       const data = entityMap.get(entity.id)!;
       
       data.totalRecords += 1;
       
       const feeType = (record.fee_type || '').toLowerCase();
       const recordType = (record.record_type || '').toLowerCase();
       
       // Check for open events (not settled)
       if (!feeType.includes('settled') && !recordType.includes('settlement')) {
         data.openEvents += 1;
       } else {
         data.completedRecords += 1;
       }
 
       // Check for missing valuations (no MTM data)
       if (!feeType.includes('mtm') && !feeType.includes('valuation') && !record.amount) {
         data.missingValuations += 1;
       }
 
       // Check for pending FX (non-USD without FX settlement)
       if (record.currency && record.currency !== 'USD' && !feeType.includes('fx')) {
         data.pendingFX += 1;
       }
     });
 
     return LEGAL_ENTITIES.map((entity) => {
       const data = entityMap.get(entity.id)!;
       const completionPct = data.totalRecords > 0 
         ? (data.completedRecords / data.totalRecords) * 100 
         : 0;
       
       const reconCompleted = data.openEvents === 0;
       const valuationCompleted = data.missingValuations === 0;
       const fxCompleted = data.pendingFX === 0;
 
       let status: EntityReadiness['status'] = 'not_started';
       if (completionPct === 100 && reconCompleted && valuationCompleted && fxCompleted) {
         status = 'ready';
       } else if (completionPct > 0) {
         status = data.openEvents > 10 || data.missingValuations > 5 ? 'blocked' : 'in_progress';
       }
 
       return {
         entityId: entity.id,
         entityName: entity.name,
         completionPct,
         openEvents: data.openEvents,
         missingValuations: data.missingValuations,
         pendingFX: data.pendingFX,
         reconCompleted,
         valuationCompleted,
         fxCompleted,
         status,
       };
     });
   }, [canonicalRecords]);
 
   const checklist = useMemo<CloseChecklistItem[]>(() => {
     return generateDemoChecklist(entityReadiness);
   }, [entityReadiness]);
 
   const filteredEntities = useMemo(() => {
     return entityReadiness.filter((entity) => {
       if (filters.legalEntity && entity.entityId !== filters.legalEntity) return false;
       if (filters.status && entity.status !== filters.status) return false;
       return true;
     });
   }, [entityReadiness, filters]);
 
   const filteredChecklist = useMemo(() => {
     return checklist.filter((item) => {
       if (filters.category && item.category !== filters.category) return false;
       if (filters.status) {
         const statusMap: Record<string, string[]> = {
           ready: ['completed'],
           in_progress: ['in_progress'],
           blocked: ['blocked', 'pending'],
         };
         if (statusMap[filters.status] && !statusMap[filters.status].includes(item.status)) return false;
       }
       return true;
     });
   }, [checklist, filters]);
 
   const summary = useMemo<CloseReadinessSummary>(() => {
     const totalOpen = entityReadiness.reduce((sum, e) => sum + e.openEvents, 0);
     const totalMissing = entityReadiness.reduce((sum, e) => sum + e.missingValuations, 0);
     const totalPending = entityReadiness.reduce((sum, e) => sum + e.pendingFX, 0);
     const avgCompletion = entityReadiness.reduce((sum, e) => sum + e.completionPct, 0) / entityReadiness.length;
     const ready = entityReadiness.filter(e => e.status === 'ready').length;
 
     const now = new Date();
     const closeDate = new Date(now.getFullYear(), now.getMonth() + 1, 5);
     const daysToClose = Math.ceil((closeDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
 
     return {
       overallCompletionPct: avgCompletion,
       totalOpenEvents: totalOpen,
       totalMissingValuations: totalMissing,
       totalPendingFX: totalPending,
       entitiesReady: ready,
       entitiesTotal: entityReadiness.length,
       estimatedCloseDate: closeDate.toISOString().split('T')[0],
       daysToClose,
       isOnTrack: avgCompletion >= 80 && daysToClose > 3,
     };
   }, [entityReadiness]);
 
   const legalEntities = LEGAL_ENTITIES;
 
   return {
     entityReadiness: filteredEntities,
     checklist: filteredChecklist,
     summary,
     filters,
     setFilters,
     legalEntities,
     isLoading: loadingRecords || loadingExceptions,
   };
 };
 
 function generateDemoEntityReadiness(): EntityReadiness[] {
   return LEGAL_ENTITIES.map((entity, idx) => {
     const completionPct = 65 + Math.random() * 30;
     const openEvents = Math.floor(Math.random() * 15);
     const missingValuations = Math.floor(Math.random() * 8);
     const pendingFX = Math.floor(Math.random() * 6);
     
     const reconCompleted = openEvents === 0;
     const valuationCompleted = missingValuations === 0;
     const fxCompleted = pendingFX === 0;
 
     let status: EntityReadiness['status'] = 'in_progress';
     if (completionPct >= 95 && openEvents < 3 && missingValuations < 2) {
       status = 'ready';
     } else if (openEvents > 10 || missingValuations > 5) {
       status = 'blocked';
     } else if (idx === 4) {
       status = 'not_started';
     }
 
     return {
       entityId: entity.id,
       entityName: entity.name,
       completionPct,
       openEvents,
       missingValuations,
       pendingFX,
       reconCompleted,
       valuationCompleted,
       fxCompleted,
       status,
     };
   });
 }
 
 function generateDemoChecklist(entities: EntityReadiness[]): CloseChecklistItem[] {
   const items: CloseChecklistItem[] = [];
   const categories: CloseChecklistItem['category'][] = ['recon', 'valuation', 'fx', 'approval'];
   
   const tasks = [
     { category: 'recon', label: 'Complete trade reconciliation' },
     { category: 'recon', label: 'Resolve all critical breaks' },
     { category: 'recon', label: 'Validate matched positions' },
     { category: 'valuation', label: 'Update forward curves' },
     { category: 'valuation', label: 'Run MTM calculations' },
     { category: 'valuation', label: 'Validate P&L attribution' },
     { category: 'fx', label: 'Process FX settlements' },
     { category: 'fx', label: 'Lock FX rates for period' },
     { category: 'approval', label: 'Manager sign-off' },
     { category: 'approval', label: 'Accounting approval' },
   ];
 
   const readyCount = entities.filter(e => e.status === 'ready').length;
   const completedCount = Math.floor(tasks.length * (readyCount / entities.length));
 
   tasks.forEach((task, idx) => {
     let status: CloseChecklistItem['status'] = 'pending';
     let completedAt: string | undefined;
 
     if (idx < completedCount) {
       status = 'completed';
       completedAt = new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000).toISOString();
     } else if (idx === completedCount) {
       status = 'in_progress';
     } else if (idx === completedCount + 1 && Math.random() > 0.5) {
       status = 'blocked';
     }
 
     items.push({
       id: `task-${idx}`,
       category: task.category as CloseChecklistItem['category'],
       label: task.label,
       status,
       completedAt,
       assignee: ['John D.', 'Sarah M.', 'Mike R.', 'Lisa K.'][idx % 4],
       blockerReason: status === 'blocked' ? 'Pending upstream data' : undefined,
     });
   });
 
   return items;
 }