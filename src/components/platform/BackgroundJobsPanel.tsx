import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { MetricCard } from '@/components/ui/metric-card';
import { Cog, PlayCircle, CheckCircle2, XCircle, Clock } from 'lucide-react';
import type { BackgroundJob } from '@/hooks/usePlatformInfra';

const statusConfig: Record<string, { class: string; icon: React.ReactNode }> = {
  queued: { class: 'bg-muted text-muted-foreground', icon: <Clock className="h-3 w-3" /> },
  running: { class: 'bg-blue-500/10 text-blue-600 dark:text-blue-400', icon: <PlayCircle className="h-3 w-3" /> },
  completed: { class: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400', icon: <CheckCircle2 className="h-3 w-3" /> },
  failed: { class: 'bg-destructive/10 text-destructive', icon: <XCircle className="h-3 w-3" /> },
  cancelled: { class: 'bg-muted text-muted-foreground', icon: <XCircle className="h-3 w-3" /> },
  stale: { class: 'bg-amber-500/10 text-amber-600', icon: <Clock className="h-3 w-3" /> },
};

interface Props {
  jobs: BackgroundJob[];
  stats: { total: number; running: number; queued: number; completed: number; failed: number; avgDuration: number };
  filter: string;
  setFilter: (v: string) => void;
}

export const BackgroundJobsPanel = ({ jobs, stats, filter, setFilter }: Props) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      <MetricCard title="Total Jobs" value={stats.total} icon={Cog} />
      <MetricCard title="Running" value={stats.running} icon={PlayCircle} variant="info" />
      <MetricCard title="Queued" value={stats.queued} icon={Clock} />
      <MetricCard title="Failed" value={stats.failed} icon={XCircle} variant="error" />
      <MetricCard title="Avg Duration" value={`${stats.avgDuration}s`} icon={Clock} />
    </div>

    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg">Job Queue</CardTitle>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="queued">Queued</SelectItem>
            <SelectItem value="running">Running</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="font-semibold">Job Type</TableHead>
              <TableHead className="font-semibold">Domain</TableHead>
              <TableHead className="font-semibold">Priority</TableHead>
              <TableHead className="font-semibold">Progress</TableHead>
              <TableHead className="font-semibold">Correlation</TableHead>
              <TableHead className="font-semibold">Summary</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.map(job => {
              const cfg = statusConfig[job.status];
              return (
                <TableRow key={job.id} className="data-table-row">
                  <TableCell className="font-mono text-sm">{job.job_type}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">{job.domain}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={job.priority === 'critical' ? 'destructive' : job.priority === 'high' ? 'default' : 'secondary'} className="text-xs">
                      {job.priority}
                    </Badge>
                  </TableCell>
                  <TableCell className="w-32">
                    <div className="flex items-center gap-2">
                      <Progress value={job.progress} className="h-2 flex-1" />
                      <span className="text-xs text-muted-foreground">{job.progress}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{job.correlation_id.slice(0, 8)}</TableCell>
                  <TableCell className="text-sm max-w-[200px] truncate">{job.payload_summary}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`${cfg.class} flex items-center gap-1 w-fit`}>
                      {cfg.icon}
                      {job.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  </div>
);
