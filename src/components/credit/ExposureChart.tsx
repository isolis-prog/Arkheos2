import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import type { ExposureSnapshot } from '@/hooks/useCreditExposure';

interface Props {
  snapshots: ExposureSnapshot[];
}

export const ExposureChart = ({ snapshots }: Props) => {
  const sorted = [...snapshots].sort((a, b) => b.netExposure - a.netExposure);
  const data = sorted.map(s => ({
    name: s.counterparty.split(' ')[0],
    exposure: Math.round(s.netExposure / 1e6 * 10) / 10,
    limit: s.limitAmount ? Math.round(s.limitAmount / 1e6 * 10) / 10 : 0,
    breach: (s.utilisationPct || 0) > 100,
    warning: (s.utilisationPct || 0) >= 80,
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Exposure vs Limit ($M)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v: number) => `$${v}M`} />
            <Bar dataKey="exposure" radius={[4, 4, 0, 0]}>
              {data.map((d, i) => (
                <Cell key={i} fill={d.breach ? 'hsl(var(--destructive))' : d.warning ? '#eab308' : 'hsl(var(--primary))'} />
              ))}
            </Bar>
            <Bar dataKey="limit" fill="hsl(var(--muted-foreground))" opacity={0.25} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
