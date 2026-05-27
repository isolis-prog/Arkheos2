import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import type { ReconResult } from '@/hooks/useMeasurements';

interface Props {
  results: ReconResult[];
  onSelect: (id: string) => void;
  selectedId: string | null;
}

const statusBadge = (status: string) => {
  const map: Record<string, { variant: 'default' | 'destructive' | 'secondary' | 'outline'; label: string }> = {
    matched: { variant: 'default', label: 'Matched' },
    adjusted: { variant: 'secondary', label: 'Adjusted' },
    pending: { variant: 'outline', label: 'Pending' },
    disputed: { variant: 'destructive', label: 'Disputed' },
    closed: { variant: 'default', label: 'Closed' },
  };
  const cfg = map[status] ?? map.pending;
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
};

export const ReconResultsTable = ({ results, onSelect, selectedId }: Props) => (
  <div className="rounded-lg border bg-card">
    <Table>
      <TableHeader>
        <TableRow className="bg-muted/50 hover:bg-muted/50">
          <TableHead className="font-semibold">Location</TableHead>
          <TableHead className="font-semibold">Meter</TableHead>
          <TableHead className="font-semibold">Commodity</TableHead>
          <TableHead className="font-semibold">Date</TableHead>
          <TableHead className="font-semibold text-right">Expected</TableHead>
          <TableHead className="font-semibold text-right">Actual</TableHead>
          <TableHead className="font-semibold text-right">Delta</TableHead>
          <TableHead className="font-semibold text-right">Δ Value</TableHead>
          <TableHead className="font-semibold">Type</TableHead>
          <TableHead className="font-semibold">Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {results.length === 0 ? (
          <TableRow><TableCell colSpan={10} className="h-32 text-center text-muted-foreground">No results found</TableCell></TableRow>
        ) : results.map((r) => (
          <TableRow
            key={r.id}
            className={`cursor-pointer hover:bg-muted/50 ${selectedId === r.id ? 'bg-primary/5' : ''}`}
            onClick={() => onSelect(r.id)}
          >
            <TableCell className="max-w-[150px] truncate">{r.location}</TableCell>
            <TableCell className="font-mono text-sm">{r.meterId}</TableCell>
            <TableCell>{r.commodity}</TableCell>
            <TableCell className="whitespace-nowrap">{format(new Date(r.reconDate), 'dd MMM yyyy')}</TableCell>
            <TableCell className="text-right font-mono">{r.expectedQty.toLocaleString()}</TableCell>
            <TableCell className="text-right font-mono">{r.actualQty.toLocaleString()}</TableCell>
            <TableCell className={`text-right font-mono ${r.delta < 0 ? 'text-destructive' : ''}`}>
              {r.delta.toLocaleString()} {r.deltaPct != null ? `(${r.deltaPct.toFixed(2)}%)` : ''}
            </TableCell>
            <TableCell className={`text-right font-mono ${r.deltaValueEst < 0 ? 'text-destructive' : ''}`}>
              ${Math.abs(r.deltaValueEst).toLocaleString()}
            </TableCell>
            <TableCell className="capitalize text-sm">{r.adjustmentType ?? '—'}</TableCell>
            <TableCell>{statusBadge(r.status)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);
