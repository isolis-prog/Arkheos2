import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, PauseCircle } from 'lucide-react';
import type { ExposureSnapshot } from '@/hooks/useCreditExposure';

interface Props {
  snapshots: ExposureSnapshot[];
  onSelect: (s: ExposureSnapshot) => void;
}

const fmt = (n: number) => {
  if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (Math.abs(n) >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
};

const tlColor: Record<string, string> = {
  green: 'bg-emerald-500',
  amber: 'bg-yellow-500',
  red: 'bg-destructive',
};

export const ControlTowerTable = ({ snapshots, onSelect }: Props) => {
  const sorted = [...snapshots].sort((a, b) => {
    const order = { red: 0, amber: 1, green: 2 };
    return (order[a.trafficLight] ?? 2) - (order[b.trafficLight] ?? 2) || b.netExposure - a.netExposure;
  });

  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-10"></TableHead>
            <TableHead>Counterparty</TableHead>
            <TableHead className="text-right">Net Exposure</TableHead>
            <TableHead>Utilisation</TableHead>
            <TableHead className="text-right">AR Overdue</TableHead>
            <TableHead className="text-right">Disputes</TableHead>
            <TableHead className="text-right">DSO</TableHead>
            <TableHead>Flags</TableHead>
            <TableHead>Owner</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((s) => {
            const util = s.utilisationPct || 0;
            return (
              <TableRow key={s.id} className="cursor-pointer hover:bg-muted/30" onClick={() => onSelect(s)}>
                <TableCell>
                  <span className={`inline-block h-3 w-3 rounded-full ${tlColor[s.trafficLight]}`} title={s.trafficLight} />
                </TableCell>
                <TableCell className="font-medium">{s.counterparty}</TableCell>
                <TableCell className="text-right font-mono font-semibold">{fmt(s.netExposure)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 min-w-[100px]">
                    <Progress value={Math.min(util, 100)} className={`h-2 ${util > 100 ? '[&>div]:bg-destructive' : util >= 80 ? '[&>div]:bg-yellow-500' : ''}`} />
                    <span className="text-xs font-mono">{util}%</span>
                  </div>
                </TableCell>
                <TableCell className="text-right font-mono">{fmt(s.arOverdue)}</TableCell>
                <TableCell className="text-right font-mono">{s.disputeAmount > 0 ? fmt(s.disputeAmount) : '—'}</TableCell>
                <TableCell className="text-right font-mono">{s.dsoDays ?? '—'}d</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {s.paymentHold && <PauseCircle className="h-4 w-4 text-destructive" />}
                    {s.disputeAmount > 500000 && <AlertTriangle className="h-4 w-4 text-yellow-600" />}
                  </div>
                </TableCell>
                <TableCell><Badge variant="outline" className="text-[10px]">{s.ownerRole}</Badge></TableCell>
                <TableCell className="max-w-[200px]">
                  {s.recommendedAction ? (
                    <span className="text-xs text-muted-foreground truncate block">{s.recommendedAction}</span>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
