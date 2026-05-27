import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Voyage } from '@/hooks/useShippingChartering';

// Demo freight P&L per voyage
const freightPnLData = [
  { voyage_id: 'v5', vessel: 'MT Eagle Bay', revenue: 960000, freight_cost: 0, bunker_cost: 541500, port_costs: 85000, canal_dues: 0, other_costs: 12000, estimated_net: 380000 },
  { voyage_id: 'v4', vessel: 'MV Caspian Star', revenue: 1820000, freight_cost: 0, bunker_cost: 1122000, port_costs: 145000, canal_dues: 180000, other_costs: 28000, estimated_net: 400000 },
  { voyage_id: 'v2', vessel: 'MV Atlantic Spirit', revenue: 840000, freight_cost: 0, bunker_cost: 505750, port_costs: 62000, canal_dues: 0, other_costs: 8500, estimated_net: 290000 },
  { voyage_id: 'v1', vessel: 'MT Pacific Voyager', revenue: 1250000, freight_cost: 0, bunker_cost: 696000, port_costs: 98000, canal_dues: 0, other_costs: 15000, estimated_net: 480000 },
];

export const FreightPnLTab = () => {
  const rows = freightPnLData.map(r => {
    const totalCosts = r.bunker_cost + r.port_costs + r.canal_dues + r.other_costs;
    const netResult = r.revenue - totalCosts;
    const variance = netResult - r.estimated_net;
    return { ...r, totalCosts, netResult, variance };
  });

  const totalNet = rows.reduce((s, r) => s + r.netResult, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Revenue</p>
            <p className="text-2xl font-bold text-foreground">${rows.reduce((s, r) => s + r.revenue, 0).toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Costs</p>
            <p className="text-2xl font-bold text-foreground">${rows.reduce((s, r) => s + r.totalCosts, 0).toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Net Voyage Result</p>
            <p className={`text-2xl font-bold ${totalNet >= 0 ? 'text-green-600' : 'text-red-600'}`}>${totalNet.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Voyage P&L Breakdown</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Vessel</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Bunker</TableHead>
                <TableHead className="text-right">Port</TableHead>
                <TableHead className="text-right">Canal</TableHead>
                <TableHead className="text-right">Other</TableHead>
                <TableHead className="text-right">Net Result</TableHead>
                <TableHead className="text-right">vs Estimate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(r => (
                <TableRow key={r.voyage_id}>
                  <TableCell className="font-medium">{r.vessel}</TableCell>
                  <TableCell className="text-right font-mono">${r.revenue.toLocaleString()}</TableCell>
                  <TableCell className="text-right font-mono text-muted-foreground">${r.bunker_cost.toLocaleString()}</TableCell>
                  <TableCell className="text-right font-mono text-muted-foreground">${r.port_costs.toLocaleString()}</TableCell>
                  <TableCell className="text-right font-mono text-muted-foreground">{r.canal_dues > 0 ? `$${r.canal_dues.toLocaleString()}` : '—'}</TableCell>
                  <TableCell className="text-right font-mono text-muted-foreground">${r.other_costs.toLocaleString()}</TableCell>
                  <TableCell className={`text-right font-mono font-semibold ${r.netResult >= 0 ? 'text-green-600' : 'text-red-600'}`}>${r.netResult.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <span className={`inline-flex items-center gap-1 text-xs font-mono ${r.variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {r.variance >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {r.variance >= 0 ? '+' : ''}{r.variance.toLocaleString()}
                    </span>
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
