import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { X, UserPlus } from 'lucide-react';
import type { TradeQAResult } from '@/hooks/useTradeQA';

const sevVariant = (s: string) => s === 'critical' ? 'error' as const : s === 'high' ? 'warning' as const : s === 'medium' ? 'info' as const : 'muted' as const;

interface Props {
  result: TradeQAResult;
  onClose: () => void;
}

export const ViolationDetailPanel = ({ result, onClose }: Props) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between pb-3">
      <div>
        <CardTitle className="text-lg">{result.tradeRef} — Violation Details</CardTitle>
        <p className="text-sm text-muted-foreground">{result.counterparty} · {result.product} · {result.book}</p>
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant="outline"><UserPlus className="h-4 w-4 mr-1" /> Assign</Button>
        <Button size="icon" variant="ghost" onClick={onClose}><X className="h-4 w-4" /></Button>
      </div>
    </CardHeader>
    <CardContent>
      {result.violations.length === 0 ? (
        <p className="text-muted-foreground text-sm">No violations — all rules passed.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rule</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Field</TableHead>
              <TableHead>Expected</TableHead>
              <TableHead>Actual</TableHead>
              <TableHead>Message</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.violations.map((v, i) => (
              <TableRow key={i}>
                <TableCell className="font-mono text-xs">{v.rule_id}</TableCell>
                <TableCell><StatusBadge variant={sevVariant(v.severity)}>{v.severity}</StatusBadge></TableCell>
                <TableCell>{v.field}</TableCell>
                <TableCell className="text-sm">{v.expected}</TableCell>
                <TableCell className="text-sm font-medium text-destructive">{v.actual || '(empty)'}</TableCell>
                <TableCell className="text-sm">{v.message}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </CardContent>
  </Card>
);
