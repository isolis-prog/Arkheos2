import { useState } from 'react';
import { History, Activity, Clock, TrendingUp } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MetricCard } from '@/components/ui/metric-card';
import { AuditLogFilters } from '@/components/audit/AuditLogFilters';
import { AuditLogTable } from '@/components/audit/AuditLogTable';
import { useAuditLogs, useAuditLogStats, type AuditLogFilters as Filters } from '@/hooks/useAuditLogs';

export default function AuditLogs() {
  const [filters, setFilters] = useState<Filters>({});
  
  const { data: logs = [], isLoading: logsLoading } = useAuditLogs(filters);
  const { data: stats, isLoading: statsLoading } = useAuditLogStats();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Logs"
        description="Track all user actions and system events with detailed activity history"
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          title="Total Events"
          value={stats?.totalCount ?? 0}
          icon={Activity}
          isLoading={statsLoading}
        />
        <MetricCard
          title="Last 24 Hours"
          value={stats?.recentCount ?? 0}
          icon={Clock}
          isLoading={statsLoading}
        />
        <MetricCard
          title="Action Types"
          value={stats?.actions.length ?? 0}
          icon={TrendingUp}
          isLoading={statsLoading}
        />
        <MetricCard
          title="Filtered Results"
          value={logs.length}
          icon={History}
          isLoading={logsLoading}
        />
      </div>

      {/* Action Breakdown */}
      {stats?.actionCounts && Object.keys(stats.actionCounts).length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Action Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {Object.entries(stats.actionCounts).map(([action, count]) => (
                <div
                  key={action}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted text-sm"
                >
                  <span className="font-medium">{action.replace(/_/g, ' ')}</span>
                  <span className="text-muted-foreground">({count})</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <AuditLogFilters
            filters={filters}
            onFiltersChange={setFilters}
            availableActions={stats?.actions || []}
            availableEntityTypes={stats?.entityTypes || []}
          />
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <History className="h-5 w-5" />
            Activity Log
            {logs.length > 0 && (
              <span className="text-sm font-normal text-muted-foreground">
                ({logs.length} events)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AuditLogTable logs={logs} isLoading={logsLoading} />
        </CardContent>
      </Card>
    </div>
  );
}
