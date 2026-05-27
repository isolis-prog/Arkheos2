import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface Spread {
  id: string;
  name: string;
  current: number;
  avg30d: number;
  min1y: number;
  max1y: number;
}

export const SpreadBasisTab = ({ spreads, history }: { spreads: Spread[]; history: any[] }) => (
  <div className="space-y-4">
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {spreads.map((s) => (
        <Card key={s.id}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{s.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="text-2xl font-bold text-foreground">{s.current.toFixed(2)}</p>
            <div className="grid grid-cols-3 gap-1 text-xs text-muted-foreground">
              <div>
                <p className="font-medium text-foreground">{s.avg30d.toFixed(2)}</p>
                <p>30d Avg</p>
              </div>
              <div>
                <p className="font-medium text-foreground">{s.min1y.toFixed(2)}</p>
                <p>1Y Min</p>
              </div>
              <div>
                <p className="font-medium text-foreground">{s.max1y.toFixed(2)}</p>
                <p>1Y Max</p>
              </div>
            </div>
            <div className="pt-1">
              <Badge variant={s.current > s.avg30d ? 'default' : 'secondary'} className="text-[10px]">
                {s.current > s.avg30d ? 'Above Avg' : 'Below Avg'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>

    <Card>
      <CardHeader>
        <CardTitle className="text-sm">90-Day Spread History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={history}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={14} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="Henry Hub vs Waha" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Brent vs WTI" stroke="hsl(var(--accent-foreground))" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  </div>
);
