import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { MetricsRow } from '@/components/dashboard/MetricsRow';
import { ChartsRow } from '@/components/dashboard/ChartsRow';
import { RecentRunsCard } from '@/components/dashboard/RecentRunsCard';
import { TopExceptionsCard } from '@/components/dashboard/TopExceptionsCard';
import { AIKPIWidgets } from '@/components/ail/AIKPIWidgets';
import { ModuleIdentityBadge } from '@/components/packages/ModuleIdentityBadge';
import { PackageKPIRows } from '@/components/dashboard/PackageKPIRows';
import { PackageUpsellCards } from '@/components/dashboard/PackageUpsellCards';
import {
  useDashboardMetrics,
  useRecentRuns,
  useTopExceptions,
  useBreaksByType,
  useMatchRateTrend,
} from '@/hooks/useDashboardData';

export default function Dashboard() {
  const { data: metrics, isLoading: metricsLoading } = useDashboardMetrics();
  const { data: recentRuns, isLoading: runsLoading } = useRecentRuns();
  const { data: topExceptions, isLoading: exceptionsLoading } = useTopExceptions();
  const { data: breaksByType, isLoading: breaksLoading } = useBreaksByType();
  const { data: matchRateTrend, isLoading: trendLoading } = useMatchRateTrend();

  return (
    <div className="space-y-8">
      <ModuleIdentityBadge moduleKey="DASHBOARD" moduleName="Dashboard" />

      <PageHeader
        title="Dashboard"
        description="Overview of your reconciliation status"
        actions={
          <Button asChild>
            <Link to="/reconciliations/new">
              Run Reconciliation
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        }
      />

      {/* Core KPI Metrics */}
      <MetricsRow
        matchRate={metrics?.matchRate || 0}
        openExceptions={metrics?.openExceptions || 0}
        criticalExceptions={metrics?.criticalExceptions || 0}
        highExceptions={metrics?.highExceptions || 0}
        pendingAmendments={metrics?.pendingAmendments || 0}
        amountAtRisk={metrics?.amountAtRisk || 0}
        lastRunTime={metrics?.lastRunTime || null}
        loading={metricsLoading}
      />

      {/* Charts Row */}
      <ChartsRow
        matchRateTrend={matchRateTrend || []}
        breaksByType={breaksByType || []}
        loading={breaksLoading || trendLoading}
      />

      {/* Package-specific KPI rows */}
      <PackageKPIRows />

      {/* AI Intelligence KPIs */}
      <AIKPIWidgets />

      {/* Recent Runs & Top Exceptions */}
      <div className="grid gap-6 lg:grid-cols-2">
        <RecentRunsCard runs={recentRuns || []} loading={runsLoading} />
        <TopExceptionsCard exceptions={topExceptions || []} loading={exceptionsLoading} />
      </div>

      {/* Package Upsell Cards */}
      <PackageUpsellCards />
    </div>
  );
}
