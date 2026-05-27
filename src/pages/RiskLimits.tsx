import { Shield, AlertTriangle, Info } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { AIRiskPrediction } from '@/components/ail/AIRiskPrediction';
import { useRiskLimits } from '@/hooks/usePositionRisk';

const statusColors: Record<string, string> = {
  green: 'bg-emerald-500',
  amber: 'bg-amber-500',
  red: 'bg-red-500',
  critical: 'bg-red-700 animate-pulse',
};

const statusBadge: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  green: 'secondary',
  amber: 'outline',
  red: 'destructive',
  critical: 'destructive',
};

const RiskLimits = () => {
  const { limits, cftcLimits } = useRiskLimits();
  const fmtNum = (n: number) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n);

  const sorted = [...limits].sort((a, b) => b.utilizationPct - a.utilizationPct);
  const breached = limits.filter((l) => l.status === 'critical').length;
  const warning = limits.filter((l) => l.status === 'red' || l.status === 'amber').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Risk Limits Engine"
        description="Define, monitor, and alert on position and risk limits — internal and CFTC regulatory"
      />

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-xs font-medium text-muted-foreground uppercase">Total Limits</p>
            <p className="text-2xl font-bold mt-1">{limits.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-xs font-medium text-muted-foreground uppercase">Breached</p>
            <p className="text-2xl font-bold mt-1 text-red-600">{breached}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-xs font-medium text-muted-foreground uppercase">Warning / Elevated</p>
            <p className="text-2xl font-bold mt-1 text-amber-500">{warning}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-xs font-medium text-muted-foreground uppercase">Healthy</p>
            <p className="text-2xl font-bold mt-1 text-emerald-600">{limits.filter((l) => l.status === 'green').length}</p>
          </CardContent>
        </Card>
      </div>

      {/* AI Risk Forecast */}
      <AIRiskPrediction riskData={{ limits, breached, warning }} />

      {/* Limit Monitor Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sorted.map((l) => (
          <Card key={l.id} className={l.status === 'critical' ? 'border-red-500 border-2' : ''}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">{l.limitName}</CardTitle>
                <Badge variant={statusBadge[l.status]}>
                  {l.status === 'critical' ? '⚠ BREACHED' : l.status.toUpperCase()}
                </Badge>
              </div>
              <CardDescription className="text-xs">
                {l.scopeCommodity || l.scopeDesk || l.scopeCounterparty || 'Global'} • Owner: {l.ownerName}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Current: {fmtNum(l.currentExposure)} {l.unit}</span>
                <span>Limit: {fmtNum(l.limitValue)} {l.unit}</span>
              </div>
              <Progress value={Math.min(l.utilizationPct, 100)} className="h-2" />
              <p className="text-xs text-right font-semibold">{l.utilizationPct.toFixed(1)}% utilized</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* CFTC Reference Limits */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <CardTitle className="text-lg">CFTC Federal Position Limits — Read Only</CardTitle>
          </div>
          <CardDescription>
            Reference values only. Verify current limits at{' '}
            <a href="https://www.cftc.gov" target="_blank" rel="noopener noreferrer" className="underline text-primary">
              cftc.gov
            </a>{' '}
            before reliance.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <Info className="h-4 w-4" />
            <AlertDescription>
              CFTC limits shown are reference values as of Q1 2025. Verify current limits at cftc.gov before reliance.
            </AlertDescription>
          </Alert>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Limit</TableHead>
                <TableHead className="text-right">Value</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Note</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cftcLimits.map((l, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{l.name}</TableCell>
                  <TableCell className="text-right">{fmtNum(l.value)}</TableCell>
                  <TableCell>{l.unit}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{l.note}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* V2 Placeholders */}
      <Card className="opacity-60">
        <CardContent className="py-8 text-center space-y-2">
          <p className="text-lg font-medium text-muted-foreground">Coming in v2</p>
          <div className="flex flex-wrap gap-2 justify-center">
            <Badge variant="outline">Automated CFTC Form 102 / Form 40</Badge>
            <Badge variant="outline">Stress Testing Scenarios</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RiskLimits;
