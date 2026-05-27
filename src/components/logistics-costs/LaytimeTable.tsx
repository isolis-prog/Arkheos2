import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LaytimeEvent } from '@/hooks/useLogisticsCosts';
import { format } from 'date-fns';
import { Calculator } from 'lucide-react';

interface Props {
  events: LaytimeEvent[];
  onSelect: (id: string) => void;
}

const statusColors: Record<string, string> = {
  in_progress: 'bg-blue-500/10 text-blue-700 border-blue-300',
  completed: 'bg-green-500/10 text-green-700 border-green-300',
  on_demurrage: 'bg-red-500/10 text-red-700 border-red-300',
  on_despatch: 'bg-primary/10 text-primary border-primary/30',
};

export const LaytimeTable = ({ events, onSelect }: Props) => (
  <div className="rounded-md border">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Vessel</TableHead>
          <TableHead>Port / Terminal</TableHead>
          <TableHead>Delivery</TableHead>
          <TableHead>Allowed</TableHead>
          <TableHead>Used (net)</TableHead>
          <TableHead>Over/Under</TableHead>
          <TableHead className="text-right">DEM/DSP</TableHead>
          <TableHead>Status</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {events.map(e => (
          <TableRow key={e.id} className="cursor-pointer hover:bg-muted/50" onClick={() => onSelect(e.id)}>
            <TableCell className="font-medium">{e.vesselName}</TableCell>
            <TableCell className="text-sm">{e.port} / {e.terminal}</TableCell>
            <TableCell className="font-mono text-sm">{e.deliveryId}</TableCell>
            <TableCell className="font-mono text-sm">{e.allowedHours}h</TableCell>
            <TableCell className="font-mono text-sm">{e.netHours}h</TableCell>
            <TableCell className="font-mono text-sm">
              <span className={e.overUnderHours > 0 ? 'text-destructive' : 'text-green-600'}>
                {e.overUnderHours > 0 ? '+' : ''}{e.overUnderHours}h
              </span>
            </TableCell>
            <TableCell className="text-right font-mono text-sm">
              {e.demurrageAmount > 0 && <span className="text-destructive">${e.demurrageAmount.toLocaleString()}</span>}
              {e.despatchAmount > 0 && <span className="text-green-600">-${e.despatchAmount.toLocaleString()}</span>}
              {e.demurrageAmount === 0 && e.despatchAmount === 0 && <span className="text-muted-foreground">—</span>}
            </TableCell>
            <TableCell><Badge variant="outline" className={statusColors[e.status]}>{e.status.replace('_', ' ')}</Badge></TableCell>
            <TableCell><Button variant="ghost" size="icon"><Calculator className="h-4 w-4" /></Button></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);
