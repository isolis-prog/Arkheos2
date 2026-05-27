import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface CardSkeletonProps {
  count?: number;
  /** Tailwind grid columns class override. Defaults to a responsive 1/2/4 grid. */
  className?: string;
}

/**
 * Skeleton row of KPI-style cards. Cascading delay ensures cards
 * shimmer in sequence rather than all at once.
 */
export function CardSkeleton({ count = 4, className }: CardSkeletonProps) {
  return (
    <div
      className={cn(
        'grid gap-4 md:grid-cols-2 lg:grid-cols-4',
        className,
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        <Card key={`kpi-skel-${i}`}>
          <CardHeader className="pb-2">
            <Skeleton
              className="h-4 w-1/2"
              style={{ animationDelay: `${i * 60}ms` }}
            />
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton
              className="h-8 w-3/4"
              style={{ animationDelay: `${i * 60 + 30}ms` }}
            />
            <Skeleton
              className="h-3 w-2/5"
              style={{ animationDelay: `${i * 60 + 60}ms` }}
            />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default CardSkeleton;
