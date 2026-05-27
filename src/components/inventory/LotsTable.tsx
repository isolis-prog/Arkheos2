import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import type { InventoryLot } from '@/hooks/useInventory';

interface Props {
  lots: InventoryLot[];
  onSelect: (lotId: string) => void;
}

const statusVariant = (s: string) => {
  switch (s) {
    case 'active': return 'default';
    case 'depleted': return 'secondary';
    case 'frozen': return 'outline';
    case 'write_down_pending': return 'destructive';
    default: return 'secondary';
  }
};

export const LotsTable = ({ lots, onSelect }: Props) => (
  <div className="rounded-md border">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Lot Ref</TableHead>
          <TableHead>Site</TableHead>
          <TableHead>Commodity</TableHead>
          <TableHead className="text-right">Quantity</TableHead>
          <TableHead>UoM</TableHead>
          <TableHead className="text-right">Unit Cost</TableHead>
          <TableHead className="text-right">Total Value</TableHead>
          <TableHead>Method</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Entity</TableHead>
          <TableHead></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {lots.map(lot => (
          <TableRow key={lot.id} className="cursor-pointer hover:bg-muted/50" onClick={() => onSelect(lot.id)}>
            <TableCell className="font-mono text-sm">{lot.lotRef}</TableCell>
            <TableCell>{lot.siteId}</TableCell>
            <TableCell>
              {lot.commodity}
              {lot.qualityGrade && <span className="ml-1 text-xs text-muted-foreground">({lot.qualityGrade})</span>}
            </TableCell>
            <TableCell className="text-right font-mono">{lot.qty.toLocaleString()}</TableCell>
            <TableCell>{lot.uom}</TableCell>
            <TableCell className="text-right font-mono">${lot.unitCost.toFixed(2)}</TableCell>
            <TableCell className="text-right font-mono font-semibold">${lot.totalCost.toLocaleString()}</TableCell>
            <TableCell>
              <Badge variant="outline" className="text-xs">{lot.valuationMethod === 'weighted_average' ? 'WA' : lot.valuationMethod}</Badge>
            </TableCell>
            <TableCell>
              <Badge variant={statusVariant(lot.status)}>{lot.status.replace('_', ' ')}</Badge>
            </TableCell>
            <TableCell className="text-xs text-muted-foreground">{lot.legalEntity}</TableCell>
            <TableCell>
              <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onSelect(lot.id); }}>
                <Eye className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);
