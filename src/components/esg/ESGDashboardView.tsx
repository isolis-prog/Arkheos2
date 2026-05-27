import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend, PieChart, Pie, Cell } from 'recharts';

interface Props {
  ddCoverage: number; sourcingCoverage: number; totalEmissions: number; retiredCredits: number; overdueDD: number;
  emissionsTrend: { quarter: string; emissions: number }[];
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--destructive))', 'hsl(142,76%,36%)', 'hsl(38,92%,50%)'];

export const ESGDashboardView = ({ ddCoverage, sourcingCoverage, totalEmissions, retiredCredits, overdueDD, emissionsTrend }: Props) => {
  const netEmissions = totalEmissions - retiredCredits;
  const pieData = [
    { name: 'Retired Credits', value: retiredCredits },
    { name: 'Net Emissions', value: Math.max(0, netEmissions) },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">Carbon Position</CardTitle></CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, value }) => `${name}: ${value.toLocaleString()}`}>
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Emissions Trend</CardTitle></CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={emissionsTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="quarter" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Bar dataKey="emissions" fill="hsl(var(--primary))" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm font-medium text-muted-foreground">DD Coverage</p>
            <p className="text-3xl font-bold text-foreground">{ddCoverage}%</p>
            <p className="text-xs text-muted-foreground">{overdueDD > 0 ? `⚠ ${overdueDD} overdue review(s)` : 'All reviews current'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm font-medium text-muted-foreground">Sourcing Coverage</p>
            <p className="text-3xl font-bold text-foreground">{sourcingCoverage}%</p>
            <p className="text-xs text-muted-foreground">Avg across all commodities</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm font-medium text-muted-foreground">Net Carbon Position</p>
            <p className={`text-3xl font-bold ${netEmissions > 0 ? 'text-orange-500' : 'text-emerald-500'}`}>
              {netEmissions.toLocaleString()} tCO₂e
            </p>
            <p className="text-xs text-muted-foreground">Gross minus retired credits</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
