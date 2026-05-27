import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { ConfirmationMatch } from '@/hooks/useConfirmationsRecon';

const statusVariant = (s: string) => {
  const map: Record<string, 'success' | 'warning' | 'error' | 'info' | 'muted'> = {
    auto_matched: 'success', approved: 'success', pending_review: 'warning', rejected: 'error', waived: 'muted',
  };
  return map[s] || 'default';
};

const exceptionLabel: Record<string, string> = {
  price_mismatch: 'Price/Index',
  qty_mismatch: 'Quantity',
  location_mismatch: 'Location',
  fee_mismatch: 'Fee',
  amendment_mismatch: 'Amendment',
  missing_confirmation: 'Missing Conf',
  missing_trade: 'Missing Trade',
  date_mismatch: 'Date',
};

interface Props {
  matches: ConfirmationMatch[];
  onSelect: (id: string) => void;
}

export const MatchResultsTable = ({ matches, onSelect }: Props) => (
  <div className="rounded-lg border bg-card">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Confirmation</TableHead>
          <TableHead>ETRM Trade</TableHead>
          <TableHead>Match Type</TableHead>
          <TableHead>Score</TableHead>
          <TableHead>Differences</TableHead>
          <TableHead>Exception</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Explain</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {matches.length === 0 ? (
          <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">No match results</TableCell></TableRow>
        ) : matches.map(m => (
          <TableRow key={m.id}>
            <TableCell className="font-mono text-xs">{m.confirmationRef}</TableCell>
            <TableCell className="font-mono text-xs">{m.etrmTradeId}</TableCell>
            <TableCell><Badge variant="outline" className="capitalize">{m.matchType}</Badge></TableCell>
            <TableCell>
              <span className={m.matchScore >= 0.9 ? 'text-success font-medium' : m.matchScore >= 0.7 ? 'text-warning font-medium' : 'text-destructive font-medium'}>
                {Math.round(m.matchScore * 100)}%
              </span>
            </TableCell>
            <TableCell>
              <div className="flex flex-wrap gap-1">
                {m.differences.length === 0 ? (
                  <span className="text-xs text-muted-foreground">None</span>
                ) : m.differences.map((d, i) => (
                  <Badge key={i} variant={d.withinTolerance ? 'secondary' : 'destructive'} className="text-xs">
                    {d.field}
                  </Badge>
                ))}
              </div>
            </TableCell>
            <TableCell>
              {m.exceptionType ? (
                <StatusBadge variant="error">{exceptionLabel[m.exceptionType] || m.exceptionType}</StatusBadge>
              ) : <span className="text-xs text-muted-foreground">—</span>}
            </TableCell>
            <TableCell><StatusBadge variant={statusVariant(m.status)}>{m.status.replace(/_/g, ' ')}</StatusBadge></TableCell>
            <TableCell>
              <Tooltip>
                <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7"><Info className="h-4 w-4" /></Button></TooltipTrigger>
                <TooltipContent side="left" className="max-w-xs">
                  <div className="text-xs space-y-1">
                    {m.explain.hits.map((h, i) => <p key={i}>• {h}</p>)}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TableCell>
            <TableCell>
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => onSelect(m.id)}>
                <Eye className="h-3.5 w-3.5 mr-1" /> Diff View
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);
