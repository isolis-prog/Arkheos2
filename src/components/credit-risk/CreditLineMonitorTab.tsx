import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { CreditFile } from '@/hooks/useCreditRiskManagement';

function rowClass(util: number) {
  if (util > 90) return 'bg-red-50 dark:bg-red-950/20';
  if (util > 75) return 'bg-amber-50 dark:bg-amber-950/20';
  return '';
}

interface Props {
  files: CreditFile[];
}

export const CreditLineMonitorTab = ({ files }: Props) => {
  const sorted = [...files].sort((a, b) => b.utilization - a.utilization);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Lines &gt;90% Utilized</p><p className="text-2xl font-bold text-red-600">{sorted.filter(f => f.utilization > 90).length}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Lines 75–90%</p><p className="text-2xl font-bold text-amber-600">{sorted.filter(f => f.utilization >= 75 && f.utilization <= 90).length}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Lines &lt;75%</p><p className="text-2xl font-bold text-green-600">{sorted.filter(f => f.utilization < 75).length}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Credit Line Utilization — Real-Time</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Counterparty</TableHead>
                <TableHead className="text-right">Approved Line</TableHead>
                <TableHead className="text-right">Gross Exposure</TableHead>
                <TableHead className="text-right">Collateral</TableHead>
                <TableHead className="text-right">Net Exposure</TableHead>
                <TableHead>Utilization</TableHead>
                <TableHead className="text-right">Headroom</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map(f => {
                const headroom = f.approved_line_usd - f.net_exposure;
                return (
                  <TableRow key={f.id} className={rowClass(f.utilization)}>
                    <TableCell className="font-medium">{f.counterparty}</TableCell>
                    <TableCell className="text-right font-mono">${(f.approved_line_usd / 1e6).toFixed(0)}M</TableCell>
                    <TableCell className="text-right font-mono">${(f.gross_exposure / 1e6).toFixed(1)}M</TableCell>
                    <TableCell className="text-right font-mono">{f.collateral_held_usd > 0 ? `$${(f.collateral_held_usd / 1e6).toFixed(0)}M` : '—'}</TableCell>
                    <TableCell className="text-right font-mono font-semibold">${(f.net_exposure / 1e6).toFixed(1)}M</TableCell>
                    <TableCell className="min-w-[140px]">
                      <div className="flex items-center gap-2">
                        <Progress value={Math.min(f.utilization, 100)} className={`h-2.5 flex-1 [&>div]:${f.utilization > 90 ? 'bg-red-500' : f.utilization > 75 ? 'bg-amber-500' : 'bg-green-500'}`} />
                        <span className={`text-xs font-mono font-bold w-12 text-right ${f.utilization > 90 ? 'text-red-600' : f.utilization > 75 ? 'text-amber-600' : 'text-green-600'}`}>{f.utilization.toFixed(1)}%</span>
                      </div>
                    </TableCell>
                    <TableCell className={`text-right font-mono font-semibold ${headroom < 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {headroom < 0 ? '-' : ''}${(Math.abs(headroom) / 1e6).toFixed(1)}M
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
