import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { MarketDataException } from '@/hooks/useMarketData';

interface Props {
  exceptions: MarketDataException[];
}

const typeLabels: Record<string, string> = {
  gap: 'Gap',
  outlier: 'Outlier',
  stale: 'Stale',
  monotonicity: 'Monotonicity',
  cross_check_fail: 'Cross-Check',
  missing_tenor: 'Missing Tenor',
};

const severityStyles: Record<string, string> = {
  high: 'border-destructive text-destructive',
  medium: 'border-warning text-warning',
  low: 'border-info text-info',
};

const statusStyles: Record<string, string> = {
  open: 'bg-destructive/10 text-destructive',
  acknowledged: 'bg-warning/10 text-warning',
  resolved: 'bg-success/10 text-success',
  suppressed: 'bg-muted text-muted-foreground',
};

const fmt = (v: number | null) => {
  if (v === null) return '—';
  if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
};

export const MarketExceptionsTable = ({ exceptions }: Props) => (
  <div className="rounded-md border overflow-auto">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Type</TableHead>
          <TableHead>Severity</TableHead>
          <TableHead>Curve</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Impacted Books</TableHead>
          <TableHead className="text-right">MTM Impact</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Detected</TableHead>
          <TableHead className="w-10" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {exceptions.map((e) => (
          <TableRow key={e.id}>
            <TableCell><Badge variant="outline" className="text-xs">{typeLabels[e.exceptionType]}</Badge></TableCell>
            <TableCell><Badge variant="outline" className={`text-xs ${severityStyles[e.severity]}`}>{e.severity.toUpperCase()}</Badge></TableCell>
            <TableCell className="font-medium">{e.curveName}</TableCell>
            <TableCell className="max-w-[250px] truncate text-sm">{e.description}</TableCell>
            <TableCell>
              <div className="flex flex-wrap gap-1">
                {e.impactedBooks.slice(0, 2).map(b => <Badge key={b} variant="secondary" className="text-xs">{b}</Badge>)}
                {e.impactedBooks.length > 2 && <Badge variant="secondary" className="text-xs">+{e.impactedBooks.length - 2}</Badge>}
              </div>
            </TableCell>
            <TableCell className="text-right font-mono text-sm">{fmt(e.estimatedMtmImpact)}</TableCell>
            <TableCell><Badge className={`text-xs ${statusStyles[e.status]}`}>{e.status}</Badge></TableCell>
            <TableCell className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(e.createdAt), { addSuffix: true })}</TableCell>
            <TableCell>
              {e.status === 'open' && (
                <Button variant="ghost" size="icon" title="Acknowledge"><CheckCircle className="h-4 w-4" /></Button>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);
