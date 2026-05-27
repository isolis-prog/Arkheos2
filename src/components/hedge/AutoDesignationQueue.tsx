import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, AlertCircle, FileEdit, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { DraftDesignation } from '@/hooks/useHedgeAutoDesignation';

interface Props {
  drafts: DraftDesignation[];
}

const statusStyles: Record<string, string> = {
  DRAFT: 'bg-warning/10 text-warning',
  REVIEWED: 'bg-info/10 text-info',
  DESIGNATED: 'bg-success/10 text-success',
};

const fmt = (v: number) => {
  if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `$${(v / 1e3).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
};

export const AutoDesignationQueue = ({ drafts }: Props) => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileEdit className="h-5 w-5" />
          Auto-Designation Queue
          <Badge variant="secondary" className="ml-auto text-xs">
            {drafts.filter(d => d.status === 'DRAFT').length} pending
          </Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Draft designations auto-generated from HEDGE trades in Trade Lifecycle
        </p>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Trade ID</TableHead>
                <TableHead>Instrument</TableHead>
                <TableHead>Hedged Item</TableHead>
                <TableHead>Risk / Type</TableHead>
                <TableHead className="text-right">Notional</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {drafts.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-mono font-medium text-sm">{d.tradeId}</TableCell>
                  <TableCell className="max-w-[200px] truncate text-sm">{d.instrumentDescription}</TableCell>
                  <TableCell className="max-w-[200px] truncate text-sm">
                    {d.hedgedItemDescription || <span className="text-muted-foreground italic">Not linked</span>}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Badge variant="outline" className="text-xs w-fit">{d.riskType}</Badge>
                      <Badge variant="secondary" className="text-xs w-fit">{d.hedgeType.replace('_', ' ')}</Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">{fmt(d.notionalAmount)}</TableCell>
                  <TableCell className="text-sm">{d.assignedTo}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(d.createdAt), { addSuffix: true })}
                  </TableCell>
                  <TableCell>
                    <Badge className={`text-xs ${statusStyles[d.status]}`}>{d.status}</Badge>
                  </TableCell>
                  <TableCell>
                    {d.status === 'DRAFT' && (
                      <Button variant="ghost" size="icon" title="Review & Designate">
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    )}
                    {d.status === 'REVIEWED' && (
                      <Button variant="ghost" size="icon" title="Approve Designation">
                        <CheckCircle className="h-4 w-4 text-success" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {drafts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    No draft designations pending
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
