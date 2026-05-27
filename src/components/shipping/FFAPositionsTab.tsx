import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FFAPosition } from '@/hooks/useShippingChartering';

interface Props {
  positions: FFAPosition[];
}

export const FFAPositionsTab = ({ positions }: Props) => {
  const totalPnL = positions.reduce((s, p) => s + p.unrealized_pnl, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Open Positions</p><p className="text-2xl font-bold">{positions.length}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Total Lots</p><p className="text-2xl font-bold">{positions.reduce((s, p) => s + p.quantity_lots, 0)}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Unrealized P&L</p><p className={`text-2xl font-bold ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>${totalPnL.toLocaleString()}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">FFA Positions</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Route</TableHead>
                <TableHead>Month</TableHead>
                <TableHead>Direction</TableHead>
                <TableHead className="text-right">Lots</TableHead>
                <TableHead className="text-right">Entry</TableHead>
                <TableHead className="text-right">Current</TableHead>
                <TableHead className="text-right">Unrealized P&L</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {positions.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.route}</TableCell>
                  <TableCell>{p.contract_month}</TableCell>
                  <TableCell><Badge variant={p.direction === 'bought' ? 'default' : 'secondary'}>{p.direction.toUpperCase()}</Badge></TableCell>
                  <TableCell className="text-right font-mono">{p.quantity_lots}</TableCell>
                  <TableCell className="text-right font-mono">${p.entry_price.toFixed(2)}</TableCell>
                  <TableCell className="text-right font-mono">${p.current_price.toFixed(2)}</TableCell>
                  <TableCell className={`text-right font-mono font-semibold ${p.unrealized_pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {p.unrealized_pnl >= 0 ? '+' : ''}{p.unrealized_pnl.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
