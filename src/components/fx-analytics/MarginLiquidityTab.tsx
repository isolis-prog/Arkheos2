import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, ShieldAlert } from 'lucide-react';
import { MetricCard } from '@/components/ui/metric-card';
import type { MarginPosition } from '@/hooks/useFXTreasury';

interface Props {
  positions: MarginPosition[];
  totalCurrent: number;
  totalUp5: number;
  totalDown5: number;
  worstCase: number;
  availableCash: number;
  coverageRatio: number;
}

const fmt = (v: number) => {
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return `$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${(abs / 1_000).toFixed(0)}K`;
  return `$${abs.toFixed(0)}`;
};

export function MarginLiquidityTab({ positions, totalCurrent, totalUp5, totalDown5, worstCase, availableCash, coverageRatio }: Props) {
  const shortfall = availableCash - worstCase;
  const hasShortfall = shortfall < 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <MetricCard title="Current Margin" value={fmt(totalCurrent)} icon={ShieldAlert} subtitle="Total initial margin" />
        <MetricCard title="Margin +5% Shock" value={fmt(totalUp5)} icon={ShieldAlert} subtitle="Price increase scenario" variant="warning" />
        <MetricCard title="Margin -5% Shock" value={fmt(totalDown5)} icon={ShieldAlert} subtitle="Price decrease scenario" variant="warning" />
        <MetricCard title="Available Cash" value={fmt(availableCash)} icon={ShieldAlert} subtitle="From Cash Management" />
        <MetricCard
          title="Coverage Ratio"
          value={`${coverageRatio.toFixed(2)}x`}
          icon={coverageRatio >= 1.5 ? ShieldAlert : AlertTriangle}
          subtitle={coverageRatio < 1 ? 'INSUFFICIENT' : coverageRatio < 1.5 ? 'Tight' : 'Adequate'}
          variant={coverageRatio < 1 ? 'error' : coverageRatio < 1.5 ? 'warning' : 'success'}
        />
      </div>

      {hasShortfall && (
        <div className="p-4 rounded-lg border border-destructive/30 bg-destructive/5 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
          <div>
            <p className="font-semibold text-sm text-destructive">Margin Shortfall Warning</p>
            <p className="text-xs text-muted-foreground">
              Worst-case margin requirement ({fmt(worstCase)}) exceeds available cash ({fmt(availableCash)}).
              Shortfall: <span className="text-destructive font-semibold">{fmt(Math.abs(shortfall))}</span>
            </p>
          </div>
        </div>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Position Margin Scenarios</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Instrument</TableHead>
                <TableHead>Desk</TableHead>
                <TableHead className="text-right">Notional</TableHead>
                <TableHead className="text-right">Current Margin</TableHead>
                <TableHead className="text-right">+5% Shock</TableHead>
                <TableHead className="text-right">-5% Shock</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {positions.map((p) => (
                <TableRow key={p.positionId}>
                  <TableCell className="font-medium text-sm">{p.instrument}</TableCell>
                  <TableCell><Badge variant="secondary" className="text-xs">{p.desk}</Badge></TableCell>
                  <TableCell className="text-right">{fmt(p.notional)}</TableCell>
                  <TableCell className="text-right">{fmt(p.currentMargin)}</TableCell>
                  <TableCell className="text-right text-warning">{fmt(p.marginUp5)}</TableCell>
                  <TableCell className="text-right text-warning">{fmt(p.marginDown5)}</TableCell>
                </TableRow>
              ))}
              <TableRow className="font-semibold border-t-2">
                <TableCell colSpan={3}>Total</TableCell>
                <TableCell className="text-right">{fmt(totalCurrent)}</TableCell>
                <TableCell className="text-right text-warning">{fmt(totalUp5)}</TableCell>
                <TableCell className="text-right text-warning">{fmt(totalDown5)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
