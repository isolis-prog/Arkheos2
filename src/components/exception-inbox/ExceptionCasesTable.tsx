import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Badge } from '@/components/ui/badge';
import { format, isPast } from 'date-fns';
import type { ExceptionCase } from '@/hooks/useExceptionCases';

const severityVariant = (s: string) => s === 'critical' ? 'error' : s === 'high' ? 'warning' : s === 'medium' ? 'info' : 'muted';
const statusVariant = (s: string) => {
  const map: Record<string, 'error' | 'warning' | 'info' | 'success' | 'muted'> = {
    new: 'error', triaged: 'warning', in_progress: 'info', pending_counterparty: 'warning', resolved: 'success', waived: 'muted',
  };
  return map[s] || 'default';
};
const roleLabel: Record<string, string> = { fo: 'Front Office', mo: 'Middle Office', bo: 'Back Office', ops: 'Operations', treasury: 'Treasury' };

interface Props { cases: ExceptionCase[]; }

export const ExceptionCasesTable = ({ cases }: Props) => (
  <div className="rounded-lg border bg-card">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Case Ref</TableHead>
          <TableHead>Module</TableHead>
          <TableHead>Severity</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Owner</TableHead>
          <TableHead>Description</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          <TableHead>SLA</TableHead>
          <TableHead>Entities</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {cases.length === 0 ? (
          <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">No exception cases found</TableCell></TableRow>
        ) : cases.map(c => {
          const slaOverdue = c.slaDueAt && isPast(new Date(c.slaDueAt)) && !['resolved', 'waived'].includes(c.status);
          return (
            <TableRow key={c.id}>
              <TableCell className="font-mono text-xs font-medium">{c.caseRef}</TableCell>
              <TableCell><Badge variant="outline" className="capitalize">{c.module.replace('-', ' ')}</Badge></TableCell>
              <TableCell><StatusBadge variant={severityVariant(c.severity)}>{c.severity.toUpperCase()}</StatusBadge></TableCell>
              <TableCell><StatusBadge variant={statusVariant(c.status)}>{c.status.replace(/_/g, ' ')}</StatusBadge></TableCell>
              <TableCell>
                <div className="text-xs">
                  {c.ownerRole && <span className="text-muted-foreground">{roleLabel[c.ownerRole]}</span>}
                  {c.ownerUserName && <p className="font-medium">{c.ownerUserName}</p>}
                  {!c.ownerUserName && !c.ownerRole && <span className="text-muted-foreground">Unassigned</span>}
                </div>
              </TableCell>
              <TableCell className="max-w-[300px] truncate text-sm">{c.description}</TableCell>
              <TableCell className="text-right font-mono text-sm">
                {c.amount ? `${c.currency || '$'}${c.amount.toLocaleString()}` : '—'}
              </TableCell>
              <TableCell>
                {c.slaDueAt ? (
                  <span className={slaOverdue ? 'text-destructive font-medium text-xs' : 'text-xs text-muted-foreground'}>
                    {format(new Date(c.slaDueAt), 'dd MMM HH:mm')}
                    {slaOverdue && ' ⚠'}
                  </span>
                ) : '—'}
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {c.relatedEntities.slice(0, 2).map((e, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">{e.label}</Badge>
                  ))}
                  {c.relatedEntities.length > 2 && <Badge variant="secondary" className="text-xs">+{c.relatedEntities.length - 2}</Badge>}
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  </div>
);
