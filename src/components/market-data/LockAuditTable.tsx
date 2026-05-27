import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Lock, Unlock } from 'lucide-react';
import { format } from 'date-fns';
import type { LockAuditEntry } from '@/hooks/useMarketData';

interface Props {
  entries: LockAuditEntry[];
}

export const LockAuditTable = ({ entries }: Props) => (
  <div className="rounded-md border overflow-auto">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Action</TableHead>
          <TableHead>Curve</TableHead>
          <TableHead>Period</TableHead>
          <TableHead>Points</TableHead>
          <TableHead>Performed By</TableHead>
          <TableHead>Timestamp</TableHead>
          <TableHead>Reason</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.map((e) => (
          <TableRow key={e.id}>
            <TableCell>
              <Badge variant={e.action === 'lock' ? 'default' : 'outline'} className="text-xs gap-1">
                {e.action === 'lock' ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                {e.action === 'lock' ? 'Locked' : 'Unlocked'}
              </Badge>
            </TableCell>
            <TableCell className="font-medium">{e.curveName}</TableCell>
            <TableCell className="text-sm">
              {format(new Date(e.periodStart), 'dd MMM')} – {format(new Date(e.periodEnd), 'dd MMM yyyy')}
            </TableCell>
            <TableCell className="text-center">{e.pointsAffected}</TableCell>
            <TableCell className="text-sm">{e.performedBy}</TableCell>
            <TableCell className="text-xs text-muted-foreground">{format(new Date(e.performedAt), 'dd MMM yyyy HH:mm')}</TableCell>
            <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">{e.reason ?? '—'}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);
