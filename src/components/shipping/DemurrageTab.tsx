import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DemurrageClaim } from '@/hooks/useShippingChartering';

const statusColors: Record<string, string> = {
  CALCULATING: 'bg-muted text-muted-foreground',
  CLAIM_SENT: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  DISPUTED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  SETTLED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
};

interface Props {
  claims: DemurrageClaim[];
}

export const DemurrageTab = ({ claims }: Props) => {
  const totalDem = claims.filter(c => c.claim_amount > 0).reduce((s, c) => s + c.claim_amount, 0);
  const totalDesp = Math.abs(claims.filter(c => c.claim_amount < 0).reduce((s, c) => s + c.claim_amount, 0));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Demurrage Payable</p><p className="text-2xl font-bold text-red-600">${totalDem.toLocaleString()}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Despatch Receivable</p><p className="text-2xl font-bold text-green-600">${totalDesp.toLocaleString()}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Net Position</p><p className={`text-2xl font-bold ${totalDem - totalDesp > 0 ? 'text-red-600' : 'text-green-600'}`}>${(totalDem - totalDesp).toLocaleString()}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Demurrage & Despatch Claims ({claims.length})</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Vessel</TableHead>
                <TableHead>Counterparty</TableHead>
                <TableHead className="text-right">Allowed (hrs)</TableHead>
                <TableHead className="text-right">Actual (hrs)</TableHead>
                <TableHead className="text-right">Dem Rate ($/day)</TableHead>
                <TableHead className="text-right">Desp Rate ($/day)</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {claims.map(c => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.vessel_name}</TableCell>
                  <TableCell>{c.counterparty}</TableCell>
                  <TableCell className="text-right font-mono">{c.allowed_hours}</TableCell>
                  <TableCell className="text-right font-mono">{c.actual_hours}</TableCell>
                  <TableCell className="text-right font-mono">${c.demurrage_rate.toLocaleString()}</TableCell>
                  <TableCell className="text-right font-mono">${c.despatch_rate.toLocaleString()}</TableCell>
                  <TableCell className={`text-right font-mono font-semibold ${c.claim_amount > 0 ? 'text-red-600' : c.claim_amount < 0 ? 'text-green-600' : ''}`}>
                    {c.claim_amount > 0 ? `$${c.claim_amount.toLocaleString()}` : c.claim_amount < 0 ? `-$${Math.abs(c.claim_amount).toLocaleString()}` : '$0'}
                  </TableCell>
                  <TableCell><Badge className={statusColors[c.status] || ''}>{c.status.replace('_', ' ')}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
