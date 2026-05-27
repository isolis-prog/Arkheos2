import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import type { NominationLine } from '@/hooks/useScheduling';

interface Props {
  nominations: NominationLine[];
  onSelect: (id: string) => void;
  selectedId: string | null;
}

const reconBadge = (status: string) => {
  const map: Record<string, { variant: 'default' | 'destructive' | 'secondary' | 'outline'; label: string }> = {
    matched: { variant: 'default', label: 'Matched' },
    break: { variant: 'destructive', label: 'Break' },
    pending: { variant: 'secondary', label: 'Pending' },
    partial: { variant: 'outline', label: 'Partial' },
  };
  const cfg = map[status] ?? map.pending;
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
};

const statusBadge = (status: string) => {
  const colors: Record<string, string> = {
    confirmed: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    submitted: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    revised: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    cancelled: 'bg-red-500/10 text-red-600 border-red-500/20',
    draft: 'bg-muted text-muted-foreground',
    expired: 'bg-muted text-muted-foreground',
  };
  return <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${colors[status] ?? ''}`}>{status}</span>;
};

export const NominationsTableView = ({ nominations, onSelect, selectedId }: Props) => (
  <div className="rounded-lg border bg-card">
    <Table>
      <TableHeader>
        <TableRow className="bg-muted/50 hover:bg-muted/50">
          <TableHead className="font-semibold">Deal</TableHead>
          <TableHead className="font-semibold">Counterparty</TableHead>
          <TableHead className="font-semibold">Commodity</TableHead>
          <TableHead className="font-semibold">Location</TableHead>
          <TableHead className="font-semibold">Window</TableHead>
          <TableHead className="font-semibold text-right">Qty</TableHead>
          <TableHead className="font-semibold">UoM</TableHead>
          <TableHead className="font-semibold">Status</TableHead>
          <TableHead className="font-semibold">Rev</TableHead>
          <TableHead className="font-semibold">Recon</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {nominations.length === 0 ? (
          <TableRow><TableCell colSpan={10} className="h-32 text-center text-muted-foreground">No nominations found</TableCell></TableRow>
        ) : nominations.map((n) => (
          <TableRow
            key={n.id}
            className={`cursor-pointer hover:bg-muted/50 ${selectedId === n.id ? 'bg-primary/5' : ''}`}
            onClick={() => onSelect(n.id)}
          >
            <TableCell className="font-mono text-sm">{n.dealId}</TableCell>
            <TableCell>{n.counterparty}</TableCell>
            <TableCell>{n.commodity}</TableCell>
            <TableCell className="max-w-[150px] truncate">{n.location}</TableCell>
            <TableCell className="text-sm whitespace-nowrap">
              {format(new Date(n.startDt), 'dd MMM')} – {format(new Date(n.endDt), 'dd MMM')}
            </TableCell>
            <TableCell className="text-right font-mono">{n.qty.toLocaleString()}</TableCell>
            <TableCell className="text-muted-foreground">{n.uom}</TableCell>
            <TableCell>{statusBadge(n.status)}</TableCell>
            <TableCell className="text-center text-muted-foreground">v{n.revisionNo}</TableCell>
            <TableCell>{reconBadge(n.reconStatus)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);
