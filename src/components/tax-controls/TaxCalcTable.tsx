import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { TaxCalcResult } from '@/hooks/useTaxControls';

interface Props {
  calcs: TaxCalcResult[];
}

const fmt = (n: number) => {
  if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (Math.abs(n) >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
};

const statusBadge = (s: string) => {
  const map: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string; className?: string }> = {
    matched: { variant: 'secondary', label: 'Matched', className: 'bg-green-500/15 text-green-700 border-green-300' },
    delta: { variant: 'outline', label: 'Delta', className: 'bg-yellow-500/15 text-yellow-700 border-yellow-300' },
    missing: { variant: 'destructive', label: 'Missing' },
    exception: { variant: 'destructive', label: 'Exception' },
    pending: { variant: 'outline', label: 'Pending' },
  };
  const cfg = map[s] || map.pending;
  return <Badge variant={cfg.variant} className={cfg.className}>{cfg.label}</Badge>;
};

export const TaxCalcTable = ({ calcs }: Props) => {
  const limited = calcs.slice(0, 80);
  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead>Deal</TableHead>
            <TableHead>Invoice</TableHead>
            <TableHead>Entity</TableHead>
            <TableHead>Jurisdiction</TableHead>
            <TableHead>Tax Type</TableHead>
            <TableHead>Incoterm</TableHead>
            <TableHead className="text-right">Base Amt</TableHead>
            <TableHead className="text-right">Expected</TableHead>
            <TableHead className="text-right">Actual</TableHead>
            <TableHead className="text-right">Δ</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {limited.map(c => (
            <TableRow key={c.id}>
              <TableCell className="font-mono text-sm">{c.dealId}</TableCell>
              <TableCell className="font-mono text-sm">{c.invoiceRef || '—'}</TableCell>
              <TableCell>{c.legalEntity}</TableCell>
              <TableCell><Badge variant="outline" className="text-xs">{c.jurisdiction}</Badge></TableCell>
              <TableCell className="text-sm">{c.taxType.replace('_', ' ').toUpperCase()}</TableCell>
              <TableCell className="text-sm">{c.incoterm || '—'}</TableCell>
              <TableCell className="text-right font-mono">{fmt(c.baseAmount)}</TableCell>
              <TableCell className="text-right font-mono">{fmt(c.expectedTax)}</TableCell>
              <TableCell className="text-right font-mono">{c.actualTax != null ? fmt(c.actualTax) : '—'}</TableCell>
              <TableCell className={`text-right font-mono ${c.delta && Math.abs(c.delta) > 0 ? 'text-destructive font-semibold' : ''}`}>
                {c.delta != null ? fmt(c.delta) : '—'}
              </TableCell>
              <TableCell>{statusBadge(c.status)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {calcs.length > 80 && <div className="p-3 text-center text-sm text-muted-foreground border-t">Showing 80 of {calcs.length}. Use filters.</div>}
    </div>
  );
};
