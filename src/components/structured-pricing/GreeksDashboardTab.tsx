import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { motion } from 'framer-motion';
import type { GreeksRow } from '@/hooks/useStructuredPricing';

function fmt(n: number) {
  if (Math.abs(n) >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (Math.abs(n) >= 1e3) return `${(n / 1e3).toFixed(0)}K`;
  return n.toFixed(0);
}

interface Props {
  data: GreeksRow[];
}

export function GreeksDashboardTab({ data }: Props) {
  const totals = data.reduce((acc, r) => ({
    vega: acc.vega + r.net_vega,
    theta: acc.theta + r.net_theta,
    gamma: acc.gamma + r.net_gamma,
  }), { vega: 0, theta: 0, gamma: 0 });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <h3 className="text-lg font-semibold">Portfolio Greeks Dashboard</h3>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Net Vega</p>
            <p className="text-2xl font-bold font-mono">${fmt(totals.vega)}</p>
            <p className="text-xs text-muted-foreground">per 1% vol move</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Net Theta</p>
            <p className="text-2xl font-bold font-mono text-destructive">${fmt(totals.theta)}</p>
            <p className="text-xs text-muted-foreground">per day decay</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Net Gamma</p>
            <p className="text-2xl font-bold font-mono">{fmt(totals.gamma)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Per-desk table */}
      <Card>
        <CardHeader><CardTitle className="text-base">Greeks by Desk</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Desk</TableHead>
                <TableHead className="font-semibold text-right">Net Delta</TableHead>
                <TableHead className="font-semibold">Units</TableHead>
                <TableHead className="font-semibold text-right">Net Vega ($)</TableHead>
                <TableHead className="font-semibold text-right">Net Theta ($/d)</TableHead>
                <TableHead className="font-semibold text-right">Net Gamma</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map(r => (
                <TableRow key={r.desk}>
                  <TableCell className="font-medium">{r.desk}</TableCell>
                  <TableCell className={`text-right font-mono ${r.net_delta >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>{fmt(r.net_delta)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{r.delta_units}</TableCell>
                  <TableCell className="text-right font-mono">${fmt(r.net_vega)}</TableCell>
                  <TableCell className="text-right font-mono text-destructive">${fmt(r.net_theta)}</TableCell>
                  <TableCell className="text-right font-mono">{fmt(r.net_gamma)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </motion.div>
  );
}
