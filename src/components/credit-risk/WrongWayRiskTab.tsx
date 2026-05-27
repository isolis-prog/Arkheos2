import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle } from 'lucide-react';
import { WrongWayFlag } from '@/hooks/useCreditRiskManagement';

interface Props {
  flags: WrongWayFlag[];
}

export const WrongWayRiskTab = ({ flags }: Props) => (
  <div className="space-y-4">
    <Card className="border-red-200 dark:border-red-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          Wrong-Way Risk Flags ({flags.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Counterparty</TableHead>
              <TableHead>Trade Ref</TableHead>
              <TableHead>Credit Score Δ</TableHead>
              <TableHead className="text-right">Unrealized Loss</TableHead>
              <TableHead>Flagged</TableHead>
              <TableHead>Severity</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {flags.map(f => (
              <TableRow key={f.id} className={f.severity === 'CRITICAL' ? 'bg-red-50 dark:bg-red-950/20' : ''}>
                <TableCell className="font-medium">{f.counterparty}</TableCell>
                <TableCell className="font-mono text-sm">{f.trade_ref}</TableCell>
                <TableCell className="font-mono text-red-600">{f.credit_score_change}</TableCell>
                <TableCell className="text-right font-mono font-semibold text-red-600">${(f.unrealized_loss / 1e6).toFixed(1)}M</TableCell>
                <TableCell className="text-sm">{f.flagged_at}</TableCell>
                <TableCell><Badge className={f.severity === 'CRITICAL' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'}>{f.severity}</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>

    <Card>
      <CardContent className="pt-6">
        <p className="text-sm text-muted-foreground">
          <strong>Detection Rule:</strong> A wrong-way risk flag is raised when a counterparty's internal credit score decreases AND there is an unrealized loss on open trades exceeding the configured threshold ($500K default). This indicates correlated credit and market risk.
        </p>
      </CardContent>
    </Card>
  </div>
);
