import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { IntercompanyPair } from '@/hooks/useIntercompany';

interface Props {
  pairs: IntercompanyPair[];
}

const fmt = (n: number) => {
  if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (Math.abs(n) >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
};

const statusBadge = (s: string) => {
  const map: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string; className?: string }> = {
    matched: { variant: 'secondary', label: 'Matched', className: 'bg-green-500/15 text-green-700 border-green-300' },
    partial: { variant: 'outline', label: 'Partial', className: 'bg-yellow-500/15 text-yellow-700 border-yellow-300' },
    break: { variant: 'destructive', label: 'Break' },
    unmatched: { variant: 'outline', label: 'Unmatched' },
  };
  const cfg = map[s] || map.unmatched;
  return <Badge variant={cfg.variant} className={cfg.className}>{cfg.label}</Badge>;
};

const typeBadge = (t: string) => <Badge variant="outline" className="text-xs">{t.replace('_', ' ')}</Badge>;

export const ICPairsTable = ({ pairs }: Props) => {
  const limited = pairs.slice(0, 80);
  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead>Entity A</TableHead>
            <TableHead>Entity B</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Ref A</TableHead>
            <TableHead>Ref B</TableHead>
            <TableHead className="text-right">Amount A</TableHead>
            <TableHead className="text-right">Amount B</TableHead>
            <TableHead className="text-right">Δ</TableHead>
            <TableHead className="text-right">FX Δ</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {limited.map(p => (
            <TableRow key={p.id}>
              <TableCell className="font-medium">{p.entityA}</TableCell>
              <TableCell className="font-medium">{p.entityB}</TableCell>
              <TableCell>{typeBadge(p.pairType)}</TableCell>
              <TableCell className="font-mono text-sm">{p.refA}</TableCell>
              <TableCell className="font-mono text-sm">{p.refB || '—'}</TableCell>
              <TableCell className="text-right font-mono">{fmt(p.amountA)}</TableCell>
              <TableCell className="text-right font-mono">{p.amountB != null ? fmt(p.amountB) : '—'}</TableCell>
              <TableCell className={`text-right font-mono ${p.delta && Math.abs(p.delta) > 0 ? 'text-destructive font-semibold' : ''}`}>
                {p.delta != null ? fmt(p.delta) : '—'}
              </TableCell>
              <TableCell className={`text-right font-mono ${p.fxDelta ? 'text-yellow-600' : ''}`}>
                {p.fxDelta != null ? fmt(p.fxDelta) : '—'}
              </TableCell>
              <TableCell>{statusBadge(p.matchStatus)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {pairs.length > 80 && (
        <div className="p-3 text-center text-sm text-muted-foreground border-t">Showing 80 of {pairs.length}. Use filters.</div>
      )}
    </div>
  );
};
