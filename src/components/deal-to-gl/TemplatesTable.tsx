import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { PostingExpectationTemplate } from '@/hooks/useDealToGL';

interface Props {
  templates: PostingExpectationTemplate[];
}

export const TemplatesTable = ({ templates }: Props) => (
  <div className="rounded-lg border bg-card">
    <Table>
      <TableHeader>
        <TableRow className="bg-muted/50">
          <TableHead>Trade Type</TableHead>
          <TableHead>Event Type</TableHead>
          <TableHead>Account</TableHead>
          <TableHead>Account Name</TableHead>
          <TableHead>D/C</TableHead>
          <TableHead>Amount Rule</TableHead>
          <TableHead>Active</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {templates.map(t => (
          <TableRow key={t.id}>
            <TableCell className="font-medium">{t.tradeType}</TableCell>
            <TableCell>{t.eventType}</TableCell>
            <TableCell className="font-mono">{t.accountCode}</TableCell>
            <TableCell className="text-sm">{t.accountName}</TableCell>
            <TableCell>
              <Badge variant={t.debitCredit === 'debit' ? 'outline' : 'secondary'}>{t.debitCredit.toUpperCase()}</Badge>
            </TableCell>
            <TableCell className="font-mono text-xs">{t.amountExpression}</TableCell>
            <TableCell>
              <Badge variant={t.isActive ? 'secondary' : 'outline'} className={t.isActive ? 'bg-green-500/15 text-green-700 border-green-300' : ''}>
                {t.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);
