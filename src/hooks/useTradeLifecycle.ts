  import { useQuery } from '@tanstack/react-query';
  import { supabase } from '@/integrations/supabase/client';
  import { useState, useMemo } from 'react';
  import { getDemoCanonicalRecords } from '@/lib/risk/demoTradeRecords';
  
  const DEMO_TENANT_ID = '3dde8f40-5bf4-1bbd-3214-b8f4ca780852';
 
 export type LifecycleStage = 'created' | 'active' | 'delivered' | 'settled' | 'closed';
 
 export interface TradeLifecycle {
   id: string;
   dealId: string;
   sourceSystem: string;
   strategy: string | null;
   counterparty: string | null;
   bookPortfolio: string | null;
   commodity: string | null;
   legalEntity: string | null;
   currency: string | null;
   totalAmount: number;
   eventCount: number;
   currentStage: LifecycleStage;
   stageProgress: number; // 0-100
   stages: {
     stage: LifecycleStage;
     reached: boolean;
     date: string | null;
     eventCount: number;
   }[];
   createdDate: string | null;
   lastEventDate: string | null;
 }
 
 export interface LifecycleFilters {
   book: string;
   counterparty: string;
   commodity: string;
   stage: string;
 }
 
 // Infer lifecycle stage from record types and fee types
 function inferStageFromEvent(recordType: string, feeType: string | null): LifecycleStage {
   const rt = recordType?.toLowerCase() || '';
   const ft = feeType?.toLowerCase() || '';
 
   // Closed indicators
   if (ft.includes('close') || ft.includes('final') || ft.includes('termination')) {
     return 'closed';
   }
 
   // Settlement indicators
   if (
     ft.includes('settlement') ||
     ft.includes('payment') ||
     ft.includes('invoice') ||
     ft.includes('realized') ||
     rt.includes('payment') ||
     rt.includes('settlement')
   ) {
     return 'settled';
   }
 
   // Delivery indicators
   if (
     ft.includes('delivery') ||
     ft.includes('physical') ||
     ft.includes('transport') ||
     ft.includes('logistics') ||
     rt.includes('delivery')
   ) {
     return 'delivered';
   }
 
   // Active indicators (ongoing fees, mtm, etc.)
   if (
     ft.includes('mtm') ||
     ft.includes('unrealized') ||
     ft.includes('accrual') ||
     ft.includes('margin') ||
     ft.includes('fee') ||
     rt.includes('position')
   ) {
     return 'active';
   }
 
   // Default to created
   return 'created';
 }
 
 const STAGE_ORDER: LifecycleStage[] = ['created', 'active', 'delivered', 'settled', 'closed'];
 
 function getStageIndex(stage: LifecycleStage): number {
   return STAGE_ORDER.indexOf(stage);
 }
 
 export function useTradeLifecycle() {
   const [filters, setFilters] = useState<LifecycleFilters>({
     book: 'all',
     counterparty: 'all',
     commodity: 'all',
     stage: 'all',
   });
 
    const { data: rawRecords, isLoading, error } = useQuery({
      queryKey: ['trade-lifecycle-records'],
      queryFn: async () => {
        try {
          const { data, error } = await supabase
            .from('canonical_records')
            .select('*')
            .eq('tenant_id', DEMO_TENANT_ID)
            .not('deal_id', 'is', null)
            .order('economic_date', { ascending: true });
  
          if (error) throw error;
          // Fallback to demo seed if backend returns nothing (empty tenant or RLS denied)
          if (!data || data.length === 0) return getDemoCanonicalRecords();
          return data;
        } catch {
          return getDemoCanonicalRecords();
        }
      },
    });
 
   // Build lifecycle data from records
   const trades: TradeLifecycle[] = useMemo(() => {
     if (!rawRecords) return [];
 
     const tradeMap = new Map<string, typeof rawRecords>();
 
     rawRecords.forEach((record) => {
       const dealId = record.deal_id!;
       if (!tradeMap.has(dealId)) {
         tradeMap.set(dealId, []);
       }
       tradeMap.get(dealId)!.push(record);
     });
 
     return Array.from(tradeMap.entries()).map(([dealId, records]) => {
       const firstRecord = records[0];
       const sortedByDate = [...records].sort(
         (a, b) => new Date(a.economic_date || 0).getTime() - new Date(b.economic_date || 0).getTime()
       );
 
       // Infer stages for each event
       const stageEvents: Record<LifecycleStage, { dates: string[]; count: number }> = {
         created: { dates: [], count: 0 },
         active: { dates: [], count: 0 },
         delivered: { dates: [], count: 0 },
         settled: { dates: [], count: 0 },
         closed: { dates: [], count: 0 },
       };
 
       // First record always marks 'created'
       if (sortedByDate.length > 0 && sortedByDate[0].economic_date) {
         stageEvents.created.dates.push(sortedByDate[0].economic_date);
         stageEvents.created.count++;
       }
 
       // Analyze each record for stage inference
       records.forEach((record) => {
         const stage = inferStageFromEvent(record.record_type, record.fee_type);
         if (record.economic_date) {
           stageEvents[stage].dates.push(record.economic_date);
         }
         stageEvents[stage].count++;
       });
 
       // Determine highest reached stage
       let highestStage: LifecycleStage = 'created';
       STAGE_ORDER.forEach((stage) => {
         if (stageEvents[stage].count > 0) {
           highestStage = stage;
         }
       });
 
       // Build stages array
       const stages = STAGE_ORDER.map((stage) => {
         const reached = getStageIndex(stage) <= getStageIndex(highestStage);
         const dates = stageEvents[stage].dates.sort();
         return {
           stage,
           reached,
           date: dates[0] || null,
           eventCount: stageEvents[stage].count,
         };
       });
 
       // Calculate progress (0-100)
       const stageProgress = ((getStageIndex(highestStage) + 1) / STAGE_ORDER.length) * 100;
 
       const totalAmount = records.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
 
       // Infer commodity from strategy or fee_type
       const commodity = firstRecord.strategy?.split('-')[0] || 
                        records.find(r => r.fee_type)?.fee_type?.split('_')[0] || 
                        null;
 
       return {
         id: firstRecord.id,
         dealId,
         sourceSystem: firstRecord.source_system,
         strategy: firstRecord.strategy,
         counterparty: firstRecord.counterparty,
         bookPortfolio: firstRecord.book_portfolio,
         commodity,
         legalEntity: firstRecord.legal_entity,
         currency: firstRecord.currency,
         totalAmount,
         eventCount: records.length,
         currentStage: highestStage,
         stageProgress,
         stages,
         createdDate: sortedByDate[0]?.economic_date || null,
         lastEventDate: sortedByDate[sortedByDate.length - 1]?.economic_date || null,
       };
     });
   }, [rawRecords]);
 
   // Extract filter options
   const filterOptions = useMemo(() => {
     const books = [...new Set(trades.map((t) => t.bookPortfolio).filter(Boolean))] as string[];
     const counterparties = [...new Set(trades.map((t) => t.counterparty).filter(Boolean))] as string[];
     const commodities = [...new Set(trades.map((t) => t.commodity).filter(Boolean))] as string[];
 
     return { books, counterparties, commodities };
   }, [trades]);
 
   // Apply filters
   const filteredTrades = useMemo(() => {
     return trades.filter((trade) => {
       if (filters.book !== 'all' && trade.bookPortfolio !== filters.book) return false;
       if (filters.counterparty !== 'all' && trade.counterparty !== filters.counterparty) return false;
       if (filters.commodity !== 'all' && trade.commodity !== filters.commodity) return false;
       if (filters.stage !== 'all' && trade.currentStage !== filters.stage) return false;
       return true;
     });
   }, [trades, filters]);
 
   // Stats by stage
   const stageStats = useMemo(() => {
     return STAGE_ORDER.map((stage) => ({
       stage,
       count: trades.filter((t) => t.currentStage === stage).length,
       amount: trades
         .filter((t) => t.currentStage === stage)
         .reduce((sum, t) => sum + t.totalAmount, 0),
     }));
   }, [trades]);
 
   return {
     trades: filteredTrades,
     allTrades: trades,
     isLoading,
     error,
     filters,
     setFilters,
     filterOptions,
     stageStats,
     STAGE_ORDER,
   };
 }