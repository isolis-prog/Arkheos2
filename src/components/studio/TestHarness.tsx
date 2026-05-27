import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Play, FlaskConical, CheckCircle2, XCircle, Clock, SkipForward } from 'lucide-react';
import { StudioRun } from '@/hooks/useStudio';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const statusConfig: Record<string, { icon: React.ReactNode; color: string }> = {
  completed: { icon: <CheckCircle2 className="h-4 w-4" />, color: 'text-emerald-600' },
  failed: { icon: <XCircle className="h-4 w-4" />, color: 'text-destructive' },
  running: { icon: <Clock className="h-4 w-4 animate-spin" />, color: 'text-blue-500' },
  pending: { icon: <Clock className="h-4 w-4" />, color: 'text-muted-foreground' },
  cancelled: { icon: <XCircle className="h-4 w-4" />, color: 'text-muted-foreground' },
  skipped: { icon: <SkipForward className="h-4 w-4" />, color: 'text-muted-foreground' },
};

interface Props {
  runs: StudioRun[];
}

export const TestHarness = ({ runs }: Props) => {
  const testRuns = runs.filter(r => r.isTest);
  const prodRuns = runs.filter(r => !r.isTest);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Test Harness & Run History</h3>
          <p className="text-sm text-muted-foreground">Run workflows with sample data and review execution results</p>
        </div>
        <Button size="sm"><FlaskConical className="h-4 w-4 mr-1" /> New Test Run</Button>
      </div>

      {/* Test runs */}
      {testRuns.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-purple-500" />
              <CardTitle className="text-base">Test Runs</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {testRuns.map(run => (
              <RunCard key={run.id} run={run} />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Production runs */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Play className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Production Runs</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {prodRuns.map(run => (
            <RunCard key={run.id} run={run} />
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
};

const RunCard = ({ run }: { run: StudioRun }) => {
  const sc = statusConfig[run.status];
  const successSteps = run.stepResults.filter(s => s.status === 'completed').length;
  const progress = (successSteps / run.stepResults.length) * 100;

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn('flex items-center gap-1.5', sc.color)}>
            {sc.icon}
            <span className="font-medium text-sm capitalize">{run.status}</span>
          </div>
          <span className="font-medium text-sm">{run.workflowName}</span>
          {run.isTest && <Badge className="bg-purple-500/10 text-purple-600 text-xs">TEST</Badge>}
          <Badge variant="secondary" className="text-xs capitalize">{run.triggerType}</Badge>
        </div>
        <div className="text-xs text-muted-foreground">
          {format(new Date(run.startedAt), 'MMM dd HH:mm')}
          {run.durationMs && <span className="ml-2">{(run.durationMs / 1000).toFixed(1)}s</span>}
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs">
        <span>Input: <strong>{run.inputSummary.records}</strong> records from {run.inputSummary.source}</span>
        {run.outputSummary && (
          <>
            <span className="text-emerald-600">✓ {run.outputSummary.matched} matched</span>
            <span className="text-amber-600">⚠ {run.outputSummary.exceptions} exceptions</span>
            <span className="text-blue-600">↑ {run.outputSummary.posted} posted</span>
          </>
        )}
        {run.errorMessage && <span className="text-destructive">{run.errorMessage}</span>}
      </div>

      <Progress value={progress} className="h-1.5" />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Step</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Records</TableHead>
            <TableHead className="text-right">Duration</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {run.stepResults.map((sr, i) => {
            const ssc = statusConfig[sr.status] || statusConfig.pending;
            return (
              <TableRow key={i}>
                <TableCell className="text-sm">{sr.step}</TableCell>
                <TableCell>
                  <div className={cn('flex items-center gap-1 text-xs', ssc.color)}>
                    {ssc.icon}
                    <span className="capitalize">{sr.status}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right text-sm">{sr.records}</TableCell>
                <TableCell className="text-right text-sm text-muted-foreground">
                  {sr.duration > 0 ? `${(sr.duration / 1000).toFixed(1)}s` : '—'}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
