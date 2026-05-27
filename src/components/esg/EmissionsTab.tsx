import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface Emission {
  id: string; commodity: string; route: string; scope: string; method: string; gross: number; period: string;
}
interface Credit {
  id: string; type: string; vintage: number; registry: string; volume: number; status: string; retiredAt: string | null;
}
interface Trend { quarter: string; emissions: number; }

export const EmissionsTab = ({ emissions, credits, trend }: { emissions: Emission[]; credits: Credit[]; trend: Trend[] }) => {
  const totalGross = emissions.reduce((s, e) => s + e.gross, 0);
  const totalRetired = credits.filter(c => c.status === 'RETIRED').reduce((s, c) => s + c.volume, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{totalGross.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Gross Emissions (tCO₂e)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{totalRetired.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Credits Retired (tCO₂e)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className={`text-2xl font-bold ${totalGross - totalRetired > 0 ? 'text-orange-500' : 'text-emerald-500'}`}>
              {(totalGross - totalRetired).toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">Net Position (tCO₂e)</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">Quarterly Emissions Trend</CardTitle></CardHeader>
        <CardContent>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="quarter" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Bar dataKey="emissions" fill="hsl(var(--primary))" radius={[4,4,0,0]} name="tCO₂e" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Emissions by Trade Route</CardTitle></CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-medium text-muted-foreground">Commodity</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Route</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Scope</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Method</th>
                <th className="text-right p-3 font-medium text-muted-foreground">tCO₂e</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Period</th>
              </tr>
            </thead>
            <tbody>
              {emissions.map((e) => (
                <tr key={e.id} className="border-b hover:bg-muted/30">
                  <td className="p-3 font-medium">{e.commodity}</td>
                  <td className="p-3">{e.route}</td>
                  <td className="p-3"><Badge variant="outline" className="text-xs">Scope {e.scope}</Badge></td>
                  <td className="p-3 text-xs text-muted-foreground">{e.method}</td>
                  <td className="p-3 text-right font-mono">{e.gross.toLocaleString()}</td>
                  <td className="p-3 text-muted-foreground">{e.period}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Carbon Credits & Offsets</CardTitle></CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-medium text-muted-foreground">Type</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Vintage</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Registry</th>
                <th className="text-right p-3 font-medium text-muted-foreground">Volume</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {credits.map((c) => (
                <tr key={c.id} className="border-b hover:bg-muted/30">
                  <td className="p-3 font-medium">{c.type}</td>
                  <td className="p-3">{c.vintage}</td>
                  <td className="p-3 text-muted-foreground">{c.registry}</td>
                  <td className="p-3 text-right font-mono">{c.volume.toLocaleString()}</td>
                  <td className="p-3">
                    <Badge variant="outline" className={`text-xs ${c.status === 'RETIRED' ? 'bg-emerald-100 text-emerald-800' : ''}`}>{c.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
};
