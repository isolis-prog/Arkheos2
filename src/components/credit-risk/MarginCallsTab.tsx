import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MarginCall } from '@/hooks/useCreditRiskManagement';

const statusColors: Record<string, string> = {
  ISSUED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  ACKNOWLEDGED: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  RECEIVED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  DISPUTED: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  OVERDUE: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

interface Props {
  calls: MarginCall[];
}

export const MarginCallsTab = ({ calls }: Props) => {
  const totalOutstanding = calls.filter(c => !['RECEIVED'].includes(c.status)).reduce((s, c) => s + c.call_amount, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Open Calls</p><p className="text-2xl font-bold">{calls.filter(c => c.status !== 'RECEIVED').length}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Outstanding Amount</p><p className="text-2xl font-bold text-red-600">${(totalOutstanding / 1e6).toFixed(1)}M</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Overdue</p><p className="text-2xl font-bold text-red-600">{calls.filter(c => c.status === 'OVERDUE').length}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Margin Call Workflow</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Counterparty</TableHead>
                <TableHead className="text-right">Call Amount</TableHead>
                <TableHead>Currency</TableHead>
                <TableHead>Call Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {calls.map(c => (
                <TableRow key={c.id} className={c.status === 'OVERDUE' ? 'bg-red-50 dark:bg-red-950/20' : ''}>
                  <TableCell className="font-medium">{c.counterparty}</TableCell>
                  <TableCell className="text-right font-mono font-semibold">${(c.call_amount / 1e6).toFixed(1)}M</TableCell>
                  <TableCell>{c.currency}</TableCell>
                  <TableCell className="text-sm">{c.call_date}</TableCell>
                  <TableCell className="text-sm">{c.due_date}</TableCell>
                  <TableCell><Badge className={statusColors[c.status] || ''}>{c.status}</Badge></TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{c.notes}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
