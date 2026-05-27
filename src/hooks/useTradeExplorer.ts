 import { useQuery } from '@tanstack/react-query';
 import { supabase } from '@/integrations/supabase/client';
 import { useState, useMemo } from 'react';
 
 const DEMO_TENANT_ID = '3dde8f40-5bf4-1bbd-3214-b8f4ca780852';
 
 export interface Trade {
   id: string;
   dealId: string;
   sourceSystem: string;
   recordType: string;
   strategy: string | null;
   counterparty: string | null;
   bookPortfolio: string | null;
   legalEntity: string | null;
   currency: string | null;
   totalAmount: number;
   eventCount: number;
   firstEventDate: string | null;
   lastEventDate: string | null;
 }
 
 export interface TradeEvent {
   id: string;
   recordType: string;
   sourceSystem: string;
   feeType: string | null;
   amount: number | null;
   currency: string | null;
   economicDate: string | null;
   postingDate: string | null;
   docId: string | null;
   lineId: string | null;
   matchKey: string | null;
   createdAt: string | null;
 }
 
 export interface TradeFilters {
   dealId: string;
   book: string;
   counterparty: string;
   sourceSystem: string;
 }
 
 export function useTradeExplorer() {
   const [filters, setFilters] = useState<TradeFilters>({
     dealId: '',
     book: 'all',
     counterparty: 'all',
     sourceSystem: 'all',
   });
 
   const { data: rawRecords, isLoading, error } = useQuery({
     queryKey: ['trade-explorer-records'],
     queryFn: async () => {
       const { data, error } = await supabase
         .from('canonical_records')
         .select('*')
         .eq('tenant_id', DEMO_TENANT_ID)
         .not('deal_id', 'is', null)
         .order('economic_date', { ascending: false });
 
       if (error) throw error;
       return data || [];
     },
   });
 
   // Group records by deal_id to create trades
   const trades: Trade[] = useMemo(() => {
     if (!rawRecords) return [];
 
     const tradeMap = new Map<string, {
       records: typeof rawRecords;
       totalAmount: number;
     }>();
 
     rawRecords.forEach((record) => {
       const dealId = record.deal_id!;
       if (!tradeMap.has(dealId)) {
         tradeMap.set(dealId, { records: [], totalAmount: 0 });
       }
       const trade = tradeMap.get(dealId)!;
       trade.records.push(record);
       trade.totalAmount += Number(record.amount) || 0;
     });
 
     return Array.from(tradeMap.entries()).map(([dealId, data]) => {
       const firstRecord = data.records[0];
       const dates = data.records
         .map((r) => r.economic_date)
         .filter(Boolean)
         .sort();
 
       return {
         id: firstRecord.id,
         dealId,
         sourceSystem: firstRecord.source_system,
         recordType: firstRecord.record_type,
         strategy: firstRecord.strategy,
         counterparty: firstRecord.counterparty,
         bookPortfolio: firstRecord.book_portfolio,
         legalEntity: firstRecord.legal_entity,
         currency: firstRecord.currency,
         totalAmount: data.totalAmount,
         eventCount: data.records.length,
         firstEventDate: dates[0] || null,
         lastEventDate: dates[dates.length - 1] || null,
       };
     });
   }, [rawRecords]);
 
   // Extract unique filter options
   const filterOptions = useMemo(() => {
     const books = [...new Set(trades.map((t) => t.bookPortfolio).filter(Boolean))] as string[];
     const counterparties = [...new Set(trades.map((t) => t.counterparty).filter(Boolean))] as string[];
     const sourceSystems = [...new Set(trades.map((t) => t.sourceSystem))] as string[];
 
     return { books, counterparties, sourceSystems };
   }, [trades]);
 
   // Apply filters
   const filteredTrades = useMemo(() => {
     return trades.filter((trade) => {
       if (filters.dealId && !trade.dealId.toLowerCase().includes(filters.dealId.toLowerCase())) {
         return false;
       }
       if (filters.book !== 'all' && trade.bookPortfolio !== filters.book) return false;
       if (filters.counterparty !== 'all' && trade.counterparty !== filters.counterparty) return false;
       if (filters.sourceSystem !== 'all' && trade.sourceSystem !== filters.sourceSystem) return false;
       return true;
     });
   }, [trades, filters]);
 
   return {
     trades: filteredTrades,
     isLoading,
     error,
     filters,
     setFilters,
     filterOptions,
     totalTrades: trades.length,
   };
 }
 
 export function useTradeDetail(dealId: string | undefined) {
   const { data: events, isLoading, error } = useQuery({
     queryKey: ['trade-detail', dealId],
     queryFn: async () => {
       if (!dealId) return [];
 
       const { data, error } = await supabase
         .from('canonical_records')
         .select('*')
         .eq('tenant_id', DEMO_TENANT_ID)
         .eq('deal_id', dealId)
         .order('economic_date', { ascending: true });
 
       if (error) throw error;
       return data || [];
     },
     enabled: !!dealId,
   });
 
   const tradeEvents: TradeEvent[] = useMemo(() => {
     return (events || []).map((e) => ({
       id: e.id,
       recordType: e.record_type,
       sourceSystem: e.source_system,
       feeType: e.fee_type,
       amount: e.amount ? Number(e.amount) : null,
       currency: e.currency,
       economicDate: e.economic_date,
       postingDate: e.posting_date,
       docId: e.doc_id,
       lineId: e.line_id,
       matchKey: e.match_key,
       createdAt: e.created_at,
     }));
   }, [events]);
 
   const tradeSummary = useMemo(() => {
     if (!events || events.length === 0) return null;
 
     const first = events[0];
     const totalAmount = events.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
 
     return {
       dealId: first.deal_id,
       strategy: first.strategy,
       counterparty: first.counterparty,
       bookPortfolio: first.book_portfolio,
       legalEntity: first.legal_entity,
       currency: first.currency,
       totalAmount,
       eventCount: events.length,
     };
   }, [events]);
 
   return {
     events: tradeEvents,
     summary: tradeSummary,
     isLoading,
     error,
   };
 }