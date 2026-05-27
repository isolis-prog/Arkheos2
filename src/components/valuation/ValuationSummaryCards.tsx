 import { MetricCard } from '@/components/ui/metric-card';
 import { ValuationSummary } from '@/hooks/useValuationConsistency';
 import { BookOpen, TrendingUp, AlertTriangle, AlertOctagon, BarChart3, DollarSign } from 'lucide-react';
 
 interface ValuationSummaryCardsProps {
   summary: ValuationSummary;
   isLoading?: boolean;
 }
 
 const formatCurrency = (value: number): string => {
   const absValue = Math.abs(value);
   if (absValue >= 1000000) {
     return `${value >= 0 ? '' : '-'}$${(absValue / 1000000).toFixed(2)}M`;
   }
   if (absValue >= 1000) {
     return `${value >= 0 ? '' : '-'}$${(absValue / 1000).toFixed(0)}K`;
   }
   return `$${value.toFixed(0)}`;
 };
 
 export const ValuationSummaryCards = ({ summary, isLoading }: ValuationSummaryCardsProps) => {
   return (
     <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
       <MetricCard
         title="Books Monitored"
         value={summary.totalBooks}
         icon={BookOpen}
         variant="default"
         isLoading={isLoading}
       />
       <MetricCard
         title="Curves in Use"
         value={summary.curvesInUse}
         icon={TrendingUp}
         variant="info"
         isLoading={isLoading}
       />
       <MetricCard
         title="Stale Data Alerts"
         value={summary.staleDataAlerts}
         icon={AlertTriangle}
         variant={summary.staleDataAlerts > 5 ? 'warning' : 'default'}
         isLoading={isLoading}
       />
       <MetricCard
         title="Critical Alerts"
         value={summary.criticalAlerts}
         icon={AlertOctagon}
         variant={summary.criticalAlerts > 0 ? 'error' : 'success'}
         subtitle={summary.criticalAlerts > 0 ? 'Requires attention' : 'All clear'}
         isLoading={isLoading}
       />
       <MetricCard
         title="Avg MTM Variance"
         value={`${summary.avgMTMVariance.toFixed(1)}%`}
         icon={BarChart3}
         variant={summary.avgMTMVariance > 5 ? 'warning' : 'default'}
         isLoading={isLoading}
       />
       <MetricCard
         title="Est. P&L Impact"
         value={formatCurrency(summary.totalPnLImpact)}
         icon={DollarSign}
         variant={summary.totalPnLImpact > 100000 ? 'warning' : 'default'}
         subtitle="From stale data"
         isLoading={isLoading}
       />
     </div>
   );
 };