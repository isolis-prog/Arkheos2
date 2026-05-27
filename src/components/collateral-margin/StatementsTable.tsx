import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import type { MarginStatement } from '@/hooks/useCollateralMargin';

interface Props {
  data: MarginStatement[];
}

const fmt = (n: number) => {
  if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (Math.abs(n) >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
};

const statusColor: Record<string, string> = {
  received: 'bg-muted text-muted-foreground',
  validated: 'bg-info/10 text-info',
  reconciled: 'bg-success/10 text-success',
  disputed: 'bg-destructive/10 text-destructive',
  settled: 'bg-primary/10 text-primary',
};

const columns = [
  { key: 'counterparty', header: 'Counterparty', cell: (r: MarginStatement) => <span className="font-medium">{r.counterparty}</span> },
  { key: 'nettingSet', header: 'Netting Set', cell: (r: MarginStatement) => <span className="text-xs text-muted-foreground font-mono">{r.nettingSet || '—'}</span> },
  { key: 'type', header: 'Type', cell: (r: MarginStatement) => <Badge variant="outline" className="text-xs">{r.agreementType}</Badge> },
  { key: 'im', header: 'IM', cell: (r: MarginStatement) => fmt(r.totalIm), className: 'text-right' },
  { key: 'vm', header: 'VM', cell: (r: MarginStatement) => <span className={r.totalVm < 0 ? 'text-destructive' : ''}>{fmt(r.totalVm)}</span>, className: 'text-right' },
  { key: 'call', header: 'Margin Call', cell: (r: MarginStatement) => r.marginCallAmount > 0 ? <span className="font-semibold text-warning">{fmt(r.marginCallAmount)}</span> : <span className="text-muted-foreground">—</span>, className: 'text-right' },
  { key: 'posted', header: 'Posted', cell: (r: MarginStatement) => fmt(r.collateralPosted), className: 'text-right' },
  { key: 'status', header: 'Status', cell: (r: MarginStatement) => <Badge className={statusColor[r.status]}>{r.status}</Badge> },
];

export const StatementsTable = ({ data }: Props) => (
  <DataTable columns={columns} data={data} emptyMessage="No margin statements found" />
);
