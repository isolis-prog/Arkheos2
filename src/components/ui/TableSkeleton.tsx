import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
  className?: string;
}

/**
 * Skeleton placeholder that mirrors the shape of a data table.
 * Each cell uses a cascading animation delay (`(row + col) * 30ms`)
 * for a wave-like loading effect. Colors come from the design tokens
 * (`bg-muted` via shadcn's `<Skeleton/>`).
 */
export function TableSkeleton({
  rows = 10,
  columns = 6,
  showHeader = true,
  className,
}: TableSkeletonProps) {
  return (
    <div className={className}>
      <Table>
        {showHeader && (
          <TableHeader>
            <TableRow>
              {Array.from({ length: columns }).map((_, c) => (
                <TableHead key={`th-${c}`}>
                  <Skeleton
                    className="h-4 w-24"
                    style={{ animationDelay: `${c * 30}ms` }}
                  />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
        )}
        <TableBody>
          {Array.from({ length: rows }).map((_, r) => (
            <TableRow key={`tr-${r}`}>
              {Array.from({ length: columns }).map((_, c) => (
                <TableCell key={`td-${r}-${c}`}>
                  <Skeleton
                    className="h-4 w-full max-w-[180px]"
                    style={{ animationDelay: `${(r + c) * 30}ms` }}
                  />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default TableSkeleton;
