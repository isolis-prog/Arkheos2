import { BarChart3, Info } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useVaRDashboard } from '@/hooks/usePositionRisk';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip as RTooltip, CartesianGrid, BarChart, Bar } from 'recharts';

const VaRDashboard = () => {
  const { result, confidence, setConfidence, horizon, setHorizon } = useVaRDashboard();
  const fmtUsd = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Value at Risk Dashboard"
        description="Parametric VaR — maximum expected loss under normal market conditions"
      />

      {/* Disclaimer */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          VaR is a statistical estimate, not a guarantee of maximum loss. Actual losses may exceed VaR under extreme market conditions.
        </AlertDescription>
      </Alert>

      {/* Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Confidence Level</label>
              <Select value={String(confidence)} onValueChange={(v) => setConfidence(Number(v))}>
                <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="95">95%</SelectItem>
                  <SelectItem value="99">99%</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Time Horizon</label>
              <Select value={String(horizon)} onValueChange={(v) => setHorizon(Number(v))}>
                <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1-Day</SelectItem>
                  <SelectItem value="5">5-Day</SelectItem>
                  <SelectItem value="10">10-Day</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Tooltip>
              <TooltipTrigger>
                <Badge variant="outline" className="cursor-help">
                  <Info className="h-3 w-3 mr-1" /> What is Parametric VaR?
                </Badge>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-sm">
                  Parametric VaR estimates the maximum loss over a given time horizon at a given confidence level,
                  using the variance-covariance method. It assumes normally distributed returns and uses
                  position sizes, price volatilities, and correlations between commodities.
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
        </CardContent>
      </Card>

      {/* Primary VaR Card */}
      <Card className="border-2 border-primary/20">
        <CardContent className="py-8 text-center">
          <p className="text-sm text-muted-foreground uppercase font-medium">
            {horizon}-Day VaR at {confidence}% confidence
          </p>
          <p className="text-4xl font-bold text-red-500 mt-2">{fmtUsd(result.totalVaR)}</p>
        </CardContent>
      </Card>

      {/* VaR by Commodity */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">VaR by Commodity</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Commodity</TableHead>
                  <TableHead className="text-right">Component VaR</TableHead>
                  <TableHead className="text-right">% of Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.byComponent.map((c) => (
                  <TableRow key={c.commodity}>
                    <TableCell className="font-medium">{c.commodity}</TableCell>
                    <TableCell className="text-right text-red-500">{fmtUsd(c.var)}</TableCell>
                    <TableCell className="text-right">{((c.var / result.totalVaR) * 100).toFixed(1)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">VaR Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={result.byComponent}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="commodity" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(v) => `$${(v / 1e6).toFixed(1)}M`} tick={{ fontSize: 11 }} />
                <RTooltip formatter={(v: number) => fmtUsd(v)} />
                <Bar dataKey="var" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* 90-day Time Series */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">VaR Evolution — Last 90 Days</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={result.timeSeries}>
              <defs>
                <linearGradient id="varGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--destructive))" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={14} />
              <YAxis tickFormatter={(v) => `$${(v / 1e6).toFixed(1)}M`} tick={{ fontSize: 11 }} />
              <RTooltip formatter={(v: number) => fmtUsd(v)} />
              <Area dataKey="var" stroke="hsl(var(--destructive))" fill="url(#varGrad)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* V2 Placeholders */}
      <Card className="opacity-60">
        <CardContent className="py-8 text-center space-y-2">
          <p className="text-lg font-medium text-muted-foreground">Coming in v2</p>
          <div className="flex flex-wrap gap-2 justify-center">
            <Badge variant="outline">Monte Carlo VaR</Badge>
            <Badge variant="outline">Historical Simulation VaR</Badge>
            <Badge variant="outline">Live Volatility Feed</Badge>
            <Badge variant="outline">Options Greeks (Delta, Gamma, Vega)</Badge>
            <Badge variant="outline">Stress Testing Scenarios</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VaRDashboard;
