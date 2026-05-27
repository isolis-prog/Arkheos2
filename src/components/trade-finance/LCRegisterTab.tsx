import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'framer-motion';
import type { LetterOfCredit } from '@/hooks/useTradeFinance';

const statusColors: Record<string, string> = {
  DRAFT: 'bg-muted text-muted-foreground',
  ISSUED: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
  PRESENTED: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
  PAID: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  EXPIRED: 'bg-muted text-muted-foreground',
  CANCELLED: 'bg-muted text-muted-foreground',
  DISCREPANCY: 'bg-destructive/10 text-destructive',
};

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

interface Props {
  data: LetterOfCredit[];
  filter: string;
  onFilterChange: (v: string) => void;
  isStandby?: boolean;
}

export function LCRegisterTab({ data, filter, onFilterChange, isStandby }: Props) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{isStandby ? 'Standby LC / SBLC Register' : 'Letters of Credit Register'}</h3>
        <Select value={filter} onValueChange={onFilterChange}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Filter status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="ISSUED">Issued</SelectItem>
            <SelectItem value="PRESENTED">Presented</SelectItem>
            <SelectItem value="PAID">Paid</SelectItem>
            <SelectItem value="DISCREPANCY">Discrepancy</SelectItem>
            <SelectItem value="EXPIRED">Expired</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">LC Number</TableHead>
                <TableHead className="font-semibold">Type</TableHead>
                {isStandby && <TableHead className="font-semibold">Purpose</TableHead>}
                <TableHead className="font-semibold">Issuing Bank</TableHead>
                <TableHead className="font-semibold">Beneficiary</TableHead>
                <TableHead className="font-semibold">Commodity</TableHead>
                <TableHead className="font-semibold text-right">Amount</TableHead>
                <TableHead className="font-semibold">Issue Date</TableHead>
                <TableHead className="font-semibold">Expiry Date</TableHead>
                <TableHead className="font-semibold">Trade</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow><TableCell colSpan={isStandby ? 11 : 10} className="h-32 text-center text-muted-foreground">No records found</TableCell></TableRow>
              ) : data.map(lc => (
                <TableRow key={lc.id} className="cursor-pointer hover:bg-muted/30">
                  <TableCell className="font-mono text-sm font-medium">{lc.lc_number}</TableCell>
                  <TableCell className="capitalize">{lc.lc_type}</TableCell>
                  {isStandby && <TableCell>{lc.standby_purpose || '—'}</TableCell>}
                  <TableCell>{lc.issuing_bank}</TableCell>
                  <TableCell>{lc.beneficiary}</TableCell>
                  <TableCell>{lc.commodity || '—'}</TableCell>
                  <TableCell className="text-right font-mono">{fmt(lc.amount)}</TableCell>
                  <TableCell>{lc.issue_date || '—'}</TableCell>
                  <TableCell>{lc.expiry_date || '—'}</TableCell>
                  <TableCell className="font-mono text-xs">{lc.trade_id || '—'}</TableCell>
                  <TableCell>
                    <Badge className={statusColors[lc.status] || ''} variant="outline">{lc.status}</Badge>
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
