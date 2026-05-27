import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { PostingRecon } from '@/hooks/useDealToGL';

interface Props {
  recons: PostingRecon[];
}

const fmt = (n: number) => {
  if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (Math.abs(n) >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
};

const statusBadge = (s: string) => {
  if (s === 'complete') return <Badge variant="secondary" className="bg-green-500/15 text-green-700 border-green-300">Complete</Badge>;
  if (s === 'exception') return <Badge variant="destructive">Exception</Badge>;
  return <Badge variant="outline">Open</Badge>;
};

export const ReconMatrixTable = ({ recons }: Props) => {
  const sorted = [...recons].sort((a, b) => a.completenessPct - b.completenessPct);

  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead>Entity</TableHead>
            <TableHead>Account</TableHead>
            <TableHead>Period</TableHead>
            <TableHead className="text-right">Expected</TableHead>
            <TableHead className="text-right">Actual</TableHead>
            <TableHead className="text-right">Δ</TableHead>
            <TableHead className="text-center">Matched</TableHead>
            <TableHead className="text-center">Missing</TableHead>
            <TableHead className="text-center">Exceptions</TableHead>
            <TableHead>Completeness</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map(r => {
            const pct = r.completenessPct;
            return (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.legalEntity}</TableCell>
                <TableCell className="font-mono text-sm">{r.accountCode}</TableCell>
                <TableCell>{r.periodName}</TableCell>
                <TableCell className="text-right font-mono">{fmt(r.totalExpected)}</TableCell>
                <TableCell className="text-right font-mono">{fmt(r.totalActual)}</TableCell>
                <TableCell className={`text-right font-mono ${r.delta !== 0 ? 'text-destructive font-semibold' : ''}`}>{r.delta !== 0 ? fmt(r.delta) : '—'}</TableCell>
                <TableCell className="text-center">{r.matchedCount}/{r.expectedCount}</TableCell>
                <TableCell className={`text-center ${r.missingCount > 0 ? 'text-destructive font-semibold' : ''}`}>{r.missingCount}</TableCell>
                <TableCell className={`text-center ${r.exceptionCount > 0 ? 'text-yellow-600 font-semibold' : ''}`}>{r.exceptionCount}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 min-w-[100px]">
                    <Progress value={pct} className={`h-2 ${pct < 80 ? '[&>div]:bg-destructive' : pct < 95 ? '[&>div]:bg-yellow-500' : ''}`} />
                    <span className="text-xs font-mono">{pct}%</span>
                  </div>
                </TableCell>
                <TableCell>{statusBadge(r.status)}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
