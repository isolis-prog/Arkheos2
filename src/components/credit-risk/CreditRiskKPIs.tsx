import { Card, CardContent } from '@/components/ui/card';
import { ShieldAlert, TrendingUp, AlertTriangle, Users } from 'lucide-react';

interface Props {
  kpis: {
    totalCounterparties: number;
    totalApprovedLines: number;
    totalNetExposure: number;
    avgUtilization: number;
    breachedLines: number;
    openMarginCalls: number;
    wrongWayFlags: number;
  };
}

export const CreditRiskKPIs = ({ kpis }: Props) => {
  const cards = [
    { label: 'Counterparties', value: kpis.totalCounterparties, icon: Users },
    { label: 'Total Approved Lines', value: `$${(kpis.totalApprovedLines / 1e6).toFixed(0)}M`, icon: TrendingUp },
    { label: 'Net Exposure', value: `$${(kpis.totalNetExposure / 1e6).toFixed(0)}M`, icon: ShieldAlert },
    { label: 'Avg Utilization', value: `${kpis.avgUtilization.toFixed(1)}%`, icon: TrendingUp, warn: kpis.avgUtilization > 70 },
    { label: 'Lines Breached (>90%)', value: kpis.breachedLines, icon: AlertTriangle, warn: kpis.breachedLines > 0 },
    { label: 'Open Margin Calls', value: kpis.openMarginCalls, icon: ShieldAlert, warn: kpis.openMarginCalls > 0 },
    { label: 'Wrong-Way Flags', value: kpis.wrongWayFlags, icon: AlertTriangle, warn: kpis.wrongWayFlags > 0 },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
      {cards.map(c => (
        <Card key={c.label}>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 mb-1">
              <c.icon className={`h-4 w-4 ${c.warn ? 'text-red-500' : 'text-muted-foreground'}`} />
              <p className="text-xs text-muted-foreground truncate">{c.label}</p>
            </div>
            <p className={`text-lg font-bold ${c.warn ? 'text-red-600' : 'text-foreground'}`}>{c.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
