import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAnomalyDetection } from '@/hooks/useAdvancedAnalytics';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, Eye, CheckCircle, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const severityColor = (s: string) => {
  if (s === 'critical') return 'destructive';
  if (s === 'high') return 'default';
  return 'secondary';
};

export const AnomalyDetection = () => {
  const { data: anomalies, isLoading } = useAnomalyDetection();

  if (isLoading) return <Skeleton className="h-96" />;

  const items = anomalies || [];
  const active = items.filter(a => !a.isAcknowledged);
  const acknowledged = items.filter(a => a.isAcknowledged);

  return (
    <div className="space-y-6">
      {/* Summary strip */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <Zap className="h-8 w-8 text-amber-500" />
            <div>
              <p className="text-sm text-muted-foreground">Total Anomalies</p>
              <p className="text-2xl font-bold">{items.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <AlertTriangle className="h-8 w-8 text-destructive" />
            <div>
              <p className="text-sm text-muted-foreground">Active Alerts</p>
              <p className="text-2xl font-bold">{active.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <CheckCircle className="h-8 w-8 text-emerald-500" />
            <div>
              <p className="text-sm text-muted-foreground">Acknowledged</p>
              <p className="text-2xl font-bold">{acknowledged.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Anomaly cards */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detected Anomalies</CardTitle>
          <CardDescription>Statistical outliers identified via z-score / IQR analysis</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-muted-foreground">
              <CheckCircle className="h-10 w-10 mb-2 text-emerald-500" />
              <p>No anomalies detected</p>
            </div>
          ) : (
            items.map((a, i) => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className={a.isAcknowledged ? 'opacity-60' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={severityColor(a.severity)}>
                            {a.severity}
                          </Badge>
                          <Badge variant="outline">z = {a.zScore}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {a.metricKey.replace(/_/g, ' ')} · {a.entityType}/{a.entityId}
                          </span>
                        </div>
                        <p className="text-sm mt-2">{a.explanation}</p>
                        <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                          <span>Observed: <strong className="font-mono">{a.observedValue.toLocaleString()}</strong></span>
                          <span>Expected: <strong className="font-mono">{a.expectedValue.toLocaleString()}</strong></span>
                          <span>{new Date(a.detectedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      {!a.isAcknowledged && (
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-1" /> Acknowledge
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};
