import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { DQCheckRun } from '@/hooks/useDataHealth';

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  running: 'secondary',
  completed: 'default',
  failed: 'destructive',
};

export const CheckRunsTable = ({ runs }: { runs: DQCheckRun[] }) => (
  <div className="rounded-lg border bg-card">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Run ID</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Source</TableHead>
          <TableHead>Started</TableHead>
          <TableHead className="text-center">Checks</TableHead>
          <TableHead>Pass Rate</TableHead>
          <TableHead className="text-center">Failed</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {runs.map(r => {
          const passRate = r.totalChecks > 0 ? Math.round((r.passed / r.totalChecks) * 100) : 0;
          return (
            <TableRow key={r.id}>
              <TableCell className="font-mono text-xs">{r.id}</TableCell>
              <TableCell className="capitalize">{r.runType}</TableCell>
              <TableCell className="uppercase text-xs font-medium">{r.sourceSystem}</TableCell>
              <TableCell className="text-sm">{new Date(r.startedAt).toLocaleString()}</TableCell>
              <TableCell className="text-center">{r.totalChecks}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Progress value={passRate} className="h-1.5 w-16" />
                  <span className="text-xs">{passRate}%</span>
                </div>
              </TableCell>
              <TableCell className="text-center font-medium">{r.failed}</TableCell>
              <TableCell><Badge variant={statusVariant[r.status]}>{r.status}</Badge></TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  </div>
);
