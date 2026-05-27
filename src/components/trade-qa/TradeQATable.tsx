import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge, getStatusVariant } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import { format } from 'date-fns';
import type { TradeQAResult } from '@/hooks/useTradeQA';

const resultVariant = (r: string) => r === 'pass' ? 'success' : r === 'fail' ? 'error' : 'warning';
const sevVariant = (s: string) => s === 'critical' ? 'error' : s === 'high' ? 'warning' : s === 'medium' ? 'info' : 'muted';

interface Props {
  results: TradeQAResult[];
  onSelect: (id: string) => void;
}

export const TradeQATable = ({ results, onSelect }: Props) => (
  <div className="rounded-lg border border-border overflow-auto">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Trade Ref</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Counterparty</TableHead>
          <TableHead>Product</TableHead>
          <TableHead>Book</TableHead>
          <TableHead>Result</TableHead>
          <TableHead>Severity</TableHead>
          <TableHead>Violations</TableHead>
          <TableHead>Owner</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Run At</TableHead>
          <TableHead></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {results.map(r => (
          <TableRow key={r.id} className="cursor-pointer hover:bg-muted/50" onClick={() => onSelect(r.id)}>
            <TableCell className="font-mono text-sm">{r.tradeRef}</TableCell>
            <TableCell className="capitalize">{r.tradeType}</TableCell>
            <TableCell>{r.counterparty}</TableCell>
            <TableCell>{r.product}</TableCell>
            <TableCell>{r.book}</TableCell>
            <TableCell><StatusBadge variant={resultVariant(r.overallResult)}>{r.overallResult.toUpperCase()}</StatusBadge></TableCell>
            <TableCell><StatusBadge variant={sevVariant(r.severity)}>{r.severity}</StatusBadge></TableCell>
            <TableCell>{r.violations.length}</TableCell>
            <TableCell>{r.ownerRole}</TableCell>
            <TableCell><StatusBadge variant={getStatusVariant(r.status)}>{r.status.replace('_', ' ')}</StatusBadge></TableCell>
            <TableCell>{format(new Date(r.runAt), 'MMM dd HH:mm')}</TableCell>
            <TableCell><Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);
