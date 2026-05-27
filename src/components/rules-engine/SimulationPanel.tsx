import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MetricCard } from '@/components/ui/metric-card';
import { Play, CheckCircle2, XCircle, Activity, Timer } from 'lucide-react';
import { RuleExecution } from '@/hooks/useRulesEngine';
import { format } from 'date-fns';

interface Props {
  executions: RuleExecution[];
  stats: { totalExecutions: number; successRate: number };
}

const execStatusVariant: Record<string, 'success' | 'warning' | 'error' | 'info' | 'muted'> = {
  completed: 'success', running: 'info', failed: 'error', pending: 'muted',
};

export const SimulationPanel = ({ executions, stats }: Props) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <MetricCard title="Total Executions" value={stats.totalExecutions} icon={Activity} />
      <MetricCard title="Success Rate" value={`${stats.successRate}%`} icon={CheckCircle2} variant="success" />
      <MetricCard title="Simulations" value={executions.filter(e => e.execution_type === 'simulation').length} icon={Play} variant="info" />
      <MetricCard title="Failed" value={executions.filter(e => e.status === 'failed').length} icon={XCircle} variant="error" />
    </div>

    <div className="flex items-center justify-between">
      <h3 className="text-lg font-semibold">Execution History</h3>
      <Button><Play className="h-4 w-4 mr-2" />Run Simulation</Button>
    </div>

    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ruleset</TableHead>
              <TableHead>Version</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Processed</TableHead>
              <TableHead className="text-right">Matched</TableHead>
              <TableHead className="text-right">Failed</TableHead>
              <TableHead className="text-right">Match Rate</TableHead>
              <TableHead>Started</TableHead>
              <TableHead>Error</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {executions.map(exec => {
              const matchRate = exec.records_processed > 0 ? Math.round((exec.records_matched / exec.records_processed) * 100) : 0;
              return (
                <TableRow key={exec.id}>
                  <TableCell className="font-medium text-sm">{exec.ruleset_name}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">v{exec.version_number}</Badge></TableCell>
                  <TableCell><Badge variant={exec.execution_type === 'simulation' ? 'secondary' : 'default'} className="text-xs">{exec.execution_type}</Badge></TableCell>
                  <TableCell><StatusBadge variant={execStatusVariant[exec.status]}>{exec.status}</StatusBadge></TableCell>
                  <TableCell className="text-right font-mono text-sm">{exec.records_processed.toLocaleString()}</TableCell>
                  <TableCell className="text-right font-mono text-sm text-success">{exec.records_matched.toLocaleString()}</TableCell>
                  <TableCell className="text-right font-mono text-sm text-destructive">{exec.records_failed.toLocaleString()}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{matchRate}%</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{format(new Date(exec.started_at), 'MMM d HH:mm')}</TableCell>
                  <TableCell className="text-xs text-destructive truncate max-w-[150px]">{exec.error_message || '—'}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  </motion.div>
);
