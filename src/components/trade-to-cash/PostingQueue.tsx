import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle2, XCircle, RotateCcw, Send } from 'lucide-react';
import { T2CDocument } from '@/hooks/useTradeToCash';
import { format } from 'date-fns';
import { useState } from 'react';

interface Props {
  documents: T2CDocument[];
  title?: string;
}

const docStatusVariant: Record<string, 'success' | 'warning' | 'error' | 'info' | 'muted'> = {
  posted: 'success', validated: 'info', pending: 'muted', failed: 'error', reversed: 'warning', cancelled: 'muted',
};

export const PostingQueue = ({ documents, title = 'Posting Queue' }: Props) => {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected(prev => prev.size === documents.length ? new Set() : new Set(documents.map(d => d.id)));
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      {selected.size > 0 && (
        <div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-3">
          <span className="text-sm font-medium">{selected.size} selected</span>
          <Button size="sm" variant="default"><Send className="h-3.5 w-3.5 mr-1" />Approve & Post</Button>
          <Button size="sm" variant="outline"><XCircle className="h-3.5 w-3.5 mr-1" />Reject</Button>
          <Button size="sm" variant="outline"><RotateCcw className="h-3.5 w-3.5 mr-1" />Reverse</Button>
        </div>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"><Checkbox checked={selected.size === documents.length && documents.length > 0} onCheckedChange={toggleAll} /></TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Source ID</TableHead>
                <TableHead>ERP ID</TableHead>
                <TableHead>Counterparty</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Currency</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Posting Date</TableHead>
                <TableHead>Errors</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.length === 0 ? (
                <TableRow><TableCell colSpan={11} className="text-center py-8 text-muted-foreground">No documents in queue</TableCell></TableRow>
              ) : documents.map(doc => (
                <TableRow key={doc.id}>
                  <TableCell><Checkbox checked={selected.has(doc.id)} onCheckedChange={() => toggleSelect(doc.id)} /></TableCell>
                  <TableCell><Badge variant="outline" className="capitalize text-xs">{doc.doc_type.replace(/_/g, ' ')}</Badge></TableCell>
                  <TableCell className="font-mono text-sm">{doc.source_id}</TableCell>
                  <TableCell className="font-mono text-sm">{doc.erp_id || '—'}</TableCell>
                  <TableCell className="text-sm">{doc.counterparty}</TableCell>
                  <TableCell className="text-sm">{doc.legal_entity}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{doc.amount.toLocaleString()}</TableCell>
                  <TableCell><Badge variant="secondary" className="text-xs">{doc.currency}</Badge></TableCell>
                  <TableCell><StatusBadge variant={docStatusVariant[doc.status] || 'muted'}>{doc.status}</StatusBadge></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{doc.posting_date}</TableCell>
                  <TableCell>{doc.validation_errors ? <Badge variant="destructive" className="text-xs">{doc.validation_errors.length}</Badge> : '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </motion.div>
  );
};
