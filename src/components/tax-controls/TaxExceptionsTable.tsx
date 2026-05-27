import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { TaxException } from '@/hooks/useTaxControls';

interface Props {
  exceptions: TaxException[];
}

const fmt = (n: number) => {
  if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (Math.abs(n) >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
};

const severityBadge = (s: string) => {
  const map: Record<string, string> = { critical: 'bg-destructive/15 text-destructive', high: 'bg-orange-500/15 text-orange-700', medium: 'bg-yellow-500/15 text-yellow-700', low: '' };
  return <Badge variant="outline" className={map[s]}>{s}</Badge>;
};

const statusBadge = (s: string) => {
  if (s === 'resolved') return <Badge variant="secondary" className="bg-green-500/15 text-green-700 border-green-300">Resolved</Badge>;
  if (s === 'waived') return <Badge variant="outline">Waived</Badge>;
  if (s === 'investigating') return <Badge variant="outline" className="bg-blue-500/15 text-blue-700 border-blue-300">Investigating</Badge>;
  return <Badge variant="destructive">Open</Badge>;
};

export const TaxExceptionsTable = ({ exceptions }: Props) => (
  <div className="rounded-lg border bg-card">
    <Table>
      <TableHeader>
        <TableRow className="bg-muted/50">
          <TableHead>Type</TableHead>
          <TableHead>Severity</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Jurisdiction</TableHead>
          <TableHead className="text-right">Δ Amount</TableHead>
          <TableHead>Assigned</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {exceptions.map(e => (
          <TableRow key={e.id}>
            <TableCell><Badge variant="outline" className="text-xs">{e.exceptionType.replace('_', ' ')}</Badge></TableCell>
            <TableCell>{severityBadge(e.severity)}</TableCell>
            <TableCell className="text-sm max-w-[300px] truncate">{e.description}</TableCell>
            <TableCell>{e.jurisdiction || '—'}</TableCell>
            <TableCell className={`text-right font-mono ${e.deltaAmount && Math.abs(e.deltaAmount) > 0 ? 'text-destructive' : ''}`}>
              {e.deltaAmount != null ? fmt(e.deltaAmount) : '—'}
            </TableCell>
            <TableCell className="text-sm">{e.assignedTo || '—'}</TableCell>
            <TableCell>{statusBadge(e.status)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);
