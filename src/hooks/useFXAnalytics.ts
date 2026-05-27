  import { useQuery } from '@tanstack/react-query';
  import { supabase } from '@/integrations/supabase/client';
  import { useMemo, useState } from 'react';
  import { getDemoCanonicalRecords } from '@/lib/risk/demoTradeRecords';
 
 export interface FXExposure {
   currencyPair: string;
   baseCurrency: string;
   quoteCurrency: string;
   realizedAmount: number;
   unrealizedAmount: number;
   totalExposure: number;
   legalEntity: string;
   dealCount: number;
   lastUpdated: string;
 }
 
 export interface FXTimeBucket {
   bucket: string;
   startDate: string;
   endDate: string;
   netExposure: number;
   realizedPnL: number;
   unrealizedPnL: number;
   hedgedAmount: number;
   unhedgedAmount: number;
 }
 
 export interface FXSummary {
   totalRealizedPnL: number;
   totalUnrealizedPnL: number;
   netFXExposure: number;
   hedgeRatio: number;
   currencyPairCount: number;
   entityCount: number;
 }
 
 export interface FXFiltersState {
   legalEntity: string;
   currencyPair: string;
   exposureType: 'all' | 'realized' | 'unrealized';
   timeBucket: 'daily' | 'weekly' | 'monthly';
 }
 
 const CURRENCY_PAIRS = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD', 'USD/CAD'];
 const LEGAL_ENTITIES = ['HarmonyUS', 'HarmonyEU', 'HarmonyUK', 'HarmonyAsia'];
 
 export const useFXAnalytics = () => {
   const [filters, setFilters] = useState<FXFiltersState>({
     legalEntity: '',
     currencyPair: '',
     exposureType: 'all',
     timeBucket: 'monthly',
   });
 
    const { data: canonicalRecords, isLoading } = useQuery({
      queryKey: ['fx-analytics-records'],
      queryFn: async () => {
        try {
          const { data, error } = await supabase
            .from('canonical_records')
            .select('*')
            .order('date_primary', { ascending: false });
  
          if (error) throw error;
          if (!data || data.length === 0) return getDemoCanonicalRecords();
          return data;
        } catch {
          return getDemoCanonicalRecords();
        }
      },
    });
 
   const fxExposures = useMemo<FXExposure[]>(() => {
     if (!canonicalRecords?.length) {
       // Generate demo data when no records exist
       return generateDemoExposures();
     }
 
     // Derive FX exposures from canonical records
     const exposureMap = new Map<string, FXExposure>();
 
     canonicalRecords.forEach((record) => {
       const currency = record.currency || 'USD';
       const legalEntity = record.legal_entity || 'Unknown';
       const feeType = (record.fee_type || '').toLowerCase();
       const recordType = (record.record_type || '').toLowerCase();
       
       // Identify FX-related records
       const isFXRecord = feeType.includes('fx') || 
                          recordType.includes('fx') || 
                          currency !== 'USD';
       
       if (!isFXRecord && currency === 'USD') return;
 
       const currencyPair = currency === 'USD' ? 'EUR/USD' : `${currency}/USD`;
       const key = `${currencyPair}-${legalEntity}`;
 
       if (!exposureMap.has(key)) {
         exposureMap.set(key, {
           currencyPair,
           baseCurrency: currency === 'USD' ? 'EUR' : currency,
           quoteCurrency: 'USD',
           realizedAmount: 0,
           unrealizedAmount: 0,
           totalExposure: 0,
           legalEntity,
           dealCount: 0,
           lastUpdated: record.created_at || new Date().toISOString(),
         });
       }
 
       const exposure = exposureMap.get(key)!;
       const amount = Math.abs(record.amount || 0);
       
       // Determine if realized or unrealized based on record characteristics
       const isRealized = feeType.includes('settled') || 
                          feeType.includes('payment') || 
                          recordType.includes('settlement');
       
       if (isRealized) {
         exposure.realizedAmount += amount;
       } else {
         exposure.unrealizedAmount += amount;
       }
       
       exposure.totalExposure = exposure.realizedAmount + exposure.unrealizedAmount;
       exposure.dealCount += 1;
     });
 
     const exposures = Array.from(exposureMap.values());
     return exposures.length > 0 ? exposures : generateDemoExposures();
   }, [canonicalRecords]);
 
   const timeBuckets = useMemo<FXTimeBucket[]>(() => {
     if (!canonicalRecords?.length) {
       return generateDemoTimeBuckets(filters.timeBucket);
     }
 
     const bucketMap = new Map<string, FXTimeBucket>();
     const now = new Date();
 
     canonicalRecords.forEach((record) => {
       const recordDate = record.date_primary ? new Date(record.date_primary) : now;
       const bucketKey = getBucketKey(recordDate, filters.timeBucket);
       const { startDate, endDate } = getBucketDates(recordDate, filters.timeBucket);
 
       if (!bucketMap.has(bucketKey)) {
         bucketMap.set(bucketKey, {
           bucket: bucketKey,
           startDate,
           endDate,
           netExposure: 0,
           realizedPnL: 0,
           unrealizedPnL: 0,
           hedgedAmount: 0,
           unhedgedAmount: 0,
         });
       }
 
       const bucket = bucketMap.get(bucketKey)!;
       const amount = record.amount || 0;
       const feeType = (record.fee_type || '').toLowerCase();
       const isHedge = feeType.includes('hedge') || feeType.includes('forward') || feeType.includes('swap');
       const isRealized = feeType.includes('settled') || feeType.includes('payment');
 
       bucket.netExposure += amount;
       if (isRealized) {
         bucket.realizedPnL += amount * 0.02; // Simulated FX impact
       } else {
         bucket.unrealizedPnL += amount * 0.015;
       }
       if (isHedge) {
         bucket.hedgedAmount += Math.abs(amount);
       } else {
         bucket.unhedgedAmount += Math.abs(amount);
       }
     });
 
     const buckets = Array.from(bucketMap.values()).sort((a, b) => 
       new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
     );
 
     return buckets.length > 0 ? buckets : generateDemoTimeBuckets(filters.timeBucket);
   }, [canonicalRecords, filters.timeBucket]);
 
   const filteredExposures = useMemo(() => {
     return fxExposures.filter((exposure) => {
       if (filters.legalEntity && exposure.legalEntity !== filters.legalEntity) return false;
       if (filters.currencyPair && exposure.currencyPair !== filters.currencyPair) return false;
       if (filters.exposureType === 'realized' && exposure.realizedAmount === 0) return false;
       if (filters.exposureType === 'unrealized' && exposure.unrealizedAmount === 0) return false;
       return true;
     });
   }, [fxExposures, filters]);
 
   const summary = useMemo<FXSummary>(() => {
     const totalRealized = filteredExposures.reduce((sum, e) => sum + e.realizedAmount, 0);
     const totalUnrealized = filteredExposures.reduce((sum, e) => sum + e.unrealizedAmount, 0);
     const hedged = timeBuckets.reduce((sum, b) => sum + b.hedgedAmount, 0);
     const total = hedged + timeBuckets.reduce((sum, b) => sum + b.unhedgedAmount, 0);
 
     return {
       totalRealizedPnL: totalRealized * 0.02,
       totalUnrealizedPnL: totalUnrealized * 0.015,
       netFXExposure: totalRealized + totalUnrealized,
       hedgeRatio: total > 0 ? (hedged / total) * 100 : 0,
       currencyPairCount: new Set(filteredExposures.map(e => e.currencyPair)).size,
       entityCount: new Set(filteredExposures.map(e => e.legalEntity)).size,
     };
   }, [filteredExposures, timeBuckets]);
 
   const legalEntities = useMemo(() => {
     const entities = new Set(fxExposures.map(e => e.legalEntity));
     return Array.from(entities);
   }, [fxExposures]);
 
   const currencyPairs = useMemo(() => {
     const pairs = new Set(fxExposures.map(e => e.currencyPair));
     return Array.from(pairs);
   }, [fxExposures]);
 
   return {
     exposures: filteredExposures,
     timeBuckets,
     summary,
     filters,
     setFilters,
     legalEntities,
     currencyPairs,
     isLoading,
   };
 };
 
 function generateDemoExposures(): FXExposure[] {
   const exposures: FXExposure[] = [];
   
   CURRENCY_PAIRS.forEach((pair) => {
     LEGAL_ENTITIES.forEach((entity) => {
       const [base, quote] = pair.split('/');
       const realizedAmount = Math.random() * 5000000 + 500000;
       const unrealizedAmount = Math.random() * 3000000 + 200000;
       
       exposures.push({
         currencyPair: pair,
         baseCurrency: base,
         quoteCurrency: quote,
         realizedAmount,
         unrealizedAmount,
         totalExposure: realizedAmount + unrealizedAmount,
         legalEntity: entity,
         dealCount: Math.floor(Math.random() * 50) + 10,
         lastUpdated: new Date().toISOString(),
       });
     });
   });
 
   return exposures;
 }
 
 function generateDemoTimeBuckets(bucketType: string): FXTimeBucket[] {
   const buckets: FXTimeBucket[] = [];
   const now = new Date();
   const count = bucketType === 'daily' ? 30 : bucketType === 'weekly' ? 12 : 6;
 
   for (let i = 0; i < count; i++) {
     const date = new Date(now);
     if (bucketType === 'daily') {
       date.setDate(date.getDate() - i);
     } else if (bucketType === 'weekly') {
       date.setDate(date.getDate() - i * 7);
     } else {
       date.setMonth(date.getMonth() - i);
     }
 
     const { startDate, endDate } = getBucketDates(date, bucketType);
     const netExposure = (Math.random() - 0.5) * 10000000;
     const hedgedRatio = Math.random() * 0.4 + 0.5;
 
     buckets.push({
       bucket: getBucketKey(date, bucketType),
       startDate,
       endDate,
       netExposure,
       realizedPnL: netExposure * 0.02 * (Math.random() - 0.3),
       unrealizedPnL: netExposure * 0.015 * (Math.random() - 0.2),
       hedgedAmount: Math.abs(netExposure) * hedgedRatio,
       unhedgedAmount: Math.abs(netExposure) * (1 - hedgedRatio),
     });
   }
 
   return buckets.reverse();
 }
 
 function getBucketKey(date: Date, bucketType: string): string {
   const year = date.getFullYear();
   const month = date.toLocaleString('en-US', { month: 'short' });
   
   if (bucketType === 'daily') {
     return date.toISOString().split('T')[0];
   } else if (bucketType === 'weekly') {
     const weekNum = getWeekNumber(date);
     return `${year}-W${weekNum.toString().padStart(2, '0')}`;
   } else {
     return `${month} ${year}`;
   }
 }
 
 function getBucketDates(date: Date, bucketType: string): { startDate: string; endDate: string } {
   const start = new Date(date);
   const end = new Date(date);
 
   if (bucketType === 'daily') {
     start.setHours(0, 0, 0, 0);
     end.setHours(23, 59, 59, 999);
   } else if (bucketType === 'weekly') {
     const day = start.getDay();
     start.setDate(start.getDate() - day);
     end.setDate(start.getDate() + 6);
   } else {
     start.setDate(1);
     end.setMonth(end.getMonth() + 1, 0);
   }
 
   return {
     startDate: start.toISOString().split('T')[0],
     endDate: end.toISOString().split('T')[0],
   };
 }
 
 function getWeekNumber(date: Date): number {
   const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
   const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
   return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
 }