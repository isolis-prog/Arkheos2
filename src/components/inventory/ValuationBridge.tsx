import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle } from 'lucide-react';
import type { ValuationSnapshot } from '@/hooks/useInventory';

interface Props {
  snapshots: ValuationSnapshot[];
}

export const ValuationBridge = ({ snapshots }: Props) => (
  <Card>
    <CardHeader>
      <CardTitle>Valuation Bridge – Subledger ↔ GL Reconciliation</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="rounded-md border overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Site</TableHead>
              <TableHead>Commodity</TableHead>
              <TableHead className="text-right">Opening Qty</TableHead>
              <TableHead className="text-right">+ Receipts</TableHead>
              <TableHead className="text-right">− Issues</TableHead>
              <TableHead className="text-right">± Transfers</TableHead>
              <TableHead className="text-right">− Losses</TableHead>
              <TableHead className="text-right">± Adj</TableHead>
              <TableHead className="text-right">Closing Qty</TableHead>
              <TableHead className="text-right">Closing Value</TableHead>
              <TableHead className="text-right">GL Balance</TableHead>
              <TableHead className="text-right">Variance</TableHead>
              <TableHead>GL Acct</TableHead>
              <TableHead>Recon</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {snapshots.map(s => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{s.siteId}</TableCell>
                <TableCell>{s.commodity}</TableCell>
                <TableCell className="text-right font-mono text-sm">{s.openingQty.toLocaleString()}</TableCell>
                <TableCell className="text-right font-mono text-sm text-success">{s.receiptsQty.toLocaleString()}</TableCell>
                <TableCell className="text-right font-mono text-sm text-destructive">{s.issuesQty.toLocaleString()}</TableCell>
                <TableCell className="text-right font-mono text-sm">{s.transfersNet.toLocaleString()}</TableCell>
                <TableCell className="text-right font-mono text-sm text-warning">{s.lossesQty.toLocaleString()}</TableCell>
                <TableCell className="text-right font-mono text-sm">{s.adjustmentsQty.toLocaleString()}</TableCell>
                <TableCell className="text-right font-mono text-sm font-semibold">{s.closingQty.toLocaleString()}</TableCell>
                <TableCell className="text-right font-mono text-sm font-semibold">${s.closingValue.toLocaleString()}</TableCell>
                <TableCell className="text-right font-mono text-sm">{s.glBalance != null ? `$${s.glBalance.toLocaleString()}` : '—'}</TableCell>
                <TableCell className={`text-right font-mono text-sm font-semibold ${s.glVariance !== 0 ? 'text-destructive' : 'text-success'}`}>
                  ${s.glVariance.toLocaleString()}
                </TableCell>
                <TableCell className="font-mono text-xs">{s.glAccount || '—'}</TableCell>
                <TableCell>
                  {s.isReconciled ? (
                    <Badge variant="default" className="bg-success/20 text-success border-success/30 gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Done
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="gap-1">
                      <XCircle className="h-3 w-3" /> Pending
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </CardContent>
  </Card>
);
