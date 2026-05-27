import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { IntegrationJob } from '@/hooks/useIntegrationStudio';

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'outline', running: 'secondary', completed: 'default', failed: 'destructive', retrying: 'secondary',
};

export const JobsTable = ({ jobs }: { jobs: IntegrationJob[] }) => (
  <div className="rounded-lg border bg-card">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Job ID</TableHead>
          <TableHead>Instance</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Progress</TableHead>
          <TableHead className="text-center">Failed</TableHead>
          <TableHead className="text-center">Retries</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Error</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {jobs.map(j => {
          const pct = j.recordsProcessed > 0 ? Math.round((j.recordsSuccess / j.recordsProcessed) * 100) : 0;
          return (
            <TableRow key={j.id}>
              <TableCell className="font-mono text-xs">{j.id}</TableCell>
              <TableCell className="text-sm">{j.instanceName}</TableCell>
              <TableCell className="capitalize text-xs">{j.jobType.replace('_', ' ')}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Progress value={pct} className="h-1.5 w-16" />
                  <span className="text-xs">{j.recordsSuccess}/{j.recordsProcessed}</span>
                </div>
              </TableCell>
              <TableCell className="text-center font-medium">{j.recordsFailed}</TableCell>
              <TableCell className="text-center">{j.retryCount}/{3}</TableCell>
              <TableCell><Badge variant={statusVariant[j.status]}>{j.status}</Badge></TableCell>
              <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">{j.errorMessage || '—'}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  </div>
);
