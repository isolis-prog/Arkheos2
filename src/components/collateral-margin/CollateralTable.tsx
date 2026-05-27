import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import type { CollateralBalance } from '@/hooks/useCollateralMargin';

interface Props {
  data: CollateralBalance[];
}

const fmt = (n: number) => {
  const abs = Math.abs(n);
  if (abs >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
};

const columns = [
  { key: 'counterparty', header: 'Counterparty', cell: (r: CollateralBalance) => <span className="font-medium">{r.counterparty}</span> },
  { key: 'currency', header: 'CCY', cell: (r: CollateralBalance) => <Badge variant="outline">{r.currency}</Badge> },
  { key: 'type', header: 'Type', cell: (r: CollateralBalance) => <span className="capitalize text-xs">{r.collateralType}</span> },
  { key: 'direction', header: 'Direction', cell: (r: CollateralBalance) => <Badge className={r.direction === 'posted' ? 'bg-info/10 text-info' : 'bg-success/10 text-success'}>{r.direction}</Badge> },
  { key: 'amount', header: 'Amount', cell: (r: CollateralBalance) => fmt(r.amount), className: 'text-right' },
  { key: 'glBalance', header: 'GL Balance', cell: (r: CollateralBalance) => r.glBalance !== null ? fmt(r.glBalance) : '—', className: 'text-right' },
  { key: 'glDelta', header: 'GL Δ', cell: (r: CollateralBalance) => r.glDelta !== 0 ? <span className="font-semibold text-destructive">{fmt(r.glDelta)}</span> : <span className="text-success">✓</span>, className: 'text-right' },
  { key: 'custodian', header: 'Custodian', cell: (r: CollateralBalance) => <span className="text-xs text-muted-foreground">{r.custodian || '—'}</span> },
];

export const CollateralTable = ({ data }: Props) => (
  <DataTable columns={columns} data={data} emptyMessage="No collateral balances found" />
);
