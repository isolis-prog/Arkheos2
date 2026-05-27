import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { CreditMemo } from '@/hooks/useCreditExposure';

interface Props {
  memos: CreditMemo[];
}

const fmt = (n: number) => {
  if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (Math.abs(n) >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
};

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  draft: 'outline',
  approved: 'default',
  applied: 'secondary',
};

export const CreditMemosTable = ({ memos }: Props) => (
  <div className="rounded-lg border bg-card">
    <Table>
      <TableHeader>
        <TableRow className="bg-muted/50">
          <TableHead>Counterparty</TableHead>
          <TableHead>Memo Ref</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          <TableHead>Reason</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Created</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {memos.map((m) => (
          <TableRow key={m.id}>
            <TableCell className="font-medium">{m.counterparty}</TableCell>
            <TableCell className="font-mono text-sm">{m.memoRef}</TableCell>
            <TableCell className="text-right font-mono">{fmt(m.amount)}</TableCell>
            <TableCell className="text-sm">{m.reason}</TableCell>
            <TableCell><Badge variant={statusVariant[m.status] || 'secondary'}>{m.status}</Badge></TableCell>
            <TableCell className="text-sm text-muted-foreground">{m.createdAt}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);
