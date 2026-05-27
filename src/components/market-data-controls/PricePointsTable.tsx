import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Lock, PenLine, AlertTriangle } from 'lucide-react';
import type { PricePoint } from '@/hooks/useMarketDataControls';

interface Props { points: PricePoint[]; }

export const PricePointsTable = ({ points }: Props) => (
  <div className="rounded-lg border border-border overflow-auto">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Index</TableHead>
          <TableHead>Tenor</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Source</TableHead>
          <TableHead className="text-right">Vendor</TableHead>
          <TableHead className="text-right">ETRM</TableHead>
          <TableHead className="text-right">Diff</TableHead>
          <TableHead className="text-right">Diff %</TableHead>
          <TableHead>Tolerance</TableHead>
          <TableHead>Flags</TableHead>
          <TableHead>Version</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {points.map(p => (
          <TableRow key={p.id}>
            <TableCell className="font-medium">{p.indexName}</TableCell>
            <TableCell>{p.tenor}</TableCell>
            <TableCell>{p.priceDate}</TableCell>
            <TableCell>{p.sourceVendor}</TableCell>
            <TableCell className="text-right font-mono">{p.vendorPrice.toFixed(4)}</TableCell>
            <TableCell className="text-right font-mono">{p.etrmPrice.toFixed(4)}</TableCell>
            <TableCell className="text-right font-mono">
              <span className={!p.withinTolerance ? 'text-destructive font-semibold' : ''}>{p.diff > 0 ? '+' : ''}{p.diff.toFixed(4)}</span>
            </TableCell>
            <TableCell className="text-right">{p.diffPct.toFixed(2)}%</TableCell>
            <TableCell>
              <StatusBadge variant={p.withinTolerance ? 'success' : 'error'}>{p.withinTolerance ? 'OK' : 'BREACH'}</StatusBadge>
            </TableCell>
            <TableCell>
              <div className="flex gap-1">
                {p.isStale && <StatusBadge variant="warning">Stale</StatusBadge>}
                {p.isSpike && <span className="text-destructive"><AlertTriangle className="h-4 w-4" /></span>}
                {p.isOverridden && <span className="text-primary"><PenLine className="h-4 w-4" /></span>}
                {p.isFrozen && <span className="text-muted-foreground"><Lock className="h-4 w-4" /></span>}
              </div>
            </TableCell>
            <TableCell>v{p.snapshotVersion}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);
