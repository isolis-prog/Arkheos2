 import { MetricCard } from '@/components/ui/metric-card';
 import { FXSummary } from '@/hooks/useFXAnalytics';
 import { DollarSign, TrendingUp, TrendingDown, Shield, Globe, Building2 } from 'lucide-react';
 
 interface FXExposureCardsProps {
   summary: FXSummary;
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
 
 export const FXExposureCards = ({ summary, isLoading }: FXExposureCardsProps) => {
   return (
     <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
       <MetricCard
         title="Net FX Exposure"
         value={formatCurrency(summary.netFXExposure)}
         icon={DollarSign}
         variant="info"
         isLoading={isLoading}
       />
       <MetricCard
         title="Realized P&L"
         value={formatCurrency(summary.totalRealizedPnL)}
         icon={summary.totalRealizedPnL >= 0 ? TrendingUp : TrendingDown}
         variant={summary.totalRealizedPnL >= 0 ? 'success' : 'error'}
         trend={{
           value: Math.abs(summary.totalRealizedPnL / (summary.netFXExposure || 1) * 100),
           isPositive: summary.totalRealizedPnL >= 0,
         }}
         isLoading={isLoading}
       />
       <MetricCard
         title="Unrealized P&L"
         value={formatCurrency(summary.totalUnrealizedPnL)}
         icon={summary.totalUnrealizedPnL >= 0 ? TrendingUp : TrendingDown}
         variant={summary.totalUnrealizedPnL >= 0 ? 'success' : 'warning'}
         trend={{
           value: Math.abs(summary.totalUnrealizedPnL / (summary.netFXExposure || 1) * 100),
           isPositive: summary.totalUnrealizedPnL >= 0,
         }}
         isLoading={isLoading}
       />
       <MetricCard
         title="Hedge Ratio"
         value={`${summary.hedgeRatio.toFixed(1)}%`}
         subtitle={summary.hedgeRatio >= 70 ? 'Well hedged' : 'Underhedged'}
         icon={Shield}
         variant={summary.hedgeRatio >= 70 ? 'success' : 'warning'}
         isLoading={isLoading}
       />
       <MetricCard
         title="Currency Pairs"
         value={summary.currencyPairCount}
         subtitle="Active pairs"
         icon={Globe}
         variant="default"
         isLoading={isLoading}
       />
       <MetricCard
         title="Legal Entities"
         value={summary.entityCount}
         subtitle="With exposure"
         icon={Building2}
         variant="default"
         isLoading={isLoading}
       />
     </div>
   );
 };