import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LogCostRecon } from '@/hooks/useLogisticsCosts';
import { AlertTriangle, Eye } from 'lucide-react';

interface Props {
  recons: LogCostRecon[];
  onSelect: (id: string) => void;
  onOpenDispute: (id: string) => void;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-700 border-yellow-300',
  matched: 'bg-green-500/10 text-green-700 border-green-300',
  variance: 'bg-orange-500/10 text-orange-700 border-orange-300',
  disputed: 'bg-red-500/10 text-red-700 border-red-300',
  resolved: 'bg-primary/10 text-primary border-primary/30',
};

const typeLabels: Record<string, string> = {
  freight: 'Freight', demurrage: 'Demurrage', storage: 'Storage',
  terminal: 'Terminal', inspection: 'Inspection', insurance: 'Insurance', other: 'Other',
};

export const CostReconTable = ({ recons, onSelect, onOpenDispute }: Props) => (
  <div className="rounded-md border">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Delivery</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Counterparty</TableHead>
          <TableHead>Route</TableHead>
          <TableHead className="text-right">Expected</TableHead>
          <TableHead className="text-right">Actual</TableHead>
          <TableHead className="text-right">Delta</TableHead>
          <TableHead>Status</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {recons.map(r => (
          <TableRow key={r.id} className="cursor-pointer hover:bg-muted/50" onClick={() => onSelect(r.id)}>
            <TableCell className="font-mono text-sm">{r.deliveryId}</TableCell>
            <TableCell><Badge variant="outline">{typeLabels[r.costType]}</Badge></TableCell>
            <TableCell>{r.counterparty}</TableCell>
            <TableCell className="text-sm text-muted-foreground">{r.route}</TableCell>
            <TableCell className="text-right font-mono text-sm">${r.expectedAmount.toLocaleString()}</TableCell>
            <TableCell className="text-right font-mono text-sm">${r.actualAmount.toLocaleString()}</TableCell>
            <TableCell className="text-right font-mono text-sm">
              <span className={r.delta > 0 ? 'text-destructive' : r.delta < 0 ? 'text-green-600' : ''}>
                {r.delta > 0 ? '+' : ''}{r.delta.toLocaleString()} ({r.deltaPct}%)
              </span>
            </TableCell>
            <TableCell>
              <Badge variant="outline" className={statusColors[r.status]}>
                {r.disputeFlag && <AlertTriangle className="h-3 w-3 mr-1" />}
                {r.status}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={e => { e.stopPropagation(); onSelect(r.id); }}>
                  <Eye className="h-4 w-4" />
                </Button>
                {!r.disputeFlag && r.status === 'variance' && (
                  <Button variant="outline" size="sm" onClick={e => { e.stopPropagation(); onOpenDispute(r.id); }}>
                    Dispute
                  </Button>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);
