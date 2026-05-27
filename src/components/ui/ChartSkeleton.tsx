import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface ChartSkeletonProps {
  /** Pixel height of the chart placeholder. Default 300. */
  height?: number;
  /** Number of vertical "bars" rendered to hint at a chart shape. Default 12. */
  bars?: number;
  /** Optional title placeholder. */
  showHeader?: boolean;
  className?: string;
}

/**
 * Placeholder mimicking a recharts area/bar chart while data loads.
 * Renders pseudo-bars with cascading animation delays using design-token
 * colors (`bg-muted`) — no literal colors.
 */
export function ChartSkeleton({
  height = 300,
  bars = 12,
  showHeader = true,
  className,
}: ChartSkeletonProps) {
  return (
    <Card className={className}>
      {showHeader && (
        <CardHeader className="pb-2">
          <Skeleton className="h-4 w-1/3" />
        </CardHeader>
      )}
      <CardContent>
        <div
          className={cn('relative w-full overflow-hidden')}
          style={{ height }}
        >
          {/* Horizontal grid lines */}
          <div className="absolute inset-0 flex flex-col justify-between py-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={`grid-${i}`}
                className="h-px w-full bg-border/60"
              />
            ))}
          </div>

          {/* Pseudo bars */}
          <div className="absolute inset-0 flex items-end gap-2 px-2 pb-2">
            {Array.from({ length: bars }).map((_, i) => {
              // Deterministic pseudo-random heights between 30% and 95%
              const h = 30 + ((i * 37) % 65);
              return (
                <Skeleton
                  key={`bar-${i}`}
                  className="flex-1 rounded-sm"
                  style={{
                    height: `${h}%`,
                    animationDelay: `${i * 50}ms`,
                  }}
                />
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default ChartSkeleton;
