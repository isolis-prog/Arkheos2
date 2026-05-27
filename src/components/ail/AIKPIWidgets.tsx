/**
 * AIL Integration — AI Performance KPI widgets for Dashboard.
 */
import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAILStatus } from '@/hooks/useAIL';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { Sparkles, ThumbsUp, Activity, MessageSquare } from 'lucide-react';

export const AIKPIWidgets = () => {
  const { isEnabled } = useFeatureFlags();
  const { stats, refresh } = useAILStatus();

  useEffect(() => {
    if (isEnabled('module.ail')) {
      refresh();
    }
  }, [isEnabled, refresh]);

  if (!isEnabled('module.ail')) return null;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <ThumbsUp className="h-4 w-4 text-primary" />
            AI Acceptance Rate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{stats.acceptanceRate}%</p>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.totalFeedback} feedback events (last 30 days)
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            AI Inferences
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{stats.totalInferences}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Avg latency: {stats.avgLatencyMs}ms
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Embeddings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{stats.totalEmbeddings.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.queuedJobs} queued • {stats.processingJobs} processing
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
