import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MetricCard } from '@/components/ui/metric-card';
import { useExecutiveMetrics } from '@/hooks/useAdvancedAnalytics';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, AlertTriangle, Clock, ShieldCheck, Target, Database, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

export const ExecutiveSummary = () => {
  const { data: metrics, isLoading } = useExecutiveMetrics();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array(8).fill(0).map((_, i) => <Skeleton key={i} className="h-32" />)}
      </div>
    );
  }

  if (!metrics) return null;

  const cards = [
    {
      title: 'Match Rate',
      value: `${metrics.matchRate.toFixed(1)}%`,
      icon: Target,
      description: metrics.matchRate >= 90 ? 'Healthy' : 'Below target',
      trend: metrics.matchRate >= 90 ? 'up' as const : 'down' as const,
    },
    {
      title: 'Unmatched Amount',
      value: `$${(metrics.unmatchedAmount / 1000).toFixed(0)}K`,
      icon: TrendingDown,
      description: 'Total amount at risk',
      trend: 'down' as const,
    },
    {
      title: 'Open Exceptions',
      value: metrics.openExceptions.toString(),
      icon: AlertTriangle,
      description: `${metrics.slaBreaches} SLA breaches`,
      trend: metrics.openExceptions > 50 ? 'down' as const : 'up' as const,
    },
    {
      title: 'Avg Aging (Days)',
      value: metrics.avgAgingDays.toString(),
      icon: Clock,
      description: metrics.avgAgingDays > 7 ? 'Aging above target' : 'Within SLA',
      trend: metrics.avgAgingDays > 7 ? 'down' as const : 'up' as const,
    },
    {
      title: 'Close Readiness',
      value: `${metrics.closeReadinessPct}%`,
      icon: ShieldCheck,
      description: 'Period close progress',
      trend: metrics.closeReadinessPct >= 80 ? 'up' as const : 'down' as const,
    },
    {
      title: 'Posting Success',
      value: `${metrics.postingSuccessRate}%`,
      icon: Activity,
      description: 'T2C posting rate',
      trend: metrics.postingSuccessRate >= 95 ? 'up' as const : 'down' as const,
    },
    {
      title: 'Data Quality',
      value: `${metrics.dataQualityScore}%`,
      icon: Database,
      description: 'Overall DQ score',
      trend: metrics.dataQualityScore >= 90 ? 'up' as const : 'down' as const,
    },
    {
      title: 'SLA Breaches',
      value: metrics.slaBreaches.toString(),
      icon: AlertTriangle,
      description: 'Overdue exceptions',
      trend: metrics.slaBreaches === 0 ? 'up' as const : 'down' as const,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, i) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{card.title}</p>
                    <p className="text-2xl font-bold mt-1">{card.value}</p>
                    <div className="flex items-center gap-1 mt-1">
                      {card.trend === 'up' ? (
                        <TrendingUp className="h-3 w-3 text-emerald-500" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-destructive" />
                      )}
                      <span className="text-xs text-muted-foreground">{card.description}</span>
                    </div>
                  </div>
                  <div className="rounded-lg bg-muted p-3">
                    <card.icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
