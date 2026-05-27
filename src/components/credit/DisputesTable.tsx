import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { CreditDispute } from '@/hooks/useCreditExposure';

interface Props {
  disputes: CreditDispute[];
}

const fmt = (n: number) => {
  if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (Math.abs(n) >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
};

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  open: 'destructive',
  under_review: 'default',
  escalated: 'destructive',
  resolved: 'secondary',
};

export const DisputesTable = ({ disputes }: Props) => (
  <div className="rounded-lg border bg-card">
    <Table>
      <TableHeader>
        <TableRow className="bg-muted/50">
          <TableHead>Counterparty</TableHead>
          <TableHead>Invoice</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Assigned</TableHead>
          <TableHead>Raised</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {disputes.map((d) => (
          <TableRow key={d.id}>
            <TableCell className="font-medium">{d.counterparty}</TableCell>
            <TableCell className="font-mono text-sm">{d.invoiceRef}</TableCell>
            <TableCell className="text-right font-mono">{fmt(d.amount)}</TableCell>
            <TableCell><Badge variant="outline" className="text-[10px]">{d.disputeType}</Badge></TableCell>
            <TableCell><Badge variant={statusVariant[d.status] || 'secondary'}>{d.status.replace('_', ' ')}</Badge></TableCell>
            <TableCell className="text-sm">{d.assignedTo || '—'}</TableCell>
            <TableCell className="text-sm text-muted-foreground">{d.raisedAt}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);
