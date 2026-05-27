import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

interface PnLByBookChartProps {
  data: { book: string; pnl: number; volatility: number }[];
  isLoading: boolean;
}

export const PnLByBookChart = ({ data, isLoading }: PnLByBookChartProps) => {
  const fmt = (value: number) => {
    const abs = Math.abs(value);
    if (abs >= 1_000_000) return `${value >= 0 ? '' : '-'}$${(abs / 1_000_000).toFixed(1)}M`;
    if (abs >= 1_000) return `${value >= 0 ? '' : '-'}$${(abs / 1_000).toFixed(0)}K`;
    return `${value >= 0 ? '' : '-'}$${abs.toFixed(0)}`;
  };

  if (isLoading) {
    return <Card><CardHeader><CardTitle>PnL by Book</CardTitle></CardHeader><CardContent><Skeleton className="h-[300px] w-full" /></CardContent></Card>;
  }

  if (data.length === 0) {
    return <Card><CardHeader><CardTitle className="text-lg">PnL by Book</CardTitle></CardHeader><CardContent><div className="flex items-center justify-center h-[300px] text-muted-foreground">No data</div></CardContent></Card>;
  }

  const topVolatile = [...data].sort((a, b) => b.volatility - a.volatility).slice(0, 3);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">PnL by Book / Portfolio</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
              <XAxis type="number" tickFormatter={fmt} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="book" tick={{ fontSize: 12 }} width={75} />
              <Tooltip
                formatter={(value: number) => [fmt(value), 'PnL']}
                contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
              />
              <Bar dataKey="pnl" radius={[0, 4, 4, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? 'hsl(var(--chart-2))' : 'hsl(var(--destructive))'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        {topVolatile.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Top Volatile Books</p>
            <div className="flex flex-wrap gap-2">
              {topVolatile.map((b) => (
                <Badge key={b.book} variant="outline" className="text-xs border-warning text-warning">
                  {b.book}: σ {fmt(b.volatility)}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
