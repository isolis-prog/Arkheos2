import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { AlertTriangle, ArrowDownUp } from 'lucide-react';

interface AssayExchange {
  id: string;
  trade_ref: string;
  commodity: string;
  direction: 'sent' | 'received';
  date: string;
  lab_name: string;
  parameters: { name: string; our_value: number; cp_value: number; unit: string; threshold: number; breached: boolean }[];
  has_discrepancy: boolean;
}

const demoData: AssayExchange[] = [
  { id: '1', trade_ref: 'T-2026-1001', commodity: 'Crude Oil (Bonny Light)', direction: 'received', date: '2026-04-06', lab_name: 'SGS Geneva',
    parameters: [
      { name: 'API Gravity', our_value: 34.8, cp_value: 35.1, unit: '°', threshold: 0.5, breached: false },
      { name: 'Sulfur', our_value: 0.14, cp_value: 0.16, unit: '%', threshold: 0.03, breached: false },
      { name: 'Water & Sediment', our_value: 0.08, cp_value: 0.05, unit: '%', threshold: 0.02, breached: true },
    ], has_discrepancy: true },
  { id: '2', trade_ref: 'T-2026-1003', commodity: 'Gasoil 0.1%S', direction: 'sent', date: '2026-04-08', lab_name: 'Intertek Rotterdam',
    parameters: [
      { name: 'Sulfur', our_value: 0.09, cp_value: 0.09, unit: '%', threshold: 0.01, breached: false },
      { name: 'Density', our_value: 0.845, cp_value: 0.844, unit: 'kg/l', threshold: 0.003, breached: false },
    ], has_discrepancy: false },
  { id: '3', trade_ref: 'T-2026-1008', commodity: 'Wheat (SRW)', direction: 'received', date: '2026-04-09', lab_name: 'Cotecna',
    parameters: [
      { name: 'Protein', our_value: 11.2, cp_value: 11.8, unit: '%', threshold: 0.3, breached: true },
      { name: 'Moisture', our_value: 12.1, cp_value: 12.0, unit: '%', threshold: 0.5, breached: false },
      { name: 'Test Weight', our_value: 58.5, cp_value: 59.2, unit: 'lb/bu', threshold: 0.5, breached: true },
    ], has_discrepancy: true },
];

export function AssayExchangeLogTab() {
  const discrepancies = demoData.filter(d => d.has_discrepancy).length;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Assay Exchange Log</h3>
        {discrepancies > 0 && (
          <Badge variant="outline" className="bg-destructive/5 text-destructive gap-1">
            <AlertTriangle className="h-3 w-3" /> {discrepancies} discrepancies
          </Badge>
        )}
      </div>

      <div className="space-y-4">
        {demoData.map(ex => (
          <Card key={ex.id} className={ex.has_discrepancy ? 'border-destructive/30' : ''}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className={ex.direction === 'sent' ? 'bg-blue-500/10 text-blue-700' : 'bg-purple-500/10 text-purple-700'}>
                    <ArrowDownUp className="h-3 w-3 mr-1" />{ex.direction === 'sent' ? 'Sent' : 'Received'}
                  </Badge>
                  <span className="font-mono text-sm font-medium">{ex.trade_ref}</span>
                  <span className="text-sm text-muted-foreground">{ex.commodity}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{ex.lab_name}</span>
                  <span>•</span>
                  <span>{ex.date}</span>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead className="text-xs font-semibold">Parameter</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Our Value</TableHead>
                    <TableHead className="text-xs font-semibold text-right">CP Value</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Diff</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Threshold</TableHead>
                    <TableHead className="text-xs font-semibold">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ex.parameters.map((p, i) => (
                    <TableRow key={i} className={p.breached ? 'bg-destructive/[0.03]' : ''}>
                      <TableCell className="text-sm">{p.name}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{p.our_value} {p.unit}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{p.cp_value} {p.unit}</TableCell>
                      <TableCell className={`text-right font-mono text-sm ${p.breached ? 'text-destructive font-bold' : ''}`}>
                        {Math.abs(p.our_value - p.cp_value).toFixed(2)} {p.unit}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-muted-foreground">±{p.threshold} {p.unit}</TableCell>
                      <TableCell>
                        {p.breached ? (
                          <Badge variant="outline" className="bg-destructive/10 text-destructive text-[10px]">Breach</Badge>
                        ) : (
                          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 text-[10px]">OK</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {ex.has_discrepancy && (
                <div className="flex justify-end">
                  <Button size="sm" variant="outline" className="h-7 text-xs">Create Quality Claim</Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </motion.div>
  );
}
