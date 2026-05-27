import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Clock, Calendar, Zap, Link2, CheckCircle2, PauseCircle } from 'lucide-react';
import { StudioWorkflow } from '@/hooks/useStudio';
import { cn } from '@/lib/utils';

const cronToHuman = (cron?: string): string => {
  if (!cron) return '—';
  const map: Record<string, string> = {
    '0 6 * * 1-5': 'Weekdays at 06:00',
    '0 18 * * 5': 'Fridays at 18:00',
    '0 0 1 * *': '1st of month at midnight',
  };
  return map[cron] || cron;
};

const triggerIcons: Record<string, React.ReactNode> = {
  manual: <Zap className="h-4 w-4" />,
  scheduled: <Clock className="h-4 w-4" />,
  event: <Zap className="h-4 w-4" />,
  webhook: <Link2 className="h-4 w-4" />,
};

interface Props {
  workflows: StudioWorkflow[];
}

export const SchedulerUI = ({ workflows }: Props) => {
  const scheduled = workflows.filter(w => w.scheduleCron);
  const nextRuns = scheduled.map(w => ({
    ...w,
    nextRun: w.status === 'active' ? 'Tomorrow 06:00 EST' : '—',
  }));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Schedule & Triggers</h3>
        <p className="text-sm text-muted-foreground">Manage execution schedules, triggers, and execution windows</p>
      </div>

      {/* Schedule calendar view */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <CardTitle className="text-sm">Active Schedules</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{scheduled.filter(w => w.status === 'active').length}</div>
            <p className="text-xs text-muted-foreground mt-1">Running on schedule</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-500" />
              <CardTitle className="text-sm">Event Triggers</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{workflows.filter(w => w.triggerType === 'event').length}</div>
            <p className="text-xs text-muted-foreground mt-1">Reactive workflows</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-sm">Next Execution</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">Tomorrow 06:00</div>
            <p className="text-xs text-muted-foreground mt-1">Daily Trade-to-Cash (EST)</p>
          </CardContent>
        </Card>
      </div>

      {/* Schedule table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Workflows</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Workflow</TableHead>
                <TableHead>Trigger</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Timezone</TableHead>
                <TableHead>Window</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Next Run</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workflows.map(wf => (
                <TableRow key={wf.id}>
                  <TableCell className="font-medium">{wf.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      {triggerIcons[wf.triggerType]}
                      <span className="text-sm capitalize">{wf.triggerType}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {wf.scheduleCron ? (
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{cronToHuman(wf.scheduleCron)}</code>
                    ) : '—'}
                  </TableCell>
                  <TableCell className="text-sm">{wf.scheduleTimezone}</TableCell>
                  <TableCell className="text-sm">
                    {wf.executionWindowStart ? `${wf.executionWindowStart}–${wf.executionWindowEnd}` : '—'}
                  </TableCell>
                  <TableCell>
                    {wf.status === 'active' ? (
                      <div className="flex items-center gap-1 text-emerald-600"><CheckCircle2 className="h-4 w-4" /> Active</div>
                    ) : wf.status === 'paused' ? (
                      <div className="flex items-center gap-1 text-amber-600"><PauseCircle className="h-4 w-4" /> Paused</div>
                    ) : (
                      <Badge variant="secondary" className="text-xs">{wf.status}</Badge>
                    )}
                  </TableCell>
                  <TableCell className={cn('text-sm', wf.status !== 'active' && 'text-muted-foreground')}>
                    {wf.status === 'active' && wf.scheduleCron ? 'Tomorrow 06:00' : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </motion.div>
  );
};
