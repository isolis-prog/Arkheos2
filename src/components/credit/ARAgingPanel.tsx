import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { ExposureSnapshot } from '@/hooks/useCreditExposure';

interface Props {
  snapshots: ExposureSnapshot[];
}

const fmt = (n: number) => `$${(n / 1e6).toFixed(1)}M`;

export const ARAgingPanel = ({ snapshots }: Props) => {
  const aggregated = snapshots.reduce(
    (acc, s) => ({
      current: acc.current + s.arAging.current,
      '30d': acc['30d'] + s.arAging.days30,
      '60d': acc['60d'] + s.arAging.days60,
      '90d': acc['90d'] + s.arAging.days90,
      '90d+': acc['90d+'] + s.arAging.days90plus,
    }),
    { current: 0, '30d': 0, '60d': 0, '90d': 0, '90d+': 0 }
  );

  const data = Object.entries(aggregated).map(([bucket, value]) => ({
    bucket,
    value: Math.round(value / 1e6 * 10) / 10,
  }));

  const colors = ['hsl(var(--primary))', 'hsl(var(--primary))', '#eab308', 'hsl(var(--destructive))', 'hsl(var(--destructive))'];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">AR Aging Breakdown ($M)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <XAxis dataKey="bucket" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v: number) => `$${v}M`} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]} fill="hsl(var(--primary))">
              {data.map((_, i) => (
                <Cell key={i} fill={colors[i]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
