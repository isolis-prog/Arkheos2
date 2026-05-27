import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, MessageSquare, ArrowUpRight } from 'lucide-react';
import type { DealReview } from '@/hooks/useMiddleOfficeControl';

const statusConfig: Record<string, { color: string; icon: typeof CheckCircle }> = {
  PENDING: { color: 'bg-amber-500/10 text-amber-700 dark:text-amber-400', icon: AlertTriangle },
  APPROVED: { color: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400', icon: CheckCircle },
  QUERIED: { color: 'bg-blue-500/10 text-blue-700 dark:text-blue-400', icon: MessageSquare },
  ESCALATED: { color: 'bg-destructive/10 text-destructive', icon: ArrowUpRight },
};

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

interface Props {
  data: DealReview[];
  filter: string;
  onFilterChange: (v: string) => void;
}

export function DealReviewTab({ data, filter, onFilterChange }: Props) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">New Deal Review Queue</h3>
        <Select value={filter} onValueChange={onFilterChange}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="APPROVED">Approved</SelectItem>
            <SelectItem value="QUERIED">Queried</SelectItem>
            <SelectItem value="ESCALATED">Escalated</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Trade Ref</TableHead>
                <TableHead className="font-semibold">Date</TableHead>
                <TableHead className="font-semibold">Desk</TableHead>
                <TableHead className="font-semibold">Trader</TableHead>
                <TableHead className="font-semibold">Counterparty</TableHead>
                <TableHead className="font-semibold">Instrument</TableHead>
                <TableHead className="font-semibold text-right">Notional</TableHead>
                <TableHead className="font-semibold">Risk Flags</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow><TableCell colSpan={10} className="h-32 text-center text-muted-foreground">No deals in queue</TableCell></TableRow>
              ) : data.map(r => {
                const cfg = statusConfig[r.review_status] || statusConfig.PENDING;
                return (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-sm font-medium">{r.trade_ref}</TableCell>
                    <TableCell className="text-sm">{r.trade_date}</TableCell>
                    <TableCell>{r.desk}</TableCell>
                    <TableCell>{r.trader}</TableCell>
                    <TableCell>{r.counterparty}</TableCell>
                    <TableCell>{r.instrument}</TableCell>
                    <TableCell className="text-right font-mono">{fmt(r.notional)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {r.risk_flags.length === 0 ? <span className="text-xs text-muted-foreground">None</span> :
                          r.risk_flags.map((f, i) => (
                            <Badge key={i} variant="outline" className="bg-destructive/5 text-destructive text-[10px]">{f}</Badge>
                          ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={cfg.color} variant="outline">{r.review_status}</Badge>
                    </TableCell>
                    <TableCell>
                      {r.review_status === 'PENDING' && (
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" className="h-7 text-xs">Approve</Button>
                          <Button size="sm" variant="outline" className="h-7 text-xs">Query</Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </motion.div>
  );
}
