import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { PostingExpectation } from '@/hooks/useDealToGL';

interface Props {
  expectations: PostingExpectation[];
}

const fmt = (n: number) => {
  if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (Math.abs(n) >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
};

const statusBadge = (s: PostingExpectation['status']) => {
  const map: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string; className?: string }> = {
    matched: { variant: 'secondary', label: 'Matched', className: 'bg-green-500/15 text-green-700 border-green-300' },
    partial: { variant: 'outline', label: 'Partial', className: 'bg-yellow-500/15 text-yellow-700 border-yellow-300' },
    missing: { variant: 'destructive', label: 'Missing' },
    exception: { variant: 'destructive', label: 'Exception' },
    pending: { variant: 'outline', label: 'Pending' },
  };
  const cfg = map[s] || map.pending;
  return <Badge variant={cfg.variant} className={cfg.className}>{cfg.label}</Badge>;
};

export const ExpectationsTable = ({ expectations }: Props) => {
  const limited = expectations.slice(0, 100);

  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead>Deal ID</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Event</TableHead>
            <TableHead>Entity</TableHead>
            <TableHead>Account</TableHead>
            <TableHead className="text-right">Expected</TableHead>
            <TableHead className="text-right">Actual</TableHead>
            <TableHead className="text-right">Δ</TableHead>
            <TableHead>GL Ref</TableHead>
            <TableHead>Cut-off</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {limited.map(e => (
            <TableRow key={e.id}>
              <TableCell className="font-mono text-sm font-medium">{e.dealId}</TableCell>
              <TableCell>{e.dealType}</TableCell>
              <TableCell className="text-sm">{e.eventType}</TableCell>
              <TableCell>{e.legalEntity}</TableCell>
              <TableCell className="font-mono text-sm">{e.accountCode}</TableCell>
              <TableCell className="text-right font-mono">{fmt(e.expectedAmount)}</TableCell>
              <TableCell className="text-right font-mono">{e.actualAmount != null ? fmt(e.actualAmount) : '—'}</TableCell>
              <TableCell className={`text-right font-mono ${e.delta && Math.abs(e.delta) > 0 ? 'text-destructive' : ''}`}>
                {e.delta != null ? fmt(e.delta) : '—'}
              </TableCell>
              <TableCell className="font-mono text-xs">{e.glReference || '—'}</TableCell>
              <TableCell className="text-sm">{e.cutoffDate || '—'}</TableCell>
              <TableCell>{statusBadge(e.status)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {expectations.length > 100 && (
        <div className="p-3 text-center text-sm text-muted-foreground border-t">
          Showing 100 of {expectations.length} records. Apply filters to narrow down.
        </div>
      )}
    </div>
  );
};
