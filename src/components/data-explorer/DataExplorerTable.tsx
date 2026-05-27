import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { CanonicalRecord } from '@/hooks/useDataExplorer';
import { cn } from '@/lib/utils';

interface DataExplorerTableProps {
  records: CanonicalRecord[];
  isLoading: boolean;
}

const PAGE_SIZE = 25;

export const DataExplorerTable = ({ records, isLoading }: DataExplorerTableProps) => {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(records.length / PAGE_SIZE);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginatedRecords = records.slice(startIndex, startIndex + PAGE_SIZE);

  const formatCurrency = (amount: number | null, currency: string | null) => {
    if (amount === null) return '—';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (date: string | null) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="font-semibold">Source</TableHead>
              <TableHead className="font-semibold">Deal ID</TableHead>
              <TableHead className="font-semibold">Match Key</TableHead>
              <TableHead className="font-semibold">Fee Type</TableHead>
              <TableHead className="font-semibold">Strategy</TableHead>
              <TableHead className="font-semibold">Counterparty</TableHead>
              <TableHead className="font-semibold">Legal Entity</TableHead>
              <TableHead className="font-semibold text-right">Amount</TableHead>
              <TableHead className="font-semibold">Economic Date</TableHead>
              <TableHead className="font-semibold">Doc/Line ID</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedRecords.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="h-32 text-center text-muted-foreground">
                  No records found matching your filters
                </TableCell>
              </TableRow>
            ) : (
              paginatedRecords.map((record) => (
                <TableRow key={record.id} className="hover:bg-muted/50">
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(
                        record.sourceSystem === 'etrm'
                          ? 'border-blue-500/30 bg-blue-500/10 text-blue-600'
                          : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600'
                      )}
                    >
                      {record.sourceSystem.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{record.dealId || '—'}</TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">
                    {record.matchKey || '—'}
                  </TableCell>
                  <TableCell>{record.feeType || '—'}</TableCell>
                  <TableCell>{record.strategy || '—'}</TableCell>
                  <TableCell>{record.counterparty || '—'}</TableCell>
                  <TableCell>{record.legalEntity || '—'}</TableCell>
                  <TableCell
                    className={cn(
                      'text-right font-medium tabular-nums',
                      record.amount && record.amount < 0 ? 'text-destructive' : ''
                    )}
                  >
                    {formatCurrency(record.amount, record.currency)}
                  </TableCell>
                  <TableCell>{formatDate(record.economicDate)}</TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">
                    {record.docId && record.lineId
                      ? `${record.docId}/${record.lineId}`
                      : record.docId || record.lineId || '—'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {startIndex + 1} to {Math.min(startIndex + PAGE_SIZE, records.length)} of{' '}
            {records.length} records
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage((p) => p - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-3 text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage((p) => p + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
