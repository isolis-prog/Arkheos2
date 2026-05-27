import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';

interface Finding {
  id: string; title: string; severity: string; module: string; desk: string; owner: string; status: string; daysOpen: number;
}

interface TrendPoint { month: string; opened: number; closed: number; }

export const IssueTrackerTab = ({ findings, trend }: { findings: Finding[]; trend: TrendPoint[] }) => {
  const open = findings.filter(f => f.status === 'OPEN' || f.status === 'IN_PROGRESS');
  const bySeverity = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(s => ({
    severity: s,
    count: open.filter(f => f.severity === s).length,
  }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {bySeverity.map((b) => (
          <Card key={b.severity}>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{b.count}</p>
              <p className="text-xs text-muted-foreground">{b.severity}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">Findings Opened vs Closed — 6 Month Trend</CardTitle></CardHeader>
        <CardContent>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Legend />
                <Bar dataKey="opened" fill="hsl(var(--destructive))" radius={[4,4,0,0]} name="Opened" />
                <Bar dataKey="closed" fill="hsl(var(--primary))" radius={[4,4,0,0]} name="Closed" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Open Issues — Aging</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium text-muted-foreground">Finding</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Severity</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Module</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Owner</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Days Open</th>
                </tr>
              </thead>
              <tbody>
                {open.sort((a, b) => b.daysOpen - a.daysOpen).map((f) => (
                  <tr key={f.id} className="border-b hover:bg-muted/30">
                    <td className="p-3 font-medium">{f.title}</td>
                    <td className="p-3"><Badge variant="outline" className="text-xs">{f.severity}</Badge></td>
                    <td className="p-3 text-muted-foreground">{f.module}</td>
                    <td className="p-3">{f.owner}</td>
                    <td className="p-3 text-right font-mono">{f.daysOpen}d</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
