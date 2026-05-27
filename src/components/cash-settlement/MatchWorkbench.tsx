import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { Check, X, Split } from 'lucide-react';
import type { PaymentMatch } from '@/hooks/useCashSettlement';

const matchVariant = (t: string) => t === 'exact' ? 'success' as const : t === 'partial' ? 'warning' as const : 'info' as const;
const statusVariant = (s: string) => s === 'accepted' ? 'success' as const : s === 'rejected' ? 'error' as const : s === 'split' ? 'info' as const : 'warning' as const;
const excLabel: Record<string, string> = { unapplied_cash: 'Unapplied Cash', short_pay: 'Short Pay', duplicate_pay: 'Duplicate Pay', fx_mismatch: 'FX Mismatch', overpayment: 'Overpayment' };

interface Props { matches: PaymentMatch[]; }

export const MatchWorkbench = ({ matches }: Props) => (
  <div className="rounded-lg border border-border overflow-auto">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Bank Ref</TableHead>
          <TableHead>Invoice</TableHead>
          <TableHead>Counterparty</TableHead>
          <TableHead>Date</TableHead>
          <TableHead className="text-right">Bank Amt</TableHead>
          <TableHead className="text-right">Invoice Amt</TableHead>
          <TableHead className="text-right">Matched</TableHead>
          <TableHead>CCY</TableHead>
          <TableHead>Match</TableHead>
          <TableHead>Score</TableHead>
          <TableHead>Exception</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Owner</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {matches.map(m => (
          <TableRow key={m.id}>
            <TableCell className="font-mono text-xs">{m.bankTxnRef}</TableCell>
            <TableCell className="font-mono text-xs">{m.invoiceRef}</TableCell>
            <TableCell>{m.counterparty}</TableCell>
            <TableCell>{m.valueDate}</TableCell>
            <TableCell className="text-right font-mono">{m.bankAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
            <TableCell className="text-right font-mono">{m.invoiceAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
            <TableCell className="text-right font-mono">{m.matchedAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
            <TableCell>{m.currency}</TableCell>
            <TableCell><StatusBadge variant={matchVariant(m.matchType)}>{m.matchType}</StatusBadge></TableCell>
            <TableCell>{(m.matchScore * 100).toFixed(0)}%</TableCell>
            <TableCell>{m.exceptionType ? <StatusBadge variant="error">{excLabel[m.exceptionType] || m.exceptionType}</StatusBadge> : '—'}</TableCell>
            <TableCell><StatusBadge variant={statusVariant(m.status)}>{m.status}</StatusBadge></TableCell>
            <TableCell>{m.ownerRole}</TableCell>
            <TableCell>
              {m.status === 'proposed' && (
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" className="h-7 w-7" title="Accept"><Check className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7" title="Reject"><X className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7" title="Split"><Split className="h-4 w-4" /></Button>
                </div>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);
