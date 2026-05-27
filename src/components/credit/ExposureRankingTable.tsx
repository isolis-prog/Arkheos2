import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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

export const ExposureRankingTable = ({ snapshots, onSelect }: Props) => {
  const sorted = [...snapshots].sort((a, b) => b.netExposure - a.netExposure);

  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead>#</TableHead>
            <TableHead>Counterparty</TableHead>
            <TableHead className="text-right">MTM</TableHead>
            <TableHead className="text-right">AR</TableHead>
            <TableHead className="text-right">AP</TableHead>
            <TableHead className="text-right">Collateral</TableHead>
            <TableHead className="text-right">Net Exposure</TableHead>
            <TableHead className="text-right">Limit</TableHead>
            <TableHead>Utilisation</TableHead>
            <TableHead className="text-right">DSO</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((s, i) => {
            const util = s.utilisationPct || 0;
            const isBreach = util > 100;
            const isWarning = util >= 80 && util <= 100;
            return (
              <TableRow key={s.id} className="cursor-pointer hover:bg-muted/30" onClick={() => onSelect(s)}>
                <TableCell className="font-mono text-muted-foreground">{i + 1}</TableCell>
                <TableCell className="font-medium">{s.counterparty}</TableCell>
                <TableCell className="text-right font-mono">{fmt(s.mtmExposure)}</TableCell>
                <TableCell className="text-right font-mono">{fmt(s.arOutstanding)}</TableCell>
                <TableCell className="text-right font-mono text-green-600">({fmt(s.apOutstanding)})</TableCell>
                <TableCell className="text-right font-mono text-green-600">({fmt(s.collateralOffset)})</TableCell>
                <TableCell className="text-right font-mono font-semibold">{fmt(s.netExposure)}</TableCell>
                <TableCell className="text-right font-mono">{s.limitAmount ? fmt(s.limitAmount) : '—'}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 min-w-[120px]">
                    <Progress value={Math.min(util, 100)} className={`h-2 ${isBreach ? '[&>div]:bg-destructive' : isWarning ? '[&>div]:bg-yellow-500' : ''}`} />
                    <span className={`text-xs font-mono ${isBreach ? 'text-destructive font-bold' : isWarning ? 'text-yellow-600' : 'text-muted-foreground'}`}>{util}%</span>
                  </div>
                </TableCell>
                <TableCell className="text-right font-mono">{s.dsoDays ?? '—'}d</TableCell>
                <TableCell>
                  {isBreach ? <Badge variant="destructive">Breach</Badge> :
                   isWarning ? <Badge className="bg-yellow-500/15 text-yellow-700 border-yellow-300">Warning</Badge> :
                   <Badge variant="secondary">OK</Badge>}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
