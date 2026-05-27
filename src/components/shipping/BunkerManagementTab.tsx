import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { BunkerLifting } from '@/hooks/useShippingChartering';

interface Props {
  liftings: BunkerLifting[];
}

export const BunkerManagementTab = ({ liftings }: Props) => {
  const totalMT = liftings.reduce((s, l) => s + l.quantity_mt, 0);
  const totalCost = liftings.reduce((s, l) => s + l.total_cost, 0);
  const avgPrice = totalCost / totalMT;

  const byGrade = liftings.reduce<Record<string, { mt: number; cost: number }>>((acc, l) => {
    if (!acc[l.grade]) acc[l.grade] = { mt: 0, cost: 0 };
    acc[l.grade].mt += l.quantity_mt;
    acc[l.grade].cost += l.total_cost;
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Total Liftings</p><p className="text-2xl font-bold">{liftings.length}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Total Volume</p><p className="text-2xl font-bold">{totalMT.toLocaleString()} MT</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Avg Price</p><p className="text-2xl font-bold">${avgPrice.toFixed(2)}/MT</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Total Spend</p><p className="text-2xl font-bold">${totalCost.toLocaleString()}</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Bunker Liftings</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Vessel</TableHead>
                    <TableHead>Port</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead className="text-right">Qty (MT)</TableHead>
                    <TableHead className="text-right">Price/MT</TableHead>
                    <TableHead className="text-right">Total Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {liftings.map(l => (
                    <TableRow key={l.id}>
                      <TableCell className="font-medium">{l.vessel_name}</TableCell>
                      <TableCell>{l.port}</TableCell>
                      <TableCell className="text-sm">{l.lifting_date}</TableCell>
                      <TableCell><Badge variant="outline">{l.grade}</Badge></TableCell>
                      <TableCell className="text-right font-mono">{l.quantity_mt.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-mono">${l.price_per_mt.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-mono font-semibold">${l.total_cost.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">By Grade</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(byGrade).map(([grade, data]) => (
              <div key={grade} className="flex items-center justify-between">
                <div>
                  <Badge variant="outline">{grade}</Badge>
                  <p className="text-xs text-muted-foreground mt-1">{data.mt.toLocaleString()} MT</p>
                </div>
                <p className="font-mono text-sm font-semibold">${data.cost.toLocaleString()}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
