import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useExceptionInsights } from '@/hooks/useAdvancedAnalytics';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line } from 'recharts';

const SEVERITY_COLORS: Record<string, string> = {
  critical: 'hsl(0, 72%, 51%)',
  high: 'hsl(38, 92%, 50%)',
  medium: 'hsl(45, 93%, 47%)',
  low: 'hsl(142, 76%, 36%)',
};

export const ExceptionInsights = () => {
  const { data, isLoading } = useExceptionInsights();

  if (isLoading) {
    return <div className="space-y-4">{Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-64" />)}</div>;
  }

  if (!data) return null;

  const severityData = Object.entries(data.bySeverity).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
    color: SEVERITY_COLORS[name] || SEVERITY_COLORS.medium,
  }));

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* By Severity Pie */}
        <Card>
          <CardHeader><CardTitle className="text-base">Exceptions by Severity</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={severityData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, value }) => `${name}: ${value}`}>
                  {severityData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Monthly Trends */}
        <Card>
          <CardHeader><CardTitle className="text-base">Monthly Opened vs Resolved</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.trends}>
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="opened" fill="hsl(0, 72%, 51%)" name="Opened" radius={[4, 4, 0, 0]} />
                <Bar dataKey="resolved" fill="hsl(142, 76%, 36%)" name="Resolved" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Causes Table */}
      <Card>
        <CardHeader><CardTitle className="text-base">Top Exception Causes</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Break Type</TableHead>
                <TableHead className="text-right">Count</TableHead>
                <TableHead className="text-right">% of Total</TableHead>
                <TableHead className="text-right">Total Amount</TableHead>
                <TableHead className="text-right">Avg Age (days)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.insights.map((row) => (
                <TableRow key={row.breakType}>
                  <TableCell className="font-medium capitalize">{row.breakType}</TableCell>
                  <TableCell className="text-right">{row.count}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline">{row.pctOfTotal}%</Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">${row.totalAmount.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{row.avgAge}d</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
