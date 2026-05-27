import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatusBadge, getStatusVariant } from '@/components/ui/status-badge';
import { CloseTask } from '@/hooks/useCloseCockpit';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle2, Clock, AlertTriangle, XCircle, CircleDot, Paperclip } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Props {
  tasks: CloseTask[];
}

const statusIcon: Record<CloseTask['status'], typeof CheckCircle2> = {
  completed: CheckCircle2,
  in_progress: Clock,
  pending: CircleDot,
  blocked: XCircle,
  overdue: AlertTriangle,
};

const statusVariant: Record<CloseTask['status'], 'success' | 'info' | 'default' | 'destructive' | 'warning'> = {
  completed: 'success',
  in_progress: 'info',
  pending: 'default',
  blocked: 'destructive',
  overdue: 'warning',
};

const priorityColor: Record<CloseTask['priority'], string> = {
  critical: 'text-destructive',
  high: 'text-warning',
  medium: 'text-muted-foreground',
  low: 'text-muted-foreground/60',
};

const categoryColors: Record<string, string> = {
  risk: 'bg-destructive/10 text-destructive',
  accounting: 'bg-primary/10 text-primary',
  treasury: 'bg-info/10 text-info',
  ops: 'bg-success/10 text-success',
  tax: 'bg-warning/10 text-warning',
  compliance: 'bg-muted text-muted-foreground',
};

export const CloseTaskBoard = ({ tasks }: Props) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Close Tasks</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8"></TableHead>
                <TableHead>Task</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>SLA</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due / Completed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((task) => {
                const Icon = statusIcon[task.status];
                return (
                  <TableRow key={task.id}>
                    <TableCell>
                      <Icon className={`h-4 w-4 ${statusVariant[task.status] === 'success' ? 'text-success' : statusVariant[task.status] === 'destructive' ? 'text-destructive' : statusVariant[task.status] === 'warning' ? 'text-warning' : statusVariant[task.status] === 'info' ? 'text-info' : 'text-muted-foreground'}`} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{task.taskName}</span>
                        {task.evidenceRefs.length > 0 && (
                          <Paperclip className="h-3 w-3 text-muted-foreground" />
                        )}
                      </div>
                      {task.blockerReason && (
                        <p className="text-xs text-destructive mt-0.5">{task.blockerReason}</p>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">{task.legalEntity}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={categoryColors[task.category]}>
                        {task.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className={`text-sm font-medium capitalize ${priorityColor[task.priority]}`}>
                        {task.priority}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">{task.ownerName || '—'}</TableCell>
                    <TableCell className="text-sm">{task.slaHours ? `${task.slaHours}h` : '—'}</TableCell>
                    <TableCell>
                      <StatusBadge variant={getStatusVariant(task.status)}>{task.status.replace('_', ' ')}</StatusBadge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {task.completedAt
                        ? `Done ${formatDistanceToNow(new Date(task.completedAt), { addSuffix: true })}`
                        : task.dueDate
                          ? `Due ${formatDistanceToNow(new Date(task.dueDate), { addSuffix: true })}`
                          : '—'}
                    </TableCell>
                  </TableRow>
                );
              })}
              {tasks.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    No tasks match current filters
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
