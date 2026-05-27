import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import type { HedgeTestResult } from '@/hooks/useHedgeAccounting';

interface Props {
  tests: HedgeTestResult[];
}

export const TestResultsTable = ({ tests }: Props) => (
  <div className="rounded-md border overflow-auto">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Designation</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Period</TableHead>
          <TableHead>Method</TableHead>
          <TableHead className="text-right">Effectiveness</TableHead>
          <TableHead className="text-center">Pass</TableHead>
          <TableHead>Tested By</TableHead>
          <TableHead>Notes</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tests.map((t) => (
          <TableRow key={t.id} className={!t.passFlag ? 'bg-destructive/5' : ''}>
            <TableCell className="font-mono text-sm">{t.designationRef}</TableCell>
            <TableCell><Badge variant="outline" className="text-xs">{t.testType}</Badge></TableCell>
            <TableCell className="text-sm">{format(new Date(t.periodStart), 'dd MMM')} – {format(new Date(t.periodEnd), 'dd MMM yy')}</TableCell>
            <TableCell className="text-sm text-muted-foreground">{t.methodDetail}</TableCell>
            <TableCell className={`text-right font-mono text-sm ${t.passFlag ? 'text-success' : 'text-destructive font-bold'}`}>{(t.effectivenessRatio * 100).toFixed(1)}%</TableCell>
            <TableCell className="text-center">{t.passFlag ? <CheckCircle className="h-4 w-4 text-success mx-auto" /> : <XCircle className="h-4 w-4 text-destructive mx-auto" />}</TableCell>
            <TableCell className="text-sm">{t.testedBy}</TableCell>
            <TableCell className="text-sm text-muted-foreground max-w-[180px] truncate">{t.notes ?? '—'}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);
