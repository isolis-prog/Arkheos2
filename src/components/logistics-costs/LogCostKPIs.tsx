import { Card, CardContent } from '@/components/ui/card';
import { DollarSign, AlertTriangle, Anchor, TrendingUp, Clock } from 'lucide-react';

interface Props {
  kpis: {
    totalExpected: number;
    totalActual: number;
    totalLeakage: number;
    recoveredLeakage: number;
    totalDemurrage: number;
    totalDespatch: number;
    avgDemurrageDays: number;
    openDisputes: number;
  };
}

export const LogCostKPIs = ({ kpis }: Props) => {
  const fmt = (n: number) => n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : `$${(n / 1_000).toFixed(0)}K`;
  const cards = [
    { label: 'Total Leakage', value: fmt(kpis.totalLeakage), icon: TrendingUp, color: 'text-destructive' },
    { label: 'Recovered', value: fmt(kpis.recoveredLeakage), icon: DollarSign, color: 'text-primary' },
    { label: 'Demurrage Exposure', value: fmt(kpis.totalDemurrage), icon: Anchor, color: 'text-warning' },
    { label: 'Avg Dem. Days', value: `${kpis.avgDemurrageDays}d`, icon: Clock, color: 'text-muted-foreground' },
    { label: 'Open Disputes', value: kpis.openDisputes, icon: AlertTriangle, color: 'text-destructive' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {cards.map(c => (
        <Card key={c.label}>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 mb-1">
              <c.icon className={`h-4 w-4 ${c.color}`} />
              <span className="text-xs text-muted-foreground">{c.label}</span>
            </div>
            <p className="text-2xl font-bold">{c.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
