import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

const statusColors: Record<string, string> = {
  PROVISIONAL: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
  FINAL: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  DISPUTED: 'bg-destructive/10 text-destructive',
  AMENDMENT_CREATED: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
};

interface AssayPricing {
  id: string;
  trade_ref: string;
  commodity: string;
  key_param: string;
  provisional_value: string;
  final_value: string;
  provisional_price: number;
  final_price: number;
  price_delta: number;
  pnl_impact: number;
  status: string;
  tolerance_breached: boolean;
}

const demoData: AssayPricing[] = [
  { id: '1', trade_ref: 'T-2026-1001', commodity: 'Crude Oil (Bonny Light)', key_param: 'API Gravity: 35.2 → 34.8', provisional_value: '35.2', final_value: '34.8', provisional_price: 82.50, final_price: 81.90, price_delta: -0.60, pnl_impact: -180000, status: 'FINAL', tolerance_breached: true },
  { id: '2', trade_ref: 'T-2026-1003', commodity: 'Gasoil 0.1%S', key_param: 'Sulfur: 0.08% → 0.09%', provisional_value: '0.08%', final_value: '0.09%', provisional_price: 685.00, final_price: 684.20, price_delta: -0.80, pnl_impact: -24000, status: 'FINAL', tolerance_breached: false },
  { id: '3', trade_ref: 'T-2026-1005', commodity: 'Copper Cathode', key_param: 'Cu Content: 99.95% → 99.97%', provisional_value: '99.95%', final_value: '99.97%', provisional_price: 9450.00, final_price: 9465.00, price_delta: 15.00, pnl_impact: 75000, status: 'AMENDMENT_CREATED', tolerance_breached: true },
  { id: '4', trade_ref: 'T-2026-1008', commodity: 'Wheat (SRW)', key_param: 'Protein: 11.5% → 11.2%', provisional_value: '11.5%', final_value: '11.2%', provisional_price: 245.00, final_price: 242.50, price_delta: -2.50, pnl_impact: -62500, status: 'DISPUTED', tolerance_breached: true },
  { id: '5', trade_ref: 'T-2026-1010', commodity: 'Fuel Oil 380cst', key_param: 'Viscosity: 380 → 375', provisional_value: '380', final_value: '375', provisional_price: 420.00, final_price: 420.00, price_delta: 0, pnl_impact: 0, status: 'FINAL', tolerance_breached: false },
  { id: '6', trade_ref: 'T-2026-1012', commodity: 'Crude Oil (Murban)', key_param: 'API Gravity: pending', provisional_value: '39.0', final_value: '—', provisional_price: 79.80, final_price: 0, price_delta: 0, pnl_impact: 0, status: 'PROVISIONAL', tolerance_breached: false },
];

export function ProvisionalVsFinalTab() {
  const totalImpact = demoData.reduce((s, d) => s + d.pnl_impact, 0);
  const breachCount = demoData.filter(d => d.tolerance_breached).length;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Provisional vs Final Pricing</h3>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-muted-foreground">Net P&L Impact: <span className={`font-mono font-bold ${totalImpact >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>{fmt(totalImpact)}</span></span>
          <Badge variant="outline" className="bg-destructive/5 text-destructive">{breachCount} tolerance breaches</Badge>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Trade</TableHead>
                <TableHead className="font-semibold">Commodity</TableHead>
                <TableHead className="font-semibold">Key Parameter</TableHead>
                <TableHead className="font-semibold text-right">Prov. Price</TableHead>
                <TableHead className="font-semibold text-right">Final Price</TableHead>
                <TableHead className="font-semibold text-right">Delta</TableHead>
                <TableHead className="font-semibold text-right">P&L Impact</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {demoData.map(d => (
                <TableRow key={d.id} className={d.tolerance_breached ? 'bg-destructive/[0.02]' : ''}>
                  <TableCell className="font-mono text-sm font-medium">{d.trade_ref}</TableCell>
                  <TableCell className="text-sm">{d.commodity}</TableCell>
                  <TableCell className="text-sm">
                    <div className="flex items-center gap-1">
                      {d.tolerance_breached && <AlertTriangle className="h-3 w-3 text-destructive" />}
                      {d.key_param}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono">${d.provisional_price.toFixed(2)}</TableCell>
                  <TableCell className="text-right font-mono">{d.status === 'PROVISIONAL' ? '—' : `$${d.final_price.toFixed(2)}`}</TableCell>
                  <TableCell className={`text-right font-mono ${d.price_delta < 0 ? 'text-destructive' : d.price_delta > 0 ? 'text-emerald-600' : ''}`}>
                    {d.status === 'PROVISIONAL' ? '—' : `$${d.price_delta.toFixed(2)}`}
                  </TableCell>
                  <TableCell className={`text-right font-mono ${d.pnl_impact < 0 ? 'text-destructive' : d.pnl_impact > 0 ? 'text-emerald-600' : ''}`}>
                    {d.pnl_impact === 0 && d.status === 'PROVISIONAL' ? '—' : fmt(d.pnl_impact)}
                  </TableCell>
                  <TableCell><Badge className={statusColors[d.status] || ''} variant="outline">{d.status}</Badge></TableCell>
                  <TableCell>
                    {d.tolerance_breached && d.status === 'FINAL' && (
                      <Button size="sm" variant="outline" className="h-7 text-xs">Create Amendment</Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </motion.div>
  );
}
