import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/ui/status-badge';
import { format } from 'date-fns';
import type { MDMCoverageIssue } from '@/hooks/useMDMGovernance';

const sevVariant = (s: string) => s === 'critical' ? 'error' as const : s === 'high' ? 'warning' as const : s === 'medium' ? 'info' as const : 'muted' as const;
const catLabel: Record<string, string> = { gl_mapping: 'GL Mapping', tax_code: 'Tax Code', payment_terms: 'Payment Terms', location_alias: 'Location Alias' };

interface Props { issues: MDMCoverageIssue[]; }

export const IssuesTable = ({ issues }: Props) => (
  <div className="rounded-lg border border-border overflow-auto">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Category</TableHead>
          <TableHead>Entity</TableHead>
          <TableHead>Severity</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Impacted Trades</TableHead>
          <TableHead>Amount at Risk</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Created</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {issues.map(i => (
          <TableRow key={i.id}>
            <TableCell><StatusBadge variant="default">{catLabel[i.category] || i.category}</StatusBadge></TableCell>
            <TableCell className="font-medium">{i.entityName}</TableCell>
            <TableCell><StatusBadge variant={sevVariant(i.severity)}>{i.severity}</StatusBadge></TableCell>
            <TableCell className="max-w-[300px] truncate">{i.issueDescription}</TableCell>
            <TableCell>{i.impactedTrades}</TableCell>
            <TableCell>${i.impactedAmount.toLocaleString()}</TableCell>
            <TableCell><StatusBadge variant={i.status === 'resolved' ? 'success' : i.status === 'in_progress' ? 'warning' : 'error'}>{i.status.replace('_', ' ')}</StatusBadge></TableCell>
            <TableCell>{format(new Date(i.createdAt), 'MMM dd')}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);
