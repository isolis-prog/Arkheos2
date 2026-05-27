import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Eye, Lock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { MarketCurve } from '@/hooks/useMarketData';

interface Props {
  curves: MarketCurve[];
  onSelectCurve: (id: string) => void;
}

const sourceLabel: Record<string, string> = {
  vendor_feed: 'Vendor',
  exchange: 'Exchange',
  etrm_extract: 'ETRM',
  broker_quote: 'Broker',
  manual_lock: 'Manual',
};

export const CurvesTable = ({ curves, onSelectCurve }: Props) => (
  <div className="rounded-md border overflow-auto">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Curve</TableHead>
          <TableHead>Commodity</TableHead>
          <TableHead>Location</TableHead>
          <TableHead>Source</TableHead>
          <TableHead>Lock Progress</TableHead>
          <TableHead className="text-center">Exceptions</TableHead>
          <TableHead>Last Updated</TableHead>
          <TableHead className="w-10" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {curves.map((c) => {
          const lockPct = c.pointCount > 0 ? (c.lockedCount / c.pointCount) * 100 : 0;
          return (
            <TableRow key={c.id} className="cursor-pointer hover:bg-muted/50" onClick={() => onSelectCurve(c.id)}>
              <TableCell className="font-medium">{c.name}</TableCell>
              <TableCell><Badge variant="outline">{c.commodity}</Badge></TableCell>
              <TableCell className="text-muted-foreground">{c.location ?? '—'}</TableCell>
              <TableCell><Badge variant="secondary" className="text-xs">{sourceLabel[c.source]}</Badge></TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Progress value={lockPct} className="w-24 h-2" />
                  <span className="text-xs text-muted-foreground">{Math.round(lockPct)}%</span>
                  {lockPct === 100 && <Lock className="h-3 w-3 text-success" />}
                </div>
              </TableCell>
              <TableCell className="text-center">
                {c.exceptionCount > 0 ? (
                  <Badge variant="destructive" className="text-xs">{c.exceptionCount}</Badge>
                ) : (
                  <span className="text-xs text-muted-foreground">0</span>
                )}
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(c.lastUpdated), { addSuffix: true })}</TableCell>
              <TableCell>
                <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onSelectCurve(c.id); }}>
                  <Eye className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  </div>
);
