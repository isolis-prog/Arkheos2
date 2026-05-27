import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/ui/status-badge';
import type { BankTxn } from '@/hooks/useCashSettlement';

interface Props { txns: BankTxn[]; }

export const UnmatchedTxnsTable = ({ txns }: Props) => (
  <Card>
    <CardHeader><CardTitle>Unmatched Bank Transactions ({txns.length})</CardTitle></CardHeader>
    <CardContent>
      <div className="overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Bank Txn ID</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>CCY</TableHead>
              <TableHead>Counterparty</TableHead>
              <TableHead>Remittance</TableHead>
              <TableHead>Account</TableHead>
              <TableHead>Format</TableHead>
              <TableHead>Direction</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {txns.map(t => (
              <TableRow key={t.id}>
                <TableCell className="font-mono text-xs">{t.bankTxnId}</TableCell>
                <TableCell>{t.valueDate}</TableCell>
                <TableCell className="text-right font-mono">{t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                <TableCell>{t.currency}</TableCell>
                <TableCell>{t.counterpartyText}</TableCell>
                <TableCell className="max-w-[200px] truncate">{t.remittanceText}</TableCell>
                <TableCell>{t.bankAccount}</TableCell>
                <TableCell><StatusBadge variant="default">{t.statementFormat}</StatusBadge></TableCell>
                <TableCell className="capitalize">{t.direction}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </CardContent>
  </Card>
);
