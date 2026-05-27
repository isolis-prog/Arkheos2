import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Circle } from 'lucide-react';
import type { DocExtraction } from '@/hooks/useDocumentIntelligence';

export const ExtractionsPanel = ({ extractions }: { extractions: DocExtraction[] }) => (
  <div className="rounded-lg border bg-card">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Document</TableHead>
          <TableHead>Field</TableHead>
          <TableHead>Extracted Value</TableHead>
          <TableHead className="text-center">Page</TableHead>
          <TableHead className="text-center">Confidence</TableHead>
          <TableHead>Method</TableHead>
          <TableHead className="text-center">Verified</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {extractions.map(ex => (
          <TableRow key={ex.id}>
            <TableCell className="font-mono text-xs">{ex.documentId}</TableCell>
            <TableCell className="font-medium">{ex.fieldName}</TableCell>
            <TableCell>{ex.fieldValue}</TableCell>
            <TableCell className="text-center">{ex.pageNumber}</TableCell>
            <TableCell className="text-center">
              <Badge variant={ex.confidence >= 0.95 ? 'default' : ex.confidence >= 0.9 ? 'secondary' : 'outline'}>
                {Math.round(ex.confidence * 100)}%
              </Badge>
            </TableCell>
            <TableCell><Badge variant="outline">{ex.extractionMethod.toUpperCase()}</Badge></TableCell>
            <TableCell className="text-center">
              {ex.verified
                ? <CheckCircle className="h-4 w-4 text-success mx-auto" />
                : <Circle className="h-4 w-4 text-muted-foreground mx-auto" />}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);
