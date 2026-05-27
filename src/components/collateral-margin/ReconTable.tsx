import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import type { MarginRecon } from '@/hooks/useCollateralMargin';

interface Props {
  data: MarginRecon[];
}

const fmt = (n: number) => {
  const abs = Math.abs(n);
  if (abs >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
};

const deltaCell = (v: number) => {
  if (v === 0) return <span className="text-success">✓ Match</span>;
  return <span className="font-semibold text-destructive">{fmt(v)}</span>;
};

const disputeStatusColor: Record<string, string> = {
  open: 'bg-destructive/10 text-destructive',
  submitted: 'bg-warning/10 text-warning',
  acknowledged: 'bg-info/10 text-info',
  resolved: 'bg-success/10 text-success',
  escalated: 'bg-destructive text-destructive-foreground',
};

const columns = [
  { key: 'counterparty', header: 'Counterparty', cell: (r: MarginRecon) => <span className="font-medium">{r.counterparty}</span> },
  { key: 'nettingSet', header: 'Netting Set', cell: (r: MarginRecon) => <span className="text-xs font-mono text-muted-foreground">{r.nettingSet || '—'}</span> },
  { key: 'deltaIm', header: 'Δ IM', cell: (r: MarginRecon) => deltaCell(r.deltaIm), className: 'text-right' },
  { key: 'deltaVm', header: 'Δ VM', cell: (r: MarginRecon) => deltaCell(r.deltaVm), className: 'text-right' },
  { key: 'deltaCol', header: 'Δ Collateral', cell: (r: MarginRecon) => deltaCell(r.deltaCollateral), className: 'text-right' },
  { key: 'glDelta', header: 'GL Δ', cell: (r: MarginRecon) => deltaCell(r.glDelta), className: 'text-right' },
  { key: 'dispute', header: 'Dispute', cell: (r: MarginRecon) => r.disputeFlag && r.disputeStatus ? <Badge className={disputeStatusColor[r.disputeStatus]}>{r.disputeStatus}</Badge> : <span className="text-muted-foreground text-xs">—</span> },
];

export const ReconTable = ({ data }: Props) => (
  <DataTable columns={columns} data={data} emptyMessage="No recon results found" />
);
