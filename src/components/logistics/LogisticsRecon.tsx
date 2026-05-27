import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MetricCard } from '@/components/ui/metric-card';
import { CheckCircle2, AlertTriangle, XCircle, BarChart3 } from 'lucide-react';
import type { LogReconResult } from '@/hooks/useLogistics';

const statusConfig: Record<string, { class: string; label: string }> = {
  matched: { class: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400', label: 'Matched' },
  partial: { class: 'bg-amber-500/10 text-amber-600 dark:text-amber-400', label: 'Partial' },
  unmatched: { class: 'bg-destructive/10 text-destructive', label: 'Unmatched' },
  tolerance_breach: { class: 'bg-orange-500/10 text-orange-600 dark:text-orange-400', label: 'Tolerance Breach' },
  exception: { class: 'bg-destructive/10 text-destructive', label: 'Exception' },
};

interface Props {
  results: LogReconResult[];
  stats: { total: number; matched: number; exceptions: number; unmatched: number; matchRate: number };
}

export const LogisticsRecon = ({ results, stats }: Props) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <MetricCard title="Total Checks" value={stats.total} icon={BarChart3} />
      <MetricCard title="Matched" value={stats.matched} icon={CheckCircle2} trend={{ value: Math.round(stats.matchRate), isPositive: true }} />
      <MetricCard title="Exceptions" value={stats.exceptions} icon={AlertTriangle} />
      <MetricCard title="Unmatched" value={stats.unmatched} icon={XCircle} />
    </div>

    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Reconciliation Results</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="font-semibold">Type</TableHead>
              <TableHead className="font-semibold text-right">Expected</TableHead>
              <TableHead className="font-semibold text-right">Actual</TableHead>
              <TableHead className="font-semibold text-right">Variance</TableHead>
              <TableHead className="font-semibold text-right">Var %</TableHead>
              <TableHead className="font-semibold text-right">Tolerance</TableHead>
              <TableHead className="font-semibold">Quality</TableHead>
              <TableHead className="font-semibold">Counterpart</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {results.map(r => {
              const cfg = statusConfig[r.status];
              return (
                <TableRow key={r.id} className="data-table-row">
                  <TableCell className="text-sm">{r.recon_type}</TableCell>
                  <TableCell className="text-right font-mono">{r.quantity_expected.toLocaleString()}</TableCell>
                  <TableCell className="text-right font-mono">{r.quantity_actual.toLocaleString()}</TableCell>
                  <TableCell className={`text-right font-mono ${r.quantity_variance < 0 ? 'text-destructive' : ''}`}>
                    {r.quantity_variance.toLocaleString()}
                  </TableCell>
                  <TableCell className={`text-right font-mono ${Math.abs(r.variance_pct) > r.tolerance_applied ? 'text-destructive' : ''}`}>
                    {r.variance_pct.toFixed(2)}%
                  </TableCell>
                  <TableCell className="text-right font-mono">±{r.tolerance_applied}%</TableCell>
                  <TableCell>
                    {r.quality_match ? (
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 text-xs">Pass</Badge>
                    ) : (
                      <Badge variant="outline" className="bg-destructive/10 text-destructive text-xs">Fail</Badge>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{r.counterpart_ref}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cfg.class}>{cfg.label}</Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  </div>
);
