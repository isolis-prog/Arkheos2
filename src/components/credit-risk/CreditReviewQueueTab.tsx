import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Calendar, RefreshCw } from 'lucide-react';
import { CreditFile } from '@/hooks/useCreditRiskManagement';
import { toast } from 'sonner';

interface Props {
  queue: CreditFile[];
}

export const CreditReviewQueueTab = ({ queue }: Props) => {
  const today = new Date();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Reviews Due (Next 30 Days) — {queue.length}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Counterparty</TableHead>
                <TableHead className="text-center">Current Score</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead className="text-right">Approved Line</TableHead>
                <TableHead>Review Date</TableHead>
                <TableHead>Days Until</TableHead>
                <TableHead>Analyst</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {queue.map(f => {
                const daysUntil = Math.ceil((new Date(f.review_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                const overdue = daysUntil < 0;
                return (
                  <TableRow key={f.id} className={overdue ? 'bg-red-50 dark:bg-red-950/20' : daysUntil <= 7 ? 'bg-amber-50 dark:bg-amber-950/20' : ''}>
                    <TableCell className="font-medium">{f.counterparty}</TableCell>
                    <TableCell className="text-center font-bold">{f.credit_score}</TableCell>
                    <TableCell className="font-mono text-sm">{f.external_rating}</TableCell>
                    <TableCell className="text-right font-mono">${(f.approved_line_usd / 1e6).toFixed(0)}M</TableCell>
                    <TableCell className="text-sm">{f.review_date}</TableCell>
                    <TableCell>
                      <Badge className={overdue ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : daysUntil <= 7 ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' : 'bg-muted text-muted-foreground'}>
                        {overdue ? `${Math.abs(daysUntil)}d overdue` : `${daysUntil}d`}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{f.analyst}</TableCell>
                    <TableCell><Badge className={f.status === 'UNDER_REVIEW' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' : 'bg-muted text-muted-foreground'}>{f.status.replace('_', ' ')}</Badge></TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={() => toast.success(`Review initiated for ${f.counterparty}`)}>
                        <RefreshCw className="h-3 w-3 mr-1" /> Review
                      </Button>
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
};
