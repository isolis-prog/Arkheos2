 import { MetricCard } from '@/components/ui/metric-card';
 import { CloseReadinessSummary } from '@/hooks/useCloseReadiness';
 import { 
   CheckCircle2, 
   Clock, 
   AlertTriangle, 
   DollarSign, 
   Building2, 
   Calendar,
   TrendingUp,
   Target
 } from 'lucide-react';
 
 interface CloseReadinessKPIsProps {
   summary: CloseReadinessSummary;
   isLoading?: boolean;
 }
 
 export const CloseReadinessKPIs = ({ summary, isLoading }: CloseReadinessKPIsProps) => {
   return (
     <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
       <MetricCard
         title="Overall Completion"
         value={`${summary.overallCompletionPct.toFixed(1)}%`}
         icon={Target}
         variant={summary.overallCompletionPct >= 90 ? 'success' : summary.overallCompletionPct >= 70 ? 'warning' : 'error'}
         trend={{
           value: summary.overallCompletionPct >= 80 ? 5 : -3,
           isPositive: summary.overallCompletionPct >= 80,
         }}
         isLoading={isLoading}
       />
       <MetricCard
         title="Entities Ready"
         value={`${summary.entitiesReady}/${summary.entitiesTotal}`}
         subtitle={`${((summary.entitiesReady / summary.entitiesTotal) * 100).toFixed(0)}% complete`}
         icon={Building2}
         variant={summary.entitiesReady === summary.entitiesTotal ? 'success' : 'info'}
         isLoading={isLoading}
       />
       <MetricCard
         title="Days to Close"
         value={summary.daysToClose}
         subtitle={summary.estimatedCloseDate}
         icon={Calendar}
         variant={summary.isOnTrack ? 'success' : 'warning'}
         isLoading={isLoading}
       />
       <MetricCard
         title="Close Status"
         value={summary.isOnTrack ? 'On Track' : 'At Risk'}
         icon={summary.isOnTrack ? CheckCircle2 : AlertTriangle}
         variant={summary.isOnTrack ? 'success' : 'error'}
         isLoading={isLoading}
       />
     </div>
   );
 };
 
 export const CloseBlockersKPIs = ({ summary, isLoading }: CloseReadinessKPIsProps) => {
   return (
     <div className="grid gap-4 md:grid-cols-3">
       <MetricCard
         title="Open Events"
         value={summary.totalOpenEvents}
         subtitle="Requiring action"
         icon={Clock}
         variant={summary.totalOpenEvents > 20 ? 'error' : summary.totalOpenEvents > 5 ? 'warning' : 'success'}
         isLoading={isLoading}
       />
       <MetricCard
         title="Missing Valuations"
         value={summary.totalMissingValuations}
         subtitle="Trades without MTM"
         icon={TrendingUp}
         variant={summary.totalMissingValuations > 10 ? 'error' : summary.totalMissingValuations > 3 ? 'warning' : 'success'}
         isLoading={isLoading}
       />
       <MetricCard
         title="Pending FX"
         value={summary.totalPendingFX}
         subtitle="Unsettled FX items"
         icon={DollarSign}
         variant={summary.totalPendingFX > 10 ? 'error' : summary.totalPendingFX > 3 ? 'warning' : 'success'}
         isLoading={isLoading}
       />
     </div>
   );
 };