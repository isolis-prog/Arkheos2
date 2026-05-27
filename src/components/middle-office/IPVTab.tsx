import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { motion } from 'framer-motion';
import type { IPVPosition } from '@/hooks/useMiddleOfficeControl';

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

interface Props {
  data: IPVPosition[];
  totalReserve: number;
}

export function IPVTab({ data, totalReserve }: Props) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Independent Price Verification</h3>
        <Card className="border-amber-500/30">
          <CardContent className="flex items-center gap-2 p-3">
            <span className="text-sm text-muted-foreground">Aggregate IPV Reserve:</span>
            <span className="font-mono font-bold text-amber-600">{fmt(totalReserve)}</span>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Position</TableHead>
                <TableHead className="font-semibold">Desk</TableHead>
                <TableHead className="font-semibold">Instrument</TableHead>
                <TableHead className="font-semibold text-right">Notional</TableHead>
                <TableHead className="font-semibold text-right">System Price</TableHead>
                <TableHead className="font-semibold text-right">MO Price</TableHead>
                <TableHead className="font-semibold text-right">Variance</TableHead>
                <TableHead className="font-semibold text-right">Var %</TableHead>
                <TableHead className="font-semibold text-right">Adjustment</TableHead>
                <TableHead className="font-semibold">Justification</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-sm">{p.position_ref}</TableCell>
                  <TableCell>{p.desk}</TableCell>
                  <TableCell>{p.instrument}</TableCell>
                  <TableCell className="text-right font-mono">{fmt(p.notional)}</TableCell>
                  <TableCell className="text-right font-mono">{p.system_price.toFixed(2)}</TableCell>
                  <TableCell className="text-right font-mono">{p.mo_price.toFixed(2)}</TableCell>
                  <TableCell className={`text-right font-mono ${Math.abs(p.variance_pct) > 0.5 ? 'text-amber-600 font-bold' : ''}`}>{p.variance.toFixed(2)}</TableCell>
                  <TableCell className={`text-right font-mono ${Math.abs(p.variance_pct) > 0.5 ? 'text-amber-600 font-bold' : ''}`}>{p.variance_pct.toFixed(2)}%</TableCell>
                  <TableCell className="text-right font-mono">{p.adjustment ? fmt(p.adjustment) : '—'}</TableCell>
                  <TableCell className="text-xs max-w-[200px] truncate">{p.justification || '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </motion.div>
  );
}
