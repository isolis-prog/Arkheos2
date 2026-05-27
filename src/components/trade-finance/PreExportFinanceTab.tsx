import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'framer-motion';
import type { PreExportFinance } from '@/hooks/useTradeFinance';

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

const typeLabels: Record<string, string> = {
  pre_export: 'Pre-Export',
  inventory: 'Inventory Finance',
  receivables: 'Receivables Finance',
};

interface Props {
  data: PreExportFinance[];
  filter: string;
  onFilterChange: (v: string) => void;
}

export function PreExportFinanceTab({ data, filter, onFilterChange }: Props) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Financing Events</h3>
        <Select value={filter} onValueChange={onFilterChange}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Filter type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="pre_export">Pre-Export</SelectItem>
            <SelectItem value="inventory">Inventory Finance</SelectItem>
            <SelectItem value="receivables">Receivables Finance</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Type</TableHead>
                <TableHead className="font-semibold">Bank</TableHead>
                <TableHead className="font-semibold text-right">Value</TableHead>
                <TableHead className="font-semibold text-right">Outstanding</TableHead>
                <TableHead className="font-semibold">Interest / Disc.</TableHead>
                <TableHead className="font-semibold">Drawdown</TableHead>
                <TableHead className="font-semibold">Repayment</TableHead>
                <TableHead className="font-semibold">Linked</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="h-32 text-center text-muted-foreground">No records found</TableCell></TableRow>
              ) : data.map(f => (
                <TableRow key={f.id}>
                  <TableCell><Badge variant="outline">{typeLabels[f.finance_type] || f.finance_type}</Badge></TableCell>
                  <TableCell>{f.bank_name || '—'}</TableCell>
                  <TableCell className="text-right font-mono">{fmt(f.value)}</TableCell>
                  <TableCell className="text-right font-mono">{fmt(f.outstanding_balance)}</TableCell>
                  <TableCell className="font-mono text-sm">
                    {f.interest_rate ? `${f.interest_rate}%` : f.discount_rate ? `${f.discount_rate}% disc` : '—'}
                  </TableCell>
                  <TableCell>{f.drawdown_date || '—'}</TableCell>
                  <TableCell>{f.repayment_date || '—'}</TableCell>
                  <TableCell className="font-mono text-xs">
                    {f.trade_id || f.voyage_id || f.invoice_id || '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={f.status === 'ACTIVE' ? 'default' : 'secondary'}>{f.status}</Badge>
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
