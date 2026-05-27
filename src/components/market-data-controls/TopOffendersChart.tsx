import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Props { offenders: { indexName: string; breaches: number; maxDiff: number }[]; }

export const TopOffendersChart = ({ offenders }: Props) => (
  <Card>
    <CardHeader><CardTitle>Top Offenders — Breach Count by Index</CardTitle></CardHeader>
    <CardContent>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={offenders} layout="vertical" margin={{ left: 100 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis type="number" className="fill-muted-foreground" tick={{ fontSize: 12 }} />
            <YAxis type="category" dataKey="indexName" className="fill-muted-foreground" tick={{ fontSize: 12 }} width={90} />
            <Tooltip />
            <Bar dataKey="breaches" name="Breaches" fill="hsl(var(--destructive))" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </CardContent>
  </Card>
);
