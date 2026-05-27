import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { X, ArrowUpRight, ArrowDownRight, ArrowLeftRight, AlertTriangle, Minus } from 'lucide-react';
import type { InventoryLot, InventoryMovement } from '@/hooks/useInventory';

interface Props {
  lot: InventoryLot;
  movements: InventoryMovement[];
  onClose: () => void;
}

const typeIcon = (t: string) => {
  switch (t) {
    case 'receipt': return <ArrowDownRight className="h-4 w-4 text-success" />;
    case 'issue': return <ArrowUpRight className="h-4 w-4 text-destructive" />;
    case 'transfer_in': case 'transfer_out': return <ArrowLeftRight className="h-4 w-4 text-info" />;
    case 'loss': return <AlertTriangle className="h-4 w-4 text-warning" />;
    default: return <Minus className="h-4 w-4 text-muted-foreground" />;
  }
};

export const LotDetailPanel = ({ lot, movements, onClose }: Props) => {
  const landed = Object.entries(lot.landedCostAlloc);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-lg">{lot.lotRef}</CardTitle>
          <p className="text-sm text-muted-foreground">{lot.siteId} · {lot.commodity} · {lot.legalEntity}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Quantity</p>
            <p className="text-lg font-bold font-mono">{lot.qty.toLocaleString()} {lot.uom}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Unit Cost</p>
            <p className="text-lg font-bold font-mono">${lot.unitCost.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Value</p>
            <p className="text-lg font-bold font-mono">${lot.totalCost.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Method</p>
            <Badge variant="outline">{lot.valuationMethod === 'weighted_average' ? 'Weighted Average' : lot.valuationMethod}</Badge>
          </div>
        </div>

        {/* Landed Cost */}
        {landed.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2">Landed Cost Allocation</h4>
            <div className="flex flex-wrap gap-2">
              {landed.map(([key, val]) => (
                <Badge key={key} variant="secondary" className="text-xs">
                  {key}: ${val.toLocaleString()}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Movements */}
        <div>
          <h4 className="text-sm font-semibold mb-2">Movements ({movements.length})</h4>
          <div className="rounded-md border max-h-[300px] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Cost Delta</TableHead>
                  <TableHead>Ref Doc</TableHead>
                  <TableHead>Trade</TableHead>
                  <TableHead>Counterparty</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.map(m => (
                  <TableRow key={m.id}>
                    <TableCell className="flex items-center gap-1.5">
                      {typeIcon(m.movementType)}
                      <span className="text-xs capitalize">{m.movementType.replace('_', ' ')}</span>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{m.movementDate}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{m.qty.toLocaleString()} {m.uom}</TableCell>
                    <TableCell className={`text-right font-mono text-sm ${m.costDelta < 0 ? 'text-destructive' : 'text-success'}`}>
                      ${m.costDelta.toLocaleString()}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{m.refDoc || '—'}</TableCell>
                    <TableCell className="font-mono text-xs">{m.linkTradeId || '—'}</TableCell>
                    <TableCell className="text-xs">{m.counterparty || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
