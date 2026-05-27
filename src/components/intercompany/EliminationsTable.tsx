import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { EliminationJournal } from '@/hooks/useIntercompany';

interface Props {
  eliminations: EliminationJournal[];
}

const fmt = (n: number) => {
  if (n === 0) return '—';
  if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (Math.abs(n) >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
};

const statusBadge = (s: string) => {
  if (s === 'posted') return <Badge variant="secondary" className="bg-green-500/15 text-green-700 border-green-300">Posted</Badge>;
  if (s === 'reversed') return <Badge variant="destructive">Reversed</Badge>;
  return <Badge variant="outline">Draft</Badge>;
};

export const EliminationsTable = ({ eliminations }: Props) => (
  <div className="rounded-lg border bg-card">
    <Table>
      <TableHeader>
        <TableRow className="bg-muted/50">
          <TableHead>Journal Ref</TableHead>
          <TableHead>Period</TableHead>
          <TableHead>Entity A</TableHead>
          <TableHead>Entity B</TableHead>
          <TableHead>Account</TableHead>
          <TableHead className="text-right">Debit</TableHead>
          <TableHead className="text-right">Credit</TableHead>
          <TableHead>CCY</TableHead>
          <TableHead className="text-right">FX Rate</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {eliminations.map(e => (
          <TableRow key={e.id}>
            <TableCell className="font-mono text-sm font-medium">{e.journalRef}</TableCell>
            <TableCell>{e.periodName}</TableCell>
            <TableCell>{e.entityA}</TableCell>
            <TableCell>{e.entityB}</TableCell>
            <TableCell><span className="font-mono text-sm">{e.accountCode}</span> <span className="text-xs text-muted-foreground">{e.accountName}</span></TableCell>
            <TableCell className="text-right font-mono">{fmt(e.debitAmount)}</TableCell>
            <TableCell className="text-right font-mono">{fmt(e.creditAmount)}</TableCell>
            <TableCell>{e.currency}</TableCell>
            <TableCell className="text-right font-mono">{e.fxRate ?? '—'}</TableCell>
            <TableCell>{statusBadge(e.status)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);
