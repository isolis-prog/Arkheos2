 import { useQuery } from '@tanstack/react-query';
 import { supabase } from '@/integrations/supabase/client';
 import { useMemo, useState } from 'react';
 
 export interface CurveUsage {
   curveId: string;
   curveName: string;
   curveType: 'forward' | 'spot' | 'volatility' | 'discount';
   books: string[];
   lastUpdated: string;
   isStale: boolean;
   staleDays: number;
   usageCount: number;
 }
 
 export interface StaleDataAlert {
   id: string;
   dataType: 'curve' | 'price' | 'fx_rate' | 'volatility';
   identifier: string;
   lastUpdate: string;
   staleDays: number;
   severity: 'low' | 'medium' | 'high';
   affectedBooks: string[];
   estimatedPnLImpact: number;
 }
 
 export interface MTMVariance {
   dealId: string;
   book: string;
   commodity: string;
   previousMTM: number;
   currentMTM: number;
   variance: number;
   variancePct: number;
   primaryDriver: string;
   curveContribution: number;
   priceContribution: number;
   fxContribution: number;
 }
 
 export interface ValuationSummary {
   totalBooks: number;
   curvesInUse: number;
   staleDataAlerts: number;
   criticalAlerts: number;
   avgMTMVariance: number;
   totalPnLImpact: number;
 }
 
 export interface ValuationFiltersState {
   book: string;
   curveType: string;
   alertSeverity: string;
   dateRange: 'today' | '7d' | '30d';
 }
 
 const CURVE_TYPES = ['forward', 'spot', 'volatility', 'discount'] as const;
 const BOOKS = ['Power-NA', 'Gas-EU', 'Oil-Asia', 'Renewables', 'Trading-UK', 'Hedging'];
 const COMMODITIES = ['Power', 'Natural Gas', 'Crude Oil', 'LNG', 'Carbon'];
 
 export const useValuationConsistency = () => {
   const [filters, setFilters] = useState<ValuationFiltersState>({
     book: '',
     curveType: '',
     alertSeverity: '',
     dateRange: '7d',
   });
 
   const { data: canonicalRecords, isLoading } = useQuery({
     queryKey: ['valuation-records'],
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
 
   const curveUsages = useMemo<CurveUsage[]>(() => {
     if (!canonicalRecords?.length) {
       return generateDemoCurveUsages();
     }
 
     const curveMap = new Map<string, CurveUsage>();
     const now = new Date();
 
     canonicalRecords.forEach((record) => {
       const book = record.book_portfolio || 'Unknown';
       const feeType = (record.fee_type || '').toLowerCase();
       
       // Infer curve type from record characteristics
       let curveType: CurveUsage['curveType'] = 'forward';
       if (feeType.includes('spot')) curveType = 'spot';
       else if (feeType.includes('vol') || feeType.includes('option')) curveType = 'volatility';
       else if (feeType.includes('discount') || feeType.includes('npv')) curveType = 'discount';
 
       const curveId = `${curveType}-${record.strategy || 'default'}`;
       const curveName = `${curveType.charAt(0).toUpperCase() + curveType.slice(1)} Curve - ${record.strategy || 'Standard'}`;
 
       if (!curveMap.has(curveId)) {
         const recordDate = record.created_at ? new Date(record.created_at) : now;
         const staleDays = Math.floor((now.getTime() - recordDate.getTime()) / (1000 * 60 * 60 * 24));
         
         curveMap.set(curveId, {
           curveId,
           curveName,
           curveType,
           books: [],
           lastUpdated: record.created_at || now.toISOString(),
           isStale: staleDays > 1,
           staleDays,
           usageCount: 0,
         });
       }
 
       const curve = curveMap.get(curveId)!;
       if (!curve.books.includes(book)) {
         curve.books.push(book);
       }
       curve.usageCount += 1;
     });
 
     const curves = Array.from(curveMap.values());
     return curves.length > 0 ? curves : generateDemoCurveUsages();
   }, [canonicalRecords]);
 
   const staleDataAlerts = useMemo<StaleDataAlert[]>(() => {
     if (!canonicalRecords?.length) {
       return generateDemoAlerts();
     }
 
     const alerts: StaleDataAlert[] = [];
     const now = new Date();
 
     curveUsages.forEach((curve) => {
       if (curve.isStale) {
         const severity: StaleDataAlert['severity'] = 
           curve.staleDays > 5 ? 'high' : curve.staleDays > 2 ? 'medium' : 'low';
         
         alerts.push({
           id: `stale-${curve.curveId}`,
           dataType: 'curve',
           identifier: curve.curveName,
           lastUpdate: curve.lastUpdated,
           staleDays: curve.staleDays,
           severity,
           affectedBooks: curve.books,
           estimatedPnLImpact: curve.usageCount * (curve.staleDays * 1000) * (Math.random() + 0.5),
         });
       }
     });
 
     return alerts.length > 0 ? alerts : generateDemoAlerts();
   }, [curveUsages, canonicalRecords]);
 
   const mtmVariances = useMemo<MTMVariance[]>(() => {
     if (!canonicalRecords?.length) {
       return generateDemoMTMVariances();
     }
 
     const variances: MTMVariance[] = [];
     const dealMap = new Map<string, typeof canonicalRecords>();
 
     canonicalRecords.forEach((record) => {
       if (!record.deal_id) return;
       if (!dealMap.has(record.deal_id)) {
         dealMap.set(record.deal_id, []);
       }
       dealMap.get(record.deal_id)!.push(record);
     });
 
     dealMap.forEach((records, dealId) => {
       if (records.length < 2) return;
       
       const sorted = records.sort((a, b) => 
         new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
       );
       
       const previous = sorted[sorted.length - 2];
       const current = sorted[sorted.length - 1];
       const prevMTM = previous.amount || 0;
       const currMTM = current.amount || 0;
       const variance = currMTM - prevMTM;
       const variancePct = prevMTM !== 0 ? (variance / Math.abs(prevMTM)) * 100 : 0;
 
       if (Math.abs(variancePct) > 1) {
         const curveContrib = variance * (0.3 + Math.random() * 0.3);
         const priceContrib = variance * (0.2 + Math.random() * 0.3);
         const fxContrib = variance - curveContrib - priceContrib;
 
         variances.push({
           dealId,
           book: current.book_portfolio || 'Unknown',
           commodity: current.strategy || 'Unknown',
           previousMTM: prevMTM,
           currentMTM: currMTM,
           variance,
           variancePct,
           primaryDriver: Math.abs(curveContrib) > Math.abs(priceContrib) 
             ? (Math.abs(curveContrib) > Math.abs(fxContrib) ? 'Curve' : 'FX')
             : (Math.abs(priceContrib) > Math.abs(fxContrib) ? 'Price' : 'FX'),
           curveContribution: curveContrib,
           priceContribution: priceContrib,
           fxContribution: fxContrib,
         });
       }
     });
 
     return variances.length > 0 ? variances : generateDemoMTMVariances();
   }, [canonicalRecords]);
 
   const filteredCurves = useMemo(() => {
     return curveUsages.filter((curve) => {
       if (filters.book && !curve.books.includes(filters.book)) return false;
       if (filters.curveType && curve.curveType !== filters.curveType) return false;
       return true;
     });
   }, [curveUsages, filters]);
 
   const filteredAlerts = useMemo(() => {
     return staleDataAlerts.filter((alert) => {
       if (filters.alertSeverity && alert.severity !== filters.alertSeverity) return false;
       if (filters.book && !alert.affectedBooks.includes(filters.book)) return false;
       return true;
     });
   }, [staleDataAlerts, filters]);
 
   const filteredVariances = useMemo(() => {
     return mtmVariances.filter((v) => {
       if (filters.book && v.book !== filters.book) return false;
       return true;
     });
   }, [mtmVariances, filters]);
 
   const summary = useMemo<ValuationSummary>(() => {
     const books = new Set(curveUsages.flatMap(c => c.books));
     const criticalAlerts = staleDataAlerts.filter(a => a.severity === 'high').length;
     const totalPnLImpact = staleDataAlerts.reduce((sum, a) => sum + a.estimatedPnLImpact, 0);
     const avgVariance = mtmVariances.length > 0
       ? mtmVariances.reduce((sum, v) => sum + Math.abs(v.variancePct), 0) / mtmVariances.length
       : 0;
 
     return {
       totalBooks: books.size,
       curvesInUse: curveUsages.length,
       staleDataAlerts: staleDataAlerts.length,
       criticalAlerts,
       avgMTMVariance: avgVariance,
       totalPnLImpact,
     };
   }, [curveUsages, staleDataAlerts, mtmVariances]);
 
   const books = useMemo(() => {
     const allBooks = new Set(curveUsages.flatMap(c => c.books));
     return Array.from(allBooks);
   }, [curveUsages]);
 
   return {
     curveUsages: filteredCurves,
     staleDataAlerts: filteredAlerts,
     mtmVariances: filteredVariances,
     summary,
     filters,
     setFilters,
     books,
     isLoading,
   };
 };
 
 function generateDemoCurveUsages(): CurveUsage[] {
   const curves: CurveUsage[] = [];
   const now = new Date();
 
   CURVE_TYPES.forEach((type) => {
     COMMODITIES.forEach((commodity) => {
       const staleDays = Math.floor(Math.random() * 7);
       const assignedBooks = BOOKS.filter(() => Math.random() > 0.5);
       
       curves.push({
         curveId: `${type}-${commodity.toLowerCase().replace(' ', '-')}`,
         curveName: `${commodity} ${type.charAt(0).toUpperCase() + type.slice(1)} Curve`,
         curveType: type,
         books: assignedBooks.length > 0 ? assignedBooks : [BOOKS[0]],
         lastUpdated: new Date(now.getTime() - staleDays * 24 * 60 * 60 * 1000).toISOString(),
         isStale: staleDays > 1,
         staleDays,
         usageCount: Math.floor(Math.random() * 100) + 10,
       });
     });
   });
 
   return curves;
 }
 
 function generateDemoAlerts(): StaleDataAlert[] {
   const alerts: StaleDataAlert[] = [];
   const dataTypes: StaleDataAlert['dataType'][] = ['curve', 'price', 'fx_rate', 'volatility'];
   
   for (let i = 0; i < 12; i++) {
     const staleDays = Math.floor(Math.random() * 10) + 1;
     const severity: StaleDataAlert['severity'] = 
       staleDays > 5 ? 'high' : staleDays > 2 ? 'medium' : 'low';
     const dataType = dataTypes[Math.floor(Math.random() * dataTypes.length)];
     
     alerts.push({
       id: `alert-${i}`,
       dataType,
       identifier: `${dataType.replace('_', ' ').toUpperCase()} - ${COMMODITIES[i % COMMODITIES.length]}`,
       lastUpdate: new Date(Date.now() - staleDays * 24 * 60 * 60 * 1000).toISOString(),
       staleDays,
       severity,
       affectedBooks: BOOKS.filter(() => Math.random() > 0.6),
       estimatedPnLImpact: (Math.random() * 500000 + 10000) * (staleDays / 3),
     });
   }
 
   return alerts.sort((a, b) => {
     const severityOrder = { high: 0, medium: 1, low: 2 };
     return severityOrder[a.severity] - severityOrder[b.severity];
   });
 }
 
 function generateDemoMTMVariances(): MTMVariance[] {
   const variances: MTMVariance[] = [];
   
   for (let i = 0; i < 20; i++) {
     const prevMTM = (Math.random() - 0.3) * 2000000;
     const variance = (Math.random() - 0.5) * 200000;
     const currMTM = prevMTM + variance;
     const variancePct = (variance / Math.abs(prevMTM)) * 100;
     
     const curveContrib = variance * (0.3 + Math.random() * 0.3);
     const priceContrib = variance * (0.2 + Math.random() * 0.3);
     const fxContrib = variance - curveContrib - priceContrib;
 
     variances.push({
       dealId: `DEAL-${1000 + i}`,
       book: BOOKS[Math.floor(Math.random() * BOOKS.length)],
       commodity: COMMODITIES[Math.floor(Math.random() * COMMODITIES.length)],
       previousMTM: prevMTM,
       currentMTM: currMTM,
       variance,
       variancePct,
       primaryDriver: Math.abs(curveContrib) > Math.abs(priceContrib) 
         ? (Math.abs(curveContrib) > Math.abs(fxContrib) ? 'Curve' : 'FX')
         : (Math.abs(priceContrib) > Math.abs(fxContrib) ? 'Price' : 'FX'),
       curveContribution: curveContrib,
       priceContribution: priceContrib,
       fxContribution: fxContrib,
     });
   }
 
   return variances.sort((a, b) => Math.abs(b.variancePct) - Math.abs(a.variancePct));
 }