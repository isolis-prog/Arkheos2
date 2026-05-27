import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import type { Confirmation } from '@/hooks/useConfirmationsRecon';

interface Props { confirmations: Confirmation[]; }

export const ReadyToInvoiceTable = ({ confirmations }: Props) => (
  <div className="space-y-3">
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-success" />
          Ready to Invoice ({confirmations.length})
        </h3>
        <p className="text-xs text-muted-foreground">Trades with confirmed or waived status — eligible for invoicing</p>
      </div>
      <Button variant="outline" size="sm" className="gap-1.5">
        <Download className="h-4 w-4" /> Export List
      </Button>
    </div>
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
            <TableHead>Delivery</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {confirmations.length === 0 ? (
            <TableRow><TableCell colSpan={8} className="text-center py-6 text-muted-foreground">No trades ready to invoice</TableCell></TableRow>
          ) : confirmations.map(c => (
            <TableRow key={c.id}>
              <TableCell className="font-mono text-xs">{c.confirmationId}</TableCell>
              <TableCell className="font-mono text-xs">{c.externalRef || '—'}</TableCell>
              <TableCell className="text-sm">{c.counterparty}</TableCell>
              <TableCell className="text-sm">{c.product}</TableCell>
              <TableCell><Badge variant={c.buySell === 'buy' ? 'default' : 'secondary'}>{c.buySell.toUpperCase()}</Badge></TableCell>
              <TableCell className="text-right font-mono text-sm">{c.quantity.toLocaleString()} {c.uom}</TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {format(new Date(c.deliveryStart), 'dd MMM')} – {format(new Date(c.deliveryEnd), 'dd MMM yy')}
              </TableCell>
              <TableCell>
                <Badge variant={c.status === 'matched' ? 'default' : 'secondary'} className="capitalize">
                  {c.status === 'matched' ? '✓ Matched' : '~ Waived'}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  </div>
);
