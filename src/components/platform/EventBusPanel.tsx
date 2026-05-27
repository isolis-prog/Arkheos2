import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MetricCard } from '@/components/ui/metric-card';
import { Radio, CheckCircle2, Clock, XCircle } from 'lucide-react';
import type { DomainEventSummary } from '@/hooks/usePlatformInfra';

const statusConfig: Record<string, string> = {
  pending: 'bg-muted text-muted-foreground',
  processing: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  completed: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  failed: 'bg-destructive/10 text-destructive',
  dead_letter: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
};

interface Props {
  events: DomainEventSummary[];
  stats: { total: number; completed: number; pending: number; failed: number };
  filter: string;
  setFilter: (v: string) => void;
}

export const EventBusPanel = ({ events, stats, filter, setFilter }: Props) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <MetricCard title="Total Events" value={stats.total} icon={Radio} />
      <MetricCard title="Completed" value={stats.completed} icon={CheckCircle2} variant="success" />
      <MetricCard title="Pending" value={stats.pending} icon={Clock} />
      <MetricCard title="Failed" value={stats.failed} icon={XCircle} variant="error" />
    </div>

    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg">Domain Events</CardTitle>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="font-semibold">Event Type</TableHead>
              <TableHead className="font-semibold">Domain</TableHead>
              <TableHead className="font-semibold">Correlation ID</TableHead>
              <TableHead className="font-semibold">Created</TableHead>
              <TableHead className="font-semibold">Processed</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map(ev => (
              <TableRow key={ev.id} className="data-table-row">
                <TableCell className="font-mono text-sm">{ev.event_type}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">{ev.domain}</Badge>
                </TableCell>
                <TableCell className="font-mono text-xs">{ev.correlation_id.slice(0, 8)}</TableCell>
                <TableCell className="text-sm">{new Date(ev.created_at).toLocaleTimeString()}</TableCell>
                <TableCell className="text-sm">{ev.processed_at ? new Date(ev.processed_at).toLocaleTimeString() : '—'}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={statusConfig[ev.status]}>
                    {ev.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  </div>
);
