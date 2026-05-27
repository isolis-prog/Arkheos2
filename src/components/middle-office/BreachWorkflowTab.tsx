import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { motion } from 'framer-motion';
import type { BreachResponse } from '@/hooks/useMiddleOfficeControl';

const typeColors: Record<string, string> = {
  MONITOR: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
  REDUCE_POSITION: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
  ESCALATE: 'bg-destructive/10 text-destructive',
  WAIVER_REQUESTED: 'bg-purple-500/10 text-purple-700 dark:text-purple-400',
};

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

interface Props {
  data: BreachResponse[];
}

export function BreachWorkflowTab({ data }: Props) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <h3 className="text-lg font-semibold">Limit Breach Workflow</h3>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Breach ID</TableHead>
                <TableHead className="font-semibold">Desk</TableHead>
                <TableHead className="font-semibold">Limit Type</TableHead>
                <TableHead className="font-semibold text-right">Breach Amount</TableHead>
                <TableHead className="font-semibold">Response</TableHead>
                <TableHead className="font-semibold">Responder</TableHead>
                <TableHead className="font-semibold">Notes</TableHead>
                <TableHead className="font-semibold">Resolved</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map(b => (
                <TableRow key={b.id}>
                  <TableCell className="font-mono text-sm">{b.breach_id}</TableCell>
                  <TableCell>{b.desk}</TableCell>
                  <TableCell>{b.limit_type}</TableCell>
                  <TableCell className="text-right font-mono text-destructive">{fmt(b.breach_amount)}</TableCell>
                  <TableCell><Badge className={typeColors[b.response_type] || ''} variant="outline">{b.response_type.replace('_', ' ')}</Badge></TableCell>
                  <TableCell>{b.responder || '—'}</TableCell>
                  <TableCell className="text-xs max-w-[250px] truncate">{b.response_notes || '—'}</TableCell>
                  <TableCell>
                    {b.resolved_at ? (
                      <Badge className="bg-emerald-500/10 text-emerald-700" variant="outline">Resolved</Badge>
                    ) : (
                      <Badge variant="outline" className="bg-amber-500/10 text-amber-700">Open</Badge>
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
