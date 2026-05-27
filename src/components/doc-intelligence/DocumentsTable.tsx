import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, FileText } from 'lucide-react';
import type { DocRecord } from '@/hooks/useDocumentIntelligence';

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'outline',
  processing: 'secondary',
  extracted: 'default',
  failed: 'destructive',
};

const typeLabels: Record<string, string> = {
  isda: 'ISDA',
  confirmation: 'Confirmation',
  msa: 'MSA',
  charter_party: 'Charter Party',
  terminal_agreement: 'Terminal Agmt',
  iso_statement: 'ISO Statement',
};

export const DocumentsTable = ({ documents }: { documents: DocRecord[] }) => (
  <div className="rounded-lg border bg-card">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Document</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Counterparty</TableHead>
          <TableHead>Deal</TableHead>
          <TableHead className="text-center">Pages</TableHead>
          <TableHead className="text-center">Confidence</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {documents.map(doc => (
          <TableRow key={doc.id}>
            <TableCell>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm">{doc.fileName}</p>
                  <p className="text-xs text-muted-foreground">{doc.id}</p>
                </div>
              </div>
            </TableCell>
            <TableCell><Badge variant="outline">{typeLabels[doc.docType] || doc.docType}</Badge></TableCell>
            <TableCell>{doc.counterparty || '—'}</TableCell>
            <TableCell className="font-mono text-xs">{doc.dealId || '—'}</TableCell>
            <TableCell className="text-center">{doc.pageCount}</TableCell>
            <TableCell className="text-center">{Math.round(doc.classificationConfidence * 100)}%</TableCell>
            <TableCell><Badge variant={statusVariant[doc.status]}>{doc.status}</Badge></TableCell>
            <TableCell className="text-right">
              <Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);
