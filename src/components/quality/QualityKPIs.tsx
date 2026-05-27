import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Clock, AlertTriangle, CheckCircle, TrendingDown } from 'lucide-react';

interface Props {
  kpis: {
    totalClaimValue: number;
    openClaimCount: number;
    avgCycleTimeDays: number;
    certsEvaluated: number;
    certsPending: number;
    totalPenalties: number;
    totalBonuses: number;
    topBreachedSpecs: [string, number][];
  };
}

export const QualityKPIs = ({ kpis }: Props) => {
  const cards = [
    { label: 'Total Claims Value', value: `$${(kpis.totalClaimValue / 1000).toFixed(1)}K`, icon: DollarSign, color: 'text-destructive' },
    { label: 'Open Claims', value: kpis.openClaimCount, icon: AlertTriangle, color: 'text-warning' },
    { label: 'Avg Resolution', value: `${kpis.avgCycleTimeDays}d`, icon: Clock, color: 'text-muted-foreground' },
    { label: 'Certs Evaluated', value: kpis.certsEvaluated, icon: CheckCircle, color: 'text-primary' },
    { label: 'Net Penalties', value: `$${((kpis.totalPenalties - kpis.totalBonuses) / 1000).toFixed(1)}K`, icon: TrendingDown, color: 'text-destructive' },
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
