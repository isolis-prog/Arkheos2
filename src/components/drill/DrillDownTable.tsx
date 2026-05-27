import { Fragment, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ChevronsUpDown, ChevronUp } from 'lucide-react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { DrillColumn } from './types';

export type DrillSortDirection = 'asc' | 'desc';

export interface DrillSortState {
  key: string;
  direction: DrillSortDirection;
}

export interface DrillDownTableProps<TRow extends { id: string }> {
  rows: TRow[];
  columns: DrillColumn<TRow>[];
  onRowClick?: (row: TRow) => void;
  expandable?: { render: (row: TRow) => React.ReactNode };
  loading?: boolean;
  emptyState?: React.ReactNode;
  pageSize?: number;
  stickyHeader?: boolean;
  dense?: boolean;
  /**
   * When true, the table assumes pagination + sorting are handled
   * server-side. It will render the rows as-is, hide its own page footer,
   * and surface sort/click changes via the callbacks below.
   */
  serverPagination?: boolean;
  /** Controlled sort state (used when serverPagination is true). */
  sort?: DrillSortState | null;
  onSortChange?: (sort: DrillSortState | null) => void;
}

type SortDirection = 'asc' | 'desc';

function toSortableValue(value: React.ReactNode): string | number {
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string') {
    return value.toLowerCase();
  }
  if (typeof value === 'boolean') {
    return value ? 1 : 0;
  }
  if (value instanceof Date) {
    return value.getTime();
  }
  return String(value ?? '').toLowerCase();
}

function getAlignment(align?: DrillColumn<{ id: string }>['align']) {
  if (align === 'center') return 'text-center';
  if (align === 'right') return 'text-right';
  return 'text-left';
}

function isMono(format?: DrillColumn<{ id: string }>['format']) {
  return format === 'number' || format === 'currency' || format === 'percent';
}

function formatCell<TRow extends { id: string }>(row: TRow, column: DrillColumn<TRow>) {
  const raw = column.accessor(row);
  if (raw === null || raw === undefined || raw === '') {
    return '—';
  }

  if (typeof raw !== 'number' || !column.format || column.format === 'text') {
    return raw;
  }

  if (column.format === 'currency') {
    const currency = typeof (row as Record<string, unknown>).currency === 'string' ? ((row as Record<string, unknown>).currency as string) : 'USD';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(raw);
  }

  if (column.format === 'percent') {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      maximumFractionDigits: 2,
    }).format(raw);
  }

  if (column.format === 'date') {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    }).format(new Date(raw));
  }

  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(raw);
}

export function DrillDownTable<TRow extends { id: string }>({
  rows,
  columns,
  onRowClick,
  expandable,
  loading = false,
  emptyState,
  pageSize = 50,
  stickyHeader = true,
  dense = false,
  serverPagination = false,
  sort: controlledSort = null,
  onSortChange,
}: DrillDownTableProps<TRow>) {
  const reduceMotion = useReducedMotion();
  const [page, setPage] = useState(0);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [internalSort, setInternalSort] = useState<DrillSortState | null>(null);
  const sortState = serverPagination ? controlledSort : internalSort;
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const sortedRows = useMemo(() => {
    // Server mode: rows arrive already sorted/paged from the server, never
    // touch them on the client.
    if (serverPagination) return rows;

    const next = [...rows];
    if (!sortState) {
      return next;
    }

    const column = columns.find((item) => item.key === sortState.key);
    if (!column) {
      return next;
    }

    next.sort((a, b) => {
      const left = toSortableValue(column.accessor(a));
      const right = toSortableValue(column.accessor(b));
      if (left < right) return sortState.direction === 'asc' ? -1 : 1;
      if (left > right) return sortState.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return next;
  }, [columns, rows, serverPagination, sortState]);

  const totalPages = serverPagination
    ? 1
    : Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const currentPage = serverPagination ? 0 : Math.min(page, totalPages - 1);
  const paginatedRows = useMemo(
    () =>
      serverPagination
        ? sortedRows
        : sortedRows.slice(currentPage * pageSize, currentPage * pageSize + pageSize),
    [currentPage, pageSize, serverPagination, sortedRows],
  );

  const virtualized = paginatedRows.length > 200;
  const columnTemplate = columns.map((column) => (typeof column.width === 'number' ? `${column.width}px` : column.width ?? 'minmax(0, 1fr)')).join(' ');

  const rowVirtualizer = useVirtualizer({
    count: virtualized ? paginatedRows.length : 0,
    estimateSize: () => (dense ? 48 : 60),
    getScrollElement: () => scrollRef.current,
    overscan: 8,
  });

  const handleSort = (column: DrillColumn<TRow>) => {
    if (!column.sortable) return;
    const compute = (current: DrillSortState | null): DrillSortState | null => {
      if (!current || current.key !== column.key) {
        return { key: column.key, direction: 'asc' };
      }
      if (current.direction === 'asc') {
        return { key: column.key, direction: 'desc' };
      }
      return null;
    };

    if (serverPagination) {
      onSortChange?.(compute(sortState));
    } else {
      setInternalSort(compute);
    }
  };

  const handleRowAction = (row: TRow) => {
    setSelectedRowId(row.id);
    onRowClick?.(row);
  };

  const toggleExpansion = (rowId: string) => {
    setExpandedRowId((current) => (current === rowId ? null : rowId));
  };

  if (loading) {
    return (
      <div className="rounded-lg border bg-card">
        <div className="space-y-3 p-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-12 w-full rounded-md" />
          ))}
        </div>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="flex min-h-[240px] flex-col items-center justify-center rounded-lg border border-dashed bg-card p-8 text-center text-muted-foreground">
        {emptyState ?? <div className="space-y-2"><p className="text-base font-medium text-foreground">No rows found</p><p className="text-sm">Adjust the scope to drill into another slice.</p></div>}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-lg border bg-card">
        {virtualized ? (
          <div>
            <div
              className={cn('grid border-b bg-muted/50 text-sm font-medium text-muted-foreground', stickyHeader && 'sticky top-0 z-10')}
              style={{ gridTemplateColumns: `${expandable ? '52px ' : ''}${columnTemplate}` }}
            >
              {expandable && <div className="px-3 py-3" />}
              {columns.map((column) => (
                <button
                  key={column.key}
                  type="button"
                  onClick={() => handleSort(column)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-3',
                    getAlignment(column.align),
                    !column.sortable && 'cursor-default',
                    column.align === 'right' && 'justify-end',
                    column.align === 'center' && 'justify-center',
                  )}
                >
                  <span>{column.header}</span>
                  {column.sortable &&
                    (sortState?.key === column.key
                      ? sortState.direction === 'asc'
                        ? <ChevronUp className="h-4 w-4 shrink-0" />
                        : <ChevronDown className="h-4 w-4 shrink-0" />
                      : <ChevronsUpDown className="h-4 w-4 shrink-0" />)}
                </button>
              ))}
            </div>
            <div ref={scrollRef} className="max-h-[32rem] overflow-auto">
              <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }}>
                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                  const row = paginatedRows[virtualRow.index];
                  const expanded = expandedRowId === row.id;
                  return (
                    <div
                      key={row.id}
                      ref={rowVirtualizer.measureElement}
                      data-index={virtualRow.index}
                      className={cn(
                        'absolute left-0 top-0 w-full border-b transition-colors hover:bg-muted/50',
                        selectedRowId === row.id && 'ring-2 ring-primary ring-inset',
                      )}
                      style={{ transform: `translateY(${virtualRow.start}px)` }}
                    >
                      <div
                        className="grid items-center"
                        style={{ gridTemplateColumns: `${expandable ? '52px ' : ''}${columnTemplate}` }}
                      >
                        {expandable && (
                          <button
                            type="button"
                            onClick={() => toggleExpansion(row.id)}
                            className="flex h-full items-center justify-center px-2 text-muted-foreground transition-colors hover:text-foreground"
                            aria-label={expanded ? 'Collapse row' : 'Expand row'}
                          >
                            <ChevronDown className={cn('h-4 w-4 transition-transform', expanded && 'rotate-180')} />
                          </button>
                        )}
                        {columns.map((column) => (
                          <button
                            key={column.key}
                            type="button"
                            onClick={() => handleRowAction(row)}
                            className={cn(
                              'min-h-[3rem] px-4 py-3',
                              getAlignment(column.align),
                              isMono(column.format) && 'font-mono',
                              dense && 'py-2 text-xs',
                            )}
                          >
                            {formatCell(row, column)}
                          </button>
                        ))}
                      </div>
                      <AnimatePresence initial={false}>
                        {expanded && expandable && (
                          <motion.div
                            initial={reduceMotion ? false : { height: 0, opacity: 0 }}
                            animate={reduceMotion ? { height: 'auto', opacity: 1 } : { height: 'auto', opacity: 1 }}
                            exit={reduceMotion ? { height: 0, opacity: 0 } : { height: 0, opacity: 0 }}
                            className="overflow-hidden border-t bg-background"
                          >
                            <div className="p-4">{expandable.render(row)}</div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <Table>
            <TableHeader className={cn(stickyHeader && 'sticky top-0 z-10 bg-card')}>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                {expandable && <TableHead className="w-[52px]" />}
                {columns.map((column) => (
                  <TableHead
                    key={column.key}
                    className={cn(getAlignment(column.align), stickyHeader && 'bg-muted/50')}
                    style={{ width: typeof column.width === 'number' ? `${column.width}px` : column.width }}
                  >
                    <button
                      type="button"
                      onClick={() => handleSort(column)}
                      className={cn(
                        'flex w-full items-center gap-2',
                        getAlignment(column.align),
                        column.align === 'right' && 'justify-end',
                        column.align === 'center' && 'justify-center',
                        !column.sortable && 'cursor-default',
                      )}
                    >
                      <span>{column.header}</span>
                      {column.sortable &&
                        (sortState?.key === column.key
                          ? sortState.direction === 'asc'
                            ? <ChevronUp className="h-4 w-4 shrink-0" />
                            : <ChevronDown className="h-4 w-4 shrink-0" />
                          : <ChevronsUpDown className="h-4 w-4 shrink-0" />)}
                    </button>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedRows.map((row) => {
                const expanded = expandedRowId === row.id;
                return (
                  <Fragment key={row.id}>
                    <TableRow
                      className={cn(
                        onRowClick && 'cursor-pointer',
                        selectedRowId === row.id && 'ring-2 ring-primary ring-inset',
                      )}
                    >
                      {expandable && (
                        <TableCell className="w-[52px] px-2">
                          <button
                            type="button"
                            onClick={() => toggleExpansion(row.id)}
                            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                            aria-label={expanded ? 'Collapse row' : 'Expand row'}
                          >
                            <ChevronDown className={cn('h-4 w-4 transition-transform', expanded && 'rotate-180')} />
                          </button>
                        </TableCell>
                      )}
                      {columns.map((column) => (
                        <TableCell
                          key={column.key}
                          className={cn(getAlignment(column.align), isMono(column.format) && 'font-mono', dense && 'py-2 text-xs')}
                          onClick={() => handleRowAction(row)}
                        >
                          {formatCell(row, column)}
                        </TableCell>
                      ))}
                    </TableRow>
                    {expandable && (
                      <TableRow className="hover:bg-transparent">
                        <TableCell colSpan={columns.length + 1} className="p-0">
                          <AnimatePresence initial={false}>
                            {expanded && (
                              <motion.div
                                initial={reduceMotion ? false : { height: 0, opacity: 0 }}
                                animate={reduceMotion ? { height: 'auto', opacity: 1 } : { height: 'auto', opacity: 1 }}
                                exit={reduceMotion ? { height: 0, opacity: 0 } : { height: 0, opacity: 0 }}
                                className="overflow-hidden border-t bg-background"
                              >
                                <div className="p-4">{expandable.render(row)}</div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
      {!serverPagination && (
        <div className="flex flex-col gap-3 rounded-lg border bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Showing <span className="font-medium text-foreground">{Math.min(sortedRows.length, currentPage * pageSize + 1)}</span> to{' '}
            <span className="font-medium text-foreground">{Math.min(sortedRows.length, (currentPage + 1) * pageSize)}</span> of{' '}
            <span className="font-medium text-foreground">{sortedRows.length}</span>
          </p>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Button variant="outline" size="icon" onClick={() => setPage(0)} disabled={currentPage === 0} aria-label="First page">
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => setPage((value) => Math.max(0, value - 1))} disabled={currentPage === 0} aria-label="Previous page">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[7rem] text-center text-sm text-muted-foreground">
              Page <span className="font-medium text-foreground">{currentPage + 1}</span> / {totalPages}
            </span>
            <Button variant="outline" size="icon" onClick={() => setPage((value) => Math.min(totalPages - 1, value + 1))} disabled={currentPage >= totalPages - 1} aria-label="Next page">
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => setPage(totalPages - 1)} disabled={currentPage >= totalPages - 1} aria-label="Last page">
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
