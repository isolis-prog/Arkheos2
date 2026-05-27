import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap, AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import type { AutoTestResult } from '@/hooks/useHedgeAutoDesignation';

interface Props {
  autoTests: AutoTestResult[];
}

const statusIcon = (status: string, pass: boolean | null) => {
  if (status === 'PENDING') return <Clock className="h-4 w-4 text-muted-foreground" />;
  if (status === 'FAILED') return <AlertTriangle className="h-4 w-4 text-destructive" />;
  if (pass === false) return <AlertTriangle className="h-4 w-4 text-warning" />;
  return <CheckCircle className="h-4 w-4 text-success" />;
};

export const EffectivenessAutoTrigger = ({ autoTests }: Props) => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Zap className="h-5 w-5" />
          Auto-Triggered Effectiveness Tests
          <Badge variant="secondary" className="ml-auto text-xs">
            {autoTests.filter(t => t.status === 'PENDING').length} pending
          </Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Month-end auto-trigger runs effectiveness tests for all active hedge relationships
        </p>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Designation</TableHead>
                <TableHead>Trigger</TableHead>
                <TableHead>Scheduled Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Effectiveness</TableHead>
                <TableHead>Result</TableHead>
                <TableHead>Close Task</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {autoTests.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-mono font-medium text-sm">{t.designationRef}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {t.triggerType === 'MONTH_END_AUTO' ? 'Month-End Auto' : 'Manual'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{t.scheduledDate}</TableCell>
                  <TableCell>
                    <Badge className={`text-xs ${
                      t.status === 'PENDING' ? 'bg-muted text-muted-foreground' :
                      t.status === 'COMPLETED' ? 'bg-success/10 text-success' :
                      'bg-destructive/10 text-destructive'
                    }`}>
                      {t.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {t.effectivenessRatio !== null
                      ? `${(t.effectivenessRatio * 100).toFixed(0)}%`
                      : <span className="text-muted-foreground">—</span>
                    }
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      {statusIcon(t.status, t.passFlag)}
                      <span className="text-sm">
                        {t.status === 'PENDING' ? 'Scheduled' :
                         t.passFlag ? 'Effective' : 'Ineffective'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {t.closeTaskCreated ? (
                      <Badge className="text-xs bg-warning/10 text-warning">Task Created</Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
