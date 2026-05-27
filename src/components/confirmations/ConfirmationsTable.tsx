import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import type { Confirmation } from '@/hooks/useConfirmationsRecon';

const statusVariant = (s: string) => {
  const map: Record<string, 'success' | 'warning' | 'error' | 'info' | 'muted'> = {
    matched: 'success', partial: 'warning', unmatched: 'error', pending: 'info', disputed: 'error', waived: 'muted',
  };
  return map[s] || 'default';
};

interface Props { confirmations: Confirmation[]; }

export const ConfirmationsTable = ({ confirmations }: Props) => (
  <div className="rounded-lg border bg-card">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Confirmation ID</TableHead>
          <TableHead>ETRM Ref</TableHead>
          <TableHead>Counterparty</TableHead>
          <TableHead>Product</TableHead>
          <TableHead>B/S</TableHead>
          <TableHead className="text-right">Qty</TableHead>
          <TableHead>Price</TableHead>
          <TableHead>Delivery</TableHead>
          <TableHead>Location</TableHead>
          <TableHead>Ver</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {confirmations.length === 0 ? (
          <TableRow><TableCell colSpan={11} className="text-center py-8 text-muted-foreground">No confirmations found</TableCell></TableRow>
        ) : confirmations.map(c => (
          <TableRow key={c.id}>
            <TableCell className="font-mono text-xs font-medium">{c.confirmationId}</TableCell>
            <TableCell className="font-mono text-xs">{c.externalRef || <span className="text-muted-foreground">—</span>}</TableCell>
            <TableCell className="text-sm">{c.counterparty}</TableCell>
            <TableCell className="text-sm">{c.product}</TableCell>
            <TableCell><Badge variant={c.buySell === 'buy' ? 'default' : 'secondary'}>{c.buySell.toUpperCase()}</Badge></TableCell>
            <TableCell className="text-right font-mono text-sm">{c.quantity.toLocaleString()} {c.uom}</TableCell>
            <TableCell className="text-sm">
              {c.priceType === 'fixed' ? `$${c.priceValue?.toFixed(2)}` : c.priceType === 'index' ? c.indexName : 'Formula'}
            </TableCell>
            <TableCell className="text-xs text-muted-foreground">
              {format(new Date(c.deliveryStart), 'dd MMM')} – {format(new Date(c.deliveryEnd), 'dd MMM yy')}
            </TableCell>
            <TableCell className="text-sm">{c.location}</TableCell>
            <TableCell className="text-center"><Badge variant="outline">v{c.version}</Badge></TableCell>
            <TableCell><StatusBadge variant={statusVariant(c.status)}>{c.status}</StatusBadge></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);
