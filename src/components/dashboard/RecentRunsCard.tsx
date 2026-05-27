import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge, getStatusVariant } from '@/components/ui/status-badge';
import { Skeleton } from '@/components/ui/skeleton';

interface RecentRun {
  id: string;
  template: string;
  period: string;
  status: string;
  matchRate: number;
  breaks: number;
}

interface RecentRunsCardProps {
  runs: RecentRun[];
  loading?: boolean;
}

export function RecentRunsCard({ runs, loading }: RecentRunsCardProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            Recent Runs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-muted-foreground" />
          Recent Runs
        </CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/reconciliations">View All</Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {runs.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No reconciliation runs yet</p>
          ) : (
            runs.map((run, index) => (
              <motion.div
                key={run.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div>
                  <p className="font-medium">{run.template}</p>
                  <p className="text-sm text-muted-foreground">{run.period}</p>
                </div>
                <div className="flex items-center gap-4">
                  {run.status === 'completed' && (
                    <div className="text-right">
                      <p className="font-medium text-accent">{run.matchRate.toFixed(1)}%</p>
                      <p className="text-xs text-muted-foreground">{run.breaks} breaks</p>
                    </div>
                  )}
                  <StatusBadge variant={getStatusVariant(run.status)}>
                    {run.status}
                  </StatusBadge>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
