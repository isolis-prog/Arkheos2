import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { motion } from 'framer-motion';
import type { MODailyPnL } from '@/hooks/useMiddleOfficeControl';

const statusColors: Record<string, string> = {
  PENDING: 'bg-muted text-muted-foreground',
  MO_EXPLAIN_REQUIRED: 'bg-destructive/10 text-destructive',
  EXPLAINED: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
  APPROVED: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  ESCALATED: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
};

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

interface Props {
  data: MODailyPnL[];
  dateFilter: string;
  onDateChange: (v: string) => void;
}

export function DailyPnLTab({ data, dateFilter, onDateChange }: Props) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Independent Daily P&L</h3>
        <input
          type="date"
          value={dateFilter}
          onChange={e => onDateChange(e.target.value)}
          className="rounded-md border bg-background px-3 py-1.5 text-sm"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Desk</TableHead>
                <TableHead className="font-semibold text-right">MO P&L</TableHead>
                <TableHead className="font-semibold text-right">FO P&L</TableHead>
                <TableHead className="font-semibold text-right">Variance</TableHead>
                <TableHead className="font-semibold text-right">Variance %</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Approved By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="h-32 text-center text-muted-foreground">No P&L data for this date</TableCell></TableRow>
              ) : data.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.desk_id}</TableCell>
                  <TableCell className={`text-right font-mono ${p.mo_pnl_usd >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>{fmt(p.mo_pnl_usd)}</TableCell>
                  <TableCell className={`text-right font-mono ${p.fo_pnl_usd >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>{fmt(p.fo_pnl_usd)}</TableCell>
                  <TableCell className={`text-right font-mono ${Math.abs(p.variance_pct) > 10 ? 'text-destructive font-bold' : ''}`}>{fmt(p.variance_usd)}</TableCell>
                  <TableCell className={`text-right font-mono ${Math.abs(p.variance_pct) > 10 ? 'text-destructive font-bold' : ''}`}>{p.variance_pct.toFixed(1)}%</TableCell>
                  <TableCell><Badge className={statusColors[p.status] || ''} variant="outline">{p.status}</Badge></TableCell>
                  <TableCell className="text-sm">{p.approved_by || '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </motion.div>
  );
}
