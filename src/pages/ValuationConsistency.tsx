 import { PageHeader } from '@/components/ui/page-header';
 import { ValuationFilters } from '@/components/valuation/ValuationFilters';
 import { ValuationSummaryCards } from '@/components/valuation/ValuationSummaryCards';
 import { CurveUsageChart } from '@/components/valuation/CurveUsageChart';
 import { StaleDataAlerts } from '@/components/valuation/StaleDataAlerts';
 import { MTMVarianceTable } from '@/components/valuation/MTMVarianceTable';
 import { useValuationConsistency } from '@/hooks/useValuationConsistency';
 import { Skeleton } from '@/components/ui/skeleton';
 
 const ValuationConsistency = () => {
   const {
     curveUsages,
     staleDataAlerts,
     mtmVariances,
     summary,
     filters,
     setFilters,
     books,
     isLoading,
   } = useValuationConsistency();
 
   return (
     <div className="space-y-6">
       <PageHeader
         title="Valuation & Curve Consistency"
         description="Detect inconsistencies in valuation inputs, stale market data, and MTM variance drivers"
       />
 
       <ValuationFilters
         filters={filters}
         onFiltersChange={setFilters}
         books={books}
       />
 
       {isLoading ? (
         <div className="space-y-4">
           <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
             {Array(6).fill(0).map((_, i) => (
               <Skeleton key={i} className="h-32" />
             ))}
           </div>
           <Skeleton className="h-[300px]" />
         </div>
       ) : (
         <>
           <ValuationSummaryCards summary={summary} />
 
           <CurveUsageChart curveUsages={curveUsages} />
 
           <div className="grid gap-6 lg:grid-cols-3">
             <div className="lg:col-span-1">
               <StaleDataAlerts alerts={staleDataAlerts} />
             </div>
             <div className="lg:col-span-2">
               <MTMVarianceTable variances={mtmVariances} />
             </div>
           </div>
         </>
       )}
     </div>
   );
 };
 
 export default ValuationConsistency;