 import { Activity } from 'lucide-react';
 import { PageHeader } from '@/components/ui/page-header';
 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { LifecycleFilters } from '@/components/trade-lifecycle/LifecycleFilters';
 import { LifecycleStageCard } from '@/components/trade-lifecycle/LifecycleStageCard';
 import { TradeLifecycleTable } from '@/components/trade-lifecycle/TradeLifecycleTable';
 import { AILifecyclePrediction } from '@/components/ail/AILifecyclePrediction';
 import { useTradeLifecycle } from '@/hooks/useTradeLifecycle';
 
 const TradeLifecycle = () => {
   const {
     trades,
     isLoading,
     filters,
     setFilters,
     filterOptions,
     stageStats,
     STAGE_ORDER,
   } = useTradeLifecycle();
 
   const handleStageClick = (stage: string) => {
     setFilters({
       ...filters,
       stage: filters.stage === stage ? 'all' : stage,
     });
   };
 
   return (
     <div className="space-y-6">
       <PageHeader
         title="Trade Lifecycle Intelligence"
         description="End-to-end lifecycle visualization of trades inferred from economic events"
       />
 
       {/* Stage overview cards */}
       <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
         {stageStats.map((stat) => (
           <LifecycleStageCard
             key={stat.stage}
             stage={stat.stage}
             count={stat.count}
             amount={stat.amount}
             isActive={filters.stage === stat.stage}
             onClick={() => handleStageClick(stat.stage)}
           />
         ))}
       </div>
 
       {/* Filters and table */}
       <Card>
         <CardHeader className="pb-4">
           <CardTitle className="flex items-center gap-2 text-lg">
             <Activity className="h-5 w-5" />
             Trade Lifecycles
           </CardTitle>
         </CardHeader>
         <CardContent className="space-y-4">
           <LifecycleFilters
             filters={filters}
             onFiltersChange={setFilters}
             filterOptions={filterOptions}
             stages={STAGE_ORDER}
           />
           <TradeLifecycleTable trades={trades} isLoading={isLoading} />
         </CardContent>
       </Card>
     </div>
   );
 };
 
 export default TradeLifecycle;