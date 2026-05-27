import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MetricCard } from '@/components/ui/metric-card';
import { Search, Play, Eye, RotateCcw, Zap, CheckCircle2, XCircle, Clock, FileText } from 'lucide-react';
import { T2CRun } from '@/hooks/useTradeToCash';
import { format } from 'date-fns';

interface Props {
  runs: T2CRun[];
  stats: { totalRuns: number; activeWorkflows: number; completedRuns: number; failedRuns: number; totalPosted: number; totalAmount: number; pendingApproval: number };
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  onSelectRun: (id: string) => void;
}

const runStatusVariant: Record<string, 'success' | 'warning' | 'error' | 'info' | 'muted'> = {
  completed: 'success', completed_with_errors: 'warning', failed: 'error', running: 'info', pending: 'muted', cancelled: 'muted',
};

export const RunDashboard = ({ runs, stats, statusFilter, setStatusFilter, searchQuery, setSearchQuery, onSelectRun }: Props) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard title="Active Workflows" value={stats.activeWorkflows} icon={Zap} />
      <MetricCard title="Completed Runs" value={stats.completedRuns} icon={CheckCircle2} variant="success" />
      <MetricCard title="Failed Runs" value={stats.failedRuns} icon={XCircle} variant="error" />
      <MetricCard title="Pending Approval" value={stats.pendingApproval} icon={Clock} variant="warning" />
    </div>

    <div className="flex items-center gap-3">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search runs…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9" />
      </div>
      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="completed">Completed</SelectItem>
          <SelectItem value="completed_with_errors">With Errors</SelectItem>
          <SelectItem value="running">Running</SelectItem>
          <SelectItem value="failed">Failed</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
        </SelectContent>
      </Select>
      <Button><Play className="h-4 w-4 mr-2" />New Run</Button>
    </div>

    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Workflow</TableHead>
              <TableHead>Period</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Current Step</TableHead>
              <TableHead className="text-right">Documents</TableHead>
              <TableHead className="text-right">Posted</TableHead>
              <TableHead className="text-right">Failed</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Started</TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {runs.map(run => (
              <TableRow key={run.id} className="cursor-pointer hover:bg-muted/50" onClick={() => onSelectRun(run.id)}>
                <TableCell className="font-medium text-sm">{run.workflow_name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{format(new Date(run.period_start), 'MMM d')} – {format(new Date(run.period_end), 'MMM d')}</TableCell>
                <TableCell><StatusBadge variant={runStatusVariant[run.status] || 'muted'}>{run.status.replace(/_/g, ' ')}</StatusBadge></TableCell>
                <TableCell className="text-sm">{run.current_step || '—'}</TableCell>
                <TableCell className="text-right font-mono text-sm">{run.totals.documents}</TableCell>
                <TableCell className="text-right font-mono text-sm text-success">{run.totals.posted}</TableCell>
                <TableCell className="text-right font-mono text-sm text-destructive">{run.totals.failed}</TableCell>
                <TableCell className="text-right font-mono text-sm">${run.totals.amount.toLocaleString()}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{run.started_at ? format(new Date(run.started_at), 'MMM d HH:mm') : '—'}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={e => { e.stopPropagation(); onSelectRun(run.id); }}><Eye className="h-3.5 w-3.5" /></Button>
                    {run.status === 'failed' && <Button variant="ghost" size="icon" className="h-7 w-7"><RotateCcw className="h-3.5 w-3.5" /></Button>}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  </motion.div>
);
