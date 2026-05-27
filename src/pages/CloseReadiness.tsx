 import { PageHeader } from '@/components/ui/page-header';
 import { CloseReadinessFilters } from '@/components/close-readiness/CloseReadinessFilters';
 import { CloseReadinessKPIs, CloseBlockersKPIs } from '@/components/close-readiness/CloseReadinessKPIs';
 import { EntityReadinessTable } from '@/components/close-readiness/EntityReadinessTable';
 import { CloseChecklist } from '@/components/close-readiness/CloseChecklist';
 import { ReadinessGauge } from '@/components/close-readiness/ReadinessGauge';
 import { AICloseReadiness } from '@/components/ail/AICloseReadiness';
 import { useCloseReadiness } from '@/hooks/useCloseReadiness';
 import { Skeleton } from '@/components/ui/skeleton';
 
 const CloseReadiness = () => {
   const {
     entityReadiness,
     checklist,
     summary,
     filters,
     setFilters,
     legalEntities,
     isLoading,
   } = useCloseReadiness();
 
   return (
     <div className="space-y-6">
       <PageHeader
         title="Close Readiness Dashboard"
         description="Period close readiness overview with completion tracking by legal entity"
       />
 
       <CloseReadinessFilters
         filters={filters}
         onFiltersChange={setFilters}
         legalEntities={legalEntities}
       />
 
       {isLoading ? (
         <div className="space-y-4">
           <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
             {Array(4).fill(0).map((_, i) => (
               <Skeleton key={i} className="h-32" />
             ))}
           </div>
           <Skeleton className="h-[400px]" />
         </div>
       ) : (
          <>
            <AICloseReadiness closeData={{ summary, checklist }} />

            <CloseReadinessKPIs summary={summary} />
 
           <CloseBlockersKPIs summary={summary} />
 
           <div className="grid gap-6 lg:grid-cols-3">
             <div className="lg:col-span-1">
               <ReadinessGauge summary={summary} />
             </div>
             <div className="lg:col-span-2">
               <CloseChecklist items={checklist} />
             </div>
           </div>
 
           <EntityReadinessTable entities={entityReadiness} />
         </>
       )}
     </div>
   );
 };
 
 export default CloseReadiness;