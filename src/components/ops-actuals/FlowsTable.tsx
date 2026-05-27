import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/ui/status-badge';
import type { OpsFlow } from '@/hooks/useOpsActuals';

const statusVariant = (s: string) => s === 'ok' ? 'success' as const : s === 'warning' ? 'warning' as const : 'error' as const;
const excLabel: Record<string, string> = { under_delivery: 'Under Delivery', over_delivery: 'Over Delivery', wrong_location: 'Wrong Location', missing_actuals: 'Missing Actuals', missing_nomination: 'Missing Nomination' };

const fmtQty = (q: number | null) => q !== null ? q.toLocaleString() : <span className="text-muted-foreground">—</span>;

const variancePct = (planned: number | null, actual: number | null) => {
  if (!planned || !actual) return null;
  const pct = ((actual - planned) / planned * 100);
  return pct;
};

interface Props { flows: OpsFlow[]; }

export const FlowsTable = ({ flows }: Props) => (
  <div className="rounded-lg border border-border overflow-auto">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Trade Ref</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Location</TableHead>
          <TableHead>Counterparty</TableHead>
          <TableHead>Product</TableHead>
          <TableHead className="text-right">Planned</TableHead>
          <TableHead className="text-right">Nominated</TableHead>
          <TableHead className="text-right">Scheduled</TableHead>
          <TableHead className="text-right">Actual</TableHead>
          <TableHead className="text-right">Variance</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Exception</TableHead>
          <TableHead>Doc Ref</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {flows.map(f => {
          const vPct = variancePct(f.plannedQty, f.actualQty);
          return (
            <TableRow key={f.id}>
              <TableCell className="font-mono text-sm">{f.tradeRef}</TableCell>
              <TableCell>{f.flowDate}</TableCell>
              <TableCell>{f.location}</TableCell>
              <TableCell>{f.counterparty}</TableCell>
              <TableCell>{f.product}</TableCell>
              <TableCell className="text-right">{fmtQty(f.plannedQty)}</TableCell>
              <TableCell className="text-right">{fmtQty(f.nominatedQty)}</TableCell>
              <TableCell className="text-right">{fmtQty(f.scheduledQty)}</TableCell>
              <TableCell className="text-right">{fmtQty(f.actualQty)}</TableCell>
              <TableCell className="text-right">
                {vPct !== null ? (
                  <span className={vPct > 0 ? 'text-emerald-600' : 'text-destructive'}>{vPct > 0 ? '+' : ''}{vPct.toFixed(1)}%</span>
                ) : <span className="text-muted-foreground">—</span>}
              </TableCell>
              <TableCell><StatusBadge variant={statusVariant(f.varianceStatus)}>{f.varianceStatus}</StatusBadge></TableCell>
              <TableCell>{f.exceptionType ? <StatusBadge variant="error">{excLabel[f.exceptionType] || f.exceptionType}</StatusBadge> : '—'}</TableCell>
              <TableCell className="font-mono text-xs">{f.sourceDocRef}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  </div>
);
